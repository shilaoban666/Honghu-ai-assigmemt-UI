<template>
  <div class="input-section" @click="closeAllPopups">
    <!-- 文件预览 -->
    <div v-if="attachedFiles.length > 0" class="files-preview">
      <div v-for="(file, index) in attachedFiles" :key="index" class="file-chip">
        <span class="file-chip-icon">📄</span>
        <span class="file-chip-name">{{ file.name }}</span>
        <button @click="removeFile(index)" class="file-chip-remove">✕</button>
      </div>
    </div>

    <!-- 主输入卡片 -->
    <div class="input-card" :class="{ focused: isFocused }">
      <!-- 文本框 -->
      <textarea
        ref="textareaRef"
        v-model="message"
        @keydown.enter="handleEnterKey"
        @focus="isFocused = true"
        @blur="isFocused = false"
        @input="autoResize"
        :placeholder="t('inputPlaceholder')"
        class="chat-textarea"
        rows="1"
      ></textarea>

      <!-- 底部工具栏 -->
      <div class="toolbar">
        <!-- 左侧图标组 -->
        <div class="toolbar-left">
          <!-- 模型选择 -->
          <button
            class="tool-btn"
            :class="{ active: showModelPicker }"
            @click.stop="showModelPicker = !showModelPicker"
            :title="selectedModelLabel"
          >
            <span class="model-icon-emoji">{{ selectedModelIcon }}</span>
          </button>

          <!-- 联网搜索 -->
          <button class="tool-btn" :class="{ active: webSearchEnabled }" @click.stop="webSearchEnabled = !webSearchEnabled" :title="t('webSearch')">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="1.8"/><ellipse cx="12" cy="12" rx="4" ry="10" stroke-width="1.8"/><line x1="2" y1="12" x2="22" y2="12" stroke-width="1.8"/></svg>
          </button>

          <!-- 上传文件 -->
          <button class="tool-btn" @click.stop="triggerFileInput" :title="t('uploadFile')">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21.44 11.05l-9.19 9.19a6.01 6.01 0 01-8.49-8.49l9.19-9.19a4.008 4.008 0 015.66 5.66l-9.2 9.19a2.003 2.003 0 01-2.83-2.83l8.49-8.48"/></svg>
          </button>
          <input ref="fileInput" type="file" @change="handleFileSelect" accept=".pdf,.jpg,.jpeg,.png,.gif" style="display:none" multiple />

          <!-- 技能商店 -->
          <button class="tool-btn" @click.stop="showSkillStore = true" :title="t('skillStore')">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke-width="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke-width="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke-width="1.8"/></svg>
          </button>
        </div>

        <!-- 右侧：发送按钮 -->
        <button
          class="send-btn"
          :disabled="!message.trim()"
          @click="sendMessage"
        >
          <svg v-if="!loading" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
          <span v-else class="spinner"></span>
        </button>
      </div>

      <!-- 模型选择器弹出面板 -->
      <Transition name="pop">
        <div v-if="showModelPicker" class="model-picker" @click.stop>
          <div class="picker-search">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke-width="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke-width="2" stroke-linecap="round"/></svg>
            <input v-model="modelSearch" class="picker-input" :placeholder="t('searchModel')" />
          </div>
          <div class="picker-list">
            <div
              v-for="m in filteredModels"
              :key="m.value"
              class="picker-item"
              :class="{ selected: selectedModel === m.value }"
              @click="selectModel(m)"
            >
              <span class="picker-item-icon">{{ m.icon }}</span>
              <span class="picker-item-name">{{ m.label }}</span>
              <svg v-if="selectedModel === m.value" class="picker-check" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- LobeHub 风格：技能/MCP 胶囊栏 -->
    <div class="skill-mcp-wrapper">
      <div class="skill-mcp-pill" @click.stop="showSkillStore = true">
        <div class="skill-mcp-left">
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke-width="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke-width="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke-width="1.8"/></svg>
          <span>{{ t('addSkillsForAI') }}</span>
        </div>
        <div class="skill-mcp-right">
          <span class="mcp-tag" v-for="t in activeSkillTags" :key="t">
            {{ t }}
            <button @click.stop="removeSkillTag(t)" class="mcp-tag-x">✕</button>
          </span>
          <span class="mcp-dot" title="Gmail">M</span>
          <span class="mcp-dot g" title="Google">G</span>
          <span class="mcp-dot s" title="Slack">S</span>
          <span class="mcp-dot gh" title="GitHub">GH</span>
          <span class="mcp-dot n" title="Notion">N</span>
          <span class="mcp-dot x" title="X">X</span>
        </div>
      </div>
    </div>

    <!-- 技能商店弹窗 -->
    <SkillStoreDialog :visible="showSkillStore" @close="showSkillStore = false" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useChat } from '@/stores/chatStore'
import { persistentStreamChat } from '@/api/chat'
import SkillStoreDialog from '@/components/SkillStoreDialog.vue'
import { t } from '@/utils/i18n'

defineProps({
  loading: { type: Boolean, default: false }
})
const emit = defineEmits(['send-message'])

