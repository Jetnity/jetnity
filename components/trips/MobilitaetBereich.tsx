'use client'

// components/trips/MobilitaetBereich.tsx
//
// Ein Bereich für Bahn, Bus, Fähre und Transfer. Bestand und ehrliche
// Abdeckung zuerst, darunter Suche und manuelle Erfassung.
// Keine Fake-Angebote.

import * as React from 'react'
import { ArrowRightLeft, Loader2 } from 'lucide-react'

import BuchungsSiegel from '@/components/trips/BuchungsSiegel'
import MietwagenBereich from '@/components/trips/MietwagenBereich'
import TwelveGoAffiliateLinks from '@/components/trips/TwelveGoAffiliateLinks'
import OrganisierenFeldgruppe from '@/components/trips/OrganisierenFeldgruppe'
import { mobilitySucheFehlerAntwort, mobilitySucheVomClient } from '@/lib/mobility/client-anfrage'
import type { MobilitySucheAntwort } from '@/lib/mobility/client-sicht'
import { MOBILITY_MODE_BEZEICHNUNG } from '@/lib/mobility/domain'
import { mobilitaetsAbdeckung, type Bewegungskante } from '@/lib/mobility/kanten'
import type { MobilityManuellEingabe } from '@/lib/mobility/schema'
import { mobilitySucheStartetAutomatisch } from '@/lib/mobility/suche-ausloeser'
import type { RentalCarManuellEingabe } from '@/lib/rental-cars/schema'
import { mietwagenBestand } from '@/lib/rental-cars/bestand'
import { kannBuchungMarkieren } from '@/lib/trips/buchung'
import {
  BUCHUNG_AKTION_KLASSE,
  BUCHUNG_WIRD_GESPEICHERT,
  bookingItemDisappeared,
  bookingTripChanged,
  createBookingMemory,
  startBookingAction,
} from '@/components/trips/useBookingActionLifecycle'
import { ARBEITSFELD_SPALTEN_KLASSE } from '@/lib/trips/cross-device-interaction-1'
import { datumKurz } from '@/lib/trips/datum-anzeige'
import {
  feldFolgtVorgabe,
  verbindungsVorgabeAus,
  vorgabeSchluessel,
} from '@/lib/trips/manual-journey-editor-completion-1'
import {
  ORGANISIEREN_EINGABE_KLASSE,
  ORGANISIEREN_FLAECHE_KLASSE,
  ORGANISIEREN_PRIMAR_KLASSE,
  ORGANISIEREN_TEXTAREA_KLASSE,
} from '@/lib/trips/organize-premium-experience-6'
import { cn } from '@/lib/utils'
import { MOBILITY_MODES, type MobilityMode, type Trip, type TripItem } from '@/types/trips'

