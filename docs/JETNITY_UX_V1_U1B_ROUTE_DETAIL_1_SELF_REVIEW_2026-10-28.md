# UX V1 U1-B Route and Detail 1 — SELF_REVIEW

28 October 2026. Author review of the R1 correction. It is not a Technical Lead PASS.

## Checked against R1

- Back from day 11 to the tag-free plan URL shows Tag 1, only `flight-out` among the compared items, and the remove control `day-1:flight-out`. The synthetic callback receives that same pair. Forward shows `transfer-11` and `stay-11` and not `flight-out`.
- The wide default remains `data-u1b-default-tag` and does not invent a URL selection.
- Route scroll is captured only while the route can be pointed at. Zur Route restores it within 24px in the mounted 390 case, including after an item and after the same row is opened again. A deleted day focuses the route and leaves `aria-current` empty.
- The 7 by 2 width matrix includes the route, the selected day, and the selected item. The item fix is inherited `word-break: break-word` on the owned slot, not `overflow-x` clipping and not an edit to `TripWorkspaceDetail`.
- Prior U1-B navigation, one search mount, N12 chronology, and U1-A2 sticky geometry stayed green on this tree.

## Still open for the Technical Lead

- True browser zoom 200% was not performed. Root 32px at the seven CSS widths was.
- Native App/Auth CI and the exact Preview for the correction head are not a review result until the PR comment records them. The green CI on `e8a0b496a80e0b984f27813802f1f6a66e5a1c11` does not cover this head.
- `word-break: break-word` is the legacy value that lets a min-content word wrap. It is inherited into the detail and the search slot. It does not change history or provider mounting. The mounted search probe still counted one mount.
