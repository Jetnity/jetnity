import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { requestProductionExecution } from '@/lib/privacy/privacybee-cmp/produktion'
import { PRODUCTION_POLICY_TABLE } from '@/lib/privacy/privacybee-cmp/produktionspolitik'
import { CMP_RELEASE_AUTHORIZED } from '@/lib/privacy/privacybee-cmp/vertrag'

describe('12Go produktive Fassade', () => {
  test('die ausgewählte 12Go-Policy ist frei und ohne Gate trotzdem zu', () => {
    assert.equal(CMP_RELEASE_AUTHORIZED, true)
    assert.equal(PRODUCTION_POLICY_TABLE.discovercars, null)
    assert.equal(PRODUCTION_POLICY_TABLE.twelvego.policyId, 'twelvego-general-chf-20261031-r1')
    assert.equal(PRODUCTION_POLICY_TABLE.twelvego.disclosureRevision, 'twelvego-general-disclosure-v1')
    assert.equal(PRODUCTION_POLICY_TABLE.twelvego.hostSelectionCommit, 'f056b01d63ac7d61650864734a9b44eb6484989e')
    assert.deepEqual(PRODUCTION_POLICY_TABLE.twelvego.requiredOptional, ['ANALYTICS_STORAGE'])
    assert.equal(requestProductionExecution('twelvego', 'scope-a'), null)
  })

  test('der produktive Bootstrap gibt die 12Go-Zeile frei und behält die negativen Proben', () => {
    const verzeichnis = mkdtempSync(join(tmpdir(), 'twelve-go-fassade-'))
    const ausgabe = join(verzeichnis, 'probe.js')
    execFileSync(join(process.cwd(), 'node_modules/esbuild/bin/esbuild'), [
      join(process.cwd(), 'scripts/twelve-go-widget-v2/fassade-probe.ts'),
      '--bundle',
      '--platform=node',
      '--format=cjs',
      `--alias:@=${process.cwd()}`,
      `--outfile=${ausgabe}`,
    ], { stdio: 'inherit' })
    const text = execFileSync(process.execPath, [ausgabe], { encoding: 'utf8' })
    assert.match(text, /12go probe ok/)
  })
})
