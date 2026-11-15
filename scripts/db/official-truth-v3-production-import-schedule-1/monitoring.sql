-- Read-only public health evidence. No request bodies, IDs, keys or protected
-- source/job rows are exposed. The separate external checker reads the visitor.
-- Install this ACL before the fresh Production BG1 catalog baseline. The BG1
-- function is resolved only on a later read; installation never calls it.
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='10s';
DO $preflight$
BEGIN
  IF session_user<>'postgres' OR current_user<>'postgres' OR current_database()<>'postgres'
    OR current_setting('jetnity.prod_import_target',true) IS DISTINCT FROM 'production:qscbgcdmivbbnzrcyegn:refresh1' THEN
    RAISE EXCEPTION 'exact Production monitoring installation context required';
  END IF;
END $preflight$;

CREATE FUNCTION public.jetnity_production_import_status_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='5s' SET lock_timeout='1s'
AS $status$
DECLARE
  moment timestamptz:=clock_timestamp();
  control jetnity_prod_import_scheduler.state_v1%ROWTYPE;
  latest jetnity_prod_import_scheduler.cycles_v1%ROWTYPE;
  unavailable constant jsonb:='{"schema":1,"status":"unavailable","nextDueAt":null}'::jsonb;
BEGIN
  SELECT * INTO STRICT control FROM jetnity_prod_import_scheduler.state_v1 WHERE singleton;
  IF NOT control.enabled OR control.observed_at IS NULL OR control.observed_at>moment
    OR control.observed_at<moment-interval '3 minutes'
    OR control.status NOT IN ('published','not_due','awaiting_response','dispatched_start','dispatched_resume')
    OR control.remaining_starts IS NULL OR control.remaining_starts<4 OR control.remaining_starts>64
    OR control.remaining_operations IS NULL OR control.remaining_operations<16 OR control.remaining_operations>256
    OR control.next_due_at<moment-interval '10 minutes' OR control.next_due_at>moment+interval '40 minutes' THEN
    RETURN unavailable;
  END IF;
  IF (SELECT count(*) FROM cron.job AS scheduled WHERE scheduled.jobname='jetnity-ch-de-prod-import-v1')<>1
    OR NOT EXISTS(SELECT 1 FROM cron.job AS scheduled WHERE scheduled.jobname='jetnity-ch-de-prod-import-v1'
      AND scheduled.schedule='* * * * *' AND scheduled.command='SELECT jetnity_prod_import_scheduler.tick_v1();'
      AND scheduled.username='postgres' AND scheduled.database='postgres' AND scheduled.active)
    OR EXISTS(SELECT 1 FROM jetnity_prod_import_scheduler.cycles_v1 WHERE state='blocked'
      OR (state='active' AND (created_at>moment OR created_at<moment-interval '10 minutes')))
    OR public.official_v3_guard_alarm_status_v1() IS DISTINCT FROM '{"schema":1,"status":"current"}'::jsonb THEN
    RETURN unavailable;
  END IF;
  SELECT * INTO latest FROM jetnity_prod_import_scheduler.cycles_v1 WHERE state='published' ORDER BY id DESC LIMIT 1;
  IF NOT FOUND OR latest.published<1 OR latest.finished_at>moment OR latest.finished_at<latest.created_at
    OR control.next_due_at IS DISTINCT FROM latest.created_at+interval '40 minutes' THEN
    RETURN unavailable;
  END IF;
  RETURN jsonb_build_object('schema',1,'status','current',
    'nextDueAt',floor(extract(epoch FROM control.next_due_at)*1000)::bigint);
EXCEPTION WHEN OTHERS THEN RETURN unavailable;
END $status$;
REVOKE ALL ON FUNCTION public.jetnity_production_import_status_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
GRANT EXECUTE ON FUNCTION public.jetnity_production_import_status_v1() TO anon;
