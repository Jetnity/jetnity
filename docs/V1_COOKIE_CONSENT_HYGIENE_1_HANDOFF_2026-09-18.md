# Jetnity – V1 Cookie Consent Hygiene 1 HANDOFF

Stand: 18. September 2026  
Status: **IMPLEMENTATION COMMITTED / GATES PENDING / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**

Binding task: `docs/V1_COOKIE_CONSENT_HYGIENE_1_TASK_2026-09-18.md`  
Detailed status: `docs/V1_COOKIE_CONSENT_HYGIENE_1_STATUS_2026-09-18.md`  
Self-review: `docs/V1_COOKIE_CONSENT_HYGIENE_1_SELF_REVIEW_2026-09-18.md`

This document is enough for a new agent or Technical Lead to continue without the chat.

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #475 |
| Draft PR | #477 |
| Branch | `fix/v1-cookie-consent-hygiene-1` |
| Canonical base | `main@854045a0f37e07d783115dd3a0ee6b302f79bfa1` |
| Dispatch head | `f1a7b82296f72215fb32d2b4c2a43d8d311fd97c` |
| Source audit | #438 / merged PR #449 / finding 1.2(a) |
| Agent | Jetnity V1 cookie consent hygiene 1, Generation 1 |
| Parent model | Cursor Grok 4.6 High Fast (confirmed) |
| Session | `bc-a4bf118d-c750-45d1-8a2a-ff90836c397b` |

Read first:

1. `docs/V1_COOKIE_CONSENT_HYGIENE_1_TASK_2026-09-18.md`
2. finding 1.2(a) in `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_GAP_MATRIX_2026-09-17.md`
3. this handoff and the STATUS / SELF_REVIEW for the same slice
4. live PR #477, live `origin/main`, live CI and Vercel Preview

Do not treat this file as current exact-head truth after a later commit.

## 2. What changed

The unmounted CookieConsent artefact is gone.

- `components/layout/CookieConsent.tsx` deleted.
- Dedicated `check:dead` exception removed.
- Focused legal/sanitation tests now lock absence, not orphaned existence.
- Root layout still mounts no banner.
- No tracker, legal page, cookie or localStorage processing was added.

## 3. What a reviewer should verify first

1. `components/layout/CookieConsent.tsx` does not exist.
2. No runtime importer of CookieConsent remains.
3. `scripts/erreichbarkeit.mjs` has no CookieConsent exception.
4. Focused tests lock removal and no-tracker/no-banner truth.
5. No `/privacy` / `/terms` content, no replacement banner, no analytics SDK.
6. Local gates, exact-head CI and exact-head Preview after they exist.
7. `origin/main` re-fetch: exact head, merge-base, ahead/behind, drift.

## 4. What this slice does not mean

Deleting the orphan does **not** create a privacy policy, consent UX, or tracker program. `/privacy` and `/terms` still 404. A future non-essential tracker requires a separate explicit consent/legal gate.

## 5. Next step

Complete required local and exact-head gates, then **STOP FOR TECHNICAL-LEAD REVIEW**.
