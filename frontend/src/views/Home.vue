<script setup>
import { ref, onMounted } from 'vue'
import axios from '../api/axios'

const message = ref('Loading...')
const user = ref(null)

const checkStatus = async () => {
  try {
    const response = await axios.get('/api/status')
    message.value = response.data.message
    user.value = response.data.user
  } catch (error) {
    message.value = 'Error connecting to backend'
    console.error(error)
  }
}

const logout = async () => {
  try {
    await axios.get('/users/logout')
    user.value = null
    alert('已登出')
  } catch (error) {
    console.error(error)
  }
}

onMounted(checkStatus)
</script>

<template>
  <div class="home">
    <h1>JustAsk 问答</h1>
    <div class="card">
      <div v-if="user">
        <p class="welcome-text">你好，<strong>{{ user.username }}</strong>！</p>
        <button class="btn-large" @click="logout">退出登录</button>
      </div>
      <div v-else>
        <p class="welcome-text">欢迎来到老年人问答社区</p>
        <div class="action-buttons">
          <router-link to="/login"><button class="btn-large">我要登录</button></router-link>
          <router-link to="/register"><button class="btn-large secondary">注册新账号</button></router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  text-align: center;
  padding: 1rem;
}
.welcome-text {
  font-size: 1.5rem;
  margin-bottom: 2rem;
}
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}
.btn-large {
  width: 100%;
  max-width: 300px;
  font-size: 1.3rem;
  padding: 1rem;
}
.secondary {
  background-color: #27AE60; /* 绿色用于注册，区分开 */
}
</style>
