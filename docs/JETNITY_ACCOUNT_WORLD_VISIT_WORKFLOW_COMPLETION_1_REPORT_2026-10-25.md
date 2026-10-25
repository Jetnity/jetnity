# R107-W — Account World Visit Workflow Completion 1 — REPORT

Date: 2026-10-25

Author: Jetnity Account World Visit Workflow Completion 1 — Cursor Generation 1. Runtime `grok-4.7-high-fast`. Session `bc-af293d35-d2af-43d8-b193-9fbaab7c351b`.

This report describes the candidate re-review R2 correction. It is not Technical-Lead acceptance. The R1 retry and detached-recovery corrections remain in force.

## Keyboard edit cancellation

Closing an editor with Escape or with **Abbrechen** now returns focus to that event's Bearbeiten button. The move runs only when focus is still on the document body or inside the surface being closed, and not when the focused draft epoch is newer than that editor. Search, the open create draft, and another visit's Bearbeiten button keep the focus they already have. Settlement text still does not take focus.

The mounted case uses real key and pointer events: Enter on Bearbeiten opens the editor, a pointer click focuses the year field, Escape returns to that Bearbeiten button and sends nothing. The same path with a pointer click on **Abbrechen** does the same. Escape while search or the create draft is focused leaves the editor open and leaves focus there. Opening the other visit's editor leaves focus on that opener. Enter in its year field sends one `aendern` for that event.

`form.requestSubmit()` remains the same-turn double-submit admission. The receipt names it as such. It is not a keyboard Enter pair.

## Screenshots and the lint warning

The previous viewport crops of the dense editor and revoke states showed the map. In this Chromium, `window.scrollTop` clamps below the visit controls when the root font is 32px, so a viewport crop cannot be scrolled onto those controls. The new PNGs are element captures of the editor, the revoke confirmation, the failed-read recovery panel, and the removed-row revoke recovery panel. Each shot records `capture: "element"`, the viewport that set the layout, root font 32px, the state, the target selector, the section/document overflow, the CSS hash, and the tested source hashes.

Section and document overflow stayed 0 at 320, 390, 768, and 1440. That matches the independent measurement. It is not a new overflow claim.

`scripts/account-world-visit-workflow-completion-1/run.mjs` no longer imports unused `existsSync`. That import was the lane warning inside the previous 182. The observed lint total on this correction is **181 warnings and 0 errors**. A search of that lint log shows no warning in this lane's files. The earlier sentence that none of the 182 were in this lane was inaccurate.

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
| Mounted harness | 15 pass, 0 fail, exit 0, bound to `31dcf14a` |

Node `v22.23.4`. Playwright `1.55.0`. Browser `140.0.7339.16`. This is not the reviewer's Node 24 run.

## Limits

- This is not hosted Account proof, not SQL or RLS proof, not a full Next.js router proof, and not a device proof.
- A refresh request is not causal readback. A changed stamp is not a newer database snapshot. The guard is not exactly-once.
- The frozen writers have no client version token. A full unmount still drops the ledger.
- Element screenshots are not viewport crops. The scroll clamp above is a harness observation at 32px root font, not a product change.
- No Production DB, Auth, AAL, RLS, secret, provider, payment, legal, or launch action was taken.

## Cost and security

No new dependency, provider, paid call, route, schema, or RLS change. Traveller credentials are unchanged.
