# Admin Account Counts HTTP Proof 1 — STATUS

Stand: 22. September 2026  
Status: **RESIDUAL H1-A/H1-B LIFECYCLE FIX RERUN COMPLETE / FROZEN FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW / NOT A PRODUCT PASS / DRAFT / NOT READY / NOT MERGED**

Draft PR: #554  
Branch: `audit/admin-account-counts-http-proof-1`  
Binding task: `docs/ADMIN_ACCOUNT_COUNTS_HTTP_PROOF_1_TASK_2026-09-22.md` v1 at seed `c19d7d92807db97187bb3770cc61c5dc4eb1f738` (immutable)  
Authorized / current main: `72291ee6b2d99e6ef9e1deab925f41baf7a2f0ed` (fetched; no newer drift)  
Original branch baseline: `ff054f76c14cf1c434890ba342af4df5e536dd05`  
Examined immutable snapshot: `dcf7bfee497ba3aa2038a43fe4bc2a09e541625f`  
Reviews: `5284332971` (H1–H3; historical `0109fce2`) then residual `5284606563` on `c9f5df59a1b31e3387f4645e9d3c21046c62b704`  
Mode: NORMAL

Cursor-Agent: **Jetnity admin account counts HTTP proof 1**, Generation 1  
Required / actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-e1622174-d101-44e3-bb7d-d4fad18cd016`  
Session URL: https://cursor.com/agents/bc-e1622174-d101-44e3-bb7d-d4fad18cd016  
Observed run-info display name: `Admin account counts HTTP proof`. UI rename was **not** performed.

This file is point-in-time evidence. Agent self-review is not Technical-Lead PASS. Exact-head CI / Auth / Preview belong in conversation after this freeze, not in a later status-only commit.

**#553 is CLOSED / MERGED / POST-MERGE VERIFIED** (accepted `f9a41701`, TL PASS `5284282407`, closure `5784907079`). Incoming product/shared/central-doc files from the authorized main merge were not edited.

---

## 1. Goal

Fill the missing **real local PostgREST HTTP / signature / role / JSON** boundary for the pinned producer/bootstrap/wrapper/parser/contract, then correct review H1–H3 in the same evidence lane.

## 2. Implemented (allowed paths only)

- `scripts/db/admin-account-counts-http-proof-1.mjs` — H1 owned-process reap + pid/LISTEN readback; H2 structured PostgREST v16 pairs + schema-cache convergence; H3 Accept-Profile/Content-Profile + before/after catalog snapshots
- `scripts/db/admin-account-counts-http-proof-1.test.mjs` — 21 isolation/fault controls, including direct already-ended waiter and post-spawn EPERM error retention
- `scripts/db/admin-account-counts-http-proof-1-fixture.sql` — unchanged labelled authenticator / seed / large-value transport
- `docs/evidence/admin-account-counts-http-proof-1/*`
- this STATUS / HANDOFF / SELF_REVIEW

No product runtime, shared client, checker, migration, package/lock/CI, central-doc or #553 file edits. No public app audit route. No new agent.

## 3. Source pin (unchanged)

| Source | Pin | dcf7bfee | main 72291ee6 |
| --- | --- | --- | --- |
| producer | sha256 `dcf4d35d…ccd4420` | match | match |
| bootstrap | sha256 `0413821d…e6f6ea2` | match | match |
| wrapper | sha256 `13fa3fe2…d63a6fb` | match | identical |
| parser | blob `6205ecbb…f6d` | match | identical |
| contract | blob `6826eeea…e9b8` | match | identical |

The harness still exports wrapper/parser/contract from **dcf7bfee**, not from a silent working-tree retarget.

## 4. Local HTTP proof (this H1–H3 rerun)

| Gate | Result |
| --- | --- |
| PostgreSQL | **17.11** private `initdb` socket; system `17/main` down/unused |
| PostgREST | **16.3** numeric loopback; owned LISTEN `0A`; 34 requests |
| Proof command | **46/46 PASS**, 1 observation, exit 0 (author mixed HTTP/SQL/parser/cleanup; not TL's 88 helper checks) |
| Safety / fault tests | **21/21 PASS**, exit 0 (includes H1-A already-ended waiter + H1-B emitted EPERM; not TL's four lifecycle probes) |
| Cleanup | `httpStopped:true`, `httpReaped:true`, SIGTERM, tree removed after confirmed stop |
| Remote/hosted DB | unused |

Historical `0109fce2` 38/38 run remains dated author observation and is not this result.

### Assertion categories

| Category | Count | Kind |
| --- | --- | --- |
| `http-isolation` | 1 | owned pid + LISTEN loopback |
| `http-auth` | 5 | JWT + wrapper + parser; present `10`/`11`, window `0`/`1` |
| `http-deny` | 16 | exact 403/42501, 401/42501, 401/PGRST301, 401/PGRST303 |
| `http-shape` | 2 | GET; extra args 404/PGRST202 |
| `http-schema-profile` | 4 | 406/PGRST106 + public-profile 200 |
| `http-route-shape` | 4 | labelled invalid path / missing public object |
| `http-schema-cache` | 1 | waited for 404/PGRST202 |
| `http-large-transport` | 1 | TEXT `9007199254740993` / `9223372036854775807` |
| `parser` | 2 | frozen parser negatives |
| `sql-catalog` | 6 | before/after definition/owner/ACL/RLS |
| `static-source` | 3 | source scans |
| `cleanup-node` | 1 | stop confirmed before removal |
| `http-observation` | 1 | clocks; not counted as an assertion |
| runner-safety | 21 | Node isolation + H1/H2/H3 + residual H1-A/H1-B |

## 5. Findings for Technical Lead

No product HTTP/signature/role disclosure defect was established against the **frozen dcf7bfee** wrapper/producer/parser on this local cluster.

H2/H3 and the H1 listener/removal-gate work on `c9f5df59` remain accepted at their bounded scope and were not redesigned.

Residual review `5284606563` H1-A/H1-B:

- H1-A: `waitForOwnedChildExit` now initializes timer/listener state before any settlement. A real already-exited / already-signaled child resolves; no `timer` TDZ.
- H1-B: a post-spawn ChildProcess `error` (including injected kill EPERM) is recorded as failure and does **not** set exited/reaped/httpStopped. Ownership is retained until exit evidence. The no-error/no-running/no-unreaped removal gate is unchanged. No data-loss or Production incident is claimed.

Normal-run teardown on this rerun again observed `httpStopped:true` / `httpReaped:true` via SIGTERM. That is distinct from the EPERM fault-control evidence.

P3 limitations, not product defects:

- Local PostgREST 16.3 ≠ hosted Supabase PostgREST.
- Local PostgreSQL 17.11 ≠ Production 17.6.
- Not GoTrue / login / MFA / browser / Production E2E and not Guardian.
- No local production-app build was re-run; only proof/harness tests. Product files were not edited. CI/TLB on the frozen head is the integration gate.

## 6. What this is not

Not Ready. Not merge of this PR. Not Production/exposure activation. Not a live-count claim. Preview for this PR is integration evidence only.

**STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW.**
