-- UNAPPLIED. Same installation transaction as schema-candidate.sql, as postgres.
-- Existing auth/role/AAL2 implementations are prerequisites, never replaced.
CREATE FUNCTION jetnity_marketing_private.actor_v1() RETURNS uuid
LANGUAGE plpgsql STABLE SET search_path = pg_catalog, pg_temp AS $$
DECLARE actor uuid;
BEGIN
  actor := auth.uid();
  IF actor IS NULL OR public.darf_inhalte_moderieren() IS NOT TRUE
    OR auth.jwt()->>'role' IS DISTINCT FROM 'authenticated'
    OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = actor AND u.deleted_at IS NULL AND u.is_anonymous IS FALSE)
    OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = actor AND p.status = 'active') THEN
    RAISE EXCEPTION 'marketing not authorized' USING ERRCODE = '42501';
  END IF;
  RETURN actor;
EXCEPTION WHEN invalid_text_representation THEN
  RAISE EXCEPTION 'marketing not authorized' USING ERRCODE = '42501';
END $$;

CREATE FUNCTION jetnity_marketing_private.lock_actor_v1() RETURNS uuid
LANGUAGE plpgsql VOLATILE SET search_path = pg_catalog, pg_temp AS $$
DECLARE actor uuid;
BEGIN
  actor := auth.uid();
  IF actor IS NULL THEN RAISE EXCEPTION 'marketing not authorized' USING ERRCODE = '42501'; END IF;
  -- Resource -> account -> profile. SHARE protects non-key role/status updates.
  PERFORM 1 FROM auth.users u WHERE u.id = actor FOR SHARE;
  PERFORM 1 FROM public.profiles p WHERE p.user_id = actor FOR SHARE;
  RETURN jetnity_marketing_private.actor_v1();
EXCEPTION WHEN invalid_text_representation THEN
  RAISE EXCEPTION 'marketing not authorized' USING ERRCODE = '42501';
END $$;

CREATE FUNCTION jetnity_marketing_private.revision_json_v1(value jetnity_marketing_private.revisions_v1) RETURNS jsonb
LANGUAGE sql STABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
  SELECT jsonb_build_object('draftId', (value).draft_id::text, 'version', (value).version::text,
    'requestId', (value).request_id::text, 'actorId', (value).actor_id::text,
    'action', (value).action, 'state', (value).state, 'payload', (value).payload,
    'savedAt', jetnity_marketing_private.timestamp_v1((value).saved_at), 'restoredFrom', (value).restored_from::text)
$$;

CREATE FUNCTION jetnity_marketing_private.chain_valid_v1(id uuid) RETURNS boolean
LANGUAGE sql STABLE SET search_path = pg_catalog, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM jetnity_marketing_private.drafts_v1 d WHERE d.draft_id = id
      AND d.version = (SELECT count(*) FROM jetnity_marketing_private.revisions_v1 r WHERE r.draft_id = id)
      AND d.version = (SELECT max(r.version) FROM jetnity_marketing_private.revisions_v1 r WHERE r.draft_id = id)
      AND d.version = (SELECT count(*) FROM jetnity_marketing_private.operations_v1 o WHERE o.draft_id = id))
    AND NOT EXISTS (
      SELECT 1 FROM jetnity_marketing_private.revisions_v1 r
      LEFT JOIN jetnity_marketing_private.operations_v1 o ON o.request_id = r.request_id
      LEFT JOIN jetnity_marketing_private.revisions_v1 prior ON prior.draft_id = r.draft_id AND prior.version = r.previous_version
      LEFT JOIN jetnity_marketing_private.revisions_v1 restored ON restored.draft_id = r.draft_id AND restored.version = r.restored_from
      WHERE r.draft_id = id AND (
        o.draft_id IS DISTINCT FROM r.draft_id OR o.version IS DISTINCT FROM r.version
        OR o.actor_id IS DISTINCT FROM r.actor_id OR o.saved_at IS DISTINCT FROM r.saved_at
        OR o.request->>'action' IS DISTINCT FROM r.action
        OR (r.version > 1 AND (prior.version IS NULL OR r.saved_at <= prior.saved_at))
        OR CASE r.action
          WHEN 'create' THEN r.payload IS DISTINCT FROM o.request->'payload'
          WHEN 'save' THEN prior.state IS DISTINCT FROM 'draft' OR r.payload IS DISTINCT FROM o.request->'payload'
          WHEN 'archive' THEN prior.state IS DISTINCT FROM 'draft' OR r.payload IS DISTINCT FROM prior.payload
          WHEN 'restore' THEN restored.version IS NULL OR r.payload IS DISTINCT FROM restored.payload
            OR to_jsonb(r.restored_from::text) IS DISTINCT FROM o.request->'payload'->'revision'
          ELSE true END))
$$;

