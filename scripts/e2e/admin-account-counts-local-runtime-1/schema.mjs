#!/usr/bin/env node
// Replay committed migrations into the owned local catalog, then install the
// unchanged #557 producer and wrapper. Never overlay the reduced #550
// bootstrap. A replay issue names the exact file and stays BLOCKED.

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { refuseBootstrapOverlay } from '../admin-account-counts-browser-acceptance-1/source-manifest.mjs'
import { SOURCE_PATHS } from '../admin-account-counts-browser-acceptance-1/constants.mjs'
import { PINS, ROOT } from './constants.mjs'

export const PRODUCER_VERIFY_SQL = `
select
  p.proname,
  pg_get_userbyid(p.proowner) as owner,
  p.prosecdef as security_definer,
  n.nspname as schema
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'jetnity_reporting'
  and p.proname = 'account_counts_v1';
`

export const WRAPPER_VERIFY_SQL = `
select
  p.proname,
  pg_get_userbyid(p.proowner) as owner,
  p.prosecdef as security_definer,
  n.nspname as schema
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'admin_account_counts_v1';
`

export const INDEPENDENT_COUNT_SQL = `
select
  count(*)::text as present,
  count(*) filter (
    where u.created_at is not null
      and u.created_at >= (pg_catalog.now() - interval '720 hours')
      and u.created_at < pg_catalog.now()
  )::text as recent
from auth.users as u
where u.deleted_at is null
  and u.is_anonymous is false;
`

export function plannedSql() {
  const planned = [SOURCE_PATHS.producer, SOURCE_PATHS.wrapper]
  refuseBootstrapOverlay({ plannedSqlPaths: planned, target: 'gotrue' })
  return planned
}

export function leseUnveraenderteSql({ root = ROOT } = {}) {
  const producer = readFileSync(join(root, SOURCE_PATHS.producer))
  const wrapper = readFileSync(join(root, SOURCE_PATHS.wrapper))
  const producerSha = createHash('sha256').update(producer).digest('hex')
  const wrapperSha = createHash('sha256').update(wrapper).digest('hex')
  if (producerSha !== PINS.producerSha256) {
    throw new Error(`producer sha256 ${producerSha} != ${PINS.producerSha256}`)
  }
  if (wrapperSha !== PINS.wrapperSha256) {
    throw new Error(`wrapper sha256 ${wrapperSha} != ${PINS.wrapperSha256}`)
  }
  refuseBootstrapOverlay({ plannedSqlPaths: plannedSql(), target: 'gotrue' })
  return {
    producerSql: producer.toString('utf8'),
    wrapperSql: wrapper.toString('utf8'),
    producerSha,
    wrapperSha,
  }
}

export function classifyReplayError(file, error) {
  return {
    blocked: true,
    file,
    prerequisite: `Committed migration ${file} failed in the owned local engine.`,
    error: error instanceof Error ? error.message : String(error),
  }
}

export async function replayMigrations({ files, applySql }) {
  for (const file of files) {
    try {
      await applySql({ path: file.path, kind: 'migration' })
    } catch (error) {
      throw Object.assign(new Error(`Migration replay blocked on ${file.path}`), classifyReplayError(file.path, error))
    }
  }
  return { replayed: files.map((file) => file.path), bootstrapUsed: false }
}

export async function installProducerAndWrapper({ applySql, verify, root = ROOT } = {}) {
  const sql = leseUnveraenderteSql({ root })
  await applySql({ path: SOURCE_PATHS.producer, sql: sql.producerSql, kind: 'producer' })
  await applySql({ path: SOURCE_PATHS.wrapper, sql: sql.wrapperSql, kind: 'wrapper' })
  const catalog = await verify({ producerSql: PRODUCER_VERIFY_SQL, wrapperSql: WRAPPER_VERIFY_SQL })
  if (!catalog?.producer?.proname || !catalog?.wrapper?.proname) {
    throw new Error('Producer or wrapper missing from the owned catalog after install.')
  }
  return {
    producerSha: sql.producerSha,
    wrapperSha: sql.wrapperSha,
    catalog,
    hostedParityClaimed: false,
  }
}

export function wrapperDropSql() {
  return 'drop function if exists public.admin_account_counts_v1();'
}

export function wrapperRestoreSql({ root = ROOT } = {}) {
  return leseUnveraenderteSql({ root }).wrapperSql
}
