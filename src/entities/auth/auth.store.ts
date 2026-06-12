import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { di } from "../../di";
import { useErrorHandler } from "@/shared/composables/useErrorHandler";
import router from "@/router";
import { useUserStore } from "../user/user.store";

export const useAuthStore = defineStore("auth", () => {
  const userStore = useUserStore();
  const authRepository = di.authRepository;
  const { withError } = useErrorHandler();
  const loading = ref(false);
  const error = ref<string | null>(null);
  const authState = ref<"authed" | "unauthed">("unauthed");

  async function signUp(nickname: string, password: string) {
    error.value = null;
    loading.value = true;
    await withError(async () => {
      await authRepository.signUp(nickname, password);
      await loadSession();
    }, "signUp");
    loading.value = false;
  }

  async function signIn(nickname: string, password: string) {
    error.value = null;
    loading.value = true;
    await withError(async () => {
      await authRepository.signIn(nickname, password);
      await loadSession();
    }, "signIn");
    loading.value = false;
  }

  async function signOut() {
    error.value = null;
    loading.value = true;
    await withError(async () => {
      await authRepository.signOut();
      authState.value = "unauthed";
    }, "signOut");
    loading.value = false;
  }

  async function loadSession() {
    error.value = null;
    loading.value = true;
    const data = await withError(
      () => authRepository.loadSession(),
      "loadSession",
    );
    console.log("loadSession", authState.value, data);

    if (data && data?.id !== "") {
      userStore.setCurrent(data?.nickname, data?.id);
      authState.value = "authed";
    } else {
      userStore.clearCurrent();
      authState.value = "unauthed";
    }

    loading.value = false;
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
