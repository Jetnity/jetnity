# Jetnity – V1 Admin MFA Loss Recovery Runbook 1 STATUS

Stand: 18. September 2026  
Status: **IMPLEMENTATION COMMITTED / LOCAL AND EXACT-HEAD GATES PENDING / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #459  
Draft PR: #460  
Branch: `docs/v1-admin-mfa-loss-recovery-runbook-1`  
Binding task: `docs/V1_ADMIN_MFA_LOSS_RECOVERY_RUNBOOK_1_TASK_2026-09-18.md`  
Canonical runbook: `docs/V1_ADMIN_MFA_LOSS_RECOVERY_RUNBOOK_2026-09-18.md`  
Source audit: #438 / merged PR #449 / finding 3.4 operational half  
Canonical base: `main@88382ce0ef1d01b1cb32677fa48dfde71b5055d1`  
Dispatch head: `7e688f25d4dc2f681425d36fede46499d39300bc`

Cursor-Agent: **Jetnity V1 admin MFA loss recovery runbook 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast** — confirmed on this run (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-9b3f4865-ee30-47b2-8f10-91e649c91709`

This file is point-in-time evidence. Every new head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS.

---

## 1. Goal

Close only the operational half of audit finding 3.4: persist a security-first runbook for recovering a Jetnity **application admin** after loss of the verified TOTP factor, using only a currently supported Supabase Auth Admin MFA operation, without weakening AAL2 and without executing any Auth mutation.

This slice does **not** implement a new MFA mechanism.

## 2. Implemented

Canonical runbook `docs/V1_ADMIN_MFA_LOSS_RECOVERY_RUNBOOK_2026-09-18.md` covers:

- trigger / non-use / lost-factor vs compromise;
- Jetnity application-user MFA vs Supabase platform-account MFA;
- authority, environment, user and factor verification before any documented delete;
- installed + official `auth.admin.mfa.listFactors({ userId })` and `auth.admin.mfa.deleteFactor({ id, userId })`;
- expected session invalidation after verified-factor deletion;
- re-enrollment at `/account/security`, AAL2 verification and role-backed admin data-plane verification;
- evidence rules that forbid secrets;
- compromise handoff to future finding 5.5 without inventing that process;
- fail-closed STOP conditions and forbidden shortcuts.

Repository truth re-verified on this branch before writing method signatures:

- Admin AAL2: `lib/auth/admin-aal.ts`, `lib/auth/admin-guard.ts`, ADR-0169, alignment migration `20260827170000`.
- Enrollment / step-up: `/account/security`, `AdminMfaStepUp`, `account-mfa-step-up.ts`.
- Break-glass: `lib/auth/admin-access.ts` `reachesDatabase()`, `NotzugangHinweis`.
- Installed client: `@supabase/supabase-js` 2.57.2 / `@supabase/auth-js` 2.71.1.
- Official docs fetched 18 September 2026: `auth-admin-deletefactor`, `auth-admin-listfactors`, `guides/auth/auth-mfa`.

No runtime, Auth, RLS, role, account-status, config or secret change.

## 3. Traveller-context check

Not relevant. Docs-only operational procedure. No traveller credentials collected or inferred.

## 4. Hard exclusions held

Not touched:

- any live MFA factor;
- Production or Development Supabase Auth;
- Auth configuration;
- application runtime, recovery endpoints/scripts/Edge Functions;
- backup codes / phone MFA / WebAuthn / passkeys;
- AAL2 contract;
- admin roles, RLS, policies, account status;
- secrets in docs (placeholders only);
- consumer MFA recovery;
- incident/support/error-boundary/revenue follow-ups;
- global continuity documents (`docs/ACTIVE_WORK_STATUS.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `JETNITY_HANDOFF.md`, `docs/CONTINUITY_STANDARD.md`);
- Ready / merge / follow-up slice.

An environment-generated `next-env.d.ts` working-tree diff was discarded and is not part of this branch.

## 5. Gates

Local and exact-head GitHub CI / Vercel Preview are **pending** on the implementation commit. Results will be written after they exist. No gate is claimed green here.

No Supabase live mutation or destructive smoke was performed or is required.

## 6. Next step

1. Run the required local gates on this implementation head.
2. Persist exact-head CI / Preview / `origin/main` drift evidence.
3. Stop for independent Technical-Lead review.
4. Do not Ready. Do not merge. Do not start a follow-up slice.
