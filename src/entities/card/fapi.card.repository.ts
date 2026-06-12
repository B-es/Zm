import type { User } from "../user/user.types";
import type { Card, CardSection } from "./card.types";
import type { ICardsRepository } from "./card.repository.interface";

// Интерфейсы ответов API (предполагаемые)
interface ApiCardResponse {
  id: string;
  room_id: string;
  section: CardSection;
  title: string;
  description: string;
  marked: boolean;
  banner_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

interface ApiUserResponse {
  id: string;
  nickname: string;
}

// Маппинг snake_case API -> camelCase Card
function mapApiCardToCard(apiCard: ApiCardResponse): Card {
  return {
    id: apiCard.id,
    roomId: apiCard.room_id,
    section: apiCard.section,
    title: apiCard.title,
    description: apiCard.description,
    marked: apiCard.marked,
    bannerUrl: apiCard.banner_url,
    createdBy: apiCard.created_by,
    createdAt: apiCard.created_at,
    updatedAt: apiCard.updated_at,
    updatedBy: apiCard.updated_by,
  };
}

export class FapiCardRepository implements ICardsRepository {
  private baseUrl: string;
  private getAccessToken: () => Promise<string | null>;

  constructor(baseUrl: string, getAccessToken: () => Promise<string | null>) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.getAccessToken = getAccessToken;
  }

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

  async fetchCardsByRoom(roomId: string): Promise<Card[]> {
    const response = await this.authFetch(
      `/cards/room/${encodeURIComponent(roomId)}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch cards: ${response.statusText}`);
    }
    const data: ApiCardResponse[] = await response.json();
    return data.map(mapApiCardToCard);
  }

  async saveCard(
    card: Omit<
      Card,
      "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
    >,
  ): Promise<Card> {
    // Подготавливаем тело запроса в snake_case
    const payload = {
      room_id: card.roomId,
      section: card.section,
      title: card.title,
      description: card.description,
      marked: card.marked,
      banner_url: card.bannerUrl,
    };
    const response = await this.authFetch("/cards/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to save card: ${response.statusText}`);
    }
    const data: ApiCardResponse = await response.json();
    return mapApiCardToCard(data);
  }

  async deleteCardById(cardId: string): Promise<void> {
    const response = await this.authFetch(
      `/cards/${encodeURIComponent(cardId)}`,
      {
        method: "DELETE",
      },
    );
    if (response.status === 204) return;
    if (response.status === 404) throw new Error("Card not found");
    throw new Error(`Failed to delete card: ${response.statusText}`);
  }

  async updateCardBanner(cardId: string, url: string): Promise<void> {
    const response = await this.authFetch(
      `/cards/${encodeURIComponent(cardId)}/banner`,
      {
        method: "PATCH",
        body: JSON.stringify({ url }),
      },
    );
    if (!response.ok) {
      throw new Error(`Failed to update banner: ${response.statusText}`);
    }
  }

  async getCardEditor(cardId: string): Promise<User> {
    const response = await this.authFetch(
      `/cards/${encodeURIComponent(cardId)}/editor`,
    );
    if (!response.ok) {
      throw new Error(`Failed to get card editor: ${response.statusText}`);
    }
    const data: ApiUserResponse = await response.json();
    return {
      id: data.id,
      nickname: data.nickname,
      // Если в User есть другие поля (role, is_active), добавьте их по аналогии
    } as User;
  }
}
