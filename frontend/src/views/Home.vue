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
  <div class="home-view">
      <!-- 頂部 Header -->
    <header class="home-header">
      <div class="header-content">
        <h1 class="app-title">吾識JustAsk</h1>
        <div class="header-actions">
           <!-- Font Size Toggle -->
           <button 
             class="btn-font-toggle" 
             @click="toggleFontSize" 
             aria-label="調整字體大小"
             :aria-pressed="false"
           >
              <span class="font-icon" :class="'level-' + fontSizeLevel">Aa</span>
            </button>

            <!-- 如果已登入，顯示小頭像（模擬） -->
            <div class="avatar-container" v-if="currentUser">
              <img 
                :src="getAvatarUrl(currentUser.username)" 
                class="user-avatar-small" 
                @click="toggleUserMenu"
                alt="Me"
              />
              <!-- Dropdown Menu -->
              <transition name="fade">
                <div v-if="showUserMenu" class="user-dropdown">
                  <div class="menu-item" @click="goToProfile">
                    <span>👤</span> 我的檔案
                  </div>
                  <div class="menu-divider"></div>
                  <div class="menu-item logout" @click="handleLogout">
                    <span>🚪</span> 退出登入
                  </div>
                </div>
              </transition>
            </div>
            <button v-else class="btn-login-sm" @click="router.push('/login')">
              登入
            </button>
        </div>
      </div>
      
      <!-- 搜索/歡迎卡片 -->
      <div class="welcome-card">
        <div class="welcome-text">
          <h2>{{ currentUser ? `早安，${currentUser.username}！` : '歡迎來到 吾識JustAsk' }}</h2>
          <p>今天想知道些什麼？</p>
        </div>
        <div class="decoration">🌟</div>
      </div>
    </header>

    <!-- 內容區域 -->
    <section class="feed-section">
      <div class="section-header">
        <h3>最新動態</h3>
        <span class="refresh-icon">🔄</span>
      </div>
      <QuestionFeed />
    </section>
  </div>
</template>

<style scoped>
.home-view {
  min-height: 100%;
}

.home-header {
  background: #fff;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom-left-radius: 2rem;
  border-bottom-right-radius: 2rem;
  box-shadow: 0 10px 40px rgba(0,0,0,0.05);
  margin-bottom: 1.5rem;
  /* Ensure header content respects top notches if not covered by App padding */
}

@media (max-width: 380px) {
  .home-header {
    padding: 1rem;
  }
  
  .app-title {
    font-size: 1.5rem;
  }

  .welcome-card {
    padding: 1.5rem;
  }
  
  .welcome-text h2 {
    font-size: 1.5rem;
  }
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
}

.app-title {
  font-size: 2rem;
  font-weight: 800;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

.user-avatar-small {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  background: #fff;
  cursor: pointer;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.btn-font-toggle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-right: 1rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.btn-font-toggle:hover,
.btn-font-toggle:focus {
  border-color: var(--primary-color);
  transform: scale(1.05);
}

.btn-font-toggle:active {
  transform: scale(0.95);
  background: #f5f5f5;
}

.font-icon {
  font-family: serif;
  color: var(--text-main);
  line-height: 1;
  transition: all 0.2s;
}

/* Visual indicators for levels */
.font-icon.level-0 { font-size: 1rem; font-weight: 600; }
.font-icon.level-1 { font-size: 1.125rem; font-weight: 700; }
.font-icon.level-2 { font-size: 1.25rem; font-weight: 900; color: var(--primary-color); }

.btn-login-sm {
  padding: 0.75rem 1.5rem;
  background: var(--bg-input);
  border: 2px solid var(--border-color);
  border-radius: 1.5rem;
  font-weight: bold;
  font-size: 1.125rem;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-login-sm:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: white;
}

.welcome-card {
  background: var(--primary-gradient);
  border-radius: 2rem;
  padding: 2rem;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(255, 82, 82, 0.35);
}

.welcome-text h2 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  font-weight: 800;
}

.welcome-text p {
  opacity: 0.95;
  font-size: 1.125rem;
  font-weight: 500;
}

.decoration {
  position: absolute;
  right: -10px;
  bottom: -20px;
  font-size: 6rem;
  opacity: 0.25;
  transform: rotate(15deg);
}

.section-header {
  padding: 0 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-main);
}

.refresh-icon {
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.refresh-icon:hover {
  background: var(--bg-input);
  color: var(--text-main);
}

/* Dropdown Menu Styles */
.avatar-container {
  position: relative;
}

.user-dropdown {
  position: absolute;
  top: 60px;
  right: 0;
  background: white;
  min-width: 180px;
  border-radius: 1.5rem;
  box-shadow: var(--shadow-lg);
  padding: 0.75rem 0;
  z-index: 1000;
  border: 2px solid var(--border-color);
}

/* Little arrow pointer */
.user-dropdown::before {
  content: '';
  position: absolute;
  top: -8px;
  right: 16px;
  width: 16px;
  height: 16px;
  background: white;
  transform: rotate(45deg);
  border-left: 2px solid var(--border-color);
  border-top: 2px solid var(--border-color);
}

.menu-item {
  padding: 0.875rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-main);
  font-size: 1.125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:hover {
  background: var(--bg-hover);
}

.menu-item.logout {
  color: var(--error-color);
  font-weight: 600;
}

.menu-divider {
  height: 2px;
  background: var(--border-color);
  margin: 0.5rem 0;
}

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