# Trip Workspace Information Architecture 2 — Self-review

Stand: 30 September 2026
Status: **AUTHOR SELF-REVIEW / NOT A TECHNICAL-LEAD PASS**

R1 runtime head: `5456e3324d9802e8cd726cc92f1db9144802759f`
Reviewed and rejected head: `50f15bbf9de6af07a31e96f23b675d817fc952b4`
Session: https://cursor.com/agents/bc-d6c61c03-c9c0-45f4-8764-4fb9ff4b34bf
`originalModelName`: `grok-4.7-high-fast`

This is the implementing agent’s review. It does not replace an independent main-chat Technical-Lead code, IA, visual and interaction review.

## What holds

- The default page no longer mounts the day plan, safety, seasonal context or Reisevorbereitung under the dashboard.
- Reiseplan is one column at every required width. Organisieren no longer keeps the overview as its left half. `toteFlaeche` is false on the after flights steps and was true on the desktop baseline.
- The URL contract fails closed, keeps foreign parameters, and moves with `history.pushState` rather than a Next.js navigation. The after pass restored Back, Forward, reload and the invalid-query case with an empty network list.
- Explicit Flug suchen did not request a provider. Mode and domain changes did not either.
- Compact search identity remains under the measured return bar. There is one back control, sticky below 1024px and in-card from 1024px up.
- Escape still closes the domain. Edit and assistant still focus their fields and restore the invoking button. The assistant copy that it changes nothing remains in `TripWorkspaceUebersicht.tsx`.

## Limits a reviewer should see

- R1-F1 is reverted: `docs/ACTIVE_WORK_STATUS.md` matches `main@91ab08bb`. This slice does not write that pointer.
- R1-F2: the task body stays a non-interactive pending status until `useLayoutEffect` has read the URL. The first recorded `data-workspace-ansicht` on reload is the URL mode. The server HTML still cannot know the query, so it contains that pending status rather than a task. After hydration the correction happens before paint.
- Closing a domain pushes `?ansicht=organisieren` without `bereich`. Search-open state and the selected plan item are not in the URL. Back from a search therefore returns to the domain rail, which matches the accepted Escape behavior, and a reload does not reopen the search.
- Übersicht at 360×800 is still 2896px tall. The remaining height is the dashboard the task asked to keep: attention, essentials, coverage and preferences. Plan and preparation are no longer in that scroll.
- Keyboard Back to Übersicht left `scrollY` around 414 because the mode heading is scrolled under the sticky chrome. The heading received focus. The page does not jump to zero.
- This synthetic guest has no visible safety or seasonal foundation. `ReiseSicherheit` and `ReisezeitHinweise` return null in that case, on the baseline page and on Vorbereitung. Vorbereitung does show the existing readiness surface at full width. The components are mounted; they do not invent a safety or seasonal fact.
- Jetzt wichtig on this fixture is domain gaps only. The browser pass therefore opened Vorbereitung from the mode control after proving the flight-gap attention route. The official/readiness branch in `onAttention` sends `ziel === 'reise'` to Vorbereitung and was not separately clicked.
- The guest trip page has no Reisebegleiter control. Assistant open/close/focus was measured on `/ui-audit/trip-workspace` with the audit flag, the same `TripWorkspace`, and an intercepted assistant route.
- `MietwagenBereich` still uses its existing `sm:grid-cols-2`. It is outside this allowlist and was not edited.
- The after JSON for R1 is bound to `5456e332`. A later docs commit does not change the task-mode behavior. The tip may also drop an unused eslint comment in that layout effect; that comment does not render.

## Not claimed

Ready, merge, a Technical-Lead PASS, Production, a signed-in account browser pass, a physical device, or a follow-up slice. The handoff records the Actions, Auth and Preview read for `f3d52935` as an observation only. A later docs note does not inherit that gate.
