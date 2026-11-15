-- These exact disabled predecessors must exist before BG1 freezes the catalog.
-- Installing the new anonymous monitor ACL afterwards is deliberately rejected.
DO $production_scheduler_preflight$
DECLARE expected record; actual pg_proc%ROWTYPE; actual_acl jsonb;
BEGIN
  IF to_regnamespace('jetnity_prod_import_scheduler') IS NULL
    OR to_regclass('jetnity_prod_import_scheduler.state_v1') IS NULL
    OR to_regclass('jetnity_prod_import_scheduler.cycles_v1') IS NULL
    OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NULL
    OR to_regprocedure('public.jetnity_production_import_status_v1()') IS NULL THEN
    RAISE EXCEPTION 'production disabled scheduler and monitor predecessor required' USING ERRCODE='P7921'; END IF;
  IF (SELECT count(*) FROM jetnity_prod_import_scheduler.state_v1 WHERE singleton AND NOT enabled AND status='disabled')<>1
    OR EXISTS(SELECT 1 FROM jetnity_prod_import_scheduler.cycles_v1)
    OR EXISTS(SELECT 1 FROM jetnity_prod_import_scheduler.dispatches_v1)
    OR EXISTS(SELECT 1 FROM cron.job WHERE jobname IN ('jetnity-ch-de-prod-import-v1','jetnity-official-truth-production-guard-v1')) THEN
    RAISE EXCEPTION 'production scheduler must be unused and disabled before the core' USING ERRCODE='P7921'; END IF;
  FOR expected IN SELECT * FROM jsonb_to_recordset(/* SCHEDULER_FUNCTIONS */)
    AS bound(signature text,owner text,hash text,language text,definer boolean,volatile text,config jsonb,grantees jsonb) LOOP
    SELECT * INTO STRICT actual FROM pg_proc WHERE oid=to_regprocedure(expected.signature);
    SELECT jsonb_agg(role_name ORDER BY role_name) INTO actual_acl FROM (
      SELECT DISTINCT CASE a.grantee WHEN 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END AS role_name
      FROM aclexplode(COALESCE(actual.proacl,acldefault('f',actual.proowner))) a
    ) allowed;
    IF actual.proowner<>'postgres'::regrole OR actual.prokind<>'f'
      OR actual.proleakproof OR actual.proisstrict OR actual.proretset OR actual.pronargs<>0
      OR actual.pronargdefaults<>0 OR actual.provariadic<>0 OR actual.proargnames IS NOT NULL
      OR actual.proparallel<>'u' OR actual.prosecdef<>expected.definer OR actual.provolatile::text<>expected.volatile
      OR (SELECT lanname FROM pg_language WHERE oid=actual.prolang)<>expected.language
      OR to_jsonb(actual.proconfig) IS DISTINCT FROM expected.config OR actual_acl IS DISTINCT FROM expected.grantees
      OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex')<>expected.hash
      OR EXISTS(SELECT 1 FROM aclexplode(COALESCE(actual.proacl,acldefault('f',actual.proowner))) a
        WHERE a.privilege_type<>'EXECUTE' OR a.is_grantable OR a.grantor<>actual.proowner) THEN
      RAISE EXCEPTION 'production exact scheduler function predecessor required' USING ERRCODE='P7921'; END IF;
  END LOOP;
END $production_scheduler_preflight$;
