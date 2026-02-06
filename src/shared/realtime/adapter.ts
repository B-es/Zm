import type { RealtimeEvent } from './types'

export interface RealtimeAdapter {
  subscribe(
    roomId: string,
    userId: string,
    cb: (event: RealtimeEvent) => void
  ): () => void

  send(roomId: string, event: RealtimeEvent): void
}
