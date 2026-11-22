-- Native Dev PG17 test of the EXACT corrected Production P7905 source-subquery.
-- Follows actual immutable V1 collector canonicalization for exactly 19 theme assets.
-- Schema is an isolated, intentionally mutable negative-test fixture, always ROLLBACK.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='30s';
DO $scope$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR to_regnamespace('jetnity_at_prod_v1_asset_safety_20261123') IS NOT NULL
 OR (SELECT count(*) FROM official_v3_at_private.whole_originals_v2)<>3
 THEN RAISE EXCEPTION 'DEV_V1_ASSET_SOURCE_TEST_SCOPE_STOP'; END IF;
END $scope$;
CREATE SCHEMA jetnity_at_prod_v1_asset_safety_20261123;
CREATE TABLE jetnity_at_prod_v1_asset_safety_20261123.source_pins_v1(
 source_id text PRIMARY KEY,original_sha text NOT NULL,original_bytes integer NOT NULL,
 canonical_sha text,normalization text,research_only boolean NOT NULL,source_qualified boolean NOT NULL);
CREATE TABLE jetnity_at_prod_v1_asset_safety_20261123.first_originals_v1(
 source_id text PRIMARY KEY,raw_body bytea NOT NULL,
 raw_sha text GENERATED ALWAYS AS (encode(sha256(raw_body),'hex')) STORED,
 raw_bytes integer GENERATED ALWAYS AS (octet_length(raw_body)) STORED,
 source_state text NOT NULL,legal_source_approved boolean NOT NULL DEFAULT false,
 customer_rule_approved boolean NOT NULL DEFAULT false);
INSERT INTO jetnity_at_prod_v1_asset_safety_20261123.source_pins_v1 VALUES
 ('bmi-visa-nationality-matrix',
 'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',498415,NULL,'none',true,false),
 ('bmi-general-entry',
 'ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e',91655,NULL,'none',true,false),
 ('bmeia-bern-how-to-apply',
 '7ca5618875cf1eccea033e1b851cdd8aea3d1aef80585048f62826c8c5266c18',172460,
 'b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3dcb67a7a3367052a55',
 'bmeia-theme-assets-v1',true,false);
INSERT INTO jetnity_at_prod_v1_asset_safety_20261123.first_originals_v1(source_id,raw_body,source_state)
 SELECT source_id,original_body,'unchanged_exact' FROM official_v3_at_private.whole_originals_v2;
DO $initial_exact$
BEGIN
 IF ((SELECT count(*) FROM jetnity_at_prod_v1_asset_safety_20261123.source_pins_v1 p
    JOIN jetnity_at_prod_v1_asset_safety_20261123.first_originals_v1 o USING(source_id)
    WHERE p.research_only AND NOT p.source_qualified
      AND o.raw_bytes=p.original_bytes AND encode(sha256(o.raw_body),'hex')=o.raw_sha
      AND NOT o.legal_source_approved AND NOT o.customer_rule_approved
      AND (
        -- BMI originals must stay byte-identical and strictly unchanged.
        (p.source_id IN ('bmi-visa-nationality-matrix','bmi-general-entry')
          AND o.source_state='unchanged_exact' AND o.raw_sha=p.original_sha)
        OR
        -- The historic BMEIA original may legitimately differ only in the
        -- 19 theme asset timestamps, as accepted by the existing V1 collector.
        -- Recompute the pinned canonical checksum: never silently relabel
        -- a changed rule, update historical source bytes, or publish a fact.
        (p.source_id='bmeia-bern-how-to-apply'
          AND p.normalization='bmeia-theme-assets-v1'
          AND p.canonical_sha='b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3dcb67a7a3367052a55'
          AND (
            (o.source_state='unchanged_exact' AND o.raw_sha=p.original_sha)
            OR
            (o.source_state='unchanged_asset_version_only'
              AND (SELECT count(*) FROM regexp_matches(convert_from(o.raw_body,'UTF8'),
                    '((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")','g'))=19
              AND encode(sha256(convert_to(regexp_replace(convert_from(o.raw_body,'UTF8'),
                    '((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")',
                    E'\\1TIMESTAMP\\2','g'),'UTF8')),'hex')=p.canonical_sha)
          ))
      ))<>3)
 THEN RAISE EXCEPTION 'DEV_V1_THREE_EXACT_OLD_ORIGINALS_MUST_PASS'; END IF;
