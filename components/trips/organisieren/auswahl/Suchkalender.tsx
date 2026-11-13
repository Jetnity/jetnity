'use client'

import { useCallback, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { CalendarDays, Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { heutigesDatum } from '@/lib/account/naechste-reise'
import { kalenderPosition } from '@/lib/trips/suchkalender-position'
import { useSuchbereichAktiv } from '../SuchbereichKontext'
import { tageDifferenz, tageUtc } from '@/lib/activities/zeit'
import { datumVerschieben, kalenderGrenzen, monatVerschieben, monatsTage, zeitraumGueltig, type KalenderGrenzen } from '@/lib/trips/suchkalender'

type Teil = 'start' | 'ende'
type Props = KalenderGrenzen & {
  start: string
  ende: string
  startLabel: string
  endeLabel: string
  className?: string
  titel?: string
  kontext?: string
  disabled?: boolean
  startId?: string
  endeId?: string
  startRef?: (element: HTMLButtonElement | null) => void
  endeRef?: (element: HTMLButtonElement | null) => void
  startFehler?: boolean
  endeFehler?: boolean
  startBeschrieben?: string
  endeBeschrieben?: string
  optional?: boolean
  startName?: string
  endeName?: string
  fehler?: string | null
  fehlerId?: string
  naechte?: boolean
  dauerAnzeigen?: boolean
  setzen: (start: string, ende: string) => void
}

const kurz = (d: string) => tageUtc(d) === null ? 'Datum wählen' : new Intl.DateTimeFormat('de-CH', {
  day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC',
}).format(new Date(d + 'T12:00:00Z'))
const lang = (d: string) => new Intl.DateTimeFormat('de-CH', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
}).format(new Date(d + 'T12:00:00Z'))
const monatsName = (d: string) => new Intl.DateTimeFormat('de-CH', {
  month: 'long', year: 'numeric', timeZone: 'UTC',
}).format(new Date(d + 'T12:00:00Z'))

export default function Suchkalender(props: Props) {
  const id = useId()
  const [offen, setOffen] = useState<Teil | null>(null)
  const aktiv = useSuchbereichAktiv()
  if (offen && (!aktiv || props.disabled)) setOffen(null)
  const startRef = useRef<HTMLButtonElement>(null)
  const endeRef = useRef<HTMLButtonElement>(null)
  const externeStartRef = props.startRef
  const externeEndeRef = props.endeRef
  const startElement = useCallback((element: HTMLButtonElement | null) => {
    startRef.current = element
    externeStartRef?.(element)
  }, [externeStartRef])
  const endeElement = useCallback((element: HTMLButtonElement | null) => {
    endeRef.current = element
    externeEndeRef?.(element)
  }, [externeEndeRef])
  const feld = (teil: Teil) => {
    const start = teil === 'start'
    const label = start ? props.startLabel : props.endeLabel
    const name = start ? props.startName : props.endeName
    const ungueltig = (start ? props.startFehler : props.endeFehler) || Boolean(name && props.fehler === name)
    const beschrieben = (start ? props.startBeschrieben : props.endeBeschrieben) ?? (ungueltig ? props.fehlerId : undefined)
    return <button type="button" id={start ? props.startId : props.endeId} disabled={props.disabled}
      ref={start ? startElement : endeElement} name={name}
      className={`org-field reise-datum-trigger${props.className ? ` ${props.className}` : ''}`} aria-label={`${label}: ${kurz(start ? props.start : props.ende)}`}
      aria-haspopup="dialog" aria-expanded={offen === teil} aria-controls={offen ? id : undefined}
      data-invalid={ungueltig} aria-describedby={beschrieben}
      onClick={() => setOffen(teil)}>
      <span>{label}</span><strong>{kurz(start ? props.start : props.ende)}<CalendarDays size={17} aria-hidden="true" /></strong>
    </button>
  }
  return <>
    {feld('start')}
    {!props.einzeln && feld('ende')}
    {offen && !props.disabled && <KalenderDialog {...props} id={id} teil={offen} anker={offen === 'start' ? startRef : endeRef}
      schliessen={() => setOffen(null)} />}
  </>
}

function KalenderDialog(props: Props & {
  id: string; teil: Teil; anker: RefObject<HTMLButtonElement | null>; schliessen: () => void
}) {
  const { id, anker, schliessen } = props
  const heute = heutigesDatum()
  const dialog = useRef<HTMLDialogElement>(null)
  const [start, setStart] = useState(props.start)
  const [ende, setEnde] = useState(props.ende)
  const [teil, setTeil] = useState<Teil>(tageUtc(props.start) === null ? 'start' : props.teil)
  const initial = props.teil === 'ende' && tageUtc(props.ende) !== null ? props.ende : props.start
  const basisDatum = tageUtc(initial) === null ? heute : initial
  const initialDatum = basisDatum < props.min ? props.min : basisDatum > props.max ? props.max : basisDatum
  const [monat, setMonat] = useState(() => monatVerschieben(initialDatum, 0))
  const [fokus, setFokus] = useState(initialDatum)
  const [hover, setHover] = useState('')
  const tagesFokusAngefordert = useRef(false)
  const grenze = kalenderGrenzen(teil, start, props)
  const fertig = zeitraumGueltig(start, ende, props)
  const dauer = tageDifferenz(start, ende)
  const vorschauEnde = teil === 'ende' && hover >= grenze.min && hover <= grenze.max ? hover : ende
  const status = fertig ? props.einzeln ? lang(start)
    : `${kurz(start)} – ${kurz(ende)}${props.dauerAnzeigen === false ? '' : ` · ${props.naechte ? `${dauer} ${dauer === 1 ? 'Nacht' : 'Nächte'}` : `${(dauer ?? 0) + 1} ${dauer === 0 ? 'Reisetag' : 'Reisetage'}`}`}`
    : `${teil === 'start' ? props.startLabel : props.endeLabel} wählen`

  useLayoutEffect(() => {
    const el = dialog.current
    const trigger = anker.current
    if (!el) return
    el.showModal()
    const position = () => {
      const viewport = window.visualViewport
      const vw = viewport?.width ?? document.documentElement.clientWidth
      const vh = viewport?.height ?? window.innerHeight
      const margin = vw <= 640 ? 8 : 16
      el.style.maxWidth = `${Math.max(0, vw - margin * 2)}px`
      el.style.maxHeight = `${Math.max(0, vh - margin * 2)}px`
      const rect = el.getBoundingClientRect()
      const position = kalenderPosition({
        width: vw, height: vh, offsetLeft: viewport?.offsetLeft ?? 0, offsetTop: viewport?.offsetTop ?? 0,
      }, { width: rect.width, height: rect.height }, trigger?.getBoundingClientRect())
      el.style.left = `${position.left}px`
      el.style.top = `${position.top}px`
    }
    position()
    const observer = new ResizeObserver(position)
    observer.observe(el)
    window.addEventListener('resize', position)
    window.visualViewport?.addEventListener('resize', position)
    window.visualViewport?.addEventListener('scroll', position)
    window.addEventListener('scroll', position, { capture: true, passive: true })
    el.querySelector<HTMLButtonElement>('[data-focus-day="true"]')?.focus({ preventScroll: true })
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', position)
      window.visualViewport?.removeEventListener('resize', position)
      window.visualViewport?.removeEventListener('scroll', position)
      window.removeEventListener('scroll', position, true)
      document.body.style.overflow = oldOverflow
      el.close()
      trigger?.focus({ preventScroll: true })
    }
  }, [anker])

  useLayoutEffect(() => {
    if (!tagesFokusAngefordert.current) return
    dialog.current?.querySelector<HTMLButtonElement>(`[data-datum="${fokus}"]`)?.focus({ preventScroll: true })
    tagesFokusAngefordert.current = false
  }, [monat, fokus])

  function waehlen(datum: string) {
    setHover('')
    setFokus(datum)
    if (teil === 'start') {
      setStart(datum)
      if (!zeitraumGueltig(datum, ende, props)) setEnde('')
      if (!props.einzeln) {
        setTeil('ende')
        if (props.minTage > 0) {
          const ersterEndtag = datumVerschieben(datum, props.minTage)
          tagesFokusAngefordert.current = true
          setFokus(ersterEndtag)
          if (ersterEndtag.slice(0, 7) !== datum.slice(0, 7)) setMonat(monatVerschieben(ersterEndtag, 0))
        }
      }
    } else setEnde(datum)
  }
  function teilWaehlen(wert: Teil) {
    setTeil(wert)
    setHover('')
    const datum = wert === 'start' ? start : ende || start
    if (tageUtc(datum) !== null) {
      const d = datum < props.min ? props.min : datum > props.max ? props.max : datum
      setMonat(monatVerschieben(d, 0))
      setFokus(d)
    }
  }
  function tastatur(event: KeyboardEvent<HTMLButtonElement>, datum: string) {
    let ziel: string
    const wochentag = (new Date(datum + 'T12:00:00Z').getUTCDay() + 6) % 7
    switch (event.key) {
      case 'ArrowLeft': ziel = datumVerschieben(datum, -1); break
      case 'ArrowRight': ziel = datumVerschieben(datum, 1); break
      case 'ArrowUp': ziel = datumVerschieben(datum, -7); break
      case 'ArrowDown': ziel = datumVerschieben(datum, 7); break
      case 'Home': ziel = datumVerschieben(datum, -wochentag); break
      case 'End': ziel = datumVerschieben(datum, 6 - wochentag); break
      case 'PageUp': ziel = monatVerschieben(datum, event.shiftKey ? -12 : -1); break
      case 'PageDown': ziel = monatVerschieben(datum, event.shiftKey ? 12 : 1); break
      default: return
    }
    event.preventDefault()
    ziel = ziel < grenze.min ? grenze.min : ziel > grenze.max ? grenze.max : ziel
    tagesFokusAngefordert.current = true
    setFokus(ziel)
    // Reveal the target on narrow screens too, where only the first month is visible.
    if (ziel.slice(0, 7) !== datum.slice(0, 7)) setMonat(monatVerschieben(ziel, 0))
  }

  return <dialog ref={dialog} id={id} className="reise-kalender" aria-labelledby={`${id}-titel`} aria-describedby={`${id}-status`}
    onCancel={e => { e.preventDefault(); e.stopPropagation(); schliessen() }}
    onKeyDown={e => { if (e.key === 'Escape') e.stopPropagation() }}
    onClick={e => { if (e.target === e.currentTarget) {
      const r = e.currentTarget.getBoundingClientRect()
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) schliessen()
    } }}>
    <div className="reise-kalender-kopf">
      <div><span className="reise-kalender-eyebrow">{props.kontext ?? (props.naechte ? 'Dein Aufenthalt' : 'Deine Reisedaten')}</span><h2 id={`${id}-titel`}>{props.titel ?? (props.einzeln ? 'Wähle deinen Reisetag' : 'Wähle deinen Zeitraum')}</h2></div>
      <button type="button" className="reise-icon" aria-label="Kalender schliessen" onClick={schliessen}><X size={20} /></button>
    </div>
    <div className="reise-kalender-auswahl" role="group" aria-label="Datum bearbeiten">
      <button type="button" aria-pressed={teil === 'start'} onClick={() => teilWaehlen('start')}><span>{props.startLabel}</span><b>{kurz(start)}</b><CalendarDays size={18} /></button>
      {!props.einzeln && <button type="button" aria-pressed={teil === 'ende'} disabled={tageUtc(start) === null} onClick={() => teilWaehlen('ende')}><span>{props.endeLabel}</span><b>{kurz(ende)}</b><CalendarDays size={18} /></button>}
    </div>
    <div className="reise-kalender-monate">
      <nav className="reise-kalender-nav" aria-label="Monate wechseln">
        <button type="button" className="reise-icon" aria-label="Vorheriger Monat" disabled={monat <= monatVerschieben(grenze.min, 0)} onClick={() => { setHover(''); setMonat(monatVerschieben(monat, -1)) }}><ChevronLeft size={20} /></button>
        <button type="button" className="reise-icon" aria-label="Nächster Monat" disabled={monat >= monatVerschieben(grenze.max, 0)} onClick={() => { setHover(''); setMonat(monatVerschieben(monat, 1)) }}><ChevronRight size={20} /></button>
      </nav>
      {(monat.slice(0, 7) === props.max.slice(0, 7) ? [monat] : [monat, monatVerschieben(monat, 1)]).map((m, index) => {
        const tage = monatsTage(m)
        const fokusTag = tage.includes(fokus) && fokus >= grenze.min && fokus <= grenze.max ? fokus : tage.find(d => d && d >= grenze.min && d <= grenze.max)
        return <section key={m} className={'reise-monat' + (index ? ' reise-monat-zweiter' : '')} aria-label={monatsName(m)}>
          <h3>{monatsName(m)}</h3>
          <table role="grid" aria-label={monatsName(m)}><thead><tr>{['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((w, i) => <th key={w} scope="col" abbr={['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'][i]}>{w}</th>)}</tr></thead>
            <tbody onMouseLeave={() => setHover('')}>{Array.from({ length: 6 }, (_, woche) => <tr key={woche}>
              {tage.slice(woche * 7, woche * 7 + 7).map((d, tag) => {
                const selected = d === start || (!props.einzeln && d === ende)
                const zwischen = d && !props.einzeln && start && vorschauEnde > start && d > start && d < vorschauEnde
                return <td key={d ?? tag} aria-selected={d ? selected : undefined} className={zwischen ? 'reise-tag-bereich' : d === start ? 'reise-tag-start' : d === vorschauEnde ? 'reise-tag-ende' : undefined}>
                  {d && <button type="button" data-datum={d} data-focus-day={d === fokusTag} tabIndex={d === fokusTag ? 0 : -1}
                    disabled={d < grenze.min || d > grenze.max} aria-label={lang(d)} aria-current={d === heute ? 'date' : undefined}
                    className={selected ? 'reise-tag-gewaehlt' : undefined}
                    onMouseEnter={() => setHover(d)} onFocus={() => setFokus(d)} onKeyDown={e => tastatur(e, d)} onClick={() => waehlen(d)}>{Number(d.slice(-2))}</button>}
                </td>
              })}
            </tr>)}</tbody>
          </table>
        </section>
      })}
    </div>
    <div className="reise-kalender-fuss">
      <p id={`${id}-status`} role="status" aria-live="polite">{status}</p>
      <div>{props.optional && <button type="button" className="reise-abbrechen" onClick={() => { props.setzen('', ''); schliessen() }}>{props.einzeln ? 'Datum löschen' : 'Zeitraum löschen'}</button>}<button type="button" className="reise-abbrechen" onClick={schliessen}>Abbrechen</button><button type="button" className="reise-uebernehmen" disabled={!fertig} onClick={() => { props.setzen(start, props.einzeln ? props.ende : ende); schliessen() }}><Check size={17} aria-hidden="true" /> Übernehmen</button></div>
    </div>
  </dialog>
}
