<script setup>
import { ref } from 'vue'
import axios from '../api/axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const phone = ref('')
const password = ref('')
const error = ref('')

const handleLogin = async () => {
  try {
    error.value = ''
    const response = await axios.post('/users/login', {
      username: username.value,
      phone: phone.value,
      password: password.value
    })
    
    if (response.data.success) {
      alert('登錄成功！')
      router.push('/')
    }
  } catch (err) {
    error.value = err.response?.data?.message || '登錄失敗，請稍後再試。'
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="title">登录账号</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>您的名字：</label>
          <input v-model="username" type="text" required placeholder="请输入名字">
        </div>
        <div class="form-group">
          <label>手机号码：</label>
          <input v-model="phone" type="tel" required placeholder="请输入8位手机号">
        </div>
        <div class="form-group">
          <label>密码：</label>
          <input v-model="password" type="password" required placeholder="请输入密码">
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" class="btn-submit">点击登录</button>
      </form>
      <div class="footer-link">
        <p>还没有账号？ <router-link to="/register">点这里注册</router-link></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5; /* 浅灰色背景，突出登录框 */
}

.login-card {
  background: #ffffff;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px; /* 限制宽度 */
}

.title {
  text-align: center;
  margin-bottom: 30px;
  font-size: 24px;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  font-weight: bold;
  color: #555;
}

input {
  width: 100%;
  padding: 12px;
  box-sizing: border-box;
  font-size: 1.1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  outline: none;
}

input:focus {
  border-color: #646cff;
}

.btn-submit {
  width: 100%;
  padding: 14px;
  margin-top: 1rem;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  background-color: #646cff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-submit:hover {
  background-color: #535bf2;
}

.error {
  color: #e74c3c;
  font-size: 1rem;
  font-weight: bold;
  background: #fadbd8;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.footer-link {
  margin-top: 2rem;
  text-align: center;
  font-size: 1rem;
  color: #666;
}
</style>
