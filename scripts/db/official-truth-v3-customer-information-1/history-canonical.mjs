// Invocation-local byte reuse only. Every miss uses the original serializer at
// its actual depth; the two shallow object levels preserve its primitive rules.
import assert from 'node:assert/strict'
import { historyFixedCanonicalBlock } from './history-canonical-fixed.mjs'
import { historyCommandCanonicalBlock } from './history-command-canonical.mjs'
import { historyAttemptCanonicalBlock } from './history-attempt-canonical.mjs'

export const HISTORY_CANONICAL_DECLARATION = `
  subtree_memo jsonb:='{}'; subtree_memo_count integer:=0; subtree_memo_bytes integer:=0;
  attempt_canonical text COLLATE "default"; audit_canonical text COLLATE "default"; claim_canonical text COLLATE "default";`

export function historyCanonicalBlock(value, depth, target, levels = 2, level = 0, fixedShapes) {
  assert.ok(levels === 1 || levels === 2)
  const p = 'hc' + level
  const inner = levels === 2 ? historyCanonicalBlock(p + '_child', p + '_depth+1', p + '_text', 1, level + 1,
    fixedShapes === undefined ? undefined : [])
    : p + '_text:=official_v3_jobs_private.canonical_v1(' + p + '_child,' + p + '_depth+1);'
  return `DECLARE ${p}_value jsonb:=${value}; ${p}_depth integer:=${depth};
  ${p}_keys text[] COLLATE "default"; ${p}_values jsonb[]; ${p}_parts text[] COLLATE "default";
  ${p}_pending integer[]; ${p}_at integer; ${p}_member text COLLATE "default"; ${p}_child jsonb;
  ${p}_text text COLLATE "default"; ${p}_key text COLLATE "C"; ${p}_bytes bigint; ${p}_fast text COLLATE "default";
BEGIN
  IF ${p}_value IS NULL OR ${p}_depth IS NULL OR ${p}_depth<0 OR ${p}_depth>24 THEN
    RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(${p}_value)<>'object' THEN
    CASE jsonb_typeof(${p}_value)
      WHEN 'string' THEN
        IF (${p}_value#>>'{}') ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        ${target}:=${p}_value::text;
      WHEN 'number' THEN
        IF ${p}_value::numeric<>trunc(${p}_value::numeric) OR ${p}_value::numeric NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';END IF;
        ${target}:=trunc(${p}_value::numeric)::text;
      WHEN 'boolean' THEN ${target}:=${p}_value::text;
      WHEN 'null' THEN ${target}:='null';
      ELSE ${target}:=official_v3_jobs_private.canonical_v1(${p}_value,${p}_depth);
    END CASE;
  ELSE
    ${historyFixedCanonicalBlock(p + '_value', p + '_depth', p + '_fast', fixedShapes)}
    IF ${p}_fast IS NOT NULL THEN ${target}:=${p}_fast;
    ELSE
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(CASE WHEN j.key ~ '[^ -~]' OR ${p}_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text WHEN 'null' THEN 'null'
          ELSE CASE WHEN j.key IN ('context','method','research','identity','subject','authority')
            THEN subtree_memo->>((${p}_depth+1)::text||':'||j.value::text) END END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO ${p}_keys,${p}_values,${p}_parts FROM jsonb_each(${p}_value) j;
    ${p}_pending:=array_positions(${p}_parts,NULL::text);
    FOREACH ${p}_at IN ARRAY ${p}_pending LOOP
      ${p}_member:=${p}_keys[${p}_at]; ${p}_child:=${p}_values[${p}_at];
      IF ${p}_member ~ '[^ -~]' OR ${p}_depth+1>24 THEN
        RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      IF ${p}_member IN ('context','method','research','identity','subject','authority') THEN
        -- JSONB object lookup compares the complete depth-prefixed text key,
        -- never JSONB equality of the source value or an abbreviated digest.
        ${p}_key:=(${p}_depth+1)::text||':'||${p}_child::text;
        IF subtree_memo ? ${p}_key THEN ${p}_text:=subtree_memo->>${p}_key;
        ELSE
          ${p}_text:=official_v3_jobs_private.canonical_v1(${p}_child,${p}_depth+1);
          ${p}_bytes:=octet_length(${p}_key)::bigint+octet_length(${p}_text)::bigint;
          IF ${p}_bytes<=16384 THEN
            IF subtree_memo_count>=8 OR ${p}_bytes>16384-subtree_memo_bytes THEN
              subtree_memo:='{}';
              subtree_memo_count:=0; subtree_memo_bytes:=0;
            END IF;
            subtree_memo:=subtree_memo||jsonb_build_object(${p}_key,${p}_text);
            subtree_memo_count:=subtree_memo_count+1; subtree_memo_bytes:=subtree_memo_bytes+${p}_bytes::integer;
          END IF;
        END IF;
      ELSE
        ${inner}
      END IF;
      ${p}_parts[${p}_at]:=to_jsonb(${p}_member)::text||':'||${p}_text;
    END LOOP;
    ${target}:='{'||array_to_string(${p}_parts,',')||'}';
    END IF;
  END IF;
END;`
}

