// Actual PG17 SQL; Vault and net are explicitly synthetic local providers.
// These tests check candidate admission, not a Vercel JWT signature or live access.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { assertLocalProofEnvironment, findLocalPgBins } from '../../scripts/db/official-truth-integrated-pilot-1/local-cluster'

import { runAtBmeiaAssetsNativePg17 } from '../../scripts/db/official-truth-at-bmeia-assets-dev-1/native'
import { runAtSourceV3NativePg17 } from '../../scripts/db/official-truth-at-source-v3/native'

const directory = '../../scripts/db/official-truth-v3-dev-import-schedule-1/'
const core = readFileSync(new URL(directory + 'core.sql', import.meta.url), 'utf8')
const renewal = readFileSync(new URL(directory + 'preview-renewal.sql', import.meta.url), 'utf8')
const share = 'a'.repeat(32)
const oldCookie = '_vercel_jwt=e30.eyJzeW50aGV0aWMiOnRydWV9.c3ludGhldGlj'
const host = 'jetnity-app-git-feat-official-truth-hum-6fe0cd-jetnity-e1b93c82.vercel.app'
const fixture = `
CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE ROLE supabase_read_only_user;
CREATE SCHEMA vault;
CREATE TABLE vault.secrets(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text UNIQUE NOT NULL,decrypted_secret text);
CREATE VIEW vault.decrypted_secrets AS SELECT id,name,decrypted_secret FROM vault.secrets;
INSERT INTO vault.secrets(name,decrypted_secret) VALUES
 ('jetnity_dev_import_cron_v1','synthetic-dev-scheduler-key-not-a-live-secret-123456789'),
 ('jetnity_dev_import_preview_share_v1','${share}'),
 ('jetnity_dev_import_preview_cookie_v1','${oldCookie}');
CREATE FUNCTION vault.update_secret(secret_id uuid,new_secret text) RETURNS void LANGUAGE sql AS $$
 UPDATE vault.secrets SET decrypted_secret=new_secret WHERE id=secret_id $$;
CREATE SCHEMA official_v3_jobs_private;
CREATE TABLE official_v3_jobs_private.subjects_v1(job_key text,kind text,start_count integer,operation_count integer);
INSERT INTO official_v3_jobs_private.subjects_v1 VALUES
 ('research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513','rule_research',4,13);
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
CREATE FUNCTION net.http_get(url text,params jsonb DEFAULT '{}'::jsonb,headers jsonb DEFAULT '{}'::jsonb,
 timeout_milliseconds integer DEFAULT 5000) RETURNS bigint LANGUAGE sql AS $$
 INSERT INTO net.http_request_queue(method,url,headers,timeout_milliseconds) VALUES('GET',url,headers,timeout_milliseconds) RETURNING id $$;
CREATE FUNCTION net.http_post(url text,body jsonb DEFAULT '{}'::jsonb,params jsonb DEFAULT '{}'::jsonb,
 headers jsonb DEFAULT '{}'::jsonb,timeout_milliseconds integer DEFAULT 5000) RETURNS bigint LANGUAGE sql AS $$
 INSERT INTO net.http_request_queue(method,url,headers,body,timeout_milliseconds)
 VALUES('POST',url,headers,convert_to(body::text,'UTF8'),timeout_milliseconds) RETURNING id $$;
`
const helpers = `
CREATE SCHEMA proof;
CREATE FUNCTION proof.check_ok(ok boolean,message text) RETURNS void LANGUAGE plpgsql AS $$
 BEGIN IF ok IS NOT TRUE THEN RAISE EXCEPTION 'native renewal assertion: %',message; END IF; END $$;
CREATE FUNCTION proof.arm() RETURNS void LANGUAGE sql AS $$
 UPDATE jetnity_dev_import_scheduler.state_v1 SET enabled=true,next_due_at=clock_timestamp(),
 transport_expires_at=clock_timestamp()+interval '2 days' $$;
CREATE FUNCTION proof.renew(expected text) RETURNS void LANGUAGE plpgsql AS $$
 DECLARE actual text; BEGIN actual:=jetnity_dev_import_scheduler.maintain_preview_v1();
 PERFORM proof.check_ok(actual=expected,concat('renew expected ',expected,' got ',actual)); END $$;
CREATE FUNCTION proof.respond(overrides jsonb DEFAULT '{}'::jsonb,header_override text DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $$
 DECLARE p record; claims jsonb; token text; now_seconds bigint:=floor(extract(epoch from clock_timestamp()));
 BEGIN
 SELECT * INTO STRICT p FROM jetnity_dev_import_scheduler.preview_dispatches_v1 WHERE processed_at IS NULL;
 claims:=jsonb_build_object('aud','${host}','sub','protection-bypass-url','bypass','${share}',
 'iat',now_seconds,'exp',now_seconds+604800)||overrides;
 token:='e30.'||rtrim(translate(replace(encode(convert_to(claims::text,'UTF8'),'base64'),E'\\n',''),'+/','-_'),'=')||'.c3ludGhldGlj';
 INSERT INTO net._http_response(id,status_code,headers,timed_out) VALUES(p.net_request_id,200,
 jsonb_build_object('set-cookie',coalesce(header_override,'_vercel_jwt='||token||'; Max-Age=604800; Path=/; Secure; HttpOnly; SameSite=Lax')),false);
 END $$;
CREATE FUNCTION proof.old_credential() RETURNS void LANGUAGE plpgsql AS $$
 BEGIN
 PERFORM proof.check_ok((SELECT decrypted_secret='${oldCookie}' FROM vault.secrets WHERE name='jetnity_dev_import_preview_cookie_v1'),'old cookie was replaced');
 PERFORM proof.check_ok((SELECT transport_expires_at<clock_timestamp()+interval '3 days' FROM jetnity_dev_import_scheduler.state_v1),'old expiry was replaced');
 END $$;
`

