-- DISPOSABLE LOCAL STRUCTURAL PROOF ONLY. Not a migration or production publish API.
-- The complete semantic adapter remains blocked by the accepted depth-eight bound.
BEGIN;
CREATE ROLE ot_provenance_ddl NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
CREATE ROLE ot_provenance_write_exec NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
CREATE ROLE ot_provenance_read_exec NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
CREATE ROLE ot_provenance_writer LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
CREATE ROLE ot_provenance_reader LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
CREATE ROLE ot_provenance_denied LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
CREATE ROLE ot_provenance_bypass_denied LOGIN NOSUPERUSER BYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
CREATE SCHEMA official_provenance_private AUTHORIZATION ot_provenance_ddl;
CREATE SCHEMA official_provenance_api AUTHORIZATION ot_provenance_ddl;
REVOKE ALL ON SCHEMA official_provenance_private, official_provenance_api FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA official_provenance_private, official_provenance_api REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE ot_provenance_ddl IN SCHEMA official_provenance_private, official_provenance_api REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE TEMPORARY ON DATABASE postgres FROM PUBLIC;

CREATE FUNCTION official_provenance_private.utf16_sort_key(value text) RETURNS integer[]
LANGUAGE plpgsql IMMUTABLE STRICT SET search_path = '' AS $$
DECLARE result integer[] := '{}'; cp integer; i integer;
BEGIN
  FOR i IN 1..pg_catalog.char_length(value) LOOP
    cp := pg_catalog.ascii(pg_catalog.substr(value, i, 1));
    IF cp > 65535 THEN result := result || (55296 + (cp - 65536) / 1024) || (56320 + (cp - 65536) % 1024);
    ELSE result := result || cp; END IF;
  END LOOP;
  RETURN result;
