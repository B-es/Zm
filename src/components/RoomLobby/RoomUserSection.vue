<template>
    <div class="my-4 flex items-center gap-3">
        <div class="flex-1 h-px bg-gray-300"></div>
    </div>
    <Placeholder :loading="isLeaving">
        <div class="mb-3">
            <AvatarBlock
                :avatar-url="
                    authStore.currentUser?.avatarUrl || defaultAvatarUrl
                "
                :title="authStore.currentUser?.nickname || ''"
                description="На выходе"
            ></AvatarBlock>
        </div>

        <Button @click="handleLogout">Выйти</Button>
    </Placeholder>
</template>

<script setup lang="ts">
import AvatarBlock from "../MainLobby/AvatarBlock.vue";
import Placeholder from "@/shared/components/Placeholder.vue";
import { useAuthStore } from "@/entities/auth/auth.store";
import { useLeave } from "@/shared/composables/useLeave";
import { defaultAvatarUrl } from "@/utils/defaultUrl";
const authStore = useAuthStore();

const { handleLogout, isLeaving } = useLeave();
</script>
