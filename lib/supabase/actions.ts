'use server'

import { createServerComponentClient } from '@/lib/supabase/server'
import { generateStoryInsights } from '@/lib/openai/generateStoryInsights'
import type { Database } from '@/types/supabase'

type SessionId         = Database['public']['Tables']['creator_sessions']['Row']['id']
type SessionStatus     = Database['public']['Tables']['creator_sessions']['Row']['status']
type SessionVisibility = Database['public']['Tables']['creator_sessions']['Row']['visibility']

export async function updateSessionStatus(sessionId: SessionId, status: SessionStatus) {
  const supabase = createServerComponentClient()
  const { error } = await supabase.from('creator_sessions').update({ status }).eq('id', sessionId)
  if (error) throw new Error(error.message)
}

export async function rateSession(sessionId: SessionId, story: string) {
  const supabase = createServerComponentClient()
  const { rating, insights } = await generateStoryInsights(story)
  const { error } = await supabase
    .from('creator_sessions')
    .update({ rating, insights })
    .eq('id', sessionId)
  if (error) throw new Error(error.message)
  return { rating, insights }
}

/**
 * Impression-Zähler. Falls die RPC nicht existiert, zählen wir als Fallback eine View.
 */
export async function incrementSessionImpression(sessionId: SessionId) {
  const supabase = createServerComponentClient()
  try {
    await supabase.rpc('increment_impression', { session_id: sessionId })
  } catch {
    try {
      await supabase.rpc('increment_view', { session_id: sessionId })
    } catch {
      /* noop */
    }
  }
}

/**
 * View-Zähler mit einheitlichem Param-Namen `session_id`.
 */
export async function incrementSessionView(sessionId: SessionId) {
  const supabase = createServerComponentClient()
  try {
    await supabase.rpc('increment_view', { session_id: sessionId })
  } catch {
    /* noop */
  }
}

export async function updateSessionVisibility(sessionId: SessionId, visibility: SessionVisibility) {
  const supabase = createServerComponentClient()
  const { error } = await supabase.from('creator_sessions').update({ visibility }).eq('id', sessionId)
  if (error) throw new Error(error.message)
}
