# Jetnity – V1 Admin Revenue Truth 1 STATUS

Stand: 18. September 2026  
Status: **IMPLEMENTED ON `31f7cd7f` WITH LOCAL + EXACT-HEAD GATES RECORDED / THIS EVIDENCE COMMIT INVALIDATES THAT EXACT-HEAD / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #469  
Draft PR: #472  
Branch: `fix/v1-admin-revenue-truth-1`  
Binding task: `docs/V1_ADMIN_REVENUE_TRUTH_1_TASK_2026-09-18.md`  
Source audit: #438 / merged PR #449 / finding 6.3  
Canonical base: `main@c3cde9ad1e2daa2ed0a3912ed6a55de803476385`  
Dispatch head: `f965016ef1f2e9958fd30b714e014d5c5d862783`  
Implementation head: `31f7cd7f59f06f79c98ce6600b0278c712ca022b`

Cursor-Agent: **Jetnity V1 admin revenue truth 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast** — confirmed on this run (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-3db4fd70-ae6c-4512-869b-50ed4f0b42b2`

This file is point-in-time evidence. Every new head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS.

---

## 1. Goal

Close audit finding 6.3 on the admin home overview: do not present legacy/local payment aggregates as revenue or conversion while Jetnity has no provider-backed commercial path.

## 2. Implemented

`components/admin/home/AdminStatsStrip.tsx` no longer calls `admin_payments_summary_30d` and no longer renders:

- `Gesamtumsatz (30T)`
- `Bestellungen (30T)`
- `Refunds (30T)`
- `Payouts (30T)`
- `Bestellungen je Reise` as `orders / reisen30d`

It keeps only independently grounded trip/account aggregates from `admin_reisen_kennzahlen()`:

- `Reisen (30T)`
- `Konten mit Reise (30T)`

Denied/missing capability still renders `–`, not `0`. Payment-query failure no longer blanks the trip tiles.

Shared copy in `lib/admin/ehrliche-zustaende.ts`:

`umsatzConversionHinweis` = *Umsatz, Bestellungen und Conversion sind nicht verfügbar, solange kein provider-backed kommerzieller Pfad existiert. Lokale Zahlungsreste sind kein Umsatz.*

Focused contract: `lib/admin/admin-stats-strip-revenue-truth.test.ts`.

## 3. Traveller-context check

Not relevant. Admin operational truth only. No traveller credentials collected or inferred.

## 4. Hard exclusions held

Not touched:

- Support Process docs / `app/account/error.tsx`
- admin payments page, payment APIs, refund writes
- provider/affiliate activation or attribution
- Supabase / schema / RLS / migrations
- secrets / costs
- global continuity documents
- Ready / merge / follow-up slice

Changed files versus `origin/main` remain inside the allowed write set.

## 5. Local gates on `31f7cd7f`

| Gate | Result |
| --- | --- |
| Focused `lib/admin/admin-stats-strip-revenue-truth.test.ts` + `ehrliche-zustaende.test.ts` | PASS (7/7) |
| `npm test` | PASS **3456/3456** |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (0 errors / 139 pre-existing warnings) |
| `npm run check:dead` | PASS (1 justified orphan: CookieConsent) |
| `npm run check:exports` | PASS |
| `npm run check:deps` | PASS |
| `npm run check:api-schutz` | PASS (12 admin routes) |
| `npm run check:schema-bezug` | PASS |
| `npm run build` | PASS Next.js **16.3.3** Turbopack; `/admin` remains dynamic |

Browser admin-home verification was **not** performed. `/admin` is auth-gated; this environment has no admin session. Evidence is contract + compile, not a logged-in Preview click.

## 6. Exact-head CI / Preview on `31f7cd7f`

Recorded before this persist. This persist is a newer HEAD and invalidates these bindings.

| | |
| --- | --- |
| GitHub Actions | `35328315172` **SUCCESS** — Auth-Konfiguration `105546513907`; Typecheck, Lint & Build `105546514394` |
| Vercel | `7MAocfhZzXaLTFPs8j859tcJRkix` **READY** |
| Preview | https://jetnity-app-git-fix-v1-admin-revenue-truth-1-jetnity-e1b93c82.vercel.app |
| Combined commit status | `success` (`Vercel` Deployment has completed) |

## 7. Drift / thread report (re-fetched `origin/main`)

| | |
| --- | --- |
| Live `origin/main` | `c3cde9ad1e2daa2ed0a3912ed6a55de803476385` |
| Merge-base | `c3cde9ad1e2daa2ed0a3912ed6a55de803476385` |
| Ahead / behind | **2 / 0** before this persist (task + implementation). Persist adds one more ahead commit. |
| Drift vs canonical base | **none** |
| PR #472 | Draft, open, not merged, `mergeable_state=blocked` |
| Reviews | none |
| Review comments | none |
| Issue comments | dispatch `5727824864`; Vercel bot `5727824898` (updated to READY on `31f7cd7f`); Cursor ack `5727825990` |
| Parallel slices | not merged/rebased into this branch |

## 8. Residual risks

- Admin payments page still reads legacy `payments` / `refunds` tables. Out of scope; it already carries the honest local-ledger caveat.
- `admin_payments_summary_30d` remains in the schema and security proofs. The overview no longer calls it.
- Finding 6.1 / 6.2 / 6.4 remain open (no booking handover, no conversion persistence, no funnel).
- No logged-in Preview click of `/admin` in this run.

## 9. Next step

Re-gate the **live HEAD** after this persist. Then **STOP FOR TECHNICAL-LEAD REVIEW**. Do not Ready. Do not merge. Do not start a follow-up slice.
