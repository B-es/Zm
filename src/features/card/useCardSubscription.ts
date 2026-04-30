import { useCardStore } from "@/entities/card/card.store";
import { useRoomStore } from "@/entities/room/room.store";
import { useAuthStore } from "@/entities/auth/auth.store";
import { onMounted, onUnmounted } from "vue";

export function useCardSubscription() {
  const cardStore = useCardStore();
  const roomStore = useRoomStore();
  const authStore = useAuthStore();

  const subscribe = () => {
    if (!roomStore.roomId) return;

    cardStore.subscribeToRealtime(roomStore.roomId);
    cardStore.loadCards(roomStore.roomId);

    const user = authStore.currentUser;
    if (user) {
      cardStore.joinEditingChannel(
        roomStore.roomId,
        user.id,
        user.nickname,
      );
    }
  };

  const unsubscribe = () => {
    cardStore.unsubscribeFromRealtime();
    cardStore.leaveEditingChannel();
  };

  onMounted(subscribe);
  onUnmounted(unsubscribe);

  return { subscribe, unsubscribe };
}
