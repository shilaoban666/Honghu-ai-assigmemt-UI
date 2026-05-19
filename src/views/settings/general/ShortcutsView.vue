<template>
  <section class="settings-view">
    <h1 class="settings-title">快捷键</h1>
    <div class="settings-card">
      <div class="card-head">
        <h2>发送设置</h2>
      </div>
      <SettingRow title="发送快捷键" description="选择发送消息的快捷键">
        <div class="segmented-control">
          <button v-for="opt in options" :key="opt.value" :class="{ active: sendShortcut === opt.value }" @click="setSendShortcut(opt.value)">{{ opt.label }}</button>
        </div>
      </SettingRow>
      <SettingRow title="换行" description="未作为发送键的组合会用于换行">
        <span class="hint">{{ sendShortcut === 'enter' ? 'Shift + Enter' : 'Enter' }}</span>
      </SettingRow>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import SettingRow from '@/components/settings/SettingRow.vue'

const sendShortcut = ref('enter')
const options = [
  { value: 'enter', label: 'Enter' },
  { value: 'ctrl+enter', label: 'Ctrl + Enter' }
]

const setSendShortcut = (val) => {
  sendShortcut.value = val
  localStorage.setItem('sendShortcut', val)
}

onMounted(() => {
  sendShortcut.value = localStorage.getItem('sendShortcut') || 'enter'
})
</script>

<style scoped>
.segmented-control {
  display: flex;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
}

.segmented-control button {
  border: none;
  border-radius: 6px;
  padding: 7px 12px;
  background: transparent;
  color: var(--text-sub);
  cursor: pointer;
}

.segmented-control button.active {
  background: var(--primary-color);
  color: #fff;
}

.hint {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
}
</style>
