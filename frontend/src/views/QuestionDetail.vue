<script setup>
import { ref, onMounted } from 'vue'
import axios from '../api/axios'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const question = ref(null)
const newAnswer = ref('')
const error = ref('')
const currentUser = ref(null)

const fetchQuestion = async () => {
  try {
    const response = await axios.get(`/questions/${route.params.id}`)
    if (response.data.success) {
      question.value = response.data.question
    }
  } catch (err) {
    error.value = '加载问题失败'
  }
}

const checkLogin = async () => {
  try {
    const response = await axios.get('/api/status')
    currentUser.value = response.data.user
  } catch (e) {
    // ignore
  }
}

const submitAnswer = async () => {
  if (!currentUser.value) {
    alert('请先登录后再回答')
    router.push('/login')
    return
  }
  
  try {
    const response = await axios.post(`/questions/${route.params.id}/answers`, {
      content: newAnswer.value
    })
    
    if (response.data.success) {
      // Add new answer to the list locally
      question.value.answers.push(response.data.answer)
      newAnswer.value = ''
      alert('回答提交成功！')
    }
  } catch (err) {
    alert(err.response?.data?.message || '提交失败')
  }
}

onMounted(() => {
  fetchQuestion()
  checkLogin()
})
</script>

<template>
  <div v-if="question" class="container">
    <div class="card question-card">
      <h1>{{ question.title }}</h1>
      <div class="meta">
        <span>提问者: {{ question.author.username }}</span>
        <span>时间: {{ new Date(question.createdAt).toLocaleString() }}</span>
      </div>
      <div class="content">
        {{ question.content }}
      </div>
    </div>

    <div class="answers-section">
      <h3>共 {{ question.answers ? question.answers.length : 0 }} 个回答</h3>
      
      <div v-for="answer in question.answers" :key="answer._id" class="card answer-card">
        <div class="answer-meta">
          <strong>{{ answer.author.username }}</strong> 说：
        </div>
        <div class="answer-content">
          {{ answer.content }}
        </div>
        <div class="answer-date">
          {{ new Date(answer.createdAt).toLocaleString() }}
        </div>
      </div>
    </div>

    <div class="card reply-card">
      <h3>我来回答</h3>
      <div v-if="currentUser">
        <textarea v-model="newAnswer" rows="4" placeholder="请输入您的回答..."></textarea>
        <button @click="submitAnswer" class="btn-submit">提交回答</button>
      </div>
      <div v-else>
        <p>请 <router-link to="/login">登录</router-link> 后参与回答</p>
      </div>
    </div>
    
    <div style="margin-top: 20px; text-align: center;">
      <router-link to="/">返回首页</router-link>
    </div>
  </div>
  <div v-else class="loading">
    加载中...
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
}
.question-card {
  background-color: #fff;
  border-left: 5px solid #646cff;
}
.meta {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
}
.content {
  font-size: 1.2rem;
  line-height: 1.6;
  white-space: pre-wrap;
  text-align: left;
}
.answers-section {
  margin-top: 2rem;
}
.answer-card {
  margin-bottom: 1rem;
  text-align: left;
}
.answer-meta {
  margin-bottom: 0.5rem;
  color: #333;
}
.answer-content {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}
.answer-date {
  font-size: 0.8rem;
  color: #999;
  text-align: right;
}
textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}
.btn-submit {
  width: 100%;
}
</style>
