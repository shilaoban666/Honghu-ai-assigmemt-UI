<template>
  <Teleport to="body">
    <Transition name="reslib-fade">
      <div v-if="visible" class="reslib-overlay" @click.self="$emit('close')">
        <section class="reslib-modal" role="dialog" aria-modal="true">
          <header class="reslib-header">
            <div class="reslib-heading">
              <span class="reslib-badge-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke-width="1.8" stroke-linecap="round"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" stroke-width="1.8" stroke-linejoin="round"/></svg>
              </span>
              <div class="reslib-heading-copy">
                <h2>文件 / 资源库</h2>
                <p>全局资料库 · 对所有会话可见，作为 AI 的长期知识来源</p>
              </div>
            </div>
            <button class="reslib-icon-btn" @click="$emit('close')" title="关闭">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </header>

          <div class="reslib-toolbar">
            <div class="reslib-toolbar-left">
              <button class="reslib-action primary" @click="triggerUpload">
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.9" d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14"/></svg>
                <span>上传文件</span>
              </button>
              <button class="reslib-action" @click="createDoc">
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 12v5M9.5 14.5h5" stroke-width="1.8" stroke-linecap="round"/></svg>
                <span>新建文稿</span>
              </button>
            </div>
            <div class="reslib-segment">
              <button :class="{ active: view === 'list' }" @click="view = 'list'" title="列表视图">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="2" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
              </button>
              <button :class="{ active: view === 'grid' }" @click="view = 'grid'" title="网格视图">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke-width="2"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke-width="2"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke-width="2"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke-width="2"/></svg>
              </button>
            </div>
          </div>

          <main class="reslib-body">
            <div v-if="items.length === 0" class="reslib-empty">
              <span class="reslib-empty-icon">
                <svg width="30" height="30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke-width="1.6" stroke-linecap="round"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" stroke-width="1.6" stroke-linejoin="round"/></svg>
              </span>
              <p>这里还没有文件或文件夹。先上传一个文件，或创建文稿开始整理</p>
            </div>

            <div v-else class="reslib-items" :class="view">
              <article v-for="(item, index) in items" :key="item.id" class="reslib-card" :style="{ '--row-index': index }">
                <span class="reslib-card-icon">{{ item.ext }}</span>
                <div class="reslib-card-copy">
                  <strong :title="item.name">{{ item.name }}</strong>
                  <small>{{ item.meta }}</small>
                </div>
                <button class="reslib-card-del" @click="removeItem(index)" title="移除">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </article>
            </div>
          </main>

          <input ref="fileInputRef" type="file" multiple class="reslib-hidden-input" @change="onFilesSelected" />
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

defineProps({ visible: { type: Boolean, default: false } })
defineEmits(['close'])

// 视图模式：列表 / 网格，纯前端切换，和参考稿保持一致的两种排布。
const view = ref('list')
// 资源条目；当前为前端内存数据，后端文件服务接好后可替换为接口返回的文件列表。
const items = ref([])
const fileInputRef = ref(null)
let seq = 0

const formatSize = (bytes) => {
  if (bytes === null || bytes === undefined) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// 从文件名提取后缀作为图标文字；没有后缀时用占位符，最多展示 4 个字符避免撑破图标。
const extOf = (name) => {
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop().slice(0, 4).toUpperCase() : '·'
}

const triggerUpload = () => fileInputRef.value?.click()

const onFilesSelected = (event) => {
  const files = Array.from(event.target.files || [])
  const today = new Date().toLocaleDateString('zh-CN')
  files.forEach(file => {
    items.value.push({ id: `f${seq++}`, name: file.name, ext: extOf(file.name), meta: `${formatSize(file.size)} · ${today}` })
  })
  event.target.value = ''
}

const createDoc = () => {
  const today = new Date().toLocaleDateString('zh-CN')
  items.value.push({ id: `d${seq++}`, name: `未命名文稿 ${items.value.length + 1}`, ext: '文', meta: `文稿 · ${today}` })
}

const removeItem = (index) => items.value.splice(index, 1)
</script>

<style scoped>
.reslib-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.30);
  backdrop-filter: blur(10px);
}

