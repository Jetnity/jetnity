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
const runner = join(hier, 'admin-account-counts-1-local-proof.mjs')
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

describe('admin-account-counts-1 local proof runner safety', () => {
  test('rejects inherited PGHOST/PGPORT/PGSERVICE/PGDATABASE before any cluster starts', () => {
    for (const schluessel of ['PGHOST', 'PGPORT', 'PGSERVICE', 'PGDATABASE']) {
      assert.throws(
        () => assertIsolatedConnectionEnvironment({ [schluessel]: 'example' }, ['node', runner]),
        /Verbotene Verbindungs-Umgebung/,
      )
    }
  })

  test('rejects remote allow-flag and connection-string overrides', () => {
    assert.throws(
      () => assertIsolatedConnectionEnvironment({ JETNITY_ALLOW_REMOTE_DB: '1' }, ['node', runner]),
      /Remote-DB ist verboten/,
    )
    assert.throws(
      () =>
        assertIsolatedConnectionEnvironment({ DATABASE_URL: 'postgresql://example.invalid/db' }, [
          'node',
          runner,
        ]),
      /Verbotene Verbindungs-Umgebung/,
    )
    assert.throws(
      () =>
        assertIsolatedConnectionEnvironment({}, ['node', runner, 'postgres://db.abc.supabase.co/postgres']),
      /Remote- oder Verbindungsziel/,
    )
  })

  test('spawned runner fails closed on PGHOST and does not print the override value', () => {
    const lauf = spawnRunner({ PGHOST: 'should-not-be-printed.example' })
    assert.notEqual(lauf.status, 0)
    assert.match(lauf.stderr, /Verbotene Verbindungs-Umgebung: PGHOST/)
    assert.doesNotMatch(lauf.stdout + lauf.stderr, /should-not-be-printed\.example/)
    assert.doesNotMatch(lauf.stdout + lauf.stderr, /initdb|pg_ctl/)
  })

  test('spawned runner refuses a remote DSN argument without starting a cluster', () => {
    const lauf = spawnRunner({}, ['postgresql://user@db.example.supabase.com:5432/postgres'])
    assert.notEqual(lauf.status, 0)
    assert.match(lauf.stderr, /Remote- oder Verbindungsziel/)
    assert.doesNotMatch(lauf.stdout + lauf.stderr, /initdb|cluster socket/)
  })

  test('runner and candidate stay local-only in source', () => {
    const runnerSrc = readFileSync(runner, 'utf8')
    const candidateSrc = readFileSync(candidate, 'utf8')
    assert.doesNotMatch(runnerSrc, /from\s+['"][^'"]*sql\.mjs['"]/)
    assert.doesNotMatch(runnerSrc, /['"]sudo['"]/)
    assert.doesNotMatch(runnerSrc, /\bpg_ctlcluster\b/)
    assert.doesNotMatch(candidate, /\/supabase\/migrations\//)
    assert.match(candidateSrc, /LOCAL \/ UNAPPLIED/)
    assert.ok(FORBIDDEN_CONNECTION_KEYS.includes('PGHOST'))
    assert.ok(FORBIDDEN_CONNECTION_KEYS.includes('PGSERVICE'))
  })
})
