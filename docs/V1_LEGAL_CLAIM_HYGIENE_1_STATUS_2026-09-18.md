# Jetnity – V1 Legal Claim Hygiene 1 STATUS

Stand: 18. September 2026  
Status: **IMPLEMENTATION COMMITTED / LOCAL AND EXACT-HEAD GATES PENDING / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #456  
Draft PR: #457  
Branch: `fix/v1-legal-claim-hygiene-1`  
Binding task: `docs/V1_LEGAL_CLAIM_HYGIENE_1_TASK_2026-09-18.md`  
Source audit: #438 / merged PR #449 / finding 1.4  
Canonical base: `main@004dae4d672b9b386fd24ded0babe7ff8d5d5fad`  
Dispatch head: `fabaa54f1705ce68058c26a9fca9ef743c8a188f`

Cursor-Agent: **Jetnity V1 legal claim hygiene 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast** — confirmed on this run (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-26131993-3a68-46a6-8e54-2752c0dbcce0`

This file is point-in-time evidence. Every new head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS.

---

## 1. Goal

Remove the standalone unsupported user-facing assertion

`Datenschutz: DSGVO & CH-DSG konform.`

from Login and Register. Do not invent replacement legal/compliance wording. Do not change consent, Auth, Session, MFA, AAL, OAuth or recovery semantics.

This slice removes an unproven claim. It does **not** decide or assert legal compliance.

## 2. Implemented

1. `components/auth/RegisterForm.tsx` — removed the standalone footer paragraph that contained the prohibited assertion. The required terms/privacy checkbox, labels, `/terms` and `/privacy` links, validation error, focus-to-terms path and `disabled={loading || !accept}` submit gate are unchanged.
2. `components/auth/LoginForm.tsx` — removed the standalone footer paragraph that contained the same prohibited assertion. No terms acceptance, consent or legal semantics were added to login.
3. `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` — inverted the existing AP-6a inventory lock from “claim is present” to “claim is absent”, including the exact prohibited strings `DSGVO & CH-DSG konform` and `DSGVO &amp; CH-DSG konform`. Login still has no `/privacy` or `/terms` links. The existing RegisterForm checkbox/link/gating test is unchanged.

No replacement legal or regulatory wording was added.

## 3. Traveller-context check

Not relevant. This slice only removes auth-surface copy. It does not collect, infer or present citizenship, document, residence or route facts.

## 4. Hard exclusions held

Not touched:

- Production `/privacy`, `/terms`, imprint or other legal content
- consent persistence / server-side terms acceptance
- Auth / Session / MFA / AAL / OAuth / password-reset / recovery semantics
- Supabase schema, migrations, RLS, grants, policies or Production data
- provider activation/configuration
- secrets
- paid calls or recurring cost
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