function once(value, before, after) {
  assert.equal(value.split(before).length, 2, 'exact canonical source anchor: ' + before.slice(0, 100))
  return value.replace(before, () => after)
}
export function optimizeHistoryCanonical(historyBody) {
  let body = once(historyBody, '  canonical_memo_bytes_one integer:=0; canonical_memo_bytes_two integer:=0;',
    '  canonical_memo_bytes_one integer:=0; canonical_memo_bytes_two integer:=0;' + HISTORY_CANONICAL_DECLARATION)
  body = once(body, 'Two exact-text entries share a 64KiB key+value cap. No validation is skipped.',
    'Two exact-text entries share 32KiB; exact-depth canonical and node subtrees each share 16KiB. No validation is skipped.')
  body = once(body, 'IF child_bytes<=65536 THEN', 'IF child_bytes<=32768 THEN')
  body = once(body, 'IF child_bytes+canonical_memo_bytes_two<=65536 THEN', 'IF child_bytes+canonical_memo_bytes_two<=32768 THEN')
  const jobDeclaration = '  job_subject_input jsonb; job_subject_text text COLLATE "C"; job_subject_bytes integer;'
  assert.equal(body.split(jobDeclaration).length, 4)
  body = body.replaceAll(jobDeclaration, jobDeclaration + '\n  job_canonical_text text COLLATE "default";')
  const originalJobCheck = "  IF v IS NULL OR official_v3_jobs_private.nodes_v1(v,0,16,8192)<0 OR octet_length(official_v3_jobs_private.canonical_v1(v,0))>65536 THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;"
  const checkedJob = "  IF v IS NULL OR official_v3_jobs_private.nodes_v1(v,0,16,8192)<0 THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;\n"
    + historyCanonicalBlock('v', '0', 'job_canonical_text', 2, 0, ['research', 'discovery'])
    + "\n  IF octet_length(job_canonical_text)>65536 THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;"
  assert.equal(body.split(originalJobCheck).length, 4)
  body = body.replaceAll(originalJobCheck, checkedJob)
  body = once(body, '      t:=official_v3_jobs_private.canonical_v1(v,0);', historyCommandCanonicalBlock('v', '0', 't')
    + '\nIF t IS NULL THEN\n' + historyCanonicalBlock('v', '0', 't', 2, 0, []) + '\nEND IF;')
  body = once(body, '              child_canonical:=official_v3_jobs_private.canonical_v1(child_value,1);',
    historyCanonicalBlock('child_value', '1', 'child_canonical', 2, 0, ['research', 'discovery']))
  body = once(body, '            child_canonical:=official_v3_jobs_private.canonical_v1(child_value,1);',
    historyCanonicalBlock('child_value', '1', 'child_canonical', 2, 0, ['audit']))
  const audit = "      IF commit->'next' IS DISTINCT FROM n OR official_v3_jobs_private.timestamp_v1(commit->>'notAfter')<>end_time\n"
    + "        OR a IS DISTINCT FROM jsonb_build_object('reference','queue-event:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object('op',i->'operationId','command',c->'commandKey'),0),'UTF8')),'hex'),"
  body = once(body, audit,
    "      IF commit->'next' IS DISTINCT FROM n OR official_v3_jobs_private.timestamp_v1(commit->>'notAfter')<>end_time THEN\n"
    + "        RAISE EXCEPTION 'm04 transition mismatch' USING ERRCODE='P7601';END IF;\n"
    + historyCanonicalBlock("jsonb_build_object('op',i->'operationId','command',c->'commandKey')", '0', 'audit_canonical', 2, 0, ['auditPreimage'])
    + "\n      IF a IS DISTINCT FROM jsonb_build_object('reference','queue-event:v3:'||encode(sha256(convert_to(audit_canonical,'UTF8')),'hex'),")
  const attempt = "      OR x.attempt_key IS DISTINCT FROM 'execution-attempt:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object(\n"
    + "        'subject',s.subject_text::jsonb,'claim',x.claim_text::jsonb,'leasedJob',x.leased_job,'authority',x.authority),0),'UTF8')),'hex')"
  const attemptValue = "jsonb_build_object('subject',s.subject_text::jsonb,'claim',x.claim_text::jsonb,'leasedJob',x.leased_job,'authority',x.authority)"
  body = once(body, attempt, " THEN RAISE EXCEPTION 'm04 attempt invariant' USING ERRCODE='P7603'; END IF;\n"
    + historyAttemptCanonicalBlock(attemptValue, '0', 'attempt_canonical')
    + '\nIF attempt_canonical IS NULL THEN\n' + historyCanonicalBlock(attemptValue, '0', 'attempt_canonical', 2, 0, []) + '\nEND IF;'
    + "\n    IF x.attempt_key IS DISTINCT FROM 'execution-attempt:v3:'||encode(sha256(convert_to(attempt_canonical,'UTF8')),'hex')")
  body = once(body, '      OR x.claim_text IS DISTINCT FROM official_v3_jobs_private.canonical_v1(x.claim_text::jsonb,0)',
    " THEN RAISE EXCEPTION 'm04 attempt invariant' USING ERRCODE='P7603'; END IF;\n"
    + historyCanonicalBlock('x.claim_text::jsonb', '0', 'claim_canonical', 2, 0, ['claim'])
    + '\n    IF x.claim_text IS DISTINCT FROM claim_canonical')
  return body
}
