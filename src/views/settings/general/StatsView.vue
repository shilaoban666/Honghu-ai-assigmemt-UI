<template>
  <section class="settings-view settings-view-animated stats-view">
    <h1 class="settings-title">{{ st('stats') }}</h1>

    <div class="stats-hero glass-card">
      <div>
        <span class="hero-kicker">{{ st('workspace') }}</span>
        <h2>{{ heroText }}</h2>
        <p>{{ st('registeredAt') }}：{{ registerDate }} · {{ st('updatedAt') }}：{{ today }}</p>
      </div>
      <button type="button" :title="st('shareStats')">
        <Share2 :size="18" />
      </button>
    </div>

    <div class="analytics-shell glass-card">
      <div class="stats-topbar">
        <div class="tab-group">
          <button :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">{{ st('overview') }}</button>
          <button :class="{ active: activeTab === 'models' }" @click="activeTab = 'models'">{{ st('model') }}</button>
        </div>
        <div class="tab-group range">
          <button v-for="item in ranges" :key="item.value" :class="{ active: range === item.value }" @click="range = item.value">{{ st(item.labelKey) }}</button>
        </div>
      </div>

      <template v-if="activeTab === 'overview'">
        <div class="metric-board">
          <div v-for="metric in metrics" :key="metric.label" class="metric-tile">
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
            <em>{{ metric.note }}</em>
          </div>
        </div>

        <div class="activity-panel">
          <div class="panel-head">
            <div>
              <h3>{{ st('activityTitle') }}</h3>
              <p>{{ activeSummaryText }}</p>
            </div>
            <span>{{ rangeLabel }}</span>
          </div>
          <div class="heatmap-frame">
            <div class="heatmap-grid" aria-label="消息活跃热力图">
              <span v-for="day in filteredActivity" :key="day.date" :class="`level-${level(day.count)}`" :title="`${day.date}: ${day.count} 条消息`"></span>
            </div>
          </div>
        </div>

        <p class="insight">{{ insightText }}</p>
      </template>

      <template v-else>
        <div class="chart-wrap">
          <div class="bar-chart" aria-label="模型 Token 柱状图">
            <div class="y-axis">
              <span>{{ compact(maxModelTokens) }}</span>
              <span>{{ compact(maxModelTokens * 0.75) }}</span>
              <span>{{ compact(maxModelTokens * 0.5) }}</span>
              <span>{{ compact(maxModelTokens * 0.25) }}</span>
              <span>0</span>
            </div>
            <div class="bars">
              <div v-for="row in chartBars" :key="row.date" class="bar-column">
                <span class="bar-stack">
                  <i v-for="seg in row.segments" :key="seg.name" :style="{ height: `${seg.height}%`, background: seg.color }"></i>
                </span>
                <small>{{ row.label }}</small>
              </div>
            </div>
          </div>
          <div class="model-legend">
            <div v-for="row in modelBreakdown" :key="row.name">
              <span><i :style="{ background: row.color }"></i>{{ row.name }}</span>
              <em>{{ compact(row.input) }} in · {{ compact(row.output) }} out</em>
              <strong>{{ row.percent }}%</strong>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="top-grid">
      <TopList :title="st('modelUsageRate')" :label="st('model')" :value-label="st('messageCount')" :rows="stats.modelRows" />
      <TopList :title="st('assistantUsageRate')" :label="st('assistant')" :value-label="st('messageCount')" :rows="stats.assistantRows" />
      <TopList :title="st('topicContentVolume')" :label="st('topic')" :value-label="st('messageCount')" :rows="stats.topicRows" />
    </div>
  </section>
</template>

<script setup>
import { computed, defineComponent, h, ref } from 'vue'
import { Share2 } from '@lucide/vue'
import { useChat } from '@/stores/chatStore'
import { buildLocalStats, formatToken } from '@/components/settings/settingsUtils'
import { st } from '@/components/settings/settingsLocale'

