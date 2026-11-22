-- NOT EXECUTED. Only after a future separately approved Production Owner/AAL2
-- method and natural BG1/source/fact proof. No new privileges or writes.
-- A read-only transaction would block FOR SHARE in the native BG1 guard,
-- hence ordinary BEGIN with real anon role; always end ROLLBACK.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='12s';
SET LOCAL lock_timeout='800ms';
SET LOCAL ROLE anon;
SELECT jsonb_build_object(
 'scope','PROD_CH_AT_VISA_V2_GENUINE_ANON_RPC_VISITOR_CHECK',
 'observed_at_utc',clock_timestamp(),
 'actor',current_user,
 'ch_original',public.jetnity_source_bound_at_visa_v1('CH'),
 'ch_v4',public.jetnity_at_ch_visa_v4('CH'),
 'foreign_IN',public.jetnity_source_bound_at_visa_v1('IN')->>'status',
 'foreign_DE',public.jetnity_source_bound_at_visa_v1('DE')->>'status',
 'foreign_US',public.jetnity_source_bound_at_visa_v1('US')->>'status',
 'foreign_TR',public.jetnity_source_bound_at_visa_v1('TR')->>'status',
 'foreign_CN',public.jetnity_source_bound_at_visa_v1('CN')->>'status',
 'no_owner_action_performed',true,
 'transaction_fate','ROLLBACK'
) AS results;
ROLLBACK;
