# V1 Public Navbar Text Reflow 1 — Self-review

Stand: 22. September 2026  
Status: **AUTHOR SELF-REVIEW AFTER MAIN INTEGRATION — NOT TECHNICAL-LEAD ACCEPTANCE**

Same session. Merge of exact `c0e32dc` was once and conflict-free. PublicNavbar blob equals frozen `05037863`. `page.tsx` blob equals main. Integrated assert PASS: navbar overflow 0, hero below header, abort 1/1/0. No Ready/merge/follow-up.

Green self-review is not TL acceptance.

## Scope

PASS. Exclusive runtime write is `components/layout/PublicNavbar.tsx`. No GastCreateLink, `oeffentliche-navigation`, sign-out action, homepage hero, global CSS, package, workflow or DB edit.

## Acceptance

| Criterion | Verdict |
| --- | --- |
| Exact-baseline before 1024/200 and 1440/200 with raw navbar bounds | PASS — CTA 1171.88 / 147.88; vertical clash vs 72px row |
| After 1024/1440 @ 32px every visible control fits; destinations remain | PASS — navbar H/V offenders 0; wrap keeps labels |
| Normal 360–1920 plus breakpoint neighbors; 360/390 @ 200% usable | PASS — 73px single row at 100%; 360/200% stacks without clipping |
| Menu open/close, Escape focus, hash close, short viewport, no logout | PASS |
| unknown/guest/account via real component + labelled mocks | PASS |
| Actual rendered bounds, navbar overflow scored separately | PASS — 1024/200% document overflowX 148 → 0, equal to the CTA |
| Existing tests + typecheck/lint/fulltests/hygiene/build | PASS locally |

## Honesty

- First before-konto screens still show Anmelden; the mock lost the `getSession` race. After evidence holds konto/unbekannt and is labelled.
- 360/200% hamburger wraps under the logo. Usable, not clipped.
- 1440/200% still wraps the action cluster; that is wrap, not overflow.
- Simulated text only. No OS zoom / Safari / hardware / WCAG claim.
- Abort probe is a same-origin `POST /`, not a clicked logout.

## Residual risks

- Authorized exact-main merge `c0e32dc` plus representative coexistence proof is done. A later main move would require a new authorized integration, not an autonomous rebase.
- Decorative later-page overflow stays unowned if it reappears below the hero.
- Controlled React-state session mocks are not real Auth.

## Verdict

Author recommends independent Technical-Lead review of the exact freeze head. Not Ready. Not merged. No follow-up slice.
