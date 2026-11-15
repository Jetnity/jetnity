// Actual owned PG17 proof only. All historical/user/sender rows are explicit
// local fixtures. No Dev connection, HTTP source fact, cron or publication claim.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import type { TestContext } from 'node:test'
import { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { json, literal, readSql } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { buildHistoricalQuotaFixture } from '../official-truth-v3-rolling-jobs-quota-1/history-fixture'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program'
import { hrs1Canonical } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import { compileCustomerInformationMigration, BASELINE } from './build.mjs'

const binding = program.binding
const creator = 'SET SESSION AUTHORIZATION postgres; SET search_path=pg_catalog;'
const localOwner = 'SET SESSION AUTHORIZATION ot_pilot_owner; SET search_path=pg_catalog;'
const id = (kind: string, value: string) => kind + '_' + createHash('sha256').update('customer-native:' + value).digest('hex').slice(0, 32)
const uid = (n: number) => n.toString(16).padStart(8, '0') + '-1111-4111-8111-' + n.toString(16).padStart(12, '0')
const oldRows = `to_jsonb(encode(sha256(convert_to((SELECT jsonb_build_object(
 'roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r),
 'memberships',(SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),
 'subjects',(SELECT jsonb_agg(to_jsonb(s) ORDER BY job_key) FROM official_v3_jobs_private.subjects_v1 s),
 'operations',(SELECT jsonb_agg(to_jsonb(s) ORDER BY operation_id) FROM official_v3_jobs_private.queue_operations_v1 s),
 'starts',(SELECT jsonb_agg(to_jsonb(s) ORDER BY attempt_key) FROM official_v3_jobs_private.execution_starts_v1 s),
 'dispositions',(SELECT jsonb_agg(to_jsonb(s) ORDER BY attempt_key) FROM official_v3_jobs_private.execution_dispositions_v1 s),
 'method',(SELECT jsonb_agg(to_jsonb(s) ORDER BY operation_id) FROM official_v3_method_private.operations_v1 s),
 'guard_state',(SELECT to_jsonb(s) FROM official_v3_guard_private.state_v1 s),
 'guard_runs',(SELECT jsonb_agg(to_jsonb(s) ORDER BY due_at) FROM official_v3_guard_private.runs_v1 s),
 'certificates',(SELECT jsonb_agg(to_jsonb(s) ORDER BY component) FROM official_v3_guard_private.certificates_v1 s),
 'certificate_history',(SELECT jsonb_agg(to_jsonb(s) ORDER BY component,generation) FROM official_v3_guard_private.certificate_history_v1 s),
 'baseline',(SELECT jsonb_agg(to_jsonb(s) ORDER BY component) FROM official_v3_guard_private.baselines_v1 s),
 'status_baseline',(SELECT to_jsonb(s) FROM official_v3_guard_private.status_baseline_v1 s),
 'recovery_baseline',(SELECT to_jsonb(s) FROM official_v3_guard_private.recovery_baseline_v1 s),
 'gap_baseline',(SELECT to_jsonb(s) FROM official_v3_guard_private.gap_recovery_baseline_v1 s),
 'rolling_baseline',(SELECT to_jsonb(s) FROM official_v3_guard_private.rolling_quota_baseline_v1 s),
 'jobs_catalog_binding',(SELECT jsonb_agg(to_jsonb(s) ORDER BY object_identity) FROM official_v3_jobs_private.catalog_binding_v1 s),
 'hrs_binding',(SELECT to_jsonb(s) FROM official_v3_result_private.binding_v1 s),
 'sender_state',(SELECT to_jsonb(s) FROM jetnity_dev_import_scheduler.state_v1 s),
 'sender_cycles',(SELECT jsonb_agg(to_jsonb(s) ORDER BY id) FROM jetnity_dev_import_scheduler.cycles_v1 s),
 'sender_dispatches',(SELECT jsonb_agg(to_jsonb(s) ORDER BY id) FROM jetnity_dev_import_scheduler.dispatches_v1 s),
 'sender_preview',(SELECT to_jsonb(s) FROM jetnity_dev_import_scheduler.preview_access_v1 s),
 'sender_preview_dispatches',(SELECT jsonb_agg(to_jsonb(s) ORDER BY id) FROM jetnity_dev_import_scheduler.preview_dispatches_v1 s)
 ))::text,'UTF8')),'hex'))`

export async function baseSetup(proof: OwnedPersistentProof) {
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
export function methodSeed(first: string) {
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

export async function runCustomerInformationNative(t: TestContext) {
  const compiled = compileCustomerInformationMigration()
  const migration = readFileSync(new URL('./provider-migration-body.sql', import.meta.url), 'utf8')
  assert.equal(migration, compiled.migration)
  const readback = '(' + compiled.readback.slice(compiled.readback.indexOf('WITH catalog_checked')).trim().replace(/;$/, '') + ')'
  const fixture = await buildHistoricalQuotaFixture({ method: binding, context: binding.context, factKind: 'requirement_effect',
    firstAt: new Date(Date.now() - 3 * 86400000), cycleSpacingMs: 40 * 60000, cycles: 4 })
  const proof = new OwnedPersistentProof(t.signal)
  try {
    const refuses = async (sql: string, label: string, expected: RegExp) => {
      const output = await proof.run(sql, label, new RegExp(expected.source + '|current transaction is aborted'))
      assert.match(output, expected, 'the intended original refusal is present, beyond transaction-aborted follow-ups')
    }
    await proof.run('CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions;', 'actual local pgcrypto prerequisite')
    await baseSetup(proof)
    await proof.run(localOwner + "BEGIN; SET LOCAL jetnity.local_quota_fixture='owned-local-pg17-only';\n"
      + methodSeed(fixture.oldestAt) + '\n' + fixture.seedSql + '\nCOMMIT;',
    'coherent synthetic historical failures, before BG1; no manufactured publication')
    for (const file of ['provider-migration-body.sql', 'status-rpc-provider-migration-body.sql',
      'recovery-provider-migration-body.sql', 'recovery-gap-provider-migration-body.sql']) {
      await proof.run(creator + '\nBEGIN;\n' + readSql('official-truth-v3-background-guard-1/' + file) + '\nCOMMIT;',
        'unmodified BG1 predecessor ' + file)
    }
    await proof.run(creator + '\nBEGIN;\n' + readSql('official-truth-v3-rolling-jobs-quota-1/provider-migration-body.sql') + '\nCOMMIT;',
      'unmodified existing rolling successor')
    await proof.run(creator + "BEGIN; SET LOCAL jetnity.dev_import_target='dev:yfvbxvijcorffwxbxahl:refresh1';\n"
      + readSql('official-truth-v3-dev-import-schedule-1/core.sql')
      + readSql('official-truth-v3-dev-import-schedule-1/preview-renewal.sql') + '\nCOMMIT;',
    'real existing sender schema; no tick, network or activation')
    for (const directory of ['official-truth-v3-dev-terminal-cycle-review-1', 'official-truth-v3-dev-terminal-cycle3-review-1']) {
      const evidence = JSON.parse(readSql(directory + '/original-evidence.json'))
      await proof.run(creator + `
        INSERT INTO jetnity_dev_import_scheduler.cycles_v1(id,created_at,operation_id,lease_id,phase,state,phase_attempts,last_status,finished_at,published)
        OVERRIDING SYSTEM VALUE SELECT id,created_at,operation_id,lease_id,phase,state,phase_attempts,last_status,finished_at,published
        FROM jsonb_populate_record(NULL::jetnity_dev_import_scheduler.cycles_v1,${json(evidence.cycle)});
        INSERT INTO jetnity_dev_import_scheduler.dispatches_v1(id,cycle_id,phase,signed_at_ms,dispatched_at,net_request_id,processed_at,http_status,outcome)
        OVERRIDING SYSTEM VALUE SELECT id,cycle_id,phase,signed_at_ms,dispatched_at,net_request_id,processed_at,http_status,outcome
        FROM jsonb_populate_recordset(NULL::jetnity_dev_import_scheduler.dispatches_v1,${json(evidence.dispatches)});`,
      'explicit local copies of the original blocked Cycle2/3 metadata, not a source/publication result')
    }
    const before = await proof.value(oldRows, creator)
    const legacyWork = { context: binding.context, method: { methodId: binding.methodId, revision: binding.revision },
      factKind: 'requirement_effect', researchReason: { status: 'missing' } }
    const subject = (schema: string, work: unknown) => schema + ".subject_v1('rule_research'," + json(work) + ')'
    const jobsOwner = 'SET SESSION AUTHORIZATION ot_v3_jobs_owner;'
    const resultOwner = 'SET SESSION AUTHORIZATION ot_v3_result_owner;'
    const legacyJobs = await proof.value(subject('official_v3_jobs_private', legacyWork), jobsOwner)
    const legacyResult = await proof.value(subject('official_v3_result_private', legacyWork), resultOwner)
    const metadata = `to_jsonb(encode(sha256(convert_to((SELECT jsonb_agg(to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'] ORDER BY p.oid)
      FROM pg_proc p WHERE p.oid=ANY(ARRAY[${compiled.inventory.map(f => literal(f.signature) + '::regprocedure').join(',')}]))::text,'UTF8')),'hex'))`
    const functionMetadata = await proof.value(metadata, creator)

    await t.test('wrong target, predecessor drift and un-restored membership all roll back completely', async () => {
      const faults = [
        { before: '', body: migration.replace("SET LOCAL jetnity.customer_information_target='dev:", "SET LOCAL jetnity.customer_information_target='wrong:"), error: /exact unused Dev predecessor/ },
        { before: localOwner + "ALTER FUNCTION official_v3_jobs_private.context_v1(jsonb) SET statement_timeout='1s';" + creator,
          body: migration, error: /predecessor catalog mismatch/ },
        { before: '', body: migration.replace('REVOKE ot_v3_intake_owner FROM postgres GRANTED BY postgres;', ''), error: /exact authority restoration/ },
      ]
      for (const fault of faults) {
        await refuses(creator + 'BEGIN;' + fault.before + fault.body + 'ROLLBACK;', 'refused customer successor', fault.error)
        assert.equal(await proof.value(oldRows, creator), before)
        assert.equal(await proof.value("to_jsonb(to_regclass('" + BASELINE + "') IS NULL)", creator), true)
      }
    })
    await t.test('an extra runtime privilege is rejected rather than absorbed into the new baseline', async () => {
      const malicious = migration.replace('REVOKE ot_v3_intake_owner FROM postgres GRANTED BY postgres;',
        'SET LOCAL ROLE ot_v3_intake_owner; GRANT EXECUTE ON FUNCTION official_v3_intake_private.proposal_shape_v1() TO anon; RESET ROLE;\n'
        + 'REVOKE ot_v3_intake_owner FROM postgres GRANTED BY postgres;')
      await refuses(creator + 'BEGIN;' + malicious + 'ROLLBACK;', 'unapproved privilege delta', /predecessor graph changed/)
      assert.equal(await proof.value(oldRows, creator), before)
    })
    await t.test('enabled sender, an active cycle and an unprocessed request each refuse installation', async () => {
      for (const fault of [
        'UPDATE jetnity_dev_import_scheduler.state_v1 SET enabled=true;',
        "INSERT INTO jetnity_dev_import_scheduler.cycles_v1(id,operation_id,lease_id) OVERRIDING SYSTEM VALUE VALUES(1,'op3_'||repeat('a',32),'lease3_'||repeat('b',32));",
        'UPDATE jetnity_dev_import_scheduler.dispatches_v1 SET processed_at=NULL WHERE id=(SELECT min(id) FROM jetnity_dev_import_scheduler.dispatches_v1);',
        'INSERT INTO jetnity_dev_import_scheduler.preview_dispatches_v1(id,net_request_id) OVERRIDING SYSTEM VALUE VALUES(1,1);',
      ]) {
        await refuses(creator + 'BEGIN;' + fault + migration + 'ROLLBACK;', 'un-drained sender refused', /disabled drained sender required/)
        assert.equal(await proof.value(oldRows, creator), before)
      }
    })
    await t.test('a genuine positive predecessor proof cannot admit the changed catalog', async () => {
      // The audit uses its actual clock/due slot. The rehearsal rolls back its
      // proof and the whole successor; there is no timestamp or due-slot edit.
      await proof.run(creator + 'BEGIN; SET LOCAL statement_timeout=\'30s\';'
        + 'SELECT official_v3_guard_private.audit_v1(); SELECT official_v3_guard_private.require_open_v1();'
        + migration + '\nROLLBACK;', 'real old proof is refused by new fresh-proof boundary')
      assert.equal(await proof.value(oldRows, creator), before)
    })
    await proof.run(creator + 'BEGIN;' + migration + 'COMMIT;', 'exact customer validator successor')
    await t.test('every old row, original function OID/ACL and bootstrap membership remains exact', async () => {
      assert.equal(await proof.value(oldRows, creator), before)
      assert.equal(await proof.value(metadata, creator), functionMetadata)
      assert.deepEqual(await proof.value(subject('official_v3_jobs_private', legacyWork), jobsOwner), legacyJobs)
      assert.deepEqual(await proof.value(subject('official_v3_result_private', legacyWork), resultOwner), legacyResult)
      await proof.run(creator + 'SELECT official_v3_guard_private.assert_catalog_v1();'
        + 'SELECT official_v3_guard_private.check_jobs_v1(); SELECT official_v3_guard_private.check_hrs_v1();', 'old whole history still validates')
    })
    await t.test('readback reconciles a lost ACK and the immutable installer cannot run twice', async () => {
      const value = await proof.value<Record<string, unknown>>(readback, creator)
      assert.equal(value.installed, true); assert.equal(value.catalog_verified, true)
      assert.equal(value.definitions_verified, true); assert.equal(value.predecessor_verified, true)
      assert.equal(value.definitions_digest_verified, true); assert.equal(value.provider_digest, compiled.digest)
      assert.equal(value.history_definition_digest_verified, true)
      assert.deepEqual(value.admission, { schema: 1, status: 'unavailable' })
      await refuses(creator + 'BEGIN;' + migration + 'ROLLBACK;', 'duplicate successor refused', /exact unused Dev predecessor/)
      assert.deepEqual(await proof.value(readback, creator), value)
      assert.equal(await proof.value(oldRows, creator), before)
    })
    await t.test('new context items have different identities and both private validators agree', async () => {
      const vector = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8'))
      const work = { context: vector.context, method: { methodId: 'synthetic-ci-method', revision: 1 },
        factKind: 'entry_information', researchReason: { status: 'missing' } }
      const first = await proof.value<{ jobKey: string; contextKey: string; subjectText: string }>(subject('official_v3_jobs_private', work), jobsOwner)
      assert.deepEqual(await proof.value(subject('official_v3_result_private', work), resultOwner), first)
      const secondWork = { ...work, context: { ...vector.context, informationItem: vector.secondItem } }
      const second = await proof.value<{ jobKey: string; contextKey: string; subjectText: string }>(subject('official_v3_jobs_private', secondWork), jobsOwner)
      assert.deepEqual(await proof.value(subject('official_v3_result_private', secondWork), resultOwner), second)
      assert.notEqual(first.contextKey, second.contextKey); assert.notEqual(first.jobKey, second.jobKey)
      assert.notEqual(first.subjectText, second.subjectText)
      for (const [schema, role] of [['official_v3_jobs_private', jobsOwner], ['official_v3_result_private', resultOwner]]) {
        for (const context of [{ ...vector.context, informationTopic: vector.invalidTopic },
          { ...vector.context, informationItem: '' }, { ...vector.context, informationItem: 'UPPERCASE' }]) {
          await refuses(role + 'SELECT ' + subject(schema, { ...work, context }) + ';', 'invalid topic/item rejected', /invalid (?:information|context|customer|topic|item)/)
        }
      }
    })
    await t.test('baseline is append-only and unavailable to runtime roles', async () => {
      for (const statement of ['UPDATE ' + BASELINE + ' SET required_generation=required_generation+1;',
        'DELETE FROM ' + BASELINE + ';', 'TRUNCATE ' + BASELINE + ';']) {
        await refuses(creator + 'BEGIN;' + statement + 'ROLLBACK;', 'immutable successor', /immutable/)
      }
      for (const role of ['anon', 'authenticated', 'service_role', 'ot_v3_jobs_owner', 'ot_v3_intake_owner', 'ot_v3_result_owner']) {
        await refuses('SET SESSION AUTHORIZATION ' + role + '; SELECT * FROM ' + BASELINE + ';', 'no runtime baseline privilege', /permission denied/)
      }
      assert.equal(await proof.value(oldRows, creator), before)
    })
    await t.test('all 17 fictional detail variants pass real S1/HRS shape and identity validation', async () => {
      const vectors = JSON.parse(readFileSync(new URL('./shape-fixtures.json', import.meta.url), 'utf8')).cases
      assert.equal(vectors.length, 17)
      const input = json(vectors)
      const intake = await proof.value<Array<{ proposal: boolean; outcome: boolean; audit: boolean }>>(`(SELECT jsonb_agg(jsonb_build_object(
        'proposal',official_v3_intake_private.proposal_retainable_v1(v->'proposal'),
        'outcome',official_v3_intake_private.shape_matches_v1(v->'outcome',official_v3_intake_private.proposal_shape_v1()->'definitions'->'outcome',
          official_v3_intake_private.proposal_shape_v1()->'definitions',official_v3_intake_private.proposal_shape_v1()->'countries',0),
        'audit',official_v3_intake_private.shape_matches_v1(v->'audit',official_v3_intake_private.proposal_shape_v1()->'definitions'->'audit',
          official_v3_intake_private.proposal_shape_v1()->'definitions',official_v3_intake_private.proposal_shape_v1()->'countries',0)) ORDER BY ordinal)
        FROM jsonb_array_elements(${input}) WITH ORDINALITY AS item(v,ordinal))`, 'SET SESSION AUTHORIZATION ot_v3_intake_owner;')
      assert.deepEqual(intake, vectors.map(() => ({ proposal: true, outcome: true, audit: true })))
      const result = await proof.value<Array<{ proposal: boolean; outcome: boolean; audit: boolean; identity: boolean }>>(`(SELECT jsonb_agg(jsonb_build_object(
        'proposal',official_v3_result_private.s1_shape_v1(v->'proposal','proposal'),
        'outcome',official_v3_result_private.s1_shape_v1(v->'outcome','outcome'),
        'audit',official_v3_result_private.s1_shape_v1(v->'audit','audit'),
        'identity',(official_v3_result_private.subject_v1('rule_research',jsonb_build_object('context',v->'context','method',v->'method',
          'factKind','entry_information','researchReason',jsonb_build_object('status','missing')))->>'contextKey')=v#>>'{identity,contextKey}') ORDER BY ordinal)
        FROM jsonb_array_elements(${input}) WITH ORDINALITY AS item(v,ordinal))`, resultOwner)
      assert.deepEqual(result, vectors.map(() => ({ proposal: true, outcome: true, audit: true, identity: true })))
      const bad = structuredClone(vectors[0].proposal)
      bad.context.informationTopic = 'minors'
      assert.equal(await proof.value('to_jsonb(official_v3_intake_private.proposal_retainable_v1(' + json(bad) + '))',
        'SET SESSION AUTHORIZATION ot_v3_intake_owner;'), false, 'shape refuses vaccination detail relabelled as a minor topic')
      assert.equal(await proof.value('to_jsonb(official_v3_result_private.s1_shape_v1(' + json(bad) + ",'proposal'))", resultOwner), false)
      assert.equal(await proof.value(oldRows, creator), before, 'pure validation grants no publication or stored acceptance')
    })
    await t.test('only the next genuine full BG1 proof opens the installed successor', async () => {
      assert.deepEqual(await proof.value('public.official_v3_guard_alarm_status_v1()', creator), { schema: 1, status: 'unavailable' })
      const started = performance.now()
      assert.equal((await proof.value<{ status: string }>('official_v3_guard_private.audit_v1()', creator)).status, 'current')
      const milliseconds = performance.now() - started
      const value = await proof.value<Record<string, unknown>>(readback, creator)
      assert.deepEqual(value.admission, { schema: 1, status: 'current' })
      assert.equal(value.definitions_verified, true)
      await proof.run(creator + 'SELECT official_v3_guard_private.require_open_v1();', 'fresh proof admits normal business IO')
      const quota = await proof.value<{ lifetime_starts: number; lifetime_operations: number; starts: number; operations: number }>(
        'official_v3_guard_private.ch_de_quota_v2()', creator)
      assert.equal(quota.lifetime_starts, 4); assert.equal(quota.lifetime_operations, 12)
      assert.equal(quota.starts, 0); assert.equal(quota.operations, 0)
      assert.ok(milliseconds < 30000)
      t.diagnostic('actual unchanged complete BG1 audit milliseconds: ' + milliseconds.toFixed(2))
    })
  } finally { await proof.close() }
}
