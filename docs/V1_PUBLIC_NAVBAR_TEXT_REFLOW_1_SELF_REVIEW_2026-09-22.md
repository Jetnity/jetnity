# V1 Public Navbar Text Reflow 1 — Self-review

Stand: 22. September 2026  
Status: **AUTHOR SELF-REVIEW IN PROGRESS — NOT TECHNICAL-LEAD ACCEPTANCE**

Green self-review is not TL acceptance.

## Scope check

- Only `PublicNavbar` presentation/layout plus own docs/evidence.
- No GastCreateLink, navigation helper, sign-out action, homepage hero, global CSS, package or workflow edits.
- `md` breakpoint kept. Labels, destinations, sticky, safe areas, focus ring and `min-h-11` kept.

## Residual risks

- Controlled React-state mocks for unknown/konto; guest uses real empty-cookie `getSession`.
- Simulated 32px root, not OS zoom / Safari / hardware / WCAG.
- Later homepage overflow remains unowned.
- Parallel #534 must merge first; this branch must not rebase itself.
