<script setup>
import { ref, inject, computed, watch } from 'vue'
import axios from '../api/axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const showToast = inject('showToast')
const isLoading = ref(false)

// Multi-step state
const currentStep = ref(1)
const totalSteps = 3

// Form data
const username = ref('')
const phone = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)

// Validation states
const touched = ref({
  username: false,
  phone: false,
  newPassword: false,
  confirmNewPassword: false
})

const errors = ref({
  username: '',
  phone: '',
  newPassword: '',
  confirmNewPassword: ''
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

const validateNewPassword = (value) => {
  if (!value) return '請輸入新密碼'
  if (value.length < 6) return '密碼至少需要6個字符'
  if (value.length > 50) return '密碼不能超過50個字符'
  return ''
}

const validateConfirmNewPassword = (value) => {
  if (!value) return '請確認新密碼'
  if (value !== newPassword.value) return '兩次密碼不一致'
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

watch(newPassword, (value) => {
  if (touched.value.newPassword) {
    errors.value.newPassword = validateNewPassword(value)
  }
  // Re-validate confirm password when password changes
  if (touched.value.confirmNewPassword && confirmNewPassword.value) {
    errors.value.confirmNewPassword = validateConfirmNewPassword(confirmNewPassword.value)
  }
})

watch(confirmNewPassword, (value) => {
  if (touched.value.confirmNewPassword) {
    errors.value.confirmNewPassword = validateConfirmNewPassword(value)
  }
})

// Mark field as touched on blur
const handleBlur = (field) => {
  touched.value[field] = true
  if (field === 'username') errors.value.username = validateUsername(username.value)
  if (field === 'phone') errors.value.phone = validatePhone(phone.value)
  if (field === 'newPassword') errors.value.newPassword = validateNewPassword(newPassword.value)
  if (field === 'confirmNewPassword') errors.value.confirmNewPassword = validateConfirmNewPassword(confirmNewPassword.value)
}

// Step validation
const isStep1Valid = computed(() => {
  return !validateUsername(username.value) && !validatePhone(phone.value)
})

const isStep2Valid = computed(() => {
  return !validateNewPassword(newPassword.value) && !validateConfirmNewPassword(confirmNewPassword.value)
})

// Step navigation
const nextStep = () => {
  if (currentStep.value === 1) {
    // Validate step 1
    touched.value.username = true
    touched.value.phone = true
    errors.value.username = validateUsername(username.value)
    errors.value.phone = validatePhone(phone.value)

    if (!isStep1Valid.value) {
      showToast('請檢查輸入內容', 'error')
      return
    }
  }

  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleResetPassword = async () => {
  // Validate step 2
  touched.value.newPassword = true
  touched.value.confirmNewPassword = true
  errors.value.newPassword = validateNewPassword(newPassword.value)
  errors.value.confirmNewPassword = validateConfirmNewPassword(confirmNewPassword.value)

  if (!isStep2Valid.value) {
    showToast('請檢查輸入內容', 'error')
    return
  }

  isLoading.value = true
  try {
    const response = await axios.post('/users/reset-password', {
      username: username.value,
      phone: phone.value,
      newPassword: newPassword.value
    })

    if (response.data.success) {
      showToast('重置成功', 'success')
      currentStep.value = 3 // Go to success step
    }
  } catch (err) {
    showToast(err.response?.data?.message || '重置失敗，請檢查用戶名和手機號', 'error')
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="forgot-password-container">
    <!-- Hero Section with Gradient -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="logo-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
          </svg>
        </div>
        <h1 class="hero-title">忘記密碼了嗎？</h1>
        <p class="hero-subtitle">別擔心，我們來幫您</p>
      </div>

      <!-- Decorative Elements -->
      <div class="deco-circle deco-1"></div>
      <div class="deco-circle deco-2"></div>
    </div>

    <!-- Step Indicator -->
    <div class="step-indicator">
      <div
        v-for="step in totalSteps"
        :key="step"
        class="step-item"
        :class="{
          'active': currentStep === step,
          'completed': currentStep > step
        }"
      >
        <div class="step-circle">
          <svg v-if="currentStep > step" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span v-else>{{ step }}</span>
        </div>
        <div class="step-label">
          <span v-if="step === 1">驗證身份</span>
          <span v-if="step === 2">設定密碼</span>
          <span v-if="step === 3">完成</span>
        </div>
      </div>
    </div>

    <!-- Form Section -->
    <div class="form-section">
      <!-- Step 1: Verify Identity -->
      <transition name="step-fade" mode="out-in">
        <form v-if="currentStep === 1" @submit.prevent="nextStep" class="step-form" key="step1">
          <h2 class="step-title">驗證您的身份</h2>
          <p class="step-description">請輸入您的帳號資訊以驗證身份</p>

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
              <span>手機號碼</span>
            </label>
            <input
              id="phone"
              v-model="phone"
              type="tel"
              class="form-input"
              :class="{ 'error': touched.phone && errors.phone, 'valid': touched.phone && !errors.phone && phone }"
              placeholder="請輸入註冊手機號碼"
              aria-label="手機號碼"
              autocomplete="tel"
              required
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

          <!-- Next Button -->
          <button type="submit" class="action-btn primary-btn">
            <span>下一步</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>

          <!-- Back to Login -->
          <div class="back-link">
            <span class="prompt-text">想起密碼了？</span>
            <router-link to="/login" class="link-text">返回登入</router-link>
          </div>
        </form>

        <!-- Step 2: Set New Password -->
        <form v-else-if="currentStep === 2" @submit.prevent="handleResetPassword" class="step-form" key="step2">
          <h2 class="step-title">設定新密碼</h2>
          <p class="step-description">請輸入您的新密碼</p>

          <!-- New Password Input -->
          <div class="form-group">
            <label for="newPassword" class="form-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>新密碼</span>
            </label>
            <div class="input-wrapper">
              <input
                id="newPassword"
                v-model="newPassword"
                :type="isPasswordVisible ? 'text' : 'password'"
                class="form-input"
                :class="{ 'error': touched.newPassword && errors.newPassword, 'valid': touched.newPassword && !errors.newPassword && newPassword }"
                placeholder="請輸入新密碼"
                aria-label="新密碼"
                autocomplete="new-password"
                required
                @blur="handleBlur('newPassword')"
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
              <div v-if="touched.newPassword && errors.newPassword" class="error-message">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {{ errors.newPassword }}
              </div>
            </transition>
          </div>

          <!-- Confirm New Password Input -->
          <div class="form-group">
            <label for="confirmNewPassword" class="form-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>確認新密碼</span>
            </label>
            <div class="input-wrapper">
              <input
                id="confirmNewPassword"
                v-model="confirmNewPassword"
                :type="isConfirmPasswordVisible ? 'text' : 'password'"
                class="form-input"
                :class="{ 'error': touched.confirmNewPassword && errors.confirmNewPassword, 'valid': touched.confirmNewPassword && !errors.confirmNewPassword && confirmNewPassword }"
                placeholder="請再次輸入新密碼"
                aria-label="確認新密碼"
                autocomplete="new-password"
                required
                @blur="handleBlur('confirmNewPassword')"
              />
              <button
                type="button"
                class="password-toggle"
                @click="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                :aria-label="isConfirmPasswordVisible ? '隱藏確認密碼' : '顯示確認密碼'"
                tabindex="-1"
              >
                <svg v-if="!isConfirmPasswordVisible" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
              <div v-if="touched.confirmNewPassword && errors.confirmNewPassword" class="error-message">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {{ errors.confirmNewPassword }}
              </div>
            </transition>
          </div>

          <!-- Action Buttons -->
          <div class="button-group">
            <button type="button" class="action-btn outline-btn" @click="prevStep">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>上一步</span>
            </button>
            <button type="submit" class="action-btn primary-btn" :disabled="isLoading" :class="{ 'loading': isLoading }">
              <span v-if="!isLoading">重置密碼</span>
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
                重置中...
              </span>
            </button>
          </div>
        </form>

        <!-- Step 3: Success -->
        <div v-else-if="currentStep === 3" class="step-form success-step" key="step3">
          <div class="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2 class="success-title">密碼重置成功！</h2>
          <p class="success-message">您的密碼已成功重置，現在可以使用新密碼登入了</p>

          <!-- Go to Login Button -->
          <button @click="goToLogin" class="action-btn primary-btn">
            <span>前往登入</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   LAYOUT & CONTAINER
   ============================================ */
.forgot-password-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-body);
}

/* ============================================
   HERO SECTION
   ============================================ */
.hero-section {
  position: relative;
  background: var(--primary-gradient);
  padding: 3rem 2rem 2.5rem;
  overflow: hidden;
  border-bottom-left-radius: 2rem;
  border-bottom-right-radius: 2rem;
  box-shadow: 0 8px 24px rgba(20, 184, 166, 0.25);
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
  font-size: 2rem;
  font-weight: 800;
  color: white;
  margin-bottom: 0.75rem;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.hero-subtitle {
  font-size: 1.0625rem;
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
  width: 180px;
  height: 180px;
  top: -70px;
  right: -50px;
  animation-delay: 0s;
}

.deco-2 {
  width: 120px;
  height: 120px;
  bottom: -30px;
  left: -20px;
  animation-delay: 1s;
}

/* ============================================
   STEP INDICATOR
   ============================================ */
.step-indicator {
  display: flex;
  justify-content: space-between;
  padding: 2rem 2rem 1rem;
  max-width: 26rem;
  margin: 0 auto;
  width: 100%;
  position: relative;
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s backwards;
}

.step-indicator::before {
  content: '';
  position: absolute;
  top: 2.875rem;
  left: calc(16.67% + 1rem);
  right: calc(16.67% + 1rem);
  height: 2px;
  background: var(--border-color);
  z-index: 0;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
  flex: 1;
  position: relative;
  z-index: 1;
}

.step-circle {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background: white;
  border: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-muted);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.step-item.active .step-circle {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
}

.step-item.completed .step-circle {
  background: var(--success-color);
  border-color: var(--success-color);
  color: white;
}

.step-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-muted);
  text-align: center;
  transition: color 0.3s;
}

.step-item.active .step-label {
  color: var(--primary-color);
}

.step-item.completed .step-label {
  color: var(--success-color);
}

/* ============================================
   FORM SECTION
   ============================================ */
.form-section {
  flex: 1;
  padding: 2rem 2rem 3rem;
  background: var(--bg-body);
}

.step-form {
  max-width: 26rem;
  margin: 0 auto;
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards;
}

.step-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 0.5rem;
  text-align: center;
}

.step-description {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  text-align: center;
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
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.15);
  background: white;
  transform: translateY(-1px);
}

