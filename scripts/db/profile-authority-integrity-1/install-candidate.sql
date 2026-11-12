-- PROFILE-AUTHORITY-INTEGRITY-1 / SOURCE-V1 A1. UNAPPLIED.
-- Exactly one additive trigger function and one additive profile trigger.
-- Table locking serializes target writes/DDL only. A separately verified
-- operator-quiescent interval for privileged helper/default/role DDL is REQUIRED
-- through apply and readback. Neither a flag nor these snapshots proves it.
-- No #917 refused capability/ledger/Pilot/Grant object is queried.
BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='10s';
-- Deparser visibility matches E10B/C/D; all executable object references below
-- are schema-qualified. The installed runtime function uses pg_catalog only.
SET LOCAL search_path=pg_catalog,public,extensions;
LOCK TABLE ONLY public.profiles IN SHARE ROW EXCLUSIVE MODE;

DO $pai1_install$
DECLARE
  owner_oid oid;
  public_oid oid;
  baseline jsonb;
  current_shape jsonb;
  final_preserved jsonb;
  expected_shape constant jsonb := $pai1_shape${"relation":{"owner":"postgres","rls":true,"force_rls":false,"kind":"r","acl":["authenticated=arwd/postgres","postgres=arwdDxtm/postgres","service_role=arwdDxtm/postgres"]},"columns":[{"name":"id","type":"uuid","number":1,"default":"uuid_generate_v4()","raw_acl":null,"identity":"","not_null":true,"collation":null,"generated":""},{"name":"user_id","type":"uuid","number":2,"default":null,"raw_acl":null,"identity":"","not_null":true,"collation":null,"generated":""},{"name":"role","type":"text","number":3,"default":"'user'::text","raw_acl":null,"identity":"","not_null":true,"collation":"\"default\"","generated":""},{"name":"created_at","type":"timestamp with time zone","number":4,"default":"timezone('utc'::text, now())","raw_acl":null,"identity":"","not_null":false,"collation":null,"generated":""},{"name":"avatar_url","type":"text","number":6,"default":null,"raw_acl":null,"identity":"","not_null":false,"collation":"\"default\"","generated":""},{"name":"email","type":"text","number":15,"default":null,"raw_acl":null,"identity":"","not_null":false,"collation":"\"default\"","generated":""},{"name":"status","type":"text","number":16,"default":"'active'::text","raw_acl":null,"identity":"","not_null":true,"collation":"\"default\"","generated":""},{"name":"last_seen_at","type":"timestamp with time zone","number":17,"default":null,"raw_acl":null,"identity":"","not_null":false,"collation":null,"generated":""},{"name":"display_name","type":"text","number":18,"default":null,"raw_acl":null,"identity":"","not_null":false,"collation":"\"default\"","generated":""}],"constraints":[{"kind":"p","name":"profiles_pkey","validated":true,"definition":"PRIMARY KEY (id)"},{"kind":"c","name":"profiles_role_check","validated":true,"definition":"CHECK (rollenrang(role) IS NOT NULL)"},{"kind":"c","name":"profiles_status_check","validated":true,"definition":"CHECK (status = ANY (ARRAY['active'::text, 'pending'::text, 'disabled'::text, 'banned'::text]))"},{"kind":"f","name":"profiles_user_id_fkey","validated":true,"definition":"FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE"},{"kind":"u","name":"profiles_user_id_key","validated":true,"definition":"UNIQUE (user_id)"}],"policies":[{"name":"profiles_aendern","roles":["authenticated"],"using":"((user_id = ( SELECT auth.uid() AS uid)) OR darf_konten_verwalten())","command":"w","permissive":true,"with_check":"((user_id = ( SELECT auth.uid() AS uid)) OR darf_konten_verwalten())"},{"name":"profiles_anlegen","roles":["authenticated"],"using":null,"command":"a","permissive":true,"with_check":"(user_id = ( SELECT auth.uid() AS uid))"},{"name":"profiles_lesen","roles":["authenticated"],"using":"((user_id = ( SELECT auth.uid() AS uid)) OR darf_konten_verwalten())","command":"r","permissive":true,"with_check":null},{"name":"profiles_loeschen","roles":["authenticated"],"using":"((user_id = ( SELECT auth.uid() AS uid)) OR darf_konten_verwalten())","command":"d","permissive":true,"with_check":null}],"functions":[{"set":false,"kind":"f","name":"aktuelle_rolle","owner":"postgres","config":["search_path=public, pg_temp"],"strict":false,"raw_acl":["authenticated=X/postgres","postgres=X/postgres","service_role=X/postgres"],"returns":"text","defaults":0,"language":"sql","parallel":"u","arguments":"","leakproof":false,"volatility":"s","body_sha256":"41b223309c2228d87a0ac273ac31cc9ffcaa7e3ac406059d00818b947b09cbd0","security_definer":true,"definition":"CREATE OR REPLACE FUNCTION public.aktuelle_rolle()\n RETURNS text\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\n  select p.role\n  from public.profiles p\n  where p.user_id = (select auth.uid())\n  limit 1\n$function$\n"},{"set":false,"kind":"f","name":"aktuelles_admin_aal2","owner":"postgres","config":["search_path=pg_catalog"],"strict":false,"raw_acl":["authenticated=X/postgres","postgres=X/postgres","service_role=X/postgres"],"returns":"boolean","defaults":0,"language":"sql","parallel":"s","arguments":"","leakproof":false,"volatility":"s","body_sha256":"d3cf53b48caba5d05eef08d940f1199b7ad58a8a78acefd1e899fda0c502ff1a","security_definer":false,"definition":"CREATE OR REPLACE FUNCTION public.aktuelles_admin_aal2()\n RETURNS boolean\n LANGUAGE sql\n STABLE PARALLEL SAFE\n SET search_path TO 'pg_catalog'\nAS $function$\n  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false)\n$function$\n"},{"set":false,"kind":"f","name":"darf_konten_verwalten","owner":"postgres","config":["search_path=pg_catalog"],"strict":false,"raw_acl":["authenticated=X/postgres","postgres=X/postgres","service_role=X/postgres"],"returns":"boolean","defaults":0,"language":"sql","parallel":"s","arguments":"","leakproof":false,"volatility":"s","body_sha256":"35e41fdae08f4663ffd9f58b3e7912b7faf13661ab0159c67067ad43f43498ab","security_definer":false,"definition":"CREATE OR REPLACE FUNCTION public.darf_konten_verwalten()\n RETURNS boolean\n LANGUAGE sql\n STABLE PARALLEL SAFE\n SET search_path TO 'pg_catalog'\nAS $function$\n  select public.hat_rolle_mindestens('moderator')\n     and public.aktuelles_admin_aal2()\n$function$\n"},{"set":false,"kind":"f","name":"hat_rolle_mindestens","owner":"postgres","config":["search_path=public, pg_temp"],"strict":false,"raw_acl":["authenticated=X/postgres","postgres=X/postgres","service_role=X/postgres"],"returns":"boolean","defaults":0,"language":"sql","parallel":"u","arguments":"minimum text","leakproof":false,"volatility":"s","body_sha256":"367f630edefe6788750c6cabe7f5cb1b32d7c01ee4e3246d60632bf5ccd77f10","security_definer":true,"definition":"CREATE OR REPLACE FUNCTION public.hat_rolle_mindestens(minimum text)\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\n  select coalesce(\n           public.rollenrang(public.aktuelle_rolle()) >= public.rollenrang(minimum),\n           false)\n$function$\n"},{"set":false,"kind":"f","name":"profil_kerndaten_aus_auth","owner":"postgres","config":["search_path=pg_catalog, public"],"strict":false,"raw_acl":["postgres=X/postgres","service_role=X/postgres"],"returns":"trigger","defaults":0,"language":"plpgsql","parallel":"u","arguments":"","leakproof":false,"volatility":"v","body_sha256":"05f4673d2bd0e2236a8b6047c29b2105d787e4f55792d0f1b8251547cc8f8422","security_definer":true,"definition":"CREATE OR REPLACE FUNCTION public.profil_kerndaten_aus_auth()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'pg_catalog', 'public'\nAS $function$\nbegin\n  update public.profiles p\n  set\n    email = coalesce(u.email, p.email),\n    display_name = coalesce(\n      p.display_name,\n      (u.raw_user_meta_data ->> 'full_name'),\n      (u.raw_user_meta_data ->> 'name'),\n      split_part(u.email, '@', 1)\n    )\n  from auth.users u\n  where p.user_id = new.user_id and u.id = new.user_id;\n  return new;\nend\n$function$\n"},{"set":false,"kind":"f","name":"profil_rollenwechsel_pruefen","owner":"postgres","config":["search_path=public, pg_temp"],"strict":false,"raw_acl":["postgres=X/postgres","service_role=X/postgres"],"returns":"trigger","defaults":0,"language":"plpgsql","parallel":"u","arguments":"","leakproof":false,"volatility":"v","body_sha256":"382d8bc00583596ef719b4185d47645baec410f71c2a7ebfb8e1c4df08ba8351","security_definer":true,"definition":"CREATE OR REPLACE FUNCTION public.profil_rollenwechsel_pruefen()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\ndeclare\n  handelnder uuid := (select auth.uid());\n  rang_handelnder integer;\nbegin\n  if handelnder is null then\n    return new;\n  end if;\n\n  rang_handelnder := public.rollenrang(public.aktuelle_rolle());\n\n  if tg_op = 'INSERT' then\n    if new.user_id = handelnder then\n      if new.role is distinct from 'user' then\n        raise exception 'Ein neues eigenes Profil erhält immer die Rolle user.'\n          using errcode = 'check_violation';\n      end if;\n      if new.status is distinct from 'active' then\n        raise exception 'Ein neues eigenes Profil erhält immer den Status active.'\n          using errcode = 'check_violation';\n      end if;\n      return new;\n    end if;\n\n    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then\n      raise exception 'Keine Berechtigung, Profile für andere Konten anzulegen.'\n        using errcode = 'insufficient_privilege';\n    end if;\n    if rang_handelnder < public.rollenrang('owner')\n       and rang_handelnder <= coalesce(public.rollenrang(new.role), -1) then\n      raise exception 'Diese Rolle liegt nicht unterhalb der eigenen.'\n        using errcode = 'insufficient_privilege';\n    end if;\n\n    return new;\n  end if;\n\n  if new.role is distinct from old.role then\n    if old.user_id = handelnder then\n      raise exception 'Die eigene Rolle lässt sich nicht ändern.'\n        using errcode = 'check_violation';\n    end if;\n    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then\n      raise exception 'Keine Berechtigung, Rollen zu vergeben.'\n        using errcode = 'insufficient_privilege';\n    end if;\n    if rang_handelnder < public.rollenrang('owner')\n       and (rang_handelnder <= coalesce(public.rollenrang(old.role), -1)\n            or rang_handelnder <= coalesce(public.rollenrang(new.role), -1)) then\n      raise exception 'Diese Rolle liegt nicht unterhalb der eigenen.'\n        using errcode = 'insufficient_privilege';\n    end if;\n  end if;\n\n  if new.status is distinct from old.status then\n    if old.user_id = handelnder then\n      raise exception 'Der eigene Kontostatus lässt sich nicht ändern.'\n        using errcode = 'check_violation';\n    end if;\n    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then\n      raise exception 'Keine Berechtigung, den Kontostatus zu ändern.'\n        using errcode = 'insufficient_privilege';\n    end if;\n  end if;\n\n  return new;\nend\n$function$\n"},{"set":false,"kind":"f","name":"rollenrang","owner":"postgres","config":["search_path=pg_catalog"],"strict":false,"raw_acl":["authenticated=X/postgres","postgres=X/postgres","service_role=X/postgres"],"returns":"integer","defaults":0,"language":"sql","parallel":"s","arguments":"rolle text","leakproof":false,"volatility":"i","body_sha256":"56d5753e4ccb189c2472c02a2737b6662c182381d03bf4de1954d069829fe850","security_definer":false,"definition":"CREATE OR REPLACE FUNCTION public.rollenrang(rolle text)\n RETURNS integer\n LANGUAGE sql\n IMMUTABLE PARALLEL SAFE\n SET search_path TO 'pg_catalog'\nAS $function$\n  select case rolle\n           when 'user'      then 0\n           when 'creator'   then 10\n           when 'moderator' then 20\n           when 'operator'  then 30\n           when 'admin'     then 40\n           when 'owner'     then 50\n         end\n$function$\n"}],"triggers":[{"name":"profiles_kerndaten_aus_auth","type":5,"enabled":"O","attributes":"","definition":"CREATE TRIGGER profiles_kerndaten_aus_auth AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION profil_kerndaten_aus_auth()","function_name":"profil_kerndaten_aus_auth"},{"name":"profiles_rollenwechsel","type":23,"enabled":"O","attributes":"","definition":"CREATE TRIGGER profiles_rollenwechsel BEFORE INSERT OR UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION profil_rollenwechsel_pruefen()","function_name":"profil_rollenwechsel_pruefen"}],"incoming_profile_foreign_keys":[]}$pai1_shape$::jsonb;
  f record;
  g record;
