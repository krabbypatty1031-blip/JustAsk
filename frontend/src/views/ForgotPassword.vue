<script setup>
import { ref, inject, computed, watch } from 'vue'
import axios from '../api/axios'
import { useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'

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
  if (touched.value.confirmNewPassword && confirmNewPassword.value) {
    errors.value.confirmNewPassword = validateConfirmNewPassword(confirmNewPassword.value)
  }
})

watch(confirmNewPassword, (value) => {
  if (touched.value.confirmNewPassword) {
    errors.value.confirmNewPassword = validateConfirmNewPassword(value)
  }
})

const handleBlur = (field) => {
  touched.value[field] = true
  if (field === 'username') errors.value.username = validateUsername(username.value)
  if (field === 'phone') errors.value.phone = validatePhone(phone.value)
  if (field === 'newPassword') errors.value.newPassword = validateNewPassword(newPassword.value)
  if (field === 'confirmNewPassword') errors.value.confirmNewPassword = validateConfirmNewPassword(confirmNewPassword.value)
}

const isStep1Valid = computed(() => {
  return !validateUsername(username.value) && !validatePhone(phone.value)
})

const isStep2Valid = computed(() => {
  return !validateNewPassword(newPassword.value) && !validateConfirmNewPassword(confirmNewPassword.value)
})

