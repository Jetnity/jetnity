# Admin Account Counts Rollout Preparation 1 — PLAN

Date: 2026-09-23  
Status: **LOCAL PREPARATION DESIGN / NOT PRODUCTION APPROVAL / NOT LIVE ACTIVATION**  
Agent: **Jetnity admin account counts rollout preparation 1**, Generation 1  
Required model: **Cursor Grok 4.6 High Fast / cursor-grok-4.6-high-fast**  
Branch: `feat/admin-account-counts-rollout-preparation-1`  
Task: `docs/ADMIN_ACCOUNT_COUNTS_ROLLOUT_PREPARATION_1_TASK_2026-09-23.md` v1 at `7d24b78b413c80ff82ae1f5c03b045fc9b5e17a4`  
Baseline: `main@f0237baf8809e5528b5f73e918f0e37a7d9b4477`, operating mode NORMAL

This plan is the environment state machine, inventory, prerequisites and stop criteria for a **local-only** installation/verification/rollback package. It does not authorize hosted SQL, Preview/Production enablement, or a later exposure.

Traveller-context check: **not relevant**. These two raw registration aggregates do not vary by citizenship, document, residence or route. No traveller credentials are collected.

## 1. Goal

Compose the unchanged accepted producer and wrapper, rehearse transactional install / repeat / fault / rollback on a disposable private PostgreSQL, and document the later enablement design plus honest authorization blockers. Two measures only: present registered accounts and the subset created in the previous fixed 720 hours.

## 2. Accepted sources (read-only, hash-pinned)

| Object | Path | Pin |
| --- | --- | --- |
| Producer | `scripts/db/admin-account-counts-1-candidate.sql` | SHA256 `dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420` |
| Local fixture | `scripts/db/admin-account-counts-1-bootstrap.sql` | SHA256 `0413821d7c75c76908dd437527d623fcbed59c524135adbf5e5974730e6f6ea2` |
| Wrapper | `scripts/db/admin-account-counts-delivery-1-rpc.sql` | SHA256 `13fa3fe280d76d42ca6b2a1dff12077edc3d44a599a22300e89dd5578d63a6fb` |
| Contract | `lib/admin/account-counts-delivery/contract.ts` | blob `6826eeea70aecc0507d05624daaeac47af0be9b8` |
| Parser | `lib/admin/account-counts-delivery/parser.ts` | blob `6205ecbba621b048fff479856c5523fab5ec4f6d` |

A mismatch is **BLOCKED**, not permission to target other code.

Bootstrap is a lightweight **LOCAL fixture**. It is not a GoTrue schema and must never run against a hosted database.

## 3. Exclusive writes

Only:

- `scripts/db/admin-account-counts-rollout-preparation-1/`
- this PLAN, the German PO packet, STATUS / HANDOFF / SELF_REVIEW
- `docs/evidence/admin-account-counts-rollout-preparation-1/`

No app / lib / auth / checker / package / CI / migration / central-doc edits. No writes to the parallel browser-acceptance lane.

## 4. Inventory used for modelling (TL dated metadata, not this agent's remote read)

Technical-Lead read-only Production metadata (23 September) on project `qscbgcdmivbbnzrcyegn`, PG **17.6** / UTC:

- reporting schema, inner function and public wrapper **ABSENT**
- latest migration `20260917120000 account_visits`
- `auth.users` owner=`supabase_auth_admin`, RLS=true, FORCE=false, policies=0
- existing `postgres` **NOSUPERUSER / BYPASSRLS** with SELECT on `auth.users`
- `anon` / `authenticated` / `service_role` lack `jetnity_internal` USAGE
- no account rows or credentials were read

This permits local modelling only. No Development project or hosted branch is authorized.

Local rehearsal engine is whatever disposable binary the runner finds (expected **16.15** in this environment). That is **not** Production 17.6.

## 5. Package objects and executor-sensitive defaults

The package installs only:

1. schema `jetnity_reporting`
2. `jetnity_reporting.account_counts_v1()` — SECURITY DEFINER, owner **postgres**, 0 args, `search_path=pg_catalog`, `TimeZone=UTC`
3. `public.admin_account_counts_v1()` — SECURITY INVOKER wrapper, 0 args, owner = **install executor** (candidate does not `ALTER OWNER` the wrapper)

`ALTER DEFAULT PRIVILEGES IN SCHEMA jetnity_reporting` is recorded **for the current executor**. A later hosted apply must use the intended owner login (`postgres`), not a different role that would write ADP/schema ownership for the wrong principal. This package does not invent SUPERUSER.

