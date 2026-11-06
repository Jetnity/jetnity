// Official Truth private-table RLS/ACL proof. Disposable PostgreSQL ONLY.
// No Supabase project, DSN, remote database, browser account or hosted readback.
// This test cannot qualify #917 Stage1 or turn research into trusted facts.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { findLocalPgBins, startLocalProofCluster } from '../../scripts/db/official-truth-integrated-pilot-1/local-cluster'

const DIR = join(process.cwd(), 'supabase/migrations')
const MIGRATIONS = [
  '20261001121258_official_truth_private_evidence_store_schema_1.sql',
  '20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql',
  '20261001180549_official_truth_trusted_store_writer_1.sql',
  '20261001193748_official_truth_source_catalog_gateway_1.sql',
  '20261004010705_official_truth_content_identity_2.sql',
  '20261004223959_official_truth_v2_catalog_hardening_1.sql',
  '20261010180000_official_truth_source_fingerprint_protocol_2.sql',
] as const

// Exact tables from the seven source-controlled Foundation/Identity/Fingerprint
// migrations. New tables or missing RLS cannot be silently accepted.
const TABLES = [
  'official_content_identity_profile_pins',
  'official_content_item_versions',
  'official_content_items',
  'official_content_representation_urls',
  'official_content_representations',
  'official_content_url_reservations',
  'official_evidence_versions',
  'official_rule_claim_actions',
  'official_rule_claim_blank_pages',
  'official_rule_claim_passport_validity',
  'official_rule_claim_requirement_effect',
  'official_rule_claim_stay_limit',
  'official_rule_claim_support',
  'official_rule_claim_temporal_rule',
  'official_rule_claim_transit_paths',
  'official_rule_claim_visa_options',
  'official_rule_claims',
  'official_source_blocked_domains',
  'official_source_domains',
  'official_source_fingerprint_protocols',
  'official_sources',
  'official_truth_v2_fingerprint_receipts',
] as const

const RPCS = [
  'official_truth_source_catalog_v1',
  'official_truth_source_catalog_v2',
  'official_truth_store_accepted_fingerprint_v2',
  'official_truth_store_accepted_v1',
  'official_truth_store_accepted_v2',
] as const

function migration(name: string): string {
  return readFileSync(join(DIR, name), 'utf8')
}

test('Official Truth native RLS: exactly 22 source-owned private tables declared', () => {
  const found = MIGRATIONS.flatMap(name => {
    const sql = migration(name).replace(/--[^\n]*/g, '')
    return [...sql.matchAll(/\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?private\.([a-z0-9_]+)/gi)]
      .map(match => match[1]!)
  }).sort()
  assert.deepEqual(found, [...TABLES], 'new or missing private tables require explicit RLS re-review')
  assert.equal(new Set(found).size, TABLES.length)
})

const pgBins = findLocalPgBins()

