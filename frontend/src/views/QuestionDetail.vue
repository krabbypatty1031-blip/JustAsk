<script setup>
import { ref, onMounted, inject, nextTick, onUnmounted } from 'vue'
import axios from '../api/axios'
import { useRoute, useRouter } from 'vue-router'
import { getAvatarUrl } from '../utils/avatar'
import Icon from '../components/Icon.vue'

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

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-HK'
  utterance.rate = 0.85
  utterance.pitch = 1.0

  utterance.onstart = () => {
    isSpeakingId.value = id
  }

  utterance.onend = () => {
    isSpeakingId.value = null
  }

  utterance.onerror = (event) => {
    isSpeakingId.value = null
    if (event.error === 'interrupted' || event.error === 'canceled') {
      return
    }
    showToast('語音播報失敗', 'error')
  }

  window.speechSynthesis.speak(utterance)
}

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
      showReplyModal.value = false
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

  if (!answer.thanks) answer.thanks = 0
  answer.thanks++
  answer.hasThanked = true

  try {
    await axios.post(`/questions/${question.value._id}/answers/${answer._id}/thank`)
    showToast('已發送感謝！', 'success')
  } catch (e) {
    answer.thanks--
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
  <div class="neu-detail">
    <!-- Top Navigation Bar -->
    <header class="neu-nav-bar">
      <button class="neu-back-btn" @click="router.back()" aria-label="返回">
        <Icon name="arrow-left" :size="24" />
      </button>
      <span class="neu-nav-title">詳情</span>
      <div class="neu-nav-spacer"></div>
    </header>

    <!-- Loading State -->
    <div v-if="isLoading" class="neu-loading-state">
      <span class="neu-spinner"></span>
    </div>

    <!-- Content -->
    <div v-else-if="question" class="neu-content-wrapper">
      <!-- Question Card -->
      <article class="neu-question-card">
        <div class="neu-card-header">
          <div class="neu-avatar-wrapper">
            <img :src="getAvatarUrl(question.authorName || question.author?.username || '匿名')" class="neu-avatar" alt="avatar" />
          </div>
          <div class="neu-user-meta">
            <span class="neu-username">{{ question.authorName || question.author?.username || '匿名用戶' }}</span>
            <span class="neu-post-time">{{ new Date(question.createdAt).toLocaleString() }}</span>
          </div>
          <button
            class="neu-speak-btn"
            @click="handleToggleSpeech(`${question.title}。${question.content}`, 'question')"
            :class="{ 'active': isSpeakingId === 'question' }"
            :aria-label="isSpeakingId === 'question' ? '停止朗讀' : '朗讀問題'"
          >
            <Icon :name="isSpeakingId === 'question' ? 'stop' : 'speaker-wave'" :size="18" />
            <span>{{ isSpeakingId === 'question' ? '停止' : '聽問題' }}</span>
          </button>
        </div>

        <h1 class="neu-question-title">{{ question.title }}</h1>

        <div class="neu-question-body" :class="{ 'highlight': isSpeakingId === 'question' }">
          {{ question.content }}
        </div>

        <div class="neu-question-footer">
          <div class="neu-stats">
            <span>
              <Icon name="eye" :size="16" />
              {{ question.views || 0 }} 次瀏覽
            </span>
            <span>
              <Icon name="chat-bubble-left-ellipsis" :size="16" />
              {{ question.answers.length }} 條回答
            </span>
          </div>
        </div>
      </article>

      <!-- Answers Section -->
      <section class="neu-answers-section" ref="answersContainer">
        <div class="neu-section-divider">
          <span class="neu-divider-label">大家的回答</span>
        </div>

        <transition-group name="list">
          <article
            v-for="answer in question.answers"
            :key="answer._id"
            class="neu-answer-card"
            :class="{
              'mine': currentUser && (answer.authorName || answer.author?.username) === currentUser.username,
              'highlight': isSpeakingId === answer._id
            }"
          >
            <div class="neu-answer-header">
              <div class="neu-user-info">
                <div class="neu-avatar-sm-wrapper">
                  <img :src="getAvatarUrl(answer.authorName || answer.author?.username || '匿名')" class="neu-avatar-sm" alt="avatar" />
                </div>
                <span class="neu-answer-username">{{ answer.authorName || answer.author?.username || '匿名用戶' }}</span>
              </div>
              <span class="neu-answer-time">{{ new Date(answer.createdAt).toLocaleDateString() }}</span>
            </div>

            <div class="neu-answer-content">
              {{ answer.content }}
            </div>

            <div class="neu-answer-actions">
              <button
                class="neu-action-btn"
                @click="handleToggleSpeech(answer.content, answer._id)"
                :class="{ 'active': isSpeakingId === answer._id }"
              >
                <Icon :name="isSpeakingId === answer._id ? 'stop' : 'speaker-wave'" :size="16" />
                {{ isSpeakingId === answer._id ? '停止' : '聽回答' }}
              </button>

              <button
                class="neu-action-btn thank-btn"
                @click="handleThank(answer)"
                :class="{ 'thanked': answer.hasThanked }"
                :disabled="answer.hasThanked"
              >
                <Icon :name="answer.hasThanked ? 'heart' : 'hand-thumb-up'" :size="16" />
                {{ answer.hasThanked ? '已感謝' : '謝謝' }}
                <span v-if="answer.thanks">({{ answer.thanks }})</span>
              </button>
            </div>
          </article>
        </transition-group>

        <div class="neu-bottom-spacer"></div>
      </section>
    </div>

    <!-- Bottom Input Bar -->
    <div class="neu-bottom-bar">
      <button class="neu-input-trigger" @click="openReplyModal">
        <Icon name="pencil" :size="18" />
        <span>我來回答這個問題...</span>
      </button>
    </div>

    <!-- Reply Modal -->
    <transition name="slide-up">
      <div v-if="showReplyModal" class="neu-modal-mask" @click.self="showReplyModal = false">
        <div class="neu-modal-sheet">
          <div class="neu-sheet-header">
            <h3>撰寫回答</h3>
            <button class="neu-close-btn" @click="showReplyModal = false">
              <Icon name="x-mark" :size="20" />
            </button>
          </div>

          <textarea
            v-model="newAnswer"
            placeholder="請輸入您的看法，溫暖的回答能幫助到更多人..."
            class="neu-sheet-textarea"
            rows="5"
            autofocus
          ></textarea>

          <div class="neu-sheet-footer">
            <button class="neu-submit-btn" @click="submitAnswer" :disabled="!newAnswer.trim()">
              <Icon name="paper-airplane" :size="20" />
              發布回答
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* ============================================
   NEUMORPHISM QUESTION DETAIL PAGE
   ============================================ */