const nextStep = () => {
  if (currentStep.value === 1) {
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
      currentStep.value = 3
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
  <div class="neu-forgot">
    <!-- Header -->
    <header class="neu-forgot-header">
      <button class="neu-back-btn" @click="router.back()" aria-label="返回">
        <Icon name="arrow-left" :size="24" />
      </button>
      <h1 class="neu-forgot-title">重置密碼</h1>
      <div class="neu-header-spacer"></div>
    </header>

    <!-- Hero Section -->
    <div class="neu-hero">
      <div class="neu-hero-icon">
        <Icon name="lock-closed" :size="40" :stroke-width="1.5" />
      </div>
      <h2 class="neu-hero-title">忘記密碼了嗎？</h2>
      <p class="neu-hero-text">別擔心，我們來幫您</p>
    </div>

    <!-- Step Indicator -->
    <div class="neu-steps">
      <div
        v-for="step in totalSteps"
        :key="step"
        class="neu-step"
        :class="{
          'active': currentStep === step,
          'completed': currentStep > step
        }"
      >
        <div class="neu-step-circle">
          <Icon v-if="currentStep > step" name="check" :size="16" :stroke-width="3" />
          <span v-else>{{ step }}</span>
        </div>
        <span class="neu-step-label">
          <span v-if="step === 1">驗證身份</span>
          <span v-if="step === 2">設定密碼</span>
          <span v-if="step === 3">完成</span>
        </span>
      </div>
    </div>

    <!-- Form Section -->
    <div class="neu-form-section">
      <!-- Step 1: Verify Identity -->
      <transition name="step-fade" mode="out-in">
        <form v-if="currentStep === 1" @submit.prevent="nextStep" class="neu-form" key="step1">
          <h3 class="neu-form-title">驗證您的身份</h3>
          <p class="neu-form-desc">請輸入您的帳號資訊以驗證身份</p>

          <!-- Username Input -->
          <div class="neu-form-group">
            <label for="username" class="neu-label">
              <Icon name="user" :size="18" />
              <span>用戶名</span>
            </label>
            <div class="neu-input-wrapper">
              <input
                id="username"
                v-model="username"
                type="text"
                class="neu-input"
                :class="{ 'error': touched.username && errors.username, 'valid': touched.username && !errors.username && username }"
                placeholder="請輸入您的用戶名"
                autocomplete="username"
                @blur="handleBlur('username')"
              />
            </div>
            <transition name="error-fade">
              <p v-if="touched.username && errors.username" class="neu-error">
                <Icon name="exclamation-circle" :size="14" />
                {{ errors.username }}
              </p>
            </transition>
          </div>

          <!-- Phone Input -->
          <div class="neu-form-group">
            <label for="phone" class="neu-label">
              <Icon name="phone" :size="18" />
              <span>手機號碼</span>
            </label>
            <div class="neu-input-wrapper">
              <input
                id="phone"
                v-model="phone"
                type="tel"
                class="neu-input"
                :class="{ 'error': touched.phone && errors.phone, 'valid': touched.phone && !errors.phone && phone }"
                placeholder="請輸入註冊手機號碼"
                autocomplete="tel"
                @blur="handleBlur('phone')"
              />
            </div>
            <transition name="error-fade">
              <p v-if="touched.phone && errors.phone" class="neu-error">
                <Icon name="exclamation-circle" :size="14" />
                {{ errors.phone }}
              </p>
            </transition>
          </div>

          <!-- Next Button -->
          <button type="submit" class="neu-btn neu-btn-primary">
            <span>下一步</span>
            <Icon name="arrow-right" :size="20" />
          </button>

          <!-- Back to Login -->
          <div class="neu-back-link">
            <span>想起密碼了？</span>
            <router-link to="/login" class="neu-link">返回登入</router-link>
          </div>
        </form>

        <!-- Step 2: Set New Password -->
        <form v-else-if="currentStep === 2" @submit.prevent="handleResetPassword" class="neu-form" key="step2">
          <h3 class="neu-form-title">設定新密碼</h3>
          <p class="neu-form-desc">請輸入您的新密碼</p>

          <!-- New Password Input -->
          <div class="neu-form-group">
            <label for="newPassword" class="neu-label">
              <Icon name="lock-closed" :size="18" />
              <span>新密碼</span>
            </label>
            <div class="neu-input-wrapper neu-input-with-btn">
              <input
                id="newPassword"
                v-model="newPassword"
                :type="isPasswordVisible ? 'text' : 'password'"
                class="neu-input"
                :class="{ 'error': touched.newPassword && errors.newPassword, 'valid': touched.newPassword && !errors.newPassword && newPassword }"
                placeholder="請輸入新密碼"
                autocomplete="new-password"
                @blur="handleBlur('newPassword')"
              />
              <button
                type="button"
                class="neu-toggle-btn"
                @click="isPasswordVisible = !isPasswordVisible"
                :aria-label="isPasswordVisible ? '隱藏密碼' : '顯示密碼'"
              >
                <Icon :name="isPasswordVisible ? 'eye-slash' : 'eye'" :size="20" />
              </button>
            </div>
            <transition name="error-fade">
              <p v-if="touched.newPassword && errors.newPassword" class="neu-error">
                <Icon name="exclamation-circle" :size="14" />
                {{ errors.newPassword }}
              </p>
            </transition>
          </div>

          <!-- Confirm Password Input -->
          <div class="neu-form-group">
            <label for="confirmNewPassword" class="neu-label">
              <Icon name="lock-closed" :size="18" />
              <span>確認新密碼</span>
            </label>
            <div class="neu-input-wrapper neu-input-with-btn">
              <input
                id="confirmNewPassword"
                v-model="confirmNewPassword"
                :type="isConfirmPasswordVisible ? 'text' : 'password'"
                class="neu-input"
                :class="{ 'error': touched.confirmNewPassword && errors.confirmNewPassword, 'valid': touched.confirmNewPassword && !errors.confirmNewPassword && confirmNewPassword }"
                placeholder="請再次輸入新密碼"
                autocomplete="new-password"
                @blur="handleBlur('confirmNewPassword')"
              />
              <button
                type="button"
                class="neu-toggle-btn"
                @click="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                :aria-label="isConfirmPasswordVisible ? '隱藏確認密碼' : '顯示確認密碼'"
              >
                <Icon :name="isConfirmPasswordVisible ? 'eye-slash' : 'eye'" :size="20" />
              </button>
            </div>
            <transition name="error-fade">
              <p v-if="touched.confirmNewPassword && errors.confirmNewPassword" class="neu-error">
                <Icon name="exclamation-circle" :size="14" />
                {{ errors.confirmNewPassword }}
              </p>
            </transition>
          </div>

          <!-- Action Buttons -->
          <div class="neu-btn-group">
            <button type="button" class="neu-btn neu-btn-outline" @click="prevStep">
              <Icon name="arrow-left" :size="20" />
              <span>上一步</span>
            </button>
            <button type="submit" class="neu-btn neu-btn-primary" :disabled="isLoading">
              <span v-if="!isLoading">重置密碼</span>
              <span v-else class="neu-loading">
                <span class="neu-spinner"></span>
                重置中...
              </span>
            </button>
          </div>
        </form>

        <!-- Step 3: Success -->
        <div v-else-if="currentStep === 3" class="neu-form neu-success" key="step3">
          <div class="neu-success-icon">
            <Icon name="check-circle" :size="64" :stroke-width="1.5" />
          </div>
          <h3 class="neu-success-title">密碼重置成功！</h3>
          <p class="neu-success-text">您的密碼已成功重置，現在可以使用新密碼登入了</p>

          <button @click="goToLogin" class="neu-btn neu-btn-primary">
            <span>前往登入</span>
            <Icon name="arrow-right" :size="20" />
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   NEUMORPHISM FORGOT PASSWORD PAGE
   ============================================ */
.neu-forgot {
  min-height: 100vh;
  background: var(--neu-bg);
  padding: 2rem 1.5rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* --- Header --- */
.neu-forgot-header {
  position: relative;
  width: 100%;
  max-width: 24rem;
  height: 0;
  margin: 0 auto;
  padding: 0;
}

.neu-back-btn {
  position: absolute;
  left: 0;
  top: -0.25rem;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--neu-bg);
  border: none;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--neu-text);
  box-shadow: var(--neu-shadow-out-sm);
  transition: all 0.2s ease;
}

