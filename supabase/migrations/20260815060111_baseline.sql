-- Jetnity V2 – Datenbank-Baseline (Phase 1.4)
--
-- Diese Datei beschreibt den vollständigen Bestand des Schemas `public`, wie er
-- auf dem Supabase-Development-Branch tatsächlich existiert. Sie ersetzt die
-- zehn früheren Migrationsdateien, die zusammen nur zwei der 39 Tabellen
-- erzeugten und deren Inhalt teilweise vom realen Bestand abwich
-- (siehe docs/DATENBANK.md, Abschnitt „Drift").
--
-- Die Versionsnummer entspricht dem bereits auf dem Development-Branch
-- eingetragenen Stand (`supabase_migrations.schema_migrations`). Ein
-- `supabase db push` betrachtet die Baseline damit als angewendet und spielt
-- sie nicht erneut ein.
--
-- Reproduzierbarkeit wird mit `npm run db:reproduzierbarkeit` nachgewiesen:
-- Das Skript baut `public` in einer zurückgerollten Transaktion vollständig aus
-- den Migrationen neu auf und vergleicht das Ergebnis mit dem laufenden Schema.
--
-- Nicht von Hand pflegen. Änderungen gehören in eine neue Migration.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";
COMMENT ON SCHEMA "public" IS 'standard public schema';
CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE TYPE "public"."blog_status" AS ENUM (
    'draft',
    'published',
    'scheduled',
    'archived'
);
ALTER TYPE "public"."blog_status" OWNER TO "postgres";
CREATE TYPE "public"."creator_content_type" AS ENUM (
    'video',
    'image',
    'guide',
    'blog',
    'story',
    'other'
);
ALTER TYPE "public"."creator_content_type" OWNER TO "postgres";
CREATE TYPE "public"."session_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);
ALTER TYPE "public"."session_status" OWNER TO "postgres";
CREATE TYPE "public"."visibility_status" AS ENUM (
    'private',
    'public'
);
ALTER TYPE "public"."visibility_status" OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."admin_payments_summary_30d"() RETURNS TABLE("total_revenue_cents" bigint, "refunds_cents" bigint, "payouts_cents" bigint, "orders_count" bigint)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $_$
declare
  pay_amount_expr text;
  po_amount_expr  text;
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='payments' and column_name='amount_cents') then
    pay_amount_expr := 'amount_cents';
  elsif exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='payments' and column_name='amount') then
    pay_amount_expr := 'round(amount * 100)';
  else
    pay_amount_expr := '0';
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='payouts' and column_name='amount_cents') then
    po_amount_expr := 'amount_cents';
  elsif exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='payouts' and column_name='amount') then
    po_amount_expr := 'round(amount * 100)';
  else
    po_amount_expr := '0';
  end if;

  return query execute format($q$
    with pay as (
      select status, created_at, (%1$s)::bigint as cents
      from public.payments
      where created_at >= now() - interval '30 days'
    ),
    po as (
      select (%2$s)::bigint as cents
      from public.payouts
      where created_at >= now() - interval '30 days'
    )
    select
      coalesce(sum(case when status='succeeded' then cents else 0 end),0)::bigint as total_revenue_cents,
      coalesce(sum(case when status='refunded'  then cents else 0 end),0)::bigint as refunds_cents,
      coalesce((select sum(cents) from po),0)::bigint as payouts_cents,
      coalesce(count(*) filter (where status in ('succeeded','pending')),0)::bigint as orders_count
    from pay
  $q$, pay_amount_expr, po_amount_expr);
