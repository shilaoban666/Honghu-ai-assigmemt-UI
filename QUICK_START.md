# ⚡ 快速开始指南

让你在 5 分钟内启动并运行 AI Chat 前端项目！

## 📋 前置要求

- **Node.js** 16+ 版本
- **npm** 7+ 或 **yarn**
- 一个内核编辑器（VS Code 推荐）

## 🚀 第一步：克隆项目

```bash
# 进入项目目录
cd ai-chat-frontend

# 安装依赖
npm install
```

## 🔧 第二步：配置环境

```bash
# 复制环境变量示例
cp .env.example .env

# 编辑 .env 文件（如需修改API地址）
# VITE_API_URL=http://localhost:3000/api
```

## ▶️ 第三步：启动开发服务器

```bash
npm run dev
```

你应该会看到：
```
VITE v5.0.0  ready in 200 ms

➜ Local:   http://localhost:5173/
```

在浏览器中打开 `http://localhost:5173`，你将看到 AI Chat 应用！

## 📂 项目文件说明

| 文件/目录 | 说明 |
|---------|------|
| `src/` | 源代码目录 |
| `src/components/` | Vue 组件 |
| `src/stores/` | 状态管理 |
| `src/api/` | API 接口 |
| `public/` | 静态资源 |
| `index.html` | HTML 入口 |
| `vite.config.js` | Vite 配置 |
| `tailwind.config.js` | 样式配置 |

## 🎯 基本操作

### 1️⃣ 新建对话

点击左侧"新建对话"按钮创建新的对话。

### 2️⃣ 输入问题

在底部输入框输入你的问题，按 `Ctrl+Enter`（或 `Cmd+Enter`）发送。

### 3️⃣ 上传文件

点击输入框左侧的 `+` 按钮上传 PDF 或图片文件。

### 4️⃣ 查看历史

所有对话会列在左侧边栏，点击即可切换。

## 🔌 连接后端服务

项目需要后端 API 支持。有两种方式：

### 方式一：使用现有的后端服务

修改 `.env` 文件中的 `VITE_API_URL`：

```
VITE_API_URL=https://your-api-server.com/api
```

### 方式二：本地启动后端服务

参考 `backend-example.md` 文件创建你自己的后端服务。

#### 快速启动本地后端（需要 Node.js）：

```bash
# 创建后端项目
mkdir ai-chat-backend
cd ai-chat-backend

# 初始化项目
npm init -y
npm install express cors multer axios

# 创建 server.js（参考 backend-example.md）

# 启动服务器
node server.js
```

后端默认运行在 `http://localhost:3000`

## 🛠️ 自定义主题

### 修改颜色

编辑 `tailwind.config.js`：

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#your-blue-color',    // 修改蓝色
        600: '#your-blue-color',
      },
      success: {
        500: '#your-green-color',   // 修改绿色
        600: '#your-green-color',
      }
    }
  }
}
```

保存后会自动刷新（热更新）。

### 修改字体

在 `tailwind.config.js` 中：

```javascript
theme: {
  extend: {
    fontFamily: {
      sans: ['你的字体', 'system-ui', 'sans-serif']
    }
  }
}
```

## 📦 构建生产版本

当你准备好部署时：

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

构建输出会在 `dist/` 目录，可以部署到任何静态托管服务（GitHub Pages、Vercel、Netlify 等）。

## 🚀 部署（5 分钟快速指南）

### 部署到 Vercel（推荐）

1. 推送代码到 GitHub
2. 访问 [vercel.com](https://vercel.com)
3. 导入你的 GitHub 仓库
4. 设置环境变量（`VITE_API_URL`）
5. 点击部署！

### 部署到 Netlify

1. 在项目目录运行 `npm run build`
2. 访问 [netlify.com](https://netlify.com)
3. 拖拽 `dist/` 文件夹到部署区域
4. 完成！

### 部署到自己的服务器

```bash
# 构建
npm run build

# 将 dist 目录复制到服务器
scp -r dist/* user@your-server.com:/var/www/html/

# 或使用 FTP 上传 dist 目录
```

## 🔧 开发技巧

### 热模块替换（HMR）

修改代码时，页面会自动翻新，无需手动刷新。

### Vue DevTools

安装 [Vue DevTools](https://devtools.vuejs.org/) 扩展来调试你的应用。

### 浏览器控制台

按 `F12` 打开浏览器开发工具，查看：
- Network：API 请求
- Console：错误信息
- Elements：HTML 结构

## 📱 测试响应式设计

1. 按 `F12` 打开开发者工具
2. 点击设备工具栏按钮（左上角）
3. 选择不同的设备预览

## ❓ 常见问题

### Q: 运行 `npm install` 出错？
A: 清除缓存后重试：
```bash
npm cache clean --force
npm install
```

### Q: 样式未生效？
A: 重启开发服务器：
```bash
# 按 Ctrl+C 停止
# 然后重新运行
npm run dev
```

### Q: API 请求失败？
A:
1. 检查后端服务是否运行
2. 检查 `.env` 中的 URL 是否正确
3. 打开浏览器控制台查看具体错误

### Q: 如何修改默认端口？
A: 在 `vite.config.js` 中修改：
```javascript
server: {
  port: 8080  // 改为你想要的端口
}
```

### Q: 可以在生产环境中调试吗？
A: 是的，运行 `npm run build` 并使用 `npm run preview`。

## 📚 下一步

- 查看 [README.md](./README.md) 了解完整功能
- 查看 [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) 了解项目架构
- 查看 [backend-example.md](./backend-example.md) 实现你的后端服务
- 探索 `src/` 目录中的源代码

## 💡 开发建议

1. **使用 VS Code** - 获得最佳开发体验
2. **安装扩展**：
   - Vetur 或 Vue - Official
   - Tailwind CSS IntelliSense
   - ESLint
   - Prettier

3. **打开设置**：
   - 启用 "Format on Save"
   - 启用 "Auto Save"

## 🎉 成功！

现在你已经有了一个完整的 AI Chat UI！

可以开始：
- 定制样式
- 连接你的 AI 后端
- 添加新功能
- 与团队分享

---

## 📞 需要帮助？

- 查看 [官方文档](https://vuejs.org/)
- 提交 Issue 到项目仓库
- 查看浏览器控制台的错误信息

**祝你编码愉快！** 🚀 ✨
