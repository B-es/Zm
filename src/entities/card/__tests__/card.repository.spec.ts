import { describe, it, expect, vi, beforeEach } from "vitest";

// Мокаем Supabase ДО импорта репозитория
vi.mock("@/supabase", () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  },
}));

import * as repository from "@/entities/card/card.repository";
import { supabase } from "@/supabase";
import type { Card } from "@/entities/card/card.types";

// Mock realtime channel
const mockChannel = {
  on: vi.fn(function (this: typeof mockChannel) {
    return this;
  }),
  subscribe: vi.fn(),
};

function createMockCard(overrides: Partial<Card> = {}): Card {
  return {
    id: "card-id-1",
    roomId: "room-id-1",
    section: "watch",
    title: "Test Card",
    description: "Test description",
    marked: false,
    createdBy: "user-1",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    updatedBy: "user-1",
    ...overrides,
  };
}

/**
 * Создаём thenable-мок для Supabase-чейна.
 */
function createMockChain() {
  const response = { data: null as unknown, error: null as unknown };

  const chain: Record<string, (...args: unknown[]) => unknown> & {
    then: (onFulfilled: Function, onRejected?: Function) => unknown;
  } = {} as any;

  for (const method of [
    "select",
    "eq",
    "order",
    "insert",
    "delete",
    "single",
    "upsert",
  ]) {
    chain[method] = vi.fn(() => chain);
  }

  chain.then = function (onFulfilled: Function, onRejected?: Function) {
    return onFulfilled(response);
  };

  return { chain, response };
}

