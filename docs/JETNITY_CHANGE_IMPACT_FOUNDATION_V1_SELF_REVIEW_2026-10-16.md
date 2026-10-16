# Change Impact Foundation V1 — author self-review

Author review only; **not independent TL approval**. Existing Draft #957 / Issue #956. Immutable task blob `351254986203c8a6fe3c4e7f6737653b3a76cfe4`.

## Requirement evidence

| Requirement | Evidence in new namespace |
| --- | --- |
| D1 bounded pure entry | `input.ts`, `contract.ts`, `index.ts`; original schema; Node proxy admission; identity/revision checks |
| D2 exact stored differences | `changes.ts`; explicit field inventory and stable refs; original `reiseDiff` redacted summaries; no duplicate unplanned inventory |
| D3 grounded relationships | Original-snapshot day/stage/item IDs, parent-day stage and meaningful original time pairs; aggregate per target |
| D4 original evaluation | `evaluations.ts` calls original four evaluators; same-level comparison; unknown/failure explicit |
| D5 limits/purity | Shared two-snapshot budgets, output/omitted bounds, frozen/permuted/TZ/LANG tests and transitive import inspection |
| D6 T01–T12 | `acceptance.test.ts` and `security.test.ts`, synthetic fixtures only |

| Test group | Assertion / important qualification |
| --- | --- |
| T01 | Identical snapshots have no claims; complete comparison is not trip readiness |
| T02 | Zürich–Panama–Costa Rica saved flight shift; original dates/placement, exact day/stage relations; separate day/stage addition/removal/reassignment |
| T03 | Original possible conflict stays possible; missing clock/qualified location remains unevaluable; unavailable baseline cannot establish new proven conflict |
| T04 | ORIGINAL qualified kernel proven→no_proven projection, lost authority→unknown; actual Trip adapter never promotes civil evidence; subevent changes unknown |
| T05 | Original lodging gap values, unknown booking/stay and missing stage dates stay unknown |
| T06 | Actual original flight/mobility open/selected/user-booked/unknown; `covered_by_flight` private type-contract preservation only, not a new reachable public outcome |
| T07 | Shared Guest/Account Trip contract; stable distinct IDs; unplanned once; cross-trip blocks |
| T08 | Same-revision edits unverified; reverse/missing revision or IDs blocked |
| T09 | Oversize/malformed/cyclic/getter/proxy/revoked proxy/prototype/symbol/hidden fields/depth/text/duplicate/inconsistent-stage data; expanded itinerary/night work guards |
| T10 | Deep freeze/no mutation, repeat, graph permutation, isolated timezone/language, visible output/ref omissions |
| T11 | Exact relations and unrelated counterexamples; aggregate changes; canonical pair links across stages, unknown pairs do not; stage inheritance through persisted day |
| T12 | AST-based transitive runtime import closure, no application caller, no I/O/model dependency, provider still null, unchanged TASK blob; raw booking/price/URL/title not emitted |

## Review findings addressed

- Canonical schema can normalize/strip values: provided noncanonical values are rejected instead of concealed as source truth.
- Stage-order ties and item/day stage contradictions could make adapters disagree: admission rejects them; canonical cloned graphs are stably sorted.
- An item may have `stageId=null` while its persisted day has a stage: exact parent-day relationship is included and separately tested.
- Subevent indices change within a stored item: no temporal cross-snapshot matching by local event ID; ambiguous rows unknown.
- Original lodging enumerates dates: input guard bounds span/work first; no replacement coverage logic.
- Evaluator failures and output caps: visible incomplete state, atomic per-domain failure, bounded omitted counts; no hidden partial PASS.
- Output privacy: redacted summaries and explicit direct-field projections; no raw private-value logging. Identity/date references are internal evidence, not a public payload or ownership check.

No known unaddressed implementation defect found in the allowed scope. The following are deliberate limitations/open gates, not hidden passes: Node-only entry; conservative temporal ambiguity; unreachable public proven-conflict and covered-by-flight outcomes in current canonical adapters; local native PG unavailable; local Auth credentials absent; exact published-head CI/Auth/Preview and independent TL review required. This foundation does not make incomplete canonical data complete and does not implement full Guardian/Recovery/What-if.

All original files, immutable task, #955 paths, package/lock, workflows, runtime imports, auth/RLS and production configuration remain outside the write set. No independent reviewer or subagent was used. No Ready/Merge decision is made here.
