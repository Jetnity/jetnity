'use client'

import * as React from 'react'
import { BedDouble } from 'lucide-react'

import BuchungsSiegel from '@/components/trips/BuchungsSiegel'
import { istGebucht, kannBuchungMarkieren } from '@/lib/trips/buchung'
import {
  BUCHUNG_AKTION_KLASSE,
  BUCHUNG_WIRD_GESPEICHERT,
  bookingItemDisappeared,
  bookingTripChanged,
  createBookingMemory,
  startBookingAction,
} from '@/components/trips/useBookingActionLifecycle'
import { zeitraumKurz } from '@/lib/trips/datum-anzeige'
import { unterkunftAbdeckung } from '@/lib/trips/naechte-abdeckung'
import { gleicherEditorKontext } from '@/lib/trips/manual-journey-editor-completion-1'
import { ORGANISIEREN_FLAECHE_KLASSE } from '@/lib/trips/organize-premium-experience-6'
import { ersteMeldung, unterkunftZeitraumSchema } from '@/lib/trips/schema'
import { istManuelleUnterkunft } from '@/lib/trips/unterkunft-manuell'
import type { Trip, TripItem } from '@/types/trips'

type ZeitraumSpeichern = (itemId: string, startsOn: string, endsOn: string) => Promise<string | null>

