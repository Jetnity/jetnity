// lib/trips/foundation-e-select.ts
//
// Expand/Contract für Account-Trip-Reads. Foundation-E-Children sind auf
// Production noch nicht vorhanden. Nur genau dieser Schema-Fehler darf auf
// den Legacy-Select zurückfallen.

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