type Case = { name: string; sql: string; declarations?: string; expectedError?: RegExp }
const cases: Case[] = [
  { name: 'disabled scheduler never requests a credential', sql: `
    PERFORM proof.renew('disabled'); PERFORM proof.check_ok((SELECT count(*)=0 FROM net.http_request_queue),'disabled GET');` },
  { name: 'renewal uses only the fixed Dev alias and never the signing key', sql: `
    PERFORM proof.arm(); PERFORM proof.renew('preview_refresh_dispatched');
    PERFORM proof.check_ok((SELECT count(*)=1 AND bool_and(method='GET' AND url='https://${host}/?_vercel_share=${share}'
      AND headers='{}'::jsonb AND body IS NULL AND timeout_milliseconds=10000) FROM net.http_request_queue),'GET authority or target');
    PERFORM proof.renew('awaiting_preview_response'); PERFORM proof.check_ok((SELECT count(*)=1 FROM net.http_request_queue),'duplicate GET');` },
  { name: 'bounded candidate renews expiry and cadence without changing original source IDs or quota', declarations: 'original record;', sql: `
    PERFORM proof.arm(); PERFORM proof.check_ok(jetnity_dev_import_scheduler.tick_v1()='dispatched_start','initial source dispatch');
    SELECT * INTO STRICT original FROM jetnity_dev_import_scheduler.cycles_v1;
    PERFORM proof.renew('preview_refresh_dispatched'); PERFORM proof.respond(); PERFORM proof.renew('cookie_candidate_saved');
    PERFORM proof.check_ok((SELECT transport_expires_at>clock_timestamp()+interval '6 days' FROM jetnity_dev_import_scheduler.state_v1),'candidate expiry');
    PERFORM proof.check_ok((SELECT attempts=0 AND next_refresh_at>clock_timestamp()+interval '5 days' AND length(candidate_digest)=64
      FROM jetnity_dev_import_scheduler.preview_access_v1),'renewal cadence');
    PERFORM proof.check_ok((SELECT decrypted_secret<>'${oldCookie}' AND decrypted_secret ~ '^_vercel_jwt=[A-Za-z0-9_.-]+$'
      FROM vault.secrets WHERE name='jetnity_dev_import_preview_cookie_v1'),'canonical saved cookie');
    PERFORM proof.check_ok((SELECT operation_id=original.operation_id AND lease_id=original.lease_id AND state='active'
      FROM jetnity_dev_import_scheduler.cycles_v1),'source IDs or success changed');
    PERFORM proof.check_ok((SELECT start_count=4 AND operation_count=13 FROM official_v3_jobs_private.subjects_v1),'quota changed');
    PERFORM proof.renew('preview_not_due');` },
  { name: 'missing share configuration keeps the valid cookie and still dispatches normal source work', sql: `
    PERFORM proof.arm(); DELETE FROM vault.secrets WHERE name='jetnity_dev_import_preview_share_v1';
    PERFORM proof.renew('preview_configuration_unavailable'); PERFORM proof.old_credential();
    PERFORM proof.check_ok(jetnity_dev_import_scheduler.run_v1()='dispatched_start','configuration error cancelled source');` },
  { name: 'observed permanent-link JWT without exp gets a local seven-day use horizon', sql: `
    PERFORM proof.arm(); PERFORM proof.renew('preview_refresh_dispatched');
    PERFORM proof.respond();
    UPDATE net._http_response SET headers=jsonb_build_object('set-cookie','_vercel_jwt=e30.'||
      rtrim(translate(replace(encode(convert_to(jsonb_build_object('aud','${host}','sub','protection-bypass-url',
      'bypass','${share}','iat',floor(extract(epoch from clock_timestamp())))::text,'UTF8'),'base64'),E'\\n',''),'+/','-_'),'=')||'.c3ludGhldGlj; Secure');
    PERFORM proof.renew('cookie_candidate_saved');
    PERFORM proof.check_ok((SELECT transport_expires_at>clock_timestamp()+interval '6 days'
      AND transport_expires_at<=clock_timestamp()+interval '7 days' FROM jetnity_dev_import_scheduler.state_v1),'unbounded permanent-cookie use');` },
  { name: 'provider error rolls renewal back but retains the normal import gates', sql: `
    PERFORM proof.arm(); PERFORM proof.renew('preview_refresh_dispatched'); PERFORM proof.respond();
    ALTER TABLE vault.secrets ADD CONSTRAINT provider_unavailable CHECK(name<>'jetnity_dev_import_preview_cookie_v1' OR decrypted_secret='${oldCookie}');
    PERFORM proof.check_ok(jetnity_dev_import_scheduler.run_v1()='dispatched_start','provider error cancelled valid source');
    PERFORM proof.old_credential();
    PERFORM proof.check_ok((SELECT status='preview_renewal_error' FROM jetnity_dev_import_scheduler.preview_access_v1),'private error status');
    PERFORM proof.check_ok((SELECT count(*)=1 FROM jetnity_dev_import_scheduler.preview_dispatches_v1 WHERE processed_at IS NULL),'partial renewal committed');` },
  { name: 'a response for a different request does not satisfy the pending ledger', sql: `
    PERFORM proof.arm(); PERFORM proof.renew('preview_refresh_dispatched'); PERFORM proof.respond();
    UPDATE net._http_response SET id=id+100; PERFORM proof.renew('awaiting_preview_response'); PERFORM proof.old_credential();` },
  { name: 'a cancelled credential provider operation does not cancel a still-authorized import', sql: `
    PERFORM proof.arm(); PERFORM proof.renew('preview_refresh_dispatched'); PERFORM proof.respond();
    EXECUTE 'CREATE OR REPLACE FUNCTION vault.update_secret(secret_id uuid,new_secret text) RETURNS void LANGUAGE plpgsql AS $f$
      BEGIN RAISE EXCEPTION USING ERRCODE=''57014'', MESSAGE=''synthetic provider cancellation''; END $f$';
    PERFORM proof.check_ok(jetnity_dev_import_scheduler.run_v1()='dispatched_start','renewal cancellation cancelled source');
    PERFORM proof.old_credential();` },
  { name: 'unanswered response is bounded and eight failed requests require operator review', sql: `
    PERFORM proof.arm(); PERFORM proof.renew('preview_refresh_dispatched');
    FOR i IN 1..8 LOOP
      UPDATE jetnity_dev_import_scheduler.preview_dispatches_v1 SET dispatched_at=clock_timestamp()-interval '91 seconds' WHERE processed_at IS NULL;
      IF i<8 THEN
        PERFORM proof.renew('preview_not_due');
        UPDATE jetnity_dev_import_scheduler.preview_access_v1 SET next_refresh_at=clock_timestamp()-interval '1 second';
        PERFORM proof.renew('preview_refresh_dispatched');
      ELSE PERFORM proof.renew('operator_review_required'); END IF;
    END LOOP;
    PERFORM proof.renew('operator_review_required'); PERFORM proof.old_credential();
    PERFORM proof.check_ok((SELECT count(*)=8 FROM net.http_request_queue),'unbounded retries');` },
  { name: 'application role cannot renew or run the scheduler', expectedError: /FATAL: +permission denied for schema jetnity_dev_import_scheduler/, sql: `
    SET LOCAL ROLE authenticated; PERFORM jetnity_dev_import_scheduler.run_v1();` },
]

