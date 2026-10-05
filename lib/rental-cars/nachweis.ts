// lib/rental-cars/nachweis.ts
//
// Serverseitige Vertrauensnaht für eine Mietwagenauswahl.
//
// RentalCarProvider.suchen() bleibt schmal. Diese Schnittstelle bestätigt eine
// konkrete Option gegen den erwarteten Suchkontext, bevor ein Konto sie als
// kommerziellen rental_car-Punkt speichern dürfte. Search-Provider und
// Affiliate-/Booking-Partner müssen nicht identisch sein.
//
// Die fachliche Form bleibt mietwagen-spezifisch: Stationen, Zeitraum,
// Klasse, Getriebe, Währung. Kein Flug-Schema, keine booking_url.
//
// Frei von Next, Secrets und Anbieter-SDKs.

import type { RentalCarOption } from '@/lib/rental-cars/domain'
import { rentalCarOptionLesen } from '@/lib/rental-cars/schema'
import type { Transmission, Trip, VehicleClass } from '@/types/trips'

export type RentalCarNachweisFehlerArt =
  | 'unavailable'
  | 'unbekannt'
  | 'abgelaufen'
  | 'geaendert'
  | 'invalid'
  | 'error'

export type RentalCarNachweisKontext = {
  pickupName: string
  dropoffName: string
  pickupPlaceId: string | null
  dropoffPlaceId: string | null
  pickupOn: string | null
  pickupAt: string | null
  dropoffOn: string | null
  dropoffAt: string | null
  vehicleClass: VehicleClass | null
  transmission: Transmission | null
  currency: string
}

export type RentalCarNachweisErgebnis =
  | { ok: true; option: RentalCarOption }
  | { ok: false; art: RentalCarNachweisFehlerArt; message: string }

export type RentalCarNachweis = {
  nachweisen(eingabe: {
    optionId: string
    kontext: RentalCarNachweisKontext
  }): Promise<RentalCarNachweisErgebnis>
}

const RENTAL_NACHWEIS_MELDUNG: Record<RentalCarNachweisFehlerArt, string> = {
  unavailable: 'Mietwagen können noch nicht verbindlich in die Reise übernommen werden.',
  unbekannt: 'Diese Mietwagenauswahl ist unbekannt.',
  abgelaufen: 'Diese Mietwagenauswahl ist nicht mehr gültig.',
  geaendert: 'Dieses Angebot hat sich geändert. Bitte suche erneut.',
  invalid: 'Diese Mietwagenauswahl ist unvollständig.',
  error: 'Die Mietwagenauswahl konnte gerade nicht bestätigt werden.',
}

export function rentalCarNachweisFehler(
  art: RentalCarNachweisFehlerArt,
): Extract<RentalCarNachweisErgebnis, { ok: false }> {
  return { ok: false, art, message: RENTAL_NACHWEIS_MELDUNG[art] }
}

function textGleich(a: string | null, b: string | null): boolean {
  return (a ?? null) === (b ?? null)
}

function rentalCarNachweisKontextGleich(
  a: RentalCarNachweisKontext,
  b: RentalCarNachweisKontext,
): boolean {
  return (
    a.pickupName === b.pickupName &&
    a.dropoffName === b.dropoffName &&
    textGleich(a.pickupPlaceId, b.pickupPlaceId) &&
    textGleich(a.dropoffPlaceId, b.dropoffPlaceId) &&
    textGleich(a.pickupOn, b.pickupOn) &&
    textGleich(a.pickupAt, b.pickupAt) &&
    textGleich(a.dropoffOn, b.dropoffOn) &&
    textGleich(a.dropoffAt, b.dropoffAt) &&
    a.vehicleClass === b.vehicleClass &&
    a.transmission === b.transmission &&
    a.currency === b.currency
  )
}

export function rentalCarNachweisKontextAusReise(
  reise: Pick<Trip, 'currency'>,
  suche: {
    pickupName: string
    dropoffName: string
    pickupPlaceId: string | null
    dropoffPlaceId: string | null
    pickupOn: string | null
    pickupAt: string | null
    dropoffOn: string | null
    dropoffAt: string | null
    vehicleClass: VehicleClass | null
    transmission: Transmission | null
  },
): RentalCarNachweisKontext {
  return {
    pickupName: suche.pickupName.trim(),
    dropoffName: suche.dropoffName.trim(),
    pickupPlaceId: suche.pickupPlaceId,
    dropoffPlaceId: suche.dropoffPlaceId,
    pickupOn: suche.pickupOn,
    pickupAt: suche.pickupAt,
    dropoffOn: suche.dropoffOn,
    dropoffAt: suche.dropoffAt,
    vehicleClass: suche.vehicleClass,
    transmission: suche.transmission,
    currency: reise.currency.trim().toUpperCase(),
  }
}

/**
 * S3: Es gibt keinen serverseitigen Nachweis und keinen Suchkontext-Speicher.
 * Die Konto-Übernahme bleibt fail closed, bis ein Adapter oder ein
 * Jetnity-eigener Nachweis diese Naht implementiert.
 */
export function rentalCarNachweisAusUmgebung(): RentalCarNachweis | null {
  return null
}

export type RentalCarNachweisKatalog = {
  optionen?: Record<string, unknown>
  kontexte?: Record<string, RentalCarNachweisKontext>
  abgelaufen?: readonly string[]
  geaendert?: readonly string[]
  fehler?: Partial<Record<string, RentalCarNachweisFehlerArt>>
}

/** Fake-Nachweis für Tests. Kein Produktionsweg. */
export function rentalCarNachweisAusKatalog(katalog: RentalCarNachweisKatalog): RentalCarNachweis {
  const abgelaufen = new Set(katalog.abgelaufen ?? [])
  const geaendert = new Set(katalog.geaendert ?? [])
  const fehler = katalog.fehler ?? {}

  return {
    async nachweisen({ optionId, kontext }) {
      const id = optionId.trim()
      if (!id) return rentalCarNachweisFehler('invalid')

      const art = fehler[id]
      if (art) return rentalCarNachweisFehler(art)
      if (abgelaufen.has(id)) return rentalCarNachweisFehler('abgelaufen')
      if (geaendert.has(id)) return rentalCarNachweisFehler('geaendert')

      const roh = katalog.optionen?.[id]
      if (roh === undefined) return rentalCarNachweisFehler('unbekannt')
      const erwartet = katalog.kontexte?.[id]
      if (!erwartet || !rentalCarNachweisKontextGleich(erwartet, kontext)) {
        return rentalCarNachweisFehler('geaendert')
      }
      const option = rentalCarOptionLesen(roh)
      if (!option) return rentalCarNachweisFehler('invalid')
      return { ok: true, option }
    },
  }
}
