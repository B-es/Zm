export type RealtimeEvent<T = any> = {
  type: string
  payload: T
}

export type PresenceUser = {
  userId: string
}