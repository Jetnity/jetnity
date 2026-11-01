// Test-only policy module. The shipped table stays null.
// The 40-hex commit is a fixture placeholder, not hostSelectionCommit.

import type { WidgetConsentProviderId } from '@/lib/privacy/widget-consent/vertrag'
import { TWELVE_GO_POLICY_ID, TWELVE_GO_HOST_SANDBOX } from '@/lib/providers/twelve-go/widget/protokoll'

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

const FIXTURE_COMMIT = '0123456789abcdef0123456789abcdef01234567'

function fixture(providerId: WidgetConsentProviderId): ProductionPolicyRecord | null {
  const discovercars = providerId === 'discovercars'
  return validateProductionPolicy({
    providerId,
    policyId: discovercars ? 'discovercars-analytics' : TWELVE_GO_POLICY_ID,
    requiredOptional: ['ANALYTICS_STORAGE'],
    processingPolicyRevision: discovercars ? 'rev1' : 'twelvego-load-affiliate-analytics-v1',
    disclosureRevision: discovercars ? 'notice1' : 'twelvego-general-disclosure-v1',
    artifactSha256: discovercars ? DISCOVERCARS_ARTIFACT_SHA256 : TWELVEGO_ARTIFACT_SHA256,
    parentOrigin: CMP_PARENT_ORIGIN,
    childOrigin: CMP_CHILD_ORIGIN,
    embedPath: discovercars ? DISCOVERCARS_EMBED_PATH : TWELVEGO_EMBED_PATH,
    protocolRevision: 1,
    networkPolicyRevision: discovercars ? 'net1' : 'twelvego-general-network-v1',
    hostSelectionCommit: FIXTURE_COMMIT,
    sandbox: discovercars ? 'allow-scripts allow-same-origin' : TWELVE_GO_HOST_SANDBOX,
  })
}

export function readShippedProductionPolicy(providerId: WidgetConsentProviderId): ProductionPolicyRecord | null {
  const host = globalThis as { __jetnityUseFixturePolicy?: boolean }
  if (host.__jetnityUseFixturePolicy === true) return fixture(providerId)
  return readRealPolicy(providerId)
}
