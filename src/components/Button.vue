<template>
  <button
    :class="['px-6 py-3 bg-gradient-to-r from-red-500 to-teal-300 text-white rounded-lg hover:shadow-lg transition', 
             { 'opacity-50 cursor-not-allowed': disabled }]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot>Кнопка</slot>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()

defineEmits<{
  click: []
}>()
</script>