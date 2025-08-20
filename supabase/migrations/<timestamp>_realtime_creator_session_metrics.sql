do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'creator_session_metrics'
  ) then
    alter publication supabase_realtime add table public.creator_session_metrics;
  end if;
end
$$;
