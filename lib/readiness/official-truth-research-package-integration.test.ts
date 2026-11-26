// Offline research adapter gate. Synthetic fixtures; no provider, DB or customer publication.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'

const script = resolve('scripts/official-truth-research-package.py')
const fixture = resolve('scripts/official-truth-research-package.test.py')
const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')

test('original research archive adapter remains independently checked and fail-closed', { timeout: 30_000 }, () => {
  // Explicit custody of the two exact offline-tested scripts, not research data.
  assert.equal(digest(script), '99a42089f38e1bbcd960fa66ebcd8cba163d2f36fd8056be9670a9ec80b90d3b')
  assert.equal(digest(fixture), 'd0ce3ccf7bbe52e742abd53da6754e635804fffce7ba4e3a35fa6e88014153e4')
  const result = spawnSync('python3', [fixture, '-q'], {
    cwd: resolve('.'),
    encoding: 'utf8',
    timeout: 20_000,
    maxBuffer: 256 * 1024,
    env: {
      PATH: process.env.PATH ?? '/usr/bin:/bin',
      PYTHONNOUSERSITE: '1',
      PYTHONDONTWRITEBYTECODE: '1',
      PYTHONUTF8: '1',
      NODE_ENV: 'test',
    },
  })
  assert.equal(result.error, undefined, 'Python3 must be available; no silent test skipping')
  assert.equal(result.signal, null, 'Offline tests must exit normally')
  assert.equal(result.status, 0, 'Synthetic offline checks failed: ' + (result.stderr ?? '').slice(-1000))
  assert.match(result.stderr ?? '', /Ran 21 tests/)
  assert.match(result.stderr ?? '', /\bOK\b/)
})
