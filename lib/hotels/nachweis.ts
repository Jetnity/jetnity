// lib/hotels/nachweis.ts
//
// Serverseitige Vertrauensnaht für eine Hotelauswahl.
//
// HotelProvider.suchen() bleibt schmal. Diese Schnittstelle bestätigt eine
// konkrete Option gegen den erwarteten Suchkontext, bevor ein Konto sie als
// kommerziellen stay speichert. Search-Provider und Affiliate-/Booking-Partner
// müssen nicht identisch sein.
//
// Frei von Next, Secrets und Anbieter-SDKs.

import {
  HOTEL_SUCHE_GRENZEN,
  HOTEL_SUCHE_STANDARD_BELEGUNG,
  hotelZielKennungAus,
  type HotelOption,
} from '@/lib/hotels/domain'
import { hotelOptionLesen } from '@/lib/hotels/schema'
import type { Trip, TripStage } from '@/types/trips'

export type HotelNachweisFehlerArt =
  | 'unavailable'
  | 'unbekannt'
  | 'abgelaufen'
  | 'geaendert'
  | 'invalid'
  | 'error'

export type HotelNachweisKontext = {
  destinationPlaceId: string
  checkIn: string
  checkOut: string
  rooms: number
  adults: number
  children: number
  currency: string
}

export type HotelNachweisErgebnis =
  | { ok: true; option: HotelOption }
  | { ok: false; art: HotelNachweisFehlerArt; message: string }

export type HotelNachweis = {
  nachweisen(eingabe: { optionId: string; kontext: HotelNachweisKontext }): Promise<HotelNachweisErgebnis>
}

const HOTEL_NACHWEIS_MELDUNG: Record<HotelNachweisFehlerArt, string> = {
  unavailable: 'Hotels können noch nicht verbindlich in die Reise übernommen werden.',
  unbekannt: 'Diese Hotelauswahl ist unbekannt.',
  abgelaufen: 'Diese Hotelauswahl ist nicht mehr gültig.',
  geaendert: 'Dieses Angebot hat sich geändert. Bitte suche erneut.',
  invalid: 'Diese Hotelauswahl ist unvollständig.',
  error: 'Die Hotelauswahl konnte gerade nicht bestätigt werden.',
}

export function hotelNachweisFehler(
  art: HotelNachweisFehlerArt,
): Extract<HotelNachweisErgebnis, { ok: false }> {
  return { ok: false, art, message: HOTEL_NACHWEIS_MELDUNG[art] }
}

function hotelNachweisKontextGleich(a: HotelNachweisKontext, b: HotelNachweisKontext): boolean {
  return (
    a.destinationPlaceId === b.destinationPlaceId &&
    a.checkIn === b.checkIn &&
    a.checkOut === b.checkOut &&
    a.rooms === b.rooms &&
    a.adults === b.adults &&
    a.children === b.children &&
    a.currency === b.currency
  )
}

export function hotelNachweisKontextAusGraph(
  reise: Pick<Trip, 'travellers' | 'currency'>,
  graph: { etappe: Pick<TripStage, 'id' | 'placeId'>; checkIn: string; checkOut: string },
): HotelNachweisKontext {
  const adults = Math.min(
    HOTEL_SUCHE_GRENZEN.erwachsene.max,
    Math.max(HOTEL_SUCHE_GRENZEN.erwachsene.min, reise.travellers),
  )
  return {
    destinationPlaceId: hotelZielKennungAus(graph.etappe),
    checkIn: graph.checkIn,
    checkOut: graph.checkOut,
    rooms: HOTEL_SUCHE_STANDARD_BELEGUNG.rooms,
    adults,
    children: HOTEL_SUCHE_STANDARD_BELEGUNG.children,
    currency: reise.currency.trim().toUpperCase(),
  }
}

/**
 * Phase 3.2: Es gibt keinen serverseitigen Nachweis.
 * Die Konto-Übernahme bleibt fail closed, bis ein Adapter oder ein
 * Jetnity-eigener Nachweis diese Naht implementiert.
 */
export function hotelNachweisAusUmgebung(): HotelNachweis | null {
  return null
}

export type HotelNachweisKatalog = {
  optionen?: Record<string, unknown>
  kontexte?: Record<string, HotelNachweisKontext>
  abgelaufen?: readonly string[]
  geaendert?: readonly string[]
  fehler?: Partial<Record<string, HotelNachweisFehlerArt>>
}

/** Fake-Nachweis für Tests. Kein Produktionsweg. */
export function hotelNachweisAusKatalog(katalog: HotelNachweisKatalog): HotelNachweis {
  const abgelaufen = new Set(katalog.abgelaufen ?? [])
  const geaendert = new Set(katalog.geaendert ?? [])
  const fehler = katalog.fehler ?? {}

  return {
    async nachweisen({ optionId, kontext }) {
      const id = optionId.trim()
      if (!id) return hotelNachweisFehler('invalid')

      const art = fehler[id]
      if (art) return hotelNachweisFehler(art)
      if (abgelaufen.has(id)) return hotelNachweisFehler('abgelaufen')
      if (geaendert.has(id)) return hotelNachweisFehler('geaendert')

      const roh = katalog.optionen?.[id]
      if (roh === undefined) return hotelNachweisFehler('unbekannt')
      const erwartet = katalog.kontexte?.[id]
      if (!erwartet || !hotelNachweisKontextGleich(erwartet, kontext)) {
        return hotelNachweisFehler('geaendert')
      }
      const option = hotelOptionLesen(roh)
      if (!option) return hotelNachweisFehler('invalid')
      return { ok: true, option }
    },
  }
}
