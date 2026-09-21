# V1 Destination Essentials Density 1 — Handoff

Stand: 21. September 2026  
For: ChatGPT / Technical Lead. Head `874674cf` is invalidated by DE-R1.

## What to open

1. Draft PR #522 / issue #521  
2. TL CHANGES REQUIRED DE-R1 on `874674cf` plus this same-session correction  
3. STATUS / SELF_REVIEW with this prefix  
4. Existing evidence `docs/evidence/v1-destination-essentials-density-1/` — **not recaptured**; fixtures remain equivalent after DE-R1  
5. New render cases in `lib/trips/destination-essentials-density-1.test.ts`: aggregate-only, stage-only, both-positive `hatHinweise` contradictions

## Look-first

| Question | Evidence |
| --- | --- |
| Consistent empty still compact | empty-path tests; harness empty-three after images still apply |
| Positive flag veto | three new full-display tests; compact path requires `hatHinweise === false` at aggregate and every stage |
| Domain/detail/link checks kept | existing contradiction tests still require `keine_evidence` + empty details/links + `unvollstaendig === false` |
| Mixed unchanged | mixed-after screenshot + mixed render tests |
| Main not integrated | #524 is the next TL integration slot |

## Source vs evidence

| Layer | SHA | Role |
| --- | --- | --- |
| Assigned baseline | `1103407b` | not integrated into this correction |
| Prior freeze | `874674cf` | invalidated by DE-R1 |
| DE-R1 source | `fb6f58e7` | component + tests |
| Screenshot product tree | `6f8cd923` | unchanged empty/mixed fixtures; no recapture |

## Stop

**STOP FOR INDEPENDENT TECHNICAL-LEAD CODE + VISUAL/INTERACTION REVIEW.**  
No Ready, no PR merge, no follow-up, no main integration by Cursor.
