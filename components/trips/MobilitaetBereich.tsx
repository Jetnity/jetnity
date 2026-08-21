'use client'

// components/trips/MobilitaetBereich.tsx
//
// Ein Bereich für Bahn, Bus, Fähre und Transfer. Bestand und ehrliche
// Abdeckung zuerst, darunter Suche und manuelle Erfassung.
// Keine Fake-Angebote.

import * as React from 'react'
import { ArrowRightLeft, Loader2 } from 'lucide-react'

import BuchungsSiegel from '@/components/trips/BuchungsSiegel'
import { mobilitySucheFehlerAntwort, mobilitySucheVomClient } from '@/lib/mobility/client-anfrage'
import type { MobilitySucheAntwort } from '@/lib/mobility/client-sicht'
import { MOBILITY_MODE_BEZEICHNUNG } from '@/lib/mobility/domain'
import { mobilitaetsAbdeckung, type Bewegungskante } from '@/lib/mobility/kanten'
import type { MobilityManuellEingabe } from '@/lib/mobility/schema'
import { kannBuchungMarkieren } from '@/lib/trips/buchung'
import { datumKurz } from '@/lib/trips/datum-anzeige'
import { MOBILITY_MODES, type MobilityMode, type Trip, type TripItem } from '@/types/trips'

function kanteTitel(kante: Bewegungskante): string {
  const route = `${kante.originName} → ${kante.destinationName}`
  return kante.date ? `${route} · ${datumKurz(kante.date)}` : route
}

function modusText(punkt: TripItem): string {
  return punkt.mobilityMode ? MOBILITY_MODE_BEZEICHNUNG[punkt.mobilityMode] : 'Verbindung'
}

const MODI = MOBILITY_MODES

