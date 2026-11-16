import { marketingLinkErstellen, marketingLinkEingabeLesen, type MarketingKanal, type MarketingZiel } from '../links'

/** Unapplied candidate. No RPC, browser storage or hosted persistence is implied. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const MAX_VERSION = 9_223_372_036_854_775_807n
type State = 'draft' | 'archived'
type Payload = Readonly<{ label: string; destination: MarketingZiel; channel: MarketingKanal; contentId: string | null }>
type CommandBase = Readonly<{ schemaVersion: 1; requestId: string; draftId: string; expectedVersion: string }>
export type MarketingDraftCommand = CommandBase & (
  | Readonly<{ action: 'create' | 'save'; payload: Payload }>
  | Readonly<{ action: 'archive'; payload: Readonly<Record<string, never>> }>
  | Readonly<{ action: 'restore'; payload: Readonly<{ revision: string }> }>
)
type Cursor = Readonly<{ savedAt: string; draftId: string }>
export type MarketingDraftRead = Readonly<{ schemaVersion: 1 }> & (
  | Readonly<{ action: 'get'; draftId: string }>
  | Readonly<{ action: 'list'; limit: number; state?: State; cursor?: Cursor }>
  | Readonly<{ action: 'history'; draftId: string; limit: number; cursor?: string }>
)
export type MarketingDraftRevision = Readonly<{
  draftId: string; version: string; requestId: string; actorId: string;
  action: MarketingDraftCommand['action']; state: State; payload: Payload;
  savedAt: string; restoredFrom: string | null;
}>
export type MarketingDraftResult = Readonly<{ schemaVersion: 1 }> & (
  | Readonly<{ action: 'apply'; receipt: MarketingDraftRevision; replayed: boolean }>
  | Readonly<{ action: 'get'; draft: MarketingDraftRevision | null }>
  | Readonly<{ action: 'list'; items: readonly MarketingDraftRevision[]; nextCursor: Cursor | null }>
  | Readonly<{ action: 'history'; draftId: string; items: readonly MarketingDraftRevision[]; nextCursor: string | null }>
)

function record(input: unknown): Record<string, unknown> | null {
  if (input === null || typeof input !== 'object' || Array.isArray(input)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) return null
  const descriptors = Object.getOwnPropertyDescriptors(input)
  const output: Record<string, unknown> = Object.create(null)
  for (const key of Reflect.ownKeys(descriptors)) {
    if (typeof key !== 'string') return null
    const descriptor = descriptors[key]
    if (!Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) return null
    output[key] = descriptor.value
  }
  return output
}

function keys(value: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []): boolean {
  return required.every(key => Object.hasOwn(value, key))
    && Object.keys(value).every(key => required.includes(key) || optional.includes(key))
}

function version(value: unknown, zero = false): value is string {
  return typeof value === 'string' && /^(0|[1-9][0-9]{0,18})$/.test(value)
    && (zero || value !== '0') && BigInt(value) <= MAX_VERSION
}

function timestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{6}Z$/.test(value)
    || value.startsWith('0000')) return false
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 19) === value.slice(0, 19)
}

function uuid(value: unknown): value is string { return typeof value === 'string' && UUID_V4.test(value) }

function payload(input: unknown, draftId: string): Payload | null {
  const value = record(input)
  if (!value || !keys(value, ['label', 'destination', 'channel', 'contentId'])
    || typeof value.label !== 'string' || !value.label || value.label.trim() !== value.label
    || [...value.label].length > 80 || /[\u0000-\u001f\u007f-\u009f\uD800-\uDFFF]/u.test(value.label)) return null
  const link = marketingLinkEingabeLesen({
    destination: value.destination, channel: value.channel, campaignId: `cmp-${draftId}`,
    ...(value.contentId === null ? {} : { contentId: value.contentId }),
  })
  return link ? { label: value.label, destination: link.destination, channel: link.channel, contentId: link.contentId ?? null } : null
}

function command(input: unknown): MarketingDraftCommand | null {
  const value = record(input)
  if (!value || !keys(value, ['schemaVersion', 'requestId', 'draftId', 'expectedVersion', 'action', 'payload'])
    || value.schemaVersion !== 1 || !uuid(value.requestId) || !uuid(value.draftId)
    || !version(value.expectedVersion, true)) return null
  const base: CommandBase = { schemaVersion: 1, requestId: value.requestId, draftId: value.draftId, expectedVersion: value.expectedVersion }
  if (value.action === 'create' || value.action === 'save') {
    if ((value.action === 'create') !== (value.expectedVersion === '0')) return null
    const parsed = payload(value.payload, value.draftId)
    return parsed ? { ...base, action: value.action, payload: parsed } : null
  }
  if (value.expectedVersion === '0') return null
  const parsed = record(value.payload)
  if (value.action === 'archive' && parsed && keys(parsed, [])) return { ...base, action: 'archive', payload: {} }
  return value.action === 'restore' && parsed && keys(parsed, ['revision']) && version(parsed.revision)
    && BigInt(parsed.revision) <= BigInt(value.expectedVersion)
    ? { ...base, action: 'restore', payload: { revision: parsed.revision } } : null
}

function cursor(input: unknown): Cursor | null {
  const value = record(input)
  return value && keys(value, ['savedAt', 'draftId']) && timestamp(value.savedAt) && uuid(value.draftId)
    ? { savedAt: value.savedAt, draftId: value.draftId } : null
}

function read(input: unknown): MarketingDraftRead | null {
  const value = record(input)
  if (!value || value.schemaVersion !== 1) return null
  if (value.action === 'get') return keys(value, ['schemaVersion', 'action', 'draftId']) && uuid(value.draftId)
    ? { schemaVersion: 1, action: 'get', draftId: value.draftId } : null
  const limit = Object.hasOwn(value, 'limit') ? value.limit : 20
  if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 50) return null
  if (value.action === 'history' && keys(value, ['schemaVersion', 'action', 'draftId'], ['limit', 'cursor'])
    && uuid(value.draftId) && (!Object.hasOwn(value, 'cursor') || version(value.cursor))) {
    return { schemaVersion: 1, action: 'history', draftId: value.draftId, limit,
      ...(typeof value.cursor === 'string' ? { cursor: value.cursor } : {}) }
  }
  if (value.action !== 'list' || !keys(value, ['schemaVersion', 'action'], ['limit', 'state', 'cursor'])
    || (Object.hasOwn(value, 'state') && value.state !== 'draft' && value.state !== 'archived')) return null
  const parsedCursor = Object.hasOwn(value, 'cursor') ? cursor(value.cursor) : null
  if (Object.hasOwn(value, 'cursor') && !parsedCursor) return null
  return { schemaVersion: 1, action: 'list', limit,
    ...(value.state === 'draft' || value.state === 'archived' ? { state: value.state } : {}),
    ...(parsedCursor ? { cursor: parsedCursor } : {}) }
}

function revision(input: unknown): MarketingDraftRevision | null {
  const value = record(input)
  if (!value || !keys(value, ['draftId', 'version', 'requestId', 'actorId', 'action', 'state', 'payload', 'savedAt', 'restoredFrom'])
    || !uuid(value.draftId) || !uuid(value.requestId) || !version(value.version)
    || typeof value.actorId !== 'string' || !UUID.test(value.actorId) || !timestamp(value.savedAt)
    || typeof value.action !== 'string' || !['create', 'save', 'archive', 'restore'].includes(value.action)
    || (value.state !== 'draft' && value.state !== 'archived')) return null
  if ((value.action === 'create') !== (value.version === '1')
    || (value.action === 'archive') !== (value.state === 'archived')) return null
  if (value.action === 'restore' ? !version(value.restoredFrom) || BigInt(value.restoredFrom) >= BigInt(value.version)
    : value.restoredFrom !== null) return null
  const parsed = payload(value.payload, value.draftId)
  return parsed ? { draftId: value.draftId, version: value.version, requestId: value.requestId, actorId: value.actorId,
    action: value.action as MarketingDraftCommand['action'], state: value.state, payload: parsed,
    savedAt: value.savedAt, restoredFrom: value.restoredFrom as string | null } : null
}

function revisions(input: unknown): MarketingDraftRevision[] | null {
  if (!Array.isArray(input) || Object.getPrototypeOf(input) !== Array.prototype) return null
  const own = Object.getOwnPropertyDescriptors(input as object)
  const length: unknown = own.length?.value
  if (typeof length !== 'number' || !Number.isInteger(length) || length < 0 || length > 50
    || Reflect.ownKeys(own).length !== length + 1) return null
  const result: MarketingDraftRevision[] = []
  for (let index = 0; index < length; index++) {
    const descriptor = own[String(index)]
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) return null
    const item = revision(descriptor.value)
    if (!item) return null
    result.push(item)
  }
  return result
}

function result(input: unknown): MarketingDraftResult | null {
  const value = record(input)
  if (!value || value.schemaVersion !== 1) return null
  if (value.action === 'apply' && keys(value, ['schemaVersion', 'action', 'receipt', 'replayed']) && typeof value.replayed === 'boolean') {
    const receipt = revision(value.receipt)
    return receipt ? { schemaVersion: 1, action: 'apply', receipt, replayed: value.replayed } : null
  }
  if (value.action === 'get' && keys(value, ['schemaVersion', 'action', 'draft'])) {
    const draft = value.draft === null ? null : revision(value.draft)
    return value.draft === null || draft ? { schemaVersion: 1, action: 'get', draft } : null
  }
  if (typeof value.action !== 'string' || !['list', 'history'].includes(value.action)
    || !keys(value, value.action === 'list' ? ['schemaVersion', 'action', 'items', 'nextCursor']
      : ['schemaVersion', 'action', 'draftId', 'items', 'nextCursor'])) return null
  const items = revisions(value.items)
  if (!items) return null
  if (value.action === 'history') {
    if (!uuid(value.draftId) || items.some((item, at) => item.draftId !== value.draftId
      || (at > 0 && BigInt(item.version) >= BigInt(items[at - 1]!.version)))
      || (value.nextCursor !== null && (!version(value.nextCursor) || !items.length || value.nextCursor !== items.at(-1)!.version))) return null
    return { schemaVersion: 1, action: 'history', draftId: value.draftId, items, nextCursor: value.nextCursor as string | null }
  }
  const seen = new Set<string>()
  for (let at = 0; at < items.length; at++) {
    const item = items[at]!, previous = items[at - 1]
    if (seen.has(item.draftId) || (previous && (item.savedAt > previous.savedAt
      || (item.savedAt === previous.savedAt && item.draftId >= previous.draftId)))) return null
    seen.add(item.draftId)
  }
  const nextCursor = value.nextCursor === null ? null : cursor(value.nextCursor)
  if (value.nextCursor !== null && (!nextCursor || !items.length
    || nextCursor.draftId !== items.at(-1)!.draftId || nextCursor.savedAt !== items.at(-1)!.savedAt)) return null
  return { schemaVersion: 1, action: 'list', items, nextCursor }
}

/** Strict detached data; accessors are never invoked and proxy errors fail closed. */
export function parseMarketingDraftCommand(input: unknown): MarketingDraftCommand | null {
  try { return command(input) } catch { return null }
}
export function parseMarketingDraftRead(input: unknown): MarketingDraftRead | null {
  try { return read(input) } catch { return null }
}
export function parseMarketingDraftResult(input: unknown): MarketingDraftResult | null {
  try { return result(input) } catch { return null }
}
export function marketingDraftLink(input: unknown): string | null {
  try {
    const value = revision(input)
    return value ? marketingLinkErstellen({ destination: value.payload.destination, channel: value.payload.channel,
      campaignId: `cmp-${value.draftId}`, ...(value.payload.contentId ? { contentId: value.payload.contentId } : {}) }) : null
  } catch { return null }
}
