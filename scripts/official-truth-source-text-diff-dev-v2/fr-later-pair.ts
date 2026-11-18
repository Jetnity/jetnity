// Exact DEV-only FR source version recovery: the historical archived FR
// "original" did not match its first monitored unqualified snapshot.
// Never rewrite or silently substitute that historical original. Instead,
// compare one independent, SHA-verified later stored monitor sample with
// another still-retained *latest* monitored HTTP response (research only).
// No new fetch, tokens, data exports, SQL writes, accepted legal facts.

import { parseOnePrivateRow, type SourceSelection } from '../official-truth-source-text-diff-dev-v1/read-pair'

export const FR_LATER_SELECTION: SourceSelection = Object.freeze({
  sourceFamily:'FOUR',destinationCode:'FR',sourceKey:'primary',
})

export const FR_MONITORED_POST_ARCHIVE_SQL = `
SELECT 'FOUR'::text AS source_family,
  sample.destination_code, sample.source_key,
  sample.batch_id AS old_batch,
  sample.raw_sha AS old_sha,
  sample.body_bytes AS old_bytes,
  encode(sample.original_html,'base64') AS old_body_base64,
  latest.batch_id AS new_batch,
  latest.source_sha256 AS new_sha,
  latest.source_bytes AS new_bytes,
  encode(convert_to(response.content,'UTF8'),'base64') AS new_body_base64,
  latest.batch_id AS latest_batch,
  latest.source_sha256 AS latest_sha,
  latest.status AS latest_state
FROM jetnity_source_body_private.changed_originals_v1 sample
JOIN jetnity_followup_source_monitor_private.sources_v3 registry
 ON registry.destination_code=sample.destination_code
JOIN jetnity_followup_source_monitor_private.source_originals_v1 archive
 ON archive.destination_code=sample.destination_code
JOIN LATERAL (
 SELECT o.batch_id,o.source_sha256
 FROM jetnity_followup_source_monitor_private.observations_v3 o
 WHERE o.destination_code=sample.destination_code
  AND o.status='unqualified_snapshot'
 ORDER BY o.batch_id ASC LIMIT 1
) first_monitor ON true
JOIN LATERAL (
 SELECT o.batch_id,o.observed_at,o.status,o.source_sha256,o.source_bytes,o.http_code
 FROM jetnity_followup_source_monitor_private.observations_v3 o
 WHERE o.destination_code=sample.destination_code
 ORDER BY o.batch_id DESC LIMIT 1
) latest ON true
JOIN jetnity_followup_source_monitor_private.items_v3 item
 ON item.destination_code=latest.destination_code
 AND item.batch_id=latest.batch_id
JOIN net._http_response response ON response.id=item.request_id
WHERE sample.source_family='FOUR'
 AND sample.destination_code='FR'
 AND sample.source_key='primary'
 AND sample.evidence_class='UNQUALIFIED_RESEARCH_SNAPSHOT'
 AND NOT sample.primary_rule_qualified
 AND NOT sample.legal_fact_approved
 AND NOT sample.public_publish_allowed
 AND registry.source_state='RESEARCH_ONLY'
 AND NOT registry.source_qualified
 AND registry.approved_facts=0
 AND registry.official_url=archive.official_url
 AND archive.research_only
 AND NOT archive.source_qualified
 AND NOT archive.publication_allowed
 AND archive.positive_legal_facts=0
 AND first_monitor.batch_id<sample.batch_id
 AND first_monitor.source_sha256 IS DISTINCT FROM archive.raw_sha256
 AND first_monitor.source_sha256 IS NOT NULL
 AND latest.batch_id>sample.batch_id
 AND latest.status='changed_requires_review'
 AND latest.observed_at>=sample.observed_at
 AND latest.http_code=200
 AND response.status_code=200
 AND response.error_msg IS NULL
 AND response.timed_out IS NOT TRUE
 AND response.content IS NOT NULL
 AND response.content_type~*'^text/html([; ]|$)'
 AND latest.source_sha256 ~ '^[a-f0-9]{64}$'
 AND latest.source_bytes BETWEEN 1000 AND 262144
 AND octet_length(convert_to(response.content,'UTF8'))=latest.source_bytes
 AND encode(sha256(convert_to(response.content,'UTF8')),'hex')=latest.source_sha256
 AND sample.raw_sha=encode(sha256(sample.original_html),'hex')
 AND sample.body_bytes=octet_length(sample.original_html)
 AND public.official_v3_guard_alarm_status_v1()->>'status'='current'
 AND (SELECT count(*) FROM jetnity_global_research_private.cases_v1)=10300
 AND NOT EXISTS (
  SELECT 1 FROM jetnity_global_research_private.cases_v1
   WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0
 )
ORDER BY sample.batch_id DESC LIMIT 1`.trim()

/**
 * Strict reproof in the existing private row decoder. Database custody also
 * needs to be proved by FR_MONITORED_POST_ARCHIVE_SQL's joins, not this
 * shape alone. The original archived FR document is explicitly NOT treated
 * as the baseline of this comparison.
 */
export function parseFrMonitoredPostArchivePair(rows:unknown):unknown {
  return parseOnePrivateRow(rows,FR_LATER_SELECTION)
}
