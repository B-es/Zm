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
