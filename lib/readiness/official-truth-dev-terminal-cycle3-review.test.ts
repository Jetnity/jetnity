// Owned PostgreSQL17 only. Full original HMA/S1/HRS/HM04/BG1/Quota checks.
// Prehistory and external deployment/UI acknowledgements are explicitly local
// fixtures; no hosted source/publication or remote deployment is fabricated.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { OwnedPersistentProof } from '../../scripts/db/official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { json, literal, readSql } from '../../scripts/db/official-truth-v3-rolling-jobs-quota-1/local-proof'
import { compileDevTerminalCycle3Review, REVIEW, evidenceQuery, originalEvidence } from '../../scripts/db/official-truth-v3-dev-terminal-cycle3-review-1/build.mjs'
import { buildCycle3ReviewFixture } from '../../scripts/db/official-truth-v3-dev-terminal-cycle3-review-1/history-fixture'
import { compileDevTerminalReview as compilePriorReview, originalEvidence as priorEvidence, evidenceQuery as priorEvidenceQuery } from '../../scripts/db/official-truth-v3-dev-terminal-cycle-review-1/build.mjs'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from './official-truth-product-v3/source/aa-ch-de-reviewed-program'
import { hrs1Canonical } from './official-truth-product-v3/result/contract'

const binding = program.binding
const creator = 'SET SESSION AUTHORIZATION postgres; SET search_path=pg_catalog;'
const id = (kind: string, value: string) => kind + '_' + createHash('sha256').update('review-native:' + value).digest('hex').slice(0, 32)
const uid = (n: number) => n.toString(16).padStart(8, '0') + '-1111-4111-8111-' + n.toString(16).padStart(12, '0')
const compiled = compileDevTerminalCycle3Review()
const original = readFileSync(new URL('../../scripts/db/official-truth-v3-dev-terminal-cycle3-review-1/review-cycle3.sql', import.meta.url), 'utf8')
assert.equal(original, compiled.migration, 'complete committed migration equals reviewed compiler output')
const priorCompiled = compilePriorReview()
const priorSql = readSql('official-truth-v3-dev-terminal-cycle-review-1/review-cycle2.sql')
assert.equal(priorSql, priorCompiled.migration, 'the already applied Cycle2 SQL is still byte-identical')
const readbackSql = readSql('official-truth-v3-dev-terminal-cycle3-review-1/readback.sql')
assert.equal(readbackSql, compiled.readback, 'the complete readback binds the same compiled source and evidence')
const readbackExpression = readbackSql.slice(readbackSql.indexOf('SELECT jsonb_build_object(') + 'SELECT '.length).trim().replace(/;$/, '')
const nested = original.replace(/^BEGIN;$/m, '').replace(/COMMIT;\s*$/, '')
const ack = creator + `
SET jetnity.dev_terminal_cycle3_review_target=${literal(REVIEW.target)};
SET jetnity.dev_terminal_cycle3_review_ack=${literal(REVIEW.ack)};
SET jetnity.dev_terminal_cycle3_review_commit='1111111111111111111111111111111111111111';
SET jetnity.dev_terminal_cycle3_review_deployment='dpl_OWNEDLOCALFIXTUREONLY123456';
SET jetnity.dev_terminal_cycle3_review_ci_run='1';
SET jetnity.dev_terminal_cycle3_review_ui_version='6';`
const oldRowsComplete = `(SELECT jsonb_build_object(
 'prior_cycle2_review',(SELECT to_jsonb(r) FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1 r),
 'roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r),
 'state',(SELECT to_jsonb(s) FROM jetnity_dev_import_scheduler.state_v1 s),
 'cycles',(SELECT jsonb_agg(to_jsonb(c) ORDER BY id) FROM jetnity_dev_import_scheduler.cycles_v1 c),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d) ORDER BY id) FROM jetnity_dev_import_scheduler.dispatches_v1 d),
 'subject',(SELECT to_jsonb(s) FROM official_v3_jobs_private.subjects_v1 s),
 'ops',(SELECT jsonb_agg(to_jsonb(o) ORDER BY operation_id) FROM official_v3_jobs_private.queue_operations_v1 o),
 'starts',(SELECT count(*) FROM official_v3_jobs_private.execution_starts_v1),
 'results',(SELECT count(*) FROM official_v3_jobs_private.execution_results_v1),
 'dispositions',(SELECT count(*) FROM official_v3_jobs_private.execution_dispositions_v1),
 'guard',(SELECT to_jsonb(g) FROM official_v3_guard_private.state_v1 g),
 'baseline',(SELECT to_jsonb(b) FROM official_v3_guard_private.rolling_quota_baseline_v1 b),
 'requests',(SELECT count(*) FROM net.http_request_queue)))`
