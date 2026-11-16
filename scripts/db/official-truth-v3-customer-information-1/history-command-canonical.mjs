// Compiler-bound command serialization at its actual root depth zero. This is
// only a positive shortcut: every miss enters the unchanged general serializer.
// The shared exports below generate SQL; they create no database function/cache.
import assert from 'node:assert/strict'

const literal = value => "'" + value.replaceAll("'", "''") + "'"

export function historyCanonicalShape(keys) {
  assert.ok(Array.isArray(keys) && keys.length > 0 && keys.length <= 32)
  assert.ok(keys.every(key => typeof key === 'string' && /^[A-Za-z]+$/.test(key)))
  assert.equal(new Set(keys).size, keys.length)
  // All compiler keys are ASCII, so JS order is the original PostgreSQL C order.
  const ordered = Object.freeze([...keys].sort())
  return Object.freeze({ keys: ordered, sql: 'ARRAY[' + ordered.map(literal).join(',') + ']::text[]' })
}

export function historyCanonicalExact(value, shape) {
  // The caller must first establish an object, including for nested values.
  return `(${value} ?& ${shape.sql} AND (${value}-${shape.sql})='{}'::jsonb)`
}

export function historyCanonicalPrimitive(value) {
  return `(CASE jsonb_typeof(${value})
    WHEN 'string' THEN CASE WHEN (${value}#>>'{}') ~ '[^ -~]' THEN NULL ELSE ${value}::text END
    WHEN 'number' THEN CASE WHEN ${value}::numeric=trunc(${value}::numeric)
      AND ${value}::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(${value}::numeric)::text END
    WHEN 'boolean' THEN ${value}::text WHEN 'null' THEN 'null' ELSE NULL END)`
}

export function historyCanonicalParts(value, shape, replacements = {}) {
  assert.ok(Object.keys(replacements).every(key => shape.keys.includes(key)))
  return 'ARRAY[\n      ' + shape.keys.map(key => literal(JSON.stringify(key) + ':') + '||'
    + (replacements[key] ?? historyCanonicalPrimitive(`(${value}->${literal(key)})`))).join(',\n      ') + '\n    ]::text[]'
}

export function historyCanonicalExpressions(...expressions) {
  assert.ok(expressions.every(value => typeof value === 'string' && value.trim().length > 0 && !value.includes('\0')))
}

const root = historyCanonicalShape(['action', 'input'])
const rootWithKind = historyCanonicalShape(['action', 'input', 'kind'])
const researchInput = historyCanonicalShape(['context', 'method', 'factKind', 'researchReason', 'operationId', 'jobId', 'attemptLimit'])
const discoveryInput = historyCanonicalShape(['destinationCountryCode', 'citizenshipCountryCode', 'method', 'operationId', 'jobId', 'attemptLimit'])
const claim = historyCanonicalShape(['operationId', 'jobKey', 'leaseId', 'leaseMilliseconds'])
const failure = historyCanonicalShape(['operationId', 'jobKey', 'fence', 'reason'])
const researchCompletion = historyCanonicalShape(['operationId', 'jobKey', 'fence', 'decisionRef'])
const discoveryCompletion = historyCanonicalShape(['operationId', 'jobKey', 'fence', 'discoveryRef'])
const fence = historyCanonicalShape(['jobId', 'revision', 'leaseId', 'generation'])
const missing = historyCanonicalShape(['status'])
const recheck = historyCanonicalShape(['status', 'reason'])

// Only already successful, exact depth+full-text memo entries may supply an
// object. An absent entry or any other child type conservatively misses.
const memoObject = (value, depth) => `(CASE WHEN jsonb_typeof(${value})='object'
  THEN subtree_memo->>(${literal(depth + ':')}||${value}::text) END)`
const inputParts = (shape, replacements = {}) => `hcc_input_parts:=${historyCanonicalParts('hcc_input', shape, replacements)};`
const completeParts = `IF array_position(hcc_input_parts,NULL::text) IS NULL THEN
      hcc_input_text:='{'||array_to_string(hcc_input_parts,',')||'}';
    END IF;`

/** Success is restricted to root depth0 and the finite existing command shapes.
 * Complex children use their actual depth2; reason/fence leaves are at depth3.
 * No memo admission, validation receipt, or authority is created here. */
