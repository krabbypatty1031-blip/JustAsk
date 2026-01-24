<script setup>
import { ref, inject, onMounted, onUnmounted, watch } from 'vue'
import axios from '../api/axios'
import { useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'

const router = useRouter()
const showToast = inject('showToast')
const isLoading = ref(false)

// 表单数据持久化 key
const STORAGE_KEY = 'justask_draft_question'

// 从 sessionStorage 恢复草稿
const loadDraft = () => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      const draft = JSON.parse(saved)
      return draft
    }
  } catch (e) {
    console.warn('Failed to load draft:', e)
  }
  return { title: '', content: '' }
}

const savedDraft = loadDraft()
const title = ref(savedDraft.title)
const content = ref(savedDraft.content)
const activeField = ref('title')

// 保存草稿到 sessionStorage
const saveDraft = () => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      title: title.value,
      content: content.value
    }))
  } catch (e) {
    console.warn('Failed to save draft:', e)
  }
}

// 清除草稿
const clearDraft = () => {
  sessionStorage.removeItem(STORAGE_KEY)
}

const topics = ['科技', '生活瑣事', '健康養生', '尋找鄰居', '二手買賣', '閒聊']

const selectTopic = (topic) => {
  title.value = `[${topic}] `
  activeField.value = 'title'
  saveDraft() // 保存草稿
}

// 监听表单变化，自动保存草稿
watch([title, content], () => {
  saveDraft()
}, { deep: true })

const isListening = ref(false)
const recognition = ref(null)
const isSpeechSupported = ref(false)
const speechLang = ref('zh-TW') // 默认繁体中文
const shouldRestartAfterStop = ref(false) // 标记是否需要在停止后重启

const languageOptions = [
  { code: 'zh-TW', label: '普通話' },
  { code: 'zh-HK', label: '粵語' }
]

const toggleLanguage = () => {
  const currentIndex = languageOptions.findIndex(lang => lang.code === speechLang.value)
  const nextIndex = (currentIndex + 1) % languageOptions.length
  speechLang.value = languageOptions[nextIndex].code

  // 如果正在录音，设置标记并停止，会在onend中重启
  if (isListening.value && recognition.value) {
    shouldRestartAfterStop.value = true
    recognition.value.stop()
  }
}

onMounted(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (SpeechRecognition) {
    isSpeechSupported.value = true
    recognition.value = new SpeechRecognition()
    recognition.value.continuous = true
    recognition.value.interimResults = true

    recognition.value.onstart = () => {
      isListening.value = true
      const langLabel = languageOptions.find(lang => lang.code === speechLang.value)?.label || '普通話'
      showToast(`正在聆聽 (${langLabel} - ${activeField.value === 'title' ? '標題' : '內容'})...`, 'info')
    }

    recognition.value.onend = () => {
      isListening.value = false

      // 如果需要重启（切换语言后），重新启动识别
      if (shouldRestartAfterStop.value) {
        shouldRestartAfterStop.value = false
        setTimeout(() => {
          if (recognition.value) {
            recognition.value.lang = speechLang.value
            recognition.value.start()
          }
        }, 100)
      }
    }

    recognition.value.onerror = (event) => {
      console.error('Speech recognition error', event.error)
      isListening.value = false
      shouldRestartAfterStop.value = false // 清除重启标记

      // 针对不同错误类型显示不同提示
      if (event.error === 'network') {
        showToast('網絡連接問題，請檢查網絡後重試', 'error')
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        showToast('請允許麥克風權限', 'error')
      } else if (event.error === 'language-not-supported') {
        showToast('當前語言不支持，請切換語言', 'error')
      } else {
        showToast('語音識別出錯，請重試', 'error')
      }
    }

    recognition.value.onresult = (event) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }

      if (finalTranscript) {
        if (activeField.value === 'title') {
          title.value = title.value + (title.value ? ' ' : '') + finalTranscript
        } else {
          content.value = content.value + (content.value ? ' ' : '') + finalTranscript
        }
      }
    }
  }
})

onUnmounted(() => {
  shouldRestartAfterStop.value = false
  if (recognition.value && isListening.value) {
    recognition.value.stop()
  }
})

const toggleSpeech = () => {
  if (!isSpeechSupported.value) {
    showToast('您的瀏覽器不支持語音輸入', 'error')
    return
  }

  try {
    if (isListening.value) {
      shouldRestartAfterStop.value = false // 用户主动停止，清除重启标记
      recognition.value.stop()
    } else {
      recognition.value.lang = speechLang.value
      recognition.value.start()
    }
  } catch (error) {
    console.error('Toggle speech error:', error)
    isListening.value = false
    showToast('語音功能啟動失敗，請重試', 'error')
  }
}

