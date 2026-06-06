import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import type { Card, CardSection } from "./card.types";
import { di } from "@/di";
import { useErrorHandler } from "@/shared/composables/useErrorHandler";
import { useFormState } from "@/shared/composables/useFormState";

export interface EditingLock {
  cardId: string;
  userId: string;
}

export interface EditingDraft {
  cardId: string;
  userId: string;
  nickname: string;
  title: string;
  description: string;
  isEditing: boolean;
  lastUpdate: number;
}

export const useCardStore = defineStore("card", () => {
  const cardRepository = di.cardRepository;
  const { withError } = useErrorHandler();
  const { loading: isLoading, startLoading, stopLoading } = useFormState();

  // ===== state =====
  const cards = ref<Card[]>([]);
  const error = ref<string | null>(null);

  // ===== realtime broadcast for editing =====
  let editingChannel: null = null;
  let myUserId = "";
  let myNickname = "";

  // ===== getters =====
  const getCardById = (id: string) => cards.value.find((c) => c.id === id);

  const getCardsBySection = (section: CardSection, marked = false) =>
    cards.value.filter((c) => c.section === section && c.marked === marked);

  // ===== actions =====
  const setCards = (newCards: Card[]) => {
    cards.value = [...newCards];
  };

  const loadCards = async (roomId: string) => {
    if (!roomId) throw new Error("roomId обязателен");
    startLoading();
    error.value = null;

    await withError(async () => {
      const fetched = await cardRepository.fetchCardsByRoom(roomId);
      cards.value = fetched;
    }, "Ошибка загрузки карточек");

    stopLoading();
  };

  const markCard = async (cardId: string): Promise<Card | null> => {
    const existing = getCardById(cardId);
    if (!existing) return null;

    const updated: Card = {
      ...existing,
      marked: !existing.marked,
      updatedAt: new Date().toISOString(),
      updatedBy: existing.updatedBy,
    };

    const saved = await withError(
      async () => await cardRepository.saveCard(updated),
      "markCard",
    );
    if (saved === null) return null;
    addOrUpdateCard(saved);
    return saved;
  };

  const addCard = async (
    roomId: string,
    section: CardSection,
    userId: string,
    title: string,
    description: string,
  ): Promise<Card | null> => {
    if (!roomId) throw new Error("roomId обязателен");
    const now = new Date().toISOString();
    const newCard: Card = {
      id: crypto.randomUUID(),
      roomId,
      section,
      title,
      description,
      marked: false,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      updatedBy: userId,
    };

    const saved = await withError(
      async () => await cardRepository.saveCard(newCard),
      "addCard",
    );

    if (saved === null) return null;
    addOrUpdateCard(saved);
    return saved;
  };

  const updateCard = async (
    cardId: string,
    userId: string,
    data: { title: string; description: string },
  ): Promise<Card | null> => {
    const existing = getCardById(cardId);
    if (!existing) return null;

    const updated: Card = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };
    const saved = await withError(
      async () => await cardRepository.saveCard(updated),
      "updateCard",
    );
    if (saved === null) return null;

    addOrUpdateCard(saved);
    return saved;
  };

  const deleteCard = async (cardId: string): Promise<void> => {
    const saved = await withError(
      async () => await cardRepository.deleteCardById(cardId),
      "deleteCard",
    );
    if (saved === null) return;
    removeCard(cardId);
  };

  const updateCardBanner = async (
    cardId: string,
    bannerUrl: string,
  ): Promise<void> => {
    await cardRepository.updateCardBanner(cardId, bannerUrl);

    // Обновляем локально
    const card = getCardById(cardId);
    if (card) {
      addOrUpdateCard({
        ...card,
        bannerUrl,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const addOrUpdateCard = (card: Card) => {
    const idx = cards.value.findIndex((c) => c.id === card.id);
    if (idx !== -1) {
      cards.value[idx] = card;
    } else {
      cards.value.push(card);
    }
    console.log(cards.value);
  };

  const removeCard = (cardId: string) => {
    cards.value = cards.value.filter((c) => c.id !== cardId);
  };

  async function getCardEditor(cardId: string) {
    return await withError(
      async () => await cardRepository.getCardEditor(cardId),
      "getCardEditor",
    );
  }

  return {
    // state
    cards,
    isLoading,
    error,

    // getters
    getCardById,
    getCardsBySection,

    // actions
    setCards,
    loadCards,
    addCard,
    updateCard,
    deleteCard,
    updateCardBanner,
    markCard,
    addOrUpdateCard,
    removeCard,
    getCardEditor,
  };
});
