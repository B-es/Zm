import type { IAuthRepository } from "./auth.repository.interface";

async function signUp({
  baseUrl,
  payload,
}: {
  baseUrl: string;
  payload: {
    nickname: string;
    password: string;
  };
}): Promise<void> {
  const url = baseUrl + "/users/register";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail);
}

async function signIn({
  baseUrl,
  payload,
}: {
  baseUrl: string;
  payload: {
    nickname: string;
    password: string;
  };
}): Promise<void> {
  const url = baseUrl + "/users/login";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail);
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
}

async function signOut(baseUrl: string): Promise<string> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) throw new Error("No refresh token found.");

  const url = `${baseUrl}/users/logout?refresh_token=${encodeURIComponent(refreshToken)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail);
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  return data;
}

export class FapiAuthRepository implements IAuthRepository {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async signUp(nickname: string, password: string): Promise<void> {
    await signUp({ baseUrl: this.baseUrl, payload: { nickname, password } });
  }
  async signIn(nickname: string, password: string): Promise<void> {
    await signIn({ baseUrl: this.baseUrl, payload: { nickname, password } });
  }
  async signOut(): Promise<void> {
    const response = await signOut(this.baseUrl);
    console.log(response);
    if (!response) {
      throw new Error("Sign out failed.");
    }
  }
  async loadSession(): Promise<{ id: number; nickname: string }> {
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (!accessToken || !refreshToken) {
      return { id: -1, nickname: "" }; // нет токенов, сессия не восстановлена
    }

    try {
      // Пытаемся получить текущего пользователя через /me
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const userData: { id: string; nickname: string } =
          await response.json();

        return { id: Number(userData.id), nickname: userData.nickname };
      } else if (response.status === 401) {
        // Попробуем обновить access_token через refresh_token
        const refreshResp = await fetch(`${this.baseUrl}/users/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResp.ok) {
          const { access_token: newAccessToken } = await refreshResp.json();
          localStorage.setItem("access_token", newAccessToken);
          // Повторно запрашиваем /me с новым токеном
          const meResp = await fetch(`${this.baseUrl}/users/me`, {
            headers: { Authorization: `Bearer ${newAccessToken}` },
          });
          if (meResp.ok) {
            const userData = await meResp.json();
            return { id: userData.id, nickname: userData.nickname };
          }
        }
        // Если рефреш не удался, чистим токены
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
    } catch (error) {
      console.error("Session loading failed", error);
      // чистим токены
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
    return { id: -1, nickname: "" };
  }
}
