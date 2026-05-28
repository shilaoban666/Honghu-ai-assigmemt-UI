<template>
  <Teleport to="body">
    <Transition name="store-shell">
      <div v-if="visible" class="store-overlay" @click.self="$emit('close')">
        <section class="store-modal" role="dialog" aria-modal="true">
          <Transition name="view-swap" mode="out-in">
            <div v-if="!detailSkill" key="market" class="store-view">
              <header class="store-header">
                <div class="header-copy">
                  <span class="eyebrow">Skill Hub</span>
                  <h2>技能商店</h2>
                  <p>探索不同的技能     为AI加上专业经验和配备专业工具</p>
                </div>
                <button class="icon-btn" @click="$emit('close')" title="关闭">
                  <X size="18" />
                </button>
              </header>

              <div class="store-control-row">
                <nav class="store-tabs" aria-label="技能分类">
                  <button
                    v-for="tab in tabs"
                    :key="tab.key"
                    class="tab-btn"
                    :class="{ active: activeTab === tab.key }"
                    @click="setActiveTab(tab.key)"
                  >
                    <span>{{ tab.label }}</span>
                    <small>{{ countForTab(tab.key) }}</small>
                  </button>
                </nav>
                <button class="add-btn" @click="setActiveTab('mine')">
                  <Plus size="15" />
                  <span>最近常用</span>
                </button>
              </div>

              <div class="search-wrap">
                <Search size="16" />
                <input v-model="search" :placeholder="searchPlaceholder" />
                <span v-if="search" class="result-count">{{ filteredSkills.length }} 个结果</span>
              </div>

              <main class="store-body">
                <section v-if="activeTab === 'custom'" class="custom-panel">
                  <div class="custom-orbit">
                    <Upload size="26" />
                  </div>
                  <h3>添加自定义技能</h3>
                  <p>上传 OpenAPI Schema，或把内部 HTTP 服务包装为可被模型调用的工具。</p>
                  <div class="custom-actions">
                    <button>上传 OpenAPI</button>
                    <button>从 URL 导入</button>
                  </div>
                </section>

                <section v-else class="skill-list" aria-label="技能列表">
                  <article
                    v-for="(skill, index) in filteredSkills"
                    :key="skill.id"
                    class="skill-row"
                    :class="{ active: isEnabled(skill), mandatory: skill.mandatory }"
                    :style="{ '--row-index': index }"
                    @click="openDetail(skill)"
                  >
                    <div class="skill-icon" :style="{ '--accent': skill.accent }">
                      <span>{{ skill.icon }}</span>
                    </div>
                    <div class="skill-info">
                      <div class="skill-name-line">
                        <strong>{{ skill.name }}</strong>
                        <span class="quality-badge" :class="skill.source.toLowerCase()">{{ skill.sourceLabel }}</span>
                        <span v-if="skill.mandatory" class="quality-badge lock">必装</span>
                      </div>
                      <p>{{ skill.description }}</p>
                      <div class="skill-meta">
                        <span>{{ skill.category }}</span>
                        <span><Wrench size="12" />{{ skill.tools }} 工具</span>
                        <span v-if="skill.rating"><Star size="12" />{{ skill.rating }}</span>
                        <span v-if="skill.downloads"><Download size="12" />{{ skill.downloads }}</span>
                      </div>
                    </div>
                    <button
                      class="row-action"
                      :class="{ enabled: isEnabled(skill), locked: skill.mandatory }"
                      @click.stop="toggleSkill(skill)"
                    >
                      <Lock v-if="skill.mandatory" size="15" />
                      <Check v-else-if="isEnabled(skill)" size="16" />
                      <Plus v-else-if="skill.source !== 'MCP'" size="16" />
                      <span v-else>连接</span>
                    </button>
                  </article>

                  <div v-if="filteredSkills.length === 0" class="empty-state">
                    <Search size="22" />
                    <span>没有找到匹配的技能</span>
                  </div>
                </section>
              </main>
            </div>

            <div v-else key="detail" class="detail-view">
              <header class="detail-header">
                <button class="icon-btn back" @click="detailSkill = null" title="返回">
                  <ChevronLeft size="18" />
                </button>
                <div class="detail-title">技能详情</div>
                <button class="icon-btn" @click="$emit('close')" title="关闭">
                  <X size="18" />
                </button>
              </header>

              <section class="detail-hero">
                <div class="hero-icon" :style="{ '--accent': detailSkill.accent }">{{ detailSkill.icon }}</div>
                <div class="hero-copy">
                  <div class="hero-name-line">
                    <h2>{{ detailSkill.name }}</h2>
                    <span class="grade">优质 {{ detailSkill.grade }}</span>
                    <span class="tool-pill"><Wrench size="13" />{{ detailSkill.tools }}</span>
                  </div>
                  <p>{{ detailSkill.longDescription || detailSkill.description }}</p>
                  <div class="hero-meta">
                    <span>{{ detailSkill.version }}</span>
                    <span>{{ detailSkill.author }}</span>
                    <span>{{ detailSkill.updated }}</span>
                  </div>
                </div>
                <button class="hero-action" :class="{ enabled: isEnabled(detailSkill) }" @click="toggleSkill(detailSkill)">
                  <Lock v-if="detailSkill.mandatory" size="15" />
                  <Check v-else-if="isEnabled(detailSkill)" size="16" />
                  <Plus v-else size="16" />
                  <span>{{ detailActionText }}</span>
                </button>
              </section>

              <div class="detail-tags">
                <span>{{ detailSkill.category }}</span>
                <span>{{ detailSkill.runtime }}</span>
                <span>{{ detailSkill.license }}</span>
                <span v-if="detailSkill.downloads"><Download size="12" />{{ detailSkill.downloads }}</span>
              </div>

              <nav class="detail-tabs">
                <button
                  v-for="tab in detailTabs"
                  :key="tab.key"
                  :class="{ active: detailTab === tab.key }"
                  @click="detailTab = tab.key"
                >
                  {{ tab.label }}
                </button>
              </nav>

              <main class="detail-panel">
                <section v-if="detailTab === 'overview'" class="overview-panel">
                  <h3>你可以使用这个技能做什么？</h3>
                  <ul>
                    <li v-for="item in detailSkill.highlights" :key="item">{{ item }}</li>
                  </ul>
                  <div class="rating-card">
                    <Sparkles size="16" />
                    <span>评分 {{ detailSkill.grade }}，工具参数完整，适合在当前会话按需开启。</span>
                  </div>
                </section>

                <section v-else-if="detailTab === 'tools'" class="tools-panel">
                  <article v-for="tool in detailSkill.toolNames" :key="tool">
                    <span>{{ tool }}</span>
                    <small>{{ toolDescriptions[tool] || '已同步到模型可调用工具列表' }}</small>
                  </article>
                </section>

                <section v-else class="agents-panel">
                  <div class="agent-card">
                    <strong>当前助理</strong>
                    <span>{{ isEnabled(detailSkill) ? '本会话已启用' : '未启用，点击右上角按钮后注入' }}</span>
                  </div>
                  <div class="agent-card muted">
                    <strong>自动策略</strong>
                    <span>{{ detailSkill.mandatory ? '强制启用，不能关闭' : detailSkill.defaultEnabled ? '新会话默认开启，可关闭' : '需要手动添加' }}</span>
                  </div>
                </section>
              </main>
            </div>
          </Transition>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  Check,
  ChevronLeft,
  Download,
  Lock,
  Plus,
  Search,
  Sparkles,
  Star,
  Upload,
  Wrench,
  X
} from '@lucide/vue'

