import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'

const DATEI = '20260901020000_provider_cost_guard_s6a.sql'
const sql = readFileSync(join('supabase/migrations', DATEI), 'utf8')
const sqlOhneKommentare = sql
  .replace(/--[^\n]*/g, '')
  .replace(/'[^']*'/g, "''")
const config = readFileSync('supabase/config.toml', 'utf8')
const adapter = readFileSync('lib/provider-ops/persistent-cost-guard.ts', 'utf8')

describe('Provider Readiness S6-A Persistenzvertrag', () => {
  test('bleibt nach einem späteren Apply standardmässig hard-off', () => {
    assert.match(sql, /production_write_path_allocated boolean not null default false/)
    assert.match(
      sql,
      /values \(\s*true,\s*false,\s*null,/,
    )
    assert.doesNotMatch(sqlOhneKommentare, /insert into jetnity_internal\.provider_cost_guard_policy/)
    assert.doesNotMatch(sqlOhneKommentare, /enabled\s*=\s*true/)
  })

  test('privilegierter Reservierungsweg bleibt intern und least-privilege', () => {
    assert.match(sql, /create schema if not exists jetnity_internal/)
    assert.match(sql, /create role jetnity_provider_cost_guard_writer nologin/)
    assert.doesNotMatch(sql, /create role jetnity_provider_cost_guard_runtime/)
    assert.match(sql, /security definer/)
    assert.match(sql, /set search_path = ''/)
    assert.doesNotMatch(sqlOhneKommentare, /auth\.role\s*\(/)
    assert.match(
      sql,
      /revoke all on function jetnity_internal\.provider_cost_guard_reservieren\(jsonb\)\s+from public, anon, authenticated, service_role/,
    )
    assert.match(
      sql,
      /grant execute on function jetnity_internal\.provider_cost_guard_reservieren\(jsonb\)\s+to jetnity_provider_cost_guard_writer/,
    )
    assert.doesNotMatch(
      sql,
      /grant execute on function jetnity_internal\.provider_cost_guard_reservieren\(jsonb\)\s+to (public|anon|authenticated|service_role)/,
    )
    assert.doesNotMatch(config, /schemas = \[[^\]]*jetnity_internal/)
    assert.match(config, /schemas = \["public", "graphql_public"\]/)
  })

  test('Policy und Reservierungen liegen nicht in public und haben Defense-in-Depth-RLS', () => {
    assert.match(sql, /create table if not exists jetnity_internal\.provider_cost_guard_policy/)
    assert.match(sql, /create table if not exists jetnity_internal\.provider_cost_guard_reservation/)
    assert.doesNotMatch(sqlOhneKommentare, /create table(?: if not exists)? public\.provider_cost_guard/)
    assert.match(sql, /alter table jetnity_internal\.provider_cost_guard_policy enable row level security/)
    assert.match(sql, /alter table jetnity_internal\.provider_cost_guard_reservation enable row level security/)
    assert.match(
      sql,
      /revoke all on table jetnity_internal\.provider_cost_guard_policy\s+from public, anon, authenticated, service_role, jetnity_provider_cost_guard_writer/,
    )
    assert.match(
      sql,
      /revoke all on table jetnity_internal\.provider_cost_guard_reservation\s+from public, anon, authenticated, service_role, jetnity_provider_cost_guard_writer/,
    )
    assert.doesNotMatch(sql, /grant (select|insert|update|delete|all) on table jetnity_internal\.provider_cost_guard_/)
  })

  test('erzwingt Caller- und Domain-Window plus Day; Global bleibt optional', () => {
    assert.match(sql, /scope in \('caller', 'domain', 'global'\)/)
    assert.match(sql, /period in \('window', 'day'\)/)
    assert.match(sql, /period = 'day' and window_seconds = 86400/)
    assert.match(sql, /_has_caller_window/)
    assert.match(sql, /_has_caller_day/)
    assert.match(sql, /_has_domain_window/)
    assert.match(sql, /_has_domain_day/)
    assert.match(sql, /p\.scope = 'global' or p\.domain = _domain/)
    assert.match(
      sql,
      /if not _has_caller_window\s+or not _has_caller_day\s+or not _has_domain_window\s+or not _has_domain_day/,
    )
  })

  test('Prüfung und Reservierung sind unter einer globalen Transaktionssperre atomar', () => {
    const lockAt = sql.search(/pg_advisory_xact_lock/)
    const policyAt = sql.search(/from jetnity_internal\.provider_cost_guard_policy p/)
    const insertAt = sql.search(/insert into jetnity_internal\.provider_cost_guard_reservation/)

    assert.ok(lockAt >= 0)
    assert.ok(policyAt > lockAt)
    assert.ok(insertAt > policyAt)
    assert.match(sql, /count\(\*\)/)
    assert.match(sql, /sum\(r\.reserved_cost_microusd\)/)
    assert.match(sql, /_cost_sum \+ _cost::numeric > _policy\.max_cost_microusd::numeric/)
  })

  test('DB-Zeit ist autoritativ und kein Request darf einen Zeitstempel behaupten', () => {
    assert.match(sql, /_now := clock_timestamp\(\)/)
    assert.match(sql, /created_at timestamptz not null default clock_timestamp\(\)/)
    assert.doesNotMatch(sqlOhneKommentare, /_payload\s*->>\s*''createdAt''/)
    assert.doesNotMatch(sqlOhneKommentare, /_payload\s*->>\s*''observedAt''/)
  })

  test('Cost Store enthält keine Reise- oder Traveller-Payload-Felder', () => {
    assert.doesNotMatch(
      sqlOhneKommentare,
      /\b(trip_id|trip_item_id|traveller|citizenship|passport|mrz|search_payload|provider_response)\b/i,
    )
    assert.match(sql, /identifier_hash text not null/)
    assert.match(sql, /identifier_hash ~ '\^\[0-9a-f\]\{64\}\$'/)
    assert.match(sql, /reserved_cost_microusd bigint not null/)
  })

  test('jeder SQL-Fehler bleibt im Reservierungsvertrag fail-closed', () => {
    assert.match(sql, /exception\s+when others then/)
    assert.match(sql, /jsonb_build_object\('ok', false, 'retryAfterSec', 1\)/)
    assert.match(sql, /jetnity\.provider_cost_guard\.reserve\.v1/)
  })

  test('TypeScript-Adapter ist server-only und entscheidet keinen Production-Transport', () => {
    assert.match(adapter, /import 'server-only'/)
    assert.match(adapter, /createHmac\('sha256'/)
    assert.match(adapter, /identifierHash/)
    assert.match(adapter, /ProviderOpsPersistentCostGuardPort/)
    assert.doesNotMatch(adapter, /SUPABASE_SERVICE_ROLE_KEY/)
    assert.doesNotMatch(adapter, /SUPABASE_SECRET/)
    assert.doesNotMatch(adapter, /createClient\(/)
    assert.doesNotMatch(adapter, /process\.env/)
    assert.match(adapter, /leeren\(\) \{/)
    assert.match(adapter, /Bewusster No-op|Bewusster No-op\./i)
  })
})
