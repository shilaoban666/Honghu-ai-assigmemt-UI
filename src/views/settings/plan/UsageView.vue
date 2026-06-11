<template>
  <section class="settings-view settings-view-animated usage-view">
    <h1 class="settings-title">用量</h1>

    <div class="usage-toolbar">
      <input v-model="month" type="month" />
      <select v-model="groupBy">
        <option value="model">模型</option>
        <option value="provider">模型服务商</option>
      </select>
      <button type="button" :disabled="chatStore.quotaLoading" @click="refreshQuota">
        {{ chatStore.quotaLoading ? '刷新中' : '刷新额度' }}
      </button>
    </div>

    <div class="usage-metrics">
      <div>
        <span>今日花费</span>
        <strong>{{ formatMoney(dailyQuota.moneyUsed) }}</strong>
        <small>{{ formatToken(dailyQuota.tokenUsed) }} 标准 Token</small>
      </div>
      <div>
        <span>本月花费</span>
        <strong>{{ formatMoney(monthlyQuota.moneyUsed) }}</strong>
        <small>{{ formatToken(monthlyQuota.tokenUsed) }} 标准 Token</small>
      </div>
      <div>
        <span>活跃模型</span>
        <strong>{{ activeModels }}</strong>
        <small>{{ stats.assistantMessageCount }} 次模型回复</small>
      </div>
    </div>

    <div class="settings-card chart-card">
      <div class="card-head">
        <h2>月度 Token 折线图</h2>
        <p>后端聚合接口未开放时，先使用本地会话消息估算趋势。</p>
      </div>
      <UsageChart :rows="usageRows" />
    </div>

    <div class="settings-card">
      <div class="card-head">
        <h2>本月使用情况</h2>
      </div>
      <div class="quota-stack">
        <QuotaProgress label="免费积分" :quota="monthlyQuota" />
        <QuotaProgress label="文件使用量" :quota="fileQuota" />
        <QuotaProgress label="向量存储" :quota="vectorQuota" />
      </div>
    </div>

    <div class="settings-card">
      <div class="card-head">
        <h2>计算积分使用详情</h2>
        <p>展示文本生成、触发方式、模型、令牌使用量和消耗积分。</p>
      </div>
      <div class="usage-table">
        <div class="usage-table-head">
          <span>创建时间</span><span>类型</span><span>触发方式</span><span>模型</span><span>令牌使用量</span><span>消耗积分</span>
        </div>
        <div v-for="row in eventRows" :key="row.id" class="usage-table-row">
          <span>{{ row.time }}</span>
          <span><mark>文本生成</mark></span>
          <span>聊天消息</span>
          <span>{{ row.model }}</span>
          <span><em>{{ formatToken(row.tokens) }}</em></span>
          <span>{{ row.credits }}</span>
        </div>
        <p v-if="eventRows.length === 0" class="empty">暂无本地用量明细</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useChat } from '@/stores/chatStore'
import QuotaProgress from '@/components/settings/QuotaProgress.vue'
import UsageChart from '@/components/settings/UsageChart.vue'
import { buildLocalStats, emptyQuota, formatMoney, formatToken } from '@/components/settings/settingsUtils'

const chatStore = useChat()
const month = ref(new Date().toISOString().slice(0, 7))
const groupBy = ref('model')

const dailyQuota = computed(() => chatStore.quotaSnapshot?.daily || emptyQuota)
const monthlyQuota = computed(() => chatStore.quotaSnapshot?.monthly || emptyQuota)
const stats = computed(() => buildLocalStats(chatStore.chats, chatStore.availableModels))
const activeModels = computed(() => Math.max(0, stats.value.modelRows.length))
const fileQuota = computed(() => ({ tokenUsed: 0, tokenLimit: 50 * 1024 * 1024, tokenRemaining: 50 * 1024 * 1024, unlimited: false }))
const vectorQuota = computed(() => ({ tokenUsed: 0, tokenLimit: 100, tokenRemaining: 100, unlimited: false }))