const props = defineProps({
  visible: { type: Boolean, default: false }
})
const emit = defineEmits(['close'])

// 当前商店处在哪个一级 Tab；默认展示“内置”，因为用户打开商店时最常用的是查看已内置能力。
const activeTab = ref('builtin')
// 详情页内部的二级 Tab；进入详情时默认看“概览”，再按需切到工具清单或助理使用情况。
const detailTab = ref('overview')
// 搜索框的实时输入值；列表过滤完全在前端完成，后端接口接好后也可以把它作为 q 参数传出去。
const search = ref('')
// 当前正在查看详情的技能；为 null 表示展示商店列表，不为 null 表示切换到详情页。
const detailSkill = ref(null)
// 当前会话已启用的技能集合；用 Set 是为了让“是否启用”的判断保持 O(1)，避免列表项多时反复数组扫描。
const enabledSkills = ref(new Set(JSON.parse(localStorage.getItem('enabledSkills') || '["time","math","kb","memory","cli"]')))

// 一级 Tab 配置；key 对应过滤逻辑，label 是直接展示给用户看的文本。
const tabs = [
  { key: 'builtin', label: '内置' },
  { key: 'mcp', label: 'MCP 市场' },
  { key: 'mine', label: '我的' },
  { key: 'custom', label: '自定义' }
]