END $$;
CREATE FUNCTION official_provenance_private.canonical(value json, depth integer DEFAULT 0) RETURNS text
LANGUAGE plpgsql IMMUTABLE STRICT SET search_path = '' AS $$
DECLARE kind text := pg_catalog.json_typeof(value); result text; part record; first boolean := true; n numeric;
BEGIN
  IF depth > 32 THEN RAISE EXCEPTION 'invalid_input'; END IF;
  CASE kind
    WHEN 'null' THEN RETURN 'null';
    WHEN 'boolean' THEN RETURN value::text;
    WHEN 'string' THEN RETURN pg_catalog.to_json(value #>> '{}')::text;
    WHEN 'number' THEN
      IF value::text !~ '^-?(0|[1-9][0-9]*)$' OR value::text = '-0' THEN RAISE EXCEPTION 'invalid_input'; END IF;
      n := value::text::numeric;
      IF pg_catalog.abs(n) > 9007199254740991 THEN RAISE EXCEPTION 'invalid_input'; END IF;
      RETURN value::text;
    WHEN 'array' THEN
      result := '[';
      FOR part IN SELECT e.value FROM pg_catalog.json_array_elements(value) WITH ORDINALITY AS e(value, ord) ORDER BY e.ord LOOP
        IF NOT first THEN result := result || ','; END IF; first := false;
        result := result || official_provenance_private.canonical(part.value, depth + 1);
      END LOOP;
      RETURN result || ']';
    WHEN 'object' THEN
      -- json preserves duplicate members; detect them BEFORE the lossy jsonb conversion.
      IF (SELECT pg_catalog.count(*) <> pg_catalog.count(DISTINCT e.key) FROM pg_catalog.json_each(value) e) THEN RAISE EXCEPTION 'invalid_input'; END IF;
      result := '{';
      FOR part IN SELECT e.key, e.value FROM pg_catalog.json_each(value) e ORDER BY official_provenance_private.utf16_sort_key(e.key) LOOP
        IF NOT first THEN result := result || ','; END IF; first := false;
        result := result || pg_catalog.to_json(part.key)::text || ':' || official_provenance_private.canonical(part.value, depth + 1);
      END LOOP;
      RETURN result || '}';
    ELSE RAISE EXCEPTION 'invalid_input';
  END CASE;
END $$;
CREATE FUNCTION official_provenance_private.decode(bytes bytea, maximum integer) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE STRICT SET search_path = '' AS $$
DECLARE text_value text; parsed json;
BEGIN
  IF pg_catalog.octet_length(bytes) NOT BETWEEN 1 AND maximum THEN RAISE EXCEPTION 'invalid_input'; END IF;
  text_value := pg_catalog.convert_from(bytes, 'UTF8'); parsed := text_value::json;
  IF pg_catalog.convert_to(official_provenance_private.canonical(parsed), 'UTF8') <> bytes THEN RAISE EXCEPTION 'invalid_input'; END IF;
  RETURN parsed::jsonb;
EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'invalid_input';
END $$;
CREATE FUNCTION official_provenance_private.keys(value jsonb, names text[]) RETURNS boolean
LANGUAGE sql IMMUTABLE STRICT SET search_path = '' AS $$
 SELECT CASE WHEN pg_catalog.jsonb_typeof(value) = 'object' THEN COALESCE((SELECT pg_catalog.array_agg(k ORDER BY k) FROM pg_catalog.jsonb_object_keys(value) k) = (SELECT pg_catalog.array_agg(n ORDER BY n) FROM pg_catalog.unnest(names) n),false) ELSE false END
$$;
CREATE FUNCTION official_provenance_private.valid_pin(value jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE STRICT SET search_path = '' AS $$
 SELECT official_provenance_private.keys(value, ARRAY['id','version','digest'])
 AND pg_catalog.jsonb_typeof(value->'id')='string' AND value->>'id' ~ '^[a-z][a-z0-9._-]{0,127}$'
 AND pg_catalog.jsonb_typeof(value->'digest')='string' AND value->>'digest' ~ '^[a-f0-9]{64}$'
 AND pg_catalog.jsonb_typeof(value->'version')='number' AND value->>'version' ~ '^[1-9][0-9]{0,15}$'
 AND (value->>'version')::numeric <= 9007199254740991
$$;
CREATE FUNCTION official_provenance_private.pins(value jsonb, prefix text DEFAULT '')
RETURNS TABLE(slot text, pin jsonb) LANGUAGE plpgsql IMMUTABLE STRICT SET search_path = '' AS $$
DECLARE part record;
BEGIN
  IF official_provenance_private.valid_pin(value) THEN slot := prefix; pin := value; RETURN NEXT; RETURN; END IF;
  IF pg_catalog.jsonb_typeof(value) = 'object' THEN
    FOR part IN SELECT e.key, e.value FROM pg_catalog.jsonb_each(value) e ORDER BY e.key LOOP
      RETURN QUERY SELECT p.slot, p.pin FROM official_provenance_private.pins(part.value, prefix || '/' || pg_catalog.replace(pg_catalog.replace(part.key, '~','~0'),'/','~1')) p;
    END LOOP;
  ELSIF pg_catalog.jsonb_typeof(value) = 'array' THEN
    FOR part IN SELECT e.value, e.ord FROM pg_catalog.jsonb_array_elements(value) WITH ORDINALITY e(value,ord) LOOP
      RETURN QUERY SELECT p.slot, p.pin FROM official_provenance_private.pins(part.value, prefix || '/' || (part.ord-1)::text) p;
    END LOOP;
  END IF;
END $$;
CREATE TYPE official_provenance_api.artifact_input_v1 AS (
 artifact_id text, artifact_version bigint, digest text, artifact_type text,
 byte_contract_family text, artifact_contract_version integer, canonical_bytes bytea
);
REVOKE ALL ON TYPE official_provenance_api.artifact_input_v1 FROM PUBLIC;
CREATE FUNCTION official_provenance_private.artifact_edges(a official_provenance_api.artifact_input_v1)
RETURNS TABLE(slot text, pin jsonb) LANGUAGE plpgsql IMMUTABLE STRICT SET search_path = '' AS $$
DECLARE value jsonb; edge jsonb;
BEGIN
  IF a.artifact_id IS NULL OR a.artifact_version IS NULL OR a.digest IS NULL OR a.artifact_type IS NULL OR a.byte_contract_family IS NULL OR a.artifact_contract_version IS NULL OR a.canonical_bytes IS NULL
    OR a.artifact_id !~ '^[a-z][a-z0-9._-]{0,127}$' OR a.artifact_version NOT BETWEEN 1 AND 9007199254740991 OR a.digest !~ '^[a-f0-9]{64}$' OR a.artifact_contract_version <> 1
    OR pg_catalog.encode(pg_catalog.sha256(a.canonical_bytes),'hex') <> a.digest THEN RAISE EXCEPTION 'invalid_input'; END IF;
  value := official_provenance_private.decode(a.canonical_bytes,1048576);
  IF a.byte_contract_family = 'global_definition_v1' THEN
    IF a.artifact_type <> 'global_cell' OR NOT official_provenance_private.keys(value,ARRAY['id','version','scope']) OR value->>'id' IS DISTINCT FROM a.artifact_id OR pg_catalog.jsonb_typeof(value->'version') IS DISTINCT FROM 'number' OR (value->>'version')::bigint IS DISTINCT FROM a.artifact_version THEN RAISE EXCEPTION 'invalid_input'; END IF;
    RETURN;
  ELSIF a.byte_contract_family = 'custody_v1' THEN
    IF a.artifact_type <> ALL(ARRAY['GlobalCellAdmissionV1','AcceptedEvidenceCustodyV1','SupportSelectionDefinitionV1','SelectedSupportManifestV1','GlobalRepresentationQualificationV1','AutonomousReviewConstructionV1'])
      OR NOT official_provenance_private.keys(value,ARRAY['kind','schemaVersion','value']) OR value->>'kind' IS DISTINCT FROM a.artifact_type OR value->'schemaVersion' IS DISTINCT FROM '1'::jsonb THEN RAISE EXCEPTION 'unsupported_version'; END IF;
    RETURN QUERY SELECT p.slot,p.pin FROM official_provenance_private.pins(value->'value') p;
  ELSIF a.byte_contract_family = 'manifest_v1' THEN
    IF a.artifact_type <> ALL(ARRAY['catalog_snapshot','identity_profile','extractor_registry','policy_registry','extractor_definition','policy_definition','fact_schema','applicability_schema','output_contract','proof_contract','freshness_contract','implementation_bundle','semantic_contract','content_item_definition','representation_definition','original_observation','validity_origin','accepted_origin','eligible_version_snapshot'])
      OR NOT official_provenance_private.keys(value,ARRAY['artifactType','artifactContractVersion','id','version','content','dependencies']) OR value->>'artifactType' IS DISTINCT FROM a.artifact_type OR value->'artifactContractVersion' IS DISTINCT FROM '1'::jsonb OR value->>'id' IS DISTINCT FROM a.artifact_id OR pg_catalog.jsonb_typeof(value->'version') IS DISTINCT FROM 'number' OR (value->>'version')::bigint IS DISTINCT FROM a.artifact_version
      OR pg_catalog.jsonb_typeof(value->'content') <> 'object' OR pg_catalog.jsonb_typeof(value->'dependencies') <> 'array' OR pg_catalog.jsonb_array_length(value->'dependencies') > 256 THEN RAISE EXCEPTION 'unsupported_version'; END IF;
    FOR edge IN SELECT e FROM pg_catalog.jsonb_array_elements(value->'dependencies') e LOOP
      IF NOT official_provenance_private.keys(edge,ARRAY['slot','pin']) OR pg_catalog.jsonb_typeof(edge->'slot') <> 'string' OR pg_catalog.octet_length(edge->>'slot') NOT BETWEEN 1 AND 1024 OR NOT official_provenance_private.valid_pin(edge->'pin') THEN RAISE EXCEPTION 'invalid_input'; END IF;
      slot:=edge->>'slot'; pin:=edge->'pin'; RETURN NEXT;
    END LOOP;
  ELSE RAISE EXCEPTION 'unsupported_version'; END IF;
END $$;
CREATE FUNCTION official_provenance_private.receipt_roots(value jsonb)
RETURNS TABLE(slot text, pin jsonb, expected_type text) LANGUAGE plpgsql IMMUTABLE STRICT SET search_path = '' AS $$
DECLARE item record;
BEGIN
  FOR item IN SELECT * FROM (VALUES
    ('globalCell.definition',value#>'{globalCell,definition}','global_cell'),
    ('candidate.factSchema',value#>'{candidate,factSchema}','fact_schema'),
    ('candidate.applicabilitySchema',value#>'{candidate,applicabilitySchema}','applicability_schema'),
    ('extractor.definition',value#>'{extractor,definition}','extractor_definition'),
    ('extractor.registrySnapshot',value#>'{extractor,registrySnapshot}','extractor_registry'),
    ('extractor.outputContract',value#>'{extractor,outputContract}','output_contract'),
    ('policy.definition',value#>'{policy,definition}','policy_definition'),
    ('policy.registrySnapshot',value#>'{policy,registrySnapshot}','policy_registry'),
    ('proof.contract',value#>'{proof,contract}','proof_contract'),
    ('proof.catalogSnapshot',value#>'{proof,catalogSnapshot}','catalog_snapshot'),
    ('proof.freshnessContract',value#>'{proof,freshnessContract}','freshness_contract')
  ) roots(s,p,t) LOOP
    IF item.s = 'candidate.applicabilitySchema' AND item.p = 'null'::jsonb THEN CONTINUE; END IF;
    IF item.s LIKE 'policy.%' AND value->'policy' = 'null'::jsonb THEN CONTINUE; END IF;
    IF item.p IS NULL OR NOT official_provenance_private.valid_pin(item.p) THEN RAISE EXCEPTION 'invalid_input'; END IF;
    slot:=item.s; pin:=item.p; expected_type:=item.t; RETURN NEXT;
  END LOOP;
END $$;
CREATE FUNCTION official_provenance_private.binding_roots(value jsonb, fingerprint text)
RETURNS TABLE(slot text,pin jsonb,expected_type text) LANGUAGE plpgsql IMMUTABLE STRICT SET search_path = '' AS $$
DECLARE item record;
BEGIN
 IF NOT official_provenance_private.keys(value,ARRAY['kind','schemaVersion','value']) OR value->>'kind' IS DISTINCT FROM 'CustodyDependencyBindingV1' OR value->'schemaVersion' IS DISTINCT FROM '1'::jsonb
 OR NOT official_provenance_private.keys(value->'value',ARRAY['receiptFingerprint','globalAdmission','selectedSupportManifest','autonomousReviewConstruction']) OR value#>>'{value,receiptFingerprint}' IS DISTINCT FROM fingerprint THEN RAISE EXCEPTION 'invalid_input'; END IF;
 FOR item IN SELECT * FROM (VALUES ('globalAdmission','GlobalCellAdmissionV1'),('selectedSupportManifest','SelectedSupportManifestV1'),('autonomousReviewConstruction','AutonomousReviewConstructionV1')) roots(s,t) LOOP
  slot:=item.s; pin:=value->'value'->item.s; expected_type:=item.t;
  IF NOT official_provenance_private.valid_pin(pin) THEN RAISE EXCEPTION 'invalid_input'; END IF; RETURN NEXT;
 END LOOP;
END $$;

CREATE TABLE official_provenance_private.artifact_names (
 artifact_id text COLLATE "C" PRIMARY KEY CHECK(artifact_id ~ '^[a-z][a-z0-9._-]{0,127}$'), artifact_type text COLLATE "C" NOT NULL, byte_contract_family text COLLATE "C" NOT NULL,
 UNIQUE(artifact_id,artifact_type,byte_contract_family)
);
CREATE TABLE official_provenance_private.artifact_blobs (
 digest text COLLATE "C" PRIMARY KEY CHECK(digest ~ '^[a-f0-9]{64}$'), canonical_bytes bytea NOT NULL CHECK(pg_catalog.octet_length(canonical_bytes) BETWEEN 1 AND 1048576),
 CONSTRAINT artifact_blob_hash_exact CHECK(pg_catalog.encode(pg_catalog.sha256(canonical_bytes),'hex')=digest)
);
CREATE TABLE official_provenance_private.artifacts (
 artifact_id text COLLATE "C" NOT NULL, artifact_version bigint NOT NULL CHECK(artifact_version BETWEEN 1 AND 9007199254740991), digest text COLLATE "C" NOT NULL,
 artifact_type text COLLATE "C" NOT NULL, byte_contract_family text COLLATE "C" NOT NULL, artifact_contract_version integer NOT NULL CHECK(artifact_contract_version=1),
 PRIMARY KEY(artifact_id,artifact_version), UNIQUE(artifact_id,artifact_version,digest),
 FOREIGN KEY(artifact_id,artifact_type,byte_contract_family) REFERENCES official_provenance_private.artifact_names(artifact_id,artifact_type,byte_contract_family) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(digest) REFERENCES official_provenance_private.artifact_blobs(digest) DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE official_provenance_private.receipts (
 record_fingerprint text COLLATE "C" PRIMARY KEY CHECK(record_fingerprint ~ '^ot-provenance-v1:[a-f0-9]{64}$'), canonical_payload_bytes bytea NOT NULL CHECK(pg_catalog.octet_length(canonical_payload_bytes) BETWEEN 1 AND 262144),
 storage_contract_version smallint NOT NULL CHECK(storage_contract_version=1), receipt_schema text NOT NULL CHECK(receipt_schema='official-truth-autonomous-provenance'), receipt_schema_version integer NOT NULL CHECK(receipt_schema_version=1), canonicalization text NOT NULL CHECK(canonicalization='ot-provenance-json-v1'),
 CHECK('ot-provenance-v1:'||pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to('ot-provenance-v1'||pg_catalog.chr(10),'UTF8')||canonical_payload_bytes),'hex')=record_fingerprint)
);
CREATE TABLE official_provenance_private.receipt_dependencies (
 record_fingerprint text COLLATE "C" NOT NULL, root_slot text COLLATE "C" NOT NULL CHECK(pg_catalog.octet_length(root_slot) BETWEEN 1 AND 1024), target_id text COLLATE "C" NOT NULL, target_version bigint NOT NULL, target_digest text COLLATE "C" NOT NULL,
 PRIMARY KEY(record_fingerprint,root_slot), FOREIGN KEY(record_fingerprint) REFERENCES official_provenance_private.receipts DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(target_id,target_version,target_digest) REFERENCES official_provenance_private.artifacts(artifact_id,artifact_version,digest) DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE official_provenance_private.artifact_dependencies (
 parent_id text COLLATE "C" NOT NULL, parent_version bigint NOT NULL, parent_digest text COLLATE "C" NOT NULL, slot text COLLATE "C" NOT NULL CHECK(pg_catalog.octet_length(slot) BETWEEN 1 AND 1024), target_id text COLLATE "C" NOT NULL, target_version bigint NOT NULL, target_digest text COLLATE "C" NOT NULL,
 PRIMARY KEY(parent_id,parent_version,slot), FOREIGN KEY(parent_id,parent_version,parent_digest) REFERENCES official_provenance_private.artifacts(artifact_id,artifact_version,digest) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(target_id,target_version,target_digest) REFERENCES official_provenance_private.artifacts(artifact_id,artifact_version,digest) DEFERRABLE INITIALLY DEFERRED,
 CHECK((parent_id,parent_version,parent_digest)<>(target_id,target_version,target_digest))
);
CREATE TABLE official_provenance_private.custody_bindings (
 record_fingerprint text COLLATE "C" PRIMARY KEY, binding_digest text COLLATE "C" NOT NULL UNIQUE, binding_schema_version smallint NOT NULL CHECK(binding_schema_version=1),
 FOREIGN KEY(record_fingerprint) REFERENCES official_provenance_private.receipts DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(binding_digest) REFERENCES official_provenance_private.artifact_blobs(digest) DEFERRABLE INITIALLY DEFERRED
);
ALTER TABLE official_provenance_private.receipts ADD CONSTRAINT receipt_requires_binding FOREIGN KEY(record_fingerprint) REFERENCES official_provenance_private.custody_bindings DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE official_provenance_private.custody_dependencies (
 record_fingerprint text COLLATE "C" NOT NULL, binding_slot text COLLATE "C" NOT NULL CHECK(binding_slot IN ('globalAdmission','selectedSupportManifest','autonomousReviewConstruction')), target_id text COLLATE "C" NOT NULL, target_version bigint NOT NULL, target_digest text COLLATE "C" NOT NULL,
 PRIMARY KEY(record_fingerprint,binding_slot), FOREIGN KEY(record_fingerprint) REFERENCES official_provenance_private.custody_bindings DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(target_id,target_version,target_digest) REFERENCES official_provenance_private.artifacts(artifact_id,artifact_version,digest) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX ON official_provenance_private.artifacts(digest);
CREATE INDEX ON official_provenance_private.receipt_dependencies(target_id,target_version,target_digest);
CREATE INDEX ON official_provenance_private.artifact_dependencies(target_id,target_version,target_digest);
CREATE INDEX ON official_provenance_private.custody_dependencies(target_id,target_version,target_digest);

CREATE FUNCTION official_provenance_private.reject_mutation() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$ BEGIN RAISE EXCEPTION 'immutable'; END $$;
DO $$ DECLARE name text; BEGIN
 FOREACH name IN ARRAY ARRAY['artifact_names','artifact_blobs','artifacts','receipts','receipt_dependencies','artifact_dependencies','custody_bindings','custody_dependencies'] LOOP
  EXECUTE pg_catalog.format('ALTER TABLE official_provenance_private.%I OWNER TO ot_provenance_ddl',name);
  EXECUTE pg_catalog.format('ALTER TABLE official_provenance_private.%I ENABLE ROW LEVEL SECURITY',name);
  EXECUTE pg_catalog.format('ALTER TABLE official_provenance_private.%I FORCE ROW LEVEL SECURITY',name);
  EXECUTE pg_catalog.format('CREATE POLICY writer_read ON official_provenance_private.%I FOR SELECT TO ot_provenance_write_exec USING(true)',name);
  EXECUTE pg_catalog.format('CREATE POLICY writer_insert ON official_provenance_private.%I FOR INSERT TO ot_provenance_write_exec WITH CHECK(true)',name);
  EXECUTE pg_catalog.format('CREATE POLICY historical_read ON official_provenance_private.%I FOR SELECT TO ot_provenance_read_exec USING(true)',name);
  EXECUTE pg_catalog.format('CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_provenance_private.%I FOR EACH ROW EXECUTE FUNCTION official_provenance_private.reject_mutation()',name);
  EXECUTE pg_catalog.format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_provenance_private.%I FOR EACH STATEMENT EXECUTE FUNCTION official_provenance_private.reject_mutation()',name);
 END LOOP;
END $$;
GRANT USAGE ON SCHEMA official_provenance_private TO ot_provenance_write_exec,ot_provenance_read_exec;
GRANT SELECT,INSERT ON ALL TABLES IN SCHEMA official_provenance_private TO ot_provenance_write_exec;
GRANT SELECT ON ALL TABLES IN SCHEMA official_provenance_private TO ot_provenance_read_exec;
GRANT USAGE ON SCHEMA official_provenance_api TO ot_provenance_write_exec,ot_provenance_read_exec,ot_provenance_writer,ot_provenance_reader;
GRANT USAGE ON TYPE official_provenance_api.artifact_input_v1 TO ot_provenance_write_exec,ot_provenance_read_exec,ot_provenance_writer;

-- Structural graph validation is independent SQL. It is deliberately NOT a legal/domain semantic verifier.
CREATE FUNCTION official_provenance_private.validate_structure(fingerprint text,receipt_bytes bytea,binding_bytes bytea,artifacts official_provenance_api.artifact_input_v1[]) RETURNS void
LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
DECLARE receipt jsonb; binding jsonb; a official_provenance_api.artifact_input_v1; b official_provenance_api.artifact_input_v1; root record; edge record;
 graph jsonb := '{}'::jsonb; starts jsonb := '[]'::jsonb; work jsonb; item jsonb; visited jsonb := '{}'::jsonb; longest jsonb := '{}'::jsonb; key text; target text; total_bytes bigint; edge_count integer; depth integer;
BEGIN
 IF fingerprint IS NULL OR receipt_bytes IS NULL OR binding_bytes IS NULL OR artifacts IS NULL OR fingerprint !~ '^ot-provenance-v1:[a-f0-9]{64}$'
 OR pg_catalog.array_ndims(artifacts) <> 1 OR pg_catalog.array_lower(artifacts,1) <> 1 OR pg_catalog.cardinality(artifacts) NOT BETWEEN 1 AND 255 THEN RAISE EXCEPTION 'invalid_input'; END IF;
 receipt:=official_provenance_private.decode(receipt_bytes,262144); binding:=official_provenance_private.decode(binding_bytes,4096);
 IF receipt->>'schema' IS DISTINCT FROM 'official-truth-autonomous-provenance' OR receipt->'schemaVersion' IS DISTINCT FROM '1'::jsonb OR receipt->>'canonicalization' IS DISTINCT FROM 'ot-provenance-json-v1'
 OR 'ot-provenance-v1:'||pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to('ot-provenance-v1'||pg_catalog.chr(10),'UTF8')||receipt_bytes),'hex') <> fingerprint THEN RAISE EXCEPTION 'invalid_input'; END IF;
 IF (SELECT pg_catalog.count(*) FROM (SELECT x.artifact_id,x.artifact_version FROM pg_catalog.unnest(artifacts) x GROUP BY x.artifact_id,x.artifact_version) q) <> pg_catalog.cardinality(artifacts) THEN RAISE EXCEPTION 'invalid_input'; END IF;
 total_bytes:=pg_catalog.octet_length(binding_bytes); edge_count:=1;
 FOREACH a IN ARRAY artifacts LOOP
  total_bytes:=total_bytes+pg_catalog.octet_length(a.canonical_bytes);
  key:=a.artifact_id||':'||a.artifact_version::text||':'||a.digest;
  graph:=graph||pg_catalog.jsonb_build_object(key,'[]'::jsonb);
  FOR edge IN SELECT * FROM official_provenance_private.artifact_edges(a) LOOP
   edge_count:=edge_count+1;
   IF EXISTS(SELECT 1 FROM official_provenance_private.artifact_edges(a) e GROUP BY e.slot HAVING pg_catalog.count(*)>1) THEN RAISE EXCEPTION 'invalid_input'; END IF;
   IF NOT EXISTS(SELECT 1 FROM pg_catalog.unnest(artifacts) x WHERE x.artifact_id=edge.pin->>'id' AND x.artifact_version=(edge.pin->>'version')::bigint AND x.digest=edge.pin->>'digest') THEN RAISE EXCEPTION 'dependency_missing'; END IF;
   target:=(edge.pin->>'id')||':'||(edge.pin->>'version')||':'||(edge.pin->>'digest');
   graph:=pg_catalog.jsonb_set(graph,ARRAY[key],graph->key||pg_catalog.to_jsonb(target));
  END LOOP;
 END LOOP;
 FOR root IN SELECT * FROM official_provenance_private.receipt_roots(receipt) UNION ALL SELECT * FROM official_provenance_private.binding_roots(binding,fingerprint) LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_catalog.unnest(artifacts) x WHERE x.artifact_id=root.pin->>'id' AND x.artifact_version=(root.pin->>'version')::bigint AND x.digest=root.pin->>'digest' AND x.artifact_type=root.expected_type) THEN RAISE EXCEPTION 'dependency_missing'; END IF;
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
  IF depth>8 THEN RAISE EXCEPTION 'bound_exceeded'; END IF;
  IF item->'path' ? key THEN RAISE EXCEPTION 'cycle'; END IF;
  IF longest ? key AND (longest->>key)::integer >= depth THEN CONTINUE; END IF;
  longest:=longest||pg_catalog.jsonb_build_object(key,depth);
  visited:=visited||pg_catalog.jsonb_build_object(key,true);
  FOR target IN SELECT pg_catalog.jsonb_array_elements_text(graph->key) LOOP
   work:=work||pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('key',target,'depth',depth+1,'path',item->'path'||pg_catalog.to_jsonb(key)));
   IF pg_catalog.jsonb_array_length(work)>8192 THEN RAISE EXCEPTION 'bound_exceeded'; END IF;
  END LOOP;
 END LOOP;
 IF (SELECT pg_catalog.count(*) FROM pg_catalog.jsonb_object_keys(visited))<>pg_catalog.cardinality(artifacts) THEN RAISE EXCEPTION 'unsolicited_artifact'; END IF;
END $$;

CREATE FUNCTION official_provenance_private.verify_retained(fingerprint text) RETURNS void
LANGUAGE plpgsql STABLE SET search_path = '' AS $$
DECLARE receipt_bytes bytea; binding_bytes bytea; a official_provenance_api.artifact_input_v1; closure official_provenance_api.artifact_input_v1[]; root record; edge record; expected integer;
BEGIN
 SELECT r.canonical_payload_bytes,b.canonical_bytes INTO receipt_bytes,binding_bytes FROM official_provenance_private.receipts r JOIN official_provenance_private.custody_bindings k USING(record_fingerprint) JOIN official_provenance_private.artifact_blobs b ON b.digest=k.binding_digest WHERE r.record_fingerprint=fingerprint;
 IF (SELECT r.storage_contract_version FROM official_provenance_private.receipts r WHERE r.record_fingerprint=fingerprint) IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'unsupported_version';END IF;
 IF receipt_bytes IS NULL OR binding_bytes IS NULL THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
 WITH RECURSIVE reachable(id,version,digest) AS (
  SELECT target_id,target_version,target_digest FROM official_provenance_private.receipt_dependencies WHERE record_fingerprint=fingerprint
  UNION SELECT target_id,target_version,target_digest FROM official_provenance_private.custody_dependencies WHERE record_fingerprint=fingerprint
  UNION SELECT e.target_id,e.target_version,e.target_digest FROM official_provenance_private.artifact_dependencies e JOIN reachable r ON (e.parent_id,e.parent_version,e.parent_digest)=(r.id,r.version,r.digest)
 ) SELECT pg_catalog.array_agg(ROW(ar.artifact_id,ar.artifact_version,ar.digest,ar.artifact_type,ar.byte_contract_family,ar.artifact_contract_version,b.canonical_bytes)::official_provenance_api.artifact_input_v1 ORDER BY ar.artifact_id,ar.artifact_version) INTO closure FROM reachable r JOIN official_provenance_private.artifacts ar ON (ar.artifact_id,ar.artifact_version,ar.digest)=(r.id,r.version,r.digest) JOIN official_provenance_private.artifact_blobs b ON b.digest=ar.digest;
 PERFORM official_provenance_private.validate_structure(fingerprint,receipt_bytes,binding_bytes,closure);
 SELECT pg_catalog.count(*) INTO expected FROM official_provenance_private.receipt_roots(official_provenance_private.decode(receipt_bytes,262144));
 IF (SELECT pg_catalog.count(*) FROM official_provenance_private.receipt_dependencies WHERE record_fingerprint=fingerprint)<>expected THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
 FOR root IN SELECT * FROM official_provenance_private.receipt_roots(official_provenance_private.decode(receipt_bytes,262144)) LOOP
  IF NOT EXISTS(SELECT 1 FROM official_provenance_private.receipt_dependencies e WHERE e.record_fingerprint=fingerprint AND e.root_slot=root.slot AND e.target_id=root.pin->>'id' AND e.target_version=(root.pin->>'version')::bigint AND e.target_digest=root.pin->>'digest') THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
 END LOOP;
 IF (SELECT pg_catalog.count(*) FROM official_provenance_private.custody_dependencies WHERE record_fingerprint=fingerprint)<>3 THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
 FOR root IN SELECT * FROM official_provenance_private.binding_roots(official_provenance_private.decode(binding_bytes,4096),fingerprint) LOOP
  IF NOT EXISTS(SELECT 1 FROM official_provenance_private.custody_dependencies e WHERE e.record_fingerprint=fingerprint AND e.binding_slot=root.slot AND e.target_id=root.pin->>'id' AND e.target_version=(root.pin->>'version')::bigint AND e.target_digest=root.pin->>'digest') THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
 END LOOP;
 FOREACH a IN ARRAY closure LOOP
  SELECT pg_catalog.count(*) INTO expected FROM official_provenance_private.artifact_edges(a);
  IF (SELECT pg_catalog.count(*) FROM official_provenance_private.artifact_dependencies e WHERE (e.parent_id,e.parent_version,e.parent_digest)=(a.artifact_id,a.artifact_version,a.digest))<>expected THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
  FOR edge IN SELECT * FROM official_provenance_private.artifact_edges(a) LOOP
   IF NOT EXISTS(SELECT 1 FROM official_provenance_private.artifact_dependencies e WHERE (e.parent_id,e.parent_version,e.parent_digest)=(a.artifact_id,a.artifact_version,a.digest) AND e.slot=edge.slot AND e.target_id=edge.pin->>'id' AND e.target_version=(edge.pin->>'version')::bigint AND e.target_digest=edge.pin->>'digest') THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
  END LOOP;
 END LOOP;
END $$;
CREATE FUNCTION official_provenance_private.verify_artifact_retained(id text,version bigint,digest_value text) RETURNS void
LANGUAGE plpgsql STABLE SET search_path = '' AS $$
DECLARE node record; a official_provenance_api.artifact_input_v1; edge record; expected integer; count_nodes integer := 0;
BEGIN
 FOR node IN WITH RECURSIVE graph(id,version,digest,depth,path) AS (
  SELECT id COLLATE "C",version,digest_value COLLATE "C",0,ARRAY[id||':'||version::text||':'||digest_value] COLLATE "C"
  UNION ALL SELECT e.target_id,e.target_version,e.target_digest,g.depth+1,g.path||(e.target_id||':'||e.target_version::text||':'||e.target_digest)
   FROM graph g JOIN official_provenance_private.artifact_dependencies e ON (e.parent_id,e.parent_version,e.parent_digest)=(g.id,g.version,g.digest) WHERE g.depth<9
 ) SELECT * FROM graph LOOP
  count_nodes:=count_nodes+1;
  IF count_nodes>1024 OR node.depth>8 OR (SELECT pg_catalog.count(*) FROM pg_catalog.unnest(node.path))<>(SELECT pg_catalog.count(DISTINCT p) FROM pg_catalog.unnest(node.path) p) THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
  SELECT r.artifact_id,r.artifact_version,r.digest,r.artifact_type,r.byte_contract_family,r.artifact_contract_version,b.canonical_bytes INTO a
   FROM official_provenance_private.artifacts r JOIN official_provenance_private.artifact_blobs b USING(digest) WHERE (r.artifact_id,r.artifact_version,r.digest)=(node.id,node.version,node.digest);
  IF a IS NULL THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
  SELECT pg_catalog.count(*) INTO expected FROM official_provenance_private.artifact_edges(a);
  IF (SELECT pg_catalog.count(*) FROM official_provenance_private.artifact_dependencies e WHERE (e.parent_id,e.parent_version,e.parent_digest)=(node.id,node.version,node.digest))<>expected THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
  FOR edge IN SELECT * FROM official_provenance_private.artifact_edges(a) LOOP
   IF NOT EXISTS(SELECT 1 FROM official_provenance_private.artifact_dependencies e WHERE (e.parent_id,e.parent_version,e.parent_digest)=(node.id,node.version,node.digest) AND e.slot=edge.slot AND e.target_id=edge.pin->>'id' AND e.target_version=(edge.pin->>'version')::bigint AND e.target_digest=edge.pin->>'digest') THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
  END LOOP;
 END LOOP;
END $$;
CREATE FUNCTION official_provenance_private.receipt_constraint() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN PERFORM official_provenance_private.verify_retained(NEW.record_fingerprint); RETURN NEW; END $$;
CREATE CONSTRAINT TRIGGER receipt_complete AFTER INSERT ON official_provenance_private.receipts DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION official_provenance_private.receipt_constraint();
CREATE CONSTRAINT TRIGGER binding_complete AFTER INSERT ON official_provenance_private.custody_bindings DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION official_provenance_private.receipt_constraint();
CREATE CONSTRAINT TRIGGER receipt_links_complete AFTER INSERT ON official_provenance_private.receipt_dependencies DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION official_provenance_private.receipt_constraint();
CREATE CONSTRAINT TRIGGER custody_links_complete AFTER INSERT ON official_provenance_private.custody_dependencies DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION official_provenance_private.receipt_constraint();

CREATE FUNCTION official_provenance_api.publish_structural_fixture_v1(storage_version smallint,mode text,fingerprint text,receipt_bytes bytea,binding_bytes bytea,submitted official_provenance_api.artifact_input_v1[])
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER PARALLEL UNSAFE SET search_path = '' SET lock_timeout = '5s' SET statement_timeout = '15s' AS $$
DECLARE a official_provenance_api.artifact_input_v1; existing official_provenance_api.artifact_input_v1; edge record; root record; blob bytea; digest_value text; new_objects official_provenance_api.artifact_input_v1[] := '{}'; receipt jsonb; binding jsonb;
BEGIN
 IF storage_version IS NULL OR storage_version<>1 OR mode IS NULL OR mode<>ALL(ARRAY['create_or_verify','verify_existing']) OR pg_catalog.current_setting('transaction_isolation')<>'read committed' OR pg_catalog.current_setting('transaction_read_only')<>'off' THEN RAISE EXCEPTION 'invalid_input'; END IF;
 PERFORM official_provenance_private.validate_structure(fingerprint,receipt_bytes,binding_bytes,submitted);
 PERFORM pg_catalog.pg_advisory_xact_lock(1869901924,1);
 -- Every store read happens after the lock in a fresh READ COMMITTED command.
 SELECT r.canonical_payload_bytes INTO blob FROM official_provenance_private.receipts r WHERE r.record_fingerprint=fingerprint;
 IF FOUND THEN
  IF blob<>receipt_bytes THEN RAISE EXCEPTION 'conflicting_identity'; END IF;
  SELECT b.canonical_bytes INTO blob FROM official_provenance_private.custody_bindings k JOIN official_provenance_private.artifact_blobs b ON b.digest=k.binding_digest WHERE k.record_fingerprint=fingerprint;
  IF NOT FOUND THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
  IF blob<>binding_bytes THEN RAISE EXCEPTION 'conflicting_identity'; END IF;
  PERFORM official_provenance_private.verify_retained(fingerprint);
  FOREACH a IN ARRAY submitted LOOP
   SELECT r.artifact_id,r.artifact_version,r.digest,r.artifact_type,r.byte_contract_family,r.artifact_contract_version,b.canonical_bytes INTO existing FROM official_provenance_private.artifacts r JOIN official_provenance_private.artifact_blobs b USING(digest) WHERE (r.artifact_id,r.artifact_version)=(a.artifact_id,a.artifact_version);
   IF existing IS DISTINCT FROM a THEN RAISE EXCEPTION 'conflicting_identity'; END IF;
  END LOOP;
  RETURN 'idempotent';
 END IF;
 IF mode='verify_existing' THEN RAISE EXCEPTION 'existing_receipt_absent'; END IF;
 IF EXISTS(SELECT 1 FROM official_provenance_private.custody_bindings k WHERE k.record_fingerprint=fingerprint) THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
 FOREACH a IN ARRAY submitted LOOP
  SELECT r.artifact_id,r.artifact_version,r.digest,r.artifact_type,r.byte_contract_family,r.artifact_contract_version,b.canonical_bytes INTO existing FROM official_provenance_private.artifacts r JOIN official_provenance_private.artifact_blobs b USING(digest) WHERE (r.artifact_id,r.artifact_version)=(a.artifact_id,a.artifact_version);
  IF FOUND THEN
   IF existing IS DISTINCT FROM a THEN RAISE EXCEPTION 'conflicting_identity'; END IF;
   PERFORM official_provenance_private.verify_artifact_retained(a.artifact_id,a.artifact_version,a.digest);
  ELSE
   IF EXISTS(SELECT 1 FROM official_provenance_private.artifacts r WHERE (r.artifact_id,r.artifact_version)=(a.artifact_id,a.artifact_version)) THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
   IF EXISTS(SELECT 1 FROM official_provenance_private.artifact_names n WHERE n.artifact_id=a.artifact_id AND (n.artifact_type,n.byte_contract_family)<>(a.artifact_type,a.byte_contract_family)) THEN RAISE EXCEPTION 'conflicting_identity'; END IF;
   new_objects:=new_objects||a;
  END IF;
  SELECT b.canonical_bytes INTO blob FROM official_provenance_private.artifact_blobs b WHERE b.digest=a.digest;
  IF FOUND AND blob<>a.canonical_bytes THEN RAISE EXCEPTION 'conflicting_identity'; END IF;
 END LOOP;
 digest_value:=pg_catalog.encode(pg_catalog.sha256(binding_bytes),'hex');
 SELECT b.canonical_bytes INTO blob FROM official_provenance_private.artifact_blobs b WHERE b.digest=digest_value;
 IF FOUND AND blob<>binding_bytes THEN RAISE EXCEPTION 'conflicting_identity'; END IF;
 FOR a IN SELECT * FROM pg_catalog.unnest(new_objects) x ORDER BY x.artifact_id,x.artifact_version LOOP
  IF NOT EXISTS(SELECT 1 FROM official_provenance_private.artifact_names n WHERE n.artifact_id=a.artifact_id) THEN INSERT INTO official_provenance_private.artifact_names VALUES(a.artifact_id,a.artifact_type,a.byte_contract_family); END IF;
 END LOOP;
 FOR a IN SELECT * FROM pg_catalog.unnest(new_objects) x ORDER BY x.digest LOOP
  IF NOT EXISTS(SELECT 1 FROM official_provenance_private.artifact_blobs b WHERE b.digest=a.digest) THEN INSERT INTO official_provenance_private.artifact_blobs VALUES(a.digest,a.canonical_bytes); END IF;
 END LOOP;
 FOR a IN SELECT * FROM pg_catalog.unnest(new_objects) x ORDER BY x.artifact_id,x.artifact_version LOOP INSERT INTO official_provenance_private.artifacts VALUES(a.artifact_id,a.artifact_version,a.digest,a.artifact_type,a.byte_contract_family,a.artifact_contract_version); END LOOP;
 FOR a IN SELECT * FROM pg_catalog.unnest(new_objects) x ORDER BY x.artifact_id,x.artifact_version LOOP
  FOR edge IN SELECT * FROM official_provenance_private.artifact_edges(a) ORDER BY slot LOOP INSERT INTO official_provenance_private.artifact_dependencies VALUES(a.artifact_id,a.artifact_version,a.digest,edge.slot,edge.pin->>'id',(edge.pin->>'version')::bigint,edge.pin->>'digest'); END LOOP;
 END LOOP;
 receipt:=official_provenance_private.decode(receipt_bytes,262144); binding:=official_provenance_private.decode(binding_bytes,4096);
 INSERT INTO official_provenance_private.receipts VALUES(fingerprint,receipt_bytes,1,receipt->>'schema',(receipt->>'schemaVersion')::integer,receipt->>'canonicalization');
 FOR root IN SELECT * FROM official_provenance_private.receipt_roots(receipt) ORDER BY slot LOOP INSERT INTO official_provenance_private.receipt_dependencies VALUES(fingerprint,root.slot,root.pin->>'id',(root.pin->>'version')::bigint,root.pin->>'digest'); END LOOP;
 IF NOT EXISTS(SELECT 1 FROM official_provenance_private.artifact_blobs b WHERE b.digest=digest_value) THEN INSERT INTO official_provenance_private.artifact_blobs VALUES(digest_value,binding_bytes); END IF;
 INSERT INTO official_provenance_private.custody_bindings VALUES(fingerprint,digest_value,1);
 FOR root IN SELECT * FROM official_provenance_private.binding_roots(binding,fingerprint) ORDER BY slot LOOP INSERT INTO official_provenance_private.custody_dependencies VALUES(fingerprint,root.slot,root.pin->>'id',(root.pin->>'version')::bigint,root.pin->>'digest'); END LOOP;
 SET CONSTRAINTS official_provenance_private.receipt_complete,official_provenance_private.binding_complete,official_provenance_private.receipt_links_complete,official_provenance_private.custody_links_complete IMMEDIATE;
 PERFORM official_provenance_private.verify_retained(fingerprint);
 RETURN 'inserted';
END $$;
ALTER FUNCTION official_provenance_api.publish_structural_fixture_v1(smallint,text,text,bytea,bytea,official_provenance_api.artifact_input_v1[]) OWNER TO ot_provenance_write_exec;

CREATE FUNCTION official_provenance_api.read_structural_fixture_v1(fingerprint text)
RETURNS TABLE(row_kind text,metadata jsonb,canonical_bytes bytea) LANGUAGE plpgsql STABLE SECURITY DEFINER PARALLEL UNSAFE SET search_path = '' SET statement_timeout = '15s' AS $$
BEGIN
 IF fingerprint IS NULL OR fingerprint !~ '^ot-provenance-v1:[a-f0-9]{64}$' OR pg_catalog.current_setting('transaction_isolation')<>'repeatable read' OR pg_catalog.current_setting('transaction_read_only')<>'on' THEN RAISE EXCEPTION 'invalid_input'; END IF;
 IF NOT EXISTS(SELECT 1 FROM official_provenance_private.receipts r WHERE r.record_fingerprint=fingerprint) THEN RETURN QUERY SELECT 'read_status'::text,pg_catalog.jsonb_build_object('status','receipt_absent'),NULL::bytea; RETURN; END IF;
 PERFORM official_provenance_private.verify_retained(fingerprint);
 RETURN QUERY SELECT 'receipt'::text,pg_catalog.jsonb_build_object('recordFingerprint',r.record_fingerprint),r.canonical_payload_bytes FROM official_provenance_private.receipts r WHERE r.record_fingerprint=fingerprint;
 RETURN QUERY SELECT 'binding'::text,pg_catalog.jsonb_build_object('digest',k.binding_digest),b.canonical_bytes FROM official_provenance_private.custody_bindings k JOIN official_provenance_private.artifact_blobs b ON b.digest=k.binding_digest WHERE k.record_fingerprint=fingerprint;
 RETURN QUERY WITH RECURSIVE reachable(id,version,digest) AS (
  SELECT e.target_id,e.target_version,e.target_digest FROM official_provenance_private.receipt_dependencies e WHERE e.record_fingerprint=fingerprint
  UNION SELECT e.target_id,e.target_version,e.target_digest FROM official_provenance_private.custody_dependencies e WHERE e.record_fingerprint=fingerprint
  UNION SELECT e.target_id,e.target_version,e.target_digest FROM official_provenance_private.artifact_dependencies e JOIN reachable r ON (e.parent_id,e.parent_version,e.parent_digest)=(r.id,r.version,r.digest)
 ) SELECT 'artifact'::text,pg_catalog.jsonb_build_object('pin',pg_catalog.jsonb_build_object('id',a.artifact_id,'version',a.artifact_version,'digest',a.digest),'artifactType',a.artifact_type,'byteContractFamily',a.byte_contract_family,'artifactContractVersion',a.artifact_contract_version),b.canonical_bytes FROM reachable r JOIN official_provenance_private.artifacts a ON (a.artifact_id,a.artifact_version,a.digest)=(r.id,r.version,r.digest) JOIN official_provenance_private.artifact_blobs b ON b.digest=a.digest ORDER BY a.artifact_id,a.artifact_version;
 RETURN QUERY SELECT 'receipt_link'::text,pg_catalog.jsonb_build_object('slot',e.root_slot,'pin',pg_catalog.jsonb_build_object('id',e.target_id,'version',e.target_version,'digest',e.target_digest)),NULL::bytea FROM official_provenance_private.receipt_dependencies e WHERE e.record_fingerprint=fingerprint ORDER BY e.root_slot;
 RETURN QUERY SELECT 'binding_link'::text,pg_catalog.jsonb_build_object('slot',e.binding_slot,'pin',pg_catalog.jsonb_build_object('id',e.target_id,'version',e.target_version,'digest',e.target_digest)),NULL::bytea FROM official_provenance_private.custody_dependencies e WHERE e.record_fingerprint=fingerprint ORDER BY e.binding_slot;
 RETURN QUERY SELECT 'read_status'::text,pg_catalog.jsonb_build_object('status','complete_structure_only'),NULL::bytea;
END $$;
ALTER FUNCTION official_provenance_api.read_structural_fixture_v1(text) OWNER TO ot_provenance_read_exec;
DO $$ DECLARE routine record; BEGIN
 FOR routine IN SELECT p.oid::pg_catalog.regprocedure AS signature FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='official_provenance_private' LOOP
  EXECUTE pg_catalog.format('ALTER FUNCTION %s OWNER TO ot_provenance_ddl',routine.signature);
 END LOOP;
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA official_provenance_private,official_provenance_api FROM PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA official_provenance_private TO ot_provenance_write_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.utf16_sort_key(text),official_provenance_private.canonical(json,integer),official_provenance_private.decode(bytea,integer),official_provenance_private.keys(jsonb,text[]),official_provenance_private.valid_pin(jsonb),official_provenance_private.pins(jsonb,text),official_provenance_private.artifact_edges(official_provenance_api.artifact_input_v1),official_provenance_private.receipt_roots(jsonb),official_provenance_private.binding_roots(jsonb,text),official_provenance_private.validate_structure(text,bytea,bytea,official_provenance_api.artifact_input_v1[]),official_provenance_private.verify_retained(text) TO ot_provenance_read_exec;
-- Read executor receives only pure helpers; trigger helpers cannot be invoked directly.
GRANT EXECUTE ON FUNCTION official_provenance_api.publish_structural_fixture_v1(smallint,text,text,bytea,bytea,official_provenance_api.artifact_input_v1[]) TO ot_provenance_writer;
GRANT EXECUTE ON FUNCTION official_provenance_api.read_structural_fixture_v1(text) TO ot_provenance_reader;
COMMIT;
