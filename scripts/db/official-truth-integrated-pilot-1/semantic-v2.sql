-- Explicit LOCAL R1 successor. No hosted migration; frozen receipt/K codecs are unchanged.
BEGIN;
CREATE FUNCTION official_provenance_private.utf16_length(value text) RETURNS integer LANGUAGE sql IMMUTABLE STRICT SET search_path='' AS $$ SELECT CASE WHEN pg_catalog.octet_length(value)=pg_catalog.length(value) THEN pg_catalog.length(value) ELSE 2*pg_catalog.length(value)-pg_catalog.length(pg_catalog.regexp_replace(value,U&'[\+010000-\+10FFFF]','','g')) END $$;
CREATE FUNCTION official_provenance_private.require(value boolean) RETURNS void LANGUAGE plpgsql IMMUTABLE SET search_path='' SET timezone='UTC' AS $$ BEGIN IF value IS DISTINCT FROM true THEN RAISE EXCEPTION 'semantic_mismatch'; END IF; END $$;
CREATE FUNCTION official_provenance_private.h(domain text,value jsonb) RETURNS text LANGUAGE sql IMMUTABLE STRICT SET search_path='' SET timezone='UTC' AS $$ SELECT domain||':'||pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(domain||pg_catalog.chr(10)||official_provenance_private.canonical(value::json),'UTF8')),'hex') $$;
CREATE FUNCTION official_provenance_private.ordered_json(value jsonb,fields text[]) RETURNS text LANGUAGE plpgsql IMMUTABLE STRICT SET search_path='' SET timezone='UTC' AS $$
DECLARE result text:='{'; name text; first boolean:=true;
BEGIN FOREACH name IN ARRAY fields LOOP IF NOT first THEN result:=result||','; END IF;first:=false;result:=result||pg_catalog.to_json(name)::text||':'||official_provenance_private.canonical((value->name)::json); END LOOP;RETURN result||'}';END $$;
CREATE FUNCTION official_provenance_private.sorted_unique(value jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path='' SET timezone='UTC' AS $$ SELECT value=COALESCE((SELECT pg_catalog.jsonb_agg(v ORDER BY v) FROM (SELECT DISTINCT v FROM pg_catalog.jsonb_array_elements(value) v) x),'[]'::jsonb) $$;
CREATE FUNCTION official_provenance_private.codec_invariants_v2(value jsonb,kind text) RETURNS void LANGUAGE plpgsql IMMUTABLE SET search_path='' SET timezone='UTC' AS $$
#variable_conflict use_column
DECLARE e jsonb; other jsonb; r jsonb; registry jsonb; descriptors jsonb; a jsonb; u text; host text; field text; ids jsonb; projected jsonb;
BEGIN
 IF kind IN ('binding','identity','compact_identity','item_descriptor','representation_descriptor','profile_descriptor','profile_entry','identity_profile') THEN
  FOR field IN SELECT name FROM pg_catalog.jsonb_object_keys(value) name WHERE name IN ('contentItemVersion','representationVersion','identityProfileVersion') LOOP PERFORM official_provenance_private.require((value->>field)::numeric BETWEEN 1 AND 2147483647);END LOOP;
 END IF;
 IF kind IN ('extractor_descriptor','policy_descriptor','assignment') THEN
  SELECT pg_catalog.jsonb_agg(e ORDER BY e->>'sourceId',e->>'contentItemId') INTO projected FROM (SELECT DISTINCT e FROM pg_catalog.jsonb_array_elements(value->'contentItemRefs') e) x;
  PERFORM official_provenance_private.require(projected=value->'contentItemRefs');
 END IF;
 IF kind='assignment' THEN PERFORM official_provenance_private.require((value->>'relation'='equal_values' AND value->>'role'='equal_values') OR(value->>'relation'='single_content_item' AND value->>'role' IN ('complementary_part','general_rule','applicability_list')));
 ELSIF kind='extractor_descriptor' THEN
  PERFORM official_provenance_private.require(official_provenance_private.sorted_unique(value->'contentTypes') AND official_provenance_private.sorted_unique(value->'requiredFieldPaths') AND (SELECT pg_catalog.count(DISTINCT e) FROM pg_catalog.jsonb_array_elements(value->'representations') e)=pg_catalog.jsonb_array_length(value->'representations') AND (SELECT pg_catalog.count(DISTINCT e) FROM pg_catalog.jsonb_array_elements(value->'urlAllowlist') e)=pg_catalog.jsonb_array_length(value->'urlAllowlist'));
  FOR e IN SELECT x FROM pg_catalog.jsonb_array_elements(value->'representations') x LOOP PERFORM official_provenance_private.require(value->'contentItemRefs' @> pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('sourceId',e->'sourceId','contentItemId',e->'contentItemId')));END LOOP;
  FOR e IN SELECT x FROM pg_catalog.jsonb_array_elements(value->'contentItemRefs') x LOOP PERFORM official_provenance_private.require(EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(value->'representations') b WHERE b @> e));END LOOP;
  PERFORM official_provenance_private.require((value->'policyId'='null'::jsonb AND value->'policyVersion'='null'::jsonb AND pg_catalog.jsonb_array_length(value->'contentItemRefs')=1 AND value->'requiredFieldPaths'='[]'::jsonb) OR (value->>'policyId' ~ '^otp_[a-z][a-z0-9_]{0,40}$' AND value->'policyVersion'<>'null'::jsonb AND pg_catalog.jsonb_array_length(value->'contentItemRefs')>=2));
 ELSIF kind='policy_descriptor' THEN
  PERFORM official_provenance_private.require(pg_catalog.jsonb_array_length(value->'contentItemRefs')>=2);
  SELECT pg_catalog.jsonb_agg(e->'target' ORDER BY n) INTO ids FROM pg_catalog.jsonb_array_elements(value->'assignments') WITH ORDINALITY x(e,n);PERFORM official_provenance_private.require(official_provenance_private.sorted_unique(ids));
  FOR e IN SELECT x FROM pg_catalog.jsonb_array_elements(value->'assignments') x LOOP PERFORM official_provenance_private.require(value->'contentItemRefs' @> (e->'contentItemRefs'));END LOOP;
 ELSIF kind='representation_descriptor' THEN PERFORM official_provenance_private.require((value->'expectedLocale'='null'::jsonb OR value->>'expectedLocale'~'^[a-z]{2,3}(-[A-Za-z0-9]{2,8}){0,3}$') AND (value->'expectedSchema'='null'::jsonb OR value->>'expectedSchema'~'^[a-z][a-z0-9_-]{1,63}$'));PERFORM official_provenance_private.require(official_provenance_private.sorted_unique(value->'requestUrls'));
 ELSIF kind='item_descriptor' THEN PERFORM official_provenance_private.require(official_provenance_private.sorted_unique(value->'expectedPublisherIds') AND official_provenance_private.sorted_unique(value->'expectedAuthorityIds'));
 ELSIF kind='catalog_snapshot' THEN
  registry:=value->'registry';descriptors:=registry->'contentIdentity';
  SELECT COALESCE(pg_catalog.jsonb_agg(e-ARRAY['definition'] ORDER BY n),'[]'::jsonb) INTO projected FROM pg_catalog.jsonb_array_elements(value->'profiles') WITH ORDINALITY x(e,n);
  SELECT COALESCE(pg_catalog.jsonb_agg(e-'current' ORDER BY n),'[]'::jsonb) INTO ids FROM pg_catalog.jsonb_array_elements(descriptors->'profiles') WITH ORDINALITY x(e,n);PERFORM official_provenance_private.require(projected=ids);
  PERFORM official_provenance_private.require(NOT EXISTS(SELECT e->'identityProfileId',e->'identityProfileVersion' FROM pg_catalog.jsonb_array_elements(descriptors->'profiles') e GROUP BY 1,2 HAVING pg_catalog.count(*)>1) AND NOT EXISTS(SELECT e->'identityProfileId' FROM pg_catalog.jsonb_array_elements(descriptors->'profiles') e WHERE e->'current'='true'::jsonb GROUP BY 1 HAVING pg_catalog.count(*)>1));
  PERFORM official_provenance_private.require((SELECT COALESCE(pg_catalog.jsonb_agg(e ORDER BY e->>'identityProfileId',(e->>'identityProfileVersion')::bigint),'[]'::jsonb) FROM pg_catalog.jsonb_array_elements(descriptors->'profiles') e)=descriptors->'profiles');
  PERFORM official_provenance_private.require((SELECT COALESCE(pg_catalog.jsonb_agg(e ORDER BY e->>'sourceId',e->>'contentItemId',(e->>'contentItemVersion')::bigint),'[]'::jsonb) FROM pg_catalog.jsonb_array_elements(descriptors->'items') e)=descriptors->'items');
  PERFORM official_provenance_private.require((SELECT COALESCE(pg_catalog.jsonb_agg(e ORDER BY e->>'sourceId',e->>'contentItemId',e->>'representationId',(e->>'representationVersion')::bigint),'[]'::jsonb) FROM pg_catalog.jsonb_array_elements(descriptors->'representations') e)=descriptors->'representations');
  PERFORM official_provenance_private.require((SELECT COALESCE(pg_catalog.jsonb_agg(e ORDER BY e->>'sourceId'),'[]'::jsonb) FROM pg_catalog.jsonb_array_elements(registry->'sources') e)=registry->'sources' AND official_provenance_private.sorted_unique(registry->'blockedDomains'));
  FOR e IN SELECT x FROM pg_catalog.jsonb_array_elements(registry->'sources') x LOOP
   PERFORM official_provenance_private.require((SELECT pg_catalog.count(*) FROM pg_catalog.jsonb_array_elements(registry->'sources') x WHERE x->'sourceId'=e->'sourceId')=1 AND official_provenance_private.sorted_unique(e->'domains') AND official_provenance_private.utf16_length(e->>'publisherName') BETWEEN 2 AND 80 AND e->>'publisherName'!~'[[:cntrl:]]|://' AND pg_catalog.btrim(e->>'publisherName',U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')=e->>'publisherName' AND ((e->>'sourceClass'='official_authority' AND e->'authorityName'<>'null'::jsonb AND official_provenance_private.utf16_length(e->>'authorityName') BETWEEN 2 AND 80 AND e->>'authorityName'!~'[[:cntrl:]]|://' AND pg_catalog.btrim(e->>'authorityName',U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')=e->>'authorityName') OR(e->>'sourceClass'='licensed_evidence_provider' AND e->'authorityName'='null'::jsonb)));
   PERFORM official_provenance_private.require(NOT EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(registry->'sources') x,pg_catalog.jsonb_array_elements_text(x->'domains') d,pg_catalog.jsonb_array_elements_text(e->'domains') ed WHERE x->'sourceId'<>e->'sourceId' AND(d=ed OR d LIKE '%.'||ed OR ed LIKE '%.'||d)));
  END LOOP;
  FOR e IN SELECT x FROM pg_catalog.jsonb_array_elements(descriptors->'items') x LOOP
   PERFORM official_provenance_private.require(EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(registry->'sources') x WHERE x->'sourceId'=e->'sourceId' AND x->>'sourceClass'='official_authority') AND (SELECT pg_catalog.count(*) FROM pg_catalog.jsonb_array_elements(descriptors->'items') x WHERE x->'sourceId'=e->'sourceId' AND x->'contentItemId'=e->'contentItemId' AND x->'contentItemVersion'=e->'contentItemVersion')=1);
   PERFORM official_provenance_private.require(NOT EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(descriptors->'items') x WHERE x<>e AND x->'sourceId'=e->'sourceId' AND ((x->'contentItemId'=e->'contentItemId' AND ((x->'current'='true'::jsonb AND e->'current'='true'::jsonb) OR x->'externalIdNamespace'<>e->'externalIdNamespace' OR x->'externalContentId'<>e->'externalContentId')) OR (x->'contentItemId'<>e->'contentItemId' AND x->'externalIdNamespace'=e->'externalIdNamespace' AND x->'externalContentId'=e->'externalContentId'))));
  END LOOP;
  FOR e IN SELECT x FROM pg_catalog.jsonb_array_elements(descriptors->'representations') x LOOP
   PERFORM official_provenance_private.require(EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(descriptors->'items') x WHERE x->'sourceId'=e->'sourceId' AND x->'contentItemId'=e->'contentItemId' AND x->'contentItemVersion'=e->'contentItemVersion' AND (e->'current'='false'::jsonb OR x->'current'='true'::jsonb)) AND EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(descriptors->'profiles') x WHERE x->'identityProfileId'=e->'identityProfileId' AND x->'identityProfileVersion'=e->'identityProfileVersion' AND x->'current'='true'::jsonb));
   PERFORM official_provenance_private.require((SELECT pg_catalog.count(*) FROM pg_catalog.jsonb_array_elements(descriptors->'representations') x WHERE x->'sourceId'=e->'sourceId' AND x->'contentItemId'=e->'contentItemId' AND x->'representationId'=e->'representationId' AND x->'representationVersion'=e->'representationVersion')=1);
   FOR u IN SELECT DISTINCT x FROM pg_catalog.jsonb_array_elements_text(e->'requestUrls'||pg_catalog.jsonb_build_array(e->'expectedFinalUrl')) x LOOP
    host:=pg_catalog.split_part(pg_catalog.substr(u,9),'/',1);
    PERFORM official_provenance_private.require(EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(registry->'sources') x WHERE x->'sourceId'=e->'sourceId' AND x->'domains' @> pg_catalog.to_jsonb(host)) AND NOT EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements_text(registry->'blockedDomains') d WHERE host=d OR host LIKE '%.'||d));
    PERFORM official_provenance_private.require(NOT EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(descriptors->'representations') x WHERE x<>e AND (x->'requestUrls'||pg_catalog.jsonb_build_array(x->'expectedFinalUrl')) @> pg_catalog.to_jsonb(u) AND ((x->'sourceId',x->'contentItemId',x->'representationId') IS DISTINCT FROM(e->'sourceId',e->'contentItemId',e->'representationId') OR (x->'current'='true'::jsonb AND e->'current'='true'::jsonb))));
   END LOOP;
   PERFORM official_provenance_private.require(NOT EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(descriptors->'representations') x WHERE x<>e AND (x->'sourceId',x->'contentItemId',x->'representationId')=(e->'sourceId',e->'contentItemId',e->'representationId') AND((x->'current'='true'::jsonb AND e->'current'='true'::jsonb) OR x->'expectedMediaType'<>e->'expectedMediaType' OR x->'expectedLocale'<>e->'expectedLocale')));
  END LOOP;
 END IF;
