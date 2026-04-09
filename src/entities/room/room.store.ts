import { defineStore } from "pinia";
import type { Room } from "./room.types";

interface RoomState {
  room: Room | null;
}

export const useRoomStore = defineStore("room", {
  state: (): RoomState => ({
    room: null,
  }),

  actions: {
    setRoom(roomName: string, roomPassword: string) {
      this.room = {
        id: crypto.randomUUID(),
        title: roomName,
        password: roomPassword,
        createdBy: "",
        createdAt: new Date().toISOString(),
      };
    },

    clearRoom() {
      this.room = null;
    },
  },

  getters: {
    // Геттеры для удобства (как вычисляемые поля)
    isRoomSet: (state) => state.room !== null,
    roomId: (state) => state.room?.id ?? "",
    roomTitle: (state) => state.room?.title ?? "",
  },
});