const UNTERBEREICHE = ['verbindungen', 'mietwagen'] as const
type MobilitaetUnterbereich = (typeof UNTERBEREICHE)[number]

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
  onMietwagenAnlegen,
  sichtbar = true,
}: {
  reise: Trip
  ohneTag?: readonly TripItem[]
  onBuchungsstatus?: (itemId: string, gebucht: boolean) => Promise<string | null>
  onManuellAnlegen?: (eingabe: MobilityManuellEingabe) => Promise<string | null>
  onMietwagenAnlegen?: (eingabe: RentalCarManuellEingabe) => Promise<string | null>
  sichtbar?: boolean
}) {
  const [suche, setSuche] = React.useState<MobilitySucheAntwort | null>(null)
  const [sucht, setSucht] = React.useState(false)
  const abdeckung = mobilitaetsAbdeckung(reise, ohneTag)
  const mietwagen = mietwagenBestand(reise, ohneTag)
  const [unterbereich, setUnterbereich] = React.useState<MobilitaetUnterbereich>(() =>
    mietwagen.items.length > 0 && abdeckung.kanten.every((kante) => !kante.mobilityItem) && abdeckung.unzugeordnet.length === 0
      ? 'mietwagen'
      : 'verbindungen',
  )
  const [mietwagenBesucht, setMietwagenBesucht] = React.useState(
    () =>
      mietwagen.items.length > 0 &&
      abdeckung.kanten.every((kante) => !kante.mobilityItem) &&
      abdeckung.unzugeordnet.length === 0,
  )

  const abdeckungIds = [
    ...abdeckung.kanten.flatMap((kante) => (kante.mobilityItem ? [kante.mobilityItem.id] : [])),
    ...abdeckung.unzugeordnet.map((item) => item.id),
  ]
  const [memory] = React.useState(createBookingMemory())
  const [pendingId, setPendingId] = React.useState<string | null>(null)
  const [meldung, setMeldung] = React.useState('')
  const [seenTripId, setSeenTripId] = React.useState(reise.id)
  if (bookingTripChanged(memory, seenTripId, reise.id)) {
    setSeenTripId(reise.id)
    setPendingId(null)
    setMeldung('')
  }
  if (bookingItemDisappeared(memory, abdeckungIds)) setPendingId(null)

  const setzen = (itemId: string, gebucht: boolean, button: HTMLButtonElement | null) => {
    if (!onBuchungsstatus) return
    startBookingAction(memory, onBuchungsstatus, itemId, gebucht, button, (nextPending, nextMessage) => {
      setPendingId(nextPending)
      setMeldung(nextMessage)
    })
  }

  const sucheStarten = () => {
    if (sucht || mobilitySucheStartetAutomatisch()) return
    const erste = reise.stages[0]
    if (!reise.origin || !erste) {
      setSuche(
        mobilitySucheFehlerAntwort(
          'Start und Ziel der Verbindung sind aus den Reisedaten noch nicht bestimmbar.',
        ),
      )
      return
    }
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
        setSuche(antwort)
      })
      .catch((fehler) => {
        setSuche(
          mobilitySucheFehlerAntwort(
            fehler instanceof Error ? fehler.message : 'Die Mobilitätssuche ist gerade nicht verfügbar.',
          ),
        )
      })
      .finally(() => {
        setSucht(false)
      })
  }

  return (
    <div className="grid gap-6">
      <div
        role="tablist"
        aria-label="Mobilitätsbereiche"
        className="flex min-h-11 min-w-0 max-w-full flex-wrap gap-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={unterbereich === 'verbindungen'}
          onClick={() => setUnterbereich('verbindungen')}
          className={`inline-flex min-h-11 max-w-full items-center whitespace-normal rounded-full px-4 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 ${
            unterbereich === 'verbindungen'
              ? 'bg-brand-800 text-white'
              : 'border border-line-300 bg-white text-brand-800 hover:border-line-400'
          }`}
        >
          Verbindungen
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={unterbereich === 'mietwagen'}
          onClick={() => {
            setUnterbereich('mietwagen')
            setMietwagenBesucht(true)
          }}
          className={`inline-flex min-h-11 max-w-full items-center whitespace-normal rounded-full px-4 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 ${
            unterbereich === 'mietwagen'
              ? 'bg-brand-800 text-white'
              : 'border border-line-300 bg-white text-brand-800 hover:border-line-400'
          }`}
        >
          Mietwagen
        </button>
      </div>

      {mietwagenBesucht ? (
        <div
          hidden={unterbereich !== 'mietwagen'}
          className={unterbereich === 'mietwagen' ? 'grid gap-6' : 'hidden'}
        >
          <MietwagenBereich
            reise={reise}
            sichtbar={sichtbar && unterbereich === 'mietwagen'}
            ohneTag={ohneTag}
            onBuchungsstatus={onBuchungsstatus}
            onManuellAnlegen={onMietwagenAnlegen}
          />
        </div>
      ) : null}

      <div hidden={unterbereich !== 'verbindungen'} className={unterbereich === 'verbindungen' ? 'grid gap-6' : 'hidden'}>
      <section
        aria-label="Deine Verbindungen"
        aria-busy={pendingId !== null}
        data-organisieren-flaeche="bestand"
        className={ORGANISIEREN_FLAECHE_KLASSE}
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
                      disabled={pendingId !== null && pendingId !== kante.mobilityItem.id}
                      aria-disabled={pendingId !== null}
                      onClick={(event) => setzen(kante.mobilityItem!.id, kante.status !== 'booked', event?.currentTarget ?? null)}
                      className={`${BUCHUNG_AKTION_KLASSE}${pendingId !== null ? ' opacity-50' : ''}`}
                    >
                      {pendingId === kante.mobilityItem.id ? 'Wird gespeichert …' : kante.status === 'booked' ? 'Buchung korrigieren' : 'Als gebucht markieren'}
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
                      disabled={pendingId !== null && pendingId !== item.id}
                      aria-disabled={pendingId !== null}
                      onClick={(event) => setzen(item.id, item.bookingStatus !== 'booked', event?.currentTarget ?? null)}
                      className={`${BUCHUNG_AKTION_KLASSE}${pendingId !== null ? ' opacity-50' : ''}`}
                    >
                      {pendingId === item.id ? 'Wird gespeichert …' : item.bookingStatus === 'booked' ? 'Buchung korrigieren' : 'Als gebucht markieren'}
                    </button>
                  ) : null}
                </div>
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

      {(process.env.NEXT_PUBLIC_TWELVE_GO_TIMETABLE_ENABLED !== 'true' || (sichtbar && unterbereich === 'verbindungen')) && <TwelveGoAffiliateLinks reise={reise} />}

      <section
        aria-label="Mobilitätssuche"
        data-organisieren-flaeche="suche"
        className={cn(ORGANISIEREN_FLAECHE_KLASSE, 'relative overflow-hidden')}
      >
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-citrus-400" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Suche</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
          Bahn, Bus, Fähre und Transfer
        </h2>
        {sucht ? (
          <p className="mt-5 flex min-h-[4.5rem] items-center gap-2 text-sm leading-6 text-ink-800">
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            Verbindungen werden geprüft …
          </p>
        ) : (
          <p className="mt-5 min-h-[4.5rem] rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800">
            {suche?.message ?? (process.env.NEXT_PUBLIC_TWELVE_GO_TIMETABLE_ENABLED === 'true'
              ? 'Die 12Go-Informationen oben geben dir einen allgemeinen Überblick. Eine Suche nach verfügbaren Verbindungen für deinen konkreten Reisetag ist hier noch nicht angebunden.'
              : 'Verbindungen per Bahn, Bus, Fähre oder Transfer werden vorbereitet. Sobald ein Datenpartner angebunden ist, erscheinen hier echte Angebote – ohne erfundene Fahrpläne oder Preise. Eine Suche startet nicht automatisch.')}
          </p>
        )}
        <button
          type="button"
          onClick={sucheStarten}
          disabled={sucht}
          className={cn(ORGANISIEREN_PRIMAR_KLASSE, 'mt-4')}
        >
          {sucht ? 'Wird geprüft …' : 'Verbindungen prüfen'}
        </button>
      </section>

      {onManuellAnlegen ? <ManuelleVerbindung key={reise.id} reise={reise} onAnlegen={onManuellAnlegen} /> : null}
      </div>
    </div>
  )
}

