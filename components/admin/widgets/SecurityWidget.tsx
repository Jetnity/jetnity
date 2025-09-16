'use client'

import * as React from 'react'
import { Shield, AlertTriangle, Activity, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Summary = {
  window_days: number
  failed_logins: number
  blocked_ips: number
  anomalies: number
  last_event?: { type: string; at: string } | null
  configured: boolean
}

export default function SecurityWidget({ className }: { className?: string }) {
  const [data, setData] = React.useState<Summary | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  const load = async () => {
    setLoading(true); setErr(null)
    try {
      const res = await fetch('/api/admin/security/summary', { cache: 'no-store' })
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
          <Shield className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Security Center</h3>
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
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Failed Logins" value={data.failed_logins} />
            <Metric label="Blocked IPs" value={data.blocked_ips} />
            <Metric label="Anomalien" value={data.anomalies} />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              {data.last_event
                ? <span>Letztes Event: {data.last_event.type} · {new Date(data.last_event.at).toLocaleString()}</span>
                : <span>Keine Events im Fenster</span>}
            </div>
            <Badge className={data.configured ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300' : ''}>
              {data.configured ? 'aktiv' : 'nicht konfiguriert'}
            </Badge>
          </div>

          {!data.configured && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Hinweis: Lege optional Tabellen <code>security_events</code> und <code>blocked_ips</code> an, um volle Funktion zu nutzen.
            </p>
          )}
        </>
      )}
    </div>
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
