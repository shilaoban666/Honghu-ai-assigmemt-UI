<template>
  <nav class="settings-breadcrumb" aria-label="设置路径">
    <button type="button" @click="$router.push('/')">{{ st('home') }}</button>
    <span>/</span>
    <button type="button" @click="$router.push('/settings')">{{ st('settings') }}</button>
    <span v-if="group">/</span>
    <span v-if="group" class="muted">{{ group }}</span>
    <span v-if="title">/</span>
    <strong v-if="title">{{ title }}</strong>
  </nav>
</template>

<script setup>
import { st } from '@/components/settings/settingsLocale'

defineProps({
  group: { type: String, default: '' },
  title: { type: String, default: '' }
})
</script>

<style scoped>
.settings-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  color: var(--text-sub);
  font-size: 13px;
  white-space: nowrap;
}

.settings-breadcrumb button {
  border: none;
  background: transparent;
  color: var(--text-sub);
  cursor: pointer;
  padding: 4px 0;
  transition: color .18s ease;
}

.settings-breadcrumb button:hover,
.settings-breadcrumb strong {
  color: var(--text-primary);
}

.muted {
  color: var(--text-sub);
}
</style>
