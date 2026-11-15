-- Read-only candidate readback. Installation/rows do not establish hosted UI acceptance.
SELECT
  'marketing_drafts_unapplied_candidate_v1'::text AS scope,
  (SELECT count(*) FROM jetnity_marketing_private.drafts_v1)::text AS drafts,
  (SELECT count(*) FROM jetnity_marketing_private.revisions_v1)::text AS revisions,
  (SELECT count(*) FROM jetnity_marketing_private.operations_v1)::text AS receipts,
  (SELECT count(*) FROM jetnity_marketing_private.drafts_v1 d
    WHERE jetnity_marketing_private.chain_valid_v1(d.draft_id) IS NOT TRUE)::text AS invalid_chains,
  (SELECT count(*) = 3 AND bool_and(c.relrowsecurity AND c.relforcerowsecurity
      AND pg_get_userbyid(c.relowner) = 'postgres'
      AND NOT has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      AND NOT has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      AND NOT has_table_privilege('service_role',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'))
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='jetnity_marketing_private' AND c.relkind='r')::text AS private_tables_closed,
  (SELECT count(*)=0 FROM pg_policies WHERE schemaname='jetnity_marketing_private')::text AS no_client_policies,
  (SELECT count(*)=2 AND bool_and(p.prosecdef AND pg_get_userbyid(p.proowner)='postgres'
      AND p.proconfig @> ARRAY['search_path=pg_catalog, pg_temp']
      AND has_function_privilege('authenticated',p.oid,'EXECUTE')
      AND NOT has_function_privilege('anon',p.oid,'EXECUTE')
      AND NOT has_function_privilege('service_role',p.oid,'EXECUTE')
      AND NOT EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl
        WHERE acl.grantee NOT IN (p.proowner,(SELECT oid FROM pg_roles WHERE rolname='authenticated'))))
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('admin_marketing_drafts_apply_v1','admin_marketing_drafts_read_v1'))::text AS wrappers_closed,
  (SELECT count(*)>0 AND bool_and(p.prosecdef=(p.proname='enforce_chain_v1') AND pg_get_userbyid(p.proowner)='postgres'
      AND p.proconfig @> ARRAY['search_path=pg_catalog, pg_temp']
      AND NOT EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl WHERE acl.grantee<>p.proowner))
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='jetnity_marketing_private')::text AS internal_functions_closed;
