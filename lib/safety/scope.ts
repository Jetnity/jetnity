// lib/safety/scope.ts
//
// Räumlicher und zeitlicher Geltungsbereich. Keine erfundene Geometrie.

import { istOrtId } from '@/lib/places/domain'
import { iataLesen, safetyLandescode } from '@/lib/safety/domain'
import { zeitgrenzeMs } from '@/lib/safety/evidence'

const SAFETY_SCOPE_KINDS = [
  'country',
  'admin_region',
  'city',
  'place',
  'airport',
  'point_radius',
  'polygon',
  'route_corridor',
  'insufficient',
] as const
export type SafetyScopeKind = (typeof SAFETY_SCOPE_KINDS)[number]

export type SafetySpatialScope =
  | { kind: 'country'; countryCode: string }
  | {
      kind: 'admin_region'
      countryCode: string
      regionCode: string | null
      regionName: string | null
    }
  | {
      kind: 'city'
      countryCode: string
      placeId: string | null
      cityName: string | null
    }
  | { kind: 'place'; countryCode: string | null; placeId: string }
  | { kind: 'airport'; airportCode: string; countryCode: string | null }
  | {
      kind: 'point_radius'
      latitude: number
      longitude: number
      radiusKm: number
      countryCode: string | null
    }
  | {
      kind: 'polygon'
      coordinates: readonly [number, number][]
      countryCode: string | null
    }
  | { kind: 'route_corridor'; airportCodes: string[] }
  | { kind: 'insufficient' }

export function scopeIdentitaet(scope: SafetySpatialScope): string {
  switch (scope.kind) {
    case 'country':
      return `country:${scope.countryCode}`
    case 'admin_region':
      return `region:${scope.countryCode}:${scope.regionCode ?? scope.regionName ?? ''}`
    case 'city':
      return `city:${scope.countryCode}:${scope.placeId ?? scope.cityName ?? ''}`
    case 'place':
      return `place:${scope.placeId}:${scope.countryCode ?? ''}`
    case 'airport':
      return `airport:${scope.airportCode}`
    case 'point_radius':
      return `point:${scope.latitude.toFixed(4)},${scope.longitude.toFixed(4)},${scope.radiusKm}:${scope.countryCode ?? ''}`
    case 'polygon':
      return `polygon:${scope.coordinates.map((punkt) => punkt.join(',')).join(';')}:${scope.countryCode ?? ''}`
    case 'route_corridor':
      return `corridor:${[...scope.airportCodes].sort().join(',')}`
    case 'insufficient':
      return 'insufficient'
  }
}

function zahlLesen(wert: unknown, min: number, max: number): number | null {
  if (typeof wert !== 'number' || !Number.isFinite(wert)) return null
  if (wert < min || wert > max) return null
  return wert
}

function nameLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const text = wert.replace(/<[^>]*>/g, '').trim()
  if (text.length < 2 || text.length > 80) return null
  return text
}

