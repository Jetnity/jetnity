// PAI1 mandatory PG17 proof. All identities, JWT settings and databases are synthetic.
// Never accepts a hosted URL, never calls a hosted account API.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import type { TestContext } from 'node:test'
import { OwnedTestLifetime } from '../official-truth-atomic-version-refresh-1/test-lifetime'
import { assertOwnedLocalProofCluster, startLocalProofCluster, type LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, pgText, type PgRows } from '../official-truth-integrated-pilot-1/pg-wire'

const EFFECT_MS = 90_000
const DRAIN_MS = 35_000
const MAX_CLUSTERS = 3
const MAX_CONNECTIONS = 16
const MAX_OPERATIONS = 4096
const digest = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex')
const SOURCE_PINS = Object.freeze([
  [
    "./install-candidate.sql",
    "2dda7f1bd523e5046bcc72f352a876133d1c7ed01994eb7687c6d1c9d3218774"
  ],
  [
    "./observed-baseline.json",
    "0e586796b8cdd4c420992e7c6e6c0978fa266d49915d9dc47c2f44425a0d6fa8"
  ],
  [
    "../official-truth-v3-private-owner-guards-1/install-candidate.sql",
    "3e21495ff40f66337b004fadc98599cd336c19c31bb4f6e4f9013c2c01f02bd2"
  ],
  [
    "../official-truth-integrated-pilot-1/local-cluster.ts",
    "f6d21b3fef8f0ad41a8ac3951972ea5cba0394cfe41037eba8d0258ed508aa10"
  ],
  [
    "../official-truth-integrated-pilot-1/pg-wire.ts",
    "9ad361433f7d0563ae892d4b24d0fee3acbcb8ea567d750f5f3cb4be6989da3b"
  ],
  [
    "../official-truth-atomic-version-refresh-1/test-lifetime.ts",
    "e7a6a5deb652019209fd9e4bd2f1ce71bef3c15a4988838ab5b35f147dbbee68"
  ]
] as const)

