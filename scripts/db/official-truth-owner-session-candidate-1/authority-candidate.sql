-- OFFLINE CANDIDATE ONLY. Not a canonical migration or a hosted apply entry.
-- Prerequisite for any later target binding: Development timebox=0,
-- inactivity_timeout=0, single_per_user=false, mfa_allow_low_aal=false.
-- The target must separately prove postgres privileges, Auth schema semantics,
-- trigger/FK behavior, and that jetnity_ot_auth is NOT a Data API schema.
-- No Auth table privileges, global role helpers or managed Auth RLS are changed.
begin;

create schema jetnity_ot_auth authorization postgres;
revoke all on schema jetnity_ot_auth from public, anon, authenticated, service_role;
grant usage on schema jetnity_ot_auth to authenticated, service_role;

-- A statement-snapshot observation, never a reusable mutation grant.
create function jetnity_ot_auth.own_active_session_v1()
returns boolean language plpgsql stable parallel unsafe security definer
set search_path = pg_catalog as $$
declare
  claims jsonb := auth.jwt();
  uid uuid; sid uuid;
begin
  if jsonb_typeof(claims) is distinct from 'object'
    or jsonb_typeof(claims->'sub') is distinct from 'string'
    or (claims->>'sub') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    or jsonb_typeof(claims->'session_id') is distinct from 'string'
    or (claims->>'session_id') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    or claims->>'role' is distinct from 'authenticated'
    or claims->>'aal' is distinct from 'aal2'
    or jsonb_typeof(claims->'exp') is distinct from 'number'
    or (claims->>'exp') !~ '^[0-9]{1,12}$' then
    return false;
  end if;
  uid := (claims->>'sub')::uuid;
  sid := (claims->>'session_id')::uuid;
  if auth.uid() is distinct from uid then return false; end if;
  return exists (
    select 1 from auth.users u
      join auth.sessions s on s.user_id=u.id and s.id=sid
      join public.profiles p on p.user_id=u.id
    where u.id=uid and p.role='owner' and p.status='active'
      and u.deleted_at is null and u.is_anonymous is false
      and (u.banned_until is null or u.banned_until<=statement_timestamp())
      and s.aal::text='aal2'
      and (s.not_after is null or s.not_after>statement_timestamp())
      and (claims->>'exp')::numeric>extract(epoch from statement_timestamp())
  );
end $$;
alter function jetnity_ot_auth.own_active_session_v1() owner to postgres;
revoke all on function jetnity_ot_auth.own_active_session_v1() from public, anon, authenticated, service_role;
grant execute on function jetnity_ot_auth.own_active_session_v1() to authenticated, service_role;

-- The existing public signature and authenticated/service_role callers remain.
-- A service-key-only request lacks the authenticated own-user/session witness.
create or replace function public.darf_official_truth_freigeben()
returns boolean language sql stable parallel unsafe security invoker
set search_path = pg_catalog as $$
  select coalesce(public.hat_rolle_mindestens('owner')
    and public.aktuelles_admin_aal2()
    and jetnity_ot_auth.own_active_session_v1(), false)
$$;
revoke all on function public.darf_official_truth_freigeben() from public, anon;
grant execute on function public.darf_official_truth_freigeben() to authenticated, service_role;

-- Callable only by its explicit owner, from the protected pilot function.
-- Lock order AFTER the pilot grant/trip: own Auth user -> session -> profile.
-- NOWAIT aborts lock inversions (including Auth-delete cascades) instead of
-- waiting while already holding the grant. FOR SHARE blocks non-key changes.
create function jetnity_ot_auth.require_current_owner_session_v1()
returns void language plpgsql volatile parallel unsafe security definer
set search_path = pg_catalog set lock_timeout = '2s' as $$
declare
  claims jsonb := auth.jwt();
  uid uuid; sid uuid; checked_at timestamptz; permitted boolean;
begin
  if not coalesce(jetnity_ot_auth.own_active_session_v1(),false) then
    raise exception 'official truth authority unavailable' using errcode='42501';
  end if;
  uid := auth.uid(); sid := (claims->>'session_id')::uuid;
  perform u.id from auth.users u where u.id=uid for share nowait;
  if not found then raise exception 'official truth authority unavailable' using errcode='42501'; end if;
  perform s.id from auth.sessions s where s.id=sid and s.user_id=uid for share nowait;
  if not found then raise exception 'official truth authority unavailable' using errcode='42501'; end if;
  perform p.user_id from public.profiles p where p.user_id=uid for share nowait;
  if not found then raise exception 'official truth authority unavailable' using errcode='42501'; end if;

  -- Defined authorization time: fresh clock AFTER all relevant row locks.
  -- At READ COMMITTED this SELECT sees the latest committed rows. Stronger
  -- isolation must propagate serialization failure, never catch-and-allow.
  checked_at := clock_timestamp();
  select p.role='owner' and p.status='active'
    and u.deleted_at is null and u.is_anonymous is false
    and (u.banned_until is null or u.banned_until<=checked_at)
    and s.aal::text='aal2' and (s.not_after is null or s.not_after>checked_at)
    and (claims->>'exp')::numeric>extract(epoch from checked_at)
    into permitted
    from auth.users u
      join auth.sessions s on s.user_id=u.id and s.id=sid
      join public.profiles p on p.user_id=u.id
    where u.id=uid;
  if permitted is distinct from true then
    raise exception 'official truth authority unavailable' using errcode='42501';
  end if;
  -- Locks remain held until transaction end. No guarantee of retroactively
  -- cancelling work that serialized before a later revocation is claimed.
end $$;
alter function jetnity_ot_auth.require_current_owner_session_v1() owner to postgres;
revoke all on function jetnity_ot_auth.require_current_owner_session_v1() from public, anon, authenticated, service_role;
commit;
