# Admin Account Counts Caller Status 1 — STATUS

Stand: 23. September 2026  
Status: **LOCAL IMPLEMENTATION + PROOFS FROZEN FOR INDEPENDENT TECHNICAL-LEAD REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO HOSTED APPLY**

Draft PR: #557  
Branch: `fix/admin-account-counts-caller-status-1`  
Binding task: `docs/ADMIN_ACCOUNT_COUNTS_CALLER_STATUS_1_TASK_2026-09-23.md` v1 at `99fa42dca4c46116498d0cc74ea7cd26e467b591`  
Exact baseline / merge-base: `main@87cdc1e6858ff0fb57481dd9c3d56fd618f1e03b`  
Implementation persist: `bd44228d7ced523b85ff699b209fd42794900349`  
Harness repair persist: `1f38a9689b79af81d7fa0742e83f851ec264f3d1`  
Previous freeze (invalidated): `0e7cebe6953e429e89c209916178a786a0c93099`  
Docs persist / freeze candidate: this STATUS commit on `fix/admin-account-counts-caller-status-1`  
Mode: NORMAL

Cursor-Agent: **Jetnity admin account counts caller status 1**, Generation 1  
Required / actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-4bf98f13-10aa-4cff-af82-dee79ebc920c`  
URL: https://cursor.com/agents/bc-4bf98f13-10aa-4cff-af82-dee79ebc920c  
Observed run-info display name: `Admin account counts caller status`. UI rename was **not** performed.

This persist is not Technical-Lead PASS, not live statistics, and not Production/Preview activation. Closed #555 and active #556 sessions were not resumed. Shared Auth/roles/MFA/session, activation, wrapper SQL, parser/contract, package/CI and central docs were not edited. Historical #555 evidence remains historical.

## 1. What this head implements

Authoritative SQL: `jetnity_reporting.account_counts_v1()` now looks up `public.profiles.status` for `auth.uid()` and continues only when that persisted status is exactly `active`. banned / disabled / pending / NULL / missing / unrecognized deny with `42501` before the aggregate. Subject, nondeleted, nonanonymous, `darf_konten_verwalten()` and AAL2 gates remain. Metric population, 720-hour half-open window, empty arguments, privileges and no client `auth.users` SELECT are unchanged. Banned/internal/unconfirmed profiles still count when the auth row belongs to the accepted population.

Application defense: the existing reader reuses the verified user from `evaluateAdminAccess`, then reads only that user's persisted status through the authenticated server client. Denied/unknown status is forbidden without RPC. Lookup throw/error is failed without RPC. Runtime OFF still performs no gate, no status lookup and no RPC. Break-glass remains denied.

## 2. Identity pins from a clean disposable reference

| Object | Value |
| --- | --- |
| New candidate file SHA-256 | `612f755c12f1817e129226648b6c6fd2c1eba19b57bd163102a2eb5e344c12de` |
| New candidate git blob | `b912eecb55cfa519dcd8b5d4a4ca9222aea0a0c1` |
| New producer `pg_get_functiondef` SHA-256 | `b9cec2b3cad0052688f5f396cfd1d532d4035bd1d51254723c1d650dc0d1048b` |
| Engine that produced the functiondef pin | PostgreSQL **16.15** on a private socket |
| Wrapper file / functiondef | unchanged `13fa3fe280d76d42ca6b2a1dff12077edc3d44a599a22300e89dd5578d63a6fb` / `15fc07ede14dd74eb5f77382b730c85c27a2004199f272d76ee1967525efc609` |
| Historical #555 candidate SHA-256 | `dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420` — **REFUSED** |
| Historical #555 producer functiondef | `0c936c2a5a693cefe051d3a0c92e9a47f51e902f9e273efcebb82113d834d7ef` — **REFUSED** |

A leftover #555 producer is `INCOMPATIBLE`, not `ALREADY_INSTALLED`. This package does not rewrite it in place. A later controlled upgrade remains required after #556 stops writing and TL authorizes compatibility re-pin.

## 3. Local verification (this writer)

| Class | Result | Kind |
| --- | --- | --- |
| caller-status + reader + activation + parser | 29/29 PASS | Node |
| local / delivery / rollout runner safety + pins | 17/17 PASS | Node |
| HTTP harness H1–H3 | 21/21 PASS | Node; not a live PostgREST transport PASS |
| disposable producer SQL | **70/70 PASS** | private PostgreSQL 16.15 |
| disposable wrapper SQL | **36/36 PASS** | private PostgreSQL 16.15 |
| rollout install / grant / staged-unexposed / revoke / rollback / drift | **139/139 PASS** | private PostgreSQL 16.15 |
| `check:dead` | PASS, 0 orphans | hygiene |
| `check:exports` | PASS, 0 unused | hygiene |
| `check:operating-mode` | PASS | NORMAL |

Authorized active privileged AAL2 still received fixture aggregates (`present=14` / `window=10` on the local/delivery fixtures; rollout granted path `present=16` / `window=12`). Banned/disabled/pending privileged callers are now `42501` with no zero success row. Direct SQL status change denied the same JWT on the next producer/wrapper call. Owner counts did not change solely because another profile status changed. Lifecycle still counts banned/unconfirmed/internal auth rows in the population.

## 4. Honest remaining boundaries

- Auth-level `banned_until`, session revocation/token lifetime and general Admin status enforcement are **distinct** and are **not** declared fixed.
- No Browser / GoTrue / MFA / hosted PG17 parity PASS. #556 owns preflight helper B1/B2 on its own branch; this slice did not import it.
- Connected hosted Production objects remain ABSENT per dated TL metadata. This agent did not connect, apply, grant or activate.
- Local 16.15 functiondef pins are that engine's pretty-print. A later hosted 17.6 apply must recapture or treat mismatch as BLOCKED.
- Full `npm test`, production build, typecheck and lint were not run by this persist. Exact-head CI/Auth/Preview belong to the new frozen head after this docs persist. The previous freeze `0e7cebe6` is invalidated.

## 5. Exact-head CI failure on the previous freeze — repaired locally

Invalidated freeze `0e7cebe6953e429e89c209916178a786a0c93099`:
- Workflow `35852662043` Typecheck/Lint/Build job `107153751087` **FAILED** (`npm test` 3897 pass / 2 fail).
- Auth job `107153750758` SUCCESS on that old head only.
- Preview comments job `107153867866` SUCCESS on that old head only. Those gates do not transfer.

Root cause: `defaultAccountCountsGate` now reads `profiles.status` through `createServerComponentClient()`. The existing effective-target SSR stub implemented only `rpc()`. The role-backed local-positive path therefore threw, mapped to `failed`, and did not invoke the wrapper. This is existing delivery-proof compatibility, not a product-contract change.

Harness repair `1f38a9689b79af81d7fa0742e83f851ec264f3d1`:
- Stub returns `{ status: 'active' }` for the harness user's own `profiles.status` lookup.
- Unsupported or other-user lookups fail closed.
- Local-positive now expects two authenticated creates / two cookie reads (own-status then wrapper RPC) and still exactly one `admin_account_counts_v1` RPC.
- Runtime OFF / remote / missing-target paths still have zero create / rpc / guard / cookies.

Re-run on this writer after the repair:
- caller-status + reader + effective-target: **22/22 PASS**
- activation + parser + render + schema-reference: **20/20 PASS**

This persist does not claim a new exact-head CI/Auth/Preview PASS. Those belong to the new frozen head after push.

**Do not mark Ready. Do not merge. STOP FOR INDEPENDENT TL EXACT-HEAD REVIEW.**
