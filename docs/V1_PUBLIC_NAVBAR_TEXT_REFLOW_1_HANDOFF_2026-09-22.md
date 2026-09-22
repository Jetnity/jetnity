# V1 Public Navbar Text Reflow 1 — Handoff

Stand: 22. September 2026  
Status: **STOP AFTER AUTHORIZED MAIN INTEGRATION — INDEPENDENT TECHNICAL-LEAD RE-REVIEW**

Same session `bc-27f8ce53-e09e-43d6-9778-7a131c6cdec4`. Exact main `c0e32dc` was merged once. Navbar runtime blob unchanged. Hero files came only from main. Representative navbar+hero coexistence was recaptured. Exact freeze SHA / CI / Preview are in the PR STOP receipt.

## For the next reader

Read in this order:

1. `docs/V1_PUBLIC_NAVBAR_TEXT_REFLOW_1_TASK_2026-09-22.md`
2. `docs/V1_PUBLIC_NAVBAR_TEXT_REFLOW_1_DECISION_2026-09-22.md`
3. `docs/V1_PUBLIC_NAVBAR_TEXT_REFLOW_1_STATUS_2026-09-22.md`
4. `docs/V1_PUBLIC_NAVBAR_TEXT_REFLOW_1_SELF_REVIEW_2026-09-22.md`
5. Live Draft PR #536 head, comments, CI, Auth, Vercel — not remembered IDs
6. #534 is TL-merged into exact main `c0e32dc`; do not re-open or edit that closed slice

This writer is **Jetnity V1 public navbar text reflow 1**, Generation 1, session `bc-27f8ce53-e09e-43d6-9778-7a131c6cdec4`, model Cursor Grok 4.6 High Fast / no Auto. Immediate review fixes reuse this session.

## What was delivered

- Reproduced the #534 residual on this baseline: 1024/200% `Reise planen` right 1171.88 (overflow 147.88); 1440/200% controls taller than the fixed 72px row.
- Wrapped/min-height PublicNavbar presentation only. Menu height follows the remaining viewport.
- After 1024/1440 @ 32px: every visible navbar control fits; unknown/guest/account variants proved; menu/focus/short-viewport/touch proved; mutations aborted; logout not clicked.
- Own evidence under `docs/evidence/v1-public-navbar-text-reflow-1/`.

## What the Technical Lead should decide

1. Independent exact-head code / visual / interaction review of the **new post-integration freeze head**.
2. Confirm navbar runtime still equals frozen `05037863` blob `6779bcea`, and homepage hero files equal main `c0e32dc` only.
3. Ready/Merge only after that review. Cursor will not.

## What the next Cursor writer must not do unless a new versioned task says so

- Edit homepage hero, GastCreateLink, auth helpers, global CSS, or shared contracts
- Merge/rebase a later main or any sibling; the authorized one-time `c0e32dc` merge is already done
- Mark Ready, merge, or start a follow-up slice