const handleSubmit = async () => {
  if (!title.value.trim() || !content.value.trim()) {
    return showToast('內容不能為空哦', 'error')
  }

  isLoading.value = true
  try {
    const response = await axios.post('/questions', {
      title: title.value,
      content: content.value
    })

    if (response.data.success) {
      clearDraft() // 发布成功后清除草稿
      showToast('發布成功！', 'success')
      router.push('/')
    }
  } catch (err) {
    if (err.response && err.response.status === 401) {
      showToast('請先登入', 'info')
      router.push('/login')
    } else {
      showToast('發布失敗', 'error')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="neu-create">
    <!-- Header -->
    <header class="neu-create-header">
      <button class="neu-back-btn" @click="router.push('/')" aria-label="取消">
        <Icon name="x-mark" :size="24" />
      </button>
      <h1 class="neu-create-title">發布提問</h1>
      <div class="neu-header-spacer"></div>
    </header>

    <!-- Scroll Content -->
    <div class="neu-scroll-content">
      <!-- Title Card -->
      <div class="neu-input-card" :class="{ 'active': activeField === 'title' }">
        <label class="neu-field-label">
          <Icon name="bookmark" :size="20" />
          <span>標題</span>
        </label>
        <input
          v-model="title"
          type="text"
          class="neu-title-input"
          placeholder="您想問什麼？"
          autofocus
          @focus="activeField = 'title'"
        />

        <!-- Topic Chips -->
        <div class="neu-topic-chips">
          <button
            v-for="t in topics"
            :key="t"
            class="neu-chip"
            @click="selectTopic(t)"
          >
            # {{ t }}
          </button>
        </div>
      </div>

      <!-- Content Card -->
      <div class="neu-input-card content-card" :class="{ 'active': activeField === 'content' }">
        <label class="neu-field-label">
          <Icon name="document-text" :size="20" />
          <span>詳細內容</span>
        </label>
        <textarea
          v-model="content"
          class="neu-content-input"
          placeholder="在這裡描述具體情況，大家會更清楚如何幫助您..."
          @focus="activeField = 'content'"
        ></textarea>
      </div>
    </div>

    <!-- Bottom Action Bar -->
    <div class="neu-action-bar">
      <!-- Speech Button -->
      <div v-if="isSpeechSupported" class="neu-speech-section">
        <transition name="fade-slide">
          <div v-if="isListening" class="neu-listening-status">
            <div class="neu-waves">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>正在聽您說...</p>
          </div>
        </transition>

        <div class="neu-speech-controls">
          <button
            class="neu-speech-btn"
            :class="{ 'active': isListening }"
            @click="toggleSpeech"
            :aria-label="isListening ? '停止語音輸入' : '開始語音輸入'"
          >
            <Icon v-if="isListening" name="stop" :size="32" />
            <Icon v-else name="microphone" :size="32" />
          </button>
          <button
            class="neu-lang-btn"
            @click="toggleLanguage"
            :aria-label="'切換語言'"
          >
            {{ languageOptions.find(lang => lang.code === speechLang)?.label || '普通話' }}
          </button>
        </div>
        <span class="neu-speech-hint">{{ isListening ? '點擊停止' : '語音輸入' }}</span>
      </div>

      <!-- Submit Button -->
      <button
        class="neu-submit-btn"
        @click="handleSubmit"
        :disabled="isLoading || !title.trim()"
      >
        <span v-if="isLoading" class="neu-loading">
          <span class="neu-spinner"></span>
          發布中...
        </span>
        <span v-else class="neu-submit-text">
          <Icon name="paper-airplane" :size="22" />
          好了，發布提問
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   NEUMORPHISM CREATE QUESTION PAGE
   ============================================ */
.neu-create {
  min-height: 100vh;
  background: var(--neu-bg);
  display: flex;
  flex-direction: column;
}

/* --- Header --- */
.neu-create-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--neu-bg);
  position: sticky;
  top: 0;
  z-index: 10;
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

.neu-create-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--neu-text);
}

.neu-header-spacer {
  width: 2.5rem;
}

/* --- Scroll Content --- */
.neu-scroll-content {
  flex: 1;
  padding: 1rem 1.5rem;
  padding-bottom: 14rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* --- Input Cards --- */
.neu-input-card {
  background: var(--neu-bg);
  border-radius: 1.25rem;
  padding: 1.25rem;
  box-shadow: var(--neu-shadow-out);
  transition: all 0.3s ease;
}

.neu-input-card.active {
  box-shadow: var(--neu-shadow-out-lg);
  transform: translateY(-2px);
}

.neu-field-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--neu-text-muted);
  margin-bottom: 0.75rem;
}

.neu-field-label svg {
  color: var(--neu-primary);
}

.neu-title-input {
  width: 100%;
  font-size: 1.25rem;
  font-weight: 700;
  background: transparent;
  border: none;
  outline: none;
  padding: 0.5rem 0;
  color: var(--neu-text);
}

