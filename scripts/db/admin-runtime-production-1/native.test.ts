// Owned socket-free PG17 proof. Never connects to hosted Dev/Production. The real
// predecessor validators and next real BG1 due slots are used without rewinding
// proof timestamps, rewriting old evidence, or faking the installed Guard.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { literal, json } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { awaitNextBg1 } from '../official-truth-v3-dev-cycle4-attempt2-recovery-1/await-next-bg1'
import { INSPIRATION_ZIELE } from '../../../lib/places/inspiration'
import { ENTDECKEN_ZIELE } from '../../../lib/inspiration/explorer-1/katalog'
import { compileProductionAdmin, BASELINE, TARGET } from './build.mjs'
import { functionsIn } from '../official-truth-v3-background-guard-1/build.mjs'

const creator = "SET SESSION AUTHORIZATION postgres;SET search_path=pg_catalog;SET statement_timeout='30s';"
const uid = (n: number) => n.toString(16).padStart(8, '0') + '-1111-4111-8111-' + n.toString(16).padStart(12, '0')
const human = (aal = 'aal2') => 'SET SESSION AUTHORIZATION authenticated;SET search_path=pg_catalog;'
  + "SELECT set_config('request.jwt.claims'," + literal(JSON.stringify({ sub: uid(1), session_id: uid(201),
    role: 'authenticated', aal, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) - 10 })) + ',false);'
const entryId = INSPIRATION_ZIELE[0]!.placeId
const entryRead = 'public.admin_cms_inspiration_read_v1(' + literal(entryId) + ',NULL,NULL,20)'
const marketingRead = "public.admin_marketing_drafts_read_v1('{\"schemaVersion\":1,\"action\":\"list\"}'::jsonb)"
const countRead = '(SELECT to_jsonb(c) FROM public.admin_account_counts_v1() c)'
const rowsDigest = (table: string) => `(SELECT jsonb_build_object('count',count(*),'digest',encode(sha256(convert_to(COALESCE(
  string_agg(encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex'),'' ORDER BY to_jsonb(r)::text COLLATE "C"),''),'UTF8')),'hex')) FROM ${table} r)`

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const schedulerCreator = creator + "SET jetnity.prod_import_target='production:qscbgcdmivbbnzrcyegn:refresh1'; SET pg_net.database_name='postgres';"
async function fixture(proof: OwnedPersistentProof, moderation: string) {
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
  // Local synthetic provider prerequisites exist before capturing any protected catalogue.
  await proof.run('SET SESSION AUTHORIZATION ot_pilot_owner; ALTER TABLE auth.users ADD COLUMN created_at timestamptz;'
    + "UPDATE auth.users SET created_at=clock_timestamp()-interval '1 day';"
    + creator + moderation
    + 'REVOKE ALL ON FUNCTION public.darf_inhalte_moderieren() FROM PUBLIC,anon;'
    + 'GRANT EXECUTE ON FUNCTION public.darf_inhalte_moderieren() TO postgres,authenticated,service_role;', 'synthetic provider admission prerequisites')
  // Complete actual scheduler/monitor definitions precede BG1. There is no
  // replacement Official Truth schema, quota function, status getter or audit.
  await proof.run(schedulerCreator + '\nBEGIN;\n' + read('../official-truth-v3-production-import-schedule-1/core.sql')
    + '\n' + read('../official-truth-v3-production-import-schedule-1/monitoring.sql') + '\nCOMMIT;',
  'complete disabled scheduler and monitor before genuine BG1 installation')

}
async function syntheticProviderMetadata(proof: OwnedPersistentProof) {
  await proof.run(`INSERT INTO pg_catalog.pg_extension(oid,extname,extowner,extnamespace,extrelocatable,extversion,extconfig,extcondition)
    VALUES(9999001,'pg_cron','postgres'::regrole,'pg_catalog'::regnamespace,false,'1.6.4',NULL,NULL),
          (9999002,'pg_net','postgres'::regrole,'extensions'::regnamespace,false,'0.19.5',NULL,NULL);`,
  'explicit synthetic provider metadata; no real hosted worker claimed')
}

