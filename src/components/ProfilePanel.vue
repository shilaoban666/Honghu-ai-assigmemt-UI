<template>
  <div v-if="visible" class="profile-overlay" @click="closeProfile">
    <div class="profile-panel" @click.stop>
      <!-- 头部 -->
      <div class="profile-header">
        <h2>{{ isLoggedIn ? t('accountInfo') : t('userCenter') }}</h2>
        <button class="close-btn" @click="closeProfile">✕</button>
      </div>

      <!-- 内容区域 -->
      <div class="profile-content">
        <!-- 已登录状态 -->
        <template v-if="isLoggedIn">
          <!-- 头像和基本信息 -->
          <div class="profile-info">
            <div class="avatar-section">
              <div class="avatar">
                <img v-if="userInfo.avatar" :src="userInfo.avatar" alt="头像" />
                <span v-else class="avatar-placeholder">👤</span>
              </div>
              <button class="upload-avatar-btn" @click="triggerFileInput">
                {{ t('uploadAvatar') }}
              </button>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="handleAvatarUpload"
                style="display: none"
              />
            </div>
            <div class="user-details">
              <p class="user-name">{{ userInfo.nickname || userInfo.name || currentUser?.nickname || currentUser?.username || t('user') }}</p>
              <p class="user-email">{{ userInfo.email || currentUser?.email || 'N/A' }}</p>
              <p class="user-phone">{{ userInfo.phone || currentUser?.phone || 'N/A' }}</p>
            </div>
          </div>

          <!-- 设置项 -->
          <div class="settings-group">
            <button class="setting-item" @click="showEditPhone">
              <span>📱 {{ t('changePhone') }}</span>
              <span class="arrow">→</span>
            </button>
            <button class="setting-item" @click="showEditPassword">
              <span>🔐 {{ t('changePassword') }}</span>
              <span class="arrow">→</span>
            </button>
            <button class="setting-item" @click="showEditEmail">
              <span>📧 {{ t('changeEmail') }}</span>
              <span class="arrow">→</span>
            </button>
          </div>

          <!-- 模态框 -->
          <div v-if="editModal" class="modal-overlay-inner" @click="editModal = null">
            <div class="modal-content" @click.stop>
              <h3>{{ editModal === 'phone' ? t('changePhone') : editModal === 'password' ? t('changePassword') : t('changeEmail') }}</h3>
              <input
                v-model="editValue"
                :type="editModal === 'password' ? 'password' : editModal === 'email' ? 'email' : 'tel'"
                :placeholder="editModal === 'phone' ? t('enterNewPhone') : editModal === 'password' ? t('enterNewPassword') : t('enterNewEmail')"
                class="edit-input"
              />
              <div class="modal-buttons">
                <button @click="editModal = null" class="btn-cancel">{{ t('cancel') }}</button>
                <button @click="saveEdit" class="btn-save">{{ t('save') }}</button>
              </div>
            </div>
          </div>

          <!-- 退出登录按钮 -->
          <button class="logout-btn" @click="handleLogout">📤 {{ t('logoutAccount') }}</button>

          <!-- 登出确认弹窗 -->
          <ConfirmDialog
            :visible="showLogoutConfirm"
            icon="🚪"
            :title="t('confirmLogoutTitle')"
            :message="t('confirmLogoutMsg')"
            :confirm-text="t('logout')"
            @confirm="confirmLogout"
            @cancel="cancelLogout"
          />
        </template>

        <!-- 未登录状态 -->
        <template v-else>
          <div class="login-section">
            <div class="login-icon">🌟</div>
            <p class="login-text">{{ t('notLoggedInMsg') }}</p>
            <p class="login-subtitle">{{ t('loginForMore') }}</p>
            <button class="login-btn" @click="handleLogin">🔑 {{ t('loginAccount') }}</button>
            <button class="register-btn" @click="handleRegister">✍️ {{ t('registerAccount') }}</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { t } from '@/utils/i18n'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  currentUser: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'logout', 'login', 'show-forgot-password', 'show-register'])

const fileInput = ref(null)
const editModal = ref(null)
const editValue = ref('')
const showLogoutConfirm = ref(false)

const userInfo = reactive({
  name: '',
  nickname: '',
  email: '',
  phone: '',
  avatar: null
})

// 监听登录状态变化，更新用户信息
watch(() => props.currentUser, (newUser) => {
  if (newUser && newUser.username) {
    userInfo.name = newUser.username
    userInfo.nickname = newUser.nickname || newUser.username
    userInfo.email = newUser.email || ''
    userInfo.phone = newUser.phone || ''
    userInfo.avatar = newUser.avatar || null
  }
}, { deep: true, immediate: true })

const closeProfile = () => {
  emit('close')
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleAvatarUpload = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      userInfo.avatar = e.target.result
      localStorage.setItem('userAvatar', userInfo.avatar)
    }
    reader.readAsDataURL(file)
  }
}

const showEditPhone = () => {
  editModal.value = 'phone'
  editValue.value = userInfo.phone
}

const showEditPassword = () => {
  editModal.value = 'password'
  editValue.value = ''
}

const showEditEmail = () => {
  editModal.value = 'email'
  editValue.value = userInfo.email
}

