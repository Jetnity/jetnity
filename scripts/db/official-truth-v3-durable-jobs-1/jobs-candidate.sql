-- M04 UNAPPLIED companion candidate. Only new private queue/execution metadata.
-- No method approval, original-store replacement, hosted migration or activation.
BEGIN;
SET LOCAL search_path=pg_catalog,pg_temp;
SET LOCAL statement_timeout = '30000';
SET LOCAL lock_timeout = '5000';
DO $preflight$
BEGIN
  IF to_regnamespace('official_v3_jobs_private') IS NOT NULL OR to_regnamespace('official_v3_jobs_api') IS NOT NULL
    OR EXISTS (SELECT 1 FROM pg_roles WHERE rolname='ot_v3_jobs_caller') THEN
    RAISE EXCEPTION 'm04 candidate already exists' USING ERRCODE='P7601'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='postgres' AND NOT rolcanlogin AND NOT rolinherit
      AND NOT rolsuper AND rolbypassrls AND NOT rolcreaterole AND NOT rolcreatedb
      AND NOT rolreplication AND rolconfig IS NULL)
    OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='ot_v3_intake_owner' AND NOT rolcanlogin
      AND NOT rolinherit AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcreaterole AND NOT rolcreatedb
      AND NOT rolreplication AND rolconfig IS NULL)
    OR to_regprocedure('official_v3_intake_api.read_v1(jsonb,text,integer)') IS NULL
    OR to_regprocedure('official_v3_method_private.require_current_locked_v1(text,integer,text,text,integer)') IS NULL THEN
    RAISE EXCEPTION 'm04 prerequisites unavailable' USING ERRCODE='P7601'; END IF;
  -- Every transitive membership path must have an edge incident on its owner.
  -- Reject both directions for existing protected owners and the actual installer;
  -- never adopt/normalize an unexpected inherited authority path.
  IF EXISTS(SELECT 1 FROM pg_auth_members WHERE roleid IN (current_user::regrole,'postgres'::regrole,'ot_v3_intake_owner'::regrole)
    OR member IN (current_user::regrole,'postgres'::regrole,'ot_v3_intake_owner'::regrole)) THEN
    RAISE EXCEPTION 'm04 unexpected protected membership' USING ERRCODE='P7601'; END IF;
  -- Existing hardened S1 global function ACL is exact. Other creators may have
  -- only the explicit built-in GLOBAL FUNCTION EXECUTE baseline; no other object
  -- class, namespace, foreign grantee or grant option is an exception.
  IF NOT EXISTS (SELECT 1 FROM pg_default_acl d WHERE d.defaclrole='ot_v3_intake_owner'::regrole
      AND d.defaclnamespace=0 AND d.defaclobjtype='f')
    OR EXISTS (SELECT 1 FROM pg_default_acl d WHERE d.defaclrole IN (current_user::regrole,'postgres'::regrole,'ot_v3_intake_owner'::regrole)
      AND (d.defaclnamespace<>0 OR d.defaclobjtype<>'f'))
    OR EXISTS (SELECT 1 FROM pg_default_acl d CROSS JOIN LATERAL aclexplode(d.defaclacl) a
      WHERE d.defaclrole IN (current_user::regrole,'postgres'::regrole,'ot_v3_intake_owner'::regrole)
      AND (a.is_grantable OR a.grantor<>d.defaclrole OR a.privilege_type<>'EXECUTE'
        OR (a.grantee<>d.defaclrole AND NOT(a.grantee=0 AND d.defaclnamespace=0 AND d.defaclobjtype='f'
          AND d.defaclrole<>'ot_v3_intake_owner'::regrole))))
    OR EXISTS (SELECT 1 FROM pg_default_acl d WHERE d.defaclrole IN (current_user::regrole,'postgres'::regrole,'ot_v3_intake_owner'::regrole)
      AND (SELECT count(*) FROM aclexplode(d.defaclacl))<>CASE WHEN d.defaclrole='ot_v3_intake_owner'::regrole THEN 1 ELSE 2 END)
    OR current_setting('server_version_num')::integer<160000 OR current_setting('server_encoding')<>'UTF8' THEN
    RAISE EXCEPTION 'm04 unexpected default ACL or platform' USING ERRCODE='P7601'; END IF;
END $preflight$;


-- Reviewed unchanged predecessor candidate file SHA256 values:
-- S1 db3256889195ce4f68daa847b55f23a7e7433d4f4c8bb5e49cfda3be54484719
-- MA1 269c8567da63014c3aa80905aa0773afa4203778985b44ad84fea48d0f24eee6
DO $predecessor_pins$
DECLARE x record; p pg_proc%ROWTYPE; allowed oid[];
BEGIN
  FOR x IN SELECT * FROM (VALUES
('official_v3_intake_api.read_v1(jsonb,text,integer)','ot_v3_intake_owner','jsonb','v','u',true,0,'3c3cbff368a4e196247964d35a350ef1d554d685b2a807573aa4f987bfbe17d4'),
('official_v3_intake_private.binding_valid_v1(jsonb)','ot_v3_intake_owner','boolean','i','u',false,0,'8f556b9db0b3786f9c247c9432a9e6a8631b66ee92019ac8aa082cf58aa4f7c1'),
('official_v3_intake_private.exact_keys_v1(jsonb,text[])','ot_v3_intake_owner','boolean','i','u',false,0,'d3d8130512d809af7ec2578b88d30412e3dfec516a158c74f0a6fe1d09d486ba'),
('official_v3_intake_private.record_v1(text)','ot_v3_intake_owner','jsonb','v','u',false,0,'f34089ca87adef99d16d63de7391c5c200e770928c476304d8324b4beb1844f3'),
('official_v3_intake_private.proposal_retainable_v1(jsonb)','ot_v3_intake_owner','boolean','i','u',false,0,'d30b3540a097ab1832d09bdd67fa922efecaecbfdbae34eb3bfdbdca635cf797'),
('official_v3_intake_private.data_nodes_v1(jsonb,integer,integer,integer)','ot_v3_intake_owner','integer','i','u',false,3,'ca39c759aa56b45e6974d3fecf953b2bf4d679c2bffbf0783f366f42fd621b85'),
('official_v3_intake_private.proposal_shape_v1()','ot_v3_intake_owner','jsonb','i','u',false,0,'4ba4184c3733a3849ebf450822f37b46187931f916635c905ca5a3e3704231a9'),
('official_v3_intake_private.shape_matches_v1(jsonb,jsonb,jsonb,jsonb,integer)','ot_v3_intake_owner','boolean','i','u',false,1,'760ebdb9782c8709c0ede579e94c30f47a74840683772e11b04a2b3f74fc598a'),
('official_v3_intake_private.safe_data_v1(jsonb,integer)','ot_v3_intake_owner','boolean','i','u',false,1,'bce43ae05fa0cff183a1de7afedd8bca5e16f0cfc3e160c9b83fec33d09f0abf'),
('official_v3_method_private.require_current_locked_v1(text,integer,text,text,integer)','postgres','void','v','u',true,0,'7e98f2a32a2388efde95d729d425581bf9443e4397eb8311d82e6a46eb88ca8c'),
('official_v3_method_private.tuple_valid_v1(text,integer,text,text)','postgres','boolean','i','s',false,0,'15741698f4f66adb08e23694b15c6bb9d071b8c01e1123ba7087c4c3d50c6662')
  ) v(identity,owner_name,result_type,volatility,parallel,definer,defaults,body_hash) LOOP
    SELECT * INTO p FROM pg_proc WHERE oid=to_regprocedure(x.identity);
    allowed:=CASE WHEN x.identity='official_v3_intake_api.read_v1(jsonb,text,integer)' THEN ARRAY['ot_v3_intake_owner'::regrole::oid,'ot_v3_intake_caller'::regrole::oid] ELSE ARRAY[x.owner_name::regrole::oid] END;
    IF NOT FOUND OR p.proowner<>x.owner_name::regrole OR p.prorettype<>x.result_type::regtype OR p.prokind<>'f' OR p.proretset
      OR p.prolang<>(SELECT oid FROM pg_language WHERE lanname=CASE WHEN x.identity IN ('official_v3_intake_private.exact_keys_v1(jsonb,text[])','official_v3_intake_private.record_v1(text)','official_v3_intake_private.proposal_shape_v1()','official_v3_method_private.tuple_valid_v1(text,integer,text,text)') THEN 'sql' ELSE 'plpgsql' END) OR p.provolatile::text<>x.volatility OR p.proparallel::text<>x.parallel OR p.prosecdef<>x.definer OR p.proisstrict OR p.proleakproof
      OR p.pronargdefaults<>x.defaults OR p.provariadic<>0 OR p.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog']
      OR encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')<>x.body_hash
      OR (SELECT count(*) FROM aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))))<>cardinality(allowed)
      OR EXISTS(SELECT 1 FROM aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a
        WHERE NOT(a.grantee=ANY(allowed)) OR a.is_grantable OR a.privilege_type<>'EXECUTE' OR a.grantor<>p.proowner) THEN
      RAISE EXCEPTION 'm04 exact predecessor mismatch' USING ERRCODE='P7601'; END IF;
    IF x.defaults>0 AND pg_get_expr(p.proargdefaults,0) IS DISTINCT FROM (CASE x.defaults WHEN 3 THEN '0, 16, 8192' ELSE '0' END) THEN
      RAISE EXCEPTION 'm04 predecessor defaults mismatch' USING ERRCODE='P7601'; END IF;
  END LOOP;
END $predecessor_pins$;

CREATE ROLE ot_v3_jobs_caller NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE SCHEMA official_v3_jobs_private AUTHORIZATION postgres;
CREATE SCHEMA official_v3_jobs_api AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA official_v3_jobs_private,official_v3_jobs_api FROM PUBLIC;
GRANT USAGE ON SCHEMA official_v3_jobs_api TO ot_v3_jobs_caller;

CREATE FUNCTION official_v3_jobs_private.exact_keys_v1(v jsonb, expected text[]) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
  SELECT v IS NOT NULL AND expected IS NOT NULL AND jsonb_typeof(v)='object' AND
    ARRAY(SELECT k FROM jsonb_object_keys(CASE WHEN jsonb_typeof(v)='object' THEN v ELSE '{}'::jsonb END) k ORDER BY k COLLATE "C")
    = ARRAY(SELECT k FROM unnest(expected) k ORDER BY k COLLATE "C")
$$;
CREATE FUNCTION official_v3_jobs_private.unique_json_v1(v json, d integer) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE x record; e json; keys text[]:='{}'; n integer:=0;
BEGIN
  IF v IS NULL OR d IS NULL OR d<0 OR d>24 THEN RETURN false; END IF;
  IF json_typeof(v)='object' THEN
    FOR x IN SELECT * FROM json_each(v) LOOP
      n:=n+1; IF n>32768 OR x.key=ANY(keys) OR official_v3_jobs_private.unique_json_v1(x.value,d+1) IS NOT TRUE THEN RETURN false; END IF;
      keys:=array_append(keys,x.key);
    END LOOP;
  ELSIF json_typeof(v)='array' THEN
    FOR e IN SELECT value FROM json_array_elements(v) LOOP
      n:=n+1; IF n>32768 OR official_v3_jobs_private.unique_json_v1(e,d+1) IS NOT TRUE THEN RETURN false; END IF;
    END LOOP;
  ELSIF json_typeof(v)='number' AND left(v::text,1)='-' AND (v::text)::numeric=0 THEN RETURN false;
  END IF;
  RETURN true;
END $$;
CREATE FUNCTION official_v3_jobs_private.nodes_v1(v jsonb,d integer,max_d integer,max_n integer) RETURNS integer
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE e jsonb; n integer:=1; m integer; child_count bigint;
BEGIN
  IF v IS NULL OR d IS NULL OR max_d IS NULL OR max_n IS NULL OR d<0 OR d>max_d OR max_d>24 OR max_n>65536 OR max_n<1 THEN RETURN -1; END IF;
  IF jsonb_typeof(v)='object' THEN
    SELECT count(*) INTO child_count FROM jsonb_object_keys(v);
    IF child_count>0 AND d+1>max_d THEN RETURN -1; END IF;
    IF child_count>(max_n-1)/2 THEN RETURN -1; END IF;
    n:=1+2*child_count;
    FOR e IN SELECT j.value FROM jsonb_each(v) j WHERE jsonb_typeof(j.value) IN ('object','array') LOOP
      m:=official_v3_jobs_private.nodes_v1(e,d+1,max_d,max_n);
      IF m<0 THEN RETURN -1; END IF;
      n:=n+m-1; IF n>max_n THEN RETURN -1; END IF;
    END LOOP;
  ELSIF jsonb_typeof(v)='array' THEN
    child_count:=jsonb_array_length(v);
    IF child_count>0 AND d+1>max_d THEN RETURN -1; END IF;
    IF child_count>max_n-1 THEN RETURN -1; END IF;
    n:=1+child_count;
    FOR e IN SELECT j.value FROM jsonb_array_elements(v) j WHERE jsonb_typeof(j.value) IN ('object','array') LOOP
      m:=official_v3_jobs_private.nodes_v1(e,d+1,max_d,max_n);
      IF m<0 THEN RETURN -1; END IF;
      n:=n+m-1; IF n>max_n THEN RETURN -1; END IF;
    END LOOP;
  END IF;
  RETURN n;
END $$;
CREATE FUNCTION official_v3_jobs_private.canonical_v1(v jsonb,d integer) RETURNS text
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE x record; e jsonb; s text; parts text[]:='{}'; child_text text; number_value numeric; retained_object jsonb; retained_object_canonical text;
BEGIN
  IF v IS NULL OR d IS NULL OR d<0 OR d>24 THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  CASE jsonb_typeof(v)
  WHEN 'object' THEN
    FOR x IN SELECT * FROM jsonb_each(v) ORDER BY key COLLATE "C" LOOP
      IF x.key ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      e:=x.value;
      IF d+1>24 THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      CASE jsonb_typeof(e)
      WHEN 'object' THEN
        IF retained_object IS NULL THEN
          child_text:=official_v3_jobs_private.canonical_v1(e,d+1);
          retained_object:=e; retained_object_canonical:=child_text;
        ELSIF (e::text) COLLATE "C" = (retained_object::text) COLLATE "C" THEN
          child_text:=retained_object_canonical;
        ELSE
          child_text:=official_v3_jobs_private.canonical_v1(e,d+1);
          retained_object:=e; retained_object_canonical:=child_text;
        END IF;
      WHEN 'array' THEN child_text:=official_v3_jobs_private.canonical_v1(e,d+1);
      WHEN 'string' THEN
        s:=e#>>'{}'; IF s ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
        child_text:=e::text;
      WHEN 'number' THEN
        number_value:=e::text::numeric; IF number_value<>trunc(number_value) OR number_value NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF; child_text:=trunc(number_value)::text;
      WHEN 'boolean' THEN child_text:=e::text;
      WHEN 'null' THEN child_text:='null';
      ELSE RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';
      END CASE;
      parts:=array_append(parts,to_jsonb(x.key)::text||':'||child_text);
    END LOOP; RETURN '{'||array_to_string(parts,',')||'}';
  WHEN 'array' THEN
    FOR e IN SELECT value FROM jsonb_array_elements(v) LOOP
      IF d+1>24 THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      CASE jsonb_typeof(e)
      WHEN 'object' THEN child_text:=official_v3_jobs_private.canonical_v1(e,d+1);
      WHEN 'array' THEN child_text:=official_v3_jobs_private.canonical_v1(e,d+1);
      WHEN 'string' THEN
        s:=e#>>'{}'; IF s ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
        child_text:=e::text;
      WHEN 'number' THEN
        number_value:=e::text::numeric; IF number_value<>trunc(number_value) OR number_value NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF; child_text:=trunc(number_value)::text;
      WHEN 'boolean' THEN child_text:=e::text;
      WHEN 'null' THEN child_text:='null';
      ELSE RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';
      END CASE;
      parts:=array_append(parts,child_text);
    END LOOP;
    RETURN '['||array_to_string(parts,',')||']';
  WHEN 'string' THEN
    s:=v#>>'{}'; IF s ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
    RETURN v::text;
  WHEN 'number' THEN
    number_value:=v::text::numeric; IF number_value<>trunc(number_value) OR number_value NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
      RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF; RETURN trunc(number_value)::text;
  WHEN 'boolean' THEN RETURN v::text;
  WHEN 'null' THEN RETURN 'null';
  ELSE RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';
  END CASE;
END $$;
CREATE FUNCTION official_v3_jobs_private.wire_v1(t text) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE j json; v jsonb;
BEGIN
  IF t IS NULL OR octet_length(t) NOT BETWEEN 1 AND 262144 THEN RAISE EXCEPTION 'm04 invalid wire' USING ERRCODE='P7601'; END IF;
  j:=t::json;
  IF official_v3_jobs_private.unique_json_v1(j,0) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid wire' USING ERRCODE='P7601'; END IF;
  v:=j::jsonb;
  IF official_v3_jobs_private.nodes_v1(v,0,24,32768)<0 OR official_v3_jobs_private.canonical_v1(v,0)<>t
    OR official_v3_jobs_private.exact_keys_v1(v,ARRAY['operation','phase','body']) IS NOT TRUE
    OR (v->>'operation' IN ('queue_read','queue_confirm','queue_cas','execution_read','execution_start','execution_prepare')) IS NOT TRUE
    OR (v->>'phase' IN ('probe','authorized')) IS NOT TRUE OR jsonb_typeof(v->'body') IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'm04 invalid wire' USING ERRCODE='P7601'; END IF;
  RETURN v;
END $$;
CREATE FUNCTION official_v3_jobs_private.civil_date_v1(t text) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE d date;
BEGIN
  IF t IS NULL OR t !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' OR left(t,4)='0000' THEN RETURN false; END IF;
  d:=make_date(substring(t,1,4)::integer,substring(t,6,2)::integer,substring(t,9,2)::integer);
  RETURN to_char(d,'YYYY-MM-DD')=t;
