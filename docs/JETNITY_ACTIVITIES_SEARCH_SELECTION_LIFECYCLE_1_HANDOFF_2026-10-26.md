# R108-A — Activities Search and Selection Lifecycle 1 — HANDOFF

Date: 26 October 2026.

Writer: **Jetnity Activities Search and Selection Lifecycle 1 — Cursor Generation 1**.  
Session: https://cursor.com/agents/bc-0c04bed6-dbf2-41ff-853c-2b5509df4be3  
Model: `grok-4.7-high-fast`. Not Auto.

## Where to resume

Read the immutable TASK V1, the PLAN, and `docs/JETNITY_ACTIVITIES_SEARCH_SELECTION_LIFECYCLE_1_STATUS_2026-10-26.md`. Do not edit the TASK.

Runtime proof head: `728235723a4ceb606e6a610765f43fa4254e10d5`, tree `909c1ba9099caadd986061552e93c497eeb5b87b`.  
Main / merge-base: `cdc5b47163c2f1bb272fb46ed6723e9522489e92`.  
That head was **3 ahead / 0 behind**. This handoff is the next commit and is the review head. Re-read `git rev-parse HEAD`, `HEAD^{tree}`, the merge-base, and ahead/behind before review. A new head invalidates the gates above.

Draft PR: https://github.com/Jetnity/jetnity/pull/1025  
Tracking: https://github.com/Jetnity/jetnity/issues/1024

## Owned paths

- `lib/activities/suchlebenszyklus.ts` and `lib/activities/suchlebenszyklus.test.ts`
- `lib/activities/client-anfrage.ts` and `lib/activities/client-anfrage.test.ts`
- `components/trips/AktivitaetenBereich.tsx`
- `components/trips/AktivitaetKarte.tsx`
- `components/trips/ActivitiesAuditClient.tsx`
- `scripts/activities-ui-audit.mjs`
- `docs/ACTIVITIES.md` (this workflow only)
- `ROADMAP.md` (one current-slice pointer)
- `docs/evidence/activities-search-selection-lifecycle-1/`
- this STATUS, HANDOFF, SELF_REVIEW, and the existing PLAN

TripWorkspace, search route, schema, domain, factory, and proof were not edited.

## Next action

Independent Technical-Lead review of the exact review head. Native CI on that head is still required. Author self-review is not a PASS.

Do not mark Ready. Do not merge. Do not start a follow-up slice. Do not open a Viator adapter or a persistence readback from this handoff. Provider clarification stays on #1023.