// 详情页 Tab 配置；保持和 LobeHub 类似的信息层级：先看概览，再看工具能力，再看使用范围。
const detailTabs = [
  { key: 'overview', label: '概览' },
  { key: 'tools', label: '技能功能' },
  { key: 'agents', label: '使用该技能的助理' }
]

// 商店的演示数据源；后端技能市场 API 接好后，这里可以替换为接口返回的 SkillCardDto。
// 每个对象既承担列表卡片展示，也承担详情页展示，因此字段比普通列表项更完整。
const skillData = [
  {
    id: 'time',
    tab: 'builtin',
    icon: '时',
    accent: '#ffe1df',
    name: '时间日期',
    description: '查询当前时间、日期和相对日期',
    longDescription: '为模型提供稳定的当前时间、时区和相对日期解析能力。',
    source: 'BUILTIN',
    sourceLabel: '内置',
    category: '通用',
    runtime: 'Java',
    license: '内置',
    mandatory: true,
    defaultEnabled: true,
    rating: null,
    downloads: null,
    tools: 2,
    grade: 'A',
    version: 'v1.0.0',
    author: 'System',
    updated: '默认安装',
    toolNames: ['now', 'resolveRelativeDate'],
    highlights: ['回答今天、明天、上周等相对日期问题', '为需要时间上下文的工具调用提供可靠基准', '强制启用，不占用用户安装流程']
  },
  {
    id: 'math',
    tab: 'builtin',
    icon: '算',
    accent: '#fff0b8',
    name: '计算器',
    description: '执行数学计算、统计和表达式求值',
    longDescription: '处理表达式、列表统计、均值与最值，避免模型直接心算造成误差。',
    source: 'BUILTIN',
    sourceLabel: '内置',
    category: '通用',
    runtime: 'Java',
    license: '内置',
    mandatory: true,
    defaultEnabled: true,
    rating: null,
    downloads: null,
    tools: 2,
    grade: 'A',
    version: 'v1.0.0',
    author: 'System',
    updated: '默认安装',
    toolNames: ['calculate', 'statistics'],
    highlights: ['计算数学表达式', '对数字列表做统计分析', '作为默认能力保证答案可靠性']
  },
  {
    id: 'kb',
    tab: 'builtin',
    icon: '库',
    accent: '#dff9ea',
    name: '资料库',
    description: 'RAG 检索、文件查询和知识库问答',
    longDescription: '连接已上传资料、知识库片段与文件摘要，在聊天中按需检索引用。',
    source: 'BUILTIN',
    sourceLabel: '内置',
    category: '业务',
    runtime: 'Spring AI',
    license: '内置',
    mandatory: false,
    defaultEnabled: true,
    rating: null,
    downloads: null,
    tools: 3,
    grade: 'A',
    version: 'v1.0.0',
    author: 'Workspace',
    updated: '今天更新',
    toolNames: ['searchKnowledgeBase', 'listMyFiles', 'getFileSummary'],
    highlights: ['检索当前工作空间文件', '按问题召回知识库片段', '把大文档压成可引用摘要']
  },
  {
    id: 'memory',
    tab: 'builtin',
    icon: '记',
    accent: '#e4efff',
    name: '记忆',
    description: '读取用户偏好和长期记忆上下文',
    longDescription: '管理用户偏好、长期上下文与工作习惯，让助理在会话间保持一致。',
    source: 'BUILTIN',
    sourceLabel: '内置',
    category: '上下文',
    runtime: 'Java',
    license: '内置',
    mandatory: false,
    defaultEnabled: true,
    rating: null,
    downloads: null,
    tools: 2,
    grade: 'A',
    version: 'v1.0.0',
    author: 'Workspace',
    updated: '今天更新',
    toolNames: ['getUserMemory', 'savePreference'],
    highlights: ['读取长期偏好', '保存明确表达的工作习惯', '减少重复上下文输入']
  },
  {
    id: 'session',
    tab: 'builtin',
    icon: '历',
    accent: '#ffe7c7',
    name: '会话历史',
    description: '按当前会话查询上下文和最近消息',
    longDescription: '让模型在长会话中检索历史消息、总结上下文，并恢复前面做过的决策。',
    source: 'BUILTIN',
    sourceLabel: '内置',
    category: '业务',
    runtime: 'Java',
    license: '内置',
    mandatory: false,
    defaultEnabled: false,
    rating: null,
    downloads: null,
    tools: 2,
    grade: 'B',
    version: 'v1.0.0',
    author: 'Workspace',
    updated: '本周更新',
    toolNames: ['searchSession', 'summarizeSession'],
    highlights: ['检索当前会话的历史内容', '总结长对话进展', '减少上下文窗口压力']
  },
  {
    id: 'cli',
    tab: 'builtin',
    icon: '>_',
    accent: '#d7f8ef',
    name: 'CLI',
    description: '已安装命令行工具，适合本地开发和诊断任务',
    longDescription: '把受控命令行能力作为技能接入，和普通技能一样在会话级别选择。',
    source: 'BUILTIN',
    sourceLabel: 'CLI',
    category: '开发',
    runtime: 'Shell',
    license: '本地',
    mandatory: false,
    defaultEnabled: false,
    rating: null,
    downloads: null,
    tools: 3,
    grade: 'A',
    version: 'v1.0.0',
    author: 'Local',
    updated: '已安装',
    toolNames: ['runCommand', 'npmScripts', 'gitStatus'],
    highlights: ['执行受控本地命令', '运行前端脚本与构建', '读取 Git 状态辅助排查']
  },
  {
    id: 'weather',
    tab: 'builtin',
    icon: '天',
    accent: '#ffefb2',
    name: '天气',
    description: '实时天气和未来预报查询',
    longDescription: '查询城市当前天气、未来预报和基础出行建议。',
    source: 'BUILTIN',
    sourceLabel: '内置',
    category: '生活',
    runtime: 'HTTP',
    license: '内置',
    mandatory: false,
    defaultEnabled: false,
    rating: null,
    downloads: null,
    tools: 1,
    grade: 'B',
    version: 'v1.0.0',
    author: 'Workspace',
    updated: '本周更新',
    toolNames: ['getWeather'],
    highlights: ['查询实时天气', '获取短期预报', '按地点返回简洁结果']
  },
  {
    id: 'mcp:github',
    tab: 'mcp',
    icon: 'GH',
    accent: '#ffe0dc',
    name: 'GitHub',
    description: '仓库、Issue、PR 和代码搜索工具集',
    longDescription: '连接 GitHub MCP Server，处理仓库搜索、Issue 创建、PR 查询等开发协作任务。',
    source: 'MCP',
    sourceLabel: 'MCP',
    category: '开发',
    runtime: 'TypeScript',
    license: 'MIT',
    mandatory: false,
    defaultEnabled: false,
    rating: 4.9,
    downloads: '1.2M',
    tools: 32,
    grade: 'A',
    version: 'v0.8.4',
    author: 'modelcontextprotocol',
    updated: '昨天更新',
    toolNames: ['search_repos', 'create_issue', 'list_pull_requests', 'get_file_contents'],
    highlights: ['搜索公开仓库和代码', '读取 Issue 与 Pull Request', '在授权后创建协作项']
  },
  {
    id: 'mcp:tavily',
    tab: 'mcp',
    icon: '搜',
    accent: '#d8f8e6',
    name: 'Tavily 搜索',
    description: '网页搜索、内容提取、站点抓取和地图生成',
    longDescription: '面向 Agent 的搜索 MCP Server，适合实时信息检索、网页提取和小规模站点探索。',
    source: 'MCP',
    sourceLabel: 'MCP',
    category: '信息检索',
    runtime: 'Remote MCP',
    license: 'MIT',
    mandatory: false,
    defaultEnabled: false,
    rating: 4.8,
    downloads: '319K',
    tools: 4,
    grade: 'A',
    version: 'v0.2.13',
    author: 'Tavily',
    updated: '昨天更新',
    toolNames: ['tavily_search', 'tavily_extract', 'tavily_crawl', 'tavily_map'],
    highlights: ['进行实时网页搜索', '提取网页正文内容', '抓取站点结构并生成地图']
  },
  {
    id: 'mcp:notion',
    tab: 'mcp',
    icon: 'N',
    accent: '#e3edff',
    name: 'Notion',
    description: 'Notion 页面、数据库和协作内容工具',
    longDescription: '连接 Notion 工作区，查询页面、创建记录，并让模型读取协作资料。',
    source: 'MCP',
    sourceLabel: 'MCP',
    category: '协作',
    runtime: 'Remote MCP',
    license: 'MIT',
    mandatory: false,
    defaultEnabled: false,
    rating: 4.7,
    downloads: '82K',
    tools: 9,
    grade: 'B',
    version: 'v0.3.2',
    author: 'Community',
    updated: '本周更新',
    toolNames: ['search_pages', 'create_page', 'query_database'],
    highlights: ['搜索 Notion 页面', '查询数据库条目', '创建结构化协作内容']
  }
]

