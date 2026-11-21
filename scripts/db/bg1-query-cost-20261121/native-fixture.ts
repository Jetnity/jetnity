// Owned PG17 only. Synthetic lineage rows exercise the COMPLETE captured production
// assertion, catalog and audit bodies. This is not the full Production installer
// stack and never claims to exercise the audit's unrelated job/Auth checks.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { splitSql } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { original, literal, target } from './build.mjs'

export const guard = 'official_v3_guard_private'
// The existing backend deliberately resets identity/GUCs after every call.
export const creator = `SET SESSION AUTHORIZATION postgres; SET search_path=pg_catalog;
SET work_mem='3500kB'; SET jit=off; SET jetnity.bg1_query_cost_target=${literal(target)};`
export const lineageTables = ['baselines_v1', 'status_baseline_v1', 'rolling_quota_baseline_v1',
  'admin_runtime_baseline_v1', 'saved_offers_baseline_v1', 'weather_quota_baseline_v1',
  'at_source_monitor_baseline_v1', 'at_batch_switch_baseline_v2', 'bg1_transient_baseline_v3']
export const source = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
export const hash = (expression: string) => `encode(sha256(convert_to((${expression})::text,'UTF8')),'hex')`
export const canonicalRow = (alias: string) => `to_jsonb(${alias})||jsonb_build_object('proof_not_before',extract(epoch FROM ${alias}.proof_not_before))`
const table = (name: string, columns: string) => `CREATE TABLE ${guard}.${name}(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),${columns},
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL CHECK(isfinite(proof_not_before)),catalog jsonb NOT NULL);`
const digestColumn = (name: string) => `${name} text NOT NULL CHECK(${name} ~ '^[a-f0-9]{64}$')`
const predecessor = (name: string) => digestColumn('predecessor_catalog_digest') + ',' + digestColumn(name)

