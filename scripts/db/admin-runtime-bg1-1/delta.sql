DO $admin_runtime_delta$
DECLARE additions jsonb:=/* APPROVED_FUNCTIONS */; replacements jsonb:=/* APPROVED_REPLACEMENTS */;
  tables jsonb:=/* APPROVED_TABLES */; expected record; actual pg_proc%ROWTYPE; actual_acl jsonb;
  before_catalog jsonb; after_catalog jsonb; item record; relation_id oid; namespace_id oid;
  object_class oid; object_id oid; replacement_ids oid[]:=ARRAY[]::oid[]; expected_columns jsonb;
  actual_columns jsonb; trigger_spec record; trigger_count integer; old_table text; old_value jsonb;
BEGIN
  IF (SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r)
      IS DISTINCT FROM (SELECT value FROM pg_temp.admin_runtime_before WHERE kind='roles')
    OR COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),'[]'::jsonb)
      IS DISTINCT FROM (SELECT value FROM pg_temp.admin_runtime_before WHERE kind='memberships') THEN
    RAISE EXCEPTION 'admin runtime existing roles or memberships changed' USING ERRCODE='P7931';
  END IF;
  SELECT value INTO STRICT before_catalog FROM pg_temp.admin_runtime_before WHERE kind='catalog';
  -- Signatures, bodies, all execution attributes and exact effective grants.
  FOR expected IN SELECT * FROM jsonb_to_recordset(additions||replacements)
    AS f(signature text,name text,hash text,language text,definer boolean,volatile text,parallel text,
      config jsonb,grantees jsonb,"argumentNames" jsonb,"argumentTypes" jsonb,defaults integer,"returnType" text,
      "set" boolean,"outputTypes" jsonb) LOOP
    SELECT * INTO STRICT actual FROM pg_proc WHERE oid=to_regprocedure(expected.signature);
    SELECT jsonb_agg(role_name ORDER BY role_name COLLATE "C") INTO actual_acl FROM (
      SELECT CASE a.grantee WHEN 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END AS role_name
      FROM aclexplode(COALESCE(actual.proacl,acldefault('f',actual.proowner))) a
      WHERE a.privilege_type='EXECUTE' AND NOT a.is_grantable AND a.grantor='postgres'::regrole
    ) permissions;
    IF actual.proowner<>'postgres'::regrole OR actual.prokind<>'f' OR actual.proisstrict OR actual.proleakproof
      OR actual.prosecdef<>expected.definer OR actual.provolatile::text<>expected.volatile
      OR actual.proparallel::text<>expected.parallel OR actual.provariadic<>0 OR actual.prosupport<>0
      OR actual.probin IS NOT NULL OR actual.prosqlbody IS NOT NULL
      OR actual.pronargs<>jsonb_array_length(expected."argumentTypes") OR actual.pronargdefaults<>expected.defaults
      OR actual.prorettype<>expected."returnType"::regtype OR actual.proretset<>expected."set"
      OR (SELECT lanname FROM pg_language WHERE oid=actual.prolang)<>expected.language
      OR COALESCE(to_jsonb(actual.proargnames),'[]'::jsonb) IS DISTINCT FROM expected."argumentNames"
      OR ARRAY(SELECT unnest(actual.proargtypes::oid[])) IS DISTINCT FROM
        ARRAY(SELECT value::regtype::oid FROM jsonb_array_elements_text(expected."argumentTypes"))
      OR (expected."set" AND (
        actual.proargmodes IS DISTINCT FROM array_fill('t'::"char",ARRAY[jsonb_array_length(expected."outputTypes")])
        OR actual.proallargtypes IS DISTINCT FROM ARRAY(SELECT value::regtype::oid FROM jsonb_array_elements_text(expected."outputTypes"))))
      OR (NOT expected."set" AND (actual.proallargtypes IS NOT NULL OR actual.proargmodes IS NOT NULL))
      OR to_jsonb(actual.proconfig) IS DISTINCT FROM expected.config
      OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM expected.hash
      OR actual_acl IS DISTINCT FROM expected.grantees
      OR EXISTS(SELECT 1 FROM aclexplode(COALESCE(actual.proacl,acldefault('f',actual.proowner))) a
        WHERE a.privilege_type<>'EXECUTE' OR a.is_grantable OR a.grantor<>'postgres'::regrole) THEN
      RAISE EXCEPTION 'admin runtime function contract changed: %',expected.signature USING ERRCODE='P7931';
    END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(replacements) r WHERE r->>'signature'=expected.signature) THEN
      IF NOT before_catalog ? ('function:'||actual.oid) THEN
        RAISE EXCEPTION 'admin runtime original function identity missing' USING ERRCODE='P7931';
      END IF;
      replacement_ids:=array_append(replacement_ids,actual.oid);
    ELSE
      IF before_catalog ? ('function:'||actual.oid) THEN
        RAISE EXCEPTION 'admin runtime new function replaced an original' USING ERRCODE='P7931';
      END IF;
      INSERT INTO pg_temp.admin_runtime_objects VALUES('pg_proc'::regclass,actual.oid);
    END IF;
  END LOOP;
  IF cardinality(replacement_ids)<>4 THEN
    RAISE EXCEPTION 'admin runtime exact four guard replacements required' USING ERRCODE='P7931';
  END IF;

  FOREACH old_table IN ARRAY ARRAY['jetnity_reporting','jetnity_cms_private','jetnity_marketing_private'] LOOP
    namespace_id:=to_regnamespace(old_table);
    IF namespace_id IS NULL OR NOT EXISTS(SELECT 1 FROM pg_namespace n WHERE n.oid=namespace_id AND n.nspowner='postgres'::regrole)
      OR EXISTS(SELECT 1 FROM pg_namespace n CROSS JOIN LATERAL aclexplode(COALESCE(n.nspacl,acldefault('n',n.nspowner))) a
        WHERE n.oid=namespace_id AND (a.grantor<>'postgres'::regrole OR a.is_grantable
          OR NOT(a.grantee='postgres'::regrole OR old_table='jetnity_reporting' AND a.grantee='authenticated'::regrole AND a.privilege_type='USAGE')))
      OR (old_table='jetnity_reporting' AND NOT has_schema_privilege('authenticated',namespace_id,'USAGE'))
      OR EXISTS(SELECT 1 FROM pg_proc p WHERE p.pronamespace=namespace_id
        AND NOT EXISTS(SELECT 1 FROM pg_temp.admin_runtime_objects o WHERE o.classid='pg_proc'::regclass AND o.objid=p.oid))
      OR EXISTS(SELECT 1 FROM pg_class c WHERE c.relnamespace=namespace_id AND c.relkind NOT IN ('r','i'))
      OR EXISTS(SELECT 1 FROM pg_class c WHERE c.relnamespace=namespace_id AND c.relkind='r'
        AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(tables) t WHERE t->>'name'=old_table||'.'||c.relname)) THEN
      RAISE EXCEPTION 'admin runtime new namespace inventory or authority changed' USING ERRCODE='P7931';
    END IF;
    INSERT INTO pg_temp.admin_runtime_objects VALUES('pg_namespace'::regclass,namespace_id);
  END LOOP;
  FOR expected IN SELECT * FROM jsonb_to_recordset(tables)
    AS t(name text,columns jsonb,triggers jsonb,constraints integer,baseline boolean) LOOP
    relation_id:=to_regclass(expected.name);
    IF relation_id IS NULL OR NOT EXISTS(SELECT 1 FROM pg_class c WHERE c.oid=relation_id
        AND c.relkind='r' AND c.relowner='postgres'::regrole AND c.relrowsecurity AND c.relforcerowsecurity)
      OR EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a
        WHERE c.oid=relation_id AND (a.grantor<>'postgres'::regrole OR a.grantee<>'postgres'::regrole OR a.is_grantable))
      OR EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid=relation_id AND a.attnum>0
        AND (a.attacl IS NOT NULL OR a.attisdropped OR a.attidentity<>''))
      OR (SELECT count(*) FROM pg_policy p WHERE p.polrelid=relation_id)<>(CASE WHEN expected.baseline THEN 1 ELSE 0 END)
      OR (expected.baseline AND NOT EXISTS(SELECT 1 FROM pg_policy p WHERE p.polrelid=relation_id
        AND p.polname='owner_only' AND p.polroles=ARRAY['postgres'::regrole::oid] AND p.polpermissive AND p.polcmd='*'
        AND pg_get_expr(p.polqual,p.polrelid)='true' AND pg_get_expr(p.polwithcheck,p.polrelid)='true'))
      OR (SELECT count(*) FROM pg_constraint c WHERE c.conrelid=relation_id)<>expected.constraints
      OR EXISTS(SELECT 1 FROM pg_constraint c WHERE c.conrelid=relation_id AND (NOT c.convalidated
        OR (c.contype NOT IN ('p','u','f','c') AND NOT (c.contype='t' AND EXISTS(
          SELECT 1 FROM pg_trigger t CROSS JOIN LATERAL jsonb_array_elements(expected.triggers) declared
          WHERE t.tgconstraint=c.oid AND t.tgrelid=relation_id AND t.tgname=declared->>'name'
            AND declared->>'deferred'='true' AND c.conname=t.tgname AND c.condeferrable AND c.condeferred))))) THEN
      RAISE EXCEPTION 'admin runtime new table authority or constraint inventory changed: %',expected.name USING ERRCODE='P7931';
    END IF;
    SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',a.atttypid,'notNull',a.attnotnull,
      'generated',a.attgenerated='s','hasDefault',a.atthasdef) ORDER BY a.attnum) INTO actual_columns
      FROM pg_attribute a WHERE a.attrelid=relation_id AND a.attnum>0;
    SELECT jsonb_agg(c||jsonb_build_object('type',(c->>'type')::regtype::oid) ORDER BY ordinal)
      INTO expected_columns FROM jsonb_array_elements(expected.columns) WITH ORDINALITY columns(c,ordinal);
    IF actual_columns IS DISTINCT FROM expected_columns THEN
      RAISE EXCEPTION 'admin runtime new table columns changed: %',expected.name USING ERRCODE='P7931';
    END IF;
    SELECT count(*) INTO trigger_count FROM pg_trigger t WHERE t.tgrelid=relation_id AND NOT t.tgisinternal;
    IF trigger_count<>jsonb_array_length(expected.triggers) THEN
      RAISE EXCEPTION 'admin runtime new trigger inventory changed' USING ERRCODE='P7931';
    END IF;
    FOR trigger_spec IN SELECT * FROM jsonb_to_recordset(expected.triggers)
      AS t(name text,"function" text,type integer,deferred boolean) LOOP
      IF NOT EXISTS(SELECT 1 FROM pg_trigger t WHERE t.tgrelid=relation_id AND t.tgname=trigger_spec.name
        AND t.tgfoid=to_regprocedure(trigger_spec."function") AND t.tgtype=trigger_spec.type
        AND t.tgenabled='O' AND NOT t.tgisinternal AND t.tgnargs=0 AND t.tgqual IS NULL AND t.tgattr::text=''
        AND octet_length(t.tgargs)=0 AND t.tgparentid=0 AND t.tgoldtable IS NULL AND t.tgnewtable IS NULL
        AND t.tgdeferrable=trigger_spec.deferred AND t.tginitdeferred=trigger_spec.deferred
        AND ((NOT trigger_spec.deferred AND t.tgconstraint=0) OR (trigger_spec.deferred AND EXISTS(
          SELECT 1 FROM pg_constraint c WHERE c.oid=t.tgconstraint AND c.contype='t'
            AND c.conrelid=relation_id AND c.conname=trigger_spec.name AND c.convalidated
            AND c.condeferrable AND c.condeferred)))) THEN
        RAISE EXCEPTION 'admin runtime new trigger binding changed' USING ERRCODE='P7931';
      END IF;
    END LOOP;
    -- Complete physical and dependency closure of exactly these seven tables.
    INSERT INTO pg_temp.admin_runtime_objects
      SELECT 'pg_class'::regclass,relation_id
      UNION SELECT 'pg_class'::regclass,c.reltoastrelid FROM pg_class c WHERE c.oid=relation_id AND c.reltoastrelid<>0
      UNION SELECT 'pg_class'::regclass,i.indexrelid FROM pg_index i WHERE i.indrelid=relation_id
        OR i.indrelid=(SELECT reltoastrelid FROM pg_class WHERE oid=relation_id)
      UNION SELECT 'pg_type'::regclass,t.oid FROM pg_type t WHERE t.typrelid=relation_id
        OR t.typelem IN (SELECT oid FROM pg_type WHERE typrelid=relation_id)
      UNION SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid=relation_id
      UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid=relation_id
      UNION SELECT 'pg_policy'::regclass,p.oid FROM pg_policy p WHERE p.polrelid=relation_id
      UNION SELECT 'pg_attrdef'::regclass,d.oid FROM pg_attrdef d WHERE d.adrelid=relation_id;
  END LOOP;
  -- Scoped default privileges may only describe the newly owned schemas.
  IF EXISTS(SELECT 1 FROM pg_default_acl d CROSS JOIN LATERAL aclexplode(d.defaclacl) a
      WHERE d.defaclnamespace IN (SELECT oid FROM pg_namespace WHERE nspname IN ('jetnity_reporting','jetnity_cms_private','jetnity_marketing_private'))
        AND (d.defaclrole<>'postgres'::regrole OR a.grantor<>'postgres'::regrole OR a.grantee<>'postgres'::regrole OR a.is_grantable)) THEN
    RAISE EXCEPTION 'admin runtime new default authority changed' USING ERRCODE='P7931';
  END IF;
  INSERT INTO pg_temp.admin_runtime_objects SELECT 'pg_default_acl'::regclass,d.oid FROM pg_default_acl d
    WHERE d.defaclnamespace IN (SELECT oid FROM pg_namespace WHERE nspname IN ('jetnity_reporting','jetnity_cms_private','jetnity_marketing_private'));
  IF EXISTS(SELECT 1 FROM pg_class c WHERE c.relnamespace IN (SELECT oid FROM pg_namespace
      WHERE nspname IN ('jetnity_reporting','jetnity_cms_private','jetnity_marketing_private'))
    AND NOT EXISTS(SELECT 1 FROM pg_temp.admin_runtime_objects o WHERE o.classid='pg_class'::regclass AND o.objid=c.oid))
    OR EXISTS(SELECT 1 FROM pg_type t WHERE t.typnamespace IN (SELECT oid FROM pg_namespace
      WHERE nspname IN ('jetnity_reporting','jetnity_cms_private','jetnity_marketing_private'))
    AND NOT EXISTS(SELECT 1 FROM pg_temp.admin_runtime_objects o WHERE o.classid='pg_type'::regclass AND o.objid=t.oid)) THEN
    RAISE EXCEPTION 'admin runtime additional object outside approved closure' USING ERRCODE='P7931';
  END IF;

  after_catalog:=official_v3_guard_private.catalog_status_v1();
  FOR item IN SELECT key,value FROM jsonb_each(before_catalog) LOOP
    IF after_catalog->item.key IS NOT DISTINCT FROM item.value THEN CONTINUE; END IF;
    IF item.key LIKE 'function:%' AND split_part(item.key,':',2)::oid=ANY(replacement_ids)
      AND (after_catalog->item.key)-'definition' IS NOT DISTINCT FROM item.value-'definition' THEN CONTINUE; END IF;
    RAISE EXCEPTION 'admin runtime predecessor graph changed: %',item.key USING ERRCODE='P7931';
  END LOOP;
  FOR item IN SELECT key,value FROM jsonb_each(after_catalog) WHERE NOT before_catalog ? key LOOP
    object_class:=CASE split_part(item.key,':',1)
      WHEN 'namespace' THEN 'pg_namespace'::regclass WHEN 'function' THEN 'pg_proc'::regclass
      WHEN 'relation' THEN 'pg_class'::regclass WHEN 'attribute' THEN 'pg_class'::regclass WHEN 'index' THEN 'pg_class'::regclass
      WHEN 'type' THEN 'pg_type'::regclass WHEN 'constraint' THEN 'pg_constraint'::regclass
      WHEN 'trigger' THEN 'pg_trigger'::regclass WHEN 'policy' THEN 'pg_policy'::regclass WHEN 'default' THEN 'pg_attrdef'::regclass
      WHEN 'default_acl' THEN 'pg_default_acl'::regclass
      WHEN 'dependency' THEN (item.value->>'classid')::oid WHEN 'shared' THEN (item.value->>'classid')::oid
      WHEN 'description' THEN (item.value->>'classoid')::oid WHEN 'label' THEN (item.value->>'classoid')::oid END;
    object_id:=CASE WHEN split_part(item.key,':',1) IN ('dependency','shared') THEN (item.value->>'objid')::oid
      WHEN split_part(item.key,':',1) IN ('description','label') THEN (item.value->>'objoid')::oid
      ELSE split_part(item.key,':',2)::oid END;
    IF object_class IS NULL OR NOT EXISTS(SELECT 1 FROM pg_temp.admin_runtime_objects o WHERE o.classid=object_class AND o.objid=object_id) THEN
      RAISE EXCEPTION 'admin runtime unreviewed additive graph edge: %',item.key USING ERRCODE='P7931';
    END IF;
  END LOOP;
  -- Preserve foreign/shared dependencies too, including the ones outside the
  -- predecessor's named role set. Only enumerated newly created objects may add.
  IF EXISTS(SELECT value FROM jsonb_array_elements((SELECT value FROM pg_temp.admin_runtime_before WHERE kind='global_shared'))
      EXCEPT SELECT to_jsonb(d) FROM pg_shdepend d)
    OR EXISTS(SELECT 1 FROM pg_shdepend d
      WHERE NOT (SELECT value FROM pg_temp.admin_runtime_before WHERE kind='global_shared') @> jsonb_build_array(to_jsonb(d))
        AND NOT EXISTS(SELECT 1 FROM pg_temp.admin_runtime_objects o WHERE o.classid=d.classid AND o.objid=d.objid)) THEN
    RAISE EXCEPTION 'admin runtime foreign shared dependency changed' USING ERRCODE='P7931';
  END IF;
  FOR item IN SELECT kind,value FROM pg_temp.admin_runtime_before WHERE kind LIKE 'table:%' LOOP
    old_table:=substring(item.kind FROM 7);
    EXECUTE format('SELECT jsonb_build_object(''count'',count(*),''digest'',encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(t)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(t)::text COLLATE "C"),''''),''UTF8'')),''hex'')) FROM %s t',old_table::regclass) INTO old_value;
    IF old_value IS DISTINCT FROM item.value THEN
      RAISE EXCEPTION 'admin runtime historical evidence changed' USING ERRCODE='P7931';
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM jetnity_cms_private.inspiration_entries_v1)<>4
    OR EXISTS(SELECT 1 FROM jetnity_cms_private.inspiration_entries_v1 WHERE state_version<>0 OR draft_revision IS NOT NULL
      OR published_revision IS NOT NULL OR last_request_id IS NOT NULL OR archived)
    OR EXISTS(SELECT 1 FROM jetnity_cms_private.inspiration_revisions_v1)
    OR EXISTS(SELECT 1 FROM jetnity_cms_private.inspiration_operations_v1)
    OR EXISTS(SELECT 1 FROM jetnity_marketing_private.drafts_v1)
    OR EXISTS(SELECT 1 FROM jetnity_marketing_private.revisions_v1)
    OR EXISTS(SELECT 1 FROM jetnity_marketing_private.operations_v1) THEN
    RAISE EXCEPTION 'admin runtime empty store initialization required' USING ERRCODE='P7931';
  END IF;
  INSERT INTO official_v3_guard_private.admin_runtime_baseline_v1
    SELECT true,'PREDECESSOR_SHA256',encode(sha256(convert_to(prior.catalog::text,'UTF8')),'hex'),
      encode(sha256(convert_to((to_jsonb(prior)||jsonb_build_object('proof_not_before',extract(epoch FROM prior.proof_not_before)))::text,'UTF8')),'hex'),
      'DEFINITION_SHA256',s.generation+1,clock_timestamp(),after_catalog
    FROM official_v3_guard_private.state_v1 s CROSS JOIN official_v3_guard_private.cycle4_attempt2_baseline_v1 prior
    WHERE s.singleton AND prior.singleton;
END $admin_runtime_delta$;
