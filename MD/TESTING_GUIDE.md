# 🧪 测试体系说明

本项目使用 **Vitest** 进行单元/组件测试，**Playwright** 进行 E2E 端到端测试。

---

## 一、测试概览

| 类型 | 框架 | 测试文件位置 | 用例数 |
|------|------|-------------|--------|
| 单元测试 | Vitest + jsdom | `tests/unit/` | 46 |
| 组件测试 | Vitest + Vue Test Utils | `tests/components/` | 7 |
| E2E 测试 | Playwright + Chromium | `tests/e2e/` | 8 |
| **合计** | | | **61** |

## 二、运行命令

```bash
# 单元 + 组件测试
npm test                  # 运行一次
npm run test:watch        # 监听模式（修改文件自动重跑）
npm run test:coverage     # 生成覆盖率报告

# E2E 端到端测试
npm run test:e2e          # 运行（自动启动 dev server）
npm run test:e2e:ui       # 可视化调试界面

# 全部运行
npm run test:all          # 单元 + E2E 一键跑完
```

## 三、测试文件详解

### 3.1 单元测试

#### `tests/unit/theme.test.js` — 主题系统（11 用例）

| 测试组 | 说明 |
|--------|------|
| themes 对象 | 验证 8 个主题存在，每个主题包含 name、primary、bg 等必要属性 |
| applyTheme | 设置 `data-theme`、CSS 变量、保存到 localStorage |
| getTheme | 默认返回 'green'，读取 localStorage 中的保存值 |
| initTheme | 应用已保存的主题或默认主题 |

#### `tests/unit/i18n.test.js` — 国际化系统（10 用例）

| 测试组 | 说明 |
|--------|------|
| languages 对象 | 验证 8 种语言存在，each 有 name/native 属性 |
| getLanguage / setLanguage | 默认 'zh'，切换语言、保存到 localStorage、拒绝无效语言 |
| t() 翻译函数 | 各语言返回正确翻译文本，缺失 key 的回退行为 |

#### `tests/unit/chatStore.test.js` — 聊天状态管理（25 用例）

| 测试组 | 说明 |
|--------|------|
| 初始状态 | 未登录、无对话、loading=false |
| login / logout | 登录设置状态和 localStorage，登出清除一切 |
| initFromLocalStorage | 从本地存储恢复登录、处理损坏 JSON 不崩溃 |
| updateUserInfo | 更新邮箱/手机/头像 |
| createNewChat | 创建对话、unshift 到列表头、设为当前对话 |
| selectChat | 切换当前对话 |
| addMessage | 添加消息、首条用户消息自动更新标题 |
| deleteChat | 删除对话、自动切换、删完最后一个置 null |
| togglePin | 置顶/取消置顶、置顶对话排在前面 |
| getHistory / getMemory | 获取对话消息和记忆数据 |

### 3.2 组件测试

#### `tests/components/ConfirmDialog.test.js` — 确认弹窗（7 用例）

| 测试 | 说明 |
|------|------|
| visible=false | 不渲染内容 |
| visible=true | 显示标题、消息、图标 |
| 按钮交互 | 点击确认触发 confirm 事件，点击取消/遮罩层触发 cancel 事件 |
| danger 模式 | 确认按钮应用 danger 样式类 |

> 注意：ConfirmDialog 使用 `<Teleport to="body">`，测试中通过 `global.stubs.Teleport = true` 解决。

### 3.3 E2E 端到端测试

#### `tests/e2e/app.spec.js` — 页面功能（8 用例）

| 测试组 | 测试 | 说明 |
|--------|------|------|
| 登录页面 | 默认进入主界面 | 检查侧边栏/头部可见 |
| | 用户图标弹出面板 | 点击 avatar-trigger 弹出 user-panel |
| 主聊天界面 | 欢迎页 | 页面包含 "Honghu" 文本 |
| | 输入框 | textarea 可见 |
| | 新对话按钮 | 按钮可见且点击不报错 |
| | 文字输入 | textarea 可填入文字 |
| 主题与语言 | 无控制台报错 | 页面加载无 JS 报错 |

## 四、配置文件

### `vitest.config.js`

```js
// 关键配置
test: {
  environment: 'jsdom',          // 模拟浏览器 DOM
  globals: true,                 // 全局 describe/it/expect
  include: ['tests/unit/**/*.test.js', 'tests/components/**/*.test.js'],
  setupFiles: ['tests/setup.js'] // localStorage mock + polyfills
}
```

### `playwright.config.js`

```js
// 关键配置
testDir: './tests/e2e',
use: { baseURL: 'http://localhost:5174' },
webServer: {
  command: 'npm run dev',        // 自动启动开发服务器
  url: 'http://localhost:5174',
  reuseExistingServer: true      // 复用已启动的服务器
}
```

### `tests/setup.js`

提供 jsdom 环境中缺失的 API polyfill：
- `localStorage` mock（getItem / setItem / removeItem / clear）
- `btoa` / `atob` polyfill（Node 16 兼容）

## 五、编写新测试

### 添加单元测试

在 `tests/unit/` 下创建 `xxx.test.js`：

```js
import { describe, it, expect } from 'vitest'

describe('myModule', () => {
  it('应该正确工作', () => {
    expect(1 + 1).toBe(2)
  })
})
```

### 添加组件测试

在 `tests/components/` 下创建 `XxxComponent.test.js`：

```js
import { mount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'

it('应渲染正确内容', () => {
  const wrapper = mount(MyComponent, {
    props: { title: '测试' },
    global: { stubs: { Teleport: true } } // 如果组件用了 Teleport
  })
  expect(wrapper.text()).toContain('测试')
})
```

### 添加 E2E 测试

在 `tests/e2e/` 下创建 `xxx.spec.js`：

```js
import { test, expect } from '@playwright/test'

test('页面应正常加载', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('textarea')).toBeVisible()
})
```

## 六、注意事项

1. **Node 16 兼容**：项目使用 Vitest 0.32 + jsdom 20 以兼容 Node.js 16
2. **Date.now mock**：chatStore 测试中 mock 了 `Date.now()` 避免同毫秒 ID 冲突
3. **Teleport stub**：使用了 `<Teleport>` 的组件需要在 mount 时 stub
4. **E2E 超时**：Playwright 定位器默认 timeout 设为 10000ms，页面加载较慢时可调大
5. **后端无关**：所有测试不依赖后端服务，E2E 测试已过滤网络错误