// Preserve every complete old value. Only the digest crosses the single-user
// diagnostic pipe; repeatedly emitting its nearly 1MB JSON line is unnecessary
// and can corrupt that test transport. The migration also checks every table.
const oldRows = `to_jsonb(encode(sha256(convert_to((${oldRowsComplete})::text,'UTF8')),'hex'))`

async function baseSetup(proof: OwnedPersistentProof) {
  await proof.run("CREATE ROLE supabase_read_only_user LOGIN NOINHERIT NOSUPERUSER BYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;\n"
    + readSql('official-truth-v3-composed-dev-1/observed-auth-profile-fixture.sql')
    + '\nGRANT pg_read_all_data TO postgres WITH ADMIN TRUE, INHERIT TRUE, SET TRUE;\n'
    + [1, 2, 3, 8].map(n => `INSERT INTO auth.users(id,email) VALUES(${literal(uid(n))}::uuid,${literal('quota-' + n + '@example.invalid')});
      INSERT INTO auth.sessions(id,user_id,aal) VALUES(${literal(uid(n + 200))}::uuid,${literal(uid(n))}::uuid,${literal(n === 3 ? 'aal1' : 'aal2')}::auth.aal_level);`).join('\n')
    + '\n' + creator + '\n' + [[1, 'owner'], [2, 'moderator'], [3, 'owner']].map(([n, role]) =>
      `INSERT INTO public.profiles(id,user_id,role,status) VALUES(${literal(uid(Number(n) + 100))}::uuid,${literal(uid(Number(n)))}::uuid,${literal(String(role))},'active');`).join('\n'), 'local auth/profile fixture');
  await proof.run(creator + '\n' + readSql('profile-authority-integrity-1/install-candidate.sql')
    + '\n' + ['ot_m04_jobs', 'ot_m04_intake', 'ot_ma1_reader'].map(login =>
      `CREATE ROLE ${login} LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION; GRANT CONNECT ON DATABASE postgres TO ${login};`).join('\n')
    + '\n' + readSql('official-truth-v3-private-owner-guards-1/install-candidate.sql')
    + '\n' + readSql('official-truth-v3-hosted-method-authority-1/install-candidate.sql')
    + '\n' + readSql('official-truth-v3-hosted-intake-store-1/install-candidate.sql')
    + "\nSET jetnity.hmt1_target='dev:yfvbxvijcorffwxbxahl:postgres:E18B6824905662';\n"
    + readSql('official-truth-v3-human-method-transport-1/install-candidate.sql')
    + `\nSET jetnity.hrs1_install_context='root_selected_complete_binding_v1'; SET jetnity.hrs1_binding=${literal(hrs1Canonical(binding))};\n`
    + readSql('official-truth-v3-hosted-result-store-1/install-candidate.sql')
    + '\n' + readSql('official-truth-v3-hosted-durable-jobs-1/install-candidate.sql')
    + '\nGRANT ot_v3_jobs_caller TO ot_m04_jobs WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;'
    + '\nGRANT ot_v3_intake_caller TO ot_m04_intake WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;'
    + '\nGRANT ot_v3_method_reader TO ot_ma1_reader WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;', 'unmodified HMA/S1/HMT/HRS/HM04 stack');
}
function methodSeed(first: string) {
  const stage = id('maop1', 'old-stage'), approve = id('maop1', 'old-approve')
  const tuple = [literal(binding.methodId), String(binding.revision), literal(binding.methodDigest), literal(binding.packageDigest)].join(',')
  const staged = literal(new Date(Date.parse(first) - 2000).toISOString()) + '::timestamptz'
  const approved = literal(new Date(Date.parse(first) - 1000).toISOString()) + '::timestamptz'
  const after = json({ methodId: binding.methodId, revision: binding.revision, methodDigest: binding.methodDigest,
    packageDigest: binding.packageDigest, epoch: 1, status: 'approved', approvalMode: 'until_revoked', approvalUntil: null })
  return `INSERT INTO official_v3_method_private.revisions_v1 VALUES(${tuple},NULL,${staged},${literal(uid(1))}::uuid);
    INSERT INTO official_v3_method_private.operations_v1 VALUES(${literal(stage)},'stage',${literal(binding.methodId)},${binding.revision},
      official_v3_method_private.command_v1(${literal(stage)},'stage',${tuple},NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),NULL,NULL,${literal(uid(1))}::uuid,${staged});
    INSERT INTO official_v3_method_private.operations_v1 VALUES(${literal(approve)},'approve',${literal(binding.methodId)},${binding.revision},
      official_v3_method_private.command_v1(${literal(approve)},'approve',${tuple},NULL,NULL,NULL,NULL,0,NULL,'until_revoked',NULL),NULL,${after},${literal(uid(1))}::uuid,${approved});
    INSERT INTO official_v3_method_private.heads_v1 VALUES(${tuple},1,'approved','until_revoked',NULL,${approved},${literal(uid(1))}::uuid,${literal(approve)});`
}

