<script setup>
import { ref, onMounted, inject } from 'vue'
import axios from '../api/axios'
import { useRouter } from 'vue-router'
import { getAvatarUrl } from '../utils/avatar'
import Icon from '../components/Icon.vue'

const router = useRouter()
const currentUser = inject('currentUser')
const showToast = inject('showToast')

const activeTab = ref('questions')
const myQuestions = ref([])
const myAnsweredQuestions = ref([])
const isLoading = ref(true)

const fetchMyData = async () => {
  if (!currentUser.value) return
  isLoading.value = true

  try {
    const response = await axios.get('/questions')
    if (response.data.success) {
      const allQuestions = response.data.questions
      const userId = currentUser.value.id || currentUser.value._id

      myQuestions.value = allQuestions.filter(q =>
        q.authorId === userId || q.author?.id === userId || q.author?._id === userId
      )

      myAnsweredQuestions.value = allQuestions.filter(q =>
        q.answers && q.answers.some(a => a.authorId === userId || a.author?.id === userId || a.author?._id === userId)
      )
    }
  } catch (err) {
    showToast('無法獲取個人數據', 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (!currentUser.value) {
    router.push('/login')
  } else {
    fetchMyData()
  }
})

const handleLogout = async () => {
  if (!confirm('確定要登出嗎？')) return
  try {
    await axios.get('/users/logout')
    currentUser.value = null
    showToast('已登出', 'info')
    router.push('/login')
  } catch (e) {
    showToast('登出失敗', 'error')
  }
}

const navigateToQuestion = (id) => {
  router.push(`/question/${id}`)
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 6) return '早點休息'
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}
</script>

