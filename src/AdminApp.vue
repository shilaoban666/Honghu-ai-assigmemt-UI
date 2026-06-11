<template>
  <div v-if="!adminAuthenticated" class="admin-login-page">
    <form class="admin-login-panel" @submit.prevent="submitAdminLogin">
      <div class="admin-login-brand">
        <div class="brand-mark">H</div>
        <div>
          <strong>Honghu Admin</strong>
          <span>企业模型成本后台</span>
        </div>
      </div>
      <h1>管理员登录</h1>
      <p>后台接口需要管理员账号登录后才能访问。登录成功后会自动注入 Authorization Bearer Token。</p>
      <div v-if="loginError" class="form-error">{{ loginError }}</div>
      <label class="login-field">
        <span>用户名</span>
        <input v-model.trim="loginForm.username" autocomplete="username" placeholder="admin username" />
      </label>
      <label class="login-field">
        <span>密码</span>
        <input v-model="loginForm.password" autocomplete="current-password" type="password" placeholder="password" />
      </label>
      <button class="admin-btn login-submit" type="submit" :disabled="loginLoading">
        {{ loginLoading ? '登录中...' : '登录后台' }}
      </button>
    </form>
  </div>

  <div v-else class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-brand">
        <div class="brand-mark">H</div>
        <div>
          <strong>Honghu Admin</strong>
          <span>Billing & Quota</span>
        </div>
      </div>

      <nav class="admin-nav">
        <button
          v-for="item in navItems"
          :key="item.path"
          :class="['admin-nav-item', { active: route.section === item.section }]"
          @click="go(item.path)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="admin-auth-box">
        <label>当前管理员</label>
        <strong>{{ adminProfile?.username || 'ADMIN' }}</strong>
        <p class="mono">{{ adminProfile?.userId || adminUserIdInput || '-' }}</p>
        <button class="admin-btn ghost full" @click="logoutAdmin">退出登录</button>
      </div>
    </aside>

    <main class="admin-main">
      <header class="admin-topbar">
        <div>
          <p class="admin-kicker">企业级模型成本后台</p>
          <h1>{{ topbarTitle }}</h1>
        </div>
        <div class="topbar-actions">
          <button class="admin-btn ghost" @click="reloadCurrent">刷新</button>
          <button class="admin-btn" @click="go('/admin/dashboard')">仪表盘</button>
        </div>
      </header>

      <div v-if="toast" :class="['admin-toast', toast.type]">
        <span>{{ toast.message }}</span>
        <button @click="toast = null">关闭</button>
      </div>

      <section v-if="route.section === 'dashboard'" class="admin-page">
        <div class="metric-grid">
          <div class="metric-card">
            <span>今日调用次数</span>
            <strong>{{ formatNumber(dashboard.todayCalls) }}</strong>
            <small>SUCCESS / FAILED / BLOCKED 总调用</small>
          </div>
          <div class="metric-card">
            <span>今日标准 Token</span>
            <strong>{{ compactNumber(dashboard.todayStandardTokens) }}</strong>
            <small>{{ formatCny(dashboard.todayCost, 4) }} 已计费成本</small>
          </div>
          <div class="metric-card">
            <span>今日原始 Token</span>
            <strong>{{ compactNumber(dashboard.todayTokens) }}</strong>
            <small>Prompt + Completion</small>
          </div>
          <div class="metric-card">
            <span>失败率</span>
            <strong>{{ formatPercent(dashboard.failureRate) }}</strong>
            <small>非 SUCCESS 状态占比</small>
          </div>
          <div class="metric-card danger">
            <span>配额触顶用户</span>
            <strong>{{ dashboard.blockedUserCount }}</strong>
            <small>今日 BLOCKED_BY_QUOTA 去重</small>
          </div>
        </div>

        <div class="dashboard-hero-grid">
          <section class="admin-panel">
            <div class="panel-head">
              <div>
                <h2>今日消耗概览</h2>
                <p>标准 Token、调用状态和模型成本联动</p>
              </div>
            </div>
            <div class="dashboard-chart-row">
              <AdminChart :option="barOption(dashboard.topModels, 'dimension', 'standardTokens', 'Top 模型标准 Token')" :height="300" />
              <AdminChart :option="pieOption(dashboardStatusRows, 'dimension', 'count', '调用状态')" :height="300" />
            </div>
          </section>

          <section class="admin-panel">
            <div class="panel-head">
              <div>
                <h2>成本与 Token 对照</h2>
                <p>同一模型的标准 Token 与金额成本</p>
              </div>
            </div>
            <div class="dashboard-chart-row">
              <AdminChart :option="pieOption(dashboard.aggregate, 'dimension', 'standardTokens', '标准 Token 占比')" :height="300" />
              <AdminChart :option="barOption(dashboard.aggregate, 'dimension', 'cost', '金额成本', true)" :height="300" />
            </div>
          </section>

          <section class="admin-panel dashboard-health-panel">
            <div class="panel-head">
              <div>
                <h2>运行健康度</h2>
                <p>失败率和配额拦截比例，用于快速发现异常</p>
              </div>
            </div>
            <div class="dashboard-health-grid">
              <AdminChart :option="gaugeOption(dashboardFailurePercent, '失败率')" :height="220" />
              <AdminChart :option="gaugeOption(dashboardBlockedPercent, '配额拦截')" :height="220" />
            </div>
          </section>

          <section class="admin-panel">
            <div class="panel-head">
              <div>
                <h2>今日模型聚合</h2>
                <p>调用量、Token 和成本</p>
              </div>
            </div>
            <DataState :loading="loading.dashboard" :error="errors.dashboard" @retry="loadDashboard">
              <table class="admin-table compact">
                <thead>
                  <tr>
                    <th>模型</th>
                    <th>调用</th>
                    <th>标准 Token</th>
                    <th>原始 Token</th>
                    <th>费用</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in dashboard.aggregate" :key="dimensionOf(row)">
                    <td class="mono">{{ dimensionOf(row) }}</td>
                    <td>{{ formatNumber(row.calls) }}</td>
                    <td>{{ compactNumber(standardTokensOf(row)) }}</td>
                    <td>{{ compactNumber(row.tokens) }}</td>
                    <td>{{ formatCny(row.cost, 4) }}</td>
                  </tr>
                </tbody>
              </table>
              <EmptyState v-if="dashboard.aggregate.length === 0" text="暂无聚合数据" />
            </DataState>
          </section>
        </div>
      </section>

      <section v-else-if="route.section === 'models' && !route.id" class="admin-page">
        <div class="page-tools">
          <div class="tool-title">
            <h2>模型目录</h2>
            <span>{{ models.length }} 个模型，包含 disabled</span>
          </div>
          <button class="admin-btn" @click="openModelCreate">新增模型</button>
        </div>

        <div class="metric-grid compact-metrics">
          <div class="metric-card">
            <span>模型总数</span>
            <strong>{{ formatNumber(modelStats.total) }}</strong>
            <small>{{ formatNumber(modelStats.enabled) }} 个启用，{{ formatNumber(modelStats.disabled) }} 个禁用</small>
          </div>
          <div class="metric-card">
            <span>当前价格覆盖</span>
            <strong>{{ formatPercent(modelStats.pricedRate) }}</strong>
            <small>{{ formatNumber(modelStats.priced) }} 个已有活跃价格</small>
          </div>
          <div class="metric-card danger">
            <span>缺当前价格</span>
            <strong>{{ formatNumber(modelStats.missingPricing) }}</strong>
            <small>这些模型调用时会触发 PRICING_NOT_CONFIGURED</small>
          </div>
          <div class="metric-card">
            <span>平均输出价</span>
            <strong>{{ formatCny(modelStats.avgCompletion, 2) }}</strong>
            <small>按已配置当前价格模型计算 / 百万 Token</small>
          </div>
        </div>

        <div class="admin-grid three chart-grid model-health-grid">
          <section class="admin-panel chart-panel">
            <div class="panel-head">
              <div>
                <h2>Provider 分布</h2>
                <p>模型供应商目录结构</p>
              </div>
            </div>
            <AdminChart :option="pieOption(modelProviderRows, 'dimension', 'count', 'Provider')" :height="260" />
          </section>
          <section class="admin-panel chart-panel">
            <div class="panel-head">
              <div>
                <h2>价格健康度</h2>
                <p>只统计当前正在生效的价格</p>
              </div>
            </div>
            <AdminChart :option="pieOption(modelPriceStatusRows, 'dimension', 'count', '价格状态')" :height="260" />
          </section>
          <section class="admin-panel chart-panel">
            <div class="panel-head">
              <div>
                <h2>Level 分布</h2>
                <p>高级模型和基础模型占比</p>
              </div>
            </div>
            <AdminChart :option="barOption(modelLevelRows, 'dimension', 'count', '模型 Level')" :height="260" />
          </section>
        </div>

        <section class="admin-panel">
          <DataState :loading="loading.models" :error="errors.models" @retry="loadModels">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>模型编码</th>
                  <th>展示名</th>
                  <th>Provider</th>
                  <th>Level</th>
                  <th>Score</th>
                  <th>能力</th>
                  <th>状态</th>
                  <th>当前价格</th>
                  <th>24h 调用</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in models" :key="modelCodeOf(row)">
                  <td class="mono strong">{{ modelCodeOf(row) }}</td>
                  <td>{{ modelOf(row).displayName || '-' }}</td>
                  <td>{{ modelOf(row).providerCode || '-' }}</td>
                  <td>{{ modelOf(row).level ?? '-' }}</td>
                  <td>{{ modelOf(row).score ?? '-' }}</td>
                  <td>
                    <div class="chip-row">
                      <span :class="['admin-chip', modelOf(row).localModel ? 'green' : 'gray']">{{ modelOf(row).localModel ? '本地' : '云端' }}</span>
                      <span :class="['admin-chip', modelOf(row).supportsStream ? 'blue' : 'gray']">{{ modelOf(row).supportsStream ? '流式' : '非流式' }}</span>
                    </div>
                  </td>
                  <td><StatusPill :ok="enabledOf(row) !== false" :text="enabledOf(row) === false ? '禁用' : '启用'" /></td>
                  <td>
                    <div v-if="pricingOf(row)" class="price-cell">
                      <div class="price-cell-head">
                        <span class="admin-chip green">{{ pricingOf(row).currency || 'CNY' }}</span>
                        <small>倍率 {{ pricingOf(row).markupRatio ?? 1 }}</small>
                      </div>
                      <div class="price-lines">
                        <span>入 {{ formatCny(pricingOf(row).promptPricePerMillion, 4) }}</span>
                        <span>出 {{ formatCny(pricingOf(row).completionPricePerMillion, 4) }}</span>
                      </div>
                      <small class="price-meta">生效 {{ formatDateShort(pricingOf(row).effectiveFrom) }}</small>
                    </div>
                    <div v-else class="price-missing">
                      <span class="admin-chip red">缺当前价格</span>
                      <small>{{ pricingStatusText(row) }}</small>
                      <button class="text-btn danger" @click="openPricingCreate(modelCodeOf(row))">新增价格</button>
                    </div>
                  </td>
                  <td>{{ formatNumber(last24hCallsOf(row)) }}</td>
                  <td>
                    <div class="table-actions">
                      <button class="text-btn" @click="go(`/admin/models/${encodeURIComponent(modelCodeOf(row))}`)">详情</button>
                      <button class="text-btn" @click="openModelEdit(row)">编辑</button>
                      <button class="text-btn" @click="toggleModel(row)">{{ enabledOf(row) === false ? '启用' : '禁用' }}</button>
                      <button class="text-btn danger" @click="hardDeleteModel(row)">硬删除</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <EmptyState v-if="models.length === 0" text="暂无模型，请新增模型" />
          </DataState>
        </section>
      </section>

      <section v-else-if="route.section === 'models' && route.id" class="admin-page">
        <div class="page-tools">
          <button class="admin-btn ghost" @click="go('/admin/models')">返回列表</button>
          <div class="tool-title">
            <h2>{{ modelDetailModel.displayName || route.id }}</h2>
            <span class="mono">{{ route.id }}</span>
          </div>
          <div class="topbar-actions">
            <button class="admin-btn ghost" @click="openModelEdit(modelDetail)">编辑基础配置</button>
            <button class="admin-btn" @click="openPricingCreate(route.id)">新增价格</button>
          </div>
        </div>

        <DataState :loading="loading.modelDetail" :error="errors.modelDetail" @retry="loadModelDetail(route.id)">
          <div class="admin-grid three">
            <section class="admin-panel">
              <div class="panel-head"><h2>基础配置</h2></div>
              <dl class="detail-list">
                <dt>Provider</dt><dd>{{ modelDetailModel.providerCode || '-' }}</dd>
                <dt>API Model</dt><dd class="mono">{{ modelDetailModel.apiModelName || '-' }}</dd>
                <dt>Level / Score</dt><dd>{{ modelDetailModel.level ?? '-' }} / {{ modelDetailModel.score ?? '-' }}</dd>
                <dt>能力</dt><dd>{{ modelDetailModel.localModel ? '本地模型' : '云端模型' }}，{{ modelDetailModel.supportsStream ? '支持流式' : '不支持流式' }}</dd>
                <dt>状态</dt><dd><StatusPill :ok="enabledOf(modelDetail) !== false" :text="enabledOf(modelDetail) === false ? '禁用' : '启用'" /></dd>
                <dt>24h 调用量</dt><dd>{{ formatNumber(last24hCallsOf(modelDetail)) }}</dd>
              </dl>
            </section>

            <section class="admin-panel">
              <div class="panel-head">
                <h2>当前价格</h2>
                <button class="text-btn" @click="openMarkupModal">调整加价倍率</button>
              </div>
              <dl v-if="pricingOf(modelDetail)" class="detail-list">
                <dt>输入 / 百万</dt><dd>{{ formatCny(pricingOf(modelDetail).promptPricePerMillion, 8) }}</dd>
                <dt>输出 / 百万</dt><dd>{{ formatCny(pricingOf(modelDetail).completionPricePerMillion, 8) }}</dd>
                <dt>缓存输入</dt><dd>{{ nullableMoney(pricingOf(modelDetail).cachedInputPricePerMillion, 8) }}</dd>
                <dt>请求附加费</dt><dd>{{ formatCny(pricingOf(modelDetail).requestSurcharge || 0, 8) }}</dd>
                <dt>加价倍率</dt><dd>{{ pricingOf(modelDetail).markupRatio ?? '-' }}</dd>
                <dt>生效时间</dt><dd>{{ pricingOf(modelDetail).effectiveFrom || '-' }}</dd>
              </dl>
              <EmptyState v-else text="缺少价格配置，请新增价格后再开放使用" />
            </section>

            <section class="admin-panel">
              <div class="panel-head">
                <h2>开放角色</h2>
                <button class="text-btn" @click="openModelRolesModal">编辑</button>
              </div>
              <div class="chip-row wrap">
                <span v-for="role in normalizedModelRoles" :key="role" class="admin-chip green">{{ role }}</span>
              </div>
              <EmptyState v-if="normalizedModelRoles.length === 0" text="暂未开放给任何角色" />
            </section>
          </div>

          <section class="admin-panel">
            <div class="panel-head">
              <div>
                <h2>历史价格</h2>
                <p>按 effectiveFrom 倒序</p>
              </div>
            </div>
            <table class="admin-table compact">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>输入</th>
                  <th>输出</th>
                  <th>缓存输入</th>
                  <th>请求费</th>
                  <th>倍率</th>
                  <th>生效</th>
                  <th>失效</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in modelPricing" :key="row.id">
                  <td>{{ row.id }}</td>
                  <td>{{ formatCny(row.promptPricePerMillion, 8) }}</td>
                  <td>{{ formatCny(row.completionPricePerMillion, 8) }}</td>
                  <td>{{ nullableMoney(row.cachedInputPricePerMillion, 8) }}</td>
                  <td>{{ formatCny(row.requestSurcharge || 0, 8) }}</td>
                  <td>{{ row.markupRatio ?? '-' }}</td>
                  <td>{{ row.effectiveFrom || '-' }}</td>
                  <td>{{ row.effectiveTo || '-' }}</td>
                  <td><StatusPill :ok="row.enabled !== false" :text="row.enabled === false ? '停用' : '启用'" /></td>
                </tr>
              </tbody>
            </table>
            <EmptyState v-if="modelPricing.length === 0" text="暂无历史价格" />
          </section>
        </DataState>
      </section>

      <section v-else-if="route.section === 'providers'" class="admin-page">
        <div class="page-tools">
          <div class="tool-title">
            <h2>Provider 注册表</h2>
            <span>{{ providers.length }} 个提供商 · API Key 加密存储，仅显示掩码</span>
          </div>
          <button class="admin-btn" @click="openProviderCreate">新增 Provider</button>
        </div>
        <section class="admin-panel">
          <DataState :loading="loading.providers" :error="errors.providers" @retry="loadProviders">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>编码</th>
                  <th>展示名</th>
                  <th>类型</th>
                  <th>Base URL</th>
                  <th>API Key</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in providers" :key="p.providerCode">
                  <td class="mono strong">{{ p.providerCode }}</td>
                  <td>{{ p.displayName || '-' }}</td>
                  <td><span :class="['admin-chip', p.providerType === 'OLLAMA_LOCAL' ? 'green' : 'blue']">{{ p.providerType }}</span></td>
                  <td class="mono">{{ p.baseUrl }}</td>
                  <td>
                    <span class="admin-chip gray">{{ p.hasApiKey ? (p.apiKeyMasked || '••••') : '无' }}</span>
                  </td>
                  <td><StatusPill :ok="p.enabled !== false" :text="p.enabled === false ? '禁用' : '启用'" /></td>
                  <td>
                    <div class="table-actions">
                      <button class="text-btn" @click="openProviderEdit(p)">编辑</button>
                      <button class="text-btn" @click="toggleProvider(p)">{{ p.enabled === false ? '启用' : '禁用' }}</button>
                      <button class="text-btn danger" @click="removeProvider(p)">删除</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <EmptyState v-if="providers.length === 0" text="暂无 Provider，请先新增 Provider 并填写 API Key" />
          </DataState>
        </section>
      </section>

      <section v-else-if="route.section === 'roles'" class="admin-page">
        <div class="page-tools">
          <div class="tool-title">
            <h2>角色配置</h2>
            <span>默认模型授权与日/月额度</span>
          </div>
          <button class="admin-btn ghost" @click="loadRoles">刷新角色</button>
        </div>

        <section class="admin-panel">
          <DataState :loading="loading.roles" :error="errors.roles" @retry="loadRoles">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>角色</th>
                  <th>用户数</th>
                  <th>模型数</th>
                  <th>日额度 Token / 金额</th>
                  <th>月额度 Token / 金额</th>
                  <th>并发</th>
                  <th>说明</th>
                  <th>无限</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="role in roles" :key="roleName(role)" :class="{ selected: activeRole === roleName(role) }">
                  <td class="mono strong">{{ roleName(role) }}</td>
                  <td>{{ formatNumber(role.userCount || 0) }}</td>
                  <td>{{ formatNumber(role.modelCount || 0) }}</td>
                  <td><QuotaLimitCell :money="role.dailyLimit" :tokens="role.dailyTokenLimit" /></td>
                  <td><QuotaLimitCell :money="role.monthlyLimit" :tokens="role.monthlyTokenLimit" /></td>
                  <td>{{ role.quota?.concurrentRequests ?? role.concurrentRequests ?? '-' }}</td>
                  <td>{{ role.quota?.description || role.description || '-' }}</td>
                  <td>{{ role.unlimited ? '是' : '否' }}</td>
                  <td>
                    <div class="table-actions">
                      <button class="text-btn" @click="selectRole(roleName(role))">配置</button>
                      <button class="text-btn" @click="openQuotaModal(roleName(role), role)">改配额</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </DataState>
        </section>

        <div class="admin-grid two rag-chart-grid">
          <section class="admin-panel">
            <div class="panel-head">
              <div>
                <h2>{{ activeRole }} 默认模型</h2>
                <p>支持全量替换、单个授权和单个取消</p>
              </div>
              <button class="text-btn danger" @click="replaceRoleModelsConfirm">全量替换</button>
            </div>
            <DataState :loading="loading.roleModels" :error="errors.roleModels" @retry="loadRoleModels(activeRole)">
              <div class="inline-form">
                <select v-model="roleModelToGrant">
                  <option value="">选择模型</option>
                  <option v-for="model in models" :key="modelCodeOf(model)" :value="modelCodeOf(model)">{{ modelCodeOf(model) }}</option>
                </select>
                <button class="admin-btn" @click="grantRoleModel">授权</button>
              </div>
              <textarea v-model="roleReplaceText" class="code-textarea" rows="4" placeholder="全量替换模型编码，一行一个或逗号分隔"></textarea>
              <div class="chip-row wrap model-chip-box">
                <span v-for="code in normalizedRoleModels" :key="code" class="admin-chip model-chip">
                  {{ code }}
                  <button @click="revokeRoleModel(code)">×</button>
                </span>
              </div>
              <EmptyState v-if="normalizedRoleModels.length === 0" text="该角色暂无默认模型" />
            </DataState>
          </section>

          <section class="admin-panel">
            <div class="panel-head"><h2>{{ activeRole }} 配额详情</h2></div>
            <DataState :loading="loading.roleQuota" :error="errors.roleQuota" @retry="loadRoleQuota(activeRole)">
              <dl class="detail-list">
                <dt>日额度</dt><dd><QuotaLimitCell :money="roleQuota.dailyLimit" :tokens="moneyToStandardTokens(roleQuota.dailyLimit)" /></dd>
                <dt>月额度</dt><dd><QuotaLimitCell :money="roleQuota.monthlyLimit" :tokens="moneyToStandardTokens(roleQuota.monthlyLimit)" /></dd>
                <dt>并发请求</dt><dd>{{ roleQuota.concurrentRequests ?? '-' }}</dd>
                <dt>描述</dt><dd>{{ roleQuota.description || '-' }}</dd>
              </dl>
            </DataState>
          </section>
        </div>
      </section>

      <section v-else-if="route.section === 'users' && !route.id" class="admin-page">
        <div class="page-tools">
          <div class="tool-title">
            <h2>用户管理</h2>
            <span>搜索、筛选、分页和授权覆盖</span>
          </div>
        </div>
        <div class="metric-grid compact-metrics">
          <div class="metric-card">
            <span>筛选用户</span>
            <strong>{{ formatNumber(userPage.totalElements || users.length) }}</strong>
            <small>当前查询条件下的用户数</small>
          </div>
          <div class="metric-card">
            <span>日标准 Token 剩余</span>
            <strong>{{ compactNumber(totalQuotaRemaining(users, 'dailyQuota')) }}</strong>
            <small>当前页用户剩余量汇总</small>
          </div>
          <div class="metric-card">
            <span>月标准 Token 已用</span>
            <strong>{{ compactNumber(totalQuotaUsed(users, 'monthlyQuota')) }}</strong>
            <small>{{ formatCny(totalQuotaMoneyUsed(users, 'monthlyQuota'), 2) }} 成本口径</small>
          </div>
        </div>
        <div class="admin-grid two">
          <section class="admin-panel chart-panel">
            <div class="panel-head">
              <h2>角色分布</h2>
              <span>当前筛选结果</span>
            </div>
            <AdminChart :option="pieOption(userRoleChartRows, 'dimension', 'count', '角色占比')" :height="300" />
          </section>
          <section class="admin-panel chart-panel">
            <div class="panel-head">
              <h2>状态分布</h2>
              <span>ACTIVE / SUSPENDED 等</span>
            </div>
            <AdminChart :option="barOption(userStatusChartRows, 'dimension', 'count', '用户状态')" :height="300" />
          </section>
        </div>
        <section class="admin-panel">
          <div class="filters">
            <input v-model="userFilters.q" placeholder="用户名、昵称、邮箱" @keyup.enter="searchUsers" />
            <select v-model="userFilters.role">
              <option value="">全部角色</option>
              <option v-for="role in roleOptions" :key="role" :value="role">{{ role }}</option>
            </select>
            <button class="admin-btn" @click="searchUsers">查询</button>
          </div>
          <DataState :loading="loading.users" :error="errors.users" @retry="loadUsers">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>用户名</th>
                  <th>昵称</th>
                  <th>邮箱</th>
                  <th>角色</th>
                  <th>状态</th>
                  <th>日额度</th>
                  <th>月额度</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="userIdOf(user)">
                  <td class="mono strong">{{ userIdOf(user) }}</td>
                  <td>{{ userOf(user).username || '-' }}</td>
                  <td>{{ userOf(user).nickname || '-' }}</td>
                  <td>{{ userOf(user).email || '-' }}</td>
                  <td><span class="admin-chip green">{{ userOf(user).userRole || userOf(user).role || '-' }}</span></td>
                  <td><StatusPill :ok="(userOf(user).userStatus || userOf(user).status || 'ACTIVE') === 'ACTIVE'" :text="userOf(user).userStatus || userOf(user).status || '-'" /></td>
                  <td><QuotaProgress :quota="user.dailyQuota" /></td>
                  <td><QuotaProgress :quota="user.monthlyQuota" /></td>
                  <td><button class="text-btn" @click="go(`/admin/users/${encodeURIComponent(userIdOf(user))}`)">详情</button></td>
                </tr>
              </tbody>
            </table>
            <EmptyState v-if="users.length === 0" text="暂无用户" />
            <Pagination :page="userPage.page" :total-pages="userPage.totalPages" @prev="changeUserPage(-1)" @next="changeUserPage(1)" />
          </DataState>
        </section>
      </section>

      <section v-else-if="route.section === 'users' && route.id" class="admin-page">
        <div class="page-tools">
          <button class="admin-btn ghost" @click="go('/admin/users')">返回用户列表</button>
          <div class="tool-title">
            <h2>{{ userOf(selectedUser).nickname || userOf(selectedUser).username || route.id }}</h2>
            <span class="mono">{{ route.id }}</span>
          </div>
        </div>

        <DataState :loading="loading.userDetail" :error="errors.userDetail" @retry="loadUserDetail(route.id)">
          <div class="admin-grid two">
            <section class="admin-panel">
              <div class="panel-head"><h2>基本信息</h2></div>
              <dl class="detail-list">
                <dt>User ID</dt><dd class="mono">{{ userIdOf(selectedUser) || route.id }}</dd>
                <dt>用户名</dt><dd>{{ userOf(selectedUser).username || '-' }}</dd>
                <dt>昵称</dt><dd>{{ userOf(selectedUser).nickname || '-' }}</dd>
                <dt>邮箱</dt><dd>{{ userOf(selectedUser).email || '-' }}</dd>
                <dt>角色</dt>
                <dd>
                  <div class="inline-form tight">
                    <select v-model="userEditRole">
                      <option v-for="role in roleOptions" :key="role" :value="role">{{ role }}</option>
                    </select>
                    <button class="admin-btn ghost" @click="updateUserRole">保存</button>
                  </div>
                </dd>
                <dt>状态</dt>
                <dd>
                  <div class="inline-form tight">
                    <select v-model="userEditStatus">
                      <option v-for="status in userStatusOptions" :key="status" :value="status">{{ status }}</option>
                    </select>
                    <button class="admin-btn ghost" @click="updateUserStatus">保存</button>
                  </div>
                </dd>
              </dl>
            </section>

            <section class="admin-panel">
              <div class="panel-head"><h2>有效配额</h2></div>
              <DataState :loading="loading.userEffective" :error="errors.userEffective" @retry="loadUserEffective(route.id)">
                <div class="quota-detail-stack">
                  <QuotaProgress :quota="effectiveQuota.daily" label="日额度" large />
                  <QuotaProgress :quota="effectiveQuota.monthly" label="月额度" large />
                </div>
              </DataState>
            </section>
          </div>

          <div class="admin-grid two">
            <section class="admin-panel">
              <div class="panel-head">
                <h2>模型覆盖规则</h2>
                <button class="text-btn" @click="openUserModelOverride">新增模型 override</button>
              </div>
              <table class="admin-table compact">
                <thead><tr><th>ID</th><th>模型</th><th>类型</th><th>Workspace</th><th>过期</th><th>操作</th></tr></thead>
                <tbody>
                  <tr v-for="row in userModelOverrides" :key="row.id">
                    <td>{{ row.id }}</td>
                    <td class="mono">{{ row.modelCode }}</td>
                    <td><span :class="['admin-chip', row.overrideType === 'DENY' ? 'red' : 'green']">{{ row.overrideType }}</span></td>
                    <td class="mono">{{ row.workspaceId || '全局' }}</td>
                    <td>{{ row.expiresAt || '-' }}</td>
                    <td><button class="text-btn danger" @click="deleteUserModelOverride(row)">删除</button></td>
                  </tr>
                </tbody>
              </table>
              <EmptyState v-if="userModelOverrides.length === 0" text="暂无模型 override，DENY 优先级最高" />
            </section>

            <section class="admin-panel">
              <div class="panel-head">
                <h2>配额覆盖规则</h2>
                <button class="text-btn" @click="openUserQuotaOverride">新增配额 override</button>
              </div>
              <table class="admin-table compact">
                <thead><tr><th>ID</th><th>日增量</th><th>月增量</th><th>Workspace</th><th>过期</th><th>操作</th></tr></thead>
                <tbody>
                  <tr v-for="row in userQuotaOverrides" :key="row.id">
                    <td>{{ row.id }}</td>
                    <td>{{ row.dailyDelta ?? 0 }}</td>
                    <td>{{ row.monthlyDelta ?? 0 }}</td>
                    <td class="mono">{{ row.workspaceId || '全局' }}</td>
                    <td>{{ row.expiresAt || '-' }}</td>
                    <td><button class="text-btn danger" @click="deleteUserQuotaOverride(row)">删除</button></td>
                  </tr>
                </tbody>
              </table>
              <EmptyState v-if="userQuotaOverrides.length === 0" text="暂无配额增量 override" />
            </section>
          </div>

          <div class="admin-grid two">
            <section class="admin-panel">
              <div class="panel-head"><h2>实际可用模型</h2></div>
              <div class="chip-row wrap model-chip-box">
                <span v-for="code in effectiveModelCodes" :key="code" class="admin-chip model-chip">{{ code }}</span>
              </div>
              <EmptyState v-if="effectiveModelCodes.length === 0" text="暂无可用模型" />
            </section>

            <section class="admin-panel">
              <div class="panel-head"><h2>最近调用流水</h2></div>
              <table class="admin-table compact">
                <thead><tr><th>时间</th><th>模型</th><th>状态</th><th>标准 Token</th><th>原始 Token</th><th>费用</th></tr></thead>
                <tbody>
                  <tr v-for="event in userRecentUsage" :key="event.id || `${event.createdAt}-${event.modelCode}`">
                    <td>{{ event.createdAt || event.createdTime || '-' }}</td>
                    <td class="mono">{{ event.modelCode || '-' }}</td>
                    <td>{{ event.status || '-' }}</td>
                    <td>{{ compactNumber(eventStandardTokens(event)) }}</td>
                    <td>{{ compactNumber(event.tokens || event.totalTokens || 0) }}</td>
                    <td>{{ formatCny(eventCost(event), 4) }}</td>
                  </tr>
                </tbody>
              </table>
              <EmptyState v-if="userRecentUsage.length === 0" text="暂无最近调用" />
            </section>
          </div>
        </DataState>
      </section>

      <section v-else-if="route.section === 'workspaces' && !route.id" class="admin-page">
        <div class="page-tools">
          <div class="tool-title">
            <h2>Workspace 管理</h2>
            <span>企业空间、套餐和成员</span>
          </div>
          <button class="admin-btn" @click="openWorkspaceCreate">新增 Workspace</button>
        </div>
        <section class="admin-panel">
          <div class="filters">
            <input v-model="workspaceFilters.q" placeholder="Workspace 名称或 ID" @keyup.enter="searchWorkspaces" />
            <select v-model="workspaceFilters.planCode">
              <option value="">全部套餐</option>
              <option v-for="plan in plans" :key="planCodeOf(plan)" :value="planCodeOf(plan)">{{ planCodeOf(plan) }}</option>
            </select>
            <button class="admin-btn" @click="searchWorkspaces">查询</button>
          </div>
          <DataState :loading="loading.workspaces" :error="errors.workspaces" @retry="loadWorkspaces">
            <table class="admin-table">
              <thead><tr><th>ID</th><th>名称</th><th>组织</th><th>套餐</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead>
              <tbody>
                <tr v-for="ws in workspaces" :key="workspaceIdOf(ws)">
                  <td class="mono strong">{{ workspaceIdOf(ws) }}</td>
                  <td>{{ ws.name || '-' }}</td>
                  <td>{{ ws.orgName || ws.organizationName || ws.orgId || '-' }}</td>
                  <td>
                    <span :class="['admin-chip', workspacePlanCode(ws) ? 'blue' : 'gray']">{{ workspacePlanLabel(ws) }}</span>
                  </td>
                  <td><StatusPill :ok="(ws.status || 'ACTIVE') === 'ACTIVE'" :text="ws.status || '-'" /></td>
                  <td>{{ ws.createdAt || '-' }}</td>
                  <td><button class="text-btn" @click="go(`/admin/workspaces/${encodeURIComponent(workspaceIdOf(ws))}`)">详情</button></td>
                </tr>
              </tbody>
            </table>
            <EmptyState v-if="workspaces.length === 0" text="暂无 Workspace" />
            <Pagination :page="workspacePage.page" :total-pages="workspacePage.totalPages" @prev="changeWorkspacePage(-1)" @next="changeWorkspacePage(1)" />
          </DataState>
        </section>
      </section>

      <section v-else-if="route.section === 'workspaces' && route.id" class="admin-page">
        <div class="page-tools">
          <button class="admin-btn ghost" @click="go('/admin/workspaces')">返回 Workspace</button>
          <div class="tool-title">
            <h2>{{ selectedWorkspace.name || route.id }}</h2>
            <span class="mono">{{ route.id }}</span>
          </div>
        </div>
        <DataState :loading="loading.workspaceDetail" :error="errors.workspaceDetail" @retry="loadWorkspaceDetail(route.id)">
          <div class="admin-grid two">
            <section class="admin-panel">
              <div class="panel-head"><h2>空间配置</h2></div>
              <div class="form-grid">
                <label><span>名称</span><input v-model="workspaceEdit.name" /></label>
                <label><span>套餐</span><input v-model="workspaceEdit.planCode" placeholder="planCode" /></label>
                <label><span>状态</span><input v-model="workspaceEdit.status" placeholder="ACTIVE" /></label>
              </div>
              <div class="form-actions"><button class="admin-btn" @click="updateWorkspace">保存 Workspace</button></div>
            </section>

            <section class="admin-panel">
              <div class="panel-head"><h2>套餐与用量</h2></div>
              <dl class="detail-list">
                <dt>Org ID</dt><dd class="mono">{{ selectedWorkspace.orgId || '-' }}</dd>
                <dt>Plan</dt><dd>{{ selectedWorkspace.plan?.displayName || selectedWorkspace.planCode || '个人空间' }}</dd>
                <dt>权益数</dt><dd>{{ selectedWorkspace.planEntitlements?.length || 0 }}</dd>
                <dt>最近流水</dt><dd>{{ selectedWorkspace.recentUsage?.length || 0 }}</dd>
              </dl>
            </section>

            <section class="admin-panel">
              <div class="panel-head"><h2>成员管理</h2></div>
              <div class="inline-form">
                <input v-model="workspaceMemberForm.userId" placeholder="userId" />
                <select v-model="workspaceMemberForm.memberRole">
                  <option>OWNER</option><option>ADMIN</option><option>MEMBER</option><option>VIEWER</option>
                </select>
                <button class="admin-btn" @click="addWorkspaceMember">添加</button>
              </div>
              <table class="admin-table compact">
                <thead><tr><th>User ID</th><th>角色</th><th>操作</th></tr></thead>
                <tbody>
                  <tr v-for="member in workspaceMembers" :key="member.userId">
                    <td class="mono">{{ member.userId }}</td>
                    <td>{{ member.memberRole || member.role || '-' }}</td>
                    <td><button class="text-btn danger" @click="removeWorkspaceMember(member)">移除</button></td>
                  </tr>
                </tbody>
              </table>
              <EmptyState v-if="workspaceMembers.length === 0" text="后端详情若未返回 members，则此处为空" />
            </section>
          </div>
        </DataState>
      </section>

      <section v-else-if="route.section === 'plans' && !route.id" class="admin-page">
        <div class="page-tools">
          <div class="tool-title">
            <h2>套餐管理</h2>
            <span>套餐权益与团队共享额度</span>
          </div>
          <button class="admin-btn" @click="openPlanCreate">新增套餐</button>
        </div>
        <section class="admin-panel">
          <DataState :loading="loading.plans" :error="errors.plans" @retry="loadPlans">
            <table class="admin-table">
              <thead><tr><th>Plan Code</th><th>名称</th><th>Tier</th><th>状态</th><th>描述</th><th>操作</th></tr></thead>
              <tbody>
                <tr v-for="plan in plans" :key="planCodeOf(plan)">
                  <td class="mono strong">{{ planCodeOf(plan) }}</td>
                  <td>{{ plan.displayName || '-' }}</td>
                  <td>{{ plan.tier ?? '-' }}</td>
                  <td><StatusPill :ok="plan.enabled !== false" :text="plan.enabled === false ? '停用' : '启用'" /></td>
                  <td>{{ plan.description || '-' }}</td>
                  <td><button class="text-btn" @click="go(`/admin/plans/${encodeURIComponent(planCodeOf(plan))}`)">权益配置</button></td>
                </tr>
              </tbody>
            </table>
            <EmptyState v-if="plans.length === 0" text="暂无套餐" />
          </DataState>
        </section>
      </section>

      <section v-else-if="route.section === 'rag'" class="admin-page">
        <div class="metric-grid compact-metrics">
          <div class="metric-card">
            <span>RAG 文档</span>
            <strong>{{ formatNumber(ragOverview.documentCount) }}</strong>
            <small>已进入 rag_document 的文件</small>
          </div>
          <div class="metric-card">
            <span>向量 Chunk</span>
            <strong>{{ compactNumber(ragOverview.chunkCount) }}</strong>
            <small>实际 chunk 表记录数</small>
          </div>
          <div class="metric-card">
            <span>估算 Token</span>
            <strong>{{ compactNumber(ragOverview.estimatedTokens) }}</strong>
            <small>RAG 文件内容 token 估算</small>
          </div>
          <div class="metric-card">
            <span>声明 Chunk</span>
            <strong>{{ compactNumber(ragOverview.declaredChunkCount) }}</strong>
            <small>文档主表记录的 chunk_count</small>
          </div>
        </div>

        <div class="admin-grid two">
          <section class="admin-panel">
            <div class="panel-head">
              <div>
                <h2>文档处理状态</h2>
                <p>RECEIVED / PROCESSING / INDEXED / FAILED</p>
              </div>
            </div>
            <AdminChart :option="pieOption(ragOverview.documentStatus, 'dimension', 'count', '文档状态')" :height="300" />
          </section>
          <section class="admin-panel">
            <div class="panel-head">
              <div>
                <h2>用户文件分布</h2>
                <p>按 ownerFolder 聚合文件数</p>
              </div>
            </div>
            <AdminChart :option="barOption(ragOverview.ownerUsage, 'dimension', 'documents', '用户文件数')" :height="300" />
          </section>
          <section class="admin-panel">
            <div class="panel-head">
              <div>
                <h2>上传事件状态</h2>
                <p>SQS 文件处理结果</p>
              </div>
            </div>
            <AdminChart :option="pieOption(ragOverview.eventFileStatus, 'dimension', 'count', '事件状态')" :height="300" />
          </section>
          <section class="admin-panel">
            <div class="panel-head">
              <div>
                <h2>RAG 管道阶段</h2>
                <p>用于定位解析、分块、向量化或入库卡点</p>
              </div>
            </div>
            <AdminChart :option="barOption(ragOverview.eventRagStatus, 'dimension', 'count', '管道阶段')" :height="300" />
          </section>
        </div>

        <section class="admin-panel">
          <div class="panel-head">
            <div>
              <h2>RAG 文档检索</h2>
              <p>文件、用户目录、会话和状态联动排查</p>
            </div>
          </div>
          <div class="filters">
            <input v-model="ragFilters.q" placeholder="文件名 / objectKey" @keyup.enter="searchRagDocuments" />
            <input v-model="ragFilters.ownerFolder" placeholder="ownerFolder / 用户目录" />
            <input v-model="ragFilters.sessionId" placeholder="sessionId" />
            <input v-model="ragFilters.fileId" placeholder="fileId" />
            <select v-model="ragFilters.status">
              <option value="">全部状态</option>
              <option>RECEIVED</option><option>PROCESSING</option><option>INDEXED</option><option>FAILED</option><option>SKIPPED</option>
            </select>
            <button class="admin-btn" @click="searchRagDocuments">查询文档</button>
          </div>
          <DataState :loading="loading.ragDocuments" :error="errors.ragDocuments" @retry="loadRagDocuments">
            <div class="table-scroll">
            <table class="admin-table compact">
              <thead><tr><th>File ID</th><th>文件名</th><th>用户目录</th><th>状态</th><th>大小</th><th>Chunk</th><th>字符数</th><th>Session</th><th>Chat</th><th>更新时间</th></tr></thead>
              <tbody>
                <tr v-for="doc in ragDocuments" :key="doc.documentId || doc.fileId || doc.objectKey">
                  <td class="mono">{{ doc.fileId || '-' }}</td>
                  <td>{{ doc.fileName || doc.objectKey || '-' }}</td>
                  <td class="mono">{{ doc.ownerFolder || '-' }}</td>
                  <td><StatusPill :ok="doc.status === 'INDEXED'" :text="doc.status || '-'" /></td>
                  <td>{{ formatBytes(doc.fileSize) }}</td>
                  <td>{{ formatNumber(doc.chunkCount || 0) }}</td>
                  <td>{{ compactNumber(doc.extractedCharacterCount || 0) }}</td>
                  <td class="mono">{{ doc.sessionId || '-' }}</td>
                  <td class="mono">{{ doc.chatId || '-' }}</td>
                  <td>{{ doc.updatedAt || '-' }}</td>
                </tr>
              </tbody>
            </table>
            </div>
            <EmptyState v-if="ragDocuments.length === 0" text="暂无 RAG 文档" />
            <Pagination :page="ragPage.page" :total-pages="ragPage.totalPages" @prev="changeRagPage(-1)" @next="changeRagPage(1)" />
          </DataState>
        </section>

        <section class="admin-panel">
          <div class="panel-head">
            <div>
              <h2>最近摄取事件</h2>
              <p>用于查看文件从上传事件进入 RAG 管道的最后状态</p>
            </div>
          </div>
          <DataState :loading="loading.ragOverview" :error="errors.ragOverview" @retry="loadRagOverview">
            <div class="table-scroll">
            <table class="admin-table compact">
              <thead><tr><th>时间</th><th>Bucket</th><th>Object Key</th><th>文件状态</th><th>RAG 状态</th><th>错误</th></tr></thead>
              <tbody>
                <tr v-for="event in recentRagEvents" :key="event.eventId || event.id || `${event.createdAt}-${event.objectKey}`">
                  <td>{{ event.createdAt || '-' }}</td>
                  <td>{{ event.bucketName || '-' }}</td>
                  <td class="mono">{{ event.objectKey || '-' }}</td>
                  <td>{{ event.fileStatus || '-' }}</td>
                  <td>{{ event.ragStatus || '-' }}</td>
                  <td>{{ event.errorMessage || '-' }}</td>
                </tr>
              </tbody>
            </table>
            </div>
            <EmptyState v-if="recentRagEvents.length === 0" text="暂无摄取事件" />
          </DataState>
        </section>
      </section>

      <section v-else-if="route.section === 'plans' && route.id" class="admin-page">
        <div class="page-tools">
          <button class="admin-btn ghost" @click="go('/admin/plans')">返回套餐</button>
          <div class="tool-title">
            <h2>{{ route.id }} 套餐权益</h2>
            <span>ALLOWED_MODEL / ALLOWED_PROVIDER / CAPABILITY / LIMIT</span>
          </div>
          <button class="admin-btn" @click="openEntitlementCreate">新增权益</button>
        </div>
        <section class="admin-panel">
          <DataState :loading="loading.planEntitlements" :error="errors.planEntitlements" @retry="loadPlanDetail(route.id)">
            <div class="metric-grid compact-metrics">
              <div class="metric-card" v-for="type in entitlementTypes" :key="type">
                <span>{{ type }}</span>
                <strong>{{ formatNumber(planEntitlements.filter((item) => item.entitlementType === type).length) }}</strong>
                <small>当前启用权益项</small>
              </div>
            </div>
            <table class="admin-table">
              <thead><tr><th>ID</th><th>类型</th><th>Key</th><th>数值</th><th>文本值</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>
                <tr v-for="entitlement in planEntitlements" :key="entitlement.id">
                  <td>{{ entitlement.id }}</td>
                  <td><span class="admin-chip blue">{{ entitlement.entitlementType }}</span></td>
                  <td class="mono">{{ entitlement.entitlementKey }}</td>
                  <td>{{ entitlement.valueNumber ?? '-' }}</td>
                  <td>{{ entitlement.valueText || '-' }}</td>
                  <td><StatusPill :ok="entitlement.enabled !== false" :text="entitlement.enabled === false ? '停用' : '启用'" /></td>
                  <td><button class="text-btn danger" @click="deletePlanEntitlement(entitlement)">删除权益</button></td>
                </tr>
              </tbody>
            </table>
            <EmptyState v-if="planEntitlements.length === 0" text="暂无套餐权益" />
          </DataState>
        </section>
      </section>

      <section v-else-if="route.section === 'usage'" class="admin-page">
        <div class="page-tools">
          <div class="tool-title">
            <h2>用量监控</h2>
            <span>流水、聚合、TopN、配额状态和用户 timeline</span>
          </div>
        </div>

        <div class="usage-tabs">
          <button v-for="tab in usageTabs" :key="tab.key" :class="{ active: usageTab === tab.key }" @click="usageTab = tab.key">{{ tab.label }}</button>
        </div>

        <section v-if="usageTab === 'events'" class="admin-panel">
          <div class="filters">
            <input v-model="usageEventFilters.userId" placeholder="userId" />
            <input v-model="usageEventFilters.workspaceId" placeholder="workspaceId" />
            <input v-model="usageEventFilters.modelCode" placeholder="modelCode" />
            <select v-model="usageEventFilters.status">
              <option value="">全部状态</option>
              <option>SUCCESS</option><option>FAILED</option><option>TIMEOUT</option><option>BLOCKED_BY_QUOTA</option><option>BLOCKED_BY_PRICING</option>
            </select>
            <input v-model="usageEventFilters.from" placeholder="from: 2026-05-18T00:00:00" />
            <input v-model="usageEventFilters.to" placeholder="to" />
            <button class="admin-btn" @click="searchUsageEvents">查询流水</button>
          </div>
          <DataState :loading="loading.usageEvents" :error="errors.usageEvents" @retry="loadUsageEvents">
            <div class="admin-grid three chart-grid">
              <AdminChart :option="pieOption(usageEventStatusRows, 'dimension', 'count', '状态分布')" :height="280" />
              <AdminChart :option="barOption(usageEventModelRows, 'dimension', 'standardTokens', '模型标准 Token')" :height="280" />
              <AdminChart :option="barOption(usageEventModelRows, 'dimension', 'cost', '模型金额成本', true)" :height="280" />
            </div>
            <table class="admin-table compact">
              <thead><tr><th>时间</th><th>User</th><th>Workspace</th><th>模型</th><th>Provider</th><th>状态</th><th>标准 Token</th><th>原始 Token</th><th>费用</th><th>耗时</th></tr></thead>
              <tbody>
                <tr v-for="event in usageEvents" :key="event.id || `${event.createdAt}-${event.userId}-${event.modelCode}`">
                  <td>{{ event.createdAt || event.createdTime || '-' }}</td>
                  <td class="mono">{{ event.userId || '-' }}</td>
                  <td class="mono">{{ event.workspaceId || '-' }}</td>
                  <td class="mono">{{ event.modelCode || '-' }}</td>
                  <td>{{ event.providerCode || '-' }}</td>
                  <td>{{ event.status || '-' }}</td>
                  <td>{{ compactNumber(eventStandardTokens(event)) }}</td>
                  <td>{{ compactNumber(event.tokens || event.totalTokens || 0) }}</td>
                  <td>{{ formatCny(eventCost(event), 4) }}</td>
                  <td>{{ event.latencyMs ? `${event.latencyMs}ms` : '-' }}</td>
                </tr>
              </tbody>
            </table>
            <EmptyState v-if="usageEvents.length === 0" text="暂无调用流水" />
            <Pagination :page="usageEventPage.page" :total-pages="usageEventPage.totalPages" @prev="changeUsageEventPage(-1)" @next="changeUsageEventPage(1)" />
          </DataState>
        </section>

        <section v-else-if="usageTab === 'aggregate'" class="admin-panel">
          <div class="filters">
            <select v-model="usageAggregateFilters.groupBy">
              <option value="user">user</option><option value="workspace">workspace</option><option value="model">model</option><option value="provider">provider</option>
            </select>
            <input v-model="usageAggregateFilters.from" placeholder="from" />
            <input v-model="usageAggregateFilters.to" placeholder="to" />
            <button class="admin-btn" @click="loadUsageAggregate">聚合</button>
          </div>
          <DataState :loading="loading.usageAggregate" :error="errors.usageAggregate" @retry="loadUsageAggregate">
            <div class="admin-grid three chart-grid">
              <AdminChart :option="barOption(usageAggregate, 'dimension', 'standardTokens', '标准 Token 消耗')" :height="280" />
              <AdminChart :option="pieOption(usageAggregate, 'dimension', 'cost', '金额占比', true)" :height="280" />
              <AdminChart :option="barOption(usageAggregate, 'dimension', 'tokens', '原始 Token')" :height="280" />
            </div>
            <table class="admin-table compact">
              <thead><tr><th>维度</th><th>调用</th><th>标准 Token</th><th>原始 Token</th><th>费用</th></tr></thead>
              <tbody>
                <tr v-for="row in usageAggregate" :key="dimensionOf(row)">
                  <td class="mono">{{ dimensionOf(row) }}</td>
                  <td>{{ formatNumber(row.calls) }}</td>
                  <td>{{ compactNumber(standardTokensOf(row)) }}</td>
                  <td>{{ compactNumber(row.tokens) }}</td>
                  <td>{{ formatCny(row.cost, 4) }}</td>
                </tr>
              </tbody>
            </table>
            <EmptyState v-if="usageAggregate.length === 0" text="暂无聚合数据" />
          </DataState>
        </section>

        <section v-else-if="usageTab === 'topn'" class="admin-panel">
          <div class="filters">
            <select v-model="usageTopFilters.dimension">
              <option value="user">user</option><option value="workspace">workspace</option><option value="model">model</option><option value="provider">provider</option>
            </select>
            <select v-model="usageTopFilters.metric">
              <option value="standardTokens">标准 Token</option><option value="tokens">原始 Token</option><option value="cost">金额</option>
            </select>
            <input v-model.number="usageTopFilters.n" type="number" min="1" max="100" />
            <input v-model="usageTopFilters.from" placeholder="from" />
            <input v-model="usageTopFilters.to" placeholder="to" />
            <button class="admin-btn" @click="loadUsageTopN">查询 TopN</button>
          </div>
          <DataState :loading="loading.usageTopN" :error="errors.usageTopN" @retry="loadUsageTopN">
            <div class="admin-grid two chart-grid">
              <AdminChart :option="barOption(usageTopN, 'dimension', usageTopMetricKey, 'TopN 排名图', usageTopFilters.metric === 'cost')" :height="300" />
              <AdminChart :option="pieOption(usageTopN, 'dimension', usageTopMetricKey, 'TopN 占比', usageTopFilters.metric === 'cost')" :height="300" />
            </div>
            <table class="admin-table compact">
              <thead><tr><th>排名</th><th>维度</th><th>调用</th><th>标准 Token</th><th>原始 Token</th><th>费用</th></tr></thead>
              <tbody>
                <tr v-for="(row, index) in usageTopN" :key="dimensionOf(row)">
                  <td>{{ index + 1 }}</td>
                  <td class="mono">{{ dimensionOf(row) }}</td>
                  <td>{{ formatNumber(row.calls) }}</td>
                  <td>{{ compactNumber(standardTokensOf(row)) }}</td>
                  <td>{{ compactNumber(row.tokens) }}</td>
                  <td>{{ formatCny(row.cost, 4) }}</td>
                </tr>
              </tbody>
            </table>
            <EmptyState v-if="usageTopN.length === 0" text="暂无 TopN 数据" />
          </DataState>
        </section>

        <section v-else-if="usageTab === 'quota'" class="admin-panel">
          <div class="filters">
            <select v-model="quotaStatusRole">
              <option value="">全部角色</option>
              <option v-for="role in roleOptions" :key="role" :value="role">{{ role }}</option>
            </select>
            <button class="admin-btn" @click="loadQuotaStatus">查询配额状态</button>
          </div>
          <DataState :loading="loading.quotaStatus" :error="errors.quotaStatus" @retry="loadQuotaStatus">
            <div class="admin-grid three chart-grid">
              <AdminChart :option="barOption(quotaStatus, 'role', 'dailyTokenLimit', '日额度标准 Token')" :height="280" />
              <AdminChart :option="barOption(quotaStatus, 'role', 'monthlyTokenLimit', '月额度标准 Token')" :height="280" />
              <AdminChart :option="pieOption(quotaStatus, 'role', 'userCount', '角色用户占比')" :height="280" />
            </div>
            <table class="admin-table compact">
              <thead><tr><th>角色</th><th>用户数</th><th>模型数</th><th>日额度 Token / 金额</th><th>月额度 Token / 金额</th><th>无限</th></tr></thead>
              <tbody>
                <tr v-for="row in quotaStatus" :key="row.role">
                  <td class="mono strong">{{ row.role }}</td>
                  <td>{{ formatNumber(row.userCount) }}</td>
                  <td>{{ formatNumber(row.modelCount) }}</td>
                  <td><QuotaLimitCell :money="row.dailyLimit" :tokens="row.dailyTokenLimit" /></td>
                  <td><QuotaLimitCell :money="row.monthlyLimit" :tokens="row.monthlyTokenLimit" /></td>
                  <td>{{ row.unlimited ? '是' : '否' }}</td>
                </tr>
              </tbody>
            </table>
            <EmptyState v-if="quotaStatus.length === 0" text="暂无角色配额状态" />
          </DataState>
        </section>

        <section v-else class="admin-panel">
          <div class="filters">
            <input v-model="timelineUserId" placeholder="userId" @keyup.enter="loadUserTimeline" />
            <button class="admin-btn" @click="loadUserTimeline">查询 timeline</button>
          </div>
          <DataState :loading="loading.userTimeline" :error="errors.userTimeline" @retry="loadUserTimeline">
            <div class="admin-grid three chart-grid">
              <AdminChart :option="lineAreaOption(timelineSeriesRows, 'dimension', 'standardTokens', '时间线标准 Token')" :height="280" />
              <AdminChart :option="barOption(timelineModelRows, 'dimension', 'standardTokens', '模型标准 Token')" :height="280" />
              <AdminChart :option="pieOption(timelineModelRows, 'dimension', 'cost', '模型金额占比', true)" :height="280" />
            </div>
            <table class="admin-table compact">
              <thead><tr><th>时间</th><th>模型</th><th>状态</th><th>标准 Token</th><th>原始 Token</th><th>费用</th><th>Workspace</th></tr></thead>
              <tbody>
                <tr v-for="event in usageTimeline" :key="event.id || `${event.createdAt}-${event.modelCode}`">
                  <td>{{ event.createdAt || event.createdTime || '-' }}</td>
                  <td class="mono">{{ event.modelCode || '-' }}</td>
                  <td>{{ event.status || '-' }}</td>
                  <td>{{ compactNumber(eventStandardTokens(event)) }}</td>
                  <td>{{ compactNumber(event.tokens || event.totalTokens || 0) }}</td>
                  <td>{{ formatCny(eventCost(event), 4) }}</td>
                  <td class="mono">{{ event.workspaceId || '-' }}</td>
                </tr>
              </tbody>
            </table>
            <EmptyState v-if="usageTimeline.length === 0" text="输入 userId 后查询最近调用" />
          </DataState>
        </section>
      </section>
    </main>

    <div v-if="modelModal.visible" class="admin-modal-mask" @click.self="closeModelModal">
      <form class="admin-modal large" @submit.prevent="submitModel">
        <div class="modal-head">
          <h2>{{ modelModal.mode === 'create' ? '新增模型' : '编辑模型' }}</h2>
          <button type="button" @click="closeModelModal">×</button>
        </div>
        <div v-if="modelModal.error" class="form-error">{{ modelModal.error }}</div>
        <div class="form-grid">
          <label><span>模型编码 *</span><input v-model.trim="modelForm.modelCode" :disabled="modelModal.mode !== 'create'" /></label>
          <label><span>展示名</span><input v-model.trim="modelForm.displayName" /></label>
          <label><span>Provider *</span><input v-model.trim="modelForm.providerCode" /></label>
          <label><span>API Model Name *</span><input v-model.trim="modelForm.apiModelName" /></label>
          <label><span>Level</span><input v-model.number="modelForm.level" type="number" /></label>
          <label><span>Score</span><input v-model.number="modelForm.score" type="number" /></label>
          <label class="check-row"><input v-model="modelForm.localModel" type="checkbox" /> 本地模型</label>
          <label class="check-row"><input v-model="modelForm.supportsStream" type="checkbox" /> 支持流式</label>
          <label class="check-row"><input v-model="modelForm.enabled" type="checkbox" /> 启用</label>
          <label class="wide"><span>描述</span><textarea v-model.trim="modelForm.description" rows="3"></textarea></label>
        </div>
        <div v-if="modelModal.mode === 'create'" class="sub-form">
          <h3>初始价格 *</h3>
          <div class="form-grid">
            <label><span>Currency</span><input v-model.trim="modelForm.pricing.currency" /></label>
            <label><span>输入价 / 百万 *</span><input v-model.number="modelForm.pricing.promptPricePerMillion" type="number" step="0.00000001" /></label>
            <label><span>输出价 / 百万 *</span><input v-model.number="modelForm.pricing.completionPricePerMillion" type="number" step="0.00000001" /></label>
            <label><span>缓存输入价</span><input v-model.number="modelForm.pricing.cachedInputPricePerMillion" type="number" step="0.00000001" /></label>
            <label><span>请求附加费</span><input v-model.number="modelForm.pricing.requestSurcharge" type="number" step="0.00000001" /></label>
            <label><span>加价倍率</span><input v-model.number="modelForm.pricing.markupRatio" type="number" step="0.0001" /></label>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="admin-btn ghost" @click="closeModelModal">取消</button>
          <button class="admin-btn" type="submit">{{ modelModal.mode === 'create' ? '创建' : '保存' }}</button>
        </div>
      </form>
    </div>

    <div v-if="providerModal.visible" class="admin-modal-mask" @click.self="closeProviderModal">
      <form class="admin-modal large" @submit.prevent="submitProvider">
        <div class="modal-head">
          <h2>{{ providerModal.mode === 'create' ? '新增 Provider' : '编辑 Provider' }}</h2>
          <button type="button" @click="closeProviderModal">×</button>
        </div>
        <div v-if="providerModal.error" class="form-error">{{ providerModal.error }}</div>
        <div class="form-grid">
          <label><span>Provider 编码 *</span><input v-model.trim="providerForm.providerCode" :disabled="providerModal.mode !== 'create'" /></label>
          <label><span>展示名</span><input v-model.trim="providerForm.displayName" /></label>
          <label><span>类型</span>
            <select v-model="providerForm.providerType">
              <option value="OPENAI_COMPATIBLE">OPENAI_COMPATIBLE</option>
              <option value="OLLAMA_LOCAL">OLLAMA_LOCAL</option>
            </select>
          </label>
          <label><span>Base URL *</span><input v-model.trim="providerForm.baseUrl" placeholder="https://api.deepseek.com" /></label>
          <label><span>Chat 路径</span><input v-model.trim="providerForm.chatCompletionsPath" /></label>
          <label class="check-row"><input v-model="providerForm.useApiKey" type="checkbox" /> 需要 API Key</label>
          <label class="wide">
            <span>API Key{{ providerModal.mode === 'edit' ? '（留空 = 不修改）' : '' }}</span>
            <input v-model.trim="providerForm.apiKey" type="password" autocomplete="new-password"
                   :placeholder="providerModal.mode === 'edit' ? '留空则保持原 Key 不变' : 'sk-...'" />
          </label>
          <label><span>Key Header</span><input v-model.trim="providerForm.apiKeyHeader" /></label>
          <label><span>Key 前缀</span><input v-model.trim="providerForm.apiKeyPrefix" placeholder="Bearer " /></label>
          <label class="check-row"><input v-model="providerForm.enabled" type="checkbox" /> 启用</label>
        </div>
        <div class="form-actions">
          <button type="button" class="admin-btn ghost" @click="closeProviderModal">取消</button>
          <button class="admin-btn" type="submit">{{ providerModal.mode === 'create' ? '创建' : '保存' }}</button>
        </div>
      </form>
    </div>

    <div v-if="pricingModal.visible" class="admin-modal-mask" @click.self="pricingModal.visible = false">
      <form class="admin-modal" @submit.prevent="submitPricing">
        <div class="modal-head">
          <h2>新增价格</h2>
          <button type="button" @click="pricingModal.visible = false">×</button>
        </div>
        <div v-if="pricingModal.error" class="form-error">{{ pricingModal.error }}</div>
        <div class="form-grid">
          <label><span>Currency</span><input v-model.trim="pricingForm.currency" /></label>
          <label><span>输入价 / 百万 *</span><input v-model.number="pricingForm.promptPricePerMillion" type="number" step="0.00000001" /></label>
          <label><span>输出价 / 百万 *</span><input v-model.number="pricingForm.completionPricePerMillion" type="number" step="0.00000001" /></label>
          <label><span>缓存输入价</span><input v-model.number="pricingForm.cachedInputPricePerMillion" type="number" step="0.00000001" /></label>
          <label><span>请求附加费</span><input v-model.number="pricingForm.requestSurcharge" type="number" step="0.00000001" /></label>
          <label><span>加价倍率</span><input v-model.number="pricingForm.markupRatio" type="number" step="0.0001" /></label>
          <label class="wide"><span>生效时间</span><input v-model.trim="pricingForm.effectiveFrom" placeholder="2026-05-18T10:30:00" /></label>
        </div>
        <div class="form-actions">
          <button type="button" class="admin-btn ghost" @click="pricingModal.visible = false">取消</button>
          <button class="admin-btn" type="submit">保存价格</button>
        </div>
      </form>
    </div>

    <div v-if="quotaModal.visible" class="admin-modal-mask" @click.self="quotaModal.visible = false">
      <form class="admin-modal" @submit.prevent="submitRoleQuota">
        <div class="modal-head">
          <h2>修改 {{ quotaModal.role }} 配额</h2>
          <button type="button" @click="quotaModal.visible = false">×</button>
        </div>
        <p class="modal-hint">配额输入仍然保存为 CNY，后台按 1 CNY = 1,000,000 标准 Token 展示；高级模型因为单价更高，会更快消耗标准 Token。</p>
        <div class="form-grid">
          <label><span>日额度金额 CNY</span><input v-model="quotaForm.dailyLimit" type="number" step="0.01" placeholder="空 = 不限" /></label>
          <label><span>月额度金额 CNY</span><input v-model="quotaForm.monthlyLimit" type="number" step="0.01" placeholder="空 = 不限" /></label>
          <label><span>并发请求</span><input v-model.number="quotaForm.concurrentRequests" type="number" /></label>
          <label class="wide"><span>描述</span><textarea v-model.trim="quotaForm.description" rows="3"></textarea></label>
        </div>
        <div class="quota-preview">
          <QuotaLimitCell :money="quotaForm.dailyLimit" :tokens="moneyToStandardTokens(quotaForm.dailyLimit)" label="日额度预览" />
          <QuotaLimitCell :money="quotaForm.monthlyLimit" :tokens="moneyToStandardTokens(quotaForm.monthlyLimit)" label="月额度预览" />
        </div>
        <div class="form-actions">
          <button type="button" class="admin-btn ghost" @click="quotaModal.visible = false">取消</button>
          <button class="admin-btn" type="submit">保存配额</button>
        </div>
      </form>
    </div>

    <div v-if="modelRolesModal.visible" class="admin-modal-mask" @click.self="modelRolesModal.visible = false">
      <form class="admin-modal" @submit.prevent="submitModelRoles">
        <div class="modal-head">
          <h2>编辑模型开放角色</h2>
          <button type="button" @click="modelRolesModal.visible = false">×</button>
        </div>
        <div class="role-check-grid">
          <label v-for="role in roleOptions" :key="role" class="check-row">
            <input type="checkbox" :value="role" v-model="modelRolesForm.roles" /> {{ role }}
          </label>
        </div>
        <div class="form-actions">
          <button type="button" class="admin-btn ghost" @click="modelRolesModal.visible = false">取消</button>
          <button class="admin-btn" type="submit">保存角色</button>
        </div>
      </form>
    </div>

    <div v-if="markupModal.visible" class="admin-modal-mask" @click.self="markupModal.visible = false">
      <form class="admin-modal" @submit.prevent="submitMarkup">
        <div class="modal-head">
          <h2>调整加价倍率</h2>
          <button type="button" @click="markupModal.visible = false">×</button>
        </div>
        <label class="single-field"><span>markupRatio</span><input v-model.number="markupForm.markupRatio" type="number" step="0.0001" /></label>
        <div class="form-actions">
          <button type="button" class="admin-btn ghost" @click="markupModal.visible = false">取消</button>
          <button class="admin-btn" type="submit">生成新价格记录</button>
        </div>
      </form>
    </div>

    <div v-if="userOverrideModal.visible" class="admin-modal-mask" @click.self="userOverrideModal.visible = false">
      <form class="admin-modal" @submit.prevent="submitUserOverride">
        <div class="modal-head">
          <h2>{{ userOverrideModal.type === 'model' ? '新增模型 override' : '新增配额 override' }}</h2>
          <button type="button" @click="userOverrideModal.visible = false">×</button>
        </div>
        <template v-if="userOverrideModal.type === 'model'">
          <div class="form-grid">
            <label><span>模型编码 *</span><input v-model.trim="userModelOverrideForm.modelCode" /></label>
            <label><span>类型</span><select v-model="userModelOverrideForm.overrideType"><option>GRANT</option><option>DENY</option></select></label>
            <label><span>Workspace</span><input v-model.trim="userModelOverrideForm.workspaceId" placeholder="空 = 全局" /></label>
            <label><span>过期时间</span><input v-model.trim="userModelOverrideForm.expiresAt" placeholder="2026-06-01T00:00:00" /></label>
            <label class="wide"><span>原因</span><textarea v-model.trim="userModelOverrideForm.reason" rows="3"></textarea></label>
          </div>
        </template>
        <template v-else>
          <p class="modal-hint">配额 override 是金额 delta 增量，保存为 CNY；页面会同步折算成标准 Token 便于运营判断。</p>
          <div class="form-grid">
            <label><span>日增量 CNY</span><input v-model.number="userQuotaOverrideForm.dailyDelta" type="number" step="0.01" /></label>
            <label><span>月增量 CNY</span><input v-model.number="userQuotaOverrideForm.monthlyDelta" type="number" step="0.01" /></label>
            <label><span>Workspace</span><input v-model.trim="userQuotaOverrideForm.workspaceId" placeholder="空 = 全局" /></label>
            <label><span>过期时间</span><input v-model.trim="userQuotaOverrideForm.expiresAt" placeholder="2026-06-01T00:00:00" /></label>
            <label class="wide"><span>原因</span><textarea v-model.trim="userQuotaOverrideForm.reason" rows="3"></textarea></label>
          </div>
        </template>
        <div class="form-actions">
          <button type="button" class="admin-btn ghost" @click="userOverrideModal.visible = false">取消</button>
          <button class="admin-btn" type="submit">保存 override</button>
        </div>
      </form>
    </div>

    <div v-if="workspaceModal.visible" class="admin-modal-mask" @click.self="workspaceModal.visible = false">
      <form class="admin-modal" @submit.prevent="submitWorkspace">
        <div class="modal-head">
          <h2>新增 Workspace</h2>
          <button type="button" @click="workspaceModal.visible = false">×</button>
        </div>
        <div class="form-grid">
          <label><span>Workspace ID</span><input v-model.trim="workspaceForm.workspaceId" placeholder="可选" /></label>
          <label><span>Org ID</span><input v-model.trim="workspaceForm.orgId" placeholder="可选" /></label>
          <label><span>组织名</span><input v-model.trim="workspaceForm.orgName" /></label>
          <label><span>空间名 *</span><input v-model.trim="workspaceForm.name" /></label>
          <label><span>Plan Code</span><input v-model.trim="workspaceForm.planCode" /></label>
          <label><span>状态</span><input v-model.trim="workspaceForm.status" /></label>
          <label><span>Owner User ID</span><input v-model.trim="workspaceForm.ownerUserId" /></label>
        </div>
        <div class="form-actions">
          <button type="button" class="admin-btn ghost" @click="workspaceModal.visible = false">取消</button>
          <button class="admin-btn" type="submit">创建 Workspace</button>
        </div>
      </form>
    </div>

    <div v-if="planModal.visible" class="admin-modal-mask" @click.self="planModal.visible = false">
      <form class="admin-modal" @submit.prevent="submitPlan">
        <div class="modal-head">
          <h2>新增套餐</h2>
          <button type="button" @click="planModal.visible = false">×</button>
        </div>
        <div class="form-grid">
          <label><span>Plan Code *</span><input v-model.trim="planForm.planCode" /></label>
          <label><span>展示名 *</span><input v-model.trim="planForm.displayName" /></label>
          <label><span>Tier</span><input v-model.number="planForm.tier" type="number" /></label>
          <label class="check-row"><input v-model="planForm.enabled" type="checkbox" /> 启用</label>
          <label class="wide"><span>描述</span><textarea v-model.trim="planForm.description" rows="3"></textarea></label>
        </div>
        <div class="form-actions">
          <button type="button" class="admin-btn ghost" @click="planModal.visible = false">取消</button>
          <button class="admin-btn" type="submit">创建套餐</button>
        </div>
      </form>
    </div>

    <div v-if="entitlementModal.visible" class="admin-modal-mask" @click.self="entitlementModal.visible = false">
      <form class="admin-modal" @submit.prevent="submitEntitlement">
        <div class="modal-head">
          <h2>新增套餐权益</h2>
          <button type="button" @click="entitlementModal.visible = false">×</button>
        </div>
        <div class="form-grid">
          <label>
            <span>权益类型</span>
            <select v-model="entitlementForm.entitlementType">
              <option>ALLOWED_MODEL</option><option>ALLOWED_PROVIDER</option><option>CAPABILITY</option><option>LIMIT</option>
            </select>
          </label>
          <label>
            <span>Key *</span>
            <select v-if="entitlementForm.entitlementType === 'LIMIT'" v-model="entitlementForm.entitlementKey">
              <option>DAILY_BUDGET</option><option>MONTHLY_BUDGET</option><option>CONCURRENT_REQUESTS</option>
            </select>
            <input v-else v-model.trim="entitlementForm.entitlementKey" placeholder="model/provider/capability" />
          </label>
          <label><span>数值</span><input v-model.number="entitlementForm.valueNumber" type="number" step="0.01" /></label>
          <label><span>文本值</span><input v-model.trim="entitlementForm.valueText" /></label>
          <label class="check-row"><input v-model="entitlementForm.enabled" type="checkbox" /> 启用</label>
        </div>
        <div class="form-actions">
          <button type="button" class="admin-btn ghost" @click="entitlementModal.visible = false">取消</button>
          <button class="admin-btn" type="submit">保存权益</button>
        </div>
      </form>
    </div>

    <div v-if="confirmModal.visible" class="admin-modal-mask" @click.self="confirmModal.visible = false">
      <div class="admin-modal confirm">
        <div class="modal-head">
          <h2>{{ confirmModal.title }}</h2>
          <button type="button" @click="confirmModal.visible = false">×</button>
        </div>
        <p class="confirm-message">{{ confirmModal.message }}</p>
        <div class="form-actions">
          <button type="button" class="admin-btn ghost" @click="confirmModal.visible = false">取消</button>
          <button :class="['admin-btn', confirmModal.danger ? 'danger' : '']" @click="runConfirm">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, onMounted, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, GaugeChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  adminApi,
  clearAdminSession,
  createAdminLoader,
  getAdminProfile,
  getAdminUserId,
  isAdminLoggedIn,
  setAdminSession,
  setAdminUserId
} from '@/api/admin'
import { initTheme } from '@/utils/theme'

