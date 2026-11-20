-- BG1 5-MINUTE INTEGRITY-ONLY ALARM DTO, UNAPPLIED CANDIDATE.
-- NOT independently runnable in Production: must be protected by a new
-- exact append-only BG1-v3 catalog successor, restrictive grants and Owner
-- authorization in same transaction as the guard policy upgrade.
-- Fixed schema/DTO, no caller-supplied params, raw role attributes, PII,
-- source bodies, operational secret, incident text or writable capability.
CREATE FUNCTION public.jetnity_bg1_alarm_kind_v2() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $bg1_alarm$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE;
 hard_generation bigint;
 status_value text:='temporarily_unavailable';
BEGIN
 SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton;
 IF NOT FOUND THEN RETURN jsonb_build_object('schema',1,'status','integrity_locked','incidentGeneration',0); END IF;
 SELECT min(generation) INTO hard_generation
 FROM official_v3_guard_private.incidents_v1
 WHERE generation>s.resumed_generation AND reason IN ('refused','clock');
 IF hard_generation IS NOT NULL THEN
  RETURN jsonb_build_object('schema',1,'status','integrity_locked','incidentGeneration',hard_generation);
 END IF;
 IF public.official_v3_guard_alarm_status_v1()->>'status'='current' THEN
  status_value:='current';
 END IF;
 RETURN jsonb_build_object('schema',1,'status',status_value,'incidentGeneration',0);
EXCEPTION WHEN OTHERS THEN
 -- Unknown control errors are not treated as a harmless restart.
 RETURN jsonb_build_object('schema',1,'status','integrity_locked','incidentGeneration',0);
END $bg1_alarm$;
REVOKE ALL ON FUNCTION public.jetnity_bg1_alarm_kind_v2() FROM PUBLIC,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.jetnity_bg1_alarm_kind_v2() TO anon;
