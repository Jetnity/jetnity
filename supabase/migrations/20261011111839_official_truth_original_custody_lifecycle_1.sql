-- UNAPPLIED CODE-ONLY CANDIDATE. No real-source admission or application grants.
-- Requires the existing eight-table integrated provenance V2 implementation at
-- invocation time. Its local-only installation is NOT promoted by this artifact.
-- This extension stores no fact: a Rule version is the existing receipt identity.
BEGIN;
CREATE ROLE ot_original_producer NOLOGIN NOSUPERUSER NOBYPASSRLS NOINHERIT;
CREATE ROLE ot_original_reviewer NOLOGIN NOSUPERUSER NOBYPASSRLS NOINHERIT;
CREATE ROLE ot_original_reader NOLOGIN NOSUPERUSER NOBYPASSRLS NOINHERIT;
CREATE ROLE ot_original_lifecycle NOLOGIN NOSUPERUSER NOBYPASSRLS NOINHERIT;
CREATE SCHEMA official_original_private;
CREATE SCHEMA official_original_api;
REVOKE ALL ON SCHEMA official_original_private, official_original_api FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA official_original_private, official_original_api REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- No RPC can admit a source. This candidate can only describe the reserved
-- synthetic conformance corpus; changing this restriction requires a new review.
CREATE TABLE official_original_private.admissions (
 binding jsonb PRIMARY KEY,
 media_type text NOT NULL CHECK(media_type='application/json'),
 canonical_url text NOT NULL CHECK(canonical_url ~ '^https://regulations[.]example/rules/(primary_rule|composed_effect|composed_mode)$'),
 protocol smallint NOT NULL CHECK(protocol=1),
 max_bytes integer NOT NULL CHECK(max_bytes BETWEEN 1 AND 65536),
 lifetime_seconds integer NOT NULL CHECK(lifetime_seconds BETWEEN 1 AND 2592000),
 freshness_seconds integer NOT NULL CHECK(freshness_seconds BETWEEN 1 AND 2592000),
 CHECK(pg_catalog.jsonb_typeof(binding)='object'
  AND binding ?& ARRAY['sourceId','contentItemId','contentItemVersion','representationId','representationVersion','identityProfileId','identityProfileVersion']
  AND binding-ARRAY['sourceId','contentItemId','contentItemVersion','representationId','representationVersion','identityProfileId','identityProfileVersion']='{}'::jsonb
  AND binding->'contentItemVersion'='1'::jsonb AND binding->'representationVersion'='1'::jsonb AND binding->'identityProfileVersion'='1'::jsonb
  AND binding->>'representationId'='json'
  AND binding->>'contentItemId' IN ('primary_rule','composed_effect','composed_mode')
  AND canonical_url='https://regulations.example/rules/'||(binding->>'contentItemId')),
 CHECK(binding->>'sourceId'='synthetic-pilot-authority'),
 CHECK(binding->>'identityProfileId'='synthetic-pilot-whole-response')
);
CREATE TABLE official_original_private.reviews (
 review_id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
 fingerprint text NOT NULL UNIQUE CHECK(fingerprint ~ '^ot-provenance-v1:[a-f0-9]{64}$'),
 packet_key text NOT NULL CHECK(packet_key ~ '^review-packet:v3:[a-f0-9]{64}$'),
 ordered_supports jsonb NOT NULL,
 authority text NOT NULL DEFAULT 'synthetic-local-review-v1' CHECK(authority='synthetic-local-review-v1'),
 reviewed_at timestamptz NOT NULL DEFAULT pg_catalog.clock_timestamp()
);
CREATE TABLE official_original_private.rule_bindings (
 fingerprint text PRIMARY KEY REFERENCES official_original_private.reviews(fingerprint),
 review_id uuid NOT NULL UNIQUE REFERENCES official_original_private.reviews,
 accepted_at timestamptz NOT NULL DEFAULT pg_catalog.clock_timestamp(),
 UNIQUE(fingerprint,review_id)
);
CREATE TABLE official_original_private.originals (
 original_pin uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
 evidence_version text NOT NULL UNIQUE,
 support jsonb NOT NULL,
 raw_digest text NOT NULL CHECK(raw_digest ~ '^[a-f0-9]{64}$'),
 byte_count integer NOT NULL CHECK(byte_count BETWEEN 1 AND 131072),
 captured_at timestamptz NOT NULL,
 expires_at timestamptz NOT NULL CHECK(expires_at > captured_at AND expires_at <= captured_at + interval '30 days'),
 freshness_until timestamptz NOT NULL CHECK(freshness_until > captured_at AND freshness_until <= captured_at + interval '30 days'),
 key_id text NOT NULL CHECK(key_id='synthetic-ephemeral-key-v1'),
 binding jsonb NOT NULL REFERENCES official_original_private.admissions,
 UNIQUE(original_pin,evidence_version),
 CHECK(evidence_version=support->>'versionId')
);
CREATE TABLE official_original_private.ciphertexts (
 original_pin uuid PRIMARY KEY REFERENCES official_original_private.originals,
 encrypted_bytes bytea NOT NULL CHECK(pg_catalog.octet_length(encrypted_bytes) BETWEEN 1 AND 132096)
);
CREATE TABLE official_original_private.supports (
 fingerprint text NOT NULL REFERENCES official_original_private.rule_bindings,
 position integer NOT NULL CHECK(position BETWEEN 0 AND 7),
 evidence_version text NOT NULL,
 original_pin uuid NOT NULL,
 PRIMARY KEY(fingerprint,position), UNIQUE(fingerprint,evidence_version),
 FOREIGN KEY(original_pin,evidence_version) REFERENCES official_original_private.originals(original_pin,evidence_version)
);
CREATE TABLE official_original_private.events (
 sequence bigint PRIMARY KEY CHECK(sequence BETWEEN 1 AND 100000),
 prior_hash text NOT NULL CHECK(prior_hash ~ '^[a-f0-9]{64}$'),
 event_hash text NOT NULL UNIQUE CHECK(event_hash ~ '^[a-f0-9]{64}$'),
 kind text NOT NULL CHECK(kind IN ('accepted','source_withdrawn','profile_withdrawn','withdrawn','conflicted','superseded','expired','disposed')),
 target text NOT NULL CHECK(pg_catalog.octet_length(target) BETWEEN 1 AND 128),
 occurred_at timestamptz NOT NULL
);
CREATE TABLE official_original_private.head (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 sequence bigint NOT NULL CHECK(sequence BETWEEN 0 AND 100000),
 event_hash text NOT NULL CHECK(event_hash ~ '^[a-f0-9]{64}$'),
 checked_at timestamptz NOT NULL
);
INSERT INTO official_original_private.head VALUES(true,0,pg_catalog.repeat('0',64),pg_catalog.clock_timestamp());

