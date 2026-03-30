<template>
  <Teleport to="body">
    <Transition name="skill-fade">
      <div v-if="visible" class="skill-overlay" @click.self="$emit('close')">
        <div class="skill-modal">
          <!-- 标题栏 -->
          <div class="skill-header">
            <h2 class="skill-title">{{ t('skillStore') }}</h2>
            <button class="skill-close" @click="$emit('close')">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Tab 栏 -->
          <div class="skill-tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              :class="['tab-btn', { active: activeTab === tab.key }]"
              @click="activeTab = tab.key"
            >{{ tab.label }}</button>
          </div>

          <!-- 搜索框 -->
          <div class="skill-search-bar">
            <svg class="search-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke-width="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke-width="2" stroke-linecap="round"/></svg>
            <input v-model="search" class="search-input" :placeholder="activeTab === 'community' ? t('searchMcp') : t('searchSkills')" />
          </div>

          <!-- 技能列表 -->
          <div class="skill-grid">
            <div
              v-for="skill in filteredSkills"
              :key="skill.id"
              class="skill-card"
            >
              <div class="skill-card-icon" :style="{ background: skill.color || '#f0f0f0' }">
                <span>{{ skill.icon }}</span>
              </div>
              <div class="skill-card-info">
                <div class="skill-card-name">
                  {{ skill.name }}
                  <span v-if="skill.badge" class="skill-badge" :class="skill.badge">{{ skill.badge === 'new' ? t('newBadge') : skill.badge === 'mcp' ? 'MCP' : skill.badge }}</span>
                </div>
                <p class="skill-card-desc">{{ skill.description }}</p>
              </div>
              <button
                class="skill-add-btn"
                :class="{ added: enabledSkills.includes(skill.id) }"
                @click="toggleSkill(skill)"
                :title="enabledSkills.includes(skill.id) ? t('enabled') : t('add')"
              >
                <svg v-if="!enabledSkills.includes(skill.id)" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14m7-7H5"/></svg>
                <svg v-else width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { t } from '@/utils/i18n'

defineProps({ visible: { type: Boolean, default: false } })
defineEmits(['close'])

const activeTab = ref('builtin')
const search = ref('')
const enabledSkills = ref([])

const tabs = [
  { key: 'builtin', label: t('builtIn') },
  { key: 'community', label: t('mcpTools') },
  { key: 'custom', label: t('custom') }
]

const allSkills = [
  // 内置
  { id: 'artifacts', tab: 'builtin', icon: '🧩', color: '#f3e8ff', name: 'Artifacts', description: '生成并预览交互式 UI 组件和可视化内容' },
  { id: 'code-review', tab: 'builtin', icon: '🔍', color: '#e0f2fe', name: '代码审查', description: '对代码进行深度审查，提供改进建议和最佳实践' },
  { id: 'calculator', tab: 'builtin', icon: '🔢', color: '#dcfce7', name: '计算器', description: '执行数学计算、解方程，并处理符号表达式' },
  { id: 'notebook', tab: 'builtin', icon: '📓', color: '#fef3c7', name: '笔记本', description: '在对话主题中创建和管理文档' },
  { id: 'gtd', tab: 'builtin', icon: '✅', color: '#d1fae5', name: 'GTD 工具', description: '使用 GTD 方法规划目标并追踪进度' },
  { id: 'task', tab: 'builtin', icon: '📋', color: '#e5e7eb', name: 'Task', description: 'Task management and execution — create, run tasks' },
  { id: 'credentials', tab: 'builtin', icon: '🔑', color: '#fce7f3', name: 'Credentials', description: 'Manage user credentials for authentication' },
  { id: 'github', tab: 'builtin', icon: '🐙', color: '#f3f4f6', name: 'GitHub', description: 'GitHub is a platform for version control and collaboration' },
  // 社区 / MCP
  { id: 'ms-mcp', tab: 'community', icon: '🪟', color: '#dbeafe', name: 'Microsoft Learn MCP', description: 'Provides secure, direct access to Microsoft services', badge: 'mcp' },
  { id: 'context7', tab: 'community', icon: '🌐', color: '#f0fdf4', name: 'Context7 MCP', description: 'MCP server for up-to-date documentation and code examples', badge: 'mcp' },
  { id: 'apify', tab: 'community', icon: '🔺', color: '#fff7ed', name: 'Apify MCP Server', description: 'Enables AI agents to interact with Apify platform', badge: 'mcp' },
  { id: 'lanhu', tab: 'community', icon: '📐', color: '#fef2f2', name: 'Lanhu MCP Server', description: '自动从蓝湖设计稿提取样式和资源', badge: 'mcp' },
  { id: 'sentry', tab: 'community', icon: '📡', color: '#f5f3ff', name: 'Sentry MCP', description: "Sentry's MCP service middleware to the upstream", badge: 'mcp' },
  { id: 'obsidian', tab: 'community', icon: '💎', color: '#ede9fe', name: 'Obsidian MCP Plugin', description: 'Semantic server providing tools with knowledge base', badge: 'mcp' },
  { id: 'gitmcp', tab: 'community', icon: '📂', color: '#ecfdf5', name: 'GitMCP', description: 'A free, open-source MCP server for git repos', badge: 'mcp' },
  { id: 'linear', tab: 'community', icon: '🔵', color: '#eef2ff', name: 'Linear', description: 'Linear 是一款现代化的问题跟踪和项目管理工具' },
  { id: 'outlook', tab: 'community', icon: '📅', color: '#dbeafe', name: 'Outlook Calendar', description: 'Outlook 日历是 Microsoft Outlook 集成的日程管理' },
  { id: 'twitter', tab: 'community', icon: '𝕏', color: '#f3f4f6', name: 'X (Twitter)', description: 'X（原 Twitter）是一个社交媒体平台' },
  { id: 'gmail', tab: 'community', icon: '📧', color: '#fef2f2', name: 'Gmail', description: 'Gmail 是 Google 提供的免费电子邮件服务' }
]

