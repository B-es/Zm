import { ref } from "vue";
import { useRouter } from "vue-router";
import { useRoomStore } from "@/entities/room/room.store";
import { useRoomRepository } from "@/entities/room/room.repository";
import { useAuthStore } from "@/entities/auth/auth.store";
import { useFormState } from "@/shared/composables/useFormState";
import { roomSchema } from "@/shared/lib/validators";

export function useRoomForm(mode: "join" | "create") {
  const roomName = ref("");
  const roomPassword = ref("");
  const { loading, error, startLoading, stopLoading, setError } =
    useFormState();

  const roomStore = useRoomStore();
  const roomRepo = useRoomRepository();
  const authStore = useAuthStore();
  const router = useRouter();

  const submit = async () => {
    const result = roomSchema.safeParse({
      name: roomName.value,
      password: roomPassword.value,
    });

    if (!result.success) {
      const firstError = result.error.issues[0];
      setError(firstError ? firstError.message : "Ошибка валидации");
      return;
    }

    startLoading();
    try {
      const roomResult =
        mode === "join"
          ? await roomRepo.joinRoom(roomName.value, roomPassword.value)
          : await roomRepo.createRoom(
              roomName.value,
              roomPassword.value,
              authStore.currentUser?.id || "",
            );

      if (roomResult.success && roomResult.room) {
        roomStore.setRoom(roomResult.room);

        if (mode === "join") {
          const userId = authStore.currentUser?.id;
          if (userId) {
            await roomRepo.trackRoomVisit(userId, roomResult.room.id);
          }
        }

        router.push("/main");
      } else {
        setError(roomResult.error || "Неизвестная ошибка");
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Неизвестная ошибка";
      setError(message);
    } finally {
      stopLoading();
    }
  };

  return {
    roomName,
    roomPassword,
    loading,
    error,
    submit,
  };
}
