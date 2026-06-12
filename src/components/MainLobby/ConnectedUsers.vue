<template>
    <div
        v-for="(peer, userId) in connectedUsers"
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
import Avatar from "@/shared/components/Avatar.vue";
import { getPeerColor } from "@/utils/peerColor";
import { ref } from "vue";

const connectedUsers = ref<
    Record<string, { avatarUrl: string; nickname: string }>
>({});

interface Props {
    avatarUrl: string;
}

const props = defineProps<Props>();
</script>
