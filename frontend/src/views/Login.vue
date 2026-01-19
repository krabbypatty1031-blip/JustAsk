<script setup>
import { ref, inject, computed, watch, onMounted } from 'vue'
import axios from '../api/axios'
import { useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'

const router = useRouter()
const showToast = inject('showToast')
const isLoading = ref(false)
const showSuccessAnimation = ref(false)

const username = ref('')
const phone = ref('')
const password = ref('')
const rememberMe = ref(false)
const isPasswordVisible = ref(false)

// Validation states
const touched = ref({
  username: false,
  phone: false,
  password: false
})

const errors = ref({
  username: '',
  phone: '',
  password: ''
})

// Validation rules
const validateUsername = (value) => {
  if (!value) return '請輸入用戶名'
  if (value.length < 2) return '用戶名至少需要2個字符'
  if (value.length > 20) return '用戶名不能超過20個字符'
  return ''
}

const validatePhone = (value) => {
  if (!value) return ''
  if (!/^\d{8}$/.test(value)) return '手機號碼必須是8位數字'
  return ''
}

const validatePassword = (value) => {
  if (!value) return '請輸入密碼'
  if (value.length < 6) return '密碼至少需要6個字符'
  if (value.length > 50) return '密碼不能超過50個字符'
  return ''
}

// Real-time validation
watch(username, (value) => {
  if (touched.value.username) {
    errors.value.username = validateUsername(value)
  }
})

watch(phone, (value) => {
  if (touched.value.phone) {
    errors.value.phone = validatePhone(value)
  }
})

watch(password, (value) => {
  if (touched.value.password) {
    errors.value.password = validatePassword(value)
  }
})

const handleBlur = (field) => {
  touched.value[field] = true
  if (field === 'username') errors.value.username = validateUsername(username.value)
  if (field === 'phone') errors.value.phone = validatePhone(phone.value)
  if (field === 'password') errors.value.password = validatePassword(password.value)
}

const isFormValid = computed(() => {
  return !validateUsername(username.value) &&
         !validatePhone(phone.value) &&
         !validatePassword(password.value)
})

onMounted(() => {
  const savedUsername = localStorage.getItem('justask_remember_username')
  const savedPhone = localStorage.getItem('justask_remember_phone')
  const savedRemember = localStorage.getItem('justask_remember_me')

  if (savedRemember === 'true') {
    rememberMe.value = true
    if (savedUsername) username.value = savedUsername
    if (savedPhone) phone.value = savedPhone
  }
})

const handleLogin = async () => {
  touched.value.username = true
  touched.value.phone = true
  touched.value.password = true

  errors.value.username = validateUsername(username.value)
  errors.value.phone = validatePhone(phone.value)
  errors.value.password = validatePassword(password.value)

  if (!isFormValid.value) {
    showToast('請檢查輸入內容', 'error')
    return
  }

  isLoading.value = true
  try {
    const response = await axios.post('/users/login', {
      username: username.value,
      phone: phone.value,
      password: password.value
    })

    if (response.data.success) {
      if (rememberMe.value) {
        localStorage.setItem('justask_remember_username', username.value)
        localStorage.setItem('justask_remember_phone', phone.value)
        localStorage.setItem('justask_remember_me', 'true')
      } else {
        localStorage.removeItem('justask_remember_username')
        localStorage.removeItem('justask_remember_phone')
        localStorage.removeItem('justask_remember_me')
      }

      showSuccessAnimation.value = true
      showToast('歡迎回來！', 'success')

      setTimeout(() => {
        router.push('/')
      }, 800)
    }
  } catch (err) {
    showToast('登入失敗，請檢查帳號密碼', 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="neu-container">
    <!-- Header Section -->
    <div class="neu-header">
      <div class="neu-logo">
        <Icon name="question-mark-circle" :size="32" />
      </div>
      <h1 class="neu-title">歡迎回來</h1>
      <p class="neu-subtitle">登入 吾識JustAsk 繼續您的學習之旅</p>
    </div>

    <!-- Form Card -->
    <div class="neu-card">
      <form @submit.prevent="handleLogin" class="neu-form">
        <!-- Username Input -->
        <div class="neu-field">
          <label for="username" class="neu-label">
            <Icon name="user" :size="16" class="neu-label-icon" />
            用戶名
          </label>
          <div class="neu-input-wrapper" :class="{ 'neu-input-error': touched.username && errors.username, 'neu-input-valid': touched.username && !errors.username && username }">
            <input
              id="username"
              v-model="username"
              type="text"
              class="neu-input"
              placeholder="請輸入您的用戶名"
              autocomplete="username"
              required
              @blur="handleBlur('username')"
            />
          </div>
          <transition name="error-slide">
            <p v-if="touched.username && errors.username" class="neu-error" role="alert">
              <Icon name="exclamation-circle" :size="14" />
              {{ errors.username }}
            </p>
          </transition>
        </div>

        <!-- Phone Input -->
        <div class="neu-field">
          <label for="phone" class="neu-label">
            <Icon name="bell" :size="16" class="neu-label-icon" />
            手機號碼 (選填)
          </label>
          <div class="neu-input-wrapper" :class="{ 'neu-input-error': touched.phone && errors.phone, 'neu-input-valid': touched.phone && !errors.phone && phone }">
            <input
              id="phone"
              v-model="phone"
              type="tel"
              inputmode="numeric"
              class="neu-input"
              placeholder="請輸入手機號碼"
              autocomplete="tel"
              @blur="handleBlur('phone')"
            />
          </div>
          <transition name="error-slide">
            <p v-if="touched.phone && errors.phone" class="neu-error" role="alert">
              <Icon name="exclamation-circle" :size="14" />
              {{ errors.phone }}
            </p>
          </transition>
        </div>

        <!-- Password Input -->
        <div class="neu-field">
          <label for="password" class="neu-label">
            <Icon name="eye" :size="16" class="neu-label-icon" />
            密碼
          </label>
          <div class="neu-input-wrapper neu-input-password" :class="{ 'neu-input-error': touched.password && errors.password, 'neu-input-valid': touched.password && !errors.password && password }">
            <input
              id="password"
              v-model="password"
              :type="isPasswordVisible ? 'text' : 'password'"
              class="neu-input"
              placeholder="請輸入您的密碼"
              autocomplete="current-password"
              required
              @blur="handleBlur('password')"
            />
            <button
              type="button"
              class="neu-toggle"
              @click="isPasswordVisible = !isPasswordVisible"
              :aria-label="isPasswordVisible ? '隱藏密碼' : '顯示密碼'"
            >
              <Icon :name="isPasswordVisible ? 'eye-slash' : 'eye'" :size="20" />
            </button>
          </div>
          <transition name="error-slide">
            <p v-if="touched.password && errors.password" class="neu-error" role="alert">
              <Icon name="exclamation-circle" :size="14" />
              {{ errors.password }}
            </p>
          </transition>
        </div>

        <!-- Remember Me & Forgot Password -->
        <div class="neu-options">
          <label class="neu-checkbox">
            <input type="checkbox" v-model="rememberMe" class="neu-checkbox-input" />
            <span class="neu-checkbox-box">
              <Icon v-if="rememberMe" name="check" :size="14" />
            </span>
            <span class="neu-checkbox-label">記住我</span>
          </label>
          <router-link to="/forgot-password" class="neu-link">忘記密碼？</router-link>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="neu-button"
          :disabled="isLoading || !isFormValid"
          :class="{ 'neu-button-loading': isLoading, 'neu-button-disabled': !isFormValid }"
        >
          <span v-if="!isLoading" class="neu-button-text">立即登入</span>
          <span v-else class="neu-button-loading-content">
            <span class="neu-spinner"></span>
            登入中...
          </span>
        </button>

        <!-- Divider -->
        <div class="neu-divider">
          <span class="neu-divider-text">或使用以下方式登入</span>
        </div>

        <!-- Social Login -->
        <div class="neu-social">
          <button type="button" class="neu-social-btn" aria-label="使用 Google 登入">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Google</span>
          </button>
          <button type="button" class="neu-social-btn neu-social-fb" aria-label="使用 Facebook 登入">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Facebook</span>
          </button>
        </div>

        <!-- Register Link -->
        <div class="neu-footer">
          <span class="neu-footer-text">還沒有帳號？</span>
          <router-link to="/register" class="neu-footer-link">立即註冊</router-link>
        </div>
      </form>
    </div>

    <!-- Success Animation -->
    <transition name="success-fade">
      <div v-if="showSuccessAnimation" class="neu-success-overlay">
        <div class="neu-success-card">
          <div class="neu-success-icon">
            <Icon name="check" :size="48" />
          </div>
          <h2 class="neu-success-title">登入成功！</h2>
          <p class="neu-success-text">正在為您跳轉...</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* ============================================
   NEUMORPHISM LOGIN PAGE
   ============================================ */
.neu-container {
  min-height: 100vh;
  background: var(--neu-bg);
  padding: 2rem 1.5rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Header */
.neu-header {
  text-align: center;
  margin-bottom: 2rem;
  animation: fadeInDown 0.6s ease-out;
}

.neu-logo {
  width: 5rem;
  height: 5rem;
  background: var(--neu-bg);
  border-radius: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: var(--neu-primary);
  box-shadow: var(--neu-shadow-out);
  transition: all 0.3s ease;
}

.neu-logo:hover {
  transform: translateY(-2px);
}

.neu-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--neu-text);
  margin-bottom: 0.5rem;
  letter-spacing: -0.5px;
}

.neu-subtitle {
  font-size: 1rem;
  color: var(--neu-text-muted);
  font-weight: 500;
}

/* Card */
.neu-card {
  width: 100%;
  max-width: 24rem;
  background: var(--neu-bg);
  border-radius: 2rem;
  padding: 2rem;
  box-shadow: var(--neu-shadow-out);
  animation: fadeInUp 0.6s ease-out 0.1s backwards;
}

.neu-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Fields */
.neu-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.neu-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--neu-text);
  padding-left: 0.25rem;
}

.neu-label-icon {
  color: var(--neu-primary);
}

/* Input */
.neu-input-wrapper {
  background: var(--neu-bg);
  border-radius: 1rem;
  box-shadow: var(--neu-shadow-in);
  transition: all 0.3s ease;
  position: relative;
}

.neu-input-wrapper:focus-within {
  box-shadow: var(--neu-shadow-in-deep), 0 0 0 3px rgba(20, 184, 166, 0.15);
}

.neu-input-wrapper.neu-input-error {
  box-shadow: var(--neu-shadow-in), 0 0 0 2px rgba(239, 68, 68, 0.3);
}

.neu-input-wrapper.neu-input-valid {
  box-shadow: var(--neu-shadow-in), 0 0 0 2px rgba(16, 185, 129, 0.3);
}

.neu-input {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1rem;
  font-weight: 500;
  background: transparent;
  border: none;
  color: var(--neu-text);
  outline: none;
}

.neu-input::placeholder {
  color: var(--neu-text-light);
  font-weight: 400;
}

.neu-input-password .neu-input {
  padding-right: 3.5rem;
}

/* Toggle */
.neu-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 2.5rem;
  height: 2.5rem;
  background: var(--neu-bg);
  border: none;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--neu-text-muted);
  cursor: pointer;
  box-shadow: var(--neu-shadow-out-sm);
  transition: all 0.2s ease;
}

