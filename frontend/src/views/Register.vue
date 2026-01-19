<script setup>
import { ref, inject, computed, watch } from 'vue'
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
const confirmPassword = ref('')
const agreeToTerms = ref(false)
const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)

// Validation states
const touched = ref({
  username: false,
  phone: false,
  password: false,
  confirmPassword: false
})

const errors = ref({
  username: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

// Validation rules
const validateUsername = (value) => {
  if (!value) return '請輸入用戶名'
  if (value.length < 2) return '用戶名至少需要2個字符'
  if (value.length > 20) return '用戶名不能超過20個字符'
  return ''
}

const validatePhone = (value) => {
  if (!value) return '請輸入手機號碼'
  if (!/^\d{8}$/.test(value)) return '手機號碼必須是8位數字'
  return ''
}

const validatePassword = (value) => {
  if (!value) return '請輸入密碼'
  if (value.length < 6) return '密碼至少需要6個字符'
  if (value.length > 50) return '密碼不能超過50個字符'
  return ''
}

const validateConfirmPassword = (value) => {
  if (!value) return '請確認密碼'
  if (value !== password.value) return '兩次密碼不一致'
  return ''
}

// Password strength calculator
const passwordStrength = computed(() => {
  const pass = password.value
  if (!pass) return { level: 0, text: '', color: '' }

  let strength = 0
  if (pass.length >= 6) strength++
  if (pass.length >= 10) strength++
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++
  if (/\d/.test(pass)) strength++
  if (/[^a-zA-Z0-9]/.test(pass)) strength++

  if (strength <= 2) return { level: 1, text: '弱', color: '#ef4444' }
  if (strength <= 3) return { level: 2, text: '中等', color: '#f59e0b' }
  return { level: 3, text: '強', color: '#10b981' }
})

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
  if (touched.value.confirmPassword && confirmPassword.value) {
    errors.value.confirmPassword = validateConfirmPassword(confirmPassword.value)
  }
})

watch(confirmPassword, (value) => {
  if (touched.value.confirmPassword) {
    errors.value.confirmPassword = validateConfirmPassword(value)
  }
})

// Mark field as touched on blur
const handleBlur = (field) => {
  touched.value[field] = true
  if (field === 'username') errors.value.username = validateUsername(username.value)
  if (field === 'phone') errors.value.phone = validatePhone(phone.value)
  if (field === 'password') errors.value.password = validatePassword(password.value)
  if (field === 'confirmPassword') errors.value.confirmPassword = validateConfirmPassword(confirmPassword.value)
}

// Check if form is valid
const isFormValid = computed(() => {
  return !validateUsername(username.value) &&
         !validatePhone(phone.value) &&
         !validatePassword(password.value) &&
         !validateConfirmPassword(confirmPassword.value) &&
         agreeToTerms.value
})

