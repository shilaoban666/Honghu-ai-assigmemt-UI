# 认证系统快速开始

## 核心功能

✅ **三种登录方式**
- 账号密码登录
- 手机号+验证码登录
- 微信扫码登录（占位符，待集成）

✅ **完整的注册流程**
- 手机号必填
- 邮箱可选
- 密码强度验证
- 用户协议对勾

✅ **用户状态管理**
- 自动登录状态恢复
- localStorage 持久化
- Pinia store 管理

✅ **安全特性**
- 密码不在响应中返回
- 未登录时提示
- 登出清理所有数据

## 使用场景

### 场景1：第一次访问应用

```
1. 用户访问 http://localhost:5175
   ↓
2. 应用检查 localStorage，未找到登录信息
   ↓
3. 显示登录页面
   ↓
4. 用户点击 "Create Account" 跳转到注册页
   ↓
5. 填写注册信息，提交成功
   ↓
6. 自动返回登录页
   ↓
7. 使用刚注册的账号登录
   ↓
8. 显示主界面（Sidebar + ChatArea）
```

### 场景2：已登录用户刷新页面

```
1. 用户刷新页面
   ↓
2. App 加载时调用 chatStore.initFromLocalStorage()
   ↓
3. 从 localStorage 恢复登录状态
   ↓
4. 直接显示主界面
```

### 场景3：用户点击头像未登录

```
1. 未登录用户看到灰色头像
2. 悬停提示 "尚未登录，点击登录"
3. 点击头像打开 ProfilePanel
4. ProfilePanel 显示登录/注册按钮
5. 点击登录转到登录页面
```

### 场景4：已登录用户点击头像

```
1. 已登录用户看到彩色头像
2. 点击头像打开 ProfilePanel
3. ProfilePanel 显示用户信息和修改选项
4. 可以修改手机号、密码、邮箱
5. 可以上传头像
6. 可以点击 "退出账号" 登出
```

## 核心代码路径

| 功能 | 文件 | 说明 |
|------|------|------|
| API 调用 | `src/api/auth.js` | 所有认证 API 接口 |
| 登录页 | `src/components/Login.vue` | 三种登录方式 |
| 注册页 | `src/components/Register.vue` | 注册表单和验证 |
| 用户中心 | `src/components/ProfilePanel.vue` | 用户信息管理 |
| 状态管理 | `src/stores/chatStore.js` | 用户状态和聊天状态 |
| 主应用 | `src/App.vue` | 路由和页面切换逻辑 |
| 侧边栏 | `src/components/Sidebar.vue` | 头像和未登录提示 |

## API 调用示例

### 注册示例

```javascript
import { registerUser } from '@/api/auth'

const result = await registerUser({
  username: 'zhangsan',
  password: 'password123',
  phone: '13800138000',
  email: 'zhangsan@example.com',
  nickname: '张三'
})
// 返回: { userId, username, phone, email, ... }
```

### 登录示例

```javascript
import { loginWithPassword } from '@/api/auth'

const result = await loginWithPassword('zhangsan', 'password123')
// 返回: { userId, username, phone, email, ... }
```

### 使用 Store

```javascript
import { useChat } from '@/stores/chatStore'

const chatStore = useChat()

// 登录
chatStore.login({
  userId: '...',
  username: 'zhangsan',
  email: '...',
  phone: '...'
})

// 检查登录状态
if (chatStore.isLoggedIn) {
  console.log('已登录:', chatStore.username)
}

// 登出
chatStore.logout()
```

## 数据流图

```
┌─────────────────────────────────────────────────────────┐
│              用户操作页面                                │
│ (Login.vue / Register.vue / ProfilePanel.vue)          │
└───────────────┬─────────────────────────────────────────┘
                │ emit('login') / emit('register')
                ↓
        ┌───────────────────┐
        │   src/App.vue     │  handleLogin()/handleRegister()
        └───────────────────┘
                │
                ↓
        ┌──────────────────────┐
        │ chatStore.login()    │
        │ 或 chatStore.logout()│
        └──────────────────────┘
                │
                ├─→ 更新 isLoggedIn 状态
                ├─→ 保存到 localStorage
                └─→ 更新 UI
```

## 状态转换图

```
┌───────────┐
│  初始化   │
└─────┬─────┘
      │ 检查 localStorage
      ↓
┌──────────────────┐
│ 有保存的登录信息？ │
└─────┬────────┬───┘
    是│        │否
      ↓        ↓
  ┌────────┐ ┌───────┐
  │已登录  │ │未登录  │
  │显示    │ │显示    │
  │主界面  │ │登录页  │
  └────────┘ └───────┘
```

## 核心流程代码

### Login 组件流程

```javascript
// 1. 用户输入认证信息
const handleLogin = async () => {
  // 2. 调用 API
  const response = await loginWithPassword(username, password)
  
  // 3. 发送事件给父组件
  emit('login', {
    userId: response.userId,
    username: response.username,
    // ...
  })
}
```

### App 主程序流程

```javascript
const handleLogin = (loginData) => {
  // 1. 使用 chatStore 的 login 方法
  chatStore.login(loginData)
  
  // isLoggedIn 自动更新为 true
  // 页面自动显示主界面
}

onMounted(() => {
  // 2. 页面加载时恢复登录状态
  chatStore.initFromLocalStorage()
})
```

## 调试导航

### 查看当前登录状态

打开浏览器控制台：

```javascript
// 查看完整用户信息
console.log(JSON.parse(localStorage.getItem('userInfo')))

// 查看是否已登录
console.log(localStorage.getItem('isLoggedIn'))
```

### 手动清除登录状态（重置应用）

```javascript
// 清除所有登录相关数据
localStorage.clear()
// 刷新页面
location.reload()
```

### 监听 Store 变化

```javascript
import { useChat } from '@/stores/chatStore'
const chatStore = useChat()

// 监听登录状态变化
watch(() => chatStore.isLoggedIn, (newVal) => {
  console.log('登录状态变化:', newVal)
})
```

## 防止常见错误

❌ **错误做法**：直接修改 localStorage
```javascript
// 不要这样做！
localStorage.setItem('isLoggedIn', 'true')
```

✅ **正确做法**：使用 Store 方法
```javascript
// 使用这种方式
chatStore.login(userInfo)
```

❌ **错误做法**：重复登录检查
```javascript
// 不要在多个地方检查 isLoggedIn
const isLoggedIn = ref(false)
const isLoggedIn2 = ref(false)
```

✅ **正确做法**：使用 computed 关联 Store
```javascript
// 使用 computed 自动同步状态
const isLoggedIn = computed(() => chatStore.isLoggedIn)
```

## 扩展功能建议

1. **实现密码找回**
   - 已有 ForgotPassword.vue 框架
   - 需实现邮箱验证和密码重置 API

2. **集成 WeChat SDK**
   ```javascript
   // 在 auth.js 中更新 loginWithWeChat 函数
   export const loginWithWeChat = async (code) => {
     // 调用微信 SDK 获取用户信息
     // 发送到后端验证
   }
   ```

3. **实现双因素认证**
   - 登录时要求验证码
   - 修改敏感信息时要求二次验证

4. **添加 Session 管理**
   - 实现 JWT token
   - 添加 token 刷新机制
   - 实现会话超时

5. **用户头像处理**
   - 上传头像到服务器
   - 使用 CDN 加速
   - 生成多种分辨率

---

更详细的文档请查看 `AUTHENTICATION_SETUP.md`