END $initial_exact$;
-- The V1 collector stores a full HTML body of unchanged length but with
-- different, website-controlled 10-digit asset timestamps. The collector
-- records status 'unchanged_asset_version_only' ONLY after exact canonical SHA.
UPDATE jetnity_at_prod_v1_asset_safety_20261123.first_originals_v1
SET raw_body=convert_to(regexp_replace(convert_from(raw_body,'UTF8'),
  '((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")',E'\\1'||'0000000000'||E'\\2','g'),'UTF8'),
 source_state='unchanged_asset_version_only'
WHERE source_id='bmeia-bern-how-to-apply';
CREATE TEMP TABLE p7905_valid_asset_copy AS
 SELECT raw_body FROM jetnity_at_prod_v1_asset_safety_20261123.first_originals_v1
 WHERE source_id='bmeia-bern-how-to-apply';
DO $changed_asset_only$
DECLARE raw_sha_diff boolean; canonical_sha_valid boolean; stamp_count integer;
BEGIN
 SELECT o.raw_sha<>p.original_sha,
  encode(sha256(convert_to(regexp_replace(convert_from(o.raw_body,'UTF8'),
    '((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")',E'\\1TIMESTAMP\\2','g'),'UTF8')),'hex')=p.canonical_sha,
  (SELECT count(*) FROM regexp_matches(convert_from(o.raw_body,'UTF8'),'((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")','g'))
 INTO raw_sha_diff,canonical_sha_valid,stamp_count
 FROM jetnity_at_prod_v1_asset_safety_20261123.first_originals_v1 o JOIN jetnity_at_prod_v1_asset_safety_20261123.source_pins_v1 p USING(source_id)
 WHERE o.source_id='bmeia-bern-how-to-apply';
 IF NOT raw_sha_diff OR NOT canonical_sha_valid OR stamp_count<>19 OR ((SELECT count(*) FROM jetnity_at_prod_v1_asset_safety_20261123.source_pins_v1 p
    JOIN jetnity_at_prod_v1_asset_safety_20261123.first_originals_v1 o USING(source_id)
    WHERE p.research_only AND NOT p.source_qualified
      AND o.raw_bytes=p.original_bytes AND encode(sha256(o.raw_body),'hex')=o.raw_sha
      AND NOT o.legal_source_approved AND NOT o.customer_rule_approved
      AND (
        -- BMI originals must stay byte-identical and strictly unchanged.
        (p.source_id IN ('bmi-visa-nationality-matrix','bmi-general-entry')
          AND o.source_state='unchanged_exact' AND o.raw_sha=p.original_sha)
        OR
        -- The historic BMEIA original may legitimately differ only in the
        -- 19 theme asset timestamps, as accepted by the existing V1 collector.
        -- Recompute the pinned canonical checksum: never silently relabel
        -- a changed rule, update historical source bytes, or publish a fact.
        (p.source_id='bmeia-bern-how-to-apply'
          AND p.normalization='bmeia-theme-assets-v1'
          AND p.canonical_sha='b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3dcb67a7a3367052a55'
          AND (
            (o.source_state='unchanged_exact' AND o.raw_sha=p.original_sha)
            OR
            (o.source_state='unchanged_asset_version_only'
              AND (SELECT count(*) FROM regexp_matches(convert_from(o.raw_body,'UTF8'),
                    '((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")','g'))=19
              AND encode(sha256(convert_to(regexp_replace(convert_from(o.raw_body,'UTF8'),
                    '((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")',
                    E'\\1TIMESTAMP\\2','g'),'UTF8')),'hex')=p.canonical_sha)
          ))
      ))<>3)
 THEN RAISE EXCEPTION 'DEV_V1_CORRECT_CANONICAL_ASSET_CASE_MUST_PASS: rawDiff %, canonical %, stampCount %',
   raw_sha_diff,canonical_sha_valid,stamp_count; END IF;
