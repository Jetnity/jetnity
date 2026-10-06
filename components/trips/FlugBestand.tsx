'use client'

import * as React from 'react'
import { CircleAlert, Plane } from 'lucide-react'

import BuchungsSiegel from '@/components/trips/BuchungsSiegel'
import FlugRoute from '@/components/trips/FlugRoute'
import { routeFactsFuerPunkt } from '@/lib/route/ableitung'
import { istManuellerFlug } from '@/lib/trips/flug-manuell'
import { ersteMeldung, flugRouteManuellSchema, type FlugSegmentManuell } from '@/lib/trips/schema'
import { flugRouteItineraryLesen } from '@/lib/route/schema'
import { kannBuchungMarkieren } from '@/lib/trips/buchung'
import { datumKurz } from '@/lib/trips/datum-anzeige'
import { flugAbdeckung, type FlugAbschnitt } from '@/lib/trips/flug-abdeckung'
import { ORGANISIEREN_FLAECHE_KLASSE } from '@/lib/trips/organize-premium-experience-6'
import type { Trip, TripItem } from '@/types/trips'

type FlugRouteSpeichern = (itemId: string, segments: FlugSegmentManuell[]) => Promise<string | null>

function abschnittTitel(abschnitt: FlugAbschnitt): string {
  const route = `${abschnitt.originName} → ${abschnitt.destinationName}`
  return abschnitt.date ? `${route} · ${datumKurz(abschnitt.date)}` : route
}

const FLUGFELDER = [
  { name: 'origin', label: 'Abflugflughafen (IATA)', type: 'text' },
  { name: 'destination', label: 'Ankunftsflughafen (IATA)', type: 'text' },
  { name: 'departureDate', label: 'Abflugdatum', type: 'date' },
  { name: 'departureTime', label: 'Abflugzeit (optional)', type: 'time' },
  { name: 'arrivalDate', label: 'Ankunftsdatum', type: 'date' },
  { name: 'arrivalTime', label: 'Ankunftszeit (optional)', type: 'time' },
] as const
const ROUTE_KNOPF = 'min-h-11 max-w-full rounded-full border border-line-300 px-3 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:opacity-50'

function leeresFlugsegment(): FlugSegmentManuell {
  return { origin: '', destination: '', departureDate: '', departureTime: null, arrivalDate: '', arrivalTime: null }
}

