import type { User } from "../user/user.types";
import type { Card, CardSection } from "./card.types";

export interface ICardsRepository {
  fetchCardsByRoom(roomId: string): Promise<Card[]>;
  saveCard(card: Card): Promise<Card>;
  deleteCardById(cardId: string): Promise<void>;
  updateCardBanner(cardId: string, url: string): Promise<void>;
  getCardEditor(cardId: string): Promise<User>;
}
