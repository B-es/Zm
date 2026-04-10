<template>
    <div class="main-view cursor-none">
        <div class="flex items-center justify-between p-4 border rounded-lg">
            <!-- Контент слева -->
            <div class="flex gap-3">
                <Button @click="handleLeaveRoom">Выйти из комнаты</Button>
                <Button @click="handleLogout">Выйти из аккаунта</Button>
            </div>

            <div class="flex items-center gap-8">
                <ConnectedUsers :avatar-url="url" />
                <!-- Аватар справа сверху -->
                <AvatarBlock
                    :avatar-url="authStore.currentUser?.avatarUrl || url"
                    :title="authStore.currentUser?.nickname || ''"
                    :description="String(roomStore.roomTitle)"
                ></AvatarBlock>
            </div>
        </div>
        <div class="flex justify-evenly">
            <CardSection title="Посмотрим" section="watch"></CardSection>
            <CardSection title="Сходим" section="go"></CardSection>
            <CardSection title="Сделаем" section="do"></CardSection>
        </div>

        <!-- Курсор клиента -->
        <MyCursor :x="cursorPosition.x" :y="cursorPosition.y" />

        <!-- Курсоры других пользователей -->
        <PeerCursors />
    </div>
</template>

<script setup lang="ts">
import AvatarBlock from "@/components/AvatarBlock.vue";
import Button from "@/components/Button.vue";
import CardSection from "@/components/CardSection.vue";
import PeerCursors from "@/components/PeerCursors.vue";
import MyCursor from "@/components/MyCursor.vue";
import { onMounted, onUnmounted, ref, reactive } from "vue";
import { useRouter } from "vue-router";
import ConnectedUsers from "@/components/ConnectedUsers.vue";

import { useCardStore } from "@/entities/card/card.store";
import { useRoomStore } from "@/entities/room/room.store";
import { useAuthStore } from "@/entities/auth/auth.store";
import { useCursorStore } from "@/entities/cursor/cursor.store";

const authStore = useAuthStore();
const roomStore = useRoomStore();
const cardStore = useCardStore();
const cursorStore = useCursorStore();
const router = useRouter();

const url = ref(
    "https://sun9-55.userapi.com/s/v1/ig2/qnw-kgD0Mg7UB0yF4UC055_Snp4BaW9UqxyxED1QyovREDY-uTa_WSxa2NB0p4wnS4eX5iwgfV_lezNcnOg_h0xu.jpg?quality=95&as=32x47,48x71,72x107,108x160,160x237,240x355,360x533,480x710,540x799&from=bu&u=Lxg3jai_vtfNfDROM7ZUU23e4_nXaq3dVpBb8AubRpU&cs=540x0",
);

const cursorPosition = reactive({ x: -100, y: -100 });

// ===== Mouse tracking =====
const handleMouseMove = (e: MouseEvent) => {
    const user = authStore.currentUser;
    if (!user) return;

    cursorPosition.x = e.clientX;
    cursorPosition.y = e.clientY;

    cursorStore.broadcastPosition(
        user.id,
        user.nickname,
        user.avatarUrl || "",
        e.clientX,
        e.clientY,
    );
};

onMounted(() => {
    const user = authStore.currentUser;
    if (!user) return;

    if (!roomStore.roomId) {
        // Комната не восстановилась — редирект на ConnectView
        router.replace("/");
        return;
    }

    // Переподписываемся на realtime и загружаем карточки после перезагрузки
    cardStore.subscribeToRealtime(roomStore.roomId);
    cardStore.loadCards(roomStore.roomId).catch(() => {});

    // Подключаемся к курсорам
    cursorStore.joinRoom(
        roomStore.roomId,
        user.id,
        user.nickname,
        user.avatarUrl || "",
    );

    window.addEventListener("mousemove", handleMouseMove);
});

onUnmounted(() => {
    window.removeEventListener("mousemove", handleMouseMove);
    cursorStore.leaveRoom();
    cardStore.unsubscribeFromRealtime();
});

function handleLeaveRoom() {
    cursorStore.leaveRoom();
    roomStore.clearRoom();
    router.push("/");
}

async function handleLogout() {
    await authStore.signOut();
    cursorStore.leaveRoom();
    router.push("/");
}
</script>

<style scoped>
.main-view {
    min-height: 100vh;
}

.cursor-none,
.cursor-none *,
.cursor-none button,
.cursor-none a,
.cursor-none [role="button"],
.cursor-none input,
.cursor-none select,
.cursor-none textarea {
    cursor: none !important;
}
</style>
