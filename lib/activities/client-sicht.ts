// lib/activities/client-sicht.ts
//
// Was den Browser erreichen darf.
//
// Aktivitätsoptionen bleiben, interne Scores, Provider-Rohfelder
// und Token-ähnliche Schlüssel fallen heraus.
//
// Frei von Next.

import {
  ACTIVITY_ABDECKUNGSHINWEIS,
  LEERE_ACTIVITY_EVIDENZ,
  type ActivityEvidenz,
  type ActivityMarke,
  type ActivityOption,
  type ActivitySuchStatus,
  type BewerteteActivityOption,
} from '@/lib/activities/domain'
import { activityOptionLesen } from '@/lib/activities/schema'
import { validateViatorProductUrl, viatorBildAnzeigen } from '@/lib/providers/viator/activities/url'
import { istViatorProduktcode } from '@/lib/providers/viator/activities/produktcode'

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

export type ActivityOptionSichtbar = ActivityOption & {
  labels: ActivityMarke[]
  reasons: string[]
  konflikt: 'ueberschneidung' | 'frei' | 'unbekannt'
}

export type ActivityViatorVerweis = {
  externalRef: string
  productUrl: string
}

export type ActivitySucheAntwort = {
  status: ActivitySuchStatus
  message: string
  coverageNote: string
  evidenz: ActivityEvidenz
  options: ActivityOptionSichtbar[]
  viatorVerweise?: ActivityViatorVerweis[]
}

export function viatorVerweiseAusRoh(
  wert: unknown,
  optionen: readonly { externalRef: string }[],
): ActivityViatorVerweis[] {
  if (wert == null) return []
  if (!Array.isArray(wert)) return []
  const gelesen: ActivityViatorVerweis[] = []
  for (const eintrag of wert) {
    if (!eintrag || typeof eintrag !== 'object' || Array.isArray(eintrag)) continue
    const roh = eintrag as Record<string, unknown>
    if (Object.keys(roh).some((key) => key !== 'externalRef' && key !== 'productUrl')) continue
    if (typeof roh.externalRef !== 'string' || typeof roh.productUrl !== 'string') continue
    gelesen.push({ externalRef: roh.externalRef, productUrl: roh.productUrl })
  }
  return viatorVerweiseLesen(gelesen, optionen)
}

function viatorVerweiseLesen(
  wert: readonly { externalRef: string; productUrl: string }[] | undefined,
  optionen: readonly { externalRef: string }[],
): ActivityViatorVerweis[] {
  if (!wert || wert.length === 0) return []
  const erlaubt = new Set(optionen.map((option) => option.externalRef))
  const ausgabe: ActivityViatorVerweis[] = []
  for (const eintrag of wert) {
    if (!erlaubt.has(eintrag.externalRef) || !istViatorProduktcode(eintrag.externalRef)) continue
    const geprueft = validateViatorProductUrl(eintrag.productUrl)
    if (!geprueft.ok || geprueft.url !== eintrag.productUrl) continue
    if (ausgabe.some((bekannt) => bekannt.externalRef === eintrag.externalRef)) continue
    ausgabe.push({ externalRef: eintrag.externalRef, productUrl: eintrag.productUrl })
  }
  return ausgabe
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

function optionFuerClient(option: BewerteteActivityOption): ActivityOptionSichtbar | null {
  const kern = activityOptionLesen(option)
  if (!kern) return null
  const bild = viatorBildAnzeigen(kern.bildUrl)
  return {
    ...kern,
    bildUrl: bild,
    labels: option.labels,
    reasons: option.reasons.slice(0, 4),
    konflikt: option.context.konflikt,
  }
}

export function sucheFuerClient(ergebnis: {
  status: ActivitySuchStatus
  message: string
  evidenz?: ActivityEvidenz
  options: BewerteteActivityOption[]
  verweise?: readonly { externalRef: string; productUrl: string }[]
}): ActivitySucheAntwort {
  const options = ergebnis.options
    .map(optionFuerClient)
    .filter((option): option is ActivityOptionSichtbar => option !== null)
  const viatorVerweise = viatorVerweiseLesen(ergebnis.verweise, options)

  const koerper: ActivitySucheAntwort = {
    status: ergebnis.status,
    message: ergebnis.message,
    coverageNote: ACTIVITY_ABDECKUNGSHINWEIS,
    evidenz: ergebnis.evidenz ?? LEERE_ACTIVITY_EVIDENZ,
    options,
    ...(viatorVerweise.length > 0 ? { viatorVerweise } : {}),
  }

  const verboten = hatVerbotenes(koerper)
  if (verboten) {
    return {
      status: 'error',
      message: 'Die Aktivitätsdaten konnten nicht sicher ausgeliefert werden.',
      coverageNote: ACTIVITY_ABDECKUNGSHINWEIS,
      evidenz: LEERE_ACTIVITY_EVIDENZ,
      options: [],
    }
  }

  return koerper
}

export function clientEnthaeltGeheimnis(wert: unknown): boolean {
  return hatVerbotenes(wert) !== null
}
