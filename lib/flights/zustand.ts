// lib/flights/zustand.ts
//
// Ob Jetnity eine Flugsuche in dieser Umgebung grundsätzlich auslösen darf.
//
// Fail closed, analog zum Modellweg:
//
//   · Production ist hart aus. Auch gesetzte Credentials ändern das nicht.
//   · `JETNITY_FLIGHT_AKTIV` muss ausdrücklich `true` oder `1` sein.
//
// Anbieter-Credentials gehören nicht hierher. Duffel-Test-Tokens prüft
// nur die Duffel-Fabrik. Fehlt jeder konstruierbare Provider, bleibt die
// Suche an der Orchestrierungsnaht unavailable.
//
// Eine fehlende Variable ist kein Buildfehler, sondern der Normalzustand
// einer Umgebung, in der die Funktion nicht laufen soll.
//
// Frei von Next und Provider-SDKs.

import { providerOpsFlagAn, providerOpsIstProduction } from '@/lib/provider-ops'

export type FlugZustand =
  | { aktiv: true; umgebung: 'test' }
  | { aktiv: false; grund: 'production' | 'abgeschaltet' | 'ohne-zugang' }

export type FlugUmgebung = {
  VERCEL_ENV?: string
  JETNITY_FLIGHT_AKTIV?: string
}

export function flugUmgebungAusProzess(): FlugUmgebung {
  const { VERCEL_ENV, JETNITY_FLIGHT_AKTIV } = process.env
  return { VERCEL_ENV, JETNITY_FLIGHT_AKTIV }
}

export function flugZustand(umgebung: FlugUmgebung = flugUmgebungAusProzess()): FlugZustand {
  if (providerOpsIstProduction(umgebung.VERCEL_ENV)) {
    return { aktiv: false, grund: 'production' }
  }
  if (!providerOpsFlagAn(umgebung.JETNITY_FLIGHT_AKTIV)) {
    return { aktiv: false, grund: 'abgeschaltet' }
  }
  return { aktiv: true, umgebung: 'test' }
}

export function flugZustandMeldung(zustand: FlugZustand): string {
  if (zustand.aktiv) return 'Flugsuche ist in dieser Umgebung eingeschaltet.'
  if (zustand.grund === 'production') {
    return 'Die Flugsuche ist in Production noch nicht freigegeben.'
  }
  if (zustand.grund === 'ohne-zugang') {
    return 'Die Flugsuche ist hier noch nicht eingerichtet.'
  }
  return 'Die Flugsuche ist in dieser Umgebung nicht eingeschaltet.'
}
