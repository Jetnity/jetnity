// Offline, exact Dev Cycle4 Attempt3 sender successor. No database, HTTP, audit, tick,
// activation or external CI/Ready claim is performed by this compiler.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { compileDevTerminalCycle3Review, REVIEW as priorReview,
  evidenceQuery as priorEvidenceQuery } from '../official-truth-v3-dev-terminal-cycle3-review-1/build.mjs'
import { evidenceQuery as cycle2EvidenceQuery } from '../official-truth-v3-dev-terminal-cycle-review-1/build.mjs'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const hash = value => createHash('sha256').update(value).digest('hex')
const literal = value => "'" + String(value).replaceAll("'", "''") + "'"
const json = value => literal(JSON.stringify(value)) + '::jsonb'
const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
  : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}'
    : JSON.stringify(value)
const rootClaim = Object.freeze({ jobKey: 'research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513',
  operationId: 'op3_2b7811ed9b5f488cbffcd09a0ec0409b', leaseId: 'lease3_491cf756e95d47e0892613c0e81c556b', leaseMilliseconds: 30000 })
const continuationInput = [rootClaim.operationId, rootClaim.leaseId, rootClaim.jobKey, '2'].join('\n')
const continuationId = kind => hash('jetnity.ch-de-claim-continuation.' + kind + '.v1\n' + continuationInput).slice(0, 32)
export const REVIEW = Object.freeze({
  target: 'dev:yfvbxvijcorffwxbxahl:terminal-cycle4-attempt2-v1',
  ack: 'full-ci-ready-preview-and-normal-ui-verified-cycle4-attempt2-v1',
  subject: rootClaim.jobKey, job: 'job3_c70d23ff344cdf2998818ecf5243d15e',
  enqueue: 'op3_91a38dc806d3f21bac3d9d16493c6be6',
  attempt: 'execution-attempt:v3:2fe5321b98827f44835f830b9c923735fab5e2a07cb1354952b516c2b035be99',
  intake: 'op3_e062b171cbf4958094a86366d013a73d',
  originalClaim: rootClaim,
  failedClaim: Object.freeze({ ...rootClaim, operationId: 'op3_aa4029549e0cf99ec5d882752e492713', leaseId: 'lease3_61fea9f1b961deb3301791adb8a3bfa4' }),
  followupClaim: Object.freeze({ ...rootClaim, operationId: 'op3_' + continuationId('operation'), leaseId: 'lease3_' + continuationId('lease') }),
  originalEvidenceSha256: '7debd26332c22a3b675280fb5401fd3116f80c0ba9b633c76a4883ab4a48d113',
  priorOriginalEvidenceSha256: '5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14',
  priorSqlSha256: '3ba60a5202c58c8653e2f7da3a20ca67a2223e83e02554f052fc05f099ead8ce',
  priorRuntimeCommit: '8ed4778002f058e9bba6e98c58283140085064f3',
  priorTickSha256: '354a5727d1e7f872e42cdda0e56f3f6411ccdf94993a9b9363429ea247e65dbe',
  runtimePins: Object.freeze([
    Object.freeze({ path: 'lib/readiness/official-truth-product-v3/source/aa-ch-de-issuer.ts', bytes: 31148, sha256: '3f875d2455f11888aaa944086f8a624b2c1c443fd42db73ce0f2778c1ba9e1aa' }),
    Object.freeze({ path: 'lib/readiness/official-truth-product-v3/result/source-proof.ts', bytes: 30507, sha256: '3a463613442d58e3fa11344dfaf5c06677a0e16718d3b22ec587948184702466' }),
    Object.freeze({ path: 'lib/readiness/official-truth-product-v3/result/ch-de-import-frame.ts', bytes: 9754, sha256: 'e27dc02031590c9088cfd298037690301fcc273092341c356f882f6eb42c24a4' }),
    Object.freeze({ path: 'lib/readiness/official-truth-product-v3/result/composition.ts', bytes: 14828, sha256: '07410b4795edfd793ec7dd0a1ede00445d29a059da4c43f31db484049aa1e4f2' }),
    Object.freeze({ path: 'lib/readiness/official-truth-product-v3/jobs/selected-claim.ts', bytes: 18328, sha256: '29be658ca64918c1f7d2d8f50041eca2395b5ccbbfd787dd988a7ea463914dd1' }),
    Object.freeze({ path: 'lib/readiness/official-truth-product-v3/runtime/ch-de-server.ts', bytes: 3931, sha256: 'f3f69481b1e158a4db5dbe57cbc79c4a458e2bf83c6a8224d9aad126e1ba3176' }),
    Object.freeze({ path: 'lib/readiness/official-truth-product-v3/runtime/ch-de-source-admission.ts', bytes: 1293, sha256: 'ed61adeaef389f0f946af4d35dc456ef4b3470f46fe1a2377aec94fa83e860ae' }),
    Object.freeze({ path: 'app/api/internal/readiness/ch-de-visa-tick/route.ts', bytes: 2572, sha256: '91ab59b1fb9091fa8bfc6fb2f68e1847632a0a71684ca0e885c9e41e2810362c' }),
  ]),
})
export const originalEvidence = JSON.parse(read('./original-evidence.json'))
const priorOriginalEvidence = JSON.parse(read('../official-truth-v3-dev-cycle4-recovery-1/original-evidence.json'))

