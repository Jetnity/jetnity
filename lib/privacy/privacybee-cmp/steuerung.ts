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
import { CMP_CATEGORIES } from '@/lib/privacy/privacybee-cmp/vertrag'

const PROVIDERS = ['discovercars', 'twelvego'] as const satisfies readonly WidgetConsentProviderId[]

export type WorkToken = {
  readonly providerId: WidgetConsentProviderId
  readonly epoch: number
  readonly scopeKey: string
}

export type LiveContext = {
  readonly providerId: WidgetConsentProviderId
  readonly generation: number
  readonly epoch: number
  readonly scopeKey: string
  readonly requiredOptional: readonly string[]
}

export type ProviderSlot = {
  readonly consent: WidgetConsentState
  readonly intent: ProviderIntent
  readonly epoch: number
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
  return { consent: createWidgetConsentState(providerId, scopeKey), intent: 'none', epoch: 1 }
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

function tokenFor(providerId: WidgetConsentProviderId, current: ProviderSlot): WorkToken {
  return { providerId, epoch: current.epoch, scopeKey: current.consent.scopeKey }
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
      [providerId]: { ...current, intent, epoch: current.epoch + 1 },
    },
  }
}

function executionOutstanding(state: CmpControllerState, providerId: WidgetConsentProviderId): boolean {
  return state.live?.providerId === providerId || state.slots[providerId].intent === 'selected'
}

function snapshotBlocksExecution(read: CmpRead, live: LiveContext | null): boolean {
  if (read.status !== 'explicit') return true
  if (live && live.requiredOptional.some((name) => read.consents[name as keyof typeof read.consents] !== true)) return true
  return read.optionalSatisfied !== true
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
    if (!snapshotBlocksExecution(read, live)) continue
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

export function issueWork(state: CmpControllerState, providerId: WidgetConsentProviderId): WorkToken | null {
  const current = state.slots[providerId]
  if (current.intent !== 'selected') return null
  return tokenFor(providerId, current)
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
  const tokenFits = Boolean(
    token &&
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
  if (!decision.localContext || reread.live || !tokenFits || !policy || !token) {
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
        requiredOptional: policy.requiredOptional,
      },
    },
    created: true,
    decision,
  }
}

export function productionStart(
  state: CmpControllerState,
  providerId: WidgetConsentProviderId,
  freshApi: unknown,
  hostname: string | null | undefined,
): { readonly state: CmpControllerState; readonly created: false; readonly decision: BundleDecision } {
  const result = startLocalContext(state, providerId, productionPolicy(providerId), freshApi, hostname)
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
  if (!state.live) return false
  return state.live.providerId === pending.providerId && state.live.epoch === pending.epoch && state.live.scopeKey === pending.scopeKey
}
