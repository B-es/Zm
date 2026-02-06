import { subscribe, broadcast } from './mock-realtime'
import type { RealtimeAdapter } from './adapter'

export const mockRealtimeAdapter: RealtimeAdapter = {
  subscribe(roomId, userId, cb) {
    return subscribe(roomId, userId, cb)
  },

  send(roomId, event) {
    broadcast(roomId, event)
  }
}
