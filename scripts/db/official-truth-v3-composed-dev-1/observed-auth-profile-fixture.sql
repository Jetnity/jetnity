CREATE ROLE postgres LOGIN INHERIT NOSUPERUSER BYPASSRLS CREATEDB CREATEROLE REPLICATION;
CREATE ROLE anon NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS;
CREATE ROLE authenticated NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS;
CREATE ROLE authenticator NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS;
CREATE ROLE service_role NOLOGIN NOINHERIT NOSUPERUSER BYPASSRLS;
CREATE ROLE supabase_auth_admin LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;
CREATE ROLE pai1_human LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;
CREATE ROLE pai1_service LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION;
CREATE ROLE pai1_alien NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS;
GRANT authenticated TO pai1_human WITH ADMIN FALSE, INHERIT FALSE, SET TRUE;
GRANT service_role TO pai1_service WITH ADMIN FALSE, INHERIT FALSE, SET TRUE;
ALTER DATABASE postgres OWNER TO postgres;
SET ROLE postgres;
GRANT USAGE ON SCHEMA public TO postgres,anon,authenticated,service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO postgres,service_role;
RESET ROLE;
CREATE SCHEMA auth AUTHORIZATION supabase_auth_admin;
SET ROLE supabase_auth_admin;
CREATE TYPE auth.aal_level AS ENUM('aal1','aal2','aal3');
CREATE TABLE auth.users(id uuid PRIMARY KEY, email text,raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  deleted_at timestamptz,banned_until timestamptz,is_anonymous boolean NOT NULL DEFAULT false);
CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aal auth.aal_level,not_after timestamptz);
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $auth_jwt$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$auth_jwt$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $auth_uid$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$auth_uid$;
REVOKE ALL ON FUNCTION auth.jwt(),auth.uid() FROM PUBLIC;
GRANT USAGE ON SCHEMA auth TO postgres,authenticated,service_role;
GRANT EXECUTE ON FUNCTION auth.jwt(),auth.uid() TO postgres,authenticated,service_role;
GRANT SELECT,UPDATE ON auth.users,auth.sessions TO postgres;
GRANT REFERENCES(id) ON auth.users TO postgres;
RESET ROLE;
SET ROLE postgres;
CREATE FUNCTION public.uuid_generate_v4() RETURNS uuid LANGUAGE sql VOLATILE PARALLEL SAFE
SET search_path=pg_catalog AS $synthetic_uuid$SELECT pg_catalog.gen_random_uuid()$synthetic_uuid$;
CREATE OR REPLACE FUNCTION public.rollenrang(rolle text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
 SET search_path TO 'pg_catalog'
AS $function$
  select case rolle
           when 'user'      then 0
           when 'creator'   then 10
           when 'moderator' then 20
           when 'operator'  then 30
           when 'admin'     then 40
           when 'owner'     then 50
         end
$function$
;
CREATE TABLE public.profiles(
 id uuid NOT NULL DEFAULT public.uuid_generate_v4(),
 user_id uuid NOT NULL,role text NOT NULL DEFAULT 'user',
 created_at timestamptz DEFAULT timezone('utc'::text,now()),
 pai1_dropped_5 text,avatar_url text,
 pai1_dropped_7 text,pai1_dropped_8 text,pai1_dropped_9 text,pai1_dropped_10 text,
 pai1_dropped_11 text,pai1_dropped_12 text,pai1_dropped_13 text,pai1_dropped_14 text,
 email text,status text NOT NULL DEFAULT 'active',last_seen_at timestamptz,display_name text,
 CONSTRAINT profiles_pkey PRIMARY KEY(id),
 CONSTRAINT profiles_user_id_key UNIQUE(user_id),
 CONSTRAINT profiles_user_id_fkey FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
 CONSTRAINT profiles_role_check CHECK(public.rollenrang(role) IS NOT NULL),
 CONSTRAINT profiles_status_check CHECK(status=ANY(ARRAY['active'::text,'pending'::text,'disabled'::text,'banned'::text]))
);
ALTER TABLE public.profiles DROP COLUMN pai1_dropped_5,
 DROP COLUMN pai1_dropped_7,DROP COLUMN pai1_dropped_8,DROP COLUMN pai1_dropped_9,DROP COLUMN pai1_dropped_10,
 DROP COLUMN pai1_dropped_11,DROP COLUMN pai1_dropped_12,DROP COLUMN pai1_dropped_13,DROP COLUMN pai1_dropped_14;
CREATE INDEX profiles_created_at_idx ON public.profiles(created_at);
CREATE INDEX profiles_email_idx ON public.profiles(email);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.profiles TO postgres,service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.profiles TO authenticated;
CREATE OR REPLACE FUNCTION public.aktuelle_rolle()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select p.role
  from public.profiles p
  where p.user_id = (select auth.uid())
  limit 1
$function$
;
CREATE OR REPLACE FUNCTION public.hat_rolle_mindestens(minimum text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select coalesce(
           public.rollenrang(public.aktuelle_rolle()) >= public.rollenrang(minimum),
           false)
$function$
;
CREATE OR REPLACE FUNCTION public.aktuelles_admin_aal2()
 RETURNS boolean
 LANGUAGE sql
 STABLE PARALLEL SAFE
 SET search_path TO 'pg_catalog'
AS $function$
  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false)
$function$
;
CREATE OR REPLACE FUNCTION public.darf_konten_verwalten()
 RETURNS boolean
 LANGUAGE sql
 STABLE PARALLEL SAFE
 SET search_path TO 'pg_catalog'
AS $function$
  select public.hat_rolle_mindestens('moderator')
     and public.aktuelles_admin_aal2()
$function$
;
CREATE OR REPLACE FUNCTION public.profil_kerndaten_aus_auth()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  update public.profiles p
  set
    email = coalesce(u.email, p.email),
    display_name = coalesce(
      p.display_name,
      (u.raw_user_meta_data ->> 'full_name'),
      (u.raw_user_meta_data ->> 'name'),
      split_part(u.email, '@', 1)
    )
  from auth.users u
  where p.user_id = new.user_id and u.id = new.user_id;
  return new;
end
$function$
;
CREATE OR REPLACE FUNCTION public.profil_rollenwechsel_pruefen()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  handelnder uuid := (select auth.uid());
  rang_handelnder integer;
begin
  if handelnder is null then
    return new;
  end if;

  rang_handelnder := public.rollenrang(public.aktuelle_rolle());

  if tg_op = 'INSERT' then
    if new.user_id = handelnder then
      if new.role is distinct from 'user' then
        raise exception 'Ein neues eigenes Profil erhält immer die Rolle user.'
          using errcode = 'check_violation';
      end if;
      if new.status is distinct from 'active' then
        raise exception 'Ein neues eigenes Profil erhält immer den Status active.'
          using errcode = 'check_violation';
      end if;
      return new;
    end if;

    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then
      raise exception 'Keine Berechtigung, Profile für andere Konten anzulegen.'
        using errcode = 'insufficient_privilege';
    end if;
    if rang_handelnder < public.rollenrang('owner')
       and rang_handelnder <= coalesce(public.rollenrang(new.role), -1) then
      raise exception 'Diese Rolle liegt nicht unterhalb der eigenen.'
        using errcode = 'insufficient_privilege';
    end if;

    return new;
  end if;

  if new.role is distinct from old.role then
    if old.user_id = handelnder then
      raise exception 'Die eigene Rolle lässt sich nicht ändern.'
        using errcode = 'check_violation';
    end if;
    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then
      raise exception 'Keine Berechtigung, Rollen zu vergeben.'
        using errcode = 'insufficient_privilege';
    end if;
    if rang_handelnder < public.rollenrang('owner')
       and (rang_handelnder <= coalesce(public.rollenrang(old.role), -1)
            or rang_handelnder <= coalesce(public.rollenrang(new.role), -1)) then
      raise exception 'Diese Rolle liegt nicht unterhalb der eigenen.'
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  if new.status is distinct from old.status then
    if old.user_id = handelnder then
      raise exception 'Der eigene Kontostatus lässt sich nicht ändern.'
        using errcode = 'check_violation';
    end if;
    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then
      raise exception 'Keine Berechtigung, den Kontostatus zu ändern.'
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  return new;
end
$function$
;
REVOKE ALL ON FUNCTION public.aktuelle_rolle() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aktuelles_admin_aal2() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.darf_konten_verwalten() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hat_rolle_mindestens(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.profil_kerndaten_aus_auth() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.profil_rollenwechsel_pruefen() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rollenrang(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aktuelle_rolle() TO authenticated;
GRANT EXECUTE ON FUNCTION public.aktuelles_admin_aal2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.darf_konten_verwalten() TO authenticated;
GRANT EXECUTE ON FUNCTION public.hat_rolle_mindestens(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rollenrang(text) TO authenticated;
CREATE POLICY profiles_lesen ON public.profiles FOR SELECT TO authenticated
 USING ((user_id=(SELECT auth.uid())) OR public.darf_konten_verwalten());
CREATE POLICY profiles_aendern ON public.profiles FOR UPDATE TO authenticated
 USING ((user_id=(SELECT auth.uid())) OR public.darf_konten_verwalten())
 WITH CHECK ((user_id=(SELECT auth.uid())) OR public.darf_konten_verwalten());
CREATE POLICY profiles_anlegen ON public.profiles FOR INSERT TO authenticated WITH CHECK(user_id=(SELECT auth.uid()));
CREATE POLICY profiles_loeschen ON public.profiles FOR DELETE TO authenticated
 USING ((user_id=(SELECT auth.uid())) OR public.darf_konten_verwalten());
CREATE TRIGGER profiles_kerndaten_aus_auth AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profil_kerndaten_aus_auth();
CREATE TRIGGER profiles_rollenwechsel BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profil_rollenwechsel_pruefen();
RESET ROLE;