export default function UnterkunftBestand({
  reise,
  ohneTag = [],
  onBuchungsstatus,
  onUnterkunftZeitraum,
}: {
  reise: Trip
  ohneTag?: readonly TripItem[]
  onBuchungsstatus?: (itemId: string, gebucht: boolean) => Promise<string | null>
  onUnterkunftZeitraum?: ZeitraumSpeichern
}) {
  const abdeckung = unterkunftAbdeckung(reise, ohneTag)
  const datumUnbekannt = abdeckung.aufenthalte.some((aufenthalt) => aufenthalt.status === 'unknown')
  const aktionIds = abdeckung.aufenthalte.map((aufenthalt) => aufenthalt.item.id)
  const [memory] = React.useState(createBookingMemory())
  const [pendingId, setPendingId] = React.useState<string | null>(null)
  const [meldung, setMeldung] = React.useState('')
  const [seenTripId, setSeenTripId] = React.useState(reise.id)
  if (bookingTripChanged(memory, seenTripId, reise.id)) {
    setSeenTripId(reise.id)
    setPendingId(null)
    setMeldung('')
  }
  if (bookingItemDisappeared(memory, aktionIds)) setPendingId(null)

  const setzen = (itemId: string, gebucht: boolean, button: HTMLButtonElement | null) => {
    if (!onBuchungsstatus) return
    startBookingAction(memory, onBuchungsstatus, itemId, gebucht, button, (nextPending, nextMessage) => {
      setPendingId(nextPending)
      setMeldung(nextMessage)
    })
  }

  const kopf = datumUnbekannt
    ? abdeckung.zusammenfassung
    : abdeckung.bekannt && abdeckung.naechteGesamt !== null && abdeckung.naechteAbgedeckt !== null
      ? `${abdeckung.naechteAbgedeckt} von ${abdeckung.naechteGesamt} Nächten abgedeckt`
      : abdeckung.zusammenfassung

  return (
    <section
      aria-label="Deine Unterkunft"
      aria-busy={pendingId !== null}
      data-organisieren-flaeche="bestand"
      className={ORGANISIEREN_FLAECHE_KLASSE}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Deine Unterkunft</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
            Nächte-Abdeckung
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink-800">{kopf}</p>
        </div>
        <BedDouble className="h-5 w-5 text-brand-600" aria-hidden="true" />
      </div>

      {abdeckung.aufenthalte.length === 0 && abdeckung.luecken.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800">
          {abdeckung.bekannt
            ? 'Noch keine Unterkunft ausgewählt.'
            : 'Die Nächte-Abdeckung ist aus den vorliegenden Reisedaten noch nicht vollständig bestimmbar.'}
        </p>
      ) : (
        <ul className="mt-5 grid gap-2">
          {abdeckung.aufenthalte.map((aufenthalt) => {
            const gebucht = istGebucht(aufenthalt.item)
            const zeitraum = zeitraumKurz(aufenthalt.start, aufenthalt.end)
            const scheinbarerZeitraum = aufenthalt.status === 'unknown' && zeitraum !== 'Zeitraum noch nicht bestimmbar'
            return (
            <li
              key={aufenthalt.item.id}
              className="grid min-w-0 gap-3 rounded-2xl border border-line-200 px-3 py-3"
            >
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-800 break-words">{aufenthalt.item.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-ink-800">
                    {scheinbarerZeitraum ? 'Der Zeitraum fehlt oder ist unvollständig bzw. ungültig.' : (
                      <>
                        {zeitraum}
                        {aufenthalt.naechte ? ` · ${aufenthalt.naechte} ${aufenthalt.naechte === 1 ? 'Nacht' : 'Nächte'}` : ''}
                        {aufenthalt.ausserhalb ? ' · ausserhalb des Reisezeitraums' : ''}
                      </>
                    )}
                  </p>
                  {aufenthalt.status === 'unknown' && !scheinbarerZeitraum ? (
                    <p className="mt-0.5 text-xs leading-5 text-ink-800">
                      Der Zeitraum fehlt oder ist unvollständig bzw. ungültig.
                    </p>
                  ) : null}
                </div>
                <div className="flex min-h-11 flex-wrap items-center gap-2">
                  <BuchungsSiegel status={gebucht ? 'booked' : 'selected'} />
                  {kannBuchungMarkieren(aufenthalt.item) && onBuchungsstatus ? (
                    <button
                      type="button"
                      disabled={pendingId !== null && pendingId !== aufenthalt.item.id}
                      aria-disabled={pendingId !== null}
                      onClick={(event) => setzen(aufenthalt.item.id, !gebucht, event?.currentTarget ?? null)}
                      className={`${BUCHUNG_AKTION_KLASSE}${pendingId !== null ? ' opacity-50' : ''}`}
                    >
                      {pendingId === aufenthalt.item.id ? 'Wird gespeichert …' : gebucht ? 'Buchung korrigieren' : 'Als gebucht markieren'}
                    </button>
                  ) : null}
                </div>
              </div>
              {onUnterkunftZeitraum && istManuelleUnterkunft(aufenthalt.item) ? (
                <UnterkunftZeitraum
                  key={`${reise.id}:${aufenthalt.item.id}`}
                  reiseId={reise.id}
                  item={aufenthalt.item}
                  onSpeichern={onUnterkunftZeitraum}
                />
              ) : null}
            </li>
            )
          })}
          {abdeckung.luecken.map((luecke) => (
            <li
              key={`${luecke.start}:${luecke.end}:${luecke.stageId ?? 'reise'}`}
              className="flex min-w-0 flex-col gap-3 rounded-2xl border border-dashed border-line-300 bg-surface-25 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-800">
                  {zeitraumKurz(luecke.start, luecke.end)}
                  {luecke.stageName ? ` · ${luecke.stageName}` : ''}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-ink-800">
                  {datumUnbekannt
                    ? `${luecke.naechte} ${luecke.naechte === 1 ? 'Nacht' : 'Nächte'} noch nicht als fehlend bestimmbar`
                    : `${luecke.naechte} ${luecke.naechte === 1 ? 'Nacht fehlt' : 'Nächte fehlen'}`}
                </p>
              </div>
              <BuchungsSiegel status={datumUnbekannt ? 'unknown' : 'open'} />
            </li>
          ))}
        </ul>
      )}

      {pendingId ? <p role="status" className="mt-4 text-sm text-ink-800">{BUCHUNG_WIRD_GESPEICHERT}</p> : null}
      {meldung ? (
        <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {meldung}
        </p>
      ) : null}
    </section>
  )
}

