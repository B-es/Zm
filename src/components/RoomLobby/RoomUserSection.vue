<template>
    <div class="my-4 flex items-center gap-3">
        <div class="flex-1 h-px bg-gray-300"></div>
    </div>
    <Placeholder :loading="isLeaving">
        <div class="mb-3">
            <AvatarBlock
                :avatar-url="current?.avatarUrl || defaultAvatarUrl"
                :title="current?.nickname || ''"
                description="На выходе"
            ></AvatarBlock>
        </div>

        <Button @click="handleLogout">Выйти</Button>
    </Placeholder>
</template>

<script setup lang="ts">
import AvatarBlock from "@/shared/components/AvatarBlock.vue";
import Placeholder from "@/shared/components/Placeholder.vue";
import { useUserStore } from "@/entities/user/user.store";
import { useLeave } from "@/shared/composables/useLeave";
import { defaultAvatarUrl } from "@/utils/defaultUrl";
const { current } = useUserStore();
const { handleLogout, isLeaving } = useLeave();
</script>
