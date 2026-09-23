#!/usr/bin/env node
// Replay committed migrations into the owned local catalog, then install the
// unchanged #557 producer and wrapper. Source fingerprints, applied inventory,
// installed catalog identity and execution evidence stay separate. Marker
// strings, name-only rows and source hashes are not catalog PASS.

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
  'migrations_schema', (select count(*) from pg_namespace where nspname = 'supabase_migrations'),
  'reporting_schema', (select count(*) from pg_namespace where nspname = 'jetnity_reporting'),
  'schema_acls', (
    select coalesce(json_agg(json_build_object(
      'schema', n.nspname,
      'grantor', pg_get_userbyid(a.grantor),
      'grantee', coalesce(nullif(r.rolname, ''), 'public'),
      'privilege', a.privilege_type,
      'is_grantable', a.is_grantable
    ) order by n.nspname, coalesce(nullif(r.rolname, ''), 'public'), a.privilege_type), '[]'::json)
    from pg_namespace n
    cross join lateral aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) a
    left join pg_roles r on r.oid = a.grantee
    where n.nspname in ('jetnity_reporting', 'public', 'auth', 'supabase_migrations')
  )
);
`

const FUNCTION_CATALOG_FIELDS = `
  'schema', n.nspname,
  'proname', p.proname,
  'owner', pg_get_userbyid(p.proowner),
  'security_definer', p.prosecdef,
  'config', p.proconfig,
  'definition', pg_get_functiondef(p.oid),
  'nargs', p.pronargs,
  'proargtypes', p.proargtypes::text,
  'prorettype', pg_get_function_result(p.oid),
  'prokind', p.prokind,
  'language', l.lanname,
  'volatile', p.provolatile,
  'acls', (
    select coalesce(json_agg(json_build_object(
      'grantor', pg_get_userbyid(a.grantor),
      'grantee', coalesce(nullif(r.rolname, ''), 'public'),
      'privilege', a.privilege_type,
      'is_grantable', a.is_grantable
    ) order by coalesce(nullif(r.rolname, ''), 'public'), a.privilege_type), '[]'::json)
    from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    left join pg_roles r on r.oid = a.grantee
  ),
  'execute_roles', coalesce((
    select string_agg(coalesce(nullif(r.rolname, ''), 'public'), ',')
    from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    left join pg_roles r on r.oid = a.grantee
    where a.privilege_type = 'EXECUTE'
  ), '')
`

export const PRODUCER_CATALOG_SQL = `
select json_build_object(
  ${FUNCTION_CATALOG_FIELDS}
)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_language l on l.oid = p.prolang
where n.nspname = 'jetnity_reporting'
  and p.proname = 'account_counts_v1'
  and p.pronargs = 0;
`

export const WRAPPER_CATALOG_SQL = `
select json_build_object(
  ${FUNCTION_CATALOG_FIELDS}
)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_language l on l.oid = p.prolang
where n.nspname = 'public'
  and p.proname = 'admin_account_counts_v1'
  and p.pronargs = 0;
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

export const EXPECTED_PRODUCER_RESULT = 'TABLE(present_registered_accounts bigint, created_in_prior_30_days bigint, measured_at timestamp with time zone, window_start timestamp with time zone, definition_version text)'
export const EXPECTED_WRAPPER_RESULT = 'TABLE(present_registered_accounts text, created_in_prior_30_days text, measured_at timestamp with time zone, window_start timestamp with time zone, definition_version text)'

const ALLOWED_EXECUTE_GRANTEES = Object.freeze(['postgres', 'authenticated'])
const REQUIRED_EXECUTE_GRANTEES = Object.freeze(['authenticated'])
const FORBIDDEN_EXECUTE_GRANTEES = Object.freeze(['anon', 'public', 'service_role'])
const PRODUCER_BODY_TOKENS = Object.freeze([
  'darf_konten_verwalten',
  '720 hours',
  'auth.uid',
  '42501',
  'public.profiles',
  'auth.users',
])
const WRAPPER_BODY_TOKENS = Object.freeze([
  'jetnity_reporting.account_counts_v1',
])

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

export function requiredCount(value, label) {
  if (value == null || value === '') {
    throw new Error(`${label} is missing; Number(undefined) is not a count`)
  }
  const n = Number(value)
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(`${label} is not a positive finite count: ${value}`)
  }
  return n
}

