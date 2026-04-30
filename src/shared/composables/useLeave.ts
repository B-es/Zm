import { useRouter } from "vue-router";
import { useConnectionStore } from "@/entities/connection/connection.store";
import { useRoomStore } from "@/entities/room/room.store";
import { useCursorStore } from "@/entities/cursor/cursor.store";
import { useAuthStore } from "@/entities/auth/auth.store";
import { ref } from "vue";

export function useLeave() {
  const router = useRouter();
  const connectionStore = useConnectionStore();
  const roomStore = useRoomStore();
  const cursorStore = useCursorStore();
  const authStore = useAuthStore();

  const isLeaving = ref(false);

  function handleLeaveRoom() {
    isLeaving.value = true;
    connectionStore.disconnectFromRoom();
    roomStore.clearRoom();
    isLeaving.value = false;
    router.push("/");
  }

  async function handleLogout() {
    isLeaving.value = true;
    connectionStore.disconnectFromRoom();
    roomStore.clearRoom();
    cursorStore.leaveRoom();
    await authStore.signOut();
    isLeaving.value = false;
    router.push("/auth");
  }

  return {
    handleLeaveRoom,
    handleLogout,
    isLeaving,
  };
}
