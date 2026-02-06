// server/types.ts
export interface ClientEvent {
  type: string
  payload: any
}

export interface ClientMeta {
  userId: string
  roomId: string
}

// server/types.ts
export interface PresenceUser {
  userId: string
}

export type ServerEvent =
  | {
      type: 'PRESENCE_STATE'
      payload: PresenceUser[]
    }
  | {
      type: 'USER_JOINED'
      payload: PresenceUser
    }
  | {
      type: 'USER_LEFT'
      payload: PresenceUser
    }
  | {
      type: string
      payload: any
    }