.reslib-modal {
  /* 与技能商店一致：以 --bg-primary 为底，叠加极淡主色光晕，跟随全局主题。 */
  width: min(760px, calc(100vw - 48px));
  height: min(620px, calc(100vh - 48px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 18px;
  background:
    radial-gradient(circle at 12% -4%, color-mix(in srgb, var(--primary-color) 9%, transparent), transparent 32%),
    var(--bg-primary);
  color: var(--text-primary);
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.20), 0 0 0 1px color-mix(in srgb, var(--primary-color) 8%, transparent) inset;
}

.reslib-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-color);
}

.reslib-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.reslib-badge-icon {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--primary-color) 14%, transparent);
  color: var(--primary-color);
}

.reslib-heading-copy h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--text-title);
}

.reslib-heading-copy p {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--text-sub);
}

.reslib-icon-btn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 8px;
  flex-shrink: 0;
  background: var(--hover-bg);
  color: var(--text-sub);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}

.reslib-icon-btn:hover {
  background: var(--hover-bg-medium);
  color: var(--primary-color);
}

.reslib-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 24px;
}

.reslib-toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reslib-action {
  height: 34px;
  border: 1px solid var(--border-color);
  border-radius: 9px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.18s ease, border-color 0.18s ease, filter 0.18s ease;
}

.reslib-action:hover {
  border-color: color-mix(in srgb, var(--primary-color) 40%, transparent);
  background: var(--hover-bg);
}

.reslib-action.primary {
  border-color: transparent;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: #fff;
}

.reslib-action.primary:hover {
  filter: brightness(1.05);
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
}

.reslib-segment {
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  border: 1px solid var(--border-color);
  border-radius: 9px;
  background: var(--bg-secondary);
}

.reslib-segment button {
  width: 30px;
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-sub);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}

.reslib-segment button:hover {
  color: var(--text-primary);
}

.reslib-segment button.active {
  background: var(--bg-primary);
  color: var(--primary-color);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

.reslib-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 6px 24px 24px;
}

.reslib-empty {
  height: 100%;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-align: center;
}

.reslib-empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  color: var(--text-sub);
  border: 1px dashed color-mix(in srgb, var(--primary-color) 26%, transparent);
}

.reslib-empty p {
  margin: 0;
  max-width: 320px;
  color: var(--text-sub);
  font-size: 13px;
  line-height: 1.7;
}

.reslib-items {
  display: grid;
  gap: 10px;
}

.reslib-items.list {
  grid-template-columns: 1fr;
}

.reslib-items.grid {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.reslib-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 11px;
  background: var(--bg-primary);
  animation: cardEnter 0.34s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(min(var(--row-index), 12) * 0.03s);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.reslib-card:hover {
  border-color: color-mix(in srgb, var(--primary-color) 42%, transparent);
  box-shadow: 0 10px 26px color-mix(in srgb, var(--primary-color) 13%, transparent);
  transform: translateY(-2px);
}

.reslib-card-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--hover-bg-medium);
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 800;
}

.reslib-card-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reslib-card-copy strong {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reslib-card-copy small {
  font-size: 11px;
  color: var(--text-sub);
}

.reslib-card-del {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 7px;
  flex-shrink: 0;
  background: transparent;
  color: var(--text-sub);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}

.reslib-card-del:hover {
  background: var(--hover-bg-medium);
  color: var(--primary-color);
}

.reslib-hidden-input {
  display: none;
}

.reslib-fade-enter-active {
  transition: opacity 0.26s ease;
}

.reslib-fade-leave-active {
  transition: opacity 0.18s ease;
}

.reslib-fade-enter-active .reslib-modal {
  animation: reslibIn 0.36s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.reslib-fade-leave-active .reslib-modal {
  animation: reslibOut 0.18s cubic-bezier(0.4, 0, 1, 1) both;
}

.reslib-fade-enter-from,
.reslib-fade-leave-to {
  opacity: 0;
}

@keyframes reslibIn {
  from { transform: translateY(12px) scale(0.97); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes reslibOut {
  from { transform: translateY(0) scale(1); opacity: 1; }
  to { transform: translateY(6px) scale(0.985); opacity: 0; }
}

@keyframes cardEnter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 640px) {
  .reslib-overlay {
    padding: 0;
  }
  .reslib-modal {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
  .reslib-items.grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
</style>
