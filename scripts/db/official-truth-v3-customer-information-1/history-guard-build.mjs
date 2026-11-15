// Additive BG1 successor: reuse only a successful exact-node membership
// witness within the same locked subject. Every historical row is still read.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { functionsIn } from '../official-truth-v3-background-guard-1/build.mjs'

const here = new URL('./', import.meta.url)
const read = name => readFileSync(new URL(name, here), 'utf8')
const sha = value => createHash('sha256').update(value, 'utf8').digest('hex')
export const HISTORY_GUARD_SIGNATURE = 'official_v3_guard_private.check_jobs_v1()'
export const HISTORY_GUARD_SOURCE = '../official-truth-v3-background-guard-1/provider-migration-body.sql'
export const HISTORY_GUARD_SOURCE_DIGEST = 'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950'
export const HISTORY_GUARD_ORIGINAL_BODY_DIGEST = '12560e25fc355e9fd903be2bc565b92a78d97f8601b1207f9204bfb8552125d0'
export const HISTORY_GUARD_ORIGINAL_OPTIONS_DIGEST = 'af9b246f2c0f4ddcde13ff2f404a78f420c9cbd0837cf89cc4045e94bffef0eb'
export const HISTORY_GUARD_BODY_DIGEST = 'a5e9fca902cbc69cb1504467b743670c78a0f0f08e32dc512c8160d65fd2c7cc'
export const HISTORY_GUARD_DEFINITION_DIGEST = 'f4a6ee4ade45524bd8ce12e389b9958568c6e2bcda1c103d22233e1e3d32987b'
export const HISTORY_GUARD_MEMO_MAX_BYTES = 65536
export const HISTORY_GUARD_DECLARATION =
  '\n  dedup_node_text text COLLATE "C"; dedup_member_text text COLLATE "C";'
export const HISTORY_GUARD_MEMBERSHIP = [
  'EXISTS(SELECT 1 FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.job_key=k',
  "          AND q.envelope_text::jsonb->'expected' IS DISTINCT FROM q.envelope_text::jsonb->'next'",
  "          AND q.envelope_text::jsonb->'next'=envelope->'expected')",
].join('\n')
const rowConditions = [
  "      IF x.action<>'enqueue' OR envelope#>>'{audit,kind}' IS DISTINCT FROM 'deduplicated'",
  '        OR NOT isfinite(x.recorded_at)',
  "        OR (x.authority-'epoch') IS DISTINCT FROM subject_row.method_binding",
].join('\n')
const refusal = "        RAISE EXCEPTION 'bg1 deduplicated jobs chain' USING ERRCODE='P7905'; END IF;"
export const HISTORY_GUARD_ORIGINAL_DEDUP = rowConditions + '\n        OR NOT ' + HISTORY_GUARD_MEMBERSHIP
  + ' THEN\n' + refusal
export const HISTORY_GUARD_DEDUP = rowConditions + ' THEN\n' + refusal + '\n' + [
  // The row checks above execute even when the following exact witness hits.
  "      dedup_node_text:=(envelope->'expected')::text;",
  '      IF dedup_member_text IS NOT NULL AND dedup_node_text IS NOT NULL',
  '        AND dedup_member_text COLLATE "C" = dedup_node_text COLLATE "C" THEN',
  '        NULL;',
  '      ELSE',
  // This is the complete original existence expression, not a digest lookup,
  // JSONB value equality cache, or an inference from the retained head.
  '        IF NOT ' + HISTORY_GUARD_MEMBERSHIP + ' THEN',
  "          RAISE EXCEPTION 'bg1 deduplicated jobs chain' USING ERRCODE='P7905'; END IF;",
  '        IF dedup_node_text IS NOT NULL AND octet_length(dedup_node_text)<=65536 THEN',
  '          dedup_member_text:=dedup_node_text;',
  '        END IF;',
  '      END IF;',
].join('\n')

function once(value, before, after) {
  assert.equal(value.split(before).length, 2, 'one exact BG1 membership source anchor')
  return value.replace(before, () => after)
}

export function optimizeHistoryGuardBody(originalBody) {
  assert.equal(sha(originalBody), HISTORY_GUARD_ORIGINAL_BODY_DIGEST, 'complete immutable original BG1 checker')
  const declaration = '  prior jsonb; envelope jsonb; next_revision bigint; head_count bigint;'
  const reset = "    prior:='null'::jsonb; next_revision:=1; head_count:=0;"
  let body = once(originalBody, declaration, declaration + HISTORY_GUARD_DECLARATION)
  body = once(body, reset, reset + '\n    dedup_member_text:=NULL;')
  body = once(body, HISTORY_GUARD_ORIGINAL_DEDUP, HISTORY_GUARD_DEDUP)
  // Prove the transformation cannot silently amend locks, the complete chain
  // rebuild, remaining row checks, method links, source reads or function tail.
  let restored = once(body, HISTORY_GUARD_DEDUP, HISTORY_GUARD_ORIGINAL_DEDUP)
  restored = once(restored, reset + '\n    dedup_member_text:=NULL;', reset)
  restored = once(restored, declaration + HISTORY_GUARD_DECLARATION, declaration)
  assert.equal(restored, originalBody, 'all other BG1 checker bytes remain original')
  return body
}

export function compileHistoryGuardDefinition() {
  const source = read(HISTORY_GUARD_SOURCE)
  assert.equal(sha(source), HISTORY_GUARD_SOURCE_DIGEST, 'immutable complete original BG1 installer')
  const original = functionsIn(source).find(f => f.signature === HISTORY_GUARD_SIGNATURE)
  assert.ok(original)
  assert.equal(original.args, '', 'the checker still accepts no trusted input')
  assert.equal(sha(original.options), HISTORY_GUARD_ORIGINAL_OPTIONS_DIGEST, 'same security, volatility and search path')
  const body = optimizeHistoryGuardBody(original.body)
  assert.equal(sha(body), HISTORY_GUARD_BODY_DIGEST, 'reviewed exact positive-membership successor')
  const sql = '-- Additive invocation-local exact BG1 membership reuse. Every row and original authority check remains.\n'
    + 'CREATE OR REPLACE FUNCTION ' + original.name + '(' + original.args + ') ' + original.options
    + 'AS $history_guard$' + body + '$history_guard$;\n'
  assert.equal(sha(sql), HISTORY_GUARD_DEFINITION_DIGEST, 'reviewed exact single-function artifact')
  return { sql, body, original, before: sha(original.body), after: sha(body), digest: sha(sql),
    sourceDigest: sha(source), originalOptionsDigest: sha(original.options), memoMaxBytes: HISTORY_GUARD_MEMO_MAX_BYTES }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'history_guard_build_mode_required')
  const { sql } = compileHistoryGuardDefinition()
  if (process.argv[2] === '--write') writeFileSync(new URL('history-guard-definition.sql', here), sql)
  else assert.equal(read('history-guard-definition.sql'), sql, 'reviewed BG1 membership SQL matches exact source transformation')
}
