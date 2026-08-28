// components/admin/home/AdminTimeSeries.tsx
//
// Die Kurve las `data ?? []` und prüfte `error` nicht. Eine abgelehnte Abfrage
// ergab damit vierzehn Tage mit null Sitzungen – eine Aussage über den Betrieb,
// die niemand getroffen hat (ADR-0040).
//
// Gezählt wurden bis Phase 1.5 die Zeilen von `creator_sessions`, der Tabelle
// der alten Produktidee. Jetnity V2 hat keine Sitzungen, sondern Reisen. Die
// Zahlen kommen deshalb aus `public.admin_reisen_zeitreihe()`.
//
// Nicht aus einer Abfrage auf `public.trips`: Reisen sind privat, keine Policy
// öffnet sie für ein fremdes Konto (ADR-0041). Eine Abfrage über die Tabelle
// würde von RLS leergefiltert und die Administration bekäme still eine Null –
// genau die Verwechslung von „nicht berechtigt“ mit „nichts vorhanden“, die
// Phase 1.4 aufgeräumt hat. Die Funktion liefert nur Anzahlen und prüft die
// Fähigkeit `betrieb-lesen` selbst.

import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import AdminTimeSeriesClient from './AdminTimeSeriesClient'
import { Fehlerflaeche } from '@/components/admin/Ladezustand'
import { ausProblem } from '@/lib/admin/ladezustand'
import { lese } from '@/lib/api/datenbank-lesen'

const TAGE = 14

export default async function AdminTimeSeries() {
  const supabase = await createServerComponentClient<Database>()

  const ergebnis = await lese<{ tag: string; anzahl: number }>(() =>
    supabase.rpc('admin_reisen_zeitreihe', { _tage: TAGE }),
  )

  // Ohne die Fähigkeit `betrieb-lesen` liefert die Funktion keine Zeile. Das ist
  // eine Ablehnung und keine Kurve aus Nullen – im Notzugang (ADR-0036) ist es
  // der Regelfall, und der Hinweisbalken über der Shell erklärt ihn.
  const reihe = (ergebnis.zeilen ?? []).map((zeile) => ({
    date: String(zeile.tag).slice(0, 10),
    reisen: Number(zeile.anzahl ?? 0),
  }))

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Neue Reisen – letzte {TAGE} Tage</h2>
      </div>
      {ergebnis.problem ? (
        <Fehlerflaeche fehler={ausProblem(ergebnis.problem)} />
      ) : reihe.length === 0 ? (
        <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
          Für diese Sitzung liefert die Datenbank keine Betriebszahlen. Nötig ist die Fähigkeit
          „betrieb-lesen“ über eine hinterlegte Rolle.
        </p>
      ) : (
        <AdminTimeSeriesClient data={reihe} />
      )}
    </>
  )
}
