-- DEV ONLY: one rollback-only owner fixture proof on the selected Dev project.
-- Never run on Production. No Auth/JWT, grants, guard changes, DDL or persistent fixture.
-- Preconditions and real CMS CHECK/FK/immutable triggers remain enabled.
-- On any error, the connection must ROLLBACK before another command.
BEGIN;
SET LOCAL search_path = pg_catalog, pg_temp;
SET LOCAL lock_timeout = '1s';
SET LOCAL statement_timeout = '10s';

DO $cms_public_reader_dev_fixture$
DECLARE
  scenario record; action text; entry jetnity_cms_private.inspiration_entries_v1%ROWTYPE;
  marker text; draft bigint; published bigint; revision_created bigint; is_archived boolean;
  next_published_at timestamptz; instant timestamptz; request_id uuid; actor_id uuid;
  payload jsonb; content jsonb; request jsonb; receipt jsonb; expected jsonb := '{}'::jsonb;
BEGIN
  IF current_user <> 'postgres'
    OR to_regprocedure('public.cms_inspiration_published_v2()') IS NULL
    OR (SELECT count(*) FROM jetnity_cms_private.inspiration_entries_v1) <> 4 THEN
    RAISE EXCEPTION 'Dev fixture prerequisites unavailable';
  END IF;
  -- These are explicit owner-created, rolled-back fixture attribution IDs.
  -- No user session or authenticated identity is fabricated.
  actor_id := 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid;
  FOR scenario IN SELECT * FROM (VALUES
    ('geonames:1650535', ARRAY['save:PUBLIC_BALI','publish','save:PRIVATE_NEWER_BALI']::text[]),
    ('geonames:2267057', ARRAY['save:PRIVATE_LISBON','archive','save:PRIVATE_DRAFT_LISBON']::text[]),
    ('geonames:2657915', ARRAY['save:PRIVATE_ARCHIVED_ZERMATT','publish','archive']::text[]),
    ('geonames:2759794', ARRAY['save:PRIVATE_HISTORY_AMSTERDAM','publish','save:PUBLIC_AMSTERDAM','publish']::text[])
  ) s(entry_id,actions) LOOP
    FOREACH action IN ARRAY scenario.actions LOOP
      SELECT * INTO STRICT entry FROM jetnity_cms_private.inspiration_entries_v1 e
        WHERE e.entry_id=scenario.entry_id FOR UPDATE;
      instant := greatest(clock_timestamp(),entry.updated_at);
      request_id := gen_random_uuid();
      draft := entry.draft_revision; published := entry.published_revision;
      next_published_at := entry.published_at; revision_created := NULL; is_archived := false;
      IF action LIKE 'save:%' THEN
        marker := 'CMS_RELEASE_FIXTURE_' || substr(action,6);
        draft := coalesce(entry.draft_revision,0)+1;
        revision_created := draft;
        payload := jsonb_build_object('beschreibung',marker,
          'idea','Nur eine zurückgerollte Dev-Prüfung.','themen',jsonb_build_array('stadt-kultur'));
        content := jetnity_cms_private.reference_v1(entry.entry_id) || payload;
        INSERT INTO jetnity_cms_private.inspiration_revisions_v1
          (entry_id,revision,content,created_by,created_at)
          VALUES(entry.entry_id,draft,content,actor_id,instant);
        action := 'save_draft';
      ELSIF action='publish' THEN
        published := draft; next_published_at := instant;
        payload := jsonb_build_object('revision',draft::text);
        IF entry.entry_id IN ('geonames:1650535','geonames:2759794') THEN
          expected := expected || jsonb_build_object(entry.entry_id,jsonb_build_object(
            'revision',draft::text,'content',(
              SELECT r.content FROM jetnity_cms_private.inspiration_revisions_v1 r
              WHERE r.entry_id=entry.entry_id AND r.revision=draft)));
        END IF;
      ELSIF action='archive' THEN
        published := NULL; next_published_at := NULL; is_archived := true; payload := '{}'::jsonb;
      ELSE
        RAISE EXCEPTION 'Unknown fixture action';
      END IF;
      request := jsonb_build_object('schema',1,'requestId',request_id::text,'actorId',actor_id::text,
        'entryId',entry.entry_id,'expectedVersion',entry.state_version::text,'action',action,'payload',payload);
      receipt := jsonb_build_object('schema',1,'status','recorded','requestId',request_id::text,
        'entryId',entry.entry_id,'action',action,'beforeVersion',entry.state_version::text,
        'version',(entry.state_version+1)::text,'draftRevision',draft::text,
        'publishedRevision',published::text,'archived',is_archived,'createdRevision',revision_created::text,
        'recordedAt',jetnity_cms_private.timestamp_v1(instant));
      INSERT INTO jetnity_cms_private.inspiration_operations_v1
        (request_id,actor_id,entry_id,request,result,before_version,after_version,created_at)
        VALUES(request_id,actor_id,entry.entry_id,request,receipt,entry.state_version,entry.state_version+1,instant);
      UPDATE jetnity_cms_private.inspiration_entries_v1 e SET
        state_version=entry.state_version+1,draft_revision=draft,published_revision=published,
        published_at=next_published_at,archived=is_archived,last_request_id=request_id,updated_at=instant
        WHERE e.entry_id=entry.entry_id;
    END LOOP;
  END LOOP;
  -- All deferred foreign keys must pass before visibility is asserted.
  SET CONSTRAINTS ALL IMMEDIATE;
  PERFORM set_config('jetnity.cms_reader_fixture_expected',expected::text,true);