const handleRegister = async () => {
  touched.value.username = true
  touched.value.phone = true
  touched.value.password = true
  touched.value.confirmPassword = true

  errors.value.username = validateUsername(username.value)
  errors.value.phone = validatePhone(phone.value)
  errors.value.password = validatePassword(password.value)
  errors.value.confirmPassword = validateConfirmPassword(confirmPassword.value)

  if (!agreeToTerms.value) {
    showToast('請同意服務條款和隱私政策', 'error')
    return
  }

  if (!isFormValid.value) {
    showToast('請檢查輸入內容', 'error')
    return
  }

  isLoading.value = true
  try {
    const response = await axios.post('/users/register', {
      username: username.value,
      phone: phone.value,
      password: password.value
    })

    if (response.data.success) {
      showSuccessAnimation.value = true
      showToast('註冊成功！', 'success')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    }
  } catch (err) {
    const message = err.response?.data?.message || '註冊失敗，請重試'
    showToast(message, 'error')
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
        <Icon name="user" :size="32" />
      </div>
      <h1 class="neu-title">建立帳號</h1>
      <p class="neu-subtitle">加入 吾識JustAsk 開始您的學習之旅</p>
    </div>

    <!-- Form Card -->
    <div class="neu-card">
      <form @submit.prevent="handleRegister" class="neu-form">
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
            手機號碼
          </label>
          <div class="neu-input-wrapper" :class="{ 'neu-input-error': touched.phone && errors.phone, 'neu-input-valid': touched.phone && !errors.phone && phone }">
            <input
              id="phone"
              v-model="phone"
              type="tel"
              inputmode="numeric"
              class="neu-input"
              placeholder="請輸入8位數字手機號碼"
              autocomplete="tel"
              required
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
              placeholder="請輸入密碼 (至少6位)"
              autocomplete="new-password"
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

          <!-- Password Strength Indicator -->
          <div v-if="password" class="neu-strength">
            <div class="neu-strength-bars">
              <div
                v-for="i in 3"
                :key="i"
                class="neu-strength-bar"
                :class="{ 'neu-strength-active': i <= passwordStrength.level }"
                :style="{ backgroundColor: i <= passwordStrength.level ? passwordStrength.color : '' }"
              ></div>
            </div>
            <span class="neu-strength-text" :style="{ color: passwordStrength.color }">
              密碼強度：{{ passwordStrength.text }}
            </span>
          </div>

          <transition name="error-slide">
            <p v-if="touched.password && errors.password" class="neu-error" role="alert">
              <Icon name="exclamation-circle" :size="14" />
              {{ errors.password }}
            </p>
          </transition>
        </div>

        <!-- Confirm Password Input -->
        <div class="neu-field">
          <label for="confirmPassword" class="neu-label">
            <Icon name="check" :size="16" class="neu-label-icon" />
            確認密碼
          </label>
          <div class="neu-input-wrapper neu-input-password" :class="{ 'neu-input-error': touched.confirmPassword && errors.confirmPassword, 'neu-input-valid': touched.confirmPassword && !errors.confirmPassword && confirmPassword }">
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              :type="isConfirmPasswordVisible ? 'text' : 'password'"
              class="neu-input"
              placeholder="請再次輸入密碼"
              autocomplete="new-password"
              required
              @blur="handleBlur('confirmPassword')"
            />
            <button
              type="button"
              class="neu-toggle"
              @click="isConfirmPasswordVisible = !isConfirmPasswordVisible"
              :aria-label="isConfirmPasswordVisible ? '隱藏密碼' : '顯示密碼'"
            >
              <Icon :name="isConfirmPasswordVisible ? 'eye-slash' : 'eye'" :size="20" />
            </button>
          </div>
          <transition name="error-slide">
            <p v-if="touched.confirmPassword && errors.confirmPassword" class="neu-error" role="alert">
              <Icon name="exclamation-circle" :size="14" />
              {{ errors.confirmPassword }}
            </p>
          </transition>
        </div>

        <!-- Terms Checkbox -->
        <label class="neu-checkbox">
          <input
            type="checkbox"
            v-model="agreeToTerms"
            class="neu-checkbox-input"
          />
          <span class="neu-checkbox-box">
            <Icon v-if="agreeToTerms" name="check" :size="14" />
          </span>
          <span class="neu-checkbox-label">
            我同意 <a href="#" class="neu-link">服務條款</a> 和 <a href="#" class="neu-link">隱私政策</a>
          </span>
        </label>

        <!-- Submit Button -->
        <button
          type="submit"
          class="neu-button"
          :disabled="isLoading || !isFormValid"
          :class="{ 'neu-button-loading': isLoading, 'neu-button-disabled': !isFormValid }"
        >
          <span v-if="!isLoading" class="neu-button-text">立即註冊</span>
          <span v-else class="neu-button-loading-content">
            <span class="neu-spinner"></span>
            註冊中...
          </span>
        </button>

        <!-- Login Link -->
        <div class="neu-footer">
          <span class="neu-footer-text">已有帳號？</span>
          <router-link to="/login" class="neu-footer-link">立即登入</router-link>
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
          <h2 class="neu-success-title">註冊成功！</h2>
          <p class="neu-success-text">正在跳轉至登入頁面...</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* ============================================
   NEUMORPHISM DESIGN SYSTEM
   Soft UI with realistic depth and shadows
   ============================================ */

/* Base Variables */
.neu-container {
  --neu-bg: #EFEEEE;
  --neu-bg-dark: #E0DFDF;
  --neu-bg-light: #FFFFFF;
  --neu-primary: #14b8a6;
  --neu-primary-dark: #0d9488;
  --neu-primary-light: #5eead4;
  --neu-text: #334155;
  --neu-text-muted: #64748b;
  --neu-text-light: #94a3b8;
  --neu-error: #ef4444;
  --neu-success: #10b981;
  --neu-warning: #f59e0b;

  /* Neumorphic Shadows - Top-left light source */
  --neu-shadow-out: 8px 8px 16px rgba(0, 0, 0, 0.1),
                    -8px -8px 16px rgba(255, 255, 255, 0.9);
  --neu-shadow-out-sm: 4px 4px 8px rgba(0, 0, 0, 0.08),
                       -4px -4px 8px rgba(255, 255, 255, 0.8);
  --neu-shadow-in: inset 4px 4px 8px rgba(0, 0, 0, 0.08),
                   inset -4px -4px 8px rgba(255, 255, 255, 0.9);
  --neu-shadow-in-deep: inset 6px 6px 12px rgba(0, 0, 0, 0.12),
                        inset -6px -6px 12px rgba(255, 255, 255, 0.95);

  min-height: 100vh;
  background: var(--neu-bg);
  padding: 2rem 1.5rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ============================================
   HEADER SECTION
   ============================================ */
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
  box-shadow: 10px 10px 20px rgba(0, 0, 0, 0.12),
              -10px -10px 20px rgba(255, 255, 255, 0.95);
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

/* ============================================
   MAIN CARD
   ============================================ */
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

/* ============================================
   FORM FIELDS
   ============================================ */
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

/* ============================================
   NEUMORPHIC INPUT - Inset Style
   ============================================ */
.neu-input-wrapper {
  background: var(--neu-bg);
  border-radius: 1rem;
  box-shadow: var(--neu-shadow-in);
  transition: all 0.3s ease;
  position: relative;
}

.neu-input-wrapper:focus-within {
  box-shadow: var(--neu-shadow-in-deep),
              0 0 0 3px rgba(20, 184, 166, 0.15);
}

.neu-input-wrapper.neu-input-error {
  box-shadow: var(--neu-shadow-in),
              0 0 0 2px rgba(239, 68, 68, 0.3);
}

.neu-input-wrapper.neu-input-valid {
  box-shadow: var(--neu-shadow-in),
              0 0 0 2px rgba(16, 185, 129, 0.3);
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

/* Password Toggle Button */
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

/* Error Message */
.neu-error {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--neu-error);
  padding-left: 0.25rem;
}

/* ============================================
   PASSWORD STRENGTH INDICATOR
   ============================================ */
.neu-strength {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem;
}

.neu-strength-bars {
  display: flex;
  gap: 0.375rem;
  flex: 1;
}

.neu-strength-bar {
  height: 0.375rem;
  flex: 1;
  background: var(--neu-bg-dark);
  border-radius: 0.25rem;
  box-shadow: var(--neu-shadow-in);
  transition: all 0.3s ease;
}

.neu-strength-bar.neu-strength-active {
  box-shadow: none;
}

.neu-strength-text {
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
}

/* ============================================
   CHECKBOX - Neumorphic Style
   ============================================ */
.neu-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
  padding: 0.25rem;
}

.neu-checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.neu-checkbox-box {
  width: 1.5rem;
  height: 1.5rem;
  min-width: 1.5rem;
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

.neu-checkbox-input:focus + .neu-checkbox-box {
  box-shadow: var(--neu-shadow-in),
              0 0 0 3px rgba(20, 184, 166, 0.2);
}

.neu-checkbox-label {
  font-size: 0.9375rem;
  color: var(--neu-text-muted);
  line-height: 1.5;
}

.neu-link {
  color: var(--neu-primary);
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
}

.neu-link:hover {
  color: var(--neu-primary-dark);
  text-decoration: underline;
}

/* ============================================
   SUBMIT BUTTON - Floating Pill Style
   ============================================ */
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
  margin-top: 0.5rem;
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
              -6px -6px 14px rgba(255, 255, 255, 0.8),
              inset 0 -2px 6px rgba(0, 0, 0, 0.1),
              inset 0 2px 6px rgba(255, 255, 255, 0.2);
}

.neu-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.12),
              -2px -2px 6px rgba(255, 255, 255, 0.6),
              inset 2px 2px 4px rgba(0, 0, 0, 0.15);
}

.neu-button:focus-visible {
  outline: none;
  box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.15),
              -4px -4px 10px rgba(255, 255, 255, 0.7),
              0 0 0 4px rgba(20, 184, 166, 0.3);
}

.neu-button-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.neu-button-loading {
  pointer-events: none;
}

.neu-button-text {
  letter-spacing: 0.5px;
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

/* ============================================
   FOOTER LINKS
   ============================================ */
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
  display: inline-block;
}

.neu-footer-link:hover {
  color: var(--neu-primary-dark);
  transform: translateX(2px);
}

/* ============================================
   SUCCESS OVERLAY
   ============================================ */
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
  box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.15),
              -8px -8px 16px rgba(255, 255, 255, 0.9);
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes successPop {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* ============================================
   REDUCED MOTION SUPPORT
   ============================================ */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ============================================
   RESPONSIVE ADJUSTMENTS
   ============================================ */
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
    border-radius: 1.25rem;
  }

  .neu-input {
    padding: 0.875rem 1rem;
  }

  .neu-button {
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }
}
</style>
