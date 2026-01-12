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
  padding-bottom: 2rem;
}

/* Header */
.profile-header {
  background: white;
  padding: 2rem 1.25rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 0.125rem 0.6rem rgba(0,0,0,0.03);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.avatar-lg {
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  object-fit: cover;
  background: #fff;
  box-shadow: 0 0.25rem 0.6rem rgba(0,0,0,0.1);
  border: 2px solid white;
}

.texts .username {
  font-size: 1.5rem; /* ~24px */
  font-weight: 800;
  margin-bottom: 0.25rem;
  color: #333;
}
.texts .subtitle {
  color: #888;
  font-size: 0.875rem;
}

/* Tabs */
.tabs-container {
  background: white;
  min-height: 20rem;
  border-top-left-radius: 1.5rem;
  border-top-right-radius: 1.5rem;
  box-shadow: 0 -0.3rem 1.25rem rgba(0,0,0,0.02);
  padding: 1.25rem;
}

.tabs-header {
  display: flex;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid #f0f0f0;
}

.tab-btn {
  background: none;
  border: none;
  padding-bottom: 0.6rem;
  font-size: 1rem;
  color: #999;
  cursor: pointer;
  position: relative;
  font-weight: 600;
}

.tab-btn.active {
  color: var(--primary-color);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 0.2rem;
  background: var(--primary-color);
  border-radius: 0.2rem;
}

/* List Items */
.list-item {
  padding: 1rem 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}
.list-item:last-child { border-bottom: none; }

.item-title {
  font-size: 1.125rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #333;
}

.item-meta {
  font-size: 0.8rem;
  color: #999;
  display: flex;
  gap: 1rem;
}

.item-tag {
  display: inline-block;
  font-size: 0.75rem;
  color: var(--secondary-color);
  background: #e0f7fa;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  margin-bottom: 0.3rem;
}

.empty-msg {
  text-align: center;
  color: #ccc;
  padding: 2.5rem 0;
}

.loading-text {
  text-align: center;
  padding: 1.25rem;
  color: #999;
}

/* Logout */
.logout-area {
  padding: 1.25rem;
  margin-top: 1.25rem;
}
.logout-btn {
  border-color: #ddd;
  color: #666;
}
</style>
