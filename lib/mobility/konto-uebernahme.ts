// lib/mobility/konto-uebernahme.ts
//
// Kommerzielle Konto-Übernahme aus einem späteren Providerergebnis.
// Solange kein serverseitiger Nachweis existiert, fail closed.
// Der Browser sendet nur Kennungen, niemals Preise oder Booking-URLs.

import { mobilityNachweisAusUmgebung, mobilityNachweisLesen } from '@/lib/mobility/nachweis'

export type MobilityKontoUebernahmeEingabe = {
  tripId: string
  optionId: string
  nachweisKennung?: string
}

export async function mobilityInKontoUebernehmen(
  eingabe: MobilityKontoUebernahmeEingabe,
): Promise<{ ok: false; meldung: string }> {
  if (!mobilityNachweisAusUmgebung()) {
    return {
      ok: false,
      meldung: 'Eine Providerbestätigung für Mobilität gibt es in dieser Foundation noch nicht.',
    }
  }
  const nachweis = mobilityNachweisLesen(eingabe.nachweisKennung ?? '')
  if (!nachweis.ok) return { ok: false, meldung: nachweis.meldung }
  return {
    ok: false,
    meldung: 'Eine Providerbestätigung für Mobilität gibt es in dieser Foundation noch nicht.',
  }
}
