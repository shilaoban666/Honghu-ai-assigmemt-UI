<template>
  <div class="input-section" @click="closeAllPopups">
    <!-- 主输入卡片 -->
    <div class="input-card" :class="{ focused: isFocused, 'has-files': attachedFiles.length > 0 }">
      <!-- 文件预览（在输入框内部，Claude 风格） -->
      <TransitionGroup name="file-preview" tag="div" class="files-preview-inner" v-show="attachedFiles.length > 0">
        <div v-for="(file, index) in attachedFiles" :key="file.name + index" class="file-card">
          <!-- 图片缩略图 -->
          <template v-if="isImageFile(file)">
            <div class="file-card-thumb">
              <img :src="getFilePreviewUrl(file)" alt="" class="thumb-img" :class="{ 'thumb-dim': file.status === 'uploading' }" />
              <div v-if="file.status === 'uploading'" class="file-upload-overlay">
                <svg class="upload-spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" width="22" height="22"><circle cx="12" cy="12" r="9" stroke-width="2.5" stroke-opacity="0.25"/><path d="M12 3a9 9 0 0 1 9 9" stroke-width="2.5" stroke-linecap="round"/></svg>
                <span class="upload-pct">{{ file.progress }}%</span>
              </div>
              <div v-else-if="file.status === 'error'" class="file-error-overlay" :title="file.errorMsg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20"><circle cx="12" cy="12" r="9" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>
              </div>
              <button @click="removeFile(index)" class="file-card-close">
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <span class="file-card-name">{{ truncateName(file.name) }}</span>
          </template>
          <!-- 普通文件 -->
          <template v-else>
            <div class="file-card-doc" :class="{ 'doc-uploading': file.status === 'uploading', 'doc-error': file.status === 'error' }">
              <span class="file-card-doc-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <div class="file-card-doc-info">
                <span class="file-card-doc-name">{{ truncateName(file.name) }}</span>
                <span class="file-card-doc-size">
                  <template v-if="file.status === 'uploading'">上传中 {{ file.progress }}%</template>
                  <template v-else-if="file.status === 'error'">上传失败</template>
                  <template v-else>{{ formatSize(file.size) }}</template>
                </span>
                <div v-if="file.status === 'uploading'" class="doc-progress-track">
                  <div class="doc-progress-fill" :style="{ width: file.progress + '%' }"></div>
                </div>
              </div>
              <button @click="removeFile(index)" class="file-card-close doc-close">
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </template>
        </div>
      </TransitionGroup>

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
            <img :src="selectedModelIconUrl" class="provider-icon" alt="" />
          </button>

          <!-- 联网搜索 -->
          <button class="tool-btn" :class="{ active: webSearchEnabled }" @click.stop="webSearchEnabled = !webSearchEnabled" :title="t('webSearch')">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="1.8"/><ellipse cx="12" cy="12" rx="4" ry="10" stroke-width="1.8"/><line x1="2" y1="12" x2="22" y2="12" stroke-width="1.8"/></svg>
          </button>

          <!-- 上传按钮 + 下拉菜单 -->
          <div class="upload-dropdown-wrapper" ref="uploadDropdownRef">
            <button class="tool-btn" :class="{ active: showUploadMenu }" @click.stop="showUploadMenu = !showUploadMenu" :title="t('uploadFile')">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21.44 11.05l-9.19 9.19a6.01 6.01 0 01-8.49-8.49l9.19-9.19a4.008 4.008 0 015.66 5.66l-9.2 9.19a2.003 2.003 0 01-2.83-2.83l8.49-8.48"/></svg>
            </button>
            <!-- 上传下拉菜单 -->
            <Transition name="upload-pop">
              <div v-if="showUploadMenu" class="upload-menu" @click.stop>
                <button class="upload-menu-item" @click="triggerImageInput">
                  <span class="upload-menu-icon">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.8"/><circle cx="8.5" cy="8.5" r="1.5" stroke-width="1.8"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 15l-5-5L5 21"/></svg>
                  </span>
                  <span class="upload-menu-text">{{ t('uploadImage') }}</span>
                </button>
                <button class="upload-menu-item" @click="triggerFileInput">
                  <span class="upload-menu-icon">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>
                  <span class="upload-menu-text">{{ t('uploadFileOption') }}</span>
                </button>
                <button class="upload-menu-item" @click="triggerScreenCapture">
                  <span class="upload-menu-icon">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path v-if="!isMobileDevice" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle v-if="!isMobileDevice" cx="12" cy="13" r="4" stroke-width="1.8"/><path v-if="isMobileDevice" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle v-if="isMobileDevice" cx="12" cy="13" r="4" stroke-width="1.8"/></svg>
                  </span>
                  <span class="upload-menu-text">{{ isMobileDevice ? t('takePhoto') : t('screenshot') }}</span>
                </button>
              </div>
            </Transition>
          </div>
          <input ref="fileInput" type="file" @change="handleFileSelect" accept="*/*" style="display:none" multiple />
          <input ref="imageInput" type="file" @change="handleImageSelect" accept="image/*" style="display:none" multiple />
          <input ref="cameraInput" type="file" @change="handleCameraCapture" accept="image/*" capture="environment" style="display:none" />

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
            <!-- 第一梯队 -->
            <template v-if="tier1Models.length > 0 && !modelSearch">
              <div class="picker-group-label">{{ t('tier1') }} ⚡⚡⚡</div>
              <div
                v-for="(m, idx) in tier1Models"
                :key="m.value"
                class="picker-item"
                :class="{ selected: selectedModel === m.value }"
                :style="{ '--item-index': idx }"
                @click="selectModel(m)"
              >
                <img :src="getModelIconUrl(m.value, m.provider)" class="provider-icon" alt="" />
                <span class="picker-item-name">{{ m.label }}</span>
                <span v-if="getModelRank(m.value) === 1" class="medal-badge gold">1st</span>
                <span v-else-if="getModelRank(m.value) === 2" class="medal-badge silver">2nd</span>
                <span v-else-if="getModelRank(m.value) === 3" class="medal-badge bronze">3rd</span>
                <span v-if="m.local" class="picker-badge local">Local</span>
                <svg v-if="selectedModel === m.value" class="picker-check" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              </div>
            </template>
            <!-- 第二梯队 -->
            <template v-if="tier2Models.length > 0 && !modelSearch">
              <div class="picker-group-label">{{ t('tier2') }} ⚡⚡</div>
              <div
                v-for="(m, idx) in tier2Models"
                :key="m.value"
                class="picker-item"
                :class="{ selected: selectedModel === m.value }"
                :style="{ '--item-index': idx + tier1Models.length }"
                @click="selectModel(m)"
              >
                <img :src="getModelIconUrl(m.value, m.provider)" class="provider-icon" alt="" />
                <span class="picker-item-name">{{ m.label }}</span>
                <span v-if="getModelRank(m.value) === 1" class="medal-badge gold">1st</span>
                <span v-else-if="getModelRank(m.value) === 2" class="medal-badge silver">2nd</span>
                <span v-else-if="getModelRank(m.value) === 3" class="medal-badge bronze">3rd</span>
                <span v-if="m.local" class="picker-badge local">Local</span>
                <svg v-if="selectedModel === m.value" class="picker-check" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              </div>
            </template>
            <!-- 第三梯队 -->
            <template v-if="tier3Models.length > 0 && !modelSearch">
              <div class="picker-group-label">{{ t('tier3') }}⚡</div>
              <div
                v-for="(m, idx) in tier3Models"
                :key="m.value"
                class="picker-item"
                :class="{ selected: selectedModel === m.value }"
                :style="{ '--item-index': idx + tier1Models.length + tier2Models.length }"
                @click="selectModel(m)"
              >
                <img :src="getModelIconUrl(m.value, m.provider)" class="provider-icon" alt="" />
                <span class="picker-item-name">{{ m.label }}</span>
                <span v-if="m.local" class="picker-badge local">Local</span>
                <svg v-if="selectedModel === m.value" class="picker-check" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              </div>
            </template>
            <!-- 第四梯队 -->
            <template v-if="tier4Models.length > 0 && !modelSearch">
              <div class="picker-group-label">{{ t('tier4') }}</div>
              <div
                v-for="(m, idx) in tier4Models"
                :key="m.value"
                class="picker-item"
                :class="{ selected: selectedModel === m.value }"
                :style="{ '--item-index': idx + tier1Models.length + tier2Models.length + tier3Models.length }"
                @click="selectModel(m)"
              >
                <img :src="getModelIconUrl(m.value, m.provider)" class="provider-icon" alt="" />
                <span class="picker-item-name">{{ m.label }}</span>
                <span v-if="m.local" class="picker-badge local">Local</span>
                <svg v-if="selectedModel === m.value" class="picker-check" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              </div>
            </template>
            <!-- 搜索结果（不分组） -->
            <template v-if="modelSearch">
              <div
                v-for="(m, idx) in filteredModels"
                :key="m.value"
                class="picker-item"
                :class="{ selected: selectedModel === m.value }"
                :style="{ '--item-index': idx }"
                @click="selectModel(m)"
              >
                <img :src="getModelIconUrl(m.value, m.provider)" class="provider-icon" alt="" />
                <span class="picker-item-name">{{ m.label }}</span>
                <span v-if="getModelRank(m.value) === 1" class="medal-badge gold">1st</span>
                <span v-else-if="getModelRank(m.value) === 2" class="medal-badge silver">2nd</span>
                <span v-else-if="getModelRank(m.value) === 3" class="medal-badge bronze">3rd</span>
                <span v-if="m.local" class="picker-badge local">Local</span>
                <svg v-if="selectedModel === m.value" class="picker-check" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              </div>
            </template>
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

    <!-- 截屏编辑器 -->
    <ScreenshotEditor
      :visible="showScreenshotEditor"
      :image="screenshotImage"
      @confirm="handleScreenshotConfirm"
      @cancel="showScreenshotEditor = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useChat } from '@/stores/chatStore'
