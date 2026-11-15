// The original root job node count is performed on every job. Only complete,
// successful counts of identical fixed-depth child bytes may be reused locally.
import assert from 'node:assert/strict'

export const HISTORY_NODES_DECLARATION = `
  nodes_memo jsonb:='{}'; nodes_memo_count integer:=0; nodes_memo_bytes integer:=0;`

export function historyNodesBlock(value, target) {
  return `DECLARE hn_value jsonb:=${value}; hn_count integer:=1; hn_child record;
  hn_child_count bigint; hn_child_nodes integer; hn_key text COLLATE "C"; hn_bytes bigint;
BEGIN
  IF hn_value IS NULL THEN hn_count:=-1;
  ELSIF jsonb_typeof(hn_value)<>'object' THEN
    hn_count:=official_v3_jobs_private.nodes_v1(hn_value,0,16,8192);
  ELSE
    SELECT count(*) INTO hn_child_count FROM jsonb_object_keys(hn_value);
    IF hn_child_count>(8192-1)/2 THEN hn_count:=-1;
    ELSE
      hn_count:=1+2*hn_child_count;
      FOR hn_child IN SELECT j.key,j.value FROM jsonb_each(hn_value) j
        WHERE jsonb_typeof(j.value) IN ('object','array') LOOP
        IF hn_child.key IN ('context','research','method','identity') THEN
          -- The full key also binds every original recursive parameter.
          hn_key:='1:16:8192:'||hn_child.value::text;
          IF nodes_memo ? hn_key THEN hn_child_nodes:=(nodes_memo->>hn_key)::integer;
          ELSE
            hn_child_nodes:=official_v3_jobs_private.nodes_v1(hn_child.value,1,16,8192);
            hn_bytes:=octet_length(hn_key)::bigint+octet_length(hn_child_nodes::text)::bigint;
            IF hn_child_nodes>0 AND hn_bytes<=16384 THEN
              IF nodes_memo_count>=8 OR hn_bytes>16384-nodes_memo_bytes THEN
                nodes_memo:='{}'; nodes_memo_count:=0; nodes_memo_bytes:=0;
              END IF;
              nodes_memo:=nodes_memo||jsonb_build_object(hn_key,hn_child_nodes);
              nodes_memo_count:=nodes_memo_count+1; nodes_memo_bytes:=nodes_memo_bytes+hn_bytes::integer;
            END IF;
          END IF;
        ELSE
          hn_child_nodes:=official_v3_jobs_private.nodes_v1(hn_child.value,1,16,8192);
        END IF;
        IF hn_child_nodes<0 THEN hn_count:=-1; EXIT; END IF;
        hn_count:=hn_count+hn_child_nodes-1;
        IF hn_count>8192 THEN hn_count:=-1; EXIT; END IF;
      END LOOP;
    END IF;
  END IF;
  ${target}:=hn_count;
END;`
}

export function optimizeHistoryNodes(historyBody) {
  let body = historyBody
  const anchor = '  attempt_canonical text COLLATE "default";'
  assert.equal(body.split(anchor).length, 2, 'one invocation-local node memo declaration')
  body = body.replace(anchor, () => anchor + HISTORY_NODES_DECLARATION)
  const declaration = '  job_canonical_text text COLLATE "default";'
  assert.equal(body.split(declaration).length, 4, 'exactly three complete inline job validators')
  body = body.replaceAll(declaration, declaration + '\n  job_nodes integer;')
  const before = "  IF v IS NULL OR official_v3_jobs_private.nodes_v1(v,0,16,8192)<0 THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;"
  const after = historyNodesBlock('v', 'job_nodes')
    + "\n  IF job_nodes<0 THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;"
  assert.equal(body.split(before).length, 4, 'the exact three original root job node checks')
  body = body.replaceAll(before, after)
  return body
}
