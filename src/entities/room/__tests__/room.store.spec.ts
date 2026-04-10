import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useRoomStore } from "@/entities/room/room.store";
import type { Room } from "@/entities/room/room.types";

function createMockRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: "test-room-id",
    title: "Test Room",
    password: "secret",
    createdBy: "user-1",
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("room.store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("setRoom", () => {
    it("должен установить комнату с корректными полями", () => {
      const store = useRoomStore();
      const room = createMockRoom({ title: "Моя комната" });

      store.setRoom(room);

      expect(store.room).not.toBeNull();
      expect(store.room!.title).toBe("Моя комната");
      expect(store.room!.password).toBe("secret");
      expect(store.room!.id).toBe("test-room-id");
      expect(store.room!.createdBy).toBe("user-1");
    });

    it("должен использовать реальный id из БД", () => {
      const store = useRoomStore();
      const room = createMockRoom({ id: "db-uuid-123" });

      store.setRoom(room);

      expect(store.roomId).toBe("db-uuid-123");
    });
  });

  describe("clearRoom", () => {
    it("должен очистить комнату", () => {
      const store = useRoomStore();
      store.setRoom(createMockRoom());
      expect(store.isRoomSet).toBe(true);

      store.clearRoom();

      expect(store.room).toBeNull();
    });
  });

  describe("getters", () => {
    it("isRoomSet должен возвращать true когда комната установлена", () => {
      const store = useRoomStore();
      store.setRoom(createMockRoom());
      expect(store.isRoomSet).toBe(true);
    });

    it("isRoomSet должен возвращать false когда комната не установлена", () => {
      const store = useRoomStore();
      expect(store.isRoomSet).toBe(false);
    });

    it("roomId должен возвращать id комнаты", () => {
      const store = useRoomStore();
      store.setRoom(createMockRoom({ id: "my-id" }));
      expect(store.roomId).toBe("my-id");
    });

    it("roomId должен возвращать пустую строку если комната не установлена", () => {
      const store = useRoomStore();
      expect(store.roomId).toBe("");
    });

    it("roomTitle должен возвращать title комнаты", () => {
      const store = useRoomStore();
      store.setRoom(createMockRoom({ title: "Моя комната" }));
      expect(store.roomTitle).toBe("Моя комната");
    });

    it("roomTitle должен возвращать пустую строку если комната не установлена", () => {
      const store = useRoomStore();
      expect(store.roomTitle).toBe("");
    });
  });
});
