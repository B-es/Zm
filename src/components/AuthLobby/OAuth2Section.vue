<template>
    <div class="my-4 flex items-center gap-3">
        <div class="flex-1 h-px bg-gray-300"></div>
        <span class="text-sm text-gray-400">или</span>
        <div class="flex-1 h-px bg-gray-300"></div>
    </div>
    <OAuth2Form class="m-auto"></OAuth2Form>
</template>
<script setup lang="ts">
import OAuth2Form from "./OAuth2Form.vue";
</script>
<style scoped></style>