// 工具名到人类可读说明的映射；详情页“技能功能”Tab 用它解释每个 tool 的作用。
// 如果某个工具暂时没有单独文案，界面会回退到“已同步到模型可调用工具列表”。
const toolDescriptions = {
  now: '返回当前时间、日期与时区',
  resolveRelativeDate: '解析今天、明天、上周等相对日期',
  calculate: '计算数学表达式',
  statistics: '对数字列表做求和、均值、最值等统计',
  searchKnowledgeBase: '检索知识库与上传文件',
  listMyFiles: '列出当前用户可用文件',
  getFileSummary: '读取文件摘要',
  getUserMemory: '读取长期记忆',
  savePreference: '保存用户偏好',
  runCommand: '执行受控命令行任务',
  npmScripts: '列出并运行 npm scripts',
  gitStatus: '读取 Git 状态与差异摘要'
}

// 搜索占位符跟随当前 Tab 切换；MCP 市场用户更关心 Server 名称，内置技能用户更关心能力关键词。
const searchPlaceholder = computed(() => activeTab.value === 'mcp' ? '搜索 MCP Server 或关键词...' : '搜索技能名称、能力或关键词...')
// 详情页右上角按钮文案；统一处理“必装锁定 / 已启用 / MCP 连接 / 普通添加”四种状态。
const detailActionText = computed(() => {
  if (!detailSkill.value) return ''
  if (detailSkill.value.mandatory) return '已锁定'
  if (isEnabled(detailSkill.value)) return '已启用'
  return detailSkill.value.source === 'MCP' ? '连接' : '添加'
})

