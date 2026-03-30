import { describe, it, expect, beforeEach } from 'vitest'
import { languages, getLanguage, setLanguage, t } from '@/utils/i18n'

describe('i18n.js', () => {
  beforeEach(() => {
    localStorage.clear()
    setLanguage('zh') // 重置为默认语言
  })

  describe('languages', () => {
    it('应包含 8 种语言', () => {
      const langCodes = Object.keys(languages)
      expect(langCodes).toHaveLength(8)
      expect(langCodes).toEqual(expect.arrayContaining(['zh', 'en', 'ja', 'es', 'fr', 'de', 'ru', 'ar']))
    })

    it('每种语言应有 name 和 native 属性', () => {
      for (const [code, lang] of Object.entries(languages)) {
        expect(lang, `语言 ${code} 缺少 name`).toHaveProperty('name')
        expect(lang, `语言 ${code} 缺少 native`).toHaveProperty('native')
      }
    })
  })

  describe('getLanguage / setLanguage', () => {
    it('默认语言应为 zh', () => {
      expect(getLanguage()).toBe('zh')
    })

    it('应切换语言', () => {
      setLanguage('en')
      expect(getLanguage()).toBe('en')
    })

    it('应保存语言到 localStorage', () => {
      setLanguage('ja')
      expect(localStorage.getItem('language')).toBe('ja')
    })

    it('无效语言不应切换', () => {
      setLanguage('en')
      setLanguage('invalid_lang')
      expect(getLanguage()).toBe('en')
    })
  })

  describe('t()', () => {
    it('应返回中文翻译', () => {
      setLanguage('zh')
      const result = t('login')
      expect(result).toBe('登录')
    })

    it('应返回英文翻译', () => {
      setLanguage('en')
      const result = t('login')
      expect(result).toBe('Login')
    })

    it('不存在的 key 应回退到 zh 或返回 key 本身', () => {
      setLanguage('en')
      const result = t('this_key_does_not_exist_anywhere')
      expect(result).toBe('this_key_does_not_exist_anywhere')
    })

    it('多语言切换后翻译应正确', () => {
      setLanguage('zh')
      expect(t('settings')).toBe('设置')
      setLanguage('en')
      expect(t('settings')).toBe('Settings')
      setLanguage('ja')
      expect(t('settings')).toBe('設定')
    })
  })
})
