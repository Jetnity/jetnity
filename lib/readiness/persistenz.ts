// lib/readiness/persistenz.ts
//
// Normalisiert persistierte Readiness-Zeilen. Der Fingerprint in der
// gespeicherten Zeile ist der Stand zum Zeitpunkt der Nutzeraktion.

import { readinessItemsLesen } from '@/lib/readiness/schema'
import type { TripReadinessItem } from '@/types/trips'

export type ReadinessZeile = {
  id: string
  client_ref: string
  kind: string
  user_status: string
  evidence?: string | null
  country_code?: string | null
  trip_item_id?: string | null
  title?: string | null
  context_fingerprint: string
  created_at: string
  updated_at: string
}

function readinessAusZeile(zeile: ReadinessZeile): TripReadinessItem | null {
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
      contextFingerprint: zeile.context_fingerprint,
      createdAt: zeile.created_at,
      updatedAt: zeile.updated_at,
    },
  ])[0] ?? null
}

export function readinessAusZeilen(zeilen: ReadinessZeile[] | null | undefined): TripReadinessItem[] {
  if (!zeilen?.length) return []
  return zeilen
    .map(readinessAusZeile)
    .filter((item): item is TripReadinessItem => item !== null)
}

