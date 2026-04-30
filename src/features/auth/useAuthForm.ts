import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/entities/auth/auth.store";
import { useFormState } from "@/shared/composables/useFormState";
import { signInSchema, signUpSchema } from "@/shared/lib/validators";

export function useAuthForm(mode: "login" | "register") {
  const email = ref("");
  const password = ref("");
  const nickname = ref("");
  const { loading, error, startLoading, stopLoading, setError } =
    useFormState();

  const authStore = useAuthStore();
  const router = useRouter();

  const submit = async () => {
    const schema = mode === "login" ? signInSchema : signUpSchema;
    const result = schema.safeParse({
      email: email.value,
      password: password.value,
      ...(mode === "register" && { nickname: nickname.value }),
    });

    if (!result.success) {
      const firstError = result.error.issues[0];
      setError(firstError ? firstError.message : "Ошибка валидации");
      return;
    }

    startLoading();
    try {
      const authResult =
        mode === "login"
          ? await authStore.signIn(email.value, password.value)
          : await authStore.signUp(email.value, password.value, nickname.value);

      if (authResult.success) {
        router.push("/");
      } else {
        setError(authResult.error || "Неизвестная ошибка");
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Неизвестная ошибка";
      setError(message);
    } finally {
      stopLoading();
    }
  };

  return {
    email,
    password,
    nickname,
    loading,
    error,
    submit,
  };
}
