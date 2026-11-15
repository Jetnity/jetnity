// Real local PostgreSQL 17 + pgcrypto, with no sockets or remote connection.
// net/Vault are explicit synthetic transport models. Actual hosted scheduling,
// extension behavior and source publication remain separate live gates.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHmac } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { assertLocalProofEnvironment, findLocalPgBins } from '../../scripts/db/official-truth-integrated-pilot-1/local-cluster'

const key = 'synthetic-prod-scheduler-key-not-a-live-secret-123456789'
const path = '/api/internal/readiness/ch-de-prod-refresh'
const core = readFileSync(new URL('../../scripts/db/official-truth-v3-production-import-schedule-1/core.sql', import.meta.url), 'utf8')
const activation = readFileSync(new URL('../../scripts/db/official-truth-v3-production-import-schedule-1/activate.sql', import.meta.url), 'utf8')
const monitoring = readFileSync(new URL('../../scripts/db/official-truth-v3-production-import-schedule-1/monitoring.sql', import.meta.url), 'utf8')
const deactivation = readFileSync(new URL('../../scripts/db/official-truth-v3-production-import-schedule-1/deactivate.sql', import.meta.url), 'utf8')
const readback = readFileSync(new URL('../../scripts/db/official-truth-v3-production-import-schedule-1/readback.sql', import.meta.url), 'utf8')
const golden = { time: '1794690000123', operation: 'op3_' + '1'.repeat(32), lease: 'lease3_' + '2'.repeat(32) }
const goldenResponse = createHmac('sha256', key).update(['jetnity-prod-import-response-v1', 'POST', path,
  golden.time, '2', 'resume', golden.operation, golden.lease, '1', '200', 'published', '1'].join('\n'), 'utf8').digest('hex')
const fixture = `
CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE ROLE supabase_read_only_user;
CREATE SCHEMA vault; CREATE TABLE vault.decrypted_secrets(name text PRIMARY KEY,decrypted_secret text);
INSERT INTO vault.decrypted_secrets VALUES('jetnity_prod_import_cron_v1','${key}');
CREATE SCHEMA official_v3_jobs_private;
CREATE TABLE official_v3_jobs_private.subjects_v1(job_key text,kind text,start_count integer,operation_count integer);
INSERT INTO official_v3_jobs_private.subjects_v1 VALUES('research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513','rule_research',4,13);
CREATE SCHEMA official_v3_guard_private;
CREATE TABLE official_v3_guard_private.state_v1(singleton boolean,incident_generation bigint,resumed_generation bigint,
valid_until timestamptz,last_proof_started timestamptz,last_finished timestamptz);
INSERT INTO official_v3_guard_private.state_v1 VALUES(true,0,0,clock_timestamp()+interval '1 hour',clock_timestamp(),clock_timestamp());
-- Explicit quota provider fixture; the successor has its own full-history native proof.
CREATE FUNCTION official_v3_guard_private.ch_de_quota_v2() RETURNS jsonb LANGUAGE sql AS $$
 SELECT jsonb_build_object('model','rolling_24h_v2','clock_ok',true,
 'remaining_starts',greatest(0,64-start_count),'remaining_operations',greatest(0,256-operation_count))
 FROM official_v3_jobs_private.subjects_v1 LIMIT 1 $$;
CREATE SCHEMA net;
CREATE TABLE net.http_request_queue(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,method text,url text,headers jsonb,body bytea,timeout_milliseconds integer);
CREATE TABLE net._http_response(id bigint PRIMARY KEY,status_code integer,content_type text,headers jsonb,content text,timed_out boolean,error_msg text,created timestamptz DEFAULT clock_timestamp());
CREATE FUNCTION net.http_post(url text,body jsonb DEFAULT '{}'::jsonb,params jsonb DEFAULT '{}'::jsonb,
headers jsonb DEFAULT '{}'::jsonb,timeout_milliseconds integer DEFAULT 5000) RETURNS bigint
LANGUAGE sql AS $$ INSERT INTO net.http_request_queue(method,url,headers,body,timeout_milliseconds)
VALUES('POST',url,headers,convert_to(body::text,'UTF8'),timeout_milliseconds) RETURNING id $$;
`
const helpers = `
CREATE SCHEMA proof;
CREATE FUNCTION proof.check_ok(ok boolean, message text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS NOT TRUE THEN RAISE EXCEPTION 'native scheduler assertion: %',message; END IF; END $$;
CREATE FUNCTION proof.tick(expected text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual text; BEGIN actual:=jetnity_prod_import_scheduler.tick_v1();
  PERFORM proof.check_ok(actual=expected,concat('tick expected ',expected,' got ',actual)); END $$;
CREATE FUNCTION proof.arm() RETURNS void LANGUAGE sql AS $$
  UPDATE jetnity_prod_import_scheduler.state_v1 SET enabled=true,next_due_at=clock_timestamp(),
    status='armed' $$;
CREATE VIEW proof.pending AS SELECT d.*,c.operation_id,c.lease_id
  FROM jetnity_prod_import_scheduler.dispatches_v1 d JOIN jetnity_prod_import_scheduler.cycles_v1 c ON c.id=d.cycle_id;
CREATE FUNCTION proof.respond(status text, published integer DEFAULT 0, valid boolean DEFAULT true,
  http integer DEFAULT 200, selected bigint DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $$
DECLARE p record; mac text;
BEGIN
  SELECT * INTO STRICT p FROM proof.pending WHERE selected IS NULL OR id=selected ORDER BY id DESC LIMIT 1;
  mac:=CASE WHEN valid THEN encode(extensions.hmac(concat_ws(E'\\n','jetnity-prod-import-response-v1',
    'POST','${path}',p.signed_at_ms,'2',p.phase,p.operation_id,p.lease_id,'1',http::text,status,published::text),
    '${key}','sha256'),'hex') ELSE repeat('0',64) END;
  INSERT INTO net._http_response(id,status_code,content_type,headers,content,timed_out)
    VALUES(p.net_request_id,http,'application/json',jsonb_build_object('x-jetnity-prod-import-mac',mac),
      jsonb_build_object('schema',1,'status',status,'published',published)::text,false);
END $$;
`

