import { defineStore } from "pinia";
import type { User } from "../user/user.types";
import { supabase } from "@/supabase";
import type { Session } from "@supabase/supabase-js";

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
            nickname,
          },
        },
      });

      this.loading = false;

      if (error) {
        this.error = error.message;
        return { success: false, error: error.message };
      }

      if (data.user) {
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

      if (data.user) {
        this.user = {
          id: data.user.id,
          nickname: data.user.user_metadata?.nickname || email,
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
          redirectTo: `${window.location.origin}/`,
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
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        this.user = mapSessionToUser(session);
      } else {
        this.user = null;
      }
    },

    initAuthListener() {
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          this.user = mapSessionToUser(session);
        } else {
          this.user = null;
        }
      });
    },
  },

  getters: {
    isAuth: (state) => state.user !== null,
    currentUser: (state) => state.user,
    isLoading: (state) => state.loading,
    authError: (state) => state.error,
  },
});
