<script setup>
import { ref, inject } from 'vue'
import axios from '../api/axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const showToast = inject('showToast')
const isLoading = ref(false)

const form = ref({
  username: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)

const handleRegister = async () => {
  if (form.value.password !== form.value.confirmPassword) {
    return showToast('兩次密碼不一致', 'error')
  }

  isLoading.value = true
  try {
    const response = await axios.post('/users/register', form.value)
    if (response.data.success) {
      showToast('註冊成功！請登入', 'success')
      router.push('/login')
    }
  } catch (err) {
    showToast(err.response?.data?.message || '註冊失敗', 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-header">
      <div class="circle-bg"></div>
      <h1>Sign Up</h1>
      <p>加入我們溫暖的社區</p>
    </div>

    <div class="auth-card">
      <div class="input-group">
        <label for="reg-username" class="input-label">用戶名</label>
        <input 
          id="reg-username"
          v-model="form.username" 
          type="text" 
          class="input-field" 
          placeholder="設定一個好聽的名字"
          aria-label="用戶名"
          autocomplete="username"
          required
        />
      </div>
      <div class="input-group">
        <label for="reg-phone" class="input-label">手機號碼</label>
        <input 
          id="reg-phone"
          v-model="form.phone" 
          type="tel" 
          class="input-field" 
          placeholder="請輸入手機號碼"
          aria-label="手機號碼"
          autocomplete="tel"
          required
        />
      </div>
      <div class="input-group" style="position: relative;">
        <label for="reg-password" class="input-label">密碼</label>
        <input 
          id="reg-password"
          v-model="form.password" 
          :type="isPasswordVisible ? 'text' : 'password'" 
          class="input-field" 
          placeholder="請設定您的密碼"
          aria-label="密碼"
          autocomplete="new-password"
          required
        />
        <button 
          type="button"
          class="password-toggle"
          @click="isPasswordVisible = !isPasswordVisible"
          :aria-label="isPasswordVisible ? '隱藏密碼' : '顯示密碼'"
          :aria-pressed="isPasswordVisible"
        >
          <div class="toggle-content">
            <svg v-if="!isPasswordVisible" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
            <span>{{ isPasswordVisible ? '隱藏' : '顯示' }}</span>
          </div>
        </button>
      </div>
      <div class="input-group" style="position: relative;">
        <label for="reg-confirm-password" class="input-label">確認密碼</label>
        <input 
          id="reg-confirm-password"
          v-model="form.confirmPassword" 
          :type="isConfirmPasswordVisible ? 'text' : 'password'" 
          class="input-field" 
          placeholder="請再次輸入密碼"
          aria-label="確認密碼"
          autocomplete="new-password"
          required
        />
        <button 
          type="button"
          class="password-toggle"
          @click="isConfirmPasswordVisible = !isConfirmPasswordVisible"
          :aria-label="isConfirmPasswordVisible ? '隱藏確認密碼' : '顯示確認密碼'"
          :aria-pressed="isConfirmPasswordVisible"
        >
          <div class="toggle-content">
            <svg v-if="!isConfirmPasswordVisible" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
            <span>{{ isConfirmPasswordVisible ? '隱藏' : '顯示' }}</span>
          </div>
        </button>
      </div>

      <button 
        class="btn btn-primary btn-block btn-lg" 
        @click="handleRegister" 
        :disabled="isLoading"
        aria-live="polite"
      >
        {{ isLoading ? '提交中...' : '註冊帳號' }}
      </button>

      <div class="auth-footer">
        <span 
          @click="router.push('/login')" 
          style="cursor: pointer; color: var(--text-muted); font-size: 1.125rem; font-weight: 600;"
          role="button"
          tabindex="0"
          @keypress.enter="router.push('/login')"
        >
          ← 返回登入
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 復用 Login 的樣式，保持一致性 */
.auth-container {
  min-height: 100vh;
  background: white;
  position: relative;
  overflow: hidden;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.circle-bg {
  position: absolute;
  top: -150px;
  left: -100px;
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #4CB8C4 0%, #2196F3 100%);
  border-radius: 50%;
  opacity: 0.15;
  z-index: 0;
}

.auth-header {
  position: relative;
  z-index: 1;
  margin-bottom: 2.5rem;
  text-align: center;
}

.auth-header h1 {
  font-size: 3rem;
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 0.75rem;
}

.auth-header p { color: var(--text-secondary); font-size: 1.25rem; }

.auth-card {
  position: relative;
  z-index: 1;
  animation: slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  max-width: 450px;
  margin: 0 auto;
  width: 100%;
}

.auth-footer {
  margin-top: 2.5rem;
  text-align: center;
  font-size: 1.125rem;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: var(--bg-input);
  border: 2px solid var(--border-color);
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  border-radius: 1rem;
  min-height: 2.75rem;
  transition: all 0.2s;
  font-weight: 600;
  font-size: 1rem;
}

.password-toggle:hover,
.password-toggle:focus {
  color: var(--primary-color);
  background: var(--bg-hover);
  border-color: var(--primary-color);
  outline: none;
}

.toggle-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>