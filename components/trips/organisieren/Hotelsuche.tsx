'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { BedDouble, ChevronDown, MapPinned, Search, SlidersHorizontal } from 'lucide-react'
import OrtSuche from '@/components/places/OrtSuche'
import type { OrtAuswahl } from '@/lib/places/auswahl'
import { ortBestaetigen } from '@/lib/places/aktionen'
import { hotelDaten } from '@/lib/trips/organisieren/katalog'
import { heutigesDatum } from '@/lib/account/naechste-reise'
import { STAY22_DATENSCHUTZ, STAY22_WAEHRUNGEN, stay22OrtAusEtappe, stay22Suche, type Stay22Fehlerfeld, type Stay22Ort, type Stay22Suche } from '@/lib/providers/stay22/suche'
import type { Trip, TripStage } from '@/types/trips'
import { Feld } from './Suchfelder'
import Stay22Ergebnisse from './Stay22Ergebnisse'
import './hotelsuche.css'

export default function Hotelsuche({ reise, start, etappen }: { reise: Trip; start?: TripStage; etappen: ReactNode }) {
  const id = useId()
  const [stageId, setStageId] = useState(start?.id ?? reise.stages[0]?.id ?? 'anderer-ort')
  const stage = reise.stages.find(s => s.id === stageId)
  const [andererOrt, setAndererOrt] = useState<OrtAuswahl | null>(null)
  const [suchOrt, setSuchOrt] = useState<Stay22Ort | null>(null)
  const [ortLaedt, setOrtLaedt] = useState(false)
  const [ortFehler, setOrtFehler] = useState('')
  const ortAnfrage = useRef(0)
  useEffect(() => () => { ortAnfrage.current += 1 }, [])
  const [termine, setTermine] = useState(() => hotelDaten(reise, start ?? reise.stages[0]))
  const [erwachsene, setErwachsene] = useState(Math.max(1, reise.travellers))
  const [kinder, setKinder] = useState(0)
  const [zimmer, setZimmer] = useState(1)
  const [waehrung, setWaehrung] = useState((STAY22_WAEHRUNGEN as readonly string[]).includes(reise.currency) ? reise.currency : 'CHF')
  const [gaesteOffen, setGaesteOffen] = useState(false)
  const [fehler, setFehler] = useState('')
  const [fehlerfeld, setFehlerfeld] = useState<Stay22Fehlerfeld | null>(null)
  const [ergebnis, setErgebnis] = useState<Stay22Suche | null>(null)
  const [suchlauf, setSuchlauf] = useState(0)
  const reset = () => { setErgebnis(null); setFehler(''); setFehlerfeld(null) }
  const ortWaehlen = async (auswahl: OrtAuswahl | null) => {
    reset()
    setAndererOrt(auswahl)
    setSuchOrt(null)
    setOrtFehler('')
    const lauf = ++ortAnfrage.current
    setOrtLaedt(Boolean(auswahl))
    if (!auswahl) return
    try {
      const result = await ortBestaetigen(auswahl.id, 'ziel')
      if (lauf !== ortAnfrage.current) return
      if (!result.ok) { setOrtFehler(result.meldung); return }
      const ort = result.wert
      setSuchOrt({ name: ort.name, adresse: [ort.name, ort.region, ort.country].filter(Boolean).join(', '), latitude: ort.lat, longitude: ort.lon })
    } catch {
      if (lauf === ortAnfrage.current) setOrtFehler('Der Ort konnte nicht bestätigt werden. Bitte wähle ihn erneut aus.')
    } finally {
      if (lauf === ortAnfrage.current) setOrtLaedt(false)
    }
  }
  const personen = `${erwachsene} ${erwachsene === 1 ? 'Erwachsener' : 'Erwachsene'}${kinder ? `, ${kinder} ${kinder === 1 ? 'Kind' : 'Kinder'}` : ''}`
  return <>
    <form className="org-form stay22-search" onChangeCapture={reset} onSubmit={e => {
      e.preventDefault()
      reset()
      const ort = stageId === 'anderer-ort' ? suchOrt : stay22OrtAusEtappe(stage)
      const result = stay22Suche({ ort, ...termine, erwachsene, kinder, zimmer, waehrung })
      if ('fehler' in result) {
        setFehler(result.fehler)
        setFehlerfeld(result.feld)
        const feld = result.feld === 'ort' && stageId === 'anderer-ort'
          ? document.getElementById(`${id}-ort`)
          : e.currentTarget.querySelector<HTMLElement>(`[name="${result.feld}"]`)
        feld?.focus()
        return
      }
      setGaesteOffen(false)
      setSuchlauf(v => v + 1)
      setErgebnis(result.suche)
    }}>
      <div className="org-formtop"><h2>Unterkunft suchen</h2><span className="stay22-powered">Mit Stay22</span></div>
      <div className="org-fields">
        <Feld label="Reiseziel"><select name="ort" aria-invalid={fehlerfeld === 'ort'} aria-describedby={fehlerfeld === 'ort' ? `${id}-fehler` : undefined} value={stageId} onChange={e => {
          setStageId(e.target.value)
          if (e.target.value !== 'anderer-ort') setTermine(hotelDaten(reise, reise.stages.find(s => s.id === e.target.value)))
        }}>
          {reise.stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          <option value="anderer-ort">Anderen Ort suchen</option>
        </select></Feld>
        <Feld label="Anreise"><input name="anreise" aria-invalid={fehlerfeld === 'anreise'} aria-describedby={fehlerfeld === 'anreise' ? `${id}-fehler` : undefined} required type="date" min={heutigesDatum()} value={termine.anreise} onChange={e => setTermine({ ...termine, anreise: e.target.value })} /></Feld>
        <Feld label="Abreise"><input name="abreise" aria-invalid={fehlerfeld === 'abreise'} aria-describedby={fehlerfeld === 'abreise' ? `${id}-fehler` : undefined} required type="date" min={termine.anreise || heutigesDatum()} value={termine.abreise} onChange={e => setTermine({ ...termine, abreise: e.target.value })} /></Feld>
        <button type="button" name="gaeste" aria-describedby={fehlerfeld === 'gaeste' ? `${id}-fehler` : undefined} className="org-field stay22-guestbutton" aria-expanded={gaesteOffen} aria-controls={`${id}-gaeste`} onClick={() => setGaesteOffen(v => !v)}><span>Gäste</span><b>{personen} <ChevronDown size={15} aria-hidden="true" /></b></button>
        <Feld label="Zimmer"><select value={zimmer} onChange={e => setZimmer(Number(e.target.value))}>{Array.from({ length: Math.min(erwachsene, 8) }, (_, i) => <option key={i} value={i + 1}>{i + 1} Zimmer</option>)}</select></Feld>
        <button type="submit" className="org-go" aria-describedby={`${id}-hinweis`}><Search aria-hidden="true" /> Suchen</button>
      </div>
      {stageId === 'anderer-ort' ? <div className="stay22-other-place"><label htmlFor={`${id}-ort`}>Stadt, Insel oder Region</label><OrtSuche rolle="ziel" variante="field" value={andererOrt} inputId={`${id}-ort`} ungueltig={fehlerfeld === 'ort' || Boolean(ortFehler)} describedBy={fehlerfeld === 'ort' ? `${id}-fehler` : ortFehler ? `${id}-ortfehler` : undefined} placeholder="Wohin möchtest du reisen?" inputClassName="stay22-placeinput" onChange={ortWaehlen} /><p>Diese Suche ändert deine Reiseetappen nicht.</p>{ortLaedt ? <p role="status">Reiseziel wird bestätigt …</p> : null}{ortFehler ? <p role="alert" id={`${id}-ortfehler`}>{ortFehler}</p> : null}</div> : null}
      {gaesteOffen ? <fieldset id={`${id}-gaeste`} className="stay22-guests"><legend>Belegung für die Suche</legend>
        <Feld label="Erwachsene"><select value={erwachsene} onChange={e => { const n = Number(e.target.value); setErwachsene(n); setZimmer(z => Math.min(n, z)) }}>{erwachsene > 9 ? <option value={erwachsene} disabled>{erwachsene} – Gruppe aufteilen</option> : null}{Array.from({ length: 9 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></Feld>
        <Feld label="Kinder"><select value={kinder} onChange={e => setKinder(Number(e.target.value))}>{Array.from({ length: 9 }, (_, i) => <option key={i} value={i}>{i}</option>)}</select></Feld>
        <p>Bitte prüfe die Aufteilung deiner Reisegruppe. Kinderalter und genaue Zimmerbelegung bestätigst du beim Buchungsanbieter.</p>
      </fieldset> : null}
      <div className="stay22-formfoot"><p id={`${id}-hinweis`}>Mit „Suchen“ lädt Stay22 Angebote hier in Jetnity. Ziel, Termine, Gäste und Zimmer sowie Verbindungsdaten werden übermittelt. <a href={STAY22_DATENSCHUTZ} target="_blank" rel="noopener noreferrer">Datenschutz</a></p><label>Währung <select name="waehrung" aria-invalid={fehlerfeld === 'waehrung'} aria-describedby={fehlerfeld === 'waehrung' ? `${id}-fehler` : undefined} value={waehrung} onChange={e => setWaehrung(e.target.value)}>{STAY22_WAEHRUNGEN.map(w => <option key={w}>{w}</option>)}</select></label></div>
      {fehler ? <p id={`${id}-fehler`} role="alert" className="stay22-error">{fehler}</p> : null}
    </form>
    {ergebnis ? <Stay22Ergebnisse key={suchlauf} suche={ergebnis} schliessen={() => setErgebnis(null)} /> : <div className="stay22-intro">
      <div><h2>Finde deinen Platz zum Ankommen.</h2><p>Wähle deinen Aufenthalt und entdecke Unterkünfte mit echten Bildern und Preisen.</p></div>
      <div className="stay22-features"><span><BedDouble aria-hidden="true" /> Hotels & Ferienwohnungen</span><span><SlidersHorizontal aria-hidden="true" /> Budget & Bewertungen</span><span><MapPinned aria-hidden="true" /> Lage auf der Karte</span></div>
    </div>}
    {etappen}
  </>
}
