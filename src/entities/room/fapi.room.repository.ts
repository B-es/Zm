import type { Room } from "./room.types";
import type { IRoomRepository } from "./room.repository.interface";

// Интерфейсы ответов от API (на основе OpenAPI спецификации)
interface ApiRoomResponse {
  id: string;
  name: string;
  created_by: number;
  created_at?: string; // может присутствовать, но в спецификации не указано
}

interface ApiVisitResponse {
  success: boolean;
}

interface ApiExistsResponse {
  exists: boolean; // предположительно
}

// Маппинг snake_case API -> camelCase Room
function mapApiRoomToRoom(
  apiRoom: ApiRoomResponse,
  knownPassword: string = "",
): Room {
  return {
    id: apiRoom.id,
    title: apiRoom.name,
    password: knownPassword,
    createdBy: apiRoom.created_by,
    createdAt: apiRoom.created_at ?? new Date().toISOString(), // fallback
  };
}

export class FapiRoomRepository implements IRoomRepository {
  private baseUrl: string;
  private getAccessToken: () => Promise<string | null>;

  /**
   * @param baseUrl Базовый URL API (например, 'http://localhost:8000')
   * @param getAccessToken Функция, возвращающая текущий access token (или null)
   */
  constructor(baseUrl: string, getAccessToken: () => Promise<string | null>) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // убираем trailing slash
    this.getAccessToken = getAccessToken;
  }

  // Вспомогательный метод для авторизованных запросов
  private async authFetch(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const token = await this.getAccessToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };
    return fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
  }

  async isRoomExists(roomName: string): Promise<boolean> {
    const response = await fetch(
      `${this.baseUrl}/rooms/exists?room_name=${encodeURIComponent(roomName)}`,
    );
    if (!response.ok) {
      // В случае ошибки считаем, что комната не существует (или пробрасываем исключение)
      throw new Error(`Failed to check room existence: ${response.statusText}`);
    }
    const data: ApiExistsResponse = await response.json();
    return data.exists === true;
  }

  async getRoom(roomName: string, password: string): Promise<Room | null> {
    const response = await fetch(`${this.baseUrl}/rooms/get`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_name: roomName, password }),
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Failed to get room: ${response.statusText}`);
    }
    const data: ApiRoomResponse | null = await response.json();
    if (!data) return null;
    return mapApiRoomToRoom(data, password);
  }

  async createRoom(roomName: string, password: string): Promise<Room | null> {
    const response = await this.authFetch("/rooms/", {
      method: "POST",
      body: JSON.stringify({ name: roomName, password }),
    });
    if (!response.ok) {
      // Возможно, комната уже существует или ошибка авторизации
      throw new Error(`Failed to create room: ${response.statusText}`);
    }
    const data: ApiRoomResponse = await response.json();
    // createdBy игнорируем, т.к. сервер сам назначает создателя из текущего пользователя
    return mapApiRoomToRoom(data, password);
  }

  async joinRoom(roomName: string, password: string): Promise<Room | null> {
    const response = await fetch(`${this.baseUrl}/rooms/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_name: roomName, password }),
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Failed to join room: ${response.statusText}`);
    }
    const data: ApiRoomResponse | null = await response.json();
    if (!data) return null;
    return mapApiRoomToRoom(data, password);
  }

  async getAllRooms(): Promise<Room[]> {
    const response = await fetch(`${this.baseUrl}/rooms/`);
    if (!response.ok) {
      throw new Error(`Failed to get all rooms: ${response.statusText}`);
    }
    const data: ApiRoomResponse[] = await response.json();
    return data.map((room) => mapApiRoomToRoom(room, "")); // пароль неизвестен
  }

  async getRoomsByUser(): Promise<Room[]> {
    // Эндпоинт /rooms/my возвращает комнаты текущего пользователя.
    // Параметр userId игнорируется, так как сервер определяет пользователя по токену.
    const response = await this.authFetch("/rooms/my");
    if (!response.ok) {
      throw new Error(`Failed to get user rooms: ${response.statusText}`);
    }
    const data: ApiRoomResponse[] = await response.json();
    return data.map((room) => mapApiRoomToRoom(room, ""));
  }

  async deleteRoom(roomId: string): Promise<boolean> {
    const response = await this.authFetch(
      `/rooms/${encodeURIComponent(roomId)}`,
      {
        method: "DELETE",
      },
    );
    if (response.status === 204) return true;
    if (response.status === 404) return false;
    throw new Error(`Failed to delete room: ${response.statusText}`);
  }

  async trackRoomVisit(roomId: string): Promise<boolean> {
    // Параметр userId не используется, сервер определяет пользователя по токену.
    const response = await this.authFetch(
      `/rooms/${encodeURIComponent(roomId)}/visit`,
      {
        method: "POST",
      },
    );
    if (!response.ok) {
      throw new Error(`Failed to track visit: ${response.statusText}`);
    }
    const data: ApiVisitResponse = await response.json();
    return data.success === true;
  }

  async getVisitedRooms(): Promise<Room[]> {
    // Параметр userId не используется.
    const response = await this.authFetch("/rooms/visited");
    if (!response.ok) {
      throw new Error(`Failed to get visited rooms: ${response.statusText}`);
    }
    const data: ApiRoomResponse[] = await response.json();
    return data.map((room) => mapApiRoomToRoom(room, ""));
  }
}
