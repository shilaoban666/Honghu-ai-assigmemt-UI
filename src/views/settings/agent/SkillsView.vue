<template>
  <section class="settings-view skills-settings-view">
    <div class="settings-card skills-hub-card">
      <div class="card-head compact-head">
        <div>
          <h2>{{ st('skHubTitle') }}</h2>
          <p>{{ st('skHubDesc') }}</p>
        </div>
        <button class="sync-btn" type="button" @click="refreshLocalState">
          <RefreshCw :size="15" />
          {{ st('refresh') }}
        </button>
      </div>

      <div class="skill-management">
        <div class="metric-strip" aria-label="技能统计">
          <div class="metric-tile pop" style="--pop-delay: 0s">
            <strong>{{ animated.enabled }}</strong>
            <span>{{ st('skMetricEnabled') }}</span>
          </div>
          <div class="metric-tile pop" style="--pop-delay: .05s">
            <strong>{{ animated.mcp }}</strong>
            <span>{{ st('skMetricMcp') }}</span>
          </div>
          <div class="metric-tile pop" style="--pop-delay: .1s">
            <strong>{{ animated.cli }}</strong>
            <span>{{ st('skMetricCli') }}</span>
          </div>
          <div class="metric-tile pop" style="--pop-delay: .15s">
            <strong>{{ animated.total }}</strong>
            <span>{{ st('skMetricTotal') }}</span>
          </div>
        </div>

        <section class="analytics-section" aria-label="能力分析图表">
          <div class="analytics-head">
            <div>
              <strong>{{ st('skAnalytics') }}</strong>
              <span>{{ st('skAnalyticsDesc') }}</span>
            </div>
            <span class="source-pill" :class="{ fallback: capabilityStore.usingFallback }">
              {{ capabilityStore.usingFallback ? st('srcLocal') : st('srcDb') }}
            </span>
          </div>
          <div class="analytics-grid">
            <div class="chart-card reveal" style="--reveal-delay: 0s">
              <header>
                <strong>{{ st('chartComposition') }}</strong>
                <small>{{ st('chartCompositionDesc') }}</small>
              </header>
              <EChart :build="buildKindDonut" :deps="kindDistribution" height="232px" />
            </div>
            <div class="chart-card reveal" style="--reveal-delay: .08s">
              <header>
                <strong>{{ st('chartMcpCat') }}</strong>
                <small>{{ st('chartMcpCatDesc') }}</small>
              </header>
              <EChart :build="buildCategoryBar" :deps="mcpCategoryData" height="232px" />
            </div>
            <div class="chart-card reveal" style="--reveal-delay: .16s">
              <header>
                <strong>{{ st('chartEnableRate') }}</strong>
                <small>{{ st('chartEnableRateDesc') }}</small>
              </header>
              <EChart :build="buildEnableGauge" :deps="enableRate" height="232px" />
            </div>
          </div>
        </section>

        <section class="installed-section" aria-label="已安装能力分析">
          <div class="section-headline">
            <div>
              <strong>{{ st('skInstalled') }}</strong>
              <span>{{ st('skInstalledDesc') }}</span>
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
              {{ st('emptyInstalled') }}
            </div>
          </div>
        </section>

        <button class="market-entry primary-entry" type="button" @click="openMarketplace('mcp')">
          <span class="market-icon">MCP</span>
          <span>
            <strong>{{ st('openMcpStore') }}</strong>
            <small>{{ st('openMcpStoreDesc') }}</small>
          </span>
          <ChevronRight :size="18" />
        </button>

        <div class="market-grid">
          <button class="market-entry" type="button" @click="openMarketplace('skills')">
            <span class="market-icon soft">SK</span>
            <span>
              <strong>{{ st('openSkillsStore') }}</strong>
              <small>{{ st('openSkillsStoreDesc') }}</small>
            </span>
            <ChevronRight :size="18" />
          </button>

          <button class="market-entry" type="button" @click="openMarketplace('cli')">
            <span class="market-icon dark">CLI</span>
            <span>
              <strong>{{ st('openCliStore') }}</strong>
              <small>{{ st('openCliStoreDesc') }}</small>
            </span>
            <ChevronRight :size="18" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight, RefreshCw } from '@lucide/vue'
