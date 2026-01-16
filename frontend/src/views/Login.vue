<script setup>
import { ref, inject, computed, watch, onMounted } from 'vue'
import axios from '../api/axios'
import { useRouter } from 'vue-router'

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
  if (!value) return '' // Phone is optional
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

// Mark field as touched on blur
const handleBlur = (field) => {
  touched.value[field] = true
  if (field === 'username') errors.value.username = validateUsername(username.value)
  if (field === 'phone') errors.value.phone = validatePhone(phone.value)
  if (field === 'password') errors.value.password = validatePassword(password.value)
}

// Check if form is valid
const isFormValid = computed(() => {
  return !validateUsername(username.value) &&
         !validatePhone(phone.value) &&
         !validatePassword(password.value)
})

// Load saved credentials
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
  // Mark all fields as touched
  touched.value.username = true
  touched.value.phone = true
  touched.value.password = true

  // Validate all fields
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
      // Save credentials if remember me is checked
      if (rememberMe.value) {
        localStorage.setItem('justask_remember_username', username.value)
        localStorage.setItem('justask_remember_phone', phone.value)
        localStorage.setItem('justask_remember_me', 'true')
      } else {
        localStorage.removeItem('justask_remember_username')
        localStorage.removeItem('justask_remember_phone')
        localStorage.removeItem('justask_remember_me')
      }

      // Show success animation
      showSuccessAnimation.value = true
      showToast('歡迎回來！', 'success')

      // Navigate after animation
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

// Social login handlers (placeholders for future implementation)
const handleGoogleLogin = () => {
  showToast('Google 登入功能即將推出', 'info')
  // TODO: Implement Google OAuth
}

const handleFacebookLogin = () => {
  showToast('Facebook 登入功能即將推出', 'info')
  // TODO: Implement Facebook OAuth
}
</script>

