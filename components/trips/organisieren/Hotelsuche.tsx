'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { BedDouble, CalendarDays, ChevronDown, MapPin, MapPinned, Search, SlidersHorizontal } from 'lucide-react'
import OrtSuche from '@/components/places/OrtSuche'
import type { OrtAuswahl } from '@/lib/places/auswahl'
import { ortBestaetigen } from '@/lib/places/aktionen'
import { hotelDaten } from '@/lib/trips/organisieren/katalog'
import { heutigesDatum } from '@/lib/account/naechste-reise'
import { etappenZeitraumAnzeigen } from '@/lib/trips/datum-anzeige'
import { hotelPlanOrte, hotelPosition } from '@/lib/trips/hotel-suchkontext'
import { STAY22_FILTER, STAY22_WAEHRUNGEN, stay22OrtAusEtappe, stay22Suche, type Stay22Fehlerfeld, type Stay22Filter, type Stay22Ort, type Stay22Suche } from '@/lib/providers/stay22/suche'
import type { Trip, TripStage } from '@/types/trips'
import { Feld } from './Suchfelder'
import Suchkalender from './auswahl/Suchkalender'
import { datumVerschieben } from '@/lib/trips/suchkalender'
import Stay22Ergebnisse from './Stay22Ergebnisse'
import useHotelUmgebung from './useHotelUmgebung'

type Entwurf = {
  anreise: string; abreise: string; erwachsene: number; kinder: number; zimmer: number; waehrung: string
  filter: Stay22Filter; umgebung: string; ortstext: string; karteMitPlan: boolean
  andererOrt: OrtAuswahl | null; suchOrt: Stay22Ort | null
}

export default function Hotelsuche({ reise, start, startOrt, auswahlVersion, etappen }: { reise: Trip; start?: TripStage; startOrt?: string; auswahlVersion: number; etappen: ReactNode }) {
  const startId = start?.id ?? reise.stages[0]?.id ?? 'anderer-ort'
  const eingang = JSON.stringify([startId, startOrt, auswahlVersion])
  const [auswahl, setAuswahl] = useState({ eingang, stageId: startId })
  const [entwuerfe, setEntwuerfe] = useState<Record<string, Entwurf>>({})
  if (auswahl.eingang !== eingang) {
    setAuswahl({ eingang, stageId: startId })
  }
  const stageId = auswahl.eingang === eingang ? auswahl.stageId : startId
  const stage = reise.stages.find(s => s.id === stageId)
  const [kontextOffen, setKontextOffen] = useState(false)
  const initial: Entwurf = entwuerfe[stageId] ?? {
    ...hotelDaten(reise, stage), erwachsene: Math.max(1, reise.travellers), kinder: 0, zimmer: 1,
    waehrung: (STAY22_WAEHRUNGEN as readonly string[]).includes(reise.currency) ? reise.currency : 'CHF',
    filter: { ...STAY22_FILTER }, umgebung: stageId === startId && startOrt ? startOrt : 'etappe', ortstext: '', karteMitPlan: true, andererOrt: null, suchOrt: null,
  }
  return <>
    <div className="stay22-stagebar" role="group" aria-label="Aufenthalt wählen">
      {[...reise.stages].sort((a, b) => a.position - b.position).map((s, index) => {
        const d = hotelDaten(reise, s)
        return <button key={s.id} type="button" aria-pressed={stageId === s.id} onClick={() => setAuswahl({ eingang, stageId: s.id })}>
          <span className="stay22-stage-number">{index + 1}</span><span><b>{s.name}</b><small>{etappenZeitraumAnzeigen(d.anreise, d.abreise) || 'Zeitraum offen'}</small></span>
        </button>
      })}
    </div>
    <HotelSuchformular key={stageId + ':' + eingang} reise={reise} stage={stage} stageId={stageId}
      d={initial}
      waehlen={id => setAuswahl({ eingang, stageId: id })}
      merken={wert => setEntwuerfe(alt => ({ ...alt, [stageId]: { ...(alt[stageId] ?? initial), ...wert } }))} />
    <details className="stay22-stages-more" open={kontextOffen} onToggle={e => setKontextOffen(e.currentTarget.open)}><summary>Alle Reiseziele ansehen</summary>{etappen}</details>
  </>
}

