// Browser-safe shape and transition rules. These do not confer Owner/MFA or SQL authority.
export const HUMAN_METHOD_DEV_URL = 'https://yfvbxvijcorffwxbxahl.supabase.co'
export const HUMAN_METHOD_BODY_BYTES = 8192
export const HUMAN_METHOD_STORAGE_KEY = 'jetnity:official-truth:human-method:v1'
const MAX_INT = 2_147_483_647

export type HumanAction = 'stage' | 'approve' | 'revoke'
export type HumanIntent = 'mutate' | 'confirm'
export type HumanBinding = Readonly<{
  methodId: string; revision: number; methodDigest: string; packageDigest: string
}>
export type HumanApproval = Readonly<{
  mode: 'until' | 'until_revoked'; until: string | null
}>
export type HumanSnapshot = Readonly<HumanBinding & {
  epoch: number; status: 'approved' | 'revoked'
  approvalMode: 'until' | 'until_revoked' | null; approvalUntil: string | null
}>
export type HumanRelease = Readonly<HumanBinding & {
  schema: 1; selectionId: string; targetUrl: typeof HUMAN_METHOD_DEV_URL
  predecessorRevision: number | null; expectedHead: HumanSnapshot | null
  approval: HumanApproval; packageVersion: string; packageHref: string
  scope: Readonly<{
    citizenship: 'CH'; destination: 'DE'; requirement: 'visa'
    document: 'swiss_passport'; route: 'direct_entry'; conditions: 'unconditional'
    activeFrom: string; activeUntilExclusive: string; reviewedScope: string
  }>
}>
export type HumanOperation = Readonly<{
  schema: 1; selectionId: string; action: HumanAction; operationId: string
}>
export type HumanRequest = Readonly<HumanOperation & { intent: HumanIntent }>
type HumanExpected = Readonly<{
  revision: number | null; methodDigest: string | null; packageDigest: string | null
  epoch: number; status: 'approved' | 'revoked' | null
}>
type CommandBase = Readonly<HumanBinding & { schema: 1; operationId: string }>
export type HumanCommand =
  | Readonly<CommandBase & { action: 'stage'; predecessorRevision: number | null; expected: null; approval: null }>
  | Readonly<CommandBase & { action: 'approve'; predecessorRevision: null; expected: HumanExpected; approval: HumanApproval }>
  | Readonly<CommandBase & { action: 'revoke'; predecessorRevision: null; expected: HumanExpected; approval: null }>
export type HumanReceipt =
  | Readonly<{ status: 'absent'; operationId: string }>
  | Readonly<{
    status: 'recorded'; operationId: string; action: HumanAction; command: HumanCommand
    actorId: string; recordedAt: string; before: HumanSnapshot | null; after: HumanSnapshot | null
  }>
export type HumanOutcomeCode = 'unselected' | 'target_refused' | 'selection_mismatch'
  | 'approval_elapsed' | 'invalid_receipt' | 'request_unresolved'
export type HumanOutcome = Readonly<{
  schema: 1; intent: HumanIntent; operation: HumanOperation
  status: 'recorded' | 'confirmed' | 'absent' | 'unresolved'
  recordedAt: string | null; code: HumanOutcomeCode | null
}>
export type HumanJournal = Readonly<{
  schema: 1; selectionId: string
  stage: HumanOperation | null; approve: HumanOperation | null; revoke: HumanOperation | null
}>
type RpcBinding = {
  p_operation_id: string; p_method_id: string; p_revision: number
  p_method_digest: string; p_package_digest: string
}
type RpcExpected = {
  p_expected_revision: number | null; p_expected_method_digest: string | null
  p_expected_package_digest: string | null; p_expected_epoch: number | null
  p_expected_status: 'approved' | 'revoked' | null
}
type RpcApproval = { p_approval_mode: 'until' | 'until_revoked' | null; p_approval_until: string | null }
export type HumanStageArgs = RpcBinding & { p_predecessor_revision: number | null }
export type HumanApproveArgs = RpcBinding & RpcExpected & RpcApproval
export type HumanRevokeArgs = RpcBinding & { p_expected_epoch: number }
export type HumanConfirmArgs = HumanStageArgs & RpcExpected & RpcApproval & { p_action: HumanAction }
type HumanRpcSelection = ({ action: 'stage'; args: HumanStageArgs }
  | { action: 'approve'; args: HumanApproveArgs }
  | { action: 'revoke'; args: HumanRevokeArgs }) & { confirm: HumanConfirmArgs }

