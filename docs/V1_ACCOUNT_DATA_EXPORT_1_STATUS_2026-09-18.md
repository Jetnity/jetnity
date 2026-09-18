# Jetnity – V1 Account Data Export 1 STATUS

Stand: 18. September 2026  
Status: **IMPLEMENTATION GATED ON `dd99ee9d` / THIS EVIDENCE COMMIT INVALIDATES THAT EXACT-HEAD / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #474  
Draft PR: #476  
Branch: `feat/v1-account-data-export-1`  
Binding task: `docs/V1_ACCOUNT_DATA_EXPORT_1_TASK_2026-09-18.md`  
Source audit: #438 / merged PR #449 / finding 2.1  
Canonical base: `main@854045a0f37e07d783115dd3a0ee6b302f79bfa1`  
Dispatch head: `1e7dc04d950ba7e6be9d0c1b16d98f3ce99e8ebb`  
Gated implementation head: `dd99ee9d70b6b6c704d35e889b8600c41c8b6345`

Cursor-Agent: **Jetnity V1 account data export 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast** — confirmed (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-382bcfd9-32cd-4eb0-bcc4-c0fc49ae2c09`

This file is point-in-time evidence. Every new head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS.

---

## 1. Scope held

Runtime:

- `app/api/account/export/route.ts`
- `app/account/settings/page.tsx`
- `lib/account/datenexport.ts`

Focused tests:

- `lib/account/datenexport.test.ts`
- `lib/readiness/p2-ta04-write-path-inventory.test.ts` — existing write-path lock updated so the export helper may **SELECT** `trip_travellers` / child tables; insert/update/upsert/delete and party RPCs remain forbidden

Slice docs:

- `docs/V1_ACCOUNT_DATA_EXPORT_1_TASK_2026-09-18.md`
- `docs/V1_ACCOUNT_DATA_EXPORT_1_STATUS_2026-09-18.md`
- `docs/V1_ACCOUNT_DATA_EXPORT_1_HANDOFF_2026-09-18.md`
- `docs/V1_ACCOUNT_DATA_EXPORT_1_SELF_REVIEW_2026-09-18.md`

No migration. No service role. No Storage. No account deletion. No legal page. No global continuity file. No #475 CookieConsent file.

Diff vs `origin/main` is exactly these nine files.

## 2. Runtime contract implemented

- `GET /api/account/export` uses `createRouteHandlerClient()` then `auth.getUser()` and returns 401 when unauthenticated.
- `GET()` has no `Request` argument, so a user id cannot come from query, body or path.
- Reads use the session client, existing RLS, `lese()` empty-vs-error separation, and a session `user_id` filter from `getUser()`.
- Required table list is exact. A table-query error fails the complete export. Empty owned tables export as empty arrays.
- Pages of 1000 rows are read; more than 20_000 rows in one table fails closed instead of truncating.
- JSON has `schemaVersion = jetnity.account-export.v1` and `generatedAt`.
- Response is sent directly: `Content-Type: application/json; charset=utf-8`, `Content-Disposition: attachment`, `Cache-Control: no-store`.
- Filename is `jetnity-account-export-YYYY-MM-DD.json` — no email, name or user id.
- `/account/settings` has an accessible export section: current account/travel download, sensitivity warning, no legal-completeness claim, no deletion language.

## 3. Rate / abuse inspection

Inspected existing route guards: `lib/safety/rate-limit.ts`, `lib/flights/rate-limit.ts`, `lib/hotels/rate-limit.ts`, `lib/readiness/rate-limit.ts`, `lib/activities/rate-limit.ts`, `lib/mobility/rate-limit.ts`, `lib/rental-cars/rate-limit.ts`. All wrap `providerOpsInMemoryCostGuard`. That is process-local and not reliable across serverless instances.

No durable non-persistent global throttle exists that this slice may honestly reuse. No table, migration, external service or in-memory fake guarantee was added. Authenticated / no-store / fail-closed direct export is the V1 boundary.

`/api/account` is not a proxy scope. The route itself is the auth gate. Proxy was not changed.

## 4. Local gates on `dd99ee9d`

| Gate | Result |
| --- | --- |
| Focused `lib/account/datenexport.test.ts` | **PASS – 8/8** |
| `npm test` | **PASS – 3468 tests, 0 fail** |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS – 0 errors, 139 pre-existing warnings** |
| `npm run build` | **PASS** — route listed as `ƒ /api/account/export` |
| `check:dead` | **PASS** (CookieConsent exception unchanged; #475 not touched) |
| `check:exports` | **PASS** |
| `check:deps` | **PASS** |
| `check:api-schutz` | **PASS – 12 admin routes** |
| `check:schema-bezug` | **PASS** |

Service-role grep on slice runtime: no `SERVICE_ROLE`, `service_role`, `createAdminClient` or `SUPABASE_SERVICE_ROLE_KEY`.

Unauthenticated live local production server:

- `GET /api/account/export` → **401** `{"error":"unauthenticated","message":"Nicht angemeldet."}` + `Cache-Control: no-store`
- `GET /account/settings` → **307** `/login?next=%2Faccount%2Fsettings`

Authenticated download was not exercised: no session credentials in this agent environment.

## 5. Exact-head CI + Preview on `dd99ee9d`

| | |
| --- | --- |
| CI | **SUCCESS** — run `35337090168` / jobs Auth-Konfiguration + Typecheck, Lint & Build |
| Vercel Preview | **READY** — deployment `C5vUCdkrgYY1P1vCPMTHdJb3oj9j` commit-status success on `dd99ee9d` |
| Preview URL | `https://jetnity-app-git-feat-v1-account-data-export-1-jetnity-e1b93c82.vercel.app` |
| Preview HTTP from this agent | Vercel SSO 302; not a product 401 |

This evidence persist is a new head and invalidates those exact-head gates.

## 6. Live git comparison before this persist

| | |
| --- | --- |
| `origin/main` | `854045a0f37e07d783115dd3a0ee6b302f79bfa1` |
| Merge-base | **`854045a0`** (current main) |
| Ahead / behind | **3 / 0** |
| Sibling merge | none |

## 7. GitHub / Vercel thread

- PR #476 remains **Draft**, **not Ready**, **not merged**, `mergeable_state=blocked` (draft).
- Issue #474 open; this PR is the configured closer.
- Vercel bot comment updated; deployment Ready on gated head.
- Dispatch comment `5728938522` remains the binding implementation dispatch.

## 8. Next step

**STOP FOR TECHNICAL-LEAD REVIEW.** Re-gate this persist head if the review must be exact-head on the docs commit. No Ready. No merge. No follow-up slice.