const invalidClaims: [string, string][] = [
  ['explicit null expiry', `jsonb_build_object('exp',NULL)`],
  ['wrong audience', `jsonb_build_object('aud','jetnity.com')`],
  ['wrong purpose', `jsonb_build_object('sub','owner-session')`],
  ['wrong alias link', `jsonb_build_object('bypass',repeat('b',32))`],
  ['non-numeric issue time', `jsonb_build_object('iat','1794690000')`],
  ['future issue time', `jsonb_build_object('iat',floor(extract(epoch from clock_timestamp()))+60)`],
  ['old issue time', `jsonb_build_object('iat',floor(extract(epoch from clock_timestamp()))-60)`],
  ['expired candidate', `jsonb_build_object('exp',floor(extract(epoch from clock_timestamp()))-1)`],
  ['short remaining life', `jsonb_build_object('exp',floor(extract(epoch from clock_timestamp()))+3600)`],
  ['older than current credential', `jsonb_build_object('exp',floor(extract(epoch from clock_timestamp()))+129600)`],
  ['unbounded expiry', `jsonb_build_object('exp',floor(extract(epoch from clock_timestamp()))+604801)`],
  ['fractional expiry', `jsonb_build_object('exp',extract(epoch from clock_timestamp())+604800.25)`],
]
for (const [name, expression] of invalidClaims) cases.push({ name: name + ' preserves the existing credential', sql: `
  PERFORM proof.arm(); PERFORM proof.renew('preview_refresh_dispatched'); PERFORM proof.respond(${expression});
  PERFORM proof.renew('preview_not_due'); PERFORM proof.old_credential();` })