// PostgreSQL JSONB key order and six-digit UTC timestamps, without losing the
// microseconds in the original readback through JavaScript Date conversion.
function pgJson(value) {
  if (Array.isArray(value)) return '[' + value.map(pgJson).join(', ') + ']'
  if (value && typeof value === 'object') return '{' + Object.keys(value)
    .sort((a, b) => Buffer.byteLength(a) - Buffer.byteLength(b) || Buffer.compare(Buffer.from(a), Buffer.from(b)))
    .map(key => JSON.stringify(key) + ': ' + pgJson(value[key])).join(', ') + '}'
  return JSON.stringify(value)
}
function utc(value) {
  if (value === null) return null
  const matched = /^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.(\d{1,6}))?(?:Z|\+00:00)$/.exec(value)
  assert.ok(matched, 'exact captured UTC timestamp required')
  return matched[1] + '.' + (matched[2] ?? '').padEnd(6, '0') + 'Z'
}
export const evidenceQuery = `(SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=4),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=4)))`
const digest = expression => `encode(sha256(convert_to((${expression})::text,'UTF8')),'hex')`
const row = (alias, timestamp) => `to_jsonb(${alias})||jsonb_build_object('${timestamp}',extract(epoch FROM ${alias}.${timestamp}))`
const allChecks = `
  PERFORM official_v3_guard_private.require_open_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();`
const runtimeSessions = `EXISTS(SELECT 1 FROM pg_stat_activity WHERE pid<>pg_backend_pid()
  AND usename IN ('ot_v3_method_transport_login','ot_v3_intake_transport_login','ot_v3_jobs_transport_login',
    'ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'))`
const stoppedSender = `EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.state_v1 WHERE singleton AND NOT enabled)
    AND EXISTS(SELECT 1 FROM cron.job WHERE jobid=5 AND jobname='jetnity-ch-de-dev-import-v1' AND NOT active
      AND command='SELECT jetnity_dev_import_scheduler.run_v1();' AND database='postgres' AND username='postgres'
      AND nodename='localhost' AND nodeport=5432 AND schedule='* * * * *')`

// Both queries bind immutable historical rows. They deliberately do not depend
// on the later current head, so an approved Cycle4 remains historical evidence
// when a subsequent normal cycle advances the queue or publishes another rule.
const priorRetirementQuery = `(SELECT jsonb_build_object('retirement',${row('r', 'retired_at')},'owner',${row('o', 'recorded_at')})
 FROM official_v3_guard_private.retired_cycle4_attempts_v1 r
 JOIN official_v3_guard_private.owner_operations_v1 o ON o.operation_id=r.owner_operation_id
 WHERE r.attempt_key='${priorOriginalEvidence.start.attempt_key}' AND r.job_key='${REVIEW.subject}'
   AND r.claim_operation_id='${rootClaim.operationId}' AND r.intake_operation_id='${priorOriginalEvidence.intake.operation_id}'
   AND r.before_state->>'kind'='ch_de_cycle4_unknown'
   AND r.before_state->>'originalEvidenceDigest'='${REVIEW.priorOriginalEvidenceSha256}'
   AND r.before_state#>'{job,subjectState}'=${json(priorOriginalEvidence.subject)}
   AND o.action='retire_unknown' AND o.recorded_at=r.retired_at
   AND o.expected_digest=${digest('r.before_state')}
   AND o.receipt=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
     'operationId',o.operation_id,'selection',o.expected_digest,'result','unknown_retired',
     'recordedAt',to_char(o.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
   AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=r.attempt_key)
   AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=r.attempt_key))`
const retirementQuery = `(SELECT jsonb_build_object('retirement',${row('r', 'retired_at')},'owner',${row('o', 'recorded_at')})
 FROM official_v3_guard_private.retired_cycle4_attempt2_v1 r
 JOIN official_v3_guard_private.owner_operations_v1 o ON o.operation_id=r.owner_operation_id
 WHERE r.attempt_key='${REVIEW.attempt}' AND r.job_key='${REVIEW.subject}'
   AND r.claim_operation_id='${REVIEW.failedClaim.operationId}' AND r.intake_operation_id='${REVIEW.intake}'
   AND r.before_state->>'kind'='ch_de_cycle4_attempt2_unknown'
   AND r.before_state->>'originalEvidenceDigest'='${REVIEW.originalEvidenceSha256}'
   AND r.before_state#>'{job,subjectState}'=${json(originalEvidence.subject)}
   AND o.action='retire_unknown' AND o.recorded_at=r.retired_at
   AND o.expected_digest=${digest('r.before_state')}
   AND o.receipt=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
     'operationId',o.operation_id,'selection',o.expected_digest,'result','unknown_retired',
     'recordedAt',to_char(o.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
   AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=r.attempt_key)
   AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=r.attempt_key))`
