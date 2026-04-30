import { computed } from "vue";
import { useCardStore } from "@/entities/card/card.store";
import { useRoomStore } from "@/entities/room/room.store";
import { useAuthStore } from "@/entities/auth/auth.store";
import { useErrorHandler } from "@/shared/composables/useErrorHandler";
import type { CardSection } from "@/entities/card/card.types";

export function useCardActions(section: CardSection) {
  const cardStore = useCardStore();
  const roomStore = useRoomStore();
  const authStore = useAuthStore();
  const { withError, showToast } = useErrorHandler();

  const currentUserId = computed(() => authStore.currentUser?.id || "");

  const canEditCard = (cardId: string) => {
    const editor = cardStore.getCardEditor(cardId);
    return !editor || editor === currentUserId.value;
  };

  const onRequestEdit = (cardId: string) => {
    const result = cardStore.startEditing(cardId, currentUserId.value);
    if (!result.success && result.editor) {
      showToast(`Карточка редактируется пользователем ${result.editor}`);
    }
  };

  const onUpdateCard = async (
    cardId: string,
    data: { title: string; description: string },
  ) => {
    await withError(
      () => cardStore.updateCard(cardId, currentUserId.value, data),
      "сохранения",
    );
  };

  const onStopEdit = (cardId: string) => {
    cardStore.stopEditing(cardId);
  };

  const onEditingDraft = (payload: {
    cardId: string;
    title: string;
    description: string;
    isEditing: boolean;
  }) => {
    cardStore.broadcastEditingDraft(
      payload.cardId,
      payload.title,
      payload.description,
      payload.isEditing,
    );
  };

  const onMarkCard = async (cardId: string) => {
    await withError(() => cardStore.markCard(cardId), "маркировки");
  };

  const onDeleteCard = async (cardId: string) => {
    if (!confirm("Удалить карточку?")) return;
    await withError(() => cardStore.deleteCard(cardId), "удаления");
  };

  const onUpdateBanner = async (payload: {
    cardId: string;
    bannerUrl: string;
  }) => {
    await withError(
      () => cardStore.updateCardBanner(payload.cardId, payload.bannerUrl),
      "обновления баннера",
    );
  };

  const onAddCard = async () => {
    if (!roomStore.roomId) {
      showToast("Ошибка: комната не выбрана");
      return;
    }
    await withError(
      () =>
        cardStore.addCard(
          roomStore.roomId,
          section,
          currentUserId.value,
          "Новая задача",
          "Опишите задачу здесь...",
        ),
      "создания карточки",
    );
  };

  return {
    currentUserId,
    canEditCard,
    onRequestEdit,
    onUpdateCard,
    onStopEdit,
    onEditingDraft,
    onMarkCard,
    onDeleteCard,
    onUpdateBanner,
    onAddCard,
  };
}
