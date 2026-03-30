<template>
  <Teleport to="body">
    <div v-if="visible" class="confirm-overlay" @click="$emit('cancel')">
      <div class="confirm-modal" @click.stop>
        <div class="confirm-icon">{{ icon }}</div>
        <h3 class="confirm-title">{{ title }}</h3>
        <p class="confirm-message">{{ message }}</p>
        <div class="confirm-buttons">
          <button @click="$emit('cancel')" class="btn-cancel">{{ cancelLabel }}</button>
          <button @click="$emit('confirm')" :class="['btn-confirm', { danger: danger }]">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { t } from '@/utils/i18n'

const props = defineProps({
  visible:     { type: Boolean, default: false },
  icon:        { type: String,  default: '⚠️' },
  title:       { type: String,  default: '' },
  message:     { type: String,  default: '' },
  confirmText: { type: String,  default: '' },
  danger:      { type: Boolean, default: false }
})

const cancelLabel = computed(() => t('cancel'))

defineEmits(['confirm', 'cancel'])
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(45, 134, 89, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
  animation: fadeIn .25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.confirm-modal {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  padding: 40px 36px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(45, 134, 89, 0.2);
  border: 1px solid rgba(45, 134, 89, 0.1);
  animation: slideUp .35s cubic-bezier(0.34, 1.56, 0.64, 1);
  width: 90%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

@keyframes slideUp {
  from { transform: scale(0.9) translateY(24px); opacity: 0; }
  to   { transform: scale(1) translateY(0);       opacity: 1; }
}

.confirm-icon {
  font-size: 52px;
  margin-bottom: 18px;
  animation: iconBounce .5s ease;
}

@keyframes iconBounce {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}

.confirm-title {
  font-size: 20px;
  font-weight: 700;
  color: #2d8659;
  margin: 0 0 10px;
}

.confirm-message {
  font-size: 14px;
  color: #666;
  margin: 0 0 28px;
  line-height: 1.6;
}

.confirm-buttons {
  display: flex;
  gap: 12px;
  width: 100%;
}

.btn-cancel {
  flex: 1;
  padding: 11px 16px;
  background: rgba(45, 134, 89, 0.07);
  border: 1.5px solid rgba(45, 134, 89, 0.28);
  border-radius: 8px;
  color: #2d8659;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
}

.btn-cancel:hover {
  background: rgba(45, 134, 89, 0.12);
  border-color: rgba(45, 134, 89, 0.5);
  transform: translateY(-1px);
}

.btn-confirm {
  flex: 1;
  padding: 11px 16px;
  background: linear-gradient(135deg, #2d8659 0%, #1e5a3a 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
  box-shadow: 0 4px 14px rgba(45, 134, 89, 0.25);
}

.btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(45, 134, 89, 0.35);
}

.btn-confirm.danger {
  background: linear-gradient(135deg, #e05c4b 0%, #c0392b 100%);
  box-shadow: 0 4px 14px rgba(192, 57, 43, 0.25);
}

.btn-confirm.danger:hover {
  box-shadow: 0 6px 18px rgba(192, 57, 43, 0.35);
}
</style>
