<template>
  <aside :class="['sidebar', { collapsed, 'mobile-open': mobileOpen }]" :style="!collapsed && !mobileOpen ? { width: sidebarWidth + 'px' } : {}">

    <!-- ── 顶部：侧边栏收起/展开 + 新对话 ── -->
    <div class="sidebar-header">
      <button class="icon-btn" @click="$emit('toggle-sidebar')" :title="collapsed ? t('expandSidebar') : t('collapseSidebar')">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <button v-if="!collapsed" class="icon-btn new-chat-header-btn" @click="$emit('new-chat')" :title="t('newChat')">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
      </button>
    </div>

    <!-- ── 收缩态下只显示图标列 ── -->
    <template v-if="collapsed">
      <div class="collapsed-icons">
        <button class="icon-btn" @click="$emit('new-chat')" :title="t('newChat')">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        </button>
        <button class="icon-btn" @click="searchOpen = true" :title="t('searchChat')">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke-width="2"/></svg>
        </button>
        <button class="icon-btn" @click="$emit('open-settings')" :title="t('settings')">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
    </template>

    <!-- ── 展开态 ── -->
    <template v-else>
      <div class="sidebar-scroll" @click="closeMenu">

        <!-- Section 1: 主功能 -->
        <div class="nav-section">
          <button class="nav-row" @click="$emit('new-chat')">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>{{ t('newChat') }}</span>
          </button>
          <button class="nav-row" @click="searchOpen = !searchOpen">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke-width="2"/></svg>
            <span>{{ t('searchChat') }}</span>
          </button>
          <!-- 搜索展开 -->
          <div v-if="searchOpen" class="search-box">
            <input v-model="searchQuery" class="search-input" :placeholder="t('searchChat') + '...'" @input="onSearch" />
          </div>
          <button class="nav-row" @click="$emit('open-skill-plaza')">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke-width="2"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke-width="2"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke-width="2"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke-width="2"/></svg>
            <span>{{ t('skillPlaza') }}</span>
          </button>
          <button class="nav-row" @click="$emit('open-deep-research')">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            <span>{{ t('deepResearch') }}</span>
          </button>
        </div>

        <div class="nav-divider"></div>

        <!-- Section 2: Agent -->
        <div class="nav-section">
          <div class="section-header" @click="agentsOpen = !agentsOpen">
            <span class="section-title">{{ t('agents') }}</span>
            <svg :class="['chevron', { open: agentsOpen }]" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
          <div v-if="agentsOpen" class="section-body">
            <div v-if="agents.length === 0" class="empty-hint">{{ t('noAgents') }}</div>
            <button v-for="ag in agents" :key="ag.id" class="nav-row agent-row">
              <span class="agent-avatar" :style="{ background: ag.color || 'var(--primary-color)' }">{{ ag.name?.charAt(0) || 'A' }}</span>
              <span>{{ ag.name }}</span>
            </button>
            <button class="nav-row explore-row" @click="$emit('open-agent-plaza')">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <span>{{ t('exploreAgents') }}</span>
            </button>
          </div>
        </div>

        <div class="nav-divider"></div>

        <!-- Section 3: 项目 -->
        <div class="nav-section">
          <div class="section-header" @click="projectsOpen = !projectsOpen">
            <span class="section-title">{{ t('projects') }}</span>
            <svg :class="['chevron', { open: projectsOpen }]" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
          <div v-if="projectsOpen" class="section-body">
            <button class="nav-row">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span>{{ t('newProject') }}</span>
            </button>
            <div v-if="projects.length === 0" class="empty-hint">{{ t('noProjects') }}</div>
            <button v-for="proj in projects" :key="proj.id" class="nav-row project-row">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
              <span>{{ proj.name }}</span>
            </button>
          </div>
        </div>

        <div class="nav-divider"></div>

        <!-- Section 4: 最近 (会话列表) -->
        <div class="nav-section nav-section-grow">
          <div class="section-header">
            <span class="section-title">{{ t('recent') }}</span>
          </div>
          <div class="section-body session-list">
            <div v-if="filteredChats.length === 0" class="empty-hint">{{ t('noConversations') }}</div>
            <div
              v-for="chat in filteredChats"
              :key="chat.id"
              @click="selectChat(chat.id)"
              :class="['session-item', { active: currentChatId === chat.id }]"
              :title="chat.title || t('untitledChat')"
            >
              <!-- 内联重命名 -->
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
              <template v-else>
                <svg v-if="chat.pinned" class="pin-icon" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <line x1="12" y1="17" x2="12" y2="22" stroke-width="2" stroke-linecap="round"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 17h14l-2-7V5H7v5L5 17z"/>
                </svg>
                <span class="session-title">{{ chat.title || t('untitledChat') }}</span>
              </template>
              <button
                v-if="renamingId !== chat.id"
                class="more-btn"
                @click.stop="toggleMenu(chat.id, $event)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                </svg>
              </button>
              <!-- 下拉菜单 -->
              <Teleport to="body">
                <div v-if="openMenuId === chat.id" class="chat-dropdown" :style="menuStyle" @click.stop>
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
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="12" y1="17" x2="12" y2="22" stroke-width="2" stroke-linecap="round"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 17h14l-2-7V5H7v5L5 17z"/></svg>
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
        </div>
      </div>

      <!-- 底部设置 -->
      <div class="sidebar-footer">
        <button class="icon-btn" @click="$emit('open-settings')" :title="t('settings')">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
    </template>
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

