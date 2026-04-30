import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { useRoomStore } from "@/entities/room/room.store";
import { useAuthStore } from "@/entities/auth/auth.store";
import { useCardStore } from "@/entities/card/card.store";
import { useCursorStore } from "@/entities/cursor/cursor.store";
import router from "@/router";

const CONNECTION_STATUS_KEY = "zm_connection_status";

interface LastConnectionState {
  roomId: string;
  userId: string;
  timestamp: number;
}

const STATE_STORAGE_KEY = "zm_last_connection";

/**
 * Store для управления переподключением к комнате при перезагрузке/потере соединения
 */
export const useConnectionStore = defineStore("connection", () => {
  const isReconnecting = ref(false);
  const connectionStatus = ref<"connected" | "disconnected" | "reconnecting">(
    "disconnected",
  );

  const roomStore = useRoomStore();
  const authStore = useAuthStore();
  const cardStore = useCardStore();
  const cursorStore = useCursorStore();

  /**
   * Сохраняем состояние подключения для восстановления после перезагрузки
   */
  function saveConnectionState() {
    if (roomStore.roomId && authStore.currentUser) {
      const state: LastConnectionState = {
        roomId: roomStore.roomId,
        userId: authStore.currentUser.id,
        timestamp: Date.now(),
      };
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
    }
  }

  /**
   * Получаем последнее сохранённое состояние подключения
   */
  function getLastConnectionState(): LastConnectionState | null {
    const saved = localStorage.getItem(STATE_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as LastConnectionState;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Очищаем состояние подключения
   */
  function clearConnectionState() {
    localStorage.removeItem(STATE_STORAGE_KEY);
  }

  /**
   * Переподключение к комнате после перезагрузки
   */
  async function reconnectToRoom(): Promise<boolean> {
    // Проверяем, есть ли сохранённая комната и пользователь
    const lastState = getLastConnectionState();

    if (!lastState) {
      return false;
    }

    // Проверяем, что комната всё ещё в localStorage
    if (!roomStore.roomId) {
      clearConnectionState();
      return false;
    }

    // Проверяем, что пользователь авторизован
    if (!authStore.currentUser) {
      return false;
    }

    isReconnecting.value = true;
    connectionStatus.value = "reconnecting";

    try {
      // Подписываемся на realtime и загружаем карточки
      cardStore.subscribeToRealtime(roomStore.roomId);
      await cardStore.loadCards(roomStore.roomId);

      // Подключаемся к курсорам
      cursorStore.joinRoom(
        roomStore.roomId,
        authStore.currentUser.id,
        authStore.currentUser.nickname,
        authStore.currentUser.avatarUrl || "",
      );

      connectionStatus.value = "connected";
      isReconnecting.value = false;

      return true;
    } catch (error) {
      console.error("[Connection] Failed to reconnect:", error);
      connectionStatus.value = "disconnected";
      isReconnecting.value = false;
      return false;
    }
  }

  /**
   * Успешное подключение к комнате (не переподключение)
   */
  function markAsConnected() {
    connectionStatus.value = "connected";
  }

  /**
   * Отключение от комнаты (при выходе)
   */
  function disconnectFromRoom() {
    cursorStore.leaveRoom();
    cardStore.unsubscribeFromRealtime();
    clearConnectionState();
    connectionStatus.value = "disconnected";
  }

  /**
   * Проверка доступности интернета
   */
  function isOnline(): boolean {
    return navigator.onLine;
  }

  return {
    isReconnecting,
    connectionStatus,
    saveConnectionState,
    clearConnectionState,
    reconnectToRoom,
    disconnectFromRoom,
    isOnline,
    markAsConnected,
  };
});
