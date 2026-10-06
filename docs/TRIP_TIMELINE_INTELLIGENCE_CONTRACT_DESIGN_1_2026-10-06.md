# Trip Timeline Intelligence contract design 1

6 October 2026 · Issue #885 · Draft PR #889 · **DESIGN ONLY / NO RUNTIME**

Binding [TASK](TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_TASK_2026-10-06.md), immutable blob `f10ba41bcb0847737e8100c9655e87f81297da0e`. Source baseline: `main@fc2734ca60ae3c578fbcd414055fe983773d74d2`. All contracts below are proposed future contracts, not existing exported interfaces, deployed behavior or authorization to implement. The [report](TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_REPORT_2026-10-06.md) records reconstruction and evidence limits; the [handoff](TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_HANDOFF_2026-10-06.md) binds the future Core reconciliation.

## 1. Product decision and ownership

Jetnity should turn the saved travel plan into a small number of explainable decisions: which appointments overlap, which connection needs attention, which information is missing and what the traveller can do next. The [Product Differentiation Doctrine](JETNITY_PRODUCT_DIFFERENTIATION_DOCTRINE_2026-08-30.md) is served by connecting existing Trip, Route, booking and readiness facts. More warnings, a new planner or a general assistant are not the objective.

The proposed layer is a pure, deterministic read projection. It must neither mutate/reorder the Trip nor start searches, providers, network calls, database work, Official Truth evaluation or automatic follow-up. Recommendations open an existing, explicitly selected user workflow. They never execute its write or search as a side effect of evaluation, rendering or navigation.

Issue #884 / PR #888 owns Timeline Core. Issue #886 / PR #890 owns Connected Day integration design; #887 / #891 owns a disjoint provenance slice. Their unpublished implementations are not inputs. Names in this document are conceptual until §13 is completed against the **merged** Core. This document does not change current Attention, Readiness, activity ranking or Route contracts.

## 2. Current repository facts and reuse limits

All source paths in this section were read at the baseline above; branch seed `0c4b3f984cbd32f1f0fe3c96035c46f6f6281827` changes only the TASK.

| Existing seam | What it actually supplies | Binding consequence for this design |
| --- | --- | --- |
| `types/trips.ts`: `Trip`, `TripDay`, `TripStage`, `TripItem` | IDs, revision, day/stage association, optional local dates/clocks, booking source, mobility endpoints, optional flight itinerary; no timezone field on these domain objects | Preserve IDs and nulls. Do not invent timezone, activity venue, duration or traveller participation. |
| `lib/trips/timeline.ts`: `timelineAbleiten` | Stages by position, days by dayIndex, selected day, unplanned items; no Intelligence result | Reuse graph identity/selection. DOM order, array adjacency and daypart headings are not physical chronology. |
| `lib/trips/day-stage-assignment.ts` and `day-stage-truth-contract.test.ts` | Explicit/single-destination/unassigned/historical legacy modes | A display day/stage assignment cannot become proof of physical item location or timezone. |
| `lib/route/domain.ts`, `ableitung.ts`, `chronologie.ts`, `verbindung.ts` | `route-v2`, structured itinerary, source item IDs, canonical topology, same-airport local connection arithmetic; `chronologieBewiesen` is not an elapsed-time guarantee | Reuse canonical Route facts and their proof boundary. Do not redo topology in UI. No UTC or travel duration follows from that flag. |
| `lib/trips/flug-manuell.ts`: `manuelleFlugSummaryProjizieren` | Exact local itinerary values retained; legacy end summary may be null for earlier arrival dates/clocks | Use itinerary boundaries for flights. Never reconstruct an end from the legacy summary or reject a Date-Line trip by local string order. |
| `lib/trips/flug-abdeckung.ts` after #877 | Directed route proof plus date, unique candidate and unique section; airport ID equality or canonical city+known-country matching in its own scope | Coverage is not airport access, item venue equality, transfer duration or feasible connection proof. Do not widen its city proof to a terminal. |
| `lib/mobility/kanten.ts`: `mobilitaetsAbdeckung` | Stage connections, saved transfers, unknown handling, canonical stage-position sorting; identity can fall back to normalized names; local times are parsed with a synthetic `Z` in `minutenZwischen` | Consume original evidence, not `open/selected/booked` or `durationMinutes` as proof certificates. A stricter adapter must refuse name-only endpoint proof and zoneless elapsed minutes. Do not change this module in this slice. |
| `lib/activities/konflikt.ts`, `tageskontext.ts` | Current `ueberschneidung/frei/unbekannt` for complete same-day local windows; date fallback; no midnight/timezone/travel calculation | Existing `frei` must not map to Intelligence free time or a universal no-conflict result. Future migration needs explicit tests; no silent public-contract replacement. |
| `lib/trips/attention.ts`, `attention-presentation.ts` | Stable domain signals, three severity levels, limit 3, lossless grouping, four distinct empty states | Add future adapter only after review; preserve incomplete evaluation, group members and canonical priority. Never infer clean from an empty list. |
| `lib/readiness/domain.ts`, `status.ts`, `fingerprint.ts`, `workspace-presentation.ts` | User progress separate from official result; context freshness and current/stale/not-applicable | Intelligence does not alter preparation, booking confirmation, official sufficiency or readiness fingerprints. Its own completeness is separate. |
| `lib/trips/detail.ts`, `cross-device-interaction-1.ts`, workspace components | Existing item/day/domain targeting, contextual return and stale/deleted selection handling | Rebind actions to these reviewed navigation paths; unsupported targets must be disabled rather than fabricated. |

The current [integrated audit](TRIP_WORKSPACE_INTEGRATED_ACCEPTANCE_AUDIT_1_2026-10-06.md) is historical evidence at an older SHA. Baseline includes #877 coverage repair, #878 direct schedule readback and #879 flight validation recovery. It is incorrect to repeat audit F-01/F-03/F-04 as unchanged baseline defects. F-02 focus after reclassification, F-05 raw accessibility state tokens, V-01 stale audit selector and physical-device/Account-E2E gaps remain review context; this design neither fixes nor independently re-tests them.

## 3. Evidence and input contract

### 3.1 Seven truth classes; no confidence laundering

Each value used in a claim must carry a source reference, scope and truth class. A `provider` string, booking badge, parsed title, model response or browser-supplied `verified=true` is never verification.

