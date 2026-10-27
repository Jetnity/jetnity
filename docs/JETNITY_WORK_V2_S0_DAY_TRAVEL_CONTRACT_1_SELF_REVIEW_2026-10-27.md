# V2-S0 Travel Days and Transfers Contract 1 — SELF-REVIEW

27 October 2026. Author review only. This is not a Technical Lead PASS.

## Identity checked

`run-info.originalModelName` was `grok-4.7-high-fast` before the plan comment and before the trace. Session `bc-9c414c5c-d492-49fc-b379-03654cc13242`. Display name was renamed to the logical writer name. The plan comment `6447196669` matches that identity.

## Scope checked

Diff is the five task-owned markdown files. The immutable task file is unchanged. No `app/`, `components/`, `lib/`, `supabase/`, `types/`, workflow, or indexing file is in the commit. `next-env.d.ts` was dirty in the workspace and was restored.

`docs/ACTIVE_WORK_STATUS.md` was intentionally left unchanged. The progress policy wants it updated, and the task allowlist plus four parallel lanes make that shared file a collision. The escalation is recorded in the handoff. It is not a hidden product edit.

## Claims checked against source

| Claim | Source |
| --- | --- |
| Unassigned 7 + requested 3 and 4 → operations +3 and +4 → 14 days | `manuellerEntwurf` on a synthetic graph. Original 7 ids null. Guest mode becomes `explicit`. Account in-memory mode stays `unassigned`. Payload has no mode key. |
| Stage dates move to the appended days | Same run: Bangkok `2026-06-08`–`2026-06-10`. `reindex` in `anwenden.ts`. |
| Same 3 and 4 when already assigned is a no-op | Synthetic run, message `Es gibt noch keine Änderung.` |
| Create 3+4 stays 7 | `createDayPositions`, positions `[1,1,1,2,2,2,2]`, mode `explicit`. Existing R109 tests also passed. |
| `reise_aendern` updates `stage_id` and does not set mode | `20260820130000_reise_aendern_places.sql` update of `trip_days` around the `stage_id` assignment; no `day_stage_assignment_mode` in that function. Create derivation is in `reise_anlegen`. |
| 22-day graph is valid and has 21 nights today when stage dates are null | `reiseLesen` ok, 22 days, mode `unassigned`. `unterkunftAbdeckung` → 21 and 0 covered. With the sample stage bounds → 18. |
| Travel items do not add days | Same 22-day graph, 3 items, 22 days. |

I did not query Production. I did not call the RPC. The Account block is a source conclusion: accepted writers do not send an allocation, and the RPC does not derive the mode.

## Tests

- Synthetic proof exit 0. Log retained outside the repo.
- Focused Node tests: 44 pass, 0 fail, 0 skip.
- Mounted UI: not run. No component changed, and private browser use is suspended.
- Full native CI locally: not run. I will not describe a green build I did not execute. GitHub CI on this head is the check that counts, and only after it finishes on this SHA.

## What I will not claim

- Independent Technical Lead acceptance.
- A fix of F01 or N12 in the product.
- Hosted persistence of either the 14-day edit or a 22-day Account trip.
- That Preview on the seed commit proves this head.
- Permission to merge, mark Ready, or open the RPC slice.

## Residual risk

A later agent can still call `reise_aendern` with a crafted graph and store `stage_id` while leaving `day_stage_assignment_mode` stale. The manual action refuses a replacement graph. The decision forbids using the raw RPC as the feature. The gate is still open.

## Stop

Scope is complete. Draft remains draft.
