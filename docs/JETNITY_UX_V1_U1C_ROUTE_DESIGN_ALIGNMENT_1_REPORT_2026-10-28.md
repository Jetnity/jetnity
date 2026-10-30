# Jetnity UX V1 U1-C Route Design Alignment 1 — REPORT

30 October 2026. Amendment 3 integration in the same session `bc-4904589f-a8f0-4106-a65a-507bc53e084a`. Model read-back `grok-4.7-high-fast`. Session name read-back `Jetnity UX V1 Route Design Alignment 1 — Cursor Generation 1`.

## Baseline

Pinned main `ac2199dba64e458a20a155b5d1bb826ea99949d3` was merged with an ordinary merge. The only conflicts were `TripWorkspace.tsx` and `TripWorkspaceKopf.tsx`. Both header variants keep `reiseoptionen`. The released shell, light default, Green-Light toggle, four modes, header actions, account menu, and mobile drawer were not rewritten. A later fetch still showed that main, 0 behind.

## What the integration changes

The workspace early return renders “Reiseoptionen” under the storage sentence. The buttons stay inside `.workspace-storage-options`, so the existing light-theme remap still applies. `.workspace-reiseoptionen > summary` uses `--workspace-ink` and a 44px target. Green text on the remapped dark page was checked in the harness after the shell stylesheet was placed after the Tailwind output, which is the same order as the app: global CSS first, shell CSS later.

`backToTopInlineAbstand` returns a bottom value only outside `.workspace-page`. A fixed bottom nav with no positive `--ux-u1a-nav-offset` still hides the control. The shell rule `.workspace-page [data-back-to-top]` remains the spacing owner and was not edited.

## Tests

The workspace harness mounts real `WorkspaceShell` and real `TripWorkspace`. Guest and account probes mount `GastArbeitsbereich` and `KontoArbeitsbereich` with the synthetic reference trip. Account deletion uses the original `reiseLoeschen`. The synthetic id is not a UUID, so the action returns “Diese Reise ist unbekannt.” before any database call. The test recorded no fetch or XHR on that page.

Root 32px is root font size, not browser zoom. Physical Safari and VoiceOver were not run. #1068 and hosted account acceptance under #968 stay outside this slice.

## Historical report

28 October 2026. Same session `bc-4904589f-a8f0-4106-a65a-507bc53e084a`. Model read-back `grok-4.7-high-fast`. Session name read-back `Jetnity UX V1 Route Design Alignment 1 — Cursor Generation 1`.

## Baseline at the first implementation

Amendment `97c4ad9afdaa5a215722f89556d6163f02b2f981` was read before runtime edits. `origin/main` remained `8fc72a18390af1650d6902fb2a20a64e4f7f8ccc`, tree `24770e02bd176f06040ccaf515783534ca5c83e6`. This branch was 0 behind that main.

## Behavior

`routeModell` reads `chronologischeLaeufe` and `mobilitaetsAbdeckung`. It does not write the trip. A row is one run. A connection row exists only when the next run is also a destination and the existing edge id is `connection:<fromStageId>:<toStageId>`. Outbound and return edges are ignored. If that id matches more than one adjacent boundary, every matching row stays text and says the id is ambiguous. The optional `kante` query is presentation only. `modusFuerReise` does not delete a readable `kante` when the day is gone, so the unavailable sentence can stay on reload. Selecting a run or day clears `kante` through the existing `tag` write.

Planned dates are grouped only where each next valid date is exactly one day later. Gaps, duplicate dates, and invalid dates are named. Stored stage arrival and departure stay a separate label. A matched transfer can show its title, “vom Nutzer als gebucht markiert”, and a stored local-time difference. None of those is provider confirmation or a verified elapsed duration.

`Reiseoptionen` is a native `details` disclosure. The summary is not a button. The existing guest and account buttons, confirm strings, and storage calls are unchanged. Save errors and the account save sentence stay outside the disclosure.

Back-to-top reads `[data-shell-nav="bottom"]` and `--ux-u1a-nav-offset`. The offset already includes the nav’s own safe-area padding, so safe area is not added again. Non-workspace pages keep `bottom: calc(1.5rem + safe-area)`.

## Evidence

Same reference fixture, root font 16px, Chrome channel in this session (chronology run reported Chrome `148.0.7778.96`):

- Before, desktop 1440: `/opt/cursor/artifacts/u1c-before-desktop-1440.png`
- Before, mobile 390: `/opt/cursor/artifacts/u1c-before-mobile-390.png`
- After, desktop 1440: `/opt/cursor/artifacts/u1c-after-desktop-1440.png`
- After, mobile 390: `/opt/cursor/artifacts/u1c-after-mobile-390.png`
- After, mobile 390 scrolled, hit-test position: `/opt/cursor/artifacts/u1c-after-mobile-390-scrolled.png`
- After, mobile 390, root font 32px, labeled as root text rather than browser zoom: `/opt/cursor/artifacts/u1c-after-mobile-390-root32.png`

The before images were rendered from `TripWorkspacePlan` at amendment `97c4ad9a` with the same reference trip. That temporary file was not committed.

The evidence test asserted no intersection between the Back-to-top box and the fixed bottom nav, and separate hit targets. It also asserted no fetch/XHR while selecting a visit on the desktop route.

## Correction R1–R5

Review `6478861951` is recorded in amendment 2 before the runtime edits.

- R1: the geometry test no longer requires 22 day buttons during the sticky scroll. It still checks one sticky nav, the long day-1 note, focus/history and no provider calls, then opens each chronological run and requires all 22 day ids. The DejaVu/safe-area assertion was left unchanged and passed in this session.
- R2: `status === 'unknown'` now says the assignment is unclear and is not evidence that nothing was saved. Open with no matched item still says no saved connection. A matched user-booked transfer stays user-marked, not provider-confirmed. Canonical `mobilitaetsAbdeckung` was not edited.
- R3: each day button’s accessible name is `Tag N, date` (or the custom title plus the date). The mounted test uses that role name.
- R4: the arrival sentence is “Gespeichertes Ankunftsdatum des Ziels”. Repeated sections say “Dieser Abschnitt kommt mehrfach vor” and do not say “Kennung”.
- R5: `workspace-browser.test.ts` mounts real `TripWorkspace`. At 390px, Enter on a run moves focus to the visible Zur Route button instead of `body`.

## Not claimed

Organizer context, F01, provider activation, browser zoom, physical Safari, VoiceOver, and a domain fix for stage-duration versus unassigned days.
