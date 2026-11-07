-- UNAPPLIED, native-local fictional corpus only. TASK V1 + TL amendment R1.
-- No canonical migration/apply entry. Existing publication/lifecycle are reused.
BEGIN;
DO $$
DECLARE owner_ oid; row_ record;
BEGIN
 SELECT p.proowner INTO STRICT owner_ FROM pg_catalog.pg_proc p
 WHERE p.oid='official_original_api.read_candidate(text,text,bigint,text)'::pg_catalog.regprocedure AND p.prosecdef;
 IF pg_catalog.pg_get_userbyid(owner_)<>CURRENT_USER THEN RAISE EXCEPTION 'refresh_install_owner' USING ERRCODE='42501'; END IF;
 FOR row_ IN SELECT p.proowner,p.prosecdef FROM pg_catalog.pg_proc p WHERE p.oid IN (
  'official_original_api.bind_candidate(text,uuid,bytea[],text,bigint,text,text)'::pg_catalog.regprocedure,
  'official_original_api.lifecycle(text,text,bigint,text)'::pg_catalog.regprocedure,
  'official_original_api.lookup_current_version(text,bigint,text,bytea,text,text,bigint,text)'::pg_catalog.regprocedure,
  'official_original_api.read_projection_candidate(text,text,bigint,text)'::pg_catalog.regprocedure) LOOP
  IF row_.proowner<>owner_ OR NOT row_.prosecdef THEN RAISE EXCEPTION 'refresh_install_owner' USING ERRCODE='42501'; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='ot_original_refresh')
  OR pg_catalog.to_regclass('official_original_private.refresh_transitions_v1') IS NOT NULL
  OR pg_catalog.to_regprocedure('official_original_api.refresh_version_v1(text,text,text,uuid,text,bigint,text,bytea,bytea,official_provenance_api.artifact_input_v1[],bytea[])') IS NOT NULL THEN
  RAISE EXCEPTION 'refresh_package_already_exists' USING ERRCODE='42723';
 END IF;
END $$;

CREATE ROLE ot_original_refresh NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT;
CREATE TABLE official_original_private.refresh_transitions_v1 (
 predecessor text PRIMARY KEY REFERENCES official_original_private.rule_bindings(fingerprint),
 successor text NOT NULL UNIQUE REFERENCES official_original_private.rule_bindings(fingerprint),
 successor_review uuid NOT NULL UNIQUE REFERENCES official_original_private.reviews(review_id),
 mode text NOT NULL CHECK(mode IN ('primary','composed')),
 before_sequence bigint NOT NULL REFERENCES official_original_private.events(sequence),
 before_hash text NOT NULL CHECK(before_hash ~ '^[a-f0-9]{64}$'),
 accepted_sequence bigint NOT NULL UNIQUE REFERENCES official_original_private.events(sequence),
 accepted_hash text NOT NULL CHECK(accepted_hash ~ '^[a-f0-9]{64}$'),
 after_sequence bigint NOT NULL UNIQUE REFERENCES official_original_private.events(sequence),
 after_hash text NOT NULL CHECK(after_hash ~ '^[a-f0-9]{64}$'),
 checked_at timestamptz NOT NULL CHECK(pg_catalog.isfinite(checked_at)),
 CHECK(predecessor<>successor AND accepted_sequence=before_sequence+1 AND after_sequence=before_sequence+2)
);
ALTER TABLE official_original_private.refresh_transitions_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_original_private.refresh_transitions_v1 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE official_original_private.refresh_transitions_v1 FROM PUBLIC,anon,authenticated,service_role,ot_original_refresh;
CREATE TRIGGER refresh_transition_immutable BEFORE UPDATE OR DELETE ON official_original_private.refresh_transitions_v1
 FOR EACH ROW EXECUTE FUNCTION official_original_private.immutable();
CREATE TRIGGER refresh_transition_no_truncate BEFORE TRUNCATE ON official_original_private.refresh_transitions_v1
 FOR EACH STATEMENT EXECUTE FUNCTION official_original_private.immutable();

CREATE FUNCTION official_original_api.refresh_version_v1(
 mode_ text,predecessor_ text,successor_ text,review_ uuid,key_ text,sequence_ bigint,hash_ text,
 receipt_ bytea,binding_ bytea,artifacts_ official_provenance_api.artifact_input_v1[],bodies_ bytea[]
) RETURNS TABLE(predecessor text,successor text,after_sequence bigint,after_hash text,started_at timestamptz,
 valid_until timestamptz,observed_at timestamptz,phase_ms jsonb,
 production_accepted_read text,positive_real_visa_cells integer)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' SET timezone='UTC' SET jit=off AS $$
