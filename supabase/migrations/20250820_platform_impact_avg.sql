-- Aggregierter Plattform-Durchschnitt (0..100)
-- Nutzt impact_score, fällt ansonsten auf eine hergeleitete Metrik zurück:
-- score = (viewRate * 0.6 + engagementRate * 0.4) * 100
-- RLS wird via SECURITY DEFINER überbrückt; es wird NUR ein Aggregat geliefert.

create or replace function public.platform_impact_avg(days integer default 90)
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

-- Ausführung nur für angemeldete Nutzer erlauben (kein Leaken pro Zeile)
revoke all on function public.platform_impact_avg(integer) from public;
grant execute on function public.platform_impact_avg(integer) to authenticated;
