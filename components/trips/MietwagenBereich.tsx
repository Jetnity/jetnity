'use client'

// components/trips/MietwagenBereich.tsx
//
// Mietwagen innerhalb von Mobilität. Bestand zuerst, darunter ehrliche
// Unavailable-Suche und manuelle Erfassung als Nutzerangabe.
// Kein eigener Top-Level-Tab. Keine Fake-Angebote.

import * as React from 'react'
import { Car, Loader2 } from 'lucide-react'

import BuchungsSiegel from '@/components/trips/BuchungsSiegel'
import { mietwagenBestand, mietwagenDetails } from '@/lib/rental-cars/bestand'
import { rentalCarSucheFehlerAntwort, rentalCarSucheVomClient } from '@/lib/rental-cars/client-anfrage'
import type { RentalCarSucheAntwort } from '@/lib/rental-cars/client-sicht'
import {
  TRANSMISSION_BEZEICHNUNG,
  VEHICLE_CLASS_BEZEICHNUNG,
} from '@/lib/rental-cars/domain'
import type { RentalCarManuellEingabe } from '@/lib/rental-cars/schema'
import { rentalOneWay } from '@/lib/rental-cars/zeitraum'
import { kannBuchungMarkieren } from '@/lib/trips/buchung'
import { datumKurz } from '@/lib/trips/datum-anzeige'
import {
  TRANSMISSIONS,
  VEHICLE_CLASSES,
  type Transmission,
  type Trip,
  type TripItem,
  type VehicleClass,
} from '@/types/trips'