CREATE FUNCTION official_original_private.immutable() RETURNS trigger
LANGUAGE plpgsql SET search_path='' SET timezone='UTC' AS $$ BEGIN RAISE EXCEPTION 'immutable_history' USING ERRCODE='55000'; END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['admissions','reviews','rule_bindings','originals','supports','events'] LOOP
  EXECUTE pg_catalog.format('CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_original_private.%I FOR EACH ROW EXECUTE FUNCTION official_original_private.immutable()',t);
  EXECUTE pg_catalog.format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_original_private.%I FOR EACH STATEMENT EXECUTE FUNCTION official_original_private.immutable()',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['admissions','reviews','rule_bindings','originals','ciphertexts','supports','events','head'] LOOP
  EXECUTE pg_catalog.format('ALTER TABLE official_original_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE pg_catalog.format('ALTER TABLE official_original_private.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE pg_catalog.format('REVOKE ALL ON official_original_private.%I FROM PUBLIC',t);
 END LOOP;
END $$;

-- Reuse protocol V2 unchanged. Protocol V1 is the existing CRLF-normalized SHA256
-- with a stricter transport-byte ceiling; neither helper grants profile authority.
CREATE FUNCTION official_original_private.source_hash(body bytea,support jsonb,max_bytes integer) RETURNS text
LANGUAGE plpgsql IMMUTABLE STRICT SET search_path='' SET timezone='UTC' AS $$
DECLARE value text; b jsonb:=support->'binding'; protocol integer:=COALESCE((support->>'sourceFingerprintProtocol')::integer,1);
BEGIN
 IF max_bytes NOT BETWEEN 1 AND 131072 OR pg_catalog.octet_length(body) NOT BETWEEN 1 AND max_bytes
 OR (protocol=1 AND pg_catalog.octet_length(body)>65536) OR protocol NOT IN (1,2) THEN
  RAISE EXCEPTION 'body_bound' USING ERRCODE='22023'; END IF;
 value:=pg_catalog.convert_from(body,'UTF8');
 IF pg_catalog.left(value,1)=pg_catalog.chr(65279) THEN RAISE EXCEPTION 'body_encoding' USING ERRCODE='22023'; END IF;
 IF protocol=2 THEN RETURN private.official_truth_source_fingerprint_v2(b->>'sourceId',b->>'contentItemId',(b->>'contentItemVersion')::integer,
  b->>'representationId',(b->>'representationVersion')::integer,b->>'identityProfileId',(b->>'identityProfileVersion')::integer,
  support->>'canonicalFinalUrl',support->>'contentType',value); END IF;
 RETURN pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.replace(pg_catalog.replace(value,E'\r\n',E'\n'),E'\r',E'\n'),'UTF8')),'hex');
