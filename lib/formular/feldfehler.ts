// lib/formular/feldfehler.ts
//
// Feldfehler der Planungsformulare. Rein, ohne React.
// Mehrere Felder gleichzeitig, nie nur der erste Treffer.
// Eine allgemeine Zusammenfassung ist Ergänzung, nicht Ersatz.

import { auswahlFehlt } from '@/lib/places/auswahl'
import { ORT_MELDUNG } from '@/lib/places/pruefen'
import { GRENZEN } from '@/lib/trips/schema'

export const FORMULAR_ZUSAMMENFASSUNG = 'Bitte prüfe die markierten Angaben.'

export const REISE_FORMULAR_FELDER = [
  'destination',
  'origin',
  'startDate',
  'endDate',
  'travellers',
  'budget',
] as const

export type ReiseFormularFeld = (typeof REISE_FORMULAR_FELDER)[number]

export type Feldfehler<T extends string = ReiseFormularFeld> = Partial<Record<T, string>>

export const REISE_FELD_MELDUNG = {
  destination: ORT_MELDUNG.zielFehlt,
  origin: ORT_MELDUNG.abreiseFehlt,
  startDate: 'Bitte wähle ein Abreisedatum.',
  endDate: 'Bitte wähle ein Rückreisedatum.',
  endDateReihenfolge: 'Die Rückreise darf nicht vor der Abreise liegen.',
  travellers: 'Bitte gib an, wie viele Personen reisen.',
  budget: 'Bitte gib ein gültiges Budget ein.',
} as const

export type ReiseFormularEingabe = {
  destination: string
  destinationPlaceId?: string | null
  origin: string
  originPlaceId?: string | null
  startDate: string
  endDate: string
  travellers: number | ''
  budget: string
}

const DATUM = /^\d{4}-\d{2}-\d{2}$/

function istKalenderdatum(wert: string): boolean {
  if (!DATUM.test(wert)) return false
  const [jahr, monat, tag] = wert.split('-').map(Number)
  const geprueft = new Date(Date.UTC(jahr, monat - 1, tag))
  return (
    geprueft.getUTCFullYear() === jahr &&
    geprueft.getUTCMonth() === monat - 1 &&
    geprueft.getUTCDate() === tag
  )
}

function reisendeLesen(wert: number | ''): number | null {
  if (wert === '') return null
  if (!Number.isInteger(wert) || wert < 1 || wert > GRENZEN.reisende) return null
  return wert
}

function budgetLesen(wert: string): { ok: true; betrag: number | null } | { ok: false } {
  const roh = wert.trim()
  if (roh === '') return { ok: true, betrag: null }
  const zahl = Number(roh)
  if (!Number.isFinite(zahl) || zahl < 0 || zahl > 9_999_999_999.99) return { ok: false }
  return { ok: true, betrag: zahl }
}

export function feldFehlerId(feldId: string): string {
  return `${feldId}-fehler`
}

export function ariaBeschrieben(...teile: Array<string | undefined | null>): string | undefined {
  const liste = teile.filter((teil): teil is string => Boolean(teil && teil.trim()))
  return liste.length > 0 ? liste.join(' ') : undefined
}

export function erstesFehlerfeld<T extends string>(
  fehler: Feldfehler<T>,
  reihenfolge: readonly T[],
): T | null {
  return reihenfolge.find((feld) => Boolean(fehler[feld])) ?? null
}

export function feldfehlerLoeschen<F extends Feldfehler<string>>(
  bisher: F,
  feld: keyof F & string,
): F {
  if (!(feld in bisher)) return bisher
  const naechste = { ...bisher }
  delete naechste[feld]
  return naechste
}

export type ZusaetzlichesZielEingabe = {
  key: string
  text: string
  placeId?: string | null
}

export function zusaetzlichesZielFeld(key: string): string {
  return `zusaetzlichesZiel-${key}`
}

export function zusaetzlicheZielePruefen(ziele: readonly ZusaetzlichesZielEingabe[]): Feldfehler<string> {
  const fehler: Feldfehler<string> = {}
  for (const ziel of ziele) {
    const meldung = auswahlFehlt(
      ziel.text,
      ziel.placeId ? { id: ziel.placeId, name: ziel.text } : null,
      'ziel',
    )
    if (meldung) fehler[zusaetzlichesZielFeld(ziel.key)] = meldung
  }
  return fehler
}

export function reiseFormularPruefen(eingabe: ReiseFormularEingabe): {
  fehler: Feldfehler
  erstes: ReiseFormularFeld | null
} {
  const fehler: Feldfehler = {}

  const ziel = auswahlFehlt(
    eingabe.destination,
    eingabe.destinationPlaceId
      ? { id: eingabe.destinationPlaceId, name: eingabe.destination }
      : null,
    'ziel',
  )
  if (ziel) fehler.destination = ziel

  const abreise = auswahlFehlt(
    eingabe.origin,
    eingabe.originPlaceId ? { id: eingabe.originPlaceId, name: eingabe.origin } : null,
    'abreise',
  )
  if (abreise) fehler.origin = abreise

  if (!eingabe.startDate.trim()) {
    fehler.startDate = REISE_FELD_MELDUNG.startDate
  } else if (!istKalenderdatum(eingabe.startDate)) {
    fehler.startDate = REISE_FELD_MELDUNG.startDate
  }

  if (!eingabe.endDate.trim()) {
    fehler.endDate = REISE_FELD_MELDUNG.endDate
  } else if (!istKalenderdatum(eingabe.endDate)) {
    fehler.endDate = REISE_FELD_MELDUNG.endDate
  } else if (
    !fehler.startDate &&
    eingabe.endDate < eingabe.startDate
  ) {
    fehler.endDate = REISE_FELD_MELDUNG.endDateReihenfolge
  }

  if (reisendeLesen(eingabe.travellers) === null) {
    fehler.travellers = REISE_FELD_MELDUNG.travellers
  }

  if (!budgetLesen(eingabe.budget).ok) {
    fehler.budget = REISE_FELD_MELDUNG.budget
  }

  return {
    fehler,
    erstes: erstesFehlerfeld(fehler, REISE_FORMULAR_FELDER),
  }
}