echarts.use([BarChart, GaugeChart, LineChart, PieChart, GridComponent, LegendComponent, TitleComponent, TooltipComponent, CanvasRenderer])

const roleOptions = ['GUEST', 'USER', 'PRO', 'PLUS', 'PRO_PLUS', 'VIP', 'ADMIN']
const userStatusOptions = ['ACTIVE', 'INACTIVE', 'BANNED', 'PENDING_VERIFICATION', 'PENDING_REVIEW', 'SUSPENDED', 'RESTRICTED', 'DELETED']
const navItems = [
  { path: '/admin/dashboard', section: 'dashboard', label: '仪表盘', icon: '▦' },
  { path: '/admin/models', section: 'models', label: '模型目录', icon: '◇' },
  { path: '/admin/providers', section: 'providers', label: 'Provider', icon: '⚡' },
  { path: '/admin/roles', section: 'roles', label: '角色配置', icon: '◎' },
  { path: '/admin/users', section: 'users', label: '用户管理', icon: '◌' },
  { path: '/admin/workspaces', section: 'workspaces', label: 'Workspace', icon: '□' },
  { path: '/admin/plans', section: 'plans', label: '套餐权益', icon: '◈' },
  { path: '/admin/usage', section: 'usage', label: '用量监控', icon: '▤' },
  { path: '/admin/rag', section: 'rag', label: 'RAG 监控', icon: '▥' }
]

