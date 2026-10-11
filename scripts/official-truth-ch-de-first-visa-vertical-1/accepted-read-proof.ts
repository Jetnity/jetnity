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
    const denied = async (sql: string, code: string) => {
      try { await owner!.query(sql) } catch (error) {
        if (error instanceof LocalPgError && error.code === code) return
        throw Error('unexpected_local_refusal')
      }
      throw Error('missing_local_refusal')
    }
    for (const role of ['anon', 'authenticated', 'service_role'] as const) {
      await owner.query(`set role ${role}`)
      for (const table of ['official_evidence_versions', 'official_rule_claims', 'official_rule_claim_support', 'official_truth_v2_fingerprint_receipts']) {
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
    return Object.freeze({ schema: 'ch-de-accepted-read-boundary-v1', status: 'REFUSAL_VERIFIED',
      postgres: cluster.version, checks: Object.freeze(checks), migrationCount: migrations.length,
      positiveAcceptedRead: 'NOT_VERIFIED', sourceStatus: 'SOURCE_NOT_QUALIFIED',
      reason: 'accepted_reader_contract_unavailable', hostedWrites: 0, positiveVisaCells: 0 })
  } finally {
    owner?.close()
    cluster.stop()
  }
}
