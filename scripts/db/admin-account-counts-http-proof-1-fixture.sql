-- LOCAL HTTP-PROOF SETUP ONLY.
-- Separately identified from accepted bootstrap/producer/wrapper.
-- Not a migration. Not an application grant change. Not a second privileged
-- wrapper. Does not disable auth.users RLS, does not grant client SELECT on
-- auth.users, and does not open jetnity_internal / jetnity_reporting to HTTP.

-- ---------------------------------------------------------------------------
-- LOCAL SETUP: PostgREST authenticator (LOGIN, NOINHERIT).
-- Membership is required so PostgREST can SET ROLE to the JWT role.
-- This is not an application-role privilege and not BYPASSRLS.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'jetnity_http_authenticator') then
    create role jetnity_http_authenticator
      login
      nosuperuser
      nocreatedb
      nocreaterole
      noinherit
      nobypassrls;
  end if;
end
$$;

comment on role jetnity_http_authenticator is
  'LOCAL HTTP-PROOF authenticator only. LOGIN NOINHERIT so PostgREST can SET ROLE. Not an application role and not a live Supabase role.';

grant anon, authenticated, service_role to jetnity_http_authenticator;

-- ---------------------------------------------------------------------------
-- HTTP-PROOF SEED — deterministic present>=1 and genuine window 0.
-- All present rows are older than 720 hours or have NULL created_at.
-- Anonymous / soft-deleted rows are present as negative-path subjects only.
-- ---------------------------------------------------------------------------
insert into auth.users (id, created_at, deleted_at, confirmed_at, is_anonymous) values
  ('10000000-0000-4000-8000-000000000001', now() - interval '40 days', null, now() - interval '40 days', false),
  ('10000000-0000-4000-8000-000000000002', now() - interval '40 days', null, now() - interval '40 days', false),
  ('10000000-0000-4000-8000-000000000003', now() - interval '40 days', null, now() - interval '40 days', false),
  ('10000000-0000-4000-8000-000000000004', now() - interval '40 days', null, now() - interval '40 days', false),
  ('10000000-0000-4000-8000-000000000005', now() - interval '40 days', null, now() - interval '40 days', false),
  ('10000000-0000-4000-8000-000000000006', now() - interval '40 days', null, now() - interval '40 days', false),
  ('10000000-0000-4000-8000-000000000007', now() - interval '40 days', null, now() - interval '40 days', false),
  ('10000000-0000-4000-8000-00000000000a', null,                       null, null,                       false),
  ('10000000-0000-4000-8000-00000000000b', now() - interval '40 days', null, now() - interval '40 days', false),
  ('10000000-0000-4000-8000-00000000000e', now() - interval '40 days', null, now() - interval '40 days', false),
  ('10000000-0000-4000-8000-00000000000f', now() - interval '40 days', null, now() - interval '40 days', true),
  ('10000000-0000-4000-8000-000000000010', now() - interval '40 days', now(), now() - interval '40 days', false),
  ('10000000-0000-4000-8000-000000000014', now() - interval '40 days', null, now() - interval '40 days', true);

insert into public.profiles (user_id, role, status) values
  ('10000000-0000-4000-8000-000000000001', 'owner',     'active'),
  ('10000000-0000-4000-8000-000000000002', 'admin',     'active'),
  ('10000000-0000-4000-8000-000000000003', 'operator',  'active'),
  ('10000000-0000-4000-8000-000000000004', 'moderator', 'active'),
  ('10000000-0000-4000-8000-000000000005', 'user',      'active'),
  ('10000000-0000-4000-8000-000000000006', 'creator',   'active'),
  ('10000000-0000-4000-8000-00000000000a', 'user',      'active'),
  ('10000000-0000-4000-8000-00000000000b', 'user',      'active'),
  ('10000000-0000-4000-8000-00000000000e', 'user',      'banned'),
  ('10000000-0000-4000-8000-00000000000f', 'user',      'active'),
  ('10000000-0000-4000-8000-000000000010', 'moderator', 'active'),
  ('10000000-0000-4000-8000-000000000014', 'moderator', 'active');

-- ---------------------------------------------------------------------------
-- DISPOSABLE LARGE-VALUE TRANSPORT FIXTURE.
-- Not the guarded producer. Never replaces account_counts_v1.
-- Proves bigint-to-TEXT serialization through HTTP only.
-- ---------------------------------------------------------------------------
create or replace function public.jetnity_http_proof_1_large_text()
returns table (
  js_safe_overflow text,
  signed_bigint_max text
)
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select
    pg_catalog.btrim((9007199254740993::bigint)::text),
    pg_catalog.btrim((9223372036854775807::bigint)::text);
$$;

comment on function public.jetnity_http_proof_1_large_text() is
  'DISPOSABLE HTTP-PROOF transport fixture only. Canonical decimal TEXT for 9007199254740993 and 9223372036854775807. Not jetnity.admin-account-counts.v1 and not a live aggregate.';

revoke all on function public.jetnity_http_proof_1_large_text() from public;
revoke all on function public.jetnity_http_proof_1_large_text() from anon;
revoke all on function public.jetnity_http_proof_1_large_text() from service_role;
revoke all on function public.jetnity_http_proof_1_large_text() from authenticated;
grant execute on function public.jetnity_http_proof_1_large_text() to authenticated;