import { persistentStreamChat } from '@/api/chat'
import { getUploadUrl, uploadFileToS3, getFileExtension } from '@/api/rag'
import SkillStoreDialog from '@/components/SkillStoreDialog.vue'
import ScreenshotEditor from '@/components/ScreenshotEditor.vue'
import { t } from '@/utils/i18n'

defineProps({
  loading: { type: Boolean, default: false }
})
const emit = defineEmits(['send-message'])

const chatStore = useChat()
const message = ref('')
const attachedFiles = ref([])
const fileInput = ref(null)
const imageInput = ref(null)
const cameraInput = ref(null)
const textareaRef = ref(null)
const isFocused = ref(false)
const uploadDropdownRef = ref(null)

// 弹出面板状态
const showModelPicker = ref(false)
const showSkillStore = ref(false)
const showUploadMenu = ref(false)
const webSearchEnabled = ref(false)
const modelSearch = ref('')

// 截屏编辑器
const showScreenshotEditor = ref(false)
const screenshotImage = ref(null)

// 移动端检测
const isMobileDevice = computed(() => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))

// 技能标签
const activeSkillTags = ref([])
const removeSkillTag = (t) => {
  activeSkillTags.value = activeSkillTags.value.filter(x => x !== t)
}

// LobeHub 图标 CDN 基础 URL
const ICON_CDN = 'https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons'

