// lib/rental-cars/nachweis.ts
//
// Serverseitige Proof-Naht für spätere kommerzielle Übernahme.
// In dieser Foundation existiert kein echter Nachweis: fail closed.
// Der Browser darf keine kommerziellen Fakten selbst setzen.

export type RentalCarNachweis = {
  kennung: string
  optionId: string
  tripId: string
  pickupPlaceId: string | null
  dropoffPlaceId: string | null
  pickupOn: string | null
  dropoffOn: string | null
  currency: string
}

export type RentalCarNachweisErgebnis =
  | { ok: true; nachweis: RentalCarNachweis }
  | { ok: false; meldung: string }

/** Foundation B: Es gibt keinen serverseitigen Nachweis. */
export function rentalCarNachweisAusUmgebung(): RentalCarNachweis | null {
  return null
}

export function rentalCarNachweisLesen(_kennung: string): RentalCarNachweisErgebnis {
  return {
    ok: false,
    meldung: 'Eine Providerbestätigung für Mietwagen gibt es in dieser Foundation noch nicht.',
  }
}

export function rentalCarNachweisPruefen(
  _nachweis: RentalCarNachweis | null,
  _kontext: {
    tripId: string
    optionId: string
    pickupPlaceId?: string | null
    dropoffPlaceId?: string | null
    pickupOn?: string | null
    dropoffOn?: string | null
    currency?: string
  },
): RentalCarNachweisErgebnis {
  return {
    ok: false,
    meldung: 'Eine Providerbestätigung für Mietwagen gibt es in dieser Foundation noch nicht.',
  }
}
