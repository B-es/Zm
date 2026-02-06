// src/shared/realtime/supabase.adapter.ts
//import { client } from '@/shared/supabase'
import type { RealtimeAdapter } from './adapter'

export const supabaseRealtimeAdapter: RealtimeAdapter = {
  subscribe(roomId, _userId, cb) {
    // const channel = client.channel(`room:${roomId}`)

    // channel
    //   .on(
    //     'postgres_changes',
    //     { event: '*', schema: 'public', table: 'cards' },
    //     payload => cb({
    //       type: 'CARD_UPDATE',
    //       payload: payload.new
    //     })
    //   )
    //   .subscribe()
    return () => {}
    // return () => {
    //   client.removeChannel(channel)
    // }
  },

  send(_roomId, _event) {
    // Supabase отправляет через DB → realtime
  }
}
