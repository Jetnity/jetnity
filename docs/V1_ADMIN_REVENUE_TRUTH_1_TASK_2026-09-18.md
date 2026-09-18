# Jetnity – V1 Admin Revenue Truth 1 Task

Stand: 18. September 2026  
Status: **ACTIVE / PARALLEL BOUNDED REMEDIATION / ADMIN TRUTH SLICE**

Issue: #469  
Source audit: #438 / merged PR #449 / finding 6.3  
Canonical base: `main@c3cde9ad1e2daa2ed0a3912ed6a55de803476385`

Branch: `fix/v1-admin-revenue-truth-1`

Cursor-Agent: **Jetnity V1 admin revenue truth 1**  
Generation: **1**  
Required parent model: **Cursor Grok 4.6 High Fast**

Do not use Auto. If unavailable, STOP/report.

## Goal

Make the admin home overview truthful while Jetnity has no real payment/booking provider populating revenue.

Preferred V1-safe result:
- suppress/remove payment-derived monetary/order/refund/payout tiles from the admin overview;
- suppress/remove `Bestellungen je Reise` as a conversion ratio;
- keep only grounded trip/account aggregates;
- state clearly that revenue/conversion are not available until a provider-backed commercial path exists;
- do not fabricate zero or reinterpret legacy residue as real revenue.

## Allowed write scope

- `components/admin/home/AdminStatsStrip.tsx`
- optionally `lib/admin/ehrliche-zustaende.ts` only if needed for one shared truthful copy constant
- one focused regression/contract test
- `docs/V1_ADMIN_REVENUE_TRUTH_1_TASK_2026-09-18.md`
- `docs/V1_ADMIN_REVENUE_TRUTH_1_STATUS_2026-09-18.md`
- `docs/V1_ADMIN_REVENUE_TRUTH_1_HANDOFF_2026-09-18.md`
- `docs/V1_ADMIN_REVENUE_TRUTH_1_SELF_REVIEW_2026-09-18.md`

## Required invariants

- no payment/provider dependency;
- no schema/RPC/database change;
- no legacy table mutation;
- denied/unknown remains unknown, not zero;
- admin payments page out of scope.

## Parallel isolation

Runs concurrently with #467 and #468. Do not touch support-process docs, `app/account/error.tsx`, or global continuity docs. No cross-branch merges during implementation.

## Hard exclusions

No payment API/refund write changes, provider/affiliate activation, Supabase/schema/RLS/migrations, secrets/costs.

## Validation

Focused test, full tests, typecheck, lint, Production build, repo hygiene, exact-head CI + Vercel Preview, drift/thread report.

No Ready. No merge. No follow-up slice.

Final state: **STOP FOR TECHNICAL-LEAD REVIEW**.
