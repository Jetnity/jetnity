-- Hauptfunktion mit dem Namen, der in deinen Types vorhanden ist:
-- public.platform_avg_impact_score(days integer default 90) -> numeric (0..100)
create or replace function public.platform_avg_impact_score(days integer default 90)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  result numeric;
begin
  select avg(
           least(100, greatest(0,
             coalesce(
               impact_score::numeric,
               (
                 (views::numeric / nullif(impressions, 0)) * 0.6
                 + ((likes + comments)::numeric / nullif(impressions, 0)) * 0.4
               ) * 100
             )
           ))
         )
    into result
  from public.creator_session_metrics
  where created_at >= now() - make_interval(days => days);

  return coalesce(result, 0);
end;
$$;

-- Optionaler Alias für alten Namen, falls irgendwo noch verwendet:
create or replace function public.platform_impact_avg(days integer default 90)
returns numeric
language sql
security definer
set search_path = public
as $$
  select public.platform_avg_impact_score(days);
$$;

-- Rechte setzen (kein Row-Leak, nur Aggregat):
revoke all on function public.platform_avg_impact_score(integer) from public;
revoke all on function public.platform_impact_avg(integer) from public;
grant execute on function public.platform_avg_impact_score(integer) to authenticated;
grant execute on function public.platform_impact_avg(integer) to authenticated;
