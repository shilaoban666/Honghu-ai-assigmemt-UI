<template>
  <div ref="chatAreaRef" class="chat-area">
    <!-- 欢迎消息 -->
    <div v-if="messages.length === 0" class="welcome-section">
      <div class="welcome-content">
        <div class="welcome-emoji">🦅</div>
        <h1 class="welcome-title">Honghu AI Chat</h1>
        <p class="welcome-subtitle">{{ t('welcomeSubtitle') }}</p>
        <div class="welcome-grid">
          <div class="welcome-card" @click="$emit('quick-start', t('askTitle'))">
            <p class="card-emoji">📝</p>
            <p class="card-title">{{ t('askTitle') }}</p>
            <p class="card-desc">{{ t('askDesc') }}</p>
          </div>
          <div class="welcome-card" @click="$emit('quick-start', t('analyzeTitle'))">
            <p class="card-emoji">📊</p>
            <p class="card-title">{{ t('analyzeTitle') }}</p>
            <p class="card-desc">{{ t('analyzeDesc') }}</p>
          </div>
          <div class="welcome-card" @click="$emit('quick-start', t('creativeTitle'))">
            <p class="card-emoji">💡</p>
            <p class="card-title">{{ t('creativeTitle') }}</p>
            <p class="card-desc">{{ t('creativeDesc') }}</p>
          </div>
          <div class="welcome-card" @click="$emit('quick-start', t('codeTitle'))">
            <p class="card-emoji">⚙️</p>
            <p class="card-title">{{ t('codeTitle') }}</p>
            <p class="card-desc">{{ t('codeDesc') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="messages-feed">
      <div v-for="(message, index) in messages" :key="index" class="message-row">
        <!-- 用户消息 -->
        <div v-if="message.role === 'user'" class="user-turn">
          <!-- 文件附件卡片（发送时附带的文件） -->
          <div v-if="message.files && message.files.length > 0" class="msg-files">
            <div v-for="(f, i) in message.files" :key="i" class="msg-file-card" :class="{ 'msg-file-image': f.isImage }" @click="openFilePreview(f)">
              <template v-if="f.isImage && f.previewUrl">
                <img :src="f.previewUrl" class="msg-img-thumb" :alt="f.name" />
                <span class="msg-img-name">{{ truncateMsgName(f.name) }}</span>
              </template>
              <template v-else>
                <span class="msg-file-icon">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <div class="msg-file-info">
                  <span class="msg-file-name">{{ truncateMsgName(f.name) }}</span>
                  <span class="msg-file-size">{{ formatMsgSize(f.size) }}</span>
                </div>
              </template>
            </div>
          </div>
          <div class="user-bubble">
            <p class="user-text">{{ message.content }}</p>
          </div>
          <p class="turn-time">{{ formatTime(message.timestamp) }}</p>
        </div>

        <!-- AI消息 -->
        <div v-else class="ai-turn" :class="{ 'is-streaming': message.isStreaming }">
          <div class="ai-header">
            <div class="ai-avatar"><img src="@/ico/bg1.ico" alt="AI" /></div>
            <span class="ai-name">Honghu AI</span>
          </div>
          <div class="ai-body" :class="{ error: message.isError }">
            <!-- 思考中动画 -->
            <div v-if="message.isStreaming && !message.hasStartedStreaming" class="thinking-indicator">
              <div class="thinking-spinner"></div>
              <span class="thinking-text">{{ t('thinking') }}</span>
            </div>
            <!-- AI 回复内容 -->
            <div v-else class="ai-content">
              <div class="message-text-formatted" v-html="formatMessage(message.content)"></div>
              <p v-if="message.isStreaming" class="streaming-indicator">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </p>
            </div>
            <p class="turn-time">{{ formatTime(message.timestamp) }}</p>
          </div>
        </div>
      </div>

      <!-- 加载指示器 -->
      <div v-if="loading && messages.length === 0" class="ai-turn">
        <div class="ai-header">
          <div class="ai-avatar"><img src="@/ico/bg1.ico" alt="AI" /></div>
          <span class="ai-name">Honghu AI</span>
        </div>
        <div class="ai-body">
          <div class="thinking-indicator">
            <div class="thinking-spinner"></div>
            <span class="thinking-text">{{ t('connecting') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 文件预览弹窗 -->
  <Teleport to="body">
    <Transition name="fpm">
      <div v-if="previewFile" class="file-preview-overlay" @click.self="closeFilePreview">
        <div class="file-preview-panel">
          <!-- 顶栏 -->
          <div class="fpm-header">
            <div class="fpm-title-wrap">
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span class="fpm-title">{{ previewFile.name }}</span>
            </div>
            <div class="fpm-header-acts">
              <a v-if="previewResolvedUrl" :href="previewResolvedUrl" :download="previewFile.name" class="fpm-act-btn" title="下载">
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"/></svg>
              </a>
              <button class="fpm-act-btn fpm-close" @click="closeFilePreview">
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          <!-- 内容区 -->
          <div class="fpm-body">
            <!-- 正在获取下载地址 -->
            <div v-if="previewFileLoading" class="fpm-loading">获取文件地址中…</div>
            <!-- 图片 -->
            <div v-else-if="previewFile.isImage && previewResolvedUrl" class="fpm-img-wrap">
              <img :src="previewResolvedUrl" :alt="previewFile.name" class="fpm-img" />
            </div>
            <!-- 图片但无 URL -->
            <div v-else-if="previewFile.isImage && !previewResolvedUrl" class="fpm-other">
              <svg width="52" height="52" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color:var(--text-sub)"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.5" stroke-width="1.5"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 15l-5-5L5 21"/></svg>
              <p class="fpm-other-name">{{ previewFile.name }}</p>
              <p class="fpm-no-preview">无法加载预览</p>
            </div>
            <!-- PDF -->
            <iframe
              v-else-if="isPdfFile(previewFile.name) && previewResolvedUrl"
              :src="previewResolvedUrl"
              class="fpm-iframe"
            />
            <!-- PDF 但无 URL -->
            <div v-else-if="isPdfFile(previewFile.name) && !previewResolvedUrl" class="fpm-other">
              <svg width="52" height="52" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color:#e05c4b"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <p class="fpm-other-name">{{ previewFile.name }}</p>
              <p class="fpm-no-preview">无法加载预览</p>
            </div>
            <!-- 文本文件 -->
            <div v-else-if="isTextFile(previewFile.name)" class="fpm-text-wrap">
              <pre class="fpm-pre">{{ previewFileText }}</pre>
            </div>
            <!-- 其他：无法预览 -->
            <div v-else class="fpm-other">
              <svg width="52" height="52" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color:var(--text-sub)"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <p class="fpm-other-name">{{ previewFile.name }}</p>
              <p class="fpm-other-size">{{ formatMsgSize(previewFile.size) }}</p>
              <a v-if="previewResolvedUrl" :href="previewResolvedUrl" :download="previewFile.name" class="fpm-dl-btn">下载文件</a>
              <p v-else class="fpm-no-preview">此文件类型暂不支持预览</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { t } from '@/utils/i18n'
import { getFileDownloadUrl } from '@/api/rag'
import { useChat } from '@/stores/chatStore'

const chatStore = useChat()

const chatAreaRef = ref(null)

const emit = defineEmits(['quick-start'])

const props = defineProps({
  messages: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// 消息变化时自动滚动到底部
watch(
  () => props.messages,
  () => {
    if (localStorage.getItem('autoScroll') === 'false') return
    nextTick(() => {
      if (chatAreaRef.value) {
        chatAreaRef.value.scrollTop = chatAreaRef.value.scrollHeight
      }
    })
  },
  { deep: true }
)

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const truncateMsgName = (name) => {
  if (!name) return ''
  if (name.length <= 20) return name
  const ext = name.lastIndexOf('.') > 0 ? name.slice(name.lastIndexOf('.')) : ''
  return name.slice(0, 16 - ext.length) + '…' + ext
}

const formatMsgSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// ── 文件预览 Modal ────────────────────────────
const previewFile = ref(null)
const previewFileText = ref('')
const previewFileLoading = ref(false)
const previewResolvedUrl = ref(null) // 当前预览用的最终 URL

const isPdfFile  = (name) => /\.pdf$/i.test(name)
const isTextFile = (name) => /\.(txt|md|csv|json|js|ts|jsx|tsx|py|html|htm|css|xml|yaml|yml|log|sh|bash|sql|toml|ini)$/i.test(name)

const highlightCode = (code) => code
  .replace(/\b(const|let|var|function|return|type|interface|class|extends|import|from|export|if|else|await|async|new|satisfies|typeof)\b/g, '<span class="token-keyword">$1</span>')
  .replace(/(&quot;.*?&quot;|&#039;.*?&#039;|`.*?`)/g, '<span class="token-string">$1</span>')
  .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="token-number">$1</span>')

// 获取可用的预览 URL：优先 blob URL，其次历史接口返回的 downloadUrl，最后再主动请求预签名地址
const resolvePreviewUrl = async (f) => {
  if (f.previewUrl) return f.previewUrl              // 当前会话 blob URL
  if (f.downloadUrl) return f.downloadUrl            // 历史接口直接返回的预签名地址
  if (!f.fileId) return null                         // 无 fileId 无法请求
  const userId = chatStore.userId || localStorage.getItem('userId') || ''
  return await getFileDownloadUrl(f.fileId, userId)  // 主动刷新预签名地址
}

const openFilePreview = async (f) => {
  previewFile.value = f
  previewFileText.value = ''
  previewResolvedUrl.value = null
  previewFileLoading.value = true
  try {
    const url = await resolvePreviewUrl(f)
    previewResolvedUrl.value = url
    if (url && isTextFile(f.name)) {
      const res = await fetch(url)
      previewFileText.value = await res.text()
    }
  } catch {
    previewFileText.value = '无法读取文件内容'
  } finally {
    previewFileLoading.value = false
  }
}

const closeFilePreview = () => {
  previewFile.value = null
  previewFileText.value = ''
  previewResolvedUrl.value = null
}

const handleFpmKey = (e) => { if (e.key === 'Escape') closeFilePreview() }
onMounted(() => document.addEventListener('keydown', handleFpmKey))
onUnmounted(() => document.removeEventListener('keydown', handleFpmKey))

// 格式化消息，支持基本 Markdown 样式
const formatMessage = (content) => {
  if (!content) return ''
  
  // 第一步：转义 HTML 特殊字符（除了换行符）
  let html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
  
  // 第二步：处理代码块（必须在其他处理之前）
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre class="code-block"><code>${highlightCode(code)}</code></pre>`)
  
  // 第三步：处理标题（必须在 # 被其他规则替换前处理）
  html = html.replace(/^### (.+?)$/gm, '<h3 class="md-h3">$1</h3>')
  html = html.replace(/^## (.+?)$/gm, '<h2 class="md-h2">$1</h2>')
  html = html.replace(/^# (.+?)$/gm, '<h1 class="md-h1">$1</h1>')
  
  // 第四步：处理列表（需要保留换行）
  // 分割成行处理
  let lines = html.split('\n')
  lines = lines.map(line => {
    // 处理有序列表
    if (/^\d+\.\s+/.test(line)) {
      return '<li class="ordered-item">' + line.replace(/^\d+\.\s+/, '') + '</li>'
    }
    // 处理无序列表
    if (/^[-*]\s+/.test(line)) {
      return '<li class="unordered-item">' + line.replace(/^[-*]\s+/, '') + '</li>'
    }
    return line
  })
  html = lines.join('\n')
  
  // 第五步：处理行内代码 `code`
  html = html.replace(/`([^`]+)`/g, (_, code) => `<code class="inline-code">${highlightCode(code)}</code>`)
  
  // 第六步：处理强调 **text** __text__
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="bold-text">$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<strong class="bold-text">$1</strong>')
  
  // 第七步：处理斜体 *text* _text_
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic-text">$1</em>')
  html = html.replace(/_([^_]+)_/g, '<em class="italic-text">$1</em>')
  
  // 第八步：处理分割线
  html = html.replace(/^-{3,}$/gm, '<hr class="divider">')
  
  // 第九步：处理段落和换行
  html = html.replace(/\n\n+/g, '</p><p>\n')  // 段落分割
  html = html.replace(/\n(?!<\/)/g, '<br>')    // 单行换行
  html = '<p>' + html + '</p>'                  // 包装段落
  html = html.replace(/<p>\n/g, '<p>')        // 清理
  
  return html
}
</script>

<style scoped>
/* ── 外层滚动容器 ─────────────────────────────── */
.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  scroll-behavior: smooth;
}

/* 滚动*/
.chat-area::-webkit-scrollbar { width: 4px; }
.chat-area::-webkit-scrollbar-track { background: transparent; }
.chat-area::-webkit-scrollbar-thumb { background: rgba(0,0,0,.08); border-radius: 2px; }
.chat-area::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,.15); }

/* ── 欢迎区域 ─────────────────────────────────── */
.welcome-section {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 40px 24px;
}

.welcome-content {
  text-align: center;
  max-width: 680px;
  width: 100%;
}

.welcome-emoji {
  font-size: 48px;
  margin-bottom: 12px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
}

.welcome-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-title);
  margin-bottom: 8px;
  letter-spacing: -0.3px;
}

.welcome-subtitle {
  font-size: 14px;
  color: var(--text-sub);
  margin-bottom: 36px;
}

.welcome-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.welcome-card {
  padding: 16px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  cursor: pointer;
  transition: all .2s ease;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.welcome-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  transform: translateY(-2px);
}

.card-emoji  { font-size: 24px; margin: 0; }
.card-title  { font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 0; }
.card-desc   { font-size: 11px; color: var(--text-sub); margin: 0; line-height: 1.4; }

/* ── 消息──────────────────────────────────── */
.messages-feed {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 28px 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 每一轮消息行 */
.message-row {
  margin-bottom: 28px;
  animation: fadeUp .3s ease-out;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── 用户消息 ─────────────────────────────────── */
.user-turn {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-bubble {
  max-width: 72%;
  background: linear-gradient(135deg, var(--theme-gradient-from) 0%, var(--theme-gradient-to) 100%);
  color: #fff;
  border-radius: 20px 20px 8px 20px;
  padding: 11px 16px;
  box-shadow: 0 8px 18px rgba(45, 134, 89, 0.14);
  transition: transform .18s ease, box-shadow .18s ease;
}

.user-bubble:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(45, 134, 89, 0.18);
}

.user-text {
  font-size: var(--chat-font-size, 14px);
  line-height: var(--chat-line-height, 1.65);
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #fff;
}

/* ── AI 消息（Copilot/Gemini 开放式排版）────────── */
.ai-turn {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.ai-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--border-color);
}

.ai-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ai-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0;
}

.ai-body {
  padding-left: 36px; /* avatar宽度 + gap 对齐 */
}

.ai-body.error .message-text-formatted {
  color: #c23b22;
  background: #fef5f5;
  border-left: 3px solid #e8c5c0;
  padding: 10px 14px;
  border-radius: 0 8px 8px 0;
}

/* 时间*/
.turn-time {
  font-size: 11px;
  color: var(--text-sub);
  opacity: .65;
  margin: 4px 0 0 0;
}

/* ── AI 思考动──────────────────────────────── */
.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}

.thinking-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.thinking-text {
  font-size: 13px;
  color: var(--subtitle-color);
}

/* ── 格式化文本（Gemini/Copilot 风格───────────── */
.ai-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-text-formatted {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
  font-size: var(--chat-font-size, 14.5px);
  line-height: var(--chat-line-height, 1.8);
  color: var(--text-primary);
  word-break: break-word;
  overflow-wrap: break-word;
  -webkit-font-smoothing: antialiased;
}

.message-text-formatted p {
  margin: 0 0 14px 0;
  line-height: 1.8;
}

.message-text-formatted p:last-child { margin-bottom: 0; }

/* 代码*/
.message-text-formatted .code-block {
  background: var(--code-bg, var(--bg-secondary));
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--primary-color);
  border-radius: 8px;
  color: var(--code-fg, var(--text-primary));
  padding: 14px 16px;
  margin: 14px 0;
  overflow-x: auto;
  font-family: 'Fira Code', 'JetBrains Mono', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  display: block;
}

.message-text-formatted .code-block code {
  background: transparent;
  padding: 0;
  font-size: 13px;
  color: var(--code-fg, var(--text-primary));
}

/* 行内代码 */
.message-text-formatted .inline-code {
  background: var(--code-bg, var(--bg-secondary));
  color: var(--primary-color);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Fira Code', 'JetBrains Mono', 'Monaco', monospace;
  font-size: 13px;
  border: 1px solid var(--border-color);
}

.message-text-formatted .code-block .token-keyword,
.message-text-formatted .inline-code .token-keyword {
  color: var(--code-keyword);
}

.message-text-formatted .code-block .token-string,
.message-text-formatted .inline-code .token-string {
  color: var(--code-string);
}

.message-text-formatted .code-block .token-number,
.message-text-formatted .inline-code .token-number {
  color: var(--code-number);
}

/* 粗体 / 斜体 */
.message-text-formatted .bold-text   { font-weight: 700; color: var(--text-title); }
.message-text-formatted .italic-text { font-style: italic; color: var(--text-primary); }

/* 标题 */
.message-text-formatted .md-h1 {
  font-size: 22px; font-weight: 800; color: var(--text-title);
  margin: 24px 0 12px; padding-bottom: 8px;
  border-bottom: 2px solid var(--border-color); line-height: 1.3;
}
.message-text-formatted .md-h2 {
  font-size: 18px; font-weight: 700; color: var(--text-title);
  margin: 20px 0 10px; padding-bottom: 6px;
  border-bottom: 1px solid var(--border-color); line-height: 1.3;
}
.message-text-formatted .md-h3 {
  font-size: 15px; font-weight: 700; color: var(--primary-color);
  margin: 16px 0 8px; line-height: 1.3;
}

/* 列表 */
.message-text-formatted .ordered-item,
.message-text-formatted .unordered-item {
  display: list-item;
  margin-left: 28px;
  margin-bottom: 8px;
  line-height: 1.75;
}

.message-text-formatted .ordered-item  { list-style-type: decimal; }
.message-text-formatted .unordered-item {
  list-style: none;
  padding-left: 4px;
}
.message-text-formatted .unordered-item::before {
  content: '\2022';
  color: var(--primary-color);
  font-weight: 700;
  margin-right: 8px;
  margin-left: -18px;
}

/* 分割*/
.message-text-formatted .divider {
  border: none;
  height: 1px;
  background: var(--border-color);
  margin: 18px 0;
}

/* 流式打字*/
.streaming-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
  height: 18px;
}

.streaming-indicator .dot,
.dot {
  width: 5px;
  height: 5px;
  background: var(--primary-light);
  border-radius: 50%;
  animation: bounce 1.4s infinite;
}

.streaming-indicator .dot:nth-child(2),
.dot:nth-child(2) { animation-delay: .2s; }
.streaming-indicator .dot:nth-child(3),
.dot:nth-child(3) { animation-delay: .4s; }

@keyframes bounce {
  0%, 80%, 100% { opacity: .4; transform: scale(.75); }
  40%           { opacity: 1;  transform: scale(1); }
}

/* ── 响应式：手机───────────────────────────── */
@media (max-width: 768px) {
  .messages-feed {
    max-width: 100%;
    padding: 16px 14px 12px;
  }

  .user-bubble {
    max-width: 88%;
  }

  .welcome-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .welcome-title { font-size: 22px; }
  .welcome-emoji { font-size: 44px; }
}

/* ── 用户消息 文件附件区 ──────────────────────── */
.msg-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  margin-bottom: 6px;
  max-width: 72%;
  align-self: flex-end;
}

