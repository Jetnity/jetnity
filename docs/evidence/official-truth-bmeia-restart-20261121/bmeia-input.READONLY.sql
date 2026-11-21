BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='15s';
SELECT jsonb_build_object(
'observed_at',clock_timestamp(),'database',current_database(),'database_role',current_user,
'postmaster_started_at',pg_postmaster_start_time(),
'original', (to_jsonb(o)-'original_body')||jsonb_build_object('actual_bytes',octet_length(o.original_body),'actual_sha',encode(sha256(o.original_body),'hex'),'body_utf8',convert_from(o.original_body,'UTF8')),
'watch',to_jsonb(r),
'source_configuration',to_jsonb(s),
'response',jsonb_build_object('id',h.id::text,'created',h.created,'status_code',h.status_code,'content_type',h.content_type,'timed_out',h.timed_out,'error_msg',h.error_msg,'actual_bytes',octet_length(convert_to(h.content,'UTF8')),'actual_sha',encode(sha256(convert_to(h.content,'UTF8')),'hex'),'body_utf8',h.content)
) AS review_input
FROM official_v3_at_private.whole_originals_v2 o
JOIN official_v3_source_renewal_private.sources_v1 s ON s.source_id=o.source_id AND s.destination_code='AT'
JOIN official_v3_at_source_watch_private.reads_v1 r ON r.source_id=o.source_id AND r.batch_id=105
LEFT JOIN LATERAL(SELECT id,created,status_code,content_type,timed_out,error_msg,content FROM net._http_response WHERE id=r.request_id ORDER BY created DESC LIMIT 1)h ON true
WHERE o.source_id='bmeia-bern-how-to-apply';
ROLLBACK;
