import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { FORBIDDEN_CONNECTION_KEYS } from '../admin-account-counts-1-local-proof.mjs'
import {
  ACCEPTED,
  HOSTED_ARGV_PATTERN,
  PINNED_FUNCTIONDEF,
  assertLocalDisposableOnly,
  composeInstallTransaction,
  composeProducerAndWrapper,
  composeRollbackTransaction,
  pinAcceptedSources,
  readPackageSql,
  refuseHostedTargets,
} from './compose.mjs'

const hier = dirname(fileURLToPath(import.meta.url))
const runner = join(hier, 'runner.mjs')

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

describe('admin-account-counts-rollout-preparation-1 source pin', () => {
  test('accepted producer/wrapper/bootstrap/contract hashes still match the task pins', () => {
    const pins = pinAcceptedSources()
    assert.equal(pins.candidate, ACCEPTED.candidate.sha256)
    assert.equal(pins.bootstrap, ACCEPTED.bootstrap.sha256)
    assert.equal(pins.wrapper, ACCEPTED.wrapper.sha256)
    assert.equal(pins.contractBlob, ACCEPTED.contractBlob)
    assert.equal(pins.parserBlob, ACCEPTED.parserBlob)
  })

  test('composition is unchanged candidate then wrapper and package SQL forbids CASCADE', () => {
    const composed = composeProducerAndWrapper()
    const candidate = readFileSync(ACCEPTED.candidate.path, 'utf8')
    const wrapper = readFileSync(ACCEPTED.wrapper.path, 'utf8')
    assert.equal(composed.sql, `${candidate}\n\n${wrapper}`)
    assert.match(composeInstallTransaction({ mode: 'fresh' }), /BEGIN;/)
    assert.match(composeInstallTransaction({ mode: 'fresh' }), /COMMIT;/)
    assert.match(composeInstallTransaction({ mode: 'fault' }), /JETNITY_ROLLOUT_FAULT_INJECT/)
    assert.match(composeRollbackTransaction(), /DROP FUNCTION public\.admin_account_counts_v1\(\)/)
    assert.doesNotMatch(composeRollbackTransaction(), /\bCASCADE\b/)
    assert.match(composeRollbackTransaction(), new RegExp(PINNED_FUNCTIONDEF.producerSha256))
    assert.match(composeRollbackTransaction(), new RegExp(PINNED_FUNCTIONDEF.wrapperSha256))
    assert.match(composeRollbackTransaction(), /REVOKED_EXACT/)
    assert.match(composeRollbackTransaction(), /identity_core_ok/)
    assert.match(composeRollbackTransaction(), /acl_revoked_exact/)
    assert.match(composeInstallTransaction({ mode: 'fresh' }), new RegExp(PINNED_FUNCTIONDEF.producerSha256))
    assert.match(composeInstallTransaction({ mode: 'staged' }), /REVOKED_EXACT/)
    assert.match(composeInstallTransaction({ mode: 'staged' }), /REVOKE ALL ON FUNCTION/)
    assert.doesNotMatch(composeInstallTransaction({ mode: 'staged' }), /verify expected ALREADY_INSTALLED/)
    assert.match(composeInstallTransaction({ mode: 'stagedFault' }), /JETNITY_ROLLOUT_FAULT_INJECT/)
    assert.match(readPackageSql('verify'), /JETNITY_IDENTITY_SUBQUERY/)
    assert.match(readPackageSql('verifyRevoked'), /JETNITY_IDENTITY_SUBQUERY/)
    assert.match(readPackageSql('rollback'), /JETNITY_IDENTITY_SUBQUERY/)
    assert.match(readPackageSql('identity'), new RegExp(PINNED_FUNCTIONDEF.wrapperSha256))
    assert.match(readPackageSql('identity'), /is_grantable/)
    assert.match(readPackageSql('identity'), /wrapper_name_count/)
    for (const name of ['identity', 'verify', 'verifyRevoked', 'rollback', 'revokeExecute', 'sentinel']) {
      const sql = readPackageSql(name)
      assert.doesNotMatch(sql, /\bCASCADE\b/)
      assert.doesNotMatch(sql, /postgres(?:ql)?:\/\//i)
    }
  })
})

describe('admin-account-counts-rollout-preparation-1 hosted reject', () => {
  test('refuses inherited connection defaults and hosted argv before any cluster starts', () => {
    assert.throws(
      () => refuseHostedTargets({ PGHOST: 'db.example.supabase.co' }, ['node', runner]),
      /Verbotene Verbindungs-Umgebung/,
    )
    assert.throws(
      () => refuseHostedTargets({ JETNITY_ALLOW_REMOTE_DB: '1' }, ['node', runner]),
      /Remote-DB ist verboten/,
    )
    assert.throws(
      () =>
        refuseHostedTargets({}, ['node', runner, 'postgres://user@db.abc.supabase.com:5432/postgres']),
      /Remote- oder Verbindungsziel/,
    )
    assert.match('postgres://db.abc.supabase.com/postgres', HOSTED_ARGV_PATTERN)
    assert.throws(
      () => assertLocalDisposableOnly({ DATABASE_URL: 'postgresql://example.invalid/db' }, ['node', runner]),
      /Verbotene Verbindungs-Umgebung/,
    )
  })

  test('spawned runner fails closed on PGHOST and does not print the override or start initdb', () => {
    const lauf = spawnRunner({ PGHOST: 'should-not-be-printed.example' })
    assert.notEqual(lauf.status, 0)
    assert.match(lauf.stderr, /Verbotene Verbindungs-Umgebung: PGHOST/)
    assert.doesNotMatch(`${lauf.stdout}${lauf.stderr}`, /should-not-be-printed\.example/)
    assert.doesNotMatch(`${lauf.stdout}${lauf.stderr}`, /initdb|pg_ctl/)
  })

  test('spawned runner refuses a remote DSN argument without starting a cluster', () => {
    const lauf = spawnRunner({}, ['postgresql://user@db.example.supabase.com:5432/postgres'])
    assert.notEqual(lauf.status, 0)
    assert.match(lauf.stderr, /Remote- oder Verbindungsziel/)
    assert.doesNotMatch(`${lauf.stdout}${lauf.stderr}`, /initdb|cluster socket/)
  })
})
