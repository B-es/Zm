import { defineStore } from "pinia";
import type { Room } from "./room.types";

const STORAGE_KEY = "zm_room";

interface RoomState {
  room: Room | null;
}

export const useRoomStore = defineStore("room", {
  state: (): RoomState => {
    // Восстановление из localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { room: JSON.parse(saved) as Room };
      } catch {
        return { room: null };
      }
    }
    return { room: null };
  },

  actions: {
    setRoom(room: Room) {
      this.room = room;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(room));
    },

    clearRoom() {
      this.room = null;
      localStorage.removeItem(STORAGE_KEY);
    },
  },

  getters: {
    isRoomSet: (state) => state.room !== null,
    roomId: (state) => state.room?.id ?? "",
    roomTitle: (state) => state.room?.title ?? "",
  },
});
