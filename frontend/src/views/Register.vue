<script setup>
import { ref } from 'vue'
import axios from '../api/axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const form = ref({
  username: '',
  phone: '',
  password: '',
  confirmPassword: ''
})
const error = ref('')

const handleRegister = async () => {
  try {
    error.value = ''
    const response = await axios.post('/users/register', form.value)
    if (response.data.success) {
      alert(response.data.message)
      router.push('/login')
    }
  } catch (err) {
    error.value = err.response?.data?.message || '註冊失敗'
  }
}
</script>

<template>
  <div class="card">
    <h2>注册新账号</h2>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label>您的名字：</label>
        <input v-model="form.username" type="text" required placeholder="请输入名字">
      </div>
      <div class="form-group">
        <label>手机号码：</label>
        <input v-model="form.phone" type="tel" required placeholder="请输入8位手机号">
      </div>
      <div class="form-group">
        <label>设置密码：</label>
        <input v-model="form.password" type="password" required placeholder="请输入密码">
      </div>
      <div class="form-group">
        <label>确认密码：</label>
        <input v-model="form.confirmPassword" type="password" required placeholder="请再次输入密码">
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" class="btn-submit">立即注册</button>
    </form>
    <div class="footer-link">
      <p>已有账号？ <router-link to="/login">去登录</router-link></p>
    </div>
  </div>
</template>

<style scoped>
.form-group {
  margin-bottom: 1.5rem;
  text-align: left;
}
label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
  font-weight: bold;
}
input {
  width: 100%;
  box-sizing: border-box;
  font-size: 1.2rem;
}
.btn-submit {
  width: 100%;
  margin-top: 1rem;
  font-size: 1.3rem;
  background-color: #27AE60; /* 注册按钮用绿色 */
}
.btn-submit:hover {
  background-color: #219150;
}
.error {
  color: #e74c3c;
  font-size: 1.1rem;
  font-weight: bold;
  background: #fadbd8;
  padding: 10px;
  border-radius: 8px;
}
.footer-link {
  margin-top: 2rem;
  font-size: 1.1rem;
}
</style>
