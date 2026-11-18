-- AT-only Dev whole-original quarantine V2. Never a V3 accepted store.
-- No change to the active HRS1/CH-DE baseline, bindings, ACL or BG1.
DO $preflight$
BEGIN
 IF (public.official_v3_guard_alarm_status_v1()->>'status') IS DISTINCT FROM 'current' THEN
   RAISE EXCEPTION 'at_v2_dev_guard_not_current'; END IF;
 IF EXISTS(SELECT 1 FROM official_v3_method_private.heads_v1
           WHERE method_id='jetnity-destination-primary-at-visa') THEN
   RAISE EXCEPTION 'at_v2_method_already_started'; END IF;
 IF NOT EXISTS(
  SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid
   JOIN pg_namespace n ON n.oid=t.relnamespace
  WHERE n.nspname='official_v3_result_private' AND t.relname='originals_v1'
    AND c.conname='originals_v1_check'
    AND pg_get_constraintdef(c.oid) LIKE '%131072%') THEN
  RAISE EXCEPTION 'at_v2_hrs1_drift'; END IF;
 IF to_regnamespace('official_v3_at_private') IS NOT NULL THEN
  RAISE EXCEPTION 'at_v2_namespace_exists'; END IF;
END $preflight$;
CREATE SCHEMA official_v3_at_private;
REVOKE ALL ON SCHEMA official_v3_at_private FROM PUBLIC, anon, authenticated, service_role;
CREATE TABLE official_v3_at_private.whole_originals_v2 (
 source_id text PRIMARY KEY,
 official_url text NOT NULL,
 editorial_edition text,
 source_retrieved_at timestamptz NOT NULL,
 original_body bytea NOT NULL,
 body_bytes integer GENERATED ALWAYS AS (octet_length(original_body)) STORED,
 body_digest text GENERATED ALWAYS AS (encode(sha256(original_body),'hex')) STORED,
 disposition text NOT NULL DEFAULT 'RESEARCH_ONLY' CHECK (disposition='RESEARCH_ONLY'),
 accepted_fact_count integer NOT NULL DEFAULT 0 CHECK (accepted_fact_count=0),
 importable boolean NOT NULL DEFAULT false CHECK (importable=false),
 CONSTRAINT at_whole_source_v2_complete CHECK (
   octet_length(original_body) BETWEEN 1 AND 524288
   AND source_retrieved_at = '2026-11-16T19:45:39+00'::timestamptz
   AND (
      (source_id = 'bmi-visa-nationality-matrix' AND official_url = 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html' AND body_bytes = 498415 AND body_digest = 'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778' AND editorial_edition = '2026-11-06')
      OR (source_id = 'bmi-general-entry' AND official_url = 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html' AND body_bytes = 91655 AND body_digest = 'ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e' AND editorial_edition IS NULL)
      OR (source_id = 'bmeia-bern-how-to-apply' AND official_url = 'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/' AND body_bytes = 172460 AND body_digest = '7ca5618875cf1eccea033e1b851cdd8aea3d1aef80585048f62826c8c5266c18' AND editorial_edition IS NULL)
   )
 )
);
ALTER TABLE official_v3_at_private.whole_originals_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_at_private.whole_originals_v2 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON official_v3_at_private.whole_originals_v2 FROM PUBLIC, anon, authenticated, service_role;
CREATE FUNCTION official_v3_at_private.refuse_original_mutation_v2() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO pg_catalog AS $immut$
BEGIN RAISE EXCEPTION 'AT original snapshots are append-only'; END
$immut$;
REVOKE ALL ON FUNCTION official_v3_at_private.refuse_original_mutation_v2() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER at_whole_originals_v2_immutable BEFORE UPDATE OR DELETE
 ON official_v3_at_private.whole_originals_v2 FOR EACH ROW
 EXECUTE FUNCTION official_v3_at_private.refuse_original_mutation_v2();
COMMENT ON TABLE official_v3_at_private.whole_originals_v2 IS
 'AT exact original-byte quarantine, RESEARCH_ONLY; no method/release authority or V3 accepted read; private Dev staging only.';