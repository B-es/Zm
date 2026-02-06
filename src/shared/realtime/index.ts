import { isMock } from '@/shared/config'
import { mockRealtimeAdapter } from './mock.adapter'
import { supabaseRealtimeAdapter } from './supabase.adapter'
import type { RealtimeAdapter } from './adapter'

export const realtimeAdapter: RealtimeAdapter =
  isMock ? mockRealtimeAdapter : supabaseRealtimeAdapter
