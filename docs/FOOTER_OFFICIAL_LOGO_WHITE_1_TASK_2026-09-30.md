# Jetnity Footer Official Logo White 1 — TASK

Stand: 30 September 2026
Status: **BOUNDED FOOTER BRAND PRESENTATION FIX / PARALLEL SAFE WITH #655**

Issue: #656
Branch: `fix/footer-official-logo-white-1`
Baseline: `main@8571db776bb58042a8107e341052a36cbbe9a50c`

## Product-Owner decision

The white rounded backing surface behind the official Jetnity logo in the dark footer must be removed.

Required final state:
- use the exact existing `/brand/jetnity-logo.png` asset;
- do not redraw, crop, distort or change geometry;
- navbar keeps the official full-color logo;
- footer renders the entire official logo/wordmark as pure white on the dark green footer;
- no white chip/background behind it;
- keep the home link and accessible name;
- favicon/App icons remain untouched.

Preferred implementation:
- preserve the existing PNG;
- use presentation-only CSS/filtering on the footer image to make the full mark white (e.g. brightness(0) invert(1)), rather than creating another logo asset;
- keep natural aspect ratio and current responsive sizing.

## Parallel ownership

PR #655 is active but currently owns only its security/dependency task path and may later own package/lock/security audit files.

This footer slice may edit only:
- `components/layout/Footer.tsx`
- focused footer-logo test/evidence if needed
- own task/report/handoff/self-review/evidence

Do not edit:
- `PublicNavbar.tsx`
- `public/brand/jetnity-logo.png`
- `app/icon.svg`
- manifest/PWA/favicons
- package files
- homepage/search files
- Auth/session logic
- global continuity pointers

If #655 begins editing Footer.tsx, STOP for TL collision resolution.

## Acceptance

- 360×800 / 390×844 / 1440×900 footer visual proof;
- 200% text reflow;
- no horizontal overflow;
- logo remains crisp and proportional;
- footer logo is visually white against dark green;
- no white backing chip;
- focus-visible remains;
- navbar logo remains untouched;
- favicon remains byte/content unchanged from baseline;
- tests/typecheck/lint/build as proportionate for this bounded UI change;
- exact-head CI + Vercel Preview;
- remain Draft, no Ready/merge, no follow-up slice.

Required model: Grok 4.7 High Fast, not Auto.
