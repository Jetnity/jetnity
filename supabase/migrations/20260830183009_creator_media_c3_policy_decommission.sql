do $c3$
declare
  v_ref_count integer;
  v_named_count integer;
begin
  select count(*) into v_ref_count
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and (coalesce(qual, '') like '%creator-media%' or coalesce(with_check, '') like '%creator-media%');

  select count(*) into v_named_count
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = any(array[
      'creator-media: own uploads only 59k4xv_0',
      'creator-media: own uploads only 59k4xv_1',
      'creator-media: own uploads only 59k4xv_2',
      'creator-media: own uploads only 59k4xv_3'
    ]);

  -- Fresh replay / already-clean state: nothing to remove.
  if v_ref_count = 0 and v_named_count = 0 then
    return;
  end if;

  -- Any partial, renamed, duplicated or additional creator-media policy is unsafe.
  if v_ref_count <> 4 or v_named_count <> 4 then
    raise exception 'C3 STOP: creator-media policy set drift (ref %, named %)', v_ref_count, v_named_count;
  end if;

  -- Production execution is allowed only after the Storage API deletion left the source bucket empty/private.
  if not exists (
    select 1 from storage.buckets
    where id = 'creator-media'
      and name = 'creator-media'
      and public = false
      and file_size_limit is null
      and allowed_mime_types is null
  ) then
    raise exception 'C3 STOP: creator-media bucket contract drift';
  end if;

  if (select count(*) from storage.objects where bucket_id = 'creator-media') <> 0 then
    raise exception 'C3 STOP: creator-media bucket is not empty';
  end if;

  -- Recovery is a hard safety dependency and must remain exact.
  if not exists (
    select 1 from storage.buckets
    where id = 'jetnity-legacy-recovery'
      and name = 'jetnity-legacy-recovery'
      and public = false
      and file_size_limit = 5000000
      and allowed_mime_types = array['image/png']::text[]
  ) then
    raise exception 'C3 STOP: recovery bucket contract drift';
  end if;

  if (select count(*) from storage.objects where bucket_id = 'jetnity-legacy-recovery') <> 1
     or (select coalesce(sum((metadata->>'size')::bigint),0) from storage.objects where bucket_id = 'jetnity-legacy-recovery') <> 3030830
     or (select count(distinct metadata->>'eTag') from storage.objects where bucket_id = 'jetnity-legacy-recovery') <> 1
     or (select min(replace(metadata->>'eTag','"','')) from storage.objects where bucket_id = 'jetnity-legacy-recovery') <> '3af8e54d0183e045b501dca521a382a3'
     or (select min(md5(name)) from storage.objects where bucket_id = 'jetnity-legacy-recovery') <> '6f449a0fc5dd219fe6ef5f82398a1bee'
  then
    raise exception 'C3 STOP: recovery object contract drift';
  end if;

  -- Exact policy 0: SELECT.
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='creator-media: own uploads only 59k4xv_0'
      and permissive='PERMISSIVE'
      and roles::text[] = array['authenticated']::text[]
      and cmd='SELECT'
      and qual=$q$((bucket_id = 'creator-media'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1]))$q$
      and with_check is null
  ) then raise exception 'C3 STOP: policy _0 drift'; end if;

  -- Exact policy 1: INSERT.
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='creator-media: own uploads only 59k4xv_1'
      and permissive='PERMISSIVE'
      and roles::text[] = array['authenticated']::text[]
      and cmd='INSERT'
      and qual is null
      and with_check=$q$((bucket_id = 'creator-media'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1]))$q$
  ) then raise exception 'C3 STOP: policy _1 drift'; end if;

  -- Exact policy 2: UPDATE.
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='creator-media: own uploads only 59k4xv_2'
      and permissive='PERMISSIVE'
      and roles::text[] = array['authenticated']::text[]
      and cmd='UPDATE'
      and qual=$q$((bucket_id = 'creator-media'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1]))$q$
      and with_check is null
  ) then raise exception 'C3 STOP: policy _2 drift'; end if;

  -- Exact policy 3: DELETE.
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='creator-media: own uploads only 59k4xv_3'
      and permissive='PERMISSIVE'
      and roles::text[] = array['authenticated']::text[]
      and cmd='DELETE'
      and qual=$q$((bucket_id = 'creator-media'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1]))$q$
      and with_check is null
  ) then raise exception 'C3 STOP: policy _3 drift'; end if;

  drop policy "creator-media: own uploads only 59k4xv_0" on storage.objects;
  drop policy "creator-media: own uploads only 59k4xv_1" on storage.objects;
  drop policy "creator-media: own uploads only 59k4xv_2" on storage.objects;
  drop policy "creator-media: own uploads only 59k4xv_3" on storage.objects;

  if exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and (coalesce(qual,'') like '%creator-media%' or coalesce(with_check,'') like '%creator-media%')
  ) then
    raise exception 'C3 STOP: creator-media policy remains after drop';
  end if;
end
$c3$;