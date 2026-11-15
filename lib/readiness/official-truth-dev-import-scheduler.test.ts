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

const key = 'synthetic-dev-scheduler-key-not-a-live-secret-123456789'
const previewCookie = '_vercel_jwt=eyJhbGciOiJIUzI1NiJ9.eyJmaXh0dXJlIjp0cnVlfQ.c3ludGhldGljX3ZlcmNlbF9jb29raWVfc2lnbmF0dXJl'
const path = '/api/internal/readiness/ch-de-dev-refresh'
const core = readFileSync(new URL('../../scripts/db/official-truth-v3-dev-import-schedule-1/core.sql', import.meta.url), 'utf8')
const activation = readFileSync(new URL('../../scripts/db/official-truth-v3-dev-import-schedule-1/activate.sql', import.meta.url), 'utf8')
const renewal = readFileSync(new URL('../../scripts/db/official-truth-v3-dev-import-schedule-1/preview-renewal.sql', import.meta.url), 'utf8')
const renewalActivation = readFileSync(new URL('../../scripts/db/official-truth-v3-dev-import-schedule-1/activate-preview-renewal.sql', import.meta.url), 'utf8')
const golden = { time: '1794690000123', operation: 'op3_' + '1'.repeat(32), lease: 'lease3_' + '2'.repeat(32) }
const goldenResponse = createHmac('sha256', key).update(['jetnity-dev-import-response-v1', 'POST', path,
  golden.time, '2', 'resume', golden.operation, golden.lease, '1', '200', 'published', '1'].join('\n'), 'utf8').digest('hex')
const fixture = `
CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE ROLE supabase_read_only_user;
CREATE SCHEMA vault; CREATE TABLE vault.decrypted_secrets(name text PRIMARY KEY,decrypted_secret text);
INSERT INTO vault.decrypted_secrets VALUES('jetnity_dev_import_cron_v1','${key}');
INSERT INTO vault.decrypted_secrets VALUES('jetnity_dev_import_preview_cookie_v1','${previewCookie}');
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
DECLARE actual text; BEGIN actual:=jetnity_dev_import_scheduler.tick_v1();
  PERFORM proof.check_ok(actual=expected,concat('tick expected ',expected,' got ',actual)); END $$;
CREATE FUNCTION proof.arm() RETURNS void LANGUAGE sql AS $$
  UPDATE jetnity_dev_import_scheduler.state_v1 SET enabled=true,next_due_at=clock_timestamp(),
    transport_expires_at=clock_timestamp()+interval '1 hour' $$;
CREATE VIEW proof.pending AS SELECT d.*,c.operation_id,c.lease_id
  FROM jetnity_dev_import_scheduler.dispatches_v1 d JOIN jetnity_dev_import_scheduler.cycles_v1 c ON c.id=d.cycle_id;
CREATE FUNCTION proof.respond(status text, published integer DEFAULT 0, valid boolean DEFAULT true,
  http integer DEFAULT 200, selected bigint DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $$
DECLARE p record; mac text;
BEGIN
  SELECT * INTO STRICT p FROM proof.pending WHERE selected IS NULL OR id=selected ORDER BY id DESC LIMIT 1;
  mac:=CASE WHEN valid THEN encode(extensions.hmac(concat_ws(E'\\n','jetnity-dev-import-response-v1',
    'POST','${path}',p.signed_at_ms,'2',p.phase,p.operation_id,p.lease_id,'1',http::text,status,published::text),
    '${key}','sha256'),'hex') ELSE repeat('0',64) END;
  INSERT INTO net._http_response(id,status_code,content_type,headers,content,timed_out)
    VALUES(p.net_request_id,http,'application/json',jsonb_build_object('x-jetnity-dev-import-mac',mac),
      jsonb_build_object('schema',1,'status',status,'published',published)::text,false);
END $$;
`

