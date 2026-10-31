// Source-owned production policy table. Both rows stay null until Root supplies
// a complete reviewed record. Known origin and artifact literals are not a policy.

import type { WidgetConsentProviderId } from '@/lib/privacy/widget-consent/vertrag'

import { CMP_OPTIONAL_CATEGORIES } from '@/lib/privacy/privacybee-cmp/vertrag'

export const CMP_PARENT_ORIGIN = 'https://jetnity.com'
export const CMP_CHILD_ORIGIN = 'https://jetnity-widgets.vercel.app'
export const DISCOVERCARS_EMBED_PATH = '/embed/discovercars'
export const TWELVEGO_EMBED_PATH = '/embed/twelvego'
export const DISCOVERCARS_ARTIFACT_SHA256 = '5a9ea3edf4bfa5762850e0d1e6c9f5d777d860f9442fbe17bf9a76b1618cc8aa'
export const TWELVEGO_ARTIFACT_SHA256 = '3eeefcb326833997b1792f4a2bbc2b833511beddac2fd9626a2a9c07f68b369e'

const EMBED = {
  discovercars: { path: DISCOVERCARS_EMBED_PATH, artifact: DISCOVERCARS_ARTIFACT_SHA256 },
  twelvego: { path: TWELVEGO_EMBED_PATH, artifact: TWELVEGO_ARTIFACT_SHA256 },
} as const

const REJECTED_SANDBOX = ['allow-forms', 'allow-popups', 'allow-top-navigation', 'allow-modals']

export type ProductionPolicyRecord = {
  readonly providerId: WidgetConsentProviderId
  readonly policyId: string
  readonly requiredOptional: readonly string[]
  readonly processingPolicyRevision: string
  readonly disclosureRevision: string
  readonly artifactSha256: string
  readonly parentOrigin: typeof CMP_PARENT_ORIGIN
  readonly childOrigin: typeof CMP_CHILD_ORIGIN
  readonly embedPath: (typeof EMBED)[WidgetConsentProviderId]['path']
  readonly protocolRevision: 1
  readonly networkPolicyRevision: string
  readonly hostSelectionCommit: string
  readonly sandbox: string
}

/** Real rows. Null is the prepared deny. Do not fill these from fixtures or the other provider. */
export const PRODUCTION_POLICY_TABLE: Readonly<Record<WidgetConsentProviderId, null>> = Object.freeze({
  discovercars: null,
  twelvego: null,
})

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function categories(value: unknown): readonly string[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const names: string[] = []
  for (const entry of value) {
    if (typeof entry !== 'string' || names.includes(entry)) return null
    if (!(CMP_OPTIONAL_CATEGORIES as readonly string[]).includes(entry)) return null
    names.push(entry)
  }
  return Object.freeze(names)
}

export function validateProductionPolicy(input: unknown): ProductionPolicyRecord | null {
  if (!input || typeof input !== 'object') return null
  const record = input as Partial<ProductionPolicyRecord>
  if (record.providerId !== 'discovercars' && record.providerId !== 'twelvego') return null
  const pins = EMBED[record.providerId]
  const policyId = text(record.policyId)
  const requiredOptional = categories(record.requiredOptional)
  const processingPolicyRevision = text(record.processingPolicyRevision)
  const disclosureRevision = text(record.disclosureRevision)
  const networkPolicyRevision = text(record.networkPolicyRevision)
  const hostSelectionCommit = text(record.hostSelectionCommit)
  const sandbox = text(record.sandbox)
  if (!policyId || !requiredOptional || !processingPolicyRevision || !disclosureRevision || !networkPolicyRevision || !hostSelectionCommit || !sandbox) {
    return null
  }
  if (REJECTED_SANDBOX.some((token) => sandbox.includes(token))) return null
  if (record.parentOrigin !== CMP_PARENT_ORIGIN || record.childOrigin !== CMP_CHILD_ORIGIN) return null
  if (record.embedPath !== pins.path || record.artifactSha256 !== pins.artifact) return null
  if (record.protocolRevision !== 1) return null
  return Object.freeze({
    providerId: record.providerId,
    policyId,
    requiredOptional,
    processingPolicyRevision,
    disclosureRevision,
    artifactSha256: pins.artifact,
    parentOrigin: CMP_PARENT_ORIGIN,
    childOrigin: CMP_CHILD_ORIGIN,
    embedPath: pins.path,
    protocolRevision: 1,
    networkPolicyRevision,
    hostSelectionCommit,
    sandbox,
  })
}

export function readShippedProductionPolicy(providerId: WidgetConsentProviderId): ProductionPolicyRecord | null {
  return validateProductionPolicy(PRODUCTION_POLICY_TABLE[providerId])
}
