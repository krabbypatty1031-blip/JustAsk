<script setup>
import { ref, onMounted, provide } from 'vue'
import axios from './api/axios'
import { useRouter, useRoute } from 'vue-router'

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

// 全局字體大小初始化
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
    // Home Icon
    iconSvg: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>' 
  },
  { 
    label: '提問', 
    path: '/ask', 
    special: true,
    // Question Mark Icon for "Ask"
    iconSvg: '<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line>'
  },
  { 
    label: '我的', 
    path: '/profile', 
    activePath: ['/login', '/register', '/profile', '/forgot-password'], 
    // User Icon
    iconSvg: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>' 
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
  <div class="app-container">
    <main class="content-area">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <nav v-if="!['/login', '/register', '/forgot-password', '/ask'].includes(route.path) && !route.path.startsWith('/question/')" class="bottom-nav">
      <div 
        v-for="item in navItems" 
        :key="item.path"
        class="nav-item"
        :class="{ 'active': isRouteActive(item), 'nav-special': item.special }"
        @click="handleNavClick(item)"
      >
        <div class="icon-wrapper">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="28" 
            height="28" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            v-html="item.iconSvg"
          >
          </svg>
        </div>
        <span class="nav-label">{{ item.label }}</span>
      </div>
    </nav>

    <transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-body);
  padding-top: var(--sat);
  padding-bottom: var(--sab);
}

.content-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: calc(7rem + var(--sab));
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.content-area::-webkit-scrollbar { display: none; }

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 30rem;
  height: calc(6.5rem + var(--sab));
  padding-bottom: var(--sab);
  background: #ffffff;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
  z-index: 999;
  border-top-left-radius: 1.5rem;
  border-top-right-radius: 1.5rem;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
  transition: all 0.2s ease;
  flex: 1;
  height: 100%;
  cursor: pointer;
  padding-bottom: 0.25rem;
  min-width: 4rem;
}

.nav-item:hover {
  color: var(--text-secondary);
}

.nav-item.active {
  color: var(--primary-color);
  font-weight: bold;
}

.nav-item:focus {
  outline: none;
  background: var(--bg-hover);
}

.icon-wrapper {
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-label {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Special styling for the middle "Ask" button */
.nav-special {
  position: relative;
  top: -24px;
}

.nav-special .icon-wrapper {
  background: var(--primary-gradient);
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 50%;
  color: white;
  box-shadow: 0 8px 20px rgba(255, 82, 82, 0.4);
  border: 4px solid white;
}

.nav-special .nav-label {
  margin-top: 0.5rem;
  color: var(--text-main);
  font-weight: 900;
  font-size: 1.125rem;
}

.nav-special:hover .icon-wrapper {
  transform: scale(1.05);
}

.nav-special:active .icon-wrapper {
  transform: scale(0.95);
}

.toast {
  position: fixed;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--text-main);
  color: white;
  padding: 1rem 2rem;
  border-radius: 2rem;
  font-size: 1.25rem;
  font-weight: 600;
  z-index: 2000;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  max-width: 90%;
  text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
}


.toast-enter-active, .toast-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -1.25rem) scale(0.9);
}
</style>
