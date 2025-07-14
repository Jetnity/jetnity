'use server'

import { createServerComponentClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { generateStoryInsights } from '@/lib/openai/generateStoryInsights'
import type { Database } from '@/types/supabase'

type SessionId = Database['public']['Tables']['creator_sessions']['Row']['id']
type SessionStatus = Database['public']['Tables']['creator_sessions']['Row']['status']
type SessionVisibility = Database['public']['Tables']['creator_sessions']['Row']['visibility']

export async function updateSessionStatus(
  sessionId: SessionId,
  status: SessionStatus
) {
  const supabase = createServerComponentClient({ cookies: cookies() })

  await supabase
    .from('creator_sessions')
    .update({ status })
    .eq('id', sessionId)
}

export async function rateSession(
  sessionId: SessionId,
  story: string
) {
  const supabase = createServerComponentClient({ cookies: cookies() })
  const { rating, insights } = await generateStoryInsights(story)

  await supabase
    .from('creator_sessions')
    .update({ rating, insights })
    .eq('id', sessionId)

  return { rating, insights }
}

export async function incrementSessionImpression(
  sessionId: SessionId
) {
  const supabase = createServerComponentClient({ cookies: cookies() })

  await supabase.rpc('increment_impression', {
    session_id_input: sessionId,
  })
}

export async function incrementSessionView(
  sessionId: SessionId
) {
  const supabase = createServerComponentClient({ cookies: cookies() })

  await supabase.rpc('increment_view', {
    session_id_input: sessionId,
  })
}

export async function updateSessionVisibility(
  sessionId: SessionId,
  visibility: SessionVisibility
) {
  const supabase = createServerComponentClient({ cookies: cookies() })

  await supabase
    .from('creator_sessions')
    .update({ visibility })
    .eq('id', sessionId)
}
