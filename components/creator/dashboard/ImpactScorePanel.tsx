'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import ImpactScore from './ImpactScore'
import type { Tables } from '@/types/supabase'

type Metric = Tables<'creator_session_metrics'>

export default function ImpactScorePanel() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [avgScore, setAvgScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // 1) Initial laden
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Eigene Metrics ziehen
      const { data: rows } = await supabase
        .from('creator_session_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (mounted) setMetrics(rows ?? [])

      // Plattform-Durchschnitt via RPC
      const { data: rpc } = await supabase.rpc('platform_avg_impact_score')
      if (mounted) setAvgScore(typeof rpc === 'number' ? rpc : Number(rpc ?? 0))

      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  // 2) Realtime – Updates direkt einpflegen
  useEffect(() => {
    const channel = supabase
      .channel('realtime:csm')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creator_session_metrics' }, (payload) => {
        setMetrics((prev) => {
          const p = payload as any
          if (p.eventType === 'INSERT') return [p.new as Metric, ...prev]
          if (p.eventType === 'UPDATE') return prev.map(x => x.session_id === p.new.session_id ? (p.new as Metric) : x)
          if (p.eventType === 'DELETE') return prev.filter(x => x.session_id !== p.old.session_id)
          return prev
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const latestScore = useMemo(() => metrics[0]?.impact_score ?? null, [metrics])

  return (
    <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5 shadow-sm">
      <div className="mb-3">
        {loading ? (
          <div className="h-8 w-40 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        ) : (
          <ImpactScore
            value={Number(latestScore ?? 0)}
            avgScore={avgScore ?? undefined}
            label="Impact Score (neueste Session)"
          />
        )}
      </div>

      {/* Kleine Liste der letzten Sessions */}
      <div className="mt-4 space-y-2">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))
        ) : metrics.length === 0 ? (
          <div className="text-sm text-neutral-500 text-center">
            Noch keine Daten – starte deine erste Session im Media-Studio.
          </div>
        ) : (
          metrics.slice(0, 5).map(m => (
            <div key={m.session_id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{m.title || 'Unbenannte Session'}</div>
                <div className="text-xs text-neutral-500">{new Date(m.created_at!).toLocaleString()}</div>
              </div>
              <div className="text-sm font-semibold">{Math.round(Number(m.impact_score))}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