import { useChat } from '@/stores/chatStore'
import { useCapabilityStore } from '@/stores/capabilityStore'
import EChart from '@/components/charts/EChart.vue'
import { st } from '@/components/settings/settingsLocale'

const router = useRouter()
const chatStore = useChat()
const capabilityStore = useCapabilityStore()

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
  const sessionId = typeof chatStore.currentChatId === 'string' ? chatStore.currentChatId : String(chatStore.currentChatId || '')
  try {
    await capabilityStore.fetchInstalled({ sessionId })
    if (sessionId) await capabilityStore.fetchSession(sessionId)
  } catch (error) {
    console.warn('已安装能力接口不可用，使用本地缓存兜底:', error)
  }
  const sourceItems = capabilityStore.sessionCapabilities.length
    ? capabilityStore.sessionCapabilities
    : capabilityStore.installed
  if (sourceItems.length > 0 && !capabilityStore.usingFallback) {
    enabledSkills.value = sourceItems.filter(item => item.enabled || item.mandatory).map(item => item.skillKey)
    enabledCliTools.value = sourceItems.filter(item => (item.enabled || item.mandatory) && item.kind === 'cli').map(item => item.skillKey)
  } else {
    enabledSkills.value = readJsonStorage('enabledSkills', ['time', 'math', 'memory'])
    enabledCliTools.value = readJsonStorage('enabledCliTools', ['cli'])
  }
  enabledSkillMeta.value = readJsonStorage('enabledSkillMeta', {})
  visibleInstalledCount.value = INSTALLED_PAGE_SIZE
  await nextTick()
  if (installedScrollerRef.value) installedScrollerRef.value.scrollTop = 0
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

// 统一的能力分组：内置工具 + MCP 归到“工具”，CLI 归到“命令行”，Claude 技能归到“技能”。
const groupOf = (kind) => (kind === 'cli' ? 'cli' : kind === 'skill' ? 'skill' : 'tool')
// 卡片右下角的来源徽标文案。
const kindLabelOf = (kind) => {
  if (kind === 'mcp') return 'MCP'
  if (kind === 'cli') return 'CLI'
  if (kind === 'builtin') return '内置'
  return '技能'
}

// 把后端 CapabilityDto 或本地缓存合并成“已安装能力”视图模型。
// 主路径使用数据库返回的 installed/sessionCapabilities；只有 capabilityStore.usingFallback=true
// 时才读取 enabledSkills 和 enabledCliTools。这样设置页展示的是真实安装态，而不是浏览器缓存幻觉。
const installedItems = computed(() => {
  const sourceItems = capabilityStore.sessionCapabilities.length
    ? capabilityStore.sessionCapabilities
    : capabilityStore.installed
  if (sourceItems.length > 0 && !capabilityStore.usingFallback) {
    return sourceItems
      .filter(item => item.installed || item.enabled || item.mandatory || item.kind === 'builtin')
      .map(item => ({
        id: item.skillKey,
        kind: item.kind,
        // 分组：内置工具 + MCP → 工具；CLI → 命令行；Claude 技能 → 技能。
        group: groupOf(item.kind),
        kindLabel: kindLabelOf(item.kind),
        name: item.name || item.skillKey,
        icon: item.icon || (item.kind === 'mcp' ? 'MCP' : item.kind === 'cli' ? 'CLI' : '技'),
        desc: item.description || item.category || st('abilitySynced')
      }))
  }

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
      group: groupOf(kind),
      kindLabel: kindLabelOf(kind),
      name: dynamic.name || base.name || id,
      icon: dynamic.icon || base.icon || (kind === 'mcp' ? 'MCP' : '技'),
      desc: dynamic.menuDesc || base.desc || st('abilityInSession')
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
        group: 'cli',
        kindLabel: kindLabelOf('cli'),
        name: dynamic.name || meta.name || id,
        icon: dynamic.icon || meta.icon || 'CLI',
        desc: dynamic.menuDesc || meta.desc || st('abilityCli')
      }
    })

  return [...skillItems, ...cliItems]
})

// 顶部标签按分组（工具 / 命令行 / 技能）过滤，不改变真实启用状态。
const filteredInstalledItems = computed(() => {
  if (activeInstalledTab.value === 'all') return installedItems.value
  return installedItems.value.filter(item => item.group === activeInstalledTab.value)
})

