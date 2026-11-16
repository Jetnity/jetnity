import 'server-only'
import { isAdminDevRuntimeEnabled } from '@/lib/admin/dev-runtime-activation'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { AdminDevRuntimeDatabase } from '@/types/admin-dev-runtime'
import { applyDraft, confirmDraft, readDrafts, type DraftDatabase } from './operations'
import { DRAFT_PRIVATE_HEADERS, draftHttpFailure, draftRequestHeadersAllowed, readDraftBody } from './http'
import { parseDraftInput } from './runtime-contract'

/** Only called after the route's current persisted Admin/AAL2/write admission. */
export async function marketingDraftRequest(request: Request, kind: 'read' | 'apply' | 'confirm', actorId: string): Promise<Response> {
  if (!draftRequestHeadersAllowed(request)) return draftHttpFailure('invalid')
  if (!isAdminDevRuntimeEnabled()) return draftHttpFailure('unavailable')
  const input = parseDraftInput(kind, await readDraftBody(request))
  if (!input || request.signal.aborted) return draftHttpFailure('invalid')
  try {
    const client = await createRouteHandlerClient<AdminDevRuntimeDatabase>()
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(15_000)])
    const database: DraftDatabase = {
      async read(value) { return await client.rpc('admin_marketing_drafts_read_v1', { input: value }).abortSignal(signal) },
      async apply(value) { return await client.rpc('admin_marketing_drafts_apply_v1', { input: value }).abortSignal(signal) },
    }
    const result = kind === 'read' ? await readDrafts(database, input)
      : kind === 'apply' ? await applyDraft(database, input, actorId) : await confirmDraft(database, input, actorId)
    return result.ok ? Response.json(result, { headers: DRAFT_PRIVATE_HEADERS }) : draftHttpFailure(result.code)
  } catch { return draftHttpFailure('unknown') }
}