<template>
  <div class="login-container">
    <!-- Hero Section with Gradient -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="logo-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <h1 class="hero-title">歡迎回來</h1>
        <p class="hero-subtitle">登入 吾識JustAsk 繼續您的學習之旅</p>
      </div>

      <!-- Decorative Elements -->
      <div class="deco-circle deco-1"></div>
      <div class="deco-circle deco-2"></div>
    </div>

    <!-- Login Form Section -->
    <div class="form-section">
      <form @submit.prevent="handleLogin" class="login-form">
        <!-- Username Input -->
        <div class="form-group">
          <label for="username" class="form-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>用戶名</span>
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="form-input"
            :class="{ 'error': touched.username && errors.username, 'valid': touched.username && !errors.username && username }"
            placeholder="請輸入您的用戶名"
            aria-label="用戶名"
            autocomplete="username"
            required
            @blur="handleBlur('username')"
          />
          <transition name="error-fade">
            <div v-if="touched.username && errors.username" class="error-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {{ errors.username }}
            </div>
          </transition>
        </div>

        <!-- Phone Input -->
        <div class="form-group">
          <label for="phone" class="form-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <span>手機號碼 (選填)</span>
          </label>
          <input
            id="phone"
            v-model="phone"
            type="tel"
            class="form-input"
            :class="{ 'error': touched.phone && errors.phone, 'valid': touched.phone && !errors.phone && phone }"
            placeholder="請輸入手機號碼"
            aria-label="手機號碼"
            autocomplete="tel"
            @blur="handleBlur('phone')"
          />
          <transition name="error-fade">
            <div v-if="touched.phone && errors.phone" class="error-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {{ errors.phone }}
            </div>
          </transition>
        </div>

        <!-- Password Input -->
        <div class="form-group">
          <label for="password" class="form-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>密碼</span>
          </label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="password"
              :type="isPasswordVisible ? 'text' : 'password'"
              class="form-input"
              :class="{ 'error': touched.password && errors.password, 'valid': touched.password && !errors.password && password }"
              placeholder="請輸入您的密碼"
              aria-label="密碼"
              autocomplete="current-password"
              required
              @blur="handleBlur('password')"
            />
            <button
              type="button"
              class="password-toggle"
              @click="isPasswordVisible = !isPasswordVisible"
              :aria-label="isPasswordVisible ? '隱藏密碼' : '顯示密碼'"
              tabindex="-1"
            >
              <svg v-if="!isPasswordVisible" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
          <transition name="error-fade">
            <div v-if="touched.password && errors.password" class="error-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {{ errors.password }}
            </div>
          </transition>
        </div>

        <!-- Remember Me & Forgot Password Row -->
        <div class="form-options">
          <label class="remember-checkbox">
            <input
              type="checkbox"
              v-model="rememberMe"
              class="checkbox-input"
            />
            <span class="checkbox-label">記住我</span>
          </label>
          <router-link to="/forgot-password" class="forgot-link">
            忘記密碼？
          </router-link>
        </div>

        <!-- Login Button -->
        <button
          type="submit"
          class="login-btn"
          :disabled="isLoading || !isFormValid"
          :class="{ 'loading': isLoading }"
          aria-live="polite"
        >
          <span v-if="!isLoading">立即登入</span>
          <span v-else class="loading-content">
            <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="2" x2="12" y2="6"></line>
              <line x1="12" y1="18" x2="12" y2="22"></line>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
              <line x1="2" y1="12" x2="6" y2="12"></line>
              <line x1="18" y1="12" x2="22" y2="12"></line>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
            登入中...
          </span>
        </button>

        <!-- Divider -->
        <div class="divider">
          <span class="divider-text">或使用以下方式登入</span>
        </div>

        <!-- Social Login Buttons -->
        <div class="social-login">
          <button
            type="button"
            class="social-btn google-btn"
            @click="handleGoogleLogin"
            aria-label="使用 Google 登入"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            class="social-btn facebook-btn"
            @click="handleFacebookLogin"
            aria-label="使用 Facebook 登入"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Facebook</span>
          </button>
        </div>

        <!-- Register Link -->
        <div class="register-prompt">
          <span class="prompt-text">還沒有帳號？</span>
          <router-link to="/register" class="register-link">立即註冊</router-link>
        </div>
      </form>
    </div>

    <!-- Success Animation Overlay -->
    <transition name="success-overlay">
      <div v-if="showSuccessAnimation" class="success-overlay">
        <div class="success-content">
          <div class="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2 class="success-title">登入成功！</h2>
          <p class="success-message">正在為您跳轉...</p>
        </div>
        <div class="confetti">
          <div class="confetti-piece" v-for="i in 20" :key="i" :style="{ '--i': i }"></div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* ============================================
   LAYOUT & CONTAINER
   ============================================ */
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-body);
}

/* ============================================
   HERO SECTION (Top Visual Area)
   ============================================ */
.hero-section {
  position: relative;
  background: var(--primary-gradient);
  padding: 3.5rem 2rem 4rem;
  overflow: hidden;
  border-bottom-left-radius: 2rem;
  border-bottom-right-radius: 2rem;
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.25);
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  animation: fadeInDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.logo-badge {
  width: 4.5rem;
  height: 4.5rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  color: var(--primary-color);
  animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s backwards;
}

.hero-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: white;
  margin-bottom: 0.75rem;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.hero-subtitle {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
  line-height: 1.6;
}

/* Decorative Circles */
.deco-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  z-index: 1;
  animation: float 6s ease-in-out infinite;
}

.deco-1 {
  width: 200px;
  height: 200px;
  top: -80px;
  right: -60px;
  animation-delay: 0s;
}

.deco-2 {
  width: 140px;
  height: 140px;
  bottom: -40px;
  left: -30px;
  animation-delay: 1s;
}

/* ============================================
   FORM SECTION
   ============================================ */
.form-section {
  flex: 1;
  padding: 2.5rem 2rem 3rem;
  background: var(--bg-body);
}

.login-form {
  max-width: 26rem;
  margin: 0 auto;
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s backwards;
}

