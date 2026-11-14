SET LOCAL ROLE ot_v3_jobs_owner;
-- Keep all lifetime counters and their monotonic trigger unchanged. Only this
-- immutable policy's exact subject may exceed the old lifetime ceilings.
ALTER TABLE official_v3_jobs_private.subjects_v1
 DROP CONSTRAINT subjects_v1_operation_count_check,
 DROP CONSTRAINT subjects_v1_start_count_check,
 DROP CONSTRAINT subjects_v1_check,
 ADD CONSTRAINT subjects_v1_operation_count_check CHECK(operation_count>=0 AND (job_key='ROLLING_JOB_KEY' OR operation_count<=256)),
 ADD CONSTRAINT subjects_v1_start_count_check CHECK(start_count>=0 AND (job_key='ROLLING_JOB_KEY' OR start_count<=64)),
 ADD CONSTRAINT subjects_v1_check CHECK(job_key='ROLLING_JOB_KEY' OR operation_count+CASE WHEN terminal_credit_claim IS NULL THEN 0 ELSE 1 END<=256);
RESET ROLE;

CREATE TEMP TABLE rolling_v2_check_model(
 job_key text,
 operation_count integer CHECK(operation_count>=0 AND (job_key='ROLLING_JOB_KEY' OR operation_count<=256)),
 start_count integer CHECK(start_count>=0 AND (job_key='ROLLING_JOB_KEY' OR start_count<=64)),
 terminal_credit_claim text,
 CHECK(job_key='ROLLING_JOB_KEY' OR operation_count+CASE WHEN terminal_credit_claim IS NULL THEN 0 ELSE 1 END<=256)
) ON COMMIT DROP;
