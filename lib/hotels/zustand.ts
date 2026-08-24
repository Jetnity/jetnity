// lib/hotels/zustand.ts
//
// Ob Jetnity eine externe Hotelsuche auslösen darf.
//
// Fail closed, analog zu Flug- und Modellweg:
//
//   · Production ist hart aus.
//   · `JETNITY_HOTEL_AKTIV` muss ausdrücklich `true` oder `1` sein.
//   · Ohne gewählten Hotelprovider bleibt die Suche unavailable.
//
// Eine fehlende Variable ist kein Buildfehler.
// Frei von Next und Provider-SDKs.

import { providerOpsZustand } from '@/lib/provider-ops'

export type HotelZustand =
  | { aktiv: true; umgebung: 'test' }
  | { aktiv: false; grund: 'production' | 'abgeschaltet' | 'ohne-zugang' }

export type HotelUmgebung = {
  VERCEL_ENV?: string
  JETNITY_HOTEL_AKTIV?: string
}

export function hotelUmgebungAusProzess(): HotelUmgebung {
  const { VERCEL_ENV, JETNITY_HOTEL_AKTIV } = process.env
  return { VERCEL_ENV, JETNITY_HOTEL_AKTIV }
}

export function hotelZustand(
  umgebung: HotelUmgebung = hotelUmgebungAusProzess(),
  providerVorhanden = false,
): HotelZustand {
  return providerOpsZustand({
    vercelEnv: umgebung.VERCEL_ENV,
    flag: umgebung.JETNITY_HOTEL_AKTIV,
    zugangVorhanden: providerVorhanden,
  })
}

export function hotelZustandMeldung(zustand: HotelZustand): string {
  if (zustand.aktiv) return 'Die Hotelsuche ist in dieser Umgebung eingeschaltet.'
  if (zustand.grund === 'production') {
    return 'Die Hotelsuche ist in Production noch nicht freigegeben.'
  }
  if (zustand.grund === 'ohne-zugang') {
    return 'Hotelangebote sind hier noch nicht angebunden. Jetnity kann die Gegend aus deiner Reise schon einordnen, sobald genug Ortsdaten vorliegen.'
  }
  return 'Die Hotelsuche ist in dieser Umgebung nicht eingeschaltet.'
}
