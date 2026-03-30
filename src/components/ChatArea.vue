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
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { t } from '@/utils/i18n'

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
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>')
  
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
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
  
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
  border-radius: 18px 18px 4px 18px;
  padding: 11px 16px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.08);
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
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--primary-color);
  border-radius: 8px;
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
}

/* 行内代码 */
.message-text-formatted .inline-code {
  background: var(--bg-secondary);
  color: var(--primary-color);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Fira Code', 'JetBrains Mono', 'Monaco', monospace;
  font-size: 13px;
  border: 1px solid var(--border-color);
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
</style>
