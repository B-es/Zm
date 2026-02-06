// server/rooms.ts
import { WebSocket } from 'ws'

export type Client = {
  socket: WebSocket
  userId: string
}

const rooms = new Map<string, Set<Client>>()

export function joinRoom(roomId: string, client: Client) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set())
  }
  rooms.get(roomId)!.add(client)
}

export function leaveRoom(roomId: string, client: Client) {
  rooms.get(roomId)?.delete(client)
}

export function getPresence(roomId: string) {
  return Array.from(rooms.get(roomId) ?? []).map(c => ({
    userId: c.userId
  }))
}

export function broadcast(
  roomId: string,
  event: any,
  exclude?: Client
) {
  rooms.get(roomId)?.forEach(client => {
    if (client !== exclude && client.socket.readyState === 1) {
      client.socket.send(JSON.stringify(event))
    }
  })
}
