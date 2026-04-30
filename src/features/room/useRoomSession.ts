import { useRouter } from "vue-router";
import { useAuthStore } from "@/entities/auth/auth.store";
import { useRoomStore } from "@/entities/room/room.store";
import { useCardStore } from "@/entities/card/card.store";
import { useCursorStore } from "@/entities/cursor/cursor.store";
import { useConnectionStore } from "@/entities/connection/connection.store";
import { useErrorHandler } from "@/shared/composables/useErrorHandler";

export function useRoomSession() {
  const authStore = useAuthStore();
  const roomStore = useRoomStore();
  const cardStore = useCardStore();
  const cursorStore = useCursorStore();
  const connectionStore = useConnectionStore();
  const { withError } = useErrorHandler();
  const router = useRouter();

  const joinRoom = async () => {
    const user = authStore.currentUser;
    if (!user || !roomStore.roomId) return false;

    connectionStore.saveConnectionState();
    connectionStore.markAsConnected();

    cardStore.subscribeToRealtime(roomStore.roomId);
    await withError(
      () => cardStore.loadCards(roomStore.roomId),
      "загрузки карточек",
    );

    cursorStore.joinRoom(
      roomStore.roomId,
      user.id,
      user.nickname,
      user.avatarUrl || "",
    );

    return true;
  };

  const leaveRoom = () => {
    cursorStore.leaveRoom();
    cardStore.unsubscribeFromRealtime();
    connectionStore.clearConnectionState();
    roomStore.clearRoom();
  };

  const reconnect = async () => {
    const lastState = connectionStore.getLastConnectionState();
    if (!lastState || !roomStore.roomId || !authStore.currentUser) {
      connectionStore.clearConnectionState();
      return false;
    }

    connectionStore.reconnectToRoom();

    try {
      cardStore.subscribeToRealtime(roomStore.roomId);
      await cardStore.loadCards(roomStore.roomId);

      cursorStore.joinRoom(
        roomStore.roomId,
        authStore.currentUser.id,
        authStore.currentUser.nickname,
        authStore.currentUser.avatarUrl || "",
      );

      connectionStore.markAsConnected();
      return true;
    } catch {
      connectionStore.disconnectFromRoom();
      return false;
    }
  };

  const handleOnline = () => {
    connectionStore.markAsConnected();
    if (roomStore.roomId && authStore.currentUser) {
      cardStore.subscribeToRealtime(roomStore.roomId);
      cursorStore.joinRoom(
        roomStore.roomId,
        authStore.currentUser.id,
        authStore.currentUser.nickname,
        authStore.currentUser.avatarUrl || "",
      );
    }
  };

  const handleOffline = () => {
    connectionStore.disconnectFromRoom();
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    router.push("/");
  };

  const handleLogout = async () => {
    leaveRoom();
    await authStore.signOut();
    router.push("/");
  };

  return {
    joinRoom,
    leaveRoom,
    reconnect,
    handleOnline,
    handleOffline,
    handleLeaveRoom,
    handleLogout,
  };
}
