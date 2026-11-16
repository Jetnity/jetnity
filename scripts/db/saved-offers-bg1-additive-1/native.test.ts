// Real local PG17 proof using the existing owned cluster and compiled Production BG1.
// No hosted DB, live source, customer or credential.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { literal } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { compileProductionArtifacts, PRODUCTION } from '../../official-truth-product-v3-production/build.mjs'
import { compileProductionAdmin, BASELINE, TARGET } from '../admin-runtime-production-1/build.mjs'
import { functionsIn } from '../official-truth-v3-background-guard-1/build.mjs'
import { awaitNextBg1 } from '../official-truth-v3-dev-cycle4-attempt2-recovery-1/await-next-bg1'
import { compileSavedOffersGuard } from './compose.mjs'
const read=(path:string)=>readFileSync(new URL(path,import.meta.url),'utf8')
const compiled=compileProductionArtifacts()
const installAndGuard=compiled.get('scripts/db/official-truth-v3-production-install-1/install-and-start-guard.sql')!
const creator=`SET SESSION AUTHORIZATION postgres; SET search_path=pg_catalog; SET jetnity.production_target=${literal(PRODUCTION.target)};`
const schedulerCreator=creator+"SET jetnity.prod_import_target='production:qscbgcdmivbbnzrcyegn:refresh1'; SET pg_net.database_name='postgres';"
const uid=(n:number)=>n.toString(16).padStart(8,'0')+'-1111-4111-8111-'+n.toString(16).padStart(12,'0')

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
  const moderation = functionsIn(read('../../../supabase/migrations/20260827170000_admin_aal2_data_plane_alignment.sql')).find(f => f.signature === 'public.darf_inhalte_moderieren()')
  assert.ok(moderation)
  await proof.run('SET SESSION AUTHORIZATION ot_pilot_owner; ALTER TABLE auth.users ADD COLUMN created_at timestamptz;'
    + "UPDATE auth.users SET created_at=clock_timestamp()-interval '1 day';"
     + creator + "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;" + moderation.sql
    + 'REVOKE ALL ON FUNCTION public.darf_inhalte_moderieren() FROM PUBLIC,anon;'
    + 'GRANT EXECUTE ON FUNCTION public.darf_inhalte_moderieren() TO postgres,authenticated,service_role;', 'synthetic provider admission prerequisites')
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


