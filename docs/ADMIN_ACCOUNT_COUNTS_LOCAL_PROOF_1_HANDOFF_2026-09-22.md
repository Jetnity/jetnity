# Admin Account Counts Local Proof 1 — HANDOFF

Stand: 22. September 2026  
Status: **R1–R4 LOCAL CORRECTION COMPLETE / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW / KEIN READY / KEIN MERGE / KEINE PRODUCTION-AKTIVIERUNG**

Binding task: `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_PROOF_1_TASK_2026-09-22.md` (TL-owned; do not rewrite)  
Status: `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_PROOF_1_STATUS_2026-09-22.md`  
Self-review: `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_PROOF_1_SELF_REVIEW_2026-09-22.md`

This document is enough for a new agent or Technical Lead to continue without the chat.

---

## 1. Where the work lives

| | |
| --- | --- |
| Draft PR | #550 |
| Branch | `feat/admin-account-counts-local-proof-1` |
| Task seed | `129309aef1ed906b22a16b6dd5dce1db28a746ac` |
| Authorized main | `e28ab43b53faf38aef163ccea82c45aedf3a7d06` (#549 docs-only; integrated by merge, not rebase) |
| Previous frozen head | `9219e31e5d646c267915812a359aad957ab3cff4` (CHANGES REQUIRED 5282427169; historical) |
| Agent / session | Generation 1 / `bc-49dd67e9-5979-44af-9476-1df8bcdfff93` |
| Session URL | https://cursor.com/agents/bc-49dd67e9-5979-44af-9476-1df8bcdfff93 |
| Required / actual model | Cursor Grok 4.6 High Fast / `cursor-grok-4.6-high-fast` |
| UI rename | not performed; run-info name is `Admin account counts local proof` |

Read first: the binding task, then the candidate SQL, then the bootstrap, then the runner, then STATUS.

## 2. What changed in this correction

Allowed slice files only:

1. `scripts/db/admin-account-counts-1-candidate.sql` — trusted `postgres` owner; 720-hour window; no new role / auth.users grant
2. `scripts/db/admin-account-counts-1-bootstrap.sql` — RLS-on auth.users fixture; postgres NOSUPERUSER+BYPASSRLS
3. `scripts/db/admin-account-counts-1-local-proof.mjs` — `-X/--no-psqlrc`, owned-cluster lifecycle, DST oracle, RLS contrast
4. `scripts/db/admin-account-counts-1-local-proof.test.mjs` — hostile startup files + injected cleanup failures
5. this STATUS / HANDOFF / SELF_REVIEW
6. `docs/evidence/admin-account-counts-local-proof-1/*`

No `docs/ACTIVE_WORK_STATUS.md`. No `supabase/migrations/`. No package-script edit. No remote database access.

## 3. How to re-run

```bash
node scripts/db/admin-account-counts-1-local-proof.mjs
node --test scripts/db/admin-account-counts-1-local-proof.test.mjs
```

Requires local PostgreSQL 16 binaries (`initdb`, `pg_ctl`, `postgres`, `psql`). The runner registers `/tmp/jetnity-admin-account-counts-1-<uuid>` **before** initdb/start. It stops the owned postmaster and verifies the process is gone before deleting that directory. A still-running cluster is not recursively deleted; cleanup failure is reported. It refuses inherited connection overrides and does not use the system `16/main` cluster. Every `psql` invocation passes `-X --no-psqlrc` and a child env with `PSQLRC` stripped.

Last verified local run: **56/56 PASS** on PostgreSQL 16.15. Runner safety: **10/10 PASS**.

Candidate sha256: `dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420`  
Bootstrap sha256: `0413821d7c75c76908dd437527d623fcbed59c524135adbf5e5974730e6f6ea2`

## 4. What a reviewer should verify first

1. Merge-base equals live `main@e28ab43b` and behind=0. Incoming #549 files are unmodified. No sibling merge/rebase/force.
2. Diff stays inside the allowed paths. Zero files under `supabase/migrations/`, `app/`, `lib/`, `types/`, `package.json`.
3. Harness never imports `scripts/db/sql.mjs`, starts a private cluster, rejects `PGHOST` / DSN / `JETNITY_ALLOW_REMOTE_DB=1` before `initdb`, and disables psql startup files (`-X`, `--no-psqlrc`, stripped `PSQLRC`).
4. Catalog: DEFINER, `search_path=pg_catalog`, owner `postgres`, PUBLIC/anon/service_role EXECUTE false, authenticated EXECUTE true, no client SELECT on `auth.users`, `jetnity_internal` closed, auth.users RLS-on/FORCE-off/no policies/owner `supabase_auth_admin`.
5. Unprivileged-owner contrast fails under RLS; trusted-owner contrast passes the same adversarial caller tests, including missing authenticated subject and anonymous+privileged profile.
6. Window is 720 hours / 2592000 seconds, with DST spring/fall oracle cases. No production caller-supplied time parameter.
7. Cleanup: register-before-create; live cluster is not `rm -rf`'d; normal-run directory is gone after verified stop.
8. Deny is `42501` with no success row. Authorized window `0` with present `1` is the documented caller-count minimum.
9. Distinguish executed SQL groups from catalog/source scans and Node lifecycle tests. Do not relabel 56 as SQL permission assertions.
10. No Ready / merge / follow-up. Production activation remains a later reserved PO gate after a fresh metadata/ownership/ACL review.
11. Final CI/Auth/Preview for the **new** frozen head belong in a PR comment. Old-head gates are historical.

## 5. Promotion checklist

See STATUS §5. Shortest later path: review → metadata/ownership/ACL drift check → reserved PO gate → smallest migration using trusted `postgres` owner + optional later RPC/UI. This PR is not that gate. Do not create a new global BYPASSRLS role.

## 6. Next step

**STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW** after remaining local hygiene and exact-head CI/Auth/Preview are posted as a PR comment.