export async function createFixture(proof: OwnedPersistentProof) {
  const stateSource = source('official-truth-v3-background-guard-1/parts/state.sql')
  const statePrelude = stateSource.slice(0, stateSource.indexOf('CREATE FUNCTION official_v3_guard_private.require_open_v1'))
  assert.ok(statePrelude.includes("RAISE EXCEPTION 'bg1 immutable evidence'"))
  const policy = splitSql(source('official-truth-v3-rolling-jobs-quota-1/policy.sql'))
    .find(sql => sql.includes('CREATE TABLE official_v3_jobs_private.rolling_policy_v2'))
  assert.ok(policy)
  await proof.run(`CREATE ROLE postgres NOSUPERUSER BYPASSRLS LOGIN;
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE ROLE supabase_read_only_user;
GRANT CREATE ON DATABASE postgres TO postgres;
GRANT USAGE,CREATE ON SCHEMA public TO postgres;
SET SESSION AUTHORIZATION postgres;
SET work_mem='3500kB'; SET jit=off;
SET jetnity.bg1_query_cost_target=${literal(target)};
${statePrelude}
-- Real nonempty sticky incident/freshness sentinels: a query optimization must
-- never repair, release, renew or erase any of this operational state.
UPDATE official_v3_guard_private.state_v1 SET installed_at='2026-10-31T00:00:00Z',generation=7,
 last_due='2026-11-01T00:00:00Z',last_started='2026-11-01T00:00:00Z',
 last_proof_started='2026-11-01T00:00:01Z',last_finished='2026-11-01T00:00:02Z',valid_until='2026-11-01T00:05:30Z',
 incident_generation=1,incident_at='2026-11-01T00:00:00Z',resumed_generation=0 WHERE singleton;
INSERT INTO official_v3_guard_private.incidents_v1 VALUES(1,'2026-11-01T00:00:00Z','refused',7,'2026-11-01T00:00:01Z');
INSERT INTO official_v3_guard_private.runs_v1 VALUES('2026-11-01T00:00:00Z','2026-11-01T00:00:00Z',
 '2026-11-01T00:00:01Z','2026-11-01T00:00:02Z','refused',7,1);
CREATE SCHEMA official_v3_jobs_private AUTHORIZATION postgres;
${policy}
INSERT INTO official_v3_jobs_private.rolling_policy_v2 VALUES(
 'research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513',
 '{"fixture":"owned-native"}',86400,64,256,0,0,'2026-11-01T00:00:00Z');
${table('status_baseline_v1', predecessor('predecessor_baselines_digest') + ',provider_digest text NOT NULL')}
${table('rolling_quota_baseline_v1', predecessor('predecessor_status_digest') + ',predecessor_provider_digest text NOT NULL,policy jsonb NOT NULL')}
${table('admin_runtime_baseline_v1', predecessor('predecessor_rolling_digest') + ',predecessor_provider_digest text NOT NULL,definition_digest text NOT NULL')}
${table('saved_offers_baseline_v1', predecessor('predecessor_admin_digest') + ',migration_blob text NOT NULL,approved_delta_digest text NOT NULL')}
${table('weather_quota_baseline_v1', 'candidate_sha256 text NOT NULL,' + digestColumn('predecessor_sha256'))}
${table('at_source_monitor_baseline_v1', predecessor('predecessor_weather_digest'))}
${table('at_batch_switch_baseline_v2', predecessor('predecessor_baseline_digest'))}
${table('bg1_transient_baseline_v3', predecessor('predecessor_baseline_digest'))}
CREATE SCHEMA auth; CREATE TABLE auth.users(id text PRIMARY KEY); CREATE TABLE auth.sessions(id text PRIMARY KEY);
INSERT INTO auth.users VALUES('owned-user'); INSERT INTO auth.sessions VALUES('owned-session');
CREATE SCHEMA cron; CREATE TABLE cron.job(jobid bigint PRIMARY KEY,schedule text,command text,active boolean);
INSERT INTO cron.job VALUES(1,'*/5 * * * *','SELECT official_v3_guard_private.audit_v1()',true);
CREATE TABLE public.bg1_native_measurements(label text PRIMARY KEY,plan jsonb NOT NULL);
CREATE TABLE official_v3_jobs_private.native_parent(id integer);
CREATE TABLE official_v3_jobs_private.native_child(extra integer) INHERITS(official_v3_jobs_private.native_parent);
DO $protect$ DECLARE name text; BEGIN
 FOREACH name IN ARRAY ${literal('{' + lineageTables.slice(1).join(',') + '}')}::text[] LOOP
  EXECUTE format('ALTER TABLE ${guard}.%I ENABLE ROW LEVEL SECURITY',name);
  EXECUTE format('ALTER TABLE ${guard}.%I FORCE ROW LEVEL SECURITY',name);
  EXECUTE format('CREATE POLICY postgres_only ON ${guard}.%I TO postgres USING(true) WITH CHECK(true)',name);
  EXECUTE format('CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON ${guard}.%I FOR EACH ROW EXECUTE FUNCTION ${guard}.immutable_v1()',name);
  EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON ${guard}.%I FOR EACH STATEMENT EXECUTE FUNCTION ${guard}.immutable_v1()',name);
 END LOOP;
END $protect$;
DO $scale$ BEGIN FOR i IN 1..2400 LOOP
 EXECUTE format('CREATE FUNCTION official_v3_jobs_private.native_protected_%s() RETURNS integer LANGUAGE sql IMMUTABLE AS %L',i,'SELECT '||i);
END LOOP; END $scale$;
${Object.values(original).join('\n;\n')};
REVOKE ALL ON FUNCTION ${Object.keys(original).join(',')} FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
`, 'build owned synthetic lineage with exact captured routines')

  // Each predecessor stores a real full catalog to include the serialization and
  // hash cost paid by the production assertion. Historical snapshots are synthetic
  // copies; no predecessor condition is removed or replaced with a no-op.
  await proof.run(creator + `DO $seed$ DECLARE c jsonb; d text; r jsonb; p jsonb; BEGIN
 c:=${guard}.catalog_status_v1(); d:=${hash('c')};
 INSERT INTO ${guard}.baselines_v1(component,predecessor_digest,catalog,installed_at)
 SELECT name,repeat('a',64),c,'2026-11-01T00:00:00Z'::timestamptz FROM unnest(ARRAY['all','jobs','hrs']) name;
 SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY component COLLATE "C") INTO r FROM ${guard}.baselines_v1 b;
 INSERT INTO ${guard}.status_baseline_v1 VALUES(true,d,${hash('r')},'9edecdaad322ca8beceabac8a7d09962167ad3c7beba655531583a8bc2fdf62e',1,'2026-11-01T00:00:00Z',c);
 SELECT ${canonicalRow('v')} INTO r FROM ${guard}.status_baseline_v1 v;
 SELECT to_jsonb(v)||jsonb_build_object('installed_at',extract(epoch FROM v.installed_at)) INTO p FROM official_v3_jobs_private.rolling_policy_v2 v;
 INSERT INTO ${guard}.rolling_quota_baseline_v1 VALUES(true,d,${hash('r')},'ac8612bde7fb4b418ee7df565e388fa52bf2b1db22cf2035393b5854151e5ddc',p,2,'2026-11-02T00:00:00Z',c);
 SELECT ${canonicalRow('v')} INTO r FROM ${guard}.rolling_quota_baseline_v1 v;
 INSERT INTO ${guard}.admin_runtime_baseline_v1 VALUES(true,d,${hash('r')},'2804ccfd293752a9c4a7cb3259e71940d02c5019e89ee987ffd7d37c1da7ac4a','7bb12b91b5932e772c48e4aa87787e9f7b05badd405035ed78462e9517b3f6de',3,'2026-11-03T00:00:00Z',c);
 SELECT ${canonicalRow('v')} INTO r FROM ${guard}.admin_runtime_baseline_v1 v;
 INSERT INTO ${guard}.saved_offers_baseline_v1 VALUES(true,d,${hash('r')},'667766f5455ff2460f4eb56f04c7a62c84ca9e05',repeat('b',64),4,'2026-11-04T00:00:00Z',c);
 SELECT ${canonicalRow('v')} INTO r FROM ${guard}.saved_offers_baseline_v1 v;
 INSERT INTO ${guard}.weather_quota_baseline_v1 VALUES(true,'9cea63adc4f9bfbdc2bac0bb3a7a48da4dbf5aa83db971a3de47ff5c1d01f7ae',${hash('r')},5,'2026-11-05T00:00:00Z',c);
 SELECT ${canonicalRow('v')} INTO r FROM ${guard}.weather_quota_baseline_v1 v;
 INSERT INTO ${guard}.at_source_monitor_baseline_v1 VALUES(true,d,${hash('r')},6,'2026-11-06T00:00:00Z',c);
 SELECT ${canonicalRow('v')} INTO r FROM ${guard}.at_source_monitor_baseline_v1 v;
 INSERT INTO ${guard}.at_batch_switch_baseline_v2 VALUES(true,d,${hash('r')},7,'2026-11-07T00:00:00Z',c);
 SELECT ${canonicalRow('v')} INTO r FROM ${guard}.at_batch_switch_baseline_v2 v;
 INSERT INTO ${guard}.bg1_transient_baseline_v3 VALUES(true,d,${hash('r')},8,'2026-11-08T00:00:00Z',c);
 PERFORM ${guard}.assert_catalog_v1();
END $seed$;`, 'seed all predecessor digest edges and genuinely pass original assertion')
}

