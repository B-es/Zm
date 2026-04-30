import { onMounted, onUnmounted } from "vue";

export function useWindowEvent<K extends keyof WindowEventMap>(
  event: K,
  handler: (e: WindowEventMap[K]) => void,
) {
  onMounted(() => window.addEventListener(event, handler as EventListener));
  onUnmounted(() =>
    window.removeEventListener(event, handler as EventListener),
  );
}