BEGIN
  SELECT oid INTO owner_oid FROM pg_catalog.pg_roles
    WHERE rolname='postgres' AND NOT rolsuper AND rolcanlogin AND rolinherit AND rolbypassrls;
  SELECT oid INTO public_oid FROM pg_catalog.pg_namespace WHERE nspname='public';
  IF owner_oid IS NULL OR current_user<>'postgres' OR session_user<>'postgres'
     OR pg_catalog.current_database()<>'postgres'
     OR pg_catalog.current_setting('server_version_num')::integer NOT BETWEEN 170000 AND 179999
     OR public_oid IS NULL
     OR (SELECT pg_catalog.pg_get_userbyid(nspowner) FROM pg_catalog.pg_namespace WHERE oid=public_oid)<>'pg_database_owner'
     OR NOT pg_catalog.has_schema_privilege(owner_oid,public_oid,'USAGE')
     OR NOT pg_catalog.has_schema_privilege(owner_oid,public_oid,'CREATE')
     OR (SELECT pg_catalog.jsonb_agg(a::text ORDER BY a::text) FROM pg_catalog.pg_namespace n,
       LATERAL pg_catalog.unnest(n.nspacl) a WHERE n.oid=public_oid)
       IS DISTINCT FROM $pai1_public_acl$["=U/pg_database_owner","anon=U/pg_database_owner","authenticated=U/pg_database_owner","pg_database_owner=UC/pg_database_owner","postgres=U/pg_database_owner","service_role=U/pg_database_owner"]$pai1_public_acl$::jsonb
     OR (SELECT pg_catalog.array_agg(r.rolname::text ORDER BY r.rolname)
       FROM pg_catalog.pg_roles r WHERE NOT r.rolsuper AND pg_catalog.has_schema_privilege(r.oid,public_oid,'CREATE'))
       IS DISTINCT FROM ARRAY['pg_database_owner','postgres']::text[]
     OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members WHERE roleid=owner_oid)
     OR EXISTS(SELECT 1 FROM pg_catalog.pg_inherits WHERE inhrelid='public.profiles'::pg_catalog.regclass OR inhparent='public.profiles'::pg_catalog.regclass) THEN
    RAISE EXCEPTION 'profile integrity installer context invalid' USING ERRCODE='P7902';
  END IF;

  -- The only observed creator-function default row is public-scoped.
  IF (SELECT count(*) FROM pg_catalog.pg_default_acl d WHERE d.defaclrole=owner_oid AND d.defaclobjtype='f'
        AND (d.defaclnamespace=0 OR d.defaclnamespace=public_oid))<>1
     OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl d
       WHERE d.defaclrole=owner_oid AND d.defaclobjtype='f' AND d.defaclnamespace=public_oid
       AND (SELECT pg_catalog.array_agg(a::text ORDER BY a::text) FROM pg_catalog.unnest(d.defaclacl) a)
         = ARRAY['postgres=X/postgres','service_role=X/postgres']::text[]) THEN
    RAISE EXCEPTION 'profile integrity creator defaults changed' USING ERRCODE='P7903';
  END IF;

  IF EXISTS(SELECT 1 FROM pg_catalog.pg_proc p WHERE p.pronamespace=public_oid AND p.proname='profil_autoritaet_integritaet_pruefen_v1')
     OR EXISTS(SELECT 1 FROM pg_catalog.pg_trigger t WHERE t.tgrelid='public.profiles'::pg_catalog.regclass AND t.tgname='profiles_autoritaet_integritaet_v1') THEN
    RAISE EXCEPTION 'profile integrity destination collision' USING ERRCODE='P7903';
  END IF;

  SELECT pg_catalog.jsonb_build_object(
  'relation',(SELECT pg_catalog.jsonb_build_object(
    'owner',pg_catalog.pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,'kind',c.relkind,
    'acl',(SELECT pg_catalog.jsonb_agg(a::text ORDER BY a::text) FROM pg_catalog.unnest(COALESCE(c.relacl,pg_catalog.acldefault('r',c.relowner))) a))
    FROM pg_catalog.pg_class c WHERE c.oid='public.profiles'::pg_catalog.regclass),
  'columns',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'name',a.attname,'type',pg_catalog.format_type(a.atttypid,a.atttypmod),'number',a.attnum,
    'default',pg_catalog.pg_get_expr(d.adbin,d.adrelid),'raw_acl',a.attacl,
    'identity',a.attidentity,'not_null',a.attnotnull,
    'collation',CASE WHEN a.attcollation=0 THEN NULL ELSE a.attcollation::pg_catalog.regcollation::text END,
    'generated',a.attgenerated) ORDER BY a.attnum)
    FROM pg_catalog.pg_attribute a LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
    WHERE a.attrelid='public.profiles'::pg_catalog.regclass AND a.attnum>0 AND NOT a.attisdropped),'[]'::jsonb),
  'constraints',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'name',c.conname,'kind',c.contype,'validated',c.convalidated,'definition',pg_catalog.pg_get_constraintdef(c.oid,true)) ORDER BY c.conname)
    FROM pg_catalog.pg_constraint c WHERE c.conrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb),
  'policies',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'name',p.polname,'roles',(SELECT pg_catalog.jsonb_agg(CASE WHEN r=0 THEN 'PUBLIC' ELSE pg_catalog.pg_get_userbyid(r) END ORDER BY r) FROM pg_catalog.unnest(p.polroles) r),
    'using',pg_catalog.pg_get_expr(p.polqual,p.polrelid),'command',p.polcmd,'permissive',p.polpermissive,
    'with_check',pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid)) ORDER BY p.polname)
    FROM pg_catalog.pg_policy p WHERE p.polrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb),
  'functions',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'set',p.proretset,'kind',p.prokind,'name',p.proname,'owner',pg_catalog.pg_get_userbyid(p.proowner),
    'config',p.proconfig,'strict',p.proisstrict,
    'raw_acl',(SELECT pg_catalog.jsonb_agg(a::text ORDER BY a::text) FROM pg_catalog.unnest(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a),
    'returns',pg_catalog.pg_get_function_result(p.oid),'defaults',p.pronargdefaults,'language',l.lanname,'parallel',p.proparallel,
    'arguments',pg_catalog.pg_get_function_identity_arguments(p.oid),'leakproof',p.proleakproof,'volatility',p.provolatile,
    'body_sha256',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex'),
    'security_definer',p.prosecdef,'definition',pg_catalog.pg_get_functiondef(p.oid)) ORDER BY p.proname,p.oid)
    FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace JOIN pg_catalog.pg_language l ON l.oid=p.prolang
    WHERE n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','darf_konten_verwalten',
      'hat_rolle_mindestens','profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang')),'[]'::jsonb),
  'triggers',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'name',t.tgname,'type',t.tgtype,'enabled',t.tgenabled,'attributes',t.tgattr::text,
    'definition',pg_catalog.pg_get_triggerdef(t.oid,true),'function_name',p.proname) ORDER BY t.tgname)
    FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_proc p ON p.oid=t.tgfoid
    WHERE t.tgrelid='public.profiles'::pg_catalog.regclass AND NOT t.tgisinternal
      AND t.tgname<>'profiles_autoritaet_integritaet_v1'),'[]'::jsonb),
  'incoming_profile_foreign_keys',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'oid',c.oid,'name',c.conname,'relation_schema',n.nspname,'relation',r.relname,
    'validated',c.convalidated,'deferrable',c.condeferrable,'deferred',c.condeferred,
    'definition',pg_catalog.pg_get_constraintdef(c.oid,true)) ORDER BY n.nspname,r.relname,c.conname)
    FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_class r ON r.oid=c.conrelid JOIN pg_catalog.pg_namespace n ON n.oid=r.relnamespace
    WHERE c.contype='f' AND c.confrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb)
) INTO current_shape;
  IF current_shape IS DISTINCT FROM expected_shape THEN
    RAISE EXCEPTION 'profile integrity observed baseline changed' USING ERRCODE='P7904';
  END IF;
  SELECT pg_catalog.jsonb_build_object(
 'profile_relation',(SELECT pg_catalog.to_jsonb(c) FROM pg_catalog.pg_class c WHERE c.oid='public.profiles'::pg_catalog.regclass),
 'profile_attributes',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a WHERE a.attrelid='public.profiles'::pg_catalog.regclass AND a.attnum>0),
 'profile_defaults',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.adnum) FROM pg_catalog.pg_attrdef d WHERE d.adrelid='public.profiles'::pg_catalog.regclass),
 'profile_constraints',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(c) ORDER BY c.oid) FROM pg_catalog.pg_constraint c WHERE c.conrelid='public.profiles'::pg_catalog.regclass OR c.confrelid='public.profiles'::pg_catalog.regclass),
 'profile_indexes',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('index',pg_catalog.to_jsonb(i),'relation',pg_catalog.to_jsonb(c),'definition',pg_catalog.pg_get_indexdef(i.indexrelid)) ORDER BY i.indexrelid)
   FROM pg_catalog.pg_index i JOIN pg_catalog.pg_class c ON c.oid=i.indexrelid WHERE i.indrelid='public.profiles'::pg_catalog.regclass),
 'profile_policies',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_policy p WHERE p.polrelid='public.profiles'::pg_catalog.regclass),
 'old_triggers',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) FROM pg_catalog.pg_trigger t
   WHERE t.tgrelid='public.profiles'::pg_catalog.regclass AND t.tgname<>'profiles_autoritaet_integritaet_v1'),
 'old_functions',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','darf_konten_verwalten','hat_rolle_mindestens','profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang')),
 'public_namespace',(SELECT pg_catalog.to_jsonb(n) FROM pg_catalog.pg_namespace n WHERE n.nspname='public'),
 'creator_defaults',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.oid) FROM pg_catalog.pg_default_acl d
   WHERE d.defaclrole='postgres'::pg_catalog.regrole AND (d.defaclnamespace=0 OR d.defaclnamespace='public'::pg_catalog.regnamespace)),
 'principals',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('oid',r.oid,'name',r.rolname,'super',r.rolsuper,
   'inherit',r.rolinherit,'create_role',r.rolcreaterole,'create_db',r.rolcreatedb,'login',r.rolcanlogin,
   'replication',r.rolreplication,'bypass',r.rolbypassrls,'connection_limit',r.rolconnlimit) ORDER BY r.oid)
   FROM pg_catalog.pg_roles r WHERE r.rolname IN ('postgres','authenticated','anon','authenticator','service_role','pg_database_owner','supabase_auth_admin')),
 'principal_memberships',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(m) ORDER BY m.oid) FROM pg_catalog.pg_auth_members m
   WHERE m.roleid IN (SELECT oid FROM pg_catalog.pg_roles WHERE rolname IN ('postgres','authenticated','anon','authenticator','service_role','pg_database_owner','supabase_auth_admin'))
      OR m.member IN (SELECT oid FROM pg_catalog.pg_roles WHERE rolname IN ('postgres','authenticated','anon','authenticator','service_role','pg_database_owner','supabase_auth_admin')))
) INTO baseline;

  EXECUTE $pai1_create_function$
