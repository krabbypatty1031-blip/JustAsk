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

const handleThank = async (answer) => {
  if (!currentUser.value) {
    showToast('請先登入', 'info')
    router.push('/login')
    return
  }
  
  if (answer.hasThanked) {
    showToast('您已經感謝過了', 'info')
    return
  }

  // Optimistic update
  if (!answer.thanks) answer.thanks = 0
  answer.thanks++
  answer.hasThanked = true
  
  try {
    await axios.post(`/questions/${question.value._id}/answers/${answer._id}/thank`)
    showToast('已發送感謝！', 'success')
  } catch (e) {
    answer.thanks-- // Revert on error
    answer.hasThanked = false
    const msg = e.response?.data?.message || '操作失敗'
    showToast(msg, 'error')
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
      
      <!-- Question Card (OP) - Warm Theme -->
      <div class="question-card">
        <div class="card-header">
          <img :src="getAvatarUrl(question.author.username)" class="avatar-lg" alt="avatar" />
          <div class="user-meta">
            <span class="username">{{ question.author.username }}</span>
            <span class="post-time">{{ new Date(question.createdAt).toLocaleString() }}</span>
          </div>
          <button 
            class="btn-speak-icon" 
            @click="handleToggleSpeech(`${question.title}。${question.content}`, 'question')"
            :class="{ 'is-speaking': isSpeakingId === 'question' }"
            :aria-label="isSpeakingId === 'question' ? '停止朗讀' : '朗讀問題'"
          >
            <span class="icon">{{ isSpeakingId === 'question' ? '🛑' : '🔊' }}</span>
            <span class="label">{{ isSpeakingId === 'question' ? '停止' : '聽問題' }}</span>
          </button>
        </div>
        
        <h1 class="question-title">{{ question.title }}</h1>
        
        <div class="question-body" :class="{ 'highlight-read': isSpeakingId === 'question' }">
          {{ question.content }}
        </div>

        <div class="question-footer">
          <div class="stats">
            <span>👁 {{ question.views || 0 }} 次瀏覽</span>
            <span>💬 {{ question.answers.length }} 條回答</span>
          </div>
        </div>
      </div>

      <!-- Answers List -->
      <div class="answers-section" ref="answersContainer">
        <div class="section-divider">
          <span class="divider-label">大家的回答</span>
        </div>

        <transition-group name="list">
          <div 
            v-for="answer in question.answers" 
            :key="answer._id" 
            class="answer-card"
            :class="{ 
              'mine': currentUser && answer.author.username === currentUser.username,
              'highlight-read': isSpeakingId === answer._id
            }"
          >
            <div class="answer-header">
              <div class="user-info">
                <img :src="getAvatarUrl(answer.author.username)" class="avatar-sm" alt="avatar" />
                <span class="answer-username">{{ answer.author.username }}</span>
              </div>
              <span class="answer-time">{{ new Date(answer.createdAt).toLocaleDateString() }}</span>
            </div>
            
            <div class="answer-content">
              {{ answer.content }}
            </div>

            <div class="answer-actions">
              <button 
                class="action-btn speak-btn" 
                @click="handleToggleSpeech(answer.content, answer._id)"
                :class="{ 'active': isSpeakingId === answer._id }"
              >
                <span class="icon">{{ isSpeakingId === answer._id ? '🛑' : '🔊' }}</span>
                {{ isSpeakingId === answer._id ? '停止' : '聽回答' }}
              </button>
              
              <!-- 'Like' feature -->
              <button 
                class="action-btn like-btn" 
                @click="handleThank(answer)"
                :class="{ 'thanked': answer.hasThanked }"
                :disabled="answer.hasThanked"
              >
                <span class="icon">{{ answer.hasThanked ? '❤️' : '👍' }}</span> 
                {{ answer.hasThanked ? '已感謝' : '謝謝' }} {{ answer.thanks ? `(${answer.thanks})` : '' }}
              </button>
            </div>
          </div>
        </transition-group>
        
        <div class="bottom-spacer"></div>
      </div>

    </div>

    <!-- Bottom Input Bar (Fixed) -->
    <div class="bottom-input-bar">
      <button class="btn-input-trigger" @click="openReplyModal">
        <span class="icon">✎</span>
        <span class="text">我來回答這個問題...</span>
      </button>
    </div>

    <!-- Bottom Sheet Modal (Slide Up) -->
    <transition name="slide-up">
      <div v-if="showReplyModal" class="bottom-sheet-mask" @click.self="showReplyModal = false">
        <div class="bottom-sheet">
          <div class="sheet-header">
            <h3>撰寫回答</h3>
            <button class="btn-close" @click="showReplyModal = false">✕</button>
          </div>
          
          <textarea 
            v-model="newAnswer" 
            placeholder="請輸入您的看法，溫暖的回答能幫助到更多人..." 
            class="sheet-textarea"
            rows="5"
            autofocus
          ></textarea>
          
          <div class="sheet-footer">
            <button class="btn-primary btn-block btn-lg" @click="submitAnswer" :disabled="!newAnswer.trim()">
              發布回答
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
.detail-view {
  background: var(--bg-body);
  min-height: 100vh;
  padding-top: 70px;
  padding-bottom: 100px; /* Increased space for the fixed input bar */
}

/* Nav Bar */
.nav-bar {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: calc(64px + var(--sat)); /* Add top safe area */
  padding-top: var(--sat);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: calc(1rem + var(--sal));
  padding-right: calc(1rem + var(--sar));
  z-index: 100;
  border-bottom: 1px solid var(--border-color);
}

.bottom-input-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  background: white;
  padding: 0.75rem 1rem calc(1.5rem + var(--sab)); /* Safe area padding */
  border-top: 1px solid var(--border-color);
  box-shadow: 0 -4px 10px rgba(0,0,0,0.05);
  z-index: 90;
}


