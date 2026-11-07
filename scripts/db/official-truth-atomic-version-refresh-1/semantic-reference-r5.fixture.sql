-- Native-only immutable R5 oracle. Original semantic-v2 blob4474216661c54b762c53be415c81bef4a25a10e0.
-- Only the five enumerated fully qualified function names are redirected.
BEGIN;
CREATE SCHEMA official_refresh_reference_r5;
REVOKE ALL ON SCHEMA official_refresh_reference_r5 FROM PUBLIC;
CREATE FUNCTION official_refresh_reference_r5.validate_graph_v2(profile text,fingerprint text,receipt_bytes bytea,binding_bytes bytea,artifacts official_provenance_api.artifact_input_v1[]) RETURNS void
LANGUAGE plpgsql IMMUTABLE SET search_path = '' SET timezone='UTC' AS $$
DECLARE receipt jsonb; binding jsonb; a official_provenance_api.artifact_input_v1; b official_provenance_api.artifact_input_v1; root record; edge record;
 graph jsonb := '{}'::jsonb; starts jsonb := '[]'::jsonb; work jsonb; item jsonb; visited jsonb := '{}'::jsonb; longest jsonb := '{}'::jsonb; key text; target text; total_bytes bigint; edge_count integer; depth integer;
BEGIN
 PERFORM official_provenance_private.require(profile='ot-integrated-pilot-local-closure-v2');
 IF fingerprint IS NULL OR receipt_bytes IS NULL OR binding_bytes IS NULL OR artifacts IS NULL OR fingerprint !~ '^ot-provenance-v1:[a-f0-9]{64}$'
 OR pg_catalog.array_ndims(artifacts) <> 1 OR pg_catalog.array_lower(artifacts,1) <> 1 OR pg_catalog.cardinality(artifacts) NOT BETWEEN 1 AND 255 THEN RAISE EXCEPTION 'invalid_input'; END IF;
 receipt:=official_provenance_private.decode(receipt_bytes,262144); PERFORM official_provenance_private.typed(receipt,'receipt'); binding:=official_provenance_private.decode(binding_bytes,4096);
 IF receipt->>'schema' IS DISTINCT FROM 'official-truth-autonomous-provenance' OR receipt->'schemaVersion' IS DISTINCT FROM '1'::jsonb OR receipt->>'canonicalization' IS DISTINCT FROM 'ot-provenance-json-v1'
 OR 'ot-provenance-v1:'||pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to('ot-provenance-v1'||pg_catalog.chr(10),'UTF8')||receipt_bytes),'hex') <> fingerprint THEN RAISE EXCEPTION 'invalid_input'; END IF;
 IF (SELECT pg_catalog.count(*) FROM (SELECT x.artifact_id,x.artifact_version FROM pg_catalog.unnest(artifacts) x GROUP BY x.artifact_id,x.artifact_version) q) <> pg_catalog.cardinality(artifacts) THEN RAISE EXCEPTION 'invalid_input'; END IF;
 PERFORM official_provenance_private.require(NOT EXISTS(SELECT x.artifact_id FROM pg_catalog.unnest(artifacts) x GROUP BY x.artifact_id HAVING pg_catalog.count(DISTINCT (x.artifact_type,x.byte_contract_family))>1));
 total_bytes:=pg_catalog.octet_length(binding_bytes); edge_count:=1;
 FOREACH a IN ARRAY artifacts LOOP
  total_bytes:=total_bytes+pg_catalog.octet_length(a.canonical_bytes);
  key:=a.artifact_id||':'||a.artifact_version::text||':'||a.digest;
  graph:=graph||pg_catalog.jsonb_build_object(key,'[]'::jsonb);
  FOR edge IN SELECT * FROM official_provenance_private.artifact_v2(a) LOOP
   edge_count:=edge_count+1;
   IF NOT EXISTS(SELECT 1 FROM pg_catalog.unnest(artifacts) x WHERE x.artifact_id=edge.pin->>'id' AND x.artifact_version=(edge.pin->>'version')::bigint AND x.digest=edge.pin->>'digest' AND x.artifact_type=edge.expected_type) THEN RAISE EXCEPTION 'dependency_missing'; END IF;
   target:=(edge.pin->>'id')||':'||(edge.pin->>'version')||':'||(edge.pin->>'digest');
   graph:=pg_catalog.jsonb_set(graph,ARRAY[key],graph->key||pg_catalog.to_jsonb(target));
  END LOOP;
 END LOOP;
 FOR root IN SELECT * FROM official_provenance_private.receipt_roots(receipt) UNION ALL SELECT * FROM official_provenance_private.binding_roots(binding,fingerprint) LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_catalog.unnest(artifacts) x WHERE x.artifact_id=root.pin->>'id' AND x.artifact_version=(root.pin->>'version')::bigint AND x.digest=root.pin->>'digest' AND x.artifact_type=root.expected_type) THEN RAISE EXCEPTION 'dependency_missing'; END IF;
  target:=(root.pin->>'id')||':'||(root.pin->>'version')||':'||(root.pin->>'digest');
  depth:=CASE WHEN root.slot IN ('globalAdmission','selectedSupportManifest','autonomousReviewConstruction') THEN 2 ELSE 1 END;
  starts:=starts||pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('key',target,'depth',depth,'path','[]'::jsonb)); edge_count:=edge_count+1;
 END LOOP;
 IF total_bytes>8388608 OR edge_count>1024 THEN RAISE EXCEPTION 'bound_exceeded'; END IF;
 -- Longest-depth relaxation revisits a shared node when a later deeper path reaches it.
 -- Dominated same-depth paths are skipped to keep work bounded by nodes/edges times depth.
 work:=starts;
 WHILE pg_catalog.jsonb_array_length(work)>0 LOOP
  item:=work->0; work:=work-0; key:=item->>'key'; depth:=(item->>'depth')::integer;
  IF depth>16 THEN RAISE EXCEPTION 'bound_exceeded'; END IF;
  IF item->'path' ? key THEN RAISE EXCEPTION 'cycle'; END IF;
  IF longest ? key AND (longest->>key)::integer >= depth THEN CONTINUE; END IF;
  longest:=longest||pg_catalog.jsonb_build_object(key,depth);
  visited:=visited||pg_catalog.jsonb_build_object(key,true);
  FOR target IN SELECT pg_catalog.jsonb_array_elements_text(graph->key) LOOP
   work:=work||pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('key',target,'depth',depth+1,'path',item->'path'||pg_catalog.to_jsonb(key)));
   IF pg_catalog.jsonb_array_length(work)>16384 THEN RAISE EXCEPTION 'bound_exceeded'; END IF;
  END LOOP;
 END LOOP;
 IF (SELECT pg_catalog.count(*) FROM pg_catalog.jsonb_object_keys(visited))<>pg_catalog.cardinality(artifacts) THEN RAISE EXCEPTION 'unsolicited_artifact'; END IF;
