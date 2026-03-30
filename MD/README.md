# 📚 MD 文档使用指南

本目录包含 Honghu AI Chat 项目的所有详细文档。以下是每个文档的说明和适用场景。

---

## 文档清单

| 文档 | 内容 | 适合谁看 |
|------|------|----------|
| [QUICK_START.md](QUICK_START.md) | 快速开始指南 | 🟢 所有人（第一个看这个） |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | 项目完整概览 | 想了解整体架构的开发者 |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | 项目交付总结 | 项目经理 / 验收人员 |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | 测试体系说明 | 需要运行或编写测试的开发者 |
| [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md) | 认证系统说明 | 对接后端认证的开发者 |
| [AUTH_IMPLEMENTATION_GUIDE.md](AUTH_IMPLEMENTATION_GUIDE.md) | 认证实现指南 | 需要修改登录逻辑的开发者 |
| [WECHAT_LOGIN_GUIDE.md](WECHAT_LOGIN_GUIDE.md) | 微信登录接入指南 | 需要接入微信扫码的开发者 |

---

## 按场景查阅

### 🚀 "我刚拿到项目，怎么跑起来？"

→ 先看 **[QUICK_START.md](QUICK_START.md)**

```bash
npm install
npm run dev
# 打开 http://localhost:5174
```

### 🏗️ "项目整体是什么结构？用了什么技术？"

→ 看 **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)**

包含完整目录结构、各组件职责、技术栈说明。

### 🧪 "怎么跑测试？怎么写新测试？"

→ 看 **[TESTING_GUIDE.md](TESTING_GUIDE.md)**

```bash
npm test            # 单元 + 组件测试（53 用例）
npm run test:e2e    # E2E 端到端测试（8 用例）
npm run test:all    # 全部一键运行
```

### 🔐 "登录注册是怎么实现的？后端接口是什么？"

→ 看 **[AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md)**

了解三种登录方式（账号密码、手机验证码、微信扫码）的实现和 API 接口。

### 🔧 "我要改登录逻辑，代码在哪里？"

→ 看 **[AUTH_IMPLEMENTATION_GUIDE.md](AUTH_IMPLEMENTATION_GUIDE.md)**

包含 Pinia store 状态管理、API 调用流程、安全特性等实现细节。

### 💬 "要接入微信扫码登录？"

→ 看 **[WECHAT_LOGIN_GUIDE.md](WECHAT_LOGIN_GUIDE.md)**

微信开放平台注册、前端 SDK 集成、回调处理的完整步骤。

### 📋 "项目做了哪些东西？交付物是什么？"

→ 看 **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)**

所有交付物清单和功能完成情况汇总。

---

## 建议阅读顺序

```
1. QUICK_START.md          → 跑起来
2. PROJECT_OVERVIEW.md     → 了解全局
3. TESTING_GUIDE.md        → 跑测试
4. AUTHENTICATION_SETUP.md → 理解认证
5. 其他文档按需查阅
```
