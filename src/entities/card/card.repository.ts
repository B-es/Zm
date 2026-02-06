import type { Card } from './card.types'
import { realtimeAdapter } from '@/shared/realtime'

export function useCardRepository() {
  // === локальная "база" карточек в mock ===
  const db = new Map<string, Card[]>()

  // === fetchAll: возвращаем snapshot из "базы" ===
  const fetchAll = async (roomId: string): Promise<Card[]> => {
    if (!db.has(roomId)) {
      db.set(roomId, [])
    }
    // клонируем, чтобы не мутировать напрямую
    return structuredClone(db.get(roomId)!)
  }

  // === update: обновляем базу и рассылаем событие ===
  const update = (card: Card) => {
    const roomCards = db.get(card.roomId) || []
    const idx = roomCards.findIndex(c => c.id === card.id)

    if (idx !== -1) {
      roomCards[idx] = card
    } else {
      roomCards.push(card)
    }

    db.set(card.roomId, roomCards)

    // рассылаем всем подписчикам через mock-realtime
    realtimeAdapter.send(card.roomId, {
      type: 'CARD_UPDATE',
      payload: card
    })
  }

  // === subscribe: подписка на изменения ===
  const subscribe = (
    roomId: string,
    userId: string,
    cb: (event: any) => void
  ) => {
    return realtimeAdapter.subscribe(roomId, userId, cb)
  }

  return {
    fetchAll,
    update,
    subscribe
  }
}
