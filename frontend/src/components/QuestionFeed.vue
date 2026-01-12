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
  padding: 0 20px;
}

/* --- Card Styles --- */
.question-card {
  padding: 20px;
  margin-bottom: 20px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  animation: slideUp 0.5s ease backwards;
  animation-delay: var(--delay);
}

/* 點擊時的波紋效果模擬 */
.question-card:active {
  transform: scale(0.98);
  background: #fafafa;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: #f0f0f0; /* Fallback */
}

.meta-text {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--text-main);
}

.time {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.category-tag {
  font-size: 0.75rem;
  background: #FFF5F5;
  color: var(--primary-color);
  padding: 4px 10px;
  border-radius: 10px;
  font-weight: 600;
}

.q-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 8px;
  line-height: 1.4;
  color: #222;
}

.q-preview {
  font-size: 0.9375rem;
  color: #666;
  line-height: 1.5;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  border-top: 1px solid #f5f5f5;
  padding-top: 12px;
  display: flex;
  gap: 20px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

/* --- Skeleton Animation --- */
.skeleton-item {
  height: 180px;
  background: #fff;
}
.s-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
.s-avatar { width: 40px; height: 40px; background: #f0f0f0; border-radius: 50%; }
.s-line { height: 12px; background: #f0f0f0; border-radius: 6px; margin-bottom: 10px; }
.s-line.short { width: 100px; }
.s-line.full { width: 100%; }

.skeleton-item * {
  animation: pulse 1.5s infinite ease-in-out;
}

/* --- Empty State --- */
.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}
.empty-icon { font-size: 3rem; margin-bottom: 10px; }

/* --- List Transitions --- */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>