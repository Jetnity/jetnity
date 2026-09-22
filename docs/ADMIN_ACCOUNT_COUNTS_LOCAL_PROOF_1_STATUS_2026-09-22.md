# Admin Account Counts Local Proof 1 — STATUS

Stand: 22. September 2026  
Status: **LOCAL DISPOSABLE PROOF COMPLETE / FROZEN FOR INDEPENDENT TECHNICAL-LEAD REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO PRODUCTION APPLY**

Draft PR: #550  
Branch: `feat/admin-account-counts-local-proof-1`  
Binding task: `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_PROOF_1_TASK_2026-09-22.md` at seed `129309aef1ed906b22a16b6dd5dce1db28a746ac`  
Authorized main integrate: `e28ab43b53faf38aef163ccea82c45aedf3a7d06` (#549 docs-only inventory; no runtime/capability change)

Cursor-Agent: **Jetnity admin account counts local proof 1**, Generation 1  
Required / actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-49dd67e9-5979-44af-9476-1df8bcdfff93`  
Session URL: https://cursor.com/agents/bc-49dd67e9-5979-44af-9476-1df8bcdfff93  
Observed run-info display name: `Admin account counts local proof`. UI rename was **not** performed (no rename capability in this session).

This file is point-in-time evidence. Agent self-review is not Technical-Lead PASS. Exact-head CI / Auth / Preview for the frozen head belong in a **PR comment**, not a later evidence-only commit.

---

## 1. Goal

Produce the first real `jetnity.admin-account-counts.v1` aggregate candidate and execute it on a disposable local PostgreSQL cluster: capability + AAL2 authorization, caller lifecycle, present/window semantics, zero-versus-deny, and catalog/ACL truth. Not a dashboard, not a Production migration, not an exposed RPC.

## 2. Implemented

- `scripts/db/admin-account-counts-1-candidate.sql` — schema `jetnity_reporting`, function `account_counts_v1()`, owner role `jetnity_reporting_owner`. SECURITY DEFINER only to aggregate protected `auth.users` without client SELECT. Deny is SQLSTATE `42501`, never a zero success row.
- `scripts/db/admin-account-counts-1-bootstrap.sql` — fixture `auth.users` matching TL-verified types/nullability; extracted `rollenrang` / `aktuelle_rolle` / `hat_rolle_mindestens` / `aktuelles_admin_aal2` / `darf_konten_verwalten`; locked `jetnity_internal` canary.
- `scripts/db/admin-account-counts-1-local-proof.mjs` — private `initdb` cluster + socket; rejects inherited `PG*` / DSN overrides; never imports `scripts/db/sql.mjs`; cleans only this run's directory.
- `scripts/db/admin-account-counts-1-local-proof.test.mjs` — runner fail-closed safety cases.
- Slice STATUS / HANDOFF / SELF_REVIEW and `docs/evidence/admin-account-counts-local-proof-1/*`.

No `supabase/migrations/` file. No `app/` / `lib/` / `types/` / `package.json` / global current-work writes.

## 3. Metric and privilege contract

| Field | Value |
| --- | --- |
| Version | `jetnity.admin-account-counts.v1` |
| Present | `auth.users` where `deleted_at IS NULL AND is_anonymous IS FALSE` |
| Window | same set, `created_at` in half-open `[now() - 30 days, now())` |
| Clock | one transaction-stable `pg_catalog.now()`; timestamptz / UTC interpretation |
| NULL `created_at` | present yes, window no |
| Future `created_at` | present yes, window no |
| Profile join | none — accounts without profiles count |
| Unconfirmed / banned-profile / internal fixture | included and described |
| Auth | `auth.uid()` exists, caller present/non-anonymous/not soft-deleted, `public.darf_konten_verwalten()` |
| Deny | `42501` / `jetnity.admin-account-counts.v1: not authorized` |
| Authorized zero | window can be `0`; present cannot be `0` because the caller is themselves a present account |

## 4. Local proof (verified)

| Gate | Result |
| --- | --- |
| Local PostgreSQL | 16.15, private cluster, system `16/main` remained `down` / unused |
| `node scripts/db/admin-account-counts-1-local-proof.mjs` | **36/36 PASS** |
| `node --test scripts/db/admin-account-counts-1-local-proof.test.mjs` | **5/5 PASS** |
| Candidate sha256 | `88c98bc8023278202c80abb2078eb8a2a4dadd05e8cedf6aae5f94d9a1907a52` |
| Bootstrap sha256 | `6409d90ef10fd2f7cb5c70f59496d44acc20d66d7c0adb1e5a73efac2e21fa84` |
| Remote DB | unused; PGHOST / DSN / `JETNITY_ALLOW_REMOTE_DB=1` rejected before `initdb` |

Executed groups: static source, approved-role AAL2 aggregates, AAL/capability/caller denials, lifecycle, window/NULL/edges/timezones, zero-versus-deny, catalog/ACL. Distinct from the runner-safety Node tests.

## 5. Promotion checklist (review, not apply)

1. Independent Technical-Lead exact-head review of this candidate + proof. Do not treat fixture PASS as live statistics.
2. Fresh Production metadata drift check of `auth.users` / `darf_konten_verwalten()` / AAL2 / TimeZone before any apply.
3. Smallest later migration: create `jetnity_reporting` + `account_counts_v1()` + owner role; revoke PUBLIC/anon/service_role; grant authenticated USAGE/EXECUTE only. Rollback = drop function, revoke, drop schema, drop owner role. Do not grant `jetnity_internal`.
4. Later public RPC wrapper, if wanted, is a separate exposure review. This task does not expose a Data API RPC.
5. Minimal Admin display of the two measures must keep unavailable / error / forbidden / observed-zero distinct (ADR-0040). Forbidden or missing producer must not render `0`.
6. Product-Owner approval remains outstanding for any Production migration or privilege exposure.

## 6. Residual risks

- P1 prevention held in this fixture: no unauthorized success row, no PUBLIC execute, no remote-DB fallback, no identity fields in the result.
- P2: fixture-versus-Production mismatch (auth.users has more live columns than the verified subset). Timestamp coverage can be incomplete (`created_at` NULL). Test/internal rows stay included until a proven exclusion source exists.
- P2: future permission exposure if this SQL is copied into `supabase/migrations/` without a reserved PO gate.
- P3: evidence pins age when the head moves.
- Authorized `present_registered_accounts` is at least 1. A true empty present set cannot be returned without weakening caller validation.

## 7. Next step

Freeze this implementation head. Report remaining local hygiene and exact-head CI/Auth/Vercel in a PR comment. **STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW.** Do not Ready, merge, or start a follow-up slice.
