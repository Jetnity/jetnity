#!/usr/bin/env node
// Hash-pinned composition of the accepted account-count sources.
//
// This module never rewrites those files. A hash mismatch is BLOCKED.
// It never imports scripts/db/sql.mjs and never talks to a remote database.

import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
export const ROOT = join(hier, '../../..')

export const ACCEPTED = Object.freeze({
  candidate: Object.freeze({
    path: join(ROOT, 'scripts/db/admin-account-counts-1-candidate.sql'),
    sha256: 'dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420',
  }),
  bootstrap: Object.freeze({
    path: join(ROOT, 'scripts/db/admin-account-counts-1-bootstrap.sql'),
    sha256: '0413821d7c75c76908dd437527d623fcbed59c524135adbf5e5974730e6f6ea2',
  }),
  wrapper: Object.freeze({
    path: join(ROOT, 'scripts/db/admin-account-counts-delivery-1-rpc.sql'),
    sha256: '13fa3fe280d76d42ca6b2a1dff12077edc3d44a599a22300e89dd5578d63a6fb',
  }),
  contractBlob: '6826eeea70aecc0507d05624daaeac47af0be9b8',
  parserBlob: '6205ecbba621b048fff479856c5523fab5ec4f6d',
  contractPath: join(ROOT, 'lib/admin/account-counts-delivery/contract.ts'),
  parserPath: join(ROOT, 'lib/admin/account-counts-delivery/parser.ts'),
})

export const PACKAGE_SQL = Object.freeze({
  classify: join(hier, 'sql/classify.sql'),
  verify: join(hier, 'sql/verify.sql'),
  rollback: join(hier, 'sql/rollback.sql'),
  revokeExecute: join(hier, 'sql/revoke-execute.sql'),
  sentinel: join(hier, 'sql/sentinel.sql'),
})

export const HOSTED_ARGV_PATTERN =
  /supabase\.(co|com)|pooler\.supabase|db\.[a-z0-9-]+\.supabase|aws-0-|pooler\.supabase\.com|postgres(ql)?:\/\//i

export const HOSTED_VALUE_PATTERN =
  /supabase\.(co|com)|pooler\.supabase|db\.[a-z0-9-]+\.supabase|aws-0-|vercel\.app|neon\.tech|postgres(ql)?:\/\//i

export function sha256Datei(pfad) {
  return createHash('sha256').update(readFileSync(pfad)).digest('hex')
}

export function gitBlobHash(pfad) {
  return execFileSync('git', ['hash-object', pfad], {
    encoding: 'utf8',
    cwd: ROOT,
  }).trim()
}

export function pinAcceptedSources() {
  const candidate = sha256Datei(ACCEPTED.candidate.path)
  const bootstrap = sha256Datei(ACCEPTED.bootstrap.path)
  const wrapper = sha256Datei(ACCEPTED.wrapper.path)
  const contractBlob = gitBlobHash(ACCEPTED.contractPath)
  const parserBlob = gitBlobHash(ACCEPTED.parserPath)
  const mismatches = []
  if (candidate !== ACCEPTED.candidate.sha256) {
    mismatches.push(`candidate ${candidate} != ${ACCEPTED.candidate.sha256}`)
  }
  if (bootstrap !== ACCEPTED.bootstrap.sha256) {
    mismatches.push(`bootstrap ${bootstrap} != ${ACCEPTED.bootstrap.sha256}`)
  }
  if (wrapper !== ACCEPTED.wrapper.sha256) {
    mismatches.push(`wrapper ${wrapper} != ${ACCEPTED.wrapper.sha256}`)
  }
  if (contractBlob !== ACCEPTED.contractBlob) {
    mismatches.push(`contract blob ${contractBlob} != ${ACCEPTED.contractBlob}`)
  }
  if (parserBlob !== ACCEPTED.parserBlob) {
    mismatches.push(`parser blob ${parserBlob} != ${ACCEPTED.parserBlob}`)
  }
  if (mismatches.length) {
    const error = new Error(
      `BLOCKED: accepted source/hash mismatch. Technical Lead must resolve before any apply. ${mismatches.join('; ')}`,
    )
    error.code = 'JETNITY_ACCEPTED_HASH_MISMATCH'
    throw error
  }
  return {
    candidate,
    bootstrap,
    wrapper,
    contractBlob,
    parserBlob,
  }
}

export function readPackageSql(name) {
  const pfad = PACKAGE_SQL[name]
  if (!pfad) throw new Error(`unknown package SQL '${name}'`)
  const text = readFileSync(pfad, 'utf8')
  if (/\bCASCADE\b/i.test(text)) {
    throw new Error(`fail-closed: package SQL ${name} must not contain CASCADE`)
  }
  if (HOSTED_VALUE_PATTERN.test(text)) {
    throw new Error(`fail-closed: package SQL ${name} must not embed a hosted target`)
  }
  return text
}

