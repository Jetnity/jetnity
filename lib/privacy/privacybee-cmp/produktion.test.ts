import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { readCmpController, resetSharedCmpController } from '@/lib/privacy/privacybee-cmp/abo'
import { buildBootstrapSource, productionBootstrapSource, readBakedProductionGate } from '@/lib/privacy/privacybee-cmp/bootstrap'
import { productionPolicy } from '@/lib/privacy/privacybee-cmp/bundle'
import {
  checkProductionExecution,
  consumeProductionGrant,
  nextParentGeneration,
  PARENT_GENERATION_LIMIT,
  releaseProductionExecution,
  requestProductionExecution,
} from '@/lib/privacy/privacybee-cmp/produktion'
import {
  CMP_RELEASE_AUTHORIZED,
} from '@/lib/privacy/privacybee-cmp/vertrag'
import {
  PRODUCTION_POLICY_TABLE,
  validateProductionPolicy,
} from '@/lib/privacy/privacybee-cmp/produktionspolitik'
import {
  CMP_CHILD_ORIGIN,
  CMP_PARENT_ORIGIN,
  DISCOVERCARS_ARTIFACT_SHA256,
  DISCOVERCARS_EMBED_PATH,
  TWELVEGO_ARTIFACT_SHA256,
  TWELVEGO_EMBED_PATH,
} from '@/lib/privacy/privacybee-cmp/produktionspolitik'

const COMMIT = '0123456789abcdef0123456789abcdef01234567'

function basis(patch: Record<string, unknown> = {}) {
  return validateProductionPolicy({
    providerId: 'discovercars',
    policyId: 'discovercars-analytics',
    requiredOptional: ['ANALYTICS_STORAGE'],
    processingPolicyRevision: 'rev1',
    disclosureRevision: 'notice1',
    artifactSha256: DISCOVERCARS_ARTIFACT_SHA256,
    parentOrigin: CMP_PARENT_ORIGIN,
    childOrigin: CMP_CHILD_ORIGIN,
    embedPath: DISCOVERCARS_EMBED_PATH,
    protocolRevision: 1,
    networkPolicyRevision: 'net1',
    hostSelectionCommit: COMMIT,
    sandbox: 'allow-scripts allow-same-origin',
    ...patch,
  })
}