describe("card.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== fetchCardsByRoom =====

  describe("fetchCardsByRoom", () => {
    it("должен вернуть карточки комнаты", async () => {
      const rawCards = [
        {
          id: "c1",
          room_id: "room-1",
          section: "watch",
          title: "Card 1",
          description: "Desc 1",
          created_by: "u1",
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z",
          updated_by: "u1",
        },
        {
          id: "c2",
          room_id: "room-1",
          section: "go",
          title: "Card 2",
          description: "Desc 2",
          created_by: "u2",
          created_at: "2024-01-02T00:00:00.000Z",
          updated_at: "2024-01-02T00:00:00.000Z",
          updated_by: "u2",
        },
      ];

      const { chain, response } = createMockChain();
      response.data = rawCards;
      response.error = null;
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const result = await repository.fetchCardsByRoom("room-1");

      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe("c1");
      expect(result[0]!.roomId).toBe("room-1");
      expect(result[0]!.section).toBe("watch");
      expect(result[0]!.createdBy).toBe("u1");
      expect(result[1]!.title).toBe("Card 2");
      expect(supabase.from).toHaveBeenCalledWith("cards");
      expect(chain.eq).toHaveBeenCalledWith("room_id", "room-1");
      expect(chain.order).toHaveBeenCalledWith("created_at", {
        ascending: true,
      });
    });

    it("должен вернуть пустой массив если карточек нет", async () => {
      const { chain, response } = createMockChain();
      response.data = [];
      response.error = null;
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const result = await repository.fetchCardsByRoom("room-1");

      expect(result).toEqual([]);
    });

    it("должен выбросить ошибку при проблеме с запросом", async () => {
      const { chain, response } = createMockChain();
      response.data = null;
      response.error = new Error("DB error");
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      await expect(repository.fetchCardsByRoom("room-1")).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ===== saveCard =====

  describe("saveCard", () => {
    it("должен создать новую карточку (upsert insert)", async () => {
      const newCard = createMockCard({
        id: "new-card-id",
        title: "New Card",
        createdBy: "user-1",
        updatedBy: "user-1",
      });

      const savedRaw = {
        id: "new-card-id",
        room_id: "room-id-1",
        section: "watch",
        title: "New Card",
        description: "Test description",
        created_by: "user-1",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
        updated_by: "user-1",
      };

      const { chain, response } = createMockChain();
      response.data = savedRaw;
      response.error = null;
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const result = await repository.saveCard(newCard);

      expect(result.id).toBe("new-card-id");
      expect(result.title).toBe("New Card");
      expect(chain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "new-card-id",
          room_id: "room-id-1",
          section: "watch",
          title: "New Card",
          created_by: "user-1",
        }),
      );
    });

    it("должен обновить существующую карточку", async () => {
      const updatedCard = createMockCard({
        title: "Updated Title",
        description: "Updated desc",
        updatedBy: "user-2",
        updatedAt: "2024-06-01T00:00:00.000Z",
      });

      const savedRaw = {
        id: "card-id-1",
        room_id: "room-id-1",
        section: "watch",
        title: "Updated Title",
        description: "Updated desc",
        created_by: "user-1",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-06-01T00:00:00.000Z",
        updated_by: "user-2",
      };

      const { chain, response } = createMockChain();
      response.data = savedRaw;
      response.error = null;
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const result = await repository.saveCard(updatedCard);

      expect(result.title).toBe("Updated Title");
      expect(result.updatedBy).toBe("user-2");
    });

    it("должен выбросить ошибку при проблеме с сохранением", async () => {
      const { chain, response } = createMockChain();
      response.data = null;
      response.error = new Error("Constraint violation");
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const card = createMockCard();
      await expect(repository.saveCard(card)).rejects.toThrow(
        "Constraint violation",
      );
    });
  });

  // ===== deleteCardById =====

  describe("deleteCardById", () => {
    it("должен удалить карточку", async () => {
      const { chain, response } = createMockChain();
      response.data = null;
      response.error = null;
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      await repository.deleteCardById("card-id-1");

      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith("id", "card-id-1");
    });

    it("должен выбросить ошибку при проблеме с удалением", async () => {
      const { chain, response } = createMockChain();
      response.data = null;
      response.error = new Error("Not found");
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      await expect(repository.deleteCardById("bad-id")).rejects.toThrow(
        "Not found",
      );
    });
  });

  // ===== subscribeToRoomCards =====

  describe("subscribeToRoomCards", () => {
    it("должен создать канал и подписаться", () => {
      const callback = vi.fn();

      repository.subscribeToRoomCards("room-1", callback);

      expect(supabase.channel).toHaveBeenCalledWith("cards:room-1");
      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it("должен вызвать callback с CARD_UPDATE при INSERT", () => {
      const userCallback = vi.fn();
      let internalCallback: (payload: any) => void = () => {};

      mockChannel.on.mockImplementation((..._args: any[]) => {
        internalCallback = _args[2];
        return mockChannel;
      });

      repository.subscribeToRoomCards("room-1", userCallback);

      const newRaw = {
        id: "c-new",
        room_id: "room-1",
        section: "go",
        title: "New from DB",
        description: "desc",
        created_by: "u1",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
        updated_by: "u1",
      };

      internalCallback({
        eventType: "INSERT",
        new: newRaw,
      });

      expect(userCallback).toHaveBeenCalledWith({
        type: "CARD_UPDATE",
        payload: expect.objectContaining({
          id: "c-new",
          section: "go",
          title: "New from DB",
        }),
      });
    });

    it("должен вызвать callback с CARD_UPDATE при UPDATE", () => {
      const userCallback = vi.fn();
      let internalCallback: (payload: any) => void = () => {};

      mockChannel.on.mockImplementation((..._args: any[]) => {
        internalCallback = _args[2];
        return mockChannel;
      });

      repository.subscribeToRoomCards("room-1", userCallback);

      const updatedRaw = {
        id: "c-updated",
        room_id: "room-1",
        section: "do",
        title: "Updated Title",
        description: "updated desc",
        created_by: "u1",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-06-01T00:00:00.000Z",
        updated_by: "u2",
      };

      internalCallback({
        eventType: "UPDATE",
        new: updatedRaw,
      });

      expect(userCallback).toHaveBeenCalledWith({
        type: "CARD_UPDATE",
        payload: expect.objectContaining({
          id: "c-updated",
          title: "Updated Title",
        }),
      });
    });

    it("должен вызвать callback с CARD_DELETE при DELETE", () => {
      const userCallback = vi.fn();
      let internalCallback: (payload: any) => void = () => {};

      mockChannel.on.mockImplementation((..._args: any[]) => {
        internalCallback = _args[2];
        return mockChannel;
      });

      repository.subscribeToRoomCards("room-1", userCallback);

      internalCallback({
        eventType: "DELETE",
        old: { id: "c-deleted" },
      });

      expect(userCallback).toHaveBeenCalledWith({
        type: "CARD_DELETE",
        payload: { id: "c-deleted" },
      });
    });
  });
});
