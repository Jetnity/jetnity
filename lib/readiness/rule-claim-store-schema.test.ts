// lib/readiness/rule-claim-store-schema.test.ts
//
// Static contract for the accepted Rule Claim persistence migration.
// Reads the migration text. Does not open Supabase and does not apply SQL.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { TRAVELLER_CONTEXT_GRENZEN } from '@/lib/readiness/domain'
import { OFFICIAL_ACTION_PURPOSES, OFFICIAL_VISA_MODES } from '@/lib/readiness/official'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import {
  AUFENTHALT_WERT_MAX,
  REGEL_EVIDENCE_QUALITAETEN,
  REGEL_FAKT_ARTEN,
  REGEL_SCOPE_PRAEFIX,
  REGEL_TRANSIT_MINUTEN_MAX,
} from '@/lib/readiness/rule-claims'
import {
  OFFICIAL_TEMPORAL_ANCHORS,
  OFFICIAL_TEMPORAL_DUE_SEMANTICS,
  OFFICIAL_TEMPORAL_KIND,
  OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES,
  OFFICIAL_TEMPORAL_RELATIONS,
} from '@/lib/readiness/temporal'
import { OFFICIAL_REQUIREMENT_TYPES, TRAVELLER_DOCUMENT_TYPES } from '@/types/trips'

const ROOT = process.cwd()
const MIGRATION_DIR = join(ROOT, 'supabase/migrations')
const MIGRATION_SUFFIX = '_official_truth_accepted_rule_claim_persistence_schema_1.sql'
const API_ROLES = ['public', 'anon', 'authenticated', 'service_role'] as const

const CLAIM_TABLES = [
  'official_rule_claims',
  'official_rule_claim_support',
  'official_rule_claim_requirement_effect',
  'official_rule_claim_visa_options',
  'official_rule_claim_stay_limit',
  'official_rule_claim_passport_validity',
  'official_rule_claim_blank_pages',
  'official_rule_claim_transit_paths',
  'official_rule_claim_actions',
  'official_rule_claim_temporal_rule',
] as const

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
  'phone',
  'full_name',
  'given_name',
  'family_name',
  'primary_citizenship',
  'default_citizenship',
  'preferred_citizenship',
  'primary_passport',
  'default_passport',
  'preferred_passport',
  'proposal',
  'kandidat',
  'candidate',
] as const

function migrationFile(): { name: string; sql: string } {
  const names = readdirSync(MIGRATION_DIR).filter((name) => name.endsWith(MIGRATION_SUFFIX))
  assert.equal(names.length, 1)
  assert.match(names[0], /^\d{14}_official_truth_accepted_rule_claim_persistence_schema_1\.sql$/)
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

function quotedIn(body: string, column: string): string[] {
  const match = body.match(new RegExp(`${column}\\s+in\\s*\\(([\\s\\S]*?)\\)`, 'i'))
  assert.ok(match, `${column} in (...)`)
  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1])
}

function annehmbareQualitaet(): string[] {
  const source = readFileSync(join(ROOT, 'lib/readiness/rule-claims.ts'), 'utf8')
  const match = source.match(/const ANNEHMBARE_QUALITAET = \[([\s\S]*?)\] as const/)
  assert.ok(match, 'ANNEHMBARE_QUALITAET')
  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1])
}

