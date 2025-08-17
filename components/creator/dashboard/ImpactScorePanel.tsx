'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import ImpactScore from './ImpactScore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Tables } from '@/types/supabase'

type Metric = Pick<Tables<'creator_session_metrics'>, 'impact_score' | 'title' | 'created_at'>

export default function ImpactScorePanel() {
  const [loading, setLoading] = useState(true)
  const [latest, setLatest] = useState<Metric | null>(null)
  const [avg, setAvg] = useState<number | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      setLoading(true)
      setError(null)

      const { data: auth } = await supabase.auth.getUser()
      const userId = auth.user?.id
      if (!userId) {
        if (isMounted) {
          setError('Nicht eingeloggt.')
          setLoading(false)
        }
        return
      }

      const latestQ = supabase
        .from('creator_session_metrics')
        .select('impact_score,title,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<Metric>()

      const avgQ = supabase.rpc('platform_avg_impact_score')

      const [latestRes, avgRes] = await Promise.all([latestQ, avgQ])

      if (!isMounted) return

      if (latestRes.error) setError(latestRes.error.message)
      else setLatest(latestRes.data ?? null)

      if (!avgRes.error && typeof avgRes.data === 'number') {
        setAvg(avgRes.data)
      }

      setLoading(false)
    })()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <Card className="bg-white/70 dark:bg-neutral-900 border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Impact & Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 w-40 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : latest ? (
          <>
            <ImpactScore
              value={Number(latest.impact_score ?? 0)}
              label={latest.title || 'Letzte Session'}
              avgScore={avg}
            />
            <p className="text-xs text-neutral-500">
              Aktualisiert: {new Date(latest.created_at!).toLocaleString()}
            </p>
          </>
        ) : (
          <p className="text-sm text-neutral-500">
            Noch keine Performance-Daten verfügbar. Starte deine erste Session.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
