<template>
  <section class="settings-view">
    <h1 class="settings-title">通知</h1>
    <div class="settings-card">
      <div class="card-head">
        <h2>消息通知</h2>
      </div>
      <SettingRow title="消息提示音" description="收到新消息时播放提示音">
        <label class="toggle">
          <input v-model="enableSound" type="checkbox" @change="saveSound" />
          <span></span>
        </label>
      </SettingRow>
      <SettingRow title="额度提醒" description="当月 Token 剩余低于 10% 时，在输入区显示提醒">
        <label class="toggle">
          <input v-model="quotaWarning" type="checkbox" @change="saveQuotaWarning" />
          <span></span>
        </label>
      </SettingRow>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import SettingRow from '@/components/settings/SettingRow.vue'

const enableSound = ref(true)
const quotaWarning = ref(true)

const saveSound = () => localStorage.setItem('enableSound', String(enableSound.value))
const saveQuotaWarning = () => localStorage.setItem('quotaWarning', String(quotaWarning.value))

onMounted(() => {
  enableSound.value = localStorage.getItem('enableSound') !== 'false'
  quotaWarning.value = localStorage.getItem('quotaWarning') !== 'false'
})
</script>

<style scoped>
.toggle {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;
}

.toggle input {
  opacity: 0;
}

.toggle span {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: var(--hover-bg-medium);
  cursor: pointer;
}

.toggle span::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.18);
  transition: transform 0.2s ease;
}

.toggle input:checked + span {
  background: var(--primary-color);
}

.toggle input:checked + span::before {
  transform: translateX(18px);
}
</style>