// Explicit synthetic providers in this exclusively owned disposable cluster.
// Actual PG17 parses/executes the complete activation files. These catalog rows
// and cron APIs do not constitute a real pg_cron/pg_net installation or worker.
// The separate Dev rollback proof must cover the actual installed providers.
const activationProviders = `
CREATE VIEW vault.secrets AS SELECT name FROM vault.decrypted_secrets;
INSERT INTO vault.decrypted_secrets VALUES('jetnity_dev_import_preview_share_v1','synthetic-preview-share');
CREATE SCHEMA cron;
CREATE TABLE cron.job(jobid bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,jobname text UNIQUE NOT NULL,
  schedule text NOT NULL,command text NOT NULL,username text NOT NULL DEFAULT 'postgres',
  database text NOT NULL DEFAULT 'postgres',active boolean NOT NULL DEFAULT true);
CREATE FUNCTION cron.schedule(job_name text,schedule text,command text) RETURNS bigint LANGUAGE sql AS $$
  INSERT INTO cron.job(jobname,schedule,command) VALUES($1,$2,$3) RETURNING jobid $$;
CREATE FUNCTION cron.alter_job(job_id bigint,command text) RETURNS void LANGUAGE sql AS $$
  UPDATE cron.job SET command=$2 WHERE jobid=$1 $$;
INSERT INTO pg_catalog.pg_extension(oid,extname,extowner,extnamespace,extrelocatable,extversion,extconfig,extcondition)
  VALUES(9999001,'pg_cron','postgres'::regrole,'cron'::regnamespace,false,'1.6.4',NULL,NULL),
        (9999002,'pg_net','postgres'::regrole,'net'::regnamespace,false,'0.20.4',NULL,NULL);
`

// Only transaction boundaries are changed to compose both complete files into
// one rollback probe; no target, extension, quota, expiry or role guard is removed.
function withoutCommit(source: string): string {
  assert.match(source, /\nCOMMIT;\s*$/)
  return source.replace(/\nCOMMIT;\s*$/, '\n')
}
function activationPrefix(target = 'dev:yfvbxvijcorffwxbxahl:refresh1', seconds = 172800): string {
  return `SET jetnity.dev_import_target='${target}';
    SET jetnity.dev_import_preview_expires='${Math.floor(Date.now() / 1000) + seconds}';
    SET log_error_verbosity='verbose';\n`
}
const activationRollbackReadback = `DO $readback$ BEGIN
  PERFORM proof.check_ok((SELECT count(*)=0 FROM cron.job),'activation rollback retained cron');
  PERFORM proof.check_ok((SELECT NOT enabled AND status='disabled' AND transport_expires_at IS NULL
    FROM jetnity_dev_import_scheduler.state_v1),'activation rollback retained enabled state');
  PERFORM proof.check_ok((SELECT count(*)=0 FROM jetnity_dev_import_scheduler.cycles_v1),'activation created cycle');
  PERFORM proof.check_ok((SELECT count(*)=0 FROM jetnity_dev_import_scheduler.dispatches_v1),'activation created dispatch');
  PERFORM proof.check_ok((SELECT count(*)=0 FROM net.http_request_queue),'activation sent HTTP');
END $readback$;`

