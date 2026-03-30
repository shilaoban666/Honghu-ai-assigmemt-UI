<template>
  <div class="app-container">
    <!-- 登录/注册/忘记密码界面 -->
    <template v-if="showAuthPage">
      <!-- 登录界面 -->
      <Login 
        v-if="currentAuthPage === 'login'"
        @login="handleLogin" 
        @forgot-password="showForgotPasswordPage"
        @register="showRegisterPage"
        @skip="skipLogin"
      />
      
      <!-- 忘记密码界面 -->
      <ForgotPassword 
        v-else-if="currentAuthPage === 'forgot'"
        @back="showLoginPage"
        @to-register="showRegisterPage"
      />
      
      <!-- 注册界面 -->
      <Register 
        v-else-if="currentAuthPage === 'register'"
        @back="showLoginPage"
        @register-success="handleRegisterSuccess"
      />
    </template>

    <!-- 错误边界 -->
    <div v-else-if="hasError" class="error-boundary">
      <div class="error-content">
        <h1>⚠️ 应用出错</h1>
        <p>{{ errorMessage }}</p>
        <button @click="resetError">重新加载</button>
      </div>
    </div>

    <!-- 聊天界面 -->
    <template v-else>
      <!-- 手机端遮罩层 -->
      <div 
        v-if="mobileMenuOpen" 
        class="mobile-overlay" 
        @click="mobileMenuOpen = false"
      />

      <!-- 左侧边栏 -->
      <Sidebar 
        @new-chat="startNewChat" 
        @select-chat="selectChat" 
        :chats="chatStore.chats" 
        :currentChatId="chatStore.currentChatId"
        :collapsed="sidebarCollapsed"
        :mobileOpen="mobileMenuOpen"
        :sidebarWidth="sidebarWidth"
        @toggle-sidebar="toggleSidebar"
        @open-settings="showSettings = true"
        @mobile-close="mobileMenuOpen = false"
        @update:sidebarWidth="w => sidebarWidth = w"
      />

      <!-- 右侧主区域 -->
      <div class="main-wrapper">
        <!-- 头部 -->
        <Header :currentChat="currentChat" @toggle-sidebar="toggleSidebar" @open-profile="showProfile = true" @open-settings="showSettings = true" @logout="handleLogout" @show-login="showAuthLogin" @show-register="showAuthRegister" />

        <!-- 聊天内容 -->
        <ChatArea :messages="currentChat?.messages || []" :loading="chatStore.loading" @quick-start="quickStartChat" />

        <!-- 输入区域 -->
        <InputArea @send-message="sendMessage" :loading="chatStore.loading" />
      </div>

      <!-- 设置面板 -->
      <SettingsPanel
        :visible="showSettings"
        @close="showSettings = false"
        @theme-change="applyTheme"
        @language-change="changeLanguage"
        @dark-mode-change="applyDarkMode"
        @sound-change="changeSoundSetting"
      />

      <!-- 账户信息面板 -->
      <ProfilePanel
        :visible="showProfile"
        :isLoggedIn="isLoggedIn"
        :currentUser="currentUser"
        @close="showProfile = false"
        @logout="handleLogout"
        @login="handleProfileLogin"
        @show-register="handleProfileRegister"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useChat } from '@/stores/chatStore'
import { initTheme, applyTheme as applyThemeUtil, getTheme } from '@/utils/theme'
import { getLanguage } from '@/utils/i18n'
import Login from '@/components/Login.vue'
import ForgotPassword from '@/components/ForgotPassword.vue'
import Register from '@/components/Register.vue'
import Sidebar from '@/components/Sidebar.vue'
import Header from '@/components/Header.vue'
import ChatArea from '@/components/ChatArea.vue'
import InputArea from '@/components/InputArea.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'
import ProfilePanel from '@/components/ProfilePanel.vue'

const chatStore = useChat()
const hasError = ref(false)
const errorMessage = ref('')
const sidebarCollapsed = ref(false)
const sidebarWidth = ref(260)
const mobileMenuOpen = ref(false)
const showSettings = ref(false)
const showProfile = ref(false)
const currentLanguage = ref('zh')
const currentAuthPage = ref('login')  // 'login' | 'forgot' | 'register'
const showAuthPage = ref(false) // 默认不显示登录页，直接进入主界面

