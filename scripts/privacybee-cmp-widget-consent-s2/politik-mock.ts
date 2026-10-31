// Test-only module mock. The shipped table stays null. The harness and the
// offline probe opt in with __jetnityUseFixturePolicy. Production bundles do not import this file.

import type { WidgetConsentProviderId } from '@/lib/privacy/widget-consent/vertrag'

import {
  CMP_CHILD_ORIGIN,
  CMP_PARENT_ORIGIN,
  DISCOVERCARS_ARTIFACT_SHA256,
  DISCOVERCARS_EMBED_PATH,
  PRODUCTION_POLICY_TABLE,
  TWELVEGO_ARTIFACT_SHA256,
  TWELVEGO_EMBED_PATH,
  readShippedProductionPolicy as readRealPolicy,
  validateProductionPolicy,
  type ProductionPolicyRecord,
} from '../../lib/privacy/privacybee-cmp/produktionspolitik.ts'

export {
  CMP_CHILD_ORIGIN,
  CMP_PARENT_ORIGIN,
  DISCOVERCARS_ARTIFACT_SHA256,
  DISCOVERCARS_EMBED_PATH,
  PRODUCTION_POLICY_TABLE,
  TWELVEGO_ARTIFACT_SHA256,
  TWELVEGO_EMBED_PATH,
  validateProductionPolicy,
}

const COMMIT = '0123456789abcdef0123456789abcdef01234567'

function fixture(providerId: WidgetConsentProviderId): ProductionPolicyRecord | null {
  const discovercars = providerId === 'discovercars'
  return validateProductionPolicy({
    providerId,
    policyId: discovercars ? 'discovercars-analytics' : 'twelvego-analytics',
    requiredOptional: ['ANALYTICS_STORAGE'],
    processingPolicyRevision: 'rev1',
    disclosureRevision: 'notice1',
    artifactSha256: discovercars ? DISCOVERCARS_ARTIFACT_SHA256 : TWELVEGO_ARTIFACT_SHA256,
    parentOrigin: CMP_PARENT_ORIGIN,
    childOrigin: CMP_CHILD_ORIGIN,
    embedPath: discovercars ? DISCOVERCARS_EMBED_PATH : TWELVEGO_EMBED_PATH,
    protocolRevision: 1,
    networkPolicyRevision: 'net1',
    hostSelectionCommit: COMMIT,
    sandbox: 'allow-scripts allow-same-origin',
  })
}

export function readShippedProductionPolicy(providerId: WidgetConsentProviderId): ProductionPolicyRecord | null {
  const host = globalThis as { __jetnityPolicyOverride?: unknown; __jetnityUseFixturePolicy?: boolean }
  if (host.__jetnityPolicyOverride !== undefined) {
    return validateProductionPolicy(host.__jetnityPolicyOverride)
  }
  if (host.__jetnityUseFixturePolicy === true) return fixture(providerId)
  return readRealPolicy(providerId)
}