END $changed_asset_only$;
-- A same-length non-asset change must still STOP; never treat actual rule
-- changes as harmless asset timestamps.
UPDATE jetnity_at_prod_v1_asset_safety_20261123.first_originals_v1
SET raw_body=set_byte(raw_body,0,(get_byte(raw_body,0)+1)%256)
WHERE source_id='bmeia-bern-how-to-apply';
DO $tamper$
BEGIN
 IF NOT ((SELECT count(*) FROM jetnity_at_prod_v1_asset_safety_20261123.source_pins_v1 p
    JOIN jetnity_at_prod_v1_asset_safety_20261123.first_originals_v1 o USING(source_id)
    WHERE p.research_only AND NOT p.source_qualified
      AND o.raw_bytes=p.original_bytes AND encode(sha256(o.raw_body),'hex')=o.raw_sha
      AND NOT o.legal_source_approved AND NOT o.customer_rule_approved
      AND (
        -- BMI originals must stay byte-identical and strictly unchanged.
        (p.source_id IN ('bmi-visa-nationality-matrix','bmi-general-entry')
          AND o.source_state='unchanged_exact' AND o.raw_sha=p.original_sha)
        OR
        -- The historic BMEIA original may legitimately differ only in the
        -- 19 theme asset timestamps, as accepted by the existing V1 collector.
        -- Recompute the pinned canonical checksum: never silently relabel
        -- a changed rule, update historical source bytes, or publish a fact.
        (p.source_id='bmeia-bern-how-to-apply'
          AND p.normalization='bmeia-theme-assets-v1'
          AND p.canonical_sha='b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3dcb67a7a3367052a55'
          AND (
            (o.source_state='unchanged_exact' AND o.raw_sha=p.original_sha)
            OR
            (o.source_state='unchanged_asset_version_only'
              AND (SELECT count(*) FROM regexp_matches(convert_from(o.raw_body,'UTF8'),
                    '((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")','g'))=19
              AND encode(sha256(convert_to(regexp_replace(convert_from(o.raw_body,'UTF8'),
                    '((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")',
                    E'\\1TIMESTAMP\\2','g'),'UTF8')),'hex')=p.canonical_sha)
          ))
      ))<>3)
 THEN RAISE EXCEPTION 'DEV_V1_NON_ASSET_BODY_TAMPER_ALLOWED';END IF;
END $tamper$;
UPDATE jetnity_at_prod_v1_asset_safety_20261123.first_originals_v1
SET raw_body=(SELECT raw_body FROM p7905_valid_asset_copy),
 source_state='changed'
WHERE source_id='bmeia-bern-how-to-apply';
DO $invalid_state$
BEGIN
 IF NOT ((SELECT count(*) FROM jetnity_at_prod_v1_asset_safety_20261123.source_pins_v1 p
    JOIN jetnity_at_prod_v1_asset_safety_20261123.first_originals_v1 o USING(source_id)
    WHERE p.research_only AND NOT p.source_qualified
      AND o.raw_bytes=p.original_bytes AND encode(sha256(o.raw_body),'hex')=o.raw_sha
      AND NOT o.legal_source_approved AND NOT o.customer_rule_approved
      AND (
        -- BMI originals must stay byte-identical and strictly unchanged.
        (p.source_id IN ('bmi-visa-nationality-matrix','bmi-general-entry')
          AND o.source_state='unchanged_exact' AND o.raw_sha=p.original_sha)
        OR
        -- The historic BMEIA original may legitimately differ only in the
        -- 19 theme asset timestamps, as accepted by the existing V1 collector.
        -- Recompute the pinned canonical checksum: never silently relabel
        -- a changed rule, update historical source bytes, or publish a fact.
        (p.source_id='bmeia-bern-how-to-apply'
          AND p.normalization='bmeia-theme-assets-v1'
          AND p.canonical_sha='b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3dcb67a7a3367052a55'
          AND (
            (o.source_state='unchanged_exact' AND o.raw_sha=p.original_sha)
            OR
            (o.source_state='unchanged_asset_version_only'
              AND (SELECT count(*) FROM regexp_matches(convert_from(o.raw_body,'UTF8'),
                    '((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")','g'))=19
              AND encode(sha256(convert_to(regexp_replace(convert_from(o.raw_body,'UTF8'),
                    '((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")',
                    E'\\1TIMESTAMP\\2','g'),'UTF8')),'hex')=p.canonical_sha)
          ))
      ))<>3)
 THEN RAISE EXCEPTION 'DEV_V1_CHANGED_STATE_ALLOWED';END IF;
