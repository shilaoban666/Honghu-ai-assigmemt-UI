<template>
  <div v-if="visible" class="settings-overlay" @click="closeSettings">
    <div class="settings-panel" @click.stop>
      <!-- 头部 -->
      <div class="settings-header">
        <h2>{{ t('settings') }}</h2>
        <button class="close-btn" @click="closeSettings">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12.5 3.5L3.5 12.5M3.5 3.5l9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="settings-content">

        <!-- ===== 通用设置 ===== -->
        <div class="settings-section">
          <h3 class="section-title">{{ t('generalSettings') }}</h3>
          <div class="section-card">

            <!-- 主题模式 (浅色 / 深色 / 跟随系统) -->
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">{{ t('theme') }}</span>
                <span class="setting-desc">{{ t('themeDesc') }}</span>
              </div>
            </div>
            <div class="theme-mode-cards">
              <div
                v-for="mode in themeModes"
                :key="mode.id"
                :class="['mode-card', { active: themeMode === mode.id }]"
                @click="setThemeMode(mode.id)"
              >
                <!-- CSS-drawn mini UI preview -->
                <div :class="['mode-preview', `preview-${mode.id}`]">
                  <div class="prev-sidebar">
                    <div class="prev-dot"></div>
                    <div class="prev-line short"></div>
                    <div class="prev-line"></div>
                    <div class="prev-line short"></div>
                  </div>
                  <div class="prev-main">
                    <div class="prev-topbar"></div>
                    <div class="prev-chat">
                      <div class="prev-msg left"></div>
                      <div class="prev-msg right"></div>
                      <div class="prev-msg left wide"></div>
                    </div>
                    <div class="prev-input"></div>
                  </div>
                </div>
                <span class="mode-label">{{ t(mode.labelKey) }}</span>
              </div>
            </div>

            <!-- 语言设置 -->
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">{{ t('language') }}</span>
                <span class="setting-desc">{{ t('languageDesc') }}</span>
              </div>
              <select v-model="currentLanguage" @change="handleLanguageChange" class="setting-select">
                <option v-for="(info, code) in languageList" :key="code" :value="code">{{ info.native }}</option>
              </select>
            </div>

            <!-- 发送快捷键 -->
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">{{ t('sendShortcut') }}</span>
                <span class="setting-desc">{{ t('sendShortcutDesc') }}</span>
              </div>
              <div class="segmented-control">
                <button
                  v-for="opt in sendShortcutOptions"
                  :key="opt.value"
                  :class="['seg-btn', { active: sendShortcut === opt.value }]"
                  @click="setSendShortcut(opt.value)"
                >{{ opt.label }}</button>
              </div>
            </div>

            <!-- 字体大小 -->
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">{{ t('fontSize') }}</span>
                <span class="setting-desc">{{ t('fontSizeDesc') }}</span>
              </div>
              <div class="segmented-control">
                <button
                  v-for="opt in fontSizeOptions"
                  :key="opt.value"
                  :class="['seg-btn', { active: fontSize === opt.value }]"
                  @click="setFontSize(opt.value)"
                >{{ t(opt.labelKey) }}</button>
              </div>
            </div>

            <!-- 消息样式 -->
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">{{ t('bubbleStyle') }}</span>
                <span class="setting-desc">{{ t('bubbleStyleDesc') }}</span>
              </div>
              <div class="segmented-control">
                <button
                  v-for="opt in bubbleStyleOptions"
                  :key="opt.value"
                  :class="['seg-btn', { active: bubbleStyle === opt.value }]"
                  @click="setBubbleStyle(opt.value)"
                >{{ t(opt.labelKey) }}</button>
              </div>
            </div>

            <!-- 消息提示�?-->
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">{{ t('enableSound') }}</span>
                <span class="setting-desc">{{ t('enableSoundDesc') }}</span>
              </div>
              <label class="toggle">
                <input type="checkbox" v-model="enableSound" @change="handleSoundChange" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- ===== 应用外观 ===== -->
        <div class="settings-section">
          <h3 class="section-title">{{ t('appearance') }}</h3>
          <div class="section-card">

            <!-- 主题�?-->
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">{{ t('primaryColor') }}</span>
                <span class="setting-desc">{{ t('primaryColorDesc') }}</span>
              </div>
            </div>
            <div class="color-dots">
              <button
                v-for="color in primaryColors"
                :key="color.id"
                :class="['color-dot', { active: currentTheme === color.id }]"
                :style="{ '--dot-color': color.hex }"
                @click="handleThemeChange(color.id)"
                :title="t(color.labelKey)"
              >
                <svg v-if="currentTheme === color.id" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7L5.5 10L11.5 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- ===== 关于 ===== -->
        <div class="settings-section">
          <h3 class="section-title">{{ t('aboutApp') }}</h3>
          <div class="section-card about-card">
            <div class="about-logo">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="var(--primary-color)"/>
                <path d="M9 16c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7" stroke="white" stroke-width="2" stroke-linecap="round"/>
                <circle cx="16" cy="16" r="2.5" fill="white"/>
              </svg>
              <div class="about-text">
                <strong>Honghu AI Chat</strong>
                <span>{{ t('version') }} 1.0.0</span>
              </div>
            </div>
            <p class="about-copyright">{{ t('copyright') }}</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { applyTheme, getTheme } from '@/utils/theme'
