// Current CMP snapshot, per-provider intent, and one live local context.

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

export type LiveContext = {
  readonly providerId: WidgetConsentProviderId
  readonly generation: number
  readonly requiredOptional: readonly string[]
}

export type ProviderSlot = {
  readonly consent: WidgetConsentState
  readonly intent: ProviderIntent
}

export type CmpControllerState = {
  readonly phase: BridgePhase
  readonly read: CmpRead
  readonly revision: number
  readonly slots: Readonly<Record<WidgetConsentProviderId, ProviderSlot>>
  readonly live: LiveContext | null
}

function slot(providerId: WidgetConsentProviderId, scopeKey = 'scope-alpha'): ProviderSlot {
  return { consent: createWidgetConsentState(providerId, scopeKey), intent: 'none' }
}

export function createController(): CmpControllerState {
  return {
    phase: 'missing',
    read: { status: 'unusable', reason: 'missing_api' },
    revision: 0,
    slots: { discovercars: slot('discovercars'), twelvego: slot('twelvego') },
    live: null,
  }
}

function clearLive(state: CmpControllerState, providerId?: WidgetConsentProviderId): CmpControllerState {
  if (!state.live) return state
  if (providerId && state.live.providerId !== providerId) return state
  return { ...state, live: null }
}

export function ingestApi(state: CmpControllerState, api: unknown): CmpControllerState {
  let read: CmpRead
  try {
    read = readCmpApi(api)
  } catch {
    read = { status: 'unusable', reason: 'malformed' }
  }
  const phase = phaseFromRead(read, false)
  const previous = state.read.status === 'explicit' ? state.read.consents : null
  const nextConsents = read.status === 'explicit' ? read.consents : null
  let changed = phase !== state.phase || read.status !== state.read.status
  if (previous && nextConsents) {
    for (const key of Object.keys(nextConsents)) {
      if (previous[key as keyof typeof previous] !== nextConsents[key as keyof typeof nextConsents]) changed = true
    }
  }
  let next: CmpControllerState = {
    ...state,
    phase,
    read,
    revision: changed ? state.revision + 1 : state.revision,
  }
  if (!state.live) return next
  const required = state.live.requiredOptional
  const lost =
    read.status !== 'explicit' ||
    required.some((name) => nextConsents?.[name as keyof typeof nextConsents] !== true)
  if (lost) next = clearLive(next, state.live.providerId)
  return next
}

export function dispatchChoice(
  state: CmpControllerState,
  providerId: WidgetConsentProviderId,
  command: WidgetConsentCommand,
): CmpControllerState {
  const current = state.slots[providerId]
  if (command.type !== 'reset_context' && command.generation !== current.consent.generation) return state
  const applied = applyWidgetConsentCommand(current.consent, command)
  if (!applied.applied && command.type !== 'reset_context') return state
  const intent = current.intent
  let next: CmpControllerState = {
    ...state,
    slots: { ...state.slots, [providerId]: { consent: applied.state, intent } },
  }
  if (command.type === 'grant_informative') return next
  if (command.type === 'refuse' || command.type === 'withdraw') {
    next = {
      ...next,
      slots: { ...next.slots, [providerId]: { consent: applied.state, intent: 'withdrawn' } },
    }
    return clearLive(next, providerId)
  }
  if (command.type === 'reset_context') {
    if (applied.event === 'same_scope_ignored') return state
    next = {
      ...next,
      slots: {
        ...next.slots,
        [providerId]: { consent: applied.state, intent: 'none' },
      },
    }
    return clearLive(next, providerId)
  }
  return next
}

export function selectProvider(state: CmpControllerState, providerId: WidgetConsentProviderId): CmpControllerState {
  const current = state.slots[providerId]
  return {
    ...state,
    slots: { ...state.slots, [providerId]: { ...current, intent: 'selected' } },
  }
}

export function startLocalContext(
  state: CmpControllerState,
  providerId: WidgetConsentProviderId,
  policy: ReviewedPolicy | null,
  freshApi: unknown,
  hostname: string | null | undefined,
): { readonly state: CmpControllerState; readonly created: boolean; readonly decision: BundleDecision } {
  const reread = ingestApi(state, freshApi)
  const slotState = reread.slots[providerId]
  const consents = reread.read.status === 'explicit' ? reread.read.consents : null
  const decision = decideBundle({
    policy,
    providerId,
    intent: slotState.intent,
    generation: slotState.consent.generation,
    expectedGeneration: slotState.consent.generation,
    consents,
    snapshotUsable: reread.read.status === 'explicit',
    hostname,
  })
  if (!decision.localContext || decision.productionExecute !== false || reread.live) {
    return { state: reread, created: false, decision }
  }
  return {
    state: {
      ...reread,
      live: {
        providerId,
        generation: slotState.consent.generation,
        requiredOptional: policy?.requiredOptional ?? [],
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

export function acceptPending(
  state: CmpControllerState,
  pending: { readonly providerId: WidgetConsentProviderId; readonly generation: number },
): boolean {
  if (!state.live) return false
  return state.live.providerId === pending.providerId && state.live.generation === pending.generation
}
