// Owned PG17 differential for the exact BG1 dedup block. The original relation
// supplies real membership witnesses; diagnostic counters are never installed.
import assert from 'node:assert/strict'
import type { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { json, literal } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { hrs1Canonical } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import { compileHistoryGuardDefinition, HISTORY_GUARD_DECLARATION, HISTORY_GUARD_DEDUP,
  HISTORY_GUARD_MEMBERSHIP, HISTORY_GUARD_ORIGINAL_DEDUP, HISTORY_GUARD_SIGNATURE } from './history-guard-build.mjs'

const owner = 'SET SESSION AUTHORIZATION ot_pilot_owner;SET search_path=pg_catalog;'
type Journal = Record<string, unknown> & {
  operation_id: string; job_key: string; action: string; authority: Record<string, unknown>; envelope_text: string
}
type Probe = { state: string | null; message: string | null; probes: number; hitBefore: boolean; bytes: number }
type Outcome = { state: string | null; message: string | null }
const retainedDigest = `(SELECT to_jsonb(encode(sha256(convert_to(jsonb_build_object(
  'subjects',(SELECT jsonb_agg(to_jsonb(r) ORDER BY job_key) FROM official_v3_jobs_private.subjects_v1 r),
  'operations',(SELECT jsonb_agg(to_jsonb(r) ORDER BY operation_id) FROM official_v3_jobs_private.queue_operations_v1 r),
  'starts',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_key) FROM official_v3_jobs_private.execution_starts_v1 r),
  'dispositions',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_key) FROM official_v3_jobs_private.execution_dispositions_v1 r)
  )::text,'UTF8')),'hex')))`

export async function checkHistoryGuardMembership(proof: OwnedPersistentProof, jobKey: string) {
  const compiled = compileHistoryGuardDefinition()
  const originalSql = 'CREATE OR REPLACE FUNCTION ' + compiled.original.name + '(' + compiled.original.args + ') '
    + compiled.original.options + 'AS $original_guard$' + compiled.original.body + '$original_guard$;'
  const bodyDigest = `(SELECT to_jsonb(encode(sha256(convert_to(prosrc,'UTF8')),'hex')) FROM pg_proc
    WHERE oid=${literal(HISTORY_GUARD_SIGNATURE)}::regprocedure)`
  const installed = await proof.value<string>(bodyDigest, owner)
  const retained = await proof.value<string>(retainedDigest, owner)
  const base = await proof.value<Journal>(`(SELECT to_jsonb(q) FROM official_v3_jobs_private.queue_operations_v1 q
    WHERE q.job_key=${literal(jobKey)} AND q.envelope_text::jsonb->'expected' IS NOT DISTINCT FROM q.envelope_text::jsonb->'next'
    ORDER BY q.recorded_at,q.operation_id COLLATE "C" LIMIT 1)`, owner)
  assert.ok(base && base.action === 'enqueue', 'the real retained dedup prefix must exist before this proof')
  const method = await proof.value<Record<string, unknown>>(`(SELECT method_binding FROM official_v3_jobs_private.subjects_v1
    WHERE job_key=${literal(jobKey)})`, owner)
  const probeAnchor = '        IF NOT ' + HISTORY_GUARD_MEMBERSHIP
  assert.equal(HISTORY_GUARD_DEDUP.split(probeAnchor).length, 2)
  const countedBlock = HISTORY_GUARD_DEDUP.replace(probeAnchor, () => '        probes:=probes+1;\n' + probeAnchor)
  await proof.run(owner + `CREATE FUNCTION public.local_bg1_membership(items jsonb[],subjects text[],subject_method jsonb)
  RETURNS jsonb LANGUAGE plpgsql AS $probe$
  DECLARE at integer;k text COLLATE "default";last_subject text COLLATE "C";x record;subject_row record;envelope jsonb;
    old_state text;new_state text;old_message text;new_message text;probes integer:=0;hit_before boolean;
    result jsonb:='[]';${HISTORY_GUARD_DECLARATION}
  BEGIN
    IF cardinality(items) IS DISTINCT FROM cardinality(subjects) THEN RAISE EXCEPTION 'probe input mismatch';END IF;
    SELECT subject_method AS method_binding INTO subject_row;
    FOR at IN 1..cardinality(items) LOOP
      k:=subjects[at];
      IF last_subject COLLATE "C" IS DISTINCT FROM k COLLATE "C" THEN
        dedup_member_text:=NULL;last_subject:=k;
      END IF;
      SELECT * INTO x FROM jsonb_populate_record(NULL::official_v3_jobs_private.queue_operations_v1,items[at]);
      envelope:=x.envelope_text::jsonb;
      hit_before:=COALESCE(dedup_member_text IS NOT NULL
        AND dedup_member_text COLLATE "C" = (envelope->'expected')::text COLLATE "C",false);
      old_state:=NULL;new_state:=NULL;old_message:=NULL;new_message:=NULL;
      BEGIN ${HISTORY_GUARD_ORIGINAL_DEDUP}
        EXCEPTION WHEN OTHERS THEN old_state:=SQLSTATE;old_message:=SQLERRM;END;
      BEGIN ${countedBlock}
        EXCEPTION WHEN OTHERS THEN new_state:=SQLSTATE;new_message:=SQLERRM;END;
      IF old_state IS DISTINCT FROM new_state OR old_message IS DISTINCT FROM new_message THEN
        RAISE EXCEPTION 'BG1 membership parity at %, old % %, new % %',at,old_state,old_message,new_state,new_message;END IF;
      IF octet_length(dedup_member_text)>65536 THEN RAISE EXCEPTION 'BG1 membership memo byte cap';END IF;
      result:=result||jsonb_build_array(jsonb_build_object('state',new_state,'message',new_message,
        'probes',probes,'hitBefore',hit_before,'bytes',COALESCE(octet_length(dedup_member_text),0)));
    END LOOP;RETURN result;
  END $probe$;
  CREATE FUNCTION public.local_bg1_complete_check() RETURNS jsonb LANGUAGE plpgsql AS $full$
  BEGIN PERFORM official_v3_guard_private.check_jobs_v1();
    RETURN jsonb_build_object('state',NULL,'message',NULL);
    EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('state',SQLSTATE,'message',SQLERRM);
  END $full$;`, 'exact original and successor BG1 predicate parity, local diagnostic only')
  const envelope = JSON.parse(base.envelope_text) as { expected: Record<string, unknown>; next: Record<string, unknown>; audit: Record<string, unknown> }
  const changedEnvelope = (value: unknown): Journal => ({ ...base, envelope_text: hrs1Canonical(value) })
  const unknownJob = { ...envelope.expected, jobId: 'job3_' + 'f'.repeat(32) }
  assert.notEqual(unknownJob.jobId, envelope.expected.jobId)
  const unknown = changedEnvelope({ ...envelope, expected: unknownJob, next: unknownJob })
  const absentExpected = { ...envelope } as Record<string, unknown>; delete absentExpected.expected
  const oversizedJob = { ...envelope.expected, padding: 'x'.repeat(65537) }
  const numericText = '"revision":' + String(envelope.expected.revision)
  const numeric = { ...base, envelope_text: base.envelope_text.replaceAll(numericText, numericText + '.0') }
  assert.notEqual(numeric.envelope_text, base.envelope_text, 'distinct equivalent JSONB numeric bytes')
  const rows = [
    base, base, { ...base, action: 'fail' },
    changedEnvelope({ ...envelope, audit: { ...envelope.audit, kind: 'enqueued' } }),
    { ...base, authority: { ...base.authority, methodDigest: '0'.repeat(64) } },
    { ...base, recorded_at: 'infinity' },
    unknown, base, base, base, changedEnvelope(absentExpected),
    changedEnvelope({ ...envelope, expected: null, next: null }),
    changedEnvelope({ ...envelope, expected: oversizedJob, next: oversizedJob }), base, numeric, base,
  ]
  const subjects = rows.map((_, at) => at === 8 ? 'research-job:v3:' + 'e'.repeat(64) : jobKey)
  assert.notEqual(subjects[8], jobKey)
  const result = await proof.value<Probe[]>('public.local_bg1_membership(ARRAY[' + rows.map(json).join(',')
    + '],ARRAY[' + subjects.map(literal).join(',') + '],' + json(method) + ')', owner)
  assert.equal(result.length, rows.length)
  assert.equal(result[0].state, null); assert.equal(result[0].probes, 1)
  assert.equal(result[1].state, null); assert.equal(result[1].probes, 1); assert.equal(result[1].hitBefore, true)
  for (const at of [2, 3, 4, 5]) {
    assert.equal(result[at].state, 'P7905'); assert.equal(result[at].hitBefore, true)
    assert.equal(result[at].probes, 1, 'every invalid row is rejected before the warm membership hit')
  }
  assert.equal(result[6].state, 'P7905'); assert.equal(result[6].probes, 2)
  assert.equal(result[7].state, null); assert.equal(result[7].probes, 2)
  assert.equal(result[8].state, 'P7905'); assert.equal(result[8].probes, 3); assert.equal(result[8].hitBefore, false)
  assert.equal(result[9].state, null); assert.equal(result[9].probes, 4); assert.equal(result[9].hitBefore, false)
  for (const at of [10, 11, 12]) {
    assert.equal(result[at].state, 'P7905'); assert.equal(result[at].probes, at - 5)
    assert.equal(result[at].bytes, result[9].bytes, 'a refused or oversized input cannot replace the positive slot')
  }
  assert.equal(result[13].state, null); assert.equal(result[13].probes, 7); assert.equal(result[13].hitBefore, true)
  assert.equal(result[14].state, null); assert.equal(result[14].probes, 8); assert.equal(result[14].hitBefore, false)
  assert.equal(result[15].state, null); assert.equal(result[15].probes, 9); assert.equal(result[15].hitBefore, false)

  // One real corrupted retained row: both jobs remain individually valid and
  // their original transition check must pass, but no complete-chain node is
  // their witness. This mutation and its immutable-trigger change are confined
  // to the owned throwaway backend and roll back with each A/B definition.
  const corrupt = `SET LOCAL jetnity.local_quota_fixture='owned-local-pg17-only';
    DO $owned$ BEGIN IF current_user<>'ot_pilot_owner' OR current_database()<>'postgres'
      OR current_setting('server_version_num')::integer/10000<>17
      OR current_setting('jetnity.local_quota_fixture',true)<>'owned-local-pg17-only'
      THEN RAISE EXCEPTION 'owned local negative fixture only';END IF;END $owned$;
    ALTER TABLE official_v3_jobs_private.queue_operations_v1 DISABLE TRIGGER guard_row_v1;
    UPDATE official_v3_jobs_private.queue_operations_v1 SET envelope_text=${literal(unknown.envelope_text)}
      WHERE operation_id=${literal(base.operation_id)};
    ALTER TABLE official_v3_jobs_private.queue_operations_v1 ENABLE TRIGGER guard_row_v1;
    SELECT official_v3_jobs_private.assert_history_v1(${literal(jobKey)});`
  for (const definition of [originalSql, compiled.sql]) {
    const valid = await proof.value<Outcome>('public.local_bg1_complete_check()', owner + 'BEGIN;' + definition, 'ROLLBACK;')
    assert.deepEqual(valid, { state: null, message: null })
    const invalid = await proof.value<Outcome>('public.local_bg1_complete_check()', owner + 'BEGIN;' + definition + corrupt, 'ROLLBACK;')
    assert.deepEqual(invalid, { state: 'P7905', message: 'bg1 deduplicated jobs chain' })
    assert.equal(await proof.value<string>(retainedDigest, owner), retained, 'all original retained bytes survive the negative probe')
    assert.equal(await proof.value<string>(bodyDigest, owner), installed, 'each diagnostic function replacement rolls back completely')
  }
  return { vectors: result.length, warmMembershipHit: true, rowRefusalsAfterWarmHit: 4,
    unknownAndSubjectRefusals: 2, exactNumericByteMisses: 2, completeGuardComparisons: 4 }
}
