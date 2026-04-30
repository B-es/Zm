<template>
    <div
        v-for="(peer, userId) in cursorStore.peers"
        :key="userId"
        class="flex items-center gap-2"
    >
        <Avatar
            :avatar-url="peer.avatarUrl || props.avatarUrl"
            :style="{ borderColor: getPeerColor(userId) }"
        />
        <span class="text-sm font-medium text-gray-700">
            {{ peer.nickname }}
        </span>
    </div>
</template>

<script setup lang="ts">
import Avatar from "./Avatar.vue";
import { useCursorStore } from "@/entities/cursor/cursor.store";
import { getPeerColor } from "@/utils/peerColor";

const cursorStore = useCursorStore();

interface Props {
    avatarUrl: string;
}

const props = defineProps<Props>();
</script>