// Explicit synthetic providers in this exclusively owned disposable cluster.
// Actual PG17 parses/executes the complete activation files. These catalog rows
// and cron APIs do not constitute a real pg_cron/pg_net installation or worker.
// The separate Production rollback proof must cover the actual installed providers.
const activationProviders = `
CREATE VIEW vault.secrets AS SELECT name FROM vault.decrypted_secrets;
CREATE SCHEMA cron;
CREATE TABLE cron.job(jobid bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,jobname text UNIQUE NOT NULL,
  schedule text NOT NULL,command text NOT NULL,username text NOT NULL DEFAULT 'postgres',
  database text NOT NULL DEFAULT 'postgres',active boolean NOT NULL DEFAULT true);
CREATE FUNCTION cron.schedule(job_name text,schedule text,command text) RETURNS bigint LANGUAGE sql AS $$
  INSERT INTO cron.job(jobname,schedule,command) VALUES($1,$2,$3) RETURNING jobid $$;
CREATE FUNCTION cron.alter_job(job_id bigint,schedule text DEFAULT NULL,command text DEFAULT NULL,
  database text DEFAULT NULL,username text DEFAULT NULL,active boolean DEFAULT NULL) RETURNS void LANGUAGE sql AS $$
  UPDATE cron.job j SET schedule=coalesce($2,j.schedule),command=coalesce($3,j.command),database=coalesce($4,j.database),
    username=coalesce($5,j.username),active=coalesce($6,j.active) WHERE j.jobid=$1 $$;
INSERT INTO cron.job(jobname,schedule,command) VALUES('sync_profile_emails_hourly','@hourly','SELECT public.sync_profile_emails();');
CREATE FUNCTION net.check_worker_is_up() RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END $$;
INSERT INTO pg_catalog.pg_extension(oid,extname,extowner,extnamespace,extrelocatable,extversion,extconfig,extcondition)
  VALUES(9999001,'pg_cron','postgres'::regrole,'cron'::regnamespace,false,'1.6.4',NULL,NULL),
        (9999002,'pg_net','postgres'::regrole,'net'::regnamespace,false,'0.19.5',NULL,NULL);
`

// Only transaction boundaries are changed to compose both complete files into
// one rollback probe; no target, extension, quota, expiry or role guard is removed.
function withoutCommit(source: string): string {
  assert.match(source, /\nCOMMIT;\s*$/)
  return source.replace(/\nCOMMIT;\s*$/, '\n')
}
function activationPrefix(target = 'production:qscbgcdmivbbnzrcyegn:refresh1'): string {
  return `SET jetnity.prod_import_target='${target}'; SET pg_net.database_name='postgres'; SET log_error_verbosity='verbose';\n`
}
function nested(source: string): string {
  assert.match(source, /^BEGIN;$/m)
  return withoutCommit(source).replace(/^BEGIN;$/m, '')
}
const activationRollbackReadback = `DO $readback$ BEGIN
  PERFORM proof.check_ok((SELECT count(*)=1 AND bool_and(jobname='sync_profile_emails_hourly' AND schedule='@hourly'
    AND command='SELECT public.sync_profile_emails();' AND active) FROM cron.job),'unrelated hourly job changed');
  PERFORM proof.check_ok((SELECT NOT enabled AND status='disabled' FROM jetnity_prod_import_scheduler.state_v1),'activation rollback retained enabled state');
  PERFORM proof.check_ok((SELECT count(*)=0 FROM jetnity_prod_import_scheduler.cycles_v1),'activation created cycle');
  PERFORM proof.check_ok((SELECT count(*)=0 FROM jetnity_prod_import_scheduler.dispatches_v1),'activation created dispatch');
  PERFORM proof.check_ok((SELECT count(*)=0 FROM net.http_request_queue),'activation sent HTTP');
END $readback$;`

