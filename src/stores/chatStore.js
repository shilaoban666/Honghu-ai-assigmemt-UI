import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { callAIAPI } from '@/api/chat'

export const useChat = defineStore('chat', () => {
  const chats = ref([])
  const currentChatId = ref(null)
  const loading = ref(false)
  const memory = ref({}) // 记忆存储

  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: '新对话',
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
    selectChat,
    addMessage,
    sendMessage,
    deleteChat,
    getHistory,
    getMemory
  }
})
