import { describe, it, expect, beforeEach } from 'vitest'
import { themes, applyTheme, getTheme, initTheme } from '@/utils/theme'

describe('theme.js', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.cssText = ''
  })

  describe('themes', () => {
    it('应包含 8 种主题', () => {
      const themeIds = Object.keys(themes)
      expect(themeIds).toHaveLength(8)
      expect(themeIds).toContain('green')
      expect(themeIds).toContain('dark')
      expect(themeIds).toContain('blue')
      expect(themeIds).toContain('red')
      expect(themeIds).toContain('orange')
      expect(themeIds).toContain('purple')
      expect(themeIds).toContain('pink')
      expect(themeIds).toContain('cyan')
    })

    it('每个主题应包含完整属性', () => {
      const requiredKeys = ['id', 'name', 'primaryColor', 'primaryLight', 'primaryBg', 'borderColor', 'hoverBg', 'sidebarBg', 'headerBg', 'chatBg']
      for (const [id, theme] of Object.entries(themes)) {
        for (const key of requiredKeys) {
          expect(theme, `主题 ${id} 缺少属性 ${key}`).toHaveProperty(key)
        }
      }
    })

    it('每个主题的 id 应与 key 一致', () => {
      for (const [key, theme] of Object.entries(themes)) {
        expect(theme.id).toBe(key)
      }
    })
  })

  describe('applyTheme', () => {
    it('应设置 data-theme 属性', () => {
      applyTheme('blue')
      expect(document.documentElement.getAttribute('data-theme')).toBe('blue')
    })

    it('应设置 CSS 变量', () => {
      applyTheme('green')
      const style = document.documentElement.style
      expect(style.getPropertyValue('--primary-color')).toBe('#2d8659')
      expect(style.getPropertyValue('--primary-light')).toBe('#4a9d6f')
    })

    it('应保存到 localStorage', () => {
      applyTheme('red')
      expect(localStorage.getItem('theme')).toBe('red')
    })

    it('无效主题 ID 不应报错', () => {
      expect(() => applyTheme('nonexistent')).not.toThrow()
    })
  })

  describe('getTheme', () => {
    it('默认应返回 green', () => {
      expect(getTheme()).toBe('green')
    })

    it('应返回 localStorage 中保存的主题', () => {
      localStorage.setItem('theme', 'purple')
      expect(getTheme()).toBe('purple')
    })
  })

  describe('initTheme', () => {
    it('应将保存的主题应用到 DOM', () => {
      localStorage.setItem('theme', 'cyan')
      initTheme()
      expect(document.documentElement.getAttribute('data-theme')).toBe('cyan')
    })

    it('无保存主题时应应用默认 green', () => {
      initTheme()
      expect(document.documentElement.getAttribute('data-theme')).toBe('green')
    })
  })
})
