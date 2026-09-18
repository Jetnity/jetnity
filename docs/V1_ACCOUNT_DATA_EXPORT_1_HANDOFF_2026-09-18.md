# Jetnity – V1 Account Data Export 1 HANDOFF

Stand: 18. September 2026  
Status: **P2 ALLOWLIST CORRECTION / BEHIND 0 / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE**

Binding task: `docs/V1_ACCOUNT_DATA_EXPORT_1_TASK_2026-09-18.md`  
Detailed status: `docs/V1_ACCOUNT_DATA_EXPORT_1_STATUS_2026-09-18.md`  
Self-review: `docs/V1_ACCOUNT_DATA_EXPORT_1_SELF_REVIEW_2026-09-18.md`

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #474 |
| Draft PR | #476 |
| Branch | `feat/v1-account-data-export-1` |
| Implementation head | `53dfd358b55100f259a52e793463783747d98b7c` |
| Reconciled main | `ac3539d9ceff4e96308a48c51d2d317927245b54` |
| Merge-base | `ac3539d9` |
| Ahead / behind | **8 / 0** at `53dfd358` |
| TL CHANGES REQUIRED | comment `5729541740` |
| Exact-head CI | `35341788949` **SUCCESS** |
| Exact-head Vercel | `2q4F6yHEDNRLa545SVh2ofeg2UmU` **READY** |
| Agent | Jetnity V1 account data export 1, Generation 1 |
| Session | `bc-382bcfd9-32cd-4eb0-bcc4-c0fc49ae2c09` |

## 2. What a reviewer should verify first

1. Merge-base equals current `origin/main` `ac3539d9`. Behind is **0**.
2. Diff vs main is only the nine #476 files.
3. `lib/account/datenexport.ts` has **no** `.select('*')`. `KONTO_DATENEXPORT_SPALTEN` is the only column source.
4. Allowlists match current generated Row keys for the same 13 tables. `schemaVersion` is still `jetnity.account-export.v1`.
5. Route/auth/RLS/`user_id`/fail-closed/no-store/no service-role semantics are unchanged.
6. Tests fail on wildcard select, missing allowlist, write/RPC, or silent table-scope change.
7. GitHub review threads: none. Vercel unresolved threads: none.

## 3. Next step

**STOP FOR TECHNICAL-LEAD REVIEW.** Re-gate this persist head if FINAL PASS requires exact-head on the docs commit. No Ready. No merge. No Guardian dispatch. No follow-up slice.
