// Owned local PG17/pg_cron proof. No hosted endpoint, socket or credentials.
// Run from the repository root with JETNITY_PROFILE_CRON_PG_PREFIX explicitly set.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { isAbsolute, join } from 'node:path'
import { splitSql } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { assertLocalProofEnvironment } from '../official-truth-integrated-pilot-1/local-cluster'
import { composeProfileCronOperation, rollbackAcknowledgement } from './package.mjs'

assertLocalProofEnvironment()
const prefix = process.env.JETNITY_PROFILE_CRON_PG_PREFIX
assert.ok(prefix && isAbsolute(prefix), 'explicit absolute local PostgreSQL/pg_cron prefix required')
const packageRoot = 'scripts/db/profile-cron-recovery-20261122/'
const bin = prefix + '/usr/lib/postgresql/17/bin/'
const root = mkdtempSync(join(tmpdir(), 'jetnity-profile-cron-native-'))
const data = join(root, 'data')
const env = { ...process.env }
for (const key of Object.keys(env)) if (/^(PG|PSQL)/.test(key)) delete env[key]
const target = 'local:owned:PROFILE-CRON1'
const proofCases: string[] = []
const wire = (sql: string) => splitSql(sql).map(statement => {
  const plain = statement.replace(/--[^\n]*/g, '').trim()
  if (/^(?:BEGIN(?: ISOLATION LEVEL (?:SERIALIZABLE|READ COMMITTED)| READ ONLY)?|COMMIT|ROLLBACK)\s*;$/i.test(plain)) return plain + '\n\n'
  const encoded = statement.replaceAll('\\', '\\\\').replaceAll("'", "''").replaceAll('\r', '\\r').replaceAll('\n', '\\n')
  return "DO $wire$ BEGIN EXECUTE E'" + encoded + "'; END $wire$;\n\n"
}).join('')
const run = (sql: string, expectedError?: RegExp) => {
  const result = spawnSync(bin + 'postgres', ['--single', '-D', data, '-j', '-c', 'shared_preload_libraries=pg_cron',
    '-c', 'cron.database_name=postgres', '-c', 'cron.launch_active_jobs=off', '-c', 'log_min_error_statement=panic',
    '-c', 'log_error_verbosity=terse', '-c', 'exit_on_error=off', '-c', 'timezone=UTC', 'postgres'],
  { input: wire(sql), encoding: 'utf8', env, timeout: 20000, maxBuffer: 1024 * 1024 })
  assert.ifError(result.error)
  assert.equal(result.status, 0, result.stderr)
  const errors = result.stderr.split('\n').filter(line => /\b(?:ERROR|FATAL|PANIC):/.test(line))
  if (expectedError) {
    assert.ok(errors.length, 'the operation must refuse')
    assert.match(errors[0], expectedError)
    for (const line of errors.slice(1)) assert.match(line, /current transaction is aborted/)
  } else assert.deepEqual(errors, [], result.stderr)
  return result.stdout + '\n' + result.stderr
}
const value = <T>(expression: string): T => {
  const out = run("DO $value$ BEGIN RAISE WARNING 'PROFILE_NATIVE_VALUE %',(" + expression + ')::jsonb; END $value$;')
  const matches = [...out.matchAll(/WARNING:\s+PROFILE_NATIVE_VALUE ([^\r\n]+)/g)]
  assert.equal(matches.length, 1)
  return JSON.parse(matches[0][1]) as T
}
type State = { jobs: Array<{ jobid: number; active: boolean; [key: string]: unknown }>; digest: string; catalog: unknown; probeRows: number }
const snapshot = () => value<State>(`jsonb_build_object(
  'jobs',(SELECT jsonb_agg(to_jsonb(j) ORDER BY jobid) FROM cron.job j),
  'digest',(SELECT encode(sha256(convert_to(jsonb_agg(to_jsonb(j) ORDER BY jobid)::text,'UTF8')),'hex') FROM cron.job j),
  'probeRows',(SELECT count(*) FROM public.profile_cron_effect_probe),
  'catalog',jsonb_build_object(
    'relation',(SELECT jsonb_build_object('owner',relowner,'kind',relkind,'persistence',relpersistence,
      'rls',relrowsecurity,'force',relforcerowsecurity,'acl',relacl) FROM pg_class WHERE oid='cron.job'::regclass),
    'functions',(SELECT jsonb_agg(jsonb_build_object('name',p.oid::regprocedure::text,'owner',proowner,
      'acl',proacl,'definition',pg_get_functiondef(p.oid)) ORDER BY p.oid)
      FROM pg_proc p WHERE p.oid IN ('cron.alter_job(bigint,text,text,text,text,boolean)'::regprocedure,
        'cron.job_cache_invalidate()'::regprocedure)),
    'triggers',(SELECT jsonb_agg(to_jsonb(t) ORDER BY oid) FROM pg_trigger t WHERE tgrelid='cron.job'::regclass),
    'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY oid) FROM pg_policy p WHERE polrelid='cron.job'::regclass),
    'rules',(SELECT jsonb_agg(to_jsonb(r) ORDER BY oid) FROM pg_rewrite r WHERE ev_class='cron.job'::regclass),
    'roles',(SELECT jsonb_agg(jsonb_build_object('name',rolname,'super',rolsuper,'bypass',rolbypassrls,
      'inherit',rolinherit,'createRole',rolcreaterole,'createDb',rolcreatedb,'replication',rolreplication)
      ORDER BY rolname) FROM pg_roles WHERE rolname IN ('postgres','supabase_admin'))))`)