function source(path: string): string {
  const pin = SOURCE_PINS.find(([name]) => name === path)
  assert.ok(pin, 'unlisted PAI1 proof source')
  const bytes = readFileSync(new URL(path, import.meta.url))
  assert.equal(digest(bytes), pin[1], 'source drift requires independent review')
  return bytes.toString('utf8')
}
const install = source('./install-candidate.sql')
const pg1Install = source('../official-truth-v3-private-owner-guards-1/install-candidate.sql')
const observed = JSON.parse(source('./observed-baseline.json')) as {
  portableExpectedShape: unknown
  e10b: { bound_user_triggers: { function_definition: string; function_body_sha256: string }[] }
  e10c: { profile_predicates: { name: string; definition: string; body_sha256: string }[] }
}
const FIXTURE_SQL = "CREATE ROLE postgres LOGIN INHERIT NOSUPERUSER BYPASSRLS CREATEDB CREATEROLE REPLICATION;\nCREATE ROLE anon NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS;\nCREATE ROLE authenticated NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS;\nCREATE ROLE authenticator NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS;\nCREATE ROLE service_role NOLOGIN NOINHERIT NOSUPERUSER BYPASSRLS;\nCREATE ROLE supabase_auth_admin LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;\nCREATE ROLE pai1_human LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;\nCREATE ROLE pai1_service LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;\nCREATE ROLE pai1_alien NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS;\nGRANT authenticated TO pai1_human WITH ADMIN FALSE, INHERIT FALSE, SET TRUE;\nGRANT service_role TO pai1_service WITH ADMIN FALSE, INHERIT FALSE, SET TRUE;\nALTER DATABASE postgres OWNER TO postgres;\nSET ROLE postgres;\nGRANT USAGE ON SCHEMA public TO postgres,anon,authenticated,service_role;\nALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO postgres,service_role;\nRESET ROLE;\nCREATE SCHEMA auth AUTHORIZATION supabase_auth_admin;\nSET ROLE supabase_auth_admin;\nCREATE TYPE auth.aal_level AS ENUM('aal1','aal2','aal3');\nCREATE TABLE auth.users(id uuid PRIMARY KEY, email text,raw_user_meta_data jsonb DEFAULT '{}'::jsonb,\n  deleted_at timestamptz,banned_until timestamptz,is_anonymous boolean NOT NULL DEFAULT false);\nCREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,\n  aal auth.aal_level,not_after timestamptz);\nALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;\nALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;\nCREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $auth_jwt$\n  select \n    coalesce(\n        nullif(current_setting('request.jwt.claim', true), ''),\n        nullif(current_setting('request.jwt.claims', true), '')\n    )::jsonb\n$auth_jwt$;\nCREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $auth_uid$\n  select \n  coalesce(\n    nullif(current_setting('request.jwt.claim.sub', true), ''),\n    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')\n  )::uuid\n$auth_uid$;\nREVOKE ALL ON FUNCTION auth.jwt(),auth.uid() FROM PUBLIC;\nGRANT USAGE ON SCHEMA auth TO postgres,authenticated,service_role;\nGRANT EXECUTE ON FUNCTION auth.jwt(),auth.uid() TO postgres,authenticated,service_role;\nGRANT SELECT,UPDATE ON auth.users,auth.sessions TO postgres;\nGRANT REFERENCES(id) ON auth.users TO postgres;\nRESET ROLE;\nSET ROLE postgres;\nCREATE FUNCTION public.uuid_generate_v4() RETURNS uuid LANGUAGE sql VOLATILE PARALLEL SAFE\nSET search_path=pg_catalog AS $synthetic_uuid$SELECT pg_catalog.gen_random_uuid()$synthetic_uuid$;\nCREATE OR REPLACE FUNCTION public.rollenrang(rolle text)\n RETURNS integer\n LANGUAGE sql\n IMMUTABLE PARALLEL SAFE\n SET search_path TO 'pg_catalog'\nAS $function$\n  select case rolle\n           when 'user'      then 0\n           when 'creator'   then 10\n           when 'moderator' then 20\n           when 'operator'  then 30\n           when 'admin'     then 40\n           when 'owner'     then 50\n         end\n$function$\n;\nCREATE TABLE public.profiles(\n id uuid NOT NULL DEFAULT public.uuid_generate_v4(),\n user_id uuid NOT NULL,role text NOT NULL DEFAULT 'user',\n created_at timestamptz DEFAULT timezone('utc'::text,now()),\n pai1_dropped_5 text,avatar_url text,\n pai1_dropped_7 text,pai1_dropped_8 text,pai1_dropped_9 text,pai1_dropped_10 text,\n pai1_dropped_11 text,pai1_dropped_12 text,pai1_dropped_13 text,pai1_dropped_14 text,\n email text,status text NOT NULL DEFAULT 'active',last_seen_at timestamptz,display_name text,\n CONSTRAINT profiles_pkey PRIMARY KEY(id),\n CONSTRAINT profiles_user_id_key UNIQUE(user_id),\n CONSTRAINT profiles_user_id_fkey FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE,\n CONSTRAINT profiles_role_check CHECK(public.rollenrang(role) IS NOT NULL),\n CONSTRAINT profiles_status_check CHECK(status=ANY(ARRAY['active'::text,'pending'::text,'disabled'::text,'banned'::text]))\n);\nALTER TABLE public.profiles DROP COLUMN pai1_dropped_5,\n DROP COLUMN pai1_dropped_7,DROP COLUMN pai1_dropped_8,DROP COLUMN pai1_dropped_9,DROP COLUMN pai1_dropped_10,\n DROP COLUMN pai1_dropped_11,DROP COLUMN pai1_dropped_12,DROP COLUMN pai1_dropped_13,DROP COLUMN pai1_dropped_14;\nCREATE INDEX profiles_created_at_idx ON public.profiles(created_at);\nCREATE INDEX profiles_email_idx ON public.profiles(email);\nALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;\nGRANT ALL ON public.profiles TO postgres,service_role;\nGRANT SELECT,INSERT,UPDATE,DELETE ON public.profiles TO authenticated;\nCREATE OR REPLACE FUNCTION public.aktuelle_rolle()\n RETURNS text\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\n  select p.role\n  from public.profiles p\n  where p.user_id = (select auth.uid())\n  limit 1\n$function$\n;\nCREATE OR REPLACE FUNCTION public.hat_rolle_mindestens(minimum text)\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\n  select coalesce(\n           public.rollenrang(public.aktuelle_rolle()) >= public.rollenrang(minimum),\n           false)\n$function$\n;\nCREATE OR REPLACE FUNCTION public.aktuelles_admin_aal2()\n RETURNS boolean\n LANGUAGE sql\n STABLE PARALLEL SAFE\n SET search_path TO 'pg_catalog'\nAS $function$\n  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false)\n$function$\n;\nCREATE OR REPLACE FUNCTION public.darf_konten_verwalten()\n RETURNS boolean\n LANGUAGE sql\n STABLE PARALLEL SAFE\n SET search_path TO 'pg_catalog'\nAS $function$\n  select public.hat_rolle_mindestens('moderator')\n     and public.aktuelles_admin_aal2()\n$function$\n;\nCREATE OR REPLACE FUNCTION public.profil_kerndaten_aus_auth()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'pg_catalog', 'public'\nAS $function$\nbegin\n  update public.profiles p\n  set\n    email = coalesce(u.email, p.email),\n    display_name = coalesce(\n      p.display_name,\n      (u.raw_user_meta_data ->> 'full_name'),\n      (u.raw_user_meta_data ->> 'name'),\n      split_part(u.email, '@', 1)\n    )\n  from auth.users u\n  where p.user_id = new.user_id and u.id = new.user_id;\n  return new;\nend\n$function$\n;\nCREATE OR REPLACE FUNCTION public.profil_rollenwechsel_pruefen()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\ndeclare\n  handelnder uuid := (select auth.uid());\n  rang_handelnder integer;\nbegin\n  if handelnder is null then\n    return new;\n  end if;\n\n  rang_handelnder := public.rollenrang(public.aktuelle_rolle());\n\n  if tg_op = 'INSERT' then\n    if new.user_id = handelnder then\n      if new.role is distinct from 'user' then\n        raise exception 'Ein neues eigenes Profil erhält immer die Rolle user.'\n          using errcode = 'check_violation';\n      end if;\n      if new.status is distinct from 'active' then\n        raise exception 'Ein neues eigenes Profil erhält immer den Status active.'\n          using errcode = 'check_violation';\n      end if;\n      return new;\n    end if;\n\n    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then\n      raise exception 'Keine Berechtigung, Profile für andere Konten anzulegen.'\n        using errcode = 'insufficient_privilege';\n    end if;\n    if rang_handelnder < public.rollenrang('owner')\n       and rang_handelnder <= coalesce(public.rollenrang(new.role), -1) then\n      raise exception 'Diese Rolle liegt nicht unterhalb der eigenen.'\n        using errcode = 'insufficient_privilege';\n    end if;\n\n    return new;\n  end if;\n\n  if new.role is distinct from old.role then\n    if old.user_id = handelnder then\n      raise exception 'Die eigene Rolle lässt sich nicht ändern.'\n        using errcode = 'check_violation';\n    end if;\n    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then\n      raise exception 'Keine Berechtigung, Rollen zu vergeben.'\n        using errcode = 'insufficient_privilege';\n    end if;\n    if rang_handelnder < public.rollenrang('owner')\n       and (rang_handelnder <= coalesce(public.rollenrang(old.role), -1)\n            or rang_handelnder <= coalesce(public.rollenrang(new.role), -1)) then\n      raise exception 'Diese Rolle liegt nicht unterhalb der eigenen.'\n        using errcode = 'insufficient_privilege';\n    end if;\n  end if;\n\n  if new.status is distinct from old.status then\n    if old.user_id = handelnder then\n      raise exception 'Der eigene Kontostatus lässt sich nicht ändern.'\n        using errcode = 'check_violation';\n    end if;\n    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then\n      raise exception 'Keine Berechtigung, den Kontostatus zu ändern.'\n        using errcode = 'insufficient_privilege';\n    end if;\n  end if;\n\n  return new;\nend\n$function$\n;\nREVOKE ALL ON FUNCTION public.aktuelle_rolle() FROM PUBLIC;\nREVOKE ALL ON FUNCTION public.aktuelles_admin_aal2() FROM PUBLIC;\nREVOKE ALL ON FUNCTION public.darf_konten_verwalten() FROM PUBLIC;\nREVOKE ALL ON FUNCTION public.hat_rolle_mindestens(text) FROM PUBLIC;\nREVOKE ALL ON FUNCTION public.profil_kerndaten_aus_auth() FROM PUBLIC;\nREVOKE ALL ON FUNCTION public.profil_rollenwechsel_pruefen() FROM PUBLIC;\nREVOKE ALL ON FUNCTION public.rollenrang(text) FROM PUBLIC;\nGRANT EXECUTE ON FUNCTION public.aktuelle_rolle() TO authenticated;\nGRANT EXECUTE ON FUNCTION public.aktuelles_admin_aal2() TO authenticated;\nGRANT EXECUTE ON FUNCTION public.darf_konten_verwalten() TO authenticated;\nGRANT EXECUTE ON FUNCTION public.hat_rolle_mindestens(text) TO authenticated;\nGRANT EXECUTE ON FUNCTION public.rollenrang(text) TO authenticated;\nCREATE POLICY profiles_lesen ON public.profiles FOR SELECT TO authenticated\n USING ((user_id=(SELECT auth.uid())) OR public.darf_konten_verwalten());\nCREATE POLICY profiles_aendern ON public.profiles FOR UPDATE TO authenticated\n USING ((user_id=(SELECT auth.uid())) OR public.darf_konten_verwalten())\n WITH CHECK ((user_id=(SELECT auth.uid())) OR public.darf_konten_verwalten());\nCREATE POLICY profiles_anlegen ON public.profiles FOR INSERT TO authenticated WITH CHECK(user_id=(SELECT auth.uid()));\nCREATE POLICY profiles_loeschen ON public.profiles FOR DELETE TO authenticated\n USING ((user_id=(SELECT auth.uid())) OR public.darf_konten_verwalten());\nCREATE TRIGGER profiles_kerndaten_aus_auth AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profil_kerndaten_aus_auth();\nCREATE TRIGGER profiles_rollenwechsel BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profil_rollenwechsel_pruefen();\nRESET ROLE;\n"
const CATALOG_SQL = "SELECT pg_catalog.jsonb_build_object(\n  'relation',(SELECT pg_catalog.jsonb_build_object(\n    'owner',pg_catalog.pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,'kind',c.relkind,\n    'acl',(SELECT pg_catalog.jsonb_agg(a::text ORDER BY a::text) FROM pg_catalog.unnest(COALESCE(c.relacl,pg_catalog.acldefault('r',c.relowner))) a))\n    FROM pg_catalog.pg_class c WHERE c.oid='public.profiles'::pg_catalog.regclass),\n  'columns',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(\n    'name',a.attname,'type',pg_catalog.format_type(a.atttypid,a.atttypmod),'number',a.attnum,\n    'default',pg_catalog.pg_get_expr(d.adbin,d.adrelid),'raw_acl',a.attacl,\n    'identity',a.attidentity,'not_null',a.attnotnull,\n    'collation',CASE WHEN a.attcollation=0 THEN NULL ELSE a.attcollation::pg_catalog.regcollation::text END,\n    'generated',a.attgenerated) ORDER BY a.attnum)\n    FROM pg_catalog.pg_attribute a LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum\n    WHERE a.attrelid='public.profiles'::pg_catalog.regclass AND a.attnum>0 AND NOT a.attisdropped),'[]'::jsonb),\n  'constraints',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(\n    'name',c.conname,'kind',c.contype,'validated',c.convalidated,'definition',pg_catalog.pg_get_constraintdef(c.oid,true)) ORDER BY c.conname)\n    FROM pg_catalog.pg_constraint c WHERE c.conrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb),\n  'policies',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(\n    'name',p.polname,'roles',(SELECT pg_catalog.jsonb_agg(CASE WHEN r=0 THEN 'PUBLIC' ELSE pg_catalog.pg_get_userbyid(r) END ORDER BY r) FROM pg_catalog.unnest(p.polroles) r),\n    'using',pg_catalog.pg_get_expr(p.polqual,p.polrelid),'command',p.polcmd,'permissive',p.polpermissive,\n    'with_check',pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid)) ORDER BY p.polname)\n    FROM pg_catalog.pg_policy p WHERE p.polrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb),\n  'functions',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(\n    'set',p.proretset,'kind',p.prokind,'name',p.proname,'owner',pg_catalog.pg_get_userbyid(p.proowner),\n    'config',p.proconfig,'strict',p.proisstrict,\n    'raw_acl',(SELECT pg_catalog.jsonb_agg(a::text ORDER BY a::text) FROM pg_catalog.unnest(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a),\n    'returns',pg_catalog.pg_get_function_result(p.oid),'defaults',p.pronargdefaults,'language',l.lanname,'parallel',p.proparallel,\n    'arguments',pg_catalog.pg_get_function_identity_arguments(p.oid),'leakproof',p.proleakproof,'volatility',p.provolatile,\n    'body_sha256',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex'),\n    'security_definer',p.prosecdef,'definition',pg_catalog.pg_get_functiondef(p.oid)) ORDER BY p.proname,p.oid)\n    FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace JOIN pg_catalog.pg_language l ON l.oid=p.prolang\n    WHERE n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','darf_konten_verwalten',\n      'hat_rolle_mindestens','profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang')),'[]'::jsonb),\n  'triggers',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(\n    'name',t.tgname,'type',t.tgtype,'enabled',t.tgenabled,'attributes',t.tgattr::text,\n    'definition',pg_catalog.pg_get_triggerdef(t.oid,true),'function_name',p.proname) ORDER BY t.tgname)\n    FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_proc p ON p.oid=t.tgfoid\n    WHERE t.tgrelid='public.profiles'::pg_catalog.regclass AND NOT t.tgisinternal\n      AND t.tgname<>'profiles_autoritaet_integritaet_v1'),'[]'::jsonb),\n  'incoming_profile_foreign_keys',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(\n    'oid',c.oid,'name',c.conname,'relation_schema',n.nspname,'relation',r.relname,\n    'validated',c.convalidated,'deferrable',c.condeferrable,'deferred',c.condeferred,\n    'definition',pg_catalog.pg_get_constraintdef(c.oid,true)) ORDER BY n.nspname,r.relname,c.conname)\n    FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_class r ON r.oid=c.conrelid JOIN pg_catalog.pg_namespace n ON n.oid=r.relnamespace\n    WHERE c.contype='f' AND c.confrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb)\n) AS value"
const PRESERVED_SQL = "SELECT pg_catalog.jsonb_build_object(\n 'profile_relation',(SELECT pg_catalog.to_jsonb(c) FROM pg_catalog.pg_class c WHERE c.oid='public.profiles'::pg_catalog.regclass),\n 'profile_attributes',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a WHERE a.attrelid='public.profiles'::pg_catalog.regclass AND a.attnum>0),\n 'profile_defaults',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.adnum) FROM pg_catalog.pg_attrdef d WHERE d.adrelid='public.profiles'::pg_catalog.regclass),\n 'profile_constraints',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(c) ORDER BY c.oid) FROM pg_catalog.pg_constraint c WHERE c.conrelid='public.profiles'::pg_catalog.regclass OR c.confrelid='public.profiles'::pg_catalog.regclass),\n 'profile_indexes',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('index',pg_catalog.to_jsonb(i),'relation',pg_catalog.to_jsonb(c),'definition',pg_catalog.pg_get_indexdef(i.indexrelid)) ORDER BY i.indexrelid)\n   FROM pg_catalog.pg_index i JOIN pg_catalog.pg_class c ON c.oid=i.indexrelid WHERE i.indrelid='public.profiles'::pg_catalog.regclass),\n 'profile_policies',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_policy p WHERE p.polrelid='public.profiles'::pg_catalog.regclass),\n 'old_triggers',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) FROM pg_catalog.pg_trigger t\n   WHERE t.tgrelid='public.profiles'::pg_catalog.regclass AND t.tgname<>'profiles_autoritaet_integritaet_v1'),\n 'old_functions',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace\n   WHERE n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','darf_konten_verwalten','hat_rolle_mindestens','profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang')),\n 'public_namespace',(SELECT pg_catalog.to_jsonb(n) FROM pg_catalog.pg_namespace n WHERE n.nspname='public'),\n 'creator_defaults',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.oid) FROM pg_catalog.pg_default_acl d\n   WHERE d.defaclrole='postgres'::pg_catalog.regrole AND (d.defaclnamespace=0 OR d.defaclnamespace='public'::pg_catalog.regnamespace)),\n 'principals',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('oid',r.oid,'name',r.rolname,'super',r.rolsuper,\n   'inherit',r.rolinherit,'create_role',r.rolcreaterole,'create_db',r.rolcreatedb,'login',r.rolcanlogin,\n   'replication',r.rolreplication,'bypass',r.rolbypassrls,'connection_limit',r.rolconnlimit) ORDER BY r.oid)\n   FROM pg_catalog.pg_roles r WHERE r.rolname IN ('postgres','authenticated','anon','authenticator','service_role','pg_database_owner','supabase_auth_admin')),\n 'principal_memberships',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(m) ORDER BY m.oid) FROM pg_catalog.pg_auth_members m\n   WHERE m.roleid IN (SELECT oid FROM pg_catalog.pg_roles WHERE rolname IN ('postgres','authenticated','anon','authenticator','service_role','pg_database_owner','supabase_auth_admin'))\n      OR m.member IN (SELECT oid FROM pg_catalog.pg_roles WHERE rolname IN ('postgres','authenticated','anon','authenticator','service_role','pg_database_owner','supabase_auth_admin')))\n) AS value"
const OLD_ROLE_DEFINITION = "CREATE OR REPLACE FUNCTION public.profil_rollenwechsel_pruefen()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\ndeclare\n  handelnder uuid := (select auth.uid());\n  rang_handelnder integer;\nbegin\n  if handelnder is null then\n    return new;\n  end if;\n\n  rang_handelnder := public.rollenrang(public.aktuelle_rolle());\n\n  if tg_op = 'INSERT' then\n    if new.user_id = handelnder then\n      if new.role is distinct from 'user' then\n        raise exception 'Ein neues eigenes Profil erhält immer die Rolle user.'\n          using errcode = 'check_violation';\n      end if;\n      if new.status is distinct from 'active' then\n        raise exception 'Ein neues eigenes Profil erhält immer den Status active.'\n          using errcode = 'check_violation';\n      end if;\n      return new;\n    end if;\n\n    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then\n      raise exception 'Keine Berechtigung, Profile für andere Konten anzulegen.'\n        using errcode = 'insufficient_privilege';\n    end if;\n    if rang_handelnder < public.rollenrang('owner')\n       and rang_handelnder <= coalesce(public.rollenrang(new.role), -1) then\n      raise exception 'Diese Rolle liegt nicht unterhalb der eigenen.'\n        using errcode = 'insufficient_privilege';\n    end if;\n\n    return new;\n  end if;\n\n  if new.role is distinct from old.role then\n    if old.user_id = handelnder then\n      raise exception 'Die eigene Rolle lässt sich nicht ändern.'\n        using errcode = 'check_violation';\n    end if;\n    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then\n      raise exception 'Keine Berechtigung, Rollen zu vergeben.'\n        using errcode = 'insufficient_privilege';\n    end if;\n    if rang_handelnder < public.rollenrang('owner')\n       and (rang_handelnder <= coalesce(public.rollenrang(old.role), -1)\n            or rang_handelnder <= coalesce(public.rollenrang(new.role), -1)) then\n      raise exception 'Diese Rolle liegt nicht unterhalb der eigenen.'\n        using errcode = 'insufficient_privilege';\n    end if;\n  end if;\n\n  if new.status is distinct from old.status then\n    if old.user_id = handelnder then\n      raise exception 'Der eigene Kontostatus lässt sich nicht ändern.'\n        using errcode = 'check_violation';\n    end if;\n    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then\n      raise exception 'Keine Berechtigung, den Kontostatus zu ändern.'\n        using errcode = 'insufficient_privilege';\n    end if;\n  end if;\n\n  return new;\nend\n$function$\n"
const GUARD_BODY_SHA256 = 'b513eca8cc5d7b3981d9b9eb1473428e628410dcb0f4b718290d4cc314756a8d'

