'use client'

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ortBestaetigen } from '@/lib/places/aktionen'
import { abreiseId, planstrecken } from '@/lib/maps/planstrecken'
import { PlanKartenKontext, type PlanPlatz } from './PlanKartenplatz'
import { BedDouble, Landmark, Map as MapIcon, MapPin, PlaneLanding, X } from 'lucide-react'
import { istPosition, reiseKarteninhalt, type Position, type Reiseort } from '@/lib/maps/reisekarte'
import type { Trip } from '@/types/trips'
import Kartenwege from './Kartenwege'

type Suchziel = 'fluege' | 'unterkunft' | 'aktivitaeten'
type Suchnavigation = (kategorie: Suchziel, etappeId: string) => void
export const KartensucheKontext = createContext<Suchnavigation | undefined>(undefined)
type Aufruf = { reise: Trip; ort?: Reiseort; tag?: string; zurSuche?: Suchnavigation }
const KartenKontext = createContext<((aufruf: Aufruf) => void) | null>(null)
const symbole = { Abreise: PlaneLanding, Hotel: BedDouble, Besuch: Landmark, Flughafen: PlaneLanding, Etappe: MapPin }

export function Kartenknopf({ reise, ort, tag, zurSuche, children }: Aufruf & { children?: ReactNode }) {
  const oeffnen = useContext(KartenKontext)
  const navigation = useContext(KartensucheKontext)
  if (!oeffnen) return null
  return <button type="button" className="rk-link" aria-label={ort ? ort.name + ' auf Karte ansehen' : undefined}
    onClick={() => oeffnen({ reise, ort, tag, zurSuche: zurSuche ?? navigation })}>
    <MapIcon size={17} aria-hidden />{children ?? 'Reisekarte öffnen'}
  </button>
}

export function FlughafenKartenknopf({ reise, iata }: { reise: Trip; iata?: string }) {
  const oeffnen = useContext(KartenKontext)
  const navigation = useContext(KartensucheKontext)
  const [meldung, setMeldung] = useState('')
  const lauf = useRef<AbortController | null>(null)
  useEffect(() => () => lauf.current?.abort(), [iata])
  if (!oeffnen || !iata) return null
  const anzeigen = async () => {
    lauf.current?.abort()
    const ctrl = new AbortController()
    lauf.current = ctrl
    setMeldung('')
    try {
      const res = await fetch('/api/search/airports?position=' + encodeURIComponent(iata), { signal: ctrl.signal })
      if (!res.ok) throw new Error()
      const ort = await res.json()
      if (!istPosition(ort.position) || typeof ort.name !== 'string') throw new Error()
      if (!ctrl.signal.aborted) oeffnen({ reise, zurSuche: navigation, ort: { id: 'airport-' + iata, name: ort.name + ' · ' + iata,
        art: 'Flughafen', position: ort.position, tage: [] } })
    } catch { if (!ctrl.signal.aborted) setMeldung('Für ' + iata + ' ist gerade kein Standort verfügbar.') }
  }
  return <div><button type="button" className="rk-link" onClick={anzeigen}><PlaneLanding size={17} aria-hidden />
    Flughafen {iata} auf Karte ansehen</button>{meldung && <p role="status">{meldung}</p>}</div>
}

