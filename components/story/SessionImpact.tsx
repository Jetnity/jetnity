// components/story/SessionImpact.tsx
'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import type { CreatorSessionMetrics } from '@/types/views'

type Props = {
  sessionId: string
  /** Polling in ms (0 = aus) */
  autoRefreshMs?: number
  /** Kompakter Stil ohne Card-Chrome */
  compact?: boolean
}

export default function SessionImpact({
  sessionId,
  autoRefreshMs = 30_000,
  compact = false,
}: Props) {
  const [metrics, setMetrics] = React.useState<CreatorSessionMetrics | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = React.useState<Date | null>(null)

  const nf = React.useMemo(
    () => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }),
    []
  )

  const fetchOnce = React.useCallback(async () => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('creator_session_metrics')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle<CreatorSessionMetrics>()
      if (error) throw error
      setMetrics(data ?? null)
      setUpdatedAt(new Date())
    } catch (e: any) {
      setError(e?.message ?? 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  // Initial load
  React.useEffect(() => {
    setLoading(true)
    fetchOnce()
  }, [fetchOnce])

  // Realtime (nur wenn Quelle eine Tabelle ist – Views senden i. d. R. keine Changes)
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const channel = supabase
      .channel(`impact-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_session_metrics',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          // bei jeder Änderung neu laden
          fetchOnce()
        }
      )

    // ✅ subscribe() liefert RealtimeChannel, kein Promise → KEIN .catch()
    channel.subscribe()

    return () => {
      // sauber abmelden; Promise-Ergebnis hier ignorieren
      try {
        channel.unsubscribe()
      } catch {
        /* noop */
      }
    }
  }, [sessionId, fetchOnce])

  // Fallback-Polling
  React.useEffect(() => {
    if (!autoRefreshMs) return
    const id = window.setInterval(fetchOnce, autoRefreshMs)
    return () => window.clearInterval(id)
  }, [fetchOnce, autoRefreshMs])

  if (loading) {
    return (
      <div
        className={compact ? 'mt-4' : 'mt-8 rounded-2xl border border-border bg-card/70 p-4'}
        aria-busy="true"
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-6 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) return null

  const views = (metrics as any).views as number | undefined
  const impressions = (metrics as any).impressions as number | undefined
  const clicks = (metrics as any).clicks as number | undefined
  const likes = (metrics as any).likes as number | undefined
  const comments = (metrics as any).comments as number | undefined
  const shares = (metrics as any).shares as number | undefined
  const watchTime = (metrics as any).watch_time as number | undefined

  const ctr =
    impressions && clicks && impressions > 0 ? (clicks / impressions) * 100 : undefined

  return (
    <section
      className={compact ? 'mt-4' : 'mt-8 rounded-2xl border border-border bg-card/70 p-4'}
      aria-live="polite"
    >
      {error && (
        <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {typeof views === 'number' && <Stat label="Aufrufe" value={nf.format(views)} />}
        {typeof impressions === 'number' && (
          <Stat label="Impressions" value={nf.format(impressions)} />
        )}
        {typeof ctr === 'number' && <Stat label="CTR" value={`${nf.format(ctr)}%`} />}
        {typeof clicks === 'number' && <Stat label="Klicks" value={nf.format(clicks)} />}
        {typeof likes === 'number' && <Stat label="Likes" value={nf.format(likes)} />}
        {typeof comments === 'number' && (
          <Stat label="Kommentare" value={nf.format(comments)} />
        )}
        {typeof shares === 'number' && <Stat label="Shares" value={nf.format(shares)} />}
        {typeof watchTime === 'number' && (
          <Stat label="Watchtime" value={nf.format(watchTime)} />
        )}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        {updatedAt ? `Aktualisiert: ${updatedAt.toLocaleTimeString()}` : null}
      </p>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center shadow-sm">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  )
}