// Provider → LobeHub icon slug 映射
const providerIconSlug = {
  'openai':    'openai',
  'anthropic': 'anthropic',
  'google':    'google',
  'deepseek':  'deepseek',
  'ollama':    'ollama',
  'meta':      'meta',
  'zhipu':     'zhipu',
  'xai':       'xai',
  'kimi':      'kimi',
  'minimax':   'minimax',
  'xiaomi':    'openai',
  'alibaba':   'qwen',
}

// 模型名 → 更精确的 icon slug（优先匹配模型级别图标）
const modelIconSlug = {
  'claude':   'claude',
  'gemini':   'gemini',
  'grok':     'grok',
  'kimi':     'kimi',
  'minimax':  'minimax',
  'glm':      'chatglm',
  'moonshot': 'moonshot',
  'qwen':     'qwen',
  'tongyi':   'qwen',
}

// 获取模型图标 URL
const getModelIconUrl = (modelCode, provider) => {
  if (modelCode) {
    const c = modelCode.toLowerCase()
    for (const [keyword, slug] of Object.entries(modelIconSlug)) {
      if (c.includes(keyword)) return `${ICON_CDN}/${slug}.svg`
    }
  }
  const slug = providerIconSlug[provider] || 'openai'
  return `${ICON_CDN}/${slug}.svg`
}

