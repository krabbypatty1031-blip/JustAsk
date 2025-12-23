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
      <div class="input-group">
        <input v-model="form.password" type="password" class="input-field" placeholder="設定密碼" />
      </div>
      <div class="input-group">
        <input v-model="form.confirmPassword" type="password" class="input-field" placeholder="確認密碼" />
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
</style>