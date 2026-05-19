<template>
  <section class="settings-view settings-view-animated appearance-view">
    <h1 class="settings-title">{{ st('appearance') }}</h1>

    <div class="settings-card glass-card">
      <div class="card-head">
        <h2>{{ st('generalSettings') }}</h2>
      </div>

      <SettingRow :title="st('theme')" :description="st('themeDesc')">
        <div class="theme-mode-cards">
          <button v-for="mode in themeModes" :key="mode.id" :class="['mode-card', { active: themeMode === mode.id }]" @click="setThemeMode(mode.id)">
            <span :class="['mode-preview', `preview-${mode.id}`]">
              <i></i><b></b><b></b><em></em>
            </span>
            <span>{{ mode.label }}</span>
          </button>
        </div>
      </SettingRow>

      <SettingRow :title="st('language')" :description="st('languageDesc')">
        <select v-model="currentLanguage" class="setting-select" @change="handleLanguageChange">
          <option v-for="(info, code) in languageList" :key="code" :value="code">{{ info.native }}</option>
        </select>
      </SettingRow>

      <SettingRow :title="st('animation')" :description="st('animationDesc')">
        <div class="segmented-control">
          <button v-for="opt in animationOptions" :key="opt.value" :class="{ active: animationSpeed === opt.value }" @click="setLocalSetting('animationSpeed', opt.value)">{{ opt.label }}</button>
        </div>
      </SettingRow>

      <SettingRow :title="st('contextMenu')" :description="st('contextMenuDesc')">
        <div class="segmented-control">
          <button v-for="opt in contextMenuOptions" :key="opt.value" :class="{ active: contextMenu === opt.value }" @click="setLocalSetting('contextMenu', opt.value)">{{ opt.label }}</button>
        </div>
      </SettingRow>

      <SettingRow :title="st('replyLanguage')" :description="st('replyLanguageDesc')">
        <select v-model="replyLanguage" class="setting-select" @change="setLocalSetting('replyLanguage', replyLanguage)">
          <option value="zh-CN">{{ st('simplifiedChinese') }}</option>
          <option value="en-US">English</option>
          <option value="auto">{{ st('followInput') }}</option>
        </select>
      </SettingRow>
    </div>

    <div class="settings-card glass-card">
      <div class="card-head">
        <h2>{{ st('appAppearance') }}</h2>
      </div>
      <SettingRow :title="st('palette')" :description="st('paletteDesc')">
        <div class="app-preview">
          <div class="preview-sidebar">
            <span></span><span></span><span></span>
          </div>
          <div class="preview-chat">
            <span></span><span></span><span></span>
            <b></b>
          </div>
        </div>
      </SettingRow>
      <SettingRow :title="st('primaryColor')" :description="st('primaryColorDesc')">
        <div class="color-dots">
          <button
            v-for="color in primaryColors"
            :key="color.id"
            :class="['color-dot', { active: currentTheme === color.id }]"
            :style="{ '--dot-color': color.hex }"
            :title="color.label"
            @click="handleThemeChange(color.id)"
          ></button>
        </div>
      </SettingRow>
      <SettingRow :title="st('neutralColor')" :description="st('neutralColorDesc')">
        <div class="neutral-dots">
          <button v-for="tone in neutralTones" :key="tone.value" :class="{ active: neutralTone === tone.value }" :style="{ '--dot-color': tone.color }" @click="setLocalSetting('neutralTone', tone.value)"></button>
        </div>
      </SettingRow>
    </div>

    <div class="settings-card glass-card">
      <div class="card-head compact-head">
        <div>
          <h2>{{ st('fontSize') }}</h2>
          <p>{{ st('fontSizeDesc') }}</p>
        </div>
        <div class="font-control">
          <span>A</span>
          <input v-model.number="fontScale" type="range" min="0.86" max="1.28" step="0.01" @input="setFontScale" />
          <span class="big-a">A</span>
          <input v-model.number="fontSizeNumber" class="font-number" type="number" min="12" max="20" @change="setFontNumber" />
        </div>
      </div>
      <div class="font-sample" :style="{ fontSize: `${fontSizeNumber}px` }">{{ st('fontSample') }}</div>
    </div>

    <div class="settings-card glass-card code-theme-card">
      <div class="card-head compact-head">
        <div>
          <h2>{{ st('codeTheme') }}</h2>
        </div>
        <select v-model="codeTheme" class="setting-select" @change="applyCodeTheme">
          <option value="lobe">Lobe Theme</option>
          <option value="github">GitHub Light</option>
          <option value="night">Night Owl</option>
          <option value="solarized">Solarized</option>
        </select>
      </div>
      <pre class="code-preview"><code><span class="token-keyword">const</span> person = { name: <span class="token-string">"Alice"</span>, age: <span class="token-number">30</span> };
