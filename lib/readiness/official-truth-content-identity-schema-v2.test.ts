// Synthetic, isolated PostgreSQL 16 proof. No linked project, URL, credentials,
// runtime client, network listener or live Supabase access. Missing PG is a FAIL.
import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { contentEvidenceLookupV3, contentEvidenceVersionV2, createContentIdentityGraph, resolveCurrentContentRepresentation } from '@/lib/readiness/official-truth-content-identity'
import { quellenRegistryErstellen, type QuellenEingabe } from '@/lib/readiness/source-registry'
import { regelScopeAusEvidenceScope } from '@/lib/readiness/rule-claims'

type Row = Record<string, unknown>
const ROOT = process.cwd()
const DIR = join(ROOT, 'supabase/migrations')
const PG = '/usr/lib/postgresql/16/bin'
const names = readdirSync(DIR).filter(n => n.endsWith('_official_truth_content_identity_2.sql'))
assert.equal(names.length, 1)
const migration = readFileSync(join(DIR, names[0]!), 'utf8')
const prerequisites = [
  '20261001121258_official_truth_private_evidence_store_schema_1.sql',
  '20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql',
  '20261001180549_official_truth_trusted_store_writer_1.sql',
  '20261001193748_official_truth_source_catalog_gateway_1.sql',
]
const NEW_TABLES = ['official_source_blocked_domains', 'official_content_items', 'official_content_item_versions',
  'official_content_representations', 'official_content_url_reservations', 'official_content_representation_urls']
const FACT_TABLES = ['official_rule_claim_requirement_effect', 'official_rule_claim_visa_options', 'official_rule_claim_stay_limit',
  'official_rule_claim_passport_validity', 'official_rule_claim_blank_pages', 'official_rule_claim_transit_paths',
  'official_rule_claim_actions', 'official_rule_claim_temporal_rule']
const TABLES = ['official_sources', 'official_source_domains', 'official_evidence_versions', 'official_rule_claims',
  'official_rule_claim_support', ...FACT_TABLES, ...NEW_TABLES]
const CELL_FIELDS = ['rule_scope_key', 'destination_country_code', 'transit_country_code', 'citizenship_mode',
  'citizenship_country_codes', 'credential_option_mode', 'document_type', 'issuing_country_code',
  'related_citizenship_country_code', 'residence_mode', 'residence_country_code', 'requirement_type', 'validity_mode', 'travel_date']
const ID_FIELDS = ['identity_schema', 'source_id', 'content_item_id', 'content_item_version', 'representation_id',
  'representation_version', 'identity_profile_id', 'identity_profile_version', 'content_type']
const CLOCK = '2026-10-04T00:00:00.000Z'
const AT = '2026-10-04T00:05:00.000Z'
const SOURCE = 'example-authority'
const DOMAIN = 'authority.example'
const EXPLICIT = 'explicit_primary_statement'
const COMPOSED = 'composed_from_multiple_primary_sources'
function json(value: unknown): string {
  const text = JSON.stringify(value)
  assert.ok(!text.includes('$fixture$'))
  return `$fixture$${text}$fixture$::jsonb`
}
function catalog(payload: unknown, version = 2): string { return `select public.official_truth_source_catalog_v${version}(${json(payload)});` }
function store(payload: unknown, version = 2): string { return `select public.official_truth_store_accepted_v${version}(${json(payload)});` }
function source(id = SOURCE, domain = DOMAIN, provider = false) {
  return { operation: 'register_source', source: { source_id: id,
    source_class: provider ? 'licensed_evidence_provider' : 'official_authority', publisher_name: 'Example Publisher',
    authority_name: provider ? null : 'Example Authority', domains: [domain] } }
}
function representation(item = 'alpha', id = 'html', domain = DOMAIN) {
  const url = `https://${domain}/${item}/${id}`
  return { representation_id: id, representation_version: 1, current: true, request_urls: [url], expected_final_url: url,
    expected_media_type: id === 'api' ? 'application/json' : 'text/html', identity_profile_id: 'example-profile',
    identity_profile_version: 1, expected_locale: 'en' as string | null, expected_schema: 'example-schema' as string | null }
}
function registration(id = 'alpha', sourceId = SOURCE, domain = DOMAIN) {
  return { operation: 'register_content_item', item: { source_id: sourceId, content_item_id: id, external_id_namespace: 'example-item',
    external_content_id: `external-${id}`, content_item_version: 1, current: true,
    expected_publisher_ids: ['publisher-one'], expected_authority_ids: ['authority-one'] },
  representations: [representation(id, 'html', domain)] }
}
function evidence(item = 'alpha', rep = 'html', overrides: Row = {}): Row {
  const scope = { destinationCountryCode: 'GB', transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH'] }, credentialOption: { mode: 'option', documentType: 'passport',
      issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' }, residence: { mode: 'not_applicable' },
    requirementType: 'visa', validity: { mode: 'not_applicable' } }
  const rule = regelScopeAusEvidenceScope(scope)
  const lookup = contentEvidenceLookupV3(scope, { sourceId: SOURCE, contentItemId: item, representationId: rep })
  assert.ok(rule.ok && lookup.ok)
  const desc = representation(item, rep)
  const identity = contentEvidenceVersionV2({ identitySchema: 2, sourceId: SOURCE, contentItemId: item,
    contentItemVersion: 1, representationId: rep, representationVersion: 1, identityProfileId: 'example-profile',
    identityProfileVersion: 1, lookupKey: lookup.value.key, canonicalUrl: desc.expected_final_url,
    contentType: desc.expected_media_type, sourceContentHash: 'a'.repeat(64), retrievedAt: CLOCK, validFrom: null, validUntil: null })
  assert.ok(identity.ok)
  return { version_id: identity.value.versionId, previous_version_id: null, lifecycle: 'accepted', validation_state: 'valid',
    source_id: SOURCE, canonical_url: desc.expected_final_url, retrieved_at: CLOCK, source_content_hash: 'a'.repeat(64),
    valid_from: null, valid_until: null, lookup_key: lookup.value.key, extraction_note: null,
    identity_schema: 2, content_item_id: item, content_item_version: 1, representation_id: rep, representation_version: 1,
    identity_profile_id: 'example-profile', identity_profile_version: 1, content_type: desc.expected_media_type,
    rule_scope_key: rule.key, destination_country_code: 'GB', transit_country_code: null,
    citizenship_mode: 'required', citizenship_country_codes: ['CH'], credential_option_mode: 'option', document_type: 'passport',
    issuing_country_code: 'CH', related_citizenship_country_code: 'CH', residence_mode: 'not_applicable', residence_country_code: null,
    requirement_type: 'visa', validity_mode: 'not_applicable', travel_date: null, ...overrides }
}
function accepted(e: Row) { return { operation: 'accepted_evidence', evidence: e } }
function claim(e: Row, supports: unknown[] = [e.version_id], quality = EXPLICIT, kind = 'requirement_effect', fact: Row = { effect: 'required', visa_mode: 'visa_before_travel' }): { operation: string; accepted_at: string; claim: Row } {
  return { operation: 'accepted_rule_claim', accepted_at: AT, claim: { ...Object.fromEntries(CELL_FIELDS.map(k => [k, e[k]])),
    lifecycle: 'accepted', validation_state: 'valid', fact_kind: kind, evidence_quality: quality, support_version_ids: supports, fact } }
}
function insertRow(table: string, row: Row): string {
  assert.ok(TABLES.includes(table))
  return `insert into private.${table} (${Object.keys(row).join(',')}) select ${Object.keys(row).join(',')}
    from pg_catalog.jsonb_populate_record(null::private.${table}, ${json(row)});`
}
function legacyEvidence(): Row {
  const row = evidence()
  for (const field of ID_FIELDS.filter(k => k !== 'source_id')) delete row[field]
  return { ...row, version_id: `ev1_${'a'.repeat(32)}`, lookup_key: `evidence-key:v2:${'a'.repeat(64)}` }
}

