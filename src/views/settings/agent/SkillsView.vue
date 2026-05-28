<template>
  <section class="settings-view skills-settings-view">
    <div class="settings-card skills-hub-card">
      <div class="card-head compact-head">
        <div>
          <h2>技能管理</h2>
          <p>查看已安装技能、MCP 和 CLI，并从全网商店继续添加能力。</p>
        </div>
        <button class="sync-btn" type="button" @click="refreshLocalState">
          <RefreshCw :size="15" />
          刷新
        </button>
      </div>

      <div class="skill-management">
        <div class="metric-strip" aria-label="技能统计">
          <div class="metric-tile">
            <strong>{{ enabledCount }}</strong>
            <span>当前会话已启用技能</span>
          </div>
          <div class="metric-tile">
            <strong>{{ installedMcpCount }}</strong>
            <span>已安装 MCP</span>
          </div>
          <div class="metric-tile">
            <strong>{{ enabledCliCount }}</strong>
            <span>已启用 CLI</span>
          </div>
          <div class="metric-tile">
            <strong>1000+</strong>
            <span>全网 MCP 可安装</span>
          </div>
        </div>

        <section class="installed-section" aria-label="已安装能力分析">
          <div class="section-headline">
            <div>
              <strong>已安装能力</strong>
              <span>按 Skills / MCP / CLI 分组查看，横向滑动列表使用懒加载，避免大量能力一次性渲染。</span>
            </div>
            <nav class="installed-tabs" aria-label="已安装能力分类">
              <button
                v-for="tab in installedTabs"
                :key="tab.key"
                :class="{ active: activeInstalledTab === tab.key }"
                type="button"
                @click="selectInstalledTab(tab.key)"
              >
                {{ tab.label }}
                <small>{{ tab.count }}</small>
              </button>
            </nav>
          </div>

          <div ref="installedScrollerRef" class="installed-scroller" @scroll.passive="handleInstalledScroll">
            <article
              v-for="item in visibleInstalledItems"
              :key="item.id"
              class="ability-card"
              :class="item.kind"
            >
              <span class="ability-icon">{{ item.icon }}</span>
              <div class="ability-copy">
                <strong>{{ item.name }}</strong>
                <span>{{ item.desc }}</span>
              </div>
              <span class="ability-kind">{{ item.kindLabel }}</span>
            </article>

            <div v-if="visibleInstalledItems.length === 0" class="empty-installed">
              当前分类还没有启用项
            </div>
          </div>
        </section>

        <button class="market-entry primary-entry" type="button" @click="openMarketplace('mcp')">
          <span class="market-icon">MCP</span>
          <span>
            <strong>打开全网 MCP 技能商店</strong>
            <small>按安全、提示词、资源、搜索、开发工具等分类浏览和添加</small>
          </span>
          <ChevronRight :size="18" />
        </button>

        <div class="market-grid">
          <button class="market-entry" type="button" @click="openMarketplace('skills')">
            <span class="market-icon soft">SK</span>
            <span>
              <strong>打开全网 Skills 商店</strong>
              <small>浏览通用技能包、业务技能和团队内置能力</small>
            </span>
            <ChevronRight :size="18" />
          </button>

          <button class="market-entry" type="button" @click="openMarketplace('cli')">
            <span class="market-icon dark">CLI</span>
            <span>
              <strong>打开全网 CLI 商店</strong>
              <small>挑选 Git、npm、诊断、部署等本地受控命令能力</small>
            </span>
            <ChevronRight :size="18" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight, RefreshCw } from '@lucide/vue'

const router = useRouter()

// 每次只渲染一小段已安装能力卡片。用户横向滚动到底部时再追加，避免列表变长后影响设置页首屏性能。
const INSTALLED_PAGE_SIZE = 8
const activeInstalledTab = ref('all')
const visibleInstalledCount = ref(INSTALLED_PAGE_SIZE)
const installedScrollerRef = ref(null)
const enabledSkills = ref([])
const enabledCliTools = ref([])
const enabledSkillMeta = ref({})