const operation = (state: State, action: 'deactivate' | 'rollback', commit = true) =>
  composeProfileCronOperation({ target, action, beforeDigest: state.digest, commit,
    ...(action === 'rollback' ? { rollbackAck: rollbackAcknowledgement } : {}) })
const invoke = (sql: string, expectedError?: RegExp, role = 'postgres') => run('SET SESSION AUTHORIZATION ' + role + ';' + sql, expectedError)

try {
  assert.match(execFileSync(bin + 'postgres',['--version'],{encoding:'utf8',env,timeout:5000}), /PostgreSQL\) 17\./)
  execFileSync(bin + 'initdb', ['-D', data, '--no-locale', '--encoding=UTF8', '--auth-local=reject', '--auth-host=reject',
    '--username=supabase_admin', '--no-sync'], { encoding: 'utf8', env, stdio: 'pipe', timeout: 60000 })
  run(`CREATE ROLE postgres LOGIN NOSUPERUSER BYPASSRLS;
    CREATE EXTENSION pg_cron;
    GRANT USAGE ON SCHEMA cron TO postgres;
    GRANT EXECUTE ON FUNCTION cron.alter_job(bigint,text,text,text,text,boolean) TO postgres;
    CREATE TABLE public.profile_cron_effect_probe (marker integer);
    INSERT INTO cron.job(jobid,jobname,schedule,command,database,username,nodename,nodeport,active)
      VALUES(1,'sync_profile_emails_hourly','@hourly',' select public.sync_creator_profile_core(); ',
        'postgres','postgres','localhost',5432,true),
        (2,'owned-other-job-a','@daily','SELECT 1;','postgres','postgres','localhost',5432,false),
        (4,'owned-other-job-b','@daily','SELECT 1;','postgres','postgres','localhost',5432,false);`)
  const initial = snapshot()
  invoke(readFileSync(packageRoot + 'preflight.sql','utf8'))
  assert.deepEqual(snapshot(),initial)
  proofCases.push('complete READ ONLY preflight executes without effects under actual restricted caller')
  const source = readFileSync(packageRoot + 'transition.sql', 'utf8')
  assert.equal(operation(initial,'deactivate').split(source).length, 2, 'the complete reviewed SQL body is unchanged')
  invoke(operation(initial,'deactivate'))
  const stopped = snapshot()
  assert.deepEqual(stopped.jobs, initial.jobs.map(j => j.jobid === 1 ? { ...j, active: false } : j))
  assert.deepEqual(stopped.catalog, initial.catalog)
  assert.equal(stopped.probeRows, 0)
  proofCases.push('actual C API deactivation commits only Job 1 active=false; full other rows/catalog unchanged')
  invoke(readFileSync(packageRoot + 'readback.sql','utf8'))
  assert.deepEqual(snapshot(),stopped)
  proofCases.push('complete READ ONLY readback executes without effects under actual restricted caller')
  invoke(operation(stopped,'deactivate'), /exact job changed/)
  assert.deepEqual(snapshot(), stopped)
  proofCases.push('repeat deactivation refuses and preserves full state')
  invoke(operation(stopped,'rollback'))
  assert.deepEqual(snapshot(), initial)
  proofCases.push('explicit acknowledged rollback restores exact original rows and catalog')
  invoke(operation(initial,'deactivate', false))
  assert.deepEqual(snapshot(), initial)
  proofCases.push('ROLLBACK rehearsal leaves no persistent write')
  const refuse = (name: string, sql: string, error: RegExp, role = 'postgres') => {
    const before = snapshot(); invoke(sql,error,role); assert.deepEqual(snapshot(),before); proofCases.push(name)
  }
  refuse('wrong digest refuses', composeProfileCronOperation({ target, action:'deactivate',beforeDigest:'a'.repeat(64) }),/exact job changed/)
  refuse('superuser caller refuses', operation(initial,'deactivate'), /postgres and SERIALIZABLE required/, 'supabase_admin')
  refuse('non-serializable operation refuses', operation(initial,'deactivate').replace('SERIALIZABLE','READ COMMITTED'), /postgres and SERIALIZABLE required/)
  const drift = (name: string, setup: string, cleanup: string, error: RegExp) => {
    run(setup); refuse(name,operation(snapshot(),'deactivate'),error); run(cleanup); assert.deepEqual(snapshot(),initial)
  }
  drift('direct UPDATE privilege refuses','GRANT UPDATE ON cron.job TO postgres;','REVOKE UPDATE ON cron.job FROM postgres;',/SELECT-only authority required/)
  drift('restored legacy function refuses', 'CREATE FUNCTION public.sync_creator_profile_core() RETURNS void LANGUAGE sql AS $$SELECT;$$;',
    'DROP FUNCTION public.sync_creator_profile_core();', /legacy function or overload exists/)
  drift('unexpected command refuses', "UPDATE cron.job SET command='SELECT 42;' WHERE jobid=1;",
    "UPDATE cron.job SET command=' select public.sync_creator_profile_core(); ' WHERE jobid=1;", /exact job changed/)
  drift('table owner drift refuses', 'ALTER TABLE cron.job OWNER TO postgres;', 'ALTER TABLE cron.job OWNER TO supabase_admin;', /SELECT-only authority required|provider relation/)
  drift('FORCE RLS drift refuses','ALTER TABLE cron.job FORCE ROW LEVEL SECURITY;','ALTER TABLE cron.job NO FORCE ROW LEVEL SECURITY;',/provider relation/)
  drift('disabled cache trigger refuses','ALTER TABLE cron.job DISABLE TRIGGER cron_job_cache_invalidate;',
    'ALTER TABLE cron.job ENABLE TRIGGER cron_job_cache_invalidate;',/provider relation/)
  drift('foreign trigger refuses before any external table effect', `CREATE FUNCTION public.profile_cron_extra() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN INSERT INTO public.profile_cron_effect_probe VALUES(1);RETURN NULL;END $$;
    CREATE TRIGGER profile_cron_extra AFTER UPDATE ON cron.job FOR EACH STATEMENT EXECUTE FUNCTION public.profile_cron_extra();`,
    'DROP TRIGGER profile_cron_extra ON cron.job;DROP FUNCTION public.profile_cron_extra();',/provider relation/)
  drift('rewrite rule refuses before any external table effect', 'CREATE RULE profile_cron_extra_rule AS ON UPDATE TO cron.job DO ALSO INSERT INTO public.profile_cron_effect_probe VALUES(2);',
    'DROP RULE profile_cron_extra_rule ON cron.job;',/provider relation/)
  assert.deepEqual(snapshot(),initial)
  const receipt = { observedAt: new Date().toISOString(), server: execFileSync(bin+'postgres',['--version'],{encoding:'utf8'}).trim(),
    actualCatalogExtensionVersion:value<string>("(SELECT to_jsonb(extversion) FROM pg_extension WHERE extname='pg_cron')"),
    sharedLibrarySha256:createHash('sha256').update(readFileSync(prefix+'/usr/lib/postgresql/17/lib/pg_cron.so')).digest('hex'),
    cases:proofCases, allPassed:true,
    fullRowsAndCatalogRestored:true, hostedWrites:0, schedulerStarted:false,
    concurrencyProof:false, concurrencyLimitation:'Single-user proof has no concurrent sessions; socket availability is not tested by this runner' }
  console.log(JSON.stringify(receipt,null,2))
} finally { rmSync(root,{recursive:true,force:true}) }