test('S1 static safety: CLI filename, transaction, no seed or live/runtime activation', () => {
  assert.match(names[0]!, /^\d{14}_official_truth_content_identity_2\.sql$/)
  const sql = migration.replace(/--[^\n]*/g, '')
  assert.match(sql, /^\s*begin;/)
  assert.match(sql, /commit;\s*$/)
  assert.ok(sql.indexOf('in access exclusive mode') < sql.indexOf('create function'))
  const outside = sql.replace(/\$(fn|gate)\$[\s\S]*?\$\1\$/g, '')
  assert.doesNotMatch(outside, /\b(insert\s+into|update\s+private|delete\s+from|truncate\b|drop\s+table|create\s+policy|create\s+role)\b/i)
  assert.doesNotMatch(sql, /\b(delete\s+from|truncate|disable\s+trigger|grant\s+(?:all|select|insert|update|delete)\b)\b/i)
  assert.doesNotMatch(sql, /gov\.uk|\bCTA\b|https:\/\/(?:[a-z0-9-]+\.)+(?:gov|com)|supabase\s+db\s+(push|reset)|net\.http|dblink/i)
  for (const table of NEW_TABLES) {
    assert.match(sql, new RegExp(`alter table private\\.${table} enable row level security`, 'i'))
    assert.match(sql, new RegExp(`alter table private\\.${table} force row level security`, 'i'))
    assert.match(sql, new RegExp(`revoke all on table private\\.${table} from public, anon, authenticated, service_role`, 'i'))
  }
  assert.equal((sql.match(/security definer\s+set search_path = ''/gi) ?? []).length, 4)
  assert.match(sql, /official_truth_store_accepted_v2[\s\S]*?security definer\s+set search_path = ''/i)
})