describe('accepted rule claim persistence schema', () => {
  const datei = migrationFile()
  const sql = ohneKommentare(datei.sql)

  test('one repository migration and no runtime side channel', () => {
    const creates = [
      ...sql.matchAll(
        /\bcreate\s+(?:or\s+replace\s+)?(?:unique\s+)?(schema|table|function|index|trigger|policy|extension|view|type|role|sequence|publication)\b/gi,
      ),
    ].map((match) => match[1].toLowerCase())
    const count = (kind: string) => creates.filter((item) => item === kind).length
    assert.equal(count('table'), CLAIM_TABLES.length)
    assert.equal(count('schema'), 0)
    assert.equal(count('function'), 0)
    assert.equal(count('trigger'), 0)
    assert.equal(count('policy'), 0)
    assert.equal(count('extension'), 0)
    assert.equal(count('view'), 0)
    assert.equal(count('type'), 0)
    assert.equal(count('role'), 0)
    assert.equal(count('sequence'), 0)
    assert.equal(count('publication'), 0)
    assert.equal(count('index'), 0)

    assert.deepEqual(
      [...sql.matchAll(/\bcreate\s+table\s+([a-z0-9_.]+)/gi)].map((match) => match[1].toLowerCase()),
      CLAIM_TABLES.map((name) => `private.${name}`),
    )
    assert.doesNotMatch(sql, /\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?public\./i)
    assert.doesNotMatch(sql, /\bcreate\s+(?:or\s+replace\s+)?function\s+public\./i)
    assert.doesNotMatch(sql, /\bsecurity\s+definer\b/i)
    assert.doesNotMatch(sql, /\binsert\s+into\b/i)
    assert.doesNotMatch(sql, /\bcopy\b/i)
    assert.doesNotMatch(sql, /\bgrant\b/i)
    assert.doesNotMatch(sql, /\bjsonb\b/i)
    assert.doesNotMatch(sql, /\bcount\s*\(/i)
    assert.doesNotMatch(
      sql,
      /\bpg_cron\b|\bcron\.schedule\b|\bpgmq\b|\bpg_net\b|\bnet\.http\b|\bhttp_get\b|\bhttp_post\b|\bextensions\.http\b/i,
    )
    assert.equal(requirementsProviderAus(), null)
  })

  test('new tables are forced RLS, ungranted, and non-personal', () => {
    for (const role of API_ROLES) {
      for (const table of CLAIM_TABLES) {
        assert.match(sql, new RegExp(`revoke all on table private\\.${table} from ${role}\\b`, 'i'))
      }
    }
    for (const table of CLAIM_TABLES) {
      assert.match(sql, new RegExp(`alter table private\\.${table} enable row level security`, 'i'))
      assert.match(sql, new RegExp(`alter table private\\.${table} force row level security`, 'i'))
    }
    assert.doesNotMatch(sql, /\bcreate\s+policy\b/i)

    const columns = CLAIM_TABLES.flatMap((table) =>
      columnNames(extractParen(sql, `create table private.${table}`)),
    )
    for (const name of FORBIDDEN_COLUMNS) assert.equal(columns.includes(name), false, name)
    assert.doesNotMatch(columns.join(' '), /primary_|default_|preferred_/)

    const config = readFileSync(join(ROOT, 'supabase/config.toml'), 'utf8')
    assert.match(config, /schemas = \["public", "graphql_public"\]/)
    assert.doesNotMatch(config, /schemas = \[[^\]]*private/)
  })

  test('evidence gains a v1 rule scope key and the v2 lookup key stays untouched', () => {
    assert.equal(REGEL_SCOPE_PRAEFIX, 'rule-scope:v1:')
    assert.match(
      sql,
      /alter table private\.official_evidence_versions\s+add column rule_scope_key text not null/i,
    )
    const format = extractParen(sql, 'official_evidence_versions_rule_scope_key_format')
    assert.match(format, /\^rule-scope:v1:\[a-f0-9\]\{64\}\$/)
    const supportKey = extractParen(sql, 'official_evidence_versions_support_fk_key')
    assert.match(supportKey, /version_id/i)
    assert.match(supportKey, /rule_scope_key/i)
    assert.match(supportKey, /lifecycle/i)
    assert.match(supportKey, /validation_state/i)
    assert.match(supportKey, /source_id/i)
    assert.match(sql, /official_sources_id_and_class_key[\s\S]*unique \(source_id, source_class\)/i)

    assert.doesNotMatch(sql, /evidence-key/i)
    assert.doesNotMatch(sql, /lookup_key/i)
    assert.doesNotMatch(sql, /\bdrop\s+constraint\b/i)
    const evidenceSource = readFileSync(join(ROOT, 'lib/readiness/evidence.ts'), 'utf8')
    assert.match(evidenceSource, /const SUCHSCHLUESSEL_VERSION = 'evidence-key:v2:'/)
    const evidenceMigration = readdirSync(MIGRATION_DIR).filter((name) =>
      name.endsWith('_official_truth_private_evidence_store_schema_1.sql'),
    )
    assert.equal(evidenceMigration.length, 1)
    const evidenceSql = readFileSync(join(MIGRATION_DIR, evidenceMigration[0]), 'utf8')
    assert.match(evidenceSql, /lookup_key ~ '\^evidence-key:v2:\[a-f0-9\]\{64\}\$'/)
  })

  test('accepted claims use the closed fact and quality lists', () => {
    const claims = extractParen(sql, 'create table private.official_rule_claims')
    assert.match(claims, /claim_id bigint generated always as identity/i)
    assert.match(claims, /accepted_at timestamptz not null/i)
    assert.doesNotMatch(claims, /accepted_at timestamptz not null default/i)
    assert.match(extractParen(sql, 'constraint official_rule_claims_lifecycle check'), /lifecycle = 'accepted'/)
    assert.match(extractParen(sql, 'constraint official_rule_claims_validation_state check'), /validation_state = 'valid'/)

    const facts = extractParen(sql, 'constraint official_rule_claims_fact_kind check')
    assert.deepEqual(quotedIn(facts, 'fact_kind'), [...REGEL_FAKT_ARTEN])

    const accepted = annehmbareQualitaet()
    assert.deepEqual(accepted, ['explicit_primary_statement', 'composed_from_multiple_primary_sources'])
    const quality = extractParen(sql, 'constraint official_rule_claims_evidence_quality check')
    assert.deepEqual(quotedIn(quality, 'evidence_quality'), accepted)
    for (const rejected of REGEL_EVIDENCE_QUALITAETEN) {
      if (!accepted.includes(rejected)) assert.equal(quotedIn(quality, 'evidence_quality').includes(rejected), false, rejected)
    }

    const requirement = extractParen(sql, 'constraint official_rule_claims_requirement_type check')
    assert.deepEqual(quotedIn(requirement, 'requirement_type'), [...OFFICIAL_REQUIREMENT_TYPES])
    const binds = extractParen(sql, 'constraint official_rule_claims_kind_binds_type check')
    assert.match(binds, /fact_kind = 'visa_options'\s+and\s+requirement_type = 'visa'/i)
    assert.match(binds, /fact_kind = 'passport_validity'\s+and\s+requirement_type = 'passport_validity'/i)
    assert.match(binds, /fact_kind = 'blank_passport_pages'\s+and\s+requirement_type = 'blank_passport_pages'/i)
    assert.match(binds, /fact_kind = 'transit_conditions'\s+and\s+requirement_type = 'transit'/i)
    assert.match(sql, /official_rule_claims_one_accepted_fact unique \(rule_scope_key, fact_kind\)/i)
  })

  test('scope checks fail closed the same way as the evidence store', () => {
    const credential = extractParen(sql, 'constraint official_rule_claims_credential_option check')
    assert.deepEqual(quotedIn(credential, 'document_type'), [...TRAVELLER_DOCUMENT_TYPES])
    const optionAt = credential.toLowerCase().indexOf("credential_option_mode = 'option'")
    assert.ok(optionAt > 0)
    const option = credential.slice(optionAt)
    const credentialAbsent = credential.slice(0, optionAt)
    assert.match(option, /document_type is not null\s+and\s+document_type in \(/i)
    assert.match(option, /issuing_country_code is not null\s+and\s+issuing_country_code ~/i)
    assert.match(option, /related_citizenship_country_code is null\s+or\s*\(/i)
    assert.match(option, /related_citizenship_country_code = any \(citizenship_country_codes\)/i)
    assert.doesNotMatch(credential, /related_citizenship_country_code\s*=\s*issuing_country_code/i)
    assert.match(credentialAbsent, /document_type is null/i)
    assert.match(credentialAbsent, /issuing_country_code is null/i)
    assert.doesNotMatch(credentialAbsent, /document_type is not null/i)

    const citizenship = extractParen(sql, 'constraint official_rule_claims_citizenship_set check')
    assert.match(
      citizenship,
      new RegExp(`cardinality\\(citizenship_country_codes\\) <= ${TRAVELLER_CONTEXT_GRENZEN.citizenshipsJeTraveller}\\b`),
    )
    assert.match(citizenship, /citizenship_country_codes\[1\] < citizenship_country_codes\[2\]/i)

    const residence = extractParen(sql, 'constraint official_rule_claims_residence check')
    const requiredAt = residence.toLowerCase().indexOf("residence_mode = 'required'")
    assert.match(residence.slice(requiredAt), /residence_country_code is not null\s+and\s+residence_country_code ~/i)
    assert.match(residence.slice(0, requiredAt), /residence_country_code is null/i)
    assert.doesNotMatch(residence.slice(0, requiredAt), /residence_country_code is not null/i)

    const scope = extractParen(sql, 'constraint official_rule_claims_validity_scope check')
    const travelAt = scope.toLowerCase().indexOf("validity_mode = 'travel_date'")
    assert.match(scope.slice(travelAt), /travel_date is not null\s+and\s+travel_date ~/i)
    assert.match(scope.slice(0, travelAt), /travel_date is null/i)
    assert.match(scope, /official_evidence_validity_instant\(travel_date\) is not null/i)

    const target = extractParen(sql, 'constraint official_rule_claims_target check')
    assert.match(target, /destination_country_code is not null/i)
    assert.match(target, /transit_country_code is not null/i)
    assert.match(target, /\^\[A-Z\]\{2\}\$/)
  })

  test('support foreign keys require accepted valid same scope and official authority', () => {
    const support = extractParen(sql, 'create table private.official_rule_claim_support')
    assert.match(support, /primary key \(claim_id, version_id\)/i)
    assert.match(support, /evidence_lifecycle = 'accepted'/i)
    assert.match(support, /evidence_validation_state = 'valid'/i)
    assert.match(support, /source_class = 'official_authority'/i)
    assert.match(support, /\^rule-scope:v1:\[a-f0-9\]\{64\}\$/)
    assert.match(
      support,
      /references private\.official_rule_claims \(\s*claim_id,\s*rule_scope_key\s*\)/i,
    )
    assert.match(
      support,
      /references private\.official_evidence_versions \(\s*version_id,\s*rule_scope_key,\s*lifecycle,\s*validation_state,\s*source_id\s*\)/i,
    )
    assert.match(
      support,
      /references private\.official_sources \(\s*source_id,\s*source_class\s*\)/i,
    )
    assert.doesNotMatch(sql, /licensed_evidence_provider/i)
  })

  test('visa effect and visa options follow the current contract', () => {
    const effect = extractParen(sql, 'constraint official_rule_claim_requirement_effect_effect check')
    assert.deepEqual(quotedIn(effect, 'effect'), ['required', 'not_required', 'conditional'])
    const effectMode = extractParen(sql, 'constraint official_rule_claim_requirement_effect_visa_mode check')
    assert.match(effectMode, /requirement_type <> 'visa'\s+and\s+visa_mode is null/i)
    assert.deepEqual(quotedIn(effectMode, 'visa_mode'), [...OFFICIAL_VISA_MODES])
    const contradiction = extractParen(sql, 'constraint official_rule_claim_requirement_effect_contradiction check')
    assert.match(contradiction, /effect = 'required'\s+and\s+visa_mode = 'visa_exempt'/i)
    assert.match(contradiction, /effect = 'not_required'/i)
    assert.match(contradiction, /'visa_on_arrival',\s*'electronic_visa',\s*'visa_before_travel'/i)

    const options = extractParen(sql, 'create table private.official_rule_claim_visa_options')
    assert.match(options, /requirement_type = 'visa'/i)
    assert.match(options, /ordinal between 1 and 4/i)
    assert.match(options, /unique \(claim_id, visa_mode\)/i)
    const optionMode = extractParen(sql, 'constraint official_rule_claim_visa_options_visa_mode check')
    assert.deepEqual(
      quotedIn(optionMode, 'visa_mode'),
      OFFICIAL_VISA_MODES.filter((mode) => mode !== 'unknown'),
    )
    assert.deepEqual(quotedIn(extractParen(sql, 'constraint official_rule_claim_visa_options_eligibility check'), 'eligibility'), [
      'allowed',
      'not_allowed',
      'unknown',
    ])
    assert.deepEqual(quotedIn(extractParen(sql, 'constraint official_rule_claim_visa_options_mandate check'), 'mandate'), [
      'mandatory',
      'not_mandatory',
      'unknown',
    ])
  })

  test('stay, passport, blank pages and transit keep typed bounds', () => {
    for (const unit of ['days', 'months', 'years'] as const) {
      assert.match(sql, new RegExp(`'${unit}' and [a-z0-9_]+ between 1 and ${AUFENTHALT_WERT_MAX[unit]}\\b`))
    }
    assert.doesNotMatch(sql, /\*\s*30\b|\*\s*365\b|\*\s*12\b/)
    assert.match(sql, /rolling_maximum_unit is distinct from rolling_within_unit/i)
    assert.match(sql, /rolling_within_value > rolling_maximum_value/i)
    assert.match(
      extractParen(sql, 'constraint official_rule_claim_stay_limit_some_duration check'),
      /per_visit_value is not null[\s\S]*rolling_maximum_value is not null[\s\S]*initial_grant_value is not null[\s\S]*extension_maximum_total_value is not null/i,
    )
    assert.deepEqual(quotedIn(extractParen(sql, 'constraint official_rule_claim_stay_limit_border check'), 'border_discretion'), [
      'fixed',
      'may_be_shorter',
      'determined_at_border',
    ])

    const passport = extractParen(sql, 'constraint official_rule_claim_passport_validity_duration check')
    assert.match(passport, /semantics in \('valid_on_entry', 'valid_through_stay'\)/i)
    assert.match(passport, /duration_value is null\s+and\s+duration_unit is null/i)
    assert.match(passport, /duration_value is not null\s+and\s+duration_unit is not null/i)
    assert.match(passport, /between 1 and 3660/i)
    assert.deepEqual(
      quotedIn(extractParen(sql, 'constraint official_rule_claim_passport_validity_semantics check'), 'semantics'),
      [
        'valid_on_entry',
        'valid_through_stay',
        'minimum_remaining_from_entry',
        'minimum_remaining_from_planned_departure',
        'minimum_remaining_at_application',
        'expired_document_exception',
      ],
    )
    assert.match(sql, /requirement_type = 'passport_validity'/i)
    assert.match(sql, /minimum_pages between 1 and 10/i)
    assert.match(sql, /requirement_type = 'blank_passport_pages'/i)

    assert.match(sql, /ordinal between 1 and 8/i)
    assert.match(sql, /arrival_mode in \('air', 'land', 'sea'\)/i)
    assert.match(sql, /departure_mode in \('air', 'land', 'sea'\)/i)
    assert.match(sql, new RegExp(`max_transit_duration_minutes between 1 and ${REGEL_TRANSIT_MINUTEN_MAX}\\b`))
    assert.equal(REGEL_TRANSIT_MINUTEN_MAX, 14 * 24 * 60)
    assert.match(sql, /cardinality\(transit_airport_codes\) between 1 and 16/i)
    assert.equal(
      sql.includes("transit_airport_codes::text ~ '^\\{[A-Z]{3}(,[A-Z]{3}){0,15}\\}$'"),
      true,
    )
    assert.match(
      extractParen(sql, 'constraint official_rule_claim_transit_paths_some_condition check'),
      /crosses_border_control is not null[\s\S]*onward_ticket_required is not null/i,
    )
  })

  test('official actions and temporal rules stay synchronized with the TypeScript constants', () => {
    const actions = extractParen(sql, 'create table private.official_rule_claim_actions')
    assert.match(actions, /ordinal between 1 and 4/i)
    assert.match(actions, /source_class = 'official_authority'/i)
    assert.match(actions, /references private\.official_sources \(\s*source_id,\s*source_class\s*\)/i)
    assert.match(actions, /requirement_type <> 'visa'\s+and\s+visa_mode is null/i)
    assert.deepEqual(quotedIn(extractParen(sql, 'constraint official_rule_claim_actions_purpose check'), 'purpose'), [
      ...OFFICIAL_ACTION_PURPOSES,
    ])
    const actionMode = extractParen(sql, 'constraint official_rule_claim_actions_visa_mode check')
    assert.deepEqual(
      quotedIn(actionMode, 'visa_mode'),
      OFFICIAL_VISA_MODES.filter((mode) => mode !== 'unknown'),
    )
    assert.match(extractParen(sql, 'constraint official_rule_claim_actions_href check'), /\^https:\/\//)

    const temporal = extractParen(sql, 'create table private.official_rule_claim_temporal_rule')
    assert.match(temporal, new RegExp(`temporal_kind = '${OFFICIAL_TEMPORAL_KIND}'`))
    const available = extractParen(sql, 'constraint official_rule_claim_temporal_rule_available check')
    assert.deepEqual(quotedIn(available, 'available_from_anchor'), [...OFFICIAL_TEMPORAL_ANCHORS])
    assert.deepEqual(quotedIn(available, 'available_from_relation'), [...OFFICIAL_TEMPORAL_RELATIONS])
    assert.match(available, /available_from_relation = 'at' and available_from_offset_minutes = 0/i)
    assert.match(available, new RegExp(`between 1 and ${OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES}\\b`))
    const due = extractParen(sql, 'constraint official_rule_claim_temporal_rule_due check')
    assert.deepEqual(quotedIn(due, 'due_by_anchor'), [...OFFICIAL_TEMPORAL_ANCHORS])
    assert.deepEqual(quotedIn(due, 'due_by_relation'), [...OFFICIAL_TEMPORAL_RELATIONS])
    assert.deepEqual(quotedIn(due, 'due_by_semantics'), [...OFFICIAL_TEMPORAL_DUE_SEMANTICS])
    assert.match(extractParen(sql, 'constraint official_rule_claim_temporal_rule_some_group check'), /available_from_anchor is not null/i)
    assert.match(extractParen(sql, 'constraint official_rule_claim_temporal_rule_same_anchor check'), /when 'before' then -available_from_offset_minutes/i)
    assert.equal(OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES, 2 * 365 * 24 * 60)
  })
})