Client roles must not receive SELECT on `auth.users`. No new BYPASSRLS role. No managed-auth policy change. No `jetnity_internal` grant. No CASCADE.

## 6. Installation states

Classification and rollback share **one** identity contract (`sql/identity.sql`), embedded into verify/rollback. They do not use a weaker ILIKE/attribute duplicate.

Exact installed identity is the SHA-256 of `pg_get_functiondef` on PostgreSQL 16.15 of the unchanged accepted sources, plus owner / SECURITY / volatility / zero-arg identity / pinned `search_path` / producer `TimeZone=UTC`, plus schema owner = wrapper owner = classify executor (not a client role), plus executor-sensitive default privileges with no non-grantor function EXECUTE, plus no extra reporting objects and no unexpected dependents. Pinned functiondef digests:

- producer `0c936c2a5a693cefe051d3a0c92e9a47f51e902f9e273efcebb82113d834d7ef`
- wrapper `15fc07ede14dd74eb5f77382b730c85c27a2004199f272d76ee1967525efc609`

A different major pretty-printer is **BLOCKED**, not a repair. Drift is never auto-repaired.

| State | Meaning | Action |
| --- | --- | --- |
| `FRESH` | reporting schema absent **and** no `account_counts_v1` / `admin_account_counts_v1` of any signature | transactional apply; refuse same-name overloads |
| `ALREADY_INSTALLED` | `identity_core_ok` and the package's **exact** granted ACL tuples (grantor/grantee/privilege/`is_grantable=false`) | granted **local-test** verify only; this is database-exposed |
| `REVOKED_EXACT` | same strong object/owner/ADP/dependency/signature identity; ACL is the package revoke (empty function ACL, owner-only schema UC, no GRANT OPTION) | staged/unexposed install target **and** removable |
| `INCOMPATIBLE` | any unexpected object, owner, body, ACL (including WITH GRANT OPTION), signature/overload, ADP row, extra or partial residue | refuse; do not repair in place |

Install is one transaction with `lock_timeout=3s`, `statement_timeout=20s`, `idle_in_transaction_session_timeout=30s` and `pg_advisory_xact_lock(hashtext('jetnity.admin-account-counts.v1'))`. Failure rolls back to FRESH. Repeat of an exact install is a verify. A second "fresh" apply is refused.

## 7. Three disable layers (not interchangeable)

1. **Application disable** — `isAdminAccountCountsRuntimeEnabled()` stays false unless flag=`true`, `NODE_ENV` is `development`|`test`, no Vercel/CI marker, and **both** the current process URL and the shared client's captured URL are loopback. A flag cannot enable Production. Disabling the UI is **not** revocation of RPC EXECUTE.
2. **Immediate access revocation** — explicit `REVOKE ALL ... FROM PUBLIC` **and** from `anon`/`authenticated`/`service_role` on both functions and schema USAGE. PostgreSQL does not revoke PUBLIC by revoking a named role.
3. **Eventual object removal** — identity-strict `DROP FUNCTION` of the wrapper, then the producer, then `DROP SCHEMA jetnity_reporting`. No CASCADE. Removable states are `ALREADY_INSTALLED` or `REVOKED_EXACT` after the shared strong identity check. Every other drift is refused. Unrelated sentinel objects stay.

A revoked-but-present database whose definitions/owners/ADP/dependencies remain exact is `REVOKED_EXACT` and can be removed by this same package. Extra ACL/body/owner/dependency drift after revoke remains `INCOMPATIBLE` and is not dropped.

## 8. Environment state machine (enablement design, not activation)

| State | Database | Application / UI | Who may enter |
| --- | --- | --- | --- |
| **OFF** | objects absent (current Production metadata: absent) | runtime gate false; no section; no RPC | default; unknown; Preview; target mismatch |
| **isolated_test / database_exposed_application_off** | disposable local fixture with **granted** EXECUTE/USAGE (`ALREADY_INSTALLED`) | local flag + loopback process **and** captured client URL may show UI | local rehearsal only. Granted RPC + UI OFF is **database exposed**, not unexposed. |
| **candidate_installed_not_exposed** | objects exist as **`REVOKED_EXACT`**: client EXECUTE/USAGE revoked in the same transaction that created them; no intermediate committed grant | runtime remains OFF | later TL-authorized hosted *object* install still must not grant callable client EXECUTE until the reserved PO exposure gate |
| **authorized_production** | later exact apply **and** later grant of callable EXECUTE after fresh metadata | later separate UI enable pinned to the exact project/URL | reserved PO Production **privilege/exposure** gate first, then a later UI gate |

