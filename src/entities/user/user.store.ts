import { defineStore } from "pinia";
import type { User } from "./user.types";
import { ref } from "vue";
import { generateHardwareId } from "@/utils/generateHardId";

export const useUserStore = defineStore("user", () => {
  const current = ref<User | null>(null);

  async function setCurrent(nickname: string, password: string) {
    const id = await generateHardwareId();
    current.value = { id, nickname, password } as User;
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
  };
});