const saveEdit = () => {
  if (!editValue.value) return

  if (editModal.value === 'phone') {
    userInfo.phone = editValue.value
  } else if (editModal.value === 'password') {
    alert('密码修改成功')
  } else if (editModal.value === 'email') {
    userInfo.email = editValue.value
  }

  editModal.value = null
}

const handleLogout = () => {
  showLogoutConfirm.value = true
}

const confirmLogout = () => {
  emit('logout')
  closeProfile()
  showLogoutConfirm.value = false
}

const cancelLogout = () => {
  showLogoutConfirm.value = false
}

const handleLogin = () => {
  emit('login')
  closeProfile()
}

const handleRegister = () => {
  emit('show-register')
  closeProfile()
}
</script>

<style scoped>
.profile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.profile-panel {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(40px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  background: white;
  border-radius: 16px 16px 0 0;
}

.profile-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #222222;
  margin: 0;
}

.close-btn {
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  color: #666;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.2);
}

.profile-content {
  padding: 24px;
}

.profile-info {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2d8659 0%, #4a9d6f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 40px;
}

.upload-avatar-btn {
  padding: 6px 12px;
  background: rgba(45, 134, 89, 0.08);
  border: 1px solid rgba(45, 134, 89, 0.3);
  border-radius: 6px;
  font-size: 12px;
  color: #2d8659;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-avatar-btn:hover {
  background: rgba(45, 134, 89, 0.15);
  border-color: rgba(45, 134, 89, 0.5);
}

.user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #222222;
  margin: 0 0 8px 0;
}

.user-email,
.user-phone {
  font-size: 13px;
  color: #666;
  margin: 4px 0;
  line-height: 1.5;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.setting-item {
  padding: 14px 16px;
  background: rgba(45, 134, 89, 0.06);
  border: 1px solid rgba(45, 134, 89, 0.15);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #222222;
  transition: all 0.2s;
}

.setting-item:hover {
  background: rgba(45, 134, 89, 0.12);
  border-color: rgba(45, 134, 89, 0.3);
}

.arrow {
  color: #999;
  font-size: 16px;
}

.login-section {
  text-align: center;
  padding: 40px 20px;
}

.login-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.login-text {
  font-size: 16px;
  color: #666;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.login-subtitle {
  font-size: 13px;
  color: #999;
  margin: 0 0 24px 0;
}

.login-btn {
  width: 100%;
  padding: 12px 32px;
  background: linear-gradient(135deg, #2d8659 0%, #4a9d6f 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(45, 134, 89, 0.3);
}

.register-btn {
  width: 100%;
  padding: 12px 32px;
  background: #f0f9f0;
  border: 2px solid #2d8659;
  border-radius: 8px;
  color: #2d8659;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.register-btn:hover {
  background: #e8f5e9;
  transform: translateY(-2px);
}

.logout-btn {
  width: 100%;
  padding: 12px;
  background: #fef5f5;
  border: 1px solid rgba(224, 120, 86, 0.3);
  border-radius: 8px;
  color: #e07856;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #fef0f0;
  border-color: rgba(224, 120, 86, 0.5);
}

.logout-confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(45, 134, 89, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
  backdrop-filter: blur(2px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.logout-confirm-modal {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  padding: 48px 42px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(45, 134, 89, 0.2);
  border: 1px solid rgba(45, 134, 89, 0.1);
  animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  width: 90%;
  max-width: 420px;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

@keyframes slideUp {
  from {
    transform: scale(0.9) translateY(30px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.confirm-icon {
  font-size: 64px;
  margin-bottom: 24px;
  animation: iconBounce 0.6s ease;
}

@keyframes iconBounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.confirm-title {
  font-size: 22px;
  font-weight: 700;
  color: #2d8659;
  margin: 0 0 14px 0;
  letter-spacing: 0.5px;
}

.confirm-message {
  font-size: 15px;
  color: #666666;
  margin: 0 0 36px 0;
  line-height: 1.6;
}

.confirm-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-cancel-logout {
  flex: 1;
  padding: 12px 20px;
  background: rgba(45, 134, 89, 0.08);
  border: 1.5px solid rgba(45, 134, 89, 0.3);
  border-radius: 8px;
  color: #2d8659;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
}

.btn-cancel-logout:hover {
  background: rgba(45, 134, 89, 0.12);
  border-color: rgba(45, 134, 89, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(45, 134, 89, 0.15);
}

.btn-confirm-logout {
  flex: 1;
  padding: 12px 20px;
  background: linear-gradient(135deg, #2d8659 0%, #1e5a3a 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 15px rgba(45, 134, 89, 0.25);
}

.btn-confirm-logout:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(45, 134, 89, 0.35);
}

.btn-confirm-logout:active {
  transform: translateY(0);
}

.modal-overlay-inner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1002;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 300px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #222222;
}

.edit-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 20px;
  box-sizing: border-box;
}

.edit-input:focus {
  outline: none;
  border-color: #2d8659;
  box-shadow: 0 0 0 3px rgba(45, 134, 89, 0.1);
}

.modal-buttons {
  display: flex;
  gap: 12px;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: rgba(0, 0, 0, 0.05);
  color: #666;
}

.btn-cancel:hover {
  background: rgba(0, 0, 0, 0.1);
}

.btn-save {
  background: linear-gradient(135deg, #2d8659 0%, #4a9d6f 100%);
  color: white;
}

.btn-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(45, 134, 89, 0.3);
}
</style>
