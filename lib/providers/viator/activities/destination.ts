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