const usageTabs = [
  { key: 'events', label: '调用流水' },
  { key: 'aggregate', label: '聚合' },
  { key: 'topn', label: 'TopN' },
  { key: 'quota', label: '角色配额' },
  { key: 'timeline', label: '用户 Timeline' }
]
const entitlementTypes = ['ALLOWED_MODEL', 'ALLOWED_PROVIDER', 'CAPABILITY', 'LIMIT']

const EmptyState = defineComponent({
  props: { text: { type: String, default: '暂无数据' } },
  setup(props) {
    return () => h('div', { class: 'empty-state-admin' }, props.text)
  }
})

const LoadingState = defineComponent({
  setup() {
    return () => h('div', { class: 'loading-state-admin' }, '加载中...')
  }
})

const DataState = defineComponent({
  props: {
    loading: { type: Boolean, default: false },
    error: { type: Object, default: null }
  },
  emits: ['retry'],
  setup(props, { slots, emit }) {
    return () => {
      if (props.loading) return h(LoadingState)
      if (props.error) {
        const details = []
        if (props.error.code) details.push(`code: ${props.error.code}`)
        if (props.error.quota) {
          details.push(`daily: ${props.error.quota.dailyUsed ?? '-'} / ${props.error.quota.dailyLimit ?? '-'}`)
          details.push(`monthly: ${props.error.quota.monthlyUsed ?? '-'} / ${props.error.quota.monthlyLimit ?? '-'}`)
          if (props.error.quota.resetAt) details.push(`resetAt: ${props.error.quota.resetAt}`)
        }
        if (props.error.pricingNotConfigured) details.push('请进入模型详情页的价格区域补齐价格配置')
        return h('div', { class: 'error-state-admin' }, [
          h('strong', props.error.message || '请求失败'),
          details.length ? h('p', details.join(' · ')) : null,
          h('button', { class: 'admin-btn ghost', onClick: () => emit('retry') }, '重试')
        ])
      }
      return slots.default?.()
    }
  }
})

