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

    <!-- Speech Button -->
    <div v-if="isSpeechSupported" class="speech-wrapper">
      <div v-if="isListening" class="listening-tip">正在聽您說... (點擊停止)</div>
      <button 
        class="speech-btn" 
        :class="{ listening: isListening }"
        @click="toggleSpeech"
      >
        <span class="mic-icon">
          <!-- Stop Icon -->
          <svg v-if="isListening" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
          </svg>
          <!-- Mic Icon -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </span>
        <span v-if="!isListening" class="btn-text">語音輸入</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.create-view {
  min-height: 100vh;
  background: white;
  position: relative;
}

.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 2px solid var(--border-color);
  background: #fff;
}

.title { font-weight: 800; font-size: 1.25rem; }

.text-btn {
  background: none;
  border: none;
  font-size: 1.125rem;
  cursor: pointer;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.text-btn.cancel { color: var(--text-secondary); }
.text-btn.cancel:hover { background: var(--bg-input); }
.text-btn.submit { color: var(--primary-color); font-weight: 700; }
.text-btn.submit:hover { background: #FFF5F5; }
.text-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.form-area {
  padding: 1.5rem;
}

.input-title {
  width: 100%;
  font-size: 1.75rem;
  font-weight: 800;
  border: none;
  outline: none;
  padding: 1rem 0;
  color: var(--text-main);
}
.input-title::placeholder { color: var(--text-light); }
.input-title:focus {
  outline: none;
}

.divider {
  height: 2px;
  background: var(--border-color);
  margin: 1rem 0 1.5rem;
}

.input-content {
  width: 100%;
  height: 20rem;
  border: none;
  outline: none;
  font-size: 1.25rem;
  line-height: 1.6;
  resize: none;
  color: var(--text-main);
}
.input-content::placeholder { color: var(--text-light); }
.input-content:focus {
  outline: none;
}

/* Speech Button Styles */
.speech-wrapper {
  position: fixed;
  bottom: 9.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 30rem;
  
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-right: 0;
  
  z-index: 100;
  pointer-events: none;
}

.listening-tip, .speech-btn {
  pointer-events: auto;
}

.listening-tip {
  background: var(--text-main);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  animation: fadeIn 0.3s;
  max-width: 80%;
  text-align: center;
  box-shadow: var(--shadow-md);
}

.speech-btn {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  border: 3px solid white;
  box-shadow: 0 8px 20px rgba(255, 82, 82, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.speech-btn:hover,
.speech-btn:focus {
  transform: scale(1.05);
  outline: none;
}

.speech-btn:active {
  transform: scale(0.95);
}

.mic-icon {
  font-size: 2rem;
  line-height: 1;
}

.btn-text {
  font-size: 0.875rem;
  margin-top: 0.25rem;
  font-weight: 700;
}

/* Animation for listening state */
.speech-btn.listening {
  background: #ff3b30;
  transform: scale(1.1);
  box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.7);
  animation: pulse-red 1.5s infinite;
}

.speech-btn.listening .mic-icon {
  animation: none;
}

@keyframes pulse-red {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 25px rgba(255, 59, 48, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 59, 48, 0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>