type Case = Readonly<{ name: string; declarations?: string; sql: string; expectedError?: RegExp; inspect?: (output: string) => void }>
const cases: readonly Case[] = [
  {
    name: 'disabled state has no transport and an application role cannot invoke it',
    expectedError: /FATAL: +permission denied for schema jetnity_prod_import_scheduler/,
    sql: `
      PERFORM proof.tick('disabled');
      PERFORM proof.check_ok((SELECT count(*)=0 FROM net.http_request_queue),'disabled transport');
      SET LOCAL ROLE anon;
      PERFORM jetnity_prod_import_scheduler.tick_v1();`,
  },
  {
    name: 'original IDs precede transport and native request/response HMAC bytes agree with Node',
    declarations: 'p record; q record;',
    sql: `
      PERFORM proof.arm(); PERFORM proof.tick('dispatched_start');
      SELECT * INTO STRICT p FROM proof.pending ORDER BY id DESC LIMIT 1;
      SELECT * INTO STRICT q FROM net.http_request_queue WHERE id=p.net_request_id;
      RAISE WARNING 'JETNITY_SCHEDULER_REQUEST %', jsonb_build_object('headers',q.headers,'body',convert_from(q.body,'UTF8'),
        'url',q.url,'time',p.signed_at_ms,'operation',p.operation_id,'lease',p.lease_id,'timeout',q.timeout_milliseconds);
      PERFORM proof.check_ok(encode(extensions.hmac(concat_ws(E'\\n','jetnity-prod-import-response-v1','POST','${path}',
        '${golden.time}','2','resume','${golden.operation}','${golden.lease}','1','200','published','1'),
        '${key}','sha256'),'hex')='${goldenResponse}','response HMAC differs from Node');
      PERFORM proof.tick('awaiting_response');
      PERFORM proof.check_ok((SELECT count(*)=1 FROM net.http_request_queue),'duplicate outstanding dispatch');`,
    inspect(output) {
      const match = output.match(/JETNITY_SCHEDULER_REQUEST (\{[^\r\n]+\})/)
      assert.ok(match, 'native request evidence missing')
      const row = JSON.parse(match[1]) as { headers: Record<string, string>; body: string; url: string; time: string; operation: string; lease: string; timeout: number }
      const message = ['jetnity-prod-import-v1', 'POST', path, row.time, '2', 'start', row.operation, row.lease].join('\n')
      assert.equal(row.headers.Authorization, 'HMAC-SHA256 ' + createHmac('sha256', key).update(message, 'utf8').digest('hex'))
      assert.equal(row.headers['X-Jetnity-Prod-Import-Time'], row.time)
      assert.equal(Object.keys(row.headers).some(name => /cookie|vercel/i.test(name)), false, 'Production has no preview credential')
      assert.equal(row.url, 'https://jetnity.com' + path)
      assert.equal(row.timeout, 65000)
      assert.equal(row.body, `{"mode": "start", "schema": 2, "leaseId": "${row.lease}", "operationId": "${row.operation}"}`)
      assert.equal(JSON.stringify(row).includes(key), false, 'persistent secret in public transport')
    },
  },
  {
    name: 'queued then published preserves identity and uses original-start cadence',
    declarations: 'first_request record; work_request record;',
    sql: `
      PERFORM proof.arm(); PERFORM proof.tick('dispatched_start');
      SELECT * INTO first_request FROM proof.pending ORDER BY id DESC LIMIT 1;
      PERFORM proof.respond('queued'); PERFORM proof.tick('dispatched_resume');
      SELECT * INTO work_request FROM proof.pending ORDER BY id DESC LIMIT 1;
      PERFORM proof.check_ok(work_request.operation_id=first_request.operation_id AND work_request.lease_id=first_request.lease_id
        AND work_request.phase='resume','phase changed original request');
      PERFORM proof.respond('published',1); PERFORM proof.tick('published');
      PERFORM proof.check_ok((SELECT s.next_due_at=c.created_at+interval '40 minutes' AND c.state='published' AND c.published=1
        FROM jetnity_prod_import_scheduler.state_v1 s CROSS JOIN jetnity_prod_import_scheduler.cycles_v1 c),'publication cadence');
      PERFORM proof.tick('not_due');
      PERFORM proof.check_ok((SELECT start_count=4 AND operation_count=13 FROM official_v3_jobs_private.subjects_v1),'protected quota mutated');`,
  },
  {
    name: 'forged publication cannot advance enqueue or rotate original IDs',
    declarations: 'original record; latest record;',
    sql: `
      PERFORM proof.arm(); PERFORM proof.tick('dispatched_start');
      SELECT * INTO original FROM proof.pending ORDER BY id DESC LIMIT 1;
      PERFORM proof.respond('published',1,false); PERFORM proof.tick('dispatched_start');
      SELECT * INTO latest FROM proof.pending ORDER BY id DESC LIMIT 1;
      PERFORM proof.check_ok(original.operation_id=latest.operation_id AND original.lease_id=latest.lease_id,'forgery rotated IDs');
      PERFORM proof.check_ok((SELECT state='active' AND published=0 FROM jetnity_prod_import_scheduler.cycles_v1),'forgery published');`,
  },
  {
    name: 'a valid Dev response MAC cannot advance a Production original request',
    declarations: 'p record; dev_mac text;',
    sql: `
      PERFORM proof.arm(); PERFORM proof.tick('dispatched_start');
      SELECT * INTO STRICT p FROM proof.pending ORDER BY id DESC LIMIT 1;
      PERFORM proof.respond('queued');
      dev_mac:=encode(extensions.hmac(concat_ws(E'\\n','jetnity-dev-import-response-v1','POST',
        '/api/internal/readiness/ch-de-dev-refresh',p.signed_at_ms,'2',p.phase,p.operation_id,p.lease_id,'1','200','queued','0'),'${key}','sha256'),'hex');
      UPDATE net._http_response SET headers=jsonb_build_object('x-jetnity-prod-import-mac',dev_mac);
      PERFORM proof.tick('dispatched_start');
      PERFORM proof.check_ok((SELECT outcome='response_unconfirmed' FROM jetnity_prod_import_scheduler.dispatches_v1 WHERE id=p.id),'Dev response admitted');
      PERFORM proof.check_ok((SELECT operation_id=p.operation_id AND lease_id=p.lease_id AND phase='start'
        FROM jetnity_prod_import_scheduler.cycles_v1),'Dev response changed original request');`,
  },
  {
    name: 'complete zero retains the same original work request',
    declarations: 'original record;',
    sql: `
      PERFORM proof.arm(); PERFORM proof.tick('dispatched_start'); PERFORM proof.respond('queued'); PERFORM proof.tick('dispatched_resume');
      SELECT * INTO original FROM proof.pending ORDER BY id DESC LIMIT 1;
      PERFORM proof.respond('complete'); PERFORM proof.tick('dispatched_resume');
      PERFORM proof.check_ok((SELECT operation_id=original.operation_id AND lease_id=original.lease_id FROM proof.pending ORDER BY id DESC LIMIT 1),'complete zero rotated IDs');
      PERFORM proof.check_ok((SELECT count(*)=1 FROM jetnity_prod_import_scheduler.cycles_v1),'complete zero created new cycle');`,
  },
  {
    name: 'lost HTTP outcome retains original phase and IDs; late prior ACK does not confirm the new dispatch',
    declarations: 'original record; latest record;',
    sql: `
      PERFORM proof.arm(); PERFORM proof.tick('dispatched_start');
      SELECT * INTO original FROM proof.pending ORDER BY id DESC LIMIT 1;
      UPDATE jetnity_prod_import_scheduler.dispatches_v1 SET dispatched_at=clock_timestamp()-interval '91 seconds';
      PERFORM proof.tick('dispatched_start');
      SELECT * INTO latest FROM proof.pending ORDER BY id DESC LIMIT 1;
      PERFORM proof.check_ok(original.operation_id=latest.operation_id AND original.lease_id=latest.lease_id AND latest.phase='start','lost ACK changed custody');
      PERFORM proof.respond('queued',0,true,200,original.id); PERFORM proof.tick('awaiting_response');`,
  },
  {
    name: 'valid MAC for another dispatch cannot confirm the current dispatch',
    declarations: 'original record; latest record;',
    sql: `
      PERFORM proof.arm(); PERFORM proof.tick('dispatched_start');
      SELECT * INTO original FROM proof.pending ORDER BY id DESC LIMIT 1;
      UPDATE jetnity_prod_import_scheduler.dispatches_v1 SET dispatched_at=clock_timestamp()-interval '91 seconds';
      PERFORM proof.tick('dispatched_start');
      SELECT * INTO latest FROM proof.pending ORDER BY id DESC LIMIT 1;
      PERFORM proof.respond('queued',0,true,200,original.id);
      INSERT INTO net._http_response SELECT latest.net_request_id,status_code,content_type,headers,content,timed_out,error_msg,created
        FROM net._http_response WHERE id=original.net_request_id;
      -- Two local invocations can share one millisecond; make the private dispatch stamp distinct explicitly.
      UPDATE jetnity_prod_import_scheduler.dispatches_v1 SET signed_at_ms=(original.signed_at_ms::bigint+1)::text WHERE id=latest.id;
      PERFORM proof.tick('dispatched_start');`,
  },
  {
    name: 'expired signed response is not current publication evidence',
    sql: `
      PERFORM proof.arm(); PERFORM proof.tick('dispatched_start'); PERFORM proof.respond('queued'); PERFORM proof.tick('dispatched_resume');
      PERFORM proof.respond('published',1);
      UPDATE jetnity_prod_import_scheduler.dispatches_v1 SET dispatched_at=clock_timestamp()-interval '151 seconds' WHERE processed_at IS NULL;
      PERFORM proof.tick('dispatched_resume');`,
  },
  {
    name: 'eight unknown outcomes park without replacement cycle or IDs',
    sql: `
      PERFORM proof.arm(); PERFORM proof.tick('dispatched_start');
      FOR i IN 1..7 LOOP PERFORM proof.respond('unavailable',0,true,503); PERFORM proof.tick('dispatched_start'); END LOOP;
      PERFORM proof.respond('unavailable',0,true,503); PERFORM proof.tick('operator_review_required');
      PERFORM proof.tick('operator_review_required');
      PERFORM proof.check_ok((SELECT count(*)=1 FROM jetnity_prod_import_scheduler.cycles_v1),'retry budget created another cycle');
      PERFORM proof.check_ok((SELECT count(*)=8 FROM jetnity_prod_import_scheduler.dispatches_v1),'retry budget exceeded');`,
  },
  {
    name: 'signed revoked method parks the same cycle',
    sql: `
      PERFORM proof.arm(); PERFORM proof.tick('dispatched_start'); PERFORM proof.respond('not_approved',0,true,409);
      PERFORM proof.tick('operator_review_required');
      PERFORM proof.check_ok((SELECT count(*)=1 AND bool_and(state='blocked') FROM jetnity_prod_import_scheduler.cycles_v1),'revoked method not blocked');`,
  },
  {
    name: 'stale guard and both daily capacity limits stop before transport',
    sql: `
      PERFORM proof.arm();
      UPDATE official_v3_guard_private.state_v1 SET incident_generation=1;
      PERFORM proof.tick('guard_not_current');
      UPDATE official_v3_guard_private.state_v1 SET incident_generation=0;
      UPDATE official_v3_jobs_private.subjects_v1 SET start_count=61;
      PERFORM proof.tick('daily_capacity_low');
      UPDATE official_v3_jobs_private.subjects_v1 SET start_count=4,operation_count=241;
      PERFORM proof.tick('daily_capacity_low');
      PERFORM proof.check_ok((SELECT count(*)=0 FROM net.http_request_queue),'guard or quota bypassed');`,
  },
  {
    name: 'missing reviewed rolling quota sends no request',
    sql: `
      PERFORM proof.arm(); DROP FUNCTION official_v3_guard_private.ch_de_quota_v2();
      PERFORM proof.tick('quota_state_unavailable');
      PERFORM proof.check_ok((SELECT count(*)=0 FROM net.http_request_queue),'missing quota dispatched');`,
  },
  {
    name: 'rolling readback allows continued work beyond lifetime counts without mutating them',
    sql: `
      PERFORM proof.arm(); UPDATE official_v3_jobs_private.subjects_v1 SET start_count=100,operation_count=300;
      EXECUTE 'CREATE OR REPLACE FUNCTION official_v3_guard_private.ch_de_quota_v2() RETURNS jsonb LANGUAGE sql AS $f$
        SELECT jsonb_build_object(''model'',''rolling_24h_v2'',''clock_ok'',true,''remaining_starts'',28,''remaining_operations'',148) $f$';
      PERFORM proof.tick('dispatched_start');
      PERFORM proof.check_ok((SELECT start_count=100 AND operation_count=300 FROM official_v3_jobs_private.subjects_v1),'lifetime counter changed');`,
  },
  {
    name: 'a rollback clock or substituted quota model cannot start another request',
    sql: `
      PERFORM proof.arm();
      EXECUTE 'CREATE OR REPLACE FUNCTION official_v3_guard_private.ch_de_quota_v2() RETURNS jsonb LANGUAGE sql AS $f$
        SELECT jsonb_build_object(''model'',''rolling_24h_v2'',''clock_ok'',false,''remaining_starts'',64,''remaining_operations'',256) $f$';
      PERFORM proof.tick('quota_state_unavailable');
      EXECUTE 'CREATE OR REPLACE FUNCTION official_v3_guard_private.ch_de_quota_v2() RETURNS jsonb LANGUAGE sql AS $f$
        SELECT jsonb_build_object(''model'',''lifetime_v1'',''clock_ok'',true,''remaining_starts'',64,''remaining_operations'',256) $f$';
      PERFORM proof.tick('quota_state_unavailable');
      PERFORM proof.check_ok((SELECT count(*)=0 FROM net.http_request_queue),'invalid quota sent transport');`,
  },
  {
    name: 'independent public status requires a signed publication, exact active cron and current normal BG1',
    declarations: 'status_row jsonb;',
    sql: `
      PERFORM proof.arm();
      PERFORM cron.schedule('jetnity-ch-de-prod-import-v1','* * * * *','SELECT jetnity_prod_import_scheduler.tick_v1();');
      PERFORM proof.check_ok(public.jetnity_production_import_status_v1()='{"schema":1,"status":"unavailable","nextDueAt":null}'::jsonb,'arming is not publication');
      PERFORM proof.tick('dispatched_start'); PERFORM proof.respond('queued'); PERFORM proof.tick('dispatched_resume');
      PERFORM proof.respond('published',1); PERFORM proof.tick('published');
      SET LOCAL ROLE anon;
      status_row:=public.jetnity_production_import_status_v1();
      RESET ROLE;
      PERFORM proof.check_ok(status_row=jsonb_build_object('schema',1,'status','current','nextDueAt',
        (SELECT floor(extract(epoch FROM next_due_at)*1000)::bigint FROM jetnity_prod_import_scheduler.state_v1)),'minimal current public status');
      UPDATE cron.job SET active=false WHERE jobname='jetnity-ch-de-prod-import-v1';
      PERFORM proof.check_ok(public.jetnity_production_import_status_v1()->>'status'='unavailable','current BG concealed disabled cron');
      UPDATE cron.job SET active=true,command='SELECT 1' WHERE jobname='jetnity-ch-de-prod-import-v1';
      PERFORM proof.check_ok(public.jetnity_production_import_status_v1()->>'status'='unavailable','foreign cron command accepted');
      UPDATE cron.job SET command='SELECT jetnity_prod_import_scheduler.tick_v1();' WHERE jobname='jetnity-ch-de-prod-import-v1';
      UPDATE official_v3_guard_private.state_v1 SET valid_until=clock_timestamp()-interval '1 second';
      PERFORM proof.check_ok(public.jetnity_production_import_status_v1()->>'status'='unavailable','stale BG concealed');
      UPDATE official_v3_guard_private.state_v1 SET valid_until=clock_timestamp()+interval '1 hour';
      DELETE FROM cron.job WHERE jobname='jetnity-ch-de-prod-import-v1';
      PERFORM proof.check_ok(public.jetnity_production_import_status_v1()->>'status'='unavailable','missing cron concealed by current BG');`,
  },
  {
    name: 'monitor fails closed for stalled ticks, low budget, bad cadence and overdue original work',
    declarations: 'observed timestamptz; due timestamptz;',
    sql: `
      PERFORM proof.arm();
      PERFORM cron.schedule('jetnity-ch-de-prod-import-v1','* * * * *','SELECT jetnity_prod_import_scheduler.tick_v1();');
      PERFORM proof.tick('dispatched_start'); PERFORM proof.respond('queued'); PERFORM proof.tick('dispatched_resume');
      PERFORM proof.respond('published',1); PERFORM proof.tick('published');
      SELECT observed_at,next_due_at INTO observed,due FROM jetnity_prod_import_scheduler.state_v1;
      UPDATE jetnity_prod_import_scheduler.state_v1 SET observed_at=clock_timestamp()-interval '181 seconds';
      PERFORM proof.check_ok(public.jetnity_production_import_status_v1()->>'status'='unavailable','stopped tick remains current');
      UPDATE jetnity_prod_import_scheduler.state_v1 SET observed_at=clock_timestamp()+interval '1 second';
      PERFORM proof.check_ok(public.jetnity_production_import_status_v1()->>'status'='unavailable','future tick remains current');
      UPDATE jetnity_prod_import_scheduler.state_v1 SET observed_at=observed,remaining_starts=3;
      PERFORM proof.check_ok(public.jetnity_production_import_status_v1()->>'status'='unavailable','low START reserve remains current');
      UPDATE jetnity_prod_import_scheduler.state_v1 SET remaining_starts=60,remaining_operations=15;
      PERFORM proof.check_ok(public.jetnity_production_import_status_v1()->>'status'='unavailable','low operation reserve remains current');
      UPDATE jetnity_prod_import_scheduler.state_v1 SET remaining_operations=243,next_due_at=due-interval '1 second';
      PERFORM proof.check_ok(public.jetnity_production_import_status_v1()->>'status'='unavailable','unrelated cadence accepted');
      UPDATE jetnity_prod_import_scheduler.state_v1 SET next_due_at=due;
      -- Explicit local monitor fixture only: preserve all committed real cycle
      -- rows and insert one old original request, never edit a protected clock.
      INSERT INTO jetnity_prod_import_scheduler.cycles_v1(created_at,operation_id,lease_id)
        VALUES(clock_timestamp()-interval '11 minutes','op3_'||repeat('c',32),'lease3_'||repeat('d',32));
      PERFORM proof.check_ok(public.jetnity_production_import_status_v1()->>'status'='unavailable','overdue original request accepted');`,
  },
  {
    name: 'public status grants no anonymous access to scheduler identities or dispatches',
    expectedError: /FATAL: +permission denied for schema jetnity_prod_import_scheduler/,
    sql: `SET LOCAL ROLE anon; PERFORM * FROM jetnity_prod_import_scheduler.cycles_v1;`,
  },
  {
    name: 'stored original request fields cannot be relabelled',
    expectedError: /FATAL: +original scheduler request is immutable/,
    sql: `
      PERFORM proof.arm(); PERFORM proof.tick('dispatched_start');
      UPDATE jetnity_prod_import_scheduler.cycles_v1 SET operation_id='op3_'||repeat('f',32);`,
  },
]