const continuationQuery = `(SELECT jsonb_build_object(
 'start',${row('continued_start', 'reserved_at')},'result',${row('r', 'prepared_at')},
 'disposition',${row('d', 'settled_at')},'complete',${row('q', 'recorded_at')},
 'version',${row('v', 'committed_at')},'projection',${row('continued_projection', 'published_at')},
 'publication',${row('pub', 'recorded_at')})
 FROM official_v3_jobs_private.execution_starts_v1 continued_start
 JOIN official_v3_jobs_private.execution_results_v1 r ON r.attempt_key=continued_start.attempt_key
 JOIN official_v3_jobs_private.execution_dispositions_v1 d ON d.attempt_key=continued_start.attempt_key
 JOIN official_v3_jobs_private.queue_operations_v1 q ON q.operation_id=d.queue_operation_id
 JOIN official_v3_result_private.versions_v1 v ON v.decision_ref=r.result->>'decisionRef'
 JOIN official_v3_result_private.projections_v1 continued_projection ON continued_projection.version_ref=v.reference
 JOIN official_v3_result_private.operations_v1 pub ON pub.operation_kind='publication'
   AND pub.operation_id=v.prepared#>>'{transition,operationId}'
 WHERE continued_start.job_key='${REVIEW.subject}' AND continued_start.claim_operation_id='${REVIEW.followupClaim.operationId}'
   AND continued_start.claim_text=${literal(canonical(REVIEW.followupClaim))}
   AND continued_start.leased_job->>'jobId'='${REVIEW.job}' AND continued_start.leased_job->>'operationId'='${REVIEW.enqueue}'
   AND continued_start.leased_job->'attempt'='3'::jsonb AND continued_start.leased_job->'revision'='43'::jsonb
   AND continued_start.leased_job->'predecessorRevision'='42'::jsonb
   AND continued_start.leased_job#>>'{lease,leaseId}'='${REVIEW.followupClaim.leaseId}'
   AND r.result->>'kind'='rule_research' AND r.result->>'jobId'='${REVIEW.job}'
   AND r.result->>'operationId'='${REVIEW.enqueue}' AND r.result->>'jobKey'='${REVIEW.subject}'
   AND d.kind='completed' AND d.failure_reason IS NULL AND q.action='complete' AND q.job_key='${REVIEW.subject}'
   AND q.envelope_text::jsonb#>>'{next,jobId}'='${REVIEW.job}'
   AND q.envelope_text::jsonb#>>'{next,operationId}'='${REVIEW.enqueue}'
   AND q.envelope_text::jsonb#>'{next,attempt}'='3'::jsonb
   AND q.envelope_text::jsonb#>'{next,revision}'='44'::jsonb
   AND q.envelope_text::jsonb#>>'{next,state}'='succeeded'
   AND q.envelope_text::jsonb#>'{next,lease}'='null'::jsonb
   AND q.envelope_text::jsonb#>>'{next,resultDecisionRef}'=r.result->>'decisionRef'
   AND v.revision>=7 AND continued_projection.record->'rule'=v.prepared->'version'
   AND continued_projection.verification_ref=v.verification_ref
   AND pub.command->'prepared'=v.prepared AND pub.command->'projection'=continued_projection.record
   AND pub.command->>'verificationRef'=v.verification_ref
   AND pub.result->>'versionRef'=v.reference AND pub.result->>'projectionRef'=continued_projection.reference
   AND r."references" @> jsonb_build_array(pub.command->'intake')
   AND pub.command#>>'{intake,binding,jobId}'='${REVIEW.job}')`

