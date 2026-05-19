<template>
  <header class="header">
    <!-- 左侧：移动端汉堡菜单 -->
    <div class="header-left">
      <button class="mobile-menu-btn" @click="$emit('toggle-sidebar')" :title="t('menu')">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>

    <!-- 中间：居中标题 -->
    <div class="header-center">
      <h2 v-if="currentChat" class="header-title">{{ currentChat.title || t('newChat') }}</h2>
    </div>

    <!-- 右侧：操作按钮 + 头像 -->
    <div class="header-right">
      <!-- 分享 -->
      <button v-if="currentChat" @click="shareVisible = true" class="action-btn" :title="t('share')">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
        </svg>
      </button>

      <!-- 导出 -->
      <button v-if="currentChat" @click="exportChat" class="action-btn export-btn" :title="t('exportChat')">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>

      <!-- 三点菜单 -->
      <div v-if="currentChat" class="menu-anchor" ref="menuAnchorRef">
        <button @click.stop="toggleMenu" class="action-btn" :title="t('menu')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>
        <Transition name="menu-pop">
          <div v-if="showMenu" class="dropdown-panel" @click.stop>
            <button class="dropdown-item" @click="handleAction('clear')">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 4l16 16M9 9v10a1 1 0 001 1h4a1 1 0 001-1V9"/></svg>
              <span>{{ t('clearChat') }}</span>
            </button>
            <button class="dropdown-item" @click="handleAction('rename')">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              <span>{{ t('renameChat') }}</span>
            </button>
            <div class="dropdown-sep"></div>
            <button class="dropdown-item danger" @click="handleAction('delete')">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              <span>{{ t('deleteChat') }}</span>
            </button>
          </div>
        </Transition>
      </div>

      <!-- 分隔线 -->
      <div class="header-sep"></div>

      <!-- 用户头像 -->
      <div class="avatar-anchor" ref="avatarAnchorRef">
        <button class="avatar-trigger" @click.stop="toggleUserPanel" :title="chatStore.isLoggedIn ? chatStore.username : t('notLoggedInClick')">
          <div class="avatar-ring" :class="{ 'logged-in': chatStore.isLoggedIn }">
            <img v-if="chatStore.userAvatar" :src="chatStore.userAvatar" alt="avatar" class="avatar-img" />
            <span v-else-if="chatStore.isLoggedIn" class="avatar-letter">{{ (chatStore.username || '?').charAt(0).toUpperCase() }}</span>
            <svg v-else class="avatar-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
        </button>

        <!-- LobeHub 风格用户下拉面板 -->
        <Transition name="panel-pop">
          <div v-if="showUserPanel" class="user-panel" @click.stop>
            <!-- 用户信息头部 -->
            <div class="up-header">
              <div class="up-avatar-wrap">
                <div class="up-avatar" :class="{ 'logged-in': chatStore.isLoggedIn }">
                  <img v-if="chatStore.userAvatar" :src="chatStore.userAvatar" alt="" class="up-avatar-img" />
                  <span v-else-if="chatStore.isLoggedIn" class="up-avatar-letter">{{ (chatStore.username || '?').charAt(0).toUpperCase() }}</span>
                  <svg v-else width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </div>
              </div>
              <div class="up-user-info">
                <span class="up-username">{{ chatStore.isLoggedIn ? chatStore.username : t('notLoggedInMsg') }}</span>
                <span v-if="chatStore.isLoggedIn" class="up-badge">{{ identityDisplay }}</span>
              </div>
              <button v-if="chatStore.isLoggedIn" class="up-settings-icon" @click="openSettings" :title="t('settings')">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>

            <!-- 未登录提示 -->
            <template v-if="!chatStore.isLoggedIn">
              <div class="up-login-prompt">
                <p class="up-login-hint">{{ t('loginForMore') }}</p>
                <div class="up-login-actions">
                  <button class="up-login-btn" @click="goLogin">{{ t('loginAccount') }}</button>
                  <button class="up-register-btn" @click="goRegister">{{ t('registerAccount') }}</button>
                </div>
              </div>
            </template>

            <!-- 已登录内容 -->
            <template v-else>

            <!-- 统计卡片 -->
            <div class="up-stats">
              <div class="up-stat-item">
                <span class="up-stat-num">{{ assistantCount }}</span>
                <span class="up-stat-label">{{ t('assistantLabel') }}</span>
              </div>
              <div class="up-stat-item">
                <span class="up-stat-num">{{ topicCount }}</span>
                <span class="up-stat-label">{{ t('topicLabel') }}</span>
              </div>
              <div class="up-stat-item">
                <span class="up-stat-num">{{ totalMessages }}</span>
                <span class="up-stat-label">{{ t('messageLabel') }}</span>
              </div>
            </div>

            <!-- Token 使用量 -->
            <div class="up-quota">
              <div class="up-quota-header">
                <span class="up-quota-label">月度标准 Token</span>
                <span class="up-quota-value">{{ tokenUsedDisplay }} / {{ tokenTotalDisplay }}</span>
              </div>
              <div class="up-progress-track">
                <div class="up-progress-fill" :style="{ width: tokenPercent + '%' }"></div>
              </div>
              <div class="up-quota-meta">
                <span>已用 {{ tokenUsedDisplay }}</span>
                <span>剩余 {{ tokenRemainingDisplay }}</span>
              </div>
            </div>

            <div class="up-divider"></div>

            <!-- 菜单列表 -->
            <div class="up-menu">
              <button class="up-menu-item" @click="openSettings">
                <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z"/><circle cx="12" cy="12" r="3"/></svg>
                <span>{{ t('appSettings') }}</span>
              </button>
              <button class="up-menu-item" @click="handlePanelAction('memory')">
                <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                <span>{{ t('memoryLabel') }}</span>
              </button>
              <button class="up-menu-item" @click="handlePanelAction('upgrade')">
                <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                <span>{{ t('upgradePlan') }}</span>
              </button>

              <div class="up-divider"></div>

              <button class="up-menu-item" @click="openUserProfile">
                <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                <span>{{ t('userSettings') }}</span>
              </button>

              <div class="up-divider"></div>

              <button class="up-menu-item danger" @click="handleLogout">
                <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                <span>{{ t('logout') }}</span>
              </button>
            </div>
            </template>
          </div>
        </Transition>
      </div>
    </div>

    <!-- 分享弹窗 -->
    <ShareDialog :visible="shareVisible" :chat="currentChat" @close="shareVisible = false" />
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useChat } from '@/stores/chatStore'
import { t } from '@/utils/i18n'
import ShareDialog from '@/components/ShareDialog.vue'

