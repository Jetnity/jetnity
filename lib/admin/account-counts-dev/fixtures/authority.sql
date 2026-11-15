-- Synthetic native proof only. NEVER apply this fixture to hosted Dev or Production.
-- Function bodies copied from the read-only Dev catalog on 2026-11-15;
-- the existing profile guard belongs to #1197 and is never modified by rollout SQL.

alter table public.profiles add column id uuid not null default gen_random_uuid();
alter table public.profiles add constraint counts_fixture_profile_id_unique unique(id);
alter table public.profiles add constraint counts_fixture_profile_auth_fk foreign key(user_id) references auth.users(id) on delete cascade;

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
$function$;

alter function public.aktuelle_rolle() owner to postgres;
revoke all on function public.aktuelle_rolle() from public, anon, authenticated, service_role;
grant execute on function public.aktuelle_rolle() to authenticated, service_role;

CREATE OR REPLACE FUNCTION public.aktuelles_admin_aal2()
 RETURNS boolean
 LANGUAGE sql
 STABLE PARALLEL SAFE
 SET search_path TO 'pg_catalog'
AS $function$
  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false)
$function$;

alter function public.aktuelles_admin_aal2() owner to postgres;
revoke all on function public.aktuelles_admin_aal2() from public, anon, authenticated, service_role;
grant execute on function public.aktuelles_admin_aal2() to authenticated, service_role;

CREATE OR REPLACE FUNCTION public.darf_konten_verwalten()
 RETURNS boolean
 LANGUAGE sql
 STABLE PARALLEL SAFE
 SET search_path TO 'pg_catalog'
AS $function$
  select public.hat_rolle_mindestens('moderator')
     and public.aktuelles_admin_aal2()
$function$;

alter function public.darf_konten_verwalten() owner to postgres;
revoke all on function public.darf_konten_verwalten() from public, anon, authenticated, service_role;
grant execute on function public.darf_konten_verwalten() to authenticated, service_role;

CREATE OR REPLACE FUNCTION public.hat_rolle_mindestens(minimum text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select coalesce(
           public.rollenrang(public.aktuelle_rolle()) >= public.rollenrang(minimum),
           false)
$function$;

alter function public.hat_rolle_mindestens(text) owner to postgres;
revoke all on function public.hat_rolle_mindestens(text) from public, anon, authenticated, service_role;
grant execute on function public.hat_rolle_mindestens(text) to authenticated, service_role;

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
$function$;

alter function public.rollenrang(text) owner to postgres;
revoke all on function public.rollenrang(text) from public, anon, authenticated, service_role;
grant execute on function public.rollenrang(text) to authenticated, service_role;

CREATE OR REPLACE FUNCTION public.profil_autoritaet_integritaet_pruefen_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
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
$function$;

alter function public.profil_autoritaet_integritaet_pruefen_v1() owner to postgres;
revoke all on function public.profil_autoritaet_integritaet_pruefen_v1() from public, anon, authenticated, service_role;
create trigger profiles_autoritaet_integritaet_v1 before update or delete on public.profiles for each row execute function public.profil_autoritaet_integritaet_pruefen_v1();