export function compileDevTerminalCycle4Attempt2Review() {
  assert.equal(hash(read('./original-evidence.json')), REVIEW.originalEvidenceSha256)
  assert.equal(hash(read('../official-truth-v3-dev-cycle4-recovery-1/original-evidence.json')), REVIEW.priorOriginalEvidenceSha256)
  for (const pin of REVIEW.runtimePins) {
    const source = read('../../../' + pin.path)
    assert.equal(Buffer.byteLength(source), pin.bytes, 'exact current reviewed source length: ' + pin.path)
    assert.equal(hash(source), pin.sha256, 'exact current reviewed source: ' + pin.path)
  }
  assert.equal(originalEvidence.project, 'yfvbxvijcorffwxbxahl')
  assert.equal(originalEvidence.cycle.id, 4); assert.equal(originalEvidence.cycle.state, 'blocked')
  assert.equal(originalEvidence.cycle.phase, 'resume'); assert.equal(originalEvidence.cycle.phase_attempts, 8)
  assert.equal(originalEvidence.cycle.last_status, 'retry_budget_exhausted'); assert.equal(originalEvidence.cycle.published, 0)
  assert.equal(originalEvidence.cycle.operation_id, rootClaim.operationId)
  assert.equal(originalEvidence.cycle.lease_id, rootClaim.leaseId)
  assert.deepEqual(JSON.parse(originalEvidence.start.claim_text), REVIEW.failedClaim)
  assert.equal(originalEvidence.start.attempt_key, REVIEW.attempt)
  assert.equal(originalEvidence.subject.current_job.jobId, REVIEW.job)
  assert.equal(originalEvidence.subject.current_job.operationId, REVIEW.enqueue)
  assert.equal(originalEvidence.subject.current_job.revision, 42)
  assert.equal(originalEvidence.subject.current_job.attempt, 2)
  assert.deepEqual(originalEvidence.cycle, priorOriginalEvidence.cycle)
  assert.deepEqual(originalEvidence.dispatches, priorOriginalEvidence.dispatches)
  assert.equal(originalEvidence.intake.operation_id, REVIEW.intake)
  assert.deepEqual(originalEvidence.dispatches.map(row => [row.id, row.phase, row.outcome]),
    [[21, 'start', 'queued'], ...Array.from({ length: 8 }, (_, i) => [22 + i, 'resume', 'unresolved'])])
  const observed = { cycle: { ...originalEvidence.cycle, created_at: utc(originalEvidence.cycle.created_at),
    finished_at: utc(originalEvidence.cycle.finished_at) }, dispatches: originalEvidence.dispatches.map(row => ({ ...row,
    dispatched_at: utc(row.dispatched_at), processed_at: utc(row.processed_at) })) }
  const evidenceHash = hash(pgJson(observed)), evidenceHashExpression = digest(evidenceQuery)
  const prior = compileDevTerminalCycle3Review()
  const oldSql = read('../official-truth-v3-dev-terminal-cycle3-review-1/review-cycle3.sql')
  assert.equal(hash(oldSql), REVIEW.priorSqlSha256, 'applied Cycle3 SQL is immutable')
  assert.equal(prior.migration, oldSql, 'historical archive reproduces the unchanged Cycle3 SQL')
  const oldBody = /AS \$tick\$([\s\S]*?)\$tick\$;/.exec(oldSql)?.[1]; assert.ok(oldBody)
  const oldHash = hash(oldBody); assert.equal(oldHash, REVIEW.priorTickSha256)
  const priorHashExpression = digest(priorEvidenceQuery)
  const priorReviewValid = `EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1 r
    WHERE r.cycle_id=3 AND r.evidence_digest=${literal(prior.evidenceHash)}
      AND r.evidence_digest=${priorHashExpression} AND r.prior_cycle2_evidence_digest=${literal(prior.priorDigest)}
      AND r.queue_fix_sha256='${priorReview.queueFix}' AND r.composition_fix_sha256='${priorReview.compositionFix}'
      AND r.result_composition_fix_sha256='${priorReview.resultCompositionFix}'
      AND r.import_service_fix_sha256='${priorReview.importServiceFix}' AND r.quarantine_fix_sha256='${priorReview.quarantineFix}'
      AND r.job_contract_fix_sha256='${priorReview.jobContractFix}' AND r.job_storage_fix_sha256='${priorReview.jobStorageFix}'
      AND r.worker_authority_fix_sha256='${priorReview.workerAuthorityFix}' AND r.selected_claim_fix_sha256='${priorReview.selectedClaimFix}'
      AND r.method_authority_fix_sha256='${priorReview.methodAuthorityFix}' AND r.owned_scope_fix_sha256='${priorReview.ownedScopeFix}'
      AND r.owned_session_fix_sha256='${priorReview.ownedSessionFix}' AND r.executors_fix_sha256='${priorReview.executorsFix}')`
  const cycle2Exception = `EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1 reviewed
        WHERE reviewed.cycle_id=blocked.id AND reviewed.evidence_digest=${literal(prior.priorDigest)}
          AND reviewed.evidence_digest=${digest(cycle2EvidenceQuery)})`
  const cycle3Exception = `EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1 reviewed
        WHERE reviewed.cycle_id=blocked.id AND reviewed.evidence_digest=${literal(prior.evidenceHash)}
          AND reviewed.prior_cycle2_evidence_digest=${literal(prior.priorDigest)}
          AND reviewed.evidence_digest=${priorHashExpression})`
  const oldClause = `IF NOT ${prior.priorReviewValid} OR EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.cycles_v1 blocked WHERE blocked.state='blocked'
      AND NOT ${cycle2Exception}
      AND NOT ${cycle3Exception}) THEN`
  assert.equal(oldBody.split(oldClause).length, 2, 'exact applied Cycle3 exception, with no changed predicate')
  const retirementHash = digest(retirementQuery), priorRetirementHash = digest(priorRetirementQuery), continuationHash = digest(continuationQuery)
  const currentReviewValid = `EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1 reviewed
        WHERE reviewed.cycle_id=4 AND reviewed.evidence_digest=${literal(evidenceHash)}
          AND reviewed.evidence_digest=${evidenceHashExpression}
          AND reviewed.original_evidence_sha256='${REVIEW.originalEvidenceSha256}'
          AND reviewed.prior_original_evidence_sha256='${REVIEW.priorOriginalEvidenceSha256}'
          AND reviewed.prior_cycle3_evidence_digest=${literal(prior.evidenceHash)}
          AND reviewed.runtime_source_pins=${json(REVIEW.runtimePins)}
          AND reviewed.retirement_digest=${retirementHash}
          AND reviewed.prior_retirement_digest=${priorRetirementHash}
          AND reviewed.continuation_digest=${continuationHash})`
  const newClause = `IF NOT ${prior.priorReviewValid} OR NOT ${priorReviewValid}
    OR EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.cycles_v1 blocked WHERE blocked.state='blocked'
      AND NOT ${cycle2Exception}
      AND NOT ${cycle3Exception}
      AND NOT (blocked.id=4 AND ${currentReviewValid})) THEN`
  const newBody = oldBody.replace(oldClause, () => newClause), newHash = hash(newBody)
  const migration = `-- Exact Dev Cycle4 Attempt3 review. Original blocked cycle, dispatches and both unknown
-- STARTs remain intact. CI/Ready/UI declarations are external operator facts;
-- the DB independently requires actual Owner retirement and bound publication.
-- This migration does not audit, tick, enable the sender or enable cron.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL datestyle='ISO, YMD';
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='2s';
CREATE TEMP TABLE cycle4_attempt2_review_before(kind text PRIMARY KEY,value jsonb NOT NULL) ON COMMIT DROP;
DO $preflight$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; p pg_proc%ROWTYPE; t record; rows_digest text;
  quota jsonb; retired jsonb; prior_retired jsonb; continued jsonb; current_head official_v3_result_private.heads_v1%ROWTYPE;
BEGIN
  IF session_user<>'postgres' OR current_user<>'postgres' OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17
    OR current_setting('jetnity.dev_terminal_cycle4_attempt2_review_target',true) IS DISTINCT FROM '${REVIEW.target}'
    OR current_setting('jetnity.dev_terminal_cycle4_attempt2_review_ack',true) IS DISTINCT FROM '${REVIEW.ack}'
    OR (current_setting('jetnity.dev_terminal_cycle4_attempt2_review_commit',true) ~ '^[a-f0-9]{40}$') IS NOT TRUE
    OR (current_setting('jetnity.dev_terminal_cycle4_attempt2_review_deployment',true) ~ '^dpl_[A-Za-z0-9]{20,64}$') IS NOT TRUE
    OR (current_setting('jetnity.dev_terminal_cycle4_attempt2_review_ci_run',true) ~ '^[1-9][0-9]{0,17}$') IS NOT TRUE
    OR (current_setting('jetnity.dev_terminal_cycle4_attempt2_review_ui_version',true) ~ '^([7-9]|[1-9][0-9]{1,8})$') IS NOT TRUE THEN
    RAISE EXCEPTION 'exact Dev Cycle4 operator declaration required';
  END IF;
  PERFORM pg_advisory_xact_lock(771106,31);
  IF to_regclass('jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1') IS NOT NULL THEN
    RAISE EXCEPTION 'review already present; confirm original readback, never replace';
  END IF;
  IF to_regclass('official_v3_guard_private.retired_cycle4_attempts_v1') IS NULL
    OR to_regclass('official_v3_guard_private.retired_cycle4_attempt2_v1') IS NULL
    OR to_regclass('jetnity_dev_import_scheduler.terminal_cycle2_review_v1') IS NULL
    OR to_regclass('jetnity_dev_import_scheduler.terminal_cycle3_review_v1') IS NULL THEN
    RAISE EXCEPTION 'unchanged old reviews and exact Cycle4 recovery are required';
  END IF;
  SELECT * INTO STRICT p FROM pg_proc WHERE oid='jetnity_dev_import_scheduler.tick_v1()'::regprocedure;
  IF ${digest('p.prosrc')}<>'${oldHash}' OR p.proowner<>'postgres'::regrole OR p.prosecdef
    OR p.pronargs<>0 OR p.prorettype<>'text'::regtype
    OR p.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog','statement_timeout=10s','lock_timeout=2s']::text[] THEN
    RAISE EXCEPTION 'exact unchanged Cycle3 sender predecessor required';
  END IF;
  INSERT INTO pg_temp.cycle4_attempt2_review_before VALUES('tick_metadata',to_jsonb(p)-'prosrc');
  PERFORM 1 FROM jetnity_dev_import_scheduler.state_v1 WHERE singleton FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Dev sender state missing'; END IF;
  PERFORM pg_advisory_xact_lock(771106,1);
  PERFORM official_v3_guard_private.require_open_v1();
  IF ${runtimeSessions} THEN RAISE EXCEPTION 'technical runtime session remains'; END IF;
  LOCK TABLE jetnity_dev_import_scheduler.state_v1,jetnity_dev_import_scheduler.cycles_v1,
    jetnity_dev_import_scheduler.dispatches_v1,jetnity_dev_import_scheduler.preview_access_v1,
    jetnity_dev_import_scheduler.preview_dispatches_v1,jetnity_dev_import_scheduler.terminal_cycle2_review_v1,
    jetnity_dev_import_scheduler.terminal_cycle3_review_v1 IN SHARE MODE;
  LOCK TABLE cron.job IN ACCESS SHARE MODE;
  IF NOT (${stoppedSender}) THEN RAISE EXCEPTION 'exact paused Dev sender and cron are required'; END IF;
  IF EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.cycles_v1 WHERE state='active' OR (state='blocked' AND id NOT IN (2,3,4)))
    OR EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.dispatches_v1 WHERE processed_at IS NULL)
    OR EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.preview_dispatches_v1 WHERE processed_at IS NULL) THEN
    RAISE EXCEPTION 'unreviewed scheduler work remains';
  END IF;
  IF NOT ${prior.priorReviewValid} OR NOT ${priorReviewValid}
    OR (SELECT count(*) FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1)<>1
    OR (SELECT count(*) FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1)<>1 THEN
    RAISE EXCEPTION 'original Cycle2 and Cycle3 reviews and evidence are required';
  END IF;
  IF current_setting('jetnity.dev_terminal_cycle4_attempt2_review_commit')='${REVIEW.priorRuntimeCommit}'
    OR current_setting('jetnity.dev_terminal_cycle4_attempt2_review_commit')=(SELECT runtime_commit FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1)
    OR current_setting('jetnity.dev_terminal_cycle4_attempt2_review_ci_run')::bigint<=(SELECT ci_run FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1) THEN
    RAISE EXCEPTION 'new successful CI and Ready runtime must be declared';
  END IF;
  IF ${evidenceHashExpression} IS DISTINCT FROM '${evidenceHash}' THEN
    RAISE EXCEPTION 'original Cycle4 signed failure evidence differs';
  END IF;
${allChecks}
  retired:=${retirementQuery}; prior_retired:=${priorRetirementQuery}; continued:=${continuationQuery};
  IF retired IS NULL OR prior_retired IS NULL THEN RAISE EXCEPTION 'both exact confirmed Cycle4 Owner retirements required'; END IF;
  IF continued IS NULL THEN RAISE EXCEPTION 'normal original Attempt3 completion and publication required'; END IF;
  SELECT * INTO STRICT s FROM official_v3_jobs_private.subjects_v1 WHERE job_key='${REVIEW.subject}';
  SELECT * INTO STRICT current_head FROM official_v3_result_private.heads_v1 WHERE singleton;
  IF s.open_attempt IS NOT NULL OR s.terminal_credit_claim IS NOT NULL
    OR s.current_job IS DISTINCT FROM (continued#>>'{complete,envelope_text}')::jsonb->'next'
    OR s.current_job->>'jobId' IS DISTINCT FROM '${REVIEW.job}'
    OR s.current_job->>'state' IS DISTINCT FROM 'succeeded' OR s.current_job->'attempt' IS DISTINCT FROM '3'::jsonb
    OR s.current_job->'lease' IS DISTINCT FROM 'null'::jsonb THEN
    RAISE EXCEPTION 'same original Cycle4 Attempt3 must be completely terminal';
  END IF;
  IF current_head.version_ref IS DISTINCT FROM continued#>>'{version,reference}'
    OR current_head.projection_ref IS DISTINCT FROM continued#>>'{projection,reference}'
    OR current_head.decision_ref IS DISTINCT FROM continued#>>'{result,result,decisionRef}'
    OR current_head.suppression IS DISTINCT FROM 'null'::jsonb OR current_head.sticky_decision_ref IS NOT NULL
    OR NOT current_head.coverage
    OR current_setting('jetnity.dev_terminal_cycle4_attempt2_review_ui_version')::integer IS DISTINCT FROM (continued#>>'{version,revision}')::integer
    OR (SELECT count(*) FROM official_v3_result_private.versions_v1)<7
    OR (SELECT count(*) FROM official_v3_result_private.operations_v1 WHERE operation_kind='publication')<7 THEN
    RAISE EXCEPTION 'exact current published UI version seven or later required';
  END IF;
  quota:=official_v3_guard_private.ch_de_quota_v2();
  IF quota->>'model' IS DISTINCT FROM 'rolling_24h_v2' OR quota->'clock_ok' IS DISTINCT FROM 'true'::jsonb THEN
    RAISE EXCEPTION 'genuine current rolling quota required';
  END IF;
  INSERT INTO pg_temp.cycle4_attempt2_review_before VALUES
    ('quota',quota-'observed_at'-'window_start'),('protected_catalog',official_v3_guard_private.catalog_status_v1()),
    ('roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r)),
    ('memberships',(SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m)),
    ('cron',(SELECT jsonb_agg(to_jsonb(c) ORDER BY c.jobid) FROM cron.job c)),
    ('retirement',retired),('prior_retirement',prior_retired),('continuation',continued);
  FOR t IN SELECT n.nspname,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname IN ('jetnity_dev_import_scheduler','official_v3_guard_private',
      'official_v3_method_private','official_v3_intake_private','official_v3_jobs_private','official_v3_result_private')
    ORDER BY n.nspname,c.relname LOOP
    EXECUTE format('LOCK TABLE %I.%I IN ACCESS SHARE MODE',t.nspname,t.relname);
    EXECUTE format('SELECT encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text COLLATE "C"),''[]''::jsonb)::text,''UTF8'')),''hex'') FROM %I.%I r',t.nspname,t.relname) INTO rows_digest;
    INSERT INTO pg_temp.cycle4_attempt2_review_before VALUES('rows:'||t.nspname||'.'||t.relname,to_jsonb(rows_digest));
  END LOOP;
END $preflight$;

CREATE TABLE jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1(
  cycle_id bigint PRIMARY KEY CHECK(cycle_id=4) REFERENCES jetnity_dev_import_scheduler.cycles_v1(id),
  evidence_digest text NOT NULL CHECK(evidence_digest='${evidenceHash}'),
  original_evidence_sha256 text NOT NULL CHECK(original_evidence_sha256='${REVIEW.originalEvidenceSha256}'),
  prior_original_evidence_sha256 text NOT NULL CHECK(prior_original_evidence_sha256='${REVIEW.priorOriginalEvidenceSha256}'),
  prior_cycle3_evidence_digest text NOT NULL CHECK(prior_cycle3_evidence_digest='${prior.evidenceHash}'),
  runtime_source_pins jsonb NOT NULL CHECK(runtime_source_pins=${json(REVIEW.runtimePins)}),
  owner_operation_id text NOT NULL CHECK(owner_operation_id ~ '^op3_[a-f0-9]{32}$'),
  retirement_digest text NOT NULL CHECK(retirement_digest ~ '^[a-f0-9]{64}$'),
  prior_owner_operation_id text NOT NULL CHECK(prior_owner_operation_id ~ '^op3_[a-f0-9]{32}$'),
  prior_retirement_digest text NOT NULL CHECK(prior_retirement_digest ~ '^[a-f0-9]{64}$'),
  continuation_attempt_key text NOT NULL CHECK(continuation_attempt_key ~ '^execution-attempt:v3:[a-f0-9]{64}$'),
  continuation_digest text NOT NULL CHECK(continuation_digest ~ '^[a-f0-9]{64}$'),
  published_version_ref text NOT NULL CHECK(published_version_ref ~ '^rule-version:v3:[a-f0-9]{64}$'),
  published_projection_ref text NOT NULL CHECK(published_projection_ref ~ '^rule-projection:v3:[a-f0-9]{64}$'),
  runtime_commit text NOT NULL CHECK(runtime_commit ~ '^[a-f0-9]{40}$'),
  ready_deployment text NOT NULL CHECK(ready_deployment ~ '^dpl_[A-Za-z0-9]{20,64}$'),
  ci_run bigint NOT NULL CHECK(ci_run>0),ui_version integer NOT NULL CHECK(ui_version>=7),
  reviewed_at timestamptz NOT NULL CHECK(isfinite(reviewed_at)),reviewed_head jsonb NOT NULL
);
ALTER TABLE jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
CREATE FUNCTION jetnity_dev_import_scheduler.immutable_terminal_cycle4_attempt2_review_v1() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $immutable$
BEGIN RAISE EXCEPTION 'the original Cycle4 review is immutable'; END $immutable$;
REVOKE ALL ON FUNCTION jetnity_dev_import_scheduler.immutable_terminal_cycle4_attempt2_review_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
CREATE TRIGGER immutable_row BEFORE UPDATE OR DELETE ON jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1
FOR EACH ROW EXECUTE FUNCTION jetnity_dev_import_scheduler.immutable_terminal_cycle4_attempt2_review_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1
FOR EACH STATEMENT EXECUTE FUNCTION jetnity_dev_import_scheduler.immutable_terminal_cycle4_attempt2_review_v1();
INSERT INTO jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1
SELECT 4,'${evidenceHash}','${REVIEW.originalEvidenceSha256}','${REVIEW.priorOriginalEvidenceSha256}','${prior.evidenceHash}',${json(REVIEW.runtimePins)},
  r.value#>>'{owner,operation_id}',${digest('r.value')},pr.value#>>'{owner,operation_id}',${digest('pr.value')},
  c.value#>>'{start,attempt_key}',${digest('c.value')},
  c.value#>>'{version,reference}',c.value#>>'{projection,reference}',
  current_setting('jetnity.dev_terminal_cycle4_attempt2_review_commit'),current_setting('jetnity.dev_terminal_cycle4_attempt2_review_deployment'),
  current_setting('jetnity.dev_terminal_cycle4_attempt2_review_ci_run')::bigint,current_setting('jetnity.dev_terminal_cycle4_attempt2_review_ui_version')::integer,
  clock_timestamp(),s.current_job
FROM official_v3_jobs_private.subjects_v1 s,pg_temp.cycle4_attempt2_review_before r,pg_temp.cycle4_attempt2_review_before pr,pg_temp.cycle4_attempt2_review_before c
WHERE s.job_key='${REVIEW.subject}' AND r.kind='retirement' AND pr.kind='prior_retirement' AND c.kind='continuation';

-- Only the original blocked-cycle admission predicate changes. All ordinary
-- requests, periods, quotas, source processing and publication gates remain.
CREATE OR REPLACE FUNCTION jetnity_dev_import_scheduler.tick_v1() RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog SET statement_timeout='10s' SET lock_timeout='2s'
AS $tick$${newBody}$tick$;

DO $postcheck$
DECLARE t record; rows_digest text; schema_name text; table_name text; p pg_proc%ROWTYPE;
BEGIN
${allChecks}
  IF ${runtimeSessions} THEN RAISE EXCEPTION 'technical runtime session appeared during review'; END IF;
  SELECT * INTO STRICT p FROM pg_proc WHERE oid='jetnity_dev_import_scheduler.tick_v1()'::regprocedure;
  IF ${digest('p.prosrc')}<>'${newHash}'
    OR (to_jsonb(p)-'prosrc') IS DISTINCT FROM (SELECT value FROM pg_temp.cycle4_attempt2_review_before WHERE kind='tick_metadata')
    OR official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM (SELECT value FROM pg_temp.cycle4_attempt2_review_before WHERE kind='protected_catalog')
    OR (SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r) IS DISTINCT FROM (SELECT value FROM pg_temp.cycle4_attempt2_review_before WHERE kind='roles')
    OR (SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m) IS DISTINCT FROM (SELECT value FROM pg_temp.cycle4_attempt2_review_before WHERE kind='memberships')
    OR (SELECT jsonb_agg(to_jsonb(c) ORDER BY c.jobid) FROM cron.job c) IS DISTINCT FROM (SELECT value FROM pg_temp.cycle4_attempt2_review_before WHERE kind='cron')
    OR (official_v3_guard_private.ch_de_quota_v2()-'observed_at'-'window_start') IS DISTINCT FROM (SELECT value FROM pg_temp.cycle4_attempt2_review_before WHERE kind='quota') THEN
    RAISE EXCEPTION 'review changed a protected catalog, quota, authority, cron or sender attribute';
  END IF;
  FOR t IN SELECT kind,value FROM pg_temp.cycle4_attempt2_review_before WHERE kind LIKE 'rows:%' LOOP
    schema_name:=split_part(substring(t.kind from 6),'.',1);table_name:=split_part(substring(t.kind from 6),'.',2);
    EXECUTE format('SELECT encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text COLLATE "C"),''[]''::jsonb)::text,''UTF8'')),''hex'') FROM %I.%I r',schema_name,table_name) INTO rows_digest;
    IF to_jsonb(rows_digest) IS DISTINCT FROM t.value THEN RAISE EXCEPTION 'review changed old rows: %',t.kind; END IF;
  END LOOP;
  IF (SELECT count(*) FROM jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1)<>1
    OR NOT ${prior.priorReviewValid} OR NOT ${priorReviewValid} OR NOT ${currentReviewValid}
    OR NOT (${stoppedSender}) THEN RAISE EXCEPTION 'original Cycle4 terminal review readback differs'; END IF;
END $postcheck$;
COMMIT;
`
  const readback = `-- Dev postgres SELECT only. Reconcile a lost apply ACK without replacing
-- a review, resuming cron, changing the sender or running an audit/tick.
SELECT jsonb_build_object(
 'schema',1,'observed_at',clock_timestamp(),
 'review',(SELECT to_jsonb(r)-'reviewed_head'||jsonb_build_object('reviewed_job_id',r.reviewed_head->>'jobId',
   'reviewed_revision',r.reviewed_head->'revision','reviewed_state',r.reviewed_head->>'state')
   FROM jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1 r WHERE cycle_id=4),
 'prior_cycle2_review_valid',${prior.priorReviewValid},'prior_cycle3_review_valid',${priorReviewValid},
 'original_cycle4_evidence_unchanged',${evidenceHashExpression}='${evidenceHash}',
 'original_owner_retirements_valid',${retirementQuery} IS NOT NULL AND ${priorRetirementQuery} IS NOT NULL,
 'original_attempt3_publication_valid',${continuationQuery} IS NOT NULL,
 'review_valid',${currentReviewValid},
 'exact_reviewed_sender',(SELECT ${digest('prosrc')}='${newHash}' FROM pg_proc
   WHERE oid='jetnity_dev_import_scheduler.tick_v1()'::regprocedure),
 'sender',(SELECT to_jsonb(s) FROM jetnity_dev_import_scheduler.state_v1 s WHERE singleton),
 'cron',(SELECT jsonb_build_object('jobid',jobid,'jobname',jobname,'active',active) FROM cron.job WHERE jobid=5),
 'original_cycle4',(SELECT to_jsonb(c) FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE id=4),
 'original_dispatch_count',(SELECT count(*) FROM jetnity_dev_import_scheduler.dispatches_v1 WHERE cycle_id=4),
 'other_blocked_count',(SELECT count(*) FROM jetnity_dev_import_scheduler.cycles_v1 WHERE state='blocked' AND id NOT IN (2,3,4)),
 'guard',public.official_v3_guard_alarm_status_v1(),'quota',official_v3_jobs_private.rolling_usage_v2('${REVIEW.subject}')
);
`
  return Object.freeze({ migration, readback, oldHash, newHash, evidenceHash })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'cycle4_attempt2_review_build_mode_required')
  const compiled = compileDevTerminalCycle4Attempt2Review()
  for (const [path, output] of [['./review-cycle4.sql', compiled.migration], ['./readback-cycle4.sql', compiled.readback]]) {
    if (process.argv[2] === '--write') writeFileSync(new URL(path, import.meta.url), output)
    else assert.equal(read(path), output, 'exact compiled Cycle4 review artifact: ' + path)
  }
  process.stdout.write(JSON.stringify({ oldBody: compiled.oldHash, newBody: compiled.newHash, originalEvidence: compiled.evidenceHash }) + '\n')
}
