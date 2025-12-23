<script setup>
import { ref, onMounted } from 'vue'
import axios from '../api/axios'
import { useRouter } from 'vue-router'

const router = useRouter()

// 状态管理
const questions = ref([])
const isLoading = ref(true)
const isError = ref(false)
const isNavigating = ref(false) // 用于防止重复点击跳转

// 获取数据函数
const fetchQuestions = async () => {
  isLoading.value = true
  isError.value = false
  
  try {
    // 模拟网络延迟，让骨架屏展示一会儿，避免闪烁
    // 实际生产中可以去掉 setTimeout
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const response = await axios.get('/questions')
    if (response.data.success) {
      questions.value = response.data.questions
    } else {
      throw new Error('数据格式错误')
    }
  } catch (error) {
    console.error('获取问题列表失败:', error)
    isError.value = true
  } finally {
    isLoading.value = false
  }
}

// 导航处理（带防抖）
const handleNavigate = (id) => {
  if (isNavigating.value) return
  
  isNavigating.value = true
  // 稍微延迟跳转，给用户点击反馈
  setTimeout(() => {
    router.push(`/question/${id}`)
    // 注意：这里不需要重置 isNavigating，因为页面会跳转销毁
    // 如果是单页应用保留组件，可以在 onActivated 钩子中重置
  }, 200)
}

// 初始化
onMounted(() => {
  fetchQuestions()
})
</script>

<template>
  <div class="feed-container">
    
    <!-- 1. 错误状态 (Error State) -->
    <div v-if="isError" class="status-box error-box" role="alert">
      <p class="status-text">网络好像有点慢，没加载出来。</p>
      <button @click="fetchQuestions" class="btn-retry">
        点这里再试一次
      </button>
    </div>

    <!-- 2. 加载状态 (Skeleton Loading) -->
    <div v-else-if="isLoading" class="skeleton-list" aria-busy="true" aria-label="正在加载内容">
      <div v-for="n in 3" :key="n" class="card skeleton-card">
        <div class="skeleton-title"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text short"></div>
        <div class="skeleton-btn"></div>
      </div>
      <p class="loading-text">正在努力加载内容...</p>
    </div>

    <!-- 3. 空状态 (Empty State) -->
    <div v-else-if="questions.length === 0" class="status-box empty-box">
      <p class="status-text">暂时还没有问题。</p>
      <p class="sub-text">您可以点击上方的“我要提问”来发布第一个问题。</p>
    </div>

    <!-- 4. 数据列表 (Data List) -->
    <div v-else class="question-list" role="feed">
      <article 
        v-for="question in questions" 
        :key="question._id" 
        class="card question-card"
      >
        <h2 class="question-title">{{ question.title }}</h2>
        
        <!-- 截取前80个字作为预览 -->
        <p class="question-preview">
          {{ question.content.length > 80 ? question.content.substring(0, 80) + '...' : question.content }}
        </p>
        
        <div class="meta-info">
          <span class="meta-item">
            <i class="icon-answer">💬</i> 
            {{ question.answers ? question.answers.length : 0 }} 个回答
          </span>
          <span class="meta-item">
            {{ new Date(question.createdAt).toLocaleDateString() }}
          </span>
        </div>

        <!-- 显性的大按钮 -->
        <button 
          @click="handleNavigate(question._id)" 
          class="btn-view"
          :disabled="isNavigating"
          :aria-label="'查看问题详情：' + question.title"
        >
          {{ isNavigating ? '正在打开...' : '查看详情 / 回答' }}
        </button>
      </article>
    </div>

  </div>
</template>

<style scoped>
/* 基础容器 */
.feed-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 10px;
  font-family: "Microsoft YaHei", "Heiti SC", sans-serif; /* 选用清晰的无衬线字体 */
}

/* 通用卡片样式 */
.card {
  background: #ffffff;
  border: 2px solid #e0e0e0; /* 明显的边框 */
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px; /* 大间距防误触 */
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

/* --- 问题卡片样式 --- */
.question-title {
  font-size: 22px; /* 大字号标题 */
  font-weight: bold;
  color: #000000; /* 纯黑增强对比 */
  margin-top: 0;
  margin-bottom: 16px;
  line-height: 1.4;
}

.question-preview {
  font-size: 18px; /* 大字号正文 */
  color: #333333; /* 深灰 */
  line-height: 1.6; /* 宽松行高 */
  margin-bottom: 20px;
}

.meta-info {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee; /* 分割线 */
}

/* 显性按钮样式 */
.btn-view {
  width: 100%;
  padding: 16px; /* 大触控区 */
  font-size: 20px;
  font-weight: bold;
  color: white;
  background-color: #2c3e50; /* 深色背景高对比 */
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-view:hover {
  background-color: #1a252f;
}

.btn-view:active {
  transform: scale(0.98);
}

.btn-view:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

/* --- 状态提示样式 (Error & Empty) --- */
.status-box {
  text-align: center;
  padding: 40px 20px;
  background: #fff;
  border-radius: 12px;
  border: 2px dashed #ccc;
}

.status-text {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
}

.btn-retry {
  padding: 15px 40px;
  font-size: 18px;
  background-color: #e74c3c; /* 红色醒目 */
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* --- 骨架屏样式 (Skeleton) --- */
.skeleton-card {
  background: #fff;
}

.skeleton-title {
  height: 28px;
  background-color: #eee;
  margin-bottom: 20px;
  width: 70%;
  border-radius: 4px;
}

.skeleton-text {
  height: 20px;
  background-color: #eee;
  margin-bottom: 12px;
  width: 100%;
  border-radius: 4px;
}

.skeleton-text.short {
  width: 60%;
}

.skeleton-btn {
  height: 50px;
  background-color: #eee;
  margin-top: 20px;
  border-radius: 8px;
}

.loading-text {
  text-align: center;
  font-size: 18px;
  color: #666;
  margin-top: 10px;
}

/* 简单的骨架屏动画 */
@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.skeleton-card div {
  animation: pulse 1.5s infinite ease-in-out;
}
</style>
