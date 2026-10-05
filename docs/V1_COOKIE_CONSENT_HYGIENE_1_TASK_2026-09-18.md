# Jetnity – V1 Cookie Consent Hygiene 1 Task

Stand: 18. September 2026
Status: **ACTIVE / V1 P2 HYGIENE / PARALLEL BOUNDED SLICE**

Issue: #475
Source audit: #438 / merged PR #449 / finding 1.2(a)
Canonical base: `main@854045a0f37e07d783115dd3a0ee6b302f79bfa1`
Branch: `fix/v1-cookie-consent-hygiene-1`

Cursor-Agent: **Jetnity V1 cookie consent hygiene 1**
Generation: **1**
Required parent model: **Cursor Grok 4.6 High Fast**

Do not use Auto. If unavailable, STOP/report.

## Goal

Remove the stale orphaned CookieConsent component and repository exceptions/tests that preserve its false processing claim, while keeping the truthful current runtime state: no non-essential tracker and therefore no mounted consent banner.

## Required precheck

Before deleting:
- prove `components/layout/CookieConsent.tsx` has no runtime importer;
- prove no non-essential tracking/analytics SDK or injected tracking script was added since the audit;
- identify exactly which dead-code/test exceptions refer to this component.

If a real runtime importer or non-essential tracker now exists, STOP and report instead of deleting/masking the issue.

## Required result

- delete `components/layout/CookieConsent.tsx`;
- remove only the dead-code exception(s) that existed solely for this component;
- update focused legal/sanitation tests that intentionally encoded its orphaned existence;
- preserve no-banner/no-tracking runtime behavior;
- do not replace the component with new legal text or consent UX;
- persist the invariant: if a non-essential tracker is ever introduced, consent/legal handling becomes a separate explicit gate.

## Allowed write scope

- delete `components/layout/CookieConsent.tsx`
- `scripts/erreichbarkeit.mjs` only for the dedicated CookieConsent exception
- `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` only where required for CookieConsent truth
- `lib/project-sanitation/closure-invariants.test.ts` only where required for CookieConsent truth
- a narrowly focused test if needed
- slice docs:
  - `docs/V1_COOKIE_CONSENT_HYGIENE_1_TASK_2026-09-18.md`
  - `docs/V1_COOKIE_CONSENT_HYGIENE_1_STATUS_2026-09-18.md`
  - `docs/V1_COOKIE_CONSENT_HYGIENE_1_HANDOFF_2026-09-18.md`
  - `docs/V1_COOKIE_CONSENT_HYGIENE_1_SELF_REVIEW_2026-09-18.md`

If another file is required, STOP/report before widening scope.

## Hard exclusions

No `/privacy`, `/terms`, imprint or invented legal content.
No mounted replacement banner.
No tracker/analytics SDK.
No cookie/localStorage processing expansion.
No Data Export files.
No Supabase/Auth/RLS/migration/provider/secret/cost change.
No global continuity files.

## Validation

- focused tests;
- full tests;
- typecheck;
- lint;
- Production build;
- repo hygiene checks;
- exact-head CI + Vercel Preview;
- live merge-base/ahead/behind;
- GitHub/Vercel thread state.

No Ready. No merge. No follow-up slice.

Final state: **STOP FOR TECHNICAL-LEAD REVIEW**.