type Case = Readonly<{ name: string; declarations?: string; sql: string; expectedError?: RegExp; inspect?: (output: string) => void }>
const cases: readonly Case[] = [
  {
    name: 'disabled state has no transport and an application role cannot invoke it',
    expectedError: /FATAL: +permission denied for schema jetnity_dev_import_scheduler/,
    sql: `
      PERFORM proof.tick('disabled');
      PERFORM proof.check_ok((SELECT count(*)=0 FROM net.http_request_queue),'disabled transport');
      SET LOCAL ROLE anon;
      PERFORM jetnity_dev_import_scheduler.tick_v1();`,
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
      PERFORM proof.check_ok(encode(extensions.hmac(concat_ws(E'\\n','jetnity-dev-import-response-v1','POST','${path}',
        '${golden.time}','2','resume','${golden.operation}','${golden.lease}','1','200','published','1'),
        '${key}','sha256'),'hex')='${goldenResponse}','response HMAC differs from Node');
      PERFORM proof.tick('awaiting_response');
      PERFORM proof.check_ok((SELECT count(*)=1 FROM net.http_request_queue),'duplicate outstanding dispatch');`,
    inspect(output) {
      const match = output.match(/JETNITY_SCHEDULER_REQUEST (\{[^\r\n]+\})/)
      assert.ok(match, 'native request evidence missing')
      const row = JSON.parse(match[1]) as { headers: Record<string, string>; body: string; url: string; time: string; operation: string; lease: string; timeout: number }
      const message = ['jetnity-dev-import-v1', 'POST', path, row.time, '2', 'start', row.operation, row.lease].join('\n')
      assert.equal(row.headers.Authorization, 'HMAC-SHA256 ' + createHmac('sha256', key).update(message, 'utf8').digest('hex'))
      assert.equal(row.headers['X-Jetnity-Dev-Import-Time'], row.time)
      assert.equal(row.headers.Cookie, previewCookie, 'only the separate preview credential enters transport')
      assert.equal(row.url, 'https://jetnity-app-git-feat-official-truth-hum-6fe0cd-jetnity-e1b93c82.vercel.app' + path)
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
        FROM jetnity_dev_import_scheduler.state_v1 s CROSS JOIN jetnity_dev_import_scheduler.cycles_v1 c),'publication cadence');
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
      PERFORM proof.check_ok((SELECT state='active' AND published=0 FROM jetnity_dev_import_scheduler.cycles_v1),'forgery published');`,
  },
  {
    name: 'complete zero retains the same original work request',
    declarations: 'original record;',
    sql: `
      PERFORM proof.arm(); PERFORM proof.tick('dispatched_start'); PERFORM proof.respond('queued'); PERFORM proof.tick('dispatched_resume');
      SELECT * INTO original FROM proof.pending ORDER BY id DESC LIMIT 1;
      PERFORM proof.respond('complete'); PERFORM proof.tick('dispatched_resume');
      PERFORM proof.check_ok((SELECT operation_id=original.operation_id AND lease_id=original.lease_id FROM proof.pending ORDER BY id DESC LIMIT 1),'complete zero rotated IDs');
      PERFORM proof.check_ok((SELECT count(*)=1 FROM jetnity_dev_import_scheduler.cycles_v1),'complete zero created new cycle');`,
  },
  {
    name: 'lost HTTP outcome retains original phase and IDs; late prior ACK does not confirm the new dispatch',
    declarations: 'original record; latest record;',
    sql: `
      PERFORM proof.arm(); PERFORM proof.tick('dispatched_start');
      SELECT * INTO original FROM proof.pending ORDER BY id DESC LIMIT 1;
      UPDATE jetnity_dev_import_scheduler.dispatches_v1 SET dispatched_at=clock_timestamp()-interval '91 seconds';
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
      UPDATE jetnity_dev_import_scheduler.dispatches_v1 SET dispatched_at=clock_timestamp()-interval '91 seconds';
      PERFORM proof.tick('dispatched_start');
      SELECT * INTO latest FROM proof.pending ORDER BY id DESC LIMIT 1;
      PERFORM proof.respond('queued',0,true,200,original.id);
      INSERT INTO net._http_response SELECT latest.net_request_id,status_code,content_type,headers,content,timed_out,error_msg,created
        FROM net._http_response WHERE id=original.net_request_id;
      -- Two local invocations can share one millisecond; make the private dispatch stamp distinct explicitly.
      UPDATE jetnity_dev_import_scheduler.dispatches_v1 SET signed_at_ms=(original.signed_at_ms::bigint+1)::text WHERE id=latest.id;
      PERFORM proof.tick('dispatched_start');`,
  },
  {
    name: 'expired signed response is not current publication evidence',
    sql: `
      PERFORM proof.arm(); PERFORM proof.tick('dispatched_start'); PERFORM proof.respond('queued'); PERFORM proof.tick('dispatched_resume');
      PERFORM proof.respond('published',1);
      UPDATE jetnity_dev_import_scheduler.dispatches_v1 SET dispatched_at=clock_timestamp()-interval '151 seconds' WHERE processed_at IS NULL;
      PERFORM proof.tick('dispatched_resume');`,
  },
  {
    name: 'eight unknown outcomes park without replacement cycle or IDs',
    sql: `
      PERFORM proof.arm(); PERFORM proof.tick('dispatched_start');
      FOR i IN 1..7 LOOP PERFORM proof.respond('unavailable',0,true,503); PERFORM proof.tick('dispatched_start'); END LOOP;
      PERFORM proof.respond('unavailable',0,true,503); PERFORM proof.tick('operator_review_required');
      PERFORM proof.tick('operator_review_required');
      PERFORM proof.check_ok((SELECT count(*)=1 FROM jetnity_dev_import_scheduler.cycles_v1),'retry budget created another cycle');
      PERFORM proof.check_ok((SELECT count(*)=8 FROM jetnity_dev_import_scheduler.dispatches_v1),'retry budget exceeded');`,
  },
  {
    name: 'signed revoked method parks the same cycle',
    sql: `
      PERFORM proof.arm(); PERFORM proof.tick('dispatched_start'); PERFORM proof.respond('not_approved',0,true,409);
      PERFORM proof.tick('operator_review_required');
      PERFORM proof.check_ok((SELECT count(*)=1 AND bool_and(state='blocked') FROM jetnity_dev_import_scheduler.cycles_v1),'revoked method not blocked');`,
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
    name: 'missing or expired preview access sends nothing and retains any original pending request',
    declarations: 'original record;',
    sql: `
      PERFORM proof.arm();
      UPDATE jetnity_dev_import_scheduler.state_v1 SET transport_expires_at=NULL;
      PERFORM proof.tick('transport_access_expired');
      UPDATE jetnity_dev_import_scheduler.state_v1 SET transport_expires_at=clock_timestamp()-interval '1 second';
      PERFORM proof.tick('transport_access_expired');
      PERFORM proof.check_ok((SELECT count(*)=0 FROM net.http_request_queue),'expired preview admitted transport');
      PERFORM proof.arm(); PERFORM proof.tick('dispatched_start');
      SELECT * INTO original FROM proof.pending ORDER BY id DESC LIMIT 1;
      UPDATE jetnity_dev_import_scheduler.state_v1 SET transport_expires_at=clock_timestamp()-interval '1 second';
      PERFORM proof.tick('transport_access_expired');
      PERFORM proof.check_ok((SELECT count(*)=1 FROM net.http_request_queue),'expired preview sent another dispatch');
      PERFORM proof.check_ok((SELECT operation_id=original.operation_id AND lease_id=original.lease_id AND state='active'
        FROM jetnity_dev_import_scheduler.cycles_v1),'expired preview discarded original request');`,
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
    name: 'a preview credential containing an application cookie is refused before dispatch',
    expectedError: /FATAL: +scheduler preview admission unavailable/,
    sql: `
      PERFORM proof.arm();
      UPDATE vault.decrypted_secrets SET decrypted_secret='${previewCookie}; sb-auth=synthetic-app-session'
        WHERE name='jetnity_dev_import_preview_cookie_v1';
      PERFORM jetnity_dev_import_scheduler.tick_v1();`,
  },
  {
    name: 'stored original request fields cannot be relabelled',
    expectedError: /FATAL: +original scheduler request is immutable/,
    sql: `
      PERFORM proof.arm(); PERFORM proof.tick('dispatched_start');
      UPDATE jetnity_dev_import_scheduler.cycles_v1 SET operation_id='op3_'||repeat('f',32);`,
  },
]

