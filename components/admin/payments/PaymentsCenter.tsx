'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CreditCard, RefreshCw, Search, RotateCcw, Activity, Webhook } from 'lucide-react'
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

type BreakdownDay = { date: string; revenue_chf: number; orders: number }
type PaymentRow = { id: string; status: string; amount_chf: number | null; created_at: string; customer_email?: string | null }

export default function PaymentsCenter() {
  const [tab, setTab] = React.useState<'overview'|'transactions'|'refunds'|'webhooks'>('overview')
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <TabBtn active={tab==='overview'} onClick={()=>setTab('overview')}>Overview</TabBtn>
        <TabBtn active={tab==='transactions'} onClick={()=>setTab('transactions')}>Transaktionen</TabBtn>
        <TabBtn active={tab==='refunds'} onClick={()=>setTab('refunds')}>Refunds</TabBtn>
        <TabBtn active={tab==='webhooks'} onClick={()=>setTab('webhooks')}>Webhooks</TabBtn>
      </div>

      {tab==='overview' && <OverviewCard/>}
      {tab==='transactions' && <TransactionsCard/>}
      {tab==='refunds' && <RefundCard/>}
      {tab==='webhooks' && <WebhooksCard/>}
    </div>
  )
}

function TabBtn({ active, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button {...rest} className={cn('rounded-xl border px-3 py-1.5 text-sm', active ? 'bg-primary/10 border-primary/40' : 'hover:bg-muted')}>
      {children}
    </button>
  )
}

/* ── Overview (Revenue Breakdown) ─────────────────────── */

function OverviewCard() {
  const [days, setDays] = React.useState<BreakdownDay[]>([])
  const [loading, setLoading] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  const load = async () => {
    setLoading(true); setErr(null)
    try {
      const res = await fetch('/api/admin/payments/breakdown?range=30d', { cache: 'no-store' })
      if (!res.ok) throw new Error('Serverfehler')
      const json = await res.json() as { days: BreakdownDay[] }
      setDays(json.days || [])
    } catch (e: any) { setErr(e?.message ?? 'Unbekannter Fehler') }
    finally { setLoading(false) }
  }

  React.useEffect(()=>{ load() }, [])

  const totals = React.useMemo(() => {
    return days.reduce((acc, d) => {
      acc.revenue += d.revenue_chf; acc.orders += d.orders; return acc
    }, { revenue: 0, orders: 0 })
  }, [days])

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Umsatz (30 Tage)</h3>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading} className="gap-1">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Aktualisieren
        </Button>
      </div>

      {err && <p className="text-xs text-red-500">{err}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Umsatz" value={`CHF ${totals.revenue.toLocaleString('de-CH')}`} />
        <Metric label="Bestellungen" value={totals.orders.toLocaleString('de-CH')} />
        <Metric label="Ø Ticket" value={`CHF ${(totals.orders? (totals.revenue/totals.orders) : 0).toFixed(2)}`} />
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={days}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopOpacity={0.6}/>
                <stop offset="95%" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="ord" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopOpacity={0.6}/>
                <stop offset="95%" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeOpacity={0.2} vertical={false}/>
            <XAxis dataKey="date" tickMargin={8}/>
            <YAxis yAxisId="left" allowDecimals={false}/>
            <YAxis yAxisId="right" orientation="right" allowDecimals={false}/>
            <Tooltip/>
            <Legend/>
            <Area type="monotone" dataKey="revenue_chf" name="Umsatz" yAxisId="left" strokeOpacity={0.9} fill="url(#rev)"/>
            <Area type="monotone" dataKey="orders" name="Bestellungen" yAxisId="right" strokeOpacity={0.9} fill="url(#ord)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {!days.length && <p className="mt-2 text-sm text-muted-foreground">Keine Daten (oder Tabelle fehlt).</p>}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  )
}

/* ── Transactions (Liste) ─────────────────────────────── */

