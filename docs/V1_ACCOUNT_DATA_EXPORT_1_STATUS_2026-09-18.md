# Jetnity – V1 Account Data Export 1 STATUS

Stand: 18. September 2026  
Status: **P2 ALLOWLIST CORRECTION / GATED ON `53dfd358` / THIS EVIDENCE COMMIT INVALIDATES THAT EXACT-HEAD / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #474  
Draft PR: #476  
Branch: `feat/v1-account-data-export-1`  
Binding task: `docs/V1_ACCOUNT_DATA_EXPORT_1_TASK_2026-09-18.md`  
Source audit: #438 / merged PR #449 / finding 2.1  
Assigned dispatch base: `main@854045a0f37e07d783115dd3a0ee6b302f79bfa1`  
Reconciled main: `ac3539d9ceff4e96308a48c51d2d317927245b54`  
TL implementation PASS head: `3f8b29b73681bde93414f30af93d3f5245479b4a`  
Previous locked head (invalidated): `902a4b40b1ba05ce2ed29e766a1b43dac0e058c1`  
TL CHANGES REQUIRED: comment `5729541740` / dispatch `5729543090`

Cursor-Agent: **Jetnity V1 account data export 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast** — confirmed (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-382bcfd9-32cd-4eb0-bcc4-c0fc49ae2c09`

This file is point-in-time evidence. Every new head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS.

---

## 1. Correction performed

Same logical session. Only TL comment `5729541740`.

- Replaced every export `.select('*')` with `KONTO_DATENEXPORT_SPALTEN` — one canonical table → column allowlist.
- Allowlists freeze the current generated `Database['public']['Tables'][T]['Row']` keys for the same 13 owner-scoped tables. No semantic field was added or removed.
- Compile-time `GleicheMenge` fails typecheck if a later generated column is missing from the allowlist or an unknown column is added.
- `schemaVersion` stays `jetnity.account-export.v1`. Comment + test require export-contract review and schema-version handling before a future allowlist field change.
- Route/RLS/auth/`user_id` filter/fail-closed/no-store/no service-role/no persistence/UX copy unchanged.
- No RPC, admin client, raw SQL, or migration.
- Focused tests fail on wildcard select, missing allowlist, write/RPC, or silent table-scope change.
- Inventory now **rejects** `.select('*')` and still rejects insert/update/upsert/delete and write RPCs.

## 2. Live git comparison on implementation head `53dfd358`

| | |
| --- | --- |
| Implementation | `53dfd358b55100f259a52e793463783747d98b7c` |
| Allowlist commit | `019706273d97c90862d45f79445d32bb4205b54f` |
| `origin/main` | `ac3539d9ceff4e96308a48c51d2d317927245b54` |
| Merge-base | **`ac3539d9`** (current main) |
| Ahead / behind | **8 / 0** |
| Slice vs main | only the nine allowed #476 files |

## 3. Scope still held

Accepted #476 semantics remain: session `createRouteHandlerClient` + `auth.getUser()`, no service role, no request user-id, RLS plus session `user_id` filter, fail-closed table reads, empty arrays, direct no-store JSON attachment, exact 13-table scope, honest settings copy, no invented distributed rate-limit. The only runtime change is explicit columns instead of `*`.

## 4. Gates

### 4.1 Historical (invalidated)

| Head | Note |
| --- | --- |
| `3f8b29b7` | TL implementation PASS before main merge |
| `902a4b40` | TL PRE-FINAL / CHANGES REQUIRED; CI `35340683141` / Vercel `CczHzpmBfRE9LbqZNpwZVhTjKFNW` |

### 4.2 Local on implementation head `53dfd358`

| Gate | Result |
| --- | --- |
| Focused export + inventory | PASS – 14/14 |
| `npm test` | PASS – **3469** tests, 0 fail |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS – 0 errors, **138** warnings |
| `npm run build` | PASS — `ƒ /api/account/export` present |
| Hygiene (`dead`/`exports`/`deps`/`api-schutz`/`schema-bezug`) | PASS |

### 4.3 Exact-head CI + Preview on `53dfd358`

| | |
| --- | --- |
| CI | **SUCCESS** — run `35341788949` |
| Vercel Preview | **READY** — deployment `2q4F6yHEDNRLa545SVh2ofeg2UmU` commit-status success on `53dfd358` |
| Preview URL | `https://jetnity-app-git-feat-v1-account-data-export-1-jetnity-e1b93c82.vercel.app` |

This evidence persist is a new head and invalidates those exact-head gates.

## 5. Thread state

- PR #476 remains **Draft**, **not Ready**, **not merged**.
- GitHub review threads: **none**.
- Vercel unresolved review threads: **none** (live-feedback 0/0).
- Correction source: TL comment `5729541740`.

## 6. Next step

**STOP FOR TECHNICAL-LEAD REVIEW.** Re-gate this persist head if FINAL PASS must be exact-head on the docs commit. No Ready. No merge. No Guardian dispatch. No follow-up slice.