// 从chatStore获取登录状态
const isLoggedIn = computed(() => chatStore.isLoggedIn)
const currentUser = computed(() => chatStore.currentUser)

const currentChat = computed(() => {
  return chatStore.chats.find(chat => chat.id === chatStore.currentChatId)
})

const resetError = () => {
  hasError.value = false
  errorMessage.value = ''
}

const handleLogin = (loginData) => {
  // 使用chatStore的login方法，然后刷新页面以加载会话数据
  chatStore.login(loginData)
  console.log('用户登录成功:', loginData)
  showAuthPage.value = false
  window.location.reload()
}

const skipLogin = () => {
  showAuthPage.value = false
}

const handleLogout = () => {
  // 使用chatStore的logout方法
  chatStore.logout()
  currentAuthPage.value = 'login'
  showAuthPage.value = true
  showProfile.value = false
  console.log('用户已登出')
}

const showLoginPage = () => {
  currentAuthPage.value = 'login'
}

const showRegisterPage = () => {
  currentAuthPage.value = 'register'
}

const showAuthLogin = () => {
  currentAuthPage.value = 'login'
  showAuthPage.value = true
}

const showAuthRegister = () => {
  currentAuthPage.value = 'register'
  showAuthPage.value = true
}

const handleProfileLogin = () => {
  showAuthLogin()
  showProfile.value = false
}

const handleProfileRegister = () => {
  showRegisterPage()
  showProfile.value = false
}

const showForgotPasswordPage = () => {
  currentAuthPage.value = 'forgot'
}

const handleRegisterSuccess = () => {
  // 注册成功后返回登录页
  currentAuthPage.value = 'login'
}

const startNewChat = () => {
  try {
    chatStore.createNewChat()
  } catch (error) {
    console.error('创建新对话失败:', error)
    hasError.value = true
    errorMessage.value = '创建新对话失败: ' + error.message
  }
}

const quickStartChat = (title) => {
  try {
    chatStore.createNewChat(title)
  } catch (error) {
    console.error('创建新对话失败:', error)
    hasError.value = true
    errorMessage.value = '创建新对话失败: ' + error.message
  }
}

const selectChat = async (chatId) => {
  try {
    chatStore.selectChat(chatId)
    // 若该会话消息尚未加载，则从API拉取
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
    console.log('接收到消息数据:', messageData)
    
    if (!currentChat.value) {
      chatStore.createNewChat()
    }

    const chatId = currentChat.value.id
    const content = typeof messageData === 'string'
      ? messageData
      : messageData.content

    // 处理用户消息
    if (messageData.isUserMessage) {
      console.log('添加用户消息:', content)
      chatStore.addMessage(chatId, {
        role: 'user',
        content: content,
        timestamp: Date.now()
      })
    } else if (messageData.isStreaming === true) {
      // 处理流式数据（来自 ChatResponse）
      console.log('接收流式数据:', content, 'isInitialMessage:', messageData.isInitialMessage)
      const messages = currentChat.value.messages
      
      // 检查是否已有 AI 消息在流式中
      let aiMessage = messages.find(m => m.role === 'assistant' && m.isStreaming)
      
      if (!aiMessage) {
        // 创建新的 AI 消息
        aiMessage = {
          role: 'assistant',
          content: content,
          timestamp: Date.now(),
          isStreaming: true,
          hasStartedStreaming: messageData.isInitialMessage ? false : true,  // 初始消息不标记为已开始
          model: messageData.model || 'deepseek-r1:8b'
        }
        chatStore.addMessage(chatId, aiMessage)
      } else {
        // 追加到现有 AI 消息
        aiMessage.content += content
        // 只要有实际内容，就标记为已开始接收
        if (content && !messageData.isInitialMessage) {
          aiMessage.hasStartedStreaming = true
        }
      }
    } else if (messageData.isStreaming === false || messageData.isStreaming === undefined) {
      // 流式完成或单次响应
      console.log('流式完成或单次响应:', content)
      const messages = currentChat.value.messages
      
      // 查找流式中的 AI 消息
      let aiMessage = messages.find(m => m.role === 'assistant' && m.isStreaming)
      
      if (aiMessage) {
        // 更新现有 AI 消息
        aiMessage.isStreaming = false
        aiMessage.completed = true
        if (messageData.timestamp) {
          aiMessage.completedAt = messageData.timestamp
        }
      } else if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
        // 更新最后一条 AI 消息（如果存在）
        messages[messages.length - 1].isStreaming = false
        messages[messages.length - 1].completed = true
      } else {
        // 创建新的完整 AI 消息
        chatStore.addMessage(chatId, {
          role: 'assistant',
          content: content,
          timestamp: Date.now(),
          isStreaming: false,
          completed: true
        })
      }
    } else if (messageData.isError) {
      // 错误处理
      console.error('收到错误消息:', content)
      chatStore.addMessage(chatId, {
        role: 'system',
        content: content,
        timestamp: Date.now()
      })
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    hasError.value = true
    errorMessage.value = '发送消息失败: ' + error.message
  }
}

