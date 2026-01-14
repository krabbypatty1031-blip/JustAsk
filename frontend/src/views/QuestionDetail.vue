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
  background: #F5F5F5;
  min-height: 100vh;
  padding-top: 70px;
}

/* Nav Bar */
.nav-bar {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: 70px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.25rem;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  border-bottom: 2px solid var(--border-color);
}

.back-btn {
  background: none;
  border: none;
  font-size: 1.75rem;
  color: var(--text-main);
  padding: 0.75rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.back-btn:hover,
.back-btn:focus {
  background: var(--bg-input);
  outline: none;
}

.nav-title {
  font-weight: 800;
  font-size: 1.25rem;
}

.placeholder { width: 48px; }

/* Question Header */
.question-header-card {
  background: #fff;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-sm);
  border: 2px solid var(--border-color);
  border-radius: 1rem;
}

.title {
  font-size: 1.75rem;
  margin-bottom: 1.25rem;
  line-height: 1.3;
  font-weight: 800;
  color: var(--text-main);
}

.author-row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 1.5rem;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  background: #eee;
  border: 2px solid var(--border-color);
}

.info {
  display: flex;
  flex-direction: column;
}

.name { font-weight: 800; color: var(--text-main); font-size: 1.125rem; }
.date { font-size: 1rem; color: var(--text-muted); }

.body-text {
  font-size: 1.25rem;
  line-height: 1.7;
  color: var(--text-main);
  white-space: pre-wrap;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.card-actions {
  border-top: 2px solid var(--border-color);
  padding-top: 1.25rem;
  text-align: right;
}

.reply-btn-outline {
  background: white;
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
  padding: 0.75rem 1.5rem;
  border-radius: 1.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 3rem;
}

.reply-btn-outline:hover,
.reply-btn-outline:focus {
  background: var(--primary-color);
  color: white;
  outline: none;
}

.reply-btn-outline:active {
  transform: scale(0.98);
}

/* Answers Area */
.answers-area {
  padding: 0 1.25rem;
}

.divider {
  text-align: center;
  margin: 2rem 0;
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 600;
  position: relative;
}
.divider::before, .divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 35%;
  height: 2px;
  background: var(--border-color);
}
.divider::before { left: 0; }
.divider::after { right: 0; }

.answer-item {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.answer-item.mine {
  flex-direction: row-reverse;
}

.answer-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  background: #eee;
  flex-shrink: 0;
  border: 2px solid var(--border-color);
}

.answer-bubble {
  background: #fff;
  padding: 1rem 1.25rem;
  border-radius: 1.5rem;
  border-top-left-radius: 0.25rem;
  box-shadow: var(--shadow-sm);
  max-width: 80%;
  position: relative;
  border: 2px solid var(--border-color);
}

.answer-item.mine .answer-bubble {
  background: #E3F2FD;
  border-radius: 1.5rem;
  border-top-right-radius: 0.25rem;
  border-color: #BBDEFB;
}

.answer-name {
  font-size: 1rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.answer-time {
  font-size: 0.875rem;
  color: var(--text-light);
  float: right;
  margin-top: 0.5rem;
  margin-left: 1rem;
}

.bottom-spacer { height: 100px; }

/* Modal Styles */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1.25rem;
}

.modal-container {
  background: white;
  width: 100%;
  max-width: 450px;
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: var(--shadow-lg);
  animation: popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  border: 2px solid var(--border-color);
}

@keyframes popIn {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.modal-container h3 {
  margin-bottom: 1.25rem;
  color: var(--text-main);
  font-size: 1.5rem;
  font-weight: 800;
}

.modal-textarea {
  width: 100%;
  padding: 1rem;
  border: 3px solid var(--border-color);
  border-radius: 1rem;
  resize: none;
  font-size: 1.125rem;
  margin-bottom: 1.25rem;
  font-family: inherit;
  line-height: 1.6;
  min-height: 120px;
}
.modal-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: var(--shadow-focus);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-cancel {
  background: #f5f5f5;
  border: 2px solid var(--border-color);
  padding: 0.75rem 1.5rem;
  border-radius: 1.5rem;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 1.125rem;
  cursor: pointer;
  min-height: 3rem;
}

.btn-cancel:hover {
  background: var(--bg-hover);
}

.btn-send {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 1.5rem;
  font-weight: 700;
  font-size: 1.125rem;
  cursor: pointer;
  min-height: 3rem;
  box-shadow: var(--shadow-md);
}

.btn-send:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Speech Buttons */
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.btn-speak-main {
  flex-shrink: 0;
  background: #E3F2FD;
  border: 2px solid #2196F3;
  color: #1976D2;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-speak-main:hover,
.btn-speak-main:focus {
  background: #BBDEFB;
  outline: none;
}

.btn-speak-main.is-speaking {
  background: #FFEBEE;
  border-color: #F44336;
  color: #D32F2F;
}

.bubble-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
}

.btn-speak-sm {
  background: var(--bg-input);
  border: 2px solid var(--border-color);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-speak-sm:hover,
.btn-speak-sm:focus {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  outline: none;
}

.btn-speak-sm.is-active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

/* Loading Spinner */
.loading-state {
  display: flex;
  justify-content: center;
  padding-top: 100px;
}
.spinner {
  width: 48px;
  height: 48px;
  border: 5px solid #f0f0f0;
  border-top: 5px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>