<script setup>
import { ref, onMounted, provide } from 'vue'
import axios from './api/axios'
import { useRouter, useRoute } from 'vue-router'
import Icon from './components/Icon.vue'

const router = useRouter()
const route = useRoute()
const user = ref(null)

const toast = ref({ show: false, message: '', type: 'info' })

const showToast = (message, type = 'info') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}
provide('showToast', showToast)
provide('currentUser', user)

const checkStatus = async () => {
  try {
    const response = await axios.get('/api/status')
    if (response.data && response.data.user) {
      user.value = response.data.user
    } else {
      user.value = null
    }
  } catch (error) { user.value = null }
}

router.afterEach(() => { checkStatus() })

const initFontSize = () => {
  const savedLevel = localStorage.getItem('user_font_pref')
  if (savedLevel) {
    const levels = ['100%', '112.5%', '125%']
    const level = parseInt(savedLevel)
    if (levels[level]) {
      document.documentElement.style.setProperty('--app-scale', levels[level])
    }
  }
}

onMounted(() => {
  checkStatus()
  initFontSize()
})

const navItems = [
  {
    label: '首頁',
    path: '/',
    icon: 'home'
  },
  {
    label: '提問',
    path: '/ask',
    special: true,
    icon: 'question-mark-circle'
  },
  {
    label: '我的',
    path: '/profile',
    activePath: ['/login', '/register', '/profile', '/forgot-password'],
    icon: 'user'
  }
]

const isRouteActive = (item) => {
  if (item.activePath) return item.activePath.includes(route.path)
  return route.path === item.path
}

const handleNavClick = (item) => {
  if (item.label === '我的' && !user.value) {
    router.push('/login')
  } else {
    router.push(item.path)
  }
}
</script>

<template>
  <div class="neu-app">
    <main class="neu-main"
          :class="{ 'has-nav': !['/login', '/register', '/forgot-password', '/ask'].includes(route.path) && !route.path.startsWith('/question/') }">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Neumorphic Bottom Navigation -->
    <nav v-if="!['/login', '/register', '/forgot-password', '/ask'].includes(route.path) && !route.path.startsWith('/question/')"
         class="neu-nav"
         role="navigation"
         aria-label="主要導航"
    >
      <div class="neu-nav-inner">
        <button
          v-for="item in navItems"
          :key="item.path"
          class="neu-nav-btn"
          :class="{
            'active': isRouteActive(item),
            'special': item.special
          }"
          @click="handleNavClick(item)"
          :aria-label="`前往${item.label}`"
          :aria-current="isRouteActive(item) ? 'page' : undefined"
        >
          <div class="neu-nav-icon" :class="{ 'special-icon': item.special }">
            <Icon
              :name="item.icon"
              :size="item.special ? 28 : 24"
              :stroke-width="2"
            />
          </div>
          <span class="neu-nav-label">{{ item.label }}</span>
        </button>
      </div>
    </nav>

    <!-- Neumorphic Toast -->
    <transition name="toast">
      <div v-if="toast.show"
           class="neu-toast"
           :class="{ 'error': toast.type === 'error', 'success': toast.type === 'success' }"
           role="alert">
        <Icon :name="toast.type === 'error' ? 'exclamation-circle' : toast.type === 'success' ? 'check-circle' : 'information-circle'" :size="20" />
        <span>{{ toast.message }}</span>
      </div>
    </transition>
  </div>
</template>

<style>
/* ============================================
   NEUMORPHISM APP SHELL
   ============================================ */
.neu-app {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--neu-bg);
  padding-top: var(--sat);
  padding-bottom: var(--sab);
}

.neu-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.neu-main.has-nav {
  padding-bottom: calc(6rem + var(--sab));
}

/* --- Bottom Navigation --- */
.neu-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  background: var(--neu-bg);
  padding: 0.75rem 1rem calc(1rem + var(--sab));
  z-index: 50;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.06);
}

.neu-nav-inner {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  gap: 0.5rem;
}

.neu-nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 4rem;
}

.neu-nav-icon {
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: var(--neu-bg);
  color: var(--neu-text-muted);
  transition: all 0.3s ease;
}

.neu-nav-btn:hover .neu-nav-icon {
  color: var(--neu-primary);
}

.neu-nav-btn.active .neu-nav-icon {
  background: var(--neu-bg);
  box-shadow: var(--neu-shadow-in);
  color: var(--neu-primary);
}

/* Special Center Button */
.neu-nav-btn.special {
  position: relative;
  top: -0.75rem;
}

.neu-nav-btn.special .neu-nav-icon {
  width: 3.5rem;
  height: 3.5rem;
  background: linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-dark) 100%);
  color: white;
  border-radius: 50%;
  box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.15),
              -3px -3px 8px rgba(255, 255, 255, 0.8),
              0 4px 16px rgba(20, 184, 166, 0.35);
}

.neu-nav-btn.special:hover .neu-nav-icon {
  transform: scale(1.08);
  box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.15),
              -4px -4px 10px rgba(255, 255, 255, 0.8),
              0 6px 20px rgba(20, 184, 166, 0.45);
}

.neu-nav-btn.special:active .neu-nav-icon {
  transform: scale(0.95);
  box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.15),
              inset -2px -2px 4px rgba(255, 255, 255, 0.1);
}

.neu-nav-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--neu-text-muted);
  transition: color 0.2s ease;
}

.neu-nav-btn:hover .neu-nav-label,
.neu-nav-btn.active .neu-nav-label {
  color: var(--neu-primary);
}

.neu-nav-btn.special .neu-nav-label {
  font-weight: 700;
  color: var(--neu-text);
}

/* --- Toast Notification --- */
.neu-toast {
  position: fixed;
  top: calc(1.5rem + var(--sat));
  left: 50%;
  transform: translateX(-50%);
  max-width: calc(100% - 2rem);
  background: var(--neu-bg);
  padding: 0.875rem 1.5rem;
  border-radius: 2rem;
  box-shadow: var(--neu-shadow-out),
              0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--neu-text);
  z-index: 2000;
}

.neu-toast.error {
  color: var(--neu-error);
}

.neu-toast.success {
  color: var(--neu-success);
}

/* --- Transitions --- */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -1.5rem) scale(0.9);
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(5px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* --- Scrollbar Hide --- */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
