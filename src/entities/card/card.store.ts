// src/entities/card/card.store.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Card } from './card.types'

export const useCardStore = defineStore('card', () => {
  // ===== state =====
  const cards = ref<Card[]>([])

  // ===== getters =====
  const getCardById = (id: string) => cards.value.find(c => c.id === id)

  // ===== actions =====
  const setCards = (newCards: Card[]) => {
    cards.value = [...newCards]
  }

  const addOrUpdateCard = (card: Card) => {
    const idx = cards.value.findIndex(c => c.id === card.id)
    if (idx !== -1) {
      // update
      cards.value[idx] = card
    } else {
      // add
      cards.value.push(card)
    }
  }

  const removeCard = (cardId: string) => {
    cards.value = cards.value.filter(c => c.id !== cardId)
  }

  // ===== realtime event handler =====
  const applyRealtime = (event: { type: string; payload: any }) => {
    switch (event.type) {
      case 'CARD_UPDATE':
        addOrUpdateCard(event.payload)
        break

      case 'CARD_DELETE':
        removeCard(event.payload.id)
        break
    }
  }

  return {
    // state
    cards,

    // getters
    getCardById,

    // actions
    setCards,
    addOrUpdateCard,
    removeCard,
    applyRealtime
  }
})