EXCEPTION WHEN datetime_field_overflow OR invalid_datetime_format THEN RETURN false;
END $$;
CREATE FUNCTION official_v3_jobs_private.timestamp_v1(t text) RETURNS timestamptz
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE v timestamptz;
BEGIN
  IF t IS NULL OR t !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$'
    OR official_v3_jobs_private.civil_date_v1(left(t,10)) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid time' USING ERRCODE='P7601'; END IF;
  v:=t::timestamptz;
  IF to_char(v AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')<>t THEN RAISE EXCEPTION 'm04 invalid time' USING ERRCODE='P7601'; END IF;
  RETURN v;
END $$;

CREATE FUNCTION official_v3_jobs_private.predicate_v1(v jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE valid boolean:=false; k text:=v->>'kind'; countries text[]:=ARRAY['AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW']; keys text[]; x jsonb;
BEGIN
  IF v IS NULL OR jsonb_typeof(v) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'm04 invalid predicate' USING ERRCODE='P7601'; END IF;
  CASE k
  WHEN 'destination_permission' THEN keys:=ARRAY['kind','destinationCountryCode','permissionClass','validity'];
    valid:=v->>'destinationCountryCode'=ANY(countries) AND v->>'permissionClass' IN ('entry_clearance','permission_to_enter_or_stay','electronic_travel_authorization','visa','residence_permit') AND v->>'validity'='valid_on_travel_date';
  WHEN 'lawful_residence' THEN keys:=ARRAY['kind','countryCode','entitlement','departure'];
    valid:=v->>'countryCode'=ANY(countries) AND v->>'entitlement'='entitled_to_reside' AND v->>'departure' IN ('unrestricted','unspecified');
  WHEN 'journey_origin' THEN keys:=ARRAY['kind','place']; x:=v->'place';
    valid:=(official_v3_jobs_private.exact_keys_v1(x,ARRAY['kind','countryCode']) AND x->>'kind'='country' AND x->>'countryCode'=ANY(countries))
      OR (official_v3_jobs_private.exact_keys_v1(x,ARRAY['kind','regionCode']) AND x->>'kind'='region' AND x->>'regionCode'='common_travel_area');
  WHEN 'age_on_travel_date' THEN keys:=ARRAY['kind','comparison','years'];
    valid:=v->>'comparison' IN ('at_most','at_least') AND jsonb_typeof(v->'years')='number' AND v->>'years' ~ '^(0|[1-9][0-9]{0,2})$' AND (v->>'years')::numeric BETWEEN 0 AND 120;
  WHEN 'travel_purpose' THEN keys:=ARRAY['kind','purpose']; valid:=v->>'purpose' IN ('visitor','business','study','medical','transit','work','creative_worker','other');
  WHEN 'document_class' THEN keys:=ARRAY['kind','documentClass']; valid:=v->>'documentClass' IN ('ordinary','diplomatic','official','emergency','refugee_travel_document','laissez_passer');
  WHEN 'issuing_country','citizenship_includes','credential_citizenship_link','national_passport_for_citizenship' THEN keys:=ARRAY['kind','countryCode']; valid:=v->>'countryCode'=ANY(countries);
  WHEN 'nationality_status' THEN keys:=ARRAY['kind','status']; valid:=v->>'status' IN ('british_overseas_territory_citizen','british_national_overseas');
  WHEN 'institution_status' THEN keys:=ARRAY['kind','status']; valid:=v->>'status' IN ('french_ministry_of_education_school','confirmed_german_school');
  WHEN 'group_size_at_least' THEN keys:=ARRAY['kind','count']; valid:=jsonb_typeof(v->'count')='number' AND v->>'count' ~ '^[1-9][0-9]?$' AND (v->>'count')::numeric BETWEEN 2 AND 50;
  WHEN 'group_membership' THEN keys:=ARRAY['kind','role']; valid:=v->>'role'='traveller_included';
  WHEN 'authority_confirmation' THEN keys:=ARRAY['kind','subject']; valid:=v->>'subject'='institution_status';
  WHEN 'activity_characteristic' THEN keys:=ARRAY['kind','characteristic']; valid:=v->>'characteristic' IN ('remunerative_activity','income_earning_activity','profit_making_business_operation','business_contacts');
  WHEN 'planned_stay_duration' THEN keys:=ARRAY['kind','comparison','duration','counting']; x:=v->'duration';
    valid:=v->>'comparison' IN ('at_most','more_than') AND official_v3_jobs_private.exact_keys_v1(x,ARRAY['value','unit'])
      AND jsonb_typeof(x->'value')='number' AND x->>'value' ~ '^[1-9][0-9]{0,3}$'
      AND ((x->>'unit'='days' AND (x->>'value')::numeric BETWEEN 1 AND 3660 AND v->>'counting' IN ('unspecified','calendar_dates_inclusive','calendar_dates_exit_exclusive'))
        OR (x->>'unit'='months' AND (x->>'value')::numeric BETWEEN 1 AND 120 AND v->>'counting'='unspecified'));
  ELSE valid:=false;
  END CASE;
  IF valid IS NOT TRUE OR official_v3_jobs_private.exact_keys_v1(v,keys) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid predicate' USING ERRCODE='P7601'; END IF;
  RETURN v;
END $$;
CREATE FUNCTION official_v3_jobs_private.expression_v1(v jsonb,strip_support boolean,d integer) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE op text:=v->>'op'; e jsonb; n jsonb; a jsonb:='[]'; ids jsonb; count_ops integer;
BEGIN
  IF v IS NULL OR strip_support IS NULL OR d IS NULL OR d<1 OR d>4 OR jsonb_typeof(v) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'm04 invalid expression' USING ERRCODE='P7601'; END IF;
  WITH RECURSIVE tree(x,level) AS (SELECT v,1 UNION ALL SELECT e.value,t.level+1 FROM tree t
    CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN t.x->>'op' IN ('all','any') AND jsonb_typeof(t.x->'operands')='array' THEN t.x->'operands'
      WHEN t.x->>'op'='not' THEN jsonb_build_array(t.x->'operand') ELSE '[]'::jsonb END) e WHERE t.level<=4)
    SELECT count(*) INTO count_ops FROM tree;
  IF count_ops>16 THEN RAISE EXCEPTION 'm04 expression bound' USING ERRCODE='P7601'; END IF;
  IF op='atomic' THEN
    IF official_v3_jobs_private.exact_keys_v1(v,CASE WHEN v?'supportVersionIds' THEN ARRAY['op','predicate','supportVersionIds'] ELSE ARRAY['op','predicate'] END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid expression' USING ERRCODE='P7601'; END IF;
    n:=jsonb_build_object('op','atomic','predicate',official_v3_jobs_private.predicate_v1(v->'predicate'));
    IF v?'supportVersionIds' THEN
      IF jsonb_typeof(v->'supportVersionIds') IS DISTINCT FROM 'array' OR jsonb_array_length(v->'supportVersionIds')>8 THEN RAISE EXCEPTION 'm04 invalid support' USING ERRCODE='P7601'; END IF;
      FOR e IN SELECT value FROM jsonb_array_elements(v->'supportVersionIds') LOOP
        IF jsonb_typeof(e) IS DISTINCT FROM 'string' OR e#>>'{}' !~ '^ev2_[a-f0-9]{32}$' THEN RAISE EXCEPTION 'm04 invalid support' USING ERRCODE='P7601'; END IF;
      END LOOP;
      SELECT COALESCE(jsonb_agg(x ORDER BY x COLLATE "C"),'[]') INTO ids FROM (SELECT DISTINCT value AS x FROM jsonb_array_elements_text(v->'supportVersionIds')) q;
      IF NOT strip_support AND jsonb_array_length(ids)>0 THEN n:=n||jsonb_build_object('supportVersionIds',ids); END IF;
    END IF;
    RETURN n;
  ELSIF op='not' THEN
    IF official_v3_jobs_private.exact_keys_v1(v,ARRAY['op','operand']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid expression' USING ERRCODE='P7601'; END IF;
    n:=official_v3_jobs_private.expression_v1(v->'operand',strip_support,d+1);
    RETURN CASE WHEN n->>'op'='not' THEN n->'operand' ELSE jsonb_build_object('op','not','operand',n) END;
  ELSIF op IN ('all','any') THEN
    IF official_v3_jobs_private.exact_keys_v1(v,ARRAY['op','operands']) IS NOT TRUE OR jsonb_typeof(v->'operands') IS DISTINCT FROM 'array'
      OR jsonb_array_length(v->'operands') NOT BETWEEN 1 AND 8 THEN RAISE EXCEPTION 'm04 invalid expression' USING ERRCODE='P7601'; END IF;
    FOR e IN SELECT value FROM jsonb_array_elements(v->'operands') LOOP
      n:=official_v3_jobs_private.expression_v1(e,strip_support,d+1);
      a:=a||CASE WHEN n->>'op'=op THEN n->'operands' ELSE jsonb_build_array(n) END;
    END LOOP;
    SELECT jsonb_agg(x ORDER BY official_v3_jobs_private.canonical_v1(x,0) COLLATE "C") INTO a FROM (SELECT DISTINCT value AS x FROM jsonb_array_elements(a)) q;
    IF jsonb_array_length(a)>8 THEN RAISE EXCEPTION 'm04 expression bound' USING ERRCODE='P7601'; END IF;
    RETURN CASE WHEN jsonb_array_length(a)=1 THEN a->0 ELSE jsonb_build_object('op',op,'operands',a) END;
  END IF;
  RAISE EXCEPTION 'm04 invalid expression' USING ERRCODE='P7601';
END $$;

CREATE FUNCTION official_v3_jobs_private.context_v1(v jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE s jsonb:=v->'scope'; c jsonb:=v->'conditions'; o jsonb:=s->'credentialOption'; r jsonb:=s->'residence';
  a jsonb:=v->'application'; normal jsonb; semantic jsonb; countries text[]:=ARRAY['AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW']; missing jsonb;
BEGIN
  IF official_v3_jobs_private.exact_keys_v1(v,CASE WHEN v?'contextRevision' THEN ARRAY['contextRevision','scope','route','conditions','application'] ELSE ARRAY['scope','route','conditions'] END) IS NOT TRUE
    OR official_v3_jobs_private.nodes_v1(v,0,16,8192)<0 OR octet_length(official_v3_jobs_private.canonical_v1(v,0))>65536
    OR official_v3_jobs_private.exact_keys_v1(s,ARRAY['destinationCountryCode','transitCountryCode','citizenship','credentialOption','residence','requirementType','validity']) IS NOT TRUE
    OR (s->>'destinationCountryCode'=ANY(countries)) IS NOT TRUE
    OR (s->'transitCountryCode'<>'null'::jsonb AND (s->>'transitCountryCode'=ANY(countries)) IS NOT TRUE)
    OR official_v3_jobs_private.exact_keys_v1(s->'citizenship',ARRAY['mode','countryCodes']) IS NOT TRUE
    OR s#>>'{citizenship,mode}' IS DISTINCT FROM 'required' OR jsonb_typeof(s#>'{citizenship,countryCodes}') IS DISTINCT FROM 'array'
    OR jsonb_array_length(s#>'{citizenship,countryCodes}')<>1 OR (s#>>'{citizenship,countryCodes,0}'=ANY(countries)) IS NOT TRUE
    OR s->'validity'<>'{"mode":"not_applicable"}'::jsonb
    OR (s->>'requirementType' IN ('visa','electronic_travel_authorization','passport','identity_document','passport_validity','blank_passport_pages','transit','health','vaccination','health_document','entry_form','insurance','onward_or_return_ticket','booking_or_travel_document','financial_means','other_entry_requirement')) IS NOT TRUE
    OR (v->>'route' IN ('direct_entry','transit','unresolved')) IS NOT TRUE
    OR (v->>'route'='direct_entry' AND s->'transitCountryCode'<>'null'::jsonb)
    OR (v->>'route'='transit' AND s->'transitCountryCode'='null'::jsonb) THEN RAISE EXCEPTION 'm04 invalid context' USING ERRCODE='P7601'; END IF;
  IF o<>'{"mode":"not_applicable"}'::jsonb THEN
    IF official_v3_jobs_private.exact_keys_v1(o,ARRAY['mode','documentType','issuingCountryCode','relatedCitizenshipCountryCode']) IS NOT TRUE
      OR o->>'mode' IS DISTINCT FROM 'option' OR (o->>'documentType' IN ('passport','national_id','unknown')) IS NOT TRUE
      OR (o->>'issuingCountryCode'=ANY(countries)) IS NOT TRUE
      OR (o->'relatedCitizenshipCountryCode'<>'null'::jsonb AND o->'relatedCitizenshipCountryCode'<>s#>'{citizenship,countryCodes,0}') THEN
      RAISE EXCEPTION 'm04 invalid credential' USING ERRCODE='P7601'; END IF;
  END IF;
  IF r<>'{"mode":"not_applicable"}'::jsonb AND (official_v3_jobs_private.exact_keys_v1(r,ARRAY['mode','countryCode']) IS NOT TRUE
    OR r->>'mode' IS DISTINCT FROM 'required' OR (r->>'countryCode'=ANY(countries)) IS NOT TRUE) THEN RAISE EXCEPTION 'm04 invalid residence' USING ERRCODE='P7601'; END IF;
  IF c->>'status'='specified' THEN
    IF official_v3_jobs_private.exact_keys_v1(c,ARRAY['status','expression']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid conditions' USING ERRCODE='P7601'; END IF;
    normal:=official_v3_jobs_private.expression_v1(c->'expression',false,1);
    IF normal<>c->'expression' THEN RAISE EXCEPTION 'm04 nonnormal context' USING ERRCODE='P7601'; END IF;
    c:=jsonb_build_object('status','specified','expression','rule-applicability-structure:v2:'||official_v3_jobs_private.canonical_v1(official_v3_jobs_private.expression_v1(normal,true,1),0));
  ELSIF c->>'status'='unresolved' THEN
    IF official_v3_jobs_private.exact_keys_v1(c,ARRAY['status','missing']) IS NOT TRUE OR jsonb_typeof(c->'missing') IS DISTINCT FROM 'array'
      OR jsonb_array_length(c->'missing') NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'm04 invalid conditions' USING ERRCODE='P7601'; END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(c->'missing') x WHERE jsonb_typeof(x) IS DISTINCT FROM 'string'
      OR (x#>>'{}' IN ('document_class','travel_purpose','planned_stay_duration','transit','other_rule_conditions')) IS NOT TRUE) THEN RAISE EXCEPTION 'm04 invalid conditions' USING ERRCODE='P7601'; END IF;
    SELECT jsonb_agg(x ORDER BY x COLLATE "C") INTO missing FROM (SELECT DISTINCT value x FROM jsonb_array_elements_text(c->'missing')) q;
    IF missing<>c->'missing' THEN RAISE EXCEPTION 'm04 nonnormal conditions' USING ERRCODE='P7601'; END IF;
  ELSIF c<>'{"status":"unconditional"}'::jsonb THEN RAISE EXCEPTION 'm04 invalid conditions' USING ERRCODE='P7601'; END IF;
  semantic:=jsonb_build_object('scope',s,'route',v->'route','conditions',c);
  IF v?'contextRevision' THEN
    IF v->'contextRevision'<>'2'::jsonb OR official_v3_jobs_private.exact_keys_v1(a,ARRAY['purpose','tripStartAndEndWindow']) IS NOT TRUE
      OR a->>'purpose' IS DISTINCT FROM 'tourism' OR official_v3_jobs_private.exact_keys_v1(a->'tripStartAndEndWindow',ARRAY['from','through']) IS NOT TRUE
      OR official_v3_jobs_private.civil_date_v1(a#>>'{tripStartAndEndWindow,from}') IS NOT TRUE
      OR official_v3_jobs_private.civil_date_v1(a#>>'{tripStartAndEndWindow,through}') IS NOT TRUE
      OR a#>>'{tripStartAndEndWindow,from}'>a#>>'{tripStartAndEndWindow,through}' THEN RAISE EXCEPTION 'm04 invalid application' USING ERRCODE='P7601'; END IF;
    semantic:=semantic||jsonb_build_object('contextRevision',2,'application',a);
  END IF;
  RETURN semantic;
END $$;
CREATE FUNCTION official_v3_jobs_private.subject_v1(kind text,v jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE m jsonb:=v->'method'; context jsonb; s jsonb; o jsonb; r jsonb; preimage jsonb; ck text; jk text; sk text; rk text; legacy text; research jsonb; pair_text text; countries text[]:=ARRAY['AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW'];
BEGIN
  IF official_v3_jobs_private.exact_keys_v1(m,ARRAY['methodId','revision']) IS NOT TRUE OR jsonb_typeof(m->'methodId') IS DISTINCT FROM 'string' OR (m->>'methodId' ~ '^[a-z][a-z0-9_-]{1,63}$') IS NOT TRUE
    OR jsonb_typeof(m->'revision') IS DISTINCT FROM 'number' OR m->>'revision' !~ '^[1-9][0-9]{0,9}$' OR (m->>'revision')::numeric>2147483647 THEN RAISE EXCEPTION 'm04 invalid method' USING ERRCODE='P7601'; END IF;
  IF kind='combination_discovery' THEN
    IF official_v3_jobs_private.exact_keys_v1(v,ARRAY['destinationCountryCode','citizenshipCountryCode','method']) IS NOT TRUE
      OR (v->>'destinationCountryCode'=ANY(countries)) IS NOT TRUE OR (v->>'citizenshipCountryCode'=ANY(countries)) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid pair' USING ERRCODE='P7601'; END IF;
    pair_text:=official_v3_jobs_private.canonical_v1(v,0);
    jk:='combination-discovery-job:v3:'||encode(sha256(convert_to(pair_text,'UTF8')),'hex');
    RETURN jsonb_build_object('kind',kind,'jobKey',jk,'subjectText',(CASE WHEN jsonb_typeof(v->'citizenshipCountryCode')='string' AND jsonb_typeof(v->'destinationCountryCode')='string'
      THEN overlay(pair_text placing ',"kind":'||official_v3_jobs_private.canonical_v1(to_jsonb(kind),1) from strpos(pair_text COLLATE "C",',"method":') for 0)
      ELSE official_v3_jobs_private.canonical_v1(v||jsonb_build_object('kind',kind),0) END),'contextKey',NULL);
  END IF;
  IF kind IS DISTINCT FROM 'rule_research' OR official_v3_jobs_private.exact_keys_v1(v,ARRAY['context','method','factKind','researchReason']) IS NOT TRUE
    OR (v->>'factKind' IN ('passport_validity','blank_passport_pages','requirement_effect','visa_options','stay_limit','transit_conditions','official_actions','temporal_rule')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid subject' USING ERRCODE='P7601'; END IF;
  r:=v->'researchReason';
  IF r<>'{"status":"missing"}'::jsonb AND (official_v3_jobs_private.exact_keys_v1(r,ARRAY['status','reason']) IS NOT TRUE
    OR r->>'status' IS DISTINCT FROM 'recheck_needed' OR (r->>'reason' IN ('valid_from_in_future','valid_until_elapsed','max_age_exceeded')) IS NOT TRUE) THEN RAISE EXCEPTION 'm04 invalid reason' USING ERRCODE='P7601'; END IF;
  context:=official_v3_jobs_private.context_v1(v->'context'); s:=context->'scope'; o:=s->'credentialOption';
  ck:='official-truth-context:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(context,0),'UTF8')),'hex');
  -- Legacy insertion order is deliberately distinct from canonical_v1 object order.
  legacy:='{"v":1,"destinationCountryCode":'||(s->'destinationCountryCode')::text||',"transitCountryCode":'||(s->'transitCountryCode')::text
    ||',"citizenshipMode":"required","citizenshipCountryCodes":'||official_v3_jobs_private.canonical_v1(s#>'{citizenship,countryCodes}',0)
    ||',"credentialOptionMode":'||(o->'mode')::text||',"documentType":'||COALESCE((o->'documentType')::text,'null')
    ||',"issuingCountryCode":'||COALESCE((o->'issuingCountryCode')::text,'null')||',"relatedCitizenshipCountryCode":'||COALESCE((o->'relatedCitizenshipCountryCode')::text,'null')
    ||',"relation":'||to_jsonb(CASE WHEN o->>'mode'='not_applicable' THEN 'not_applicable' WHEN o->'relatedCitizenshipCountryCode'='null'::jsonb THEN 'unlinked' ELSE 'explicit' END)::text
    ||',"residenceMode":'||(s#>'{residence,mode}')::text||',"residenceCountryCode":'||COALESCE((s#>'{residence,countryCode}')::text,'null')
    ||',"requirementType":'||(s->'requirementType')::text||',"validityMode":"not_applicable","travelDate":null}';
  sk:='rule-scope:v1:'||encode(sha256(convert_to(legacy,'UTF8')),'hex');
  rk:='research-request:v1:'||encode(sha256(convert_to('{"v":1,"ruleScopeKey":'||to_jsonb(sk)::text||',"factKind":'||(v->'factKind')::text
    ||',"status":'||(r->'status')::text||',"recheckReason":'||COALESCE((r->'reason')::text,'null')||'}','UTF8')),'hex');
  research:=jsonb_build_object('key',rk,'ruleScopeKey',sk,'factKind',v->'factKind','researchReason',r);
  jk:='research-job:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object('contextKey',ck,'method',m,'factKind',v->'factKind'),0),'UTF8')),'hex');
  preimage:=jsonb_build_object('kind',kind,'context',context,'method',m,'factKind',v->'factKind');
  RETURN jsonb_build_object('kind',kind,'jobKey',jk,'subjectText',official_v3_jobs_private.canonical_v1(preimage,0),'contextKey',ck,'research',research);
END $$;
CREATE FUNCTION official_v3_jobs_private.job_v1(v jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE common text[]:=ARRAY['schema','kind','jobId','operationId','revision','predecessorRevision','state','createdAt','updatedAt','attempt','attemptLimit','lease','nextAttemptAt','lastFailure'];
  i jsonb; result_ref jsonb; l jsonb:=v->'lease'; state text:=v->>'state'; created timestamptz; updated timestamptz;
  attempt integer; lim integer; revision integer;
BEGIN
  IF v IS NULL OR official_v3_jobs_private.nodes_v1(v,0,16,8192)<0 OR octet_length(official_v3_jobs_private.canonical_v1(v,0))>65536 THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
  IF v->>'kind'='research_job_record' THEN
    IF official_v3_jobs_private.exact_keys_v1(v,common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
    i:=official_v3_jobs_private.subject_v1('rule_research',jsonb_build_object('context',v->'context','method',v->'method','factKind',v#>'{research,factKind}','researchReason',v#>'{research,researchReason}'));
    IF i->'jobKey' IS DISTINCT FROM v->'jobKey' OR i->'contextKey' IS DISTINCT FROM v->'contextKey' OR i->'research' IS DISTINCT FROM v->'research' THEN RAISE EXCEPTION 'm04 invalid job identity' USING ERRCODE='P7601'; END IF;
    result_ref:=v->'resultDecisionRef';
    IF result_ref<>'null'::jsonb AND (result_ref#>>'{}' ~ '^source-decision:v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid result' USING ERRCODE='P7601'; END IF;
  ELSIF v->>'kind'='combination_discovery_job_record' THEN
    IF official_v3_jobs_private.exact_keys_v1(v,common||ARRAY['identity','resultDiscoveryRef']) IS NOT TRUE
      OR official_v3_jobs_private.exact_keys_v1(v->'identity',ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey']) IS NOT TRUE
      OR v#>>'{identity,kind}' IS DISTINCT FROM 'combination_discovery' THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
    i:=official_v3_jobs_private.subject_v1('combination_discovery',(v->'identity')-'kind'-'jobKey');
    IF i->'jobKey' IS DISTINCT FROM v#>'{identity,jobKey}' THEN RAISE EXCEPTION 'm04 invalid job identity' USING ERRCODE='P7601'; END IF;
    result_ref:=v->'resultDiscoveryRef';
    IF result_ref<>'null'::jsonb AND (result_ref#>>'{}' ~ '^combination-discovery-result:v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid result' USING ERRCODE='P7601'; END IF;
  ELSE RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
  IF v->'schema' IS DISTINCT FROM '3'::jsonb OR (v->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE
    OR (v->>'operationId' ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(v->'revision') IS DISTINCT FROM 'number'
    OR (v->>'revision' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (v->>'revision')::numeric>2147483647
    OR jsonb_typeof(v->'attempt') IS DISTINCT FROM 'number' OR (v->>'attempt' ~ '^(0|[1-9][0-9]?)$') IS NOT TRUE
    OR jsonb_typeof(v->'attemptLimit') IS DISTINCT FROM 'number' OR (v->>'attemptLimit' ~ '^[1-9][0-9]?$') IS NOT TRUE
    OR (state IN ('queued','leased','backoff','succeeded','exhausted')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid job lifecycle' USING ERRCODE='P7601'; END IF;
  revision:=(v->>'revision')::integer; attempt:=(v->>'attempt')::integer; lim:=(v->>'attemptLimit')::integer;
  IF lim NOT BETWEEN 1 AND 16 OR attempt NOT BETWEEN 0 AND lim
    OR (v->'predecessorRevision'='null'::jsonb AND revision<>1)
    OR (v->'predecessorRevision'<>'null'::jsonb AND (v->'predecessorRevision' IS DISTINCT FROM to_jsonb(revision-1) OR revision<=1)) THEN RAISE EXCEPTION 'm04 invalid job lifecycle' USING ERRCODE='P7601'; END IF;
  created:=official_v3_jobs_private.timestamp_v1(v->>'createdAt'); updated:=(CASE WHEN (v->>'updatedAt') COLLATE "C" = (v->>'createdAt') COLLATE "C" THEN created ELSE official_v3_jobs_private.timestamp_v1(v->>'updatedAt') END);
  IF created>updated OR (v->'lastFailure'<>'null'::jsonb AND (v->>'lastFailure' IN ('unreachable','invalid_proposal','verification_unavailable','commit_unconfirmed')) IS NOT TRUE) THEN RAISE EXCEPTION 'm04 invalid job lifecycle' USING ERRCODE='P7601'; END IF;
  IF state='leased' THEN
    IF official_v3_jobs_private.exact_keys_v1(l,ARRAY['leaseId','generation','acquiredAt','expiresAt']) IS NOT TRUE
      OR (l->>'leaseId' ~ '^lease3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(l->'generation') IS DISTINCT FROM 'number'
      OR (l->>'generation' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (l->>'generation')::numeric NOT BETWEEN 1 AND revision OR attempt<1
      OR (CASE WHEN (l->>'acquiredAt') COLLATE "C" = (v->>'updatedAt') COLLATE "C" THEN updated ELSE official_v3_jobs_private.timestamp_v1(l->>'acquiredAt') END) NOT BETWEEN created AND updated
      OR official_v3_jobs_private.timestamp_v1(l->>'expiresAt')<=updated
      OR official_v3_jobs_private.timestamp_v1(l->>'expiresAt')>(CASE WHEN (l->>'acquiredAt') COLLATE "C" = (v->>'updatedAt') COLLATE "C" THEN updated ELSE official_v3_jobs_private.timestamp_v1(l->>'acquiredAt') END)+interval '900 seconds' THEN RAISE EXCEPTION 'm04 invalid lease' USING ERRCODE='P7601'; END IF;
  ELSIF l<>'null'::jsonb THEN RAISE EXCEPTION 'm04 invalid lease' USING ERRCODE='P7601'; END IF;
  IF state='backoff' THEN
    IF official_v3_jobs_private.timestamp_v1(v->>'nextAttemptAt')<=updated OR v->'lastFailure'='null'::jsonb OR attempt<1 OR attempt>=lim THEN RAISE EXCEPTION 'm04 invalid backoff' USING ERRCODE='P7601'; END IF;
  ELSIF v->'nextAttemptAt'<>'null'::jsonb THEN RAISE EXCEPTION 'm04 invalid backoff' USING ERRCODE='P7601'; END IF;
  IF (state='queued' AND (attempt<>0 OR v->'lastFailure'<>'null'::jsonb))
    OR (state='succeeded' AND (result_ref='null'::jsonb OR attempt<1)) OR (state<>'succeeded' AND result_ref<>'null'::jsonb)
    OR (state='exhausted' AND (attempt<>lim OR v->'lastFailure'='null'::jsonb)) THEN RAISE EXCEPTION 'm04 invalid job state' USING ERRCODE='P7601'; END IF;
  RETURN v;
END $$;
CREATE FUNCTION official_v3_jobs_private.command_v1(v jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE a text:=v->>'action'; k text:=v->>'kind'; i jsonb:=v->'input'; identity jsonb; jkey text; f jsonb; t text;
BEGIN
  IF v IS NULL THEN RAISE EXCEPTION 'm04 invalid command' USING ERRCODE='P7601'; END IF;
  t:=official_v3_jobs_private.canonical_v1(v,0);
  IF octet_length(t)>65536
    OR official_v3_jobs_private.exact_keys_v1(v,CASE WHEN a IN ('enqueue','complete') THEN ARRAY['action','kind','input'] ELSE ARRAY['action','input'] END) IS NOT TRUE
    OR (a IN ('enqueue','claim','complete','fail')) IS NOT TRUE OR (i->>'operationId' ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid command' USING ERRCODE='P7601'; END IF;
  IF a='enqueue' THEN
    IF k='rule_research' THEN
      IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['context','method','factKind','researchReason','operationId','jobId','attemptLimit']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
    ELSIF k='combination_discovery' THEN
      IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['destinationCountryCode','citizenshipCountryCode','method','operationId','jobId','attemptLimit']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
    ELSE RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
    IF (i->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(i->'attemptLimit') IS DISTINCT FROM 'number'
      OR (i->>'attemptLimit' ~ '^[1-9][0-9]?$') IS NOT TRUE OR (i->>'attemptLimit')::integer NOT BETWEEN 1 AND 16 THEN RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
    identity:=official_v3_jobs_private.subject_v1(k,i-'operationId'-'jobId'-'attemptLimit'); jkey:=identity->>'jobKey';
  ELSE
    jkey:=i->>'jobKey';
    IF (jkey ~ '^(research-job|combination-discovery-job):v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid locator' USING ERRCODE='P7601'; END IF;
    IF a='claim' THEN
      IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['operationId','jobKey','leaseId','leaseMilliseconds']) IS NOT TRUE
        OR (i->>'leaseId' ~ '^lease3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(i->'leaseMilliseconds') IS DISTINCT FROM 'number'
        OR (i->>'leaseMilliseconds' ~ '^[1-9][0-9]{0,5}$') IS NOT TRUE OR (i->>'leaseMilliseconds')::integer>900000 THEN RAISE EXCEPTION 'm04 invalid claim' USING ERRCODE='P7601'; END IF;
    ELSE
      f:=i->'fence';
      IF official_v3_jobs_private.exact_keys_v1(f,ARRAY['jobId','revision','leaseId','generation']) IS NOT TRUE
        OR (f->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE OR (f->>'leaseId' ~ '^lease3_[a-f0-9]{32}$') IS NOT TRUE
        OR jsonb_typeof(f->'revision') IS DISTINCT FROM 'number' OR (f->>'revision' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (f->>'revision')::numeric>2147483647
        OR jsonb_typeof(f->'generation') IS DISTINCT FROM 'number' OR (f->>'generation' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (f->>'generation')::numeric>2147483647 THEN RAISE EXCEPTION 'm04 invalid fence' USING ERRCODE='P7601'; END IF;
      IF a='complete' THEN
        IF (k IN ('rule_research','combination_discovery')) IS NOT TRUE OR (k='rule_research')<>(jkey LIKE 'research-job:%')
          OR official_v3_jobs_private.exact_keys_v1(i,CASE WHEN k='rule_research' THEN ARRAY['operationId','jobKey','fence','decisionRef'] ELSE ARRAY['operationId','jobKey','fence','discoveryRef'] END) IS NOT TRUE
          OR (COALESCE(i->>'decisionRef',i->>'discoveryRef') ~ CASE WHEN k='rule_research' THEN '^source-decision:v3:[a-f0-9]{64}$' ELSE '^combination-discovery-result:v3:[a-f0-9]{64}$' END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid completion' USING ERRCODE='P7601'; END IF;
      ELSE
        IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['operationId','jobKey','fence','reason']) IS NOT TRUE
          OR (i->>'reason' IN ('unreachable','invalid_proposal','verification_unavailable','commit_unconfirmed')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid failure' USING ERRCODE='P7601'; END IF;
      END IF;
    END IF;
    k:=CASE WHEN jkey LIKE 'research-job:%' THEN 'rule_research' ELSE 'combination_discovery' END;
  END IF;
  RETURN jsonb_build_object('value',v,'commandText',t,'commandKey','queue-command:v3:'||encode(sha256(convert_to(t,'UTF8')),'hex'),
    'operationId',i->'operationId','jobKey',jkey,'subjectText',identity->'subjectText','action',a,'kind',k);
END $$;
CREATE FUNCTION official_v3_jobs_private.reference_v1(v jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE b jsonb:=v->'binding'; m jsonb:=b->'method';
BEGIN
  IF official_v3_jobs_private.exact_keys_v1(v,ARRAY['binding','proposalDigest','bytes']) IS NOT TRUE
    OR official_v3_jobs_private.exact_keys_v1(b,ARRAY['schema','kind','operationId','jobId','contextKey','method','runnerId','deliveryId','inputRevision']) IS NOT TRUE
    OR b->'schema' IS DISTINCT FROM '3'::jsonb OR b->>'kind' IS DISTINCT FROM 'proposal_intake_binding'
    OR (b->>'operationId' ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE OR (b->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE
    OR (b->>'contextKey' ~ '^official-truth-context:v3:[a-f0-9]{64}$') IS NOT TRUE
    OR (b->>'runnerId' ~ '^runner3_[a-f0-9]{32}$') IS NOT TRUE OR (b->>'deliveryId' ~ '^delivery3_[a-f0-9]{32}$') IS NOT TRUE
    OR (b->>'inputRevision' ~ '^(git:[a-f0-9]{40}|snapshot:[a-f0-9]{64})$') IS NOT TRUE
    OR official_v3_jobs_private.exact_keys_v1(m,ARRAY['methodId','revision']) IS NOT TRUE OR jsonb_typeof(m->'methodId') IS DISTINCT FROM 'string' OR (m->>'methodId' ~ '^[a-z][a-z0-9_-]{1,63}$') IS NOT TRUE
    OR jsonb_typeof(m->'revision') IS DISTINCT FROM 'number' OR (m->>'revision' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (m->>'revision')::numeric>2147483647
    OR (v->>'proposalDigest' ~ '^[a-f0-9]{64}$') IS NOT TRUE OR jsonb_typeof(v->'bytes') IS DISTINCT FROM 'number'
    OR (v->>'bytes' ~ '^[1-9][0-9]{0,4}$') IS NOT TRUE OR (v->>'bytes')::integer>65536 THEN RAISE EXCEPTION 'm04 invalid reference' USING ERRCODE='P7601'; END IF;
  RETURN v;
END $$;
CREATE FUNCTION official_v3_jobs_private.transition_v1(command jsonb,current_record jsonb,commit jsonb) RETURNS void
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE c jsonb:=official_v3_jobs_private.command_v1(command); i jsonb:=command->'input'; expected jsonb; n jsonb; identity jsonb;
  a jsonb:=commit->'audit'; f jsonb:=i->'fence'; kind text; action text:=command->>'action'; at_time timestamptz; end_time timestamptz;
  observed text:=a->>'observedAt'; rev integer; delay_ms integer; result_key text;
BEGIN
  IF official_v3_jobs_private.exact_keys_v1(commit,ARRAY['operationId','commandKey','jobKey','expected','next','notAfter','audit']) IS NOT TRUE
    OR octet_length(official_v3_jobs_private.canonical_v1(commit,0))>196608
    OR official_v3_jobs_private.exact_keys_v1(a,ARRAY['reference','kind','observedAt','priorRevision','nextRevision']) IS NOT TRUE
    OR commit->'operationId' IS DISTINCT FROM c->'operationId' OR commit->'commandKey' IS DISTINCT FROM c->'commandKey'
    OR commit->'jobKey' IS DISTINCT FROM c->'jobKey' OR commit->'expected' IS DISTINCT FROM current_record THEN RAISE EXCEPTION 'm04 invalid transition' USING ERRCODE='P7601'; END IF;
  at_time:=official_v3_jobs_private.timestamp_v1(observed); end_time:=at_time+interval '5 seconds';
  IF current_record IS DISTINCT FROM 'null'::jsonb THEN
    expected:=official_v3_jobs_private.job_v1(current_record);
    IF COALESCE(expected->'jobKey',expected#>'{identity,jobKey}') IS DISTINCT FROM c->'jobKey' OR expected->>'updatedAt'>observed THEN RAISE EXCEPTION 'm04 invalid prior' USING ERRCODE='P7601'; END IF;
  END IF;
  rev:=COALESCE((expected->>'revision')::integer,0)+1;
  IF action='enqueue' THEN
    IF expected->>'state' IN ('queued','leased','backoff') THEN n:=expected; kind:='deduplicated';
    ELSE
      IF expected->'jobId'=i->'jobId' THEN RAISE EXCEPTION 'm04 repeated cycle' USING ERRCODE='P7601'; END IF;
      n:=jsonb_build_object('schema',3,'jobId',i->'jobId','operationId',i->'operationId','revision',rev,'predecessorRevision',expected->'revision',
        'state','queued','createdAt',observed,'updatedAt',observed,'attempt',0,'attemptLimit',i->'attemptLimit','lease',NULL,'nextAttemptAt',NULL,'lastFailure',NULL);
      identity:=official_v3_jobs_private.subject_v1(command->>'kind',i-'operationId'-'jobId'-'attemptLimit');
      IF command->>'kind'='rule_research' THEN n:=n||jsonb_build_object('kind','research_job_record','jobKey',identity->'jobKey',
        'context',i->'context','contextKey',identity->'contextKey','research',identity->'research','method',i->'method','resultDecisionRef',NULL);
      ELSE n:=n||jsonb_build_object('kind','combination_discovery_job_record','identity',(i-'operationId'-'jobId'-'attemptLimit')||jsonb_build_object('kind','combination_discovery','jobKey',identity->'jobKey'),'resultDiscoveryRef',NULL); END IF;
      kind:='enqueued';
    END IF;
  ELSIF action='claim' THEN
    IF expected IS NULL OR expected->>'state' NOT IN ('queued','leased','backoff')
      OR (expected->>'state'='backoff' AND expected->>'nextAttemptAt'>observed)
      OR (expected->>'state'='leased' AND expected#>>'{lease,expiresAt}'>observed) THEN RAISE EXCEPTION 'm04 not due' USING ERRCODE='P7601'; END IF;
    n:=expected||jsonb_build_object('revision',rev,'predecessorRevision',expected->'revision','updatedAt',observed,'nextAttemptAt',NULL);
    IF (expected->>'attempt')::integer>=(expected->>'attemptLimit')::integer THEN
      n:=n||jsonb_build_object('state','exhausted','lease',NULL,'lastFailure',COALESCE(NULLIF(expected->'lastFailure','null'::jsonb),'"verification_unavailable"'::jsonb)); kind:='exhausted';
    ELSE
      n:=n||jsonb_build_object('state','leased','attempt',(expected->>'attempt')::integer+1,'lease',jsonb_build_object('leaseId',i->'leaseId','generation',rev,
        'acquiredAt',observed,'expiresAt',to_char((at_time+(i->>'leaseMilliseconds')::integer*interval '1 millisecond') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
      kind:=CASE WHEN expected->>'state'='leased' THEN 'reclaimed' ELSE 'leased' END;
    END IF;
  ELSE
    IF expected IS NULL OR expected->>'state'<>'leased' OR f IS DISTINCT FROM jsonb_build_object('jobId',expected->'jobId','revision',expected->'revision',
      'leaseId',expected#>'{lease,leaseId}','generation',expected#>'{lease,generation}') OR expected#>>'{lease,expiresAt}'<=observed THEN RAISE EXCEPTION 'm04 obsolete fence' USING ERRCODE='P7601'; END IF;
    end_time:=least(end_time,official_v3_jobs_private.timestamp_v1(expected#>>'{lease,expiresAt}'));
    n:=expected||jsonb_build_object('revision',rev,'predecessorRevision',expected->'revision','updatedAt',observed,'lease',NULL);
    IF action='complete' THEN
      result_key:=CASE WHEN expected->>'kind'='research_job_record' THEN 'resultDecisionRef' ELSE 'resultDiscoveryRef' END;
      n:=n||jsonb_build_object('state','succeeded','lastFailure',NULL,result_key,COALESCE(i->'decisionRef',i->'discoveryRef')); kind:='completed';
    ELSE
      IF (expected->>'attempt')::integer=(expected->>'attemptLimit')::integer THEN n:=n||jsonb_build_object('state','exhausted','nextAttemptAt',NULL); kind:='exhausted';
      ELSE
        delay_ms:=least(60000,1000*(2^((expected->>'attempt')::integer-1))::integer);
        n:=n||jsonb_build_object('state','backoff','nextAttemptAt',to_char((at_time+delay_ms*interval '1 millisecond') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')); kind:='backoff';
      END IF;
      n:=n||jsonb_build_object('lastFailure',i->'reason');
    END IF;
  END IF;
  IF kind IS DISTINCT FROM 'deduplicated' THEN n:=official_v3_jobs_private.job_v1(n); END IF;
  IF commit->'next' IS DISTINCT FROM n OR official_v3_jobs_private.timestamp_v1(commit->>'notAfter')<>end_time
    OR a IS DISTINCT FROM jsonb_build_object('reference','queue-event:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object('op',i->'operationId','command',c->'commandKey'),0),'UTF8')),'hex'),
      'kind',kind,'observedAt',observed,'priorRevision',expected->'revision','nextRevision',n->'revision') THEN RAISE EXCEPTION 'm04 transition mismatch' USING ERRCODE='P7601'; END IF;
END $$;

CREATE TABLE official_v3_jobs_private.slots_v1(slot_id integer PRIMARY KEY CHECK(slot_id BETWEEN 1 AND 1024),job_key text UNIQUE);
CREATE TABLE official_v3_jobs_private.subjects_v1(
  job_key text PRIMARY KEY CHECK(job_key ~ '^(research-job|combination-discovery-job):v3:[a-f0-9]{64}$'),
  slot_id integer NOT NULL UNIQUE REFERENCES official_v3_jobs_private.slots_v1(slot_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  kind text NOT NULL CHECK(kind IN ('rule_research','combination_discovery')),
  subject_text text NOT NULL CHECK(octet_length(subject_text) BETWEEN 1 AND 65536),
  method_binding jsonb NOT NULL,current_job jsonb NOT NULL,
  operation_count integer NOT NULL CHECK(operation_count BETWEEN 0 AND 256),start_count integer NOT NULL CHECK(start_count BETWEEN 0 AND 64),
  open_attempt text,terminal_credit_claim text,
  CHECK(operation_count+CASE WHEN terminal_credit_claim IS NULL THEN 0 ELSE 1 END<=256)
);
CREATE TABLE official_v3_jobs_private.queue_operations_v1(
  operation_id text PRIMARY KEY CHECK(operation_id ~ '^op3_[a-f0-9]{32}$'),
  job_key text NOT NULL REFERENCES official_v3_jobs_private.subjects_v1(job_key) ON DELETE RESTRICT ON UPDATE RESTRICT, action text NOT NULL CHECK(action IN ('enqueue','claim','complete','fail')),
  command_key text NOT NULL CHECK(command_key ~ '^queue-command:v3:[a-f0-9]{64}$'),
  command_text text NOT NULL CHECK(octet_length(command_text) BETWEEN 1 AND 65536),
  envelope_text text NOT NULL CHECK(octet_length(envelope_text) BETWEEN 1 AND 196608),
  audit_reference text NOT NULL UNIQUE CHECK(audit_reference ~ '^queue-event:v3:[a-f0-9]{64}$'),
  new_cycle_job_id text UNIQUE,authority jsonb NOT NULL,recorded_at timestamptz NOT NULL
);
CREATE INDEX queue_operations_subject_v1 ON official_v3_jobs_private.queue_operations_v1(job_key,operation_id);
CREATE TABLE official_v3_jobs_private.execution_starts_v1(
  attempt_key text PRIMARY KEY CHECK(attempt_key ~ '^execution-attempt:v3:[a-f0-9]{64}$'),
  job_key text NOT NULL REFERENCES official_v3_jobs_private.subjects_v1(job_key) ON DELETE RESTRICT ON UPDATE RESTRICT,
  claim_operation_id text NOT NULL UNIQUE REFERENCES official_v3_jobs_private.queue_operations_v1(operation_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  claim_text text NOT NULL CHECK(octet_length(claim_text) BETWEEN 1 AND 65536), leased_job jsonb NOT NULL,
  authority jsonb NOT NULL, token_hash text NOT NULL CHECK(token_hash ~ '^[a-f0-9]{64}$'),reserved_at timestamptz NOT NULL
);
CREATE INDEX execution_starts_subject_v1 ON official_v3_jobs_private.execution_starts_v1(job_key,attempt_key);
CREATE TABLE official_v3_jobs_private.execution_results_v1(
  attempt_key text PRIMARY KEY REFERENCES official_v3_jobs_private.execution_starts_v1(attempt_key) ON DELETE RESTRICT ON UPDATE RESTRICT,
  result jsonb NOT NULL CHECK(octet_length(result::text)<=65536), "references" jsonb NOT NULL CHECK(jsonb_array_length("references") BETWEEN 1 AND 16),
  prepared_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX execution_results_reference_v1 ON official_v3_jobs_private.execution_results_v1((CASE result->>'kind' WHEN 'rule_research' THEN result->>'decisionRef' WHEN 'combination_discovery' THEN result->>'discoveryRef' ELSE NULL END));
CREATE TABLE official_v3_jobs_private.execution_dispositions_v1(
  attempt_key text PRIMARY KEY REFERENCES official_v3_jobs_private.execution_starts_v1(attempt_key) ON DELETE RESTRICT ON UPDATE RESTRICT,
  queue_operation_id text NOT NULL UNIQUE REFERENCES official_v3_jobs_private.queue_operations_v1(operation_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  kind text NOT NULL CHECK(kind IN ('completed','settled_failure')),failure_reason text,settled_at timestamptz NOT NULL,
  CHECK((kind='completed' AND failure_reason IS NULL) OR (kind='settled_failure' AND failure_reason IS NOT NULL AND failure_reason IN ('unreachable','invalid_proposal','verification_unavailable')))
);
CREATE TABLE official_v3_jobs_private.catalog_binding_v1(object_identity text PRIMARY KEY,fingerprint jsonb NOT NULL CHECK(octet_length(fingerprint::text)<=65536));
INSERT INTO official_v3_jobs_private.slots_v1(slot_id) SELECT generate_series(1,1024);

CREATE FUNCTION official_v3_jobs_private.immutable_v1() RETURNS trigger
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
BEGIN
  IF TG_OP='UPDATE' AND TG_TABLE_SCHEMA='official_v3_jobs_private' THEN
    IF TG_TABLE_NAME='subjects_v1' AND (to_jsonb(OLD)-'current_job'-'operation_count'-'start_count'-'open_attempt'-'terminal_credit_claim')
      =(to_jsonb(NEW)-'current_job'-'operation_count'-'start_count'-'open_attempt'-'terminal_credit_claim')
      AND (to_jsonb(NEW)->>'operation_count')::integer>=(to_jsonb(OLD)->>'operation_count')::integer AND (to_jsonb(NEW)->>'start_count')::integer>=(to_jsonb(OLD)->>'start_count')::integer THEN RETURN NEW;
    ELSIF TG_TABLE_NAME='slots_v1' AND to_jsonb(OLD)->'slot_id'=to_jsonb(NEW)->'slot_id' AND to_jsonb(OLD)->'job_key'='null'::jsonb AND to_jsonb(NEW)->'job_key'<>'null'::jsonb THEN RETURN NEW; END IF;
  END IF;
  RAISE EXCEPTION 'm04 immutable history' USING ERRCODE='P7602';
END $$;
ALTER TABLE official_v3_jobs_private.slots_v1 OWNER TO postgres;
ALTER TABLE official_v3_jobs_private.slots_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_jobs_private.slots_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_v1 ON official_v3_jobs_private.slots_v1 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER guard_row_v1 BEFORE UPDATE OR DELETE ON official_v3_jobs_private.slots_v1 FOR EACH ROW EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
CREATE TRIGGER guard_truncate_v1 BEFORE TRUNCATE ON official_v3_jobs_private.slots_v1 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
ALTER TABLE official_v3_jobs_private.subjects_v1 OWNER TO postgres;
ALTER TABLE official_v3_jobs_private.subjects_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_jobs_private.subjects_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_v1 ON official_v3_jobs_private.subjects_v1 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER guard_row_v1 BEFORE UPDATE OR DELETE ON official_v3_jobs_private.subjects_v1 FOR EACH ROW EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
CREATE TRIGGER guard_truncate_v1 BEFORE TRUNCATE ON official_v3_jobs_private.subjects_v1 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
ALTER TABLE official_v3_jobs_private.queue_operations_v1 OWNER TO postgres;
ALTER TABLE official_v3_jobs_private.queue_operations_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_jobs_private.queue_operations_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_v1 ON official_v3_jobs_private.queue_operations_v1 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER guard_row_v1 BEFORE UPDATE OR DELETE ON official_v3_jobs_private.queue_operations_v1 FOR EACH ROW EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
CREATE TRIGGER guard_truncate_v1 BEFORE TRUNCATE ON official_v3_jobs_private.queue_operations_v1 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
ALTER TABLE official_v3_jobs_private.execution_starts_v1 OWNER TO postgres;
ALTER TABLE official_v3_jobs_private.execution_starts_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_jobs_private.execution_starts_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_v1 ON official_v3_jobs_private.execution_starts_v1 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER guard_row_v1 BEFORE UPDATE OR DELETE ON official_v3_jobs_private.execution_starts_v1 FOR EACH ROW EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
CREATE TRIGGER guard_truncate_v1 BEFORE TRUNCATE ON official_v3_jobs_private.execution_starts_v1 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
ALTER TABLE official_v3_jobs_private.execution_results_v1 OWNER TO postgres;
ALTER TABLE official_v3_jobs_private.execution_results_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_jobs_private.execution_results_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_v1 ON official_v3_jobs_private.execution_results_v1 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER guard_row_v1 BEFORE UPDATE OR DELETE ON official_v3_jobs_private.execution_results_v1 FOR EACH ROW EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
CREATE TRIGGER guard_truncate_v1 BEFORE TRUNCATE ON official_v3_jobs_private.execution_results_v1 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
ALTER TABLE official_v3_jobs_private.execution_dispositions_v1 OWNER TO postgres;
ALTER TABLE official_v3_jobs_private.execution_dispositions_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_jobs_private.execution_dispositions_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_v1 ON official_v3_jobs_private.execution_dispositions_v1 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER guard_row_v1 BEFORE UPDATE OR DELETE ON official_v3_jobs_private.execution_dispositions_v1 FOR EACH ROW EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
CREATE TRIGGER guard_truncate_v1 BEFORE TRUNCATE ON official_v3_jobs_private.execution_dispositions_v1 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
ALTER TABLE official_v3_jobs_private.catalog_binding_v1 OWNER TO postgres;
ALTER TABLE official_v3_jobs_private.catalog_binding_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_jobs_private.catalog_binding_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_v1 ON official_v3_jobs_private.catalog_binding_v1 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER guard_row_v1 BEFORE UPDATE OR DELETE ON official_v3_jobs_private.catalog_binding_v1 FOR EACH ROW EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
CREATE TRIGGER guard_truncate_v1 BEFORE TRUNCATE ON official_v3_jobs_private.catalog_binding_v1 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
-- SQL-standard bodies create real consumed OID dependencies on the predecessors.
CREATE FUNCTION official_v3_jobs_private.s1_read_v1(b jsonb,d text,n integer) RETURNS jsonb
LANGUAGE sql VOLATILE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp
RETURN official_v3_intake_api.read_v1(b,d,n);
CREATE FUNCTION official_v3_jobs_private.s1_shape_v1(v jsonb,tag text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp
RETURN CASE WHEN tag='proposal' THEN official_v3_intake_private.proposal_retainable_v1(v)
  AND official_v3_intake_private.safe_data_v1(v,0)
  WHEN tag='outcome' THEN octet_length(v::text)<=524288 AND official_v3_intake_private.data_nodes_v1(v,0,24,65536)>=0
    AND official_v3_intake_private.safe_data_v1(v,0)
    AND official_v3_intake_private.shape_matches_v1(v,official_v3_intake_private.proposal_shape_v1()->'definitions'->'outcome',
      official_v3_intake_private.proposal_shape_v1()->'definitions',official_v3_intake_private.proposal_shape_v1()->'countries',0)
  WHEN tag='audit' THEN octet_length(v::text)<=8192 AND official_v3_intake_private.data_nodes_v1(v,0,16,8192)>=0
    AND official_v3_intake_private.safe_data_v1(v,0)
    AND official_v3_intake_private.shape_matches_v1(v,official_v3_intake_private.proposal_shape_v1()->'definitions'->'audit',
      official_v3_intake_private.proposal_shape_v1()->'definitions',official_v3_intake_private.proposal_shape_v1()->'countries',0)
  ELSE false END;
CREATE FUNCTION official_v3_jobs_private.ma1_require_v1(m text,r integer,d text,p text,e integer) RETURNS void
LANGUAGE sql VOLATILE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp
BEGIN ATOMIC
  SELECT official_v3_method_private.require_current_locked_v1(m,r,d,p,e);
END;

CREATE FUNCTION official_v3_jobs_private.consume_s1_v1(reply jsonb,job jsonb,result jsonb,purpose text) RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE row_value jsonb:=reply->'record'; ref jsonb; b jsonb; p jsonb; raw json; identity jsonb; outcome jsonb; audit jsonb; decision jsonb;
  previous jsonb; archive jsonb; expected_ref text; expected_escalation text; conflict jsonb; retained jsonb; removed jsonb:='[]'; entry_value jsonb; method jsonb:=COALESCE(job->'method',job#>'{identity,method}');
BEGIN
  IF purpose NOT IN ('prepare','read','complete') OR official_v3_jobs_private.exact_keys_v1(reply,ARRAY['status','record']) IS NOT TRUE OR reply->>'status' IS DISTINCT FROM 'recorded'
    OR official_v3_jobs_private.exact_keys_v1(row_value,ARRAY['reference','text','outcome','audit']) IS NOT TRUE
    OR jsonb_typeof(row_value->'text') IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'm04 S1 proof unavailable' USING ERRCODE='P7604'; END IF;
  ref:=official_v3_jobs_private.reference_v1(row_value->'reference'); b:=ref->'binding'; raw:=(row_value->>'text')::json;
  IF official_v3_jobs_private.unique_json_v1(raw,0) IS NOT TRUE OR octet_length(row_value->>'text')<>(ref->>'bytes')::integer
    OR encode(sha256(convert_to(row_value->>'text','UTF8')),'hex')<>ref->>'proposalDigest' THEN RAISE EXCEPTION 'm04 S1 bytes mismatch' USING ERRCODE='P7604'; END IF;
  p:=raw::jsonb;
  IF official_v3_jobs_private.s1_shape_v1(p,'proposal') IS NOT TRUE OR official_v3_jobs_private.nodes_v1(p,0,16,8192)<0
    OR p->'operationId' IS DISTINCT FROM b->'operationId' OR p->'jobId' IS DISTINCT FROM b->'jobId'
    OR p->'contextKey' IS DISTINCT FROM b->'contextKey' OR p->'jobId' IS DISTINCT FROM job->'jobId'
    OR b->'method' IS DISTINCT FROM method THEN RAISE EXCEPTION 'm04 S1 binding mismatch' USING ERRCODE='P7604'; END IF;
  -- Semantically integral ORIGINAL numbers may be spelled 18.0 or 18e0.
  -- Normalize only the local identity DTO after full actual S1 shape validation;
  -- neither original bytes, their digest nor proposedFact are rewritten.
  p:=jsonb_set(jsonb_set(p,'{context}',official_v3_jobs_private.canonical_v1(p->'context',0)::jsonb),
    '{research}',official_v3_jobs_private.canonical_v1(p->'research',0)::jsonb);
  identity:=official_v3_jobs_private.subject_v1('rule_research',jsonb_build_object('context',p->'context','method',method,
    'factKind',p#>'{research,factKind}','researchReason',p#>'{research,researchReason}'));
  IF p->'contextKey' IS DISTINCT FROM identity->'contextKey' OR p->'research' IS DISTINCT FROM identity->'research' THEN RAISE EXCEPTION 'm04 S1 normal form mismatch' USING ERRCODE='P7604'; END IF;
  IF job->>'kind'='research_job_record' THEN
    IF p->'context' IS DISTINCT FROM job->'context' OR p->'contextKey' IS DISTINCT FROM job->'contextKey' OR p->'research' IS DISTINCT FROM job->'research' THEN RAISE EXCEPTION 'm04 S1 full Rule mismatch' USING ERRCODE='P7604'; END IF;
  ELSIF p#>'{context,scope,destinationCountryCode}' IS DISTINCT FROM job#>'{identity,destinationCountryCode}'
    OR p#>'{context,scope,citizenship,countryCodes,0}' IS DISTINCT FROM job#>'{identity,citizenshipCountryCode}' THEN RAISE EXCEPTION 'm04 S1 pair mismatch' USING ERRCODE='P7604'; END IF;
  outcome:=row_value->'outcome'; audit:=row_value->'audit';
  IF outcome='null'::jsonb AND audit='null'::jsonb THEN
    IF job->>'kind'='research_job_record' THEN RAISE EXCEPTION 'm04 Rule completion missing' USING ERRCODE='P7604'; END IF;
    RETURN;
  END IF;
  IF official_v3_jobs_private.s1_shape_v1(outcome,'outcome') IS NOT TRUE OR official_v3_jobs_private.s1_shape_v1(audit,'audit') IS NOT TRUE
    OR official_v3_jobs_private.exact_keys_v1(audit,ARRAY['schema','kind','operationId','proposalDigest','jobId','contextKey','method','recordedAt','result','decisionRef','escalationKey']) IS NOT TRUE
    OR audit->'schema' IS DISTINCT FROM '3'::jsonb OR audit->>'kind' IS DISTINCT FROM 'import_attempt_record'
    OR audit->'operationId' IS DISTINCT FROM b->'operationId' OR audit->'jobId' IS DISTINCT FROM b->'jobId'
    OR audit->'contextKey' IS DISTINCT FROM b->'contextKey' OR audit->'method' IS DISTINCT FROM method
    OR audit->'proposalDigest' IS DISTINCT FROM ref->'proposalDigest' OR audit->'result' IS DISTINCT FROM outcome->'status' THEN RAISE EXCEPTION 'm04 S1 outcome mismatch' USING ERRCODE='P7604'; END IF;
  PERFORM official_v3_jobs_private.timestamp_v1(audit->>'recordedAt');
  IF outcome->>'status'='prepared' THEN
    decision:=outcome#>'{value,decision}'; previous:=outcome#>'{value,previousDecision}'; archive:=outcome#>'{value,archiveAppend}';
    IF outcome#>'{value,proposalDigest}' IS DISTINCT FROM ref->'proposalDigest' OR outcome#>>'{value,acceptance}' IS DISTINCT FROM 'not_committed'
      OR outcome#>>'{value,reproof}' IS DISTINCT FROM 'required_before_commit'
      OR outcome#>'{value,transition,operationId}' IS DISTINCT FROM p->'operationId' OR outcome#>'{value,version,operationId}' IS DISTINCT FROM p->'operationId'
      OR outcome#>'{value,version,sourceDecisionRef}' IS DISTINCT FROM decision->'reference'
      OR outcome#>'{value,transition,sourceDecisionRef}' IS DISTINCT FROM decision->'reference' THEN RAISE EXCEPTION 'm04 S1 prepared mismatch' USING ERRCODE='P7604'; END IF;
  ELSIF outcome->>'status'='escalation' THEN
    decision:=outcome->'decision'; previous:=outcome->'previousDecision'; archive:=outcome->'archiveAppend'; expected_escalation:=outcome->>'key';
  ELSIF job->>'kind'='research_job_record' THEN RAISE EXCEPTION 'm04 Rule outcome not prepared' USING ERRCODE='P7604';
  END IF;
  IF decision IS NOT NULL THEN
    expected_ref:='source-decision:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object('operationId',p->'operationId',
      'proposalDigest',ref->'proposalDigest','contextKey',p->'contextKey','method',method,'predecessor',previous->'reference'),0),'UTF8')),'hex');
    IF decision->>'reference' IS DISTINCT FROM expected_ref OR decision->'predecessor' IS DISTINCT FROM COALESCE(previous->'reference','null'::jsonb)
      OR decision->'context' IS DISTINCT FROM p->'context' OR decision->'contextKey' IS DISTINCT FROM p->'contextKey'
      OR decision->'method' IS DISTINCT FROM method OR decision->'factKind' IS DISTINCT FROM p#>'{research,factKind}'
      OR (job->>'kind'='research_job_record' AND result->>'decisionRef' IS DISTINCT FROM expected_ref) THEN RAISE EXCEPTION 'm04 S1 decision mismatch' USING ERRCODE='P7604'; END IF;
    IF previous='null'::jsonb THEN
      IF decision->'predecessor' IS DISTINCT FROM 'null'::jsonb OR decision->'historyArchive' IS DISTINCT FROM 'null'::jsonb OR archive IS DISTINCT FROM 'null'::jsonb THEN
        RAISE EXCEPTION 'm04 initial decision history mismatch' USING ERRCODE='P7604'; END IF;
    ELSE
      IF previous->'contextKey' IS DISTINCT FROM p->'contextKey' OR previous->'factKind' IS DISTINCT FROM p#>'{research,factKind}'
        OR previous->>'evaluatedAt'>decision->>'evaluatedAt' OR decision->'predecessor' IS DISTINCT FROM previous->'reference' THEN
        RAISE EXCEPTION 'm04 S1 predecessor mismatch' USING ERRCODE='P7604'; END IF;
      -- A historical predecessor may have a different method revision. Compare its
      -- protected context/fact/link/conflict chain, never invent a same-method rule.
      FOR conflict IN SELECT value FROM jsonb_array_elements(previous->'knownConflicts') LOOP
        SELECT value INTO retained FROM jsonb_array_elements(decision->'knownConflicts') WHERE value->'reference'=conflict->'reference';
        IF NOT FOUND THEN
          IF conflict->'resolution'='null'::jsonb THEN RAISE EXCEPTION 'm04 unresolved history removal' USING ERRCODE='P7604'; END IF;
          removed:=removed||jsonb_build_array(conflict);
        ELSIF (conflict-'resolution') IS DISTINCT FROM (retained-'resolution')
          OR (conflict->'resolution'<>'null'::jsonb AND conflict->'resolution' IS DISTINCT FROM retained->'resolution'
            AND (retained->'resolution'='null'::jsonb OR retained#>'{resolution,predecessor}' IS DISTINCT FROM conflict#>'{resolution,reference}'
              OR retained#>'{resolution,reference}'=conflict#>'{resolution,reference}' OR retained#>>'{resolution,resolvedAt}'<conflict#>>'{resolution,resolvedAt}')) THEN
          RAISE EXCEPTION 'm04 conflict predecessor mismatch' USING ERRCODE='P7604';
        END IF;
      END LOOP;
      IF archive='null'::jsonb THEN
        IF jsonb_array_length(removed)<>0 OR decision->'historyArchive' IS DISTINCT FROM previous->'historyArchive' THEN RAISE EXCEPTION 'm04 missing archive link' USING ERRCODE='P7604'; END IF;
      ELSE
        IF archive->'contextKey' IS DISTINCT FROM p->'contextKey' OR archive->'factKind' IS DISTINCT FROM p#>'{research,factKind}'
          OR archive->'fromDecisionRef' IS DISTINCT FROM previous->'reference' OR archive->'head' IS DISTINCT FROM decision->'historyArchive'
          OR archive->'predecessor' IS DISTINCT FROM previous->'historyArchive'
          OR archive->>'archivedAt'<previous->>'evaluatedAt' OR archive->>'archivedAt'>decision->>'evaluatedAt'
          OR archive#>'{head,reference}'=archive#>'{predecessor,reference}'
          OR (archive#>>'{head,revision}')::integer<>COALESCE((archive#>>'{predecessor,revision}')::integer,0)+1
          OR (archive#>>'{head,totalConflicts}')::integer<>COALESCE((archive#>>'{predecessor,totalConflicts}')::integer,0)+jsonb_array_length(archive->'entries')
          OR jsonb_array_length(archive->'entries')<>jsonb_array_length(removed)
          OR (SELECT count(DISTINCT value->>'reference') FROM jsonb_array_elements(archive->'entries'))<>jsonb_array_length(removed) THEN
          RAISE EXCEPTION 'm04 S1 archive mismatch' USING ERRCODE='P7604'; END IF;
        FOR entry_value IN SELECT value FROM jsonb_array_elements(archive->'entries') LOOP
          IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(removed) WHERE value=entry_value)
            OR entry_value#>'{primary,contextKey}' IS DISTINCT FROM p->'contextKey' OR entry_value#>'{primary,fact,fact,kind}' IS DISTINCT FROM p#>'{research,factKind}'
            OR entry_value->'resolution'='null'::jsonb OR entry_value#>>'{resolution,resolvedAt}'>archive->>'archivedAt' THEN
            RAISE EXCEPTION 'm04 archived entry mismatch' USING ERRCODE='P7604'; END IF;
        END LOOP;
      END IF;
    END IF;
    IF outcome->>'status'='escalation' THEN
      SELECT 'source-escalation:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object(
        'contextKey',decision->'contextKey','factKind',decision->'factKind','method',decision->'method','reason',decision->'conclusion',
        'conflicts',COALESCE(jsonb_agg(value->>'reference' ORDER BY value->>'reference' COLLATE "C"),'[]'::jsonb)),0),'UTF8')),'hex') INTO expected_escalation
        FROM jsonb_array_elements(decision->'knownConflicts') WHERE value->'resolution'='null'::jsonb;
      IF outcome->>'key' IS DISTINCT FROM expected_escalation OR outcome->'reason' IS DISTINCT FROM decision->'conclusion' THEN RAISE EXCEPTION 'm04 escalation mismatch' USING ERRCODE='P7604'; END IF;
    END IF;
  END IF;
  IF audit->>'decisionRef' IS DISTINCT FROM decision->>'reference' OR audit->>'escalationKey' IS DISTINCT FROM expected_escalation THEN RAISE EXCEPTION 'm04 S1 audit mismatch' USING ERRCODE='P7604'; END IF;
END $$;

CREATE FUNCTION official_v3_jobs_private.assert_history_v1(k text) RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; x record; c jsonb; e jsonb; unresolved text[]; ops integer; starts integer; credit jsonb;
BEGIN
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=k;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT count(*) INTO ops FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k;
  SELECT count(*),array_agg(t.attempt_key ORDER BY t.attempt_key) FILTER(WHERE d.attempt_key IS NULL) INTO starts,unresolved
    FROM official_v3_jobs_private.execution_starts_v1 t LEFT JOIN official_v3_jobs_private.execution_dispositions_v1 d USING(attempt_key) WHERE t.job_key=k;
  IF ops<>s.operation_count OR starts<>s.start_count OR ops>256 OR starts>64 OR cardinality(unresolved)>1
    OR s.open_attempt IS DISTINCT FROM unresolved[1] THEN RAISE EXCEPTION 'm04 history invariant' USING ERRCODE='P7603'; END IF;
  PERFORM official_v3_jobs_private.job_v1(s.current_job);
  FOR x IN SELECT * FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k LOOP
    c:=official_v3_jobs_private.command_v1(x.command_text::jsonb); e:=x.envelope_text::jsonb;
    IF c->>'commandText'<>x.command_text OR c->>'commandKey'<>x.command_key OR c->>'operationId'<>x.operation_id OR c->>'jobKey'<>k
      OR official_v3_jobs_private.canonical_v1(e,0)<>x.envelope_text OR e#>>'{audit,reference}'<>x.audit_reference THEN RAISE EXCEPTION 'm04 journal invariant' USING ERRCODE='P7603'; END IF;
    PERFORM official_v3_jobs_private.transition_v1(c->'value',e->'expected',e);
  END LOOP;
  FOR x IN SELECT t.*,q.command_text,q.envelope_text,d.kind AS disposition_kind,d.queue_operation_id,r.result
      FROM official_v3_jobs_private.execution_starts_v1 t JOIN official_v3_jobs_private.queue_operations_v1 q ON q.operation_id=t.claim_operation_id
      LEFT JOIN official_v3_jobs_private.execution_dispositions_v1 d USING(attempt_key)
      LEFT JOIN official_v3_jobs_private.execution_results_v1 r USING(attempt_key) WHERE t.job_key=k LOOP
    IF x.command_text::jsonb->>'action'<>'claim' OR x.command_text::jsonb->'input' IS DISTINCT FROM x.claim_text::jsonb
      OR x.envelope_text::jsonb->'next' IS DISTINCT FROM x.leased_job OR x.leased_job->>'state'<>'leased'
      OR x.claim_text IS DISTINCT FROM official_v3_jobs_private.canonical_v1(x.claim_text::jsonb,0)
      OR (x.authority-'epoch') IS DISTINCT FROM s.method_binding OR (x.authority->>'epoch' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE
      OR x.attempt_key IS DISTINCT FROM 'execution-attempt:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object(
        'subject',s.subject_text::jsonb,'claim',x.claim_text::jsonb,'leasedJob',x.leased_job,'authority',x.authority),0),'UTF8')),'hex')
      OR (x.disposition_kind='completed' AND x.result IS NULL) OR (x.disposition_kind='settled_failure' AND x.result IS NOT NULL) THEN RAISE EXCEPTION 'm04 attempt invariant' USING ERRCODE='P7603'; END IF;
    IF x.disposition_kind IS NOT NULL AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id=x.queue_operation_id AND q.job_key=k
      AND q.action=CASE WHEN x.disposition_kind='completed' THEN 'complete' ELSE 'fail' END
      AND q.envelope_text::jsonb->'expected'=x.leased_job) THEN RAISE EXCEPTION 'm04 disposition invariant' USING ERRCODE='P7603'; END IF;
  END LOOP;
  IF s.current_job->>'state'='leased' THEN
    SELECT envelope_text::jsonb->'next' INTO credit FROM official_v3_jobs_private.queue_operations_v1
      WHERE operation_id=s.terminal_credit_claim AND job_key=k AND action='claim';
    IF credit IS DISTINCT FROM s.current_job THEN RAISE EXCEPTION 'm04 terminal credit invariant' USING ERRCODE='P7603'; END IF;
  ELSIF s.terminal_credit_claim IS NOT NULL THEN RAISE EXCEPTION 'm04 terminal credit invariant' USING ERRCODE='P7603'; END IF;
  IF NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.slots_v1 WHERE slot_id=s.slot_id AND job_key=k) THEN RAISE EXCEPTION 'm04 slot_id invariant' USING ERRCODE='P7603'; END IF;
END $$;

CREATE FUNCTION official_v3_jobs_private.assert_catalog_v1() RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE binding_row record; actual jsonb; n integer;
BEGIN
  SELECT count(*) INTO n FROM official_v3_jobs_private.catalog_binding_v1;
  IF n NOT BETWEEN 11 AND 32 THEN RAISE EXCEPTION 'm04 catalog invariant' USING ERRCODE='P7603'; END IF;
  FOR binding_row IN SELECT * FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity LIKE 'fn:%' LOOP
    SELECT jsonb_build_object('oid',p.oid,'owner',p.proowner,'acl',p.proacl,'config',p.proconfig,'definer',p.prosecdef,
      'volatility',p.provolatile,'parallel',p.proparallel,'strict',p.proisstrict,'defaults',p.pronargdefaults,
      'definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) INTO actual FROM pg_proc p WHERE p.oid=(binding_row.fingerprint->>'oid')::oid;
    IF actual IS DISTINCT FROM binding_row.fingerprint THEN RAISE EXCEPTION 'm04 predecessor drift' USING ERRCODE='P7603'; END IF;
  END LOOP;
  SELECT jsonb_agg(jsonb_build_object('oid',p.oid,'name',p.proname,'signature',pg_get_function_identity_arguments(p.oid),
    'owner',p.proowner,'acl',p.proacl,'definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid)
    INTO actual FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace WHERE ns.nspname IN ('official_v3_jobs_private','official_v3_jobs_api');
  IF jsonb_array_length(actual)<>29 OR actual IS DISTINCT FROM (SELECT fingerprint FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='companion-functions') THEN RAISE EXCEPTION 'm04 function drift' USING ERRCODE='P7603'; END IF;
  SELECT (SELECT jsonb_agg(jsonb_build_object('name',c.relname,'oid',c.oid,'kind',c.relkind,'owner',c.relowner,'acl',c.relacl,'rls',c.relrowsecurity,'force',c.relforcerowsecurity,
 'columns',(SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',a.atttypid,'null',a.attnotnull,'acl',a.attacl,'generated',a.attgenerated,'identity',a.attidentity) ORDER BY a.attnum) FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped),
 'constraints',(SELECT jsonb_agg(jsonb_build_object('name',x.conname,'definition',pg_get_constraintdef(x.oid,false),'deferred',x.condeferrable,'initial',x.condeferred,'valid',x.convalidated) ORDER BY x.conname) FROM pg_constraint x WHERE x.conrelid=c.oid),
 'indexes',(SELECT jsonb_agg(jsonb_build_object('name',ci.relname,'definition',pg_get_indexdef(x.indexrelid),'valid',x.indisvalid,'ready',x.indisready) ORDER BY ci.relname) FROM pg_index x JOIN pg_class ci ON ci.oid=x.indexrelid WHERE x.indrelid=c.oid),
 'policies',(SELECT jsonb_agg(jsonb_build_object('name',x.polname,'roles',x.polroles,'command',x.polcmd,'permissive',x.polpermissive,'using',pg_get_expr(x.polqual,x.polrelid),'check',pg_get_expr(x.polwithcheck,x.polrelid)) ORDER BY x.polname) FROM pg_policy x WHERE x.polrelid=c.oid),
 'triggers',(SELECT jsonb_agg(jsonb_build_object('name',x.tgname,'type',x.tgtype,'function',x.tgfoid,'enabled',x.tgenabled,'internal',x.tgisinternal,'constraint',x.tgconstraint,'deferred',x.tgdeferrable,'initial',x.tginitdeferred,'qual',pg_get_expr(x.tgqual,x.tgrelid)) ORDER BY x.tgname) FROM pg_trigger x WHERE x.tgrelid=c.oid)) ORDER BY c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='official_v3_jobs_private' AND c.relkind='r') INTO actual;
  IF actual IS DISTINCT FROM (SELECT fingerprint FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='companion-tables') THEN RAISE EXCEPTION 'm04 catalog structural drift' USING ERRCODE='P7603'; END IF;
  SELECT (SELECT jsonb_agg(jsonb_build_object('name',n.nspname,'oid',n.oid,'owner',n.nspowner,'acl',n.nspacl) ORDER BY n.nspname) FROM pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')) INTO actual;
  IF actual IS DISTINCT FROM (SELECT fingerprint FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='companion-schemas') THEN RAISE EXCEPTION 'm04 catalog structural drift' USING ERRCODE='P7603'; END IF;
  SELECT (SELECT jsonb_agg(jsonb_build_object('name',r.rolname,'oid',r.oid,'super',r.rolsuper,'inherit',r.rolinherit,'login',r.rolcanlogin,'create_role',r.rolcreaterole,'create_db',r.rolcreatedb,'replicate',r.rolreplication,'bypass',r.rolbypassrls,'config',r.rolconfig,
 'memberships',(SELECT jsonb_agg(jsonb_build_object('role',m.roleid,'member',m.member,'grantor',m.grantor,'admin',m.admin_option,'inherit',m.inherit_option,'set',m.set_option) ORDER BY m.roleid,m.member,m.grantor) FROM pg_auth_members m WHERE m.member=r.oid OR (r.rolname<>'ot_v3_jobs_caller' AND m.roleid=r.oid))) ORDER BY r.rolname) FROM pg_roles r WHERE r.rolname IN ('postgres','ot_v3_intake_owner','ot_v3_jobs_caller') OR r.oid=COALESCE((SELECT (fingerprint->>'installer')::oid FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='creator-defaults'),current_user::regrole::oid)) INTO actual;
  IF actual IS DISTINCT FROM (SELECT fingerprint FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='role-flags') THEN RAISE EXCEPTION 'm04 catalog structural drift' USING ERRCODE='P7603'; END IF;
  SELECT (SELECT jsonb_agg(jsonb_build_object('object',d.objid,'ref',d.refobjid,'type',d.deptype,'sub',d.objsubid,'refsub',d.refobjsubid) ORDER BY d.objid,d.refobjid,d.deptype,d.objsubid,d.refobjsubid) FROM pg_depend d JOIN pg_proc p ON p.oid=d.objid JOIN pg_namespace n ON n.oid=p.pronamespace WHERE d.classid='pg_proc'::regclass AND d.refclassid='pg_proc'::regclass AND n.nspname='official_v3_jobs_private' AND p.proname IN ('s1_read_v1','s1_shape_v1','ma1_require_v1')) INTO actual;
  IF actual IS DISTINCT FROM (SELECT fingerprint FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='parsed-dependencies') THEN RAISE EXCEPTION 'm04 catalog structural drift' USING ERRCODE='P7603'; END IF;
  SELECT jsonb_agg(jsonb_build_object('role',d.defaclrole,'schema',d.defaclnamespace,'type',d.defaclobjtype,'acl',d.defaclacl) ORDER BY d.defaclrole,d.defaclnamespace,d.defaclobjtype) INTO actual
    FROM pg_default_acl d WHERE d.defaclrole IN ('postgres'::regrole,'ot_v3_intake_owner'::regrole,(SELECT (fingerprint->>'installer')::oid FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='creator-defaults'));
  IF actual IS DISTINCT FROM (SELECT fingerprint->'entries' FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='creator-defaults') THEN RAISE EXCEPTION 'm04 creator defaults drift' USING ERRCODE='P7603'; END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='ot_v3_jobs_caller' AND (rolcanlogin OR rolinherit OR rolsuper OR rolbypassrls OR rolcreaterole OR rolcreatedb OR rolreplication OR rolconfig IS NOT NULL))
    OR EXISTS(SELECT 1 FROM pg_auth_members WHERE member='ot_v3_jobs_caller'::regrole)
    OR (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='official_v3_jobs_private' AND c.relkind='r')<>7
    OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='official_v3_jobs_private' AND c.relkind='r'
      AND (c.relowner<>'postgres'::regrole OR NOT c.relrowsecurity OR NOT c.relforcerowsecurity))
    OR has_schema_privilege('ot_v3_jobs_caller','official_v3_jobs_private','USAGE')
    OR has_schema_privilege('ot_v3_intake_owner','official_v3_jobs_private','CREATE') THEN RAISE EXCEPTION 'm04 role or table drift' USING ERRCODE='P7603'; END IF;
END $$;

-- The API owns relation/advisory/subject locks and all-history admission. Helpers
-- stage immediate effects and return only this private bundle; final S1/MA1 is later.
CREATE FUNCTION official_v3_jobs_private.tx_queue_read_v1(q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE;
BEGIN
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=q#>>'{body,jobKey}';
  IF NOT FOUND THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','absent'),'authority',false); END IF;
  RETURN jsonb_build_object('reply',jsonb_build_object('status','present','record',s.current_job),'authority',true);
END $$;
CREATE FUNCTION official_v3_jobs_private.tx_queue_confirm_v1(q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE c jsonb:=official_v3_jobs_private.command_v1(q#>'{body,command}'); o official_v3_jobs_private.queue_operations_v1%ROWTYPE;
BEGIN
  SELECT * INTO o FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=c->>'operationId';
  IF NOT FOUND THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','not_attempted'),'authority',false); END IF;
  IF o.command_text IS DISTINCT FROM c->>'commandText' OR o.command_key IS DISTINCT FROM c->>'commandKey' OR o.job_key IS DISTINCT FROM c->>'jobKey' THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','collision'),'authority',false); END IF;
  RETURN jsonb_build_object('reply',jsonb_build_object('status','committed','operationId',o.operation_id,'commandKey',o.command_key,
    'commandText',o.command_text,'envelopeText',o.envelope_text,'record',o.envelope_text::jsonb->'next'),'authority',true);
END $$;
CREATE FUNCTION official_v3_jobs_private.tx_execution_read_v1(q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE claim jsonb:=q#>'{body,claim}'; s official_v3_jobs_private.subjects_v1%ROWTYPE; t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  r official_v3_jobs_private.execution_results_v1%ROWTYPE; d official_v3_jobs_private.execution_dispositions_v1%ROWTYPE; c jsonb; response jsonb; lease text;
BEGIN
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=claim->>'jobKey';
  SELECT * INTO t FROM official_v3_jobs_private.execution_starts_v1 WHERE claim_operation_id=claim->>'operationId';
  IF NOT FOUND THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','absent'),'authority',false); END IF;
  IF t.claim_text IS DISTINCT FROM official_v3_jobs_private.canonical_v1(claim,0) OR t.job_key IS DISTINCT FROM s.job_key THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','collision'),'authority',false); END IF;
  SELECT * INTO r FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=t.attempt_key;
  IF NOT FOUND THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  SELECT * INTO d FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key;
  IF d.attempt_key IS NULL THEN
    IF s.current_job IS DISTINCT FROM t.leased_job OR s.open_attempt IS DISTINCT FROM t.attempt_key THEN
      RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
    response:=jsonb_build_object('status','prepared','attemptKey',t.attempt_key,'claim',claim,'leasedJob',t.leased_job,'result',r.result,'references',r."references");
    lease:=t.leased_job#>>'{lease,expiresAt}';
  ELSIF d.kind='completed' THEN
    SELECT envelope_text::jsonb INTO c FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=d.queue_operation_id;
    IF c->'expected' IS DISTINCT FROM t.leased_job OR c->'next' IS DISTINCT FROM s.current_job OR s.current_job->>'state'<>'succeeded'
      OR s.current_job->'jobId' IS DISTINCT FROM t.leased_job->'jobId' THEN
      RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
    response:=jsonb_build_object('status','completed','attemptKey',t.attempt_key,'claim',claim,'leasedJob',t.leased_job,
      'job',s.current_job,'result',r.result,'references',r."references");
  ELSE RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  IF q->>'phase'='authorized' AND t.authority IS DISTINCT FROM (b||jsonb_build_object('epoch',e)) THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  RETURN jsonb_build_object('reply',response,'authority',true,'references',r."references",'job',t.leased_job,'result',r.result,'lease',lease);
END $$;
CREATE FUNCTION official_v3_jobs_private.tx_execution_start_v1(q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE i jsonb:=q->'body'; claim jsonb:=i->'claim'; job jsonb:=official_v3_jobs_private.job_v1(i->'leasedJob');
  s official_v3_jobs_private.subjects_v1%ROWTYPE; o official_v3_jobs_private.queue_operations_v1%ROWTYPE; a jsonb:=b||jsonb_build_object('epoch',e);
  attempt text; token text;
BEGIN
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=claim->>'jobKey';
  IF NOT FOUND OR s.open_attempt IS NOT NULL OR s.current_job IS DISTINCT FROM job OR s.subject_text IS DISTINCT FROM i->>'subjectText'
    OR job->>'state'<>'leased' OR s.terminal_credit_claim IS DISTINCT FROM claim->>'operationId' THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  SELECT * INTO o FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=claim->>'operationId';
  IF NOT FOUND OR o.job_key IS DISTINCT FROM s.job_key OR o.action<>'claim' OR o.command_text::jsonb->'input' IS DISTINCT FROM claim
    OR o.envelope_text::jsonb->'next' IS DISTINCT FROM job OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_starts_v1 WHERE claim_operation_id=o.operation_id) THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  IF s.start_count>=64 OR s.operation_count>=256 OR s.operation_count+1>256 THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','quota'),'authority',false); END IF;
  attempt:='execution-attempt:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object(
    'subject',s.subject_text::jsonb,'claim',claim,'leasedJob',job,'authority',a),0),'UTF8')),'hex');
  token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  INSERT INTO official_v3_jobs_private.execution_starts_v1(attempt_key,job_key,claim_operation_id,claim_text,leased_job,authority,token_hash,reserved_at)
    VALUES(attempt,s.job_key,o.operation_id,official_v3_jobs_private.canonical_v1(claim,0),job,a,encode(sha256(convert_to(token,'UTF8')),'hex'),clock_timestamp());
  UPDATE official_v3_jobs_private.subjects_v1 SET start_count=start_count+1,open_attempt=attempt WHERE job_key=s.job_key;
  RETURN jsonb_build_object('reply',jsonb_build_object('status','reserved','attemptKey',attempt,'token',token,'claim',claim,'leasedJob',job),
    'authority',true,'lease',job#>>'{lease,expiresAt}');
END $$;
CREATE FUNCTION official_v3_jobs_private.tx_execution_prepare_v1(q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE i jsonb:=q->'body'; t official_v3_jobs_private.execution_starts_v1%ROWTYPE; s official_v3_jobs_private.subjects_v1%ROWTYPE;
  old official_v3_jobs_private.execution_results_v1%ROWTYPE; r jsonb:=i->'result'; refs jsonb:=i->'references'; ref jsonb; opids text[]:='{}'; digests text[]:='{}';
  total integer:=0; previous_op text; expected_ref text; fence jsonb; prepared timestamptz; kind text;
BEGIN
  SELECT * INTO t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=i->>'attemptKey';
  IF NOT FOUND OR t.claim_text IS DISTINCT FROM official_v3_jobs_private.canonical_v1(i->'claim',0)
    OR t.token_hash IS DISTINCT FROM encode(sha256(convert_to(i->>'token','UTF8')),'hex')
    OR t.authority IS DISTINCT FROM (b||jsonb_build_object('epoch',e)) THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=t.job_key;
  IF s.open_attempt IS DISTINCT FROM t.attempt_key OR s.current_job IS DISTINCT FROM t.leased_job
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key) THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  kind:=CASE WHEN t.leased_job->>'kind'='research_job_record' THEN 'rule_research' ELSE 'combination_discovery' END;
  IF official_v3_jobs_private.exact_keys_v1(r,ARRAY['kind','jobId','operationId','jobKey','preparedAt']||CASE WHEN kind='rule_research' THEN ARRAY['decisionRef'] ELSE ARRAY['discoveryRef','proposalDigests'] END) IS NOT TRUE
    OR r->>'kind' IS DISTINCT FROM kind OR r->'jobId' IS DISTINCT FROM t.leased_job->'jobId' OR r->'operationId' IS DISTINCT FROM t.leased_job->'operationId'
    OR r->>'jobKey' IS DISTINCT FROM t.job_key OR octet_length(official_v3_jobs_private.canonical_v1(r,0))>65536
    OR jsonb_typeof(refs) IS DISTINCT FROM 'array' OR jsonb_array_length(refs) NOT BETWEEN 1 AND 16
    OR (kind='rule_research' AND jsonb_array_length(refs)<>1) OR octet_length(official_v3_jobs_private.canonical_v1(refs,0))>65536 THEN
    RAISE EXCEPTION 'm04 invalid prepared result' USING ERRCODE='P7601'; END IF;
  prepared:=official_v3_jobs_private.timestamp_v1(r->>'preparedAt');
  IF prepared<official_v3_jobs_private.timestamp_v1(t.leased_job->>'createdAt') OR prepared>clock_timestamp() THEN RAISE EXCEPTION 'm04 invalid prepared time' USING ERRCODE='P7601'; END IF;
  FOR ref IN SELECT value FROM jsonb_array_elements(refs) LOOP
    PERFORM official_v3_jobs_private.reference_v1(ref);
    IF ref#>'{binding,jobId}' IS DISTINCT FROM t.leased_job->'jobId' OR ref#>'{binding,method}' IS DISTINCT FROM (b-'methodDigest'-'packageDigest')
      OR ref#>>'{binding,operationId}'=ANY(opids) OR ref->>'proposalDigest'=ANY(digests)
      OR (previous_op IS NOT NULL AND (ref#>>'{binding,operationId}') COLLATE "C"<=previous_op COLLATE "C")
      OR (kind='rule_research' AND ref#>'{binding,contextKey}' IS DISTINCT FROM t.leased_job->'contextKey') THEN RAISE EXCEPTION 'm04 prepared binding mismatch' USING ERRCODE='P7601'; END IF;
    previous_op:=ref#>>'{binding,operationId}'; opids:=array_append(opids,previous_op); digests:=array_append(digests,ref->>'proposalDigest'); total:=total+(ref->>'bytes')::integer;
  END LOOP;
  IF total>1048576 THEN RAISE EXCEPTION 'm04 prepared byte bound' USING ERRCODE='P7601'; END IF;
  IF kind='rule_research' THEN
    IF (r->>'decisionRef' ~ '^source-decision:v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 decision reference' USING ERRCODE='P7601'; END IF;
  ELSE
    SELECT array_agg(v ORDER BY v COLLATE "C") INTO digests FROM unnest(digests) v;
    fence:=jsonb_build_object('jobId',t.leased_job->'jobId','revision',t.leased_job->'revision','leaseId',t.leased_job#>'{lease,leaseId}','generation',t.leased_job#>'{lease,generation}');
    expected_ref:='combination-discovery-result:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object('jobId',r->'jobId',
      'operationId',r->'operationId','jobKey',t.job_key,'claim',i->'claim','fence',fence,'proposalDigests',to_jsonb(digests)),0),'UTF8')),'hex');
    IF r->'proposalDigests' IS DISTINCT FROM to_jsonb(digests) OR r->>'discoveryRef' IS DISTINCT FROM expected_ref THEN RAISE EXCEPTION 'm04 discovery reference' USING ERRCODE='P7601'; END IF;
  END IF;
  SELECT * INTO old FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=t.attempt_key;
  IF FOUND THEN
    IF old.result IS DISTINCT FROM r OR old."references" IS DISTINCT FROM refs THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','collision'),'authority',false); END IF;
  ELSE
    INSERT INTO official_v3_jobs_private.execution_results_v1(attempt_key,result,"references",prepared_at) VALUES(t.attempt_key,r,refs,prepared);
  END IF;
  RETURN jsonb_build_object('reply',jsonb_build_object('status','prepared','attemptKey',t.attempt_key,'result',r,'references',refs),
    'authority',true,'references',refs,'job',t.leased_job,'result',r,'lease',t.leased_job#>>'{lease,expiresAt}');
END $$;
CREATE FUNCTION official_v3_jobs_private.tx_queue_cas_v1(q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE i jsonb:=q->'body'; c jsonb:=official_v3_jobs_private.command_v1(i->'command'); v jsonb:=i->'commit'; disposition jsonb:=i->'disposition';
  s official_v3_jobs_private.subjects_v1%ROWTYPE; old official_v3_jobs_private.queue_operations_v1%ROWTYPE; t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  r official_v3_jobs_private.execution_results_v1%ROWTYPE; identity jsonb; current_record jsonb; next_record jsonb; new_credit text; slot_choice integer; cycle text;
  a jsonb:=b||jsonb_build_object('epoch',e); terminal boolean:=false;
BEGIN
  SELECT * INTO old FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=c->>'operationId';
  IF FOUND THEN
    IF old.command_text IS DISTINCT FROM c->>'commandText' OR old.command_key IS DISTINCT FROM c->>'commandKey'
      OR old.envelope_text IS DISTINCT FROM official_v3_jobs_private.canonical_v1(v,0) THEN
      RETURN jsonb_build_object('reply',jsonb_build_object('status','collision'),'authority',false); END IF;
    RETURN jsonb_build_object('reply',jsonb_build_object('status','committed','record',old.envelope_text::jsonb->'next'),'authority',true);
  END IF;
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=c->>'jobKey';
  current_record:=COALESCE(s.current_job,'null'::jsonb);
  IF v->'expected' IS DISTINCT FROM current_record THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','mismatch'),'authority',false); END IF;
  PERFORM official_v3_jobs_private.transition_v1(c->'value',current_record,v);
  next_record:=v->'next';
  identity:=CASE WHEN next_record->>'kind'='research_job_record' THEN official_v3_jobs_private.subject_v1('rule_research',jsonb_build_object(
    'context',next_record->'context','method',next_record->'method','factKind',next_record#>'{research,factKind}','researchReason',next_record#>'{research,researchReason}'))
    ELSE official_v3_jobs_private.subject_v1('combination_discovery',(next_record->'identity')-'kind'-'jobKey') END;
  IF identity->>'jobKey' IS DISTINCT FROM c->>'jobKey' OR identity->>'subjectText' IS DISTINCT FROM i->>'subjectText'
    OR COALESCE(next_record->'method',next_record#>'{identity,method}') IS DISTINCT FROM (b-'methodDigest'-'packageDigest')
    OR (s.job_key IS NOT NULL AND (s.subject_text IS DISTINCT FROM i->>'subjectText' OR s.method_binding IS DISTINCT FROM b)) THEN
    RAISE EXCEPTION 'm04 full subject mismatch' USING ERRCODE='P7601'; END IF;
  IF c->>'action'='enqueue' AND v#>>'{audit,kind}'='enqueued' THEN
    cycle:=next_record->>'jobId';
    IF EXISTS(SELECT 1 FROM official_v3_jobs_private.queue_operations_v1 WHERE new_cycle_job_id=cycle) THEN
      RETURN jsonb_build_object('reply',jsonb_build_object('status','collision'),'authority',false); END IF;
  END IF;
  IF disposition->>'kind'<>'regular' THEN
    SELECT * INTO t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=disposition->>'attemptKey';
    IF NOT FOUND OR s.open_attempt IS DISTINCT FROM t.attempt_key OR t.job_key IS DISTINCT FROM s.job_key
      OR current_record IS DISTINCT FROM t.leased_job OR t.authority IS DISTINCT FROM a
      OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key) THEN
      RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
    SELECT * INTO r FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=t.attempt_key;
    IF disposition->>'kind'='completed' THEN
      IF c->>'action'<>'complete' OR r.attempt_key IS NULL OR COALESCE(c#>'{value,input,decisionRef}',c#>'{value,input,discoveryRef}')
        IS DISTINCT FROM COALESCE(r.result->'decisionRef',r.result->'discoveryRef') THEN
        RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
    ELSE
      -- SQL proves its immutable reservation secret and absence of PREPARED. It cannot
      -- observe producer termination. Only the reviewed private composition may call
      -- this fixed runtime role after actual delivery/callback/native terminal custody.
      IF c->>'action'<>'fail' OR c#>>'{value,input,reason}' NOT IN ('unreachable','invalid_proposal','verification_unavailable')
        OR r.attempt_key IS NOT NULL OR t.token_hash IS DISTINCT FROM encode(sha256(convert_to(disposition->>'token','UTF8')),'hex') THEN
        RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
    END IF;
    terminal:=true;
  ELSIF s.open_attempt IS NOT NULL OR c->>'action'='complete' THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false);
  END IF;
  new_credit:=CASE WHEN next_record->>'state'='leased' THEN
    CASE WHEN c->>'action'='claim' THEN c->>'operationId' ELSE s.terminal_credit_claim END ELSE NULL END;
  IF COALESCE(s.operation_count,0)+1+(CASE WHEN new_credit IS NULL THEN 0 ELSE 1 END)>256
    OR (c->>'action'='claim' AND next_record->>'state'='leased' AND s.start_count>=64) THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','quota'),'authority',false); END IF;
  IF s.job_key IS NULL THEN
    IF c->>'action'<>'enqueue' THEN RAISE EXCEPTION 'm04 missing subject' USING ERRCODE='P7601'; END IF;
    SELECT slot_id INTO slot_choice FROM official_v3_jobs_private.slots_v1 WHERE job_key IS NULL ORDER BY slot_id FOR UPDATE SKIP LOCKED LIMIT 1;
    IF slot_choice IS NULL THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','quota'),'authority',false); END IF;
    UPDATE official_v3_jobs_private.slots_v1 SET job_key=c->>'jobKey' WHERE slot_id=slot_choice;
    INSERT INTO official_v3_jobs_private.subjects_v1(job_key,slot_id,kind,subject_text,method_binding,current_job,operation_count,start_count)
      VALUES(c->>'jobKey',slot_choice,c->>'kind',i->>'subjectText',b,next_record,0,0);
  END IF;
  INSERT INTO official_v3_jobs_private.queue_operations_v1(operation_id,job_key,action,command_key,command_text,envelope_text,audit_reference,new_cycle_job_id,authority,recorded_at)
    VALUES(c->>'operationId',c->>'jobKey',c->>'action',c->>'commandKey',c->>'commandText',official_v3_jobs_private.canonical_v1(v,0),v#>>'{audit,reference}',cycle,a,clock_timestamp());
  IF terminal THEN
    INSERT INTO official_v3_jobs_private.execution_dispositions_v1(attempt_key,queue_operation_id,kind,failure_reason,settled_at)
      VALUES(t.attempt_key,c->>'operationId',disposition->>'kind',CASE WHEN disposition->>'kind'='settled_failure' THEN c#>>'{value,input,reason}' END,clock_timestamp());
  END IF;
  UPDATE official_v3_jobs_private.subjects_v1 SET current_job=next_record,operation_count=operation_count+1,
    open_attempt=CASE WHEN terminal THEN NULL ELSE open_attempt END,terminal_credit_claim=new_credit WHERE job_key=c->>'jobKey';
  RETURN jsonb_build_object('reply',jsonb_build_object('status','committed','record',next_record),'authority',true,
    'references',r."references",'job',t.leased_job,'result',r.result,
    'lease',CASE WHEN c->>'action' IN ('complete','fail') THEN current_record#>>'{lease,expiresAt}'
      WHEN c->>'action'='claim' AND next_record->>'state'='leased' THEN next_record#>>'{lease,expiresAt}' END,
    'observedAt',v#>>'{audit,observedAt}',
    'dueAt',CASE WHEN c->>'action'='claim' THEN CASE current_record->>'state' WHEN 'backoff' THEN current_record->>'nextAttemptAt' WHEN 'leased' THEN current_record#>>'{lease,expiresAt}' END END);
END $$;

CREATE FUNCTION official_v3_jobs_api.execute_v1(wire text,method_id text,revision integer,method_digest text,package_digest text,epoch integer,remaining_ms integer,absolute_not_after text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE deadline timestamptz; entry timestamptz:=statement_timestamp(); q jsonb; i jsonb; operation text; phase text; b jsonb; c jsonb; claim jsonb;
  k text; lock_names text[]; lock_value bigint; relation text; next_identity jsonb; attempt text;
  s official_v3_jobs_private.subjects_v1%ROWTYPE; t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  r official_v3_jobs_private.execution_results_v1%ROWTYPE; continuation jsonb; eligible boolean:=false; bundle jsonb; ref jsonb; opened jsonb; raw_reply jsonb;
BEGIN
  -- Anchor BEFORE any relation/advisory/row wait. Acquisitions cannot restart it.
  IF remaining_ms IS NULL OR remaining_ms NOT BETWEEN 1 AND 5000 OR absolute_not_after IS NULL THEN RAISE EXCEPTION 'm04 invalid budget' USING ERRCODE='P7601'; END IF;
  deadline:=least(entry+remaining_ms*interval '1 millisecond',official_v3_jobs_private.timestamp_v1(absolute_not_after));
  IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired budget' USING ERRCODE='P7605'; END IF;
  q:=official_v3_jobs_private.wire_v1(wire); i:=q->'body'; operation:=q->>'operation'; phase:=q->>'phase';
  IF official_v3_method_private.tuple_valid_v1(method_id,revision,method_digest,package_digest) IS NOT TRUE
    OR (phase='probe' AND (epoch IS NOT NULL OR operation NOT IN ('queue_read','queue_confirm','execution_read')))
    OR (phase='authorized' AND (epoch IS NULL OR epoch NOT BETWEEN 1 AND 2147483647)) THEN RAISE EXCEPTION 'm04 invalid binding' USING ERRCODE='P7601'; END IF;
  b:=jsonb_build_object('methodId',method_id,'revision',revision,'methodDigest',method_digest,'packageDigest',package_digest);
  IF operation='queue_read' THEN
    IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['jobKey','continuation']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid read' USING ERRCODE='P7601'; END IF;
    k:=i->>'jobKey'; continuation:=i->'continuation';
  ELSIF operation IN ('queue_confirm','queue_cas') THEN
    IF official_v3_jobs_private.exact_keys_v1(i,CASE WHEN operation='queue_confirm' THEN ARRAY['command','continuation'] ELSE ARRAY['command','commit','subjectText','disposition'] END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid command envelope' USING ERRCODE='P7601'; END IF;
    c:=official_v3_jobs_private.command_v1(i->'command'); k:=c->>'jobKey'; continuation:=i->'continuation';
    IF operation='queue_cas' THEN
      -- Validate the complete proposed transition before computing its advisory set;
      -- actual expected/current equality is checked again under the subject lock.
      PERFORM official_v3_jobs_private.transition_v1(c->'value',i#>'{commit,expected}',i->'commit');
      IF official_v3_jobs_private.exact_keys_v1(i->'disposition',CASE i#>>'{disposition,kind}' WHEN 'regular' THEN ARRAY['kind'] WHEN 'completed' THEN ARRAY['kind','attemptKey'] WHEN 'settled_failure' THEN ARRAY['kind','attemptKey','token'] ELSE ARRAY[]::text[] END) IS NOT TRUE
        OR (i#>>'{disposition,kind}' IN ('regular','completed','settled_failure')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid disposition' USING ERRCODE='P7601'; END IF;
      IF i#>>'{disposition,kind}'<>'regular' AND (i#>>'{disposition,attemptKey}' ~ '^execution-attempt:v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid attempt' USING ERRCODE='P7601'; END IF;
      IF i#>>'{disposition,kind}'='settled_failure' AND (i#>>'{disposition,token}' ~ '^[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid token' USING ERRCODE='P7601'; END IF;
      IF jsonb_typeof(i->'subjectText') IS DISTINCT FROM 'string' OR octet_length(i->>'subjectText')>65536 THEN RAISE EXCEPTION 'm04 invalid subject' USING ERRCODE='P7601'; END IF;
      deadline:=least(deadline,official_v3_jobs_private.timestamp_v1(i#>>'{commit,notAfter}'));
    END IF;
  ELSE
    IF official_v3_jobs_private.exact_keys_v1(i,CASE operation WHEN 'execution_read' THEN ARRAY['claim','purpose'] WHEN 'execution_start' THEN ARRAY['claim','leasedJob','subjectText'] ELSE ARRAY['claim','attemptKey','token','result','references'] END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid execution' USING ERRCODE='P7601'; END IF;
    claim:=i->'claim'; PERFORM official_v3_jobs_private.command_v1(jsonb_build_object('action','claim','input',claim)); k:=claim->>'jobKey';
    IF operation='execution_read' AND (i->>'purpose' IN ('resume','lookup','confirm','artifact')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid read purpose' USING ERRCODE='P7601'; END IF;
    IF operation='execution_start' THEN
      PERFORM official_v3_jobs_private.job_v1(i->'leasedJob');
      next_identity:=CASE WHEN i#>>'{leasedJob,kind}'='research_job_record' THEN official_v3_jobs_private.subject_v1('rule_research',jsonb_build_object(
        'context',i#>'{leasedJob,context}','method',i#>'{leasedJob,method}','factKind',i#>'{leasedJob,research,factKind}','researchReason',i#>'{leasedJob,research,researchReason}'))
        ELSE official_v3_jobs_private.subject_v1('combination_discovery',(i#>'{leasedJob,identity}')-'kind'-'jobKey') END;
      IF next_identity->>'jobKey' IS DISTINCT FROM k OR next_identity->'subjectText' IS DISTINCT FROM i->'subjectText' THEN RAISE EXCEPTION 'm04 subject preimage mismatch' USING ERRCODE='P7601'; END IF;
      attempt:='execution-attempt:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object('subject',(i->>'subjectText')::jsonb,
        'claim',claim,'leasedJob',i->'leasedJob','authority',b||jsonb_build_object('epoch',epoch)),0),'UTF8')),'hex');
    ELSIF operation='execution_prepare' THEN
      IF (i->>'attemptKey' ~ '^execution-attempt:v3:[a-f0-9]{64}$') IS NOT TRUE OR (i->>'token' ~ '^[a-f0-9]{64}$') IS NOT TRUE
        OR jsonb_typeof(i->'result') IS DISTINCT FROM 'object' OR jsonb_typeof(i->'references') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'm04 invalid prepare' USING ERRCODE='P7601'; END IF;
      attempt:=i->>'attemptKey';
    END IF;
  END IF;
  IF (k ~ '^(research-job|combination-discovery-job):v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid subject locator' USING ERRCODE='P7601'; END IF;
  IF continuation IS NOT NULL AND continuation<>'null'::jsonb THEN
    IF official_v3_jobs_private.exact_keys_v1(continuation,CASE continuation->>'kind' WHEN 'prepared' THEN ARRAY['kind','claim','attemptKey'] WHEN 'owned_failure' THEN ARRAY['kind','claim','attemptKey','token'] ELSE ARRAY[]::text[] END) IS NOT TRUE
      OR (continuation->>'kind' IN ('prepared','owned_failure')) IS NOT TRUE
      OR (continuation->>'attemptKey' ~ '^execution-attempt:v3:[a-f0-9]{64}$') IS NOT TRUE
      OR (continuation->>'kind'='owned_failure' AND (continuation->>'token' ~ '^[a-f0-9]{64}$') IS NOT TRUE) THEN RAISE EXCEPTION 'm04 invalid continuation' USING ERRCODE='P7601'; END IF;
    PERFORM official_v3_jobs_private.command_v1(jsonb_build_object('action','claim','input',continuation->'claim'));
    IF continuation#>>'{claim,jobKey}' IS DISTINCT FROM k THEN RAISE EXCEPTION 'm04 continuation subject' USING ERRCODE='P7601'; END IF;
  END IF;
  -- All keys depend solely on fully validated request data. There are no later keys.
  lock_names:=ARRAY['subject:'||k];
  IF c IS NOT NULL THEN
    lock_names:=array_append(lock_names,'operation:'||(c->>'operationId'));
    IF c->>'action'='enqueue' THEN lock_names:=array_append(lock_names,'cycle:'||(c#>>'{value,input,jobId}')); END IF;
  END IF;
  IF operation='queue_cas' THEN
    lock_names:=array_append(lock_names,'audit:'||(i#>>'{commit,audit,reference}'));
    IF i#>>'{disposition,kind}'<>'regular' THEN lock_names:=array_append(lock_names,'attempt:'||(i#>>'{disposition,attemptKey}')); END IF;
  END IF;
  IF claim IS NOT NULL THEN lock_names:=array_append(lock_names,'operation:'||(claim->>'operationId')); END IF;
  IF attempt IS NOT NULL THEN lock_names:=array_append(lock_names,'attempt:'||attempt); END IF;
  IF operation='execution_prepare' THEN
    IF (COALESCE(i#>>'{result,decisionRef}',i#>>'{result,discoveryRef}') ~ '^(source-decision|combination-discovery-result):v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid result key' USING ERRCODE='P7601'; END IF;
    lock_names:=array_append(lock_names,'result:'||COALESCE(i#>>'{result,decisionRef}',i#>>'{result,discoveryRef}'));
  END IF;
  -- Self-compatible relation locks isolate runtime subjects and finish DDL waits early.
  FOREACH relation IN ARRAY ARRAY['slots_v1','subjects_v1','queue_operations_v1','execution_starts_v1','execution_results_v1','execution_dispositions_v1','catalog_binding_v1'] LOOP
    IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired before relation' USING ERRCODE='P7605'; END IF;
    PERFORM set_config('lock_timeout',greatest(1,floor(extract(epoch FROM(deadline-clock_timestamp()))*1000))::text||'ms',true);
    EXECUTE format('LOCK TABLE official_v3_jobs_private.%I IN ROW EXCLUSIVE MODE',relation);
  END LOOP;
  IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired after relations' USING ERRCODE='P7605'; END IF;
  PERFORM official_v3_jobs_private.assert_catalog_v1();
  FOR lock_value IN SELECT DISTINCT ('x'||substr(encode(sha256(convert_to('m04-lock:v1:'||v,'UTF8')),'hex'),1,16))::bit(64)::bigint AS token
      FROM unnest(lock_names) v ORDER BY token LOOP
    IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired before advisory' USING ERRCODE='P7605'; END IF;
    PERFORM set_config('lock_timeout',greatest(1,floor(extract(epoch FROM(deadline-clock_timestamp()))*1000))::text||'ms',true);
    PERFORM pg_advisory_xact_lock(lock_value);
  END LOOP;
  IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired before subject' USING ERRCODE='P7605'; END IF;
  PERFORM set_config('lock_timeout',greatest(1,floor(extract(epoch FROM(deadline-clock_timestamp()))*1000))::text||'ms',true);
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=k FOR UPDATE;
  IF s.job_key IS NOT NULL THEN
    PERFORM official_v3_jobs_private.assert_history_v1(k);
    IF s.method_binding IS DISTINCT FROM b THEN RETURN jsonb_build_object('status','blocked'); END IF;
  END IF;
  IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired after subject' USING ERRCODE='P7605'; END IF;
  -- Complete all-older-unknown gate, independent of latest IDs and MA1 availability.
  IF s.open_attempt IS NOT NULL THEN
    SELECT * INTO t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=s.open_attempt;
    SELECT * INTO r FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=s.open_attempt;
    IF operation='execution_read' THEN
      eligible:=r.attempt_key IS NOT NULL AND t.claim_text=official_v3_jobs_private.canonical_v1(claim,0) AND s.current_job=t.leased_job;
    ELSIF operation='execution_prepare' THEN
      eligible:=i->>'attemptKey'=t.attempt_key AND t.claim_text=official_v3_jobs_private.canonical_v1(claim,0)
        AND t.token_hash=encode(sha256(convert_to(i->>'token','UTF8')),'hex') AND s.current_job=t.leased_job;
    ELSIF operation='queue_cas' THEN
      eligible:=i#>>'{disposition,attemptKey}'=t.attempt_key AND i#>'{commit,expected}'=t.leased_job
        AND ((i#>>'{disposition,kind}'='completed' AND r.attempt_key IS NOT NULL)
          OR (i#>>'{disposition,kind}'='settled_failure' AND r.attempt_key IS NULL AND t.token_hash=encode(sha256(convert_to(i#>>'{disposition,token}','UTF8')),'hex')));
    ELSIF operation IN ('queue_read','queue_confirm') AND continuation IS NOT NULL AND continuation<>'null'::jsonb THEN
      eligible:=continuation->>'attemptKey'=t.attempt_key AND t.claim_text=official_v3_jobs_private.canonical_v1(continuation->'claim',0)
        AND s.current_job=t.leased_job AND ((continuation->>'kind'='prepared' AND r.attempt_key IS NOT NULL)
          OR (continuation->>'kind'='owned_failure' AND r.attempt_key IS NULL AND t.token_hash=encode(sha256(convert_to(continuation->>'token','UTF8')),'hex')));
      IF operation='queue_confirm' THEN eligible:=eligible AND ((c->>'action'='claim' AND c#>'{value,input}'=continuation->'claim')
        OR (c->>'action'='complete' AND continuation->>'kind'='prepared') OR (c->>'action'='fail' AND continuation->>'kind'='owned_failure')); END IF;
    END IF;
    IF eligible IS NOT TRUE THEN RETURN jsonb_build_object('status','blocked'); END IF;
    IF phase='authorized' AND t.authority IS DISTINCT FROM (b||jsonb_build_object('epoch',epoch)) THEN RETURN jsonb_build_object('status','blocked'); END IF;
  END IF;
  IF phase='probe' THEN
    bundle:=CASE operation WHEN 'queue_read' THEN official_v3_jobs_private.tx_queue_read_v1(q,b,epoch,remaining_ms,deadline)
      WHEN 'queue_confirm' THEN official_v3_jobs_private.tx_queue_confirm_v1(q,b,epoch,remaining_ms,deadline)
      ELSE official_v3_jobs_private.tx_execution_read_v1(q,b,epoch,remaining_ms,deadline) END;
    IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired probe' USING ERRCODE='P7605'; END IF;
    RETURN CASE WHEN bundle->'authority'='true'::jsonb THEN jsonb_build_object('status','requires_authority') ELSE bundle->'reply' END;
  END IF;
  PERFORM set_config('lock_timeout',greatest(1,floor(extract(epoch FROM(deadline-clock_timestamp()))*1000))::text||'ms',true);
  bundle:=CASE operation WHEN 'queue_read' THEN official_v3_jobs_private.tx_queue_read_v1(q,b,epoch,remaining_ms,deadline)
    WHEN 'queue_confirm' THEN official_v3_jobs_private.tx_queue_confirm_v1(q,b,epoch,remaining_ms,deadline)
    WHEN 'queue_cas' THEN official_v3_jobs_private.tx_queue_cas_v1(q,b,epoch,remaining_ms,deadline)
    WHEN 'execution_read' THEN official_v3_jobs_private.tx_execution_read_v1(q,b,epoch,remaining_ms,deadline)
    WHEN 'execution_start' THEN official_v3_jobs_private.tx_execution_start_v1(q,b,epoch,remaining_ms,deadline)
    ELSE official_v3_jobs_private.tx_execution_prepare_v1(q,b,epoch,remaining_ms,deadline) END;
  IF bundle->'authority' IS DISTINCT FROM 'true'::jsonb THEN
    IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired negative' USING ERRCODE='P7605'; END IF;
    RETURN bundle->'reply';
  END IF;
  -- Preexisting original PREPARED continuation reads also consume full actual S1.
  IF (bundle->'references' IS NULL OR bundle->'references'='null'::jsonb) AND r.attempt_key IS NOT NULL THEN
    bundle:=bundle||jsonb_build_object('references',r."references",'job',t.leased_job,'result',r.result,'lease',t.leased_job#>>'{lease,expiresAt}');
  END IF;
  PERFORM official_v3_jobs_private.assert_history_v1(k);
  IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired after effects' USING ERRCODE='P7605'; END IF;
  IF jsonb_typeof(bundle->'references')='array' THEN
    FOR ref IN SELECT value FROM jsonb_array_elements(bundle->'references') ORDER BY value#>>'{binding,operationId}' COLLATE "C" LOOP
      IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired before S1' USING ERRCODE='P7605'; END IF;
      PERFORM set_config('lock_timeout',greatest(1,floor(extract(epoch FROM(deadline-clock_timestamp()))*1000))::text||'ms',true);
      opened:=official_v3_jobs_private.s1_read_v1(ref->'binding',ref->>'proposalDigest',(ref->>'bytes')::integer);
      IF opened#>'{record,reference}' IS DISTINCT FROM ref THEN RAISE EXCEPTION 'm04 S1 reference mismatch' USING ERRCODE='P7604'; END IF;
      PERFORM official_v3_jobs_private.consume_s1_v1(opened,bundle->'job',bundle->'result',CASE operation WHEN 'execution_prepare' THEN 'prepare' WHEN 'queue_cas' THEN 'complete' ELSE 'read' END);
    END LOOP;
  END IF;
  IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired before authority' USING ERRCODE='P7605'; END IF;
  PERFORM set_config('lock_timeout',greatest(1,floor(extract(epoch FROM(deadline-clock_timestamp()))*1000))::text||'ms',true);
  raw_reply:=bundle->'reply';
  IF raw_reply IS NULL OR octet_length(official_v3_jobs_private.canonical_v1(raw_reply,0))>262144 THEN RAISE EXCEPTION 'm04 oversized reply' USING ERRCODE='P7601'; END IF;
  -- LAST database authority check. It takes actual MA1 head FOR SHARE, then reads
  -- actual clock/tuple/epoch/expiry. No application DML or new lock follows it.
  PERFORM official_v3_jobs_private.ma1_require_v1(method_id,revision,method_digest,package_digest,epoch);
  IF clock_timestamp()>=deadline OR (bundle->>'lease' IS NOT NULL AND clock_timestamp()>=official_v3_jobs_private.timestamp_v1(bundle->>'lease'))
    OR (bundle->>'observedAt' IS NOT NULL AND clock_timestamp()<official_v3_jobs_private.timestamp_v1(bundle->>'observedAt'))
    OR (bundle->>'dueAt' IS NOT NULL AND clock_timestamp()<official_v3_jobs_private.timestamp_v1(bundle->>'dueAt')) THEN
    RAISE EXCEPTION 'm04 final expired budget or lease' USING ERRCODE='P7605'; END IF;
  RETURN raw_reply;
END $$;

-- Inspect effective creator ACL before transferring/revoking new objects only.
DO $created_acl$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a
    WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api') AND a.grantee<>p.proowner
      AND NOT(a.grantee=0 AND a.privilege_type='EXECUTE' AND NOT a.is_grantable))
    OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a
      WHERE n.nspname='official_v3_jobs_private' AND c.relkind='r' AND a.grantee<>c.relowner)
    OR (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api'))<>29 THEN
    RAISE EXCEPTION 'm04 creator boundary mismatch' USING ERRCODE='P7601'; END IF;
END $created_acl$;
GRANT USAGE,CREATE ON SCHEMA official_v3_jobs_private TO ot_v3_intake_owner;
DO $owners$
DECLARE function_row record;
BEGIN
  FOR function_row IN SELECT p.oid,p.proname,n.nspname,pg_get_function_identity_arguments(p.oid) args FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api') LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) OWNER TO %I',function_row.nspname,function_row.proname,function_row.args,CASE WHEN function_row.proname IN ('s1_read_v1','s1_shape_v1') THEN 'ot_v3_intake_owner' ELSE 'postgres' END);
  END LOOP;
END $owners$;
REVOKE CREATE ON SCHEMA official_v3_jobs_private FROM ot_v3_intake_owner;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA official_v3_jobs_private,official_v3_jobs_api FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA official_v3_jobs_private FROM PUBLIC;
GRANT EXECUTE ON FUNCTION official_v3_jobs_private.s1_read_v1(jsonb,text,integer),official_v3_jobs_private.s1_shape_v1(jsonb,text) TO postgres;
GRANT EXECUTE ON FUNCTION official_v3_jobs_api.execute_v1(text,text,integer,text,text,integer,integer,text) TO ot_v3_jobs_caller;
DO $parsed_edges$
DECLARE x record;
BEGIN
  FOR x IN SELECT * FROM (VALUES
   ('official_v3_jobs_private.s1_read_v1(jsonb,text,integer)','official_v3_intake_api.read_v1(jsonb,text,integer)'),
   ('official_v3_jobs_private.s1_shape_v1(jsonb,text)','official_v3_intake_private.proposal_retainable_v1(jsonb)'),
   ('official_v3_jobs_private.s1_shape_v1(jsonb,text)','official_v3_intake_private.safe_data_v1(jsonb,integer)'),
   ('official_v3_jobs_private.s1_shape_v1(jsonb,text)','official_v3_intake_private.data_nodes_v1(jsonb,integer,integer,integer)'),
   ('official_v3_jobs_private.s1_shape_v1(jsonb,text)','official_v3_intake_private.shape_matches_v1(jsonb,jsonb,jsonb,jsonb,integer)'),
   ('official_v3_jobs_private.s1_shape_v1(jsonb,text)','official_v3_intake_private.proposal_shape_v1()'),
   ('official_v3_jobs_private.ma1_require_v1(text,integer,text,text,integer)','official_v3_method_private.require_current_locked_v1(text,integer,text,text,integer)')
  ) v(consumer,consumed) LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_depend WHERE classid='pg_proc'::regclass AND refclassid='pg_proc'::regclass AND objid=to_regprocedure(x.consumer) AND refobjid=to_regprocedure(x.consumed) AND deptype='n') THEN
      RAISE EXCEPTION 'm04 parsed dependency missing' USING ERRCODE='P7601'; END IF;
  END LOOP;
END $parsed_edges$;
INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint)
 SELECT 'fn:'||id,jsonb_build_object('oid',p.oid,'owner',p.proowner,'acl',p.proacl,'config',p.proconfig,'definer',p.prosecdef,
 'volatility',p.provolatile,'parallel',p.proparallel,'strict',p.proisstrict,'defaults',p.pronargdefaults,'definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'))
 FROM unnest(ARRAY[
 'official_v3_intake_api.read_v1(jsonb,text,integer)','official_v3_intake_private.binding_valid_v1(jsonb)',
 'official_v3_intake_private.exact_keys_v1(jsonb,text[])','official_v3_intake_private.record_v1(text)',
 'official_v3_intake_private.proposal_retainable_v1(jsonb)','official_v3_intake_private.data_nodes_v1(jsonb,integer,integer,integer)',
 'official_v3_intake_private.proposal_shape_v1()','official_v3_intake_private.shape_matches_v1(jsonb,jsonb,jsonb,jsonb,integer)',
 'official_v3_intake_private.safe_data_v1(jsonb,integer)','official_v3_method_private.require_current_locked_v1(text,integer,text,text,integer)',
 'official_v3_method_private.tuple_valid_v1(text,integer,text,text)']) id JOIN pg_proc p ON p.oid=to_regprocedure(id);
INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint)
 SELECT 'companion-functions',jsonb_agg(jsonb_build_object('oid',p.oid,'name',p.proname,'signature',pg_get_function_identity_arguments(p.oid),
 'owner',p.proowner,'acl',p.proacl,'definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid)
 FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace WHERE ns.nspname IN ('official_v3_jobs_private','official_v3_jobs_api');
INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint) SELECT 'companion-tables',(SELECT jsonb_agg(jsonb_build_object('name',c.relname,'oid',c.oid,'kind',c.relkind,'owner',c.relowner,'acl',c.relacl,'rls',c.relrowsecurity,'force',c.relforcerowsecurity,
 'columns',(SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',a.atttypid,'null',a.attnotnull,'acl',a.attacl,'generated',a.attgenerated,'identity',a.attidentity) ORDER BY a.attnum) FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped),
 'constraints',(SELECT jsonb_agg(jsonb_build_object('name',x.conname,'definition',pg_get_constraintdef(x.oid,false),'deferred',x.condeferrable,'initial',x.condeferred,'valid',x.convalidated) ORDER BY x.conname) FROM pg_constraint x WHERE x.conrelid=c.oid),
 'indexes',(SELECT jsonb_agg(jsonb_build_object('name',ci.relname,'definition',pg_get_indexdef(x.indexrelid),'valid',x.indisvalid,'ready',x.indisready) ORDER BY ci.relname) FROM pg_index x JOIN pg_class ci ON ci.oid=x.indexrelid WHERE x.indrelid=c.oid),
 'policies',(SELECT jsonb_agg(jsonb_build_object('name',x.polname,'roles',x.polroles,'command',x.polcmd,'permissive',x.polpermissive,'using',pg_get_expr(x.polqual,x.polrelid),'check',pg_get_expr(x.polwithcheck,x.polrelid)) ORDER BY x.polname) FROM pg_policy x WHERE x.polrelid=c.oid),
 'triggers',(SELECT jsonb_agg(jsonb_build_object('name',x.tgname,'type',x.tgtype,'function',x.tgfoid,'enabled',x.tgenabled,'internal',x.tgisinternal,'constraint',x.tgconstraint,'deferred',x.tgdeferrable,'initial',x.tginitdeferred,'qual',pg_get_expr(x.tgqual,x.tgrelid)) ORDER BY x.tgname) FROM pg_trigger x WHERE x.tgrelid=c.oid)) ORDER BY c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='official_v3_jobs_private' AND c.relkind='r');
INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint) SELECT 'companion-schemas',(SELECT jsonb_agg(jsonb_build_object('name',n.nspname,'oid',n.oid,'owner',n.nspowner,'acl',n.nspacl) ORDER BY n.nspname) FROM pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api'));
INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint) SELECT 'role-flags',(SELECT jsonb_agg(jsonb_build_object('name',r.rolname,'oid',r.oid,'super',r.rolsuper,'inherit',r.rolinherit,'login',r.rolcanlogin,'create_role',r.rolcreaterole,'create_db',r.rolcreatedb,'replicate',r.rolreplication,'bypass',r.rolbypassrls,'config',r.rolconfig,
 'memberships',(SELECT jsonb_agg(jsonb_build_object('role',m.roleid,'member',m.member,'grantor',m.grantor,'admin',m.admin_option,'inherit',m.inherit_option,'set',m.set_option) ORDER BY m.roleid,m.member,m.grantor) FROM pg_auth_members m WHERE m.member=r.oid OR (r.rolname<>'ot_v3_jobs_caller' AND m.roleid=r.oid))) ORDER BY r.rolname) FROM pg_roles r WHERE r.rolname IN ('postgres','ot_v3_intake_owner','ot_v3_jobs_caller') OR r.oid=COALESCE((SELECT (fingerprint->>'installer')::oid FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='creator-defaults'),current_user::regrole::oid));
INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint) SELECT 'parsed-dependencies',(SELECT jsonb_agg(jsonb_build_object('object',d.objid,'ref',d.refobjid,'type',d.deptype,'sub',d.objsubid,'refsub',d.refobjsubid) ORDER BY d.objid,d.refobjid,d.deptype,d.objsubid,d.refobjsubid) FROM pg_depend d JOIN pg_proc p ON p.oid=d.objid JOIN pg_namespace n ON n.oid=p.pronamespace WHERE d.classid='pg_proc'::regclass AND d.refclassid='pg_proc'::regclass AND n.nspname='official_v3_jobs_private' AND p.proname IN ('s1_read_v1','s1_shape_v1','ma1_require_v1'));
INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint)
 SELECT 'creator-defaults',jsonb_build_object('installer',current_user::regrole::oid,'entries',
  (SELECT jsonb_agg(jsonb_build_object('role',d.defaclrole,'schema',d.defaclnamespace,'type',d.defaclobjtype,'acl',d.defaclacl) ORDER BY d.defaclrole,d.defaclnamespace,d.defaclobjtype)
    FROM pg_default_acl d WHERE d.defaclrole IN (current_user::regrole,'postgres'::regrole,'ot_v3_intake_owner'::regrole)));
SELECT official_v3_jobs_private.assert_catalog_v1();
COMMIT;
