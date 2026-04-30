import { onMounted, ref } from "vue";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const value = ref<T>(initialValue);

  const load = () => {
    try {
      const item = localStorage.getItem(key);
      if (item) value.value = JSON.parse(item);
    } catch {
      // ignore parse error
    }
  };

  const save = (newValue: T) => {
    value.value = newValue;
    try {
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch {
      // ignore storage error
    }
  };

  const remove = () => {
    value.value = initialValue;
    localStorage.removeItem(key);
  };

  onMounted(load);

  return { value, load, save, remove };
}
