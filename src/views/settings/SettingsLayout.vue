<template>
  <div class="settings-page">
    <SettingsSidebar />
    <main class="settings-main">
      <button class="close-settings" type="button" aria-label="关闭设置" @click="router.push('/')">
        <X :size="18" />
      </button>
      <RouterView v-slot="{ Component }">
        <Transition name="settings-route" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup>
import { RouterView, useRouter } from 'vue-router'
import { X } from '@lucide/vue'
import SettingsSidebar from '@/components/settings/SettingsSidebar.vue'

const router = useRouter()
</script>

<style scoped>
.settings-page {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 8%, color-mix(in srgb, var(--primary-color) 10%, transparent), transparent 30%),
    radial-gradient(circle at 82% 12%, color-mix(in srgb, var(--primary-light) 8%, transparent), transparent 34%),
    linear-gradient(135deg, #fbfcfd 0%, var(--bg-primary) 44%, var(--bg-secondary) 100%);
}

.settings-main {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  padding: 44px clamp(24px, 7vw, 96px) 72px;
  scroll-behavior: smooth;
}

.close-settings {
  position: fixed;
  top: 16px;
  right: 18px;
  z-index: 5;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid color-mix(in srgb, var(--primary-color) 14%, rgba(120, 120, 120, 0.16));
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.78);
  color: var(--text-sub);
  cursor: pointer;
  backdrop-filter: blur(18px);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.10);
  transition: transform .18s ease, color .18s ease, background .18s ease, box-shadow .18s ease;
}

.close-settings:hover {
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 8%, rgba(255,255,255,.88));
  transform: translateY(-1px) rotate(90deg);
  box-shadow: 0 16px 34px color-mix(in srgb, var(--primary-color) 16%, rgba(15,23,42,.12));
}

:deep(.settings-view) {
  width: min(996px, 100%);
  margin: 0 auto;
}

:deep(.settings-view-animated) {
  animation: viewIn .34s cubic-bezier(.2,.8,.2,1) both;
}

:deep(.settings-title) {
  margin: 0 0 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid color-mix(in srgb, var(--primary-color) 12%, rgba(120, 120, 120, 0.14));
  color: var(--text-title);
  font-size: 28px;
  font-weight: 850;
  letter-spacing: 0;
}

:deep(.settings-card),
:deep(.glass-card) {
  position: relative;
  margin-bottom: 28px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--primary-color) 12%, rgba(120, 120, 120, 0.14));
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.72));
  box-shadow:
    0 18px 50px rgba(15, 23, 42, 0.07),
    inset 0 1px 0 rgba(255,255,255,0.82);
  backdrop-filter: blur(20px);
  transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
}

:deep(.settings-card:hover),
:deep(.glass-card:hover) {
  border-color: color-mix(in srgb, var(--primary-color) 24%, rgba(120,120,120,.14));
  box-shadow:
    0 22px 62px rgba(15, 23, 42, 0.10),
    inset 0 1px 0 rgba(255,255,255,0.92);
}

:deep(.card-head) {
  padding: 18px 20px 14px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--primary-color) 5%, rgba(248, 250, 252, 0.92)), rgba(248, 250, 252, 0.50));
}

:deep(.card-head h2) {
  margin: 0;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 800;
}

:deep(.card-head p) {
  margin: 6px 0 0;
  color: var(--text-sub);
  font-size: 13px;
  line-height: 1.5;
}

.settings-route-enter-active,
.settings-route-leave-active {
  transition: opacity .18s ease, transform .18s ease, filter .18s ease;
}

.settings-route-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(.995);
  filter: blur(4px);
}

.settings-route-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(.997);
  filter: blur(3px);
}

:global(html.dark-mode) .settings-page {
  background:
    radial-gradient(circle at 18% 10%, rgba(255,255,255,.035), transparent 28%),
    linear-gradient(135deg, #111111 0%, #171717 48%, #0d0d0d 100%);
}

:global(html.dark-mode) .settings-main {
  color: #eef7f1;
}

:global(html.dark-mode) .close-settings {
  border-color: color-mix(in srgb, var(--primary-color) 22%, rgba(255,255,255,.10));
  background: rgba(23, 31, 27, .76);
  color: rgba(214, 232, 221, .72);
  box-shadow: 0 16px 42px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.05);
}

:global(html.dark-mode) :deep(.settings-title) {
  border-bottom-color: color-mix(in srgb, var(--primary-color) 18%, rgba(255,255,255,.08));
  color: #f2fbf5;
  text-shadow: 0 0 24px color-mix(in srgb, var(--primary-color) 18%, transparent);
}

:global(html.dark-mode) :deep(.settings-card),
:global(html.dark-mode) :deep(.glass-card) {
  border-color: rgba(255,255,255,.10);
  background:
    linear-gradient(180deg, rgba(31, 31, 31, .92), rgba(22, 22, 22, .9));
  box-shadow:
    0 24px 70px rgba(0, 0, 0, .32),
    inset 0 1px 0 rgba(255,255,255,.055);
}

:global(html.dark-mode) :deep(.settings-card:hover),
:global(html.dark-mode) :deep(.glass-card:hover) {
  border-color: rgba(255,255,255,.16);
  box-shadow:
    0 30px 82px rgba(0, 0, 0, .42),
    0 0 0 1px color-mix(in srgb, var(--primary-color) 7%, transparent),
    inset 0 1px 0 rgba(255,255,255,.07);
}

:global(html.dark-mode) :deep(.card-head) {
  background:
    linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.018));
  border-bottom: 1px solid rgba(255,255,255,.045);
}

:global(html.dark-mode) :deep(.card-head h2),
:global(html.dark-mode) :deep(.setting-name) {
  color: #edf8f1;
}

:global(html.dark-mode) :deep(.card-head p),
:global(html.dark-mode) :deep(.setting-desc) {
  color: rgba(196, 214, 204, .72);
}

@keyframes viewIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 900px) {
  .settings-page {
    flex-direction: column;
  }

  .settings-main {
    padding: 28px 16px 56px;
  }
}
</style>
