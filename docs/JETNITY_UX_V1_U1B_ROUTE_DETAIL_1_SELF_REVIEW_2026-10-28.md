# UX V1 U1-B Route and Detail 1 — SELF_REVIEW

28 October 2026. Author review of the R1 correction. It is not a Technical Lead PASS.

## Checked against R1

- Back from day 11 to the tag-free plan URL shows Tag 1, only `flight-out` among the compared items, and the remove control `day-1:flight-out`. The synthetic callback receives that same pair. Forward shows `transfer-11` and `stay-11` and not `flight-out`.
- The wide default remains `data-u1b-default-tag` and does not invent a URL selection.
- Route scroll is captured only while the route can be pointed at. Zur Route restores it within 24px in the mounted 390 case, including after an item and after the same row is opened again. A deleted day focuses the route and leaves `aria-current` empty.
- The 7 by 2 width matrix includes the route, the selected day, and the selected item. The item fix is inherited `word-break: break-word` on the owned slot, not `overflow-x` clipping and not an edit to `TripWorkspaceDetail`.
- Prior U1-B navigation, one search mount, N12 chronology, and U1-A2 sticky geometry stayed green on this tree.

## R2

- Übersicht during a deferred day-11 save keeps one busy form with the title and date. After the failure, Reiseplan shows that form and the error. The write list is only `day-11:Lokaler Testentwurf`.
- Back to the tag-free wide plan, then Punkt hinzufügen, writes `day-1:Tag eins Entwurf` and does not add a tag to the URL.
- Keyboard Enter, a direct `tag=day-11` load, and wide Zur Route focus the visible day-11 control. The narrow chip rectangle is inside its strip and the viewport. Deleted day 10 still focuses the route.
- The measured counter does not carry both nowrap and normal white-space. The standalone counter keeps the legacy nowrap string. N12 at 320/root 32 does not overflow.

## R1.4 and R1.2b

- A deferred create on day 11 keeps one form, the title `Lokaler Testentwurf`, the date `2026-06-11`, and a single `day-11` write through Zur Route, 1440/390, Übersicht, and the return to Reiseplan. The synthetic error is on that form.
- Day 10 at 1440, then 390 and Zur Route, focuses a chip whose rectangle is inside the horizontal strip and the viewport. Widening focuses the visible day-10 control. Deleting day 10 focuses the route and does not mark day 1.
- The editor host does not retarget a write when the canonical tag is absent. A different canonical day still closes the form.

## Still open for the Technical Lead

- True browser zoom 200% was not performed. Root 32px at the seven CSS widths was.
- Native App/Auth CI and the exact Preview for the correction head are not a review result until the PR comment records them. The green CI on `e8a0b496a80e0b984f27813802f1f6a66e5a1c11` does not cover this head.
- `word-break: break-word` is the legacy value that lets a min-content word wrap. It is inherited into the detail and the search slot. It does not change history or provider mounting. The mounted search probe still counted one mount.