.neu-back-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--neu-shadow-out);
}

.neu-back-btn:active {
  transform: translateY(0);
  box-shadow: var(--neu-shadow-in);
}

.neu-forgot-title {
  display: none;
}

.neu-header-spacer {
  display: none;
}

/* --- Hero Section --- */
.neu-hero {
  text-align: center;
  margin-bottom: 2rem;
  animation: fadeInDown 0.6s ease-out;
  width: 100%;
  max-width: 24rem;
}

.neu-hero-icon {
  width: 5rem;
  height: 5rem;
  background: var(--neu-bg);
  border-radius: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  color: var(--neu-primary);
  box-shadow: var(--neu-shadow-out);
}

.neu-hero-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--neu-text);
  margin-bottom: 0.5rem;
  letter-spacing: -0.5px;
}

.neu-hero-text {
  font-size: 1rem;
  color: var(--neu-text-muted);
  font-weight: 500;
}

/* --- Step Indicator --- */
.neu-steps {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0 0 1.5rem;
  max-width: 24rem;
  width: 100%;
  margin: 0 auto 0.5rem;
  position: relative;
}

.neu-steps::before {
  content: '';
  position: absolute;
  top: 1.125rem;
  left: 1.75rem;
  right: 1.75rem;
  height: 2px;
  background: var(--neu-bg-dark);
}

.neu-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  position: relative;
  z-index: 1;
}

.neu-step-circle {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: var(--neu-bg);
  box-shadow: var(--neu-shadow-out-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--neu-text-muted);
  transition: all 0.3s ease;
}

.neu-step.active .neu-step-circle {
  background: linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-dark) 100%);
  color: white;
  box-shadow: 4px 4px 10px rgba(20, 184, 166, 0.3),
              -2px -2px 6px rgba(255, 255, 255, 0.8);
}

.neu-step.completed .neu-step-circle {
  background: var(--neu-success);
  color: white;
  box-shadow: var(--neu-shadow-out-sm);
}

.neu-step-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--neu-text-muted);
  transition: color 0.3s ease;
}

.neu-step.active .neu-step-label {
  color: var(--neu-primary);
}

.neu-step.completed .neu-step-label {
  color: var(--neu-success);
}

/* --- Form Section --- */
.neu-form-section {
  width: 100%;
  max-width: 24rem;
  background: var(--neu-bg);
  border-radius: 2rem;
  padding: 2rem;
  box-shadow: var(--neu-shadow-out);
  margin: 0 auto;
}

.neu-form {
  width: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: fadeInUp 0.6s ease-out 0.1s backwards;
}

.neu-form-title {
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--neu-text);
  text-align: center;
  margin-bottom: 0.5rem;
}

.neu-form-desc {
  font-size: 0.9375rem;
  color: var(--neu-text-muted);
  text-align: center;
  margin-bottom: 2rem;
}

/* --- Form Group --- */
.neu-form-group {
  margin-bottom: 0;
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

.neu-label svg {
  color: var(--neu-primary);
}

.neu-input-wrapper {
  position: relative;
  background: var(--neu-bg);
  border-radius: 1rem;
  box-shadow: var(--neu-shadow-in);
  transition: all 0.3s ease;
}

.neu-input {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1rem;
  font-weight: 500;
  background: transparent;
  border: none;
  border-radius: 1rem;
  color: var(--neu-text);
  outline: none;
}

.neu-input::placeholder {
  color: var(--neu-text-light);
  font-weight: 400;
}

.neu-input-wrapper:focus-within {
  box-shadow: var(--neu-shadow-in-deep),
              0 0 0 3px rgba(20, 184, 166, 0.15);
}

.neu-input.error {
  box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.08),
              inset -4px -4px 8px rgba(255, 255, 255, 0.9),
              0 0 0 2px rgba(239, 68, 68, 0.3);
}

