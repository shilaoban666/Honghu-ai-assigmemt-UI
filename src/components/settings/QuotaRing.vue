<template>
  <button class="quota-ring-card" type="button" @click="$router.push('/settings/plan/usage')">
    <span class="ring" :style="{ '--percent': percent, '--ring-color': ringColor }">
      <span>{{ remainingLabel }}</span>
    </span>
    <span class="ring-copy">
      <strong>月 Token</strong>
      <small>{{ usedLabel }} / {{ totalLabel }}</small>
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { formatToken, quotaPercent } from '@/components/settings/settingsUtils'

const props = defineProps({
  quota: { type: Object, default: null }
})

const percent = computed(() => quotaPercent(props.quota))
const usedLabel = computed(() => formatToken(props.quota?.tokenUsed || 0))
const totalLabel = computed(() => props.quota?.unlimited ? '不限' : formatToken(props.quota?.tokenLimit || 500000))
const remainingLabel = computed(() => {
  if (props.quota?.unlimited) return '不限'
  return `${Math.max(0, 100 - percent.value)}%`
})
const ringColor = computed(() => {
  if (percent.value >= 95) return '#dc2626'
  if (percent.value >= 80) return '#f59e0b'
  return 'var(--primary-color)'
})
</script>

<style scoped>
.quota-ring-card {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  border: 1px solid color-mix(in srgb, var(--primary-color) 16%, var(--border-color));
  border-radius: 12px;
  background:
    radial-gradient(circle at 12% 0, color-mix(in srgb, var(--primary-color) 14%, transparent), transparent 42%),
    var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
}

.quota-ring-card:hover {
  background: color-mix(in srgb, var(--primary-color) 7%, var(--bg-primary));
}

.ring {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: conic-gradient(var(--ring-color) calc(var(--percent) * 1%), var(--hover-bg-medium) 0);
  box-shadow: 0 0 22px color-mix(in srgb, var(--ring-color) 18%, transparent);
}

.ring span {
  display: grid;
  place-items: center;
  width: 33px;
  height: 33px;
  border-radius: 50%;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 10px;
  font-weight: 850;
}

.ring-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.ring-copy strong {
  font-size: 13px;
}

.ring-copy small {
  color: var(--text-sub);
  font-size: 11px;
}

:global(html.dark-mode) .quota-ring-card {
  background:
    radial-gradient(circle at 12% 0, color-mix(in srgb, var(--primary-color) 18%, transparent), transparent 42%),
    rgba(255,255,255,.045);
}

:global(html.dark-mode) .ring span {
  background: #101914;
}
</style>
