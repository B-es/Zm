<template>
    <button
        @click="$emit('select', room)"
        class="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition"
    >
        <p class="font-medium text-gray-800">{{ room.title }}</p>
        <p class="text-xs text-gray-400">{{ subtitle }}</p>
    </button>
</template>

<script setup lang="ts">
import type { Room } from "@/entities/room/room.types";

defineProps<{
    room: Room;
    subtitle: string;
}>();

defineEmits<{
    select: [room: Room];
}>();
</script>
