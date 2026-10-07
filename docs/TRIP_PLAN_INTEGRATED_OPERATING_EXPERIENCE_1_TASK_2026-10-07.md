# Reiseplan integrated operating experience 1 — binding large work package

Date: 7 October 2026 (Europe/Zurich)
Repository: Jetnity/jetnity
Issue: #902
Branch: `feat/trip-plan-integrated-operating-experience-1`
Baseline: `main@0481173cf56f13e5316246503e4683ad843728f2` — Merge #897
Logical writer: **Reiseplan integrated operating experience 1 — Generation 1**
Execution: Codex Desktop; actual session/model/effort recorded from execution, never invented.
Status: **ONE INTEGRATED IMPLEMENTATION / NOT ANOTHER DESIGN-ONLY SLICE**

## 1. Product-Owner request and autonomous execution

The user explicitly requested: `sind wir jetzt fertig mit dem reiseplan ? wenn nicht dann mach wieder einen grossen auftrag den den reiseplan komplett auf einmal bauen wird.` The accepted working preference is a substantial continuous assignment without repeated routine permission requests. This TASK defines the concrete scope of that request, rather than claiming unlimited authority over every Jetnity subsystem.

ALL normal actions within this scope are approved now: live reconstruction, internal planning and contract reconciliation, implementation, bounded refactoring, tests, correction of task-caused regressions, owned disposable local test resources, truthful documentation, commits and pushes to this branch. Do not stop after planning or each component to ask whether to continue. Do not split each phase into a new user prompt or PR. Work through all independent phases. Internal checkpoints support resumption, not repetitive approvals.

Use a fresh dedicated worktree. #897 is merged/closed; reuse its code, not its old branch/session. #900 Official Truth has a separate active writer and is NOT part of this task. No Cursor/Grok dispatch or pings. Available internal Codex reviewers/subtasks may use disjoint ownership within the current budget, never a competing branch writer; they do not provide independent Technical-Lead PASS.

Only ChatGPT/TL independently accepts, marks Ready and merges. No force-push, protection bypass, destructive reset, autonomous merge or unlisted follow-up. A session that stops is not claimed to keep working in the background.

## 2. Goal and honest definition of complete

Deliver a coherent, genuinely usable **provider-independent integrated Reiseplan** in the existing Trip Workspace: see the day, maintain actual saved points, understand relevant problems, inspect stored booking/preparation/cost/location facts, understand proven change impacts and navigate to the exact resolution flow. Add the remaining defined movement/gap/buffer/next and external-context consumer logic with correct qualification and fallbacks. This is not a new planner or a second travel graph.

The mandatory result is running product code plus one reproducible integrated acceptance run, NOT disconnected helpers, a fixture-only alternative UI or a screen full of unavailable widgets. Ordinary saved-data actions, booking/Preparation navigation, saved cost breakdown, located/unlocated lists, change invalidation and save/focus recovery must work through the real Guest and Account code paths.

**Not the same as every external feature being live:** real weather, verified venue hours, live street routing/traffic, provider booking/airline changes, authoritative timezone admission and automatic Official Truth require independent external facts and/or reserved activation. This task implements strict consumer interfaces and tests, but does not create those facts or activate a new service. Missing optional external context must not block independent product work or cause repeated questions. Final report separates complete built functionality, dormant provider-dependent consumers and genuine unfinished engineering. Never call an unimplemented mandatory module an external dependency.

This consolidates the remaining approved #889/#890 program into ONE assignment. Its internal phases may proceed after their own tests without new micro-slice approvals. The prior design requirement for new runtime authorization is satisfied for the explicitly scoped capabilities below; source/identity/byte/security invariants and external activation gates are NOT waived.

## 3. Fresh TL precheck and binding reads

At task creation: main above and mode NORMAL independently read; main tree `710d2f642bd50d30dc40ed3e7721159f8e8ea58b`; exact-main push CI37546995222 verify112553268486/Auth112553268600 SUCCESS; Production `dpl_5J19eiw4VEWaowuDpJErCJe9J3Q2` READY at exact main/jetnity.com/aliasError=null. Targeted #748 read returned no newer MATERIAL after the existing processed marker5988971332/receipt5989855107. Open work includes #900; its newer head is NOT accepted merely because visible. No other Trip writer was found.

