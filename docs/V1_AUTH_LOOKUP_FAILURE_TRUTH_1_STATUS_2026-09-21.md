# Jetnity – V1 Auth Lookup Failure Truth 1 STATUS

Stand: 21. September 2026  
Status: **IMPLEMENTED / LOCAL GATES PENDING AT WRITE TIME / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #499  
Draft PR: #500  
Branch: `fix/v1-auth-lookup-failure-truth-1`  
Binding task: `docs/V1_AUTH_LOOKUP_FAILURE_TRUTH_1_TASK_2026-09-21.md`  
Canonical base: `main@d1949e23b3dda30b7482265822e7e1279f244228`  
Dispatch head: `c155e79d127debac8b8a327ab48ef6bcfebf7b39`

Cursor-Agent: **Jetnity V1 auth lookup failure truth 1**, Generation 1  
Required model: **Cursor Grok 4.6 High Fast** — confirmed (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-4a7937bd-b57c-4bca-9a0a-9d33dc2e86c5`

This file is point-in-time evidence. Exact-head CI / Auth / Vercel IDs belong in the final PR comment, not in a later evidence-only commit. Agent self-review is not Technical-Lead PASS.

---

## 1. Objective closed in this slice

Regression Hunter finding RH-1.1: protected HTML `/account` and `/admin` (except `/admin/login`) mapped Auth lookup failure and missing Auth configuration to the same login redirect as a genuinely unauthenticated user.

APIs already returned 503 `unconfigured` / `lookup-failed`. HTML now uses the same fail-closed unavailable truth.

## 2. Behaviour

| Identity truth | HTML `/account`, `/admin` | API `/api/admin` |
| --- | --- | --- |
| No user / missing or 401 session | login redirect | 401 `unauthenticated` |
| Missing Supabase ENV | 503 HTML retry surface (`unconfigured`) | 503 `unconfigured` |
| `getUser()` throw or non-session error | 503 HTML retry surface (`lookup-failed`) | 503 `lookup-failed` |
| Verified user | pass through | pass through |

Protection remains deny-on-failure. AAL2 / role logic stays out of `proxy.ts`.

The HTML surface says the check is unavailable, not that the user is logged out. Retry uses the current path. Open-redirect-shaped retry values fall back to `/`.

## 3. Scope held

Allowed files only:

- `proxy.ts`
- `lib/auth/proxy-security-contract.test.ts`
- `lib/auth/proxy-auth-lookup-failure.test.ts`
- slice-local docs and this branch's `docs/ACTIVE_WORK_STATUS.md`

Not touched:

- PR #494 local DB harness / `package.json` / `scripts/db`
- PR #497 reconciliation docs
- sibling P2-fix ownership
- Supabase migrations, RLS, Auth config, Production
- MFA / AAL semantics
- account/trip runtime pages
- provider / secret / paid action

Traveller context is not relevant. No citizenship, document or credential collection was added.

## 4. Gates

Local and exact-head IDs are reported in the PR #500 comment after freeze. This document does not claim CI, Auth-job or Vercel results that were not yet verified at write time.

## 5. Next step

**STOP FOR TECHNICAL-LEAD REVIEW.** No Ready. No merge. No follow-up slice.