.neu-detail {
  min-height: 100vh;
  background: var(--neu-bg);
  padding-top: calc(4rem + var(--sat));
  padding-bottom: calc(5rem + var(--sab));
}

/* --- Navigation Bar --- */
.neu-nav-bar {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: calc(4rem + var(--sat));
  padding-top: var(--sat);
  background: var(--neu-bg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 1rem;
  padding-right: 1rem;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.neu-back-btn {
  width: 2.5rem;
  height: 2.5rem;
  background: var(--neu-bg);
  border: none;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--neu-text);
  box-shadow: var(--neu-shadow-out-sm);
  transition: all 0.2s ease;
}

.neu-back-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--neu-shadow-out);
}

.neu-back-btn:active {
  transform: translateY(0);
  box-shadow: var(--neu-shadow-in);
}

.neu-nav-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--neu-text);
}

.neu-nav-spacer {
  width: 2.5rem;
}

/* --- Loading State --- */
.neu-loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
}

.neu-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--neu-bg-dark);
  border-top-color: var(--neu-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* --- Content Wrapper --- */
.neu-content-wrapper {
  padding: 1rem;
}

/* --- Question Card --- */
.neu-question-card {
  background: var(--neu-bg);
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: var(--neu-shadow-out);
  margin-bottom: 1.5rem;
}

.neu-card-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 1.25rem;
}

.neu-avatar-wrapper {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 50%;
  background: var(--neu-bg);
  box-shadow: var(--neu-shadow-out-sm);
  padding: 3px;
}

.neu-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.neu-user-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.neu-username {
  font-size: 1rem;
  font-weight: 700;
  color: var(--neu-text);
}

.neu-post-time {
  font-size: 0.8125rem;
  color: var(--neu-text-muted);
}

.neu-speak-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: var(--neu-bg);
  border: none;
  border-radius: 2rem;
  padding: 0.5rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--neu-text-muted);
  cursor: pointer;
  box-shadow: var(--neu-shadow-out-sm);
  transition: all 0.2s ease;
}

.neu-speak-btn:hover {
  color: var(--neu-primary);
}

.neu-speak-btn.active {
  background: var(--neu-error);
  color: white;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
}

.neu-question-title {
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--neu-text);
  margin-bottom: 1rem;
  line-height: 1.4;
}

.neu-question-body {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--neu-text-muted);
  white-space: pre-wrap;
  margin-bottom: 1.25rem;
  padding: 1rem;
  background: var(--neu-bg);
  border-radius: 1rem;
  box-shadow: var(--neu-shadow-in);
  transition: background 0.3s ease;
}

.neu-question-body.highlight {
  background: rgba(245, 158, 11, 0.1);
}

.neu-question-footer {
  padding-top: 1rem;
  border-top: 1px solid var(--neu-bg-dark);
}

.neu-stats {
  display: flex;
  gap: 1.25rem;
  font-size: 0.8125rem;
  color: var(--neu-text-muted);
  font-weight: 500;
}

