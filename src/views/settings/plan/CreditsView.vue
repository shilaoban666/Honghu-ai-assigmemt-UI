<template>
  <section class="settings-view">
    <h1 class="settings-title">积分</h1>
    <div class="settings-card">
      <div class="card-head">
        <h2>积分余额</h2>
        <p>积分体系预留页面，当前沿用 Token 额度作为主要可用量展示。</p>
      </div>
      <div class="placeholder">
        <strong>{{ monthlyQuota.unlimited ? '不限' : formatToken(monthlyQuota.tokenRemaining) }}</strong>
        <span>剩余月度标准 Token</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useChat } from '@/stores/chatStore'
import { emptyQuota, formatToken } from '@/components/settings/settingsUtils'

const chatStore = useChat()
const monthlyQuota = computed(() => chatStore.quotaSnapshot?.monthly || emptyQuota)
</script>

<style scoped>
.placeholder {
  display: grid;
  gap: 8px;
  padding: 32px;
  text-align: center;
}

.placeholder strong {
  color: var(--text-primary);
  font-size: 36px;
}

.placeholder span {
  color: var(--text-sub);
}
</style>
