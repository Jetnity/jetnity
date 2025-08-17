'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import ImpactScore from '@/components/creator/dashboard/ImpactScore'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/supabase'

type Metric = Tables<'creator_session_metrics'>

export default function ImpactScorePanel() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<Metric[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !user) {
        toast.error('Nicht authentifiziert')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('creator_session_metrics')
        .select('impact_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        toast.error('Konnte Impact-Daten nicht laden')
      } else {
        setMetrics((data ?? []) as Metric[])
      }
      setLoading(false)
    }

    load()
  }, [])

  // Ladezustand
  if (loading) {
    return (
      <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5 shadow-sm space-y-3">
        <div className="h-5 w-40 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        <div className="h-6 w-56 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        <div className="h-3 w-24 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      </div>
    )
  }

  // Empty State (noch keine Sessions/Metriken)
  if (!metrics || metrics.length === 0) {
    return (
      <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5 shadow-sm">
        <div className="text-lg font-semibold mb-2">Noch keine Performance-Daten</div>
        <p className="text-sm text-neutral-500">
          Starte deine erste Session, um Impact-Scores zu sehen.
        </p>
        <Link
          href="/creator/media-studio"
          className={cn(
            'mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2',
            'bg-blue-600 text-white font-semibold hover:bg-blue-700 transition'
          )}
        >
          Jetzt Session starten
        </Link>
      </div>
    )
  }

  // Durchschnittlicher Impact des Creators
  const scores = metrics.map(m => Number(m.impact_score ?? 0))
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

  return (
    <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5 shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Dein Impact</h3>
      <ImpactScore value={avg} label="Impact Score (Ø)" />
      <div className="mt-3 text-xs text-neutral-500">
        Basierend auf {metrics.length} Session{metrics.length === 1 ? '' : 's'}.
      </div>
    </div>
  )
}