<span class="token-keyword">type</span> PersonType = <span class="token-keyword">typeof</span> person;

<span class="token-keyword">type</span> User = { name: <span class="token-string">string</span> };
<span class="token-keyword">const</span> assistant = { name: <span class="token-string">"Honghu AI"</span>, role: <span class="token-string">"copilot"</span> } <span class="token-keyword">satisfies</span> User;</code></pre>
    </div>

    <div class="settings-card glass-card">
      <div class="card-head compact-head">
        <div>
          <h2>{{ st('mermaidTheme') }}</h2>
        </div>
        <select v-model="mermaidTheme" class="setting-select" @change="applyMermaidTheme">
          <option value="lobe">Lobe Theme</option>
          <option value="contrast">Contrast</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div class="mermaid-preview">
        <div class="node top-left">User</div>
        <div class="node top-right">Agent</div>
        <div class="line one"></div>
        <div class="line two"></div>
        <div class="line three"></div>
        <div class="node bottom-left">Memory</div>
        <div class="node bottom-right">Tool</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import SettingRow from '@/components/settings/SettingRow.vue'
import { settingsLanguages, setSettingsLanguage, st } from '@/components/settings/settingsLocale'
import { applyTheme, getTheme } from '@/utils/theme'
import { getLanguage } from '@/utils/i18n'

const currentTheme = ref('green')
const currentLanguage = ref('zh')
const themeMode = ref('light')
const animationSpeed = ref('balanced')
const contextMenu = ref('disabled')
const replyLanguage = ref('zh-CN')
const neutralTone = ref('slate')
const fontScale = ref(1)
const fontSizeNumber = ref(15)
const codeTheme = ref('lobe')
const mermaidTheme = ref('lobe')
const languageList = settingsLanguages

const themeModes = computed(() => [
  { id: 'light', label: st('light') },
  { id: 'dark', label: st('dark') },
  { id: 'auto', label: st('auto') }
])

const animationOptions = computed(() => [
  { value: 'off', label: st('off') },
  { value: 'snappy', label: st('snappy') },
  { value: 'balanced', label: st('balanced') }
])

const contextMenuOptions = computed(() => [
  { value: 'disabled', label: st('disabled') },
  { value: 'default', label: st('default') }
])

const primaryColors = [
  { id: 'green', hex: '#2d8659', label: 'Forest Green' },
  { id: 'blue', hex: '#0066cc', label: 'Sky Blue' },
  { id: 'dark', hex: '#16a36a', label: 'Obsidian' },
  { id: 'red', hex: '#e54d42', label: 'Red' },
  { id: 'orange', hex: '#e67e22', label: 'Orange' },
  { id: 'purple', hex: '#8b5cf6', label: 'Purple' },
  { id: 'pink', hex: '#ec4899', label: 'Pink' },
  { id: 'cyan', hex: '#06b6d4', label: 'Cyan' }
]

const neutralTones = [
  { value: 'slate', color: '#6b7280' },
  { value: 'zinc', color: '#71717a' },
  { value: 'stone', color: '#78716c' },
  { value: 'neutral', color: '#737373' }
]

