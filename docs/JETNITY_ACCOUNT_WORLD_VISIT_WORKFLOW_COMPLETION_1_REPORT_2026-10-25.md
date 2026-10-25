# R107-W — Account World Visit Workflow Completion 1 — REPORT

Date: 2026-10-25

Author: Jetnity Account World Visit Workflow Completion 1 — Cursor Generation 1. Runtime `grok-4.7-high-fast`. Session `bc-af293d35-d2af-43d8-b193-9fbaab7c351b`.

This report describes the R2 layout addendum together with the already delivered R2 focus, keyboard, screenshot, and lint corrections. It is not Technical-Lead acceptance.

## Card containment

`AccountBesuchFormular` used `sm:flex-row` for every footer. Inside a two- or three-column card, at a 32px root font, **Abbrechen** extended 200.58px past the card at 768px and 107.25px past it at 1440px. The next card painted over the label. Section and document overflow stayed 0 because the spill stayed inside the wider list.

The editor passes `zeitNebeneinander={false}`. That footer now stays a column. Both buttons are full width of the form, their labels wrap, and nothing sets `overflow: hidden`. The create form still uses a row from the small breakpoint upward. Its single button stays content-sized there and full width below that breakpoint, so the label remains inside the form.

The mounted check opens an editor on the first card of the dense list, with the next card present. At 320, 390, 768, and 1440, root font 32px, each editor button's rectangle is inside its form and inside its `article`, the label's scroll size fits the button, and no neighboring card intersects the button. The create button is inside the create form. The editor footer computes to `column` at all four widths. The create footer computes to `column` below 640px and `row` at 768 and 1440. The right edge of both editor buttons is 66px inside the card at 768 and at 1440.

## Focus, keyboard, and screenshots

Closing an editor with Escape or with **Abbrechen** returns focus to that event's Bearbeiten button. The move runs only when focus is still on the document body or inside the surface being closed, and not when the focused draft epoch is newer than that editor. Search, the open create draft, and another visit's Bearbeiten button keep the focus they already have. Settlement text still does not take focus.

The mounted case uses real key and pointer events. `form.requestSubmit()` remains the same-turn double-submit admission and is named as such.

The editor PNGs are element captures of the card that contains the open editor, at 320, 390, 768, and 1440. Revoke and recovery shots remain element captures at 320 and 1440. Each shot records viewport, root font 32px, state, target, overflow, CSS hash, and tested source hashes. Section overflow stayed 0 at all four widths. In this Chromium, `scrollTop` still clamps below the list at 32px root font, so these are not viewport crops.

`run.mjs` does not import `existsSync`. Project lint on this correction is **181 warnings and 0 errors**. A search of that lint log shows no warning in this lane's files.

## Checks on this correction

| Check | Result |
| --- | --- |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, 181 warnings, 0 errors. None in this lane's files. |
| `check:dead` | exit 0, 0 unreferenced files |
| `check:exports` | exit 0 |
| `check:deps` | exit 0 |
| `check:api-schutz` | exit 0 |
| `check:schema-bezug` | exit 0. Existing LOCAL/UNAPPLIED RPC notes are unchanged and outside this lane. |
| `npm run build` | exit 0 |
| `npm test` | exit 1. 7178 tests, 7162 pass, 11 fail, 5 skipped. The 11 failures are local PostgreSQL 16 proofs (`initdb` ENOENT, `local_proof_connection_override_forbidden`, or `NOT_VERIFIED`). No visit test failed. |
| Focused visit/map/home regressions | 62 pass, 0 fail |
| Mounted harness | 15 pass, 0 fail, exit 0, bound to `e4b4c0bb` |

Node `v22.23.4`. Playwright `1.55.0`. Browser `140.0.7339.16`. This is not the reviewer's Node 24 run.

## Limits

- This is not hosted Account proof, not SQL or RLS proof, not a full Next.js router proof, and not a device proof.
- A refresh request is not causal readback. A changed stamp is not a newer database snapshot. The guard is not exactly-once.
- The frozen writers have no client version token. A full unmount still drops the ledger.
- Element screenshots are not viewport crops. The scroll clamp above is a harness observation at 32px root font, not a product change.
- No Production DB, Auth, AAL, RLS, secret, provider, payment, legal, or launch action was taken.

## Cost and security

No new dependency, provider, paid call, route, schema, or RLS change. Traveller credentials are unchanged.
