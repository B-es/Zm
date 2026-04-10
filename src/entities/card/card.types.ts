export type CardSection = "watch" | "go" | "do";

export interface Card {
  id: string;
  roomId: string;
  section: CardSection;

  title: string;
  description: string;
  marked: boolean;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}