const handleThemeChange = (themeId) => {
  currentTheme.value = themeId
  applyTheme(themeId)
}

const setThemeMode = (mode) => {
  themeMode.value = mode
  localStorage.setItem('themeMode', mode)
  const root = document.documentElement
  if (mode === 'dark') root.classList.add('dark-mode')
  if (mode === 'light') root.classList.remove('dark-mode')
  if (mode === 'auto') root.classList.toggle('dark-mode', window.matchMedia('(prefers-color-scheme: dark)').matches)
}

const handleLanguageChange = () => {
  setSettingsLanguage(currentLanguage.value)
}

const setLocalSetting = (key, value) => {
  if (key === 'animationSpeed') animationSpeed.value = value
  if (key === 'contextMenu') contextMenu.value = value
  if (key === 'replyLanguage') replyLanguage.value = value
  if (key === 'neutralTone') neutralTone.value = value
  localStorage.setItem(key, value)
  document.documentElement.setAttribute(`data-${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`, value)
}

const setFontScale = () => {
  fontSizeNumber.value = Math.round(15 * fontScale.value)
  document.documentElement.setAttribute('data-font-size', 'custom')
  document.documentElement.style.setProperty('--chat-scale', fontScale.value)
  localStorage.setItem('fontScale', String(fontScale.value))
}

const setFontNumber = () => {
  fontScale.value = Number((fontSizeNumber.value / 15).toFixed(2))
  setFontScale()
}

const applyCodeTheme = () => {
  document.documentElement.setAttribute('data-code-theme', codeTheme.value)
  localStorage.setItem('codeTheme', codeTheme.value)
}

const applyMermaidTheme = () => {
  document.documentElement.setAttribute('data-mermaid-theme', mermaidTheme.value)
  localStorage.setItem('mermaidTheme', mermaidTheme.value)
}

onMounted(() => {
  currentTheme.value = getTheme()
  currentLanguage.value = getLanguage()
  themeMode.value = localStorage.getItem('themeMode') || 'light'
  animationSpeed.value = localStorage.getItem('animationSpeed') || 'balanced'
  contextMenu.value = localStorage.getItem('contextMenu') || 'disabled'
  replyLanguage.value = localStorage.getItem('replyLanguage') || 'zh-CN'
  neutralTone.value = localStorage.getItem('neutralTone') || 'slate'
  fontScale.value = Number(localStorage.getItem('fontScale') || 1)
  fontSizeNumber.value = Math.round(15 * fontScale.value)
  codeTheme.value = localStorage.getItem('codeTheme') || 'lobe'
  mermaidTheme.value = localStorage.getItem('mermaidTheme') || 'lobe'
  setThemeMode(themeMode.value)
  setFontScale()
  applyCodeTheme()
  applyMermaidTheme()
})
</script>

<style scoped>
.theme-mode-cards,
.color-dots,
.neutral-dots,
.segmented-control {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.mode-card {
  display: grid;
  gap: 7px;
  width: 106px;
  border: none;
  background: transparent;
  color: var(--text-sub);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
}

.mode-preview {
  position: relative;
  display: block;
  height: 60px;
  overflow: hidden;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.5), 0 10px 24px rgba(15,23,42,.06);
}

.mode-preview i,
.mode-preview b,
.mode-preview em {
  position: absolute;
  display: block;
  border-radius: 999px;
}

.mode-preview i {
  left: 9px;
  top: 9px;
  width: 22px;
  height: 42px;
  background: rgba(148, 163, 184, 0.18);
}

.mode-preview b {
  left: 42px;
  right: 10px;
  height: 6px;
  background: rgba(148, 163, 184, 0.28);
}

.mode-preview b:nth-child(2) { top: 15px; }
.mode-preview b:nth-child(3) { top: 31px; width: 40%; background: var(--primary-color); }
.mode-preview em { right: 12px; bottom: 12px; width: 34px; height: 5px; background: var(--primary-light); }

.mode-card.active {
  color: var(--primary-color);
}

