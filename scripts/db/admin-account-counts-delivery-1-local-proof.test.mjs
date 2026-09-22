import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  FORBIDDEN_CONNECTION_KEYS,
  assertIsolatedConnectionEnvironment,
} from './admin-account-counts-1-local-proof.mjs'

const hier = dirname(fileURLToPath(import.meta.url))
const runner = join(hier, 'admin-account-counts-delivery-1-local-proof.mjs')
const wrapper = join(hier, 'admin-account-counts-delivery-1-rpc.sql')
const candidate = join(hier, 'admin-account-counts-1-candidate.sql')

function spawnRunner(envExtra = {}, args = []) {
  const env = { ...process.env, ...envExtra }
  for (const schluessel of FORBIDDEN_CONNECTION_KEYS) {
    if (!(schluessel in envExtra)) delete env[schluessel]
  }
  return spawnSync(process.execPath, [runner, ...args], {
    encoding: 'utf8',
    env,
  })
}

describe('admin-account-counts-delivery-1 local proof runner safety', () => {
  test('rejects inherited connection overrides before any cluster starts', () => {
    assert.throws(
      () => assertIsolatedConnectionEnvironment({ PGHOST: 'example' }, ['node', runner]),
      /Verbotene Verbindungs-Umgebung/,
    )
    const lauf = spawnRunner({ PGHOST: 'should-not-be-printed.example' })
    assert.notEqual(lauf.status, 0)
    assert.match(lauf.stderr, /Verbotene Verbindungs-Umgebung: PGHOST/)
    assert.doesNotMatch(lauf.stdout + lauf.stderr, /should-not-be-printed\.example/)
    assert.doesNotMatch(lauf.stdout + lauf.stderr, /initdb|pg_ctl/)
  })

  test('wrapper and runner stay local-only and do not touch accepted producer files', () => {
    const wrapperSrc = readFileSync(wrapper, 'utf8')
    const runnerSrc = readFileSync(runner, 'utf8')
    const candidateSrc = readFileSync(candidate, 'utf8')
    assert.match(wrapperSrc, /LOCAL \/ UNAPPLIED/)
    assert.match(wrapperSrc, /^\s*security invoker$/im)
    assert.doesNotMatch(wrapperSrc, /^\s*security definer\b/im)
    assert.doesNotMatch(wrapperSrc, /^\s*[^-\s].*auth\.users/im)
    const executable = wrapperSrc
      .split('\n')
      .filter((zeile) => zeile.trim() && !zeile.trim().startsWith('--'))
      .join('\n')
    assert.doesNotMatch(executable, /supabase\/migrations\//)
    assert.doesNotMatch(runnerSrc, /from\s+['"][^'"]*sql\.mjs['"]/)
    assert.doesNotMatch(runnerSrc, /execFileSync\([^)]*pg_ctlcluster/)
    assert.match(candidateSrc, /jetnity_reporting\.account_counts_v1/)
    assert.match(runnerSrc, /admin-account-counts-1-candidate\.sql/)
    assert.match(runnerSrc, /dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420/)
  })
})
