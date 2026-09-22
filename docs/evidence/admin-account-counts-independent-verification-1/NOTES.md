# Independent verification 1 — notes

- Detached scratch checkout: `/tmp/jetnity-review-550` at `b5bbe211`. Evidence branch was not merged/cherry-picked with #550 product files.
- Isolation was inspected before any supplied script ran. Runner uses private `initdb`, `listen_addresses=''`, unix socket 0700, no `sudo`/`pg_ctlcluster`, rejects remote DSNs, strips `PG*`/`PSQLRC`, and fail-closes `psql` without `-X --no-psqlrc`.
- System cluster `16/main` was created by the Ubuntu package install and **remained down**. It was not enabled or used.
- `SUPABASE_ACCESS_TOKEN` / `NEXT_PUBLIC_SUPABASE_*` were unset for execution. They are not in `FORBIDDEN_CONNECTION_KEYS`. No remote Supabase/Production query was made.
- Exact-source commands (scratch checkout):
  - `node scripts/db/admin-account-counts-1-local-proof.mjs` → 56/56, exit 0
  - `node --test scripts/db/admin-account-counts-1-local-proof.test.mjs` → 10/10, exit 0
- Independent probes used exact candidate+bootstrap plus reviewer-owned helper SQL. One `SET ROLE postgres` attempt succeeded only because the disposable session_user is the initdb superuser `jetnity_proof`. Catalog still shows `authenticated` is not a member of `postgres`.
- Builder HOME-only negative control always sets `PSQLRC`. This review added a HOME-only (no `PSQLRC`) sentinel control; the sentinel ran without `-X` and was suppressed with `-X`.
- No secrets, binaries, or whole-codebase copies are stored here.
