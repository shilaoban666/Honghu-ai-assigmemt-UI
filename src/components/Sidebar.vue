<template>
  <aside :class="['sidebar', { collapsed, 'mobile-open': mobileOpen }]" :style="!collapsed && !mobileOpen ? { width: sidebarWidth + 'px' } : {}">
    <!-- Logo 区域 / 收缩态 -->
    <div class="sidebar-top" :class="{ collapsed }">
      <template v-if="!collapsed">
        <div class="logo-icon">🦅</div>
        <div class="logo-text">
          <h1 class="logo-title">Honghu</h1>
          <p class="logo-subtitle">AI Chat</p>
        </div>
      </template>
      <button @click="$emit('toggle-sidebar')" class="toggle-btn" :title="collapsed ? t('expandSidebar') : t('collapseSidebar')">
        <svg v-if="collapsed" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <svg v-else class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>

    <!-- 对话列表 -->
    <div class="chats-container" @click="closeMenu">
      <!-- Gemini 风格：发起新对话按钮 -->
      <button v-if="!collapsed" class="new-chat-btn" @click.stop="$emit('new-chat')">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        {{ t('newChat') }}
      </button>
      <button v-else class="new-chat-btn collapsed-new" @click.stop="$emit('new-chat')" :title="t('newChat')">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
      </button>
      <!-- 分节标题：历史对话 -->
      <div v-if="!collapsed && sortedChats.length > 0" class="section-label">{{ t('conversations') }}</div>

      <div v-if="(!chats || chats.length === 0) && !collapsed" class="empty-state">
        <p class="empty-text">{{ t('noConversations') }}</p>
      </div>
      <div
        v-for="chat in sortedChats"
        :key="chat.id"
        @click="selectChat(chat.id)"
        :class="['chat-item', { active: currentChatId === chat.id, 'chat-item-collapsed': collapsed }]"
        :title="chat.title || t('untitledChat')"
        v-show="!collapsed"
      >
        <!-- 内联重命名输入 -->
        <input
          v-if="renamingId === chat.id"
          ref="renameInputRef"
          v-model="renameValue"
          class="rename-input"
          @click.stop
          @keyup.enter="confirmRename"
          @keyup.escape="cancelRename"
          @blur="confirmRename"
        />
        <div v-else-if="!collapsed" class="chat-content">
          <p class="chat-title">
            <svg v-if="chat.pinned" class="pin-icon" width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="12" y1="17" x2="12" y2="22" stroke-width="2" stroke-linecap="round"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 17h14l-2-7V5H7v5L5 17z"/>
            </svg>
            {{ chat.title || t('untitledChat') }}
          </p>
          <p class="chat-time">{{ formatDate(chat.createdAt) }}</p>
        </div>

        <!-- 三点按钒 -->
        <button
          v-if="!collapsed && renamingId !== chat.id"
          class="more-btn"
          @click.stop="toggleMenu(chat.id, $event)"
          title="更多操作"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2"/>
            <circle cx="12" cy="12" r="2"/>
            <circle cx="12" cy="19" r="2"/>
          </svg>
        </button>

        <!-- 下拉菜单 -->
        <Teleport to="body">
          <div
            v-if="openMenuId === chat.id"
            class="chat-dropdown"
            :style="menuStyle"
            @click.stop
          >
            <button class="dropdown-item" @click="openShare(chat)">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
              {{ t('share') }}
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click="startRename(chat)">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              {{ t('rename') }}
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" :class="{ 'item-pinned': chat.pinned }" @click="togglePin(chat)">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <line x1="12" y1="17" x2="12" y2="22" stroke-width="2" stroke-linecap="round"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 17h14l-2-7V5H7v5L5 17z"/>
              </svg>
              {{ chat.pinned ? t('unpin') : t('pin') }}
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item danger" @click="askDelete(chat)">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              {{ t('delete') }}
            </button>
          </div>
        </Teleport>
      </div>
    </div>

    <!-- 底部菜单 -->
    <div class="bottom-menu" :class="{ collapsed }">
      <button class="menu-btn" @click="$emit('open-settings')" :title="t('settings')">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
      <button class="menu-btn" :title="t('help')">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </button>
    </div>
  </aside>

  <!-- 拖拽调整宽度手柄 -->
  <div
    v-if="!collapsed && !mobileOpen"
    class="resize-handle"
    :style="{ left: (sidebarWidth || 260) + 'px' }"
    @mousedown.prevent="startResize"
  />

  <!-- 删除确认弹窗 -->
  <ConfirmDialog
    :visible="showDeleteConfirm"
    icon="🗑️"
    :title="t('deleteChat')"
    :message="t('confirmDeleteMsg')"
    :confirm-text="t('delete')"
    :danger="true"
    @confirm="confirmDelete"
    @cancel="showDeleteConfirm = false"
  />

  <!-- 分享弹窗 -->
  <ShareDialog
    :visible="shareVisible"
    :chat="shareTargetChat"
    @close="shareVisible = false"
  />