import { languages, getLanguage, setLanguage as setLanguageUtil, t } from '@/utils/i18n'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'theme-change', 'language-change', 'dark-mode-change', 'sound-change'])

// --- state ---
const currentTheme = ref('green')
const currentLanguage = ref('zh')
const themeMode = ref('light') // light | dark | auto
const enableSound = ref(true)
const sendShortcut = ref('enter')
const fontSize = ref('default')
const bubbleStyle = ref('bubble')

// --- constants ---
const languageList = languages

const themeModes = [
  { id: 'light', labelKey: 'themeLight' },
  { id: 'dark', labelKey: 'themeDark' },
  { id: 'auto', labelKey: 'themeAuto' }
]

const primaryColors = [
  { id: 'green', hex: '#2d8659', labelKey: 'forest' },
  { id: 'blue', hex: '#0066cc', labelKey: 'sky' },
  { id: 'dark', hex: '#1a1a2e', labelKey: 'dark' },
  { id: 'red', hex: '#e54d42' , labelKey: 'forest' },
  { id: 'orange', hex: '#e67e22', labelKey: 'forest' },
  { id: 'purple', hex: '#8b5cf6', labelKey: 'forest' },
  { id: 'pink', hex: '#ec4899', labelKey: 'forest' },
  { id: 'cyan', hex: '#06b6d4', labelKey: 'forest' }
]

const sendShortcutOptions = [
  { value: 'enter', label: 'Enter' },
  { value: 'ctrl+enter', label: 'Ctrl + Enter' }
]

const fontSizeOptions = [
  { value: 'small', labelKey: 'fontSmall' },
  { value: 'default', labelKey: 'fontDefault' },
  { value: 'large', labelKey: 'fontLarge' }
]

const bubbleStyleOptions = [
  { value: 'bubble', labelKey: 'bubbleBubble' },
  { value: 'plain', labelKey: 'bubblePlain' }
]

// --- actions ---
const closeSettings = () => emit('close')

const handleThemeChange = (themeId) => {
  currentTheme.value = themeId
  applyTheme(themeId)
  emit('theme-change', themeId)
}

const setThemeMode = (mode) => {
  themeMode.value = mode
  localStorage.setItem('themeMode', mode)
  if (mode === 'dark') {
    emit('dark-mode-change', true)
  } else if (mode === 'light') {
    emit('dark-mode-change', false)
  } else {
    // auto: follow system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    emit('dark-mode-change', prefersDark)
  }
}

const handleLanguageChange = () => {
  setLanguageUtil(currentLanguage.value)
  emit('language-change', currentLanguage.value)
}

const handleSoundChange = () => {
  localStorage.setItem('enableSound', enableSound.value)
  emit('sound-change', enableSound.value)
}

const setSendShortcut = (val) => {
  sendShortcut.value = val
  localStorage.setItem('sendShortcut', val)
}

const setFontSize = (val) => {
  fontSize.value = val
  localStorage.setItem('fontSize', val)
  document.documentElement.setAttribute('data-font-size', val)
}

const setBubbleStyle = (val) => {
  bubbleStyle.value = val
  localStorage.setItem('bubbleStyle', val)
  document.documentElement.setAttribute('data-bubble-style', val)
}

