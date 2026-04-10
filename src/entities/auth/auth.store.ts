import { defineStore } from "pinia";
import type { User } from "../user/user.types";
import { supabase } from "@/supabase";
import type { Session } from "@supabase/supabase-js";
import { upsertUser } from "@/entities/user/user.repository";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

function mapSessionToUser(session: Session): User {
  const meta = session.user.user_metadata || {};
  // Поставщики OAuth2 отдают разные поля:
  // Google: full_name / name
  // GitHub: name
  // Discord: global_name / username
  const nickname =
    meta.nickname ||
    meta.global_name ||
    meta.username ||
    meta.full_name ||
    meta.name ||
    session.user.email ||
    "";

  return {
    id: session.user.id,
    nickname,
    avatarUrl: meta.avatar_url || meta.picture || meta.avatar,
  };
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    loading: false,
    error: null,
  }),

  actions: {
    async signUp(email: string, password: string, nickname: string) {
      this.loading = true;
      this.error = null;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: nickname,
          },
        },
      });

      this.loading = false;

      if (error) {
        this.error = error.message;
        return { success: false, error: error.message };
      }

      if (data.session) {
        this.user = mapSessionToUser(data.session);
      } else if (data.user) {
        // Email не подтверждён — сессии нет, но пользователь создан
        this.user = {
          id: data.user.id,
          nickname: data.user.user_metadata?.nickname || email,
          avatarUrl: data.user.user_metadata?.avatar_url,
        };
      }

      return { success: true };
    },

    async signIn(email: string, password: string) {
      this.loading = true;
      this.error = null;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      this.loading = false;

      if (error) {
        this.error = error.message;
        return { success: false, error: error.message };
      }

      if (data.session) {
        this.user = mapSessionToUser(data.session);
      } else if (data.user) {
        // Fallback если сессия не пришла
        this.user = {
          id: data.user.id,
          nickname: data.user.user_metadata?.nickname || "",
          avatarUrl: data.user.user_metadata?.avatar_url,
        };
      }

      return { success: true };
    },

    async signInWithOAuth(provider: "google" | "github" | "discord") {
      this.loading = true;
      this.error = null;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      this.loading = false;

      if (error) {
        this.error = error.message;
        return { success: false, error: error.message };
      }

      // signInWithOAuth редиректит, но на случай если нет — загрузим сессию
      await this.loadSession();
      return { success: true };
    },

    async signOut() {
      const { error } = await supabase.auth.signOut();
      this.user = null;

      if (error) {
        this.error = error.message;
        return { success: false, error: error.message };
      }

      return { success: true };
    },

    async loadSession() {
      // Проверяем, есть ли в URL код авторизации (после OAuth редиректа)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      console.log("[Auth Store] loadSession called, code =", code);

      // Если есть код авторизации, обмениваем его на сессию
      if (code) {
        console.log(
          "[Auth Store] OAuth callback detected, exchanging code for session...",
        );
        try {
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[Auth Store] exchangeCodeForSession error:", error);
            this.error = error.message;
            this.user = null;
            return;
          }
          if (data.session) {
            console.log(
              "[Auth Store] Session exchanged successfully:",
              data.session.user.email,
            );
            this.user = mapSessionToUser(data.session);
            upsertUser(
              this.user.id,
              this.user.nickname,
              this.user.avatarUrl || "",
            );
            console.log("[Auth Store] User set, isAuth =", this.isAuth);
            return;
          }
        } catch (err) {
          // Если exchangeCodeForSession не доступен или ошибка, пробуем getSession
          console.error(
            "[Auth Store] exchangeCodeForSession failed, falling back to getSession:",
            err,
          );
        }
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("[Auth Store] getSession error:", error);
      }

      if (session?.user) {
        console.log("[Auth Store] Session loaded:", session.user.email);
        this.user = mapSessionToUser(session);
        // Upsert profile on session load (fire and forget)
        upsertUser(this.user.id, this.user.nickname, this.user.avatarUrl || "");
        console.log("[Auth Store] User set, isAuth =", this.isAuth);
      } else {
        console.log("[Auth Store] No session found");
        this.user = null;
      }
    },

    initAuthListener() {
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          this.user = mapSessionToUser(session);
          // Upsert profile on auth state change (fire and forget)
          upsertUser(
            this.user.id,
            this.user.nickname,
            this.user.avatarUrl || "",
          );
        } else {
          this.user = null;
        }
      });
    },
    async updateAvatar(avatarUrl: string) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
      });
      if (updateError) throw updateError;

      if (this.user) {
        this.user.avatarUrl = avatarUrl;
      }
    },
  },

  getters: {
    isAuth: (state) => state.user !== null,
    currentUser: (state) => state.user,
    isLoading: (state) => state.loading,
    authError: (state) => state.error,
  },
});
