-- LOCAL / UNAPPLIED. Not a migration and not an activation mechanism.
-- Install this file and functions-candidate.sql in ONE explicit transaction
-- only inside the owned synthetic native fixture. No hosted target is accepted.
-- No existing role, authority function, default privilege or guard is changed.

CREATE SCHEMA jetnity_cms_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_cms_private FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION jetnity_cms_private.reference_v1(p_entry_id text) RETURNS jsonb
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
  SELECT jsonb_build_object('entryId', r.id, 'locale', 'de', 'name', r.name,
    'country', r.country, 'image', r.image)
  FROM (VALUES
    ('geonames:1650535', 'Bali', 'Indonesien', '/images/bali.jpg'),
    ('geonames:2267057', 'Lissabon', 'Portugal', '/images/lisbon.jpg'),
    ('geonames:2657915', 'Zermatt', 'Schweiz', '/images/zermatt.jpg'),
    ('geonames:2759794', 'Amsterdam', 'Niederlande', '/images/amsterdam.jpg')
  ) AS r(id, name, country, image) WHERE r.id = p_entry_id
$$;

CREATE FUNCTION jetnity_cms_private.text_valid_v1(p_value text, p_characters integer, p_bytes integer)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
DECLARE whitespace text := ' ' || chr(9) || chr(10) || chr(11) || chr(12) || chr(13)
  || chr(160) || chr(5760) || chr(8192) || chr(8193) || chr(8194) || chr(8195)
  || chr(8196) || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201)
  || chr(8202) || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288) || chr(65279);
BEGIN
  RETURN coalesce(p_value <> '' AND char_length(p_value) <= p_characters
    AND octet_length(p_value) <= p_bytes AND p_value = btrim(p_value, whitespace)
    AND p_value !~ ('[' || chr(1) || '-' || chr(31) || chr(127) || '-' || chr(159) || '<>]'), false);
END $$;