// 从 provider_code 中提取 provider 关键词
const getProvider = (code) => {
  if (!code) return 'openai'
  const c = code.toLowerCase()
  if (c.includes('anthropic') || c.includes('claude')) return 'anthropic'
  if (c.includes('google') || c.includes('gemini')) return 'google'
  if (c.includes('deepseek')) return 'deepseek'
  if (c.includes('ollama')) return 'ollama'
  if (c.includes('meta') || c.includes('llama')) return 'meta'
  if (c.includes('zhipu') || c.includes('glm')) return 'zhipu'
  if (c.includes('xai') || c.includes('grok')) return 'xai'
  if (c.includes('moonshot') || c.includes('kimi')) return 'kimi'
  if (c.includes('minimax')) return 'minimax'
  if (c.includes('alibaba') || c.includes('qwen') || c.includes('tongyi')) return 'alibaba'
  return 'openai'
}

// 从模型名推断 provider
const getProviderFromModel = (modelCode) => {
  if (!modelCode) return 'openai'
  const c = modelCode.toLowerCase()
  if (c.includes('claude')) return 'anthropic'
  if (c.includes('gemini')) return 'google'
  if (c.includes('deepseek')) return 'deepseek'
  if (c.includes('gpt') || c.includes('o1') || c.includes('o3') || c.includes('codex')) return 'openai'
  if (c.includes('llama')) return 'meta'
  if (c.includes('glm')) return 'zhipu'
  if (c.includes('grok')) return 'xai'
  if (c.includes('kimi') || c.includes('moonshot')) return 'kimi'
  if (c.includes('minimax')) return 'minimax'
  if (c.includes('mimo')) return 'xiaomi'
  if (c.includes('qwen') || c.includes('tongyi')) return 'alibaba'
  return 'ollama'
}

// 默认模型（后端不可用时的回退）
const fallbackModels = [
  { value: 'deepseek-r1:8b',     label: 'DeepSeek R1 8B',    provider: 'deepseek', level: 2, local: true },
  { value: 'claude-sonnet-4-6',  label: 'Claude Sonnet 4.6', provider: 'anthropic', level: 1, local: false },
  { value: 'gpt-4o',             label: 'GPT-4o',            provider: 'openai',    level: 1, local: false },
  { value: 'gemini-2.5-pro',     label: 'Gemini 2.5 Pro',    provider: 'google',    level: 1, local: false },
]

// 从 chatStore.availableModels 构建模型列表
const models = computed(() => {
  const storeModels = chatStore.availableModels
  if (storeModels && storeModels.length > 0) {
    return storeModels.map(m => ({
      value: m.modelCode,
      label: m.displayName || m.modelCode,
      provider: getProvider(m.providerCode) || getProviderFromModel(m.modelCode),
      level: m.level || 2,
      local: m.localModel || false,
      stream: m.supportsStream !== false,
      score: m.score ?? 0,
    }))
  }
  return fallbackModels
})

// 按分数排序取 Top 3 的模型 value 集合（用于奖牌标识）
const top3ModelValues = computed(() => {
  const sorted = [...models.value].filter(m => m.score > 0).sort((a, b) => b.score - a.score)
  return sorted.slice(0, 3).map(m => m.value)
})

// 获取模型排名（1/2/3），不在前三返回 0
const getModelRank = (modelValue) => {
  const idx = top3ModelValues.value.indexOf(modelValue)
  return idx >= 0 ? idx + 1 : 0
}

// 第一 ~ 第四梯队分组
const tier1Models = computed(() => models.value.filter(m => m.level === 1))
const tier2Models = computed(() => models.value.filter(m => m.level === 2))
const tier3Models = computed(() => models.value.filter(m => m.level === 3))
const tier4Models = computed(() => models.value.filter(m => m.level === 4))

const selectedModel = ref(null)

const selectedModelIconUrl = computed(() => {
  const m = models.value.find(x => x.value === selectedModel.value)
  return m ? getModelIconUrl(m.value, m.provider) : `${ICON_CDN}/openai.svg`
})
const selectedModelLabel = computed(() => {
  const m = models.value.find(x => x.value === selectedModel.value)
  return m ? m.label : t('defaultModel')
})

const filteredModels = computed(() => {
  const q = modelSearch.value.toLowerCase()
  if (!q) return models.value
  return models.value.filter(m => m.label.toLowerCase().includes(q) || (m.value || '').toLowerCase().includes(q))
})

const selectModel = (m) => {
  selectedModel.value = m.value
  showModelPicker.value = false
  modelSearch.value = ''
}

const closeAllPopups = () => {
  showModelPicker.value = false
  showUploadMenu.value = false
}