<template>
  <div class="neu-profile">
    <!-- Header Card -->
    <header class="neu-profile-header" v-if="currentUser">
      <div class="neu-user-card">
        <div class="neu-avatar-wrapper">
          <div class="neu-avatar-ring">
            <img :src="getAvatarUrl(currentUser.username)" class="neu-avatar" alt="Profile" />
          </div>
          <div class="neu-online-dot"></div>
        </div>
        <div class="neu-user-info">
          <h1 class="neu-username">{{ currentUser.username }}</h1>
          <p class="neu-greeting">{{ getGreeting() }}，今天想分享什麼嗎？</p>
          <div class="neu-badges">
            <span class="neu-badge">
              <Icon name="sparkles" :size="14" />
              熱心鄰居
            </span>
            <span class="neu-badge">
              <Icon name="document-text" :size="14" />
              記錄達人
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- Stats Tabs -->
    <div class="neu-stats-grid">
      <button
        class="neu-stat-card"
        :class="{ 'active': activeTab === 'questions' }"
        @click="activeTab = 'questions'"
      >
        <div class="neu-stat-icon">
          <Icon name="document-text" :size="22" />
        </div>
        <div class="neu-stat-info">
          <span class="neu-stat-num">{{ myQuestions.length }}</span>
          <span class="neu-stat-label">我的提問</span>
        </div>
      </button>
      <button
        class="neu-stat-card"
        :class="{ 'active': activeTab === 'answers' }"
        @click="activeTab = 'answers'"
      >
        <div class="neu-stat-icon">
          <Icon name="light-bulb" :size="22" />
        </div>
        <div class="neu-stat-info">
          <span class="neu-stat-num">{{ myAnsweredQuestions.length }}</span>
          <span class="neu-stat-label">我的回答</span>
        </div>
      </button>
    </div>

    <!-- Quick Actions -->
    <div class="neu-quick-actions">
      <button class="neu-quick-btn" @click="router.push('/ask')">
        <div class="neu-quick-icon primary">
          <Icon name="plus" :size="20" />
        </div>
        <span>發布提問</span>
      </button>
      <button class="neu-quick-btn" @click="router.push('/')">
        <div class="neu-quick-icon">
          <Icon name="home" :size="20" />
        </div>
        <span>瀏覽首頁</span>
      </button>
    </div>

    <!-- Content Section -->
    <section class="neu-content-section">
      <h3 class="neu-section-title">
        {{ activeTab === 'questions' ? '我的提問記錄' : '我的回答記錄' }}
      </h3>

      <!-- Loading State -->
      <div v-if="isLoading" class="neu-loading-state">
        <span class="neu-spinner"></span>
        <p>正在整理您的記錄...</p>
      </div>

      <!-- Questions List -->
      <div v-else-if="activeTab === 'questions'" class="neu-list">
        <div v-if="myQuestions.length === 0" class="neu-empty-state">
          <div class="neu-empty-icon">
            <Icon name="document-text" :size="48" :stroke-width="1.5" />
          </div>
          <p>您還沒有發布過問題</p>
          <button class="neu-btn neu-btn-primary-sm" @click="router.push('/ask')">
            <Icon name="plus" :size="18" />
            去提問
          </button>
        </div>

        <transition-group name="list">
          <article
            v-for="q in myQuestions"
            :key="q._id"
            class="neu-record-card"
            @click="navigateToQuestion(q._id)"
          >
            <div class="neu-record-icon">
              <Icon name="document-text" :size="22" />
            </div>
            <div class="neu-record-content">
              <h4 class="neu-record-title">{{ q.title }}</h4>
              <div class="neu-record-meta">
                <span>
                  <Icon name="calendar" :size="14" />
                  {{ new Date(q.createdAt).toLocaleDateString() }}
                </span>
                <span>
                  <Icon name="chat-bubble-left-ellipsis" :size="14" />
                  {{ q.answers.length }} 條回答
                </span>
              </div>
            </div>
            <div class="neu-record-arrow">
              <Icon name="chevron-right" :size="20" />
            </div>
          </article>
        </transition-group>
      </div>

      <!-- Answers List -->
      <div v-else-if="activeTab === 'answers'" class="neu-list">
        <div v-if="myAnsweredQuestions.length === 0" class="neu-empty-state">
          <div class="neu-empty-icon">
            <Icon name="chat-bubble-left-ellipsis" :size="48" :stroke-width="1.5" />
          </div>
          <p>您還沒有回答過問題</p>
          <button class="neu-btn neu-btn-outline-sm" @click="router.push('/')">
            <Icon name="arrow-right" :size="18" />
            去逛逛
          </button>
        </div>

        <transition-group name="list">
          <article
            v-for="q in myAnsweredQuestions"
            :key="q._id"
            class="neu-record-card answer-type"
            @click="navigateToQuestion(q._id)"
          >
            <div class="neu-record-icon answer-icon">
              <Icon name="hand-raised" :size="22" />
            </div>
            <div class="neu-record-content">
              <span class="neu-record-tag">我參與了回答</span>
              <h4 class="neu-record-title">{{ q.title }}</h4>
              <div class="neu-record-meta">
                <span>
                  <Icon name="user" :size="14" />
                  {{ q.authorName || q.author?.username || '匿名用戶' }}
                </span>
              </div>
            </div>
            <div class="neu-record-arrow">
              <Icon name="chevron-right" :size="20" />
            </div>
          </article>
        </transition-group>
      </div>
    </section>

    <!-- Logout Button -->
    <div class="neu-logout-section">
      <button class="neu-logout-btn" @click="handleLogout">
        <Icon name="arrow-right-on-rectangle" :size="20" />
        退出登入
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   NEUMORPHISM PROFILE PAGE
   ============================================ */
.neu-profile {
  min-height: 100vh;
  background: var(--neu-bg);
  padding-bottom: 2rem;
}

/* --- Header Card --- */
.neu-profile-header {
  padding: 2rem 1.5rem;
  background: linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-dark) 100%);
  border-bottom-left-radius: 2rem;
  border-bottom-right-radius: 2rem;
  box-shadow: 8px 8px 20px rgba(20, 184, 166, 0.25),
              -4px -4px 12px rgba(255, 255, 255, 0.5);
}

