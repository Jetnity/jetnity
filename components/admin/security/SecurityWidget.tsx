// components/admin/security/SecurityWidget.tsx
'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCcw,
  Ban,
  Undo2,
  Globe,
  LockKeyhole,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type SecEvent = {
  id: string
  created_at?: string | null
  ip?: string | null
  type?: string | null // z.B. 'login_failed' | 'bot' | 'suspicious' | ...
  user_id?: string | null
  detail?: string | null
}

type BlockEntry = {
  ip: string
  reason?: string | null
  expires_at?: string | null
  created_at?: string | null
}

type ApiPayload = {
  events: SecEvent[]
  blocklist: BlockEntry[]
}

export default function SecurityWidget() {
  const [data, setData] = React.useState<ApiPayload>({ events: [], blocklist: [] })
  const [loading, setLoading] = React.useState(false)
  const [filter, setFilter] = React.useState('')
  const [banIp, setBanIp] = React.useState('')
  const [banMinutes, setBanMinutes] = React.useState<number | ''>(60)
  const [banReason, setBanReason] = React.useState('admin block')

  const refresh = React.useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/security/list', { cache: 'no-store' })
      const j = await r.json()
      setData({ events: j.events ?? [], blocklist: j.blocklist ?? [] })
    } catch (e: any) {
      toast.error(e?.message ?? 'Konnte Security-Daten nicht laden.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    refresh()
    const t = setInterval(refresh, 15000)
    return () => clearInterval(t)
  }, [refresh])

  const block = async (ip: string, minutes = 60, reason = 'admin block') => {
    try {
      const r = await fetch('/api/admin/security/block', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ip, minutes, reason }),
      })
      const j = await r.json()
      if (!j.ok) throw new Error(j?.message || 'Block fehlgeschlagen')
      toast.success(`IP ${ip} blockiert${minutes ? ` (${minutes} Min.)` : ''}`)
      refresh()
    } catch (e: any) {
      toast.error(e?.message ?? 'Fehler beim Blockieren')
    }
  }

  const unblock = async (ip: string) => {
    try {
      const r = await fetch('/api/admin/security/unblock', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ip }),
      })
      const j = await r.json()
      if (!j.ok) throw new Error(j?.message || 'Unblock fehlgeschlagen')
      toast.success(`IP ${ip} entfernt`)
      refresh()
    } catch (e: any) {
      toast.error(e?.message ?? 'Fehler beim Entfernen')
    }
  }

  const events = React.useMemo(() => {
    const t = filter.trim().toLowerCase()
    if (!t) return data.events
    return data.events.filter(
      (e) =>
        (e.ip ?? '').toLowerCase().includes(t) ||
        (e.type ?? '').toLowerCase().includes(t) ||
        (e.detail ?? '').toLowerCase().includes(t) ||
        (e.user_id ?? '').toLowerCase().includes(t)
    )
  }, [data.events, filter])

  // KPIs (clientseitig aus Events abgeleitet)
  const now = Date.now()
  const last24 = events.filter((e) =>
    e.created_at ? now - new Date(e.created_at).getTime() <= 24 * 3600 * 1000 : false
  )
  const failed = last24.filter((e) => (e.type ?? '').includes('failed')).length
  const suspicious = last24.filter((e) => (e.type ?? '').match(/bot|suspicious|ddos/i)).length
  const blockedCount = data.blocklist.length

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <section className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-4">
        <KPICard
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Events (24h)"
          value={last24.length}
        />
        <KPICard
          icon={<LockKeyhole className="h-5 w-5" />}
          label="Login-Fehler (24h)"
          value={failed}
        />
        <KPICard
          icon={<ShieldAlert className="h-5 w-5" />}
          label="Verdächtig (24h)"
          value={suspicious}
        />
        <KPICard
          icon={<Ban className="h-5 w-5" />}
          label="Gesperrte IPs"
          value={blockedCount}
        />
      </section>

      {/* Quick Controls */}
      <section className="rounded-2xl border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-2">
          <div className="sm:w-56">
            <label className="text-xs text-muted-foreground">IP blockieren</label>
            <Input
              placeholder="z. B. 203.0.113.42"
              value={banIp}
              onChange={(e) => setBanIp(e.target.value)}
            />
          </div>
          <div className="sm:w-32">
            <label className="text-xs text-muted-foreground">Dauer (Min.)</label>
            <Input
              type="number"
              min={0}
              placeholder="60"
              value={banMinutes}
              onChange={(e) => setBanMinutes(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
          <div className="sm:flex-1">
            <label className="text-xs text-muted-foreground">Grund</label>
            <Input
              placeholder="Grund..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          </div>
          <Button
            className="sm:self-auto"
            onClick={() => banIp && block(banIp.trim(), banMinutes || 0, banReason.trim())}
          >
            <Ban className="h-4 w-4 mr-2" />
            Blockieren
          </Button>

          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCcw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Aktualisieren
          </Button>

          <div className="sm:ml-auto w-full sm:w-64">
            <Input
              placeholder="Suche in Events/IPs…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Blocklist */}
      <section className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Blockliste</h2>
          <span className="text-xs text-muted-foreground">{blockedCount} Einträge</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-2">IP</th>
                <th className="px-4 py-2">Grund</th>
                <th className="px-4 py-2">Ablauf</th>
                <th className="px-4 py-2 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {data.blocklist.map((b) => (
                <tr key={b.ip + (b.created_at ?? '')} className="border-t">
                  <td className="px-4 py-2 font-mono">{b.ip}</td>
                  <td className="px-4 py-2">{b.reason || '—'}</td>
                  <td className="px-4 py-2">
                    {b.expires_at ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(b.expires_at).toLocaleString()}
                      </span>
                    ) : (
                      <Badge variant="outline">permanent</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => unblock(b.ip)}>
                        <Undo2 className="h-4 w-4 mr-1" />
                        Entfernen
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.blocklist.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Keine Einträge.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Events */}
      <section className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Letzte Security-Events (7 Tage)</h2>
          <span className="text-xs text-muted-foreground">{events.length} Einträge</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-2">Zeit</th>
                <th className="px-4 py-2">IP</th>
                <th className="px-4 py-2">Typ</th>
                <th className="px-4 py-2">Detail</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {e.created_at ? new Date(e.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-2 font-mono">{e.ip || '—'}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      {e.type || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2 max-w-[420px]">
                    <div className="line-clamp-2">{e.detail || '—'}</div>
                  </td>
                  <td className="px-4 py-2 font-mono">{e.user_id || '—'}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end">
                      {e.ip ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => block(e.ip!, 60, `auto from ${e.type || 'event'}`)}
                          title="IP 60 Min. blockieren"
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Block 60
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Keine Events gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

/* Small KPI card */
function KPICard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}