.msg-file-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-primary);
  border: 1.5px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  max-width: 220px;
  min-width: 120px;
  animation: fileCardIn .35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  transition: transform .2s, box-shadow .2s;
  cursor: pointer;
}

.msg-file-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0,0,0,0.1);
}

/* 图片卡片：竖向布局 */
.msg-file-card.msg-file-image {
  flex-direction: column;
  padding: 6px;
  gap: 5px;
  min-width: 90px;
  max-width: 140px;
}

.msg-img-thumb {
  width: 128px;
  height: 96px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
  flex-shrink: 0;
}

.msg-img-name {
  font-size: 11px;
  color: var(--text-sub);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 128px;
}

.msg-file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--hover-bg);
  color: var(--primary-color);
  flex-shrink: 0;
}

.msg-file-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.msg-file-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.msg-file-size {
  font-size: 10px;
  color: var(--text-sub);
}

@keyframes fileCardIn {
  0%   { opacity: 0; transform: scale(0.7) translateY(8px); }
  60%  { opacity: 1; transform: scale(1.04) translateY(-2px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

/* ── 文件预览 Modal ──────────────────────────── */
.file-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,0.52);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.file-preview-panel {
  background: var(--bg-primary);
  border-radius: 18px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.22);
  width: 100%;
  max-width: 960px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fpm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  gap: 12px;
}

.fpm-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-sub);
  min-width: 0;
  flex: 1;
}

