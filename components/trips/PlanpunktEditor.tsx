'use client'

import * as React from 'react'
import { ART_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'
import { GRENZEN, planpunktFormularSchema, type PlanpunktFormular } from '@/lib/trips/schema'
import { KONFLIKT, allePlanpunkte, manuellBearbeitbar, manuellerInhaltSchema, punktAendern, type PlanAenderung } from '@/lib/trips/trip-plan-integrated/manual'
import { aenderungsAuswirkung, planSnapshot } from '@/lib/trips/trip-plan-integrated/day'
import { sichtbaresZielUrteil } from '@/lib/trips/trip-plan-editing-placement-recovery-1'
import { TRIP_ITEM_KINDS, type Trip, type TripItem, type TripItemKind } from '@/types/trips'

const feld = 'min-h-11 w-full min-w-0 max-w-full rounded-xl border border-line-200 bg-white px-3 py-2 text-base focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/10'
const knopf = 'min-w-0 max-w-full whitespace-normal [overflow-wrap:anywhere] min-h-11 rounded-full border border-line-300 px-4 py-2 text-sm font-semibold text-brand-800 focus-visible:ring-4 focus-visible:ring-brand-600/15'

function entwurfLesen(werte: {
  title: string
  note: string
  startsOn: string
  startsAt: string
  endsOn: string
  endsAt: string
  dayId: string
}) {
  return JSON.stringify(werte)
}

/** Mounted per trip/item/day/editor generation. A late response cannot close another form. */
export default function PlanpunktEditor({
  reise,
  tagId,
  item,
  generation,
  onAnlegen,
  onBearbeiten,
  onFertig,
  onAbbrechen,
  operationBeginnen,
  operationAktuell,
}: {
  reise: Trip
  tagId: string
  item?: TripItem
  generation: number
  onAnlegen: (tagId: string, values: PlanpunktFormular) => Promise<string | null>
  onBearbeiten?: (original: TripItem, change: PlanAenderung) => Promise<string | null>
  onFertig: () => void
  onAbbrechen: () => void
  operationBeginnen: () => number
  operationAktuell: (id: number) => boolean
}) {
  const [original] = React.useState(item)
  const [clientRef] = React.useState(() => crypto.randomUUID())
  const [kind, setKind] = React.useState<TripItemKind>(item?.kind ?? 'activity')
  const [title, setTitle] = React.useState(item?.title ?? '')
  const [note, setNote] = React.useState(item?.note ?? '')
  // Only NEW forms visibly suggest the selected date. Existing null stays null.
  const [startsOn, setStartsOn] = React.useState(item ? item.startsOn ?? '' : reise.days.find(day => day.id === tagId)?.dayDate ?? '')
  const [startsAt, setStartsAt] = React.useState(item?.startsAt ?? '')
  const [endsOn, setEndsOn] = React.useState(item?.endsOn ?? '')
  const [endsAt, setEndsAt] = React.useState(item?.endsAt ?? '')
  const [dayId, setDayId] = React.useState(item ? item.dayId ?? '' : tagId)
  const [fehler, setFehler] = React.useState('')
  const [phase, setPhaseState] = React.useState<'bereit' | 'speichert' | 'warteAufBestaetigung' | 'beobachte'>('bereit')
  const [operationId, setOperationId] = React.useState(0)
  const [eingefroren, setEingefroren] = React.useState<string | null>(null)
  const [erwartet, setErwartet] = React.useState<TripItem | null>(null)
  const phaseRef = React.useRef(phase)
  const lebendig = React.useRef(true)
  const schreibt = React.useRef(false)
  const gemeldet = React.useRef(false)
  const operationRef = React.useRef(0)
  const entwurfBeiSubmit = React.useRef<string | null>(null)
  const erwartetRef = React.useRef<TripItem | null>(null)
  const reiseRef = React.useRef(reise)
  const generationRef = React.useRef(generation)
  const onFertigRef = React.useRef(onFertig)
  const operationAktuellRef = React.useRef(operationAktuell)
  const formular = React.useRef<HTMLFormElement>(null)
  React.useLayoutEffect(() => {
    phaseRef.current = phase
    if (phase !== 'speichert' && phase !== 'warteAufBestaetigung') schreibt.current = false
    reiseRef.current = reise
    generationRef.current = generation
    onFertigRef.current = onFertig
    operationAktuellRef.current = operationAktuell
  }, [phase, reise, generation, onFertig, operationAktuell])
  const laeuft = phase === 'speichert' || phase === 'warteAufBestaetigung'
  const setPhase = (naechste: typeof phase) => {
    phaseRef.current = naechste
    setPhaseState(naechste)
  }
  const entwurfJetzt = () => entwurfLesen({ title, note, startsOn, startsAt, endsOn, endsAt, dayId })
  const entwurfGleich = () => entwurfBeiSubmit.current !== null && entwurfBeiSubmit.current === entwurfJetzt()
  const besitzt = (operationId: number) =>
    lebendig.current && operationAktuellRef.current(operationId) && generationRef.current === generation && operationRef.current === operationId
  const urteil = (graph: Trip, ziel: TripItem | null) => {
    if (!original || !ziel) return 'fremd' as const
    return sichtbaresZielUrteil(
      allePlanpunkte(graph).filter((punkt) => punkt.id === original.id),
      original,
      ziel,
    )
  }
  const fertig = () => {
    if (gemeldet.current) return
    gemeldet.current = true
    onFertigRef.current()
  }
  const entwurfGleichState = eingefroren !== null && eingefroren === entwurfJetzt()
  const eigene = original != null && operationId !== 0 && operationAktuell(operationId)
  if (eigene && (phase === 'warteAufBestaetigung' || phase === 'beobachte')) {
    const stand = urteil(reise, erwartet)
    if (phase === 'warteAufBestaetigung' && !(stand === 'erwartet' && entwurfGleichState)) {
      if (stand !== 'original') setFehler(KONFLIKT)
      setPhaseState('beobachte')
    } else if (phase === 'beobachte' && !entwurfGleichState) {
      setPhaseState('bereit')
    } else if (phase === 'beobachte' && (stand === 'version' || stand === 'fremd') && fehler !== KONFLIKT) {
      setFehler(KONFLIKT)
    }
  }

  React.useEffect(() => {
    lebendig.current = true
    formular.current?.querySelector<HTMLElement>('input,select')?.focus()
    return () => { lebendig.current = false }
  }, [])
  React.useEffect(() => {
    if (fehler) formular.current?.querySelector<HTMLElement>('[role="alert"]')?.focus()
  }, [fehler])
  React.useEffect(() => {
    if (!eigene || !entwurfGleichState || !original || !erwartet) return
    if (phase !== 'warteAufBestaetigung' && phase !== 'beobachte') return
    const stand = sichtbaresZielUrteil(
      allePlanpunkte(reise).filter((punkt) => punkt.id === original.id),
      original,
      erwartet,
    )
    if (stand !== 'erwartet') return
    if (gemeldet.current) return
    gemeldet.current = true
    onFertigRef.current()
  }, [eigene, entwurfGleichState, phase, reise, erwartet, original])

  const inhaltErlaubt = original ? manuellBearbeitbar(original) : kind === 'activity' || kind === 'note'
  const values = {
    kind,
    title,
    note: note || null,
    startsOn: inhaltErlaubt ? startsOn || null : null,
    startsAt: inhaltErlaubt ? startsAt || null : null,
    endsOn: inhaltErlaubt ? endsOn || null : null,
    endsAt: inhaltErlaubt ? endsAt || null : null,
  }
  let preview: ReturnType<typeof aenderungsAuswirkung> = null
  if (original) {
    try {
      const change: PlanAenderung = inhaltErlaubt
        ? { art: 'inhalt', inhalt: manuellerInhaltSchema.parse(values), dayId: dayId || null }
        : { art: 'platzierung', dayId: dayId || null }
      preview = aenderungsAuswirkung(planSnapshot(reise), planSnapshot(punktAendern(reise, original, change)))
    } catch { /* Invalid or stale draft has no authoritative preview. Save still reports the error. */ }
  }
  const speichern = async (event: React.FormEvent) => {
    event.preventDefault()
    if (schreibt.current) return
    const parsed = (inhaltErlaubt ? manuellerInhaltSchema : planpunktFormularSchema).safeParse(values)
    if (!parsed.success) {
      setFehler(parsed.error.issues[0]?.message ?? 'Bitte prüfe deine Angaben.')
      return
    }
    const naechsteOperation = operationBeginnen()
    operationRef.current = naechsteOperation
    setOperationId(naechsteOperation)
    const snapshot = entwurfJetzt()
    entwurfBeiSubmit.current = snapshot
    setEingefroren(snapshot)
    gemeldet.current = false
    schreibt.current = true
    setPhase('speichert')
    setFehler('')
    try {
      let error: string | null
      if (original) {
        if (!onBearbeiten) {
          setPhase('bereit')
          return
        }
        const change: PlanAenderung = inhaltErlaubt
          ? { art: 'inhalt', inhalt: manuellerInhaltSchema.parse(values), dayId: dayId || null }
          : { art: 'platzierung', dayId: dayId || null }
        let erwartet: TripItem
        try {
          const nachher = punktAendern(reiseRef.current, original, change)
          const treffer = allePlanpunkte(nachher).filter((punkt) => punkt.id === original.id)
          if (treffer.length !== 1) throw new Error(KONFLIKT)
          erwartet = treffer[0]!
        } catch (ursache) {
          setFehler(ursache instanceof Error ? ursache.message : KONFLIKT)
          setPhase('bereit')
          return
        }
        erwartetRef.current = erwartet
        setErwartet(erwartet)
        error = await onBearbeiten(original, change)
      } else {
        if (!tagId) {
          setPhase('bereit')
          return
        }
        error = await onAnlegen(tagId, { ...parsed.data, clientRef })
      }
      if (!besitzt(naechsteOperation)) return
      if (!original) {
        if (error) setFehler(error)
        else fertig()
        setPhase('bereit')
        return
      }
      if (error) {
        const stand = urteil(reiseRef.current, erwartetRef.current)
        setFehler(stand === 'fremd' ? KONFLIKT : error)
        setPhase('bereit')
        return
      }
      const stand = urteil(reiseRef.current, erwartetRef.current)
      if (stand === 'erwartet' && entwurfGleich()) {
        fertig()
        setPhase('bereit')
        return
      }
      if (stand === 'original') {
        setPhase('warteAufBestaetigung')
        return
      }
      setFehler(KONFLIKT)
      setPhase('beobachte')
    } catch {
      if (besitzt(naechsteOperation)) {
        setFehler('Der Punkt konnte nicht gespeichert werden. Deine Eingabe bleibt erhalten.')
        setPhase('bereit')
      }
    } finally {
      if (phaseRef.current !== 'warteAufBestaetigung') schreibt.current = false
    }
  }
  return <form ref={formular} aria-label={item ? `Punkt bearbeiten: ${item.title}` : 'Punkt hinzufügen'} aria-busy={laeuft}
    onSubmit={speichern} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); event.preventDefault(); if (!laeuft) onAbbrechen() } }}
    data-planpunkt-editor=""
    className="mt-4 grid min-w-0 grid-cols-1 gap-4 py-4 [overflow-wrap:anywhere] sm:rounded-2xl sm:border sm:border-line-200 sm:bg-surface-50 sm:p-4">
    <h4 className="text-lg font-semibold text-brand-800">{original ? 'Punkt bearbeiten' : 'Neuer Punkt'}</h4>
    {!original && <label className="grid min-w-0 gap-1 text-sm">Art<select disabled={laeuft} className={feld} value={kind} onChange={e => setKind(e.target.value as TripItemKind)}>
      {TRIP_ITEM_KINDS.map(value => <option key={value} value={value}>{ART_BEZEICHNUNG[value]}</option>)}
    </select></label>}
    {(!original || inhaltErlaubt) && <>
      <label className="grid min-w-0 gap-1 text-sm">Ort oder Aktivität<input disabled={laeuft} className={feld} value={title} maxLength={GRENZEN.titel} required onChange={e => setTitle(e.target.value)} /></label>
      <label className="grid min-w-0 gap-1 text-sm">Notiz, optional<textarea disabled={laeuft} className={feld} value={note} maxLength={GRENZEN.notiz} rows={3} onChange={e => setNote(e.target.value)} /></label>
    </>}
    {inhaltErlaubt ? <>
      <p className="text-xs leading-5 text-ink-700">Ortszeiten laut deinem Plan. Leere Felder bleiben unbekannt. Ein vorbelegtes Datum wird erst beim Speichern übernommen; die Tageszuordnung ersetzt kein Datum.</p>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <label className="grid min-w-0 gap-1 text-sm">Anfangsdatum, optional<input disabled={laeuft} className={feld} type="date" value={startsOn} onChange={e => setStartsOn(e.target.value)} /></label>
        <label className="grid min-w-0 gap-1 text-sm">Anfangszeit, optional<input disabled={laeuft} className={feld} type="time" value={startsAt} onChange={e => setStartsAt(e.target.value)} /></label>
        <label className="grid min-w-0 gap-1 text-sm">Enddatum, optional<input disabled={laeuft} className={feld} type="date" value={endsOn} onChange={e => setEndsOn(e.target.value)} /></label>
        <label className="grid min-w-0 gap-1 text-sm">Endzeit, optional<input disabled={laeuft} className={feld} type="time" value={endsAt} onChange={e => setEndsAt(e.target.value)} /></label>
      </div>
    </> : <p className="text-sm leading-6 text-ink-700">Flugroute, Unterkunftszeitraum und Mobilitätsangaben bearbeitest du in der jeweiligen Detailansicht. Die Tageszuordnung ändert diese Angaben nicht.</p>}
    {original && <label className="grid min-w-0 gap-1 text-sm">Zuordnung im Tagesplan<select disabled={laeuft} className={feld} value={dayId} onChange={e => setDayId(e.target.value)}>
      <option value="">Noch nicht eingeplant</option>{reise.days.map(day => <option key={day.id} value={day.id}>Tag {day.dayIndex}{day.dayDate ? ` · ${day.dayDate}` : ''}</option>)}
    </select></label>}
    {preview && preview.changed.length > 0 && <p data-plan-preview className="text-xs leading-5 text-ink-700">
      Nach dem Speichern werden die Tagesinformationen neu ausgewertet. {preview.count} nachweislich verknüpfte Vorbereitungspunkte wären zu prüfen. Weitere Beziehungen sind nicht belegt. Es werden keine anderen Punkte verschoben.
    </p>}
    {laeuft && <p role="status" className="text-sm text-ink-700">Planpunkt wird gespeichert …</p>}
    {fehler && <p role="alert" tabIndex={-1} className="rounded text-sm text-danger-600 focus-visible:ring-4 focus-visible:ring-brand-600/15">{fehler}</p>}
    <div className="flex flex-wrap justify-end gap-2"><button type="button" className={knopf} disabled={laeuft} onClick={onAbbrechen}>Abbrechen</button>
      <button type="submit" disabled={laeuft} className={`${knopf} bg-brand-800 text-white`}>{laeuft ? 'Speichern …' : 'Speichern'}</button></div>
  </form>
}
