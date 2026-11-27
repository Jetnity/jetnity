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
  assert.equal(digest(script), '3ac75c007eeba8339192c36fd13496b8627a746bc32fd1ce92fbda9fc9236cdc')
  assert.equal(digest(fixture), '8cb4b36e201653187f3b14ad2108ced66ca2f1b94fcb0f8bea4453ef6e057d08')
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
  assert.match(result.stderr ?? '', /Ran 45 tests/)
  assert.match(result.stderr ?? '', /\bOK\b/)
})
