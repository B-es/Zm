<template>
    <div v-if="loading" class="flex flex-row justify-center">
        <div class="loader"></div>
    </div>
    <div v-else>
        <slot></slot>
    </div>
</template>
<script setup lang="ts">
interface Props {
    loading: boolean;
}
const props = defineProps<Props>();
</script>
<style>
.loader {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top-color: red;
    border-radius: 50%;
    animation: spin 0.2s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