| Class | Meaning / allowed use | Must not become |
| --- | --- | --- |
| `stored_user` | Saved user statement, including manual schedule/booking. Copy: “laut deinem Plan” / “von dir als gebucht markiert” | Actual operation, attendance, provider confirmation |
| `canonical_trip_route` | Existing canonical reader's identity, topology, membership or projection with parent evidence refs | New external truth; user-supplied times remain user-supplied after canonicalization |
| `verified_external` | Future admitted fact from an existing authorized server-owned verifier; exact subject, direction, scope, source/version, observation and validity required | Guaranteed future traffic/arrival, global official clearance or user truth overwrite |
| `code_policy` | Named, immutable version of a Jetnity product rule | Carrier/airport minimum, legal rule, operational guarantee |
| `estimate` | Explicit bounded prediction with method/version, assumptions and freshness | Exact duration, proven conflict/sufficiency or guaranteed free time |
| `unknown` | Missing, invalid, ambiguous, conflicting, stale or unsupported evidence with a reason | Zero minutes, same location, no conflict, no transfer needed |
| `suggestion` | Advisory action or optional plan idea, linked to the finding that motivated it | Saved item, assigned date, booking or accepted user decision |

Proposed `EvidenceValue<T>` is a tagged value: `state = known | missing | invalid | ambiguous | conflicting | stale`; `value` exists only for `known`; `candidates` may exist for `ambiguous`, never be silently collapsed. It carries `truthClass`, `sourceRef`, `subjectRef`, `field`, `sourceRevision`, `parentRefs`, `observedAt`, `validFrom`, `validUntil`, `scope` and `reasonCodes` as applicable. Null metadata is explicit; an external value missing required verifier/validity metadata is not admitted. Stored plan facts do not expire merely with age, but their binding to the current graph can become stale.

Canonical derivation preserves leaf provenance. A result may depend on several classes; expose `basisRefs`, `assumptions` and `claimScope`, not one misleading “high confidence” score. Conflicting user/external times stay separate until an existing authoritative update path resolves them; this layer never chooses whichever time makes the plan fit. A prediction from a verified provider is still an estimate when its semantics are predictive.

### 3.2 Proposed evaluation envelope

`evaluateTimeline(input)` denotes a pure function, not a new file/export commitment. Required envelope:

| Field | Contract |
| --- | --- |
| `contractVersion` | Literal `timeline-intelligence/v1` in the future reviewed implementation. |
| `snapshot` | `tripId`, canonical `revision`, deterministic content fingerprint, Core adapter version, Route version/fingerprint, complete normalized day/item/stage collections. Same snapshot for every check. |
| `coverage` | Whether the full authorized Trip including `ohneTag` was supplied; source absent/loading/error/partial must be explicit. A selected-day-only array cannot prove absence or whole-day freedom. |
| `items` | Readonly IDs, membership, kind, source temporal fields, booking state/source, role, relevant location/route refs. No cloning an item into a new identity for each display row. |
| `policies` | Explicit immutable registry revision and applicable entries from §6. An empty registry means unsupported policy, never zero required margin. |
| `externalFacts` | Readonly previously admitted facts with context/freshness; absent by default. Evaluation cannot fetch them. |
| `clock` | Explicit envelope from §9 or `unavailable`; never a hidden `Date.now()` in the evaluator. |

Identifiers are opaque and Trip-scoped. Day ID and item ID survive edits, movement and visual sorting; `dayIndex`, title and position are not IDs. Duplicated IDs with different payloads invalidate the affected scope; identical duplicate projection references are deduplicated. Deleted items disappear. If Guest→Account changes an ID, old results/actions expire; only an existing proven mapping may preserve navigation identity.

Proposed output envelope: `contractVersion`, `inputFingerprint`, `evaluatedClockRef|null`, `coverageByCheck`, normalized `intervals`, pair `conflicts`, directed `transitions`, `scheduleGaps`, `usableWindows`, `next`, and `findings`. Check-family keys are `temporal`, `mobility`, `buffer`, `geography`, `gap`, `next`. Each family retains its own coverage; no combined boolean `safe`, `ready` or `free`. Every derived quantity carries `unit`, `basis`, evidence refs and either an exact value, a bounded range or unknown reason. Civil-minute counts and elapsed minutes are different bases and cannot be added.

Initial stable reason codes are `missing_date`, `missing_start`, `missing_end`, `missing_clock_context`, `missing_timezone`, `ambiguous_local_time`, `invalid_local_time`, `conflicting_evidence`, `stale_evidence`, `missing_endpoint`, `insufficient_location_precision`, `ambiguous_candidate`, `unproven_sequence`, `incomplete_snapshot`, `unsupported_role`, `missing_policy`, `unknown_travel_duration`, `unknown_phase_inclusion`, `unknown_placement`, `clock_unqualified`, `clock_expired`, `duplicate_identity`, `snapshot_changed`, `not_run`, `evaluation_unavailable`, `evaluation_error`. Reasons are a deduplicated code-point-sorted list with affected fact refs; copy translates them and never parses them back into truth. Future additions require a contract-version review, not free-form model output.

`EventRef = (tripId, itemId, boundaryRole, subeventRef?)`. Boundary roles include start/end and flight departure/arrival. Current segments have no immutable segment ID. A future segment reference must therefore include itinerary fingerprint, leg index and canonical segment index and expires on itinerary change. Never claim that an index is a stable lifetime identity. The whole item's ID remains stable.

### 3.3 Occupancy and date semantics

- `occupied_interval`: a saved timed activity, actual flight/transfer interval, or explicitly timed commitment. Only known/qualified boundaries constrain the schedule.
- `start_only` / `end_only`: partial scheduled commitment. A known start is not an invented zero-length interval; missing end is not midnight or the next item.
- `milestone`: explicitly identified instant such as a departure/check-in appointment. It has no implicit duration. Availability windows are not appointments.
- `availability_span`: hotel nights or rental possession period. It is not continuous personal occupation; do not conflict every daytime activity with a hotel stay or infer sleep/check-in time.
- `flexible` / `date_only` / `unscheduled`: no fixed occupied interval. Include in completeness reasons; never place at 00:00 or at a daypart midpoint. A note with a time is not automatically a personal commitment; unsupported semantic role stays unknown.

Use explicit item/segment dates. `dayId` and `dayDate` describe placement; they may contradict protected commercial item dates. They do not silently fill an absent event date. A future Core adapter may expose an authoritative date assignment only if merged Core explicitly guarantees its semantics and supplies provenance; display fallback is insufficient. Keep `item.date_mismatch` visible and compute affected events from their actual stored dates. A selected day cannot crop cross-midnight occupation out of adjacent days.

Booking changes urgency/copy only. `unconfirmed` still occupies its scheduled plan interval; `booked/user` does not prove a time, route, transfer or external operation. Current items have no per-item participant assignment: “Termine überschneiden sich im Plan” is allowed; “du kannst nicht an beiden teilnehmen” or an individual traveller conflict is not. Do not pick the first traveller.