describe('produktive capability naht', () => {
  test('die gelieferte Tabelle ist wahr und ohne Gate gibt es keine Capability', () => {
    assert.equal(CMP_RELEASE_AUTHORIZED, true)
    assert.equal(PRODUCTION_POLICY_TABLE.discovercars, null)
    assert.equal(Object.isFrozen(PRODUCTION_POLICY_TABLE), true)
    assert.equal(Object.isFrozen(PRODUCTION_POLICY_TABLE.twelvego), true)
    assert.equal(Object.isFrozen(PRODUCTION_POLICY_TABLE.twelvego.requiredOptional), true)
    assert.deepEqual(PRODUCTION_POLICY_TABLE.twelvego.requiredOptional, ['ANALYTICS_STORAGE'])
    assert.equal(PRODUCTION_POLICY_TABLE.twelvego.policyId, 'twelvego-general-chf-20261031-r1')
    assert.equal(PRODUCTION_POLICY_TABLE.twelvego.hostSelectionCommit, 'f056b01d63ac7d61650864734a9b44eb6484989e')
    assert.equal(PRODUCTION_POLICY_TABLE.twelvego.artifactSha256, TWELVEGO_ARTIFACT_SHA256)
    assert.equal(PRODUCTION_POLICY_TABLE.twelvego.embedPath, TWELVEGO_EMBED_PATH)
    assert.equal(PRODUCTION_POLICY_TABLE.twelvego.sandbox, 'allow-scripts allow-same-origin allow-forms allow-popups')
    assert.equal(productionPolicy('discovercars'), null)
    assert.equal(productionPolicy('twelvego')?.policyId, 'twelvego-general-chf-20261031-r1')
    assert.equal(requestProductionExecution('discovercars', 'scope-alpha'), null)
    assert.equal(requestProductionExecution('twelvego', 'scope-alpha'), null)
    assert.equal(readCmpController().live, null)
    assert.equal(nextParentGeneration(0), 1)
    assert.equal(nextParentGeneration(PARENT_GENERATION_LIMIT - 1), PARENT_GENERATION_LIMIT)
    assert.equal(nextParentGeneration(PARENT_GENERATION_LIMIT), null)
  })

  test('Policy-ID, Commit, Revision und Sandbox sind streng gebunden', () => {
    assert.ok(basis())
    assert.equal(basis({ policyId: 'NOT A VALID / POLICY!' }), null)
    assert.equal(basis({ hostSelectionCommit: 'TODO' }), null)
    assert.equal(basis({ processingPolicyRevision: 'TODO' }), null)
    assert.equal(basis({ sandbox: 'arbitrary-invalid-token' }), null)
    assert.equal(basis({ sandbox: 'allow-scripts' }), null)
    assert.equal(basis({ sandbox: 'allow-scripts allow-same-origin allow-top-navigation' }), null)
    assert.ok(basis({ sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups' }))
    assert.equal(basis({ requiredOptional: ['SECURITY_STORAGE'] }), null)
    assert.equal(basis({ providerId: 'discovercars', embedPath: '/embed/twelvego' }), null)
  })

  test('ein gebackener Kill bleibt auch bei freigegebenem Bootstrap-Literal geschlossen', () => {
    const host = globalThis as unknown as {
      window: unknown
      location: { hostname: string }
      document: {
        addEventListener: () => void
        querySelector: () => null
        createElement: () => { setAttribute: () => void }
        head: { appendChild: () => void }
      }
      __jetnityCmp?: { scripts?: number; releaseAllowed?: boolean; killDenied?: boolean }
    }
    host.window = host
    host.location = { hostname: 'jetnity.com' }
    host.document = {
      addEventListener() {},
      querySelector() { return null },
      createElement() { return { setAttribute() {} } },
      head: { appendChild() {} },
    }
    delete host.__jetnityCmp
    eval(buildBootstrapSource({ release: true, killDenied: true }))
    const gate = readBakedProductionGate()
    assert.deepEqual(gate, { releaseAllowed: true, killDenied: true })
    const gebacken = globalThis as { __jetnityCmp?: { scripts?: number } }
    assert.equal(gebacken.__jetnityCmp?.scripts ?? 0, 0)
    assert.equal(requestProductionExecution('discovercars', 'scope-alpha'), null)
    assert.equal(requestProductionExecution('twelvego', 'scope-alpha'), null)
    assert.equal(readCmpController().live, null)
    delete host.__jetnityCmp
    eval(buildBootstrapSource({ release: true, killDenied: false }))
    assert.deepEqual(readBakedProductionGate(), { releaseAllowed: true, killDenied: false })
    assert.equal(requestProductionExecution('discovercars', 'scope-alpha'), null)
    assert.equal(readCmpController().live, null)
  })

  test('die ausgewählte 12Go-Zeile folgt dem Produktions-Bootstrap und bleibt bei explizitem false zu', () => {
    resetSharedCmpController()
    const host = globalThis as unknown as {
      window: unknown
      location: { hostname: string }
      document: {
        addEventListener: () => void
        querySelector: () => null
        createElement: () => { setAttribute: () => void; src: string; async: boolean }
        head: { appendChild: () => void }
      }
      PrivacyBee?: unknown
      __jetnityCmp?: unknown
    }
    const werte = {
      SECURITY_STORAGE: true,
      FUNCTIONALITY_STORAGE: true,
      ANALYTICS_STORAGE: true,
      AD_STORAGE: false,
      AD_USER_DATA: false,
      AD_PERSONALIZATION: false,
      PERSONALIZATION_STORAGE: false,
    }
    host.window = host
    host.location = { hostname: 'jetnity.com' }
    host.document = {
      addEventListener() {},
      querySelector() { return null },
      createElement() { return { src: '', async: false, setAttribute() {} } },
      head: { appendChild() {} },
    }
    host.PrivacyBee = {
      getAllConsents: () => werte,
      getConsent: (name: string) => werte[name as keyof typeof werte],
      hasExplicitConsent: () => true,
    }
    delete host.__jetnityCmp
    eval(buildBootstrapSource({ release: false, killDenied: false }))
    assert.equal(readBakedProductionGate()?.releaseAllowed, false)
    assert.equal(requestProductionExecution('twelvego', 'scope-alpha'), null)
    assert.equal(readCmpController().live, null)
    delete host.__jetnityCmp
    eval(productionBootstrapSource(null))
    assert.deepEqual(readBakedProductionGate(), { releaseAllowed: true, killDenied: false })
    const capability = requestProductionExecution('twelvego', 'scope-alpha')
    assert.ok(capability)
    assert.equal(capability.src, `${CMP_CHILD_ORIGIN}${TWELVEGO_EMBED_PATH}`)
    assert.equal(checkProductionExecution(capability), true)
    const grant = consumeProductionGrant(capability)
    assert.equal(grant?.policyId, 'twelvego-general-chf-20261031-r1')
    assert.equal(grant?.artifactSha256, TWELVEGO_ARTIFACT_SHA256)
    assert.ok(grant && grant.parentGeneration >= 1)
    assert.equal(consumeProductionGrant(capability), null)
    assert.equal(checkProductionExecution(capability), true)
    assert.equal(requestProductionExecution('discovercars', 'scope-alpha'), null)
    releaseProductionExecution(capability)
    assert.equal(readCmpController().live, null)
    assert.equal(requestProductionExecution('discovercars', 'scope-alpha'), null)
  })

  test('die öffentliche Fassade mit dem Testmodul beachtet Kill, Grant und Provider-Pin', () => {
    const verzeichnis = mkdtempSync(join(tmpdir(), 'cmp-fassade-'))
    const ausgabe = join(verzeichnis, 'probe.js')
    execFileSync(join(process.cwd(), 'node_modules/esbuild/bin/esbuild'), [
      join(process.cwd(), 'scripts/privacybee-cmp-widget-consent-s2/fassade-probe.ts'),
      '--bundle',
      '--platform=node',
      '--format=cjs',
      `--alias:@=${process.cwd()}`,
      `--alias:@/lib/privacy/privacybee-cmp/produktionspolitik=${join(process.cwd(), 'scripts/privacybee-cmp-widget-consent-s2/politik-mock.ts')}`,
      `--outfile=${ausgabe}`,
    ], { stdio: 'inherit' })
    const text = execFileSync(process.execPath, [ausgabe], { encoding: 'utf8' })
    assert.match(text, /probe ok/)
  })
})