.neu-toggle:hover {
  color: var(--neu-primary);
  transform: translateY(-50%) scale(1.05);
}

.neu-toggle:active {
  box-shadow: var(--neu-shadow-in);
  transform: translateY(-50%) scale(0.98);
}

/* Error */
.neu-error {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--neu-error);
  padding-left: 0.25rem;
}

/* Options Row */
.neu-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Checkbox */
.neu-checkbox {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  cursor: pointer;
  user-select: none;
}

.neu-checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.neu-checkbox-box {
  width: 1.375rem;
  height: 1.375rem;
  min-width: 1.375rem;
  background: var(--neu-bg);
  border-radius: 0.5rem;
  box-shadow: var(--neu-shadow-in);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--neu-primary);
  transition: all 0.2s ease;
}

.neu-checkbox-input:checked + .neu-checkbox-box {
  background: var(--neu-primary);
  color: white;
  box-shadow: var(--neu-shadow-out-sm);
}

.neu-checkbox-label {
  font-size: 0.9375rem;
  color: var(--neu-text-muted);
  font-weight: 500;
}

/* Link */
.neu-link {
  color: var(--neu-primary);
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.neu-link:hover {
  color: var(--neu-primary-dark);
}

/* Button */
.neu-button {
  width: 100%;
  padding: 1.125rem 2rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-dark) 100%);
  border: none;
  border-radius: 3rem;
  cursor: pointer;
  box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.15),
              -4px -4px 10px rgba(255, 255, 255, 0.7),
              inset 0 -2px 6px rgba(0, 0, 0, 0.1),
              inset 0 2px 6px rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
}