.fpm-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fpm-header-acts {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.fpm-act-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-sub);
  transition: background 0.18s, color 0.18s;
  text-decoration: none;
}

.fpm-act-btn:hover { background: var(--hover-bg); color: var(--primary-color); }
.fpm-act-btn.fpm-close:hover { background: rgba(220,38,38,0.1); color: #e05c4b; }

.fpm-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 图片预览 */
.fpm-img-wrap {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background: var(--bg-secondary, #f5f5f5);
}

.fpm-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.14);
}

/* PDF iframe */
.fpm-iframe {
  flex: 1;
  width: 100%;
  height: 0;
  min-height: 200px;
  border: none;
}

/* 文本预览 */
.fpm-text-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.fpm-pre {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 13px;
  line-height: 1.65;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.fpm-loading {
  padding: 48px;
  text-align: center;
  color: var(--text-sub);
  font-size: 14px;
}

/* 不支持预览 */
.fpm-other {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px;
}

.fpm-other-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.fpm-other-size { font-size: 13px; color: var(--text-sub); margin: 0; }

.fpm-dl-btn {
  margin-top: 8px;
  padding: 9px 28px;
  background: linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to));
  color: #fff;
  border-radius: 12px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: opacity .2s, transform .2s;
}
.fpm-dl-btn:hover { opacity: 0.88; transform: translateY(-1px); }

.fpm-no-preview { font-size: 13px; color: var(--text-sub); margin: 0; }

/* 弹窗动画 */
.fpm-enter-active { transition: opacity 0.25s ease; }
.fpm-leave-active { transition: opacity 0.2s ease; }
.fpm-enter-from, .fpm-leave-to { opacity: 0; }
.fpm-enter-active .file-preview-panel { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.fpm-leave-active .file-preview-panel { transition: transform 0.2s ease; }
.fpm-enter-from .file-preview-panel { transform: scale(0.9) translateY(20px); }
.fpm-leave-to .file-preview-panel { transform: scale(0.95) translateY(8px); }
</style>
