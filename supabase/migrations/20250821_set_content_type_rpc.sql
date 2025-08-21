do $$
begin
  --------------------------------------------------------------------
  -- 0) Enum & Spalte sicherstellen (idempotent)
  --------------------------------------------------------------------
  if not exists (select 1 from pg_type where typname = 'creator_content_type') then
    create type public.creator_content_type as enum ('video','image','guide','blog','story','other');
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'creator_session_metrics'
      and column_name  = 'content_type'
  ) then
    alter table public.creator_session_metrics
      add column content_type public.creator_content_type not null default 'other';
  end if;

  --------------------------------------------------------------------
  -- 1) Einzel-Update per RPC (nur Owner)
  --------------------------------------------------------------------
  create or replace function public.set_content_type(
    p_session_id text,
    p_type text
  )
  returns table(session_id text, content_type public.creator_content_type)
  language sql
  security definer
  set search_path = public
  as $$
    update public.creator_session_metrics
       set content_type = (p_type)::public.creator_content_type
     where user_id = auth.uid()
       and session_id::text = p_session_id
    returning session_id::text, content_type
  $$;

  revoke all on function public.set_content_type(text, text) from public;
  grant execute on function public.set_content_type(text, text) to authenticated;

  --------------------------------------------------------------------
  -- 2) Bulk-Update per RPC (nur Owner)
  --------------------------------------------------------------------
  create or replace function public.set_content_type_bulk(
    p_session_ids text[],
    p_type text
  )
  returns table(session_id text, content_type public.creator_content_type)
  language sql
  security definer
  set search_path = public
  as $$
    update public.creator_session_metrics
       set content_type = (p_type)::public.creator_content_type
     where user_id = auth.uid()
       and session_id::text = any(p_session_ids)
    returning session_id::text, content_type
  $$;

  revoke all on function public.set_content_type_bulk(text[], text) from public;
  grant execute on function public.set_content_type_bulk(text[], text) to authenticated;

  --------------------------------------------------------------------
  -- 3) RLS & Rechte härten: kein direktes UPDATE mehr nötig
  --------------------------------------------------------------------
  alter table public.creator_session_metrics enable row level security;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'creator_session_metrics'
      and policyname = 'update_own_row_content_type'
  ) then
    create policy "update_own_row_content_type"
      on public.creator_session_metrics
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  -- Direktes Spalten-UPDATE entziehen (wir gehen über RPC)
  revoke update on public.creator_session_metrics from authenticated;
end
$$;
