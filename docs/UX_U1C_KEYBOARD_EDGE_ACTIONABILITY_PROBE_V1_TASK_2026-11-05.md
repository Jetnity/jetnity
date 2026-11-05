# U1C keyboard route-edge actionability probe — V1 (bounded)

Date: 2026-11-05, Europe/Zurich. Parent [#1122](https://github.com/Jetnity/jetnity/issues/1122). Baseline main `79b4e79029abc646fcea080109a56dd8a3a23790`.

## Why this tiny test-only slice exists

Draft [#1121](https://github.com/Jetnity/jetnity/pull/1121) implements a safe offline Grok RESEARCH_ONLY intake. Its seven new tests passed, but a full CI attempt failed on an **unchanged** U1C route browser test: pressing Enter on the connection node did not produce the expected detail in 30 seconds. A previous attempt failed separately on an existing local PostgreSQL proof timeout. The same U1C browser test had passed in other recent runs, so no definitive product regression has been proven.

Source inspection found `components/trips/TripWorkspaceRoute.tsx` renders the same `data-u1c-kante-id` selector on either a **button** (when selectable) or **div** (when locked/ambiguous). The failing test used a broad locator followed by `press('Enter')`, which can act on a non-interactive div and then time out looking for detail. This is a plausible, testable race hypothesis, not an assertion that the failed runner had an inert div.

## Change and acceptance criteria

- Only `lib/trips/ux-u1c-route-design-alignment-1/workspace-browser.test.ts` changes, plus this scoped task.
- Wait for the actual button, require it to be actionable and keyboard-focused, then press Enter. No click shortcut.
- Retain the detail-visible assertion with the existing 30 second bound, the subsequent connection-opening, return-focus and no-network assertions.
- On a real failure record only bounded page-local diagnostic fields (URL, DOM tag/aria/disabled/inert state, focus, route visibility, detail count), not user data.
- No timeout increase, retry inside the test, catch-and-ignore, disabled test or browser runtime change.
- Native CI must pass exact head; independently inspect the changed test and compare against the existing product component. Keep Draft until review.

## Exclusions

No Official Truth rule, no Supabase/SQL, no #917 readback bypass, no #985/#937 overlap, no provider/secret/production access, no new external cost. A passing test is not live Production readiness or a regulatory truth claim.

After successful native verification, accept/merge this tiny owning U1C test-contract correction separately, then re-evaluate the actual Grok PR against updated main without weakening its full CI gate.
