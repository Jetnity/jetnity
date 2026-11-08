-- Native-only immutable R9 oracle: exact Final11/R8 worker from semantic-v2
-- blob13bb5d01b3fff02e516a50c36878d95e3f65f766; only its qualified name changes.
-- No runtime importer or API-role grant. The local cluster owner installs it.
BEGIN;
CREATE SCHEMA official_refresh_graph_reference_r9;
REVOKE ALL ON SCHEMA official_refresh_graph_reference_r9 FROM PUBLIC;
CREATE FUNCTION official_refresh_graph_reference_r9.validate_inspected_graph_v2(profile text,fingerprint text,receipt_bytes bytea,binding_bytes bytea,artifacts official_provenance_api.artifact_input_v1[],inspected_edges jsonb) RETURNS void
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path = '' SET timezone='UTC' AS $$
DECLARE receipt jsonb; binding jsonb; a official_provenance_api.artifact_input_v1; b official_provenance_api.artifact_input_v1; root record; edge record;
 membership_index jsonb;
 graph jsonb := '{}'::jsonb; starts jsonb := '[]'::jsonb; work jsonb; item jsonb; visited jsonb := '{}'::jsonb; longest jsonb := '{}'::jsonb; key text; target text; total_bytes bigint; edge_count integer; depth integer;
