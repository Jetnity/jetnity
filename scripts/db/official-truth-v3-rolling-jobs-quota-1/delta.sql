CREATE TEMP TABLE rolling_objects(classid oid,objid oid,PRIMARY KEY(classid,objid)) ON COMMIT DROP;
DO $rolling_delta$
DECLARE approved jsonb:=/* APPROVED_FUNCTIONS */; expected record; actual pg_proc%ROWTYPE;
 before_catalog jsonb; after_catalog jsonb; entry record; relation_id oid; table_name text; schema_name text; owner_name text;
 class_value oid; object_value oid; expected_columns jsonb; replacement_ids oid[]:='{}';
 result_value jsonb; current_value jsonb; jobs_snapshot jsonb; hrs_snapshot jsonb;
BEGIN
 IF COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),'[]'::jsonb)
     IS DISTINCT FROM (SELECT value FROM pg_temp.rolling_before WHERE kind='memberships')
   OR (SELECT jsonb_build_object('owner',nspowner,'acl',nspacl) FROM pg_namespace WHERE nspname='official_v3_guard_private')
     IS DISTINCT FROM (SELECT value FROM pg_temp.rolling_before WHERE kind='schema_acl') THEN
   RAISE EXCEPTION 'rolling exact authority restoration required' USING ERRCODE='P7911'; END IF;
 SELECT value INTO STRICT before_catalog FROM pg_temp.rolling_before WHERE kind='catalog';
 FOR expected IN SELECT * FROM jsonb_to_recordset(approved)
   AS f(signature text,name text,owner text,hash text,language text,definer boolean,volatile text,config jsonb) LOOP
   SELECT * INTO STRICT actual FROM pg_proc WHERE oid=to_regprocedure(expected.signature);
   IF actual.proowner<>to_regrole(expected.owner) OR actual.prokind<>'f' OR actual.proleakproof OR actual.proisstrict
     OR actual.pronargdefaults<>0 OR actual.provariadic<>0 OR actual.proparallel<>'u'
     OR actual.prosecdef<>expected.definer OR actual.provolatile::text<>expected.volatile
     OR (SELECT lanname FROM pg_language WHERE oid=actual.prolang)<>expected.language
     OR to_jsonb(actual.proconfig) IS DISTINCT FROM expected.config
     OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM expected.hash THEN
     RAISE EXCEPTION 'rolling exact function contract: %',expected.signature USING ERRCODE='P7911'; END IF;
   IF before_catalog ? ('function:'||actual.oid) THEN replacement_ids:=array_append(replacement_ids,actual.oid);
   ELSE
     IF expected.signature NOT IN ('official_v3_jobs_private.rolling_usage_v2(text)','official_v3_guard_private.ch_de_quota_v2()')
       OR actual.proretset OR actual.prorettype<>'jsonb'::regtype OR actual.proargmodes IS NOT NULL OR actual.proallargtypes IS NOT NULL
       OR (expected.signature='official_v3_jobs_private.rolling_usage_v2(text)' AND (actual.pronargs<>1 OR actual.proargnames IS DISTINCT FROM ARRAY['k']::text[]))
       OR (expected.signature='official_v3_guard_private.ch_de_quota_v2()' AND (actual.pronargs<>0 OR actual.proargnames IS NOT NULL))
       OR EXISTS(SELECT 1 FROM aclexplode(COALESCE(actual.proacl,acldefault('f',actual.proowner))) a
         WHERE a.grantee NOT IN (actual.proowner,'postgres'::regrole) OR a.grantor<>actual.proowner OR a.is_grantable OR a.privilege_type<>'EXECUTE') THEN
       RAISE EXCEPTION 'rolling new helper private contract' USING ERRCODE='P7911'; END IF;
     INSERT INTO pg_temp.rolling_objects VALUES('pg_proc'::regclass,actual.oid);
   END IF;
 END LOOP;
 IF cardinality(replacement_ids)<>8 THEN RAISE EXCEPTION 'rolling exact replacement inventory' USING ERRCODE='P7911'; END IF;
 FOR expected IN SELECT pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c
   WHERE c.conrelid='pg_temp.rolling_v2_check_model'::regclass AND c.contype='c' LOOP
   SELECT c.oid,c.conname INTO STRICT entry FROM pg_constraint c WHERE c.conrelid='official_v3_jobs_private.subjects_v1'::regclass
     AND c.contype='c' AND c.convalidated AND NOT c.condeferrable AND NOT c.condeferred AND c.conislocal AND c.coninhcount=0
     AND pg_get_constraintdef(c.oid)=expected.definition AND c.conname IN (SELECT name FROM pg_temp.rolling_old_checks);
   IF EXISTS(SELECT 1 FROM pg_temp.rolling_old_checks WHERE id=entry.oid) THEN RAISE EXCEPTION 'rolling new check OID required' USING ERRCODE='P7911'; END IF;
   INSERT INTO pg_temp.rolling_objects VALUES('pg_constraint'::regclass,entry.oid);
 END LOOP;
 IF (SELECT count(*) FROM pg_temp.rolling_objects WHERE classid='pg_constraint'::regclass)<>3 THEN
   RAISE EXCEPTION 'rolling exactly three check successors required' USING ERRCODE='P7911'; END IF;
 FOREACH table_name IN ARRAY ARRAY['rolling_policy_v2','rolling_quota_baseline_v1'] LOOP
   schema_name:=CASE table_name WHEN 'rolling_policy_v2' THEN 'official_v3_jobs_private' ELSE 'official_v3_guard_private' END;
   owner_name:=CASE table_name WHEN 'rolling_policy_v2' THEN 'ot_v3_jobs_owner' ELSE 'postgres' END;
   relation_id:=to_regclass(schema_name||'.'||table_name);
   expected_columns:=CASE table_name WHEN 'rolling_policy_v2' THEN
    '[["job_key","text",true,false],["method_binding","jsonb",true,false],["window_seconds","integer",true,false],["start_limit","integer",true,false],["operation_limit","integer",true,false],["anchor_starts","integer",true,false],["anchor_operations","integer",true,false],["installed_at","timestamp with time zone",true,false]]'::jsonb
    ELSE '[["singleton","boolean",true,false],["predecessor_provider_digest","text",true,false],["predecessor_catalog_digest","text",true,false],["predecessor_gap_digest","text",true,false],["required_generation","bigint",true,false],["proof_not_before","timestamp with time zone",true,false],["policy","jsonb",true,false],["jobs_catalog","jsonb",true,false],["hrs_catalog","jsonb",true,false],["catalog","jsonb",true,false]]'::jsonb END;
   IF relation_id IS NULL OR NOT EXISTS(SELECT 1 FROM pg_class c WHERE c.oid=relation_id AND c.relkind='r'
     AND c.relowner=to_regrole(owner_name) AND c.relrowsecurity AND c.relforcerowsecurity)
     OR EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a
       WHERE c.oid=relation_id AND (a.grantor<>c.relowner OR a.is_grantable
         OR (a.grantee<>c.relowner AND NOT(table_name='rolling_policy_v2' AND a.grantee='postgres'::regrole AND a.privilege_type='SELECT'))))
     OR (SELECT jsonb_agg(jsonb_build_array(a.attname,a.atttypid::regtype::text,a.attnotnull,a.attisdropped) ORDER BY a.attnum)
       FROM pg_attribute a WHERE a.attrelid=relation_id AND a.attnum>0) IS DISTINCT FROM expected_columns
     OR (SELECT count(*) FROM pg_policy p WHERE p.polrelid=relation_id)<>(CASE table_name WHEN 'rolling_policy_v2' THEN 2 ELSE 1 END)
     OR EXISTS(SELECT 1 FROM pg_policy p WHERE p.polrelid=relation_id AND NOT(
       p.polpermissive AND pg_get_expr(p.polqual,p.polrelid)='true' AND (
       p.polroles=ARRAY[to_regrole(owner_name)::oid] AND p.polcmd='*' AND pg_get_expr(p.polwithcheck,p.polrelid)='true'
         AND p.polname=CASE table_name WHEN 'rolling_policy_v2' THEN 'owner_v2' ELSE 'owner_only' END
       OR table_name='rolling_policy_v2' AND p.polname='readback_v2' AND p.polroles=ARRAY['postgres'::regrole::oid] AND p.polcmd='r' AND p.polwithcheck IS NULL)))
     OR (SELECT count(*) FROM pg_trigger t WHERE t.tgrelid=relation_id AND NOT t.tgisinternal)<>2
     OR EXISTS(SELECT 1 FROM pg_trigger t WHERE t.tgrelid=relation_id AND NOT t.tgisinternal
       AND (t.tgfoid<>to_regprocedure(schema_name||'.immutable_v1()') OR t.tgenabled<>'O' OR t.tgnargs<>0 OR t.tgqual IS NOT NULL
         OR NOT (t.tgname=CASE table_name WHEN 'rolling_policy_v2' THEN 'guard_row_v2' ELSE 'immutable_v1' END AND t.tgtype=27
           OR t.tgname=CASE table_name WHEN 'rolling_policy_v2' THEN 'guard_truncate_v2' ELSE 'immutable_truncate_v1' END AND t.tgtype=34)))
     OR (SELECT count(*) FROM pg_constraint c WHERE c.conrelid=relation_id AND c.contype='p')<>1
     OR EXISTS(SELECT 1 FROM pg_constraint c WHERE c.conrelid=relation_id AND (c.contype NOT IN ('p','c') OR NOT c.convalidated OR c.condeferrable OR c.condeferred))
     OR (SELECT count(*) FROM pg_constraint c WHERE c.conrelid=relation_id AND c.contype='c')<>(CASE table_name WHEN 'rolling_policy_v2' THEN 7 ELSE 6 END) THEN
     RAISE EXCEPTION 'rolling exact private table contract' USING ERRCODE='P7911'; END IF;
   INSERT INTO pg_temp.rolling_objects
     SELECT 'pg_class'::regclass,relation_id
     UNION SELECT 'pg_class'::regclass,c.reltoastrelid FROM pg_class c WHERE c.oid=relation_id AND c.reltoastrelid<>0
     UNION SELECT 'pg_class'::regclass,i.indexrelid FROM pg_index i WHERE i.indrelid=relation_id
       OR i.indrelid=(SELECT reltoastrelid FROM pg_class WHERE oid=relation_id)
     UNION SELECT 'pg_type'::regclass,t.oid FROM pg_type t WHERE t.typrelid=relation_id
       OR t.typelem IN (SELECT oid FROM pg_type WHERE typrelid=relation_id)
     UNION SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid=relation_id
     UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid=relation_id
     UNION SELECT 'pg_policy'::regclass,p.oid FROM pg_policy p WHERE p.polrelid=relation_id
     UNION SELECT 'pg_attrdef'::regclass,a.oid FROM pg_attrdef a WHERE a.adrelid=relation_id;
 END LOOP;
 FOR expected IN SELECT * FROM (VALUES
   ('queue_operations_subject_time_v2','queue_operations_v1','2 10 1'),
   ('execution_starts_subject_time_v2','execution_starts_v1','2 8 1')
 ) i(name,relation,keys) LOOP
   relation_id:=to_regclass('official_v3_jobs_private.'||expected.name);
   IF NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
       WHERE i.indexrelid=relation_id AND i.indrelid=to_regclass('official_v3_jobs_private.'||expected.relation)
         AND c.relowner='ot_v3_jobs_owner'::regrole AND c.relam=(SELECT oid FROM pg_am WHERE amname='btree')
         AND i.indkey::text=expected.keys AND i.indnatts=3 AND i.indnkeyatts=3
         AND NOT i.indisunique AND NOT i.indisprimary AND NOT i.indisexclusion AND NOT i.indisclustered AND NOT i.indisreplident
         AND i.indisvalid AND i.indisready AND i.indislive AND i.indexprs IS NULL AND i.indpred IS NULL) THEN
     RAISE EXCEPTION 'rolling exact time index required' USING ERRCODE='P7911'; END IF;
   INSERT INTO pg_temp.rolling_objects VALUES('pg_class'::regclass,relation_id);
 END LOOP;
 IF (SELECT count(*) FROM official_v3_jobs_private.rolling_policy_v2)<>1 THEN
   RAISE EXCEPTION 'rolling one immutable policy required' USING ERRCODE='P7911'; END IF;
 after_catalog:=official_v3_guard_private.catalog_status_v1();
 FOR entry IN SELECT key,value FROM jsonb_each(before_catalog) LOOP
   IF after_catalog->entry.key IS NOT DISTINCT FROM entry.value THEN CONTINUE; END IF;
   IF entry.key LIKE 'function:%' AND split_part(entry.key,':',2)::oid=ANY(replacement_ids)
     AND (after_catalog->entry.key)-'definition' IS NOT DISTINCT FROM entry.value-'definition' THEN CONTINUE; END IF;
   IF NOT after_catalog ? entry.key AND (
     entry.key LIKE 'constraint:%' AND EXISTS(SELECT 1 FROM pg_temp.rolling_old_checks WHERE id=split_part(entry.key,':',2)::oid)
     OR entry.key LIKE 'dependency:%' AND (entry.value->>'classid')::oid='pg_constraint'::regclass
       AND EXISTS(SELECT 1 FROM pg_temp.rolling_old_checks WHERE id=(entry.value->>'objid')::oid)) THEN CONTINUE; END IF;
   RAISE EXCEPTION 'rolling predecessor graph changed: %',entry.key USING ERRCODE='P7911';
 END LOOP;
 FOR entry IN SELECT key,value FROM jsonb_each(after_catalog) WHERE NOT before_catalog ? key LOOP
   class_value:=CASE split_part(entry.key,':',1)
     WHEN 'function' THEN 'pg_proc'::regclass WHEN 'relation' THEN 'pg_class'::regclass
     WHEN 'attribute' THEN 'pg_class'::regclass WHEN 'index' THEN 'pg_class'::regclass
     WHEN 'type' THEN 'pg_type'::regclass WHEN 'constraint' THEN 'pg_constraint'::regclass
     WHEN 'trigger' THEN 'pg_trigger'::regclass WHEN 'policy' THEN 'pg_policy'::regclass WHEN 'default' THEN 'pg_attrdef'::regclass
     WHEN 'dependency' THEN (entry.value->>'classid')::oid WHEN 'shared' THEN (entry.value->>'classid')::oid END;
   object_value:=CASE WHEN split_part(entry.key,':',1) IN ('dependency','shared') THEN (entry.value->>'objid')::oid ELSE split_part(entry.key,':',2)::oid END;
   IF class_value IS NULL OR NOT EXISTS(SELECT 1 FROM pg_temp.rolling_objects o WHERE o.classid=class_value AND o.objid=object_value) THEN
     RAISE EXCEPTION 'rolling unreviewed additive edge: %',entry.key USING ERRCODE='P7911'; END IF;
 END LOOP;
 /* CAPTURE_JOBS */
 jobs_snapshot:=result_value;
 SELECT (/* CAPTURE_HRS */) INTO hrs_snapshot;
 INSERT INTO official_v3_guard_private.rolling_quota_baseline_v1
 SELECT true,'GAP_PROVIDER_SHA256',encode(sha256(convert_to(before_catalog::text,'UTF8')),'hex'),
   encode(sha256(convert_to((to_jsonb(prior)||jsonb_build_object('proof_not_before',extract(epoch FROM prior.proof_not_before)))::text,'UTF8')),'hex'),
   s.generation+1,clock_timestamp(),(SELECT to_jsonb(p)||jsonb_build_object('installed_at',extract(epoch FROM p.installed_at)) FROM official_v3_jobs_private.rolling_policy_v2 p),
   jobs_snapshot,hrs_snapshot,after_catalog FROM official_v3_guard_private.state_v1 s
   CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 prior WHERE s.singleton AND prior.singleton;
END $rolling_delta$;