CREATE FUNCTION public.profil_autoritaet_integritaet_pruefen_v1()
RETURNS trigger
LANGUAGE plpgsql
VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT
SET search_path=pg_catalog
AS $pai1_guard$
declare
  actor_uid uuid;
  actor_role text;
  actor_rank integer;
  target_rank integer;
begin
  if tg_relid <> 'public.profiles'::pg_catalog.regclass
     or tg_when <> 'BEFORE' or tg_level <> 'ROW'
     or tg_op not in ('UPDATE','DELETE') or tg_nargs <> 0 then
    raise exception 'profile integrity trigger binding invalid' using errcode='P7901';
  end if;

  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id
       or new.id is distinct from old.id then
      raise exception 'profile identity is immutable' using errcode='23514';
    end if;
    if new.status is not distinct from old.status then
      return new;
    end if;
  end if;

  actor_uid := auth.uid();
  if actor_uid is null then
    -- Only these existing database execution principals retain maintenance.
    -- The function is INVOKER; a JWT role string cannot select this branch.
    if current_user not in ('postgres','service_role') then
      raise exception 'profile authority unavailable' using errcode='42501';
    end if;
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if old.user_id = actor_uid then
    if tg_op = 'DELETE' then return old; end if;
    raise exception 'own profile status is immutable' using errcode='23514';
  end if;

  if public.darf_konten_verwalten() is distinct from true then
    raise exception 'profile authority unavailable' using errcode='42501';
  end if;
  actor_role := public.aktuelle_rolle();
  actor_rank := public.rollenrang(actor_role);
  target_rank := public.rollenrang(old.role);
  if actor_rank is null or target_rank is null
     or (actor_role <> 'owner' and actor_rank <= target_rank) then
    raise exception 'profile target authority unavailable' using errcode='42501';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$pai1_guard$;
