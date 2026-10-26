# R108-A — Activities Search and Selection Lifecycle 1 — HANDOFF

Date: 26 October 2026.

Writer: **Jetnity Activities Search and Selection Lifecycle 1 — Cursor Generation 1**.  
Session: https://cursor.com/agents/bc-0c04bed6-dbf2-41ff-853c-2b5509df4be3  
Model: `grok-4.7-high-fast`. Not Auto. Same session as the rejected head.

## Where to resume

Read the immutable TASK V1, the updated PLAN, and `docs/JETNITY_ACTIVITIES_SEARCH_SELECTION_LIFECYCLE_1_STATUS_2026-10-26.md`. Do not edit the TASK.

Supplemental review head `0bd3ddd1b67e487aca1c96022f1d5753cd6ee10d` is not the review head. R2 delivery `05d6f934beefc5c174794905a775e8655257ecc3`, runtime `055055ac6b998693d30c9a8829aba8b7827c8ab2`, and rejected head `8224f7ce061ac2dea85dc781594f3493af732502` stay historical.

Runtime proof head: `79a109615857940812b05b5d99a1041b8d76750f`, tree `e2b3b3451acf9f760f23f833cce0fa64c1ece28c`.  
Main / merge-base, re-read before this handoff: `cdc5b47163c2f1bb272fb46ed6723e9522489e92`.  
That runtime head was **13 ahead / 0 behind**. This handoff is the next commit and is the review head. Re-read `git rev-parse HEAD`, `HEAD^{tree}`, the merge-base, and ahead/behind before review.

Draft PR: https://github.com/Jetnity/jetnity/pull/1025  
Tracking: https://github.com/Jetnity/jetnity/issues/1024

## Contract after the supplemental R2 correction

Search generation owns the visible result. The adoption operation is the existing writer snapshot for that day. Rounded ratings and a count that the snapshot omits do not open a second write. A count stored in the note does. Pending, callback-accepted, and unconfirmed operations stay closed across refresh and a guest item insertion that changes only ranking fields.

A direct audit action without a captured callable fails closed. A stale handler that was captured and invoked can still be rejected by the content check; that is a different result from a missing callable.

A settlement notice stays on its operation and does not become the status of a newer pending card. Full unmount and other tabs remain outside this register.

## Next action

Independent Technical-Lead review of the exact review head. Native CI and Preview must bind that head. Author self-review is not a PASS.

Do not mark Ready. Do not merge. Do not start a follow-up slice. Do not open a Viator adapter or a persistence readback from this handoff.
