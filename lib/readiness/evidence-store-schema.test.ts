// lib/readiness/evidence-store-schema.test.ts
//
// Static contract for the private Official Evidence migration.
// Reads the migration text. Does not open Supabase and does not apply SQL.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { TRAVELLER_CONTEXT_GRENZEN } from '@/lib/readiness/domain'
import { EVIDENCE_LIFECYCLES, EVIDENCE_VALIDATION_STATES } from '@/lib/readiness/evidence'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import { QUELLEN_KLASSEN } from '@/lib/readiness/source-registry'
import { OFFICIAL_REQUIREMENT_TYPES, TRAVELLER_DOCUMENT_TYPES } from '@/types/trips'

const ROOT = process.cwd()
const MIGRATION_DIR = join(ROOT, 'supabase/migrations')
const MIGRATION_SUFFIX = '_official_truth_private_evidence_store_schema_1.sql'

const API_ROLES = ['public', 'anon', 'authenticated', 'service_role'] as const

const FORBIDDEN_COLUMNS = [
  'user_id',
  'account_id',
  'trip_id',
  'traveller_id',
  'traveller_client_ref',
  'passport_number',
  'document_number',
  'mrz',
  'biometric',
  'biometrics',
  'date_of_birth',
  'dob',
  'birth_date',
  'health_record',
  'email',
  'full_name',
  'given_name',
  'family_name',
  'primary_citizenship',
  'default_citizenship',
  'preferred_citizenship',
  'primary_passport',
  'default_passport',
  'preferred_passport',
  'result',
  'not_required',
  'visa_mode',
] as const

function migrationFile(): { name: string; sql: string } {
  const names = readdirSync(MIGRATION_DIR).filter((name) => name.endsWith(MIGRATION_SUFFIX))
  assert.deepEqual(names.length, 1)
  assert.match(names[0], /^\d{14}_official_truth_private_evidence_store_schema_1\.sql$/)
  return { name: names[0], sql: readFileSync(join(MIGRATION_DIR, names[0]), 'utf8') }
}

function ohneKommentare(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ')
}

function extractParen(sql: string, marker: string): string {
  const at = sql.toLowerCase().indexOf(marker.toLowerCase())
  assert.ok(at >= 0, marker)
  const open = sql.indexOf('(', at)
  assert.ok(open > at, marker)
  let depth = 0
  for (let i = open; i < sql.length; i += 1) {
    if (sql[i] === '(') depth += 1
    else if (sql[i] === ')') {
      depth -= 1
      if (depth === 0) return sql.slice(open + 1, i)
    }
  }
  assert.fail(`unclosed ${marker}`)
}

function columnNames(body: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const char of body) {
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (char === ',' && depth === 0) {
      parts.push(current)
      current = ''
    } else {
      current += char
    }
  }
  parts.push(current)
  return parts
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !/^constraint\b/i.test(part))
    .map((part) => part.split(/\s+/)[0].toLowerCase())
}

function funktionsBody(sql: string): string {
  const match = sql.match(
    /create function private\.official_evidence_validity_instant\(wert text\)[\s\S]*?as \$\$([\s\S]*?)\$\$/i,
  )
  assert.ok(match, 'validity helper body')
  return match[1]
}

function quotedIn(body: string, column: string): string[] {
  const match = body.match(new RegExp(`${column}\\s+in\\s*\\(([\\s\\S]*?)\\)`, 'i'))
  assert.ok(match, `${column} in (...)`)
  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1])
}

