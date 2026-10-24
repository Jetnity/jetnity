# Organisieren Action Recovery 1 — SELF REVIEW

Date: 24 October 2026
Author: **Jetnity Organisieren Action Recovery 1 — Cursor Generation 1**
This is the author review. It is not a Technical-Lead PASS.

## Scope

Allowlist only. No sibling branch. No global current-state file. TASK V1 was not edited. No dependency, workflow, config, Auth, DB, or shared contract change.

`ManuelleVerbindung` hash matches the accepted bytes. The mobility diff above that function is the booking lifecycle plus one tab-row wrap (`min-w-0 max-w-full flex-wrap`, no `shrink-0`) so 200% text does not widen the page. The flight-route editor and the stay-interval editor were not given a new save contract. Their existing tests pass.

## Behavior I checked against the source

- Claim happens before the await, on a stable object, so two submits in one turn produce one callback.
- `readBookingResult` maps both rejection and throw to the same non-secret sentence. An empty-string domain result stays success, matching the old `if (fehler)` check.
- `finishBooking` no-ops when the generation or the pending id no longer matches, and it does not clear a newer claim.
- Rental trip change increments generation and clears `schreibt` without clearing field state. The in-flight save returns before `endRentalSave` and before the reset.
- Booking buttons do not restore focus. That is deliberate: moving focus after save was taking it from the route and interval editors. The active button stays in the tab order, so keyboard recovery does not depend on a programmatic focus call. Rental still restores its submit button only when `document.activeElement` is the body.

## Proof limits

The node suite drives the real component functions with a per-file React stand-in. It is not a browser. The Playwright harness is the mounted DOM, focus, and CSS proof, on synthetic trips with an empty origin so flights and connections stay unassigned. It does not open “Verbindungen prüfen”.

The 320/200% connection overflow is recorded in `docs/evidence/organisieren-action-recovery-1/result.json` and is not marked as an owned-surface failure. I do not treat that as a fix.

## What I would ask the Technical Lead to look at

- The active booking control is focusable while `aria-disabled="true"`. Siblings are actually disabled. Both are visually dimmed.
- Late completion is invalidated in render for trip id and missing item id, and by unmount in the browser. There is no `useEffect` cleanup, because the existing stay tests do not mock `useEffect`.
- Full `npm test`, CI, and Preview for this head are not claimed.