test('Dev scheduler native PG17 state and authenticated transport, without sockets', {
  timeout: 120000,
  skip: !findLocalPgBins() && process.env.CI !== 'true' && process.env.GITHUB_ACTIONS !== 'true'
    ? 'NOT VERIFIED locally: PostgreSQL binaries absent; required in hosted PG17 CI' : false,
}, async t => {
  assertLocalProofEnvironment()
  const bins = findLocalPgBins()
  assert.ok(bins, 'PostgreSQL 17 binaries are required')
  const version = execFileSync(bins.postgres, ['--version'], { encoding: 'utf8', timeout: 5000 })
  assert.match(version, /PostgreSQL\) 17\./)
  const root = mkdtempSync(join(tmpdir(), 'jetnity-dev-scheduler-native-'))
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
    run(fixture + "\nBEGIN; SET LOCAL jetnity.dev_import_target='dev:yfvbxvijcorffwxbxahl:refresh1';\n" + core + '\nCOMMIT;\n' + helpers)
    for (const [index, item] of cases.entries()) {
      await t.test(item.name, () => {
        const marker = 'JETNITY_SCHEDULER_PROOF_' + index
        const output = run(`BEGIN;\nDO $case$\n${item.declarations ? 'DECLARE ' + item.declarations : ''}\nBEGIN\n${item.sql}\nEND $case$;\nSELECT '${marker}';\nROLLBACK;`, item.expectedError)
        if (!item.expectedError) assert.ok(output.includes(marker), 'native completion marker missing')
        item.inspect?.(output)
      })
    }
    run(activationProviders + "\nBEGIN; SET LOCAL jetnity.dev_import_target='dev:yfvbxvijcorffwxbxahl:refresh1';\n" + renewal + '\nCOMMIT;')
    await t.test('original unaliased job variable reproduces 42702 and rolls back all activation effects', () => {
      // Negative control retains the old ambiguous whole-row identifier.
      const old = activation.replaceAll('scheduled_job_id', 'job')
        .replace('FROM cron.job AS scheduled', 'FROM cron.job').replaceAll('scheduled.', '')
      run(activationPrefix() + old, /FATAL: +42702: +column reference "job" is ambiguous/)
      run(activationRollbackReadback)
    })
    await t.test('both complete activation files preserve the one cron identity and roll back without dispatch', () => {
      assert.match(renewalActivation, /^BEGIN;$/m)
      const combined = withoutCommit(activation) + `
        CREATE TEMP TABLE activation_identity ON COMMIT DROP AS SELECT jobid FROM cron.job;
        DO $first$ BEGIN
          PERFORM proof.check_ok((SELECT count(*)=1 AND bool_and(command='SELECT jetnity_dev_import_scheduler.tick_v1();')
            FROM cron.job),'initial exact tick cron');
        END $first$;\n` + withoutCommit(renewalActivation).replace(/^BEGIN;$/m, '') + `
        DO $final$ BEGIN
          PERFORM proof.check_ok((SELECT count(*)=1 AND bool_and(j.jobid=i.jobid
            AND j.jobname='jetnity-ch-de-dev-import-v1' AND j.schedule='* * * * *'
            AND j.command='SELECT jetnity_dev_import_scheduler.run_v1();'
            AND j.username='postgres' AND j.database='postgres' AND j.active)
            FROM cron.job j CROSS JOIN activation_identity i),'exact one unchanged cron identity');
          PERFORM proof.check_ok((SELECT enabled AND status='armed' AND next_due_at<=clock_timestamp()
            AND transport_expires_at=to_timestamp(current_setting('jetnity.dev_import_preview_expires')::bigint)
            FROM jetnity_dev_import_scheduler.state_v1),'enabled state or exact use horizon');
          PERFORM proof.check_ok((SELECT count(*)=0 FROM jetnity_dev_import_scheduler.cycles_v1),'activation started source work');
          PERFORM proof.check_ok((SELECT count(*)=0 FROM jetnity_dev_import_scheduler.dispatches_v1),'activation created dispatch');
          PERFORM proof.check_ok((SELECT count(*)=0 FROM net.http_request_queue),'activation sent HTTP');
        END $final$;
        SELECT 'JETNITY_COMPLETE_ACTIVATION_ROLLBACK_PROOF';
        ROLLBACK;`
      const output = run(activationPrefix() + combined)
      assert.ok(output.includes('JETNITY_COMPLETE_ACTIVATION_ROLLBACK_PROOF'))
      run(activationRollbackReadback)
    })
    await t.test('complete activation still rejects another target and a short preview use horizon', () => {
      for (const prefix of [activationPrefix('production:not-dev'), activationPrefix(undefined, 1800)]) {
        run(prefix + activation, /FATAL: +P0001: +exact Dev scheduler prerequisites required/)
        run(activationRollbackReadback)
      }
    })
  } finally {
    // No server process is started. Every synchronous backend has exited before
    // cleanup; the generated cluster is solely owned by this proof.
    rmSync(root, { recursive: true, force: true })
  }
})
