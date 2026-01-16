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

const topics = ['生活瑣事', '健康養生', '尋找鄰居', '二手買賣', '閒聊']

const selectTopic = (topic) => {
  title.value = `[${topic}] `
  activeField.value = 'title'
}

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
    <!-- Top Nav (Cancel only) -->
    <div class="nav-bar">
      <button class="text-btn cancel" @click="router.back()">
        <span class="icon">✕</span> 取消
      </button>
      <span class="title">發布提問</span>
      <div style="width: 4rem;"></div> <!-- Spacer -->
    </div>

    <div class="scroll-content">
      <div class="form-container">
        <!-- Title Section -->
        <div class="input-card" :class="{ 'is-active': activeField === 'title' }">
          <label class="field-label">
            <span class="label-icon">📌</span> 標題
          </label>
          <input 
            v-model="title" 
            type="text" 
            class="input-title" 
            placeholder="您想問什麼？" 
            autofocus
            @focus="activeField = 'title'"
          />
          
          <!-- Topic Chips -->
          <div class="topic-chips">
            <span 
              v-for="t in topics" 
              :key="t" 
              class="chip"
              @click="selectTopic(t)"
            >
              # {{ t }}
            </span>
          </div>
        </div>

        <!-- Content Section -->
        <div class="input-card content-card" :class="{ 'is-active': activeField === 'content' }">
          <label class="field-label">
            <span class="label-icon">📝</span> 詳細內容
          </label>
          <textarea 
            v-model="content" 
            class="input-content" 
            placeholder="在這裡描述具體情況，大家會更清楚如何幫助您..."
            @focus="activeField = 'content'"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Bottom Action Bar (Redesigned for Centered Voice) -->
    <div class="action-bar-bottom">
      <div class="action-container-inner">
        <!-- Speech Button Group (Centered) -->
        <div v-if="isSpeechSupported" class="speech-group-centered">
          <transition name="fade-slide">
            <div v-if="isListening" class="listening-status">
              <div class="waves"><span></span><span></span><span></span></div>
              <p>正在聽您說...</p>
            </div>
          </transition>

          <button 
            class="speech-fab-centered" 
            :class="{ 'is-active': isListening }"
            @click="toggleSpeech"
          >
            <div class="fab-content">
              <svg v-if="isListening" xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </div>
          </button>
          <span class="fab-hint">{{ isListening ? '點擊停止' : '按住/點擊 語音輸入' }}</span>
        </div>

        <!-- Submit Button (Full Width) -->
        <button 
          class="btn btn-primary btn-submit-full" 
          @click="handleSubmit" 
          :disabled="isLoading || !title.trim()"
        >
          <span v-if="isLoading" class="spinner"></span>
          <span v-else>好了，發布提問</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.create-view {
  min-height: 100vh;
  background: var(--bg-body);
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
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.text-btn.cancel { color: var(--text-secondary); }

.scroll-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 12rem; /* Space for bottom bar */
}

.form-container {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* --- Input Cards --- */
.input-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  border: 2px solid transparent;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.input-card.is-active {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.field-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.label-icon {
  font-size: 1.25rem;
}

.input-title {
  width: 100%;
  font-size: 1.375rem;
  font-weight: 800;
  border: none;
  outline: none;
  padding: 0.25rem 0;
  color: var(--text-main);
}

.input-content {
  width: 100%;
  height: 15rem;
  border: none;
  outline: none;
  font-size: 1.125rem;
  line-height: 1.6;
  resize: none;
  color: var(--text-secondary);
}

/* --- Topic Chips --- */
.topic-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.chip {
  background: var(--bg-body);
  color: var(--text-secondary);
  padding: 0.375rem 0.875rem;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--border-color);
}

.chip:hover {
  background: var(--primary-light);
  color: var(--primary-color);
  border-color: var(--primary-color);
}

/* --- Bottom Action Bar (Stacked Layout) --- */
.action-bar-bottom {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  background: white;
  padding: 1rem 1.5rem 2.5rem;
  border-top: 1px solid var(--border-color);
  z-index: 100;
  box-shadow: 0 -10px 30px rgba(0,0,0,0.08);
}

.action-container-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.speech-group-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}

.speech-fab-centered {
  width: 5.5rem;
  height: 5.5rem;
  border-radius: 50%;
  background: var(--bg-body);
  border: 3px solid var(--primary-color);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.speech-fab-centered.is-active {
  background: var(--primary-gradient);
  color: white;
  border-color: transparent;
  transform: scale(1.1);
  box-shadow: 0 10px 25px rgba(20, 184, 166, 0.4);
}

.btn-submit-full {
  width: 100%;
  height: 4rem;
  border-radius: var(--radius-lg);
  font-size: 1.375rem;
  font-weight: 800;
  box-shadow: var(--shadow-md);
}

.fab-hint {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.listening-status {
  position: absolute;
  bottom: 120%;
  background: rgba(0,0,0,0.85);
  color: white;
  padding: 0.75rem 1.25rem;
  border-radius: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  white-space: nowrap;
  backdrop-filter: blur(4px);
  z-index: 101;
}

.waves {
  display: flex;
  gap: 4px;
}
.waves span {
  width: 4px;
  height: 16px;
  background: var(--primary-color);
  border-radius: 2px;
  animation: wave 0.8s infinite alternate;
}
@keyframes wave { from { height: 6px; } to { height: 20px; } }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(10px); }
</style>