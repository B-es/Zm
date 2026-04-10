import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useCardStore } from "@/entities/card/card.store";
import type { Card, CardSection } from "@/entities/card/card.types";

// Мокаем repository
vi.mock("@/entities/card/card.repository", () => ({
  fetchCardsByRoom: vi.fn(),
  saveCard: vi.fn(),
  deleteCardById: vi.fn(),
  subscribeToRoomCards: vi.fn(() => ({
    on: vi.fn(() => ({
      subscribe: vi.fn(),
    })),
  })),
}));

import * as repository from "@/entities/card/card.repository";

function createMockCard(overrides: Partial<Card> = {}): Card {
  return {
    id: "card-1",
    roomId: "room-1",
    section: "watch",
    title: "Test Card",
    description: "Description",
    marked: false,
    createdBy: "user-1",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    updatedBy: "user-1",
    ...overrides,
  };
}

describe("card.store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // ===== setCards =====

  describe("setCards", () => {
    it("должен установить карточки", () => {
      const store = useCardStore();
      const cards = [
        createMockCard({ id: "c1" }),
        createMockCard({ id: "c2" }),
      ];

      store.setCards(cards);

      expect(store.cards).toHaveLength(2);
      expect(store.cards[0]!.id).toBe("c1");
      expect(store.cards[1]!.id).toBe("c2");
    });
  });

  // ===== getCardById =====

  describe("getCardById", () => {
    it("должен найти карточку по id", () => {
      const store = useCardStore();
      const card = createMockCard({ id: "find-me" });
      store.setCards([card]);

      const result = store.getCardById("find-me");

      expect(result).toBeDefined();
      expect(result!.title).toBe("Test Card");
    });

    it("должен вернуть undefined если карточка не найдена", () => {
      const store = useCardStore();
      store.setCards([]);

      const result = store.getCardById("nonexistent");

      expect(result).toBeUndefined();
    });
  });

  // ===== getCardsBySection =====

  describe("getCardsBySection", () => {
    it("должен вернуть карточки нужной секции", () => {
      const store = useCardStore();
      store.setCards([
        createMockCard({ id: "c1", section: "watch" }),
        createMockCard({ id: "c2", section: "go" }),
        createMockCard({ id: "c3", section: "watch" }),
      ]);

      const result = store.getCardsBySection("watch");

      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe("c1");
      expect(result[1]!.id).toBe("c3");
    });

    it("должен вернуть пустой массив если карточек в секции нет", () => {
      const store = useCardStore();
      store.setCards([createMockCard({ id: "c1", section: "go" })]);

      const result = store.getCardsBySection("do");

      expect(result).toEqual([]);
    });
  });

  // ===== loadCards =====

  describe("loadCards", () => {
    it("должен загрузить карточки из repository", async () => {
      const mockCards = [
        createMockCard({ id: "c1" }),
        createMockCard({ id: "c2" }),
      ];
      vi.mocked(repository.fetchCardsByRoom).mockResolvedValue(mockCards);

      const store = useCardStore();
      await store.loadCards("room-1");

      expect(repository.fetchCardsByRoom).toHaveBeenCalledWith("room-1");
      expect(store.cards).toHaveLength(2);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it("должен установить isLoading и error при ошибке", async () => {
      vi.mocked(repository.fetchCardsByRoom).mockRejectedValue(
        new Error("Network error"),
      );

      const store = useCardStore();

      await expect(store.loadCards("room-1")).rejects.toThrow("Network error");

      expect(store.isLoading).toBe(false);
      expect(store.error).toBe("Network error");
    });

    it("должен выбросить ошибку если roomId пустой", async () => {
      const store = useCardStore();

      await expect(store.loadCards("")).rejects.toThrow("roomId обязателен");
    });
  });

  // ===== addCard =====

  describe("addCard", () => {
    it("должен создать карточку и сохранить в БД", async () => {
      const savedCard = createMockCard({
        id: "new-card",
        title: "New Task",
        createdBy: "user-1",
        updatedBy: "user-1",
      });
      vi.mocked(repository.saveCard).mockResolvedValue(savedCard);

      const store = useCardStore();
      const result = await store.addCard(
        "room-1",
        "watch",
        "user-1",
        "New Task",
        "Description",
      );

      expect(repository.saveCard).toHaveBeenCalledWith(
        expect.objectContaining({
          roomId: "room-1",
          section: "watch",
          createdBy: "user-1",
          title: "New Task",
        }),
      );
      expect(result.id).toBe("new-card");
      expect(store.cards).toContainEqual(
        expect.objectContaining({ id: "new-card" }),
      );
    });

    it("должен выбросить ошибку если roomId пустой", async () => {
      const store = useCardStore();

      await expect(
        store.addCard("", "watch", "user-1", "Title", "Desc"),
      ).rejects.toThrow("roomId обязателен");
    });
  });

  // ===== updateCard =====

  describe("updateCard", () => {
    it("должен обновить карточку и сохранить в БД", async () => {
      const existing = createMockCard({ id: "card-1" });
      const updated = { ...existing, title: "Updated", updatedBy: "user-2" };
      vi.mocked(repository.saveCard).mockResolvedValue(updated);

      const store = useCardStore();
      store.setCards([existing]);

      const result = await store.updateCard("card-1", "user-2", {
        title: "Updated",
        description: "New desc",
      });

      expect(result).not.toBeNull();
      expect(result!.title).toBe("Updated");
      expect(result!.updatedBy).toBe("user-2");
      expect(repository.saveCard).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Updated",
          updatedBy: "user-2",
        }),
      );
    });

    it("должен вернуть null если карточка не найдена", async () => {
      const store = useCardStore();
      store.setCards([]);

      const result = await store.updateCard("nonexistent", "user-1", {
        title: "X",
        description: "Y",
      });

      expect(result).toBeNull();
      expect(repository.saveCard).not.toHaveBeenCalled();
    });
  });

  // ===== deleteCard =====

  describe("deleteCard", () => {
    it("должен удалить карточку из store и БД", async () => {
      vi.mocked(repository.deleteCardById).mockResolvedValue(undefined);

      const store = useCardStore();
      store.setCards([createMockCard({ id: "to-delete" })]);

      await store.deleteCard("to-delete");

      expect(repository.deleteCardById).toHaveBeenCalledWith("to-delete");
      expect(store.cards).toHaveLength(0);
    });

    it("должен снять блокировку редактирования при удалении", async () => {
      vi.mocked(repository.deleteCardById).mockResolvedValue(undefined);

      const store = useCardStore();
      store.startEditing("card-1", "user-1");

      await store.deleteCard("card-1");

      expect(store.editingLocks["card-1"]).toBeUndefined();
    });
  });

  // ===== editing locks =====

  describe("editing locks", () => {
    it("startEditing должен установить блокировку", () => {
      const store = useCardStore();

      const result = store.startEditing("card-1", "user-1");

      expect(result.success).toBe(true);
      expect(store.editingLocks["card-1"]).toBe("user-1");
    });

    it("startEditing должен отклонить если другой пользователь уже редактирует", () => {
      const store = useCardStore();
      store.startEditing("card-1", "user-1");

      const result = store.startEditing("card-1", "user-2");

      expect(result.success).toBe(false);
      expect(result.editor).toBe("user-1");
    });

    it("startEditing должен разрешить тому же пользователю", () => {
      const store = useCardStore();
      store.startEditing("card-1", "user-1");

      const result = store.startEditing("card-1", "user-1");

      expect(result.success).toBe(true);
    });

    it("stopEditing должен снять блокировку", () => {
      const store = useCardStore();
      store.startEditing("card-1", "user-1");

      store.stopEditing("card-1");

      expect(store.editingLocks["card-1"]).toBeUndefined();
    });

    it("isCardEditingLocked должен вернуть true если другой пользователь редактирует", () => {
      const store = useCardStore();
      store.startEditing("card-1", "user-1");

      expect(store.isCardEditingLocked("card-1", "user-2")).toBe(true);
      expect(store.isCardEditingLocked("card-1", "user-1")).toBe(false);
    });

    it("getCardEditor должен вернуть id редактора", () => {
      const store = useCardStore();
      store.startEditing("card-1", "user-1");

      expect(store.getCardEditor("card-1")).toBe("user-1");
      expect(store.getCardEditor("card-2")).toBeNull();
    });
  });

  // ===== applyRealtime =====

  describe("applyRealtime", () => {
    it("CARD_UPDATE должен добавить или обновить карточку", () => {
      const store = useCardStore();
      const newCard = createMockCard({ id: "realtime-card" });

      store.applyRealtime({ type: "CARD_UPDATE", payload: newCard });

      expect(store.cards).toContainEqual(
        expect.objectContaining({ id: "realtime-card" }),
      );
    });

    it("CARD_UPDATE должен обновить существующую карточку", () => {
      const store = useCardStore();
      store.setCards([createMockCard({ id: "existing", title: "Old" })]);

      store.applyRealtime({
        type: "CARD_UPDATE",
        payload: createMockCard({ id: "existing", title: "New" }),
      });

      expect(store.cards).toHaveLength(1);
      expect(store.cards[0]!.title).toBe("New");
    });

    it("CARD_DELETE должен удалить карточку", () => {
      const store = useCardStore();
      store.setCards([
        createMockCard({ id: "keep" }),
        createMockCard({ id: "delete-me" }),
      ]);

      store.applyRealtime({
        type: "CARD_DELETE",
        payload: { id: "delete-me" },
      });

      expect(store.cards).toHaveLength(1);
      expect(store.cards[0]!.id).toBe("keep");
    });
  });
});