end;
$_$;
ALTER FUNCTION "public"."admin_payments_summary_30d"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."append_email_to_array"("email" "text", "session_id" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  new_arr text[];
begin
  update public.creator_sessions
  set shared_with = array(
    select distinct e from unnest(coalesce(shared_with, '{}')) as e
    union select email
  )
  where id = session_id
  returning shared_with into new_arr;

  return new_arr;
end$$;
ALTER FUNCTION "public"."append_email_to_array"("email" "text", "session_id" "uuid") OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."append_email_to_array"("id" "uuid", "email_to_add" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare e text := lower(trim(email_to_add));
begin
  if e is null or position('@' in e) = 0 then return false; end if;

  update public.creator_sessions
  set shared_with = (
    select array(
      select distinct v
      from unnest(coalesce(shared_with, '{}'::text[])) as v
      union
      select e
    )
  )
  where creator_sessions.id = append_email_to_array.id
    and auth.uid() = user_id;

  return found;
end; $$;
ALTER FUNCTION "public"."append_email_to_array"("id" "uuid", "email_to_add" "text") OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."blog_posts_set_owner"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  if tg_op = 'INSERT' and new.user_id is null then
    new.user_id = auth.uid();
  end if;
  new.updated_at = now();
  return new;
end $$;
ALTER FUNCTION "public"."blog_posts_set_owner"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."creator_alerts_eval_all"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  u record;
  _cnt int := 0;
begin
  for u in (select distinct user_id from public.creator_alert_rules where is_active = true) loop
    _cnt := _cnt + public.creator_alerts_eval_for(u.user_id);
  end loop;
  return _cnt;
end;
$$;
ALTER FUNCTION "public"."creator_alerts_eval_all"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."creator_alerts_eval_current_user"() RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  select public.creator_alerts_eval_for(auth.uid());
$$;
ALTER FUNCTION "public"."creator_alerts_eval_current_user"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."creator_alerts_eval_for"("_uid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
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
      _value := case when coalesce(agg.impressions,0) > 0
                     then coalesce(agg.views,0)/agg.impressions else 0 end;
    elsif r.metric = 'engagement_rate' then
      _value := case when coalesce(agg.impressions,0) > 0
                     then (coalesce(agg.likes,0)+coalesce(agg.comments,0))/agg.impressions else 0 end;
    else
      _value := coalesce(agg.avg_impact,0);
    end if;

    if (r.comparator = 'above' and _value >= r.threshold)
       or (r.comparator = 'below' and _value <= r.threshold)
    then
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
end;
$$;
ALTER FUNCTION "public"."creator_alerts_eval_for"("_uid" "uuid") OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."creator_impact_percentile"("_days" integer) RETURNS TABLE("pct" numeric, "avg_impact" numeric)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  with user_avg as (
    select user_id, avg(impact_score) as avg_impact
    from public.creator_session_metrics
    where created_at >= now() - make_interval(days => _days)
    group by user_id
  )
  select
    coalesce((
      select cume_dist() over (order by ua.avg_impact)
      from user_avg ua
      where ua.user_id = auth.uid()
    ), 0)::numeric as pct,
    coalesce((
      select avg_impact from user_avg where user_id = auth.uid()
    ), 0)::numeric as avg_impact;
$$;
ALTER FUNCTION "public"."creator_impact_percentile"("_days" integer) OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."creator_impact_percentile"("args" "jsonb") RETURNS TABLE("pct" numeric, "avg_impact" numeric)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  select * from public.creator_impact_percentile(
    coalesce((args->>'days')::int, 90)
  );
$$;
ALTER FUNCTION "public"."creator_impact_percentile"("args" "jsonb") OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."creator_metrics_timeseries"("args" "jsonb") RETURNS TABLE("d" "date", "impressions" integer, "views" integer, "likes" integer, "comments" integer)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  select * from public.creator_metrics_timeseries(
    coalesce((args->>'days')::int, 90),
    nullif(args->>'content_type','')::public.creator_content_type
  );
$$;
ALTER FUNCTION "public"."creator_metrics_timeseries"("args" "jsonb") OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."creator_metrics_timeseries"("_days" integer, "_content_type" "public"."creator_content_type" DEFAULT NULL::"public"."creator_content_type") RETURNS TABLE("d" "date", "impressions" integer, "views" integer, "likes" integer, "comments" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  select
    date_trunc('day', created_at)::date as d,
    sum(coalesce(impressions,0))::int    as impressions,
    sum(coalesce(views,0))::int          as views,
    sum(coalesce(likes,0))::int          as likes,
    sum(coalesce(comments,0))::int       as comments
  from public.creator_session_metrics
  where user_id = auth.uid()
    and created_at >= now() - make_interval(days => _days)
    and (_content_type is null or content_type = _content_type)
  group by 1
  order by 1;
$$;
ALTER FUNCTION "public"."creator_metrics_timeseries"("_days" integer, "_content_type" "public"."creator_content_type") OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."creator_posting_heatmap"("args" "jsonb") RETURNS TABLE("dow" integer, "hour" integer, "sessions" integer, "impressions" integer, "views" integer, "likes" integer, "comments" integer)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  select * from public.creator_posting_heatmap(
    coalesce((args->>'days')::int, 90),
    nullif(args->>'content_type','')::public.creator_content_type
  );
$$;
ALTER FUNCTION "public"."creator_posting_heatmap"("args" "jsonb") OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."creator_posting_heatmap"("_days" integer, "_content_type" "public"."creator_content_type" DEFAULT NULL::"public"."creator_content_type") RETURNS TABLE("dow" integer, "hour" integer, "sessions" integer, "impressions" integer, "views" integer, "likes" integer, "comments" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  with s as (
    select *
    from public.creator_session_metrics
    where user_id = auth.uid()
      and created_at >= now() - make_interval(days => _days)
      and (_content_type is null or content_type = _content_type)
  )
  select
    extract(dow  from created_at at time zone 'UTC')::int as dow,
    extract(hour from created_at at time zone 'UTC')::int as hour,
    count(*)::int                                       as sessions,
    sum(coalesce(impressions,0))::int                   as impressions,
    sum(coalesce(views,0))::int                         as views,
    sum(coalesce(likes,0))::int                         as likes,
    sum(coalesce(comments,0))::int                      as comments
  from s
  group by 1,2
  order by 1,2;
$$;
ALTER FUNCTION "public"."creator_posting_heatmap"("_days" integer, "_content_type" "public"."creator_content_type") OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."creator_uploads_set_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  if (new.slug is null or length(new.slug) = 0) and new.title is not null then
    new.slug := public.slugify(new.title);
  end if;
  return new;
end$$;
ALTER FUNCTION "public"."creator_uploads_set_slug"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."csm_increment_impressions"("p_session_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  insert into public.creator_session_metrics (session_id, impressions)
  values (p_session_id, 1)
  on conflict (session_id) do update
    set impressions = public.creator_session_metrics.impressions + 1;
end;
$$;
ALTER FUNCTION "public"."csm_increment_impressions"("p_session_id" "uuid") OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."csm_increment_views"("p_session_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  insert into public.creator_session_metrics (session_id, views)
  values (p_session_id, 1)
  on conflict (session_id) do update
    set views = public.creator_session_metrics.views + 1;
end;
$$;
ALTER FUNCTION "public"."csm_increment_views"("p_session_id" "uuid") OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."increment_impression"("session_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  -- Wenn du KEINE separate Spalte hast, ersetze impressions -> views
  insert into public.creator_session_metrics(session_id, views)
  values (increment_impression.session_id, 1)
  on conflict (session_id) do update
    set views = public.creator_session_metrics.views + 1;
end;
$$;
ALTER FUNCTION "public"."increment_impression"("session_id" "uuid") OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."increment_like"("session_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  insert into public.creator_session_metrics(session_id, likes)
  values (increment_like.session_id, 1)
  on conflict (session_id) do update
    set likes = public.creator_session_metrics.likes + 1;
end;
$$;
ALTER FUNCTION "public"."increment_like"("session_id" "uuid") OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."increment_view"("session_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  insert into public.creator_session_metrics(session_id, views)
  values (increment_view.session_id, 1)
  on conflict (session_id) do update
    set views = public.creator_session_metrics.views + 1;
end;
$$;
ALTER FUNCTION "public"."increment_view"("session_id" "uuid") OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."is_admin"("uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select exists(
    select 1
    from public.creator_profiles p
    where p.user_id = uid
      and p.is_admin = true
  );
$$;
ALTER FUNCTION "public"."is_admin"("uid" "uuid") OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."platform_avg_impact_score"() RETURNS numeric
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  select coalesce(avg(impact_score), 0) from public.creator_session_metrics;
$$;
ALTER FUNCTION "public"."platform_avg_impact_score"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."platform_avg_impact_score"("days" integer DEFAULT 90) RETURNS double precision
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  has_scores boolean;
  w_sum numeric;
  w_total numeric;
  v_sum numeric;
  lc_sum numeric;
  imp_sum numeric;
  result numeric := 0;
begin
  -- Prüfen, ob in der Periode bereits Impact-Scores vorliegen
  select exists (
    select 1
    from public.creator_session_metrics
    where (days >= 3650 or created_at >= now() - make_interval(days => days))
      and coalesce(impact_score, 0) > 0
  ) into has_scores;

  if has_scores then
    -- Gewichteter Ø nach Impressions
    select
      sum(coalesce(impact_score,0) * greatest(1, coalesce(impressions,0)))::numeric,
      sum(greatest(1, coalesce(impressions,0)))::numeric
    into w_sum, w_total
    from public.creator_session_metrics
    where (days >= 3650 or created_at >= now() - make_interval(days => days))
      and coalesce(impact_score, 0) > 0;

    if coalesce(w_total,0) > 0 then
      result := w_sum / w_total;
    else
      result := 0;
    end if;
  else
    -- Fallback: aus Raten berechnen (views + engagement)
    select
      sum(coalesce(views,0))::numeric,
      sum(coalesce(likes,0) + coalesce(comments,0))::numeric,
      sum(greatest(1, coalesce(impressions,0)))::numeric
    into v_sum, lc_sum, imp_sum
    from public.creator_session_metrics
    where (days >= 3650 or created_at >= now() - make_interval(days => days));

    if coalesce(imp_sum,0) > 0 then
      result := ((v_sum / imp_sum) * 0.6 + (lc_sum / imp_sum) * 0.4) * 100;
    else
      result := 0;
    end if;
  end if;

  -- Clamp 0..100
  if result < 0 then result := 0; end if;
  if result > 100 then result := 100; end if;
  return result::double precision;
end;
$$;
ALTER FUNCTION "public"."platform_avg_impact_score"("days" integer) OWNER TO "postgres";
SET default_tablespace = '';
SET default_table_access_method = "heap";
CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "content" "text" NOT NULL,
    "excerpt" "text",
    "cover_image" "text",
    "creator_id" "uuid",
    "status" "public"."blog_status" DEFAULT 'draft'::"public"."blog_status" NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "seo_title" "text",
    "seo_description" "text",
    "tags" "text"[],
    "views" integer DEFAULT 0 NOT NULL,
    "likes" integer DEFAULT 0 NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL,
    "ai_generated" boolean DEFAULT false NOT NULL,
    "admin_reviewed" boolean DEFAULT false NOT NULL,
    "user_id" "uuid",
    "scheduled_at" timestamp with time zone,
    CONSTRAINT "blog_posts_scheduled_requires_time" CHECK ((("status" <> 'scheduled'::"public"."blog_status") OR ("scheduled_at" IS NOT NULL)))
);
ALTER TABLE "public"."blog_posts" OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."publish_due_blog_posts"("batch_size" integer DEFAULT 200) RETURNS SETOF "public"."blog_posts"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare _ids uuid[];
begin
  select array_agg(id) into _ids
  from public.blog_posts
  where status='scheduled' and publish_at <= now()
  order by publish_at asc
  limit batch_size;

  if _ids is null or array_length(_ids,1) is null then return; end if;

  return query
  with updated as (
    update public.blog_posts
       set status='published', published_at=now()
     where id = any(_ids)
     returning *
  ) select * from updated;
end;
$$;
ALTER FUNCTION "public"."publish_due_blog_posts"("batch_size" integer) OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."publish_due_posts"() RETURNS "void"
    LANGUAGE "sql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  update public.blog_posts
     set status = 'published'::public.blog_status
   where status = 'scheduled'::public.blog_status
     and scheduled_at is not null
     and scheduled_at <= now();
$$;
ALTER FUNCTION "public"."publish_due_posts"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."remove_email_from_array"("id" "uuid", "email_to_remove" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare e text := lower(trim(email_to_remove));
begin
  update public.creator_sessions
  set shared_with = array(
    select v from unnest(coalesce(shared_with, '{}'::text[])) as v
    where v <> e
  )
  where creator_sessions.id = remove_email_from_array.id
    and auth.uid() = user_id;

  return found;
end; $$;
ALTER FUNCTION "public"."remove_email_from_array"("id" "uuid", "email_to_remove" "text") OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."set_owner"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  if new.user_id is null then new.user_id = auth.uid(); end if;
  return new;
end
$$;
ALTER FUNCTION "public"."set_owner"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."set_profile_core_from_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  update public.creator_profiles p
  set
    email = coalesce(u.email, p.email),
    display_name = coalesce(
      p.display_name,
      (u.raw_user_meta_data->>'full_name'),
      (u.raw_user_meta_data->>'name'),
      split_part(u.email, '@', 1),
      p.display_name
    )
  from auth.users u
  where p.user_id = new.user_id and u.id = new.user_id;
  return new;
end;
$$;
ALTER FUNCTION "public"."set_profile_core_from_auth"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."set_profile_email_from_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  update public.creator_profiles p
  set email = u.email
  from auth.users u
  where p.user_id = new.user_id
    and p.user_id = u.id;
  return new;
end;
$$;
ALTER FUNCTION "public"."set_profile_email_from_auth"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end $$;
ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."slugify"("text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO 'pg_catalog', 'public'
    AS $_$
  select regexp_replace(lower($1), '[^a-z0-9]+', '-', 'g')::text
$_$;
ALTER FUNCTION "public"."slugify"("text") OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."sync_creator_profile_core"() RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  update public.creator_profiles p
  set
    email = coalesce(u.email, p.email),
    display_name = coalesce(
      p.display_name,
      (u.raw_user_meta_data->>'full_name'),
      (u.raw_user_meta_data->>'name'),
      split_part(u.email, '@', 1),
      p.display_name
    )
  from auth.users u
  where p.user_id = u.id
    and (
      p.email is distinct from u.email
      or p.display_name is null
      or p.display_name = ''
    );
$$;
ALTER FUNCTION "public"."sync_creator_profile_core"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."sync_creator_profile_emails"() RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  update public.creator_profiles p
  set email = u.email
  from auth.users u
  where p.user_id = u.id
    and (p.email is distinct from u.email);
$$;
ALTER FUNCTION "public"."sync_creator_profile_emails"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."tg_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;
ALTER FUNCTION "public"."tg_set_updated_at"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end $$;
ALTER FUNCTION "public"."touch_updated_at"() OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."admin_domains" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "domain" "text" NOT NULL,
    "provider" "text" DEFAULT 'infomaniak'::"text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."admin_domains" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."admin_email_boxes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "domain" "text" NOT NULL,
    "address" "text" NOT NULL,
    "kind" "text" DEFAULT 'alias'::"text" NOT NULL,
    "forwards_to" "text"[] DEFAULT '{}'::"text"[],
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."admin_email_boxes" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."airports" (
    "id" bigint NOT NULL,
    "iata" "text",
    "icao" "text",
    "name" "text" NOT NULL,
    "city" "text",
    "country" "text",
    "lat" double precision,
    "lon" double precision,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."airports" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."airports_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE "public"."airports_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."airports_id_seq" OWNED BY "public"."airports"."id";
CREATE TABLE IF NOT EXISTS "public"."app_admins" (
    "user_id" "uuid" NOT NULL
);
ALTER TABLE "public"."app_admins" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."blocked_ips" (
    "ip" "text" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."blocked_ips" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."blog_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "blog_id" "uuid",
    "user_id" "uuid",
    "name" "text",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'visible'::"text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp without time zone
);
ALTER TABLE "public"."blog_comments" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."copilot_suggestions" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "detail" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "tags" "jsonb",
    "prompt" "text",
    "source" "text" DEFAULT 'heuristic'::"text"
);
ALTER TABLE "public"."copilot_suggestions" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."copilot_suggestions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE "public"."copilot_suggestions_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."copilot_suggestions_id_seq" OWNED BY "public"."copilot_suggestions"."id";
CREATE TABLE IF NOT EXISTS "public"."creator_alert_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rule_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "happened_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "current_value" numeric NOT NULL,
    "message" "text" NOT NULL
);
ALTER TABLE "public"."creator_alert_events" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."creator_alert_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "metric" "text" NOT NULL,
    "comparator" "text" NOT NULL,
    "threshold" numeric NOT NULL,
    "window_days" integer DEFAULT 7 NOT NULL,
    "content_type" "public"."creator_content_type",
    "is_active" boolean DEFAULT true NOT NULL,
    "title" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "creator_alert_rules_comparator_check" CHECK (("comparator" = ANY (ARRAY['above'::"text", 'below'::"text"]))),
    CONSTRAINT "creator_alert_rules_metric_check" CHECK (("metric" = ANY (ARRAY['impressions'::"text", 'views'::"text", 'view_rate'::"text", 'engagement_rate'::"text", 'impact_score'::"text"]))),
    CONSTRAINT "creator_alert_rules_window_days_check" CHECK (("window_days" > 0))
);
ALTER TABLE "public"."creator_alert_rules" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."creator_profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "role" "text" DEFAULT 'basic'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "name" "text",
    "avatar_url" "text",
    "bio" "text",
    "username" "extensions"."citext",
    "website" "text",
    "instagram" "text",
    "tiktok" "text",
    "youtube" "text",
    "twitter" "text",
    "facebook" "text",
    "email" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "last_seen_at" timestamp with time zone,
    "display_name" "text",
    "is_admin" boolean DEFAULT false NOT NULL,
    CONSTRAINT "creator_profiles_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'banned'::"text"]))),
    CONSTRAINT "creator_profiles_username_format_ck" CHECK (("username" OPERATOR("extensions".~) '^[a-z0-9._-]{3,30}$'::"extensions"."citext"))
);
ALTER TABLE "public"."creator_profiles" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."creator_publish_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "visibility" "text",
    "visibility_before" "text",
    "scheduled_for" timestamp with time zone,
    "rating" integer,
    "note" "text",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "creator_publish_events_type_check" CHECK (("type" = ANY (ARRAY['publish'::"text", 'unpublish'::"text", 'schedule'::"text", 'republish'::"text", 'analyze'::"text"])))
);
ALTER TABLE "public"."creator_publish_events" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."creator_publish_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" "uuid" NOT NULL,
    "platform" "text" NOT NULL,
    "caption" "text",
    "scheduled_at" timestamp with time zone,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "result" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "creator_publish_queue_platform_check" CHECK (("platform" = ANY (ARRAY['instagram'::"text", 'tiktok'::"text", 'youtube'::"text", 'x'::"text", 'facebook'::"text"]))),
    CONSTRAINT "creator_publish_queue_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'scheduled'::"text", 'sent'::"text", 'failed'::"text", 'canceled'::"text"])))
);
ALTER TABLE "public"."creator_publish_queue" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."creator_publish_schedule" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "visibility" "text" NOT NULL,
    "run_at" timestamp with time zone NOT NULL,
    "note" "text",
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "last_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "creator_publish_schedule_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'running'::"text", 'done'::"text", 'failed'::"text", 'canceled'::"text"]))),
    CONSTRAINT "creator_publish_schedule_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'unlisted'::"text", 'private'::"text"])))
);
ALTER TABLE "public"."creator_publish_schedule" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."creator_session_metrics" (
    "session_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text",
    "impact_score" numeric DEFAULT 0 NOT NULL,
    "views" integer DEFAULT 0 NOT NULL,
    "likes" integer DEFAULT 0 NOT NULL,
    "comments" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "impressions" integer DEFAULT 0 NOT NULL,
    "content_type" "public"."creator_content_type" DEFAULT 'other'::"public"."creator_content_type" NOT NULL,
    CONSTRAINT "creator_session_metrics_impact_range_chk" CHECK ((("impact_score" >= (0)::numeric) AND ("impact_score" <= (100)::numeric))),
    CONSTRAINT "creator_session_metrics_impact_score_check" CHECK ((("impact_score" >= (0)::numeric) AND ("impact_score" <= (100)::numeric)))
);
ALTER TABLE "public"."creator_session_metrics" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."creator_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "status" "text" NOT NULL,
    "content" "text",
    "visibility" "public"."visibility_status" DEFAULT 'private'::"public"."visibility_status",
    "rating" integer,
    "insights" "text",
    "published_at" timestamp without time zone,
    "idempotency_key" "text",
    "tracking" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "shared_with" "text"[] DEFAULT '{}'::"text"[],
    "review_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    CONSTRAINT "creator_sessions_review_status_check" CHECK (("review_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);
