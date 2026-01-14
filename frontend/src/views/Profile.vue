<script setup>
import { ref, onMounted, inject } from 'vue'
import axios from '../api/axios'
import { useRouter } from 'vue-router'
import { getAvatarUrl } from '../utils/avatar'

const router = useRouter()
const currentUser = inject('currentUser')
const showToast = inject('showToast')

const activeTab = ref('questions') // 'questions' | 'answers'
const myQuestions = ref([])
const myAnsweredQuestions = ref([]) // Questions where I posted an answer
const isLoading = ref(true)

// --- Data Fetching ---
const fetchMyData = async () => {
  if (!currentUser.value) return
  isLoading.value = true
  
  try {
    const response = await axios.get('/questions')
    if (response.data.success) {
      const allQuestions = response.data.questions
      const userId = currentUser.value.id || currentUser.value._id

      // Filter My Questions
      myQuestions.value = allQuestions.filter(q => 
        q.author.id === userId || q.author._id === userId
      )

      // Filter My Answers
      myAnsweredQuestions.value = allQuestions.filter(q => 
        q.answers && q.answers.some(a => a.author.id === userId || a.author._id === userId)
      )
    }
  } catch (err) {
    showToast('無法獲取個人數據', 'error')
  } finally {
    isLoading.value = false
  }
}

// Load data
onMounted(() => {
  if (!currentUser.value) {
    router.push('/login')
  } else {
    fetchMyData()
  }
})

// --- Actions ---
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
  <div class="profile-view">
    <!-- Header Area -->
    <div class="profile-header">
      <div class="user-card" v-if="currentUser">
        <div class="avatar-wrapper">
          <img :src="getAvatarUrl(currentUser.username)" class="avatar-lg" alt="Profile" />
          <div class="online-badge"></div>
        </div>
        <div class="texts">
          <h1 class="username">{{ currentUser.username }}</h1>
          <p class="greeting">{{ getGreeting() }}，今天想分享什麼嗎？</p>
          <div class="badges">
            <span class="badge">🌟 熱心鄰居</span>
            <span class="badge">📝 記錄達人</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats / Actions Grid -->
    <div class="quick-stats">
      <div 
        class="stat-card" 
        :class="{ active: activeTab === 'questions' }"
        @click="activeTab = 'questions'"
      >
        <div class="stat-icon">❓</div>
        <div class="stat-info">
          <span class="stat-num">{{ myQuestions.length }}</span>
          <span class="stat-label">我的提問</span>
        </div>
      </div>
      <div 
        class="stat-card"
        :class="{ active: activeTab === 'answers' }"
        @click="activeTab = 'answers'"
      >
        <div class="stat-icon">💡</div>
        <div class="stat-info">
          <span class="stat-num">{{ myAnsweredQuestions.length }}</span>
          <span class="stat-label">我的回答</span>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="content-section">
      <h3 class="section-title">
        {{ activeTab === 'questions' ? '我的提問記錄' : '我的回答記錄' }}
      </h3>
      
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>正在整理您的記錄...</p>
      </div>
      
      <div v-else class="list-container">
        <!-- Questions List -->
        <div v-if="activeTab === 'questions'">
          <div v-if="myQuestions.length === 0" class="empty-state">
            <div class="empty-icon">📝</div>
            <p>您還沒有發布過問題</p>
            <button class="btn btn-primary btn-sm" @click="router.push('/ask')">去提問</button>
          </div>
          <transition-group name="list">
            <div 
              v-for="q in myQuestions" 
              :key="q._id" 
              class="record-card"
              @click="navigateToQuestion(q._id)"
            >
              <div class="card-icon">📄</div>
              <div class="card-content">
                <div class="card-title">{{ q.title }}</div>
                <div class="card-meta">
                  <span>📅 {{ new Date(q.createdAt).toLocaleDateString() }}</span>
                  <span>💬 {{ q.answers.length }} 條回答</span>
                </div>
              </div>
              <div class="card-arrow">›</div>
            </div>
          </transition-group>
        </div>

        <!-- Answers List -->
        <div v-if="activeTab === 'answers'">
          <div v-if="myAnsweredQuestions.length === 0" class="empty-state">
            <div class="empty-icon">💬</div>
            <p>您還沒有回答過問題</p>
            <button class="btn btn-outline btn-sm" @click="router.push('/')">去逛逛</button>
          </div>
          <transition-group name="list">
            <div 
              v-for="q in myAnsweredQuestions" 
              :key="q._id" 
              class="record-card answer-type"
              @click="navigateToQuestion(q._id)"
            >
              <div class="card-icon">🙋</div>
              <div class="card-content">
                <div class="card-tag">我參與了回答</div>
                <div class="card-title">{{ q.title }}</div>
                <div class="card-meta">
                  <span>提問者: {{ q.author.username }}</span>
                </div>
              </div>
              <div class="card-arrow">›</div>
            </div>
          </transition-group>
        </div>
      </div>
    </div>

    <!-- Logout Button -->
    <div class="logout-area">
      <button class="btn btn-logout" @click="handleLogout">
        退出登入
      </button>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
  min-height: 100vh;
  padding-bottom: 2.5rem;
  background: var(--bg-body);
}

/* --- Header Card --- */
.profile-header {
  background: var(--primary-gradient);
  padding: 3rem 1.5rem 4rem; /* Extra bottom padding for overlap */
  border-bottom-left-radius: 2rem;
  border-bottom-right-radius: 2rem;
  color: white;
  box-shadow: var(--shadow-md);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar-wrapper {
  position: relative;
}

.avatar-lg {
  width: 5.5rem;
  height: 5.5rem;
  border-radius: 50%;
  object-fit: cover;
  background: #fff;
  border: 4px solid rgba(255,255,255,0.3);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.online-badge {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 16px;
  height: 16px;
  background: #22c55e;
  border: 3px solid white;
  border-radius: 50%;
}

.texts .username {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
  letter-spacing: -0.5px;
}

.texts .greeting {
  font-size: 1.125rem;
  opacity: 0.95;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.badges {
  display: flex;
  gap: 0.5rem;
}

.badge {
  background: rgba(255,255,255,0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

/* --- Quick Stats Grid (Tabs) --- */
.quick-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 0 1.5rem;
  margin-top: -2.5rem; /* Overlap effect */
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--shadow-sm);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-card.active {
  border-color: var(--primary-color);
  background: #FFFBF7; /* Very light warm bg */
}

.stat-icon {
  font-size: 1.75rem;
  background: var(--bg-input);
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-num {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 600;
}

/* --- Content Section --- */
.content-section {
  padding: 0 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 1rem;
  padding-left: 0.5rem;
  border-left: 4px solid var(--primary-color);
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.record-card {
  background: white;
  border-radius: var(--radius-md);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.record-card:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
  transform: translateX(4px);
}

.card-icon {
  font-size: 1.5rem;
  opacity: 0.8;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  min-width: 0; /* Text truncation fix */
}

.card-tag {
  display: inline-block;
  font-size: 0.75rem;
  color: var(--secondary-color);
  background: #fff3e0;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  margin-bottom: 0.375rem;
  font-weight: 700;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.card-arrow {
  color: var(--text-light);
  font-size: 1.5rem;
  font-weight: 300;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: rgba(255,255,255,0.5);
  border-radius: var(--radius-lg);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

/* --- Logout --- */
.logout-area {
  padding: 2rem 1.5rem;
  margin-top: 1rem;
}

.btn-logout {
  width: 100%;
  background: white;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 1rem;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 1.125rem;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: #fff1f2;
  border-color: #fda4af;
  color: #e11d48;
}

/* Transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
