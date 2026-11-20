// Read-only research gap inventory: tests use synthetic records, never real archive.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'

const audit = resolve('scripts/official-truth-index-gap-audit.py')
const fixture = resolve('scripts/official-truth-index-gap-audit.test.py')
const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')

test('v2.2 index gap inventory remains offline and fail-closed', { timeout: 30_000 }, () => {
  assert.equal(digest(audit), '47fd1d9fc6574fe027e30fb8e0c8507393ec739f427c281c4f3be83a2d14cb21')
  assert.equal(digest(fixture), 'b9b795a090cd7019f916d04cd44b5a987c847fd50b55949ac2f150e50a69586c')
  const run = spawnSync('python3', [fixture, '-q'], {
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
  assert.equal(run.error, undefined, 'Python3 must be available')
  assert.equal(run.signal, null, 'Offline test must exit normally')
  assert.equal(run.status, 0, 'Offline gap test failed: ' + (run.stderr ?? '').slice(-1000))
  assert.match(run.stderr ?? '', /Ran 5 tests/)
  assert.match(run.stderr ?? '', /\bOK\b/)
})
