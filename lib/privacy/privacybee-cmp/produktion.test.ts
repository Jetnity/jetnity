import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { readCmpController, resetSharedCmpController } from '@/lib/privacy/privacybee-cmp/abo'
import { productionPolicy } from '@/lib/privacy/privacybee-cmp/bundle'
import {
  createProductionFacade,
  nextParentGeneration,
  PARENT_GENERATION_LIMIT,
  releaseProductionExecution,
  requestProductionExecution,
  type ProductionCapability,
  type ProductionSources,
} from '@/lib/privacy/privacybee-cmp/produktion'
import {
  CMP_CHILD_ORIGIN,
  CMP_PARENT_ORIGIN,
  DISCOVERCARS_ARTIFACT_SHA256,
  DISCOVERCARS_EMBED_PATH,
  PRODUCTION_POLICY_TABLE,
  TWELVEGO_ARTIFACT_SHA256,
  TWELVEGO_EMBED_PATH,
  validateProductionPolicy,
  type ProductionPolicyRecord,
} from '@/lib/privacy/privacybee-cmp/produktionspolitik'
import { CMP_RELEASE_AUTHORIZED } from '@/lib/privacy/privacybee-cmp/vertrag'
import type { WidgetConsentProviderId } from '@/lib/privacy/widget-consent/vertrag'

function werte(analytics = true, ads = true) {
  return {
    SECURITY_STORAGE: true,
    FUNCTIONALITY_STORAGE: true,
    ANALYTICS_STORAGE: analytics,
    AD_STORAGE: ads,
    AD_USER_DATA: ads,
    AD_PERSONALIZATION: ads,
    PERSONALIZATION_STORAGE: ads,
  }
}

function api(values: ReturnType<typeof werte>) {
  return {
    getAllConsents: () => values,
    getConsent: (name: string) => values[name as keyof typeof values],
    hasExplicitConsent: () => true,
  }
}

function record(providerId: WidgetConsentProviderId, policyId: string, requiredOptional: readonly string[], patch: Partial<ProductionPolicyRecord> = {}) {
  const discovercars = providerId === 'discovercars'
  return validateProductionPolicy({
    providerId,
    policyId,
    requiredOptional,
    processingPolicyRevision: 'processing-test',
    disclosureRevision: 'disclosure-test',
    artifactSha256: discovercars ? DISCOVERCARS_ARTIFACT_SHA256 : TWELVEGO_ARTIFACT_SHA256,
    parentOrigin: CMP_PARENT_ORIGIN,
    childOrigin: CMP_CHILD_ORIGIN,
    embedPath: discovercars ? DISCOVERCARS_EMBED_PATH : TWELVEGO_EMBED_PATH,
    protocolRevision: 1,
    networkPolicyRevision: 'network-test',
    hostSelectionCommit: 'host-test',
    sandbox: 'allow-scripts',
    ...patch,
  })
}

function sources(policy: ProductionPolicyRecord | null, values = werte(), patch: Partial<ProductionSources> = {}): ProductionSources {
  return {
    policyFor: (providerId) => providerId === policy?.providerId ? policy : null,
    release: true,
    killSwitch: undefined,
    hostname: 'jetnity.com',
    api: api(values),
    ...patch,
  }
}

