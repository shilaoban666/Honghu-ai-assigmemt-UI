<template>
  <div class="quota-progress">
    <div class="quota-head">
      <span>{{ label }}</span>
      <strong>{{ formatQuotaPair(quota) }}</strong>
    </div>
    <div class="progress-track">
      <div :class="['progress-fill', quotaLevel(percent)]" :style="{ width: `${quota?.unlimited ? 100 : percent}%` }"></div>
    </div>
    <div class="quota-foot">
      <span>已用 {{ formatToken(quota?.tokenUsed) }}</span>
      <span>剩余 {{ quota?.unlimited ? '不限' : formatToken(quota?.tokenRemaining) }}</span>
      <span v-if="showMoney">金额 {{ formatMoney(quota?.moneyUsed) }} / {{ quota?.unlimited ? '不限' : formatMoney(quota?.moneyLimit) }}</span>
      <span v-else-if="quota?.rawTokenUsed !== undefined">原始 Token {{ formatToken(quota?.rawTokenUsed) }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatMoney, formatQuotaPair, formatToken, quotaLevel, quotaPercent } from '@/components/settings/settingsUtils'

const props = defineProps({
  label: { type: String, default: '额度' },
  quota: { type: Object, default: null },
  showMoney: { type: Boolean, default: false }
})

const percent = computed(() => quotaPercent(props.quota))
</script>

<style scoped>
.quota-progress {
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--primary-color) 12%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--text-sub) 7%, transparent);
}

.quota-head,
.quota-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.quota-head span {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 800;
}

.quota-head strong {
  color: var(--text-primary);
  font-size: 13px;
}

.progress-track {
  height: 9px;
  margin: 12px 0 10px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--hover-bg-medium);
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
  box-shadow: 0 0 18px color-mix(in srgb, var(--primary-color) 24%, transparent);
  transition: width 0.3s ease;
}

.progress-fill.warn {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.progress-fill.danger {
  background: linear-gradient(90deg, #dc2626, #ef4444);
}

.quota-foot {
  flex-wrap: wrap;
  color: var(--text-sub);
  font-size: 12px;
}
</style>
