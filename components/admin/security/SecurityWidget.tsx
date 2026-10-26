// components/admin/security/SecurityWidget.tsx
//
// Die Ansicht lädt sich alle 15 Sekunden neu. Ein Toast war dafür das falsche
// Mittel: Er verschwand nach vier Sekunden und liess vier Kennzahlen auf 0 und
// zwei Tabellen mit „Keine Einträge“ zurück – im Sicherheitsbereich also die
// Entwarnung, die es nicht gab. Und bei jedem Lauf kam er erneut. Die Meldung
// bleibt jetzt stehen, solange sie gilt (ADR-0040).
//
// Eine aktuelle 401/403 blendet geschützte Zeilen aus. Eine spätere Störung
// holt sie nicht zurück. Blocklisten-Vorgänge gehören zur erfassten IP und
// werden nicht still wiederholt.

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
import { Fehlerflaeche } from '@/components/admin/Ladezustand'
import { lade, type Ladung } from '@/lib/admin/ladezustand'
import AdminEvidenceDetails from '@/components/admin/home/AdminEvidenceDetails'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
import {
  securityEreignisLeerart,
  securityReadIstAnDerGrenze,
} from '@/lib/admin/security/filter-ehrlichkeit'
import {
  beginnVorgang,
  istAusstehend,
  leeresBuch,
  schliesseVorgang,
  schreibAusgang,
  vorgaengeNachBeginn,
  type BlockAktion,
  type Vorgang,
  type VorgangBuch,
} from '@/lib/admin/security/operation-lifecycle'
import {
  LEERE_LESUNG,
  leseAusgang,
  pruefeSecurityListenAntwort,
  sichereLeseFehler,
  wendeLesungAn,
  type LeseZustand,
  type SecurityListenAntwort,
} from '@/lib/admin/security/response-contract'
import {
  naechsteRefreshIdentitaet,
  refreshIstAutoritaer,
} from '@/lib/admin/security/refresh-reihenfolge'
import {
  istAufgezeichneterLoginFehler,
  istAufgezeichneteAuffaelligkeit,
} from '@/lib/admin/security-event-taxonomy'
import { cn } from '@/lib/utils'
import SecurityOperationStatus from '@/components/admin/security/SecurityOperationStatus'
import styles from './security-widget.module.css'

type LeseUrsprung = 'takt' | 'ausdruecklich'