Production METADATA-ONLY inspection confirmed existing trip_items starts_on/starts_at/ends_on/ends_at, title/note, saved-price, booking and endpoint columns; clocks are `time without time zone`. Existing owner-authenticated row policies remain. No application rows, secrets or hosted data were read/changed. This is not acceptance of new writes or proof of full authenticated E2E. No schema apply is authorized.

Before work, re-read START_HERE -> Operating Standard/current Guardian handoff -> ACTIVE_WORK_STATUS durable pointer -> live main/mode/#751 -> this TASK and its issue/PR -> relevant newer #748 MATERIAL. Historical HOLD/writer declarations do not override the live index.

Read and use:
- `docs/TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_2026-10-06.md` (#889), especially evidence classes, intervals, transfers, buffers, gaps, next, identity and invalidation;
- `docs/CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_2026-10-06.md` (#890), especially booking, Preparation targets, map precision, money, impact and acceptance matrix;
- #888 Core TASK/REPORT and #897 corrected TASK/REPORT/HANDOFF and final review5435641315;
- Product Differentiation Doctrine and current Workspace architecture, with historical IA distinguished from current four-mode code;
- actual `types/trips.ts`, Trip schemas/mappers/actions/Guest storage, workspace-mode/detail/navigation, canonical Route/Mobility readers, booking and read-only Preparation/Official presentation;
- `TRIP_WORKSPACE_INTEGRATED_ACCEPTANCE_AUDIT_1_2026-10-06.md` for historical F02/F05, not to reopen already fixed F01/F03/F04.

## 4. Reconciliation decisions already made by TL

| Concern | Binding implementation decision |
| --- | --- |
| Core | Reuse `lokalePlanzeit`/`tagesTimelineAbleiten` in `lib/trips/trip-timeline-core-1.ts`, and `timelineAbleiten` in `lib/trips/timeline.ts`. Presentation order is not physical chronology or a new persisted order. |
| Temporal kernel | Reuse `tripZeitpruefung` and `zeitereignissePruefen`, including closed estimate interiors, finite correlations, half-open intervals and coverage from merged #897. Extend/combine; do not fork or weaken the kernel. |
| Current graph | One current Trip plus complete canonical ohneTag inventory, original IDs, latest props; no shadow itinerary. Account refresh and Guest graph replacement remain authoritative. Revision alone is not an invalidation key. |
| Editing | Existing columns already support explicit start/end dates/clocks. Wire complete forms/validation/mapping/writes/readback using them. No added hosted column, unpersisted pretend field, JSON hidden in notes or second metadata store. |
| Timezone/current time | Current Trip has no persisted timezone/offset. Do not smuggle qualifiers via notes, place names, arbitrary caller extras or day assignment. Implement qualified-input logic and honest production fallbacks. No timezone package/database installation or geographic inference in this task. |
| Booking | Existing supported kinds and `unconfirmed/booked`, source `user`, remain. An activity or note cannot be marked externally booked by introducing a badge. No cancellation/refund state is invented. |
| Readiness | Consume existing supplied domain results; do not edit `lib/readiness/**`, trigger research or broaden #900. Exact item/task relations and supported section/traveller targets only. |
| Cost | Current amount/currency represents a stored amount, not paid/live/per-person/per-night truth. Count unique items once, disclose attribution, keep currencies separate and unassigned costs separate. |
| Location | Stage coordinates are stage context, not activity/venue coordinates. Use existing supplied canonical Place records only; no geocoding/tiles/routing calls. |
| Changes | Exact before/after saved snapshots or explicit unsaved edit preview, identity-resolved dependencies and current write validation; no historic change reconstructed from a timestamp or no automatic cascading mutation. |
| External feeds | Strict separate consumers with empty production input by default; no fake current data, dynamic arbitrary fetch URL or service signup. An external service being absent is not a successful empty response. |
| Parallelism | #900 owns Official Truth and additive package.json scripts. This task does not modify package.json, lockfiles or any readiness/Official Truth path. Its acceptance runner is called directly with existing tooling. |

Phase A must record exact actual interfaces/pins and any remaining detailed decisions in task-owned CONTRACTS, then immediately implement. New internal pure contracts are permitted in this domain; they must respect these decisions. Only a real irreconcilable safety/ownership/schema contradiction warrants escalation.

## 5. Workstream A — complete actual daily planning and save experience

Create a calm integrated day view with chronology/dayparts/flexible items, clear selected day/stage, prior/next day navigation and a compact day summary. Preserve overview/organize/preparation modes and safe deep links. Empty and long trips remain usable. No arbitrary redesign of the whole website.

Implement real add/edit flows for user-owned manual activity/note/appropriate basic points using the EXISTING saved fields: title, note, explicit dates, start/end local clocks where applicable and existing day assignment. A selected-day date can be visibly prefilled in a NEW form and becomes a user fact only on explicit successful save; never retroactively fill old data or treat day membership as its implicit source. Missing date/end remain possible and clearly described. Gregorian validation and overnight/Date-Line distinctions remain. No automatic duration from the next item.

Flights, stays, mobility and rentals use their existing dedicated validated mutation paths and commercial-protection rules. Do not downgrade a structured itinerary to summary fields or modify provider-owned/protected fields through a generic editor. Keep booked status and stored price untouched on unrelated edits. Unsupported edits lead to the genuine relevant editor, not a pretend successful button.

A day move/unscheduling changes only the explicitly chosen placement through an authorized path; it does not silently change protected commercial dates. Persisted truth after refresh must match what was accepted. For new or expanded single-row writes use strict closed input, server-verified user, current same-trip ownership/membership, expected current row version or existing revision protocol and a confirmed affected row; zero rows/stale version is not success. Do not add an unchecked service-role write, TOCTOU read-then-unconditional overwrite or lose concurrent edits. Reuse the existing transactional/revision path for multi-row changes; if unavailable, do not emulate atomicity with independent writes.

Fix historical F02 save/reclassification focus if reproducible: after a saved flight moves out of the current day/section, restore focus and scroll to the actual saved item or valid parent, with an accurate accessible status. Never strand the visitor at the footer or claim saved before authoritative readback. Error leaves form contents intact; retries do not duplicate; context switches and late replies cannot overwrite the new selection. Resolve relevant F05 raw internal state tokens in accessible names; visible/human status language, keyboard Back/Escape and focus return are mandatory.

Do not use native confirmation for every routine edit. Destructive/user-facing operations retain appropriate explicit intent/confirmation; developer no-routine-approval permission does not remove visitor consent.

## 6. Workstream B — connected status and actions, not more disconnected cards

Connect each row and the day summary to current stored booking and relevant Preparation data. At most one primary secondary hint per row; additional evidence under details. At most three expanded priority groups at day level, with lossless disclosure beyond that. Deduplicate by true source identity, not similar text.

Booking copy distinguishes planned/selected, user-confirmed booking and open/stale personal confirmation checks. Personal done/skipped cannot resolve an Official requirement. Missing official data is never not-required/green. Preserve all traveller/credential alternatives; no first traveller or first passport. Trip-wide or ambiguous occurrence evidence stays trip-level rather than falsely repeated per day.

Navigation uses current `PreparationZiel`, `queryFuerModus`/`modusUrl` and original item/day refs. Exact supported sections are reisende-dokumente, offizielle-anforderungen, tickets-buchungen, eigene-vorbereitung. Do not fabricate task-row anchors where only section/traveller targeting exists. Deleted/ambiguous targets fall back safely and never auto-run a check or search. Keep existing Reise ändern/Reisebegleiter entry points reachable and contextually anchored; this task does not activate new model calls or change their trust/confirmation boundaries.

## 7. Workstream C — movements, gaps, buffers and next orientation

Implement the remaining PURE evaluator families from #889 with typed input/output, computational bounds and per-family coverage, then connect them to the same day view through a conservative adapter.

### Directed movements

Use canonical route topology and exact endpoints/occurrence, inspect full inventory including unplanned and ambiguous plausible candidates. Date/name/title/DOM adjacency alone cannot prove a movement or cover one. Output present_in_plan / missing_in_plan / not_evaluable / precisely justified not_required. “Transfer fehlt im Plan” requires the full accepted conjunction, not merely absence of a transfer row. Do not consume zoneless `minutenZwischen` as verified elapsed time. Existing transfer/flight/stay/rental facts retain their provenance and scope. A qualifying missing movement opens a real prefilled editable movement flow, never saves automatically.

### Gaps and buffers

Compute gaps from the UNION of comparable occupied intervals; nesting, midnight, unplanned commitments and same-day mixed contexts must not create false free time. Civil-only values may be shown only as differences between explicitly shared local clocks, not elapsed or usable time. No artificial 00:00/24:00 empty-day window. Usable windows require all accepted schedule, travel, phase inclusion, placement, policy and completeness predicates. Unknown term is not zero.

Implement versioned policy/phase evaluation and overlap/inclusion deduplication. Production operational-margin registry stays empty: no universal airport/check-in/security minimum. Optional explicit visitor-entered what-if margin may be evaluated as a clearly labelled SESSION-ONLY planning assumption, scoped to the exact current transition; never persisted secretly, never called required and never applied to Official/booking truth. Reset/invalidate assumptions on relevant graph/context changes and disclose they are unsaved. Do not add a default numeric margin. Separate code-policy, exact saved schedule and estimate results; estimate cannot certify physical feasibility.

### Next orientation

Implement qualified-clock/candidate semantics from #889, including ties, overlapping uncertain candidates, boundary equality, start-only events, expired clock and resume/clock-jump invalidation. Pure evaluation receives the clock, not hidden Date.now. No new external time service. The live adapter must NOT elevate device time or infer destination timezone.

Without qualified instants/clock, provide a useful **Geplante Reihenfolge / Nächster Punkt im Plan** anchored to the selected day/item and clearly a navigation sequence, never “jetzt”, “heute”, a countdown or actual completed attendance. A selected future day cannot replace trip-wide next-now truth. Do not use fixture-only qualified input in production to make this look live. Qualified consumer capability and current production fallback are separate acceptance results.

## 8. Workstream D — daily saved costs and location context

Implement original-currency subtotals with unique canonical item identity, explicit zero, missing/invalid prices and incomplete inventory. Separate assigned-day totals from unassigned/unscheduled amounts. A multi-day stay/rental price is attributed once to its canonical assigned day with that basis visible, not divided into invented nightly/daily prices. Do not add estimates to stored totals, infer payment, apply exchange rates or resurrect commercial data stripped during Guest->Account adoption. Show incomplete totals as incomplete. Budget comparison is only meaningful for compatible currency/scope and must not label partial subtotals as actual total trip cost.

Implement an accessible located/unlocated day list and optional compact schematic view using existing local assets/rendering and supplied exact coordinates. Stage pin says Etappenort; a place ID without coordinates stays unlocated. Same title is not same identity; zero coordinate is valid; invalid/nonfinite coordinates fail. Do not connect across hidden unlocated stops as a verified route, add street tiles, geocode, infer travel time or send private trip data outside Jetnity. Map/list is opt-in on mobile and never replaces the timeline. A missing provider does not justify fake pins or a nonfunctional map button.

## 9. Workstream E — proven change impact and recomputation

Connect existing mutation/refresh paths to exact before/after snapshot review in memory. Preview uses future tense; after confirmed save uses past tense; first load with no before snapshot claims no historical change. Track only proven dependencies: exact item-linked preparation tasks, canonical directed occurrence links and inputs actually consumed by summaries. Same date or city cannot manufacture a flight->stay/transfer dependency. Unknown relations remain separately unknown.

Counts are UNIQUE actionable dependent targets, not edges/reasons/re-rendered cards or the changed source itself. Changed cost/map summaries are not extra impacted plan points. Rebuild on time-only, location, price, status, deletion, day move and external freshness changes even if revision/domain fingerprints are equal. Do not rewrite canonical Readiness stale/current or user done status because this new projection wants a recheck. Reject stale async results and cross-trip refs. No automatic shifting, cancellation, rebooking or “fix all” writes.

## 10. Workstream F — external-context consumers without fake activation

Implement bounded closed, versioned consumer/projection contracts for weather, venue hours/reservation context and future routing/operational facts where needed by the integrated experience. Include exact subject/location precision, occurrence, units, source/observed/retrieved time, validity/freshness policy and unavailable/error/stale/conflict distinctions. Tests use explicitly synthetic qualified fixtures. A browser `verified:true`, note or provider name cannot admit trusted data. Default live source adapter returns unconfigured/unavailable and performs ZERO new network calls.

Weather is advisory; outdoor relevance cannot be inferred from title. Venue open/closed requires qualified current hours and exceptions at the exact venue/time; user notes are notes, not reservations. Actual directions/traffic are not a straight line. Optional unavailable features stay collapsed/on-demand without a noisy dashboard of placeholders. A successfully empty response differs from a missing provider. No bulk external retrieval, new API keys, provider signups/contracts/paid calls, map tile terms, new freshness constants or service activation.

These consumers can be SOFTWARE_COMPLETE_NOT_ACTIVATED. That status cannot hide an unimplemented internal module and is not LIVE_VERIFIED. Keep all remaining external dependencies in one final activation matrix, not repeated PO questions.

## 11. Data, security, performance and ergonomics

Preserve one Trip type and Guest/Account parity for identical stored inputs. Derived information stays in-memory and is not persisted/logged/telemetried. Existing Guest storage remains visibly local; no claim of full offline account availability or a new service-worker cache. Never leak private trip/user coordinates, names, IDs, bookings or session data into public evidence, URLs to external services, logs or repo screenshots. Only synthetic fixtures/evidence.

No new schema fields, hosted migrations, Auth/MFA/AAL/RLS changes, traveller registry/PII expansion, sharing/collaboration (#20), payments, launch/noindex/domain changes. Metadata shape inspection is not proof of owner authorization. Reuse server verified identity and RLS; no service-role shortcut. Consumer schemas reject unknown authority fields. Existing generic note/XSS and safe URL protections remain. Prevent unbounded O(n^2) work from being disguised as complete analysis; existing limits and explicit partial/error output remain, with no hidden event dropping.

Use current design tokens/brand, mobile-first and all breakpoints. Preserve Core anchors or compatible proven replacements, real keyboard/touch actions and 44px primary targets. No swipe/drag-only action, overflow, sticky-header overlap or lost result position. Correct pending/saved/error states and reduced motion. Do not globally change the site's theme to complete this task.

## 12. File ownership — broad enough for completion, no micro-allowlist loop

TASK itself is immutable. Ordinary necessary edits within this matrix are authorized without asking for each file; record why each changed path belongs.

- `lib/trips/**`: only Reiseplan projections, validators, existing-field CRUD/mappers/Guest storage, navigation, saved status/cost and related tests/fixtures. New cohesive helpers may live in `lib/trips/trip-plan-integrated/`; tests must be discovered by the EXISTING test glob. Preserve unrelated acceptance/commercial/source invariants.
- `components/trips/**`: only Plan/Workspace shell, new integrated Plan panels, current item/detail/form/F02 status-focus paths, Guest/Account wrappers and relevant audit clients. Traveller/Owner/Admin/Auth/security forms are NOT authorized targets. Purely optional downstream prop additions must remain backward compatible.
- `app/reisen/**`: narrow existing route/prop/navigation integration if needed; no new authorization bypass, global layout or unrelated pages. Dedicated local synthetic audit route only under the existing audit pattern and excluded from public feature claims.
- `types/trips.ts`: only backwards-compatible non-sensitive typing for existing fields/derived interfaces if actually necessary. No changes to Official Requirement/Traveller/Auth enums or invented persisted columns.
- Existing `lib/mobility/**`, `lib/route/**`, `lib/reiseaenderung/**`, `lib/activities/**`, `lib/account/world-map.ts`, `lib/places/**` and `lib/readiness/**`: consume READ-ONLY. Put stricter adapters/new Plan projections in lib/trips, not competing new domain algorithms or edits that collide with #900.
- `scripts/trip-plan-integrated-operating-experience-1/**` and a single root `scripts/trip-plan-integrated-operating-experience-1-audit.mjs`: integrated acceptance runner and owned local fixtures only. Optional local DB harness under `scripts/db/trip-plan-integrated-operating-experience-1/**`; no hosted target.
- Existing `scripts/trip-timeline-core-1-audit.mjs`, `scripts/trip-timeline-temporal-review-1-audit.mjs`, `scripts/trip-plan-premium-experience-4-audit.mjs`, `scripts/trip-workspace-contextual-navigation-1-audit.mjs`: narrowly justified selector/contract adaptations with assertions retained, never skip/green-on-failure.
- Task docs `docs/TRIP_PLAN_INTEGRATED_OPERATING_EXPERIENCE_1_{PLAN,CONTRACTS,REPORT,HANDOFF,SELF_REVIEW}_2026-10-07.md` and synthetic sanitized `docs/evidence/trip-plan-integrated-operating-experience-1/**`, including resumable STATUS and acceptance matrix.

FORBIDDEN: all #900/Official Truth paths; modifications anywhere in lib/readiness; package.json, lockfiles, dependencies, engines, .github, supabase, auth/roles/security configuration, global governance/continuity, other branches or broad unrelated refactors. Use existing tools with direct runner commands instead of a colliding package script. Additional path outside this matrix only for a real necessary contradiction, not to silently expand. Finish independent work before escalation.

## 13. Mandatory integrated acceptance

Create PLAN/CONTRACTS/STATUS and a stable acceptance matrix immediately, then execute all workstreams. One final direct runner command, using existing Node/tsx/browser tooling, must run tests and generate truthful machine-readable and readable reports. Do not add success placeholders. Internal pure tests must run under existing npm test discovery; browser proof is separately executed and logged, not claimed from CI if CI did not run it.

Minimum mandatory cases:
1. Existing chronology/ties/dayparts/flexible invariants and #897 closed-range red/green regressions remain active.
2. Real Guest browser create/edit with explicit dates/start/end -> successful save -> reload -> identical fields/identity. Missing date/end stays missing. Failed save retains input and produces no success.
3. Real Account code path strict validation and owner/session enforcement, stale version/zero row denial, correct authoritative refresh/readback and no old response overwrite. Test against owned local authenticated stack if available; a mocked DB is NOT authenticated persistence E2E. Record exactly which boundary was actually executed.
4. Structured flight Date-Line/multi-segment changes and stay periods preserve exact domain facts; unrelated price/booking unchanged. Generic editor cannot bypass protected fields.
5. F02 before/after reproduction: reclassified saved flight no longer strands focus at footer; reload/back/forward/Escape and deleted target return work. Human accessible status labels replace relevant internal tokens.
6. Stored booking + current/open/stale personal task + absent/conflicting/multi-credential Official data render distinctly and route to the exact supported Preparation target without network/research writes.
7. Strict movement need/coverage: correct direction, wrong-route same-date, reversed endpoints, duplicate/ambiguous candidates, incomplete inventory and unplanned transfers. Missing-in-plan never means no real ticket.
8. Gap union with nested intervals, midnight, touching boundaries, flexible obligations and unqualified clocks; no invented free window. Buffer phase overlap/inclusion/unknown policy and optional labelled unsaved assumption.
9. Next qualified fixtures: ties, uncertainty, start/end equality, current/past/start-only, expired/resumed clock and deleted item; real default fallback shows only planned order without countdown or device-zone inference.
10. CHF/EUR/missing/invalid/zero amounts, duplicate IDs, multi-day stay price once, unassigned costs, Guest adoption stripping and recomputation; no FX/paid/full-trip claim.
11. Existing stage coordinates vs unknown venue, 0/0, invalid coordinates, repeated names and unlocated intermediate stop; genuine accessible list and schematic opt-in, no network tiles or fictional precision.
12. Impact exact saved before/after, pure preview, absent old snapshot, clock-only changes, repeated dependencies, missing relation, late response, deleted/moved target. Count only unique proven targets; never cascade writes.
13. External consumers: valid synthetic source, missing provider, stale/wrong venue/date/currency/unit/region, conflicting source, unknown policy; zero calls by default and no injection of browser-asserted authority.
14. Browser end-to-end: open day -> edit/save -> inspect change/status/cost -> open exact Preparation/item -> return to origin, plus empty day, flexible-only day and long multi-stage trip. Use actual production components/Guest handlers, not all callbacks stubbed to success.
15. 360/390/768/1440 px each with ordinary and 200% text, keyboard/focus/reduced motion, portrait/landscape where tooling supports it. Add existing 320/375/412/820/1920 regressions as useful. Real devices, WebKit/Safari and screen-reader tests only claimed if actually run. Capture a small useful synthetic screenshot set, not hundreds of duplicate assets.
16. Full npm test, typecheck, lint, Production build, all existing six hygiene/mode checks, git diff --check, exact-head remote CI/Auth/Preview. No deleting assertions or restoring old unsafe semantics merely to get green.

Owned local resources only: an isolated loopback/socket PostgreSQL/Supabase test stack may be used if already available without paid service/new external credential. Stop/remove only resources created by this runner; refuse inherited hosted DSNs; never start unrelated global services or apply all outstanding Official Truth migrations. Synthetic JWT/auth helpers alone are not a real authenticated service test. If local auth/DB execution is impossible, complete code/other tests and mark that E2E BLOCKED with a runnable procedure, not PASS. No real account/customer data.

Final mandatory user flows cannot be declared complete solely from helper tests or screenshots. Report actual feature implementation, Guest E2E, Account E2E, cross-browser/device coverage and external activation separately.

## 14. Completion, checkpointing and reserved decisions

Produce cohesive internal commits to the SAME branch and resumable STATUS with exact next action. No new prompt at phase boundaries. New source work must be reviewable, not one generated unstructured monolith. Keep actual source-bound test manifests and inherited/new evidence clearly separated. Re-read remote before every push; preserve foreign changes and no force/reset. Main synchronization remains TL-coordinated while #900 works in parallel; never merge/rebase a foreign branch on your own.

At delivery: remote tree verified against local delivered tree, full Changed Files, immutable TASK blob, main/head/merge-base/ahead/behind, actual session/model/effort, tests/CI/Auth/Preview, accurate REPORT/HANDOFF/SELF_REVIEW and a feature-by-feature acceptance matrix. No invented percentage complete.

Classifications:
- `TRIP_PLAN_INTEGRATED_OPERATING_EXPERIENCE_1_READY_FOR_TL_REVIEW`: all mandatory software implemented, integrated paths and required automated gates pass, current functionality/fallbacks honest; any unrun environment/device/E2E proof remains separately explicit and is for TL to accept or block.
- `TRIP_PLAN_INTEGRATED_OPERATING_EXPERIENCE_1_PARTIAL`: mandatory internal implementation or required reproducible integration remains unfinished; enumerate exact missing flow, not “needs polish”.

Always separately report `guestEndToEnd`, `accountPersistenceEndToEnd`, `crossDeviceEvidence`, `externalConsumers` and `externalLiveActivation`. Allowed values distinguish VERIFIED, PARTIAL, BLOCKED/NOT_RUN and SOFTWARE_COMPLETE_NOT_ACTIVATED. No blanket “Reiseplan weltweit komplett fertig” from a scoped code milestone; live-provider and full product release readiness are separate.

External weather/hours/routing/timezone/provider/Official Truth/collaboration/hosted schema/paid-service decisions go into ONE consolidated remaining-activation packet. Do not repeatedly ask the user during independent approved work. A genuine safety contradiction, foreign writer collision or necessary unscoped action is the rare stop boundary.

**Stay Draft. Do not mark Ready. Do not merge. Do not launch another agent externally or start an unlisted follow-up. STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