.neu-stats span {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

/* --- Answers Section --- */
.neu-answers-section {
  margin-top: 0.5rem;
}

.neu-section-divider {
  display: flex;
  align-items: center;
  margin-bottom: 1.25rem;
}

.neu-divider-label {
  font-size: 1rem;
  font-weight: 700;
  color: var(--neu-text);
  padding-right: 1rem;
}

.neu-section-divider::after {
  content: '';
  flex: 1;
  height: 2px;
  background: var(--neu-bg-dark);
}

/* --- Answer Card --- */
.neu-answer-card {
  background: var(--neu-bg);
  border-radius: 1.25rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow: var(--neu-shadow-out);
  transition: all 0.3s ease;
}

.neu-answer-card.highlight {
  box-shadow: var(--neu-shadow-out-lg),
              0 0 0 2px var(--neu-primary);
}

.neu-answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.neu-user-info {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.neu-avatar-sm-wrapper {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: var(--neu-bg);
  box-shadow: var(--neu-shadow-out-sm);
  padding: 2px;
}

.neu-avatar-sm {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.neu-answer-username {
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--neu-text);
}

.neu-answer-time {
  font-size: 0.8125rem;
  color: var(--neu-text-light);
}

.neu-answer-content {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--neu-text-muted);
  margin-bottom: 1rem;
}

.neu-answer-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.neu-action-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: var(--neu-bg);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--neu-text-muted);
  cursor: pointer;
  box-shadow: var(--neu-shadow-out-sm);
  transition: all 0.2s ease;
}

.neu-action-btn:hover {
  color: var(--neu-primary);
  transform: translateY(-2px);
  box-shadow: var(--neu-shadow-out);
}

.neu-action-btn.active {
  background: var(--neu-primary);
  color: white;
  box-shadow: 0 4px 10px rgba(20, 184, 166, 0.3);
}

.neu-action-btn.thank-btn.thanked {
  background: rgba(239, 68, 68, 0.1);
  color: var(--neu-error);
  box-shadow: none;
  cursor: default;
}

.neu-action-btn.thank-btn.thanked:hover {
  transform: none;
}

.neu-bottom-spacer {
  height: 2rem;
}

/* --- Bottom Input Bar --- */
.neu-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  background: var(--neu-bg);
  padding: 0.875rem 1rem calc(1.25rem + var(--sab));
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
  z-index: 90;
}

.neu-input-trigger {
  width: 100%;
  background: var(--neu-bg);
  border: none;
  border-radius: 2rem;
  padding: 0.875rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  cursor: text;
  color: var(--neu-text-muted);
  font-size: 0.9375rem;
  font-weight: 500;
  box-shadow: var(--neu-shadow-in);
  transition: all 0.2s ease;
}

.neu-input-trigger:hover {
  color: var(--neu-primary);
}

/* --- Modal Sheet --- */
.neu-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.neu-modal-sheet {
  background: var(--neu-bg);
  width: 100%;
  max-width: 480px;
  border-top-left-radius: 1.5rem;
  border-top-right-radius: 1.5rem;
  padding: 1.5rem;
  padding-bottom: calc(1.5rem + var(--sab));
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.2);
}

.neu-sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.neu-sheet-header h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--neu-text);
}

.neu-close-btn {
  width: 2rem;
  height: 2rem;
  background: var(--neu-bg);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--neu-text-muted);
  box-shadow: var(--neu-shadow-out-sm);
  transition: all 0.2s ease;
}

.neu-close-btn:hover {
  color: var(--neu-error);
}

.neu-sheet-textarea {
  width: 100%;
  background: var(--neu-bg);
  border: none;
  border-radius: 1rem;
  padding: 1rem;
  font-size: 1rem;
  line-height: 1.6;
  resize: none;
  box-shadow: var(--neu-shadow-in);
  margin-bottom: 1.25rem;
  color: var(--neu-text);
}

.neu-sheet-textarea::placeholder {
  color: var(--neu-text-light);
}

.neu-sheet-textarea:focus {
  outline: none;
  box-shadow: var(--neu-shadow-in-deep),
              0 0 0 3px rgba(20, 184, 166, 0.15);
}

.neu-sheet-footer {
  display: flex;
}

.neu-submit-btn {
  flex: 1;
  padding: 1rem;
  font-size: 1.0625rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-dark) 100%);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.1),
              -4px -4px 10px rgba(255, 255, 255, 0.7),
              0 4px 16px rgba(20, 184, 166, 0.35);
  transition: all 0.3s ease;
}

.neu-submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.12),
              -6px -6px 12px rgba(255, 255, 255, 0.8),
              0 6px 20px rgba(20, 184, 166, 0.45);
}

.neu-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* --- Transitions --- */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* --- Responsive --- */
@media (max-width: 400px) {
  .neu-content-wrapper {
    padding: 0.75rem;
  }

  .neu-question-card {
    padding: 1.25rem;
  }

  .neu-answer-card {
    padding: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
