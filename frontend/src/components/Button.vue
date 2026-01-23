<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'outline', 'ghost', 'danger'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  iconLeft: {
    type: String,
    default: null
  },
  iconRight: {
    type: String,
    default: null
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value)
  }
})

const emit = defineEmits(['click'])

const handleClick = (e) => {
  if (!props.disabled && !props.loading) {
    emit('click', e)
  }
}

const buttonClasses = computed(() => {
  const classes = ['button-base']

  // Variant classes
  const variantMap = {
    primary: 'bg-gradient-to-br from-primary-500 to-cyan-500 text-white hover:from-primary-600 hover:to-cyan-600 active:from-primary-700 active:to-cyan-700 shadow-sm',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700 shadow-sm',
    outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 active:bg-primary-100',
    ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm'
  }
  classes.push(variantMap[props.variant])

  // Size classes
  const sizeMap = {
    sm: 'px-4 py-2 text-sm min-h-[40px] rounded-lg',
    md: 'px-6 py-3 text-base min-h-[48px] rounded-xl',
    lg: 'px-8 py-4 text-lg min-h-[56px] rounded-2xl'
  }
  classes.push(sizeMap[props.size])

  // State classes
  if (props.disabled || props.loading) {
    classes.push('opacity-60 cursor-not-allowed')
  } else {
    classes.push('cursor-pointer neu-ripple')
  }

  // Width
  if (props.fullWidth) {
    classes.push('w-full')
  }

  return classes.join(' ')
})
</script>

<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
    :aria-busy="loading"
  >
    <!-- Loading Spinner -->
    <div v-if="loading" class="spinner mr-2"></div>

    <!-- Icon Left -->
    <Icon v-if="iconLeft && !loading" :name="iconLeft" :size="size === 'sm' ? 16 : size === 'md' ? 20 : 24" class="mr-2" />

    <!-- Slot Content -->
    <span class="font-semibold"><slot /></span>

    <!-- Icon Right -->
    <Icon v-if="iconRight && !loading" :name="iconRight" :size="size === 'sm' ? 16 : size === 'md' ? 20 : 24" class="ml-2" />
  </button>
</template>

<style scoped>
.button-base {
  @apply inline-flex items-center justify-center;
  @apply font-semibold transition-all duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
  @apply disabled:cursor-not-allowed;
}

.spinner {
  @apply w-4 h-4 rounded-full border-2 border-white/30 border-t-white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
