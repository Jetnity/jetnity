do $$
begin
  -- Enum anlegen, falls nicht vorhanden
  if not exists (select 1 from pg_type where typname = 'creator_content_type') then
    create type public.creator_content_type as enum ('video','image','guide','blog','story','other');
  end if;

  -- Spalte hinzufügen (idempotent)
  if not exists (
    select 1
    from information_schema.columns
    where table_schema='public'
      and table_name='creator_session_metrics'
      and column_name='content_type'
  ) then
    alter table public.creator_session_metrics
      add column content_type public.creator_content_type not null default 'other';
  end if;

  -- sinnvollen Index (idempotent)
  create index if not exists csm_user_created_type_idx
    on public.creator_session_metrics (user_id, created_at, content_type);
end
$$;