export function composeProducerAndWrapper() {
  const pins = pinAcceptedSources()
  return {
    pins,
    sql: [readFileSync(ACCEPTED.candidate.path, 'utf8'), readFileSync(ACCEPTED.wrapper.path, 'utf8')].join(
      '\n\n',
    ),
  }
}

export function composeFixtureBootstrap() {
  pinAcceptedSources()
  return readFileSync(ACCEPTED.bootstrap.path, 'utf8')
}

export function refuseHostedTargets(env = process.env, argv = process.argv) {
  if (env.JETNITY_ALLOW_REMOTE_DB === '1') {
    throw new Error('Dieser Lauf ist nur für isolierte lokale PostgreSQL. Remote-DB ist verboten.')
  }
  const gesetzt = [
    'PGHOST',
    'PGHOSTADDR',
    'PGPORT',
    'PGDATABASE',
    'PGUSER',
    'PGPASSWORD',
    'PGPASSFILE',
    'PGSERVICE',
    'PGSERVICEFILE',
    'PGSSLMODE',
    'PGREQUIRESSL',
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL_NON_POOLING',
    'DIRECT_URL',
    'SUPABASE_DB_URL',
    'SUPABASE_DATABASE_URL',
    'SUPABASE_CONNECTION_STRING',
    'JETNITY_SECURITY_EVENTS_DB_URL',
    'SECURITY_EVENTS_DATABASE_URL',
    'JETNITY_LOCAL_DB_URL',
  ].filter((schluessel) => {
    const wert = env[schluessel]
    return wert != null && wert !== ''
  })
  if (gesetzt.length) {
    throw new Error(`Verbotene Verbindungs-Umgebung: ${gesetzt.join(', ')}`)
  }
  if (argv.some((arg) => HOSTED_ARGV_PATTERN.test(String(arg)))) {
    throw new Error('Remote- oder Verbindungsziel in den Argumenten ist verboten.')
  }
}

export function assertLocalDisposableOnly(env = process.env, argv = process.argv) {
  refuseHostedTargets(env, argv)
  pinAcceptedSources()
}

export function composeInstallTransaction({ mode = 'fresh' } = {}) {
  pinAcceptedSources()
  const classify = readPackageSql('classify')
  const verify = readPackageSql('verify')
  const producerAndWrapper = composeProducerAndWrapper().sql
  const header = `
-- LOCAL-ONLY install transaction. Not a migration. Not hosted SQL.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '20s';
SET LOCAL idle_in_transaction_session_timeout = '30s';
SELECT pg_advisory_xact_lock(hashtext('jetnity.admin-account-counts.v1'));
`

  if (mode === 'already') {
    return [
      'BEGIN;',
      header,
      `DO $already$
DECLARE
  klass jsonb;
BEGIN
  klass := (${classify.trim().replace(/;+\s*$/, '')});
  IF klass ->> 'state' IS DISTINCT FROM 'ALREADY_INSTALLED' THEN
    RAISE EXCEPTION 'jetnity.rollout-prep.v1: expected ALREADY_INSTALLED, got %', klass
      USING ERRCODE = 'XX000';
  END IF;
END
$already$;`,
      verify,
      'COMMIT;',
    ].join('\n\n')
  }

  if (mode === 'fault') {
    return [
      'BEGIN;',
      header,
      `DO $fresh$
DECLARE
  klass jsonb;
BEGIN
  klass := (${classify.trim().replace(/;+\s*$/, '')});
  IF klass ->> 'state' IS DISTINCT FROM 'FRESH' THEN
    RAISE EXCEPTION 'jetnity.rollout-prep.v1: expected FRESH before apply, got %', klass
      USING ERRCODE = 'XX000';
  END IF;
END
$fresh$;`,
      producerAndWrapper,
      `DO $fault$
BEGIN
  RAISE EXCEPTION 'JETNITY_ROLLOUT_FAULT_INJECT'
    USING ERRCODE = 'XX000';
END
$fault$;`,
      verify,
      'COMMIT;',
    ].join('\n\n')
  }

  if (mode !== 'fresh') {
    throw new Error(`unknown install mode '${mode}'`)
  }

  return [
    'BEGIN;',
    header,
    `DO $fresh$
DECLARE
  klass jsonb;
BEGIN
  klass := (${classify.trim().replace(/;+\s*$/, '')});
  IF klass ->> 'state' IS DISTINCT FROM 'FRESH' THEN
    RAISE EXCEPTION 'jetnity.rollout-prep.v1: expected FRESH before apply, got %', klass
      USING ERRCODE = 'XX000';
  END IF;
END
$fresh$;`,
    producerAndWrapper,
    verify,
    'COMMIT;',
  ].join('\n\n')
}

export function composeRollbackTransaction() {
  return ['BEGIN;', readPackageSql('rollback'), 'COMMIT;'].join('\n\n')
}

export function composeRevokeExecute() {
  return readPackageSql('revokeExecute')
}