// 页面加载时恢复登录状态并加载会话数据
onMounted(async () => {
  try {
    // 恢复登录状态
    chatStore.initFromLocalStorage()
    
    // 初始化主题
    const savedTheme = getTheme()
    document.documentElement.setAttribute('data-theme', savedTheme)
    initTheme()
    
    // 初始化语言
    const savedLanguage = getLanguage()
    currentLanguage.value = savedLanguage
    document.documentElement.setAttribute('data-language', savedLanguage)
    
    // 初始化暗黑模式 (根据 themeMode 设置)
    const savedThemeMode = localStorage.getItem('themeMode') || 'light'
    if (savedThemeMode === 'dark') {
      document.documentElement.classList.add('dark-mode')
    } else if (savedThemeMode === 'auto') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark-mode')
      }
    }
    
    // 初始化字体大小和消息样式
    const savedFontSize = localStorage.getItem('fontSize') || 'default'
    document.documentElement.setAttribute('data-font-size', savedFontSize)
    const savedBubbleStyle = localStorage.getItem('bubbleStyle') || 'bubble'
    document.documentElement.setAttribute('data-bubble-style', savedBubbleStyle)
    
    // 已登录时从API加载会话列表（含最新会话历史）
    if (isLoggedIn.value && chatStore.userId) {
      await chatStore.loadUserSessions(chatStore.userId)
    }
    console.log('App 组件已挂载成功，登录状态:', isLoggedIn.value)
  } catch (error) {
    console.error('App 挂载失败:', error)
    hasError.value = true
    errorMessage.value = '应用初始化失败: ' + error.message
  }
})

const toggleSidebar = () => {
  // 手机端：切换 drawer 展开/收起；桌面端：收缩到图标模式
  if (window.innerWidth <= 768) {
    mobileMenuOpen.value = !mobileMenuOpen.value
  } else {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
}

const applyTheme = (themeId) => {
  console.log('应用主题:', themeId)
  
  // 设置 data-theme 属性，这样 CSS 变量就会跟着改变
  document.documentElement.setAttribute('data-theme', themeId)
  
  // 也调用 theme.js 中的函数以保存设置
  applyThemeUtil(themeId)
}

const changeLanguage = (lang) => {
  currentLanguage.value = lang
  console.log('切换语言至:', lang)
  // 触发 UI 更新
  document.documentElement.setAttribute('data-language', lang)
}

const applyDarkMode = (isDark) => {
  console.log('设置暗黑模式:', isDark)
  const root = document.documentElement
  
  if (isDark) {
    root.classList.add('dark-mode')
    localStorage.setItem('darkMode', 'true')
  } else {
    root.classList.remove('dark-mode')
    localStorage.setItem('darkMode', 'false')
    // 重新应用当前主题确保 CSS 变量正确
    const currentTheme = localStorage.getItem('theme') || 'green'
    applyThemeUtil(currentTheme)
  }
}

const changeSoundSetting = (enabled) => {
  console.log('声音设置:', enabled)
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

/* ── 手机端适配 ──────────────────────────────── */
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
  transition: background 0.3s;
}

.error-content button:hover {
  background: #1565c0;
}
</style>
