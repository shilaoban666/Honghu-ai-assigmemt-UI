# GitHub Copilot Review Instructions

请用中文给出 PR Review 意见，优先指出会影响用户体验、数据一致性、接口契约、安全和可维护性的问题。不要只做格式化建议；如果没有高风险问题，请明确说明剩余风险和测试缺口。

前端项目背景：
- Vue 3 + Vite 5 + Pinia + Vue Router。
- 聊天接口通过 `fetch + ReadableStream` 消费 SSE。
- 文件上传先获取后端预签名 URL，再用 `XMLHttpRequest` 直传 S3，并订阅 RAG 状态 SSE。
- 用户身份通过 `X-User-Id` 和 workspace 相关 Header 传递。
- 管理后台使用独立 Bearer Token 和 `adminClient`。

重点审查规则：
1. SSE 流式读取：检查 buffer 分行、JSON 解析、错误处理、取消/完成状态，以及重复追加文本的问题。
2. RAG 上传：检查上传进度、失败状态、文件状态订阅关闭、附件 ID 绑定和 UI 状态回收。
3. 身份上下文：涉及 API 请求时，必须保留 `X-User-Id`、workspace header 和 admin token 的正确注入。
4. 状态管理：Pinia store 变更要避免直接污染不可追踪状态，localStorage 恢复要能处理损坏数据。
5. UI/UX：按钮 loading/disabled、错误态、空态、移动端布局和文本溢出不能破坏主流程。
6. 管理后台：模型价格、角色授权、Provider Key、用量图表相关改动要检查 401/403/429/503 处理。
7. 可访问性：交互按钮应有可理解文本或 title/aria-label；弹窗要能关闭，不应遮挡核心内容。
8. 测试：业务逻辑改动补 Vitest；主流程 UI 改动补 Playwright 或组件测试；不要让 CI 依赖真实后端。

输出格式：
- 先列问题，按严重程度排序，并引用文件与行号。
- 每个问题说明影响、触发条件和建议修复方式。
- 最后给出测试建议或“未发现阻塞问题”。
