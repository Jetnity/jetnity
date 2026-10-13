import { z } from 'zod'
import { sha256Hex } from '@/lib/readiness/digest'
import type { Trip } from '@/types/trips'

const ref = z.string().min(1).max(64).regex(/^[a-zA-Z0-9:_-]+$/)
const date = z.string().regex(/^20\d{2}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
})
/** User declarations only. No defaults, legal findings or identity inference. */
export const declarationSchema = z.object({
  travellerClientRef: ref.nullable(),
  documentClientRef: ref.nullable(),
  citizenshipClientRef: ref.nullable(),
  credentialOptionRef: z.string().min(1).max(129).nullable(),
  passportClass: z.enum(['ordinary', 'other', 'unknown']).nullable(),
  purpose: z.enum(['tourism', 'other', 'unknown']).nullable(),
  originCountryCode: z.enum(['CH', 'other', 'unknown']).nullable(),
  route: z.enum(['complete_direct_ch_de', 'other', 'unknown']).nullable(),
}).strict()
export type PilotDeclaration = z.infer<typeof declarationSchema>
export const regulatoryContextSchema = z.object({
  version: z.literal(1), evidenceClass: z.literal('user_attestation'),
  tripId: z.string().uuid(), tripRevision: z.number().int().positive().max(1_000_000_000),
  startDate: date.nullable(), endDate: date.nullable(),
  declaration: declarationSchema,
  graphFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
}).strict()
export type TripRegulatoryContext = z.infer<typeof regulatoryContextSchema>
const CONTEXT_KEY = 'official_truth_ch_de_application_v1'

export function regulatoryContextFromMetadata(metadata: unknown): TripRegulatoryContext | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null
  const parsed = regulatoryContextSchema.safeParse((metadata as Record<string, unknown>)[CONTEXT_KEY])
  return parsed.success ? parsed.data : null
}

/** Conservative: every represented traveller/credential/route change invalidates.
 * IDs and child updatedAt also detect remove/recreate with the same clientRef. */
export function pilotGraphFingerprint(trip: Trip): string {
  return sha256Hex(JSON.stringify({
    id: trip.id, origin: trip.origin, originPlaceId: trip.originPlaceId,
    startDate: trip.startDate, endDate: trip.endDate, travellers: trip.travellers,
    party: trip.party ?? [], stages: trip.stages,
    days: trip.days, ohneTag: trip.ohneTag,
  }))
}
export function pilotContextCurrent(trip: Trip): boolean {
  const parsed = regulatoryContextSchema.safeParse(trip.regulatoryContext)
  return parsed.success && parsed.data.tripId === trip.id && parsed.data.tripRevision === trip.revision
    && parsed.data.startDate === trip.startDate && parsed.data.endDate === trip.endDate
    && parsed.data.graphFingerprint === pilotGraphFingerprint(trip)
}
export function pilotContextFingerprint(trip: Trip): string {
  return sha256Hex(JSON.stringify([trip.id, trip.revision, pilotGraphFingerprint(trip), trip.regulatoryContext ?? null]))
}

/** References must be explicit, unique and belong to this freshly loaded graph.
 * Incomplete declarations may be saved; they cannot trigger evaluation. */
export function declarationReferencesValid(trip: Trip, declaration: PilotDeclaration): boolean {
  const refs = [declaration.travellerClientRef, declaration.documentClientRef,
    declaration.citizenshipClientRef, declaration.credentialOptionRef]
  if (refs.every(value => value === null)) return true
  if (refs.some(value => value === null)) return false
  const party = trip.party ?? []
  if (new Set(party.map(t => t.clientRef)).size !== party.length) return false
  const traveller = party.find(t => t.clientRef === declaration.travellerClientRef)
  if (!traveller || new Set(traveller.documents.map(d => d.clientRef)).size !== traveller.documents.length
    || new Set(traveller.citizenships.map(c => c.clientRef)).size !== traveller.citizenships.length
    || new Set(traveller.citizenships.map(c => c.countryCode)).size !== traveller.citizenships.length) return false
  const document = traveller.documents.find(d => d.clientRef === declaration.documentClientRef)
  return !!document && document.citizenshipClientRef === declaration.citizenshipClientRef
    && traveller.citizenships.some(c => c.clientRef === declaration.citizenshipClientRef)
    && declaration.credentialOptionRef === `${traveller.clientRef}:${document.clientRef}`
}