</template>

<script setup>
import { useChat } from '@/stores/chatStore'
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ShareDialog from '@/components/ShareDialog.vue'
import { renameSession, deleteSession } from '@/api/chat'
import { t } from '@/utils/i18n'

const props = defineProps({
  chats: {
    type: Array,
    required: true
  },
  currentChatId: {
    type: [String, Number],
    default: null
  },
  collapsed: {
    type: Boolean,
    default: false
  },
  mobileOpen: {
    type: Boolean,
    default: false
  },
  sidebarWidth: {
    type: Number,
    default: 260
  }
})

const emit = defineEmits(['new-chat', 'select-chat', 'toggle-sidebar', 'open-settings', 'mobile-close', 'update:sidebarWidth'])
const chatStore = useChat()
const userAvatar = ref('')

// 三点菜单状态
const openMenuId = ref(null)
const menuStyle = ref({})

// 重命名状态
const renamingId = ref(null)
const renameValue = ref('')
const renameInputRef = ref(null)

// 删除确认状态
const showDeleteConfirm = ref(false)
const pendingDelete = ref(null)

// 分享弹窗状态
const shareVisible = ref(false)
const shareTargetChat = ref(null)

// 排序：置顶的排在前面
const sortedChats = computed(() => {
  if (!props.chats) return []
  return [...props.chats].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return 0
  })
})

const toggleMenu = (chatId, event) => {
  if (openMenuId.value === chatId) {
    openMenuId.value = null
    return
  }
  const btn = event.currentTarget
  const rect = btn.getBoundingClientRect()
  menuStyle.value = {
    top: rect.bottom + 4 + 'px',
    left: rect.left + 'px'
  }
  openMenuId.value = chatId
}

const closeMenu = () => {
  openMenuId.value = null
}

const startRename = (chat) => {
  closeMenu()
  renamingId.value = chat.id
  renameValue.value = chat.title || ''
  nextTick(() => {
    if (renameInputRef.value) {
      const el = Array.isArray(renameInputRef.value) ? renameInputRef.value[0] : renameInputRef.value
      el?.focus()
      el?.select()
    }
  })
}

const confirmRename = async () => {
  const id = renamingId.value
  const name = renameValue.value.trim()
  renamingId.value = null
  if (!name || !id) return
  const chat = chatStore.chats.find(c => c.id === id)
  if (chat) chat.title = name
  try {
    await renameSession(id, name)
  } catch (e) {
    console.error('重命名失败:', e)
  }
}

const cancelRename = () => {
  renamingId.value = null
}

const openShare = (chat) => {
  closeMenu()
  shareTargetChat.value = chat
  shareVisible.value = true
}

const togglePin = (chat) => {
  closeMenu()
  chatStore.togglePin(chat.id)
}

const askDelete = (chat) => {
  closeMenu()
  pendingDelete.value = chat
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  showDeleteConfirm.value = false
  const chat = pendingDelete.value
  if (!chat) return
  chatStore.deleteChat(chat.id)
  try {
    await deleteSession(chat.id)
  } catch (e) {
    console.error('删除失败:', e)
  }
  pendingDelete.value = null
}

const selectChat = (chatId) => {
  emit('select-chat', chatId)
  if (window.innerWidth <= 768) {
    emit('mobile-close')
  }
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (d.toDateString() === yesterday.toDateString()) {
    return '昨天'
  } else if (d.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
    return d.toLocaleDateString('zh-CN', { weekday: 'short' })
  }
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

onMounted(() => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (userInfo.avatar) userAvatar.value = userInfo.avatar
  document.addEventListener('click', closeMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenu)
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
})

// --- 拖拽调整宽度 ---
const startResize = () => {
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}
const onResize = (e) => {
  const maxW = window.innerWidth * 0.25
  const newW = Math.max(200, Math.min(e.clientX, maxW))
  emit('update:sidebarWidth', newW)
}
const stopResize = () => {
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
  overflow: hidden;
  transition: width 0.25s cubic-bezier(0.4,0,0.2,1);
  position: relative;
}

.sidebar.collapsed {
  width: 60px;
}

/* 拖拽手柄 */
.resize-handle {
  position: fixed;
  top: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 20;
  background: transparent;
  transition: background 0.15s;
  transform: translateX(-3px);
}
.resize-handle:hover,
.resize-handle:active {
  background: var(--primary-color);
  opacity: 0.4;
  border-radius: 3px;
}