const chatStore = useChat()
const message = ref('')
const attachedFiles = ref([])
const fileInput = ref(null)
const textareaRef = ref(null)
const isFocused = ref(false)

// 弹出面板状态
const showModelPicker = ref(false)
const showSkillStore = ref(false)
const webSearchEnabled = ref(false)
const modelSearch = ref('')

// 技能标签
const activeSkillTags = ref([])
const removeSkillTag = (t) => {
  activeSkillTags.value = activeSkillTags.value.filter(x => x !== t)
}

// 模型数据
const models = [
  { value: null,                  label: '默认模型',          icon: '🤖', group: 'recommended' },
  { value: 'claude-opus-4-6',    label: 'Claude Opus 4.6',   icon: '🟣', group: 'recommended' },
  { value: 'claude-haiku-4-5',   label: 'Claude Haiku 4.5',  icon: '🟣', group: 'recommended' },
  { value: 'gpt-5.4',            label: 'GPT-5.4',           icon: '🟢', group: 'recommended' },
  { value: 'gpt-5.3-codex',      label: 'GPT-5.3-Codex',     icon: '🟢', group: 'recommended' },
  { value: 'claude-sonnet-4-6',  label: 'Claude Sonnet 4.6',icon: '🟣', group: 'recommended' },
  { value: 'deepseek-r1:8b',     label: 'DeepSeek R1 8B',    icon: '🔵', group: 'other' },
  { value: 'gemini-3.1-pro',     label: 'Gemini 3.1 Pro',    icon: '✦',  group: 'other' },
  { value: 'gemini-3-flash',     label: 'Gemini 3 Flash',    icon: '✦',  group: 'other' },
  { value: 'gemini-3-pro',       label: 'Gemini 3 Pro',      icon: '✦',  group: 'other' },
  { value: 'gemini-2.5-pro',     label: 'Gemini 2.5 Pro',    icon: '✦',  group: 'other' },
  { value: 'gpt-5.1',            label: 'GPT-5.1',           icon: '🟢', group: 'other' },
  { value: 'gpt-5-mini',         label: 'GPT-5 mini',        icon: '🟢', group: 'other' },
  { value: 'gpt-5.1-codex',      label: 'GPT-5.1-Codex',     icon: '🟢', group: 'other' },
  { value: 'gpt-5.1-codex-max',  label: 'GPT-5.1-Codex-Max', icon: '🟢', group: 'other' },
  { value: 'gpt-4o',             label: 'GPT-4o',            icon: '🟢', group: 'other' },
  { value: 'gpt-4.1',            label: 'GPT-4.1',           icon: '🟢', group: 'other' },
]

const selectedModel = ref(null)

const selectedModelIcon = computed(() => {
  const m = models.find(x => x.value === selectedModel.value)
  return m ? m.icon : '🤖'
})
const selectedModelLabel = computed(() => {
  const m = models.find(x => x.value === selectedModel.value)
  return m ? m.label : t('defaultModel')
})

const filteredModels = computed(() => {
  const q = modelSearch.value.toLowerCase()
  if (!q) return models
  return models.filter(m => m.label.toLowerCase().includes(q))
})

const selectModel = (m) => {
  selectedModel.value = m.value
  showModelPicker.value = false
  modelSearch.value = ''
}

const closeAllPopups = () => {
  showModelPicker.value = false
}

// 文件处理
const triggerFileInput = () => fileInput.value?.click()

const handleFileSelect = (event) => {
  Array.from(event.target.files || []).forEach(file => {
    attachedFiles.value.push({ name: file.name, file, size: file.size })
  })
  event.target.value = ''
}

const removeFile = (index) => attachedFiles.value.splice(index, 1)

// 回车键处理
const handleEnterKey = (e) => {
  const shortcut = localStorage.getItem('sendShortcut') || 'enter'
  if (shortcut === 'enter') {
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  } else {
    // ctrl+enter mode
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      sendMessage()
    }
  }
}

// 发送
const sendMessage = () => {
  if (!message.value.trim()) return
  const content = message.value.trim()
  const files = attachedFiles.value.map(f => f.file)

  emit('send-message', { content, files, model: selectedModel.value, isUserMessage: true })
  emit('send-message', { content: '', isStreaming: true, isUserMessage: false, timestamp: Date.now(), isInitialMessage: true })

  const sessionId = typeof chatStore.currentChatId === 'string' ? chatStore.currentChatId : undefined
  const chatRequest = {
    message: content,
    sessionId,
    model: selectedModel.value || null,
    systemMessage: '你是一个有帮助的AI助手，请用中文回答问题',
    temperature: 0.7,
    maxTokens: 4096
  }

  persistentStreamChat(
    chatRequest,
    (response) => {
      if (response && response.content) {
        emit('send-message', { content: response.content, isStreaming: true, isUserMessage: false, timestamp: response.timestamp, model: response.model })
      }
    },
    (error) => {
      emit('send-message', { content: '出错了，请稍后重试: ' + error.message, isError: true })
    },
    (fullText) => {
      emit('send-message', { content: fullText, isStreaming: false, isUserMessage: false })
    }
  )

  message.value = ''
  attachedFiles.value = []
  if (textareaRef.value) textareaRef.value.style.height = 'auto'
}