test('Official Truth private schema: real 7-migration chain rejects direct API roles in isolated PG',
  { skip: !pgBins, timeout: 150_000 }, () => {
    // startLocalProofCluster rejects inherited remote credentials/URLs, owns
    // a socket-only temporary PostgreSQL cluster and cleans it in finally.
    const cluster = startLocalProofCluster()
    const sql = (statement: string): string => execFileSync(pgBins!.psql,
      ['-X', '--no-psqlrc', '-Atq', '-h', cluster.socket, '-p', String(cluster.port),
        '-U', cluster.user, '-d', cluster.database, '-v', 'ON_ERROR_STOP=1',
        '-v', 'VERBOSITY=verbose'],
      { input: statement, encoding: 'utf8', timeout: 35_000, maxBuffer: 2_097_152 },
    ).trim()

    const denied = (role: 'anon' | 'authenticated' | 'service_role', statement: string) => {
      let failure: unknown = null
      try {
        sql(`set role ${role}; ${statement}`)
      } catch (error) {
        failure = error
      }
      assert.ok(failure, 'unexpected private-table or RPC access for ' + role)
      const stderr = String((failure as { stderr?: unknown }).stderr ?? '')
      assert.match(stderr, /42501|permission denied/i)
    }

    try {
      sql(`
        create schema extensions;
        create extension if not exists pgcrypto with schema extensions;
        create role anon nologin noinherit;
        create role authenticated nologin noinherit;
        create role service_role nologin noinherit bypassrls;
        grant usage on schema public to anon, authenticated, service_role;
      `)
      for (const name of MIGRATIONS) sql(migration(name))

      const installed = JSON.parse(sql(`
        select coalesce(jsonb_agg(jsonb_build_object(
          'name', c.relname,
          'rls', c.relrowsecurity,
          'forced', c.relforcerowsecurity,
          'policies', (select count(*) from pg_catalog.pg_policy x where x.polrelid=c.oid),
          'anon', pg_catalog.has_table_privilege('anon',c.oid,
            'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'),
          'authenticated', pg_catalog.has_table_privilege('authenticated',c.oid,
            'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'),
          'service_role', pg_catalog.has_table_privilege('service_role',c.oid,
            'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
        ) order by c.relname), '[]'::jsonb)
        from pg_catalog.pg_class c
        join pg_catalog.pg_namespace n on n.oid=c.relnamespace
        where n.nspname='private' and c.relkind in ('r','p')
      `)) as Array<{
        name: string
        rls: boolean
        forced: boolean
        policies: number
        anon: boolean
        authenticated: boolean
        service_role: boolean
      }>
      assert.deepEqual(installed.map(t => t.name), [...TABLES],
        'unexpected private table, missing migration or incomplete inventory')
      for (const table of installed) {
        assert.equal(table.rls, true, table.name + ' RLS off')
        assert.equal(table.forced, true, table.name + ' FORCE RLS off')
        assert.equal(table.policies, 0, table.name + ' unknown RLS policy')
        assert.equal(table.anon, false, table.name + ' anon privilege')
        assert.equal(table.authenticated, false, table.name + ' authenticated privilege')
        assert.equal(table.service_role, false, table.name + ' service_role direct table privilege')
      }
      for (const role of ['anon', 'authenticated', 'service_role'] as const) {
        assert.equal(sql(`select pg_catalog.has_schema_privilege('${role}',
          'private','USAGE')::text`), 'f', role + ' can access private schema')
        for (const table of ['official_sources', 'official_rule_claims',
          'official_content_identity_profile_pins', 'official_truth_v2_fingerprint_receipts'] as const) {
          denied(role, `select * from private.${table} limit 1;`)
          denied(role, `insert into private.${table} default values;`)
        }
      }

      const gateways = JSON.parse(sql(`
        select coalesce(jsonb_agg(jsonb_build_object(
          'name', p.proname,
          'anon', pg_catalog.has_function_privilege('anon',p.oid,'EXECUTE'),
          'authenticated', pg_catalog.has_function_privilege('authenticated',p.oid,'EXECUTE'),
          'service_role', pg_catalog.has_function_privilege('service_role',p.oid,'EXECUTE')
        ) order by p.proname), '[]'::jsonb)
        from pg_catalog.pg_proc p
        join pg_catalog.pg_namespace n on n.oid=p.pronamespace
        where n.nspname='public' and p.proname like 'official_truth_%'
      `)) as Array<{ name: string; anon: boolean; authenticated: boolean; service_role: boolean }>
      assert.deepEqual(gateways.map(g => g.name), [...RPCS],
        'unknown callable Official Truth RPC added; review privileges')
      for (const gate of gateways) {
        assert.equal(gate.anon, false, gate.name + ' anon gateway execute')
        assert.equal(gate.authenticated, false, gate.name + ' authenticated gateway execute')
        assert.equal(gate.service_role, true, gate.name + ' service role missing gateway execute')
      }
      denied('anon', `select public.official_truth_source_catalog_v2(
        '{"operation":"read_registry"}'::jsonb);`)
      denied('authenticated', `select public.official_truth_store_accepted_v2('{}'::jsonb);`)

      // Synthetic read of the empty local catalog by its only authorized role
      // demonstrates that no direct table grants are required. No accepted
      // Evidence, Rule or real publisher record is created by the test.
      const registry = JSON.parse(sql(`
        set role service_role;
        select public.official_truth_source_catalog_v2(
          '{"operation":"read_registry"}'::jsonb);
      `)) as { ok?: unknown; sources?: unknown[] }
      assert.equal(registry.ok, true)
      assert.deepEqual(registry.sources, [])
      assert.equal(sql(`select count(*) from private.official_evidence_versions`), '0')
      assert.equal(sql(`select count(*) from private.official_rule_claims`), '0')
      assert.equal(sql(`select count(*) from private.official_truth_v2_fingerprint_receipts`), '0')
    } finally {
      cluster.stop()
    }
  },
)
