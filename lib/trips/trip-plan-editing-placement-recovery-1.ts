// Pure decisions for Trip Plan Editing and Placement Recovery 1.
// No storage, no migration, and no write graph.

import { tageEtappenZuordnen } from '@/lib/trips/zuordnung'
import type { Trip, TripItem } from '@/types/trips'

/**
 * Full semantic equality after the existing read-only stage projection.
 * The projection is not a write base. Neither argument is mutated.
 */
export function gastLoeschBasisGleich(erwartet: Trip, aktuell: Trip): boolean {
  return stabil(tageEtappenZuordnen(erwartet)) === stabil(tageEtappenZuordnen(aktuell))
}

function stabil(wert: unknown): string {
  if (wert === undefined) return 'null'
  if (wert === null || typeof wert !== 'object') return JSON.stringify(wert) ?? 'null'
  if (Array.isArray(wert)) return `[${wert.map((eintrag) => stabil(eintrag)).join(',')}]`
  const objekt = wert as Record<string, unknown>
  return `{${Object.keys(objekt)
    .sort()
    .map((name) => `${JSON.stringify(name)}:${stabil(objekt[name])}`)
    .join(',')}}`
}

export type SichtbaresZielUrteil = 'erwartet' | 'original' | 'version' | 'fremd'

/** Domain equality drops only `rowVersion`. Every other item field stays. */
function itemDomaene(item: TripItem): string {
  const { rowVersion: _version, ...rest } = item
  return JSON.stringify(rest)
}

/**
 * Classify the one visible same-id item against the captured original and the
 * read-only `punktAendern` result. A domain no-op matches on domain even when
 * `rowVersion` is unchanged.
 */
export function sichtbaresZielUrteil(
  sichtbar: readonly TripItem[],
  original: TripItem,
  erwartet: TripItem,
): SichtbaresZielUrteil {
  if (sichtbar.length !== 1) return 'fremd'
  const ziel = sichtbar[0]!
  if (itemDomaene(ziel) === itemDomaene(erwartet)) return 'erwartet'
  if (JSON.stringify(ziel) === JSON.stringify(original)) return 'original'
  if (itemDomaene(ziel) === itemDomaene(original) && itemDomaene(erwartet) !== itemDomaene(original)) {
    return 'version'
  }
  return 'fremd'
}
