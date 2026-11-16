DO $admin_runtime_postcheck$
DECLARE unavailable boolean:=false;
BEGIN
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  BEGIN
    PERFORM official_v3_guard_private.require_open_v1();
  EXCEPTION WHEN SQLSTATE 'P7902' THEN unavailable:=true;
  END;
  IF NOT unavailable OR public.official_v3_guard_alarm_status_v1()
      IS DISTINCT FROM jsonb_build_object('schema',1,'status','unavailable') THEN
    RAISE EXCEPTION 'admin runtime requires a new regular BG1 generation' USING ERRCODE='P7931';
  END IF;
  -- NOTIFY becomes visible only with the provider's successful outer COMMIT.
  PERFORM pg_notify('pgrst','reload schema');
END $admin_runtime_postcheck$;
