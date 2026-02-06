import type {
  RealtimeEvent,
  PresenceUser
} from './types'

type Subscriber = (event: RealtimeEvent) => void

type RoomState = {
  subscribers: Set<Subscriber>
  presence: Map<string, PresenceUser>
}

const rooms = new Map<string, RoomState>()

function getRoom(roomId: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      subscribers: new Set(),
      presence: new Map()
    })
  }
  return rooms.get(roomId)!
}

export function subscribe(
  roomId: string,
  userId: string,
  cb: (event: RealtimeEvent) => void
) {
  const room = getRoom(roomId)

  // 1. presence join
  room.presence.set(userId, { userId })

  // 2. snapshot новому подписчику
  cb({
    type: 'PRESENCE_STATE',
    payload: Array.from(room.presence.values())
  })

  // 3. notify others
  room.subscribers.forEach(fn => {
    fn({
      type: 'USER_JOINED',
      payload: { userId }
    })
  })

  // 4. subscribe
  room.subscribers.add(cb)

  return () => {
    room.subscribers.delete(cb)
    room.presence.delete(userId)

    room.subscribers.forEach(fn => {
      fn({
        type: 'USER_LEFT',
        payload: { userId }
      })
    })
  }
}

export function broadcast(
  roomId: string,
  event: RealtimeEvent
) {
  const room = getRoom(roomId)

  room.subscribers.forEach(fn => {
    // имитация сети
    setTimeout(() => fn(event), Math.random() * 200)
  })
}
