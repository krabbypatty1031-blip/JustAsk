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
</script>

<template>
  <div class="profile-view">
    <!-- Header Area -->
    <div class="profile-header">
      <div class="user-info" v-if="currentUser">
        <img :src="getAvatarUrl(currentUser.username)" class="avatar-lg" alt="Profile" />
        <div class="texts">
          <h1 class="username">{{ currentUser.username }}</h1>
          <p class="subtitle">你好！今天過得怎麼樣？</p>
        </div>
      </div>
    </div>

    <!-- Content Tabs -->
    <div class="tabs-container">
      <div class="tabs-header">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'questions' }"
          @click="activeTab = 'questions'"
        >
          我的提問 ({{ myQuestions.length }})
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'answers' }"
          @click="activeTab = 'answers'"
        >
          我的回覆 ({{ myAnsweredQuestions.length }})
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <div v-if="isLoading" class="loading-text">加載中...</div>
        
        <div v-else>
          <!-- My Questions List -->
          <div v-if="activeTab === 'questions'">
            <div v-if="myQuestions.length === 0" class="empty-msg">您還沒有發布過問題哦</div>
            <div 
              v-for="q in myQuestions" 
              :key="q._id" 
              class="list-item"
              @click="navigateToQuestion(q._id)"
            >
              <div class="item-title">{{ q.title }}</div>
              <div class="item-meta">
                <span>{{ new Date(q.createdAt).toLocaleDateString() }}</span>
                <span>{{ q.answers.length }} 回答</span>
              </div>
            </div>
          </div>

          <!-- My Answers List -->
          <div v-if="activeTab === 'answers'">
            <div v-if="myAnsweredQuestions.length === 0" class="empty-msg">您還沒有回答過問題哦</div>
            <div 
              v-for="q in myAnsweredQuestions" 
              :key="q._id" 
              class="list-item"
              @click="navigateToQuestion(q._id)"
            >
              <div class="item-tag">您參與了回答</div>
              <div class="item-title">{{ q.title }}</div>
              <div class="item-meta">
                <span>提問者: {{ q.author.username }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Logout Button -->
    <div class="logout-area">
      <button class="btn btn-outline btn-block logout-btn" @click="handleLogout">
        退出登入
      </button>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
  min-height: 100vh;
  padding-bottom: 2.5rem;
}

/* Header */
.profile-header {
  background: white;
  padding: 2.5rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-sm);
  border-bottom: 2px solid var(--border-color);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar-lg {
  width: 5.5rem;
  height: 5.5rem;
  border-radius: 50%;
  object-fit: cover;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  border: 3px solid white;
}

.texts .username {
  font-size: 1.75rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
  color: var(--text-main);
}
.texts .subtitle {
  color: var(--text-secondary);
  font-size: 1.125rem;
  font-weight: 500;
}

/* Tabs */
.tabs-container {
  background: white;
  min-height: 22rem;
  border-top-left-radius: 2rem;
  border-top-right-radius: 2rem;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.04);
  padding: 1.5rem;
  border: 2px solid var(--border-color);
  border-bottom: none;
}

.tabs-header {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-color);
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.75rem 0;
  font-size: 1.125rem;
  color: var(--text-light);
  cursor: pointer;
  position: relative;
  font-weight: 600;
  transition: all 0.2s;
  min-height: 3rem;
}

.tab-btn:hover {
  color: var(--text-secondary);
}

.tab-btn.active {
  color: var(--primary-color);
  font-weight: 700;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 0.25rem;
  background: var(--primary-color);
  border-radius: 0.25rem;
}

/* List Items */
.list-item {
  padding: 1.25rem 0;
  border-bottom: 2px solid var(--border-color);
  cursor: pointer;
  transition: background 0.2s;
}

.list-item:hover {
  background: var(--bg-hover);
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.list-item:last-child { border-bottom: none; }

.item-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--text-main);
}

.item-meta {
  font-size: 1rem;
  color: var(--text-muted);
  display: flex;
  gap: 1.25rem;
  font-weight: 500;
}

.item-tag {
  display: inline-block;
  font-size: 0.9375rem;
  color: var(--secondary-color);
  background: #E1F5FE;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.empty-msg {
  text-align: center;
  color: var(--text-muted);
  padding: 3rem 0;
  font-size: 1.25rem;
  font-weight: 500;
}

.loading-text {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  font-size: 1.125rem;
}

/* Logout */
.logout-area {
  padding: 1.5rem;
  margin-top: 1.5rem;
}
.logout-btn {
  border-color: var(--border-color);
  color: var(--text-secondary);
  font-size: 1.125rem;
  font-weight: 600;
}
.logout-btn:hover {
  border-color: var(--error-color);
  color: var(--error-color);
}
</style>
