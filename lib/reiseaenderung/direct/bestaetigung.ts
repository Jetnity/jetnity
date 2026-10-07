import type { Trip } from '@/types/trips'

/** Stable keys; array order is graph meaning. Database row timestamps are not that meaning. */
export function kanonisch(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(kanonisch).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${kanonisch(v)}`).join(',')}}`
  return JSON.stringify(value) ?? 'null'
}
export function bedeutung(trip: Trip): string {
  const { revision: _revision, lastMutationId: _mutation, updatedAt: _updated, ...rest } = trip
  void _revision; void _mutation; void _updated
  const item = (p: Trip['ohneTag'][number]) => { const { rowVersion: _row, ...fields } = p; void _row; return fields }
  return kanonisch({ ...rest, days: trip.days.map(d => ({ ...d, items: d.items.map(item) })), ohneTag: trip.ohneTag.map(item) })
}
export async function fingerprint(value: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('')
}
export async function mutationskennung(seed: string, tripId: string, basisRevision: number, eingabe: unknown): Promise<string> {
  return fingerprint(kanonisch({ seed, tripId, basisRevision, eingabe }))
}
export type SpeicherErgebnis =
  | { ok: true; reise: Trip }
  | { ok: false; art: 'eingabe' | 'konflikt' | 'sitzung' | 'unverfuegbar' | 'ungewiss'; meldung: string }
export const KONFLIKT = 'Diese Reise hat sich inzwischen geändert. Bitte lade den aktuellen Stand und prüfe die Änderung erneut.'
export const UNGEWISS = 'Die Speicherung ist noch nicht bestätigt. Es kann bereits gespeichert worden sein. Bitte prüfe das Ergebnis erneut.'

export async function bestaetigteReise(trip: Trip, expected: { tripId: string; basisRevision: number; mutationId: string; hash: string }): Promise<boolean> {
  return trip.id === expected.tripId && trip.revision === expected.basisRevision + 1 &&
    trip.lastMutationId === expected.mutationId && await fingerprint(bedeutung(trip)) === expected.hash
}
