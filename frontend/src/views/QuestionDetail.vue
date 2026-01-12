<script setup>
import { ref, onMounted, inject, nextTick } from 'vue'
import axios from '../api/axios'
import { useRoute, useRouter } from 'vue-router'
import { getAvatarUrl } from '../utils/avatar'

const route = useRoute()
const router = useRouter()
const showToast = inject('showToast')
const currentUser = inject('currentUser')

const question = ref(null)
const newAnswer = ref('')
const isLoading = ref(true)
const showReplyModal = ref(false)
const answersContainer = ref(null)
const isSpeakingId = ref(null)

const handleToggleSpeech = (text, id) => {
  if (isSpeakingId.value === id) {
    window.speechSynthesis.cancel()
    isSpeakingId.value = null
    return
  }

  // Stop any ongoing speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-HK' // Cantonese
  utterance.rate = 0.85     // Slightly slower for elderly
  utterance.pitch = 1.0

  utterance.onstart = () => {
    isSpeakingId.value = id
  }

  utterance.onend = () => {
    isSpeakingId.value = null
  }

  utterance.onerror = (event) => {
    isSpeakingId.value = null
    // Ignore errors caused by manual cancellation or interruption
    if (event.error === 'interrupted' || event.error === 'canceled') {
      return
    }
    showToast('語音播報失敗', 'error')
  }

  window.speechSynthesis.speak(utterance)
}

// Ensure speech stops when navigating away
import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.speechSynthesis.cancel()
})

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

const openReplyModal = () => {
  if (!currentUser.value) {
    showToast('請先登入', 'info')
    router.push('/login')
    return
  }
  showReplyModal.value = true
}

const submitAnswer = async () => {
  if (!newAnswer.value.trim()) return

  try {
    const response = await axios.post(`/questions/${route.params.id}/answers`, {
      content: newAnswer.value
    })
    
    if (response.data.success) {
      question.value.answers.push(response.data.answer)
      newAnswer.value = ''
      showReplyModal.value = false // Close modal
      showToast('發送成功！', 'success')
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
        <div class="title-row">
          <h1 class="title">{{ question.title }}</h1>
          <button 
            class="btn-speak-main" 
            @click="handleToggleSpeech(`${question.title}。${question.content}`, 'question')"
            :class="{ 'is-speaking': isSpeakingId === 'question' }"
          >
            <span v-if="isSpeakingId === 'question'">🛑 停止</span>
            <span v-else>🔊 聽粵語</span>
          </button>
        </div>
        <div class="author-row">
          <img :src="getAvatarUrl(question.author.username)" class="avatar" alt="avatar" />
          <div class="info">
            <span class="name">{{ question.author.username }}</span>
            <span class="date">{{ new Date(question.createdAt).toLocaleString() }}</span>
          </div>
        </div>
        <div class="body-text">
          {{ question.content }}
        </div>
        <!-- Reply Button inside Card -->
        <div class="card-actions">
          <button class="reply-btn-outline" @click="openReplyModal">
            💬 回覆這個問題
          </button>
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
            <img :src="getAvatarUrl(answer.author.username)" class="answer-avatar" alt="avatar" />
            <div class="answer-bubble">
              <div class="answer-name" v-if="!(currentUser && answer.author.username === currentUser.username)">
                {{ answer.author.username }}
              </div>
              <p>{{ answer.content }}</p>
              <div class="bubble-footer">
                <button 
                  class="btn-speak-sm" 
                  @click="handleToggleSpeech(answer.content, answer._id)"
                  :class="{ 'is-active': isSpeakingId === answer._id }"
                >
                  {{ isSpeakingId === answer._id ? '🛑' : '🔊' }}
                </button>
                <span class="answer-time">{{ new Date(answer.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
              </div>
            </div>
          </div>
        </transition-group>
        
        <div class="bottom-spacer"></div>
      </div>

    </div>

    <!-- Reply Modal Overlay -->
    <div v-if="showReplyModal" class="modal-mask" @click.self="showReplyModal = false">
      <div class="modal-container">
        <h3>撰寫回覆</h3>
        <textarea 
          v-model="newAnswer" 
          placeholder="分享你的看法..." 
          class="modal-textarea"
          rows="5"
        ></textarea>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showReplyModal = false">取消</button>
          <button class="btn-send" @click="submitAnswer" :disabled="!newAnswer.trim()">發送</button>
        </div>
      </div>
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
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  background: #eee;
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
  margin-bottom: 20px;
}

.card-actions {
  border-top: 1px solid #f0f0f0;
  padding-top: 15px;
  text-align: right;
}

.reply-btn-outline {
  background: white;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.reply-btn-outline:active {
  background: var(--primary-color);
  color: white;
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
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  background: #eee;
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
  background: #E1F5FE;
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

/* Modal Styles */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-container {
  background: white;
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

@keyframes popIn {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.modal-container h3 {
  margin-bottom: 15px;
  color: #333;
}

.modal-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: none;
  font-size: 1rem;
  margin-bottom: 15px;
  font-family: inherit;
}
.modal-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  background: #f5f5f5;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  color: #666;
  cursor: pointer;
}

.btn-send {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
}
.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Speech Buttons */
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 15px;
}

.btn-speak-main {
  flex-shrink: 0;
  background: #f0f7ff;
  border: 1px solid #cce5ff;
  color: #007bff;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-speak-main.is-speaking {
  background: #fff0f0;
  border-color: #ffcccc;
  color: #ff4444;
}

.bubble-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.btn-speak-sm {
  background: rgba(0,0,0,0.05);
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-speak-sm.is-active {
  background: var(--primary-color);
  color: white;
}

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