/**
 * 安全读取 localStorage JSON。
 *
 * 前端技能状态存在多个 localStorage key 中；浏览器插件、旧版本代码或手动调试都可能写入坏 JSON。
 * 这里集中做 try/catch，保证技能管理页不会因为一个损坏字段直接白屏。
 *
 * @param {string} key localStorage key
 * @param {Array|Object} fallback 解析失败或类型不匹配时使用的兜底值
 * @returns {Array|Object} 已解析且符合预期类型的值
 */
const readJsonStorage = (key, fallback) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
    if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

/**
 * 从本地状态刷新当前页数据。
 *
 * 技能商店、输入框胶囊栏、CLI 级联菜单都会广播 skills-updated；
 * 当前页也允许用户手动刷新一次，便于验证刚添加的 MCP / Skills / CLI 是否已进入“已安装能力”区域。
 *
 * 这个函数只读取 localStorage，不做远程请求，因此它可以安全地被 storage 事件、
 * skills-updated 事件和刷新按钮共用，不会因为用户频繁切换设置页造成接口压力。
 */
const refreshLocalState = async () => {
  enabledSkills.value = readJsonStorage('enabledSkills', ['time', 'math', 'memory'])
  enabledCliTools.value = readJsonStorage('enabledCliTools', ['cli'])
  enabledSkillMeta.value = readJsonStorage('enabledSkillMeta', {})
  visibleInstalledCount.value = INSTALLED_PAGE_SIZE
  await nextTick()
  if (installedScrollerRef.value) installedScrollerRef.value.scrollLeft = 0
}

const baseSkillMeta = {
  time: { name: '时间日期', icon: '时', desc: '当前时间、日期、时区和相对日期', kind: 'skill' },
  math: { name: '计算器', icon: '算', desc: '数学表达式和统计计算', kind: 'skill' },
  kb: { name: '资料库', icon: '库', desc: 'RAG 检索和文件知识库', kind: 'skill' },
  memory: { name: '记忆', icon: '记', desc: '长期偏好和上下文', kind: 'skill' },
  session: { name: '会话历史', icon: '历', desc: '当前会话检索与摘要', kind: 'skill' },
  artifacts: { name: 'Artifacts', icon: 'A', desc: '生成代码块与交互产物', kind: 'skill' },
  tasks: { name: '任务工具', icon: 'T', desc: '拆解待办与执行计划', kind: 'skill' },
  cli: { name: 'CLI', icon: 'CLI', desc: '受控命令行执行入口', kind: 'cli' },
  'mcp:github': { name: 'GitHub MCP', icon: 'GH', desc: '仓库、Issue、PR 和代码搜索', kind: 'mcp' },
  'mcp:tavily': { name: 'Tavily 搜索', icon: '搜', desc: '网页搜索、提取和站点抓取', kind: 'mcp' }
}

const cliMeta = {
  cli: { name: 'CLI', icon: '>_', desc: '受控命令执行' },
  'cli:npm': { name: 'npm scripts', icon: 'npm', desc: '运行前端脚本' },
  'cli:git': { name: 'Git CLI', icon: 'git', desc: '状态、差异与提交辅助' }
}

