// lib/route/referenz.ts
//
// IATA → Country/City nur aus einer expliziten Flughafenreferenz.
// Kein Raten aus Namen wie Doha, Paris oder San José.
//
// Frei von Next, Supabase und `process.env`.

import { landescodeLesen } from '@/lib/readiness/domain'
import type { FlughafenReferenz, FlughafenReferenzKarte, RoutePunkt } from '@/lib/route/domain'

export function iataLesen(wert: string | null | undefined): string | null {
  if (!wert) return null
  const code = wert.trim().toUpperCase()
  return /^[A-Z]{3}$/.test(code) ? code : null
}

export function flughafenPunkt(
  code: string | null | undefined,
  refs: FlughafenReferenzKarte = {},
): RoutePunkt {
  const airportCode = iataLesen(code)
  if (!airportCode) {
    return { airportCode: null, countryCode: null, city: null, country: null }
  }
  const ref = refs[airportCode]
  return {
    airportCode,
    countryCode: landescodeLesen(ref?.countryCode ?? null),
    city: textOderNull(ref?.city),
    country: textOderNull(ref?.country),
  }
}

function referenzAusZeile(zeile: {
  iata?: string | null
  country_code?: string | null
  city?: string | null
  country?: string | null
  name?: string | null
}): [string, FlughafenReferenz] | null {
  const code = iataLesen(zeile.iata)
  if (!code) return null
  return [
    code,
    {
      countryCode: landescodeLesen(zeile.country_code ?? null),
      city: textOderNull(zeile.city),
      country: textOderNull(zeile.country),
      name: textOderNull(zeile.name),
    },
  ]
}

export function referenzKarteAus(zeilen: readonly Parameters<typeof referenzAusZeile>[0][]): FlughafenReferenzKarte {
  const karte: Record<string, FlughafenReferenz> = {}
  for (const zeile of zeilen) {
    const eintrag = referenzAusZeile(zeile)
    if (!eintrag) continue
    karte[eintrag[0]] = eintrag[1]
  }
  return karte
}

export function iatasAusOption(option: {
  legs: readonly { segments: readonly { origin: string; destination: string }[] }[]
}): string[] {
  const codes: string[] = []
  for (const bein of option.legs) {
    for (const segment of bein.segments) {
      const origin = iataLesen(segment.origin)
      const destination = iataLesen(segment.destination)
      if (origin) codes.push(origin)
      if (destination) codes.push(destination)
    }
  }
  return codes
}

function textOderNull(wert: string | null | undefined): string | null {
  const text = wert?.trim() ?? ''
  return text ? text.slice(0, 120) : null
}