const chatStore = useChat()
const activeTab = ref('overview')
const range = ref('all')
const ranges = [
  { value: 'all', labelKey: 'year' },
  { value: '30d', labelKey: 'days30' },
  { value: '7d', labelKey: 'days7' }
]

const today = new Date().toISOString().slice(0, 10)
const registerDate = computed(() => {
  const source = chatStore.currentUser?.createdAt || chatStore.currentUser?.registerTime || '2026-03-29'
  return String(source).slice(0, 10)
})
const daysSinceRegister = computed(() => {
  const start = new Date(registerDate.value).getTime()
  return Math.max(1, Math.ceil((Date.now() - start) / 86400000))
})
const displayName = computed(() => chatStore.currentUser?.nickname || chatStore.username || st('user'))
const heroText = computed(() => st('statsHero').replace('{name}', displayName.value).replace('{days}', daysSinceRegister.value))
const stats = computed(() => buildLocalStats(chatStore.chats, chatStore.availableModels))
const filteredActivity = computed(() => {
  if (range.value === '7d') return stats.value.activity.slice(-7)
  if (range.value === '30d') return stats.value.activity.slice(-30)
  return stats.value.activity
})
const rangeLabel = computed(() => st(ranges.find(item => item.value === range.value)?.labelKey || 'year'))
const maxActivity = computed(() => Math.max(...filteredActivity.value.map(day => day.count), 1))
const level = (count) => count === 0 ? 0 : Math.max(1, Math.ceil((count / maxActivity.value) * 5))

const sessionCount = computed(() => chatStore.chats.length)
const activeDays = computed(() => stats.value.activity.filter(day => day.count > 0).length)
const favoriteModel = computed(() => stats.value.modelRows[0]?.name || st('defaultModelName'))
const totalTokenText = computed(() => formatToken(Math.max(stats.value.wordCount * 2, stats.value.messageCount * 120)))
const activeSummaryText = computed(() => st('activeSummary').replace('{days}', activeDays.value).replace('{streak}', currentStreak.value))
const insightText = computed(() => st('statsInsight').replace('{tokens}', totalTokenText.value).replace('{model}', favoriteModel.value))
const metrics = computed(() => [
  { label: st('assistants'), value: stats.value.assistantCount, note: st('availableServices') },
  { label: st('topics'), value: sessionCount.value, note: st('conversationAsset') },
  { label: st('messages'), value: stats.value.messageCount.toLocaleString(), note: st('totalInteractions') },
  { label: st('totalWords'), value: formatToken(stats.value.wordCount), note: st('contextDeposit') },
  { label: st('activeDays'), value: activeDays.value, note: st('pastYear') },
  { label: st('currentStreak'), value: `${currentStreak.value} ${st('daysUnit')}`, note: st('collaboration') },
  { label: st('longestStreak'), value: `${longestStreak.value} ${st('daysUnit')}`, note: st('bestHistory') },
  { label: st('peakHour'), value: peakHour.value, note: st('usageHabit') }
])

const currentStreak = computed(() => {
  let count = 0
  for (let i = stats.value.activity.length - 1; i >= 0; i -= 1) {
    if (stats.value.activity[i].count > 0) count += 1
    else if (count > 0) break
  }
  return count
})

const longestStreak = computed(() => {
  let best = 0
  let run = 0
  stats.value.activity.forEach(day => {
    run = day.count > 0 ? run + 1 : 0
    best = Math.max(best, run)
  })
  return best
})

const peakHour = computed(() => {
  const buckets = new Array(24).fill(0)
  chatStore.chats.forEach(chat => {
    ;(chat.messages || []).forEach(message => {
      const hour = new Date(message.timestamp || chat.createdAt || Date.now()).getHours()
      buckets[hour] += 1
    })
  })
  const hour = buckets.indexOf(Math.max(...buckets))
  return `${String(hour).padStart(2, '0')}:00`
})

