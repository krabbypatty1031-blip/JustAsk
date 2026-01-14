<script setup>
import { ref, inject, onMounted, onUnmounted } from 'vue'
import axios from '../api/axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const showToast = inject('showToast')
const isLoading = ref(false)

const title = ref('')
const content = ref('')
const activeField = ref('title') // Track focused field, default to title (autofocus)

const isListening = ref(false)
const recognition = ref(null)
const isSpeechSupported = ref(false)

onMounted(() => {
  // Check for browser support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (SpeechRecognition) {
    isSpeechSupported.value = true
    recognition.value = new SpeechRecognition()
    recognition.value.continuous = true // Keep listening even if user pauses
    recognition.value.interimResults = true // Show partial results
    recognition.value.lang = 'zh-TW' // Default to Traditional Chinese

    recognition.value.onstart = () => {
      isListening.value = true
      showToast(`正在聆聽 (${activeField.value === 'title' ? '標題' : '內容'})...`, 'info')
    }

    recognition.value.onend = () => {
      isListening.value = false
    }

    recognition.value.onerror = (event) => {
      console.error('Speech recognition error', event.error)
      isListening.value = false
      showToast('語音識別出錯，請重試', 'error')
    }

    recognition.value.onresult = (event) => {
      let finalTranscript = ''
      // Loop through results to get the final transcript
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }
      
      if (finalTranscript) {
        // Append text to the active field
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
  if (recognition.value && isListening.value) {
    recognition.value.stop()
  }
})

const toggleSpeech = () => {
  if (!isSpeechSupported.value) {
    showToast('您的瀏覽器不支持語音輸入', 'error')
    return
  }

  if (isListening.value) {
    recognition.value.stop()
  } else {
    recognition.value.start()
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
  <div class="create-view">
    <div class="nav-bar">
      <button class="text-btn cancel" @click="router.back()">取消</button>
      <span class="title">提問</span>
      <button class="text-btn submit" @click="handleSubmit" :disabled="isLoading">發布</button>
    </div>

    <div class="form-area">
      <input 
        v-model="title" 
        type="text" 
        class="input-title" 
        placeholder="請輸入標題:" 
        autofocus
        @focus="activeField = 'title'"
      />
      <div class="divider"></div>
      <textarea 
        v-model="content" 
        class="input-content" 
        placeholder="詳細描述您的問題，以便大家更好地幫助您..."
        @focus="activeField = 'content'"
      ></textarea>
    </div>

    <!-- Modern Elderly-Friendly Speech Button -->
    <div v-if="isSpeechSupported" class="speech-container">
      <transition name="fade-slide">
        <div v-if="isListening" class="listening-status">
          <div class="waves">
            <span></span><span></span><span></span>
          </div>
          <p>正在聆聽...</p>
        </div>
      </transition>

      <button 
        class="speech-fab" 
        :class="{ 'is-active': isListening }"
        @click="toggleSpeech"
        :aria-label="isListening ? '停止錄音' : '開始語音輸入'"
      >
        <div class="fab-content">
          <!-- Stop Icon -->
          <svg v-if="isListening" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <rect x="6" y="6" width="12" height="12" rx="3" ry="3"></rect>
          </svg>
          <!-- Mic Icon -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
          <span class="fab-label">{{ isListening ? '點擊停止' : '按我說話' }}</span>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.create-view {
  min-height: 100vh;
  background: var(--bg-body);
  position: relative;
  display: flex;
  flex-direction: column;
}

.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  z-index: 10;
}

.title { 
  font-weight: 800; 
  font-size: 1.25rem; 
  color: var(--text-main);
}

.text-btn {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.text-btn.cancel { color: var(--text-muted); }
.text-btn.cancel:hover { background: var(--bg-input); color: var(--text-main); }
.text-btn.submit { 
  background: var(--primary-light); 
  color: var(--primary-color); 
}
.text-btn.submit:hover { 
  background: var(--primary-color); 
  color: white; 
}
.text-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.form-area {
  flex: 1;
  padding: 1.5rem;
  background: white;
  margin: 1rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.input-title {
  width: 100%;
  font-size: 1.5rem;
  font-weight: 700;
  border: none;
  outline: none;
  padding: 0.5rem 0;
  color: var(--text-main);
  background: transparent;
}
.input-title::placeholder { color: var(--text-light); }

.divider {
  height: 1px;
  background: var(--border-color);
  margin: 1rem 0;
}

.input-content {
  width: 100%;
  height: calc(100vh - 350px);
  border: none;
  outline: none;
  font-size: 1.125rem;
  line-height: 1.6;
  resize: none;
  color: var(--text-secondary);
  background: transparent;
}
.input-content::placeholder { color: var(--text-light); }

/* --- Enhanced Speech Interface --- */
.speech-container {
  position: fixed;
  bottom: 8.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 100;
  width: 100%;
  pointer-events: none; /* Let clicks pass through container */
}

.speech-fab {
  pointer-events: auto;
  width: 5.5rem;
  height: 5.5rem;
  border-radius: 50%;
  background: white;
  color: var(--primary-color);
  border: 1px solid var(--border-color);
  box-shadow: 0 8px 30px rgba(249, 115, 22, 0.25);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.fab-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  z-index: 2;
}

.fab-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Hover State */
.speech-fab:hover {
  transform: scale(1.05) translateY(-4px);
  box-shadow: 0 12px 40px rgba(249, 115, 22, 0.35);
  border-color: var(--primary-color);
}

/* Active / Listening State */
.speech-fab.is-active {
  background: var(--primary-gradient);
  color: white;
  border-color: transparent;
  transform: scale(1.1);
  box-shadow: 0 15px 50px rgba(249, 115, 22, 0.5);
}

.speech-fab.is-active .fab-label {
  color: rgba(255,255,255,0.9);
}

/* Listening Status Bubble */
.listening-status {
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid var(--primary-light);
  color: var(--primary-color);
  font-weight: 700;
  font-size: 1.125rem;
}

/* Sound Wave Animation */
.waves {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 20px;
}

.waves span {
  display: block;
  width: 4px;
  background: var(--primary-color);
  border-radius: 4px;
  animation: wave 1s infinite ease-in-out;
}

.waves span:nth-child(1) { animation-delay: 0s; height: 10px; }
.waves span:nth-child(2) { animation-delay: 0.1s; height: 20px; }
.waves span:nth-child(3) { animation-delay: 0.2s; height: 15px; }

@keyframes wave {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.5); }
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>