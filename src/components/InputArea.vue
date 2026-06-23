<template>
  <div class="input-section" @click="closeAllPopups">
    <!-- 主输入卡片 -->
    <div class="input-card" :class="{ focused: isFocused, 'has-files': attachedFiles.length > 0 }">
      <!-- 文件预览（在输入框内部，Claude 风格） -->
      <TransitionGroup name="file-preview" tag="div" class="files-preview-inner" v-show="attachedFiles.length > 0">
        <div v-for="(file, index) in attachedFiles" :key="file.name + index" class="file-card">
          <!-- 图片缩略图 -->
          <template v-if="isImageFile(file)">
            <div class="file-card-thumb">
              <img :src="getFilePreviewUrl(file)" alt="" class="thumb-img" :class="{ 'thumb-dim': file.status === 'uploading' }" />
              <div v-if="file.status === 'uploading'" class="file-upload-overlay">
                <svg class="upload-spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" width="22" height="22"><circle cx="12" cy="12" r="9" stroke-width="2.5" stroke-opacity="0.25"/><path d="M12 3a9 9 0 0 1 9 9" stroke-width="2.5" stroke-linecap="round"/></svg>
                <span class="upload-pct">{{ file.progress }}%</span>
              </div>
              <div v-else-if="file.status === 'error'" class="file-error-overlay" :title="file.errorMsg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20"><circle cx="12" cy="12" r="9" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>
              </div>
              <button @click="removeFile(index)" class="file-card-close">
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <span class="file-card-name">{{ truncateName(file.name) }}</span>
          </template>
          <!-- 普通文件 -->
          <template v-else>
            <div class="file-card-doc" :class="{ 'doc-uploading': file.status === 'uploading', 'doc-error': file.status === 'error' }">
              <span class="file-card-doc-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <div class="file-card-doc-info">
                <span class="file-card-doc-name">{{ truncateName(file.name) }}</span>
                <span class="file-card-doc-size">
                  <template v-if="file.status === 'uploading'">上传中 {{ file.progress }}%</template>
                  <template v-else-if="file.status === 'registering'">登记中…</template>
                  <template v-else-if="file.status === 'processing'">{{ ragStatusText(file.ragStatus) }}</template>
                  <template v-else-if="file.status === 'ready'">✓ 已就绪</template>
                  <template v-else-if="file.status === 'error'">{{ file.errorMsg || '上传失败' }}</template>
                  <template v-else>{{ formatSize(file.size) }}</template>
                </span>
                <div v-if="file.status === 'uploading'" class="doc-progress-track">
                  <div class="doc-progress-fill" :style="{ width: file.progress + '%' }"></div>
                </div>
              </div>
              <button @click="removeFile(index)" class="file-card-close doc-close">
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </template>
        </div>
      </TransitionGroup>

      <!-- 文本框 -->
      <textarea
        ref="textareaRef"
        v-model="message"
        @keydown.enter="handleEnterKey"
        @focus="isFocused = true"
        @blur="isFocused = false"
        @input="autoResize"
        :placeholder="t('inputPlaceholder')"
        class="chat-textarea"
        rows="1"
      ></textarea>

      <div v-if="showQuotaWarning" class="quota-warning" @click.stop>
        <span>本月配额即将用尽，剩余 {{ quotaRemainingPercent }}%</span>
        <button type="button" @click="openUsageSettings">查看用量</button>
      </div>

      <!-- 底部工具栏 -->
      <div class="toolbar">
        <!-- 左侧图标组 -->
        <div class="toolbar-left">
          <!-- 模型选择 -->
          <button
            class="tool-btn"
            :class="{ active: showModelPicker }"
            @click.stop="showModelPicker = !showModelPicker"
            :title="selectedModelLabel"
          >
            <img :src="selectedModelIconUrl" class="provider-icon" alt="" />
          </button>

          <!-- 联网搜索 -->
          <button class="tool-btn" :class="{ active: webSearchEnabled }" @click.stop="webSearchEnabled = !webSearchEnabled" :title="t('webSearch')">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="1.8"/><ellipse cx="12" cy="12" rx="4" ry="10" stroke-width="1.8"/><line x1="2" y1="12" x2="22" y2="12" stroke-width="1.8"/></svg>
          </button>

          <!-- 上传按钮 + 下拉菜单 -->
          <div class="upload-dropdown-wrapper" ref="uploadDropdownRef">
            <button class="tool-btn" :class="{ active: showUploadMenu }" @click.stop="showUploadMenu = !showUploadMenu" :title="t('uploadFile')">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21.44 11.05l-9.19 9.19a6.01 6.01 0 01-8.49-8.49l9.19-9.19a4.008 4.008 0 015.66 5.66l-9.2 9.19a2.003 2.003 0 01-2.83-2.83l8.49-8.48"/></svg>
            </button>
            <!-- 上传下拉菜单 -->
            <Transition name="upload-pop">
              <div v-if="showUploadMenu" class="upload-menu" @click.stop>
                <button class="upload-menu-item" @click="triggerImageInput">
                  <span class="upload-menu-icon">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.8"/><circle cx="8.5" cy="8.5" r="1.5" stroke-width="1.8"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 15l-5-5L5 21"/></svg>
                  </span>
                  <span class="upload-menu-text">{{ t('uploadImage') }}</span>
                </button>
                <button class="upload-menu-item" @click="triggerFileInput">
                  <span class="upload-menu-icon">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>
                  <span class="upload-menu-text">{{ t('uploadFileOption') }}</span>
                </button>
                <button class="upload-menu-item" @click="triggerScreenCapture">
                  <span class="upload-menu-icon">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path v-if="!isMobileDevice" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle v-if="!isMobileDevice" cx="12" cy="13" r="4" stroke-width="1.8"/><path v-if="isMobileDevice" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle v-if="isMobileDevice" cx="12" cy="13" r="4" stroke-width="1.8"/></svg>
                  </span>
                  <span class="upload-menu-text">{{ isMobileDevice ? t('takePhoto') : t('screenshot') }}</span>
                </button>
              </div>
            </Transition>
          </div>
          <input ref="fileInput" type="file" @change="handleFileSelect" accept="*/*" style="display:none" multiple />
          <input ref="imageInput" type="file" @change="handleImageSelect" accept="image/*" style="display:none" multiple />
          <input ref="cameraInput" type="file" @change="handleCameraCapture" accept="image/*" capture="environment" style="display:none" />

          <!-- 技能与工具菜单 -->
          <div class="skill-tools-wrapper" ref="skillToolsRef">
            <button class="tool-btn skill-store-btn" :class="{ active: showSkillToolsMenu }" @click.stop="showSkillToolsMenu = !showSkillToolsMenu" :title="skillStoreTitle">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke-width="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke-width="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke-width="1.8"/></svg>
            </button>
            <Transition name="tool-menu-pop">
              <div v-if="showSkillToolsMenu" class="skill-tools-menu" @click.stop>
                <div class="skill-menu-title">已装载能力和工具</div>
                <button class="skill-menu-row resource-row" @click="openResourceLibrary">
                  <span class="skill-menu-left">
                    <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke-width="1.8" stroke-linecap="round"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" stroke-width="1.8" stroke-linejoin="round"/></svg>
                    <span>资料库</span>
                    <span class="scope-badge">全局</span>
                  </span>
                  <span class="skill-menu-chevron">›</span>
                </button>
                <div class="skill-menu-divider"></div>
                <button class="skill-menu-row" :class="{ active: memoryEnabled }" @click="toggleMemorySkill">
                  <span class="skill-menu-left">
                    <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 3a4 4 0 00-4 4v10a4 4 0 004 4h6a4 4 0 004-4V7a4 4 0 00-4-4H9z" stroke-width="1.8"/><path d="M8 9h8M8 13h5" stroke-width="1.8" stroke-linecap="round"/></svg>
                    <span>记忆</span>
                  </span>
                  <span v-if="memoryEnabled" class="skill-menu-check">✓</span>
                </button>
                <div class="skill-menu-divider"></div>
                <div class="skill-menu-row has-submenu">
                  <span class="skill-menu-left">
                    <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke-width="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke-width="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke-width="1.8"/></svg>
                    <span>工具</span>
                    <span class="auto-badge">{{ enabledToolCount }}</span>
                  </span>
                  <span class="skill-menu-chevron">›</span>
                  <div class="skill-cascade-panel skill-submenu">
                    <div class="submenu-head">
                      <span>已安装工具</span>
                      <small>工具帮助AI连接万物</small>
                    </div>
                    <button
                      v-for="skill in installedToolItems"
                      :key="skill.id"
                      class="cascade-item"
                      :class="{ active: isSkillEnabled(skill.id) }"
                      @click.stop="toggleSkillById(skill.id)"
                      :title="menuEnabledTitle(skill)"
                    >
                      <span class="cascade-icon" :class="{ text: skill.icon.length > 1 }">{{ skill.icon }}</span>
                      <span class="cascade-copy">
                        <strong>{{ skill.name }}</strong>
                        <small>{{ skill.menuDesc }}</small>
                      </span>
                      <span class="cascade-state">{{ isSkillEnabled(skill.id) ? '✓' : '○' }}</span>
                    </button>
                    <div v-if="installedToolItems.length === 0" class="cascade-empty">还没有已安装工具</div>
                    <button class="cascade-manage" @click.stop="openSkillStore">进入背包</button>
                  </div>
                </div>
                <div class="skill-menu-row has-submenu cli-row" :class="{ active: cliEnabled }">
                  <span class="skill-menu-left">
                    <span class="cli-icon">CLI</span>
                    <span>命令行</span>
                    <span class="auto-badge">{{ enabledCliCount }}</span>
                  </span>
                  <span class="skill-menu-chevron">›</span>
                  <div class="skill-cascade-panel cli-submenu">
                    <div class="submenu-head">
                      <span>已安装命令行</span>
                      <small>命令帮助AI操作电脑</small>
                    </div>
                    <button
                      v-for="cli in installedCliTools"
                      :key="cli.id"
                      class="cascade-item"
                      :class="{ active: isCliEnabled(cli.id) }"
                      @click.stop="toggleCliTool(cli.id)"
                      :title="menuEnabledTitle(cli)"
                    >
                      <span class="cascade-icon terminal">{{ cli.icon }}</span>
                      <span class="cascade-copy">
                        <strong>{{ cli.name }}</strong>
                        <small>{{ cli.menuDesc }}</small>
                      </span>
                      <span class="cascade-state">{{ isCliEnabled(cli.id) ? '✓' : '○' }}</span>
                    </button>
                    <button class="cascade-manage" @click.stop="openSkillStore">进入背包</button>
                  </div>
                </div>
                <div class="skill-menu-row has-submenu">
                  <span class="skill-menu-left">
                    <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 3l2.2 4.8L19 9l-3.8 3.2L16 18l-4-2.6L8 18l.8-5.8L5 9l4.8-1.2L12 3z" stroke-width="1.6" stroke-linejoin="round"/></svg>
                    <span>技能</span>
                    <span class="auto-badge">{{ enabledClaudeSkillCount }}</span>
                  </span>
                  <span class="skill-menu-chevron">›</span>
                  <div class="skill-cascade-panel skill-submenu">
                    <div class="submenu-head">
                      <span>已安装技能</span>
                      <small>技能帮助AI掌握不同领域经验</small>
                    </div>
                    <button
                      v-for="skill in installedClaudeSkills"
                      :key="skill.id"
                      class="cascade-item"
                      :class="{ active: isSkillEnabled(skill.id) }"
                      @click.stop="toggleSkillById(skill.id)"
                      :title="menuEnabledTitle(skill)"
                    >
                      <span class="cascade-icon" :class="{ text: skill.icon.length > 1 }">{{ skill.icon }}</span>
                      <span class="cascade-copy">
                        <strong>{{ skill.name }}</strong>
                        <small>{{ skill.menuDesc }}</small>
                      </span>
                      <span class="cascade-state">{{ isSkillEnabled(skill.id) ? '✓' : '○' }}</span>
                    </button>
                    <div v-if="installedClaudeSkills.length === 0" class="cascade-empty">还没有已安装技能</div>
                    <button class="cascade-manage" @click.stop="openSkillStore">进入背包</button>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- 右侧：发送按钮 -->
        <button
          class="send-btn"
          :disabled="!message.trim()"
          @click="sendMessage"
        >
          <svg v-if="!loading" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
          <span v-else class="spinner"></span>
        </button>
      </div>

      <!-- 模型选择器弹出面板 -->
      <Transition name="pop">
        <div v-if="showModelPicker" class="model-picker" @click.stop>
          <div class="picker-search">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke-width="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke-width="2" stroke-linecap="round"/></svg>
            <input v-model="modelSearch" class="picker-input" :placeholder="t('searchModel')" />
          </div>
          <div class="picker-list">
            <div v-if="models.length === 0" class="picker-empty">
              暂无可用模型。请先在后台配置 Provider 与模型并授权给你的角色，然后重新登录。
            </div>
            <!-- 第一梯队 -->
            <template v-if="tier1Models.length > 0 && !modelSearch">
              <div class="picker-group-label">{{ t('tier1') }} ⚡⚡⚡</div>
              <div
                v-for="(m, idx) in tier1Models"
                :key="m.value"
                class="picker-item"
                :class="{ selected: selectedModel === m.value }"
                :style="{ '--item-index': idx }"
                @click="selectModel(m)"
              >
                <img :src="getModelIconUrl(m.value, m.provider)" class="provider-icon" alt="" />
                <span class="picker-item-name">{{ m.label }}</span>
                <span v-if="getModelRank(m.value) === 1" class="medal-badge gold">1st</span>
                <span v-else-if="getModelRank(m.value) === 2" class="medal-badge silver">2nd</span>
                <span v-else-if="getModelRank(m.value) === 3" class="medal-badge bronze">3rd</span>
                <span v-if="m.local" class="picker-badge local">Local</span>
                <svg v-if="selectedModel === m.value" class="picker-check" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              </div>
            </template>
            <!-- 第二梯队 -->
            <template v-if="tier2Models.length > 0 && !modelSearch">
              <div class="picker-group-label">{{ t('tier2') }} ⚡⚡</div>
              <div
                v-for="(m, idx) in tier2Models"
                :key="m.value"
                class="picker-item"
                :class="{ selected: selectedModel === m.value }"
                :style="{ '--item-index': idx + tier1Models.length }"
                @click="selectModel(m)"
              >
                <img :src="getModelIconUrl(m.value, m.provider)" class="provider-icon" alt="" />
                <span class="picker-item-name">{{ m.label }}</span>
                <span v-if="getModelRank(m.value) === 1" class="medal-badge gold">1st</span>
                <span v-else-if="getModelRank(m.value) === 2" class="medal-badge silver">2nd</span>
                <span v-else-if="getModelRank(m.value) === 3" class="medal-badge bronze">3rd</span>
                <span v-if="m.local" class="picker-badge local">Local</span>
                <svg v-if="selectedModel === m.value" class="picker-check" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              </div>
            </template>
            <!-- 第三梯队 -->
            <template v-if="tier3Models.length > 0 && !modelSearch">
              <div class="picker-group-label">{{ t('tier3') }}⚡</div>
              <div
                v-for="(m, idx) in tier3Models"
                :key="m.value"
                class="picker-item"
                :class="{ selected: selectedModel === m.value }"
                :style="{ '--item-index': idx + tier1Models.length + tier2Models.length }"
                @click="selectModel(m)"
              >
                <img :src="getModelIconUrl(m.value, m.provider)" class="provider-icon" alt="" />
                <span class="picker-item-name">{{ m.label }}</span>
                <span v-if="m.local" class="picker-badge local">Local</span>
                <svg v-if="selectedModel === m.value" class="picker-check" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              </div>
            </template>
            <!-- 第四梯队 -->
            <template v-if="tier4Models.length > 0 && !modelSearch">
              <div class="picker-group-label">{{ t('tier4') }}</div>
              <div
                v-for="(m, idx) in tier4Models"
                :key="m.value"
                class="picker-item"
                :class="{ selected: selectedModel === m.value }"
                :style="{ '--item-index': idx + tier1Models.length + tier2Models.length + tier3Models.length }"
                @click="selectModel(m)"
              >
                <img :src="getModelIconUrl(m.value, m.provider)" class="provider-icon" alt="" />
                <span class="picker-item-name">{{ m.label }}</span>
                <span v-if="m.local" class="picker-badge local">Local</span>
                <svg v-if="selectedModel === m.value" class="picker-check" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              </div>
            </template>
            <!-- 搜索结果（不分组） -->
            <template v-if="modelSearch">
              <div
                v-for="(m, idx) in filteredModels"
                :key="m.value"
                class="picker-item"
                :class="{ selected: selectedModel === m.value }"
                :style="{ '--item-index': idx }"
                @click="selectModel(m)"
              >
                <img :src="getModelIconUrl(m.value, m.provider)" class="provider-icon" alt="" />
                <span class="picker-item-name">{{ m.label }}</span>
                <span v-if="getModelRank(m.value) === 1" class="medal-badge gold">1st</span>
                <span v-else-if="getModelRank(m.value) === 2" class="medal-badge silver">2nd</span>
                <span v-else-if="getModelRank(m.value) === 3" class="medal-badge bronze">3rd</span>
                <span v-if="m.local" class="picker-badge local">Local</span>
                <svg v-if="selectedModel === m.value" class="picker-check" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </div>

    <!-- LobeHub 风格：技能/MCP 胶囊栏 -->
    <div class="skill-mcp-wrapper">
      <div class="skill-mcp-pill" @click.stop="openSkillStore">
        <div class="skill-mcp-left">
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke-width="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke-width="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke-width="1.8"/></svg>
          <span>为 AI 添加技能</span>
        </div>
        <div class="skill-mcp-right">
          <span class="mcp-dot" title="Gmail">M</span>
          <span class="mcp-dot g" title="Google">G</span>
          <span class="mcp-dot s" title="Slack">S</span>
          <span class="mcp-dot gh" title="GitHub">GH</span>
          <span class="mcp-dot n" title="Notion">N</span>
          <span class="mcp-dot x" title="X">X</span>
        </div>
      </div>
    </div>

    <!-- 技能商店弹窗 -->
    <SkillStoreDialog :visible="showSkillStore" @close="showSkillStore = false" />

    <!-- 资料库（全局文件 / 资源库）弹窗 -->
    <ResourceLibraryDialog :visible="showResourceLibrary" @close="showResourceLibrary = false" />

    <!-- 截屏编辑器 -->
    <ScreenshotEditor
      :visible="showScreenshotEditor"
      :image="screenshotImage"
      @confirm="handleScreenshotConfirm"
      @cancel="showScreenshotEditor = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useChat } from '@/stores/chatStore'