.neu-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.neu-button:hover:not(:disabled)::before {
  left: 100%;
}

.neu-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.18),
              -6px -6px 14px rgba(255, 255, 255, 0.8);
}

.neu-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.12),
              -2px -2px 6px rgba(255, 255, 255, 0.6),
              inset 2px 2px 4px rgba(0, 0, 0, 0.15);
}

.neu-button-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.neu-button-loading-content {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.neu-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Divider */
.neu-divider {
  position: relative;
  text-align: center;
}

.neu-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--neu-bg-dark);
  box-shadow: var(--neu-shadow-in);
}

.neu-divider-text {
  position: relative;
  background: var(--neu-bg);
  padding: 0 1rem;
  font-size: 0.875rem;
  color: var(--neu-text-light);
  font-weight: 500;
}

/* Social */
.neu-social {
  display: flex;
  gap: 1rem;
}

.neu-social-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  background: var(--neu-bg);
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  box-shadow: var(--neu-shadow-out-sm);
  transition: all 0.2s ease;
  color: var(--neu-text);
}

.neu-social-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--neu-shadow-out);
}

.neu-social-btn:active {
  transform: translateY(0);
  box-shadow: var(--neu-shadow-in);
}

.neu-social-fb {
  color: #1877F2;
}

/* Footer */
.neu-footer {
  text-align: center;
  padding-top: 0.5rem;
}

