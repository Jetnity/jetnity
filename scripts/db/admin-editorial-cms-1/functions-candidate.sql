-- LOCAL / UNAPPLIED. Same explicit installation transaction as schema-candidate.sql.
-- Existing auth.uid/auth.jwt/role/AAL2 functions are prerequisites, never redefined.

CREATE FUNCTION jetnity_cms_private.actor_v1() RETURNS uuid
LANGUAGE plpgsql STABLE SET search_path = pg_catalog, pg_temp AS $$
DECLARE actor uuid;
BEGIN
  actor := auth.uid();
  IF actor IS NULL OR NOT coalesce(public.darf_inhalte_moderieren(), false)
    OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = actor
      AND u.deleted_at IS NULL AND u.is_anonymous IS FALSE)
    OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = actor AND p.status = 'active') THEN
    RAISE EXCEPTION 'cms not authorized' USING ERRCODE = '42501';
  END IF;
  RETURN actor;
EXCEPTION WHEN invalid_text_representation THEN
  RAISE EXCEPTION 'cms not authorized' USING ERRCODE = '42501';
END $$;

CREATE FUNCTION jetnity_cms_private.lock_actor_v1() RETURNS uuid
LANGUAGE plpgsql VOLATILE SET search_path = pg_catalog, pg_temp AS $$
DECLARE actor uuid;
BEGIN
  actor := auth.uid();
  IF actor IS NULL THEN RAISE EXCEPTION 'cms not authorized' USING ERRCODE = '42501'; END IF;
  -- Always entry -> account -> profile. SHARE also conflicts with non-key
  -- status/role updates; KEY SHARE would not protect these prerequisites.
  PERFORM 1 FROM auth.users u WHERE u.id = actor FOR SHARE;
  PERFORM 1 FROM public.profiles p WHERE p.user_id = actor FOR SHARE;
  -- A fresh statement after any lock wait checks the actual stored status/role.
  RETURN jetnity_cms_private.actor_v1();
EXCEPTION WHEN invalid_text_representation THEN
  RAISE EXCEPTION 'cms not authorized' USING ERRCODE = '42501';
END $$;

CREATE FUNCTION jetnity_cms_private.selected_revision_v1(p_payload jsonb) RETURNS bigint
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  IF NOT jetnity_cms_private.revision_payload_valid_v1(p_payload) THEN
    RAISE EXCEPTION 'cms invalid request' USING ERRCODE = '22023'; END IF;
  RETURN (p_payload->>'revision')::bigint;
END $$;