import { useCapabilityStore, SYSTEM_CAPABILITY_KEYS, isSystemCapability } from '@/stores/capabilityStore'
import { persistentStreamChat } from '@/api/chat'
import { getUploadUrl, uploadFileToS3, registerUploadedFile, subscribeFileStatus, getFileExtension } from '@/api/rag'
import SkillStoreDialog from '@/components/SkillStoreDialog.vue'
import ResourceLibraryDialog from '@/components/ResourceLibraryDialog.vue'
import ScreenshotEditor from '@/components/ScreenshotEditor.vue'
import { t } from '@/utils/i18n'

defineProps({
  loading: { type: Boolean, default: false }
})
const emit = defineEmits(['send-message'])

const chatStore = useChat()
const capabilityStore = useCapabilityStore()
const router = useRouter()
const message = ref('')
const attachedFiles = ref([])
const fileInput = ref(null)
const imageInput = ref(null)
const cameraInput = ref(null)
const textareaRef = ref(null)
const isFocused = ref(false)
const uploadDropdownRef = ref(null)
const skillToolsRef = ref(null)

// 弹出面板状态
const showModelPicker = ref(false)
const showSkillStore = ref(false)
const showResourceLibrary = ref(false)
const showUploadMenu = ref(false)
const showSkillToolsMenu = ref(false)
const webSearchEnabled = ref(false)
const modelSearch = ref('')