ALTER TABLE "public"."creator_sessions" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."creator_uploads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "region" "text" NOT NULL,
    "tags" "text"[] NOT NULL,
    "language" "text" NOT NULL,
    "mood" "text",
    "created_at" timestamp without time zone NOT NULL,
    "user_id" "uuid",
    "format" "text",
    "destination" "text",
    "image_url" "text",
    "is_virtual" boolean DEFAULT false,
    "creator_avatar" "text",
    "creator_name" "text",
    "city" "text",
    "slug" "text",
    "cover_url" "text",
    "session_id" "uuid"
);
ALTER TABLE "public"."creator_uploads" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."dns_audit_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "domain" "text" NOT NULL,
    "actor" "text" NOT NULL,
    "mode" "text" NOT NULL,
    "apply_flags" "jsonb",
    "before" "jsonb",
    "results" "jsonb",
    "after" "jsonb",
    "success" boolean DEFAULT true NOT NULL,
    "error" "text"
);
ALTER TABLE "public"."dns_audit_events" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."edit_docs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "doc" "jsonb" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "item_id" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "edit_docs_type_check" CHECK (("type" = ANY (ARRAY['photo'::"text", 'video'::"text"])))
);
ALTER TABLE "public"."edit_docs" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."insights_bets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "sport" "text" NOT NULL,
    "event_name" "text" NOT NULL,
    "market" "text" NOT NULL,
    "selection" "text" NOT NULL,
    "odds" numeric(10,3) NOT NULL,
    "stake" numeric(12,2) NOT NULL,
    "placed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "result" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "insights_bets_odds_check" CHECK (("odds" >= 1.01)),
    CONSTRAINT "insights_bets_result_check" CHECK (("result" = ANY (ARRAY['pending'::"text", 'won'::"text", 'lost'::"text", 'void'::"text"]))),
    CONSTRAINT "insights_bets_sport_check" CHECK (("sport" = ANY (ARRAY['soccer'::"text", 'basketball'::"text", 'tennis'::"text"]))),
    CONSTRAINT "insights_bets_stake_check" CHECK (("stake" > (0)::numeric))
);
ALTER TABLE "public"."insights_bets" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."insights_user_settings" (
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "currency_code" "text" DEFAULT 'CHF'::"text" NOT NULL,
    "risk_profile" "text" DEFAULT 'balanced'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "insights_user_settings_risk_profile_check" CHECK (("risk_profile" = ANY (ARRAY['conservative'::"text", 'balanced'::"text", 'aggressive'::"text"])))
);
ALTER TABLE "public"."insights_user_settings" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."media_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" "uuid" NOT NULL,
    "item_id" "text" NOT NULL,
    "label" "text" NOT NULL,
    "edit_doc_id" "uuid",
    "doc" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."media_versions" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "amount_chf" numeric,
    "customer_email" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."payments" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."refunds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_id" "text" NOT NULL,
    "amount_chf" numeric NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."refunds" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."render_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "edit_id" "uuid" NOT NULL,
    "target" "text" NOT NULL,
    "preset" "text" NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "progress" integer DEFAULT 0 NOT NULL,
    "output_url" "text",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "edit_doc_id" "uuid",
    "job_type" "text" DEFAULT 'photo'::"text",
    "params" "jsonb" DEFAULT '{}'::"jsonb",
    "result_url" "text",
    "output_bucket" "text",
    "output_path" "text",
    "logs" "text",
    "video_url" "text",
    CONSTRAINT "render_jobs_job_type_chk" CHECK (("job_type" = ANY (ARRAY['photo'::"text", 'video'::"text", 'thumb'::"text", 'proxy'::"text", 'caption'::"text", 'transcript'::"text", 'audio'::"text", 'other'::"text"]))),
    CONSTRAINT "render_jobs_progress_chk" CHECK ((("progress" >= 0) AND ("progress" <= 100))),
    CONSTRAINT "render_jobs_status_chk" CHECK (("status" = ANY (ARRAY['queued'::"text", 'processing'::"text", 'succeeded'::"text", 'failed'::"text", 'canceled'::"text"])))
);
ALTER TABLE "public"."render_jobs" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."security_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "ip" "text",
    "user_id" "uuid",
    "extra" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb"
);
ALTER TABLE "public"."security_events" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."session_cocreations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid",
    "user_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);
ALTER TABLE "public"."session_cocreations" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."session_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "text" "text",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "parent_id" "uuid",
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."session_comments" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."session_impressions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);
ALTER TABLE "public"."session_impressions" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."session_media" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid",
    "user_id" "uuid",
    "image_url" "text" NOT NULL,
    "is_ai_generated" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "description" "text",
    "tags" "text"[]
);
ALTER TABLE "public"."session_media" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."session_metrics" (
    "session_id" "uuid" NOT NULL,
    "impressions" bigint DEFAULT 0,
    "views" bigint DEFAULT 0,
    "prev_impressions" bigint,
    "prev_views" bigint,
    "watch_time_sec_total" bigint,
    "completion_rate" numeric
);
ALTER TABLE "public"."session_metrics" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."session_metrics_daily" (
    "session_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "impressions" bigint DEFAULT 0,
    "views" bigint DEFAULT 0
);
ALTER TABLE "public"."session_metrics_daily" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."session_review_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "severity" "text" NOT NULL,
    "reason" "text",
    "details" "text",
    "due_date" "date",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "session_review_requests_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'blocker'::"text"]))),
    CONSTRAINT "session_review_requests_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'resolved'::"text", 'cancelled'::"text"])))
);
ALTER TABLE "public"."session_review_requests" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."session_saves" (
    "user_id" "uuid" NOT NULL,
    "session_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."session_saves" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."session_snippets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid",
    "user_id" "uuid",
    "type" "text" DEFAULT 'text'::"text",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);
