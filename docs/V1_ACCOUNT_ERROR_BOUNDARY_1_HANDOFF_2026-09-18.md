# Jetnity – V1 Account Error Boundary 1 HANDOFF

Stand: 18. September 2026  
Status: **STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**

Binding task: `docs/V1_ACCOUNT_ERROR_BOUNDARY_1_TASK_2026-09-18.md`  
Detailed status: `docs/V1_ACCOUNT_ERROR_BOUNDARY_1_STATUS_2026-09-18.md`  
Self-review: `docs/V1_ACCOUNT_ERROR_BOUNDARY_1_SELF_REVIEW_2026-09-18.md`

This document is enough for a new agent or Technical Lead to continue without the chat.

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #468 |
| Draft PR | #471 |
| Branch | `fix/v1-account-error-boundary-1` |
| Canonical base | `main@c3cde9ad1e2daa2ed0a3912ed6a55de803476385` |
| Dispatch head | `31ab851557447a8a2d913d5278cddc041015a3f5` |
| Product head | `6ba6e223e872f214a2d47ad408006e4fe8c5e9ac` |
| Source audit | #438 / merged PR #449 / finding 4.2 |
| Agent | Jetnity V1 account error boundary 1, Generation 1 |
| Parent model | Cursor Grok 4.6 High Fast (confirmed) |
| Session | `bc-6f1cdb50-266c-4bc3-aa98-b458e209caf7` |

Read first:

1. `docs/V1_ACCOUNT_ERROR_BOUNDARY_1_TASK_2026-09-18.md`
2. finding 4.2 in `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_GAP_MATRIX_2026-09-17.md`
3. this handoff and the STATUS / SELF_REVIEW for the same slice
4. live PR #471, live `origin/main`, live CI and Vercel Preview

Do not treat this file as current exact-head truth after a later commit.

## 2. What changed

`/account/*` now has a Next.js client error boundary.

- Retry uses the framework `reset()` callback.
- Safe exit is `/reisen`, outside the failed account subtree.
- Visible `Fehler-ID` uses the existing `oeffentlicheFehlerId()` helper (digest first, `useId()` fallback).
- Production does not render stack or raw error detail.
- Copy does not claim saved data is unaffected and does not claim the ID is operator-correlated.

The focused contract test fails if the file disappears or those truth/safety invariants regress.

## 3. What a reviewer should verify first

1. `app/account/error.tsx` exists, is `'use client'`, and uses `oeffentlicheFehlerId` + `React.useId()`.
2. Reset and a non-`/account` navigation path (`/reisen`) are present.
3. No “saved data unaffected” or operator-tracking claim in user-facing copy.
4. Production path does not render `error.message` / `error.stack`.
5. Focused contract + full repository gates on `6ba6e223`: local PASS; CI [35328449461](https://github.com/Jetnity/jetnity/actions/runs/35328449461) SUCCESS; Vercel READY `8dSPcJsaFfAWPThtdpHjJEgLfYxq`.
6. `origin/main` re-fetch: `c3cde9ad`, merge-base identical, ahead of canonical base only, behind 0, no extra-slice drift.
7. This evidence persist is a new head. Re-gate it before treating it as the current exact-head.

## 4. What this slice does not mean

Adding the boundary does **not** close finding 4.1 (support process), 4.3 (operator-usable identifier loop) or 5.5 (error tracking / alerting). A quoted Fehler-ID remains unresolvable on the operator side.

Vercel Preview is SSO-protected, so a live crash-UI review was not performed there. Local `/account` still auth-gates to login; `/reisen` still loads.

## 5. Next step

**STOP FOR TECHNICAL-LEAD REVIEW.** No Ready. No merge. No follow-up slice.
