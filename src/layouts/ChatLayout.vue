<template>
  <div class="app-container">
    <template v-if="showAuthPage">
      <Login
        v-if="currentAuthPage === 'login'"
        @login="handleLogin"
        @forgot-password="currentAuthPage = 'forgot'"
        @register="currentAuthPage = 'register'"
        @skip="skipLogin"
      />
      <ForgotPassword
        v-else-if="currentAuthPage === 'forgot'"
        @back="currentAuthPage = 'login'"
        @to-register="currentAuthPage = 'register'"
      />
      <Register
        v-else
        @back="currentAuthPage = 'login'"
        @register-success="currentAuthPage = 'login'"
      />
    </template>

    <div v-else-if="hasError" class="error-boundary">
      <div class="error-content">
        <h1>应用出错</h1>
        <p>{{ errorMessage }}</p>
        <button @click="resetError">重新加载</button>
      </div>
    </div>

    <template v-else>
      <div v-if="mobileMenuOpen" class="mobile-overlay" @click="mobileMenuOpen = false" />

      <Sidebar
        :chats="chatStore.chats"
        :currentChatId="chatStore.currentChatId"
        :collapsed="sidebarCollapsed"
        :mobileOpen="mobileMenuOpen"
        :sidebarWidth="sidebarWidth"
        @new-chat="startNewChat"
        @select-chat="selectChat"
        @toggle-sidebar="toggleSidebar"
        @open-settings="goSettings('general/appearance')"
        @mobile-close="mobileMenuOpen = false"
        @update:sidebarWidth="w => sidebarWidth = w"
        @open-skill-plaza="() => {}"
        @open-mcp-plaza="() => {}"
        @open-agent-plaza="() => {}"
        @open-deep-research="() => {}"
      />

      <div class="main-wrapper">
        <Header
          :currentChat="currentChat"
          @toggle-sidebar="toggleSidebar"
          @open-profile="goSettings('general/profile')"
          @open-settings="goSettings('general/appearance')"
          @logout="handleLogout"
          @show-login="showAuthLogin"
          @show-register="showAuthRegister"
        />

        <ChatArea
          :messages="currentChat?.messages || []"
          :loading="chatStore.loading"
          @quick-start="quickStartChat"
        />

        <InputArea :loading="chatStore.loading" @send-message="sendMessage" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useChat } from '@/stores/chatStore'
import { loginAsGuest } from '@/api/auth'
import Login from '@/components/Login.vue'
import ForgotPassword from '@/components/ForgotPassword.vue'
import Register from '@/components/Register.vue'
import Sidebar from '@/components/Sidebar.vue'
import Header from '@/components/Header.vue'
import ChatArea from '@/components/ChatArea.vue'
import InputArea from '@/components/InputArea.vue'

const router = useRouter()
const chatStore = useChat()

const hasError = ref(false)
const errorMessage = ref('')
const sidebarCollapsed = ref(false)
const sidebarWidth = ref(260)
const mobileMenuOpen = ref(false)
const currentAuthPage = ref('login')
const showAuthPage = ref(false)

const currentChat = computed(() => chatStore.chats.find(chat => chat.id === chatStore.currentChatId))

const resetError = () => {
  hasError.value = false
  errorMessage.value = ''
}

const goSettings = (target = 'general/appearance') => {
  router.push(`/settings/${target}`)
}

const handleLogin = async (loginData) => {
  chatStore.login(loginData)
  showAuthPage.value = false
  if (loginData.userId) {
    await chatStore.loadUserSessions(loginData.userId)
    await chatStore.loadUserQuota(loginData.userId).catch(error => {
      console.warn('用户额度快照加载失败:', error)
    })
  }
}

const skipLogin = async () => {
  try {
    const r = await loginAsGuest()
    chatStore.login({
      userId: r.userId || 'guest',
      username: r.username || 'Guest',
      nickname: r.nickname || 'Guest',
      userRole: r.userRole || 'GUEST',
      identity: r.identity || 'GUEST',
      identityLabel: r.identityLabel || '',
      availableModels: r.availableModels || []
    })
    await chatStore.loadUserQuota(chatStore.userId).catch(() => {})
  } catch {
    chatStore.login({
      userId: 'guest',
      username: 'Guest',
      nickname: 'Guest',
      userRole: 'GUEST',
      identity: 'GUEST',
      availableModels: []
    })
  }
  showAuthPage.value = false
}

