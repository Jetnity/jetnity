// lib/trips/foundation-e-select.ts
//
// Expand/Contract für Account-Trip-Reads. Wenn die kanonische Einbettung eine
// Child-Relation von trip_travellers nicht auflösen kann, darf genau dieser
// Schema- oder Cache-Fehler auf den Legacy-Select ohne Citizenship-/Document-
// Einbettung zurückfallen. Der Legacy-Select ist Kompatibilität, kein Beleg,
// dass Production die Child-Tabellen nicht hat.

import type { Datenbankfehler } from '@/lib/api/datenbank-lesen'

export const TRIP_GRAPH_SELECT_KANONISCH =
  '*, trip_stages(*), trip_days(*), trip_items(*), trip_readiness_items(*), trip_travellers(*, trip_traveller_citizenships(*), trip_traveller_documents(*))'

export const TRIP_GRAPH_SELECT_LEGACY =
  '*, trip_stages(*), trip_days(*), trip_items(*), trip_readiness_items(*), trip_travellers(*)'

const CHILD_RELATION = /trip_traveller_citizenships|trip_traveller_documents/i

export function foundationERelationFehlt(fehler: Datenbankfehler | null | undefined): boolean {
  if (!fehler) return false
  const code = (fehler.code ?? '').trim()
  const message = (fehler.message ?? '').trim()
  if (!CHILD_RELATION.test(message)) return false
  if (code === 'PGRST200' || code === 'PGRST205' || code === '42P01') return true
  return (
    /could not find a relationship between ['"]trip_travellers['"] and ['"]trip_traveller_(citizenships|documents)['"]/i.test(
      message,
    ) || /relation ['"]?(?:public\.)?trip_traveller_(citizenships|documents)['"]? does not exist/i.test(message)
  )
}

export type AccountGraphTravellerKind = {
  trip_traveller_citizenships?: unknown
  trip_traveller_documents?: unknown
}

export type AccountGraphZeileKind = {
  trip_travellers?: unknown
}

/**
 * Strukturelle Ladevollständigkeit der Reisenden-Children.
 *
 * Eine kanonisch leere Party und geladene leere Child-Arrays sind vollständig.
 * Eine fehlende, nullte oder nicht-array Party, oder ein Reisender ohne beide
 * geladenen Child-Arrays, ist unvollständig. Credential-Inhalt wird nicht
 * bewertet.
 */
export function accountGraphKinderVollstaendig(zeile: AccountGraphZeileKind): boolean {
  const party = zeile.trip_travellers
  if (!Array.isArray(party)) return false
  return party.every((eintrag) => {
    if (!eintrag || typeof eintrag !== 'object') return false
    const reisender = eintrag as AccountGraphTravellerKind
    return Array.isArray(reisender.trip_traveller_citizenships) && Array.isArray(reisender.trip_traveller_documents)
  })
}
