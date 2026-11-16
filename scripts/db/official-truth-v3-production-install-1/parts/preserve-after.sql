DO $production_preserved$
DECLARE entry record; actual jsonb; previous jsonb; current_cron_rows jsonb; added_acl aclitem;
BEGIN
  FOR entry IN SELECT j.key,j.value FROM jsonb_each((SELECT p.value FROM pg_temp.production_preserved p WHERE p.kind='relations')) j LOOP
    SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid'] INTO actual FROM pg_class c WHERE oid=entry.key::oid;
    -- PAI adds exactly one trigger; its own installer proves the exact additive
    -- profile shape. The old relation otherwise remains byte-identical.
    IF (actual-'relhastriggers') IS DISTINCT FROM (entry.value-'relhastriggers')
      OR actual->'relhastriggers' IS DISTINCT FROM entry.value->'relhastriggers'
        AND entry.key::oid<>'public.profiles'::regclass THEN
      RAISE EXCEPTION 'production changed existing relation: %',entry.key USING ERRCODE='P7921'; END IF;
  END LOOP;
  FOR entry IN SELECT j.key,j.value FROM jsonb_each((SELECT p.value FROM pg_temp.production_preserved p WHERE p.kind='functions')) j LOOP
    SELECT to_jsonb(p) INTO actual FROM pg_proc p WHERE oid=entry.key::oid;
    IF actual IS DISTINCT FROM entry.value THEN RAISE EXCEPTION 'production changed existing function: %',entry.key USING ERRCODE='P7921'; END IF;
  END LOOP;
  FOR entry IN SELECT j.key,j.value FROM jsonb_each((SELECT p.value FROM pg_temp.production_preserved p WHERE p.kind='namespaces')) j LOOP
    SELECT to_jsonb(n) INTO actual FROM pg_namespace n WHERE oid=entry.key::oid;
    IF actual IS DISTINCT FROM entry.value THEN RAISE EXCEPTION 'production changed existing schema: %',entry.key USING ERRCODE='P7921'; END IF;
  END LOOP;
  FOR entry IN SELECT j.key,j.value FROM jsonb_each((SELECT p.value FROM pg_temp.production_preserved p WHERE p.kind='roles')) j LOOP
    SELECT to_jsonb(r)-'rolpassword' INTO actual FROM pg_roles r WHERE oid=entry.key::oid;
    IF actual IS DISTINCT FROM entry.value THEN RAISE EXCEPTION 'production changed existing role: %',entry.key USING ERRCODE='P7921'; END IF;
  END LOOP;
  FOR entry IN SELECT j.key,j.value FROM jsonb_each((SELECT p.value FROM pg_temp.production_preserved p WHERE p.kind='memberships')) j LOOP
    SELECT to_jsonb(m) INTO actual FROM pg_auth_members m WHERE oid=entry.key::oid;
    IF actual IS DISTINCT FROM entry.value THEN RAISE EXCEPTION 'production changed existing membership: %',entry.key USING ERRCODE='P7921'; END IF;
  END LOOP;
  SELECT p.value INTO STRICT previous FROM pg_temp.production_preserved p WHERE p.kind='database';
  SELECT (to_jsonb(d)-ARRAY['datfrozenxid','datminmxid'])
    ||jsonb_build_object('datacl',to_jsonb(COALESCE(d.datacl,acldefault('d',d.datdba)))) INTO actual FROM pg_database d WHERE datname=current_database();
  IF actual-'datacl' IS DISTINCT FROM previous-'datacl' THEN RAISE EXCEPTION 'production changed existing database' USING ERRCODE='P7921'; END IF;
  -- Only six bounded CONNECT grants are additive; the original ACL survives.
  IF EXISTS(SELECT 1 FROM jsonb_array_elements_text(COALESCE(previous->'datacl','[]'::jsonb)) old_acl
      WHERE NOT (actual->'datacl') ? old_acl.value) THEN
    RAISE EXCEPTION 'production unexpected database privilege delta' USING ERRCODE='P7921'; END IF;
  FOR added_acl IN SELECT a.item FROM pg_database d CROSS JOIN LATERAL unnest(d.datacl) a(item)
    WHERE d.datname=current_database() AND NOT COALESCE(previous->'datacl','[]'::jsonb) ? a.item::text LOOP
    IF EXISTS(SELECT 1 FROM aclexplode(ARRAY[added_acl]) a WHERE NOT(a.grantor='postgres'::regrole
      AND a.privilege_type='CONNECT' AND NOT a.is_grantable AND pg_get_userbyid(a.grantee) IN (
        'ot_v3_method_transport_login','ot_v3_intake_transport_login','ot_v3_jobs_transport_login',
        'ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'))) THEN
      RAISE EXCEPTION 'production unexpected additive database ACL' USING ERRCODE='P7921'; END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM pg_temp.production_preserved WHERE kind='cron_jobs') THEN
    EXECUTE 'SELECT COALESCE(jsonb_object_agg(jobid::text,to_jsonb(j)),''{}''::jsonb) FROM cron.job j' INTO current_cron_rows;
    IF current_cron_rows IS DISTINCT FROM (SELECT p.value FROM pg_temp.production_preserved p WHERE p.kind='cron_jobs') THEN
      RAISE EXCEPTION 'production changed existing cron jobs' USING ERRCODE='P7921'; END IF;
  END IF;
END $production_preserved$;