const visibleInstalledItems = computed(() => filteredInstalledItems.value.slice(0, visibleInstalledCount.value))

const enabledCount = computed(() => enabledSkills.value.length)
const installedMcpCount = computed(() => installedItems.value.filter(item => item.kind === 'mcp').length)
const enabledCliCount = computed(() => installedItems.value.filter(item => item.kind === 'cli').length)

// 工具 = 内置工具 + MCP；命令行 = CLI；技能 = Claude 技能。
const installedTabs = computed(() => [
  { key: 'all', label: st('tabAll'), count: installedItems.value.length },
  { key: 'tool', label: st('groupTools'), count: installedItems.value.filter(item => item.group === 'tool').length },
  { key: 'cli', label: st('groupCli'), count: installedItems.value.filter(item => item.group === 'cli').length },
  { key: 'skill', label: st('groupSkills'), count: installedItems.value.filter(item => item.group === 'skill').length }
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
  if (installedScrollerRef.value) installedScrollerRef.value.scrollTop = 0
}

/**
 * 纵向滚动懒加载。
 *
 * 已安装能力可能来自数据库、MCP 安装记录和 CLI 插件目录，一次性渲染过多卡片会让设置页首屏变慢。
 * 换行网格里在竖向滚动接近底部时追加一页，既保持交互顺滑，也避免一次性挤满页面。
 */
const handleInstalledScroll = () => {
  const el = installedScrollerRef.value
  if (!el || visibleInstalledCount.value >= filteredInstalledItems.value.length) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) {
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

// ---- 指标数字滚动动画 ----
// 指标从当前值缓动到目标值，避免数字突变；使用三次缓出让增长更自然。
const animated = reactive({ enabled: 0, mcp: 0, cli: 0, total: 0 })
const tweenFrames = {}
const tweenTo = (key, target) => {
  if (tweenFrames[key]) cancelAnimationFrame(tweenFrames[key])
  const from = animated[key]
  const start = performance.now()
  const duration = 620
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - t, 3)
    animated[key] = Math.round(from + (target - from) * eased)
    if (t < 1) tweenFrames[key] = requestAnimationFrame(step)
  }
  tweenFrames[key] = requestAnimationFrame(step)
}

watch(
  () => [enabledCount.value, installedMcpCount.value, enabledCliCount.value, installedItems.value.length],
  ([e, m, c, total]) => {
    tweenTo('enabled', e)
    tweenTo('mcp', m)
    tweenTo('cli', c)
    tweenTo('total', total)
  },
  { immediate: true }
)

// ---- 图表数据 ----
// 已安装能力按类型聚合，供环形图展示能力构成。
const kindDistribution = computed(() => {
  const counts = { skill: 0, mcp: 0, cli: 0 }
  installedItems.value.forEach((item) => {
    if (counts[item.kind] === undefined) counts.skill += 1
    else counts[item.kind] += 1
  })
  return counts
})

