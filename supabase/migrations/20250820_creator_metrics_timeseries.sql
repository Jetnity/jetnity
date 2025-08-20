-- Aggregiert die eigenen Session-Metriken pro Tag für den angemeldeten Nutzer.
-- SECURITY DEFINER, aber Zugriff nur für 'authenticated'; nutzt auth.uid() im Filter.
create or replace function public.creator_metrics_timeseries(days integer default 90)
returns table(
  d date,
  impressions bigint,
  views bigint,
  likes bigint,
  comments bigint
)
language sql
security definer
set search_path = public
as $$
  select
    date_trunc('day', created_at)::date as d,
    sum(coalesce(impressions,0))::bigint as impressions,
    sum(coalesce(views,0))::bigint as views,
    sum(coalesce(likes,0))::bigint as likes,
    sum(coalesce(comments,0))::bigint as comments
  from public.creator_session_metrics
  where user_id = auth.uid()
    and created_at >= now() - make_interval(days => days)
  group by 1
  order by 1 asc;
$$;

revoke all on function public.creator_metrics_timeseries(integer) from public;
grant execute on function public.creator_metrics_timeseries(integer) to authenticated;