// 截屏编辑器
const showScreenshotEditor = ref(false)
const screenshotImage = ref(null)
// 输入区技能按钮标题里显示的数字；它和胶囊栏、商店弹窗共用 localStorage 状态。
const enabledSkillCount = ref(Number(localStorage.getItem('enabledSkillCount') || 0))
// 鼠标悬停工具按钮时展示“技能商店(N)”，让用户知道当前会话已经注入了多少个技能。
const skillStoreTitle = computed(() => `${t('skillStore')} (${enabledSkillCount.value})`)
// 安全读取 JSON；localStorage 可能被旧版本、浏览器插件或手动调试写坏，统一兜底避免输入区白屏。
const readJsonStorage = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
    return Array.isArray(fallback) ? (Array.isArray(value) ? value : fallback) : (value && typeof value === 'object' ? value : fallback)
  } catch {
    return fallback
  }
}
// 当前会话启用的能力 id 列表；它包含系统内置能力和用户安装能力。
// 胶囊栏不会直接使用这个数组，因为 user_context、time、math 这类系统能力不应该显示成可删除标签。
const enabledSkillIds = ref(readJsonStorage('enabledSkills', ['time', 'math', 'memory']))
// 输入区菜单使用的技能目录；group 决定它应该出现在“技能”还是“CLI”级联面板里。
// 资料库不是会话级技能，而是面向所有会话的全局文档库，已抽到独立的“文件 / 资源库”入口，故不在此目录中。
const skillChipCatalog = [
  { id: 'time', name: '时间', icon: '时', mandatory: true, menuDesc: '日期、时区、相对时间' },
  { id: 'math', name: '计算器', icon: '算', mandatory: true, menuDesc: '表达式与统计计算' },
  { id: 'memory', name: '记忆', icon: '记', mandatory: false, group: 'skill', menuDesc: '长期偏好与上下文' },
  { id: 'session', name: '会话历史', icon: '历', mandatory: false, group: 'skill', menuDesc: '当前会话检索与摘要' },
  { id: 'artifacts', name: 'Artifacts', icon: 'A', mandatory: false, group: 'skill', menuDesc: '生成代码块与交互产物' },
  { id: 'tasks', name: '任务工具', icon: 'T', mandatory: false, group: 'skill', menuDesc: '拆解待办与执行计划' },
  { id: 'cli', name: 'CLI', icon: 'CLI', mandatory: false, group: 'cli', menuDesc: '命令行执行入口' },
  { id: 'mcp:github', name: 'GitHub', icon: 'GH', mandatory: false, group: 'skill', menuDesc: '仓库、Issue、PR 工具' },
  { id: 'mcp:tavily', name: 'Tavily', icon: '搜', mandatory: false, group: 'skill', menuDesc: '网页搜索与内容提取' }
]
// 已安装 CLI 子工具基础目录；CLI 在 UI 上单独级联展示，避免和普通技能混在一起导致用户误解。
const baseInstalledCliTools = [
  { id: 'cli', name: 'CLI', icon: '>_', menuDesc: '受控命令执行' },
  { id: 'cli:npm', name: 'npm scripts', icon: 'npm', menuDesc: '运行前端脚本' },
  { id: 'cli:git', name: 'Git CLI', icon: 'git', menuDesc: '状态、差异与提交辅助' }
]
// 已启用的 CLI 子工具 id；单独存一份是为了让“CLI 技能”和“CLI 子工具”可以分别显示状态。
const enabledCliIds = ref(readJsonStorage('enabledCliTools', ['cli']))
// 全网 MCP 商店会把 mcp:market-* 的展示名写入 enabledSkillMeta；
// 输入区读取它后，新增 MCP 才能马上出现在胶囊栏和级联菜单，而不是只显示一个生硬 id。
const dynamicSkillMeta = ref(readJsonStorage('enabledSkillMeta', {}))
// 输入区下方的胶囊栏只展示用户能主动选择、安装、关闭的能力。
// 系统上下文类能力虽然会出现在后端 session 解析结果里，但它们属于运行时底座，
// 不应像截图中的“用户身份”那样占用用户的技能胶囊空间。
const isUserVisibleCapability = (capability = {}) => {
  const key = capability.skillKey || capability.id || ''
  return !SYSTEM_CAPABILITY_KEYS.has(key) && !isSystemCapability(capability)
}
// 「已安装能力」级联菜单（工具/命令行/技能）的统一数据源：
// 直接取后端会话/已安装能力，只保留“已启用（含必装）”，与背包弹窗里的「我的」用同一批数据，保证两处一致。
const myEnabledCapabilities = computed(() => {
  const items = capabilityStore.sessionCapabilities.length ? capabilityStore.sessionCapabilities : capabilityStore.installed
  return items.filter(c => c && (c.enabled || c.mandatory))
})
// 能力按 kind 归到 工具 / 命令行 / 技能 三个子菜单：内置工具+MCP→工具，cli→命令行，claude skill→技能。
const capabilityMenuGroup = (c) => (c.kind === 'cli' ? 'cli' : c.kind === 'skill' ? 'skill' : 'tool')
const capabilityToMenuItem = (c) => ({
  id: c.skillKey,
  name: c.name || c.skillKey,
  icon: c.icon || (c.kind === 'mcp' ? 'MCP' : c.kind === 'cli' ? '>_' : '技'),
  menuDesc: c.description || c.category || '',
  enabledAt: c.enabledAt || null
})
// 命令行子菜单 = 后端已启用的 CLI 能力。
const installedCliTools = computed(() => myEnabledCapabilities.value.filter(c => capabilityMenuGroup(c) === 'cli').map(capabilityToMenuItem))
const fullSkillCatalog = computed(() => {
  const knownIds = new Set(skillChipCatalog.map(skill => skill.id))
  const dynamicSkills = Object.values(dynamicSkillMeta.value)
    .filter(skill => skill?.id && !knownIds.has(skill.id))
    .filter(skill => isUserVisibleCapability({ id: skill.id, skillKey: skill.id, kind: skill.group, source: skill.source }))
    .map(skill => ({
      id: skill.id,
      name: skill.name || skill.id,
      icon: skill.icon || 'MCP',
      mandatory: false,
      group: skill.group || 'skill',
      menuDesc: skill.menuDesc || '全网 MCP 技能',
      enabledAt: skill.enabledAt || null
    }))
  return [...skillChipCatalog, ...dynamicSkills]
})
// 胶囊栏和菜单都只需要展示已启用技能，因此先用 Set 做一次快速筛选。
const installedSkillChips = computed(() => {
  const selected = new Set(enabledSkillIds.value)
  return fullSkillCatalog.value
    .filter(skill => selected.has(skill.id))
    .filter(skill => isUserVisibleCapability({ id: skill.id, skillKey: skill.id, kind: skill.group, source: skill.source }))
})
// 胶囊栏空间有限，只显示非必装技能的前 3 个；时间和计算器这种必装项不挤占视觉空间。
const pillSkillChips = computed(() => installedSkillChips.value.filter(skill => !skill.mandatory).slice(0, 3))
// 菜单里“自动 N”的数字只统计用户能感知的非必装技能，避免 mandatory 技能让数字虚高。
const menuSkillCount = computed(() => pillSkillChips.value.length)
// 记忆是一级菜单里的快捷开关，因此单独做一个 computed，模板能直接显示选中勾。
const memoryEnabled = computed(() => enabledSkillIds.value.includes('memory'))
// CLI 既可以由技能级别开启，也可以由任意 CLI 子工具开启；任一条件满足就认为 CLI 一级菜单处于启用态。
const cliEnabled = computed(() => enabledSkillIds.value.includes('cli') || enabledCliIds.value.length > 0)
// CLI 一级菜单右侧的小数字，告诉用户当前有几个 CLI 子工具会被注入。
const enabledCliCount = computed(() => installedCliTools.value.length)
// 胶囊菜单的三分组：命令行(cli)、技能(Claude skill:)、工具(其余=内置工具+MCP)。
// 用 id 前缀判定，比 group 字段更细：group 只有 cli/skill，无法区分内置/MCP/Claude。
const menuGroupOf = (item) => {
  const id = String(item?.id || '')
  if (id === 'cli' || id.startsWith('cli:') || item?.group === 'cli') return 'cli'
  if (id.startsWith('skill:')) return 'skill'
  return 'tool'
}
// 工具子菜单 = 后端已启用的内置工具 + MCP；技能子菜单 = 后端已启用的 Claude 技能。两者都与背包「我的」一致。
const installedToolItems = computed(() => myEnabledCapabilities.value.filter(c => capabilityMenuGroup(c) === 'tool').map(capabilityToMenuItem))
const installedClaudeSkills = computed(() => myEnabledCapabilities.value.filter(c => capabilityMenuGroup(c) === 'skill').map(capabilityToMenuItem))
// 各分组数量徽标 = 对应子菜单条数（都是已启用项）。
const enabledToolCount = computed(() => installedToolItems.value.length)
const enabledClaudeSkillCount = computed(() => installedClaudeSkills.value.length)