Unsaved suggestions/search candidates are excluded from the committed plan projection. A separately requested what-if comparison would require its own explicitly labelled scope; this contract does not insert a suggested activity into the current schedule. Accepting/saving a proposal does not erase its source provenance or turn generated content into verified external evidence.

## 4. Interval, timezone and Date-Line model

### 4.1 Preserve civil fields and qualify instants

Civil value: strict Gregorian `YYYY-MM-DD` plus optional strict `HH:MM` (00:00–23:59), each with provenance and an explicit location/clock-context reference. Invalid calendar dates, 24:00, rollover parsing and negative durations are rejected as invalid inputs. Date-only remains date-only, including display formatting.

A qualified boundary is either an explicitly sourced instant/offset at that exact boundary, or a civil date+time with a proven applicable IANA timezone, pinned timezone-rules version and unambiguous resolution. An offset at departure is not the arrival offset and is not valid for a later date by default. A known zone with an ambiguous repeated time yields all valid candidates unless a source explicitly resolves the fold. A nonexistent local time yields invalid; never shift it forward. Inconsistent instant/local/offset/zone evidence yields conflicting, not “last source wins”.

Do not infer timezone from device/server locale, country, stage name, longitude, nearest airport or a single Trip-wide zone. A future timezone source is a separate gated dependency. No resolver, library choice, lookup or timezone database installation is authorized here.

Two explicitly shared local clock contexts may support **civil schedule comparison** without conversion. A shared airport identity can establish that civil context; equal strings, equal country or the same display day cannot. Such results carry `comparisonBasis=civil_only`, show the local plan overlap conditionally and cannot prove elapsed minutes, current/past state or physically safe/free time. Without rules/offset evidence, DST ambiguity has not been eliminated. Cross-context civil strings are not ordered as instants.

### 4.2 Boundaries and arithmetic

An occupied interval uses half-open `[start, end)` with `end > start` on a qualified instant axis. End equal to the next start means no occupied overlap, but says nothing about buffers or mobility. A zero-length pair is invalid as an occupied interval; only an explicitly typed milestone can have zero duration.

Explicit start `6 Oct 23:30` and end `7 Oct 00:30` can describe a cross-midnight interval. End clock earlier than start with no end date does not authorize adding one day. Cross-midnight windows remain one logical interval and are projected into relevant days only for display, with the original ID and per-boundary zone labels.

For a Date-Line flight, retain each airport's local date/time even when arrival's date is earlier. With both boundary offsets/zones, compute UTC instants and validate duration there. Without them: preserve local schedule and canonical Route order, but leave elapsed duration, cross-airport overlap, buffer and relative-now comparisons unevaluable. Local reversal alone is neither a time conflict nor proof of a bad flight. Canonical topology ordering and the existing three-calendar-day chronology rule do not supply elapsed duration.

All calculations retain exact units/precision from input. Milliseconds may represent instants, but minute-precision source times remain minute-precision facts. Display rounding never feeds comparisons or IDs. No assumed average activity duration, 24-hour real day, default check-in/check-out or airport processing time.

For implementable normalization, `TemporalBoundary` retains the civil source fields and one of `instant_exact(value)`, `instant_candidates(values, correlationRef)`, `estimate_range(earliest, latest, methodRef)`, `civil_only(contextRef)` or `unknown(reasonRefs)`. Candidate values are finite, sorted and unique; a range is closed with earliest ≤ latest. Boundary correlation/explicit duration constraints stay attached when pairing starts and ends. `TemporalSpan` names its role, start/end boundaries, evidence refs and validity. An occupied span needs a nonempty assignment set, and every admitted start/end combination must have positive duration after the supplied correlations are applied. Otherwise the span is not evaluable; never silently discard nonpositive combinations to create a proof. Contradicting explicit constraints invalidate the span. The evaluator never narrows a range because a particular choice fits the plan better.

## 5. Four conflict outcomes and evaluation coverage

Every pair result includes `state`, `ruleId`, `comparisonBasis`, `eventRefs`, `basisRefs`, missing/invalid reasons and evaluated snapshot. State applies to a stated claim (saved plan overlap), not to the entire trip or real-world attendance.

For admissible qualified instant assignments, test `max(startA,startB) < min(endA,endB)`. Finite ambiguity sets must preserve all allowed assignments and source correlations; inconsistent/empty assignment sets are invalid, not a vacuous proof. Do not generate arbitrary candidate durations to manufacture a result.

| State | Exact admission rule | User meaning |
| --- | --- | --- |
| `proven_conflict` | Complete occupied intervals; valid admissible non-estimated evidence; overlap holds in **every** allowed instant assignment | “Diese Termine überschneiden sich laut deinem Plan.” Exact minutes only if identical across all assignments. |
| `possible_conflict` | A bounded evidence-supported ambiguity/estimate overlaps in at least one assignment but cannot prove conflict; or shared-context civil windows overlap without instant proof; or a start-only anchor lies inside a known interval / coincides with another commitment's start | “Mögliche Überschneidung – [specific missing fact] prüfen.” No fake probability or invented end. |
| `no_proven_conflict` | Complete comparable non-estimated intervals are disjoint in **every** admissible instant assignment | “Keine zeitliche Überschneidung für diese geprüften Termine.” No green global clearance; buffers, transfers and unassessed items remain separate. |
| `not_evaluable` | Required anchor, date, context, usable boundary or trustworthy evidence absent/invalid/conflicting/stale; no supported possible-conflict condition | “Zeitlicher Abgleich noch nicht möglich.” No alarm for every mathematically imaginable overlap. |

Precedence: validate scope/evidence first, then proven, then supported possible, then complete disjoint, otherwise not evaluable. An estimated disjoint interval cannot yield `no_proven_conflict`. Civil-only disjoint windows remain `not_evaluable` for physical conflict. Missing end at 10:00 followed by a known 11:00 appointment is not automatically a possible conflict: absent a bound or overlapping anchor it is `not_evaluable`, with one end-time data hint. A partial item never gets an invented duration merely to enter pair evaluation.

Run comparisons across all potentially relevant days from the full graph, not only adjacent DOM rows. Exact disjoint-date/instant ranges can prune pairs; name/order/daypart heuristics cannot. Do not compare the same logical event to itself or duplicate flight summary and segment projection. Multiple overlapping appointments retain each pair result; presentation may group the connected conflict set while preserving its members.

Result coverage is independent of findings: `not_run | complete | partial | unavailable | error`, with eligible/evaluated/unevaluable counts and reason refs. `not_evaluable` is a completed attempt for that pair but an incomplete scope-level temporal assessment. `complete` is per declared check family, never implied by zero findings. An empty day means “Noch keine festen Termine”; it does not establish a full day of free time.

