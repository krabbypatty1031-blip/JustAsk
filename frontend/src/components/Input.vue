<script setup>
import { computed, ref } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'email', 'password', 'tel', 'number', 'url', 'search'].includes(value)
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  autocomplete: {
    type: String,
    default: ''
  },
  iconLeft: {
    type: String,
    default: null
  },
  iconRight: {
    type: String,
    default: null
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  maxlength: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'input'])

const inputRef = ref(null)
const showPassword = ref(false)

const inputType = computed(() => {
  if (props.type === 'password' && showPassword.value) {
    return 'text'
  }
  return props.type
})

const inputClasses = computed(() => {
  const classes = ['input-base']

  // Size classes
  const sizeMap = {
    sm: 'px-4 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]'
  }
  classes.push(sizeMap[props.size])

  // Icon padding adjustments
  if (props.iconLeft) {
    classes.push('pl-11')
  }
  if (props.iconRight || props.type === 'password') {
    classes.push('pr-11')
  }

  // State classes
  if (props.error) {
    classes.push('border-red-500 focus:ring-red-500')
  } else {
    classes.push('border-slate-200 focus:border-primary-500 focus:ring-primary-500')
  }

  if (props.disabled) {
    classes.push('bg-slate-50 cursor-not-allowed opacity-60')
  } else {
    classes.push('bg-white')
  }

  return classes.join(' ')
})

const handleInput = (e) => {
  emit('update:modelValue', e.target.value)
  emit('input', e)
}

const handleBlur = (e) => {
  emit('blur', e)
}

const handleFocus = (e) => {
  emit('focus', e)
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="input-wrapper">
    <!-- Label -->
    <label v-if="label" :for="label" class="block text-sm font-semibold text-slate-700 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <!-- Input Container -->
    <div class="relative">
      <!-- Icon Left -->
      <div v-if="iconLeft" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <Icon :name="iconLeft" :size="20" />
      </div>

      <!-- Input Field -->
      <input
        ref="inputRef"
        :id="label"
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :class="inputClasses"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${label}-error` : undefined"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <!-- Icon Right / Password Toggle -->
      <div v-if="type === 'password'" class="absolute right-3 top-1/2 -translate-y-1/2">
        <button
          type="button"
          @click="togglePasswordVisibility"
          class="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          :aria-label="showPassword ? '隱藏密碼' : '顯示密碼'"
        >
          <Icon :name="showPassword ? 'eye-slash' : 'eye'" :size="20" />
        </button>
      </div>
      <div v-else-if="iconRight" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <Icon :name="iconRight" :size="20" />
      </div>
    </div>

    <!-- Error Message -->
    <p v-if="error" :id="`${label}-error`" class="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
      <Icon name="exclamation-circle" :size="16" />
      {{ error }}
    </p>

    <!-- Character Count (if maxlength is set) -->
    <p v-if="maxlength" class="mt-1 text-xs text-slate-400 text-right">
      {{ modelValue?.length || 0 }} / {{ maxlength }}
    </p>
  </div>
</template>

<style scoped>
.input-base {
  @apply w-full rounded-xl border-2;
  @apply transition-all duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-0;
  @apply placeholder:text-slate-400;
  @apply font-medium;
}
</style>
