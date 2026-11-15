-- Compare deparsed predicates against an independently created exact v1 model.
-- Constraint names/OIDs are retained in the transaction's private witness.
CREATE TEMP TABLE rolling_old_checks(id oid PRIMARY KEY,name text NOT NULL,kind text NOT NULL) ON COMMIT DROP;
CREATE TEMP TABLE rolling_v1_check_model(
 operation_count integer CHECK(operation_count BETWEEN 0 AND 256),
 start_count integer CHECK(start_count BETWEEN 0 AND 64),
 terminal_credit_claim text,
 CHECK(operation_count+CASE WHEN terminal_credit_claim IS NULL THEN 0 ELSE 1 END<=256)
) ON COMMIT DROP;
DO $old_checks$
DECLARE expected record; actual record;
BEGIN
 IF (SELECT count(*) FROM official_v3_jobs_private.subjects_v1
     WHERE job_key='ROLLING_JOB_KEY' AND kind='rule_research')<>1 THEN
   RAISE EXCEPTION 'rolling quota requires exact existing CH DE subject' USING ERRCODE='P7911'; END IF;
 FOR expected IN SELECT pg_get_constraintdef(c.oid) AS definition,
     CASE WHEN cardinality(c.conkey)=2 THEN 'credit' WHEN c.conkey=ARRAY[1]::smallint[] THEN 'operations' ELSE 'starts' END AS kind
   FROM pg_constraint c WHERE c.conrelid='pg_temp.rolling_v1_check_model'::regclass AND c.contype='c' LOOP
   SELECT c.oid,c.conname INTO STRICT actual FROM pg_constraint c
    WHERE c.conrelid='official_v3_jobs_private.subjects_v1'::regclass AND c.contype='c'
      AND c.convalidated AND NOT c.condeferrable AND NOT c.condeferred AND c.conislocal AND c.coninhcount=0
      AND pg_get_constraintdef(c.oid)=expected.definition;
   INSERT INTO pg_temp.rolling_old_checks VALUES(actual.oid,actual.conname,expected.kind);
 END LOOP;
 IF (SELECT count(*) FROM pg_temp.rolling_old_checks)<>3 THEN
   RAISE EXCEPTION 'rolling quota exact three original checks required' USING ERRCODE='P7911'; END IF;
END $old_checks$;