## 6. Buffer policy and recommendation contract

Separate three amounts: scheduled travel/occupied time, operational constraint (if actually verified), and discretionary planning margin. None is a synonym for another. A local layover value or provider's route estimate is not an operational minimum.

Each future policy entry must supply:

`policyId`, immutable `version`, `owner=jetnity`, `sourceRef` (reviewed rule/decision), `effectiveFrom`, optional `effectiveUntil`, applicability predicates, boundary roles, units, rule expression, `requiredEvidence`, composition rule, rationale, approved copy key and supersession identity. Numeric constants belong in this reviewed entry, never hidden in UI. The evaluation records exact policy version and matched inputs.

| Category | Can be a Jetnity default? | Truth requirement |
| --- | --- | --- |
| Optional comfort margin after activity/before appointment | Yes, a transparent reviewed product preference; user override remains `stored_user` | Say “Jetnity-Planungspuffer”, not “notwendig”. No default value is approved by this design. |
| Personal packing/preparation margin | Only as explicit optional suggestion or saved user preference | Not a carrier constraint, no automatic occupation of time. |
| Airport arrival, security, immigration, baggage reclaim, terminal transfer, minimum connection, station/platform/ferry check-in | No universal operational default | Exact applicable source, airport/station/operator/service, date/direction and traveller context where relevant; missing requirement remains unknown. |
| Ground travel duration | Never a buffer default | Exact applicable stored planned interval or separately qualified travel-time evidence. A route estimate stays estimate. |
| Hotel check-in/check-out or attraction hours | Never guessed | Saved explicit appointment versus verified availability window must be distinguished. Opening-hours implementation is outside scope. |

Initial policy registry for a future minimal implementation is **empty for numeric margins** until a reviewed runtime task supplies entries. Tests may inject named synthetic policies; they are not product defaults. Missing policy is `policy_unknown`, not 0. An explicit applicable `not_applicable` proof may remove a requirement; absence of a rule cannot.

For a directed transition A→B, `available = startB - endA` only on a qualified elapsed-time basis. Evaluate separately:

- `operationalRequirement`: `met_by_schedule | below_requirement | not_evaluable | not_applicable`. A comparison is about supplied planned data and an exact applicable rule; “met” never guarantees catching a service.
- `planningMargin`: `meets_policy | below_policy | not_evaluable | not_applicable` with `policyId/version`.
- `travelFit`: `fits_saved_schedule | exceeds_window | estimate_only | not_evaluable | not_applicable`.

Each component identifies `phase` and `includesRefs` (for example, an operational requirement that already includes security). Deduplicate by source/requirement identity. Durations for separate sequential phases add; constraints for the same boundary/phase combine by max; overlap or inclusion ambiguity blocks a combined total. Never add a minimum-connection figure and its included processing steps again. No evidence is silently discarded to improve feasibility.

Where requirements have valid bounded ranges, insufficient is proven only when maximum available time is less than minimum required time; sufficient-by-schedule only when minimum available is at least maximum required and every necessary component is qualified. Intermediate overlap yields possible/unevaluable with the range exposed. Estimates cannot certify either a proven impossibility or sufficiency. Exact equality satisfies the stated minimum but leaves zero residual margin. A known shortfall can be reported despite other unknown components, while the overall transition remains partial.

Example fixture only: a gap of 50 minutes, exact planned transfer 35 minutes and synthetic policy `fixture.personal-margin@1` of 20 minutes yield `below_policy` by 5 minutes. Copy names that planning policy, never “Anschluss unmöglich”. A 60-minute gap with unknown transfer remains unevaluable even if that same policy is known.

## 7. Transfer need, coverage and geographic plausibility

### 7.1 Endpoint evidence and directed edges

An endpoint has `identityKind`, namespace+ID, precision (`city | facility | terminal | exact_point | unknown`), source refs and optional qualified coordinates. A display label is separate. Identity relations are `same_proven | distinct_proven | unresolved | contradictory`, with proof scope. Two different IDs in unrelated namespaces are not automatically distinct physical places. Matching IDs must identify the same entity at the precision required by the rule. Same city/country does not establish same airport, station, hotel or entrance. Even same airport does not mean same terminal or zero walking time.

Existing `airport:XXX` compared with the canonical airport code can prove airport identity. Canonical city+country can support city-level section association where the existing flight contract allows it; it does not prove city→airport, terminal or venue equality. Names (“Paris”, “Springfield”), title parsing, map centroids and equal coordinates are never identity proofs. Valid coordinates with provenance/accuracy can support spatial separation at that precision; they cannot resolve names into IDs or a navigable path. Do not infer coordinates for a missing item from its stage.

Candidate edges arise from either (a) a canonical directed route/required movement relation with proven order, or (b) two successive scheduled commitments with proven chronology, occupancy relevance and physical endpoints. Sequence must be supported independently of visual Core sorting. Unknown/flexible items and possible intermediate movements are considered before absence can be asserted. Keep edge ID based on directed endpoint event refs, not title/date/array order.

### 7.2 “Transfer fehlt” requires all of the following

1. A directed connection need is proven for this saved journey; both required endpoint identities are sufficiently precise and distinct, or canonical Route supplies an explicit qualified surface movement.
2. The edge's occurrence/order and required planning scope are unambiguous. A date-only canonical stage transition may establish a planning need but cannot establish a time window or duration.
3. The full current graph was inspected, including unplanned items and structured flight/transfer subevents.
4. There is **no** covering planned movement and **no** unresolved plausible candidate that might cover it. Title/name-only or undated transfer candidates cannot be silently treated as absent.
5. A more specific existing signal for this same canonical missing movement is linked/deduplicated, not contradicted or repeated as a second independent truth.

Then output `coverage=missing_in_plan`, copy **“Transfer fehlt im Plan”**, action “Verbindung ergänzen” only when that existing user path is available. It asserts a plan omission, never that the traveller has no ticket or real-world transport. Duration may remain unknown while this planning omission is proven; also return `travelFit=not_evaluable` and do not label the intervening time free.

Otherwise use **“Transfer noch nicht prüfbar”** with `coverage=not_evaluable` and specific reason: endpoint missing, city/facility mismatch unresolved, sequence unknown, incomplete snapshot, ambiguous candidate, stale route or no occurrence binding. Do not use “Transfer fehlt” merely because there is no `kind=transfer` row.

`coverage=present_in_plan` requires one unambiguous directed movement or explicit canonical chain matching endpoints and occurrence. A saved flight can cover its proven airport movement, not access to/from those airports. A surface marker proves a movement relation, not that a transfer is arranged. A hotel booking or rental possession period is not a scheduled transfer. Reversed endpoints/date coincidence/booking status do not cover an edge. Multiple plausible transfers stay ambiguous; never select the first or prefer “booked” as a tiebreaker. `not_required` is limited to a proved redundant movement at the required physical precision; same city or same airport alone is insufficient for local movement.

