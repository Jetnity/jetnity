'use client'

import { useEffect, useRef, useState } from 'react'
import { wegauswahl, type Reiseort } from '@/lib/maps/reisekarte'

type Weg = { path: string; meters: number; seconds: number; warnings: string[]; agencies: { name: string; url: string }[] }
export default function Kartenwege({ orte, fokus, aktiv, vorgabe, post }: {
  vorgabe?: { von: string; nach: string }
  orte: Reiseort[]; fokus?: string; aktiv: boolean; post: (type: string, fields?: Record<string, unknown>) => void
}) {
  const { pins, start, ziel } = wegauswahl(orte, fokus)
  const [vonId, setVon] = useState(vorgabe?.von ?? '')
  const [nachId, setNach] = useState(vorgabe?.nach ?? '')
  const von = pins.find(o => o.id === vonId) ?? start
  const nach = pins.find(o => o.id === nachId) ?? ziel
  const [modus, setModus] = useState('')
  const mode = modus || (vorgabe || von?.art === 'Flughafen' || nach?.art === 'Flughafen' ? 'TRANSIT' : 'WALK')
  const [ergebnis, setErgebnis] = useState<Weg | null>(null)
  const [info, setInfo] = useState('')
  const lauf = useRef<AbortController | null>(null)
  useEffect(() => {
    post('clear-path')
    return () => { lauf.current?.abort(); post('clear-path') }
  }, [von?.id, nach?.id, mode, aktiv, post])
  const [letzteWahl, setLetzteWahl] = useState('')
  const wahl = JSON.stringify([von?.id, nach?.id, mode, aktiv])
  if (wahl !== letzteWahl) { setLetzteWahl(wahl); setErgebnis(null); setInfo('') }
  if (!von || pins.length < 2) return null
  const rechnen = async () => {
    if (!nach || von.id === nach.id) return
    lauf.current?.abort()
    const ctrl = new AbortController()
    lauf.current = ctrl
    setInfo('Weg wird berechnet …'); setErgebnis(null); post('clear-path')
    try {
      const res = await fetch('/api/reisekarte/weg', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ von: von.position, nach: nach.position, mode }), signal: ctrl.signal })
      if (!res.ok) throw new Error()
      const weg: Weg = await res.json()
      if (!ctrl.signal.aborted) { setErgebnis(weg); setInfo(''); post('path', { path: weg.path }) }
    } catch { if (!ctrl.signal.aborted) setInfo('Für diesen Abschnitt ist gerade kein Weg verfügbar.') }
  }
  return <section className="rk-wege"><h3>{vorgabe ? 'Weg für diesen Abschnitt' : 'Weg planen'}</h3>
    <div className="rk-fields"><label>Von<select value={von.id} onChange={e => setVon(e.target.value)}>{pins.map(o => <option value={o.id} key={o.id}>{o.name}</option>)}</select></label>
    <label>Nach<select value={nach?.id ?? ''} onChange={e => setNach(e.target.value)}>{!nach && <option value="">Ziel wählen</option>}{pins.map(o => <option value={o.id} key={o.id}>{o.name}</option>)}</select></label>
    <label>Unterwegs<select value={mode} onChange={e => setModus(e.target.value)}><option value="WALK">Zu Fuss</option><option value="TRANSIT">ÖV · Abfahrt jetzt</option></select></label></div>
    <button type="button" disabled={!aktiv || !nach || von.id === nach.id || !!ergebnis || info === 'Weg wird berechnet …'} className="rk-link" onClick={rechnen}>Weg anzeigen</button>
    <div aria-live="polite">{info && <p>{info}</p>}{ergebnis && <><strong>{(ergebnis.meters / 1000).toLocaleString('de-CH', { maximumFractionDigits: 1 })} km · ca. {Math.max(1,Math.round(ergebnis.seconds / 60))} Min.</strong>
    {ergebnis.agencies.map(a => <p key={a.url}>Verkehrsunternehmen · <a target="_blank" rel="noreferrer" href={a.url}>{a.name}</a></p>)}
    {ergebnis.warnings.map(w => <p key={w}>{w}</p>)}{mode === 'WALK' && <p>Google-Fusswege sind in der Beta-Phase. Gehwege können fehlen.</p>}</>}</div>
  </section>
}
