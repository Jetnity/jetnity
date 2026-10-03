// components/admin/payments/PaymentsCenter.tsx
//
// Drei der vier Karten lesen Daten, und alle drei haben einen Fehler vorher wie
// eine leere Tabelle aussehen lassen: `TransactionsCard` und `WebhooksCard`
// warfen bei `!res.ok` in ein `finally` ohne `catch`, `OverviewCard` zeigte
// eine Zeile roten Text und darunter trotzdem „Keine Daten". Die Unterscheidung
// kommt jetzt aus `lib/admin/ladezustand.ts`, die Fläche aus
// `components/admin/Ladezustand.tsx` (ADR-0040).

'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Fehlerflaeche, Fehlerzeile } from '@/components/admin/Ladezustand'
import { fortsetzung, lade, liste, type Fehler } from '@/lib/admin/ladezustand'
import AdminEvidenceDetails from '@/components/admin/home/AdminEvidenceDetails'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
import {
  beginTransactionRead,
  isTransactionStatus,
  transactionFilterSnapshot,
  transactionFiltersMatch,
  transactionListQuery,
  transactionReadIsCurrent,
  type TransactionFilterSnapshot,
  type TransactionStatus,
} from '@/lib/admin/payments/transaction-read-filter'
import { cn } from '@/lib/utils'
import { CreditCard, RefreshCw, Search, RotateCcw, Activity, Webhook } from 'lucide-react'
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

type BreakdownDay = { date: string; revenue_chf: number; orders: number }
type PaymentRow = { id: string; status: string; amount_chf: number | null; created_at: string; customer_email?: string | null }
type WebhookRow = { id: string; type: string; created_at: string }

export default function PaymentsCenter() {
  const [tab, setTab] = React.useState<'overview'|'transactions'|'refunds'|'webhooks'>('overview')
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card px-4 py-3 sm:px-5" aria-label="Zahlungsanbindung">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Zahlungsanbieter nicht verbunden</p>
            <p className="mt-1 text-sm text-muted-foreground">Verifizierter Umsatz ist nicht verfügbar. Diese Ansicht zeigt lokale Datensätze.</p>
          </div>
          <Badge variant="outline">Lokale Ansicht</Badge>
        </div>
        <div className="mt-3"><AdminEvidenceDetails><p>{ADMIN_EHRLICHE_TEXTE.zahlungenHinweis}</p></AdminEvidenceDetails></div>
      </section>
      <div className="flex flex-wrap items-center gap-2">
        <TabBtn active={tab==='overview'} onClick={()=>setTab('overview')}>Übersicht</TabBtn>
        <TabBtn active={tab==='transactions'} onClick={()=>setTab('transactions')}>Transaktionen</TabBtn>
        <TabBtn active={tab==='refunds'} onClick={()=>setTab('refunds')}>Erstattungsnotizen</TabBtn>
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
    <button {...rest} type="button" aria-pressed={Boolean(active)} className={cn('min-h-11 rounded-xl border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', active ? 'bg-primary/10 border-primary/40' : 'hover:bg-muted')}>
      {children}
    </button>
  )
}

/* ── Overview (Revenue Breakdown) ─────────────────────── */

