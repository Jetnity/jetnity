'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BedDouble, Landmark, Map as MapIcon, MapPin, PlaneLanding, X } from 'lucide-react'
import { istPosition, reiseKarteninhalt, type Position, type Reiseort } from '@/lib/maps/reisekarte'
import type { Trip } from '@/types/trips'
import Kartenwege from './Kartenwege'

type Aufruf = { reise: Trip; ort?: Reiseort; tag?: string }
const KartenKontext = createContext<((aufruf: Aufruf) => void) | null>(null)
const symbole = { Hotel: BedDouble, Besuch: Landmark, Flughafen: PlaneLanding, Etappe: MapPin }

export function Kartenknopf({ reise, ort, tag, children }: Aufruf & { children?: ReactNode }) {
  const oeffnen = useContext(KartenKontext)
  if (!oeffnen) return null
  return <button type="button" className="rk-link" onClick={() => oeffnen({ reise, ort, tag })}>
    <MapIcon size={17} aria-hidden />{children ?? 'Reisekarte öffnen'}
  </button>
}

export function FlughafenKartenknopf({ reise, iata }: { reise: Trip; iata?: string }) {
  const oeffnen = useContext(KartenKontext)
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
      if (!ctrl.signal.aborted) oeffnen({ reise, ort: { id: 'airport-' + iata, name: ort.name + ' · ' + iata,
        art: 'Flughafen', position: ort.position, tage: [] } })
    } catch { if (!ctrl.signal.aborted) setMeldung('Für ' + iata + ' ist gerade kein Standort verfügbar.') }
  }
  return <div><button type="button" className="rk-link" onClick={anzeigen}><PlaneLanding size={17} aria-hidden />
    Flughafen {iata} auf Karte ansehen</button>{meldung && <p role="status">{meldung}</p>}</div>
}

export default function ReisekartenRahmen({ children, expiresAt }: { children: ReactNode; expiresAt: number | null }) {
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
  const inhalt = useMemo(() => aufruf && reiseKarteninhalt(aufruf.reise), [aufruf])
  const orte = useMemo(() => {
    const basis = [...(inhalt?.orte ?? [])]
    if (aufruf?.ort && !basis.some(o => o.id === aufruf.ort?.id)) basis.push(aufruf.ort)
    return basis.filter(o => !tag || o.tage.includes(tag)).map(o => ({ ...o, position: o.position ?? positionen[o.id] ?? null }))
  }, [aufruf, inhalt, tag, positionen])
  const pins = useMemo(() => orte.flatMap((o,index) => o.position ? [{ index, label: o.name.slice(0,500), ...o.position }] : []).slice(0,1000), [orte])
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
        case 'frame-ready': post('init', { stops: pins }); break
        case 'ready': setBereit(true); setStatus(''); break
        case 'select': if (Number.isInteger(e.data.index)) setAuswahl(orte[e.data.index]?.id ?? ''); break
        case 'expired': setAbgelaufen(true); stop('Das Vorschaufenster ist beendet.'); break
        case 'error': case 'blocked': stop('Google Maps ist gerade nicht verfügbar.'); break
      }
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [pins, orte, post, stop])
  useEffect(() => { if (bereit && offen) post('stops', { stops: pins }) }, [bereit, pins, offen, post])
  useEffect(() => { if (bereit && offen) post('select', { index: orte.findIndex(o => o.id === auswahl) }) }, [bereit, offen, auswahl, orte, post])
  const gewaehlt = orte.find(o => o.id === auswahl)
  const aktivierbar = Boolean(expiresAt && !abgelaufen && !gesperrt && pins.length)
  return <KartenKontext.Provider value={context}>
    {children}
    <dialog ref={dialog} className="rk-dialog" aria-labelledby="rk-titel" onClose={() => setOffen(false)}>
      {aufruf && <div className="rk-layout">
        <header className="rk-head"><div><p>{aufruf.reise.title}</p><h2 id="rk-titel">Reisekarte</h2></div>
          <button type="button" className="rk-close" onClick={() => dialog.current?.close()} aria-label="Zurück zur vorherigen Ansicht"><X size={22} /></button></header>
        <aside className="rk-list"><label>Ansicht<select value={tag} onChange={e => { setTag(e.target.value); setAuswahl('') }}>
          <option value="">Ganze Reise</option>{inhalt?.tage.map(t => <option value={t.id} key={t.id}>{t.name}</option>)}</select></label>
          <h3>Orte</h3>{!orte.length && <p>Für diese Ansicht sind noch keine Orte geplant.</p>}
          <ol>{orte.map((o, i) => { const Icon = symbole[o.art]; return <li key={o.id}>
            <button type="button" aria-pressed={auswahl === o.id} onClick={() => setAuswahl(o.id)}>
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
        </aside>
        <div className="rk-main"><div className="rk-canvas">
          {granted && <iframe title="Interaktive Google-Reisekarte" ref={frame} src="/embed/trip-map" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" referrerPolicy="strict-origin" />}
          {!granted && <div className="rk-consent"><MapIcon aria-hidden size={32} /><h3>{pins.length ? 'Deine Orte auf einer Karte' : 'Die Orte deiner Reise'}</h3>
            <p>{status || (!pins.length ? 'Wähle einen Ort und ergänze seinen Standort.' : !aktivierbar ? 'Die interaktive Karte ist ausserhalb des Testfensters ausgeschaltet.' : 'Beim Laden erhält Google deine IP-Adresse, Browserdaten und den Kartenausschnitt.')}</p>
            {aktivierbar && <button className="rk-primary" type="button" onClick={() => { if (window.PrivacyBee === undefined && expiresAt && expiresAt > Date.now()) { setStatus(''); setGranted(true) } }}>Zustimmen und Karte laden</button>}
            {aktivierbar && <a href="https://policies.google.com/privacy?hl=de" target="_blank" rel="noreferrer">Datenschutz bei Google</a>}
          </div>}
        </div>
        {granted && !bereit && <p role="status">Die Karte wird geladen …</p>}
        <Kartenwege key={tag + '|' + (aufruf.ort?.id ?? '')} orte={orte} fokus={aufruf.ort?.id} aktiv={granted && bereit && offen && aktivierbar} post={post} />
        {granted && <button type="button" className="rk-link rk-revoke" onClick={() => stop('Die Karte ist ausgeschaltet.')}>Kartenzustimmung widerrufen</button>}
        </div>
      </div>}
    </dialog>
  </KartenKontext.Provider>
}
