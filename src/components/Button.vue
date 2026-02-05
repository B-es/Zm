<template>
  <button
    :class="['w-full px-12 py-2 bg-brand-default text-white rounded-lg hover:shadow-lg transition', 
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