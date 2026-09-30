# Jetnity Final Homepage Premium Experience 2 — Self-review

Date: 30 September 2026
This is the author self-review. It is not a Technical-Lead PASS.

## Scope

Allowlist only. Hero, inspiration, StartzielForm, PublicNavbar and auth navigation were not edited. Global continuity files were not edited.

## What holds

- H1, definition, canonical, JSON-LD types and fail-closed robots stayed on the production server.
- Every `HOMEPAGE_FAEHIGKEITEN` title and sentence is in the server HTML inside `<details>`, confirmed by the audit.
- The product window stays `Produktvorschau` and still says there is no price, no availability and no official result.
- Guest navbar after hydration shows Anmelden only, on desktop and in the compact menu. Server HTML makes no session claim.
- Clicking Jetnity Pro opens `#pro` and scrolls the sentence into view. The inline script exists because same-page Next.js hash navigation left the disclosure closed.
- Phone 360/390 and desktop 1440 were captured before and after. Overflow, 200% text, reduced motion, keyboard focus and console/network checks passed in `audit.json`.
- `npm test` 4082/4082, typecheck, lint (0 errors), production build and hygiene checks passed locally.

## What this review does not claim

- That the visual result is the best possible premium page. That judgment belongs to the Technical Lead, using the before/after evidence.
- Signed-in navbar behavior in a browser. The unit contract passed. No account session was available.
- GitHub CI, the Auth job, or Vercel Preview on the delivery head. Those start after push and are not a local substitute.
- Indexing, launch, provider or payment readiness.

## Residual risk

The `#pro` behavior depends on a small inline script plus the browser’s native fragment behavior on full loads. If that script is removed, the navbar link still changes the hash, but the disclosure can stay closed on client-side navigation.

The capability titles appear twice: once in the compact status list and once in the disclosure. The sentences appear once. That is a summary plus the source text, not a second product claim.
