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
import AdminEvidenceDetails from '@/components/admin/home/AdminEvidenceDetails'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
import {
  securityEreignisLeerart,
  securityReadIstAnDerGrenze,
} from '@/lib/admin/security/filter-ehrlichkeit'
import {
  naechsteRefreshIdentitaet,
  refreshIstAutoritaer,
} from '@/lib/admin/security/refresh-reihenfolge'
import {
  istAufgezeichneterLoginFehler,
  istAufgezeichneteAuffaelligkeit,
} from '@/lib/admin/security-event-taxonomy'
import { cn } from '@/lib/utils'

type SecEvent = {
  id: string
  created_at?: string | null
  ip?: string | null
  type?: string | null // historische/lesbare Typen: login_failed, auth_failed, bot, suspicious, ddos, anomaly*
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
  // Jede Lesung bekommt eine Identität. Antwortet eine ältere nach einer
  // neueren, darf sie Daten, Fehler und den Ladezustand nicht mehr schreiben.
  const juengsteLesung = React.useRef(0)

  const refresh = React.useCallback(async () => {
    const diese = naechsteRefreshIdentitaet(juengsteLesung.current)
    juengsteLesung.current = diese
    setLoading(true)
    const ergebnis = await lade(
      () => fetch('/api/admin/security/list', { cache: 'no-store' }),
      (koerper): ApiPayload => ({
        events: liste<SecEvent>(koerper, 'events'),
        blocklist: liste<BlockEntry>(koerper, 'blocklist'),
      }),
    )
    if (!refreshIstAutoritaer(diese, juengsteLesung.current)) return

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

  // Eine leere Tabelle ist nur dann „nichts in diesem Zeitraum“, wenn die
  // Lesung selbst leer war. Stehen Zeilen in der Nutzlast und der Filter
  // trifft keine, bleibt das eine Filteraussage.
  const ereignisLeerart =
    events !== null && events.length === 0 && data !== null
      ? securityEreignisLeerart(data.events.length)
      : null
  // Die Route liefert höchstens 200 Zeilen und sagt das nicht. Erst eine
  // volle Nutzlast darf die Grenze nennen; weniger Zeilen sind kein Beleg
  // für einen abgeschnittenen Read.
  const eventsBegrenzt = data !== null && securityReadIstAnDerGrenze(data.events.length)
  // Dieselbe Listengrenze gilt für blocked_ips. Sie hängt nur an der
  // Blocklisten-Nutzlast, nicht an den Events.
  const blocklistBegrenzt = data !== null && securityReadIstAnDerGrenze(data.blocklist.length)

  // 24h-KPIs kommen aus der ungefilterten aufgezeichneten Menge.
  // Die Suche gilt nur für die Tabelle; sonst würde „Aufgezeichnete Events (24h)"
  // nach einer Suche eine Teilmenge als Fensterwahrheit vortäuschen.
  // Ohne Antwort bleiben die Kacheln leer: 0 aufgezeichnete Zeilen sind kein
  // Beleg dafür, dass kein sicherheitsrelevantes Ereignis stattgefunden hat.
  const aufgezeichneteEvents = data?.events ?? []
  const now = Date.now()
  const last24 = aufgezeichneteEvents.filter((e) =>
    e.created_at ? now - new Date(e.created_at).getTime() <= 24 * 3600 * 1000 : false
  )
  const failed = last24.filter((e) => istAufgezeichneterLoginFehler(e.type)).length
  const suspicious = last24.filter((e) => istAufgezeichneteAuffaelligkeit(e.type)).length
  const blockedCount = data ? data.blocklist.length : null

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card px-4 py-3 sm:px-5" aria-label="Security-Abdeckung">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Erfassung unvollständig</p>
            <p className="mt-1 text-sm text-muted-foreground">Nur aufgezeichnete Ereignisse. Auch bei 0 Einträgen ist keine Entwarnung möglich.</p>
          </div>
          <Button variant="outline" onClick={refresh} disabled={loading} leftIcon={<RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />}>
            Aktualisieren
          </Button>
        </div>
        <div className="mt-3"><AdminEvidenceDetails>
          <p>{ADMIN_EHRLICHE_TEXTE.securityHinweis}</p>
          <p>{ADMIN_EHRLICHE_TEXTE.securityAbdeckungHinweis}</p>
          <p>{ADMIN_EHRLICHE_TEXTE.ipBlockHinweis}</p>
        </AdminEvidenceDetails></div>
      </section>
      {fehler && (
        <Fehlerflaeche
          fehler={fehler}
          onWiederholen={refresh}
          laeuft={loading}
          veraltet={data !== null}
        />
      )}

      {/* KPIs */}
      <section className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(100%,140px),1fr))] xl:grid-cols-4">
        <KPICard
          icon={<ShieldCheck className="h-5 w-5" />}
          label={ADMIN_EHRLICHE_TEXTE.securityKpiEvents24h}
          value={data ? last24.length : null}
        />
        <KPICard
          icon={<LockKeyhole className="h-5 w-5" />}
          label={ADMIN_EHRLICHE_TEXTE.securityKpiLoginFehler24h}
          value={data ? failed : null}
        />
        <KPICard
          icon={<ShieldAlert className="h-5 w-5" />}
          label={ADMIN_EHRLICHE_TEXTE.securityKpiAuffaelligkeiten24h}
          value={data ? suspicious : null}
        />
        <KPICard
          icon={<Ban className="h-5 w-5" />}
          label="Blocklisteneinträge"
          value={blockedCount}
        />
      </section>

      {/* Events */}
      <section className="rounded-2xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">{ADMIN_EHRLICHE_TEXTE.securityTabelleTitel}</h2>
            {eventsBegrenzt && (
              <p className="mt-1 text-xs text-muted-foreground" data-security-read-bound="events">
                {ADMIN_EHRLICHE_TEXTE.securityTabelleBegrenzt}
              </p>
            )}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {events === null ? '—' : `${events.length} Einträge`}
          </span>
        </div>
        <div className="border-b px-4 py-3">
          <Input containerClassName="[&>div:last-child]:hidden" aria-label="Aufgezeichnete Ereignisse durchsuchen" placeholder="Ereignisse nach IP, Typ oder Detail suchen…" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-lg" />
        </div>
        <div className="overflow-x-auto" role="region" aria-label="Aufgezeichnete Ereignisse" tabIndex={0}>
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
                          variant="outline"
                          leftIcon={<Ban className="h-4 w-4" />}
                          onClick={() => block(e.ip!, `aus Ereignis ${e.type || 'unbekannt'}`)}
                          title="IP in Blockliste aufnehmen – ohne technische Sperrwirkung"
                        >
                          Eintragen
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {ereignisLeerart !== null && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                    data-security-events-leer={ereignisLeerart}
                  >
                    {ereignisLeerart === 'filter'
                      ? ADMIN_EHRLICHE_TEXTE.securityTabelleFilterLeer
                      : ADMIN_EHRLICHE_TEXTE.securityTabelleLeer}
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

      {/* The action stores an entry; it does not enforce an IP block. */}
      <section className="rounded-2xl border bg-card p-4 sm:p-5" aria-labelledby="blocklist-eintrag-titel">
        <h2 id="blocklist-eintrag-titel" className="text-sm font-semibold">Blocklisteneintrag hinzufügen</h2>
        <p className="mb-4 mt-1 text-sm text-amber-800 dark:text-amber-200">Einträge bewirken derzeit keine technische Sperre.</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1.5fr_auto] xl:items-end">
          <div className="min-w-0">
            <label htmlFor="blocklist-ip" className="mb-1 block text-xs text-muted-foreground">IP-Adresse</label>
            <Input containerClassName="[&>div:last-child]:hidden" id="blocklist-ip" placeholder="z. B. 203.0.113.42" value={banIp} onChange={(e) => setBanIp(e.target.value)} />
          </div>
          <div className="min-w-0">
            <label htmlFor="blocklist-grund" className="mb-1 block text-xs text-muted-foreground">Grund</label>
            <Input containerClassName="[&>div:last-child]:hidden" id="blocklist-grund" placeholder="Grund…" value={banReason} onChange={(e) => setBanReason(e.target.value)} />
          </div>
          <Button className="w-full sm:col-span-2 xl:col-span-1 xl:w-auto" variant="outline" leftIcon={<Ban className="h-4 w-4" />} onClick={() => banIp && block(banIp.trim(), banReason.trim())}>
            Eintrag hinzufügen
          </Button>
        </div>
      </section>

      {/* Blocklist */}
      <section className="rounded-2xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Blockliste · ohne technische Sperrwirkung</h2>
            {blocklistBegrenzt && (
              <p className="mt-1 text-xs text-muted-foreground" data-security-read-bound="blocklist">
                {ADMIN_EHRLICHE_TEXTE.securityBlocklisteBegrenzt}
              </p>
            )}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {blockedCount === null ? '—' : `${blockedCount} Einträge`}
          </span>
        </div>
        <div className="overflow-x-auto" role="region" aria-label="Blocklisteneinträge" tabIndex={0}>
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-2">IP</th>
                <th className="px-4 py-2">Grund</th>
                <th className="px-4 py-2">Eingetragen am</th>
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
                      <Button variant="outline" size="sm" onClick={() => unblock(b.ip)} leftIcon={<Undo2 className="h-4 w-4" />}>
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


    </div>
  )
}

/* Small KPI card. `null` heisst „nicht ermittelbar“ und wird als Strich gezeigt. */
function KPICard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | null }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="shrink-0 text-muted-foreground" aria-hidden>{icon}</span>
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
