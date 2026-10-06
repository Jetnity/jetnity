# Trip Timeline Intelligence contract design 1 — Task

Date: 6 October 2026
Issue: #885
Repository: Jetnity/jetnity
Baseline: `main@fc2734ca60ae3c578fbcd414055fe983773d74d2`
Branch: `docs/trip-timeline-intelligence-contract-design-1`
Execution lane: Codex Desktop
Parallel-safe docs-only with #884/#886/#887.

## Objective

Design the deterministic intelligence layer that will sit on top of the Trip Timeline Core.

Do not implement it. Define contracts precise enough that after #884 merges the Technical Lead can dispatch one bounded implementation without guessing.

Target capabilities:
- temporal conflicts/overlaps;
- trustworthy buffers;
- missing transfers;
- geographic/route plausibility;
- safe schedule gaps/free-time semantics;
- “Als Nächstes”;
- concrete inline warnings and recommended user actions.

## Binding doctrine

Jetnity must never turn missing travel truth into confident guidance.

Distinguish at minimum:
- stored user truth;
- canonical Trip/Route facts;
- provider/official verified facts;
- code-owned policy;
- estimate;
- unknown;
- advisory suggestion.

## Required design decisions

Define:

1. **Input contract from Timeline Core**
   - immutable day/item identity;
   - local date/time semantics;
   - flexible/no-time items;
   - stage/location facts;
   - booking state;
   - optional end times;
   - no dependency on DOM layout.

2. **Time interval model**
   - exact local start/end only when actually known;
   - cross-midnight/date-line constraints;
   - no timezone conversion without timezone truth;
   - overlap states: proven conflict / possible conflict / no proven conflict / not evaluable.

3. **Buffer policy model**
   - distinguish code-owned product policy from external operational fact;
   - no magic universal airport/station buffer hidden in UI;
   - version/policy ID requirements for later implementation;
   - explain which categories could have Jetnity defaults and which require source/provider truth.

4. **Transfer/mobility model**
   - existing explicit transfer item vs inferred need;
   - origin/destination identity proof levels;
   - no city-to-airport guessing;
   - no distance/travel-time invention;
   - exact conditions for “Transfer fehlt” vs “Transfer noch nicht prüfbar”.

5. **Route plausibility**
   - what can be proven from existing place IDs/coordinates/route facts;
   - what requires a future map/routing provider;
   - fail-closed behavior when facts are incomplete.

6. **Gap/free-time semantics**
   - distinguish a raw schedule gap from actually free usable time;
   - subtract travel/buffer only when proven;
   - do not call a gap “frei” when transfer duration is unknown.

7. **Als Nächstes**
   - timezone/current-clock requirements;
   - future/past/current states;
   - no device-time assumption for a destination without timezone truth;
   - fallback when current-time semantics are unavailable.

8. **Conflict/action taxonomy**
   - stable IDs/severity;
   - warning copy principles;
   - recommended action object;
   - no automatic mutation/reordering.

9. **Change interaction**
   - how item edits, flight changes and stage changes invalidate/recompute intelligence;
   - deterministic recomputation, no stale cached truth.

10. **Cross-device UX contract**
    - inline timeline hints;
    - day summary;
    - avoid warning overload;
    - smartphone priority.

11. **Test/adversarial matrix**
    - exact examples for overlaps, unknown duration, date line, same-name cities, airport/city mismatch, flexible items, incomplete locations, stale external facts.

12. **Post-Core reconciliation**
    - because #884 runs in parallel, explicitly list which names/interfaces must be re-bound to the actual merged Core rather than assuming unpublished code.

## Required recommendation

End with the smallest safe implementation sequence after #884, preferably no more than 2–3 runtime slices.

## Allowed files

TASK immutable:
- `docs/TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_TASK_2026-10-06.md`

Create only:
- `docs/TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_2026-10-06.md`
- `docs/TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_REPORT_2026-10-06.md`
- `docs/TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_HANDOFF_2026-10-06.md`
- `docs/TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_SELF_REVIEW_2026-10-06.md`

## Non-scope

No runtime/product code.
No provider/API call or activation.
No DB/Supabase.
No map/weather/opening-hours implementation.
No Official Truth.
No global continuity edit.
No automatic follow-up.

## Delivery

Perform repository-grounded design review, commit + push, remain Draft.
Report exact head, merge-base/ahead/behind, changed files, TASK blob, findings, Codex session/model.

Classification:
- `TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_READY`
or
- `TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_NOT_READY`

STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.