// 把 enabledSkills 和 enabledCliTools 两套状态合并成“已安装能力”视图模型。
// 这里不直接暴露 localStorage 原始 id，是为了让页面始终能拿到稳定的名称、图标、类型和说明文案。
const installedItems = computed(() => {
  const skillItems = enabledSkills.value.map(id => {
    const dynamic = enabledSkillMeta.value[id] || {}
    const base = baseSkillMeta[id] || {}
    const kind = id.startsWith('mcp:')
      ? 'mcp'
      : id.startsWith('cli:')
        ? 'cli'
        : dynamic.group === 'cli'
          ? 'cli'
          : base.kind || 'skill'
    return {
      id,
      kind,
      kindLabel: kind === 'mcp' ? 'MCP' : kind === 'cli' ? 'CLI' : 'Skill',
      name: dynamic.name || base.name || id,
      icon: dynamic.icon || base.icon || (kind === 'mcp' ? 'MCP' : '技'),
      desc: dynamic.menuDesc || base.desc || '已加入当前会话能力'
    }
  })

  const cliItems = enabledCliTools.value
    .filter(id => !enabledSkills.value.includes(id))
    .map(id => {
      const dynamic = enabledSkillMeta.value[id] || {}
      const meta = cliMeta[id] || {}
      return {
        id,
        kind: 'cli',
        kindLabel: 'CLI',
        name: dynamic.name || meta.name || id,
        icon: dynamic.icon || meta.icon || 'CLI',
        desc: dynamic.menuDesc || meta.desc || '本地受控命令能力'
      }
    })

  return [...skillItems, ...cliItems]
})

// 顶部标签只改变展示分组，不改变真实启用状态；因此这里做纯前端过滤即可。
const filteredInstalledItems = computed(() => {
  if (activeInstalledTab.value === 'all') return installedItems.value
  return installedItems.value.filter(item => item.kind === activeInstalledTab.value)
})

const visibleInstalledItems = computed(() => filteredInstalledItems.value.slice(0, visibleInstalledCount.value))

const enabledCount = computed(() => enabledSkills.value.length)
const installedMcpCount = computed(() => installedItems.value.filter(item => item.kind === 'mcp').length)
const enabledCliCount = computed(() => installedItems.value.filter(item => item.kind === 'cli').length)

const installedTabs = computed(() => [
  { key: 'all', label: '全部', count: installedItems.value.length },
  { key: 'skill', label: 'Skills', count: installedItems.value.filter(item => item.kind === 'skill').length },
  { key: 'mcp', label: 'MCP', count: installedMcpCount.value },
  { key: 'cli', label: 'CLI', count: enabledCliCount.value }
])

/**
 * 切换已安装能力分组。
 *
 * @param {string} tabKey 分组 key：all / skill / mcp / cli
 */
const selectInstalledTab = async (tabKey) => {
  activeInstalledTab.value = tabKey
  visibleInstalledCount.value = INSTALLED_PAGE_SIZE
  await nextTick()
  if (installedScrollerRef.value) installedScrollerRef.value.scrollLeft = 0
}

/**
 * 横向滚动懒加载。
 *
 * 已安装能力未来可能来自数据库、MCP 安装记录和 CLI 插件目录，一次性渲染过多卡片会让设置页首屏变慢。
 * 这里在滚动接近右侧边界时追加一页，既保持交互顺滑，也避免图三那类密集列表一次性挤满页面。
 */
const handleInstalledScroll = () => {
  const el = installedScrollerRef.value
  if (!el || visibleInstalledCount.value >= filteredInstalledItems.value.length) return
  if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 180) {
    visibleInstalledCount.value = Math.min(
      visibleInstalledCount.value + INSTALLED_PAGE_SIZE,
      filteredInstalledItems.value.length
    )
  }
}

/**
 * 从设置页进入详细全网商店。
 *
 * @param {'mcp'|'skills'|'cli'} type 要打开的商店类型
 */
const openMarketplace = (type) => {
  router.push({ path: '/skills/marketplace', query: { type } })
}

onMounted(() => {
  refreshLocalState()
  window.addEventListener('skills-updated', refreshLocalState)
  window.addEventListener('storage', refreshLocalState)
})

onBeforeUnmount(() => {
  window.removeEventListener('skills-updated', refreshLocalState)
  window.removeEventListener('storage', refreshLocalState)
})
</script>

<style scoped>
.skills-settings-view {
  width: min(1064px, 100%);
}

.skills-hub-card {
  min-height: 640px;
}

.compact-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.sync-btn {
  height: 34px;
  border: 1px solid var(--border-color);
  border-radius: 9px;
  background: var(--bg-primary);
  color: var(--primary-color);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 12px;
  cursor: pointer;
  font-weight: 750;
}

