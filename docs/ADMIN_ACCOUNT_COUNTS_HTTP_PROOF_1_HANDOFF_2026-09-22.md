# Admin Account Counts HTTP Proof 1 — HANDOFF

Stand: 22. September 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW OF RESIDUAL H1-A/H1-B / KEIN READY / KEIN MERGE / KEINE PRODUCTION-AKTIVIERUNG / KEIN NEUES AGENT**

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
| Authorized / current main | `72291ee6b2d99e6ef9e1deab925f41baf7a2f0ed` |
| Merge-base | `72291ee6b2d99e6ef9e1deab925f41baf7a2f0ed` |
| Examined snapshot | `dcf7bfee497ba3aa2038a43fe4bc2a09e541625f` |
| Review corrected | residual `5284606563` H1-A/H1-B (H2/H3 accepted on `c9f5df59`) |
| Historical freezes | `0109fce2` then `c9f5df59` (dated; not this rerun) |
| Agent / session | Generation 1 / `bc-e1622174-d101-44e3-bb7d-d4fad18cd016` |
| Session URL | https://cursor.com/agents/bc-e1622174-d101-44e3-bb7d-d4fad18cd016 |
| Required / actual model | Cursor Grok 4.6 High Fast / `cursor-grok-4.6-high-fast` |
| UI rename | not performed; run-info name is `Admin account counts HTTP proof` |

Read first: the binding task, then STATUS, then the harness, then evidence.

## 2. What changed

Allowed slice files only:

1. `scripts/db/admin-account-counts-http-proof-1.mjs`
2. `scripts/db/admin-account-counts-http-proof-1.test.mjs`
3. `scripts/db/admin-account-counts-http-proof-1-fixture.sql` (unchanged in H1–H3)
4. this STATUS / HANDOFF / SELF_REVIEW
5. `docs/evidence/admin-account-counts-http-proof-1/*`

Authorized merge of exact main `72291ee6` is already on the branch (`20a8efc0`). Incoming #553/product/central-doc files stay read-only.

No `docs/ACTIVE_WORK_STATUS.md`. No `supabase/migrations/`. No package/CI/shared-client edits.

## 3. How to re-run

Requires local PostgreSQL 17 binaries (16 is acceptable with an explicit limitation) and a PostgREST 16.3 linux-static-x86-64 binary.

```bash
unset SUPABASE_ACCESS_TOKEN SUPABASE_PROJECT_REF NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY
unset PGHOST PGPORT PGDATABASE PGUSER PGPASSWORD DATABASE_URL
# optional: export JETNITY_HTTP_PROOF_POSTGREST=/path/to/postgrest
node --import tsx --test scripts/db/admin-account-counts-http-proof-1.test.mjs
node --import tsx scripts/db/admin-account-counts-http-proof-1.mjs
```

Last verified local run after residual H1-A/H1-B: **46/46 PASS** + 1 observation on PostgreSQL 17.11 + PostgREST 16.3 (author mixed checks; not TL 88 helper checks). Runner safety/fault controls: **21/21 PASS** (includes already-ended waiter + emitted EPERM retention; not TL's four lifecycle probes). Normal-run cleanup `httpStopped:true` / `httpReaped:true` via SIGTERM.

## 4. #553 status — do not reactivate

#553 is CLOSED / MERGED / POST-MERGE VERIFIED. Accepted head `f9a41701` is in main `72291ee6`. The five examined sources are unchanged through that merge. Do not start a second product writer. Do not rebase/force/reset/cherry-pick. If `origin/main` moves past `72291ee6`, report drift and wait for an exact-SHA dispatch.

## 5. What a reviewer should verify first

1. Diff stays inside the allowed proof/evidence/deliverable paths plus the already-authorized main merge.
2. Source manifest hashes still match `dcf7bfee` and are identical on `72291ee6`.
3. Cleanup acceptance requires `httpStopped` / reap; listener evidence is pid-bound LISTEN.
4. Denials assert exact v16 pairs and reject 500/503/HTML/success in executable tests.
5. Schema probes use Accept-Profile/Content-Profile; catalog is before/after definition/owner/ACL/RLS.
6. Observation vs assertion counts stay honest.
7. Fresh exact-head CI/Auth/Preview from the frozen SHA.

## 6. Next actor

Technical Lead: independent exact-head re-review of this corrected evidence. Same session only if TL dispatches a further review fix. Do not start another agent or follow-up slice from this task. Cursor must not Ready or merge.