.neu-title-input::placeholder {
  color: var(--neu-text-light);
  font-weight: 500;
}

.neu-content-input {
  width: 100%;
  height: 12rem;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.7;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  color: var(--neu-text);
}

.neu-content-input::placeholder {
  color: var(--neu-text-light);
}

/* --- Topic Chips --- */
.neu-topic-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--neu-bg-dark);
}

.neu-chip {
  background: var(--neu-bg);
  color: var(--neu-text-muted);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  box-shadow: var(--neu-shadow-out-sm);
  transition: all 0.2s ease;
}

.neu-chip:hover {
  color: var(--neu-primary);
  transform: translateY(-2px);
  box-shadow: var(--neu-shadow-out);
}

.neu-chip:active {
  transform: translateY(0);
  box-shadow: var(--neu-shadow-in);
}

/* --- Action Bar --- */
.neu-action-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  background: var(--neu-bg);
  padding: 1.25rem 1.5rem calc(2rem + var(--sab));
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

/* --- Speech Section --- */
.neu-speech-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}

.neu-speech-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.neu-speech-btn {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 50%;
  background: var(--neu-bg);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--neu-primary);
  box-shadow: var(--neu-shadow-out);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
}

.neu-speech-btn:hover:not(.active) {
  transform: scale(1.05);
  box-shadow: var(--neu-shadow-out-lg);
}

.neu-speech-btn:active:not(.active) {
  transform: scale(0.95);
  box-shadow: var(--neu-shadow-in);
}

.neu-speech-btn.active {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 6px 6px 12px rgba(220, 38, 38, 0.3),
              -3px -3px 8px rgba(255, 255, 255, 0.8),
              0 4px 16px rgba(239, 68, 68, 0.5);
  transform: scale(1.1);
  animation: pulse-recording 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.neu-speech-btn.active::before {
  content: '';
  position: absolute;
  width: 1.25rem;
  height: 1.25rem;
  background: white;
  border-radius: 0.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.neu-speech-btn.active svg {
  display: none;
}

@keyframes pulse-recording {
  0%, 100% {
    box-shadow: 6px 6px 12px rgba(220, 38, 38, 0.3),
                -3px -3px 8px rgba(255, 255, 255, 0.8),
                0 4px 16px rgba(239, 68, 68, 0.5);
  }
  50% {
    box-shadow: 6px 6px 16px rgba(220, 38, 38, 0.4),
                -3px -3px 8px rgba(255, 255, 255, 0.8),
                0 6px 24px rgba(239, 68, 68, 0.7);
  }
}

.neu-lang-btn {
  padding: 0.75rem 1.25rem;
  background: var(--neu-bg);
  border: none;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--neu-text);
  cursor: pointer;
  box-shadow: var(--neu-shadow-out-sm);
  transition: all 0.3s ease;
  min-width: 4rem;
  white-space: nowrap;
}

.neu-lang-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--neu-shadow-out);
  color: var(--neu-primary);
}

.neu-lang-btn:active {
  transform: translateY(0);
  box-shadow: var(--neu-shadow-in);
}

.neu-speech-hint {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--neu-text-muted);
}

.neu-listening-status {
  position: absolute;
  bottom: calc(100% + 1rem);
  background: var(--neu-bg);
  padding: 0.75rem 1.25rem;
  border-radius: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  white-space: nowrap;
  box-shadow: var(--neu-shadow-out);
  color: var(--neu-text);
  font-weight: 600;
  font-size: 0.875rem;
}

.neu-waves {
  display: flex;
  gap: 3px;
}

.neu-waves span {
  width: 4px;
  height: 16px;
  background: var(--neu-primary);
  border-radius: 2px;
  animation: wave 0.8s infinite alternate;
}

.neu-waves span:nth-child(2) { animation-delay: 0.2s; }
.neu-waves span:nth-child(3) { animation-delay: 0.4s; }

@keyframes wave {
  from { height: 6px; }
  to { height: 20px; }
}

/* --- Submit Button --- */
.neu-submit-btn {
  width: 100%;
  padding: 1.125rem 2rem;
  font-size: 1.125rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-dark) 100%);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.1),
              -4px -4px 10px rgba(255, 255, 255, 0.7),
              0 4px 16px rgba(20, 184, 166, 0.35);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.neu-submit-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.12),
              -6px -6px 12px rgba(255, 255, 255, 0.8),
              0 8px 24px rgba(20, 184, 166, 0.45);
}

.neu-submit-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.15),
              inset -2px -2px 4px rgba(255, 255, 255, 0.1);
}

.neu-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.neu-submit-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.neu-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.neu-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* --- Transitions --- */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* --- Responsive --- */
@media (max-width: 400px) {
  .neu-scroll-content {
    padding: 1rem;
    padding-bottom: 14rem;
  }

  .neu-action-bar {
    padding: 1rem 1rem calc(1.5rem + var(--sab));
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
