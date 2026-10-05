# Jetnity – V1 Admin Revenue Truth 1 HANDOFF

Stand: 18. September 2026  
Status: **IMPLEMENTED ON `31f7cd7f` WITH GATES RECORDED / RE-GATE THIS PERSIST HEAD / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**

Binding task: `docs/V1_ADMIN_REVENUE_TRUTH_1_TASK_2026-09-18.md`  
Detailed status: `docs/V1_ADMIN_REVENUE_TRUTH_1_STATUS_2026-09-18.md`  
Self-review: `docs/V1_ADMIN_REVENUE_TRUTH_1_SELF_REVIEW_2026-09-18.md`

This document is enough for a new agent or Technical Lead to continue without the chat.

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #469 |
| Draft PR | #472 |
| Branch | `fix/v1-admin-revenue-truth-1` |
| Canonical base | `main@c3cde9ad1e2daa2ed0a3912ed6a55de803476385` |
| Dispatch head | `f965016ef1f2e9958fd30b714e014d5c5d862783` |
| Implementation head | `31f7cd7f59f06f79c98ce6600b0278c712ca022b` |
| Agent | Jetnity V1 admin revenue truth 1, Generation 1 |
| Parent model | Cursor Grok 4.6 High Fast (confirmed `originalModelName=cursor-grok-4.6-high-fast`) |
| Session | `bc-3db4fd70-ae6c-4512-869b-50ed4f0b42b2` |

Read first:

1. the task and finding 6.3
2. `components/admin/home/AdminStatsStrip.tsx` and `ADMIN_EHRLICHE_TEXTE.umsatzConversionHinweis`
3. this handoff and STATUS / SELF_REVIEW
4. live PR #472, live `origin/main`, live CI and Vercel on the **current HEAD**

## 2. What changed

The admin home overview no longer treats legacy payment residue as revenue or conversion.

- Removed payment-derived tiles and `Bestellungen je Reise`.
- Kept `Reisen (30T)` and `Konten mit Reise (30T)` from `admin_reisen_kennzahlen()`.
- Stated that revenue/conversion are unavailable until a provider-backed commercial path exists.
- Unknown/denied remains `–`, not zero.
- No schema, payment-API, provider, or payments-page change.

## 3. What a reviewer should verify first

1. Runtime source no longer calls `admin_payments_summary_30d` and has no Gesamtumsatz / Bestellungen / Refunds / Payouts tiles or conversion ratio.
2. Copy does not fabricate CHF 0 as revenue.
3. Trip/account tiles still refuse to coerce a missing capability row into `0`.
4. Allowed-file boundary held; no global continuity edits; no cross-slice files.
5. `31f7cd7f` CI `35328315172` SUCCESS and Vercel `7MAocfhZzXaLTFPs8j859tcJRkix` READY are recorded only for that SHA.
6. Re-fetch exact-head CI / Preview / threads on the **live HEAD** after this persist.

## 4. What this slice does not mean

Finding 6.3 is closed only for the **admin overview strip**. The payments page, unused summary RPC, and later monetisation work remain. No provider was activated.

## 5. Next step

Re-gate the live HEAD, then **STOP FOR TECHNICAL-LEAD REVIEW**. Do not Ready. Do not merge.
