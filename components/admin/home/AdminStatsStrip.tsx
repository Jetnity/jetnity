// components/admin/home/AdminStatsStrip.tsx
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

function chf(cents: number) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 2 })
    .format((cents || 0) / 100)
}

export default async function AdminStatsStrip() {
  const supabase = createServerComponentClient<Database>()

  // Payments-Übersicht (ohne .catch-Kette; tolerant gegenüber fehlender RPC)
  let total = 0, refunds = 0, payouts = 0, orders = 0
  {
    const { data, error } = await supabase.rpc('admin_payments_summary_30d')
    if (!error && data) {
      // data kann Objekt ODER [Objekt] sein – beides abfangen
      const d: any = Array.isArray(data) ? data[0] : data
      total   = Number(d?.total_revenue_cents ?? d?.total_cents ?? 0)
      refunds = Number(d?.refunds_cents ?? 0)
      payouts = Number(d?.payouts_cents ?? 0)
      orders  = Number(d?.orders_count ?? 0)
    }
  }

  // Sessions (30 Tage)
  const sinceISO = new Date(Date.now() - 30 * 86400 * 1000).toISOString()
  const { count: sessions } = await supabase
    .from('creator_sessions')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', sinceISO)

  const conversion = (sessions && sessions > 0) ? (orders / sessions) * 100 : 0

  const items = [
    { label: 'Gesamtumsatz (30T)', value: chf(total) },
    { label: 'Bestellungen (30T)', value: String(orders) },
    { label: 'Sessions (30T)', value: String(sessions ?? 0) },
    { label: 'Conversion-Rate',   value: `${conversion.toFixed(1)}%` },
    { label: 'Refunds (30T)',     value: chf(refunds) },
    { label: 'Payouts (30T)',     value: chf(payouts) },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Übersicht (letzte 30 Tage)</h2>
      </div>
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
