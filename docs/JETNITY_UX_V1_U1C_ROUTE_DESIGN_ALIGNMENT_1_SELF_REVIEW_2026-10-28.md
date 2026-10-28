# Jetnity UX V1 U1-C Route Design Alignment 1 — SELF REVIEW

28 October 2026. Author review of the implementation commit. Not an independent Technical Lead PASS.

## Checked

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

## Verdict

Author considers the slice ready for independent exact-head review. Not FINAL PASS.