// --- init ---
onMounted(() => {
  currentTheme.value = getTheme()
  currentLanguage.value = getLanguage()
  themeMode.value = localStorage.getItem('themeMode') || 'light'
  enableSound.value = localStorage.getItem('enableSound') !== 'false'
  sendShortcut.value = localStorage.getItem('sendShortcut') || 'enter'
  fontSize.value = localStorage.getItem('fontSize') || 'default'
  bubbleStyle.value = localStorage.getItem('bubbleStyle') || 'bubble'
  // ensure data attributes are set
  document.documentElement.setAttribute('data-font-size', fontSize.value)
  document.documentElement.setAttribute('data-bubble-style', bubbleStyle.value)
})

// listen for system theme change when in auto mode
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (themeMode.value === 'auto') {
      emit('dark-mode-change', e.matches)
    }
  })
}
</script>

<style scoped>
/* ===== Overlay ===== */
.settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.25s ease;
  backdrop-filter: blur(4px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ===== Panel ===== */
.settings-panel {
  background: var(--bg-primary, #fff);
  border-radius: 16px;
  width: 92%;
  max-width: 560px;
  max-height: 82vh;
  overflow-y: auto;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04);
  animation: slideUp 0.3s cubic-bezier(.22,1,.36,1);
}

@keyframes slideUp {
  from { transform: translateY(32px) scale(0.97); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

.settings-panel::-webkit-scrollbar { width: 5px; }
.settings-panel::-webkit-scrollbar-track { background: transparent; }
.settings-panel::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 3px; }
.settings-panel::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.22); }

/* ===== Header ===== */
.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  background: var(--bg-primary, #fff);
  border-radius: 16px 16px 0 0;
  z-index: 2;
}

.settings-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
  margin: 0;
  letter-spacing: -0.01em;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #999;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-btn:hover { background: rgba(0,0,0,0.06); color: #333; }

/* ===== Content ===== */
.settings-content {
  padding: 16px 24px 24px;
}

/* ===== Section ===== */
.settings-section {
  margin-bottom: 24px;
}
.settings-section:last-child { margin-bottom: 0; }

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary, #888);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 10px 2px;
}

