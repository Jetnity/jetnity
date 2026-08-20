// lib/flights/client-sicht.ts
//
// Was den Browser erreichen darf.
//
// Die bewertete Option behält Route, Zeiten, Preis und Jetnity-Gründe.
// Interne Score-Zahlen, Provider-Rohfelder und Token-ähnliche Schlüssel fallen
// heraus. Ein zweiter Provider ändert diese Sicht nicht.
//
// Frei von Next.

import type { BewerteteFlugOption, FlugMarke, FlugOption } from '@/lib/flights/domain'
import { FLUG_ABDECKUNGSHINWEIS, type FlugSuchStatus } from '@/lib/flights/domain'
import { flugOptionLesen } from '@/lib/flights/schema'

const VERBOTENE_SCHLUESSEL = [
  'access_token',
  'client_secret',
  'client_id',
  'apiKey',
  'api_key',
  'secret',
  'token',
  'dictionaries',
  'travelerPricings',
  'providerMeta',
  'raw',
  'score',
] as const

export type FlugOptionSichtbar = FlugOption & {
  labels: FlugMarke[]
  reasons: string[]
}

export type FlugSucheAntwort = {
  status: FlugSuchStatus
  message: string
  coverageNote: string
  options: FlugOptionSichtbar[]
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

function optionFuerClient(option: BewerteteFlugOption): FlugOptionSichtbar | null {
  const kern = flugOptionLesen(option)
  if (!kern) return null
  return {
    ...kern,
    labels: option.labels,
    reasons: option.reasons.slice(0, 4),
  }
}

export function sucheFuerClient(ergebnis: {
  status: FlugSuchStatus
  message: string
  options: BewerteteFlugOption[]
}): FlugSucheAntwort {
  const options = ergebnis.options
    .map(optionFuerClient)
    .filter((option): option is FlugOptionSichtbar => option !== null)

  const koerper: FlugSucheAntwort = {
    status: ergebnis.status,
    message: ergebnis.message,
    coverageNote: FLUG_ABDECKUNGSHINWEIS,
    options,
  }

  const verboten = hatVerbotenes(koerper)
  if (verboten) {
    return {
      status: 'error',
      message: 'Die Flugdaten konnten nicht sicher ausgeliefert werden.',
      coverageNote: FLUG_ABDECKUNGSHINWEIS,
      options: [],
    }
  }

  return koerper
}

export function clientEnthaeltGeheimnis(wert: unknown): boolean {
  return hatVerbotenes(wert) !== null
}
