-- Additive invocation-local exact BG1 membership reuse. Every row and original authority check remains.
CREATE OR REPLACE FUNCTION official_v3_guard_private.check_jobs_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $history_guard$
DECLARE k text; x record; ref jsonb; opened jsonb; subject_row record;
  prior jsonb; envelope jsonb; next_revision bigint; head_count bigint;
  dedup_node_text text COLLATE "C"; dedup_member_text text COLLATE "C";
BEGIN
  LOCK TABLE official_v3_jobs_private.subjects_v1,official_v3_jobs_private.queue_operations_v1,
    official_v3_jobs_private.execution_starts_v1,official_v3_jobs_private.execution_results_v1,
    official_v3_jobs_private.execution_dispositions_v1,official_v3_jobs_private.slots_v1 IN SHARE MODE;
  FOR k IN SELECT job_key FROM official_v3_jobs_private.subjects_v1 ORDER BY job_key COLLATE "C" LOOP
    PERFORM official_v3_jobs_private.assert_history_v1(k);
    SELECT * INTO STRICT subject_row FROM official_v3_jobs_private.subjects_v1 WHERE job_key=k;
    prior:='null'::jsonb; next_revision:=1; head_count:=0;
    dedup_member_text:=NULL;
    -- The predecessor validates each transition separately. BG1 additionally
    -- reconstructs the one complete journal chain and its exact retained head.
    -- Deduplicated enqueues do not advance revisions and are checked below.
    FOR x IN SELECT * FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k
      AND envelope_text::jsonb->'expected' IS DISTINCT FROM envelope_text::jsonb->'next'
      ORDER BY (envelope_text::jsonb#>>'{next,revision}')::bigint LOOP
      envelope:=x.envelope_text::jsonb;
      IF envelope->'expected' IS DISTINCT FROM prior OR (envelope#>>'{next,revision}')::bigint<>next_revision
        OR NOT isfinite(x.recorded_at)
        OR (x.authority-'epoch') IS DISTINCT FROM subject_row.method_binding THEN
        RAISE EXCEPTION 'bg1 complete jobs chain' USING ERRCODE='P7905'; END IF;
      prior:=envelope->'next'; next_revision:=next_revision+1; head_count:=head_count+1;
    END LOOP;
    IF head_count=0 OR subject_row.current_job IS DISTINCT FROM prior THEN
      RAISE EXCEPTION 'bg1 exact jobs journal head' USING ERRCODE='P7905'; END IF;
    FOR x IN SELECT * FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k
      AND envelope_text::jsonb->'expected' IS NOT DISTINCT FROM envelope_text::jsonb->'next' LOOP
      envelope:=x.envelope_text::jsonb;
      IF x.action<>'enqueue' OR envelope#>>'{audit,kind}' IS DISTINCT FROM 'deduplicated'
        OR NOT isfinite(x.recorded_at)
        OR (x.authority-'epoch') IS DISTINCT FROM subject_row.method_binding THEN
        RAISE EXCEPTION 'bg1 deduplicated jobs chain' USING ERRCODE='P7905'; END IF;
      dedup_node_text:=(envelope->'expected')::text;
      IF dedup_member_text IS NOT NULL AND dedup_node_text IS NOT NULL
        AND dedup_member_text COLLATE "C" = dedup_node_text COLLATE "C" THEN
        NULL;
      ELSE
        IF NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.job_key=k
          AND q.envelope_text::jsonb->'expected' IS DISTINCT FROM q.envelope_text::jsonb->'next'
          AND q.envelope_text::jsonb->'next'=envelope->'expected') THEN
          RAISE EXCEPTION 'bg1 deduplicated jobs chain' USING ERRCODE='P7905'; END IF;
        IF dedup_node_text IS NOT NULL AND octet_length(dedup_node_text)<=65536 THEN
          dedup_member_text:=dedup_node_text;
        END IF;
      END IF;
    END LOOP;
    -- A same-revision dedup attaches to its exact immutable chain node. Client
    -- observedAt values are not a global serialization clock; do not order
    -- otherwise valid concurrent historical requests by their observation time.
  END LOOP;
  FOR x IN SELECT authority,recorded_at AS checked_at FROM official_v3_jobs_private.queue_operations_v1
    UNION ALL SELECT authority,reserved_at FROM official_v3_jobs_private.execution_starts_v1 LOOP
    PERFORM official_v3_guard_private.check_method_link_v1(x.authority,x.checked_at);
  END LOOP;
  FOR x IN SELECT t.*,r.result,r."references" FROM official_v3_jobs_private.execution_starts_v1 t
    JOIN official_v3_jobs_private.execution_results_v1 r USING(attempt_key) LOOP
    FOR ref IN SELECT value FROM jsonb_array_elements(x."references") LOOP
      PERFORM official_v3_jobs_private.reference_v1(ref);
      opened:=official_v3_jobs_private.s1_read_v1(ref->'binding',ref->>'proposalDigest',(ref->>'bytes')::integer);
      IF opened#>'{record,reference}' IS DISTINCT FROM ref THEN RAISE EXCEPTION 'bg1 jobs intake reference' USING ERRCODE='P7905'; END IF;
      PERFORM official_v3_jobs_private.consume_s1_v1(opened,x.leased_job,x.result,'read');
    END LOOP;
  END LOOP;
END $history_guard$;
