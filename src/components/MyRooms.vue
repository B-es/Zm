<template>
    <div class="flex flex-col gap-3">
        <p v-if="loading" class="text-gray-500 text-center">Загрузка...</p>
        <p v-else-if="rooms.length === 0" class="text-gray-500 text-center">
            У тебя пока нет комнат
        </p>

        <button
            v-for="room in rooms"
            :key="room.id"
            @click="selectRoom(room)"
            class="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition"
        >
            <p class="font-medium text-gray-800">{{ room.title }}</p>
            <p v-if="formatDate(room.createdAt)" class="text-xs text-gray-400">
                {{ formatDate(room.createdAt) }}
            </p>
        </button>

        <p v-if="error" class="text-sm text-red-500 text-center">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useRoomStore } from "@/entities/room/room.store";
import { useRoomRepository } from "@/entities/room/room.repository";
import { useAuthStore } from "@/entities/auth/auth.store";
import type { Room } from "@/entities/room/room.types";

const roomStore = useRoomStore();
const roomRepo = useRoomRepository();
const authStore = useAuthStore();
const router = useRouter();

const rooms = ref<Room[]>([]);
const loading = ref(true);
const error = ref("");

onMounted(async () => {
    const userId = authStore.currentUser?.id;
    if (!userId) {
        error.value = "Необходимо войти в аккаунт";
        loading.value = false;
        return;
    }

    rooms.value = await roomRepo.getRoomsByUser(userId);
    loading.value = false;
});

function selectRoom(room: Room) {
    roomStore.setRoom(room.title, room.password);
    router.push("/main");
}

function formatDate(iso: string): string {
    if (!iso) return "";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}
</script>
