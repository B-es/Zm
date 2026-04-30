import { ref } from "vue";

export function useFormState() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  return {
    loading,
    error,
    startLoading: () => {
      loading.value = true;
      error.value = null;
    },
    stopLoading: () => {
      loading.value = false;
    },
    setError: (msg: string) => {
      error.value = msg;
      loading.value = false;
    },
  };
}
