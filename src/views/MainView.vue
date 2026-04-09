<template>
    <div class="flex items-center justify-between p-4 border rounded-lg">
        <!-- Контент слева -->
        <div class="flex gap-3">
            <Button @click="handleLeaveRoom">Выйти из комнаты</Button>
            <Button @click="handleLogout">Выйти из аккаунта</Button>
        </div>

        <div class="flex items-center gap-8">
            <ConnectedUser :avatar-url="url" title="Title1"></ConnectedUser>
            <!-- Аватар справа сверху -->
            <AvatarBlock
                :avatar-url="authStore.currentUser?.avatarUrl || url"
                :title="authStore.currentUser?.nickname || ''"
                :description="roomStore.roomTitle || ''"
            ></AvatarBlock>
        </div>
    </div>
    <div class="flex justify-evenly">
        <CardSection title="Посмотрим"></CardSection>
        <CardSection title="Сходим"></CardSection>
        <CardSection title="Сделаем"></CardSection>
    </div>
</template>

<script setup lang="ts">
import AvatarBlock from "@/components/AvatarBlock.vue";
import Button from "@/components/Button.vue";
import CardSection from "@/components/CardSection.vue";
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/entities/user/user.store";
import ConnectedUser from "@/components/ConnectedUser.vue";

import { useCardStore } from "@/entities/card/card.store";
import { useRoomStore } from "@/entities/room/room.store";
import { useAuthStore } from "@/entities/auth/auth.store";

const authStore = useAuthStore();
const roomStore = useRoomStore();
const router = useRouter();

const url = ref(
    "https://sun9-55.userapi.com/s/v1/ig2/qnw-kgD0Mg7UB0yF4UC055_Snp4BaW9UqxyxED1QyovREDY-uTa_WSxa2NB0p4wnS4eX5iwgfV_lezNcnOg_h0xu.jpg?quality=95&as=32x47,48x71,72x107,108x160,160x237,240x355,360x533,480x710,540x799&from=bu&u=Lxg3jai_vtfNfDROM7ZUU23e4_nXaq3dVpBb8AubRpU&cs=540x0",
);

const store = useCardStore();

function handleLeaveRoom() {
    roomStore.clearRoom();
    router.push("/");
}

async function handleLogout() {
    await authStore.signOut();
    router.push("/");
}
</script>

<style scoped></style>
