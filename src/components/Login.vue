<template>
  <div class="login-page" :class="{ dark: isDarkMode }">
    <canvas ref="particleCanvas" class="particle-bg"></canvas>

    <!-- ═══ 森林科技装饰层 ═══ -->
    <div class="forest-layer">
      <div class="aurora"></div>
      <div class="aurora aurora2"></div>

      <!-- ☆ 太阳（白天模式） -->
      <div class="sky-sun">
        <div class="sun-body">
          <div class="sun-face">
            <div class="sun-eye se-l"></div>
            <div class="sun-eye se-r"></div>
            <div class="sun-smile"></div>
          </div>
        </div>
        <div class="sun-ray sr1"></div>
        <div class="sun-ray sr2"></div>
        <div class="sun-ray sr3"></div>
        <div class="sun-ray sr4"></div>
        <div class="sun-ray sr5"></div>
        <div class="sun-ray sr6"></div>
        <div class="sun-ray sr7"></div>
        <div class="sun-ray sr8"></div>
        <div class="sun-halo"></div>
      </div>

      <!-- ☆ 星月（夜晚模式） -->
      <div class="sky-moon">
        <div class="moon-body">
          <div class="moon-shadow"></div>
          <div class="moon-crater cr1"></div>
          <div class="moon-crater cr2"></div>
          <div class="moon-crater cr3"></div>
        </div>
        <div class="moon-glow"></div>
        <div class="star st1"></div>
        <div class="star st2"></div>
        <div class="star st3"></div>
        <div class="star st4"></div>
        <div class="star st5"></div>
        <div class="star st6"></div>
        <div class="star st7"></div>
        <div class="star-cross sc1">+</div>
        <div class="star-cross sc2">+</div>
        <div class="star-cross sc3">+</div>
      </div>

      <!-- ★ 左树 (有脸) ★ -->
      <div class="tree tree-left">
        <div class="trunk"></div>
        <div class="canopy">
          <div class="canopy-layer c1"></div>
          <div class="canopy-layer c2"></div>
          <div class="canopy-layer c3"></div>
        </div>
        <!-- 漫画脸 -->
        <div class="tree-face" :class="faceClass">
          <div class="eye-area">
            <div class="eye left-eye">
              <div class="eyelid"></div>
              <div class="pupil" :style="leftPupilStyle"></div>
              <div class="eye-shine"></div>
            </div>
            <div class="eye right-eye">
              <div class="eyelid"></div>
              <div class="pupil" :style="leftPupilStyle"></div>
              <div class="eye-shine"></div>
            </div>
          </div>
          <div class="tree-mouth" :class="mouthClass">
            <div class="mouth-inner"></div>
          </div>
          <!-- 捂脸小手（从下方升起遮住眼睛） -->
          <div class="hand hand-l" :class="{ covering: isCovering }">
            <div class="palm"></div>
            <div class="finger f1"></div>
            <div class="finger f2"></div>
            <div class="finger f3"></div>
            <div class="finger f4"></div>
            <div class="thumb"></div>
          </div>
          <div class="hand hand-r" :class="{ covering: isCovering }">
            <div class="palm"></div>
            <div class="finger f1"></div>
            <div class="finger f2"></div>
            <div class="finger f3"></div>
            <div class="finger f4"></div>
            <div class="thumb"></div>
          </div>
          <!-- 腮红 -->
          <div class="blush blush-l" :class="{ show: isLooking || isCovering }"></div>
          <div class="blush blush-r" :class="{ show: isLooking || isCovering }"></div>
        </div>
        <div class="circuit-line cl1"></div>
        <div class="circuit-line cl2"></div>
        <div class="circuit-dot cd1"></div>
        <div class="circuit-dot cd2"></div>
        <div class="circuit-dot cd3"></div>
      </div>

      <!-- ★ 右树 (有脸) ★ -->
      <div class="tree tree-right">
        <div class="trunk"></div>
        <div class="canopy">
          <div class="canopy-layer c1"></div>
          <div class="canopy-layer c2"></div>
          <div class="canopy-layer c3"></div>
        </div>
        <div class="tree-face face-r" :class="faceClass">
          <div class="eye-area">
            <div class="eye left-eye">
              <div class="eyelid"></div>
              <div class="pupil" :style="rightPupilStyle"></div>
              <div class="eye-shine"></div>
            </div>
            <div class="eye right-eye">
              <div class="eyelid"></div>
              <div class="pupil" :style="rightPupilStyle"></div>
              <div class="eye-shine"></div>
            </div>
          </div>
          <div class="tree-mouth" :class="mouthClass">
            <div class="mouth-inner"></div>
          </div>
          <div class="hand hand-l" :class="{ covering: isCovering }">
            <div class="palm"></div>
            <div class="finger f1"></div>
            <div class="finger f2"></div>
            <div class="finger f3"></div>
            <div class="finger f4"></div>
            <div class="thumb"></div>
          </div>
          <div class="hand hand-r" :class="{ covering: isCovering }">
            <div class="palm"></div>
            <div class="finger f1"></div>
            <div class="finger f2"></div>
            <div class="finger f3"></div>
            <div class="finger f4"></div>
            <div class="thumb"></div>
          </div>
          <div class="blush blush-l" :class="{ show: isLooking || isCovering }"></div>
          <div class="blush blush-r" :class="{ show: isLooking || isCovering }"></div>
        </div>
        <div class="circuit-line cl1"></div>
        <div class="circuit-line cl2"></div>
        <div class="circuit-dot cd1"></div>
        <div class="circuit-dot cd2"></div>
      </div>

      <!-- 远景小树 -->
      <div class="tree-small ts1"><div class="trunk-s"></div><div class="canopy-s"></div></div>
      <div class="tree-small ts2"><div class="trunk-s"></div><div class="canopy-s"></div></div>
      <div class="tree-small ts3"><div class="trunk-s"></div><div class="canopy-s"></div></div>

      <!-- 蘑菇 -->
      <div class="mushroom mush1">
        <div class="mush-cap"></div><div class="mush-stem"></div><div class="mush-glow"></div>
        <div class="mush-dot md1"></div><div class="mush-dot md2"></div><div class="mush-dot md3"></div>
      </div>
      <div class="mushroom mush2">
        <div class="mush-cap"></div><div class="mush-stem"></div><div class="mush-glow"></div>
        <div class="mush-dot md1"></div><div class="mush-dot md2"></div>
      </div>

      <!-- 萤火虫 -->
      <div class="firefly ff1"></div><div class="firefly ff2"></div><div class="firefly ff3"></div>
      <div class="firefly ff4"></div><div class="firefly ff5"></div><div class="firefly ff6"></div>
      <div class="firefly ff7"></div><div class="firefly ff8"></div>

      <!-- 浮动树叶 -->
      <div class="leaf leaf1">🍃</div><div class="leaf leaf2">🍂</div><div class="leaf leaf3">🌿</div>
      <div class="leaf leaf4">🍃</div><div class="leaf leaf5">🌱</div>

      <!-- 地面 -->
      <div class="ground"></div>
      <div class="ground-glow"></div>
      <div class="grass g1"></div><div class="grass g2"></div><div class="grass g3"></div>
      <div class="grass g4"></div><div class="grass g5"></div>
    </div>

    <!-- 顶部工具栏 -->
    <div class="top-toolbar">
      <button class="tool-btn" @click="toggleLangMenu" ref="langBtnRef" :title="t('language')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 8l6 0"/><path d="M4 6l6.5 0M7.3 6v2"/><path d="M6 12c.7-2 2-3.3 3.5-4"/>
          <path d="M14 5h2a1 1 0 011 1v0c0 1.1-.9 2-2 2h-1"/><path d="M14 11l1.5-5H17l1.5 5"/><path d="M14.5 9.5h3"/>
          <path d="M3 19h4L12 12l5 7h4"/>
        </svg>
      </button>
      <Transition name="fade-pop">
        <div v-if="showLangMenu" class="lang-dropdown" ref="langDropRef">
          <button v-for="lang in langList" :key="lang.code" class="lang-item" :class="{ active: currentLang === lang.code }" @click="switchLang(lang.code)">
            <span class="lang-flag">{{ lang.flag }}</span>
            <span>{{ lang.label }}</span>
            <svg v-if="currentLang === lang.code" width="14" height="14" fill="none" stroke="var(--primary-color)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
          </button>
        </div>
      </Transition>
      <button class="tool-btn" @click="toggleDarkMode" :title="isDarkMode ? t('themeLight') : t('themeDark')">
        <svg v-if="!isDarkMode" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
      </button>
    </div>

    <!-- ═══ 主登录卡片 ═══ -->
    <div class="login-card" ref="loginCardRef">
      <div class="card-glow"></div>
      <div class="card-sparkle s1"></div><div class="card-sparkle s2"></div><div class="card-sparkle s3"></div>

      <div class="logo-area">
        <div class="logo-ring">
          <div class="logo-circle">
            <span class="logo-emoji">🦅</span>
          </div>
          <svg class="ring-svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="url(#rg)" stroke-width="2" stroke-dasharray="6 4" opacity="0.6"/><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4caf50"/><stop offset="100%" stop-color="#81c784"/></linearGradient></defs></svg>
        </div>
        <h1 class="brand-title">Honghu AI</h1>
        <p class="brand-sub">{{ t('welcomeSubtitle') }}</p>
      </div>

      <div class="tabs">
        <button :class="['tab', { active: activeTab === 'password' }]" @click="activeTab = 'password'">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" stroke-width="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke-width="1.8"/></svg>
          {{ t('login') }}
        </button>
        <button :class="['tab', { active: activeTab === 'phone' }]" @click="activeTab = 'phone'">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" stroke-width="1.8"/><line x1="12" y1="18" x2="12.01" y2="18" stroke-width="2"/></svg>
          {{ t('phoneLogin') }}
        </button>
        <button :class="['tab', { active: activeTab === 'wechat' }]" @click="activeTab = 'wechat'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.063.232.216.41.405.26l1.832-1.418a.59.59 0 01.558-.076c1.038.37 2.177.58 3.371.58.32 0 .636-.019.95-.05a5.9 5.9 0 01-.243-1.67c0-3.633 3.3-6.578 7.371-6.578.364 0 .722.027 1.074.076C17.49 4.89 13.45 2.188 8.691 2.188zm7.378 8.136c3.583 0 6.497 2.577 6.497 5.756 0 1.735-.91 3.296-2.34 4.354a.47.47 0 00-.17.529l.303 1.143c.049.183-.17.325-.32.207l-1.43-1.107a.47.47 0 00-.443-.06c-.797.284-1.67.444-2.587.444-3.583 0-6.497-2.577-6.497-5.756s2.914-5.51 6.987-5.51z"/></svg>
          {{ t('wechatLogin') }}
        </button>
        <div class="tab-indicator" :style="tabIndicatorStyle"></div>
      </div>

      <div class="form-body">
        <Transition name="form-slide" mode="out-in">
          <div v-if="activeTab === 'password'" key="pw" class="form-panel">
            <div class="field">
              <div class="field-inner" :class="{ focused: focusField === 'user' }">
                <svg class="field-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                <input v-model="form.username" type="text" :placeholder="t('usernamePlaceholder')" @focus="focusField='user'" @blur="focusField=''" @keyup.enter="handleLogin" />
              </div>
            </div>
            <div class="field">
              <div class="field-inner" :class="{ focused: focusField === 'pass' }">
                <svg class="field-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" stroke-width="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke-width="1.8"/></svg>
                <input v-model="form.password" :type="showPwd ? 'text' : 'password'" :placeholder="t('passwordPlaceholder')" @focus="focusField='pass'" @blur="focusField=''" @keyup.enter="handleLogin" />
                <button class="eye-btn" @click="showPwd = !showPwd" type="button">
                  <svg v-if="!showPwd" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="1.8" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3" stroke-width="1.8"/></svg>
                  <svg v-else width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="1.8" d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23" stroke-width="1.8"/></svg>
                </button>
              </div>
            </div>
            <div class="form-options">
              <label class="remember-me"><input type="checkbox" v-model="form.rememberMe" /><span class="check-box"></span><span>{{ t('rememberMe') }}</span></label>
              <a href="#" class="forgot-link" @click.prevent="emit('forgot-password')">{{ t('forgotPassword') }}</a>
            </div>
            <button class="submit-btn" @click="handleLogin" :disabled="isLoading">
              <span class="btn-shine"></span>
              <span v-if="!isLoading" class="btn-text">{{ t('loginBtn') }}</span>
              <span v-else class="btn-loading"><span class="spinner"></span></span>
            </button>
          </div>

          <div v-else-if="activeTab === 'phone'" key="ph" class="form-panel">
            <div class="field">
              <div class="field-inner" :class="{ focused: focusField === 'phone' }">
                <svg class="field-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" stroke-width="1.8"/><line x1="12" y1="18" x2="12.01" y2="18" stroke-width="2"/></svg>
                <input v-model="form.phone" type="tel" :placeholder="t('phonePlaceholder')" @focus="focusField='phone'" @blur="focusField=''" @keyup.enter="handlePhoneLogin" />
              </div>
            </div>
            <div class="field">
              <div class="field-inner code-row" :class="{ focused: focusField === 'code' }">
                <svg class="field-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                <input v-model="form.verificationCode" type="text" :placeholder="t('codePlaceholder')" maxlength="6" @focus="focusField='code'" @blur="focusField=''" @keyup.enter="handlePhoneLogin" />
                <button class="send-code" @click="handleSendCode" :disabled="isCodeSending || codeCooldown > 0">{{ codeCooldown > 0 ? codeCooldown + 's' : t('sendCode') }}</button>
              </div>
            </div>
            <button class="submit-btn" @click="handlePhoneLogin" :disabled="isLoading">
              <span class="btn-shine"></span>
              <span v-if="!isLoading" class="btn-text">{{ t('loginBtn') }}</span>
              <span v-else class="btn-loading"><span class="spinner"></span></span>
            </button>
          </div>

          <div v-else key="wx" class="form-panel wechat-panel">
            <div class="qr-wrap"><div class="qr-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="1.2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zm4 0h3v3h-3zm-4 4h3v3h-3zm4 4h3"/></svg>
              <p>{{ t('scanQR') }}</p>
            </div></div>
            <p class="wechat-hint">{{ t('wechatHint') }}</p>
          </div>
        </Transition>

        <Transition name="shake">
          <div v-if="errorMessage" class="error-bar">
            <svg width="16" height="16" fill="none" stroke="#e8433e" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="1.8"/><line x1="15" y1="9" x2="9" y2="15" stroke-width="1.8"/><line x1="9" y1="9" x2="15" y2="15" stroke-width="1.8"/></svg>
            <span>{{ errorMessage }}</span>
          </div>
        </Transition>
      </div>

      <div class="card-bottom">
        <span class="bottom-text">{{ t('noAccount') }}</span>
        <a href="#" class="register-link" @click.prevent="emit('register')">{{ t('registerAccount') }}</a>
      </div>
      <button class="skip-btn" @click="emit('skip')">{{ t('skipLogin') }} →</button>
    </div>

    <p class="copyright">&copy; 2026 Honghu AI. All rights reserved.</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { loginWithPassword, loginWithPhone, sendVerificationCode } from '@/api/auth'
import { t, setLanguage, getLanguage } from '@/utils/i18n'

const emit = defineEmits(['login', 'forgot-password', 'register', 'skip'])

const activeTab = ref('password')
const focusField = ref('')
const showPwd = ref(false)
const isDarkMode = ref(document.documentElement.classList.contains('dark-mode'))
const showLangMenu = ref(false)
const currentLang = ref(getLanguage())
const langBtnRef = ref(null)
const langDropRef = ref(null)
const particleCanvas = ref(null)
const loginCardRef = ref(null)

const langList = [
  { code: 'zh', flag: '🇨🇳', label: '简体中文' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'ja', flag: '🇯🇵', label: '日本語' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'ru', flag: '🇷🇺', label: 'Русский' },
  { code: 'ar', flag: '🇸🇦', label: 'العربية' },
]

const form = ref({ username: '', password: '', rememberMe: true, phone: '', verificationCode: '' })
const isLoading = ref(false)
const isCodeSending = ref(false)
const codeCooldown = ref(0)
const errorMessage = ref('')

const tabIndicatorStyle = computed(() => {
  const idx = activeTab.value === 'password' ? 0 : activeTab.value === 'phone' ? 1 : 2
  return { transform: `translateX(${idx * 100}%)`, width: '33.333%' }
})

/* ══ 树脸交互状态 ══ */
const isLooking = computed(() => ['user', 'phone'].includes(focusField.value))
const isCovering = computed(() => ['pass', 'code'].includes(focusField.value))

const faceClass = computed(() => ({
  looking: isLooking.value,
  covering: isCovering.value,
  idle: !isLooking.value && !isCovering.value
}))
const mouthClass = computed(() => ({
  'mouth-o': isLooking.value,
  'mouth-hide': isCovering.value
}))

// 左树瞳孔方向 → 向右看（朝卡片）
const leftPupilStyle = computed(() => {
  if (isCovering.value) return { transform: 'translate(0, 0)' }
  if (isLooking.value) return { transform: 'translate(4px, 2px)' }
  return { transform: 'translate(0, 0)' }
})
// 右树瞳孔方向 → 向左看
const rightPupilStyle = computed(() => {
  if (isCovering.value) return { transform: 'translate(0, 0)' }
  if (isLooking.value) return { transform: 'translate(-4px, 2px)' }
  return { transform: 'translate(0, 0)' }
})

const toggleLangMenu = () => { showLangMenu.value = !showLangMenu.value }
const switchLang = (code) => { setLanguage(code); currentLang.value = code; showLangMenu.value = false }
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark-mode', isDarkMode.value)
  localStorage.setItem('themeMode', isDarkMode.value ? 'dark' : 'light')
}
const onClickOutsideLang = (e) => {
  if (langBtnRef.value && !langBtnRef.value.contains(e.target) && langDropRef.value && !langDropRef.value.contains(e.target)) showLangMenu.value = false
}