// 全网 MCP 分类分布来自后端实时目录的分类计数，去掉聚合用的 “all”，取前 8 类。
const mcpCategoryData = computed(() => {
  const categories = capabilityStore.categoriesByKind?.mcp || []
  return categories
    .filter(category => category.key !== 'all')
    .map(category => ({ name: category.label || category.key, value: Number(category.count || 0) }))
    .filter(entry => entry.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
})

// 会话启用率：已启用能力占已安装能力的比例。
const enableRate = computed(() => {
  const total = installedItems.value.length
  if (!total) return 0
  const enabled = installedItems.value.filter(item => item.kind === 'builtin' || enabledSkills.value.includes(item.id)).length
  return Math.round((Math.min(enabled, total) / total) * 100)
})

const readCss = (cssVar, name, fallback) => cssVar(name, fallback)

// 环形图：能力构成。
const buildKindDonut = ({ cssVar, dark }) => {
  const primary = readCss(cssVar, '--primary-color', '#2d8659')
  const primaryLight = readCss(cssVar, '--primary-light', '#4a9d6f')
  const textSub = readCss(cssVar, '--text-sub', '#8ba599')
  const textPrimary = readCss(cssVar, '--text-primary', '#1f2937')
  const bg = readCss(cssVar, '--bg-primary', dark ? '#0f1714' : '#ffffff')
  const d = kindDistribution.value
  const data = [
    { name: 'Skills', value: d.skill, itemStyle: { color: primary } },
    { name: 'MCP', value: d.mcp, itemStyle: { color: primaryLight } },
    { name: 'CLI', value: d.cli, itemStyle: { color: dark ? '#9ca3af' : '#4b5563' } }
  ]
  const total = data.reduce((sum, item) => sum + item.value, 0)
  return {
    animationDuration: 700,
    animationEasing: 'cubicOut',
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, icon: 'circle', textStyle: { color: textSub } },
    graphic: total === 0 ? [{ type: 'text', left: 'center', top: 'center', style: { text: '暂无已安装能力', fill: textSub, fontSize: 13 } }] : [],
    series: [
      {
        type: 'pie',
        radius: ['54%', '78%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        padAngle: 2,
        itemStyle: { borderRadius: 8, borderColor: bg, borderWidth: 2 },
        label: { show: true, position: 'center', formatter: () => `${total}\n${st('donutCenter')}`, color: textPrimary, fontSize: 18, fontWeight: 700, lineHeight: 20 },
        emphasis: { scale: true, scaleSize: 6, label: { show: true, fontSize: 18 } },
        data
      }
    ]
  }
}

// 横向柱状图：全网 MCP 分类分布。
const buildCategoryBar = ({ cssVar, dark }) => {
  const primary = readCss(cssVar, '--primary-color', '#2d8659')
  const primaryLight = readCss(cssVar, '--primary-light', '#4a9d6f')
  const textSub = readCss(cssVar, '--text-sub', '#8ba599')
  const gridColor = dark ? 'rgba(116, 185, 148, .14)' : 'rgba(45, 134, 89, .12)'
  const rows = [...mcpCategoryData.value].reverse()
  return {
    animationDuration: 720,
    animationDelay: (idx) => idx * 60,
    animationEasing: 'cubicOut',
    grid: { left: 8, right: 22, top: 12, bottom: 6, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'value', axisLabel: { color: textSub }, axisLine: { show: false }, splitLine: { lineStyle: { color: gridColor } } },
    yAxis: { type: 'category', data: rows.map(row => row.name), axisLabel: { color: textSub }, axisLine: { show: false }, axisTick: { show: false } },
    series: [
      {
        type: 'bar',
        barWidth: '58%',
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: primary }, { offset: 1, color: primaryLight }] }
        },
        data: rows.map(row => row.value)
      }
    ]
  }
}

// 仪表盘：会话启用率。
const buildEnableGauge = ({ cssVar, dark }) => {
  const primary = readCss(cssVar, '--primary-color', '#2d8659')
  const primaryLight = readCss(cssVar, '--primary-light', '#4a9d6f')
  const textSub = readCss(cssVar, '--text-sub', '#8ba599')
  const track = dark ? 'rgba(116, 185, 148, .16)' : 'rgba(45, 134, 89, .12)'
  return {
    animationDuration: 900,
    animationEasing: 'cubicOut',
    series: [
      {
        type: 'gauge',
        startAngle: 220,
        endAngle: -40,
        min: 0,
        max: 100,
        radius: '92%',
        center: ['50%', '56%'],
        progress: { show: true, width: 14, roundCap: true, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: primaryLight }, { offset: 1, color: primary }] } } },
        axisLine: { lineStyle: { width: 14, color: [[1, track]] } },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        title: { show: true, offsetCenter: [0, '38%'], color: textSub, fontSize: 12 },
        detail: { valueAnimation: true, offsetCenter: [0, '2%'], formatter: '{value}%', color: primary, fontSize: 30, fontWeight: 800 },
        data: [{ value: enableRate.value, name: st('gaugeName') }]
      }
    ]
  }
}

