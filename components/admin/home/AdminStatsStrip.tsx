// components/admin/home/AdminStatsStrip.tsx
//
// Sechs Kennzahlen auf der Startseite der Administration. Die Abfrage stand
// vorher unter `if (!error && data)`, und wenn sie scheiterte, blieben die
// Vorgabewerte stehen: „Gesamtumsatz (30T) CHF 0.00", „Bestellungen 0",
// „Conversion-Rate 0.0%". Das ist keine fehlende Auskunft, das ist eine
// Aussage – dieselbe Verwechslung wie in `admin_security_overview`
// („RLS aktiv 0/0 – alle Tabellen geschützt", ADR-0034) und in den lesenden
// Routen (ADR-0037). Ohne Antwort steht hier jetzt ein Strich (ADR-0040).

import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import { Fehlerflaeche } from '@/components/admin/Ladezustand'
import { ausProblem, type Fehler } from '@/lib/admin/ladezustand'
import { problemAus } from '@/lib/api/datenbank-lesen'

function chf(cents: number) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 2 })
    .format((cents || 0) / 100)
}

export default async function AdminStatsStrip() {
  const supabase = createServerComponentClient<Database>()

  const zahlungen = await supabase.rpc('admin_payments_summary_30d')

  const sinceISO = new Date(Date.now() - 30 * 86400 * 1000).toISOString()
  const sitzungen = await supabase
    .from('creator_sessions')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', sinceISO)

  // Eine Ablehnung genügt: Die Conversion-Rate verbindet beide Zahlen, und eine
  // halb gefüllte Reihe wäre schwerer zu deuten als eine leere.
  const fehler: Fehler | null = zahlungen.error
    ? ausProblem(problemAus(zahlungen, zahlungen.error))
    : sitzungen.error
      ? ausProblem(problemAus(sitzungen, sitzungen.error))
      : null

  // `admin_payments_summary_30d` gibt je nach Aufruf ein Objekt oder eine Liste
  // mit einem Objekt zurück; beides wird gelesen.
  const d = (Array.isArray(zahlungen.data) ? zahlungen.data[0] : zahlungen.data) as
    | Record<string, number | null>
    | null
    | undefined

  const total = Number(d?.total_revenue_cents ?? d?.total_cents ?? 0)
  const refunds = Number(d?.refunds_cents ?? 0)
  const payouts = Number(d?.payouts_cents ?? 0)
  const orders = Number(d?.orders_count ?? 0)
  const sessions = sitzungen.count ?? 0
  const conversion = sessions > 0 ? (orders / sessions) * 100 : 0

  const items = fehler
    ? ['Gesamtumsatz (30T)', 'Bestellungen (30T)', 'Sessions (30T)', 'Conversion-Rate', 'Refunds (30T)', 'Payouts (30T)']
        .map((label) => ({ label, value: '–' }))
    : [
        { label: 'Gesamtumsatz (30T)', value: chf(total) },
        { label: 'Bestellungen (30T)', value: String(orders) },
        { label: 'Sessions (30T)', value: String(sessions) },
        { label: 'Conversion-Rate', value: `${conversion.toFixed(1)}%` },
        { label: 'Refunds (30T)', value: chf(refunds) },
        { label: 'Payouts (30T)', value: chf(payouts) },
      ]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Übersicht (letzte 30 Tage)</h2>
      </div>

      {/* Ohne `onWiederholen`: Eine Server-Komponente kann keine Funktion an den
          Browser geben. Zum erneuten Laden dient das Neuladen der Seite. */}
      {fehler && <Fehlerflaeche fehler={fehler} className="mb-4" />}

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
