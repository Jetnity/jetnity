# R108-A — Activities Search and Selection Lifecycle 1 — HANDOFF

Date: 26 October 2026.

Writer: **Jetnity Activities Search and Selection Lifecycle 1 — Cursor Generation 1**.  
Session: https://cursor.com/agents/bc-0c04bed6-dbf2-41ff-853c-2b5509df4be3  
Model: `grok-4.7-high-fast`. Not Auto. Same session as the rejected head.

## Where to resume

Read the immutable TASK V1, the updated PLAN, and `docs/JETNITY_ACTIVITIES_SEARCH_SELECTION_LIFECYCLE_1_STATUS_2026-10-26.md`. Do not edit the TASK.

Rejected head: `8224f7ce061ac2dea85dc781594f3493af732502`. Intermediate runtime `055055ac6b998693d30c9a8829aba8b7827c8ab2` is not accepted. Do not review those heads again.

Runtime proof head: `8adbb10c46acf6d7ca811d721e188026c5203a31`, tree `4d804ff1be4b947427522a2ca917a0d4116ada61`.  
Main / merge-base: `cdc5b47163c2f1bb272fb46ed6723e9522489e92`.  
That head was **8 ahead / 0 behind**. This handoff is the next commit and is the review head. Re-read `git rev-parse HEAD`, `HEAD^{tree}`, the merge-base, and ahead/behind before review.

Draft PR: https://github.com/Jetnity/jetnity/pull/1025  
Tracking: https://github.com/Jetnity/jetnity/issues/1024

## Contract after the supplemental R1

Search generation owns the visible result, including ranking fields. The adoption operation follows the writer snapshot and does not include labels, reasons, or konflikt. Pending, callback-accepted, and unconfirmed operations stay closed across refresh and a guest item/window insertion that changes only that ranking. Unconfirmed operations stay closed until “Erneut anbieten”, which does not itself write. Full unmount and other tabs remain outside this register.

## Next action

Independent Technical-Lead review of the exact review head. Native CI and Preview must bind that head. Author self-review is not a PASS.

Do not mark Ready. Do not merge. Do not start a follow-up slice. Do not open a Viator adapter or a persistence readback from this handoff.
