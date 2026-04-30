import { onUnmounted } from "vue";

export function useTimerManager() {
  const timers = new Set<
    ReturnType<typeof setTmt> | ReturnType<typeof setIntrvl>
  >();

  const setTmt = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };

  const setIntrvl = (fn: () => void, ms: number) => {
    const id = setInterval(fn, ms);
    timers.add(id);
    return id;
  };

  const clearAll = () => {
    timers.forEach((id) => {
      clearTimeout(id);
      clearInterval(id);
    });
    timers.clear();
  };

  onUnmounted(clearAll);

  return { setTmt, setIntrvl, clearAll };
}