function UnterkunftZeitraum({
  item,
  reiseId,
  onSpeichern,
}: {
  item: TripItem
  reiseId: string
  onSpeichern: ZeitraumSpeichern
}) {
  const id = React.useId()
  const knopf = React.useRef<HTMLButtonElement>(null)
  const checkIn = React.useRef<HTMLInputElement>(null)
  const checkOut = React.useRef<HTMLInputElement>(null)
  const zusammenfassung = React.useRef<HTMLParagraphElement>(null)
  const lebendig = React.useRef(true)
  const schreibt = React.useRef(false)
  const generationFest = React.useRef(0)
  const reiseFest = React.useRef(reiseId)
  const zielFest = React.useRef(item.id)
  const [generation, setGeneration] = React.useState(0)
  const [gesehen, setGesehen] = React.useState({ reiseId, itemId: item.id })
  const [offen, setOffen] = React.useState(false)
  const [startsOn, setStartsOn] = React.useState('')
  const [endsOn, setEndsOn] = React.useState('')
  const [fehler, setFehler] = React.useState('')
  const [validieren, setValidieren] = React.useState(false)
  const [fokus, setFokus] = React.useState(0)
  const [laeuft, setLaeuft] = React.useState(false)
  const [gespeichert, setGespeichert] = React.useState(false)
  if (!gleicherEditorKontext(
    { reiseId: gesehen.reiseId, zielId: gesehen.itemId },
    { reiseId, zielId: item.id },
  )) {
    setGesehen({ reiseId, itemId: item.id })
    setGeneration((bisher) => bisher + 1)
    setOffen(false)
    setStartsOn('')
    setEndsOn('')
    setFehler('')
    setValidieren(false)
    setGespeichert(false)
    setLaeuft(false)
  }
  const vollstaendig = unterkunftZeitraumSchema.safeParse(item).success
  const pruefung = validieren ? unterkunftZeitraumSchema.safeParse({ startsOn, endsOn }) : null
  const schemaFehler = pruefung && !pruefung.success ? pruefung.error : null
  const meldung = schemaFehler ? ersteMeldung(schemaFehler) : fehler
  const feldUngueltig = (name: 'startsOn' | 'endsOn') =>
    Boolean(schemaFehler?.issues.some((issue) => issue.path[0] === name))

  React.useLayoutEffect(() => {
    const gewechselt = generationFest.current !== generation
      || reiseFest.current !== reiseId
      || zielFest.current !== item.id
    generationFest.current = generation
    reiseFest.current = reiseId
    zielFest.current = item.id
    if (gewechselt) schreibt.current = false
  }, [generation, reiseId, item.id])

  React.useEffect(() => {
    lebendig.current = true
    return () => { lebendig.current = false }
  }, [])

  React.useEffect(() => {
    if (offen) checkIn.current?.focus()
  }, [offen])

  React.useEffect(() => {
    if (fokus === 0) return
    const ziel = checkIn.current?.getAttribute('aria-invalid') === 'true'
      ? checkIn.current
      : checkOut.current?.getAttribute('aria-invalid') === 'true'
        ? checkOut.current
        : zusammenfassung.current
    ziel?.focus()
  }, [fokus])

  const schliessen = () => {
    setOffen(false)
    setFehler('')
    knopf.current?.focus()
  }

  const speichern = async (event: React.FormEvent) => {
    event.preventDefault()
    if (schreibt.current) return
    const zeitraum = unterkunftZeitraumSchema.safeParse({ startsOn, endsOn })
    if (!zeitraum.success) {
      setFehler('')
      setValidieren(true)
      setFokus((bisher) => bisher + 1)
      return
    }
    const zielReise = reiseFest.current
    const zielItem = zielFest.current
    const generationJetzt = generationFest.current
    const passt = () => lebendig.current && generationFest.current === generationJetzt && gleicherEditorKontext(
      { reiseId: reiseFest.current, zielId: zielFest.current },
      { reiseId: zielReise, zielId: zielItem },
    )
    setValidieren(false)
    schreibt.current = true
    setLaeuft(true)
    setFehler('')
    try {
      const ergebnis = await onSpeichern(zielItem, zeitraum.data.startsOn, zeitraum.data.endsOn)
      if (!passt()) return
      if (ergebnis) {
        setFehler(ergebnis)
        setFokus((bisher) => bisher + 1)
      } else {
        schliessen()
        setGespeichert(true)
      }
    } catch {
      if (!passt()) return
      setFehler('Der Zeitraum konnte nicht gespeichert werden. Bitte versuche es erneut.')
      setFokus((bisher) => bisher + 1)
    } finally {
      if (passt()) {
        schreibt.current = false
        setLaeuft(false)
      }
    }
  }

  return (
    <div className="min-w-0 border-t border-line-100 pt-3" onKeyDown={(event) => {
      if (event.key !== 'Escape' || !offen) return
      event.preventDefault()
      event.stopPropagation()
      if (!schreibt.current) schliessen()
    }}>
      <p className="text-xs leading-5 text-ink-800 break-words">
        Check-in: {item.startsOn ?? 'offen'} · Check-out: {item.endsOn ?? 'offen'}
      </p>
      {!vollstaendig ? <p className="text-xs leading-5 text-ink-800">Der Zeitraum fehlt oder ist unvollständig bzw. ungültig.</p> : null}
      <button
        ref={knopf}
        type="button"
        aria-expanded={offen}
        aria-controls={offen ? `${id}-formular` : undefined}
        aria-disabled={laeuft}
        onClick={() => {
          if (schreibt.current) return
          if (offen) schliessen()
          else {
            setStartsOn(item.startsOn ?? '')
            setEndsOn(item.endsOn ?? '')
            setFehler('')
            setValidieren(false)
            setGespeichert(false)
            setOffen(true)
          }
        }}
        className="mt-2 inline-flex min-h-11 max-w-full items-center rounded-full border border-line-300 bg-white px-3 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:opacity-50"
      >
        {vollstaendig ? 'Zeitraum ändern' : 'Zeitraum ergänzen'}
      </button>
      {offen ? (
        <form id={`${id}-formular`} aria-label={`Zeitraum für ${item.title}`} noValidate onSubmit={speichern} className="mt-3 grid min-w-0 max-w-full gap-3" aria-busy={laeuft}>
          <div className="grid min-w-0 max-w-full gap-3 sm:grid-cols-2">
            <label className="grid min-w-0 max-w-full gap-1 text-sm font-medium text-brand-800" htmlFor={`${id}-check-in`}>
              Check-in
              <input ref={checkIn} id={`${id}-check-in`} type="date" required value={startsOn} disabled={laeuft}
                onChange={(event) => { setStartsOn(event.target.value); setFehler('') }}
                aria-invalid={feldUngueltig('startsOn') || undefined} aria-describedby={meldung ? `${id}-fehler` : undefined}
                className="min-h-11 min-w-0 w-full max-w-full rounded-xl border border-line-300 bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15" />
            </label>
            <label className="grid min-w-0 max-w-full gap-1 text-sm font-medium text-brand-800" htmlFor={`${id}-check-out`}>
              Check-out
              <input ref={checkOut} id={`${id}-check-out`} type="date" required value={endsOn} disabled={laeuft}
                onChange={(event) => { setEndsOn(event.target.value); setFehler('') }}
                aria-invalid={feldUngueltig('endsOn') || undefined} aria-describedby={meldung ? `${id}-fehler` : undefined}
                className="min-h-11 min-w-0 w-full max-w-full rounded-xl border border-line-300 bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15" />
            </label>
          </div>
          {meldung ? <p ref={zusammenfassung} id={`${id}-fehler`} role="alert" tabIndex={-1} className="break-words rounded text-sm text-danger-600 focus:outline-none focus:ring-4 focus:ring-brand-600/15">{meldung}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={laeuft} className="min-h-11 max-w-full rounded-full bg-brand-800 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20 disabled:opacity-50">
              {laeuft ? 'Wird gespeichert …' : 'Zeitraum speichern'}
            </button>
            <button type="button" disabled={laeuft} onClick={schliessen} className="min-h-11 max-w-full rounded-full border border-line-300 px-4 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:opacity-50">
              Abbrechen
            </button>
          </div>
        </form>
      ) : null}
      {gespeichert ? <p role="status" className="mt-2 text-sm text-brand-700">Zeitraum gespeichert.</p> : null}
    </div>
  )
}
