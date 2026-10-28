# UX V1 U1-B Route and Detail 1 — PLAN

Date: 28 October 2026. Tracking #1067. Draft #1080.

Accepted basis: immutable TASK blob `78d540737fd6b297ef883a369eb109f07b9bd094`, seed `751123c28da452ae7e20264ec3a47a30f1e0e483`, main `b7cadb7688f7bac84df0ea33a7b9ec1f3a9b7c48`. PLAN comment 6471053671 is superseded by addendum 6471224955 and the Technical Lead acceptance conditions on #1080. This file records that contract before product code.

Session: Jetnity UX V1 Route and Detail 1 — Cursor Generation 1, `bc-767a1802-d279-4557-8dbf-4bd81f95f2ba`, `originalModelName` `grok-4.7-high-fast`. Mode NORMAL. No Ready, no merge, no follow-up slice.

## Binding implementation conditions

1. **Zur Route** is the one primary return control on both the day detail and the item detail. It calls UI-only `routeZeigen`: the canonical `tag`/`punkt` URL and the history stack stay, the route is revealed and focused, and the selected item stays selected. On `neben` the detail remains beside the route. On `schmal` the route is alone. Escape and browser Back/Forward keep the existing `schliessen` / parent-history behavior. A click on a valid day or item clears `routeBetont` even when the URL does not change, so the same row can open again. A route that still shows `tag` or `punkt` is still a route. A no-day item opened from that screen takes the actual current URL as `elternUrl`, not an assumed tag-free parent.

2. **Column minima are hard.** Route 20rem, detail 28rem, gap 1.5rem, sum 49.5rem. Initial mode: `neben` at `clientWidth >= 49.5rem`, otherwise `schmal`. After a `schmal` measurement, re-entry requires `>= 50.5rem`. Leaving `neben` happens as soon as `clientWidth < 49.5rem`. The decision reads the content box and the root font size only. It does not read `scrollWidth`.

3. **One search/provider parent.** `data-workspace-active-domain` stays a direct child of `data-workspace-split` for the life of the workspace. Plan does not receive those nodes as children. Tab changes update the visible mode and the canonical URL immediately. A hidden Plan mount may keep an open editor only while the existing editor lifecycle says work is in flight or the form is open. No new persistence.

4. **Notices are scoped to one invalidation context.** A dead raw id sets the notice. The canonical replace and a later graph render of that same cleaned URL keep it. Browser Back/Forward onto a different valid selection clears it. Forward back onto the cleaned entry of the same context may restore it from that history entry. A new `reise.id` clears it. A removed selected day is never written as `days[0]`.

5. One Plan mount owns the day editor. One detail body is visible. Focus that lands inside `[hidden]` or `[inert]` is dropped. Sticky mode navigation, four modes, N12 chronology, unrelated query/hash, and the explicit-search gate stay. No read-only helper edit and no legacy-test weakening.

## DOM

`TripWorkspace` owns history, `routeBetont`, the notice, the return callback, and the stable provider slot. `TripWorkspacePlan` owns `data-u1b-route` and `data-u1b-day`. When production measurement says `neben`, the split container is the grid and the plan root is `display: contents`, so the route and the day are columns without moving the provider slot. The item body stays in the provider slot, grid column 2, and the day body is hidden and inert while that item is the visible detail. Standalone Plan callers keep `steuerung="stapel-kompatibel"` and the previous stacked chronology.

## Writes

`components/trips/TripWorkspace.tsx`, `components/trips/TripWorkspacePlan.tsx`, the `'Zur Route'` label union in `lib/trips/detail.ts`, `lib/trips/ux-u1b-route-detail-1/**`, `scripts/ux-u1b-route-detail-1/**` only if a script harness is required, and the STATUS/REPORT/SELF_REVIEW/HANDOFF siblings of this file. `lib/trips/workspace-mode.ts` is not edited. The local history writer in `TripWorkspace.tsx` may store the UI notice on the existing `jetnityWorkspace` entry and may `replaceState` the same URL when an explicit selection clears that notice. It does not push on popstate, does not call `history.go`, and does not drop `elternUrl`.

## R1 implementation corrections

Independent R1 on `e8a0b496a80e0b984f27813802f1f6a66e5a1c11` required three presentation corrections. They do not change the history, width, or provider contract above.

1. The wide unlabeled default and a later tag-free history entry use one effective day for the counter, the grouped items, the editor, the delete target, and `TripIntegratedDay`. `timelineAbleiten(reise, ohneTag, aktiverTag)` stays for the source contract. When that tag is not the effective day, a second read-only derivation supplies the body. A missing URL tag does not become an `aria-current` selection.

2. The route scroll snapshot is taken only from a pointer interaction inside a visible route. Opening a day or item, stepping next/previous, and scrolling the detail do not replace it. Zur Route restores that snapshot after focus, with `preventScroll` on the competing detail-close focus.

3. Long item text that sets `overflow-wrap: break-word` still has a min-content size. The owned detail slot inherits `word-break: break-word` so those words wrap inside the viewport. Text is not clipped and `TripWorkspaceDetail` / `TripIntegratedDay` stay unread.

4. An open plan editor stays mounted on the day it was opened for. Leaving the plan, Zur Route, and a width change do not unmount it, retarget its write, or drop a deferred error. A different canonical day still closes it.

5. After a wide/narrow change, Zur Route reveals the selected day chip inside its horizontal strip. A missing chip focuses the route and does not select day 1. Window scroll restoration from a visible route interaction stays.

6. A new form uses the displayed effective day. An already open form keeps that day through a hidden tab, Zur Route, and reflow. It is not reset when `aktiverTag` and the displayed day diverge, and it is not closed merely because the canonical tag is absent. A different canonical day still closes it.

7. Zur Route always focuses a visible route target. Scroll restoration is optional and runs only when a visible route interaction, including the keyboard, captured one. The standalone day counter keeps `whitespace-nowrap`. The measured counter and the date line wrap.