END $$;

CREATE FUNCTION official_refresh_reference_r5.validate_semantics_v2(p jsonb,k jsonb,aa official_provenance_api.artifact_input_v1[]) RETURNS void LANGUAGE plpgsql IMMUTABLE SET search_path='' SET timezone='UTC' AS $$
DECLARE cell jsonb; admission jsonb; manifest jsonb; review jsonb; selection jsonb; eligibility jsonb; catalog jsonb; registry jsonb; extractor jsonb; ed jsonb; er jsonb; policy jsonb; pd jsonb; pr jsonb;
 a official_provenance_api.artifact_input_v1; v jsonb; accepted jsonb; observed jsonb; valid jsonb; c jsonb; b jsonb; ident jsonb; original_catalog jsonb; rep jsonb; item jsonb; qualification jsonb; profile jsonb;
 s jsonb; selected jsonb; entry jsonb; citation jsonb; assignment jsonb; dimension record; idx integer:=0; ids jsonb; refs jsonb; bindings jsonb; urls jsonb; types jsonb; compact jsonb:='[]'; lookup text; fact_preimage jsonb; candidate_preimage jsonb; proof_preimage jsonb; selection_key text; expected jsonb; previous text; current_key text; reference timestamptz;
BEGIN
 SELECT pg_catalog.jsonb_agg(e->'versionId' ORDER BY n) INTO ids FROM pg_catalog.jsonb_array_elements(p->'supports') WITH ORDINALITY q(e,n);
 PERFORM official_provenance_private.require(ids=(SELECT pg_catalog.jsonb_agg(e ORDER BY e) FROM (SELECT DISTINCT e FROM pg_catalog.jsonb_array_elements(ids) e) x));
 PERFORM official_provenance_private.require((p->>'evidenceQuality'='explicit_primary_statement' AND pg_catalog.jsonb_array_length(ids)=1 AND p->'policy'='null'::jsonb) OR (p->>'evidenceQuality'='composed_from_multiple_primary_sources' AND pg_catalog.jsonb_array_length(ids)>=2 AND p->'policy'<>'null'::jsonb));
 -- All accepted origins and custody nodes are audited, including unselected versions.
 FOREACH a IN ARRAY aa LOOP
  IF a.artifact_type<>ALL(ARRAY['accepted_origin','AcceptedEvidenceCustodyV1','eligible_version_snapshot','catalog_snapshot','original_observation','GlobalCellAdmissionV1','extractor_registry','policy_registry']) THEN CONTINUE;END IF;
  v:=official_provenance_private.content_v2(aa,pg_catalog.jsonb_build_object('id',a.artifact_id,'version',a.artifact_version,'digest',a.digest),a.artifact_type);
  IF a.artifact_type='accepted_origin' THEN
   observed:=official_provenance_private.content_v2(aa,v->'observation','original_observation');valid:=official_provenance_private.content_v2(aa,v->'validityOrigin','validity_origin');cell:=official_provenance_private.content_v2(aa,v->'cell','global_cell');admission:=official_provenance_private.content_v2(aa,v->'globalAdmission','GlobalCellAdmissionV1');b:=observed->'binding';ident:=v->'evidenceIdentity';
   PERFORM official_provenance_private.require(admission->'cell'=v->'cell' AND valid->'observation'=v->'observation' AND valid->'evidenceScope'=v->'evidenceScope' AND v->'evidenceScope'=cell->'scope'||pg_catalog.jsonb_build_object('sourceId',b->'sourceId') AND valid->'validFrom'=ident->'validFrom' AND valid->'validUntil'=ident->'validUntil');
   PERFORM official_provenance_private.semantic_contract_v2(aa,v->'acceptanceContract','evidence_acceptance');PERFORM official_provenance_private.semantic_contract_v2(aa,valid->'derivationContract','validity_derivation');
   expected:=b||pg_catalog.jsonb_build_object('identitySchema',2,'lookupKey',official_provenance_private.lookup_v2(v->'evidenceScope',b),'canonicalUrl',observed->'canonicalFinalUrl','contentType',observed->'contentType','sourceContentHash',observed->'sourceContentHash','retrievedAt',observed->'completedAt','validFrom',valid->'validFrom','validUntil',valid->'validUntil','versionId',ident->'versionId');
   PERFORM official_provenance_private.require(ident=expected);
  ELSIF a.artifact_type='AcceptedEvidenceCustodyV1' THEN
   accepted:=official_provenance_private.content_v2(aa,v->'acceptedOrigin','accepted_origin');observed:=official_provenance_private.content_v2(aa,v->'observation','original_observation');admission:=official_provenance_private.content_v2(aa,v->'globalAdmission','GlobalCellAdmissionV1');
   PERFORM official_provenance_private.require(v->'cell'=accepted->'cell' AND v->'cell'=admission->'cell' AND v->'globalAdmission'=accepted->'globalAdmission' AND v->'scopeContract'=admission->'scopeContract' AND v->'observation'=accepted->'observation' AND v->'validityOrigin'=accepted->'validityOrigin' AND v->'evidenceIdentity'=accepted->'evidenceIdentity' AND v->'evidenceScope'=accepted->'evidenceScope' AND v->'hashContract'=observed->'hashContract');
   PERFORM official_provenance_private.semantic_contract_v2(aa,v->'identityContract','content_identity');PERFORM official_provenance_private.semantic_contract_v2(aa,v->'hashContract','source_hash');
  ELSIF a.artifact_type='eligible_version_snapshot' THEN
   FOR entry IN SELECT e FROM pg_catalog.jsonb_array_elements(v->'entries') e LOOP PERFORM official_provenance_private.require(official_provenance_private.content_v2(aa,entry->'custody','AcceptedEvidenceCustodyV1')#>'{evidenceIdentity,versionId}'=entry->'versionId');END LOOP;
  ELSIF a.artifact_type IN ('extractor_registry','policy_registry') THEN
   expected:='[]'::jsonb;
   FOR entry IN SELECT e FROM pg_catalog.jsonb_array_elements(v->'definitions') e LOOP
    ident:=official_provenance_private.content_v2(aa,entry->'definition',CASE WHEN a.artifact_type='extractor_registry' THEN 'extractor_definition' ELSE 'policy_definition' END)->'descriptor';
    PERFORM official_provenance_private.require(ident->CASE WHEN a.artifact_type='extractor_registry' THEN 'extractorId' ELSE 'policyId' END=entry->'id' AND ident->CASE WHEN a.artifact_type='extractor_registry' THEN 'extractorVersion' ELSE 'policyVersion' END=entry->'version');
    IF entry->'current'='true'::jsonb THEN
     b:=pg_catalog.jsonb_build_object('factKind',ident->'factKind','contentItemRefs',ident->'contentItemRefs');
     IF a.artifact_type='policy_registry' THEN b:=b||pg_catalog.jsonb_build_object('requirementType',ident->'requirementType','sourceFamilyId',ident->'sourceFamilyId','schemaFamily',ident->'schemaFamily');END IF;
     PERFORM official_provenance_private.require(NOT(expected @> pg_catalog.jsonb_build_array(b)));expected:=expected||pg_catalog.jsonb_build_array(b);
    END IF;
   END LOOP;
  ELSIF a.artifact_type='GlobalCellAdmissionV1' THEN
   cell:=official_provenance_private.content_v2(aa,v->'cell','global_cell');PERFORM official_provenance_private.semantic_contract_v2(aa,v->'scopeContract','scope');PERFORM official_provenance_private.semantic_contract_v2(aa,v->'corpusAdmissionContract','corpus_admission');
   IF v->'evaluationDatePlan'<>'null'::jsonb THEN PERFORM official_provenance_private.semantic_contract_v2(aa,v->'evaluationDatePlan','evaluation_date_plan');END IF;
   FOR dimension IN SELECT * FROM pg_catalog.jsonb_each(cell->'scope') LOOP PERFORM official_provenance_private.require(v#>ARRAY['dimensionBasis',dimension.key,'category']=dimension.value);PERFORM official_provenance_private.semantic_contract_v2(aa,v#>ARRAY['dimensionBasis',dimension.key,'basis'],'category_basis');END LOOP;
  ELSIF a.artifact_type='original_observation' THEN
   b:=v->'binding';original_catalog:=official_provenance_private.content_v2(aa,v->'catalogSnapshot','catalog_snapshot');qualification:=official_provenance_private.content_v2(aa,v->'qualification','GlobalRepresentationQualificationV1');profile:=official_provenance_private.content_v2(aa,v->'identityProfile','identity_profile');
   SELECT e INTO rep FROM pg_catalog.jsonb_array_elements(original_catalog#>'{registry,contentIdentity,representations}') e WHERE e->>'expectedFinalUrl'=v->>'canonicalFinalUrl' AND e->'current'='true'::jsonb;
   SELECT e INTO item FROM pg_catalog.jsonb_array_elements(original_catalog#>'{registry,contentIdentity,items}') e WHERE e->'sourceId'=b->'sourceId' AND e->'contentItemId'=b->'contentItemId' AND e->'contentItemVersion'=b->'contentItemVersion' AND e->'current'='true'::jsonb;
   PERFORM official_provenance_private.require(rep @> b AND rep->'requestUrls' @> pg_catalog.jsonb_build_array(v->'requestUrl') AND rep->'expectedMediaType'=v->'contentType' AND qualification->'binding'=b AND qualification->'identityProfileDefinition'=v->'identityProfile' AND profile->'identityProfileId'=b->'identityProfileId' AND profile->'identityProfileVersion'=b->'identityProfileVersion' AND original_catalog->'profiles' @> pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('identityProfileId',b->'identityProfileId','identityProfileVersion',b->'identityProfileVersion','definition',v->'identityProfile')) AND official_provenance_private.content_v2(aa,qualification->'itemDefinition','content_item_definition')->'descriptor'=item AND official_provenance_private.content_v2(aa,qualification->'representationDefinition','representation_definition')->'descriptor'=rep);
   PERFORM official_provenance_private.semantic_contract_v2(aa,v->'transportContract','transport');PERFORM official_provenance_private.semantic_contract_v2(aa,v->'hashContract','source_hash');PERFORM official_provenance_private.semantic_contract_v2(aa,qualification->'qualificationContract','representation_qualification');
  ELSIF a.artifact_type='catalog_snapshot' THEN
   FOR entry IN SELECT e FROM pg_catalog.jsonb_array_elements(v->'profiles') e LOOP profile:=official_provenance_private.content_v2(aa,entry->'definition','identity_profile');PERFORM official_provenance_private.require(profile->'identityProfileId'=entry->'identityProfileId' AND profile->'identityProfileVersion'=entry->'identityProfileVersion');END LOOP;
  END IF;
 END LOOP;
 cell:=official_provenance_private.content_v2(aa,p#>'{globalCell,definition}','global_cell');admission:=official_provenance_private.content_v2(aa,k->'globalAdmission','GlobalCellAdmissionV1');manifest:=official_provenance_private.content_v2(aa,k->'selectedSupportManifest','SelectedSupportManifestV1');review:=official_provenance_private.content_v2(aa,k->'autonomousReviewConstruction','AutonomousReviewConstructionV1');
 PERFORM official_provenance_private.require(p#>'{candidate,requirementType}'=cell#>'{scope,requirementType}' AND cell->'scope'=p#>'{globalCell,scope}' AND admission->'cell'=p#>'{globalCell,definition}' AND manifest->'cell'=p#>'{globalCell,definition}' AND review->'cell'=p#>'{globalCell,definition}' AND manifest->'globalAdmission'=k->'globalAdmission' AND review->'selectedSupportManifest'=k->'selectedSupportManifest' AND review->'reviewPacketKey'=p#>'{proof,reviewPacketKey}' AND review#>'{safePreimage,candidate,scope}'=cell->'scope' AND review#>'{safePreimage,candidate,key}'=p#>'{globalCell,ruleScopeKey}' AND p#>>'{globalCell,ruleScopeKey}'=official_provenance_private.scope_key_v2(cell->'scope') AND review#>'{safePreimage,candidate,factKind}'=p#>'{candidate,factKind}' AND review#>'{safePreimage,candidate,evidenceQuality}'=p->'evidenceQuality' AND review#>'{safePreimage,candidate,supportVersionIds}'=ids AND manifest->'factKind'=p#>'{candidate,factKind}' AND manifest->'requirementType'=p#>'{candidate,requirementType}' AND manifest->'evidenceQuality'=p->'evidenceQuality' AND manifest->'catalogSnapshot'=p#>'{proof,catalogSnapshot}' AND manifest->'extractorRegistrySnapshot'=p#>'{extractor,registrySnapshot}' AND manifest->'policyRegistrySnapshot'=COALESCE(p#>'{policy,registrySnapshot}','null'::jsonb));
 PERFORM official_provenance_private.require((SELECT pg_catalog.jsonb_agg(e->'versionId' ORDER BY n) FROM pg_catalog.jsonb_array_elements(manifest->'supports') WITH ORDINALITY q(e,n))=ids);
 PERFORM official_provenance_private.semantic_contract_v2(aa,admission->'scopeContract','scope');PERFORM official_provenance_private.semantic_contract_v2(aa,admission->'corpusAdmissionContract','corpus_admission');PERFORM official_provenance_private.semantic_contract_v2(aa,review->'constructionContract','review_construction');
 IF admission->'evaluationDatePlan'<>'null'::jsonb THEN PERFORM official_provenance_private.semantic_contract_v2(aa,admission->'evaluationDatePlan','evaluation_date_plan');END IF;
 FOR dimension IN SELECT * FROM pg_catalog.jsonb_each(cell->'scope') LOOP PERFORM official_provenance_private.require(admission#>ARRAY['dimensionBasis',dimension.key,'category']=dimension.value);PERFORM official_provenance_private.semantic_contract_v2(aa,admission#>ARRAY['dimensionBasis',dimension.key,'basis'],'category_basis');END LOOP;
 catalog:=official_provenance_private.content_v2(aa,p#>'{proof,catalogSnapshot}','catalog_snapshot');registry:=catalog->'registry';extractor:=official_provenance_private.content_v2(aa,p#>'{extractor,definition}','extractor_definition');ed:=extractor->'descriptor';er:=official_provenance_private.content_v2(aa,p#>'{extractor,registrySnapshot}','extractor_registry');selection:=official_provenance_private.content_v2(aa,manifest->'selectionDefinition','SupportSelectionDefinitionV1');eligibility:=official_provenance_private.content_v2(aa,manifest->'eligibleVersionSnapshot','eligible_version_snapshot');
 PERFORM official_provenance_private.require(selection->'cell'=p#>'{globalCell,definition}' AND selection->'requirementType'=p#>'{candidate,requirementType}' AND selection->'factKind'=p#>'{candidate,factKind}' AND selection->'evidenceQuality'=p->'evidenceQuality' AND extractor->'outputContract'=p#>'{extractor,outputContract}' AND extractor->'factSchema'=p#>'{candidate,factSchema}' AND extractor->'applicabilitySchema'=p#>'{candidate,applicabilitySchema}' AND ed->'extractorId'=p#>'{extractor,extractorId}' AND ed->'extractorVersion'=p#>'{extractor,extractorVersion}' AND ed->'schemaFamily'=p#>'{extractor,schemaFamily}' AND ed->'sourceFamilyId'=p#>'{extractor,sourceFamilyId}' AND ed->'factKind'=p#>'{candidate,factKind}' AND ed->'policyId'=COALESCE(p#>'{policy,policyId}','null'::jsonb) AND ed->'policyVersion'=COALESCE(p#>'{policy,policyVersion}','null'::jsonb));
 PERFORM official_provenance_private.semantic_contract_v2(aa,selection->'selectionContract','support_selection');
 PERFORM official_provenance_private.require((SELECT pg_catalog.count(*) FROM pg_catalog.jsonb_array_elements(er->'definitions') e WHERE e->'current'='true'::jsonb AND e->'definition'=p#>'{extractor,definition}')=1);
 -- At most one current registry version per identity; every descriptor agrees with its identity.
 FOR entry IN SELECT e FROM pg_catalog.jsonb_array_elements(er->'definitions') e LOOP v:=official_provenance_private.content_v2(aa,entry->'definition','extractor_definition')->'descriptor';PERFORM official_provenance_private.require(v->'extractorId'=entry->'id' AND v->'extractorVersion'=entry->'version');END LOOP;
 PERFORM official_provenance_private.require(NOT EXISTS(SELECT e->>'id' FROM pg_catalog.jsonb_array_elements(er->'definitions') e WHERE e->'current'='true'::jsonb GROUP BY e->>'id' HAVING pg_catalog.count(*)>1));
 reference:=(p#>>'{proof,serverReferenceTime}')::timestamptz;
 FOR s IN SELECT e FROM pg_catalog.jsonb_array_elements(p->'supports') e LOOP
  selected:=manifest->'supports'->idx;idx:=idx+1;c:=official_provenance_private.content_v2(aa,selected->'custody','AcceptedEvidenceCustodyV1');b:=s->'binding';lookup:=official_provenance_private.lookup_v2(cell->'scope',b);
  ident:=b||pg_catalog.jsonb_build_object('identitySchema',2,'lookupKey',lookup,'canonicalUrl',s->'canonicalFinalUrl','contentType',s->'contentType','sourceContentHash',s->'sourceContentHash','retrievedAt',s->'acceptedRetrievedAt','validFrom',s->'validFrom','validUntil',s->'validUntil','versionId',s->'versionId');
  PERFORM official_provenance_private.typed(ident,'identity');PERFORM official_provenance_private.require(c->'cell'=p#>'{globalCell,definition}' AND c->'globalAdmission'=k->'globalAdmission' AND c->'scopeContract'=admission->'scopeContract' AND ident=c->'evidenceIdentity' AND c->'evidenceScope'=cell->'scope'||pg_catalog.jsonb_build_object('sourceId',b->'sourceId'));
  PERFORM official_provenance_private.require((s->>'acceptedRetrievedAt')::timestamptz<=reference AND (s#>>'{freshRetrieval,completedAt}')::timestamptz>=reference AND reference-(s->>'acceptedRetrievedAt')::timestamptz<INTERVAL '1 hour' AND (s->'validFrom'='null'::jsonb OR (s->>'validFrom')::timestamptz<=reference) AND (s->'validUntil'='null'::jsonb OR (s->>'validUntil')::timestamptz>=reference));
  compact:=compact||pg_catalog.jsonb_build_array(ident-'lookupKey');
  PERFORM official_provenance_private.require(ed->'representations' @> pg_catalog.jsonb_build_array(b));
  PERFORM official_provenance_private.require(ed->'contentTypes' @> pg_catalog.jsonb_build_array(s->'contentType') AND EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(ed->'urlAllowlist') allow WHERE (allow->>'kind'='exact' AND allow->'canonicalUrl'=s->'canonicalFinalUrl') OR (allow->>'kind'='path' AND s->>'canonicalFinalUrl'='https://'||(allow->>'host')||(allow->>'path'))));
  SELECT e INTO rep FROM pg_catalog.jsonb_array_elements(registry#>'{contentIdentity,representations}') e WHERE e->>'expectedFinalUrl'=s->>'canonicalFinalUrl' AND e->'current'='true'::jsonb;
  PERFORM official_provenance_private.require(rep IS NOT NULL AND rep @> b AND rep->'requestUrls' @> pg_catalog.jsonb_build_array(s#>'{freshRetrieval,requestUrl}') AND rep->'expectedMediaType'=s->'contentType');
  observed:=official_provenance_private.content_v2(aa,c->'observation','original_observation');valid:=official_provenance_private.content_v2(aa,c->'validityOrigin','validity_origin');accepted:=official_provenance_private.content_v2(aa,c->'acceptedOrigin','accepted_origin');
  PERFORM official_provenance_private.require(observed->'binding'=b AND observed->'canonicalFinalUrl'=s->'canonicalFinalUrl' AND observed->'contentType'=s->'contentType' AND observed->'sourceContentHash'=s->'sourceContentHash' AND observed->'completedAt'=s->'acceptedRetrievedAt' AND observed->'hashContract'=c->'hashContract');
  PERFORM official_provenance_private.semantic_contract_v2(aa,observed->'transportContract','transport');
  original_catalog:=official_provenance_private.content_v2(aa,observed->'catalogSnapshot','catalog_snapshot');qualification:=official_provenance_private.content_v2(aa,observed->'qualification','GlobalRepresentationQualificationV1');profile:=official_provenance_private.content_v2(aa,observed->'identityProfile','identity_profile');
  SELECT e INTO rep FROM pg_catalog.jsonb_array_elements(original_catalog#>'{registry,contentIdentity,representations}') e WHERE e->>'expectedFinalUrl'=observed->>'canonicalFinalUrl' AND e->'current'='true'::jsonb;
  SELECT e INTO item FROM pg_catalog.jsonb_array_elements(original_catalog#>'{registry,contentIdentity,items}') e WHERE e->'sourceId'=b->'sourceId' AND e->'contentItemId'=b->'contentItemId' AND e->'contentItemVersion'=b->'contentItemVersion' AND e->'current'='true'::jsonb;
  PERFORM official_provenance_private.require(rep @> b AND rep->'requestUrls' @> pg_catalog.jsonb_build_array(observed->'requestUrl') AND qualification->'binding'=b AND qualification->'identityProfileDefinition'=observed->'identityProfile' AND profile->'identityProfileId'=b->'identityProfileId' AND profile->'identityProfileVersion'=b->'identityProfileVersion' AND original_catalog->'profiles' @> pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('identityProfileId',b->'identityProfileId','identityProfileVersion',b->'identityProfileVersion','definition',observed->'identityProfile')) AND official_provenance_private.content_v2(aa,qualification->'itemDefinition','content_item_definition')->'descriptor'=item AND official_provenance_private.content_v2(aa,qualification->'representationDefinition','representation_definition')->'descriptor'=rep);
  PERFORM official_provenance_private.semantic_contract_v2(aa,qualification->'qualificationContract','representation_qualification');
 END LOOP;
 SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('sourceId',e#>'{binding,sourceId}','contentItemId',e#>'{binding,contentItemId}') ORDER BY e#>>'{binding,sourceId}',e#>>'{binding,contentItemId}'),pg_catalog.jsonb_agg(e->'binding' ORDER BY e#>>'{binding,sourceId}',e#>>'{binding,contentItemId}',e#>>'{binding,representationId}'),pg_catalog.jsonb_agg(e->'canonicalFinalUrl' ORDER BY n) INTO refs,bindings,urls FROM pg_catalog.jsonb_array_elements(p->'supports') WITH ORDINALITY q(e,n);
 SELECT pg_catalog.jsonb_agg(t ORDER BY t) INTO types FROM (SELECT DISTINCT e->'contentType' t FROM pg_catalog.jsonb_array_elements(p->'supports') e) q;
 PERFORM official_provenance_private.require((SELECT pg_catalog.count(DISTINCT e) FROM pg_catalog.jsonb_array_elements(refs) e)=pg_catalog.jsonb_array_length(refs) AND compact=review#>'{safePreimage,supports}' AND refs=selection->'requiredContentItemRefs' AND refs=ed->'contentItemRefs');
 SELECT pg_catalog.jsonb_agg(e-'eligible' ORDER BY n) INTO expected FROM pg_catalog.jsonb_array_elements(eligibility->'entries') WITH ORDINALITY q(e,n) WHERE e->'eligible'='true'::jsonb;PERFORM official_provenance_private.require(expected=manifest->'supports');
 fact_preimage:=(p->'candidate')-ARRAY['factHash','candidateBinding'];PERFORM official_provenance_private.require(official_provenance_private.h('ot-fact-v1',fact_preimage)=p#>>'{candidate,factHash}');
 candidate_preimage:=pg_catalog.jsonb_build_object('scope',cell->'scope','ruleScopeKey',p#>'{globalCell,ruleScopeKey}','factKind',p#>'{candidate,factKind}','requirementType',p#>'{candidate,requirementType}','schemaFamily',p#>'{extractor,schemaFamily}','factSchema',p#>'{candidate,factSchema}','applicabilitySchema',p#>'{candidate,applicabilitySchema}','factHash',p#>'{candidate,factHash}','evidenceQuality',p->'evidenceQuality','supportVersionIds',ids);
 PERFORM official_provenance_private.require(official_provenance_private.h('ot-candidate-v1',candidate_preimage)=p#>>'{candidate,candidateBinding}');
 proof_preimage:=((p->'proof')-'proofIdentity')||pg_catalog.jsonb_build_object('ruleScopeKey',p#>'{globalCell,ruleScopeKey}','factKind',p#>'{candidate,factKind}','supportVersionIds',ids);PERFORM official_provenance_private.require(official_provenance_private.h('ot-proof-v1',proof_preimage)=p#>>'{proof,proofIdentity}');
 -- Closed local legacy visa fact requires exactly both fields, each with nonempty ordered support coverage.
 PERFORM official_provenance_private.require((SELECT pg_catalog.jsonb_agg(e->'target' ORDER BY n) FROM pg_catalog.jsonb_array_elements(p->'citations') WITH ORDINALITY q(e,n))='[{"kind":"fact_field","fieldPath":"effect"},{"kind":"fact_field","fieldPath":"visaMode"}]'::jsonb);
 FOR citation IN SELECT e FROM pg_catalog.jsonb_array_elements(p->'citations') e LOOP PERFORM official_provenance_private.require(citation->'supportVersionIds'=(SELECT pg_catalog.jsonb_agg(e ORDER BY e) FROM (SELECT DISTINCT e FROM pg_catalog.jsonb_array_elements(citation->'supportVersionIds') e) x) AND ids @> (citation->'supportVersionIds'));END LOOP;
 IF p->'policy'='null'::jsonb THEN
  selection_key:=official_provenance_private.h('ot-extractor-selection-v1',pg_catalog.jsonb_build_object('path','explicit_post_retrieval','selectorContract',p#>'{proof,contract}','registrySnapshot',p#>'{extractor,registrySnapshot}','factKind',p#>'{candidate,factKind}','requirementType',p#>'{candidate,requirementType}','evidenceQuality','explicit_primary_statement','contentItemRefs',refs,'representations',bindings,'canonicalFinalUrls',urls,'observedContentTypes',types,'policy',NULL));
  PERFORM official_provenance_private.require(p#>>'{extractor,selectionKey}'=selection_key AND NOT EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(p->'citations') e WHERE e->'supportVersionIds'<>ids));
 ELSE
  policy:=p->'policy';pd:=official_provenance_private.content_v2(aa,policy->'definition','policy_definition')->'descriptor';pr:=official_provenance_private.content_v2(aa,policy->'registrySnapshot','policy_registry');
  PERFORM official_provenance_private.require((SELECT pg_catalog.count(*) FROM pg_catalog.jsonb_array_elements(pr->'definitions') e WHERE e->'current'='true'::jsonb AND e->'definition'=policy->'definition')=1 AND NOT EXISTS(SELECT e->>'id' FROM pg_catalog.jsonb_array_elements(pr->'definitions') e WHERE e->'current'='true'::jsonb GROUP BY e->>'id' HAVING pg_catalog.count(*)>1) AND pd->'policyId'=policy->'policyId' AND pd->'policyVersion'=policy->'policyVersion' AND pd->'factKind'=p#>'{candidate,factKind}' AND pd->'requirementType'=p#>'{candidate,requirementType}' AND pd->'sourceFamilyId'=ed->'sourceFamilyId' AND pd->'schemaFamily'=ed->'schemaFamily' AND pd->'applicabilitySchema'='null'::jsonb AND pd->'assignments'=policy->'assignments' AND pd->'contentItemRefs'=refs);
  FOR entry IN SELECT e FROM pg_catalog.jsonb_array_elements(er->'definitions') e WHERE e->'current'='true'::jsonb LOOP
   ident:=official_provenance_private.content_v2(aa,entry->'definition','extractor_definition')->'descriptor';
   IF ident->'policyId'='null'::jsonb THEN CONTINUE;END IF;
   SELECT e INTO selected FROM pg_catalog.jsonb_array_elements(pr->'definitions') e WHERE e->'id'=ident->'policyId' AND e->'version'=ident->'policyVersion' AND e->'current'='true'::jsonb;PERFORM official_provenance_private.require(selected IS NOT NULL);
   b:=official_provenance_private.content_v2(aa,selected->'definition','policy_definition')->'descriptor';
   PERFORM official_provenance_private.require(b->'factKind'=ident->'factKind' AND b->'contentItemRefs'=ident->'contentItemRefs' AND b->'sourceFamilyId'=ident->'sourceFamilyId' AND b->'schemaFamily'=ident->'schemaFamily');
   FOR current_key IN SELECT pg_catalog.jsonb_array_elements_text(ident->'requiredFieldPaths') LOOP PERFORM official_provenance_private.require(EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(b->'assignments') e WHERE e#>>'{target,fieldPath}'=current_key));END LOOP;
  END LOOP;
  idx:=0;FOR assignment IN SELECT e FROM pg_catalog.jsonb_array_elements(policy->'assignments') e LOOP
   citation:=p->'citations'->idx;idx:=idx+1;SELECT pg_catalog.jsonb_agg(support->'versionId' ORDER BY support->>'versionId') INTO expected FROM pg_catalog.jsonb_array_elements(p->'supports') support WHERE assignment->'contentItemRefs' @> pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('sourceId',support#>'{binding,sourceId}','contentItemId',support#>'{binding,contentItemId}'));
   PERFORM official_provenance_private.require(assignment->'target'=citation->'target' AND expected=citation->'supportVersionIds');
  END LOOP;PERFORM official_provenance_private.require(idx=pg_catalog.jsonb_array_length(p->'citations'));
  selection_key:=official_provenance_private.h('ot-composition-selection-v1',pg_catalog.jsonb_build_object('path','composed_pre_http','selectorContract',p#>'{proof,contract}','extractorRegistrySnapshot',p#>'{extractor,registrySnapshot}','policyRegistrySnapshot',policy->'registrySnapshot','factKind',p#>'{candidate,factKind}','requirementType',p#>'{candidate,requirementType}','contentItemRefs',refs,'representations',bindings,'canonicalFinalUrls',urls,'sourceFamilyId',ed->'sourceFamilyId','schemaFamily',ed->'schemaFamily'));
  PERFORM official_provenance_private.require(p#>>'{extractor,selectionKey}'=selection_key AND policy->>'preHttpSelectionKey'=selection_key AND policy->>'resultIdentity'=official_provenance_private.h('ot-composition-result-v1',pg_catalog.jsonb_build_object('candidateBinding',p#>'{candidate,candidateBinding}','factHash',p#>'{candidate,factHash}','extractorDefinition',p#>'{extractor,definition}','extractorRegistrySnapshot',p#>'{extractor,registrySnapshot}','outputContract',p#>'{extractor,outputContract}','policyDefinition',policy->'definition','policyRegistrySnapshot',policy->'registrySnapshot','preHttpSelectionKey',policy->'preHttpSelectionKey','assignments',policy->'assignments','supportVersionIds',ids,'citations',p->'citations')));
 END IF;
END $$;

CREATE FUNCTION official_refresh_reference_r5.validate_bundle_v2(profile text,fingerprint text,b bytea,k bytea,aa official_provenance_api.artifact_input_v1[]) RETURNS void LANGUAGE plpgsql IMMUTABLE SET search_path='' SET timezone='UTC' AS $$ BEGIN
 PERFORM official_refresh_reference_r5.validate_graph_v2(profile,fingerprint,b,k,aa);
 PERFORM official_refresh_reference_r5.validate_semantics_v2(official_provenance_private.decode(b,262144),official_provenance_private.decode(k,4096)->'value',aa);
END $$;

CREATE FUNCTION official_refresh_reference_r5.closure_v2(fingerprint text) RETURNS official_provenance_api.artifact_input_v1[] LANGUAGE plpgsql STABLE SET search_path='' SET timezone='UTC' AS $$
DECLARE result official_provenance_api.artifact_input_v1[]:='{}';queue jsonb:='[]';visited jsonb:='{}';entry jsonb;edge record;root record;meta record;a official_provenance_api.artifact_input_v1;key text;total bigint;count_edges integer:=1;b bytea;k bytea;
BEGIN
 SELECT pg_catalog.octet_length(r.canonical_payload_bytes) AS receipt_length,pg_catalog.octet_length(bb.canonical_bytes) AS binding_length INTO meta FROM official_provenance_private.receipts r JOIN official_provenance_private.custody_bindings cb USING(record_fingerprint) JOIN official_provenance_private.artifact_blobs bb ON bb.digest=cb.binding_digest WHERE r.record_fingerprint=fingerprint;
 PERFORM official_provenance_private.require(meta.receipt_length BETWEEN 1 AND 262144 AND meta.binding_length BETWEEN 1 AND 4096);total:=meta.binding_length;
 SELECT r.canonical_payload_bytes,bb.canonical_bytes INTO b,k FROM official_provenance_private.receipts r JOIN official_provenance_private.custody_bindings cb USING(record_fingerprint) JOIN official_provenance_private.artifact_blobs bb ON bb.digest=cb.binding_digest WHERE r.record_fingerprint=fingerprint;
 FOR root IN SELECT * FROM official_provenance_private.receipt_roots(official_provenance_private.decode(b,262144)) UNION ALL SELECT * FROM official_provenance_private.binding_roots(official_provenance_private.decode(k,4096),fingerprint) LOOP queue:=queue||pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('pin',root.pin,'type',root.expected_type));count_edges:=count_edges+1;END LOOP;
 WHILE pg_catalog.jsonb_array_length(queue)>0 LOOP
  entry:=queue->0;queue:=queue-0;key:=(entry#>>'{pin,id}')||':'||(entry#>>'{pin,version}')||':'||(entry#>>'{pin,digest}');
  IF visited ? key THEN CONTINUE;END IF;
  PERFORM official_provenance_private.require(pg_catalog.cardinality(result)<255);visited:=visited||pg_catalog.jsonb_build_object(key,true);
  SELECT ar.artifact_id,ar.artifact_version,ar.digest,ar.artifact_type,ar.byte_contract_family,ar.artifact_contract_version,pg_catalog.octet_length(bb.canonical_bytes) AS size INTO meta FROM official_provenance_private.artifacts ar JOIN official_provenance_private.artifact_blobs bb USING(digest) WHERE ar.artifact_id=entry#>>'{pin,id}' AND ar.artifact_version=(entry#>>'{pin,version}')::bigint AND ar.digest=entry#>>'{pin,digest}';
  PERFORM official_provenance_private.require(EXISTS(SELECT 1 FROM official_provenance_private.artifact_names n WHERE (n.artifact_id,n.artifact_type,n.byte_contract_family)=(meta.artifact_id,meta.artifact_type,meta.byte_contract_family)));
  PERFORM official_provenance_private.require(meta.artifact_type=entry->>'type' AND meta.size BETWEEN 1 AND 1048576 AND total+meta.size<=8388608);total:=total+meta.size;
  SELECT meta.artifact_id,meta.artifact_version,meta.digest,meta.artifact_type,meta.byte_contract_family,meta.artifact_contract_version,bb.canonical_bytes INTO a FROM official_provenance_private.artifact_blobs bb WHERE bb.digest=meta.digest;result:=result||a;
  FOR edge IN SELECT * FROM official_provenance_private.artifact_v2(a) LOOP
   count_edges:=count_edges+1;PERFORM official_provenance_private.require(count_edges<=1024);
   queue:=queue||pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('pin',edge.pin,'type',edge.expected_type));
  END LOOP;
 END LOOP;
 RETURN result;
END $$;

CREATE FUNCTION official_refresh_reference_r5.verify_retained_v2(fingerprint text) RETURNS void
LANGUAGE plpgsql STABLE SET search_path = '' SET timezone='UTC' AS $$
DECLARE receipt_bytes bytea; binding_bytes bytea; a official_provenance_api.artifact_input_v1; closure official_provenance_api.artifact_input_v1[]; root record; edge record; expected integer;
BEGIN
 SELECT r.canonical_payload_bytes,b.canonical_bytes INTO receipt_bytes,binding_bytes FROM official_provenance_private.receipts r JOIN official_provenance_private.custody_bindings k USING(record_fingerprint) JOIN official_provenance_private.artifact_blobs b ON b.digest=k.binding_digest WHERE r.record_fingerprint=fingerprint;
 PERFORM official_provenance_private.require((SELECT r.storage_contract_version=2 FROM official_provenance_private.receipts r WHERE r.record_fingerprint=fingerprint));
 IF receipt_bytes IS NULL OR binding_bytes IS NULL THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
 PERFORM official_provenance_private.require((SELECT k.binding_schema_version=1 AND pg_catalog.encode(pg_catalog.sha256(binding_bytes),'hex')=k.binding_digest FROM official_provenance_private.custody_bindings k WHERE k.record_fingerprint=fingerprint));
 closure:=official_refresh_reference_r5.closure_v2(fingerprint);
 PERFORM official_refresh_reference_r5.validate_bundle_v2('ot-integrated-pilot-local-closure-v2',fingerprint,receipt_bytes,binding_bytes,closure);
 SELECT pg_catalog.count(*) INTO expected FROM official_provenance_private.receipt_roots(official_provenance_private.decode(receipt_bytes,262144));
 IF (SELECT pg_catalog.count(*) FROM official_provenance_private.receipt_dependencies WHERE record_fingerprint=fingerprint)<>expected THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
 FOR root IN SELECT * FROM official_provenance_private.receipt_roots(official_provenance_private.decode(receipt_bytes,262144)) LOOP
  IF NOT EXISTS(SELECT 1 FROM official_provenance_private.receipt_dependencies e WHERE e.record_fingerprint=fingerprint AND e.root_slot=root.slot AND e.target_id=root.pin->>'id' AND e.target_version=(root.pin->>'version')::bigint AND e.target_digest=root.pin->>'digest') THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
 END LOOP;
 IF (SELECT pg_catalog.count(*) FROM official_provenance_private.custody_dependencies WHERE record_fingerprint=fingerprint)<>3 THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
 FOR root IN SELECT * FROM official_provenance_private.binding_roots(official_provenance_private.decode(binding_bytes,4096),fingerprint) LOOP
  IF NOT EXISTS(SELECT 1 FROM official_provenance_private.custody_dependencies e WHERE e.record_fingerprint=fingerprint AND e.binding_slot=root.slot AND e.target_id=root.pin->>'id' AND e.target_version=(root.pin->>'version')::bigint AND e.target_digest=root.pin->>'digest') THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
 END LOOP;
 FOREACH a IN ARRAY closure LOOP
  SELECT pg_catalog.count(*) INTO expected FROM official_provenance_private.artifact_v2(a);
  IF (SELECT pg_catalog.count(*) FROM official_provenance_private.artifact_dependencies e WHERE (e.parent_id,e.parent_version,e.parent_digest)=(a.artifact_id,a.artifact_version,a.digest))<>expected THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
  FOR edge IN SELECT * FROM official_provenance_private.artifact_v2(a) LOOP
   IF NOT EXISTS(SELECT 1 FROM official_provenance_private.artifact_dependencies e WHERE (e.parent_id,e.parent_version,e.parent_digest)=(a.artifact_id,a.artifact_version,a.digest) AND e.slot=edge.slot AND e.target_id=edge.pin->>'id' AND e.target_version=(edge.pin->>'version')::bigint AND e.target_digest=edge.pin->>'digest') THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
  END LOOP;
 END LOOP;
END $$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA official_refresh_reference_r5 FROM PUBLIC;
COMMIT;