function HotelSuchformular({ reise, stage, stageId, d, waehlen, merken }: {
  reise: Trip; stage?: TripStage; stageId: string; d: Entwurf; waehlen: (id: string) => void; merken: (wert: Partial<Entwurf>) => void
}) {
  const id = useId()
  const [andererOrt, setAndererOrt] = useState(d.andererOrt)
  const [ortLaedt, setOrtLaedt] = useState(false)
  const [ortFehler, setOrtFehler] = useState('')
  const ortAnfrage = useRef(0)
  useEffect(() => () => { ortAnfrage.current += 1 }, [])
  const [gaesteOffen, setGaesteOffen] = useState(false)
  const [fehler, setFehler] = useState('')
  const [fehlerfeld, setFehlerfeld] = useState<Stay22Fehlerfeld | null>(null)
  const [ergebnis, setErgebnis] = useState<Stay22Suche | null>(null)
  const [suchlauf, setSuchlauf] = useState(0)
  const anker = hotelPlanOrte(reise, stage)
  const umgebung = useHotelUmgebung(anker.find(a => a.key === d.umgebung))
  const reset = () => { setErgebnis(null); setFehler(''); setFehlerfeld(null) }
  const patch = (wert: Partial<Entwurf>) => {
    reset()
    merken(wert)
  }
  const ortWaehlen = async (auswahl: OrtAuswahl | null) => {
    setAndererOrt(auswahl)
    patch({ andererOrt: null, suchOrt: null })
    setOrtFehler('')
    const lauf = ++ortAnfrage.current
    setOrtLaedt(Boolean(auswahl))
    if (!auswahl) return
    try {
      const result = await ortBestaetigen(auswahl.id, 'ziel')
      if (lauf !== ortAnfrage.current) return
      if (!result.ok) { setOrtFehler(result.meldung); return }
      const ort = result.wert
      patch({ andererOrt: auswahl, suchOrt: { name: ort.name, adresse: [ort.name, ort.region, ort.country].filter(Boolean).join(', '), latitude: ort.lat, longitude: ort.lon } })
    } catch {
      if (lauf === ortAnfrage.current) setOrtFehler('Der Ort konnte nicht bestätigt werden. Bitte wähle ihn erneut aus.')
    } finally {
      if (lauf === ortAnfrage.current) setOrtLaedt(false)
    }
  }
  const personen = `${d.erwachsene} ${d.erwachsene === 1 ? 'Erwachsener' : 'Erwachsene'}${d.kinder ? `, ${d.kinder} ${d.kinder === 1 ? 'Kind' : 'Kinder'}` : ''}`
  const planDaten = hotelDaten(reise, stage)
  const datumsabweichung = stage && (d.anreise !== planDaten.anreise || d.abreise !== planDaten.abreise)
  return <>
    <form className="org-form stay22-search" onSubmit={e => {
      e.preventDefault()
      reset()
      if (d.umgebung === 'text' && !d.ortstext.trim()) {
        setFehler('Bitte gib eine Adresse oder einen Ort für die Suchumgebung ein.')
        setFehlerfeld('ort')
        e.currentTarget.querySelector<HTMLInputElement>('[name=umgebungstext]')?.focus()
        return
      }
      let ort = stageId === 'anderer-ort' ? d.suchOrt : stay22OrtAusEtappe(stage)
      if (d.umgebung === 'text' && d.ortstext.trim() && ort) {
        ort = { name: d.ortstext.trim(), adresse: `${d.ortstext.trim()}, ${ort.adresse}` }
      } else if (d.umgebung !== 'etappe' && d.umgebung !== 'text') ort = umgebung.ort
      const kartenorte = d.karteMitPlan ? anker.filter(a => hotelPosition(a)).map(a => ({ name: a.kartenname, latitude: a.latitude!, longitude: a.longitude! })) : []
      const basis = stage && hotelPosition(stage)
      if (d.karteMitPlan && basis) kartenorte.unshift({ name: stage.placeId ? stage.name : 'Dein Reiseziel', latitude: basis.lat, longitude: basis.lon })
      if (d.karteMitPlan && umgebung.ort && hotelPosition(umgebung.ort)) kartenorte.push({ name: anker.find(a => a.key === d.umgebung)?.kartenname || umgebung.ort.name, latitude: umgebung.ort.latitude!, longitude: umgebung.ort.longitude! })
      const result = stay22Suche({ ort, ...d, kartenorte, umgebung: d.umgebung !== 'etappe' })
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
      <div className="org-formtop"><h2>Finde deine Unterkunft</h2></div>
      <div className="org-fields">
        <Feld label="Reiseziel"><select name="ort" aria-invalid={fehlerfeld === 'ort'} aria-describedby={fehlerfeld === 'ort' ? `${id}-fehler` : undefined} value={stageId} onChange={e => waehlen(e.target.value)}>
          {reise.stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          <option value="anderer-ort">Anderen Ort suchen</option>
        </select></Feld>
        <Suchkalender start={d.anreise} ende={d.abreise} startLabel="Anreise" endeLabel="Abreise"
          startName="anreise" endeName="abreise" fehler={fehlerfeld} fehlerId={`${id}-fehler`}
          min={heutigesDatum()} max={datumVerschieben(heutigesDatum(), 730)} minTage={1} maxTage={90} naechte
          setzen={(anreise, abreise) => patch({ anreise, abreise })} />
        <button type="button" name="gaeste" aria-describedby={fehlerfeld === 'gaeste' ? `${id}-fehler` : undefined} className="org-field stay22-guestbutton" aria-expanded={gaesteOffen} aria-controls={`${id}-gaeste`} onClick={() => setGaesteOffen(v => !v)}><span>Gäste</span><b>{personen} <ChevronDown size={15} aria-hidden="true" /></b></button>
        <Feld label="Zimmer"><select value={d.zimmer} onChange={e => patch({ zimmer: Number(e.target.value) })}>{Array.from({ length: Math.min(d.erwachsene, 8) }, (_, i) => <option key={i} value={i + 1}>{i + 1} Zimmer</option>)}</select></Feld>
        <button type="submit" className="org-go" disabled={ortLaedt || umgebung.laedt}><Search aria-hidden="true" /> Suchen</button>
      </div>
      {stageId === 'anderer-ort' ? <div className="stay22-other-place"><label htmlFor={`${id}-ort`}>Stadt, Insel oder Region</label><OrtSuche rolle="ziel" variante="field" value={andererOrt} inputId={`${id}-ort`} ungueltig={fehlerfeld === 'ort' || Boolean(ortFehler)} describedBy={fehlerfeld === 'ort' ? `${id}-fehler` : ortFehler ? `${id}-ortfehler` : undefined} placeholder="Wohin möchtest du reisen?" inputClassName="stay22-placeinput" onChange={ortWaehlen} /><p>Diese Suche ändert deine Reiseetappen nicht.</p>{ortLaedt ? <p role="status">Reiseziel wird bestätigt …</p> : null}{ortFehler ? <p role="alert" id={`${id}-ortfehler`}>{ortFehler}</p> : null}</div> : null}
      {gaesteOffen ? <fieldset id={`${id}-gaeste`} className="stay22-guests"><legend>Belegung für die Suche</legend>
        <Feld label="Erwachsene"><select value={d.erwachsene} onChange={e => { const n = Number(e.target.value); patch({ erwachsene: n, zimmer: Math.min(n, d.zimmer) }) }}>{d.erwachsene > 9 ? <option value={d.erwachsene} disabled>{d.erwachsene} – Gruppe aufteilen</option> : null}{Array.from({ length: 9 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></Feld>
        <Feld label="Kinder"><select value={d.kinder} onChange={e => patch({ kinder: Number(e.target.value) })}>{Array.from({ length: 9 }, (_, i) => <option key={i} value={i}>{i}</option>)}</select></Feld>
        <p>Bitte prüfe die Aufteilung deiner Reisegruppe. Kinderalter und genaue Zimmerbelegung bestätigst du beim Buchungsanbieter.</p>
      </fieldset> : null}
      {stage ? <div className="stay22-datecontext"><CalendarDays size={15} aria-hidden="true" />{datumsabweichung ? <>Eigener Suchzeitraum <button type="button" onClick={() => patch(planDaten)}>Reisedaten übernehmen</button></> : planDaten.anreise && planDaten.abreise ? 'Aufenthaltsdaten aus deinem Reiseplan' : 'Ergänze die Aufenthaltsdaten für diese Etappe.'}</div> : null}
      <div className="stay22-location">
        <div className="stay22-location-title"><MapPin size={19} aria-hidden="true" /><div><strong>Die passende Lage für deine Reise</strong><p>Rund um dein Ziel oder nahe einem bestimmten Ort suchen.</p></div></div>
        <div className="stay22-location-fields"><label>Suchumgebung<select value={d.umgebung} onChange={e => patch({ umgebung: e.target.value })}>
          <option value="etappe">Rund um {stage?.name || d.suchOrt?.name || 'dein Reiseziel'}</option>
          {anker.map(a => <option key={a.key} value={a.key}>Reiseplan · {a.name}</option>)}
          <option value="text">Adresse oder Sehenswürdigkeit</option>
        </select></label>
        {d.umgebung === 'text' ? <label>Ort in {stage?.name || d.suchOrt?.name || 'deinem Reiseziel'}<input name="umgebungstext" aria-invalid={fehlerfeld === 'ort'} aria-describedby={fehlerfeld === 'ort' ? `${id}-fehler` : undefined} value={d.ortstext} required maxLength={160} placeholder="z. B. Bahnhof, Strand oder Sehenswürdigkeit" onChange={e => patch({ ortstext: e.target.value })} /></label> : null}
        {stage && hotelPosition(stage) ? <label className="stay22-mapcheck"><input type="checkbox" checked={d.karteMitPlan} onChange={e => patch({ karteMitPlan: e.target.checked })} /> Reiseorte auf der Karte zeigen</label> : null}</div>
        {umgebung.laedt ? <p role="status">Reiseort wird bestätigt …</p> : umgebung.fehler ? <p role="alert">{umgebung.fehler}</p> : d.umgebung !== 'etappe' && d.umgebung !== 'text' ? <p>Die Suche nutzt diesen Ort und behält deinen Aufenthaltszeitraum bei.</p> : null}
      </div>
      <div className="stay22-filters" role="group" aria-label="Suchfilter">
        <label>Hotelsterne<select name="filter" value={d.filter.sterne} onChange={e => patch({ filter: { ...d.filter, sterne: Number(e.target.value) } })}><option value="0">Alle Sterne</option>{[3, 4, 5].map(n => <option key={n} value={n}>{n === 5 ? '5 Sterne' : `Ab ${n} Sternen`}</option>)}</select></label>
        <label>Gästebewertung<select value={d.filter.bewertung} onChange={e => patch({ filter: { ...d.filter, bewertung: Number(e.target.value) } })}><option value="0">Alle</option>{[7, 8, 9].map(n => <option key={n} value={n}>Ab {n}/10</option>)}</select></label>
        <label>Preisanzeige<select value={d.filter.preis} onChange={e => patch({ filter: { ...d.filter, preis: e.target.value as Stay22Filter['preis'] } })}><option value="total">Gesamtpreis</option><option value="nightly">Pro Nacht</option></select></label>
        <label>Währung<select name="waehrung" value={d.waehrung} onChange={e => patch({ waehrung: e.target.value })}>{STAY22_WAEHRUNGEN.map(w => <option key={w}>{w}</option>)}</select></label>
        {d.filter.sterne > 0 || d.filter.bewertung > 0 ? <button type="button" className="stay22-smallbutton" onClick={() => patch({ filter: { ...d.filter, sterne: 0, bewertung: 0 } })}>Filter zurücksetzen</button> : null}
      </div>
      {fehler ? <p role="alert" id={`${id}-fehler`} className="stay22-error">{fehler}</p> : null}
    </form>
    {ergebnis ? <Stay22Ergebnisse key={suchlauf} suche={ergebnis} schliessen={() => setErgebnis(null)} /> : <div className="stay22-intro">
      <div><h2>Dein Aufenthalt. Deine passende Lage.</h2><p>Entdecke Unterkünfte mit Originalbildern und Preisen für deine Reisedaten.</p></div>
      <div className="stay22-features"><span><BedDouble aria-hidden="true" /> Hotels & Ferienwohnungen</span><span><SlidersHorizontal aria-hidden="true" /> Budget & Bewertungen</span><span><MapPinned aria-hidden="true" /> Reiseorte auf der Karte</span></div>
    </div>}
  </>
}