CREATE FUNCTION jetnity_marketing_private.enforce_chain_v1() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  -- PostgreSQL17 fires deferred custom triggers under the COMMIT caller, after
  -- the guarded writer's definer frame has returned. This private trigger-only
  -- validator needs owner reads; no private client grant is added to make it run.
  IF TG_TABLE_SCHEMA <> 'jetnity_marketing_private' OR TG_LEVEL <> 'ROW' OR TG_WHEN <> 'AFTER'
    OR TG_TABLE_NAME NOT IN ('drafts_v1','revisions_v1','operations_v1')
    OR TG_OP NOT IN ('INSERT','UPDATE') OR (TG_OP = 'UPDATE' AND TG_TABLE_NAME <> 'drafts_v1') THEN
    RAISE EXCEPTION 'marketing invalid constraint context' USING ERRCODE = '42501'; END IF;
  IF jetnity_marketing_private.chain_valid_v1(NEW.draft_id) IS NOT TRUE THEN
    RAISE EXCEPTION 'marketing incomplete history' USING ERRCODE = '23514'; END IF;
  RETURN NULL;
END $$;

CREATE FUNCTION jetnity_marketing_private.immutable_v1() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, pg_temp AS $$
BEGIN RAISE EXCEPTION 'marketing immutable history' USING ERRCODE = '23514'; END $$;

CREATE FUNCTION jetnity_marketing_private.advance_v1() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  IF NEW.draft_id IS DISTINCT FROM OLD.draft_id OR NEW.version::numeric <> OLD.version::numeric + 1 THEN
    RAISE EXCEPTION 'marketing invalid advance' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER revisions_immutable_v1 BEFORE UPDATE OR DELETE ON jetnity_marketing_private.revisions_v1
  FOR EACH ROW EXECUTE FUNCTION jetnity_marketing_private.immutable_v1();
CREATE TRIGGER revisions_no_truncate_v1 BEFORE TRUNCATE ON jetnity_marketing_private.revisions_v1
  FOR EACH STATEMENT EXECUTE FUNCTION jetnity_marketing_private.immutable_v1();
CREATE TRIGGER operations_immutable_v1 BEFORE UPDATE OR DELETE ON jetnity_marketing_private.operations_v1
  FOR EACH ROW EXECUTE FUNCTION jetnity_marketing_private.immutable_v1();
CREATE TRIGGER operations_no_truncate_v1 BEFORE TRUNCATE ON jetnity_marketing_private.operations_v1
  FOR EACH STATEMENT EXECUTE FUNCTION jetnity_marketing_private.immutable_v1();
CREATE TRIGGER drafts_no_delete_v1 BEFORE DELETE ON jetnity_marketing_private.drafts_v1
  FOR EACH ROW EXECUTE FUNCTION jetnity_marketing_private.immutable_v1();
CREATE TRIGGER drafts_no_truncate_v1 BEFORE TRUNCATE ON jetnity_marketing_private.drafts_v1
  FOR EACH STATEMENT EXECUTE FUNCTION jetnity_marketing_private.immutable_v1();
CREATE TRIGGER drafts_advance_v1 BEFORE UPDATE ON jetnity_marketing_private.drafts_v1
  FOR EACH ROW EXECUTE FUNCTION jetnity_marketing_private.advance_v1();
CREATE CONSTRAINT TRIGGER drafts_complete_v1 AFTER INSERT OR UPDATE ON jetnity_marketing_private.drafts_v1
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION jetnity_marketing_private.enforce_chain_v1();
CREATE CONSTRAINT TRIGGER revisions_complete_v1 AFTER INSERT ON jetnity_marketing_private.revisions_v1
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION jetnity_marketing_private.enforce_chain_v1();
CREATE CONSTRAINT TRIGGER operations_complete_v1 AFTER INSERT ON jetnity_marketing_private.operations_v1
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION jetnity_marketing_private.enforce_chain_v1();

