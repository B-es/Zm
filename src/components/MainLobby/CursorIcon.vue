<template>
    <svg
        :width="size"
        :height="size * 1.2"
        :viewBox="`0 0 ${size} ${size * 1.2}`"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M1 1L8.5 22.5L11 14.5L19 12L1 1Z"
            :fill="color"
            stroke="white"
            stroke-width="1.5"
        />
    </svg>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        color?: string;
        size?: number;
    }>(),
    {
        color: "#FF0000",
        size: 20,
    },
);
</script>
