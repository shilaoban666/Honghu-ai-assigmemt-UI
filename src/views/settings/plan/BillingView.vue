<template>
  <section class="settings-view">
    <h1 class="settings-title">账单</h1>
    <div class="settings-card">
      <div class="card-head">
        <h2>历史扣费明细</h2>
        <p>账单接口暂未开放，当前展示本地可估算的 AI 调用明细。</p>
      </div>
      <div class="billing-list">
        <div v-for="row in rows" :key="row.id" class="billing-row">
          <div>
            <strong>{{ row.title }}</strong>
            <span>{{ row.time }}</span>
          </div>
          <em>{{ row.amount }}</em>
        </div>
        <p v-if="rows.length === 0" class="empty">暂无账单记录</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useChat } from '@/stores/chatStore'

const chatStore = useChat()
const rows = computed(() => {
  const list = []
  chatStore.chats.forEach(chat => {
    ;(chat.messages || []).forEach((message, index) => {
      if (message.role !== 'assistant') return
      list.push({
        id: `${chat.id}-${index}`,
        title: message.model || '模型调用',
        time: new Date(message.timestamp || chat.createdAt || Date.now()).toISOString().replace('T', ' ').slice(0, 19),
        amount: '¥0.00'
      })
    })
  })
  return list.slice(-10).reverse()
})
</script>

<style scoped>
.billing-list {
  display: grid;
}

.billing-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-color);
}

.billing-row div {
  display: grid;
  gap: 4px;
}

.billing-row strong {
  color: var(--text-primary);
}

.billing-row span,
.empty {
  color: var(--text-sub);
  font-size: 12px;
}

.billing-row em {
  color: var(--text-primary);
  font-style: normal;
  font-weight: 800;
}

.empty {
  margin: 0;
  padding: 18px;
}
</style>
