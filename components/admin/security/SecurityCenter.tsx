'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Shield, AlertTriangle, Activity, Ban, Check, RefreshCw, Search } from 'lucide-react'

type Summary = {
  window_days: number
  failed_logins: number
  blocked_ips: number
  anomalies: number
  last_event?: { type: string; at: string } | null
  configured: boolean
}

type EventRow = {
  id: string
  type: string
  ip?: string | null
  user_id?: string | null
  created_at: string
  extra?: any
}

export default function SecurityCenter() {
  const [tab, setTab] = React.useState<'overview' | 'events' | 'blocklist'>('overview')

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <TabBtn active={tab === 'overview'} onClick={() => setTab('overview')}>Overview</TabBtn>
        <TabBtn active={tab === 'events'} onClick={() => setTab('events')}>Event-Log</TabBtn>
        <TabBtn active={tab === 'blocklist'} onClick={() => setTab('blocklist')}>IP-Blocklist</TabBtn>
      </div>

      {tab === 'overview' && <OverviewCard />}
      {tab === 'events' && <EventsCard />}
      {tab === 'blocklist' && <BlocklistCard />}
    </div>
  )
}

function TabBtn({ active, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...rest}
      className={cn(
        'rounded-xl border px-3 py-1.5 text-sm',
        active ? 'bg-primary/10 border-primary/40' : 'hover:bg-muted'
      )}
    >
      {children}
    </button>
  )
}

/* ── Overview ─────────────────────────────────────────── */

function OverviewCard() {
  const [data, setData] = React.useState<Summary | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  const load = async () => {
    setLoading(true); setErr(null)
    try {
      const res = await fetch('/api/admin/security/summary', { cache: 'no-store' })
      if (!res.ok) throw new Error('Serverfehler')
      setData(await res.json())
    } catch (e: any) {
      setErr(e?.message ?? 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [])

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Overview (letzte 7 Tage)</h3>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading} className="gap-1">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Aktualisieren
        </Button>
      </div>

      {err && <p className="text-xs text-red-500">{err}</p>}

      {!data ? (
        <p className="text-sm text-muted-foreground">Lade…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Failed Logins" value={data.failed_logins} />
            <Metric label="Blocked IPs" value={data.blocked_ips} />
            <Metric label="Anomalien" value={data.anomalies} />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              {data.last_event
                ? <span>Letztes Event: {data.last_event.type} · {new Date(data.last_event.at).toLocaleString()}</span>
                : <span>Keine Events im Zeitfenster</span>}
            </div>
            <Badge className={data.configured ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300' : ''}>
              {data.configured ? 'aktiv' : 'nicht konfiguriert'}
            </Badge>
          </div>

          {!data.configured && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Tipp: Tabellen <code>security_events</code> &amp; <code>blocked_ips</code> anlegen, um volle Funktion zu nutzen.
            </p>
          )}
        </>
      )}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value.toLocaleString('de-CH')}</div>
    </div>
  )
}

/* ── Event Log ────────────────────────────────────────── */

function EventsCard() {
  const [items, setItems] = React.useState<EventRow[]>([])
  const [cursor, setCursor] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [done, setDone] = React.useState(false)
  const [q, setQ] = React.useState('')

  const load = async (reset = false) => {
    if (loading) return
    setLoading(true)
    try {
      const url = new URL('/api/admin/security/events', window.location.origin)
      if (!reset && cursor) url.searchParams.set('cursor', cursor)
      if (q.trim()) url.searchParams.set('q', q.trim())
      const res = await fetch(url.toString(), { cache: 'no-store' })
      if (!res.ok) throw new Error('Serverfehler')
      const data = await res.json() as { rows: EventRow[]; next_cursor?: string | null }
      setItems(reset ? data.rows : [...items, ...data.rows])
      setCursor(data.next_cursor ?? null)
      if (!data.next_cursor) setDone(true)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load(true) /* initial */ }, []) // eslint-disable-line

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Event-Log</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suche: type, ip, user…"
              className="pl-8 w-64"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setDone(false); setCursor(null); load(true) } }}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => { setDone(false); setCursor(null); load(true) }}>
            Filtern
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-3 py-2">Zeit</th>
              <th className="px-3 py-2">Typ</th>
              <th className="px-3 py-2">IP</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Extra</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2">{r.type}</td>
                <td className="px-3 py-2">{r.ip ?? '—'}</td>
                <td className="px-3 py-2">{r.user_id ?? '—'}</td>
                <td className="px-3 py-2">
                  <code className="text-xs">{r.extra ? JSON.stringify(r.extra).slice(0, 80) : '—'}</code>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Keine Events (oder Tabelle fehlt).</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-center">
        <Button variant="outline" onClick={() => load()} disabled={loading || done}>
          {done ? 'Ende' : 'Mehr laden'}
        </Button>
      </div>
    </section>
  )
}

/* ── Blocklist ────────────────────────────────────────── */

function BlocklistCard() {
  const [ip, setIp] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [msg, setMsg] = React.useState<string | null>(null)

  const post = async (path: string, body: any) => {
    setBusy(true); setMsg(null)
    try {
      const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Fehler')
      setMsg('OK')
    } catch (e: any) {
      setMsg(e?.message ?? 'Unbekannter Fehler')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">IP-Blocklist</h3>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input placeholder="IP-Adresse (z.B. 203.0.113.42)" value={ip} onChange={(e) => setIp(e.target.value)} className="sm:w-80" />
        <div className="flex gap-2">
          <Button size="sm" className="gap-2" onClick={() => post('/api/admin/security/block-ip', { ip })} disabled={!ip || busy}>
            <Ban className="h-4 w-4" /> Blockieren
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => post('/api/admin/security/unblock-ip', { ip })} disabled={!ip || busy}>
            <Check className="h-4 w-4" /> Entblocken
          </Button>
        </div>
      </div>
      {msg && <p className="mt-2 text-xs text-muted-foreground">Server: {msg}</p>}
      <p className="mt-2 text-[11px] text-muted-foreground">
        Erwartet Tabelle <code>blocked_ips(ip text primary key, reason text, created_at timestamptz default now())</code>. Ohne Tabelle antwortet die API freundlich und macht nichts kaputt.
      </p>
    </section>
  )
}
