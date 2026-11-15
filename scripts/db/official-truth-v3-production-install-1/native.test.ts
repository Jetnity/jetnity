// Actual PG17 --single, owned disposable cluster only. Auth rows and Cron are
// explicitly synthetic provider fixtures; no remote connection/source/secret.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { literal } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { compileProductionArtifacts, PRODUCTION, LOGINS } from '../../official-truth-product-v3-production/build.mjs'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program'
import { hrs1Canonical } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import { createV3QueueCoordinator, type V3ManagedJobRecord, type V3QueueCommit, type V3QueueStoragePort } from '../../../lib/readiness/official-truth-product-v3/monitor/queue'
import { createM04SubjectIdentity, readM04Command, type M04Operation, type M04NativeReply } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const compiled = compileProductionArtifacts()
const installation = compiled.get('scripts/db/official-truth-v3-production-install-1/install.sql')!
const installAndGuard = compiled.get('scripts/db/official-truth-v3-production-install-1/install-and-start-guard.sql')!
const creator = `SET SESSION AUTHORIZATION postgres; SET search_path=pg_catalog; SET jetnity.production_target=${literal(PRODUCTION.target)};`
const schedulerCreator = creator + "SET jetnity.prod_import_target='production:qscbgcdmivbbnzrcyegn:refresh1'; SET pg_net.database_name='postgres';"
const uid = (n: number) => n.toString(16).padStart(8, '0') + '-1111-4111-8111-' + n.toString(16).padStart(12, '0')
const id = (kind: string, value: string) => kind + '_' + createHash('sha256').update('production-native:' + value).digest('hex').slice(0, 32)
const binding = program.binding
const tuple = [literal(binding.methodId), binding.revision, literal(binding.methodDigest), literal(binding.packageDigest)].join(',')
const human = `SET SESSION AUTHORIZATION pai1_human; SET ROLE authenticated; SET request.jwt.claims=${literal(JSON.stringify({ sub: uid(1), session_id: uid(201), role: 'authenticated', aal: 'aal2', exp: Math.floor(Date.now() / 1000) + 300 }))};`
const jobs = 'SET SESSION AUTHORIZATION ot_v3_jobs_transport_login; SET ROLE ot_v3_jobs_caller;'
const emptyCatalog = `(SELECT jsonb_build_object('public',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_proc p
 JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'),
 'roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r),
 'profiles',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.id) FROM public.profiles p),
 'users',(SELECT jsonb_agg(to_jsonb(u) ORDER BY u.id) FROM auth.users u),
 'cron',(SELECT jsonb_agg(to_jsonb(j) ORDER BY j.jobid) FROM cron.job j)))`
const positiveReadback = `jsonb_build_object('method',(SELECT count(*) FROM official_v3_method_private.heads_v1),
 'jobs',(SELECT count(*) FROM official_v3_jobs_private.subjects_v1),
 'starts',(SELECT count(*) FROM official_v3_jobs_private.execution_starts_v1),
 'sources',(SELECT count(*) FROM official_v3_result_private.originals_v1),
 'projections',(SELECT count(*) FROM official_v3_result_private.projections_v1),
 'ownerReceipts',(SELECT count(*) FROM official_v3_guard_private.owner_operations_v1),
 'guardGeneration',(SELECT generation FROM official_v3_guard_private.state_v1),
 'repair2',to_regclass('official_v3_guard_private.recovery_baseline_v1'),
 'repair3',to_regclass('official_v3_guard_private.gap_recovery_baseline_v1'))`

