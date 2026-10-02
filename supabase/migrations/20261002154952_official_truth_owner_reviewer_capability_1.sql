-- Jetnity – Official Truth owner reviewer capability foundation 1
--
-- Forward-only. Adds exactly one capability function:
-- public.darf_official_truth_freigeben().
--
-- True only when the signed session has at least owner AND current AAL2.
-- Both helpers are fail closed, so a missing role, an unknown role, a missing
-- JWT claim or any AAL other than aal2 yields false.
--
-- No table, RLS, policy, ownership or profile/role mutation.
-- No SECURITY DEFINER. No caller-supplied reviewer, role or AAL argument.
-- Not applied to Development or Production by this file alone.

create or replace function public.darf_official_truth_freigeben()
returns boolean
language sql
stable
parallel safe
security invoker
set search_path = pg_catalog
as $$
  select public.hat_rolle_mindestens('owner')
     and public.aktuelles_admin_aal2()
$$;

comment on function public.darf_official_truth_freigeben() is
  'Fähigkeit official-truth-freigeben: mindestens owner UND aktuelles AAL2. Siehe CAPABILITY_MINIMUM in lib/auth/roles.ts.';

revoke all on function public.darf_official_truth_freigeben() from public, anon;
grant execute on function public.darf_official_truth_freigeben() to authenticated, service_role;
