import { defineStore } from "pinia";
import { ref } from "vue";

export const useToastStore = defineStore("toast", () => {
  const message = ref<string | null>(null);
  const type = ref<"error" | "success" | "info">("error");
  let timeout: ReturnType<typeof setTimeout> | null = null;

  function show(msg: string, t: typeof type.value = "error", duration = 3000) {
    message.value = msg;
    type.value = t;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      message.value = null;
    }, duration);
  }

  function hide() {
    message.value = null;
    if (timeout) clearTimeout(timeout);
  }

  return { message, type, show, hide };
});
