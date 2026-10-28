# UX V1 U1-B Route and Detail 1 — SELF_REVIEW

28 October 2026. This is the author review. It is not a Technical Lead PASS.

## Checked

- One history meaning at both widths. `Zur Route` is UI-only for day and item.
- Re-clicking the current row clears `routeBetont` when the URL does not change.
- A no-day item opened from a route that still has `tag` and `punkt` records that URL as `elternUrl`.
- Hard minima: leave below 49.5rem, re-enter at 50.5rem, initial enter at 49.5rem. No `scrollWidth` input.
- 1440 at root 16 measured route ≥ 20rem, detail ≥ 28rem, gap ≥ 1.5rem. 768 and 1440 at root 32 stayed `schmal`.
- Provider parent did not move. Mount count stayed 1.
- Tab change to Übersicht updates the URL immediately while an editor is open. The plan tree is hidden, not left on screen.
- Invalid item survives canonical replace, reload, graph bump, and Forward after Back to day 1. A new trip id clears it. A removed day has no `aria-current`. Writes array stayed empty.
- Focus inside `[hidden]`/`[inert]` is blurred. N12 and U1-A2 suites stayed green without edits.

## Open for the Technical Lead

- True browser zoom 200% was not performed. Root 32px at 1440 CSS px was. CDP page scale was not used as zoom.
- The desktop day raster and the phone chip both carry `aria-current` for the same day. One is `display: none` below the `md` breakpoint. That preserves the legacy source strings.
- Standalone Plan stays `stapel-kompatibel`, so the N12 harness still shows the counter and the day list together.
- Native CI and Preview on this head are not yet a review result.
