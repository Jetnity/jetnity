# Jetnity – V1 Account Error Boundary 1 STATUS

Stand: 18. September 2026  
Status: **IMPLEMENTATION COMMITTED / LOCAL AND EXACT-HEAD GATES PENDING / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #468  
Draft PR: #471  
Branch: `fix/v1-account-error-boundary-1`  
Binding task: `docs/V1_ACCOUNT_ERROR_BOUNDARY_1_TASK_2026-09-18.md`  
Source audit: #438 / merged PR #449 / finding 4.2  
Canonical base: `main@c3cde9ad1e2daa2ed0a3912ed6a55de803476385`  
Dispatch head: `31ab851557447a8a2d913d5278cddc041015a3f5`

Cursor-Agent: **Jetnity V1 account error boundary 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast** — confirmed on this run (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-6f1cdb50-266c-4bc3-aa98-b458e209caf7`

This file is point-in-time evidence. Every new head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS.

---

## 1. Goal

Add a truthful Next.js error boundary for `/account/*` without changing Auth/session/account semantics.

This slice adds a recoverable account-area surface. It does **not** add operator-side error tracking, a support process, or a claim that saved data is unaffected.

## 2. Implemented

1. `app/account/error.tsx` — client error boundary for the `/account/*` segment. Offers `reset()`, a safe exit to `/reisen` (outside the failed account subtree), and a user-visible `Fehler-ID` via `oeffentlicheFehlerId(error?.digest, React.useId())`. Production shows no raw `error.message` / stack. Development-only diagnostics follow the public-boundary convention.
2. `lib/next/account-error-boundary-contract.test.ts` — smallest focused contract test for existence, reset/exit, digest-first ID, no constant/impure fallback, no “data unaffected” claim, no operator-correlation claim, and no production raw-error leak.

Copy does not say saved trips/data are unaffected and does not present the Fehler-ID as operator-trackable.

## 3. Traveller-context check

Not relevant. This slice only adds a generic recovery surface for a failed account render. It does not collect, infer or present citizenship, document, residence or route facts.

## 4. Hard exclusions held

Not touched:

- `app/(public)/error.tsx` / `app/(admin)/admin/error.tsx`
- Auth / Session / MFA / AAL / OAuth / account settings or content
- Supabase schema, migrations, RLS, grants, policies or Production data
- support-process docs (parallel #467)
- AdminStatsStrip / admin truth-copy (parallel #469)
- providers, secrets, paid calls or recurring cost
- global continuity documents (`docs/ACTIVE_WORK_STATUS.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `JETNITY_HANDOFF.md`, `docs/CONTINUITY_STANDARD.md`)
- Ready / merge / follow-up slice

An environment-generated `next-env.d.ts` working-tree diff was discarded and is not part of this branch.

## 5. Gates

Local and exact-head GitHub CI / Vercel Preview are **pending** on this implementation commit. Results will be written after they exist. No gate is claimed green here.

No Supabase verification is required or claimed: this slice does not touch DB/Auth configuration or Production.

## 6. Next step

1. Run the required local gates on this implementation head.
2. Persist exact-head CI / Preview / `origin/main` drift evidence.
3. Stop for independent Technical-Lead review.
4. Do not Ready. Do not merge.
