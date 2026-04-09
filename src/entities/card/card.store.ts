import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import type { Card, CardSection } from "./card.types";
import * as repository from "./card.repository";

export interface EditingLock {
  cardId: string;
  userId: string;
}

export const useCardStore = defineStore("card", () => {
  // ===== state =====
  const cards = ref<Card[]>([]);
  const editingLocks = ref<Record<string, string>>({}); // cardId -> userId
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // ===== getters =====
  const getCardById = (id: string) => cards.value.find((c) => c.id === id);

  const getCardsBySection = (section: CardSection) =>
    cards.value.filter((c) => c.section === section);

  const isCardEditingLocked = (cardId: string, userId: string) => {
    const lock = editingLocks.value[cardId];
    return lock !== undefined && lock !== userId;
  };

  const getCardEditor = (cardId: string) => editingLocks.value[cardId] || null;

  // ===== actions =====
  const setCards = (newCards: Card[]) => {
    cards.value = [...newCards];
  };

  const loadCards = async (roomId: string) => {
    if (!roomId) throw new Error("roomId обязателен");
    isLoading.value = true;
    error.value = null;
    try {
      const fetched = await repository.fetchCardsByRoom(roomId);
      cards.value = fetched;
    } catch (e: any) {
      error.value = e.message || "Ошибка загрузки карточек";
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const startEditing = (
    cardId: string,
    userId: string,
  ): { success: boolean; editor?: string } => {
    const currentLock = editingLocks.value[cardId];
    if (currentLock && currentLock !== userId) {
      return { success: false, editor: currentLock };
    }
    editingLocks.value[cardId] = userId;
    return { success: true };
  };

  const stopEditing = (cardId: string) => {
    delete editingLocks.value[cardId];
  };

  const addCard = async (
    roomId: string,
    section: CardSection,
    userId: string,
    title: string,
    description: string,
  ): Promise<Card> => {
    if (!roomId) throw new Error("roomId обязателен");
    const now = new Date().toISOString();
    const newCard: Card = {
      id: crypto.randomUUID(),
      roomId,
      section,
      title,
      description,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      updatedBy: userId,
    };

    const saved = await repository.saveCard(newCard);
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

    const saved = await repository.saveCard(updated);
    addOrUpdateCard(saved);
    return saved;
  };

  const deleteCard = async (cardId: string): Promise<void> => {
    await repository.deleteCardById(cardId);
    removeCard(cardId);
  };

  const addOrUpdateCard = (card: Card) => {
    const idx = cards.value.findIndex((c) => c.id === card.id);
    if (idx !== -1) {
      cards.value[idx] = card;
    } else {
      cards.value.push(card);
    }
  };

  const removeCard = (cardId: string) => {
    cards.value = cards.value.filter((c) => c.id !== cardId);
    stopEditing(cardId);
  };

  // ===== realtime event handler =====
  const applyRealtime = (event: { type: string; payload: any }) => {
    switch (event.type) {
      case "CARD_UPDATE":
        addOrUpdateCard(event.payload);
        break;

      case "CARD_DELETE":
        removeCard(event.payload.id);
        break;
    }
  };

  // ===== realtime subscription =====
  let channel: ReturnType<typeof repository.subscribeToRoomCards> | null = null;
  let subscriberCount = 0;

  const subscribeToRealtime = (roomId: string) => {
    subscriberCount++;
    if (channel) return; // уже подписаны
    channel = repository.subscribeToRoomCards(roomId, applyRealtime);
  };

  const unsubscribeFromRealtime = () => {
    subscriberCount = Math.max(0, subscriberCount - 1);
    if (subscriberCount > 0 || !channel) return; // ещё есть подписчики
    const ch = channel;
    channel = null;
    import("@/supabase").then(({ supabase }) => {
      supabase.removeChannel(ch);
    });
  };

  return {
    // state
    cards,
    editingLocks,
    isLoading,
    error,

    // getters
    getCardById,
    getCardsBySection,
    isCardEditingLocked,
    getCardEditor,

    // actions
    setCards,
    loadCards,
    startEditing,
    stopEditing,
    addCard,
    updateCard,
    deleteCard,
    addOrUpdateCard,
    removeCard,
    applyRealtime,
    subscribeToRealtime,
    unsubscribeFromRealtime,
  };
});
