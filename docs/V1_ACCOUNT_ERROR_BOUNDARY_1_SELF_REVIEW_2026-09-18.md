# Jetnity – V1 Account Error Boundary 1 SELF-REVIEW

Stand: 18. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #468  
Draft PR: #471  
Branch: `fix/v1-account-error-boundary-1`  
Binding task: `docs/V1_ACCOUNT_ERROR_BOUNDARY_1_TASK_2026-09-18.md`  
Product head reviewed here: `6ba6e223e872f214a2d47ad408006e4fe8c5e9ac`

This document argues against the implementation. It cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the boundary

| Attack | Result |
| --- | --- |
| Copy the public sentence `Deine gespeicherten Reisen sind davon nicht betroffen.` | Rejected. Account crashes can include data-read failures. The copy only describes a load failure and recovery actions. |
| Tell the user to quote the Fehler-ID to support / claim operator correlation | Rejected. Finding 4.3 / 5.5 remain open. The ID is shown, not promised as a ticket. |
| Add mailto / support-process copy | Rejected. Reserved to parallel slice #467. |
| Change public or admin error boundaries | Rejected. Out of scope. |
| Add `app/error.tsx` or `global-error.tsx` as a backstop | Rejected. Task asks only for `app/account/error.tsx`. |
| Link only to another `/account/*` page as the recovery path | Rejected. Exit is `/reisen`, outside the failed subtree. |
| Use `#unbekannt`, `Date.now()` or `Math.random()` for the ID | Rejected. Digest-first `oeffentlicheFehlerId` + `useId()`. |
| Show `error.message` / `error.stack` in Production | Rejected. Message is development-only; stack is never rendered. |
| Change Auth / session / MFA / AAL / account settings | Rejected. New file only wraps the existing account segment. Local `/account` still 307s to `/login?next=%2Faccount`. |
| Touch Supabase / migrations / RLS / Production | Rejected. |
| Edit global continuity docs or parallel-slice files | Rejected. Only this slice's allowed write set. |
| Claim a live Preview crash-UI review | Rejected. Preview is Vercel-SSO-protected. Crash UI is locked by the contract test. |
| Mark Ready or merge | Rejected. |

## 2. Residual risks this slice does not close

- A quoted Fehler-ID still cannot be resolved on the operator side. That is finding **4.3** / tooling half of **5.5**.
- There is still no support process or owned mailbox path. That is finding **4.1**.
- There is still no root `app/error.tsx` or `global-error.tsx`. Layout-level or root failures remain outside this segment boundary.
- `console.error('[AccountRouteError]', error)` still reaches only the user's browser console.
- The account layout (navbar / account nav / footer) remains mounted around the boundary. That is Next.js segment semantics, not a second recovery product.
- This evidence persist invalidates the exact-head CI / Preview taken on `6ba6e223`. Re-gate the new head.

## 3. Compliance with the binding task

| Requirement | Met? | Note |
| --- | --- | --- |
| `app/account/error.tsx` client boundary | Yes | `'use client'` |
| Retry/reset | Yes | `reset()` |
| Safe path out of `/account/*` | Yes | `/reisen` |
| `oeffentlicheFehlerId()` | Yes | digest + `useId()` |
| No Production stack/raw detail | Yes | `NODE_ENV !== 'production'` for message only |
| No “data unaffected” claim | Yes | |
| No operator-correlation claim | Yes | |
| Accessibility / mobile | Yes | `<main>`, `<h1>`, `min-h-11`, focus-visible ring |
| Smallest focused contract test | Yes | `lib/next/account-error-boundary-contract.test.ts` (4/4) |
| Full current repository gates | Yes | local PASS on `6ba6e223` |
| Exact-head CI + Preview | Yes on `6ba6e223`; this persist invalidates that head |
| Persist STATUS / HANDOFF / SELF_REVIEW | Yes | This set |
| No Auth/DB/provider/cost/Ready/merge/follow-up | Yes | |

## 4. Recommendation to the Technical Lead

Scope-faithful small runtime slice. Product files last changed at `6ba6e223`. Independent exact-head review should start from the current PR head after this evidence persist and after that head's own CI / Preview, not from the superseded `6ba6e223` gates.
