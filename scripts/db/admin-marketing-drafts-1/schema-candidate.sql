-- UNAPPLIED CANDIDATE. Install with functions-candidate.sql in one transaction.
-- No extension, new role, existing helper change or hosted apply is authorised.
DO $$ BEGIN
  IF current_user <> 'postgres' THEN RAISE EXCEPTION 'marketing installation owner mismatch' USING ERRCODE = '42501'; END IF;
END $$;
CREATE SCHEMA jetnity_marketing_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_marketing_private FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION jetnity_marketing_private.keys_v1(value jsonb, expected text[]) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
  SELECT CASE WHEN jsonb_typeof(value) = 'object'
    THEN value ?& expected AND value - expected = '{}'::jsonb ELSE false END
$$;

CREATE FUNCTION jetnity_marketing_private.uuid_v1(value jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
  SELECT coalesce(jsonb_typeof(value) = 'string'
    AND value #>> '{}' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', false)
$$;

CREATE FUNCTION jetnity_marketing_private.version_v1(value jsonb, allow_zero boolean DEFAULT false) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
  SELECT CASE WHEN jsonb_typeof(value) = 'string' AND value #>> '{}' ~ '^(0|[1-9][0-9]{0,18})$'
    THEN (allow_zero OR value #>> '{}' <> '0') AND (value #>> '{}')::numeric <= 9223372036854775807
    ELSE false END
$$;

CREATE FUNCTION jetnity_marketing_private.timestamp_v1(value timestamptz) RETURNS text
LANGUAGE sql STABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
  SELECT to_char(value AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
$$;

CREATE FUNCTION jetnity_marketing_private.payload_valid_v1(value jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
  SELECT coalesce(jetnity_marketing_private.keys_v1(value, ARRAY['label','destination','channel','contentId'])
    AND jsonb_typeof(value->'label') = 'string'
    AND length(value->>'label') BETWEEN 1 AND 80
    AND value->>'label' = btrim(value->>'label', U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')
    AND value->>'label' !~ U&'[\0001-\001F\007F-\009F]'
    AND jsonb_typeof(value->'destination') = 'string'
    AND value->>'destination' IN ('home','planning','inspiration')
    AND jsonb_typeof(value->'channel') = 'string'
    AND value->>'channel' IN ('newsletter','instagram','partner','qr')
    AND (value->'contentId' = 'null'::jsonb OR (jsonb_typeof(value->'contentId') = 'string'
      AND value->>'contentId' ~ '^cnt-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')), false)
$$;

CREATE FUNCTION jetnity_marketing_private.command_valid_v1(value jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  IF jetnity_marketing_private.keys_v1(value, ARRAY['schemaVersion','requestId','draftId','expectedVersion','action','payload']) IS NOT TRUE
    OR value->'schemaVersion' IS DISTINCT FROM '1'::jsonb
    OR jetnity_marketing_private.uuid_v1(value->'requestId') IS NOT TRUE
    OR jetnity_marketing_private.uuid_v1(value->'draftId') IS NOT TRUE
    OR jetnity_marketing_private.version_v1(value->'expectedVersion', true) IS NOT TRUE
    OR jsonb_typeof(value->'action') IS DISTINCT FROM 'string' THEN RETURN false; END IF;
  IF value->>'action' = 'create' THEN
    RETURN value->>'expectedVersion' = '0' AND jetnity_marketing_private.payload_valid_v1(value->'payload');
  END IF;
  IF value->>'expectedVersion' = '0' THEN RETURN false; END IF;
  IF value->>'action' = 'save' THEN RETURN jetnity_marketing_private.payload_valid_v1(value->'payload'); END IF;
  IF value->>'action' = 'archive' THEN RETURN value->'payload' = '{}'::jsonb; END IF;
  IF value->>'action' = 'restore'
    AND jetnity_marketing_private.keys_v1(value->'payload', ARRAY['revision'])
    AND jetnity_marketing_private.version_v1(value->'payload'->'revision') THEN
    RETURN (value->'payload'->>'revision')::bigint <= (value->>'expectedVersion')::bigint;
  END IF;
  RETURN false;
END $$;

CREATE TABLE jetnity_marketing_private.drafts_v1 (
  draft_id uuid PRIMARY KEY CHECK (jetnity_marketing_private.uuid_v1(to_jsonb(draft_id::text))),
  version bigint NOT NULL CHECK (version > 0)
);

CREATE TABLE jetnity_marketing_private.revisions_v1 (
  draft_id uuid NOT NULL,
  version bigint NOT NULL CHECK (version > 0),
  previous_version bigint GENERATED ALWAYS AS (CASE WHEN version > 1 THEN version - 1 ELSE NULL END) STORED,
  request_id uuid NOT NULL UNIQUE CHECK (jetnity_marketing_private.uuid_v1(to_jsonb(request_id::text))),
  actor_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('create','save','archive','restore')),
  state text NOT NULL CHECK (state IN ('draft','archived')),
  payload jsonb NOT NULL CHECK (jetnity_marketing_private.payload_valid_v1(payload) IS TRUE),
  saved_at timestamptz NOT NULL CHECK (isfinite(saved_at)),
  restored_from bigint,
  PRIMARY KEY (draft_id, version),
  UNIQUE (draft_id, version, request_id, actor_id, saved_at),
  CHECK ((action = 'create') = (version = 1)),
  CHECK ((action = 'archive') = (state = 'archived')),
  CHECK ((action = 'restore' AND restored_from IS NOT NULL AND restored_from > 0 AND restored_from < version)
    OR (action <> 'restore' AND restored_from IS NULL)),
  FOREIGN KEY (draft_id) REFERENCES jetnity_marketing_private.drafts_v1 (draft_id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (draft_id, previous_version) REFERENCES jetnity_marketing_private.revisions_v1 (draft_id, version) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (draft_id, restored_from) REFERENCES jetnity_marketing_private.revisions_v1 (draft_id, version) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE jetnity_marketing_private.operations_v1 (
  request_id uuid PRIMARY KEY,
  draft_id uuid NOT NULL,
  version bigint NOT NULL,
  actor_id uuid NOT NULL,
  request jsonb NOT NULL,
  saved_at timestamptz NOT NULL,
  UNIQUE (draft_id, version),
  CHECK (jetnity_marketing_private.command_valid_v1(request) IS TRUE),
  CHECK ((request->>'requestId' = request_id::text
    AND request->>'draftId' = draft_id::text
    AND (request->>'expectedVersion')::numeric + 1 = version) IS TRUE),
  FOREIGN KEY (draft_id, version, request_id, actor_id, saved_at)
    REFERENCES jetnity_marketing_private.revisions_v1 (draft_id, version, request_id, actor_id, saved_at)
    DEFERRABLE INITIALLY DEFERRED
);

ALTER TABLE jetnity_marketing_private.drafts_v1 ADD CONSTRAINT drafts_current_revision_v1
  FOREIGN KEY (draft_id, version) REFERENCES jetnity_marketing_private.revisions_v1 (draft_id, version) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE jetnity_marketing_private.revisions_v1 ADD CONSTRAINT revisions_receipt_v1
  FOREIGN KEY (request_id) REFERENCES jetnity_marketing_private.operations_v1 (request_id) DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX revisions_list_v1 ON jetnity_marketing_private.revisions_v1 (saved_at DESC, draft_id DESC);

ALTER TABLE jetnity_marketing_private.drafts_v1 OWNER TO postgres;
ALTER TABLE jetnity_marketing_private.revisions_v1 OWNER TO postgres;
ALTER TABLE jetnity_marketing_private.operations_v1 OWNER TO postgres;
ALTER TABLE jetnity_marketing_private.drafts_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_marketing_private.drafts_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE jetnity_marketing_private.revisions_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_marketing_private.revisions_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE jetnity_marketing_private.operations_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_marketing_private.operations_v1 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_marketing_private FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_marketing_private FROM PUBLIC, anon, authenticated, service_role;
