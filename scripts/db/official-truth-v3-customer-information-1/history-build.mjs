// Offline additive successor of the exact installed rolling history validator.
// The historical installer remains immutable. Only memo admission changes.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { functionsIn } from '../official-truth-v3-background-guard-1/build.mjs'

const here = new URL('./', import.meta.url)
const read = name => readFileSync(new URL(name, here), 'utf8')
const sha = value => createHash('sha256').update(value).digest('hex')
export const HISTORY_SIGNATURE = 'official_v3_jobs_private.assert_history_v1(text)'
export const HISTORY_MEMO_ADMISSION = `          IF job_bytes<=1048576 THEN
            -- Admit the just-validated exact bytes even after the bounded memo fills.
            -- A reset can cause revalidation, never skip validation of a new value.
            IF validated_job_count>=256 OR job_bytes>1048576-validated_job_bytes THEN
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
  const body = original.body.replaceAll(before, after)
  assert.equal(sha(body), pins.functions[HISTORY_SIGNATURE].after, 'reviewed bounded memo successor')
  const sql = '-- Additive invocation-local history-validation memo successor. No history, quota, deadline or authority change.\n'
    + 'CREATE OR REPLACE FUNCTION ' + original.name + '(' + original.args + ') ' + original.options
    + 'AS $history_body$' + body + '$history_body$;\n'
  assert.equal(sha(sql), pins.historyDefinitionsDigest, 'reviewed single-definition artifact')
  return { sql, body, original, before: sha(original.body), after: sha(body), digest: sha(sql) }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'history_build_mode_required')
  const { sql } = compileHistoryDefinition()
  if (process.argv[2] === '--write') writeFileSync(new URL('history-definition.sql', here), sql)
  else assert.equal(read('history-definition.sql'), sql, 'history SQL matches reviewed source transformation')
}