Current schema cannot store all venue/terminal, link and timezone evidence. Unsupported cases intentionally remain unevaluable. No new persistence contract or hidden per-item assignment is introduced here.

### 7.3 Plausibility has separate dimensions

Return `identityConsistency`, `topologyConsistency` and `travelFeasibility` separately. Known contradictory endpoint/country assertions or a provable broken route relation may produce `route_mismatch`; absence/ambiguity produces unevaluable. `chronologieBewiesen=false` alone is not proof of a broken route. Transit airports/countries are not new Trip stages.

Coordinates can show a sourced geometric separation or a lower-bound distance calculation under an explicitly versioned method, but this first contract does not require distance output. Distance cannot be converted to driving/walking minutes or a maximum speed without separately admitted evidence/policy. Rivers, borders, ferries, access restrictions, timetables and traffic require future qualified routing facts. “Unmöglich in 20 Minuten” cannot follow from a far-looking map, a city label or a straight line. Geography being consistent does not prove temporal feasibility.

## 8. Schedule gap versus usable free time

`ScheduleGap` describes only an interval between the union of relevant occupied plan intervals on a comparable axis. Merge overlapping occupied intervals before calculating gaps: nested A 09:00–12:00 / B 10:00–11:00 / C 13:00–14:00 yields gap 12:00–13:00, never 11:00–13:00. Preserve boundary event refs. An unresolved event prevents treating a candidate hole as an assessed empty interval; report bounded comparison plus incompleteness.

Gap states: `observed_gap | no_gap | not_evaluable`. Positive raw elapsed gaps require qualified instants; shared-context civil differences may only be shown as **“Zwischen den eingetragenen Ortszeiten”**, `basis=civil_only`, with no physical duration/free-time claim. No leading/trailing day gap is invented from 00:00/24:00, default waking hours or hotel nights. Explicit user-available boundaries can delimit those gaps only when qualified. An entirely empty day is a no-fixed-appointments state, not 24 hours free.

`UsableWindow` is a stricter result: `usable_in_plan | zero_usable | estimate_only | unknown`. `usable_in_plan` requires all of:

- qualified fixed outer boundaries and complete relevant schedule coverage;
- no unresolved occupancy, possible overlapping commitment or unplaced required movement within scope;
- endpoint identity and mobility coverage resolved at required precision;
- all required travel/processing phases accounted for with qualified scheduled intervals/constraints; exact placement of the residual window known;
- applicable buffer policy/operational requirements explicitly resolved, including any explicit not-applicable cases;
- no relevant stale/conflicting evidence and no unallocated flexible commitment in that scope.

Subtract the **union** of actual reservations, scheduled movement and qualified buffer intervals from the candidate gap, not blindly a sum. If all values are qualified scalar durations but placement is not known, report only `residualBudget`, never invent a continuous usable window. Sequential phase budget is `max(0, available - travel - nonoverlapping buffers)`; all terms must be present and units compatible. A missing term is not zero. Unknown travel means unknown usable time, even when the arithmetic would look generous. Estimate-based deductions may produce a clearly labelled estimated remainder; never “frei”.

Example: occupied event ends 12:00, next starts 15:00; a saved qualified movement occupies 12:00–12:40 and a applicable known margin occupies 14:40–15:00. With full scope and no other obligations, residual `[12:40,14:40)` is “2 Std. frei laut deinem Plan”. Source times remain planned facts; actual availability is not guaranteed. Same example with unknown movement duration yields only the 3-hour raw schedule gap plus “Nutzbare Zeit noch unklar”. A flexible activity makes the gap not automatically usable, even if it has not been assigned a time.

No calculation may treat user preparation `done`, all items `booked` or existing activity `frei` as proof of usable time. Meeting every arithmetic condition establishes freedom **within the declared plan scope**, not absence of meals, sleep, personal commitments or unexpected delay. Unqualified “Du hast sicher frei” is never permitted.

## 9. “Als Nächstes” and current time

`ClockContext` is explicit: `state=qualified | device_estimate | unavailable | stale`, `instant`, `sourceRef`, `sampledAt`, `validUntil`, `uncertaintyMs`, `clockPolicyId/version`. A future code-owned clock policy defines acceptable age/uncertainty; this design approves no hidden age threshold or new time service. Invalid/unknown freshness is not qualified. Device UTC clock is a device estimate unless an existing verified clock path establishes a bounded error; device timezone is never destination timezone. Evaluation is deterministic at the supplied clock sample.

For a qualified current-time uncertainty interval `[nowMin,nowMax]` and event candidate instants:

- `future`: every start is strictly greater than `nowMax`.
- `current_by_schedule`: every start ≤ `nowMin` and every end > `nowMax` for a qualified occupied interval.
- `past_by_schedule`: every end ≤ `nowMin`. This does not mean completed/attended.
- `started_end_unknown`: known start certainly passed, end not known; never “finished”.
- `indeterminate`: missing qualification or a clock/event uncertainty interval straddles a boundary.

At exact start with a point clock, an occupied interval is current; at exact end it is past. A milestone at now is “jetzt laut Plan”; an earlier milestone is “Terminzeit vergangen”, not a completed activity. Start-only items cease being a future candidate at the start but retain the unknown-end state.

Select the minimum qualified future start **across the declared scope**, independent of selected-day UI. A unique winner must precede every other eligible start in every admissible assignment; never choose by the earliest possible value alone. Exact tied starts return a tie group. Overlapping uncertain start ranges yield an ambiguous candidate group with “Reihenfolge noch unklar”, not an exact tie or arbitrary singleton. Global label “Als Nächstes” requires that no other relevant unresolved item could start earlier and that full snapshot coverage is known. Known starts with unknown ends can be future candidates, with duration explicitly unknown. Current events are shown separately. Concurrent current events remain visible as a group.

Fallbacks: with incomplete competing items, label **“Nächster zeitlich bestimmbarer Termin”** plus “Weitere Zeiten sind offen”. With no qualified clock/instants, show **“Geplante Reihenfolge”** from Core and exact local strings; no countdown, “heute”, “in 20 Minuten”, urgent deadline or destination-local current time. With all known events past and unresolved items present, say “Keine weiteren zeitlich bestimmbaren Termine”, never “Reise abgeschlossen”.

