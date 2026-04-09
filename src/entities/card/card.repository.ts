import { supabase } from '@/supabase';
import type { Card, CardSection } from './card.types';

const TABLE = 'cards';

export async function fetchCardsByRoom(roomId: string): Promise<Card[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapDbToCard);
}

export async function saveCard(card: Card): Promise<Card> {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(mapCardToDb(card))
    .select()
    .single();

  if (error) throw error;
  return mapDbToCard(data);
}

export async function deleteCardById(cardId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', cardId);

  if (error) throw error;
}

export function subscribeToRoomCards(
  roomId: string,
  callback: (event: { type: string; payload: any }) => void,
) {
  return supabase
    .channel(`cards:${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE, filter: `room_id=eq.${roomId}` },
      (payload) => {
        const eventType = payload.eventType;
        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          callback({ type: 'CARD_UPDATE', payload: mapDbToCard(payload.new) });
        } else if (eventType === 'DELETE') {
          callback({ type: 'CARD_DELETE', payload: { id: payload.old.id } });
        }
      },
    )
    .subscribe();
}

// ===== Маппинг между DB колонками и типом Card =====

function mapDbToCard(dbRow: Record<string, any>): Card {
  return {
    id: dbRow.id,
    roomId: dbRow.room_id,
    section: dbRow.section as CardSection,
    title: dbRow.title,
    description: dbRow.description || '',
    createdBy: dbRow.created_by,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
    updatedBy: dbRow.updated_by,
  };
}

function mapCardToDb(card: Card): Record<string, any> {
  return {
    id: card.id,
    room_id: card.roomId,
    section: card.section,
    title: card.title,
    description: card.description,
    created_by: card.createdBy,
    created_at: card.createdAt,
    updated_at: card.updatedAt,
    updated_by: card.updatedBy,
  };
}