END $$;

CREATE FUNCTION official_original_private.check_head(expected_sequence bigint,expected_hash text) RETURNS void
LANGUAGE plpgsql SET search_path='' SET timezone='UTC' AS $$
DECLARE h official_original_private.head; e record; n bigint:=0; prior text:=pg_catalog.repeat('0',64); calculated text;
BEGIN
 -- A stale repeatable-read snapshot cannot claim current lifecycle authority.
 IF pg_catalog.current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION 'current_snapshot_required' USING ERRCODE='25000'; END IF;
 SELECT * INTO STRICT h FROM official_original_private.head WHERE singleton FOR SHARE;
 IF expected_sequence IS NULL OR expected_hash IS NULL OR h.sequence<>expected_sequence OR h.event_hash<>expected_hash
 OR h.checked_at < pg_catalog.clock_timestamp()-interval '60 seconds' OR h.checked_at>pg_catalog.clock_timestamp() THEN
  RAISE EXCEPTION 'cursor_unavailable' USING ERRCODE='55000'; END IF;
 FOR e IN SELECT * FROM official_original_private.events ORDER BY sequence LOOP
  n:=n+1;
  calculated:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_array(e.sequence,e.prior_hash,e.kind,e.target,e.occurred_at)::text,'UTF8')),'hex');
  IF e.sequence<>n OR e.prior_hash<>prior OR e.event_hash<>calculated THEN RAISE EXCEPTION 'history_incomplete' USING ERRCODE='55000'; END IF;
  prior:=e.event_hash;
 END LOOP;
 IF n<>h.sequence OR prior<>h.event_hash THEN RAISE EXCEPTION 'history_incomplete' USING ERRCODE='55000'; END IF;
END $$;
CREATE FUNCTION official_original_private.append_event(kind_ text,target_ text) RETURNS void
LANGUAGE plpgsql SET search_path='' SET timezone='UTC' AS $$
DECLARE h official_original_private.head; stamp timestamptz:=pg_catalog.clock_timestamp(); digest text;
BEGIN
 SELECT * INTO STRICT h FROM official_original_private.head WHERE singleton FOR UPDATE;
 digest:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_array(h.sequence+1,h.event_hash,kind_,target_,stamp)::text,'UTF8')),'hex');
 INSERT INTO official_original_private.events VALUES(h.sequence+1,h.event_hash,digest,kind_,target_,stamp);
 UPDATE official_original_private.head SET sequence=h.sequence+1,event_hash=digest,checked_at=stamp WHERE singleton;
END $$;
CREATE FUNCTION official_original_private.key_check(key_ text) RETURNS void
LANGUAGE plpgsql IMMUTABLE SET search_path='' SET timezone='UTC' AS $$ BEGIN
 IF key_ IS NULL OR key_ !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'invalid_key' USING ERRCODE='22023'; END IF;
END $$;