Each displayed departure/arrival uses its own sourced zone label; no single destination-clock banner across multi-zone travel. A selected future day can show its planned first item with its date; it must not steal the trip's next-now result. A foreign device timezone, travel across midnight or a device timezone change changes formatting only where explicitly device-labelled, not the event instants. Re-evaluate on clock validity expiry, event start/end boundaries, resume/visibility and detected clock jump. Until refreshed, remove relative claims. No notification/background scheduler is part of this contract.

## 10. Findings, actions and Attention integration

Proposed finding fields: `id`, `ruleId/version`, `scopeRef`, ordered/deduplicated `eventRefs`, state, severity, `basisRefs`, `missingFacts`, `copyKey/parameters`, `action|null`, input fingerprint and validity. Finding ID is a versioned collision-safe canonical tuple of Trip ID, rule family, role-qualified event refs and participant scope if actually known. For symmetric overlap sort event refs by code-point order; for transfers preserve direction. Exclude title, translated copy, time and current state from identity. Result fingerprint includes those changing facts. Segment identity follows §3.2. Do not truncate keys or parse opaque existing Attention IDs.

| Stable rule family | Default severity / copy | Primary recommended action |
| --- | --- | --- |
| `timeline.interval_overlap` | `warning` when proven; `notice` when possible; names both scheduled events and basis | Open both event details / review times |
| `timeline.time_data` | `info`: “Endzeit ergänzen” / “Zeitzone fehlt für den Abgleich” | Open supported time editor; unsupported field → details explanation |
| `timeline.buffer_shortfall` | `notice` for code policy; `warning` for a verified applicable operational shortfall | Inspect requirement and affected connection |
| `timeline.transfer_missing` | `notice`: “Transfer fehlt im Plan” | Open existing manual connection entry |
| `timeline.transfer_unassessable` | `info`: “Transfer noch nicht prüfbar: …” | Inspect missing endpoint/assignment facts |
| `timeline.route_mismatch` | `warning` for a proved contradiction; unknown has `info` | Inspect canonical route facts |
| `timeline.stale_inputs` | `info`: “Nach Änderung erneut prüfen” | Recompute through existing read refresh; no provider fetch |

`warning/notice/info` are proposed Intelligence presentation priorities, not blocking validation or new readiness statuses. Sort by that order, then fixed rule order as in the table, then stable ID. Booking state alone never raises severity to “blockierend”. A future adapter to existing Attention maps these to `bald/hinweis/hinweis`; it does not claim `blockierend`. Preserve `warning`, `known_gap`, `unknown`, `stale`, `error`, `insufficient_context`, `unavailable` and not-run semantics; retain the full richer result for detail. “Bald” here is the existing severity enum, not a countdown. Do not override higher-priority existing Safety/Readiness signals or reclassify their empty state.

Recommended action object:

`actionId`, `kind=inspect_item | inspect_pair | open_time_editor | open_route_detail | open_connection_entry | inspect_evidence`, exact Trip/event/day targets, `labelKey`, `reasonFindingId`, expected snapshot fingerprint, required existing capability/path, disabled reason or null, and return context. All actions have `effect=navigate_or_open_only`. Opening a manual form may show clearly labelled suggestions but cannot save them. No action returns an automatic patch, reorder, booking, default date or provider request. Unsupported pair navigation falls back to a supported single-item detail with linked second item; unknown/deleted target returns to its existing day/plan fallback with explanation, never to a different same-name item.

Click-time validation must resolve IDs against the current authorized graph and compare the action fingerprint. Recompute stale actions before enabling them. Any eventual user write remains with the current mutation/revision/permission path; this layer cannot bypass it. User/model-supplied text is escaped display data, not executable HTML, command, link authority or rule definition. Sensitive passenger/document data is unnecessary for these plan-level claims.

## 11. Recompute, invalidation and deterministic output

Compute from one immutable snapshot; no stored Intelligence truth. A cache, if later justified, is disposable and keyed by full dependency fingerprint, never just Trip ID/day ID or `updatedAt`. Include normalized graph content and revision (some existing writes may need content-based detection), role/boundary refs, Route version/fingerprint, Core adapter version, evidence contents+validity, policy versions, timezone rules version and clock class/sample for clock-dependent results. Include missing/null/conflicting values; absent and false/zero differ.

| Change | Invalidated/recomputed scope |
| --- | --- |
| Add/delete/edit item, start/end, role, manual transfer endpoint | Affected intervals, all relevant pair/edge membership, gap union, day summary, next candidates and actions; deletion removes findings |
| Flight itinerary change or accepted schedule update | Whole affected itinerary refs, adjacent movement needs, overlap/buffers/gaps/next, Route-dependent results; no automatic downstream shift |
| Day date, stage dates/order/identity/coordinates, item day/stage assignment | Membership and date mismatch, relevant endpoint/clock context, route edge adjacency and every dependent result; do not assume UI day relocation changed protected times |
| Booking correction | Copy/actions and any explicitly booking-dependent policy; no route/time proof promotion |
| External evidence expiry/retraction/context mismatch | Immediately remove dependent positive guidance; show stale/unknown, even with unchanged Trip revision |
| Timezone/offset/fold correction or rules-version change | All affected instant mappings and dependent results |
| Policy/version/effective-date change | Buffer fit, residual windows, corresponding copy/actions; old numeric results expire |
| Clock expiry/jump/resume/start/end boundary | Relative-now state, next and evidence freshness; no event mutation |
| Locale, viewport, day selection | Presentation only; cannot change physical result, truth class, canonical order or finding identity |

Safest initial implementation recomputes the full pure projection on every relevant snapshot change, then optimizes only with dependency-equivalence tests. A result computed for revision N must never publish against N+1. Compare captured input fingerprint after asynchronous orchestration; discard late results. If recomputation fails, coverage becomes error, with no retained green/free/next assertion. Historic detail may be shown explicitly stale but cannot drive an enabled action.

Stable serialization uses documented code-point key/ID ordering and preserves semantic sequence through canonical positions/Route ordering. Arrays representing sets can be normalized; meaningful route/order changes must not disappear from hashes. Equal input including clock/policies yields equal output across devices and Guest/Account. No random IDs, ambient timezone, browser measurements, locale-dependent collation or provider call in evaluation.

## 12. Smartphone-first presentation and adversarial acceptance

### 12.1 One calm timeline, one set of facts

Show one primary inline hint per affected item/edge; all additional findings stay accessible through “Weitere Hinweise (N)”. Proven overlap connects the two existing items semantically, with no duplicate item or reordering. A day summary shows at most three prioritized **groups**, mirroring the existing Attention budget, with separate counts for actionable findings and not-yet-assessable data. Group equivalent causes while retaining each member and its exact target. A single missing timezone can explain many unavailable checks without one banner per pair.

