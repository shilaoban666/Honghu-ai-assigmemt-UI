<template>
  <div class="register-container">
    <!-- 森林背景装饰 -->
    <div class="forest-bg">
      <div class="tree tree-1"></div>
      <div class="tree tree-2"></div>
      <div class="leaf leaf-1"></div>
      <div class="leaf leaf-2"></div>
    </div>

    <!-- 主卡片 -->
    <div class="register-card">
      <!-- 返回按钮 -->
      <button class="back-btn" @click="$emit('back')" title="返回">
        <span>←</span> 返回
      </button>

      <!-- 卡片头部 -->
      <div class="card-header">
        <div class="icon">🌟</div>
        <h1 class="title">Create Account</h1>
        <p class="subtitle">Join Honghu AI, Start Your Smart Dialogue Journey</p>
      </div>

      <!-- 表单区域 -->
      <div class="form-area">
        <!-- 用户名 -->
        <div class="input-group">
          <label class="input-label">
            <span class="label-icon">👤</span>
            Username
          </label>
          <input 
            v-model="form.username" 
            type="text" 
            class="input-field"
            placeholder="Set your username (2-50 characters)"
            @keyup.enter="handleRegister"
          />
        </div>

        <!-- 手机号 必填 -->
        <div class="input-group required">
          <label class="input-label">
            <span class="label-icon">📱</span>
            Phone Number <span class="required-star">*</span>
          </label>
          <input 
            v-model="form.phone" 
            type="tel" 
            class="input-field"
            placeholder="Enter your phone number"
            @keyup.enter="handleRegister"
          />
        </div>

        <!-- 邮箱 可选 -->
        <div class="input-group">
          <label class="input-label">
            <span class="label-icon">📧</span>
            Email Address (Optional)
          </label>
          <input 
            v-model="form.email" 
            type="email" 
            class="input-field"
            placeholder="Enter your email address"
            @keyup.enter="handleRegister"
          />
        </div>

        <!-- 密码 -->
        <div class="input-group">
          <label class="input-label">
            <span class="label-icon">🔑</span>
            Password
          </label>
          <input 
            v-model="form.password" 
            type="password" 
            class="input-field"
            placeholder="At least 6 characters"
            @keyup.enter="handleRegister"
          />
        </div>

        <!-- 确认密码 -->
        <div class="input-group">
          <label class="input-label">
            <span class="label-icon">🔐</span>
            Confirm Password
          </label>
          <input 
            v-model="form.confirmPassword" 
            type="password" 
            class="input-field"
            placeholder="Enter password again"
            @keyup.enter="handleRegister"
          />
        </div>

        <!-- 同意协议 -->
        <div class="agree-group">
          <input 
            v-model="form.agree" 
            type="checkbox" 
            id="agree-checkbox"
            class="agree-checkbox"
          />
          <label for="agree-checkbox" class="agree-label">
            I agree to the <a href="#" class="agreement-link">Terms of Service</a> and <a href="#" class="agreement-link">Privacy Policy</a>
          </label>
        </div>

        <!-- 提示信息 -->
        <div v-if="successMessage" class="success-message">
          ✅ {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="error-message">
          ⚠️ {{ errorMessage }}
        </div>

        <!-- 注册按钮 -->
        <button @click="handleRegister" class="register-btn" :disabled="isLoading">
          <span v-if="!isLoading">🚀 Create Account</span>
          <span v-else>Creating...</span>
        </button>
      </div>

      <!-- 底部链接 -->
      <div class="card-footer">
        <span>Already have an account?</span>
        <a href="#" class="footer-link" @click.prevent="$emit('back')">Back to Login</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { registerUser, checkUsernameExists, checkPhoneExists, checkEmailExists } from '@/api/auth'

const emit = defineEmits(['back', 'register-success'])

const form = ref({
  username: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  agree: false
})

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleRegister = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // 验证用户名
  if (!form.value.username.trim()) {
    errorMessage.value = 'Please enter username'
    return
  }

  if (form.value.username.length < 2 || form.value.username.length > 50) {
    errorMessage.value = 'Username must be between 2-50 characters'
    return
  }

  // 验证手机号（必填）
  if (!form.value.phone.trim()) {
    errorMessage.value = 'Phone number is required'
    return
  }

  // 验证手机号格式（支持中国手机号）
  if (!/^1[3-9]\d{9}$/.test(form.value.phone)) {
    errorMessage.value = 'Please enter a valid phone number'
    return
  }

  // 验证邮箱（可选，但如果填写需要有效）
  if (form.value.email.trim() && !form.value.email.includes('@')) {
    errorMessage.value = 'Please enter a valid email address'
    return
  }

  // 验证密码
  if (form.value.password.length < 6 || form.value.password.length > 100) {
    errorMessage.value = 'Password must be between 6-100 characters'
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  if (!form.value.agree) {
    errorMessage.value = 'Please agree to the Terms of Service and Privacy Policy'
    return
  }

  isLoading.value = true

  try {
    // 调用注册API
    const response = await registerUser({
      username: form.value.username,
      password: form.value.password,
      phone: form.value.phone,
      email: form.value.email.trim() || undefined,
      nickname: form.value.username
    })

    successMessage.value = 'Registration successful! Redirecting to login...'
    
    setTimeout(() => {
      // 重置表单
      form.value = {
        username: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        agree: false
      }
      emit('register-success', {
        userId: response.userId,
        username: response.username,
        phone: response.phone,
        email: response.email
      })
    }, 1500)
  } catch (error) {
    console.error('注册错误:', error)
    errorMessage.value = error.message || '注册失败，请检查输入信息是否有效'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.register-container {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f9f0 0%, #e8f5e9 100%);
  overflow: auto;
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

.register-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  padding: 40px;
  margin: 20px;
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
  margin-bottom: 16px;
}

.input-group.required .input-label {
  border-bottom: 1px solid rgba(255, 107, 107, 0.3);
  padding-bottom: 4px;
}

.required-star {
  color: #ff6b6b;
  margin-left: 2px;
  font-weight: bold;
}

.input-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #2d8659;
  margin-bottom: 6px;
}

.label-icon {
  margin-right: 6px;
  font-size: 18px;
}

.input-field {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #c8e6c9;
  border-radius: 8px;
  font-size: 13px;
  color: #2d8659;
  background: #f5f9f7;
  transition: all 0.3s ease;
  outline: none;
  box-sizing: border-box;
}

.input-field:focus {
  border-color: #66bb6a;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(102, 187, 106, 0.1);
}

.input-field::placeholder {
  color: #a5d6a7;
}

.agree-group {
  display: flex;
  align-items: flex-start;
  margin: 16px 0 24px 0;
  gap: 8px;
}

.agree-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #66bb6a;
  flex-shrink: 0;
  margin-top: 2px;
}

.agree-label {
  font-size: 13px;
  color: #558b2f;
  cursor: pointer;
  user-select: none;
  line-height: 1.4;
}

.agreement-link {
  color: #66bb6a;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.agreement-link:hover {
  color: #2d8659;
  text-decoration: underline;
}

.success-message {
  margin: 12px 0;
  padding: 10px 12px;
  background: #e8f5e9;
  border: 1px solid #81c784;
  border-radius: 8px;
  color: #2e7d32;
  font-size: 12px;
  text-align: center;
  animation: slideDown 0.3s ease;
}

.error-message {
  margin: 12px 0;
  padding: 10px 12px;
  background: #ffebee;
  border: 1px solid #ef9a9a;
  border-radius: 8px;
  color: #c62828;
  font-size: 12px;
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

.register-btn {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #2d8659 0%, #1e5a3a 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(45, 134, 89, 0.3);
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(45, 134, 89, 0.4);
}

.register-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.card-footer {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #e0f2e9;
  font-size: 13px;
  color: #666;
}

.footer-link {
  color: #66bb6a;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
  cursor: pointer;
  margin-left: 4px;
}

.footer-link:hover {
  color: #2d8659;
  text-decoration: underline;
}

@media (max-width: 480px) {
  .register-card {
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
