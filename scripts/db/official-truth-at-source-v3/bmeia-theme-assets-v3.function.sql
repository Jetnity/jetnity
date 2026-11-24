CREATE FUNCTION official_v3_at_production_private.bmeia_theme_assets_v3(
 p_reference text,p_observed text) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog AS $assets$
DECLARE
 css_re constant text:='(<link[[:space:]]+rel="stylesheet"[[:space:]]+href=")/typo3conf/ext/theme_bmeia/Resources/Public/CSS/[A-Za-z0-9._-]+[.]css([?][0-9]{10})?(")';
 js_re constant text:='(<script[[:space:]]+src=")/typo3conf/ext/theme_bmeia/Resources/Public/JS/[A-Za-z0-9._-]+[.]js([?][0-9]{10})?(")';
 css_old int;css_new int;js_old int;js_new int;left_text text;right_text text;
BEGIN
 IF p_reference IS NULL OR p_observed IS NULL
 OR octet_length(p_reference) NOT BETWEEN 1 AND 1048576
 OR octet_length(p_observed) NOT BETWEEN 1 AND 1048576
 THEN RETURN false; END IF;
 SELECT count(*) INTO css_old FROM regexp_matches(p_reference,css_re,'g');
 SELECT count(*) INTO css_new FROM regexp_matches(p_observed,css_re,'g');
 SELECT count(*) INTO js_old FROM regexp_matches(p_reference,js_re,'g');
 SELECT count(*) INTO js_new FROM regexp_matches(p_observed,js_re,'g');
 IF css_old<>4 OR css_new<>4 OR js_old<>15 OR js_new<>15 THEN RETURN false; END IF;
 left_text:=regexp_replace(regexp_replace(p_reference,css_re,E'\\1CSS_ASSET\\3','g'),js_re,E'\\1JS_ASSET\\3','g');
 right_text:=regexp_replace(regexp_replace(p_observed,css_re,E'\\1CSS_ASSET\\3','g'),js_re,E'\\1JS_ASSET\\3','g');
 RETURN left_text=right_text;
END $assets$;