type Result = { code: number | null; out: string; err: string }
function cluster() {
  const root = mkdtempSync(join(tmpdir(), 'jetnity-ci-v2-'))
  const data = join(root, 'data'), sock = join(root, 'sock')
  mkdirSync(sock)
  // Only local process necessities. No inherited PG*, DB URLs or Supabase keys.
  const env: NodeJS.ProcessEnv = { PATH: process.env.PATH, LANG: 'C', LC_ALL: 'C', NODE_ENV: 'test' }
  let started = false
  const stop = () => {
    try { if (started) execFileSync(join(PG, 'pg_ctl'), ['-D', data, '-m', 'immediate', 'stop'], { env, stdio: 'ignore' }) }
    finally { rmSync(root, { recursive: true, force: true }) }
  }
  try {
    execFileSync(join(PG, 'initdb'), ['-D', data, '--username=fixture', '--auth-local=trust', '--encoding=UTF8', '--no-locale'], { env, stdio: 'pipe' })
    execFileSync(join(PG, 'pg_ctl'), ['-D', data, '-l', join(root, 'log'), '-w', 'start', '-o',
      `-c listen_addresses= -c unix_socket_directories=${sock} -c shared_buffers=16MB`], { env, stdio: 'pipe' })
    started = true
  } catch (error) { stop(); throw error }
  const args = (db: string) => ['-X', '--no-psqlrc', '-Atq', '-h', sock, '-U', 'fixture', '-d', db, '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose']
  const run = (db: string, sql: string, role?: 'service_role' | 'anon' | 'authenticated'): Result => {
    const r = spawnSync(join(PG, 'psql'), args(db), { env, input: `${role ? `set role ${role};` : ''}\n${sql}`, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
    if (r.error) throw r.error
    return { code: r.status, out: r.stdout.trim(), err: r.stderr.trim() }
  }
  const ok = (db: string, sql: string, role?: 'service_role' | 'anon' | 'authenticated') => {
    const r = run(db, sql, role); assert.equal(r.code, 0, r.err); return r.out
  }
  const fail = (db: string, sql: string, code?: string, role?: 'service_role' | 'anon' | 'authenticated') => {
    const r = run(db, sql, role); assert.notEqual(r.code, 0, `unexpected success: ${r.out}`)
    if (code) assert.ok(r.err.includes(code), r.err)
    return r.err
  }
  const asyncRun = (db: string, sql: string, app: string): Promise<Result> => new Promise((resolve, reject) => {
    const child = spawn(join(PG, 'psql'), args(db), { env: { ...env, PGAPPNAME: app }, stdio: ['pipe', 'pipe', 'pipe'] })
    let out = '', err = ''
    child.stdout.on('data', chunk => { out += String(chunk) }); child.stderr.on('data', chunk => { err += String(chunk) })
    child.on('error', reject); child.on('close', code => resolve({ code, out: out.trim(), err: err.trim() }))
    child.stdin.end(sql)
  })
  const create = (name: string, template = 'v2empty') => {
    assert.match(name, /^[a-z0-9_]+$/); assert.match(template, /^[a-z0-9_]+$/)
    ok('postgres', `create database ${name} template ${template};`); return name
  }
  return { ok, fail, run, asyncRun, create, stop }
}

test('S1 disposable PostgreSQL 16: cutover, private contracts, atomic RPCs and races', { timeout: 180_000 }, async t => {
  const pg = cluster()
  try {
    pg.ok('postgres', `create role anon nologin noinherit; create role authenticated nologin noinherit;
      create role service_role nologin noinherit bypassrls; create database v1empty;`)
    pg.ok('v1empty', 'grant usage on schema public to anon, authenticated, service_role;')
    for (const filename of prerequisites) pg.ok('v1empty', readFileSync(join(DIR, filename), 'utf8'))
    const empty = pg.create('v2empty', 'v1empty')
    await t.test('empty v1 cutover succeeds and all source/item/fact collections remain empty', () => {
      pg.ok(empty, migration)
      for (const table of TABLES) assert.equal(pg.ok(empty, `select count(*) from private.${table};`), '0')
    })
    const snapshot = (db: string) => pg.ok(db, `select jsonb_build_array(${TABLES.map(n => `(select count(*) from private.${n})`).join(',')});`)
    const callCatalog = (db: string, value: unknown) => JSON.parse(pg.ok(db, catalog(value), 'service_role')) as Row
    const callStore = (db: string, value: unknown) => JSON.parse(pg.ok(db, store(value), 'service_role')) as Row
    const rejectCatalog = (db: string, value: unknown, code?: string) => {
      const before = snapshot(db); pg.fail(db, catalog(value), code, 'service_role'); assert.equal(snapshot(db), before)
    }
    const rejectStore = (db: string, value: unknown, code?: string) => {
      const before = snapshot(db); pg.fail(db, store(value), code, 'service_role'); assert.equal(snapshot(db), before)
    }
    for (const variant of ['source', 'domain', 'evidence', 'rule_fact'] as const) {
      await t.test(`nonempty ${variant} aborts all DDL, preserves rows and keeps v1 RPCs`, () => {
        const db = pg.create(`gate_${variant}`, 'v1empty')
        if (variant === 'source') pg.ok(db, `insert into private.official_sources(source_id,source_class,publisher_name,authority_name)
          values('${SOURCE}','official_authority','Example Publisher','Example Authority');`)
        if (variant === 'domain') pg.ok(db, `set session_replication_role=replica; insert into private.official_source_domains values('${SOURCE}','orphan.example');`)
        if (variant === 'evidence') { pg.ok(db, catalog(source(), 1), 'service_role'); pg.ok(db, store(accepted(legacyEvidence()), 1), 'service_role') }
        if (variant === 'rule_fact') pg.ok(db, store(claim(legacyEvidence(), []), 1), 'service_role')
        const target = { source: 'official_sources', domain: 'official_source_domains', evidence: 'official_evidence_versions', rule_fact: 'official_rule_claim_requirement_effect' }[variant]
        const before = pg.ok(db, `select count(*) from private.${target};`)
        assert.equal(before, '1')
        const error = pg.fail(db, migration, '55000'); assert.ok(error.includes(target), error)
        assert.equal(pg.ok(db, `select count(*) from private.${target};`), before)
        for (const table of NEW_TABLES) assert.equal(pg.ok(db, `select to_regclass('private.${table}') is null;`), 't')
        assert.equal(pg.ok(db, `select to_regprocedure('public.official_truth_source_catalog_v2(jsonb)') is null;`), 't')
        assert.equal(pg.ok(db, `select count(*) from information_schema.columns where table_schema='private' and table_name='official_evidence_versions' and column_name='identity_schema';`), '0')
        const registry = JSON.parse(pg.ok(db, catalog({ operation: 'read_registry' }, 1), 'service_role')) as Row
        assert.equal(registry.ok, true)
      })
    }
    await t.test('empty v2 registry has explicit schema and sorted empty collections', () => {
      assert.deepEqual(callCatalog(empty, { operation: 'read_registry' }), { ok: true, operation: 'read_registry', identity_schema: 2,
        sources: [], blocked_domains: [], content_items: [], item_versions: [], representations: [], representation_urls: [], url_reservations: [] })
    })
    await t.test('RLS/FORCE, zero policies, revoked direct privileges and restricted RPC ACLs', () => {
      for (const table of NEW_TABLES) {
        assert.equal(pg.ok(empty, `select relrowsecurity and relforcerowsecurity from pg_class where oid='private.${table}'::regclass;`), 't')
        assert.equal(pg.ok(empty, `select count(*) from pg_policy where polrelid='private.${table}'::regclass;`), '0')
        for (const role of ['anon', 'authenticated', 'service_role'] as const) {
          assert.equal(pg.ok(empty, `select has_table_privilege('${role}','private.${table}','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER');`), 'f')
          pg.fail(empty, `select * from private.${table};`, '42501', role)
          pg.fail(empty, `insert into private.${table} default values;`, '42501', role)
        }
      }
      for (const name of ['official_truth_source_catalog_v2', 'official_truth_store_accepted_v2']) {
        assert.equal(pg.ok(empty, `select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid='public.${name}(jsonb)'::regprocedure;`), 't')
        for (const role of ['anon', 'authenticated', 'service_role'] as const) {
          assert.equal(pg.ok(empty, `select has_function_privilege('${role}','public.${name}(jsonb)','EXECUTE');`), role === 'service_role' ? 't' : 'f')
        }
        assert.equal(pg.ok(empty, `select count(*) from pg_proc p, lateral aclexplode(p.proacl) a where p.oid='public.${name}(jsonb)'::regprocedure and a.grantee=0;`), '0')
      }
      assert.equal(pg.ok(empty, `select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace,
        lateral aclexplode(p.proacl) a where n.nspname='private' and p.proname like '%_v2' and (a.grantee=0 or a.grantee in(select oid from pg_roles where rolname in('anon','authenticated','service_role')));`), '0')
    })
    await t.test('both v1 operations always fail feature-not-supported for service role', () => {
      for (const payload of [{ operation: 'read_registry' }, source(), null]) pg.fail(empty, catalog(payload, 1), '0A000', 'service_role')
      for (const payload of [accepted(legacyEvidence()), claim(legacyEvidence()), null]) pg.fail(empty, store(payload, 1), '0A000', 'service_role')
    })
    await t.test('strict catalog top-level shapes and unsupported operations fail atomically', () => {
      for (const p of [null, [], {}, { operation: 3 }, { operation: 'read_registry', extra: true }, { operation: 'retire_content_item' },
        { ...registration(), extra: true }, { operation: 'register_source', source: null }]) rejectCatalog(empty, p, '22023')
    })
    const fixture = pg.create('fixture')
    await t.test('source insert and exact duplicate retain v1 domain semantics', () => {
      assert.equal(callCatalog(fixture, source()).outcome, 'inserted')
      assert.equal(callCatalog(fixture, source()).outcome, 'idempotent')
      const same = source('example-child', 'child.example'); same.source.domains.push('nested.child.example')
      assert.equal(callCatalog(fixture, same).outcome, 'inserted')
      callCatalog(fixture, source('example-provider', 'provider.example', true))
    })
    await t.test('source metadata and equal/parent/child cross-source collisions roll back', () => {
      const changed = source(); changed.source.publisher_name = 'Other Publisher'; rejectCatalog(fixture, changed, '23505')
      for (const domain of [DOMAIN, `sub.${DOMAIN}`, 'example']) rejectCatalog(fixture, source('example-conflict', domain))
      const parent = source('example-parent', 'other.example'); parent.source.domains.push('child.example')
      rejectCatalog(fixture, parent, '23505')
      const partial = source('example-partial', 'first-free.example'); partial.source.domains.push(DOMAIN)
      rejectCatalog(fixture, partial, '23505')
      for (const domain of ['*.example', 'https://host.example', 'HOST.example', 'localhost', '127.0.0.1', 'site.local']) rejectCatalog(fixture, source('example-invalid', domain), '22023')
    })
    await t.test('initial item with two renderings and final-only URL is atomic and idempotent', () => {
      const first = registration(); first.representations.push(representation('alpha', 'api'))
      first.representations[0]!.request_urls = [`https://${DOMAIN}/alpha/start`]
      assert.equal(callCatalog(fixture, first).outcome, 'inserted')
      assert.equal(callCatalog(fixture, first).outcome, 'idempotent')
      assert.equal(callCatalog(fixture, registration('beta')).outcome, 'inserted')
      assert.equal(pg.ok(fixture, 'select count(*) from private.official_content_representation_urls;'), '4')
      assert.equal(pg.ok(fixture, 'select count(*) from private.official_content_url_reservations;'), '4')
    })
    await t.test('external identity, changed descriptor and cross-item/stream URL conflicts roll back', () => {
      const changed = registration(); changed.item.expected_publisher_ids = ['publisher-two']; rejectCatalog(fixture, changed, '23505')
      const external = registration('duplicate'); external.item.external_content_id = 'external-alpha'; rejectCatalog(fixture, external, '23505')
      const collision = registration('collision'); collision.representations[0]!.expected_final_url = representation().expected_final_url
      rejectCatalog(fixture, collision, '23505')
      const stream = registration('double'); stream.representations.push({ ...stream.representations[0]!, representation_id: 'api' })
      rejectCatalog(fixture, stream, '23505')
      const repeated = registration('repeat'); repeated.representations.push({ ...repeated.representations[0]! })
      rejectCatalog(fixture, repeated, '22023')
    })
    await t.test('unknown/provider/wrong authority and blocked domains never admit content', () => {
      rejectCatalog(fixture, registration('unknown', 'example-missing'), '23503')
      rejectCatalog(fixture, registration('provider', 'example-provider', 'provider.example'), '23503')
      rejectCatalog(fixture, registration('wrong', SOURCE, 'child.example'), '22023')
      const db = pg.create('blocked', 'fixture')
      pg.ok(db, `insert into private.official_source_blocked_domains values('blocked.${DOMAIN}');`)
      rejectCatalog(db, registration('blocked', SOURCE, `sub.blocked.${DOMAIN}`), '22023')
      const read = callCatalog(db, { operation: 'read_registry' })
      assert.deepEqual(read.blocked_domains, [`blocked.${DOMAIN}`])
      pg.fail(db, `insert into private.official_source_blocked_domains values('BLOCKED.example');`, '23514')
    })
    await t.test('strict registration rejects empty/incomplete, unknown, null and coercible fields', () => {
      const malformed: unknown[] = []
      const empty = registration('empty'); empty.representations = []; malformed.push(empty)
      const version = registration('version'); version.item.content_item_version = 2; malformed.push(version)
      const rp = registration('rp'); rp.representations[0]!.representation_version = 2; malformed.push(rp)
      const noUrls = registration('no-urls'); noUrls.representations[0]!.request_urls = []; malformed.push(noUrls)
      const dup = registration('dup-url'); dup.representations[0]!.request_urls.push(dup.representations[0]!.expected_final_url); malformed.push(dup)
      const pub = registration('pub'); pub.item.expected_publisher_ids = ['zeta', 'alpha']; malformed.push(pub)
      const noPub = registration('no-pub'); noPub.item.expected_publisher_ids = []; malformed.push(noPub)
      const num = structuredClone(registration('num')) as unknown as Row
      ;(num.item as Row).content_item_version = '1'; malformed.push(num)
      malformed.push({ ...registration('extra'), item: { ...registration('extra').item, executable: 'bad' } })
      malformed.push({ ...registration('missing'), item: { source_id: SOURCE } })
      for (const p of malformed) rejectCatalog(fixture, p, '22023')
    })
    await t.test('exact canonical URL checks reject wildcards, credentials, ports, fragments and normalization tricks', () => {
      for (const url of [`http://${DOMAIN}/x`, `https://${DOMAIN}:443/x`, `https://${DOMAIN}/x#fragment`,
        `https://name@${DOMAIN}/x`, `https://${DOMAIN}/x*`, `https://${DOMAIN}/a/../x`, `https://${DOMAIN}/%2e/x`,
        `https://${DOMAIN}/x%QQ`, `https://${DOMAIN}/x?quote='`, `https://AUTHORITY.example/x`, 'https://127.0.0.1/x',
        'https://0x7f.1/x', 'https://localhost/x', `https://${DOMAIN}/a\\b`]) {
        const p = registration('bad-url'); p.representations[0]!.request_urls = [url]; p.representations[0]!.expected_final_url = url
        rejectCatalog(fixture, p, '22023')
      }
      const query = registration('query'); query.representations[0]!.request_urls = [`https://${DOMAIN}/query?a=1&b=2`, `https://${DOMAIN}/query?b=2&a=1`]
      query.representations[0]!.expected_final_url = query.representations[0]!.request_urls[0]!
      assert.equal(callCatalog(fixture, query).outcome, 'inserted')
    })
    await t.test('deterministic snapshot preserves exact URL order and all cross-links', () => {
      const read = callCatalog(fixture, { operation: 'read_registry' })
      assert.deepEqual(read, callCatalog(fixture, { operation: 'read_registry' }))
      const sources = read.sources as Row[]; assert.deepEqual(sources.map(s => s.source_id), [SOURCE, 'example-child', 'example-provider'])
      const items = read.content_items as Row[]; assert.deepEqual(items.map(i => i.content_item_id), ['alpha', 'beta', 'query'])
      const reps = read.representations as Row[]; assert.deepEqual(reps.map(r => [r.content_item_id, r.representation_id]), [['alpha', 'api'], ['alpha', 'html'], ['beta', 'html'], ['query', 'html']])
      const urls = read.representation_urls as Row[]
      assert.ok(urls.some(u => u.url === representation().expected_final_url && u.is_final === true && u.request_ordinal === null))
      assert.equal((read.url_reservations as Row[]).length, urls.length)
      // Test-only adapter proves one snapshot can rebuild R1. No runtime caller.
      const camel = (row: Row): Row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()), value]))
      const authority = quellenRegistryErstellen(sources.map(camel) as QuellenEingabe[], { blockedDomains: read.blocked_domains as string[] })
      assert.ok(authority.ok)
      const versions = (read.item_versions as Row[]).map(v => camel({ ...items.find(i => i.source_id === v.source_id && i.content_item_id === v.content_item_id), ...v }))
      const descriptors = reps.map(r => camel({ ...r, request_urls: urls.filter(u => u.source_id === r.source_id && u.content_item_id === r.content_item_id
        && u.representation_id === r.representation_id && u.representation_version === r.representation_version && u.request_ordinal !== null).map(u => u.url) }))
      const graph = createContentIdentityGraph(authority.registry, versions, descriptors, [{ identityProfileId: 'example-profile', identityProfileVersion: 1,
        current: true, verify: () => ({ ok: false, reason: 'identity_mismatch' }) }])
      assert.ok(graph.ok, JSON.stringify(graph))
      for (const url of urls.filter(u => u.request_ordinal !== null)) assert.ok(resolveCurrentContentRepresentation(graph.value, url.url).ok)
    })
    await t.test('canonical ASCII path/query punctuation and escaped URLs round-trip without normalization', () => {
      const db = pg.create('url_punctuation', 'fixture')
      const p = registration('punctuation')
      const urls = [`https://${DOMAIN}/x[]|^`, `https://${DOMAIN}/x?[]|^{}\\query`, `https://${DOMAIN}/x%20%2f?quoted=%27`].sort()
      for (const url of urls) assert.equal(new URL(url).toString(), url)
      p.representations[0]!.request_urls = urls; p.representations[0]!.expected_final_url = urls[0]!
      assert.equal(callCatalog(db, p).outcome, 'inserted')
      const read = callCatalog(db, { operation: 'read_registry' })
      assert.deepEqual((read.representation_urls as Row[]).filter(u => u.content_item_id === 'punctuation').map(u => u.url), urls)
    })
    await t.test('keys, positive versions, bounded metadata and provider FK are enforced without the RPC', () => {
      const db = pg.create('constraints', 'fixture')
      pg.fail(db, `insert into private.official_content_items(source_id,content_item_id,external_id_namespace,external_content_id)
        values('example-provider','forbidden','example-item','forbidden');`, '23503')
      pg.fail(db, `insert into private.official_content_items(source_id,content_item_id,external_id_namespace,external_content_id)
        values('${SOURCE}','other','example-item','external-alpha');`, '23505')
      for (const id of ['X', 'a', 'contains space', 'a'.repeat(65)]) {
        pg.fail(db, insertRow('official_content_items', { source_id: SOURCE, content_item_id: id,
          external_id_namespace: 'example-item', external_content_id: 'other', source_class: 'official_authority' }), '23514')
      }
      for (const version of [0, -1]) pg.fail(db, `insert into private.official_content_item_versions values('${SOURCE}','alpha',${version},false,array['publisher'],array['authority']);`, '23514')
      pg.fail(db, `insert into private.official_content_item_versions values('${SOURCE}','alpha',2,true,array['publisher'],array['authority']);`, '23505')
      pg.fail(db, `insert into private.official_content_item_versions values('${SOURCE}','missing',1,true,array['publisher'],array['authority']);`, '23503')
      pg.fail(db, `insert into private.official_content_item_versions values('${SOURCE}','alpha',2,false,array['same','same'],array['authority']);`, '23514')
      pg.fail(db, `update private.official_content_items set external_content_id='changed' where content_item_id='alpha';`, '0A000')
      pg.fail(db, `delete from private.official_content_url_reservations;`, '0A000')
      assert.equal(pg.ok(db, `select pg_get_constraintdef(oid) from pg_constraint where conrelid='private.official_source_domains'::regclass and contype='p';`), 'PRIMARY KEY (domain)')
    })
    await t.test('representation current uniqueness, historical item rejection and append-only descriptors', () => {
      const db = pg.create('rep_constraints', 'fixture')
      const insertRep = (version: number, itemVersion: number, current: boolean) => `insert into private.official_content_representations
        select source_id,content_item_id,${itemVersion},representation_id,${version},${current},expected_final_url,expected_media_type,
        identity_profile_id,identity_profile_version,expected_locale,expected_schema from private.official_content_representations
        where content_item_id='alpha' and representation_id='html' and representation_version=1;`
      pg.fail(db, insertRep(2, 1, true), '23505')
      pg.ok(db, `insert into private.official_content_item_versions values('${SOURCE}','alpha',2,false,array['publisher'],array['authority']);`)
      pg.fail(db, `begin; insert into private.official_content_representations
        select source_id,content_item_id,2,'other',1,true,expected_final_url,expected_media_type,
        identity_profile_id,identity_profile_version,expected_locale,expected_schema from private.official_content_representations
        where content_item_id='alpha' and representation_id='html'; commit;`, '23514')
      pg.fail(db, insertRep(2, 99, false), '23503')
      pg.fail(db, `update private.official_content_representations set identity_profile_version=2;`, '0A000')
      pg.fail(db, insertRep(2, 1, false), '23514') // no URL bindings: deferred completeness
    })
    await t.test('historical URLs stay reserved while one stream can reuse its own exact URL', () => {
      const db = pg.create('history', 'fixture')
      const copy = `insert into private.official_content_representations
        select source_id,content_item_id,content_item_version,representation_id,2,false,expected_final_url,expected_media_type,
        identity_profile_id,identity_profile_version,expected_locale,expected_schema from private.official_content_representations
        where content_item_id='alpha' and representation_id='html' and representation_version=1;
        insert into private.official_content_representation_urls
        select source_id,content_item_id,representation_id,2,url,request_ordinal,is_final from private.official_content_representation_urls
        where content_item_id='alpha' and representation_id='html' and representation_version=1;`
      pg.ok(db, `begin; ${copy} commit;`)
      const oldUrl = `https://${DOMAIN}/alpha/retired`
      pg.ok(db, `begin; insert into private.official_content_representations
        select source_id,content_item_id,content_item_version,representation_id,3,false,'${oldUrl}',expected_media_type,
        identity_profile_id,identity_profile_version,expected_locale,expected_schema from private.official_content_representations
        where content_item_id='alpha' and representation_id='html' and representation_version=1;
        insert into private.official_content_url_reservations values('${oldUrl}','${SOURCE}','alpha','html');
        insert into private.official_content_representation_urls values('${SOURCE}','alpha','html',3,'${oldUrl}',1,true); commit;`)
      const takeover = registration('takeover'); takeover.representations[0]!.expected_final_url = oldUrl
      rejectCatalog(db, takeover, '23505')
      rejectStore(db, accepted(evidence('alpha', 'html', { representation_version: 3, canonical_url: oldUrl })), '23514')
      assert.equal((callCatalog(db, { operation: 'read_registry' }).representations as Row[]).filter(r => r.current === false).length, 2)
    })
    const withEvidence = pg.create('with_evidence', 'fixture')
    const e = evidence(), api = evidence('alpha', 'api'), beta = evidence('beta')
    await t.test('accepted ev2 Evidence from R1 serializers inserts exact identity and is idempotent', () => {
      for (const row of [e, api, beta]) {
        assert.equal(callStore(withEvidence, accepted(row)).outcome, 'inserted')
        assert.equal(callStore(withEvidence, accepted(row)).outcome, 'idempotent')
        assert.deepEqual(JSON.parse(pg.ok(withEvidence, `select to_jsonb(v) from private.official_evidence_versions v where version_id=${json(row.version_id)} #>> '{}';`)), row)
      }
    })
    await t.test('conflicting Evidence duplicate cannot replace old content or identity', () => {
      rejectStore(withEvidence, accepted({ ...e, source_content_hash: 'b'.repeat(64) }), '23505')
      rejectStore(withEvidence, accepted({ ...e, valid_from: '2026-10-01' }), '23505')
      rejectStore(withEvidence, accepted({ ...e, extraction_note: 'Different note' }), '23505')
    })
    await t.test('v1/lookup-v2 and absent/malformed identity fields fail closed', () => {
      rejectStore(withEvidence, accepted(legacyEvidence()), '22023')
      rejectStore(withEvidence, accepted({ ...e, version_id: `ev1_${'b'.repeat(32)}` }), '23514')
      rejectStore(withEvidence, accepted({ ...e, version_id: `ev2_${'b'.repeat(32)}`, lookup_key: `evidence-key:v2:${'b'.repeat(64)}` }), '23514')
      for (const key of ID_FIELDS) {
        const missing = { ...e }; delete missing[key]; rejectStore(withEvidence, accepted(missing), '22023')
        rejectStore(withEvidence, accepted({ ...e, [key]: null }), '22023')
      }
      rejectStore(withEvidence, accepted({ ...e, identity_schema: 1 }), '22023')
      rejectStore(withEvidence, accepted({ ...e, content_item_version: '1' }), '22023')
      rejectStore(withEvidence, accepted({ ...e, representation_version: 1.5 }), '22023')
      rejectStore(withEvidence, accepted({ ...e, identity_profile_version: 2147483648 }), '22023')
      rejectStore(withEvidence, { ...accepted(e), bypass: true }, '22023')
      rejectStore(withEvidence, accepted({ ...e, ignored: true }), '22023')
    })
    await t.test('wrong source/item/version/representation/profile/URL/type and lifecycle are ineligible', () => {
      for (const patch of [{ source_id: 'example-provider' }, { content_item_id: 'beta' }, { content_item_version: 99 },
        { representation_id: 'api' }, { representation_version: 99 }, { identity_profile_id: 'wrong-profile' },
        { identity_profile_version: 2 }, { content_type: 'text/plain' }, { canonical_url: `https://${DOMAIN}/unregistered` },
        { canonical_url: `https://${DOMAIN}/alpha/start` }, { lifecycle: 'candidate' }, { lifecycle: 'superseded' }, { validation_state: 'pending' }]) {
        rejectStore(withEvidence, accepted({ ...e, ...patch }), '23514')
      }
      const db = pg.create('deny_evidence', 'with_evidence')
      pg.ok(db, `insert into private.official_source_blocked_domains values('${DOMAIN}');`)
      rejectStore(db, accepted(e), '23514')
      rejectStore(db, claim(e), '23514')
    })
    await t.test('Evidence retains regulatory-cell/hash/validity constraints and direct identity FK', () => {
      const db = pg.create('evidence_constraints', 'fixture')
      for (const patch of [{ citizenship_country_codes: ['CH', 'CH'] }, { citizenship_country_codes: ['US', 'CH'] },
        { related_citizenship_country_code: 'US' },
        { residence_mode: 'required', residence_country_code: null }, { destination_country_code: null },
        { source_content_hash: 'bad' }, { retrieved_at: '2026-02-30T00:00:00Z' }, { retrieved_at: '2026-10-04' },
        { valid_from: '2026-12-01', valid_until: '2026-11-01' }, { validity_mode: 'travel_date', travel_date: null }]) {
        rejectStore(db, accepted({ ...e, ...patch }), '23514')
      }
      rejectStore(db, accepted({ ...e, citizenship_country_codes: Array(9).fill('CH') }), '22023')
      pg.fail(db, insertRow('official_evidence_versions', { ...e, identity_profile_version: 99 }), '23503')
      const nullable = { ...e }; delete nullable.identity_schema
      pg.fail(db, insertRow('official_evidence_versions', nullable), '23502')
    })
    await t.test('predecessor in the same representation/lookup/cell is chronological and immutable', () => {
      const db = pg.create('lineage', 'with_evidence')
      const next = { ...e, version_id: `ev2_${'c'.repeat(32)}`, previous_version_id: e.version_id, retrieved_at: '2026-10-04T00:01:00.000Z' }
      assert.equal(callStore(db, accepted(next)).outcome, 'inserted')
      assert.equal(callStore(db, accepted(next)).outcome, 'idempotent')
      pg.fail(db, `update private.official_evidence_versions set previous_version_id='${next.version_id}' where version_id='${e.version_id}';`, '0A000')
      const before = snapshot(db)
      pg.fail(db, `begin; ${store(accepted({ ...next, version_id: `ev2_${'d'.repeat(32)}`, previous_version_id: `ev2_${'e'.repeat(32)}` }))}
        ${store(accepted({ ...next, version_id: `ev2_${'e'.repeat(32)}`, previous_version_id: null }))} commit;`, '23503', 'service_role')
      assert.equal(snapshot(db), before)
    })
    await t.test('missing/self/v1/cross-item/representation/lookup/scope/nonchronological predecessors reject', () => {
      const db = pg.create('bad_lineage', 'with_evidence')
      const next = { ...e, version_id: `ev2_${'c'.repeat(32)}`, previous_version_id: e.version_id, retrieved_at: '2026-10-04T00:01:00.000Z' }
      for (const patch of [{ previous_version_id: beta.version_id }, { previous_version_id: api.version_id },
        { previous_version_id: `ev2_${'d'.repeat(32)}` }, { previous_version_id: `ev1_${'a'.repeat(32)}` },
        { previous_version_id: next.version_id }, { retrieved_at: CLOCK }, { retrieved_at: '2026-10-03T23:59:59Z' },
        { lookup_key: `evidence-key:v3:${'c'.repeat(64)}` }, { rule_scope_key: `rule-scope:v1:${'c'.repeat(64)}` },
        { destination_country_code: 'FR' }]) rejectStore(db, accepted({ ...next, ...patch }))
      callCatalog(db, source('example-other', 'other.example'))
      callCatalog(db, registration('alpha', 'example-other', 'other.example'))
      rejectStore(db, accepted({ ...next, source_id: 'example-other', canonical_url: 'https://other.example/alpha/html' }), '23514')
    })
    await t.test('explicit-primary persists one exact item-aware Evidence tuple and ignores later duplicate audit time', () => {
      const db = pg.create('explicit_rule', 'with_evidence')
      const payload = claim(e)
      const result = callStore(db, payload); assert.equal(result.outcome, 'inserted')
      assert.equal(callStore(db, { ...payload, accepted_at: '2026-10-04T01:00:00Z' }).outcome, 'idempotent')
      const stored = JSON.parse(pg.ok(db, 'select to_jsonb(s) from private.official_rule_claim_support s;')) as Row
      for (const key of ID_FIELDS) assert.deepEqual(stored[key], e[key], key)
      assert.equal(stored.version_id, e.version_id)
      assert.equal(pg.ok(db, `select accepted_at = '${AT}'::timestamptz from private.official_rule_claims;`), 't')
      rejectStore(db, claim(e, [e.version_id], EXPLICIT, 'requirement_effect', { effect: 'not_required', visa_mode: 'visa_exempt' }), '23505')
      pg.fail(db, insertRow('official_rule_claim_support', { ...stored, version_id: api.version_id,
        representation_id: 'api', content_type: 'application/json' }), '23505')
      pg.fail(db, insertRow('official_rule_claim_support', { ...stored, version_id: beta.version_id,
        content_item_id: 'beta', identity_profile_version: 99 }), '23503')
    })
    await t.test('explicit-primary rejects zero or multiple items, even from the same authority', () => {
      const db = pg.create('explicit_bad', 'with_evidence')
      rejectStore(db, claim(e, []), '22023')
      rejectStore(db, claim(e, [e.version_id, beta.version_id]), '23514')
      rejectStore(db, claim(e, [e.version_id, api.version_id]), '23514')
    })
    await t.test('composed accepts two distinct items under one authority and keeps Evidence version ids', () => {
      const db = pg.create('composed_rule', 'with_evidence')
      const payload = claim(e, [e.version_id, beta.version_id], COMPOSED)
      assert.equal(callStore(db, payload).outcome, 'inserted')
      assert.equal(callStore(db, claim(e, [beta.version_id, e.version_id], COMPOSED)).outcome, 'idempotent')
      assert.equal(pg.ok(db, 'select count(distinct source_id), count(distinct (source_id,content_item_id)) from private.official_rule_claim_support;'), '1|2')
      const ids = JSON.parse(pg.ok(db, 'select jsonb_agg(version_id order by version_id) from private.official_rule_claim_support;'))
      assert.deepEqual(ids, [e.version_id, beta.version_id].sort())
    })
    await t.test('composed rejects duplicate ids, renderings, versions and duplicates hidden among three supports', () => {
      const db = pg.create('composed_bad', 'with_evidence')
      const newer = { ...e, version_id: `ev2_${'c'.repeat(32)}`, retrieved_at: '2026-10-04T00:01:00Z', previous_version_id: e.version_id }
      callStore(db, accepted(newer))
      for (const ids of [[e.version_id], [e.version_id, api.version_id], [e.version_id, newer.version_id], [e.version_id, api.version_id, beta.version_id]]) rejectStore(db, claim(e, ids, COMPOSED), '23514')
      rejectStore(db, claim(e, [e.version_id, e.version_id], COMPOSED), '22023')
      rejectStore(db, claim(e, Array(9).fill(e.version_id), COMPOSED), '22023')
    })
    await t.test('stored ineligible Evidence, missing supports, stale quality and actual cell mismatch reject', () => {
      const db = pg.create('support_eligibility', 'with_evidence')
      for (const patch of [{ lifecycle: 'superseded' }, { lifecycle: 'conflicted' }, { validation_state: 'rejected' }]) {
        const row = { ...beta, ...patch, version_id: `ev2_${Object.keys(patch)[0] === 'lifecycle' ? (patch.lifecycle === 'superseded' ? 'c' : 'd') : 'e'}`.padEnd(36, '0') }
        pg.ok(db, insertRow('official_evidence_versions', row))
        rejectStore(db, claim(e, [e.version_id, row.version_id], COMPOSED), '23514')
      }
      rejectStore(db, claim(e, [`ev2_${'f'.repeat(32)}`]), '23514')
      rejectStore(db, claim(e, [e.version_id], 'stale_primary_evidence'), '23514')
      const mixed = { ...beta, version_id: `ev2_${'9'.repeat(32)}`, destination_country_code: 'FR' }
      callStore(db, accepted(mixed))
      rejectStore(db, claim(e, [e.version_id, mixed.version_id], COMPOSED), '23514')
      const p = claim(e); p.claim.destination_country_code = 'FR'; rejectStore(db, p, '23514')
    })
    await t.test('schema-1 applicability and untyped/coercible fact fields are never persisted', () => {
      const db = pg.create('fact_shapes', 'with_evidence')
      for (const fact of [{ effect: 'required', visa_mode: 'visa_before_travel', schema: 1 },
        { effect: 'required', visa_mode: 'visa_before_travel', applicability: { kind: 'unconditional' } },
        { effect: 'conditional', visa_mode: null }, { effect: true, visa_mode: null }, { effect: 'required' }]) {
        rejectStore(db, claim(e, [e.version_id], EXPLICIT, 'requirement_effect', fact), '22023')
      }
      rejectStore(db, claim(e, [e.version_id], EXPLICIT, 'visa_options', { options: [{ ordinal: 1, visa_mode: 'electronic_visa', eligibility: 'allowed', mandate: 'not_mandatory', applicability: {} }] }), '22023')
      const p = claim(e); p.accepted_at = 'tomorrow'; rejectStore(db, p, '22023')
      rejectStore(db, { ...claim(e), extra: true }, '22023')
    })
    const factCases: Array<{ kind: string; type: string; fact: Row }> = [
      { kind: 'requirement_effect', type: 'visa', fact: { effect: 'required', visa_mode: 'visa_before_travel' } },
      { kind: 'visa_options', type: 'visa', fact: { options: [{ ordinal: 1, visa_mode: 'electronic_visa', eligibility: 'allowed', mandate: 'not_mandatory' }] } },
      { kind: 'stay_limit', type: 'visa', fact: { per_visit_value: 90, per_visit_unit: 'days', rolling_maximum_value: null, rolling_maximum_unit: null,
        rolling_within_value: null, rolling_within_unit: null, initial_grant_value: null, initial_grant_unit: null,
        extension_requires_application: null, extension_maximum_total_value: null, extension_maximum_total_unit: null, border_discretion: 'fixed' } },
      { kind: 'passport_validity', type: 'passport_validity', fact: { semantics: 'valid_on_entry', duration_value: null, duration_unit: null } },
      { kind: 'blank_passport_pages', type: 'blank_passport_pages', fact: { minimum_pages: 2 } },
      { kind: 'transit_conditions', type: 'transit', fact: { paths: [{ ordinal: 1, crosses_border_control: false, leaves_transit_area: false,
        transit_airport_codes: ['AAA', 'BBB'], max_transit_duration_minutes: 120, arrival_mode: 'air', departure_mode: 'air',
        third_country_required: null, same_flight_required: null, onward_ticket_required: true }] } },
      { kind: 'official_actions', type: 'visa', fact: { actions: [{ ordinal: 1, action_source_id: SOURCE, purpose: 'application', href: `https://${DOMAIN}/apply`, visa_mode: 'electronic_visa' }] } },
      { kind: 'temporal_rule', type: 'visa', fact: { temporal_kind: 'relative_duration', available_from_anchor: null, available_from_relation: null,
        available_from_offset_minutes: null, due_by_anchor: 'trip_departure', due_by_relation: 'before', due_by_offset_minutes: 60, due_by_semantics: 'mandatory' } },
    ]
    for (const [i, data] of factCases.entries()) {
      await t.test(`flat ${data.kind} payload retains v1 storage and exact duplicate behavior`, () => {
        const db = pg.create(`fact_${i}`, 'fixture')
        const row: Row = { ...e, requirement_type: data.type }
        callStore(db, accepted(row))
        const payload = claim(row, [row.version_id], EXPLICIT, data.kind, data.fact)
        assert.equal(callStore(db, payload).outcome, 'inserted')
        assert.equal(callStore(db, payload).outcome, 'idempotent')
        assert.equal(pg.ok(db, `select count(*) from private.${FACT_TABLES[i]};`), '1')
      })
    }
    await t.test('original deferred fact-completeness trigger remains unchanged and effective', () => {
      const db = pg.create('fact_completeness', 'with_evidence')
      const definition = "select md5(pg_get_functiondef('private.official_rule_claim_require_fact_payload()'::regprocedure));"
      assert.equal(pg.ok(db, definition), pg.ok('v1empty', definition))
      assert.equal(pg.ok(db, `select count(*) from pg_trigger where not tgisinternal and tgname like '%_fact_payload';`), '9')
      const c: Row = { ...claim(e).claim, accepted_at: AT }; delete c.support_version_ids; delete c.fact
      const error = pg.fail(db, `begin; ${insertRow('official_rule_claims', c)} set constraints private.official_rule_claims_fact_payload immediate; commit;`, '23514')
      assert.ok(error.includes('has no persisted'), error)
      assert.equal(pg.ok(db, 'select count(*) from private.official_rule_claims;'), '0')
    })
    await t.test('deferred support count prevents complete facts with zero supports', () => {
      const db = pg.create('support_count', 'with_evidence')
      const c: Row = { ...claim(e).claim, accepted_at: AT }; delete c.support_version_ids; delete c.fact
      const error = pg.fail(db, `begin; ${insertRow('official_rule_claims', c)}
        insert into private.official_rule_claim_requirement_effect select claim_id,'requirement_effect','visa','required','visa_before_travel' from private.official_rule_claims;
        set constraints private.official_rule_claims_support_count_v2 immediate; commit;`, '23514')
      assert.ok(error.includes('ContentItemRef'), error)
      assert.equal(pg.ok(db, 'select count(*) from private.official_rule_claims;'), '0')
    })
    await t.test('late fact failure and later statement failure roll back claims, facts and supports', () => {
      const db = pg.create('rule_rollback', 'with_evidence')
      rejectStore(db, claim(e, [e.version_id], EXPLICIT, 'requirement_effect', { effect: 'not_required', visa_mode: 'visa_before_travel' }), '23514')
      const before = snapshot(db)
      pg.fail(db, `begin; ${store(claim(e))} select 1/0; commit;`, '22012', 'service_role')
      assert.equal(snapshot(db), before)
      pg.fail(db, `begin isolation level repeatable read; ${store(claim(e))} commit;`, '0A000', 'service_role')
      pg.ok(db, `begin; ${store(claim(e))} ${store(claim(e, [e.version_id], EXPLICIT, 'visa_options', factCases[1]!.fact))} commit;`, 'service_role')
      assert.equal(pg.ok(db, 'select count(*) from private.official_rule_claims;'), '2')
    })
    await t.test('multiple catalog operations in one transaction keep deferred completion correct', () => {
      const db = pg.create('catalog_transaction', 'fixture')
      pg.ok(db, `begin; ${catalog(registration('one'))} ${catalog(registration('two'))} commit;`, 'service_role')
      const before = snapshot(db)
      pg.fail(db, `begin; ${catalog(registration('three'))} ${catalog(registration('one'))} select 1/0; commit;`, '22012', 'service_role')
      assert.equal(snapshot(db), before)
      pg.fail(db, `begin isolation level repeatable read; ${catalog(registration('repeatable'))} commit;`, '0A000', 'service_role')
    })
    const waitFor = async (sql: string) => {
      for (let attempt = 0; attempt < 100; attempt++) {
        if (pg.ok('postgres', sql) === 't') return
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      assert.fail('concurrent fixture did not reach the expected database wait')
    }
    const race = async (db: string, a: string, b: string) => {
      const first = pg.asyncRun(db, `begin; set local role service_role; ${a} select pg_sleep(1.2); commit;`, 'identity_race_a')
      await waitFor("select exists(select 1 from pg_stat_activity where application_name='identity_race_a' and wait_event='PgSleep');")
      const second = pg.asyncRun(db, `set role service_role; ${b}`, 'identity_race_b')
      await waitFor("select exists(select 1 from pg_stat_activity where application_name='identity_race_b' and wait_event_type='Lock');")
      return Promise.all([first, second])
    }
    await t.test('concurrent exact registration serializes to inserted plus idempotent, one owner', async () => {
      const db = pg.create('race_exact', 'fixture'); const p = registration('race')
      const results = await race(db, catalog(p), catalog(p))
      for (const result of results) assert.equal(result.code, 0, result.err)
      assert.ok(results[0]!.out.includes('inserted')); assert.ok(results[1]!.out.includes('idempotent'))
      assert.equal(pg.ok(db, "select count(*) from private.official_content_items where content_item_id='race';"), '1')
    })
    await t.test('concurrent external identity collision cannot split ownership', async () => {
      const db = pg.create('race_external', 'fixture'); const a = registration('race-a'), b = registration('race-b')
      b.item.external_content_id = a.item.external_content_id
      const [first, second] = await race(db, catalog(a), catalog(b))
      assert.equal(first!.code, 0, first!.err); assert.notEqual(second!.code, 0); assert.ok(second!.err.includes('23505'), second!.err)
      assert.equal(pg.ok(db, "select count(*) from private.official_content_items where external_content_id='external-race-a';"), '1')
      assert.equal(pg.ok(db, "select count(*) from private.official_content_representations where content_item_id='race-b';"), '0')
    })
    await t.test('concurrent URL collision rolls back losing item/version/representation and reservation', async () => {
      const db = pg.create('race_url', 'fixture'); const a = registration('race-a'), b = registration('race-b')
      b.representations[0]!.expected_final_url = a.representations[0]!.expected_final_url
      const [first, second] = await race(db, catalog(a), catalog(b))
      assert.equal(first!.code, 0, first!.err); assert.notEqual(second!.code, 0); assert.ok(second!.err.includes('23505'), second!.err)
      for (const table of NEW_TABLES.filter(n => n !== 'official_source_blocked_domains')) assert.equal(pg.ok(db, `select count(*) from private.${table} where content_item_id='race-b';`), '0')
    })
    await t.test('concurrent parent/child source registration cannot create overlapping authorities', async () => {
      const db = pg.create('race_domains', 'fixture')
      const [a, b] = await race(db, catalog(source('example-race-a', 'race.example')), catalog(source('example-race-b', 'child.race.example')))
      assert.equal(a!.code, 0, a!.err); assert.notEqual(b!.code, 0); assert.ok(b!.err.includes('23505'), b!.err)
      assert.equal(pg.ok(db, "select count(*) from private.official_sources where source_id='example-race-b';"), '0')
    })
    await t.test('concurrent exact Evidence and Rule stores preserve idempotence', async () => {
      const db = pg.create('race_store', 'fixture')
      for (const payload of [accepted(e), claim(e)]) {
        const results = await race(db, store(payload), store(payload))
        for (const result of results) assert.equal(result.code, 0, result.err)
        assert.ok(results[1]!.out.includes('idempotent'))
      }
      assert.equal(pg.ok(db, 'select count(*) from private.official_evidence_versions;'), '1')
      assert.equal(pg.ok(db, 'select count(*) from private.official_rule_claims;'), '1')
    })
  } finally { pg.stop() }
})
