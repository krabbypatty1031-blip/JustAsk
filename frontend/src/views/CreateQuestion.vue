<script setup>
import { ref } from 'vue'
import axios from '../api/axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const title = ref('')
const content = ref('')
const error = ref('')

const handleSubmit = async () => {
  try {
    error.value = ''
    const response = await axios.post('/questions', {
      title: title.value,
      content: content.value
    })
    
    if (response.data.success) {
      alert('问题发布成功！')
      router.push('/')
    }
  } catch (err) {
    if (err.response && err.response.status === 401) {
      alert('请先登录')
      router.push('/login')
    } else {
      error.value = err.response?.data?.message || '发布失败，请稍后再试。'
    }
  }
}
</script>

<template>
  <div class="card">
    <h2>我要提问</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>问题标题：</label>
        <input v-model="title" type="text" required placeholder="一句话描述您的问题">
      </div>
      <div class="form-group">
        <label>详细描述：</label>
        <textarea v-model="content" rows="6" required placeholder="请详细描述您遇到的问题..."></textarea>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <div class="actions">
        <button type="submit" class="btn-submit">发布问题</button>
        <router-link to="/" class="btn-cancel">取消</router-link>
      </div>
    </form>
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
input, textarea {
  width: 100%;
  box-sizing: border-box;
  font-size: 1.2rem;
  padding: 0.5rem;
}
.actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}
.btn-submit {
  flex: 2;
  font-size: 1.3rem;
}
.btn-cancel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #555;
  background-color: #eee;
  border-radius: 8px;
  font-size: 1.2rem;
}
.error {
  color: #e74c3c;
  font-size: 1.1rem;
  font-weight: bold;
  background: #fadbd8;
  padding: 10px;
  border-radius: 8px;
}
</style>
