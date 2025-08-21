// Server Component
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/supabase'
import { cn } from '@/lib/utils'
import ImpactScoreRealtimeBridge from '@/components/creator/dashboard/ImpactScoreRealtimeBridge'
import SessionStatsCard from './SessionStatsCard'

type Metric = Tables<'creator_session_metrics'>

export default async function SessionStatsPanel({
  days = 90 as number | 'all',
  limit = 6,
  hideWhenEmpty = false,
}: {
  /** 30 | 90 | 180 | 'all' */
  days?: number | 'all'
  /** Anzahl Karten */
  limit?: number
  /** Nichts anzeigen, wenn leer */
  hideWhenEmpty?: boolean
}) {
  const supabase = createServerComponentClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (hideWhenEmpty) return null
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
        <div className="mb-2 text-lg font-semibold">Anmeldung erforderlich</div>
        <p className="text-sm text-muted-foreground">
          Bitte melde dich an, um deine Sessions zu sehen.
        </p>
        <Link
          href="/login"
          className={cn(
            'mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2',
            'border border-primary/30 bg-primary/10 text-primary font-medium hover:bg-primary/15 transition'
          )}
        >
          Jetzt anmelden
        </Link>
      </div>
    )
  }

  // Zeitfenster
  const sinceIso =
    typeof days === 'number'
      ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      : null

  let query = supabase
    .from('creator_session_metrics')
    .select('*')
    .eq('user_id', user.id)

  if (sinceIso) query = query.gte('created_at', sinceIso)

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data || data.length === 0) {
    if (hideWhenEmpty) return null
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
        <div className="mb-2 text-lg font-semibold">
          {error ? 'Fehler beim Laden' : 'Noch keine Sessions im Zeitraum'}
        </div>
        <p className="text-sm text-muted-foreground">
          {error
            ? 'Deine Session-Metriken konnten nicht geladen werden.'
            : typeof days === 'number'
            ? `Für die letzten ${days} Tage liegen noch keine Daten vor.`
            : 'Lege direkt los mit deiner ersten Session.'}
        </p>
        <Link
          href="/creator/media-studio"
          className={cn(
            'mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2',
            'border border-primary/30 bg-primary/10 text-primary font-medium hover:bg-primary/15 transition'
          )}
        >
          Jetzt Session starten
        </Link>

        {/* Realtime einschalten, falls gleich Daten eintreffen */}
        <ImpactScoreRealtimeBridge userId={user.id} />
      </div>
    )
  }

  const items = data as Metric[]

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Letzte Sessions</h3>
        <Link
          href="/creator/media-studio"
          className={cn(
            'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm',
            'border border-primary/30 bg-primary/10 text-primary font-medium hover:bg-primary/15 transition'
          )}
        >
          Media-Studio öffnen
        </Link>
      </header>

      <ul className="grid grid-cols-1 gap-3">
        {items.map((m) => (
          <li key={m.session_id}>
            <SessionStatsCard metric={m} />
          </li>
        ))}
      </ul>

      <ImpactScoreRealtimeBridge userId={user.id} />
    </section>
  )
}
