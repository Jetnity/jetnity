-- Dev-only, READ ONLY: prove the actual deployed catalog's optimized query.
-- No DDL, fixture rows, guard execution, state change, Auth or role mutation.
BEGIN READ ONLY;
SET LOCAL statement_timeout='25s';
SET LOCAL jit=off;
SET LOCAL search_path=pg_catalog;
DO $proof$
DECLARE source text; candidate text; definition text; a jsonb; b jsonb;
BEGIN
  SELECT p.prosrc,pg_get_functiondef(p.oid) INTO STRICT source,definition FROM pg_proc p
    WHERE p.oid='official_v3_guard_private.catalog_status_v1()'::regprocedure;
  IF encode(sha256(convert_to(definition,'UTF8')),'hex') IS DISTINCT FROM 'a37bdaaa546ab1bcf3baac301d83de3887765ae16532f149d421a9c1dd0780c4' THEN
    RAISE EXCEPTION 'Dev predecessor definition changed'; END IF;
  candidate:=source;
  IF (length(candidate)-length(replace(candidate,'FROM pg_depend d WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
      OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)','')))/length('FROM pg_depend d WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
      OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)')<>1 THEN
    RAISE EXCEPTION 'Dev catalog source shape changed'; END IF;
  candidate:=replace(candidate,'FROM pg_depend d WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
      OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)','FROM (SELECT DISTINCT d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype FROM pg_depend d
      WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
        OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)) d');
  IF (length(candidate)-length(replace(candidate,'FROM pg_shdepend d WHERE (d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
      AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))
      OR (d.refclassid=''pg_authid''::regclass AND d.refobjid IN (SELECT oid FROM protected_roles WHERE oid<>''postgres''::regrole))','')))/length('FROM pg_shdepend d WHERE (d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
      AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))
      OR (d.refclassid=''pg_authid''::regclass AND d.refobjid IN (SELECT oid FROM protected_roles WHERE oid<>''postgres''::regrole))')<>1 THEN
    RAISE EXCEPTION 'Dev catalog source shape changed'; END IF;
  candidate:=replace(candidate,'FROM pg_shdepend d WHERE (d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
      AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))
      OR (d.refclassid=''pg_authid''::regclass AND d.refobjid IN (SELECT oid FROM protected_roles WHERE oid<>''postgres''::regrole))','FROM (SELECT DISTINCT d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype FROM pg_shdepend d
      WHERE (d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
        AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))
        OR (d.refclassid=''pg_authid''::regclass AND d.refobjid IN (SELECT oid FROM protected_roles WHERE oid<>''postgres''::regrole))) d');
  IF (length(candidate)-length(replace(candidate,'SELECT jsonb_object_agg(key,value ORDER BY key COLLATE "C") FROM entries','')))/length('SELECT jsonb_object_agg(key,value ORDER BY key COLLATE "C") FROM entries')<>1 THEN
    RAISE EXCEPTION 'Dev catalog source shape changed'; END IF;
  candidate:=replace(candidate,'SELECT jsonb_object_agg(key,value ORDER BY key COLLATE "C") FROM entries','SELECT jsonb_object_agg_unique(key,value) FROM entries');
  EXECUTE source INTO a;
  EXECUTE candidate INTO b;
  IF a IS NULL OR b IS NULL OR a IS DISTINCT FROM b
    OR sha256(convert_to(a::text,'UTF8')) IS DISTINCT FROM sha256(convert_to(b::text,'UTF8')) THEN
    RAISE EXCEPTION 'Dev exact catalog or canonical digest differs'; END IF;
END $proof$;
SELECT true AS exact_catalog_and_canonical_digest_equal;
ROLLBACK;
