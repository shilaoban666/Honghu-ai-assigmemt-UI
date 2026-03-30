import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChat } from '@/stores/chatStore'

describe('chatStore', () => {
  let store
  let dateNowCounter = 1000

  beforeEach(() => {
    localStorage.clear()
    // Mock Date.now() 以避免同毫秒 ID 冲突
    dateNowCounter = 1000
    vi.spyOn(Date, 'now').mockImplementation(() => ++dateNowCounter)
    setActivePinia(createPinia())
    store = useChat()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('初始状态', () => {
    it('初始状态应为未登录', () => {
      expect(store.isLoggedIn).toBe(false)
      expect(store.currentUser).toBeNull()
      expect(store.userId).toBeNull()
    })

    it('初始无对话', () => {
      expect(store.chats).toHaveLength(0)
      expect(store.currentChatId).toBeNull()
      expect(store.loading).toBe(false)
    })
  })

  describe('login / logout', () => {
    const mockUser = {
      userId: 'u123',
      username: 'testuser',
      email: 'test@example.com',
      phone: '13800138000',
      avatar: 'https://example.com/avatar.png'
    }

    it('登录后应设置用户信息', () => {
      store.login(mockUser)
      expect(store.isLoggedIn).toBe(true)
      expect(store.userId).toBe('u123')
      expect(store.username).toBe('testuser')
      expect(store.userEmail).toBe('test@example.com')
    })

    it('登录后应保存到 localStorage', () => {
      store.login(mockUser)
      expect(localStorage.getItem('isLoggedIn')).toBe('true')
      expect(localStorage.getItem('userId')).toBe('u123')
      expect(JSON.parse(localStorage.getItem('userInfo')).username).toBe('testuser')
    })

    it('登出后应清空用户信息', () => {
      store.login(mockUser)
      store.logout()
      expect(store.isLoggedIn).toBe(false)
      expect(store.userId).toBeNull()
      expect(store.username).toBe('')
      expect(localStorage.getItem('isLoggedIn')).toBeNull()
    })

    it('登出后应清空对话', () => {
      store.login(mockUser)
      store.createNewChat()
      store.logout()
      expect(store.chats).toHaveLength(0)
      expect(store.currentChatId).toBeNull()
    })
  })

  describe('initFromLocalStorage', () => {
    it('有保存的登录状态时应恢复', () => {
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('userInfo', JSON.stringify({ userId: 'u1', username: 'saved' }))
      store.initFromLocalStorage()
      expect(store.isLoggedIn).toBe(true)
      expect(store.username).toBe('saved')
    })

    it('无保存状态时不应登录', () => {
      store.initFromLocalStorage()
      expect(store.isLoggedIn).toBe(false)
    })

    it('损坏的 JSON 不应崩溃', () => {
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('userInfo', '{invalid json')
      store.initFromLocalStorage()
      // 解析失败后应调用 logout，所以不应处于登录状态
      expect(store.isLoggedIn).toBe(false)
    })
  })

  describe('updateUserInfo', () => {
    it('已登录时应更新用户信息', () => {
      store.login({ userId: 'u1', username: 'test' })
      store.updateUserInfo({ email: 'new@test.com' })
      expect(store.userEmail).toBe('new@test.com')
    })

    it('未登录时不应操作', () => {
      store.updateUserInfo({ email: 'new@test.com' })
      expect(store.userEmail).toBe('')
    })
  })

  describe('createNewChat', () => {
    it('应创建对话并设为当前', () => {
      const chat = store.createNewChat()
      expect(store.chats).toHaveLength(1)
      expect(store.currentChatId).toBe(chat.id)
      expect(chat.title).toBe('新对话')
      expect(chat.messages).toHaveLength(0)
    })

    it('应支持自定义标题', () => {
      const chat = store.createNewChat('测试对话')
      expect(chat.title).toBe('测试对话')
    })

    it('新对话应插入到列表最前面', () => {
      store.createNewChat('第一个')
      store.createNewChat('第二个')
      expect(store.chats[0].title).toBe('第二个')
    })
  })

  describe('selectChat', () => {
    it('应切换当前对话', () => {
      const c1 = store.createNewChat('A')
      const c2 = store.createNewChat('B')
      store.selectChat(c1.id)
      expect(store.currentChatId).toBe(c1.id)
    })
  })

  describe('addMessage', () => {
    it('应向对话添加消息', () => {
      const chat = store.createNewChat()
      store.addMessage(chat.id, { role: 'user', content: '你好', timestamp: Date.now() })
      expect(chat.messages).toHaveLength(1)
      expect(chat.messages[0].content).toBe('你好')
    })

    it('第一条用户消息应更新标题', () => {
      const chat = store.createNewChat()
      store.addMessage(chat.id, { role: 'user', content: '关于人工智能的问题', timestamp: Date.now() })
      expect(chat.title).toBe('关于人工智能的问题')
    })

    it('对话不存在时不应报错', () => {
      expect(() => store.addMessage('nonexistent', { role: 'user', content: '' })).not.toThrow()
    })
  })

  describe('deleteChat', () => {
    it('应删除对话', () => {
      const c1 = store.createNewChat('A')
      const c2 = store.createNewChat('B')
      store.deleteChat(c1.id)
      expect(store.chats).toHaveLength(1)
      expect(store.chats[0].title).toBe('B')
    })

    it('删除当前对话应自动切换', () => {
      const c1 = store.createNewChat('A')
      const c2 = store.createNewChat('B')
      // createNewChat 用 unshift，所以列表是 [B, A]，且 currentChatId = c2.id
      store.deleteChat(c2.id)
      expect(store.currentChatId).toBe(c1.id)
    })

    it('删除唯一对话后 currentChatId 为 null', () => {
      const chat = store.createNewChat()
      store.deleteChat(chat.id)
      expect(store.currentChatId).toBeNull()
    })
  })

  describe('togglePin', () => {
    it('应切换置顶状态', () => {
      const chat = store.createNewChat()
      store.togglePin(chat.id)
      expect(store.chats[0].pinned).toBe(true)
      store.togglePin(chat.id)
      expect(store.chats[0].pinned).toBe(false)
    })

    it('置顶的对话应排在前面', () => {
      const c1 = store.createNewChat('A')
      const c2 = store.createNewChat('B')
      // 列表是 [B, A]，置顶 A
      store.togglePin(c1.id)
      expect(store.chats[0].title).toBe('A')
    })
  })

  describe('getHistory / getMemory', () => {
    it('应返回对话消息历史', () => {
      const chat = store.createNewChat()
      store.addMessage(chat.id, { role: 'user', content: '测试' })
      expect(store.getHistory(chat.id)).toHaveLength(1)
    })

    it('对话不存在应返回空数组', () => {
      expect(store.getHistory('nonexistent')).toEqual([])
      expect(store.getMemory('nonexistent')).toEqual([])
    })
  })
})
