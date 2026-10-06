# Trip Timeline Intelligence contract design 1 — Self-review

6 October 2026 · Issue #885 · Draft PR #889

Classification: **TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_READY** — author self-assessment of the design delivery only. Independent Technical-Lead exact-head review, GitHub Ready and merge remain outstanding and outside this writer's authority.

## TASK traceability

Source: immutable TASK blob `f10ba41bcb0847737e8100c9655e87f81297da0e`. Section numbers refer to the [design](TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_2026-10-06.md).

| TASK obligation | Design section / review result |
| --- | --- |
| 1. Core input: IDs, local date/time, flexible items, stage/location, booking, optional ends, no DOM | §§2–3 and §13: explicit proposed envelope, persistent IDs, ephemeral segment references, role/coverage semantics and actual-Core rebinding. |
| 2. Interval model, midnight/Date-Line, no inferred timezone, four overlap states | §§4–5: civil versus instant basis, half-open intervals, invalid/ambiguous clocks, qualified universal proof, bounded possible cases and explicit unevaluable state. |
| 3. Buffer policy: product versus external, no magic universal defaults, version/source | §6: complete policy metadata, category table, initial empty numeric registry, composition/inclusion and fit states. |
| 4. Transfer/mobility: explicit versus needed, endpoint evidence, no guessing, missing versus unassessable | §7.1–7.2: directed identity/occurrence proof, full inventory, ambiguous candidate veto and precise copy. |
| 5. Geographic/route plausibility and future provider boundary | §7.3: identity/topology separate from feasibility; coordinates not route time; canonical order does not certify elapsed duration. |
| 6. Schedule gap versus actual usable time | §8: occupied union, no default day bounds, full completeness, qualified subtraction, placement versus residual budget and estimates. |
| 7. Next: now, future/past/current, no device-time destination truth | §9: clock provenance/freshness/uncertainty, boundary rules, unique winner proof, ties, ambiguous ordering and honest fallbacks. |
| 8. Conflict/action taxonomy, IDs/severity/copy/no mutation | §10: stable tuple IDs, fixed severity order, action target/snapshot/capability and navigation-only effects. |
| 9. Edits, flight and stage changes, stale invalidation | §11: explicit dependency matrix, full recompute initial strategy, content+revision fingerprint and late-result rejection. |
| 10. Cross-device UX / inline/day summary/no overload | §12.1: phone-first order, one primary inline hint, max three summary groups, lossless details, focus/a11y and same truth on every device. |
| 11. Adversarial examples | §12.2: T/M/B/G/N/I/U matrix with expected outcomes, plus mutation/I/O/determinism properties. |
| 12. Post-Core reconciliation | §13 and handoff: blocked runtime dispatch until actual #888 merge, type/semantic mapping, missing-fact treatment and regression evidence. |
| Smallest 2–3 runtime slices | §14: exactly three recommended bounded slices; none started. |
| Seven truth classes | §3.1: all seven separate; canonical derivation retains parent provenance. |
| Fresh reconstruction / doctrine / existing contracts / audits | §2 and report: live baseline/mode/#751/#885/#889/TASK, parallel PRs, source paths/blobs and historical-finding reconciliation. |
| Only four deliverables / immutable TASK / docs only | Report + static scope verification; all product and global continuity paths excluded. |
| Commit/push/Draft/STOP/exact-head/model | Handoff + post-push STOP receipt; session evidence recorded below. |

## Adversarial self-review and corrections

The author challenged the design against the following routes to false certainty. These are paper-contract checks, not a new running evaluator:

