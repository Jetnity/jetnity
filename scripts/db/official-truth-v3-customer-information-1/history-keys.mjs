// Only compiler-fixed, distinct, non-null key sets get this successful-match
// shortcut. Every other value reaches the unchanged general key validator.
import assert from 'node:assert/strict'

const common = ['schema', 'kind', 'jobId', 'operationId', 'revision', 'predecessorRevision', 'state', 'createdAt',
  'updatedAt', 'attempt', 'attemptLimit', 'lease', 'nextAttemptAt', 'lastFailure']
const array = keys => "ARRAY[" + keys.map(key => "'" + key + "'").join(',') + ']'
const keySets = [
  ['v', "common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef']", 3],
  ['v', "common||ARRAY['identity','resultDiscoveryRef']", 3],
  ["v->'identity'", "ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey']", 3],
  ['l', "ARRAY['leaseId','generation','acquiredAt','expiresAt']", 3],
  ['v', "CASE WHEN a IN ('enqueue','complete') THEN ARRAY['action','kind','input'] ELSE ARRAY['action','input'] END", 1],
  ['i', "ARRAY['context','method','factKind','researchReason','operationId','jobId','attemptLimit']", 1],
  ['i', "ARRAY['destinationCountryCode','citizenshipCountryCode','method','operationId','jobId','attemptLimit']", 1],
  ['i', "ARRAY['operationId','jobKey','leaseId','leaseMilliseconds']", 1],
  ['f', "ARRAY['jobId','revision','leaseId','generation']", 1],
  ['i', "CASE WHEN k='rule_research' THEN ARRAY['operationId','jobKey','fence','decisionRef'] ELSE ARRAY['operationId','jobKey','fence','discoveryRef'] END", 1],
  ['i', "ARRAY['operationId','jobKey','fence','reason']", 1],
  ['e', "\n        ARRAY['audit','commandKey','expected','jobKey','next','notAfter','operationId']", 1],
  ['commit', "ARRAY['operationId','commandKey','jobKey','expected','next','notAfter','audit']", 1],
  ['a', "ARRAY['reference','kind','observedAt','priorRevision','nextRevision']", 1],
]

export function historyFixedKeyAlternatives() {
  return keySets.flatMap(([, expected]) => [...expected.matchAll(/ARRAY\[([^\]]*)\]/g)].map(match =>
    [...(expected.startsWith('common||') ? common : []), ...[...match[1].matchAll(/'([A-Za-z]+)'/g)].map(m => m[1])]))
}

export function historyExactKeysExpression(value, expected) {
  const fallback = 'official_v3_jobs_private.exact_keys_v1(' + value + ',' + expected + ')'
  return `(CASE WHEN jsonb_typeof(${value})='object' THEN
    CASE WHEN (${value}) ?& (${expected}) AND (${value})-(${expected})='{}'::jsonb
      THEN (${expected})=(${expected}) ELSE ${fallback} END
    ELSE ${fallback} END)`
}

export function optimizeHistoryKeys(historyBody) {
  const declaration = 'common text[] COLLATE "default":=' + array(common) + ';'
  assert.equal(historyBody.split(declaration).length, 4, 'all three immutable common key sets')
  let body = historyBody
  for (const [value, expected, count] of keySets) {
    // Every finite alternative is compiler-pinned. Prove the successful shortcut
    // cannot conceal duplicate/NULL keys or the original 32-member boundary.
    for (const match of expected.matchAll(/ARRAY\[([^\]]*)\]/g)) {
      const keys = [...(expected.startsWith('common||') ? common : []), ...[...match[1].matchAll(/'([A-Za-z]+)'/g)].map(m => m[1])]
      assert.ok(keys.length > 0 && keys.length <= 32)
      assert.equal(new Set(keys).size, keys.length)
      assert.equal(match[1], keys.slice(expected.startsWith('common||') ? common.length : 0).map(key => "'" + key + "'").join(','))
    }
    const call = 'official_v3_jobs_private.exact_keys_v1(' + value + ',' + expected + ')'
    assert.equal(body.split(call).length, count + 1, 'fixed key call inventory: ' + call)
    body = body.replaceAll(call, historyExactKeysExpression(value, expected))
  }
  return body
}