ALTER TABLE "public"."session_snippets" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."session_stories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid",
    "user_id" "uuid",
    "section" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);
ALTER TABLE "public"."session_stories" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."session_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "title" "text" DEFAULT ''::"text",
    "content" "text" DEFAULT ''::"text",
    "meta" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."session_versions" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."session_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);
ALTER TABLE "public"."session_views" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."stripe_webhooks" (
    "id" "text" NOT NULL,
    "type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."stripe_webhooks" OWNER TO "postgres";
ALTER TABLE ONLY "public"."airports" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."airports_id_seq"'::"regclass");
ALTER TABLE ONLY "public"."copilot_suggestions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."copilot_suggestions_id_seq"'::"regclass");
ALTER TABLE ONLY "public"."admin_domains"
    ADD CONSTRAINT "admin_domains_domain_key" UNIQUE ("domain");
ALTER TABLE ONLY "public"."admin_domains"
    ADD CONSTRAINT "admin_domains_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."admin_email_boxes"
    ADD CONSTRAINT "admin_email_boxes_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."airports"
    ADD CONSTRAINT "airports_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."app_admins"
    ADD CONSTRAINT "app_admins_pkey" PRIMARY KEY ("user_id");
ALTER TABLE ONLY "public"."blocked_ips"
    ADD CONSTRAINT "blocked_ips_pkey" PRIMARY KEY ("ip");
ALTER TABLE ONLY "public"."blog_comments"
    ADD CONSTRAINT "blog_comments_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");
ALTER TABLE ONLY "public"."copilot_suggestions"
    ADD CONSTRAINT "copilot_suggestions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."creator_alert_events"
    ADD CONSTRAINT "creator_alert_events_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."creator_alert_rules"
    ADD CONSTRAINT "creator_alert_rules_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."creator_profiles"
    ADD CONSTRAINT "creator_profiles_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."creator_profiles"
    ADD CONSTRAINT "creator_profiles_user_id_key" UNIQUE ("user_id");
ALTER TABLE ONLY "public"."creator_profiles"
    ADD CONSTRAINT "creator_profiles_username_key" UNIQUE ("username");
ALTER TABLE ONLY "public"."creator_publish_events"
    ADD CONSTRAINT "creator_publish_events_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."creator_publish_queue"
    ADD CONSTRAINT "creator_publish_queue_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."creator_publish_schedule"
    ADD CONSTRAINT "creator_publish_schedule_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."creator_session_metrics"
    ADD CONSTRAINT "creator_session_metrics_pkey" PRIMARY KEY ("session_id");
ALTER TABLE ONLY "public"."creator_session_metrics"
    ADD CONSTRAINT "creator_session_metrics_session_id_key" UNIQUE ("session_id");
ALTER TABLE ONLY "public"."creator_sessions"
    ADD CONSTRAINT "creator_sessions_idempotency_key_key" UNIQUE ("idempotency_key");
ALTER TABLE ONLY "public"."creator_sessions"
    ADD CONSTRAINT "creator_sessions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."creator_uploads"
    ADD CONSTRAINT "creator_uploads_pkey" PRIMARY KEY ("id", "title", "description", "file_url", "region", "tags", "language", "created_at");
ALTER TABLE ONLY "public"."dns_audit_events"
    ADD CONSTRAINT "dns_audit_events_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."edit_docs"
    ADD CONSTRAINT "edit_docs_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."insights_bets"
    ADD CONSTRAINT "insights_bets_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."insights_user_settings"
    ADD CONSTRAINT "insights_user_settings_pkey" PRIMARY KEY ("user_id");
ALTER TABLE ONLY "public"."media_versions"
    ADD CONSTRAINT "media_versions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."refunds"
    ADD CONSTRAINT "refunds_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."render_jobs"
    ADD CONSTRAINT "render_jobs_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."session_cocreations"
    ADD CONSTRAINT "session_cocreations_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."session_comments"
    ADD CONSTRAINT "session_comments_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."session_impressions"
    ADD CONSTRAINT "session_impressions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."session_media"
    ADD CONSTRAINT "session_media_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."session_metrics_daily"
    ADD CONSTRAINT "session_metrics_daily_pkey" PRIMARY KEY ("session_id", "date");
ALTER TABLE ONLY "public"."session_metrics"
    ADD CONSTRAINT "session_metrics_pkey" PRIMARY KEY ("session_id");
ALTER TABLE ONLY "public"."session_review_requests"
    ADD CONSTRAINT "session_review_requests_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."session_saves"
    ADD CONSTRAINT "session_saves_pkey" PRIMARY KEY ("user_id", "session_id");
ALTER TABLE ONLY "public"."session_snippets"
    ADD CONSTRAINT "session_snippets_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."session_stories"
    ADD CONSTRAINT "session_stories_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."session_versions"
    ADD CONSTRAINT "session_versions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."session_views"
    ADD CONSTRAINT "session_views_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."stripe_webhooks"
    ADD CONSTRAINT "stripe_webhooks_pkey" PRIMARY KEY ("id");