const providerFixture = `
CREATE SCHEMA vault;
CREATE TABLE vault.decrypted_secrets(name text PRIMARY KEY,decrypted_secret text);
INSERT INTO vault.decrypted_secrets VALUES('jetnity_dev_import_cron_v1','owned_local_review_signing_fixture_123456789'),
 ('jetnity_dev_import_preview_cookie_v1','_vercel_jwt=bG9jYWw.Zml4dHVyZQ.b25seQ');
CREATE SCHEMA net;
CREATE TABLE net.http_request_queue(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,url text,body jsonb,headers jsonb);
CREATE TABLE net._http_response(id bigint,status_code integer,content_type text,headers jsonb,content text,timed_out boolean,error_msg text);
CREATE FUNCTION net.http_post(url text,body jsonb,params jsonb,headers jsonb,timeout_milliseconds integer) RETURNS bigint
LANGUAGE sql AS $$ INSERT INTO net.http_request_queue(url,body,headers) VALUES($1,$2,$4) RETURNING id $$;
`

async function installFixture(proof: OwnedPersistentProof, newerTerminal: boolean, customerSuccessor = false) {
  const fixture = await buildCycle3ReviewFixture({ newerTerminal })
  await proof.run('CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions;', 'real local pgcrypto provider')
  await baseSetup(proof)
  await proof.run('SET SESSION AUTHORIZATION ot_pilot_owner; BEGIN; SET LOCAL jetnity.local_terminal_cycle3_fixture=\'owned-local-pg17-only\';\n'
    + methodSeed(fixture.oldestAt) + '\n' + fixture.seedSql + '\nCOMMIT;', 'explicit coherent local historical fixture')
  for (const file of ['provider-migration-body.sql', 'status-rpc-provider-migration-body.sql',
    'recovery-provider-migration-body.sql', 'recovery-gap-provider-migration-body.sql']) {
    await proof.run(creator + '\nBEGIN;\n' + readSql('official-truth-v3-background-guard-1/' + file) + '\nCOMMIT;', 'real BG1 predecessor ' + file)
  }
  await proof.run(creator + '\nBEGIN;\n' + readSql('official-truth-v3-rolling-jobs-quota-1/provider-migration-body.sql') + '\nCOMMIT;', 'unchanged real rolling quota successor')
  await proof.run(creator + providerFixture + "BEGIN; SET LOCAL jetnity.dev_import_target='dev:yfvbxvijcorffwxbxahl:refresh1';\n"
    + readSql('official-truth-v3-dev-import-schedule-1/core.sql') + readSql('official-truth-v3-dev-import-schedule-1/preview-renewal.sql') + '\nCOMMIT;',
  'unchanged Dev sender plus synthetic local HTTP provider')
  if (customerSuccessor) {
    await proof.run(creator + 'BEGIN;\n' + readSql('official-truth-v3-customer-information-1/provider-migration-body.sql') + '\nCOMMIT;',
      'complete additive customer and history successor before the first genuine fixture audit')
    assert.deepEqual(await proof.value('public.official_v3_guard_alarm_status_v1()', creator), { schema: 1, status: 'unavailable' })
  }
  await proof.run(creator + 'SELECT official_v3_guard_private.audit_v1(); SELECT official_v3_guard_private.require_open_v1();',
    'normal complete first fixture audit, before either terminal review')
  const seedCycle = async (evidence: typeof originalEvidence) => {
    await proof.run(creator + `
      INSERT INTO jetnity_dev_import_scheduler.cycles_v1(id,created_at,operation_id,lease_id,phase,state,phase_attempts,last_status,finished_at,published)
      OVERRIDING SYSTEM VALUE SELECT id,created_at,operation_id,lease_id,phase,state,phase_attempts,last_status,finished_at,published
      FROM jsonb_populate_record(NULL::jetnity_dev_import_scheduler.cycles_v1,${json(evidence.cycle)});
      INSERT INTO jetnity_dev_import_scheduler.dispatches_v1(id,cycle_id,phase,signed_at_ms,dispatched_at,net_request_id,processed_at,http_status,outcome)
      OVERRIDING SYSTEM VALUE SELECT id,cycle_id,phase,signed_at_ms,dispatched_at,net_request_id,processed_at,http_status,outcome
      FROM jsonb_populate_recordset(NULL::jetnity_dev_import_scheduler.dispatches_v1,${json(evidence.dispatches)});`,
    'owned fixture: exact original private cycle/dispatch metadata, never a fake publication')
  }
  await seedCycle(priorEvidence)
  await proof.run(creator + `
    UPDATE jetnity_dev_import_scheduler.state_v1 SET enabled=true,transport_expires_at=clock_timestamp()+interval '1 hour',
      next_due_at=clock_timestamp()+interval '10 minutes',status='operator_review_required';
    SET jetnity.dev_terminal_review_target='dev:yfvbxvijcorffwxbxahl:terminal-cycle2-v1';
    SET jetnity.dev_terminal_review_ack='full-ci-ready-preview-and-normal-ui-verified-cycle2-v1';
    SET jetnity.dev_terminal_review_commit='1111111111111111111111111111111111111111';
    SET jetnity.dev_terminal_review_deployment='dpl_OWNEDLOCALFIXTUREONLY123456';
    SET jetnity.dev_terminal_review_ci_run='1'; SET jetnity.dev_terminal_review_ui_version='5';`
    + priorSql, 'the complete unchanged Cycle2 migration installs its original immutable review first')
  assert.equal(await proof.value(`to_jsonb(encode(sha256(convert_to((${priorEvidenceQuery})::text,'UTF8')),'hex'))`, creator), priorCompiled.evidenceHash)
  await seedCycle(originalEvidence)
  await proof.run(creator + `
    SELECT setval(pg_get_serial_sequence('jetnity_dev_import_scheduler.cycles_v1','id'),3,true);
    SELECT setval(pg_get_serial_sequence('jetnity_dev_import_scheduler.dispatches_v1','id'),20,true);
    SELECT official_v3_guard_private.assert_catalog_v1();`, 'complete original Cycle3 fixture, prior review retained')
  assert.equal(await proof.value(`to_jsonb(encode(sha256(convert_to((${evidenceQuery})::text,'UTF8')),'hex'))`, creator), compiled.evidenceHash,
    'native PostgreSQL JSONB digest equals the independent live evidence binding')
  assert.equal(compiled.evidenceHash, 'cc61f8b41a289d4a78f0d0fdaaca369e2f532c1f820577ca6a5b3a1a44f45dc1')
  assert.equal(await proof.value('to_jsonb(jetnity_dev_import_scheduler.tick_v1())', creator), 'operator_review_required')
  return fixture
}

