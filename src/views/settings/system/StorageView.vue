<template>
  <section class="settings-view">
    <h1 class="settings-title">数据存储</h1>
    <div class="settings-card">
      <div class="card-head">
        <h2>导入导出</h2>
        <p>当前保留聊天分享、导出和附件上传能力；设置页提供集中入口。</p>
      </div>
      <div class="storage-actions">
        <button type="button" @click="exportLocalData">导出本地数据</button>
        <button type="button" @click="clearLocalDraft">清理本地草稿</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useChat } from '@/stores/chatStore'
const chatStore = useChat()

const exportLocalData = () => {
  const blob = new Blob([JSON.stringify({ chats: chatStore.chats, user: chatStore.currentUser }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'honghu-ai-local-data.json'
  a.click()
  URL.revokeObjectURL(url)
}

const clearLocalDraft = () => {
  localStorage.removeItem('draftMessage')
}
</script>

<style scoped>
.storage-actions {
  display: flex;
  gap: 10px;
  padding: 18px;
}

.storage-actions button {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
}
</style>