export function spatialScopeLesen(roh: unknown): SafetySpatialScope {
  if (!roh || typeof roh !== 'object') return { kind: 'insufficient' }
  const wert = roh as Record<string, unknown>
  const kind = wert.kind
  const countryCode = safetyLandescode(wert.countryCode)

  if (kind === 'country') {
    return countryCode ? { kind: 'country', countryCode } : { kind: 'insufficient' }
  }
  if (kind === 'admin_region') {
    if (!countryCode) return { kind: 'insufficient' }
    const regionCode = nameLesen(wert.regionCode)
    const regionName = nameLesen(wert.regionName)
    if (!regionCode && !regionName) return { kind: 'insufficient' }
    return { kind: 'admin_region', countryCode, regionCode, regionName }
  }
  if (kind === 'city') {
    if (!countryCode) return { kind: 'insufficient' }
    const placeId = typeof wert.placeId === 'string' && istOrtId(wert.placeId) ? wert.placeId : null
    const cityName = nameLesen(wert.cityName)
    if (!placeId && !cityName) return { kind: 'insufficient' }
    return { kind: 'city', countryCode, placeId, cityName }
  }
  if (kind === 'place') {
    if (typeof wert.placeId !== 'string' || !istOrtId(wert.placeId)) return { kind: 'insufficient' }
    return { kind: 'place', countryCode, placeId: wert.placeId }
  }
  if (kind === 'airport') {
    const airportCode = iataLesen(wert.airportCode)
    return airportCode ? { kind: 'airport', airportCode, countryCode } : { kind: 'insufficient' }
  }
  if (kind === 'point_radius') {
    const latitude = zahlLesen(wert.latitude, -90, 90)
    const longitude = zahlLesen(wert.longitude, -180, 180)
    const radiusKm = zahlLesen(wert.radiusKm, 0.1, 2000)
    if (latitude == null || longitude == null || radiusKm == null) return { kind: 'insufficient' }
    return { kind: 'point_radius', latitude, longitude, radiusKm, countryCode }
  }
  if (kind === 'polygon') {
    if (!Array.isArray(wert.coordinates) || wert.coordinates.length < 3 || wert.coordinates.length > 32) {
      return { kind: 'insufficient' }
    }
    const coordinates: [number, number][] = []
    for (const punkt of wert.coordinates) {
      if (!Array.isArray(punkt) || punkt.length !== 2) return { kind: 'insufficient' }
      const lat = zahlLesen(punkt[0], -90, 90)
      const lon = zahlLesen(punkt[1], -180, 180)
      if (lat == null || lon == null) return { kind: 'insufficient' }
      coordinates.push([lat, lon])
    }
    return { kind: 'polygon', coordinates, countryCode }
  }
  if (kind === 'route_corridor') {
    if (!Array.isArray(wert.airportCodes)) return { kind: 'insufficient' }
    const airportCodes = [
      ...new Set(wert.airportCodes.map((code) => iataLesen(code)).filter((code): code is string => Boolean(code))),
    ].sort()
    return airportCodes.length > 0 ? { kind: 'route_corridor', airportCodes } : { kind: 'insufficient' }
  }
  return { kind: 'insufficient' }
}

export function entfernungKm(
  von: { latitude: number; longitude: number },
  nach: { latitude: number; longitude: number },
): number {
  const toRad = (wert: number) => (wert * Math.PI) / 180
  const dLat = toRad(nach.latitude - von.latitude)
  const dLon = toRad(nach.longitude - von.longitude)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(von.latitude)) * Math.cos(toRad(nach.latitude)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function punktInPolygon(
  punkt: { latitude: number; longitude: number },
  polygon: readonly [number, number][],
): boolean {
  let innen = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]?.[0] ?? 0
    const yi = polygon[i]?.[1] ?? 0
    const xj = polygon[j]?.[0] ?? 0
    const yj = polygon[j]?.[1] ?? 0
    const schnitt =
      yi > punkt.longitude !== yj > punkt.longitude &&
      punkt.latitude < ((xj - xi) * (punkt.longitude - yi)) / (yj - yi || Number.EPSILON) + xi
    if (schnitt) innen = !innen
  }
  return innen
}

export function zeitraeumeUeberschneiden(
  reiseStart: string | null,
  reiseEnde: string | null,
  eventStart: string | null,
  eventEnde: string | null,
): 'overlaps' | 'before' | 'after' | 'insufficient' {
  if (!reiseStart && !reiseEnde) return 'insufficient'
  const tripStart = reiseStart ? zeitgrenzeMs(reiseStart, 'start') : reiseEnde ? zeitgrenzeMs(reiseEnde, 'start') : null
  const tripEnd = reiseEnde ? zeitgrenzeMs(reiseEnde, 'end') : reiseStart ? zeitgrenzeMs(reiseStart, 'end') : null
  if (tripStart == null || tripEnd == null || !Number.isFinite(tripStart) || !Number.isFinite(tripEnd)) {
    return 'insufficient'
  }
  const eventStartMs = eventStart ? zeitgrenzeMs(eventStart, 'start') : null
  const eventEndMs = eventEnde ? zeitgrenzeMs(eventEnde, 'end') : null
  if (eventEndMs != null && Number.isFinite(eventEndMs) && eventEndMs < tripStart) return 'before'
  if (eventStartMs != null && Number.isFinite(eventStartMs) && eventStartMs > tripEnd) return 'after'
  return 'overlaps'
}