function ManuelleFlugRoute({ item, onSpeichern }: { item: TripItem; onSpeichern: FlugRouteSpeichern }) {
  const id = React.useId()
  const knopf = React.useRef<HTMLButtonElement>(null)
  const formular = React.useRef<HTMLFormElement>(null)
  const fehlerZusammenfassung = React.useRef<HTMLParagraphElement>(null)
  const hinzufuegen = React.useRef<HTMLButtonElement>(null)
  const schreibt = React.useRef(false)
  const [offen, setOffen] = React.useState(false)
  const [segments, setSegments] = React.useState<FlugSegmentManuell[]>([])
  const [fehler, setFehler] = React.useState('')
  const [validieren, setValidieren] = React.useState(false)
  const [fokusVersuch, setFokusVersuch] = React.useState(0)
  const [laeuft, setLaeuft] = React.useState(false)
  const [gespeichert, setGespeichert] = React.useState(false)
  const route = flugRouteItineraryLesen(item.routeItinerary)
  const hatRoute = route?.legs.some((leg) => leg.segments.some((segment) =>
    segment.origin.airportCode || segment.destination.airportCode))
  // Bestehende grössere/multi-leg Routen niemals unbemerkt abschneiden/zusammenlegen.
  const zuGross = route && (route.legs.length !== 1 || route.legs[0]!.segments.length > 4)
  // Nach dem ersten Fehlversuch immer den aktuellen Entwurf prüfen, auch nach Add/Remove.
  const pruefung = validieren ? flugRouteManuellSchema.safeParse({ segments }) : null
  const validierungsfehler = pruefung && !pruefung.success ? pruefung.error : null
  const meldung = validierungsfehler ? ersteMeldung(validierungsfehler) : fehler
  const feldfehler = new Map<string, string>()
  for (const issue of validierungsfehler?.issues ?? []) {
    const [wurzel, index, feld] = issue.path
    if (issue.path.length !== 3 || wurzel !== 'segments' || typeof index !== 'number'
      || !segments[index] || !FLUGFELDER.some((eintrag) => eintrag.name === feld)) continue
    const schluessel = `${index}-${feld}`
    if (!feldfehler.has(schluessel)) feldfehler.set(schluessel, issue.message)
  }

  React.useEffect(() => {
    if (offen) formular.current?.querySelector('input')?.focus()
  }, [offen])

  React.useEffect(() => {
    if (fokusVersuch === 0) return
    // Erst nach dem Render sind aktuelle Markierungen und Summary im DOM.
    const ziel = formular.current?.querySelector<HTMLInputElement>('input[aria-invalid="true"]')
      ?? fehlerZusammenfassung.current
    ziel?.focus()
  }, [fokusVersuch])

  const schliessen = () => {
    setOffen(false)
    setFehler('')
    knopf.current?.focus()
  }
  const speichern = async (event: React.FormEvent) => {
    event.preventDefault()
    if (schreibt.current || zuGross) return
    const geprueft = flugRouteManuellSchema.safeParse({ segments })
    if (!geprueft.success) {
      setFehler('')
      setValidieren(true)
      setFokusVersuch((bisher) => bisher + 1)
      return
    }
    setValidieren(false)
    schreibt.current = true
    setLaeuft(true)
    setFehler('')
    try {
      const meldung = await onSpeichern(item.id, geprueft.data.segments)
      if (meldung) setFehler(meldung)
      else {
        schliessen()
        setGespeichert(true)
      }
    } catch {
      setFehler('Die Flugroute konnte nicht gespeichert werden. Bitte versuche es erneut.')
    } finally {
      schreibt.current = false
      setLaeuft(false)
    }
  }

  return (
    <div className="min-w-0 border-t border-line-100 pt-3" onKeyDown={(event) => {
      if (event.key !== 'Escape' || !offen) return
      event.preventDefault()
      event.stopPropagation()
      if (!schreibt.current) schliessen()
    }}>
      <button ref={knopf} type="button" aria-expanded={offen} aria-controls={offen ? `${id}-formular` : undefined}
        aria-disabled={laeuft} className={ROUTE_KNOPF} onClick={() => {
          if (schreibt.current) return
          if (offen) { schliessen(); return }
          setSegments(route && !zuGross ? route.legs[0]!.segments.map((segment) => ({
            origin: segment.origin.airportCode ?? '', destination: segment.destination.airportCode ?? '',
            departureDate: segment.departureDate ?? '', departureTime: segment.departureTime,
            arrivalDate: segment.arrivalDate ?? '', arrivalTime: segment.arrivalTime,
          })) : [leeresFlugsegment()])
          setFehler(''); setValidieren(false); setGespeichert(false); setOffen(true)
        }}>
        {hatRoute ? 'Flugroute ändern' : 'Flugroute ergänzen'}
      </button>
      {offen ? (
        <form ref={formular} id={`${id}-formular`} aria-label={`Flugroute für ${item.title}`} noValidate
          onSubmit={speichern} aria-busy={laeuft} aria-describedby={meldung ? `${id}-fehler` : undefined}
          className="mt-3 grid min-w-0 gap-3">
          {zuGross ? (
            <p role="alert" className="break-words text-sm text-danger-600">Diese gespeicherte Route umfasst mehr als eine Flugstrecke oder vier Segmente und kann hier nicht geändert werden.</p>
          ) : <>
            <p className="text-xs leading-5 text-ink-800">Ein bis vier zusammenhängende Flugsegmente. Verwende die Daten und Ortszeiten deiner Reiseunterlagen.</p>
            {segments.map((segment, index) => (
              <fieldset key={index} disabled={laeuft} className="grid min-w-0 gap-3 rounded-xl border border-line-200 p-3">
                <legend className="px-1 text-sm font-semibold text-brand-800">Segment {index + 1}</legend>
                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  {FLUGFELDER.map((feld) => {
                    const feldId = `${id}-${index}-${feld.name}`
                    const feldmeldung = feldfehler.get(`${index}-${feld.name}`)
                    return (
                      <div key={feld.name} className="grid min-w-0 gap-1">
                        <label htmlFor={feldId} className="text-sm font-medium text-brand-800">{feld.label}</label>
                        <input id={feldId} type={feld.type} value={segment[feld.name] ?? ''}
                          required={feld.type !== 'time'} maxLength={feld.type === 'text' ? 3 : undefined}
                          autoCapitalize={feld.type === 'text' ? 'characters' : undefined} spellCheck={false}
                          aria-invalid={Boolean(feldmeldung) || undefined} aria-describedby={feldmeldung ? `${feldId}-fehler` : undefined}
                          onChange={(event) => setSegments((bisher) => bisher.map((eintrag, stelle) =>
                            stelle === index ? { ...eintrag, [feld.name]: event.target.value } : eintrag))}
                          className={`min-h-11 min-w-0 w-full max-w-full rounded-xl border px-3 text-base focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 ${feldmeldung ? 'border-danger-600 bg-surface-50' : 'border-line-300 bg-white'}`} />
                        {feldmeldung ? <p id={`${feldId}-fehler`} role="alert" className="flex min-w-0 gap-1 text-sm text-danger-600">
                          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                          <span className="min-w-0 break-words">{feldmeldung}</span>
                        </p> : null}
                      </div>
                    )
                  })}
                </div>
                <button type="button" disabled={segments.length <= 1 || laeuft} className={`${ROUTE_KNOPF} justify-self-start`}
                  aria-label={`Segment ${index + 1} entfernen`} onClick={() => {
                    setSegments((bisher) => bisher.filter((_, stelle) => stelle !== index))
                    // Nach dem Commit ist der bei vier Segmenten gesperrte Knopf wieder fokussierbar.
                    queueMicrotask(() => hinzufuegen.current?.focus())
                  }}>Segment entfernen</button>
              </fieldset>
            ))}
            <button ref={hinzufuegen} type="button" disabled={segments.length >= 4 || laeuft} className={`${ROUTE_KNOPF} justify-self-start`}
              onClick={() => setSegments((bisher) => bisher.length < 4 ? [...bisher, leeresFlugsegment()] : bisher)}>Segment hinzufügen</button>
          </>}
          {meldung ? <p ref={fehlerZusammenfassung} id={`${id}-fehler`} role={feldfehler.size === 0 ? 'alert' : undefined} tabIndex={-1}
            className="break-words rounded text-sm text-danger-600 focus:outline-none focus:ring-4 focus:ring-brand-600/15">{meldung}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={laeuft || Boolean(zuGross)} className="min-h-11 rounded-full bg-brand-800 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20 disabled:opacity-50">
              {laeuft ? 'Wird gespeichert …' : 'Speichern'}
            </button>
            <button type="button" disabled={laeuft} className={ROUTE_KNOPF} onClick={schliessen}>Abbrechen</button>
          </div>
        </form>
      ) : null}
      {gespeichert ? <p role="status" className="mt-2 text-sm text-brand-700">Flugroute gespeichert.</p> : null}
    </div>
  )
}

export default function FlugBestand({
  reise,
  ohneTag = [],
  onBuchungsstatus,
  onFlugRouteManuell,
}: {
  onFlugRouteManuell?: FlugRouteSpeichern
  reise: Trip
  ohneTag?: readonly TripItem[]
  onBuchungsstatus?: (itemId: string, gebucht: boolean) => Promise<string | null>
}) {
  const [meldung, setMeldung] = React.useState('')
  const [laeuft, setLaeuft] = React.useState<string | null>(null)
  const abdeckung = flugAbdeckung(reise, ohneTag)

  const setzen = async (itemId: string, gebucht: boolean) => {
    if (!onBuchungsstatus || laeuft) return
    setMeldung('')
    setLaeuft(itemId)
    const fehler = await onBuchungsstatus(itemId, gebucht)
    setLaeuft(null)
    if (fehler) setMeldung(fehler)
  }

  return (
    <section
      aria-label="Deine Flüge"
      data-organisieren-flaeche="bestand"
      className={ORGANISIEREN_FLAECHE_KLASSE}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Deine Flüge</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
            Bestand und Status
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink-800">{abdeckung.zusammenfassung}</p>
        </div>
        <Plane className="h-5 w-5 text-brand-600" aria-hidden="true" />
      </div>

      {abdeckung.abschnitte.length === 0 && abdeckung.unzugeordnet.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800">
          {abdeckung.bestimmbar
            ? 'Für diese Reise ist kein Flugabschnitt erforderlich, oder es liegt noch keiner vor.'
            : 'Die benötigten Flugabschnitte sind aus den vorliegenden Reisedaten noch nicht vollständig bestimmbar.'}
        </p>
      ) : (
        <ul className="mt-5 grid gap-2">
          {abdeckung.abschnitte.map((abschnitt) => (
            <li
              key={abschnitt.id}
              className="grid min-w-0 gap-3 rounded-2xl border border-line-200 px-3 py-3"
            >
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-800 break-words">{abschnittTitel(abschnitt)}</p>
                  {abschnitt.item ? (
                    <div className="mt-2">
                      <FlugRoute facts={routeFactsFuerPunkt(abschnitt.item)} />
                    </div>
                  ) : null}
                </div>
                <div className="flex min-h-11 flex-wrap items-center gap-2">
                  <BuchungsSiegel status={abschnitt.status} />
                  {abschnitt.item && kannBuchungMarkieren(abschnitt.item) && onBuchungsstatus ? (
                    <button
                      type="button"
                      disabled={laeuft === abschnitt.item.id}
                      onClick={() => void setzen(abschnitt.item!.id, abschnitt.status !== 'booked')}
                      className="inline-flex min-h-11 items-center rounded-full border border-line-300 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:border-line-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:opacity-50"
                    >
                      {abschnitt.status === 'booked' ? 'Buchung korrigieren' : 'Als gebucht markieren'}
                    </button>
                  ) : null}
                </div>
              </div>
              {abschnitt.item && onFlugRouteManuell && istManuellerFlug(abschnitt.item) ? (
                <ManuelleFlugRoute item={abschnitt.item} onSpeichern={onFlugRouteManuell} />
              ) : null}
            </li>
          ))}
          {abdeckung.unzugeordnet.map((item) => (
            <li
              key={item.id}
              className="grid min-w-0 gap-3 rounded-2xl border border-line-200 px-3 py-3"
            >
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-800 break-words">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-ink-800">
                    Noch keinem Reiseabschnitt sicher zuordenbar
                  </p>
                  <div className="mt-2">
                    <FlugRoute facts={routeFactsFuerPunkt(item)} />
                  </div>
                </div>
                <div className="flex min-h-11 flex-wrap items-center gap-2">
                  <BuchungsSiegel status={item.bookingStatus === 'booked' ? 'booked' : 'selected'} />
                  {kannBuchungMarkieren(item) && onBuchungsstatus ? (
                    <button
                      type="button"
                      disabled={laeuft === item.id}
                      onClick={() => void setzen(item.id, item.bookingStatus !== 'booked')}
                      className="inline-flex min-h-11 items-center rounded-full border border-line-300 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:border-line-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:opacity-50"
                    >
                      {item.bookingStatus === 'booked' ? 'Buchung korrigieren' : 'Als gebucht markieren'}
                    </button>
                  ) : null}
                </div>
              </div>
              {onFlugRouteManuell && istManuellerFlug(item) ? (
                <ManuelleFlugRoute item={item} onSpeichern={onFlugRouteManuell} />
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {meldung ? (
        <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {meldung}
        </p>
      ) : null}
    </section>
  )
}
