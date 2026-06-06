import type { Room } from "./room.types";

export interface IRoomRepository {
  isRoomExists(roomName: string): Promise<boolean>;
  getRoom(roomName: string, password: string): Promise<Room | null>;
  createRoom(
    roomName: string,
    password: string,
    createdBy: string,
  ): Promise<Room | null>;
  joinRoom(roomName: string, password: string): Promise<Room | null>;

  getAllRooms(): Promise<Room[]>;

  getRoomsByUser(userId: string): Promise<Room[]>;

  deleteRoom(roomId: string): Promise<boolean>;

  trackRoomVisit(userId: string, roomId: string): Promise<boolean>;

  getVisitedRooms(userId: string): Promise<Room[]>;
}