-- Separate protected review authority. This records no Owner identity and cannot
-- claim AAL2 or real government acceptance. The caller must review the full bundle.
CREATE FUNCTION official_original_api.review(fingerprint_ text,packet_ text,ordered_ jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $$
DECLARE r official_original_private.reviews; item jsonb;
BEGIN
 IF fingerprint_ IS NULL OR packet_ IS NULL OR ordered_ IS NULL OR pg_catalog.jsonb_typeof(ordered_)<>'array'
 OR pg_catalog.jsonb_array_length(ordered_) NOT BETWEEN 1 AND 8 THEN RAISE EXCEPTION 'review_shape' USING ERRCODE='22023'; END IF;
 FOR item IN SELECT value FROM pg_catalog.jsonb_array_elements(ordered_) LOOP
  IF NOT official_provenance_private.keys(item,ARRAY['versionId','rawDigest'])
  OR pg_catalog.jsonb_typeof(item->'versionId') IS DISTINCT FROM 'string' OR pg_catalog.jsonb_typeof(item->'rawDigest') IS DISTINCT FROM 'string' OR item->>'versionId' !~ '^ev2_[a-f0-9]{32}$'
  OR item->>'rawDigest' !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'review_shape' USING ERRCODE='22023'; END IF;
 END LOOP;
 IF (SELECT count(DISTINCT value->>'versionId') FROM pg_catalog.jsonb_array_elements(ordered_))<>pg_catalog.jsonb_array_length(ordered_) THEN RAISE EXCEPTION 'review_shape' USING ERRCODE='22023'; END IF;
 -- Bound metadata too; this candidate is deliberately small and stops at quota.
 LOCK TABLE official_original_private.reviews IN SHARE ROW EXCLUSIVE MODE;
 SELECT * INTO r FROM official_original_private.reviews WHERE fingerprint=fingerprint_;
 IF FOUND THEN
  IF r.packet_key<>packet_ OR r.ordered_supports<>ordered_ THEN RAISE EXCEPTION 'review_conflict' USING ERRCODE='23505'; END IF;
  RETURN r.review_id;
 END IF;
 IF (SELECT count(*) FROM official_original_private.reviews)>=1024 THEN RAISE EXCEPTION 'review_quota' USING ERRCODE='54000'; END IF;
 INSERT INTO official_original_private.reviews(fingerprint,packet_key,ordered_supports) VALUES(fingerprint_,packet_,ordered_) RETURNING review_id INTO r.review_id;
 RETURN r.review_id;
END $$;

CREATE FUNCTION official_original_private.decrypt_original(o official_original_private.originals,key_ text) RETURNS bytea
LANGUAGE plpgsql SET search_path='' SET timezone='UTC' AS $$
DECLARE encrypted bytea; body bytea; prefix bytea;
BEGIN
 SELECT encrypted_bytes INTO encrypted FROM official_original_private.ciphertexts WHERE original_pin=o.original_pin;
 IF encrypted IS NULL THEN RAISE EXCEPTION 'original_absent' USING ERRCODE='55000'; END IF;
 prefix:=pg_catalog.convert_to(o.original_pin::text||':'||o.evidence_version||':'||o.raw_digest||':','UTF8');
 body:=extensions.pgp_sym_decrypt_bytea(encrypted,key_);
 IF pg_catalog.substr(body,1,pg_catalog.octet_length(prefix))<>prefix THEN RAISE EXCEPTION 'cipher_binding' USING ERRCODE='23514'; END IF;
 body:=pg_catalog.substr(body,pg_catalog.octet_length(prefix)+1);
 IF pg_catalog.octet_length(body)<>o.byte_count OR pg_catalog.encode(pg_catalog.sha256(body),'hex')<>o.raw_digest
 OR official_original_private.source_hash(body,o.support,o.byte_count) IS DISTINCT FROM o.support->>'sourceContentHash' THEN
  RAISE EXCEPTION 'original_mismatch' USING ERRCODE='23514'; END IF;
 RETURN body;
END $$;

CREATE FUNCTION official_original_api.read_candidate(fingerprint_ text,key_ text,sequence_ bigint,hash_ text)
RETURNS TABLE(ordinal integer,original_pin uuid,evidence_version text,raw_digest text,original_bytes bytea)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $$
DECLARE payload jsonb; r official_original_private.reviews; row_ record; original_ official_original_private.originals; expected jsonb; n integer:=0; body bytea; stamp timestamptz:=pg_catalog.clock_timestamp();
BEGIN
 PERFORM official_original_private.key_check(key_);
 PERFORM official_original_private.check_head(sequence_,hash_);
 PERFORM official_provenance_private.verify_retained_v2(fingerprint_);
 SELECT pg_catalog.convert_from(canonical_payload_bytes,'UTF8')::jsonb INTO STRICT payload FROM official_provenance_private.receipts WHERE record_fingerprint=fingerprint_;
 SELECT v.* INTO STRICT r FROM official_original_private.rule_bindings b JOIN official_original_private.reviews v ON (b.review_id=v.review_id AND b.fingerprint=v.fingerprint) WHERE b.fingerprint=fingerprint_;
 IF r.packet_key IS DISTINCT FROM payload#>>'{proof,reviewPacketKey}' OR r.reviewed_at>stamp
 OR pg_catalog.jsonb_array_length(r.ordered_supports)<>pg_catalog.jsonb_array_length(payload->'supports') THEN RAISE EXCEPTION 'review_incomplete' USING ERRCODE='55000'; END IF;
 IF (SELECT count(*) FROM official_original_private.events WHERE kind='accepted' AND target=fingerprint_)<>1
 OR EXISTS(SELECT 1 FROM official_original_private.events WHERE target=fingerprint_ AND kind IN ('withdrawn','conflicted','superseded','expired')) THEN
  RAISE EXCEPTION 'rule_unavailable' USING ERRCODE='55000'; END IF;
 FOR row_ IN SELECT s.position AS ordinal,o.* FROM official_original_private.supports s JOIN official_original_private.originals o USING(original_pin,evidence_version) WHERE s.fingerprint=fingerprint_ ORDER BY s.position LOOP
  expected:=payload->'supports'->n;
  IF row_.ordinal<>n OR row_.support IS DISTINCT FROM expected OR r.ordered_supports->n IS DISTINCT FROM pg_catalog.jsonb_build_object('versionId',row_.evidence_version,'rawDigest',row_.raw_digest)
  OR row_.captured_at IS DISTINCT FROM (expected->>'acceptedRetrievedAt')::timestamptz THEN RAISE EXCEPTION 'support_incomplete' USING ERRCODE='55000'; END IF;
  stamp:=pg_catalog.clock_timestamp();
  IF row_.captured_at>stamp OR stamp>=row_.expires_at OR stamp>=row_.freshness_until
   OR (expected->>'validFrom' IS NOT NULL AND (stamp AT TIME ZONE 'UTC')::date<(expected->>'validFrom')::date)
   OR (expected->>'validUntil' IS NOT NULL AND (stamp AT TIME ZONE 'UTC')::date>(expected->>'validUntil')::date)
   OR EXISTS(SELECT 1 FROM official_original_private.events WHERE
     (kind='source_withdrawn' AND target=expected#>>'{binding,sourceId}') OR
     (kind='profile_withdrawn' AND target=(expected#>>'{binding,identityProfileId}')||':'||(expected#>>'{binding,identityProfileVersion}'))) THEN
   RAISE EXCEPTION 'source_unavailable' USING ERRCODE='55000'; END IF;
  SELECT * INTO STRICT original_ FROM official_original_private.originals WHERE originals.original_pin=row_.original_pin;
  body:=official_original_private.decrypt_original(original_,key_);
  ordinal:=n;original_pin:=row_.original_pin;evidence_version:=row_.evidence_version;raw_digest:=row_.raw_digest;original_bytes:=body;RETURN NEXT;
  n:=n+1;
 END LOOP;
 IF n<>pg_catalog.jsonb_array_length(payload->'supports') THEN RAISE EXCEPTION 'support_incomplete' USING ERRCODE='55000'; END IF;
END $$;

CREATE FUNCTION official_original_private.quota(support_ jsonb,bytes_ integer) RETURNS void
LANGUAGE plpgsql SET search_path='' SET timezone='UTC' AS $$ BEGIN
 PERFORM 1 FROM official_original_private.head WHERE singleton FOR UPDATE;
 IF bytes_ IS NULL OR bytes_ NOT BETWEEN 1 AND 131072 THEN RAISE EXCEPTION 'body_bound' USING ERRCODE='22023'; END IF;
 IF (SELECT count(*) FROM official_original_private.originals)>=256 OR
  (SELECT count(*) FROM official_original_private.originals WHERE binding->>'sourceId'=support_#>>'{binding,sourceId}' AND captured_at::date=(support_->>'acceptedRetrievedAt')::timestamptz::date)>=32 OR
  (SELECT COALESCE(sum(byte_count),0) FROM official_original_private.originals JOIN official_original_private.ciphertexts USING(original_pin))+bytes_>4194304 THEN
  RAISE EXCEPTION 'vault_quota' USING ERRCODE='54000'; END IF;
END $$;

-- Must run in the SAME transaction as the existing publish_local_integrated_v2.
-- An independently committed review is a preauthorization, not an accepted Rule.
CREATE FUNCTION official_original_api.bind_candidate(fingerprint_ text,review_ uuid,bodies_ bytea[],key_ text,sequence_ bigint,hash_ text,mode_ text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $$
DECLARE payload jsonb; r official_original_private.reviews; support_ jsonb; a official_original_private.admissions; o official_original_private.originals;
 body bytea; digest text; n integer:=0; stored boolean; stamp timestamptz:=pg_catalog.clock_timestamp(); prefix bytea;
BEGIN
 PERFORM official_original_private.key_check(key_);
 IF mode_ IS NULL OR mode_ NOT IN ('create_or_verify','verify_existing') OR bodies_ IS NULL OR pg_catalog.array_ndims(bodies_)<>1
 OR pg_catalog.array_lower(bodies_,1)<>1 OR pg_catalog.cardinality(bodies_) NOT BETWEEN 1 AND 8 OR pg_catalog.array_position(bodies_,NULL) IS NOT NULL THEN
  RAISE EXCEPTION 'binding_shape' USING ERRCODE='22023'; END IF;
 -- Serialize quota, original identity, acceptance, disposal and revocation.
 PERFORM 1 FROM official_original_private.head WHERE singleton FOR UPDATE;
 PERFORM official_original_private.check_head(sequence_,hash_);
 PERFORM official_provenance_private.verify_retained_v2(fingerprint_);
 SELECT pg_catalog.convert_from(canonical_payload_bytes,'UTF8')::jsonb INTO STRICT payload FROM official_provenance_private.receipts WHERE record_fingerprint=fingerprint_;
 SELECT * INTO STRICT r FROM official_original_private.reviews WHERE fingerprint=fingerprint_ AND review_id=review_;
 IF r.packet_key IS DISTINCT FROM payload#>>'{proof,reviewPacketKey}' OR pg_catalog.cardinality(bodies_)<>pg_catalog.jsonb_array_length(payload->'supports')
 OR pg_catalog.jsonb_array_length(r.ordered_supports)<>pg_catalog.cardinality(bodies_) THEN RAISE EXCEPTION 'review_mismatch' USING ERRCODE='23514'; END IF;
 SELECT EXISTS(SELECT 1 FROM official_original_private.rule_bindings WHERE fingerprint=fingerprint_) INTO stored;
 IF mode_='verify_existing' AND NOT stored THEN RAISE EXCEPTION 'binding_absent' USING ERRCODE='55000'; END IF;
 IF stored THEN
  PERFORM * FROM official_original_api.read_candidate(fingerprint_,key_,sequence_,hash_);
  FOR support_ IN SELECT value FROM pg_catalog.jsonb_array_elements(payload->'supports') LOOP
   n:=n+1;
   SELECT * INTO STRICT o FROM official_original_private.originals WHERE evidence_version=support_->>'versionId';
   IF official_original_private.decrypt_original(o,key_)<>bodies_[n] THEN RAISE EXCEPTION 'original_conflict' USING ERRCODE='23505'; END IF;
  END LOOP;
  RETURN 'idempotent';
 END IF;
 INSERT INTO official_original_private.rule_bindings(fingerprint,review_id) VALUES(fingerprint_,review_);
 FOR support_ IN SELECT value FROM pg_catalog.jsonb_array_elements(payload->'supports') LOOP
  n:=n+1;body:=bodies_[n];digest:=pg_catalog.encode(pg_catalog.sha256(body),'hex');
  SELECT * INTO STRICT a FROM official_original_private.admissions WHERE binding=support_->'binding';
  IF a.canonical_url IS DISTINCT FROM support_->>'canonicalFinalUrl' OR a.media_type IS DISTINCT FROM support_->>'contentType'
   OR a.protocol<>COALESCE((support_->>'sourceFingerprintProtocol')::integer,1)
   OR official_original_private.source_hash(body,support_,a.max_bytes) IS DISTINCT FROM support_->>'sourceContentHash'
   OR r.ordered_supports->(n-1) IS DISTINCT FROM pg_catalog.jsonb_build_object('versionId',support_->>'versionId','rawDigest',digest) THEN
   RAISE EXCEPTION 'source_mismatch' USING ERRCODE='23514'; END IF;
  SELECT * INTO o FROM official_original_private.originals WHERE evidence_version=support_->>'versionId';
  IF FOUND THEN
   IF o.support<>support_ OR o.raw_digest<>digest OR official_original_private.decrypt_original(o,key_)<>body THEN RAISE EXCEPTION 'original_conflict' USING ERRCODE='23505'; END IF;
  ELSE
   PERFORM official_original_private.quota(support_,pg_catalog.octet_length(body));
   INSERT INTO official_original_private.originals(evidence_version,support,raw_digest,byte_count,captured_at,expires_at,freshness_until,key_id,binding)
    VALUES(support_->>'versionId',support_,digest,pg_catalog.octet_length(body),(support_->>'acceptedRetrievedAt')::timestamptz,
     (support_->>'acceptedRetrievedAt')::timestamptz+pg_catalog.make_interval(secs=>a.lifetime_seconds),
     (support_->>'acceptedRetrievedAt')::timestamptz+pg_catalog.make_interval(secs=>a.freshness_seconds),'synthetic-ephemeral-key-v1',support_->'binding') RETURNING * INTO o;
   prefix:=pg_catalog.convert_to(o.original_pin::text||':'||o.evidence_version||':'||digest||':','UTF8');
   INSERT INTO official_original_private.ciphertexts VALUES(o.original_pin,extensions.pgp_sym_encrypt_bytea(prefix||body,key_,'cipher-algo=aes256,compress-algo=0,disable-mdc=0'));
  END IF;
  INSERT INTO official_original_private.supports VALUES(fingerprint_,n-1,support_->>'versionId',o.original_pin);
 END LOOP;
 PERFORM official_original_private.append_event('accepted',fingerprint_);
 -- All validity/revocation checks happen before the surrounding COMMIT.
 PERFORM * FROM official_original_api.read_candidate(fingerprint_,key_,sequence_+1,(SELECT event_hash FROM official_original_private.head WHERE singleton));
 RETURN 'inserted';
END $$;

CREATE FUNCTION official_original_api.lifecycle(kind_ text,target_ text,sequence_ bigint,hash_ text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $$ BEGIN
 PERFORM 1 FROM official_original_private.head WHERE singleton FOR UPDATE;
 PERFORM official_original_private.check_head(sequence_,hash_);
 IF kind_ IS NULL OR target_ IS NULL OR kind_ NOT IN ('source_withdrawn','profile_withdrawn','withdrawn','conflicted','superseded') OR NOT (
  (kind_='source_withdrawn' AND EXISTS(SELECT 1 FROM official_original_private.admissions WHERE binding->>'sourceId'=target_)) OR
  (kind_='profile_withdrawn' AND EXISTS(SELECT 1 FROM official_original_private.admissions WHERE (binding->>'identityProfileId')||':'||(binding->>'identityProfileVersion')=target_)) OR
  (kind_ IN ('withdrawn','conflicted','superseded') AND EXISTS(SELECT 1 FROM official_original_private.rule_bindings WHERE fingerprint=target_))) THEN
  RAISE EXCEPTION 'lifecycle_target' USING ERRCODE='22023'; END IF;
 PERFORM official_original_private.append_event(kind_,target_);
END $$;
CREATE FUNCTION official_original_api.expire(sequence_ bigint,hash_ text) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $$
DECLARE o record; f record; n integer:=0; BEGIN
 PERFORM 1 FROM official_original_private.head WHERE singleton FOR UPDATE;
 PERFORM official_original_private.check_head(sequence_,hash_);
 FOR o IN SELECT v.original_pin FROM official_original_private.originals v JOIN official_original_private.ciphertexts c USING(original_pin) WHERE v.expires_at<=pg_catalog.clock_timestamp() ORDER BY v.original_pin LOOP
  FOR f IN SELECT fingerprint FROM official_original_private.supports WHERE original_pin=o.original_pin ORDER BY fingerprint LOOP
   IF NOT EXISTS(SELECT 1 FROM official_original_private.events WHERE target=f.fingerprint AND kind='expired') THEN PERFORM official_original_private.append_event('expired',f.fingerprint); END IF;
  END LOOP;
  PERFORM official_original_private.append_event('disposed',o.original_pin::text);
  DELETE FROM official_original_private.ciphertexts WHERE original_pin=o.original_pin;
  n:=n+1;
 END LOOP;
 RETURN n;
END $$;
-- The witness is supplied by an independent protected lifecycle authority. Never
-- bootstrap it from restored DB contents. No API here can auto-resume a restore.
CREATE FUNCTION official_original_api.checkpoint(sequence_ bigint,hash_ text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $$ BEGIN
 PERFORM 1 FROM official_original_private.head WHERE singleton FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM official_original_private.head WHERE sequence=sequence_ AND event_hash=hash_) THEN RAISE EXCEPTION 'restore_quarantined' USING ERRCODE='55000'; END IF;
 UPDATE official_original_private.head SET checked_at=pg_catalog.clock_timestamp() WHERE singleton;
 PERFORM official_original_private.check_head(sequence_,hash_);
END $$;
CREATE FUNCTION official_original_api.cursor() RETURNS TABLE(sequence bigint,event_hash text)
LANGUAGE sql SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $$ SELECT sequence,event_hash FROM official_original_private.head WHERE singleton $$;
CREATE FUNCTION official_original_api.health() RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $$
 SELECT pg_catalog.jsonb_build_object('originals',n,'liveBytes',bytes,'maxOriginals',256,'maxLiveBytes',4194304,
 'maxPerSourceDay',32,'perSourceDayLimitReached',day_count>=32,'lifecycleAvailable',checked_at>=pg_catalog.clock_timestamp()-interval '60 seconds',
 'stop',n>=256 OR bytes>=4194304 OR day_count>=32 OR sequence>=100000 OR checked_at<pg_catalog.clock_timestamp()-interval '60 seconds')
 FROM official_original_private.head,
 (SELECT count(*) n FROM official_original_private.originals) a,
 (SELECT COALESCE(sum(byte_count),0) bytes FROM official_original_private.originals JOIN official_original_private.ciphertexts USING(original_pin)) b,
 (SELECT COALESCE(max(n),0) day_count FROM (SELECT count(*) n FROM official_original_private.originals GROUP BY binding->>'sourceId',captured_at::date) d) limits
 WHERE singleton
$$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA official_original_private, official_original_api FROM PUBLIC;
GRANT USAGE ON SCHEMA official_original_api TO ot_original_producer,ot_original_reviewer,ot_original_reader,ot_original_lifecycle;
GRANT EXECUTE ON FUNCTION official_original_api.review(text,text,jsonb) TO ot_original_reviewer;
GRANT EXECUTE ON FUNCTION official_original_api.bind_candidate(text,uuid,bytea[],text,bigint,text,text) TO ot_original_producer;
GRANT EXECUTE ON FUNCTION official_original_api.read_candidate(text,text,bigint,text) TO ot_original_reader;
GRANT EXECUTE ON FUNCTION official_original_api.lifecycle(text,text,bigint,text),official_original_api.expire(bigint,text),official_original_api.checkpoint(bigint,text) TO ot_original_lifecycle;
GRANT EXECUTE ON FUNCTION official_original_api.health() TO ot_original_lifecycle;
GRANT EXECUTE ON FUNCTION official_original_api.cursor() TO ot_original_producer,ot_original_reader,ot_original_lifecycle;
COMMIT;
