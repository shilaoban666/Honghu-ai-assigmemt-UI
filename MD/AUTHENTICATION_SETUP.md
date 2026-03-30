# 用户认证系统实现说明

## 概述

本项目已实现完整的用户认证和授权系统，支持三种登录方式和手机号/邮箱注册功能。

## 功能实现

### 1. 登录功能（Login.vue）

支持三种登录方式：

#### ✅ 账号密码登录
- 使用 `username` 和 `password` 登录
- 调用 API: `POST /api/v1/users/login`
- 支持"记住我"功能

#### ✅ 手机号登录
- 首先发送验证码：`POST /api/v1/users/send-code`
- 然后使用手机号和验证码登录：`POST /api/v1/users/login`
- 验证码有60秒倒计时

#### ⚙️ 微信登录（占位符）
- 现已添加二维码扫描界面
- 需根据底层API实现：`POST /api/v1/users/login/wechat`

### 2. 注册功能（Register.vue）

支持以下字段：

| 字段 | 必填 | 说明 |
|------|------|------|
| username | ✅ 必填 | 用户名，2-50字符 |
| phone | ✅ 必填 | 手机号，格式：1开头的11位数字 |
| email | ❌ 可选 | 邮箱地址 |
| password | ✅ 必填 | 密码，6-100字符 |
| nickname | ✅ 必填 | 昵称（默认为username） |

**API**: `POST /api/v1/users`

### 3. 路由流程

```
用户访问 http://localhost:5175/
    ↓
App.vue 检查 isLoggedIn 状态
    ↓
未登录 → 显示 Login/Register/ForgotPassword 页面
已登录 → 显示 Main 页面 (Sidebar + Header + ChatArea + InputArea)
```

### 4. 用户状态管理（chatStore）

所有用户状态都通过 Pinia store 统一管理：

```javascript
chatStore.isLoggedIn       // 登录状态
chatStore.userId           // 用户ID
chatStore.username         // 用户名
chatStore.currentUser      // 完整用户信息对象
chatStore.userEmail        // 邮箱
chatStore.userPhone        // 手机号
chatStore.userAvatar       // 头像

// 方法
chatStore.login(userInfo)              // 登录
chatStore.logout()                     // 登出
chatStore.initFromLocalStorage()       // 从本地存储恢复登录状态
```

### 5. 头像和用户信息提示

**Sidebar 中的头像按钮**：
- 已登录：显示用户首字母或头像
- 未登录：显示灰色头像，悬停提示"尚未登录，点击登录"
- 点击头像：打开 ProfilePanel

**ProfilePanel（账户信息面板）**：
- 已登录：显示用户信息和修改选项
- 未登录：显示登录/注册按钮

## 环境配置

### 1. .env 文件配置

```env
VITE_API_URL=http://localhost:3000/api
VITE_AUTH_API_URL=http://localhost:8080/api/v1
```

### 2. API 基础URL

认证相关 API 调用默认基础URL：`http://localhost:8080/api/v1`

## 文件结构

```
src/
├── api/
│   ├── auth.js                 # 认证API模块（新增）
│   └── chat.js                 # AI聊天API
├── components/
│   ├── Login.vue               # 登录页面（已更新）
│   ├── Register.vue            # 注册页面（已更新）
│   ├── Sidebar.vue             # 侧边栏（已更新）
│   ├── ProfilePanel.vue        # 账户信息面板（已更新）
│   └── Header.vue              # 头部
├── stores/
│   └── chatStore.js            # 状态管理（已更新）
├── App.vue                     # 主应用（已更新）
└── .env                        # 环境变量（已更新）
```

## API 接口规范

### 注册 API

```bash
POST /api/v1/users
Content-Type: application/json

请求体：
{
  "username": "zhangsan",        # 用户名，2-50字符
  "password": "password123",     # 密码，6-100字符
  "phone": "13800138000",        # 手机号（必填）
  "email": "zhangsan@example.com", # 邮箱（可选）
  "nickname": "张三"             # 昵称（可选）
}

成功响应 (201 Created):
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "zhangsan",
  "nickname": "张三",
  "phone": "13800138000",
  "email": "zhangsan@example.com",
  "userStatus": "ACTIVE",
  "createdAt": "2026-03-15T10:00:00",
  "updatedAt": "2026-03-15T10:00:00"
}
```

### 登录 API（账号密码）