// 切换一级 Tab 时，同时退出详情页，确保用户看到的是新 Tab 对应的技能列表。
const setActiveTab = (tabKey) => {
  activeTab.value = tabKey
  detailSkill.value = null
}

// 计算每个 Tab 的数量徽标；“我的”不是固定来源，而是当前已启用技能的动态集合。
const countForTab = (tabKey) => {
  if (tabKey === 'mine') return skillData.filter(skill => isEnabled(skill)).length
  if (tabKey === 'custom') return 0
  return skillData.filter(skill => skill.tab === tabKey).length
}

// 根据当前 Tab 和搜索词得出最终展示列表。
// 这里先做 tabMatch，再做搜索匹配，是为了减少无关技能参与关键词扫描。
const filteredSkills = computed(() => {
  const q = search.value.trim().toLowerCase()
  return skillData.filter(skill => {
    const tabMatch = activeTab.value === 'mine'
      ? isEnabled(skill)
      : skill.tab === activeTab.value
    if (!tabMatch) return false
    if (!q) return true
    return [
      skill.name,
      skill.description,
      skill.category,
      skill.runtime,
      skill.id,
      ...skill.toolNames
    ].some(value => String(value).toLowerCase().includes(q))
  })
})

// 必装技能视为永远启用；非必装技能则看 localStorage 同步出来的 enabledSkills 集合。
const isEnabled = (skill) => skill.mandatory || enabledSkills.value.has(skill.id)

// 把技能启用状态写回 localStorage，并广播给 InputArea.vue 的胶囊栏和级联菜单同步刷新。
const persistSkills = () => {
  localStorage.setItem('enabledSkills', JSON.stringify(Array.from(enabledSkills.value)))
  localStorage.setItem('enabledSkillCount', String(enabledSkills.value.size))
  // CLI 同时存在于“技能”和“已安装 CLI”两个入口；这里保持两个 localStorage key 的状态一致。
  const enabledCli = JSON.parse(localStorage.getItem('enabledCliTools') || '["cli"]')
  if (enabledSkills.value.has('cli') && !enabledCli.includes('cli')) {
    enabledCli.push('cli')
    localStorage.setItem('enabledCliTools', JSON.stringify(enabledCli))
  }
  if (!enabledSkills.value.has('cli')) {
    localStorage.setItem('enabledCliTools', JSON.stringify(enabledCli.filter(id => id !== 'cli')))
  }
  window.dispatchEvent(new Event('skills-updated'))
}