The reserved Product-Owner Production/privilege/exposure approval sits **before the first hosted grant / callable Data API state**, not merely before UI enablement. A hosted database that grants `authenticated` EXECUTE on the public wrapper is already exposed even if the Jetnity page stays OFF.

Effective target is the shared client's captured URL, not a mutable independent flag. Cache/visibility: failure is `failed` or `forbidden` or `unavailable`, never a zero success row. Fast disable: turn the local flag off / keep hosted markers; that does not revoke SQL EXECUTE.

Smallest later change (not done here): a dedicated activation module that pins Production project/URL after PO approval, plus a later hosted grant step that is itself a reserved gate. Do **not** weaken `activation.ts` to obtain a green packet.

## 9. Authorization review (honest, not greened)

| Path | Producer SQL | Application reader / guard | Later exposure |
| --- | --- | --- | --- |
| Role-backed moderator+ and AAL2 | `darf_konten_verwalten()` = `hat_rolle_mindestens('moderator') AND aktuelles_admin_aal2()` | `evaluateAdminAccess({ capability: 'konten-verwalten' })` then AAL2 | intended allow |
| Break-glass email | unknown; SQL has no allowlist | reader maps `grant !== 'role'` → `forbidden` | application denies; SQL still 42501 unless a real role exists |
| Deleted / anonymous / no subject | 42501 | unauthenticated / getUser miss | deny |
| `profiles.status` banned / disabled | **not checked** | `loadRole` selects **`role` only** | **NO-GO** for later exposure |
| Auth/GoTrue ban or revocation | not modelled (no GoTrue in the fixture) | session missing → deny | distinct from profile status; do not equate them |

Proven prerequisite for any later exposure: a separate TL task (and PO gate if it changes Auth/roles/capabilities) must decide whether banned/disabled privileged callers may still read aggregates. This package does **not** rewrite accepted SQL or global Auth to make the readiness table green.

Privileged-owner implication: `postgres` already has BYPASSRLS and SELECT on `auth.users`. The definer function does not create that privilege; it lets an `authenticated` caller who passes the capability helper **trigger** the privileged aggregate. That EXECUTE surface plus the status gap are the live concerns.

Browser/MFA evidence is **pending** in the parallel independent lane. Missing browser evidence remains an explicit gap, not a reason to relax controls.

## 10. Prerequisites and stop criteria

Prerequisites:

- hashes match
- disposable private socket cluster; `psql -X --no-psqlrc`
- inherited connection defaults stripped
- hosted URL/DSN/argv refused
- system/main cluster not used
- bootstrap only on the disposable database

Stop / fail-closed:

- hash mismatch
- unexpected object / owner / ACL / extra
- forced install error (must leave FRESH)
- rollback drift or unexpected dependents
- hosted contact attempt
- any request to enable Production/Preview from this slice

P0: no incident established.  
P1 prevention: remote contact, destructive rollback, privilege widening.  
P2: installation identity/repeat/failure and authorization honesty.  
P3: local-vs-hosted/browser coverage.

## 11. Tests

- Node: hash pin, hosted reject, CASCADE absence, shared identity embed, pinned functiondef hashes
- Disposable PostgreSQL: unexpected-object refuse, same-name overload refuse, fault-closed residue, fresh granted install, already-installed repeat, authorized and denied callers, banned/disabled honesty, owner/ACL, adversarial body/owner/ACL/GRANT OPTION/schema/ADP/dependency/overload drift refusal, rollback+sentinel, reinstall, revoke → `REVOKED_EXACT` → exact removal → FRESH, revoke-plus-drift refusal, staged unexposed install (apply+revoke in one transaction) + staged fault leaves FRESH
- Applicable existing repository tests/hygiene without changing rules
- Not claimed: browser E2E, hosted Admin session, remote apply, live statistics

## 12. Parallel lane and integration

Parallel **Jetnity admin account counts browser acceptance 1** uses the same immutable main and separate files/session. This preparation has first integration priority. No sibling import, no unsanctioned main sync. Report newer-main drift. Do not mark Ready. Do not merge.

## 13. Costs / gates

No new infrastructure, plan or budget. Existing Cursor usage only; quota/cost balance unknown. Production apply, provider/paid calls, tracking, domain and launch remain reserved gates.
