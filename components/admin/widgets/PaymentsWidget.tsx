'use client'

import * as React from 'react'
import { CreditCard, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Summary = {
  window_days: number
  revenue_chf: number
  orders: number
  refunds: number
  configured: boolean
}

export default function PaymentsWidget({ className }: { className?: string }) {
  const [data, setData] = React.useState<Summary | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  const load = async () => {
    setLoading(true); setErr(null)
    try {
      const res = await fetch('/api/admin/payments/summary', { cache: 'no-store' })
      if (!res.ok) throw new Error('Serverfehler')
      const json = await res.json()
      setData(json)
    } catch (e: any) {
      setErr(e?.message ?? 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [])

  return (
    <div className={cn('rounded-2xl border bg-card p-4', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Payments</h3>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading} className="gap-1">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Aktualisieren
        </Button>
      </div>

      {err && <p className="text-xs text-red-500">{err}</p>}

      {!data ? (
        <p className="text-sm text-muted-foreground">Lade…</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Metric label={`Umsatz (${data.window_days}d)`} value={`CHF ${data.revenue_chf.toLocaleString('de-CH')}`} />
          <Metric label="Bestellungen" value={data.orders.toLocaleString('de-CH')} />
          <Metric label="Refunds" value={data.refunds.toLocaleString('de-CH')} />
        </div>
      )}

      {!data?.configured && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Hinweis: Erwarte Tabellen wie <code>payments</code> / <code>refunds</code> (oder Stripe Sync). Fehlen sie, zeigt das Widget Fallbacks.
        </p>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{String(value)}</div>
    </div>
  )
}