.back-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-main);
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.back-btn:hover { background: var(--bg-input); }

.nav-title {
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--text-main);
}

.placeholder { width: 40px; }

/* Content Wrapper */
.content-wrapper {
  padding: 1rem;
}

/* --- Question Card (OP) --- */
.question-card {
  background: #FFFBF7; /* Very light warm orange bg */
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  margin-bottom: 2rem;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.avatar-lg {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: var(--shadow-sm);
  object-fit: cover;
}

.user-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-main);
}

.post-time {
  font-size: 0.875rem;
  color: var(--text-muted);
}

/* Speak Button */
.btn-speak-icon {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 2rem;
  padding: 0.5rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.btn-speak-icon .icon { font-size: 1.25rem; }
.btn-speak-icon .label { font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); }

.btn-speak-icon.is-speaking {
  background: #FEF2F2;
  border-color: #EF4444;
  color: #EF4444;
}

.question-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 1rem;
  line-height: 1.4;
}

.question-body {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--text-secondary);
  white-space: pre-wrap;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255,255,255,0.5);
  border-radius: var(--radius-md);
  transition: background 0.3s;
}

.question-body.highlight-read {
  background: #FEF3C7; /* Highlight active reading */
}

.question-footer {
  border-top: 1px solid rgba(0,0,0,0.05);
  padding-top: 1rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

/* --- Answers Section --- */
.section-divider {
  display: flex;
  align-items: center;
  margin: 0 0 1.5rem;
}

.divider-label {
  background: var(--bg-body);
  padding-right: 1rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-main);
}

.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.answer-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.answer-card.highlight-read {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-light);
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar-sm {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-color);
}

.answer-username {
  font-weight: 700;
  color: var(--text-main);
}

.answer-time {
  font-size: 0.875rem;
  color: var(--text-light);
}

.answer-content {
  font-size: 1.125rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.answer-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.action-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--bg-input);
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.action-btn.active {
  background: var(--primary-light);
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.action-btn.thanked {
  background: #FFF0F0;
  color: #E11D48;
  border-color: #FECDD3;
  cursor: default;
}

/* --- Fixed Bottom Input Bar --- */
.bottom-input-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  background: white;
  padding: 0.75rem 1rem 1.5rem; /* Safe area padding */
  border-top: 1px solid var(--border-color);
  box-shadow: 0 -4px 10px rgba(0,0,0,0.05);
  z-index: 90;
}

.btn-input-trigger {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 2rem;
  padding: 0.875rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: text;
  color: var(--text-muted);
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-input-trigger:hover {
  background: white;
  border-color: var(--primary-color);
  color: var(--text-secondary);
}

/* --- Bottom Sheet Modal --- */
.bottom-sheet-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bottom-sheet {
  background: white;
  width: 100%;
  max-width: 480px;
  border-top-left-radius: 1.5rem;
  border-top-right-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 -10px 40px rgba(0,0,0,0.2);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.sheet-header h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
}

.btn-close {
  background: var(--bg-input);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 1rem;
}

.sheet-textarea {
  width: 100%;
  border: 2px solid var(--border-color);
  border-radius: 1rem;
  padding: 1rem;
  font-size: 1.125rem;
  resize: none;
  background: var(--bg-body);
  margin-bottom: 1.5rem;
  display: block;
}

.sheet-textarea:focus {
  outline: none;
  background: white;
  border-color: var(--primary-color);
}

.sheet-footer {
  display: flex;
}

/* Transitions */
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(100%);
}
</style>