# Admin Account Counts HTTP Proof 1 — STATUS

Stand: 22. September 2026  
Status: **LOCAL HTTP TRANSPORT PROOF COMPLETE / FROZEN FOR INDEPENDENT TECHNICAL-LEAD REVIEW / NOT A PRODUCT PASS / NOT AN ACCEPTANCE OF #553 / DRAFT / NOT READY / NOT MERGED**

Draft PR: #554  
Branch: `audit/admin-account-counts-http-proof-1`  
Binding task: `docs/ADMIN_ACCOUNT_COUNTS_HTTP_PROOF_1_TASK_2026-09-22.md` v1 at seed `c19d7d92807db97187bb3770cc61c5dc4eb1f738`  
Verified branch baseline: `main@ff054f76c14cf1c434890ba342af4df5e536dd05`; mode NORMAL  
Examined immutable snapshot: `dcf7bfee497ba3aa2038a43fe4bc2a09e541625f`

Cursor-Agent: **Jetnity admin account counts HTTP proof 1**, Generation 1  
Required / actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-e1622174-d101-44e3-bb7d-d4fad18cd016`  
Session URL: https://cursor.com/agents/bc-e1622174-d101-44e3-bb7d-d4fad18cd016  
Observed run-info display name: `Admin account counts HTTP proof`. UI rename was **not** performed (no rename capability in this session).

This file is point-in-time evidence. Agent self-review is not Technical-Lead PASS. Exact-head CI / Auth / Preview belong in a **PR comment**, not a later evidence-only commit. #553 keeps first main integration priority.

---

## 1. Goal

Fill the still-unverified **real local PostgREST HTTP / signature / role / JSON** boundary for the accepted account-count producer and the frozen zero-argument wrapper. This is not another broad audit, not a repeat of #552 inner SQL, and not a competing correction of #553 residual R1.

## 2. Implemented

Allowed paths only:

- `scripts/db/admin-account-counts-http-proof-1.mjs` — isolated harness
- `scripts/db/admin-account-counts-http-proof-1.test.mjs` — harness-safety tests
- `scripts/db/admin-account-counts-http-proof-1-fixture.sql` — labelled authenticator / seed / large-value transport
- `docs/evidence/admin-account-counts-http-proof-1/*`
- this STATUS / HANDOFF / SELF_REVIEW

No product runtime, shared client, checker, migration, package/lock/CI, central-doc or #553 file edits. No public app audit route.

## 3. Source pin

| Source | Pin | Measured |
| --- | --- | --- |
| producer | sha256 `dcf4d35d…ccd4420` | match |
| bootstrap | sha256 `0413821d…e6f6ea2` | match |
| wrapper @ dcf7bfee | sha256 `13fa3fe2…d63a6fb` | match |
| parser @ dcf7bfee | blob `6205ecbb…f6d` | match |
| contract @ dcf7bfee | blob `6826eeea…e9b8` | match |

Observed #553 head at freeze time: `f9a41701f0dfcacc23efb605089169d330dc1ed4` (`fix: bind account-count activation to the shared captured URL` plus addendum `86f5d484`). **Not imported. Not accepted. Residual R1 remains the existing implementer's.**

## 4. Local HTTP proof (verified on this freeze)

| Gate | Result |
| --- | --- |
| PostgreSQL | **17.11** private `initdb` socket cluster; system `17/main` down/unused |
| PostgREST | **16.3** numeric loopback `127.0.0.1` only; 29 requests |
| `node --import tsx scripts/db/admin-account-counts-http-proof-1.mjs` | **38/38 PASS**, exit 0 |
| `node --import tsx --test scripts/db/admin-account-counts-http-proof-1.test.mjs` | **8/8 PASS**, exit 0 |
| Remote/hosted DB | unused; inherited Supabase/PG/PostgREST defaults rejected |
| Frozen parser on real HTTP bodies | PASS for authorized rows; rejects projection/empty/zero-present |

### Assertion categories

| Category | Count | Kind |
| --- | --- | --- |
| `http-isolation` | 1 | `/proc/net/tcp` local `0100007F` |
| `http-auth` | 5 | JWT + wrapper + parser; present `10`/`11`, window `0`/`1` |
| `http-deny` | 15 | 403/`42501`, 401/`42501`, 401/`PGRST301`, 401/`PGRST303` |
| `http-shape` | 3 | POST `{}`, GET, extra args |
| `http-schema` | 4 | producer/auth.users/reporting/internal unavailable |
| `http-schema-cache` | 1 | dropped wrapper → 404 `PGRST202`, not zero |
| `http-large-transport` | 1 | TEXT `9007199254740993` / `9223372036854775807` |
| `parser` | 2 | frozen parser negatives |
| `sql-catalog` | 2 | producer intact; grants not widened |
| `static-source` | 3 | source scans |
| `cleanup-node` | 1 | owned stop + removal |
| runner-safety | 8 | Node isolation tests |

## 5. Findings for Technical Lead

No product HTTP/signature/role disclosure defect was established against the **frozen dcf7bfee** wrapper/producer/parser.

P3 limitations, not product defects:

- Local PostgREST 16.3 ≠ hosted Supabase PostgREST.
- Local PostgreSQL 17.11 ≠ Production 17.6.
- Not GoTrue / login / MFA / browser / Production E2E and not Guardian.
- Cleanup JSON still reports `httpStopped=false` (conservative `/proc/<pid>/comm` field) while post-run process/dir checks found no leftover PostgREST or proof cluster; system `17/main` remained down.
- #553 changing R1 loader was not run and cannot be accepted from this evidence.

## 6. What this is not

Not Ready. Not merge. Not a second #553 writer. Not Production/exposure activation. Not a live-count claim. Preview for this PR is integration evidence only.

**STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW.**
