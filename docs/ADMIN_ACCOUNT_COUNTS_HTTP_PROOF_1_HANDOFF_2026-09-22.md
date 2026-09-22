# Admin Account Counts HTTP Proof 1 — HANDOFF

Stand: 22. September 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEINE PRODUCTION-AKTIVIERUNG / KEIN ZWEITER #553-WRITER**

Binding task: `docs/ADMIN_ACCOUNT_COUNTS_HTTP_PROOF_1_TASK_2026-09-22.md` (TL-owned; do not rewrite)  
Status: `docs/ADMIN_ACCOUNT_COUNTS_HTTP_PROOF_1_STATUS_2026-09-22.md`  
Self-review: `docs/ADMIN_ACCOUNT_COUNTS_HTTP_PROOF_1_SELF_REVIEW_2026-09-22.md`

This document is enough for a new agent or Technical Lead to continue without the chat.

---

## 1. Where the work lives

| | |
| --- | --- |
| Draft PR | #554 |
| Branch | `audit/admin-account-counts-http-proof-1` |
| Task seed | `c19d7d92807db97187bb3770cc61c5dc4eb1f738` |
| Authorized main | `ff054f76c14cf1c434890ba342af4df5e536dd05` |
| Examined snapshot | `dcf7bfee497ba3aa2038a43fe4bc2a09e541625f` |
| Agent / session | Generation 1 / `bc-e1622174-d101-44e3-bb7d-d4fad18cd016` |
| Session URL | https://cursor.com/agents/bc-e1622174-d101-44e3-bb7d-d4fad18cd016 |
| Required / actual model | Cursor Grok 4.6 High Fast / `cursor-grok-4.6-high-fast` |
| UI rename | not performed; run-info name is `Admin account counts HTTP proof` |

Read first: the binding task, then STATUS, then the harness, then evidence.

## 2. What changed

Allowed slice files only:

1. `scripts/db/admin-account-counts-http-proof-1.mjs`
2. `scripts/db/admin-account-counts-http-proof-1.test.mjs`
3. `scripts/db/admin-account-counts-http-proof-1-fixture.sql`
4. this STATUS / HANDOFF / SELF_REVIEW
5. `docs/evidence/admin-account-counts-http-proof-1/*`

No `docs/ACTIVE_WORK_STATUS.md`. No `supabase/migrations/`. No package/CI/shared-client edits. No #553 product files.

## 3. How to re-run

Requires local PostgreSQL 17 binaries (16 is acceptable with an explicit limitation) and a PostgREST 16.3 linux-static-x86-64 binary.

```bash
unset SUPABASE_ACCESS_TOKEN SUPABASE_PROJECT_REF NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY
unset PGHOST PGPORT PGDATABASE PGUSER PGPASSWORD DATABASE_URL
# optional: export JETNITY_HTTP_PROOF_POSTGREST=/path/to/postgrest
node --import tsx --test scripts/db/admin-account-counts-http-proof-1.test.mjs
node --import tsx scripts/db/admin-account-counts-http-proof-1.mjs
```

The harness:

- refuses inherited remote/Supabase/PostgREST connection defaults;
- exports wrapper/parser/contract from `dcf7bfee` into a private temp dir and fail-closes on hash mismatch;
- starts a private `initdb` cluster (`listen_addresses=''`, socket 0700);
- starts PostgREST on `127.0.0.1` only with a per-run JWT secret file;
- never imports `scripts/db/sql.mjs`.

Last verified local run: **38/38 PASS** on PostgreSQL 17.11 + PostgREST 16.3. Runner safety: **8/8 PASS**.

## 4. Sibling drift — do not sync

#553 observed head `f9a41701f0dfcacc23efb605089169d330dc1ed4` is two commits after the examined snapshot (v3 addendum + residual R1 shared-URL bind). This reviewer must not merge/rebase/cherry-pick/import that loader. Findings return to TL. #553 retains first main integration priority.

Live `origin/main` re-read at freeze time: `ff054f76c14cf1c434890ba342af4df5e536dd05` (0 behind).

## 5. What a reviewer should verify first

1. Diff stays inside the allowed proof/evidence/deliverable paths.
2. Source manifest hashes still match `dcf7bfee` / accepted main producer+bootstrap.
3. Evidence distinguishes HTTP/signature/role, SQL/catalog, parser, synthetic large-value, and not-run classes.
4. No Ready/merge, no second product writer, no hosted apply.
5. Fresh exact-head CI/Auth/Preview from the frozen SHA, in a PR comment.

## 6. Next actor

Technical Lead: independent exact-head review of this evidence. Reconcile source hashes to the final accepted #553 product before deciding applicability. Same-session review fixes only if TL dispatches them on this assignment. Do not start another agent or follow-up slice from this task.
