// components/creator/dashboard/SessionStatsPanel.tsx
// Server Component (nur Darstellung)

import Link from 'next/link'
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
    error: userErr,
  } = await supabase.auth.getUser()

  // Nicht eingeloggt
  if (userErr || !user) {
    if (hideWhenEmpty) return null
    return (
      <section className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
        <h3 className="mb-2 text-lg font-semibold">Anmeldung erforderlich</h3>
        <p className="text-sm text-muted-foreground">
          Bitte melde dich an, um deine Sessions zu sehen.
        </p>
        <Link
          href="/auth/sign-in"
          className={cn(
            'mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2',
            'border border-primary/30 bg-primary/10 text-primary font-medium hover:bg-primary/15 transition'
          )}
        >
          Jetzt anmelden
        </Link>
      </section>
    )
  }

  // Zeitraum
  const sinceIso =
    typeof days === 'number'
      ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      : null

  // Daten + count in EINEM Query (count ignoriert das limit)
  let query = supabase
    .from('creator_session_metrics')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)

  if (sinceIso) query = query.gte('created_at', sinceIso)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  // Fehler / Leerzustände
  if (error || !data || data.length === 0) {
    if (hideWhenEmpty) return null
    return (
      <section className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
        <h3 className="mb-2 text-lg font-semibold">
          {error ? 'Fehler beim Laden' : 'Noch keine Sessions im Zeitraum'}
        </h3>
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

        {/* Realtime: aktualisiert das Panel automatisch, sobald Daten eintreffen */}
        <ImpactScoreRealtimeBridge userId={user.id} />
      </section>
    )
  }

  const items = (data ?? []) as Metric[]
  const total = typeof count === 'number' ? count : items.length
  const moreAvailable = total > items.length

  return (
    <section
      className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur"
      aria-label="Letzte Sessions"
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">Letzte Sessions</h3>
          <p className="text-xs text-muted-foreground">
            Zeitraum:{' '}
            {typeof days === 'number' ? `letzte ${days} Tage` : 'Gesamt'} ·{' '}
            {items.length} von {total}
          </p>
        </div>

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

      {/* Fußzeile mit Mehr-Link, falls es weitere Einträge gibt */}
      <footer className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {items.length} / {total} Einträge
        </span>
        {moreAvailable && (
          <Link
            href="/creator/media-studio?s=all" // optionaler Deep-Link; passe bei Bedarf an
            className="rounded-md border px-2.5 py-1.5 hover:bg-accent hover:text-accent-foreground"
          >
            Mehr anzeigen
          </Link>
        )}
      </footer>

      {/* Realtime-Bridge: sorgt für frische Daten ohne manuelles Reload */}
      <ImpactScoreRealtimeBridge userId={user.id} />
    </section>
  )
}
