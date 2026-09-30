# Trip Workspace Cross-Device Interaction 1 — Self-review

Stand: 30 September 2026
This is the author check. It is not a Technical Lead PASS.

## Scope

The change is the shared workspace seam plus the field-width rule in flight search and the mobility manual form. No provider, schema, payment, dependency or token file changed.

## Checks

- The reproduced baseline is the seed component: search sat after the desktop grid.
- The R1 after pass is bound to `3264a2ef18f81c84c5d059eabc178e2b2358f263`.
- Merge-base with main is `ea6253d603e57cd19395cef951faabc75cb8ab3a`. The branch was 0 behind after the integration.
- `docs/ACTIVE_WORK_STATUS.md` matches current main.
- The helper file remains only because R1 explicitly allows that one path. The task addendum says it was outside the original allowlist.
- On 360 and 390, explicit flight search shows the sticky return, then `Flüge`, then `Verbindungen für diese Reise`, then the first field. Hotel, activities and mobility keep a domain or work heading below that chrome.
- Search still mounts only after the explicit control.
- Mouse does not focus the search field. Keyboard does.
- Escape closes and restores the invoking control.
- No horizontal overflow on the required viewports.
- Local typecheck, lint, full tests, build and the listed hygiene checks passed. Lint still reports 145 pre-existing warnings and 0 errors.

## Limits

- Browser evidence is synthetic guest state in headless Chromium, with provider routes intercepted. It is not a signed-in account session, not Safari, and not a physical device.
- At 1024×768 and 1280×800 the search reveal puts the search heading at the top of the viewport. The detail title is just above that viewport. The work remains in the right column.
- On 360 and 390 the sticky return and the search identity share the viewport. The in-card detail title does not, because the existing list sits between them.
- `MietwagenBereich.tsx` was not edited. Its viewport two-column fields remain.

## Decision

Draft stays draft. No Ready. No merge. No follow-up slice.
