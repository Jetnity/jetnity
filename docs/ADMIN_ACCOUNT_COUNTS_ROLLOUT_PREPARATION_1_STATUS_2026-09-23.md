# Admin Account Counts Rollout Preparation 1 — STATUS

Stand: 23. September 2026  
Status: **LOCAL PACKAGE TESTED / FROZEN FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO PRODUCTION APPLY**

Draft PR: #555  
Branch: `feat/admin-account-counts-rollout-preparation-1`  
Binding task: `docs/ADMIN_ACCOUNT_COUNTS_ROLLOUT_PREPARATION_1_TASK_2026-09-23.md` v1 at `7d24b78b413c80ff82ae1f5c03b045fc9b5e17a4`  
Baseline / merge-base: `main@f0237baf8809e5528b5f73e918f0e37a7d9b4477`  
Newer-main drift: **none** vs local `main` and `origin/main` at persist time.

Cursor-Agent: **Jetnity admin account counts rollout preparation 1**, Generation 1  
Required / actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-4bf6acab-25f3-4d63-9199-ac365b9c011a`  
URL: https://cursor.com/agents/bc-4bf6acab-25f3-4d63-9199-ac365b9c011a  
Observed run-info display name: `Admin account counts rollout preparation`. UI rename was **not** performed.

This persist is not Technical-Lead PASS, not live statistics, and not Production/Preview activation. Closed #550/#552/#551/#553/#554 sessions were not resumed.

## 1. Delivered

LOCAL-ONLY composition + transactional install/verify/rollback around the **unchanged** accepted producer/wrapper:

- `scripts/db/admin-account-counts-rollout-preparation-1/`
- PLAN, German PO packet, this STATUS, HANDOFF, SELF_REVIEW
- sanitized evidence under `docs/evidence/admin-account-counts-rollout-preparation-1/`

Accepted hashes still match the task pins.

## 2. Local verification (this writer)

| Class | Result | Kind |
| --- | --- | --- |
| package Node safety | 5/5 PASS | hash pin + hosted/argv reject; no cluster |
| disposable SQL rehearsal | **41/41 PASS** | unexpected object, fault residue, fresh, repeat, auth, owner/ACL, rollback+sentinel, reinstall, revoke-vs-identity rollback, cleanup |
| accepted activation/reader/parser | 23/23 PASS | unchanged modules; not rewritten |
| `check:dead` | PASS, 0 orphans | hygiene |
| `check:exports` | PASS, 0 unused | hygiene |
| `check:operating-mode` | PASS | NORMAL |

Engine: PostgreSQL **16.15** on a private socket. Explicitly **not** Production 17.6. System `16/main` was not used. Cleanup removed the owned directory after postmaster stop.

Authorized moderator AAL2 received `present_registered_accounts=16`, `created_in_prior_30_days=12`, definition `jetnity.admin-account-counts.v1`. Denied callers were `42501` with no success row.

## 3. Honest blockers (unchanged by a green local packet)

- **NO-GO for later exposure:** banned moderator+AAL2 and disabled admin+AAL2 **still received counts**. Producer does not read `profiles.status`. Application `loadRole` selects `role` only.
- Privileged owner remains existing `postgres` NOSUPERUSER+BYPASSRLS with SELECT on `auth.users`. No new privilege role. Wrapper owner locally is the fixture executor `jetnity_proof`; Production apply as `postgres` would own the wrapper.
- `pg_default_acl` for `jetnity_reporting` stayed empty after local REVOKE-only ADP. Do not invent a Production ADP row from this.
- Browser/MFA evidence is the parallel independent lane and is **pending**.
- Production objects remain ABSENT per dated TL metadata. This agent did not connect.

## 4. Not run / not claimed

Full `npm test`, production build, typecheck, lint, hosted CI/Auth/Preview (exact-head IDs belong in the PR conversation after this freeze), remote metadata re-read, live statistics.

**Do not mark Ready. Do not merge. STOP FOR INDEPENDENT TL EXACT-HEAD REVIEW.**
