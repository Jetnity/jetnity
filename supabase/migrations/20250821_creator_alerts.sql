-- supabase/migrations/20250821_creator_alerts.sql
do $$
begin
  -- Enum absichern (falls noch nicht vorhanden)
  if not exists (select 1 from pg_type where typname = 'creator_content_type') then
    create type public.creator_content_type as enum ('video','image','guide','blog','story','other');
  end if;

  -- Regeln
  create table if not exists public.creator_alert_rules (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    metric text not null check (metric in ('impressions','views','view_rate','engagement_rate','impact_score')),
    comparator text not null check (comparator in ('above','below')),
    threshold numeric not null,
    window_days int not null default 7 check (window_days > 0),
    content_type public.creator_content_type null,
    is_active boolean not null default true,
    title text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  -- Events (ausgelöste Alarme)
  create table if not exists public.creator_alert_events (
    id uuid primary key default gen_random_uuid(),
    rule_id uuid not null references public.creator_alert_rules(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    happened_at timestamptz not null default now(),
    current_value numeric not null,
    message text not null
  );

  -- Trigger: updated_at
  create or replace function public.tg_set_updated_at()
  returns trigger language plpgsql as $$
  begin
    new.updated_at := now();
    return new;
  end $$;

  drop trigger if exists set_updated_at on public.creator_alert_rules;
  create trigger set_updated_at
    before update on public.creator_alert_rules
    for each row execute function public.tg_set_updated_at();

  -- RLS
  alter table public.creator_alert_rules enable row level security;
  alter table public.creator_alert_events enable row level security;

  -- Policies: Rules
  do $p$
  begin
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='creator_alert_rules' and policyname='sel_own_rules'
    ) then
      create policy sel_own_rules on public.creator_alert_rules
        for select using (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='creator_alert_rules' and policyname='ins_own_rules'
    ) then
      create policy ins_own_rules on public.creator_alert_rules
        for insert with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='creator_alert_rules' and policyname='upd_own_rules'
    ) then
      create policy upd_own_rules on public.creator_alert_rules
        for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='creator_alert_rules' and policyname='del_own_rules'
    ) then
      create policy del_own_rules on public.creator_alert_rules
        for delete using (auth.uid() = user_id);
    end if;
  end $p$;

  -- Policies: Events (nur eigene sehen)
  do $p$
  begin
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='creator_alert_events' and policyname='sel_own_events'
    ) then
      create policy sel_own_events on public.creator_alert_events
        for select using (auth.uid() = user_id);
    end if;
  end $p$;

  -- RPC: Evaluierung eines Users
  create or replace function public.creator_alerts_eval_for(_uid uuid)
  returns int
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    _now timestamptz := now();
    r record;
    _from timestamptz;
    agg record;
    _value numeric;
    _msg text;
    _inserted int := 0;
    _last_event timestamptz;
  begin
    for r in
      select * from public.creator_alert_rules
      where user_id = _uid and is_active = true
    loop
      _from := _now - make_interval(days => r.window_days);

      -- Aggregation aus creator_session_metrics
      select
        sum(coalesce(impressions,0))::numeric as impressions,
        sum(coalesce(views,0))::numeric       as views,
        sum(coalesce(likes,0))::numeric       as likes,
        sum(coalesce(comments,0))::numeric    as comments,
        avg(nullif(impact_score,0))::numeric  as avg_impact
      into agg
      from public.creator_session_metrics
      where user_id = _uid
        and created_at >= _from
        and (r.content_type is null or content_type = r.content_type);

      if r.metric = 'impressions' then
        _value := coalesce(agg.impressions,0);
      elsif r.metric = 'views' then
        _value := coalesce(agg.views,0);
      elsif r.metric = 'view_rate' then
        _value := case when coalesce(agg.impressions,0) > 0 then coalesce(agg.views,0)/agg.impressions else 0 end;
      elsif r.metric = 'engagement_rate' then
        _value := case when coalesce(agg.impressions,0) > 0 then (coalesce(agg.likes,0)+coalesce(agg.comments,0))/agg.impressions else 0 end;
      else -- impact_score
        _value := coalesce(agg.avg_impact,0);
      end if;

      if (r.comparator = 'above' and _value >= r.threshold)
         or (r.comparator = 'below' and _value <= r.threshold) then

        -- Anti-Spam: nur einmal in 24h pro Regel
        select max(happened_at) into _last_event
        from public.creator_alert_events
        where rule_id = r.id and user_id = _uid;

        if _last_event is null or _last_event < (_now - interval '24 hours') then
          _msg := coalesce(r.title, 'Alert') || ': ' || r.metric || ' ' || r.comparator || ' ' || r.threshold::text ||
                  ' · aktuell=' || coalesce(_value,0)::text || ' (letzte ' || r.window_days::text || ' Tage' ||
                  case when r.content_type is not null then ', '|| r.content_type::text else '' end || ').';

          insert into public.creator_alert_events(rule_id, user_id, current_value, message)
          values (r.id, _uid, _value, _msg);

          _inserted := _inserted + 1;
        end if;
      end if;
    end loop;

    return _inserted;
  end $$;

  -- RPC: Eval für aktuellen User (Auth-kontext)
  create or replace function public.creator_alerts_eval_current_user()
  returns int
  language sql
  security definer
  set search_path = public
  as $$
    select public.creator_alerts_eval_for(auth.uid());
  $$;

  revoke all on function public.creator_alerts_eval_current_user() from public;
  grant execute on function public.creator_alerts_eval_current_user() to authenticated;

  -- RPC: Eval für alle User (nur service_role)
  create or replace function public.creator_alerts_eval_all()
  returns int
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    u record;
    _cnt int := 0;
  begin
    for u in (select distinct user_id from public.creator_alert_rules where is_active=true) loop
      _cnt := _cnt + public.creator_alerts_eval_for(u.user_id);
    end loop;
    return _cnt;
  end $$;

  revoke all on function public.creator_alerts_eval_all() from public;
  grant execute on function public.creator_alerts_eval_all() to service_role;

end
$$;