const modelBreakdown = computed(() => {
  const colors = ['var(--primary-color)', 'var(--primary-light)', '#7dbb9a', '#a6d6bc']
  const total = Math.max(1, stats.value.modelRows.reduce((sum, row) => sum + row.count, 0))
  const rows = stats.value.modelRows.length ? stats.value.modelRows : [{ name: st('defaultModelName'), count: stats.value.assistantMessageCount || 1 }]
  return rows.slice(0, 4).map((row, index) => ({
    name: row.name,
    color: colors[index % colors.length],
    input: row.count * 59100,
    output: row.count * 120000,
    percent: ((row.count / total) * 100).toFixed(1)
  }))
})
const maxModelTokens = computed(() => Math.max(...modelBreakdown.value.map(row => row.input + row.output), 1))
const chartBars = computed(() => filteredActivity.value.slice(-16).map(day => {
  const total = Math.max(day.count * 100000, day.count ? 60000 : 0)
  return {
    date: day.date,
    label: new Date(day.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
    segments: modelBreakdown.value.map((model, index) => ({
      name: model.name,
      color: model.color,
      height: total ? Math.max(4, ((total / modelBreakdown.value.length) / maxModelTokens.value) * 100 + index * 3) : 0
    }))
  }
}))

const compact = (value) => {
  const n = Number(value || 0)
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(Math.round(n))
}

const TopList = defineComponent({
  props: {
    title: String,
    label: String,
    valueLabel: String,
    rows: Array
  },
  setup(props) {
    return () => h('div', { class: 'top-list glass-card' }, [
      h('h3', props.title),
      h('div', { class: 'top-labels' }, [h('span', props.label), h('span', props.valueLabel)]),
      ...(props.rows?.length ? props.rows.slice(0, 5).map(row => h('div', { class: 'top-row', key: row.name }, [
        h('span', row.name),
        h('strong', row.count)
      ])) : [h('p', { class: 'empty' }, st('noData'))])
    ])
  }
})
</script>

<style scoped>
.analytics-shell,
.stats-hero {
  margin-bottom: 18px;
  padding: 18px;
}

.stats-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 5%, rgba(255,255,255,.82)), rgba(255,255,255,.72));
}

.hero-kicker {
  display: inline-flex;
  margin-bottom: 10px;
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 800;
}

.stats-hero h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
  line-height: 1.45;
}

.stats-hero p {
  margin: 8px 0 0;
  color: var(--text-sub);
  font-size: 13px;
}

.stats-hero button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: transparent;
  color: var(--primary-color);
  cursor: pointer;
}

.stats-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.tab-group {
  display: inline-flex;
  gap: 2px;
  flex: 0 0 auto;
  padding: 3px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-primary);
}

.tab-group button {
  border: none;
  border-radius: 9px;
  min-width: 58px;
  padding: 7px 13px;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 750;
}

.tab-group.range {
  margin-left: auto;
}

.tab-group button.active {
  background: var(--primary-color);
  color: #fff;
  box-shadow: none;
}

.metric-board {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.metric-tile {
  display: grid;
  gap: 6px;
  min-height: 86px;
  padding: 14px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-primary);
}

.metric-tile span,
.metric-tile em {
  color: var(--text-sub);
  font-size: 12px;
  font-style: normal;
}

.metric-tile strong {
  overflow: hidden;
  color: var(--text-primary);
  font-size: 24px;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-panel {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-primary);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-head h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 15px;
}

.panel-head p {
  margin: 4px 0 0;
  color: var(--text-sub);
  font-size: 12px;
}

.panel-head > span {
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 800;
}

.heatmap-frame {
  width: 100%;
  overflow: hidden;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(53, minmax(0, 1fr));
  grid-template-rows: repeat(7, 1fr);
  grid-auto-flow: column;
  gap: 4px;
  width: 100%;
  height: 142px;
}

.heatmap-grid span {
  display: block;
  min-width: 0;
  min-height: 0;
  border-radius: 4px;
  background: #edf4f0;
  transition: transform .15s ease;
}

