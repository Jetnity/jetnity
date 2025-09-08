// lib/supabase/actions/session.ts
'use server'

import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import type { PostgrestError } from '@supabase/supabase-js'

type Sessions = Database['public']['Tables']['creator_sessions']
type SessionId = Sessions['Row']['id']
type SessionInsert = Sessions['Insert']

export type CreateDraftSessionArgs = {
  /** Optional – schützt vor Doppel-Clicks (unique idempotency_key, wenn Spalte existiert) */
  idempotencyKey?: string
  /** Optional – Metadaten (jsonb), wenn Spalte existiert */
  tracking?: unknown
}

export async function createDraftSession(
  args?: CreateDraftSessionArgs
): Promise<{ sessionId: SessionId }> {
  const supabase = createServerComponentClient()

  // Auth
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()

  if (userErr || !user) {
    const err: any = new Error('Not authenticated')
    err.status = 401
    throw err
  }

  // 1) Idempotency: existierende Session anhand des Keys zurückgeben (wenn Spalte vorhanden)
  if (args?.idempotencyKey) {
    const { data: existing, error: existingErr } = await supabase
      .from('creator_sessions')
      .select('id')
      .eq('user_id', user.id)
      // falls Spalte in den Types (noch) fehlt, umgehen wir das streng typisiert:
      .eq('idempotency_key' as unknown as keyof Sessions['Row'], args.idempotencyKey as any)
      .maybeSingle()

    if (!isSchemaGap(existingErr)) {
      if (existing?.id) return { sessionId: existing.id as SessionId }
      if (existingErr) throw existingErr
    }
  }

  // 2) Insert-Payload – dein bestehendes Schema mit sinnvollen Defaults
  const payload: SessionInsert = {
    user_id: user.id,
    title: 'Neue Session',
    status: 'draft' as SessionInsert['status'],
    visibility: 'private' as SessionInsert['visibility'],

    // häufige Pflichtfelder
    role: 'creator' as SessionInsert['role'],
    shared_with: [] as SessionInsert['shared_with'],

    // optionale Felder
    content: null as SessionInsert['content'],
    insights: null as SessionInsert['insights'],
    published_at: null as SessionInsert['published_at'],
    rating: null as SessionInsert['rating'],
  }

  // weich anreichern – nur gesetzt, wenn Spalten existieren
  if (args?.idempotencyKey) (payload as any).idempotency_key = args.idempotencyKey
  if (args?.tracking !== undefined) (payload as any).tracking = args.tracking

  const { data, error } = await supabase
    .from('creator_sessions')
    .insert(payload as any)
    .select('id')
    .single()

  // 23505 = unique_violation (z. B. idempotency_key)
  if (error && (error as PostgrestError).code === '23505' && args?.idempotencyKey) {
    const { data: existing2, error: lookupErr } = await supabase
      .from('creator_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('idempotency_key' as unknown as keyof Sessions['Row'], args.idempotencyKey as any)
      .maybeSingle()
    if (!lookupErr && existing2?.id) {
      return { sessionId: existing2.id as SessionId }
    }
  }

  if (error) throw error
  return { sessionId: data!.id as SessionId }
}

/* ───────────── Helpers ───────────── */

/** true = Schema-Lücke (Tabelle/Spalte existiert (noch) nicht) – darf still ignoriert werden */
function isSchemaGap(e?: PostgrestError | null) {
  // 42P01: undefined_table, 42703: undefined_column
  return !!e && (e.code === '42P01' || e.code === '42703')
}
