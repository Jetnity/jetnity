// components/admin/home/AdminStatsStrip.tsx
//
// Audit #438 / finding 6.3: Die Übersicht zeigte Gesamtumsatz, Bestellungen,
// Refunds, Payouts und „Bestellungen je Reise“ aus admin_payments_summary_30d.
// Jetnity hat keinen Payment-/Booking-Provider, der diese Zahlen füllt. Die
// RPC liest Legacy-Tabellen und setzt payouts_cents fest auf 0. Eine CHF-Zahl
// oder eine Conversion-Rate daraus wäre erfundene Revenue-Wahrheit.
//
// Die Übersicht zeigt deshalb nur Reise- und Kontenaggregate aus
// public.admin_reisen_kennzahlen() – einer Funktion, die ausschliesslich
// Aggregate liefert. Eine Abfrage auf public.trips würde RLS leerfiltern und
// aus „nicht berechtigt“ wieder ein „nichts vorhanden“ machen (ADR-0041).
//
// Ohne die Fähigkeit betrieb-lesen liefert die Funktion keine Zeile. Das bleibt
// ein Strich, keine Null (ADR-0040). Umsatz und Conversion bleiben unbelegt,
// nicht null.

import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import { Fehlerflaeche } from '@/components/admin/Ladezustand'
import { ausProblem, type Fehler } from '@/lib/admin/ladezustand'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
import { problemAus } from '@/lib/api/datenbank-lesen'

const KACHEL_LABELS = ['Reisen (30T)', 'Konten mit Reise (30T)'] as const

export default async function AdminStatsStrip() {
  const supabase = await createServerComponentClient<Database>()
  const reisen = await supabase.rpc('admin_reisen_kennzahlen')

  const fehler: Fehler | null = reisen.error
    ? ausProblem(problemAus(reisen, reisen.error))
    : null

  // admin_reisen_kennzahlen gibt je nach Aufruf ein Objekt oder eine Liste mit
  // einem Objekt zurück; beides wird gelesen.
  const r = (Array.isArray(reisen.data) ? reisen.data[0] : reisen.data) as
    | Record<string, number | null>
    | null
    | undefined

  // Kein `?? 0` ohne Zeile: Ohne die Fähigkeit betrieb-lesen liefert die
  // Funktion keine Zeile, und das ist eine Ablehnung. Eine Null wäre die
  // Behauptung, es habe in dreissig Tagen niemand eine Reise angelegt.
  const reisen30d = r ? Number(r.reisen_30d ?? 0) : null
  const konten30d = r ? Number(r.konten_mit_reise_30d ?? 0) : null

  const items =
    fehler || !r
      ? KACHEL_LABELS.map((label) => ({ label, value: '–' }))
      : [
          { label: 'Reisen (30T)', value: String(reisen30d) },
          { label: 'Konten mit Reise (30T)', value: String(konten30d) },
        ]

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Übersicht (letzte 30 Tage)</h2>
        <p className="text-xs text-muted-foreground">{ADMIN_EHRLICHE_TEXTE.kennzahlenHinweis}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {ADMIN_EHRLICHE_TEXTE.umsatzConversionHinweis}
        </p>
      </div>

      {/* Ohne `onWiederholen`: Eine Server-Komponente kann keine Funktion an den
          Browser geben. Zum erneuten Laden dient das Neuladen der Seite. */}
      {fehler && <Fehlerflaeche fehler={fehler} className="mb-4" />}

      {!fehler && !r && (
        <p className="mb-4 rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
          Für diese Sitzung liefert die Datenbank keine Betriebszahlen. Nötig ist die Fähigkeit
          „betrieb-lesen“ über eine hinterlegte Rolle.
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl border border-border p-4 bg-background">
            <p className="text-sm text-muted-foreground">{it.label}</p>
            <p className="mt-1 text-2xl font-semibold">{it.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