function OverviewCard() {
  const [days, setDays] = React.useState<BreakdownDay[] | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [fehler, setFehler] = React.useState<Fehler | null>(null)

  const load = async () => {
    setLoading(true); setFehler(null)
    const ergebnis = await lade(
      () => fetch('/api/admin/payments/breakdown?range=30d', { cache: 'no-store' }),
      (koerper) => liste<BreakdownDay>(koerper, 'days'),
    )
    setLoading(false)
    if (ergebnis.fehler) { setFehler(ergebnis.fehler); return }
    setDays(ergebnis.daten)
  }

  React.useEffect(()=>{ load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Ohne Daten keine Kennzahlen: Eine 0 wäre hier die Aussage „kein Umsatz“.
  const totals = React.useMemo(() => {
    return (days ?? []).reduce((acc, d) => {
      acc.revenue += d.revenue_chf; acc.orders += d.orders; return acc
    }, { revenue: 0, orders: 0 })
  }, [days])

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Lokale Zahlungsdaten · 30 Tage</h3>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading} leftIcon={<RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />}>
          Aktualisieren
        </Button>
      </div>

      {fehler && (
        <Fehlerflaeche
          fehler={fehler}
          onWiederholen={load}
          laeuft={loading}
          veraltet={days !== null}
          className={days === null ? undefined : 'mb-3'}
        />
      )}

      {days === null ? (
        // Vorher standen hier drei Nullen und eine flache Kurve, auch während
        // des ersten Ladens und auch nach einem Fehler. „CHF 0“ ist im
        // Zahlungsbereich eine Aussage und darf keine Platzhalterin sein.
        !fehler && <p className="text-sm text-muted-foreground">Wird geladen…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Lokal als bezahlt erfasst" value={`CHF ${totals.revenue.toLocaleString('de-CH')}`} />
            <Metric label="Lokale Einträge · Status bezahlt" value={totals.orders.toLocaleString('de-CH')} />
            <Metric label="Ø Betrag je lokalem Eintrag" value={totals.orders ? `CHF ${(totals.revenue / totals.orders).toFixed(2)}` : 'Nicht verfügbar'} />
          </div>
          {totals.orders === 0 && totals.revenue === 0 ? (
            <div className="mt-4 rounded-xl bg-muted/40 px-4 py-8 text-center">
              <CreditCard aria-hidden className="mx-auto mb-3 h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium">Keine lokal als bezahlt erfassten Einträge</p>
              <p className="mt-1 text-sm text-muted-foreground">In den letzten 30 Tagen. Daraus lässt sich kein tatsächlicher Umsatz ableiten.</p>
            </div>
          ) : (
            <div className="mt-5">
              <p className="text-xs text-muted-foreground">Lokal erfasste Beträge pro Tag · CHF</p>
              <div className="mt-3 h-52 w-full" role="img" aria-label="Tägliche lokale Zahlungsbeträge in CHF; genaue Werte unter Tageswerte">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={days} margin={{ left: 0, right: 8, top: 8, bottom: 4 }} accessibilityLayer>
                    <CartesianGrid stroke="rgb(var(--border))" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(date: string) => `${date.slice(8,10)}.${date.slice(5,7)}.`} minTickGap={28} tick={{fontSize: 11, fill: 'rgb(var(--muted-foreground))'}} axisLine={false} tickLine={false} />
                    <YAxis width={44} tick={{fontSize: 11, fill: 'rgb(var(--muted-foreground))'}} axisLine={false} tickLine={false} />
                    <Tooltip labelFormatter={(date) => String(date)} contentStyle={{background: 'rgb(var(--card))', borderColor: 'rgb(var(--border))', borderRadius: 12, color: 'rgb(var(--foreground))'}} />
                    <Bar isAnimationActive={false} dataKey="revenue_chf" name="Lokaler Betrag (CHF)" fill="rgb(var(--primary))" radius={[3,3,0,0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <AdminEvidenceDetails label="Tageswerte anzeigen">
                <div className="overflow-x-auto">
                  <table className="w-full text-left tabular-nums">
                    <thead><tr><th className="py-2">Tag</th><th>Betrag · CHF</th><th>Lokale Einträge</th></tr></thead>
                    <tbody>{days.map(day => <tr key={day.date} className="border-t"><td className="py-2">{day.date}</td><td>{day.revenue_chf.toLocaleString('de-CH')}</td><td>{day.orders}</td></tr>)}</tbody>
                  </table>
                </div>
              </AdminEvidenceDetails>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}

/* ── Transactions (Liste) ─────────────────────────────── */

function TransactionsCard() {
  // `null` heisst „noch keine Antwort“ und ist nicht dasselbe wie `[]`. Genau
  // diese Unterscheidung fehlte: `data.rows ?? []` schrieb im Fehlerfall eine
  // leere Liste, und die Tabelle meldete „Keine Transaktionen“.
  const [rows, setRows] = React.useState<PaymentRow[] | null>(null)
  const [fehler, setFehler] = React.useState<Fehler | null>(null)
  const [cursor, setCursor] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [q, setQ] = React.useState('')
  const [status, setStatus] = React.useState<TransactionStatus>('all')

  // Der Filter, zu dem die gerade gezeigte Liste gehört. Ein Entwurf im Suchfeld
  // gilt erst nach Filtern, Enter oder einer Statuswahl. „Mehr laden“ liest
  // diesen Stand, nicht den unbestätigten Entwurf.
  const committed = React.useRef<TransactionFilterSnapshot>(transactionFilterSnapshot('', 'all'))
  const cursorRef = React.useRef<string | null>(null)
  const doneRef = React.useRef(false)
  const loadingRef = React.useRef(false)
  const clock = React.useRef({ latest: 0 })

  const requestPage = React.useCallback(async (
    mode: 'replace' | 'append',
    snapshot: TransactionFilterSnapshot,
  ) => {
    const requestId = beginTransactionRead(clock.current)
    const filter = transactionFilterSnapshot(snapshot.q, snapshot.status)
    const pageCursor = mode === 'append' ? cursorRef.current : null

    if (mode === 'replace') {
      const changed = !transactionFiltersMatch(filter, committed.current)
      committed.current = filter
      cursorRef.current = null
      doneRef.current = false
      setCursor(null)
      setDone(false)
      // Ein anderer Filter darf die vorherigen Zeilen nicht als aktuelle Liste
      // stehen lassen. Dieselbe Abfrage behält sie, bis die neue Seite da ist.
      if (changed) setRows(null)
    }

    loadingRef.current = true
    setLoading(true)
    setFehler(null)

    const url = new URL(transactionListQuery(filter, pageCursor), window.location.origin)
    const ergebnis = await lade(
      () => fetch(url.toString(), { cache: 'no-store' }),
      (koerper) => ({ rows: liste<PaymentRow>(koerper, 'rows'), weiter: fortsetzung(koerper) }),
    )

    if (!transactionReadIsCurrent(clock.current, requestId)) return

    loadingRef.current = false
    setLoading(false)
    if (ergebnis.fehler) {
      setFehler(ergebnis.fehler)
      return
    }

    setRows((current) => (
      mode === 'replace' ? ergebnis.daten.rows : [...(current ?? []), ...ergebnis.daten.rows]
    ))
    cursorRef.current = ergebnis.daten.weiter
    setCursor(ergebnis.daten.weiter)
    doneRef.current = !ergebnis.daten.weiter
    setDone(doneRef.current)
  }, [])

  const commitVisible = (nextQ: string, nextStatus: TransactionStatus) => {
    void requestPage('replace', transactionFilterSnapshot(nextQ, nextStatus))
  }

  const loadMore = () => {
    if (loadingRef.current || doneRef.current || !cursorRef.current) return
    void requestPage('append', committed.current)
  }

  React.useEffect(() => {
    // Erste Seite der Liste. Der Ladezustand wird hier gesetzt, weil die
    // Anfrage erst nach dem Mount starten kann. Das ist dieselbe Stelle wie
    // bisher, nur mit der sichtbaren Abfrage statt mit dem alten Abschluss.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void requestPage('replace', transactionFilterSnapshot('', 'all'))
  }, [requestPage])

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Transaktionen</h3>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              containerClassName="[&>div:last-child]:hidden"
              placeholder="Suche: ID oder E-Mail…"
              aria-label="Transaktionen nach ID oder E-Mail suchen"
              className="w-full pl-8 lg:w-64"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                commitVisible(e.currentTarget.value, status)
              }}
            />
          </div>
          <select
            aria-label="Transaktionsstatus"
            className="rounded-md border bg-background px-2 py-2 text-sm"
            value={status}
            onChange={(e) => {
              const next = e.target.value
              if (!isTransactionStatus(next)) return
              setStatus(next)
              commitVisible(q, next)
            }}
          >
            <option value="all">Alle</option>
            <option value="paid">Bezahlt (lokal)</option>
            <option value="pending">Ausstehend</option>
            <option value="failed">Fehlgeschlagen</option>
            <option value="refunded">Erstattet (lokal)</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => commitVisible(q, status)}>
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
            {(rows ?? []).map((r)=>(
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                <td className="px-3 py-2">{r.customer_email ?? '—'}</td>
                <td className="px-3 py-2">{typeof r.amount_chf==='number' ? `CHF ${r.amount_chf.toFixed(2)}` : '—'}</td>
                <td className="px-3 py-2">
                  <Badge className={statusClass(r.status)}>{{paid: 'Bezahlt (lokal)', pending: 'Ausstehend', failed: 'Fehlgeschlagen', refunded: 'Erstattet (lokal)'}[r.status] ?? r.status}</Badge>
                </td>
              </tr>
            ))}
            {fehler && (
              <Fehlerzeile
                spalten={5}
                fehler={fehler}
                onWiederholen={() => commitVisible(q, status)}
                laeuft={loading}
                veraltet={Boolean(rows?.length)}
              />
            )}
            {!fehler && rows !== null && rows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Keine Transaktionen.</td></tr>
            )}
            {!fehler && rows === null && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Wird geladen…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Solange keine erste Seite da ist, gibt es keine zweite. Die Schaltfläche
          war hier auch im Fehlerfall zu sehen – abgeschaltet, aber sichtbar, und
          damit ein zweites Angebot neben „Erneut versuchen“. */}
      {rows !== null && !fehler && (
        <div className="mt-3 flex items-center justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading || done || !cursor}>
            {done ? 'Ende' : 'Mehr laden'}
          </Button>
        </div>
      )}
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
      // Die Route sendet `message`, nicht `error`. Hier stand `data?.error`, und
      // die Begründung der Datenbank – der einzige Hinweis, warum eine
      // Rückerstattung nicht gebucht wurde – kam damit nie an.
      if (!res.ok || data?.ok === false) throw new Error(data?.message || data?.error || 'Lokale Refund-Notiz fehlgeschlagen.')
      setMsg('Erstattungsnotiz gespeichert. Es wurde kein Geld erstattet.')
    } catch (e: any) {
      setMsg(e?.message ?? 'Unbekannter Fehler')
    } finally { setBusy(false) }
  }

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <RotateCcw className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Erstattung lokal vermerken</h3>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">Dieser Eintrag ist eine lokale Notiz. Es wird kein Geld erstattet.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input containerClassName="[&>div:last-child]:hidden" aria-label="Zahlungs-ID" placeholder="Zahlungs-ID" value={paymentId} onChange={(e)=>setPaymentId(e.target.value)} />
        <Input containerClassName="[&>div:last-child]:hidden" aria-label="Betrag in CHF" placeholder="Betrag (CHF)" value={amount} onChange={(e)=>setAmount(e.target.value)} />
        <Input containerClassName="[&>div:last-child]:hidden" aria-label="Grund (optional)" placeholder="Grund (optional)" value={reason} onChange={(e)=>setReason(e.target.value)} />
      </div>
      <div className="mt-3">
        <Button onClick={submit} disabled={!paymentId || !amount || busy}>
          {ADMIN_EHRLICHE_TEXTE.refundButton}
        </Button>
        {msg && <span className="ml-3 text-sm text-muted-foreground">{msg}</span>}
      </div>
      <div className="mt-4"><AdminEvidenceDetails>
        <p>{ADMIN_EHRLICHE_TEXTE.refundHinweis}</p>
        <p>Die Notiz landet in <code>refunds</code>. Deckt sie den vollen lokalen Betrag, wechselt die
        Zahlung auf <code>refunded</code>. Das ist keine Provider-Erstattung. Scheitert ein Schritt,
        meldet die Route den Grund und nichts wird als erledigt angezeigt.</p>
      </AdminEvidenceDetails></div>
    </section>
  )
}

