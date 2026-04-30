import { ref } from "vue";
import { useAuthStore } from "@/entities/auth/auth.store";

export function useAuthInit() {
  const authStore = useAuthStore();
  const isInitialized = ref(false);

  const initialize = async () => {
    if (isInitialized.value) return;
    authStore.initAuthListener();
    await authStore.loadSession();
    isInitialized.value = true;
  };

  return { initialize, isInitialized };
}
