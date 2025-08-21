do $$
begin
  create or replace function public.creator_impact_percentile(days integer default 90)
  returns table(
    pct numeric,         -- cume_dist (0..1), höher = besser
    avg_impact numeric,  -- eigener Ø-Impact
    creator_count bigint -- Anzahl Creator im Fenster
  )
  language sql
  security definer
  set search_path = public
  as $$
    with recent as (
      select user_id, impact_score, created_at
      from public.creator_session_metrics
      where created_at >= now() - make_interval(days => days)
        and impact_score is not null
    ),
    user_avg as (
      select user_id, avg(impact_score)::numeric as avg_impact
      from recent
      group by user_id
    ),
    ranked as (
      select
        user_id,
        avg_impact,
        cume_dist() over (order by avg_impact) as cume
      from user_avg
    ),
    me as (
      select cume as pct, avg_impact
      from ranked
      where user_id = auth.uid()
    )
    select
      (select pct from me)::numeric,
      (select avg_impact from me)::numeric,
      (select count(*) from user_avg)::bigint as creator_count;
  $$;

  revoke all on function public.creator_impact_percentile(integer) from public;
  grant execute on function public.creator_impact_percentile(integer) to authenticated;
end
$$;
