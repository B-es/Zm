<template>
    <div
        v-if="isLocked"
        class="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full shadow"
    >
        🔒 {{ editorName }}
    </div>
</template>

<script setup lang="ts">
defineProps<{
    isLocked: boolean;
    editorName: string;
}>();
</script>
