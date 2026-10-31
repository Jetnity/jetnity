// Production start stays denied. The synthetic object is a test identity, not a live policy.

import { VENDOR_SCRIPT_EXECUTION_AUTHORIZED } from '@/lib/privacy/widget-consent/vertrag'
import type { WidgetConsentProviderId } from '@/lib/privacy/widget-consent/vertrag'

import { CMP_OPTIONAL_CATEGORIES } from '@/lib/privacy/privacybee-cmp/vertrag'
import type { CmpRead } from '@/lib/privacy/privacybee-cmp/schnappschuss'

export const SYNTHETIC_BUNDLE_POLICY_ID = 's2-synthetic-reviewed-bundle-v1' as const

export const SYNTHETIC_BUNDLE_POLICY = Object.freeze({
  id: SYNTHETIC_BUNDLE_POLICY_ID,
  testOnly: true as const,
  requiredOptional: Object.freeze([...CMP_OPTIONAL_CATEGORIES]),
})

export type ProviderIntent = 'none' | 'selected' | 'withdrawn'

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
  | 'synthetic_bundle_allowed'

export type BundleDecision = {
  readonly execute: boolean
  readonly productionExecute: false
  readonly reason: BundleReason
  readonly providerId: WidgetConsentProviderId
}

export function decideProductionProvider(
  providerId: WidgetConsentProviderId,
  _untrusted?: { readonly enabled?: boolean },
): { readonly execute: false; readonly productionExecute: false; readonly reason: 'production_policy_unreviewed'; readonly providerId: WidgetConsentProviderId } {
  void _untrusted?.enabled
  void VENDOR_SCRIPT_EXECUTION_AUTHORIZED
  return {
    execute: false,
    productionExecute: false,
    reason: 'production_policy_unreviewed',
    providerId,
  }
}

type PolicyShape = { readonly requiredOptional?: readonly string[] }

export function classifyUnreviewedPolicy(policy: PolicyShape): BundleReason {
  const required = policy.requiredOptional ?? []
  if (required.length === 0) return 'empty_required_categories'
  const optional = required.filter((name) => (CMP_OPTIONAL_CATEGORIES as readonly string[]).includes(name))
  if (optional.length === 0) return 'necessary_only_policy'
  return 'unknown_policy'
}

export function decideSyntheticBundle(input: {
  policy: typeof SYNTHETIC_BUNDLE_POLICY | PolicyShape
  providerId: WidgetConsentProviderId
  intent: ProviderIntent
  generation: number
  expectedGeneration: number
  cmp: CmpRead
}): BundleDecision {
  if (input.policy !== SYNTHETIC_BUNDLE_POLICY) {
    return {
      execute: false,
      productionExecute: false,
      reason: classifyUnreviewedPolicy(input.policy),
      providerId: input.providerId,
    }
  }
  if (input.intent === 'withdrawn') {
    return { execute: false, productionExecute: false, reason: 'provider_withdrawn', providerId: input.providerId }
  }
  if (input.intent !== 'selected') {
    return { execute: false, productionExecute: false, reason: 'no_provider_intent', providerId: input.providerId }
  }
  if (input.generation !== input.expectedGeneration) {
    return { execute: false, productionExecute: false, reason: 'stale_generation', providerId: input.providerId }
  }
  if (input.cmp.status !== 'explicit') {
    return { execute: false, productionExecute: false, reason: 'cmp_snapshot_unusable', providerId: input.providerId }
  }
  if (!input.cmp.optionalSatisfied) {
    return { execute: false, productionExecute: false, reason: 'optional_category_refused', providerId: input.providerId }
  }
  return {
    execute: true,
    productionExecute: false,
    reason: 'synthetic_bundle_allowed',
    providerId: input.providerId,
  }
}
