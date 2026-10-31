// Source-owned production policy table. DiscoverCars stays null. The 12Go row is
// the selected record behind the false release. Known origin and artifact
// literals are not a second policy.

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

const SANDBOX_REQUIRED = ['allow-scripts', 'allow-same-origin'] as const
const SANDBOX_OPTIONAL = ['allow-forms', 'allow-popups'] as const
const SANDBOX_KNOWN = new Set<string>([...SANDBOX_REQUIRED, ...SANDBOX_OPTIONAL])
const POLICY_ID = /^[a-z0-9-]{1,64}$/
const COMMIT = /^[a-f0-9]{40}$/
const REVISION = /^[a-z0-9][a-z0-9._-]{0,63}$/
const PLACEHOLDER = /^(todo|tbd|placeholder|pending|fixme|xxx|changeme)$/i

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

const TWELVEGO_REQUIRED = Object.freeze(['ANALYTICS_STORAGE'])

/** Selected 12Go record. DiscoverCars stays null. The release constant stays false. */
const TWELVEGO_PRODUCTION_POLICY: ProductionPolicyRecord = Object.freeze({
  providerId: 'twelvego',
  policyId: 'twelvego-general-chf-20261031-r1',
  requiredOptional: TWELVEGO_REQUIRED,
  processingPolicyRevision: 'twelvego-load-affiliate-analytics-v1',
  disclosureRevision: 'twelvego-general-disclosure-v1',
  artifactSha256: TWELVEGO_ARTIFACT_SHA256,
  parentOrigin: CMP_PARENT_ORIGIN,
  childOrigin: CMP_CHILD_ORIGIN,
  embedPath: TWELVEGO_EMBED_PATH,
  protocolRevision: 1,
  networkPolicyRevision: 'twelvego-general-network-v1',
  hostSelectionCommit: 'f056b01d63ac7d61650864734a9b44eb6484989e',
  sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups',
})

export const PRODUCTION_POLICY_TABLE: {
  readonly discovercars: null
  readonly twelvego: ProductionPolicyRecord
} = Object.freeze({
  discovercars: null,
  twelvego: TWELVEGO_PRODUCTION_POLICY,
})

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function revision(value: unknown): string | null {
  const raw = text(value)
  if (!raw || !REVISION.test(raw) || PLACEHOLDER.test(raw)) return null
  return raw
}

function sandboxOf(value: unknown): string | null {
  const raw = text(value)
  if (!raw) return null
  const tokens = raw.split(/\s+/)
  if (new Set(tokens).size !== tokens.length) return null
  if (!tokens.every((token) => SANDBOX_KNOWN.has(token))) return null
  if (!SANDBOX_REQUIRED.every((token) => tokens.includes(token))) return null
  return tokens.join(' ')
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
  const processingPolicyRevision = revision(record.processingPolicyRevision)
  const disclosureRevision = revision(record.disclosureRevision)
  const networkPolicyRevision = revision(record.networkPolicyRevision)
  const hostSelectionCommit = text(record.hostSelectionCommit)
  const sandbox = sandboxOf(record.sandbox)
  if (!policyId || !POLICY_ID.test(policyId) || !requiredOptional || !processingPolicyRevision || !disclosureRevision || !networkPolicyRevision || !hostSelectionCommit || !COMMIT.test(hostSelectionCommit) || !sandbox) {
    return null
  }
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
