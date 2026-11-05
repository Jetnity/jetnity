# U1C Mobile Keyboard Activation – Atomic Focus/Enter CI Fix R2

Date: 2026-11-05 (Europe/Zurich)  
Tracking: [#1122](https://github.com/Jetnity/jetnity/issues/1122)  
Baseline main: `1618cd1bea6f27522a5adec7452d056c1e4a0af3`  
Mode: `NORMAL`  
Writer: Jetnity Technical Lead (direct repository work)

## Exact failing evidence

The **post-merge** workflow [CI #3893, run 42103243496](https://github.com/Jetnity/jetnity/actions/runs/42103243496) for merge #1125 completed FAILURE. Source log from App job 127511262467: **7,897 tests, 7,894 passed, 1 failed, 2 skipped**. The sole failure was in the older U1C browser keyboard/return test. It failed **before Enter was pressed**, at `workspace-browser.test.ts:1195`:

`the route edge must be an actionable, keyboard-focused button` (`false !== true`).

The route edge `button[data-u1c-kante-id="connection:stage-bkk:stage-kc"]` had already passed Playwright's `waitFor({ state: 'visible' })`. The previous test separately called `locator.focus()`, then immediately asserted `document.activeElement === el`. That snapshot is sensitive to asynchronous focus management in `TripWorkspace.tsx` (layout effects can legitimately focus route navigation while React settles), but the old log does **not** identify which conjunct (HTMLButtonElement/disabled/activeElement) was false. Neither a Grok source-code failure nor a production safety incident follows from the red run.

## Bounded correction

Only one existing browser test plus this versioned task file:

- Keep the exact actionable BUTTON locator; never fall back to the inert DIV sharing the attribute.
- Assert the matched element is a button, not disabled, keyboard reachable (`tabIndex >= 0`), not in a hidden/inert subtree. This provides separately readable diagnostic values.
- Use `locator.press('Enter')` as **one actual keyboard action** rather than `focus()` followed by a focus snapshot. The [official Playwright Locator.press documentation](https://playwright.dev/docs/api/class-locator#locator-press) states that `press()` focuses the matched element and then dispatches keyboard.down/keyboard.up. It does not click the button with a pointer or bypass its native keyboard handler.
- Keep the existing detail visibility and URL/route assertions, actual All Connections keyboard Enter, stale-node assertion, back-navigation focus restoration and no-network checks.
- Never catch/ignore a broken keyboard journey; a true failure still turns the native CI red. No test skip, no timeout increase, no fixture change, no runtime code change.

## Required verification and exclusions

Run full exact-head GitHub CI including keyboard/UX, Official Truth, Auth and Build. Keep this PR Draft until independent exact-head Technical-Lead review and all required checks pass. No blind retry loop; inspect original logs if it fails. Do not claim this proves absence of other focus races.

No Supabase SQL/readback/migration/permissions, no #917 platform stop bypass, no #985/#937 scope, no Grok/Official Truth/provider activation, no new costs. This is a CI/UI test-only fix needed to validate the already merged (but inert) Grok work.
