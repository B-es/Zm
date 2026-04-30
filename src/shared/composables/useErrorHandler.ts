import { ref } from "vue";

const toastMessage = ref<string | null>(null);
const toastType = ref<"error" | "success" | "info">("error");
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

export function useErrorHandler() {
  const showToast = (
    message: string,
    type: "error" | "success" | "info" = "error",
    duration = 3000,
  ) => {
    toastType.value = type;
    toastMessage.value = message;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastMessage.value = null;
    }, duration);
  };

  const hideToast = () => {
    toastMessage.value = null;
    if (toastTimeout) clearTimeout(toastTimeout);
  };

  const withError = async <T>(
    fn: () => Promise<T>,
    context: string,
  ): Promise<T | null> => {
    try {
      return await fn();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Неизвестная ошибка";
      showToast(`Ошибка ${context}: ${message}`, "error");
      console.error(`[useErrorHandler] ${context}:`, e);
      return null;
    }
  };

  return { toastMessage, toastType, showToast, hideToast, withError };
}