| Attack | Resolution |
| --- | --- |
| Every absent end becomes a possible warning | Possible requires a concrete overlapping anchor or bounded evidence; otherwise one missing-data hint, not a speculative pair alarm. |
| Same-day `HH:MM` or route chronology proves physical overlap/duration | Civil-only comparisons are conditional; physical proof needs qualified instants. Existing same-airport arithmetic is not promoted across DST/unknown offsets. |
| Null flight summary erases an exact Date-Line arrival | Flight uses canonical itinerary; source local strings survive. Qualification may later reveal contradictory data, but local reversal alone is not an error. |
| Array/UI/daypart order supplies the edge sequence | Directed need/occurrence is independently proved from canonical relation or qualified chronology. Core selection/order remains presentation. |
| Exact tie or ambiguous start ranges choose whichever sorts first | Exact ties group; a unique next must win in every admissible assignment. Uncertain order becomes a distinct candidate group. This universal-winner condition was made explicit during self-review. |
| Surface marker or city/country coverage counts as an arranged transfer | Surface proves need; city proof is scope-limited. No terminal/access transfer, occurrence or duration is invented. |
| Missing transfer is asserted from selected-day data or absence of `kind=transfer` | Full graph/`ohneTag` inventory and ambiguous-candidate veto required; flight movements and unsupported partial items are considered. |
| Known buffer/unknown travel produces a positive free remainder | Missing term never means zero. Full dependencies and phase/placement proof gate usable windows. |
| Nested appointment creates a phantom gap | Union occupied intervals first; interval budget and continuous placement are distinct. |
| Hotel nights, rental possession or flexible activity makes a false all-day occupation/free day | Explicit roles separate availability from occupation; unknown/flexible scheduling prevents complete free-time claims. |
| Provider string/booking status/multiple passengers create authority | Leaf provenance survives canonicalization; no provider verification or participant assignment is inferred. |
| Cached result or action survives route/time/policy/clock changes | Full dependency fingerprints, validity expiration and click-time current-target checks; late results are discarded. |
| Grouped warnings hide uncertainty or speak raw enums | Coverage remains separate, members retained, human copy only, existing Attention priority preserved. |
| Design recommendation starts a follow-up or expands source/API/DB scope | Three recommendations only, new task required; no automatic follow-up or activation. |

## Verification actually performed

- Read the immutable remote TASK and independently compared its local Git blob hash.
- Reconstructed current remote main, mode, live index, issue/PR and parallel PR metadata; inspected canonical source and current audit/fix documents. Source identities are listed in the report.
- Checked all twelve design obligations and the seven truth classes using the trace above.
- Walked the adversarial cases against the written state transitions, half-open boundaries, scoped claims and fail-closed rules.
- Ran documentation-only static verification: exactly four new allowed files relative to the task seed; no tracked edits outside scope; unchanged TASK hash; local Markdown links/headings; unique matrix IDs; required section/STOP/classification presence; `git diff --check`.
- Checked fixed-offset numeric examples independently as document arithmetic: 30-minute and 15-minute overlaps, 10-hour Date-Line interval, 5-minute policy shortfall, 60-minute union gap and 120-minute residual window.

Static result: **PASS** — four allowed deliverables; unchanged TASK blob; all local Markdown targets resolve; 14 numbered design sections; **57 unique adversarial cases** (T01–T18, M01–M13, B01–B07, G01–G05, N01–N07, I01–I05, U01–U02); six numeric example assertions pass. These assertions validate the document examples, not product implementation.

The final post-push STOP receipt provides actual remote head/main/merge-base/ahead/behind/changed-file/TASK/Draft readback. This commit's own SHA is not embedded recursively. Static document success cannot certify runtime correctness or future source admission.

Not run: product runtime/dev server; new/existing application unit tests; full test suite; TypeScript; lint; production build; hosted Preview UI; physical devices; screen-reader speech; authenticated Account E2E; DB/Supabase/Auth/RLS; provider/API/Official Truth; map/weather/opening-hours implementation; Production validation. No runtime test or build PASS is claimed. This is the explicit narrow docs-only validation scope authorized by the TASK, with future runtime gates preserved.

## Findings and remaining gates

Author review found no unresolved blocker in the **written design scope** after the corrections above. This is not an independent PASS or certification of existing runtime. Unresolved design dependencies are deliberately fail-closed:

| Gate | State / implication |
| --- | --- |
| Actual merged-Core type/semantics reconciliation | **PENDING**; mandatory before runtime dispatch. |
| Qualified timezones, clock policy, venue/terminal evidence and operational inputs | **NOT SUPPLIED BY THIS SLICE**; positive claims stay unavailable/unknown where required. |
| Reviewed numeric planning-margin and clock-validity policies | **NOT APPROVED**; no hidden defaults; a future bounded task must supply sources/versions. |
| Legacy activity/Mobility consumer parity | **FUTURE INTEGRATION GATE**; weaker old outputs cannot certify new claims. |
| Smartphone behavior, focus, grouping and real Account/device acceptance | **NOT VERIFIED**; future runtime must test and report limits. |
| Independent TL review / Ready / merge | **OUTSTANDING / NOT PERFORMED**; writer leaves Draft and stops. |

Historical Workspace audit F-01/F-03/F-04 were reconciled with merged #877/#878/#879. F-02/F-05 and V-01 are not claimed fixed. No Security, DB, Provider, Official Truth or global continuity contract was altered.

Execution: Codex Desktop; logical writer **Trip Timeline Intelligence contract design 1**, generation 1; session `01a1124c-460a-7fd0-b5b4-bb2dbd7caa95`; persisted model `gpt-6-astra`, effort `xhigh`. Same author performed this self-review; no independent-review claim, no replacement or delegation.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