const handleLogout = () => {
  chatStore.logout()
  currentAuthPage.value = 'login'
  showAuthPage.value = true
}

const showAuthLogin = () => {
  currentAuthPage.value = 'login'
  showAuthPage.value = true
}

const showAuthRegister = () => {
  currentAuthPage.value = 'register'
  showAuthPage.value = true
}

const startNewChat = () => {
  try {
    chatStore.createNewChat()
  } catch (error) {
    hasError.value = true
    errorMessage.value = `创建新对话失败: ${error.message}`
  }
}

const quickStartChat = (title) => {
  try {
    chatStore.createNewChat(title)
  } catch (error) {
    hasError.value = true
    errorMessage.value = `创建新对话失败: ${error.message}`
  }
}

const selectChat = async (chatId) => {
  try {
    chatStore.selectChat(chatId)
    const chat = chatStore.chats.find(c => c.id === chatId)
    if (chat && chat.messages.length === 0) {
      await chatStore.loadSessionHistory(chatId)
    }
  } catch (error) {
    console.error('选择对话失败:', error)
  }
}

const sendMessage = async (messageData) => {
  try {
    if (!currentChat.value) {
      chatStore.createNewChat()
    }

    const chatId = currentChat.value.id
    const content = typeof messageData === 'string' ? messageData : messageData.content

    if (messageData.isUserMessage) {
      chatStore.addMessage(chatId, {
        role: 'user',
        content,
        timestamp: Date.now(),
        files: messageData.files || []
      })
      return
    }

    if (messageData.isStreaming === true) {
      const messages = currentChat.value.messages
      let aiMessage = messages.find(m => m.role === 'assistant' && m.isStreaming)
      if (!aiMessage) {
        aiMessage = {
          role: 'assistant',
          content,
          timestamp: Date.now(),
          isStreaming: true,
          hasStartedStreaming: messageData.isInitialMessage ? false : true,
          model: messageData.model || 'deepseek-r1:8b'
        }
        chatStore.addMessage(chatId, aiMessage)
      } else {
        aiMessage.content += content
        if (content && !messageData.isInitialMessage) aiMessage.hasStartedStreaming = true
      }
      return
    }

    if (messageData.isStreaming === false || messageData.isStreaming === undefined) {
      const messages = currentChat.value.messages
      const aiMessage = messages.find(m => m.role === 'assistant' && m.isStreaming)
      if (aiMessage) {
        aiMessage.isStreaming = false
        aiMessage.completed = true
        if (messageData.timestamp) aiMessage.completedAt = messageData.timestamp
      } else if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
        messages[messages.length - 1].isStreaming = false
        messages[messages.length - 1].completed = true
      } else if (content) {
        chatStore.addMessage(chatId, {
          role: 'assistant',
          content,
          timestamp: Date.now(),
          isStreaming: false,
          completed: true
        })
      }
      await chatStore.loadUserQuota(chatStore.userId).catch(() => {})
      return
    }

    if (messageData.isError) {
      chatStore.addMessage(chatId, {
        role: 'system',
        content,
        timestamp: Date.now()
      })
    }
  } catch (error) {
    hasError.value = true
    errorMessage.value = `发送消息失败: ${error.message}`
  }
}

const toggleSidebar = () => {
  if (window.innerWidth <= 768) {
    mobileMenuOpen.value = !mobileMenuOpen.value
  } else {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
}

.main-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.mobile-overlay {
  display: none;
}

.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f8f8f8;
}

.error-content {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.error-content h1 {
  color: #d32f2f;
  margin-bottom: 16px;
  font-size: 24px;
}

.error-content p {
  color: #666;
  margin-bottom: 24px;
  word-break: break-all;
  max-width: 500px;
  font-size: 14px;
}

.error-content button {
  padding: 10px 24px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

@media (max-width: 768px) {
  .app-container {
    position: relative;
  }

  .mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 40;
    backdrop-filter: blur(2px);
  }
}
</style>