export async function snapshot(proof: OwnedPersistentProof) {
  const names = [...lineageTables.map(name => `${guard}.${name}`),
    ...['state_v1', 'runs_v1', 'incidents_v1', 'owner_operations_v1', 'retired_attempts_v1'].map(name => `${guard}.${name}`),
    'official_v3_jobs_private.rolling_policy_v2', 'auth.users', 'auth.sessions', 'cron.job']
  return proof.value<Record<string, string>>(`jsonb_build_object(${names.map(name =>
    `${literal(name)},(SELECT ${hash("coalesce(jsonb_agg(to_jsonb(v) ORDER BY to_jsonb(v)::text COLLATE \"C\"),'[]'::jsonb)")} FROM ${name} v)`).join(',')})`, creator)
}

export async function benchmark(proof: OwnedPersistentProof, label: string) {
  await proof.run(creator + `DO $measure$ DECLARE plan jsonb; BEGIN
 EXECUTE 'EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON,TIMING ON) SELECT ${guard}.assert_catalog_v1()' INTO plan;
 INSERT INTO public.bg1_native_measurements VALUES(${literal(label)},plan);
END $measure$;`, 'measure complete protected assertion ' + label)
  return proof.value<{ label: string; elapsedMs: number; tempReadBlocks: number; tempWrittenBlocks: number }>(`(
 SELECT jsonb_build_object('label',label,'elapsedMs',plan->0->'Execution Time',
 'tempReadBlocks',coalesce(plan->0->'Plan'->'Temp Read Blocks','0'::jsonb),
 'tempWrittenBlocks',coalesce(plan->0->'Plan'->'Temp Written Blocks','0'::jsonb))
 FROM public.bg1_native_measurements WHERE label=${literal(label)})`, creator)
}
