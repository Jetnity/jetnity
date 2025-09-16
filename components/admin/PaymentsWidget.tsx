// components/admin/PaymentsWidget.tsx
import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type PaymentSummary = {
  total_revenue_cents: number
  refunds_cents: number
  payouts_cents: number
  orders_count: number
}

function formatCHF(cents: number) {
  const n = (cents || 0) / 100
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 2 }).format(n)
}

export default async function PaymentsWidget() {
  const supabase = createServerClient<Database>()
  // RPC ist nicht in den generierten Typen → bewusst any-casten
  const { data, error } = await (supabase as any).rpc('admin_payments_summary_30d')

  if (error) {
    return (
      <div className="rounded-xl border border-destructive p-4 text-sm">
        <p className="font-medium text-destructive">Payments RPC fehlt/fehlerhaft.</p>
        <p className="text-muted-foreground">Bitte die bereitgestellte SQL-Funktion `admin_payments_summary_30d` ausführen/prüfen.</p>
      </div>
    )
  }

  const s = (data ?? {}) as Partial<PaymentSummary>
  const totalRevenue = Number(s.total_revenue_cents ?? 0)
  const refunds = Number(s.refunds_cents ?? 0)
  const payouts = Number(s.payouts_cents ?? 0)
  const orders = Number(s.orders_count ?? 0)

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard title="Umsatz (30T)" value={formatCHF(totalRevenue)} hint={`${orders} Zahlungen`} />
      <KpiCard title="Refunds (30T)" value={formatCHF(refunds)} />
      <KpiCard title="Payouts (30T)" value={formatCHF(payouts)} />
      <KpiCard title="Netto (30T)" value={formatCHF(totalRevenue - refunds - payouts)} />
    </div>
  )
}

function KpiCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border p-4 bg-background">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