/* ── Webhooks Monitor ────────────────────────────────── */

function WebhooksCard() {
  // Diese Karte hat den Fall vorgeführt: `stripe_webhooks` hatte bis
  // `20260817100800` weder Recht noch Policy. Die Route antwortete mit 500, die
  // Karte zeigte „Keine Events“ – also „Stripe hat nichts geschickt“.
  const [rows, setRows] = React.useState<WebhookRow[] | null>(null)
  const [fehler, setFehler] = React.useState<Fehler | null>(null)
  const [cursor, setCursor] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const load = async () => {
    if (loading) return
    setLoading(true); setFehler(null)

    const url = new URL('/api/admin/payments/webhooks', window.location.origin)
    if (cursor) url.searchParams.set('cursor', cursor)

    const ergebnis = await lade(
      () => fetch(url.toString(), { cache: 'no-store' }),
      (koerper) => ({ rows: liste<WebhookRow>(koerper, 'rows'), weiter: fortsetzung(koerper) }),
    )

    setLoading(false)
    if (ergebnis.fehler) { setFehler(ergebnis.fehler); return }

    setRows([...(rows ?? []), ...ergebnis.daten.rows])
    setCursor(ergebnis.daten.weiter)
    if (!ergebnis.daten.weiter) setDone(true)
  }

  React.useEffect(()=>{ load() }, []) // eslint-disable-line

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Webhook className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Aufgezeichnete Webhooks</h3>
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
            {(rows ?? []).map(r=>(
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2">{r.type}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
              </tr>
            ))}
            {fehler && (
              <Fehlerzeile
                spalten={3}
                fehler={fehler}
                onWiederholen={load}
                laeuft={loading}
                veraltet={Boolean(rows?.length)}
              />
            )}
            {!fehler && rows !== null && rows.length === 0 && (
              <tr><td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">Keine Events.</td></tr>
            )}
            {!fehler && rows === null && (
              <tr><td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">Wird geladen…</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {rows !== null && !fehler && (
        <div className="mt-3 flex items-center justify-center">
          <Button variant="outline" onClick={()=>load()} disabled={loading || done}>
            {done ? 'Ende' : 'Mehr laden'}
          </Button>
        </div>
      )}
    </section>
  )
}