CREATE INDEX "airports_city_trgm" ON "public"."airports" USING "gin" ("city" "extensions"."gin_trgm_ops");
CREATE INDEX "airports_city_trgm_idx" ON "public"."airports" USING "gin" ("city" "extensions"."gin_trgm_ops");
CREATE INDEX "airports_country_trgm" ON "public"."airports" USING "gin" ("country" "extensions"."gin_trgm_ops");
CREATE INDEX "airports_country_trgm_idx" ON "public"."airports" USING "gin" ("country" "extensions"."gin_trgm_ops");
CREATE INDEX "airports_iata_idx" ON "public"."airports" USING "btree" ("iata");
CREATE UNIQUE INDEX "airports_iata_unique" ON "public"."airports" USING "btree" ("iata");
CREATE INDEX "airports_icao_idx" ON "public"."airports" USING "btree" ("icao");
CREATE UNIQUE INDEX "airports_icao_unique" ON "public"."airports" USING "btree" ("icao");
CREATE INDEX "airports_name_trgm" ON "public"."airports" USING "gin" ("name" "extensions"."gin_trgm_ops");
CREATE INDEX "airports_name_trgm_idx" ON "public"."airports" USING "gin" ("name" "extensions"."gin_trgm_ops");
CREATE INDEX "blog_posts_status_idx" ON "public"."blog_posts" USING "btree" ("status");
CREATE INDEX "blog_posts_status_scheduled_idx" ON "public"."blog_posts" USING "btree" ("status", "scheduled_at");
CREATE INDEX "blog_posts_user_idx" ON "public"."blog_posts" USING "btree" ("user_id", "created_at" DESC);
CREATE INDEX "creator_profiles_facebook_idx" ON "public"."creator_profiles" USING "btree" ("lower"("facebook"));
CREATE UNIQUE INDEX "creator_profiles_username_ci_unique" ON "public"."creator_profiles" USING "btree" ("username");
CREATE UNIQUE INDEX "csm_session_unique" ON "public"."creator_session_metrics" USING "btree" ("session_id");
CREATE INDEX "csm_user_created_type_idx" ON "public"."creator_session_metrics" USING "btree" ("user_id", "created_at", "content_type");
CREATE INDEX "dns_audit_events_created_at_idx" ON "public"."dns_audit_events" USING "btree" ("created_at" DESC);
CREATE INDEX "dns_audit_events_domain_idx" ON "public"."dns_audit_events" USING "btree" ("domain");
CREATE INDEX "edit_docs_session_user_item_idx" ON "public"."edit_docs" USING "btree" ("session_id", "user_id", "item_id");
CREATE INDEX "idx_alert_events_user_time" ON "public"."creator_alert_events" USING "btree" ("user_id", "happened_at" DESC);
CREATE INDEX "idx_app_admins_user_id" ON "public"."app_admins" USING "btree" ("user_id");
CREATE INDEX "idx_blog_comments_blog" ON "public"."blog_comments" USING "btree" ("blog_id", "created_at");
CREATE INDEX "idx_blog_comments_user" ON "public"."blog_comments" USING "btree" ("user_id");
CREATE INDEX "idx_blog_posts_creator_id" ON "public"."blog_posts" USING "btree" ("creator_id");
CREATE INDEX "idx_blog_posts_published_at" ON "public"."blog_posts" USING "btree" ("published_at" DESC);
CREATE INDEX "idx_blog_posts_status" ON "public"."blog_posts" USING "btree" ("status");
CREATE INDEX "idx_blog_posts_tags" ON "public"."blog_posts" USING "gin" ("tags");
CREATE INDEX "idx_copilot_suggestions_created_at" ON "public"."copilot_suggestions" USING "btree" ("created_at" DESC);
CREATE INDEX "idx_copilot_suggestions_created_by" ON "public"."copilot_suggestions" USING "btree" ("created_by");
CREATE INDEX "idx_cps_due" ON "public"."creator_publish_schedule" USING "btree" ("status", "run_at");
CREATE INDEX "idx_cps_session" ON "public"."creator_publish_schedule" USING "btree" ("session_id");
CREATE INDEX "idx_creator_profiles_created_at" ON "public"."creator_profiles" USING "btree" ("created_at" DESC);
CREATE INDEX "idx_creator_profiles_email" ON "public"."creator_profiles" USING "btree" ("email");
CREATE INDEX "idx_creator_publish_queue_sched" ON "public"."creator_publish_queue" USING "btree" ("scheduled_at");
CREATE INDEX "idx_creator_publish_queue_user" ON "public"."creator_publish_queue" USING "btree" ("user_id");
CREATE INDEX "idx_creator_session_metrics_created_at" ON "public"."creator_session_metrics" USING "btree" ("created_at");
CREATE INDEX "idx_creator_sessions_created_at" ON "public"."creator_sessions" USING "btree" ("created_at" DESC);
CREATE INDEX "idx_creator_sessions_id_user" ON "public"."creator_sessions" USING "btree" ("id", "user_id");
CREATE INDEX "idx_creator_sessions_review_status" ON "public"."creator_sessions" USING "btree" ("review_status", "created_at" DESC);
CREATE INDEX "idx_creator_sessions_status" ON "public"."creator_sessions" USING "btree" ("status");
CREATE INDEX "idx_creator_sessions_user" ON "public"."creator_sessions" USING "btree" ("user_id");
CREATE INDEX "idx_creator_uploads_city_trgm" ON "public"."creator_uploads" USING "gin" ("city" "extensions"."gin_trgm_ops");
CREATE INDEX "idx_creator_uploads_created_at" ON "public"."creator_uploads" USING "btree" ("created_at" DESC);
CREATE INDEX "idx_creator_uploads_is_virtual" ON "public"."creator_uploads" USING "btree" ("is_virtual");
CREATE INDEX "idx_creator_uploads_mood_trgm" ON "public"."creator_uploads" USING "gin" ("mood" "extensions"."gin_trgm_ops");
CREATE INDEX "idx_creator_uploads_region" ON "public"."creator_uploads" USING "btree" ("region");
CREATE INDEX "idx_creator_uploads_region_trgm" ON "public"."creator_uploads" USING "gin" ("region" "extensions"."gin_trgm_ops");
CREATE INDEX "idx_creator_uploads_session" ON "public"."creator_uploads" USING "btree" ("session_id");
CREATE INDEX "idx_creator_uploads_title_id" ON "public"."creator_uploads" USING "btree" ("title", "id");
CREATE INDEX "idx_creator_uploads_title_trgm" ON "public"."creator_uploads" USING "gin" ("title" "extensions"."gin_trgm_ops");
CREATE INDEX "idx_creator_uploads_user" ON "public"."creator_uploads" USING "btree" ("user_id");
CREATE INDEX "idx_csm_impact" ON "public"."creator_session_metrics" USING "btree" ("impact_score");
CREATE INDEX "idx_csm_impressions" ON "public"."creator_session_metrics" USING "btree" ("impressions");
CREATE INDEX "idx_csm_session" ON "public"."creator_session_metrics" USING "btree" ("session_id");
CREATE INDEX "idx_csm_user_created" ON "public"."creator_session_metrics" USING "btree" ("user_id", "created_at" DESC);
CREATE INDEX "idx_csm_user_type_created" ON "public"."creator_session_metrics" USING "btree" ("user_id", "content_type", "created_at" DESC);
CREATE INDEX "idx_edit_docs_session_updated" ON "public"."edit_docs" USING "btree" ("session_id", "updated_at" DESC);
CREATE INDEX "idx_insights_bets_user_placed_at" ON "public"."insights_bets" USING "btree" ("user_id", "placed_at" DESC);
CREATE INDEX "idx_insights_bets_user_result" ON "public"."insights_bets" USING "btree" ("user_id", "result");
CREATE INDEX "idx_insights_user_settings_updated_at" ON "public"."insights_user_settings" USING "btree" ("updated_at" DESC);
CREATE INDEX "idx_media_session_created_at" ON "public"."session_media" USING "btree" ("session_id", "created_at");
CREATE INDEX "idx_payments_created_at" ON "public"."payments" USING "btree" ("created_at" DESC);
CREATE INDEX "idx_render_jobs_session_status_created" ON "public"."render_jobs" USING "btree" ("session_id", "status", "created_at" DESC);
CREATE INDEX "idx_session_comments_created" ON "public"."session_comments" USING "btree" ("created_at");
CREATE INDEX "idx_session_comments_session" ON "public"."session_comments" USING "btree" ("session_id");
CREATE INDEX "idx_session_comments_user" ON "public"."session_comments" USING "btree" ("user_id");
CREATE INDEX "idx_session_metrics_session" ON "public"."session_metrics" USING "btree" ("session_id");
CREATE INDEX "idx_session_saves_user_id" ON "public"."session_saves" USING "btree" ("user_id");
CREATE INDEX "idx_smd_session_date" ON "public"."session_metrics_daily" USING "btree" ("session_id", "date");
CREATE INDEX "idx_snippets_session_created" ON "public"."session_snippets" USING "btree" ("session_id", "created_at");
CREATE INDEX "idx_srr_session" ON "public"."session_review_requests" USING "btree" ("session_id", "created_at" DESC);
CREATE INDEX "render_jobs_created_at_idx" ON "public"."render_jobs" USING "btree" ("created_at" DESC);
CREATE INDEX "render_jobs_created_idx" ON "public"."render_jobs" USING "btree" ("created_at" DESC);
CREATE INDEX "render_jobs_session_idx" ON "public"."render_jobs" USING "btree" ("session_id");
CREATE INDEX "render_jobs_status_idx" ON "public"."render_jobs" USING "btree" ("status");
CREATE INDEX "render_jobs_user_idx" ON "public"."render_jobs" USING "btree" ("user_id");
CREATE INDEX "session_comments_parent_idx" ON "public"."session_comments" USING "btree" ("parent_id");
CREATE INDEX "session_comments_session_idx" ON "public"."session_comments" USING "btree" ("session_id");
CREATE INDEX "session_saves_session_idx" ON "public"."session_saves" USING "btree" ("session_id");
CREATE INDEX "session_saves_user_idx" ON "public"."session_saves" USING "btree" ("user_id");
CREATE UNIQUE INDEX "uq_creator_uploads_slug" ON "public"."creator_uploads" USING "btree" ("slug");
CREATE OR REPLACE TRIGGER "blog_posts_biu" BEFORE INSERT OR UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."blog_posts_set_owner"();
CREATE OR REPLACE TRIGGER "blog_posts_set_owner" BEFORE INSERT ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."set_owner"();
CREATE OR REPLACE TRIGGER "blog_posts_set_updated_at" BEFORE UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."creator_alert_rules" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "set_updated_at_cpq" BEFORE UPDATE ON "public"."creator_publish_queue" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "t_creator_sessions_updated_at" BEFORE UPDATE ON "public"."creator_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE OR REPLACE TRIGGER "tg_edit_docs_updated_at" BEFORE UPDATE ON "public"."edit_docs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "trg_cps_touch" BEFORE UPDATE ON "public"."creator_publish_schedule" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();
CREATE OR REPLACE TRIGGER "trg_creator_uploads_set_slug" BEFORE INSERT OR UPDATE ON "public"."creator_uploads" FOR EACH ROW EXECUTE FUNCTION "public"."creator_uploads_set_slug"();
CREATE OR REPLACE TRIGGER "trg_edit_docs_updated" BEFORE UPDATE ON "public"."edit_docs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "trg_insights_user_settings_updated_at" BEFORE UPDATE ON "public"."insights_user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
CREATE OR REPLACE TRIGGER "trg_profile_core" AFTER INSERT ON "public"."creator_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_profile_core_from_auth"();
CREATE OR REPLACE TRIGGER "trg_profile_set_email" AFTER INSERT ON "public"."creator_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_profile_email_from_auth"();
CREATE OR REPLACE TRIGGER "trg_render_jobs_set_updated_at" BEFORE UPDATE ON "public"."render_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE OR REPLACE TRIGGER "trg_render_jobs_updated" BEFORE UPDATE ON "public"."render_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
ALTER TABLE ONLY "public"."admin_domains"
    ADD CONSTRAINT "admin_domains_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."app_admins"
    ADD CONSTRAINT "app_admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."blog_comments"
    ADD CONSTRAINT "blog_comments_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."blog_comments"
    ADD CONSTRAINT "blog_comments_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");
ALTER TABLE ONLY "public"."blog_comments"
    ADD CONSTRAINT "blog_comments_user_id_auth_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."blog_comments"
    ADD CONSTRAINT "blog_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."creator_profiles"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."copilot_suggestions"
    ADD CONSTRAINT "copilot_suggestions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."creator_alert_events"
    ADD CONSTRAINT "creator_alert_events_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "public"."creator_alert_rules"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."creator_alert_events"
    ADD CONSTRAINT "creator_alert_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."creator_alert_rules"
    ADD CONSTRAINT "creator_alert_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."creator_profiles"
    ADD CONSTRAINT "creator_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."creator_publish_queue"
    ADD CONSTRAINT "creator_publish_queue_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."creator_publish_queue"
    ADD CONSTRAINT "creator_publish_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."creator_session_metrics"
    ADD CONSTRAINT "creator_session_metrics_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."creator_session_metrics"
    ADD CONSTRAINT "creator_session_metrics_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."creator_session_metrics"
    ADD CONSTRAINT "creator_session_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."creator_sessions"
    ADD CONSTRAINT "creator_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."creator_uploads"
    ADD CONSTRAINT "creator_uploads_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."creator_uploads"
    ADD CONSTRAINT "creator_uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."creator_session_metrics"
    ADD CONSTRAINT "csm_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."edit_docs"
    ADD CONSTRAINT "edit_docs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."edit_docs"
    ADD CONSTRAINT "fk_edit_docs_session" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."edit_docs"
    ADD CONSTRAINT "fk_edit_docs_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."insights_bets"
    ADD CONSTRAINT "insights_bets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."insights_user_settings"
    ADD CONSTRAINT "insights_user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."media_versions"
    ADD CONSTRAINT "media_versions_edit_doc_id_fkey" FOREIGN KEY ("edit_doc_id") REFERENCES "public"."edit_docs"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."media_versions"
    ADD CONSTRAINT "media_versions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."media_versions"
    ADD CONSTRAINT "media_versions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."render_jobs"
    ADD CONSTRAINT "render_jobs_edit_id_fkey" FOREIGN KEY ("edit_id") REFERENCES "public"."edit_docs"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."render_jobs"
    ADD CONSTRAINT "render_jobs_editdoc_fkey" FOREIGN KEY ("edit_doc_id") REFERENCES "public"."edit_docs"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."render_jobs"
    ADD CONSTRAINT "render_jobs_session_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."render_jobs"
    ADD CONSTRAINT "render_jobs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."render_jobs"
    ADD CONSTRAINT "render_jobs_user_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_cocreations"
    ADD CONSTRAINT "session_cocreations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_cocreations"
    ADD CONSTRAINT "session_cocreations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_comments"
    ADD CONSTRAINT "session_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."session_comments"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_comments"
    ADD CONSTRAINT "session_comments_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_comments"
    ADD CONSTRAINT "session_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_impressions"
    ADD CONSTRAINT "session_impressions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_media"
    ADD CONSTRAINT "session_media_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_media"
    ADD CONSTRAINT "session_media_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_metrics_daily"
    ADD CONSTRAINT "session_metrics_daily_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_metrics"
    ADD CONSTRAINT "session_metrics_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_review_requests"
    ADD CONSTRAINT "session_review_requests_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_saves"
    ADD CONSTRAINT "session_saves_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_saves"
    ADD CONSTRAINT "session_saves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_snippets"
    ADD CONSTRAINT "session_snippets_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_snippets"
    ADD CONSTRAINT "session_snippets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_stories"
    ADD CONSTRAINT "session_stories_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_stories"
    ADD CONSTRAINT "session_stories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_versions"
    ADD CONSTRAINT "session_versions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."session_views"
    ADD CONSTRAINT "session_views_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."creator_sessions"("id") ON DELETE CASCADE;