async function expectRefusal(proof: OwnedPersistentProof, before: string, message: RegExp, selected = nested) {
  const out = await proof.run(ack + '\nBEGIN;\n' + before + '\n' + selected + '\nROLLBACK;', 'exact review refusal',
    new RegExp(message.source + '|current transaction is aborted'))
  assert.match(out, message)
  assert.equal(await proof.value("to_jsonb(to_regclass('jetnity_dev_import_scheduler.terminal_cycle3_review_v1') IS NULL)", creator), true)
}

// Deliberately inconsistent test-only custody, always rolled back. Restore the
// genuine trigger before invoking the unchanged migration/catalog checks.
const custodyFault = (sql: string) => `SET SESSION AUTHORIZATION ot_pilot_owner;
  ALTER TABLE official_v3_jobs_private.subjects_v1 DISABLE TRIGGER guard_row_v1;
  ${sql}
  ALTER TABLE official_v3_jobs_private.subjects_v1 ENABLE TRIGGER guard_row_v1;
  SET SESSION AUTHORIZATION postgres;`

test('Dev Cycle3 review runs exact migration against genuine full PG17 history and quota', { timeout: 180000 }, async t => {
  const proof = new OwnedPersistentProof(t.signal)
  try {
    const fixture = await installFixture(proof, true)
    assert.equal(fixture.subjectRow.current_job.revision, 38, 'later normal terminal head is allowed without rewriting either original cycle')
    const before = await proof.value(oldRows, creator)
    const negativeCases: Readonly<{ name: string; sql: string; error: RegExp }>[] = [
      { name: 'missing operator declaration', sql: "SET LOCAL jetnity.dev_terminal_cycle3_review_ack='';", error: /exact Dev Cycle3 operator declaration required/ },
      { name: 'Production or any other target', sql: "SET LOCAL jetnity.dev_terminal_cycle3_review_target='production:qscbgcdmivbbnzrcyegn:terminal-cycle3-v1';", error: /exact Dev Cycle3 operator declaration required/ },
      { name: 'missing Ready deployment', sql: "SET LOCAL jetnity.dev_terminal_cycle3_review_deployment='';", error: /exact Dev Cycle3 operator declaration required/ },
      { name: 'no successful newer UI version declaration', sql: "SET LOCAL jetnity.dev_terminal_cycle3_review_ui_version='5';", error: /exact Dev Cycle3 operator declaration required/ },
      { name: 'changed installed sender metadata', sql: "ALTER FUNCTION jetnity_dev_import_scheduler.tick_v1() SET statement_timeout='11s';", error: /exact unchanged Dev sender predecessor required/ },
      { name: 'changed installed sender body', sql: "CREATE OR REPLACE FUNCTION jetnity_dev_import_scheduler.tick_v1() RETURNS text LANGUAGE plpgsql AS $$ BEGIN RETURN 'disabled'; END $$;", error: /exact unchanged Dev sender predecessor required/ },
      { name: 'unprocessed import dispatch', sql: 'UPDATE jetnity_dev_import_scheduler.dispatches_v1 SET processed_at=NULL WHERE id=20;', error: /unreviewed scheduler work remains/ },
      { name: 'unprocessed preview dispatch', sql: 'INSERT INTO jetnity_dev_import_scheduler.preview_dispatches_v1(net_request_id) VALUES(500);', error: /unreviewed scheduler work remains/ },
      { name: 'unsigned or unknown final outcome', sql: "UPDATE jetnity_dev_import_scheduler.dispatches_v1 SET outcome='response_unconfirmed' WHERE id=20;", error: /original Cycle3 signed exhausted evidence differs/ },
      { name: 'another final HTTP status', sql: 'UPDATE jetnity_dev_import_scheduler.dispatches_v1 SET http_status=503 WHERE id=20;', error: /original Cycle3 signed exhausted evidence differs/ },
      { name: 'another original dispatch timestamp', sql: "UPDATE jetnity_dev_import_scheduler.dispatches_v1 SET signed_at_ms='1794690000000' WHERE id=13;", error: /original Cycle3 signed exhausted evidence differs/ },
      { name: 'missing original dispatch', sql: 'DELETE FROM jetnity_dev_import_scheduler.dispatches_v1 WHERE id=13;', error: /original Cycle3 signed exhausted evidence differs/ },
      { name: 'open attempt', sql: custodyFault("UPDATE official_v3_jobs_private.subjects_v1 SET open_attempt='execution-attempt:v3:'||repeat('a',64);"), error: /unresolved custody/ },
      { name: 'reserved terminal operation', sql: custodyFault("UPDATE official_v3_jobs_private.subjects_v1 SET terminal_credit_claim='op3_'||repeat('a',32);"), error: /unresolved custody/ },
      { name: 'current nonterminal head', sql: custodyFault("UPDATE official_v3_jobs_private.subjects_v1 SET current_job=jsonb_set(current_job,'{state}','\"queued\"'::jsonb);"), error: /unresolved custody/ },
      { name: 'retained lease', sql: custodyFault("UPDATE official_v3_jobs_private.subjects_v1 SET current_job=jsonb_set(current_job,'{lease}','{}'::jsonb);"), error: /unresolved custody/ },
      { name: 'any START for the reviewed original job', sql: `SET SESSION AUTHORIZATION ot_pilot_owner;
        INSERT INTO official_v3_jobs_private.execution_starts_v1(attempt_key,job_key,claim_operation_id,claim_text,leased_job,authority,token_hash,reserved_at)
        SELECT 'execution-attempt:v3:'||repeat('b',64),job_key,operation_id,'{}',envelope_text::jsonb->'next','{}',repeat('c',64),clock_timestamp()
        FROM official_v3_jobs_private.queue_operations_v1 WHERE envelope_text::jsonb#>>'{next,jobId}'='${REVIEW.job}'
          AND envelope_text::jsonb#>>'{next,revision}'='31'; SET SESSION AUTHORIZATION postgres;`, error: /unresolved custody/ },
      { name: 'another blocked cycle is not part of this review', sql: `INSERT INTO jetnity_dev_import_scheduler.cycles_v1(created_at,operation_id,lease_id,phase,state,last_status,finished_at)
        VALUES(clock_timestamp(),'op3_'||repeat('e',32),'lease3_'||repeat('f',32),'resume','blocked','unresolved',clock_timestamp());`, error: /unreviewed scheduler work remains/ },
      { name: 'another active original request', sql: "INSERT INTO jetnity_dev_import_scheduler.cycles_v1(operation_id,lease_id) VALUES('op3_'||repeat('e',32),'lease3_'||repeat('f',32));", error: /unreviewed scheduler work remains/ },
      { name: 'missing original Cycle2 review table', sql: 'DROP TABLE jetnity_dev_import_scheduler.terminal_cycle2_review_v1;', error: /original Cycle2 review is required/ },
      { name: 'missing original Cycle2 review row', sql: `ALTER TABLE jetnity_dev_import_scheduler.terminal_cycle2_review_v1 DISABLE TRIGGER immutable_row;
        DELETE FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1;
        ALTER TABLE jetnity_dev_import_scheduler.terminal_cycle2_review_v1 ENABLE TRIGGER immutable_row;`, error: /original Cycle2 review and evidence are required/ },
      { name: 'changed prior Cycle2 evidence cannot be covered by a Cycle3 review', sql: "UPDATE jetnity_dev_import_scheduler.dispatches_v1 SET outcome='response_unconfirmed' WHERE id=12;", error: /original Cycle2 review and evidence are required/ },
    ]
    for (const item of negativeCases) await t.test(item.name, async () => {
      await expectRefusal(proof, item.sql, item.error)
      assert.deepEqual(await proof.value(oldRows, creator), before, 'every rejected transaction leaves complete old rows unchanged')
    })
    await t.test('different terminal original bytes and changed protected catalog refuse atomically', async () => {
      // Deliberate corruption is confined to this owned rollback fixture.
      await expectRefusal(proof, `SET SESSION AUTHORIZATION ot_pilot_owner;
        ALTER TABLE official_v3_jobs_private.queue_operations_v1 DISABLE TRIGGER guard_row_v1;
        UPDATE official_v3_jobs_private.queue_operations_v1 SET envelope_text=envelope_text||' ' WHERE operation_id='${REVIEW.terminal}';
        ALTER TABLE official_v3_jobs_private.queue_operations_v1 ENABLE TRIGGER guard_row_v1;
        SET SESSION AUTHORIZATION postgres;`, /original Cycle3 signed exhausted evidence differs/)
      await expectRefusal(proof, `GRANT SELECT ON jetnity_dev_import_scheduler.cycles_v1 TO anon;`, /catalog changed|catalog mismatch|protected catalog/)
      assert.deepEqual(await proof.value(oldRows, creator), before)
    })
    await t.test('complete rollback rehearsal holds the existing guard and protected history locks', async () => {
      const locks = await proof.value(`jsonb_build_object(
        'sender',(SELECT count(*) FROM pg_locks WHERE pid=pg_backend_pid() AND locktype='advisory' AND classid=771106 AND objid=31 AND granted),
        'guard',(SELECT count(*) FROM pg_locks WHERE pid=pg_backend_pid() AND locktype='advisory' AND classid=771106 AND objid=1 AND granted),
        'history',(SELECT count(*) FROM pg_locks WHERE pid=pg_backend_pid() AND locktype='relation' AND mode='ShareLock' AND granted
          AND relation IN ('official_v3_jobs_private.subjects_v1'::regclass,'official_v3_jobs_private.queue_operations_v1'::regclass,
            'official_v3_intake_private.operations_v1'::regclass,'official_v3_method_private.heads_v1'::regclass,'official_v3_result_private.heads_v1'::regclass)))`,
      ack + 'BEGIN;' + nested, 'ROLLBACK;')
      assert.deepEqual(locks, { sender: 1, guard: 1, history: 5 })
      assert.deepEqual(await proof.value(oldRows, creator), before)
      assert.equal(await proof.value("to_jsonb(to_regclass('jetnity_dev_import_scheduler.terminal_cycle3_review_v1') IS NULL)", creator), true)
    })
    await t.test('complete migration adds only the immutable review and exact predicate with no new work', async () => {
      await proof.run(ack + original, 'complete original review migration')
      assert.deepEqual(await proof.value(oldRows, creator), before, 'all old fields/counters/generations including enabled/next_due/phaseAttempts are unchanged')
      assert.equal(await proof.value('to_jsonb((SELECT count(*) FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1))', creator), 1)
      assert.equal(await proof.value("to_jsonb((SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc WHERE oid='jetnity_dev_import_scheduler.tick_v1()'::regprocedure))", creator), compiled.newHash)
      assert.deepEqual(await proof.value('public.official_v3_guard_alarm_status_v1()', creator), { schema: 1, status: 'current' })
      await proof.run(creator + 'SET default_transaction_read_only=on; BEGIN;'
        + readbackSql + 'COMMIT;',
        'complete operator readback is executable and strictly read-only')
      const confirmation = await proof.value<{
        schema: number; prior_cycle2_review_valid: boolean; original_cycle3_evidence_unchanged: boolean;
        exact_reviewed_sender: boolean; original_dispatch_count: number; unprocessed_dispatch_count: number;
        other_blocked_count: number; review: { cycle_id: number; reviewed_revision: number };
        prior_cycle2_review: { cycle_id: number };
      }>(readbackExpression, creator + 'SET default_transaction_read_only=on; BEGIN;', 'COMMIT;')
      assert.equal(confirmation.schema, 1)
      assert.equal(confirmation.prior_cycle2_review_valid, true)
      assert.equal(confirmation.original_cycle3_evidence_unchanged, true)
      assert.equal(confirmation.exact_reviewed_sender, true)
      assert.equal(confirmation.review.cycle_id, 3)
      assert.equal(confirmation.review.reviewed_revision, 38)
      assert.equal(confirmation.prior_cycle2_review.cycle_id, 2)
      assert.equal(confirmation.original_dispatch_count, 8)
      assert.equal(confirmation.unprocessed_dispatch_count, 0)
      assert.equal(confirmation.other_blocked_count, 0)
    })
    await t.test('lost apply ACK is confirmed by original review readback; reapplication cannot replace it', async () => {
      const receipt = await proof.value('(SELECT to_jsonb(r) FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1 r)', creator)
      await proof.run(ack + original, 'already committed review refuses replacement', /review already present|current transaction is aborted/)
      assert.deepEqual(await proof.value('(SELECT to_jsonb(r) FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1 r)', creator), receipt)
      assert.deepEqual(await proof.value(oldRows, creator), before)
    })
    await t.test('review cannot be relabelled, deleted, truncated or read by application roles', async () => {
      for (const sql of ["UPDATE jetnity_dev_import_scheduler.terminal_cycle3_review_v1 SET ci_run=2;",
        'DELETE FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1;', 'TRUNCATE jetnity_dev_import_scheduler.terminal_cycle3_review_v1;']) {
        await proof.run(creator + 'BEGIN;' + sql + 'ROLLBACK;', 'immutable original review', /the original Cycle3 review is immutable|current transaction is aborted/)
      }
      await proof.run('SET SESSION AUTHORIZATION anon; SELECT * FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1;', 'no public review authority', /permission denied/)
      await proof.run(creator + 'BEGIN; DELETE FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1; ROLLBACK;',
        'the original Cycle2 review stays immutable', /the original Cycle2 review is immutable|current transaction is aborted/)
      assert.deepEqual(await proof.value(oldRows, creator), before)
    })
    await t.test('the normal sender passes only the exact reviewed historical block', async () => {
      assert.equal(await proof.value('to_jsonb(jetnity_dev_import_scheduler.tick_v1())', creator), 'not_due')
      assert.equal(await proof.value('to_jsonb((SELECT count(*) FROM net.http_request_queue))', creator), 0)
      for (const fault of ["UPDATE jetnity_dev_import_scheduler.dispatches_v1 SET outcome='response_unconfirmed' WHERE id=12;",
        "UPDATE jetnity_dev_import_scheduler.dispatches_v1 SET outcome='response_unconfirmed' WHERE id=20;",
        "INSERT INTO jetnity_dev_import_scheduler.cycles_v1(operation_id,lease_id,phase,state,last_status,finished_at) VALUES('op3_'||repeat('e',32),'lease3_'||repeat('f',32),'resume','blocked','unresolved',clock_timestamp());"]) {
        const output = await proof.value('to_jsonb(jetnity_dev_import_scheduler.tick_v1())', creator + 'BEGIN;' + fault, 'ROLLBACK;')
        assert.equal(output, 'operator_review_required')
      }
      const output = await proof.value(`(SELECT jsonb_build_object('outcome',jetnity_dev_import_scheduler.tick_v1()))`,
        creator + "BEGIN; UPDATE jetnity_dev_import_scheduler.state_v1 SET next_due_at=clock_timestamp();", 'ROLLBACK;')
      assert.deepEqual(output, { outcome: 'dispatched_start' }, 'only a later normal tick creates the next fresh original request')
      assert.equal(await proof.value('to_jsonb((SELECT count(*) FROM jetnity_dev_import_scheduler.cycles_v1))', creator), 2,
        'rollback proof does not leave a synthetic new request')
    })
  } finally { await proof.close() }
})

