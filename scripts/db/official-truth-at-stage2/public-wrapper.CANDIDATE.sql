-- UNAPPLIED; only assemble with the future exact BG1 successor and separate Production install Go.
-- Preserve the existing RPC signature and ACL. No public new function or grant.
-- The publication ledger starts empty; the wrapper then returns unavailable.
CREATE OR REPLACE FUNCTION public.jetnity_source_bound_at_visa_v1(p_citizenship_country_code text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog
AS $visitor$
BEGIN
 IF p_citizenship_country_code IS DISTINCT FROM 'CH' THEN
  RETURN jsonb_build_object('status','unavailable','destinationCountryCode','AT');
 END IF;
 RETURN official_v3_at_production_private.read_published_ch_v3(p_citizenship_country_code);
EXCEPTION WHEN query_canceled OR OTHERS THEN
 RETURN jsonb_build_object('status','unavailable','destinationCountryCode','AT');
END $visitor$;
