// Disposable PostgreSQL only. No linked Supabase project or inherited DB credentials.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { contentEvidenceLookupV3, contentEvidenceVersionV2, OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY } from './official-truth-content-identity'
import { govukNationalListFixture } from './official-truth-content-identity-r2.test'
import { contentItemRegistrieren } from './official-truth-source-catalog-server'
import { regelScopeAusEvidenceScope } from './rule-claims'

const DIR = join(process.cwd(), 'supabase/migrations')
const PG = '/usr/lib/postgresql/16/bin'
const names = readdirSync(DIR).filter(name => name.endsWith('_official_truth_v2_catalog_hardening_1.sql'))
assert.equal(names.length, 1)
const migration = readFileSync(join(DIR, names[0]!), 'utf8')
const prerequisites = [
  '20261001121258_official_truth_private_evidence_store_schema_1.sql',
  '20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql',
  '20261001180549_official_truth_trusted_store_writer_1.sql',
  '20261001193748_official_truth_source_catalog_gateway_1.sql',
  '20261004010705_official_truth_content_identity_2.sql',
]
const PIN_TABLE = 'private.official_content_identity_profile_pins'
const PROFILE = 'govuk-eta-national-list-content-api-en'
const fixture = govukNationalListFixture()
type Row = Record<string, unknown>
type Role = 'service_role' | 'anon' | 'authenticated'
const snake = (row: object): Row => Object.fromEntries(Object.entries(row).map(([key, value]) =>
  [key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`), value]))
function registration(id = 'eta-national-list', host = 'www.gov.uk'): { operation: string; item: Row; representations: Row[] } {
  const url = id === 'eta-national-list' ? fixture.url : `https://www.gov.uk/synthetic/${id}`
  return { operation: 'register_content_item', item: { ...snake(fixture.item), content_item_id: id,
    external_content_id: id === 'eta-national-list' ? fixture.item.externalContentId : `synthetic-${id}` },
  representations: [{ ...snake(fixture.registration.representations[0]!),
    request_urls: [url.replace('www.gov.uk', host)], expected_final_url: url.replace('www.gov.uk', host) }] }
}
function json(value: unknown) {
  const text = JSON.stringify(value); assert.ok(!text.includes('$fixture$'))
  return `$fixture$${text}$fixture$::jsonb`
}
function catalog(payload: unknown) { return `select public.official_truth_source_catalog_v2(${json(payload)});` }
function store(payload: unknown) { return `select public.official_truth_store_accepted_v2(${json(payload)});` }
const source = { operation: 'register_source', source: snake(fixture.authority.sources[0]!) }
const TABLES = ['official_sources', 'official_source_domains', 'official_source_blocked_domains', 'official_content_items',
  'official_content_item_versions', 'official_content_representations', 'official_content_url_reservations',
  'official_content_representation_urls', 'official_evidence_versions', 'official_rule_claims', 'official_rule_claim_support']
const ROWS = `select jsonb_build_object(${TABLES.map(name => `'${name}',
  (select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text), '[]'::jsonb) from private.${name} t)`).join(',')});`
