<template>
  <RouterView />
</template>

<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useChat } from '@/stores/chatStore'
import { loginWithWeChat } from '@/api/auth'
import { initTheme, getTheme } from '@/utils/theme'
import { getLanguage } from '@/utils/i18n'

const chatStore = useChat()

/**
 * 处理微信扫码登录回调。
 *
 * 用户在微信授权后，微信会带 ?code=&state= 回跳到本页（redirect_uri）。这里在 App 挂载时
 * 统一检测：校验 state（防 CSRF）→ 用 code 调后端换 openid 完成登录 → 清理 URL 上的回调参数，
 * 避免刷新重复触发。返回是否已通过微信登录。
 */
async function handleWeChatCallback() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')
  if (!code) return false
  const expected = sessionStorage.getItem('wechat_oauth_state')
  try {
    if (expected && state && expected !== state) {
      console.error('微信回调 state 不匹配，已忽略本次回调')
      return false
    }
    const r = await loginWithWeChat(code, state || '')
    chatStore.login({
      userId: r.userId, username: r.username, nickname: r.nickname || r.username,
      email: r.email, phone: r.phone, avatar: r.avatar, token: r.token,
      userRole: r.userRole, identity: r.identity, identityLabel: r.identityLabel,
      permissionSummary: r.permissionSummary, availableModels: r.availableModels || []
    })
    return true
  } catch (e) {
    console.error('微信登录失败:', e?.message || e)
    return false
  } finally {
    sessionStorage.removeItem('wechat_oauth_state')
    // 清掉 code/state，避免刷新时拿着已失效的 code 重复请求
    const url = new URL(window.location.href)
    url.searchParams.delete('code')
    url.searchParams.delete('state')
    window.history.replaceState({}, document.title, url.pathname + url.search + url.hash)
  }
}

onMounted(async () => {
  // 先处理微信回调（若是从微信授权跳回来的）；否则按本地存储恢复登录态。
  const wechatLoggedIn = await handleWeChatCallback()
  if (!wechatLoggedIn) {
    chatStore.initFromLocalStorage()
  }

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
    // 校验本地登录态是否仍然有效：若存储里的用户已不存在 / token 失效，
    // 刷新资料会抛错。此时自动登出清掉脏状态，避免后续 sessions/quota 连环报错
    // （典型场景：换了数据库或清过库，localStorage 里还留着旧用户 id）。
    try {
      await chatStore.refreshCurrentUser(chatStore.userId)
    } catch (error) {
      console.warn('本地登录态已失效，自动登出:', error?.message || error)
      chatStore.logout()
    }
    if (chatStore.isLoggedIn) {
      await chatStore.loadUserSessions(chatStore.userId).catch(error => {
        console.warn('会话列表加载失败:', error?.message || error)
      })
      await chatStore.loadUserQuota(chatStore.userId).catch(error => {
        console.warn('用户额度快照加载失败:', error?.message || error)
      })
    }
  }
})
</script>