// 点击列表右侧按钮时切换技能启用状态；mandatory 技能不能关闭，所以直接返回。
const toggleSkill = (skill) => {
  if (skill.mandatory) return
  const next = new Set(enabledSkills.value)
  if (next.has(skill.id)) next.delete(skill.id)
  else next.add(skill.id)
  enabledSkills.value = next
  persistSkills()
}

// 点击整行打开详情页；同时把详情 Tab 重置为概览，避免从上一个技能残留在“技能功能”页。
const openDetail = (skill) => {
  detailSkill.value = skill
  detailTab.value = 'overview'
}

// 每次弹窗重新打开，都从 localStorage 读取最新状态，确保输入区菜单和商店状态不会互相滞后。
watch(() => props.visible, (visible) => {
  if (visible) {
    activeTab.value = 'builtin'
    detailTab.value = 'overview'
    detailSkill.value = null
    search.value = ''
    enabledSkills.value = new Set(JSON.parse(localStorage.getItem('enabledSkills') || '["time","math","kb","memory","cli"]'))
  }
})
</script>

<style scoped>
.store-overlay {
  /* 中性半透明遮罩，跟随主界面冷灰色系，不再用暖红压抑色。 */
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.30);
  backdrop-filter: blur(10px);
}

.store-modal {
  /* 主体跟随应用主题：以 --bg-primary 为底，叠加极淡主色光晕，和主界面同色系。 */
  width: min(1060px, calc(100vw - 48px));
  height: min(760px, calc(100vh - 48px));
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  background:
    radial-gradient(circle at 12% -4%, color-mix(in srgb, var(--primary-color) 9%, transparent), transparent 32%),
    radial-gradient(circle at 104% 0%, color-mix(in srgb, var(--primary-light) 7%, transparent), transparent 30%),
    var(--bg-primary);
  color: var(--text-primary);
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.20), 0 0 0 1px color-mix(in srgb, var(--primary-color) 8%, transparent) inset;
}

.store-view,
.detail-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: transparent;
}

.store-header,
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
}

.store-header::before {
  /* 标题分隔线改为静态主色渐变，去掉持续扫光动画，避免画面发"呆"。 */
  content: '';
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary-color) 55%, transparent), transparent);
}

.header-copy {
  min-width: 0;
}

.eyebrow {
  color: var(--primary-color);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.store-header h2 {
  margin: 3px 0 4px;
  color: var(--text-title);
  font-size: 23px;
  font-weight: 820;
}

.store-header p {
  margin: 0;
  color: var(--text-sub);
  font-size: 13px;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 8px;
  background: var(--hover-bg);
  color: var(--text-sub);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.18s ease, color 0.18s ease;
}

.icon-btn:hover {
  background: var(--hover-bg-medium);
  color: var(--primary-color);
}

.store-control-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
}

.store-tabs {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  padding: 4px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-secondary);
  overflow-x: auto;
}

.tab-btn {
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-sub);
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.tab-btn:hover:not(.active) {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.tab-btn small {
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--hover-bg-medium);
  color: var(--text-sub);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  font-size: 11px;
  transition: background 0.18s ease, color 0.18s ease;
}

.tab-btn.active {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: #fff;
  box-shadow: 0 8px 20px color-mix(in srgb, var(--primary-color) 28%, transparent);
}

.tab-btn.active small {
  background: rgba(255, 255, 255, 0.28);
  color: #fff;
}

.add-btn {
  height: 36px;
  margin-left: auto;
  border: 1px solid var(--border-color);
  border-radius: 9px;
  background: var(--bg-secondary);
  color: var(--primary-color);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.add-btn:hover {
  border-color: color-mix(in srgb, var(--primary-color) 45%, transparent);
  background: var(--hover-bg);
}

.search-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 24px 14px;
  height: 42px;
  padding: 0 13px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-secondary);
  color: var(--text-sub);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.search-wrap:focus-within {
  border-color: var(--primary-color);
  background: var(--bg-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 12%, transparent);
}

.search-wrap input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
}

.search-wrap input::placeholder {
  color: var(--text-sub);
}

.result-count {
  color: var(--text-sub);
  font-size: 12px;
}

.store-body {
  flex: 1;
  min-height: 0;
  padding: 0 24px 22px;
  overflow: hidden;
}