CREATE POLICY "Allow delete own comments" ON "public"."blog_comments" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow insert for authenticated users" ON "public"."blog_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow insert for virtual uploads" ON "public"."creator_uploads" FOR INSERT WITH CHECK (("is_virtual" = true));
CREATE POLICY "Allow read published comments" ON "public"."blog_comments" FOR SELECT USING (("status" = 'visible'::"text"));
CREATE POLICY "Delete own cocreation" ON "public"."session_cocreations" FOR DELETE USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Delete own comment" ON "public"."session_comments" FOR DELETE USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Delete own impression" ON "public"."session_impressions" FOR DELETE USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Delete own media" ON "public"."session_media" FOR DELETE USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Delete own snippet" ON "public"."session_snippets" FOR DELETE USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Delete own story" ON "public"."session_stories" FOR DELETE USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Delete own uploads" ON "public"."creator_uploads" FOR DELETE USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Delete own view" ON "public"."session_views" FOR DELETE USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Insert own cocreation" ON "public"."session_cocreations" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "Insert own comment" ON "public"."session_comments" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "Insert own impression" ON "public"."session_impressions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "Insert own media" ON "public"."session_media" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "Insert own snippet" ON "public"."session_snippets" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "Insert own story" ON "public"."session_stories" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "Insert own uploads" ON "public"."creator_uploads" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "Insert own view" ON "public"."session_views" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "Select own cocreation" ON "public"."session_cocreations" FOR SELECT USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Select own comment" ON "public"."session_comments" FOR SELECT USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Select own impression" ON "public"."session_impressions" FOR SELECT USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Select own media" ON "public"."session_media" FOR SELECT USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Select own snippet" ON "public"."session_snippets" FOR SELECT USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Select own story" ON "public"."session_stories" FOR SELECT USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Select own uploads" ON "public"."creator_uploads" FOR SELECT USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Select own view" ON "public"."session_views" FOR SELECT USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Update own cocreation" ON "public"."session_cocreations" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "Update own comment" ON "public"."session_comments" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "Update own impression" ON "public"."session_impressions" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "Update own media" ON "public"."session_media" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "Update own snippet" ON "public"."session_snippets" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "Update own story" ON "public"."session_stories" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "Update own uploads" ON "public"."creator_uploads" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "Update own view" ON "public"."session_views" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "admin read" ON "public"."admin_domains" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));
CREATE POLICY "admin read" ON "public"."admin_email_boxes" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));
CREATE POLICY "admin read blocked_ips" ON "public"."blocked_ips" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));
CREATE POLICY "admin read payments" ON "public"."payments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));
CREATE POLICY "admin read refunds" ON "public"."refunds" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));
CREATE POLICY "admin read security_events" ON "public"."security_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));
CREATE POLICY "admin write" ON "public"."admin_domains" USING ("public"."is_admin"("auth"."uid"()));
CREATE POLICY "admin write" ON "public"."admin_email_boxes" USING ("public"."is_admin"("auth"."uid"()));
ALTER TABLE "public"."admin_domains" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."admin_email_boxes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."airports" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "airports_read_all" ON "public"."airports" FOR SELECT USING (true);
CREATE POLICY "airports_select_anon" ON "public"."airports" FOR SELECT TO "anon" USING (true);
ALTER TABLE "public"."app_admins" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_admins_select_self" ON "public"."app_admins" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));
CREATE POLICY "app_admins_service_all" ON "public"."app_admins" TO "service_role" USING (true) WITH CHECK (true);
ALTER TABLE "public"."blocked_ips" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocked_ips admin read" ON "public"."blocked_ips" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "cp"
  WHERE (("cp"."user_id" = "auth"."uid"()) AND ("cp"."role" = 'admin'::"text")))));
CREATE POLICY "blocked_ips service all" ON "public"."blocked_ips" TO "service_role" USING (true) WITH CHECK (true);
ALTER TABLE "public"."blog_comments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_comments_admin_manage" ON "public"."blog_comments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));
CREATE POLICY "blog_comments_delete_self" ON "public"."blog_comments" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));
CREATE POLICY "blog_comments_insert_self" ON "public"."blog_comments" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "blog_comments_read_visible" ON "public"."blog_comments" FOR SELECT TO "anon", "authenticated" USING (("status" = 'visible'::"text"));
CREATE POLICY "blog_comments_update_self" ON "public"."blog_comments" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_posts_owner_crud" ON "public"."blog_posts" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "blog_posts_read_published" ON "public"."blog_posts" FOR SELECT USING (("status" = 'published'::"public"."blog_status"));
CREATE POLICY "comments_delete_own" ON "public"."session_comments" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "comments_insert_own" ON "public"."session_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "comments_select_session" ON "public"."session_comments" FOR SELECT USING (true);
CREATE POLICY "comments_update_own" ON "public"."session_comments" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "copilot admin delete" ON "public"."copilot_suggestions" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "cp"
  WHERE (("cp"."user_id" = "auth"."uid"()) AND ("cp"."role" = 'admin'::"text")))));
CREATE POLICY "copilot admin read" ON "public"."copilot_suggestions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "cp"
  WHERE (("cp"."user_id" = "auth"."uid"()) AND ("cp"."role" = 'admin'::"text")))));
CREATE POLICY "copilot admin update" ON "public"."copilot_suggestions" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "cp"
  WHERE (("cp"."user_id" = "auth"."uid"()) AND ("cp"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "cp"
  WHERE (("cp"."user_id" = "auth"."uid"()) AND ("cp"."role" = 'admin'::"text")))));
CREATE POLICY "copilot admin write" ON "public"."copilot_suggestions" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "cp"
  WHERE (("cp"."user_id" = "auth"."uid"()) AND ("cp"."role" = 'admin'::"text")))));
ALTER TABLE "public"."copilot_suggestions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cpe_owner_read" ON "public"."creator_publish_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."creator_sessions" "s"
  WHERE (("s"."id" = "creator_publish_events"."session_id") AND ("s"."user_id" = "auth"."uid"())))));
CREATE POLICY "cpe_service_all" ON "public"."creator_publish_events" TO "service_role" USING (true) WITH CHECK (true);
CREATE POLICY "cpq_insert_own" ON "public"."creator_publish_queue" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "cpq_select_own" ON "public"."creator_publish_queue" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));
CREATE POLICY "cpq_update_own" ON "public"."creator_publish_queue" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));
CREATE POLICY "cps_insert_owner" ON "public"."creator_publish_schedule" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."creator_sessions" "s"
  WHERE (("s"."id" = "creator_publish_schedule"."session_id") AND ("s"."user_id" = "auth"."uid"())))));
CREATE POLICY "cps_select_owner" ON "public"."creator_publish_schedule" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."creator_sessions" "s"
  WHERE (("s"."id" = "creator_publish_schedule"."session_id") AND ("s"."user_id" = "auth"."uid"())))));
CREATE POLICY "cps_service_all" ON "public"."creator_publish_schedule" TO "service_role" USING (true) WITH CHECK (true);
ALTER TABLE "public"."creator_alert_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."creator_alert_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."creator_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."creator_publish_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."creator_publish_queue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."creator_publish_schedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."creator_session_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."creator_sessions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creator_sessions_admin_select" ON "public"."creator_sessions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));
CREATE POLICY "creator_sessions_admin_update" ON "public"."creator_sessions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text"))))) WITH CHECK (true);
CREATE POLICY "creator_sessions_delete_own" ON "public"."creator_sessions" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));
CREATE POLICY "creator_sessions_insert_own" ON "public"."creator_sessions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "creator_sessions_select_own" ON "public"."creator_sessions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));
CREATE POLICY "creator_sessions_update_own" ON "public"."creator_sessions" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
ALTER TABLE "public"."creator_uploads" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cs_delete_own" ON "public"."creator_sessions" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "cs_insert_self" ON "public"."creator_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "cs_owner_all" ON "public"."creator_sessions" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "cs_select_own" ON "public"."creator_sessions" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ((("auth"."jwt"() ->> 'email'::"text") IS NOT NULL) AND (("auth"."jwt"() ->> 'email'::"text") = ANY (COALESCE("shared_with", '{}'::"text"[]))))));
CREATE POLICY "cs_update_own" ON "public"."creator_sessions" FOR UPDATE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "csm_delete_own" ON "public"."creator_session_metrics" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "csm_insert_own" ON "public"."creator_session_metrics" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "csm_select_own" ON "public"."creator_session_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "csm_update_own" ON "public"."creator_session_metrics" FOR UPDATE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "cu_owner_all" ON "public"."creator_uploads" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "cu_public_virtual_read" ON "public"."creator_uploads" FOR SELECT USING (("is_virtual" = true));
CREATE POLICY "del_own_rules" ON "public"."creator_alert_rules" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "deny all write to anon" ON "public"."render_jobs" USING (false) WITH CHECK (false);
ALTER TABLE "public"."dns_audit_events" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dns_audit_events_select_admins" ON "public"."dns_audit_events" FOR SELECT TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));
ALTER TABLE "public"."edit_docs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edit_docs_delete_own" ON "public"."edit_docs" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "edit_docs_insert_own" ON "public"."edit_docs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "edit_docs_select_own" ON "public"."edit_docs" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "edit_docs_update_own" ON "public"."edit_docs" FOR UPDATE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "edits_owner_can_all" ON "public"."edit_docs" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."creator_sessions" "s"
  WHERE (("s"."id" = "edit_docs"."session_id") AND ("s"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."creator_sessions" "s"
  WHERE (("s"."id" = "edit_docs"."session_id") AND ("s"."user_id" = "auth"."uid"())))));
