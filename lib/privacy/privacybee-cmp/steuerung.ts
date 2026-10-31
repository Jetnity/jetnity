// Current CMP snapshot, per-provider intent, and one live local context.
// A lost category, a bad read, a refusal, or a scope change retires the epoch.
// A later regrant uses a new epoch. The old token never becomes valid again.

import {
  applyWidgetConsentCommand,
  createWidgetConsentState,
  type WidgetConsentCommand,
  type WidgetConsentState,
} from '@/lib/privacy/widget-consent/entscheidung'
import type { WidgetConsentProviderId } from '@/lib/privacy/widget-consent/vertrag'

import { decideBundle, productionPolicy, type BundleDecision, type ProviderIntent, type ReviewedPolicy } from '@/lib/privacy/privacybee-cmp/bundle'
import { readCmpApi, type CmpRead } from '@/lib/privacy/privacybee-cmp/schnappschuss'
import { phaseFromRead, type BridgePhase } from '@/lib/privacy/privacybee-cmp/bruecke'
import { CMP_CATEGORIES, CMP_OPTIONAL_CATEGORIES } from '@/lib/privacy/privacybee-cmp/vertrag'

const PROVIDERS = ['discovercars', 'twelvego'] as const satisfies readonly WidgetConsentProviderId[]

export type WorkToken = {
  readonly providerId: WidgetConsentProviderId
  readonly epoch: number
  readonly scopeKey: string
  /** Policy identity bound before this token was issued. Category lists alone are not identity. */
  readonly policyId: string
  /** The validated requirement that was already bound when this token was issued. */
  readonly requiredOptional: readonly string[]
}

export type LiveContext = {
  readonly providerId: WidgetConsentProviderId
  readonly generation: number
  readonly epoch: number
  readonly scopeKey: string
  readonly policyId: string
  readonly requiredOptional: readonly string[]
}

export type ProviderSlot = {
  readonly consent: WidgetConsentState
  readonly intent: ProviderIntent
  readonly epoch: number
  /** Null until bindReviewedPolicy stores a validated policy identity. */
  readonly policyId: string | null
  /** Categories this selection actually requires. Null means no reviewed policy is bound. */
  readonly requiredOptional: readonly string[] | null
}

export type CmpControllerState = {
  readonly phase: BridgePhase
  readonly read: CmpRead
  readonly revision: number
  readonly slots: Readonly<Record<WidgetConsentProviderId, ProviderSlot>>
  readonly live: LiveContext | null
  readonly retired: readonly WorkToken[]
}

function slot(providerId: WidgetConsentProviderId, scopeKey = 'scope-alpha'): ProviderSlot {
  return { consent: createWidgetConsentState(providerId, scopeKey), intent: 'none', epoch: 1, policyId: null, requiredOptional: null }
}

export function createController(): CmpControllerState {
  return {
    phase: 'missing',
    read: { status: 'unusable', reason: 'missing_api' },
    revision: 0,
    slots: { discovercars: slot('discovercars'), twelvego: slot('twelvego') },
    live: null,
    retired: [],
  }
}

function sameRead(left: CmpRead, right: CmpRead): boolean {
  if (left.status !== right.status) return false
  if (left.status === 'unusable' && right.status === 'unusable') return left.reason === right.reason
  if (left.status === 'explicit' && right.status === 'explicit') {
    if (left.optionalSatisfied !== right.optionalSatisfied) return false
    return CMP_CATEGORIES.every((name) => left.consents[name] === right.consents[name])
  }
  return false
}

function sameRequirement(left: readonly string[] | null | undefined, right: readonly string[] | null | undefined): boolean {
  if (!left || !right || left.length !== right.length) return false
  return left.every((name, index) => name === right[index])
}

function validatedRequirement(required: readonly string[] | null | undefined): readonly string[] | null {
  if (!required || required.length === 0) return null
  if (required.some((name) => !(CMP_CATEGORIES as readonly string[]).includes(name))) return null
  if (!required.some((name) => (CMP_OPTIONAL_CATEGORIES as readonly string[]).includes(name))) return null
  return required
}