.skill-list {
  height: 100%;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: start;
  gap: 10px;
  padding: 2px 4px 4px 0;
}

.skill-row {
  /* 技能行做成扁平条目，不再使用厚重卡片，方便快速扫描和点击进入详情。 */
  min-height: 86px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  animation: rowEnter 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(min(var(--row-index), 10) * 0.04s);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease, background 0.18s ease;
}

.skill-row:hover {
  border-color: color-mix(in srgb, var(--primary-color) 42%, transparent);
  box-shadow: 0 12px 30px color-mix(in srgb, var(--primary-color) 14%, transparent);
  transform: translateY(-2px);
}

.skill-row.active {
  /* 已启用状态用主色高亮，与未启用条目区分，同时跟随主题色变化。 */
  border-color: color-mix(in srgb, var(--primary-color) 50%, transparent);
  background: linear-gradient(90deg, color-mix(in srgb, var(--primary-color) 12%, var(--bg-primary)), var(--bg-primary) 56%);
}

.skill-row.mandatory {
  background: linear-gradient(90deg, var(--hover-bg-medium), var(--bg-primary) 60%);
}

.skill-icon,
.hero-icon,
.custom-orbit {
  background: var(--accent);
  color: #2d2a26;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 850;
}

.skill-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  font-size: 17px;
}

.skill-info {
  min-width: 0;
  flex: 1;
}

.skill-name-line {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.skill-name-line strong {
  min-width: 0;
  color: var(--text-primary);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-info p {
  margin: 4px 0 7px;
  color: var(--text-sub);
  font-size: 12px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.quality-badge {
  height: 19px;
  border-radius: 999px;
  background: var(--hover-bg-medium);
  color: var(--text-sub);
  padding: 0 7px;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
}

.quality-badge.mcp {
  background: color-mix(in srgb, var(--primary-color) 16%, transparent);
  color: var(--primary-color);
}

.quality-badge.lock {
  background: color-mix(in srgb, var(--primary-color) 14%, transparent);
  color: var(--primary-color);
}

.skill-meta {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  color: var(--text-sub);
  font-size: 11px;
}

.skill-meta span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
}

.row-action {
  width: 36px;
  height: 32px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-sub);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.row-action:hover {
  border-color: color-mix(in srgb, var(--primary-color) 45%, transparent);
  color: var(--primary-color);
  background: var(--hover-bg);
}

.row-action.enabled {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  border-color: var(--primary-color);
  color: #fff;
}

.row-action.locked {
  background: var(--hover-bg-medium);
  border-color: var(--border-color);
  color: var(--text-sub);
  cursor: not-allowed;
}

.empty-state,
.custom-panel {
  border: 1px dashed color-mix(in srgb, var(--primary-color) 30%, transparent);
  border-radius: 12px;
  background: var(--bg-secondary);
  color: var(--text-sub);
}

.empty-state {
  grid-column: 1 / -1;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.custom-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 28px;
}

.custom-orbit {
  /* 自定义技能入口保留脉冲动画，提示这里是可扩展入口，但动画幅度保持克制。 */
  --accent: var(--hover-bg-medium);
  width: 58px;
  height: 58px;
  border-radius: 16px;
  color: var(--primary-color);
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--primary-color) 22%, transparent);
  animation: pulseRing 3s ease-in-out infinite;
}

.custom-panel h3 {
  margin: 16px 0 6px;
  color: var(--text-title);
  font-size: 18px;
}

.custom-panel p {
  max-width: 460px;
  margin: 0 0 16px;
  line-height: 1.7;
}