test('saved_offers successor extends the real local Production PG17 BG1 atomically', {timeout:900000}, async t=>{
 const proof=new OwnedPersistentProof(t.signal)
 const forProduction = (sql: string) => creator + sql.replace(/^BEGIN;\n/, "BEGIN;\nSET LOCAL jetnity.saved_offers_target = 'production:qscbgcdmivbbnzrcyegn:SAVED-OFFERS-BG1-1';\n")
 const bundle=compileSavedOffersGuard()
 const refuses = async (sql: string, reason: RegExp) => {
   const result = await proof.run(sql, 'reject unsafe transition', new RegExp(reason.source + '|current transaction is aborted'))
   const first = result.split('\n').find(line => /\bERROR:/.test(line))
   assert.match(first ?? '', reason)
 }
 try{
   await fixture(proof)
   await proof.run(creator+"CREATE SCHEMA supabase_migrations; CREATE TABLE supabase_migrations.schema_migrations(version text PRIMARY KEY,statements text[],name text,created_by text,idempotency_key text,rollback text[]);",
     'isolated synthetic migration tracking')
   await syntheticProviderMetadata(proof)
   await proof.run(creator+"SET cron.database_name='postgres'; SET cron.log_run='on';"+installAndGuard,
     'reviewed full local Production BG1 and genuine initial proof')
   assert.deepEqual(await proof.value('public.official_v3_guard_alarm_status_v1()',creator),
     {schema:1,status:'current'})
   const admin = compileProductionAdmin()
   await proof.run(creator+'BEGIN; SET LOCAL jetnity.admin_runtime_target='+literal(TARGET)+';'+admin.migration+'COMMIT;', 'install reviewed #1220 admin predecessor')
   await awaitNextBg1(proof, t.signal, BASELINE)
   const adminDigest = "(SELECT to_jsonb(encode(sha256(convert_to(to_jsonb(a)::text,'UTF8')),'hex')) FROM official_v3_guard_private.admin_runtime_baseline_v1 a)"
   const originalAdmin = await proof.value(adminDigest, creator)
   const catalogDigest = "to_jsonb(encode(sha256(convert_to(official_v3_guard_private.catalog_status_v1()::text,'UTF8')),'hex'))"
   const oldCatalog=await proof.value(catalogDigest,creator)
   const rollingDigest = "(SELECT to_jsonb(encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex')) FROM official_v3_guard_private.rolling_quota_baseline_v1 r)"
   const oldRolling=await proof.value(rollingDigest,creator)
   await t.test('wrong owner target rolls back every addition',async ()=>{
     await refuses(creator+bundle,
       /saved_offers exact new production predecessor required/)
     assert.equal(await proof.value("to_jsonb(to_regclass('public.saved_offers') IS NULL)",creator),true)
     assert.deepEqual(await proof.value(catalogDigest,creator),oldCatalog)
   })
   await t.test('unexpected mutation during migration refuses the entire transaction',async ()=>{
     const fault=bundle.replace('-- Part 2/4: after the EXACT original saved_offers migration',
       "GRANT SELECT ON jetnity_marketing_private.drafts_v1 TO authenticated;\n-- Part 2/4: after the EXACT original saved_offers migration")
     assert.notEqual(fault,bundle)
     await refuses(forProduction(fault),
       /saved_offers unauthorized catalog delta/)
     assert.equal(await proof.value("to_jsonb(to_regclass('public.saved_offers') IS NULL)",creator),true)
     assert.deepEqual(await proof.value(catalogDigest,creator),oldCatalog)
   })
   await t.test('genuine transaction creates saved_offers with immutable successor',async ()=>{
     await proof.run(forProduction(bundle),'exact saved_offers and successor atomic install')
     assert.equal(await proof.value("to_jsonb(to_regclass('public.saved_offers') IS NOT NULL)",creator),true)
     assert.equal(await proof.value("to_jsonb((SELECT count(*)=1 FROM supabase_migrations.schema_migrations WHERE version='20261113173644' AND name='saved_offers'))",creator),true)
     assert.deepEqual(await proof.value(rollingDigest,creator),oldRolling)
     await proof.run(creator+"SELECT official_v3_guard_private.assert_catalog_v1();",'full installed successor check')
     assert.deepEqual(await proof.value('public.official_v3_guard_alarm_status_v1()',creator),{schema:1,status:'unavailable'})
     assert.equal(await proof.value("to_jsonb(NOT has_table_privilege('anon','public.saved_offers','SELECT'))",creator),true)
     assert.equal(await proof.value("to_jsonb((SELECT relrowsecurity FROM pg_class WHERE oid='public.saved_offers'::regclass))",creator),true)
   })
   await t.test('tampering with own RLS policy is caught; rollback restores guard',async ()=>{
     await refuses(creator+"BEGIN; ALTER POLICY saved_offers_select_own ON public.saved_offers USING (true); SELECT official_v3_guard_private.assert_catalog_v1(); ROLLBACK;",
       /protected catalog changed/)
     await proof.run(creator+"SELECT official_v3_guard_private.assert_catalog_v1();",'restored successor check')
   })
   await t.test('only the offer owner can read, edit and remove a saved offer', async () => {
     const session = (ownerId: string) => 'SET SESSION AUTHORIZATION authenticated;SET request.jwt.claim.sub=' + literal(ownerId) + ';'
     const own = session(uid(1)), other = session(uid(2))
     const insert = "INSERT INTO public.saved_offers(category,provider,offer_ref,title,url,source) VALUES ('stay','fixture','sample','Hotel','https://example.invalid/hotel','manual');"
     await proof.run(own + insert, 'save own offer')
     assert.equal(await proof.value('(SELECT to_jsonb(count(*)) FROM public.saved_offers)', other), 0)
     await proof.run(other + "UPDATE public.saved_offers SET title='Other'; DELETE FROM public.saved_offers;", 'other account has no matching rows')
     assert.equal(await proof.value('(SELECT to_jsonb(title) FROM public.saved_offers)', own), 'Hotel')
     await proof.run(own + "UPDATE public.saved_offers SET title='Updated';", 'update own item')
     assert.equal(await proof.value('(SELECT to_jsonb(title) FROM public.saved_offers)', own), 'Updated')
     await proof.run(own + 'DELETE FROM public.saved_offers;', 'remove own item')
     assert.equal(await proof.value('(SELECT to_jsonb(count(*)) FROM public.saved_offers)', own), 0)
   })
   assert.deepEqual(await proof.value(adminDigest,creator),originalAdmin)
   await awaitNextBg1(proof, t.signal, 'official_v3_guard_private.saved_offers_baseline_v1')
   await proof.run(creator+'SELECT official_v3_guard_private.admin_runtime_guard_v1();','admin retains genuine fresh proof')
 } finally {await proof.close()}
})
