// lib/supabase/actions/session.ts
'use server'

import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type SessionId     = Database['public']['Tables']['creator_sessions']['Row']['id']
type SessionInsert = Database['public']['Tables']['creator_sessions']['Insert']

export async function createDraftSession(): Promise<{ sessionId: SessionId }> {
  const supabase = createServerComponentClient()

  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) throw new Error('Nicht authentifiziert')

  // 👇 Insert-Payload: alle potentiell geforderten Felder mit sinnvollen Defaults.
  // Mit den "as SessionInsert['...']" erzwingen wir saubere Enum-/Typzuweisungen.
  const payload: SessionInsert = {
    user_id: user.id,
    title: 'Neue Session',
    status: 'draft'   as SessionInsert['status'],
    visibility: 'private' as SessionInsert['visibility'],

    // häufige Pflichtfelder in vielen Schemas:
    role: 'creator'   as SessionInsert['role'],      // ggf. 'owner'/'author' – je nach Enum
    shared_with: []   as SessionInsert['shared_with'],

    // optionale Felder sicher auf null setzen (stört nicht, macht Typen happy)
    content: null as SessionInsert['content'],
    insights: null as SessionInsert['insights'],
    published_at: null as SessionInsert['published_at'],
    rating: null as SessionInsert['rating'],
  }

  const { data, error } = await supabase
    .from('creator_sessions')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw error
  return { sessionId: data.id as SessionId }
}
