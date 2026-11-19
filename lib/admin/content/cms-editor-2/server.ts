import 'server-only'

import { adminHostedRuntimeTarget, isAdminHostedRuntimeEnabled } from '@/lib/admin/hosted-runtime-activation'
import { createRouteHandlerClient, createServerComponentClient } from '@/lib/supabase/server'
import type { AdminDevRuntimeDatabase } from '@/types/admin-dev-runtime'
import type { Json } from '@/types/supabase'
import type { CmsFailure, CmsPortResult } from './port'
import { cmsDuring, parseCmsHttpRequest, type CmsHttpRequest } from './request'
import { parseCmsPublished, parseCmsRead, parseCmsReceipt, parseCmsStoredConfirmation } from './responses'

export function cmsEditorRuntime(): 'development' | 'production' | 'unavailable' {
  return adminHostedRuntimeTarget()
}

function failure(code: string | undefined, signal: AbortSignal): CmsPortResult {
  if (signal.aborted) return { ok: false, code: 'timeout' }
  const known: Readonly<Record<string, CmsFailure>> = {
    '22023': 'invalid', '42501': 'forbidden', P4091: 'conflict',
    P4092: 'request_conflict', P4093: 'state', P4041: 'missing',
  }
  return { ok: false, code: code && Object.hasOwn(known, code) ? known[code] : 'unavailable' }
}

/** Uses the same request cookies as the central admission gate. Its current
 * user must agree with that gate; candidate SQL independently rechecks AAL2,
 * persisted capability, active account and authority after write lock waits. */
export async function runCmsRequest(input: CmsHttpRequest, admittedUserId: string, signal: AbortSignal): Promise<CmsPortResult> {
  if (!isAdminHostedRuntimeEnabled()) return { ok: false, code: 'unavailable' }
  const request = parseCmsHttpRequest(input)
  if (!request) return { ok: false, code: 'invalid' }
  if (signal.aborted) return { ok: false, code: 'timeout' }
  try {
    const client = await cmsDuring(async () => await createRouteHandlerClient<AdminDevRuntimeDatabase>(), signal)
    if (signal.aborted || !isAdminHostedRuntimeEnabled()) return failure(undefined, signal)
    const identity = await cmsDuring(() => client.auth.getUser(), signal)
    if (signal.aborted || !isAdminHostedRuntimeEnabled()) return failure(undefined, signal)
    if (identity.error) return { ok: false, code: identity.error.status === 401 || identity.error.name === 'AuthSessionMissingError' ? 'unauthenticated' : 'unavailable' }
    if (!identity.data.user || identity.data.user.id !== admittedUserId) return { ok: false, code: 'unauthenticated' }
    if (identity.data.user.is_anonymous) return { ok: false, code: 'forbidden' }
    if (request.operation === 'read') {
      const query = request.query
      const result = await cmsDuring(() => client.rpc('admin_cms_inspiration_read_v1', {
        p_entry_id: query.entryId, p_limit: query.limit ?? 20,
        ...(query.revision === undefined ? {} : { p_revision: query.revision }),
        ...(query.beforeRevision === undefined ? {} : { p_before_revision: query.beforeRevision }),
      }).abortSignal(signal), signal)
      if (result.error || signal.aborted) return failure(result.error?.code, signal)
      const value = parseCmsRead(result.data, query)
      return value ? { ok: true, value } : { ok: false, code: 'unavailable' }
    }
    if (request.operation === 'confirm') {
      const result = await cmsDuring(() => client.rpc('admin_cms_inspiration_confirm_v1', { p_request_id: request.requestId }).abortSignal(signal), signal)
      if (result.error || signal.aborted) return failure(result.error?.code, signal)
      const value = parseCmsStoredConfirmation(result.data, request.requestId)
      return value ? { ok: true, value } : { ok: false, code: 'unavailable' }
    }
    const command = request.command
    const payload: Json = command.action === 'save_draft'
      ? { beschreibung: command.payload.beschreibung, idea: command.payload.idea, themen: [...command.payload.themen] }
      : command.action === 'archive' ? {} : { revision: command.payload.revision }
    const result = await cmsDuring(() => client.rpc('admin_cms_inspiration_command_v1', {
      p_request_id: command.requestId, p_entry_id: command.entryId,
      p_expected_version: command.expectedVersion, p_action: command.action, p_payload: payload,
    }).abortSignal(signal), signal)
    if (result.error || signal.aborted) return failure(result.error?.code, signal)
    const value = parseCmsReceipt(result.data, command)
    return value ? { ok: true, value } : { ok: false, code: 'unavailable' }
  } catch { return failure(undefined, signal) }
}

/** Public JSON contains published editorial revisions only. The private
 * history, operation journal and actors cannot cross this decoder. */
export async function readCmsPublished(signal: AbortSignal): Promise<CmsPortResult> {
  if (!isAdminHostedRuntimeEnabled()) return { ok: false, code: 'unavailable' }
  if (signal.aborted) return { ok: false, code: 'timeout' }
  try {
    const client = await cmsDuring(async () => await createServerComponentClient<AdminDevRuntimeDatabase>(signal), signal)
    if (signal.aborted || !isAdminHostedRuntimeEnabled()) return failure(undefined, signal)
    const result = await cmsDuring(() => client.rpc('cms_inspiration_published_v2').abortSignal(signal), signal)
    if (result.error || signal.aborted) return failure(result.error?.code, signal)
    const value = parseCmsPublished(result.data)
    return value ? { ok: true, value } : { ok: false, code: 'unavailable' }
  } catch { return failure(undefined, signal) }
}