// 移动端检测
const isMobileDevice = computed(() => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
const monthlyQuota = computed(() => chatStore.quotaSnapshot?.monthly || null)
const quotaWarningEnabled = computed(() => localStorage.getItem('quotaWarning') !== 'false')
const quotaRemainingPercent = computed(() => {
  const quota = monthlyQuota.value
  if (!quota || quota.unlimited) return 100
  const used = Number(quota.tokenUsed || 0)
  const limit = Number(quota.tokenLimit || 0)
  if (!limit) return 100
  return Math.max(0, Math.round(100 - (used / limit) * 100))
})
const showQuotaWarning = computed(() => chatStore.isLoggedIn && quotaWarningEnabled.value && quotaRemainingPercent.value < 10)
const openUsageSettings = () => router.push('/settings/plan/usage')
// 胶囊栏或级联菜单点击“管理”时统一走这里：先收起小菜单，再打开大商店。
const openSkillStore = () => {
  showSkillToolsMenu.value = false
  showSkillStore.value = true
}
// 资料库是面向所有会话的全局文档库，点击后收起技能菜单并打开“文件 / 资源库”弹窗。
const openResourceLibrary = () => {
  showSkillToolsMenu.value = false
  showResourceLibrary.value = true
}
// 从 localStorage 同步技能状态；商店弹窗保存后会发 skills-updated 事件，输入区靠这个函数刷新。
const syncSkillState = () => {
  const storeItems = capabilityStore.sessionCapabilities.length ? capabilityStore.sessionCapabilities : capabilityStore.installed
  if (storeItems.length > 0 && !capabilityStore.usingFallback) {
    enabledSkillIds.value = storeItems.filter(item => item.enabled || item.mandatory).map(item => item.skillKey)
    enabledCliIds.value = storeItems.filter(item => (item.enabled || item.mandatory) && item.kind === 'cli').map(item => item.skillKey)
  } else {
    enabledSkillIds.value = readJsonStorage('enabledSkills', ['time', 'math', 'memory'])
    enabledCliIds.value = readJsonStorage('enabledCliTools', ['cli'])
  }
  enabledSkillCount.value = fullSkillCatalog.value.filter(skill => enabledSkillIds.value.includes(skill.id) && isUserVisibleCapability(skill)).length
  dynamicSkillMeta.value = readJsonStorage('enabledSkillMeta', {})
}
// 保存技能级开关；写完立即广播，确保胶囊栏、标题数字、商店列表都能同步。
const persistSkillState = () => {
  localStorage.setItem('enabledSkills', JSON.stringify(enabledSkillIds.value))
  localStorage.setItem('enabledSkillCount', String(fullSkillCatalog.value.filter(skill => enabledSkillIds.value.includes(skill.id) && isUserVisibleCapability(skill)).length))
  window.dispatchEvent(new Event('skills-updated'))
}
// 保存 CLI 子工具开关；CLI 子工具和技能级开关分开存，方便以后扩展更多命令行能力。
const persistCliState = () => {
  localStorage.setItem('enabledCliTools', JSON.stringify(enabledCliIds.value))
  window.dispatchEvent(new Event('skills-updated'))
}
// 判断某个技能是否已启用；模板里大量使用，抽成函数可以避免重复 includes 写法。
const isSkillEnabled = (skillId) => enabledSkillIds.value.includes(skillId)
// 悬停提示：直接读取菜单项上的启用时间（来自后端能力），显示「启用于 X」。
const menuEnabledTitle = (item) => {
  const at = item?.enabledAt
  if (!at) return ''
  const d = new Date(at)
  return Number.isNaN(d.getTime()) ? '' : `启用于 ${d.toLocaleString()}`
}
// 判断某个 CLI 子工具是否已启用；和 isSkillEnabled 分开，避免把 CLI 子工具误当普通技能。
const isCliEnabled = (cliId) => enabledCliIds.value.includes(cliId)
// 胶囊栏标签右侧的删除按钮；必装技能不允许删除，保护时间/计算器这类基础能力。
const currentSessionId = () => {
  const id = chatStore.currentChatId
  return typeof id === 'string' ? id : String(id || '')
}

const refreshCapabilitiesForCurrentSession = async () => {
  await capabilityStore.fetchSession(currentSessionId())
  syncSkillState()
}

const removeSkillTag = async (skillId) => {
  const mandatoryIds = new Set(fullSkillCatalog.value.filter(skill => skill.mandatory).map(skill => skill.id))
  if (mandatoryIds.has(skillId)) return
  const sessionId = currentSessionId()
  try {
    await capabilityStore.toggleSessionSkill(sessionId, skillId, false)
    syncSkillState()
    return
  } catch (error) {
    console.warn('会话技能关闭接口不可用，使用本地缓存兜底:', error)
  }
  enabledSkillIds.value = enabledSkillIds.value.filter(id => id !== skillId)
  if (dynamicSkillMeta.value[skillId]) {
    const nextMeta = { ...dynamicSkillMeta.value }
    delete nextMeta[skillId]
    dynamicSkillMeta.value = nextMeta
    localStorage.setItem('enabledSkillMeta', JSON.stringify(nextMeta))
  }
  // 如果删除的是 CLI 技能，也要同步移除 CLI 子工具里的主 CLI 项，避免菜单显示“子工具启用但技能未启用”的矛盾。
  if (skillId === 'cli') {
    enabledCliIds.value = enabledCliIds.value.filter(id => id !== 'cli')
    persistCliState()
  }
  persistSkillState()
  syncSkillState()
}
// 级联菜单中普通技能的开关逻辑；mandatory 技能直接返回，不给用户关闭入口。
const toggleSkillById = async (skillId) => {
  const catalogSkill = fullSkillCatalog.value.find(skill => skill.id === skillId)
  if (catalogSkill?.mandatory) return
  const nextEnabled = !enabledSkillIds.value.includes(skillId)
  try {
    await capabilityStore.toggleSessionSkill(currentSessionId(), skillId, nextEnabled)
    syncSkillState()
    return
  } catch (error) {
    console.warn('会话技能开关接口不可用，使用本地缓存兜底:', error)
  }
  const next = new Set(enabledSkillIds.value)
  if (next.has(skillId)) next.delete(skillId)
  else next.add(skillId)
  enabledSkillIds.value = Array.from(next)
  // CLI 是一个特殊技能：它既是技能包，也是 CLI 子工具集合的父入口，所以切换时要同步 enabledCliTools。
  if (skillId === 'cli') {
    const cliNext = new Set(enabledCliIds.value)
    if (next.has('cli')) cliNext.add('cli')
    else cliNext.delete('cli')
    enabledCliIds.value = Array.from(cliNext)
    persistCliState()
  }
  persistSkillState()
}
// CLI 子工具开关；只要还有任意 CLI 子工具开启，就把技能级 cli 放入 enabledSkills。
const toggleCliTool = async (cliId) => {
  const nextEnabled = !enabledCliIds.value.includes(cliId)
  try {
    await capabilityStore.toggleSessionSkill(currentSessionId(), cliId, nextEnabled)
    syncSkillState()
    return
  } catch (error) {
    console.warn('CLI 会话开关接口不可用，使用本地缓存兜底:', error)
  }
  const next = new Set(enabledCliIds.value)
  if (next.has(cliId)) next.delete(cliId)
  else next.add(cliId)
  enabledCliIds.value = Array.from(next)
  const skillNext = new Set(enabledSkillIds.value)
  if (enabledCliIds.value.length > 0) skillNext.add('cli')
  else skillNext.delete('cli')
  enabledSkillIds.value = Array.from(skillNext)
  persistCliState()
  persistSkillState()
}
// “记忆”是一级菜单快捷项，本质还是普通技能开关，所以复用统一的 toggleSkillById。
const toggleMemorySkill = () => {
  toggleSkillById('memory')
}

// LobeHub 图标 CDN 基础 URL
const ICON_CDN = 'https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons'

// Provider → LobeHub icon slug 映射
const providerIconSlug = {
  'openai':    'openai',
  'anthropic': 'anthropic',
  'google':    'google',
  'deepseek':  'deepseek',
  'ollama':    'ollama',
  'meta':      'meta',
  'zhipu':     'zhipu',
  'xai':       'xai',
  'kimi':      'kimi',
  'minimax':   'minimax',
  'xiaomi':    'openai',
  'alibaba':   'qwen',
}

// 模型名 → 更精确的 icon slug（优先匹配模型级别图标）
const modelIconSlug = {
  'claude':   'claude',
  'gemini':   'gemini',
  'grok':     'grok',
  'kimi':     'kimi',
  'minimax':  'minimax',
  'glm':      'chatglm',
  'moonshot': 'moonshot',
  'qwen':     'qwen',
  'tongyi':   'qwen',
}

// 获取模型图标 URL
const getModelIconUrl = (modelCode, provider) => {
  if (modelCode) {
    const c = modelCode.toLowerCase()
    for (const [keyword, slug] of Object.entries(modelIconSlug)) {
      if (c.includes(keyword)) return `${ICON_CDN}/${slug}.svg`
    }
  }
  const slug = providerIconSlug[provider] || 'openai'
  return `${ICON_CDN}/${slug}.svg`
}

// 从 provider_code 中提取 provider 关键词
const getProvider = (code) => {
  if (!code) return 'openai'
  const c = code.toLowerCase()
  if (c.includes('anthropic') || c.includes('claude')) return 'anthropic'
  if (c.includes('google') || c.includes('gemini')) return 'google'
  if (c.includes('deepseek')) return 'deepseek'
  if (c.includes('ollama')) return 'ollama'
  if (c.includes('meta') || c.includes('llama')) return 'meta'
  if (c.includes('zhipu') || c.includes('glm')) return 'zhipu'
  if (c.includes('xai') || c.includes('grok')) return 'xai'
  if (c.includes('moonshot') || c.includes('kimi')) return 'kimi'
  if (c.includes('minimax')) return 'minimax'
  if (c.includes('alibaba') || c.includes('qwen') || c.includes('tongyi')) return 'alibaba'
  return 'openai'
}

// 从模型名推断 provider
const getProviderFromModel = (modelCode) => {
  if (!modelCode) return 'openai'
  const c = modelCode.toLowerCase()
  if (c.includes('claude')) return 'anthropic'
  if (c.includes('gemini')) return 'google'
  if (c.includes('deepseek')) return 'deepseek'
  if (c.includes('gpt') || c.includes('o1') || c.includes('o3') || c.includes('codex')) return 'openai'
  if (c.includes('llama')) return 'meta'
  if (c.includes('glm')) return 'zhipu'
  if (c.includes('grok')) return 'xai'
  if (c.includes('kimi') || c.includes('moonshot')) return 'kimi'
  if (c.includes('minimax')) return 'minimax'
  if (c.includes('mimo')) return 'xiaomi'
  if (c.includes('qwen') || c.includes('tongyi')) return 'alibaba'
  return 'ollama'
}

// 不再使用写死的兜底模型：模型列表完全来自后端登录返回的 availableModels。
// 这样“后台配置什么、前端就显示什么”，避免出现数据库里并不存在的“幽灵模型”
// 被选中后导致对话接口 500（模型不存在或未启用）。
const fallbackModels = []

// 从 chatStore.availableModels 构建模型列表
const models = computed(() => {
  const storeModels = chatStore.availableModels
  if (storeModels && storeModels.length > 0) {
    return storeModels.map(m => ({
      value: m.modelCode,
      label: m.displayName || m.modelCode,
      provider: getProvider(m.providerCode) || getProviderFromModel(m.modelCode),
      level: m.level || 2,
      local: m.localModel || false,
      stream: m.supportsStream !== false,
      score: m.score ?? 0,
    }))
  }
  return fallbackModels
})

// 按分数排序取 Top 3 的模型 value 集合（用于奖牌标识）
const top3ModelValues = computed(() => {
  const sorted = [...models.value].filter(m => m.score > 0).sort((a, b) => b.score - a.score)
  return sorted.slice(0, 3).map(m => m.value)
})

// 获取模型排名（1/2/3），不在前三返回 0
const getModelRank = (modelValue) => {
  const idx = top3ModelValues.value.indexOf(modelValue)
  return idx >= 0 ? idx + 1 : 0
}

// 第一 ~ 第四梯队分组
const tier1Models = computed(() => models.value.filter(m => m.level === 1))
const tier2Models = computed(() => models.value.filter(m => m.level === 2))
const tier3Models = computed(() => models.value.filter(m => m.level === 3))
const tier4Models = computed(() => models.value.filter(m => m.level === 4))

const selectedModel = ref(null)

const selectedModelIconUrl = computed(() => {
  const m = models.value.find(x => x.value === selectedModel.value)
  return m ? getModelIconUrl(m.value, m.provider) : `${ICON_CDN}/openai.svg`
})
const selectedModelLabel = computed(() => {
  const m = models.value.find(x => x.value === selectedModel.value)
  return m ? m.label : t('defaultModel')
})

const filteredModels = computed(() => {
  const q = modelSearch.value.toLowerCase()
  if (!q) return models.value
  return models.value.filter(m => m.label.toLowerCase().includes(q) || (m.value || '').toLowerCase().includes(q))
})

const selectModel = (m) => {
  selectedModel.value = m.value
  showModelPicker.value = false
  modelSearch.value = ''
}

const closeAllPopups = () => {
  showModelPicker.value = false
  showUploadMenu.value = false
  showSkillToolsMenu.value = false
}

// 点击外部关闭上传菜单
function handleClickOutside(e) {
  if (uploadDropdownRef.value && !uploadDropdownRef.value.contains(e.target)) {
    showUploadMenu.value = false
  }
  if (skillToolsRef.value && !skillToolsRef.value.contains(e.target)) {
    showSkillToolsMenu.value = false
  }
}
onMounted(() => {
  refreshCapabilitiesForCurrentSession().catch((error) => {
    console.warn('能力状态接口不可用，使用本地缓存兜底:', error)
    syncSkillState()
  })
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('storage', syncSkillState)
  window.addEventListener('skills-updated', syncSkillState)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('storage', syncSkillState)
  window.removeEventListener('skills-updated', syncSkillState)
  attachedFiles.value.forEach(f => f.closeSSE?.())
})

watch(() => chatStore.currentChatId, () => {
  refreshCapabilitiesForCurrentSession().catch((error) => {
    console.warn('切换会话后能力状态刷新失败，使用本地缓存兜底:', error)
    syncSkillState()
  })
})

// 文件处理
const triggerFileInput = () => {
  showUploadMenu.value = false
  showSkillToolsMenu.value = false
  fileInput.value?.click()
}
const triggerImageInput = () => {
  showUploadMenu.value = false
  showSkillToolsMenu.value = false
  imageInput.value?.click()
}

// ─── RAG 上传核心：预签名 URL → 直传 S3 → 登记 → SSE 状态跟踪 ──────────────
const uploadFileToServer = async (rawFile) => {
  const userId = chatStore.userId || localStorage.getItem('userId') || 'guest'
  const sessionId = typeof chatStore.currentChatId === 'string' ? chatStore.currentChatId : String(chatStore.currentChatId || '')
  const ext = getFileExtension(rawFile.name)
  const findEntry = () => attachedFiles.value.find(f => f.file === rawFile)

  try {
    // Step 1: 获取预签名 URL
    const { uploadUrl, objectKey, contentType, fileId } = await getUploadUrl(userId, {
      sessionId,
      fileType: ext,
      fileName: rawFile.name,
      fileSize: rawFile.size
    })

    // Step 2: 直传 S3
    await uploadFileToS3(uploadUrl, rawFile, contentType, (percent) => {
      const entry = findEntry()
      if (entry) entry.progress = percent
    })

    // Step 3: 告知后端登记文件（创建 RECEIVED 记录）
    const entry = findEntry()
    if (entry) {
      entry.status = 'registering'
      entry.progress = 100
      entry.objectKey = objectKey
      entry.fileId = fileId
    }
    await registerUploadedFile(userId, { objectKey, fileName: rawFile.name })

    // Step 7: 订阅 SSE 状态流，跟踪 RAG 处理进度
    if (entry) {
      entry.status = 'processing'
      entry.closeSSE = subscribeFileStatus(fileId, userId, {
        timeoutSeconds: 120,
        pollIntervalMillis: 2000,
        onStatus: (data) => {
          const e = findEntry()
          if (!e) return
          e.ragStatus = data.ragStatus
          e.detailMessage = data.detailMessage
          if (data.completed) {
            e.status = data.availableForChat ? 'ready' : 'error'
            e.errorMsg = data.availableForChat ? null : (data.detailMessage || 'RAG 处理未完成')
          }
        },
        onTimeout: (data) => {
          const e = findEntry()
          if (e && !data.completed) e.status = 'processing' // 仍在处理，保持状态
        },
        onError: async () => {
          // SSE 断开降级：单次轮询
          try {
            const { getFileStatus } = await import('@/api/rag')
            const data = await getFileStatus(fileId, userId)
            const e = findEntry()
            if (e && data.completed) {
              e.status = data.availableForChat ? 'ready' : 'error'
              e.errorMsg = data.availableForChat ? null : (data.detailMessage || 'RAG 处理未完成')
            }
          } catch { /* 静默失败 */ }
        }
      })
    }
  } catch (err) {
    console.error('[RAG] 文件上传失败:', err)
    const entry = findEntry()
    if (entry) {
      entry.status = 'error'
      entry.errorMsg = err.message
    }
  }
}

const handleFileSelect = (event) => {
  Array.from(event.target.files || []).forEach(file => {
    attachedFiles.value.push({ name: file.name, file, size: file.size, status: 'uploading', progress: 0 })
    uploadFileToServer(file)
  })
  event.target.value = ''
}

const handleImageSelect = (event) => {
  Array.from(event.target.files || []).forEach(file => {
    attachedFiles.value.push({ name: file.name, file, size: file.size, type: 'image', status: 'uploading', progress: 0 })
    uploadFileToServer(file)
  })
  event.target.value = ''
}

const handleCameraCapture = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    attachedFiles.value.push({ name: file.name, file, size: file.size, type: 'image', status: 'uploading', progress: 0 })
    uploadFileToServer(file)
  }
  event.target.value = ''
}

