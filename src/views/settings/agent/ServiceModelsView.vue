<template>
  <section class="settings-view">
    <h1 class="settings-title">服务模型</h1>
    <div class="settings-card">
      <div class="card-head">
        <h2>可用模型</h2>
        <p>当前登录身份可使用的模型列表。</p>
      </div>
      <div class="model-list">
        <div v-for="model in models" :key="model.modelCode || model.value || model.name" class="model-row">
          <div>
            <strong>{{ model.modelName || model.label || model.modelCode || model.value || model.name }}</strong>
            <span>{{ model.providerCode || model.provider || 'unknown' }}</span>
          </div>
          <em>{{ model.enabled === false ? '停用' : '可用' }}</em>
        </div>
        <p v-if="models.length === 0" class="empty">暂无可用模型</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useChat } from '@/stores/chatStore'

const chatStore = useChat()
const models = computed(() => chatStore.availableModels || [])
</script>

<style scoped>
.model-list {
  display: grid;
}

.model-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-color);
}

.model-row div {
  display: grid;
  gap: 4px;
}

.model-row strong {
  color: var(--text-primary);
}

.model-row span,
.empty {
  color: var(--text-sub);
  font-size: 12px;
}

.model-row em {
  color: var(--primary-color);
  font-style: normal;
  font-weight: 700;
}

.empty {
  margin: 0;
  padding: 18px;
}
</style>
