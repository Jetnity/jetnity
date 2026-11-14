import 'server-only'
import { problemAus, type Problem } from '@/lib/api/datenbank-lesen'
import { createServerComponentClient, getServerSupabaseUrl } from '@/lib/supabase/server'
import { AcceptedStoreLifetime } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/lifetime-server'
import { HUMAN_METHOD_DEV_URL } from '../method/human-contract'
import { getHumanRelease } from '../method/human-release'
import { devGuardReceipt, readDevGuardReview, type DevGuardRequest, type DevGuardResult } from './guard-contract'

type Args = { p_operation_id: string; p_selection: string }
type GuardDatabase = { public: { Tables: Record<string, never>; Views: Record<string, never>;
  Enums: Record<string, never>; CompositeTypes: Record<string, never>; Functions: {
    official_v3_guard_review_v1: { Args: Record<string, never>; Returns: unknown }
    official_v3_guard_retire_v1: { Args: Args; Returns: unknown }
    official_v3_guard_resume_v1: { Args: Args; Returns: unknown }
    official_v3_guard_confirm_v1: { Args: Args & { p_action: string }; Returns: unknown }
  } } }
const unresolved = (): { value: null; problem: Problem } => ({ value: null,
  problem: { status: 503, message: 'Der gespeicherte Ausgang ist nicht bestätigt. Bitte den ursprünglichen Vorgang prüfen.' } })

/** Called after the current central Owner/role/AAL2 gate. The DB independently
 * enforces PG1 at every lowest mutation. No direct table or service-role use. */
export async function runDevGuardRequest(request: DevGuardRequest, signal: AbortSignal): Promise<
  { value: DevGuardResult; problem: null } | { value: null; problem: Problem }> {
  const release = getHumanRelease()
  if (release?.targetUrl !== HUMAN_METHOD_DEV_URL || getServerSupabaseUrl() !== HUMAN_METHOD_DEV_URL) return unresolved()
  const lifetime = new AcceptedStoreLifetime(signal, 10000)
  let answer: Awaited<ReturnType<typeof runDevGuardRequest>> = unresolved()
  try {
    const client = await lifetime.run(() => createServerComponentClient<GuardDatabase>(lifetime.signal))
    const result = await lifetime.run(() => {
      if (request.intent === 'review') return client.rpc('official_v3_guard_review_v1', {}).abortSignal(lifetime.signal)
      const args = { p_operation_id: request.operationId, p_selection: request.selection }
      if (request.intent === 'confirm') return client.rpc('official_v3_guard_confirm_v1', { ...args, p_action: request.action }).abortSignal(lifetime.signal)
      return request.action === 'retire_unknown' ? client.rpc('official_v3_guard_retire_v1', args).abortSignal(lifetime.signal)
        : client.rpc('official_v3_guard_resume_v1', args).abortSignal(lifetime.signal)
    })
    lifetime.assertCurrent()
    if (result.error) {
      const safe = { message: 'Der Dev-Zustand konnte nicht bestätigt werden.', code: /^\w{5}$/.test(result.error.code) ? result.error.code : null }
      answer = { value: null, problem: problemAus({ data: null, error: safe, status: result.status }, safe) }
    } else {
      const value = request.intent === 'review' ? readDevGuardReview(result.data) : devGuardReceipt(result.data, request)
      if (value) answer = { value, problem: null }
    }
  } catch { answer = unresolved() }
  finally { try { await lifetime.settle() } catch { answer = unresolved() } }
  return signal.aborted || lifetime.remaining() <= 0 ? unresolved() : answer
}
