// components/admin/home/AdminStatsStrip.tsx
//
// Sechs Kennzahlen auf der Startseite der Administration. Die Abfrage stand
// vorher unter `if (!error && data)`, und wenn sie scheiterte, blieben die
// Vorgabewerte stehen: „Gesamtumsatz (30T) CHF 0.00", „Bestellungen 0",
// „Conversion-Rate 0.0%". Das ist keine fehlende Auskunft, das ist eine
// Aussage – dieselbe Verwechslung wie in `admin_security_overview`
// („RLS aktiv 0/0 – alle Tabellen geschützt", ADR-0034) und in den lesenden
// Routen (ADR-0037). Ohne Antwort steht hier jetzt ein Strich (ADR-0040).
//
// Die zweite Zahl war bis Phase 1.5 „Sessions (30T)" aus `creator_sessions`.
// Jetnity V2 hat keine Sitzungen, sondern Reisen. Sie kommen aus
// `public.admin_reisen_kennzahlen()` – einer Funktion, die ausschliesslich
// Aggregate liefert. Eine Abfrage auf `public.trips` würde RLS leerfiltern und
// aus „nicht berechtigt" wieder ein „nichts vorhanden" machen (ADR-0041).

import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import { Fehlerflaeche } from '@/components/admin/Ladezustand'
import { ausProblem, type Fehler } from '@/lib/admin/ladezustand'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
import { problemAus } from '@/lib/api/datenbank-lesen'

function chf(cents: number) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 2 })
    .format((cents || 0) / 100)
}

export default async function AdminStatsStrip() {
  const supabase = await createServerComponentClient<Database>()

  const zahlungen = await supabase.rpc('admin_payments_summary_30d')
  const reisen = await supabase.rpc('admin_reisen_kennzahlen')

  // Eine Ablehnung genügt: Die Conversion-Rate verbindet beide Zahlen, und eine
  // halb gefüllte Reihe wäre schwerer zu deuten als eine leere.
  const fehler: Fehler | null = zahlungen.error
    ? ausProblem(problemAus(zahlungen, zahlungen.error))
    : reisen.error
      ? ausProblem(problemAus(reisen, reisen.error))
      : null

  // `admin_payments_summary_30d` gibt je nach Aufruf ein Objekt oder eine Liste
  // mit einem Objekt zurück; beides wird gelesen.
  const d = (Array.isArray(zahlungen.data) ? zahlungen.data[0] : zahlungen.data) as
    | Record<string, number | null>
    | null
    | undefined

  const r = (Array.isArray(reisen.data) ? reisen.data[0] : reisen.data) as
    | Record<string, number | null>
    | null
    | undefined

  const total = Number(d?.total_revenue_cents ?? d?.total_cents ?? 0)
  const refunds = Number(d?.refunds_cents ?? 0)
  const payouts = Number(d?.payouts_cents ?? 0)
  const orders = Number(d?.orders_count ?? 0)

  // Kein `?? 0`: Ohne die Fähigkeit `betrieb-lesen` liefert die Funktion keine
  // Zeile, und das ist eine Ablehnung. Eine Null wäre die Behauptung, es habe
  // in dreissig Tagen niemand eine Reise angelegt.
  const reisen30d = r ? Number(r.reisen_30d ?? 0) : null
  const konten30d = r ? Number(r.konten_mit_reise_30d ?? 0) : null

  const conversion = reisen30d && reisen30d > 0 ? (orders / reisen30d) * 100 : null

  const labels = [
    'Gesamtumsatz (30T)',
    'Bestellungen (30T)',
    'Reisen (30T)',
    'Konten mit Reise (30T)',
    'Refunds (30T)',
    'Payouts (30T)',
  ]

  const items =
    fehler || !r
      ? labels.map((label) => ({ label, value: '–' }))
      : [
          { label: 'Gesamtumsatz (30T)', value: chf(total) },
          { label: 'Bestellungen (30T)', value: String(orders) },
          { label: 'Reisen (30T)', value: String(reisen30d) },
          { label: 'Konten mit Reise (30T)', value: String(konten30d) },
          { label: 'Refunds (30T)', value: chf(refunds) },
          { label: 'Payouts (30T)', value: chf(payouts) },
        ]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Übersicht (letzte 30 Tage)</h2>
          <p className="text-xs text-muted-foreground">{ADMIN_EHRLICHE_TEXTE.kennzahlenHinweis}</p>
        </div>
        {conversion !== null && (
          <p className="text-sm text-muted-foreground">
            Bestellungen je Reise: {conversion.toFixed(1)}%
          </p>
        )}
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