onMounted(() => {
  refreshLocalState()
  // 拉取一次全网 MCP 目录的分类统计，用于分类分布图（size 取小，只为拿 categories）。
  capabilityStore.fetchMarketplace('mcp', { size: 1 }).catch(() => {})
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
  /* 单列网格显式锁定为 minmax(0, 1fr)，否则隐式 auto 列会按子项 max-content 撑开：
     ECharts 会给 canvas 写死像素宽度，auto 列会被撑到该宽度，导致整页横向溢出失真。 */
  grid-template-columns: minmax(0, 1fr);
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

/* 指标卡入场：依次淡入上浮，营造仪表盘逐项点亮的感觉。 */
.metric-tile.pop {
  animation: popIn .5s var(--pop-delay, 0s) both cubic-bezier(.22, 1, .36, 1);
  transition: transform .2s ease, box-shadow .2s ease;
}

.metric-tile.pop:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 34px color-mix(in srgb, var(--primary-color) 14%, transparent);
}

@keyframes popIn {
  from { opacity: 0; transform: translateY(12px) scale(.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ---- 能力分析图表区 ---- */
.analytics-section {
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 6%, var(--bg-primary)), var(--bg-primary));
  padding: 14px;
}

.analytics-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}

.analytics-head strong {
  display: block;
  color: var(--text-title);
  font-size: 15px;
}

.analytics-head span {
  display: block;
  margin-top: 4px;
  color: var(--text-sub);
  font-size: 12px;
  line-height: 1.5;
}

.source-pill {
  flex-shrink: 0;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  background: color-mix(in srgb, var(--primary-color) 14%, transparent);
  color: var(--primary-color);
  font-size: 11px;
  font-weight: 800;
}

.source-pill.fallback {
  background: color-mix(in srgb, #d97706 16%, transparent);
  color: #b45309;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.chart-card {
  border: 1px solid var(--border-color);
  border-radius: 13px;
  background: var(--bg-primary);
  padding: 12px 12px 6px;
  /* grid 子项默认 min-width:auto，会被 ECharts canvas 的固定像素宽撑大；置 0 + 隐藏溢出让图表随列收缩。 */
  min-width: 0;
  overflow: hidden;
  transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
}

.chart-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--primary-color) 38%, var(--border-color));
  box-shadow: 0 16px 40px color-mix(in srgb, var(--primary-color) 12%, transparent);
}

.chart-card header {
  margin-bottom: 4px;
}

.chart-card header strong {
  display: block;
  color: var(--text-title);
  font-size: 14px;
}

.chart-card header small {
  display: block;
  margin-top: 2px;
  color: var(--text-sub);
  font-size: 11px;
}

/* 图表卡入场：交错淡入上浮，配合 ECharts 自身动画形成连贯过渡。 */
.reveal {
  animation: revealIn .55s var(--reveal-delay, 0s) both cubic-bezier(.22, 1, .36, 1);
}

@keyframes revealIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 980px) {
  .analytics-grid { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .metric-tile.pop,
  .reveal,
  .ability-card { animation: none; }
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

/* 自适应换行网格：卡片按容器宽度自动铺满并换行，纵向超出才出现一条自然的竖向滚动条，
   不再需要横向拖动。 */
.installed-scroller {
  min-height: 120px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(206px, 1fr));
  gap: 10px;
  max-height: 376px;
  overflow-y: auto;
  padding: 2px 4px 6px 2px;
}

.ability-card {
  width: auto;
  min-width: 0;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-primary);
  padding: 12px;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  animation: cardIn .42s both cubic-bezier(.22, 1, .36, 1);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}

.ability-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 32px color-mix(in srgb, var(--primary-color) 14%, transparent);
  border-color: color-mix(in srgb, var(--primary-color) 40%, var(--border-color));
}

/* 卡片逐个错峰入场，换行网格追加新页时也会自然滑入。 */
.ability-card:nth-child(1) { animation-delay: 0s; }
.ability-card:nth-child(2) { animation-delay: .04s; }
.ability-card:nth-child(3) { animation-delay: .08s; }
.ability-card:nth-child(4) { animation-delay: .12s; }
.ability-card:nth-child(5) { animation-delay: .16s; }
.ability-card:nth-child(6) { animation-delay: .2s; }
.ability-card:nth-child(7) { animation-delay: .24s; }
.ability-card:nth-child(8) { animation-delay: .28s; }

@keyframes cardIn {
  from { opacity: 0; transform: translateY(12px) scale(.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
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
  grid-column: 1 / -1;
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