function cluster() {
  const root = mkdtempSync(join(tmpdir(), 'jetnity-catalog-hardening-'))
  const data = join(root, 'data'), socket = join(root, 'socket')
  mkdirSync(socket)
  const env: NodeJS.ProcessEnv = { PATH: process.env.PATH, LANG: 'C', LC_ALL: 'C', NODE_ENV: 'test' }
  let started = false
  const stop = () => {
    try { if (started) execFileSync(join(PG, 'pg_ctl'), ['-D', data, '-m', 'immediate', 'stop'], { env, stdio: 'ignore' }) }
    finally { rmSync(root, { recursive: true, force: true }) }
  }
  try {
    execFileSync(join(PG, 'initdb'), ['-D', data, '--username=fixture', '--auth-local=trust', '--encoding=UTF8', '--no-locale'], { env, stdio: 'pipe' })
    execFileSync(join(PG, 'pg_ctl'), ['-D', data, '-l', join(root, 'log'), '-w', 'start', '-o',
      `-c listen_addresses= -c unix_socket_directories=${socket} -c shared_buffers=16MB`], { env, stdio: 'pipe' })
    started = true
  } catch (error) { stop(); throw error }
  const run = (db: string, sql: string, role?: Role) => {
    const result = spawnSync(join(PG, 'psql'), ['-X', '--no-psqlrc', '-Atq', '-h', socket, '-U', 'fixture', '-d', db,
      '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose'], {
      env, input: `${role ? `set role ${role};` : ''}\n${sql}`, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
    })
    if (result.error) throw result.error
    return result
  }
  const ok = (db: string, sql: string, role?: Role) => {
    const r = run(db, sql, role); assert.equal(r.status, 0, r.stderr); return r.stdout.trim()
  }
  const fail = (db: string, sql: string, code: string, role?: Role) => {
    const r = run(db, sql, role); assert.notEqual(r.status, 0, r.stdout); assert.ok(r.stderr.includes(code), r.stderr)
    return r.stderr
  }
  const copy = (db: string, template: string) => {
    assert.match(db, /^[a-z_]+$/); assert.match(template, /^[a-z_]+$/)
    ok('postgres', `create database ${db} template ${template};`)
  }
  return { ok, fail, copy, stop }
}

function evidence(id = 'eta-national-list', host = 'www.gov.uk'): Row {
  const reg = registration(id, host), url = reg.representations[0]!.expected_final_url as string
  const scope = { destinationCountryCode: 'GB', transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH'] }, credentialOption: { mode: 'option', documentType: 'passport',
      issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' }, residence: { mode: 'not_applicable' },
    requirementType: 'visa', validity: { mode: 'not_applicable' } }
  const rule = regelScopeAusEvidenceScope(scope)
  const lookup = contentEvidenceLookupV3(scope, { sourceId: 'govuk', contentItemId: id, representationId: 'content-api-en' })
  assert.ok(rule.ok && lookup.ok)
  const identity = contentEvidenceVersionV2({ identitySchema: 2, sourceId: 'govuk', contentItemId: id,
    contentItemVersion: 1, representationId: 'content-api-en', representationVersion: 1, identityProfileId: PROFILE,
    identityProfileVersion: 1, lookupKey: lookup.value.key, canonicalUrl: url, contentType: 'application/json',
    sourceContentHash: 'a'.repeat(64), retrievedAt: '2026-10-04T00:00:00.000Z', validFrom: null, validUntil: null })
  assert.ok(identity.ok)
  return { ...snake(identity.value.identity), version_id: identity.value.versionId, previous_version_id: null,
    lifecycle: 'accepted', validation_state: 'valid', extraction_note: null,
    rule_scope_key: rule.key, destination_country_code: 'GB', transit_country_code: null,
    citizenship_mode: 'required', citizenship_country_codes: ['CH'], credential_option_mode: 'option', document_type: 'passport',
    issuing_country_code: 'CH', related_citizenship_country_code: 'CH', residence_mode: 'not_applicable', residence_country_code: null,
    requirement_type: 'visa', validity_mode: 'not_applicable', travel_date: null }
}
function claim(e: Row) {
  const fields = ['rule_scope_key', 'destination_country_code', 'transit_country_code', 'citizenship_mode', 'citizenship_country_codes',
    'credential_option_mode', 'document_type', 'issuing_country_code', 'related_citizenship_country_code', 'residence_mode',
    'residence_country_code', 'requirement_type', 'validity_mode', 'travel_date']
  return { operation: 'accepted_rule_claim', accepted_at: '2026-10-04T00:05:00.000Z', claim: {
    ...Object.fromEntries(fields.map(key => [key, e[key]])), lifecycle: 'accepted', validation_state: 'valid',
    fact_kind: 'requirement_effect', evidence_quality: 'explicit_primary_statement', support_version_ids: [e.version_id],
    fact: { effect: 'required', visa_mode: 'visa_before_travel' },
  } }
}

