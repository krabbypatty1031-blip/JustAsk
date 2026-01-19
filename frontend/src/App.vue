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
  <div class="flex flex-col h-screen bg-primary-50 pt-[var(--sat)] pb-[var(--sab)]">
    <main class="flex-1 overflow-y-auto overflow-x-hidden pb-[calc(7rem+var(--sab))] scrollbar-hide">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <nav v-if="!['/login', '/register', '/forgot-password', '/ask'].includes(route.path) && !route.path.startsWith('/question/')" 
         class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[30rem] h-[calc(6.5rem+var(--sab))] pb-[var(--sab)] bg-white/90 backdrop-blur-md border-t border-primary-100 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 rounded-t-3xl">
      <div 
        v-for="item in navItems" 
        :key="item.path"
        class="flex flex-col items-center justify-center text-slate-400 transition-all duration-200 flex-1 h-full cursor-pointer pb-1 min-w-[4rem] hover:text-slate-600"
        :class="{ 'text-primary-500 font-bold': isRouteActive(item), 'relative -top-6': item.special }"
        @click="handleNavClick(item)"
      >
        <div class="mb-1 flex items-center justify-center transition-transform duration-200"
             :class="{ 'w-[4.5rem] h-[4.5rem] rounded-full text-white shadow-lg border-4 border-white bg-gradient-to-br from-primary-500 to-cyan-500 hover:scale-105 active:scale-95': item.special }">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            :width="item.special ? 32 : 28" 
            :height="item.special ? 32 : 28" 
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
        <span class="text-xs font-bold tracking-wide" :class="{ 'mt-2 text-slate-800 text-sm': item.special }">{{ item.label }}</span>
      </div>
    </nav>

    <transition name="toast">
      <div v-if="toast.show" 
           class="fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-lg font-semibold z-[2000] shadow-xl flex items-center max-w-[90%] text-center border-2 border-white/30 backdrop-blur-sm"
           :class="toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<style>
.toast-enter-active, .toast-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -1.25rem) scale(0.9);
}
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