CREATE POLICY "ins_own_rules" ON "public"."creator_alert_rules" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
ALTER TABLE "public"."insights_bets" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insights_bets_delete_own" ON "public"."insights_bets" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "insights_bets_insert_own" ON "public"."insights_bets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "insights_bets_select_own" ON "public"."insights_bets" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "insights_bets_update_own" ON "public"."insights_bets" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
ALTER TABLE "public"."insights_user_settings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insights_user_settings_delete_own" ON "public"."insights_user_settings" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "insights_user_settings_insert_own" ON "public"."insights_user_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "insights_user_settings_select_own" ON "public"."insights_user_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "insights_user_settings_update_own" ON "public"."insights_user_settings" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
ALTER TABLE "public"."media_versions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_versions_insert_own" ON "public"."media_versions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "media_versions_select_own" ON "public"."media_versions" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "own_session_edits" ON "public"."edit_docs" USING (("session_id" IN ( SELECT "creator_sessions"."id"
   FROM "public"."creator_sessions"
  WHERE ("creator_sessions"."user_id" = "auth"."uid"()))));
CREATE POLICY "own_session_renders" ON "public"."render_jobs" USING (("session_id" IN ( SELECT "creator_sessions"."id"
   FROM "public"."creator_sessions"
  WHERE ("creator_sessions"."user_id" = "auth"."uid"()))));
ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments admin read" ON "public"."payments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "cp"
  WHERE (("cp"."user_id" = "auth"."uid"()) AND ("cp"."role" = 'admin'::"text")))));
CREATE POLICY "payments service all" ON "public"."payments" TO "service_role" USING (true) WITH CHECK (true);
CREATE POLICY "payments service role full" ON "public"."payments" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));
CREATE POLICY "profiles_delete_self" ON "public"."creator_profiles" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "app_admins"."user_id"
   FROM "public"."app_admins"))));
CREATE POLICY "profiles_insert_self" ON "public"."creator_profiles" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "app_admins"."user_id"
   FROM "public"."app_admins"))));
CREATE POLICY "profiles_select" ON "public"."creator_profiles" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "app_admins"."user_id"
   FROM "public"."app_admins"))));
CREATE POLICY "profiles_update_self" ON "public"."creator_profiles" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "app_admins"."user_id"
   FROM "public"."app_admins")))) WITH CHECK ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "app_admins"."user_id"
   FROM "public"."app_admins"))));
CREATE POLICY "public read uploads" ON "public"."creator_uploads" FOR SELECT TO "anon", "authenticated" USING (true);
CREATE POLICY "read airports anon" ON "public"."airports" FOR SELECT TO "anon" USING (true);
CREATE POLICY "read own session jobs" ON "public"."render_jobs" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "read_creator_uploads" ON "public"."creator_uploads" FOR SELECT TO "anon", "authenticated" USING (true);
ALTER TABLE "public"."refunds" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "refunds admin read" ON "public"."refunds" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "cp"
  WHERE (("cp"."user_id" = "auth"."uid"()) AND ("cp"."role" = 'admin'::"text")))));
CREATE POLICY "refunds service all" ON "public"."refunds" TO "service_role" USING (true) WITH CHECK (true);
ALTER TABLE "public"."render_jobs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "renders_owner_can_all" ON "public"."render_jobs" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."creator_sessions" "s"
  WHERE (("s"."id" = "render_jobs"."session_id") AND ("s"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."creator_sessions" "s"
  WHERE (("s"."id" = "render_jobs"."session_id") AND ("s"."user_id" = "auth"."uid"())))));
CREATE POLICY "rj_delete_own" ON "public"."render_jobs" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));
CREATE POLICY "rj_insert_own" ON "public"."render_jobs" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "rj_select_own" ON "public"."render_jobs" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));
CREATE POLICY "rj_update_own" ON "public"."render_jobs" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));
CREATE POLICY "sc_insert" ON "public"."session_comments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."creator_sessions" "s"
  WHERE (("s"."id" = "session_comments"."session_id") AND ("s"."user_id" = "auth"."uid"())))));
CREATE POLICY "sc_select" ON "public"."session_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."creator_sessions" "s"
  WHERE (("s"."id" = "session_comments"."session_id") AND ("s"."user_id" = "auth"."uid"())))));
ALTER TABLE "public"."security_events" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "security_events admin read" ON "public"."security_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "cp"
  WHERE (("cp"."user_id" = "auth"."uid"()) AND ("cp"."role" = 'admin'::"text")))));
CREATE POLICY "security_events service all" ON "public"."security_events" TO "service_role" USING (true) WITH CHECK (true);
CREATE POLICY "sel_own_events" ON "public"."creator_alert_events" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "sel_own_rules" ON "public"."creator_alert_rules" FOR SELECT USING (("auth"."uid"() = "user_id"));
ALTER TABLE "public"."session_cocreations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session_impressions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session_media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session_metrics_daily" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session_review_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session_saves" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session_saves_delete_own" ON "public"."session_saves" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));
CREATE POLICY "session_saves_insert_own" ON "public"."session_saves" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "session_saves_select_own" ON "public"."session_saves" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));
CREATE POLICY "session_saves_service_all" ON "public"."session_saves" TO "service_role" USING (true) WITH CHECK (true);
CREATE POLICY "session_saves_update_own" ON "public"."session_saves" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
ALTER TABLE "public"."session_snippets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session_stories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session_views" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sm_select_own" ON "public"."session_metrics" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."creator_sessions" "s"
  WHERE (("s"."id" = "session_metrics"."session_id") AND ("s"."user_id" = "auth"."uid"())))));
CREATE POLICY "smd_select_own" ON "public"."session_metrics_daily" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."creator_sessions" "s"
  WHERE (("s"."id" = "session_metrics_daily"."session_id") AND ("s"."user_id" = "auth"."uid"())))));
CREATE POLICY "srr_admin_all" ON "public"."session_review_requests" USING ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."creator_profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));
CREATE POLICY "srr_owner_select" ON "public"."session_review_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."creator_sessions" "cs"
  WHERE (("cs"."id" = "session_review_requests"."session_id") AND ("cs"."user_id" = "auth"."uid"())))));
