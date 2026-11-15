CREATE TEMP TABLE production_preserved(kind text PRIMARY KEY,value jsonb NOT NULL) ON COMMIT DROP;
INSERT INTO pg_temp.production_preserved
SELECT 'relations',COALESCE(jsonb_object_agg(c.oid::text,to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']), '{}'::jsonb)
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg\_%' ESCAPE '\';
INSERT INTO pg_temp.production_preserved
SELECT 'functions',COALESCE(jsonb_object_agg(p.oid::text,to_jsonb(p)), '{}'::jsonb)
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg\_%' ESCAPE '\';
INSERT INTO pg_temp.production_preserved
SELECT 'namespaces',COALESCE(jsonb_object_agg(n.oid::text,to_jsonb(n)), '{}'::jsonb)
FROM pg_namespace n WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg\_%' ESCAPE '\';
INSERT INTO pg_temp.production_preserved
SELECT 'roles',COALESCE(jsonb_object_agg(r.oid::text,to_jsonb(r)-'rolpassword'), '{}'::jsonb) FROM pg_roles r;
INSERT INTO pg_temp.production_preserved
SELECT 'memberships',COALESCE(jsonb_object_agg(m.oid::text,to_jsonb(m)), '{}'::jsonb) FROM pg_auth_members m;
INSERT INTO pg_temp.production_preserved
SELECT 'database',(to_jsonb(d)-ARRAY['datfrozenxid','datminmxid'])
  ||jsonb_build_object('datacl',to_jsonb(COALESCE(d.datacl,acldefault('d',d.datdba)))) FROM pg_database d WHERE datname=current_database();
DO $production_cron_snapshot$
DECLARE value jsonb;
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    EXECUTE 'SELECT COALESCE(jsonb_object_agg(jobid::text,to_jsonb(j)),''{}''::jsonb) FROM cron.job j' INTO value;
    INSERT INTO pg_temp.production_preserved VALUES('cron_jobs',value);
  END IF;
END $production_cron_snapshot$;
