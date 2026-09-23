#!/usr/bin/env node
// Replay committed migrations into the owned local catalog, then install the
// unchanged #557 producer and wrapper. Source fingerprints and installed
// catalog evidence stay separate. Name-only or source-hash-only is not PASS.

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { refuseBootstrapOverlay } from '../admin-account-counts-browser-acceptance-1/source-manifest.mjs'
import { SOURCE_PATHS } from '../admin-account-counts-browser-acceptance-1/constants.mjs'
import { PINS, ROOT } from './constants.mjs'
import { classifyMigrationApplicability } from './source.mjs'

export const MANAGED_SCHEMA_PREREQ_SQL = `
select json_build_object(
  'server_version', current_setting('server_version'),
  'timezone', current_setting('TimeZone'),
  'search_path', current_setting('search_path'),
  'auth_schema', (select count(*) from pg_namespace where nspname = 'auth'),
  'migrations_schema', (select count(*) from pg_namespace where nspname = 'supabase_migrations')
);
`

export const PRODUCER_CATALOG_SQL = `
select json_build_object(
  'schema', n.nspname,
  'proname', p.proname,
  'owner', pg_get_userbyid(p.proowner),
  'security_definer', p.prosecdef,
  'config', p.proconfig,
  'definition', pg_get_functiondef(p.oid),
  'execute_roles', coalesce((
    select string_agg(coalesce(nullif(r.rolname, ''), 'public'), ',')
    from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    left join pg_roles r on r.oid = a.grantee
    where a.privilege_type = 'EXECUTE'
  ), '')
)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'jetnity_reporting'
  and p.proname = 'account_counts_v1';
`

export const WRAPPER_CATALOG_SQL = `
select json_build_object(
  'schema', n.nspname,
  'proname', p.proname,
  'owner', pg_get_userbyid(p.proowner),
  'security_definer', p.prosecdef,
  'config', p.proconfig,
  'definition', pg_get_functiondef(p.oid),
  'execute_roles', coalesce((
    select string_agg(coalesce(nullif(r.rolname, ''), 'public'), ',')
    from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    left join pg_roles r on r.oid = a.grantee
    where a.privilege_type = 'EXECUTE'
  ), '')
)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'admin_account_counts_v1';
`

export const PRODUCER_VERIFY_SQL = PRODUCER_CATALOG_SQL
export const WRAPPER_VERIFY_SQL = WRAPPER_CATALOG_SQL

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