const usageRows = computed(() => {
  const [year, mon] = month.value.split('-').map(Number)
  const days = new Date(year, mon, 0).getDate()
  const rows = Array.from({ length: days }, (_, index) => ({
    date: `${month.value}-${String(index + 1).padStart(2, '0')}`,
    tokens: 0
  }))
  const rowByDate = new Map(rows.map(row => [row.date, row]))
  chatStore.chats.forEach(chat => {
    ;(chat.messages || []).forEach(message => {
      const date = new Date(message.timestamp || chat.createdAt || Date.now()).toISOString().slice(0, 10)
      if (!date.startsWith(month.value)) return
      const row = rowByDate.get(date)
      if (row) row.tokens += Math.max(1, String(message.content || '').length * 2)
    })
  })
  return rows
})

const eventRows = computed(() => {
  const rows = []
  chatStore.chats.forEach(chat => {
    ;(chat.messages || []).forEach((message, index) => {
      if (message.role !== 'assistant') return
      rows.push({
        id: `${chat.id}-${index}`,
        time: new Date(message.timestamp || chat.createdAt || Date.now()).toISOString().replace('T', ' ').slice(0, 19),
        model: message.model || '默认模型',
        tokens: Math.max(1, String(message.content || '').length * 2),
        credits: Math.max(1, Math.round(String(message.content || '').length / 10))
      })
    })
  })
  return rows.slice(-8).reverse()
})

const refreshQuota = () => {
  chatStore.loadUserQuota(chatStore.userId).catch(error => {
    console.warn('刷新用户额度失败:', error)
  })
}
</script>

<style scoped>
.usage-toolbar,
.usage-metrics {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.usage-toolbar {
  justify-content: flex-end;
}

.usage-toolbar input,
.usage-toolbar select,
.usage-toolbar button {
  border: 1px solid color-mix(in srgb, var(--primary-color) 14%, var(--border-color));
  border-radius: 10px;
  padding: 9px 12px;
  background: color-mix(in srgb, var(--text-sub) 6%, var(--bg-primary));
  color: var(--text-primary);
}

.usage-toolbar button {
  cursor: pointer;
  color: var(--primary-color);
  font-weight: 800;
}

.usage-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.usage-metrics div {
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--primary-color) 13%, var(--border-color));
  border-radius: 14px;
  background:
    radial-gradient(circle at 86% 0, color-mix(in srgb, var(--primary-color) 12%, transparent), transparent 36%),
    color-mix(in srgb, var(--text-sub) 6%, var(--bg-primary));
  box-shadow: 0 14px 34px color-mix(in srgb, var(--primary-color) 7%, transparent);
}

.usage-metrics span,
.usage-metrics small,
.empty {
  color: var(--text-sub);
  font-size: 12px;
}

.usage-metrics strong {
  display: block;
  margin: 10px 0 6px;
  color: var(--text-primary);
  font-size: 28px;
  line-height: 1;
}

.chart-card {
  padding-bottom: 10px;
}

.quota-stack {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.usage-table {
  overflow-x: auto;
}

.usage-table-head,
.usage-table-row {
  display: grid;
  grid-template-columns: 170px 110px 110px minmax(150px, 1fr) 130px 100px;
  gap: 12px;
  min-width: 860px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
  color: var(--text-primary);
  font-size: 13px;
}

.usage-table-head {
  color: var(--text-sub);
  font-weight: 800;
}

mark {
  padding: 3px 8px;
  border-radius: 7px;
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  color: var(--primary-color);
}

em {
  padding: 2px 6px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  color: var(--primary-color);
  font-style: normal;
}

.empty {
  margin: 0;
  padding: 18px;
}

:global(html.dark-mode) .usage-toolbar input,
:global(html.dark-mode) .usage-toolbar select,
:global(html.dark-mode) .usage-toolbar button {
  background: rgba(12, 18, 15, .82);
  border-color: color-mix(in srgb, var(--primary-color) 20%, rgba(255,255,255,.08));
  color: #eef7f1;
}

:global(html.dark-mode) .usage-metrics div {
  background:
    radial-gradient(circle at 86% 0, color-mix(in srgb, var(--primary-color) 18%, transparent), transparent 38%),
    rgba(255,255,255,.04);
}

@media (max-width: 760px) {
  .usage-toolbar,
  .usage-metrics {
    grid-template-columns: 1fr;
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
