# AI Chat Frontend - DeepSeek Style

一个基于 Vue3 的现代 AI 聊天前端应用，采用绿蓝配色，支持问答、文件上传、对话记忆等功能。

## 功能特性

- ✨ **实时聊天** - 与AI进行自然对话交互
- 📁 **文件上传** - 支持上传PDF和图片文件进行分析
- 💾 **对话记忆** - AI记住对话历史，提供更智能的回复
- 📜 **历史管理** - 保存和访问历史对话记录
- 🎨 **现代UI** - 采用绿蓝渐变设计，响应式布局
- ⚡ **快速响应** - 基于Vite构建，开发和生产都很快

## 项目结构

```
ai-chat-frontend/
├── src/
│   ├── components/          # Vue组件
│   │   ├── Sidebar.vue      # 左侧会话列表
│   │   ├── Header.vue       # 顶部头部
│   │   ├── ChatArea.vue     # 聊天显示区域
│   │   └── InputArea.vue    # 输入框和控制区
│   ├── stores/              # Pinia状态管理
│   │   └── chatStore.js     # 聊天状态存储
│   ├── api/                 # API接口
│   │   └── chat.js          # 聊天API调用
│   ├── App.vue              # 主应用组件
│   ├── main.js              # 应用入口
│   └── style.css            # 全局样式
├── index.html               # HTML入口
├── vite.config.js           # Vite配置
├── tailwind.config.js       # Tailwind CSS配置
├── postcss.config.js        # PostCSS配置
└── package.json             # 项目配置

```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制 `.env.example` 为 `.env`，配置API地址：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```
VITE_API_URL=http://localhost:3000/api
```

### 3. 开发启动

```bash
npm run dev
```

访问 `http://localhost:5173`

### 4. 生产构建

```bash
npm run build
```

## API 接口说明

### 问答接口
- **POST** `/api/chat`
- 请求体：
```json
{
  "message": "用户问题",
  "history": [/* 历史消息 */],
  "memory": [/* 记忆数据 */]
}
```
- 响应：
```json
{
  "content": "AI回复内容",
  "memory": [/* 更新后的记忆 */]
}
```

### 历史记录接口
- **GET** `/api/chat/:chatId/history`
- 响应：[历史消息列表]

### 记忆接口
- **GET** `/api/chat/:chatId/memory`
- 响应：[记忆条目列表]

### 文件上传接口
- **POST** `/api/upload`
- Content-Type: multipart/form-data
- 响应：
```json
{
  "fileId": "文件ID",
  "filename": "文件名",
  "size": 文件大小,
  "url": "访问URL"
}
```

### 删除对话接口
- **DELETE** `/api/chat/:chatId`

## 主要技术栈

- **Vue 3** - 进阶式JavaScript框架
- **Vite** - 下一代前端开发工具
- **Pinia** - Vue3状态管理库
- **Tailwind CSS** - 实用优先的CSS框架
- **Axios** - HTTP客户端库

## 组件说明

### Sidebar 左侧边栏
- 显示历史对话列表
- 新建对话按钮
- 删除对话功能
- 对话时间显示

### Header 顶部头部
- 显示当前对话标题
- 导出对话功能
- 信息面板按钮
- 菜单选项

### ChatArea 聊天区
- 消息显示和动画
- 用户消息（蓝色）和AI消息（白色）区分
- 加载动画
- 欢迎页面展示

### InputArea 输入区域
- 文本输入框（支持回车+Ctrl发送）
- 文件上传（PDF/图片）
- 附件预览
- 发送按钮和加载状态

## 样式主题

项目采用的配色方案：
- **主色蓝色** - 用于按钮、链接、用户消息
- **辅色绿色** - 用于AI消息、强调元素
- **背景** - 浅蓝绿渐变

所有颜色定义在 `tailwind.config.js` 中，可以根据需要修改。

## 响应式设计

支持以下屏幕尺寸：
- 📱 移动设备 (320px+)
- 📱 平板 (768px+)
- 🖥️ 桌面 (1024px+)

## 本地开发技巧

1. **热更新** - 修改代码后自动刷新浏览器
2. **浏览器DevTools** - 使用Vue DevTools调试
3. **网络调试** - 在浏览器F12中查看API请求

## 关键特性实现

### 对话管理
所有对话保存在Pinia store中，包括消息历史和记忆数据。

### 文件上传
支持上传PDF和常见图片格式，上传逻辑在 `InputArea.vue` 中实现。

### 记忆功能
每个对话维护一个记忆数组，AI可以在响应中更新记忆内容。

### API代理
Vite配置中设置了API代理，开发时可以避免跨域问题。

## 常见问题

**Q: 如何连接实际的AI服务？**
A: 在 `src/api/chat.js` 中修改 `callAIAPI` 函数，指向你的后端服务。

**Q: 如何修改主题颜色？**
A: 编辑 `tailwind.config.js` 文件中的 colors 配置。

**Q: 如何部署到生产环境？**
A: 运行 `npm run build`，将 `dist` 目录部署到你的服务器。

## 许可证

MIT License

## 贡献指南

欢迎提交 Issue 和 Pull Request！

---

**开发者** - Built with ❤️ and Vue 3