describe('private Official Evidence store schema', () => {
  const datei = migrationFile()
  const sql = ohneKommentare(datei.sql)

  test('migration creates only the private Official Evidence objects', () => {
    const creates = [...sql.matchAll(/\bcreate\s+(?:or\s+replace\s+)?(?:unique\s+)?(schema|table|function|index|trigger|policy|extension|view|type|role|sequence|publication)\b/gi)]
      .map((match) => match[1].toLowerCase())
    const count = (kind: string) => creates.filter((item) => item === kind).length
    assert.equal(count('schema'), 1)
    assert.equal(count('function'), 1)
    assert.equal(count('table'), 3)
    assert.equal(count('index'), 5)
    assert.equal(count('trigger'), 0)
    assert.equal(count('policy'), 0)
    assert.equal(count('extension'), 0)
    assert.equal(count('view'), 0)
    assert.equal(count('role'), 0)
    assert.equal(count('sequence'), 0)
    assert.equal(count('publication'), 0)

    assert.deepEqual(
      [...sql.matchAll(/\bcreate\s+table\s+([a-z0-9_.]+)/gi)].map((match) => match[1].toLowerCase()).sort(),
      [
        'private.official_evidence_versions',
        'private.official_source_domains',
        'private.official_sources',
      ],
    )
    assert.match(sql, /\bcreate\s+function\s+private\.official_evidence_validity_instant\(wert text\)/i)
    assert.doesNotMatch(sql, /\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?public\./i)
    assert.doesNotMatch(sql, /\bcreate\s+(?:or\s+replace\s+)?function\s+public\./i)
    assert.doesNotMatch(sql, /\bsecurity\s+definer\b/i)
    assert.doesNotMatch(sql, /\binsert\s+into\b/i)
    assert.doesNotMatch(sql, /\bcopy\b/i)
    assert.doesNotMatch(sql, /\bgrant\b/i)
    assert.doesNotMatch(sql, /\bpg_cron\b|\bcron\.schedule\b|\bpgmq\b|\bpg_net\b|\bnet\.http\b|\bhttp_get\b|\bhttp_post\b|\bextensions\.http\b/i)
    assert.doesNotMatch(sql, /\bnot_required\b/i)
  })

  test('API roles are revoked and the Data API schema list does not include private', () => {
    for (const role of API_ROLES) {
      assert.match(sql, new RegExp(`revoke all on schema private from ${role}\\b`, 'i'))
      assert.match(sql, new RegExp(`revoke all on function private\\.official_evidence_validity_instant\\(text\\) from ${role}\\b`, 'i'))
      for (const table of ['official_sources', 'official_source_domains', 'official_evidence_versions']) {
        assert.match(sql, new RegExp(`revoke all on table private\\.${table} from ${role}\\b`, 'i'))
      }
    }
    for (const table of ['official_sources', 'official_source_domains', 'official_evidence_versions']) {
      assert.match(sql, new RegExp(`alter table private\\.${table} enable row level security`, 'i'))
      assert.match(sql, new RegExp(`alter table private\\.${table} force row level security`, 'i'))
    }
    assert.doesNotMatch(sql, /\bcreate\s+policy\b/i)

    const config = readFileSync(join(ROOT, 'supabase/config.toml'), 'utf8')
    assert.match(config, /schemas = \["public", "graphql_public"\]/)
    assert.doesNotMatch(config, /schemas = \[[^\]]*private/)
  })

  test('columns stay non-personal and match the typed scope', () => {
    const sources = columnNames(extractParen(sql, 'create table private.official_sources'))
    const domains = columnNames(extractParen(sql, 'create table private.official_source_domains'))
    const versions = columnNames(extractParen(sql, 'create table private.official_evidence_versions'))
    assert.deepEqual(sources, ['source_id', 'source_class', 'publisher_name', 'authority_name', 'registered_at'])
    assert.deepEqual(domains, ['source_id', 'domain'])
    assert.deepEqual(versions, [
      'version_id',
      'previous_version_id',
      'lifecycle',
      'validation_state',
      'source_id',
      'canonical_url',
      'retrieved_at',
      'source_content_hash',
      'valid_from',
      'valid_until',
      'lookup_key',
      'extraction_note',
      'destination_country_code',
      'transit_country_code',
      'citizenship_mode',
      'citizenship_country_codes',
      'credential_option_mode',
      'document_type',
      'issuing_country_code',
      'related_citizenship_country_code',
      'residence_mode',
      'residence_country_code',
      'requirement_type',
      'validity_mode',
      'travel_date',
    ])
    const alle = [...sources, ...domains, ...versions]
    for (const name of FORBIDDEN_COLUMNS) assert.equal(alle.includes(name), false, name)
    assert.equal(versions.includes('primary_citizenship'), false)
    assert.equal(requirementsProviderAus(), null)
  })

  test('historical v1 SQL formats coexist with current ev2/v3 runtime and unchanged taxonomy', () => {
    const evidence = readFileSync(join(ROOT, 'lib/readiness/evidence.ts'), 'utf8')
    const registry = readFileSync(join(ROOT, 'lib/readiness/source-registry.ts'), 'utf8')
    // Current live runtime: R2 deliberately supersedes the historical SQL identity.
    const keyPrefix = evidence.match(/const SUCHSCHLUESSEL_VERSION = '([^']+)'/)?.[1]
    const versionPrefix = evidence.match(/const VERSION_PREFIX = '([^']+)'/)?.[1]
    assert.equal(keyPrefix, 'evidence-key:v3:')
    assert.equal(versionPrefix, 'ev2_')
    assert.match(registry, /\/\^\[a-z\]\[a-z0-9_-\]\{1,63\}\$\//)

    const requirement = extractParen(sql, 'constraint official_evidence_versions_requirement_type check')
    const lifecycle = extractParen(sql, 'constraint official_evidence_versions_lifecycle check')
    const validation = extractParen(sql, 'constraint official_evidence_versions_validation_state check')
    const sourceClass = extractParen(sql, 'constraint official_sources_source_class check')
    const credential = extractParen(sql, 'constraint official_evidence_versions_credential_option check')
    assert.deepEqual(quotedIn(requirement, 'requirement_type'), [...OFFICIAL_REQUIREMENT_TYPES])
    assert.deepEqual(quotedIn(lifecycle, 'lifecycle'), [...EVIDENCE_LIFECYCLES])
    assert.deepEqual(quotedIn(validation, 'validation_state'), [...EVIDENCE_VALIDATION_STATES])
    assert.deepEqual(quotedIn(sourceClass, 'source_class'), [...QUELLEN_KLASSEN])
    assert.deepEqual(quotedIn(credential, 'document_type'), [...TRAVELLER_DOCUMENT_TYPES])

    // Immutable historical v1 migration contract; these formats are not live authority.
    const version = extractParen(sql, 'constraint official_evidence_versions_version_id_format check')
    const lookup = extractParen(sql, 'constraint official_evidence_versions_lookup_key check')
    const hash = extractParen(sql, 'constraint official_evidence_versions_hash check')
    const sourceId = extractParen(sql, 'constraint official_sources_source_id_format check')
    assert.match(version, /\^ev1_\[a-f0-9\]\{32\}\$/)
    assert.match(lookup, /\^evidence-key:v2:\[a-f0-9\]\{64\}\$/)
    assert.match(hash, /\^\[a-f0-9\]\{64\}\$/)
    assert.match(sourceId, /\^\[a-z\]\[a-z0-9_-\]\{1,63\}\$/)
  })

  test('issuer stays separate from citizenship and the relation must be in the set', () => {
    const credential = extractParen(sql, 'constraint official_evidence_versions_credential_option check')
    assert.match(credential, /credential_option_mode = 'not_applicable'/i)
    assert.match(credential, /issuing_country_code is null/i)
    assert.match(credential, /related_citizenship_country_code is null/i)
    assert.match(credential, /credential_option_mode = 'option'/i)
    assert.match(credential, /citizenship_mode = 'required'/i)
    assert.match(credential, /related_citizenship_country_code = any \(citizenship_country_codes\)/i)
    assert.doesNotMatch(credential, /related_citizenship_country_code\s*=\s*issuing_country_code/i)

    const citizenship = extractParen(sql, 'constraint official_evidence_versions_citizenship_set check')
    assert.match(citizenship, /citizenship_mode in \('not_applicable', 'required'\)/i)
    assert.match(
      citizenship,
      new RegExp(`cardinality\\(citizenship_country_codes\\) <= ${TRAVELLER_CONTEXT_GRENZEN.citizenshipsJeTraveller}\\b`),
    )
    assert.match(citizenship, /citizenship_country_codes\[1\] < citizenship_country_codes\[2\]/i)

    const target = extractParen(sql, 'constraint official_evidence_versions_target check')
    assert.match(target, /destination_country_code is not null/i)
    assert.match(target, /transit_country_code is not null/i)
    assert.match(target, /\^\[A-Z\]\{2\}\$/)
    assert.doesNotMatch(sql, /ist_katalogland/i)
  })

  test('mode checks fail closed when a required child is null', () => {
    const credential = extractParen(sql, 'constraint official_evidence_versions_credential_option check')
    const optionAt = credential.toLowerCase().indexOf("credential_option_mode = 'option'")
    assert.ok(optionAt > 0)
    const option = credential.slice(optionAt)
    const credentialAbsent = credential.slice(0, optionAt)
    assert.match(option, /document_type is not null\s+and\s+document_type in \(/i)
    assert.match(option, /issuing_country_code is not null\s+and\s+issuing_country_code ~/i)
    assert.match(option, /related_citizenship_country_code is null\s+or\s*\(/i)
    assert.match(credentialAbsent, /document_type is null/i)
    assert.match(credentialAbsent, /issuing_country_code is null/i)
    assert.match(credentialAbsent, /related_citizenship_country_code is null/i)
    assert.doesNotMatch(credentialAbsent, /document_type is not null/i)
    assert.doesNotMatch(credentialAbsent, /issuing_country_code is not null/i)

    const residence = extractParen(sql, 'constraint official_evidence_versions_residence check')
    const requiredAt = residence.toLowerCase().indexOf("residence_mode = 'required'")
    assert.ok(requiredAt > 0)
    assert.match(
      residence.slice(requiredAt),
      /residence_country_code is not null\s+and\s+residence_country_code ~/i,
    )
    const residenceAbsent = residence.slice(0, requiredAt)
    assert.match(residenceAbsent, /residence_country_code is null/i)
    assert.doesNotMatch(residenceAbsent, /residence_country_code is not null/i)

    const scope = extractParen(sql, 'constraint official_evidence_versions_validity_scope check')
    const travelAt = scope.toLowerCase().indexOf("validity_mode = 'travel_date'")
    assert.ok(travelAt > 0)
    assert.match(scope.slice(travelAt), /travel_date is not null\s+and\s+travel_date ~/i)
    const scopeAbsent = scope.slice(0, travelAt)
    assert.match(scopeAbsent, /travel_date is null/i)
    assert.doesNotMatch(scopeAbsent, /travel_date is not null/i)
  })

  test('date-only and instant validity stay lossless text', () => {
    const versions = extractParen(sql, 'create table private.official_evidence_versions')
    assert.match(versions, /\bvalid_from text\b/i)
    assert.match(versions, /\bvalid_until text\b/i)
    assert.match(versions, /\bretrieved_at text not null\b/i)
    assert.doesNotMatch(versions, /\bvalid_from\s+(date|timestamp|timestamptz)\b/i)
    assert.doesNotMatch(versions, /\bvalid_until\s+(date|timestamp|timestamptz)\b/i)
    assert.doesNotMatch(versions, /\bretrieved_at\s+timestamptz\b/i)
    assert.doesNotMatch(sql, /\bgenerated always\b/i)

    const helper = funktionsBody(sql)
    assert.match(sql, /language plpgsql/i)
    assert.match(sql, /\bimmutable\b/i)
    assert.match(sql, /set search_path = pg_catalog/i)
    assert.match(helper, /\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$/)
    assert.match(helper, /T\\d\{2\}:\\d\{2\}:\\d\{2\}/)
    assert.match(helper, /make_timestamptz/i)
    assert.match(helper, /'UTC'/)
    assert.match(helper, /\/ 10/)
    assert.match(helper, /\/ 100/)
    assert.match(helper, /\/ 1000/)

    const retrieved = extractParen(sql, 'constraint official_evidence_versions_retrieved_at check')
    assert.match(retrieved, /T\\d\{2\}:\\d\{2\}:\\d\{2\}/)
    assert.match(retrieved, /official_evidence_validity_instant\(retrieved_at\) is not null/i)
    const window = extractParen(sql, 'constraint official_evidence_versions_validity_window check')
    assert.match(window, /official_evidence_validity_instant\(valid_from\)/i)
    assert.match(window, /official_evidence_validity_instant\(valid_until\)/i)
    const scope = extractParen(sql, 'constraint official_evidence_versions_validity_scope check')
    assert.match(scope, /validity_mode = 'not_applicable'/i)
    assert.match(scope, /validity_mode = 'travel_date'/i)
    assert.match(scope, /travel_date ~ '\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$'/i)
  })

  test('lookup, source history and accepted indexes are present, with no source catalog', () => {
    assert.match(
      sql,
      /create index official_evidence_versions_lookup_retrieved[\s\S]*lookup_key,[\s\S]*official_evidence_validity_instant\(retrieved_at\) desc/i,
    )
    assert.match(
      sql,
      /create index official_evidence_versions_source_history[\s\S]*source_id,[\s\S]*official_evidence_validity_instant\(retrieved_at\) desc/i,
    )
    assert.match(
      sql,
      /create index official_evidence_versions_accepted_lookup[\s\S]*where lifecycle = 'accepted' and validation_state = 'valid'/i,
    )
    const domain = extractParen(sql, 'constraint official_source_domains_domain_shape check')
    assert.match(domain, /\^\[a-z0-9\]\(\[a-z0-9-\]\{0,61\}\[a-z0-9\]\)\?/)
    assert.match(domain, /domain <> 'localhost'/i)
    assert.match(domain, /not like '%\.localhost'/i)
    assert.match(domain, /not like '%\.local'/i)
    assert.match(domain, /\^\[0-9\]\+\(\\\.\[0-9\]\+\)\+\$/)
    const authority = extractParen(sql, 'constraint official_sources_class_authority check')
    assert.match(authority, /source_class = 'official_authority'/i)
    assert.match(authority, /authority_name is not null/i)
    assert.match(authority, /source_class = 'licensed_evidence_provider'/i)
    assert.match(authority, /authority_name is null/i)
    assert.equal(datei.name.endsWith(MIGRATION_SUFFIX), true)
  })
})