function tokenFor(providerId: WidgetConsentProviderId, current: ProviderSlot): WorkToken {
  return {
    providerId,
    epoch: current.epoch,
    scopeKey: current.consent.scopeKey,
    policyId: current.policyId ?? '',
    requiredOptional: current.requiredOptional ?? [],
  }
}

function retire(
  state: CmpControllerState,
  providerId: WidgetConsentProviderId,
  intent: ProviderIntent,
  previous?: WorkToken,
): CmpControllerState {
  const current = state.slots[providerId]
  const token = previous ?? tokenFor(providerId, current)
  return {
    ...state,
    retired: [...state.retired, token],
    live: state.live?.providerId === providerId ? null : state.live,
    slots: {
      ...state.slots,
      [providerId]: { ...current, intent, epoch: current.epoch + 1, policyId: null, requiredOptional: null },
    },
  }
}

export function bindReviewedPolicy(
  state: CmpControllerState,
  providerId: WidgetConsentProviderId,
  policy: ReviewedPolicy | null,
): CmpControllerState {
  const current = state.slots[providerId]
  const validated = validatedRequirement(policy?.requiredOptional)
  const policyId = validated && policy && policy.id.trim() !== '' ? policy.id : null
  const required = policyId && validated ? Object.freeze([...validated]) : null
  if (required === null && current.requiredOptional === null && current.policyId === null) return state
  if (required && current.policyId === policyId && sameRequirement(current.requiredOptional, required)) return state
  return {
    ...state,
    slots: {
      ...state.slots,
      [providerId]: { ...current, policyId: required ? policyId : null, requiredOptional: required },
    },
  }
}

function executionOutstanding(state: CmpControllerState, providerId: WidgetConsentProviderId): boolean {
  return state.live?.providerId === providerId || state.slots[providerId].intent === 'selected'
}

function requiredCategoryMissing(read: CmpRead, required: readonly string[] | null): boolean {
  if (read.status !== 'explicit') return true
  if (!required || required.length === 0) return false
  return required.some((name) => {
    if (!(CMP_CATEGORIES as readonly string[]).includes(name)) return false
    return read.consents[name as keyof typeof read.consents] !== true
  })
}

export function ingestApi(state: CmpControllerState, api: unknown): CmpControllerState {
  let read: CmpRead
  try {
    read = readCmpApi(api)
  } catch {
    read = { status: 'unusable', reason: 'malformed' }
  }
  const phase = phaseFromRead(read, false)
  const changed = phase !== state.phase || !sameRead(state.read, read)
  let next: CmpControllerState = changed
    ? { ...state, phase, read, revision: state.revision + 1 }
    : state
  for (const providerId of PROVIDERS) {
    if (!executionOutstanding(next, providerId)) continue
    const live = next.live?.providerId === providerId ? next.live : null
    const required = live?.requiredOptional ?? next.slots[providerId].requiredOptional
    if (!requiredCategoryMissing(read, required)) continue
    if (!changed && next === state) {
      next = { ...state, phase, read, revision: state.revision + 1 }
    }
    next = retire(next, providerId, 'withdrawn')
  }
  return next
}

export function dispatchChoice(
  state: CmpControllerState,
  providerId: WidgetConsentProviderId,
  command: WidgetConsentCommand,
): CmpControllerState {
  const current = state.slots[providerId]
  if (command.generation !== current.consent.generation) return state
  const applied = applyWidgetConsentCommand(current.consent, command)
  if (!applied.applied) return state
  const previous = tokenFor(providerId, current)
  const next: CmpControllerState = {
    ...state,
    slots: { ...state.slots, [providerId]: { ...current, consent: applied.state } },
  }
  if (command.type === 'grant_informative' || command.type === 'reopen') return next
  if (command.type === 'refuse' || command.type === 'withdraw' || command.type === 'close') {
    return retire(next, providerId, 'withdrawn', previous)
  }
  if (command.type === 'reset_context') return retire(next, providerId, 'none', previous)
  return next
}

export function selectProvider(state: CmpControllerState, providerId: WidgetConsentProviderId): CmpControllerState {
  const current = state.slots[providerId]
  if (current.intent === 'none') {
    return { ...state, slots: { ...state.slots, [providerId]: { ...current, intent: 'selected' } } }
  }
  return retire(state, providerId, 'selected', tokenFor(providerId, current))
}

