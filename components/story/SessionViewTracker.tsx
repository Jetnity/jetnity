'use client'

import { useEffect, useState } from 'react'
import { incrementSessionView } from '@/lib/supabase/actions'
import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/types/supabase' // <- nutzt deine Tables-Helper

type MetricRow = Tables<'creator_session_metrics'>
type SessionRow = Tables<'creator_sessions'>

interface Props {
  sessionId: string
}

export default function SessionViewTracker({ sessionId }: Props) {
  const [metrics, setMetrics] = useState<MetricRow | null>(null)
  const [sessionRating, setSessionRating] = useState<number | null>(null)

  // 1) View hochzählen (deine bestehende Server Action)
  useEffect(() => {
    if (!sessionId) return
    incrementSessionView(sessionId)
  }, [sessionId])

  // 2) Metriken + Bewertung laden
  useEffect(() => {
    if (!sessionId) return
    const load = async () => {
      const { data: metric } = await supabase
        .from('creator_session_metrics')
        .select('*')
        .eq('session_id', sessionId)
        .single<MetricRow>()

      const { data: session } = await supabase
        .from('creator_sessions')
        .select('rating')
        .eq('id', sessionId)
        .single<Pick<SessionRow, 'rating'>>()

      setMetrics(metric ?? null)
      setSessionRating(
        typeof session?.rating === 'number' ? session.rating : null
      )
    }
    load()
  }, [sessionId])

  if (!metrics) return null

  // Beispielgewichtung für Jetnity Impact Score
  const impactScore = Math.round(
    (metrics.views || 0) * 0.4 +
      (metrics.comments || 0) * 1.5 +
      (sessionRating || 0) * 1.2
  )

  return (
    <div className="mt-8 border-t pt-4 text-sm text-gray-600 space-y-2">
      <h3 className="font-semibold text-base">📊 Jetnity Impact</h3>

      <div className="flex flex-wrap gap-4">
        <span>
          👁️ Views: <strong>{metrics.views ?? 0}</strong>
        </span>
        <span>
          💬 Kommentare: <strong>{metrics.comments ?? 0}</strong>
        </span>
        <span>
          🧠 Score: <strong>{sessionRating ?? 'n/a'}</strong>/100
        </span>
      </div>

      <p className="text-sm text-gray-500">
        🚀 Impact Score:{' '}
        <strong className="text-black">{impactScore}</strong>
      </p>
    </div>
  )
}
