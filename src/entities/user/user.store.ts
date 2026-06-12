import { defineStore } from "pinia";
import type { User } from "./user.types";
import { ref } from "vue";

export const useUserStore = defineStore("user", () => {
  const current = ref<User | null>(null);

  async function setCurrent(nickname: string, id: string) {
    current.value = { id, nickname } as User;
  }

  async function clearCurrent() {
    current.value = null;
  }

  async function updateAvatar(avatarUrl: string) {
    if (!current.value) return { success: false };
    current.value.avatarUrl = avatarUrl;
    return { success: true };
  }

  return {
    current,
    setCurrent,
    updateAvatar,
    clearCurrent,
  };
});
