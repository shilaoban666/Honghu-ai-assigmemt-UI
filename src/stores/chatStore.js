import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserSessions, getSessionChatHistory } from '@/api/chat'

export const useChat = defineStore('chat', () => {
  const chats = ref([])
  const currentChatId = ref(null)
  const loading = ref(false)
  const memory = ref({}) // 记忆存储

  // 用户认证相关状态
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

  // 从localStorage恢复登录状态
  const initFromLocalStorage = () => {
    const savedIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    const savedUserInfo = localStorage.getItem('userInfo')
    
    if (savedIsLoggedIn && savedUserInfo) {
      try {
        const userInfo = JSON.parse(savedUserInfo)
        login(userInfo)
      } catch (error) {
        console.error('恢复用户信息失败:', error)
        logout()
      }
    }
  }

  // 登录
  const login = (userInfo) => {
    isLoggedIn.value = true
    currentUser.value = userInfo
    userId.value = userInfo.userId
    username.value = userInfo.username
    userEmail.value = userInfo.email || ''
    userPhone.value = userInfo.phone || ''
    userAvatar.value = userInfo.avatar || ''
    userRole.value = userInfo.userRole || 'GUEST'
    identity.value = userInfo.identity || userInfo.userRole || 'GUEST'
    identityLabel.value = userInfo.identityLabel || ''
    availableModels.value = userInfo.availableModels || []

    // 保存到localStorage
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('userId', userInfo.userId)
    localStorage.setItem('username', userInfo.username)
    localStorage.setItem('userInfo', JSON.stringify(userInfo))
  }

  // 登出
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

    // 清除localStorage
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('rememberMe')

    // 清除所有对话
    chats.value = []
    currentChatId.value = null
  }

  // 更新用户信息
  const updateUserInfo = (userInfo) => {
    if (isLoggedIn.value) {
      currentUser.value = { ...currentUser.value, ...userInfo }
      if (userInfo.email) userEmail.value = userInfo.email
      if (userInfo.phone) userPhone.value = userInfo.phone
      if (userInfo.avatar) userAvatar.value = userInfo.avatar
      localStorage.setItem('userInfo', JSON.stringify(currentUser.value))
    }
  }

  // 加载指定会话的聊天历史
  const loadSessionHistory = async (sessionId) => {
    try {
      const history = await getSessionChatHistory(sessionId)
      const chat = chats.value.find(c => c.id === sessionId)
      if (chat) {
        const sorted = [...history].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        chat.messages = sorted.map(m => ({
          role: m.chatRole,
          content: m.content,
          timestamp: new Date(m.createdAt).getTime()
        }))
      }
    } catch (err) {
      console.error('加载对话历史失败:', err)
    }
  }

  // 加载用户所有会话并初始化最新会话的消息
  const loadUserSessions = async (uid) => {
    try {
      const sessions = await getUserSessions(uid)
      const sorted = [...sessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      chats.value = sorted.map(s => ({
        id: s.sessionId,
        title: s.sessionName || s.title || '未命名对话',
        messages: [],
        createdAt: s.createdAt
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
      id: Date.now(),
      title: customTitle || '新对话',
      messages: [],
      createdAt: new Date(),
      memory: [] // 对话记忆
    }
    chats.value.unshift(newChat)
    currentChatId.value = newChat.id
    return newChat
  }

  const selectChat = (chatId) => {
    currentChatId.value = chatId
  }

  const addMessage = (chatId, message) => {
    const chat = chats.value.find(c => c.id === chatId)
    if (chat) {
      chat.messages.push(message)
      // 更新标题（如果是第一条用户消息）
      if (chat.messages.filter(m => m.role === 'user').length === 1) {
        chat.title = message.content.substring(0, 30) || '新对话'
      }
    }
  }

  const sendMessage = async (chatId, userMessage) => {
    const chat = chats.value.find(c => c.id === chatId)
    if (!chat) return

    loading.value = true
    try {
      // 获取上下文消息
      const contextMessages = chat.messages.slice(-10) // 最近10条消息

      // 调用AI API
      const response = await callAIAPI({
        message: userMessage,
        history: contextMessages,
        memory: chat.memory
      })

      // 添加AI响应
      addMessage(chatId, {
        role: 'assistant',
        content: response.content,
        timestamp: Date.now()
      })

      // 更新记忆
      if (response.memory) {
        chat.memory = response.memory
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      // 显示更友好的错误信息，而不是中断UI
      addMessage(chatId, {
        role: 'assistant',
        content: '⚠️ 后端服务未连接\n\n如果你已启动后端服务，请检查：\n1. 后端服务是否运行在 http://localhost:3000\n2. API 端点是否为 /api/chat\n3. 后端是否设置了 CORS 跨域请求支持\n\n你仍然可以输入消息测试前端UI，但需要后端才能获取真实的AI回复。',
        isError: true,
        timestamp: Date.now()
      })
    } finally {
      loading.value = false
    }
  }

  const deleteChat = (chatId) => {
    const index = chats.value.findIndex(c => c.id === chatId)
    if (index !== -1) {
      chats.value.splice(index, 1)
      if (currentChatId.value === chatId) {
        currentChatId.value = chats.value[0]?.id || null
      }
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
    // 聊天相关
    chats,
    currentChatId,
    loading,
    memory,
    createNewChat,
    selectChat,
    addMessage,
    sendMessage,
    deleteChat,
    togglePin,
    getHistory,
    getMemory,
    // 用户认证相关
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
    login,
    logout,
    updateUserInfo,
    initFromLocalStorage,
    loadUserSessions,
    loadSessionHistory
  }
})