const StatusPill = defineComponent({
  props: {
    ok: { type: Boolean, default: true },
    text: { type: String, default: '' }
  },
  setup(props) {
    return () => h('span', { class: ['status-pill', props.ok ? 'ok' : 'bad'] }, props.text)
  }
})

const Pagination = defineComponent({
  props: {
    page: { type: Number, default: 0 },
    totalPages: { type: Number, default: 1 }
  },
  emits: ['prev', 'next'],
  setup(props, { emit }) {
    return () => h('div', { class: 'pagination' }, [
      h('button', { class: 'admin-btn ghost', disabled: props.page <= 0, onClick: () => emit('prev') }, '上一页'),
      h('span', `第 ${props.page + 1} / ${Math.max(props.totalPages || 1, 1)} 页`),
      h('button', { class: 'admin-btn ghost', disabled: props.page + 1 >= Math.max(props.totalPages || 1, 1), onClick: () => emit('next') }, '下一页')
    ])
  }
})

const chartPalette = ['#2d8659', '#0ea5a4', '#2563eb', '#d97706', '#7c3aed', '#dc2626', '#64748b', '#14b8a6']

const AdminChart = defineComponent({
  props: {
    option: { type: Object, default: () => ({}) },
    height: { type: Number, default: 260 }
  },
  setup(props) {
    const el = ref(null)
    const chart = shallowRef(null)
    let resizeObserver = null
    const render = () => {
      if (!el.value) return
      if (!chart.value) chart.value = echarts.init(el.value, null, { renderer: 'canvas' })
      chart.value.setOption(props.option || {}, true)
    }
    onMounted(() => {
      render()
      resizeObserver = new ResizeObserver(() => chart.value?.resize())
      resizeObserver.observe(el.value)
    })
    onBeforeUnmount(() => {
      resizeObserver?.disconnect()
      chart.value?.dispose()
      chart.value = null
    })
    watch(() => props.option, async () => { await nextTick(); render() }, { deep: true })
    return () => h('div', { ref: el, class: 'admin-echart', style: { height: `${props.height}px` } })
  }
})

