<script setup>
import { ref, onMounted, inject } from 'vue'
import axios from '../api/axios'
import { useRouter } from 'vue-router'
import { getAvatarUrl } from '../utils/avatar'

const router = useRouter()
const questions = ref([])
const isLoading = ref(true)
const showToast = inject('showToast')

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

onMounted(() => {
  fetchQuestions()
})
</script>

<template>
  <div class="feed-container">
    
    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="skeleton-list">
      <div v-for="n in 3" :key="n" class="skeleton-item card">
        <div class="s-header">
          <div class="s-avatar"></div>
          <div class="s-line short"></div>
        </div>
        <div class="s-line full"></div>
        <div class="s-line full"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="questions.length === 0" class="empty-state">
      <div class="empty-icon">🍃</div>
      <p>這裡好安靜，快來發布第一條動態吧！</p>
    </div>

    <!-- Feed List -->
    <transition-group name="list" tag="div" class="question-list" v-else>
      <article 
        v-for="(question, index) in questions" 
        :key="question._id" 
        class="card question-card"
        @click="handleNavigate(question._id)"
        :style="{ '--delay': index * 0.1 + 's' }"
      >
        <!-- User Info Header -->
        <div class="card-header">
          <div class="user-info">
            <img :src="getAvatarUrl(question.author.username)" class="avatar" alt="avatar" />
            <div class="meta-text">
              <span class="username">{{ question.author.username }}</span>
              <span class="time">{{ new Date(question.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>
          <span class="category-tag">提問</span>
        </div>

        <!-- Content -->
        <h3 class="q-title">{{ question.title }}</h3>
        <p class="q-preview">{{ question.content }}</p>

        <!-- Footer Actions -->
        <div class="card-footer">
          <div class="action-item">
            <span class="icon">💬</span>
            <span class="count">{{ question.answers ? question.answers.length : 0 }} 回答</span>
          </div>
          <div class="action-item">
            <span class="icon">🔥</span>
            <span class="count">熱度</span>
          </div>
        </div>
      </article>
    </transition-group>

  </div>
</template>

<style scoped>
.feed-container {
  padding: 0 1.25rem;
}

/* --- Card Styles --- */
.question-card {
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  animation: slideUp 0.3s ease backwards;
  animation-delay: var(--delay);
  border: 2px solid var(--border-color);
}

.question-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color);
}

.question-card:active {
  transform: scale(0.99);
  background: var(--bg-hover);
}

.question-card:focus {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  background: #f0f0f0;
  border: 2px solid var(--border-color);
}

.meta-text {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--text-main);
}

.time {
  font-size: 0.9375rem;
  color: var(--text-muted);
}

.category-tag {
  font-size: 0.9375rem;
  background: #FFF5F5;
  color: var(--primary-color);
  padding: 0.5rem 0.875rem;
  border-radius: 0.75rem;
  font-weight: 600;
  border: 1px solid rgba(255, 82, 82, 0.2);
}

.q-title {
  font-size: 1.375rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  line-height: 1.4;
  color: var(--text-main);
}

.q-preview {
  font-size: 1.125rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  border-top: 2px solid var(--border-color);
  padding-top: 1rem;
  display: flex;
  gap: 1.5rem;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: var(--text-secondary);
  font-weight: 500;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.action-item:hover {
  background: var(--bg-hover);
  color: var(--text-main);
}

/* --- Skeleton Animation --- */
.skeleton-item {
  height: 200px;
  background: #fff;
  border: 2px solid var(--border-color);
}
.s-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
.s-avatar { width: 48px; height: 48px; background: #f0f0f0; border-radius: 50%; }
.s-line { height: 16px; background: #f0f0f0; border-radius: 8px; margin-bottom: 1rem; }
.s-line.short { width: 120px; }
.s-line.full { width: 100%; }

.skeleton-item * {
  animation: pulse 1.5s infinite ease-in-out;
}

/* --- Empty State --- */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}
.empty-icon { font-size: 4rem; margin-bottom: 1rem; }
.empty-state p {
  font-size: 1.25rem;
  font-weight: 500;
}

/* --- List Transitions --- */
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