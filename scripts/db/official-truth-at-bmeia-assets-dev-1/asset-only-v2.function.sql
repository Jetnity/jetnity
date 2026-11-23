-- DEV CANDIDATE ONLY. Do not deploy to Production or execute outside
-- project yfvbxvijcorffwxbxahl. The protected Dev collector/guard
-- remains unchanged until an exact BG1 successor is separately tested.
-- Only BMEIA Bern, only 4 stylesheet and 15 script asset REFERENCES
-- inside the fixed Austrian theme directory. Full remaining HTML is
-- compared byte for byte; visible words, dates, tables, data, a[href],
-- ordinary links, inline scripts/styles and all other source IDs block.
CREATE OR REPLACE FUNCTION official_v3_at_source_watch_private.bmeia_asset_only_v2(
 p_source_id text, p_reference text, p_observed text)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER
SET search_path=pg_catalog AS $safe$
DECLARE
 css_re CONSTANT text := '(<link[[:space:]]+rel="stylesheet"[[:space:]]+href=")/typo3conf/ext/theme_bmeia/Resources/Public/CSS/[A-Za-z0-9._-]+[.]css([?][0-9]{10})?(")';
 js_re CONSTANT text := '(<script[[:space:]]+src=")/typo3conf/ext/theme_bmeia/Resources/Public/JS/[A-Za-z0-9._-]+[.]js([?][0-9]{10})?(")';
 reference_normal text; observed_normal text;
 c1 bigint; c2 bigint; s1 bigint; s2 bigint;
BEGIN
 IF p_source_id IS DISTINCT FROM 'bmeia-bern-how-to-apply'
 OR p_reference IS NULL OR p_observed IS NULL
 OR octet_length(p_reference)<1 OR octet_length(p_observed)<1
 OR octet_length(p_reference)>1048576 OR octet_length(p_observed)>1048576 THEN
  RETURN false;
 END IF;
 SELECT count(*) INTO c1 FROM regexp_matches(p_reference,css_re,'g');
 SELECT count(*) INTO c2 FROM regexp_matches(p_observed,css_re,'g');
 SELECT count(*) INTO s1 FROM regexp_matches(p_reference,js_re,'g');
 SELECT count(*) INTO s2 FROM regexp_matches(p_observed,js_re,'g');
 IF c1<>4 OR c2<>4 OR s1<>15 OR s2<>15 THEN RETURN false; END IF;
 reference_normal:=regexp_replace(
  regexp_replace(p_reference,css_re,E'\\1CSS_ASSET\\3','g'),
  js_re,E'\\1JS_ASSET\\3','g');
 observed_normal:=regexp_replace(
  regexp_replace(p_observed,css_re,E'\\1CSS_ASSET\\3','g'),
  js_re,E'\\1JS_ASSET\\3','g');
 RETURN reference_normal=observed_normal;
END $safe$;
REVOKE ALL ON FUNCTION official_v3_at_source_watch_private.bmeia_asset_only_v2(text,text,text) FROM PUBLIC;