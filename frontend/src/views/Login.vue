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
        <input v-model="username" type="text" class="input-field" placeholder="用戶名" />
      </div>
      <div class="input-group">
        <input v-model="phone" type="tel" class="input-field" placeholder="手機號 (選填)" />
      </div>
      <div class="input-group">
        <input v-model="password" type="password" class="input-field" placeholder="密碼" />
      </div>

      <button class="btn btn-primary btn-block" @click="handleLogin" :disabled="isLoading">
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
  padding: 40px 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.circle-bg {
  position: absolute;
  top: -100px;
  right: -100px;
  width: 300px;
  height: 300px;
  background: var(--primary-gradient);
  border-radius: 50%;
  opacity: 0.1;
  z-index: 0;
}

.auth-header {
  position: relative;
  z-index: 1;
  margin-bottom: 40px;
}

.auth-header h1 {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 10px;
}

.auth-header p {
  color: var(--text-secondary);
  font-size: 1.125rem;
}

.auth-card {
  position: relative;
  z-index: 1;
  animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.auth-footer {
  margin-top: 30px;
  text-align: center;
  color: #666;
}

.link {
  color: var(--primary-color);
  font-weight: bold;
  margin-left: 5px;
}
</style>