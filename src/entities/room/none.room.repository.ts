import type { Room } from "./room.types";
import type { IRoomRepository } from "./room.repository.interface";

/**
 * Маппим snake_case из Supabase в camelCase в Room
 */
function mapRawRoom(raw: Record<string, unknown>): Room {
  return {
    id: raw.id as string,
    title: raw.title as string,
    password: raw.password as string,
    createdBy: (raw.created_by ?? "") as string,
    createdAt: (raw.created_at ?? "") as string,
  };
}

export class NoneRoomRepository implements IRoomRepository {
  isRoomExists(roomName: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  getRoom(roomName: string, password: string): Promise<Room | null> {
    throw new Error("Method not implemented.");
  }
  async createRoom(roomName: string, password: string): Promise<Room | null> {
    const room = {
      password,
      title: roomName,
      createdAt: new Date().toTimeString(),
    } as Room;
    console.log("Типо создал комнату", room);
    return room;
  }
  async joinRoom(roomName: string, password: string): Promise<Room | null> {
    const room = {
      password,
      title: roomName,
      createdBy: "me",
      createdAt: new Date().toTimeString(),
    } as Room;
    console.log("Типо вошёл комнату", room);
    return room;
  }
  getAllRooms(): Promise<Room[]> {
    throw new Error("Method not implemented.");
  }
  async getRoomsByUser(): Promise<Room[]> {
    const rooms: Room[] = [
      {
        createdAt: "131",
        createdBy: userId,
        id: "2",
        title: "title",
        password: "1",
      },
    ];
    console.log("Комнаты", rooms);
    return rooms;
  }
  deleteRoom(roomId: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  async trackRoomVisit(roomId: string): Promise<boolean> {
    console.log("Track", roomId);
    return true;
  }
  async getVisitedRooms(): Promise<Room[]> {
    const rooms: Room[] = [
      {
        createdAt: "131",
        id: "1",
        title: "title",
        password: "1",
      },
    ];
    console.log("Комнаты", rooms);
    return rooms;
  }
}
