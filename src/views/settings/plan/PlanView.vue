<template>
  <section class="settings-view">
    <h1 class="settings-title">套餐</h1>
    <div class="plan-grid">
      <div class="current-plan">
        <span>当前套餐</span>
        <h2>{{ planLabel }}</h2>
        <p>保留当前角色、模型授权和额度策略。升级能力待后端套餐接口开放后接入。</p>
        <button type="button">升级套餐</button>
      </div>
      <div class="settings-card">
        <div class="card-head">
          <h2>套餐权益</h2>
        </div>
        <ul class="feature-list">
          <li><span>月度标准 Token</span><strong>{{ monthlyQuota.unlimited ? '不限' : formatToken(monthlyQuota.tokenLimit) }}</strong></li>
          <li><span>今日标准 Token</span><strong>{{ dailyQuota.unlimited ? '不限' : formatToken(dailyQuota.tokenLimit) }}</strong></li>
          <li><span>可用模型</span><strong>{{ modelCount }} 个</strong></li>
          <li><span>成员身份</span><strong>{{ roleLabel }}</strong></li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useChat } from '@/stores/chatStore'
import { emptyQuota, formatToken } from '@/components/settings/settingsUtils'

const chatStore = useChat()
const dailyQuota = computed(() => chatStore.quotaSnapshot?.daily || emptyQuota)
const monthlyQuota = computed(() => chatStore.quotaSnapshot?.monthly || emptyQuota)
const planLabel = computed(() => chatStore.currentUser?.planCode || monthlyQuota.value?.planCode || '个人版')
const modelCount = computed(() => chatStore.availableModels?.length || 0)
const roleLabel = computed(() => chatStore.identityLabel || chatStore.userRole || '用户')
</script>

<style scoped>
.plan-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.current-plan {
  padding: 24px;
  border: 1px solid color-mix(in srgb, var(--primary-color) 24%, transparent);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--hover-bg), var(--bg-primary));
}

.current-plan span,
.current-plan p {
  color: var(--text-sub);
}

.current-plan h2 {
  margin: 10px 0;
  color: var(--text-primary);
  font-size: 28px;
}

.current-plan button {
  margin-top: 16px;
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  background: var(--primary-color);
  color: #fff;
  cursor: pointer;
  font-weight: 700;
}

.feature-list {
  display: grid;
  gap: 0;
  padding: 8px 18px 18px;
  margin: 0;
  list-style: none;
}

.feature-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.feature-list li:last-child {
  border-bottom: none;
}

.feature-list span {
  color: var(--text-sub);
}

.feature-list strong {
  color: var(--text-primary);
}

@media (max-width: 760px) {
  .plan-grid {
    grid-template-columns: 1fr;
  }
}
</style>
