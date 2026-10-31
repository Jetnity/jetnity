// One decision algorithm. Production passes a null policy. Tests pass their own object.

import { browserHostIstLizenziert } from '@/lib/legal/privacybee-vertrag'
import { VENDOR_SCRIPT_EXECUTION_AUTHORIZED } from '@/lib/privacy/widget-consent/vertrag'
import type { WidgetConsentProviderId } from '@/lib/privacy/widget-consent/vertrag'

import { readShippedProductionPolicy } from '@/lib/privacy/privacybee-cmp/produktionspolitik'
import { CMP_CATEGORIES, CMP_OPTIONAL_CATEGORIES } from '@/lib/privacy/privacybee-cmp/vertrag'

export type ProviderIntent = 'none' | 'selected' | 'withdrawn'

export type ReviewedPolicy = {
  readonly id: string
  readonly requiredOptional: readonly string[]
}

export type BundleReason =
  | 'production_policy_unreviewed'
  | 'unknown_policy'
  | 'empty_required_categories'
  | 'necessary_only_policy'
  | 'no_provider_intent'
  | 'provider_withdrawn'
  | 'stale_generation'
  | 'cmp_snapshot_unusable'
  | 'optional_category_refused'
  | 'host_unlicensed'
  | 'local_context_allowed'

export type BundleDecision = {
  readonly localContext: boolean
  readonly productionExecute: false
  readonly reason: BundleReason
  readonly providerId: WidgetConsentProviderId
}

/** Shipped table only. Both provider rows are null until Root supplies a complete record. */
export function productionPolicy(providerId: WidgetConsentProviderId) {
  return readShippedProductionPolicy(providerId)
}

function deny(providerId: WidgetConsentProviderId, reason: BundleReason): BundleDecision {
  return { localContext: false, productionExecute: false, reason, providerId }
}

function optionalSatisfied(consents: Readonly<Record<string, boolean>>, required: readonly string[]): boolean {
  return required.every((name) => consents[name] === true)
}

/**
 * Shared gate. `policy === null` is the production registry and always denies.
 * Category truth is read from `consents`, never from a caller boolean.
 */
export function decideBundle(input: {
  policy: ReviewedPolicy | null
  providerId: WidgetConsentProviderId
  intent: ProviderIntent
  generation: number
  expectedGeneration: number
  consents: Readonly<Record<string, boolean>> | null
  snapshotUsable: boolean
  hostname: string | null | undefined
}): BundleDecision {
  void VENDOR_SCRIPT_EXECUTION_AUTHORIZED
  if (input.policy === null) return deny(input.providerId, 'production_policy_unreviewed')

  const required = input.policy.requiredOptional
  if (required.length === 0) return deny(input.providerId, 'empty_required_categories')
  const unknown = required.filter((name) => !(CMP_CATEGORIES as readonly string[]).includes(name))
  if (unknown.length > 0) return deny(input.providerId, 'unknown_policy')
  const optional = required.filter((name) => (CMP_OPTIONAL_CATEGORIES as readonly string[]).includes(name))
  if (optional.length === 0) return deny(input.providerId, 'necessary_only_policy')

  if (!browserHostIstLizenziert(input.hostname)) return deny(input.providerId, 'host_unlicensed')
  if (input.intent === 'withdrawn') return deny(input.providerId, 'provider_withdrawn')
  if (input.intent !== 'selected') return deny(input.providerId, 'no_provider_intent')
  if (input.generation !== input.expectedGeneration) return deny(input.providerId, 'stale_generation')
  if (!input.snapshotUsable || !input.consents) return deny(input.providerId, 'cmp_snapshot_unusable')
  if (input.consents.SECURITY_STORAGE !== true || input.consents.FUNCTIONALITY_STORAGE !== true) {
    return deny(input.providerId, 'cmp_snapshot_unusable')
  }
  if (!optionalSatisfied(input.consents, optional)) return deny(input.providerId, 'optional_category_refused')

  return {
    localContext: true,
    productionExecute: false,
    reason: 'local_context_allowed',
    providerId: input.providerId,
  }
}
