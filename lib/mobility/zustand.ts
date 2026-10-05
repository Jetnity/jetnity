// lib/mobility/zustand.ts
//
// Ob Jetnity eine externe Mobilitätssuche auslösen darf.
//
// Fail closed:
//
//   · Production ist hart aus.
//   · Ohne gewählten Provider bleibt die Suche unavailable.
//   · Ein Kill-Switch existiert analog zu den anderen Foundations, ohne
//     einen noch nicht gewählten Anbieter oder dessen Secrets zu benennen.
//
// Eine fehlende Variable ist kein Buildfehler.
// Frei von Next und Provider-SDKs.

import { providerOpsZustand } from '@/lib/provider-ops'

export type MobilityZustand =
  | { aktiv: true; umgebung: 'test' }
  | { aktiv: false; grund: 'production' | 'abgeschaltet' | 'ohne-zugang' }

export type MobilityUmgebung = {
  VERCEL_ENV?: string
  JETNITY_MOBILITY_AKTIV?: string
}

export function mobilityUmgebungAusProzess(): MobilityUmgebung {
  const { VERCEL_ENV, JETNITY_MOBILITY_AKTIV } = process.env
  return { VERCEL_ENV, JETNITY_MOBILITY_AKTIV }
}

export function mobilityZustand(
  umgebung: MobilityUmgebung = mobilityUmgebungAusProzess(),
  providerVorhanden = false,
): MobilityZustand {
  return providerOpsZustand({
    vercelEnv: umgebung.VERCEL_ENV,
    flag: umgebung.JETNITY_MOBILITY_AKTIV,
    zugangVorhanden: providerVorhanden,
  })
}

export function mobilityZustandMeldung(zustand: MobilityZustand): string {
  if (zustand.aktiv) return 'Die Mobilitätssuche ist in dieser Umgebung eingeschaltet.'
  if (zustand.grund === 'production') {
    return 'Die Mobilitätssuche ist in Production noch nicht freigegeben.'
  }
  if (zustand.grund === 'ohne-zugang') {
    return 'Verbindungen per Bahn, Bus, Fähre oder Transfer werden vorbereitet. Sobald ein Datenpartner angebunden ist, erscheinen hier echte Angebote – ohne erfundene Fahrpläne oder Preise.'
  }
  return 'Die Mobilitätssuche ist in dieser Umgebung nicht eingeschaltet.'
}