DECLARE
 -- Generated solely from the frozen current corpus and #1151 contract. The
 -- unit conformance assertion requires exact equality with that code. This is
 -- an exact finite allowlist, never caller-supplied current/authority metadata.
 fixed_ CONSTANT jsonb := $fixed${"contracts":[{"mode":"primary","definition":{"id":"pilot-primary-global-cell","version":1,"scope":{"destinationCountryCode":"GB","transitCountryCode":null,"citizenship":{"mode":"required","countryCodes":["CH"]},"credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"residence":{"mode":"not_applicable"},"requirementType":"visa","validity":{"mode":"not_applicable"}}},"request":{"definition":{"id":"pilot-primary-global-cell","version":1,"digest":"d9a43ced76f9a2d6d3c63bcef0d2939e5727254178ade50535bacd5dfac7a9d0"},"scope":{"destinationCountryCode":"GB","transitCountryCode":null,"citizenship":{"mode":"required","countryCodes":["CH"]},"credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"residence":{"mode":"not_applicable"},"requirementType":"visa","validity":{"mode":"not_applicable"}},"factKind":"requirement_effect","requirementType":"visa"},"quality":"explicit_primary_statement","items":["primary_rule"]},{"mode":"composed","definition":{"id":"pilot-composed-global-cell","version":1,"scope":{"destinationCountryCode":"GB","transitCountryCode":null,"citizenship":{"mode":"required","countryCodes":["CH"]},"credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"residence":{"mode":"not_applicable"},"requirementType":"visa","validity":{"mode":"not_applicable"}}},"request":{"definition":{"id":"pilot-composed-global-cell","version":1,"digest":"ce85600ecc441a3f808fcf20ab7529f6bab5b12ae933c816e49e4847cca56172"},"scope":{"destinationCountryCode":"GB","transitCountryCode":null,"citizenship":{"mode":"required","countryCodes":["CH"]},"credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"residence":{"mode":"not_applicable"},"requirementType":"visa","validity":{"mode":"not_applicable"}},"factKind":"requirement_effect","requirementType":"visa"},"quality":"composed_from_multiple_primary_sources","items":["composed_effect","composed_mode"]}],"registry":{"sources":[{"sourceId":"synthetic-pilot-authority","sourceClass":"official_authority","publisherName":"Synthetic conformance authority","authorityName":"Synthetic conformance authority","domains":["regulations.example"]}],"blockedDomains":[],"contentIdentity":{"authorityRegistry":{"sources":[{"sourceId":"synthetic-pilot-authority","sourceClass":"official_authority","publisherName":"Synthetic conformance authority","authorityName":"Synthetic conformance authority","domains":["regulations.example"]}],"blockedDomains":[]},"items":[{"sourceId":"synthetic-pilot-authority","contentItemId":"composed_effect","contentItemVersion":1,"current":true,"externalIdNamespace":"synthetic-publication","externalContentId":"composed_effect","expectedPublisherIds":["synthetic-publisher"],"expectedAuthorityIds":["synthetic-authority"]},{"sourceId":"synthetic-pilot-authority","contentItemId":"composed_mode","contentItemVersion":1,"current":true,"externalIdNamespace":"synthetic-publication","externalContentId":"composed_mode","expectedPublisherIds":["synthetic-publisher"],"expectedAuthorityIds":["synthetic-authority"]},{"sourceId":"synthetic-pilot-authority","contentItemId":"primary_rule","contentItemVersion":1,"current":true,"externalIdNamespace":"synthetic-publication","externalContentId":"primary_rule","expectedPublisherIds":["synthetic-publisher"],"expectedAuthorityIds":["synthetic-authority"]}],"representations":[{"sourceId":"synthetic-pilot-authority","contentItemId":"composed_effect","representationId":"json","contentItemVersion":1,"representationVersion":1,"current":true,"requestUrls":["https://regulations.example/another-start/composed_effect","https://regulations.example/start/composed_effect"],"expectedFinalUrl":"https://regulations.example/rules/composed_effect","expectedMediaType":"application/json","identityProfileId":"synthetic-pilot-whole-response","identityProfileVersion":1,"expectedLocale":null,"expectedSchema":"synthetic-public-regulation-v1"},{"sourceId":"synthetic-pilot-authority","contentItemId":"composed_effect","representationId":"json-alternate","contentItemVersion":1,"representationVersion":1,"current":true,"requestUrls":["https://regulations.example/alternate-rules/composed_effect"],"expectedFinalUrl":"https://regulations.example/alternate-rules/composed_effect","expectedMediaType":"application/json","identityProfileId":"synthetic-pilot-whole-response","identityProfileVersion":1,"expectedLocale":null,"expectedSchema":"synthetic-public-regulation-v1"},{"sourceId":"synthetic-pilot-authority","contentItemId":"composed_mode","representationId":"json","contentItemVersion":1,"representationVersion":1,"current":true,"requestUrls":["https://regulations.example/another-start/composed_mode","https://regulations.example/start/composed_mode"],"expectedFinalUrl":"https://regulations.example/rules/composed_mode","expectedMediaType":"application/json","identityProfileId":"synthetic-pilot-whole-response","identityProfileVersion":1,"expectedLocale":null,"expectedSchema":"synthetic-public-regulation-v1"},{"sourceId":"synthetic-pilot-authority","contentItemId":"composed_mode","representationId":"json-alternate","contentItemVersion":1,"representationVersion":1,"current":true,"requestUrls":["https://regulations.example/alternate-rules/composed_mode"],"expectedFinalUrl":"https://regulations.example/alternate-rules/composed_mode","expectedMediaType":"application/json","identityProfileId":"synthetic-pilot-whole-response","identityProfileVersion":1,"expectedLocale":null,"expectedSchema":"synthetic-public-regulation-v1"},{"sourceId":"synthetic-pilot-authority","contentItemId":"primary_rule","representationId":"json","contentItemVersion":1,"representationVersion":1,"current":true,"requestUrls":["https://regulations.example/rules/primary_rule"],"expectedFinalUrl":"https://regulations.example/rules/primary_rule","expectedMediaType":"application/json","identityProfileId":"synthetic-pilot-whole-response","identityProfileVersion":1,"expectedLocale":null,"expectedSchema":"synthetic-public-regulation-v1"},{"sourceId":"synthetic-pilot-authority","contentItemId":"primary_rule","representationId":"json-alternate","contentItemVersion":1,"representationVersion":1,"current":true,"requestUrls":["https://regulations.example/alternate-rules/primary_rule"],"expectedFinalUrl":"https://regulations.example/alternate-rules/primary_rule","expectedMediaType":"application/json","identityProfileId":"synthetic-pilot-whole-response","identityProfileVersion":1,"expectedLocale":null,"expectedSchema":"synthetic-public-regulation-v1"}],"profiles":[{"identityProfileId":"synthetic-pilot-whole-response","identityProfileVersion":1,"current":true}]}},"extractors":[{"extractorId":"otx_integrated_composed","extractorVersion":1,"factKind":"requirement_effect","sourceFamilyId":"otf_integrated_pilot","contentItemRefs":[{"sourceId":"synthetic-pilot-authority","contentItemId":"composed_effect"},{"sourceId":"synthetic-pilot-authority","contentItemId":"composed_mode"}],"representations":[{"sourceId":"synthetic-pilot-authority","contentItemId":"composed_effect","contentItemVersion":1,"representationId":"json","representationVersion":1,"identityProfileId":"synthetic-pilot-whole-response","identityProfileVersion":1},{"sourceId":"synthetic-pilot-authority","contentItemId":"composed_mode","contentItemVersion":1,"representationId":"json","representationVersion":1,"identityProfileId":"synthetic-pilot-whole-response","identityProfileVersion":1}],"urlAllowlist":[{"kind":"exact","canonicalUrl":"https://regulations.example/rules/composed_effect"},{"kind":"exact","canonicalUrl":"https://regulations.example/rules/composed_mode"}],"contentTypes":["application/json"],"schemaFamily":"ots_integrated_pilot","policyId":"otp_integrated_pilot","policyVersion":1,"requiredFieldPaths":["effect","visaMode"]},{"extractorId":"otx_integrated_primary","extractorVersion":1,"factKind":"requirement_effect","sourceFamilyId":"otf_integrated_pilot","contentItemRefs":[{"sourceId":"synthetic-pilot-authority","contentItemId":"primary_rule"}],"representations":[{"sourceId":"synthetic-pilot-authority","contentItemId":"primary_rule","contentItemVersion":1,"representationId":"json","representationVersion":1,"identityProfileId":"synthetic-pilot-whole-response","identityProfileVersion":1}],"urlAllowlist":[{"kind":"exact","canonicalUrl":"https://regulations.example/rules/primary_rule"}],"contentTypes":["application/json"],"schemaFamily":"ots_integrated_pilot","policyId":null,"policyVersion":null,"requiredFieldPaths":[]}],"policy":{"policyId":"otp_integrated_pilot","policyVersion":1,"factKind":"requirement_effect","requirementType":"visa","contentItemRefs":[{"sourceId":"synthetic-pilot-authority","contentItemId":"composed_effect"},{"sourceId":"synthetic-pilot-authority","contentItemId":"composed_mode"}],"sourceFamilyId":"otf_integrated_pilot","schemaFamily":"ots_integrated_pilot","applicabilitySchema":null,"completeness":"joint_complete_fact","assignments":[{"target":{"kind":"fact_field","fieldPath":"effect"},"contentItemRefs":[{"sourceId":"synthetic-pilot-authority","contentItemId":"composed_effect"}],"relation":"single_content_item","role":"complementary_part"},{"target":{"kind":"fact_field","fieldPath":"visaMode"},"contentItemRefs":[{"sourceId":"synthetic-pilot-authority","contentItemId":"composed_mode"}],"relation":"single_content_item","role":"complementary_part"}]},"bodies":{"primary_rule":"{\"effect\":\"required\",\"publication\":\"primary_rule\",\"schema\":\"synthetic-public-regulation-v1\",\"validity\":{\"from\":\"2026-10-01\",\"until\":null},\"visaMode\":\"electronic_visa\"}","composed_effect":"{\"effect\":\"required\",\"publication\":\"composed_effect\",\"schema\":\"synthetic-public-regulation-v1\",\"validity\":{\"from\":null,\"until\":null}}","composed_mode":"{\"publication\":\"composed_mode\",\"schema\":\"synthetic-public-regulation-v1\",\"validity\":{\"from\":null,\"until\":null},\"visaMode\":\"electronic_visa\"}"},"scopeCanonical":"{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"GB\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}","ruleScopeKey":"rule-scope:v1:c12eb99f9309bf6c043a32b0df87e0734b85c600f708cbd0d53fcbcf78efa78d","validity":{"primary_rule":{"validFrom":"2026-10-01","validUntil":null,"validFromBasis":{"kind":"qualified_locator","locator":{"kind":"json_pointer","pointer":"/validity/from"},"value":"2026-10-01"},"validUntilBasis":{"kind":"no_bound_asserted"}},"composed_effect":{"validFrom":null,"validUntil":null,"validFromBasis":{"kind":"no_bound_asserted"},"validUntilBasis":{"kind":"no_bound_asserted"}},"composed_mode":{"validFrom":null,"validUntil":null,"validFromBasis":{"kind":"no_bound_asserted"},"validUntilBasis":{"kind":"no_bound_asserted"}}}}$fixed$::jsonb;
 contract_ jsonb; old_ jsonb; new_ jsonb; old_support_ jsonb; new_support_ jsonb;
 old_review_ official_original_private.reviews; new_review_ official_original_private.reviews;
 h_ official_original_private.head; e_ official_original_private.events;
 found_ record; material_ record; descriptor_ jsonb; registry_ jsonb;
 pin_ jsonb; expected_ jsonb; item_ text; n_ integer; i_ integer; j_ integer; count_ integer; seen_items_ text[]:='{}';
 own_hash_ text; final_hash_ text; started_ timestamptz:=pg_catalog.clock_timestamp();
 phase_ timestamptz:=started_; elapsed_ jsonb:='{}'; bound_ timestamptz;
 old_material_ bytea[]:='{}'; old_pins_ uuid[]:='{}'; old_versions_ text[]:='{}';
 old_digests_ text[]:='{}'; canonical_bound_ timestamptz;
 closure_ official_provenance_api.artifact_input_v1[]; binding_value_ jsonb; manifest_ jsonb; custody_ jsonb;
 validity_ jsonb; version_payload_ jsonb; version_fingerprint_ text; version_index_ integer;