If a stronger finding and an unknown dependency coexist, retain both facts; the primary message can name the known shortfall and disclose remaining unknowns. Never summarize partial coverage as “Alles passt”. Empty, not-run, missing context, unavailable, stale and technical failure have distinct calm copy. Schedule gaps and optional suggestions are neutral whitespace/plan information, not warnings. Use one clear primary action; no warning carousel, pulsing urgency, red for every unknown or modal on load.

Smartphone sequence: time/zone → item → concise hint → action → optional details/source. Tablet/desktop add room for related items but use identical results and priority. Semantic lists, text+icon (not color alone), accessible named relationships, natural wrapping and return-to-item/day focus are required. Primary controls ≥44px, mobile inputs ≥16px; support repository widths 280/320/360/375/390/430/768/1280 and landscape, 200% text, keyboard and screen reader. Do not expose machine enum tokens as accessible text (audit F-05). Live announcements are polite and coalesced on meaningful change; no announcement every clock tick. Preserve focus after save/reclassification (audit F-02), user expansion and scroll context. Physical-device and Account-E2E acceptance remain future gates, not proved by this document.

### 12.2 Adversarial matrix (future test oracle, not executed runtime tests)

Unless stated otherwise, examples are synthetic saved plan facts on 2026-10-06 with explicit `+00:00` boundary offsets, full Trip snapshot and scheduled occupied roles. Numeric policy examples are fixture entries only. No live provider/calendar facts are claimed.

| ID | Input / attack | Required result |
| --- | --- | --- |
| T01 | A 10:00–11:00, B 10:30–11:30 | Proven plan overlap 30 min; exact pair refs; no mutation. |
| T02 | A 10:00–11:00, B 11:00–12:00 | `no_proven_conflict`; buffer/transfer not automatically sufficient. |
| T03 | A 10:00–unknown, B 10:00–11:00 | Possible conflict at known start; unknown duration, no 60-min invention. |
| T04 | A 10:00–unknown, B 11:00–12:00 | Not evaluable; missing-end hint, no fabricated possible warning/gap. |
| T05 | Two flexible/no-time items on same day | No occupied overlap proof or 00:00 events; incomplete schedule scope. |
| T06 | A Oct 6 23:30 → Oct 7 00:30; B Oct 7 00:15–01:00 | Proven 15-min overlap, appears once per logical pair across both day views. |
| T07 | A 23:30 → 00:30 with absent end date | Not evaluable; no implicit next day. |
| T08 | NRT Oct 7 00:30 +09:00 → LAX Oct 6 18:30 −07:00 | Qualified 10-hour interval (Oct 6 15:30Z→Oct 7 01:30Z); keep both local dates. |
| T09 | Same local values as T08, no offsets/zones | Retain local route schedule; no duration/current-time/cross-airport conflict proof. |
| T10 | Stored audit-style NRT Nov 2 23:30 → LAX Nov 1 12:00 without zones | Do not label invalid using local reversal alone; if later qualified instants prove negative duration, report conflicting/invalid then. |
| T11 | Synthetic zone fold admits A 01:30 at either 00:30Z or 01:30Z; B overlaps only one candidate | Possible, never choose earlier fold silently; no unique next if ordering differs. |
| T12 | Local 02:30 in a supplied ruleset gap | Invalid/not evaluable; no shift to 03:30. |
| T13 | Explicit instant contradicts supplied local time/offset | Conflicting/not evaluable; no preferred-source convenience choice. |
| T14 | Same airport, zoneless A 10:00–11:00 and B 10:30–11:30 | Civil-only possible overlap; no elapsed 30-min proof. |
| T15 | Same day, different/unknown contexts, overlapping clock strings | Not evaluable; date/strings cannot establish shared time axis. |
| T16 | Invalid date Feb 30, 24:00, or occupied start=end | Invalid; no parser rollover, midnight assumption or free-time result. |
| T17 | Hotel Oct 6–9 plus afternoon activity | Hotel availability span does not block three days; no hotel check-in appointment inferred. |
| T18 | Planned flight sits on a different display day after Trip shift | Keep true stored/itinerary dates and existing date-mismatch finding; invalidate affected results. |
| M01 | “Paris”→“Paris”, null IDs/country; one could be Texas | Identity unresolved, no same-place/covered/missing-transfer assertion. |
| M02 | Stage `geonames:2988507` named Paris, airport unspecified | Do not select CDG/ORY or invent access duration; transfer not evaluable. |
| M03 | Canonical explicitly ordered surface edge CDG→ORY; no covering movement or ambiguous candidate | Missing in plan; airport-change need proved, travel minutes still unknown. |
| M04 | Same segments as M03 but no canonical sequence/surface proof | Route chronology unknown; do not assert a definite directed transfer omission. |
| M05 | Exact needed A→B; stored B→A at matching date | Cannot cover directed need. If no unresolved candidate remains and need is proved, missing in plan. |
| M06 | Exact A→B; title-only “Airport transfer” without endpoints/date in `ohneTag` | Potential unresolved candidate blocks absence proof; transfer not evaluable. |
| M07 | Two matching explicit transfers | Ambiguous; no first-array/booked winner; no duplicate travel subtraction. |
| M08 | One uniquely linked/occurrence-qualified planned transfer with unknown end | Present in plan, duration/fit unknown; not “Transfer fehlt”, not free time. |
| M09 | NRT→LAX flight same date as Zürich→Florenz need | Never covers that need; preserve #877 proof boundary and unknown association. |
| M10 | Same airport, different/unknown terminals | Airport identity known; local movement need/duration not proven zero. |
| M11 | Stage coordinate equals hotel-like label; item has no venue evidence | Do not copy stage centroid into item venue or derive walking minutes. |
| M12 | Two distant valid coordinates, 20-minute raw gap | No impossible-journey assertion without admissible travel constraint; geometry ≠ routing time. |
| M13 | Partial selected-day snapshot contains no transfer | Cannot prove missing movement anywhere in Trip; coverage partial. |
| B01 | Gap 50; transfer 35; fixture margin 20 | Below code policy by 5; not operational impossibility. |
| B02 | Gap 60; no transfer duration; known fixture margin 20 | Buffer/usable remainder unevaluable; no 40-min free claim. |
| B03 | Qualified available 45; applicable verified operational minimum 45 | Meets that minimum by schedule, zero extra margin; no guaranteed boarding. |
| B04 | Known minimum 60 already includes 20 processing; UI tries adding both | Deduplicate inclusion; requirement remains 60, not 80. |
| B05 | Applicable fact expired before evaluation / clock cannot prove currentness | Stale/unknown, not operational sufficiency or proven new shortfall. |
| B06 | Empty registry or missing policy version/source | Policy unknown; no hidden 90/120-minute airport default, no zero. |
| B07 | Estimate travel 20–40; available 30 | Estimate-only possible fit/shortfall; no exact safe/free/impossible result. |
| G01 | A 09–12, nested B 10–11, C 13–14 | Union gap 12–13; no phantom gap 11–13. |
| G02 | Gap 12–15, movement 12–12:40, margin 14:40–15; complete remaining conditions | Usable in plan 12:40–14:40, 120 min; no guarantee about actual day. |
| G03 | Same as G02 with a flexible required activity or uncertain intermediate movement | Unknown usable time; raw gap remains qualified with missing-fact explanation. |
| G04 | 60-min gap with qualified 30-min travel but unknown placement | At most residual budget after all other qualified costs; no fabricated continuous window. |
| G05 | Empty day / only hotel / undated day | No fixed appointments or not evaluable; never 24h free. |
| N01 | now=09:00Z, next event 10:00Z, event label 12:00 +02:00; device is elsewhere | Correct 60-min relation only with qualified clock; retain sourced local event time. |
| N02 | Same as N01 but only device-estimate clock | Planned-order fallback; no confident destination “now” or countdown. |
| N03 | Two future starts both 10:00Z; current occupied event 08–09:30Z | Current shown separately, future tie group; no arbitrary singleton/reorder. |
| N04 | now=10:00Z; A 10–11, B ends 10; C starts 09, end missing | A current, B past by schedule, C started/end unknown; none labelled completed. |
| N05 | now uncertainty 09:59–10:01; event starts 10:00 | Indeterminate near boundary; no definite already-started/countdown. |
| N06 | Known future item plus unqualified-time/flexible competitor | Only “Nächster zeitlich bestimmbarer Termin”; no absolute “Als Nächstes”. |
| N07 | Device zone changes / resume after suspension / clock rollback | Event instants invariant; expire/recompute relative claims, never stale countdown. |
| I01 | Result computed at revision 7 arrives after revision 8 | Drop result; recompute; no action against old targets. |
| I02 | Booking toggled to booked on route-less item | User booking remains; no route/temporal/transfer proof upgrade. |
| I03 | Same semantic graph array permutation / same input on Guest and Account | Same IDs/results where canonical positions/order unchanged; membership ambiguity never resolved by permutation. |
| I04 | Duplicate item ID with conflicting times; day/title reused by another item | Invalid affected scope; no accidental ID/target collision. |
| I05 | Delete item while its action is open; itinerary reorder changes segment index | Old action/result expires; resolve current target or contextual fallback. |
| U01 | 30-day Trip, many identical missing-zone signals on 280/390/768/1280px | Group causes without losing members; max 3 summary groups; no overflow/enum tokens. |
| U02 | Save reclassifies item; keyboard/200% text; existing important Attention present | Keep focus/return context, meaningful announcements and global priority; no warning overload. |

