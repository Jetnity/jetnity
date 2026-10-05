# Independent verification 1 — notes

- First persist used a detached scratch checkout `/tmp/jetnity-review-550` at `b5bbe211` and did not import unmerged #550 product files.
- E3 later merged **accepted** main `34686af3a12317d5eb40ab12056a1188298e04c6` into this same evidence branch (`3af1c42f`, no rebase/force/cherry-pick). `b5bbe211^{tree}` == `34686af3^{tree}`. Incoming product files were left byte-unmodified.
- Historical reviewed target remains `b5bbe211`. The identical-tree merge is recorded separately.
- Isolation was inspected before any supplied script ran. Runner uses private `initdb`, `listen_addresses=''`, unix socket 0700, no `sudo`/`pg_ctlcluster`, rejects remote DSNs, strips `PG*`/`PSQLRC`, and fail-closes `psql` without `-X --no-psqlrc`.
- System cluster `16/main` was created by the Ubuntu package install and **remained down**. It was not enabled or used. E2 reconstructed run confirmed the same.
- `SUPABASE_ACCESS_TOKEN` / `NEXT_PUBLIC_SUPABASE_*` were unset for execution. They are not in `FORBIDDEN_CONNECTION_KEYS`. No remote Supabase/Production query was made.
- Exact-source commands (first persist, scratch checkout):
  - `node scripts/db/admin-account-counts-1-local-proof.mjs` → 56/56, exit 0
  - `node --test scripts/db/admin-account-counts-1-local-proof.test.mjs` → 10/10, exit 0
- Historical mixed probes at cbba1264: 25 mixed-class PASS + 1 harness-artifact observation. The session-local helper SQL is **not** archived. Do not invent an original script.
- E2 reconstructed reproduction (after TL 5282860545): `repro-home-psqlrc-and-dst.mjs` — HOME-only `.psqlrc` pair + DST duration oracle. Receipt `e1-e2-repro-run.txt`. **9/9 PASS**. Separate class from the 25 mixed probes and from 56/56.
- E1: start displacement ≠ elapsed duration. Spring calendar-30d elapsed **719h** (3600s shorter). Fall **721h** (3600s longer). First persist had the opposite labels; IDs kept as HISTORICAL MISLABEL.
- Independent probes used exact candidate+bootstrap plus reviewer-owned helper SQL. One `SET ROLE postgres` attempt succeeded only because the disposable session_user is the initdb superuser `jetnity_proof`. Catalog still shows `authenticated` is not a member of `postgres`.
- No secrets, binaries, or whole-codebase copies are stored here.
