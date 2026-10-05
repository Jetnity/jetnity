// lib/mobility/client-sicht.ts
//
// Was der Browser von einer Mobilitätssuche sehen darf.
// Keine Provider-Rohdaten, keine Provisionsfelder, keine Booking-URLs.

import {
  MOBILITY_ABDECKUNGSHINWEIS,
  MOBILITY_MARKE_TEXT,
  type MobilityEvidenz,
  type MobilityMarke,
  type MobilitySuchergebnis,
  type MobilitySuchStatus,
} from '@/lib/mobility/domain'

export type MobilityOptionSichtbar = {
  id: string
  mode: string
  title: string
  originName: string
  destinationName: string
  startsOn: string | null
  startsAt: string | null
  endsOn: string | null
  endsAt: string | null
  durationMinutes: number | null
  changes: number | null
  preis: number | null
  preisWaehrung: string | null
  labels: string[]
  reasons: string[]
}

export type MobilitySucheAntwort = {
  status: MobilitySuchStatus
  message: string
  coverageNote: string
  evidenz: MobilityEvidenz
  options: MobilityOptionSichtbar[]
}

export function sucheFuerClient(ergebnis: MobilitySuchergebnis): MobilitySucheAntwort {
  return {
    status: ergebnis.status,
    message: ergebnis.message,
    coverageNote: ergebnis.coverageNote || MOBILITY_ABDECKUNGSHINWEIS,
    evidenz: ergebnis.evidenz,
    options: ergebnis.options.map((option) => ({
      id: option.id,
      mode: option.mode,
      title: option.title,
      originName: option.originName,
      destinationName: option.destinationName,
      startsOn: option.startsOn,
      startsAt: option.startsAt,
      endsOn: option.endsOn,
      endsAt: option.endsAt,
      durationMinutes: option.durationMinutes,
      changes: option.changes,
      preis: option.preis,
      preisWaehrung: option.preisWaehrung,
      labels: option.labels.map((marke: MobilityMarke) => MOBILITY_MARKE_TEXT[marke]),
      reasons: [...option.reasons],
    })),
  }
}
