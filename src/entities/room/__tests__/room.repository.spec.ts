import { describe, it, expect, vi, beforeEach } from "vitest";

// Мокаем Supabase ДО импорта репозитория
vi.mock("@/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { useRoomRepository } from "@/entities/room/room.repository";
import { supabase } from "@/supabase";
import type { Room } from "@/entities/room/room.types";

function createMockRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: "test-id-1",
    title: "Test Room",
    password: "secret",
    createdBy: "user-1",
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/**
 * Создаём thenable-мок, который при `await` разрешается в { data, error }.
 * Все методы Supabase-чейна (select, eq, order, range, insert, delete,
 * single, maybeSingle) возвращают один и тот же thenable.
 */
function createMockChain() {
  const response = { data: null as unknown, error: null as unknown };

  const chain: Record<string, (...args: unknown[]) => unknown> & {
    then: (onFulfilled: Function, onRejected?: Function) => unknown;
  } = {} as any;

  // Все методы чейнинга
  for (const method of [
    "select",
    "eq",
    "order",
    "range",
    "insert",
    "delete",
    "single",
    "maybeSingle",
  ]) {
    chain[method] = vi.fn(() => chain);
  }

  // Thenable — разрешается в { data, error }
  chain.then = function (onFulfilled: Function, onRejected?: Function) {
    return onFulfilled(response);
  };

  return { chain, response };
}

describe("room.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupRepo() {
    return useRoomRepository();
  }

  // ===== isRoomExists =====

  describe("isRoomExists", () => {
    it("должен вернуть true если комната существует", async () => {
      const { chain, response } = createMockChain();
      response.data = { id: "1" };
      response.error = null;
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const repo = setupRepo();
      const result = await repo.isRoomExists("My Room");

      expect(supabase.from).toHaveBeenCalledWith("rooms");
      expect(chain.select).toHaveBeenCalledWith("id");
      expect(chain.eq).toHaveBeenCalledWith("title", "My Room");
      expect(result).toBe(true);
    });

    it("должен вернуть false если комната не существует", async () => {
      const { chain, response } = createMockChain();
      response.data = null;
      response.error = null;
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const repo = setupRepo();
      const result = await repo.isRoomExists("My Room");

      expect(result).toBe(false);
    });

    it("должен вернуть false при ошибке Supabase", async () => {
      const { chain, response } = createMockChain();
      response.data = null;
      response.error = new Error("Network error");
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const repo = setupRepo();
      const result = await repo.isRoomExists("My Room");

      expect(result).toBe(false);
    });
  });

  // ===== getRoom =====

  describe("getRoom", () => {
    it("должен вернуть комнату при корректных данных", async () => {
      const raw = {
        id: "test-id-1",
        title: "Test Room",
        password: "secret",
        created_by: "user-1",
        created_at: "2024-01-01T00:00:00.000Z",
      };
      const { chain, response } = createMockChain();
      response.data = raw;
      response.error = null;
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const repo = setupRepo();
      const result = await repo.getRoom("My Room", "secret");

      expect(result).toEqual({
        id: "test-id-1",
        title: "Test Room",
        password: "secret",
        createdBy: "user-1",
        createdAt: "2024-01-01T00:00:00.000Z",
      });
      expect(chain.eq).toHaveBeenCalledWith("title", "My Room");
      expect(chain.eq).toHaveBeenCalledWith("password", "secret");
    });

    it("должен вернуть null если комната не найдена", async () => {
      const { chain, response } = createMockChain();
      response.data = null;
      response.error = null;
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const repo = setupRepo();
      const result = await repo.getRoom("Wrong", "wrong");

      expect(result).toBeNull();
    });
  });

  // ===== createRoom =====

  describe("createRoom", () => {
    it("должен создать комнату если она не существует", async () => {
      const { chain: chain1, response: resp1 } = createMockChain();
      resp1.data = null; // не существует
      resp1.error = null;

      const newRoomRaw = {
        id: "new-id",
        title: "New Room",
        password: "pass",
        created_by: "user-1",
        created_at: "2024-06-15T10:00:00.000Z",
      };
      const { chain: chain2, response: resp2 } = createMockChain();
      resp2.data = newRoomRaw;
      resp2.error = null;

      (supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(chain1)
        .mockReturnValueOnce(chain2);

      const repo = setupRepo();
      const result = await repo.createRoom("New Room", "pass", "user-1");

      expect(result.success).toBe(true);
      expect(result.room).toEqual({
        id: "new-id",
        title: "New Room",
        password: "pass",
        createdBy: "user-1",
        createdAt: "2024-06-15T10:00:00.000Z",
      });
      expect(chain2.insert).toHaveBeenCalledWith([
        {
          title: "New Room",
          password: "pass",
          created_by: "user-1",
          created_at: expect.any(String),
        },
      ]);
    });

    it("должен вернуть ошибку если комната уже существует", async () => {
      const { chain, response } = createMockChain();
      response.data = { id: "1" };
      response.error = null;
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const repo = setupRepo();
      const result = await repo.createRoom("Exists", "pass", "user-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Комната с таким названием уже существует");
    });
  });

  // ===== joinRoom =====

  describe("joinRoom", () => {
    it("должен вернуть success: true при успешном входе", async () => {
      const raw = {
        id: "test-id-1",
        title: "Test Room",
        password: "secret",
        created_by: "user-1",
        created_at: "2024-01-01T00:00:00.000Z",
      };
      const { chain, response } = createMockChain();
      response.data = raw;
      response.error = null;
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const repo = setupRepo();
      const result = await repo.joinRoom("My Room", "secret");

      expect(result.success).toBe(true);
      expect(result.room!.createdBy).toBe("user-1");
    });

    it("должен вернуть ошибку если комната не найдена", async () => {
      const { chain, response } = createMockChain();
      response.data = null;
      response.error = null;
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const repo = setupRepo();
      const result = await repo.joinRoom("Wrong", "wrong");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Комната не найдена или неверный пароль");
    });
  });

  // ===== getAllRooms =====

  describe("getAllRooms", () => {
    it("должен вернуть список комнат", async () => {
      const rawRooms = [
        {
          id: "1",
          title: "Room 1",
          password: "p1",
          created_by: "u1",
          created_at: "2024-01-01",
        },
        {
          id: "2",
          title: "Room 2",
          password: "p2",
          created_by: "u1",
          created_at: "2024-01-02",
        },
      ];
      const { chain, response } = createMockChain();
      response.data = rawRooms;
      response.error = null;
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const repo = setupRepo();
      const result = await repo.getAllRooms(10, 0);

      expect(result).toHaveLength(2);
      expect(result[0]!.title).toBe("Room 1");
      expect(result[0]!.createdBy).toBe("u1");
      expect(chain.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
      expect(chain.range).toHaveBeenCalledWith(0, 9);
    });

    it("должен вернуть пустой массив при отсутствии комнат", async () => {
      const { chain, response } = createMockChain();
      response.data = [];
      response.error = null;
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const repo = setupRepo();
      const result = await repo.getAllRooms();

      expect(result).toEqual([]);
    });
  });

  // ===== getRoomsByUser =====

  describe("getRoomsByUser", () => {
    it("должен вернуть комнаты пользователя", async () => {
      const rawRooms = [
        {
          id: "1",
          title: "Room 1",
          password: "p1",
          created_by: "user-1",
          created_at: "2024-01-01",
        },
        {
          id: "2",
          title: "Room 2",
          password: "p2",
          created_by: "user-1",
          created_at: "2024-01-02",
        },
      ];
      const { chain, response } = createMockChain();
      response.data = rawRooms;
      response.error = null;
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const repo = setupRepo();
      const result = await repo.getRoomsByUser("user-1");

      expect(result).toHaveLength(2);
      expect(result[0]!.createdBy).toBe("user-1");
      expect(chain.eq).toHaveBeenCalledWith("created_by", "user-1");
    });

    it("должен вернуть пустой массив если у пользователя нет комнат", async () => {
      const { chain, response } = createMockChain();
      response.data = [];
      response.error = null;
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const repo = setupRepo();
      const result = await repo.getRoomsByUser("user-1");

      expect(result).toEqual([]);
    });
  });

  // ===== deleteRoom =====

  describe("deleteRoom", () => {
    it("должен удалить комнату и вернуть true", async () => {
      const { chain, response } = createMockChain();
      response.data = null;
      response.error = null;
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const repo = setupRepo();
      const result = await repo.deleteRoom("room-id");

      expect(result).toBe(true);
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith("id", "room-id");
    });

    it("должен вернуть false при ошибке", async () => {
      const { chain, response } = createMockChain();
      response.data = null;
      response.error = new Error("Not found");
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

      const repo = setupRepo();
      const result = await repo.deleteRoom("bad-id");

      expect(result).toBe(false);
    });
  });
});