// Independently transcribed from the actual transport's checkedIdentity() and
// V3_PG_LOGINS contracts, not from the Production compiler or SQL verifier.
// TLS, distinct live backend identities and the physical two-session handshake
// remain real release gates; --single does not manufacture their evidence.
const transportRoles = [
  ['ot_v3_intake_transport_login', 'ot_v3_intake_caller'],
  ['ot_v3_jobs_transport_login', 'ot_v3_jobs_caller'],
  ['ot_v3_method_transport_login', 'ot_v3_method_reader'],
  ['ot_v3_result_reader', null],
  ['ot_v3_result_verifier', null],
  ['ot_v3_result_writer', null],
] as const
const transportRoleReadback = `(SELECT jsonb_agg(jsonb_build_object(
 'login',r.rolname,'can_login',r.rolcanlogin,'inherit',r.rolinherit,'superuser',r.rolsuper,
 'create_database',r.rolcreatedb,'create_role',r.rolcreaterole,'replication',r.rolreplication,
 'bypass_rls',r.rolbypassrls,'connection_limit',r.rolconnlimit,'valid_until',r.rolvaliduntil,
 'configuration',r.rolconfig,'connect',has_database_privilege(r.oid,current_database(),'CONNECT'),
 'memberships',(SELECT coalesce(jsonb_agg(jsonb_build_object('role',pg_get_userbyid(m.roleid),
   'grantor',pg_get_userbyid(m.grantor),'admin',m.admin_option,'inherit',m.inherit_option,'set',m.set_option)
   ORDER BY m.roleid),'[]'::jsonb) FROM pg_auth_members m WHERE m.member=r.oid)
 ) ORDER BY r.rolname) FROM pg_roles r WHERE r.rolname IN (${transportRoles.map(([login]) => literal(login)).join(',')}))`
function assertTransportRoles(actual: unknown) {
  assert.deepEqual(actual, transportRoles.map(([login, role]) => ({ login, can_login: true,
    inherit: false, superuser: false, create_database: false, create_role: false, replication: false,
    bypass_rls: false, connection_limit: 2, valid_until: null, configuration: null, connect: true,
    memberships: role ? [{ role, grantor: 'postgres', admin: false, inherit: false, set: true }] : [],
  })), 'actual six logins must satisfy the independent runtime transport contract')
}

async function rejectedTransaction(proof: OwnedPersistentProof, sql: string, context: string, primary: RegExp) {
  // The complete original file continues to its ROLLBACK/COMMIT boundary after
  // the first error. Only that specific error and PostgreSQL's ensuing aborted
  // transaction reports are expected; every unrelated ERROR still fails.
  const output = await proof.run(sql, context, new RegExp(primary.source + '|current transaction is aborted'))
  assert.match(output, primary, 'the intended prerequisite actually rejected')
}

test('Production binding is exactly the reviewed runtime binding', () => {
  assert.equal(read('../../official-truth-product-v3-production/binding.json').trim(), hrs1Canonical(program.binding))
})

