<template>
  <section class="settings-view settings-view-animated">
    <h1 class="settings-title">高级设置</h1>

    <div class="settings-card glass-card">
      <div class="card-head">
        <h2>高级设置</h2>
      </div>
      <SettingRow title="开发者模式" description="开启后将显示开发者相关的功能和选项">
        <label class="switch">
          <input v-model="developerMode" type="checkbox" @change="save('developerMode', developerMode)" />
          <span></span>
        </label>
      </SettingRow>
    </div>

    <div class="settings-card glass-card">
      <div class="card-head">
        <h2>实验室</h2>
      </div>
      <SettingRow title="输入框 Markdown 渲染" description="在输入区域实时渲染 Markdown（粗体、代码块、表格等）">
        <label class="switch">
          <input v-model="inputMarkdown" type="checkbox" @change="save('inputMarkdown', inputMarkdown)" />
          <span></span>
        </label>
      </SettingRow>
      <SettingRow title="服务端代理执行（Gateway）" description="通过 Gateway 在服务端执行 Agent 任务。可实现关闭浏览器后仍然执行 agent。">
        <label class="switch">
          <input v-model="gatewayExecution" type="checkbox" @change="save('gatewayExecution', gatewayExecution)" />
          <span></span>
        </label>
      </SettingRow>
      <SettingRow title="AI 回复时自动滚动" description="当 AI 正在生成回复时，自动滚动到底部">
        <label class="switch">
          <input v-model="autoScroll" type="checkbox" @change="save('autoScroll', autoScroll)" />
          <span></span>
        </label>
      </SettingRow>
    </div>

    <div class="settings-card glass-card">
      <div class="card-head">
        <h2>路由与诊断</h2>
        <p>这些能力来自本次设置中心改造，不改变原聊天功能。</p>
      </div>
      <SettingRow title="浏览器返回" description="设置页支持浏览器返回键回到聊天或上一个设置子页">
        <span class="status">已启用</span>
      </SettingRow>
      <SettingRow title="深链访问" description="可以直接访问 /#/settings/plan/usage">
        <span class="status">已启用</span>
      </SettingRow>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import SettingRow from '@/components/settings/SettingRow.vue'

const developerMode = ref(false)
const inputMarkdown = ref(true)
const gatewayExecution = ref(false)
const autoScroll = ref(true)

const save = (key, value) => {
  localStorage.setItem(key, String(value))
  document.documentElement.setAttribute(`data-${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`, String(value))
}

onMounted(() => {
  developerMode.value = localStorage.getItem('developerMode') === 'true'
  inputMarkdown.value = localStorage.getItem('inputMarkdown') !== 'false'
  gatewayExecution.value = localStorage.getItem('gatewayExecution') === 'true'
  autoScroll.value = localStorage.getItem('autoScroll') !== 'false'
  save('autoScroll', autoScroll.value)
})
</script>

<style scoped>
.status {
  color: var(--primary-color);
  font-size: 13px;
  font-weight: 800;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
}

.switch span {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: #c8c8c8;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.switch span::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  transition: transform 0.2s cubic-bezier(.2,.8,.2,1);
}

.switch input:checked + span {
  background: #202020;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
}

.switch input:checked + span::before {
  transform: translateX(20px);
}
</style>