const invalidResponses: [string, string][] = [
  ['malformed JSON payload', `PERFORM proof.respond('{}','_vercel_jwt=e30.eA.c3ludGhldGlj; Secure');`],
  ['non-UTF8 payload', `PERFORM proof.respond('{}','_vercel_jwt=e30._w.c3ludGhldGlj; Secure');`],
  ['multiple Set-Cookie fields', `PERFORM proof.respond(); UPDATE net._http_response SET headers=headers||jsonb_build_object('Set-Cookie',headers->>'set-cookie');`],
  ['newline header', `PERFORM proof.respond(); UPDATE net._http_response SET headers=jsonb_build_object('set-cookie',(headers->>'set-cookie')||E'\\r\\nX: y');`],
  ['oversized cookie', `PERFORM proof.respond('{}','_vercel_jwt=e30.'||repeat('a',2048)||'.c3ludGhldGlj; Secure');`],
  ['transport timeout', `PERFORM proof.respond(); UPDATE net._http_response SET timed_out=true;`],
  ['provider error', `PERFORM proof.respond(); UPDATE net._http_response SET error_msg='synthetic provider failure';`],
  ['HTTP failure', `PERFORM proof.respond(); UPDATE net._http_response SET status_code=403;`],
  ['response older than allowed', `PERFORM proof.respond(); UPDATE jetnity_dev_import_scheduler.preview_dispatches_v1 SET dispatched_at=clock_timestamp()-interval '151 seconds';`],
  ['clock moved backwards', `PERFORM proof.respond(); UPDATE jetnity_dev_import_scheduler.preview_dispatches_v1 SET dispatched_at=clock_timestamp()+interval '1 minute';`],
]
for (const [name, statement] of invalidResponses) cases.push({ name: name + ' cannot replace a valid credential', sql: `
  PERFORM proof.arm(); PERFORM proof.renew('preview_refresh_dispatched'); ${statement}
  PERFORM proof.renew('preview_not_due'); PERFORM proof.old_credential();` })