$pai1_create_function$;

  -- Inspect actual new ACLs before any normalization. Only the observed default
  -- PUBLIC/service_role entries are removable; unexpected rights abort.
  SELECT p.* INTO f FROM pg_catalog.pg_proc p
    WHERE p.pronamespace=public_oid AND p.proname='profil_autoritaet_integritaet_pruefen_v1';
  IF NOT FOUND OR f.proowner<>owner_oid
     OR EXISTS(SELECT 1 FROM pg_catalog.aclexplode(COALESCE(f.proacl,pg_catalog.acldefault('f',owner_oid))) a
       WHERE a.grantor<>owner_oid OR a.privilege_type<>'EXECUTE' OR a.is_grantable
         OR a.grantee NOT IN (0::oid,owner_oid,'service_role'::pg_catalog.regrole)) THEN
    RAISE EXCEPTION 'profile integrity new-function defaults unexpected' USING ERRCODE='P7903';
  END IF;
  REVOKE ALL ON FUNCTION public.profil_autoritaet_integritaet_pruefen_v1() FROM PUBLIC,anon,authenticated,service_role;
  CREATE TRIGGER profiles_autoritaet_integritaet_v1
    BEFORE UPDATE OR DELETE ON public.profiles FOR EACH ROW
    EXECUTE FUNCTION public.profil_autoritaet_integritaet_pruefen_v1();

  SELECT p.* INTO f FROM pg_catalog.pg_proc p
    WHERE p.pronamespace=public_oid AND p.proname='profil_autoritaet_integritaet_pruefen_v1';
  SELECT t.* INTO g FROM pg_catalog.pg_trigger t
    WHERE t.tgrelid='public.profiles'::pg_catalog.regclass AND t.tgname='profiles_autoritaet_integritaet_v1';
  IF f.oid IS NULL OR g.oid IS NULL
     OR (SELECT count(*) FROM pg_catalog.pg_proc p WHERE p.pronamespace=public_oid AND p.proname=f.proname)<>1
     OR f.proowner<>owner_oid OR f.prokind<>'f' OR f.prosecdef OR f.proisstrict OR f.proretset OR f.proleakproof
     OR f.provolatile<>'v' OR f.proparallel<>'u' OR f.pronargs<>0 OR f.pronargdefaults<>0
     OR f.provariadic<>0::oid OR f.proargtypes::text<>'' OR f.proargdefaults IS NOT NULL
     OR f.procost<>100 OR f.prorows<>0 OR f.protrftypes IS NOT NULL
     OR f.proargnames IS NOT NULL OR f.proargmodes IS NOT NULL OR f.proallargtypes IS NOT NULL
     OR f.prorettype<>'pg_catalog.trigger'::pg_catalog.regtype
     OR f.prolang<>(SELECT oid FROM pg_catalog.pg_language WHERE lanname='plpgsql')
     OR f.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog']::text[]
     OR f.probin IS NOT NULL OR f.prosupport<>0::oid OR f.prosqlbody IS NOT NULL
     OR pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(f.prosrc,'UTF8')),'hex')<>'b513eca8cc5d7b3981d9b9eb1473428e628410dcb0f4b718290d4cc314756a8d'
     OR (SELECT pg_catalog.array_agg(a::text ORDER BY a::text) FROM pg_catalog.unnest(COALESCE(f.proacl,pg_catalog.acldefault('f',owner_oid))) a)
        IS DISTINCT FROM ARRAY['postgres=X/postgres']::text[]
     OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('anon','authenticated','authenticator','service_role')
        AND pg_catalog.has_function_privilege(r.oid,f.oid,'EXECUTE'))
     OR g.tgfoid<>f.oid OR g.tgtype<>27 OR g.tgenabled<>'O' OR g.tgisinternal
     OR g.tgparentid<>0 OR g.tgconstrrelid<>0 OR g.tgconstrindid<>0 OR g.tgconstraint<>0
     OR g.tgdeferrable OR g.tginitdeferred OR g.tgnargs<>0 OR g.tgattr::text<>''
     OR pg_catalog.octet_length(g.tgargs)<>0 OR g.tgqual IS NOT NULL
     OR g.tgoldtable IS NOT NULL OR g.tgnewtable IS NOT NULL
     OR (SELECT count(*) FROM pg_catalog.pg_trigger t WHERE t.tgfoid=f.oid)<>1 THEN
    RAISE EXCEPTION 'profile integrity final object contract invalid' USING ERRCODE='P7905';
  END IF;

  SELECT pg_catalog.jsonb_build_object(
  'relation',(SELECT pg_catalog.jsonb_build_object(
    'owner',pg_catalog.pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,'kind',c.relkind,
    'acl',(SELECT pg_catalog.jsonb_agg(a::text ORDER BY a::text) FROM pg_catalog.unnest(COALESCE(c.relacl,pg_catalog.acldefault('r',c.relowner))) a))
    FROM pg_catalog.pg_class c WHERE c.oid='public.profiles'::pg_catalog.regclass),
  'columns',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'name',a.attname,'type',pg_catalog.format_type(a.atttypid,a.atttypmod),'number',a.attnum,
    'default',pg_catalog.pg_get_expr(d.adbin,d.adrelid),'raw_acl',a.attacl,
    'identity',a.attidentity,'not_null',a.attnotnull,
    'collation',CASE WHEN a.attcollation=0 THEN NULL ELSE a.attcollation::pg_catalog.regcollation::text END,
    'generated',a.attgenerated) ORDER BY a.attnum)
    FROM pg_catalog.pg_attribute a LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
    WHERE a.attrelid='public.profiles'::pg_catalog.regclass AND a.attnum>0 AND NOT a.attisdropped),'[]'::jsonb),
  'constraints',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'name',c.conname,'kind',c.contype,'validated',c.convalidated,'definition',pg_catalog.pg_get_constraintdef(c.oid,true)) ORDER BY c.conname)
    FROM pg_catalog.pg_constraint c WHERE c.conrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb),
  'policies',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'name',p.polname,'roles',(SELECT pg_catalog.jsonb_agg(CASE WHEN r=0 THEN 'PUBLIC' ELSE pg_catalog.pg_get_userbyid(r) END ORDER BY r) FROM pg_catalog.unnest(p.polroles) r),
    'using',pg_catalog.pg_get_expr(p.polqual,p.polrelid),'command',p.polcmd,'permissive',p.polpermissive,
    'with_check',pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid)) ORDER BY p.polname)
    FROM pg_catalog.pg_policy p WHERE p.polrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb),
  'functions',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'set',p.proretset,'kind',p.prokind,'name',p.proname,'owner',pg_catalog.pg_get_userbyid(p.proowner),
    'config',p.proconfig,'strict',p.proisstrict,
    'raw_acl',(SELECT pg_catalog.jsonb_agg(a::text ORDER BY a::text) FROM pg_catalog.unnest(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a),
    'returns',pg_catalog.pg_get_function_result(p.oid),'defaults',p.pronargdefaults,'language',l.lanname,'parallel',p.proparallel,
    'arguments',pg_catalog.pg_get_function_identity_arguments(p.oid),'leakproof',p.proleakproof,'volatility',p.provolatile,
    'body_sha256',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex'),
    'security_definer',p.prosecdef,'definition',pg_catalog.pg_get_functiondef(p.oid)) ORDER BY p.proname,p.oid)
    FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace JOIN pg_catalog.pg_language l ON l.oid=p.prolang
    WHERE n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','darf_konten_verwalten',
      'hat_rolle_mindestens','profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang')),'[]'::jsonb),
  'triggers',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'name',t.tgname,'type',t.tgtype,'enabled',t.tgenabled,'attributes',t.tgattr::text,
    'definition',pg_catalog.pg_get_triggerdef(t.oid,true),'function_name',p.proname) ORDER BY t.tgname)
    FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_proc p ON p.oid=t.tgfoid
    WHERE t.tgrelid='public.profiles'::pg_catalog.regclass AND NOT t.tgisinternal
      AND t.tgname<>'profiles_autoritaet_integritaet_v1'),'[]'::jsonb),
  'incoming_profile_foreign_keys',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'oid',c.oid,'name',c.conname,'relation_schema',n.nspname,'relation',r.relname,
    'validated',c.convalidated,'deferrable',c.condeferrable,'deferred',c.condeferred,
    'definition',pg_catalog.pg_get_constraintdef(c.oid,true)) ORDER BY n.nspname,r.relname,c.conname)
    FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_class r ON r.oid=c.conrelid JOIN pg_catalog.pg_namespace n ON n.oid=r.relnamespace
    WHERE c.contype='f' AND c.confrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb)
) INTO current_shape;
  SELECT pg_catalog.jsonb_build_object(
 'profile_relation',(SELECT pg_catalog.to_jsonb(c) FROM pg_catalog.pg_class c WHERE c.oid='public.profiles'::pg_catalog.regclass),
 'profile_attributes',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a WHERE a.attrelid='public.profiles'::pg_catalog.regclass AND a.attnum>0),
 'profile_defaults',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.adnum) FROM pg_catalog.pg_attrdef d WHERE d.adrelid='public.profiles'::pg_catalog.regclass),
 'profile_constraints',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(c) ORDER BY c.oid) FROM pg_catalog.pg_constraint c WHERE c.conrelid='public.profiles'::pg_catalog.regclass OR c.confrelid='public.profiles'::pg_catalog.regclass),
 'profile_indexes',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('index',pg_catalog.to_jsonb(i),'relation',pg_catalog.to_jsonb(c),'definition',pg_catalog.pg_get_indexdef(i.indexrelid)) ORDER BY i.indexrelid)
   FROM pg_catalog.pg_index i JOIN pg_catalog.pg_class c ON c.oid=i.indexrelid WHERE i.indrelid='public.profiles'::pg_catalog.regclass),
 'profile_policies',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_policy p WHERE p.polrelid='public.profiles'::pg_catalog.regclass),
 'old_triggers',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) FROM pg_catalog.pg_trigger t
   WHERE t.tgrelid='public.profiles'::pg_catalog.regclass AND t.tgname<>'profiles_autoritaet_integritaet_v1'),
 'old_functions',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','darf_konten_verwalten','hat_rolle_mindestens','profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang')),
 'public_namespace',(SELECT pg_catalog.to_jsonb(n) FROM pg_catalog.pg_namespace n WHERE n.nspname='public'),
 'creator_defaults',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.oid) FROM pg_catalog.pg_default_acl d
   WHERE d.defaclrole='postgres'::pg_catalog.regrole AND (d.defaclnamespace=0 OR d.defaclnamespace='public'::pg_catalog.regnamespace)),
 'principals',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('oid',r.oid,'name',r.rolname,'super',r.rolsuper,
   'inherit',r.rolinherit,'create_role',r.rolcreaterole,'create_db',r.rolcreatedb,'login',r.rolcanlogin,
   'replication',r.rolreplication,'bypass',r.rolbypassrls,'connection_limit',r.rolconnlimit) ORDER BY r.oid)
   FROM pg_catalog.pg_roles r WHERE r.rolname IN ('postgres','authenticated','anon','authenticator','service_role','pg_database_owner','supabase_auth_admin')),
 'principal_memberships',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(m) ORDER BY m.oid) FROM pg_catalog.pg_auth_members m
   WHERE m.roleid IN (SELECT oid FROM pg_catalog.pg_roles WHERE rolname IN ('postgres','authenticated','anon','authenticator','service_role','pg_database_owner','supabase_auth_admin'))
      OR m.member IN (SELECT oid FROM pg_catalog.pg_roles WHERE rolname IN ('postgres','authenticated','anon','authenticator','service_role','pg_database_owner','supabase_auth_admin')))
) INTO final_preserved;
  IF current_shape IS DISTINCT FROM expected_shape OR final_preserved IS DISTINCT FROM baseline THEN
    RAISE EXCEPTION 'profile integrity existing catalog changed' USING ERRCODE='P7905';
  END IF;
END
$pai1_install$;
COMMIT;