const autoResize = (e) => {
  e.target.style.height = 'auto'
  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
}
</script>

<style scoped>
/* ─── 主容器 ─── */
.input-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 24px 18px;
  background: var(--bg-primary);
}

/* ─── 输入卡片 ─── */
.input-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: 16px;
  border: 1.5px solid var(--border-color);
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
  transition: border-color 0.2s, box-shadow 0.2s;
  overflow: visible;
  width: 100%;
  max-width: 780px;
}
.input-card.focused {
  border-color: var(--primary-color);
  box-shadow: 0 2px 16px rgba(45,134,89,0.08);
}

/* ─── 文本框 ─── */
.chat-textarea {
  flex: 1;
  border: none;
  background: none;
  padding: 16px 18px 4px;
  font-size: 15px;
  font-family: inherit;
  color: var(--text-primary);
  resize: none;
  outline: none;
  min-height: 28px;
  max-height: 200px;
  line-height: 1.6;
  overflow-y: auto;
}
.chat-textarea::placeholder {
  color: var(--text-sub);
}

/* ─── 底部工具栏 ─── */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 10px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tool-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: none;
  color: var(--text-sub);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  position: relative;
}
.tool-btn:hover {
  background: var(--hover-bg-medium);
  color: var(--primary-color);
}
.tool-btn.active {
  background: var(--hover-bg-medium);
  color: var(--primary-color);
}

.model-icon-emoji {
  font-size: 20px;
  line-height: 1;
}

/* ─── 发送按钮 ─── */
.send-btn {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to));
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.send-btn:hover:not(:disabled) {
  transform: scale(1.06);
  box-shadow: 0 4px 14px rgba(45,134,89,0.25);
}
.send-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── 模型选择器面板 ─── */
.model-picker {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 10px;
  width: 280px;
  background: var(--bg-primary);
  border: 1.5px solid var(--border-color);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.14);
  z-index: 100;
  overflow: hidden;
}

.pop-enter-active,
.pop-leave-active {
  transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

.picker-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-color);
}
.picker-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
}
.picker-input::placeholder { color: var(--text-sub); }

.picker-list {
  max-height: 340px;
  overflow-y: auto;
  padding: 4px;
}

.picker-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.12s;
}
.picker-item:hover {
  background: var(--hover-bg);
}
.picker-item.selected {
  background: var(--hover-bg-medium);
}

.picker-item-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}
.picker-item-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}
.picker-check {
  color: var(--primary-color);
  flex-shrink: 0;
}

.picker-list::-webkit-scrollbar { width: 4px; }
.picker-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }

/* ─── 文件预览 chips ─── */
.files-preview {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  max-width: 780px;
  width: 100%;
}
.file-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 5px 12px;
  font-size: 12px;
  color: var(--text-primary);
  animation: chipIn 0.2s ease;
}
@keyframes chipIn {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}
.file-chip-icon { font-size: 14px; }
.file-chip-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-chip-remove {
  background: none;
  border: none;
  color: var(--text-sub);
  cursor: pointer;
  font-size: 13px;
  padding: 0;
  transition: color 0.15s;
}
.file-chip-remove:hover { color: #e05c4b; }

/* ─── 技能/MCP 胶囊栏（LobeHub 风格） ─── */
.skill-mcp-wrapper {
  display: flex;
  justify-content: center;
  margin-top: -4px;
}

.skill-mcp-pill {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 7px 18px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.skill-mcp-pill:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 12px rgba(45,134,89,0.08);
}

.skill-mcp-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-sub);
  flex-shrink: 0;
  transition: color 0.15s;
}
.skill-mcp-pill:hover .skill-mcp-left {
  color: var(--primary-color);
}

.skill-mcp-right {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: nowrap;
  justify-content: flex-end;
}

.mcp-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--hover-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
  color: var(--primary-color);
  font-weight: 500;
}
.mcp-tag-x {
  background: none;
  border: none;
  color: var(--text-sub);
  cursor: pointer;
  font-size: 11px;
  padding: 0;
  line-height: 1;
}
.mcp-tag-x:hover { color: #e05c4b; }

.mcp-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background: #ea4335;
  flex-shrink: 0;
  transition: transform 0.15s;
  line-height: 1;
}
.mcp-dot:hover { transform: scale(1.15); }
.mcp-dot.g { background: #34a853; }
.mcp-dot.s { background: #4a154b; }
.mcp-dot.gh { background: #24292f; font-size: 8px; }
.mcp-dot.n { background: #000000; }
.mcp-dot.x { background: #1d9bf0; }

/* ─── 手机端 ─── */
@media (max-width: 768px) {
  .input-section {
    padding: 8px 12px 14px;
  }
  .chat-textarea {
    font-size: 14px;
    padding: 12px 14px 4px;
  }
  .model-picker {
    width: 240px;
  }
}
</style>
