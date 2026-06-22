<template>
    <!-- Собственный курсор пользователя -->
    <div
        v-if="visible"
        class="my-cursor"
        :style="{ left: `${x}px`, top: `${y}px` }"
    >
        <svg
            width="20"
            height="24"
            viewBox="0 0 20 24"
            fill="FF0000"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M1 1L8.5 22.5L11 14.5L19 12L1 1Z"
                :fill="cursorColor"
                stroke="white"
                stroke-width="1.5"
            />
        </svg>
    </div>
</template>

<script setup lang="ts">
import { getPeerColor } from "@/utils/peerColor";
import { useUserStore } from "@/entities/user/user.store";

interface Props {
    x: number;
    y: number;
    visible?: boolean;
}

withDefaults(defineProps<Props>(), {
    visible: true,
});

const userStore = useUserStore();
const userId = userStore.current?.id || -1;
const cursorColor = getPeerColor(userId);
</script>

<style scoped>
.my-cursor {
    position: fixed;
    pointer-events: none;
    z-index: 9999;
}
</style>