.neu-footer-text {
  color: var(--neu-text-muted);
  font-weight: 500;
}

.neu-footer-link {
  color: var(--neu-primary);
  font-weight: 700;
  text-decoration: none;
  margin-left: 0.375rem;
  transition: all 0.2s ease;
}

.neu-footer-link:hover {
  color: var(--neu-primary-dark);
}

/* Success Overlay */
.neu-success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(239, 238, 238, 0.95);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.neu-success-card {
  background: var(--neu-bg);
  border-radius: 2rem;
  padding: 3rem 2.5rem;
  text-align: center;
  box-shadow: var(--neu-shadow-out);
  animation: successPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.neu-success-icon {
  width: 6rem;
  height: 6rem;
  background: linear-gradient(135deg, var(--neu-success) 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: white;
  box-shadow: var(--neu-shadow-out);
}

.neu-success-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--neu-text);
  margin-bottom: 0.5rem;
}

.neu-success-text {
  font-size: 1rem;
  color: var(--neu-text-muted);
  font-weight: 500;
}

/* Transitions */
.error-slide-enter-active,
.error-slide-leave-active {
  transition: all 0.25s ease;
}

.error-slide-enter-from,
.error-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.success-fade-enter-active {
  animation: fadeIn 0.3s ease;
}

.success-fade-leave-active {
  animation: fadeOut 0.3s ease;
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Responsive */
@media (max-width: 400px) {
  .neu-container {
    padding: 1.5rem 1rem 2.5rem;
  }

  .neu-card {
    padding: 1.5rem;
    border-radius: 1.5rem;
  }

  .neu-title {
    font-size: 1.75rem;
  }

  .neu-logo {
    width: 4rem;
    height: 4rem;
  }

  .neu-button {
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
