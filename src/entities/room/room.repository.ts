import { supabase } from "@/supabase";
import type { Room } from "./room.types";

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

export function useRoomRepository() {
  /**
   * Проверить существование комнаты по названию
   */
  async function isRoomExists(roomName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("id")
        .eq("title", roomName)
        .maybeSingle();

      if (error) throw error;

      return !!data;
    } catch (error) {
      console.error("Error checking room existence:", error);
      return false;
    }
  }

  /**
   * Получить комнату по названию и паролю
   */
  async function getRoom(
    roomName: string,
    password: string,
  ): Promise<Room | null> {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("title", roomName)
        .eq("password", password)
        .maybeSingle();

      if (error) throw error;

      return data ? mapRawRoom(data) : null;
    } catch (error) {
      console.error("Error fetching room:", error);
      return null;
    }
  }

  /**
   * Создать новую комнату
   */
  async function createRoom(
    roomName: string,
    password: string,
    createdBy: string,
  ): Promise<{
    success: boolean;
    room?: Room;
    error?: string;
  }> {
    try {
      const exists = await isRoomExists(roomName);
      if (exists) {
        return {
          success: false,
          error: "Комната с таким названием уже существует",
        };
      }

      const { data, error } = await supabase
        .from("rooms")
        .insert([
          {
            title: roomName,
            password,
            created_by: createdBy,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        room: mapRawRoom(data as Record<string, unknown>),
      };
    } catch (error) {
      console.error("Error creating room:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Ошибка создания комнаты",
      };
    }
  }

  /**
   * Войти в комнату (получить и проверить)
   */
  async function joinRoom(
    roomName: string,
    password: string,
  ): Promise<{
    success: boolean;
    room?: Room;
    error?: string;
  }> {
    try {
      const room = await getRoom(roomName, password);

      if (!room) {
        return {
          success: false,
          error: "Комната не найдена или неверный пароль",
        };
      }

      return { success: true, room };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Получить список всех комнат (с пагинацией)
   */
  async function getAllRooms(limit = 10, offset = 0): Promise<Room[]> {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return (data as Record<string, unknown>[]).map(mapRawRoom) || [];
    } catch (error) {
      console.error("Error fetching rooms:", error);
      return [];
    }
  }

  /**
   * Получить комнаты, созданные пользователем
   */
  async function getRoomsByUser(userId: string): Promise<Room[]> {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("created_by", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data as Record<string, unknown>[]).map(mapRawRoom) || [];
    } catch (error) {
      console.error("Error fetching user rooms:", error);
      return [];
    }
  }

  /**
   * Удалить комнату
   */
  async function deleteRoom(roomId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("rooms").delete().eq("id", roomId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error("Error deleting room:", error);
      return false;
    }
  }

  /**
   * Отслеживать посещение комнаты (записать в историю)
   */
  async function trackRoomVisit(userId: string, roomId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("room_visits")
        .upsert(
          {
            user_id: userId,
            room_id: roomId,
            visited_at: new Date().toISOString(),
          },
          { onConflict: "user_id,room_id" }
        );

      if (error) throw error;

      return true;
    } catch (error) {
      console.error("Error tracking room visit:", error);
      return false;
    }
  }

  /**
   * Получить историю посещений пользователя (комнаты, которые он посещал)
   */
  async function getVisitedRooms(userId: string): Promise<Room[]> {
    try {
      const { data, error } = await supabase
        .from("room_visits")
        .select(
          `
          rooms (
            id,
            title,
            password,
            created_by,
            created_at
          )
          `
        )
        .eq("user_id", userId)
        .order("visited_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!data) return [];

      // Extract rooms from the join result and deduplicate
      const roomMap = new Map<string, Room>();
      for (const visit of data) {
        const roomRaw = (visit as any).rooms;
        if (roomRaw && !roomMap.has(roomRaw.id)) {
          roomMap.set(roomRaw.id, mapRawRoom(roomRaw));
        }
      }

      return Array.from(roomMap.values());
    } catch (error) {
      console.error("Error fetching visited rooms:", error);
      return [];
    }
  }

  return {
    isRoomExists,
    getRoom,
    createRoom,
    joinRoom,
    getAllRooms,
    getRoomsByUser,
    deleteRoom,
    trackRoomVisit,
    getVisitedRooms,
  };
}
