<template>
     <img 
      :src="avatarUrl" 
      alt="Аватар"
      class="w-12 h-12 rounded-lg border-2"
      :class="[{'border-2': borderColor}, borderColor]"
    />
</template>

<script setup lang="ts">
interface Props {
  avatarUrl: string
  borderColor?: string
}

defineProps<Props>()
</script>

<style scoped>

</style>