// 点击外部关闭上传菜单
function handleClickOutside(e) {
  if (uploadDropdownRef.value && !uploadDropdownRef.value.contains(e.target)) {
    showUploadMenu.value = false
  }
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

// 文件处理
const triggerFileInput = () => {
  showUploadMenu.value = false
  fileInput.value?.click()
}
const triggerImageInput = () => {
  showUploadMenu.value = false
  imageInput.value?.click()
}

// ─── RAG 上传核心：获取预签名 URL → 直传 S3 ───────────────────────────────
const uploadFileToServer = async (rawFile) => {
  const userId = chatStore.userId || localStorage.getItem('userId') || 'guest'
  const sessionId = typeof chatStore.currentChatId === 'string' ? chatStore.currentChatId : undefined
  const ext = getFileExtension(rawFile.name)
  const findEntry = () => attachedFiles.value.find(f => f.file === rawFile)

  try {
    const { uploadUrl, objectKey, contentType, fileId } = await getUploadUrl(userId, {
      sessionId,
      fileType: ext,
      fileName: rawFile.name,
      fileSize: rawFile.size
    })

    await uploadFileToS3(uploadUrl, rawFile, contentType, (percent) => {
      const entry = findEntry()
      if (entry) entry.progress = percent
    })

    const entry = findEntry()
    if (entry) {
      entry.status = 'done'
      entry.progress = 100
      entry.objectKey = objectKey
      entry.fileId = fileId
    }
  } catch (err) {
    console.error('[RAG] 文件上传失败:', err)
    const entry = findEntry()
    if (entry) {
      entry.status = 'error'
      entry.errorMsg = err.message
    }
  }
}

const handleFileSelect = (event) => {
  Array.from(event.target.files || []).forEach(file => {
    attachedFiles.value.push({ name: file.name, file, size: file.size, status: 'uploading', progress: 0 })
    uploadFileToServer(file)
  })
  event.target.value = ''
}

const handleImageSelect = (event) => {
  Array.from(event.target.files || []).forEach(file => {
    attachedFiles.value.push({ name: file.name, file, size: file.size, type: 'image', status: 'uploading', progress: 0 })
    uploadFileToServer(file)
  })
  event.target.value = ''
}

const handleCameraCapture = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    attachedFiles.value.push({ name: file.name, file, size: file.size, type: 'image', status: 'uploading', progress: 0 })
    uploadFileToServer(file)
  }
  event.target.value = ''
}

// 截屏 / 拍照
const triggerScreenCapture = async () => {
  showUploadMenu.value = false
  if (isMobileDevice.value) {
    cameraInput.value?.click()
    return
  }
  // PC 端：Screen Capture API
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false })
    const track = stream.getVideoTracks()[0]
    const video = document.createElement('video')
    video.srcObject = stream
    video.autoplay = true
    await new Promise((resolve) => { video.onloadedmetadata = resolve })
    await video.play()

    // 等待一帧渲染
    await new Promise(r => requestAnimationFrame(r))

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    track.stop()
    stream.getTracks().forEach(t => t.stop())

    // 创建 Image 对象传给编辑器
    const img = new Image()
    img.onload = () => {
      screenshotImage.value = img
      showScreenshotEditor.value = true
    }
    img.src = canvas.toDataURL('image/png')
  } catch (err) {
    // 用户取消了屏幕选择
    if (err.name !== 'NotAllowedError') {
      console.error('Screenshot failed:', err)
    }
  }
}

// 截屏编辑器确认
const handleScreenshotConfirm = (file) => {
  attachedFiles.value.push({ name: file.name, file, size: file.size, type: 'image', status: 'uploading', progress: 0 })
  uploadFileToServer(file)
  showScreenshotEditor.value = false
  screenshotImage.value = null
}

const uploadFileToServer = async (rawFile) => {
  const userId = chatStore.userId || localStorage.getItem('userId') || 'guest'
  const sessionId = typeof chatStore.currentChatId === 'string' ? chatStore.currentChatId : undefined
  const ext = getFileExtension(rawFile.name)
  const findEntry = () => attachedFiles.value.find(f => f.file === rawFile)
  try {
    const { uploadUrl, objectKey, contentType, fileId } = await getUploadUrl(userId, {
      sessionId,
      fileType: ext,
      fileName: rawFile.name,
      fileSize: rawFile.size
    })
    await uploadFileToS3(uploadUrl, rawFile, contentType, (percent) => {
      const entry = findEntry()
      if (entry) entry.progress = percent
    })
    const entry = findEntry()
    if (entry) { entry.status = 'done'; entry.progress = 100; entry.objectKey = objectKey; entry.fileId = fileId }
  } catch (err) {
    console.error('[RAG] 文件上传失败:', err)
    const entry = findEntry()
    if (entry) { entry.status = 'error'; entry.errorMsg = err.message }
  }
}

