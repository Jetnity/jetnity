# UX V1 U1-A — SELF-REVIEW

Author review only. This is not an independent Technical Lead PASS.

## Checked

- Exclusive paths only: header, mode nav, overview spacing, the shell wrapper attribute and bottom padding in `TripWorkspace.tsx`, helper, unit test, audit script, these docs, and local screenshots.
- Not edited: `TripWorkspacePlan.tsx`, timeline, trip-audit, destination-essentials, providers, guest/account writers, `docs/ACTIVE_WORK_STATUS.md`, SQL, Auth, package, CI.
- Four labels, one click path, no second search mount. Audit counted zero `flugsuche` / `hotelsuche` / `aktivitaeten` mounts and zero matching provider requests across viewport and mode changes, including back/forward.
- Title is the stored string. Route shows Bangkok twice for two stage ids. Budget `null` stays `Noch offen` inside the disclosure. Save line is `device` or `account` from `quelle`.
- Existing source-contract test `lib/trips/trip-workspace-premium-experience-3.test.ts` still passes without edits.
- Attention text on the synthetic trip is the existing engine: open flight stretch, missing nights, official check not yet possible, plus “2 weitere Hinweisgruppen”. No percent. Destination rows stay four Thailand stages with `keine_evidence`, including both Bangkok ids.

## Limits I will not upgrade

- Headless Chromium did not open an OS keyboard. The keyboard case replaces `visualViewport` and dispatches `resize`. That stand-in moved the bar from `fixed` to in-flow. It is not a device keyboard.
- `env(safe-area-inset-bottom)` is on the bottom bar. The headless inset was not overridden, so the computed inset is 0.
- Ctrl+Equal did not change `innerWidth` in this headless browser. Zoom evidence is CDP `Emulation.setPageScaleFactor` 2, with root font still 16. The separate root-32px runs did not change `visualViewport.scale`.
- The pending sentence “Die Reiseansicht wird vorbereitet.” is still in the shell. The audit set session storage before first paint and did not capture that frame.
- No physical phone, no VoiceOver pass, no new-head GitHub CI, no new-head Preview.

## Defect

None found in the measured local matrix after the page-scale shell cap. The site header can still sit wider than the visual viewport under page scale, because it is outside this slice.