const MiniBarChart = defineComponent({
  props: {
    rows: { type: Array, default: () => [] },
    labelKey: { type: String, default: 'dimension' },
    valueKey: { type: String, default: 'cost' },
    money: { type: Boolean, default: false },
    title: { type: String, default: '' },
    type: { type: String, default: 'bar' },
    height: { type: Number, default: 260 }
  },
  setup(props) {
    return () => {
      const rows = props.rows || []
      if (!rows.length) return h('div', { class: 'empty-state-admin' }, '暂无图表数据')
      const chartRows = rows.slice(0, 10)
      return h(AdminChart, {
        height: props.height,
        option: props.type === 'pie'
          ? pieOption(chartRows, props.labelKey, props.valueKey, props.title, props.money)
          : barOption(chartRows, props.labelKey, props.valueKey, props.title, props.money)
      })
    }
  }
})

const QuotaLimitCell = defineComponent({
  props: {
    money: { default: null },
    tokens: { default: null },
    label: { type: String, default: '' }
  },
  setup(props) {
    return () => h('div', { class: 'quota-limit-cell' }, [
      props.label ? h('span', { class: 'quota-label' }, props.label) : null,
      h('strong', props.money === null || props.money === undefined || props.money === '' ? '不限' : compactNumber(props.tokens ?? moneyToStandardTokens(props.money))),
      h('small', props.money === null || props.money === undefined || props.money === '' ? '金额不限' : formatCny(props.money, 2))
    ])
  }
})

const QuotaProgress = defineComponent({
  props: {
    quota: { type: Object, default: null },
    label: { type: String, default: '' },
    large: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const quota = props.quota || {}
      const unlimited = !!quota.unlimited
      const percent = quotaPercent(quota)
      const tokenUsed = quotaTokenUsed(quota)
      const tokenLimit = quotaTokenLimit(quota)
      const tokenRemaining = quotaTokenRemaining(quota)
      return h('div', { class: ['quota-progress', props.large ? 'large' : ''] }, [
        h('div', { class: 'quota-progress-head' }, [
          h('span', props.label || quota.period || '额度'),
          h('strong', unlimited ? '不限' : `${percent.toFixed(1)}%`)
        ]),
        h('div', { class: 'quota-progress-track' }, [
          h('div', { class: ['quota-progress-fill', percent >= 90 ? 'danger' : percent >= 70 ? 'warn' : ''], style: { width: `${unlimited ? 100 : Math.min(percent, 100)}%` } })
        ]),
        h('div', { class: 'quota-progress-meta' }, [
          h('span', `已用 ${compactNumber(tokenUsed)}`),
          h('span', unlimited ? '剩余 不限' : `剩余 ${compactNumber(tokenRemaining)}`),
          h('span', unlimited ? `${formatCny(quotaMoneyUsed(quota), 2)} / 不限` : `${formatCny(quotaMoneyUsed(quota), 2)} / ${formatCny(quotaMoneyLimit(quota), 2)}`)
        ]),
        quota.rawTokenUsed !== undefined && quota.rawTokenUsed !== null
          ? h('small', { class: 'quota-raw-token' }, `原始 Token ${compactNumber(quota.rawTokenUsed)}`)
          : null
      ])
    }
  }
})

const { loading, errors, run } = createAdminLoader()
const toast = ref(null)
const adminUserIdInput = ref(getAdminUserId())
const adminAuthenticated = ref(isAdminLoggedIn())
const adminProfile = ref(getAdminProfile())
const loginLoading = ref(false)
const loginError = ref('')
const loginForm = reactive({ username: '', password: '' })
const route = reactive({ path: window.location.pathname, section: 'dashboard', id: null })

const dashboard = reactive({
  todayCalls: 0,
  todayCost: 0,
  todayTokens: 0,
  todayStandardTokens: 0,
  successCalls: 0,
  failedCalls: 0,
  blockedCalls: 0,
  failureRate: 0,
  blockedUserCount: 0,
  aggregate: [],
  topModels: []
})

const models = ref([])
const modelDetail = ref({})
const modelPricing = ref([])
const modelRoles = ref([])
const roles = ref([])
const activeRole = ref('USER')
const roleQuota = ref({})
const roleModels = ref([])
const roleReplaceText = ref('')
const roleModelToGrant = ref('')

const users = ref([])
const userFilters = reactive({ q: '', role: '' })
const userPage = reactive({ page: 0, size: 20, totalPages: 1 })
const selectedUser = ref({})
const userEditRole = ref('USER')
const userEditStatus = ref('ACTIVE')
const effectiveModels = ref([])
const effectiveQuota = ref({})
const userRecentUsage = ref([])

const workspaces = ref([])
const workspaceFilters = reactive({ q: '', planCode: '' })
const workspacePage = reactive({ page: 0, size: 20, totalPages: 1 })
const selectedWorkspace = ref({})
const workspaceEdit = reactive({ name: '', planCode: '', status: 'ACTIVE' })
const workspaceMemberForm = reactive({ userId: '', memberRole: 'MEMBER' })

const plans = ref([])
const planEntitlements = ref([])

const usageTab = ref('events')
const usageEvents = ref([])
const usageAggregate = ref([])
const usageTopN = ref([])
const quotaStatus = ref([])
const usageTimeline = ref([])
const usageEventFilters = reactive({ userId: '', workspaceId: '', modelCode: '', status: '', from: todayStartIso(), to: '' })
const usageEventPage = reactive({ page: 0, size: 50, totalPages: 1 })
const usageAggregateFilters = reactive({ groupBy: 'model', from: todayStartIso(), to: '' })
const usageTopFilters = reactive({ dimension: 'model', metric: 'standardTokens', n: 10, from: todayStartIso(), to: '' })
const quotaStatusRole = ref('')
const timelineUserId = ref('')

const ragOverview = reactive({
  documentCount: 0,
  chunkCount: 0,
  estimatedTokens: 0,
  declaredChunkCount: 0,
  documentStatus: [],
  eventFileStatus: [],
  eventRagStatus: [],
  ownerUsage: [],
  recentEvents: []
})
const ragDocuments = ref([])
const ragFilters = reactive({ q: '', ownerFolder: '', sessionId: '', fileId: '', status: '' })
const ragPage = reactive({ page: 0, size: 30, totalPages: 1 })

const modelModal = reactive({ visible: false, mode: 'create', error: '' })
const modelForm = reactive(defaultModelForm())
const providers = ref([])
const providerModal = reactive({ visible: false, mode: 'create', error: '' })
const providerForm = reactive(defaultProviderForm())
const pricingModal = reactive({ visible: false, code: '', error: '' })
const pricingForm = reactive(defaultPricingForm())
const quotaModal = reactive({ visible: false, role: '' })
const quotaForm = reactive({ dailyLimit: '', monthlyLimit: '', concurrentRequests: 3, description: '' })
const modelRolesModal = reactive({ visible: false })
const modelRolesForm = reactive({ roles: [] })
const markupModal = reactive({ visible: false })
const markupForm = reactive({ markupRatio: 1 })
const userOverrideModal = reactive({ visible: false, type: 'model' })
const userModelOverrideForm = reactive({ modelCode: '', overrideType: 'GRANT', workspaceId: '', enabled: true, reason: '', expiresAt: '' })
const userQuotaOverrideForm = reactive({ workspaceId: '', dailyDelta: 0, monthlyDelta: 0, reason: '', expiresAt: '' })
const workspaceModal = reactive({ visible: false })
const workspaceForm = reactive({ workspaceId: '', orgId: '', orgName: '', name: '', planCode: '', status: 'ACTIVE', ownerUserId: '' })
const planModal = reactive({ visible: false })
const planForm = reactive({ planCode: '', displayName: '', tier: 10, description: '', enabled: true })
const entitlementModal = reactive({ visible: false })
const entitlementForm = reactive({ entitlementType: 'LIMIT', entitlementKey: 'DAILY_BUDGET', valueNumber: null, valueText: '', enabled: true })
const confirmModal = reactive({ visible: false, title: '', message: '', danger: false, action: null })

const pageTitle = computed(() => {
  const item = navItems.find((nav) => nav.section === route.section)
  if (route.id && item) return `${item.label} / ${route.id}`
  return item?.label || '后台管理'
})
const topbarTitle = computed(() => route.section === 'dashboard' ? pageTitle.value : '管理后台')

const modelDetailModel = computed(() => modelOf(modelDetail.value))
const normalizedModelRoles = computed(() => normalizeStringList(modelRoles.value, 'role'))
const normalizedRoleModels = computed(() => normalizeStringList(roleModels.value, 'modelCode'))
const effectiveModelCodes = computed(() => normalizeStringList(effectiveModels.value, 'modelCode'))
const userModelOverrides = computed(() => selectedUser.value.modelOverrides || selectedUser.value.modelPermissionOverrides || selectedUser.value.overrides?.models || [])
const userQuotaOverrides = computed(() => selectedUser.value.quotaOverrides || selectedUser.value.overrides?.quota || [])
const workspaceMembers = computed(() => selectedWorkspace.value.members || selectedWorkspace.value.workspaceMembers || [])
const userRoleChartRows = computed(() => countBy(users.value, (row) => userOf(row).userRole || userOf(row).role || 'UNKNOWN'))
const userStatusChartRows = computed(() => countBy(users.value, (row) => userOf(row).userStatus || userOf(row).status || 'UNKNOWN'))
const usageTopMetricKey = computed(() => usageTopFilters.metric === 'tokens' ? 'tokens' : usageTopFilters.metric === 'cost' ? 'cost' : 'standardTokens')
const dashboardFailurePercent = computed(() => Number(dashboard.failureRate || 0) * 100)
const dashboardBlockedPercent = computed(() => dashboard.todayCalls > 0 ? (Number(dashboard.blockedCalls || 0) / Number(dashboard.todayCalls || 1)) * 100 : 0)
const dashboardStatusRows = computed(() => [
  { dimension: 'SUCCESS', count: dashboard.successCalls },
  { dimension: 'FAILED', count: dashboard.failedCalls },
  { dimension: 'BLOCKED', count: dashboard.blockedCalls }
].filter((row) => Number(row.count || 0) > 0))
const modelProviderRows = computed(() => countBy(models.value, (row) => modelOf(row).providerCode || 'UNKNOWN'))
const modelLevelRows = computed(() => countBy(models.value, (row) => `Level ${modelOf(row).level ?? '-'}`))
const modelPriceStatusRows = computed(() => [
  { dimension: '已有当前价格', count: models.value.filter((row) => !!pricingOf(row)).length },
  { dimension: '缺当前价格', count: models.value.filter((row) => !pricingOf(row)).length }
].filter((row) => row.count > 0))
const modelStats = computed(() => {
  const total = models.value.length
  const enabled = models.value.filter((row) => enabledOf(row) !== false).length
  const pricedRows = models.value.filter((row) => !!pricingOf(row))
  const completionTotal = pricedRows.reduce((sum, row) => sum + Number(pricingOf(row)?.completionPricePerMillion || 0), 0)
  return {
    total,
    enabled,
    disabled: total - enabled,
    priced: pricedRows.length,
    missingPricing: total - pricedRows.length,
    pricedRate: total ? pricedRows.length / total : 0,
    avgCompletion: pricedRows.length ? completionTotal / pricedRows.length : 0
  }
})
const usageEventStatusRows = computed(() => countBy(usageEvents.value, (row) => row.status || 'UNKNOWN'))
const usageEventModelRows = computed(() => aggregateEventsBy(usageEvents.value, (row) => row.modelCode || 'unknown'))
const timelineModelRows = computed(() => aggregateEventsBy(usageTimeline.value, (row) => row.modelCode || 'unknown'))
const timelineSeriesRows = computed(() => [...usageTimeline.value]
  .slice()
  .reverse()
  .map((event, index) => ({
    dimension: formatTimeLabel(event.createdAt || event.createdTime, index),
    standardTokens: eventStandardTokens(event),
    cost: eventCost(event)
  })))
const recentRagEvents = computed(() => extractList(ragOverview.recentEvents))

function defaultModelForm() {
  return {
    modelCode: '',
    displayName: '',
    providerCode: '',
    apiModelName: '',
    level: 1,
    score: 50,
    localModel: false,
    supportsStream: true,
    enabled: true,
    description: '',
    pricing: defaultPricingForm()
  }
}

function defaultPricingForm() {
  return {
    currency: 'CNY',
    promptPricePerMillion: '',
    completionPricePerMillion: '',
    cachedInputPricePerMillion: '',
    requestSurcharge: 0,
    markupRatio: 1,
    effectiveFrom: '',
    enabled: true
  }
}

