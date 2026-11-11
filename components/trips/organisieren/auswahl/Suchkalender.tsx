'use client'

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { CalendarDays, Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { tageDifferenz, tageUtc } from '@/lib/activities/zeit'
import { datumVerschieben, kalenderGrenzen, monatVerschieben, monatsTage, zeitraumGueltig, type KalenderGrenzen } from '@/lib/trips/suchkalender'
import './suchauswahl.css'

type Teil = 'start' | 'ende'
type Props = KalenderGrenzen & {
  start: string
  ende: string
  startLabel: string
  endeLabel: string
  startName?: string
  endeName?: string
  fehler?: string | null
  fehlerId?: string
  naechte?: boolean
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
  const startRef = useRef<HTMLButtonElement>(null)
  const endeRef = useRef<HTMLButtonElement>(null)
  const feld = (teil: Teil) => {
    const start = teil === 'start'
    const label = start ? props.startLabel : props.endeLabel
    const name = start ? props.startName : props.endeName
    return <button type="button" ref={start ? startRef : endeRef} name={name}
      className="org-field reise-datum-trigger" aria-label={`${label}: ${kurz(start ? props.start : props.ende)}`}
      aria-haspopup="dialog" aria-expanded={offen === teil} aria-controls={offen ? id : undefined}
      data-invalid={Boolean(name && props.fehler === name)} aria-describedby={name && props.fehler === name ? props.fehlerId : undefined}
      onClick={() => setOffen(teil)}>
      <span>{label}</span><strong>{kurz(start ? props.start : props.ende)}<CalendarDays size={17} aria-hidden="true" /></strong>
    </button>
  }
  return <>
    {feld('start')}
    {!props.einzeln && feld('ende')}
    {offen && <KalenderDialog {...props} id={id} teil={offen} anker={offen === 'start' ? startRef : endeRef}
      schliessen={() => setOffen(null)} />}
  </>
}

function KalenderDialog(props: Props & {
  id: string; teil: Teil; anker: RefObject<HTMLButtonElement | null>; schliessen: () => void
}) {
  const { id, anker, schliessen } = props
  const dialog = useRef<HTMLDialogElement>(null)
  const [start, setStart] = useState(props.start)
  const [ende, setEnde] = useState(props.ende)
  const [teil, setTeil] = useState<Teil>(tageUtc(props.start) === null ? 'start' : props.teil)
  const initial = props.teil === 'ende' && tageUtc(props.ende) !== null ? props.ende : props.start
  const initialDatum = tageUtc(initial) === null || initial < props.min ? props.min : initial > props.max ? props.max : initial
  const [monat, setMonat] = useState(() => monatVerschieben(initialDatum, 0))
  const [fokus, setFokus] = useState(initialDatum)
  const [hover, setHover] = useState('')
  const tagesFokusAngefordert = useRef(false)
  const grenze = kalenderGrenzen(teil, start, props)
  const fertig = zeitraumGueltig(start, ende, props)
  const dauer = tageDifferenz(start, ende)
  const vorschauEnde = teil === 'ende' && hover >= grenze.min && hover <= grenze.max ? hover : ende
  const status = fertig ? props.einzeln ? lang(start)
    : `${kurz(start)} – ${kurz(ende)} · ${props.naechte ? `${dauer} ${dauer === 1 ? 'Nacht' : 'Nächte'}` : `${(dauer ?? 0) + 1} ${dauer === 0 ? 'Reisetag' : 'Reisetage'}`}`
    : `${teil === 'start' ? props.startLabel : props.endeLabel} wählen`

  useLayoutEffect(() => {
    const el = dialog.current
    const trigger = anker.current
    if (!el) return
    el.showModal()
    const position = () => {
      const r = trigger?.getBoundingClientRect()
      const width = el.getBoundingClientRect().width
      const height = el.getBoundingClientRect().height
      const vw = document.documentElement.clientWidth
      const vh = window.visualViewport?.height ?? window.innerHeight
      const mobile = vw <= 640
      const left = mobile ? 8 : Math.max(16, Math.min(r?.left ?? 16, vw - width - 16))
      const below = (r?.bottom ?? 0) + 10
      const above = (r?.top ?? 0) - height - 10
      const top = mobile ? Math.max(8, vh - height - 8)
        : below + height <= vh - 16 ? below : above >= 16 ? above : Math.max(16, (vh - height) / 2)
      el.style.left = `${left}px`
      el.style.top = `${top}px`
    }
    position()
    const observer = new ResizeObserver(position)
    observer.observe(el)
    window.addEventListener('resize', position)
    window.visualViewport?.addEventListener('resize', position)
    el.querySelector<HTMLButtonElement>('[data-focus-day="true"]')?.focus({ preventScroll: true })
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', position)
      window.visualViewport?.removeEventListener('resize', position)
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
    onCancel={e => { e.preventDefault(); schliessen() }}
    onClick={e => { if (e.target === e.currentTarget) {
      const r = e.currentTarget.getBoundingClientRect()
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) schliessen()
    } }}>
    <div className="reise-kalender-kopf">
      <div><span className="reise-kalender-eyebrow">{props.naechte ? 'Dein Aufenthalt' : 'Deine Flugdaten'}</span><h2 id={`${id}-titel`}>{props.einzeln ? 'Wann möchtest du fliegen?' : 'Wähle deinen Zeitraum'}</h2></div>
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
      {[monat, monatVerschieben(monat, 1)].map((m, index) => {
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
                    disabled={d < grenze.min || d > grenze.max} aria-label={lang(d)} aria-current={d === props.min ? 'date' : undefined}
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
      <div><button type="button" className="reise-abbrechen" onClick={schliessen}>Abbrechen</button><button type="button" className="reise-uebernehmen" disabled={!fertig} onClick={() => { props.setzen(start, props.einzeln ? props.ende : ende); schliessen() }}><Check size={17} aria-hidden="true" /> Übernehmen</button></div>
    </div>
  </dialog>
}