/* ── 粒子背景 ── */
let animFrameId = null
const initParticles = () => {
  const canvas = particleCanvas.value; if (!canvas) return
  const ctx = canvas.getContext('2d')
  let w = canvas.width = window.innerWidth, h = canvas.height = window.innerHeight
  const ps = []; const count = Math.min(50, Math.floor(w * h / 20000))
  for (let i = 0; i < count; i++) ps.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, r: Math.random() * 1.8 + 0.8, o: Math.random() * 0.3 + 0.05 })
  const draw = () => {
    ctx.clearRect(0, 0, w, h)
    const c = isDarkMode.value ? '120,200,140' : '76,175,80'
    ps.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(${c},${p.o})`; ctx.fill() })
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) { const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y, d = Math.sqrt(dx*dx+dy*dy); if (d < 130) { ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y); ctx.strokeStyle = `rgba(${c},${0.06*(1-d/130)})`; ctx.lineWidth = 0.5; ctx.stroke() } }
    animFrameId = requestAnimationFrame(draw)
  }
  draw()
  window.addEventListener('resize', () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight })
}

/* ── 登录逻辑 ── */
const handleLogin = async () => {
  errorMessage.value = ''
  if (!form.value.username.trim()) { errorMessage.value = t('usernamePlaceholder'); return }
  if (!form.value.password.trim()) { errorMessage.value = t('passwordPlaceholder'); return }
  isLoading.value = true
  try {
    const r = await loginWithPassword(form.value.username, form.value.password)
    localStorage.setItem('userId', r.userId); localStorage.setItem('username', r.username); localStorage.setItem('userInfo', JSON.stringify(r)); localStorage.setItem('isLoggedIn', 'true')
    if (form.value.rememberMe) localStorage.setItem('rememberMe', 'true')
    emit('login', { userId: r.userId, username: r.username, nickname: r.nickname || r.username, email: r.email, phone: r.phone, avatar: r.avatar })
  } catch (e) { errorMessage.value = e.message || t('loginFailed') } finally { isLoading.value = false }
}
const handleSendCode = async () => {
  if (!form.value.phone.trim()) { errorMessage.value = t('phonePlaceholder'); return }
  if (!/^1[3-9]\d{9}$/.test(form.value.phone)) { errorMessage.value = t('invalidPhone'); return }
  isCodeSending.value = true; errorMessage.value = ''
  try { await sendVerificationCode(form.value.phone); codeCooldown.value = 60; const t2 = setInterval(() => { codeCooldown.value--; if (codeCooldown.value <= 0) clearInterval(t2) }, 1000) }
  catch (e) { errorMessage.value = e.message || t('sendCodeFailed') } finally { isCodeSending.value = false }
}
const handlePhoneLogin = async () => {
  errorMessage.value = ''
  if (!form.value.phone.trim()) { errorMessage.value = t('phonePlaceholder'); return }
  if (!form.value.verificationCode.trim()) { errorMessage.value = t('codePlaceholder'); return }
  if (form.value.verificationCode.length !== 6) { errorMessage.value = t('codeInvalid'); return }
  isLoading.value = true
  try {
    const r = await loginWithPhone(form.value.phone, form.value.verificationCode)
    localStorage.setItem('userId', r.userId); localStorage.setItem('username', r.username); localStorage.setItem('userInfo', JSON.stringify(r)); localStorage.setItem('isLoggedIn', 'true')
    emit('login', { userId: r.userId, username: r.username, nickname: r.nickname || r.username, email: r.email, phone: r.phone, avatar: r.avatar })
  } catch (e) { errorMessage.value = e.message || t('loginFailed') } finally { isLoading.value = false }
}

onMounted(() => { document.addEventListener('click', onClickOutsideLang); initParticles() })
onBeforeUnmount(() => { document.removeEventListener('click', onClickOutsideLang); if (animFrameId) cancelAnimationFrame(animFrameId) })
</script>

<style scoped>
/* ═══════════════════════════════════════════════════
   Login Page — Sci-Fi Forest with Interactive Eyes
   ═══════════════════════════════════════════════════ */
.login-page {
  position: relative; width: 100%; height: 100vh; min-height: 640px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: linear-gradient(170deg, #e8f5e9 0%, #c8e6c9 30%, #a5d6a7 60%, #dcedc8 100%);
  overflow: hidden; transition: background 0.5s;
}
.login-page.dark {
  background: linear-gradient(170deg, #0a0f0d 0%, #0d1a14 30%, #101f16 60%, #0a1610 100%);
}
.particle-bg { position: absolute; inset: 0; z-index: 1; pointer-events: none; }

/* ═══ 太阳（白天模式） ═══ */
.sky-sun {
  position: absolute; top: -20px; left: -20px;
  width: 160px; height: 160px; z-index: 3;
  transition: opacity 0.6s, transform 0.6s;
}
.dark .sky-sun { opacity: 0; transform: scale(0.5) rotate(-60deg); pointer-events: none; }

.sun-body {
  position: absolute; top: 30px; left: 30px;
  width: 80px; height: 80px; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff7a1 0%, #ffe066 30%, #ffb300 70%, #ff8f00 100%);
  box-shadow: 0 0 40px 10px rgba(255,183,0,0.35), 0 0 80px 20px rgba(255,183,0,0.15), inset 0 -6px 12px rgba(255,143,0,0.3);
  animation: sunPulse 4s ease-in-out infinite;
}
@keyframes sunPulse {
  0%, 100% { box-shadow: 0 0 40px 10px rgba(255,183,0,0.35), 0 0 80px 20px rgba(255,183,0,0.15), inset 0 -6px 12px rgba(255,143,0,0.3); }
  50% { box-shadow: 0 0 50px 15px rgba(255,183,0,0.4), 0 0 100px 30px rgba(255,183,0,0.18), inset 0 -6px 12px rgba(255,143,0,0.3); }
}

/* 太阳表情 */
.sun-face { position: absolute; inset: 0; }
.sun-eye {
  position: absolute; top: 32px;
  width: 6px; height: 7px; border-radius: 50%;
  background: #d84315;
}
.se-l { left: 24px; }
.se-r { left: 50px; }
.sun-smile {
  position: absolute; top: 44px; left: 50%; transform: translateX(-50%);
  width: 20px; height: 10px;
  border: 2.5px solid #d84315; border-top: none;
  border-radius: 0 0 12px 12px;
}

/* 太阳光线 */
.sun-ray {
  position: absolute;
  top: 50%; left: 50%; width: 4px; height: 18px;
  background: linear-gradient(180deg, #ffe082 0%, rgba(255,224,130,0) 100%);
  border-radius: 3px;
  transform-origin: center -22px;
  animation: rayPulse 3s ease-in-out infinite;
}
.sr1 { transform: rotate(0deg) translateY(-50px); }
.sr2 { transform: rotate(45deg) translateY(-50px); }
.sr3 { transform: rotate(90deg) translateY(-50px); }
.sr4 { transform: rotate(135deg) translateY(-50px); }
.sr5 { transform: rotate(180deg) translateY(-50px); }
.sr6 { transform: rotate(225deg) translateY(-50px); }
.sr7 { transform: rotate(270deg) translateY(-50px); }
.sr8 { transform: rotate(315deg) translateY(-50px); }
.sr1, .sr3, .sr5, .sr7 { width: 3px; height: 22px; }
.sr2, .sr4, .sr6, .sr8 { width: 2.5px; height: 14px; opacity: 0.7; }
@keyframes rayPulse {
  0%, 100% { opacity: 0.8; height: 18px; }
  50% { opacity: 1; height: 22px; }
}

/* 太阳光晕 */
.sun-halo {
  position: absolute; top: 10px; left: 10px;
  width: 120px; height: 120px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,235,59,0.12) 0%, rgba(255,235,59,0.04) 50%, transparent 70%);
  animation: haloBreath 5s ease-in-out infinite;
}
@keyframes haloBreath {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.15); opacity: 1; }
}

/* ═══ 星月（夜晚模式） ═══ */
.sky-moon {
  position: absolute; top: 15px; left: 30px;
  width: 200px; height: 180px; z-index: 3;
  opacity: 0; transform: scale(0.5) rotate(30deg);
  transition: opacity 0.8s 0.1s, transform 0.8s 0.1s;
  pointer-events: none;
}
.dark .sky-moon { opacity: 1; transform: scale(1) rotate(0deg); pointer-events: auto; }

.moon-body {
  position: absolute; top: 10px; left: 20px;
  width: 65px; height: 65px; border-radius: 50%;
  background: radial-gradient(circle at 40% 35%, #fffde7 0%, #fff9c4 40%, #f0e68c 80%, #dac56e 100%);
  box-shadow: 0 0 30px 8px rgba(255,249,196,0.3), 0 0 60px 15px rgba(255,249,196,0.12), inset 0 -4px 10px rgba(218,197,110,0.3);
  overflow: hidden;
}

/* 月球阴影（形成弯月效果） */
.moon-shadow {
  position: absolute; top: -8px; right: -18px;
  width: 58px; height: 72px; border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, #0d1b2a 0%, #0d1b2a 60%, transparent 100%);
  opacity: 0.88;
}

/* 月球环形山 */
.moon-crater {
  position: absolute; border-radius: 50%;
  background: radial-gradient(circle, rgba(218,197,110,0.5) 0%, rgba(240,230,140,0.2) 100%);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
}
.cr1 { width: 10px; height: 10px; top: 18px; left: 10px; }
.cr2 { width: 7px; height: 7px; top: 38px; left: 22px; }
.cr3 { width: 5px; height: 5px; top: 28px; left: 32px; opacity: 0.7; }

/* 月光光晕 */
.moon-glow {
  position: absolute; top: -15px; left: -5px;
  width: 110px; height: 110px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,249,196,0.1) 0%, rgba(255,249,196,0.04) 45%, transparent 70%);
  animation: moonGlow 6s ease-in-out infinite;
}
@keyframes moonGlow {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.2); opacity: 1; }
}

/* ★ 星星（小圆点） */
.star {
  position: absolute; border-radius: 50%;
  background: #fffde7;
  box-shadow: 0 0 6px 2px rgba(255,253,231,0.5);
  animation: starTwinkle 3s ease-in-out infinite;
}
.st1 { width: 4px; height: 4px; top: 25px; left: 110px; animation-delay: 0s; }
.st2 { width: 3px; height: 3px; top: 55px; left: 140px; animation-delay: 0.8s; }
.st3 { width: 3.5px; height: 3.5px; top: 8px; left: 155px; animation-delay: 1.5s; }
.st4 { width: 2.5px; height: 2.5px; top: 75px; left: 100px; animation-delay: 2.2s; }
.st5 { width: 3px; height: 3px; top: 42px; left: 175px; animation-delay: 0.5s; }
.st6 { width: 2px; height: 2px; top: 15px; left: 75px; animation-delay: 1.8s; }
.st7 { width: 2.5px; height: 2.5px; top: 65px; left: 55px; animation-delay: 1.2s; }
@keyframes starTwinkle {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.4); }
}

/* ★ 十字星星 */
.star-cross {
  position: absolute;
  color: #fffde7; font-size: 16px; font-weight: 300; line-height: 1;
  text-shadow: 0 0 8px rgba(255,253,231,0.6);
  animation: starTwinkle 4s ease-in-out infinite;
}
.sc1 { top: 35px; left: 130px; font-size: 18px; animation-delay: 0.3s; }
.sc2 { top: 80px; left: 160px; font-size: 12px; animation-delay: 1.6s; }
.sc3 { top: 5px; left: 90px; font-size: 14px; animation-delay: 2.5s; }

/* ── 极光（仅夜间模式） ── */
.aurora {
  position: absolute; top: -40%; left: -10%; width: 120%; height: 70%;
  background: radial-gradient(ellipse at 30% 50%, rgba(76,175,80,0.12) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 30%, rgba(129,199,132,0.1) 0%, transparent 55%);
  filter: blur(40px); animation: auroraMove 12s ease-in-out infinite alternate; z-index: 1;
  opacity: 0; transition: opacity 0.8s;
}
.aurora2 {
  top: -30%; left: 20%; width: 80%; height: 60%;
  background: radial-gradient(ellipse at 60% 50%, rgba(165,214,167,0.1) 0%, transparent 55%);
  animation-delay: -6s; animation-duration: 15s;
}
.dark .aurora {
  opacity: 1;
  background: radial-gradient(ellipse at 30% 50%, rgba(76,175,80,0.08) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 30%, rgba(0,230,118,0.07) 0%, transparent 55%);
}
@keyframes auroraMove {
  0% { transform: translateX(-3%) scale(1); }
  100% { transform: translateX(3%) translateY(-2%) scale(1.05); }
}
.forest-layer { position: absolute; inset: 0; z-index: 2; pointer-events: none; overflow: hidden; }

/* ═══ 科技树 ═══ */
.tree { position: absolute; bottom: 0; z-index: 3; }
.tree-left { left: 3%; }
.tree-right { right: 4%; }

.trunk {
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 20px; border-radius: 5px 5px 0 0;
  background: linear-gradient(180deg, #5d4037 0%, #795548 50%, #6d4c41 100%);
}
.tree-left .trunk { height: 200px; }
.tree-right .trunk { height: 170px; }
.dark .trunk { background: linear-gradient(180deg, #2e1f15 0%, #3e2723 100%); }

.canopy { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); }
.tree-left .canopy { bottom: 150px; }
.tree-right .canopy { bottom: 125px; }

.canopy-layer { position: absolute; left: 50%; transform: translateX(-50%); border-radius: 50%; }
.canopy-layer.c1 {
  width: 120px; height: 120px; bottom: 0;
  background: radial-gradient(circle at 40% 35%, #66bb6a, #2e7d32);
  box-shadow: 0 0 30px rgba(76,175,80,0.3), inset 0 -10px 20px rgba(0,0,0,0.15);
}
.canopy-layer.c2 {
  width: 95px; height: 95px; bottom: 50px;
  background: radial-gradient(circle at 40% 35%, #81c784, #43a047);
  box-shadow: 0 0 25px rgba(76,175,80,0.2);
}
.canopy-layer.c3 {
  width: 65px; height: 65px; bottom: 90px;
  background: radial-gradient(circle at 40% 35%, #a5d6a7, #4caf50);
  box-shadow: 0 0 20px rgba(76,175,80,0.15);
}
.tree-right .canopy-layer.c1 { width: 100px; height: 100px; }
.tree-right .canopy-layer.c2 { width: 78px; height: 78px; bottom: 42px; }
.tree-right .canopy-layer.c3 { width: 52px; height: 52px; bottom: 75px; }
.dark .canopy-layer.c1 {
  background: radial-gradient(circle at 40% 35%, #2e7d32, #1b5e20);
  box-shadow: 0 0 30px rgba(76,175,80,0.15), 0 0 60px rgba(0,230,118,0.05);
}
.dark .canopy-layer.c2 { background: radial-gradient(circle at 40% 35%, #388e3c, #2e7d32); }
.dark .canopy-layer.c3 { background: radial-gradient(circle at 40% 35%, #43a047, #388e3c); }

/* 电路线 & 节点 */
.circuit-line {
  position: absolute; bottom: 0; left: 50%; width: 2px;
  background: linear-gradient(180deg, transparent, rgba(0,230,118,0.6), transparent);
  animation: circuitPulse 3s ease-in-out infinite;
}
.cl1 { height: 130px; margin-left: -1px; }
.cl2 { height: 85px; margin-left: 7px; animation-delay: 1.5s; }
.tree-right .cl1 { height: 110px; }
.tree-right .cl2 { height: 70px; margin-left: -7px; }
@keyframes circuitPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }

.circuit-dot {
  position: absolute; width: 6px; height: 6px; border-radius: 50%;
  background: #69f0ae; box-shadow: 0 0 8px rgba(105,240,174,0.8);
  animation: dotBlink 2s ease-in-out infinite;
}
.tree-left .cd1 { bottom: 65px; left: calc(50% - 3px); animation-delay: 0.3s; }
.tree-left .cd2 { bottom: 105px; left: calc(50% + 4px); animation-delay: 1s; }
.tree-left .cd3 { bottom: 140px; left: calc(50%); animation-delay: 1.7s; }
.tree-right .cd1 { bottom: 55px; left: calc(50% - 3px); animation-delay: 0.5s; }
.tree-right .cd2 { bottom: 90px; left: calc(50% + 3px); animation-delay: 1.3s; }
.dark .circuit-dot { background: #00e676; box-shadow: 0 0 12px rgba(0,230,118,0.9), 0 0 24px rgba(0,230,118,0.4); }
@keyframes dotBlink {
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.3); }
}

/* ═══════════════════════════════════════════════════
   树脸 — 漫画风格交互眼睛 + 捂眼小手
   ═══════════════════════════════════════════════════ */
.tree-face {
  position: absolute; left: 50%; transform: translateX(-50%);
  z-index: 5; width: 80px; height: 65px;
}
.tree-left .tree-face { bottom: 180px; }
.tree-right .tree-face { bottom: 150px; }
.face-r { width: 68px; height: 56px; }

.eye-area {
  display: flex; justify-content: center; gap: 14px;
  padding-top: 4px; position: relative; z-index: 2;
}
.face-r .eye-area { gap: 10px; }

/* 单只眼睛 */
.eye {
  width: 26px; height: 26px; background: #fff;
  border-radius: 50%; position: relative; overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
}
.face-r .eye { width: 22px; height: 22px; }
.dark .eye {
  background: #e8f5e9;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.15), 0 0 12px rgba(105,240,174,0.1);
}

/* 眼皮 */
.eyelid {
  position: absolute; top: -2px; left: -2px; right: -2px; height: 50%;
  background: #43a047; border-radius: 50% 50% 0 0; z-index: 3;
  transform-origin: bottom center;
  transition: transform 0.5s cubic-bezier(0.34,1.56,0.64,1);
  transform: scaleY(0.35);
}
.dark .eyelid { background: #2e7d32; }

/* 空闲状态：半闭 + 偶尔眨眼 */
.idle .eyelid {
  animation: blinkIdle 4s ease-in-out infinite;
  transform: scaleY(0.35);
}
/* 注视状态：眼睛大睁 */
.looking .eyelid {
  transform: scaleY(0.05) !important;
  animation: none;
}
.looking .eye {
  transform: scale(1.2);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.1), 0 2px 12px rgba(76,175,80,0.2);
}
/* 遮挡状态：紧闭 */
.covering .eyelid {
  transform: scaleY(1.1) !important;
  animation: none;
}
.covering .eye { transform: scale(0.9); }

@keyframes blinkIdle {
  0%, 42%, 48%, 100% { transform: scaleY(0.35); }
  45% { transform: scaleY(1.1); }
}

/* 瞳孔 */
.pupil {
  position: absolute; width: 12px; height: 12px;
  background: radial-gradient(circle at 40% 35%, #333, #111);
  border-radius: 50%; top: 50%; left: 50%;
  margin-top: -6px; margin-left: -6px;
  transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
  z-index: 2;
}
.face-r .pupil { width: 10px; height: 10px; margin-top: -5px; margin-left: -5px; }
.dark .pupil { background: radial-gradient(circle at 40% 35%, #1b5e20, #0a2e0f); }
.looking .pupil { transform: translate(var(--px, 4px), var(--py, 2px)) scale(1.1); }

/* 高光 */
.eye-shine {
  position: absolute; width: 6px; height: 6px; background: rgba(255,255,255,0.9);
  border-radius: 50%; top: 6px; left: 7px; z-index: 4;
  transition: all 0.3s;
}
.face-r .eye-shine { width: 5px; height: 5px; top: 5px; left: 6px; }
.covering .eye-shine { opacity: 0; }

/* 嘴巴 */
.tree-mouth {
  width: 16px; height: 8px; margin: 6px auto 0;
  border-radius: 0 0 10px 10px; background: #2e7d32;
  transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
  position: relative; overflow: hidden;
}
.face-r .tree-mouth { width: 13px; height: 6px; margin-top: 4px; }
.mouth-inner {
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 8px; height: 4px; background: #c62828; border-radius: 0 0 6px 6px;
}
.face-r .mouth-inner { width: 6px; height: 3px; }
.tree-mouth.mouth-o {
  width: 14px; height: 14px; border-radius: 50%;
  animation: mouthWow 0.5s ease-out;
}
.face-r .tree-mouth.mouth-o { width: 11px; height: 11px; }
.mouth-o .mouth-inner { width: 6px; height: 6px; border-radius: 50%; }
/* 害羞：嘴巴变成波浪线 */
.tree-mouth.mouth-hide {
  width: 18px; height: 4px; border-radius: 4px;
  background: #c62828; overflow: visible;
}
.mouth-hide .mouth-inner { display: none; }
@keyframes mouthWow {
  0% { transform: scale(0.5); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

/* ═══ 捂脸小手 ✋（黄色皮肤色，从下方升起遮住眼睛） ═══ */
.hand {
  position: absolute;
  width: 36px; height: 28px;
  bottom: 0px; z-index: 12;
  transition: transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s;
  transform: translateY(50px);
  opacity: 0; pointer-events: none;
}
.hand-l { left: -2px; transform: translateY(50px) rotate(6deg); }
.hand-r { right: -2px; transform: translateY(50px) rotate(-6deg); }
.face-r .hand { width: 30px; height: 24px; }
.face-r .hand-l { left: -1px; }
.face-r .hand-r { right: -1px; }

/* 手掌 */
.palm {
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 26px; height: 20px;
  border-radius: 5px 5px 8px 8px;
  background: linear-gradient(180deg, #ffcc02 0%, #f5b731 100%);
  box-shadow: 0 2px 6px rgba(0,0,0,0.12), inset 0 1px 2px rgba(255,255,255,0.25);
}
.face-r .palm { width: 22px; height: 17px; }
.dark .palm { background: linear-gradient(180deg, #e6b800 0%, #d4a017 100%); }

/* 4根手指（从手掌顶部伸出） */
.finger {
  position: absolute;
  width: 5.5px; border-radius: 3px 3px 2px 2px;
  background: linear-gradient(180deg, #ffcc02 0%, #f0b020 100%);
  box-shadow: 0 -1px 2px rgba(0,0,0,0.08);
}
.dark .finger { background: linear-gradient(180deg, #e6b800 0%, #d4a017 100%); }
.f1 { height: 13px; top: -5px; left: 6px; }
.f2 { height: 15px; top: -7px; left: 11.5px; }
.f3 { height: 14px; top: -6px; left: 17px; }
.f4 { height: 12px; top: -4px; left: 22.5px; }
.face-r .f1 { height: 11px; top: -4px; left: 4px; width: 4.5px; }
.face-r .f2 { height: 13px; top: -6px; left: 9px; width: 4.5px; }
.face-r .f3 { height: 12px; top: -5px; left: 14px; width: 4.5px; }
.face-r .f4 { height: 10px; top: -3px; left: 19px; width: 4.5px; }

/* 大拇指（侧面伸出） */
.thumb {
  position: absolute;
  width: 5.5px; height: 11px;
  border-radius: 3px;
  background: linear-gradient(180deg, #ffcc02 0%, #f0b020 100%);
  box-shadow: 0 -1px 2px rgba(0,0,0,0.08);
}
.dark .thumb { background: linear-gradient(180deg, #e6b800 0%, #d4a017 100%); }
.hand-l .thumb { bottom: 4px; left: -2px; transform: rotate(25deg); }
.hand-r .thumb { bottom: 4px; right: -2px; transform: rotate(-25deg); }
.face-r .thumb { width: 4.5px; height: 9px; }

/* 捂脸状态：两手从下方大幅升起遮住眼睛 */
.hand.covering {
  opacity: 1;
}
.hand-l.covering {
  animation: handRiseL 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
}
.hand-r.covering {
  animation: handRiseR 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
}

@keyframes handRiseL {
  0%   { transform: translateY(50px) rotate(6deg) scale(0.8); opacity: 0; }
  30%  { opacity: 1; }
  60%  { transform: translateY(-38px) rotate(-4deg) scale(1.06); }
  100% { transform: translateY(-32px) rotate(3deg) scale(1); opacity: 1; }
}
@keyframes handRiseR {
  0%   { transform: translateY(50px) rotate(-6deg) scale(0.8); opacity: 0; }
  30%  { opacity: 1; }
  60%  { transform: translateY(-38px) rotate(4deg) scale(1.06); }
  100% { transform: translateY(-32px) rotate(-3deg) scale(1); opacity: 1; }
}

/* 害羞时整个树脸微微摇摆 */
.tree-face.covering {
  animation: shyWiggle 2.5s ease-in-out infinite;
}
@keyframes shyWiggle {
  0%, 100% { transform: translateX(-50%) rotate(0deg); }
  25% { transform: translateX(-50%) rotate(-1.5deg); }
  75% { transform: translateX(-50%) rotate(1.5deg); }
}

/* 腮红 */
.blush {
  position: absolute; width: 16px; height: 10px; border-radius: 50%;
  background: rgba(239,83,80,0.4); filter: blur(4px);
  opacity: 0; transition: opacity 0.5s 0.2s; top: 34px;
}
.face-r .blush { width: 12px; height: 8px; top: 28px; }
.blush-l { left: 2px; }
.blush-r { right: 2px; }
.face-r .blush-l { left: 0px; }
.face-r .blush-r { right: 0px; }
.blush.show { opacity: 1; }

/* ── 远景小树 ── */
.tree-small { position: absolute; bottom: 0; }
.ts1 { left: 18%; } .ts2 { right: 20%; } .ts3 { left: 32%; }
.trunk-s {
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 8px; border-radius: 3px 3px 0 0;
  background: linear-gradient(180deg, #795548, #8d6e63);
}
.ts1 .trunk-s { height: 70px; }
.ts2 .trunk-s { height: 55px; }
.ts3 .trunk-s { height: 45px; }
.canopy-s {
  position: absolute; left: 50%; transform: translateX(-50%);
  border-radius: 50%; opacity: 0.55;
  background: radial-gradient(circle at 40% 35%, #81c784, #4caf50);
}
.ts1 .canopy-s { width: 48px; height: 48px; bottom: 50px; }
.ts2 .canopy-s { width: 38px; height: 38px; bottom: 38px; }
.ts3 .canopy-s { width: 30px; height: 30px; bottom: 32px; }
.dark .trunk-s { background: linear-gradient(180deg, #3e2723, #4e342e); }
.dark .canopy-s { background: radial-gradient(circle at 40% 35%, #2e7d32, #1b5e20); opacity: 0.35; }

/* ── 蘑菇 ── */
.mushroom { position: absolute; bottom: 0; z-index: 3; }
.mush1 { left: 8%; } .mush2 { left: 15%; }
.mush-cap {
  position: absolute; left: 50%; transform: translateX(-50%);
  border-radius: 50% 50% 8px 8px;
  background: linear-gradient(135deg, #ef5350, #e53935);
  box-shadow: 0 4px 16px rgba(239,83,80,0.3);
}
.mush1 .mush-cap { width: 38px; height: 24px; bottom: 32px; }
.mush2 .mush-cap { width: 28px; height: 17px; bottom: 24px; }
.dark .mush-cap { background: linear-gradient(135deg, #b71c1c, #c62828); box-shadow: 0 0 20px rgba(239,83,80,0.2); }
.mush-stem {
  position: absolute; left: 50%; transform: translateX(-50%); bottom: 0;
  border-radius: 3px 3px 0 0;
  background: linear-gradient(180deg, #ffecb3, #ffe082);
}
.mush1 .mush-stem { width: 10px; height: 32px; }
.mush2 .mush-stem { width: 7px; height: 24px; }
.dark .mush-stem { background: linear-gradient(180deg, #5d4037, #6d4c41); }
.mush-glow {
  position: absolute; left: 50%; transform: translateX(-50%);
  border-radius: 50%; background: rgba(239,83,80,0.15); filter: blur(12px);
  animation: mushGlow 3s ease-in-out infinite alternate;
}
.mush1 .mush-glow { width: 60px; height: 40px; bottom: 10px; }
.mush2 .mush-glow { width: 40px; height: 30px; bottom: 8px; }
@keyframes mushGlow { 0% { opacity: 0.5; } 100% { opacity: 1; } }
.mush-dot { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.85); }
.mush1 .md1 { width: 6px; height: 6px; bottom: 38px; left: calc(50% - 9px); }
.mush1 .md2 { width: 4px; height: 4px; bottom: 42px; left: calc(50% + 5px); }
.mush1 .md3 { width: 5px; height: 5px; bottom: 35px; left: calc(50% + 9px); }
.mush2 .md1 { width: 4px; height: 4px; bottom: 29px; left: calc(50% - 6px); }
.mush2 .md2 { width: 3px; height: 3px; bottom: 32px; left: calc(50% + 4px); }

/* ── 萤火虫（仅夜间模式） ── */
.firefly {
  position: absolute; width: 4px; height: 4px; border-radius: 50%;
  background: #69f0ae;
  box-shadow: 0 0 6px 2px rgba(105,240,174,0.7), 0 0 20px rgba(105,240,174,0.3);
  animation: fireflyFloat 8s ease-in-out infinite;
  opacity: 0; transition: opacity 0.8s;
}
.dark .firefly {
  opacity: 1;
}
.ff1 { left: 10%; bottom: 30%; animation-duration: 9s; }
.ff2 { left: 25%; bottom: 45%; animation-duration: 7s; animation-delay: -2s; }
.ff3 { right: 15%; bottom: 35%; animation-duration: 10s; animation-delay: -4s; }
.ff4 { right: 25%; bottom: 55%; animation-duration: 8s; animation-delay: -1s; }
.ff5 { left: 40%; bottom: 65%; animation-duration: 11s; animation-delay: -3s; }
.ff6 { right: 35%; bottom: 25%; animation-duration: 7.5s; animation-delay: -5s; }
.ff7 { left: 15%; bottom: 60%; animation-duration: 9.5s; animation-delay: -7s; }
.ff8 { right: 10%; bottom: 50%; animation-duration: 8.5s; animation-delay: -6s; }
@keyframes fireflyFloat {
  0% { transform: translate(0, 0) scale(1); opacity: 0; }
  10% { opacity: 1; }
  25% { transform: translate(30px, -40px) scale(1.2); }
  50% { transform: translate(-20px, -70px) scale(0.8); opacity: 0.6; }
  75% { transform: translate(40px, -30px) scale(1.1); opacity: 1; }
  90% { opacity: 0.8; }
  100% { transform: translate(0, 0) scale(1); opacity: 0; }
}

/* ── 浮动树叶 ── */
.leaf {
  position: absolute; font-size: 20px; opacity: 0;
  animation: leafFall linear infinite;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}
.leaf1 { left: 15%; top: -5%; animation-duration: 14s; font-size: 18px; }
.leaf2 { left: 45%; top: -5%; animation-duration: 18s; animation-delay: -4s; font-size: 22px; }
.leaf3 { right: 20%; top: -5%; animation-duration: 16s; animation-delay: -8s; font-size: 16px; }
.leaf4 { left: 70%; top: -5%; animation-duration: 20s; animation-delay: -12s; }
.leaf5 { left: 35%; top: -5%; animation-duration: 15s; animation-delay: -6s; font-size: 14px; }
@keyframes leafFall {
  0% { transform: translateY(0) rotate(0deg) translateX(0); opacity: 0; }
  5% { opacity: 0.7; }
  50% { transform: translateY(50vh) rotate(180deg) translateX(60px); opacity: 0.5; }
  95% { opacity: 0.3; }
  100% { transform: translateY(105vh) rotate(360deg) translateX(-30px); opacity: 0; }
}

/* ── 地面 ── */
.ground {
  position: absolute; bottom: 0; left: 0; right: 0; height: 60px;
  background: linear-gradient(180deg, rgba(56,142,60,0.15) 0%, rgba(46,125,50,0.25) 100%);
  border-radius: 50% 50% 0 0 / 30px 30px 0 0;
}
.dark .ground {
  background: linear-gradient(180deg, rgba(27,94,32,0.2) 0%, rgba(10,50,20,0.4) 100%);
}
.ground-glow {
  position: absolute; bottom: 0; left: 10%; right: 10%; height: 3px;
  background: linear-gradient(90deg, transparent, rgba(105,240,174,0.3), rgba(0,230,118,0.5), rgba(105,240,174,0.3), transparent);
  border-radius: 2px; animation: groundGlow 4s ease-in-out infinite alternate;
}
@keyframes groundGlow { 0% { opacity: 0.4; } 100% { opacity: 1; } }
.grass {
  position: absolute; bottom: 2px; width: 0; height: 0;
  border-left: 4px solid transparent; border-right: 4px solid transparent;
  border-bottom: 18px solid rgba(76,175,80,0.4);
}
.g1 { left: 6%; border-bottom-width: 22px; }
.g2 { left: 9%; border-bottom-width: 16px; }
.g3 { right: 7%; border-bottom-width: 20px; }
.g4 { right: 12%; border-bottom-width: 14px; }
.g5 { left: 50%; border-bottom-width: 18px; }
.dark .grass { border-bottom-color: rgba(46,125,50,0.3); }

/* ═══ 顶部工具栏 ═══ */
.top-toolbar {
  position: absolute; top: 20px; right: 24px; z-index: 100;
  display: flex; align-items: center; gap: 6px;
}
.tool-btn {
  width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.8);
  border-radius: 12px; cursor: pointer; color: #555;
  backdrop-filter: blur(16px); transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
}
.dark .tool-btn { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.1); color: #aaa; }
.tool-btn:hover {
  background: rgba(255,255,255,0.95); transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}
.dark .tool-btn:hover { background: rgba(255,255,255,0.15); box-shadow: 0 6px 20px rgba(0,230,118,0.1); }

.lang-dropdown {
  position: absolute; top: 48px; right: 44px; z-index: 200; min-width: 165px;
  background: rgba(255,255,255,0.98); border: 1px solid rgba(0,0,0,0.05);
  border-radius: 16px; box-shadow: 0 16px 48px rgba(0,0,0,0.12);
  padding: 5px; backdrop-filter: blur(24px);
}
.dark .lang-dropdown { background: rgba(25,40,35,0.98); border-color: rgba(255,255,255,0.08); }
.lang-item {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 9px 12px; border: none; background: transparent;
  border-radius: 11px; font-size: 13px; color: #333;
  cursor: pointer; transition: all 0.15s;
}
.dark .lang-item { color: #ccc; }
.lang-item:hover { background: rgba(76,175,80,0.08); }
.lang-item.active { background: rgba(76,175,80,0.12); font-weight: 600; color: var(--primary-color, #4caf50); }
.lang-flag { font-size: 16px; }
.fade-pop-enter-active { transition: all 0.2s cubic-bezier(0.16,1,0.3,1); }
.fade-pop-leave-active { transition: all 0.12s ease-in; }
.fade-pop-enter-from, .fade-pop-leave-to { opacity: 0; transform: translateY(-8px) scale(0.95); }

/* ═══ 主卡片 ═══ */
.login-card {
  position: relative; z-index: 10; width: 100%; max-width: 420px; margin: 0 16px;
  background: rgba(255,255,255,0.78);
  border: 1px solid rgba(255,255,255,0.7);
  border-radius: 28px; padding: 40px 34px 26px;
  backdrop-filter: blur(30px) saturate(1.4);
  box-shadow: 0 24px 80px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.03),
              inset 0 1px 0 rgba(255,255,255,0.9);
  animation: cardIn 0.7s cubic-bezier(0.16,1,0.3,1);
}
.dark .login-card {
  background: rgba(15,30,22,0.78);
  border-color: rgba(105,240,174,0.08);
  box-shadow: 0 24px 80px rgba(0,0,0,0.4), 0 0 60px rgba(0,230,118,0.03),
              inset 0 1px 0 rgba(255,255,255,0.04);
}
.card-glow {
  position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px;
  border-radius: 30px; z-index: -1;
  background: conic-gradient(from 0deg, rgba(76,175,80,0.2), transparent 25%, transparent 50%, rgba(129,199,132,0.2) 75%, rgba(76,175,80,0.2));
  animation: glowSpin 6s linear infinite; opacity: 0;
  transition: opacity 0.5s;
}
.login-card:hover .card-glow, .login-card:focus-within .card-glow { opacity: 1; }
.dark .card-glow {
  background: conic-gradient(from 0deg, rgba(0,230,118,0.15), transparent 25%, transparent 50%, rgba(105,240,174,0.1) 75%, rgba(0,230,118,0.15));
}
@keyframes glowSpin { to { transform: rotate(360deg); } }

/* 卡片星光粒子 */
.card-sparkle {
  position: absolute; width: 3px; height: 3px; border-radius: 50%;
  background: rgba(76,175,80,0.6); z-index: -1;
  animation: sparkleFloat 4s ease-in-out infinite;
}
.s1 { top: 10%; left: -8px; animation-delay: 0s; }
.s2 { top: 50%; right: -6px; animation-delay: -1.5s; }
.s3 { bottom: 15%; left: -5px; animation-delay: -3s; }
.dark .card-sparkle { background: rgba(105,240,174,0.5); }
@keyframes sparkleFloat {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 1; }
  50% { transform: translateY(-20px) scale(1.5); opacity: 0.6; }
  80% { opacity: 0.3; }
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(30px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Logo ── */
.logo-area { text-align: center; margin-bottom: 28px; }
.logo-ring { position: relative; width: 82px; height: 82px; margin: 0 auto 14px; }
.ring-svg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  animation: ringRotate 12s linear infinite;
}
@keyframes ringRotate { to { transform: rotate(360deg); } }
.logo-circle {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 64px; height: 64px;
  background: linear-gradient(135deg, var(--primary-color, #4caf50), #66bb6a, #81c784);
  border-radius: 20px; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 28px rgba(76,175,80,0.3), 0 0 0 3px rgba(255,255,255,0.3);
  animation: logoFloat 3.5s ease-in-out infinite;
}
.dark .logo-circle { box-shadow: 0 8px 28px rgba(0,230,118,0.2), 0 0 0 3px rgba(0,230,118,0.1); }
.logo-emoji { font-size: 30px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.2)); }
@keyframes logoFloat {
  0%, 100% { transform: translate(-50%, -50%) translateY(0) rotate(0deg); }
  50% { transform: translate(-50%, -50%) translateY(-7px) rotate(3deg); }
}

.brand-title {
  font-size: 28px; font-weight: 800; margin: 0 0 5px;
  background: linear-gradient(135deg, #2e7d32, #4caf50, #66bb6a);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.dark .brand-title {
  background: linear-gradient(135deg, #69f0ae, #00e676, #a5d6a7);
  -webkit-background-clip: text; background-clip: text;
}
.brand-sub { font-size: 13px; color: #777; margin: 0; }
.dark .brand-sub { color: #6a8f75; }

/* ── 标签页 ── */
.tabs {
  position: relative; display: flex;
  background: rgba(0,0,0,0.04); border-radius: 14px; padding: 3.5px;
  margin-bottom: 24px;
}
.dark .tabs { background: rgba(255,255,255,0.06); }
.tab {
  flex: 1; display: flex; align-items: center; justify-content: center;
  gap: 6px; padding: 10px 0; border: none; background: transparent;
  border-radius: 11px; font-size: 13px; font-weight: 500; color: #888;
  cursor: pointer; transition: all 0.25s; position: relative; z-index: 1;
}
.tab.active { color: var(--primary-color, #4caf50); font-weight: 600; }
.tab:hover:not(.active) { color: #555; }
.dark .tab { color: #667; }
.dark .tab.active { color: #69f0ae; }
.dark .tab:hover:not(.active) { color: #8a9; }
.tab-indicator {
  position: absolute; bottom: 3.5px; left: 3.5px; height: calc(100% - 7px);
  background: rgba(255,255,255,0.92); border-radius: 11px;
  transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), width 0.35s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.dark .tab-indicator { background: rgba(255,255,255,0.08); }

/* ── 表单 ── */
.form-body { min-height: 200px; }
.form-slide-enter-active { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
.form-slide-leave-active { transition: all 0.15s ease-in; }
.form-slide-enter-from { opacity: 0; transform: translateX(24px); }
.form-slide-leave-to { opacity: 0; transform: translateX(-24px); }

.field { margin-bottom: 14px; }
.field-inner {
  display: flex; align-items: center; gap: 10px;
  background: rgba(0,0,0,0.03); border: 1.5px solid transparent;
  border-radius: 13px; padding: 0 14px; height: 48px;
  transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
}
.dark .field-inner { background: rgba(255,255,255,0.05); }
.field-inner.focused {
  border-color: var(--primary-color, #4caf50);
  background: rgba(76,175,80,0.04);
  box-shadow: 0 0 0 4px rgba(76,175,80,0.08);
  transform: scale(1.01);
}
.dark .field-inner.focused {
  background: rgba(0,230,118,0.06);
  box-shadow: 0 0 0 4px rgba(0,230,118,0.08);
}
.field-icon { color: #aaa; flex-shrink: 0; transition: color 0.3s; }
.field-inner.focused .field-icon { color: var(--primary-color, #4caf50); }
.field-inner input {
  flex: 1; border: none; background: transparent; outline: none;
  font-size: 14px; color: #333; height: 100%;
}
.dark .field-inner input { color: #cde; }
.field-inner input::placeholder { color: #bbb; }
.dark .field-inner input::placeholder { color: #556; }

.eye-btn {
  background: none; border: none; cursor: pointer; color: #aaa;
  padding: 4px; display: flex; align-items: center; transition: color 0.2s;
}
.eye-btn:hover { color: var(--primary-color, #4caf50); }
.code-row .send-code {
  padding: 5px 14px; border: 1.5px solid var(--primary-color, #4caf50);
  border-radius: 9px; background: transparent;
  color: var(--primary-color, #4caf50); font-size: 12px; font-weight: 600;
  white-space: nowrap; cursor: pointer; transition: all 0.2s; flex-shrink: 0;
}
.code-row .send-code:hover:not(:disabled) { background: rgba(76,175,80,0.08); }
.code-row .send-code:disabled { opacity: 0.5; cursor: not-allowed; }

.form-options {
  display: flex; justify-content: space-between; align-items: center;
  margin: 2px 0 20px; font-size: 13px;
}
.remember-me { display: flex; align-items: center; gap: 8px; cursor: pointer; color: #666; }
.dark .remember-me { color: #899; }
.remember-me input { display: none; }
.check-box {
  width: 17px; height: 17px; border: 1.5px solid #ccc; border-radius: 5px;
  display: flex; align-items: center; justify-content: center; transition: all 0.25s;
  flex-shrink: 0;
}
.remember-me input:checked + .check-box {
  background: var(--primary-color, #4caf50); border-color: var(--primary-color, #4caf50);
  box-shadow: 0 2px 8px rgba(76,175,80,0.3);
}
.remember-me input:checked + .check-box::after {
  content: ''; width: 8px; height: 5px;
  border-left: 2px solid #fff; border-bottom: 2px solid #fff;
  transform: rotate(-45deg); margin-top: -2px;
}
.forgot-link { color: var(--primary-color, #4caf50); text-decoration: none; font-weight: 500; }
.forgot-link:hover { text-decoration: underline; }

/* ── 提交按钮 ── */
.submit-btn {
  width: 100%; height: 48px; border: none; border-radius: 14px;
  font-size: 15px; font-weight: 700; color: #fff; cursor: pointer;
  background: linear-gradient(135deg, #43a047, var(--primary-color, #4caf50), #66bb6a);
  box-shadow: 0 6px 24px rgba(76,175,80,0.3);
  transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
  position: relative; overflow: hidden;
}
.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 10px 32px rgba(76,175,80,0.4);
}
.submit-btn:active:not(:disabled) { transform: translateY(0) scale(0.99); }
.submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }
.btn-text { position: relative; z-index: 1; letter-spacing: 4px; }
.btn-shine {
  position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
  transform: skewX(-20deg); animation: btnShine 3s ease-in-out infinite;
}
@keyframes btnShine { 0% { left: -100%; } 50%, 100% { left: 150%; } }
.btn-loading { display: flex; align-items: center; justify-content: center; }
.spinner {
  width: 22px; height: 22px;
  border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── 错误条 ── */
.error-bar {
  display: flex; align-items: center; gap: 8px; margin-top: 14px;
  padding: 10px 14px; background: rgba(232,67,62,0.06);
  border: 1px solid rgba(232,67,62,0.15); border-radius: 11px;
  color: #e8433e; font-size: 13px; animation: shakeX 0.4s;
}
@keyframes shakeX {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}

/* ── 微信 QR ── */
.wechat-panel { text-align: center; padding: 10px 0; }
.qr-wrap { display: flex; justify-content: center; margin: 16px 0; }
.qr-placeholder {
  width: 180px; height: 180px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px;
  background: rgba(0,0,0,0.02); border: 2px dashed rgba(0,0,0,0.1);
  border-radius: 18px; color: #aaa; font-size: 13px;
}
.dark .qr-placeholder { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.08); }
.wechat-hint { font-size: 12px; color: #999; margin: 0; }

/* ── 底部 ── */
.card-bottom {
  text-align: center; margin-top: 20px; padding-top: 16px;
  border-top: 1px solid rgba(0,0,0,0.05); font-size: 13px;
}
.dark .card-bottom { border-color: rgba(255,255,255,0.06); }
.bottom-text { color: #999; }
.register-link {
  color: var(--primary-color, #4caf50); text-decoration: none;
  font-weight: 600; margin-left: 6px;
}
.register-link:hover { text-decoration: underline; }
.skip-btn {
  display: block; width: 100%; margin-top: 10px; padding: 8px;
  border: none; background: transparent; color: #aaa;
  font-size: 12px; cursor: pointer; transition: color 0.2s;
}
.skip-btn:hover { color: var(--primary-color, #4caf50); }

.copyright {
  position: absolute; bottom: 14px; font-size: 11px;
  color: rgba(0,0,0,0.2); z-index: 3;
}
.dark .copyright { color: rgba(255,255,255,0.12); }

/* ── 响应式 ── */
@media (max-width: 768px) {
  .tree { transform: scale(0.7); transform-origin: bottom; }
  .tree-left { left: -1%; }
  .tree-right { right: -1%; }
  .tree-small, .mushroom { display: none; }
}
@media (max-width: 480px) {
  .login-card { padding: 28px 20px 20px; border-radius: 22px; margin: 0 12px; }
  .brand-title { font-size: 24px; }
  .logo-ring { width: 70px; height: 70px; }
  .logo-circle { width: 54px; height: 54px; border-radius: 16px; }
  .logo-emoji { font-size: 26px; }
  .tab { font-size: 12px; padding: 8px 0; }
  .top-toolbar { top: 12px; right: 12px; }
  .tree { transform: scale(0.55); }
}
</style>
