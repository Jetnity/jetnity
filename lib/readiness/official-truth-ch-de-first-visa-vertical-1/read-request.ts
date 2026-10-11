import 'server-only'

import { z } from 'zod'
import { credentialOptionsAus } from '@/lib/readiness/traveller-kontext'
import { routeFactsAusGraph } from '@/lib/route/ableitung'
import type { Trip } from '@/types/trips'

const ref = z.string().min(1).max(64).regex(/^[a-zA-Z0-9:_-]+$/)
// Local request contract, deliberately NOT a new persisted Trip/account field.
// A user attestation represents declared scope; it cannot establish official truth.
const proposedContextSchema = z.object({
  evidenceClass: z.literal('user_attestation'),
  tripId: ref,
  tripRevision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  documentClientRef: ref,
  citizenshipClientRef: ref,
  passportClass: z.enum(['ordinary', 'diplomatic', 'service', 'emergency', 'other', 'unknown']).nullable(),
  purpose: z.enum(['tourism', 'other', 'unknown']).nullable(),
  travelDates: z.object({ startDate: z.string().max(10), endDate: z.string().max(10) }).strict().nullable(),
  route: z.object({
    completeness: z.enum(['complete', 'incomplete', 'unknown']),
    topology: z.enum(['direct', 'indirect', 'unknown']),
    originCountryCode: z.string().regex(/^[A-Z]{2}$/).nullable(),
    destinationCountryCode: z.string().regex(/^[A-Z]{2}$/).nullable(),
    transitCountryCodes: z.array(z.string().regex(/^[A-Z]{2}$/)).max(16),
  }).strict().nullable(),
}).strict()
const requestSchema = z.object({
  travellerClientRef: ref,
  credentialOptionRef: z.string().min(1).max(129).regex(/^[a-zA-Z0-9:_-]+$/),
  destinationCountryCode: z.literal('DE'),
  requirementType: z.literal('visa'),
  proposedContext: proposedContextSchema.nullable().optional(),
}).strict()