const filteredSkills = computed(() => {
  const q = search.value.toLowerCase()
  return allSkills.filter(s => {
    const tabMatch = activeTab.value === 'builtin' ? s.tab === 'builtin' : activeTab.value === 'community' ? s.tab === 'community' : false
    if (!tabMatch) return false
    if (!q) return true
    return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  })
})

const toggleSkill = (skill) => {
  const idx = enabledSkills.value.indexOf(skill.id)
  if (idx > -1) enabledSkills.value.splice(idx, 1)
  else enabledSkills.value.push(skill.id)
}
</script>

<style scoped>
.skill-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.skill-modal {
  background: var(--bg-primary, #fff);
  border-radius: 20px;
  width: 680px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.18);
  animation: skillIn 0.28s cubic-bezier(0.34,1.56,0.64,1);
  overflow: hidden;
}

@keyframes skillIn {
  from { opacity: 0; transform: scale(0.9) translateY(16px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.skill-fade-enter-active,
.skill-fade-leave-active {
  transition: opacity 0.2s;
}
.skill-fade-enter-from,
.skill-fade-leave-to {
  opacity: 0;
}

/* 标题栏 */
.skill-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 28px 0;
}

.skill-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #1a1a1a);
  margin: 0;
}

.skill-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-sub, #999);
  padding: 5px;
  border-radius: 8px;
  display: flex;
  transition: all 0.15s;
}
.skill-close:hover {
  background: var(--hover-bg, #f0f0f0);
  color: var(--text-primary, #333);
}

/* Tab */
.skill-tabs {
  display: flex;
  gap: 0;
  padding: 16px 28px 0;
  border-bottom: 1.5px solid var(--border-color, #eee);
}

.tab-btn {
  background: none;
  border: none;
  border-bottom: 2.5px solid transparent;
  padding: 8px 22px 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-sub, #999);
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0;
}
.tab-btn.active {
  color: var(--primary-color, #2d8659);
  border-bottom-color: var(--primary-color, #2d8659);
  font-weight: 600;
}
.tab-btn:hover:not(.active) {
  color: var(--text-primary, #555);
}

/* 搜索框 */
.skill-search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 28px 0;
  padding: 10px 14px;
  background: var(--bg-secondary, #f7f8fa);
  border: 1.5px solid var(--border-color, #e4e4e4);
  border-radius: 10px;
  transition: border-color 0.2s;
}
.skill-search-bar:focus-within {
  border-color: var(--primary-color, #2d8659);
}

.search-icon {
  color: var(--text-sub, #aaa);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 13px;
  color: var(--text-primary, #333);
  outline: none;
}
.search-input::placeholder {
  color: var(--text-sub, #bbb);
}

/* 技能列表 grid */
.skill-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 16px 28px 24px;
  overflow-y: auto;
  flex: 1;
}

.skill-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1.5px solid var(--border-color, #eee);
  background: var(--bg-primary, #fff);
  transition: all 0.18s;
  cursor: default;
}
.skill-card:hover {
  border-color: var(--primary-color, #2d8659);
  box-shadow: 0 4px 16px rgba(45,134,89,0.08);
}

.skill-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.skill-card-info {
  flex: 1;
  min-width: 0;
}

.skill-card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #222);
  display: flex;
  align-items: center;
  gap: 6px;
}

.skill-badge {
  font-size: 10px;
  font-weight: 600;
  border-radius: 4px;
  padding: 1px 5px;
  line-height: 1.4;
}
.skill-badge.mcp {
  background: #e0f2fe;
  color: #0284c7;
}
.skill-badge.new {
  background: #dcfce7;
  color: #16a34a;
}

.skill-card-desc {
  font-size: 12px;
  color: var(--text-sub, #999);
  margin: 3px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.skill-add-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1.5px solid var(--border-color, #ddd);
  background: var(--bg-primary, #fff);
  color: var(--text-sub, #aaa);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.skill-add-btn:hover {
  border-color: var(--primary-color, #2d8659);
  color: var(--primary-color, #2d8659);
  background: var(--hover-bg, #f5fbf7);
}
.skill-add-btn.added {
  background: var(--primary-color, #2d8659);
  border-color: var(--primary-color, #2d8659);
  color: #fff;
}

/* 滚动条 */
.skill-grid::-webkit-scrollbar {
  width: 5px;
}
.skill-grid::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.12);
  border-radius: 3px;
}

@media (max-width: 640px) {
  .skill-grid {
    grid-template-columns: 1fr;
  }
  .skill-modal {
    border-radius: 14px;
  }
}
</style>