.mode-card.active .mode-preview {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 16%, transparent);
}

.preview-light { background: #fff; }
.preview-dark { background: linear-gradient(135deg, #121a16, #0a100d); }
.preview-auto { background: linear-gradient(135deg, #fff 50%, #111a15 50%); }

.setting-select {
  min-width: 160px;
  padding: 9px 12px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.segmented-control {
  padding: 3px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-secondary);
}

.segmented-control button {
  border: none;
  border-radius: 9px;
  padding: 8px 13px;
  background: transparent;
  color: var(--text-sub);
  cursor: pointer;
  font-weight: 750;
}

.segmented-control button.active {
  background: var(--primary-color);
  color: #fff;
}

.app-preview {
  display: grid;
  grid-template-columns: 72px 1fr;
  width: 334px;
  height: 198px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--bg-primary);
}

.preview-sidebar {
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 18px 12px;
  background: var(--bg-secondary);
}

.preview-sidebar span {
  height: 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text-sub) 32%, transparent);
}

.preview-chat {
  display: grid;
  align-content: center;
  gap: 12px;
  padding: 24px;
}

.preview-chat span {
  height: 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text-sub) 28%, transparent);
}

.preview-chat span:nth-child(2) { width: 76%; }
.preview-chat span:nth-child(3) { width: 60%; justify-self: end; background: var(--primary-color); }
.preview-chat b { width: 44px; height: 10px; border-radius: 4px; background: #202020; justify-self: end; align-self: end; }

.color-dot,
.neutral-dots button {
  width: 30px;
  height: 30px;
  border: 2px solid transparent;
  border-radius: 50%;
  background: var(--dot-color);
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.26);
}

.color-dot.active,
.neutral-dots button.active {
  border-color: rgba(255,255,255,.72);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--dot-color) 26%, transparent);
}

.compact-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.font-control {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-sub);
}

.font-control input[type="range"] {
  width: 150px;
  accent-color: var(--primary-color);
}

.big-a {
  font-size: 20px;
}

.font-number {
  width: 64px;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.font-sample {
  margin: 0 18px 18px;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-primary);
  background: var(--bg-primary);
}

.code-preview {
  margin: 0 18px 18px;
  padding: 18px;
  overflow-x: auto;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--code-bg);
  color: var(--code-fg);
  font: 13px/1.7 'JetBrains Mono', 'Fira Code', Consolas, monospace;
}

.token-keyword { color: var(--code-keyword); }
.token-string { color: var(--code-string); }
.token-number { color: var(--code-number); }

.mermaid-preview {
  position: relative;
  height: 280px;
  margin: 0 18px 18px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--mermaid-bg);
}

.node {
  position: absolute;
  display: grid;
  place-items: center;
  width: 116px;
  height: 50px;
  border: 1px solid var(--mermaid-line);
  border-radius: 8px;
  color: var(--text-primary);
  background: var(--bg-primary);
  font: 13px 'JetBrains Mono', monospace;
}

.top-left { left: 28%; top: 30px; }
.top-right { right: 28%; top: 30px; }
.bottom-left { left: 28%; bottom: 30px; }
.bottom-right { right: 28%; bottom: 30px; }

.line {
  position: absolute;
  left: calc(28% + 116px);
  right: calc(28% + 116px);
  height: 2px;
  background: var(--mermaid-accent);
}

.line.one { top: 104px; }
.line.two { top: 142px; border-top: 1px dashed var(--mermaid-line); background: transparent; }
.line.three { top: 180px; }

:global(html.dark-mode) .setting-select,
:global(html.dark-mode) .font-number {
  background: rgba(12, 18, 15, .82);
  border-color: color-mix(in srgb, var(--primary-color) 20%, rgba(255,255,255,.08));
  color: #eef7f1;
}

@media (max-width: 760px) {
  .app-preview {
    width: 100%;
  }

  .compact-head {
    align-items: stretch;
    flex-direction: column;
  }

  .font-control {
    flex-wrap: wrap;
  }
}
</style>