async function fixture(proof: OwnedPersistentProof) {
  await proof.run('CREATE ROLE supabase_read_only_user LOGIN NOINHERIT NOSUPERUSER BYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;\n'
    + read('../official-truth-v3-composed-dev-1/observed-auth-profile-fixture.sql')
    + '\nGRANT pg_read_all_data TO postgres WITH ADMIN TRUE, INHERIT TRUE, SET TRUE;\n'
    + [1, 2].map(n => `INSERT INTO auth.users(id,email) VALUES(${literal(uid(n))}::uuid,${literal('production-fixture-' + n + '@example.invalid')});
      INSERT INTO auth.sessions(id,user_id,aal) VALUES(${literal(uid(n + 200))}::uuid,${literal(uid(n))}::uuid,'aal2');`).join('\n')
    + '\n' + creator + '\n' + [1, 2].map(n => `INSERT INTO public.profiles(id,user_id,role,status)
      VALUES(${literal(uid(n + 100))}::uuid,${literal(uid(n))}::uuid,${literal(n === 1 ? 'owner' : 'moderator')},'active');`).join('\n')
    + `\nCREATE SCHEMA cron;
      CREATE TABLE cron.job(jobid bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,jobname text UNIQUE,
       schedule text NOT NULL,command text NOT NULL,username text NOT NULL DEFAULT 'postgres',
       database text NOT NULL DEFAULT 'postgres',active boolean NOT NULL DEFAULT true);
      INSERT INTO cron.job(jobname,schedule,command) VALUES('sync_profile_emails_hourly','@hourly','SELECT 1');
      CREATE TABLE cron.job_run_details(jobid bigint,status text);
      CREATE FUNCTION cron.schedule(job_name text,schedule text,command text) RETURNS bigint LANGUAGE sql AS $$
       INSERT INTO cron.job(jobname,schedule,command) VALUES($1,$2,$3) RETURNING jobid $$;
      CREATE FUNCTION cron.alter_job(job_id bigint,schedule text DEFAULT NULL,command text DEFAULT NULL,
        database text DEFAULT NULL,username text DEFAULT NULL,active boolean DEFAULT NULL) RETURNS void LANGUAGE sql AS $$
        UPDATE cron.job j SET schedule=coalesce($2,j.schedule),command=coalesce($3,j.command),database=coalesce($4,j.database),
          username=coalesce($5,j.username),active=coalesce($6,j.active) WHERE j.jobid=$1 $$;
      CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
      CREATE SCHEMA vault;
      CREATE TABLE vault.decrypted_secrets(name text PRIMARY KEY,decrypted_secret text);
      INSERT INTO vault.decrypted_secrets VALUES('jetnity_prod_import_cron_v1','synthetic-prod-scheduler-key-not-a-live-secret-123456789');
      CREATE VIEW vault.secrets AS SELECT name FROM vault.decrypted_secrets;
      CREATE SCHEMA net;
      CREATE TABLE net.http_request_queue(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,method text,url text,headers jsonb,body bytea,timeout_milliseconds integer);
      CREATE TABLE net._http_response(id bigint PRIMARY KEY,status_code integer,content_type text,headers jsonb,content text,timed_out boolean,error_msg text,created timestamptz DEFAULT clock_timestamp());
      CREATE FUNCTION net.http_post(url text,body jsonb DEFAULT '{}'::jsonb,params jsonb DEFAULT '{}'::jsonb,
        headers jsonb DEFAULT '{}'::jsonb,timeout_milliseconds integer DEFAULT 5000) RETURNS bigint LANGUAGE sql AS $$
        INSERT INTO net.http_request_queue(method,url,headers,body,timeout_milliseconds)
        VALUES('POST',url,headers,convert_to(body::text,'UTF8'),timeout_milliseconds) RETURNING id $$;
      CREATE FUNCTION net.check_worker_is_up() RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END $$;
      CREATE FUNCTION public.production_fixture_unrelated() RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
      REVOKE ALL ON FUNCTION public.production_fixture_unrelated() FROM PUBLIC,service_role;
      GRANT EXECUTE ON FUNCTION public.production_fixture_unrelated() TO anon;`, 'owned synthetic auth/profile/Cron fixture')
  // Complete actual scheduler/monitor definitions precede BG1. There is no
  // replacement Official Truth schema, quota function, status getter or audit.
  await proof.run(schedulerCreator + '\nBEGIN;\n' + read('../official-truth-v3-production-import-schedule-1/core.sql')
    + '\n' + read('../official-truth-v3-production-import-schedule-1/monitoring.sql') + '\nCOMMIT;',
  'complete disabled scheduler and monitor before genuine BG1 installation')
  assert.deepEqual(await proof.value('public.jetnity_production_import_status_v1()', 'SET SESSION AUTHORIZATION anon;'),
    { schema: 1, status: 'unavailable', nextDueAt: null })
}
async function syntheticProviderMetadata(proof: OwnedPersistentProof) {
  await proof.run(`INSERT INTO pg_catalog.pg_extension(oid,extname,extowner,extnamespace,extrelocatable,extversion,extconfig,extcondition)
    VALUES(9999001,'pg_cron','postgres'::regrole,'pg_catalog'::regnamespace,false,'1.6.4',NULL,NULL),
          (9999002,'pg_net','postgres'::regrole,'extensions'::regnamespace,false,'0.19.5',NULL,NULL);`,
  'explicit synthetic provider metadata; no real hosted worker claimed')
}
async function envelope(raw: unknown, current: V3ManagedJobRecord | null): Promise<M04Operation & { operation: 'queue_cas' }> {
  const command = readM04Command(raw); assert.ok(command)
  let commit: V3QueueCommit | undefined
  const storage: V3QueueStoragePort = { async read() { return { status: 'ok', record: current } },
    async confirm() { return { status: 'not_attempted' } }, async compareAndSwap(value) { commit = value; return { status: 'unconfirmed' } } }
  const queue = createV3QueueCoordinator({ storage, methodAuthority: {
    async resolveCurrent() { return { status: 'approved', receipt: {} } }, async reproveAtCommit() { return { status: 'current' } },
  }, now: () => new Date().toISOString(), invocationMilliseconds: 5000, backoffBaseMilliseconds: 1000, backoffMaxMilliseconds: 60000 })
  assert.equal(command.action, 'enqueue')
  if (command.action === 'enqueue') await queue.enqueue(command.value.input)
  assert.ok(commit)
  assert.equal(commit.next.kind, 'research_job_record'); assert.ok(commit.next.kind === 'research_job_record')
  const next = commit.next
  const subject = createM04SubjectIdentity('rule_research', { context: next.context, method: next.method,
    factKind: next.research.factKind, researchReason: next.research.researchReason }); assert.ok(subject)
  return { operation: 'queue_cas', body: { command: command.value, commit, subjectText: subject.subjectText, disposition: { kind: 'regular' } } }
}

