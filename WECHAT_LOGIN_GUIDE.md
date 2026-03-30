# WeChat QR Code Login Implementation Guide

## Overview
微信扫码登录是一种通过扫描二维码来完成身份验证的登录方式。要实现完整的微信扫码登录，需要：

## 实现步骤

### 1. **申请微信官方接口**
- 访问 [微信开放平台](https://open.weixin.qq.com/)
- 注册开发者账号
- 创建应用并获取 `appId` 和 `appSecret`
- 在应用设置中获取 OAuth2 授权回调域名权限

### 2. **前端集成方案**

#### 方案A: 使用微信官方 JavaScript SDK（推荐）

```javascript
// 1. 引入微信 JS SDK
<script src="https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js"></script>

// 2. 在 Login.vue 中初始化二维码
const initWechatQRCode = () => {
  new WxLogin({
    self_redirect: false,
    id: "wechat-qrcode", // 放置二维码的容器 ID
    appid: "YOUR_APP_ID",
    scope: "snsapi_userinfo",
    redirect_uri: "YOUR_REDIRECT_URI", // 授权后的回调地址
    state: "",
    style: "",
    href: ""
  })
}

// 3. 在组件挂载时调用
onMounted(() => {
  if (activeTab.value === 'wechat') {
    initWechatQRCode()
  }
})
```

#### 方案B: 自行生成二维码（自定义程度高）

```javascript
import QRCode from 'qrcode' // npm install qrcode

const generateQRCode = async () => {
  const authUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=YOUR_APP_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=snsapi_userinfo&state=STATE`
  
  try {
    const canvas = document.getElementById('qrcode-canvas')
    await QRCode.toCanvas(canvas, authUrl, { width: 200 })
  } catch (error) {
    console.error('生成二维码失败', error)
  }
}
```

### 3. **回调处理（后端）**

```javascript
// 用户扫码后微信会跳转回来，带上授权 code
// 后端需要用所获取 code 来获取用户信息

POST /api/v1/auth/wechat/callback
Body: {
  code: "xxxxxx" // 微信返回的授权码
}

// 后端处理流程：
// 1. 使用 code + appId + appSecret 换取 access_token
// 2. 用 access_token 获取用户信息
// 3. 创建或更新本地用户记录
// 4. 返回登录令牌给前端
```

### 4. **前端处理回调**

```javascript
// 在回调页面处理
const handleWechatCallback = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const state = urlParams.get('state')
  
  if (code) {
    // 发送 code 到后端
    fetch('/api/v1/auth/wechat/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })
    .then(res => res.json())
    .then(data => {
      // 保存登录信息
      localStorage.setItem('userId', data.userId)
      localStorage.setItem('token', data.token)
      localStorage.setItem('isLoggedIn', 'true')
      
      // 重定向到主页
      window.location.href = '/'
    })
  }
}
```

## 完整的 WeChat Login 实现

### 更新 Login.vue 的微信部分：

```vue
<template v-if="activeTab === 'wechat'">
  <div class="wechat-login-section">
    <p class="wechat-title">Scan with WeChat to Login</p>
    <div class="qrcode-container">
      <!-- 方案A: 使用微信官方 SDK（需取消注释） -->
      <!-- <div id="wechat-qrcode" class="qrcode-placeholder"></div> -->
      
      <!-- 方案B: 自行生成二维码 -->
      <div class="qrcode-placeholder">
        <canvas id="qrcode-canvas" width="200" height="200"></canvas>
      </div>
    </div>
    <p class="wechat-tip">
      💡 Open WeChat and scan the QR code above to login instantly
    </p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import QRCode from 'qrcode' // 可选：npm install qrcode

const generateWechatQRCode = async () => {
  const appId = 'YOUR_APP_ID'
  const redirectUri = encodeURIComponent('YOUR_REDIRECT_URI')
  const authUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=wechat_login`
  
  try {
    const canvas = document.getElementById('qrcode-canvas')
    if (canvas) {
      await QRCode.toCanvas(canvas, authUrl, { 
        width: 200,
        margin: 1,
        color: {
          dark: '#2d8659',
          light: '#f0f9f0'
        }
      })
    }
  } catch (error) {
    console.error('Failed to generate QR code', error)
  }
}

onMounted(() => {
  if (activeTab.value === 'wechat') {
    generateWechatQRCode()
  }
})

watch(() => activeTab.value, (newTab) => {
  if (newTab === 'wechat') {
    generateWechatQRCode()
  }
})
</script>
```

## 必要的环境配置

```bash
# 1. 安装二维码库（可选，仅在方案B使用）
npm install qrcode

# 2. 环境变量配置
VITE_WECHAT_APP_ID=your_app_id
VITE_WECHAT_REDIRECT_URI=your_redirect_uri
```

## 安全注意事项

1. **永远不要在前端暴露 `appSecret`**，它应该由后端保管
2. **使用 HTTPS** 连接，微信要求所有回调地址必须使用 HTTPS
3. **验证 state 参数**，防止 CSRF 攻击
4. **实施速率限制**，防止暴力破解
5. **记录审计日志**，追踪所有认证请求

## 调试提示

- 使用微信开放平台的 [接口调试工具](https://open.weixin.qq.com/tools)
- 在测试阶段，可使用微信开发者工具的模拟器
- 查看浏览器控制台和网络面板，检查 API 请求/响应
- 微信返回的 `code` 有效期为 5 分钟，不能重复使用

## 相关文档链接

- [微信开放平台文档](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Web_apps.html)
- [网页授权获取用户基本信息](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Web_apps.html#获取用户基本信息)
- [OAuth 2.0 标准](https://tools.ietf.org/html/rfc6749)