const NEW_OBJECT_SQL = "SELECT p.oid::text AS function_oid,p.proowner::regrole::text AS owner,p.prosecdef::text,p.proconfig::text,p.proacl::text,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') AS body_sha256,t.oid::text AS trigger_oid,t.tgtype::text,t.tgenabled,t.tgargs::text,t.tgattr::text FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace LEFT JOIN pg_catalog.pg_trigger t ON t.tgfoid=p.oid AND t.tgrelid='public.profiles'::regclass WHERE n.nspname='public' AND p.proname='profil_autoritaet_integritaet_pruefen_v1' ORDER BY p.oid,t.oid"
const IDENTITY_SQL = "SELECT pg_catalog.pg_backend_pid()::text AS pid,backend_start::text AS birth FROM pg_catalog.pg_stat_activity WHERE pid=pg_catalog.pg_backend_pid()"
// The install itself compares the FULL raw catalog under its table lock.
// Across this fixture's deliberate row churn, autovacuum may legitimately update
// only these physical statistics/freeze horizons. Keep every object identity,
// definition, binding, storage identity, ACL, default and role field in this
// separate end-of-scenarios comparison; do not normalize the installer snapshot.
function stableAcrossFixtureDml(value: unknown): unknown {
  const copy = JSON.parse(JSON.stringify(value)) as {
    profile_relation: Record<string, unknown>
    profile_indexes: { relation: Record<string, unknown> }[]
  }
  for (const relation of [copy.profile_relation, ...copy.profile_indexes.map(index => index.relation)]) {
    for (const key of ['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']) delete relation[key]
  }
  return copy
}