function todayStartIso() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T00:00:00`
}

function parseRoute() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/admin/dashboard'
  const parts = path.split('/').filter(Boolean)
  route.path = path
  route.section = parts[1] || 'dashboard'
  route.id = parts[2] ? decodeURIComponent(parts[2]) : null
  if (route.section === 'admin') route.section = 'dashboard'
}

function go(path) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path)
  }
  parseRoute()
  loadCurrent()
}

function saveAdminUser() {
  setAdminUserId(adminUserIdInput.value)
  adminAuthenticated.value = isAdminLoggedIn()
  showToast('管理员用户 ID 已保存')
  reloadCurrent()
}

async function submitAdminLogin() {
  if (!loginForm.username || !loginForm.password) {
    loginError.value = '用户名和密码必填'
    return
  }
  loginLoading.value = true
  loginError.value = ''
  try {
    const session = await adminApi.login({ username: loginForm.username, password: loginForm.password })
    setAdminSession(session)
    adminUserIdInput.value = getAdminUserId()
    adminProfile.value = session.user || getAdminProfile()
    adminAuthenticated.value = true
    loginForm.password = ''
    parseRoute()
    if (route.section === 'admin') go('/admin/dashboard')
    else await loadCurrent()
  } catch (error) {
    loginError.value = error.message || '登录失败'
  } finally {
    loginLoading.value = false
  }
}

async function logoutAdmin() {
  try {
    await adminApi.logout().catch(() => {})
  } finally {
    clearAdminSession()
    adminAuthenticated.value = false
    adminProfile.value = null
    adminUserIdInput.value = ''
  }
}

function showToast(message, type = 'success') {
  toast.value = { message, type }
  window.clearTimeout(showToast.timer)
  showToast.timer = window.setTimeout(() => { toast.value = null }, 3500)
}

function showError(error) {
  if (error?.authExpired) {
    clearAdminSession()
    adminAuthenticated.value = false
    adminProfile.value = null
  }
  showToast(error?.message || '操作失败', 'error')
}

function extractList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.records)) return data.records
  if (Array.isArray(data?.data)) return data.data
  return []
}

function applyPage(target, data, fallbackSize) {
  target.page = data?.number ?? data?.page ?? target.page ?? 0
  target.size = data?.size ?? target.size ?? fallbackSize
  target.totalPages = data?.totalPages ?? Math.max(1, Math.ceil((data?.totalElements || extractList(data).length || 0) / (target.size || fallbackSize)))
  target.totalElements = data?.totalElements ?? extractList(data).length
}

function modelOf(row = {}) {
  if (row.model?.model) return row.model.model
  return row.model || row.definition || row
}

function userOf(row = {}) {
  return row.user?.user || row.user || row
}

function modelCodeOf(row = {}) {
  const model = modelOf(row)
  return model.modelCode || model.code || row.modelCode || row.code || ''
}

function isActivePricing(item, at = Date.now()) {
  if (!item || item.enabled === false) return false
  const from = item.effectiveFrom ? new Date(item.effectiveFrom).getTime() : 0
  const to = item.effectiveTo ? new Date(item.effectiveTo).getTime() : Infinity
  return from <= at && at < to
}

function pricingCandidatesOf(row = {}) {
  return [
    row.activePricing,
    row.currentPricing,
    row.model?.activePricing,
    row.model?.currentPricing,
    modelOf(row).activePricing,
    modelOf(row).currentPricing
  ].filter(Boolean)
}

function pricingListOf(row = {}) {
  if (Array.isArray(row.pricing)) return row.pricing
  if (Array.isArray(row.prices)) return row.prices
  if (Array.isArray(row.model?.pricing)) return row.model.pricing
  return []
}

function pricingOf(row = {}) {
  const now = Date.now()
  const activeCandidate = pricingCandidatesOf(row).find((item) => isActivePricing(item, now))
  if (activeCandidate) return activeCandidate
  const list = pricingListOf(row)
  const active = list.find((item) => isActivePricing(item, now))
  if (active) return active
  if (row.pricing && typeof row.pricing === 'object' && !Array.isArray(row.pricing) && isActivePricing(row.pricing, now)) return row.pricing
  return null
}

function latestPricingOf(row = {}) {
  const all = [...pricingCandidatesOf(row), ...pricingListOf(row)]
    .filter(Boolean)
    .sort((a, b) => new Date(b.effectiveFrom || 0).getTime() - new Date(a.effectiveFrom || 0).getTime())
  return all[0] || null
}

function pricingStatusText(row = {}) {
  const latest = latestPricingOf(row)
  if (!latest) return '没有任何价格快照'
  if (latest.enabled === false) return '最近价格已停用'
  const now = Date.now()
  const from = latest.effectiveFrom ? new Date(latest.effectiveFrom).getTime() : 0
  const to = latest.effectiveTo ? new Date(latest.effectiveTo).getTime() : Infinity
  if (from > now) return `价格将在 ${formatDateShort(latest.effectiveFrom)} 生效`
  if (to <= now) return `最近价格已在 ${formatDateShort(latest.effectiveTo)} 失效`
  return '未命中活跃价格'
}

function enabledOf(row = {}) {
  if (row.model && typeof row.model === 'object' && 'enabled' in row.model) return row.model.enabled
  if ('enabled' in row) return row.enabled
  return true
}

function last24hCallsOf(row = {}) {
  return row.last24hCalls || row.last24HoursCalls || row.model?.last24hCalls || 0
}

function roleName(role = {}) {
  return typeof role === 'string' ? role : role.role || role.name || role.code || ''
}

function userIdOf(user = {}) {
  const base = userOf(user)
  return base.userId || base.id || ''
}

function workspaceIdOf(workspace = {}) {
  return workspace.workspaceId || workspace.id || ''
}

function planCodeOf(plan = {}) {
  return plan.planCode || plan.code || ''
}

function workspacePlanCode(workspace = {}) {
  return workspace.planCode || workspace.plan?.planCode || ''
}

function workspacePlanLabel(workspace = {}) {
  const code = workspacePlanCode(workspace)
  if (!code) return '个人空间'
  const plan = plans.value.find((item) => planCodeOf(item) === code)
  return plan?.displayName ? `${plan.displayName} (${code})` : code
}

function dimensionOf(row = {}) {
  return row.dimension || row.key || row.modelCode || row.userId || row.workspaceId || row.providerCode || '-'
}

function eventCost(event = {}) {
  return event.costBilled ?? event.billedCost ?? event.cost ?? 0
}

function standardTokensOf(row = {}) {
  return row.standardTokens ?? row.standard_tokens ?? moneyToStandardTokens(row.cost || 0)
}

function eventStandardTokens(event = {}) {
  return event.standardTokens ?? event.standard_tokens ?? moneyToStandardTokens(eventCost(event))
}

function aggregateEventsBy(list, picker) {
  const bucket = new Map()
  ;(list || []).forEach((event) => {
    const dimension = picker(event) || 'unknown'
    const current = bucket.get(dimension) || { dimension, calls: 0, tokens: 0, standardTokens: 0, cost: 0 }
    current.calls += 1
    current.tokens += Number(event.tokens || event.totalTokens || 0)
    current.standardTokens += Number(eventStandardTokens(event) || 0)
    current.cost += Number(eventCost(event) || 0)
    bucket.set(dimension, current)
  })
  return Array.from(bucket.values()).sort((a, b) => b.standardTokens - a.standardTokens)
}

function normalizeStringList(value, field) {
  const list = Array.isArray(value) ? value : extractList(value)
  return list.map((item) => {
    if (typeof item === 'string') return item
    return item?.[field] || item?.code || item?.modelCode || item?.role || item?.dimension || ''
  }).filter(Boolean)
}

function countBy(list, picker) {
  const bucket = new Map()
  ;(list || []).forEach((item) => {
    const key = picker(item) || 'UNKNOWN'
    bucket.set(key, (bucket.get(key) || 0) + 1)
  })
  return Array.from(bucket.entries())
    .map(([dimension, count]) => ({ dimension, count }))
    .sort((a, b) => b.count - a.count)
}

function rowValue(row = {}, key) {
  return key ? row?.[key] : undefined
}

function chartTooltipValue(value, money = false) {
  return money ? formatCny(value, 4) : compactNumber(value)
}

function gradientColor(start, end) {
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: start },
    { offset: 1, color: end }
  ])
}

function baseChartTextStyle() {
  return {
    color: '#334155',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  }
}

function barOption(rows, labelKey, valueKey, title = '', money = false) {
  const labels = rows.map((row) => row?.[labelKey] || row?.dimension || row?.role || '-')
  const values = rows.map((row) => Number(rowValue(row, valueKey) || 0))
  return {
    color: chartPalette,
    textStyle: baseChartTextStyle(),
    title: title ? { text: title, left: 2, top: 0, textStyle: { fontSize: 12, fontWeight: 800, color: '#6b8f80' } } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: 'rgba(74,157,111,0.18)',
      textStyle: { color: '#1f2933' },
      formatter: (params) => {
        const item = params?.[0]
        return `${item?.name || '-'}<br/>${chartTooltipValue(item?.value || 0, money)}`
      }
    },
    grid: { left: 8, right: 12, bottom: 24, top: title ? 38 : 12, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: '#7b9b8f', interval: 0, rotate: labels.length > 5 ? 24 : 0, overflow: 'truncate' },
      axisLine: { lineStyle: { color: 'rgba(74,157,111,0.16)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#7b9b8f', formatter: (value) => money ? `¥${Number(value).toFixed(0)}` : compactNumber(value) },
      splitLine: { lineStyle: { color: 'rgba(74,157,111,0.10)' } }
    },
    series: [{
      type: 'bar',
      data: values,
      barMaxWidth: 36,
      itemStyle: {
        borderRadius: [8, 8, 2, 2],
        color: gradientColor('#35a36f', '#0ea5a4')
      },
      emphasis: { focus: 'series' },
      animationDuration: 650,
      animationEasing: 'cubicOut'
    }]
  }
}

function pieOption(rows, labelKey, valueKey, title = '', money = false) {
  return {
    color: chartPalette,
    textStyle: baseChartTextStyle(),
    title: title ? { text: title, left: 2, top: 0, textStyle: { fontSize: 12, fontWeight: 800, color: '#6b8f80' } } : undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: 'rgba(74,157,111,0.18)',
      textStyle: { color: '#1f2933' },
      formatter: (item) => `${item.name}<br/>${chartTooltipValue(item.value, money)} (${item.percent}%)`
    },
    legend: {
      orient: 'vertical',
      right: 4,
      top: title ? 34 : 10,
      itemWidth: 9,
      itemHeight: 9,
      textStyle: { color: '#6b8f80', fontSize: 11 }
    },
    series: [{
      type: 'pie',
      radius: ['48%', '72%'],
      center: ['36%', '56%'],
      minAngle: 4,
      avoidLabelOverlap: true,
      label: { color: '#334155', formatter: '{b}\n{d}%' },
      labelLine: { lineStyle: { color: 'rgba(74,157,111,0.28)' } },
      itemStyle: { borderColor: '#fff', borderWidth: 3, borderRadius: 6 },
      data: rows.map((row) => ({
        name: row?.[labelKey] || row?.dimension || row?.role || '-',
        value: Number(rowValue(row, valueKey) || 0)
      })),
      animationDuration: 700,
      animationEasing: 'cubicOut'
    }]
  }
}

function lineAreaOption(rows, labelKey, valueKey, title = '', money = false) {
  const labels = rows.map((row) => row?.[labelKey] || row?.dimension || row?.createdAt || '-')
  const values = rows.map((row) => Number(rowValue(row, valueKey) || 0))
  return {
    color: ['#2d8659'],
    textStyle: baseChartTextStyle(),
    title: title ? { text: title, left: 2, top: 0, textStyle: { fontSize: 12, fontWeight: 800, color: '#6b8f80' } } : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: 'rgba(74,157,111,0.18)',
      formatter: (params) => {
        const item = params?.[0]
        return `${item?.name || '-'}<br/>${chartTooltipValue(item?.value || 0, money)}`
      }
    },
    grid: { left: 8, right: 12, bottom: 24, top: title ? 38 : 14, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLabel: { color: '#7b9b8f', hideOverlap: true },
      axisLine: { lineStyle: { color: 'rgba(74,157,111,0.16)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#7b9b8f', formatter: (value) => money ? `¥${Number(value).toFixed(0)}` : compactNumber(value) },
      splitLine: { lineStyle: { color: 'rgba(74,157,111,0.10)' } }
    },
    series: [{
      type: 'line',
      data: values,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 3, color: '#2d8659' },
      areaStyle: {
        color: gradientColor('rgba(45,134,89,0.28)', 'rgba(45,134,89,0.02)')
      },
      animationDuration: 700
    }]
  }
}

function gaugeOption(value, title = '使用率') {
  const percent = Math.max(0, Math.min(100, Number(value || 0)))
  return {
    series: [{
      type: 'gauge',
      radius: '92%',
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: 100,
      progress: { show: true, width: 13, roundCap: true, itemStyle: { color: percent > 85 ? '#dc2626' : percent > 65 ? '#d97706' : '#2d8659' } },
      axisLine: { lineStyle: { width: 13, color: [[1, 'rgba(74,157,111,0.10)']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: false },
      anchor: { show: false },
      title: { offsetCenter: [0, '35%'], color: '#6b8f80', fontSize: 12 },
      detail: { valueAnimation: true, formatter: '{value}%', color: '#1f2933', fontSize: 24, fontWeight: 800, offsetCenter: [0, '0%'] },
      data: [{ value: Number(percent.toFixed(1)), name: title }]
    }]
  }
}

function formatNumber(value) {
  const num = Number(value || 0)
  return new Intl.NumberFormat('zh-CN').format(num)
}

function compactNumber(value) {
  const num = Number(value || 0)
  if (Math.abs(num) >= 1000000) return `${(num / 1000000).toFixed(2)}M`
  if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(1)}K`
  return formatNumber(num)
}

function formatCny(value, digits = 4) {
  const num = Number(value || 0)
  return `¥${num.toFixed(digits)}`
}

function formatBytes(value) {
  const num = Number(value || 0)
  if (num >= 1024 * 1024 * 1024) return `${(num / 1024 / 1024 / 1024).toFixed(2)} GB`
  if (num >= 1024 * 1024) return `${(num / 1024 / 1024).toFixed(2)} MB`
  if (num >= 1024) return `${(num / 1024).toFixed(1)} KB`
  return `${formatNumber(num)} B`
}

