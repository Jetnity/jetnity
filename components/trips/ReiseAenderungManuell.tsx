'use client'
import * as React from 'react'
import { useWorkspaceEditSurface } from './TripWorkspaceEditSurface'
import { workspaceEditFocus } from '@/lib/trips/workspace-edit-focus'
import ReiseAenderungAuswirkungen from './ReiseAenderungAuswirkungen'
import { manuelleAenderungVorschau, manuelleAenderungUebernehmen } from '@/lib/reiseaenderung/aktionen'
import { manuellVorschau, type ManuelleVorschau } from '@/lib/reiseaenderung/direct/speichern'
import { gastManuellSpeichern } from '@/lib/reiseaenderung/direct/gast'
import { manuellerEntwurf, vorschauKennungen, type ManuellerEntwurf } from '@/lib/reiseaenderung/direct/entwurf'
import { UNGEWISS } from '@/lib/reiseaenderung/direct/bestaetigung'
import { TEMPO_BEZEICHNUNG, INTERESSE_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'
import { GRENZEN } from '@/lib/trips/schema'
import { TRIP_PACES, TRIP_INTERESTS, type Trip, type TripSource } from '@/types/trips'

const input = 'w-full min-w-0 rounded-xl border border-line-200 bg-white px-3 py-3 text-base text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:opacity-60'
const button = 'min-h-12 rounded-full border border-line-200 px-5 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-50'
const probeSeed = '00000000-0000-4000-8000-000000000000'
type Props = { reise: Trip; quelle: TripSource; onGespeichert: (trip?: Trip) => void; onSperre: (busy: boolean) => void; onNeu: () => void }
export default function ReiseAenderungManuell({ reise, quelle, onGespeichert, onSperre, onNeu }: Props) {
  const surface = useWorkspaceEditSurface()
  const [gruppe, setGruppe] = React.useState<'grunddaten' | 'zeitraum' | 'etappen'>('grunddaten')
  const [basis] = React.useState(reise)
  const [form, setForm] = React.useState(() => ({ title: reise.title, budgetAmount: reise.budgetAmount?.toString() ?? '', pace: reise.pace,
    interests: reise.interests, travelWish: reise.travelWish ?? '', startDate: reise.startDate ?? '', duration: String(reise.days.length),
    stages: reise.stages.map(s => ({ id: s.id, days: String(reise.days.filter(d => d.stageId === s.id).length), remove: false })) }))
  const [dauerArt, setDauerArt] = React.useState<'gesamt' | 'etappen'>('gesamt')
  const [vorschau, setVorschau] = React.useState<ManuelleVorschau | null>(null)
  const [pending, setPending] = React.useState(false)
  const [ungewiss, setUngewiss] = React.useState(false)
  const [meldung, setMeldung] = React.useState('')
  const [erfolg, setErfolg] = React.useState<Trip | null>(null)
  const [versucht, setVersucht] = React.useState(false)
  const alive = React.useRef(true), flight = React.useRef(false), generation = React.useRef(0)
  const root = React.useRef<HTMLDivElement>(null), heading = React.useRef<HTMLHeadingElement>(null), alert = React.useRef<HTMLParagraphElement>(null)
  const source = React.useRef({ id: reise.id, revision: reise.revision, quelle })
  const stale = reise.id !== basis.id || reise.revision !== basis.revision
  React.useEffect(() => { alive.current = true; workspaceEditFocus(root.current?.querySelector<HTMLInputElement>('[data-aenderung-start]') ?? null); return () => { alive.current = false } }, [])
  React.useEffect(() => { source.current = { id: reise.id, revision: reise.revision, quelle } }, [reise.id, reise.revision, quelle])
  React.useLayoutEffect(() => { onSperre(pending || ungewiss); return () => onSperre(false) }, [pending, ungewiss, onSperre])
  React.useEffect(() => {
    if (vorschau || erfolg) workspaceEditFocus(heading.current)
    else workspaceEditFocus(root.current?.querySelector<HTMLElement>('[id^="edit-group-"]:not([hidden]) input:not(:disabled)') ?? null)
  }, [vorschau, erfolg])
  React.useEffect(() => { if (meldung) workspaceEditFocus(alert.current) }, [meldung])

  const eingabe: ManuellerEntwurf = {}
  if (form.title !== basis.title) eingabe.title = form.title
  if (form.budgetAmount !== (basis.budgetAmount?.toString() ?? '')) eingabe.budgetAmount = form.budgetAmount.trim() === '' ? NaN : Number(form.budgetAmount)
  if (form.pace !== basis.pace) eingabe.pace = form.pace
  if (JSON.stringify([...form.interests].sort()) !== JSON.stringify([...basis.interests].sort())) eingabe.interests = form.interests
  if (form.travelWish !== (basis.travelWish ?? '')) eingabe.travelWish = form.travelWish
  if (form.startDate !== (basis.startDate ?? '')) eingabe.startDate = form.startDate
  let total = basis.days.length
  if (dauerArt === 'gesamt') {
    if (form.duration !== String(basis.days.length)) eingabe.duration = form.duration.trim() === '' ? NaN : Number(form.duration)
  } else {
    eingabe.stages = form.stages.flatMap<NonNullable<ManuellerEntwurf['stages']>[number]>(s => {
      const days = basis.days.filter(d => d.stageId === s.id).length
      const count = s.days.trim() === '' ? NaN : Number(s.days)
      total += (s.remove ? 0 : count) - days
      return s.remove ? [{ id: s.id, remove: true as const }] : count !== days ? [{ id: s.id, days: count }] : []
    })
    eingabe.duration = total
  }
  const validation = manuellerEntwurf(basis, eingabe, vorschauKennungen(probeSeed), quelle)
  const errorId = React.useId()
  const invalid = (field: string) => versucht && !validation.ok && validation.feld === field
  const update = (next: typeof form) => { if (flight.current || ungewiss) return; generation.current++; setForm(next); setVorschau(null); setMeldung(''); setVersucht(false) }
  const validGeneration = (own: number) => alive.current && own === generation.current && source.current.id === basis.id && source.current.revision === basis.revision && source.current.quelle === quelle
  const groupHeading = React.useRef<HTMLHeadingElement>(null)
  const selectGroup = (value: typeof gruppe) => { setGruppe(value); requestAnimationFrame(() => workspaceEditFocus(groupHeading.current)) }
  const preview = async (e: React.FormEvent) => {
    e.preventDefault(); setVersucht(true)
    if (flight.current || stale) return
    if (!validation.ok) {
      if (['title', 'budgetAmount', 'pace', 'interests', 'travelWish'].includes(validation.feld)) setGruppe('grunddaten')
      else if (validation.feld === 'startDate' || validation.feld === 'duration') setGruppe('zeitraum')
      else if (validation.feld === 'stages') setGruppe('etappen')
      requestAnimationFrame(() => workspaceEditFocus(root.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? document.getElementById(errorId)))
      return
    }
    flight.current = true; setPending(true); setMeldung('')
    const own = ++generation.current
    try {
      const seed = crypto.randomUUID()
      const result = quelle === 'guest' ? await manuellVorschau(basis, eingabe, seed)
        : await manuelleAenderungVorschau({ tripId: basis.id, basisRevision: basis.revision, seed, eingabe })
      if (!validGeneration(own)) return
      if (!result.ok) setMeldung(result.meldung)
      else setVorschau(result.vorschau)
    } catch { if (validGeneration(own)) setMeldung('Die Vorschau ist gerade nicht verfügbar. Deine Eingaben bleiben erhalten.') }
    finally { flight.current = false; if (alive.current) setPending(false) }
  }
  const save = async (nurPruefen = false) => {
    if (!vorschau || flight.current || stale) return
    flight.current = true; setPending(true); setMeldung('')
    const own = ++generation.current
    try {
      const request = { ...vorschau.anfrage, nurPruefen }
      const result = quelle === 'guest' ? await gastManuellSpeichern(request) : await manuelleAenderungUebernehmen(request)
      if (!validGeneration(own)) return
      if (!result.ok) { setMeldung(result.meldung); setUngewiss(result.art === 'ungewiss' || (ungewiss && result.art === 'unverfuegbar')); return }
      setUngewiss(false); setErfolg(result.reise); setVorschau(null); onGespeichert(result.reise)
    } catch { if (validGeneration(own)) { setMeldung(UNGEWISS); setUngewiss(true) } }
    finally { flight.current = false; if (alive.current) setPending(false) }
  }
  if (erfolg) return <div ref={root} className="mt-5 grid gap-4 rounded-3xl bg-white p-5 sm:p-7">
    <h2 ref={heading} tabIndex={-1} className="text-xl font-semibold text-brand-900 sm:text-2xl">Änderung gespeichert und bestätigt</h2>
    <p role="status">„{erfolg.title}“ wurde erneut aus {quelle === 'guest' ? 'diesem Browserspeicher' : 'deinem Konto'} gelesen. Der Arbeitsbereich zeigt den bestätigten Stand mit {erfolg.days.length} Tagen.</p>
    <div className="flex flex-wrap gap-3">{surface && <button type="button" className={`${button} bg-brand-800 text-white`} onClick={surface.close}>Zur gespeicherten Reise</button>}<button type="button" className={button} onClick={onNeu}>Weitere Änderung vorbereiten</button></div>
  </div>
  return <div ref={root} data-aenderung-sperre={pending || ungewiss ? 'true' : 'false'} className="mt-5 min-w-0 [overflow-wrap:anywhere] rounded-3xl border border-line-200 bg-white p-[16px] sm:p-5">
    <h2 ref={heading} tabIndex={-1} className="text-xl font-semibold text-brand-900 sm:text-2xl">{vorschau ? 'Auswirkungen prüfen' : 'Reise direkt bearbeiten'}</h2>
    <p className="mt-2 text-sm leading-6">{vorschau ? 'Noch nicht gespeichert. Prüfe alle Auswirkungen, bevor du bestätigst.' : 'Wähle einen Bereich. Du kannst mehrere Bereiche vor der Vorschau ändern.'}</p>
    {stale && <p role="alert" className="mt-4 text-red-700">Die Reise hat sich inzwischen geändert. Deine Eingaben bleiben sichtbar; diese Vorschau kann nicht mehr übernommen werden. <button className={button} disabled={pending} onClick={onNeu}>Aktuellen Stand laden und neu beginnen</button></p>}
    {pending && <p role="status" className="mt-4">{vorschau ? 'Speicherung wird geprüft …' : 'Vorschau wird vorbereitet …'}</p>}
    {meldung && <p ref={alert} tabIndex={-1} role="alert" className="mt-4 text-red-700 [overflow-wrap:anywhere]">{meldung}</p>}
    {vorschau ? <div className="mt-5 grid gap-5">
      <ReiseAenderungAuswirkungen vorher={vorschau.vorher} nachher={vorschau.nachher} />
      <div className="flex flex-wrap gap-3">
        <button className={button} disabled={pending || ungewiss} onClick={() => { generation.current++; setVorschau(null); setMeldung('') }}>Zurück zur Eingabe</button>
        {ungewiss && <button className={button} disabled={pending || stale} onClick={() => void save(true)}>Ergebnis erneut prüfen</button>}
        <button className={`${button} bg-brand-800 text-white`} disabled={pending || stale} onClick={() => void save()}>{ungewiss ? 'Dieselbe Änderung erneut übernehmen' : 'Änderung ausdrücklich übernehmen'}</button>
      </div>
    </div> : <form aria-label="Reise direkt bearbeiten" aria-busy={pending} onSubmit={preview} noValidate className="mt-5 grid min-w-0 gap-5">
      <fieldset disabled={pending || stale} className="grid min-w-0 gap-5">
        <legend className="sr-only">Reisedaten bearbeiten</legend>
        <div aria-label="Bearbeitungsbereiche" className="grid min-w-0 grid-cols-3 gap-2">
          {(['grunddaten', 'zeitraum', 'etappen'] as const).map((value, index) => <button key={value} type="button" aria-label={`${index + 1}. ${value === 'grunddaten' ? 'Grunddaten' : value === 'zeitraum' ? 'Zeitraum' : 'Etappen'}`} aria-current={gruppe === value ? 'step' : undefined} aria-controls={`edit-group-${value}`} onClick={() => selectGroup(value)} className={`min-h-11 min-w-0 rounded-2xl border border-line-200 px-1 py-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand-600 disabled:opacity-50 ${gruppe === value ? 'bg-brand-800 text-white' : 'bg-surface-25 text-brand-800'}`}><span aria-hidden="true" className="block text-xs opacity-80">{index + 1}</span>{value === 'grunddaten' ? 'Grunddaten' : value === 'zeitraum' ? 'Zeitraum' : 'Etappen'}</button>)}
        </div>
        <h3 ref={groupHeading} tabIndex={-1} className="text-lg font-semibold text-brand-900 outline-none">{gruppe === 'grunddaten' ? 'Grunddaten' : gruppe === 'zeitraum' ? 'Zeitraum' : 'Vorhandene Etappen'}</h3>
        <div id="edit-group-grunddaten" hidden={gruppe !== 'grunddaten'} inert={gruppe !== 'grunddaten'} className={gruppe === 'grunddaten' ? 'grid min-w-0 gap-5' : undefined}>
        <label className="grid min-w-0 grid-cols-1 gap-2">Reisetitel<input data-aenderung-start className={input} value={form.title} maxLength={GRENZEN.titel} aria-invalid={invalid('title')} aria-describedby={invalid('title') ? errorId : undefined} onChange={e => update({ ...form, title: e.target.value })} /></label>
        <div className="grid min-w-0 items-start gap-5 sm:grid-cols-2">
          <label className="grid min-w-0 grid-cols-1 gap-2">Budgetziel ({basis.currency})<input className={input} type="number" min="0" max="1000000" step="0.01" value={form.budgetAmount} aria-invalid={invalid('budgetAmount')} aria-describedby={invalid('budgetAmount') ? errorId : undefined} onChange={e => update({ ...form, budgetAmount: e.target.value })} /><span className="text-xs leading-5">Dein Zielbetrag in der bisherigen Währung; kein gebuchter Gesamtpreis. Ein gesetztes Budget kann hier ersetzt, nicht geleert werden.</span></label>
          <label className="grid min-w-0 grid-cols-1 gap-2">Reisetempo<select className={input} value={form.pace} onChange={e => update({ ...form, pace: e.target.value as Trip['pace'] })}>{TRIP_PACES.map(p => <option key={p} value={p}>{TEMPO_BEZEICHNUNG[p].titel}</option>)}</select></label>
        </div>
        <details open={invalid('travelWish') || invalid('interests') || undefined} className="min-w-0 rounded-xl border border-line-200 p-3"><summary className="min-h-11 cursor-pointer py-3 font-semibold focus-visible:ring-2 focus-visible:ring-brand-600">Interessen und Reisewunsch</summary><div className="mt-3 grid min-w-0 gap-5">
        <fieldset><legend className="mb-2">Interessen</legend><div className="flex flex-wrap gap-2">{TRIP_INTERESTS.map(i => <label key={i} className="flex min-h-11 items-center gap-2 rounded-xl border border-line-200 px-3"><input type="checkbox" checked={form.interests.includes(i)} onChange={e => update({ ...form, interests: e.target.checked ? [...form.interests, i] : form.interests.filter(v => v !== i) })} />{INTERESSE_BEZEICHNUNG[i]}</label>)}</div></fieldset>
        <label className="grid min-w-0 grid-cols-1 gap-2">Reisewunsch<textarea className={input} rows={3} maxLength={GRENZEN.reisewunsch} value={form.travelWish} aria-invalid={invalid('travelWish')} aria-describedby={invalid('travelWish') ? errorId : undefined} onChange={e => update({ ...form, travelWish: e.target.value })} /><span className="text-xs">Ein vorhandener Reisewunsch kann hier durch einen nichtleeren Text ersetzt werden.</span></label>
        </div></details>
        </div>
        <div id="edit-group-zeitraum" hidden={gruppe !== 'zeitraum'} inert={gruppe !== 'zeitraum'} className={gruppe === 'zeitraum' ? 'grid min-w-0 gap-5' : undefined}>
        <label className="grid min-w-0 grid-cols-1 gap-2">Reisebeginn<input type="date" className={input} value={form.startDate} aria-invalid={invalid('startDate')} aria-describedby={invalid('startDate') ? errorId : undefined} onChange={e => update({ ...form, startDate: e.target.value })} /><span className="text-xs">Kalenderdatum. Geschützte Buchungstermine bleiben fest. Ein gesetztes Datum kann hier nicht geleert werden.</span></label>
        <label className="grid min-w-0 grid-cols-1 gap-2">Dauer bearbeiten<select className={input} value={dauerArt} onChange={e => { generation.current++; setDauerArt(e.target.value as typeof dauerArt); setVersucht(false) }}><option value="gesamt">Gesamtdauer</option><option value="etappen">Dauer der bestehenden Etappen</option></select></label>
        {dauerArt === 'gesamt' ? <label className="grid min-w-0 grid-cols-1 gap-2">Gesamtdauer in Tagen<input type="number" min="1" max={GRENZEN.reisetageJeReise} className={input} value={form.duration} aria-invalid={invalid('duration')} aria-describedby={invalid('duration') ? errorId : undefined} onChange={e => update({ ...form, duration: e.target.value })} /><span className="text-xs leading-5">Verlängern fügt am Ende Tage hinzu. Verkürzen entfernt die letzten Tage samt normalen Planpunkten; geschützte Punkte bleiben ungeplant erhalten. Höchstens 30 Tage Unterschied je Änderung.</span></label>
          : <p className="text-sm leading-6">Die Dauer wird über die Etappen bestimmt. <button type="button" className={button} onClick={() => selectGroup('etappen')}>Etappen bearbeiten</button></p>}
        </div>
        <div id="edit-group-etappen" hidden={gruppe !== 'etappen'} inert={gruppe !== 'etappen'} className={gruppe === 'etappen' ? 'grid min-w-0 gap-5' : undefined}>
          <p className="text-sm leading-6">Ändere die Dauer vorhandener Etappen oder entferne eine Etappe. Geschützte Buchungen bleiben erhalten. Die Vorschau zeigt alle Folgen.</p>
          <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={dauerArt === 'etappen'} onChange={e => { generation.current++; setDauerArt(e.target.checked ? 'etappen' : 'gesamt'); setVersucht(false) }} />Dauer über Etappen bearbeiten</label>
          <fieldset disabled={dauerArt !== 'etappen'} className="grid min-w-0 gap-3"><legend className="sr-only">Etappendauer und Entfernung</legend><p>Ergebnis der Etappen: {Number.isFinite(total) ? total : '—'} Tage insgesamt.</p>{basis.stages.map(s => { const d = form.stages.find(v => v.id === s.id)!; return <fieldset key={s.id} className="grid min-w-0 gap-3 rounded-2xl border border-line-200 p-4"><legend className="max-w-full px-1 font-semibold [overflow-wrap:anywhere]">Etappe {s.position}: {s.name}</legend><p className="text-sm">Bisher {s.arrivalDate ?? 'Datum offen'} – {s.departureDate ?? 'Datum offen'}</p><label className="grid min-w-0 grid-cols-1 gap-2">Tage für Etappe {s.position}<input className={input} type="number" min="1" max={GRENZEN.reisetageJeReise} disabled={d.remove} value={d.days} aria-invalid={invalid('stages')} aria-describedby={invalid('stages') ? errorId : undefined} onChange={e => update({ ...form, stages: form.stages.map(v => v.id === s.id ? { ...v, days: e.target.value } : v) })} /></label><label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={d.remove} onChange={e => update({ ...form, stages: form.stages.map(v => v.id === s.id ? { ...v, remove: e.target.checked } : v) })} />Etappe {s.position} entfernen</label></fieldset> })}</fieldset>
        </div>
      </fieldset>
      {versucht && !validation.ok && <p id={errorId} tabIndex={-1} role="alert" className="text-red-700">{validation.meldung}</p>}
      <p role="status" className="text-sm text-ink-900">{Object.keys(eingabe).some(k => k !== 'stages' && k !== 'duration') || (dauerArt === 'etappen' ? !!eingabe.stages?.length : 'duration' in eingabe) ? 'Entwurf · noch nicht gespeichert' : 'Bisher keine Eingaben geändert'}</p>
      <div className="flex flex-wrap gap-3"><button type="button" className={button} disabled={pending} onClick={onNeu}>Eingaben verwerfen</button><button type="submit" className={`${button} bg-brand-800 text-white`} disabled={pending || stale}>Auswirkungen ansehen</button></div>
    </form>}
  </div>
}
