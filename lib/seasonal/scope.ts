// lib/seasonal/scope.ts
//
// Räumlicher Geltungsbereich. Keine erfundene Geometrie, keine Landeshochstufung.

import { istOrtId } from '@/lib/places/domain'
import { iataLesen, seasonalLandescode } from '@/lib/seasonal/domain'

const SEASONAL_SCOPE_KINDS = [
  'country',
  'admin_region',
  'city',
  'place',
  'airport',
  'point_radius',
  'route',
  'insufficient',
] as const
export type SeasonalScopeKind = (typeof SEASONAL_SCOPE_KINDS)[number]

export type SeasonalSpatialScope =
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
  | { kind: 'route'; airportCodes: string[] }
  | { kind: 'insufficient' }

export function kanonZahl(wert: number): string {
  if (!Number.isFinite(wert)) return ''
  return Object.is(wert, -0) ? '0' : String(wert)
}

export function scopeIdentitaet(scope: SeasonalSpatialScope): string {
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
      return `point:${kanonZahl(scope.latitude)},${kanonZahl(scope.longitude)},${kanonZahl(scope.radiusKm)}:${scope.countryCode ?? ''}`
    case 'route':
      return `route:${[...scope.airportCodes].sort().join(',')}`
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

export function spatialScopeLesen(roh: unknown): SeasonalSpatialScope {
  if (!roh || typeof roh !== 'object') return { kind: 'insufficient' }
  const wert = roh as Record<string, unknown>
  const kind = wert.kind
  const countryCode = seasonalLandescode(wert.countryCode)

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
  if (kind === 'route') {
    if (!Array.isArray(wert.airportCodes) || wert.airportCodes.length === 0) return { kind: 'insufficient' }
    const airportCodes: string[] = []
    for (const code of wert.airportCodes) {
      const gelesen = iataLesen(code)
      if (!gelesen) return { kind: 'insufficient' }
      airportCodes.push(gelesen)
    }
    return { kind: 'route', airportCodes: [...new Set(airportCodes)].sort() }
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