CREATE FUNCTION public.admin_cms_inspiration_command_v1(
  p_request_id uuid, p_entry_id text, p_expected_version bigint, p_action text, p_payload jsonb
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, pg_temp SET timezone = 'UTC' AS $$
DECLARE
  actor uuid; fresh_actor uuid; binding jsonb; receipt jsonb;
  entry jetnity_cms_private.inspiration_entries_v1%ROWTYPE;
  previous jetnity_cms_private.inspiration_operations_v1%ROWTYPE;
  selected bigint; created_revision bigint; new_content jsonb; instant timestamptz;
  next_draft bigint; next_published bigint; next_published_at timestamptz; next_archived boolean;
  violated_constraint text;
BEGIN
  -- Reject an unauthorized caller before traversing untrusted JSON content.
  actor := jetnity_cms_private.actor_v1();
  IF p_request_id IS NULL OR p_request_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    OR jetnity_cms_private.reference_v1(p_entry_id) IS NULL
    OR p_expected_version IS NULL OR p_expected_version < 0
    OR p_action IS NULL OR p_action NOT IN ('save_draft','publish','archive','restore_draft') THEN
    RAISE EXCEPTION 'cms invalid request' USING ERRCODE = '22023';
  END IF;
  IF p_action = 'save_draft' THEN
    IF NOT jetnity_cms_private.editable_valid_v1(p_payload) THEN
      RAISE EXCEPTION 'cms invalid request' USING ERRCODE = '22023'; END IF;
  ELSIF p_action IN ('publish','restore_draft') THEN
    selected := jetnity_cms_private.selected_revision_v1(p_payload);
  ELSIF p_payload IS DISTINCT FROM '{}'::jsonb THEN
    RAISE EXCEPTION 'cms invalid request' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO entry FROM jetnity_cms_private.inspiration_entries_v1
    WHERE entry_id = p_entry_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'cms entry unavailable' USING ERRCODE = 'P4041'; END IF;
  fresh_actor := jetnity_cms_private.lock_actor_v1();
  IF fresh_actor IS DISTINCT FROM actor THEN
    RAISE EXCEPTION 'cms not authorized' USING ERRCODE = '42501'; END IF;
  binding := jsonb_build_object('schema', 1, 'requestId', p_request_id::text,
    'actorId', actor::text, 'entryId', p_entry_id, 'expectedVersion', p_expected_version::text,
    'action', p_action, 'payload', p_payload);

  SELECT * INTO previous FROM jetnity_cms_private.inspiration_operations_v1 WHERE request_id = p_request_id;
  IF FOUND THEN
    IF previous.actor_id IS DISTINCT FROM actor OR previous.request IS DISTINCT FROM binding THEN
      RAISE EXCEPTION 'cms request identity conflict' USING ERRCODE = 'P4092'; END IF;
    RETURN previous.result;
  END IF;
  IF entry.state_version <> p_expected_version THEN
    RAISE EXCEPTION 'cms stale state' USING ERRCODE = 'P4091'; END IF;
  IF entry.state_version = 9223372036854775807 THEN
    RAISE EXCEPTION 'cms state exhausted' USING ERRCODE = 'P4093'; END IF;

  instant := greatest(clock_timestamp(), entry.updated_at);
  next_draft := entry.draft_revision;
  next_published := entry.published_revision;
  next_published_at := entry.published_at;
  next_archived := entry.archived;

  IF p_action = 'save_draft' THEN
    IF entry.archived THEN RAISE EXCEPTION 'cms state conflict' USING ERRCODE = 'P4093'; END IF;
    created_revision := coalesce(entry.draft_revision, 0) + 1;
    new_content := jetnity_cms_private.reference_v1(p_entry_id) || p_payload;
    next_draft := created_revision;
  ELSIF p_action = 'restore_draft' THEN
    SELECT content INTO new_content FROM jetnity_cms_private.inspiration_revisions_v1
      WHERE entry_id = p_entry_id AND revision = selected;
    IF NOT FOUND THEN RAISE EXCEPTION 'cms revision unavailable' USING ERRCODE = 'P4041'; END IF;
    created_revision := entry.draft_revision + 1;
    next_draft := created_revision;
    next_archived := false;
  ELSIF p_action = 'publish' THEN
    IF entry.archived OR entry.draft_revision IS DISTINCT FROM selected
      OR entry.published_revision IS NOT DISTINCT FROM selected THEN
      RAISE EXCEPTION 'cms state conflict' USING ERRCODE = 'P4093'; END IF;
    next_published := selected;
    next_published_at := instant;
  ELSE
    IF entry.archived OR entry.draft_revision IS NULL THEN
      RAISE EXCEPTION 'cms state conflict' USING ERRCODE = 'P4093'; END IF;
    next_archived := true;
    next_published := NULL;
    next_published_at := NULL;
  END IF;

  IF created_revision IS NOT NULL THEN
    INSERT INTO jetnity_cms_private.inspiration_revisions_v1
      (entry_id, revision, content, created_by, created_at, restored_from_revision)
    VALUES (p_entry_id, created_revision, new_content, actor, instant,
      CASE WHEN p_action = 'restore_draft' THEN selected ELSE NULL END);
  END IF;
  receipt := jsonb_build_object('schema', 1, 'status', 'recorded',
    'requestId', p_request_id::text, 'entryId', p_entry_id, 'action', p_action,
    'beforeVersion', entry.state_version::text, 'version', (entry.state_version + 1)::text,
    'draftRevision', next_draft::text, 'publishedRevision', next_published::text,
    'archived', next_archived, 'createdRevision', created_revision::text,
    'recordedAt', jetnity_cms_private.timestamp_v1(instant));
  INSERT INTO jetnity_cms_private.inspiration_operations_v1
    (request_id, actor_id, entry_id, request, result, before_version, after_version, created_at)
  VALUES (p_request_id, actor, p_entry_id, binding, receipt, entry.state_version, entry.state_version + 1, instant);
  -- Both remain uncommitted. This order also works if a caller has selected
  -- immediate checking for the otherwise deferred cross-table constraints.
  UPDATE jetnity_cms_private.inspiration_entries_v1 SET
    state_version = entry.state_version + 1, draft_revision = next_draft,
    published_revision = next_published, published_at = next_published_at,
    archived = next_archived, last_request_id = p_request_id, updated_at = instant
  WHERE entry_id = p_entry_id;
  RETURN receipt;
EXCEPTION WHEN unique_violation THEN
  GET STACKED DIAGNOSTICS violated_constraint = CONSTRAINT_NAME;
  IF violated_constraint = 'inspiration_operations_v1_pkey' THEN
    -- The function's entire subtransaction was rolled back, including a
    -- different entry's tentative revision/state, before this error is raised.
    RAISE EXCEPTION 'cms request identity conflict' USING ERRCODE = 'P4092';
  END IF;
  RAISE;
END $$;

CREATE FUNCTION public.admin_cms_inspiration_read_v1(
  p_entry_id text, p_revision bigint DEFAULT NULL,
  p_before_revision bigint DEFAULT NULL, p_limit integer DEFAULT 20
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp SET timezone = 'UTC' AS $$
DECLARE
  entry jetnity_cms_private.inspiration_entries_v1%ROWTYPE;
  preview jsonb; history jsonb; last_revision bigint; next_before text;
BEGIN
  PERFORM jetnity_cms_private.actor_v1();
  IF jetnity_cms_private.reference_v1(p_entry_id) IS NULL
    OR p_revision <= 0 OR p_before_revision <= 0
    OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'cms invalid request' USING ERRCODE = '22023'; END IF;
  SELECT * INTO entry FROM jetnity_cms_private.inspiration_entries_v1 WHERE entry_id = p_entry_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'cms entry unavailable' USING ERRCODE = 'P4041'; END IF;
  SELECT jsonb_build_object('entryId', r.entry_id, 'revision', r.revision::text,
    'content', r.content, 'createdBy', r.created_by::text,
    'createdAt', jetnity_cms_private.timestamp_v1(r.created_at),
    'restoredFromRevision', r.restored_from_revision::text)
  INTO preview FROM jetnity_cms_private.inspiration_revisions_v1 r
  WHERE r.entry_id = p_entry_id AND r.revision = coalesce(p_revision, entry.draft_revision);
  IF p_revision IS NOT NULL AND NOT FOUND THEN
    RAISE EXCEPTION 'cms revision unavailable' USING ERRCODE = 'P4041'; END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object('entryId', r.entry_id, 'revision', r.revision::text,
    'content', r.content, 'createdBy', r.created_by::text,
    'createdAt', jetnity_cms_private.timestamp_v1(r.created_at),
    'restoredFromRevision', r.restored_from_revision::text) ORDER BY r.revision DESC), '[]'::jsonb), min(r.revision)
  INTO history, last_revision
  FROM (SELECT * FROM jetnity_cms_private.inspiration_revisions_v1
    WHERE entry_id = p_entry_id AND (p_before_revision IS NULL OR revision < p_before_revision)
    ORDER BY revision DESC LIMIT p_limit) r;
  IF last_revision IS NOT NULL AND EXISTS (SELECT 1 FROM jetnity_cms_private.inspiration_revisions_v1
    WHERE entry_id = p_entry_id AND revision < last_revision) THEN next_before := last_revision::text; END IF;
  RETURN jsonb_build_object('schema', 1, 'entry', jsonb_build_object(
    'entryId', entry.entry_id, 'locale', entry.locale, 'name', entry.name,
    'country', entry.country, 'image', entry.image, 'version', entry.state_version::text,
    'draftRevision', entry.draft_revision::text, 'publishedRevision', entry.published_revision::text,
    'publishedAt', jetnity_cms_private.timestamp_v1(entry.published_at),
    'archived', entry.archived, 'updatedAt', jetnity_cms_private.timestamp_v1(entry.updated_at)),
    'preview', preview, 'history', history, 'nextBeforeRevision', next_before);