const chatStore = useChat()

const props = defineProps({
  currentChat: { type: Object, default: null }
})

const emit = defineEmits(['toggle-sidebar', 'open-profile', 'open-settings', 'logout', 'show-login', 'show-register'])

const showMenu = ref(false)
const showUserPanel = ref(false)
const shareVisible = ref(false)
const menuAnchorRef = ref(null)
const avatarAnchorRef = ref(null)

// 统计数据
const assistantCount = computed(() => 1)
const topicCount = computed(() => chatStore.chats.length)
const totalMessages = computed(() => {
  return chatStore.chats.reduce((sum, c) => sum + (c.messages?.length || 0), 0)
})
const identityDisplay = computed(() => chatStore.identityLabel || chatStore.userRole || '用户')

// Token 使用量（模拟数据，后期可对接 API）
// Token 额度来自后端 QuotaSnapshot，主界面展示月度标准 token。
const activeQuota = computed(() => chatStore.quotaSnapshot?.monthly || null)
const fallbackTokenLimit = 500000

const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const formatToken = (value) => {
  const n = toNumber(value)
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(2)}B`
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return `${Math.round(n)}`
}

const tokenUsed = computed(() => toNumber(activeQuota.value?.tokenUsed, 0))
const tokenTotal = computed(() => {
  if (activeQuota.value?.unlimited) return null
  return toNumber(activeQuota.value?.tokenLimit, fallbackTokenLimit)
})
const tokenRemaining = computed(() => {
  if (activeQuota.value?.unlimited || tokenTotal.value == null) return null
  return Math.max(0, tokenTotal.value - tokenUsed.value)
})
const tokenPercent = computed(() => {
  if (!tokenTotal.value) return 0
  return Math.min(100, Math.max(0, (tokenUsed.value / tokenTotal.value) * 100))
})
const tokenUsedDisplay = computed(() => formatToken(tokenUsed.value))
const tokenTotalDisplay = computed(() => activeQuota.value?.unlimited ? '不限' : formatToken(tokenTotal.value))
const tokenRemainingDisplay = computed(() => activeQuota.value?.unlimited ? '不限' : formatToken(tokenRemaining.value))

const exportChat = () => {
  alert(t('exportDeveloping'))
}

const goLogin = () => {
  showUserPanel.value = false
  emit('show-login')
}

const goRegister = () => {
  showUserPanel.value = false
  emit('show-register')
}

const toggleMenu = () => {
  showMenu.value = !showMenu.value
  showUserPanel.value = false
}

const toggleUserPanel = () => {
  showUserPanel.value = !showUserPanel.value
  showMenu.value = false
}

const handleAction = (action) => {
  showMenu.value = false
}

const openSettings = () => {
  showUserPanel.value = false
  emit('open-settings')
}

const openUserProfile = () => {
  showUserPanel.value = false
  emit('open-profile')
}

const handlePanelAction = (action) => {
  showUserPanel.value = false
}

const handleLogout = () => {
  showUserPanel.value = false
  emit('logout')
}

const onClickOutside = (e) => {
  if (menuAnchorRef.value && !menuAnchorRef.value.contains(e.target)) {
    showMenu.value = false
  }
  if (avatarAnchorRef.value && !avatarAnchorRef.value.contains(e.target)) {
    showUserPanel.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
/* ── Header 整体 ─────────────────────────────── */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 54px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.header-left { display: flex; align-items: center; min-width: 40px; }

.mobile-menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px; height: 36px;
  background: transparent; border: none; cursor: pointer;
  color: var(--text-sub); border-radius: 10px; transition: all 0.2s;
}
.mobile-menu-btn:hover { background: var(--hover-bg); color: var(--text-primary); }

/* ── 居中标题 ─────────────────────────────────── */
.header-center {
  position: absolute; left: 50%; transform: translateX(-50%);
  max-width: 42%; display: flex; align-items: center; justify-content: center;
  pointer-events: none;
}
.header-title {
  font-size: 15px; font-weight: 600; color: var(--text-primary);
  margin: 0; overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; letter-spacing: -0.01em; pointer-events: auto;
}

/* ── 右侧 ────────────────────────────────────── */
.header-right { display: flex; align-items: center; gap: 2px; margin-left: auto; }

.action-btn {
  width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; cursor: pointer;
  color: var(--text-sub); border-radius: 10px; transition: all 0.2s ease; flex-shrink: 0;
}
.action-btn:hover { background: var(--hover-bg); color: var(--text-primary); }
.action-btn:active { transform: scale(0.92); }

.menu-anchor, .avatar-anchor { position: relative; }

/* ── 三点下拉 ─────────────────────────────────── */
.dropdown-panel {
  position: absolute; top: calc(100% + 8px); right: -4px;
  min-width: 184px; background: var(--bg-primary);
  border: 1px solid var(--border-color); border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04);
  padding: 4px; z-index: 200;
}
.dropdown-item {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 9px 12px; border: none; background: transparent; border-radius: 8px;
  font-size: 13px; color: var(--text-primary); cursor: pointer;
  transition: background 0.15s; white-space: nowrap;
}
.dropdown-item svg { color: var(--text-sub); flex-shrink: 0; }
.dropdown-item:hover { background: var(--hover-bg); }
.dropdown-item:hover svg { color: var(--text-primary); }
.dropdown-item.danger { color: #e8433e; }
.dropdown-item.danger svg { color: #e8433e; }
.dropdown-item.danger:hover { background: rgba(232,67,62,0.06); }
.dropdown-sep { height: 1px; background: var(--border-color); margin: 4px 8px; }

/* ── 弹出动画 ─────────────────────────────────── */
.menu-pop-enter-active, .panel-pop-enter-active { transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
.menu-pop-leave-active, .panel-pop-leave-active { transition: all 0.12s ease-in; }
.menu-pop-enter-from, .menu-pop-leave-to,
.panel-pop-enter-from, .panel-pop-leave-to {
  opacity: 0; transform: translateY(-6px) scale(0.96);
}

/* ── 分隔线 ───────────────────────────────────── */
.header-sep {
  width: 1px; height: 22px; background: var(--border-color);
  margin: 0 6px 0 4px; flex-shrink: 0;
}

/* ── 头像触发器 ───────────────────────────────── */
.avatar-trigger {
  display: flex; align-items: center; gap: 8px;
  background: transparent; border: none; cursor: pointer;
  padding: 3px; border-radius: 50%; transition: all 0.2s;
}
.avatar-trigger:hover { background: var(--hover-bg); }

.avatar-ring {
  width: 32px; height: 32px; border-radius: 50%; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: var(--hover-bg-medium, var(--hover-bg));
  flex-shrink: 0; transition: all 0.25s; border: 2px solid transparent;
}
.avatar-ring.logged-in {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light, var(--primary-color)));
}
.avatar-trigger:hover .avatar-ring {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-bg, rgba(76,175,80,0.15));
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-letter { font-size: 14px; font-weight: 700; color: #fff; text-transform: uppercase; }
.avatar-icon { color: var(--text-sub); }

/* ══════════════════════════════════════════════════
   LobeHub 风格用户下拉面板
   ══════════════════════════════════════════════════ */
.user-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 300px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  box-shadow:
    0 12px 40px rgba(0,0,0,0.12),
    0 4px 12px rgba(0,0,0,0.06);
  z-index: 300;
  overflow: hidden;
}

/* ── 用户头部 ─────────────────────────────────── */
.up-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 12px;
}

.up-avatar-wrap { flex-shrink: 0; }

.up-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--hover-bg-medium, var(--hover-bg));
  overflow: hidden; flex-shrink: 0;
}
.up-avatar.logged-in {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light, var(--primary-color)));
}
.up-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.up-avatar-letter { font-size: 17px; font-weight: 700; color: #fff; text-transform: uppercase; }
.up-avatar svg { color: var(--text-sub); }

.up-user-info {
  flex: 1; min-width: 0;
  display: flex; align-items: center; gap: 8px;
}
.up-username {
  font-size: 14px; font-weight: 600; color: var(--text-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.up-badge {
  font-size: 11px; padding: 1px 8px; border-radius: 10px;
  background: var(--hover-bg); color: var(--text-sub);
  flex-shrink: 0; white-space: nowrap;
}
.up-settings-icon {
  width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; cursor: pointer;
  color: var(--text-sub); border-radius: 8px; transition: all 0.15s; flex-shrink: 0;
}
.up-settings-icon:hover { background: var(--hover-bg); color: var(--text-primary); }

/* ── 统计卡片 ─────────────────────────────────── */
.up-stats {
  display: flex; gap: 0; padding: 0 16px 14px;
}
.up-stat-item {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; padding: 10px 4px;
  background: var(--hover-bg); border-radius: 10px;
  margin: 0 3px;
}
.up-stat-item:first-child { margin-left: 0; }
.up-stat-item:last-child { margin-right: 0; }
.up-stat-num { font-size: 18px; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
.up-stat-label { font-size: 11px; color: var(--text-sub); margin-top: 2px; }

/* ── Token 用量 ───────────────────────────────── */
.up-quota {
  padding: 0 16px 14px;
}
.up-quota-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
}
.up-quota-label { font-size: 12px; color: var(--text-sub); }
.up-quota-value { font-size: 12px; font-weight: 600; color: var(--text-primary); }

.up-progress-track {
  height: 6px; background: var(--hover-bg); border-radius: 3px; overflow: hidden;
}
.up-progress-fill {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-light, var(--primary-color)));
  transition: width 0.4s ease;
}
.up-quota-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 7px;
  font-size: 11px;
  color: var(--text-sub);
}

/* ── 分隔线 ───────────────────────────────────── */
.up-divider {
  height: 1px; background: var(--border-color); margin: 2px 12px;
}

/* ── 菜单项 (LobeHub 风格) ────────────────────── */
.up-menu {
  padding: 4px 6px;
}
.up-menu-item {
  display: flex; align-items: center; gap: 12px;
  width: 100%; padding: 10px 12px;
  border: none; background: transparent; border-radius: 8px;
  font-size: 13px; color: var(--text-primary);
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.up-menu-item svg { color: var(--text-sub); flex-shrink: 0; transition: color 0.15s; }
.up-menu-item:hover { background: var(--hover-bg); }
.up-menu-item:hover svg { color: var(--text-primary); }
.up-menu-item:active { transform: scale(0.98); }
.up-menu-item.danger { color: #e8433e; }
.up-menu-item.danger svg { color: #e8433e; }
.up-menu-item.danger:hover { background: rgba(232,67,62,0.06); }

/* ── 未登录提示 ───────────────────────────────── */
.up-login-prompt {
  padding: 8px 16px 16px;
}
.up-login-hint {
  font-size: 13px; color: var(--text-sub); margin: 0 0 14px;
}
.up-login-actions {
  display: flex; gap: 10px;
}
.up-login-btn {
  flex: 1; padding: 9px 0; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  background: var(--primary-color); color: #fff;
  transition: all 0.2s;
}
.up-login-btn:hover { opacity: 0.9; transform: translateY(-1px); }
.up-register-btn {
  flex: 1; padding: 9px 0; border: 1px solid var(--border-color); border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  background: transparent; color: var(--text-primary);
  transition: all 0.2s;
}
.up-register-btn:hover { background: var(--hover-bg); }

/* ── 响应式 ───────────────────────────────────── */
@media (max-width: 768px) {
  .header { padding: 0 10px; height: 50px; }
  .mobile-menu-btn { display: flex; }
  .header-center { max-width: 32%; }
  .header-title { font-size: 13px; }
  .export-btn { display: none; }
  .header-sep { margin: 0 2px; }
  .action-btn { width: 32px; height: 32px; }
  .user-panel { width: 280px; right: -8px; }
}
</style>