function record(value: unknown, keys: readonly string[]): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) return null
  const own = Reflect.ownKeys(value)
  if (own.length !== keys.length || own.some(key => typeof key !== 'string' || !keys.includes(key))) return null
  const result: Record<string, unknown> = {}
  for (const key of keys) {
    const property = Object.getOwnPropertyDescriptor(value, key)
    if (!property || !property.enumerable || !('value' in property)) return null
    result[key] = property.value
  }
  return result
}

function freeze<const T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}

function same(value: unknown, expected: unknown): boolean {
  if (expected === null || typeof expected !== 'object') return value === expected
  const keys = Object.keys(expected)
  const actual = record(value, keys)
  if (!actual) return false
  return keys.every(key => same(actual[key], Reflect.get(expected, key)))
}

const digest = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value)
const methodId = (value: unknown): value is string => typeof value === 'string' && /^[a-z][a-z0-9_-]{1,63}$/.test(value)
const integer = (value: unknown, minimum: number, maximum = MAX_INT): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum
const selectionId = (value: unknown): value is string => typeof value === 'string' && /^hmr1_[0-9a-f]{32}$/.test(value)
const operationId = (value: unknown): value is string => typeof value === 'string' && /^maop1_[0-9a-f]{32}$/.test(value)
const action = (value: unknown): value is HumanAction => value === 'stage' || value === 'approve' || value === 'revoke'
const intent = (value: unknown): value is HumanIntent => value === 'mutate' || value === 'confirm'
const uuid = (value: unknown): value is string => typeof value === 'string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value)

