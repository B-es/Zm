<template>
    <Avatar :avatar-url="avatarUrl" border-color="border-red-300"></Avatar>
</template>

<script setup lang="ts">
import Avatar from './Avatar.vue';
interface Props {
  avatarUrl: string
  title: string
}

defineProps<Props>()
</script>

<style scoped>

</style>