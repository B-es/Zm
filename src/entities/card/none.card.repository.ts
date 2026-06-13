import type { User } from "../user/user.types";
import type { ICardsRepository } from "./card.repository.interface";
import type { Card, CardSection } from "./card.types";

// ===== Маппинг между DB колонками и типом Card =====

function mapDbToCard(dbRow: Record<string, any>): Card {
  return {
    id: dbRow.id,
    roomId: dbRow.room_id,
    section: dbRow.section as CardSection,
    title: dbRow.title,
    description: dbRow.description || "",
    marked: dbRow.marked || false,
    bannerUrl: dbRow.banner_url || "",
    createdBy: dbRow.created_by,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
    updatedBy: dbRow.updated_by,
  };
}

function mapCardToDb(card: Card): Record<string, any> {
  return {
    id: card.id,
    room_id: card.roomId,
    section: card.section,
    title: card.title,
    description: card.description,
    marked: card.marked,
    banner_url: card.bannerUrl || "",
    created_by: card.createdBy,
    created_at: card.createdAt,
    updated_by: card.updatedBy,
    updated_at: card.updatedAt,
  };
}

export class NoneCardRepository implements ICardsRepository {
  async fetchCardsByRoom(roomId: string): Promise<Card[]> {
    return [
      {
        id: "1",
        roomId: "test",
        section: "do",

        title: "tit",
        description: "desc",
        marked: false,
        bannerUrl: "",

        createdBy: -1,
        createdAt: "31",
        updatedAt: "23",
        updatedBy: -1,
      },
    ];
  }
  async saveCard(card: Card): Promise<Card> {
    console.log("Was saved");
    return card;
  }
  deleteCardById(cardId: string): Promise<void> {
    throw new Error("Method not implemented2.");
  }
  async updateCardBanner(cardId: string, url: string): Promise<void> {
    return;
  }
  async getCardEditor(cardId: string): Promise<User> {
    return { id: 23, nickname: "Mick", password: "1", avatarUrl: "" } as User;
  }
}
