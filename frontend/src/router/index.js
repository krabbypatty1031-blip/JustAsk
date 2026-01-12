import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import CreateQuestion from '../views/CreateQuestion.vue'
import QuestionDetail from '../views/QuestionDetail.vue'
import Profile from '../views/Profile.vue'
import ForgotPassword from '../views/ForgotPassword.vue'

const routes = [
  { path: '/', component: Home },
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

export default router