ALTER TABLE "public"."stripe_webhooks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stripe_webhooks service all" ON "public"."stripe_webhooks" TO "service_role" USING (true) WITH CHECK (true);
CREATE POLICY "sv_delete_own" ON "public"."session_versions" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));
CREATE POLICY "sv_insert_own" ON "public"."session_versions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "sv_select_own" ON "public"."session_versions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));
CREATE POLICY "upd_own_rules" ON "public"."creator_alert_rules" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "update_own_row_content_type" ON "public"."creator_session_metrics" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "webhooks service role only" ON "public"."stripe_webhooks" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));
ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT ALL ON FUNCTION "public"."admin_payments_summary_30d"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_payments_summary_30d"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_payments_summary_30d"() TO "service_role";
GRANT ALL ON FUNCTION "public"."append_email_to_array"("email" "text", "session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."append_email_to_array"("email" "text", "session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."append_email_to_array"("email" "text", "session_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."append_email_to_array"("id" "uuid", "email_to_add" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."append_email_to_array"("id" "uuid", "email_to_add" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."append_email_to_array"("id" "uuid", "email_to_add" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."blog_posts_set_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."blog_posts_set_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."blog_posts_set_owner"() TO "service_role";
REVOKE ALL ON FUNCTION "public"."creator_alerts_eval_all"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."creator_alerts_eval_all"() TO "anon";
GRANT ALL ON FUNCTION "public"."creator_alerts_eval_all"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."creator_alerts_eval_all"() TO "service_role";
REVOKE ALL ON FUNCTION "public"."creator_alerts_eval_current_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."creator_alerts_eval_current_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."creator_alerts_eval_current_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."creator_alerts_eval_current_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."creator_alerts_eval_for"("_uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."creator_alerts_eval_for"("_uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."creator_alerts_eval_for"("_uid" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."creator_impact_percentile"("_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."creator_impact_percentile"("_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."creator_impact_percentile"("_days" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."creator_impact_percentile"("args" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."creator_impact_percentile"("args" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."creator_impact_percentile"("args" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."creator_metrics_timeseries"("args" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."creator_metrics_timeseries"("args" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."creator_metrics_timeseries"("args" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."creator_metrics_timeseries"("_days" integer, "_content_type" "public"."creator_content_type") TO "anon";
GRANT ALL ON FUNCTION "public"."creator_metrics_timeseries"("_days" integer, "_content_type" "public"."creator_content_type") TO "authenticated";
GRANT ALL ON FUNCTION "public"."creator_metrics_timeseries"("_days" integer, "_content_type" "public"."creator_content_type") TO "service_role";
GRANT ALL ON FUNCTION "public"."creator_posting_heatmap"("args" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."creator_posting_heatmap"("args" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."creator_posting_heatmap"("args" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."creator_posting_heatmap"("_days" integer, "_content_type" "public"."creator_content_type") TO "anon";
GRANT ALL ON FUNCTION "public"."creator_posting_heatmap"("_days" integer, "_content_type" "public"."creator_content_type") TO "authenticated";
GRANT ALL ON FUNCTION "public"."creator_posting_heatmap"("_days" integer, "_content_type" "public"."creator_content_type") TO "service_role";
GRANT ALL ON FUNCTION "public"."creator_uploads_set_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."creator_uploads_set_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."creator_uploads_set_slug"() TO "service_role";
GRANT ALL ON FUNCTION "public"."csm_increment_impressions"("p_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."csm_increment_impressions"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."csm_increment_impressions"("p_session_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."csm_increment_views"("p_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."csm_increment_views"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."csm_increment_views"("p_session_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."increment_impression"("session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_impression"("session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_impression"("session_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."increment_like"("session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_like"("session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_like"("session_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."increment_view"("session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_view"("session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_view"("session_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "service_role";
REVOKE ALL ON FUNCTION "public"."platform_avg_impact_score"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."platform_avg_impact_score"() TO "anon";
GRANT ALL ON FUNCTION "public"."platform_avg_impact_score"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."platform_avg_impact_score"() TO "service_role";
GRANT ALL ON FUNCTION "public"."platform_avg_impact_score"("days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."platform_avg_impact_score"("days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."platform_avg_impact_score"("days" integer) TO "service_role";
GRANT ALL ON TABLE "public"."blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";
GRANT ALL ON FUNCTION "public"."publish_due_blog_posts"("batch_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."publish_due_blog_posts"("batch_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."publish_due_blog_posts"("batch_size" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."publish_due_posts"() TO "anon";
GRANT ALL ON FUNCTION "public"."publish_due_posts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."publish_due_posts"() TO "service_role";
GRANT ALL ON FUNCTION "public"."remove_email_from_array"("id" "uuid", "email_to_remove" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_email_from_array"("id" "uuid", "email_to_remove" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_email_from_array"("id" "uuid", "email_to_remove" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."set_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_owner"() TO "service_role";
GRANT ALL ON FUNCTION "public"."set_profile_core_from_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_profile_core_from_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_profile_core_from_auth"() TO "service_role";
GRANT ALL ON FUNCTION "public"."set_profile_email_from_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_profile_email_from_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_profile_email_from_auth"() TO "service_role";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";
GRANT ALL ON FUNCTION "public"."slugify"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."slugify"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."slugify"("text") TO "service_role";
GRANT ALL ON FUNCTION "public"."sync_creator_profile_core"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_creator_profile_core"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_creator_profile_core"() TO "service_role";
GRANT ALL ON FUNCTION "public"."sync_creator_profile_emails"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_creator_profile_emails"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_creator_profile_emails"() TO "service_role";
GRANT ALL ON FUNCTION "public"."tg_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_set_updated_at"() TO "service_role";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "service_role";
GRANT ALL ON TABLE "public"."admin_domains" TO "anon";
GRANT ALL ON TABLE "public"."admin_domains" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_domains" TO "service_role";
GRANT ALL ON TABLE "public"."admin_email_boxes" TO "anon";
GRANT ALL ON TABLE "public"."admin_email_boxes" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_email_boxes" TO "service_role";
GRANT ALL ON TABLE "public"."airports" TO "anon";
GRANT ALL ON TABLE "public"."airports" TO "authenticated";
GRANT ALL ON TABLE "public"."airports" TO "service_role";
GRANT ALL ON SEQUENCE "public"."airports_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."airports_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."airports_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."app_admins" TO "anon";
GRANT ALL ON TABLE "public"."app_admins" TO "authenticated";
GRANT ALL ON TABLE "public"."app_admins" TO "service_role";
GRANT ALL ON TABLE "public"."blocked_ips" TO "anon";
GRANT ALL ON TABLE "public"."blocked_ips" TO "authenticated";
GRANT ALL ON TABLE "public"."blocked_ips" TO "service_role";
GRANT ALL ON TABLE "public"."blog_comments" TO "anon";
GRANT ALL ON TABLE "public"."blog_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_comments" TO "service_role";
GRANT ALL ON TABLE "public"."copilot_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."copilot_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."copilot_suggestions" TO "service_role";
GRANT ALL ON SEQUENCE "public"."copilot_suggestions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."copilot_suggestions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."copilot_suggestions_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."creator_alert_events" TO "anon";
GRANT ALL ON TABLE "public"."creator_alert_events" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_alert_events" TO "service_role";
GRANT ALL ON TABLE "public"."creator_alert_rules" TO "anon";
GRANT ALL ON TABLE "public"."creator_alert_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_alert_rules" TO "service_role";
GRANT ALL ON TABLE "public"."creator_profiles" TO "anon";
GRANT ALL ON TABLE "public"."creator_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_profiles" TO "service_role";
GRANT ALL ON TABLE "public"."creator_publish_events" TO "anon";
GRANT ALL ON TABLE "public"."creator_publish_events" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_publish_events" TO "service_role";
GRANT ALL ON TABLE "public"."creator_publish_queue" TO "anon";
GRANT ALL ON TABLE "public"."creator_publish_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_publish_queue" TO "service_role";
GRANT ALL ON TABLE "public"."creator_publish_schedule" TO "anon";
GRANT ALL ON TABLE "public"."creator_publish_schedule" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_publish_schedule" TO "service_role";
GRANT ALL ON TABLE "public"."creator_session_metrics" TO "anon";
GRANT ALL ON TABLE "public"."creator_session_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_session_metrics" TO "service_role";
GRANT UPDATE("content_type") ON TABLE "public"."creator_session_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_sessions" TO "anon";
GRANT ALL ON TABLE "public"."creator_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_sessions" TO "service_role";
GRANT ALL ON TABLE "public"."creator_uploads" TO "anon";
GRANT ALL ON TABLE "public"."creator_uploads" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_uploads" TO "service_role";
GRANT ALL ON TABLE "public"."dns_audit_events" TO "anon";
GRANT ALL ON TABLE "public"."dns_audit_events" TO "authenticated";
GRANT ALL ON TABLE "public"."dns_audit_events" TO "service_role";
GRANT ALL ON TABLE "public"."edit_docs" TO "anon";
GRANT ALL ON TABLE "public"."edit_docs" TO "authenticated";
GRANT ALL ON TABLE "public"."edit_docs" TO "service_role";
GRANT ALL ON TABLE "public"."insights_bets" TO "anon";
GRANT ALL ON TABLE "public"."insights_bets" TO "authenticated";
GRANT ALL ON TABLE "public"."insights_bets" TO "service_role";
GRANT ALL ON TABLE "public"."insights_user_settings" TO "anon";
GRANT ALL ON TABLE "public"."insights_user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."insights_user_settings" TO "service_role";
GRANT ALL ON TABLE "public"."media_versions" TO "anon";
GRANT ALL ON TABLE "public"."media_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."media_versions" TO "service_role";
GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";
GRANT ALL ON TABLE "public"."refunds" TO "anon";
GRANT ALL ON TABLE "public"."refunds" TO "authenticated";
GRANT ALL ON TABLE "public"."refunds" TO "service_role";
GRANT ALL ON TABLE "public"."render_jobs" TO "anon";
GRANT ALL ON TABLE "public"."render_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."render_jobs" TO "service_role";
GRANT ALL ON TABLE "public"."security_events" TO "anon";
GRANT ALL ON TABLE "public"."security_events" TO "authenticated";
GRANT ALL ON TABLE "public"."security_events" TO "service_role";
GRANT ALL ON TABLE "public"."session_cocreations" TO "anon";
GRANT ALL ON TABLE "public"."session_cocreations" TO "authenticated";
GRANT ALL ON TABLE "public"."session_cocreations" TO "service_role";
GRANT ALL ON TABLE "public"."session_comments" TO "anon";
GRANT ALL ON TABLE "public"."session_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."session_comments" TO "service_role";
GRANT ALL ON TABLE "public"."session_impressions" TO "anon";
GRANT ALL ON TABLE "public"."session_impressions" TO "authenticated";
GRANT ALL ON TABLE "public"."session_impressions" TO "service_role";
GRANT ALL ON TABLE "public"."session_media" TO "anon";
GRANT ALL ON TABLE "public"."session_media" TO "authenticated";
GRANT ALL ON TABLE "public"."session_media" TO "service_role";
GRANT ALL ON TABLE "public"."session_metrics" TO "anon";
GRANT ALL ON TABLE "public"."session_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."session_metrics" TO "service_role";
GRANT ALL ON TABLE "public"."session_metrics_daily" TO "anon";
GRANT ALL ON TABLE "public"."session_metrics_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."session_metrics_daily" TO "service_role";
GRANT ALL ON TABLE "public"."session_review_requests" TO "anon";
GRANT ALL ON TABLE "public"."session_review_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."session_review_requests" TO "service_role";
GRANT ALL ON TABLE "public"."session_saves" TO "anon";
GRANT ALL ON TABLE "public"."session_saves" TO "authenticated";
GRANT ALL ON TABLE "public"."session_saves" TO "service_role";
GRANT ALL ON TABLE "public"."session_snippets" TO "anon";
GRANT ALL ON TABLE "public"."session_snippets" TO "authenticated";
GRANT ALL ON TABLE "public"."session_snippets" TO "service_role";
GRANT ALL ON TABLE "public"."session_stories" TO "anon";
GRANT ALL ON TABLE "public"."session_stories" TO "authenticated";
GRANT ALL ON TABLE "public"."session_stories" TO "service_role";
GRANT ALL ON TABLE "public"."session_versions" TO "anon";
GRANT ALL ON TABLE "public"."session_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."session_versions" TO "service_role";
GRANT ALL ON TABLE "public"."session_views" TO "anon";
GRANT ALL ON TABLE "public"."session_views" TO "authenticated";
GRANT ALL ON TABLE "public"."session_views" TO "service_role";
GRANT ALL ON TABLE "public"."stripe_webhooks" TO "anon";
GRANT ALL ON TABLE "public"."stripe_webhooks" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_webhooks" TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