test('Production installer executes complete original SQL atomically on fresh PG17', { timeout: 180000 }, async t => {
  const proof = new OwnedPersistentProof(t.signal)
  let enqueueApi = ''
  try {
    await fixture(proof)
    const before = await proof.value(emptyCatalog, creator)
    await t.test('wrong/missing/Dev acknowledgement rejects with no catalog or row change', async () => {
      for (const target of ['', 'dev:yfvbxvijcorffwxbxahl:INSTALL1']) {
        await rejectedTransaction(proof, creator + `\nSET jetnity.production_target=${literal(target)};\n` + installation,
          'wrong Production target', /production fixed target and PG17 Creator context required/)
        assert.deepEqual(await proof.value(emptyCatalog, creator), before)
      }
    })
    await t.test('exact PAI predecessor mismatch rolls back the entire file', async () => {
      const fault = installation.replace('-- PRODUCTION_STAGE PAI', "ALTER FUNCTION public.rollenrang(text) RENAME TO production_fault;\n-- PRODUCTION_STAGE PAI")
      assert.notEqual(fault, installation)
      await rejectedTransaction(proof, creator + fault, 'changed PAI predecessor', /profile|rollenrang/)
      assert.deepEqual(await proof.value(emptyCatalog, creator), before)
    })
    await t.test('missing monitor cannot install an unusable BG1 predecessor', async () => {
      const fault = installation.replace('-- PRODUCTION_SCHEDULER_PREFLIGHT',
        'DROP FUNCTION public.jetnity_production_import_status_v1();\n-- PRODUCTION_SCHEDULER_PREFLIGHT')
      await rejectedTransaction(proof, creator + fault, 'monitor must precede protected catalog', /production disabled scheduler and monitor predecessor required/)
      assert.deepEqual(await proof.value(emptyCatalog, creator), before)
    })
    await t.test('failure at the final boundary rolls back every created component', async () => {
      const fault = installation.replace(/COMMIT;\s*$/, "DO $fail$ BEGIN RAISE EXCEPTION 'production explicit final rollback probe'; END $fail$;\nCOMMIT;\n")
      await rejectedTransaction(proof, creator + fault, 'final install rollback', /production explicit final rollback probe/)
      assert.deepEqual(await proof.value(emptyCatalog, creator), before)
      assert.equal(await proof.value("to_jsonb(to_regnamespace('official_v3_guard_private') IS NULL)", creator), true)
    })
    await t.test('real fresh install leaves every business history and approval empty', async () => {
      await proof.run(creator + installation, 'complete fresh Production SQL')
      assert.deepEqual(await proof.value(positiveReadback, creator), { method: 0, jobs: 0, starts: 0, sources: 0,
        projections: 0, ownerReceipts: 0, guardGeneration: 0, repair2: null, repair3: null })
      assert.deepEqual(await proof.value('public.official_v3_guard_alarm_status_v1()', creator), { schema: 1, status: 'unavailable' })
      const usage = await proof.value<Record<string, unknown>>(`official_v3_jobs_private.rolling_usage_v2(${literal(PRODUCTION.subject)})`, creator)
      assert.equal(usage.model, 'rolling_24h_v2'); assert.equal(usage.clock_ok, true)
      assert.equal(usage.starts, 0); assert.equal(usage.operations, 0); assert.equal(usage.lifetime_starts, 0); assert.equal(usage.lifetime_operations, 0)
      assert.equal(usage.remaining_starts, 64); assert.equal(usage.remaining_operations, 256)
      assert.equal(await proof.value("to_jsonb((SELECT count(*) FROM cron.job WHERE jobname='sync_profile_emails_hourly' AND schedule='@hourly' AND command='SELECT 1' AND active))", creator), 1)
      assert.equal(await proof.value('to_jsonb(public.production_fixture_unrelated())', creator), false)
    })
    await t.test('all six installed logins meet the independent live transport role contract', async () => {
      assertTransportRoles(await proof.value(transportRoleReadback, creator))
    })
    await t.test('the independent transport check rejects each old unlimited login profile without retaining changes', async () => {
      for (const login of ['ot_v3_method_transport_login', 'ot_v3_intake_transport_login', 'ot_v3_jobs_transport_login']) {
        const wrong = await proof.value(transportRoleReadback,
          creator + `BEGIN; ALTER ROLE ${login} CONNECTION LIMIT -1;`, 'ROLLBACK;')
        assert.throws(() => assertTransportRoles(wrong), /independent runtime transport contract/)
        assertTransportRoles(await proof.value(transportRoleReadback, creator))
      }
    })
    await t.test('six real technical roles stay limited; no Data API role can inspect policy', async () => {
      await proof.run(creator + read('parts/verify-installed.sql'), 'readonly installed catalog and role checks')
      for (const [login] of LOGINS) {
        await proof.run(`SET SESSION AUTHORIZATION ${login}; SELECT * FROM official_v3_jobs_private.rolling_policy_v2;`,
          'technical role cannot inspect private quota', /permission denied/)
      }
      for (const role of ['anon', 'authenticated', 'service_role']) {
        await proof.run(`SET SESSION AUTHORIZATION ${role}; SELECT * FROM official_v3_jobs_private.rolling_policy_v2;`,
          'Data API role cannot inspect private quota', /permission denied/)
      }
    })
    await t.test('reinstallation refuses adoption and preserves the installed catalog', async () => {
      const prior = await proof.value('official_v3_guard_private.catalog_status_v1()', creator)
      await rejectedTransaction(proof, creator + installation, 'used installer is not replayed', /fresh installation only/)
      assert.deepEqual(await proof.value('official_v3_guard_private.catalog_status_v1()', creator), prior)
    })
    await t.test('initial policy cannot hide a fabricated nonzero anchor or changed method', async () => {
      for (const change of ['anchor_starts=1', "method_binding=jsonb_set(method_binding,'{revision}','2'::jsonb)"]) {
        await rejectedTransaction(proof, `SET SESSION AUTHORIZATION ot_pilot_owner; BEGIN;
          ALTER TABLE official_v3_jobs_private.rolling_policy_v2 DISABLE TRIGGER guard_row_v2;
          UPDATE official_v3_jobs_private.rolling_policy_v2 SET ${change};
          SET SESSION AUTHORIZATION postgres;
          SELECT official_v3_jobs_private.rolling_usage_v2(${literal(PRODUCTION.subject)}); ROLLBACK;`,
        'missing subject cannot absorb old quota or a different method', /rolling quota binding mismatch/)
      }
      assert.equal((await proof.value<Record<string, unknown>>(`official_v3_jobs_private.rolling_usage_v2(${literal(PRODUCTION.subject)})`, creator)).starts, 0)
    })
    await t.test('credential file rejects incomplete inputs atomically and changes only six own passwords', async () => {
      const credentialFile = read('../../official-truth-product-v3-production/configure-credentials.sql')
      const passwordsAbsent = `(SELECT bool_and(rolpassword IS NULL) FROM pg_authid
        WHERE rolname IN (${LOGINS.map(([login]) => literal(login)).join(',')}))`
      assert.equal(await proof.value('to_jsonb(' + passwordsAbsent + ')'), true)
      await rejectedTransaction(proof, `${creator} BEGIN;
        SET LOCAL jetnity.production_credentials='{}';\n${credentialFile}\nCOMMIT;`,
      'incomplete six credentials refused', /production exactly six distinct strong credential inputs required/)
      assert.equal(await proof.value('to_jsonb(' + passwordsAbsent + ')'), true)
      const synthetic = Object.fromEntries(LOGINS.map(([, , key], i) => [key, 'owned_fixture_' + i + '_'.repeat(43)]))
      const catalog = await proof.value('official_v3_guard_private.catalog_status_v1()', creator)
      await proof.run(`${creator} BEGIN;
        SET LOCAL jetnity.production_credentials=${literal(JSON.stringify(synthetic))};\n${credentialFile}\nCOMMIT;`,
      'six synthetic fixture passwords only')
      assert.deepEqual(await proof.value('official_v3_guard_private.catalog_status_v1()', creator), catalog)
      assert.equal(await proof.value(`to_jsonb((SELECT count(*)=6 AND bool_and(rolpassword LIKE 'SCRAM-SHA-256$%')
        FROM pg_authid WHERE rolname IN (${LOGINS.map(([login]) => literal(login)).join(',')})))`), true)
    })
    await t.test('full BG1 activation file requires actual provider metadata', async () => {
      await rejectedTransaction(proof, `${creator} SET jetnity.bg1_target=${literal(PRODUCTION.bg)};\n` + read('../../official-truth-product-v3-production/activate-background-guard.sql'),
        'no invented pg_cron installation', /production exact background scheduler prerequisites required/)
      assert.equal(await proof.value("to_jsonb((SELECT count(*) FROM cron.job))", creator), 1)
    })
    await t.test('full activation with explicit Cron fixture runs a genuine complete audit', async () => {
      // Synthetic scheduler registration only. The BG1 function and all protected
      // checks below are the real installed Production bodies, never a double.
      await syntheticProviderMetadata(proof)
      await proof.run(`${creator} SET cron.database_name='postgres'; SET cron.log_run='on'; SET jetnity.bg1_target=${literal(PRODUCTION.bg)};\n`
        + read('../../official-truth-product-v3-production/activate-background-guard.sql'), 'complete real BG1 activation SQL')
      assert.deepEqual(await proof.value('public.official_v3_guard_alarm_status_v1()', creator), { schema: 1, status: 'current' })
      assert.equal(await proof.value("to_jsonb((SELECT count(*) FROM cron.job WHERE jobname='jetnity-official-truth-production-guard-v1' AND schedule='*/5 * * * *' AND active))", creator), 1)
      assert.equal(await proof.value("to_jsonb((SELECT count(*) FROM official_v3_guard_private.runs_v1 WHERE outcome='complete'))", creator), 1)
    })
    await t.test('actual Owner wrappers then first ordinary enqueue need no seeded Subject', async () => {
      assert.equal((await proof.value<{ status: string }>(`public.official_v3_method_stage_draft_v1(${literal(id('maop1', 'stage'))},${tuple},NULL)`, human)).status, 'recorded')
      assert.equal((await proof.value<{ status: string }>(`public.official_v3_method_approve_v1(${literal(id('maop1', 'approve'))},${tuple},NULL,NULL,NULL,0,NULL,'until_revoked',NULL)`, human)).status, 'recorded')
      const request = await envelope({ action: 'enqueue', kind: 'rule_research', input: { context: binding.context,
        method: { methodId: binding.methodId, revision: binding.revision }, factKind: 'requirement_effect', researchReason: { status: 'missing' },
        operationId: id('op3', 'first-enqueue'), jobId: id('job3', 'first-job'), attemptLimit: 4 } }, null)
      const api = `official_v3_jobs_api.execute_v1(${literal(hrs1Canonical({ ...request, phase: 'authorized' }))},${tuple},1,5000,
        to_char((clock_timestamp()+interval '5 seconds') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))`
      enqueueApi = api
      const accepted = await proof.value<M04NativeReply>(api, jobs)
      assert.equal(accepted.status, 'committed')
      const usage = await proof.value<Record<string, unknown>>('official_v3_guard_private.ch_de_quota_v2()', creator)
      assert.equal(usage.starts, 0); assert.equal(usage.operations, 1); assert.equal(usage.lifetime_operations, 1)
      assert.equal(await proof.value("to_jsonb((SELECT count(*) FROM official_v3_jobs_private.subjects_v1))", creator), 1)
      assert.equal(await proof.value("to_jsonb((SELECT count(*) FROM official_v3_result_private.originals_v1))", creator), 0)
    })
    await t.test('complete import activation and stop use actual BG1/quota without altering protected history', async () => {
      const protectedBefore = await proof.value('official_v3_guard_private.catalog_status_v1()', creator)
      const historyBefore = await proof.value(positiveReadback, creator)
      await proof.run(schedulerCreator + read('../official-truth-v3-production-import-schedule-1/activate.sql'),
        'entire import activation with genuine installed BG1/quota')
      assert.equal(await proof.value('to_jsonb(jetnity_prod_import_scheduler.tick_v1())', creator), 'dispatched_start')
      const cycle = await proof.value('(SELECT to_jsonb(c) FROM jetnity_prod_import_scheduler.cycles_v1 c)', creator)
      const dispatch = await proof.value('(SELECT to_jsonb(d) FROM jetnity_prod_import_scheduler.dispatches_v1 d)', creator)
      assert.equal(await proof.value('to_jsonb((SELECT count(*) FROM net.http_request_queue))', creator), 1)
      await proof.run(schedulerCreator + read('../official-truth-v3-production-import-schedule-1/deactivate.sql'),
        'entire non-destructive import stop with genuine protected catalog')
      assert.equal(await proof.value('to_jsonb(jetnity_prod_import_scheduler.tick_v1())', creator), 'disabled')
      assert.deepEqual(await proof.value('(SELECT to_jsonb(c) FROM jetnity_prod_import_scheduler.cycles_v1 c)', creator), cycle)
      assert.deepEqual(await proof.value('(SELECT to_jsonb(d) FROM jetnity_prod_import_scheduler.dispatches_v1 d)', creator), dispatch)
      assert.deepEqual(await proof.value(positiveReadback, creator), historyBefore)
      assert.deepEqual(await proof.value('official_v3_guard_private.catalog_status_v1()', creator), protectedBefore)
      assert.deepEqual(await proof.value('public.jetnity_production_import_status_v1()', 'SET SESSION AUTHORIZATION anon;'),
        { schema: 1, status: 'unavailable', nextDueAt: null })
      assert.equal(await proof.value("to_jsonb((SELECT bool_and(active) FROM cron.job WHERE jobname IN ('sync_profile_emails_hourly','jetnity-official-truth-production-guard-v1')))", creator), true)
      await proof.run(creator + read('../../official-truth-product-v3-production/verify.sql'), 'complete post-stop read-only verification')
    })
    await t.test('normal Owner revocation retains committed work and closes further API effects', async () => {
      // Normal HMT revocation closes the authority, retaining the exact already
      // committed queue row and all original operation IDs for reconciliation.
      const retained = await proof.value(`jsonb_build_object('subjects',(SELECT jsonb_agg(to_jsonb(s)) FROM official_v3_jobs_private.subjects_v1 s),
        'operations',(SELECT jsonb_agg(to_jsonb(o)) FROM official_v3_jobs_private.queue_operations_v1 o))`, creator)
      assert.equal((await proof.value<{ status: string }>(`public.official_v3_method_revoke_v1(${literal(id('maop1', 'stop'))},${tuple},1)`, human)).status, 'recorded')
      assert.ok(enqueueApi)
      await proof.run(jobs + '\nSELECT ' + enqueueApi + ';', 'revoked method refuses even old committed request replay', /ma1 locked current authority unavailable/)
      assert.deepEqual(await proof.value(`jsonb_build_object('subjects',(SELECT jsonb_agg(to_jsonb(s)) FROM official_v3_jobs_private.subjects_v1 s),
        'operations',(SELECT jsonb_agg(to_jsonb(o)) FROM official_v3_jobs_private.queue_operations_v1 o))`, creator), retained)
      assert.equal(await proof.value("to_jsonb((SELECT status='revoked' AND epoch=2 FROM official_v3_method_private.heads_v1))", creator), true)
    })
  } finally { await proof.close() }
})

