// components/admin/home/AdminTimeSeries.tsx
//
// Die Kurve las `data ?? []` und prüfte `error` nicht. Eine abgelehnte Abfrage
// ergab damit vierzehn Tage mit null Sitzungen – eine Aussage über den Betrieb,
// die niemand getroffen hat (ADR-0040).

import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import AdminTimeSeriesClient from './AdminTimeSeriesClient'
import { Fehlerflaeche } from '@/components/admin/Ladezustand'
import { ausProblem } from '@/lib/admin/ladezustand'
import { lese } from '@/lib/api/datenbank-lesen'

export default async function AdminTimeSeries() {
  const supabase = createServerComponentClient<Database>()
  const since = new Date(Date.now() - 13 * 86400 * 1000)
  const SINCE = since.toISOString()

  const ergebnis = await lese(() =>
    supabase
      .from('creator_sessions')
      .select('created_at')
      .gte('created_at', SINCE)
      .order('created_at', { ascending: true }),
  )

  const days: string[] = []
  const d = new Date(since)
  for (let i = 0; i < 14; i++) { days.push(d.toISOString().slice(0,10)); d.setDate(d.getDate() + 1) }

  const counts = Object.fromEntries(days.map(k => [k, 0])) as Record<string, number>
  ;(ergebnis.zeilen ?? []).forEach(r => { const k = r.created_at?.slice(0,10); if (k && k in counts) counts[k]++ })

  const series = days.map(k => ({ date: k, sessions: counts[k] }))

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Sitzungen – letzte 14 Tage</h2>
      </div>
      {ergebnis.problem ? (
        <Fehlerflaeche fehler={ausProblem(ergebnis.problem)} />
      ) : (
        <AdminTimeSeriesClient data={series} />
      )}
    </>
  )
}
