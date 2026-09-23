# Admin Account Counts Rollout Preparation 1 — STATUS

Stand: 23. September 2026  
Status: **LOCAL PACKAGE TESTED AFTER TL R1/R2 / FROZEN FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO PRODUCTION APPLY**

Draft PR: #555  
Branch: `feat/admin-account-counts-rollout-preparation-1`  
Binding task: `docs/ADMIN_ACCOUNT_COUNTS_ROLLOUT_PREPARATION_1_TASK_2026-09-23.md` v1 at `7d24b78b413c80ff82ae1f5c03b045fc9b5e17a4`  
Baseline / merge-base: `main@f0237baf8809e5528b5f73e918f0e37a7d9b4477`  
Newer-main drift: **none** vs local `main` and `origin/main` at persist time.  
Previous frozen head (superseded by this R1/R2 persist): `79e5ec6dfa096c7ce19e7df40a4a403fc9f8fa30`

Cursor-Agent: **Jetnity admin account counts rollout preparation 1**, Generation 1  
Required / actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-4bf6acab-25f3-4d63-9199-ac365b9c011a` (continued, not a new agent)  
URL: https://cursor.com/agents/bc-4bf6acab-25f3-4d63-9199-ac365b9c011a  
Observed run-info display name: `Admin account counts rollout preparation`. UI rename was **not** performed.

This persist is not Technical-Lead PASS, not live statistics, and not Production/Preview activation. Closed #550/#552/#551/#553/#554 sessions were not resumed. Accepted producer/wrapper/Auth/runtime were not rewritten.

## 1. TL CHANGES REQUIRED implemented (same session)

R1: classify, verify and rollback now share `sql/identity.sql`. Installed identity is the pinned `pg_get_functiondef` SHA-256 plus owner / SECURITY / volatility / zero-arg identity / pinned GUC / schema owner = wrapper owner = executor / ACL / executor-sensitive default privileges / extras / dependents. ILIKE substring classify and the weaker rollback duplicate are gone. Adversarial body/owner/ACL/schema/ADP/dependency mutations are refused and left in place.

R2: package REVOKE is `REVOKED_EXACT` when object identity stays exact and the only ACL delta is this package's explicit revocation. Eventual removal accepts `ALREADY_INSTALLED` or `REVOKED_EXACT`. Extra ACL or body drift after revoke remains `INCOMPATIBLE`.

Banned/disabled privileged-profile result remains an honest **NO-GO for later live exposure**. No global Auth/role/producer change.

## 2. Local verification (this writer, after R1/R2)

| Class | Result | Kind |
| --- | --- | --- |
| package Node safety | 5/5 PASS | hash pin + hosted/argv reject; shared identity embed |
| disposable SQL rehearsal | **93/93 PASS** | previous cycle plus adversarial drift (45) and revoke-exact removal |
| accepted activation/reader/parser | 23/23 PASS | unchanged modules; not rewritten |
| `check:dead` | PASS, 0 orphans | hygiene |
| `check:exports` | PASS, 0 unused | hygiene |
| `check:operating-mode` | PASS | NORMAL |

Engine: PostgreSQL **16.15** on a private socket. Explicitly **not** Production 17.6. System `16/main` was not used. Cleanup removed the owned directory after postmaster stop.

Authorized moderator AAL2 received `present_registered_accounts=16`, `created_in_prior_30_days=12`, definition `jetnity.admin-account-counts.v1`. Denied callers were `42501` with no success row.

Proven revoke path: install → REVOKE → authorized caller `42501` → `REVOKED_EXACT` → exact removal → `FRESH`. Sentinel survived.

## 3. Honest blockers (unchanged by a green local packet)

- **NO-GO for later exposure:** banned moderator+AAL2 and disabled admin+AAL2 **still received counts**. Producer does not read `profiles.status`. Application `loadRole` selects `role` only.
- Privileged owner remains existing `postgres` NOSUPERUSER+BYPASSRLS with SELECT on `auth.users`. No new privilege role. Wrapper owner locally is the fixture executor `jetnity_proof`; Production apply as `postgres` would own the wrapper.
- `pg_default_acl` for `jetnity_reporting` stayed empty after local REVOKE-only ADP. Do not invent a Production ADP row from this.
- Functiondef fingerprints are pinned to PostgreSQL 16.15 pretty-print. A later hosted 17.6 apply must recapture or treat mismatch as BLOCKED.
- Browser/MFA evidence is the parallel independent lane and is **pending**.
- Production objects remain ABSENT per dated TL metadata. This agent did not connect.

## 4. Not run / not claimed

Full `npm test`, production build, typecheck, lint, hosted CI/Auth/Preview (exact-head IDs belong in the PR conversation after this freeze), remote metadata re-read, live statistics.

**Do not mark Ready. Do not merge. STOP FOR INDEPENDENT TL EXACT-HEAD RE-REVIEW.**