.section-card {
  background: var(--bg-secondary, #f7f8fa);
  border-radius: 12px;
  padding: 4px 0;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

/* ===== Setting Row ===== */
.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  min-height: 48px;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.setting-name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-primary, #1a1a1a);
}

.setting-desc {
  font-size: 12px;
  color: var(--text-secondary, #999);
  line-height: 1.4;
}

/* ===== Theme Mode Cards (LobeHub style preview thumbnails) ===== */
.theme-mode-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 0 16px 14px;
}

.mode-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-preview {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 10px;
  border: 2.5px solid transparent;
  overflow: hidden;
  display: flex;
  transition: all 0.2s;
  position: relative;
}

.mode-card:hover .mode-preview {
  border-color: rgba(0, 0, 0, 0.15);
}

.mode-card.active .mode-preview {
  border-color: var(--primary-color, #2d8659);
  box-shadow: 0 0 0 2px rgba(45, 134, 89, 0.18);
}

/* ---- Light preview ---- */
.preview-light {
  background: #ffffff;
}
.preview-light .prev-sidebar {
  background: #f3f4f6;
}
.preview-light .prev-dot { background: #d1d5db; }
.preview-light .prev-line { background: #e5e7eb; }
.preview-light .prev-topbar { background: #f3f4f6; }
.preview-light .prev-msg.left { background: #f3f4f6; }
.preview-light .prev-msg.right { background: var(--primary-color, #2d8659); }
.preview-light .prev-input { background: #f3f4f6; }

/* ---- Dark preview ---- */
.preview-dark {
  background: #1a1a2e;
}
.preview-dark .prev-sidebar {
  background: #16163a;
}
.preview-dark .prev-dot { background: #333366; }
.preview-dark .prev-line { background: #2a2a5a; }
.preview-dark .prev-topbar { background: #16163a; }
.preview-dark .prev-msg.left { background: #2a2a5a; }
.preview-dark .prev-msg.right { background: var(--primary-color, #2d8659); }
.preview-dark .prev-input { background: #16163a; }

/* ---- Auto preview (split) ---- */
.preview-auto {
  background: linear-gradient(135deg, #ffffff 50%, #1a1a2e 50%);
}
.preview-auto .prev-sidebar {
  background: linear-gradient(180deg, #f3f4f6 50%, #16163a 50%);
}
.preview-auto .prev-dot { background: #aaa; }
.preview-auto .prev-line { background: rgba(150,150,150,0.3); }
.preview-auto .prev-topbar { background: rgba(150,150,150,0.2); }
.preview-auto .prev-msg.left { background: rgba(150,150,150,0.25); }
.preview-auto .prev-msg.right { background: var(--primary-color, #2d8659); }
.preview-auto .prev-input { background: rgba(150,150,150,0.2); }

/* Mini preview inner layout */
.prev-sidebar {
  width: 28%;
  padding: 6px 4px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.prev-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-bottom: 2px;
}
.prev-line {
  height: 3px;
  border-radius: 2px;
  width: 80%;
}
.prev-line.short { width: 55%; }
.prev-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 4px;
  gap: 3px;
}
.prev-topbar {
  height: 6px;
  border-radius: 2px;
}
.prev-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  justify-content: center;
}
.prev-msg {
  height: 5px;
  border-radius: 2px;
  width: 60%;
}
.prev-msg.right {
  align-self: flex-end;
  width: 50%;
  opacity: 0.85;
}
.prev-msg.wide { width: 75%; }
.prev-input {
  height: 7px;
  border-radius: 3px;
}

.mode-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary, #888);
  transition: color 0.2s;
}
.mode-card.active .mode-label {
  color: var(--primary-color, #2d8659);
  font-weight: 600;
}

/* ===== Select ===== */
.setting-select {
  padding: 6px 28px 6px 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-primary, #1a1a1a);
  background: var(--bg-primary, #fff);
  cursor: pointer;
  transition: all 0.15s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  min-width: 100px;
}
.setting-select:hover { border-color: rgba(0,0,0,0.2); }
.setting-select:focus {
  outline: none;
  border-color: var(--primary-color, #2d8659);
  box-shadow: 0 0 0 2px rgba(45, 134, 89, 0.12);
}

/* ===== Segmented Control ===== */
.segmented-control {
  display: flex;
  background: var(--bg-primary, #fff);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  flex-shrink: 0;
}

.seg-btn {
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary, #888);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  position: relative;
}
.seg-btn:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 25%;
  height: 50%;
  width: 1px;
  background: rgba(0,0,0,0.08);
}
.seg-btn:hover { color: var(--text-primary, #1a1a1a); }
.seg-btn.active {
  background: var(--primary-color, #2d8659);
  color: #fff;
  font-weight: 600;
}
.seg-btn.active::after { display: none; }
.seg-btn.active + .seg-btn::after { display: none; }

/* ===== Toggle Switch ===== */
.toggle {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
}
.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-slider {
  position: absolute;
  inset: 0;
  background: #ddd;
  border-radius: 22px;
  cursor: pointer;
  transition: all 0.25s;
}
.toggle-slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: all 0.25s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
.toggle input:checked + .toggle-slider {
  background: var(--primary-color, #2d8659);
}
.toggle input:checked + .toggle-slider::before {
  transform: translateX(18px);
}

/* ===== Color Dots ===== */
.color-dots {
  display: flex;
  gap: 10px;
  padding: 2px 16px 14px;
  flex-wrap: wrap;
}

.color-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2.5px solid transparent;
  background: var(--dot-color);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  position: relative;
}
.color-dot:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.color-dot.active {
  border-color: var(--dot-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--dot-color) 25%, transparent);
  transform: scale(1.1);
}

/* ===== About Card ===== */
.about-card {
  padding: 16px !important;
}

.about-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.about-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.about-text strong {
  font-size: 14px;
  color: var(--text-primary, #1a1a1a);
}
.about-text span {
  font-size: 12px;
  color: var(--text-secondary, #999);
}

.about-copyright {
  margin: 12px 0 0;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  font-size: 11.5px;
  color: var(--text-secondary, #aaa);
  text-align: center;
}

/* ===== Responsive ===== */
@media (max-width: 480px) {
  .settings-panel { width: 96%; max-height: 90vh; border-radius: 14px; }
  .settings-header { padding: 16px 18px; }
  .settings-content { padding: 12px 16px 20px; }
  .theme-mode-cards { gap: 8px; }
  .segmented-control { font-size: 11px; }
  .seg-btn { padding: 5px 8px; }
}
</style>
