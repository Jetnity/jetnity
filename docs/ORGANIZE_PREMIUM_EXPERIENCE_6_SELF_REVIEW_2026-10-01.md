# Organize Premium Experience 6 — Self-review

Stand: 30 September 2026
This is the author review. It is not an independent Technical-Lead PASS.

## Scope

Checked against `docs/ORGANIZE_PREMIUM_EXPERIENCE_6_TASK_2026-10-01.md`.

- Left rail and right detail remain. From 1024px the audit measured `geteilt-schmal` or `geteilt-weit`. Below 1024px the open detail is one column and the rail is hidden.
- Active domain uses the existing brand fill plus a citrus marker. Status text is `DETAIL_LAGE_TEXT` or the existing coverage sentence. No new coverage truth.
- Desktop return remains keyboard-focusable, at least 44px, and is still the focus target. Compact return is still the sticky control.
- Repeated lage wording is dropped only when the same clause is already visible. Coverage sentences, “kein Pflichtpunkt”, flight-covered notes and the explicit-search sentence stay.
- Opening a domain did not call a provider. Flight search mounted without a request. `POST /api/flights/search` happened on “Flüge suchen”. Hotel, activity and mobility requests happened only on their existing explicit actions.
- Forms gained groups only. Payloads in `FlugSuche`, `MobilitaetBereich` and `MietwagenBereich` were not edited.
- The device addendum in PR comment `5920703563` was measured: 320, 360, 375, 390, 412, 430, landscape 844×390, 768, 820, 1024, 1280, 1440, 1728, 1920, 200% at 360, zoom 125% and 150% at 1440, and reduced motion. No horizontal overflow. Workspace touch targets were at least 44px.

## Not claimed

- Independent review
- CI on a tip newer than `1397b243`. That SHA is success: run `36785724060`, Auth job `110126535130`, Vercel inspector `W83cnK1bneCNnM8TQkD2rxCr5TBi`.
- Physical device
- Signed-in workspace
- Sticky rail. It would need the parent scroll-offset measurement, which is outside this slice.

## Parallel files

`git diff` against the task baseline does not include `TripWorkspace.tsx`, `TripWorkspacePlan.tsx`, `Reisevorbereitung.tsx`, `TripWorkspaceModeNavigation.tsx`, `TripWorkspaceKopf.tsx` or `TripWorkspaceUebersicht.tsx`.