const removeFile = (index) => attachedFiles.value.splice(index, 1)

// 文件预览辅助
const isImageFile = (f) => {
  if (f.type === 'image') return true
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(f.name)
}

const filePreviewUrls = new WeakMap()
const getFilePreviewUrl = (f) => {
  if (filePreviewUrls.has(f.file)) return filePreviewUrls.get(f.file)
  const url = URL.createObjectURL(f.file)
  filePreviewUrls.set(f.file, url)
  return url
}

const truncateName = (name) => {
  if (name.length <= 18) return name
  const ext = name.lastIndexOf('.') > 0 ? name.slice(name.lastIndexOf('.')) : ''
  return name.slice(0, 14 - ext.length) + '…' + ext
}

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

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
  // 有文件还在上传中，阻止发送
  if (attachedFiles.value.some(f => f.status === 'uploading')) return
  const content = message.value.trim()
  const files = attachedFiles.value.map(f => ({
    file: f.file,
    objectKey: f.objectKey,
    fileId: f.fileId,
    name: f.name,
    size: f.size
  }))

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
  border-radius: 18px;
  border: 1.5px solid var(--border-color);
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
  transition: border-color 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              max-height 0.4s cubic-bezier(0.4,0,0.2,1);
  overflow: visible;
  width: 100%;
  max-width: 780px;
}
.input-card.focused {
  border-color: var(--primary-color);
  box-shadow: 0 4px 24px rgba(45,134,89,0.1), 0 0 0 3px rgba(45,134,89,0.06);
  transform: translateY(-1px);
}

/* ─── 文件预览（卡片内部 Claude 风格） ─── */
.files-preview-inner {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 14px 16px 6px;
  position: relative;
}

.file-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  animation: fileCardIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* 图片缩略图卡 */
.file-card-thumb {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  flex-shrink: 0;
  transition: transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s;
}
.file-card-thumb:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.file-card-name {
  font-size: 11px;
  color: var(--text-sub);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

/* 关闭按钮 */
.file-card-close {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba(0,0,0,0.55);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
  backdrop-filter: blur(4px);
}
.file-card-thumb:hover .file-card-close,
.file-card-doc:hover .file-card-close {
  opacity: 1;
  transform: scale(1);
}
.file-card-close:hover {
  background: rgba(224,92,75,0.85);
  transform: scale(1.15) !important;
}

/* 文档文件卡 */
.file-card-doc {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 32px 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  min-width: 160px;
  max-width: 220px;
  transition: transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s;
}
.file-card-doc:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.file-card-doc-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--hover-bg);
  color: var(--primary-color);
  flex-shrink: 0;
}
.file-card-doc-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.file-card-doc-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-card-doc-size {
  font-size: 10px;
  color: var(--text-sub);
}
.file-card-close.doc-close {
  top: 50%;
  right: 6px;
  transform: translateY(-50%) scale(0.8);
  background: rgba(0,0,0,0.08);
  color: var(--text-sub);
}
.file-card-doc:hover .file-card-close.doc-close {
  opacity: 1;
  transform: translateY(-50%) scale(1);
}
.file-card-close.doc-close:hover {
  background: rgba(224,92,75,0.15);
  color: #e05c4b;
  transform: translateY(-50%) scale(1.15) !important;
}