export default function MobilitaetBereich({
  reise,
  ohneTag = [],
  onBuchungsstatus,
  onManuellAnlegen,
}: {
  reise: Trip
  ohneTag?: readonly TripItem[]
  onBuchungsstatus?: (itemId: string, gebucht: boolean) => Promise<string | null>
  onManuellAnlegen?: (eingabe: MobilityManuellEingabe) => Promise<string | null>
}) {
  const [meldung, setMeldung] = React.useState('')
  const [laeuft, setLaeuft] = React.useState<string | null>(null)
  const [suche, setSuche] = React.useState<MobilitySucheAntwort | null>(null)
  const [sucht, setSucht] = React.useState(false)
  const abdeckung = mobilitaetsAbdeckung(reise, ohneTag)

  const setzen = async (itemId: string, gebucht: boolean) => {
    if (!onBuchungsstatus || laeuft) return
    setMeldung('')
    setLaeuft(itemId)
    const fehler = await onBuchungsstatus(itemId, gebucht)
    setLaeuft(null)
    if (fehler) setMeldung(fehler)
  }

  React.useEffect(() => {
    const erste = reise.stages[0]
    if (!reise.origin || !erste) return
    const steuer = new AbortController()
    setSucht(true)
    void mobilitySucheVomClient(
      {
        originName: reise.origin,
        destinationName: erste.name,
        originPlaceId: reise.originPlaceId,
        destinationPlaceId: erste.placeId,
        date: erste.arrivalDate ?? reise.startDate,
        mode: null,
        travellers: reise.travellers,
        currency: reise.currency,
      },
      steuer.signal,
    )
      .then((antwort) => {
        if (!steuer.signal.aborted) setSuche(antwort)
      })
      .catch((fehler) => {
        if (steuer.signal.aborted) return
        setSuche(
          mobilitySucheFehlerAntwort(
            fehler instanceof Error ? fehler.message : 'Die Mobilitätssuche ist gerade nicht verfügbar.',
          ),
        )
      })
      .finally(() => {
        if (!steuer.signal.aborted) setSucht(false)
      })
    return () => steuer.abort()
  }, [reise])

  return (
    <div className="grid gap-6">
      <section
        aria-label="Deine Verbindungen"
        className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,46,42,0.06)] sm:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
              Deine Verbindungen
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
              Bestand und Status
            </h2>
            <p className="mt-1 text-sm leading-6 text-ink-800">{abdeckung.zusammenfassung}</p>
          </div>
          <ArrowRightLeft className="h-5 w-5 text-brand-600" aria-hidden="true" />
        </div>

        {abdeckung.kanten.length === 0 && abdeckung.unzugeordnet.length === 0 ? (
          <p className="mt-5 rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800">
            {abdeckung.bestimmbar
              ? 'Für diese Reise ist keine zusätzliche Bodenverbindung erkennbar, oder es liegt noch keine vor.'
              : 'Die benötigten Verbindungen sind aus den vorliegenden Reisedaten noch nicht vollständig bestimmbar.'}
          </p>
        ) : (
          <ul className="mt-5 grid gap-2">
            {abdeckung.kanten.map((kante) => (
              <li
                key={kante.id}
                className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-800 break-words">{kanteTitel(kante)}</p>
                  {kante.mobilityItem ? (
                    <p className="mt-0.5 text-xs leading-5 text-ink-800 break-words">
                      {modusText(kante.mobilityItem)}
                      {kante.mobilityItem.connectionRef ? ` · ${kante.mobilityItem.connectionRef}` : ''}
                      {kante.durationMinutes !== null ? ` · ${kante.durationMinutes} Min.` : ''}
                    </p>
                  ) : kante.flightItem ? (
                    <p className="mt-0.5 text-xs leading-5 text-ink-800 break-words">
                      {kante.flightItem.title}
                    </p>
                  ) : null}
                </div>
                <div className="flex min-h-11 flex-wrap items-center gap-2">
                  <BuchungsSiegel status={kante.status} />
                  {kante.mobilityItem && kannBuchungMarkieren(kante.mobilityItem) && onBuchungsstatus ? (
                    <button
                      type="button"
                      disabled={laeuft === kante.mobilityItem.id}
                      onClick={() => void setzen(kante.mobilityItem!.id, kante.status !== 'booked')}
                      className="inline-flex min-h-11 items-center rounded-full border border-line-300 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:border-line-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:opacity-50"
                    >
                      {kante.status === 'booked' ? 'Buchung korrigieren' : 'Als gebucht markieren'}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
            {abdeckung.unzugeordnet.map((item) => (
              <li
                key={item.id}
                className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-800 break-words">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-ink-800">
                    {modusText(item)} · noch keinem Reiseabschnitt sicher zuordenbar
                  </p>
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

      <section
        aria-label="Mobilitätssuche"
        className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,46,42,0.06)] sm:p-7"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Suche</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
          Bahn, Bus, Fähre und Transfer
        </h2>
        {sucht ? (
          <p className="mt-5 flex min-h-[4.5rem] items-center gap-2 text-sm leading-6 text-ink-800">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Verbindungen werden geprüft …
          </p>
        ) : (
          <p className="mt-5 min-h-[4.5rem] rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800">
            {suche?.message ??
              'Verbindungen per Bahn, Bus, Fähre oder Transfer werden vorbereitet. Sobald ein Datenpartner angebunden ist, erscheinen hier echte Angebote – ohne erfundene Fahrpläne oder Preise.'}
          </p>
        )}
      </section>

      {onManuellAnlegen ? <ManuelleVerbindung reise={reise} onAnlegen={onManuellAnlegen} /> : null}
    </div>
  )
}

function ManuelleVerbindung({
  reise,
  onAnlegen,
}: {
  reise: Trip
  onAnlegen: (eingabe: MobilityManuellEingabe) => Promise<string | null>
}) {
  const [mode, setMode] = React.useState<MobilityMode>('rail')
  const [originName, setOriginName] = React.useState(reise.origin ?? '')
  const [destinationName, setDestinationName] = React.useState(reise.stages[0]?.name ?? '')
  const [startsOn, setStartsOn] = React.useState(reise.startDate ?? '')
  const [startsAt, setStartsAt] = React.useState('')
  const [endsOn, setEndsOn] = React.useState('')
  const [endsAt, setEndsAt] = React.useState('')
  const [connectionRef, setConnectionRef] = React.useState('')
  const [note, setNote] = React.useState('')
  const [dayId, setDayId] = React.useState(reise.days[0]?.id ?? '')
  const [laeuft, setLaeuft] = React.useState(false)
  const [meldung, setMeldung] = React.useState('')
  const [hinweis, setHinweis] = React.useState('')

  const speichern = async (ereignis: React.FormEvent) => {
    ereignis.preventDefault()
    if (laeuft) return
    setMeldung('')
    setHinweis('')
    setLaeuft(true)
    const fehler = await onAnlegen({
      mode,
      title: null,
      originName,
      destinationName,
      originPlaceId: null,
      destinationPlaceId: null,
      startsOn: startsOn || null,
      startsAt: startsAt || null,
      endsOn: endsOn || null,
      endsAt: endsAt || null,
      connectionRef: connectionRef || null,
      mobilityChanges: null,
      priceAmount: null,
      priceCurrency: null,
      note: note || null,
      dayId: dayId || null,
      stageId: reise.days.find((tag) => tag.id === dayId)?.stageId ?? reise.stages[0]?.id ?? null,
    })
    setLaeuft(false)
    if (fehler) {
      setMeldung(fehler)
      return
    }
    setHinweis('Die Verbindung ist als Nutzerangabe gespeichert – nicht als Providerbestätigung.')
    setConnectionRef('')
    setNote('')
  }

  return (
    <section
      aria-label="Manuelle Verbindung"
      className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,46,42,0.06)] sm:p-7"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Manuell</p>
      <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
        Bekannte Verbindung eintragen
      </h2>
      <p className="mt-1 text-sm leading-6 text-ink-800">
        Das sind deine Angaben, keine geprüften Fahrpläne oder Preise.
      </p>

      <form className="mt-5 grid gap-3" onSubmit={(ereignis) => void speichern(ereignis)}>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            Art
            <select
              value={mode}
              onChange={(ereignis) => setMode(ereignis.target.value as MobilityMode)}
              className="min-h-11 rounded-2xl border border-line-200 bg-white px-3 text-sm text-ink-900"
            >
              {MODI.map((wert) => (
                <option key={wert} value={wert}>
                  {MOBILITY_MODE_BEZEICHNUNG[wert]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            Tag
            <select
              value={dayId}
              onChange={(ereignis) => setDayId(ereignis.target.value)}
              className="min-h-11 rounded-2xl border border-line-200 bg-white px-3 text-sm text-ink-900"
            >
              <option value="">Noch nicht eingeplant</option>
              {reise.days.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.title || (tag.dayDate ? datumKurz(tag.dayDate) : `Tag ${tag.dayIndex}`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            Von
            <input
              value={originName}
              onChange={(ereignis) => setOriginName(ereignis.target.value)}
              required
              maxLength={120}
              className="min-h-11 rounded-2xl border border-line-200 bg-white px-3 text-base text-ink-900 sm:text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            Nach
            <input
              value={destinationName}
              onChange={(ereignis) => setDestinationName(ereignis.target.value)}
              required
              maxLength={120}
              className="min-h-11 rounded-2xl border border-line-200 bg-white px-3 text-base text-ink-900 sm:text-sm"
            />
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            Abfahrt
            <input
              type="date"
              value={startsOn}
              onChange={(ereignis) => setStartsOn(ereignis.target.value)}
              className="min-h-11 rounded-2xl border border-line-200 bg-white px-3 text-base text-ink-900 sm:text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            Uhrzeit
            <input
              type="time"
              value={startsAt}
              onChange={(ereignis) => setStartsAt(ereignis.target.value)}
              className="min-h-11 rounded-2xl border border-line-200 bg-white px-3 text-base text-ink-900 sm:text-sm"
            />
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            Ankunft
            <input
              type="date"
              value={endsOn}
              onChange={(ereignis) => setEndsOn(ereignis.target.value)}
              className="min-h-11 rounded-2xl border border-line-200 bg-white px-3 text-base text-ink-900 sm:text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            Uhrzeit
            <input
              type="time"
              value={endsAt}
              onChange={(ereignis) => setEndsAt(ereignis.target.value)}
              className="min-h-11 rounded-2xl border border-line-200 bg-white px-3 text-base text-ink-900 sm:text-sm"
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm font-medium text-brand-800">
          Verbindungsnummer, falls bekannt
          <input
            value={connectionRef}
            onChange={(ereignis) => setConnectionRef(ereignis.target.value)}
            maxLength={40}
            className="min-h-11 rounded-2xl border border-line-200 bg-white px-3 text-base text-ink-900 sm:text-sm"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-brand-800">
          Notiz
          <textarea
            value={note}
            onChange={(ereignis) => setNote(ereignis.target.value)}
            maxLength={500}
            rows={2}
            className="rounded-2xl border border-line-200 bg-white px-3 py-2 text-base text-ink-900 sm:text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={laeuft}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:opacity-50"
        >
          {laeuft ? 'Wird gespeichert …' : 'Verbindung speichern'}
        </button>
      </form>

      {meldung ? (
        <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {meldung}
        </p>
      ) : null}
      {hinweis ? (
        <p role="status" className="mt-4 rounded-2xl bg-surface-25 px-4 py-3 text-sm text-ink-800">
          {hinweis}
        </p>
      ) : null}
    </section>
  )
}
