import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUserSessions, getSessionChatHistory } from '@/api/chat'
import { getUserInfo, getUserQuota } from '@/api/auth'
import { extractHistoryList, normalizeHistoryPayload } from '@/utils/chatHistory'

/**
 * 生成稳定的会话 ID（UUID v4）。
 *
 * crypto.randomUUID() 只在安全上下文（HTTPS 或 localhost）可用；在局域网 HTTP 访问时它是
 * undefined，直接调用会抛错，导致新建会话拿不到 id、首条消息 sessionId 为空，后端便会为每条
 * 消息各建一个 session。这里优先用 randomUUID，不可用时退回 getRandomValues，再不行退回 Math.random，
 * 保证任何环境都能拿到一个合法 UUID。
 */
function genId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const b = crypto.getRandomValues(new Uint8Array(16))
      b[6] = (b[6] & 0x0f) | 0x40
      b[8] = (b[8] & 0x3f) | 0x80
      const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('')
      return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
    }
  } catch { /* 退回到 Math.random 兜底 */ }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export const useChat = defineStore('chat', () => {
  const chats = ref([])
  const currentChatId = ref(null)
  const loading = ref(false)
  const memory = ref({})

  const isLoggedIn = ref(false)
  const currentUser = ref(null)
  const userId = ref(null)
  const username = ref('')
  const userEmail = ref('')
  const userPhone = ref('')
  const userAvatar = ref('')
  const userRole = ref('GUEST')
  const identity = ref('GUEST')
  const identityLabel = ref('')
  const availableModels = ref([])
  const quotaSnapshot = ref({ daily: null, monthly: null })
  const quotaLoading = ref(false)
  const quotaError = ref('')

  const initFromLocalStorage = () => {
    const savedIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    const savedUserInfo = localStorage.getItem('userInfo')

    if (!savedIsLoggedIn || !savedUserInfo) return

    try {
      login(JSON.parse(savedUserInfo))
    } catch (error) {
      console.error('恢复用户信息失败:', error)
      logout()
    }
  }

  const login = (userInfo = {}) => {
    isLoggedIn.value = true
    currentUser.value = userInfo
    userId.value = userInfo.userId
    username.value = userInfo.username || userInfo.nickname || ''
    userEmail.value = userInfo.email || ''
    userPhone.value = userInfo.phone || ''
    userAvatar.value = userInfo.avatar || userInfo.avatarUrl || localStorage.getItem('userAvatar') || ''
    userRole.value = userInfo.userRole || 'GUEST'
    identity.value = userInfo.identity || userInfo.userRole || 'GUEST'
    identityLabel.value = userInfo.identityLabel || ''
    availableModels.value = userInfo.availableModels || []
    quotaSnapshot.value = userInfo.quota || {
      daily: userInfo.dailyQuota || null,
      monthly: userInfo.monthlyQuota || null
    }
    quotaError.value = ''

    localStorage.setItem('isLoggedIn', 'true')
    if (userInfo.userId) localStorage.setItem('userId', userInfo.userId)
    if (userInfo.username) localStorage.setItem('username', userInfo.username)
    // 持久化后端签发的 JWT：之后所有用户态请求都靠它走 Authorization: Bearer 鉴权，
    // 不再依赖可被前端伪造的 X-User-Id（后端默认已不信任该头）。
    if (userInfo.token) localStorage.setItem('authToken', userInfo.token)
    localStorage.setItem('userInfo', JSON.stringify(userInfo))
  }

  const logout = () => {
    isLoggedIn.value = false
    currentUser.value = null
    userId.value = null
    username.value = ''
    userEmail.value = ''
    userPhone.value = ''
    userAvatar.value = ''
    userRole.value = 'GUEST'
    identity.value = 'GUEST'
    identityLabel.value = ''
    availableModels.value = []
    quotaSnapshot.value = { daily: null, monthly: null }
    quotaLoading.value = false
    quotaError.value = ''

    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('rememberMe')
    localStorage.removeItem('userAvatar')
    localStorage.removeItem('authToken')

    chats.value = []
    currentChatId.value = null
  }

  const updateUserInfo = (userInfo = {}) => {
    if (!isLoggedIn.value) return

    currentUser.value = { ...currentUser.value, ...userInfo }
    if (userInfo.email !== undefined) userEmail.value = userInfo.email
    if (userInfo.phone !== undefined) userPhone.value = userInfo.phone
    if (userInfo.avatar !== undefined || userInfo.avatarUrl !== undefined) {
      userAvatar.value = userInfo.avatar || userInfo.avatarUrl || ''
      if (userAvatar.value) {
        localStorage.setItem('userAvatar', userAvatar.value)
      } else {
        localStorage.removeItem('userAvatar')
      }
    }
    localStorage.setItem('userInfo', JSON.stringify(currentUser.value))
  }

  const refreshCurrentUser = async (uid = userId.value) => {
    if (!uid || uid === 'guest') return currentUser.value
    const user = await getUserInfo(uid)
    updateUserInfo(user)
    return user
  }

  // 头像下拉和用户中心统一读取这里的日/月标准 token 额度。
  const loadUserQuota = async (uid = userId.value, workspaceId = '') => {
    if (!uid) {
      quotaSnapshot.value = { daily: null, monthly: null }
      return quotaSnapshot.value
    }

    quotaLoading.value = true
    quotaError.value = ''
    try {
      const quota = await getUserQuota(uid, workspaceId)
      quotaSnapshot.value = {
        daily: quota?.daily || null,
        monthly: quota?.monthly || null
      }
      return quotaSnapshot.value
    } catch (err) {
      quotaError.value = err?.message || '额度加载失败'
      throw err
    } finally {
      quotaLoading.value = false
    }
  }

  const loadSessionHistory = async (sessionId) => {
    try {
      const history = await getSessionChatHistory(sessionId)
      const chat = chats.value.find(c => c.id === sessionId)
      if (!chat) return

      chat.messages = normalizeHistoryPayload(history)
      chat.historyLoaded = true
      chat.historyError = ''
    } catch (err) {
      const chat = chats.value.find(c => c.id === sessionId)
      if (chat) {
        chat.historyLoaded = false
        chat.historyError = err?.response?.data?.message || err?.message || 'history load failed'
      }
      console.error('加载对话历史失败:', err)
    }
  }

  const loadUserSessions = async (uid) => {
    try {
      const sessions = await getUserSessions(uid)
      const sorted = extractHistoryList(sessions).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      chats.value = sorted.map(s => ({
        id: s.sessionId,
        title: s.sessionName || s.title || '未命名对话',
        messages: [],
        createdAt: s.createdAt,
        historyLoaded: false,
        historyError: ''
      }))

      if (chats.value.length > 0) {
        currentChatId.value = chats.value[0].id
        await loadSessionHistory(chats.value[0].id)
      }
    } catch (err) {
      console.error('加载会话列表失败:', err)
    }
  }

  const createNewChat = (customTitle = null) => {
    const newChat = {
      id: genId(),
      title: customTitle || '新对话',
      messages: [],
      createdAt: new Date(),
      memory: []
    }
    chats.value.unshift(newChat)
    currentChatId.value = newChat.id
    return newChat
  }

  /**
   * 确保当前存在一个会话并返回其 id；没有则新建一个。
   *
   * 发送消息前调用它，保证首条消息就带上稳定的 sessionId，
   * 后续消息复用同一个 id，避免后端为每条消息各建一个 session。
   */
  const ensureCurrentChatId = () => {
    const id = typeof currentChatId.value === 'string' ? currentChatId.value : ''
    if (id) return id
    return createNewChat().id
  }

  const selectChat = (chatId) => {
    currentChatId.value = chatId
  }

  const addMessage = (chatId, message) => {
    const chat = chats.value.find(c => c.id === chatId)
    if (!chat) return

    chat.messages.push(message)
    if (chat.messages.filter(m => m.role === 'user').length === 1) {
      chat.title = message.content?.substring(0, 30) || '新对话'
    }
  }

  const sendMessage = async (chatId, userMessage) => {
    const chat = chats.value.find(c => c.id === chatId)
    if (!chat) return

    loading.value = true
    try {
      // 先把用户输入落到会话里。
      addMessage(chatId, { role: 'user', content: userMessage, timestamp: Date.now() })
      // 真实对话走 api/chat.js 的流式接口（persistentStreamChat）。
      // store 内这条非流式入口属于早期占位，未接入模型调用，统一抛错走下方降级提示。
      throw new Error('AI API 未接入：请改用流式聊天接口 persistentStreamChat')
    } catch (error) {
      console.error('发送消息失败:', error)
      addMessage(chatId, {
        role: 'assistant',
        content: '后端服务未连接，请确认服务地址和 API 配置。',
        isError: true,
        timestamp: Date.now()
      })
    } finally {
      loading.value = false
    }
  }

  const deleteChat = (chatId) => {
    const index = chats.value.findIndex(c => c.id === chatId)
    if (index === -1) return

    chats.value.splice(index, 1)
    if (currentChatId.value === chatId) {
      currentChatId.value = chats.value[0]?.id || null
    }
  }

  const togglePin = (chatId) => {
    const chat = chats.value.find(c => c.id === chatId)
    if (!chat) return

    chat.pinned = !chat.pinned
    chats.value = [
      ...chats.value.filter(c => c.pinned),
      ...chats.value.filter(c => !c.pinned)
    ]
  }

  const getHistory = (chatId) => {
    const chat = chats.value.find(c => c.id === chatId)
    return chat ? chat.messages : []
  }

  const getMemory = (chatId) => {
    const chat = chats.value.find(c => c.id === chatId)
    return chat ? chat.memory : []
  }

  return {
    chats,
    currentChatId,
    loading,
    memory,
    createNewChat,
    ensureCurrentChatId,
    selectChat,
    addMessage,
    sendMessage,
    deleteChat,
    togglePin,
    getHistory,
    getMemory,
    isLoggedIn,
    currentUser,
    userId,
    username,
    userEmail,
    userPhone,
    userAvatar,
    userRole,
    identity,
    identityLabel,
    availableModels,
    quotaSnapshot,
    quotaLoading,
    quotaError,
    login,
    logout,
    updateUserInfo,
    refreshCurrentUser,
    initFromLocalStorage,
    loadUserSessions,
    loadSessionHistory,
    loadUserQuota
  }
})
