'use client'

import { useEffect, useState } from 'react'
import { incrementSessionView } from '@/lib/supabase/actions'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type Metric = Database['public']['Tables']['creator_session_metrics']['Row']
type Session = Database['public']['Tables']['creator_sessions']['Row'] & { rating?: number }

interface Props {
  sessionId: string
}

export default function SessionViewTracker({ sessionId }: Props) {
  const [metrics, setMetrics] = useState<Metric | null>(null)
  const [session, setSession] = useState<Pick<Session, 'rating'> | null>(null)

  // 🚫 Doppelzählung vermeiden (pro Tab/Session nur einmal)
  useEffect(() => {
    const key = `viewed:${sessionId}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    incrementSessionView(sessionId)
  }, [sessionId])

  // Metriken + Bewertung laden
  useEffect(() => {
    const load = async () => {
      const { data: metric } = await supabase
        .from('creator_session_metrics')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      const { data: session } = await supabase
        .from('creator_sessions')
        .select('rating')
        .eq('id', sessionId)
        .single()

      setMetrics(metric ?? null)
      setSession(session && session.rating !== null ? { rating: session.rating } : null)
    }

    load()
  }, [sessionId])

  if (!metrics) return null

  const impactScore = Math.round(
    (metrics.views || 0) * 0.4 +
    (metrics.comments || 0) * 1.5 +
    (session?.rating || 0) * 1.2
  )

  return (
    <div className="mt-8 border-t pt-4 text-sm text-gray-600 space-y-2">
      <h3 className="font-semibold text-base">📊 Jetnity Impact</h3>
      <div className="flex flex-wrap gap-4">
        <span>👁️ Views: <strong>{metrics.views}</strong></span>
        <span>💬 Kommentare: <strong>{metrics.comments}</strong></span>
        <span>🧠 Score: <strong>{session?.rating ?? 'n/a'}</strong>/100</span>
      </div>
      <p className="text-sm text-gray-500">
        🚀 Impact Score: <strong className="text-black">{impactScore}</strong>
      </p>
    </div>
  )
}
