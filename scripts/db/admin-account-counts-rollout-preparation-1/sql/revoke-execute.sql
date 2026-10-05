-- LOCAL-ONLY immediate access revocation.
-- This is not UI disable and not object removal.
-- PUBLIC must be named explicitly; REVOKE FROM a role does not revoke PUBLIC.
REVOKE ALL ON FUNCTION public.admin_account_counts_v1() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_account_counts_v1() FROM anon, authenticated, service_role;
REVOKE ALL ON FUNCTION jetnity_reporting.account_counts_v1() FROM PUBLIC;
REVOKE ALL ON FUNCTION jetnity_reporting.account_counts_v1() FROM anon, authenticated, service_role;
REVOKE ALL ON SCHEMA jetnity_reporting FROM PUBLIC;
REVOKE ALL ON SCHEMA jetnity_reporting FROM anon, authenticated, service_role;
