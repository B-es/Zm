import { defineStore } from "pinia";
import { ref } from "vue";
import { useRoomStore } from "@/entities/room/room.store";
import { useCardStore } from "@/entities/card/card.store";
import { useUserStore } from "../user/user.store";

const CONNECTION_STATUS_KEY = "zm_connection_status";

interface LastConnectionState {
  roomId: string;
  userId: number;
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
  const userStore = useUserStore();
  const cardStore = useCardStore();

  /**
   * Сохраняем состояние подключения для восстановления после перезагрузки
   */
  function saveConnectionState() {
    if (roomStore.roomId && userStore.current) {
      const state: LastConnectionState = {
        roomId: roomStore.roomId,
        userId: userStore.current.id,
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
    if (!userStore.current) {
      return false;
    }

    isReconnecting.value = true;
    connectionStatus.value = "reconnecting";

    try {
      // Подписываемся на realtime и загружаем карточки
      await cardStore.loadCards(roomStore.roomId);

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
    getLastConnectionState,
  };
});
