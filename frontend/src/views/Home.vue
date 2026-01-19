<script setup>
import { ref, onMounted, inject } from 'vue'
import axios from '../api/axios'
import QuestionFeed from '../components/QuestionFeed.vue'
import Icon from '../components/Icon.vue'
import { useRouter } from 'vue-router'
import { getAvatarUrl } from '../utils/avatar'

const router = useRouter()
const currentUser = inject('currentUser')
const showToast = inject('showToast')

const questions = ref([])
const isLoading = ref(true)
const showUserMenu = ref(false)
const fontSizeLevel = ref(0)

const fetchQuestions = async () => {
  isLoading.value = true
  try {
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
  const saved = localStorage.getItem('user_font_pref')
  if (saved) fontSizeLevel.value = parseInt(saved)
})
</script>

<template>
  <div class="neu-home">
    <!-- Header -->
    <header class="neu-header">
      <div class="neu-header-top">
        <h1 class="neu-brand">吾識JustAsk</h1>
        <div class="neu-header-actions">
          <!-- Font Size Toggle -->
          <button
            class="neu-icon-btn"
            @click="toggleFontSize"
            :aria-label="`調整字體大小，當前: ${['標準', '大', '特大'][fontSizeLevel]}`"
          >
            <span class="neu-font-size" :class="{ 'neu-font-lg': fontSizeLevel === 1, 'neu-font-xl': fontSizeLevel === 2 }">Aa</span>
          </button>

          <!-- User Avatar -->
          <div class="neu-avatar-wrapper" v-if="currentUser">
            <button
              class="neu-avatar-btn"
              @click="toggleUserMenu"
              :aria-label="`用戶選單，${currentUser.username}`"
              :aria-expanded="showUserMenu"
            >
              <img :src="getAvatarUrl(currentUser.username)" :alt="`${currentUser.username} 的頭像`" />
            </button>

            <!-- Dropdown -->
            <transition name="dropdown">
              <div v-if="showUserMenu" class="neu-dropdown" role="menu">
                <button class="neu-dropdown-item" @click="goToProfile" role="menuitem">
                  <Icon name="user" :size="18" />
                  我的檔案
                </button>
                <div class="neu-dropdown-divider"></div>
                <button class="neu-dropdown-item neu-dropdown-danger" @click="handleLogout" role="menuitem">
                  <Icon name="arrow-right-on-rectangle" :size="18" />
                  退出登入
                </button>
              </div>
            </transition>
          </div>

          <!-- Login Button -->
          <button v-else class="neu-login-btn" @click="router.push('/login')">
            登入
          </button>
        </div>
      </div>

      <!-- Welcome Card -->
      <div class="neu-welcome-card">
        <div class="neu-welcome-content">
          <h2 class="neu-welcome-title">{{ currentUser ? `早安，${currentUser.username}！` : '歡迎來到 吾識JustAsk' }}</h2>
          <p class="neu-welcome-text">今天想知道些什麼？</p>
        </div>
        <div class="neu-welcome-icon" aria-hidden="true">
          <Icon name="sparkles" :size="80" :stroke-width="1.5" />
        </div>
      </div>
    </header>

    <!-- Content -->
    <section class="neu-content">
      <div class="neu-section-header">
        <h3 class="neu-section-title">最新動態</h3>
        <button class="neu-refresh-btn" @click="fetchQuestions" aria-label="重新整理問題列表">
          <Icon name="arrow-path" :size="20" />
        </button>
      </div>
      <QuestionFeed />
    </section>
  </div>
</template>

<style scoped>
/* ============================================
   NEUMORPHISM HOME PAGE
   ============================================ */
.neu-home {
  min-height: 100vh;
  background: var(--neu-bg);
}

/* Header */
.neu-header {
  padding: 1.5rem 1.5rem 2rem;
}

.neu-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.neu-brand {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--neu-primary);
  letter-spacing: -0.5px;
}

.neu-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Icon Button */
.neu-icon-btn {
  width: 2.75rem;
  height: 2.75rem;
  background: var(--neu-bg);
  border: none;
  border-radius: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--neu-shadow-out-sm);
  transition: all 0.2s ease;
  color: var(--neu-text);
}

.neu-icon-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--neu-shadow-out);
}

.neu-icon-btn:active {
  transform: translateY(0);
  box-shadow: var(--neu-shadow-in);
}

.neu-font-size {
  font-family: serif;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.neu-font-lg {
  font-size: 1rem;
  font-weight: 700;
}

.neu-font-xl {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--neu-primary);
}

/* Avatar */
.neu-avatar-wrapper {
  position: relative;
}

.neu-avatar-btn {
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  background: var(--neu-bg);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: var(--neu-shadow-out-sm);
  transition: all 0.2s ease;
  overflow: hidden;
}

.neu-avatar-btn:hover {
  transform: scale(1.05);
}

.neu-avatar-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Dropdown */
.neu-dropdown {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  min-width: 10rem;
  background: var(--neu-bg);
  border-radius: 1rem;
  padding: 0.5rem;
  box-shadow: var(--neu-shadow-out);
  z-index: 100;
}

.neu-dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--neu-text);
  background: none;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.neu-dropdown-item:hover {
  background: var(--neu-bg-dark);
}

.neu-dropdown-item:active {
  box-shadow: var(--neu-shadow-in);
}

.neu-dropdown-danger {
  color: var(--neu-error);
}

.neu-dropdown-danger:hover {
  background: #fef2f2;
}

.neu-dropdown-divider {
  height: 1px;
  background: var(--neu-bg-dark);
  margin: 0.375rem 0;
}

/* Login Button */
.neu-login-btn {
  padding: 0.625rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--neu-text);
  background: var(--neu-bg);
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  box-shadow: var(--neu-shadow-out-sm);
  transition: all 0.2s ease;
}

.neu-login-btn:hover {
  transform: translateY(-2px);
  color: var(--neu-primary);
  box-shadow: var(--neu-shadow-out);
}

.neu-login-btn:active {
  transform: translateY(0);
  box-shadow: var(--neu-shadow-in);
}

/* Welcome Card */
.neu-welcome-card {
  position: relative;
  background: linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-dark) 100%);
  border-radius: 1.5rem;
  padding: 1.75rem;
  color: white;
  overflow: hidden;
  box-shadow: 8px 8px 20px rgba(20, 184, 166, 0.25),
              -4px -4px 12px rgba(255, 255, 255, 0.5);
}

.neu-welcome-content {
  position: relative;
  z-index: 2;
}

.neu-welcome-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 0.375rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.neu-welcome-text {
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.95;
}

.neu-welcome-icon {
  position: absolute;
  right: -1rem;
  bottom: -1.5rem;
  opacity: 0.2;
  transform: rotate(12deg);
}

/* Content Section */
.neu-content {
  padding: 0 1.5rem 2rem;
}

.neu-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.neu-section-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--neu-text);
}

.neu-refresh-btn {
  width: 2.5rem;
  height: 2.5rem;
  background: var(--neu-bg);
  border: none;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--neu-text-muted);
  box-shadow: var(--neu-shadow-out-sm);
  transition: all 0.2s ease;
}

.neu-refresh-btn:hover {
  color: var(--neu-primary);
  transform: translateY(-2px);
  box-shadow: var(--neu-shadow-out);
}

.neu-refresh-btn:active {
  transform: translateY(0);
  box-shadow: var(--neu-shadow-in);
}

/* Dropdown Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
