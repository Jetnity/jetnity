# Jetnity Lodging Coverage Truth 1 — SELF_REVIEW

**Cursor-Agent: Jetnity Lodging Coverage Truth 1 — Cursor Generation 1**

This is the author self-review. It is not a Technical-Lead PASS. A new head invalidates it.

## Acceptance

| Criterion | Author result |
|---|---|
| B01 Unknown coverage stays visible; no `0/N` or full-coverage heading overrides it | Met. Heading uses `zusammenfassung` when any stay status is `unknown`, including a fully dated stay plus an undated stay. |
| B02 Mixed stays do not say `N Nächte fehlen` | Met. Provisional copy is `N Nacht/Nächte noch nicht als fehlend bestimmbar`, with the existing unknown seal. Known gaps keep `Nacht fehlt` / `Nächte fehlen`. |
| B03 Stored booking controls the action | Met. Booked undated stay renders `Buchung korrigieren` and calls `(item.id, false)`. Unconfirmed calls `(item.id, true)`. |
| B04 `Gebucht` is independent of unknown dates | Met. The seal uses `istGebucht`. A booked provider stay with invalid or reversed dates, and no date-editor callback, still shows `Der Zeitraum fehlt oder ist unvollständig bzw. ungültig.` in its own row. The seal does not say the nights, a provider, or a payment are confirmed. |
| B05 Known, empty, partial, full, out-of-period, and absent-callback behavior | Met by the same rendered regression. Loading, error alert, kind gate, and date editor are unchanged. |
| B06 Real render and real click | Met. `renderToStaticMarkup` plus the existing isolated `onClick` harness. No source-string assertion of the component. |
| B07 No mutation of trips, dates, amounts, helpers, actions, schema, or types | Met. Diff is the panel, the new test, and these task docs. |
| B08 Old behavior fails; existing regressions stay green | Met. Final test file: 5 failed on the seed panel, 7 passed after the repair. Related existing tests passed unchanged. |

## Review notes

- The booking click reads `istGebucht` once per row, so the label and the boolean cannot diverge inside that render.
- A second booking click is still ignored while the first callback is in flight. The regression waits for that callback before clicking the other row.
- Every coverage-unknown stay shows `Der Zeitraum fehlt oder ist unvollständig bzw. ungültig.` in its own row. The date editor still shows that sentence for an editable manual stay. `zeitraumKurz` is unchanged and may still normalize an invalid day; the row sentence is the uncertainty.
- Traveller citizenship, residence, and documents do not affect this panel. None are collected.
- Global continuity files were left unchanged, as this batch requires.

## Not claimed

No Ready, merge, Production proof, hosted readback, provider truth, or device pass. CI and Preview for the pushed head are external gates.