/* ============================================
   FORM INPUTS
   ============================================ */
.form-group {
  margin-bottom: 1.75rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.625rem;
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-secondary);
}

.form-label svg {
  color: var(--primary-color);
  flex-shrink: 0;
}

.form-input {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.0625rem;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-main);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  min-height: 3.25rem;
}

.form-input::placeholder {
  color: var(--text-muted);
  font-weight: 400;
}

.form-input:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.15);
  background: white;
  transform: translateY(-1px);
}

.form-input:hover:not(:focus) {
  border-color: #fbbf24;
}

/* Input Validation States */
.form-input.error {
  border-color: var(--error-color);
  background: #fef2f2;
}

.form-input.error:focus {
  border-color: var(--error-color);
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
}

.form-input.valid {
  border-color: var(--success-color);
  background: #f0fdf4;
}

.form-input.valid:focus {
  border-color: var(--success-color);
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15);
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
  color: var(--error-color);
  font-size: 0.9375rem;
  font-weight: 500;
}

.error-message svg {
  flex-shrink: 0;
}

/* Password Input Wrapper */
.input-wrapper {
  position: relative;
}

.input-wrapper .form-input {
  padding-right: 3.5rem;
}

.password-toggle {
  position: absolute;
  right: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  padding: 0.625rem;
  cursor: pointer;
  color: var(--text-muted);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.password-toggle:hover {
  color: var(--primary-color);
  background: var(--primary-light);
}

.password-toggle:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
  color: var(--primary-color);
}

/* ============================================
   FORM OPTIONS (Remember Me & Forgot Password)
   ============================================ */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

/* Remember Me Checkbox */
.remember-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  accent-color: var(--primary-color);
  border-radius: 0.25rem;
}

.checkbox-label {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
}

.remember-checkbox:hover .checkbox-label {
  color: var(--primary-color);
}

/* Forgot Password Link */
.forgot-link {
  color: var(--primary-color);
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  display: inline-block;
}

.forgot-link:hover {
  color: var(--primary-hover);
  text-decoration: underline;
  transform: translateX(2px);
}

.forgot-link:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 4px;
  border-radius: 4px;
}

/* ============================================
   LOGIN BUTTON
   ============================================ */
.login-btn {
  width: 100%;
  padding: 1.125rem 2rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
  background: var(--primary-gradient);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.35);
  min-height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  letter-spacing: 0.3px;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.45);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
}

.login-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.3), 0 4px 12px rgba(249, 115, 22, 0.35);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.login-btn.loading {
  position: relative;
}

.loading-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
}

.spinner {
  animation: spin 1s linear infinite;
}

/* ============================================
   DIVIDER
   ============================================ */
.divider {
  position: relative;
  text-align: center;
  margin: 2rem 0 1.5rem;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--border-color);
}

.divider-text {
  position: relative;
  background: var(--bg-body);
  padding: 0 1rem;
  font-size: 0.9375rem;
  color: var(--text-muted);
  font-weight: 500;
}

/* ============================================
   SOCIAL LOGIN BUTTONS
   ============================================ */
.social-login {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.social-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  background: white;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 3rem;
}

.social-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: transparent;
}

.social-btn:active {
  transform: translateY(0);
}

.social-btn:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.google-btn {
  color: #4285F4;
}

.google-btn:hover {
  background: #4285F4;
  color: white;
}

.google-btn:hover svg path {
  fill: white;
}

.facebook-btn {
  color: #1877F2;
}

.facebook-btn:hover {
  background: #1877F2;
  color: white;
}

/* ============================================
   REGISTER PROMPT
   ============================================ */
.register-prompt {
  margin-top: 2rem;
  text-align: center;
  font-size: 1.0625rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.prompt-text {
  color: var(--text-muted);
  font-weight: 500;
}

.register-link {
  color: var(--primary-color);
  font-weight: 700;
  text-decoration: none;
  margin-left: 0.5rem;
  transition: all 0.2s;
  display: inline-block;
}

.register-link:hover {
  color: var(--primary-hover);
  text-decoration: underline;
  transform: translateX(2px);
}

.register-link:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 4px;
  border-radius: 4px;
}