export function historyCommandCanonicalBlock(valueExpr, depthExpr, targetExpr) {
  historyCanonicalExpressions(valueExpr, depthExpr, targetExpr)
  return `DECLARE hcc_value jsonb:=(${valueExpr}); hcc_depth integer:=(${depthExpr});
  hcc_action jsonb; hcc_input jsonb; hcc_nested jsonb; hcc_has_kind boolean:=false;
  hcc_parts text[] COLLATE "default"; hcc_input_parts text[] COLLATE "default";
  hcc_nested_parts text[] COLLATE "default"; hcc_input_text text COLLATE "default";
  hcc_nested_text text COLLATE "default";
BEGIN
  ${targetExpr}:=NULL;
  IF hcc_value IS NOT NULL AND hcc_depth=0 AND jsonb_typeof(hcc_value)='object' THEN
    hcc_action:=hcc_value->'action'; hcc_input:=hcc_value->'input';
    IF jsonb_typeof(hcc_input)='object' THEN
      IF hcc_action='"enqueue"'::jsonb AND ${historyCanonicalExact('hcc_value', rootWithKind)} THEN
        hcc_has_kind:=true;
        IF hcc_value->'kind'='"rule_research"'::jsonb AND ${historyCanonicalExact('hcc_input', researchInput)} THEN
          hcc_nested:=hcc_input->'researchReason';
          IF jsonb_typeof(hcc_nested)='object' THEN
            IF ${historyCanonicalExact('hcc_nested', missing)} THEN
              hcc_nested_parts:=${historyCanonicalParts('hcc_nested', missing)};
            ELSIF ${historyCanonicalExact('hcc_nested', recheck)} THEN
              hcc_nested_parts:=${historyCanonicalParts('hcc_nested', recheck)};
            END IF;
            IF hcc_nested_parts IS NOT NULL AND array_position(hcc_nested_parts,NULL::text) IS NULL THEN
              hcc_nested_text:='{'||array_to_string(hcc_nested_parts,',')||'}';
            END IF;
          END IF;
          ${inputParts(researchInput, { context: memoObject("(hcc_input->'context')", 2),
    method: memoObject("(hcc_input->'method')", 2), researchReason: 'hcc_nested_text' })}
        ELSIF hcc_value->'kind'='"combination_discovery"'::jsonb AND ${historyCanonicalExact('hcc_input', discoveryInput)} THEN
          ${inputParts(discoveryInput, { method: memoObject("(hcc_input->'method')", 2) })}
        END IF;
      ELSIF hcc_action='"claim"'::jsonb AND ${historyCanonicalExact('hcc_value', root)}
        AND ${historyCanonicalExact('hcc_input', claim)} THEN
        ${inputParts(claim)}
      ELSIF (hcc_action='"fail"'::jsonb AND ${historyCanonicalExact('hcc_value', root)})
        OR (hcc_action='"complete"'::jsonb AND ${historyCanonicalExact('hcc_value', rootWithKind)}) THEN
        hcc_has_kind:=hcc_action='"complete"'::jsonb;
        hcc_nested:=hcc_input->'fence';
        IF jsonb_typeof(hcc_nested)='object' THEN
          IF ${historyCanonicalExact('hcc_nested', fence)} THEN
            hcc_nested_parts:=${historyCanonicalParts('hcc_nested', fence)};
            IF array_position(hcc_nested_parts,NULL::text) IS NULL THEN
              hcc_nested_text:='{'||array_to_string(hcc_nested_parts,',')||'}';
            END IF;
          END IF;
        END IF;
        IF hcc_action='"fail"'::jsonb AND ${historyCanonicalExact('hcc_input', failure)} THEN
          ${inputParts(failure, { fence: 'hcc_nested_text' })}
        ELSIF hcc_value->'kind'='"rule_research"'::jsonb AND ${historyCanonicalExact('hcc_input', researchCompletion)} THEN
          ${inputParts(researchCompletion, { fence: 'hcc_nested_text' })}
        ELSIF hcc_value->'kind'='"combination_discovery"'::jsonb AND ${historyCanonicalExact('hcc_input', discoveryCompletion)} THEN
          ${inputParts(discoveryCompletion, { fence: 'hcc_nested_text' })}
        END IF;
      END IF;
      IF hcc_input_parts IS NOT NULL THEN ${completeParts} END IF;
      IF hcc_input_text IS NOT NULL THEN
        IF hcc_has_kind THEN
          hcc_parts:=${historyCanonicalParts('hcc_value', rootWithKind, { input: 'hcc_input_text' })};
        ELSE
          hcc_parts:=${historyCanonicalParts('hcc_value', root, { input: 'hcc_input_text' })};
        END IF;
        IF array_position(hcc_parts,NULL::text) IS NULL THEN
          ${targetExpr}:='{'||array_to_string(hcc_parts,',')||'}';
        END IF;
      END IF;
    END IF;
  END IF;
END;`
}
