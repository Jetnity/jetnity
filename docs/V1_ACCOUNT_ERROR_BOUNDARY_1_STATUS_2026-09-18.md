# Jetnity – V1 Account Error Boundary 1 STATUS

Stand: 18. September 2026  
Status: **IMPLEMENTATION COMPLETE / PRODUCT HEAD GATED / THIS EVIDENCE COMMIT INVALIDATES THAT EXACT-HEAD / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #468  
Draft PR: #471  
Branch: `fix/v1-account-error-boundary-1`  
Binding task: `docs/V1_ACCOUNT_ERROR_BOUNDARY_1_TASK_2026-09-18.md`  
Source audit: #438 / merged PR #449 / finding 4.2  
Canonical base: `main@c3cde9ad1e2daa2ed0a3912ed6a55de803476385`  
Dispatch head: `31ab851557447a8a2d913d5278cddc041015a3f5`  
Product / last implementation head: `6ba6e223e872f214a2d47ad408006e4fe8c5e9ac`

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

Changed files versus `origin/main` remain exactly the six allowed files: the new boundary, the focused test, and this slice's TASK / STATUS / HANDOFF / SELF_REVIEW.

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

Local gates and exact-head GitHub CI / Vercel Preview were taken on product head `6ba6e223`. This evidence persist is a later SHA and invalidates those exact-head gates.

### 5.1 Local on `6ba6e223`

| Gate | Result |
| --- | --- |
| Focused `lib/next/account-error-boundary-contract.test.ts` | PASS – 4/4 |
| `npm test` | PASS – **3458** tests, 0 fail |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS – 0 errors, 139 pre-existing warnings |
| `npm run build` | PASS – Next.js 16.3.3; `/account*` routes present |
| `check:dead` | PASS – 1 justified orphan (`CookieConsent.tsx`) |
| `check:exports` | PASS – 0 unused exports |
| `check:deps` | PASS |
| `check:api-schutz` | PASS – 12 admin routes |
| `check:schema-bezug` | PASS |

No DB/Auth/Production verification was required or claimed.

### 5.2 Exact-head remote on `6ba6e223`

| Gate | Result |
| --- | --- |
| GitHub CI | [35328449461](https://github.com/Jetnity/jetnity/actions/runs/35328449461) SUCCESS — `Typecheck, Lint & Build` + `Auth-Konfiguration gegen config.toml` |
| Vercel Preview | READY `8dSPcJsaFfAWPThtdpHjJEgLfYxq` — [Preview](https://jetnity-app-git-fix-v1-account-error-bo-047a3f-jetnity-e1b93c82.vercel.app) |
| Preview browse | **SSO-protected**. Browser cannot reach the Jetnity app without Vercel login. Not claimed as a live crash-UI review. |

### 5.3 Local surrounding-surface check

On `http://localhost:3000` (existing Next dev server):

- `/account` → `307` → `/login?next=%2Faccount` on desktop and 390px mobile. No default crash screen.
- `/reisen` → `200`, usable empty trips surface (the boundary's safe exit).
- No injected throw was added. The crash UI itself is locked by the contract test, not by a live account render failure.

## 6. `origin/main` drift (re-fetched)

| | |
| --- | --- |
| `origin/main` | `c3cde9ad1e2daa2ed0a3912ed6a55de803476385` |
| Merge-base | `c3cde9ad1e2daa2ed0a3912ed6a55de803476385` |
| Ahead / behind | **4 / 0** at product head `6ba6e223`; this evidence persist adds one docs commit |
| Drift vs canonical base | **none** — still exactly the assigned `main@c3cde9ad` |

## 7. GitHub / Vercel thread state

PR #471 remains **Draft**, `mergeable_state=clean` at product head, **not Ready**, **not merged**.

- Dispatch comment `5727822980` from @Jetnity
- Vercel bot comment `5727823320` — latest Preview READY for `6ba6e223`
- Cursor bot ack `5727824235`
- Review threads: **none**
- Reviews: **none**
- Vercel live feedback: 0 resolved / 0 unresolved

## 8. Next step

Independent Technical-Lead exact-head review of PR #471. Do not Ready. Do not merge. Do not start a follow-up slice.