/* ─── 上传状态 ─── */
.thumb-dim { filter: brightness(0.6); transition: filter 0.3s; }
.file-upload-overlay,
.file-error-overlay {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 3px;
  pointer-events: none; border-radius: inherit;
}
.file-upload-overlay { background: rgba(0,0,0,0.38); }
.file-error-overlay  { background: rgba(220,38,38,0.4); color: #fff; }
.upload-spin-icon { animation: uploadSpin 0.9s linear infinite; color: #fff; flex-shrink: 0; }
@keyframes uploadSpin { to { transform: rotate(360deg); } }
.upload-pct { font-size: 10px; font-weight: 700; color: #fff; line-height: 1; letter-spacing: 0.02em; }
.doc-uploading { opacity: 0.85; }
.doc-error .file-card-doc-name,
.doc-error .file-card-doc-size { color: #e05c4b; }
.doc-error .file-card-doc-icon { color: #e05c4b; }
.doc-progress-track { width: 100%; height: 3px; background: var(--border-color); border-radius: 2px; overflow: hidden; margin-top: 4px; }
.doc-progress-fill { height: 100%; background: linear-gradient(90deg, var(--theme-gradient-from, #4a9d6f), var(--theme-gradient-to, #6ab187)); border-radius: 2px; transition: width 0.25s ease; }

/* 文件卡片动画 */
@keyframes fileCardIn {
  0% { opacity: 0; transform: scale(0.7) translateY(8px); }
  60% { opacity: 1; transform: scale(1.04) translateY(-2px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.file-preview-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.file-preview-leave-active {
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
}
.file-preview-enter-from {
  opacity: 0;
  transform: scale(0.7) translateY(8px);
}
.file-preview-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(-4px);
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
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}
.tool-btn:hover {
  background: var(--hover-bg-medium);
  color: var(--primary-color);
  transform: translateY(-2px) scale(1.06);
  box-shadow: 0 4px 14px rgba(45, 134, 89, 0.12);
}
.tool-btn:active {
  transform: scale(0.9);
  transition-duration: 0.1s;
}
.tool-btn.active {
  background: var(--hover-bg-medium);
  color: var(--primary-color);
}

/* ─── Provider 官方图标（LobeHub CDN） ─── */
.provider-icon {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  object-fit: contain;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.picker-item:hover .provider-icon {
  transform: scale(1.18) rotate(-4deg);
}

/* ─── 奖牌徽章（金银铜） ─── */
.medal-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 1px 7px;
  border-radius: 6px;
  flex-shrink: 0;
  letter-spacing: 0.02em;
  line-height: 1.6;
  position: relative;
  overflow: hidden;
  animation: medalPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.medal-badge::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -60%;
  width: 40%;
  height: 200%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
  animation: medalShine 2.8s ease-in-out infinite;
}

/* 金牌 — 1st */
.medal-badge.gold {
  background: linear-gradient(135deg, #FFD700, #FFA500, #FFD700);
  color: #7A5C00;
  box-shadow: 0 2px 10px rgba(255, 215, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.5);
  text-shadow: 0 1px 2px rgba(255, 215, 0, 0.3);
}

/* 银牌 — 2nd */
.medal-badge.silver {
  background: linear-gradient(135deg, #E8E8E8, #B0B0B0, #D4D4D4);
  color: #4A4A4A;
  box-shadow: 0 2px 10px rgba(192, 192, 192, 0.45), inset 0 1px 0 rgba(255,255,255,0.6);
  text-shadow: 0 1px 1px rgba(255,255,255,0.5);
}

/* 铜牌 — 3rd */
.medal-badge.bronze {
  background: linear-gradient(135deg, #E8A87C, #CD7F32, #D4956B);
  color: #5C3A1E;
  box-shadow: 0 2px 10px rgba(205, 127, 50, 0.4), inset 0 1px 0 rgba(255,255,255,0.35);
  text-shadow: 0 1px 1px rgba(205, 127, 50, 0.2);
}

@keyframes medalPop {
  0% { opacity: 0; transform: scale(0) rotate(-15deg); }
  60% { opacity: 1; transform: scale(1.2) rotate(3deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}
@keyframes medalShine {
  0%, 75% { left: -60%; }
  100% { left: 140%; }
}

/* ─── 模型选择器分组标签 ─── */
.picker-group-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-sub);
  padding: 10px 14px 5px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  animation: pickerItemSlide 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.picker-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
  flex-shrink: 0;
}
.picker-badge.local {
  background: rgba(77, 107, 254, 0.12);
  color: #4D6BFE;
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
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}
.send-btn::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -100%;
  width: 60%;
  height: 200%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
  transition: left 0.5s;
}
.send-btn:hover:not(:disabled)::before {
  left: 150%;
}
.send-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
  opacity: 0;
  transition: opacity 0.2s;
}
.send-btn:hover:not(:disabled)::after {
  opacity: 1;
}
.send-btn:hover:not(:disabled) {
  transform: scale(1.12) translateY(-2px);
  box-shadow: 0 8px 24px rgba(45,134,89,0.35), 0 0 0 3px rgba(45,134,89,0.1);
}
.send-btn:active:not(:disabled) {
  transform: scale(0.92);
  box-shadow: 0 2px 8px rgba(45,134,89,0.2);
  transition-duration: 0.1s;
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
  width: 290px;
  background: var(--bg-primary);
  border: 1.5px solid var(--border-color);
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.06);
  z-index: 100;
  overflow: hidden;
  backdrop-filter: blur(12px);
}

.pop-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pop-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}
.pop-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.9);
}
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
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
  animation: pickerItemSlide 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: calc(var(--item-index, 0) * 0.03s);
  position: relative;
}
.picker-item::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: var(--hover-bg);
  opacity: 0;
  transition: opacity 0.22s;
}
.picker-item:hover::before {
  opacity: 1;
}
.picker-item:hover {
  transform: translateX(4px);
}
.picker-item:active {
  transform: translateX(4px) scale(0.97);
}
.picker-item.selected {
  background: var(--hover-bg-medium);
}
.picker-item.selected::after {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--primary-color);
}

@keyframes pickerItemSlide {
  from { opacity: 0; transform: translateX(-12px) translateY(4px); }
  to { opacity: 1; transform: translateX(0) translateY(0); }
}

.picker-item > * { position: relative; z-index: 1; }

.picker-item-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}
.picker-check {
  color: var(--primary-color);
  flex-shrink: 0;
  animation: checkBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes checkBounce {
  0% { opacity: 0; transform: scale(0) rotate(-15deg); }
  60% { transform: scale(1.2) rotate(5deg); }
  100% { opacity: 1; transform: scale(1) rotate(0); }
}

.picker-list::-webkit-scrollbar { width: 4px; }
.picker-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }

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
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  max-width: 600px;
  width: 100%;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.skill-mcp-pill:hover {
  border-color: var(--primary-color);
  box-shadow: 0 6px 20px rgba(45,134,89,0.12);
  transform: translateY(-2px);
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

/* ─── 上传下拉菜单 ─── */
.upload-dropdown-wrapper {
  position: relative;
}

.upload-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: 180px;
  background: var(--bg-primary);
  border: 1.5px solid var(--border-color);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.14);
  z-index: 100;
  overflow: hidden;
  padding: 6px;
}

.upload-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: none;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: left;
}
.upload-menu-item:hover {
  background: var(--hover-bg);
  transform: translateX(4px) scale(1.01);
}
.upload-menu-item:active {
  background: var(--hover-bg-medium);
  transform: translateX(2px) scale(0.97);
  transition-duration: 0.1s;
}

.upload-menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--hover-bg);
  color: var(--primary-color);
  flex-shrink: 0;
  transition: all 0.15s ease;
}
.upload-menu-item:hover .upload-menu-icon {
  background: var(--hover-bg-medium);
}