export default function SecurityWidget() {
  const [data, setData] = React.useState<SecurityListenAntwort | null>(null)
  const [fehler, setFehler] = React.useState<ReturnType<typeof sichereLeseFehler> | null>(null)
  const [leseArt, setLeseArt] = React.useState<LeseZustand['art']>('erste')
  const [loading, setLoading] = React.useState(false)
  const [filter, setFilter] = React.useState('')
  const [banIp, setBanIp] = React.useState('')
  const [banReason, setBanReason] = React.useState('admin block')
  const [buch, setBuch] = React.useState<VorgangBuch>(() => leeresBuch())
  const [schreibenVerweigert, setSchreibenVerweigert] = React.useState(false)
  const juengsteLesung = React.useRef(0)
  const laufende = React.useRef(0)
  const mounted = React.useRef(true)
  const leseZustand = React.useRef<LeseZustand>(LEERE_LESUNG)
  const buchRef = React.useRef(buch)

  const setBuchBeide = (next: VorgangBuch) => {
    buchRef.current = next
    setBuch(next)
  }

  const refresh = React.useCallback(async (ursprung: LeseUrsprung) => {
    if (!mounted.current) return
    if (ursprung === 'takt' && laufende.current > 0) return
    if (laufende.current >= 2) return
    const diese = naechsteRefreshIdentitaet(juengsteLesung.current)
    juengsteLesung.current = diese
    laufende.current += 1
    setLoading(true)
    let ergebnis: Ladung<SecurityListenAntwort> | null = null
    let status = 0
    try {
      ergebnis = await lade(
        async () => {
          const antwort = await fetch('/api/admin/security/list', { cache: 'no-store' })
          status = antwort.status
          return antwort
        },
        (koerper) => {
          const geprueft = pruefeSecurityListenAntwort(koerper)
          if (!geprueft.ok) throw new Error('security-liste-unlesbar')
          return geprueft.daten
        },
      )
    } finally {
      laufende.current -= 1
    }
    if (!ergebnis) return
    if (!mounted.current) return
    if (!refreshIstAutoritaer(diese, juengsteLesung.current)) return

    setLoading(false)
    const ausgang = leseAusgang(status, ergebnis)
    const naechster = wendeLesungAn(leseZustand.current, ausgang)
    leseZustand.current = naechster
    setLeseArt(naechster.art)
    setFehler(ausgang.art === 'angenommen' ? null : sichereLeseFehler(status))
    setData(naechster.daten)
  }, [])

  React.useEffect(() => {
    mounted.current = true
    void refresh('ausdruecklich')
    const takt = window.setInterval(() => {
      void refresh('takt')
    }, 15000)
    return () => {
      mounted.current = false
      window.clearInterval(takt)
    }
  }, [refresh])

  const aktionenOffen = leseArt === 'angenommen' && !schreibenVerweigert

  const starte = async (rohIp: string, aktion: BlockAktion, rohGrund: string | null) => {
    if (!aktionenOffen) return
    const beginn = beginnVorgang(buchRef.current, { ip: rohIp, aktion, grund: rohGrund })
    if (!beginn.ok) return
    setBuchBeide(beginn.buch)
    const vorgang = beginn.vorgang
    const pfad =
      vorgang.aktion === 'eintragen' ? '/api/admin/security/block' : '/api/admin/security/unblock'
    const ip = vorgang.ip
    const reason = vorgang.grund ?? ''
    let antwort: Response
    try {
      antwort = await fetch(pfad, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(vorgang.aktion === 'eintragen' ? { ip, reason } : { ip }),
      })
    } catch {
      if (!mounted.current) return
      setBuchBeide(schliesseVorgang(buchRef.current, vorgang.id, vorgang.ip, 'unbestaetigt'))
      return
    }
    let koerper: unknown = null
    let lesbar = true
    try {
      koerper = await antwort.json()
    } catch {
      lesbar = false
    }
    if (!mounted.current) return
    const ausgang = schreibAusgang(antwort.status, koerper, lesbar)
    if (ausgang === 'verweigert') setSchreibenVerweigert(true)
    const lage = ausgang === 'rueckgemeldet' ? 'rueckgemeldet' : ausgang === 'verweigert' ? 'abgelehnt' : 'unbestaetigt'
    setBuchBeide(schliesseVorgang(buchRef.current, vorgang.id, vorgang.ip, lage))
    if (ausgang === 'rueckgemeldet') void refresh('ausdruecklich')
  }

  const erneut = (vorgang: Vorgang) => {
    void starte(vorgang.ip, vorgang.aktion, vorgang.grund)
  }

  const events = React.useMemo(() => {
    if (!data) return null
    const t = filter.trim().toLowerCase()
    if (!t) return data.events
    return data.events.filter(
      (e) =>
        (e.ip ?? '').toLowerCase().includes(t) ||
        (e.type ?? '').toLowerCase().includes(t) ||
        (e.detail ?? '').toLowerCase().includes(t) ||
        (e.user_id ?? '').toLowerCase().includes(t),
    )
  }, [data, filter])

  const ereignisLeerart =
    events !== null && events.length === 0 && data !== null
      ? securityEreignisLeerart(data.events.length)
      : null
  const eventsBegrenzt = data !== null && securityReadIstAnDerGrenze(data.events.length)
  const blocklistBegrenzt = data !== null && securityReadIstAnDerGrenze(data.blocklist.length)

  const aufgezeichneteEvents = data?.events ?? []
  const now = Date.now()
  const last24 = aufgezeichneteEvents.filter((e) =>
    e.created_at ? now - new Date(e.created_at).getTime() <= 24 * 3600 * 1000 : false,
  )
  const failed = last24.filter((e) => istAufgezeichneterLoginFehler(e.type)).length
  const suspicious = last24.filter((e) => istAufgezeichneteAuffaelligkeit(e.type)).length
  const blockedCount = data ? data.blocklist.length : null
  const vorgaenge = vorgaengeNachBeginn(buch)

  return (
    <div className={`${styles.wurzel} space-y-6`} data-security-read-state={leseArt} data-security-writes={aktionenOffen ? 'enabled' : 'disabled'}>
      <section className="rounded-2xl border bg-card px-4 py-3 sm:px-5" aria-label="Security-Abdeckung">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Erfassung unvollständig</p>
            <p className="mt-1 text-sm text-muted-foreground">Nur aufgezeichnete Ereignisse. Auch bei 0 Einträgen ist keine Entwarnung möglich.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="whitespace-normal"
            onClick={() => void refresh('ausdruecklich')}
            aria-busy={loading || undefined}
            leftIcon={<RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />}
          >
            Aktualisieren
          </Button>
        </div>
        <div className="mt-3">
          <AdminEvidenceDetails>
            <p>{ADMIN_EHRLICHE_TEXTE.securityHinweis}</p>
            <p>{ADMIN_EHRLICHE_TEXTE.securityAbdeckungHinweis}</p>
            <p>{ADMIN_EHRLICHE_TEXTE.ipBlockHinweis}</p>
          </AdminEvidenceDetails>
        </div>
      </section>
      {fehler && (
        <Fehlerflaeche
          fehler={fehler}
          onWiederholen={() => void refresh('ausdruecklich')}
          laeuft={loading}
          veraltet={data !== null}
        />
      )}
      {leseArt === 'verweigert' && (
        <p data-security-read-note="verweigert">
          Geschützte Zeilen und Kennzahlen sind ausgeblendet. Schreiben ist deaktiviert.
        </p>
      )}
      {leseArt === 'unlesbar' && (
        <p data-security-read-note="unlesbar">Die Antwort wurde nicht als aktuelle Liste übernommen.</p>
      )}
      {leseArt === 'stoerung' && data === null && (
        <p data-security-read-note="stoerung">
          Ohne gültige Lesung bleiben Zeilen und Kennzahlen leer. Das ist keine Entwarnung.
        </p>
      )}
      {leseArt === 'veraltet' && (
        <p data-security-read-note="veraltet">Die sichtbaren Zeilen stammen aus der letzten angenommenen Lesung.</p>
      )}

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
        <KPICard icon={<Ban className="h-5 w-5" />} label="Blocklisteneinträge" value={blockedCount} />
      </section>

      <section className="min-w-0 rounded-2xl border bg-card">
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
          <Input
            containerClassName="[&>div:last-child]:hidden"
            aria-label="Aufgezeichnete Ereignisse durchsuchen"
            placeholder="Ereignisse nach IP, Typ oder Detail suchen…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-lg"
          />
        </div>
        <div className="overflow-x-auto" role="region" aria-label="Aufgezeichnete Ereignisse" tabIndex={0}>
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th scope="col" className="px-4 py-2">Zeit</th>
                <th scope="col" className="px-4 py-2">IP</th>
                <th scope="col" className="px-4 py-2">Typ</th>
                <th scope="col" className="px-4 py-2">Detail</th>
                <th scope="col" className="px-4 py-2">User</th>
                <th scope="col" className="px-4 py-2 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {(events ?? []).map((e) => (
                <tr key={e.id} className="border-t">
                  <td className={`${styles.zelle} px-4 py-2 whitespace-nowrap`}>
                    {e.created_at ? new Date(e.created_at).toLocaleString() : '—'}
                  </td>
                  <td className={`${styles.zelle} px-4 py-2 font-mono`}>{e.ip || '—'}</td>
                  <td className={`${styles.zelle} px-4 py-2`}>
                    <span className="inline-flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      {e.type || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2 max-w-[420px]">
                    <div className={styles.detail}>{e.detail || '—'}</div>
                  </td>
                  <td className={`${styles.zelle} px-4 py-2 font-mono`}>{e.user_id || '—'}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end">
                      {e.ip ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="whitespace-normal"
                          disabled={!aktionenOffen || istAusstehend(buch, e.ip)}
                          data-security-block={e.ip}
                          leftIcon={<Ban className="h-4 w-4" />}
                          onClick={() => void starte(e.ip ?? '', 'eintragen', `aus Ereignis ${e.type || 'unbekannt'}`)}
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

      <section className="rounded-2xl border bg-card p-4 sm:p-5" aria-labelledby="blocklist-eintrag-titel">
        <h2 id="blocklist-eintrag-titel" className="text-sm font-semibold">
          Blocklisteneintrag hinzufügen
        </h2>
        <p className="mb-4 mt-1 text-sm text-amber-800 dark:text-amber-200">
          Einträge bewirken derzeit keine technische Sperre.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1.5fr_auto] xl:items-end">
          <div className="min-w-0">
            <label htmlFor="blocklist-ip" className="mb-1 block text-xs text-muted-foreground">
              IP-Adresse
            </label>
            <Input
              containerClassName="[&>div:last-child]:hidden"
              id="blocklist-ip"
              placeholder="z. B. 203.0.113.42"
              value={banIp}
              onChange={(e) => setBanIp(e.target.value)}
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="blocklist-grund" className="mb-1 block text-xs text-muted-foreground">
              Grund
            </label>
            <Input
              containerClassName="[&>div:last-child]:hidden"
              id="blocklist-grund"
              placeholder="Grund…"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          </div>
          <Button
            type="button"
            className="w-full whitespace-normal sm:col-span-2 xl:col-span-1 xl:w-auto"
            variant="outline"
            leftIcon={<Ban className="h-4 w-4" />}
            disabled={!aktionenOffen || banIp.trim().length === 0 || istAusstehend(buch, banIp)}
            onClick={() => void starte(banIp, 'eintragen', banReason)}
          >
            Eintrag hinzufügen
          </Button>
        </div>
      </section>

      <SecurityOperationStatus
        vorgaenge={vorgaenge}
        aktionenOffen={aktionenOffen}
        schreibenVerweigert={schreibenVerweigert}
        onErneut={erneut}
        onSchreibschutzAufheben={() => setSchreibenVerweigert(false)}
      />

      <section className="min-w-0 rounded-2xl border bg-card">
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
                <th scope="col" className="px-4 py-2">IP</th>
                <th scope="col" className="px-4 py-2">Grund</th>
                <th scope="col" className="px-4 py-2">Eingetragen am</th>
                <th scope="col" className="px-4 py-2 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {(data?.blocklist ?? []).map((b) => (
                <tr key={b.ip} className="border-t">
                  <td className={`${styles.zelle} px-4 py-2 font-mono`}>{b.ip}</td>
                  <td className={`${styles.zelle} px-4 py-2`}>{b.reason || '—'}</td>
                  <td className={`${styles.zelle} px-4 py-2`}>
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="whitespace-normal"
                        disabled={!aktionenOffen || istAusstehend(buch, b.ip)}
                        data-security-unblock={b.ip}
                        onClick={() => void starte(b.ip, 'entfernen', null)}
                        leftIcon={<Undo2 className="h-4 w-4" />}
                      >
                        Entfernen
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
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

function KPICard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | null }) {
  return (
    <div className="rounded-2xl border bg-card p-4" data-security-kpi={label} data-security-kpi-value={value === null ? '' : String(value)}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="shrink-0 text-muted-foreground" aria-hidden>
          {icon}
        </span>
      </div>
      <div className={cn('mt-1 text-2xl font-semibold tabular-nums', value === null && 'text-muted-foreground')}>
        {value === null ? '—' : value}
      </div>
    </div>
  )
}
