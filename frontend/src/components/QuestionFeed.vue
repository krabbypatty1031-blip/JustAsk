<script setup>
import { ref, onMounted, inject } from 'vue'
import axios from '../api/axios'
import { useRouter } from 'vue-router'
import { getAvatarUrl } from '../utils/avatar'
import Icon from './Icon.vue'

const router = useRouter()
const questions = ref([])
const isLoading = ref(true)
const showToast = inject('showToast')

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

onMounted(() => {
  fetchQuestions()
})
</script>

<template>
  <div class="neu-feed">

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="neu-skeleton-list" role="status" aria-label="載入中">
      <div v-for="n in 3" :key="n" class="neu-skeleton-card">
        <!-- Header -->
        <div class="neu-skeleton-header">
          <div class="neu-skeleton-avatar"></div>
          <div class="neu-skeleton-meta">
            <div class="neu-skeleton-line w-1/3"></div>
            <div class="neu-skeleton-line w-1/4 short"></div>
          </div>
          <div class="neu-skeleton-badge"></div>
        </div>

        <!-- Content -->
        <div class="neu-skeleton-content">
          <div class="neu-skeleton-line w-full"></div>
          <div class="neu-skeleton-line w-4/5"></div>
          <div class="neu-skeleton-line w-full short"></div>
          <div class="neu-skeleton-line w-3/4 short"></div>
        </div>

        <!-- Footer -->
        <div class="neu-skeleton-footer">
          <div class="neu-skeleton-line w-20"></div>
          <div class="neu-skeleton-line w-16"></div>
        </div>
      </div>
      <span class="sr-only">載入問題列表中...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="questions.length === 0" class="neu-empty-state">
      <div class="neu-empty-icon">
        <Icon name="chat-bubble-left-ellipsis" :size="64" :stroke-width="1.5" />
      </div>
      <p class="neu-empty-text">這裡好安靜，快來發布第一條動態吧！</p>
    </div>

    <!-- Feed List -->
    <transition-group name="list" tag="div" class="neu-feed-list" v-else>
      <article
        v-for="(question, index) in questions"
        :key="question._id"
        class="neu-question-card"
        @click="handleNavigate(question._id)"
        :style="{ animationDelay: index * 50 + 'ms' }"
      >
        <!-- User Info Header -->
        <div class="neu-card-header">
          <div class="neu-user-info">
            <div class="neu-avatar-container">
              <img
                :src="getAvatarUrl(question.authorName || question.author?.username || '匿名')"
                class="neu-avatar"
                alt="avatar"
              />
            </div>
            <div class="neu-user-meta">
              <span class="neu-username">{{ question.authorName || question.author?.username || '匿名用戶' }}</span>
              <span class="neu-post-time">{{ new Date(question.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>
          <span class="neu-badge">提問</span>
        </div>

        <!-- Content -->
        <h3 class="neu-card-title">{{ question.title }}</h3>
        <p class="neu-card-content">{{ question.content }}</p>

        <!-- Footer Actions -->
        <div class="neu-card-footer">
          <div class="neu-stat">
            <Icon name="chat-bubble-left-ellipsis" :size="18" />
            <span>{{ question.answers ? question.answers.length : 0 }} 回答</span>
          </div>
          <div class="neu-stat">
            <Icon name="heart" :size="18" />
            <span>熱度</span>
          </div>
        </div>
      </article>
    </transition-group>

  </div>
</template>

<style scoped>
/* ============================================
   NEUMORPHISM QUESTION FEED
   ============================================ */
.neu-feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.neu-feed-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* --- Question Card --- */
.neu-question-card {
  background: var(--neu-bg);
  border-radius: 1.25rem;
  padding: 1.25rem;
  box-shadow: var(--neu-shadow-out);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.5s ease backwards;
}

.neu-question-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--neu-shadow-out-lg);
}

.neu-question-card:active {
  transform: translateY(0);
  box-shadow: var(--neu-shadow-in);
}

/* --- Card Header --- */
.neu-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.neu-user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.neu-avatar-container {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--neu-bg);
  box-shadow: var(--neu-shadow-out-sm);
  padding: 3px;
}

.neu-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.neu-user-meta {
  display: flex;
  flex-direction: column;
}

.neu-username {
  font-size: 1rem;
  font-weight: 700;
  color: var(--neu-text);
  line-height: 1.3;
}

.neu-post-time {
  font-size: 0.8125rem;
  color: var(--neu-text-muted);
  font-weight: 500;
}

.neu-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--neu-primary);
  background: var(--neu-bg);
  padding: 0.375rem 0.875rem;
  border-radius: 2rem;
  box-shadow: var(--neu-shadow-out-sm);
  letter-spacing: 0.5px;
}

/* --- Card Content --- */
.neu-card-title {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--neu-text);
  margin-bottom: 0.5rem;
  line-height: 1.4;
  transition: color 0.2s ease;
}

.neu-question-card:hover .neu-card-title {
  color: var(--neu-primary);
}

.neu-card-content {
  font-size: 0.9375rem;
  color: var(--neu-text-muted);
  line-height: 1.6;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* --- Card Footer --- */
.neu-card-footer {
  display: flex;
  gap: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--neu-bg-dark);
}

.neu-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--neu-text-light);
  transition: color 0.2s ease;
}

.neu-question-card:hover .neu-stat:first-child {
  color: var(--neu-primary);
}

.neu-question-card:hover .neu-stat:last-child {
  color: var(--neu-error);
}

/* --- Empty State --- */
.neu-empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--neu-bg);
  border-radius: 1.5rem;
  box-shadow: var(--neu-shadow-in);
}

.neu-empty-icon {
  color: var(--neu-text-light);
  margin-bottom: 1rem;
  opacity: 0.6;
}

.neu-empty-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--neu-text-muted);
}

/* --- Skeleton Loading --- */
.neu-skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.neu-skeleton-card {
  background: var(--neu-bg);
  border-radius: 1.25rem;
  padding: 1.25rem;
  box-shadow: var(--neu-shadow-out);
}

.neu-skeleton-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.neu-skeleton-avatar {
  width: 3rem;
  height: 3rem;
  background: var(--neu-bg-dark);
  border-radius: 50%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.neu-skeleton-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.neu-skeleton-badge {
  width: 4rem;
  height: 1.5rem;
  background: var(--neu-bg-dark);
  border-radius: 1rem;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.neu-skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.neu-skeleton-footer {
  display: flex;
  gap: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--neu-bg-dark);
}

.neu-skeleton-line {
  height: 1rem;
  background: var(--neu-bg-dark);
  border-radius: 0.5rem;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.neu-skeleton-line.short {
  height: 0.75rem;
}

.neu-skeleton-line.w-full { width: 100%; }
.neu-skeleton-line.w-4\/5 { width: 80%; }
.neu-skeleton-line.w-3\/4 { width: 75%; }
.neu-skeleton-line.w-1\/3 { width: 33%; }
.neu-skeleton-line.w-1\/4 { width: 25%; }
.neu-skeleton-line.w-20 { width: 5rem; }
.neu-skeleton-line.w-16 { width: 4rem; }

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* --- List Transitions --- */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