export function stripSqlComments(sql) {
  const source = String(sql || '')
  let out = ''
  let i = 0
  let inSingle = false
  let dollar = null
  while (i < source.length) {
    if (!inSingle && !dollar && source.startsWith('--', i)) {
      const newline = source.indexOf('\n', i)
      i = newline === -1 ? source.length : newline + 1
      out += '\n'
      continue
    }
    if (!inSingle && !dollar && source.startsWith('/*', i)) {
      const end = source.indexOf('*/', i + 2)
      i = end === -1 ? source.length : end + 2
      out += ' '
      continue
    }
    if (!inSingle && source[i] === '$') {
      const match = source.slice(i).match(/^(\$[A-Za-z0-9_]*\$)/)
      if (match) {
        if (dollar === match[1]) dollar = null
        else if (!dollar) dollar = match[1]
        out += match[1]
        i += match[1].length
        continue
      }
    }
    if (!dollar && source[i] === "'") {
      if (inSingle && source[i + 1] === "'") {
        out += "''"
        i += 2
        continue
      }
      inSingle = !inSingle
      out += "'"
      i += 1
      continue
    }
    out += source[i]
    i += 1
  }
  return out
}

export function extractQuotedSqlBody(definition) {
  const source = String(definition || '')
  const dollar = source.match(/\bAS\s+(\$[A-Za-z0-9_]*\$)([\s\S]*?)\1/i)
  if (dollar) return dollar[2]
  const quoted = source.match(/\bAS\s+'((?:[^']|'')*)'/i)
  if (quoted) return quoted[1].replace(/''/g, "'")
  return source
}

export function executableFunctionBody(definition) {
  const body = extractQuotedSqlBody(definition)
  return stripSqlComments(body).replace(/\s+/g, ' ').trim()
}

export function normalizeTypeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function configText(value) {
  if (Array.isArray(value)) return value.join(',')
  return String(value || '')
}

export function assertManagedSchemaPrereq(prereq) {
  if (!prereq || typeof prereq !== 'object') throw new Error('Managed-schema prerequisite evidence missing')
  const version = String(prereq.server_version || '')
  if (!/\b17\./.test(version) && !String(prereq.server_version_num || '').startsWith('17')) {
    throw new Error(`Local engine is not PostgreSQL 17: ${version || 'unknown'}`)
  }
  requiredCount(prereq.auth_schema, 'auth_schema')
  requiredCount(prereq.migrations_schema, 'migrations_schema')
  return true
}

export function assertTypedAcls(acls, {
  label,
  requiredGrantees = REQUIRED_EXECUTE_GRANTEES,
  allowedGrantees = ALLOWED_EXECUTE_GRANTEES,
  forbiddenGrantees = FORBIDDEN_EXECUTE_GRANTEES,
  privilege = 'EXECUTE',
} = {}) {
  if (!Array.isArray(acls)) {
    throw new Error(`${label} typed ACL evidence is required; execute_roles is not a complete catalog`)
  }
  for (const entry of acls) {
    if (!entry || entry.grantee == null || entry.privilege == null || entry.grantor == null || entry.is_grantable == null) {
      throw new Error(`${label} ACL entries must include grantor, grantee, privilege and grantability`)
    }
    if (String(entry.privilege).toUpperCase() !== privilege) continue
    const grantee = String(entry.grantee)
    if (forbiddenGrantees.includes(grantee) || !allowedGrantees.includes(grantee)) {
      throw new Error(`${label} ${privilege} is granted to unexpected ${grantee}`)
    }
    if (requiredGrantees.includes(grantee) && entry.is_grantable === true) {
      throw new Error(`${label} ${privilege} for ${grantee} must not be grantable`)
    }
  }
  for (const required of requiredGrantees) {
    const found = acls.some((entry) => (
      String(entry.grantee) === required
      && String(entry.privilege).toUpperCase() === privilege
    ))
    if (!found) throw new Error(`${label} required ${privilege} for ${required} is missing`)
  }
  return true
}

export function assertSchemaAccess(schemaAcls, {
  schema,
  requiredUsage = ['authenticated'],
  forbiddenUsage = ['anon', 'public', 'service_role'],
} = {}) {
  if (!Array.isArray(schemaAcls)) {
    throw new Error('schema-access ACL evidence is required')
  }
  const rows = schemaAcls.filter((entry) => entry?.schema === schema && String(entry.privilege).toUpperCase() === 'USAGE')
  for (const required of requiredUsage) {
    if (!rows.some((entry) => entry.grantee === required)) {
      throw new Error(`${schema} USAGE for ${required} is missing`)
    }
  }
  for (const row of rows) {
    if (forbiddenUsage.includes(row.grantee)) {
      throw new Error(`${schema} USAGE is granted to ${row.grantee}`)
    }
    if (row.grantor == null || row.is_grantable == null) {
      throw new Error(`${schema} ACL entries must include grantor and grantability`)
    }
  }
  return true
}

