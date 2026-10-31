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
  test('die gelieferte Tabelle bleibt null und der Release bleibt zu', () => {
    assert.equal(CMP_RELEASE_AUTHORIZED, false)
    assert.equal(PRODUCTION_POLICY_TABLE.twelvego, null)
    assert.equal(requestProductionExecution('twelvego', 'scope-a'), null)
  })

  test('das Testmodul erfüllt Grant, Kategorieverlust und Release-Trennung', () => {
    const verzeichnis = mkdtempSync(join(tmpdir(), 'twelve-go-fassade-'))
    const ausgabe = join(verzeichnis, 'probe.js')
    execFileSync(join(process.cwd(), 'node_modules/esbuild/bin/esbuild'), [
      join(process.cwd(), 'scripts/twelve-go-widget-v2/fassade-probe.ts'),
      '--bundle',
      '--platform=node',
      '--format=cjs',
      `--alias:@=${process.cwd()}`,
      `--alias:@/lib/privacy/privacybee-cmp/produktionspolitik=${join(process.cwd(), 'scripts/twelve-go-widget-v2/politik-fixture.ts')}`,
      `--outfile=${ausgabe}`,
    ], { stdio: 'inherit' })
    const text = execFileSync(process.execPath, [ausgabe], { encoding: 'utf8' })
    assert.match(text, /12go probe ok/)
  })
})
