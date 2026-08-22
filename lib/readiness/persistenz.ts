// lib/readiness/persistenz.ts
//
// Normalisiert persistierte Readiness-Zeilen. Der Fingerprint in der
// gespeicherten Zeile ist der Stand zum Zeitpunkt der Nutzeraktion.

import { readinessItemsLesen } from '@/lib/readiness/schema'
import type { TripReadinessItem, TripTraveller } from '@/types/trips'

export type ReadinessZeile = {
  id: string
  client_ref: string
  kind: string
  user_status: string
  evidence?: string | null
  country_code?: string | null
  trip_item_id?: string | null
  title?: string | null
  traveller_id?: string | null
  context_fingerprint: string
  created_at: string
  updated_at: string
}

function readinessAusZeile(zeile: ReadinessZeile, party: readonly TripTraveller[] = []): TripReadinessItem | null {
  const travellerClientRef = zeile.traveller_id
    ? party.find((eintrag) => eintrag.id === zeile.traveller_id)?.clientRef ?? null
    : null
  return readinessItemsLesen([
    {
      id: zeile.id,
      clientRef: zeile.client_ref,
      kind: zeile.kind,
      userStatus: zeile.user_status,
      evidence: zeile.evidence ?? 'user',
      countryCode: zeile.country_code ?? null,
      tripItemId: zeile.trip_item_id ?? null,
      title: zeile.title ?? null,
      travellerClientRef,
      contextFingerprint: zeile.context_fingerprint,
      createdAt: zeile.created_at,
      updatedAt: zeile.updated_at,
    },
  ])[0] ?? null
}

export function readinessAusZeilen(
  zeilen: ReadinessZeile[] | null | undefined,
  party: readonly TripTraveller[] = [],
): TripReadinessItem[] {
  if (!zeilen?.length) return []
  return zeilen
    .map((zeile) => readinessAusZeile(zeile, party))
    .filter((item): item is TripReadinessItem => item !== null)
}