test('the same exact review also accepts the original terminal Head35 under real BG1', { timeout: 120000 }, async t => {
  const proof = new OwnedPersistentProof(t.signal)
  try {
    const fixture = await installFixture(proof, false)
    assert.equal(fixture.subjectRow.current_job.revision, 35)
    const before = await proof.value(oldRows, creator)
    await proof.run(ack + original, 'original terminal head review')
    assert.deepEqual(await proof.value(oldRows, creator), before)
  } finally { await proof.close() }
})

test('Cycle3 review preserves the complete customer/history successor after its actual fresh BG1 proof', { timeout: 120000 }, async t => {
  const proof = new OwnedPersistentProof(t.signal)
  try {
    const fixture = await installFixture(proof, true, true)
    assert.equal(fixture.subjectRow.current_job.revision, 38)
    const customerBaseline = '(SELECT to_jsonb(b) FROM official_v3_guard_private.customer_information_baseline_v1 b)'
    const before = await proof.value(oldRows, creator)
    const baselineBefore = await proof.value(customerBaseline, creator)
    assert.ok(baselineBefore)
    assert.deepEqual(await proof.value('public.official_v3_guard_alarm_status_v1()', creator), { schema: 1, status: 'current' })
    await proof.run(ack + original, 'exact Cycle3 review on the complete additive Dev successor')
    assert.deepEqual(await proof.value(oldRows, creator), before)
    assert.deepEqual(await proof.value(customerBaseline, creator), baselineBefore)
    await proof.run(creator + 'SELECT official_v3_guard_private.assert_catalog_v1(); SELECT official_v3_guard_private.require_open_v1();',
      'customer/history body chain and actual successor proof remain valid')
    const confirmation = await proof.value<{ original_cycle3_evidence_unchanged: boolean; exact_reviewed_sender: boolean }>(readbackExpression, creator)
    assert.equal(confirmation.original_cycle3_evidence_unchanged, true)
    assert.equal(confirmation.exact_reviewed_sender, true)
  } finally { await proof.close() }
})