test('Production scheduler native PG17 state and authenticated transport, without sockets', {
  timeout: 120000,
  skip: !findLocalPgBins() && process.env.CI !== 'true' && process.env.GITHUB_ACTIONS !== 'true'
    ? 'NOT VERIFIED locally: PostgreSQL binaries absent; required in hosted PG17 CI' : false,
}, async t => {
  assertLocalProofEnvironment()
  const bins = findLocalPgBins()
  assert.ok(bins, 'PostgreSQL 17 binaries are required')
  const version = execFileSync(bins.postgres, ['--version'], { encoding: 'utf8', timeout: 5000 })
  assert.match(version, /PostgreSQL\) 17\./)
  const root = mkdtempSync(join(tmpdir(), 'jetnity-prod-scheduler-native-'))
  const data = join(root, 'data')
  const env = { ...process.env }
  for (const name of Object.keys(env)) if (/^(PG|PSQL)/.test(name)) delete env[name]
  const run = (sql: string, expectedError?: RegExp): string => {
    // Single-user mode executes actual PostgreSQL SQL without a postmaster,
    // network/Unix socket, connection URL, or external cluster. -j retains SQL
    // newlines; exit_on_error prevents a later marker from concealing an error.
    const result = spawnSync(bins.postgres, ['--single', '-D', data, '-j', '-c', 'exit_on_error=on',
      '-c', 'log_min_error_statement=panic', '-c', 'statement_timeout=25000', 'postgres'],
    { input: sql + '\n\n', encoding: 'utf8', env, stdio: ['pipe', 'pipe', 'pipe'], timeout: 30000, maxBuffer: 4 * 1024 * 1024 })
    if (!result.error && expectedError) {
      assert.equal(result.status, 1, 'expected native rejection did not occur')
      assert.match(result.stderr, expectedError)
      return result.stdout + '\n' + result.stderr
    }
    if (result.error || result.status !== 0) throw new Error('Native scheduler proof failed: ' +
      (result.error?.message ?? '') + result.stderr + result.stdout)
    return result.stdout + '\n' + result.stderr
  }
  try {
    execFileSync(bins.initdb, ['-D', data, '--no-locale', '--encoding=UTF8', '--auth-local=reject', '--auth-host=reject',
      '--username', 'postgres', '--no-sync'], { encoding: 'utf8', env, stdio: 'pipe', timeout: 60000 })
    run(fixture + activationProviders + "\nBEGIN; SET LOCAL jetnity.prod_import_target='production:qscbgcdmivbbnzrcyegn:refresh1';\n" + core + monitoring + '\nCOMMIT;\n' + helpers)
    // Monitoring installs before the future BG1 public getter exists. It stays
    // unavailable until genuine prerequisites/publication exist; no baseline call.
    run(`SELECT public.jetnity_production_import_status_v1();
      CREATE FUNCTION public.official_v3_guard_alarm_status_v1() RETURNS jsonb LANGUAGE sql AS $$
      SELECT jsonb_build_object('schema',1,'status',CASE WHEN incident_generation=resumed_generation
        AND valid_until>clock_timestamp() THEN 'current' ELSE 'unavailable' END)
      FROM official_v3_guard_private.state_v1 WHERE singleton $$;`)
    await t.test('complete operator readback discloses no key, request body or header and creates no work', () => {
      const output = run(readback)
      assert.ok(output.includes('production_import_status') && output.includes('production_import_history'))
      assert.equal(output.includes(key), false)
      assert.doesNotMatch(output, /HMAC-SHA256|\"headers\"|\"body\"/)
      run(activationRollbackReadback)
    })
    for (const [index, item] of cases.entries()) {
      await t.test(item.name, () => {
        const marker = 'JETNITY_SCHEDULER_PROOF_' + index
        const output = run(`BEGIN;\nDO $case$\n${item.declarations ? 'DECLARE ' + item.declarations : ''}\nBEGIN\n${item.sql}\nEND $case$;\nSELECT '${marker}';\nROLLBACK;`, item.expectedError)
        if (!item.expectedError) assert.ok(output.includes(marker), 'native completion marker missing')
        item.inspect?.(output)
      })
    }
    // Complete files execute against explicit provider models. No actual worker
    // or remote HTTP success is claimed by these local transaction proofs.
    await t.test('complete activation, stop and exact rearm preserve requests and the unrelated hourly cron', () => {
      const output = run(activationPrefix() + withoutCommit(activation) + `
        CREATE TEMP TABLE cron_identity ON COMMIT DROP AS SELECT jobid FROM cron.job WHERE jobname='jetnity-ch-de-prod-import-v1';
        DO $before$ BEGIN
          PERFORM proof.check_ok((SELECT count(*)=0 FROM net.http_request_queue),'activation dispatched');
          PERFORM proof.check_ok(public.jetnity_production_import_status_v1()->>'status'='unavailable','armed is falsely current');
          PERFORM proof.tick('dispatched_start');
        END $before$;
        CREATE TEMP TABLE ledger_before ON COMMIT DROP AS SELECT to_jsonb(c) AS row FROM jetnity_prod_import_scheduler.cycles_v1 c;
        CREATE TEMP TABLE dispatch_before ON COMMIT DROP AS SELECT to_jsonb(d) AS row FROM jetnity_prod_import_scheduler.dispatches_v1 d;
        CREATE TEMP TABLE state_before ON COMMIT DROP AS SELECT next_due_at FROM jetnity_prod_import_scheduler.state_v1;
        ` + nested(deactivation) + `
        DO $stopped$ BEGIN
          PERFORM proof.tick('disabled');
          PERFORM proof.check_ok((SELECT NOT enabled FROM jetnity_prod_import_scheduler.state_v1),'stop state');
          PERFORM proof.check_ok((SELECT count(*)=1 AND bool_and(NOT active) FROM cron.job WHERE jobname='jetnity-ch-de-prod-import-v1'),'stop cron');
          PERFORM proof.check_ok(public.jetnity_production_import_status_v1()->>'status'='unavailable','disabled monitor');
        END $stopped$;
        ` + nested(activation) + `
        DO $rearmed$ BEGIN
          PERFORM proof.check_ok((SELECT c.jobid=i.jobid AND c.active FROM cron.job c CROSS JOIN cron_identity i
            WHERE c.jobname='jetnity-ch-de-prod-import-v1'),'rearm replaced cron');
          PERFORM proof.check_ok((SELECT to_jsonb(c)=b.row FROM jetnity_prod_import_scheduler.cycles_v1 c CROSS JOIN ledger_before b),'stop/rearm mutated request');
          PERFORM proof.check_ok((SELECT to_jsonb(d)=b.row FROM jetnity_prod_import_scheduler.dispatches_v1 d CROSS JOIN dispatch_before b),'stop/rearm mutated dispatch');
          PERFORM proof.check_ok((SELECT s.next_due_at=b.next_due_at FROM jetnity_prod_import_scheduler.state_v1 s CROSS JOIN state_before b),'rearm changed cadence');
          PERFORM proof.tick('awaiting_response');
          PERFORM proof.check_ok((SELECT count(*)=1 FROM net.http_request_queue),'stop/rearm sent duplicate request');
          PERFORM proof.check_ok((SELECT count(*)=2 AND bool_and(active) FROM cron.job),'unrelated cron changed');
        END $rearmed$;
        SELECT 'JETNITY_PROD_ACTIVATE_STOP_REARM'; ROLLBACK;`)
      assert.ok(output.includes('JETNITY_PROD_ACTIVATE_STOP_REARM'))
      run(activationRollbackReadback)
    })
    await t.test('complete activation refuses foreign context, provider version, worker, model and existing job', () => {
      const negatives = [
        { prefix: activationPrefix('dev:yfvbxvijcorffwxbxahl:refresh1'), before: '', error: /exact Production scheduler prerequisites required/ },
        { prefix: activationPrefix(), before: "UPDATE pg_extension SET extversion='0.20.4' WHERE extname='pg_net';", error: /exact Production scheduler prerequisites required/ },
        { prefix: activationPrefix(), before: "DELETE FROM vault.decrypted_secrets WHERE name='jetnity_prod_import_cron_v1';", error: /exact Production scheduler prerequisites required/ },
        { prefix: activationPrefix(), before: "UPDATE vault.decrypted_secrets SET decrypted_secret='invalid secret' WHERE name='jetnity_prod_import_cron_v1';", error: /exact Production scheduler prerequisites required/ },
        { prefix: activationPrefix(), before: "CREATE OR REPLACE FUNCTION net.check_worker_is_up() RETURNS void LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic worker is down'; END $$;", error: /synthetic worker is down/ },
        { prefix: activationPrefix(), before: "CREATE OR REPLACE FUNCTION official_v3_guard_private.ch_de_quota_v2() RETURNS jsonb LANGUAGE sql AS $$ SELECT '{\"model\":\"lifetime_v1\",\"clock_ok\":true}'::jsonb $$;", error: /current rolling Production quota required/ },
        { prefix: activationPrefix(), before: "INSERT INTO cron.job(jobname,schedule,command) VALUES('jetnity-ch-de-prod-import-v1','@hourly','SELECT 1');", error: /existing import schedule identity refused/ },
      ]
      for (const item of negatives) {
        run(item.prefix + 'BEGIN;' + item.before + nested(activation), item.error)
        run(activationRollbackReadback)
      }
    })
    await t.test('complete stop refuses a foreign named cron and another target without ledger changes', () => {
      run(activationPrefix() + "BEGIN; INSERT INTO cron.job(jobname,schedule,command) VALUES('jetnity-ch-de-prod-import-v1','@hourly','SELECT 1');" + nested(deactivation), /foreign scheduler stop refused/)
      run(activationRollbackReadback)
      run(activationPrefix('dev:yfvbxvijcorffwxbxahl:refresh1') + deactivation, /exact Production scheduler stop context required/)
      run(activationRollbackReadback)
    })
  } finally {
    // No server process is started. Every synchronous backend has exited before
    // cleanup; the generated cluster is solely owned by this proof.
    rmSync(root, { recursive: true, force: true })
  }
})
