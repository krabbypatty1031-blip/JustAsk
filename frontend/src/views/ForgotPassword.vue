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
  newPassword: '',
  confirmNewPassword: ''
})

const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)

const handleResetPassword = async () => {
  if (!form.value.username || !form.value.phone || !form.value.newPassword) {
    return showToast('請填寫所有欄位', 'error')
  }

  if (form.value.newPassword !== form.value.confirmNewPassword) {
    return showToast('兩次密碼輸入不一致', 'error')
  }

  isLoading.value = true
  try {
    const response = await axios.post('/users/reset-password', {
      username: form.value.username,
      phone: form.value.phone,
      newPassword: form.value.newPassword
    })
    
    if (response.data.success) {
      showToast('重置成功，請重新登入', 'success')
      router.push('/login')
    }
  } catch (err) {
    showToast(err.response?.data?.message || '重置失敗，請檢查用戶名和手機號', 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-header">
      <div class="circle-bg"></div>
      <h1>Reset Password</h1>
      <p>找回您的帳號</p>
    </div>

    <div class="auth-card">
      <div class="input-group">
        <input v-model="form.username" type="text" class="input-field" placeholder="請輸入用戶名" />
      </div>
      <div class="input-group">
        <input v-model="form.phone" type="tel" class="input-field" placeholder="請輸入註冊手機號" />
      </div>
      
      <div class="input-group" style="position: relative;">
        <input 
          v-model="form.newPassword" 
          :type="isPasswordVisible ? 'text' : 'password'" 
          class="input-field" 
          placeholder="設定新密碼" 
        />
        <button 
          type="button"
          class="password-toggle"
          @click="isPasswordVisible = !isPasswordVisible"
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

      <div class="input-group" style="position: relative;">
        <input 
          v-model="form.confirmNewPassword" 
          :type="isConfirmPasswordVisible ? 'text' : 'password'" 
          class="input-field" 
          placeholder="確認新密碼" 
        />
        <button 
          type="button"
          class="password-toggle"
          @click="isConfirmPasswordVisible = !isConfirmPasswordVisible"
        >
          <svg v-if="!isConfirmPasswordVisible" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        </button>
      </div>

      <button class="btn btn-primary btn-block" @click="handleResetPassword" :disabled="isLoading">
        {{ isLoading ? '重置中...' : '重置密碼' }}
      </button>

      <div class="auth-footer">
        <span @click="router.push('/login')" style="cursor: pointer; color: #666;">
          想起密碼了？ <span class="link">去登入</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 復用 Login/Register 樣式 */
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
  top: -100px;
  right: auto;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); /* 找回密碼頁用紅色/粉色系 */
  border-radius: 50%;
  opacity: 0.15;
  z-index: 0;
}

.auth-header {
  position: relative;
  z-index: 1;
  margin-bottom: 40px;
  text-align: center;
}

.auth-header h1 {
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 10px;
}

.auth-header p { color: var(--text-secondary); }

.auth-card {
  position: relative;
  z-index: 1;
  animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.auth-footer {
  margin-top: 30px;
  text-align: center;
}

.link {
  color: var(--primary-color);
  font-weight: bold;
}

.password-toggle {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 0;
  display: flex;
  align-items: center;
}

.password-toggle:hover {
  color: var(--primary-color);
}
</style>