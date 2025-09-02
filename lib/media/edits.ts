// lib/media/edits.ts
import type { Database, Tables, TablesInsert } from '@/types/supabase'
import { createServerComponentClient } from '@/lib/supabase/server'

export type EditDocRow = Tables<'edit_docs'>
export type EditDocInsert = TablesInsert<'edit_docs'>

type Kind = 'photo' | 'video'

export async function getOrCreateEditDoc(session_id: string, item_id: string) {
  const supabase = createServerComponentClient<Database>()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')

  const { data: existing } = await supabase
    .from('edit_docs')
    .select('*')
    .eq('session_id', session_id)
    .eq('item_id', item_id)
    .eq('user_id', user.id)
    .maybeSingle<EditDocRow>()
  if (existing) return existing

  // TS-safe: keine nicht-existierenden Spalten referenzieren
  const { data: mediaRow } = await supabase
    .from('session_media')
    .select('*')
    .eq('session_id', session_id)
    .eq('id', item_id)
    .maybeSingle<any>()

  const kind: Kind =
    String(mediaRow?.mime_type ?? '').startsWith('video') ||
    String(mediaRow?.type ?? '').includes('video')
      ? 'video'
      : 'photo'

  const payload: EditDocInsert = {
    user_id: user.id,
    session_id,
    item_id,
    type: kind,
    doc: {} as any,
  }

  const { data: created, error } = await supabase
    .from('edit_docs')
    .insert(payload as any)
    .select('*')
    .single<EditDocRow>()
  if (error) throw error
  return created
}