export function parseJsonRow(text) {
  const raw = String(text || '').trim()
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function configText(value) {
  if (Array.isArray(value)) return value.join(',')
  return String(value || '')
}

export function assertManagedSchemaPrereq(prereq) {
  if (!prereq) throw new Error('Managed-schema prerequisite evidence missing')
  const version = String(prereq.server_version || '')
  if (!/\b17\./.test(version) && !String(prereq.server_version_num || '').startsWith('17')) {
    throw new Error(`Local engine is not PostgreSQL 17: ${version || 'unknown'}`)
  }
  if (Number(prereq.auth_schema) < 1) {
    throw new Error('Managed auth schema is missing from the owned catalog')
  }
  if (Number(prereq.migrations_schema) < 1) {
    throw new Error('supabase_migrations schema is missing; refuse a prefix-only replay claim')
  }
  return true
}

export function assertInstalledRelation(row, {
  schema,
  proname,
  securityDefiner,
  sourceSql,
  forbiddenExecute = [],
  requiredDefinition = [],
} = {}) {
  if (!row?.proname) throw new Error(`${proname} is missing from the owned catalog`)
  if (row.proname !== proname) throw new Error(`Catalog name ${row.proname} != ${proname}`)
  if (!row.definition) throw new Error(`${proname} definition is missing; name-only is not catalog evidence`)
  if (row.schema !== schema) throw new Error(`${proname} schema ${row.schema} != ${schema}`)
  if (row.owner !== 'postgres') throw new Error(`${proname} owner ${row.owner} != postgres`)
  const definer = row.security_definer === true || row.security_definer === 't'
  if (definer !== Boolean(securityDefiner)) {
    throw new Error(`${proname} SECURITY DEFINER=${definer} expected ${Boolean(securityDefiner)}`)
  }
  const cfg = `${configText(row.config)} ${row.definition}`
  if (!/search_path\s*=\s*pg_catalog/i.test(cfg)) {
    throw new Error(`${proname} search_path is not pinned to pg_catalog`)
  }
  for (const marker of requiredDefinition) {
    if (!row.definition.includes(marker) && !(sourceSql || '').includes(marker)) {
      throw new Error(`${proname} definition does not contain required marker ${marker}`)
    }
    if (!row.definition.includes(marker)) {
      throw new Error(`${proname} installed definition does not contain ${marker}`)
    }
  }
  const roles = String(row.execute_roles || '').split(',').map((item) => item.trim()).filter(Boolean)
  for (const role of forbiddenExecute) {
    if (roles.includes(role)) throw new Error(`${proname} EXECUTE is granted to ${role}`)
  }
  return true
}

export function assertInstalledCatalog(catalog, { producerSql, wrapperSql } = {}) {
  assertManagedSchemaPrereq(catalog?.prereq)
  assertInstalledRelation(catalog?.producer, {
    schema: 'jetnity_reporting',
    proname: 'account_counts_v1',
    securityDefiner: true,
    sourceSql: producerSql,
    forbiddenExecute: ['anon', 'public', 'service_role'],
    requiredDefinition: ['account_counts_v1', 'darf_konten_verwalten', '720 hours'],
  })
  const producerCfg = `${configText(catalog.producer.config)} ${catalog.producer.definition}`
  if (!/timezone\s*=\s*UTC/i.test(producerCfg)) {
    throw new Error('Producer TimeZone is not pinned to UTC')
  }
  assertInstalledRelation(catalog?.wrapper, {
    schema: 'public',
    proname: 'admin_account_counts_v1',
    securityDefiner: false,
    sourceSql: wrapperSql,
    forbiddenExecute: ['anon', 'public', 'service_role'],
    requiredDefinition: ['admin_account_counts_v1', 'jetnity_reporting.account_counts_v1'],
  })
  return {
    catalogVerified: true,
    hostedParityClaimed: false,
  }
}

export async function replayMigrations({ files, applySql, appliedVersions = [], copiedBlobs = [] }) {
  const replayed = []
  const skipped = []
  for (const file of files) {
    const copied = copiedBlobs.find((item) => item.path === file.path)
    const applicability = classifyMigrationApplicability({
      file,
      appliedVersions,
      baselineBlob: file.baselineBlob,
      copiedBlob: copied?.copiedBlob,
    })
    if (!applicability.apply) {
      skipped.push({ path: file.path, version: applicability.version, reason: applicability.reason })
      continue
    }
    try {
      await applySql({ path: file.path, kind: 'migration' })
      replayed.push({ path: file.path, version: applicability.version })
    } catch (error) {
      throw Object.assign(new Error(`Migration replay blocked on ${file.path}`), classifyReplayError(file.path, error))
    }
  }
  return { replayed, skipped, bootstrapUsed: false, incompleteReplay: false }
}

export async function installProducerAndWrapper({ applySql, verify, root = ROOT } = {}) {
  const sql = leseUnveraenderteSql({ root })
  await applySql({ path: SOURCE_PATHS.producer, sql: sql.producerSql, kind: 'producer' })
  await applySql({ path: SOURCE_PATHS.wrapper, sql: sql.wrapperSql, kind: 'wrapper' })
  if (typeof verify !== 'function') {
    throw new Error('Catalog verification callback is required; source hashes are not installed evidence.')
  }
  const catalog = await verify({
    producerSql: PRODUCER_CATALOG_SQL,
    wrapperSql: WRAPPER_CATALOG_SQL,
    prereqSql: MANAGED_SCHEMA_PREREQ_SQL,
  })
  const verified = assertInstalledCatalog(catalog, {
    producerSql: sql.producerSql,
    wrapperSql: sql.wrapperSql,
  })
  return {
    producerSha: sql.producerSha,
    wrapperSha: sql.wrapperSha,
    catalog,
    catalogVerified: verified.catalogVerified,
    hostedParityClaimed: false,
  }
}

export function wrapperDropSql() {
  return 'drop function if exists public.admin_account_counts_v1();'
}

export function wrapperRestoreSql({ root = ROOT } = {}) {
  return leseUnveraenderteSql({ root }).wrapperSql
}