export default function ReisekartenRahmen({ children, enabled, expiresAt }: { children: ReactNode; enabled: boolean; expiresAt: number | null }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const [aufruf, setAufruf] = useState<Aufruf | null>(null)
  const [tag, setTag] = useState('')
  const [auswahl, setAuswahl] = useState('')
  const [granted, setGranted] = useState(false)
  const [bereit, setBereit] = useState(false)
  const [offen, setOffen] = useState(false)
  const [status, setStatus] = useState('')
  const [abgelaufen, setAbgelaufen] = useState(false)
  const [gesperrt, setGesperrt] = useState(false)
  const [positionen, setPositionen] = useState<Record<string, Position>>({})
  const [platz, setPlatz] = useState<PlanPlatz | null>(null)
  const [mitAnreise, setMitAnreise] = useState(false)
  const [abreise, setAbreise] = useState<{ id: string; position: Position | null } | null>(null)
  const parkplatz = useRef<HTMLDivElement>(null)
  const suchplatz = useRef<HTMLDivElement>(null)
  const [flaeche, setFlaeche] = useState<HTMLDivElement | null>(null)
  const parkplatzAnmelden = useCallback((node: HTMLDivElement | null) => {
    parkplatz.current = node
    if (node) setFlaeche(aktuell => aktuell ?? document.createElement('div'))
  }, [])
  const verschieben = useCallback((ziel: HTMLElement | null) => {
    if (!flaeche || !ziel || flaeche.parentElement === ziel) return
    // A state-preserving move keeps the loaded Google iframe and its map instance alive.
    if (flaeche.isConnected && ziel.isConnected && 'moveBefore' in ziel && typeof ziel.moveBefore === 'function') ziel.moveBefore(flaeche, null)
    else ziel.appendChild(flaeche)
  }, [flaeche])
  const anmeldung = useMemo(() => ({
    anzeigen: setPlatz,
    entfernen: (host: HTMLDivElement) => {
      if (flaeche?.parentElement === host) verschieben(parkplatz.current)
      setPlatz(p => p?.host === host ? null : p)
    },
  }), [flaeche, verschieben])
  const plan = offen ? null : platz
  useLayoutEffect(() => {
    verschieben(offen ? suchplatz.current : platz?.host ?? parkplatz.current)
  }, [platz, offen, verschieben])
  const reise = plan?.reise ?? aufruf?.reise
  const inhalt = useMemo(() => reise && reiseKarteninhalt(reise), [reise])
  const originId = plan?.reise.originPlaceId
  useEffect(() => {
    if (!mitAnreise || !originId) return
    let aktuell = true
    void ortBestaetigen(originId, 'abreise').then(res => {
      const p = res.ok ? { lat: res.wert.lat, lng: res.wert.lon } : null
      if (aktuell) setAbreise({ id: originId, position: istPosition(p) ? p : null })
    }).catch(() => { if (aktuell) setAbreise({ id: originId, position: null }) })
    return () => { aktuell = false }
  }, [originId, mitAnreise])
  const orte = useMemo(() => {
    const basis = [...(inhalt?.orte ?? [])]
    if (plan) {
      if (mitAnreise && plan.reise.origin && abreise?.id === originId && abreise?.position)
        basis.push({ id: abreiseId, name: plan.reise.origin, art: 'Abreise', position: abreise.position, tage: [] })
      return basis.filter(o => o.art === 'Etappe' || o.art === 'Abreise' || !plan.tag || o.tage.includes(plan.tag))
        .map(o => ({ ...o, position: o.position ?? positionen[o.id] ?? null }))
    }
    if (aufruf?.ort && !basis.some(o => o.id === aufruf.ort?.id)) basis.push(aufruf.ort)
    return basis.filter(o => !tag || o.tage.includes(tag)).map(o => ({ ...o, position: o.position ?? positionen[o.id] ?? null }))
  }, [aufruf, inhalt, tag, positionen, plan, mitAnreise, abreise, originId])
  const pins = useMemo(() => orte.flatMap((o,index) => o.position ? [{ index, label: o.name.slice(0,500), ...o.position,
    ...(o.id === abreiseId ? { symbol: 'A' } : {}) }] : []).slice(0,1000), [orte])
  const abschnitte = useMemo(() => plan ? planstrecken(orte, plan.route, plan.verbindung, plan.hinreise, plan.rueckreise) : [], [orte, plan])
  const aktiv = !!plan || offen
  const planKontext = JSON.stringify([plan?.reise.id, plan?.tag, plan?.etappe, plan?.verbindung])
  const [planOrt, setPlanOrt] = useState<{ kontext: string; id: string } | null>(null)
  const ortId = plan ? (planOrt?.kontext === planKontext ? planOrt.id : '') : auswahl
  const ortWaehlen = useCallback((id: string) => {
    if (plan) setPlanOrt({ kontext: planKontext, id })
    else setAuswahl(id)
  }, [plan, planKontext])
  const post = useCallback((type: string, fields: Record<string, unknown> = {}) => {
    frame.current?.contentWindow?.postMessage({ source: 'jetnity-trip-map-parent', type, ...fields }, '*')
  }, [])
  const context = useCallback((a: Aufruf) => {
    setTag(a.ort ? '' : a.tag ?? '')
    setAuswahl(a.ort?.id ?? '')
    setAufruf(a)
    setOffen(true)
    if (!dialog.current?.open) dialog.current?.showModal()
  }, [])
  const stop = useCallback((grund: string) => { setGranted(false); setBereit(false); setStatus(grund) }, [])
  useEffect(() => {
    const cmp = () => { setGesperrt(true); stop('Die Karte ist über die Datenschutzeinstellungen deaktiviert.') }
    if (window.PrivacyBee !== undefined) cmp()
    document.addEventListener('privacybee:ready', cmp)
    document.addEventListener('privacybee:consent-changed', cmp)
    const timer = expiresAt ? window.setTimeout(() => { setAbgelaufen(true); stop('Das Vorschaufenster ist beendet.') }, Math.max(0, expiresAt - Date.now())) : undefined
    return () => { window.clearTimeout(timer); document.removeEventListener('privacybee:ready', cmp); document.removeEventListener('privacybee:consent-changed', cmp) }
  }, [expiresAt, stop])
  useEffect(() => {
    const receive = (e: MessageEvent) => {
      if (!frame.current || e.source !== frame.current.contentWindow || e.origin !== 'null' || e.data?.source !== 'jetnity-trip-map') return
      switch (e.data.type) {
        case 'frame-ready': setBereit(false); post('init', { stops: pins, setzen: plan?.setzen === true }); break
        case 'ready': setBereit(true); setStatus(''); break
        case 'select': {
          const ort = Number.isInteger(e.data.index) ? orte[e.data.index] : undefined
          if (ort && plan?.setzen && ort.position) plan.onPosition(ort.position)
          else if (ort && plan && ort.art === 'Etappe' && ort.etappeId) plan.onAuswahl(ort.etappeId)
          else if (ort) ortWaehlen(ort.id)
          break
        }
        case 'abschnitt': {
          if (!plan || plan.setzen || !Number.isInteger(e.data.von) || !Number.isInteger(e.data.nach)) break
          const von = orte[e.data.von]?.etappeId
          const nach = orte[e.data.nach]?.etappeId
          const kante = plan.route.find(r => r.art === 'kante' && r.waehlbar && !r.mehrdeutig && r.vonId === von && r.nachId === nach)
          if (kante?.art === 'kante') plan.onEdge?.(kante.kanteId, kante.rueckTagId)
          break
        }
        case 'position': if (plan?.setzen && istPosition(e.data.position)) plan.onPosition(e.data.position); break
        case 'expired': setAbgelaufen(true); stop('Das Vorschaufenster ist beendet.'); break
        case 'error': case 'blocked': stop('Google Maps ist gerade nicht verfügbar.'); break
      }
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [pins, orte, plan, post, stop, ortWaehlen])
  useEffect(() => {
    if (!bereit || !aktiv) return
    post('stops', { stops: pins })
    const auswahlId = ortId || (plan?.etappe && 'etappe-' + plan.etappe)
    const gewaehlterIndex = orte.findIndex(o => o.id === auswahlId)
    if (plan) {
      const abschnitt = abschnitte.find(s => s.aktiv)
      post('reiseplan', { abschnitte, fokus: abschnitt ? [abschnitt.von, abschnitt.nach] : gewaehlterIndex >= 0 && !mitAnreise ? [gewaehlterIndex] : [],
        setzen: plan.setzen })
    } else {
      post('reiseplan', { abschnitte: [], fokus: [], setzen: false })
      post('select', { index: gewaehlterIndex >= 0 ? gewaehlterIndex : null, focus: !!ortId })
    }
  }, [aktiv, bereit, pins, orte, plan, abschnitte, ortId, mitAnreise, post])
  useEffect(() => {
    if (!granted || bereit) return
    const timer = window.setTimeout(() => stop('Die Karte konnte nicht geladen werden. Bitte versuche es erneut.'), 30000)
    return () => window.clearTimeout(timer)
  }, [granted, bereit, stop])
  const gewaehlt = orte.find(o => o.id === ortId)
  const etappe = gewaehlt?.etappeId ?? (reise?.stages.length === 1 ? reise.stages[0].id : undefined)
  const ziel = gewaehlt && gewaehlt.art !== 'Etappe' && gewaehlt.art !== 'Abreise'
    ? ({ Flughafen: 'fluege', Hotel: 'unterkunft', Besuch: 'aktivitaeten' } as const)[gewaehlt.art] : undefined
  const aktivierbar = Boolean(enabled && !abgelaufen && !gesperrt && (pins.length || plan?.setzen))
  const aktiveKante = abschnitte.find(s => s.aktiv)
  const ersteKante = aktiveKante ?? abschnitte.find(s => plan?.etappe && orte[s.von]?.etappeId === plan.etappe) ?? abschnitte.find(s => orte[s.von].art === 'Etappe' && orte[s.nach].art === 'Etappe')
  const von = ersteKante && orte[ersteKante.von]
  const nach = ersteKante && orte[ersteKante.nach]
  const titel = plan?.verbindung
    ? [plan.verbindung.vonId, plan.verbindung.nachId].map(id => plan.reise.stages.find(s => s.id === id)?.name ?? 'Etappe').join(' → ')
    : plan?.reise.stages.find(s => s.id === plan.etappe)?.name ?? 'Reisekarte'
  const ortsliste = <>
          <ol>{orte.map((o, i) => {
            if (plan && o.position && (o.art === 'Etappe' || o.art === 'Abreise')) return null
            const Icon = symbole[o.art]; return <li key={o.id}>
            <button type="button" aria-pressed={ortId === o.id} onClick={() => ortWaehlen(o.id)}>
              <span className="rk-number">{i + 1}</span><span><strong>{o.name}</strong><small><Icon size={14} aria-hidden />{o.art}{o.detail ? ' · ' + o.detail : ''}{!o.position && ' · Standort offen'}</small></span>
            </button></li> })}</ol>
          {gewaehlt && !gewaehlt.position && <form className="rk-coords" key={gewaehlt.id} onSubmit={e => {
            e.preventDefault(); const data = new FormData(e.currentTarget)
            const p = { lat: Number(data.get('lat')), lng: Number(data.get('lng')) }
            if (istPosition(p)) setPositionen(old => ({ ...old, [gewaehlt.id]: p }))
          }}><p>Standort für diese Ansicht ergänzen</p>
            <label>Breitengrad<input name="lat" required type="number" step="any" min="-90" max="90" /></label>
            <label>Längengrad<input name="lng" required type="number" step="any" min="-180" max="180" /></label>
            <button type="submit" className="rk-link">Standort anzeigen</button></form>}
        </>
  return <KartenKontext.Provider value={context}>
    <PlanKartenKontext.Provider value={enabled ? anmeldung : null}>{children}</PlanKartenKontext.Provider>
    <div hidden ref={parkplatzAnmelden} />
    <dialog ref={dialog} className="rk-dialog" aria-labelledby="rk-titel" onClose={() => setOffen(false)}>
      <div className="rk-dialog-slot" ref={suchplatz} />
    </dialog>
    {flaeche && createPortal(<div className={plan ? 'rk-inline' : 'rk-layout'}>
        {!plan && <header className="rk-head"><div><p>{aufruf?.reise.title}</p><h2 id="rk-titel">Reisekarte</h2></div>
          <button type="button" className="rk-close" onClick={() => dialog.current?.close()} aria-label="Zurück zur vorherigen Ansicht"><X size={22} /></button></header>}
        {!plan && <aside className="rk-list"><label>Ansicht<select value={tag} onChange={e => { setTag(e.target.value); setAuswahl('') }}>
          <option value="">Ganze Reise</option>{inhalt?.tage.map(t => <option value={t.id} key={t.id}>{t.name}</option>)}</select></label>
          <h3>Orte</h3>{!orte.length && <p>Für diese Ansicht sind noch keine Orte geplant.</p>}
          {ortsliste}
        </aside>}
        <div className="rk-main" key="karte">
          {plan && <header className="rk-plan-head"><div><h2>{titel}</h2><p>{plan.setzen ? 'Position für deinen Stopp auf der Karte wählen' : 'Geplanter Reiseverlauf · Luftlinien'}</p></div>
            <div className="rk-plan-tools">
              {originId && <button type="button" aria-pressed={mitAnreise} onClick={() => setMitAnreise(a => !a)}>Mit Anreise</button>}
              {bereit && <button type="button" onClick={() => post('fit')}>Zentrieren</button>}
            </div></header>}
          {plan && mitAnreise && originId && !(abreise?.id === originId && abreise.position) && <p role="status">{abreise?.id === originId ? 'Für den Abreiseort fehlt die Kartenposition.' : 'Abreiseort wird geladen …'}</p>}
          <div className="rk-canvas">
          {granted && <iframe title="Interaktive Google-Reisekarte" ref={frame} src="/embed/trip-map" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" referrerPolicy="strict-origin" />}
          {!granted && <div className="rk-consent"><MapIcon aria-hidden size={32} />
            {plan && abschnitte.length > 0 && <ul className="rk-vorschau" aria-label="Geplante Abschnitte">
              {abschnitte.filter(s => !aktiveKante || s.aktiv).map((s,i) => <li key={i}>{orte[s.von].name} → {orte[s.nach].name}</li>)}
            </ul>}<h3>{pins.length || plan?.setzen ? 'Deine Orte auf einer Karte' : 'Die Orte deiner Reise'}</h3>
            <p>{status || (!pins.length && !plan?.setzen ? (plan ? 'Für diese Reise fehlen noch Kartenpositionen.' : 'Wähle einen Ort und ergänze seinen Standort.') : !aktivierbar ? 'Die interaktive Karte ist ausserhalb des Testfensters ausgeschaltet.' : 'Beim Laden erhält Google deine IP-Adresse, Browserdaten und den Kartenausschnitt.')}</p>
            {aktivierbar && <button className="rk-primary" type="button" onClick={() => { if (window.PrivacyBee === undefined && enabled && (expiresAt === null || expiresAt > Date.now())) { setStatus(''); setGranted(true) } }}>Zustimmen und Karte laden</button>}
            {aktivierbar && <a href="https://policies.google.com/privacy?hl=de" target="_blank" rel="noreferrer">Datenschutz bei Google</a>}
          </div>}
        </div>
        {granted && !bereit && <p role="status">Die Karte wird geladen …</p>}
        {plan?.verbindung && !aktiveKante && <p role="status" className="rk-streckenhinweis">Für diesen Abschnitt fehlen eindeutige Kartenpositionen.</p>}
        {(!plan || (von && nach && (!plan.verbindung || aktiveKante))) && <Kartenwege
          key={JSON.stringify([!!plan, tag, plan?.tag, von?.id, nach?.id, aufruf?.ort?.id])}
          orte={orte} fokus={plan ? undefined : aufruf?.ort?.id} vorgabe={plan && von && nach ? { von: von.id, nach: nach.id } : undefined}
          aktiv={granted && bereit && aktiv && aktivierbar} post={post} />}
        {plan && orte.some(o => !o.position || (o.art !== 'Etappe' && o.art !== 'Abreise')) && <details className="rk-list rk-plan-orte">
          <summary>Geplante Orte und Standorte</summary>{ortsliste}</details>}
        {plan?.onSuche && etappe && (ziel === 'unterkunft' || ziel === 'aktivitaeten') && <button className="rk-link" type="button"
          onClick={() => plan.onSuche?.(ziel, etappe)}>{ziel === 'unterkunft' ? 'Hotels vergleichen' : 'Aktivitäten entdecken'}</button>}
        {!plan && gewaehlt && etappe && ziel && aufruf?.zurSuche && <div className="rk-suche">
          <strong>{gewaehlt.name}</strong>
          <button type="button" className="rk-link" onClick={() => { dialog.current?.close(); aufruf.zurSuche?.(ziel, etappe) }}>
            {{ fluege: 'Flugvergleich öffnen', unterkunft: 'Hotels vergleichen', aktivitaeten: 'Aktivitäten entdecken' }[ziel]}
          </button></div>}
        {granted && <button type="button" className="rk-link rk-revoke" onClick={() => stop('Die Karte ist ausgeschaltet.')}>Kartenzustimmung widerrufen</button>}
        </div>
      </div>, flaeche)}
  </KartenKontext.Provider>
}