function utcMilliseconds(value: unknown): value is string {
  if (typeof value !== 'string' || !/^(?!0000)[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/.test(value)) return false
  const time = Date.parse(value)
  return Number.isFinite(time) && new Date(time).toISOString() === value
}

function utcMicroseconds(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{6}Z$/.test(value)
    && utcMilliseconds(value.slice(0, 23) + 'Z')
}

function text(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.length >= 1 && value.length <= maximum
    && value.trim() === value && !/[\u0000-\u001f\u007f]/.test(value)
}

function binding(value: Record<string, unknown>): HumanBinding | null {
  if (!methodId(value.methodId) || !integer(value.revision, 1)
    || !digest(value.methodDigest) || !digest(value.packageDigest)) return null
  return { methodId: value.methodId, revision: value.revision,
    methodDigest: value.methodDigest, packageDigest: value.packageDigest }
}

function approval(value: unknown): HumanApproval | null {
  const row = record(value, ['mode', 'until'])
  if (!row || (row.mode !== 'until' && row.mode !== 'until_revoked')) return null
  if (row.mode === 'until' ? !utcMilliseconds(row.until) : row.until !== null) return null
  return { mode: row.mode, until: row.until as string | null }
}

function snapshot(value: unknown): HumanSnapshot | null {
  const row = record(value, ['methodId', 'revision', 'methodDigest', 'packageDigest', 'epoch', 'status', 'approvalMode', 'approvalUntil'])
  const tuple = row && binding(row)
  if (!row || !tuple || !integer(row.epoch, 1) || (row.status !== 'approved' && row.status !== 'revoked')) return null
  if (row.status === 'revoked') {
    if (row.approvalMode !== null || row.approvalUntil !== null) return null
  } else if (row.epoch === MAX_INT || !approval({ mode: row.approvalMode, until: row.approvalUntil })) return null
  return { ...tuple, epoch: row.epoch, status: row.status,
    approvalMode: row.approvalMode as HumanSnapshot['approvalMode'], approvalUntil: row.approvalUntil as string | null }
}

/** Parses a fixed reviewed configuration. A valid shape is never method approval. */
export function readHumanRelease(value: unknown): HumanRelease | null {
  try {
    const row = record(value, ['schema', 'selectionId', 'targetUrl', 'methodId', 'revision', 'methodDigest', 'packageDigest',
      'predecessorRevision', 'expectedHead', 'approval', 'packageVersion', 'packageHref', 'scope'])
    const tuple = row && binding(row)
    if (!row || !tuple || row.schema !== 1 || !selectionId(row.selectionId) || row.targetUrl !== HUMAN_METHOD_DEV_URL) return null
    if (tuple.revision === 1 ? row.predecessorRevision !== null : row.predecessorRevision !== tuple.revision - 1) return null
    const head = row.expectedHead === null ? null : snapshot(row.expectedHead)
    if (row.expectedHead !== null && !head) return null
    if (head === null ? tuple.revision !== 1 : head.methodId !== tuple.methodId || head.epoch > MAX_INT - 2
      || (tuple.revision !== head.revision && tuple.revision !== head.revision + 1)
      || (tuple.revision === head.revision && (tuple.methodDigest !== head.methodDigest || tuple.packageDigest !== head.packageDigest))) return null
    const selectedApproval = approval(row.approval)
    if (!selectedApproval || !text(row.packageVersion, 80) || typeof row.packageHref !== 'string'
      || !/^https:\/\/github\.com\/Jetnity\/jetnity\/blob\/[0-9a-f]{40}\/[A-Za-z0-9_./-]{1,300}$/.test(row.packageHref)
      || new URL(row.packageHref).href !== row.packageHref || row.packageHref.includes('//', 8)) return null
    const scope = record(row.scope, ['citizenship', 'destination', 'requirement', 'document', 'route', 'conditions', 'activeFrom', 'activeUntilExclusive', 'reviewedScope'])
    if (!scope || scope.citizenship !== 'CH' || scope.destination !== 'DE' || scope.requirement !== 'visa'
      || scope.document !== 'swiss_passport' || scope.route !== 'direct_entry' || scope.conditions !== 'unconditional'
      || !utcMilliseconds(scope.activeFrom) || !utcMilliseconds(scope.activeUntilExclusive) || scope.activeFrom >= scope.activeUntilExclusive
      || !text(scope.reviewedScope, 1600)) return null
    return freeze({ schema: 1, selectionId: row.selectionId, targetUrl: HUMAN_METHOD_DEV_URL, ...tuple,
      predecessorRevision: row.predecessorRevision as number | null, expectedHead: head, approval: selectedApproval,
      packageVersion: row.packageVersion, packageHref: row.packageHref, scope: {
        citizenship: 'CH', destination: 'DE', requirement: 'visa', document: 'swiss_passport', route: 'direct_entry', conditions: 'unconditional',
        activeFrom: scope.activeFrom, activeUntilExclusive: scope.activeUntilExclusive, reviewedScope: scope.reviewedScope,
      } })
  } catch { return null }
}

function operation(value: unknown): HumanOperation | null {
  const row = record(value, ['schema', 'selectionId', 'action', 'operationId'])
  return row && row.schema === 1 && selectionId(row.selectionId) && action(row.action) && operationId(row.operationId)
    ? { schema: 1, selectionId: row.selectionId, action: row.action, operationId: row.operationId } : null
}

/** The wire is deliberately canonical flat JSON: duplicate/escaped keys or extra fields refuse. */
export function readHumanRequestText(raw: string): HumanRequest | null {
  try {
    if (new TextEncoder().encode(raw).byteLength > HUMAN_METHOD_BODY_BYTES) return null
    const row = record(JSON.parse(raw), ['schema', 'selectionId', 'action', 'operationId', 'intent'])
    if (!row || !intent(row.intent)) return null
    const op = operation({ schema: row.schema, selectionId: row.selectionId, action: row.action, operationId: row.operationId })
    if (!op) return null
    const request: HumanRequest = { ...op, intent: row.intent }
    return JSON.stringify(request) === raw ? freeze(request) : null
  } catch { return null }
}

function approvedSnapshot(release: HumanRelease): HumanSnapshot {
  return { methodId: release.methodId, revision: release.revision, methodDigest: release.methodDigest,
    packageDigest: release.packageDigest, epoch: (release.expectedHead?.epoch ?? 0) + 1,
    status: 'approved', approvalMode: release.approval.mode, approvalUntil: release.approval.until }
}

/** Every authoritative command field comes from the fixed server release. */
export function buildHumanCommand(release: HumanRelease, input: HumanOperation): HumanCommand | null {
  const selected = readHumanRelease(release), op = operation(input)
  if (!selected || !op || op.selectionId !== selected.selectionId) return null
  const base: CommandBase = { schema: 1, operationId: op.operationId, methodId: selected.methodId,
    revision: selected.revision, methodDigest: selected.methodDigest, packageDigest: selected.packageDigest }
  if (op.action === 'stage') return freeze({ ...base, action: 'stage', predecessorRevision: selected.predecessorRevision, expected: null, approval: null })
  const head = op.action === 'approve' ? selected.expectedHead : approvedSnapshot(selected)
  const expected: HumanExpected = { revision: head?.revision ?? null, methodDigest: head?.methodDigest ?? null,
    packageDigest: head?.packageDigest ?? null, epoch: head?.epoch ?? 0, status: head?.status ?? null }
  return op.action === 'approve'
    ? freeze({ ...base, action: 'approve', predecessorRevision: null, expected, approval: selected.approval })
    : freeze({ ...base, action: 'revoke', predecessorRevision: null, expected, approval: null })
}

/** Exact HMT positional semantics, including nulls on the original confirmation. */
export function humanRpcArguments(command: HumanCommand): HumanRpcSelection {
  const base: RpcBinding = { p_operation_id: command.operationId, p_method_id: command.methodId,
    p_revision: command.revision, p_method_digest: command.methodDigest, p_package_digest: command.packageDigest }
  const expected: RpcExpected = { p_expected_revision: command.expected?.revision ?? null,
    p_expected_method_digest: command.expected?.methodDigest ?? null,
    p_expected_package_digest: command.expected?.packageDigest ?? null,
    p_expected_epoch: command.expected?.epoch ?? null, p_expected_status: command.expected?.status ?? null }
  const selectedApproval: RpcApproval = { p_approval_mode: command.approval?.mode ?? null,
    p_approval_until: command.approval?.until ?? null }
  const confirm: HumanConfirmArgs = { ...base, p_action: command.action,
    p_predecessor_revision: command.predecessorRevision, ...expected, ...selectedApproval }
  if (command.action === 'stage') return { action: 'stage', args: { ...base, p_predecessor_revision: command.predecessorRevision }, confirm }
  if (command.action === 'approve') return { action: 'approve', args: { ...base, ...expected, ...selectedApproval }, confirm }
  return { action: 'revoke', args: { ...base, p_expected_epoch: command.expected.epoch }, confirm }
}

/** Full immutable operation history, bound to the freshly verified actor and original command. */
export function readHumanReceipt(value: unknown, release: HumanRelease, op: HumanOperation, actorId: string): HumanReceipt | null {
  try {
    const selected = readHumanRelease(release)
    const command = selected && buildHumanCommand(selected, op)
    if (!selected || !command || !uuid(actorId)) return null
    const absent = record(value, ['status', 'operationId'])
    if (absent?.status === 'absent' && absent.operationId === op.operationId) return { status: 'absent', operationId: op.operationId }
    const row = record(value, ['status', 'operationId', 'action', 'command', 'actorId', 'recordedAt', 'before', 'after'])
    if (!row || row.status !== 'recorded' || row.operationId !== op.operationId || row.action !== op.action
      || row.actorId !== actorId || !utcMicroseconds(row.recordedAt) || !same(row.command, command)) return null
    const expectedBefore = op.action === 'revoke' ? approvedSnapshot(selected) : selected.expectedHead
    const expectedAfter = op.action === 'stage' ? selected.expectedHead : op.action === 'approve' ? approvedSnapshot(selected)
      : { ...approvedSnapshot(selected), epoch: (selected.expectedHead?.epoch ?? 0) + 2,
        status: 'revoked' as const, approvalMode: null, approvalUntil: null }
    if (!same(row.before, expectedBefore) || !same(row.after, expectedAfter)) return null
    if ((row.before !== null && !snapshot(row.before)) || (row.after !== null && !snapshot(row.after))) return null
    return freeze({ status: 'recorded', operationId: op.operationId, action: op.action, command,
      actorId, recordedAt: row.recordedAt, before: expectedBefore, after: expectedAfter })
  } catch { return null }
}

/** Public-to-the-operator summary only: no actor, cookie, token or raw SQL receipt. */
export function readHumanOutcome(value: unknown, op: HumanOperation, requested: HumanIntent): HumanOutcome | null {
  try {
    const validOperation = operation(op)
    const row = record(value, ['schema', 'intent', 'operation', 'status', 'recordedAt', 'code'])
    if (!validOperation || !intent(requested) || !row || row.schema !== 1 || row.intent !== requested || !same(row.operation, validOperation)) return null
    if (row.status === 'recorded' || row.status === 'confirmed') {
      if (row.status !== (requested === 'mutate' ? 'recorded' : 'confirmed') || !utcMicroseconds(row.recordedAt) || row.code !== null) return null
    } else if (row.status === 'absent') {
      if (requested !== 'confirm' || row.recordedAt !== null || row.code !== null) return null
    } else if (row.status === 'unresolved') {
      if (row.recordedAt !== null || typeof row.code !== 'string'
        || !['unselected', 'target_refused', 'selection_mismatch', 'approval_elapsed', 'invalid_receipt', 'request_unresolved'].includes(row.code)) return null
    } else return null
    return freeze({ schema: 1, intent: requested, operation: validOperation, status: row.status,
      recordedAt: row.recordedAt as string | null, code: row.code as HumanOutcomeCode | null })
  } catch { return null }
}

export function humanRequestHeadersAllowed(requestUrl: string, origin: string | null, contentType: string | null): boolean {
  try {
    const url = new URL(requestUrl)
    return url.protocol === 'https:' && origin !== null && origin === url.origin
      && new URL(origin).origin === origin && /^application\/json(?:;\s*charset=utf-8)?$/i.test(contentType ?? '')
  } catch { return false }
}

/** Missing storage creates an empty journal; malformed/foreign storage blocks instead of resetting. */
export function readHumanJournal(raw: string | null, selected: string): HumanJournal | null {
  try {
    if (!selectionId(selected)) return null
    if (raw === null) return freeze({ schema: 1, selectionId: selected, stage: null, approve: null, revoke: null })
    if (new TextEncoder().encode(raw).byteLength > 2048) return null
    const row = record(JSON.parse(raw), ['schema', 'selectionId', 'stage', 'approve', 'revoke'])
    if (!row || row.schema !== 1 || row.selectionId !== selected) return null
    const parsed: { stage: HumanOperation | null; approve: HumanOperation | null; revoke: HumanOperation | null } = { stage: null, approve: null, revoke: null }
    const ids = new Set<string>()
    for (const key of ['stage', 'approve', 'revoke'] as const) {
      const saved = row[key] === null ? null : operation(row[key])
      if (row[key] !== null && (!saved || saved.action !== key || saved.selectionId !== selected || ids.has(saved.operationId))) return null
      parsed[key] = saved
      if (saved) ids.add(saved.operationId)
    }
    if ((!parsed.stage && (parsed.approve || parsed.revoke)) || (!parsed.approve && parsed.revoke)) return null
    const journal: HumanJournal = { schema: 1, selectionId: selected, ...parsed }
    return JSON.stringify(journal) === raw ? freeze(journal) : null
  } catch { return null }
}

export function latestHumanOperation(journal: HumanJournal): HumanOperation | null {
  return journal.revoke ?? journal.approve ?? journal.stage
}

/** A persisted success flag is never read. Only a fresh in-memory confirmation unlocks the next action. */
export function nextHumanAction(journal: HumanJournal, confirmed: HumanOperation | null): HumanAction | null {
  const current = latestHumanOperation(journal)
  if (!current) return 'stage'
  if (!confirmed || !same(current, confirmed)) return null
  return current.action === 'stage' ? 'approve' : current.action === 'approve' ? 'revoke' : null
}

export function appendHumanOperation(journal: HumanJournal, confirmed: HumanOperation | null, selectedAction: HumanAction, id: string): HumanJournal | null {
  const retained = readHumanJournal(JSON.stringify(journal), journal.selectionId)
  if (!operationId(id) || !retained || nextHumanAction(retained, confirmed) !== selectedAction
    || [retained.stage, retained.approve, retained.revoke].some(saved => saved?.operationId === id)) return null
  return freeze({ ...retained, [selectedAction]: { schema: 1, selectionId: retained.selectionId, action: selectedAction, operationId: id } })
}

export function persistHumanJournal(storage: Pick<Storage, 'getItem' | 'setItem'>, journal: HumanJournal): boolean {
  try {
    const serialized = JSON.stringify(journal)
    if (!readHumanJournal(serialized, journal.selectionId)) return false
    storage.setItem(HUMAN_METHOD_STORAGE_KEY, serialized)
    return storage.getItem(HUMAN_METHOD_STORAGE_KEY) === serialized
  } catch { return false }
}

export function createHumanOperationId(): string {
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  return 'maop1_' + [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('')
}
