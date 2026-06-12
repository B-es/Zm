import type { IAuthRepository } from "./auth.repository.interface";

const BASE_URL = "http://127.0.0.1:8000";

async function signUp(payload: {
  nickname: string;
  password: string;
}): Promise<void> {
  const url = BASE_URL + "/users/register";
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

async function signIn(payload: {
  nickname: string;
  password: string;
}): Promise<void> {
  const url = BASE_URL + "/users/login";
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

async function signOut(): Promise<string> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) throw new Error("No refresh token found.");

  const url = `${BASE_URL}/users/logout?refresh_token=${encodeURIComponent(refreshToken)}`;
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
  async signUp(nickname: string, password: string): Promise<void> {
    await signUp({ nickname, password });
  }
  async signIn(nickname: string, password: string): Promise<void> {
    await signIn({ nickname, password });
  }
  async signOut(): Promise<void> {
    const response = await signOut();
    console.log(response);
    if (!response) {
      throw new Error("Sign out failed.");
    }
  }
  async loadSession(): Promise<{ id: string; nickname: string }> {
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (!accessToken || !refreshToken) {
      return { id: "", nickname: "" }; // нет токенов, сессия не восстановлена
    }

    try {
      // Пытаемся получить текущего пользователя через /me
      const response = await fetch(`${BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const userData: { id: string; nickname: string } =
          await response.json();

        return { id: userData.id, nickname: userData.nickname };
      } else if (response.status === 401) {
        // Попробуем обновить access_token через refresh_token
        const refreshResp = await fetch(`${BASE_URL}/users/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResp.ok) {
          const { access_token: newAccessToken } = await refreshResp.json();
          localStorage.setItem("access_token", newAccessToken);
          // Повторно запрашиваем /me с новым токеном
          const meResp = await fetch(`${BASE_URL}/users/me`, {
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
    return { id: "", nickname: "" };
  }
}