END $$;

CREATE FUNCTION public.admin_cms_inspiration_confirm_v1(p_request_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp SET timezone = 'UTC' AS $$
DECLARE actor uuid; receipt jsonb;
BEGIN
  actor := jetnity_cms_private.actor_v1();
  IF p_request_id IS NULL OR p_request_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'cms invalid request' USING ERRCODE = '22023'; END IF;
  SELECT result INTO receipt FROM jetnity_cms_private.inspiration_operations_v1
    WHERE request_id = p_request_id AND actor_id = actor;
  RETURN coalesce(receipt, jsonb_build_object('schema', 1, 'status', 'unknown', 'requestId', p_request_id::text));
END $$;

CREATE FUNCTION public.cms_inspiration_published_v1() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp SET timezone = 'UTC' AS $$
  SELECT jsonb_build_object('schema', 1, 'items', coalesce(jsonb_agg(jsonb_build_object(
    'entryId', e.entry_id, 'revision', r.revision::text, 'content', r.content,
    'publishedAt', jetnity_cms_private.timestamp_v1(e.published_at)) ORDER BY e.sort_order), '[]'::jsonb))
  FROM jetnity_cms_private.inspiration_entries_v1 e
  JOIN jetnity_cms_private.inspiration_revisions_v1 r ON r.entry_id = e.entry_id AND r.revision = e.published_revision
  WHERE NOT e.archived AND e.published_revision IS NOT NULL
$$;

ALTER FUNCTION jetnity_cms_private.actor_v1() OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.lock_actor_v1() OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.selected_revision_v1(jsonb) OWNER TO postgres;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_cms_private FROM PUBLIC, anon, authenticated, service_role;
ALTER FUNCTION public.admin_cms_inspiration_command_v1(uuid,text,bigint,text,jsonb) OWNER TO postgres;
ALTER FUNCTION public.admin_cms_inspiration_read_v1(text,bigint,bigint,integer) OWNER TO postgres;
ALTER FUNCTION public.admin_cms_inspiration_confirm_v1(uuid) OWNER TO postgres;
ALTER FUNCTION public.cms_inspiration_published_v1() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_cms_inspiration_command_v1(uuid,text,bigint,text,jsonb) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_cms_inspiration_read_v1(text,bigint,bigint,integer) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_cms_inspiration_confirm_v1(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.cms_inspiration_published_v1() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_cms_inspiration_command_v1(uuid,text,bigint,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cms_inspiration_read_v1(text,bigint,bigint,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cms_inspiration_confirm_v1(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cms_inspiration_published_v1() TO anon, authenticated;