.skill-management {
  padding: 18px 20px 22px;
  display: grid;
  gap: 16px;
}

.metric-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.metric-tile {
  min-height: 92px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: color-mix(in srgb, var(--bg-primary) 86%, var(--primary-color) 5%);
  padding: 16px;
}

.metric-tile strong {
  display: block;
  color: var(--primary-color);
  font-size: 30px;
  line-height: 1;
}

.metric-tile span {
  display: block;
  margin-top: 9px;
  color: var(--text-sub);
  font-size: 13px;
}

.installed-section {
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 7%, var(--bg-primary)), var(--bg-primary));
  padding: 14px;
}

.section-headline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}

.section-headline strong,
.section-headline span {
  display: block;
}

.section-headline strong {
  color: var(--text-title);
  font-size: 15px;
}

.section-headline span {
  margin-top: 4px;
  color: var(--text-sub);
  font-size: 12px;
  line-height: 1.5;
}

.installed-tabs {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  padding: 4px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-secondary);
}

.installed-tabs button {
  height: 30px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-sub);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 9px;
  cursor: pointer;
  font-weight: 750;
}

.installed-tabs button.active {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: #fff;
}

.installed-tabs small {
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,.22);
  font-size: 11px;
}

.installed-scroller {
  min-height: 134px;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 2px 2px 10px;
  scroll-snap-type: x proximity;
}

.ability-card {
  width: 232px;
  min-width: 232px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-primary);
  padding: 12px;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  scroll-snap-align: start;
}

.ability-card.mcp {
  border-color: color-mix(in srgb, var(--primary-color) 32%, var(--border-color));
}

.ability-card.cli {
  border-color: color-mix(in srgb, #111827 18%, var(--border-color));
}

.ability-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--hover-bg-medium);
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 900;
}

.ability-copy {
  min-width: 0;
}

.ability-copy strong,
.ability-copy span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ability-copy strong {
  color: var(--text-title);
  font-size: 13px;
  white-space: nowrap;
}

.ability-copy span {
  margin-top: 4px;
  color: var(--text-sub);
  font-size: 12px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.ability-kind {
  grid-column: 1 / -1;
  justify-self: start;
  height: 22px;
  border-radius: 999px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  background: var(--hover-bg);
  color: var(--primary-color);
  font-size: 11px;
  font-weight: 800;
}

.empty-installed {
  min-width: 100%;
  min-height: 112px;
  border: 1px dashed var(--border-color);
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: var(--text-sub);
  font-size: 13px;
}

.market-entry {
  width: 100%;
  min-height: 84px;
  border: 1px solid color-mix(in srgb, var(--primary-color) 25%, transparent);
  border-radius: 13px;
  background: var(--bg-primary);
  color: var(--text-primary);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 14px;
  cursor: pointer;
  text-align: left;
}

.market-entry:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--primary-color) 46%, transparent);
  box-shadow: 0 16px 42px color-mix(in srgb, var(--primary-color) 12%, transparent);
}

.primary-entry {
  min-height: 74px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 11%, var(--bg-primary)), var(--bg-primary));
}

.market-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.market-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: #fff;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 900;
}

.market-icon.soft {
  background: linear-gradient(135deg, #06b6d4, var(--primary-color));
}

.market-icon.dark {
  background: linear-gradient(135deg, #111827, #4b5563);
}

.market-entry strong,
.market-entry small {
  display: block;
}

.market-entry strong {
  color: var(--text-title);
  font-size: 15px;
}

.market-entry small {
  margin-top: 4px;
  color: var(--text-sub);
  line-height: 1.5;
}

@media (max-width: 840px) {
  .metric-strip,
  .market-grid {
    grid-template-columns: 1fr;
  }

  .section-headline {
    flex-direction: column;
  }

  .installed-tabs {
    width: 100%;
    overflow-x: auto;
  }
}
</style>
