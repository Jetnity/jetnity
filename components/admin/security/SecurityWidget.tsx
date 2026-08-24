// components/admin/security/SecurityWidget.tsx
//
// Die Ansicht lädt sich alle 15 Sekunden neu. Ein Toast war dafür das falsche
// Mittel: Er verschwand nach vier Sekunden und liess vier Kennzahlen auf 0 und
// zwei Tabellen mit „Keine Einträge“ zurück – im Sicherheitsbereich also die
// Entwarnung, die es nicht gab. Und bei jedem Lauf kam er erneut. Die Meldung
// bleibt jetzt stehen, solange sie gilt (ADR-0040).

'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Fehlerflaeche } from '@/components/admin/Ladezustand'
import { lade, liste, type Fehler } from '@/lib/admin/ladezustand'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
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
  created_at?: string | null
}

type ApiPayload = {
  events: SecEvent[]
  blocklist: BlockEntry[]
}

export default function SecurityWidget() {
  // `null` heisst „noch keine Antwort“. Der Vorgabewert war
  // `{ events: [], blocklist: [] }` und damit von einem Ergebnis nicht zu
  // unterscheiden.
  const [data, setData] = React.useState<ApiPayload | null>(null)
  const [fehler, setFehler] = React.useState<Fehler | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [filter, setFilter] = React.useState('')
  const [banIp, setBanIp] = React.useState('')
  const [banReason, setBanReason] = React.useState('admin block')

  const refresh = React.useCallback(async () => {
    setLoading(true)
    const ergebnis = await lade(
      () => fetch('/api/admin/security/list', { cache: 'no-store' }),
      (koerper): ApiPayload => ({
        events: liste<SecEvent>(koerper, 'events'),
        blocklist: liste<BlockEntry>(koerper, 'blocklist'),
      }),
    )
    setLoading(false)

    if (ergebnis.fehler) {
      // Die zuletzt geholten Daten bleiben stehen und werden als älter
      // gekennzeichnet – sie zu verwerfen hiesse, aus einem Aussetzer eine
      // Entwarnung zu machen.
      setFehler(ergebnis.fehler)
      return
    }

    setFehler(null)
    setData(ergebnis.daten)
  }, [])

  React.useEffect(() => {
    refresh()
    const t = setInterval(refresh, 15000)
    return () => clearInterval(t)
  }, [refresh])

  // Für die zwei Eingriffe bleibt der Toast: Sie sind einmalige Handlungen mit
  // einer Antwort, keine Ansicht, die sich selbst nachlädt. `requireAdminApi`
  // antwortet allerdings ohne `ok` und mit `error` statt `message` – ein Gate,
  // das die Anfrage abweist, führte deshalb zu „Block fehlgeschlagen" ohne Grund.
  const schreibe = async (pfad: string, koerper: unknown, gelungen: string, misslungen: string) => {
    try {
      const r = await fetch(pfad, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(koerper),
      })
      const j = await r.json().catch(() => null)
      if (!r.ok || j?.ok !== true) throw new Error(j?.message || j?.error || misslungen)
      toast.success(gelungen)
      refresh()
    } catch (e: any) {
      toast.error(e?.message ?? misslungen)
    }
  }

  const block = (ip: string, reason = 'admin block') =>
    schreibe(
      '/api/admin/security/block',
      { ip, reason },
      `${ADMIN_EHRLICHE_TEXTE.ipBlockErfolgPrefix} ${ip}`,
      'Schreiben in die Blockliste fehlgeschlagen',
    )

  const unblock = (ip: string) =>
    schreibe(
      '/api/admin/security/unblock',
      { ip },
      `${ADMIN_EHRLICHE_TEXTE.ipUnblockErfolgPrefix} ${ip}`,
      'Entfernen aus der Blockliste fehlgeschlagen',
    )

  const events = React.useMemo(() => {
    if (!data) return null
    const t = filter.trim().toLowerCase()
    if (!t) return data.events
    return data.events.filter(
      (e) =>
        (e.ip ?? '').toLowerCase().includes(t) ||
        (e.type ?? '').toLowerCase().includes(t) ||
        (e.detail ?? '').toLowerCase().includes(t) ||
        (e.user_id ?? '').toLowerCase().includes(t)
    )
  }, [data, filter])

  // KPIs (clientseitig aus Events abgeleitet). Ohne Antwort bleiben sie leer:
  // „0 Login-Fehler" ist die Aussage, die eine Sicherheitsübersicht am
  // deutlichsten treffen kann, und ohne Daten trifft sie sie zu Unrecht.
  const now = Date.now()
  const last24 = (events ?? []).filter((e) =>
    e.created_at ? now - new Date(e.created_at).getTime() <= 24 * 3600 * 1000 : false
  )
  const failed = last24.filter((e) => (e.type ?? '').includes('failed')).length
  const suspicious = last24.filter((e) => (e.type ?? '').match(/bot|suspicious|ddos/i)).length
  const blockedCount = data ? data.blocklist.length : null

  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
        {ADMIN_EHRLICHE_TEXTE.ipBlockHinweis}
      </p>
      {fehler && (
        <Fehlerflaeche
          fehler={fehler}
          onWiederholen={refresh}
          laeuft={loading}
          veraltet={data !== null}
        />
      )}

      {/* KPIs */}
      <section className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-4">
        <KPICard
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Events (24h)"
          value={data ? last24.length : null}
        />
        <KPICard
          icon={<LockKeyhole className="h-5 w-5" />}
          label="Login-Fehler (24h)"
          value={data ? failed : null}
        />
        <KPICard
          icon={<ShieldAlert className="h-5 w-5" />}
          label="Verdächtig (24h)"
          value={data ? suspicious : null}
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
            onClick={() => banIp && block(banIp.trim(), banReason.trim())}
          >
            <Ban className="h-4 w-4 mr-2" />
            {ADMIN_EHRLICHE_TEXTE.ipBlockButton}
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
          <h2 className="text-sm font-semibold">Blockliste (nicht enforced)</h2>
          <span className="text-xs text-muted-foreground">
            {blockedCount === null ? '—' : `${blockedCount} Einträge`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-2">IP</th>
                <th className="px-4 py-2">Grund</th>
                <th className="px-4 py-2">Gesperrt seit</th>
                <th className="px-4 py-2 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {(data?.blocklist ?? []).map((b) => (
                <tr key={b.ip + (b.created_at ?? '')} className="border-t">
                  <td className="px-4 py-2 font-mono">{b.ip}</td>
                  <td className="px-4 py-2">{b.reason || '—'}</td>
                  <td className="px-4 py-2">
                    {b.created_at ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(b.created_at).toLocaleString()}
                      </span>
                    ) : (
                      '—'
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
              {/* „Keine Einträge" nur, wenn der Server das gesagt hat. Ohne
                  Antwort ist die Aussage nicht zu treffen; die Fehlerfläche
                  über der Ansicht sagt dann, warum. */}
              {data !== null && data.blocklist.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Keine Einträge.
                  </td>
                </tr>
              )}
              {data === null && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    {fehler ? 'Nicht ermittelbar.' : 'Wird geladen…'}
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
          <span className="text-xs text-muted-foreground">
            {events === null ? '—' : `${events.length} Einträge`}
          </span>
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
              {(events ?? []).map((e) => (
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
                          onClick={() => block(e.ip!, `aus Ereignis ${e.type || 'unbekannt'}`)}
                          title="IP sperren"
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Sperren
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {events !== null && events.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Keine Events gefunden.
                  </td>
                </tr>
              )}
              {events === null && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    {fehler ? 'Nicht ermittelbar.' : 'Wird geladen…'}
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

/* Small KPI card. `null` heisst „nicht ermittelbar“ und wird als Strich gezeigt. */
function KPICard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | null }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums',
          value === null && 'text-muted-foreground',
        )}
      >
        {value === null ? '—' : value}
      </div>
    </div>
  )
}
