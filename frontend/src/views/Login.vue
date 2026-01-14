<script setup>
import { ref, inject } from 'vue'
import axios from '../api/axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const showToast = inject('showToast')
const isLoading = ref(false)

const username = ref('')
const phone = ref('')
const password = ref('')
const isPasswordVisible = ref(false)

const handleLogin = async () => {
  if(!username.value || !password.value) return showToast('請填寫完整', 'error')

  isLoading.value = true
  try {
    const response = await axios.post('/users/login', {
      username: username.value,
      phone: phone.value,
      password: password.value
    })
    
    if (response.data.success) {
      showToast('歡迎回來！', 'success')
      router.push('/')
    }
  } catch (err) {
    showToast('登入失敗，請檢查帳號密碼', 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-header">
      <div class="circle-bg"></div>
      <h1>Login</h1>
      <p>歡迎回到 吾識JustAsk</p>
    </div>

    <div class="auth-card">
      <div class="input-group">
        <label for="username" class="input-label">用戶名</label>
        <input 
          id="username"
          v-model="username" 
          type="text" 
          class="input-field" 
          placeholder="請輸入您的用戶名"
          aria-label="用戶名"
          autocomplete="username"
          required
        />
      </div>
      <div class="input-group">
        <label for="phone" class="input-label">手機號碼</label>
        <input 
          id="phone"
          v-model="phone" 
          type="tel" 
          class="input-field" 
          placeholder="請輸入手機號碼"
          aria-label="手機號碼"
          autocomplete="tel"
        />
      </div>
      <div class="input-group password-group">
        <label for="password" class="input-label">密碼</label>
        <div class="input-wrapper">
          <input 
            id="password"
            v-model="password" 
            :type="isPasswordVisible ? 'text' : 'password'" 
            class="input-field" 
            placeholder="請輸入您的密碼"
            aria-label="密碼"
            autocomplete="current-password"
            required
          />
          <button 
            type="button"
            class="password-toggle-icon"
            @click="isPasswordVisible = !isPasswordVisible"
            :aria-label="isPasswordVisible ? '隱藏密碼' : '顯示密碼'"
          >
            <svg v-if="!isPasswordVisible" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          </button>
        </div>
      </div>

      <div style="text-align: right; margin-bottom: 1.5rem;">
        <router-link to="/forgot-password" style="color: var(--primary-color); font-size: 1.125rem; font-weight: 600; text-decoration: underline;">忘記密碼？</router-link>
      </div>

      <button 
        class="btn btn-primary btn-block btn-lg" 
        @click="handleLogin" 
        :disabled="isLoading"
        aria-live="polite"
      >
        {{ isLoading ? '登入中...' : '立即登入' }}
      </button>

      <div class="auth-footer">
        <span>還沒有帳號？</span>
        <router-link to="/register" class="link">去註冊</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  top: -100px;
  right: -100px;
  width: 350px;
  height: 350px;
  background: var(--primary-gradient);
  border-radius: 50%;
  opacity: 0.15;
  z-index: 0;
}

.auth-header {
  position: relative;
  z-index: 1;
  margin-bottom: 3rem;
  text-align: center;
}

.auth-header h1 {
  font-size: 3rem;
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 0.75rem;
}

.auth-header p {
  color: var(--text-secondary);
  font-size: 1.25rem;
}

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
  color: var(--text-muted);
  font-size: 1.125rem;
}

.link {
  color: var(--primary-color);
  font-weight: 600;
  margin-left: 0.5rem;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s;
}

.link:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

.input-wrapper {
  position: relative;
}

.password-toggle-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.password-toggle-icon:hover {
  color: var(--primary-color);
  background: var(--bg-hover);
}

.password-toggle-icon:focus {
  outline: none;
  color: var(--primary-color);
}
</style>