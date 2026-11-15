CREATE FUNCTION official_v3_guard_private.content_digest_v1(component_value text) RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  CASE component_value
    WHEN 'hma' THEN RETURN official_v3_guard_private.fingerprint_hma_v1();
    WHEN 's1' THEN RETURN official_v3_guard_private.fingerprint_s1_v1();
    WHEN 'jobs' THEN RETURN official_v3_guard_private.fingerprint_jobs_v1();
    ELSE RAISE EXCEPTION 'bg1 component refused' USING ERRCODE='P7901';
  END CASE;
END $$;

CREATE FUNCTION official_v3_guard_private.check_certificate_v1(component_value text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
DECLARE c official_v3_guard_private.certificates_v1%ROWTYPE; entry record; previous_hash text; previous_digest text; generation_value bigint:=0;
BEGIN
  SELECT * INTO STRICT c FROM official_v3_guard_private.certificates_v1 WHERE component=component_value;
  FOR entry IN SELECT * FROM official_v3_guard_private.certificate_history_v1 WHERE component=component_value ORDER BY generation LOOP
    generation_value:=generation_value+1;
    IF entry.generation<>generation_value OR entry.before_digest IS DISTINCT FROM previous_digest
      OR entry.predecessor_hash IS DISTINCT FROM previous_hash OR NOT isfinite(entry.recorded_at)
      OR entry.entry_hash IS DISTINCT FROM encode(sha256(convert_to('bg1-certificate:v1:'||(to_jsonb(entry)-'entry_hash')::text,'UTF8')),'hex') THEN
      RAISE EXCEPTION 'bg1 certificate chain' USING ERRCODE='P7905';
    END IF;
    previous_hash:=entry.entry_hash; previous_digest:=entry.after_digest;
  END LOOP;
  IF generation_value=0 OR generation_value<>c.generation OR c.digest IS DISTINCT FROM previous_digest
    OR c.digest IS DISTINCT FROM official_v3_guard_private.content_digest_v1(component_value) THEN
    RAISE EXCEPTION 'bg1 unchanged certified content required' USING ERRCODE='P7905';
  END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.check_certificates_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  IF (SELECT count(*) FROM official_v3_guard_private.certificates_v1)<>3 THEN
    RAISE EXCEPTION 'bg1 certificate set' USING ERRCODE='P7905';
  END IF;
  PERFORM official_v3_guard_private.check_certificate_v1('hma');
  PERFORM official_v3_guard_private.check_certificate_v1('s1');
  PERFORM official_v3_guard_private.check_certificate_v1('jobs');
END $$;

-- Only fixed internal entry wrappers have EXECUTE on these helpers. Runtime
-- caller roles have neither EXECUTE nor table privileges. No caller supplies a
-- digest, clock, replacement certificate, component selection or bypass flag.
CREATE FUNCTION official_v3_guard_private.begin_component_v1(component_value text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(771106,1);
  PERFORM official_v3_guard_private.check_certificate_v1(component_value);
  IF component_value<>'hma' THEN PERFORM official_v3_guard_private.require_open_v1(); END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.seal_component_v1(component_value text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
DECLARE c official_v3_guard_private.certificates_v1%ROWTYPE; next_digest text; previous_hash text; body jsonb; instant timestamptz;
BEGIN
  -- The component's original mutation is already held under the common write
  -- lock. This obtains no new component lock after its final authority check.
  SELECT * INTO STRICT c FROM official_v3_guard_private.certificates_v1 WHERE component=component_value FOR UPDATE;
  CASE component_value
    WHEN 'hma' THEN PERFORM official_v3_guard_private.check_hma_v1();
    WHEN 's1' THEN PERFORM official_v3_guard_private.check_s1_v1();
    WHEN 'jobs' THEN PERFORM official_v3_guard_private.check_jobs_v1();
    ELSE RAISE EXCEPTION 'bg1 component refused' USING ERRCODE='P7901';
  END CASE;
  SELECT entry_hash INTO STRICT previous_hash FROM official_v3_guard_private.certificate_history_v1
    WHERE component=component_value AND generation=c.generation AND after_digest=c.digest;
  next_digest:=official_v3_guard_private.content_digest_v1(component_value);
  IF next_digest=c.digest THEN RETURN; END IF;
  instant:=clock_timestamp();
  body:=jsonb_build_object('component',component_value,'generation',c.generation+1,'before_digest',c.digest,
    'after_digest',next_digest,'predecessor_hash',previous_hash,'recorded_at',instant);
  INSERT INTO official_v3_guard_private.certificate_history_v1 VALUES(component_value,c.generation+1,c.digest,next_digest,
    previous_hash,instant,encode(sha256(convert_to('bg1-certificate:v1:'||body::text,'UTF8')),'hex'));
  UPDATE official_v3_guard_private.certificates_v1 SET generation=c.generation+1,digest=next_digest WHERE component=component_value;
END $$;
