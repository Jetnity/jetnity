import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { readCmpController } from '@/lib/privacy/privacybee-cmp/abo'
import { buildBootstrapSource, readBakedProductionGate } from '@/lib/privacy/privacybee-cmp/bootstrap'
import { productionPolicy } from '@/lib/privacy/privacybee-cmp/bundle'
import { nextParentGeneration, PARENT_GENERATION_LIMIT, requestProductionExecution } from '@/lib/privacy/privacybee-cmp/produktion'
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
  test('die gelieferte Tabelle und der Release bleiben zu, ohne Gate gibt es keine Capability', () => {
    assert.equal(CMP_RELEASE_AUTHORIZED, false)
    assert.equal(PRODUCTION_POLICY_TABLE.discovercars, null)
    assert.equal(PRODUCTION_POLICY_TABLE.twelvego, null)
    assert.equal(productionPolicy('discovercars'), null)
    assert.equal(requestProductionExecution('discovercars', 'scope-alpha'), null)
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
    delete host.__jetnityCmp
    eval(buildBootstrapSource({ release: true, killDenied: false }))
    assert.deepEqual(readBakedProductionGate(), { releaseAllowed: true, killDenied: false })
    assert.equal(requestProductionExecution('discovercars', 'scope-alpha'), null)
    assert.equal(readCmpController().live, null)
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