BEGIN
 PERFORM official_provenance_private.require(profile='ot-integrated-pilot-local-closure-v2');
 IF fingerprint IS NULL OR receipt_bytes IS NULL OR binding_bytes IS NULL OR artifacts IS NULL OR fingerprint !~ '^ot-provenance-v1:[a-f0-9]{64}$'
 OR pg_catalog.array_ndims(artifacts) <> 1 OR pg_catalog.array_lower(artifacts,1) <> 1 OR pg_catalog.cardinality(artifacts) NOT BETWEEN 1 AND 255 THEN RAISE EXCEPTION 'invalid_input'; END IF;
 receipt:=official_provenance_private.decode(receipt_bytes,262144); PERFORM official_provenance_private.typed(receipt,'receipt'); binding:=official_provenance_private.decode(binding_bytes,4096);
 IF receipt->>'schema' IS DISTINCT FROM 'official-truth-autonomous-provenance' OR receipt->'schemaVersion' IS DISTINCT FROM '1'::jsonb OR receipt->>'canonicalization' IS DISTINCT FROM 'ot-provenance-json-v1'
 OR 'ot-provenance-v1:'||pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to('ot-provenance-v1'||pg_catalog.chr(10),'UTF8')||receipt_bytes),'hex') <> fingerprint THEN RAISE EXCEPTION 'invalid_input'; END IF;
 IF (SELECT pg_catalog.count(*) FROM (SELECT x.artifact_id,x.artifact_version FROM pg_catalog.unnest(artifacts) x GROUP BY x.artifact_id,x.artifact_version) q) <> pg_catalog.cardinality(artifacts) THEN RAISE EXCEPTION 'invalid_input'; END IF;
 PERFORM official_provenance_private.require(NOT EXISTS(SELECT x.artifact_id FROM pg_catalog.unnest(artifacts) x GROUP BY x.artifact_id HAVING pg_catalog.count(DISTINCT (x.artifact_type,x.byte_contract_family))>1));
 PERFORM official_provenance_private.require(pg_catalog.jsonb_typeof(inspected_edges)='object');
 PERFORM official_provenance_private.require((SELECT pg_catalog.count(*) FROM pg_catalog.jsonb_object_keys(inspected_edges))=pg_catalog.cardinality(artifacts));
 -- R8: index only this invocation's exact metadata after duplicate checks.
 -- JSON array keys preserve field boundaries; versions retain bigint equality.
 -- NULL pin fields cannot satisfy the original SQL conjunction. Full artifacts
 -- remain the source of all byte checks and the unchanged graph algorithm.
 SELECT COALESCE(pg_catalog.jsonb_object_agg(
  pg_catalog.jsonb_build_array(x.artifact_id,x.artifact_version,x.digest)::text,x.artifact_type),'{}'::jsonb)
 INTO membership_index FROM pg_catalog.unnest(artifacts) x
 WHERE x.artifact_id IS NOT NULL AND x.artifact_version IS NOT NULL AND x.digest IS NOT NULL;
 total_bytes:=pg_catalog.octet_length(binding_bytes); edge_count:=1;
 FOREACH a IN ARRAY artifacts LOOP
  total_bytes:=total_bytes+pg_catalog.octet_length(a.canonical_bytes);
  key:=a.artifact_id||':'||a.artifact_version::text||':'||a.digest;
  graph:=graph||pg_catalog.jsonb_build_object(key,'[]'::jsonb);
  PERFORM official_provenance_private.require(pg_catalog.jsonb_typeof(inspected_edges->key)='array');
  FOR edge IN SELECT e->>'slot' AS slot,e->'pin' AS pin,e->>'expected_type' AS expected_type FROM pg_catalog.jsonb_array_elements(inspected_edges->key) e LOOP
   edge_count:=edge_count+1;
   IF (membership_index->>pg_catalog.jsonb_build_array(edge.pin->>'id',(edge.pin->>'version')::bigint,edge.pin->>'digest')::text=edge.expected_type) IS NOT TRUE THEN RAISE EXCEPTION 'dependency_missing'; END IF;
   target:=(edge.pin->>'id')||':'||(edge.pin->>'version')||':'||(edge.pin->>'digest');
   graph:=pg_catalog.jsonb_set(graph,ARRAY[key],graph->key||pg_catalog.to_jsonb(target));
  END LOOP;
 END LOOP;
 FOR root IN SELECT * FROM official_provenance_private.receipt_roots(receipt) UNION ALL SELECT * FROM official_provenance_private.binding_roots(binding,fingerprint) LOOP
  IF (membership_index->>pg_catalog.jsonb_build_array(root.pin->>'id',(root.pin->>'version')::bigint,root.pin->>'digest')::text=root.expected_type) IS NOT TRUE THEN RAISE EXCEPTION 'dependency_missing'; END IF;
  target:=(root.pin->>'id')||':'||(root.pin->>'version')||':'||(root.pin->>'digest');
  depth:=CASE WHEN root.slot IN ('globalAdmission','selectedSupportManifest','autonomousReviewConstruction') THEN 2 ELSE 1 END;
  starts:=starts||pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('key',target,'depth',depth,'path','[]'::jsonb)); edge_count:=edge_count+1;
 END LOOP;
 IF total_bytes>8388608 OR edge_count>1024 THEN RAISE EXCEPTION 'bound_exceeded'; END IF;
 -- Longest-depth relaxation revisits a shared node when a later deeper path reaches it.
 -- Dominated same-depth paths are skipped to keep work bounded by nodes/edges times depth.
 work:=starts;
 WHILE pg_catalog.jsonb_array_length(work)>0 LOOP
  item:=work->0; work:=work-0; key:=item->>'key'; depth:=(item->>'depth')::integer;
  IF depth>16 THEN RAISE EXCEPTION 'bound_exceeded'; END IF;
  IF item->'path' ? key THEN RAISE EXCEPTION 'cycle'; END IF;
  IF longest ? key AND (longest->>key)::integer >= depth THEN CONTINUE; END IF;
  longest:=longest||pg_catalog.jsonb_build_object(key,depth);
  visited:=visited||pg_catalog.jsonb_build_object(key,true);
  FOR target IN SELECT pg_catalog.jsonb_array_elements_text(graph->key) LOOP
   work:=work||pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('key',target,'depth',depth+1,'path',item->'path'||pg_catalog.to_jsonb(key)));
   IF pg_catalog.jsonb_array_length(work)>16384 THEN RAISE EXCEPTION 'bound_exceeded'; END IF;
  END LOOP;
 END LOOP;
 IF (SELECT pg_catalog.count(*) FROM pg_catalog.jsonb_object_keys(visited))<>pg_catalog.cardinality(artifacts) THEN RAISE EXCEPTION 'unsolicited_artifact'; END IF;
END $$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA official_refresh_graph_reference_r9 FROM PUBLIC;
COMMIT;