test('production-only atomic Admin installation preserves real BG1, enforces the new proof and protects all three stores',
  // At most three genuine five-minute cadence boundaries plus bounded setup.
  { timeout: 1_200_000 }, async t => {
    const proof = new OwnedPersistentProof(t.signal)
    const compiled = compileProductionAdmin()
    assert.equal(readFileSync(new URL('./provider-migration-body.sql', import.meta.url), 'utf8'), compiled.migration)
    const refuses = async (sql: string, message: RegExp) => {
      const output = await proof.run(sql, 'bounded Admin negative proof', new RegExp(message.source + '|current transaction is aborted'))
      assert.match(output, message, 'the intended original refusal must precede transaction-aborted follow-ups')
    }
    try {
      // Compile the complete new delta block before spending real cadence
      // boundaries on the predecessor. The early exception executes no DDL or
      // assertions; it is only a syntax probe, never an installation/proof.
      const delta = /DO \$admin_runtime_delta\$([\s\S]*?)\$admin_runtime_delta\$;/.exec(compiled.migration)?.[1]
      assert.ok(delta)
      assert.equal(delta.split('\nBEGIN\n').length, 2)
      await refuses('DO $owned_delta_syntax$' + delta.replace('\nBEGIN\n',
        "\nBEGIN\n  RAISE EXCEPTION 'owned delta syntax compiled only';\n") + '$owned_delta_syntax$;',
      /owned delta syntax compiled only/)
      const moderation = functionsIn(readFileSync(new URL(
        '../../../supabase/migrations/20260827170000_admin_aal2_data_plane_alignment.sql', import.meta.url), 'utf8'))
        .find(f => f.signature === 'public.darf_inhalte_moderieren()')
      assert.ok(moderation, 'canonical source helper, checked by the installer pin')
      await fixture(proof,moderation.sql)
      await syntheticProviderMetadata(proof)
      await proof.run(creator + "SET jetnity.production_target='production:qscbgcdmivbbnzrcyegn:INSTALL1'; SET cron.database_name='postgres'; SET cron.log_run='on';"
        + read('../official-truth-v3-production-install-1/install-and-start-guard.sql'), 'exact original Production baseline and proof')
      assert.deepEqual(await proof.value('public.official_v3_guard_alarm_status_v1()',creator), {schema:1,status:'current'})
      const applyContext = "SET LOCAL jetnity.admin_runtime_target=" + literal(TARGET) + ";"
      const originalTables = await proof.value<string[]>(`(SELECT jsonb_agg(format('%I.%I',n.nspname,c.relname) ORDER BY n.nspname,c.relname)
        FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND n.nspname IN
        ('official_v3_method_private','official_v3_intake_private','official_v3_jobs_private','official_v3_result_private','official_v3_guard_private'))`, creator)
      const preserved = '(SELECT jsonb_object_agg(name,value) FROM (VALUES ' + originalTables.map(table =>
        '(' + literal(table) + ',' + rowsDigest(table) + ')').join(',') + ') x(name,value))'
      const before = await proof.value(preserved, creator)
      const authority = `(SELECT jsonb_build_object('roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r),
        'memberships',(SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m)))`
      const authorityBefore = await proof.value(authority, creator)
      const isAbsent = `to_jsonb(to_regnamespace('jetnity_reporting') IS NULL AND to_regnamespace('jetnity_cms_private') IS NULL
        AND to_regnamespace('jetnity_marketing_private') IS NULL AND to_regclass(${literal(BASELINE)}) IS NULL)`

      await t.test('wrong target, partial prior state, old drift, half installation and extra grants roll back completely', async () => {
        const faults = [
          { prefix: "SET LOCAL jetnity.admin_runtime_target='wrong';", body: compiled.migration, error: /exact unused Production predecessor/ },
          { prefix: 'CREATE SCHEMA jetnity_reporting;', body: compiled.migration, error: /exact unused Production predecessor/ },
          { prefix: "ALTER FUNCTION official_v3_guard_private.require_open_v1() SET statement_timeout='1s';", body: compiled.migration, error: /predecessor catalog mismatch/ },
          { prefix: '', body: compiled.migration.replace('CREATE SCHEMA jetnity_cms_private',
            () => "DO $$BEGIN RAISE EXCEPTION 'injected owned rollback boundary'; END$$;CREATE SCHEMA jetnity_cms_private"), error: /injected owned rollback boundary/ },
          { prefix: '', body: compiled.migration.replace('DO $admin_runtime_delta$',
            'GRANT EXECUTE ON FUNCTION public.admin_marketing_drafts_apply_v1(jsonb) TO anon;DO $admin_runtime_delta$'), error: /function contract changed/ },
          { prefix: '', body: compiled.migration.replace('DO $admin_runtime_delta$',
            'CREATE TYPE jetnity_marketing_private.unreviewed_v1 AS ENUM(\'unreviewed\');DO $admin_runtime_delta$'), error: /additional object outside approved closure/ },
        ]
        for (const fault of faults) {
          await refuses(creator + 'BEGIN;' + applyContext + fault.prefix + fault.body + 'ROLLBACK;', fault.error)
          assert.equal(await proof.value(isAbsent, creator), true)
          assert.deepEqual(await proof.value(preserved, creator), before)
          assert.deepEqual(await proof.value(authority, creator), authorityBefore)
        }
      })
      await proof.run(creator + 'BEGIN;' + applyContext + compiled.migration + 'COMMIT;', 'install exact atomic Admin successor')
      await t.test('original histories and permissions survive; repeated installation cannot replace the successor', async () => {
        assert.deepEqual(await proof.value(preserved, creator), before)
        assert.deepEqual(await proof.value(authority, creator), authorityBefore)
        await proof.run(creator + 'SELECT official_v3_guard_private.assert_catalog_v1();', 'new catalog is already exactly bound')
        await refuses(creator + 'BEGIN;' + applyContext + compiled.migration + 'ROLLBACK;', /exact unused Production predecessor/)
        await refuses(creator + 'BEGIN;TRUNCATE ' + BASELINE + ';ROLLBACK;', /bg1 immutable evidence/)
      })
      await t.test('the previous green generation admits no Counts, CMS, campaigns or published read', async () => {
        for (const expression of [countRead, entryRead, marketingRead])
          await refuses(human() + 'SELECT ' + expression + ';', /fresh full proof required/)
        await refuses('SET SESSION AUTHORIZATION anon;SELECT public.cms_inspiration_published_v1();', /fresh full proof required/)
      })
      await awaitNextBg1(proof, t.signal, BASELINE)
      await t.test('a genuinely later complete BG1 admits all new RPCs and retains AAL2', async () => {
        const counts = await proof.value<{ present_registered_accounts: string }>(countRead, human())
        assert.ok(BigInt(counts.present_registered_accounts) > 0n)
        const content = await proof.value<{ entry: { version: string }; history: unknown[] }>(entryRead, human())
        assert.equal(content.entry.version, '0'); assert.deepEqual(content.history, [])
        const campaigns = await proof.value<{ items: unknown[] }>(marketingRead, human())
        assert.deepEqual(campaigns.items, [])
        assert.deepEqual(await proof.value('public.cms_inspiration_published_v1()', 'SET SESSION AUTHORIZATION anon;'), { schema: 1, items: [] })
        for (const expression of [countRead, entryRead, marketingRead])
          await refuses(human('aal1') + 'SELECT ' + expression + ';', /not authorized/)
      })
      await t.test('synthetic CMS and campaign writes commit once; exact receipts confirm without a second write', async () => {
        const cmsRequest = randomUUID(), campaignRequest = randomUUID(), campaignId = randomUUID()
        const payload = { beschreibung: ENTDECKEN_ZIELE[0]!.beschreibung, idea: ENTDECKEN_ZIELE[0]!.idea, themen: [...ENTDECKEN_ZIELE[0]!.themen] }
        const cmsWrite = 'public.admin_cms_inspiration_command_v1(' + literal(cmsRequest) + ',' + literal(entryId) + ",0,'save_draft'," + json(payload) + ')'
        const cmsReceipt = await proof.value<{ status: string; version: string }>(cmsWrite, human())
        assert.equal(cmsReceipt.status, 'recorded'); assert.equal(cmsReceipt.version, '1')
        assert.deepEqual(await proof.value('public.admin_cms_inspiration_confirm_v1(' + literal(cmsRequest) + ')', human()), cmsReceipt)
        const command = { schemaVersion: 1, requestId: campaignRequest, draftId: campaignId, expectedVersion: '0', action: 'create',
          payload: { label: 'Owned native proof', destination: 'inspiration', channel: 'qr', contentId: null } }
        const campaignWrite = 'public.admin_marketing_drafts_apply_v1(' + json(command) + ')'
        await proof.value(campaignWrite, human())
        const stored = await proof.value<{ items: { draftId: string; version: string }[] }>(marketingRead, human())
        assert.equal(stored.items.length, 1); assert.equal(stored.items[0]!.draftId, campaignId); assert.equal(stored.items[0]!.version, '1')
        assert.equal(await proof.value('(SELECT to_jsonb(count(*)) FROM jetnity_marketing_private.operations_v1)', creator), 1)
        await proof.run(creator + 'SELECT official_v3_guard_private.assert_catalog_v1();', 'ordinary store DML does not rewrite the sealed catalog')
      })
      await t.test('new ACL/definition drift and a clock outside the lease fail directly in the database', async () => {
        const faults = [
          { sql: 'GRANT SELECT ON jetnity_marketing_private.drafts_v1 TO authenticated;', error: /protected catalog changed/ },
          { sql: "ALTER FUNCTION jetnity_cms_private.actor_v1() SET statement_timeout='1s';", error: /protected catalog changed/ },
          { sql: "UPDATE official_v3_guard_private.state_v1 SET last_observed=clock_timestamp()+interval '1 minute' WHERE singleton;", error: /integrity unavailable/ },
        ]
        for (const fault of faults) {
          await refuses(creator + 'BEGIN;' + fault.sql + human() + 'SELECT ' + entryRead + ';ROLLBACK;', fault.error)
          await proof.run(creator + 'SELECT official_v3_guard_private.assert_catalog_v1();', 'failed tampering transaction was fully rolled back')
        }
      })
    } finally { await proof.close() }
  })
