// lib/rental-cars/konto-uebernahme.ts
//
// Kommerzielle Konto-Übernahme aus einem späteren Providerergebnis.
// Solange kein serverseitiger Nachweis existiert, fail closed.
// Der Browser sendet nur Kennungen, niemals Preise oder Booking-URLs.

import { rentalCarNachweisAusUmgebung, rentalCarNachweisLesen } from '@/lib/rental-cars/nachweis'

export type RentalCarKontoUebernahmeEingabe = {
  tripId: string
  optionId: string
  nachweisKennung?: string
}

export async function rentalCarInKontoUebernehmen(
  eingabe: RentalCarKontoUebernahmeEingabe,
): Promise<{ ok: false; meldung: string }> {
  if (!rentalCarNachweisAusUmgebung()) {
    return {
      ok: false,
      meldung: 'Eine Providerbestätigung für Mietwagen gibt es in dieser Foundation noch nicht.',
    }
  }
  const nachweis = rentalCarNachweisLesen(eingabe.nachweisKennung ?? '')
  if (!nachweis.ok) return { ok: false, meldung: nachweis.meldung }
  return {
    ok: false,
    meldung: 'Eine Providerbestätigung für Mietwagen gibt es in dieser Foundation noch nicht.',
  }
}