.neu-user-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.neu-avatar-wrapper {
  position: relative;
}

.neu-avatar-ring {
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background: var(--neu-bg);
  padding: 4px;
  box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.15),
              -2px -2px 6px rgba(255, 255, 255, 0.5);
}

.neu-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.neu-online-dot {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 14px;
  height: 14px;
  background: var(--neu-success);
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.neu-user-info {
  flex: 1;
}

.neu-username {
  font-size: 1.75rem;
  font-weight: 800;
  color: white;
  margin-bottom: 0.25rem;
  letter-spacing: -0.5px;
}

.neu-greeting {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.neu-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.neu-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: rgba(255, 255, 255, 0.25);
  padding: 0.375rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.neu-badge svg {
  flex-shrink: 0;
}

/* --- Stats Grid --- */
.neu-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 0 1.5rem;
  margin-top: -1.5rem;
  position: relative;
  z-index: 10;
}

/* --- Quick Actions --- */
.neu-quick-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem 0;
}

.neu-quick-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: var(--neu-bg);
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  box-shadow: var(--neu-shadow-out-sm);
  transition: all 0.3s ease;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--neu-text);
}

.neu-quick-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--neu-shadow-out);
}

.neu-quick-btn:active {
  transform: translateY(0);
  box-shadow: var(--neu-shadow-in);
}

.neu-quick-icon {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.625rem;
  background: var(--neu-bg-dark);
  color: var(--neu-text-muted);
  transition: all 0.3s ease;
}

.neu-quick-icon.primary {
  background: linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-dark) 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(20, 184, 166, 0.25);
}

.neu-quick-btn:hover .neu-quick-icon:not(.primary) {
  color: var(--neu-primary);
}

.neu-stat-card {
  background: var(--neu-bg);
  border-radius: 1.25rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--neu-shadow-out);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.neu-stat-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--neu-shadow-out-lg);
}

.neu-stat-card:active {
  transform: translateY(0);
  box-shadow: var(--neu-shadow-in);
}

.neu-stat-card.active {
  box-shadow: var(--neu-shadow-in);
}

.neu-stat-card.active .neu-stat-icon {
  background: linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-dark) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
}

.neu-stat-icon {
  width: 3rem;
  height: 3rem;
  min-width: 3rem;
  border-radius: 1rem;
  background: var(--neu-bg);
  box-shadow: var(--neu-shadow-out-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--neu-text-muted);
  transition: all 0.3s ease;
}

.neu-stat-icon svg {
  flex-shrink: 0;
}

.neu-stat-info {
  display: flex;
  flex-direction: column;
}

.neu-stat-num {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--neu-text);
  line-height: 1.2;
}

.neu-stat-label {
  font-size: 0.8125rem;
  color: var(--neu-text-muted);
  font-weight: 600;
}

/* --- Content Section --- */
.neu-content-section {
  padding: 2rem 1.5rem 0;
}

.neu-section-title {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--neu-text);
  margin-bottom: 1rem;
  padding-left: 0.75rem;
  border-left: 4px solid var(--neu-primary);
}

.neu-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

/* --- Record Card --- */
.neu-record-card {
  background: var(--neu-bg);
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--neu-shadow-out);
  cursor: pointer;
  transition: all 0.3s ease;
}

.neu-record-card:hover {
  transform: translateX(4px);
  box-shadow: var(--neu-shadow-out-lg);
}

.neu-record-card:active {
  box-shadow: var(--neu-shadow-in);
}

.neu-record-icon {
  width: 2.75rem;
  height: 2.75rem;
  min-width: 2.75rem;
  border-radius: 0.875rem;
  background: var(--neu-bg);
  box-shadow: var(--neu-shadow-out-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--neu-primary);
  flex-shrink: 0;
}

.neu-record-icon svg {
  flex-shrink: 0;
}

.neu-record-icon.answer-icon {
  color: var(--neu-warning);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.02));
}

