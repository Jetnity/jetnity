// In-Memory-Auswahl. Zustimmung ist informativ. Ausführung bleibt aus.

import {
  VENDOR_SCRIPT_EXECUTION_AUTHORIZED,
  WIDGET_CONSENT_PURPOSES,
  parseWidgetConsentProviderId,
  type InformativeChoice,
  type WidgetConsentProviderId,
  type WidgetConsentPurpose,
} from '@/lib/privacy/widget-consent/vertrag'

export type PurposeMap = Readonly<Record<WidgetConsentPurpose, InformativeChoice>>

export type WidgetConsentState = {
  readonly providerId: WidgetConsentProviderId
  readonly scopeKey: string
  readonly generation: number
  readonly panel: 'open' | 'closed'
  readonly informative: InformativeChoice
  readonly purposes: PurposeMap
  readonly effectiveVendorExecution: false
  readonly executionDenialReason: 'kill_switch_unverified_purpose_separation'
}

export type WidgetConsentDecisionCommand = {
  readonly type: 'refuse' | 'grant_informative' | 'withdraw' | 'close' | 'reopen'
  readonly generation: number
}

export type WidgetConsentResetCommand = {
  readonly type: 'reset_context'
  readonly generation: number
  readonly reason: 'scope_changed' | 'reorder'
  readonly scopeKey?: string
}

export type WidgetConsentCommand = WidgetConsentDecisionCommand | WidgetConsentResetCommand

export type WidgetConsentEventName =
  | 'informative_refused'
  | 'informative_granted'
  | 'withdrawn'
  | 'closed_without_grant'
  | 'reopened'
  | 'context_reset'
  | 'same_scope_ignored'
  | 'stale_ignored'

export type WidgetConsentApplyResult = {
  readonly state: WidgetConsentState
  readonly applied: boolean
  readonly stale: boolean
  readonly event: WidgetConsentEventName
}

const NICHT_ENTSCHIEDEN: PurposeMap = Object.freeze({
  functional_load: 'not_decided',
  nonessential_analytics: 'not_decided',
  advertising_marketing: 'not_decided',
})

function buendel(wahl: InformativeChoice): PurposeMap {
  return Object.freeze({
    functional_load: wahl,
    nonessential_analytics: wahl,
    advertising_marketing: wahl,
  })
}

function einfrieren(state: WidgetConsentState): WidgetConsentState {
  return Object.freeze({
    ...state,
    purposes: Object.freeze({ ...state.purposes }),
    effectiveVendorExecution: false,
    executionDenialReason: 'kill_switch_unverified_purpose_separation',
  })
}

function frisch(
  providerId: WidgetConsentProviderId,
  scopeKey: string,
  generation: number,
): WidgetConsentState {
  return einfrieren({
    providerId,
    scopeKey,
    generation,
    panel: 'open',
    informative: 'not_decided',
    purposes: NICHT_ENTSCHIEDEN,
    effectiveVendorExecution: false,
    executionDenialReason: 'kill_switch_unverified_purpose_separation',
  })
}

export function createWidgetConsentState(
  providerId: WidgetConsentProviderId,
  scopeKey: string,
): WidgetConsentState {
  if (parseWidgetConsentProviderId(providerId) !== providerId) {
    throw new Error('widget_consent_provider_rejected')
  }
  if (typeof scopeKey !== 'string' || scopeKey.trim() === '') {
    throw new Error('widget_consent_scope_required')
  }
  return frisch(providerId, scopeKey, 1)
}

function ergebnis(
  state: WidgetConsentState,
  applied: boolean,
  stale: boolean,
  event: WidgetConsentEventName,
): WidgetConsentApplyResult {
  return Object.freeze({ state, applied, stale, event })
}

export function applyWidgetConsentCommand(
  state: WidgetConsentState,
  command: WidgetConsentCommand,
): WidgetConsentApplyResult {
  if (command.generation !== state.generation) {
    return ergebnis(state, false, true, 'stale_ignored')
  }

  const generation = state.generation + 1

  switch (command.type) {
    case 'refuse':
      return ergebnis(
        einfrieren({
          ...state,
          generation,
          panel: 'closed',
          informative: 'refused',
          purposes: buendel('refused'),
        }),
        true,
        false,
        'informative_refused',
      )
    case 'grant_informative':
      return ergebnis(
        einfrieren({
          ...state,
          generation,
          panel: 'closed',
          informative: 'granted',
          purposes: buendel('granted'),
        }),
        true,
        false,
        'informative_granted',
      )
    case 'withdraw':
      return ergebnis(
        einfrieren({
          ...state,
          generation,
          panel: 'open',
          informative: 'not_decided',
          purposes: NICHT_ENTSCHIEDEN,
        }),
        true,
        false,
        'withdrawn',
      )
    case 'close':
      return ergebnis(
        einfrieren({ ...state, generation, panel: 'closed' }),
        true,
        false,
        'closed_without_grant',
      )
    case 'reopen':
      return ergebnis(
        einfrieren({ ...state, generation, panel: 'open' }),
        true,
        false,
        'reopened',
      )
    case 'reset_context':
      if (command.reason === 'scope_changed') {
        if (typeof command.scopeKey !== 'string' || command.scopeKey.trim() === '') {
          throw new Error('widget_consent_scope_required')
        }
        if (command.scopeKey === state.scopeKey) {
          return ergebnis(state, false, false, 'same_scope_ignored')
        }
        return ergebnis(
          frisch(state.providerId, command.scopeKey, generation),
          true,
          false,
          'context_reset',
        )
      }
      return ergebnis(
        frisch(state.providerId, state.scopeKey, generation),
        true,
        false,
        'context_reset',
      )
    default: {
      const unerreichbar: never = command
      return unerreichbar
    }
  }
}

export function commandForAction(
  state: WidgetConsentState,
  type: WidgetConsentDecisionCommand['type'],
): WidgetConsentDecisionCommand {
  return { type, generation: state.generation }
}

/**
 * Einzelne Zwecke lassen sich nicht schalten. Der Rückgabewert ist absichtlich
 * immer abgelehnt, auch wenn ein Aufrufer eine andere Wahl übergibt.
 */
export function individuelleZweckwahl(
  _providerId: WidgetConsentProviderId,
  purpose: WidgetConsentPurpose,
  _choice: InformativeChoice,
): { readonly ok: false; readonly reason: 'purpose_separation_unverified' } {
  const bekannt = (WIDGET_CONSENT_PURPOSES as readonly string[]).includes(purpose)
  void _providerId
  void _choice
  void bekannt
  return { ok: false, reason: 'purpose_separation_unverified' }
}

/**
 * Einziger Ausführungspfad. `untrusted` wird ignoriert, inklusive `enabled`.
 * Der Rückgabetyp ist das Literal `false`.
 */
export function vendorScriptMayExecute(
  _state: WidgetConsentState,
  _untrusted?: { readonly enabled?: boolean },
): false {
  void _state
  void _untrusted?.enabled
  return VENDOR_SCRIPT_EXECUTION_AUTHORIZED
}
