<template>
    <div class="flex flex-col gap-4">
        <!-- Owned Rooms Section -->
        <div>
            <h3
                class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2"
            >
                Мои комнаты
            </h3>
            <div v-if="loadingOwned" class="text-gray-500 text-center py-4">
                Загрузка...
            </div>
            <div
                v-else-if="ownedRooms.length === 0"
                class="text-gray-500 text-center py-4"
            >
                У тебя пока нет комнат
            </div>
            <div v-else class="flex flex-col gap-3">
                <button
                    v-for="room in ownedRooms"
                    :key="room.id"
                    @click="selectRoom(room)"
                    class="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition"
                >
                    <p class="font-medium text-gray-800">{{ room.title }}</p>
                    <p
                        v-if="formatDate(room.createdAt)"
                        class="text-xs text-gray-400"
                    >
                        Создана: {{ formatDate(room.createdAt) }}
                    </p>
                </button>
            </div>
        </div>

        <!-- Visited Rooms Section -->
        <div
            v-if="visitedRooms.length > 0"
            class="border-t border-gray-200 pt-4"
        >
            <h3
                class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2"
            >
                История посещений
            </h3>
            <div v-if="loadingVisited" class="text-gray-500 text-center py-4">
                Загрузка...
            </div>
            <div v-else class="flex flex-col gap-3">
                <button
                    v-for="room in visitedRooms"
                    :key="room.id"
                    @click="selectRoom(room)"
                    class="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition"
                >
                    <p class="font-medium text-gray-800">{{ room.title }}</p>
                    <p class="text-xs text-gray-400">
                        Владелец:
                        {{
                            room.createdBy === userId
                                ? "Вы"
                                : "Другой пользователь"
                        }}
                    </p>
                </button>
            </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 text-center">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useRoomStore } from "@/entities/room/room.store";
import { useRoomRepository } from "@/entities/room/room.repository";
import { useUserStore } from "@/entities/user/user.store";
import type { Room } from "@/entities/room/room.types";

const roomStore = useRoomStore();
const roomRepo = useRoomRepository();
const userStore = useUserStore();
const router = useRouter();

const ownedRooms = ref<Room[]>([]);
const visitedRooms = ref<Room[]>([]);
const loadingOwned = ref(true);
const loadingVisited = ref(true);
const error = ref("");

const userId = computed(() => userStore.current?.id || "");
console.log(userStore.current);

onMounted(async () => {
    if (!userId.value) {
        error.value = "Необходимо войти в аккаунт";
        loadingOwned.value = false;
        loadingVisited.value = false;
        return;
    }

    // Load owned rooms
    ownedRooms.value = await roomRepo.getRoomsByUser(userId.value);
    loadingOwned.value = false;

    // Load visited rooms (excluding owned rooms)
    const allVisited = await roomRepo.getVisitedRooms(userId.value);
    const ownedIds = new Set(ownedRooms.value.map((r) => r.id));
    visitedRooms.value = allVisited.filter((r) => !ownedIds.has(r.id));
    loadingVisited.value = false;
});

function selectRoom(room: Room) {
    roomStore.setRoom(room);
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
