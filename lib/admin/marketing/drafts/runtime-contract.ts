import {
  parseMarketingDraftCommand, parseMarketingDraftRead, parseMarketingDraftResult,
  type MarketingDraftCommand, type MarketingDraftRead, type MarketingDraftResult, type MarketingDraftRevision,
} from './contract'

export type DraftFailure = 'invalid' | 'forbidden' | 'unauthenticated' | 'unavailable' | 'unknown'
  | 'conflict' | 'request_conflict' | 'state' | 'missing' | 'rate_limit'
export type DraftOutcome<T> = Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; code: DraftFailure }>
export type DraftApply = Extract<MarketingDraftResult, { action: 'apply' }>
export type DraftConfirm = Readonly<{ draftId: string; requestId: string; expectedVersion: string }>
export type DraftConfirmation = Readonly<{ status: 'unresolved' }>
  | Readonly<{ status: 'confirmed'; receipt: MarketingDraftRevision; current: MarketingDraftRevision }>
export type DraftPort = Readonly<{
  read(input: MarketingDraftRead): Promise<DraftOutcome<MarketingDraftResult>>
  apply(input: MarketingDraftCommand): Promise<DraftOutcome<DraftApply>>
  confirm(input: DraftConfirm): Promise<DraftOutcome<DraftConfirmation>>
}>
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const MAX = 9_223_372_036_854_775_807n
const FAILURES: readonly DraftFailure[] = ['invalid', 'forbidden', 'unauthenticated', 'unavailable', 'unknown',
  'conflict', 'request_conflict', 'state', 'missing', 'rate_limit']

export function parseDraftConfirm(value: unknown): DraftConfirm | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  try {
    const descriptors = Object.getOwnPropertyDescriptors(value)
    if (Reflect.ownKeys(descriptors).length !== 3 || !['draftId', 'requestId', 'expectedVersion'].every(key => descriptors[key]?.enumerable && Object.hasOwn(descriptors[key], 'value'))) return null
    const draftId: unknown = descriptors.draftId.value, requestId: unknown = descriptors.requestId.value,
      expectedVersion: unknown = descriptors.expectedVersion.value
    return typeof draftId === 'string' && UUID.test(draftId) && typeof requestId === 'string' && UUID.test(requestId)
      && typeof expectedVersion === 'string' && /^(0|[1-9][0-9]{0,18})$/.test(expectedVersion) && BigInt(expectedVersion) < MAX
      ? { draftId, requestId, expectedVersion } : null
  } catch { return null }
}

/** One exact version, including PostgreSQL bigint's upper edge. Never scan all history. */
export function confirmationHistory(input: DraftConfirm): MarketingDraftRead {
  const target = BigInt(input.expectedVersion) + 1n
  return { schemaVersion: 1, action: 'history', draftId: input.draftId, limit: 1,
    ...(target < MAX ? { cursor: (target + 1n).toString() } : {}) }
}

export function matchesDraftOperation(receipt: MarketingDraftRevision, input: DraftConfirm, actorId?: string): boolean {
  return receipt.draftId === input.draftId && receipt.requestId === input.requestId
    && receipt.version === (BigInt(input.expectedVersion) + 1n).toString()
    && (actorId === undefined || receipt.actorId === actorId)
}

export function matchingDraftRead(raw: unknown, input: MarketingDraftRead): MarketingDraftResult | null {
  const result = parseMarketingDraftResult(raw)
  if (!result || result.action !== input.action) return null
  if (result.action === 'get' && input.action === 'get') return !result.draft || result.draft.draftId === input.draftId ? result : null
  if (result.action === 'history' && input.action === 'history') return result.draftId === input.draftId
    && result.items.length <= input.limit && result.items.every(item => input.cursor === undefined || BigInt(item.version) < BigInt(input.cursor)) ? result : null
  if (result.action === 'list' && input.action === 'list') return result.items.length <= input.limit
    && result.items.every(item => (!input.state || item.state === input.state) && (!input.cursor || item.savedAt < input.cursor.savedAt
      || (item.savedAt === input.cursor.savedAt && item.draftId < input.cursor.draftId))) ? result : null
  return null
}

export function parseDraftConfirmation(raw: unknown, input: DraftConfirm): DraftConfirmation | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const value = raw as Record<string, unknown>
  if (value.status === 'unresolved' && Object.keys(value).length === 1) return { status: 'unresolved' }
  if (value.status !== 'confirmed' || Object.keys(value).sort().join(',') !== 'current,receipt,status') return null
  const receipt = parseMarketingDraftResult({ schemaVersion: 1, action: 'get', draft: value.receipt })
  const current = parseMarketingDraftResult({ schemaVersion: 1, action: 'get', draft: value.current })
  if (receipt?.action !== 'get' || !receipt.draft || current?.action !== 'get' || !current.draft
    || !matchesDraftOperation(receipt.draft, input) || current.draft.draftId !== input.draftId
    || BigInt(current.draft.version) < BigInt(receipt.draft.version)) return null
  if (current.draft.version === receipt.draft.version && JSON.stringify(current.draft) !== JSON.stringify(receipt.draft)) return null
  return { status: 'confirmed', receipt: receipt.draft, current: current.draft }
}

export function draftFailure(value: unknown): DraftFailure | null {
  return typeof value === 'string' && FAILURES.includes(value as DraftFailure) ? value as DraftFailure : null
}

export function draftOperation(input: MarketingDraftCommand): DraftConfirm {
  return { draftId: input.draftId, requestId: input.requestId, expectedVersion: input.expectedVersion }
}

/** Only opaque operation identity goes into a same-page URL; it grants no authority. */
export function draftRecoveryFromUrl(url: string): DraftConfirm | null {
  try {
    const params = new URL(url).searchParams
    const keys = ['campaignDraft', 'campaignRequest', 'campaignVersion']
    if (keys.some(key => params.getAll(key).length !== 1)) return null
    return parseDraftConfirm({ draftId: params.get(keys[0]), requestId: params.get(keys[1]), expectedVersion: params.get(keys[2]) })
  } catch { return null }
}
export function draftRecoveryUrl(url: string, input: DraftConfirm | null): string {
  const target = new URL(url)
  for (const key of ['campaignDraft', 'campaignRequest', 'campaignVersion']) target.searchParams.delete(key)
  if (input) {
    target.searchParams.set('campaignDraft', input.draftId)
    target.searchParams.set('campaignRequest', input.requestId)
    target.searchParams.set('campaignVersion', input.expectedVersion)
  }
  return `${target.pathname}${target.search}${target.hash}`
}

/** No permissive JSON cast is accepted at the HTTP boundary. */
export function parseDraftInput(kind: 'read' | 'apply' | 'confirm', input: unknown) {
  return kind === 'read' ? parseMarketingDraftRead(input) : kind === 'apply' ? parseMarketingDraftCommand(input) : parseDraftConfirm(input)
}