CREATE FUNCTION public.admin_marketing_drafts_apply_v1(input jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, pg_temp SET timezone = 'UTC' AS $$
DECLARE
  actor uuid; v_request_id uuid; id uuid; expected bigint; current_version bigint; selected bigint;
  operation jetnity_marketing_private.operations_v1%ROWTYPE;
  previous jetnity_marketing_private.revisions_v1%ROWTYPE;
  created jetnity_marketing_private.revisions_v1%ROWTYPE;
  new_payload jsonb; instant timestamptz;
BEGIN
  actor := jetnity_marketing_private.actor_v1();
  IF jetnity_marketing_private.command_valid_v1(input) IS NOT TRUE THEN
    RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
  v_request_id := (input->>'requestId')::uuid; id := (input->>'draftId')::uuid;
  expected := (input->>'expectedVersion')::bigint;
  -- Advisory hashes only serialize; the full immutable JSON/actor binding is
  -- compared below. A collision cannot supply identity or a successful replay.
  PERFORM pg_advisory_xact_lock(hashtextextended('jetnity.marketing.request:' || v_request_id::text, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended('jetnity.marketing.draft:' || id::text, 0));
  SELECT d.version INTO current_version FROM jetnity_marketing_private.drafts_v1 d WHERE d.draft_id = id FOR UPDATE;
  IF jetnity_marketing_private.lock_actor_v1() IS DISTINCT FROM actor THEN
    RAISE EXCEPTION 'marketing not authorized' USING ERRCODE = '42501'; END IF;
  SELECT o.* INTO operation FROM jetnity_marketing_private.operations_v1 o WHERE o.request_id = v_request_id;
  IF FOUND THEN
    IF operation.actor_id IS DISTINCT FROM actor OR operation.request IS DISTINCT FROM input THEN
      RAISE EXCEPTION 'marketing request identity conflict' USING ERRCODE = 'P4092'; END IF;
    SELECT r.* INTO STRICT created FROM jetnity_marketing_private.revisions_v1 r
      WHERE r.draft_id = operation.draft_id AND r.version = operation.version;
    RETURN jsonb_build_object('schemaVersion', 1, 'action', 'apply',
      'receipt', jetnity_marketing_private.revision_json_v1(created), 'replayed', true);
  END IF;
  IF input->>'action' = 'create' THEN
    IF current_version IS NOT NULL THEN RAISE EXCEPTION 'marketing stale version' USING ERRCODE = 'P4091'; END IF;
    new_payload := input->'payload';
  ELSE
    IF current_version IS NULL THEN RAISE EXCEPTION 'marketing draft unavailable' USING ERRCODE = 'P4041'; END IF;
    IF current_version <> expected THEN RAISE EXCEPTION 'marketing stale version' USING ERRCODE = 'P4091'; END IF;
    IF current_version = 9223372036854775807 THEN RAISE EXCEPTION 'marketing version exhausted' USING ERRCODE = 'P4093'; END IF;
    SELECT r.* INTO STRICT previous FROM jetnity_marketing_private.revisions_v1 r WHERE r.draft_id = id AND r.version = current_version;
    IF input->>'action' IN ('save','archive') AND previous.state <> 'draft' THEN
      RAISE EXCEPTION 'marketing state conflict' USING ERRCODE = 'P4093'; END IF;
    IF input->>'action' = 'restore' THEN
      selected := (input->'payload'->>'revision')::bigint;
      SELECT r.payload INTO new_payload FROM jetnity_marketing_private.revisions_v1 r WHERE r.draft_id = id AND r.version = selected;
      IF NOT FOUND THEN RAISE EXCEPTION 'marketing revision unavailable' USING ERRCODE = 'P4041'; END IF;
    ELSIF input->>'action' = 'archive' THEN new_payload := previous.payload;
    ELSE new_payload := input->'payload'; END IF;
  END IF;
  instant := greatest(clock_timestamp(), previous.saved_at + interval '1 microsecond');
  IF input->>'action' = 'create' THEN
    INSERT INTO jetnity_marketing_private.drafts_v1(draft_id,version) VALUES(id,1);
  END IF;
  INSERT INTO jetnity_marketing_private.operations_v1(request_id,draft_id,version,actor_id,request,saved_at)
    VALUES(v_request_id,id,expected+1,actor,input,instant);
  INSERT INTO jetnity_marketing_private.revisions_v1(draft_id,version,request_id,actor_id,action,state,payload,saved_at,restored_from)
    VALUES(id,expected+1,v_request_id,actor,input->>'action',
      CASE WHEN input->>'action' = 'archive' THEN 'archived' ELSE 'draft' END,new_payload,instant,selected)
    RETURNING * INTO created;
  IF input->>'action' <> 'create' THEN
    UPDATE jetnity_marketing_private.drafts_v1 d SET version = expected+1 WHERE d.draft_id = id;
  END IF;
  -- Durable success requires the surrounding transaction's COMMIT to succeed.
  RETURN jsonb_build_object('schemaVersion',1,'action','apply',
    'receipt',jetnity_marketing_private.revision_json_v1(created),'replayed',false);
END $$;

CREATE FUNCTION public.admin_marketing_drafts_read_v1(input jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, pg_temp SET timezone = 'UTC' AS $$
DECLARE
  action text; id uuid; page_limit integer := 20; filter_state text; before_version bigint;
  before_time timestamptz; before_id uuid; items jsonb := '[]'::jsonb; item jetnity_marketing_private.revisions_v1%ROWTYPE;
  last_item jetnity_marketing_private.revisions_v1%ROWTYPE; count integer := 0; more boolean := false; draft jsonb;
BEGIN
  PERFORM jetnity_marketing_private.lock_actor_v1();
  IF jsonb_typeof(input) IS DISTINCT FROM 'object' OR input->'schemaVersion' IS DISTINCT FROM '1'::jsonb
    OR jsonb_typeof(input->'action') IS DISTINCT FROM 'string' THEN
    RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
  action := input->>'action';
  IF action = 'get' THEN
    IF NOT jetnity_marketing_private.keys_v1(input,ARRAY['schemaVersion','action','draftId'])
      OR NOT jetnity_marketing_private.uuid_v1(input->'draftId') THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    SELECT jetnity_marketing_private.revision_json_v1(r) INTO draft
      FROM jetnity_marketing_private.drafts_v1 d JOIN jetnity_marketing_private.revisions_v1 r USING(draft_id,version)
      WHERE d.draft_id = (input->>'draftId')::uuid;
    RETURN jsonb_build_object('schemaVersion',1,'action','get','draft',draft);
  END IF;
  IF action NOT IN ('list','history') OR input - ARRAY['schemaVersion','action','draftId','limit','state','cursor'] <> '{}'::jsonb
    OR (action = 'list' AND input ? 'draftId') OR (action = 'history' AND input ? 'state') THEN
    RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
  IF input ? 'limit' THEN
    IF jsonb_typeof(input->'limit') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    IF (input->>'limit')::numeric NOT BETWEEN 1 AND 50
      OR trunc((input->>'limit')::numeric) <> (input->>'limit')::numeric THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    page_limit := (input->>'limit')::numeric::integer;
  END IF;
  IF action = 'history' THEN
    IF NOT jetnity_marketing_private.uuid_v1(input->'draftId')
      OR (input ? 'cursor' AND NOT jetnity_marketing_private.version_v1(input->'cursor')) THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    id := (input->>'draftId')::uuid; before_version := (input->>'cursor')::bigint;
    FOR item IN SELECT r.* FROM jetnity_marketing_private.revisions_v1 r
      WHERE r.draft_id = id AND (before_version IS NULL OR r.version < before_version)
      ORDER BY r.version DESC LIMIT page_limit + 1 LOOP
      IF count = page_limit THEN more := true; EXIT; END IF;
      items := items || jsonb_build_array(jetnity_marketing_private.revision_json_v1(item)); last_item := item; count := count + 1;
    END LOOP;
    RETURN jsonb_build_object('schemaVersion',1,'action','history','draftId',id::text,'items',items,
      'nextCursor',CASE WHEN more THEN last_item.version::text ELSE NULL END);
  END IF;
  IF input ? 'state' THEN
    IF jsonb_typeof(input->'state') IS DISTINCT FROM 'string' OR input->>'state' NOT IN ('draft','archived') THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    filter_state := input->>'state';
  END IF;
  IF input ? 'cursor' THEN
    IF jetnity_marketing_private.keys_v1(input->'cursor',ARRAY['savedAt','draftId']) IS NOT TRUE
      OR jetnity_marketing_private.uuid_v1(input->'cursor'->'draftId') IS NOT TRUE
      OR jsonb_typeof(input->'cursor'->'savedAt') IS DISTINCT FROM 'string'
      OR input->'cursor'->>'savedAt' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{6}Z$' THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    BEGIN before_time := (input->'cursor'->>'savedAt')::timestamptz;
    EXCEPTION WHEN datetime_field_overflow OR invalid_datetime_format THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END;
    IF jetnity_marketing_private.timestamp_v1(before_time) IS DISTINCT FROM input->'cursor'->>'savedAt' THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    before_id := (input->'cursor'->>'draftId')::uuid;
  END IF;
  FOR item IN SELECT r.* FROM jetnity_marketing_private.drafts_v1 d
    JOIN jetnity_marketing_private.revisions_v1 r USING(draft_id,version)
    WHERE (filter_state IS NULL OR r.state = filter_state)
      AND (before_time IS NULL OR (r.saved_at,r.draft_id) < (before_time,before_id))
    ORDER BY r.saved_at DESC,r.draft_id DESC LIMIT page_limit + 1 LOOP
    IF count = page_limit THEN more := true; EXIT; END IF;
    items := items || jsonb_build_array(jetnity_marketing_private.revision_json_v1(item)); last_item := item; count := count + 1;
  END LOOP;
  RETURN jsonb_build_object('schemaVersion',1,'action','list','items',items,
    'nextCursor',CASE WHEN more THEN jsonb_build_object('savedAt',jetnity_marketing_private.timestamp_v1(last_item.saved_at),
      'draftId',last_item.draft_id::text) ELSE NULL END);
END $$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_marketing_private FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_marketing_drafts_apply_v1(jsonb),public.admin_marketing_drafts_read_v1(jsonb)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_marketing_drafts_apply_v1(jsonb),public.admin_marketing_drafts_read_v1(jsonb) TO authenticated;