CREATE FUNCTION jetnity_cms_private.editable_valid_v1(p_payload jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
DECLARE item jsonb; position integer; previous integer := 0;
BEGIN
  IF jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN RETURN false; END IF;
  IF (SELECT array_agg(k ORDER BY k COLLATE "C") FROM jsonb_object_keys(p_payload) k)
    IS DISTINCT FROM ARRAY['beschreibung', 'idea', 'themen']::text[] THEN RETURN false; END IF;
  IF jsonb_typeof(p_payload->'beschreibung') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_payload->'idea') IS DISTINCT FROM 'string'
    OR NOT jetnity_cms_private.text_valid_v1(p_payload->>'beschreibung', 800, 3200)
    OR NOT jetnity_cms_private.text_valid_v1(p_payload->>'idea', 300, 1200)
    OR jsonb_typeof(p_payload->'themen') IS DISTINCT FROM 'array' THEN RETURN false; END IF;
  IF jsonb_array_length(p_payload->'themen') NOT BETWEEN 1 AND 4 THEN RETURN false; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_payload->'themen') LOOP
    IF jsonb_typeof(item) IS DISTINCT FROM 'string' THEN RETURN false; END IF;
    position := array_position(ARRAY['stadt-kultur','natur','strand','erholung']::text[], item #>> '{}');
    IF position IS NULL OR position <= previous THEN RETURN false; END IF;
    previous := position;
  END LOOP;
  RETURN true;
END $$;

CREATE FUNCTION jetnity_cms_private.snapshot_valid_v1(p_entry_id text, p_content jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  IF jsonb_typeof(p_content) IS DISTINCT FROM 'object'
    OR jetnity_cms_private.reference_v1(p_entry_id) IS NULL THEN RETURN false; END IF;
  RETURN (p_content - ARRAY['beschreibung','idea','themen']) = jetnity_cms_private.reference_v1(p_entry_id)
    AND jetnity_cms_private.editable_valid_v1(jsonb_build_object(
      'beschreibung', p_content->'beschreibung', 'idea', p_content->'idea', 'themen', p_content->'themen'));
END $$;

CREATE FUNCTION jetnity_cms_private.timestamp_v1(p_value timestamptz) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
  SELECT CASE WHEN p_value IS NULL THEN NULL
    ELSE to_char(p_value AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') END
$$;

CREATE FUNCTION jetnity_cms_private.decimal_valid_v1(p_value jsonb, p_zero boolean, p_null boolean)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
DECLARE value text;
BEGIN
  IF p_value IS NULL THEN RETURN false; END IF;
  IF p_value = 'null'::jsonb THEN RETURN coalesce(p_null, false); END IF;
  IF jsonb_typeof(p_value) IS DISTINCT FROM 'string' THEN RETURN false; END IF;
  value := p_value #>> '{}';
  IF value !~ '^(0|[1-9][0-9]{0,18})$' THEN RETURN false; END IF;
  RETURN value::numeric <= 9223372036854775807 AND (coalesce(p_zero, false) OR value <> '0');
END $$;

CREATE FUNCTION jetnity_cms_private.revision_payload_valid_v1(p_payload jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  IF jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN RETURN false; END IF;
  RETURN (SELECT array_agg(k ORDER BY k COLLATE "C") FROM jsonb_object_keys(p_payload) k)
    IS NOT DISTINCT FROM ARRAY['revision']::text[]
    AND jetnity_cms_private.decimal_valid_v1(p_payload->'revision', false, false);
END $$;

CREATE FUNCTION jetnity_cms_private.request_valid_v1(
  p_request jsonb, p_request_id uuid, p_actor_id uuid, p_entry_id text, p_before bigint
) RETURNS boolean LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
DECLARE key text; action text;
BEGIN
  IF jsonb_typeof(p_request) IS DISTINCT FROM 'object' THEN RETURN false; END IF;
  IF (SELECT array_agg(k ORDER BY k COLLATE "C") FROM jsonb_object_keys(p_request) k)
    IS DISTINCT FROM ARRAY['action','actorId','entryId','expectedVersion','payload','requestId','schema']::text[] THEN RETURN false; END IF;
  FOREACH key IN ARRAY ARRAY['action','actorId','entryId','expectedVersion','requestId'] LOOP
    IF jsonb_typeof(p_request->key) IS DISTINCT FROM 'string' THEN RETURN false; END IF;
  END LOOP;
  IF NOT coalesce(p_request->'schema' = '1'::jsonb
    AND p_request->>'requestId' = p_request_id::text AND p_request->>'actorId' = p_actor_id::text
    AND p_request->>'entryId' = p_entry_id AND p_request->>'expectedVersion' = p_before::text
    AND p_before >= 0, false) THEN RETURN false; END IF;
  action := p_request->>'action';
  IF action = 'save_draft' THEN RETURN jetnity_cms_private.editable_valid_v1(p_request->'payload');
  ELSIF action IN ('publish','restore_draft') THEN RETURN jetnity_cms_private.revision_payload_valid_v1(p_request->'payload');
  ELSIF action = 'archive' THEN RETURN p_request->'payload' = '{}'::jsonb;
  END IF;
  RETURN false;
END $$;

CREATE FUNCTION jetnity_cms_private.receipt_valid_v1(
  p_result jsonb, p_request jsonb, p_after bigint, p_recorded_at timestamptz
) RETURNS boolean LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
DECLARE key text; action text;
BEGIN
  IF jsonb_typeof(p_result) IS DISTINCT FROM 'object'
    OR p_after IS NULL OR p_after <= 0 OR p_recorded_at IS NULL OR NOT isfinite(p_recorded_at) THEN RETURN false; END IF;
  IF (SELECT array_agg(k ORDER BY k COLLATE "C") FROM jsonb_object_keys(p_result) k)
    IS DISTINCT FROM ARRAY['action','archived','beforeVersion','createdRevision','draftRevision','entryId',
      'publishedRevision','recordedAt','requestId','schema','status','version']::text[] THEN RETURN false; END IF;
  FOREACH key IN ARRAY ARRAY['action','beforeVersion','entryId','recordedAt','requestId','status','version'] LOOP
    IF jsonb_typeof(p_result->key) IS DISTINCT FROM 'string' THEN RETURN false; END IF;
  END LOOP;
  IF jsonb_typeof(p_result->'archived') IS DISTINCT FROM 'boolean'
    OR NOT jetnity_cms_private.decimal_valid_v1(p_result->'draftRevision', false, false)
    OR NOT jetnity_cms_private.decimal_valid_v1(p_result->'publishedRevision', false, true)
    OR NOT jetnity_cms_private.decimal_valid_v1(p_result->'createdRevision', false, true) THEN RETURN false; END IF;
  IF NOT coalesce(p_result->'schema' = '1'::jsonb AND p_result->>'status' = 'recorded'
    AND p_result->'requestId' = p_request->'requestId' AND p_result->'entryId' = p_request->'entryId'
    AND p_result->'action' = p_request->'action' AND p_result->'beforeVersion' = p_request->'expectedVersion'
    AND p_result->>'version' = p_after::text
    AND p_result->>'recordedAt' = jetnity_cms_private.timestamp_v1(p_recorded_at), false) THEN RETURN false; END IF;
  IF (p_result->>'draftRevision')::bigint > p_after
    OR (p_result->>'publishedRevision')::bigint > (p_result->>'draftRevision')::bigint THEN RETURN false; END IF;
  action := p_result->>'action';
  IF action IN ('save_draft','restore_draft') THEN
    RETURN p_result->'archived' = 'false'::jsonb
      AND p_result->'createdRevision' = p_result->'draftRevision'
      AND (p_result->'publishedRevision' = 'null'::jsonb
        OR (p_result->>'publishedRevision')::bigint < (p_result->>'draftRevision')::bigint);
  ELSIF action = 'publish' THEN
    RETURN p_result->'archived' = 'false'::jsonb AND p_result->'createdRevision' = 'null'::jsonb
      AND p_result->'publishedRevision' = p_result->'draftRevision'
      AND p_result->'publishedRevision' = p_request#>'{payload,revision}';
  ELSIF action = 'archive' THEN
    RETURN p_result->'archived' = 'true'::jsonb AND p_result->'createdRevision' = 'null'::jsonb
      AND p_result->'publishedRevision' = 'null'::jsonb;
  END IF;
  RETURN false;
END $$;

CREATE TABLE jetnity_cms_private.inspiration_entries_v1 (
  entry_id text PRIMARY KEY CHECK (jetnity_cms_private.reference_v1(entry_id) IS NOT NULL),
  locale text NOT NULL CHECK (locale = 'de'),
  name text NOT NULL,
  country text NOT NULL,
  image text NOT NULL,
  sort_order integer NOT NULL UNIQUE CHECK (sort_order BETWEEN 1 AND 4),
  state_version bigint NOT NULL DEFAULT 0 CHECK (state_version >= 0),
  draft_revision bigint CHECK (draft_revision > 0),
  published_revision bigint CHECK (published_revision > 0),
  published_at timestamptz CHECK (isfinite(published_at)),
  archived boolean NOT NULL DEFAULT false,
  last_request_id uuid,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp() CHECK (isfinite(created_at)),
  updated_at timestamptz NOT NULL DEFAULT transaction_timestamp() CHECK (isfinite(updated_at)),
  CHECK (jsonb_build_object('entryId', entry_id, 'locale', locale, 'name', name, 'country', country, 'image', image)
    = jetnity_cms_private.reference_v1(entry_id)),
  CHECK ((state_version = 0) = (draft_revision IS NULL)),
  CHECK ((state_version = 0) = (last_request_id IS NULL)),
  CHECK (draft_revision <= state_version),
  CHECK (published_revision <= draft_revision),
  CHECK ((published_revision IS NULL) = (published_at IS NULL)),
  CHECK (NOT archived OR published_revision IS NULL),
  CHECK (updated_at >= created_at)
);

CREATE TABLE jetnity_cms_private.inspiration_revisions_v1 (
  entry_id text NOT NULL REFERENCES jetnity_cms_private.inspiration_entries_v1(entry_id) ON DELETE RESTRICT,
  revision bigint NOT NULL CHECK (revision > 0),
  content jsonb NOT NULL CHECK (jetnity_cms_private.snapshot_valid_v1(entry_id, content)),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL CHECK (isfinite(created_at)),
  restored_from_revision bigint CHECK (restored_from_revision > 0 AND restored_from_revision < revision),
  PRIMARY KEY (entry_id, revision),
  FOREIGN KEY (entry_id, restored_from_revision)
    REFERENCES jetnity_cms_private.inspiration_revisions_v1(entry_id, revision) ON DELETE RESTRICT
);

CREATE TABLE jetnity_cms_private.inspiration_operations_v1 (
  request_id uuid PRIMARY KEY CHECK (request_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  actor_id uuid NOT NULL,
  entry_id text NOT NULL REFERENCES jetnity_cms_private.inspiration_entries_v1(entry_id) ON DELETE RESTRICT,
  request jsonb NOT NULL CHECK (jsonb_typeof(request) = 'object'),
  result jsonb NOT NULL CHECK (jsonb_typeof(result) = 'object'),
  before_version bigint NOT NULL CHECK (before_version >= 0),
  after_version bigint NOT NULL CHECK (after_version > 0 AND after_version - before_version = 1),
  created_at timestamptz NOT NULL CHECK (isfinite(created_at)),
  UNIQUE (entry_id, after_version),
  UNIQUE (entry_id, request_id, after_version),
  CHECK (jetnity_cms_private.request_valid_v1(request, request_id, actor_id, entry_id, before_version) IS TRUE),
  CHECK (jetnity_cms_private.receipt_valid_v1(result, request, after_version, created_at) IS TRUE)
);

ALTER TABLE jetnity_cms_private.inspiration_entries_v1
  ADD CONSTRAINT cms_draft_revision_fk FOREIGN KEY (entry_id, draft_revision)
    REFERENCES jetnity_cms_private.inspiration_revisions_v1(entry_id, revision) DEFERRABLE INITIALLY DEFERRED,
  ADD CONSTRAINT cms_published_revision_fk FOREIGN KEY (entry_id, published_revision)
    REFERENCES jetnity_cms_private.inspiration_revisions_v1(entry_id, revision) DEFERRABLE INITIALLY DEFERRED,
  ADD CONSTRAINT cms_last_operation_fk FOREIGN KEY (entry_id, last_request_id, state_version)
    REFERENCES jetnity_cms_private.inspiration_operations_v1(entry_id, request_id, after_version) DEFERRABLE INITIALLY DEFERRED;

CREATE FUNCTION jetnity_cms_private.immutable_v1() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, pg_temp AS $$
BEGIN RAISE EXCEPTION 'cms immutable record' USING ERRCODE = '55000'; END $$;

CREATE FUNCTION jetnity_cms_private.entry_update_v1() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  IF ROW(NEW.entry_id, NEW.locale, NEW.name, NEW.country, NEW.image, NEW.sort_order, NEW.created_at)
    IS DISTINCT FROM ROW(OLD.entry_id, OLD.locale, OLD.name, OLD.country, OLD.image, OLD.sort_order, OLD.created_at)
    OR OLD.state_version = 9223372036854775807 OR NEW.state_version <> OLD.state_version + 1 THEN
    RAISE EXCEPTION 'cms immutable identity or invalid state step' USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER cms_entry_identity BEFORE UPDATE ON jetnity_cms_private.inspiration_entries_v1
  FOR EACH ROW EXECUTE FUNCTION jetnity_cms_private.entry_update_v1();
CREATE TRIGGER cms_entry_delete BEFORE DELETE ON jetnity_cms_private.inspiration_entries_v1
  FOR EACH ROW EXECUTE FUNCTION jetnity_cms_private.immutable_v1();
CREATE TRIGGER cms_entry_truncate BEFORE TRUNCATE ON jetnity_cms_private.inspiration_entries_v1
  FOR EACH STATEMENT EXECUTE FUNCTION jetnity_cms_private.immutable_v1();
CREATE TRIGGER cms_revision_immutable BEFORE UPDATE OR DELETE ON jetnity_cms_private.inspiration_revisions_v1
  FOR EACH ROW EXECUTE FUNCTION jetnity_cms_private.immutable_v1();
CREATE TRIGGER cms_revision_truncate BEFORE TRUNCATE ON jetnity_cms_private.inspiration_revisions_v1
  FOR EACH STATEMENT EXECUTE FUNCTION jetnity_cms_private.immutable_v1();
CREATE TRIGGER cms_operation_immutable BEFORE UPDATE OR DELETE ON jetnity_cms_private.inspiration_operations_v1
  FOR EACH ROW EXECUTE FUNCTION jetnity_cms_private.immutable_v1();
CREATE TRIGGER cms_operation_truncate BEFORE TRUNCATE ON jetnity_cms_private.inspiration_operations_v1
  FOR EACH STATEMENT EXECUTE FUNCTION jetnity_cms_private.immutable_v1();

ALTER TABLE jetnity_cms_private.inspiration_entries_v1 OWNER TO postgres;
ALTER TABLE jetnity_cms_private.inspiration_revisions_v1 OWNER TO postgres;
ALTER TABLE jetnity_cms_private.inspiration_operations_v1 OWNER TO postgres;
ALTER TABLE jetnity_cms_private.inspiration_entries_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_cms_private.inspiration_entries_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE jetnity_cms_private.inspiration_revisions_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_cms_private.inspiration_revisions_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE jetnity_cms_private.inspiration_operations_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_cms_private.inspiration_operations_v1 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_cms_private FROM PUBLIC, anon, authenticated, service_role;
ALTER FUNCTION jetnity_cms_private.reference_v1(text) OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.text_valid_v1(text,integer,integer) OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.editable_valid_v1(jsonb) OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.snapshot_valid_v1(text,jsonb) OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.timestamp_v1(timestamptz) OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.decimal_valid_v1(jsonb,boolean,boolean) OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.revision_payload_valid_v1(jsonb) OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.request_valid_v1(jsonb,uuid,uuid,text,bigint) OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.receipt_valid_v1(jsonb,jsonb,bigint,timestamptz) OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.immutable_v1() OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.entry_update_v1() OWNER TO postgres;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_cms_private FROM PUBLIC, anon, authenticated, service_role;

-- Identity inventory only. These rows have no draft or published content.
INSERT INTO jetnity_cms_private.inspiration_entries_v1(entry_id, locale, name, country, image, sort_order)
SELECT id, 'de', r->>'name', r->>'country', r->>'image', ordinal::integer
FROM unnest(ARRAY['geonames:1650535','geonames:2267057','geonames:2657915','geonames:2759794'])
  WITH ORDINALITY AS ids(id, ordinal)
CROSS JOIN LATERAL (SELECT jetnity_cms_private.reference_v1(id) AS r) reference;
