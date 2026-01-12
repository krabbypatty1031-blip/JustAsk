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
        <input v-model="form.username" type="text" class="input-field" placeholder="設定一個好聽的名字" />
      </div>
      <div class="input-group">
        <input v-model="form.phone" type="tel" class="input-field" placeholder="手機號碼 (用於找回)" />
      </div>
      <div class="input-group" style="position: relative;">
        <input 
          v-model="form.password" 
          :type="isPasswordVisible ? 'text' : 'password'" 
          class="input-field" 
          placeholder="設定密碼" 
        />
        <button 
          type="button"
          class="password-toggle"
          @click="isPasswordVisible = !isPasswordVisible"
        >
          <div class="toggle-content">
            <svg v-if="!isPasswordVisible" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
            <span style="margin-left: 4px; font-size: 14px; font-weight: 500;">{{ isPasswordVisible ? '隱藏' : '顯示' }}</span>
          </div>
        </button>
      </div>
      <div class="input-group" style="position: relative;">
        <input 
          v-model="form.confirmPassword" 
          :type="isConfirmPasswordVisible ? 'text' : 'password'" 
          class="input-field" 
          placeholder="確認密碼" 
        />
        <button 
          type="button"
          class="password-toggle"
          @click="isConfirmPasswordVisible = !isConfirmPasswordVisible"
        >
          <div class="toggle-content">
            <svg v-if="!isConfirmPasswordVisible" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
            <span style="margin-left: 4px; font-size: 14px; font-weight: 500;">{{ isConfirmPasswordVisible ? '隱藏' : '顯示' }}</span>
          </div>
        </button>
      </div>

      <button class="btn btn-primary btn-block" @click="handleRegister" :disabled="isLoading">
        {{ isLoading ? '提交中...' : '註冊帳號' }}
      </button>

      <div class="auth-footer">
        <span @click="router.push('/login')" style="cursor: pointer; color: #888;">
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
  padding: 40px 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.circle-bg {
  position: absolute;
  top: -120px;
  left: -80px;
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); /* 註冊頁用不同的清新綠色 */
  border-radius: 50%;
  opacity: 0.2;
  z-index: 0;
}

.auth-header {
  position: relative;
  z-index: 1;
  margin-bottom: 30px;
}

.auth-header h1 {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 10px;
}

.auth-header p { color: var(--text-secondary); font-size: 1.125rem; }

.auth-card {
  position: relative;
  z-index: 1;
  animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.auth-footer {
  margin-top: 30px;
  text-align: center;
}

.password-toggle {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 15px;
}

.password-toggle:hover {
  color: var(--primary-color);
  background: #f0f0f0;
}

.toggle-content {
  display: flex;
  align-items: center;
}
</style>