const emit = defineEmits([
  'new-chat', 'select-chat', 'toggle-sidebar', 'open-settings',
  'mobile-close', 'update:sidebarWidth',
  'open-skill-plaza', 'open-mcp-plaza', 'open-agent-plaza', 'open-deep-research'
])
const chatStore = useChat()

// 搜索
const searchOpen = ref(false)
const searchQuery = ref('')

// 可折叠区块
const agentsOpen = ref(true)
const projectsOpen = ref(true)

// 模拟数据（后续接入真实API）
const agents = ref([])
const projects = ref([])

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

// 排序+搜索
const filteredChats = computed(() => {
  let list = props.chats ? [...props.chats] : []
  // 搜索过滤
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(c => (c.title || '').toLowerCase().includes(q))
  }
  // 置顶排前
  list.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return 0
  })
  return list
})

const onSearch = () => { /* reactive via v-model */ }

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

onMounted(() => {
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
/* ── 侧边栏容器 ── */
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
.sidebar.collapsed { width: 60px; }

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

/* ── 通用图标按钮 ── */
.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  color: var(--text-sub);
  transition: all 0.15s;
  flex-shrink: 0;
}
.icon-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

/* ── 顶部 Header ── */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  flex-shrink: 0;
}

/* ── 收缩态图标列 ── */
.collapsed-icons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 0;
  flex: 1;
}

/* ── 滚动区域 ── */
.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 8px;
  display: flex;
  flex-direction: column;
}
.sidebar-scroll::-webkit-scrollbar { width: 5px; }
.sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
.sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.25); border-radius: 3px; }
.sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(128,128,128,0.4); }

/* ── 导航区块 ── */
.nav-section { padding: 2px 0; }
.nav-section-grow { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.nav-section-grow .section-body { flex: 1; overflow-y: auto; min-height: 0; }

.nav-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 4px;
  opacity: 0.6;
}

/* ── 导航行 ── */
.nav-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
  line-height: 1.3;
}
.nav-row:hover { background: var(--hover-bg); }
.nav-row svg { flex-shrink: 0; color: var(--text-sub); }

/* ── Agent 行 ── */
.agent-avatar {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
}
.explore-row { color: var(--text-sub); font-size: 12px; }
.explore-row:hover { color: var(--text-primary); }

/* ── Section 折叠头 ── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px 4px;
  cursor: pointer;
  user-select: none;
}
.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-sub);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.chevron {
  transition: transform 0.2s;
  color: var(--text-sub);
  opacity: 0.5;
}
.chevron.open { transform: rotate(90deg); }

.section-body { padding: 0; }

.empty-hint {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--text-sub);
  opacity: 0.6;
}

/* ── 搜索框 ── */
.search-box { padding: 2px 4px 6px; }
.search-input {
  width: 100%;
  padding: 7px 10px;
  font-size: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--primary-color); }

/* ── Session 列表 ── */
.session-list {
  padding: 0;
  overflow-y: auto;
}
.session-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}
.session-item:hover { background: var(--hover-bg); }
.session-item.active { background: var(--hover-bg-medium); }

.session-title {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.pin-icon {
  flex-shrink: 0;
  color: var(--primary-color);
  opacity: 0.6;
}

.rename-input {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--primary-color);
  border-radius: 6px;
  padding: 3px 7px;
  outline: none;
}

.more-btn {
  opacity: 0;
  background: none;
  border: none;
  color: var(--text-sub);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}
.session-item:hover .more-btn,
.session-item.active .more-btn { opacity: 1; }
.more-btn:hover { background: var(--hover-bg-medium); color: var(--primary-color); }

/* ── 下拉菜单 ── */
.chat-dropdown {
  position: fixed;
  z-index: 1000;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 4px;
  min-width: 140px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
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
.dropdown-item:hover { background: var(--hover-bg); }
.dropdown-item.danger { color: #e05c4b; }
.dropdown-item.danger:hover { background: rgba(224,92,75,0.08); }
.dropdown-item.item-pinned { color: var(--primary-color); }
.dropdown-item.item-pinned svg { stroke: var(--primary-color); }
.dropdown-divider { height: 1px; background: var(--border-color); margin: 3px 0; }

/* ── 底部 Footer ── */
.sidebar-footer {
  padding: 6px 10px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

/* ── 手机端适配 ── */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -280px;
    top: 0;
    height: 100dvh;
    z-index: 50;
    width: 260px !important;
    box-shadow: 4px 0 24px rgba(0,0,0,0.18);
    transition: left 0.28s cubic-bezier(0.4,0,0.2,1);
  }
  .sidebar.mobile-open { left: 0; }
  .sidebar:not(.mobile-open) { display: none; }
  .resize-handle { display: none; }
}
</style>