describe('produktive capability naht', () => {
  test('die gelieferte Tabelle und der Release bleiben zu', () => {
    assert.equal(CMP_RELEASE_AUTHORIZED, false)
    assert.equal(PRODUCTION_POLICY_TABLE.discovercars, null)
    assert.equal(PRODUCTION_POLICY_TABLE.twelvego, null)
    assert.equal(productionPolicy('discovercars'), null)
    assert.equal(productionPolicy('twelvego'), null)
    assert.equal(requestProductionExecution('discovercars', 'scope-alpha'), null)
    assert.equal(nextParentGeneration(0), 1)
    assert.equal(nextParentGeneration(PARENT_GENERATION_LIMIT - 1), PARENT_GENERATION_LIMIT)
    assert.equal(nextParentGeneration(PARENT_GENERATION_LIMIT), null)
  })

  test('unvollständige oder falsche Pins bleiben null', () => {
    assert.equal(record('discovercars', 'policy-a', ['SECURITY_STORAGE']), null)
    assert.equal(record('discovercars', 'policy-a', []), null)
    assert.equal(record('discovercars', 'policy-a', ['ANALYTICS_STORAGE'], { artifactSha256: 'deadbeef' }), null)
    assert.equal(record('discovercars', 'policy-a', ['ANALYTICS_STORAGE'], { sandbox: 'allow-scripts allow-popups' }), null)
    assert.equal(record('twelvego', 'policy-b', ['ANALYTICS_STORAGE'], { embedPath: DISCOVERCARS_EMBED_PATH }), null)
  })

  test('dieselbe Fassade verweigert ohne Release oder Policy und autorisiert ein synthetisches Bündel nur einmal', () => {
    resetSharedCmpController()
    const values = werte()
    const policy = record('discovercars', 'policy-a', ['ANALYTICS_STORAGE'])
    assert.ok(policy)
    const denied = createProductionFacade(() => sources(policy, values, { release: false }))
    assert.equal(denied.requestProductionExecution('discovercars', 'scope-alpha'), null)
    const unlicensed = createProductionFacade(() => sources(policy, values, { hostname: 'widgets.jetnity.com' }))
    assert.equal(unlicensed.requestProductionExecution('discovercars', 'scope-alpha'), null)
    const killed = createProductionFacade(() => sources(policy, values, { killSwitch: 'aus' }))
    assert.equal(killed.requestProductionExecution('discovercars', 'scope-alpha'), null)

    resetSharedCmpController()
    const facade = createProductionFacade(() => sources(policy, values))
    const capability = facade.requestProductionExecution('discovercars', 'scope-alpha')
    assert.ok(capability)
    assert.equal(capability.src, `${CMP_CHILD_ORIGIN}${DISCOVERCARS_EMBED_PATH}`)
    assert.equal(capability.sandbox, 'allow-scripts')
    assert.equal(facade.checkProductionExecution(capability), true)
    assert.equal(facade.requestProductionExecution('discovercars', 'scope-alpha'), null)
    assert.equal(facade.requestProductionExecution('twelvego', 'scope-alpha'), null)
    const forged = {
      providerId: 'discovercars' as const,
      src: capability.src,
      childOrigin: capability.childOrigin,
      sandbox: capability.sandbox,
      protocolRevision: 1 as const,
    }
    assert.equal(facade.checkProductionExecution(forged), false)

    values.AD_STORAGE = false
    assert.equal(facade.checkProductionExecution(capability), true)
    const grant = facade.consumeProductionGrant(capability)
    assert.deepEqual(grant, {
      policyId: 'policy-a',
      artifactSha256: DISCOVERCARS_ARTIFACT_SHA256,
      parentGeneration: 1,
    })
    assert.equal(facade.checkProductionExecution(capability), true)
    assert.equal(facade.consumeProductionGrant(capability), null)

    values.ANALYTICS_STORAGE = false
    assert.equal(facade.checkProductionExecution(capability), false)
    assert.equal(readCmpController().live, null)
  })

  test('gleiche Kategorien mit anderer Policy-ID und ein altes Release lassen den neuen Kontext stehen', () => {
    resetSharedCmpController()
    const values = werte()
    const firstPolicy = record('discovercars', 'policy-a', ['ANALYTICS_STORAGE'])
    const secondPolicy = record('discovercars', 'policy-b', ['ANALYTICS_STORAGE'])
    assert.ok(firstPolicy && secondPolicy)
    let selected = firstPolicy
    const facade = createProductionFacade(() => sources(selected, values))
    const first = facade.requestProductionExecution('discovercars', 'scope-beta')
    assert.ok(first)
    assert.equal(readCmpController().slots.discovercars.consent.scopeKey, 'scope-beta')
    selected = secondPolicy
    assert.equal(facade.checkProductionExecution(first), false)
    assert.equal(readCmpController().live, null)

    resetSharedCmpController()
    selected = firstPolicy
    const again = createProductionFacade(() => sources(selected, values))
    const older = again.requestProductionExecution('discovercars', 'scope-alpha')
    assert.ok(older)
    again.releaseProductionExecution(older)
    again.releaseProductionExecution(older)
    const newer = again.requestProductionExecution('discovercars', 'scope-alpha')
    assert.ok(newer)
    again.releaseProductionExecution(older)
    assert.equal(again.checkProductionExecution(newer), true)
    assert.equal(readCmpController().live?.policyId, 'policy-a')
    again.releaseProductionExecution(newer)
    assert.equal(readCmpController().live, null)
    releaseProductionExecution(older as ProductionCapability)
  })
})
