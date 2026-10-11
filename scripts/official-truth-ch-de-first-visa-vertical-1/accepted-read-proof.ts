// Focused developer proof of the missing accepted-reader primitive. No DSN,
// secrets, hosted connections, new SQL contract or privilege expansion.
import { readFileSync } from 'node:fs'
import { startLocalProofCluster } from '../db/official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError } from '../db/official-truth-integrated-pilot-1/pg-wire'

const migrations = [
  '20261001121258_official_truth_private_evidence_store_schema_1.sql',
  '20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql',
  '20261001180549_official_truth_trusted_store_writer_1.sql',
  '20261001193748_official_truth_source_catalog_gateway_1.sql',
  '20261004010705_official_truth_content_identity_2.sql',
  '20261004223959_official_truth_v2_catalog_hardening_1.sql',
  '20261010180000_official_truth_source_fingerprint_protocol_2.sql',
] as const

export async function runChDeAcceptedReadProof() {
  const cluster = startLocalProofCluster()
  let owner: LocalPgConnection | null = null
  const checks: string[] = []
  try {
    if (!/^postgres \(PostgreSQL\) 16\./.test(cluster.version)) throw Error('native_postgresql16_required')
    owner = await LocalPgConnection.connect(cluster)
    await owner.query(`create schema extensions;
      create extension pgcrypto with schema extensions;
      create role anon nologin noinherit;
      create role authenticated nologin noinherit;
      create role service_role nologin noinherit bypassrls;
      grant usage on schema public to anon, authenticated, service_role;`)
    for (const name of migrations) {
      await owner.query(readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), 'utf8'))
    }
    // Read installed catalog facts under one immutable local transaction snapshot.
    // These are missing-data diagnostics, never an accepted-record reader or a
    // claim that checking field names alone establishes semantic provenance.
    await owner.query('begin isolation level repeatable read read only')
    const columns = await owner.query(`select c.relname as relation, a.attname as column
      from pg_catalog.pg_attribute a
      join pg_catalog.pg_class c on c.oid = a.attrelid
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'private' and c.relkind = 'r'
        and a.attnum > 0 and not a.attisdropped
      order by c.relname, a.attnum`)
    const fields = (relation: string) => columns.filter(row => row.relation === relation).map(row => row.column)
    const receipt = fields('official_truth_v2_fingerprint_receipts')
    if (receipt.join(',') !== 'backend_pid,transaction_id,version_id') throw Error('receipt_contract_changed')
    const evidence = fields('official_evidence_versions')
    for (const name of ['version_id', 'previous_version_id', 'source_content_hash', 'retrieved_at',
      'valid_from', 'valid_until', 'identity_profile_id', 'identity_profile_version', 'source_fingerprint_protocol']) {
      if (!evidence.includes(name)) throw Error('evidence_contract_missing')
    }
    const claims = fields('official_rule_claims')
    if (!claims.includes('accepted_at') || !claims.includes('lifecycle')) throw Error('claim_contract_missing')
    // The actual migrated accepted-store schema has no durable body, receipt
    // binding, review packet or revocation event relation/column. A new such
    // contract must cause this diagnostic to be reassessed, not silently pass.
    if (columns.some(row => /snapshot|canonical_bytes|receipt_id|record_fingerprint|review|revok|revocation|event_sequence/.test(
      `${row.relation}:${row.column}`))) throw Error('custody_contract_requires_reassessment')
    const links = await owner.query(`select count(*)::text as count
      from pg_catalog.pg_constraint k
      join pg_catalog.pg_class c on c.oid = k.conrelid
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      join pg_catalog.pg_class target on target.oid = k.confrelid
      join pg_catalog.pg_namespace target_schema on target_schema.oid = target.relnamespace
      where k.contype = 'f' and n.nspname = 'private'
        and target_schema.nspname <> 'private'`)
    if (links.length !== 1 || links[0]?.count !== '0') throw Error('custody_link_contract_changed')
    const constraints = await owner.query(`select pg_catalog.pg_get_constraintdef(oid) as definition
      from pg_catalog.pg_constraint
      where conrelid = 'private.official_rule_claims'::regclass
        and conname = 'official_rule_claims_lifecycle'`)
    if (constraints.length !== 1 || constraints[0]?.definition !== "CHECK ((lifecycle = 'accepted'::text))") {
      throw Error('rule_lifecycle_contract_changed')
    }
    await owner.query('commit')
    checks.push('installed_evidence_has_metadata_without_retained_whole_body',
      'fingerprint_receipt_has_only_transaction_coordinates',
      'installed_rule_has_no_review_or_revocation_history',
      'accepted_store_has_no_durable_provenance_store_link')
    const denied = async (sql: string, code: string) => {
      try { await owner!.query(sql) } catch (error) {
        if (error instanceof LocalPgError && error.code === code) return
        throw Error('unexpected_local_refusal')
      }
      throw Error('missing_local_refusal')
    }
    for (const role of ['anon', 'authenticated', 'service_role'] as const) {
      await owner.query(`set role ${role}`)
      for (const table of ['official_evidence_versions', 'official_rule_claims', 'official_rule_claim_support', 'official_truth_v2_fingerprint_receipts', 'official_content_identity_profile_pins']) {
        await denied(`select * from private.${table} limit 1`, '42501')
      }
      checks.push(`${role}_cannot_read_accepted_rows_or_custody`)
      await owner.query('reset role')
    }
    await owner.query('set role service_role')
    for (const operation of ['read_accepted', 'read_registry', 'read_rule_history']) {
      await denied(`select public.official_truth_store_accepted_v2('{"operation":"${operation}"}'::jsonb)`, '22023')
    }
    checks.push('writer_rpc_is_not_a_read_capability')
    await owner.query('reset role')
    const state = await owner.query(`select
      (select count(*) from private.official_evidence_versions)::text as evidence,
      (select count(*) from private.official_rule_claims)::text as rules,
      (select count(*) from private.official_source_fingerprint_protocols)::text as profiles,
      (select count(*) from private.official_truth_v2_fingerprint_receipts)::text as receipts`)
    if (state.length !== 1 || Object.values(state[0]!).some(value => value !== '0')) throw Error('unexpected_acceptance')
    checks.push('no_source_profile_evidence_rule_or_receipt_promoted')
    return Object.freeze({ schema: 'ch-de-accepted-read-boundary-v2', status: 'REFUSAL_VERIFIED',
      postgres: cluster.version, checks: Object.freeze(checks), migrationCount: migrations.length,
      positiveAcceptedRead: 'NOT_VERIFIED', sourceStatus: 'SOURCE_NOT_QUALIFIED',
      reason: 'retained_accepted_custody_contract_missing',
      missingDependencies: Object.freeze(['M1_retained_original_material', 'M2_durable_custody_binding',
        'M3_accepted_review_history', 'M4_current_revocation_history']),
      positiveStructuralAcceptedRead: 'NOT_VERIFIED', hostedWrites: 0, positiveVisaCells: 0 })
  } finally {
    owner?.close()
    cluster.stop()
  }
}
