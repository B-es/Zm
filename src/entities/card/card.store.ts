import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import type { Card, CardSection } from "./card.types";
import * as repository from "./card.repository";
import { supabase } from "@/supabase";

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
  // ===== state =====
  const cards = ref<Card[]>([]);
  const editingLocks = ref<Record<string, string>>({}); // cardId -> userId
  const editingDrafts = ref<Record<string, EditingDraft>>({}); // cardId -> EditingDraft
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // ===== realtime broadcast for editing =====
  let editingChannel: ReturnType<typeof supabase.channel> | null = null;
  let myUserId = "";
  let myNickname = "";

  // ===== getters =====
  const getCardById = (id: string) => cards.value.find((c) => c.id === id);

  const getCardsBySection = (section: CardSection, marked = false) =>
    cards.value.filter((c) => c.section === section && c.marked === marked);

  const isCardEditingLocked = (cardId: string, userId: string) => {
    const lock = editingLocks.value[cardId];
    return lock !== undefined && lock !== userId;
  };

  const getCardEditor = (cardId: string) => editingLocks.value[cardId] || null;

  const getCardDraft = (cardId: string) => editingDrafts.value[cardId] || null;

  // ===== editing draft broadcast =====
  const broadcastEditingDraft = (
    cardId: string,
    title: string,
    description: string,
    isEditing: boolean,
  ) => {
    if (!editingChannel || !myUserId) return;
    editingChannel.send(
      {
        type: "broadcast",
        event: "editing-draft",
        payload: {
          cardId,
          userId: myUserId,
          nickname: myNickname,
          title,
          description,
          isEditing,
          lastUpdate: Date.now(),
        },
      },
      { httpSend: true },
    );
  };

  const broadcastEditingLock = (cardId: string, isLocked: boolean) => {
    if (!editingChannel || !myUserId) return;
    editingChannel.send(
      {
        type: "broadcast",
        event: "editing-lock",
        payload: {
          cardId,
          userId: myUserId,
          nickname: myNickname,
          isLocked,
        },
      },
      { httpSend: true },
    );
  };

  const joinEditingChannel = (
    roomId: string,
    userId: string,
    nickname: string,
  ) => {
    myUserId = userId;
    myNickname = nickname;

    const ch = supabase.channel(`card-editing:${roomId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    ch.on("broadcast", { event: "editing-draft" }, (payload) => {
      const data = payload.payload as EditingDraft;
      if (data.isEditing) {
        editingDrafts.value[data.cardId] = data;
      } else {
        delete editingDrafts.value[data.cardId];
      }
    });

    ch.on("broadcast", { event: "editing-lock" }, (payload) => {
      const data = payload.payload as {
        cardId: string;
        userId: string;
        nickname: string;
        isLocked: boolean;
      };
      if (data.isLocked) {
        editingLocks.value[data.cardId] = data.userId;
      } else {
        delete editingLocks.value[data.cardId];
      }
    });

    editingChannel = ch;
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
      }
    });
  };

  const leaveEditingChannel = () => {
    myUserId = "";
    myNickname = "";
    editingDrafts.value = {};

    if (editingChannel) {
      supabase.removeChannel(editingChannel);
      editingChannel = null;
    }
  };

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

  const markCard = async (cardId: string): Promise<Card | null> => {
    const existing = getCardById(cardId);
    if (!existing) return null;

    // Снимаем блокировку редактирования при маркировке/размаркировке
    const wasLocked = editingLocks.value[cardId];
    if (wasLocked) {
      stopEditing(cardId);
      broadcastEditingLock(cardId, false);
    }

    const updated: Card = {
      ...existing,
      marked: !existing.marked,
      updatedAt: new Date().toISOString(),
      updatedBy: existing.updatedBy,
    };

    const saved = await repository.saveCard(updated);
    addOrUpdateCard(saved);
    return saved;
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
      marked: false,
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

  const updateCardBanner = async (
    cardId: string,
    bannerUrl: string,
  ): Promise<void> => {
    await repository.updateCardBanner(cardId, bannerUrl);

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
    editingDrafts,
    isLoading,
    error,

    // getters
    getCardById,
    getCardsBySection,
    isCardEditingLocked,
    getCardEditor,
    getCardDraft,

    // actions
    setCards,
    loadCards,
    startEditing,
    stopEditing,
    addCard,
    updateCard,
    deleteCard,
    updateCardBanner,
    markCard,
    addOrUpdateCard,
    removeCard,
    applyRealtime,
    subscribeToRealtime,
    unsubscribeFromRealtime,
    broadcastEditingDraft,
    broadcastEditingLock,
    joinEditingChannel,
    leaveEditingChannel,
  };
});