// 截屏 / 拍照
const triggerScreenCapture = async () => {
  showUploadMenu.value = false
  if (isMobileDevice.value) {
    cameraInput.value?.click()
    return
  }
  // PC 端：Screen Capture API
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false })
    const track = stream.getVideoTracks()[0]
    const video = document.createElement('video')
    video.srcObject = stream
    video.autoplay = true
    await new Promise((resolve) => { video.onloadedmetadata = resolve })
    await video.play()

    // 等待一帧渲染
    await new Promise(r => requestAnimationFrame(r))

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    track.stop()
    stream.getTracks().forEach(t => t.stop())

    // 创建 Image 对象传给编辑器
    const img = new Image()
    img.onload = () => {
      screenshotImage.value = img
      showScreenshotEditor.value = true
    }
    img.src = canvas.toDataURL('image/png')
  } catch (err) {
    // 用户取消了屏幕选择
    if (err.name !== 'NotAllowedError') {
      console.error('Screenshot failed:', err)
    }
  }
}

// 截屏编辑器确认
const handleScreenshotConfirm = (file) => {
  attachedFiles.value.push({ name: file.name, file, size: file.size, type: 'image', status: 'uploading', progress: 0 })
  uploadFileToServer(file)
  showScreenshotEditor.value = false
  screenshotImage.value = null
}

