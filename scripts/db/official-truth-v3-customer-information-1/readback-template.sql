-- Lost-ACK first query (before this file):
-- SELECT to_regclass('official_v3_guard_private.customer_information_baseline_v1');
-- NULL means no committed successor. A present table requires this complete
-- readback; never replay the installer to interpret a lost acknowledgement.
-- This file reads only. It does not call audit_v1, a sender tick, or an Owner RPC.
WITH catalog_checked AS MATERIALIZED (
 SELECT official_v3_guard_private.assert_catalog_v1()
), expected AS (
 SELECT * FROM jsonb_to_recordset(/* APPROVED_FUNCTIONS */) AS f(signature text,before text,after text)
), definitions AS (
 SELECT bool_and(p.oid IS NOT NULL AND encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')=e.after) AS exact,
   jsonb_object_agg(e.signature,encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') ORDER BY e.signature COLLATE "C") AS bodies
 FROM expected e LEFT JOIN pg_proc p ON p.oid=to_regprocedure(e.signature)
)
SELECT jsonb_build_object('package','CUSTOMER-INFORMATION1','provider_digest','MIGRATION_SHA256',
 'installed',true,'catalog_verified',true,'definitions_verified',d.exact,
 'predecessor_verified',b.predecessor_provider_digest='ROLLING_PROVIDER_SHA256',
 'definitions_digest_verified',b.definitions_digest='DEFINITIONS_SHA256',
 'history_definition_digest_verified',b.history_definition_digest='HISTORY_DEFINITION_SHA256',
 'required_generation',b.required_generation,'proof_not_before',b.proof_not_before,
 'observed_generation',s.generation,'last_proof_started',s.last_proof_started,
 'admission',public.official_v3_guard_alarm_status_v1(),'bodies',d.bodies,
 'baseline_digest',encode(sha256(convert_to((to_jsonb(b)||jsonb_build_object('proof_not_before',extract(epoch FROM b.proof_not_before)))::text,'UTF8')),'hex'))
FROM official_v3_guard_private.customer_information_baseline_v1 b
CROSS JOIN official_v3_guard_private.state_v1 s CROSS JOIN definitions d CROSS JOIN catalog_checked
WHERE b.singleton AND s.singleton;
