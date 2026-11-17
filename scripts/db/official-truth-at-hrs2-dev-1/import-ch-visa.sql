-- Single genuine Owner-approved Dev import; NEVER a fixture or automatic release.
BEGIN;
SET LOCAL jetnity.at_dev_target='dev:yfvbxvijcorffwxbxahl:AT-HRS2-1';
SET LOCAL search_path=pg_catalog;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
SELECT official_v3_at_private.import_ch_visa_v3();
COMMIT;
