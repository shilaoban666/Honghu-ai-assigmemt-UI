<template>
  <RouterView />
</template>

<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useChat } from '@/stores/chatStore'
import { initTheme, getTheme } from '@/utils/theme'
import { getLanguage } from '@/utils/i18n'

const chatStore = useChat()

onMounted(async () => {
  chatStore.initFromLocalStorage()

  const savedTheme = getTheme()
  document.documentElement.setAttribute('data-theme', savedTheme)
  initTheme()

  const savedLanguage = getLanguage()
  document.documentElement.setAttribute('data-language', savedLanguage)

  const savedThemeMode = localStorage.getItem('themeMode') || 'light'
  document.documentElement.classList.toggle('dark-mode', savedThemeMode === 'dark')
  if (savedThemeMode === 'auto') {
    document.documentElement.classList.toggle('dark-mode', window.matchMedia('(prefers-color-scheme: dark)').matches)
  }

  document.documentElement.setAttribute('data-font-size', localStorage.getItem('fontSize') || 'default')
  document.documentElement.setAttribute('data-bubble-style', localStorage.getItem('bubbleStyle') || 'bubble')

  if (chatStore.isLoggedIn && chatStore.userId) {
    await chatStore.refreshCurrentUser(chatStore.userId).catch(error => {
      console.warn('用户资料刷新失败:', error)
    })
    await chatStore.loadUserSessions(chatStore.userId)
    await chatStore.loadUserQuota(chatStore.userId).catch(error => {
      console.warn('用户额度快照加载失败:', error)
    })
  }
})
</script>
