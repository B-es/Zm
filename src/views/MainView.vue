<template>
    <div class="main-view cursor-none">
        <div class="flex items-center justify-between p-4 border rounded-lg">
            <!-- Контент слева -->
            <div class="flex gap-3 flex-col">
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

        <!-- Индикатор переподключения -->
        <div
            v-if="connectionStore.isReconnecting"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
            <div class="bg-white rounded-lg p-6 text-center">
                <div
                    class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-default mx-auto mb-4"
                ></div>
                <p class="text-lg font-semibold">
                    Переподключение к комнате...
                </p>
            </div>
        </div>

        <!-- Индикатор потери соединения -->
        <div
            v-if="
                connectionStore.connectionStatus === 'disconnected' &&
                roomStore.roomId &&
                !connectionStore.isReconnecting
            "
            class="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
        >
            <p>⚠️ Нет соединения</p>
        </div>
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
import { useConnectionStore } from "@/entities/connection/connection.store";

const authStore = useAuthStore();
const roomStore = useRoomStore();
const cardStore = useCardStore();
const cursorStore = useCursorStore();
const connectionStore = useConnectionStore();
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

// ===== Online/Offline handlers =====
function handleOnline() {
    console.log("[MainView] Connection restored");
    connectionStore.connectionStatus = "connected";
    // Переподключаемся к комнате если нужно
    if (roomStore.roomId && authStore.currentUser) {
        cardStore.subscribeToRealtime(roomStore.roomId);
        cursorStore.joinRoom(
            roomStore.roomId,
            authStore.currentUser.id,
            authStore.currentUser.nickname,
            authStore.currentUser.avatarUrl || "",
        );
    }
}

function handleOffline() {
    console.log("[MainView] Connection lost");
    connectionStore.connectionStatus = "disconnected";
}

onMounted(async () => {
    // Ждём пока загрузится сессия если ещё не загружена
    if (!authStore.currentUser) {
        console.log("[MainView] User not loaded yet, loading session...");
        // Пробуем загрузить сессию
        await authStore.loadSession();
    }

    const user = authStore.currentUser;
    if (!user) {
        console.log(
            "[MainView] User not authenticated after session load, redirecting",
        );
        router.replace("/");
        return;
    }

    if (!roomStore.roomId) {
        console.log("[MainView] No room in store, trying to reconnect...");

        // Пробуем переподключиться к последней комнате
        const success = await connectionStore.reconnectToRoom();

        if (!success) {
            console.log(
                "[MainView] Failed to reconnect, redirecting to connect",
            );
            router.replace("/");
            return;
        }

        console.log("[MainView] Successfully reconnected to room");
    } else {
        // Команда есть, сохраняем состояние для будущего переподключения
        connectionStore.saveConnectionState();
        connectionStore.markAsConnected();

        // Переподписываемся на realtime и загружаем карточки
        cardStore.subscribeToRealtime(roomStore.roomId);
        cardStore.loadCards(roomStore.roomId).catch(() => {});

        // Подключаемся к курсорам
        cursorStore.joinRoom(
            roomStore.roomId,
            user.id,
            user.nickname,
            user.avatarUrl || "",
        );

        console.log("[MainView] Connected to room:", roomStore.roomId);
    }

    window.addEventListener("mousemove", handleMouseMove);

    // Слушатели для обработки потери/восстановления интернета
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
});

onUnmounted(() => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    cursorStore.leaveRoom();
    cardStore.unsubscribeFromRealtime();
});

function handleLeaveRoom() {
    connectionStore.disconnectFromRoom();
    roomStore.clearRoom();
    router.push("/");
}

async function handleLogout() {
    connectionStore.disconnectFromRoom();
    roomStore.clearRoom();
    cursorStore.leaveRoom();
    await authStore.signOut();
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
