// server/events.ts
import { broadcast } from './rooms'
import type { ClientEvent } from './types'

export function handleEvent(
  event: ClientEvent,
  roomId: string,
  sender
) {
  switch (event.type) {
    case 'CARD_UPDATE':
    case 'CARD_ADD':
    case 'CARD_DELETE':
      broadcast(roomId, event, sender)
      break

    default:
      console.warn('Unknown event:', event.type)
  }
}
