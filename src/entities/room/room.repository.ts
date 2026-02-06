import type { Room } from './room.types'
import { realtimeAdapter } from '@/shared/realtime'

export function useRoomRepository() {
  // === локальная "база" комнат в mock ===
  const db = Array<Room>()

  const isExist = async (roomId: string): Promise<boolean> => {
    return db.find(r => r.id === roomId) !== undefined
  }

  const add = (room: Room) => {
    if(!isExist(room.id)) db.push(room)
  }


  return {
    isExist,
    update: add,
  }
}
