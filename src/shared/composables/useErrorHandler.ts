import { useToastStore } from "@/entities/toast.store";

export function useErrorHandler() {
  const { show: showToast, hide: hideToast } = useToastStore();
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

  return { showToast, hideToast, withError };
}