type Terminal = Awaited<ReturnType<OwnedTestLifetime['dispose']>>
type Budget = { clusters: number; connections: number; operations: number }
type Identity = { pid: string; birth: string }
const sqlState = (code: string) => (error: unknown) => error instanceof LocalPgError && error.code === code
const uid = (n: number) => n.toString(16).padStart(8, '0') + '-1111-4111-8111-' + n.toString(16).padStart(12, '0')
const USERS = Object.freeze({ owner: 1, moderator: 2, operator: 3, admin: 4, creator: 5, user: 6, peerOwner: 7, recipient: 8, blank: 9, target: 10 })
const PROFILES: readonly (readonly [number, string])[] = [[1,'owner'],[2,'moderator'],[3,'operator'],[4,'admin'],[5,'creator'],[6,'user'],[7,'owner'],[10,'user']]
const claims = (n: number, changes: Readonly<Record<string, unknown>> = {}) => ({
  sub: uid(n), session_id: uid(n + 200), role: 'authenticated', aal: 'aal2',
  exp: Math.floor(Date.now() / 1000) + 300, ...changes,
})
function observe<T>(promise: Promise<T>) {
  let settled = false
  const result = promise.then(value => { settled = true; return { ok: true as const, value } },
    error => { settled = true; return { ok: false as const, error: error as unknown } })
  return { result, settled: () => settled }
}
function newCluster(lifetime: OwnedTestLifetime, budget: Budget): LocalProofCluster {
  assert.ok(++budget.clusters <= MAX_CLUSTERS, 'finite owned-cluster inventory')
  const cluster = lifetime.startCluster(startLocalProofCluster)
  assertOwnedLocalProofCluster(cluster)
  return cluster
}
async function connect(budget: Budget, cluster: LocalProofCluster, login = cluster.user): Promise<LocalPgConnection> {
  assert.ok(++budget.connections <= MAX_CONNECTIONS, 'finite cumulative connection inventory')
  const connection = await LocalPgConnection.connect(cluster, login)
  const query = connection.query.bind(connection)
  connection.query = (...args) => {
    assert.ok(++budget.operations <= MAX_OPERATIONS, 'finite cumulative operation inventory')
    return query(...args)
  }
  return connection
}
async function candidate(connection: LocalPgConnection, sql = install): Promise<void> {
  try { await connection.query(sql) }
  catch (error) {
    try { await connection.query('ROLLBACK') }
    catch (cleanupError) { throw new AggregateError([error, cleanupError], 'pai1 candidate and rollback failed') }
    throw error
  }
}
async function setClaims(connection: LocalPgConnection, value: unknown): Promise<void> {
  const encoded = JSON.stringify(value)
  assert.ok(typeof encoded === 'string')
  await connection.query("SELECT pg_catalog.set_config('request.jwt.claim','',false) AS claim_reset,pg_catalog.set_config('request.jwt.claim.sub','',false) AS sub_reset,pg_catalog.set_config('request.jwt.claims',$1,false) AS claims_value", [pgText(encoded)])
}
async function fixture(lifetime: OwnedTestLifetime, budget: Budget) {
  const cluster = newCluster(lifetime, budget)
  const bootstrap = await connect(budget, cluster)
  const version = Number((await bootstrap.query("SELECT current_setting('server_version_num') AS version"))[0]?.version)
  assert.ok(version >= 170000 && version < 180000, 'mandatory actual PostgreSQL 17')
  await bootstrap.query(FIXTURE_SQL)
  const creator = await connect(budget, cluster, 'postgres')
  const creatorIdentity = (await creator.query("SELECT session_user,current_user,r.rolsuper::text,r.rolcanlogin::text FROM pg_catalog.pg_roles r WHERE r.rolname=current_user"))[0]
  assert.deepEqual(creatorIdentity, { session_user: 'postgres', current_user: 'postgres', rolsuper: 'false', rolcanlogin: 'true' })
  const human = await connect(budget, cluster, 'pai1_human')
  await human.query('SET ROLE authenticated')
  const service = await connect(budget, cluster, 'pai1_service')
  await service.query('SET ROLE service_role')
  const authBackend = await connect(budget, cluster, 'supabase_auth_admin')
  const observer = await connect(budget, cluster)
  await observer.query("SET statement_timeout='1s'; SET lock_timeout='1s'")
  await bootstrap.query('SET search_path=pg_catalog,public,extensions')
  const shape = async () => JSON.parse((await bootstrap.query(CATALOG_SQL))[0]!.value!) as unknown
  const preserved = async () => JSON.parse((await bootstrap.query(PRESERVED_SQL))[0]!.value!) as unknown
  const newObjects = () => bootstrap.query(NEW_OBJECT_SQL)
  const rows = () => bootstrap.query("SELECT id::text,user_id::text,role,created_at::text,avatar_url,email,status,last_seen_at::text,display_name FROM public.profiles ORDER BY user_id")
  const reset = async () => {
    // Owned fixture preparation uses the real Auth-owner DELETE/FK path.
    // No TRUNCATE, disabled guard, suppressed DELETE or changed storage identity.
    await authBackend.query('DELETE FROM auth.users')
    for (let n = 1; n <= 10; n++) {
      await bootstrap.query("INSERT INTO auth.users(id,email) VALUES($1::uuid,$2::text);", [pgText(uid(n)), pgText('pai1-fixture-' + n + '@example.invalid')])
      await bootstrap.query("INSERT INTO auth.sessions(id,user_id,aal) VALUES($1::uuid,$2::uuid,'aal2')", [pgText(uid(n + 200)), pgText(uid(n))])
    }
    for (const [n, role] of PROFILES) {
      await creator.query("INSERT INTO public.profiles(id,user_id,role,status) VALUES($1::uuid,$2::uuid,$3::text,'active')",
        [pgText(uid(n + 100)), pgText(uid(n)), pgText(role)])
    }
  }
  const asHuman = async (n: number, sql: string, parameters: readonly ReturnType<typeof pgText>[] = [], changes: Readonly<Record<string, unknown>> = {}) => {
    await setClaims(human, claims(n, changes))
    return human.query(sql, parameters)
  }
  const update = (n: number, target: number, field: 'status' | 'role' | 'id' | 'user_id', value: string) =>
    asHuman(n, 'UPDATE public.profiles SET ' + field + '=$1::' + (field === 'id' || field === 'user_id' ? 'uuid' : 'text') + ' WHERE user_id=$2::uuid RETURNING id::text',
      [pgText(value), pgText(uid(target))])
  const remove = (n: number, target: number) => asHuman(n, 'DELETE FROM public.profiles WHERE user_id=$1::uuid RETURNING id::text', [pgText(uid(target))])
  await reset()
  assert.deepEqual(await shape(), observed.portableExpectedShape, 'fixture reproduces the observed profile authority contract')
  const helperPins = await bootstrap.query("SELECT p.proname,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') AS digest FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='auth' AND p.proname IN ('uid','jwt') ORDER BY p.proname")
  assert.deepEqual(helperPins, [
    { proname: 'jwt', digest: 'fed2a8ac0349ffaba807c1b574698bfb1348825b8ef5163ad72d8408386f5e3e' },
    { proname: 'uid', digest: '9ab5ea099e74ec09e83b1505c51a3647791195aed7c742dcc3f257dfc7d2f300' },
  ])
  return { cluster, bootstrap, creator, human, service, authBackend, observer, shape, preserved, newObjects, rows, reset, asHuman, update, remove, version, creatorIdentity }
}
type Fixture = Awaited<ReturnType<typeof fixture>>
async function unchangedRefusal(db: Fixture, operation: () => Promise<unknown>, code: string): Promise<void> {
  const before = await db.rows()
  await assert.rejects(operation(), sqlState(code))
  assert.deepEqual(await db.rows(), before, 'refused operation changed profile rows')
}
async function waitUntil(lifetime: OwnedTestLifetime, check: () => Promise<boolean>): Promise<void> {
  const cutoff = performance.now() + 3000
  do { if (await check()) return; await lifetime.wait(10) } while (performance.now() < cutoff)
  assert.fail('actual bounded native wait not observed')
}
async function cleanupWitness(parent: OwnedTestLifetime, budget: Budget, mode: 'failure' | 'timeout') {
  const controller = new AbortController()
  // false is intentional: cleanup must not turn a falsy thrown cause into PASS.
  const marker: unknown = mode === 'failure' ? false : Error('pai1_owned_timeout')
  const lifetime = new OwnedTestLifetime(AbortSignal.any([parent.signal, controller.signal]))
  lifetime.installConnectOwnership()
  let timer: ReturnType<typeof setTimeout> | undefined
  let timerFired = false, expectedFailure = false, failed = false, failure: unknown
  let terminal: Terminal | undefined, cluster: LocalProofCluster | undefined
  let pending: ReturnType<typeof observe<PgRows>> | undefined
  try {
    cluster = newCluster(lifetime, budget)
    const target = await connect(budget, cluster), observer = await connect(budget, cluster)
    const identity = (await target.query(IDENTITY_SQL))[0] as Identity
    assert.ok(identity.pid && identity.birth)
    pending = observe(target.query('SELECT pg_catalog.pg_sleep(25)'))
    await waitUntil(lifetime, async () => {
      const rows = await observer.query("SELECT state,wait_event FROM pg_catalog.pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz",
        [pgText(identity.pid, 23), pgText(identity.birth)])
      return !pending!.settled() && rows[0]?.state === 'active' && rows[0]?.wait_event === 'PgSleep'
    })
    if (mode === 'failure') throw marker
    timer = setTimeout(() => { timerFired = true; controller.abort(marker) }, 25)
    await lifetime.wait(1000)
    assert.fail('owned timeout did not abort')
  } catch (error) {
    if (error === marker) expectedFailure = true
    else { failed = true; failure = error }
  } finally {
    clearTimeout(timer)
    if (!controller.signal.aborted) controller.abort(marker)
    try {
      terminal = await lifetime.dispose()
      assert.ok(pending, 'an actual original query must exist')
      assert.equal((await pending.result).ok, false)
      assert.ok(cluster && !existsSync(cluster.root))
      assert.equal(terminal.started, terminal.settled)
      assert.equal(terminal.pending, 0)
      assert.equal(terminal.connections, terminal.closed)
      assert.equal(terminal.stoppedClusters, 1)
    } catch (error) {
      failure = failed ? new AggregateError([failure, error], 'pai1 witness and cleanup failed') : error
      failed = true
    }
  }
  if (failed) throw failure
  assert.equal(expectedFailure, true)
  assert.equal(timerFired, mode === 'timeout')
  assert.ok(terminal)
  return { mode, falsyFailureCause: mode === 'failure', actualWaitObserved: true, originalQueryJoined: true, timerFired, terminal }
}

