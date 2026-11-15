// Exact offline inlining of the original pure job validator. Its complete
// validation remains; only an exact, bounded subject result may be reused.
import assert from 'node:assert/strict'

function once(value, before, after) {
  assert.equal(value.split(before).length, 2, 'exact job validator anchor: ' + before.slice(0, 100))
  return value.replace(before, () => after)
}
const research = "jsonb_build_object('context',v->'context','method',v->'method','factKind',v#>'{research,factKind}','researchReason',v#>'{research,researchReason}')"
const discovery = "(v->'identity')-'kind'-'jobKey'"

function subjectMemo(kind, input) {
  return `    job_subject_input:=${input}; job_subject_text:=job_subject_input::text;
    IF memo_subject_kind COLLATE "C" = '${kind}' COLLATE "C"
      AND memo_subject_text COLLATE "C" = job_subject_text COLLATE "C" THEN
      i:=memo_subject_result;
    ELSE
      i:=official_v3_jobs_private.subject_v1('${kind}',job_subject_input);
      job_subject_bytes:=octet_length('${kind}')+octet_length(job_subject_text);
      IF job_subject_bytes<=1048576 AND octet_length(i::text)<=1048576-job_subject_bytes THEN
        memo_subject_kind:='${kind}'; memo_subject_text:=job_subject_text; memo_subject_result:=i;
      END IF;
    END IF;`
}

export function historyJobValidationBlock(originalBody, input, assignment) {
  assert.ok(['s.current_job', 'current_record', 'n', 'probe_input'].includes(input))
  assert.ok(['NULL;', 'expected:=v;', 'n:=v;', 'probe_result:=v;'].includes(assignment))
  let body = originalBody.trim()
  assert.ok(body.startsWith('DECLARE ') && body.endsWith('\nEND'))
  body = once(body, 'DECLARE ', 'DECLARE v jsonb:=' + input + ';\n'
    + '  job_subject_input jsonb; job_subject_text text COLLATE "C"; job_subject_bytes integer;\n  ')
  // job_v1(jsonb) has no collatable input. Preserve its database-default locals
  // when its body is nested in assert_history_v1(text), whose input may collate.
  body = once(body, 'common text[]:=', 'common text[] COLLATE "default":=')
  body = once(body, 'state text:=', 'state text COLLATE "default":=')
  body = once(body, "    i:=official_v3_jobs_private.subject_v1('rule_research'," + research + ');', subjectMemo('rule_research', research))
  body = once(body, "    i:=official_v3_jobs_private.subject_v1('combination_discovery'," + discovery + ');', subjectMemo('combination_discovery', discovery))
  body = once(body, '  RETURN v;', '  ' + assignment)
  return body + ';'
}

export function inlineHistoryJobs(historyBody, originalJobBody) {
  let body = historyBody
  for (const [call, input, assignment] of [
    ['PERFORM official_v3_jobs_private.job_v1(s.current_job);', 's.current_job', 'NULL;'],
    ['expected:=official_v3_jobs_private.job_v1(current_record);', 'current_record', 'expected:=v;'],
    ['n:=official_v3_jobs_private.job_v1(n);', 'n', 'n:=v;'],
  ]) body = once(body, call, historyJobValidationBlock(originalJobBody, input, assignment))
  assert.equal(body.includes('official_v3_jobs_private.job_v1('), false, 'all three exact job checks are fully inlined')
  return body
}
