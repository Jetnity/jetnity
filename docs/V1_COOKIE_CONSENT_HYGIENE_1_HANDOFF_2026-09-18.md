# Jetnity – V1 Cookie Consent Hygiene 1 HANDOFF

Stand: 18. September 2026  
Status: **LOCAL GATES PASS / EXACT-HEAD CI+PREVIEW PASS ON `121d4d66` / THIS PERSIST INVALIDATES THAT HEAD / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**

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
| Canonical base / live `origin/main` | `main@854045a0f37e07d783115dd3a0ee6b302f79bfa1` |
| Dispatch head | `f1a7b82296f72215fb32d2b4c2a43d8d311fd97c` |
| Implementation head | `121d4d66c2d8dee82289aecab31e8305456c72cf` |
| Merge-base / ahead / behind at `121d4d66` | `854045a0` / **2 / 0** |
| Source audit | #438 / merged PR #449 / finding 1.2(a) |
| Agent | Jetnity V1 cookie consent hygiene 1, Generation 1 |
| Parent model | Cursor Grok 4.6 High Fast (confirmed) |
| Session | `bc-a4bf118d-c750-45d1-8a2a-ff90836c397b` |

Read first:

1. `docs/V1_COOKIE_CONSENT_HYGIENE_1_TASK_2026-09-18.md`
2. finding 1.2(a) in `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_GAP_MATRIX_2026-09-17.md`
3. this handoff and the STATUS / SELF_REVIEW for the same slice
4. live PR #477, live `origin/main`, live CI and Vercel Preview

Do not treat older SHAs as current exact-head truth after a later commit.

## 2. What changed

The unmounted CookieConsent artefact is gone.

- `components/layout/CookieConsent.tsx` deleted.
- Dedicated `check:dead` exception removed; `check:dead` now reports 0 orphans.
- Focused legal/sanitation tests lock absence, not orphaned existence.
- Root layout still mounts no banner.
- No tracker, legal page, cookie or localStorage processing was added.
- Sibling Data Export slice (PR #476) was not touched.

## 3. What a reviewer should verify first

1. `components/layout/CookieConsent.tsx` does not exist.
2. No runtime importer of CookieConsent remains.
3. `scripts/erreichbarkeit.mjs` has no CookieConsent exception.
4. Focused tests lock removal and no-tracker/no-banner truth.
5. No `/privacy` / `/terms` content, no replacement banner, no analytics SDK.
6. Re-gate **this persist head** (the `121d4d66` pair is invalidated by this commit).
7. Live `origin/main` re-fetch: exact head, merge-base, ahead/behind, drift.

## 4. What this slice does not mean

Deleting the orphan does **not** create a privacy policy, consent UX, or tracker program. `/privacy` and `/terms` still 404. A future non-essential tracker requires a separate explicit consent/legal gate.

## 5. Already verified on `121d4d66` (invalidated by this persist)

- Local: focused 15/15, full 3460/3460, typecheck, lint 0 errors, production build, all five hygiene checks.
- Local production render of `/`, `/login`, `/register`, `/planen`: no stale consent/processing claim.
- GitHub Actions #1852 / `35336782908`: SUCCESS.
- Vercel Preview `BV4sLNRvpiz9T8bdTE7VmYoh3kpK`: READY. Unauthenticated scrape hit Vercel SSO and is not claimed as HTML proof.

## 6. Next step

Re-gate the persist head, then **STOP FOR TECHNICAL-LEAD REVIEW**. No Ready. No merge. No follow-up slice.