function date(value: unknown): value is string {
  if (typeof value !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function distinct(refs: readonly string[]): boolean {
  return new Set(refs).size === refs.length
}

/** Bounded data snapshot for this request only, not a provenance codec. Reading
 * descriptors before values prevents caller accessors/toJSON from executing.
 * No artifact/custody capability crosses into this traveller request module. */
function requestSnapshot(input: unknown): unknown {
  let remaining = 4_096
  function copy(value: unknown, depth: number): unknown {
    if (--remaining < 0 || depth > 4) throw Error('request_bound')
    if (value === null || typeof value === 'boolean') return value
    if (typeof value === 'number' && Number.isSafeInteger(value)) return value
    if (typeof value === 'string') {
      remaining -= value.length
      if (remaining < 0 || value.length > 1_024) throw Error('request_bound')
      return value
    }
    if (!value || typeof value !== 'object') throw Error('request_shape')
    const array = Array.isArray(value)
    if (![array ? Array.prototype : Object.prototype, null].includes(Object.getPrototypeOf(value))) throw Error('request_shape')
    const keys = Reflect.ownKeys(value)
    if (keys.length > 32) throw Error('request_bound')
    if (array && (value.length > 16 || keys.length !== value.length + 1)) throw Error('request_shape')
    const entries: [string, unknown][] = []
    for (const key of keys) {
      if (array && key === 'length') continue
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (typeof key !== 'string' || !descriptor || !('value' in descriptor) || !descriptor.enumerable) throw Error('request_shape')
      if (array && !/^(0|[1-9]\d*)$/.test(key)) throw Error('request_shape')
      remaining -= key.length
      entries.push([key, copy(descriptor.value, depth + 1)])
    }
    return array ? entries.map(([, child]) => child) : Object.fromEntries(entries)
  }
  try { return copy(input, 0) } catch { return null }
}

/** Selection is a lookup request, never an authorization. The Trip must come
 * from the existing Auth/RLS loader (or a synthetic local test). This only
 * validates representable prerequisites; `eligible` is deliberately absent.
 * No residence/issuer inference, first-option default or legacy synthesis.
 */
export function chDeVisaReadRequestPruefen(reise: Trip, input: unknown) {
  const fail = (reason: string) => Object.freeze({ ok: false as const, reason })
  if (input === undefined) return fail('explicit_credential_selection_required')
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) return fail('invalid_read_request')
  const fields = Object.getOwnPropertyDescriptors(input)
  const keys = Reflect.ownKeys(fields)
  // Inspect descriptors, never invoke request getters or traverse foreign DTOs.
  if (keys.some(key => typeof key !== 'string' || !('value' in fields[key]!))) return fail('invalid_read_request')
  if (keys.length < 4 || keys.length > 5 || keys.some(key => !(typeof key === 'string' && Object.hasOwn(requestSchema.shape, key)))) {
    return fail('unsupported_read_request')
  }
  const values = Object.entries(fields).filter(([key]) => key !== 'proposedContext').map(([, field]) => field.value)
  if (values.some(value => typeof value !== 'string' || value.length > 1_024)) return fail('invalid_read_request')
  // Nested accessors, cycles, symbols, prototypes and oversized data are refused
  // before Zod. Parse the inspected snapshot, not the caller's mutable object.
  const snapshot = requestSnapshot(input)
  if (snapshot === null) return fail('invalid_read_request')
  const parsed = requestSchema.safeParse(snapshot)
  if (!parsed.success) return fail('unsupported_read_request')
  const request = parsed.data
  const party = reise.party
  // These are work bounds, not new domain limits. No truncation on overflow.
  if (!party || party.length === 0 || party.length > 32) return fail('traveller_context_unavailable')
  if (!distinct(party.map(t => t.clientRef))) return fail('ambiguous_traveller_reference')
  const traveller = party.find(t => t.clientRef === request.travellerClientRef)
  if (!traveller) return fail('traveller_not_in_trip')
  if (traveller.documents.length > 32 || traveller.citizenships.length > 32) return fail('credential_context_bound')
  if (!distinct(traveller.documents.map(d => d.clientRef)) || !distinct(traveller.citizenships.map(c => c.clientRef))) {
    return fail('ambiguous_credential_reference')
  }
  if (!distinct(traveller.citizenships.map(c => c.countryCode))) return fail('ambiguous_citizenship')
  if (!traveller.citizenships.some(c => c.countryCode === 'CH')) return fail('ch_citizenship_required')
  const options = credentialOptionsAus(traveller).filter(o => o.optionRef === request.credentialOptionRef)
  if (options.length !== 1 || !options[0]!.document) return fail('selected_credential_not_in_traveller')
  const document = options[0]!.document!
  if (document.documentType !== 'passport' || document.issuingCountryCode !== 'CH'
    || document.citizenshipCountryCode !== 'CH') return fail('linked_ch_passport_required')
  if (!date(reise.startDate) || !date(reise.endDate) || reise.endDate < reise.startDate) return fail('explicit_travel_dates_required')
  if (!reise.stages.length || reise.stages.length > 64 || reise.stages.some(s => s.countryCode !== 'DE')) {
    return fail('single_de_destination_required')
  }
  const proposed = request.proposedContext
  if (!proposed) return fail('explicit_proposed_context_required')
  if (proposed.tripId !== reise.id || proposed.tripRevision !== reise.revision) return fail('trip_context_mismatch')
  const selected = traveller.documents.find(d => d.clientRef === document.clientRef)!
  if (proposed.documentClientRef !== selected.clientRef
    || proposed.citizenshipClientRef !== selected.citizenshipClientRef) return fail('selected_context_mismatch')
  if (proposed.passportClass !== 'ordinary') return fail('ordinary_passport_declaration_required')
  if (proposed.purpose !== 'tourism') return fail('explicit_tourism_required')
  if (!proposed.travelDates || !date(proposed.travelDates.startDate) || !date(proposed.travelDates.endDate)
    || proposed.travelDates.startDate !== reise.startDate || proposed.travelDates.endDate !== reise.endDate) {
    return fail('declared_dates_mismatch')
  }
  const route = proposed.route
  if (!route || route.completeness !== 'complete' || route.topology !== 'direct'
    || route.originCountryCode !== 'CH' || route.destinationCountryCode !== 'DE'
    || route.transitCountryCodes.length !== 0) return fail('complete_direct_route_declaration_required')
  if (reise.stages.some(s => (s.arrivalDate !== null && (!date(s.arrivalDate)
    || s.arrivalDate < reise.startDate! || s.arrivalDate > reise.endDate!))
    || (s.departureDate !== null && (!date(s.departureDate)
      || s.departureDate < (s.arrivalDate ?? reise.startDate!) || s.departureDate > reise.endDate!)))) {
    return fail('contradictory_stage_dates')
  }
  // The attestation never overwrites structured Trip route data. In this narrow
  // pilot any represented transport must be exactly one direct CH→DE flight.
  // Missing/extra/non-flight transport remains unsupported, never visa-required.
  const transport = [...reise.days.flatMap(d => d.items), ...reise.ohneTag]
    .filter(i => ['flight', 'transfer', 'rental_car'].includes(i.kind))
  if (transport.length > 0) {
    const facts = routeFactsAusGraph(reise)
    const segment = facts.segments[0]
    if (transport.length !== 1 || transport[0]!.kind !== 'flight'
      || facts.quelle !== 'flight_itinerary' || !facts.chronologieBewiesen
      || facts.legs.length !== 1 || facts.segments.length !== 1 || facts.connections.length !== 0
      || facts.transitCountryCodes.length !== 0 || !segment
      || segment.surfaceFromAirportCode != null
      || segment.origin.countryCode !== 'CH' || segment.destination.countryCode !== 'DE'
      || segment.departureDate !== reise.startDate || segment.arrivalDate !== reise.startDate
      || (transport[0]!.startsOn !== null && transport[0]!.startsOn !== reise.startDate)
      || (transport[0]!.endsOn !== null && transport[0]!.endsOn !== reise.startDate)) {
      return fail('trip_route_conflict_or_unsupported')
    }
  }
  Object.freeze(proposed.travelDates)
  Object.freeze(route.transitCountryCodes)
  Object.freeze(route)
  return Object.freeze({ ok: true as const, status: 'proposed_context_only' as const,
    officialQualification: false as const, persistedContext: false as const,
    proposedContext: Object.freeze(proposed) })
}