function TransactionsCard() {
  const [rows, setRows] = React.useState<PaymentRow[]>([])
  const [cursor, setCursor] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [q, setQ] = React.useState('')
  const [status, setStatus] = React.useState<'all' | 'paid' | 'pending' | 'failed' | 'refunded'>('all')

  const load = async (reset=false) => {
    if (loading) return
    setLoading(true)
    try {
      const url = new URL('/api/admin/payments/list', window.location.origin)
      if (!reset && cursor) url.searchParams.set('cursor', cursor)
      if (q.trim()) url.searchParams.set('q', q.trim())
      if (status!=='all') url.searchParams.set('status', status)
      const res = await fetch(url.toString(), { cache: 'no-store' })
      if (!res.ok) throw new Error('Serverfehler')
      const data = await res.json() as { rows: PaymentRow[]; next_cursor?: string | null }
      setRows(reset ? data.rows : [...rows, ...data.rows])
      setCursor(data.next_cursor ?? null)
      if (!data.next_cursor) setDone(true)
    } finally { setLoading(false) }
  }

  React.useEffect(()=>{ load(true) /* initial */ }, []) // eslint-disable-line

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Transaktionen</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suche: ID oder E-Mail…"
              className="pl-8 w-64"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e)=>{ if(e.key==='Enter'){ setDone(false); setCursor(null); load(true) } }}
            />
          </div>
          <select
            className="rounded-md border bg-background px-2 py-2 text-sm"
            value={status}
            onChange={(e)=>{ setStatus(e.target.value as any); setDone(false); setCursor(null); load(true) }}
          >
            <option value="all">Alle</option>
            <option value="paid">paid</option>
            <option value="pending">pending</option>
            <option value="failed">failed</option>
            <option value="refunded">refunded</option>
          </select>
          <Button variant="outline" size="sm" onClick={()=>{ setDone(false); setCursor(null); load(true) }}>
            Filtern
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-3 py-2">Zeit</th>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Kunde</th>
              <th className="px-3 py-2">Betrag</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r)=>(
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                <td className="px-3 py-2">{r.customer_email ?? '—'}</td>
                <td className="px-3 py-2">{typeof r.amount_chf==='number' ? `CHF ${r.amount_chf.toFixed(2)}` : '—'}</td>
                <td className="px-3 py-2">
                  <Badge className={statusClass(r.status)}>{r.status}</Badge>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Keine Transaktionen (oder Tabelle fehlt).</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-center">
        <Button variant="outline" onClick={()=>load()} disabled={loading || done}>
          {done ? 'Ende' : 'Mehr laden'}
        </Button>
      </div>
    </section>
  )
}

function statusClass(s: string) {
  if (s==='paid') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
  if (s==='pending') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
  if (s==='failed') return 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300'
  if (s==='refunded') return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
  return ''
}

/* ── Refund Tool ─────────────────────────────────────── */

function RefundCard() {
  const [paymentId, setPaymentId] = React.useState('')
  const [amount, setAmount] = React.useState('')
  const [reason, setReason] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [msg, setMsg] = React.useState<string | null>(null)

  const submit = async () => {
    setBusy(true); setMsg(null)
    try {
      const res = await fetch('/api/admin/payments/refund', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId.trim(), amount_chf: Number(amount), reason: reason.trim() || undefined })
      })
      const data = await res.json().catch(()=>({}))
      if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Fehler')
      setMsg('Refund ausgelöst.')
    } catch (e: any) {
      setMsg(e?.message ?? 'Unbekannter Fehler')
    } finally { setBusy(false) }
  }

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <RotateCcw className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Refund auslösen</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input placeholder="Payment ID" value={paymentId} onChange={(e)=>setPaymentId(e.target.value)} />
        <Input placeholder="Betrag (CHF)" value={amount} onChange={(e)=>setAmount(e.target.value)} />
        <Input placeholder="Grund (optional)" value={reason} onChange={(e)=>setReason(e.target.value)} />
      </div>
      <div className="mt-3">
        <Button onClick={submit} disabled={!paymentId || !amount || busy}>Refund senden</Button>
        {msg && <span className="ml-3 text-sm text-muted-foreground">{msg}</span>}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Wenn die Tabellen <code>payments</code> / <code>refunds</code> existieren, wird protokolliert. Fehlen sie, antwortet die API freundlich ohne Crash.
      </p>
    </section>
  )
}

/* ── Webhooks Monitor ────────────────────────────────── */

function WebhooksCard() {
  const [rows, setRows] = React.useState<{ id: string; type: string; created_at: string }[]>([])
  const [cursor, setCursor] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const load = async () => {
    if (loading) return
    setLoading(true)
    try {
      const url = new URL('/api/admin/payments/webhooks', window.location.origin)
      if (cursor) url.searchParams.set('cursor', cursor)
      const res = await fetch(url.toString(), { cache: 'no-store' })
      if (!res.ok) throw new Error('Serverfehler')
      const data = await res.json() as { rows: { id:string; type:string; created_at:string }[]; next_cursor?: string | null }
      setRows([...rows, ...data.rows])
      setCursor(data.next_cursor ?? null)
      if (!data.next_cursor) setDone(true)
    } finally { setLoading(false) }
  }

  React.useEffect(()=>{ load() }, []) // eslint-disable-line

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Webhook className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Stripe Webhooks</h3>
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-3 py-2">Zeit</th>
              <th className="px-3 py-2">Typ</th>
              <th className="px-3 py-2">ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2">{r.type}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">Keine Events (oder Tabelle fehlt).</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-center">
        <Button variant="outline" onClick={()=>load()} disabled={loading || done}>
          {done ? 'Ende' : 'Mehr laden'}
        </Button>
      </div>
    </section>
  )
}