test('Dev preview renewal — actual PostgreSQL 17 and isolated provider fixtures', async t => {
  assertLocalProofEnvironment()
  const bins = findLocalPgBins()
  assert.ok(bins, 'PostgreSQL 17 binaries are required')
  assert.match(execFileSync(bins.postgres, ['--version'], { encoding: 'utf8', timeout: 5000 }), /PostgreSQL\) 17\./)
  const root = mkdtempSync(join(tmpdir(), 'jetnity-preview-renewal-native-'))
  const data = join(root, 'data')
  const env = { ...process.env }
  for (const name of Object.keys(env)) if (/^(PG|PSQL)/.test(name)) delete env[name]
  const run = (sql: string, expectedError?: RegExp): string => {
    // Keep SQL exception blocks operational. Any unhandled error is rejected
    // from stderr even if a later SQL statement emits its completion marker.
    const result = spawnSync(bins.postgres, ['--single', '-D', data, '-j', '-c', 'exit_on_error=' + (expectedError ? 'on' : 'off'),
      '-c', 'log_min_error_statement=panic', '-c', 'statement_timeout=25000', 'postgres'],
    { input: sql + '\n\n', encoding: 'utf8', env, timeout: 30000, maxBuffer: 4 * 1024 * 1024 })
    if (expectedError && !result.error) {
      assert.equal(result.status, 1)
      assert.match(result.stderr, expectedError)
    } else {
      assert.ifError(result.error)
      assert.equal(result.status, 0, result.stderr)
      assert.doesNotMatch(result.stderr, /(?:ERROR|FATAL|PANIC):/, 'unhandled native SQL error: ' + result.stderr)
    }
    return result.stdout + '\n' + result.stderr
  }
  try {
    execFileSync(bins.initdb, ['-D', data, '--no-locale', '--encoding=UTF8', '--auth-local=reject', '--auth-host=reject',
      '--username', 'postgres', '--no-sync'], { encoding: 'utf8', env, stdio: 'pipe', timeout: 60000 })
    run(fixture + "\nBEGIN; SET LOCAL jetnity.dev_import_target='dev:yfvbxvijcorffwxbxahl:refresh1';\n" + core + '\n' + renewal + '\nCOMMIT;\n' + helpers)
    for (const [index, item] of cases.entries()) await t.test(item.name, () => {
      const marker = 'JETNITY_RENEWAL_PROOF_' + index
      const output = run(`BEGIN;\nDO $case$\n${item.declarations ? 'DECLARE ' + item.declarations : ''}\nBEGIN\n${item.sql}\nEND $case$;\nSELECT '${marker}';\nROLLBACK;`, item.expectedError)
      if (!item.expectedError) assert.ok(output.includes(marker), 'native completion marker missing')
    })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

// Dedicated BMEIA PG17 proof shares the existing mandatory hosted PG17 job.
// Do not change the AA-pinned test selector or weaken its actual-byte inventory.
test('BMEIA theme-only Dev: native PG17, negative cases and rollback', { timeout: 90_000 }, runAtBmeiaAssetsNativePg17)

// Exact production-source comparator runs inside our owned local PG17 fixture.
// Source owner approval remains unavailable without real Owner/AAL2 witness.
test('CH→AT Source V3 native PG17 bounded assets, strict negative HTML and rollback', {timeout:90_000}, runAtSourceV3NativePg17)
