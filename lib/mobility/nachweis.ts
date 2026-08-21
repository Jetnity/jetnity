// lib/mobility/nachweis.ts
//
// Serverseitige Proof-Naht für spätere kommerzielle Übernahme.
// In dieser Foundation existiert kein echter Nachweis: fail closed.
// Der Browser darf keine kommerziellen Fakten selbst setzen.

export type MobilityNachweis = {
  kennung: string
  optionId: string
  tripId: string
  originPlaceId: string | null
  destinationPlaceId: string | null
  date: string | null
  currency: string
}

export type MobilityNachweisErgebnis =
  | { ok: true; nachweis: MobilityNachweis }
  | { ok: false; meldung: string }

/** Foundation A: Es gibt keinen serverseitigen Nachweis. */
export function mobilityNachweisAusUmgebung(): MobilityNachweis | null {
  return null
}

export function mobilityNachweisLesen(_kennung: string): MobilityNachweisErgebnis {
  return {
    ok: false,
    meldung: 'Eine Providerbestätigung für Mobilität gibt es in dieser Foundation noch nicht.',
  }
}

export function mobilityNachweisPruefen(
  _nachweis: MobilityNachweis | null,
  _kontext: {
    tripId: string
    optionId: string
    originPlaceId?: string | null
    destinationPlaceId?: string | null
    date?: string | null
    currency?: string
  },
): MobilityNachweisErgebnis {
  return {
    ok: false,
    meldung: 'Eine Providerbestätigung für Mobilität gibt es in dieser Foundation noch nicht.',
  }
}
