// Compiler-fixed object serialization only. A NULL result is a miss and must
// enter the unchanged general canonical block, including its original errors.
// No new cache: complex children may use only the existing successful memo at
// their complete depth-prefixed JSONB text key.
import assert from 'node:assert/strict'

const common = ['schema', 'kind', 'jobId', 'operationId', 'revision', 'predecessorRevision', 'state',
  'createdAt', 'updatedAt', 'attempt', 'attemptLimit', 'lease', 'nextAttemptAt', 'lastFailure']
const shapes = {
  research: common.concat(['jobKey', 'context', 'contextKey', 'research', 'method', 'resultDecisionRef']),
  discovery: common.concat(['identity', 'resultDiscoveryRef']),
  audit: ['reference', 'kind', 'observedAt', 'priorRevision', 'nextRevision'],
  auditPreimage: ['command', 'op'],
  claim: ['operationId', 'jobKey', 'leaseId', 'leaseMilliseconds'],
  lease: ['leaseId', 'generation', 'acquiredAt', 'expiresAt'],
  fence: ['jobId', 'revision', 'leaseId', 'generation'],
  missingReason: ['status'],
  recheckReason: ['status', 'reason'],
}
for (const keys of Object.values(shapes)) {
  assert.ok(keys.length > 0 && keys.length <= 32 && keys.every(key => /^[A-Za-z]+$/.test(key)))
  assert.equal(new Set(keys).size, keys.length)
  // These constants contain only ASCII, so this is exactly PostgreSQL C order.
  keys.sort()
  Object.freeze(keys)
}
Object.freeze(shapes)

const literal = value => "'" + value.replaceAll("'", "''") + "'"
const keysSql = keys => 'ARRAY[' + keys.map(literal).join(',') + ']::text[]'
const child = (value, key) => `(${value}->${literal(key)})`
const exact = (value, keys) => `(${value} ?& ${keysSql(keys)} AND (${value}-${keysSql(keys)})='{}'::jsonb)`

// Each conversion is inside its matching jsonb_typeof branch. An invalid
// primitive produces NULL, never a new cast/regex error or guessed byte string.
// JSON null produces the four bytes "null"; SQL NULL remains a miss.
function primitive(value) {
  return `(CASE jsonb_typeof(${value})
      WHEN 'string' THEN CASE WHEN (${value}#>>'{}') ~ '[^ -~]' THEN NULL ELSE ${value}::text END
      WHEN 'number' THEN CASE WHEN ${value}::numeric=trunc(${value}::numeric)
        AND ${value}::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(${value}::numeric)::text END
      WHEN 'boolean' THEN ${value}::text WHEN 'null' THEN 'null' ELSE NULL END)`
}

const memoMembers = new Set(['context', 'method', 'research', 'identity', 'subject', 'authority'])
function parts(keys, value, depth, lease = false) {
  return 'ARRAY[\n    ' + keys.map(key => {
    const valueExpr = child(value, key)
    const canonical = lease && key === 'lease' ? 'hcf_lease_text'
      : memoMembers.has(key)
        ? `COALESCE(${primitive(valueExpr)},subtree_memo->>(((${depth})+1)::text||':'||${valueExpr}::text))`
        : primitive(valueExpr)
    return literal(JSON.stringify(key) + ':') + '||' + canonical
  }).join(',\n    ') + '\n  ]::text[]'
}

function assign(keys, target, job = false) {
  return `${job ? `hcf_lease:=hcf_value->'lease';
    hcf_lease_text:=${primitive('hcf_lease')};
    IF hcf_lease_text IS NULL AND hcf_depth+2<=24 AND jsonb_typeof(hcf_lease)='object' THEN
      IF ${exact('hcf_lease', shapes.lease)} THEN
        hcf_lease_parts:=${parts(shapes.lease, 'hcf_lease', 'hcf_depth+1')};
        IF array_position(hcf_lease_parts,NULL::text) IS NULL THEN
          hcf_lease_text:='{'||array_to_string(hcf_lease_parts,',')||'}';
        END IF;
      END IF;
    END IF;
    ` : ''}hcf_parts:=${parts(keys, 'hcf_value', 'hcf_depth', job)};
    IF array_position(hcf_parts,NULL::text) IS NULL THEN
      ${target}:='{'||array_to_string(hcf_parts,',')||'}';
    END IF;`
}

/** Only a complete known object succeeds. All other values, shapes, primitive
 * errors and depth errors return NULL for the original general block to decide.
 * The caller owns subtree_memo and never supplies an unvalidated memo entry. */
export function historyFixedCanonicalBlock(valueExpr, depthExpr, targetExpr, allowedShapes = Object.keys(shapes)) {
  for (const expression of [valueExpr, depthExpr, targetExpr]) {
    assert.ok(typeof expression === 'string' && expression.trim().length > 0 && !expression.includes('\0'))
  }
  assert.ok(Array.isArray(allowedShapes) && allowedShapes.every(name => Object.hasOwn(shapes, name)))
  assert.equal(new Set(allowedShapes).size, allowedShapes.length)
  if (!allowedShapes.length) return `${targetExpr}:=NULL;`
  const has = name => allowedShapes.includes(name)
  const groups = []
  const jobs = ['research', 'discovery'].filter(has)
  if (jobs.length) groups.push(["hcf_value ? 'schema'", jobs.map((name, index) =>
    `${index ? 'ELSIF' : 'IF'} hcf_value->'kind'='"${name === 'research' ? 'research_job_record' : 'combination_discovery_job_record'}"'::jsonb
      AND ${exact('hcf_value', shapes[name])} THEN ${assign(shapes[name], targetExpr, true)}`).join('\n') + '\nEND IF;'])
  for (const [name, discriminator] of [['audit', 'reference'], ['auditPreimage', 'command'], ['claim', 'leaseMilliseconds'],
    ['lease', 'acquiredAt'], ['fence', 'generation']]) {
    if (has(name)) groups.push([`hcf_value ? ${literal(discriminator)}`,
      `IF ${exact('hcf_value', shapes[name])} THEN ${assign(shapes[name], targetExpr)} END IF;`])
  }
  const reasons = ['missingReason', 'recheckReason'].filter(has)
  if (reasons.length) groups.push(["hcf_value ? 'status'", reasons.map((name, index) =>
    `${index ? 'ELSIF' : 'IF'} ${exact('hcf_value', shapes[name])} THEN ${assign(shapes[name], targetExpr)}`).join('\n') + '\nEND IF;'])
  const branches = groups.map(([condition, body], index) => `${index ? 'ELSIF' : 'IF'} ${condition} THEN\n${body}`).join('\n') + '\nEND IF;'
  return `DECLARE hcf_value jsonb:=(${valueExpr}); hcf_depth integer:=(${depthExpr});
  hcf_parts text[] COLLATE "default"; hcf_lease_parts text[] COLLATE "default";
  hcf_lease jsonb; hcf_lease_text text COLLATE "default";
BEGIN
  ${targetExpr}:=NULL;
  -- All supported shapes have children. The unchanged serializer accepts the
  -- object at depth24 only when it is empty, which is deliberately a miss here.
  IF hcf_value IS NOT NULL AND hcf_depth IS NOT NULL AND hcf_depth BETWEEN 0 AND 23
    AND jsonb_typeof(hcf_value)='object' THEN
    ${branches}
  END IF;
END;`
}
