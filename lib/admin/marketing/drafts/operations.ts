import {
  parseMarketingDraftCommand, parseMarketingDraftRead, parseMarketingDraftResult,
  type MarketingDraftCommand, type MarketingDraftRead, type MarketingDraftResult,
} from './contract'
import {
  confirmationHistory, draftOperation, matchingDraftRead, matchesDraftOperation, parseDraftConfirm,
  parseDraftConfirmation, type DraftApply, type DraftConfirm, type DraftConfirmation, type DraftFailure, type DraftOutcome,
} from './runtime-contract'

export type DraftDatabase = Readonly<{
  read(input: MarketingDraftRead): Promise<{ data: unknown; error: { code?: string } | null }>
  apply(input: MarketingDraftCommand): Promise<{ data: unknown; error: { code?: string } | null }>
}>

function draftDatabaseFailure(code: string | undefined): DraftFailure {
  if (code === '42501') return 'forbidden'
  if (code === 'P4091') return 'conflict'
  if (code === 'P4092') return 'request_conflict'
  if (code === 'P4093') return 'state'
  if (code === 'P4041') return 'missing'
  if (code === '22023') return 'invalid'
  if (code === 'PGRST301' || code === 'PGRST303') return 'unauthenticated'
  // A missing/uninstalled function is unavailable; transport/backend errors are
  // uncertain and never evidence that an earlier command did not commit.
  if (code === 'PGRST202' || code === '42883' || code === 'P7905') return 'unavailable'
  return 'unknown'
}

export async function readDrafts(database: DraftDatabase, raw: unknown): Promise<DraftOutcome<MarketingDraftResult>> {
  const input = parseMarketingDraftRead(raw)
  if (!input) return { ok: false, code: 'invalid' }
  try {
    const { data, error } = await database.read(input)
    if (error) return { ok: false, code: draftDatabaseFailure(error.code) }
    const result = matchingDraftRead(data, input)
    return result ? { ok: true, value: result } : { ok: false, code: 'unavailable' }
  } catch { return { ok: false, code: 'unknown' } }
}

export async function applyDraft(database: DraftDatabase, raw: unknown, actorId: string): Promise<DraftOutcome<DraftApply>> {
  const input = parseMarketingDraftCommand(raw)
  if (!input || !parseDraftConfirm(draftOperation(input))) return { ok: false, code: 'invalid' }
  try {
    const { data, error } = await database.apply(input)
    if (error) return { ok: false, code: draftDatabaseFailure(error.code) }
    const result = parseMarketingDraftResult(data)
    if (result?.action !== 'apply' || !matchesDraftOperation(result.receipt, input, actorId)
      || result.receipt.action !== input.action) return { ok: false, code: 'unknown' }
    if ((input.action === 'create' || input.action === 'save') && JSON.stringify(result.receipt.payload) !== JSON.stringify(input.payload)) return { ok: false, code: 'unknown' }
    if (input.action === 'restore' && result.receipt.restoredFrom !== input.payload.revision) return { ok: false, code: 'unknown' }
    return { ok: true, value: result }
  } catch { return { ok: false, code: 'unknown' } }
}

export async function confirmDraft(database: DraftDatabase, raw: unknown, actorId: string): Promise<DraftOutcome<DraftConfirmation>> {
  const input: DraftConfirm | null = parseDraftConfirm(raw)
  if (!input) return { ok: false, code: 'invalid' }
  const history = await readDrafts(database, confirmationHistory(input))
  if (!history.ok) return history
  if (history.value.action !== 'history') return { ok: false, code: 'unavailable' }
  const receipt = history.value.items[0]
  if (!receipt || !matchesDraftOperation(receipt, input, actorId)) return { ok: true, value: { status: 'unresolved' } }
  // An independent fresh read is required: a replay receipt is historical, not
  // necessarily the present draft. No older snapshot overwrites current state.
  const read = await readDrafts(database, { schemaVersion: 1, action: 'get', draftId: input.draftId })
  if (!read.ok) return read
  const result = read.value.action === 'get'
    ? parseDraftConfirmation({ status: 'confirmed', receipt, current: read.value.draft }, input) : null
  return result ? { ok: true, value: result } : { ok: false, code: 'unknown' }
}
