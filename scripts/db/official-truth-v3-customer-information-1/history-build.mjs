// Offline additive successor of the exact installed rolling history validator.
// The historical installer remains immutable. The full checks are preserved;
// only pure bounded reuse and compiler-bound equivalent local checks change.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { functionsIn } from '../official-truth-v3-background-guard-1/build.mjs'
import { inlineHistoryJobs } from './history-job-inline.mjs'
import { optimizeHistoryCanonical } from './history-canonical.mjs'
import { optimizeHistoryNodes } from './history-nodes.mjs'
import { optimizeHistoryKeys } from './history-keys.mjs'

const here = new URL('./', import.meta.url)
const read = name => readFileSync(new URL(name, here), 'utf8')
const sha = value => createHash('sha256').update(value).digest('hex')
export const HISTORY_SIGNATURE = 'official_v3_jobs_private.assert_history_v1(text)'
export const HISTORY_MEMO_ADMISSION = `          IF job_bytes<=1048576 THEN
            -- Admit the just-validated exact bytes even after the bounded memo fills.
            -- A reset can cause revalidation, never skip validation of a new value.
            IF validated_job_count>=8 OR job_bytes>1048576-validated_job_bytes THEN
              validated_jobs:='{}'::jsonb; validated_job_count:=0; validated_job_bytes:=0;
            END IF;
            validated_jobs:=validated_jobs||jsonb_build_object(job_text,true);
            validated_job_count:=validated_job_count+1; validated_job_bytes:=validated_job_bytes+job_bytes;
          END IF;`

export function compileHistoryDefinition() {
  const pins = JSON.parse(read('pins.json'))
  const path = '../official-truth-v3-rolling-jobs-quota-1/provider-migration-body.sql'
  const source = read(path)
  assert.equal(sha(source), pins.predecessors[path], 'installed rolling artifact remains exact')
  const original = functionsIn(source).find(f => f.signature === HISTORY_SIGNATURE)
  assert.ok(original)
  assert.equal(sha(original.body), pins.functions[HISTORY_SIGNATURE].before, 'exact original history validator')
  const before = `          IF validated_job_count<256 AND job_bytes<=1048576-validated_job_bytes THEN
            validated_jobs:=validated_jobs||jsonb_build_object(job_text,true);
            validated_job_count:=validated_job_count+1; validated_job_bytes:=validated_job_bytes+job_bytes;
          END IF;`
  const after = HISTORY_MEMO_ADMISSION
  assert.equal(original.body.split(before).length, 3, 'exactly the two existing successful-validation admission sites')
  const jobPath = '../official-truth-v3-hosted-durable-jobs-1/install-candidate.sql'
  const jobSource = read(jobPath)
  assert.equal(sha(jobSource), pins.predecessors[jobPath], 'the original job validator source remains immutable')
  const job = functionsIn(jobSource).find(f => f.signature === 'official_v3_jobs_private.job_v1(jsonb)')
  assert.ok(job)
  assert.equal(sha(job.body), pins.historyJobValidatorDigest, 'the full original job validator body is pinned')
  const nodes = functionsIn(jobSource).find(f => f.signature === 'official_v3_jobs_private.nodes_v1(jsonb,integer,integer,integer)')
  assert.ok(nodes)
  assert.equal(sha(nodes.body), pins.historyNodesValidatorDigest, 'the full original recursive node counter is pinned')
  const keys = functionsIn(jobSource).find(f => f.signature === 'official_v3_jobs_private.exact_keys_v1(jsonb,text[])')
  assert.ok(keys)
  assert.equal(sha(keys.body), pins.historyKeysValidatorDigest, 'the full original general key validator is pinned')
  const canonical = functionsIn(jobSource).find(f => f.signature === 'official_v3_jobs_private.canonical_v1(jsonb,integer)')
  assert.ok(canonical)
  assert.equal(sha(canonical.body), pins.historyCanonicalValidatorDigest, 'the full original byte/error serializer is pinned')
  const body = optimizeHistoryKeys(optimizeHistoryNodes(optimizeHistoryCanonical(inlineHistoryJobs(original.body.replaceAll(before, after), job.body))))
  assert.equal(sha(body), pins.functions[HISTORY_SIGNATURE].after, 'reviewed bounded memo successor')
  const sql = '-- Additive invocation-local history-validation memo successor. No history, quota, deadline or authority change.\n'
    + 'CREATE OR REPLACE FUNCTION ' + original.name + '(' + original.args + ') ' + original.options
    + 'AS $history_body$' + body + '$history_body$;\n'
  assert.equal(sha(sql), pins.historyDefinitionsDigest, 'reviewed single-definition artifact')
  return { sql, body, original, job, before: sha(original.body), after: sha(body), digest: sha(sql) }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'history_build_mode_required')
  const { sql } = compileHistoryDefinition()
  if (process.argv[2] === '--write') writeFileSync(new URL('history-definition.sql', here), sql)
  else assert.equal(read('history-definition.sql'), sql, 'history SQL matches reviewed source transformation')
}
