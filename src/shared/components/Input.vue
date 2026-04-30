<template>
  <div class="input-wrapper" :class="wrapperClass">
    <!-- Лейбл, если передан -->
    <label 
      v-if="label || $slots.label" 
      :for="id" 
      class="block text-sm font-medium text-gray-700 mb-1"
      :class="labelClass"
    >
      <slot name="label">{{ label }}</slot>
    </label>
    
    <div class="relative">
      <!-- Префикс (иконка или текст слева) -->
      <div 
        v-if="prefix || $slots.prefix" 
        class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      >
        <slot name="prefix">
          <span v-if="prefix">{{ prefix }}</span>
        </slot>
      </div>
      
      <!-- Основной input -->
      <input
        :id="id"
        :type="type"
        :name="name"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        :min="min"
        :max="max"
        :step="step"
        :pattern="pattern"
        :class="[
          'w-full rounded-lg transition-all duration-200 outline-none border-color border-2',
          baseInputClass,
          {
            'pl-10': prefix || $slots.prefix,
            'pr-10': suffix || $slots.suffix || clearable && modelValue,
            'opacity-60 cursor-not-allowed': disabled,
            'cursor-default': readonly,
            'border-red-300 focus:border-red-500': error,
            'border-gray-300 focus:border-brand-default': !error && !disabled,
          }
        ]"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keyup.enter="onEnter"
      />
      
      <!-- Суффикс (иконка или текст справа) -->
      <div 
        v-if="suffix || $slots.suffix" 
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      >
        <slot name="suffix">
          <span v-if="suffix">{{ suffix }}</span>
        </slot>
      </div>
      
      <!-- Кнопка очистки -->
      <button
        v-if="clearable && modelValue"
        type="button"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
        @click="clearInput"
        tabindex="-1"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <!-- Описание/подсказка -->
    <p 
      v-if="hint || $slots.hint" 
      class="mt-1 text-sm"
      :class="{
        'text-gray-500': !error,
        'text-red-500': error
      }"
    >
      <slot name="hint">{{ hint }}</slot>
    </p>
    
    <!-- Сообщение об ошибке -->
    <p 
      v-if="errorMessage" 
      class="mt-1 text-sm text-red-500"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  // Основные свойства
  modelValue?: string | number
  type?: 'text' | 'password' | 'email' | 'tel' | 'number' | 'search' | 'url' | 'date'
  id?: string
  name?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  autocomplete?: string
  
  // Валидация
  min?: string | number
  max?: string | number
  step?: string | number
  pattern?: string
  
  // Контент
  label?: string
  hint?: string
  prefix?: string
  suffix?: string
  
  // Состояния
  error?: boolean
  errorMessage?: string
  clearable?: boolean
  
  // Классы для кастомизации
  wrapperClass?: string
  labelClass?: string
  baseInputClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  id: '',
  name: '',
  placeholder: '',
  required: false,
  disabled: false,
  readonly: false,
  autocomplete: 'off',
  min: undefined,
  max: undefined,
  step: undefined,
  pattern: undefined,
  label: '',
  hint: '',
  prefix: '',
  suffix: '',
  error: false,
  errorMessage: '',
  clearable: false,
  wrapperClass: '',
  labelClass: '',
  baseInputClass: 'px-3.5 py-2 border text-base bg-white text-gray-900 placeholder:text-gray-500'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'input': [event: Event]
  'focus': [event: FocusEvent]
  'blur': [event: FocusEvent]
  'enter': []
  'clear': []
}>()

// // Генерация уникального ID если не передан
// const localId = computed(() => props.id || `input-${Math.random().toString(36).substr(2, 9)}`)

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
  emit('input', event)
}

const onFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const onBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const onEnter = () => {
  emit('enter')
}

const clearInput = () => {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<style scoped>
.input-wrapper {
  font-family: inherit;
}

/* Убираем стрелки у input[type="number"] */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  appearance: textfield;
}

/* Плавный переход для бордера */
input {
  transition-property: border-color, box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>