<template>
    <!-- Чужие курсоры поверх страницы -->
    <div
        v-for="(peer, userId) in cursorStore.peers"
        :key="userId"
        class="peer-cursor"
        :style="{ left: `${peer.x}px`, top: `${peer.y}px` }"
    >
        <svg
            width="20"
            height="24"
            viewBox="0 0 20 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M1 1L8.5 22.5L11 14.5L19 12L1 1Z"
                :fill="getPeerColor(userId)"
                stroke="white"
                stroke-width="1.5"
            />
        </svg>
        <span class="peer-label" :style="{ backgroundColor: getPeerColor(userId) }">
            {{ peer.nickname }}
        </span>
    </div>
</template>

<script setup lang="ts">
import { useCursorStore } from "@/entities/cursor/cursor.store";
import { getPeerColor } from "@/utils/peerColor";

const cursorStore = useCursorStore();
</script>

<style scoped>
.peer-cursor {
    position: fixed;
    pointer-events: none;
    z-index: 9999;
}

.peer-label {
    position: absolute;
    left: 16px;
    top: 0;
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    white-space: nowrap;
    pointer-events: none;
}
</style>
