# 🦅 Honghu AI Chat

<div align="center">

**智能对话助手，为您服务**

一个基于 Vue 3 的现代 AI 聊天前端应用，拥有森林主题交互式登录页、LobeHub 风格 UI、多模型支持、8 种主题色和 8 国语言。

[![Vue 3](https://img.shields.io/badge/Vue-3.3-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.5-646CFF?logo=vite)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-0.32-6E9F18?logo=vitest)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-1.40-2EAD33?logo=playwright)](https://playwright.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## ✨ 功能亮点

- 🌲 **森林主题登录页** — 卡通树人会眨眼、眼球跟踪输入框、输密码时害羞捂脸；白天有太阳、夜晚有星月
- 💬 **流式对话** — SSE 实时流式输出，支持 Markdown 渲染、思考动画
- 🤖 **多模型切换** — 弹出式模型选择器，支持搜索筛选
- 🌐 **联网搜索** — 一键开启联网检索增强回答
- 📎 **文件上传** — 支持 PDF / JPG / PNG / GIF 上传分析
- 🧩 **技能商店** — 可扩展的 AI 技能插件系统
- 🎨 **8 种主题色** — 森林绿、暗夜黑、天空蓝、热情红、活力橙、梦幻紫、浪漫粉、清新青
- 🌍 **8 国语言** — 中文、English、日本語、Español、Français、Deutsch、Русский、العربية
- 📱 **响应式设计** — 完美适配桌面端和移动端
- 🔐 **多种登录方式** — 账号密码、手机验证码、微信扫码、游客模式
- 🧪 **完善测试** — Vitest 单元/组件测试 + Playwright E2E 端到端测试

## 📸 界面预览

| 浅色模式 | 深色模式 |
| :---: | :---: |
| 森林主题登录页，太阳装饰 | 星月夜空，极光萤火虫 |
| LobeHub 风格聊天界面 | 深色主题聊天界面 |

![alt text](image.png)

## 🚀 快速开始

### 环境要求

- **Node.js** >= 16
- **npm** >= 7

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/shilaoban666/Honghu-ai-assigmemt-UI.git
cd Honghu-ai-assigmemt-UI

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:5174`

### 生产构建

```bash
npm run build       # 构建到 dist/
npm run preview     # 本地预览构建结果
```

## 🧪 测试

项目配置了完整的测试体系，详细说明见 [MD/TESTING_GUIDE.md](MD/TESTING_GUIDE.md)。

```bash
npm test            # 运行全部单元/组件测试（53 个用例）
npm run test:e2e    # 运行 E2E 端到端测试（8 个用例）
npm run test:all    # 一键运行全部测试
```

| 命令 | 说明 |
|------|------|
| `npm test` | Vitest 单元 + 组件测试 |
| `npm run test:watch` | 监听模式（开发时使用） |
| `npm run test:coverage` | 生成覆盖率报告 |
| `npm run test:e2e` | Playwright E2E 测试 |
| `npm run test:e2e:ui` | Playwright 可视化调试 |
| `npm run test:all` | 全部测试一键运行 |

## 🏗️ 项目结构

```
Honghu-AI-Chat/
├── src/
│   ├── components/              # Vue 组件
│   │   ├── Login.vue            # 🌲 森林主题登录页（交互树人、日夜切换）
│   │   ├── Register.vue         # 注册页
│   │   ├── ForgotPassword.vue   # 忘记密码
│   │   ├── Header.vue           # 顶部导航（分享/导出/用户菜单）
│   │   ├── Sidebar.vue          # 侧边栏（对话列表、置顶、拖拽宽度）
│   │   ├── ChatArea.vue         # 聊天区域（流式消息、欢迎页）
│   │   ├── InputArea.vue        # 输入区域（模型选择、联网、附件）
│   │   ├── SettingsPanel.vue    # 设置面板（主题/语言/字体/快捷键）
│   │   ├── ProfilePanel.vue     # 用户资料面板
│   │   ├── ShareDialog.vue      # 分享对话弹窗
│   │   ├── ConfirmDialog.vue    # 确认操作弹窗
│   │   └── SkillStoreDialog.vue # 技能商店弹窗
│   ├── stores/chatStore.js      # Pinia 聊天状态管理
│   ├── api/
│   │   ├── auth.js              # 认证 API（登录/注册/验证码）
│   │   └── chat.js              # 聊天 API（SSE 流式/会话/历史）
│   ├── utils/
│   │   ├── i18n.js              # 国际化（8 种语言）
│   │   └── theme.js             # 主题系统（8 种主题色）
│   ├── App.vue                  # 主应用（认证流 + 布局）
│   ├── main.js                  # 入口文件
│   └── style.css                # 全局样式
├── tests/
│   ├── setup.js                 # 测试环境配置
│   ├── unit/                    # 单元测试
│   │   ├── theme.test.js        # 主题系统测试（11 用例）
│   │   ├── i18n.test.js         # 国际化测试（10 用例）
│   │   └── chatStore.test.js    # 聊天状态测试（25 用例）
│   ├── components/              # 组件测试
│   │   └── ConfirmDialog.test.js # 确认弹窗测试（7 用例）
│   └── e2e/                     # E2E 端到端测试
│       └── app.spec.js          # 页面功能测试（8 用例）
├── MD/                          # 📚 项目文档（详见 MD/README.md）
├── vitest.config.js             # Vitest 测试配置
├── playwright.config.js         # Playwright E2E 配置
├── vite.config.js               # Vite 构建配置
├── tailwind.config.js           # TailwindCSS 配置
└── package.json                 # 项目依赖与脚本
```

## 🔌 API 接口

### 认证接口（`http://localhost:8080/api/v1`）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/users` | 用户注册 |
| POST | `/users/login` | 账号密码/手机号登录 |
| POST | `/users/login/wechat` | 微信扫码登录 |
| POST | `/users/send-code` | 发送手机验证码 |
| GET | `/users/:userId` | 获取用户信息 |

### 聊天接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/chat/structured/stream/persistent` | 流式聊天（SSE） |
| GET | `/sessions/user/:userId` | 获取会话列表 |
| GET | `/chat/history/:sessionId` | 获取聊天历史 |
| PUT | `/sessions/:sessionId/rename` | 重命名会话 |
| DELETE | `/sessions/:sessionId` | 删除会话 |

## ⚙️ 设置选项

| 分类 | 设置项 | 选项 |
|------|--------|------|
| 通用 | 主题模式 | 浅色 / 深色 / 跟随系统 |
| | 语言 | 8 种语言 |
| | 发送快捷键 | Enter / Ctrl+Enter |
| | 字体大小 | 小 / 默认 / 大 |
| | 消息样式 | 气泡 / 平铺 |
| | 消息提示音 | 开 / 关 |
| 外观 | 主题色 | 8 种颜色 |

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | ^3.3.0 | 渐进式 JavaScript 框架 |
| Vite | ^4.5.0 | 前端构建工具 |
| Pinia | ^2.1.0 | 状态管理 |
| Axios | ^1.6.0 | HTTP 客户端 |
| TailwindCSS | ^3.4.0 | 原子化 CSS 框架 |
| Vitest | ^0.32.4 | 单元 / 组件测试 |
| Playwright | 1.40 | E2E 端到端测试 |
| Vue Test Utils | ^2.4.6 | Vue 组件测试工具 |

## 📚 文档

更多详细文档在 `MD/` 文件夹中，使用指南见 [MD/README.md](MD/README.md)。

| 文档 | 说明 |
|------|------|
| [QUICK_START.md](MD/QUICK_START.md) | 快速开始指南 |
| [PROJECT_OVERVIEW.md](MD/PROJECT_OVERVIEW.md) | 项目完整概览 |
| [PROJECT_SUMMARY.md](MD/PROJECT_SUMMARY.md) | 项目交付总结 |
| [AUTHENTICATION_SETUP.md](MD/AUTHENTICATION_SETUP.md) | 认证系统说明 |
| [AUTH_IMPLEMENTATION_GUIDE.md](MD/AUTH_IMPLEMENTATION_GUIDE.md) | 认证实现指南 |
| [WECHAT_LOGIN_GUIDE.md](MD/WECHAT_LOGIN_GUIDE.md) | 微信登录接入 |
| [TESTING_GUIDE.md](MD/TESTING_GUIDE.md) | 测试体系说明 |

## 📄 License

MIT License — © 2026 Honghu AI

---

<div align="center">

Built with ❤️ and Vue 3

</div>
