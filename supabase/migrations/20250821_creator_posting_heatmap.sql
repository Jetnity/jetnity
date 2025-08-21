do $$
begin
  -- optionaler Enum/Spalte-Schutz, falls noch nicht vorhanden
  if not exists (select 1 from pg_type where typname = 'creator_content_type') then
    create type public.creator_content_type as enum ('video','image','guide','blog','story','other');
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'creator_session_metrics'
      and column_name  = 'content_type'
  ) then
    alter table public.creator_session_metrics
      add column content_type public.creator_content_type not null default 'other';
  end if;

  create or replace function public.creator_posting_heatmap(
    days integer default 90,
    _content_type text default null
  )
  returns table(
    dow int,
    hour int,
    sessions bigint,
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
      extract(dow from created_at at time zone 'UTC')::int  as dow,
      extract(hour from created_at at time zone 'UTC')::int as hour,
      count(*)::bigint                                     as sessions,
      sum(coalesce(impressions,0))::bigint                 as impressions,
      sum(coalesce(views,0))::bigint                       as views,
      sum(coalesce(likes,0))::bigint                       as likes,
      sum(coalesce(comments,0))::bigint                    as comments
    from public.creator_session_metrics
    where user_id = auth.uid()
      and created_at >= now() - make_interval(days => days)
      and (
        _content_type is null
        or content_type = (_content_type)::public.creator_content_type
      )
    group by 1,2
    order by 1,2;
  $$;

  revoke all on function public.creator_posting_heatmap(integer, text) from public;
  grant execute on function public.creator_posting_heatmap(integer, text) to authenticated;
end
$$;
