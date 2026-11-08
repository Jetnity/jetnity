import 'server-only'
import type { Trip } from '@/types/trips'
import { graphZeileZuReise, type GraphZeile } from '@/lib/trips/daten'
import { pilotScope } from '../official-truth-ch-de-application-pilot-1/scope-server'
import { pilotContextCurrent, declarationReferencesValid, pilotContextFingerprint } from '../official-truth-ch-de-application-pilot-1/context'
import { regelScopeAusEvidenceScope } from '../rule-claims'
import { historicalValuesEqual } from '../official-truth-autonomous-provenance-artifact'
import type { AcceptedStoreContract } from './canonical-server'

/** Value comparisons supplement, never replace, the authenticated SQL graph
 * snapshot/row-membership/MVCC checks. No revision-only concurrency shortcut. */
function encoded(value: unknown, depth = 0): string {
  if (depth > 24) throw Error('trip_graph_bound')
  if (value === undefined) return '["undefined"]'
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify([typeof value, value])
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(['number', value])
  if (Array.isArray(value)) return `["array",${value.map(v => encoded(v, depth + 1)).join(',')}]`
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) throw Error('trip_graph_invalid')
  return `["object",${Object.keys(value).sort().map(k => `[${JSON.stringify(k)},${encoded((value as Record<string, unknown>)[k], depth + 1)}]`).join(',')}]`
}
function sortIdentity<T extends { id?: string; clientRef?: string }>(values: readonly T[]): T[] {
  const ids = values.map(v => v.id ?? v.clientRef)
  if (ids.some(id => typeof id !== 'string' || !id) || new Set(ids).size !== ids.length) throw Error('trip_graph_ambiguous')
  return [...values].sort((a, b) => {
    const x = a.id ?? a.clientRef!, y = b.id ?? b.clientRef!
    return x < y ? -1 : x > y ? 1 : 0
  })
}
export function tripValueBinding(trip: Trip): string {
  const party = trip.party === undefined ? undefined : sortIdentity(trip.party).map(t => ({ ...t,
    citizenships: sortIdentity(t.citizenships), documents: sortIdentity(t.documents) }))
  const result = encoded({ ...trip, party,
    readinessItems: trip.readinessItems === undefined ? undefined : sortIdentity(trip.readinessItems) })
  if (Buffer.byteLength(result, 'utf8') > 2_097_152) throw Error('trip_graph_bound')
  return result
}

export function reservedTripValue(raw: unknown): string {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('trip_graph_invalid')
  const row = raw as Record<string, unknown>
  let count = 1
  for (const name of ['trip_stages', 'trip_days', 'trip_items', 'trip_readiness_items', 'trip_travellers']) {
    if (!Array.isArray(row[name])) throw Error('trip_graph_incomplete')
    count += row[name].length
  }
  for (const traveller of row.trip_travellers as Record<string, unknown>[]) {
    for (const name of ['trip_traveller_citizenships', 'trip_traveller_documents']) {
      if (!Array.isArray(traveller[name])) throw Error('trip_graph_incomplete')
      count += traveller[name].length
    }
  }
  if (count > 6_000 || Buffer.byteLength(JSON.stringify(raw), 'utf8') > 2_097_152) throw Error('trip_graph_bound')
  return tripValueBinding(graphZeileZuReise(raw as GraphZeile))
}

/** Only the explicitly selected CH ordinary-passport cell and exact compiled
 * start-date slot are supported. Other persons/options remain untouched. */
export function selectedTripBinding(trip: Trip, contract: AcceptedStoreContract) {
  if (!pilotScope(trip).ok || !pilotContextCurrent(trip) || !trip.regulatoryContext
    || !declarationReferencesValid(trip, trip.regulatoryContext.declaration) || !trip.startDate || !trip.endDate
    || trip.startDate > trip.endDate || trip.startDate < contract.travelDates.from || trip.endDate > contract.travelDates.through) return null
  const declaration = trip.regulatoryContext.declaration
  const traveller = trip.party?.find(t => t.clientRef === declaration.travellerClientRef)
  if (!traveller || traveller.citizenships.length !== 1 || traveller.citizenships[0]!.countryCode !== 'CH'
    || !declaration.travellerClientRef || !declaration.credentialOptionRef) return null
  const scope = regelScopeAusEvidenceScope({ destinationCountryCode: 'DE', transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: traveller.citizenships.map(c => c.countryCode).sort() },
    credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
    residence: { mode: 'not_applicable' }, requirementType: 'visa', validity: { mode: 'travel_date', travelDate: trip.startDate } })
  if (!scope.ok || !historicalValuesEqual(scope.scope, contract.scope)) return null
  return { travellerClientRef: declaration.travellerClientRef, credentialOptionRef: declaration.credentialOptionRef,
    contextFingerprint: pilotContextFingerprint(trip), ruleScopeKey: scope.key }
}

/** The initial supported subset requires explicit date-precision legal bounds.
 * An application slot does not substitute for an independently derived interval. */
export function legalDatesCoverTrip(trip: Trip, from: string | null, through: string | null): boolean {
  return !!trip.startDate && !!trip.endDate && !!from && !!through
    && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(through)
    && from <= trip.startDate && trip.endDate <= through && trip.startDate <= trip.endDate
}