export default function MietwagenBereich({
  reise,
  ohneTag = [],
  onBuchungsstatus,
  onManuellAnlegen,
}: {
  reise: Trip
  ohneTag?: readonly TripItem[]
  onBuchungsstatus?: (itemId: string, gebucht: boolean) => Promise<string | null>
  onManuellAnlegen?: (eingabe: RentalCarManuellEingabe) => Promise<string | null>
}) {
  const [meldung, setMeldung] = React.useState('')
  const [laeuft, setLaeuft] = React.useState<string | null>(null)
  const [suche, setSuche] = React.useState<RentalCarSucheAntwort | null>(null)
  const [sucht, setSucht] = React.useState(false)
  const bestand = mietwagenBestand(reise, ohneTag)

  const setzen = async (itemId: string, gebucht: boolean) => {
    if (!onBuchungsstatus || laeuft) return
    setMeldung('')
    setLaeuft(itemId)
    const fehler = await onBuchungsstatus(itemId, gebucht)
    setLaeuft(null)
    if (fehler) setMeldung(fehler)
  }

  React.useEffect(() => {
    const abholung = reise.origin || reise.stages[0]?.name
    const rueckgabe = reise.stages[reise.stages.length - 1]?.name || reise.origin
    if (!abholung || !rueckgabe) return
    const steuer = new AbortController()
    setSucht(true)
    void rentalCarSucheVomClient(
      {
        pickupName: abholung,
        dropoffName: rueckgabe,
        pickupPlaceId: reise.originPlaceId,
        dropoffPlaceId: reise.stages[reise.stages.length - 1]?.placeId ?? reise.originPlaceId,
        pickupOn: reise.startDate,
        pickupAt: null,
        dropoffOn: reise.endDate,
        dropoffAt: null,
        vehicleClass: null,
        transmission: null,
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
          rentalCarSucheFehlerAntwort(
            fehler instanceof Error ? fehler.message : 'Die Mietwagensuche ist gerade nicht verfügbar.',
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
        aria-label="Dein Mietwagen"
        className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,46,42,0.06)] sm:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
              Mietwagen
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
              Bestand und Status
            </h2>
            <p className="mt-1 text-sm leading-6 text-ink-800">{bestand.zusammenfassung}</p>
          </div>
          <Car className="h-5 w-5 text-brand-600" aria-hidden="true" />
        </div>

        {bestand.items.length === 0 ? (
          <p className="mt-5 rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800">
            Kein Mietwagen eingetragen. Nicht jede Reise braucht ein Auto.
          </p>
        ) : (
          <ul className="mt-5 grid gap-2">
            {bestand.items.map((punkt) => (
              <li
                key={punkt.id}
                className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-800 break-words">{punkt.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-ink-800 break-words">
                    {mietwagenDetails(punkt)}
                    {rentalOneWay(punkt) === 'one_way' ? ' · One-way' : ''}
                    {punkt.vehicleClass ? ` · ${VEHICLE_CLASS_BEZEICHNUNG[punkt.vehicleClass]}` : ''}
                    {punkt.transmission ? ` · ${TRANSMISSION_BEZEICHNUNG[punkt.transmission]}` : ''}
                  </p>
                </div>
                <div className="flex min-h-11 flex-wrap items-center gap-2">
                  <BuchungsSiegel status={punkt.bookingStatus === 'booked' ? 'booked' : 'selected'} />
                  {kannBuchungMarkieren(punkt) && onBuchungsstatus ? (
                    <button
                      type="button"
                      disabled={laeuft === punkt.id}
                      onClick={() => void setzen(punkt.id, punkt.bookingStatus !== 'booked')}
                      className="inline-flex min-h-11 items-center rounded-full border border-line-300 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:border-line-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:opacity-50"
                    >
                      {punkt.bookingStatus === 'booked' ? 'Buchung korrigieren' : 'Als gebucht markieren'}
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
        aria-label="Mietwagensuche"
        className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,46,42,0.06)] sm:p-7"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Suche</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
          Mietwagenangebote
        </h2>
        {sucht ? (
          <p className="mt-5 flex min-h-[4.5rem] items-center gap-2 text-sm leading-6 text-ink-800">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Mietwagen werden geprüft …
          </p>
        ) : (
          <p className="mt-5 min-h-[4.5rem] rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800">
            {suche?.message ??
              'Mietwagenangebote werden vorbereitet. Sobald ein Datenpartner angebunden ist, erscheinen hier echte Fahrzeuge – ohne erfundene Preise, Klassen oder Verfügbarkeiten.'}
          </p>
        )}
      </section>

      {onManuellAnlegen ? <ManuellerMietwagen reise={reise} onAnlegen={onManuellAnlegen} /> : null}
    </div>
  )
}

function ManuellerMietwagen({
  reise,
  onAnlegen,
}: {
  reise: Trip
  onAnlegen: (eingabe: RentalCarManuellEingabe) => Promise<string | null>
}) {
  const [pickupName, setPickupName] = React.useState(reise.origin ?? '')
  const [dropoffName, setDropoffName] = React.useState(reise.stages[0]?.name ?? reise.origin ?? '')
  const [pickupOn, setPickupOn] = React.useState(reise.startDate ?? '')
  const [pickupAt, setPickupAt] = React.useState('')
  const [dropoffOn, setDropoffOn] = React.useState(reise.endDate ?? '')
  const [dropoffAt, setDropoffAt] = React.useState('')
  const [rentalSupplier, setRentalSupplier] = React.useState('')
  const [vehicleClass, setVehicleClass] = React.useState<VehicleClass | ''>('')
  const [transmission, setTransmission] = React.useState<Transmission | ''>('')
  const [note, setNote] = React.useState('')
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
      title: null,
      pickupName,
      dropoffName,
      pickupPlaceId: null,
      dropoffPlaceId: null,
      pickupOn: pickupOn || null,
      pickupAt: pickupAt || null,
      dropoffOn: dropoffOn || null,
      dropoffAt: dropoffAt || null,
      rentalSupplier: rentalSupplier || null,
      vehicleClass: vehicleClass || null,
      transmission: transmission || null,
      priceAmount: null,
      priceCurrency: null,
      note: note || null,
      dayId: null,
      stageId: reise.stages[0]?.id ?? null,
    })
    setLaeuft(false)
    if (fehler) {
      setMeldung(fehler)
      return
    }
    setHinweis('Der Mietwagen ist als Nutzerangabe gespeichert – nicht als Providerbestätigung.')
    setRentalSupplier('')
    setNote('')
  }

  return (
    <section
      aria-label="Manueller Mietwagen"
      className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,46,42,0.06)] sm:p-7"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Manuell</p>
      <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
        Bekannten Mietwagen eintragen
      </h2>
      <p className="mt-1 text-sm leading-6 text-ink-800">
        Das sind deine Angaben, keine geprüften Preise, Verfügbarkeiten oder Mietbedingungen.
      </p>

      <form className="mt-5 grid gap-3" onSubmit={(ereignis) => void speichern(ereignis)}>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            Abholung
            <input
              value={pickupName}
              onChange={(ereignis) => setPickupName(ereignis.target.value)}
              required
              maxLength={120}
              className="min-h-11 rounded-2xl border border-line-200 bg-white px-3 text-base text-ink-900 sm:text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            Rückgabe
            <input
              value={dropoffName}
              onChange={(ereignis) => setDropoffName(ereignis.target.value)}
              required
              maxLength={120}
              className="min-h-11 rounded-2xl border border-line-200 bg-white px-3 text-base text-ink-900 sm:text-sm"
            />
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            Abholdatum
            <input
              type="date"
              value={pickupOn}
              onChange={(ereignis) => setPickupOn(ereignis.target.value)}
              className="min-h-11 rounded-2xl border border-line-200 bg-white px-3 text-base text-ink-900 sm:text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            Uhrzeit
            <input
              type="time"
              value={pickupAt}
              onChange={(ereignis) => setPickupAt(ereignis.target.value)}
              className="min-h-11 rounded-2xl border border-line-200 bg-white px-3 text-base text-ink-900 sm:text-sm"
            />
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            Rückgabedatum
            <input
              type="date"
              value={dropoffOn}
              onChange={(ereignis) => setDropoffOn(ereignis.target.value)}
              className="min-h-11 rounded-2xl border border-line-200 bg-white px-3 text-base text-ink-900 sm:text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            Uhrzeit
            <input
              type="time"
              value={dropoffAt}
              onChange={(ereignis) => setDropoffAt(ereignis.target.value)}
              className="min-h-11 rounded-2xl border border-line-200 bg-white px-3 text-base text-ink-900 sm:text-sm"
            />
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            Fahrzeugklasse, falls bekannt
            <select
              value={vehicleClass}
              onChange={(ereignis) => setVehicleClass(ereignis.target.value as VehicleClass | '')}
              className="min-h-11 rounded-2xl border border-line-200 bg-white px-3 text-sm text-ink-900"
            >
              <option value="">Unbekannt</option>
              {VEHICLE_CLASSES.map((wert) => (
                <option key={wert} value={wert}>
                  {VEHICLE_CLASS_BEZEICHNUNG[wert]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            Getriebe, falls bekannt
            <select
              value={transmission}
              onChange={(ereignis) => setTransmission(ereignis.target.value as Transmission | '')}
              className="min-h-11 rounded-2xl border border-line-200 bg-white px-3 text-sm text-ink-900"
            >
              <option value="">Unbekannt</option>
              {TRANSMISSIONS.map((wert) => (
                <option key={wert} value={wert}>
                  {TRANSMISSION_BEZEICHNUNG[wert]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-1 text-sm font-medium text-brand-800">
          Vermieter, falls bekannt
          <input
            value={rentalSupplier}
            onChange={(ereignis) => setRentalSupplier(ereignis.target.value)}
            maxLength={120}
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
          {laeuft ? 'Wird gespeichert …' : 'Mietwagen speichern'}
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
