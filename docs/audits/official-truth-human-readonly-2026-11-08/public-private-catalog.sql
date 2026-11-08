-- Jetnity: Official Truth Human Read-only Audit Preparation 1 / TASK V1.
-- Source artifact only. NOT EXECUTED by the author or any AI in this task.
-- No connection, target attestation, migration, application call or activation.
-- The single SELECT reads only explicit pg_catalog metadata. Unknown names and
-- all definition/configuration text stay out of the result. See README.md.
-- Fingerprints use raw catalog fields, never decompiled/executed expressions.
-- textsend is reached only when BOTH server and client encoding are UTF8.
-- A successful result is metadata evidence, never a database-security PASS.

BEGIN READ ONLY;

WITH
environment AS MATERIALIZED (
  SELECT
    pg_catalog.current_setting('transaction_read_only'::pg_catalog.text)
      OPERATOR(pg_catalog.=) 'on'::pg_catalog.text AS read_only,
    pg_catalog.current_setting('server_encoding'::pg_catalog.text)
      OPERATOR(pg_catalog.=) 'UTF8'::pg_catalog.text AS server_utf8,
    pg_catalog.current_setting('client_encoding'::pg_catalog.text)
      OPERATOR(pg_catalog.=) 'UTF8'::pg_catalog.text AS client_utf8,
    pg_catalog.current_setting('server_version_num'::pg_catalog.text)::pg_catalog.int4
      AS server_version_num,
    pg_catalog.date_part('epoch'::pg_catalog.text, pg_catalog.statement_timestamp())
      AS statement_epoch_seconds_utc
),
requested_schemas(label) AS (
  VALUES ('public'::pg_catalog.text), ('private'::pg_catalog.text)
),
schemas AS (
  SELECT s.label, n.oid, n.nspowner, n.nspacl
  FROM requested_schemas AS s
  LEFT JOIN pg_catalog.pg_namespace AS n
    ON n.nspname::pg_catalog.text OPERATOR(pg_catalog.=) s.label
),
known_roles(label) AS (
  VALUES ('anon'::pg_catalog.text), ('authenticated'::pg_catalog.text),
    ('service_role'::pg_catalog.text), ('postgres'::pg_catalog.text),
    ('authenticator'::pg_catalog.text), ('supabase_admin'::pg_catalog.text)
),
principals AS (
  SELECT k.label, r.oid, r.rolsuper, r.rolinherit, r.rolbypassrls, r.rolcanlogin
  FROM known_roles AS k
  LEFT JOIN pg_catalog.pg_roles AS r
    ON r.rolname::pg_catalog.text OPERATOR(pg_catalog.=) k.label
),
known_objects(kind, schema_label, label) AS (
  VALUES
    ('relation'::pg_catalog.text, 'public'::pg_catalog.text, 'profiles'::pg_catalog.text),
    ('relation', 'public', 'trips'), ('relation', 'public', 'trip_stages'),
    ('relation', 'public', 'trip_days'), ('relation', 'public', 'trip_items'),
    ('relation', 'public', 'places'), ('relation', 'public', 'airports'),
    ('routine', 'public', 'darf_official_truth_freigeben'),
    ('routine', 'public', 'hat_rolle_mindestens'),
    ('routine', 'public', 'aktuelles_admin_aal2'),
    ('routine', 'public', 'aktuelle_rolle')
),
relations AS (
  SELECT c.oid, s.label AS schema_label, c.relnamespace, c.relowner,
    c.relkind, c.relpersistence, c.relrowsecurity, c.relforcerowsecurity,
    c.relacl, c.reloptions, k.label AS known_name
  FROM pg_catalog.pg_class AS c
  JOIN schemas AS s ON c.relnamespace OPERATOR(pg_catalog.=) s.oid
  LEFT JOIN known_objects AS k
    ON k.kind OPERATOR(pg_catalog.=) 'relation'::pg_catalog.text
    AND k.schema_label OPERATOR(pg_catalog.=) s.label
    AND k.label OPERATOR(pg_catalog.=) c.relname::pg_catalog.text
  WHERE c.relkind OPERATOR(pg_catalog.=)
    ANY (ARRAY['r', 'p', 'v', 'm', 'f', 'S']::pg_catalog."char"[])
),
columns AS (
  SELECT a.attrelid, a.attnum, a.atttypid, a.atttypmod, a.attnotnull,
    a.attidentity, a.attgenerated, a.attisdropped, a.attacl,
    CASE WHEN a.attname::pg_catalog.text OPERATOR(pg_catalog.=)
      ANY (ARRAY['id', 'user_id', 'role', 'status', 'revision',
        'created_at', 'updated_at']::pg_catalog.text[])
      THEN a.attname::pg_catalog.text ELSE NULL::pg_catalog.text END AS known_name,
    d.oid AS default_oid, d.adbin
  FROM pg_catalog.pg_attribute AS a
  JOIN relations AS r ON r.oid OPERATOR(pg_catalog.=) a.attrelid
  LEFT JOIN pg_catalog.pg_attrdef AS d
    ON d.adrelid OPERATOR(pg_catalog.=) a.attrelid
    AND d.adnum OPERATOR(pg_catalog.=) a.attnum
  WHERE a.attnum OPERATOR(pg_catalog.>) 0::pg_catalog.int2
),
routines AS (
  SELECT p.oid, s.label AS schema_label, p.pronamespace, p.proowner,
    p.prolang, p.prokind, p.prosecdef, p.proleakproof, p.proisstrict,
    p.proretset, p.provolatile, p.proparallel, p.prorettype, p.proargtypes,
    p.proallargtypes, p.proargmodes, p.proargnames, p.provariadic,
    p.pronargdefaults, p.proacl, p.proconfig, p.prosrc, p.probin,
    p.prosqlbody, p.proargdefaults, k.label AS known_name,
    CASE WHEN l.lanname::pg_catalog.text OPERATOR(pg_catalog.=)
      ANY (ARRAY['sql', 'plpgsql', 'internal', 'c']::pg_catalog.text[])
      THEN l.lanname::pg_catalog.text ELSE NULL::pg_catalog.text END AS known_language,
    (SELECT pg_catalog.count(*) FROM pg_catalog.unnest(p.proconfig) AS cfg(value)
      WHERE pg_catalog.left(cfg.value, 12::pg_catalog.int4)
        OPERATOR(pg_catalog.=) 'search_path='::pg_catalog.text) AS search_path_entries,
    (SELECT pg_catalog.bool_or(cfg.value OPERATOR(pg_catalog.=)
      'search_path=pg_catalog'::pg_catalog.text)
      FROM pg_catalog.unnest(p.proconfig) AS cfg(value)) AS exact_pg_catalog_search_path
  FROM pg_catalog.pg_proc AS p
  JOIN schemas AS s ON s.oid OPERATOR(pg_catalog.=) p.pronamespace
  LEFT JOIN pg_catalog.pg_language AS l ON l.oid OPERATOR(pg_catalog.=) p.prolang
  LEFT JOIN known_objects AS k
    ON k.kind OPERATOR(pg_catalog.=) 'routine'::pg_catalog.text
    AND k.schema_label OPERATOR(pg_catalog.=) s.label
    AND k.label OPERATOR(pg_catalog.=) p.proname::pg_catalog.text
),
policies AS (
  SELECT p.oid, p.polrelid, p.polcmd, p.polpermissive, p.polroles,
    p.polqual, p.polwithcheck
  FROM pg_catalog.pg_policy AS p
  JOIN relations AS r ON r.oid OPERATOR(pg_catalog.=) p.polrelid
),
constraints AS (
  SELECT c.oid, c.conrelid, c.confrelid, c.contype, c.condeferrable,
    c.condeferred, c.convalidated, c.conkey, c.confkey,
    c.confupdtype, c.confdeltype, c.confmatchtype, c.conbin
  FROM pg_catalog.pg_constraint AS c
  WHERE EXISTS (SELECT 1 FROM relations AS r
    WHERE r.oid OPERATOR(pg_catalog.=) c.conrelid
       OR r.oid OPERATOR(pg_catalog.=) c.confrelid)
),
triggers AS (
  SELECT t.oid, t.tgrelid, t.tgfoid, t.tgtype, t.tgenabled, t.tgisinternal,
    t.tgconstraint, t.tgdeferrable, t.tginitdeferred, t.tgattr, t.tgargs, t.tgqual
  FROM pg_catalog.pg_trigger AS t
  JOIN relations AS r ON r.oid OPERATOR(pg_catalog.=) t.tgrelid
),
indexes AS (
  SELECT i.indexrelid, i.indrelid, i.indisunique, i.indisprimary,
    i.indisexclusion, i.indimmediate, i.indisvalid, i.indisready,
    i.indkey, i.indclass, i.indcollation, i.indoption, i.indexprs, i.indpred
  FROM pg_catalog.pg_index AS i
  JOIN relations AS r ON r.oid OPERATOR(pg_catalog.=) i.indrelid
),
rewrite_rules AS (
  SELECT w.oid, w.ev_class, w.ev_type, w.ev_enabled, w.is_instead,
    w.ev_qual, w.ev_action
  FROM pg_catalog.pg_rewrite AS w
  JOIN relations AS r ON r.oid OPERATOR(pg_catalog.=) w.ev_class
),
default_acls AS (
  SELECT d.oid, d.defaclrole, d.defaclnamespace, d.defaclobjtype, d.defaclacl,
    s.label AS schema_label
  FROM pg_catalog.pg_default_acl AS d
  LEFT JOIN schemas AS s ON s.oid OPERATOR(pg_catalog.=) d.defaclnamespace
  WHERE d.defaclnamespace OPERATOR(pg_catalog.=) 0::pg_catalog.oid
     OR s.oid IS NOT NULL
),
acl_sources(kind, object_oid, sub_id, acl, origin) AS (
  SELECT 'schema'::pg_catalog.text, s.oid, 0::pg_catalog.int4,
    COALESCE(s.nspacl, pg_catalog.acldefault('n'::pg_catalog."char", s.nspowner)),
    CASE WHEN s.nspacl IS NULL THEN 'built_in_default' ELSE 'explicit' END
  FROM schemas AS s WHERE s.oid IS NOT NULL
  UNION ALL
  SELECT 'relation', r.oid, 0,
    COALESCE(r.relacl, pg_catalog.acldefault(
      CASE WHEN r.relkind OPERATOR(pg_catalog.=) 'S'::pg_catalog."char"
        THEN 's'::pg_catalog."char" ELSE 'r'::pg_catalog."char" END, r.relowner)),
    CASE WHEN r.relacl IS NULL THEN 'built_in_default' ELSE 'explicit' END
  FROM relations AS r
  UNION ALL
  SELECT 'column', a.attrelid, a.attnum::pg_catalog.int4,
    COALESCE(a.attacl, ARRAY[]::pg_catalog.aclitem[]),
    CASE WHEN a.attacl IS NULL THEN 'no_separate_column_acl' ELSE 'explicit' END
  FROM columns AS a
  UNION ALL
  SELECT 'routine', p.oid, 0,
    COALESCE(p.proacl, pg_catalog.acldefault('f'::pg_catalog."char", p.proowner)),
    CASE WHEN p.proacl IS NULL THEN 'built_in_default' ELSE 'explicit' END
  FROM routines AS p
  UNION ALL
  SELECT 'default_acl', d.oid, 0, d.defaclacl, 'future_objects_only'
  FROM default_acls AS d
),
acl_entries AS (
  SELECT s.kind, s.object_oid, s.sub_id, s.origin,
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM acl_sources AS s
  -- Zero-entry arrays may have zero dimensions. STRICT aclexplode(NULL) emits
  -- no rows; nonempty arrays pass through unchanged, including malformed ACLs.
  CROSS JOIN LATERAL pg_catalog.aclexplode(
    CASE WHEN pg_catalog.cardinality(s.acl) OPERATOR(pg_catalog.=) 0::pg_catalog.int4
      THEN NULL::pg_catalog.aclitem[]
      ELSE s.acl
    END
  ) AS a
),
referenced_roles(oid) AS (
  SELECT s.nspowner FROM schemas AS s WHERE s.oid IS NOT NULL
  UNION SELECT r.relowner FROM relations AS r
  UNION SELECT p.proowner FROM routines AS p
  UNION SELECT d.defaclrole FROM default_acls AS d
  UNION SELECT a.grantor FROM acl_entries AS a
  UNION SELECT a.grantee FROM acl_entries AS a
  UNION SELECT x.oid FROM policies AS p
    CROSS JOIN LATERAL pg_catalog.unnest(p.polroles) AS x(oid)
  UNION SELECT p.oid FROM principals AS p WHERE p.oid IS NOT NULL
  UNION SELECT r.oid FROM pg_catalog.pg_roles AS r
    WHERE r.rolname OPERATOR(pg_catalog.=) CURRENT_USER
),
scope_objects(class_oid, object_oid) AS (
  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::pg_catalog.oid, s.oid
    FROM schemas AS s WHERE s.oid IS NOT NULL
  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass::pg_catalog.oid, r.oid FROM relations AS r
  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass::pg_catalog.oid, i.indexrelid FROM indexes AS i
  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass::pg_catalog.oid, p.oid FROM routines AS p
  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass::pg_catalog.oid, p.oid FROM policies AS p
  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass::pg_catalog.oid, c.oid FROM constraints AS c
  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass::pg_catalog.oid, t.oid FROM triggers AS t
  UNION SELECT 'pg_catalog.pg_rewrite'::pg_catalog.regclass::pg_catalog.oid, w.oid FROM rewrite_rules AS w
  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass::pg_catalog.oid, a.default_oid
    FROM columns AS a WHERE a.default_oid IS NOT NULL
),
raw_material(kind, object_oid, sub_id, material) AS (
  SELECT 'routine'::pg_catalog.text, p.oid, 0::pg_catalog.int4,
    pg_catalog.jsonb_build_array(p.prosrc, p.probin, p.prosqlbody::pg_catalog.text,
      p.proargdefaults::pg_catalog.text, p.proconfig, p.proargnames)::pg_catalog.text
  FROM routines AS p
  UNION ALL
  SELECT 'policy', p.oid, 0,
    pg_catalog.jsonb_build_array(p.polqual::pg_catalog.text, p.polwithcheck::pg_catalog.text)::pg_catalog.text
  FROM policies AS p
  UNION ALL
  SELECT 'column_default', a.default_oid, 0,
    pg_catalog.jsonb_build_array(a.adbin::pg_catalog.text)::pg_catalog.text
  FROM columns AS a WHERE a.default_oid IS NOT NULL
  UNION ALL
  SELECT 'constraint', c.oid, 0,
    pg_catalog.jsonb_build_array(c.conbin::pg_catalog.text)::pg_catalog.text
  FROM constraints AS c
  UNION ALL
  SELECT 'trigger', t.oid, 0,
    pg_catalog.jsonb_build_array(pg_catalog.encode(t.tgargs, 'hex'::pg_catalog.text),
      t.tgqual::pg_catalog.text)::pg_catalog.text
  FROM triggers AS t
  UNION ALL
  SELECT 'index', i.indexrelid, 0,
    pg_catalog.jsonb_build_array(i.indexprs::pg_catalog.text, i.indpred::pg_catalog.text)::pg_catalog.text
  FROM indexes AS i
  UNION ALL
  SELECT 'rewrite_rule', w.oid, 0,
    pg_catalog.jsonb_build_array(w.ev_qual::pg_catalog.text, w.ev_action::pg_catalog.text)::pg_catalog.text
  FROM rewrite_rules AS w
  UNION ALL
  SELECT 'relation_options', r.oid, 0,
    pg_catalog.jsonb_build_array(r.reloptions)::pg_catalog.text
  FROM relations AS r
),
fingerprints AS (
  SELECT m.kind, m.object_oid, m.sub_id,
    CASE WHEN e.server_utf8 AND e.client_utf8 THEN
      pg_catalog.encode(pg_catalog.sha256(pg_catalog.textsend(m.material)), 'hex'::pg_catalog.text)
    ELSE NULL::pg_catalog.text END AS sha256
  FROM raw_material AS m CROSS JOIN environment AS e
),
report_rows(section_id, payload) AS (
  SELECT 1::pg_catalog.int4, pg_catalog.jsonb_build_object(
    'schema', s.label, 'exists', s.oid IS NOT NULL, 'oid', s.oid,
    'owner_role_oid', s.nspowner, 'acl_is_null', s.nspacl IS NULL)
  FROM schemas AS s
  UNION ALL
  SELECT 2, pg_catalog.jsonb_build_object('role', p.label, 'exists', p.oid IS NOT NULL,
    'oid', p.oid, 'superuser', p.rolsuper, 'inherits', p.rolinherit,
    'bypass_rls', p.rolbypassrls, 'can_login', p.rolcanlogin)
  FROM principals AS p
  UNION ALL
  SELECT 3, pg_catalog.jsonb_build_object('oid', r.oid, 'schema', r.schema_label,
    'known_name', r.known_name, 'owner_role_oid', r.relowner,
    'kind', r.relkind, 'persistence', r.relpersistence,
    'rls_enabled', r.relrowsecurity, 'rls_forced', r.relforcerowsecurity,
    'acl_is_null', r.relacl IS NULL,
    'security_invoker_true_option', 'security_invoker=true'::pg_catalog.text
      OPERATOR(pg_catalog.=) ANY (COALESCE(r.reloptions, ARRAY[]::pg_catalog.text[])),
    'security_invoker_false_option', 'security_invoker=false'::pg_catalog.text
      OPERATOR(pg_catalog.=) ANY (COALESCE(r.reloptions, ARRAY[]::pg_catalog.text[])),
    'security_barrier_true_option', 'security_barrier=true'::pg_catalog.text
      OPERATOR(pg_catalog.=) ANY (COALESCE(r.reloptions, ARRAY[]::pg_catalog.text[])))
  FROM relations AS r
  UNION ALL
  SELECT 4, pg_catalog.jsonb_build_object('relation_oid', a.attrelid,
    'attribute_number', a.attnum, 'known_name', a.known_name,
    'type_oid', a.atttypid, 'type_modifier', a.atttypmod,
    'not_null', a.attnotnull, 'identity_kind', a.attidentity,
    'generated_kind', a.attgenerated, 'dropped', a.attisdropped,
    'default_oid', a.default_oid, 'column_acl_is_null', a.attacl IS NULL)
  FROM columns AS a
  UNION ALL
  SELECT 5, pg_catalog.jsonb_build_object('oid', p.oid, 'relation_oid', p.polrelid,
    'command', p.polcmd, 'permissive', p.polpermissive, 'role_oids', p.polroles,
    'has_using', p.polqual IS NOT NULL, 'has_with_check', p.polwithcheck IS NOT NULL)
  FROM policies AS p
  UNION ALL
  SELECT 6, pg_catalog.jsonb_build_object('oid', p.oid, 'schema', p.schema_label,
    'known_name', p.known_name, 'owner_role_oid', p.proowner,
    'language_oid', p.prolang, 'known_language', p.known_language, 'kind', p.prokind,
    'security_definer', p.prosecdef, 'leakproof', p.proleakproof,
    'strict', p.proisstrict, 'returns_set', p.proretset,
    'volatility', p.provolatile, 'parallel', p.proparallel,
    'result_type_oid', p.prorettype, 'input_type_oids', p.proargtypes::pg_catalog.oid[],
    'all_argument_type_oids', p.proallargtypes, 'argument_modes', p.proargmodes,
    'variadic_type_oid', p.provariadic, 'argument_default_count', p.pronargdefaults,
    'acl_is_null', p.proacl IS NULL, 'search_path_entry_count', p.search_path_entries,
    'search_path_exactly_pg_catalog', p.search_path_entries OPERATOR(pg_catalog.=) 1::pg_catalog.int8
      AND COALESCE(p.exact_pg_catalog_search_path, false),
    'configuration_entry_count', COALESCE(pg_catalog.cardinality(p.proconfig), 0::pg_catalog.int4))
  FROM routines AS p
  UNION ALL
  SELECT 7, pg_catalog.jsonb_build_object('object_kind', a.kind, 'object_oid', a.object_oid,
    'sub_id', a.sub_id, 'origin', a.origin, 'grantor_role_oid', a.grantor,
    'grantee_role_oid', a.grantee, 'public_grantee', a.grantee OPERATOR(pg_catalog.=) 0::pg_catalog.oid,
    'privilege', a.privilege_type, 'grant_option', a.is_grantable)
  FROM acl_entries AS a
  UNION ALL
  SELECT 8, pg_catalog.jsonb_build_object('oid', d.oid, 'owner_role_oid', d.defaclrole,
    'schema_oid', d.defaclnamespace, 'schema', d.schema_label,
    'global', d.defaclnamespace OPERATOR(pg_catalog.=) 0::pg_catalog.oid,
    'future_object_kind', d.defaclobjtype)
  FROM default_acls AS d
  UNION ALL
  SELECT 9, pg_catalog.jsonb_build_object('principal', p.label, 'principal_oid', p.oid,
    'referenced_role_oid', r.oid,
    'member', pg_catalog.pg_has_role(p.oid, r.oid, 'MEMBER'::pg_catalog.text),
    'currently_inherited', pg_catalog.pg_has_role(p.oid, r.oid, 'USAGE'::pg_catalog.text))
  FROM principals AS p CROSS JOIN referenced_roles AS r
  WHERE p.oid IS NOT NULL AND r.oid IS NOT NULL
    AND r.oid OPERATOR(pg_catalog.<>) 0::pg_catalog.oid
  UNION ALL
  SELECT 10, pg_catalog.jsonb_build_object('object_kind', 'schema', 'object_oid', s.oid,
    'principal', p.label, 'principal_oid', p.oid,
    'usage', pg_catalog.has_schema_privilege(p.oid, s.oid, 'USAGE'::pg_catalog.text),
    'create', pg_catalog.has_schema_privilege(p.oid, s.oid, 'CREATE'::pg_catalog.text))
  FROM schemas AS s CROSS JOIN principals AS p WHERE s.oid IS NOT NULL AND p.oid IS NOT NULL
  UNION ALL
  SELECT 10, pg_catalog.jsonb_build_object('object_kind', 'relation', 'object_oid', r.oid,
    'principal', p.label, 'principal_oid', p.oid,
    'select', pg_catalog.has_table_privilege(p.oid, r.oid, 'SELECT'::pg_catalog.text),
    'insert', pg_catalog.has_table_privilege(p.oid, r.oid, 'INSERT'::pg_catalog.text),
    'update', pg_catalog.has_table_privilege(p.oid, r.oid, 'UPDATE'::pg_catalog.text),
    'delete', pg_catalog.has_table_privilege(p.oid, r.oid, 'DELETE'::pg_catalog.text),
    'truncate', pg_catalog.has_table_privilege(p.oid, r.oid, 'TRUNCATE'::pg_catalog.text),
    'references', pg_catalog.has_table_privilege(p.oid, r.oid, 'REFERENCES'::pg_catalog.text),
    'trigger', pg_catalog.has_table_privilege(p.oid, r.oid, 'TRIGGER'::pg_catalog.text))
  FROM relations AS r CROSS JOIN principals AS p
  WHERE p.oid IS NOT NULL AND r.relkind OPERATOR(pg_catalog.<>) 'S'::pg_catalog."char"
  UNION ALL
  SELECT 10, pg_catalog.jsonb_build_object('object_kind', 'sequence', 'object_oid', r.oid,
    'principal', p.label, 'principal_oid', p.oid,
    'usage', pg_catalog.has_sequence_privilege(p.oid, r.oid, 'USAGE'::pg_catalog.text),
    'select', pg_catalog.has_sequence_privilege(p.oid, r.oid, 'SELECT'::pg_catalog.text),
    'update', pg_catalog.has_sequence_privilege(p.oid, r.oid, 'UPDATE'::pg_catalog.text))
  FROM relations AS r CROSS JOIN principals AS p
  WHERE p.oid IS NOT NULL AND r.relkind OPERATOR(pg_catalog.=) 'S'::pg_catalog."char"
  UNION ALL
  SELECT 10, pg_catalog.jsonb_build_object('object_kind', 'column', 'object_oid', a.attrelid,
    'attribute_number', a.attnum, 'principal', p.label, 'principal_oid', p.oid,
    'select', pg_catalog.has_column_privilege(p.oid, a.attrelid, a.attnum, 'SELECT'::pg_catalog.text),
    'insert', pg_catalog.has_column_privilege(p.oid, a.attrelid, a.attnum, 'INSERT'::pg_catalog.text),
    'update', pg_catalog.has_column_privilege(p.oid, a.attrelid, a.attnum, 'UPDATE'::pg_catalog.text),
    'references', pg_catalog.has_column_privilege(p.oid, a.attrelid, a.attnum, 'REFERENCES'::pg_catalog.text))
  FROM columns AS a CROSS JOIN principals AS p
  JOIN relations AS r ON r.oid OPERATOR(pg_catalog.=) a.attrelid
  WHERE p.oid IS NOT NULL AND NOT a.attisdropped
    AND r.relkind OPERATOR(pg_catalog.<>) 'S'::pg_catalog."char"
  UNION ALL
  SELECT 10, pg_catalog.jsonb_build_object('object_kind', 'routine', 'object_oid', f.oid,
    'principal', p.label, 'principal_oid', p.oid,
    'execute', pg_catalog.has_function_privilege(p.oid, f.oid, 'EXECUTE'::pg_catalog.text))
  FROM routines AS f CROSS JOIN principals AS p WHERE p.oid IS NOT NULL
  UNION ALL
  SELECT 11, pg_catalog.jsonb_build_object('oid', c.oid, 'relation_oid', c.conrelid,
    'referenced_relation_oid', c.confrelid, 'kind', c.contype,
    'deferrable', c.condeferrable, 'initially_deferred', c.condeferred,
    'validated', c.convalidated, 'column_numbers', c.conkey,
    'referenced_column_numbers', c.confkey, 'on_update', c.confupdtype,
    'on_delete', c.confdeltype, 'match_type', c.confmatchtype, 'has_expression', c.conbin IS NOT NULL)
  FROM constraints AS c
  UNION ALL
  SELECT 12, pg_catalog.jsonb_build_object('oid', t.oid, 'relation_oid', t.tgrelid,
    'function_oid', t.tgfoid, 'type_bits', t.tgtype, 'enabled', t.tgenabled,
    'internal', t.tgisinternal, 'constraint_oid', t.tgconstraint,
    'deferrable', t.tgdeferrable, 'initially_deferred', t.tginitdeferred,
    'column_numbers', t.tgattr::pg_catalog.int2[], 'has_when', t.tgqual IS NOT NULL)
  FROM triggers AS t
  UNION ALL
  SELECT 13, pg_catalog.jsonb_build_object('index_oid', i.indexrelid, 'relation_oid', i.indrelid,
    'unique', i.indisunique, 'primary', i.indisprimary, 'exclusion', i.indisexclusion,
    'immediate', i.indimmediate, 'valid', i.indisvalid, 'ready', i.indisready,
    'column_numbers', i.indkey::pg_catalog.int2[], 'operator_class_oids', i.indclass::pg_catalog.oid[],
    'collation_oids', i.indcollation::pg_catalog.oid[], 'option_bits', i.indoption::pg_catalog.int2[],
    'has_expressions', i.indexprs IS NOT NULL, 'has_predicate', i.indpred IS NOT NULL)
  FROM indexes AS i
  UNION ALL
  SELECT 14, pg_catalog.jsonb_build_object('oid', w.oid, 'relation_oid', w.ev_class,
    'event_type', w.ev_type, 'enabled', w.ev_enabled, 'instead', w.is_instead)
  FROM rewrite_rules AS w
  UNION ALL
  SELECT 15, pg_catalog.jsonb_build_object('class_oid', d.classid, 'object_oid', d.objid,
    'sub_id', d.objsubid, 'referenced_class_oid', d.refclassid,
    'referenced_object_oid', d.refobjid, 'referenced_sub_id', d.refobjsubid, 'kind', d.deptype)
  FROM pg_catalog.pg_depend AS d
  WHERE EXISTS (SELECT 1 FROM scope_objects AS o
    WHERE (o.class_oid OPERATOR(pg_catalog.=) d.classid AND o.object_oid OPERATOR(pg_catalog.=) d.objid)
       OR (o.class_oid OPERATOR(pg_catalog.=) d.refclassid AND o.object_oid OPERATOR(pg_catalog.=) d.refobjid))
  UNION ALL
  SELECT 16, pg_catalog.jsonb_build_object('object_kind', f.kind,
    'object_oid', f.object_oid, 'sub_id', f.sub_id, 'sha256', f.sha256)
  FROM fingerprints AS f
),
section_names(id, label) AS (
  VALUES (1::pg_catalog.int4, 'schemas'::pg_catalog.text), (2, 'principals'),
    (3, 'relations'), (4, 'columns'), (5, 'policies'), (6, 'routines'),
    (7, 'acl_entries'), (8, 'default_acl_objects'), (9, 'role_inheritance'),
    (10, 'effective_privileges'), (11, 'constraints'), (12, 'triggers'),
    (13, 'indexes'), (14, 'rewrite_rules'), (15, 'dependencies'), (16, 'fingerprints')
),
section_values AS (
  SELECT r.section_id, pg_catalog.count(*) AS row_count,
    pg_catalog.jsonb_agg(r.payload ORDER BY r.payload USING OPERATOR(pg_catalog.<)) AS records
  FROM report_rows AS r GROUP BY r.section_id
)
SELECT CASE WHEN e.read_only THEN pg_catalog.jsonb_build_object(
  'audit', 'JETNITY-PUBLIC-PRIVATE-CATALOG-V1',
  'report_status', CASE WHEN e.server_utf8 AND e.client_utf8
    THEN 'metadata_only' ELSE 'partial_fingerprints_unavailable_encoding' END,
  'transaction_read_only', e.read_only,
  'statement_epoch_seconds_utc', e.statement_epoch_seconds_utc,
  'server_version_num', e.server_version_num,
  'server_encoding_is_utf8', e.server_utf8, 'client_encoding_is_utf8', e.client_utf8,
  'actual_project_identity', 'not_attested_by_sql',
  'definition_semantics', 'not_evaluated', 'database_security_verdict', 'not_assessed',
  'migration_ledger', 'out_of_scope', 'auth_user_session_rows', 'out_of_scope',
  'caller_role_oid', (SELECT r.oid FROM pg_catalog.pg_roles AS r
    WHERE r.rolname OPERATOR(pg_catalog.=) CURRENT_USER),
  'sections', (SELECT pg_catalog.jsonb_object_agg(n.label,
    pg_catalog.jsonb_build_object('row_count', COALESCE(v.row_count, 0::pg_catalog.int8),
      'records', COALESCE(v.records, '[]'::pg_catalog.jsonb)))
    FROM section_names AS n LEFT JOIN section_values AS v
      ON v.section_id OPERATOR(pg_catalog.=) n.id)
) ELSE pg_catalog.jsonb_build_object(
  'audit', 'JETNITY-PUBLIC-PRIVATE-CATALOG-V1',
  'report_status', 'refused_read_only_not_established',
  'transaction_read_only', false, 'database_security_verdict', 'not_assessed'
) END AS audit_report
FROM environment AS e;

ROLLBACK;