export function ManuelleVerbindung({
  reise,
  onAnlegen,
  vorgabe,
}: {
  reise: Trip
  onAnlegen: (eingabe: MobilityManuellEingabe) => Promise<string | null>
  vorgabe?: Partial<MobilityManuellEingabe>
}) {
  const VERBINDUNG_UNBEKANNT = 'Ob die Verbindung gespeichert wurde, konnten wir nicht bestätigen. Deine Eingabe bleibt erhalten. Prüfe deinen Reiseplan vor einem erneuten Versuch. Ein erneuter Versuch kann eine zweite Verbindung anlegen.'
  const VERBINDUNG_FELD = `${ORGANISIEREN_EINGABE_KLASSE} mt-1 min-w-0 max-w-full`
  const VERBINDUNG_NOTIZ = `${ORGANISIEREN_TEXTAREA_KLASSE} mt-1 min-w-0 max-w-full`
  const VERBINDUNG_SPALTEN = `${ARBEITSFELD_SPALTEN_KLASSE} min-w-0 max-w-full`
  const VERBINDUNG_LABEL = 'block min-w-0 max-w-full break-words text-sm font-medium text-brand-800'
  const anfang = verbindungsVorgabeAus(reise, vorgabe)
  const anfangSchluessel = vorgabeSchluessel(anfang)
  const lebendig = React.useRef(true)
  const meldungRef = React.useRef<HTMLParagraphElement>(null)
  const schreibt = React.useRef(false)
  const generationFest = React.useRef(0)
  const reiseFest = React.useRef(reise.id)
  const [generation, setGeneration] = React.useState(0)
  const [gesehenReise, setGesehenReise] = React.useState(reise.id)
  const [gesehenSchluessel, setGesehenSchluessel] = React.useState(anfangSchluessel)
  const [angewendet, setAngewendet] = React.useState(anfang)
  const [mode, setMode] = React.useState<MobilityMode>(anfang.mode)
  const [originName, setOriginName] = React.useState(anfang.originName)
  const [destinationName, setDestinationName] = React.useState(anfang.destinationName)
  const [startsOn, setStartsOn] = React.useState(anfang.startsOn)
  const [startsAt, setStartsAt] = React.useState('')
  const [endsOn, setEndsOn] = React.useState('')
  const [endsAt, setEndsAt] = React.useState('')
  const [connectionRef, setConnectionRef] = React.useState('')
  const [note, setNote] = React.useState('')
  const [dayId, setDayId] = React.useState(anfang.dayId)
  const [laeuft, setLaeuft] = React.useState(false)
  const [meldung, setMeldung] = React.useState('')
  const [hinweis, setHinweis] = React.useState('')
  const [fokus, setFokus] = React.useState(0)
  const naechste = verbindungsVorgabeAus(reise, vorgabe)
  const naechsterSchluessel = vorgabeSchluessel(naechste)
  if (gesehenReise !== reise.id) {
    setGesehenReise(reise.id)
    setGesehenSchluessel(naechsterSchluessel)
    setGeneration((bisher) => bisher + 1)
    setAngewendet(naechste)
    setMode(naechste.mode)
    setOriginName(naechste.originName)
    setDestinationName(naechste.destinationName)
    setStartsOn(naechste.startsOn)
    setStartsAt('')
    setEndsOn('')
    setEndsAt('')
    setConnectionRef('')
    setNote('')
    setDayId(naechste.dayId)
    setLaeuft(false)
    setMeldung('')
    setHinweis('')
  } else if (gesehenSchluessel !== naechsterSchluessel) {
    setGesehenSchluessel(naechsterSchluessel)
    setGeneration((bisher) => bisher + 1)
    setLaeuft(false)
    if (feldFolgtVorgabe(mode, angewendet.mode)) setMode(naechste.mode)
    if (feldFolgtVorgabe(originName, angewendet.originName)) setOriginName(naechste.originName)
    if (feldFolgtVorgabe(destinationName, angewendet.destinationName)) setDestinationName(naechste.destinationName)
    if (feldFolgtVorgabe(startsOn, angewendet.startsOn)) setStartsOn(naechste.startsOn)
    if (feldFolgtVorgabe(dayId, angewendet.dayId)) setDayId(naechste.dayId)
    setAngewendet(naechste)
    setMeldung('')
    setHinweis('')
  }

  React.useLayoutEffect(() => {
    const gewechselt = generationFest.current !== generation || reiseFest.current !== reise.id
    generationFest.current = generation
    reiseFest.current = reise.id
    if (gewechselt) schreibt.current = false
  }, [generation, reise.id])

  React.useEffect(() => {
    lebendig.current = true
    return () => { lebendig.current = false }
  }, [])

  React.useEffect(() => {
    if (fokus === 0) return
    meldungRef.current?.focus()
  }, [fokus])

  const speichern = async (ereignis: React.FormEvent) => {
    ereignis.preventDefault()
    if (schreibt.current) return
    const zielReise = reiseFest.current
    const generationJetzt = generationFest.current
    const eingabe: MobilityManuellEingabe = {
      mode,
      title: null,
      originName,
      destinationName,
      originPlaceId: originName === vorgabe?.originName ? vorgabe?.originPlaceId ?? null : null,
      destinationPlaceId: destinationName === vorgabe?.destinationName ? vorgabe?.destinationPlaceId ?? null : null,
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
      stageId: reise.days.find((tag) => tag.id === dayId)?.stageId ?? null,
    }
    const passt = () => lebendig.current && generationFest.current === generationJetzt && reiseFest.current === zielReise
    schreibt.current = true
    setMeldung('')
    setHinweis('')
    setLaeuft(true)
    try {
      const fehler = await onAnlegen(eingabe)
      if (!passt()) return
      if (fehler) {
        setMeldung(fehler)
        setFokus((bisher) => bisher + 1)
        return
      }
      setHinweis('Die Verbindung ist als Nutzerangabe gespeichert – nicht als Providerbestätigung.')
      setConnectionRef('')
      setNote('')
    } catch {
      if (!passt()) return
      setMeldung(VERBINDUNG_UNBEKANNT)
      setFokus((bisher) => bisher + 1)
    } finally {
      if (passt()) {
        schreibt.current = false
        setLaeuft(false)
      }
    }
  }

  return (
    <section
      aria-label="Manuelle Verbindung"
      data-organisieren-flaeche="manuell"
      className={ORGANISIEREN_FLAECHE_KLASSE}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Manuell</p>
      <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
        Bekannte Verbindung eintragen
      </h2>
      <p className="mt-1 text-sm leading-6 text-ink-800">
        Das sind deine Angaben, keine geprüften Fahrpläne oder Preise.
      </p>

      <form className="mt-5 grid min-w-0 max-w-full gap-3" aria-busy={laeuft} onSubmit={(ereignis) => void speichern(ereignis)}>
        <OrganisierenFeldgruppe titel="Einordnung">
          <div className={VERBINDUNG_SPALTEN}>
            <label className={VERBINDUNG_LABEL}>
              Art
              <select
                value={mode}
                disabled={laeuft}
                onChange={(ereignis) => setMode(ereignis.target.value as MobilityMode)}
                className={VERBINDUNG_FELD}
              >
                {MODI.map((wert) => (
                  <option key={wert} value={wert}>
                    {MOBILITY_MODE_BEZEICHNUNG[wert]}
                  </option>
                ))}
              </select>
            </label>
            <label className={VERBINDUNG_LABEL}>
              Tag
              <select
                value={dayId}
                disabled={laeuft}
                onChange={(ereignis) => setDayId(ereignis.target.value)}
                className={VERBINDUNG_FELD}
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
        </OrganisierenFeldgruppe>

        <OrganisierenFeldgruppe titel="Route">
          <div className={VERBINDUNG_SPALTEN}>
            <label className={VERBINDUNG_LABEL}>
              Von
              <input
                value={originName}
                disabled={laeuft}
                onChange={(ereignis) => setOriginName(ereignis.target.value)}
                required
                maxLength={120}
                className={VERBINDUNG_FELD}
              />
            </label>
            <label className={VERBINDUNG_LABEL}>
              Nach
              <input
                value={destinationName}
                disabled={laeuft}
                onChange={(ereignis) => setDestinationName(ereignis.target.value)}
                required
                maxLength={120}
                className={VERBINDUNG_FELD}
              />
            </label>
          </div>
        </OrganisierenFeldgruppe>

        <OrganisierenFeldgruppe titel="Abfahrt">
          <div className={VERBINDUNG_SPALTEN}>
            <label className={VERBINDUNG_LABEL}>
              Abfahrt
              <input
                type="date"
                value={startsOn}
                disabled={laeuft}
                onChange={(ereignis) => setStartsOn(ereignis.target.value)}
                className={VERBINDUNG_FELD}
              />
            </label>
            <label className={VERBINDUNG_LABEL}>
              Uhrzeit
              <input
                type="time"
                value={startsAt}
                disabled={laeuft}
                onChange={(ereignis) => setStartsAt(ereignis.target.value)}
                className={VERBINDUNG_FELD}
              />
            </label>
          </div>
        </OrganisierenFeldgruppe>

        <OrganisierenFeldgruppe titel="Ankunft">
          <div className={VERBINDUNG_SPALTEN}>
            <label className={VERBINDUNG_LABEL}>
              Ankunft
              <input
                type="date"
                value={endsOn}
                disabled={laeuft}
                onChange={(ereignis) => setEndsOn(ereignis.target.value)}
                className={VERBINDUNG_FELD}
              />
            </label>
            <label className={VERBINDUNG_LABEL}>
              Uhrzeit
              <input
                type="time"
                value={endsAt}
                disabled={laeuft}
                onChange={(ereignis) => setEndsAt(ereignis.target.value)}
                className={VERBINDUNG_FELD}
              />
            </label>
          </div>
        </OrganisierenFeldgruppe>

        <OrganisierenFeldgruppe titel="Angaben">
          <div className="grid min-w-0 max-w-full gap-3">
            <label className={VERBINDUNG_LABEL}>
              Verbindungsnummer, falls bekannt
              <input
                value={connectionRef}
                disabled={laeuft}
                onChange={(ereignis) => setConnectionRef(ereignis.target.value)}
                maxLength={40}
                className={VERBINDUNG_FELD}
              />
            </label>
            <label className={VERBINDUNG_LABEL}>
              Notiz
              <textarea
                value={note}
                disabled={laeuft}
                onChange={(ereignis) => setNote(ereignis.target.value)}
                maxLength={500}
                rows={2}
                className={VERBINDUNG_NOTIZ}
              />
            </label>
          </div>
        </OrganisierenFeldgruppe>

        <button type="submit" disabled={laeuft} className={`${ORGANISIEREN_PRIMAR_KLASSE} min-w-0 max-w-full`}>
          {laeuft ? 'Wird gespeichert …' : 'Verbindung speichern'}
        </button>
      </form>

      {meldung ? (
        <p ref={meldungRef} role="alert" tabIndex={-1} className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 focus:outline-none focus:ring-4 focus:ring-brand-600/15">
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
