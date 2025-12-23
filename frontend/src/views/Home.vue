<script setup>
import { ref, onMounted } from 'vue'
import axios from '../api/axios'
import QuestionFeed from '../components/QuestionFeed.vue'

const user = ref(null)

const checkStatus = async () => {
  try {
    const response = await axios.get('/api/status')
    user.value = response.data.user
  } catch (error) {
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

onMounted(() => {
  checkStatus()
})
</script>

<template>
  <div class="home">
    <header class="header">
      <h1>JustAsk 问答社区</h1>
      <div class="user-info">
        <div v-if="user">
          <span>欢迎, {{ user.username }}</span>
          <button @click="logout" class="btn-small">退出</button>
        </div>
        <div v-else>
          <router-link to="/login">登录</router-link> | 
          <router-link to="/register">注册</router-link>
        </div>
      </div>
    </header>

    <div class="main-actions">
      <router-link to="/ask" class="btn-ask">我要提问</router-link>
    </div>

    <!-- 使用新的适老化问题列表组件 -->
    <QuestionFeed />
  </div>
</template>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}
.btn-small {
  margin-left: 10px;
  padding: 5px 10px;
  font-size: 0.9rem;
}
.main-actions {
  margin-bottom: 2rem;
  text-align: center;
}
.btn-ask {
  display: inline-block;
  background-color: #646cff;
  color: white;
  padding: 10px 30px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 1.2rem;
  font-weight: bold;
}
.btn-ask:hover {
  background-color: #535bf2;
}
</style>
