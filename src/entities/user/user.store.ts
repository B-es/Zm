import { defineStore } from "pinia";
import type { User } from "./user.types";

interface UserState {
  currentUser: User | null;
  peerUser: User | null;
}

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    currentUser: null,
    peerUser: null,
  }),

  actions: {
    setUser(nickname: string, target: "current" | "peer") {
      const user = { id: nickname, nickname };

      if (target === "current") {
        this.currentUser = user;
      } else {
        this.peerUser = user;
      }
    },

    logIn(nickname: string) {
      this.setUser(nickname, "current");
    },

    setPeer(nickname: string) {
      this.setUser(nickname, "peer");
    },

    logout() {
      this.currentUser = null;
    },

    clearPeer() {
      this.peerUser = null;
    },
  },

  getters: {
    // Геттеры кэшируются и реактивны
    isLoggedIn: (state) => state.currentUser !== null,
    hasPeer: (state) => state.peerUser !== null,
    currentNickname: (state) => state.currentUser?.nickname ?? null,
    peerNickname: (state) => state.peerUser?.nickname ?? null,

    // Комбинированный геттер
    allUsers: (state) => {
      const users = [];
      if (state.currentUser) users.push(state.currentUser);
      if (state.peerUser) users.push(state.peerUser);
      return users;
    },
  },
});
