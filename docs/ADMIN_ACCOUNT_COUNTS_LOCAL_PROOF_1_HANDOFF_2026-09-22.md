# Admin Account Counts Local Proof 1 — HANDOFF

Stand: 22. September 2026  
Status: **LOCAL DISPOSABLE PROOF COMPLETE / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEINE PRODUCTION-AKTIVIERUNG**

Binding task: `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_PROOF_1_TASK_2026-09-22.md`  
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
| Agent / session | Generation 1 / `bc-49dd67e9-5979-44af-9476-1df8bcdfff93` |
| Session URL | https://cursor.com/agents/bc-49dd67e9-5979-44af-9476-1df8bcdfff93 |
| Required / actual model | Cursor Grok 4.6 High Fast / `cursor-grok-4.6-high-fast` |
| UI rename | not performed; run-info name is `Admin account counts local proof` |

Read first: the binding task, then the candidate SQL, then the runner, then STATUS.

## 2. What changed

Allowed slice files only:

1. `scripts/db/admin-account-counts-1-candidate.sql`
2. `scripts/db/admin-account-counts-1-bootstrap.sql`
3. `scripts/db/admin-account-counts-1-local-proof.mjs`
4. `scripts/db/admin-account-counts-1-local-proof.test.mjs`
5. this STATUS / HANDOFF / SELF_REVIEW
6. `docs/evidence/admin-account-counts-local-proof-1/*`
7. binding TASK (already on the dispatch head)
8. merge commit of authorized main `e28ab43b` (incoming #549 docs only; not rewritten here)

No `docs/ACTIVE_WORK_STATUS.md`. No `supabase/migrations/`. No package-script edit.

## 3. How to re-run

```bash
node scripts/db/admin-account-counts-1-local-proof.mjs
node --test scripts/db/admin-account-counts-1-local-proof.test.mjs
```

Requires local PostgreSQL 16 binaries (`initdb`, `pg_ctl`, `postgres`, `psql`). The runner creates a private cluster under `/tmp/jetnity-admin-account-counts-1-<uuid>` and deletes that directory on every path. It refuses inherited connection overrides and does not use the system `16/main` cluster.

Last verified local run: **36/36 PASS** on PostgreSQL 16.15. Runner safety: **5/5 PASS**.

Candidate sha256: `88c98bc8023278202c80abb2078eb8a2a4dadd05e8cedf6aae5f94d9a1907a52`

## 4. What a reviewer should verify first

1. Merge-base equals live `main@e28ab43b` and behind=0. Incoming #549 files are unmodified. No sibling merge/rebase/force.
2. Diff stays inside the allowed paths. Zero files under `supabase/migrations/`, `app/`, `lib/`, `types/`, `package.json`.
3. Harness never imports `scripts/db/sql.mjs`, starts a private cluster, and rejects `PGHOST` / DSN / `JETNITY_ALLOW_REMOTE_DB=1` before `initdb`.
4. Catalog: DEFINER, `search_path=pg_catalog`, PUBLIC/anon/service_role EXECUTE false, authenticated EXECUTE true, no client SELECT on `auth.users`, `jetnity_internal` closed.
5. Deny is `42501` with no success row. Authorized window `0` with present `1` is the documented caller-count minimum.
6. No Ready / merge / follow-up. Production activation remains a later reserved PO gate.
7. Final CI/Auth/Preview for the **frozen** head belong in a PR comment.

## 5. Promotion checklist

See STATUS §5. Shortest later path: review → metadata drift check → reserved PO gate → smallest migration + optional later RPC/UI. This PR is not that gate.

## 6. Next step

**STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW** after remaining local hygiene and exact-head CI/Auth/Preview are posted as a PR comment.