/* ============================================
   SUCCESS ANIMATION OVERLAY
   ============================================ */
.success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(249, 115, 22, 0.95);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: overlayFadeIn 0.4s ease;
}

.success-content {
  text-align: center;
  position: relative;
  z-index: 2;
  animation: successPopIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.success-icon {
  width: 6rem;
  height: 6rem;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: var(--success-color);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: checkmarkDraw 0.8s ease 0.2s backwards;
}

.success-icon svg {
  animation: checkmarkStroke 0.6s ease 0.4s backwards;
}

.success-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: white;
  margin-bottom: 0.75rem;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

.success-message {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
}

/* Confetti Animation */
.confetti {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.confetti-piece {
  position: absolute;
  width: 0.625rem;
  height: 1.25rem;
  background: white;
  top: -10%;
  opacity: 0;
  animation: confettiFall 2.5s ease-out calc(var(--i) * 0.1s) forwards;
}

.confetti-piece:nth-child(odd) {
  background: #fbbf24;
}

.confetti-piece:nth-child(3n) {
  background: #22c55e;
}

.confetti-piece:nth-child(4n) {
  background: #60a5fa;
}

.confetti-piece:nth-child(1) { left: 5%; }
.confetti-piece:nth-child(2) { left: 10%; }
.confetti-piece:nth-child(3) { left: 15%; }
.confetti-piece:nth-child(4) { left: 20%; }
.confetti-piece:nth-child(5) { left: 25%; }
.confetti-piece:nth-child(6) { left: 30%; }
.confetti-piece:nth-child(7) { left: 35%; }
.confetti-piece:nth-child(8) { left: 40%; }
.confetti-piece:nth-child(9) { left: 45%; }
.confetti-piece:nth-child(10) { left: 50%; }
.confetti-piece:nth-child(11) { left: 55%; }
.confetti-piece:nth-child(12) { left: 60%; }
.confetti-piece:nth-child(13) { left: 65%; }
.confetti-piece:nth-child(14) { left: 70%; }
.confetti-piece:nth-child(15) { left: 75%; }
.confetti-piece:nth-child(16) { left: 80%; }
.confetti-piece:nth-child(17) { left: 85%; }
.confetti-piece:nth-child(18) { left: 90%; }
.confetti-piece:nth-child(19) { left: 95%; }
.confetti-piece:nth-child(20) { left: 100%; }

/* Success Overlay Transition */
.success-overlay-enter-active {
  animation: overlayFadeIn 0.4s ease;
}

.success-overlay-leave-active {
  animation: overlayFadeOut 0.3s ease;
}

/* Error Fade Transition */
.error-fade-enter-active,
.error-fade-leave-active {
  transition: all 0.3s ease;
}

.error-fade-enter-from {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.error-fade-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

/* ============================================
   ANIMATIONS
   ============================================ */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes overlayFadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes successPopIn {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes checkmarkDraw {
  from {
    opacity: 0;
    transform: scale(0.3) rotate(-45deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes checkmarkStroke {
  from {
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
  }
  to {
    stroke-dasharray: 100;
    stroke-dashoffset: 0;
  }
}

@keyframes confettiFall {
  0% {
    opacity: 1;
    transform: translateY(0) rotateZ(0deg);
  }
  100% {
    opacity: 0;
    transform: translateY(100vh) rotateZ(720deg);
  }
}

/* ============================================
   RESPONSIVE DESIGN
   ============================================ */
@media (max-width: 400px) {
  .hero-section {
    padding: 3rem 1.5rem 3.5rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .form-section {
    padding: 2rem 1.5rem;
  }

  .logo-badge {
    width: 4rem;
    height: 4rem;
  }

  .login-btn {
    font-size: 1.0625rem;
    padding: 1rem 1.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>