const removeFile = (index) => {
  const entry = attachedFiles.value[index]
  entry?.closeSSE?.()
  attachedFiles.value.splice(index, 1)
}

// 文件预览辅助
const isImageFile = (f) => {
  if (f.type === 'image') return true
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(f.name)
}

const filePreviewUrls = new WeakMap()
const getFilePreviewUrl = (f) => {
  if (filePreviewUrls.has(f.file)) return filePreviewUrls.get(f.file)
  const url = URL.createObjectURL(f.file)
  filePreviewUrls.set(f.file, url)
  return url
}

const truncateName = (name) => {
  if (name.length <= 18) return name
  const ext = name.lastIndexOf('.') > 0 ? name.slice(name.lastIndexOf('.')) : ''
  return name.slice(0, 14 - ext.length) + '…' + ext
}

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const ragStatusText = (rs) => ({
  RECEIVED:    '已接收',
  PARSING:     '解析中…',
  DOWNLOADING: '下载中…',
  EXTRACTING:  '抽取文本…',
  CHUNKING:    '分块中…',
  EMBEDDING:   '向量化…',
  INDEXING:    '索引中…',
  SUCCESS:     '处理完成',
  SKIPPED:     '已跳过',
  FAILED:      '处理失败',
})[rs] || 'RAG 处理中…'

// 回车键处理
const handleEnterKey = (e) => {
  const shortcut = localStorage.getItem('sendShortcut') || 'enter'
  if (shortcut === 'enter') {
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  } else {
    // ctrl+enter mode
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      sendMessage()
    }
  }
}

// 发送
const sendMessage = () => {
  if (!message.value.trim()) return
  // 有文件还在上传/处理中，阻止发送
  if (attachedFiles.value.some(f => ['uploading', 'registering', 'processing'].includes(f.status))) return
  const content = message.value.trim()
  const files = attachedFiles.value.map(f => ({
    objectKey: f.objectKey,
    fileId: f.fileId,
    name: f.name,
    size: f.size,
    isImage: isImageFile(f),
    previewUrl: getFilePreviewUrl(f),
  }))

  emit('send-message', { content, files, model: selectedModel.value, isUserMessage: true })
  emit('send-message', { content: '', isStreaming: true, isUserMessage: false, timestamp: Date.now(), isInitialMessage: true })

  const sessionId = typeof chatStore.currentChatId === 'string' ? chatStore.currentChatId : String(chatStore.currentChatId || '')
  const chatRequest = {
    message: content,
    sessionId,
    model: selectedModel.value || null,
    systemMessage: '你是一个有帮助的AI助手，请用中文回答问题',
    temperature: 0.7,
    maxTokens: 4096,
    attachmentFileIds: files.map(f => f.fileId).filter(Boolean)
  }

  persistentStreamChat(
    chatRequest,
    (response) => {
      if (response && response.content) {
        emit('send-message', { content: response.content, isStreaming: true, isUserMessage: false, timestamp: response.timestamp, model: response.model })
      }
    },
    (error) => {
      emit('send-message', { content: '出错了，请稍后重试: ' + error.message, isError: true })
    },
    (fullText) => {
      emit('send-message', { content: fullText, isStreaming: false, isUserMessage: false })
    }
  )

  message.value = ''
  attachedFiles.value = []
  if (textareaRef.value) textareaRef.value.style.height = 'auto'
}

const autoResize = (e) => {
  e.target.style.height = 'auto'
  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
}
</script>

<style scoped>
/* ─── 主容器 ─── */
.input-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 24px 18px;
  background: var(--bg-primary);
}

/* ─── 输入卡片 ─── */
.input-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: 22px;
  border: 1.5px solid var(--border-color);
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.08);
  transition: border-color 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              max-height 0.4s cubic-bezier(0.4,0,0.2,1);
  overflow: visible;
  width: 100%;
  max-width: 780px;
}
.input-card.focused {
  border-color: var(--primary-color);
  box-shadow: 0 4px 24px rgba(45,134,89,0.1), 0 0 0 3px rgba(45,134,89,0.06);
  transform: translateY(-1px);
}

/* ─── 文件预览（卡片内部 Claude 风格） ─── */
.files-preview-inner {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 14px 16px 6px;
  position: relative;
}

.file-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  animation: fileCardIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* 图片缩略图卡 */
.file-card-thumb {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  flex-shrink: 0;
  transition: transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s;
}
.file-card-thumb:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.file-card-name {
  font-size: 11px;
  color: var(--text-sub);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

/* 关闭按钮 */
.file-card-close {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba(0,0,0,0.55);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
  backdrop-filter: blur(4px);
}
.file-card-thumb:hover .file-card-close,
.file-card-doc:hover .file-card-close {
  opacity: 1;
  transform: scale(1);
}
.file-card-close:hover {
  background: rgba(224,92,75,0.85);
  transform: scale(1.15) !important;
}

/* 文档文件卡 */
.file-card-doc {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 32px 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  min-width: 160px;
  max-width: 220px;
  transition: transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s;
}
.file-card-doc:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.file-card-doc-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--hover-bg);
  color: var(--primary-color);
  flex-shrink: 0;
}
.file-card-doc-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.file-card-doc-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-card-doc-size {
  font-size: 10px;
  color: var(--text-sub);
}
.file-card-close.doc-close {
  top: 50%;
  right: 6px;
  transform: translateY(-50%) scale(0.8);
  background: rgba(0,0,0,0.08);
  color: var(--text-sub);
}
.file-card-doc:hover .file-card-close.doc-close {
  opacity: 1;
  transform: translateY(-50%) scale(1);
}
.file-card-close.doc-close:hover {
  background: rgba(224,92,75,0.15);
  color: #e05c4b;
  transform: translateY(-50%) scale(1.15) !important;
}

