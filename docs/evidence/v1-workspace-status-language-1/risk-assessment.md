# Risk assessment — V1 Workspace Status Language 1

| Risk | Assessment |
| --- | --- |
| SL-R1 inventory claim | Closed in this correction. `belegt` display is inventory-neutral; same-place 0-item regression covers progress and gap labels. |
| SL-R2 mobility search promise | Closed in this correction. `belegt` next-step uses already-derived `sucheAnbietbar`. |
| Truth / unknown collapse | Low. Tests keep `unbestimmt` / `unknown` distinct from known-open “nicht ausgewählt”. |
| Commercial upgrade | Low. Booked / selected / open stay separate. No availability claim. |
| #520 date mismatch | Low. Signal, rank, action and title pattern unchanged; existing tests still pass. |
| Second coverage formatter | None added. Summaries still come from canonical helpers. |
| Navigation / search mount | Low. No new buttons. Keyboard open/back returned to overview in synthetic capture. |
| Sibling #528 overlap | None. Planner/Feld files not written. |
| Auth / DB / secrets | None touched. |
| Provider / model cost | None. Routes intercepted. |

Guardian was not required at dispatch. No material Truth/Auth risk discovered that would require a Guardian run from this writer.
