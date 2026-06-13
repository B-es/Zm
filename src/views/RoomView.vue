<template>
    <div class="min-h-screen bg-gray-50 p-8 flex justify-center items-center">
        <tabs
            wrapper-class="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col "
            nav-class="flex border-b border-gray-200"
            nav-item-class="flex-1"
            nav-item-active-class="bg-brand-default"
            nav-item-inactive-class="hover:bg-gray-50"
            nav-item-link-class="block text-center py-4 px-6 transition-colors duration-200"
            nav-item-link-active-class="text-white font-semibold border-b-2 border-red-600"
            nav-item-link-inactive-class="text-gray-600"
            panels-wrapper-class="p-6 flex-1 flex flex-col min-w-[500px] min-h-[480px] flex-1"
        >
            <tab name="Войти">
                <div class="flex-1">
                    <LogIn />
                </div>
                <RoomUserSection />
            </tab>
            <tab name="Мои комнаты">
                <div class="flex-1">
                    <MyRooms />
                </div>
                <RoomUserSection />
            </tab>
            <tab name="Создать">
                <div class="flex-1">
                    <CreateRoom />
                </div>
                <RoomUserSection />
            </tab>
        </tabs>
    </div>
</template>

<script setup lang="ts">
import LogIn from "@/components/RoomLobby/LogIn.vue";
import CreateRoom from "@/components/RoomLobby/CreateRoom.vue";
import MyRooms from "@/components/RoomLobby/MyRooms.vue";
import RoomUserSection from "@/components/RoomLobby/RoomUserSection.vue";
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/entities/user/user.store";
import { useRoomStore } from "@/entities/room/room.store";
import { useLeave } from "@/shared/composables/useLeave";

const userStore = useUserStore();
const roomStore = useRoomStore();
const router = useRouter();
const { handleLogout } = useLeave();

onMounted(() => {
    // Если пользователь авторизован и есть комната - редиректим на main
    if (userStore.current && roomStore.roomId) {
        console.log(
            "[RoomView] User authenticated with room, redirecting to main",
        );
        router.replace({ name: "main" });
    }
});
</script>
