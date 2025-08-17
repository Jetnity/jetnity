import SessionStatsCard from './SessionStatsCard'
import type { Tables } from '@/types/supabase'

type Props = {
  metrics?: Tables<'creator_session_metrics'>[]
  loading?: boolean
  hideWhenEmpty?: boolean
}

export default function SessionStatsPanel({ metrics = [], loading = false, hideWhenEmpty = false }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!metrics.length) {
    return hideWhenEmpty ? null : (
      <div className="rounded-2xl border bg-white/70 dark:bg-neutral-900 p-5 text-center shadow-sm">
        <div className="text-lg font-semibold">Noch keine Performance-Daten</div>
        <p className="text-sm text-neutral-500 mt-1">
          Starte deine erste Session, um Impact-Scores zu sehen.
        </p>
        <a
          href="/creator/media-studio"
          className="inline-flex mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Jetzt Session starten
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {metrics.map((m) => (
        <SessionStatsCard key={m.session_id} metrics={m} />
      ))}
    </div>
  )
}
