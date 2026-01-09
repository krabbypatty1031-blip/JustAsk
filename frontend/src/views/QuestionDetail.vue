<script setup>
import { ref, onMounted, inject, nextTick } from 'vue'
import axios from '../api/axios'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const showToast = inject('showToast')
const currentUser = inject('currentUser')

const question = ref(null)
const newAnswer = ref('')
const isLoading = ref(true)
const answersContainer = ref(null)

const fetchQuestion = async () => {
  try {
    const response = await axios.get(`/questions/${route.params.id}`)
    if (response.data.success) {
      question.value = response.data.question
    }
  } catch (err) {
    showToast('加載失敗，問題可能已被刪除', 'error')
    router.back()
  } finally {
    isLoading.value = false
  }
}

const submitAnswer = async () => {
  if (!currentUser.value) {
    showToast('請先登入', 'info')
    router.push('/login')
    return
  }
  if (!newAnswer.value.trim()) return

  try {
    const response = await axios.post(`/questions/${route.params.id}/answers`, {
      content: newAnswer.value
    })
    
    if (response.data.success) {
      question.value.answers.push(response.data.answer)
      newAnswer.value = ''
      showToast('發送成功！', 'success')
      // 滾動到底部
      nextTick(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      })
    }
  } catch (err) {
    showToast('發送失敗', 'error')
  }
}

onMounted(() => {
  fetchQuestion()
})
</script>

<template>
  <div class="detail-view">
    <!-- Top Navigation Bar -->
    <div class="nav-bar">
      <button class="back-btn" @click="router.back()">←</button>
      <span class="nav-title">詳情</span>
      <div class="placeholder"></div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="question" class="content-wrapper">
      
      <!-- Question Card (OP) -->
      <div class="question-header-card">
        <h1 class="title">{{ question.title }}</h1>
        <div class="author-row">
          <div class="avatar">{{ question.author.username.charAt(0) }}</div>
          <div class="info">
            <span class="name">{{ question.author.username }}</span>
            <span class="date">{{ new Date(question.createdAt).toLocaleString() }}</span>
          </div>
        </div>
        <div class="body-text">
          {{ question.content }}
        </div>
      </div>

      <!-- Answers List (Chat Style) -->
      <div class="answers-area" ref="answersContainer">
        <div class="divider">
          <span>共 {{ question.answers.length }} 條回覆</span>
        </div>

        <transition-group name="list">
          <div 
            v-for="answer in question.answers" 
            :key="answer._id" 
            class="answer-item"
            :class="{ 'mine': currentUser && answer.author.username === currentUser.username }"
          >
            <div class="answer-avatar">{{ answer.author.username.charAt(0) }}</div>
            <div class="answer-bubble">
              <div class="answer-name" v-if="!(currentUser && answer.author.username === currentUser.username)">
                {{ answer.author.username }}
              </div>
              <p>{{ answer.content }}</p>
              <span class="answer-time">{{ new Date(answer.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
            </div>
          </div>
        </transition-group>
        
        <div class="bottom-spacer"></div>
      </div>

    </div>

    <!-- Fixed Bottom Input -->
    <div class="bottom-input-bar">
      <input 
        type="text" 
        v-model="newAnswer" 
        placeholder="寫下你的回答..." 
        class="input-box"
        @keyup.enter="submitAnswer"
      >
      <button class="send-btn" @click="submitAnswer" :disabled="!newAnswer.trim()">
        發送
      </button>
    </div>
  </div>
</template>

<style scoped>
.detail-view {
  background: #F7F8FA;
  min-height: 100vh;
  padding-top: 60px; /* nav height */
}

/* Nav Bar */
.nav-bar {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: 60px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px;
  z-index: 100;
  box-shadow: 0 1px 0 rgba(0,0,0,0.05);
}

.back-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #333;
  padding: 10px;
  cursor: pointer;
}

.nav-title {
  font-weight: 700;
  font-size: 1.125rem;
}

.placeholder { width: 44px; }

/* Question Header */
.question-header-card {
  background: #fff;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
}

.title {
  font-size: 1.375rem;
  margin-bottom: 15px;
  line-height: 1.3;
}

.author-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.avatar {
  width: 44px;
  height: 44px;
  background: var(--primary-gradient);
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.125rem;
}

.info {
  display: flex;
  flex-direction: column;
}

.name { font-weight: bold; color: #333; }
.date { font-size: 0.75rem; color: #999; }

.body-text {
  font-size: 1.0625rem;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
}

/* Answers Area */
.answers-area {
  padding: 0 15px;
}

.divider {
  text-align: center;
  margin: 20px 0;
  color: #999;
  font-size: 0.8125rem;
  position: relative;
}
.divider::before, .divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 35%;
  height: 1px;
  background: #e0e0e0;
}
.divider::before { left: 0; }
.divider::after { right: 0; }

.answer-item {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.answer-item.mine {
  flex-direction: row-reverse;
}

.answer-avatar {
  width: 36px;
  height: 36px;
  background: #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  color: #666;
  flex-shrink: 0;
}

.answer-bubble {
  background: #fff;
  padding: 12px 16px;
  border-radius: 18px;
  border-top-left-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.03);
  max-width: 80%;
  position: relative;
}

.answer-item.mine .answer-bubble {
  background: #E1F5FE; /* 自己的氣泡顏色 */
  border-radius: 18px;
  border-top-right-radius: 4px;
}

.answer-name {
  font-size: 0.75rem;
  color: #888;
  margin-bottom: 4px;
}

.answer-time {
  font-size: 0.625rem;
  color: #aaa;
  float: right;
  margin-top: 5px;
  margin-left: 10px;
}

.bottom-spacer { height: 80px; }

/* Bottom Input Bar */
.bottom-input-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  background: #fff;
  padding: 10px 15px;
  display: flex;
  gap: 10px;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  border-top: 1px solid #eee;
  z-index: 1001; /* Increased to overlay bottom nav */
}

.input-box {
  flex: 1;
  background: #f5f5f5;
  border: none;
  padding: 12px 20px;
  border-radius: 24px;
  font-size: 1rem;
}
.input-box:focus { outline: none; background: #eee; }

.send-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}
.send-btn:disabled { opacity: 0.5; }

/* Loading Spinner */
.loading-state {
  display: flex;
  justify-content: center;
  padding-top: 100px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>