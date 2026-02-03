<template>
  <div 
    class="border rounded-lg p-4 transition-all duration-200 hover:border-red-300"
    :class="{
      'border-red-400 bg-blue-50': isEditing,
      'border-gray-200 hover:shadow-sm': !isEditing
    }"
    v-on:mouseleave="showHint=false"
    v-on:mouseenter="showHint=true"
  >
    <!-- Режим просмотра -->
    <div 
      v-if="!isEditing"
      class="cursor-pointer"
      @click="startEditing"
      @dblclick="startEditing"
    >
      <h3 class="font-medium text-gray-900 mb-1">
        {{ title }}
      </h3>
      <p class="text-sm text-gray-600">
        {{ description || 'Добавьте описание...' }}
      </p>
      
      <!-- Индикатор редактирования при наведении -->
      <div class="mt-2 text-xs text-gray-400 opacity-0 transition-opacity" :class="{'opacity-100': showHint}">
        ✏️ Кликните для редактирования
      </div>
    </div>
    
    <!-- Режим редактирования -->
    <div v-else class="space-y-3">
      <!-- Поле названия -->
      <input
        ref="titleInput"
        v-model="editableTitle"
        type="text"
        placeholder="Название"
        class="w-full p-2 border rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
        @keyup.enter="save"
        @keyup.escape="cancel"
      />
      
      <!-- Поле описания -->
      <textarea
        v-model="editableDescription"
        placeholder="Описание"
        rows="3"
        class="w-full p-2 border rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
        @keyup.ctrl.enter="save"
        @keyup.escape="cancel"
      ></textarea>
      
      <!-- Кнопки действий -->
      <div class="flex justify-end space-x-2 pt-2">
        <button
          @click="cancel"
          class="px-3 py-1 text-sm border rounded hover:bg-gray-50"
        >
          Отмена
        </button>
        <button
          @click="save"
          class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
        >
          Сохранить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onUnmounted, onMounted } from 'vue'

interface Props {
  title: string
  description?: string
}

interface Emits {
  (e: 'update', payload: { title: string; description: string }): void
  (e: 'delete'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Состояние
const showHint = ref(false)
const isEditing = ref(false)
const editableTitle = ref(props.title)
const editableDescription = ref(props.description || '')
const titleInput = ref<HTMLInputElement>()

// Начать редактирование
const startEditing = () => {
  isEditing.value = true
  editableTitle.value = props.title
  editableDescription.value = props.description || ''
  
  // Фокус на поле названия
  nextTick(() => {
    titleInput.value?.focus()
    titleInput.value?.select()
  })
}

// Сохранить изменения
const save = () => {
  if (editableTitle.value.trim()) {
    emit('update', {
      title: editableTitle.value.trim(),
      description: editableDescription.value.trim()
    })
    isEditing.value = false
  }
}

// Отменить редактирование
const cancel = () => {
  isEditing.value = false
  editableTitle.value = props.title
  editableDescription.value = props.description || ''
}

// Горячие клавиши
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    save()
  }
  if (e.key === 'Escape') {
    cancel()
  }
}

// Слушаем глобальные горячие клавиши
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>