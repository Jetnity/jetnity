-- Fixed Dev-only preflight/final readback, rendered by run.mjs.
-- Before import only original data/schema/rights/capacity are evaluated; final requires all checks.
-- No DML, DDL, grants, guard rebaseline or auth action.
-- Single statement: one MVCC read snapshot, compact output, no catalog row dump.
WITH expected AS MATERIALIZED (
 SELECT convert_from(decode('@@EXPECTED_JSON_BASE64@@','base64'),'UTF8')::jsonb AS e
), original_ids AS (
 SELECT jsonb_array_elements_text(e->'previous_ids') AS id FROM expected
),
objects AS (
  SELECT c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity,
         pg_get_userbyid(c.relowner) AS owner,
         c.relacl::text AS acl
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname IN ('places', 'airports')
), snapshot AS (
 SELECT jsonb_build_object(
  'relations', coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'table', o.relname, 'rls', o.relrowsecurity,
      'force_rls', o.relforcerowsecurity, 'owner', o.owner, 'acl', o.acl
    ) ORDER BY o.relname COLLATE "C") FROM objects o
  ), '[]'::jsonb),
  'policies', coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'table', p.tablename, 'name', p.policyname, 'permissive', p.permissive,
      'roles', to_jsonb(p.roles), 'command', p.cmd,
      'using', p.qual, 'with_check', p.with_check
    ) ORDER BY p.tablename COLLATE "C", p.policyname COLLATE "C")
    FROM pg_catalog.pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename IN ('places', 'airports')
  ), '[]'::jsonb),
  'constraints', coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'table', o.relname, 'name', c.conname, 'type', c.contype,
      'definition', pg_get_constraintdef(c.oid, false),
      'validated', c.convalidated, 'deferrable', c.condeferrable,
      'initially_deferred', c.condeferred
    ) ORDER BY o.relname COLLATE "C", c.conname COLLATE "C")
    FROM pg_catalog.pg_constraint c JOIN objects o ON o.oid = c.conrelid
  ), '[]'::jsonb),
  'triggers', coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'table', o.relname, 'name', t.tgname, 'enabled', t.tgenabled,
      'internal', t.tgisinternal, 'definition', pg_get_triggerdef(t.oid, false)
    ) ORDER BY o.relname COLLATE "C", t.tgname COLLATE "C")
    FROM pg_catalog.pg_trigger t JOIN objects o ON o.oid = t.tgrelid
  ), '[]'::jsonb)
 ) AS data
),
source_summary AS (
 SELECT count(*)::bigint AS rows,
        md5(string_agg(md5((to_jsonb(p)-'updated_at')::text),'' ORDER BY p.id COLLATE "C")) AS digest,
        count(*) FILTER (WHERE p.country_code IS NULL)::bigint AS null_country_codes,
        count(*) FILTER (WHERE p.lat IS NULL OR p.lon IS NULL
          OR p.lat NOT BETWEEN -90 AND 90 OR p.lon NOT BETWEEN -180 AND 180)::bigint AS invalid_coordinates
 FROM public.places p
), original_summary AS (
 SELECT count(*)::bigint AS rows,
        md5(string_agg(to_jsonb(p)::text,E'\n' ORDER BY p.id COLLATE "C")) AS digest
 FROM public.places p JOIN original_ids i ON i.id=p.id
), airport_summary AS (
 SELECT count(*)::bigint AS rows,
        md5(string_agg(to_jsonb(a)::text,E'\n' ORDER BY a.id)) AS digest
 FROM public.airports a
), type_counts AS (
 SELECT coalesce(jsonb_object_agg(typ,n),'{}'::jsonb) AS data
 FROM (SELECT typ,count(*)::bigint AS n FROM public.places GROUP BY typ) x
), source_counts AS (
 SELECT coalesce(jsonb_object_agg(source,n),'{}'::jsonb) AS data
 FROM (SELECT source,count(*)::bigint AS n FROM public.places GROUP BY source) x
), basic_schema AS (
 SELECT jsonb_build_object(
  'columns', coalesce((
   SELECT jsonb_agg(jsonb_build_object(
    'table',c.table_name,'column',c.column_name,'type',c.data_type,
    'udt',c.udt_name,'nullable',c.is_nullable
   ) ORDER BY c.table_name COLLATE "C",c.column_name COLLATE "C")
   FROM information_schema.columns c
   WHERE c.table_schema='public' AND c.table_name IN ('places','airports')
  ),'[]'::jsonb),
  'indexes', coalesce((
   SELECT jsonb_agg(jsonb_build_object(
    'table',i.tablename,'name',i.indexname,'definition',i.indexdef
   ) ORDER BY i.tablename COLLATE "C",i.indexname COLLATE "C")
   FROM pg_catalog.pg_indexes i
   WHERE i.schemaname='public' AND i.tablename IN ('places','airports')
  ),'[]'::jsonb),
  'roles', coalesce((
   SELECT jsonb_agg(jsonb_build_object(
    'table',g.table_name,'grantee',g.grantee,'privilege',g.privilege_type
   ) ORDER BY g.table_name COLLATE "C",g.grantee COLLATE "C",g.privilege_type COLLATE "C")
   FROM information_schema.table_privileges g
   WHERE g.table_schema='public' AND g.table_name IN ('places','airports')
  ),'[]'::jsonb)
 ) AS data
), guard AS MATERIALIZED (
 SELECT official_v3_guard_private.assert_catalog_v1()::text AS result
), facts AS (
 SELECT e, s.rows AS source_rows,s.digest AS source_digest,s.null_country_codes,s.invalid_coordinates,
        o.rows AS original_rows,o.digest AS original_digest,
        a.rows AS airport_rows,a.digest AS airport_digest,
        t.data AS types,c.data AS sources,b.data AS basic_data,
        sn.data AS supplementary_data,md5(sn.data::text) AS supplementary_digest,
        g.result AS bg1_result
 FROM expected CROSS JOIN source_summary s CROSS JOIN original_summary o
 CROSS JOIN airport_summary a CROSS JOIN type_counts t CROSS JOIN source_counts c
 CROSS JOIN basic_schema b CROSS JOIN snapshot sn CROSS JOIN guard g
), verdict AS (
 SELECT *,
  coalesce(source_rows=(e->>'source_count')::bigint AND source_digest=e->>'source_digest',false) AS source_matches,
  coalesce(original_rows=(e->>'previous_count')::bigint AND original_digest=e->>'previous_digest',false) AS originals_preserved,
  coalesce(airport_rows=(e->>'airport_count')::bigint AND airport_digest=e->>'airport_digest',false) AS airports_preserved,
  coalesce(types=e->'types' AND sources=e->'sources',false) AS counters_match,
  coalesce(basic_data->'columns'=e->'basic_schema'->'columns',false) AS columns_match,
  coalesce(basic_data->'indexes'=e->'basic_schema'->'indexes',false) AS indexes_match,
  coalesce(basic_data->'roles'=e->'basic_schema'->'roles',false) AS grants_match,
  coalesce(supplementary_digest=e->>'supplementary_digest',false) AS rls_constraints_match,
  coalesce(null_country_codes=(e->>'null_country_codes')::bigint AND invalid_coordinates=0,false) AS quality_matches
 FROM facts
)
SELECT jsonb_build_object(
 'checked_at',statement_timestamp(),
 'project_scope','yfvbxvijcorffwxbxahl',
 'overall_pass',source_matches AND originals_preserved AND airports_preserved AND counters_match
   AND columns_match AND indexes_match AND grants_match AND rls_constraints_match AND quality_matches,
 'source',jsonb_build_object(
   'rows',source_rows,'expected_rows',e->'source_count',
   'digest',source_digest,'expected_digest',e->'source_digest',
   'algorithm','md5(concat(md5((to_jsonb(row)-updated_at)::text)) ORDER BY id COLLATE C)',
   'matches_all_confirmed_source_receipts',source_matches,
   'confirmed_receipts',e->'receipt_count','receipt_files_sha256',e->'receipt_files_sha256'
 ),
 'original_places',jsonb_build_object(
   'rows',original_rows,'expected_rows',e->'previous_count',
   'digest',original_digest,'expected_digest',e->'previous_digest',
   'all_columns_including_updated_at_unchanged',originals_preserved
 ),
 'airports',jsonb_build_object(
   'rows',airport_rows,'expected_rows',e->'airport_count',
   'digest',airport_digest,'expected_digest',e->'airport_digest',
   'all_columns_unchanged',airports_preserved
 ),
 'counts',jsonb_build_object('types',types,'sources',sources,'match',counters_match),
 'quality',jsonb_build_object(
   'null_country_codes',null_country_codes,'expected_null_country_codes',e->'null_country_codes',
   'invalid_coordinates',invalid_coordinates,'match',quality_matches
 ),
 'schema_and_rights',jsonb_build_object(
   'columns_unchanged',columns_match,'indexes_unchanged',indexes_match,'grants_unchanged',grants_match,
   'rls_constraints_triggers_owner_acl_unchanged',rls_constraints_match,
   'supplementary_digest',supplementary_digest,'expected_supplementary_digest',e->'supplementary_digest',
   'supplementary_capture_point',e->'supplementary_capture_point'
 ),
 'capacity',jsonb_build_object(
   'database_bytes',pg_database_size(current_database()),
   'places_bytes',pg_total_relation_size('public.places'::regclass),
   'places_indexes_bytes',pg_indexes_size('public.places'::regclass),
   'airports_bytes',pg_total_relation_size('public.airports'::regclass),
   'transport_database_size_guard_bytes',786432000
 ),
 'bg1',jsonb_build_object(
   'function','official_v3_guard_private.assert_catalog_v1',
   'returned_without_exception',true,'result',bg1_result
 )
) AS acceptance
FROM verdict;
