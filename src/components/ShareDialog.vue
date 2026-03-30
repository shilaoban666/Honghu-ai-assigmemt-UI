<template>
  <Teleport to="body">
    <Transition name="share-fade">
      <div v-if="visible" class="share-overlay" @click.self="$emit('close')">
        <div class="share-modal">
          <!-- 标题栏 -->
          <div class="share-header">
            <h2 class="share-title">{{ t('shareableLink') }}</h2>
            <button class="share-close" @click="$emit('close')" :title="t('close')">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- 链接区域 -->
          <div class="link-area">
            <div v-if="loading" class="link-loading">
              <span class="loading-text">{{ t('creatingLink') }}</span>
              <span class="loading-dot"></span>
            </div>
            <div v-else class="link-row">
              <input
                class="link-input"
                :value="shareUrl"
                readonly
                @focus="(e) => e.target.select()"
              />
              <button
                class="copy-btn"
                @click="copyLink"
                :title="copied ? t('copied') : t('copyLink')"
                :class="{ copied }"
              >
                <svg v-if="!copied" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2"/>
                  <path stroke-width="2" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                <svg v-else width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- 说明文字 -->
          <div class="share-note">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="note-icon">
              <circle cx="12" cy="12" r="10" stroke-width="2"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke-width="2" stroke-linecap="round"/>
              <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
            <span>{{ t('shareDisclaimer') }}</span>
          </div>

          <!-- 分割线 -->
          <div class="share-divider"></div>

          <!-- 社交分享按钮 -->
          <div class="social-row">
            <!-- LinkedIn -->
            <button class="social-btn" @click="shareToSocial('linkedin')">
              <div class="social-icon" style="background:#0A66C2">
                <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
                  <path d="M6.94 5a2 2 0 11-4-.002 2 2 0 014 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z"/>
                </svg>
              </div>
              <span>LinkedIn</span>
            </button>

            <!-- Facebook -->
            <button class="social-btn" @click="shareToSocial('facebook')">
              <div class="social-icon" style="background:#1877F2">
                <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                </svg>
              </div>
              <span>Facebook</span>
            </button>

            <!-- X (Twitter) -->
            <button class="social-btn" @click="shareToSocial('x')">
              <div class="social-icon" style="background:#000">
                <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <span>X</span>
            </button>

            <!-- Reddit -->
            <button class="social-btn" @click="shareToSocial('reddit')">
              <div class="social-icon" style="background:#FF4500">
                <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
                  <path d="M22 12.2c0-1.1-1-2-2.2-2-.5 0-1 .15-1.38.42-1.5-.93-3.38-1.5-5.42-1.6l1-4.3 2.9.67c.08.9.85 1.61 1.8 1.61 1 0 1.8-.8 1.8-1.8S19.7 5.4 18.7 5.4c-.7 0-1.3.4-1.6 1l-3.2-.74c-.18-.04-.34.07-.38.25L12.4 10c-2.07.09-3.94.67-5.35 1.6A2.1 2.1 0 005.6 11.2c-1.22 0-2.2.98-2.2 2.2 0 .77.42 1.45 1.05 1.82-.04.2-.05.4-.05.6C4.4 18.6 7.9 21 12 21s7.6-2.4 7.6-5.2c0-.2-.01-.4-.05-.6.63-.37 1.05-1.05 1.05-1.82zM7.5 13.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm8.43 3.87c-.8.8-2.02 1.13-3.43 1.13s-2.63-.34-3.43-1.13a.5.5 0 01.7-.7c.62.6 1.6.9 2.73.9s2.1-.3 2.73-.9a.5.5 0 01.7.7zm-.43-2.37a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
                </svg>
              </div>
              <span>Reddit</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { t } from '@/utils/i18n'

const props = defineProps({
  visible: { type: Boolean, default: false },
  chat: { type: Object, default: null }
})

defineEmits(['close'])

const loading = ref(false)
const copied = ref(false)

const shareUrl = computed(() => {
  if (!props.chat) return ''
  return `${window.location.origin}/share/${props.chat.id}`
})

watch(() => props.visible, (val) => {
  if (val) {
    loading.value = true
    copied.value = false
    setTimeout(() => { loading.value = false }, 1500)
  }
})

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
  } catch {
    // fallback for older browsers
    const el = document.createElement('textarea')
    el.value = shareUrl.value
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

const shareToSocial = (platform) => {
  const url = encodeURIComponent(shareUrl.value)
  const title = encodeURIComponent(props.chat?.title || 'AI Chat')
  const targets = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    x: `https://x.com/intent/tweet?url=${url}&text=${title}`,
    reddit: `https://www.reddit.com/submit?url=${url}&title=${title}`
  }
  if (targets[platform]) {
    window.open(targets[platform], '_blank', 'noopener,noreferrer')
  }
}
</script>

<style scoped>
.share-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.share-modal {
  background: var(--bg-primary, #fff);
  border-radius: 18px;
  padding: 28px 32px 24px;
  width: 460px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
  animation: modalIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.88) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.share-fade-enter-active,
.share-fade-leave-active {
  transition: opacity 0.2s;
}
.share-fade-enter-from,
.share-fade-leave-to {
  opacity: 0;
}

/* 标题栏 */
.share-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.share-title {
  font-size: 19px;
  font-weight: 700;
  color: var(--text-primary, #1a1a1a);
  margin: 0;
}

.share-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-sub, #888);
  padding: 5px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  transition: background 0.15s, color 0.15s;
}
.share-close:hover {
  background: var(--hover-bg, #f0f0f0);
  color: var(--text-primary, #333);
}

/* 链接区域 */
.link-area {
  background: var(--bg-secondary, #f7f8fa);
  border: 1.5px solid var(--border-color, #e0e0e0);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 14px;
  min-height: 54px;
  display: flex;
  align-items: center;
}

.link-loading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.loading-text {
  font-size: 14px;
  color: var(--text-sub, #888);
}

.loading-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2d8659;
  animation: dotPulse 0.9s ease-in-out infinite;
}

@keyframes dotPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.35; transform: scale(0.55); }
}

.link-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.link-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 13px;
  color: var(--text-primary, #333);
  min-width: 0;
  cursor: text;
  font-family: monospace;
}

.copy-btn {
  background: linear-gradient(135deg, #2d8659, #1e5a3a);
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.copy-btn:hover {
  opacity: 0.85;
  transform: scale(1.06);
}
.copy-btn.copied {
  background: linear-gradient(135deg, #3ca870, #2d8659);
}

/* 说明文字 */
.share-note {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-size: 12px;
  color: var(--text-sub, #888);
  line-height: 1.6;
  margin-bottom: 20px;
}

.note-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

/* 分割线 */
.share-divider {
  height: 1px;
  background: var(--border-color, #eaeaea);
  margin-bottom: 22px;
}

/* 社交按钮行 */
.social-row {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.social-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  transition: background 0.15s;
}
.social-btn:hover {
  background: var(--hover-bg, #f5f5f5);
}

.social-icon {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.social-btn:hover .social-icon {
  transform: scale(1.1);
}

.social-btn span {
  font-size: 12px;
  color: var(--text-primary, #444);
  font-weight: 500;
}
</style>
