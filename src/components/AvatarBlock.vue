<template>
  <div class="flex items-center gap-3 p-4 border rounded-lg">
    <img 
      :src="avatarUrl" 
      alt="Аватар"
      class="w-12 h-12 rounded-full"
    />
    
    <div>
      <h3 class="font-medium text-gray-900">
        {{ title }}
      </h3>
      <p class="text-sm text-gray-600">
        {{ description }}
      </p>
    </div>
  </div>
</template>


<script setup lang="ts">
interface Props {
  avatarUrl: string
  title: string
  description: string
}

defineProps<Props>()
</script>
