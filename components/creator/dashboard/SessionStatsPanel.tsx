'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import SessionStatsCard from './SessionStatsCard'
import type { Tables } from '@/types/supabase'

type Metric = Tables<'creator_session_metrics'>

export default function SessionStatsPanel() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        toast.error('Nicht authentifiziert')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('creator_session_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('impact_score', { ascending: false })

      if (error) {
        toast.error('Fehler beim Laden der Session-Metriken')
        setLoading(false)
        return
      }

      setMetrics(data ?? [])
      setLoading(false)
    }

    fetchMetrics()
  }, [])

  const { maxScore, avgScore } = useMemo(() => {
    const scores = metrics.map(m => m.impact_score ?? 0)
    const max = scores.length ? Math.max(...scores) : 100
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : undefined
    return { maxScore: max, avgScore: avg }
  }, [metrics])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (!metrics.length) {
    return <div className="text-neutral-400 text-center py-8">Noch keine Performance-Daten verfügbar.</div>
  }

  return (
    <div className="space-y-4">
      {metrics.map(m => (
        <SessionStatsCard
          key={m.session_id}
          metrics={m}
          maxScore={maxScore}
          avgScore={avgScore}
        />
      ))}
    </div>
  )
}
