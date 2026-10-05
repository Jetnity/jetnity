// lib/activities/zustand.ts
//
// Ob Jetnity eine externe Aktivitätensuche auslösen darf.
//
// Fail closed, analog zu Flug- und Hotelweg:
//
//   · Production ist hart aus.
//   · `JETNITY_ACTIVITY_AKTIV` muss ausdrücklich `true` oder `1` sein.
//   · Ohne gewählten Activity-Provider bleibt die Suche unavailable.
//
// Eine fehlende Variable ist kein Buildfehler.
// Frei von Next und Provider-SDKs.

import { providerOpsZustand } from '@/lib/provider-ops'

export type ActivityZustand =
  | { aktiv: true; umgebung: 'test' }
  | { aktiv: false; grund: 'production' | 'abgeschaltet' | 'ohne-zugang' }

export type ActivityUmgebung = {
  VERCEL_ENV?: string
  JETNITY_ACTIVITY_AKTIV?: string
}

export function activityUmgebungAusProzess(): ActivityUmgebung {
  const { VERCEL_ENV, JETNITY_ACTIVITY_AKTIV } = process.env
  return { VERCEL_ENV, JETNITY_ACTIVITY_AKTIV }
}

export function activityZustand(
  umgebung: ActivityUmgebung = activityUmgebungAusProzess(),
  providerVorhanden = false,
): ActivityZustand {
  return providerOpsZustand({
    vercelEnv: umgebung.VERCEL_ENV,
    flag: umgebung.JETNITY_ACTIVITY_AKTIV,
    zugangVorhanden: providerVorhanden,
  })
}

export function activityZustandMeldung(zustand: ActivityZustand): string {
  if (zustand.aktiv) return 'Die Aktivitätensuche ist in dieser Umgebung eingeschaltet.'
  if (zustand.grund === 'production') {
    return 'Die Aktivitätensuche ist in Production noch nicht freigegeben.'
  }
  if (zustand.grund === 'ohne-zugang') {
    return 'Passende Aktivitäten werden vorbereitet. Sobald ein Datenpartner angebunden ist, erscheinen hier Vorschläge für diesen Reisetag – ohne erfundene Angebote.'
  }
  return 'Die Aktivitätensuche ist in dieser Umgebung nicht eingeschaltet.'
}
