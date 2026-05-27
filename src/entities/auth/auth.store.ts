import { defineStore } from "pinia";
import type { User } from "../user/user.types";
import { computed, ref } from "vue";
import { di } from "../../di";
import { useErrorHandler } from "@/shared/composables/useErrorHandler";

const authRepository = di.authRepository;

export const useAuthStore = defineStore("auth", () => {
  const { withError, showToast } = useErrorHandler();
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function signUp(nickname: string, password: string) {
    error.value = null;
    loading.value = true;
    await withError(() => authRepository.signUp(nickname, password), "signUp");
    loading.value = false;
  }

  async function signIn(nickname: string, password: string) {
    error.value = null;
    loading.value = true;
    await withError(() => authRepository.signIn(nickname, password), "signIn");
    loading.value = false;
  }

  async function signOut() {
    error.value = null;
    loading.value = true;
    await withError(() => authRepository.signOut(), "signOut");
    loading.value = false;
  }

  async function loadSession() {
    error.value = null;
    loading.value = true;
    await withError(() => authRepository.loadSession(), "loadSession");
    loading.value = false;
  }

  function initAuthListener() {
    authRepository.initAuthListener();
  }

  async function updateAvatar(avatarUrl: string) {
    authRepository.updateAvatar(avatarUrl);
    return { success: true };
  }

  return {
    isAuth: computed(() => user !== null),
    currentUser: computed(() => user),
    isLoading: computed(() => loading),
    authError: computed(() => error),

    signUp,
    signIn,
    signOut,
    loadSession,
    initAuthListener,
    updateAvatar,
  };
});