END $cms_public_reader_dev_fixture$;

SET LOCAL ROLE anon;
SET LOCAL statement_timeout = '3s';
DO $cms_public_reader_dev_public_proof$
DECLARE payload jsonb; item jsonb; expected jsonb; started timestamptz := clock_timestamp();
BEGIN
  IF current_user <> 'anon' THEN RAISE EXCEPTION 'Expected real anon database role'; END IF;
  expected := current_setting('jetnity.cms_reader_fixture_expected')::jsonb;
  payload := public.cms_inspiration_published_v2();
  IF payload->'schema' IS DISTINCT FROM '1'::jsonb
    OR jsonb_array_length(payload->'items') <> 2
    OR payload::text LIKE '%CMS_RELEASE_FIXTURE_PRIVATE_%'
    OR payload::text LIKE '%eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee%'
    OR (SELECT count(DISTINCT value->>'entryId') FROM jsonb_array_elements(payload->'items')) <> 2 THEN
    RAISE EXCEPTION 'Public reader leaked a draft, archive, history, actor or wrong cardinality';
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(payload->'items') LOOP
    IF expected->(item->>'entryId') IS NULL
      OR item->'revision' IS DISTINCT FROM expected#>ARRAY[item->>'entryId','revision']
      OR item->'content' IS DISTINCT FROM expected#>ARRAY[item->>'entryId','content']
      OR (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(item) k)
          IS DISTINCT FROM ARRAY['content','entryId','publishedAt','revision']::text[] THEN
      RAISE EXCEPTION 'Public reader returned anything other than a selected current publication';
    END IF;
  END LOOP;
  IF payload#>>'{items,0,entryId}' <> 'geonames:1650535'
    OR payload#>>'{items,1,entryId}' <> 'geonames:2759794' THEN
    RAISE EXCEPTION 'Public catalogue order changed';
  END IF;
  RAISE NOTICE 'CMS release Dev proof: two exact publications; no drafts/history/archive/actor; elapsed_ms=%',
    round((extract(epoch FROM clock_timestamp()-started)*1000)::numeric,2);
  PERFORM set_config('jetnity.cms_reader_fixture_elapsed_ms',
    round((extract(epoch FROM clock_timestamp()-started)*1000)::numeric,2)::text,true);
END $cms_public_reader_dev_public_proof$;
SELECT 'passed' AS proof, current_user AS caller,
  jsonb_array_length(public.cms_inspiration_published_v2()->'items') AS published_count,
  current_setting('jetnity.cms_reader_fixture_elapsed_ms')::numeric AS elapsed_ms;
ROLLBACK;

