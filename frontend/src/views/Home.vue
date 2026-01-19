<script setup>
import { ref, onMounted, inject } from 'vue'
import axios from '../api/axios'
import QuestionFeed from '../components/QuestionFeed.vue'
import { useRouter } from 'vue-router'
import { getAvatarUrl } from '../utils/avatar'

const router = useRouter()
const currentUser = inject('currentUser')
const showToast = inject('showToast')

const questions = ref([])
const isLoading = ref(true)
const showUserMenu = ref(false) // Toggle for user dropdown
const fontSizeLevel = ref(0) // 0: 100%, 1: 112.5%, 2: 125%

const fetchQuestions = async () => {
  isLoading.value = true
  try {
    // 稍微延遲以展示骨架屏動畫
    await new Promise(resolve => setTimeout(resolve, 600))
    const response = await axios.get('/questions')
    if (response.data.success) {
      questions.value = response.data.questions
    }
  } catch (error) {
    showToast('無法獲取列表，請重試', 'error')
  } finally {
    isLoading.value = false
  }
}

const handleNavigate = (id) => {
  router.push(`/question/${id}`)
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const toggleFontSize = () => {
  // Cycle: 0 -> 1 -> 2 -> 0
  fontSizeLevel.value = (fontSizeLevel.value + 1) % 3
  
  const levels = ['100%', '112.5%', '125%']
  const size = levels[fontSizeLevel.value]
  
  document.documentElement.style.setProperty('--app-scale', size)
  localStorage.setItem('user_font_pref', fontSizeLevel.value)
  
  const labels = ['標準', '大', '特大']
  showToast(`字體已調整為：${labels[fontSizeLevel.value]}`)
}

const handleLogout = async () => {
  if (!confirm('確定要登出嗎？')) return
  try {
    await axios.get('/users/logout')
    // currentUser is provided by App.vue, but it's a ref so we can't mutate it directly here easily 
    // unless we inject the updater or rely on App.vue's reactivity update on route change/checkStatus.
    // However, App.vue provides the Ref itself, so we can mutate .value!
    currentUser.value = null 
    showToast('已登出', 'info')
    showUserMenu.value = false
    router.push('/login')
  } catch (e) {
    showToast('登出失敗', 'error')
  }
}

const goToProfile = () => {
  router.push('/profile')
  showUserMenu.value = false
}

onMounted(() => {
  fetchQuestions()
  // Sync local state with global pref
  const saved = localStorage.getItem('user_font_pref')
  if (saved) fontSizeLevel.value = parseInt(saved)
})
</script>

<template>
  <div class="min-h-full">
      <!-- 頂部 Header -->
    <header class="bg-white px-6 pt-6 pb-4 rounded-b-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.05)] mb-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-extrabold bg-gradient-to-br from-primary-500 to-cyan-500 bg-clip-text text-transparent tracking-tighter">吾識JustAsk</h1>
        <div class="flex items-center gap-4">
           <!-- Font Size Toggle -->
           <button 
             class="w-12 h-12 rounded-full bg-white border border-primary-100 flex items-center justify-center shadow-sm transition-all hover:border-primary-500 hover:scale-105 active:scale-95 active:bg-slate-50" 
             @click="toggleFontSize" 
             aria-label="調整字體大小"
             :aria-pressed="false"
           >
              <span class="font-serif text-slate-900 leading-none transition-all" 
                    :class="{ 'text-base font-semibold': fontSizeLevel === 0, 'text-lg font-bold': fontSizeLevel === 1, 'text-xl font-black text-primary-600': fontSizeLevel === 2 }">Aa</span>
            </button>

            <!-- 如果已登入，顯示小頭像（模擬） -->
            <div class="relative" v-if="currentUser">
              <img 
                :src="getAvatarUrl(currentUser.username)" 
                class="w-12 h-12 rounded-full object-cover bg-white cursor-pointer border-[3px] border-white shadow-md hover:scale-105 transition-transform" 
                @click="toggleUserMenu"
                alt="Me"
              />
              <!-- Dropdown Menu -->
              <transition name="fade">
                <div v-if="showUserMenu" class="absolute top-[60px] right-0 bg-white min-w-[180px] rounded-2xl shadow-xl py-3 z-50 border border-slate-100">
                  <div class="absolute -top-2 right-4 w-4 h-4 bg-white rotate-45 border-l border-t border-slate-100"></div>
                  <div class="px-5 py-3 flex items-center gap-3 text-slate-900 text-lg font-medium cursor-pointer hover:bg-slate-50 transition-colors" @click="goToProfile">
                    <span>👤</span> 我的檔案
                  </div>
                  <div class="h-px bg-slate-100 my-2"></div>
                  <div class="px-5 py-3 flex items-center gap-3 text-red-500 text-lg font-semibold cursor-pointer hover:bg-red-50 transition-colors" @click="handleLogout">
                    <span>🚪</span> 退出登入
                  </div>
                </div>
              </transition>
            </div>
            <button v-else class="px-6 py-3 bg-slate-50 border-2 border-slate-200 rounded-full font-bold text-lg text-slate-900 transition-all hover:bg-white hover:border-primary-500 hover:text-primary-600" @click="router.push('/login')">
              登入
            </button>
        </div>
      </div>
      
      <!-- 搜索/歡迎卡片 -->
      <div class="relative bg-gradient-to-br from-primary-500 to-cyan-500 rounded-[2rem] p-8 text-white shadow-[0_12px_30px_rgba(255,82,82,0.25)] overflow-hidden">
        <div class="relative z-10">
          <h2 class="text-2xl font-extrabold mb-2">{{ currentUser ? `早安，${currentUser.username}！` : '歡迎來到 吾識JustAsk' }}</h2>
          <p class="text-lg font-medium opacity-95">今天想知道些什麼？</p>
        </div>
        <div class="absolute -right-2 -bottom-5 text-8xl opacity-25 rotate-12 select-none">🌟</div>
      </div>
    </header>

    <!-- 內容區域 -->
    <section class="pb-6">
      <div class="px-6 mb-4 flex justify-between items-center">
        <h3 class="text-2xl font-extrabold text-slate-900">最新動態</h3>
        <span class="text-2xl text-slate-400 cursor-pointer p-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors">🔄</span>
      </div>
      <QuestionFeed />
    </section>
  </div>
</template>

<style scoped>
/* Dropdown Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>