/* ─── 上传状态 ─── */
.thumb-dim { filter: brightness(0.6); transition: filter 0.3s; }
.file-upload-overlay,
.file-error-overlay {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 3px;
  pointer-events: none; border-radius: inherit;
}
.file-upload-overlay { background: rgba(0,0,0,0.38); }
.file-error-overlay  { background: rgba(220,38,38,0.4); color: #fff; }
.upload-spin-icon { animation: uploadSpin 0.9s linear infinite; color: #fff; flex-shrink: 0; }
@keyframes uploadSpin { to { transform: rotate(360deg); } }
.upload-pct { font-size: 10px; font-weight: 700; color: #fff; line-height: 1; letter-spacing: 0.02em; }
.doc-uploading { opacity: 0.85; }
.doc-error .file-card-doc-name,
.doc-error .file-card-doc-size {
  color: #e05c4b;
}
.doc-error .file-card-doc-icon {
  color: #e05c4b;
}

.doc-progress-track {
  width: 100%;
  height: 3px;
  background: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}
.doc-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--theme-gradient-from, #4a9d6f), var(--theme-gradient-to, #6ab187));
  border-radius: 2px;
  transition: width 0.25s ease;
}

/* 文件卡片动画 */
@keyframes fileCardIn {
  0% { opacity: 0; transform: scale(0.7) translateY(8px); }
  60% { opacity: 1; transform: scale(1.04) translateY(-2px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.file-preview-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.file-preview-leave-active {
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
}
.file-preview-enter-from {
  opacity: 0;
  transform: scale(0.7) translateY(8px);
}
.file-preview-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(-4px);
}

/* ─── 文本框 ─── */
.chat-textarea {
  flex: 1;
  border: none;
  background: none;
  padding: 16px 18px 4px;
  font-size: 15px;
  font-family: inherit;
  color: var(--text-primary);
  resize: none;
  outline: none;
  min-height: 28px;
  max-height: 200px;
  line-height: 1.6;
  overflow-y: auto;
}
.chat-textarea::placeholder {
  color: var(--text-sub);
}

.quota-warning {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 12px 0;
  padding: 9px 12px;
  border: 1px solid rgba(245, 158, 11, 0.28);
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.08);
  color: #9a5b00;
  font-size: 12px;
}

.quota-warning button {
  border: none;
  background: transparent;
  color: #9a5b00;
  cursor: pointer;
  font-weight: 800;
  white-space: nowrap;
}

/* ─── 底部工具栏 ─── */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 10px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tool-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: none;
  color: var(--text-sub);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}
.tool-btn:hover {
  background: var(--hover-bg-medium);
  color: var(--primary-color);
  transform: translateY(-2px) scale(1.06);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--primary-color) 18%, transparent);
}
.tool-btn:active {
  transform: scale(0.9);
  transition-duration: 0.1s;
}
.tool-btn.active {
  background: var(--hover-bg-medium);
  color: var(--primary-color);
}

.skill-store-btn {
  width: 36px;
  overflow: hidden;
}

.skill-tools-wrapper {
  position: relative;
}

.skill-tools-menu {
  /* 菜单固定挂在技能按钮正上方，避免遮挡输入框正文区域。 */
  position: absolute;
  left: 0;
  bottom: calc(100% + 10px);
  width: 286px;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background:
    radial-gradient(circle at 12% -10%, color-mix(in srgb, var(--primary-color) 8%, transparent), transparent 36%),
    var(--bg-primary);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.16), 0 0 0 1px color-mix(in srgb, var(--primary-color) 6%, transparent) inset;
  z-index: 130;
}

.skill-menu-title {
  padding: 7px 10px 8px;
  color: var(--text-sub);
  font-size: 12px;
  font-weight: 700;
}

.skill-menu-row {
  width: 100%;
  height: 42px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 12px;
  font-size: 14px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  transition: background 0.16s ease;
}

.skill-menu-row:hover,
.skill-menu-row.active,
.skill-menu-row.muted:hover {
  background: var(--hover-bg);
}

.skill-menu-row.muted {
  color: var(--text-sub);
}

.skill-menu-row.cli-row {
  color: var(--primary-color);
}

.skill-menu-left {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.skill-menu-left svg {
  flex-shrink: 0;
}

.skill-menu-chevron {
  color: var(--text-sub);
  font-size: 18px;
  line-height: 1;
}

.skill-menu-check {
  color: var(--primary-color);
  font-size: 18px;
  line-height: 1;
}

.auto-badge {
  height: 20px;
  padding: 0 7px;
  border-radius: 999px;
  background: var(--hover-bg-medium);
  color: var(--text-sub);
  font-size: 11px;
  display: inline-flex;
  align-items: center;
}

.scope-badge {
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary-color) 14%, transparent);
  color: var(--primary-color);
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
}

.skill-menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 6px -8px;
}

.skill-cascade-panel {
  /* 级联面板默认隐藏，父级 hover 时才展开。锚定到行底部并向上展开，避免菜单贴近屏幕底部时被裁切。 */
  display: none;
  position: absolute;
  left: calc(100% + 8px);
  bottom: 0;
  top: auto;
  width: 318px;
  max-height: min(60vh, 460px);
  overflow-y: auto;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background:
    radial-gradient(circle at 12% -10%, color-mix(in srgb, var(--primary-color) 8%, transparent), transparent 36%),
    var(--bg-primary);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.16), 0 0 0 1px color-mix(in srgb, var(--primary-color) 6%, transparent) inset;
  animation: cascadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.has-submenu:hover .skill-cascade-panel {
  /* 用户移到带箭头的行上时才显示右侧面板，减少主菜单初始信息密度。 */
  display: block;
}

/* 透明“悬停桥”：把它放在“行”上而不是二级面板上。
   二级面板有 overflow-y:auto，会连带把 overflow-x 变成 auto，从而裁掉放在面板负偏移处的桥；
   而行没有 overflow 裁剪，所以这里用 .has-submenu::after 覆盖行与面板之间的间隙，
   光标从行平移到面板时始终停留在 .has-submenu 的 hover 区域内，面板不再消失。 */
.has-submenu::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 100%;
  width: 18px;
  display: none;
}

.has-submenu:hover::after {
  display: block;
}

.submenu-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 3px 4px 9px;
}

.submenu-head span {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 800;
}

.submenu-head small {
  color: var(--text-sub);
  font-size: 11px;
}

.cascade-item {
  /* 每个级联项固定高度，保证技能名称、说明和状态符号变化时不会造成菜单跳动。 */
  width: 100%;
  height: 54px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  transition: background 0.16s ease, transform 0.16s ease;
}

.cascade-item:hover {
  background: var(--hover-bg);
  transform: translateX(2px);
}

.cascade-item.active {
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
}

.cascade-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--hover-bg-medium);
  color: var(--primary-color);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 800;
}

.cascade-icon.text,
.cascade-icon.terminal {
  font-size: 10px;
}

