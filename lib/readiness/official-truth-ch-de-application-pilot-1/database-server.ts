import 'server-only'
import { z } from 'zod'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Trip } from '@/types/trips'
import { declarationReferencesValid, pilotContextFingerprint, pilotGraphFingerprint, regulatoryContextSchema, type PilotDeclaration } from './context'
import { reiseLaden } from '@/lib/trips/daten'

type Rpc = { rpc(name: 'trip_regulatory_context_save_v1' | 'official_truth_application_pilot_run_v1', args: { payload: unknown }): {
  abortSignal(signal: AbortSignal): PromiseLike<{ data: unknown; error: unknown }>
} }
export async function saveDeclaration(trip: Trip, declaration: PilotDeclaration, mutationId: string, signal: AbortSignal): Promise<Trip | null> {
  signal.throwIfAborted()
  if (!declarationReferencesValid(trip, declaration)) return null
  const context = regulatoryContextSchema.parse({ version: 1, evidenceClass: 'user_attestation',
    tripId: trip.id, tripRevision: trip.revision + 1, startDate: trip.startDate, endDate: trip.endDate,
    declaration, graphFingerprint: pilotGraphFingerprint(trip) })
  const db = await createServerComponentClient() as unknown as Rpc
  signal.throwIfAborted()
  const result = await db.rpc('trip_regulatory_context_save_v1', { payload: {
    tripId: trip.id, revision: trip.revision, mutationId, context,
  } }).abortSignal(signal)
  // Cancellation does not roll back an already submitted write. Do not start
  // readback after cancellation; the caller must report an unconfirmed outcome.
  signal.throwIfAborted()
  if (result.error) return null
  const fresh = await reiseLaden(trip.id, signal)
  signal.throwIfAborted()
  const saved = fresh.zeilen?.[0]
  return !fresh.problem && saved?.revision === context.tripRevision
    && saved.lastMutationId === mutationId && JSON.stringify(saved.regulatoryContext) === JSON.stringify(context) ? saved : null
}
const grantSchema = z.object({ id: z.string().uuid(), contractId: z.string().regex(/^[a-z0-9._-]{1,128}$/),
  contractDigest: z.string().regex(/^[a-f0-9]{64}$/), expiresAt: z.string().datetime({ offset: true }) }).strict()
export type PilotGrant = z.infer<typeof grantSchema>
export async function pilotGrant(trip: Trip, grantId: string | null, signal: AbortSignal): Promise<PilotGrant | null> {
  signal.throwIfAborted()
  const db = await createServerComponentClient() as unknown as Rpc
  signal.throwIfAborted()
  const result = await db.rpc('official_truth_application_pilot_run_v1', { payload: {
    operation: grantId === null ? 'reserve' : 'recheck', tripId: trip.id, revision: trip.revision,
    contextFingerprint: pilotContextFingerprint(trip), grantId,
  } }).abortSignal(signal)
  signal.throwIfAborted()
  if (result.error) return null
  const parsed = grantSchema.safeParse(result.data)
  return parsed.success && Date.parse(parsed.data.expiresAt)>Date.now() ? parsed.data : null
}