.toggle-btn {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-sub);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-left: auto;
}

.toggle-btn:hover {
  background: var(--hover-bg-medium);
  color: var(--primary-color);
}

.toggle-btn .icon {
  width: 16px;
  height: 16px;
}

/* ── 侧边栏顶部区域 ── */
.sidebar-top {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 12px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}
.sidebar-top.collapsed {
  justify-content: center;
  padding: 14px 12px;
}

.logo-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.logo-text {
  min-width: 0;
}

.logo-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0;
  line-height: 1.2;
}

.logo-subtitle {
  font-size: 11px;
  color: var(--text-sub);
  margin: 1px 0 0 0;
}

.chats-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  text-align: center;
  color: var(--subtitle-color);
  padding: 20px;
  font-size: 12px;
}

.empty-text {
  margin: 0;
}

.chat-item {
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
  border: 1px solid transparent;
  position: relative;
  min-height: 38px;
}

.chat-item:hover {
  background: var(--hover-bg);
}

.chat-item.active {
  background: var(--hover-bg-medium);
  border-color: var(--border-color);
}

.chat-content {
  flex: 1;
  min-width: 0;
}

.chat-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--primary-color);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.chat-time {
  font-size: 10px;
  color: var(--text-sub);
  margin: 2px 0 0 0;
  line-height: 1;
}

.chat-icon {
  font-size: 18px;
}

/* 新对话按钮 - Gemini 风格 */
.new-chat-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 14px;
  margin-bottom: 8px;
  background: none;
  border: 1.5px dashed var(--border-color);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-sub);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.new-chat-btn:hover {
  border-color: var(--primary-color);
  border-style: solid;
  color: var(--primary-color);
  background: var(--hover-bg);
}

.new-chat-btn.collapsed-new {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 10px;
  justify-content: center;
  margin: 0 auto 8px;
  border-style: solid;
}

/* 分节标题 */
.section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-sub);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 10px 4px 4px;
  margin-top: 4px;
}

.pin-icon {
  display: inline;
  vertical-align: middle;
  margin-right: 3px;
  color: var(--primary-color);
  opacity: 0.7;
  flex-shrink: 0;
}

.rename-input {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--primary-color);
  background: var(--bg-primary);
  border: 1px solid var(--primary-color);
  border-radius: 5px;
  padding: 3px 7px;
  outline: none;
}

.more-btn {
  opacity: 0;
  background: none;
  border: none;
  color: var(--text-sub);
  cursor: pointer;
  padding: 4px 5px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}

.chat-item:hover .more-btn,
.chat-item.active .more-btn {
  opacity: 1;
}

.more-btn:hover {
  background: var(--hover-bg-medium);
  color: var(--primary-color);
}

/* 下拉菜单 */
.chat-dropdown {
  position: fixed;
  z-index: 1000;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 4px;
  min-width: 140px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  animation: dropIn 0.15s ease;
}

@keyframes dropIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.dropdown-item:hover {
  background: var(--hover-bg);
}

.dropdown-item.danger {
  color: #e05c4b;
}

.dropdown-item.danger:hover {
  background: rgba(224, 92, 75, 0.08);
}

.dropdown-item.item-pinned {
  color: var(--primary-color);
}

.dropdown-item.item-pinned svg {
  stroke: var(--primary-color);
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color);
  margin: 3px 0;
}

.bottom-menu {
  display: flex;
  flex-direction: row;
  gap: 6px;
  padding: 10px 12px;
  border-top: 1px solid var(--border-color);
  justify-content: flex-start;
  transition: all 0.25s ease;
}

.bottom-menu.collapsed {
  flex-direction: column;
  gap: 6px;
  justify-content: flex-end;
}

.menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  color: var(--text-sub);
  transition: all 0.2s;
  padding: 0;
  flex-shrink: 0;
}

.menu-btn:hover {
  background: var(--hover-bg-medium);
  color: var(--primary-color);
}

/* 滚动条样式 */
.chats-container::-webkit-scrollbar {
  width: 6px;
}

.chats-container::-webkit-scrollbar-track {
  background: transparent;
}

.chats-container::-webkit-scrollbar-thumb {
  background: rgba(74, 157, 111, 0.3);
  border-radius: 3px;
}

.chats-container::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 157, 111, 0.5);
}

/* ── 手机端适配 ───────────────────────────── */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -280px;
    top: 0;
    height: 100dvh;
    z-index: 50;
    width: 260px !important;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.18);
    transition: left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar.mobile-open {
    left: 0;
  }

  .sidebar:not(.mobile-open) {
    display: none;
  }

  .resize-handle {
    display: none;
  }
}
</style>
