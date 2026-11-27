// The single-command private batch runner is mandatory Core evidence.
// It never accesses real research, HTTP, V3 Method, Supabase or Production in CI.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { test } from 'node:test'

test('50-pass research-only importer remains atomic, private and fail-closed', { timeout: 30_000 }, () => {
  const source = resolve('scripts/official-truth-50-pass-import.py')
  const fixture = resolve('scripts/official-truth-50-pass-import.test.py')
  const result = spawnSync('python3', [fixture, '-q'], {
    cwd: resolve('.'),
    encoding: 'utf8',
    timeout: 20_000,
    maxBuffer: 128 * 1024,
    env: {
      PATH: process.env.PATH ?? '/usr/bin:/bin',
      PYTHONNOUSERSITE: '1',
      PYTHONDONTWRITEBYTECODE: '1',
      PYTHONUTF8: '1',
      NODE_ENV: 'test',
    },
  })
  assert.ok(source.endsWith('/official-truth-50-pass-import.py'))
  assert.equal(result.error, undefined, 'Python3 is mandatory for this reviewed offline runner')
  assert.equal(result.signal, null)
  assert.equal(result.status, 0, '50-pass importer synthetic failure: ' + (result.stderr ?? '').slice(-1000))
  assert.match(result.stderr ?? '', /Ran 13 tests/)
  assert.match(result.stderr ?? '', /\bOK\b/)
})