.cascade-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cascade-copy strong {
  font-size: 13px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cascade-copy small {
  color: var(--text-sub);
  font-size: 11px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cascade-state {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  background: var(--hover-bg-medium);
  color: var(--text-sub);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 800;
}

.cascade-item.active .cascade-state {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: #fff;
}

.cascade-empty {
  padding: 14px 6px;
  text-align: center;
  color: var(--text-sub);
  font-size: 12px;
}

.cascade-manage {
  width: 100%;
  height: 34px;
  margin-top: 7px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--primary-color);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  transition: background 0.16s ease, border-color 0.16s ease;
}

.cascade-manage:hover {
  border-color: color-mix(in srgb, var(--primary-color) 40%, transparent);
  background: var(--hover-bg);
}

.cli-icon {
  font-size: 11px;
  font-weight: 800;
  color: var(--primary-color);
}

@keyframes cascadeIn {
  from { opacity: 0; transform: translateY(6px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.tool-menu-pop-enter-active {
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
.tool-menu-pop-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.tool-menu-pop-enter-from,
.tool-menu-pop-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}

/* ─── Provider 官方图标（LobeHub CDN） ─── */
.provider-icon {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  object-fit: contain;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.picker-item:hover .provider-icon {
  transform: scale(1.18) rotate(-4deg);
}

/* ─── 奖牌徽章（金银铜） ─── */
.medal-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 1px 7px;
  border-radius: 6px;
  flex-shrink: 0;
  letter-spacing: 0.02em;
  line-height: 1.6;
  position: relative;
  overflow: hidden;
  animation: medalPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.medal-badge::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -60%;
  width: 40%;
  height: 200%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
  animation: medalShine 2.8s ease-in-out infinite;
}

/* 金牌 — 1st */
.medal-badge.gold {
  background: linear-gradient(135deg, #FFD700, #FFA500, #FFD700);
  color: #7A5C00;
  box-shadow: 0 2px 10px rgba(255, 215, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.5);
  text-shadow: 0 1px 2px rgba(255, 215, 0, 0.3);
}

/* 银牌 — 2nd */
.medal-badge.silver {
  background: linear-gradient(135deg, #E8E8E8, #B0B0B0, #D4D4D4);
  color: #4A4A4A;
  box-shadow: 0 2px 10px rgba(192, 192, 192, 0.45), inset 0 1px 0 rgba(255,255,255,0.6);
  text-shadow: 0 1px 1px rgba(255,255,255,0.5);
}

/* 铜牌 — 3rd */
.medal-badge.bronze {
  background: linear-gradient(135deg, #E8A87C, #CD7F32, #D4956B);
  color: #5C3A1E;
  box-shadow: 0 2px 10px rgba(205, 127, 50, 0.4), inset 0 1px 0 rgba(255,255,255,0.35);
  text-shadow: 0 1px 1px rgba(205, 127, 50, 0.2);
}

@keyframes medalPop {
  0% { opacity: 0; transform: scale(0) rotate(-15deg); }
  60% { opacity: 1; transform: scale(1.2) rotate(3deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}
@keyframes medalShine {
  0%, 75% { left: -60%; }
  100% { left: 140%; }
}

/* ─── 模型选择器分组标签 ─── */
.picker-group-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-sub);
  padding: 10px 14px 5px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  animation: pickerItemSlide 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.picker-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
  flex-shrink: 0;
}
.picker-badge.local {
  background: rgba(77, 107, 254, 0.12);
  color: #4D6BFE;
}

/* ─── 发送按钮 ─── */
.send-btn {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to));
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}
.send-btn::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -100%;
  width: 60%;
  height: 200%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
  transition: left 0.5s;
}
.send-btn:hover:not(:disabled)::before {
  left: 150%;
}
.send-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
  opacity: 0;
  transition: opacity 0.2s;
}
.send-btn:hover:not(:disabled)::after {
  opacity: 1;
}
.send-btn:hover:not(:disabled) {
  transform: scale(1.12) translateY(-2px);
  box-shadow: 0 8px 24px rgba(45,134,89,0.35), 0 0 0 3px rgba(45,134,89,0.1);
}
.send-btn:active:not(:disabled) {
  transform: scale(0.92);
  box-shadow: 0 2px 8px rgba(45,134,89,0.2);
  transition-duration: 0.1s;
}
.send-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── 模型选择器面板 ─── */
.model-picker {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 10px;
  width: 290px;
  background: var(--bg-primary);
  border: 1.5px solid var(--border-color);
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.06);
  z-index: 100;
  overflow: hidden;
  backdrop-filter: blur(12px);
}

.pop-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pop-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}
.pop-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.9);
}
.pop-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

.picker-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-color);
}
.picker-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
}
.picker-input::placeholder { color: var(--text-sub); }

.picker-list {
  max-height: 340px;
  overflow-y: auto;
  padding: 4px;
}

.picker-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
  animation: pickerItemSlide 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: calc(var(--item-index, 0) * 0.03s);
  position: relative;
}
.picker-item::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: var(--hover-bg);
  opacity: 0;
  transition: opacity 0.22s;
}
.picker-item:hover::before {
  opacity: 1;
}
.picker-item:hover {
  transform: translateX(4px);
}
.picker-item:active {
  transform: translateX(4px) scale(0.97);
}
.picker-item.selected {
  background: var(--hover-bg-medium);
}
.picker-item.selected::after {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--primary-color);
}

@keyframes pickerItemSlide {
  from { opacity: 0; transform: translateX(-12px) translateY(4px); }
  to { opacity: 1; transform: translateX(0) translateY(0); }
}

.picker-item > * { position: relative; z-index: 1; }

.picker-item-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}
.picker-check {
  color: var(--primary-color);
  flex-shrink: 0;
  animation: checkBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes checkBounce {
  0% { opacity: 0; transform: scale(0) rotate(-15deg); }
  60% { transform: scale(1.2) rotate(5deg); }
  100% { opacity: 1; transform: scale(1) rotate(0); }
}

.picker-list::-webkit-scrollbar { width: 4px; }
.picker-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }

/* ─── 技能/MCP 胶囊栏（LobeHub 风格） ─── */
.skill-mcp-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 780px;
  margin-top: -3px;
  padding: 0 116px 0 116px;
}

.skill-mcp-pill {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 48px;
  padding: 7px 18px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  width: 100%;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.skill-mcp-pill:hover {
  border-color: var(--primary-color);
  box-shadow: 0 6px 20px rgba(45,134,89,0.12);
  transform: translateY(-2px);
}

.skill-mcp-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-sub);
  flex-shrink: 0;
  transition: color 0.15s;
}
.skill-mcp-pill:hover .skill-mcp-left {
  color: var(--primary-color);
}

.skill-mcp-right {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: nowrap;
  justify-content: flex-end;
}

.mcp-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--hover-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
  color: var(--primary-color);
  font-weight: 500;
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mcp-tag-x {
  background: none;
  border: none;
  color: var(--text-sub);
  cursor: pointer;
  font-size: 11px;
  padding: 0;
  line-height: 1;
}
.mcp-tag-x:hover { color: #e05c4b; }

.mcp-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background: #ea4335;
  flex-shrink: 0;
  transition: transform 0.15s;
  line-height: 1;
}
.mcp-dot:hover { transform: scale(1.15); }
.mcp-dot.g { background: #34a853; }
.mcp-dot.s { background: #4a154b; }
.mcp-dot.gh { background: #24292f; font-size: 8px; }
.mcp-dot.n { background: #000000; }
.mcp-dot.x { background: #1d9bf0; }

/* ─── 上传下拉菜单 ─── */
.upload-dropdown-wrapper {
  position: relative;
}

.upload-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: 180px;
  background: var(--bg-primary);
  border: 1.5px solid var(--border-color);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.14);
  z-index: 100;
  overflow: hidden;
  padding: 6px;
}

.upload-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: none;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: left;
}
.upload-menu-item:hover {
  background: var(--hover-bg);
  transform: translateX(4px) scale(1.01);
}
.upload-menu-item:active {
  background: var(--hover-bg-medium);
  transform: translateX(2px) scale(0.97);
  transition-duration: 0.1s;
}

.upload-menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--hover-bg);
  color: var(--primary-color);
  flex-shrink: 0;
  transition: all 0.15s ease;
}
.upload-menu-item:hover .upload-menu-icon {
  background: var(--hover-bg-medium);
}

.upload-menu-text {
  flex: 1;
}

/* 上传菜单弹出动画 */
.upload-pop-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.upload-pop-leave-active {
  transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
}
.upload-pop-enter-from,
.upload-pop-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px) scale(0.92);
}
/* 菜单项交错入场 */
.upload-menu-item:nth-child(1) { animation: menuItemIn 0.3s 0.02s both; }
.upload-menu-item:nth-child(2) { animation: menuItemIn 0.3s 0.06s both; }
.upload-menu-item:nth-child(3) { animation: menuItemIn 0.3s 0.10s both; }
@keyframes menuItemIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ─── 手机端 ─── */
@media (max-width: 768px) {
  .input-section {
    padding: 8px 12px 14px;
  }
  .chat-textarea {
    font-size: 14px;
    padding: 12px 14px 4px;
  }
  .model-picker {
    width: 240px;
  }
  .upload-menu {
    width: 160px;
    left: 0;
    transform: translateX(0);
  }
  .skill-tools-menu {
    width: min(286px, calc(100vw - 24px));
  }
  .skill-cascade-panel {
    position: static;
    width: 100%;
    margin-top: 8px;
    box-shadow: none;
    border-color: var(--border-color);
  }
  .has-submenu:hover .skill-cascade-panel {
    display: block;
  }
  .upload-pop-enter-from,
  .upload-pop-leave-to {
    opacity: 0;
    transform: translateX(0) translateY(8px) scale(0.95);
  }
  /* 文件预览：手机端缩略图小一点 */
  .files-preview-inner {
    padding: 10px 12px 4px;
    gap: 8px;
  }
  .file-card-thumb {
    width: 64px;
    height: 64px;
    border-radius: 10px;
  }
  .file-card-name {
    max-width: 64px;
    font-size: 10px;
  }
  .file-card-doc {
    min-width: 140px;
    max-width: 180px;
    padding: 8px 28px 8px 10px;
  }
  .file-card-doc-icon {
    width: 30px;
    height: 30px;
  }
  .file-card-close {
    opacity: 1;
    transform: scale(1);
  }
  .file-card-close.doc-close {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}
</style>
