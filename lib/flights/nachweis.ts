// lib/flights/nachweis.ts
//
// Serverseitige Vertrauensnaht für eine Flugauswahl.
//
// FlightProvider.suchen() bleibt schmal. Diese Schnittstelle bestätigt eine
// konkrete Option gegen den erwarteten Suchkontext, bevor ein Konto sie als
// kommerziellen flight-Punkt speichert. Search-Provider und Affiliate-/
// Booking-Partner müssen nicht identisch sein.
//
// Frei von Next, Secrets und Anbieter-SDKs.

import {
  FLUG_SUCHE_GRENZEN,
  type FlugKabine,
  type FlugOption,
  type FlugPassagiere,
  type FlugSuchBein,
} from '@/lib/flights/domain'
import { flugOptionLesen } from '@/lib/flights/schema'
import type { Trip } from '@/types/trips'

export type FlugNachweisFehlerArt =
  | 'unavailable'
  | 'unbekannt'
  | 'abgelaufen'
  | 'geaendert'
  | 'invalid'
  | 'error'

export type FlugNachweisKontext = {
  legs: FlugSuchBein[]
  passengers: FlugPassagiere
  cabin: FlugKabine
  currency: string
}

export type FlugNachweisErgebnis =
  | { ok: true; option: FlugOption }
  | { ok: false; art: FlugNachweisFehlerArt; message: string }

export type FlugNachweis = {
  nachweisen(eingabe: { optionId: string; kontext: FlugNachweisKontext }): Promise<FlugNachweisErgebnis>
}

export const FLUG_NACHWEIS_MELDUNG: Record<FlugNachweisFehlerArt, string> = {
  unavailable: 'Flüge können noch nicht verbindlich in die Reise übernommen werden.',
  unbekannt: 'Diese Flugauswahl ist unbekannt.',
  abgelaufen: 'Diese Flugauswahl ist nicht mehr gültig.',
  geaendert: 'Dieses Angebot hat sich geändert. Bitte suche erneut.',
  invalid: 'Diese Flugauswahl ist unvollständig.',
  error: 'Die Flugauswahl konnte gerade nicht bestätigt werden.',
}

export function flugNachweisFehler(
  art: FlugNachweisFehlerArt,
): Extract<FlugNachweisErgebnis, { ok: false }> {
  return { ok: false, art, message: FLUG_NACHWEIS_MELDUNG[art] }
}

function beinGleich(a: FlugSuchBein, b: FlugSuchBein): boolean {
  return a.origin === b.origin && a.destination === b.destination && a.date === b.date
}

function passagiereGleich(a: FlugPassagiere, b: FlugPassagiere): boolean {
  return a.adults === b.adults && a.children === b.children && a.infants === b.infants
}

function flugNachweisKontextGleich(a: FlugNachweisKontext, b: FlugNachweisKontext): boolean {
  return (
    a.legs.length === b.legs.length &&
    a.legs.every((bein, index) => {
      const anderes = b.legs[index]
      return anderes !== undefined && beinGleich(bein, anderes)
    }) &&
    passagiereGleich(a.passengers, b.passengers) &&
    a.cabin === b.cabin &&
    a.currency === b.currency
  )
}

function flugPassagiereAusReise(reise: Pick<Trip, 'travellers'>): FlugPassagiere {
  const adults = Math.min(
    FLUG_SUCHE_GRENZEN.erwachsene.max,
    Math.max(FLUG_SUCHE_GRENZEN.erwachsene.min, reise.travellers),
  )
  return { adults, children: 0, infants: 0 }
}

export function flugNachweisKontextAusReise(
  reise: Pick<Trip, 'travellers' | 'currency'>,
  suche: { legs: readonly FlugSuchBein[]; cabin: FlugKabine },
): FlugNachweisKontext {
  return {
    legs: suche.legs.map((bein) => ({
      origin: bein.origin.trim().toUpperCase(),
      destination: bein.destination.trim().toUpperCase(),
      date: bein.date,
    })),
    passengers: flugPassagiereAusReise(reise),
    cabin: suche.cabin,
    currency: reise.currency.trim().toUpperCase(),
  }
}

/**
 * S2: Es gibt keinen serverseitigen Nachweis und keinen Suchkontext-Speicher.
 * Die Konto-Übernahme bleibt fail closed, bis ein Adapter oder ein
 * Jetnity-eigener Nachweis diese Naht implementiert.
 */
export function flugNachweisAusUmgebung(): FlugNachweis | null {
  return null
}

export type FlugNachweisKatalog = {
  optionen?: Record<string, unknown>
  kontexte?: Record<string, FlugNachweisKontext>
  abgelaufen?: readonly string[]
  geaendert?: readonly string[]
  fehler?: Partial<Record<string, FlugNachweisFehlerArt>>
}

/** Fake-Nachweis für Tests. Kein Produktionsweg. */
export function flugNachweisAusKatalog(katalog: FlugNachweisKatalog): FlugNachweis {
  const abgelaufen = new Set(katalog.abgelaufen ?? [])
  const geaendert = new Set(katalog.geaendert ?? [])
  const fehler = katalog.fehler ?? {}

  return {
    async nachweisen({ optionId, kontext }) {
      const id = optionId.trim()
      if (!id) return flugNachweisFehler('invalid')

      const art = fehler[id]
      if (art) return flugNachweisFehler(art)
      if (abgelaufen.has(id)) return flugNachweisFehler('abgelaufen')
      if (geaendert.has(id)) return flugNachweisFehler('geaendert')

      const roh = katalog.optionen?.[id]
      if (roh === undefined) return flugNachweisFehler('unbekannt')
      const erwartet = katalog.kontexte?.[id]
      if (!erwartet || !flugNachweisKontextGleich(erwartet, kontext)) {
        return flugNachweisFehler('geaendert')
      }
      const option = flugOptionLesen(roh)
      if (!option) return flugNachweisFehler('invalid')
      return { ok: true, option }
    },
  }
}
