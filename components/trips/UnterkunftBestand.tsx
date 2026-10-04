'use client'

import * as React from 'react'
import { BedDouble } from 'lucide-react'

import BuchungsSiegel from '@/components/trips/BuchungsSiegel'
import { kannBuchungMarkieren } from '@/lib/trips/buchung'
import { zeitraumKurz } from '@/lib/trips/datum-anzeige'
import { unterkunftAbdeckung } from '@/lib/trips/naechte-abdeckung'
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
  const [meldung, setMeldung] = React.useState('')
  const [laeuft, setLaeuft] = React.useState<string | null>(null)
  const abdeckung = unterkunftAbdeckung(reise, ohneTag)

  const setzen = async (itemId: string, gebucht: boolean) => {
    if (!onBuchungsstatus || laeuft) return
    setMeldung('')
    setLaeuft(itemId)
    const fehler = await onBuchungsstatus(itemId, gebucht)
    setLaeuft(null)
    if (fehler) setMeldung(fehler)
  }

  const kopf =
    abdeckung.bekannt && abdeckung.naechteGesamt !== null && abdeckung.naechteAbgedeckt !== null
      ? `${abdeckung.naechteAbgedeckt} von ${abdeckung.naechteGesamt} Nächten abgedeckt`
      : abdeckung.zusammenfassung

  return (
    <section
      aria-label="Deine Unterkunft"
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
          {abdeckung.aufenthalte.map((aufenthalt) => (
            <li
              key={aufenthalt.item.id}
              className="grid min-w-0 gap-3 rounded-2xl border border-line-200 px-3 py-3"
            >
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-800 break-words">{aufenthalt.item.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-ink-800">
                    {zeitraumKurz(aufenthalt.start, aufenthalt.end)}
                    {aufenthalt.naechte ? ` · ${aufenthalt.naechte} ${aufenthalt.naechte === 1 ? 'Nacht' : 'Nächte'}` : ''}
                    {aufenthalt.ausserhalb ? ' · ausserhalb des Reisezeitraums' : ''}
                  </p>
                </div>
                <div className="flex min-h-11 flex-wrap items-center gap-2">
                  <BuchungsSiegel status={aufenthalt.status} />
                  {kannBuchungMarkieren(aufenthalt.item) && onBuchungsstatus ? (
                    <button
                      type="button"
                      disabled={laeuft === aufenthalt.item.id}
                      onClick={() => void setzen(aufenthalt.item.id, aufenthalt.status !== 'booked')}
                      className="inline-flex min-h-11 items-center rounded-full border border-line-300 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:border-line-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:opacity-50"
                    >
                      {aufenthalt.status === 'booked' ? 'Buchung korrigieren' : 'Als gebucht markieren'}
                    </button>
                  ) : null}
                </div>
              </div>
              {onUnterkunftZeitraum && istManuelleUnterkunft(aufenthalt.item) ? (
                <UnterkunftZeitraum item={aufenthalt.item} onSpeichern={onUnterkunftZeitraum} />
              ) : null}
            </li>
          ))}
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
                  {luecke.naechte} {luecke.naechte === 1 ? 'Nacht fehlt' : 'Nächte fehlen'}
                </p>
              </div>
              <BuchungsSiegel status="open" />
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

function UnterkunftZeitraum({ item, onSpeichern }: { item: TripItem; onSpeichern: ZeitraumSpeichern }) {
  const id = React.useId()
  const knopf = React.useRef<HTMLButtonElement>(null)
  const schreibt = React.useRef(false)
  const [offen, setOffen] = React.useState(false)
  const [startsOn, setStartsOn] = React.useState('')
  const [endsOn, setEndsOn] = React.useState('')
  const [fehler, setFehler] = React.useState('')
  const [feldfehler, setFeldfehler] = React.useState(false)
  const [laeuft, setLaeuft] = React.useState(false)
  const [gespeichert, setGespeichert] = React.useState(false)
  const vollstaendig = unterkunftZeitraumSchema.safeParse(item).success

  const schliessen = () => {
    setOffen(false)
    setFehler('')
    knopf.current?.focus()
  }

  const speichern = async (event: React.FormEvent) => {
    event.preventDefault()
    if (schreibt.current) return
    const zeitraum = unterkunftZeitraumSchema.safeParse({ startsOn, endsOn })
    setFeldfehler(!zeitraum.success)
    if (!zeitraum.success) {
      setFehler(ersteMeldung(zeitraum.error))
      return
    }
    schreibt.current = true
    setLaeuft(true)
    setFehler('')
    try {
      const meldung = await onSpeichern(item.id, zeitraum.data.startsOn, zeitraum.data.endsOn)
      if (meldung) setFehler(meldung)
      else {
        schliessen()
        setGespeichert(true)
      }
    } catch {
      setFehler('Der Zeitraum konnte nicht gespeichert werden. Bitte versuche es erneut.')
    } finally {
      schreibt.current = false
      setLaeuft(false)
    }
  }

  return (
    <div className="min-w-0 border-t border-line-100 pt-3">
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
            setFeldfehler(false)
            setGespeichert(false)
            setOffen(true)
          }
        }}
        className="mt-2 inline-flex min-h-11 max-w-full items-center rounded-full border border-line-300 bg-white px-3 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:opacity-50"
      >
        {vollstaendig ? 'Zeitraum ändern' : 'Zeitraum ergänzen'}
      </button>
      {offen ? (
        <form id={`${id}-formular`} aria-label={`Zeitraum für ${item.title}`} noValidate onSubmit={speichern} className="mt-3 grid min-w-0 gap-3" aria-busy={laeuft}>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <label className="grid min-w-0 gap-1 text-sm font-medium text-brand-800" htmlFor={`${id}-check-in`}>
              Check-in
              <input id={`${id}-check-in`} type="date" required value={startsOn} disabled={laeuft}
                onChange={(event) => setStartsOn(event.target.value)}
                aria-invalid={feldfehler || undefined} aria-describedby={fehler ? `${id}-fehler` : undefined}
                className="min-h-11 min-w-0 w-full max-w-full rounded-xl border border-line-300 bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15" />
            </label>
            <label className="grid min-w-0 gap-1 text-sm font-medium text-brand-800" htmlFor={`${id}-check-out`}>
              Check-out
              <input id={`${id}-check-out`} type="date" required value={endsOn} disabled={laeuft}
                onChange={(event) => setEndsOn(event.target.value)}
                aria-invalid={feldfehler || undefined} aria-describedby={fehler ? `${id}-fehler` : undefined}
                className="min-h-11 min-w-0 w-full max-w-full rounded-xl border border-line-300 bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15" />
            </label>
          </div>
          {fehler ? <p id={`${id}-fehler`} role="alert" className="break-words text-sm text-danger-600">{fehler}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={laeuft} className="min-h-11 rounded-full bg-brand-800 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20 disabled:opacity-50">
              {laeuft ? 'Wird gespeichert …' : 'Zeitraum speichern'}
            </button>
            <button type="button" disabled={laeuft} onClick={schliessen} className="min-h-11 rounded-full border border-line-300 px-4 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:opacity-50">
              Abbrechen
            </button>
          </div>
        </form>
      ) : null}
      {gespeichert ? <p role="status" className="mt-2 text-sm text-brand-700">Zeitraum gespeichert.</p> : null}
    </div>
  )
}
