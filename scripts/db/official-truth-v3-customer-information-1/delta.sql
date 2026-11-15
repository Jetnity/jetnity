CREATE TEMP TABLE customer_objects(classid oid,objid oid,PRIMARY KEY(classid,objid)) ON COMMIT DROP;
DO $customer_delta$
DECLARE approved jsonb:=/* APPROVED_FUNCTIONS */; expected record; actual pg_proc%ROWTYPE;
 before_catalog jsonb; after_catalog jsonb; entry record; relation_id oid;
 class_value oid; object_value oid; replacement_ids oid[]:='{}';
 result_value jsonb; current_value jsonb; jobs_snapshot jsonb; hrs_snapshot jsonb;
BEGIN
 IF COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r),'[]'::jsonb)
     IS DISTINCT FROM (SELECT value FROM pg_temp.customer_before WHERE kind='roles')
   OR COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),'[]'::jsonb)
     IS DISTINCT FROM (SELECT value FROM pg_temp.customer_before WHERE kind='memberships')
   OR (SELECT jsonb_build_object('owner',nspowner,'acl',nspacl) FROM pg_namespace WHERE nspname='official_v3_guard_private')
     IS DISTINCT FROM (SELECT value FROM pg_temp.customer_before WHERE kind='schema_acl') THEN
   RAISE EXCEPTION 'customer exact authority restoration required' USING ERRCODE='P7921';
 END IF;
 SELECT value INTO STRICT before_catalog FROM pg_temp.customer_before WHERE kind='catalog';
 FOR expected IN SELECT * FROM jsonb_to_recordset(approved)
   AS f(signature text,name text,owner text,hash text,language text,definer boolean,volatile text,config jsonb) LOOP
   SELECT * INTO STRICT actual FROM pg_proc WHERE oid=to_regprocedure(expected.signature);
   IF actual.proowner<>to_regrole(expected.owner) OR actual.prokind<>'f' OR actual.proleakproof OR actual.proisstrict
     OR actual.pronargdefaults<>0 OR actual.provariadic<>0 OR actual.proparallel<>'u'
     OR actual.prosecdef<>expected.definer OR actual.provolatile::text<>expected.volatile
     OR (SELECT lanname FROM pg_language WHERE oid=actual.prolang)<>expected.language
     OR to_jsonb(actual.proconfig) IS DISTINCT FROM expected.config
     OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM expected.hash
     OR NOT before_catalog ? ('function:'||actual.oid) THEN
     RAISE EXCEPTION 'customer exact existing function contract: %',expected.signature USING ERRCODE='P7921';
   END IF;
   replacement_ids:=array_append(replacement_ids,actual.oid);
 END LOOP;
 IF cardinality(replacement_ids)<>12 THEN
   RAISE EXCEPTION 'customer exactly twelve existing definitions required' USING ERRCODE='P7921';
 END IF;
 relation_id:='official_v3_guard_private.customer_information_baseline_v1'::regclass;
 IF NOT EXISTS(SELECT 1 FROM pg_class c WHERE c.oid=relation_id AND c.relkind='r'
     AND c.relowner='postgres'::regrole AND c.relrowsecurity AND c.relforcerowsecurity)
   OR EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a
     WHERE c.oid=relation_id AND (a.grantor<>c.relowner OR a.grantee<>c.relowner OR a.is_grantable))
   OR (SELECT jsonb_agg(jsonb_build_array(a.attname,a.atttypid::regtype::text,a.attnotnull,a.attisdropped) ORDER BY a.attnum)
     FROM pg_attribute a WHERE a.attrelid=relation_id AND a.attnum>0) IS DISTINCT FROM
     '[["singleton","boolean",true,false],["predecessor_provider_digest","text",true,false],["predecessor_catalog_digest","text",true,false],["predecessor_rolling_digest","text",true,false],["definitions_digest","text",true,false],["history_definition_digest","text",true,false],["required_generation","bigint",true,false],["proof_not_before","timestamp with time zone",true,false],["jobs_catalog","jsonb",true,false],["hrs_catalog","jsonb",true,false],["catalog","jsonb",true,false]]'::jsonb
   OR (SELECT count(*) FROM pg_policy p WHERE p.polrelid=relation_id)<>1
   OR EXISTS(SELECT 1 FROM pg_policy p WHERE p.polrelid=relation_id AND NOT(
     p.polpermissive AND pg_get_expr(p.polqual,p.polrelid)='true' AND p.polroles=ARRAY['postgres'::regrole::oid]
     AND p.polcmd='*' AND pg_get_expr(p.polwithcheck,p.polrelid)='true' AND p.polname='owner_only'))
   OR (SELECT count(*) FROM pg_trigger t WHERE t.tgrelid=relation_id AND NOT t.tgisinternal)<>2
   OR EXISTS(SELECT 1 FROM pg_trigger t WHERE t.tgrelid=relation_id AND NOT t.tgisinternal
     AND (t.tgfoid<>'official_v3_guard_private.immutable_v1()'::regprocedure OR t.tgenabled<>'O' OR t.tgnargs<>0 OR t.tgqual IS NOT NULL
       OR NOT(t.tgname='immutable_v1' AND t.tgtype=27 OR t.tgname='immutable_truncate_v1' AND t.tgtype=34)))
   OR (SELECT count(*) FROM pg_constraint c WHERE c.conrelid=relation_id AND c.contype='p')<>1
   OR EXISTS(SELECT 1 FROM pg_constraint c WHERE c.conrelid=relation_id AND (c.contype NOT IN ('p','c') OR NOT c.convalidated OR c.condeferrable OR c.condeferred))
   OR (SELECT count(*) FROM pg_constraint c WHERE c.conrelid=relation_id AND c.contype='c')<>8 THEN
   RAISE EXCEPTION 'customer exact private immutable baseline required' USING ERRCODE='P7921';
 END IF;
 INSERT INTO pg_temp.customer_objects
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
 after_catalog:=official_v3_guard_private.catalog_status_v1();
 FOR entry IN SELECT key,value FROM jsonb_each(before_catalog) LOOP
   IF after_catalog->entry.key IS NOT DISTINCT FROM entry.value THEN CONTINUE; END IF;
   IF entry.key LIKE 'function:%' AND split_part(entry.key,':',2)::oid=ANY(replacement_ids)
     AND (after_catalog->entry.key)-'definition' IS NOT DISTINCT FROM entry.value-'definition' THEN CONTINUE; END IF;
   RAISE EXCEPTION 'customer predecessor graph changed: %',entry.key USING ERRCODE='P7921';
 END LOOP;
 FOR entry IN SELECT key,value FROM jsonb_each(after_catalog) WHERE NOT before_catalog ? key LOOP
   class_value:=CASE split_part(entry.key,':',1)
     WHEN 'relation' THEN 'pg_class'::regclass WHEN 'attribute' THEN 'pg_class'::regclass WHEN 'index' THEN 'pg_class'::regclass
     WHEN 'type' THEN 'pg_type'::regclass WHEN 'constraint' THEN 'pg_constraint'::regclass
     WHEN 'trigger' THEN 'pg_trigger'::regclass WHEN 'policy' THEN 'pg_policy'::regclass WHEN 'default' THEN 'pg_attrdef'::regclass
     WHEN 'dependency' THEN (entry.value->>'classid')::oid WHEN 'shared' THEN (entry.value->>'classid')::oid END;
   object_value:=CASE WHEN split_part(entry.key,':',1) IN ('dependency','shared') THEN (entry.value->>'objid')::oid ELSE split_part(entry.key,':',2)::oid END;
   IF class_value IS NULL OR NOT EXISTS(SELECT 1 FROM pg_temp.customer_objects o WHERE o.classid=class_value AND o.objid=object_value) THEN
     RAISE EXCEPTION 'customer unreviewed additive edge: %',entry.key USING ERRCODE='P7921';
   END IF;
 END LOOP;
 /* CAPTURE_JOBS */
 jobs_snapshot:=result_value;
 SELECT (/* CAPTURE_HRS */) INTO hrs_snapshot;
 INSERT INTO official_v3_guard_private.customer_information_baseline_v1
 SELECT true,'ROLLING_PROVIDER_SHA256',encode(sha256(convert_to(before_catalog::text,'UTF8')),'hex'),
   encode(sha256(convert_to((to_jsonb(prior)||jsonb_build_object('proof_not_before',extract(epoch FROM prior.proof_not_before)))::text,'UTF8')),'hex'),
   'DEFINITIONS_SHA256','HISTORY_DEFINITION_SHA256',s.generation+1,clock_timestamp(),jobs_snapshot,hrs_snapshot,after_catalog
   FROM official_v3_guard_private.state_v1 s CROSS JOIN official_v3_guard_private.rolling_quota_baseline_v1 prior
   WHERE s.singleton AND prior.singleton;
END $customer_delta$;