.heatmap-grid span:hover {
  transform: scale(1.18);
}

.level-0 { background: #edf4f0 !important; }
.level-1 { background: #d7ece1 !important; }
.level-2 { background: #b8dcc8 !important; }
.level-3 { background: #83c19f !important; }
.level-4 { background: #4ea375 !important; }
.level-5 { background: var(--primary-color) !important; }

.insight {
  margin: 12px 0 0;
  color: var(--text-sub);
  font-size: 13px;
}

.chart-wrap {
  padding: 4px 6px 0;
}

.bar-chart {
  display: grid;
  grid-template-columns: 48px 1fr;
  height: 232px;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px 0 28px;
  color: var(--text-sub);
  font-size: 12px;
}

.bars {
  display: grid;
  grid-template-columns: repeat(16, minmax(18px, 1fr));
  align-items: end;
  gap: 8px;
  border-bottom: 1px solid var(--border-color);
  background-image: linear-gradient(to top, color-mix(in srgb, var(--primary-color) 10%, transparent) 1px, transparent 1px);
  background-size: 100% 45px;
}

.bar-column {
  display: grid;
  align-items: end;
  gap: 6px;
  height: 100%;
}

.bar-stack {
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-start;
  height: 184px;
  overflow: hidden;
  border-radius: 6px 6px 2px 2px;
  background: color-mix(in srgb, var(--text-sub) 8%, transparent);
}

.bar-stack i {
  display: block;
  min-height: 0;
}

.bar-column small {
  overflow: hidden;
  color: var(--text-sub);
  font-size: 11px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-legend {
  display: grid;
  gap: 8px;
  margin-top: 16px;
}

.model-legend div {
  display: grid;
  grid-template-columns: 1fr auto 70px;
  gap: 16px;
  align-items: center;
  padding: 9px 10px;
  border-radius: 10px;
  background: var(--bg-secondary);
}

.model-legend span {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
  font-weight: 750;
}

.model-legend i {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.model-legend em {
  color: var(--text-sub);
  font-style: normal;
}

.model-legend strong {
  color: var(--text-primary);
  text-align: right;
}

.top-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

:deep(.top-list) {
  padding: 16px;
}

:deep(.top-list h3) {
  margin: 0 0 14px;
  color: var(--text-primary);
  font-size: 16px;
}

:deep(.top-labels),
:deep(.top-row) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

:deep(.top-labels),
:deep(.empty) {
  color: var(--text-sub);
  font-size: 12px;
}

:deep(.top-row) {
  margin-top: 8px;
  padding: 9px 10px;
  border-radius: 10px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 13px;
}

:deep(.top-row span) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(html.dark-mode) .stats-hero,
:global(html.dark-mode) .metric-tile,
:global(html.dark-mode) .activity-panel,
:global(html.dark-mode) .tab-group,
:global(html.dark-mode) .model-legend div,
:global(html.dark-mode) :deep(.top-row) {
  background: rgba(255,255,255,.04);
}

:global(html.dark-mode) .level-0 { background: rgba(255,255,255,.06) !important; }
:global(html.dark-mode) .level-1 { background: color-mix(in srgb, var(--primary-color) 20%, rgba(255,255,255,.06)) !important; }
:global(html.dark-mode) .level-2 { background: color-mix(in srgb, var(--primary-color) 38%, rgba(255,255,255,.06)) !important; }
:global(html.dark-mode) .level-3 { background: color-mix(in srgb, var(--primary-color) 56%, rgba(255,255,255,.06)) !important; }
:global(html.dark-mode) .level-4 { background: color-mix(in srgb, var(--primary-color) 74%, rgba(255,255,255,.06)) !important; }

@media (max-width: 760px) {
  .metric-board,
  .top-grid {
    grid-template-columns: 1fr 1fr;
  }

  .stats-topbar {
    align-items: stretch;
    flex-direction: column;
  }

  .heatmap-grid {
    gap: 3px;
    height: 104px;
  }

  .model-legend div {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