export function assertInstalledRelation(row, {
  schema,
  proname,
  securityDefiner,
  language,
  expectedResult,
  requiredBody = [],
  forbiddenExecute = FORBIDDEN_EXECUTE_GRANTEES,
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
  if (row.nargs == null || Number(row.nargs) !== 0 || String(row.proargtypes || '') !== '') {
    throw new Error(`${proname} signature evidence is missing or is not zero-argument`)
  }
  if (!row.prorettype) throw new Error(`${proname} result type evidence is missing`)
  if (normalizeTypeText(row.prorettype) !== normalizeTypeText(expectedResult)) {
    throw new Error(`${proname} result ${row.prorettype} != ${expectedResult}`)
  }
  if (language && String(row.language || '').toLowerCase() !== language) {
    throw new Error(`${proname} language ${row.language} != ${language}`)
  }
  const cfg = configText(row.config)
  if (!/search_path\s*=\s*pg_catalog/i.test(cfg)) {
    throw new Error(`${proname} search_path is not pinned to pg_catalog`)
  }
  const body = executableFunctionBody(row.definition)
  if (!body || body === 'select 1') {
    throw new Error(`${proname} executable body is not the accepted implementation`)
  }
  for (const token of requiredBody) {
    if (!body.includes(token)) {
      throw new Error(`${proname} executable body does not contain ${token}; comments are not catalog evidence`)
    }
  }
  assertTypedAcls(row.acls, {
    label: proname,
    forbiddenGrantees: forbiddenExecute,
  })
  return { body }
}

export function assertInstalledCatalog(catalog) {
  assertManagedSchemaPrereq(catalog?.prereq)
  if (catalog?.prereq?.schema_acls) {
    assertSchemaAccess(catalog.prereq.schema_acls, { schema: 'jetnity_reporting' })
  } else {
    throw new Error('schema-access ACL evidence is required')
  }
  const producer = assertInstalledRelation(catalog?.producer, {
    schema: 'jetnity_reporting',
    proname: 'account_counts_v1',
    securityDefiner: true,
    language: 'plpgsql',
    expectedResult: EXPECTED_PRODUCER_RESULT,
    requiredBody: PRODUCER_BODY_TOKENS,
  })
  const producerCfg = configText(catalog.producer.config)
  if (!/timezone\s*=\s*UTC/i.test(producerCfg)) {
    throw new Error('Producer TimeZone is not pinned to UTC')
  }
  if (!/'active'/.test(producer.body)) {
    throw new Error('Producer executable body does not enforce caller status active')
  }
  assertInstalledRelation(catalog?.wrapper, {
    schema: 'public',
    proname: 'admin_account_counts_v1',
    securityDefiner: false,
    language: 'sql',
    expectedResult: EXPECTED_WRAPPER_RESULT,
    requiredBody: WRAPPER_BODY_TOKENS,
  })
  return {
    catalogVerified: true,
    hostedParityClaimed: false,
    sourceHashIsNotCatalogPass: true,
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
  const verified = assertInstalledCatalog(catalog)
  return {
    producerSha: sql.producerSha,
    wrapperSha: sql.wrapperSha,
    catalog,
    catalogVerified: verified.catalogVerified,
    hostedParityClaimed: false,
    sourceHashIsNotCatalogPass: true,
  }
}

export function wrapperDropSql() {
  return 'drop function if exists public.admin_account_counts_v1();'
}

export function wrapperRestoreSql({ root = ROOT } = {}) {
  return leseUnveraenderteSql({ root }).wrapperSql
}

export function acceptedCatalogFixture() {
  const sql = leseUnveraenderteSql()
  return {
    prereq: {
      server_version: '17.6',
      timezone: 'UTC',
      auth_schema: 1,
      migrations_schema: 1,
      reporting_schema: 1,
      schema_acls: [
        { schema: 'jetnity_reporting', grantor: 'postgres', grantee: 'authenticated', privilege: 'USAGE', is_grantable: false },
      ],
    },
    producer: {
      schema: 'jetnity_reporting',
      proname: 'account_counts_v1',
      owner: 'postgres',
      security_definer: true,
      config: ['search_path=pg_catalog', 'TimeZone=UTC'],
      definition: sql.producerSql,
      nargs: 0,
      proargtypes: '',
      prorettype: EXPECTED_PRODUCER_RESULT,
      language: 'plpgsql',
      acls: [
        { grantor: 'postgres', grantee: 'authenticated', privilege: 'EXECUTE', is_grantable: false },
      ],
    },
    wrapper: {
      schema: 'public',
      proname: 'admin_account_counts_v1',
      owner: 'postgres',
      security_definer: false,
      config: ['search_path=pg_catalog'],
      definition: sql.wrapperSql,
      nargs: 0,
      proargtypes: '',
      prorettype: EXPECTED_WRAPPER_RESULT,
      language: 'sql',
      acls: [
        { grantor: 'postgres', grantee: 'authenticated', privilege: 'EXECUTE', is_grantable: false },
      ],
    },
  }
}