function formatTimeLabel(value, fallbackIndex = 0) {
  if (!value) return `#${fallbackIndex + 1}`
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(5, 16)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDateShort(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).replace('T', ' ').slice(0, 16)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function nullableMoney(value, digits = 4) {
  return value === null || value === undefined || value === '' ? '-' : formatCny(value, digits)
}

function formatPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(2)}%`
}

function limitText(value) {
  return value === null || value === undefined || value === '' ? '不限' : formatCny(value, 2)
}

function quotaLine(item) {
  if (!item) return '-'
  const used = formatCny(item.used || 0, 2)
  if (item.unlimited) return `${used} / 不限`
  return `${used} / ${formatCny(item.limit || 0, 2)}`
}

function moneyToStandardTokens(value) {
  if (value === null || value === undefined || value === '') return null
  return Math.round(Number(value || 0) * 1000000)
}

function quotaMoneyUsed(quota = {}) {
  return Number(quota.moneyUsed ?? quota.used ?? 0)
}

function quotaMoneyLimit(quota = {}) {
  return Number(quota.moneyLimit ?? quota.limit ?? 0)
}

function quotaTokenUsed(quota = {}) {
  return Number(quota.tokenUsed ?? moneyToStandardTokens(quotaMoneyUsed(quota)) ?? 0)
}

function quotaTokenLimit(quota = {}) {
  return quota.tokenLimit ?? moneyToStandardTokens(quota.moneyLimit ?? quota.limit)
}

function quotaTokenRemaining(quota = {}) {
  const explicit = quota.tokenRemaining
  if (explicit !== null && explicit !== undefined) return Number(explicit)
  const limit = quotaTokenLimit(quota)
  if (limit === null || limit === undefined) return 0
  return Math.max(0, Number(limit) - quotaTokenUsed(quota))
}

function quotaPercent(quota = {}) {
  if (quota.usagePercent !== null && quota.usagePercent !== undefined) return Number(quota.usagePercent || 0)
  const limit = Number(quotaTokenLimit(quota) || 0)
  if (!limit || quota.unlimited) return 0
  return Math.min(100, (quotaTokenUsed(quota) / limit) * 100)
}

function totalQuotaUsed(list, key) {
  return (list || []).reduce((sum, row) => sum + quotaTokenUsed(row?.[key] || {}), 0)
}

function totalQuotaRemaining(list, key) {
  return (list || []).reduce((sum, row) => sum + quotaTokenRemaining(row?.[key] || {}), 0)
}

function totalQuotaMoneyUsed(list, key) {
  return (list || []).reduce((sum, row) => sum + quotaMoneyUsed(row?.[key] || {}), 0)
}

function cleanPayload(data) {
  const out = {}
  Object.entries(data).forEach(([key, value]) => {
    if (value !== '') out[key] = value
  })
  return out
}

function resetReactive(target, source) {
  Object.keys(target).forEach((key) => delete target[key])
  Object.assign(target, source)
}

function askConfirm({ title, message, danger = false, action }) {
  confirmModal.visible = true
  confirmModal.title = title
  confirmModal.message = message
  confirmModal.danger = danger
  confirmModal.action = action
}

async function runConfirm() {
  const action = confirmModal.action
  confirmModal.visible = false
  if (action) await action()
}

async function loadCurrent() {
  if (route.section === 'dashboard') return loadDashboard()
  if (route.section === 'models') return route.id ? loadModelDetail(route.id) : loadModels()
  if (route.section === 'providers') return loadProviders()
  if (route.section === 'roles') return loadRolesPage()
  if (route.section === 'users') return route.id ? loadUserDetail(route.id) : loadUsersPage()
  if (route.section === 'workspaces') return route.id ? loadWorkspaceDetail(route.id) : loadWorkspacesPage()
  if (route.section === 'plans') return route.id ? loadPlanDetail(route.id) : loadPlans()
  if (route.section === 'usage') return loadUsagePage()
  if (route.section === 'rag') return loadRagPage()
}

function reloadCurrent() {
  loadCurrent()
}

async function loadDashboard() {
  const from = todayStartIso()
  await run('dashboard', async () => {
    const [aggregate, top, blocked] = await Promise.all([
      adminApi.getUsageAggregate({ groupBy: 'model', from }),
      adminApi.getUsageTopN({ dimension: 'model', metric: 'standardTokens', from, n: 5 }),
      adminApi.getUsageEvents({ status: 'BLOCKED_BY_QUOTA', from, page: 0, size: 100 })
    ])
    const aggregateList = extractList(aggregate)
    const topList = extractList(top)
    const blockedList = extractList(blocked)
    const calls = aggregateList.reduce((sum, row) => sum + Number(row.calls || 0), 0)
    const success = aggregateList.reduce((sum, row) => sum + Number(row.successCalls || 0), 0)
    const failed = aggregateList.reduce((sum, row) => sum + Number(row.failedCalls || row.failures || row.failed || 0), 0)
    const blockedCalls = aggregateList.reduce((sum, row) => sum + Number(row.blockedCalls || 0), 0) || blockedList.length
    dashboard.aggregate = aggregateList
    dashboard.topModels = topList
    dashboard.todayCalls = Math.max(calls, success + failed + blockedCalls)
    dashboard.todayCost = aggregateList.reduce((sum, row) => sum + Number(row.cost || 0), 0)
    dashboard.todayTokens = aggregateList.reduce((sum, row) => sum + Number(row.tokens || 0), 0)
    dashboard.todayStandardTokens = aggregateList.reduce((sum, row) => sum + Number(standardTokensOf(row) || 0), 0)
    dashboard.successCalls = success
    dashboard.failedCalls = failed || Math.max(calls - success, 0)
    dashboard.blockedCalls = blockedCalls
    dashboard.failureRate = calls > 0 ? (failed || Math.max(calls - success, 0)) / calls : 0
    dashboard.blockedUserCount = new Set(blockedList.map((row) => row.userId).filter(Boolean)).size || blockedList.length
  })
}

function topModelPercent(item) {
  const max = Math.max(...dashboard.topModels.map((row) => Number(standardTokensOf(row) || 0)), 1)
  return Math.max(4, Math.round((Number(standardTokensOf(item) || 0) / max) * 100))
}

async function loadModels() {
  await run('models', async () => {
    models.value = extractList(await adminApi.getModels())
  })
}

function defaultProviderForm() {
  return {
    providerCode: '',
    displayName: '',
    providerType: 'OPENAI_COMPATIBLE',
    baseUrl: '',
    chatCompletionsPath: '/v1/chat/completions',
    useApiKey: true,
    apiKey: '',
    apiKeyHeader: 'Authorization',
    apiKeyPrefix: 'Bearer ',
    enabled: true
  }
}

async function loadProviders() {
  await run('providers', async () => {
    providers.value = extractList(await adminApi.getProviders())
  })
}

function openProviderCreate() {
  providerModal.visible = true
  providerModal.mode = 'create'
  providerModal.error = ''
  resetReactive(providerForm, defaultProviderForm())
}

function openProviderEdit(row) {
  providerModal.visible = true
  providerModal.mode = 'edit'
  providerModal.error = ''
  resetReactive(providerForm, {
    ...defaultProviderForm(),
    providerCode: row.providerCode,
    displayName: row.displayName || '',
    providerType: row.providerType || 'OPENAI_COMPATIBLE',
    baseUrl: row.baseUrl || '',
    chatCompletionsPath: row.chatCompletionsPath || '/v1/chat/completions',
    useApiKey: row.useApiKey !== false,
    apiKey: '',
    apiKeyHeader: row.apiKeyHeader || 'Authorization',
    apiKeyPrefix: row.apiKeyPrefix || '',
    enabled: row.enabled !== false
  })
}

function closeProviderModal() {
  providerModal.visible = false
}

function validateProviderForm() {
  if (!providerForm.providerCode) return 'providerCode 必填'
  if (!providerForm.baseUrl) return 'baseUrl 必填'
  return ''
}

async function submitProvider() {
  const error = validateProviderForm()
  if (error) {
    providerModal.error = error
    return
  }
  const payload = {
    displayName: providerForm.displayName,
    providerType: providerForm.providerType,
    baseUrl: providerForm.baseUrl,
    chatCompletionsPath: providerForm.chatCompletionsPath,
    useApiKey: providerForm.useApiKey,
    apiKeyHeader: providerForm.apiKeyHeader,
    apiKeyPrefix: providerForm.apiKeyPrefix,
    enabled: providerForm.enabled
  }
  // 仅当填写了 API Key 才提交（编辑时留空 = 保持原 Key 不变）。
  if (providerForm.apiKey) payload.apiKey = providerForm.apiKey
  try {
    if (providerModal.mode === 'create') {
      payload.providerCode = providerForm.providerCode
      await adminApi.createProvider(payload)
      showToast('Provider 已创建')
    } else {
      await adminApi.patchProvider(providerForm.providerCode, payload)
      showToast('Provider 已保存')
    }
    providerModal.visible = false
    await loadProviders()
  } catch (errorObj) {
    providerModal.error = errorObj.message
    showError(errorObj)
  }
}

async function toggleProvider(row) {
  const next = row.enabled === false
  try {
    await adminApi.setProviderEnabled(row.providerCode, next)
    showToast(next ? 'Provider 已启用' : 'Provider 已禁用')
    await loadProviders()
  } catch (error) {
    showError(error)
  }
}

function removeProvider(row) {
  askConfirm({
    title: '删除 Provider',
    message: `确认删除 Provider ${row.providerCode}？若仍有模型引用它会删除失败。`,
    danger: true,
    action: async () => {
      try {
        await adminApi.deleteProvider(row.providerCode)
        showToast('Provider 已删除')
        await loadProviders()
      } catch (error) {
        showError(error)
      }
    }
  })
}

async function loadModelDetail(code) {
  await run('modelDetail', async () => {
    const [detail, pricing, rolesForModel] = await Promise.all([
      adminApi.getModel(code),
      adminApi.getModelPricing(code),
      adminApi.getModelRoles(code).catch(() => [])
    ])
    modelDetail.value = detail || {}
    modelPricing.value = extractList(pricing)
    modelRoles.value = extractList(rolesForModel)
  })
}

function openModelCreate() {
  modelModal.visible = true
  modelModal.mode = 'create'
  modelModal.error = ''
  resetReactive(modelForm, defaultModelForm())
}

function openModelEdit(row) {
  const model = modelOf(row || modelDetail.value)
  if (!modelCodeOf(row || modelDetail.value)) return
  modelModal.visible = true
  modelModal.mode = 'edit'
  modelModal.error = ''
  resetReactive(modelForm, {
    ...defaultModelForm(),
    modelCode: model.modelCode || route.id,
    displayName: model.displayName || '',
    providerCode: model.providerCode || '',
    apiModelName: model.apiModelName || '',
    level: model.level ?? 1,
    score: model.score ?? 50,
    localModel: !!model.localModel,
    supportsStream: model.supportsStream !== false,
    enabled: enabledOf(row || modelDetail.value) !== false,
    description: model.description || '',
    pricing: defaultPricingForm()
  })
}

function closeModelModal() {
  modelModal.visible = false
}

function validateModelForm() {
  if (!modelForm.modelCode) return 'modelCode 必填'
  if (!modelForm.providerCode) return 'providerCode 必填'
  if (!modelForm.apiModelName) return 'apiModelName 必填'
  if (modelModal.mode === 'create') {
    if (modelForm.pricing.promptPricePerMillion === '') return 'promptPricePerMillion 必填'
    if (modelForm.pricing.completionPricePerMillion === '') return 'completionPricePerMillion 必填'
  }
  return ''
}

async function submitModel() {
  const error = validateModelForm()
  if (error) {
    modelModal.error = error
    return
  }
  const payload = {
    modelCode: modelForm.modelCode,
    displayName: modelForm.displayName,
    providerCode: modelForm.providerCode,
    apiModelName: modelForm.apiModelName,
    level: modelForm.level,
    score: modelForm.score,
    localModel: modelForm.localModel,
    supportsStream: modelForm.supportsStream,
    enabled: modelForm.enabled,
    description: modelForm.description
  }
  try {
    if (modelModal.mode === 'create') {
      payload.pricing = cleanPayload(modelForm.pricing)
      await adminApi.createModel(payload)
      showToast('模型已创建')
      modelModal.visible = false
      await loadModels()
    } else {
      delete payload.modelCode
      delete payload.enabled
      await adminApi.patchModel(modelForm.modelCode, payload)
      showToast('模型已保存')
      modelModal.visible = false
      route.id ? await loadModelDetail(route.id) : await loadModels()
    }
  } catch (errorObj) {
    modelModal.error = errorObj.message
    showError(errorObj)
  }
}

async function toggleModel(row) {
  const code = modelCodeOf(row)
  const next = enabledOf(row) === false
  const action = async () => {
    try {
      await adminApi.setModelEnabled(code, next)
      showToast(next ? '模型已启用' : '模型已禁用')
      await loadModels()
    } catch (error) {
      showError(error)
    }
  }
  if (!next) {
    askConfirm({ title: '禁用模型', message: `确认禁用模型 ${code}？该操作会让模型停止对外可用，并保留历史用量和审计记录。`, danger: true, action })
  } else {
    await action()
  }
}

function softDeleteModel(row) {
  const code = modelCodeOf(row)
  askConfirm({
    title: '软删除模型',
    message: `确认软删除模型 ${code}？后端会设置 enabled=false 并保留审计与用量历史。`,
    danger: true,
    action: async () => {
      try {
        await adminApi.softDeleteModel(code)
        showToast('模型已软删除')
        await loadModels()
      } catch (error) {
        showError(error)
      }
    }
  })
}

function hardDeleteModel(row) {
  const code = modelCodeOf(row)
  askConfirm({
    title: '硬删除模型',
    message: `确认硬删除模型 ${code}？该操作会物理删除模型，并清理价格、角色授权、用户 override、套餐权益和该模型调用流水，无法恢复。`,
    danger: true,
    action: async () => {
      try {
        await adminApi.hardDeleteModel(code)
        showToast('模型已硬删除')
        await loadModels()
      } catch (error) {
        showError(error)
      }
    }
  })
}

function openPricingCreate(code) {
  pricingModal.visible = true
  pricingModal.code = code
  pricingModal.error = ''
  resetReactive(pricingForm, { ...defaultPricingForm(), effectiveFrom: new Date().toISOString().slice(0, 19) })
}

async function submitPricing() {
  if (pricingForm.promptPricePerMillion === '' || pricingForm.completionPricePerMillion === '') {
    pricingModal.error = '输入价和输出价必填'
    return
  }
  try {
    await adminApi.createModelPricing(pricingModal.code, cleanPayload(pricingForm))
    showToast('价格已新增')
    pricingModal.visible = false
    if (route.section === 'models' && route.id === pricingModal.code) await loadModelDetail(pricingModal.code)
    else await loadModels()
  } catch (error) {
    pricingModal.error = error.message
    showError(error)
  }
}

function openMarkupModal() {
  markupModal.visible = true
  markupForm.markupRatio = pricingOf(modelDetail.value)?.markupRatio || 1
}

async function submitMarkup() {
  try {
    await adminApi.patchModelMarkupRatio(route.id, markupForm.markupRatio)
    showToast('加价倍率已调整，并生成新价格记录')
    markupModal.visible = false
    await loadModelDetail(route.id)
  } catch (error) {
    showError(error)
  }
}

function openModelRolesModal() {
  modelRolesModal.visible = true
  modelRolesForm.roles = [...normalizedModelRoles.value]
}

async function submitModelRoles() {
  try {
    await adminApi.replaceModelRoles(route.id, modelRolesForm.roles)
    showToast('模型开放角色已保存')
    modelRolesModal.visible = false
    await loadModelDetail(route.id)
  } catch (error) {
    showError(error)
  }
}

async function loadRolesPage() {
  await Promise.all([loadRoles(), loadModels().catch(() => {})])
  if (!activeRole.value) activeRole.value = roleOptions[0]
  await Promise.all([loadRoleQuota(activeRole.value), loadRoleModels(activeRole.value)])
}

async function loadRoles() {
  await run('roles', async () => {
    const data = extractList(await adminApi.getRoles())
    roles.value = data.length
      ? data.map(normalizeRoleView)
      : roleOptions.map((role) => ({ role }))
  })
}

function normalizeRoleView(row = {}) {
  const dailyLimit = row.dailyLimit ?? row.quota?.dailyLimit
  const monthlyLimit = row.monthlyLimit ?? row.quota?.monthlyLimit
  return {
    ...row,
    dailyLimit,
    monthlyLimit,
    dailyTokenLimit: row.dailyTokenLimit ?? moneyToStandardTokens(dailyLimit),
    monthlyTokenLimit: row.monthlyTokenLimit ?? moneyToStandardTokens(monthlyLimit),
    concurrentRequests: row.concurrentRequests ?? row.quota?.concurrentRequests,
    description: row.description ?? row.quota?.description,
    unlimited: row.unlimited ?? (!row.quota || (!row.quota.dailyLimit && !row.quota.monthlyLimit))
  }
}

function selectRole(role) {
  activeRole.value = role
  loadRoleQuota(role)
  loadRoleModels(role)
}

async function loadRoleQuota(role) {
  await run('roleQuota', async () => {
    roleQuota.value = await adminApi.getRoleQuota(role)
  })
}

async function loadRoleModels(role) {
  await run('roleModels', async () => {
    roleModels.value = extractList(await adminApi.getRoleModels(role))
    roleReplaceText.value = normalizedRoleModels.value.join('\n')
  })
}

function openQuotaModal(role, row = {}) {
  quotaModal.visible = true
  quotaModal.role = role
  quotaForm.dailyLimit = row.dailyLimit ?? ''
  quotaForm.monthlyLimit = row.monthlyLimit ?? ''
  quotaForm.concurrentRequests = row.concurrentRequests ?? 3
  quotaForm.description = row.description || ''
}

async function submitRoleQuota() {
  try {
    await adminApi.updateRoleQuota(quotaModal.role, {
      dailyLimit: quotaForm.dailyLimit === '' ? null : Number(quotaForm.dailyLimit),
      monthlyLimit: quotaForm.monthlyLimit === '' ? null : Number(quotaForm.monthlyLimit),
      concurrentRequests: quotaForm.concurrentRequests,
      description: quotaForm.description
    })
    showToast('角色配额已保存')
    quotaModal.visible = false
    await loadRolesPage()
  } catch (error) {
    showError(error)
  }
}

function roleReplaceCodes() {
  return roleReplaceText.value.split(/[\n,，\s]+/).map((item) => item.trim()).filter(Boolean)
}

function replaceRoleModelsConfirm() {
  const codes = roleReplaceCodes()
  askConfirm({
    title: '全量替换角色模型',
    message: `确认将 ${activeRole.value} 的默认模型替换为 ${codes.length} 个模型？这是全量替换操作。`,
    danger: true,
    action: async () => {
      try {
        await adminApi.replaceRoleModels(activeRole.value, codes)
        showToast('角色模型列表已替换')
        await loadRoleModels(activeRole.value)
        await loadRoles()
      } catch (error) {
        showError(error)
      }
    }
  })
}

async function grantRoleModel() {
  if (!roleModelToGrant.value) return
  try {
    await adminApi.grantRoleModel(activeRole.value, roleModelToGrant.value)
    showToast('模型已授权给角色')
    roleModelToGrant.value = ''
    await loadRoleModels(activeRole.value)
  } catch (error) {
    showError(error)
  }
}

async function revokeRoleModel(code) {
  try {
    await adminApi.revokeRoleModel(activeRole.value, code)
    showToast('角色模型授权已取消')
    await loadRoleModels(activeRole.value)
  } catch (error) {
    showError(error)
  }
}

async function loadUsersPage() {
  await Promise.all([
    loadUsers(),
    loadPlans().catch(() => {}),
    loadRoles().catch(() => {})
  ])
}

async function loadUsers() {
  await run('users', async () => {
    const data = await adminApi.getUsers({ ...userFilters, page: userPage.page, size: userPage.size })
    users.value = extractList(data)
    applyPage(userPage, data, 20)
  })
}

function searchUsers() {
  userPage.page = 0
  loadUsers()
}

function changeUserPage(delta) {
  userPage.page = Math.max(0, userPage.page + delta)
  loadUsers()
}

async function loadUserDetail(userId) {
  await run('userDetail', async () => {
    const data = await adminApi.getUser(userId)
    selectedUser.value = data || {}
    const baseUser = userOf(selectedUser.value)
    userEditRole.value = baseUser.userRole || baseUser.role || 'USER'
    userEditStatus.value = baseUser.userStatus || baseUser.status || 'ACTIVE'
    userRecentUsage.value = selectedUser.value.recentUsage || selectedUser.value.recentUsageEvents || []
  })
  await loadUserEffective(userId)
}

async function loadUserEffective(userId) {
  await run('userEffective', async () => {
    const [modelsData, quotaData, timelineData] = await Promise.all([
      adminApi.getUserEffectiveModels(userId),
      adminApi.getUserEffectiveQuota(userId),
      adminApi.getUserTimeline(userId, { page: 0, size: 20 }).catch(() => [])
    ])
    effectiveModels.value = extractList(modelsData)
    effectiveQuota.value = quotaData || {}
    if (!userRecentUsage.value.length) userRecentUsage.value = extractList(timelineData)
  })
}

async function updateUserRole() {
  try {
    await adminApi.patchUserRole(route.id, userEditRole.value)
    showToast('用户角色已更新')
    await loadUserDetail(route.id)
  } catch (error) {
    showError(error)
  }
}

async function updateUserStatus() {
  try {
    await adminApi.patchUserStatus(route.id, userEditStatus.value)
    showToast('用户状态已更新')
    await loadUserDetail(route.id)
  } catch (error) {
    showError(error)
  }
}

function openUserModelOverride() {
  userOverrideModal.visible = true
  userOverrideModal.type = 'model'
  Object.assign(userModelOverrideForm, { modelCode: '', overrideType: 'GRANT', workspaceId: '', enabled: true, reason: '', expiresAt: '' })
}

function openUserQuotaOverride() {
  userOverrideModal.visible = true
  userOverrideModal.type = 'quota'
  Object.assign(userQuotaOverrideForm, { workspaceId: '', dailyDelta: 0, monthlyDelta: 0, reason: '', expiresAt: '' })
}

async function submitUserOverride() {
  try {
    if (userOverrideModal.type === 'model') {
      if (!userModelOverrideForm.modelCode) {
        showToast('modelCode 必填', 'error')
        return
      }
      await adminApi.createUserModelOverride(route.id, cleanPayload(userModelOverrideForm))
      showToast('模型 override 已保存')
    } else {
      await adminApi.createUserQuotaOverride(route.id, cleanPayload(userQuotaOverrideForm))
      showToast('配额 override 已保存')
    }
    userOverrideModal.visible = false
    await loadUserDetail(route.id)
  } catch (error) {
    showError(error)
  }
}

function deleteUserModelOverride(row) {
  askConfirm({
    title: '删除模型 override',
    message: `确认删除 ${row.modelCode} 的 ${row.overrideType} 覆盖规则？`,
    danger: true,
    action: async () => {
      try {
        await adminApi.deleteUserModelOverride(route.id, row.id)
        showToast('模型 override 已删除')
        await loadUserDetail(route.id)
      } catch (error) {
        showError(error)
      }
    }
  })
}

function deleteUserQuotaOverride(row) {
  askConfirm({
    title: '删除配额 override',
    message: '确认删除该配额增量覆盖规则？',
    danger: true,
    action: async () => {
      try {
        await adminApi.deleteUserQuotaOverride(route.id, row.id)
        showToast('配额 override 已删除')
        await loadUserDetail(route.id)
      } catch (error) {
        showError(error)
      }
    }
  })
}

async function loadWorkspacesPage() {
  await Promise.all([loadPlans().catch(() => {}), loadWorkspaces()])
}

async function loadWorkspaces() {
  await run('workspaces', async () => {
    const data = await adminApi.getWorkspaces({ ...workspaceFilters, page: workspacePage.page, size: workspacePage.size })
    workspaces.value = extractList(data)
    applyPage(workspacePage, data, 20)
  })
}

function searchWorkspaces() {
  workspacePage.page = 0
  loadWorkspaces()
}

function changeWorkspacePage(delta) {
  workspacePage.page = Math.max(0, workspacePage.page + delta)
  loadWorkspaces()
}

async function loadWorkspaceDetail(id) {
  await run('workspaceDetail', async () => {
    const data = await adminApi.getWorkspace(id)
    const found = data?.workspace || data || { workspaceId: id }
    selectedWorkspace.value = { ...found, members: data?.members || [], plan: data?.plan || null, planEntitlements: data?.planEntitlements || [], recentUsage: data?.recentUsage || [] }
    Object.assign(workspaceEdit, {
      name: found.name || '',
      planCode: found.planCode || '',
      status: found.status || 'ACTIVE'
    })
  })
}

function openWorkspaceCreate() {
  workspaceModal.visible = true
  Object.assign(workspaceForm, { workspaceId: '', orgId: '', orgName: '', name: '', planCode: '', status: 'ACTIVE', ownerUserId: '' })
}

async function submitWorkspace() {
  if (!workspaceForm.name) {
    showToast('空间名必填', 'error')
    return
  }
  try {
    await adminApi.createWorkspace(cleanPayload(workspaceForm))
    showToast('Workspace 已创建')
    workspaceModal.visible = false
    await loadWorkspaces()
  } catch (error) {
    showError(error)
  }
}

async function updateWorkspace() {
  try {
    await adminApi.patchWorkspace(route.id, cleanPayload(workspaceEdit))
    showToast('Workspace 已保存')
    await loadWorkspaceDetail(route.id)
  } catch (error) {
    showError(error)
  }
}

async function addWorkspaceMember() {
  if (!workspaceMemberForm.userId) {
    showToast('userId 必填', 'error')
    return
  }
  try {
    await adminApi.addWorkspaceMember(route.id, cleanPayload(workspaceMemberForm))
    showToast('成员已添加')
    workspaceMemberForm.userId = ''
    await loadWorkspaceDetail(route.id)
  } catch (error) {
    showError(error)
  }
}

function removeWorkspaceMember(member) {
  askConfirm({
    title: '移除 Workspace 成员',
    message: `确认从当前 Workspace 移除成员 ${member.userId}？`,
    danger: true,
    action: async () => {
      try {
        await adminApi.removeWorkspaceMember(route.id, member.userId)
        showToast('成员已移除')
        await loadWorkspaceDetail(route.id)
      } catch (error) {
        showError(error)
      }
    }
  })
}

async function loadPlans() {
  await run('plans', async () => {
    plans.value = extractList(await adminApi.getPlans())
  })
}

function openPlanCreate() {
  planModal.visible = true
  Object.assign(planForm, { planCode: '', displayName: '', tier: 10, description: '', enabled: true })
}

async function submitPlan() {
  if (!planForm.planCode || !planForm.displayName) {
    showToast('planCode 和 displayName 必填', 'error')
    return
  }
  try {
    await adminApi.createPlan(cleanPayload(planForm))
    showToast('套餐已创建')
    planModal.visible = false
    await loadPlans()
  } catch (error) {
    showError(error)
  }
}

async function loadPlanDetail(code) {
  await run('planEntitlements', async () => {
    planEntitlements.value = extractList(await adminApi.getPlanEntitlements(code))
  })
}

function openEntitlementCreate() {
  entitlementModal.visible = true
  Object.assign(entitlementForm, { entitlementType: 'LIMIT', entitlementKey: 'DAILY_BUDGET', valueNumber: null, valueText: '', enabled: true })
}

watch(() => entitlementForm.entitlementType, (type) => {
  if (type === 'LIMIT' && !['DAILY_BUDGET', 'MONTHLY_BUDGET', 'CONCURRENT_REQUESTS'].includes(entitlementForm.entitlementKey)) {
    entitlementForm.entitlementKey = 'DAILY_BUDGET'
  }
})

async function submitEntitlement() {
  if (!entitlementForm.entitlementKey) {
    showToast('entitlementKey 必填', 'error')
    return
  }
  try {
    await adminApi.createPlanEntitlement(route.id, cleanPayload(entitlementForm))
    showToast('套餐权益已保存')
    entitlementModal.visible = false
    await loadPlanDetail(route.id)
  } catch (error) {
    showError(error)
  }
}

function deletePlanEntitlement(entitlement) {
  askConfirm({
    title: '删除套餐权益',
    message: `确认删除权益 ${entitlement.entitlementType}.${entitlement.entitlementKey}？后端会软删除为 disabled。`,
    danger: true,
    action: async () => {
      try {
        await adminApi.deletePlanEntitlement(route.id, entitlement.id)
        showToast('套餐权益已删除')
        await loadPlanDetail(route.id)
      } catch (error) {
        showError(error)
      }
    }
  })
}

async function loadUsagePage() {
  await Promise.all([
    loadUsageEvents(),
    loadUsageAggregate(),
    loadUsageTopN(),
    loadQuotaStatus()
  ])
}

async function loadUsageEvents() {
  await run('usageEvents', async () => {
    const data = await adminApi.getUsageEvents({ ...usageEventFilters, page: usageEventPage.page, size: usageEventPage.size })
    usageEvents.value = extractList(data)
    applyPage(usageEventPage, data, 50)
  })
}

function searchUsageEvents() {
  usageEventPage.page = 0
  loadUsageEvents()
}

function changeUsageEventPage(delta) {
  usageEventPage.page = Math.max(0, usageEventPage.page + delta)
  loadUsageEvents()
}

async function loadUsageAggregate() {
  await run('usageAggregate', async () => {
    usageAggregate.value = extractList(await adminApi.getUsageAggregate(usageAggregateFilters))
  })
}

async function loadUsageTopN() {
  await run('usageTopN', async () => {
    usageTopN.value = extractList(await adminApi.getUsageTopN(usageTopFilters))
  })
}

async function loadQuotaStatus() {
  await run('quotaStatus', async () => {
    quotaStatus.value = extractList(await adminApi.getUsageQuotaStatus({ role: quotaStatusRole.value }))
  })
}

async function loadUserTimeline() {
  if (!timelineUserId.value) {
    showToast('请输入 userId', 'error')
    return
  }
  await run('userTimeline', async () => {
    usageTimeline.value = extractList(await adminApi.getUserTimeline(timelineUserId.value, { page: 0, size: 100 }))
  })
}

async function loadRagPage() {
  await Promise.all([
    loadRagOverview(),
    loadRagDocuments()
  ])
}

async function loadRagOverview() {
  await run('ragOverview', async () => {
    const data = await adminApi.getRagOverview()
    Object.assign(ragOverview, {
      documentCount: data?.documentCount || 0,
      chunkCount: data?.chunkCount || 0,
      estimatedTokens: data?.estimatedTokens || 0,
      declaredChunkCount: data?.declaredChunkCount || 0,
      documentStatus: extractList(data?.documentStatus || []),
      eventFileStatus: extractList(data?.eventFileStatus || []),
      eventRagStatus: extractList(data?.eventRagStatus || []),
      ownerUsage: extractList(data?.ownerUsage || []),
      recentEvents: extractList(data?.recentEvents || [])
    })
  })
}

async function loadRagDocuments() {
  await run('ragDocuments', async () => {
    const data = await adminApi.getRagDocuments({ ...ragFilters, page: ragPage.page, size: ragPage.size })
    ragDocuments.value = extractList(data)
    applyPage(ragPage, data, 30)
  })
}

function searchRagDocuments() {
  ragPage.page = 0
  loadRagDocuments()
}

function changeRagPage(delta) {
  ragPage.page = Math.max(0, ragPage.page + delta)
  loadRagDocuments()
}

onMounted(() => {
  initTheme()
  parseRoute()
  if (adminAuthenticated.value) {
  adminApi.me()
      .then((user) => {
        adminProfile.value = user
        setAdminSession({ user })
        adminUserIdInput.value = getAdminUserId()
        adminAuthenticated.value = true
        if (route.section === 'admin') go('/admin/dashboard')
        else loadCurrent()
      })
      .catch((error) => {
        if (error?.authExpired || error?.status === 401 || error?.status === 403) {
          clearAdminSession()
          adminAuthenticated.value = false
          adminProfile.value = null
          adminUserIdInput.value = ''
        }
      })
  }
  window.addEventListener('popstate', handlePop)
  window.addEventListener('admin-auth-expired', handleAdminAuthExpired)
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', handlePop)
  window.removeEventListener('admin-auth-expired', handleAdminAuthExpired)
})

function handlePop() {
  parseRoute()
  if (adminAuthenticated.value) loadCurrent()
}

function handleAdminAuthExpired() {
  clearAdminSession()
  adminAuthenticated.value = false
  adminProfile.value = null
  adminUserIdInput.value = ''
  showToast('后台登录已失效，请重新登录', 'error')
}
</script>

<style scoped>
.admin-login-page {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: var(--bg-secondary, #f9fcfb);
  color: var(--text-primary, #1f2933);
  padding: 24px;
}

.admin-login-panel {
  width: min(420px, 100%);
  border: 1px solid var(--border-color, rgba(74, 157, 111, 0.15));
  border-radius: 10px;
  background: var(--bg-primary, #fff);
  box-shadow: 0 20px 70px rgba(15, 23, 42, 0.1);
  padding: 26px;
}

.admin-login-brand {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 22px;
}

.admin-login-brand strong,
.admin-login-brand span {
  display: block;
}

.admin-login-brand span,
.admin-login-panel p {
  color: var(--text-sub, #8ba599);
  font-size: 12px;
}

.admin-login-panel h1 {
  margin: 0 0 8px;
  font-size: 24px;
}

.admin-login-panel p {
  margin: 0 0 18px;
  line-height: 1.6;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 13px;
  font-size: 12px;
  color: var(--text-sub, #8ba599);
  font-weight: 700;
}

.login-submit {
  width: 100%;
  margin-top: 6px;
}

.admin-shell {
  display: flex;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 18% 4%, rgba(45, 134, 89, 0.08), transparent 28%),
    linear-gradient(180deg, #fbfdfc 0%, #f6fbf8 48%, #f3f8f6 100%);
  color: var(--text-primary, #1f2933);
  overflow: hidden;
}

.admin-sidebar {
  width: 264px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color, rgba(74, 157, 111, 0.15));
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(14px);
  box-shadow: 12px 0 30px rgba(21, 78, 54, 0.035);
}

.admin-brand {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 18px;
  border-bottom: 1px solid var(--border-color, rgba(74, 157, 111, 0.15));
}

.brand-mark {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--primary-color, #2d8659);
  color: #fff;
  font-weight: 800;
}

.admin-brand strong,
.admin-brand span {
  display: block;
}

.admin-brand strong {
  font-size: 15px;
}

.admin-brand span {
  margin-top: 2px;
  color: var(--text-sub, #8ba599);
  font-size: 12px;
}

.admin-nav {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.admin-nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  padding: 8px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary, #1f2933);
  text-align: left;
  cursor: pointer;
  font-size: 13px;
}

.admin-nav-item:hover,
.admin-nav-item.active {
  background: var(--hover-bg, rgba(74, 157, 111, 0.06));
  color: var(--primary-color, #2d8659);
}

.nav-icon {
  width: 22px;
  text-align: center;
  color: var(--text-sub, #8ba599);
}

.admin-auth-box {
  margin: 10px;
  padding: 12px;
  border: 1px solid var(--border-color, rgba(74, 157, 111, 0.15));
  border-radius: 10px;
  background: var(--bg-secondary, #f9fcfb);
}

.admin-auth-box label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
}

.admin-auth-box strong {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
}

.admin-auth-box p {
  margin: 8px 0 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--text-sub, #8ba599);
}

.admin-auth-row {
  display: flex;
  gap: 6px;
}

.admin-auth-row input {
  min-width: 0;
  flex: 1;
}

.admin-btn.full {
  width: 100%;
  margin-top: 10px;
}

.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-topbar {
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 24px;
  border-bottom: 1px solid var(--border-color, rgba(74, 157, 111, 0.15));
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(14px);
}

.admin-kicker {
  margin: 0 0 2px;
  color: var(--text-sub, #8ba599);
  font-size: 12px;
}

.admin-topbar h1 {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
}

.topbar-actions,
.table-actions,
.chip-row,
.form-actions,
.inline-form,
.filters,
.page-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-page {
  flex: 1;
  overflow: auto;
  padding: 22px 24px 36px;
  animation: pageIn 260ms ease-out;
}

.page-tools {
  justify-content: space-between;
  margin-bottom: 16px;
}

.tool-title h2 {
  margin: 0;
  font-size: 18px;
}

.tool-title span {
  display: block;
  margin-top: 4px;
  color: var(--text-sub, #8ba599);
  font-size: 12px;
}

.admin-panel,
.metric-card {
  background:
    linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90)),
    radial-gradient(circle at 100% 0%, rgba(14,165,164,0.08), transparent 32%);
  border: 1px solid var(--border-color, rgba(74, 157, 111, 0.15));
  border-radius: 10px;
  box-shadow: 0 12px 34px rgba(15, 55, 38, 0.06);
}

.admin-panel {
  padding: 16px;
  margin-bottom: 16px;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.admin-panel:hover,
.metric-card:hover {
  border-color: rgba(45, 134, 89, 0.24);
  box-shadow: 0 18px 42px rgba(15, 55, 38, 0.09);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-head h2 {
  margin: 0;
  font-size: 15px;
}

.panel-head p {
  margin: 4px 0 0;
  color: var(--text-sub, #8ba599);
  font-size: 12px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.metric-grid.compact-metrics {
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.metric-card {
  padding: 16px;
  position: relative;
  overflow: hidden;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.metric-card::after {
  content: "";
  position: absolute;
  right: -26px;
  top: -34px;
  width: 92px;
  height: 92px;
  border-radius: 999px;
  background: rgba(45, 134, 89, 0.07);
}

.metric-card:hover {
  transform: translateY(-2px);
}

.metric-card span,
.metric-card small {
  display: block;
  color: var(--text-sub, #8ba599);
  font-size: 12px;
}

.metric-card strong {
  display: block;
  margin: 8px 0 6px;
  font-size: 24px;
  color: var(--text-primary, #1f2933);
}

.metric-card.danger strong {
  color: #dc2626;
}

.admin-grid {
  display: grid;
  gap: 16px;
}

.admin-grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.admin-grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.dashboard-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 16px;
}

.dashboard-chart-row {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.8fr);
  gap: 14px;
}

.dashboard-health-panel {
  grid-column: 1 / -1;
}

.dashboard-health-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.chart-panel {
  min-height: 340px;
}

.model-health-grid {
  align-items: stretch;
}

.rag-chart-grid .admin-panel {
  min-height: 370px;
}

.admin-echart {
  width: 100%;
  min-height: 220px;
}

.admin-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12.5px;
}

.table-scroll {
  overflow-x: auto;
}

.admin-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--bg-secondary, #f9fcfb);
  color: var(--text-sub, #8ba599);
  font-weight: 700;
  text-align: left;
  white-space: nowrap;
}

.admin-table th,
.admin-table td {
  border-bottom: 1px solid var(--border-color, rgba(74, 157, 111, 0.15));
  padding: 10px 9px;
  vertical-align: top;
}

.admin-table.compact th,
.admin-table.compact td {
  padding: 8px;
}

.admin-table tr:last-child td {
  border-bottom: 0;
}

.admin-table tr.selected td {
  background: var(--hover-bg, rgba(74, 157, 111, 0.06));
}

.admin-table tbody tr {
  transition: background 140ms ease, transform 140ms ease;
}

.admin-table tbody tr:hover td {
  background: rgba(45, 134, 89, 0.035);
}

.admin-btn,
.text-btn {
  border: 0;
  cursor: pointer;
  border-radius: 8px;
}

.admin-btn {
  min-height: 34px;
  padding: 0 13px;
  background: var(--primary-color, #2d8659);
  color: #fff;
  font-weight: 700;
  font-size: 12.5px;
  box-shadow: 0 7px 18px rgba(45, 134, 89, 0.18);
  transition: transform 150ms ease, box-shadow 150ms ease, background 150ms ease;
}

.admin-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(45, 134, 89, 0.24);
}

.admin-btn.ghost {
  background: var(--hover-bg, rgba(74, 157, 111, 0.06));
  color: var(--primary-color, #2d8659);
  box-shadow: none;
}

.admin-btn.danger {
  background: #dc2626;
}

.admin-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.text-btn {
  background: transparent;
  color: var(--primary-color, #2d8659);
  font-weight: 700;
  font-size: 12px;
  padding: 3px 4px;
}

.text-btn.danger {
  color: #dc2626;
}

.admin-chip,
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 22px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.58);
}

.admin-chip.green,
.status-pill.ok {
  background: rgba(45, 134, 89, 0.1);
  color: var(--primary-color, #2d8659);
}

.admin-chip.blue {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.admin-chip.gray {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}

.admin-chip.red,
.status-pill.bad {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.chip-row.wrap {
  flex-wrap: wrap;
}

.model-chip-box {
  align-items: flex-start;
  align-content: flex-start;
  max-height: 220px;
  overflow: auto;
  padding: 6px 0;
}

.model-chip button {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-weight: 900;
}

.price-cell {
  display: flex;
  flex-direction: column;
  gap: 5px;
  white-space: nowrap;
  min-width: 132px;
}

.price-cell-head,
.price-lines {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-cell-head small,
.price-meta,
.price-missing small {
  color: var(--text-sub, #8ba599);
  font-size: 11px;
}

.price-lines {
  color: var(--text-primary, #1f2933);
  font-weight: 700;
}

.price-missing {
  display: grid;
  gap: 5px;
  align-items: start;
  min-width: 132px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.strong {
  font-weight: 700;
}

.filters {
  flex-wrap: wrap;
  margin-bottom: 14px;
}

input,
select,
textarea {
  min-height: 34px;
  border: 1px solid var(--border-color, rgba(74, 157, 111, 0.18));
  border-radius: 8px;
  background: var(--bg-primary, #fff);
  color: var(--text-primary, #1f2933);
  padding: 7px 10px;
  font-size: 12.5px;
  transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
}

textarea {
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  border-color: var(--primary-color, #2d8659);
  box-shadow: 0 0 0 3px rgba(45, 134, 89, 0.08);
}

.filters input {
  min-width: 190px;
}

.detail-list {
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr);
  gap: 10px 14px;
  margin: 0;
  font-size: 13px;
}

.detail-list dt {
  color: var(--text-sub, #8ba599);
  font-weight: 700;
}

.detail-list dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}

.bar-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12.5px;
}

.bar-subline {
  display: block;
  margin-top: 2px;
  color: var(--text-sub, #8ba599);
  font-size: 11px;
}

.bar-track {
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--hover-bg, rgba(74, 157, 111, 0.06));
  margin-top: 6px;
}

.bar-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--primary-color, #2d8659), #4a9d6f);
}

.mini-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.chart-stack {
  display: grid;
  gap: 12px;
}

.chart-grid {
  margin-bottom: 14px;
}

.mini-chart-title {
  color: var(--text-sub, #8ba599);
  font-size: 12px;
  font-weight: 800;
}

.mini-chart-row {
  display: grid;
  grid-template-columns: minmax(110px, 180px) minmax(80px, 1fr) 96px;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.mini-chart-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-chart-track {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--hover-bg, rgba(74, 157, 111, 0.06));
}

.mini-chart-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2d8659, #0ea5a4);
}

.mini-chart-row strong {
  text-align: right;
}

.quota-limit-cell {
  display: grid;
  gap: 2px;
  min-width: 120px;
}

.quota-limit-cell .quota-label,
.quota-limit-cell small,
.quota-progress-meta,
.quota-raw-token {
  color: var(--text-sub, #8ba599);
  font-size: 11px;
}

.quota-limit-cell strong {
  color: var(--text-primary, #1f2933);
  font-size: 13px;
}

.quota-progress {
  min-width: 210px;
}

.quota-progress.large {
  min-width: 0;
}

.quota-detail-stack {
  display: grid;
  gap: 18px;
}

.quota-progress-head,
.quota-progress-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.quota-progress-head {
  align-items: center;
  margin-bottom: 6px;
  font-size: 12px;
}

.quota-progress-head strong {
  color: var(--text-primary, #1f2933);
}

.quota-progress-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--hover-bg, rgba(74, 157, 111, 0.06));
}

.quota-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2d8659, #0ea5a4);
}

.quota-progress-fill.warn {
  background: linear-gradient(90deg, #d97706, #f59e0b);
}

.quota-progress-fill.danger {
  background: linear-gradient(90deg, #dc2626, #ef4444);
}

.quota-progress-meta {
  flex-wrap: wrap;
  margin-top: 6px;
}

.quota-raw-token {
  display: block;
  margin-top: 4px;
}

.quota-preview {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
  border: 1px solid var(--border-color, rgba(74, 157, 111, 0.15));
  border-radius: 8px;
  background: var(--bg-secondary, #f9fcfb);
}

.usage-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.usage-tabs button {
  border: 1px solid var(--border-color, rgba(74, 157, 111, 0.15));
  background: var(--bg-primary, #fff);
  color: var(--text-sub, #8ba599);
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 150ms ease, border-color 150ms ease, background 150ms ease;
}

.usage-tabs button:hover {
  transform: translateY(-1px);
}

.usage-tabs button.active {
  border-color: var(--primary-color, #2d8659);
  color: var(--primary-color, #2d8659);
  background: var(--hover-bg, rgba(74, 157, 111, 0.06));
  box-shadow: inset 0 -2px 0 rgba(45, 134, 89, 0.42);
}

.admin-toast {
  position: fixed;
  top: 74px;
  right: 24px;
  z-index: 1200;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 460px;
  padding: 11px 14px;
  border-radius: 8px;
  background: #ecfdf5;
  color: #047857;
  border: 1px solid rgba(4, 120, 87, 0.18);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  font-size: 13px;
}

.admin-toast.error {
  background: #fef2f2;
  color: #b91c1c;
  border-color: rgba(185, 28, 28, 0.2);
}

.admin-toast button {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-weight: 700;
}

.empty-state-admin,
.loading-state-admin,
.error-state-admin {
  padding: 28px 16px;
  text-align: center;
  color: var(--text-sub, #8ba599);
  font-size: 13px;
}

.error-state-admin {
  border: 1px solid rgba(220, 38, 38, 0.15);
  background: rgba(220, 38, 38, 0.04);
  color: #991b1b;
  border-radius: 8px;
}

.error-state-admin strong {
  display: block;
  margin-bottom: 6px;
}

.error-state-admin p {
  margin: 0 0 12px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
  color: var(--text-sub, #8ba599);
  font-size: 12px;
}

.admin-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(4px);
}

.admin-modal {
  width: min(620px, calc(100vw - 48px));
  max-height: calc(100vh - 48px);
  overflow: auto;
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-color, rgba(74, 157, 111, 0.15));
  border-radius: 12px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
  padding: 18px;
  animation: modalIn 180ms ease-out;
}

.admin-modal.large {
  width: min(860px, calc(100vw - 48px));
}

.admin-modal.confirm {
  width: min(440px, calc(100vw - 48px));
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.modal-head h2 {
  margin: 0;
  font-size: 17px;
}

.modal-head button {
  border: 0;
  background: transparent;
  color: var(--text-sub, #8ba599);
  cursor: pointer;
  font-size: 22px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.form-grid label,
.single-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-sub, #8ba599);
}

.form-grid .wide {
  grid-column: 1 / -1;
}

.check-row {
  flex-direction: row !important;
  align-items: center;
  color: var(--text-primary, #1f2933) !important;
  font-weight: 600 !important;
}

.check-row input {
  min-height: auto;
}

.sub-form {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border-color, rgba(74, 157, 111, 0.15));
}

.sub-form h3 {
  margin: 0 0 12px;
  font-size: 14px;
}

.form-actions {
  justify-content: flex-end;
  margin-top: 16px;
}

.form-error {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(220, 38, 38, 0.08);
  color: #b91c1c;
  font-size: 13px;
}

.modal-hint,
.confirm-message {
  color: var(--text-sub, #8ba599);
  font-size: 13px;
  line-height: 1.55;
}

.role-check-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.inline-form {
  flex-wrap: wrap;
}

.inline-form.tight {
  gap: 6px;
}

.inline-form.tight select {
  min-width: 140px;
}

.code-textarea {
  width: 100%;
  margin-top: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

@keyframes pageIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 1180px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-hero-grid,
  .dashboard-chart-row,
  .dashboard-health-grid,
  .admin-grid.three,
  .admin-grid.two {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 780px) {
  .admin-shell {
    flex-direction: column;
  }

  .admin-sidebar {
    width: 100%;
    max-height: 220px;
  }

  .admin-nav {
    display: flex;
    overflow-x: auto;
  }

  .admin-nav-item {
    min-width: 130px;
  }

  .admin-auth-box {
    display: none;
  }

  .admin-topbar {
    height: auto;
    align-items: flex-start;
    padding: 14px;
  }

  .admin-page {
    padding: 16px;
  }

  .metric-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>

