import { describe, it, expect, vi, beforeEach } from "vitest";

// Мокаем Supabase ДО импорта store
vi.mock("@/supabase", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

import { createPinia, setActivePinia } from "pinia";
import { useAuthStore } from "@/entities/auth/auth.store";
import { supabase } from "@/supabase";

// ===== Helpers =====

function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-id-123",
    email: "test@example.com",
    user_metadata: {
      nickname: "TestUser",
      avatar_url: "https://example.com/avatar.png",
      ...overrides,
    },
  };
}

function createMockSession(userOverrides: Record<string, unknown> = {}) {
  return {
    user: createMockUser(userOverrides),
    access_token: "token-123",
    refresh_token: "refresh-123",
    expires_at: Date.now() + 3600,
  };
}

describe("auth.store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // ===== signUp =====

  describe("signUp", () => {
    it("должен зарегистрировать пользователя и установить user", async () => {
      const user = createMockUser();
      (supabase.auth.signUp as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user },
        error: null,
      });

      const store = useAuthStore();
      const result = await store.signUp(
        "test@example.com",
        "password123",
        "TestUser",
      );

      expect(result.success).toBe(true);
      expect(store.user).not.toBeNull();
      expect(store.user!.id).toBe("user-id-123");
      expect(store.user!.nickname).toBe("TestUser");
      expect(store.user!.avatarUrl).toBe("https://example.com/avatar.png");
      expect(store.loading).toBe(false);
      expect(store.authError).toBeNull();
    });

    it("должен установить nickname из email если нет в metadata", async () => {
      const user = createMockUser({ nickname: null });
      (supabase.auth.signUp as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user },
        error: null,
      });

      const store = useAuthStore();
      await store.signUp("test@example.com", "password123", "TestUser");

      expect(store.user!.nickname).toBe("test@example.com");
    });

    it("должен вернуть ошибку если регистрация не удалась", async () => {
      (supabase.auth.signUp as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: { message: "Email already in use" },
      });

      const store = useAuthStore();
      const result = await store.signUp(
        "test@example.com",
        "password123",
        "TestUser",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email already in use");
      expect(store.authError).toBe("Email already in use");
      expect(store.user).toBeNull();
    });

    it("должен установить loading в true на время запроса", async () => {
      let loadingDuringRequest = false;
      (supabase.auth.signUp as ReturnType<typeof vi.fn>).mockImplementation(
        async () => {
          const store = useAuthStore();
          loadingDuringRequest = store.loading;
          return { data: { user: null }, error: null };
        },
      );

      const store = useAuthStore();
      await store.signUp("test@example.com", "password123", "TestUser");

      expect(loadingDuringRequest).toBe(true);
    });
  });

  // ===== signIn =====

  describe("signIn", () => {
    it("должен войти и установить user", async () => {
      const user = createMockUser();
      (
        supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ data: { user }, error: null });

      const store = useAuthStore();
      const result = await store.signIn("test@example.com", "password123");

      expect(result.success).toBe(true);
      expect(store.isAuth).toBe(true);
      expect(store.user!.id).toBe("user-id-123");
    });

    it("должен вернуть ошибку при неверном пароле", async () => {
      (
        supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid login credentials" },
      });

      const store = useAuthStore();
      const result = await store.signIn("test@example.com", "wrong");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid login credentials");
      expect(store.user).toBeNull();
    });
  });

  // ===== signInWithOAuth =====

  describe("signInWithOAuth", () => {
    it("должен вызвать signInWithOAuth с провайдером google", async () => {
      (
        supabase.auth.signInWithOAuth as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ error: null });
      (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { session: null },
      });

      const store = useAuthStore();
      await store.signInWithOAuth("google");

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
    });

    it("должен вернуть ошибку если signInWithOAuth не удался", async () => {
      (
        supabase.auth.signInWithOAuth as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ error: { message: "OAuth failed" } });

      const store = useAuthStore();
      const result = await store.signInWithOAuth("google");

      expect(result.success).toBe(false);
      expect(result.error).toBe("OAuth failed");
    });

    it("должен вызвать loadSession при отсутствии ошибки", async () => {
      (
        supabase.auth.signInWithOAuth as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ error: null });
      const session = createMockSession();
      (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { session },
      });

      const store = useAuthStore();
      await store.signInWithOAuth("google");

      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(store.user).not.toBeNull();
    });
  });

  // ===== signOut =====

  describe("signOut", () => {
    it("должен сбросить user при успешном выходе", async () => {
      (supabase.auth.signOut as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: null,
      });

      const store = useAuthStore();
      store.user = createMockUser() as any;
      expect(store.isAuth).toBe(true);

      const result = await store.signOut();

      expect(result.success).toBe(true);
      expect(store.user).toBeNull();
      expect(store.isAuth).toBe(false);
    });

    it("должен вернуть ошибку если signOut не удался", async () => {
      (supabase.auth.signOut as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: { message: "Sign out failed" },
      });

      const store = useAuthStore();
      const result = await store.signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Sign out failed");
    });
  });

  // ===== loadSession =====

  describe("loadSession", () => {
    it("должен установить user если сессия существует", async () => {
      const session = createMockSession();
      (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { session },
      });

      const store = useAuthStore();
      await store.loadSession();

      expect(store.user).not.toBeNull();
      expect(store.user!.id).toBe("user-id-123");
      expect(store.user!.nickname).toBe("TestUser");
      expect(store.isAuth).toBe(true);
    });

    it("должен установить null если сессии нет", async () => {
      (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { session: null },
      });

      const store = useAuthStore();
      store.user = createMockUser() as any;
      await store.loadSession();

      expect(store.user).toBeNull();
      expect(store.isAuth).toBe(false);
    });

    it("должен использовать email как nickname если нет nickname в metadata", async () => {
      const session = createMockSession({ nickname: null });
      (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { session },
      });

      const store = useAuthStore();
      await store.loadSession();

      expect(store.user!.nickname).toBe("test@example.com");
    });
  });

  // ===== initAuthListener =====

  describe("initAuthListener", () => {
    it("должен подписаться на onAuthStateChange", () => {
      const store = useAuthStore();
      store.initAuthListener();

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it("должен установить user при событии SIGNED_IN", () => {
      const session = createMockSession();
      let callback: (event: string, s: typeof session | null) => void;
      (
        supabase.auth.onAuthStateChange as ReturnType<typeof vi.fn>
      ).mockImplementation((cb) => {
        callback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const store = useAuthStore();
      store.initAuthListener();
      // Вызываем коллбек
      callback!("SIGNED_IN", session);

      expect(store.user!.id).toBe("user-id-123");
      expect(store.isAuth).toBe(true);
    });

    it("должен сбросить user при событии SIGNED_OUT", () => {
      let callback: (event: string, s: unknown | null) => void;
      (
        supabase.auth.onAuthStateChange as ReturnType<typeof vi.fn>
      ).mockImplementation((cb) => {
        callback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const store = useAuthStore();
      store.user = createMockUser() as any;
      expect(store.isAuth).toBe(true);

      store.initAuthListener();
      callback!("SIGNED_OUT", null);

      expect(store.user).toBeNull();
      expect(store.isAuth).toBe(false);
    });

    it("должен обновить user при событии TOKEN_REFRESHED", () => {
      const oldSession = createMockSession({ nickname: "OldName" });
      const newSession = createMockSession({ nickname: "NewName" });

      let callback: (event: string, s: unknown | null) => void;
      (
        supabase.auth.onAuthStateChange as ReturnType<typeof vi.fn>
      ).mockImplementation((cb) => {
        callback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const store = useAuthStore();
      store.user = oldSession.user as any;
      store.initAuthListener();
      callback!("TOKEN_REFRESHED", newSession);

      expect(store.user!.nickname).toBe("NewName");
    });
  });

  // ===== Getters =====

  describe("getters", () => {
    it("isAuth должен возвращать false если user не установлен", () => {
      const store = useAuthStore();
      expect(store.isAuth).toBe(false);
    });

    it("isAuth должен возвращать true если user установлен", () => {
      const store = useAuthStore();
      store.user = createMockUser() as any;
      expect(store.isAuth).toBe(true);
    });

    it("currentUser должен возвращать текущего пользователя", () => {
      const store = useAuthStore();
      const user = createMockUser();
      store.user = user as any;
      expect(store.currentUser).toEqual(user);
    });

    it("currentUser должен возвращать null если user не установлен", () => {
      const store = useAuthStore();
      expect(store.currentUser).toBeNull();
    });

    it("isLoading должен отражать состояние загрузки", () => {
      const store = useAuthStore();
      expect(store.isLoading).toBe(false);
      store.loading = true;
      expect(store.isLoading).toBe(true);
    });

    it("authError должен возвращать ошибку", () => {
      const store = useAuthStore();
      store.error = "Some error";
      expect(store.authError).toBe("Some error");
    });

    it("authError должен возвращать null если ошибок нет", () => {
      const store = useAuthStore();
      expect(store.authError).toBeNull();
    });
  });
});
