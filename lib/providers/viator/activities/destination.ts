import { landName } from '@/lib/country/darstellung'

export type ViatorPlaceBinding = {
  jetnityPlaceId: string
  destinationId: number
}

export type ViatorDestinationRecord = {
  destinationId: number
  name: string
}

export type ViatorDestinationResolution =
  | { ok: true; destinationId: string; name: string | null }
  | { ok: false; reason: 'unmapped' | 'ambiguous' | 'unknown_catalog_id' | 'invalid_place' }

function destinationId(value: number): string | null {
  if (!Number.isSafeInteger(value) || value <= 0) return null
  return String(value)
}

/**
 * Explicit place-id binding only. A destination name is never a lookup key,
 * so an unknown place cannot become a guessed city.
 */
export function resolveViatorDestination(input: {
  jetnityPlaceId: string
  bindings: readonly ViatorPlaceBinding[]
  catalog?: readonly ViatorDestinationRecord[]
}): ViatorDestinationResolution {
  const placeId = input.jetnityPlaceId.trim()
  if (!placeId || placeId.length > 200 || /[\u0000-\u001F]/.test(placeId)) {
    return { ok: false, reason: 'invalid_place' }
  }
  const matches = input.bindings.filter((binding) => binding.jetnityPlaceId === placeId)
  if (matches.length === 0) return { ok: false, reason: 'unmapped' }
  const ids = new Set(matches.map((binding) => binding.destinationId))
  if (ids.size !== 1) return { ok: false, reason: 'ambiguous' }
  const id = destinationId(matches[0]!.destinationId)
  if (!id) return { ok: false, reason: 'unmapped' }
  if (input.catalog) {
    const record = input.catalog.find((item) => item.destinationId === matches[0]!.destinationId)
    if (!record || record.name.trim().length === 0) return { ok: false, reason: 'unknown_catalog_id' }
    return { ok: true, destinationId: id, name: record.name }
  }
  return { ok: true, destinationId: id, name: null }
}

export type ViatorKatalogOrt = {
  destinationId: number
  name: string
  type: string
  parentDestinationId: number | null
  lookupId: string | null
  latitude: number | null
  longitude: number | null
}

const ORTS_TYPEN = new Set(['CITY', 'TOWN'])

function nameSchluessel(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('de')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function zahl(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function viatorKatalogLesen(body: unknown): ViatorKatalogOrt[] | null {
  const record = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null
  if (!record || !Array.isArray(record.destinations)) return null
  const orte: ViatorKatalogOrt[] = []
  const gesehen = new Set<number>()
  for (const item of record.destinations) {
    const ziel = item && typeof item === 'object' && !Array.isArray(item) ? (item as Record<string, unknown>) : null
    if (!ziel || typeof ziel.name !== 'string' || ziel.name.trim().length === 0) return null
    if (typeof ziel.destinationId !== 'number' || !Number.isSafeInteger(ziel.destinationId) || ziel.destinationId <= 0) return null
    if (gesehen.has(ziel.destinationId)) return null
    if (typeof ziel.type !== 'string' || ziel.type.trim().length === 0) return null
    const parent = ziel.parentDestinationId
    const parentDestinationId =
      parent == null ? null : typeof parent === 'number' && Number.isSafeInteger(parent) && parent > 0 ? parent : null
    if (parent != null && parentDestinationId == null) return null
    const center = ziel.center && typeof ziel.center === 'object' && !Array.isArray(ziel.center) ? (ziel.center as Record<string, unknown>) : null
    const lookupId = typeof ziel.lookupId === 'string' && ziel.lookupId.trim().length > 0 ? ziel.lookupId.trim() : null
    gesehen.add(ziel.destinationId)
    orte.push({
      destinationId: ziel.destinationId,
      name: ziel.name.trim(),
      type: ziel.type.trim().toUpperCase(),
      parentDestinationId,
      lookupId,
      latitude: zahl(center?.latitude),
      longitude: zahl(center?.longitude),
    })
  }
  return orte
}

function landVon(ort: ViatorKatalogOrt, katalog: readonly ViatorKatalogOrt[]): ViatorKatalogOrt | null {
  const byId = new Map(katalog.map((item) => [item.destinationId, item]))
  let aktuell: ViatorKatalogOrt | undefined = ort
  const gesehen = new Set<number>()
  while (aktuell && !gesehen.has(aktuell.destinationId)) {
    gesehen.add(aktuell.destinationId)
    if (aktuell.type === 'COUNTRY') return aktuell
    aktuell = aktuell.parentDestinationId == null ? undefined : byId.get(aktuell.parentDestinationId)
  }
  return null
}

function landPasst(code: string | null, land: ViatorKatalogOrt | null): boolean {
  if (!code) return true
  if (!land) return false
  const jetnityName = landName(code, 'en')
  if (!jetnityName || jetnityName.toUpperCase() === code.toUpperCase()) return false
  return nameSchluessel(land.name) === nameSchluessel(jetnityName)
}

function distanzKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const bogen = (wert: number) => (wert * Math.PI) / 180
  const dLat = bogen(lat2 - lat1)
  const dLon = bogen(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(bogen(lat1)) * Math.cos(bogen(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Resolves a confirmed place against a destinations catalog.
 * A repeated name without a matching country or nearby center stays unresolved.
 */
export function viatorOrtAufloesen(input: {
  name: string
  countryCode?: string | null
  latitude?: number | null
  longitude?: number | null
  katalog: readonly ViatorKatalogOrt[]
}): ViatorDestinationResolution {
  const name = nameSchluessel(input.name)
  if (!name) return { ok: false, reason: 'invalid_place' }
  const staedte = input.katalog.filter((ort) => ORTS_TYPEN.has(ort.type) && landVon(ort, input.katalog)?.type === 'COUNTRY')
  const nachName = staedte.filter((ort) => nameSchluessel(ort.name) === name && landPasst(input.countryCode ?? null, landVon(ort, input.katalog)))
  const hatPunkt = typeof input.latitude === 'number' && typeof input.longitude === 'number'
  const nah = hatPunkt
    ? nachName.filter((ort) => {
        if (ort.latitude == null || ort.longitude == null) return true
        return distanzKm(input.latitude!, input.longitude!, ort.latitude, ort.longitude) <= 80
      })
    : nachName
  if (hatPunkt && nachName.length > 0 && nah.length === 0) return { ok: false, reason: 'ambiguous' }
  const treffer = hatPunkt ? nah : nachName
  if (treffer.length === 1) {
    return { ok: true, destinationId: String(treffer[0]!.destinationId), name: treffer[0]!.name }
  }
  if (treffer.length === 0) return { ok: false, reason: 'unmapped' }
  return { ok: false, reason: 'ambiguous' }
}