const GROUPS = Object.freeze([
  'PAI1-01 exact old contract reproduces three defects and disproves the one-account sequence',
  'PAI1-02 wrong creator, baseline drift, defaults and collisions refuse atomically',
  'PAI1-03 real NOSUPERUSER LOGIN postgres installs exactly the additive guard',
  'PAI1-04 both identity keys and upsert updates are immutable in every selected context',
  'PAI1-05 full foreign status/delete rank matrix and existing own-profile semantics',
  'PAI1-06 original INSERT/role rules and missing, malformed or unknown authority stay closed',
  'PAI1-07 denied rebind cannot satisfy unchanged private PG1 authority',
  'PAI1-08 actual Auth cascade and existing privileged null-actor maintenance remain valid',
  'PAI1-09 complete old catalog is retained and new function execution rights remain closed',
  'PAI1-10 actual failure and timeout join pending work and stop every owned cluster',
] as const)

export async function runProfileAuthorityIntegrityNative(t: TestContext): Promise<void> {
  const started = performance.now(), cutoff = new AbortController()
  const timer = setTimeout(() => cutoff.abort(Error('pai1_effect_budget_expired')), EFFECT_MS)
  const lifetime = new OwnedTestLifetime(AbortSignal.any([t.signal, cutoff.signal]))
  lifetime.installConnectOwnership()
  const budget: Budget = { clusters: 0, connections: 0, operations: 0 }
  const completed: string[] = []
  const cleanup: Awaited<ReturnType<typeof cleanupWitness>>[] = []
  let db: Fixture | undefined, terminal: Terminal | undefined
  let failed = false, failure: unknown, effectEnded = started, cleanupEnded = started
  let originalCatalog: unknown, cascadeContext: string | null = null
  let matrixPairs = 0
  const group = async (index: number, work: () => Promise<void>) => {
    lifetime.check()
    assert.ok(performance.now() - started < EFFECT_MS, 'whole proof effect deadline')
    let passed = false
    await t.test(GROUPS[index]!, async () => {
      await work()
      lifetime.check()
      assert.ok(performance.now() - started < EFFECT_MS, 'whole proof effect deadline')
      passed = true
    })
    assert.equal(passed, true, GROUPS[index] + ' did not complete')
    completed.push(GROUPS[index]!)
  }
  try {
    for (const [path] of SOURCE_PINS) source(path)
    db = await fixture(lifetime, budget)
    const f = db
    originalCatalog = stableAcrossFixtureDml(await f.preserved())

    await group(0, async () => {
      assert.equal((await f.update(USERS.moderator, USERS.owner, 'user_id', uid(USERS.recipient))).length, 1)
      assert.equal((await f.rows()).find(row => row.user_id === uid(USERS.recipient))?.role, 'owner')
      assert.equal((await f.rows()).find(row => row.user_id === uid(USERS.moderator))?.role, 'moderator')
      await f.reset()
      assert.equal((await f.update(USERS.moderator, USERS.owner, 'status', 'disabled')).length, 1)
      assert.equal((await f.rows()).find(row => row.user_id === uid(USERS.owner))?.status, 'disabled')
      await f.reset()
      assert.equal((await f.remove(USERS.moderator, USERS.owner)).length, 1)
      assert.equal((await f.rows()).some(row => row.user_id === uid(USERS.owner)), false)
      await f.reset()
      assert.equal((await f.remove(USERS.moderator, USERS.moderator)).length, 1)
      const before = await f.rows()
      assert.equal((await f.update(USERS.moderator, USERS.owner, 'user_id', uid(USERS.moderator))).length, 0)
      assert.deepEqual(await f.rows(), before)
      assert.equal((await f.human.query('SELECT public.aktuelle_rolle() AS role'))[0]?.role, null)
      await f.reset()
    })

    await group(1, async () => {
      const clean = await f.preserved()
      await assert.rejects(candidate(f.bootstrap), sqlState('P7902'))
      assert.deepEqual(await f.preserved(), clean)
      assert.deepEqual(await f.newObjects(), [])

      const changed = OLD_ROLE_DEFINITION.replace('  return new;\nend\n', '  return new; -- intentional owned-fixture drift\nend\n')
      assert.notEqual(changed, OLD_ROLE_DEFINITION)
      await f.bootstrap.query(changed)
      const drift = await f.preserved()
      await assert.rejects(candidate(f.creator), sqlState('P7904'))
      assert.deepEqual(await f.preserved(), drift)
      assert.deepEqual(await f.newObjects(), [])
      await f.bootstrap.query(OLD_ROLE_DEFINITION)
      assert.deepEqual(await f.preserved(), clean)

      await f.creator.query('ALTER TABLE public.profiles DISABLE TRIGGER profiles_rollenwechsel')
      const disabled = await f.preserved()
      await assert.rejects(candidate(f.creator), sqlState('P7904'))
      assert.deepEqual(await f.preserved(), disabled)
      await f.creator.query('ALTER TABLE public.profiles ENABLE TRIGGER profiles_rollenwechsel')
      assert.deepEqual(await f.preserved(), clean)

      await f.creator.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO pai1_alien')
      const extraDefault = await f.preserved()
      await assert.rejects(candidate(f.creator), sqlState('P7903'))
      assert.deepEqual(await f.preserved(), extraDefault)
      assert.deepEqual(await f.newObjects(), [])
      await f.creator.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM pai1_alien')
      assert.deepEqual(await f.preserved(), clean)

      await f.creator.query("CREATE FUNCTION public.profil_autoritaet_integritaet_pruefen_v1() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN RETURN NEW; END $$")
      const foreignFunction = await f.newObjects()
      await assert.rejects(candidate(f.creator), sqlState('P7903'))
      assert.deepEqual(await f.newObjects(), foreignFunction)
      await f.creator.query('DROP FUNCTION public.profil_autoritaet_integritaet_pruefen_v1() RESTRICT')
      await f.creator.query('CREATE TRIGGER profiles_autoritaet_integritaet_v1 BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profil_rollenwechsel_pruefen()')
      const foreignTrigger = await f.bootstrap.query("SELECT oid::text,tgfoid::text,tgtype::text FROM pg_catalog.pg_trigger WHERE tgrelid='public.profiles'::regclass AND tgname='profiles_autoritaet_integritaet_v1'")
      await assert.rejects(candidate(f.creator), sqlState('P7903'))
      assert.deepEqual(await f.bootstrap.query("SELECT oid::text,tgfoid::text,tgtype::text FROM pg_catalog.pg_trigger WHERE tgrelid='public.profiles'::regclass AND tgname='profiles_autoritaet_integritaet_v1'"), foreignTrigger)
      await f.creator.query('DROP TRIGGER profiles_autoritaet_integritaet_v1 ON public.profiles RESTRICT')
      assert.deepEqual(await f.preserved(), clean)
    })

    await group(2, async () => {
      const before = await f.preserved()
      await candidate(f.creator)
      assert.deepEqual(await f.preserved(), before)
      assert.deepEqual(await f.shape(), observed.portableExpectedShape)
      const objects = await f.newObjects()
      assert.equal(objects.length, 1)
      assert.equal(objects[0]?.owner, 'postgres')
      assert.equal(objects[0]?.prosecdef, 'false')
      assert.equal(objects[0]?.body_sha256, GUARD_BODY_SHA256)
      assert.equal(objects[0]?.tgtype, '27')
      assert.equal(objects[0]?.tgenabled, 'O')
      assert.ok(objects[0]?.function_oid && objects[0]?.trigger_oid)
      const liveBefore = await f.newObjects()
      await assert.rejects(candidate(f.creator), sqlState('P7903'))
      assert.deepEqual(await f.newObjects(), liveBefore)
      await unchangedRefusal(f, () => f.update(USERS.moderator, USERS.owner, 'user_id', uid(USERS.recipient)), '23514')
      await unchangedRefusal(f, () => f.update(USERS.moderator, USERS.owner, 'status', 'disabled'), '42501')
      await unchangedRefusal(f, () => f.remove(USERS.moderator, USERS.owner), '42501')
      await unchangedRefusal(f, () => f.asHuman(USERS.moderator,
        "UPDATE public.profiles SET role='user',status='disabled' WHERE user_id=$1::uuid", [pgText(uid(USERS.owner))]), '42501')
    })

    await group(3, async () => {
      await f.reset()
      for (const actor of [USERS.user, USERS.moderator, USERS.owner]) {
        await unchangedRefusal(f, () => f.update(actor, actor, 'id', uid(actor + 500)), '23514')
        await unchangedRefusal(f, () => f.update(actor, actor, 'user_id', uid(USERS.recipient)), '23514')
        assert.equal((await f.asHuman(actor, 'UPDATE public.profiles SET id=id,user_id=user_id WHERE user_id=$1::uuid RETURNING id::text',
          [pgText(uid(actor))])).length, 1)
        await unchangedRefusal(f, () => f.asHuman(actor,
          "INSERT INTO public.profiles(id,user_id,role,status) VALUES($1::uuid,$2::uuid,'user','active') ON CONFLICT(user_id) DO UPDATE SET id=EXCLUDED.id RETURNING id::text",
          [pgText(uid(actor + 500)), pgText(uid(actor))]), '23514')
      }
      for (const privileged of [f.creator, f.service]) {
        await setClaims(privileged, {})
        for (const field of ['id','user_id'] as const) {
          await unchangedRefusal(f, () => privileged.query(
            'UPDATE public.profiles SET ' + field + '=$1::uuid WHERE user_id=$2::uuid RETURNING id::text',
            [pgText(field === 'id' ? uid(501) : uid(USERS.recipient)), pgText(uid(USERS.owner))]), '23514')
        }
      }
      assert.equal((await f.asHuman(USERS.user, "UPDATE public.profiles SET display_name='synthetic retained own field' WHERE user_id=$1::uuid RETURNING id::text",
        [pgText(uid(USERS.user))])).length, 1)
      assert.equal((await f.rows()).find(row => row.user_id === uid(USERS.user))?.display_name, 'synthetic retained own field')
    })

    await group(4, async () => {
      const ranks: Readonly<Record<string, number>> = { user: 0, creator: 10, moderator: 20, operator: 30, admin: 40, owner: 50 }
      const actors: readonly (readonly [number, string])[] = [[USERS.moderator,'moderator'],[USERS.operator,'operator'],[USERS.admin,'admin'],[USERS.owner,'owner']]
      for (const [actor, role] of actors) for (const targetRole of Object.keys(ranks)) {
        await f.reset()
        await f.creator.query('UPDATE public.profiles SET role=$1::text WHERE user_id=$2::uuid', [pgText(targetRole), pgText(uid(USERS.target))])
        const allowed = role === 'owner' || ranks[role]! > ranks[targetRole]!
        if (allowed) {
          assert.equal((await f.update(actor, USERS.target, 'status', 'disabled')).length, 1)
          assert.equal((await f.rows()).find(row => row.user_id === uid(USERS.target))?.status, 'disabled')
          await f.creator.query("UPDATE public.profiles SET status='active' WHERE user_id=$1::uuid", [pgText(uid(USERS.target))])
          assert.equal((await f.remove(actor, USERS.target)).length, 1)
          assert.equal((await f.rows()).some(row => row.user_id === uid(USERS.target)), false)
        } else {
          await unchangedRefusal(f, () => f.update(actor, USERS.target, 'status', 'disabled'), '42501')
          await unchangedRefusal(f, () => f.remove(actor, USERS.target), '42501')
        }
        matrixPairs++
      }
      assert.equal(matrixPairs, 24)
      await f.reset()
      for (const actor of [USERS.user, USERS.moderator, USERS.owner]) {
        await unchangedRefusal(f, () => f.update(actor, actor, 'status', 'disabled'), '23514')
      }
      assert.equal((await f.asHuman(USERS.user, 'DELETE FROM public.profiles WHERE user_id=$1::uuid RETURNING id::text',
        [pgText(uid(USERS.user))], { aal: 'aal1' })).length, 1)
      assert.equal((await f.remove(USERS.peerOwner, USERS.peerOwner)).length, 1)
      await f.reset()
      await unchangedRefusal(f, () => f.asHuman(USERS.admin,
        "UPDATE public.profiles SET status='disabled' WHERE user_id IN ($1::uuid,$2::uuid) RETURNING id::text",
        [pgText(uid(USERS.user)), pgText(uid(USERS.owner))]), '42501')
      await unchangedRefusal(f, () => f.asHuman(USERS.admin,
        'DELETE FROM public.profiles WHERE user_id IN ($1::uuid,$2::uuid) RETURNING id::text',
        [pgText(uid(USERS.user)), pgText(uid(USERS.owner))]), '42501')
      // These single statements force an allowed row operation to produce one
      // row BEFORE the forbidden operation can reach its trigger. The final
      // error must roll the earlier data-modifying CTE back as well; unlike an
      // unordered multirow scan this does not depend on physical row order.
      await unchangedRefusal(f, () => f.asHuman(USERS.admin,
        "WITH first_allowed AS (UPDATE public.profiles SET status='disabled' WHERE user_id=$1::uuid RETURNING id) UPDATE public.profiles SET status='disabled' WHERE user_id=$2::uuid AND (SELECT count(*) FROM first_allowed)=1 RETURNING id::text",
        [pgText(uid(USERS.user)), pgText(uid(USERS.owner))]), '42501')
      await unchangedRefusal(f, () => f.asHuman(USERS.admin,
        'WITH first_allowed AS (DELETE FROM public.profiles WHERE user_id=$1::uuid RETURNING id) DELETE FROM public.profiles WHERE user_id=$2::uuid AND (SELECT count(*) FROM first_allowed)=1 RETURNING id::text',
        [pgText(uid(USERS.user)), pgText(uid(USERS.owner))]), '42501')
    })

    await group(5, async () => {
      await f.reset()
      await unchangedRefusal(f, () => f.update(USERS.user, USERS.user, 'role', 'admin'), '23514')
      await unchangedRefusal(f, () => f.update(USERS.owner, USERS.owner, 'role', 'user'), '23514')
      await unchangedRefusal(f, () => f.update(USERS.moderator, USERS.admin, 'role', 'user'), '42501')
      await unchangedRefusal(f, () => f.asHuman(USERS.blank,
        "INSERT INTO public.profiles(id,user_id,role,status) VALUES($1::uuid,$2::uuid,'owner','active')",
        [pgText(uid(USERS.blank + 100)),pgText(uid(USERS.blank))]), '23514')
      await unchangedRefusal(f, () => f.asHuman(USERS.blank,
        "INSERT INTO public.profiles(id,user_id,role,status) VALUES($1::uuid,$2::uuid,'user','disabled')",
        [pgText(uid(USERS.blank + 100)),pgText(uid(USERS.blank))]), '23514')
      assert.equal((await f.asHuman(USERS.blank,
        "INSERT INTO public.profiles(id,user_id,role,status) VALUES($1::uuid,$2::uuid,'user','active') RETURNING id::text",
        [pgText(uid(USERS.blank + 100)),pgText(uid(USERS.blank))])).length, 1)
      assert.equal((await f.update(USERS.admin, USERS.user, 'role', 'creator')).length, 1)
      assert.equal((await f.update(USERS.owner, USERS.user, 'role', 'owner')).length, 1)
      assert.equal((await f.rows()).find(row => row.user_id === uid(USERS.user))?.role, 'owner')
      await f.reset()

      for (const value of [null, {}, { role: 'service_role', aal: 'aal2' }, claims(USERS.user, { role: 'service_role' })]) {
        await setClaims(f.human, value)
        const before = await f.rows()
        assert.equal((await f.human.query("UPDATE public.profiles SET status='disabled' WHERE user_id=$1::uuid RETURNING id::text", [pgText(uid(USERS.owner))])).length, 0)
        assert.equal((await f.human.query('DELETE FROM public.profiles WHERE user_id=$1::uuid RETURNING id::text', [pgText(uid(USERS.owner))])).length, 0)
        assert.deepEqual(await f.rows(), before)
      }
      // An explicit owned-fixture policy temporarily makes the row visible so
      // these cases exercise the INVOKER guard, rather than merely RLS filtering.
      // The actual restricted authenticated connection gets no BYPASSRLS/role
      // change, and this fixture-only policy is always removed before readback.
      await f.creator.query('CREATE POLICY profiles_pai1_nullactor_probe ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true)')
      try {
        for (const value of [null, {}, { role: 'service_role', aal: 'aal2' }]) {
          await setClaims(f.human, value)
          assert.equal((await f.human.query('SELECT current_user AS role'))[0]?.role, 'authenticated')
          await unchangedRefusal(f, () => f.human.query("UPDATE public.profiles SET status='disabled' WHERE user_id=$1::uuid", [pgText(uid(USERS.owner))]), '42501')
          await unchangedRefusal(f, () => f.human.query('DELETE FROM public.profiles WHERE user_id=$1::uuid', [pgText(uid(USERS.owner))]), '42501')
        }
      } finally {
        await f.creator.query('DROP POLICY profiles_pai1_nullactor_probe ON public.profiles')
      }
      assert.deepEqual(await f.shape(), observed.portableExpectedShape)

      await setClaims(f.human, claims(USERS.user, { sub: 'malformed-synthetic-uid' }))
      await unchangedRefusal(f, () => f.human.query("UPDATE public.profiles SET status='disabled' WHERE user_id=$1::uuid", [pgText(uid(USERS.owner))]), '22P02')
      const beforeAal1 = await f.rows()
      assert.equal((await f.asHuman(USERS.moderator, "UPDATE public.profiles SET status='disabled' WHERE user_id=$1::uuid RETURNING id::text",
        [pgText(uid(USERS.user))], { aal: 'aal1' })).length, 0)
      assert.deepEqual(await f.rows(), beforeAal1)

      // Exact-body fixture mutation only: exercise unknown target/actor rank
      // without dropping or recreating a profile constraint. Restore in finally.
      const rank = observed.e10c.profile_predicates.find(row => row.name === 'rollenrang')
      assert.ok(rank)
      const unknownTarget = rank.definition.replace("when 'user'      then 0", "when 'user'      then null")
      const unknownActor = rank.definition.replace("when 'moderator' then 20", "when 'moderator' then null")
      assert.notEqual(unknownTarget, rank.definition)
      assert.notEqual(unknownActor, rank.definition)
      try {
        await f.bootstrap.query(unknownTarget)
        await unchangedRefusal(f, () => f.update(USERS.owner, USERS.target, 'status', 'disabled'), '42501')
        await unchangedRefusal(f, () => f.remove(USERS.owner, USERS.target), '42501')
        await f.bootstrap.query(unknownActor)
        const before = await f.rows()
        assert.equal((await f.update(USERS.moderator, USERS.user, 'status', 'disabled')).length, 0)
        assert.deepEqual(await f.rows(), before)
      } finally {
        await f.bootstrap.query(rank.definition)
      }
      assert.deepEqual(await f.shape(), observed.portableExpectedShape)
    })

    await group(6, async () => {
      await f.reset()
      await unchangedRefusal(f, () => f.update(USERS.moderator, USERS.owner, 'user_id', uid(USERS.recipient)), '23514')
      await candidate(f.creator, pg1Install)
      // The private PG1 functions retain their exact owner-only ACL. This
      // isolated fixture-only definer delegates to the real unchanged PG1;
      // ordinary synthetic authenticated callers still supply their own UID.
      await f.creator.query("CREATE SCHEMA pai1_pg1_probe AUTHORIZATION postgres; GRANT USAGE ON SCHEMA pai1_pg1_probe TO authenticated; CREATE FUNCTION pai1_pg1_probe.own_active() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$ SELECT jetnity_ot_auth.own_active_session_v1() $$; CREATE FUNCTION pai1_pg1_probe.require_owner() RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$ BEGIN PERFORM jetnity_ot_auth.require_current_owner_session_v1(); END $$; REVOKE ALL ON FUNCTION pai1_pg1_probe.own_active(),pai1_pg1_probe.require_owner() FROM PUBLIC; GRANT EXECUTE ON FUNCTION pai1_pg1_probe.own_active(),pai1_pg1_probe.require_owner() TO authenticated;")
      try {
        assert.equal((await f.asHuman(USERS.recipient, 'SELECT pai1_pg1_probe.own_active()::text AS allowed'))[0]?.allowed, 'false')
        await assert.rejects(f.asHuman(USERS.recipient, 'SELECT pai1_pg1_probe.require_owner()'), sqlState('42501'))
        assert.equal((await f.asHuman(USERS.owner, 'SELECT pai1_pg1_probe.own_active()::text AS allowed'))[0]?.allowed, 'true')
        await f.asHuman(USERS.owner, 'SELECT pai1_pg1_probe.require_owner()')
        const original = (await f.rows()).find(row => row.user_id === uid(USERS.owner))
        assert.equal(original?.role, 'owner')
        assert.equal(original?.status, 'active')
        assert.equal((await f.rows()).some(row => row.user_id === uid(USERS.recipient)), false)
      } finally {
        await f.creator.query('DROP FUNCTION pai1_pg1_probe.own_active(),pai1_pg1_probe.require_owner() RESTRICT; DROP SCHEMA pai1_pg1_probe RESTRICT')
      }
      const privateAcl = await f.bootstrap.query("SELECT p.proname,pg_catalog.has_function_privilege('authenticated',p.oid,'EXECUTE')::text AS authenticated_execute,pg_catalog.has_function_privilege('service_role',p.oid,'EXECUTE')::text AS service_execute FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='jetnity_ot_auth' ORDER BY p.proname")
      assert.equal(privateAcl.length, 2)
      assert.ok(privateAcl.every(row => row.authenticated_execute === 'false' && row.service_execute === 'false'))
    })

    await group(7, async () => {
      await f.reset()
      // This observer exists only in the disposable fixture after installation.
      // It never replaces, instruments or bypasses the installed guard.
      await f.creator.query("CREATE SCHEMA pai1_cascade AUTHORIZATION postgres; CREATE TABLE pai1_cascade.observed(actor text NOT NULL,subject uuid NOT NULL); CREATE FUNCTION pai1_cascade.observe_delete() RETURNS trigger LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $$ BEGIN INSERT INTO pai1_cascade.observed(actor,subject) VALUES(current_user,OLD.user_id); RETURN OLD; END $$; REVOKE ALL ON FUNCTION pai1_cascade.observe_delete() FROM PUBLIC; CREATE TRIGGER profiles_z_pai1_observe BEFORE DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION pai1_cascade.observe_delete();")
      try {
        assert.equal((await f.authBackend.query('SELECT current_user AS role'))[0]?.role, 'supabase_auth_admin')
        assert.equal((await f.authBackend.query('DELETE FROM auth.users WHERE id=$1::uuid RETURNING id::text', [pgText(uid(USERS.user))])).length, 1)
        const observedContext = await f.bootstrap.query('SELECT actor,subject::text FROM pai1_cascade.observed')
        assert.deepEqual(observedContext, [{ actor: 'postgres', subject: uid(USERS.user) }])
        cascadeContext = observedContext[0]!.actor
        assert.equal((await f.rows()).some(row => row.user_id === uid(USERS.user)), false)
        assert.equal((await f.bootstrap.query('SELECT count(*)::text AS n FROM auth.sessions WHERE user_id=$1::uuid', [pgText(uid(USERS.user))]))[0]?.n, '0')
      } finally {
        await f.creator.query('DROP TRIGGER profiles_z_pai1_observe ON public.profiles RESTRICT; DROP FUNCTION pai1_cascade.observe_delete() RESTRICT; DROP TABLE pai1_cascade.observed RESTRICT; DROP SCHEMA pai1_cascade RESTRICT')
      }
      await setClaims(f.creator, {})
      assert.equal((await f.creator.query("UPDATE public.profiles SET status='disabled' WHERE user_id=$1::uuid RETURNING id::text", [pgText(uid(USERS.target))])).length, 1)
      await setClaims(f.service, {})
      assert.equal((await f.service.query('DELETE FROM public.profiles WHERE user_id=$1::uuid RETURNING id::text', [pgText(uid(USERS.target))])).length, 1)
      await f.reset()
    })

    await group(8, async () => {
      assert.deepEqual(await f.shape(), observed.portableExpectedShape)
      assert.deepEqual(stableAcrossFixtureDml(await f.preserved()), originalCatalog)
      const rights = await f.bootstrap.query("SELECT r.rolname,pg_catalog.has_function_privilege(r.oid,'public.profil_autoritaet_integritaet_pruefen_v1()','EXECUTE')::text AS allowed FROM pg_catalog.pg_roles r WHERE r.rolname IN ('anon','authenticated','authenticator','service_role') ORDER BY r.rolname")
      assert.equal(rights.length, 4)
      assert.ok(rights.every(row => row.allowed === 'false'))
      const objects = await f.newObjects()
      assert.equal(objects.length, 1)
      assert.equal(objects[0]?.body_sha256, GUARD_BODY_SHA256)
      assert.equal((await f.bootstrap.query("SELECT count(*)::text AS n FROM pg_catalog.pg_trigger WHERE tgrelid='public.profiles'::regclass AND NOT tgisinternal"))[0]?.n, '3')
      assert.equal((await f.bootstrap.query("SELECT count(*)::text AS n FROM pg_catalog.pg_namespace WHERE nspname IN ('pai1_cascade','pai1_pg1_probe')"))[0]?.n, '0')
    })

    await group(9, async () => {
      cleanup.push(await cleanupWitness(lifetime, budget, 'failure'))
      cleanup.push(await cleanupWitness(lifetime, budget, 'timeout'))
    })
    assert.deepEqual(completed, [...GROUPS])
  } catch (error) {
    failed = true
    failure = error
  } finally {
    effectEnded = performance.now()
    clearTimeout(timer)
    try {
      terminal = await lifetime.dispose()
      cleanupEnded = performance.now()
      assert.equal(terminal.started, terminal.settled)
      assert.equal(terminal.pending, 0)
      assert.equal(terminal.connections, terminal.closed)
      assert.equal(terminal.stoppedClusters, 1)
      assert.ok(db && !existsSync(db.cluster.root), 'main owned cluster must be stopped')
      assert.ok(cleanupEnded - effectEnded < DRAIN_MS, 'existing complete lifetime drain limit')
    } catch (error) {
      failure = failed ? new AggregateError([failure, error], 'pai1 proof and cleanup failed') : error
      failed = true
    }
  }
  if (failed) throw failure
  assert.ok(db && terminal)
  assert.deepEqual(completed, [...GROUPS])
  assert.equal(cascadeContext, 'postgres')
  assert.ok(effectEnded - started < EFFECT_MS)
  assert.equal(budget.clusters, 3)
  assert.ok(budget.connections <= MAX_CONNECTIONS && budget.operations <= MAX_OPERATIONS)
  t.diagnostic('PAI1_NATIVE_RECEIPT ' + JSON.stringify({
    schema: 'jetnity.profile-authority-integrity.native.v1',
    status: 'passed', syntheticOnly: true, hostedInstall: false, signedOwnerRequest: false,
    actualVersion: db.version, installer: db.creatorIdentity, oldDefinitionsBound: 7,
    oldProfileTriggersPreserved: 2, additiveFunctions: 1, additiveTriggers: 1,
    installPreservesRawCatalog: true, endOfDmlIgnoresOnlyPhysicalStatisticsAndFreezeHorizons: true,
    ordinaryRuntimeRole: 'authenticated', foreignStatusDeleteRankPairs: matrixPairs,
    authCascadeInvoker: cascadeContext, pg1AuthorityIsActualPrivateCode: true,
    pg1CallerBridgeIsFixtureOnly: true, directPrivateExecuteGrantedToRuntime: false,
    uuidDefaultProviderIsSynthetic: true, observedNativeEqualsHosted: false,
    source: { install: SOURCE_PINS[0][1], baseline: SOURCE_PINS[1][1], pg1: SOURCE_PINS[2][1] },
    effectLimitMs: EFFECT_MS, drainLimitMs: DRAIN_MS,
    effectMs: Math.round(effectEnded - started), cleanupMs: Math.round(cleanupEnded - effectEnded),
    elapsedMs: Math.round(cleanupEnded - started), budget, completed, terminal, cleanupWitnesses: cleanup,
  }))
}