Future tests must additionally prove input deep immutability, no network/write call, truth-class non-promotion, policy/zone-version invalidation, serialized determinism, no estimate/unknown→positive shortcut, stable finding identity under copy edits, and monotonic loss of confidence when required evidence is removed. Replacing an unknown with qualified contradictory evidence may legitimately create a new conflict; monotonicity is about removal of proof, not number of findings. These are acceptance obligations, not tests executed in this docs-only slice.

## 13. Mandatory post-Core reconciliation and gates

After #884 / #888 is actually merged, the Technical Lead must pin its merge SHA and accepted head, re-read live main/mode/#751 and compare this design with actual exported types/functions/tests. A task-seeded or later unmerged #888 head does not satisfy this gate.

| Rebind to merged Core | Required verification |
| --- | --- |
| Core normalization/read-projection function and adapter input name | Confirm no DOM-derived facts; exact missing/malformed handling and graph ownership. |
| Timed/flexible/daypart types and sorting keys | Presentation order stays separate from comparable instant order; no hidden default time/duration. |
| Item/day/stage IDs, unplanned collection, selected-day selector | Preserve identity, deleted selection fallback and no-day items; do not introduce a second selection source. |
| Date source precedence and day mismatch | Actual item/segment dates win over presentation fallback; protected dates remain protected. |
| Flight itinerary/segment projections | Exact local Date-Line data and partial ends retained; no duplicated occupied flight rows. |
| Consumer names, props and render seams in Plan/Detail/Workspace | Attach hints without core mutation, duplicate warning surfaces or automatic reorder. |
| Revision/content-change hooks and refresh boundaries | All relevant writes actually invalidate; test ones that do not increment revision. |
| Navigation/action capabilities, mobile focus/return behavior | Unsupported future action fields stay disabled/fallback; no assumed editor or timezone entry exists. |
| Core tests and user-visible terminology | Run inherited regression corpus plus mapped matrix; reconcile spelling/type names without changing truth rules. |
| Attention/Readiness and #886/#890 design | Align ownership, duplicate suppression and freshness contract after accepted heads; no new official semantics. |

Record each mapping, semantic mismatch and fixture at the merged SHA before a runtime task is dispatched. If actual Core cannot supply a required fact, preserve unknown or obtain a separately authorized upstream contract change; do not expand shared types/DB implicitly. Any discrepancy that could mint false certainty blocks dependent runtime. Reconciliation is pending by construction at this delivery and does not make this parallel design an implementation claim.

## 14. Smallest later implementation sequence (recommendation only)

1. **Timeline evidence, intervals and overlap projection.** After §13, one pure adapter/evaluator with explicit coverage, roles, civil-vs-instant basis, four overlap states, invalidation and focused matrix tests. Reuse canonical IDs/Route. Existing missing zones remain unknown; no DB or provider. Minimal inline hints can use existing detail paths. Exit: T01–T18/I01–I05 and no-mutation/no-I/O properties.
2. **Directed movement, qualified buffers and schedule gaps.** Reuse admitted endpoints and explicit transfer items; implement missing-vs-unevaluable, versioned policy inputs, no numeric operational defaults, gap union/residual semantics. Keep unsupported usable-time positive branch closed. Exit: M01–M13/B01–B07/G01–G05 plus cross-domain regressions; sources/policy activation need separate approval if absent.
3. **Clock-qualified next item and final cross-device actions.** Bind an existing admissible clock source or ship the honest planned-order fallback; implement ties, scoped next, freshness boundaries, lossless Attention grouping, contextual return/focus and accessible phone UX. Exit: N01–N07/U01–U02, real-flow acceptance at repository widths and explicit hardware/Account coverage report.

No slice starts automatically. Any requirement for a new timezone source, live provider, persistence, operational rule source or shared contract expansion returns to Technical Lead/appropriate reserved gates. This design authorizes none of them.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
