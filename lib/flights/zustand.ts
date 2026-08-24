// lib/flights/zustand.ts
//
// Ob Jetnity eine externe Flugsuche auslösen darf.
//
// Fail closed, analog zum Modellweg:
//
//   · Production ist hart aus. Auch gesetzte Credentials ändern das nicht.
//   · `JETNITY_FLIGHT_AKTIV` muss ausdrücklich `true` oder `1` sein.
//   · Key und Secret müssen serverseitig liegen.
//
// Eine fehlende Variable ist kein Buildfehler, sondern der Normalzustand
// einer Umgebung, in der die Funktion nicht laufen soll.
//
// Frei von Next und Provider-SDKs.

import { providerOpsZustand } from '@/lib/provider-ops'

export type FlugZustand =
  | { aktiv: true; umgebung: 'test' }
  | { aktiv: false; grund: 'production' | 'abgeschaltet' | 'ohne-zugang' }

export type FlugUmgebung = {
  VERCEL_ENV?: string
  JETNITY_FLIGHT_AKTIV?: string
  DUFFEL_ACCESS_TOKEN?: string
}

/** Nur Duffel-Test. Live-Tokens dürfen Phase 3.1 nicht auslösen. */
export function istDuffelTestToken(wert: string | undefined): boolean {
  const token = wert?.trim() ?? ''
  return token.startsWith('duffel_test_') && token.length >= 20 && token.length <= 200
}

export function flugUmgebungAusProzess(): FlugUmgebung {
  const { VERCEL_ENV, JETNITY_FLIGHT_AKTIV, DUFFEL_ACCESS_TOKEN } = process.env
  return { VERCEL_ENV, JETNITY_FLIGHT_AKTIV, DUFFEL_ACCESS_TOKEN }
}

export function flugZustand(umgebung: FlugUmgebung = flugUmgebungAusProzess()): FlugZustand {
  return providerOpsZustand({
    vercelEnv: umgebung.VERCEL_ENV,
    flag: umgebung.JETNITY_FLIGHT_AKTIV,
    zugangVorhanden: istDuffelTestToken(umgebung.DUFFEL_ACCESS_TOKEN),
  })
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
