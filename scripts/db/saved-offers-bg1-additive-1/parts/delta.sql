-- Part 2/4: after the EXACT original saved_offers migration, but BEFORE
-- touching the official_v3_guard_private successor/validator definitions.
-- All of this runs in the same uncommitted transaction as preflight and
-- successor creation. Standalone use fails for lack of the predecessor temp.
DO $saved_delta$
DECLARE before_catalog jsonb; after_catalog jsonb;
  permit text[]; total integer; added integer; changed integer; unexpected integer;
  expected_updates text[]:=ARRAY['destination','end_timezone','ends_at','ends_on',
    'start_timezone','starts_at','starts_on','title'];
BEGIN
  SELECT value INTO STRICT before_catalog FROM pg_temp.bg1_saved_before WHERE kind='catalog';
  after_catalog:=official_v3_guard_private.catalog_status_v1();
  IF to_regclass('public.saved_offers') IS NULL
    OR (SELECT count(*) FROM pg_attribute WHERE attrelid='public.saved_offers'::regclass
        AND attnum>0 AND NOT attisdropped) <> 17
    OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.saved_offers'::regclass)
    OR (SELECT count(*) FROM pg_policy WHERE polrelid='public.saved_offers'::regclass) <> 4
    OR (SELECT count(*) FROM pg_index WHERE indrelid='public.saved_offers'::regclass) <> 3
    OR (SELECT count(*) FROM pg_constraint WHERE conrelid='public.saved_offers'::regclass
        AND contype='f' AND confrelid='auth.users'::regclass) <> 1
    OR (SELECT count(*) FROM pg_trigger WHERE tgrelid='auth.users'::regclass
      AND tgconstraint IN (SELECT oid FROM pg_constraint WHERE conrelid='public.saved_offers'::regclass
        AND confrelid='auth.users'::regclass)) <> 2
    OR EXISTS(SELECT 1 FROM information_schema.table_privileges
      WHERE table_schema='public' AND table_name='saved_offers' AND grantee='anon')
    OR (SELECT coalesce(array_agg(column_name ORDER BY column_name),ARRAY[]::text[])
      FROM information_schema.column_privileges
      WHERE table_schema='public' AND table_name='saved_offers' AND grantee='authenticated'
        AND privilege_type='UPDATE') IS DISTINCT FROM expected_updates
    OR EXISTS(SELECT 1 FROM pg_policy WHERE polrelid='public.saved_offers'::regclass
      AND (polroles<>ARRAY['authenticated'::regrole::oid]::oid[]
        OR polname NOT IN ('saved_offers_select_own','saved_offers_insert_own',
          'saved_offers_update_own','saved_offers_delete_own')
        OR (polcmd='w' AND (pg_get_expr(polqual,polrelid) IS DISTINCT FROM
            '(( SELECT auth.uid() AS uid) = user_id)' OR
            pg_get_expr(polwithcheck,polrelid) IS DISTINCT FROM
            '(( SELECT auth.uid() AS uid) = user_id)')))) THEN
    RAISE EXCEPTION 'saved_offers canonical migration structure mismatch' USING ERRCODE='P7911';
  END IF;
  WITH sf AS (SELECT 'public.saved_offers'::regclass::oid AS oid),
       fk AS (SELECT oid FROM pg_constraint WHERE conrelid=(SELECT oid FROM sf)
         AND confrelid='auth.users'::regclass AND contype='f'),
       p AS (SELECT oid FROM pg_policy WHERE polrelid=(SELECT oid FROM sf)),
       t AS (SELECT oid FROM pg_trigger WHERE tgconstraint IN (SELECT oid FROM fk)
         AND tgrelid='auth.users'::regclass),
       ids AS (
         SELECT 'pg_class'::regclass AS classid,oid AS objid FROM sf
         UNION ALL SELECT 'pg_constraint'::regclass,oid FROM fk
         UNION ALL SELECT 'pg_trigger'::regclass,oid FROM t
         UNION ALL SELECT 'pg_policy'::regclass,oid FROM p
       ), keys AS (
         SELECT 'trigger:'||oid::text AS k FROM t
         UNION ALL
         SELECT 'dependency:'||d.classid||':'||d.objid||':'||d.objsubid||':'||
           d.refclassid||':'||d.refobjid||':'||d.refobjsubid||':'||d.deptype::text
         FROM pg_depend d WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM ids)
         UNION ALL
         SELECT 'shared:'||d.dbid||':'||d.classid||':'||d.objid||':'||d.objsubid||':'||
           d.refclassid||':'||d.refobjid||':'||d.deptype::text
         FROM pg_shdepend d WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM ids)
           AND d.refobjid='authenticated'::regrole
       ) SELECT array_agg(DISTINCT k ORDER BY k) INTO permit FROM keys WHERE after_catalog ? k;
  SELECT count(*) INTO total FROM unnest(permit) k;
  SELECT count(*) INTO added FROM jsonb_object_keys(after_catalog) k WHERE NOT before_catalog ? k;
  SELECT count(*) INTO changed FROM jsonb_each(before_catalog) e
    WHERE after_catalog->e.key IS DISTINCT FROM e.value;
  SELECT count(*) INTO unexpected FROM jsonb_object_keys(after_catalog) k
    WHERE NOT before_catalog ? k AND NOT k=ANY(permit);
  -- Real Dev saved_offers measured 2 incoming triggers + 8 distinct protected
  -- dependency keys + 13 protected-role shared entries. No broader pattern.
  IF total<>23 OR added<>23 OR changed<>0 OR unexpected<>0
    OR (SELECT count(*) FROM unnest(permit) k WHERE k LIKE 'trigger:%')<>2
    OR (SELECT count(*) FROM unnest(permit) k WHERE k LIKE 'dependency:%')<>8
    OR (SELECT count(*) FROM unnest(permit) k WHERE k LIKE 'shared:%')<>13 THEN
    RAISE EXCEPTION 'saved_offers unauthorized catalog delta' USING ERRCODE='P7911';
  END IF;
  INSERT INTO pg_temp.bg1_saved_before VALUES ('authorized_delta_catalog',after_catalog);
END $saved_delta$;