END $$;
CREATE FUNCTION official_provenance_private.typed(value jsonb,kind text) RETURNS void LANGUAGE plpgsql IMMUTABLE SET search_path='' SET timezone='UTC' AS $$
DECLARE spec jsonb; part record; item jsonb; sections text[]; minimum integer; maximum integer; i integer; previous text; current_key text; raw bytea; decoded jsonb;
BEGIN
 PERFORM official_provenance_private.require(value IS NOT NULL AND kind IS NOT NULL);
 IF kind LIKE 'nullable:%' THEN IF value='null'::jsonb THEN RETURN; END IF; PERFORM official_provenance_private.typed(value,pg_catalog.substr(kind,10));RETURN;END IF;
 IF kind LIKE 'array:%' THEN
  sections:=pg_catalog.string_to_array(kind,':');minimum:=sections[2]::integer;maximum:=sections[3]::integer;
  PERFORM official_provenance_private.require(pg_catalog.jsonb_typeof(value)='array');PERFORM official_provenance_private.require(pg_catalog.jsonb_array_length(value) BETWEEN minimum AND maximum);
  FOR item IN SELECT e FROM pg_catalog.jsonb_array_elements(value) e LOOP PERFORM official_provenance_private.typed(item,sections[4]);END LOOP;RETURN;
 END IF;
 IF kind LIKE 'enum:%' THEN PERFORM official_provenance_private.require(pg_catalog.jsonb_typeof(value)='string' AND value#>>'{}'=ANY(pg_catalog.string_to_array(pg_catalog.substr(kind,6),'|')));RETURN;END IF;
 IF kind LIKE 'regex:%' THEN PERFORM official_provenance_private.require(pg_catalog.jsonb_typeof(value)='string' AND (value#>>'{}')~pg_catalog.substr(kind,7));RETURN;END IF;
 CASE kind
 WHEN 'external_id' THEN PERFORM official_provenance_private.typed(value,'regex:^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');RETURN;
 WHEN 'field_path' THEN PERFORM official_provenance_private.typed(value,'regex:^[a-z][A-Za-z0-9]{0,40}([.][a-z][A-Za-z0-9]{0,40}){0,4}$');RETURN;
 WHEN 'extractor_mime' THEN PERFORM official_provenance_private.typed(value,'regex:^[a-z0-9!#$&^_.+-]+/[a-z0-9!#$&^_.+-]+$');RETURN;
 WHEN 'identity_mime' THEN PERFORM official_provenance_private.typed(value,'regex:^[a-z0-9][a-z0-9!#$&^_.+-]{0,63}/[a-z0-9][a-z0-9!#$&^_.+-]{0,63}$');RETURN;
 WHEN 'string' THEN PERFORM official_provenance_private.require(pg_catalog.jsonb_typeof(value)='string' AND pg_catalog.length(value#>>'{}') BETWEEN 1 AND 4096);RETURN;
 WHEN 'text' THEN PERFORM official_provenance_private.require(pg_catalog.jsonb_typeof(value)='string' AND official_provenance_private.utf16_length(value#>>'{}') BETWEEN 1 AND 524288);RETURN;
 WHEN 'boolean' THEN PERFORM official_provenance_private.require(pg_catalog.jsonb_typeof(value)='boolean');RETURN;
 WHEN 'null' THEN PERFORM official_provenance_private.require(value='null'::jsonb);RETURN;
 WHEN 'one' THEN PERFORM official_provenance_private.require(value='1'::jsonb);RETURN;
 WHEN 'two' THEN PERFORM official_provenance_private.require(value='2'::jsonb);RETURN;
 WHEN 'three' THEN PERFORM official_provenance_private.require(value='3'::jsonb);RETURN;
 WHEN 'positive' THEN PERFORM official_provenance_private.require(pg_catalog.jsonb_typeof(value)='number' AND value::text~'^[1-9][0-9]{0,15}$' AND value::text::numeric<=9007199254740991);RETURN;
 WHEN 'pin' THEN PERFORM official_provenance_private.require(official_provenance_private.valid_pin(value));RETURN;
 WHEN 'id' THEN PERFORM official_provenance_private.typed(value,'regex:^[a-z][a-z0-9._-]{0,127}$');RETURN;
 WHEN 'source_id' THEN PERFORM official_provenance_private.typed(value,'regex:^[a-z][a-z0-9_-]{1,63}$');RETURN;
 WHEN 'hash' THEN PERFORM official_provenance_private.typed(value,'regex:^[a-f0-9]{64}$');RETURN;
 WHEN 'version_id' THEN PERFORM official_provenance_private.typed(value,'regex:^ev2_[a-f0-9]{32}$');RETURN;
 WHEN 'stamp' THEN
  PERFORM official_provenance_private.typed(value,'regex:^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]{1,3})?Z$');
  PERFORM official_provenance_private.require(pg_catalog.to_char((value#>>'{}')::timestamptz AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS')=pg_catalog.substr(value#>>'{}',1,19) AND pg_catalog.substr(value#>>'{}',1,4)<>'0000');RETURN;
 WHEN 'civil_date' THEN PERFORM official_provenance_private.typed(value,'regex:^[0-9]{4}-[0-9]{2}-[0-9]{2}$');PERFORM official_provenance_private.require(pg_catalog.to_char((value#>>'{}')::date,'YYYY-MM-DD')=value#>>'{}' AND pg_catalog.substr(value#>>'{}',1,4)<>'0000');RETURN;
 WHEN 'date' THEN
  IF pg_catalog.length(value#>>'{}')=10 THEN PERFORM official_provenance_private.typed(value,'regex:^[0-9]{4}-[0-9]{2}-[0-9]{2}$');PERFORM official_provenance_private.require(pg_catalog.to_char((value#>>'{}')::date,'YYYY-MM-DD')=value#>>'{}');
  ELSE PERFORM official_provenance_private.typed(value,'stamp');END IF;RETURN;
 WHEN 'identity_url','extractor_url' THEN PERFORM official_provenance_private.require(pg_catalog.jsonb_typeof(value)='string' AND official_provenance_private.canonical_url(value#>>'{}',CASE WHEN kind='extractor_url' THEN 'extractor' ELSE 'identity' END));RETURN;
 WHEN 'country' THEN PERFORM official_provenance_private.typed(value,'regex:^[A-Z]{2}$');RETURN;
 WHEN 'scope' THEN spec:='{"destinationCountryCode":"nullable:country","transitCountryCode":"nullable:country","citizenship":"citizenship","credentialOption":"credential","residence":"residence","requirementType":"requirement","validity":"scope_validity"}';
 WHEN 'evidence_scope' THEN spec:='{"sourceId":"source_id","destinationCountryCode":"nullable:country","transitCountryCode":"nullable:country","citizenship":"citizenship","credentialOption":"credential","residence":"residence","requirementType":"requirement","validity":"scope_validity"}';
 WHEN 'citizenship' THEN IF value->>'mode'='not_applicable' THEN spec:='{"mode":"enum:not_applicable"}';ELSE spec:='{"mode":"enum:required","countryCodes":"array:1:4:country"}';END IF;
 WHEN 'credential' THEN IF value->>'mode'='not_applicable' THEN spec:='{"mode":"enum:not_applicable"}';ELSE spec:='{"mode":"enum:option","documentType":"enum:passport|national_id|unknown","issuingCountryCode":"country","relatedCitizenshipCountryCode":"nullable:country"}';END IF;
 WHEN 'residence' THEN IF value->>'mode'='not_applicable' THEN spec:='{"mode":"enum:not_applicable"}';ELSE spec:='{"mode":"enum:required","countryCode":"country"}';END IF;
 WHEN 'scope_validity' THEN IF value->>'mode'='not_applicable' THEN spec:='{"mode":"enum:not_applicable"}';ELSE spec:='{"mode":"enum:travel_date","travelDate":"civil_date"}';END IF;
 WHEN 'requirement' THEN PERFORM official_provenance_private.typed(value,'enum:visa|electronic_travel_authorization|passport|identity_document|passport_validity|blank_passport_pages|transit|health|vaccination|health_document|entry_form|insurance|onward_or_return_ticket|booking_or_travel_document|financial_means|other_entry_requirement');RETURN;
 WHEN 'quality' THEN PERFORM official_provenance_private.typed(value,'enum:explicit_primary_statement|composed_from_multiple_primary_sources');RETURN;
 WHEN 'fact_kind' THEN PERFORM official_provenance_private.typed(value,'enum:requirement_effect|visa_options|stay_limit|passport_validity|blank_passport_pages|transit_conditions|official_actions|temporal_rule');RETURN;
 WHEN 'binding' THEN spec:='{"sourceId":"source_id","contentItemId":"source_id","contentItemVersion":"positive","representationId":"source_id","representationVersion":"positive","identityProfileId":"source_id","identityProfileVersion":"positive"}';
 WHEN 'identity' THEN spec:='{"sourceId":"source_id","contentItemId":"source_id","contentItemVersion":"positive","representationId":"source_id","representationVersion":"positive","identityProfileId":"source_id","identityProfileVersion":"positive","identitySchema":"two","lookupKey":"regex:^evidence-key:v3:[a-f0-9]{64}$","canonicalUrl":"identity_url","contentType":"identity_mime","sourceContentHash":"hash","retrievedAt":"stamp","validFrom":"nullable:date","validUntil":"nullable:date","versionId":"version_id"}';
 WHEN 'compact_identity' THEN spec:='{"sourceId":"source_id","contentItemId":"source_id","contentItemVersion":"positive","representationId":"source_id","representationVersion":"positive","identityProfileId":"source_id","identityProfileVersion":"positive","identitySchema":"two","canonicalUrl":"identity_url","contentType":"identity_mime","sourceContentHash":"hash","retrievedAt":"stamp","validFrom":"nullable:date","validUntil":"nullable:date","versionId":"version_id"}';
 WHEN 'content_ref' THEN spec:='{"sourceId":"source_id","contentItemId":"source_id"}';
 WHEN 'target' THEN spec:='{"kind":"enum:fact_field","fieldPath":"enum:effect|visaMode"}';
 WHEN 'assignment' THEN spec:='{"target":"target","contentItemRefs":"array:1:8:content_ref","relation":"enum:single_content_item|equal_values","role":"enum:complementary_part|equal_values|general_rule|exception|applicability_list|exemption_set"}';
 WHEN 'citation' THEN spec:='{"target":"target","supportVersionIds":"array:1:8:version_id"}';
 WHEN 'item_descriptor' THEN spec:='{"sourceId":"source_id","contentItemId":"source_id","contentItemVersion":"positive","current":"boolean","externalIdNamespace":"source_id","externalContentId":"external_id","expectedPublisherIds":"array:1:8:external_id","expectedAuthorityIds":"array:1:8:external_id"}';
 WHEN 'representation_descriptor' THEN spec:='{"sourceId":"source_id","contentItemId":"source_id","contentItemVersion":"positive","representationId":"source_id","representationVersion":"positive","current":"boolean","requestUrls":"array:1:16:identity_url","expectedFinalUrl":"identity_url","expectedMediaType":"identity_mime","identityProfileId":"source_id","identityProfileVersion":"positive","expectedLocale":"nullable:string","expectedSchema":"nullable:string"}';
 WHEN 'profile_descriptor' THEN spec:='{"identityProfileId":"source_id","identityProfileVersion":"positive","current":"boolean"}';
 WHEN 'profile_entry' THEN spec:='{"identityProfileId":"source_id","identityProfileVersion":"positive","definition":"pin"}';
 WHEN 'registry_entry' THEN spec:='{"id":"id","version":"positive","current":"boolean","definition":"pin"}';
 WHEN 'source' THEN spec:='{"sourceId":"source_id","sourceClass":"enum:official_authority|licensed_evidence_provider","publisherName":"string","authorityName":"nullable:string","domains":"array:1:32:domain"}';
 WHEN 'domain' THEN PERFORM official_provenance_private.typed(value,'regex:^[a-z0-9]([a-z0-9-]*[a-z0-9])?([.][a-z0-9]([a-z0-9-]*[a-z0-9])?)+$');PERFORM official_provenance_private.require(pg_catalog.length(value#>>'{}')<=253 AND value#>>'{}'!~'(^|[.])(localhost|local)$' AND value#>>'{}'!~'^[0-9.]+$' AND NOT EXISTS(SELECT 1 FROM pg_catalog.unnest(pg_catalog.string_to_array(value#>>'{}','.')) l WHERE pg_catalog.length(l)>63));RETURN;
 WHEN 'authority_registry' THEN spec:='{"sources":"array:0:1024:source","blockedDomains":"array:0:1024:domain"}';
 WHEN 'content_graph' THEN spec:='{"authorityRegistry":"authority_registry","items":"array:0:1024:item_descriptor","representations":"array:0:4096:representation_descriptor","profiles":"array:0:128:profile_descriptor"}';
 WHEN 'registry' THEN spec:='{"sources":"array:0:1024:source","blockedDomains":"array:0:1024:domain","contentIdentity":"content_graph"}';
 WHEN 'allow_url' THEN IF value->>'kind'='exact' THEN spec:='{"kind":"enum:exact","canonicalUrl":"extractor_url"}';ELSE spec:='{"kind":"enum:path","host":"domain","path":"regex:^/[a-zA-Z0-9._~/-]*$"}';END IF;
 WHEN 'extractor_descriptor' THEN spec:='{"extractorId":"regex:^otx_[a-z][a-z0-9_]{0,40}$","extractorVersion":"positive","factKind":"fact_kind","sourceFamilyId":"regex:^otf_[a-z][a-z0-9_]{0,40}$","contentItemRefs":"array:1:8:content_ref","representations":"array:1:16:binding","urlAllowlist":"array:1:8:allow_url","contentTypes":"array:1:8:extractor_mime","schemaFamily":"regex:^ots_[a-z][a-z0-9_]{0,40}$","policyId":"nullable:string","policyVersion":"nullable:positive","requiredFieldPaths":"array:0:16:field_path"}';
 WHEN 'policy_descriptor' THEN spec:='{"policyId":"regex:^otp_[a-z][a-z0-9_]{0,40}$","policyVersion":"positive","factKind":"fact_kind","requirementType":"requirement","contentItemRefs":"array:1:8:content_ref","sourceFamilyId":"regex:^otf_[a-z][a-z0-9_]{0,40}$","schemaFamily":"regex:^ots_[a-z][a-z0-9_]{0,40}$","applicabilitySchema":"nullable:one","completeness":"enum:joint_complete_fact","assignments":"array:1:64:assignment"}';
 WHEN 'basis' THEN IF value->>'kind'='no_bound_asserted' THEN spec:='{"kind":"enum:no_bound_asserted"}';ELSE spec:='{"kind":"enum:qualified_locator","locator":"locator","value":"date"}';END IF;
 WHEN 'locator' THEN spec:='{"kind":"enum:json_pointer","pointer":"regex:^(/([^~]|~[01])*)+$"}';
 WHEN 'contract' THEN spec:='{"contract":"enum:scope|corpus_admission|category_basis|evaluation_date_plan|support_selection|review_construction|content_identity|source_hash|transport|representation_qualification|validity_derivation|evidence_acceptance|fact_schema|applicability_schema|output_contract|proof_contract|freshness_contract","implementation":"pin","implementationDependencies":"array:0:128:pin"}';
 WHEN 'identity_profile' THEN spec:='{"identityProfileId":"source_id","identityProfileVersion":"positive","implementation":"pin","implementationDependencies":"array:0:128:pin"}';
 WHEN 'catalog_snapshot' THEN spec:='{"registry":"registry","profiles":"array:0:128:profile_entry"}';
 WHEN 'extractor_registry','policy_registry' THEN spec:='{"definitions":"array:0:128:registry_entry"}';
 WHEN 'extractor_definition' THEN spec:='{"descriptor":"extractor_descriptor","implementation":"pin","implementationDependencies":"array:0:128:pin","outputContract":"pin","factSchema":"pin","applicabilitySchema":"nullable:pin"}';
 WHEN 'policy_definition' THEN spec:='{"descriptor":"policy_descriptor","implementation":"pin","implementationDependencies":"array:0:128:pin"}';
 WHEN 'content_item_definition' THEN spec:='{"descriptor":"item_descriptor"}';
 WHEN 'representation_definition' THEN spec:='{"descriptor":"representation_descriptor"}';
 WHEN 'original_observation' THEN spec:='{"binding":"binding","requestUrl":"identity_url","canonicalFinalUrl":"identity_url","contentType":"identity_mime","sourceContentHash":"hash","startedAt":"stamp","completedAt":"stamp","qualification":"pin","transportContract":"pin","identityProfile":"pin","catalogSnapshot":"pin","hashContract":"pin"}';
 WHEN 'validity_origin' THEN spec:='{"observation":"pin","evidenceScope":"evidence_scope","validFrom":"nullable:date","validUntil":"nullable:date","validFromBasis":"basis","validUntilBasis":"basis","derivationContract":"pin"}';
 WHEN 'accepted_origin' THEN spec:='{"observation":"pin","validityOrigin":"pin","cell":"pin","globalAdmission":"pin","evidenceIdentity":"identity","evidenceScope":"evidence_scope","acceptanceContract":"pin"}';
 WHEN 'eligible_version_snapshot' THEN spec:='{"entries":"array:1:256:eligible_entry"}';
 WHEN 'eligible_entry' THEN spec:='{"versionId":"version_id","custody":"pin","eligible":"boolean"}';
 WHEN 'support_entry' THEN spec:='{"versionId":"version_id","custody":"pin"}';
 WHEN 'implementation_bundle' THEN spec:='{"encoding":"enum:base64","mediaType":"enum:application/vnd.jetnity.implementation-source-bundle+json","bundleBase64":"base64"}';
 WHEN 'base64' THEN
  PERFORM official_provenance_private.require(pg_catalog.jsonb_typeof(value)='string' AND pg_catalog.length(value#>>'{}') BETWEEN 4 AND 1000000 AND value#>>'{}'~'^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$');
  raw:=pg_catalog.decode(value#>>'{}','base64');PERFORM official_provenance_private.require(pg_catalog.replace(pg_catalog.encode(raw,'base64'),pg_catalog.chr(10),'')=value#>>'{}');decoded:=official_provenance_private.decode(raw,1048576);PERFORM official_provenance_private.typed(decoded,'code_bundle');RETURN;
 WHEN 'code_bundle' THEN spec:='{"schema":"enum:implementation-source-bundle-v1","files":"array:1:256:code_file"}';
 WHEN 'code_file' THEN spec:='{"path":"regex:^(?!/)(?!.*(^|/)[.][.](/|$))[A-Za-z0-9_./@-]+$","utf8":"text"}';
 WHEN 'global_cell' THEN spec:='{"id":"id","version":"positive","scope":"scope"}';
 WHEN 'dimension_basis' THEN spec:='{"destinationCountryCode":"dimension","transitCountryCode":"dimension","citizenship":"dimension","credentialOption":"dimension","residence":"dimension","requirementType":"dimension","validity":"dimension"}';
 WHEN 'dimension' THEN PERFORM official_provenance_private.require(official_provenance_private.keys(value,ARRAY['category','basis']));PERFORM official_provenance_private.typed(value->'basis','pin');RETURN;
 WHEN 'GlobalCellAdmissionV1' THEN spec:='{"cell":"pin","scopeContract":"pin","corpusAdmissionContract":"pin","dimensionBasis":"dimension_basis","evaluationDatePlan":"nullable:pin"}';
 WHEN 'AcceptedEvidenceCustodyV1' THEN spec:='{"cell":"pin","globalAdmission":"pin","scopeContract":"pin","evidenceScope":"evidence_scope","evidenceIdentity":"identity","observation":"pin","validityOrigin":"pin","acceptedOrigin":"pin","identityContract":"pin","hashContract":"pin"}';
 WHEN 'SupportSelectionDefinitionV1' THEN spec:='{"cell":"pin","requirementType":"requirement","factKind":"fact_kind","evidenceQuality":"quality","requiredContentItemRefs":"array:1:8:content_ref","selectionContract":"pin"}';
 WHEN 'SelectedSupportManifestV1' THEN spec:='{"selectionDefinition":"pin","cell":"pin","globalAdmission":"pin","requirementType":"requirement","factKind":"fact_kind","evidenceQuality":"quality","eligibleVersionSnapshot":"pin","catalogSnapshot":"pin","extractorRegistrySnapshot":"pin","policyRegistrySnapshot":"nullable:pin","supports":"array:1:8:support_entry"}';
 WHEN 'GlobalRepresentationQualificationV1' THEN spec:='{"binding":"binding","itemDefinition":"pin","representationDefinition":"pin","identityProfileDefinition":"pin","qualificationContract":"pin"}';
 WHEN 'AutonomousReviewConstructionV1' THEN spec:='{"cell":"pin","selectedSupportManifest":"pin","constructionContract":"pin","safePreimage":"review_preimage","reviewPacketKey":"regex:^review-packet:v3:[a-f0-9]{64}$"}';
 WHEN 'review_preimage' THEN spec:='{"v":"three","candidate":"review_candidate","supports":"array:1:8:compact_identity"}';
 WHEN 'review_candidate' THEN spec:='{"scope":"scope","key":"regex:^rule-scope:v1:[a-f0-9]{64}$","factKind":"fact_kind","evidenceQuality":"quality","supportVersionIds":"array:1:8:version_id","proposal":"null"}';
 WHEN 'receipt' THEN spec:='{"schema":"enum:official-truth-autonomous-provenance","schemaVersion":"one","canonicalization":"enum:ot-provenance-json-v1","outcome":"enum:trusted_fact_produced","globalCell":"receipt_cell","candidate":"receipt_candidate","evidenceQuality":"quality","extractor":"receipt_extractor","policy":"nullable:receipt_policy","supports":"array:1:8:receipt_support","citations":"array:1:64:citation","proof":"receipt_proof"}';
 WHEN 'receipt_cell' THEN spec:='{"definition":"pin","scope":"scope","ruleScopeKey":"regex:^rule-scope:v1:[a-f0-9]{64}$"}';
 WHEN 'receipt_candidate' THEN spec:='{"factKind":"enum:requirement_effect","requirementType":"enum:visa","factSchema":"pin","applicabilitySchema":"null","fact":"local_visa_fact","factHash":"regex:^ot-fact-v1:[a-f0-9]{64}$","candidateBinding":"regex:^ot-candidate-v1:[a-f0-9]{64}$"}';
 WHEN 'local_visa_fact' THEN spec:='{"kind":"enum:requirement_effect","effect":"enum:required|not_required","visaMode":"enum:visa_exempt|electronic_visa|visa_on_arrival|visa_before_travel|unknown"}';
 WHEN 'receipt_extractor' THEN spec:='{"extractorId":"regex:^otx_[a-z][a-z0-9_]{0,40}$","extractorVersion":"positive","sourceFamilyId":"regex:^otf_[a-z][a-z0-9_]{0,40}$","schemaFamily":"regex:^ots_[a-z][a-z0-9_]{0,40}$","definition":"pin","registrySnapshot":"pin","outputContract":"pin","selectionKey":"regex:^ot-(extractor|composition)-selection-v1:[a-f0-9]{64}$"}';
 WHEN 'receipt_policy' THEN spec:='{"policyId":"regex:^otp_[a-z][a-z0-9_]{0,40}$","policyVersion":"positive","definition":"pin","registrySnapshot":"pin","preHttpSelectionKey":"regex:^ot-composition-selection-v1:[a-f0-9]{64}$","assignments":"array:1:64:assignment","resultIdentity":"regex:^ot-composition-result-v1:[a-f0-9]{64}$"}';
 WHEN 'receipt_support' THEN spec:='{"versionId":"version_id","identitySchema":"two","binding":"binding","canonicalFinalUrl":"identity_url","contentType":"identity_mime","sourceContentHash":"hash","acceptedRetrievedAt":"stamp","validFrom":"nullable:date","validUntil":"nullable:date","freshRetrieval":"fresh_retrieval"}';
 WHEN 'fresh_retrieval' THEN spec:='{"requestUrl":"identity_url","completedAt":"stamp"}';
 WHEN 'receipt_proof' THEN spec:='{"contract":"pin","reviewPacketKey":"regex:^review-packet:v3:[a-f0-9]{64}$","proofIdentity":"regex:^ot-proof-v1:[a-f0-9]{64}$","catalogSnapshot":"pin","serverReferenceTime":"stamp","freshnessContract":"pin","evidenceFreshnessAtReference":"enum:current"}';
 ELSE RAISE EXCEPTION 'unsupported_version';
 END CASE;
 PERFORM official_provenance_private.require(official_provenance_private.keys(value,ARRAY(SELECT pg_catalog.jsonb_object_keys(spec))));
 FOR part IN SELECT e.key,e.value FROM pg_catalog.jsonb_each_text(spec) e LOOP PERFORM official_provenance_private.typed(value->part.key,part.value);END LOOP;
 PERFORM official_provenance_private.codec_invariants_v2(value,kind);
 IF kind IN ('scope','evidence_scope') THEN
  PERFORM official_provenance_private.require(value->'destinationCountryCode'<>'null'::jsonb OR value->'transitCountryCode'<>'null'::jsonb);
  IF value#>'{credentialOption,relatedCitizenshipCountryCode}' IS NOT NULL AND value#>'{credentialOption,relatedCitizenshipCountryCode}'<>'null'::jsonb THEN PERFORM official_provenance_private.require(value#>'{citizenship,countryCodes}' @> pg_catalog.jsonb_build_array(value#>'{credentialOption,relatedCitizenshipCountryCode}'));END IF;
 ELSIF kind='citizenship' AND value->>'mode'='required' THEN
  PERFORM official_provenance_private.require(value->'countryCodes'=(SELECT pg_catalog.jsonb_agg(e ORDER BY e) FROM (SELECT DISTINCT e FROM pg_catalog.jsonb_array_elements(value->'countryCodes') e) q));
 ELSIF kind='GlobalCellAdmissionV1' THEN PERFORM official_provenance_private.require((value#>>'{dimensionBasis,validity,category,mode}'='travel_date')=(value->'evaluationDatePlan'<>'null'::jsonb));
 ELSIF kind='allow_url' AND value->>'kind'='path' THEN PERFORM official_provenance_private.require(pg_catalog.length(value->>'path')<=200 AND pg_catalog.strpos(value->>'path','..')=0);
 ELSIF kind='locator' THEN PERFORM official_provenance_private.require(official_provenance_private.utf16_length(value->>'pointer')<=256);
 ELSIF kind='original_observation' THEN PERFORM official_provenance_private.require((value->>'startedAt')::timestamptz<=(value->>'completedAt')::timestamptz);
 ELSIF kind='identity' THEN
  current_key:=official_provenance_private.ordered_json(value,ARRAY['identitySchema','sourceId','contentItemId','contentItemVersion','representationId','representationVersion','identityProfileId','identityProfileVersion','lookupKey','canonicalUrl','contentType','sourceContentHash','retrievedAt','validFrom','validUntil']);
  PERFORM official_provenance_private.require(value->>'versionId'='ev2_'||pg_catalog.substr(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(current_key,'UTF8')),'hex'),1,32));
 ELSIF kind='validity_origin' THEN
  FOREACH current_key IN ARRAY ARRAY['validFrom','validUntil'] LOOP
   item:=value->(current_key||'Basis');
   IF value->current_key='null'::jsonb THEN PERFORM official_provenance_private.require(item->>'kind'='no_bound_asserted');
   ELSE PERFORM official_provenance_private.require(item->>'kind'='qualified_locator' AND item->'value'=value->current_key);END IF;
  END LOOP;
 ELSIF kind='AutonomousReviewConstructionV1' THEN PERFORM official_provenance_private.require(value->>'reviewPacketKey'='review-packet:v3:'||pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(official_provenance_private.canonical((value->'safePreimage')::json),'UTF8')),'hex'));
 ELSIF kind='registry' THEN PERFORM official_provenance_private.require(value->'contentIdentity'->'authorityRegistry'=value-'contentIdentity');
 ELSIF kind='registry_entry' THEN PERFORM official_provenance_private.require(value->'id'=value->'definition'->'id' AND value->'version'=value->'definition'->'version');
 ELSIF kind='local_visa_fact' THEN
  PERFORM official_provenance_private.require(NOT(value->>'effect'='required' AND value->>'visaMode'='visa_exempt') AND NOT(value->>'effect'='not_required' AND value->>'visaMode' IN ('electronic_visa','visa_on_arrival','visa_before_travel')));
 ELSIF kind='assignment' THEN PERFORM official_provenance_private.require((value->>'relation'='single_content_item' AND pg_catalog.jsonb_array_length(value->'contentItemRefs')=1) OR (value->>'relation'='equal_values' AND pg_catalog.jsonb_array_length(value->'contentItemRefs')>=2));
 ELSIF kind='code_bundle' THEN
  previous:=NULL;FOR item IN SELECT e FROM pg_catalog.jsonb_array_elements(value->'files') e LOOP
   current_key:=item->>'path';PERFORM official_provenance_private.require(pg_catalog.length(current_key)<=256 AND (previous IS NULL OR official_provenance_private.utf16_sort_key(previous)<official_provenance_private.utf16_sort_key(current_key)));previous:=current_key;
  END LOOP;
 END IF;
 IF kind IN ('identity','validity_origin','receipt_support') AND value->'validFrom'<>'null'::jsonb AND value->'validUntil'<>'null'::jsonb THEN PERFORM official_provenance_private.require((value->>'validFrom')::timestamptz<=(value->>'validUntil')::timestamptz);END IF;
END $$;
CREATE FUNCTION official_provenance_private.derived_edges_v2(kind text,value jsonb)
RETURNS TABLE(slot text,pin jsonb,expected_type text) LANGUAGE plpgsql IMMUTABLE STRICT SET search_path='' SET timezone='UTC' AS $$
DECLARE mapping jsonb:='{}'; part record; item record;
BEGIN
 CASE kind
 WHEN 'semantic_contract','identity_profile','fact_schema','applicability_schema','output_contract','proof_contract','freshness_contract' THEN mapping:='{"implementation":"implementation_bundle"}';
 WHEN 'extractor_definition' THEN mapping:='{"implementation":"implementation_bundle","outputContract":"output_contract","factSchema":"fact_schema","applicabilitySchema":"applicability_schema"}';
 WHEN 'policy_definition' THEN mapping:='{"implementation":"implementation_bundle"}';
 WHEN 'original_observation' THEN mapping:='{"qualification":"GlobalRepresentationQualificationV1","transportContract":"semantic_contract","identityProfile":"identity_profile","catalogSnapshot":"catalog_snapshot","hashContract":"semantic_contract"}';
 WHEN 'validity_origin' THEN mapping:='{"observation":"original_observation","derivationContract":"semantic_contract"}';
 WHEN 'accepted_origin' THEN mapping:='{"observation":"original_observation","validityOrigin":"validity_origin","cell":"global_cell","globalAdmission":"GlobalCellAdmissionV1","acceptanceContract":"semantic_contract"}';
 WHEN 'GlobalCellAdmissionV1' THEN mapping:='{"cell":"global_cell","scopeContract":"semantic_contract","corpusAdmissionContract":"semantic_contract","evaluationDatePlan":"semantic_contract"}';
 WHEN 'AcceptedEvidenceCustodyV1' THEN mapping:='{"cell":"global_cell","globalAdmission":"GlobalCellAdmissionV1","scopeContract":"semantic_contract","observation":"original_observation","validityOrigin":"validity_origin","acceptedOrigin":"accepted_origin","identityContract":"semantic_contract","hashContract":"semantic_contract"}';
 WHEN 'SupportSelectionDefinitionV1' THEN mapping:='{"cell":"global_cell","selectionContract":"semantic_contract"}';
 WHEN 'SelectedSupportManifestV1' THEN mapping:='{"selectionDefinition":"SupportSelectionDefinitionV1","cell":"global_cell","globalAdmission":"GlobalCellAdmissionV1","eligibleVersionSnapshot":"eligible_version_snapshot","catalogSnapshot":"catalog_snapshot","extractorRegistrySnapshot":"extractor_registry","policyRegistrySnapshot":"policy_registry"}';
 WHEN 'GlobalRepresentationQualificationV1' THEN mapping:='{"itemDefinition":"content_item_definition","representationDefinition":"representation_definition","identityProfileDefinition":"identity_profile","qualificationContract":"semantic_contract"}';
 WHEN 'AutonomousReviewConstructionV1' THEN mapping:='{"cell":"global_cell","selectedSupportManifest":"SelectedSupportManifestV1","constructionContract":"semantic_contract"}';
 ELSE NULL;
 END CASE;
 FOR part IN SELECT e.key,e.value FROM pg_catalog.jsonb_each_text(mapping) e LOOP
  IF value->part.key<>'null'::jsonb THEN slot:='/'||part.key;pin:=value->part.key;expected_type:=part.value;PERFORM official_provenance_private.typed(pin,'pin');RETURN NEXT;END IF;
 END LOOP;
 IF value ? 'implementationDependencies' THEN FOR item IN SELECT e.v,e.n FROM pg_catalog.jsonb_array_elements(value->'implementationDependencies') WITH ORDINALITY e(v,n) LOOP slot:='/implementationDependencies/'||(item.n-1)::text;pin:=item.v;expected_type:='implementation_bundle';RETURN NEXT;END LOOP;END IF;
 IF kind='catalog_snapshot' THEN FOR item IN SELECT e.v,e.n FROM pg_catalog.jsonb_array_elements(value->'profiles') WITH ORDINALITY e(v,n) LOOP slot:='/profiles/'||(item.n-1)::text||'/definition';pin:=item.v->'definition';expected_type:='identity_profile';RETURN NEXT;END LOOP;
 ELSIF kind IN ('extractor_registry','policy_registry') THEN FOR item IN SELECT e.v,e.n FROM pg_catalog.jsonb_array_elements(value->'definitions') WITH ORDINALITY e(v,n) LOOP slot:='/definitions/'||(item.n-1)::text||'/definition';pin:=item.v->'definition';expected_type:=CASE WHEN kind='extractor_registry' THEN 'extractor_definition' ELSE 'policy_definition' END;RETURN NEXT;END LOOP;
 ELSIF kind='eligible_version_snapshot' THEN FOR item IN SELECT e.v,e.n FROM pg_catalog.jsonb_array_elements(value->'entries') WITH ORDINALITY e(v,n) LOOP slot:='/entries/'||(item.n-1)::text||'/custody';pin:=item.v->'custody';expected_type:='AcceptedEvidenceCustodyV1';RETURN NEXT;END LOOP;
 ELSIF kind='SelectedSupportManifestV1' THEN FOR item IN SELECT e.v,e.n FROM pg_catalog.jsonb_array_elements(value->'supports') WITH ORDINALITY e(v,n) LOOP slot:='/supports/'||(item.n-1)::text||'/custody';pin:=item.v->'custody';expected_type:='AcceptedEvidenceCustodyV1';RETURN NEXT;END LOOP;
 ELSIF kind='GlobalCellAdmissionV1' THEN FOR part IN SELECT e.key,e.value FROM pg_catalog.jsonb_each(value->'dimensionBasis') e LOOP slot:='/dimensionBasis/'||part.key||'/basis';pin:=part.value->'basis';expected_type:='semantic_contract';RETURN NEXT;END LOOP;
 END IF;
END $$;
CREATE FUNCTION official_provenance_private.artifact_v2(a official_provenance_api.artifact_input_v1)
RETURNS TABLE(slot text,pin jsonb,expected_type text) LANGUAGE plpgsql IMMUTABLE STRICT SET search_path='' SET timezone='UTC' AS $$
DECLARE envelope jsonb; value jsonb; derived jsonb; key text; item jsonb; previous text; type_name text; decoded jsonb;
BEGIN
 -- Reuse every lexical/hash/header/declared-edge check and its decoded value.
 -- No second canonical decode or discarded generic custody-pin traversal.
 envelope:=official_provenance_private.artifact_envelope(a);
 IF a.byte_contract_family='global_definition_v1' THEN value:=envelope;PERFORM official_provenance_private.typed(value,'global_cell');RETURN;
 ELSIF a.byte_contract_family='custody_v1' THEN value:=envelope->'value';type_name:=a.artifact_type;
 ELSE value:=envelope->'content';type_name:=CASE WHEN a.artifact_type IN ('semantic_contract','fact_schema','applicability_schema','output_contract','proof_contract','freshness_contract') THEN 'contract' ELSE a.artifact_type END;END IF;
 PERFORM official_provenance_private.typed(value,type_name);
 IF a.artifact_type IN ('fact_schema','applicability_schema','output_contract','proof_contract','freshness_contract') THEN PERFORM official_provenance_private.require(value->>'contract'=a.artifact_type);END IF;
 IF a.artifact_type='identity_profile' THEN PERFORM official_provenance_private.require(value->>'identityProfileId'=a.artifact_id AND (value->>'identityProfileVersion')::bigint=a.artifact_version);END IF;
 IF a.artifact_type='extractor_definition' THEN PERFORM official_provenance_private.require(value#>>'{descriptor,extractorId}'=a.artifact_id AND (value#>>'{descriptor,extractorVersion}')::bigint=a.artifact_version AND ((value#>'{descriptor,policyId}'='null'::jsonb)=(value#>'{descriptor,policyVersion}'='null'::jsonb)));END IF;
 IF a.artifact_type='policy_definition' THEN PERFORM official_provenance_private.require(value#>>'{descriptor,policyId}'=a.artifact_id AND (value#>>'{descriptor,policyVersion}')::bigint=a.artifact_version);END IF;
 IF value ? 'implementationDependencies' THEN
  previous:=NULL;FOR item IN SELECT e FROM pg_catalog.jsonb_array_elements(value->'implementationDependencies') e LOOP
   key:=(item->>'id')||pg_catalog.chr(1)||(item->>'version')||pg_catalog.chr(1)||(item->>'digest');PERFORM official_provenance_private.require(previous IS NULL OR previous COLLATE "C"<key COLLATE "C");previous:=key;
  END LOOP;
 END IF;
 IF a.artifact_type IN ('extractor_registry','policy_registry','eligible_version_snapshot') THEN
  previous:=NULL;FOR item IN SELECT e FROM pg_catalog.jsonb_array_elements(CASE WHEN a.artifact_type='eligible_version_snapshot' THEN value->'entries' ELSE value->'definitions' END) e LOOP
   key:=CASE WHEN a.artifact_type='eligible_version_snapshot' THEN item->>'versionId' ELSE (item->>'id')||pg_catalog.chr(1)||pg_catalog.lpad(item->>'version',16,'0') END;
   PERFORM official_provenance_private.require(previous IS NULL OR previous COLLATE "C"<key COLLATE "C");previous:=key;
  END LOOP;
 END IF;
 SELECT COALESCE(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('slot',d.slot,'pin',d.pin) ORDER BY official_provenance_private.utf16_sort_key(d.slot)),'[]'::jsonb) INTO derived FROM official_provenance_private.derived_edges_v2(a.artifact_type,value) d;
 IF a.byte_contract_family='manifest_v1' THEN PERFORM official_provenance_private.require(envelope->'dependencies'=derived);END IF;
 RETURN QUERY SELECT d.slot,d.pin,d.expected_type FROM official_provenance_private.derived_edges_v2(a.artifact_type,value) d ORDER BY official_provenance_private.utf16_sort_key(d.slot);
END $$;
CREATE FUNCTION official_provenance_private.content_v2(artifacts official_provenance_api.artifact_input_v1[],pin jsonb,expected_type text)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE STRICT SET search_path='' SET timezone='UTC' AS $$
DECLARE a official_provenance_api.artifact_input_v1; value jsonb;
BEGIN
 PERFORM official_provenance_private.typed(pin,'pin');
 SELECT x.* INTO a FROM pg_catalog.unnest(artifacts) x WHERE x.artifact_id=pin->>'id' AND x.artifact_version=(pin->>'version')::bigint AND x.digest=pin->>'digest' AND x.artifact_type=expected_type;
 IF NOT FOUND THEN RAISE EXCEPTION 'dependency_missing';END IF;
 value:=official_provenance_private.decode(a.canonical_bytes,1048576);
 RETURN CASE a.byte_contract_family WHEN 'global_definition_v1' THEN value WHEN 'custody_v1' THEN value->'value' ELSE value->'content' END;
END $$;
CREATE FUNCTION official_provenance_private.semantic_contract_v2(artifacts official_provenance_api.artifact_input_v1[],pin jsonb,name text)
RETURNS void LANGUAGE plpgsql IMMUTABLE STRICT SET search_path='' SET timezone='UTC' AS $$ BEGIN PERFORM official_provenance_private.require(official_provenance_private.content_v2(artifacts,pin,'semantic_contract')->>'contract'=name);END $$;
CREATE FUNCTION official_provenance_private.flat_scope(scope jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE STRICT SET search_path='' SET timezone='UTC' AS $$
 SELECT pg_catalog.jsonb_build_object('destinationCountryCode',scope->'destinationCountryCode','transitCountryCode',scope->'transitCountryCode','citizenshipMode',scope#>'{citizenship,mode}','citizenshipCountryCodes',COALESCE(scope#>'{citizenship,countryCodes}','[]'::jsonb),'credentialOptionMode',scope#>'{credentialOption,mode}','documentType',COALESCE(scope#>'{credentialOption,documentType}','null'::jsonb),'issuingCountryCode',COALESCE(scope#>'{credentialOption,issuingCountryCode}','null'::jsonb),'relatedCitizenshipCountryCode',COALESCE(scope#>'{credentialOption,relatedCitizenshipCountryCode}','null'::jsonb),'relation',CASE WHEN scope#>>'{credentialOption,mode}'='not_applicable' THEN 'not_applicable' WHEN scope#>'{credentialOption,relatedCitizenshipCountryCode}'='null'::jsonb THEN 'unlinked' ELSE 'explicit' END,'residenceMode',scope#>'{residence,mode}','residenceCountryCode',COALESCE(scope#>'{residence,countryCode}','null'::jsonb),'requirementType',scope->'requirementType','validityMode',scope#>'{validity,mode}','travelDate',COALESCE(scope#>'{validity,travelDate}','null'::jsonb))
$$;
CREATE FUNCTION official_provenance_private.scope_key_v2(scope jsonb) RETURNS text LANGUAGE sql IMMUTABLE STRICT SET search_path='' SET timezone='UTC' AS $$
 SELECT 'rule-scope:v1:'||pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(official_provenance_private.ordered_json(official_provenance_private.flat_scope(scope)||'{"v":1}'::jsonb,ARRAY['v','destinationCountryCode','transitCountryCode','citizenshipMode','citizenshipCountryCodes','credentialOptionMode','documentType','issuingCountryCode','relatedCitizenshipCountryCode','relation','residenceMode','residenceCountryCode','requirementType','validityMode','travelDate']),'UTF8')),'hex')
$$;
CREATE FUNCTION official_provenance_private.lookup_v2(scope jsonb,binding jsonb) RETURNS text LANGUAGE sql IMMUTABLE STRICT SET search_path='' SET timezone='UTC' AS $$
 SELECT 'evidence-key:v3:'||pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(official_provenance_private.ordered_json(official_provenance_private.flat_scope(scope)||binding||'{"v":3}'::jsonb,ARRAY['v','sourceId','contentItemId','representationId','destinationCountryCode','transitCountryCode','citizenshipMode','citizenshipCountryCodes','credentialOptionMode','documentType','issuingCountryCode','relatedCitizenshipCountryCode','relation','residenceMode','residenceCountryCode','requirementType','validityMode','travelDate']),'UTF8')),'hex')
$$;
CREATE FUNCTION official_provenance_private.validate_graph_v2(profile text,fingerprint text,receipt_bytes bytea,binding_bytes bytea,artifacts official_provenance_api.artifact_input_v1[]) RETURNS void
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

-- Full semantic joins are recomputed from immutable bytes, independently of TS.
CREATE FUNCTION official_provenance_private.validate_semantics_v2(p jsonb,k jsonb,aa official_provenance_api.artifact_input_v1[]) RETURNS void LANGUAGE plpgsql IMMUTABLE SET search_path='' SET timezone='UTC' AS $$
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
CREATE FUNCTION official_provenance_private.validate_bundle_v2(profile text,fingerprint text,b bytea,k bytea,aa official_provenance_api.artifact_input_v1[]) RETURNS void LANGUAGE plpgsql IMMUTABLE SET search_path='' SET timezone='UTC' AS $$ BEGIN
 PERFORM official_provenance_private.validate_graph_v2(profile,fingerprint,b,k,aa);
 PERFORM official_provenance_private.validate_semantics_v2(official_provenance_private.decode(b,262144),official_provenance_private.decode(k,4096)->'value',aa);
END $$;

ALTER TABLE official_provenance_private.receipts DROP CONSTRAINT receipts_storage_contract_version_check;
ALTER TABLE official_provenance_private.receipts ADD CHECK(storage_contract_version IN (1,2));
CREATE FUNCTION official_provenance_private.closure_v2(fingerprint text) RETURNS official_provenance_api.artifact_input_v1[] LANGUAGE plpgsql STABLE SET search_path='' SET timezone='UTC' AS $$
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
CREATE FUNCTION official_provenance_private.verify_retained_v2(fingerprint text) RETURNS void
LANGUAGE plpgsql STABLE SET search_path = '' SET timezone='UTC' AS $$
DECLARE receipt_bytes bytea; binding_bytes bytea; a official_provenance_api.artifact_input_v1; closure official_provenance_api.artifact_input_v1[]; root record; edge record; expected integer;
BEGIN
 SELECT r.canonical_payload_bytes,b.canonical_bytes INTO receipt_bytes,binding_bytes FROM official_provenance_private.receipts r JOIN official_provenance_private.custody_bindings k USING(record_fingerprint) JOIN official_provenance_private.artifact_blobs b ON b.digest=k.binding_digest WHERE r.record_fingerprint=fingerprint;
 PERFORM official_provenance_private.require((SELECT r.storage_contract_version=2 FROM official_provenance_private.receipts r WHERE r.record_fingerprint=fingerprint));
 IF receipt_bytes IS NULL OR binding_bytes IS NULL THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
 PERFORM official_provenance_private.require((SELECT k.binding_schema_version=1 AND pg_catalog.encode(pg_catalog.sha256(binding_bytes),'hex')=k.binding_digest FROM official_provenance_private.custody_bindings k WHERE k.record_fingerprint=fingerprint));
 closure:=official_provenance_private.closure_v2(fingerprint);
 PERFORM official_provenance_private.validate_bundle_v2('ot-integrated-pilot-local-closure-v2',fingerprint,receipt_bytes,binding_bytes,closure);
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

CREATE FUNCTION official_provenance_private.verify_artifact_retained_v2(id text,version bigint,digest_value text) RETURNS void LANGUAGE plpgsql STABLE SET search_path='' SET timezone='UTC' AS $$
DECLARE a official_provenance_api.artifact_input_v1; complete boolean;
BEGIN
 SELECT ar.artifact_id,ar.artifact_version,ar.digest,ar.artifact_type,ar.byte_contract_family,ar.artifact_contract_version,b.canonical_bytes INTO a FROM official_provenance_private.artifacts ar JOIN official_provenance_private.artifact_blobs b USING(digest) WHERE (ar.artifact_id,ar.artifact_version,ar.digest)=(id,version,digest_value);
 IF a IS NULL THEN RAISE EXCEPTION 'existing_integrity_failure';END IF;
 PERFORM official_provenance_private.require(EXISTS(SELECT 1 FROM official_provenance_private.artifact_names n WHERE (n.artifact_id,n.artifact_type,n.byte_contract_family)=(a.artifact_id,a.artifact_type,a.byte_contract_family)));
 -- Every deferred event still verifies the parent. Derive its bounded, typed edge set once;
 -- compare both directions and inspect all retained target metadata without per-edge queries.
 WITH expected AS MATERIALIZED (
  SELECT d.slot,d.pin->>'id' AS target_id,(d.pin->>'version')::bigint AS target_version,d.pin->>'digest' AS target_digest,d.expected_type
  FROM official_provenance_private.artifact_v2(a) d
 ), stored AS MATERIALIZED (
  SELECT e.slot,e.target_id,e.target_version,e.target_digest FROM official_provenance_private.artifact_dependencies e
  WHERE (e.parent_id,e.parent_version,e.parent_digest)=(id,version,digest_value)
 ), differences AS (
  (SELECT e.slot,e.target_id,e.target_version,e.target_digest FROM expected e EXCEPT SELECT s.slot,s.target_id,s.target_version,s.target_digest FROM stored s)
  UNION ALL
  (SELECT s.slot,s.target_id,s.target_version,s.target_digest FROM stored s EXCEPT SELECT e.slot,e.target_id,e.target_version,e.target_digest FROM expected e)
 ) SELECT NOT EXISTS(SELECT 1 FROM differences) AND NOT EXISTS(
  SELECT 1 FROM expected e
  LEFT JOIN official_provenance_private.artifacts ar ON (ar.artifact_id,ar.artifact_version,ar.digest)=(e.target_id,e.target_version,e.target_digest)
   AND ar.artifact_type=e.expected_type AND ar.artifact_contract_version=1
   AND ar.byte_contract_family=CASE WHEN e.expected_type='global_cell' THEN 'global_definition_v1' WHEN e.expected_type LIKE '%V1' THEN 'custody_v1' ELSE 'manifest_v1' END
  LEFT JOIN official_provenance_private.artifact_names n ON (n.artifact_id,n.artifact_type,n.byte_contract_family)=(ar.artifact_id,ar.artifact_type,ar.byte_contract_family)
  LEFT JOIN official_provenance_private.artifact_blobs b ON b.digest=ar.digest
  WHERE ar.artifact_id IS NULL OR n.artifact_id IS NULL OR b.digest IS NULL
 ) INTO complete;
 PERFORM official_provenance_private.require(complete);
END $$;
CREATE FUNCTION official_provenance_private.verify_root_links_v2(fingerprint text) RETURNS void LANGUAGE plpgsql STABLE SET search_path='' SET timezone='UTC' AS $$
DECLARE b bytea;k bytea;expected integer;edge record;
BEGIN
 SELECT r.canonical_payload_bytes,bb.canonical_bytes INTO b,k FROM official_provenance_private.receipts r JOIN official_provenance_private.custody_bindings cb USING(record_fingerprint) JOIN official_provenance_private.artifact_blobs bb ON bb.digest=cb.binding_digest WHERE r.record_fingerprint=fingerprint;
 PERFORM official_provenance_private.require(b IS NOT NULL AND k IS NOT NULL);
 SELECT pg_catalog.count(*) INTO expected FROM official_provenance_private.receipt_roots(official_provenance_private.decode(b,262144));
 PERFORM official_provenance_private.require((SELECT pg_catalog.count(*) FROM official_provenance_private.receipt_dependencies e WHERE e.record_fingerprint=fingerprint)=expected AND(SELECT pg_catalog.count(*) FROM official_provenance_private.custody_dependencies e WHERE e.record_fingerprint=fingerprint)=3);
 FOR edge IN SELECT * FROM official_provenance_private.receipt_roots(official_provenance_private.decode(b,262144)) LOOP PERFORM official_provenance_private.require(EXISTS(SELECT 1 FROM official_provenance_private.receipt_dependencies e WHERE e.record_fingerprint=fingerprint AND e.root_slot=edge.slot AND e.target_id=edge.pin->>'id' AND e.target_version=(edge.pin->>'version')::bigint AND e.target_digest=edge.pin->>'digest'));END LOOP;
 FOR edge IN SELECT * FROM official_provenance_private.binding_roots(official_provenance_private.decode(k,4096),fingerprint) LOOP PERFORM official_provenance_private.require(EXISTS(SELECT 1 FROM official_provenance_private.custody_dependencies e WHERE e.record_fingerprint=fingerprint AND e.binding_slot=edge.slot AND e.target_id=edge.pin->>'id' AND e.target_version=(edge.pin->>'version')::bigint AND e.target_digest=edge.pin->>'digest'));END LOOP;
END $$;
CREATE FUNCTION official_provenance_private.artifact_constraint_v2() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $$
DECLARE id text;version bigint;digest text;linked boolean;
BEGIN
 IF TG_TABLE_NAME='artifacts' THEN id:=NEW.artifact_id;version:=NEW.artifact_version;digest:=NEW.digest;ELSE id:=NEW.parent_id;version:=NEW.parent_version;digest:=NEW.parent_digest;END IF;
 WITH RECURSIVE parents(id,version,digest) AS (
  SELECT id COLLATE "C",version,digest COLLATE "C"
  UNION SELECT e.parent_id,e.parent_version,e.parent_digest FROM official_provenance_private.artifact_dependencies e JOIN parents p ON (e.target_id,e.target_version,e.target_digest)=(p.id,p.version,p.digest)
 ) SELECT EXISTS(SELECT 1 FROM parents p JOIN official_provenance_private.receipt_dependencies e ON(e.target_id,e.target_version,e.target_digest)=(p.id,p.version,p.digest) JOIN official_provenance_private.receipts r USING(record_fingerprint) WHERE r.storage_contract_version=2) OR EXISTS(SELECT 1 FROM parents p JOIN official_provenance_private.custody_dependencies e ON(e.target_id,e.target_version,e.target_digest)=(p.id,p.version,p.digest) JOIN official_provenance_private.receipts r USING(record_fingerprint) WHERE r.storage_contract_version=2) INTO linked;
 IF linked THEN PERFORM official_provenance_private.verify_artifact_retained_v2(id,version,digest);END IF;RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER artifact_complete_v2 AFTER INSERT ON official_provenance_private.artifacts DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION official_provenance_private.artifact_constraint_v2();
CREATE CONSTRAINT TRIGGER artifact_links_complete_v2 AFTER INSERT ON official_provenance_private.artifact_dependencies DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION official_provenance_private.artifact_constraint_v2();
CREATE OR REPLACE FUNCTION official_provenance_private.receipt_constraint() RETURNS trigger LANGUAGE plpgsql SET search_path='' SET timezone='UTC' AS $$
BEGIN
 IF (SELECT r.storage_contract_version FROM official_provenance_private.receipts r WHERE r.record_fingerprint=NEW.record_fingerprint)=2 THEN IF TG_TABLE_NAME='receipts' THEN PERFORM official_provenance_private.verify_retained_v2(NEW.record_fingerprint);ELSE PERFORM official_provenance_private.verify_root_links_v2(NEW.record_fingerprint);END IF;
 ELSE PERFORM official_provenance_private.verify_retained(NEW.record_fingerprint);END IF;RETURN NEW;
END $$;
CREATE FUNCTION official_provenance_api.publish_local_integrated_v2(profile text,storage_version smallint,mode text,fingerprint text,receipt_bytes bytea,binding_bytes bytea,submitted official_provenance_api.artifact_input_v1[])
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER PARALLEL UNSAFE SET search_path = '' SET timezone='UTC' AS $$
DECLARE a official_provenance_api.artifact_input_v1; existing official_provenance_api.artifact_input_v1; edge record; root record; blob bytea; digest_value text; new_objects official_provenance_api.artifact_input_v1[] := '{}'; receipt jsonb; binding jsonb;
BEGIN
 IF storage_version IS NULL OR storage_version<>2 OR profile IS DISTINCT FROM 'ot-integrated-pilot-local-closure-v2' OR mode IS NULL OR mode<>ALL(ARRAY['create_or_verify','verify_existing']) OR pg_catalog.current_setting('transaction_isolation')<>'read committed' OR pg_catalog.current_setting('transaction_read_only')<>'off' THEN RAISE EXCEPTION 'invalid_input'; END IF;
 PERFORM official_provenance_private.validate_bundle_v2(profile,fingerprint,receipt_bytes,binding_bytes,submitted);
 PERFORM pg_catalog.pg_advisory_xact_lock(1869901924,1);
 -- Every store read happens after the lock in a fresh READ COMMITTED command.
 SELECT r.canonical_payload_bytes INTO blob FROM official_provenance_private.receipts r WHERE r.record_fingerprint=fingerprint;
 IF FOUND THEN
  IF blob<>receipt_bytes THEN RAISE EXCEPTION 'conflicting_identity'; END IF;
  SELECT b.canonical_bytes INTO blob FROM official_provenance_private.custody_bindings k JOIN official_provenance_private.artifact_blobs b ON b.digest=k.binding_digest WHERE k.record_fingerprint=fingerprint;
  IF NOT FOUND THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
  IF blob<>binding_bytes THEN RAISE EXCEPTION 'conflicting_identity'; END IF;
  PERFORM official_provenance_private.verify_retained_v2(fingerprint);
  FOREACH a IN ARRAY submitted LOOP
   SELECT r.artifact_id,r.artifact_version,r.digest,r.artifact_type,r.byte_contract_family,r.artifact_contract_version,b.canonical_bytes INTO existing FROM official_provenance_private.artifacts r JOIN official_provenance_private.artifact_blobs b USING(digest) WHERE (r.artifact_id,r.artifact_version)=(a.artifact_id,a.artifact_version);
   IF existing IS DISTINCT FROM a THEN RAISE EXCEPTION 'conflicting_identity'; END IF;
  END LOOP;
  RETURN 'idempotent';
 END IF;
 IF mode='verify_existing' THEN RAISE EXCEPTION 'existing_receipt_absent'; END IF;
 IF EXISTS(SELECT 1 FROM official_provenance_private.custody_bindings k WHERE k.record_fingerprint=fingerprint) THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
 FOREACH a IN ARRAY submitted LOOP
  SELECT r.artifact_id,r.artifact_version,r.digest,r.artifact_type,r.byte_contract_family,r.artifact_contract_version,b.canonical_bytes INTO existing FROM official_provenance_private.artifacts r JOIN official_provenance_private.artifact_blobs b USING(digest) WHERE (r.artifact_id,r.artifact_version)=(a.artifact_id,a.artifact_version);
  IF FOUND THEN
   IF existing IS DISTINCT FROM a THEN RAISE EXCEPTION 'conflicting_identity'; END IF;
   PERFORM official_provenance_private.verify_artifact_retained_v2(a.artifact_id,a.artifact_version,a.digest);
  ELSE
   IF EXISTS(SELECT 1 FROM official_provenance_private.artifacts r WHERE (r.artifact_id,r.artifact_version)=(a.artifact_id,a.artifact_version)) THEN RAISE EXCEPTION 'existing_integrity_failure'; END IF;
   IF EXISTS(SELECT 1 FROM official_provenance_private.artifact_names n WHERE n.artifact_id=a.artifact_id AND (n.artifact_type,n.byte_contract_family)<>(a.artifact_type,a.byte_contract_family)) THEN RAISE EXCEPTION 'conflicting_identity'; END IF;
   IF EXISTS(SELECT 1 FROM official_provenance_private.artifact_dependencies e WHERE (e.target_id,e.target_version,e.target_digest)=(a.artifact_id,a.artifact_version,a.digest)) OR EXISTS(SELECT 1 FROM official_provenance_private.receipt_dependencies e WHERE (e.target_id,e.target_version,e.target_digest)=(a.artifact_id,a.artifact_version,a.digest)) OR EXISTS(SELECT 1 FROM official_provenance_private.custody_dependencies e WHERE (e.target_id,e.target_version,e.target_digest)=(a.artifact_id,a.artifact_version,a.digest)) THEN RAISE EXCEPTION 'existing_integrity_failure';END IF;
   IF NOT EXISTS(SELECT 1 FROM official_provenance_private.artifact_names n WHERE n.artifact_id=a.artifact_id) AND EXISTS(SELECT 1 FROM official_provenance_private.artifacts ar WHERE ar.artifact_id=a.artifact_id) THEN RAISE EXCEPTION 'existing_integrity_failure';END IF;
   new_objects:=new_objects||a;
  END IF;
  SELECT b.canonical_bytes INTO blob FROM official_provenance_private.artifact_blobs b WHERE b.digest=a.digest;
  IF FOUND AND blob<>a.canonical_bytes THEN RAISE EXCEPTION 'conflicting_identity'; END IF;
 END LOOP;
 digest_value:=pg_catalog.encode(pg_catalog.sha256(binding_bytes),'hex');
 SELECT b.canonical_bytes INTO blob FROM official_provenance_private.artifact_blobs b WHERE b.digest=digest_value;
 IF FOUND AND blob<>binding_bytes THEN RAISE EXCEPTION 'conflicting_identity'; END IF;
 FOR a IN SELECT * FROM pg_catalog.unnest(new_objects) x ORDER BY x.artifact_id,x.artifact_version LOOP
  IF NOT EXISTS(SELECT 1 FROM official_provenance_private.artifact_names n WHERE n.artifact_id=a.artifact_id) THEN INSERT INTO official_provenance_private.artifact_names VALUES(a.artifact_id,a.artifact_type,a.byte_contract_family); END IF;
 END LOOP;
 FOR a IN SELECT * FROM pg_catalog.unnest(new_objects) x ORDER BY x.digest LOOP
  IF NOT EXISTS(SELECT 1 FROM official_provenance_private.artifact_blobs b WHERE b.digest=a.digest) THEN INSERT INTO official_provenance_private.artifact_blobs VALUES(a.digest,a.canonical_bytes); END IF;
 END LOOP;
 FOR a IN SELECT * FROM pg_catalog.unnest(new_objects) x ORDER BY x.artifact_id,x.artifact_version LOOP INSERT INTO official_provenance_private.artifacts VALUES(a.artifact_id,a.artifact_version,a.digest,a.artifact_type,a.byte_contract_family,a.artifact_contract_version); END LOOP;
 FOR a IN SELECT * FROM pg_catalog.unnest(new_objects) x ORDER BY x.artifact_id,x.artifact_version LOOP
  FOR edge IN SELECT * FROM official_provenance_private.artifact_v2(a) ORDER BY slot LOOP INSERT INTO official_provenance_private.artifact_dependencies VALUES(a.artifact_id,a.artifact_version,a.digest,edge.slot,edge.pin->>'id',(edge.pin->>'version')::bigint,edge.pin->>'digest'); END LOOP;
 END LOOP;
 receipt:=official_provenance_private.decode(receipt_bytes,262144); binding:=official_provenance_private.decode(binding_bytes,4096);
 INSERT INTO official_provenance_private.receipts VALUES(fingerprint,receipt_bytes,2,receipt->>'schema',(receipt->>'schemaVersion')::integer,receipt->>'canonicalization');
 FOR root IN SELECT * FROM official_provenance_private.receipt_roots(receipt) ORDER BY slot LOOP INSERT INTO official_provenance_private.receipt_dependencies VALUES(fingerprint,root.slot,root.pin->>'id',(root.pin->>'version')::bigint,root.pin->>'digest'); END LOOP;
 IF NOT EXISTS(SELECT 1 FROM official_provenance_private.artifact_blobs b WHERE b.digest=digest_value) THEN INSERT INTO official_provenance_private.artifact_blobs VALUES(digest_value,binding_bytes); END IF;
 INSERT INTO official_provenance_private.custody_bindings VALUES(fingerprint,digest_value,1);
 FOR root IN SELECT * FROM official_provenance_private.binding_roots(binding,fingerprint) ORDER BY slot LOOP INSERT INTO official_provenance_private.custody_dependencies VALUES(fingerprint,root.slot,root.pin->>'id',(root.pin->>'version')::bigint,root.pin->>'digest'); END LOOP;
 SET CONSTRAINTS official_provenance_private.receipt_complete,official_provenance_private.binding_complete,official_provenance_private.receipt_links_complete,official_provenance_private.custody_links_complete IMMEDIATE;
 PERFORM official_provenance_private.verify_retained_v2(fingerprint);
 RETURN 'inserted';
END $$;
ALTER FUNCTION official_provenance_api.publish_local_integrated_v2(text,smallint,text,text,bytea,bytea,official_provenance_api.artifact_input_v1[]) OWNER TO ot_provenance_write_exec;


CREATE FUNCTION official_provenance_api.read_local_integrated_v2(profile text,fingerprint text)
RETURNS TABLE(row_kind text,record_fingerprint text,storage_contract_version smallint,receipt_schema text,receipt_schema_version integer,canonicalization text,binding_schema_version smallint,object_id text,object_version bigint,object_digest text,artifact_type text,byte_contract_family text,artifact_contract_version integer,canonical_bytes bytea,parent_id text,parent_version bigint,parent_digest text,slot text,target_id text,target_version bigint,target_digest text,status text,detail_code text)
LANGUAGE plpgsql STABLE SECURITY DEFINER PARALLEL UNSAFE SET search_path='' SET timezone='UTC' AS $$
DECLARE closure official_provenance_api.artifact_input_v1[]; a official_provenance_api.artifact_input_v1; r record; e record;
BEGIN
 PERFORM official_provenance_private.require(profile='ot-integrated-pilot-local-closure-v2' AND fingerprint ~ '^ot-provenance-v1:[a-f0-9]{64}$' AND pg_catalog.current_setting('transaction_isolation')='repeatable read' AND pg_catalog.current_setting('transaction_read_only')='on');
 record_fingerprint:=fingerprint;storage_contract_version:=2;
 IF NOT EXISTS(SELECT 1 FROM official_provenance_private.receipts rr WHERE rr.record_fingerprint=fingerprint) THEN row_kind:='read_status';status:='receipt_absent';detail_code:='receipt_absent';RETURN NEXT;RETURN;END IF;
 PERFORM official_provenance_private.verify_retained_v2(fingerprint);closure:=official_provenance_private.closure_v2(fingerprint);
 SELECT * INTO r FROM official_provenance_private.receipts rr WHERE rr.record_fingerprint=fingerprint;
 row_kind:='receipt';record_fingerprint:=fingerprint;storage_contract_version:=r.storage_contract_version;receipt_schema:=r.receipt_schema;receipt_schema_version:=r.receipt_schema_version;canonicalization:=r.canonicalization;canonical_bytes:=r.canonical_payload_bytes;RETURN NEXT;
 receipt_schema:=NULL;receipt_schema_version:=NULL;canonicalization:=NULL;
 SELECT bb.canonical_bytes,k.binding_digest,k.binding_schema_version INTO r FROM official_provenance_private.custody_bindings k JOIN official_provenance_private.artifact_blobs bb ON bb.digest=k.binding_digest WHERE k.record_fingerprint=fingerprint;
 row_kind:='binding';binding_schema_version:=r.binding_schema_version;object_digest:=r.binding_digest;canonical_bytes:=r.canonical_bytes;RETURN NEXT;binding_schema_version:=NULL;
 FOR a IN SELECT * FROM pg_catalog.unnest(closure) ar ORDER BY ar.artifact_id,ar.artifact_version,ar.digest LOOP
  row_kind:='artifact';object_id:=a.artifact_id;object_version:=a.artifact_version;object_digest:=a.digest;artifact_type:=a.artifact_type;byte_contract_family:=a.byte_contract_family;artifact_contract_version:=a.artifact_contract_version;canonical_bytes:=a.canonical_bytes;RETURN NEXT;
 END LOOP;
 object_id:=NULL;object_version:=NULL;object_digest:=NULL;artifact_type:=NULL;byte_contract_family:=NULL;artifact_contract_version:=NULL;canonical_bytes:=NULL;
 FOR e IN SELECT * FROM official_provenance_private.receipt_dependencies rr WHERE rr.record_fingerprint=fingerprint ORDER BY rr.root_slot LOOP
  row_kind:='receipt_link';slot:=e.root_slot;target_id:=e.target_id;target_version:=e.target_version;target_digest:=e.target_digest;RETURN NEXT;
 END LOOP;
 FOR e IN SELECT * FROM official_provenance_private.custody_dependencies rr WHERE rr.record_fingerprint=fingerprint ORDER BY rr.binding_slot LOOP
  row_kind:='binding_link';slot:=e.binding_slot;target_id:=e.target_id;target_version:=e.target_version;target_digest:=e.target_digest;RETURN NEXT;
 END LOOP;
 FOR e IN SELECT d.* FROM official_provenance_private.artifact_dependencies d JOIN pg_catalog.unnest(closure) ar ON (d.parent_id,d.parent_version,d.parent_digest)=(ar.artifact_id,ar.artifact_version,ar.digest) ORDER BY d.parent_id,d.parent_version,d.slot LOOP
  row_kind:='artifact_link';parent_id:=e.parent_id;parent_version:=e.parent_version;parent_digest:=e.parent_digest;slot:=e.slot;target_id:=e.target_id;target_version:=e.target_version;target_digest:=e.target_digest;RETURN NEXT;
 END LOOP;
 parent_id:=NULL;parent_version:=NULL;parent_digest:=NULL;slot:=NULL;target_id:=NULL;target_version:=NULL;target_digest:=NULL;row_kind:='read_status';status:='complete';RETURN NEXT;
END $$;
ALTER FUNCTION official_provenance_api.read_local_integrated_v2(text,text) OWNER TO ot_provenance_read_exec;
DO $$ DECLARE routine record; BEGIN
 FOR routine IN SELECT p.oid::pg_catalog.regprocedure AS signature FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='official_provenance_private' LOOP
  EXECUTE pg_catalog.format('ALTER FUNCTION %s OWNER TO ot_provenance_ddl',routine.signature);
 END LOOP;
END $$;
ALTER FUNCTION official_provenance_private.artifact_constraint_v2() OWNER TO ot_provenance_write_exec;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA official_provenance_private,official_provenance_api FROM PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA official_provenance_private TO ot_provenance_write_exec;
GRANT EXECUTE ON FUNCTION official_provenance_api.publish_local_integrated_v2(text,smallint,text,text,bytea,bytea,official_provenance_api.artifact_input_v1[]) TO ot_provenance_writer;
GRANT EXECUTE ON FUNCTION official_provenance_api.read_local_integrated_v2(text,text) TO ot_provenance_reader;
GRANT EXECUTE ON FUNCTION official_provenance_private.utf16_length(text) TO ot_provenance_read_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.require(boolean) TO ot_provenance_read_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.h(text,jsonb) TO ot_provenance_read_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.ordered_json(jsonb,text[]) TO ot_provenance_read_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.typed(jsonb,text) TO ot_provenance_read_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.derived_edges_v2(text,jsonb) TO ot_provenance_read_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.artifact_v2(official_provenance_api.artifact_input_v1) TO ot_provenance_read_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.content_v2(official_provenance_api.artifact_input_v1[],jsonb,text) TO ot_provenance_read_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.semantic_contract_v2(official_provenance_api.artifact_input_v1[],jsonb,text) TO ot_provenance_read_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.flat_scope(jsonb) TO ot_provenance_read_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.scope_key_v2(jsonb) TO ot_provenance_read_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.lookup_v2(jsonb,jsonb) TO ot_provenance_read_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.validate_graph_v2(text,text,bytea,bytea,official_provenance_api.artifact_input_v1[]) TO ot_provenance_read_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.validate_semantics_v2(jsonb,jsonb,official_provenance_api.artifact_input_v1[]) TO ot_provenance_read_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.validate_bundle_v2(text,text,bytea,bytea,official_provenance_api.artifact_input_v1[]) TO ot_provenance_read_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.closure_v2(text) TO ot_provenance_read_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.verify_retained_v2(text) TO ot_provenance_read_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.verify_artifact_retained_v2(text,bigint,text) TO ot_provenance_read_exec;
GRANT EXECUTE ON FUNCTION official_provenance_private.sorted_unique(jsonb),official_provenance_private.codec_invariants_v2(jsonb,text) TO ot_provenance_read_exec;
-- R3 pure role-specific URL validators are required by retained semantic reads.
GRANT EXECUTE ON FUNCTION official_provenance_private.canonical_url(text,text),official_provenance_private.url_host(text),official_provenance_private.url_alabel(text),official_provenance_private.url_unicode_set(text) TO ot_provenance_read_exec;
COMMIT;
