<template>
  <div class="setting-row">
    <div class="setting-info">
      <span class="setting-name">{{ title }}</span>
      <span v-if="description" class="setting-desc">{{ description }}</span>
    </div>
    <div class="setting-control">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' }
})
</script>

<style scoped>
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 56px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-color);
  transition: background .18s ease;
}

.setting-row:hover {
  background: color-mix(in srgb, var(--primary-color) 4%, transparent);
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.setting-name {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 650;
}

.setting-desc {
  color: var(--text-sub);
  font-size: 12px;
  line-height: 1.5;
}

.setting-control {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
}

@media (max-width: 640px) {
  .setting-row {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .setting-control {
    justify-content: flex-start;
  }
}
</style>