.neu-record-content {
  flex: 1;
  min-width: 0;
}

.neu-record-tag {
  display: inline-block;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--neu-warning);
  background: rgba(245, 158, 11, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  margin-bottom: 0.375rem;
  text-transform: uppercase;
}

.neu-record-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--neu-text);
  margin-bottom: 0.375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.neu-record-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8125rem;
  color: var(--neu-text-muted);
  font-weight: 500;
}

.neu-record-meta span {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.neu-record-arrow {
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--neu-text-light);
  transition: all 0.2s ease;
}

.neu-record-arrow svg {
  flex-shrink: 0;
}

.neu-record-card:hover .neu-record-arrow {
  transform: translateX(4px);
  color: var(--neu-primary);
}

/* --- Empty & Loading States --- */
.neu-empty-state {
  text-align: center;
  padding: 2.5rem 1.5rem;
  background: var(--neu-bg);
  border-radius: 1.25rem;
  box-shadow: var(--neu-shadow-in);
}

.neu-empty-icon {
  width: 5rem;
  height: 5rem;
  margin: 0 auto 1.25rem;
  background: var(--neu-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--neu-shadow-out-sm);
  color: var(--neu-primary);
  opacity: 0.7;
}

.neu-empty-state p {
  font-size: 1rem;
  font-weight: 600;
  color: var(--neu-text-muted);
  margin-bottom: 1.25rem;
  line-height: 1.5;
}

.neu-loading-state {
  text-align: center;
  padding: 3rem 1.5rem;
  background: var(--neu-bg);
  border-radius: 1.25rem;
  box-shadow: var(--neu-shadow-in);
}

.neu-loading-state p {
  margin-top: 1.25rem;
  font-weight: 600;
  color: var(--neu-text-muted);
}

.neu-spinner {
  display: inline-block;
  width: 3rem;
  height: 3rem;
  border: 4px solid var(--neu-bg-dark);
  border-top-color: var(--neu-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  box-shadow: var(--neu-shadow-out-sm);
}

/* --- Buttons --- */
.neu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 700;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.neu-btn-primary-sm {
  padding: 0.75rem 1.5rem;
  font-size: 0.9375rem;
  background: linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-dark) 100%);
  color: white;
  box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.1),
              -2px -2px 6px rgba(255, 255, 255, 0.7),
              0 4px 12px rgba(20, 184, 166, 0.3);
}

.neu-btn-primary-sm:hover {
  transform: translateY(-2px);
  box-shadow: 6px 6px 14px rgba(0, 0, 0, 0.12),
              -4px -4px 10px rgba(255, 255, 255, 0.8),
              0 6px 16px rgba(20, 184, 166, 0.4);
}

.neu-btn-outline-sm {
  padding: 0.75rem 1.5rem;
  font-size: 0.9375rem;
  background: var(--neu-bg);
  color: var(--neu-text);
  box-shadow: var(--neu-shadow-out);
}

.neu-btn-outline-sm:hover {
  color: var(--neu-primary);
  transform: translateY(-2px);
  box-shadow: var(--neu-shadow-out-lg);
}

/* --- Logout Section --- */
.neu-logout-section {
  padding: 2rem 1.5rem;
}

.neu-logout-btn {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  background: var(--neu-bg);
  color: var(--neu-text-muted);
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  box-shadow: var(--neu-shadow-out);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.neu-logout-btn:hover {
  color: var(--neu-error);
  transform: translateY(-2px);
  box-shadow: var(--neu-shadow-out-lg);
}

.neu-logout-btn:active {
  transform: translateY(0);
  box-shadow: var(--neu-shadow-in);
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* --- Responsive --- */
@media (max-width: 400px) {
  .neu-profile-header {
    padding: 1.5rem 1rem;
  }

  .neu-username {
    font-size: 1.5rem;
  }

  .neu-stats-grid {
    padding: 0 1rem;
  }

  .neu-content-section {
    padding: 1.5rem 1rem 0;
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
