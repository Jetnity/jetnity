'use client'

import * as React from 'react'
import { ART_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'
import { GRENZEN, planpunktFormularSchema, type PlanpunktFormular } from '@/lib/trips/schema'
import { manuellBearbeitbar, manuellerInhaltSchema, punktAendern, type PlanAenderung } from '@/lib/trips/trip-plan-integrated/manual'
import { aenderungsAuswirkung, planSnapshot } from '@/lib/trips/trip-plan-integrated/day'
import { TRIP_ITEM_KINDS, type Trip, type TripItem, type TripItemKind } from '@/types/trips'

const feld = 'min-h-11 w-full min-w-0 max-w-full rounded-xl border border-line-200 bg-white px-3 py-2 text-base focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/10'
const knopf = 'min-h-11 rounded-full border border-line-300 px-4 py-2 text-sm font-semibold text-brand-800 focus-visible:ring-4 focus-visible:ring-brand-600/15'

/** Mounted per trip/day/editor. A late response cannot close another form. */
export default function PlanpunktEditor({ reise, tagId, item, onAnlegen, onBearbeiten, onFertig, onAbbrechen }: {
  reise: Trip; tagId: string; item?: TripItem
  onAnlegen: (tagId: string, values: PlanpunktFormular) => Promise<string | null>
  onBearbeiten?: (original: TripItem, change: PlanAenderung) => Promise<string | null>
  onFertig: () => void; onAbbrechen: () => void
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
  const [laeuft, setLaeuft] = React.useState(false)
  const lebendig = React.useRef(true)
  const schreibt = React.useRef(false)
  const formular = React.useRef<HTMLFormElement>(null)
  React.useEffect(() => { lebendig.current = true; formular.current?.querySelector<HTMLElement>('input,select')?.focus(); return () => { lebendig.current = false } }, [])
  const inhaltErlaubt = original ? manuellBearbeitbar(original) : kind === 'activity' || kind === 'note'
  const values = { kind, title, note: note || null, startsOn: inhaltErlaubt ? startsOn || null : null,
    startsAt: inhaltErlaubt ? startsAt || null : null, endsOn: inhaltErlaubt ? endsOn || null : null, endsAt: inhaltErlaubt ? endsAt || null : null }
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
    if (!parsed.success) { setFehler(parsed.error.issues[0]?.message ?? 'Bitte prüfe deine Angaben.'); return }
    schreibt.current = true; setLaeuft(true); setFehler('')
    try {
      let error: string | null
      if (original) {
        if (!onBearbeiten) return
        const change: PlanAenderung = inhaltErlaubt
          ? { art: 'inhalt', inhalt: manuellerInhaltSchema.parse(values), dayId: dayId || null }
          : { art: 'platzierung', dayId: dayId || null }
        error = await onBearbeiten(original, change)
      } else error = await onAnlegen(tagId, { ...parsed.data, clientRef })
      if (!lebendig.current) return
      if (error) setFehler(error)
      else onFertig()
    } catch { if (lebendig.current) setFehler('Der Punkt konnte nicht gespeichert werden. Deine Eingabe bleibt erhalten.') }
    finally { schreibt.current = false; if (lebendig.current) setLaeuft(false) }
  }
  return <form ref={formular} aria-label={item ? `Punkt bearbeiten: ${item.title}` : 'Punkt hinzufügen'} aria-busy={laeuft}
    onSubmit={speichern} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); event.preventDefault(); if (!laeuft) onAbbrechen() } }}
    className="mt-4 grid min-w-0 gap-4 rounded-2xl border border-line-200 bg-surface-50 p-4">
    <h4 className="text-lg font-semibold text-brand-800">{original ? 'Punkt bearbeiten' : 'Neuer Punkt'}</h4>
    {!original && <label className="grid min-w-0 gap-1 text-sm">Art<select className={feld} value={kind} onChange={e => setKind(e.target.value as TripItemKind)}>
      {TRIP_ITEM_KINDS.map(value => <option key={value} value={value}>{ART_BEZEICHNUNG[value]}</option>)}
    </select></label>}
    {(!original || inhaltErlaubt) && <>
      <label className="grid min-w-0 gap-1 text-sm">Ort oder Aktivität<input className={feld} value={title} maxLength={GRENZEN.titel} required onChange={e => setTitle(e.target.value)} /></label>
      <label className="grid min-w-0 gap-1 text-sm">Notiz, optional<textarea className={feld} value={note} maxLength={GRENZEN.notiz} rows={3} onChange={e => setNote(e.target.value)} /></label>
    </>}
    {inhaltErlaubt ? <>
      <p className="text-xs leading-5 text-ink-700">Ortszeiten laut deinem Plan. Leere Felder bleiben unbekannt. Ein vorbelegtes Datum wird erst beim Speichern übernommen; die Tageszuordnung ersetzt kein Datum.</p>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <label className="grid min-w-0 gap-1 text-sm">Anfangsdatum, optional<input className={feld} type="date" value={startsOn} onChange={e => setStartsOn(e.target.value)} /></label>
        <label className="grid min-w-0 gap-1 text-sm">Anfangszeit, optional<input className={feld} type="time" value={startsAt} onChange={e => setStartsAt(e.target.value)} /></label>
        <label className="grid min-w-0 gap-1 text-sm">Enddatum, optional<input className={feld} type="date" value={endsOn} onChange={e => setEndsOn(e.target.value)} /></label>
        <label className="grid min-w-0 gap-1 text-sm">Endzeit, optional<input className={feld} type="time" value={endsAt} onChange={e => setEndsAt(e.target.value)} /></label>
      </div>
    </> : <p className="text-sm leading-6 text-ink-700">Flugroute, Unterkunftszeitraum und Mobilitätsangaben bearbeitest du in der jeweiligen Detailansicht. Die Tageszuordnung ändert diese Angaben nicht.</p>}
    {original && <label className="grid min-w-0 gap-1 text-sm">Zuordnung im Tagesplan<select className={feld} value={dayId} onChange={e => setDayId(e.target.value)}>
      <option value="">Noch nicht eingeplant</option>{reise.days.map(day => <option key={day.id} value={day.id}>Tag {day.dayIndex}{day.dayDate ? ` · ${day.dayDate}` : ''}</option>)}
    </select></label>}
    {preview && preview.changed.length > 0 && <p data-plan-preview className="text-xs leading-5 text-ink-700">
      Nach dem Speichern werden die Tagesinformationen neu ausgewertet. {preview.count} nachweislich verknüpfte Vorbereitungspunkte wären zu prüfen. Weitere Beziehungen sind nicht belegt. Es werden keine anderen Punkte verschoben.
    </p>}
    {fehler && <p role="alert" className="text-sm text-danger-600">{fehler}</p>}
    <div className="flex flex-wrap justify-end gap-2"><button type="button" className={knopf} disabled={laeuft} onClick={onAbbrechen}>Abbrechen</button>
      <button type="submit" disabled={laeuft} className={`${knopf} bg-brand-800 text-white`}>{laeuft ? 'Speichern …' : 'Speichern'}</button></div>
  </form>
}
