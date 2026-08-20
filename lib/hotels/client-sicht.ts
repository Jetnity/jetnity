// lib/hotels/client-sicht.ts
//
// Was den Browser erreichen darf.
//
// Quartierbegründung und Hoteloptionen bleiben, interne Scores, Provider-Rohfelder
// und Token-ähnliche Schlüssel fallen heraus.
//
// Frei von Next.

import {
  HOTEL_ABDECKUNGSHINWEIS,
  LEERE_QUARTIER_EVIDENZ,
  type BewerteteHotelOption,
  type BewertetesQuartier,
  type HotelMarke,
  type HotelOption,
  type HotelSuchStatus,
  type QuartierEvidenz,
} from '@/lib/hotels/domain'
import { hotelOptionLesen } from '@/lib/hotels/schema'

const VERBOTENE_SCHLUESSEL = [
  'access_token',
  'client_secret',
  'client_id',
  'apiKey',
  'api_key',
  'secret',
  'token',
  'providerMeta',
  'raw',
  'score',
] as const

export type QuartierSichtbar = {
  id: string
  name: string
  herkunft: 'etappenort' | 'quartiervorschlag'
  zentrum: { lat: number; lon: number } | null
  reasons: string[]
}

export type HotelOptionSichtbar = HotelOption & {
  labels: HotelMarke[]
  reasons: string[]
}

export type HotelSucheAntwort = {
  status: HotelSuchStatus
  message: string
  coverageNote: string
  quartier: QuartierSichtbar | null
  evidenz: QuartierEvidenz
  options: HotelOptionSichtbar[]
}

function hatVerbotenes(wert: unknown, pfad: string[] = []): string | null {
  if (wert === null || typeof wert !== 'object') return null
  if (Array.isArray(wert)) {
    for (const [index, eintrag] of wert.entries()) {
      const treffer = hatVerbotenes(eintrag, [...pfad, String(index)])
      if (treffer) return treffer
    }
    return null
  }
  for (const [schluessel, eintrag] of Object.entries(wert as Record<string, unknown>)) {
    if ((VERBOTENE_SCHLUESSEL as readonly string[]).includes(schluessel)) {
      return [...pfad, schluessel].join('.')
    }
    const treffer = hatVerbotenes(eintrag, [...pfad, schluessel])
    if (treffer) return treffer
  }
  return null
}

function quartierFuerClient(quartier: BewertetesQuartier | null): QuartierSichtbar | null {
  if (!quartier) return null
  return {
    id: quartier.id,
    name: quartier.name,
    herkunft: quartier.herkunft,
    zentrum: quartier.zentrum,
    reasons: quartier.reasons.slice(0, 3),
  }
}

function optionFuerClient(option: BewerteteHotelOption): HotelOptionSichtbar | null {
  const kern = hotelOptionLesen(option)
  if (!kern) return null
  return {
    ...kern,
    labels: option.labels,
    reasons: option.reasons.slice(0, 4),
  }
}

export function sucheFuerClient(ergebnis: {
  status: HotelSuchStatus
  message: string
  quartier: BewertetesQuartier | null
  evidenz?: QuartierEvidenz
  options: BewerteteHotelOption[]
}): HotelSucheAntwort {
  const options = ergebnis.options
    .map(optionFuerClient)
    .filter((option): option is HotelOptionSichtbar => option !== null)

  const koerper: HotelSucheAntwort = {
    status: ergebnis.status,
    message: ergebnis.message,
    coverageNote: HOTEL_ABDECKUNGSHINWEIS,
    quartier: quartierFuerClient(ergebnis.quartier),
    evidenz: ergebnis.evidenz ?? LEERE_QUARTIER_EVIDENZ,
    options,
  }

  const verboten = hatVerbotenes(koerper)
  if (verboten) {
    return {
      status: 'error',
      message: 'Die Hoteldaten konnten nicht sicher ausgeliefert werden.',
      coverageNote: HOTEL_ABDECKUNGSHINWEIS,
      quartier: null,
      evidenz: LEERE_QUARTIER_EVIDENZ,
      options: [],
    }
  }

  return koerper
}

export function clientEnthaeltGeheimnis(wert: unknown): boolean {
  return hatVerbotenes(wert) !== null
}