.upload-menu-text {
  flex: 1;
}

/* 上传菜单弹出动画 */
.upload-pop-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.upload-pop-leave-active {
  transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
}
.upload-pop-enter-from,
.upload-pop-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px) scale(0.92);
}
/* 菜单项交错入场 */
.upload-menu-item:nth-child(1) { animation: menuItemIn 0.3s 0.02s both; }
.upload-menu-item:nth-child(2) { animation: menuItemIn 0.3s 0.06s both; }
.upload-menu-item:nth-child(3) { animation: menuItemIn 0.3s 0.10s both; }
@keyframes menuItemIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

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
  .upload-menu {
    width: 160px;
    left: 0;
    transform: translateX(0);
  }
  .upload-pop-enter-from,
  .upload-pop-leave-to {
    opacity: 0;
    transform: translateX(0) translateY(8px) scale(0.95);
  }
  /* 文件预览：手机端缩略图小一点 */
  .files-preview-inner {
    padding: 10px 12px 4px;
    gap: 8px;
  }
  .file-card-thumb {
    width: 64px;
    height: 64px;
    border-radius: 10px;
  }
  .file-card-name {
    max-width: 64px;
    font-size: 10px;
  }
  .file-card-doc {
    min-width: 140px;
    max-width: 180px;
    padding: 8px 28px 8px 10px;
  }
  .file-card-doc-icon {
    width: 30px;
    height: 30px;
  }
  .file-card-close {
    opacity: 1;
    transform: scale(1);
  }
  .file-card-close.doc-close {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}
</style>