END $invalid_state$;
UPDATE jetnity_at_prod_v1_asset_safety_20261123.first_originals_v1 SET source_state='unchanged_asset_version_only'
 WHERE source_id='bmeia-bern-how-to-apply';
UPDATE jetnity_at_prod_v1_asset_safety_20261123.first_originals_v1 SET legal_source_approved=true
 WHERE source_id='bmeia-bern-how-to-apply';
DO $approval_must_remain_false$
BEGIN
 IF NOT ((SELECT count(*) FROM jetnity_at_prod_v1_asset_safety_20261123.source_pins_v1 p
    JOIN jetnity_at_prod_v1_asset_safety_20261123.first_originals_v1 o USING(source_id)
    WHERE p.research_only AND NOT p.source_qualified
      AND o.raw_bytes=p.original_bytes AND encode(sha256(o.raw_body),'hex')=o.raw_sha
      AND NOT o.legal_source_approved AND NOT o.customer_rule_approved
      AND (
        -- BMI originals must stay byte-identical and strictly unchanged.
        (p.source_id IN ('bmi-visa-nationality-matrix','bmi-general-entry')
          AND o.source_state='unchanged_exact' AND o.raw_sha=p.original_sha)
        OR
        -- The historic BMEIA original may legitimately differ only in the
        -- 19 theme asset timestamps, as accepted by the existing V1 collector.
        -- Recompute the pinned canonical checksum: never silently relabel
        -- a changed rule, update historical source bytes, or publish a fact.
        (p.source_id='bmeia-bern-how-to-apply'
          AND p.normalization='bmeia-theme-assets-v1'
          AND p.canonical_sha='b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3dcb67a7a3367052a55'
          AND (
            (o.source_state='unchanged_exact' AND o.raw_sha=p.original_sha)
            OR
            (o.source_state='unchanged_asset_version_only'
              AND (SELECT count(*) FROM regexp_matches(convert_from(o.raw_body,'UTF8'),
                    '((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")','g'))=19
              AND encode(sha256(convert_to(regexp_replace(convert_from(o.raw_body,'UTF8'),
                    '((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")',
                    E'\\1TIMESTAMP\\2','g'),'UTF8')),'hex')=p.canonical_sha)
          ))
      ))<>3)
 THEN RAISE EXCEPTION 'DEV_V1_HISTORICAL_LEGAL_APPROVAL_MUTATION_ALLOWED';END IF;
END $approval_must_remain_false$;
SELECT jsonb_build_object(
 'verdict','DEV_V1_P7905_CANONICAL_BMEIA_ASSET_19_OLD_BODY_PASS',
 'source_count',3,'BMI_strict_unchanged',true,
 'BMEIA_different_raw_sha_but_exact_canonical_sha',true,
 'different_non_asset_body_fails_closed',true,
 'changed_source_state_fails_closed',true,
 'historical_approval_mutation_fails_closed',true,
 'schema_only_disposable',true,'Production_changes',false,'transaction_end','ROLLBACK') AS proof;
ROLLBACK;
