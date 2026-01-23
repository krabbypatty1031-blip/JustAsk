import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import CreateQuestion from '../views/CreateQuestion.vue'
import QuestionDetail from '../views/QuestionDetail.vue'
import Profile from '../views/Profile.vue'
import ForgotPassword from '../views/ForgotPassword.vue'
import axios from '../api/axios'

const routes = [
  { path: '/', component: Home, meta: { requiresAuth: true } },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/forgot-password', component: ForgotPassword },
  { path: '/ask', component: CreateQuestion },
  { path: '/question/:id', component: QuestionDetail },
  { path: '/profile', component: Profile }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  try {
    const response = await axios.get('/status')
    if (response.data && response.data.user) return true
  } catch (error) {
    // Fall through to redirect when status check fails.
  }

  return '/login'
})

export default router
