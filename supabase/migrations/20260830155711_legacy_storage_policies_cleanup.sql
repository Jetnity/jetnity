-- Legacy Cleanup Batch B: remove only obsolete Storage policies after the
-- corresponding ten empty buckets were removed through the Storage API.
-- Product-Owner approved on 2026-08-30; issue #255.
-- `creator-media` is explicit hard non-scope.
--
-- Replay contract:
-- - Production before-image may contain exactly the known 24 legacy policies.
-- - A fresh/replayed environment may already contain zero of these policies.
-- - Any partial or changed legacy-policy set fails closed.
-- - `creator-media` policies, when present, must match the known exact fingerprint
--   and must remain unchanged by this migration.

do $$
declare
  _candidate_count integer;
  _candidate_fingerprint text;
  _candidate_names text[];
  _expected_names constant text[] := array[
    'Auth manage own public-media',
    'Auth upload public-media',
    'Public read public-media',
    'media-original_del_owner',
    'media-original_ins_owner',
    'media-original_sel_owner',
    'media-original_upd_owner',
    'media-proxy_del_owner',
    'media-proxy_ins_owner',
    'media-proxy_sel_owner',
    'media-proxy_upd_owner',
    'media-renders_del_owner',
    'media-renders_ins_owner',
    'media-renders_sel_owner',
    'media-renders_upd_owner',
    'media-thumbs_del_owner',
    'media-thumbs_ins_owner',
    'media-thumbs_sel_owner',
    'media-thumbs_upd_owner',
    'media-versions_del_owner',
    'media-versions_ins_owner',
    'media-versions_sel_owner',
    'media-versions_upd_owner',
    'public-media-read'
  ];
  _policy text;
  _creator_before_count integer;
  _creator_before_fingerprint text;
  _creator_after_count integer;
  _creator_after_fingerprint text;
begin
  with kandidaten(id) as (
    values
      ('masks'),
      ('media-original'),
      ('media-proxy'),
      ('media-renders'),
      ('media-thumbs'),
      ('media-versions'),
      ('public-media'),
      ('renders'),
      ('session-versions'),
      ('subtitles')
  ), policies as (
    select
      p.tablename,
      p.policyname,
      p.cmd,
      p.roles::text as roles,
      coalesce(p.qual, '') as qual,
      coalesce(p.with_check, '') as with_check
    from pg_policies p
    where p.schemaname = 'storage'
      and exists (
        select 1
        from kandidaten k
        where coalesce(p.qual, '') like '%' || quote_literal(k.id) || '%'
           or coalesce(p.with_check, '') like '%' || quote_literal(k.id) || '%'
      )
  )
  select
    count(*)::integer,
    md5(string_agg(
      tablename || '|' || policyname || '|' || cmd || '|' || roles || '|' || qual || '|' || with_check,
      E'\n' order by tablename, policyname
    )),
    array_agg(policyname order by policyname)
  into _candidate_count, _candidate_fingerprint, _candidate_names
  from policies;

  select
    count(*)::integer,
    md5(string_agg(
      p.tablename || '|' || p.policyname || '|' || p.cmd || '|' || p.roles::text || '|' ||
      coalesce(p.qual, '') || '|' || coalesce(p.with_check, ''),
      E'\n' order by p.tablename, p.policyname
    ))
  into _creator_before_count, _creator_before_fingerprint
  from pg_policies p
  where p.schemaname = 'storage'
    and p.tablename = 'objects'
    and (
      coalesce(p.qual, '') like '%''creator-media''%'
      or coalesce(p.with_check, '') like '%''creator-media''%'
    );

  if not (
    (_creator_before_count = 0 and _creator_before_fingerprint is null)
    or
    (_creator_before_count = 4 and _creator_before_fingerprint = '84f13dec01a78b2ae7cef5c00a396958')
  ) then
    raise exception 'creator-media policy guard drift: count=%, fingerprint=%',
      _creator_before_count, _creator_before_fingerprint
      using errcode = 'P0001';
  end if;

  if _candidate_count = 0 then
    if _candidate_fingerprint is not null or _candidate_names is not null then
      raise exception 'Legacy Storage clean replay state is internally inconsistent'
        using errcode = 'P0001';
    end if;
  elsif _candidate_count = 24
     and _candidate_fingerprint = 'a9166c145523b0473af12199d8bac91a'
     and _candidate_names = _expected_names then

    -- Production execution requires the known creator-media guard to be present.
    -- This prevents a partial Storage-policy state from being silently accepted.
    if _creator_before_count <> 4
       or _creator_before_fingerprint <> '84f13dec01a78b2ae7cef5c00a396958' then
      raise exception 'Legacy Storage Production state lacks exact creator-media guard'
        using errcode = 'P0001';
    end if;

    foreach _policy in array _expected_names loop
      execute format('drop policy %I on storage.objects', _policy);
    end loop;
  else
    raise exception 'Legacy Storage policy before-image drift: count=%, fingerprint=%',
      _candidate_count, _candidate_fingerprint
      using errcode = 'P0001';
  end if;

  if exists (
    with kandidaten(id) as (
      values
        ('masks'),
        ('media-original'),
        ('media-proxy'),
        ('media-renders'),
        ('media-thumbs'),
        ('media-versions'),
        ('public-media'),
        ('renders'),
        ('session-versions'),
        ('subtitles')
    )
    select 1
    from pg_policies p
    where p.schemaname = 'storage'
      and exists (
        select 1
        from kandidaten k
        where coalesce(p.qual, '') like '%' || quote_literal(k.id) || '%'
           or coalesce(p.with_check, '') like '%' || quote_literal(k.id) || '%'
      )
  ) then
    raise exception 'Legacy Storage policies remain after cleanup'
      using errcode = 'P0001';
  end if;

  select
    count(*)::integer,
    md5(string_agg(
      p.tablename || '|' || p.policyname || '|' || p.cmd || '|' || p.roles::text || '|' ||
      coalesce(p.qual, '') || '|' || coalesce(p.with_check, ''),
      E'\n' order by p.tablename, p.policyname
    ))
  into _creator_after_count, _creator_after_fingerprint
  from pg_policies p
  where p.schemaname = 'storage'
    and p.tablename = 'objects'
    and (
      coalesce(p.qual, '') like '%''creator-media''%'
      or coalesce(p.with_check, '') like '%''creator-media''%'
    );

  if _creator_after_count is distinct from _creator_before_count
     or _creator_after_fingerprint is distinct from _creator_before_fingerprint then
    raise exception 'creator-media policy guard changed during cleanup: before=(%,%), after=(%,%)',
      _creator_before_count, _creator_before_fingerprint,
      _creator_after_count, _creator_after_fingerprint
      using errcode = 'P0001';
  end if;
end
$$;
