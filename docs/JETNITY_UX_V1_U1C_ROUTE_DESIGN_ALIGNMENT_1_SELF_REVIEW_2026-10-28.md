# Jetnity UX V1 U1-C Route Design Alignment 1 — SELF REVIEW

30 October 2026, evening Europe/Zurich. Author review of the R6 test correction. Not an independent Technical Lead PASS.

## R6 test correction

- The audit no longer stops at the first label. Date and time labels are counted and measured on the create form and on the edit form.
- The Enddatum counterexample fails only that label. The pale-panel counterexample still removes the editor hook at 768px.
- The `text-ink-900` change is limited to the four editor sentences that were using `text-ink-700`. It was made because the new audit measured 4.06:1 at 320px in the light theme.
- CI 41102456996 belongs to `802f9159`. Its run-level success is not reused as the gate for this correction head. The earlier review also found the App job steps inconsistent, so those totals are not restated as a certified PASS.

## R6 presentation review

- The editor hook does not change save, validation or draft state. The guest note was created, reloaded, edited and reloaded as one item.
- The failing contrast case uses the compiled stylesheet with the hook removed, at the `sm` width the screenshot described.
- Light theme rules were not given a new background. The light heading still clears 4.5:1 at 320 and 768.
- Selected-state CSS is limited to the green theme and the existing pressed/current attributes.
- No Auth, database, provider, env or package file changed. The Owner's hosted guest draft was not opened or cleared.

## Checked earlier today

- The merge kept both `reiseoptionen` and the released `workspace` / `uebersichtAktiv` props. It did not take either file wholesale.
- `WorkspaceShell`, theme preference, navigation, and account menu were not edited.
- `workspace.css` was not edited. The new summary rules are only in `workspace-surfaces.css`.
- Inside the shell, the back control’s inline `bottom` stayed empty while a fixed bottom nav was present. The measured rectangles did not overlap.
- Cancellation left the synthetic guest draft in place. Confirmation removed that key once through `gastreiseEntfernen`.
- The account button still calls `reiseLoeschen`. The harness did not stub that function. The non-UUID fixture stops before `konto()`.
- The old `/opt/cursor/artifacts` path is no longer hard-coded. Assertions in the evidence test were not weakened.
- No provider, Auth, database, env, or package file was edited for this slice.

## Limits

Hosted Preview and a signed-in develop account were not exercised. #968 remains closed for this branch. Root 32px is not browser zoom. The geometry suite from 28 October was not repeated as its own process on this head. VoiceOver and physical devices were not run.

## Historical self-review

28 October 2026. Author review of the implementation commit. Not an independent Technical Lead PASS.

## Checked then

- Amendment `97c4ad9a` was the tree before runtime edits. A, B1, C and D match the files actually changed.
- N12 readers were not edited. `chronologischeLaeufe` is only called.
- `kante` accepts one opaque value up to 200 characters. Outbound, return, unknown, and removed ids resolve to `nicht-verfuegbar` and are not replaced by another visit. A repeated A→B→A→B stage-id fixture makes both A→B rows non-selectable. Distinct stage ids with the same city name stay independently selectable.
- Readable invalid `kante` values stay in the URL, so a reload still has the reason. Malformed values are stripped and the explanation is held in component state until the next plan navigation or popstate. A fresh reload after that strip no longer has the malformed value. That matches the existing tag-hint limit for values that cannot be kept safely.
- Planned-day formatting was unit-tested for gaps, duplicates, and invalid dates.
- Booking copy says the user marked it booked. Duration copy says stored local-time difference, or that duration is not stored.
- No organizer CTA carries the selected stage or connection. “Alle Verbindungen öffnen” only switches to the existing mobility area and says the section is not carried over.
- Guest and account destructive handlers still call the same confirm and storage functions.
- Old chronology, editor, history, six-kind, no-day, and no-passive-request browser checks still run. Chip-strip assertions were replaced with run selection plus day selection.
- The scroll-restore tolerance moved from 24px to 48px because revealing the focused run shifted the restored window by about 35px in Chrome. The test still fails if the position returns to the top.
- Back-to-top source contract (`scrollVerhalten`, focus ring, `inert`, no `return null`) remains.

## Limits

- The screenshot harness is the plan, mode nav, and Back-to-top. It is not the full account header, so `Reiseoptionen` is not in those images.
- Ambiguous-edge and invalid-`kante` behavior is unit-tested, not clicked in the browser.
- Root 32px, not browser zoom. No physical device and no VoiceOver.
- Stage-duration editing that can grow an unassigned 22-day trip to 44 days is unchanged.
- #1068 and #1067 remain open.

## Correction review

R1 does not drop the 22-day reachability check; it moves it off the simultaneous chip count. R2 reads the existing edge status and does not choose a candidate when the status is unknown. R3 keeps the visible title in the accessible name. R5’s keyboard check is DOM focus and hit size, not a screen-reader pass. The DejaVu assertion was not edited.

## Verdict

Author considers the R1–R5 correction ready for a new independent exact-head review. Not FINAL PASS.