BEGIN
 IF mode_ IS NULL OR mode_ NOT IN ('primary','composed') OR predecessor_ IS NULL OR successor_ IS NULL
  OR predecessor_ !~ '^ot-provenance-v1:[a-f0-9]{64}$' OR successor_ !~ '^ot-provenance-v1:[a-f0-9]{64}$'
  OR predecessor_=successor_ OR review_ IS NULL OR key_ IS NULL OR sequence_ IS NULL OR sequence_ NOT BETWEEN 1 AND 99998
  OR hash_ IS NULL OR hash_ !~ '^[a-f0-9]{64}$' OR receipt_ IS NULL OR binding_ IS NULL OR artifacts_ IS NULL
  OR bodies_ IS NULL OR pg_catalog.array_ndims(bodies_)<>1 OR pg_catalog.array_lower(bodies_,1)<>1
  OR pg_catalog.array_position(bodies_,NULL) IS NOT NULL
  OR pg_catalog.current_setting('transaction_isolation')<>'read committed' THEN
  RAISE EXCEPTION 'refresh_input' USING ERRCODE='22023';
 END IF;
 contract_:=fixed_->'contracts'->(CASE WHEN mode_='primary' THEN 0 ELSE 1 END);
 n_:=pg_catalog.jsonb_array_length(contract_->'items');
 IF pg_catalog.cardinality(bodies_)<>n_ THEN RAISE EXCEPTION 'refresh_support_count' USING ERRCODE='22023'; END IF;

 -- This unchanged operation takes provenance publication locks BEFORE the
 -- lifecycle head. All its provisional writes share our caller transaction.
 PERFORM official_provenance_api.publish_local_integrated_v2('ot-integrated-pilot-local-closure-v2',2::smallint,
  'create_or_verify',successor_,receipt_,binding_,artifacts_);
 elapsed_:=elapsed_||pg_catalog.jsonb_build_object('publish',1000*EXTRACT(epoch FROM pg_catalog.clock_timestamp()-phase_)); phase_:=pg_catalog.clock_timestamp();
 SELECT h.* INTO STRICT h_ FROM official_original_private.head h WHERE h.singleton FOR UPDATE;
 elapsed_:=elapsed_||pg_catalog.jsonb_build_object('head_wait',1000*EXTRACT(epoch FROM pg_catalog.clock_timestamp()-phase_)); phase_:=pg_catalog.clock_timestamp();
 -- Never obtain/replace the external witness using the DB cursor after a wait.
 PERFORM official_original_private.check_head(sequence_,hash_);
 bound_:=h_.checked_at+interval '60 seconds';
 SELECT l.* INTO STRICT found_ FROM official_original_api.lookup_current_version(
  contract_#>>'{request,definition,id}',(contract_#>>'{request,definition,version}')::bigint,
  contract_#>>'{request,definition,digest}',pg_catalog.convert_to(fixed_->>'scopeCanonical','UTF8'),
  'requirement_effect','visa',sequence_,hash_) l;
 IF found_.outcome IS DISTINCT FROM 'unique' OR found_.record_fingerprint IS DISTINCT FROM predecessor_
  OR found_.match_count IS DISTINCT FROM 1 OR found_.production_accepted_read IS DISTINCT FROM 'NOT_AUTHORIZED'
  OR found_.positive_visa_cells IS DISTINCT FROM 0 THEN RAISE EXCEPTION 'refresh_predecessor_selection' USING ERRCODE='55000'; END IF;
 elapsed_:=elapsed_||pg_catalog.jsonb_build_object('old_lookup',1000*EXTRACT(epoch FROM pg_catalog.clock_timestamp()-phase_)); phase_:=pg_catalog.clock_timestamp();
 IF EXISTS(SELECT 1 FROM official_original_private.rule_bindings b WHERE b.fingerprint=successor_)
  OR EXISTS(SELECT 1 FROM official_original_private.refresh_transitions_v1 t WHERE t.predecessor=predecessor_ OR t.successor=successor_) THEN
  RAISE EXCEPTION 'refresh_already_transitioned' USING ERRCODE='55000';
 END IF;
 SELECT pg_catalog.convert_from(r.canonical_payload_bytes,'UTF8')::jsonb INTO STRICT old_
  FROM official_provenance_private.receipts r WHERE r.record_fingerprint=predecessor_;
 SELECT pg_catalog.convert_from(r.canonical_payload_bytes,'UTF8')::jsonb INTO STRICT new_
  FROM official_provenance_private.receipts r WHERE r.record_fingerprint=successor_;
 SELECT r.* INTO STRICT old_review_ FROM official_original_private.rule_bindings b
  JOIN official_original_private.reviews r ON r.review_id=b.review_id AND r.fingerprint=b.fingerprint WHERE b.fingerprint=predecessor_;
 SELECT r.* INTO STRICT new_review_ FROM official_original_private.reviews r WHERE r.review_id=review_ AND r.fingerprint=successor_;
 IF old_review_.review_id=new_review_.review_id OR old_review_.packet_key=new_review_.packet_key
  OR new_review_.packet_key IS DISTINCT FROM new_#>>'{proof,reviewPacketKey}'
  OR new_review_.reviewed_at>pg_catalog.clock_timestamp()
  OR new_review_.reviewed_at<(new_#>>'{proof,serverReferenceTime}')::timestamptz THEN
  RAISE EXCEPTION 'refresh_separate_review' USING ERRCODE='23514';
 END IF;

 -- Compare exact identities, removing only the specifically changing hashes
 -- and observation times. No caller may choose a different fictional cell.
 IF old_->'globalCell' IS DISTINCT FROM new_->'globalCell'
  OR new_#>'{globalCell,definition}' IS DISTINCT FROM contract_#>'{request,definition}'
  OR new_#>'{globalCell,scope}' IS DISTINCT FROM contract_#>'{request,scope}'
  OR new_#>>'{globalCell,ruleScopeKey}' IS DISTINCT FROM fixed_->>'ruleScopeKey'
  OR new_->'evidenceQuality' IS DISTINCT FROM contract_->'quality' OR old_->'evidenceQuality' IS DISTINCT FROM new_->'evidenceQuality'
  OR new_#>'{candidate,fact}' IS DISTINCT FROM '{"kind":"requirement_effect","effect":"required","visaMode":"electronic_visa"}'::jsonb
  OR new_#>>'{candidate,factKind}' IS DISTINCT FROM 'requirement_effect' OR new_#>>'{candidate,requirementType}' IS DISTINCT FROM 'visa'
  OR new_#>'{candidate,applicabilitySchema}' IS DISTINCT FROM 'null'::jsonb
  OR (old_->'candidate')-'candidateBinding' IS DISTINCT FROM (new_->'candidate')-'candidateBinding'
  OR old_#>>'{candidate,candidateBinding}'=new_#>>'{candidate,candidateBinding}'
  OR (old_->'extractor')-'selectionKey' IS DISTINCT FROM (new_->'extractor')-'selectionKey'
  OR (CASE WHEN old_->'policy'='null'::jsonb THEN 'null'::jsonb ELSE (old_->'policy')-ARRAY['preHttpSelectionKey','resultIdentity'] END)
   IS DISTINCT FROM (CASE WHEN new_->'policy'='null'::jsonb THEN 'null'::jsonb ELSE (new_->'policy')-ARRAY['preHttpSelectionKey','resultIdentity'] END)
  OR (old_->'proof')-ARRAY['reviewPacketKey','proofIdentity','serverReferenceTime'] IS DISTINCT FROM (new_->'proof')-ARRAY['reviewPacketKey','proofIdentity','serverReferenceTime']
  OR new_#>>'{proof,reviewPacketKey}'=old_#>>'{proof,reviewPacketKey}' OR new_#>>'{proof,proofIdentity}'=old_#>>'{proof,proofIdentity}'
  OR (new_#>>'{proof,serverReferenceTime}')::timestamptz<=(old_#>>'{proof,serverReferenceTime}')::timestamptz
  OR (new_#>>'{proof,serverReferenceTime}')::timestamptz>pg_catalog.clock_timestamp()
  OR pg_catalog.jsonb_array_length(old_->'supports')<>n_ OR pg_catalog.jsonb_array_length(new_->'supports')<>n_ THEN
  RAISE EXCEPTION 'refresh_identity_or_fact' USING ERRCODE='23514';
 END IF;
 pin_:=new_#>'{proof,catalogSnapshot}';
 SELECT pg_catalog.convert_from(b.canonical_bytes,'UTF8')::jsonb->'content' INTO STRICT registry_
  FROM official_provenance_private.artifacts a JOIN official_provenance_private.artifact_blobs b USING(digest)
  WHERE (a.artifact_id,a.artifact_version,a.digest)=(pin_->>'id',(pin_->>'version')::bigint,pin_->>'digest') AND a.artifact_type='catalog_snapshot';
 IF registry_->'registry' IS DISTINCT FROM fixed_->'registry'
  OR pg_catalog.jsonb_array_length(registry_->'profiles')<>1
  OR registry_#>>'{profiles,0,identityProfileId}' IS DISTINCT FROM 'synthetic-pilot-whole-response'
  OR registry_#>'{profiles,0,identityProfileVersion}' IS DISTINCT FROM '1'::jsonb THEN
  RAISE EXCEPTION 'refresh_fixed_catalog' USING ERRCODE='23514';
 END IF;
 pin_:=new_#>'{extractor,registrySnapshot}';
 SELECT pg_catalog.convert_from(b.canonical_bytes,'UTF8')::jsonb->'content' INTO STRICT registry_
  FROM official_provenance_private.artifacts a JOIN official_provenance_private.artifact_blobs b USING(digest)
  WHERE (a.artifact_id,a.artifact_version,a.digest)=(pin_->>'id',(pin_->>'version')::bigint,pin_->>'digest') AND a.artifact_type='extractor_registry';
 IF pg_catalog.jsonb_array_length(registry_->'definitions')<>2 THEN RAISE EXCEPTION 'refresh_fixed_extractors' USING ERRCODE='23514'; END IF;
 FOR i_ IN 0..1 LOOP
  expected_:=fixed_->'extractors'->i_; pin_:=registry_#>ARRAY['definitions',i_::text,'definition'];
  IF registry_#>>ARRAY['definitions',i_::text,'id'] IS DISTINCT FROM expected_->>'extractorId'
   OR registry_#>ARRAY['definitions',i_::text,'version'] IS DISTINCT FROM '1'::jsonb
   OR registry_#>ARRAY['definitions',i_::text,'current'] IS DISTINCT FROM 'true'::jsonb THEN
   RAISE EXCEPTION 'refresh_fixed_extractors' USING ERRCODE='23514';
  END IF;
  SELECT pg_catalog.convert_from(b.canonical_bytes,'UTF8')::jsonb#>'{content,descriptor}' INTO STRICT descriptor_
   FROM official_provenance_private.artifacts a JOIN official_provenance_private.artifact_blobs b USING(digest)
   WHERE (a.artifact_id,a.artifact_version,a.digest)=(pin_->>'id',(pin_->>'version')::bigint,pin_->>'digest') AND a.artifact_type='extractor_definition';
  IF descriptor_ IS DISTINCT FROM expected_ THEN RAISE EXCEPTION 'refresh_fixed_extractor_descriptor' USING ERRCODE='23514'; END IF;
 END LOOP;
 IF new_#>>'{extractor,extractorId}' IS DISTINCT FROM 'otx_integrated_'||mode_
  OR new_#>'{extractor,extractorVersion}' IS DISTINCT FROM '1'::jsonb THEN RAISE EXCEPTION 'refresh_selected_extractor' USING ERRCODE='23514'; END IF;
 IF mode_='primary' THEN
  IF new_->'policy' IS DISTINCT FROM 'null'::jsonb THEN RAISE EXCEPTION 'refresh_primary_policy' USING ERRCODE='23514'; END IF;
 ELSE
  pin_:=new_#>'{policy,definition}';
  SELECT pg_catalog.convert_from(b.canonical_bytes,'UTF8')::jsonb#>'{content,descriptor}' INTO STRICT descriptor_
   FROM official_provenance_private.artifacts a JOIN official_provenance_private.artifact_blobs b USING(digest)
   WHERE (a.artifact_id,a.artifact_version,a.digest)=(pin_->>'id',(pin_->>'version')::bigint,pin_->>'digest') AND a.artifact_type='policy_definition';
  IF descriptor_ IS DISTINCT FROM fixed_->'policy' THEN RAISE EXCEPTION 'refresh_fixed_policy' USING ERRCODE='23514'; END IF;
  pin_:=new_#>'{policy,registrySnapshot}';
  SELECT pg_catalog.convert_from(b.canonical_bytes,'UTF8')::jsonb->'content' INTO STRICT registry_
   FROM official_provenance_private.artifacts a JOIN official_provenance_private.artifact_blobs b USING(digest)
   WHERE (a.artifact_id,a.artifact_version,a.digest)=(pin_->>'id',(pin_->>'version')::bigint,pin_->>'digest') AND a.artifact_type='policy_registry';
  IF registry_->'definitions' IS DISTINCT FROM pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
    'id','otp_integrated_pilot','version',1,'current',true,'definition',new_#>'{policy,definition}')) THEN
   RAISE EXCEPTION 'refresh_fixed_policy_registry' USING ERRCODE='23514';
  END IF;
 END IF;
 -- Full historical closure alone intentionally cannot prove a JSON locator
 -- against raw bytes. Both retained versions must additionally match the exact
 -- existing derivePilotValidity result for their closed qualified raw body.
 -- This reuses the existing custody traversal; no second parser/extractor.
 FOR version_index_ IN 0..1 LOOP
  version_payload_:=CASE WHEN version_index_=0 THEN old_ ELSE new_ END;
  version_fingerprint_:=CASE WHEN version_index_=0 THEN predecessor_ ELSE successor_ END;
  closure_:=official_provenance_private.closure_v2(version_fingerprint_);
  SELECT pg_catalog.convert_from(b.canonical_bytes,'UTF8')::jsonb->'value' INTO STRICT binding_value_
   FROM official_provenance_private.custody_bindings k JOIN official_provenance_private.artifact_blobs b ON b.digest=k.binding_digest
   WHERE k.record_fingerprint=version_fingerprint_;
  manifest_:=official_provenance_private.content_v2(closure_,binding_value_->'selectedSupportManifest','SelectedSupportManifestV1');
  IF pg_catalog.jsonb_array_length(manifest_->'supports')<>n_ THEN RAISE EXCEPTION 'refresh_qualified_manifest' USING ERRCODE='23514'; END IF;
  FOR i_ IN 0..n_-1 LOOP
   custody_:=official_provenance_private.content_v2(closure_,manifest_#>ARRAY['supports',i_::text,'custody'],'AcceptedEvidenceCustodyV1');
   validity_:=official_provenance_private.content_v2(closure_,custody_->'validityOrigin','validity_origin');
   item_:=custody_#>>'{evidenceIdentity,contentItemId}'; expected_:=fixed_#>ARRAY['validity',item_];
   IF expected_ IS NULL OR NOT ((contract_->'items') ? item_)
    OR custody_#>>'{evidenceIdentity,versionId}' IS DISTINCT FROM version_payload_#>>ARRAY['supports',i_::text,'versionId']
    OR pg_catalog.jsonb_build_object('validFrom',validity_->'validFrom','validUntil',validity_->'validUntil',
       'validFromBasis',validity_->'validFromBasis','validUntilBasis',validity_->'validUntilBasis') IS DISTINCT FROM expected_
    OR version_payload_#>ARRAY['supports',i_::text,'validFrom'] IS DISTINCT FROM expected_->'validFrom'
    OR version_payload_#>ARRAY['supports',i_::text,'validUntil'] IS DISTINCT FROM expected_->'validUntil' THEN
    RAISE EXCEPTION 'refresh_qualified_validity_origin' USING ERRCODE='23514';
   END IF;
  END LOOP;
 END LOOP;
 count_:=0;
 FOR material_ IN SELECT p.* FROM official_original_api.read_projection_candidate(predecessor_,key_,sequence_,hash_) p ORDER BY p.ordinal LOOP
  i_:=material_.ordinal; old_support_:=old_->'supports'->i_; item_:=old_support_#>>'{binding,contentItemId}';
  -- R2: retain each immutable version-ID order; compare a unique full binding
  -- bijection. New hashes may naturally put the same slots at other indices.
  SELECT x.value,(x.ordinality-1)::integer INTO STRICT new_support_,j_
   FROM pg_catalog.jsonb_array_elements(new_->'supports') WITH ORDINALITY x(value,ordinality)
   WHERE x.value->'binding'=old_support_->'binding';
  IF i_<>count_ OR i_>=n_ OR item_ IS NULL OR NOT ((contract_->'items') ? item_) OR item_=ANY(seen_items_)
   OR old_support_->>'versionId' IS DISTINCT FROM material_.evidence_version
   OR (old_support_)-ARRAY['versionId','acceptedRetrievedAt','freshRetrieval'] IS DISTINCT FROM (new_support_)-ARRAY['versionId','acceptedRetrievedAt','freshRetrieval']
   OR old_support_->>'versionId'=new_support_->>'versionId'
   OR old_support_ ? 'sourceFingerprintProtocol' OR new_support_ ? 'sourceFingerprintProtocol'
   OR old_support_->>'canonicalFinalUrl' IS DISTINCT FROM 'https://regulations.example/rules/'||item_
   OR old_support_->>'contentType' IS DISTINCT FROM 'application/json'
   OR old_support_->'binding' IS DISTINCT FROM pg_catalog.jsonb_build_object('sourceId','synthetic-pilot-authority','contentItemId',item_,
      'contentItemVersion',1,'representationId','json','representationVersion',1,'identityProfileId','synthetic-pilot-whole-response','identityProfileVersion',1)
   OR old_support_#>>'{freshRetrieval,requestUrl}' IS DISTINCT FROM new_support_#>>'{freshRetrieval,requestUrl}'
   OR (new_support_->>'acceptedRetrievedAt')::timestamptz<=(old_support_->>'acceptedRetrievedAt')::timestamptz
   OR (new_support_#>>'{freshRetrieval,completedAt}')::timestamptz<=(old_support_#>>'{freshRetrieval,completedAt}')::timestamptz
   OR (new_support_#>>'{freshRetrieval,completedAt}')::timestamptz>pg_catalog.clock_timestamp()
   OR bodies_[j_+1] IS DISTINCT FROM material_.original_bytes
   OR bodies_[j_+1] IS DISTINCT FROM pg_catalog.convert_to(fixed_#>>ARRAY['bodies',item_],'UTF8')
   OR EXISTS(SELECT 1 FROM official_original_private.originals o WHERE o.evidence_version=new_support_->>'versionId') THEN
   RAISE EXCEPTION 'refresh_unchanged_qualified_support' USING ERRCODE='23514';
  END IF;
  seen_items_:=pg_catalog.array_append(seen_items_,item_);
  old_material_:=pg_catalog.array_append(old_material_,material_.original_bytes); old_pins_:=pg_catalog.array_append(old_pins_,material_.original_pin);
  old_versions_:=pg_catalog.array_append(old_versions_,material_.evidence_version); old_digests_:=pg_catalog.array_append(old_digests_,material_.raw_digest);
  canonical_bound_:=(old_support_->>'acceptedRetrievedAt')::timestamptz+interval '1 hour';
  bound_:=LEAST(bound_,material_.expires_at,material_.freshness_until,material_.lifecycle_valid_until,canonical_bound_);
  IF pg_catalog.clock_timestamp()>=bound_ THEN RAISE EXCEPTION 'refresh_old_bound' USING ERRCODE='55000'; END IF;
  count_:=count_+1;
 END LOOP;
 IF count_<>n_ THEN RAISE EXCEPTION 'refresh_old_support_missing' USING ERRCODE='55000'; END IF;
 elapsed_:=elapsed_||pg_catalog.jsonb_build_object('old_reproof',1000*EXTRACT(epoch FROM pg_catalog.clock_timestamp()-phase_)); phase_:=pg_catalog.clock_timestamp();
 IF official_original_api.bind_candidate(successor_,review_,bodies_,key_,sequence_,hash_,'create_or_verify') IS DISTINCT FROM 'inserted' THEN
  RAISE EXCEPTION 'refresh_bind_not_new' USING ERRCODE='55000';
 END IF;
 -- Derive exactly OUR accepted event. A SELECT of an arbitrary current head
 -- can never replace the external CAS witness or forgive an intervening event.
 SELECT e.* INTO STRICT e_ FROM official_original_private.events e WHERE e.sequence=sequence_+1;
 own_hash_:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_array(sequence_+1,hash_,'accepted',successor_,e_.occurred_at)::text,'UTF8')),'hex');
 IF e_.prior_hash<>hash_ OR e_.kind<>'accepted' OR e_.target<>successor_ OR e_.event_hash<>own_hash_
  OR NOT EXISTS(SELECT 1 FROM official_original_private.head h WHERE h.singleton AND h.sequence=sequence_+1 AND h.event_hash=own_hash_) THEN
  RAISE EXCEPTION 'refresh_own_accept_event' USING ERRCODE='55000';
 END IF;
 elapsed_:=elapsed_||pg_catalog.jsonb_build_object('bind',1000*EXTRACT(epoch FROM pg_catalog.clock_timestamp()-phase_)); phase_:=pg_catalog.clock_timestamp();
 -- R1: two versions are temporarily accepted inside this uncommitted locked
 -- transaction. Re-prove Old fully, not an impossible unique-old lookup.
 count_:=0;
 FOR material_ IN SELECT p.* FROM official_original_api.read_projection_candidate(predecessor_,key_,sequence_+1,own_hash_) p ORDER BY p.ordinal LOOP
  i_:=material_.ordinal;
  IF i_<>count_ OR i_>=n_ OR material_.original_pin IS DISTINCT FROM old_pins_[i_+1]
   OR material_.evidence_version IS DISTINCT FROM old_versions_[i_+1] OR material_.raw_digest IS DISTINCT FROM old_digests_[i_+1]
   OR material_.original_bytes IS DISTINCT FROM old_material_[i_+1] THEN RAISE EXCEPTION 'refresh_old_changed' USING ERRCODE='55000'; END IF;
  bound_:=LEAST(bound_,material_.expires_at,material_.freshness_until); count_:=count_+1;
 END LOOP;
 IF count_<>n_ OR pg_catalog.clock_timestamp()>=bound_ THEN RAISE EXCEPTION 'refresh_old_bound' USING ERRCODE='55000'; END IF;
 elapsed_:=elapsed_||pg_catalog.jsonb_build_object('old_final_reproof',1000*EXTRACT(epoch FROM pg_catalog.clock_timestamp()-phase_)); phase_:=pg_catalog.clock_timestamp();
 PERFORM official_original_api.lifecycle('superseded',predecessor_,sequence_+1,own_hash_);
 SELECT e.* INTO STRICT e_ FROM official_original_private.events e WHERE e.sequence=sequence_+2;
 final_hash_:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_array(sequence_+2,own_hash_,'superseded',predecessor_,e_.occurred_at)::text,'UTF8')),'hex');
 IF e_.prior_hash<>own_hash_ OR e_.kind<>'superseded' OR e_.target<>predecessor_ OR e_.event_hash<>final_hash_
  OR NOT EXISTS(SELECT 1 FROM official_original_private.head h WHERE h.singleton AND h.sequence=sequence_+2 AND h.event_hash=final_hash_) THEN
  RAISE EXCEPTION 'refresh_own_supersede_event' USING ERRCODE='55000';
 END IF;
 elapsed_:=elapsed_||pg_catalog.jsonb_build_object('supersede',1000*EXTRACT(epoch FROM pg_catalog.clock_timestamp()-phase_)); phase_:=pg_catalog.clock_timestamp();
 SELECT l.* INTO STRICT found_ FROM official_original_api.lookup_current_version(
  contract_#>>'{request,definition,id}',(contract_#>>'{request,definition,version}')::bigint,
  contract_#>>'{request,definition,digest}',pg_catalog.convert_to(fixed_->>'scopeCanonical','UTF8'),
  'requirement_effect','visa',sequence_+2,final_hash_) l;
 IF found_.outcome IS DISTINCT FROM 'unique' OR found_.record_fingerprint IS DISTINCT FROM successor_
  OR found_.match_count IS DISTINCT FROM 1 OR found_.production_accepted_read IS DISTINCT FROM 'NOT_AUTHORIZED'
  OR found_.positive_visa_cells IS DISTINCT FROM 0 THEN RAISE EXCEPTION 'refresh_successor_selection' USING ERRCODE='55000'; END IF;
 elapsed_:=elapsed_||pg_catalog.jsonb_build_object('new_lookup',1000*EXTRACT(epoch FROM pg_catalog.clock_timestamp()-phase_)); phase_:=pg_catalog.clock_timestamp();
 count_:=0;
 FOR material_ IN SELECT p.* FROM official_original_api.read_projection_candidate(successor_,key_,sequence_+2,final_hash_) p ORDER BY p.ordinal LOOP
  i_:=material_.ordinal; new_support_:=new_->'supports'->i_;
  IF i_<>count_ OR i_>=n_ OR material_.original_bytes IS DISTINCT FROM bodies_[i_+1]
   OR material_.evidence_version IS DISTINCT FROM new_support_->>'versionId' THEN RAISE EXCEPTION 'refresh_new_changed' USING ERRCODE='55000'; END IF;
  bound_:=LEAST(bound_,material_.expires_at,material_.freshness_until,material_.lifecycle_valid_until,
   (new_support_->>'acceptedRetrievedAt')::timestamptz+interval '1 hour'); count_:=count_+1;
 END LOOP;
 observed_at:=pg_catalog.clock_timestamp();
 IF count_<>n_ OR NOT pg_catalog.isfinite(bound_) OR observed_at>=bound_ THEN RAISE EXCEPTION 'refresh_final_bound' USING ERRCODE='55000'; END IF;
 INSERT INTO official_original_private.refresh_transitions_v1 VALUES(predecessor_,successor_,review_,mode_,sequence_,hash_,sequence_+1,own_hash_,sequence_+2,final_hash_,observed_at);
 elapsed_:=elapsed_||pg_catalog.jsonb_build_object('new_reproof',1000*EXTRACT(epoch FROM pg_catalog.clock_timestamp()-phase_),
  'total',1000*EXTRACT(epoch FROM pg_catalog.clock_timestamp()-started_));
 predecessor:=predecessor_; successor:=successor_; after_sequence:=sequence_+2; after_hash:=final_hash_;
 started_at:=started_; valid_until:=bound_; phase_ms:=elapsed_; production_accepted_read:='NOT_AUTHORIZED'; positive_real_visa_cells:=0;
 RETURN NEXT;
END $$;

REVOKE ALL ON FUNCTION official_original_api.refresh_version_v1(text,text,text,uuid,text,bigint,text,bytea,bytea,official_provenance_api.artifact_input_v1[],bytea[]) FROM PUBLIC;
GRANT USAGE ON SCHEMA official_original_api,official_provenance_api TO ot_original_refresh;
GRANT USAGE ON TYPE official_provenance_api.artifact_input_v1 TO ot_original_refresh;
GRANT EXECUTE ON FUNCTION official_original_api.refresh_version_v1(text,text,text,uuid,text,bigint,text,bytea,bytea,official_provenance_api.artifact_input_v1[],bytea[]) TO ot_original_refresh;
COMMIT;