```bash
POST /api/v1/users/login
Content-Type: application/json

请求体：
{
  "username": "zhangsan",
  "password": "password123"
}

成功响应 (200 OK):
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "zhangsan",
  "nickname": "张三",
  "phone": "13800138000",
  "email": "zhangsan@example.com",
  "userStatus": "ACTIVE",
  "createdAt": "2026-03-15T10:00:00",
  "updatedAt": "2026-03-15T10:00:00"
}
```

### 登录 API（手机号+验证码）

```bash
POST /api/v1/users/login
Content-Type: application/json

请求体：
{
  "phone": "13800138000",
  "verificationCode": "123456"
}
```

### 发送验证码 API

```bash
POST /api/v1/users/send-code
Content-Type: application/json

请求体：
{
  "phone": "13800138000"
}

成功响应：
{
  "message": "验证码已发送"
}
```

## 错误处理

### 常见错误响应

**400 - 参数错误**
```json
{
  "status": 400,
  "message": "用户名不能为空"
}
```

**409 - 用户名已存在**
```json
{
  "status": 400,
  "message": "用户名已存在：zhangsan"
}
```

**404 - 用户不存在**
```json
{
  "status": 404,
  "message": "用户不存在：zhangsan"
}
```

**400 - 密码错误**
```json
{
  "status": 400,
  "message": "密码错误"
}
```

## 本地存储

用户登录成功后，以下数据会保存到 localStorage：

| Key | 说明 |
|-----|------|
| `isLoggedIn` | 登录状态（"true"/"false"） |
| `userId` | 用户 ID |
| `username` | 用户名 |
| `userInfo` | 完整用户信息（JSON字符串） |
| `rememberMe` | 记住我状态 |

应用启动时会自动从 localStorage 恢复登录状态。

## 开发流程

### 1. 启动前端应用

```bash
npm run dev
# 应用运行在 http://localhost:5175
```

### 2. 启动后端服务

确保后端服务运行在 `http://localhost:8080`，并实现以下 API 端点：

```
POST   /api/v1/users                # 注册
POST   /api/v1/users/login          # 登录
POST   /api/v1/users/send-code      # 发送验证码
GET    /api/v1/users/:userId        # 获取用户信息
PUT    /api/v1/users/:userId        # 更新用户信息
POST   /api/v1/users/login/wechat   # 微信登录（可选）
```

### 3. 测试流程

1. 访问 http://localhost:5175
   - 应该显示登录页面

2. 点击"Create Account"注册
   - 填写用户名、手机号、邮箱（可选）、密码
   - 点击"Create Account"提交
   - 注册成功后自动返回登录页

3. 使用注册的账号登录
   - 填写用户名和密码
   - 登录成功后显示主界面

4. 点击头像打开 ProfilePanel
   - 显示已登录用户信息
   - 可以修改密码、手机号、邮箱
   - 可以退出登录

5. 测试手机号登录
   - 切换到"Phone Number"标签
   - 输入手机号，点击"Send Code"
   - 输入验证码完成登录

## 注意事项

1. **CORS 配置**：确保后端配置了 CORS，允许来自 `http://localhost:5175` 的请求

2. **数据验证**：
   - 手机号格式：`1[3-9]\d{9}`（10或11数字，以1开头）
   - 密码长度：6-100字符
   - 用户名长度：2-50字符

3. **安全性**：
   - 密码不会在任何响应中返回
   - 敏感操作建议添加二次验证

4. **会话管理**：
   - 当前实现使用 localStorage 存储用户信息
   - 生产环境建议使用 HTTP-only cookies + JWT token
   - 登出时会清除所有本地存储和对话历史

## 扩展建议

1. **集成真实 WeChat SDK**
   - 需要微信开放平台账号
   - 获取授权码后调用 `/api/v1/users/login/wechat`

2. **添加邮箱验证**
   - 注册时发送验证码到邮箱
   - 验证成功后激活账户

3. **实现密码找回流程**
   - 已有 ForgotPassword.vue 页面框架
   - 需要实现重置密码 API

4. **增强会话安全**
   - 实现 JWT token 机制
   - 添加 Token 刷新逻辑
   - 实现会话超时提醒

## 完成状态

- [x] 用户注册功能
- [x] 账号密码登录
- [x] 手机号验证码登录
- [x] 微信登录界面（需集成实际 SDK）
- [x] 用户状态管理
- [x] 本地存储恢复
- [x] ProfilePanel 用户信息管理
- [x] 未登录提示
- [x] API 错误处理
- [ ] 密码找回（页面框架存在，需实现 API）
- [ ] WeChat SDK 集成
- [ ] 邮箱验证
- [ ] JWT Token 管理
