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
  <div class="px-5">
    
    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-6">
      <div v-for="n in 3" :key="n" class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse h-64">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 bg-slate-100 rounded-full"></div>
          <div class="h-4 bg-slate-100 rounded w-1/3"></div>
        </div>
        <div class="h-4 bg-slate-100 rounded w-full mb-3"></div>
        <div class="h-4 bg-slate-100 rounded w-2/3"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="questions.length === 0" class="text-center py-16 text-slate-400">
      <div class="text-6xl mb-4">🍃</div>
      <p class="text-xl font-medium">這裡好安靜，快來發布第一條動態吧！</p>
    </div>

    <!-- Feed List -->
    <transition-group name="list" tag="div" class="space-y-6" v-else>
      <article 
        v-for="(question, index) in questions" 
        :key="question._id" 
        class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-primary-200 active:scale-[0.99] cursor-pointer group"
        @click="handleNavigate(question._id)"
        :style="{ transitionDelay: index * 50 + 'ms' }"
      >
        <!-- User Info Header -->
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-3">
            <img :src="getAvatarUrl(question.authorName || question.author?.username || '匿名')" class="w-12 h-12 rounded-full object-cover border border-slate-100 bg-slate-50" alt="avatar" />
            <div class="flex flex-col">
              <span class="font-bold text-slate-900 text-lg leading-tight">{{ question.authorName || question.author?.username || '匿名用戶' }}</span>
              <span class="text-sm text-slate-400 font-medium">{{ new Date(question.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>
          <span class="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full border border-primary-100 tracking-wide">提問</span>
        </div>

        <!-- Content -->
        <h3 class="text-xl font-extrabold text-slate-800 mb-3 leading-snug group-hover:text-primary-600 transition-colors">{{ question.title }}</h3>
        <p class="text-slate-500 text-lg leading-relaxed mb-6 line-clamp-2">{{ question.content }}</p>

        <!-- Footer Actions -->
        <div class="border-t border-slate-100 pt-4 flex gap-6">
          <div class="flex items-center gap-2 text-slate-400 font-semibold group-hover:text-primary-500 transition-colors">
            <span class="text-xl">💬</span>
            <span>{{ question.answers ? question.answers.length : 0 }} 回答</span>
          </div>
          <div class="flex items-center gap-2 text-slate-400 font-semibold group-hover:text-secondary-500 transition-colors">
            <span class="text-xl">🔥</span>
            <span>熱度</span>
          </div>
        </div>
      </article>
    </transition-group>

  </div>
</template>

<style scoped>
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
</style>