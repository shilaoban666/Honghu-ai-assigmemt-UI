<template>
  <div class="forgot-container">
    <!-- 森林背景装饰 -->
    <div class="forest-bg">
      <div class="tree tree-1"></div>
      <div class="tree tree-2"></div>
      <div class="leaf leaf-1"></div>
      <div class="leaf leaf-2"></div>
    </div>

    <!-- 主卡片 -->
    <div class="forgot-card">
      <!-- 返回按钮 -->
      <button class="back-btn" @click="$emit('back')" title="Back">
        <span>←</span> Back
      </button>

      <!-- 卡片头部 -->
      <div class="card-header">
        <div class="icon">🔐</div>
        <h1 class="title">Reset Password</h1>
        <p class="subtitle">Enter your email, we'll send you a reset link</p>
      </div>

      <!-- 表单区域 -->
      <div class="form-area">
        <!-- 邮箱输入 -->
        <div class="input-group">
          <label class="input-label">
            <span class="label-icon">📧</span>
            Email Address
          </label>
          <input 
            v-model="form.email" 
            type="email" 
            class="input-field"
            placeholder="Enter your registered email"
            @keyup.enter="handleSendReset"
          />
        </div>

        <!-- 提示信息 -->
        <div v-if="successMessage" class="success-message">
          ✅ {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="error-message">
          ⚠️ {{ errorMessage }}
        </div>

        <!-- 按钮组 -->
        <div class="button-group">
          <button @click="handleSendReset" class="send-btn" :disabled="isLoading">
            <span v-if="!isLoading">📨 Send Reset Link</span>
            <span v-else>Sending...</span>
          </button>
        </div>

        <!-- 提示文本 -->
        <p class="help-text">
          Check your email spam folder, reset link will expire in 10 minutes
        </p>
      </div>

      <!-- 底部链接 -->
      <div class="card-footer">
        <a href="#" class="footer-link" @click.prevent="$emit('back')">Back to Login</a>
        <span class="footer-divider">·</span>
        <a href="#" class="footer-link" @click.prevent="$emit('to-register')">No account? Sign up</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineEmits(['back', 'to-register'])

const form = ref({
  email: ''
})

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleSendReset = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!form.value.email.trim()) {
    errorMessage.value = 'Please enter email address'
    return
  }

  if (!form.value.email.includes('@')) {
    errorMessage.value = 'Please enter a valid email address'
    return
  }

  isLoading.value = true

  setTimeout(() => {
    isLoading.value = false
    successMessage.value = 'Reset link sent to your email. Please check and click the link to reset your password'
    form.value.email = ''
  }, 1000)
}
</script>

<style scoped>
.forgot-container {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f9f0 0%, #e8f5e9 100%);
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.forest-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.tree {
  position: absolute;
  opacity: 0.1;
}

.tree-1 {
  width: 80px;
  height: 120px;
  background: linear-gradient(to bottom, #2d8659 0%, #1e5a3a 100%);
  border-radius: 50% 50% 0 0;
  top: 10%;
  left: 5%;
}

.tree-2 {
  width: 100px;
  height: 150px;
  background: linear-gradient(to bottom, #3da366 0%, #2d8659 100%);
  border-radius: 50% 50% 0 0;
  top: 15%;
  right: 8%;
}

.leaf {
  position: absolute;
  opacity: 0.1;
  animation: float 3s ease-in-out infinite;
}

.leaf::before {
  content: '🍃';
  font-size: 24px;
}

.leaf-1 {
  top: 20%;
  right: 20%;
}

.leaf-2 {
  bottom: 30%;
  left: 15%;
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.forgot-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(45, 134, 89, 0.15);
  border: 2px solid rgba(45, 134, 89, 0.1);
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #66bb6a;
  font-size: 14px;
  font-weight: 600;
  transition: color 0.3s ease;
}

.back-btn:hover {
  color: #2d8659;
}

.card-header {
  text-align: center;
  margin-bottom: 30px;
  margin-top: 20px;
}

.icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #2d8659;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: #66bb6a;
  margin: 0;
  font-weight: 500;
}

.form-area {
  margin: 30px 0;
}

.input-group {
  margin-bottom: 20px;
}

.input-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #2d8659;
  margin-bottom: 8px;
}

.label-icon {
  margin-right: 6px;
  font-size: 18px;
}

.input-field {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid #c8e6c9;
  border-radius: 10px;
  font-size: 14px;
  color: #2d8659;
  background: #f5f9f7;
  transition: all 0.3s ease;
  outline: none;
}

.input-field:focus {
  border-color: #66bb6a;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(102, 187, 106, 0.1);
}

.input-field::placeholder {
  color: #a5d6a7;
}

.success-message {
  margin: 16px 0;
  padding: 12px 14px;
  background: #e8f5e9;
  border: 1px solid #81c784;
  border-radius: 8px;
  color: #2e7d32;
  font-size: 13px;
  text-align: center;
  animation: slideDown 0.3s ease;
}

.error-message {
  margin: 16px 0;
  padding: 12px 14px;
  background: #ffebee;
  border: 1px solid #ef9a9a;
  border-radius: 8px;
  color: #c62828;
  font-size: 13px;
  text-align: center;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.button-group {
  display: flex;
  gap: 12px;
  margin: 24px 0;
}

.send-btn {
  flex: 1;
  padding: 14px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #2d8659 0%, #1e5a3a 100%);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(45, 134, 89, 0.3);
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(45, 134, 89, 0.4);
}

.send-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.help-text {
  font-size: 12px;
  color: #999;
  text-align: center;
  margin-top: 12px;
}

.card-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e0f2e9;
  font-size: 13px;
}

.footer-link {
  color: #66bb6a;
  text-decoration: none;
  transition: color 0.3s ease;
  font-weight: 500;
  cursor: pointer;
}

.footer-link:hover {
  color: #2d8659;
  text-decoration: underline;
}

.footer-divider {
  color: #c8e6c9;
  margin: 0 8px;
}

@media (max-width: 480px) {
  .forgot-card {
    max-width: 90%;
    padding: 30px 20px;
  }

  .title {
    font-size: 24px;
  }

  .icon {
    font-size: 40px;
  }
}
</style>