test('catalog hardening migration is a single transaction with no identity rewrite or runtime profile writer', () => {
  assert.match(names[0]!, /^\d{14}_official_truth_v2_catalog_hardening_1\.sql$/)
  const sql = migration.replace(/--[^\n]*/g, '')
  assert.match(sql, /^\s*begin;/); assert.match(sql, /commit;\s*$/)
  const outside = sql.replace(/\$fn\$[\s\S]*?\$fn\$/g, '')
  assert.equal((outside.match(/insert into/gi) ?? []).length, 1)
  assert.doesNotMatch(sql, /\b(delete\s+from|update\s+private|truncate\s+table|drop\s+table|disable\s+trigger|create\s+policy)\b/i)
  assert.doesNotMatch(sql, /security\s+definer[\s\S]*?function\s+public\.[a-z_]*profile/i)
  // The existing catalog body changes only by adding the pre-replay pin check.
  const old = readFileSync(join(DIR, prerequisites[4]!), 'utf8')
  const definition = (text: string) => text.match(/create (?:or replace )?function public\.official_truth_source_catalog_v2\([\s\S]*?\$fn\$;/)![0]
    .replace('create or replace function', 'create function')
  const addition = /      -- Inert availability only\.[\s\S]*?end if;\n/
  assert.match(definition(migration), addition)
  assert.equal(definition(migration).replace(addition, ''), definition(old))
})

test('catalog hardening: disposable PostgreSQL upgrade, raw RPC and eligibility proof', { timeout: 180_000 }, async t => {
  const pg = cluster()
  try {
    pg.ok('postgres', `create role anon nologin noinherit; create role authenticated nologin noinherit;
      create role service_role nologin noinherit bypassrls; create database before_hardening;`)
    pg.ok('before_hardening', 'grant usage on schema public to anon, authenticated, service_role;')
    for (const name of prerequisites) pg.ok('before_hardening', readFileSync(join(DIR, name), 'utf8'))
    const call = (db: string, payload: unknown) => JSON.parse(pg.ok(db, catalog(payload), 'service_role')) as Row
    const reject = (db: string, payload: unknown, code = '22023') => {
      const before = pg.ok(db, ROWS)
      pg.fail(db, catalog(payload), code, 'service_role')
      assert.equal(pg.ok(db, ROWS), before, 'rejected RPC changed source/item/version/representation/URL/Evidence/Rule rows')
    }
    pg.copy('s_one', 'before_hardening')
    call('s_one', source); call('s_one', registration())
    const oldRows = pg.ok('s_one', ROWS), oldRead = call('s_one', { operation: 'read_registry' })
    await t.test('S1-like existing GOV.UK rows and read_registry survive unchanged; exact replay remains idempotent', () => {
      pg.ok('s_one', migration)
      assert.equal(pg.ok('s_one', ROWS), oldRows)
      assert.deepEqual(call('s_one', { operation: 'read_registry' }), oldRead)
      assert.equal(call('s_one', registration()).outcome, 'idempotent')
      assert.equal(pg.ok('s_one', `select identity_profile_id || ':' || identity_profile_version || ':' || current from ${PIN_TABLE};`), `${PROFILE}:1:true`)
      assert.deepEqual(OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY.map(p => [p.identityProfileId, p.identityProfileVersion, p.current]),
        [[PROFILE, 1, true]])
    })
    pg.copy('fresh', 'before_hardening'); pg.ok('fresh', migration); call('fresh', source)
    await t.test('known current pin and exact host pass the real typed gateway and raw RPC', async () => {
      const transport = { async aufrufen(payload: Row) { return { ok: true as const, antwort: call('fresh', payload) } } }
      assert.deepEqual(await contentItemRegistrieren(fixture.registration, { transport }),
        { ok: true, outcome: 'inserted', sourceId: 'govuk', contentItemId: 'eta-national-list' })
      assert.equal(call('fresh', registration()).outcome, 'idempotent')
      const changed = registration(); changed.item.expected_authority_ids = ['changed-authority']
      reject('fresh', changed, '23505')
    })
    await t.test('descendant/lookalike request or final host rejects atomically', () => {
      for (const host of ['x.www.gov.uk', 'www.gov.uk.evil.example']) for (const field of ['request_urls', 'expected_final_url']) {
        const input = registration('bad-host'), url = `https://${host}/synthetic/bad-host`
        input.representations[0]![field] = field === 'request_urls' ? [url] : url
        reject('fresh', input)
      }
    })
    await t.test('unknown id, wrong version and inactive pin reject before any partial registration', () => {
      pg.ok('fresh', `insert into ${PIN_TABLE} values ('inactive-profile', 1, false);`)
      for (const change of [{ identity_profile_id: 'unknown-profile' }, { identity_profile_version: 2 },
        { identity_profile_id: 'inactive-profile' }]) {
        const input = registration('bad-profile'); Object.assign(input.representations[0]!, change)
        reject('fresh', input)
      }
      const multi = registration('multiple-reps')
      multi.representations.push({ ...multi.representations[0]!, representation_id: 'zz-invalid',
        request_urls: ['https://www.gov.uk/synthetic/other-rep'], expected_final_url: 'https://www.gov.uk/synthetic/other-rep',
        identity_profile_id: 'unknown-profile' })
      reject('fresh', multi)
      assert.equal(pg.ok('fresh', `select count(*) from private.official_content_items where content_item_id in ('bad-profile', 'multiple-reps', 'bad-host');`), '0')
    })
    await t.test('RLS, FORCE RLS, zero policies and no public/anon/authenticated/service_role table privileges', () => {
      assert.equal(pg.ok('fresh', `select relrowsecurity and relforcerowsecurity from pg_class where oid='${PIN_TABLE}'::regclass;`), 't')
      assert.equal(pg.ok('fresh', `select count(*) from pg_policy where polrelid='${PIN_TABLE}'::regclass;`), '0')
      assert.equal(pg.ok('fresh', `select count(*) from pg_class c, lateral aclexplode(c.relacl) a where c.oid='${PIN_TABLE}'::regclass and a.grantee=0;`), '0')
      for (const role of ['anon', 'authenticated', 'service_role'] as const) {
        for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) {
          assert.equal(pg.ok('fresh', `select has_table_privilege('${role}', '${PIN_TABLE}', '${privilege}');`), 'f')
        }
        assert.equal(pg.ok('fresh', `select has_function_privilege('${role}', 'public.official_truth_source_catalog_v2(jsonb)', 'EXECUTE');`), role === 'service_role' ? 't' : 'f')
        for (const sql of [`select * from ${PIN_TABLE};`, `insert into ${PIN_TABLE} values ('forged-profile', 1, true);`,
          `update ${PIN_TABLE} set current=false;`, `delete from ${PIN_TABLE};`, `truncate ${PIN_TABLE};`]) pg.fail('fresh', sql, '42501', role)
        if (role !== 'service_role') pg.fail('fresh', catalog(registration()), '42501', role)
        for (const fn of ['private.official_identity_authorized_url_v2(text,text)', 'private.official_identity_representation_check_v2()']) {
          assert.equal(pg.ok('fresh', `select has_function_privilege('${role}', '${fn}', 'EXECUTE');`), 'f')
        }
      }
    })
    await t.test('pin grammar, positive version, composite uniqueness and single current version enforced', () => {
      for (const values of ["('Bad-profile',1,true)", "('a',1,true)", "('valid-profile',0,true)", "('valid-profile',-1,true)", "('valid-profile',1,null)"]) {
        pg.fail('fresh', `insert into ${PIN_TABLE} values ${values};`, values.includes('null') ? '23502' : '23514')
      }
      pg.fail('fresh', `insert into ${PIN_TABLE} values ('${PROFILE}',1,true);`, '23505')
      pg.fail('fresh', `insert into ${PIN_TABLE} values ('${PROFILE}',2,true);`, '23505')
      pg.ok('fresh', `insert into ${PIN_TABLE} values ('${PROFILE}',2,false);`)
      const input = registration('inactive-version'); input.representations[0]!.identity_profile_version = 2
      reject('fresh', input)
    })
    await t.test('pins immutable even for fixture owner; FK and representation trigger protect direct insertion', () => {
      const before = pg.ok('fresh', ROWS)
      for (const sql of [`update ${PIN_TABLE} set current=false;`, `delete from ${PIN_TABLE};`, `truncate ${PIN_TABLE} cascade;`]) {
        pg.fail('fresh', sql, '0A000')
        assert.equal(pg.ok('fresh', ROWS), before)
      }
      const rep = { ...(oldRead.representations as Row[])[0]!, representation_id: 'direct-fixture' }
      const direct = (row: Row) => `insert into private.official_content_representations select * from jsonb_populate_record(null::private.official_content_representations, ${json(row)});`
      pg.fail('fresh', direct({ ...rep, current: false, identity_profile_id: 'unknown-profile' }), '23503')
      const message = pg.fail('fresh', direct({ ...rep, identity_profile_id: 'inactive-profile' }), '23514')
      assert.match(message, /current representation requires current profile pin/)
      assert.equal(pg.ok('fresh', ROWS), before)
    })
    await t.test('explicit descendant registration is required; blocked parent still overrides exact authorization', () => {
      pg.copy('explicit_host', 'fresh')
      pg.ok('explicit_host', "insert into private.official_source_domains values ('govuk','x.www.gov.uk');")
      assert.equal(call('explicit_host', registration('explicit-child', 'x.www.gov.uk')).outcome, 'inserted')
      pg.ok('explicit_host', "insert into private.official_source_blocked_domains values ('gov.uk');")
      reject('explicit_host', registration('blocked-exact'))
      reject('explicit_host', registration('blocked-child', 'x.www.gov.uk'))
      reject('explicit_host', registration())
    })
    await t.test('unknown pre-existing profile makes upgrade fail atomically without changing identity', () => {
      pg.copy('incompatible', 'before_hardening'); call('incompatible', source)
      const input = registration(); input.representations[0]!.identity_profile_id = 'unknown-profile'
      call('incompatible', input)
      const before = pg.ok('incompatible', ROWS)
      pg.fail('incompatible', migration, '23503')
      assert.equal(pg.ok('incompatible', ROWS), before)
      assert.equal(pg.ok('incompatible', `select to_regclass('${PIN_TABLE}') is null;`), 't')
    })
    await t.test('pre-existing descendant Evidence/Rule supports become ineligible; exact-host eligibility stays valid', () => {
      pg.copy('legacy_supports', 'before_hardening'); call('legacy_supports', source)
      const exact = evidence(), descendant = evidence('old-descendant', 'x.www.gov.uk')
      for (const input of [registration(), registration('old-descendant', 'x.www.gov.uk')]) call('legacy_supports', input)
      for (const e of [exact, descendant]) {
        pg.ok('legacy_supports', store({ operation: 'accepted_evidence', evidence: e }), 'service_role')
        pg.ok('legacy_supports', `select private.official_store_eligibility_v2(${json(claim(e))});`)
      }
      const before = pg.ok('legacy_supports', ROWS)
      pg.ok('legacy_supports', migration)
      assert.equal(pg.ok('legacy_supports', ROWS), before)
      pg.ok('legacy_supports', store({ operation: 'accepted_evidence', evidence: exact }), 'service_role')
      pg.ok('legacy_supports', `select private.official_store_eligibility_v2(${json(claim(exact))});`)
      pg.fail('legacy_supports', store({ operation: 'accepted_evidence', evidence: descendant }), '23514', 'service_role')
      pg.fail('legacy_supports', store(claim(descendant)), '23514', 'service_role')
      assert.equal(pg.ok('legacy_supports', ROWS), before)
      pg.ok('legacy_supports', "insert into private.official_source_blocked_domains values ('gov.uk');")
      pg.fail('legacy_supports', store({ operation: 'accepted_evidence', evidence: exact }), '23514', 'service_role')
      pg.fail('legacy_supports', store(claim(exact)), '23514', 'service_role')
    })
  } finally { pg.stop() }
})
