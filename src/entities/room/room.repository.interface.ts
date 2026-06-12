import type { Room } from "./room.types";

export interface IRoomRepository {
  isRoomExists(roomName: string): Promise<boolean>;
  getRoom(roomName: string, password: string): Promise<Room | null>;
  createRoom(roomName: string, password: string): Promise<Room | null>;
  joinRoom(roomName: string, password: string): Promise<Room | null>;

  getAllRooms(): Promise<Room[]>;

  getRoomsByUser(): Promise<Room[]>;

  deleteRoom(roomId: string): Promise<boolean>;

  trackRoomVisit(roomId: string): Promise<boolean>;

  getVisitedRooms(): Promise<Room[]>;
}