/**
 * Order: bindReviewedPolicy, then selectProvider if needed, then issueWork, then startLocalContext.
 * issueWork returns null until a validated policy is already bound. startLocalContext does not bind one.
 */
export function issueWork(state: CmpControllerState, providerId: WidgetConsentProviderId): WorkToken | null {
  const current = state.slots[providerId]
  const required = validatedRequirement(current.requiredOptional)
  if (current.intent !== 'selected' || !required || !current.policyId) return null
  return {
    providerId,
    epoch: current.epoch,
    scopeKey: current.consent.scopeKey,
    policyId: current.policyId,
    requiredOptional: required,
  }
}

/** Drops a mounted or merely issued execution. A new selection is required afterwards. */
export function releaseMountedContext(state: CmpControllerState, providerId: WidgetConsentProviderId): CmpControllerState {
  if (!executionOutstanding(state, providerId)) return state
  return retire(state, providerId, 'withdrawn')
}

export function startLocalContext(
  state: CmpControllerState,
  providerId: WidgetConsentProviderId,
  policy: ReviewedPolicy | null,
  freshApi: unknown,
  hostname: string | null | undefined,
  token?: WorkToken | null,
): { readonly state: CmpControllerState; readonly created: boolean; readonly decision: BundleDecision } {
  const reread = ingestApi(state, freshApi)
  const slotState = reread.slots[providerId]
  const bound = validatedRequirement(slotState.requiredOptional)
  const policyMatches = policy == null || (
    bound != null &&
    slotState.policyId === policy.id &&
    sameRequirement(policy.requiredOptional, bound)
  )
  const tokenFits = Boolean(
    token &&
      bound &&
      policyMatches &&
      slotState.policyId !== null &&
      token.policyId === slotState.policyId &&
      sameRequirement(token.requiredOptional, bound) &&
      token.providerId === providerId &&
      token.epoch === slotState.epoch &&
      token.scopeKey === slotState.consent.scopeKey &&
      slotState.intent === 'selected',
  )
  const consents = reread.read.status === 'explicit' ? reread.read.consents : null
  const decision = decideBundle({
    policy,
    providerId,
    intent: slotState.intent,
    generation: slotState.epoch,
    expectedGeneration: tokenFits ? slotState.epoch : slotState.epoch + 1,
    consents,
    snapshotUsable: reread.read.status === 'explicit',
    hostname,
  })
  if (!decision.localContext || reread.live || !tokenFits || !policy || !token || !bound) {
    return { state: reread, created: false, decision }
  }
  return {
    state: {
      ...reread,
      live: {
        providerId,
        generation: slotState.consent.generation,
        epoch: token.epoch,
        scopeKey: token.scopeKey,
        policyId: token.policyId,
        requiredOptional: bound,
      },
    },
    created: true,
    decision,
  }
}

/** Local denial probe. Productive callers use requestProductionExecution. This never grants. */
export function productionStart(
  state: CmpControllerState,
  providerId: WidgetConsentProviderId,
  freshApi: unknown,
  hostname: string | null | undefined,
): { readonly state: CmpControllerState; readonly created: false; readonly decision: BundleDecision } {
  void productionPolicy(providerId)
  const result = startLocalContext(state, providerId, null, freshApi, hostname)
  return { state: result.state, created: false, decision: result.decision }
}

export function acceptPending(state: CmpControllerState, pending: WorkToken): boolean {
  const retired = state.retired.some(
    (token) => token.providerId === pending.providerId && token.epoch === pending.epoch && token.scopeKey === pending.scopeKey,
  )
  if (retired) return false
  const current = state.slots[pending.providerId]
  if (!current || current.intent !== 'selected') return false
  if (current.epoch !== pending.epoch || current.consent.scopeKey !== pending.scopeKey) return false
  if (current.policyId !== pending.policyId) return false
  if (!sameRequirement(current.requiredOptional, pending.requiredOptional)) return false
  if (!state.live) return false
  if (state.live.policyId !== pending.policyId) return false
  if (!sameRequirement(state.live.requiredOptional, pending.requiredOptional)) return false
  return state.live.providerId === pending.providerId && state.live.epoch === pending.epoch && state.live.scopeKey === pending.scopeKey
}