.neu-input.valid {
  box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.08),
              inset -4px -4px 8px rgba(255, 255, 255, 0.9),
              0 0 0 2px rgba(16, 185, 129, 0.3);
}

.neu-input-with-btn .neu-input {
  padding-right: 3.5rem;
}

.neu-toggle-btn {
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
  cursor: pointer;
  color: var(--neu-text-muted);
  box-shadow: var(--neu-shadow-out-sm);
  transition: all 0.2s ease;
}

.neu-toggle-btn:hover {
  color: var(--neu-primary);
  transform: translateY(-50%) scale(1.05);
}

.neu-toggle-btn:active {
  box-shadow: var(--neu-shadow-in);
  transform: translateY(-50%) scale(0.98);
}

.neu-error {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
  color: var(--neu-error);
  font-size: 0.875rem;
  font-weight: 500;
}

/* --- Buttons --- */
.neu-btn {
  width: 100%;
  padding: 1.125rem 2rem;
  font-size: 1.125rem;
  font-weight: 700;
  border: none;
  border-radius: 3rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.neu-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.neu-btn:hover:not(:disabled)::before {
  left: 100%;
}

.neu-btn-primary {
  background: linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-dark) 100%);
  color: white;
  box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.15),
              -4px -4px 10px rgba(255, 255, 255, 0.7),
              inset 0 -2px 6px rgba(0, 0, 0, 0.1),
              inset 0 2px 6px rgba(255, 255, 255, 0.2);
}

.neu-btn-primary:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.18),
              -6px -6px 14px rgba(255, 255, 255, 0.8),
              inset 0 -2px 6px rgba(0, 0, 0, 0.1),
              inset 0 2px 6px rgba(255, 255, 255, 0.2);
}

.neu-btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.12),
              -2px -2px 6px rgba(255, 255, 255, 0.6),
              inset 2px 2px 4px rgba(0, 0, 0, 0.15);
}

.neu-btn:focus-visible {
  outline: none;
  box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.15),
              -4px -4px 10px rgba(255, 255, 255, 0.7),
              0 0 0 4px rgba(20, 184, 166, 0.3);
}

.neu-btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.neu-btn-outline {
  background: var(--neu-bg);
  color: var(--neu-text);
  box-shadow: var(--neu-shadow-out-sm);
}

.neu-btn-outline:hover {
  color: var(--neu-primary);
  transform: translateY(-2px);
  box-shadow: var(--neu-shadow-out);
}

.neu-btn-outline:active {
  transform: translateY(0);
  box-shadow: var(--neu-shadow-in);
}

.neu-btn-group {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.neu-btn-group .neu-btn {
  flex: 1;
}

.neu-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.neu-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* --- Back Link --- */
.neu-back-link {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9375rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--neu-bg-dark);
  color: var(--neu-text-muted);
}

.neu-link {
  color: var(--neu-primary);
  font-weight: 700;
  text-decoration: none;
  margin-left: 0.5rem;
  transition: all 0.2s ease;
}

.neu-link:hover {
  color: var(--neu-primary-dark);
  text-decoration: underline;
}

/* --- Success Step --- */
.neu-success {
  text-align: center;
  padding-top: 2rem;
}

.neu-success-icon {
  width: 6rem;
  height: 6rem;
  background: var(--neu-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: var(--neu-success);
  box-shadow: var(--neu-shadow-out);
  animation: successPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.neu-success-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--neu-text);
  margin-bottom: 0.75rem;
}

.neu-success-text {
  font-size: 1rem;
  color: var(--neu-text-muted);
  margin-bottom: 2rem;
  line-height: 1.6;
}

/* --- Transitions --- */
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

.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

/* --- Animations --- */
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
  to { transform: rotate(360deg); }
}

@keyframes successPop {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* --- Responsive --- */
@media (max-width: 400px) {
  .neu-hero {
    padding: 1.5rem 1rem;
  }

  .neu-hero-title {
    font-size: 1.5rem;
  }

  .neu-form-section {
    padding: 1rem 1rem 2rem;
  }

  .neu-btn-group {
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
