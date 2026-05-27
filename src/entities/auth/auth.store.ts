import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { di } from "../../di";
import { useErrorHandler } from "@/shared/composables/useErrorHandler";
import router from "@/router";

const authRepository = di.authRepository;

export const useAuthStore = defineStore("auth", () => {
  const { withError } = useErrorHandler();
  const loading = ref(false);
  const error = ref<string | null>(null);
  const authState = ref<"authed" | "unauthed">("unauthed");

  async function signUp(nickname: string, password: string) {
    error.value = null;
    loading.value = true;
    await withError(() => authRepository.signUp(nickname, password), "signUp");
    loading.value = false;
    authState.value = "authed";
  }

  async function signIn(nickname: string, password: string) {
    error.value = null;
    loading.value = true;
    await withError(() => authRepository.signIn(nickname, password), "signIn");
    loading.value = false;
    authState.value = "authed";
  }

  async function signOut() {
    error.value = null;
    loading.value = true;
    await withError(() => authRepository.signOut(), "signOut");
    loading.value = false;
    authState.value = "unauthed";
  }

  async function loadSession() {
    error.value = null;
    loading.value = true;
    await withError(() => authRepository.loadSession(), "loadSession");
    loading.value = false;
    authState.value = "unauthed";
  }

  function initAuthListener() {
    watch(authState, () => {
      console.log("state", authState.value);
      router.push("/");
    });
  }

  return {
    isAuth: computed(() => authState.value === "authed"),
    isLoading: computed(() => loading.value),
    authError: computed(() => error.value),

    signUp,
    signIn,
    signOut,
    loadSession,
    initAuthListener,
  };
});
