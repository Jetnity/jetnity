# Jetnity – V1 Admin Revenue Truth 1 SELF-REVIEW

Stand: 18. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #469  
Draft PR: #472  
Branch: `fix/v1-admin-revenue-truth-1`  
Binding task: `docs/V1_ADMIN_REVENUE_TRUTH_1_TASK_2026-09-18.md`

This document argues against the implementation. It cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the slice

| Attack | Result |
| --- | --- |
| Keep the tiles and only extend the caveat | Rejected. Task preferred suppression; a caveat next to a CHF figure still presents revenue. |
| Render CHF 0 / 0 orders as “honest empty revenue” | Rejected. No provider populates those tables; zero would still be a revenue claim. |
| Reinterpret leftover `payments` rows as real GMV | Rejected. Residue is not a commercial path. |
| Keep `Bestellungen je Reise` when orders are zero | Rejected. The ratio is conversion truth, not an operational trip count. |
| Leave `admin_payments_summary_30d` in the strip “just in case” | Rejected. The overview must not depend on payment aggregates. |
| Coerce a missing `admin_reisen_kennzahlen` row to `0` | Rejected. Existing ADR-0040/0041 rule kept: no row = unknown (`–`). |
| Change the payments page / refund write / RPC / schema while here | Rejected. Hard exclusion. |
| Touch Support Process, `app/account/error.tsx`, or global continuity | Rejected. Parallel isolation. |
| Merge/rebase another active slice | Rejected. |
| Claim a logged-in Preview proof of `/admin` | Rejected. No admin session in this environment. |
| Mark Ready or merge | Rejected. |

## 2. Residual risks this slice does not close

- Payments page still surfaces local ledger numbers with its own caveat. That is out of scope and still not provider-backed money movement.
- `admin_payments_summary_30d` still exists and still hardcodes `payouts_cents = 0`. Unused by the overview after this slice; leftover schema truth, not overview truth.
- Findings 6.1, 6.2 and 6.4 remain: no booking handover, no conversion persistence, no funnel.
- Contract test is source/copy-level, not a rendered RSC test. A later JSX rewrite that reintroduces tiles would be caught; a new sibling component would not.
- No Real-Device or logged-in Preview click.

## 3. Compliance with the binding task

| Requirement | Met? | Note |
| --- | --- | --- |
| Suppress payment-derived tiles | Yes | Umsatz / Bestellungen / Refunds / Payouts removed |
| Suppress conversion ratio | Yes | `Bestellungen je Reise` removed |
| Keep grounded trip/account aggregates | Yes | `Reisen (30T)`, `Konten mit Reise (30T)` |
| Honest unavailable copy | Yes | `umsatzConversionHinweis` |
| No fabricated zero / residue-as-revenue | Yes | |
| Denied/unknown stays unknown | Yes | `–` when no row / error |
| Allowed write scope | Yes | strip + one copy constant + one test + slice docs |
| No payment/provider/schema/payments-page change | Yes | |
| No Ready / merge / follow-up | Yes | |

## 4. What remains before Technical-Lead review

`31f7cd7f` had CI `35328315172` SUCCESS and Vercel `7MAocfhZzXaLTFPs8j859tcJRkix` READY. This evidence persist is a newer HEAD and invalidates those exact-head gates. Re-fetch CI/Vercel/threads on the live HEAD. Agent self-review is still not PASS.
