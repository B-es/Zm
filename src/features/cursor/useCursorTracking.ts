import { reactive } from "vue";
import { useAuthStore } from "@/entities/auth/auth.store";
import { useCursorStore } from "@/entities/cursor/cursor.store";

export function useCursorTracking() {
  const authStore = useAuthStore();
  const cursorStore = useCursorStore();

  const cursorPosition = reactive({ x: -100, y: -100 });

  const handleMouseMove = (e: MouseEvent) => {
    const user = authStore.currentUser;
    if (!user) return;

    cursorPosition.x = e.clientX;
    cursorPosition.y = e.clientY;

    cursorStore.broadcastPosition(
      user.id,
      user.nickname,
      user.avatarUrl || "",
      e.clientX,
      e.clientY,
    );
  };

  return { cursorPosition, handleMouseMove };
}
