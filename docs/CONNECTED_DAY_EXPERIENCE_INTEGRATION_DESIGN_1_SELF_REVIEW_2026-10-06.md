# Connected Day Experience integration design 1 — Self-review

6 October 2026 · #886 / Draft #890 · Writer review, not independent acceptance

**CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_READY**

## TASK coverage

References below point to numbered sections of the [design](CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_2026-10-06.md). Every requirement is design-only.

| TASK requirement | Evidence / assessed boundary |
| --- | --- |
| 1. Day item status | §4; selected versus user-booked, confirmation check versus document absence, activity limitation, cancellation unknown |
| 2. Preparation bridge | §5; canonical signals, conservative day scope, severity/dedup, exact existing section/traveller URLs, no Official Truth fabrication |
| 3. Day map / route | §6; valid stored coordinates and precision, missing location list, Core presentation order, optional later routing |
| 4. Weather | §7; source + issue/check time + valid interval + location/zone, explicit outdoor relevance, advisory-only |
| 5. Hours / reservation | §8; exact venue/branch and exceptions, independent reservation, note and verified hours, stale/unknown |
| 6. Daily cost | §9; saved prices, original currencies, estimates separate, once-only attribution, incomplete totals and True Trip Cost boundary |
| 7. Change Impact | §10; edge proof and field dependencies, unique-target count, before/after semantics, invalidation and no cascade |
| 8. Progressive disclosure | §12; one row hint, bounded summary, details, source qualification and no icon/warning rail |
| 9. Source/provenance | §3 and §11; every feature has source class, freshness, provenance, failure/unknown, fallback and provider dependency |
| 10. Provider/plugin boundary | §11 and §15; current-data paths versus optional external context; no provider/key/paid-call assumption |
| 11. Cross-device | §12; 360/390/768/1440, one-handed mobile, bounded opt-in map, keyboard/focus/back/text scaling |
| 12. Adversarial matrix | §13, A01–A26; all nine named TASK scenarios plus scope, concurrency, identity and cost counterexamples |
| 13. Reconciliation | §14, R1–R9; no unpublished Core/Intelligence interface treated as existing |
| Staged recommendation | §15; ends with provider-free stages followed by gated external context and True Trip Cost |
| Delivery boundaries | Four new Markdown files; TASK unchanged; no runtime/provider/DB/F8/Production/global continuity work |

## Counterexamples used to challenge the design

| Attempted false inference | Repository evidence / correction in final design |
| --- | --- |
| Item/provider URL or trip-level booked means each item is booked | `buchung.ts`, `types/trips.ts`; only item state and `user` confirmation apply. Unsupported activities remain planned. |
| Open confirmation task proves the document is absent | Task is personal preparation, not document inventory. Copy says check still open; missing proof is not proof of absence. |
| A cancellation note cancels a booking and removes its cost | No cancelled enum/refund contract exists. Note stays note; existing manual correction is separate. |
| Preparation supports an exact task-row link | Existing `PreparationZiel` carries section and optional traveller only. No invented query or DOM anchor. |
| Same country on two stages identifies the correct Official day | `OfficialEvaluation` has no stage-occurrence field. Keep ambiguous scope trip-level; no first-occurrence default. |
| Done personal checklist proves regulatory sufficiency | Current domain explicitly separates user and official truth. Partial/unavailable peers stay visible. |
| Saved city coordinates locate a hotel, museum or airport | Graph has stage coordinates; route point lacks coordinates. Pin precision stays stage-level; missing venue proof stays missing. |
| Timeline adjacency creates a transfer edge/ETA | Timeline is presentation, route/mobility are separate domains. Only explicit/reconciled occurrence proof can support a dependency. |
| Snapshot update time proves fresh weather/hours/price | Distinct meanings of observed, checked, valid and graph times are mandatory. Unknown timestamps never become now. |
| Venue hours guarantee a reservation, or a selected slot is booked | Three distinct source records; broker/search snippets cannot establish hard venue truth. |
| A three-night stay should add its full amount on each day | Cost is once per canonical assigned item, with full-price basis; no hidden per-night allocation. |
| Preferred currency implies FX; absent price means free | Per-currency subtotals, missing count and no conversion; explicit zero remains distinct from null. |
| Existing route/readiness fingerprint detects every flight time change | Read actual `fingerprint.ts` / `route/vergleich.ts`. New day projection invalidates on input snapshot changes; domain currentness is not rewritten. |
| Three warning cards prove three affected points | Count unique proven dependent targets; multiple reasons/renderings do not inflate counts. Unknown links are reported separately. |
| New graph arrives but late old result can remain actionable | Snapshot/request-generation and evidence/freshness checks discard old results before display/actions. |
| Green design means ready to activate | Classification explicitly restricted to document delivery; Draft/independent review and all provider/runtime gates remain. |

The flight-change example was tightened during self-review to state a user-booked flight, changed stored `endsOn`, an applicable linked task and a formerly matching fingerprint. This avoids claiming that an unsupported or clock-only input necessarily changes existing readiness currentness.

## Findings, risks and verification

P0: none identified. P1: none identified in the bounded design. P2: none identified in the bounded design. P3: none identified in the bounded design. This is the writer's assessment of the new documents, not a repository-wide defect inventory or independent PASS.

Implementation risks remain: reconciliation against the actual merged #888/#889 contracts; absent precise venue/outdoor/reservation/cancellation/estimate inputs; incomplete relation proof; zone-free clocks and fingerprint limits; cost attribution clarity; future device acceptance. Each has a fail-closed outcome and explicit gate in the design. No workaround is implemented here.

Executed checks: mode guard, 16/16 guard tests, four static hygiene scripts, document link/matrix/scope checks, TASK hash and whitespace checks. Full tests/Typecheck/Lint/build/browser/device/DB validation are not claimed. The report distinguishes the inspected tests and future acceptance cases from tests actually run.

Security/zero-side-effect basis: diff contains only the four allowed documents after seed; no dependency/config/registry/route/schema changes, no network data experiment, no model/provider call, no live account or DB access. Commercial protection and Official Truth boundaries are described, not modified. No synthetic fact is presented as live evidence.

Session `01a1124c-a055-7111-a846-2fc31d9a27d3`; Codex Desktop `gpt-6-astra` / `xhigh`, read from session metadata. Same writer, Generation 1; no delegated agent. Final remote SHA and counts belong to the post-push STOP receipt.

**Keep Draft. No Ready, merge or follow-up. STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
