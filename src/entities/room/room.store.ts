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
    setRoom(room: Room) {
      this.room = room;
    },

    clearRoom() {
      this.room = null;
    },
  },

  getters: {
    isRoomSet: (state) => state.room !== null,
    roomId: (state) => state.room?.id ?? "",
    roomTitle: (state) => state.room?.title ?? "",
  },
});
