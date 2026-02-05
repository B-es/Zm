<template>
  <div class="flex items-center gap-3 p-4 border rounded-lg">
    <Avatar :avatar-url="avatarUrl"></Avatar>
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
import Avatar from './Avatar.vue';

interface Props {
  avatarUrl: string
  title: string
  description: string
}

defineProps<Props>()
</script>