.form-input:hover:not(:focus) {
  border-color: #5eead4;
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
   BUTTONS
   ============================================ */
.action-btn {
  width: 100%;
  padding: 1.125rem 2rem;
  font-size: 1.125rem;
  font-weight: 700;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  letter-spacing: 0.3px;
}

.primary-btn {
  color: white;
  background: var(--primary-gradient);
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.35);
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(20, 184, 166, 0.45);
}

.primary-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);
}

.primary-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.3), 0 4px 12px rgba(20, 184, 166, 0.35);
}

.primary-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.outline-btn {
  color: var(--primary-color);
  background: white;
  border: 2px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.outline-btn:hover {
  background: var(--primary-light);
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.outline-btn:active {
  transform: translateY(0);
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.button-group .action-btn {
  flex: 1;
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
   SUCCESS STEP
   ============================================ */
.success-step {
  text-align: center;
  padding-top: 2rem;
}

.success-icon {
  width: 6rem;
  height: 6rem;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  color: var(--success-color);
  box-shadow: 0 8px 32px rgba(34, 197, 94, 0.2);
  animation: successPopIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.success-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 1rem;
}

.success-message {
  font-size: 1.0625rem;
  color: var(--text-secondary);
  margin-bottom: 2.5rem;
  line-height: 1.6;
}

/* ============================================
   BACK LINK
   ============================================ */
.back-link {
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

.link-text {
  color: var(--primary-color);
  font-weight: 700;
  text-decoration: none;
  margin-left: 0.5rem;
  transition: all 0.2s;
  display: inline-block;
}

.link-text:hover {
  color: var(--primary-hover);
  text-decoration: underline;
  transform: translateX(2px);
}

.link-text:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 4px;
  border-radius: 4px;
}

/* ============================================
   TRANSITIONS
   ============================================ */
.step-fade-enter-active,
.step-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.step-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.step-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

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

/* ============================================
   RESPONSIVE DESIGN
   ============================================ */
@media (max-width: 400px) {
  .hero-section {
    padding: 2.5rem 1.5rem 2rem;
  }

  .hero-title {
    font-size: 1.75rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .step-indicator {
    padding: 1.5rem 1rem 1rem;
  }

  .form-section {
    padding: 1.5rem 1.5rem 2.5rem;
  }

  .logo-badge {
    width: 4rem;
    height: 4rem;
  }

  .step-circle {
    width: 2.5rem;
    height: 2.5rem;
  }

  .step-label {
    font-size: 0.75rem;
  }

  .action-btn {
    font-size: 1.0625rem;
    padding: 1rem 1.5rem;
  }

  .button-group {
    flex-direction: column;
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
