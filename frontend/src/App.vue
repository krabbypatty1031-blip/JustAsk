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
    // 復用 Profile 中的邏輯，這裡直接設置 CSS 變量
    // 0 -> 100%, 1 -> 112.5%, 2 -> 125%
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
  { label: '首頁', path: '/', icon: '🏠' },
  { label: '提問', path: '/ask', icon: '', special: true },
  { label: '我的', path: '/profile', activePath: ['/login', '/register', '/profile'], icon: '👤' }
]

const isRouteActive = (item) => {
  if (item.activePath) return item.activePath.includes(route.path)
  return route.path === item.path
}

const handleNavClick = (item) => {
  // 如果點擊 "我的" 且未登入，去登入頁 (Profile 頁面也會自己檢查，但這裡攔截體驗更好)
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

    <nav v-if="!['/login', '/register'].includes(route.path)" class="bottom-nav">
      <div 
        v-for="item in navItems" 
        :key="item.path"
        class="nav-item"
        :class="{ 'active': isRouteActive(item), 'nav-special': item.special }"
        @click="handleNavClick(item)"
      >
        <div class="icon-wrapper">
          <template v-if="item.special">
            <!-- Question Mark SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </template>
          <template v-else>
            {{ item.icon }}
          </template>
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
}

.content-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 7rem; /* Increased from 5rem */
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
  max-width: 30rem; /* 跟 app 一樣寬 */
  height: 6rem; /* Increased from 4.375rem (~70px -> ~96px) */
  background: rgba(255, 255, 255, 0.7); /* More transparent */
  backdrop-filter: blur(25px) saturate(180%); /* Frosted glass effect */
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -0.5rem 1.5rem rgba(0,0,0,0.05);
  z-index: 999;
  border-top-left-radius: 1.5rem; /* Slightly larger radius */
  border-top-right-radius: 1.5rem;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #B0B0B0;
  transition: all 0.3s ease;
  flex: 1;
  height: 100%;
  cursor: pointer;
}

.nav-item.active {
  color: var(--primary-color);
}

.icon-wrapper {
  font-size: 1.8rem; /* Increased from 1.5rem */
  margin-bottom: 0.25rem;
  transition: transform 0.2s;
}

.nav-item:active .icon-wrapper {
  transform: scale(0.8);
}

.nav-label {
  font-size: 0.9rem; /* Increased from 0.75rem */
  font-weight: 600;
}

.nav-special .icon-wrapper {
  background: var(--primary-gradient);
  width: 4rem; /* Increased from 3rem */
  height: 4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.2rem; /* Increased icon inside */
  box-shadow: 0 0.5rem 1rem rgba(255, 94, 98, 0.3);
  margin-top: -2.5rem; /* Pop out more */
  border: 0.3rem solid rgba(255, 255, 255, 0.8); /* Semi-transparent border match */
}

.nav-special .nav-label {
  margin-top: 0.25rem;
}

.toast {
  position: fixed;
  top: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 3rem;
  font-size: 1rem;
  font-weight: 500;
  z-index: 2000;
  box-shadow: 0 0.6rem 2rem rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  max-width: 90%;
  text-align: center;
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -1.25rem) scale(0.9);
}
</style>
