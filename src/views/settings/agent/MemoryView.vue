<template>
  <section class="settings-view">
    <h1 class="settings-title">记忆设置</h1>
    <div class="settings-card">
      <div class="card-head">
        <h2>记忆设置</h2>
        <p>当前对话记忆逻辑保持不变，后续可在这里控制长期记忆和工作空间记忆。</p>
      </div>
      <div class="memory-list">
        <div v-for="chat in chatStore.chats" :key="chat.id">
          <strong>{{ chat.title }}</strong>
          <span>{{ chat.memory?.length || 0 }} 条记忆</span>
        </div>
        <p v-if="chatStore.chats.length === 0" class="empty">暂无会话记忆</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useChat } from '@/stores/chatStore'
const chatStore = useChat()
</script>

<style scoped>
.memory-list {
  display: grid;
}

.memory-list div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-color);
}

.memory-list strong {
  color: var(--text-primary);
}

.memory-list span,
.empty {
  color: var(--text-sub);
  font-size: 12px;
}

.empty {
  margin: 0;
  padding: 18px;
}
</style>
