import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerComponentClient, getServerSupabaseUrl } from '@/lib/supabase/server'
import { AcceptedStoreLifetime } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/lifetime-server'
import {
  HUMAN_METHOD_DEV_URL, buildHumanCommand, humanRpcArguments, readHumanReceipt,
  type HumanApproveArgs, type HumanCommand, type HumanConfirmArgs, type HumanOperation,
  type HumanOutcome, type HumanOutcomeCode, type HumanRequest, type HumanRevokeArgs, type HumanStageArgs,
} from './human-contract'
import { getHumanRelease } from './human-release'

// Local types for the four reviewed, not-yet-applied HMT wrappers. This does
// not assert that generated or hosted schema already contains these functions.
type HumanDatabase = {
  public: {
    Tables: Record<string, never>; Views: Record<string, never>
    Enums: Record<string, never>; CompositeTypes: Record<string, never>
    Functions: {
      official_v3_method_stage_draft_v1: { Args: HumanStageArgs; Returns: unknown }
      official_v3_method_approve_v1: { Args: HumanApproveArgs; Returns: unknown }
      official_v3_method_revoke_v1: { Args: HumanRevokeArgs; Returns: unknown }
      official_v3_method_confirm_operation_v1: { Args: HumanConfirmArgs; Returns: unknown }
    }
  }
}

function selectedRpc(client: SupabaseClient<HumanDatabase>, request: HumanRequest, command: HumanCommand, signal: AbortSignal): PromiseLike<{ data: unknown; error: unknown }> {
  const selection = humanRpcArguments(command)
  if (request.intent === 'confirm') {
    return client.rpc('official_v3_method_confirm_operation_v1', selection.confirm).abortSignal(signal)
  }
  switch (selection.action) {
    case 'stage': return client.rpc('official_v3_method_stage_draft_v1', selection.args).abortSignal(signal)
    case 'approve': return client.rpc('official_v3_method_approve_v1', selection.args).abortSignal(signal)
    case 'revoke': return client.rpc('official_v3_method_revoke_v1', selection.args).abortSignal(signal)
  }
}

/** Called only after the route's fresh real Owner/AAL2 gate. No caller-selected target or command. */
export async function runHumanMethodRequest(request: HumanRequest, actorId: string, signal: AbortSignal): Promise<HumanOutcome> {
  const operation: HumanOperation = { schema: 1, selectionId: request.selectionId, action: request.action, operationId: request.operationId }
  const unresolved = (code: HumanOutcomeCode): HumanOutcome => ({ schema: 1, intent: request.intent,
    operation, status: 'unresolved', recordedAt: null, code })
  const release = getHumanRelease()
  if (!release) return unresolved('unselected')
  if (release.targetUrl !== HUMAN_METHOD_DEV_URL || getServerSupabaseUrl() !== HUMAN_METHOD_DEV_URL) return unresolved('target_refused')
  const command = buildHumanCommand(release, operation)
  if (!command) return unresolved('selection_mismatch')
  // Historical confirmations still use the original approval deadline even
  // after it has elapsed. A new expired approval cannot be submitted.
  if (request.intent === 'mutate' && command.action === 'approve' && command.approval.mode === 'until'
    && Date.parse(command.approval.until!) <= Date.now()) return unresolved('approval_elapsed')

  const lifetime = new AcceptedStoreLifetime(signal, 10_000)
  let outcome = unresolved('request_unresolved')
  try {
    lifetime.assertCurrent()
    const client = await lifetime.run(() => createServerComponentClient<HumanDatabase>(lifetime.signal))
    lifetime.assertCurrent()
    const result = await lifetime.run(() => selectedRpc(client, request, command, lifetime.signal))
    lifetime.assertCurrent()
    if (!result.error) {
      const receipt = readHumanReceipt(result.data, release, operation, actorId)
      lifetime.assertCurrent()
      if (!receipt || (receipt.status === 'absent' && request.intent !== 'confirm')) outcome = unresolved('invalid_receipt')
      else outcome = { schema: 1, intent: request.intent, operation,
        status: receipt.status === 'absent' ? 'absent' : request.intent === 'confirm' ? 'confirmed' : 'recorded',
        recordedAt: receipt.status === 'recorded' ? receipt.recordedAt : null, code: null }
    }
  } catch { outcome = unresolved('request_unresolved') }
  finally {
    // Abort is not rollback. Await the real SDK/transport work even on timeout;
    // the unchanged earlier admin gate has no newly claimed total deadline.
    try { await lifetime.settle() }
    catch { outcome = unresolved('request_unresolved') }
  }
  if (signal.aborted || lifetime.remaining() <= 0) return unresolved('request_unresolved')
  return outcome
}
