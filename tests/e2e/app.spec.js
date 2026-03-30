import { test, expect } from '@playwright/test'

test.describe('登录页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('应显示跳过登录链接（默认进入主界面）', async ({ page }) => {
    // 默认 showAuthPage=false，应显示主聊天界面
    // 检查侧边栏或头部存在
    const sidebar = page.locator('.sidebar, .header')
    await expect(sidebar.first()).toBeVisible({ timeout: 10000 })
  })

  test('点击头部用户图标应弹出面板', async ({ page }) => {
    const avatar = page.locator('.avatar-trigger').first()
    await expect(avatar).toBeVisible({ timeout: 10000 })
    await avatar.click()
    // 应显示用户面板或登录按钮
    const panel = page.locator('.user-panel, .dropdown-panel').first()
    await expect(panel).toBeVisible({ timeout: 5000 })
  })
})

test.describe('主聊天界面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('应显示欢迎页', async ({ page }) => {
    // 欢迎页应包含 Honghu 相关文字
    const welcome = page.locator('text=Honghu').first()
    await expect(welcome).toBeVisible({ timeout: 10000 })
  })

  test('应显示输入框', async ({ page }) => {
    const input = page.locator('textarea, .input-area textarea').first()
    await expect(input).toBeVisible({ timeout: 10000 })
  })

  test('侧边栏应显示新对话按钮', async ({ page }) => {
    const newChatBtn = page.locator('.new-chat-btn, button:has-text("新对话")').first()
    await expect(newChatBtn).toBeVisible({ timeout: 10000 })
  })

  test('输入框可以输入文字', async ({ page }) => {
    const input = page.locator('textarea').first()
    await expect(input).toBeVisible({ timeout: 10000 })
    await input.fill('你好，这是一条测试消息')
    await expect(input).toHaveValue('你好，这是一条测试消息')
  })

  test('点击新对话按钮不应报错', async ({ page }) => {
    const newChatBtn = page.locator('.new-chat-btn, button:has-text("新对话")').first()
    await expect(newChatBtn).toBeVisible({ timeout: 10000 })
    await newChatBtn.click()
    // 页面不应崩溃
    await expect(page.locator('textarea').first()).toBeVisible()
  })
})

test.describe('主题与语言', () => {
  test('页面应正常加载无控制台报错', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))
    await page.goto('/')
    await page.waitForTimeout(2000)
    // 过滤掉网络请求错误（后端未启动）
    const realErrors = errors.filter(e => !e.includes('fetch') && !e.includes('Network') && !e.includes('ERR_'))
    expect(realErrors).toHaveLength(0)
  })
})
