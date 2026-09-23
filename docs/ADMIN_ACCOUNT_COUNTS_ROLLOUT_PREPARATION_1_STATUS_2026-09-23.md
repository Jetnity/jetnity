# Admin Account Counts Rollout Preparation 1 — STATUS

Stand: 23. September 2026  
Status: **LOCAL PACKAGE TESTED AFTER TL RESIDUAL R1 + R3 / FROZEN FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO PRODUCTION APPLY**

Draft PR: #555  
Branch: `feat/admin-account-counts-rollout-preparation-1`  
Binding task: `docs/ADMIN_ACCOUNT_COUNTS_ROLLOUT_PREPARATION_1_TASK_2026-09-23.md` v1 at `7d24b78b413c80ff82ae1f5c03b045fc9b5e17a4`  
Baseline / merge-base: `main@f0237baf8809e5528b5f73e918f0e37a7d9b4477`  
Newer-main drift: **none** vs local `main` and `origin/main` at persist time.  
Previous frozen head (superseded by this residual R1/R3 persist): `9ad07d64066218ff87005581236f4987e117cf42`

Cursor-Agent: **Jetnity admin account counts rollout preparation 1**, Generation 1  
Required / actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-4bf6acab-25f3-4d63-9199-ac365b9c011a` (continued, not a new agent)  
URL: https://cursor.com/agents/bc-4bf6acab-25f3-4d63-9199-ac365b9c011a  
Observed run-info display name: `Admin account counts rollout preparation`. UI rename was **not** performed.

This persist is not Technical-Lead PASS, not live statistics, and not Production/Preview activation. Closed #550/#552/#551/#553/#554 sessions were not resumed. Accepted producer/wrapper/Auth/runtime were not rewritten. #556 was not imported.

## 1. TL residual R1 + R3 implemented (same session)

Residual R1: ACL comparison is now exact tuples of grantor / grantee / privilege / `is_grantable`, including expected owner entries. `WITH GRANT OPTION` on producer EXECUTE, wrapper EXECUTE or schema USAGE is `INCOMPATIBLE`. Expected default-ACL state for `jetnity_reporting` is **empty**; unexpected table-SELECT ADP rows are refused. Same-name public wrapper overloads make the database not `FRESH` and are refused. Expected identity comes from the accepted sources, not from the dirty target.

R3: `composeInstallTransaction({ mode: 'staged' })` applies the unchanged accepted SQL then the package REVOKE in **one** transaction and verifies `REVOKED_EXACT` before commit. Staged fault after apply and before revoke leaves `FRESH`. Granted local-test remains a separately labelled **database-exposed** path. PLAN/PO_PACKET now put the reserved PO exposure gate before the first hosted grant.

R2 revoke→exact-removal path and tests are preserved. Banned/disabled privileged-profile result remains a later-live **NO-GO**.

## 2. Local verification (this writer, after residual R1/R3)

| Class | Result | Kind |
| --- | --- | --- |
| package Node safety | 5/5 PASS | hash pin + hosted/argv reject; staged compose |
| disposable SQL rehearsal | **136/136 PASS** | previous cycle plus GRANT OPTION / ADP tables / overload / staged-unexposed |
| accepted activation/reader/parser | 23/23 PASS | unchanged modules; not rewritten |
| `check:dead` | PASS, 0 orphans | hygiene |
| `check:exports` | PASS, 0 unused | hygiene |
| `check:operating-mode` | PASS | NORMAL |

Engine: PostgreSQL **16.15** on a private socket. Explicitly **not** Production 17.6.

Authorized moderator AAL2 received `present_registered_accounts=16`, `created_in_prior_30_days=12` only on the **granted local-test** path. Staged/unexposed denied wrapper and inner producer with `42501`. Denied callers remain `42501` with no success row.

## 3. Honest blockers (unchanged by a green local packet)

- **NO-GO for later exposure:** banned moderator+AAL2 and disabled admin+AAL2 **still received counts** on the granted local-test path. Producer does not read `profiles.status`. Application `loadRole` selects `role` only.
- Functiondef fingerprints are pinned to PostgreSQL 16.15 pretty-print. A later hosted 17.6 apply must recapture or treat mismatch as BLOCKED.
- Browser/MFA evidence is the parallel independent lane and is **pending** (#556 environment-blocked).
- Production objects remain ABSENT per dated TL metadata. This agent did not connect.

## 4. Not run / not claimed

Full `npm test`, production build, typecheck, lint, hosted CI/Auth/Preview (exact-head IDs belong in the PR conversation after this freeze), remote metadata re-read, live statistics.

**Do not mark Ready. Do not merge. STOP FOR INDEPENDENT TL EXACT-HEAD RE-REVIEW.**