.custom-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.custom-actions button {
  height: 36px;
  border: 1px solid var(--border-color);
  border-radius: 9px;
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: 0 14px;
  cursor: pointer;
  font-weight: 700;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.custom-actions button:hover {
  border-color: color-mix(in srgb, var(--primary-color) 40%, transparent);
  background: var(--hover-bg);
}

.custom-actions button:first-child {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  border-color: transparent;
  color: #fff;
}

.custom-actions button:first-child:hover {
  filter: brightness(1.05);
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
}

.detail-header {
  padding: 16px 20px;
}

.detail-title {
  color: var(--text-title);
  font-size: 15px;
  font-weight: 800;
}

.detail-hero {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 22px 24px 18px;
}

.hero-icon {
  width: 66px;
  height: 66px;
  border-radius: 16px;
  font-size: 24px;
}

.hero-copy {
  min-width: 0;
}

.hero-name-line {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.hero-name-line h2 {
  margin: 0;
  color: var(--text-title);
  font-size: 23px;
  font-weight: 850;
}

.grade,
.tool-pill {
  height: 24px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 9px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.grade {
  background: color-mix(in srgb, var(--primary-color) 14%, transparent);
  color: var(--primary-color);
}

.tool-pill {
  background: var(--hover-bg-medium);
  color: var(--text-sub);
}

.hero-copy p {
  margin: 8px 0 9px;
  color: var(--text-sub);
  line-height: 1.6;
}

.hero-meta,
.detail-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.hero-meta span,
.detail-tags span {
  height: 24px;
  border-radius: 999px;
  background: var(--bg-secondary);
  color: var(--text-sub);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 9px;
  font-size: 12px;
  border: 1px solid var(--border-color);
}

.hero-action {
  height: 38px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 14px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  transition: filter 0.18s ease, background 0.18s ease, color 0.18s ease;
}

.hero-action:hover {
  filter: brightness(1.05);
}

.hero-action.enabled {
  background: color-mix(in srgb, var(--primary-color) 14%, transparent);
  border-color: color-mix(in srgb, var(--primary-color) 38%, transparent);
  color: var(--primary-color);
}

.detail-tags {
  padding: 0 24px 16px;
}

.detail-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 24px;
  border-bottom: 1px solid var(--border-color);
}

.detail-tabs button {
  height: 40px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-sub);
  padding: 0 10px;
  cursor: pointer;
  font-weight: 750;
  transition: color 0.18s ease, border-color 0.18s ease;
}

.detail-tabs button:hover {
  color: var(--text-primary);
}

.detail-tabs button.active {
  border-bottom-color: var(--primary-color);
  color: var(--primary-color);
}

.detail-panel {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 22px 24px 26px;
}

.overview-panel h3 {
  margin: 0 0 12px;
  color: var(--text-title);
  font-size: 16px;
}

.overview-panel ul {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.overview-panel li {
  padding: 11px 12px;
  border: 1px solid var(--border-color);
  border-radius: 9px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.rating-card {
  margin-top: 16px;
  padding: 12px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--primary-color) 10%, var(--bg-secondary));
  color: var(--primary-color);
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid color-mix(in srgb, var(--primary-color) 18%, transparent);
}

.tools-panel {
  display: grid;
  gap: 10px;
}

.tools-panel article,
.agent-card {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-primary);
  padding: 12px;
}

.tools-panel article {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.tools-panel span,
.agent-card strong {
  color: var(--text-title);
  font-weight: 800;
}

.tools-panel small,
.agent-card span {
  color: var(--text-sub);
  line-height: 1.5;
}

.agents-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.agent-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.agent-card.muted {
  background: var(--bg-secondary);
}

.store-shell-enter-active {
  transition: opacity 0.28s ease;
}

.store-shell-leave-active {
  transition: opacity 0.2s ease;
}

.store-shell-enter-active .store-modal {
  animation: modalIn 0.36s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.store-shell-leave-active .store-modal {
  animation: modalOut 0.2s cubic-bezier(0.4, 0, 1, 1) both;
}

.store-shell-enter-from,
.store-shell-leave-to {
  opacity: 0;
}

.view-swap-enter-active {
  transition: opacity 0.24s ease, transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.view-swap-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.view-swap-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.view-swap-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

@keyframes modalIn {
  from { transform: translateY(12px) scale(0.97); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes modalOut {
  from { transform: translateY(0) scale(1); opacity: 1; }
  to { transform: translateY(6px) scale(0.985); opacity: 0; }
}

@keyframes rowEnter {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes pulseRing {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--primary-color) 22%, transparent); transform: translateY(0); }
  50% { box-shadow: 0 0 0 12px transparent; transform: translateY(-2px); }
}

@media (max-width: 860px) {
  .store-overlay {
    padding: 0;
  }

  .store-modal {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }

  .skill-list {
    grid-template-columns: 1fr;
  }

  .store-control-row {
    align-items: stretch;
    flex-direction: column;
  }

  .add-btn {
    margin-left: 0;
    justify-content: center;
  }

  .detail-hero {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .hero-action {
    grid-column: 1 / -1;
    justify-content: center;
  }

  .agents-panel {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
</style>