test('complete Production execution artifact installs and starts the real BG1 atomically', { timeout: 120000 }, async t => {
  const proof = new OwnedPersistentProof(t.signal)
  try {
    await fixture(proof)
    await syntheticProviderMetadata(proof)
    const before = await proof.value(emptyCatalog, creator)
    const prefix = creator + "SET cron.database_name='postgres'; SET cron.log_run='on';"
    await t.test('failure after genuine audit also rolls back its Cron, proof and every new component', async () => {
      const fault = installAndGuard.replace(/COMMIT;\s*$/, "DO $fail$ BEGIN RAISE EXCEPTION 'production execution rollback probe'; END $fail$;\nCOMMIT;\n")
      await rejectedTransaction(proof, prefix + fault, 'complete execution rollback', /production execution rollback probe/)
      assert.deepEqual(await proof.value(emptyCatalog, creator), before)
      assert.equal(await proof.value("to_jsonb(to_regnamespace('official_v3_guard_private') IS NULL)", creator), true)
    })
    await t.test('one actual commit contains the empty core, real audit and active background Cron', async () => {
      await proof.run(prefix + installAndGuard, 'complete default Production execution artifact')
      assert.deepEqual(await proof.value(positiveReadback, creator), { method: 0, jobs: 0, starts: 0, sources: 0,
        projections: 0, ownerReceipts: 0, guardGeneration: 1, repair2: null, repair3: null })
      assert.equal(await proof.value("to_jsonb((SELECT count(*) FROM official_v3_guard_private.runs_v1 WHERE outcome='complete'))", creator), 1)
      assert.deepEqual(await proof.value('public.official_v3_guard_alarm_status_v1()', creator), { schema: 1, status: 'current' })
      assert.equal(await proof.value("to_jsonb((SELECT count(*)=2 AND bool_and(active) FROM cron.job WHERE jobname IN ('sync_profile_emails_hourly','jetnity-official-truth-production-guard-v1')))", creator), true)
      assert.equal(await proof.value("to_jsonb((SELECT NOT enabled FROM jetnity_prod_import_scheduler.state_v1))", creator), true)
      assert.equal(await proof.value('to_jsonb((SELECT count(*) FROM net.http_request_queue))', creator), 0)
      await proof.run(creator + read('../../official-truth-product-v3-production/verify.sql'), 'entire readonly execution verification')
    })
  } finally { await proof.close() }
})
