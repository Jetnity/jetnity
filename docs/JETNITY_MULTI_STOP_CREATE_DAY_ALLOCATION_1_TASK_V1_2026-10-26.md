# Jetnity Multi Stop Create Day Allocation 1 — Cursor Generation 1

**R109-T · TASK V1 · 26 October 2026 · immutable Technical-Lead assignment**

## Goal and source-confirmed need

Complete an optional, explicit initial day-allocation journey for Zürich → Bangkok → Chiang Mai → Phuket, on the EXISTING structured creator for Guest and Account. Same-country destinations and repeated visits already work as ordered confirmed occurrences. Current create-stages returns unassigned for multiple stages and both creation paths give all days null stage references; the form explicitly says stays are not assigned.

Use the existing create RPC, which validates stage_position and derives assignment mode. Do not try to repair after-create Account assignment: reise_aendern does not update that mode. Existing duration editing adds/removes days; it must not be relabelled as distributing existing days.

This lane also owns narrowly bounded creation/import resource protection from COS018 because it owns the relevant entry/schema files. S owns dependency patches, not these files.

## Exact owned files

Existing:
- components/trips/TripPlanner.tsx.
- lib/trips/create-stages.ts.
- lib/trips/aktionen.ts: reiseAnlegen creation mapping and early guards in reiseAnlegen/gastreiseUebernehmen only; all other Actions frozen.
- lib/trips/gastspeicher.ts: gastreiseAnlegen creation mapping and its input guard only; all other guest mutations/storage authority frozen.
- lib/trips/schema.ts: additive optional creation allocation contract, its validation and bounded payload-interest checks only; do not alter unrelated read/write/Official Truth/commercial schemas.
- types/trips.ts: additive optional CreateTripInput allocation fields/types ONLY; other canonical types frozen.
- lib/trips/anlegen.ts OPTIONAL guard immediately after existing authentication and before graph mapping; preserve RPC, route writers, error/identity logic.
- Relevant existing regressions: lib/trips/create-stages.test.ts, lib/trips/schema.test.ts, lib/trips/gastspeicher.test.ts, lib/trips/day-stage-truth-contract.test.ts, lib/trips/uebernahme.test.ts.

New:
- components/trips/TripStageDayAllocation.tsx; owner-local components/CSS under components/trips/multi-stop-create-day-allocation-1/.
- lib/trips/create-day-assignment.ts and .test.ts.
- lib/trips/input-resource-bounds.ts and .test.ts.
- Additional owner-local helpers/tests under lib/trips/multi-stop-create-day-allocation-1/.
- scripts/multi-stop-create-day-allocation-1/** and own docs/evidence.

READ-ONLY: lib/trips/uebernahme.ts, day-stage-assignment.ts, zuordnung.ts, timeline.ts, all lib/reiseaenderung/**, all place confirmation/route/transit/activities/flights/mobility/provider/world-map/readiness contracts and all SQL. No new route endpoint/public test page or package changes.

## Acceptance A — explicit initial allocation and honest time

1. Preserve no-opt-in behavior: existing multi-destination creation remains unassigned and single-destination behavior remains valid. Do not invent city choices from a country.
2. Let the user explicitly distribute EXISTING calendar days to confirmed destination occurrences. A14-day trip assigned3/4/7 stays exactly14 days with the same start/end, not28 days.
3. Partial assignment is allowed only honestly: all untouched days stay null. No equal/proportional/default assignment of remaining days.
4. Same-country destinations remain distinct. Bangkok→ChiangMai→Bangkok must retain three occurrences even when first/third share placeId. Bind to the occurrence, not country/name/placeId alone.
5. Only valid stage occurrences and days in the chosen interval; reject duplicate day claims, overlaps, foreign/out-of-range/decimal references and oversized collections before persistence.
   For this NEW creator allocation, known day assignments must follow destination occurrence order when null days are ignored. Reject contradictions (including those introduced by route reorder); require explicit user correction. Never silently reorder destinations or redistribute days. Repeated visits require distinct occurrences. Existing stored/legacy contracts are not retroactively reinterpreted.
6. Reorder/remove/replace a destination or change dates cannot silently transfer allocation to another occurrence/day. Preserve a stable association or explicitly invalidate it for renewed user choice.
7. Use one pure transformation for Guest and Account. The server re-confirms places and constructs dates itself. Never trust supplied names/coordinates/country or accept a client-built replacement graph.
8. Guest graph, Account RPC payload and existing Guest→Account mapper preserve the same order/day positions/mode through the frozen persistence seam. Preserve client_ref idempotency, existing guest-slot checks and storage-failure behavior.
9. Calendar-day presence does not prove hotel nights, check-in/out, flight or transfer times. Keep multi-stage arrival/departure dates unknown unless explicitly supported by the existing canonical contract; do not infer a hotel stay interval merely from day counts.
10. Trace a graph produced by the actual create path into existing timeline and ActivityTageskontext: the selected city/day is correct; unassigned stays unsearchable; allocation fires no provider request.
11. UI uses existing design/lifecycle, clear remaining/unassigned day counts, explicit validation/focus, keyboard and mobile. No new itinerary model, model call or post-create route editor.

## Acceptance B — bounded resource preflight

1. reiseAnlegen and gastreiseUebernehmen must reject oversized collections BEFORE their first Zod safeParse/element validation. Zod max or superRefine alone is insufficient under3.25.76.
2. Reuse canonical limits:50stages,366days (TAGE_MAXIMUM),1000items TOTAL across days+ungeplante,49additional destination IDs. Form interests preserve the current duplicate-tolerant TRIP_INTERESTS.length*2 bound; guest interests receive a finite compatible bound. New allocation counts are bounded by canonical days/stages.
3. Bound top-level lengths, sum at most366 day-container item lengths, reject aggregate overflow BEFORE visiting item contents, then inspect at most1000items.
4. Guard present route_itinerary collections on ALL items, including non-flight items, because Zod parses them before the non-flight transform drops them: max6legs, max8segments per leg. No route-schema changes.
5. Resource preflight does not replace semantic Zod validation, truncate arrays, repair references or fabricate validity. Avoid eager spreading/mapping/cloning/JSON-stringifying before length checks; do not recursively walk arbitrary unknown data.
6. Small sentinel tests prove early rejection without invoking element validation; include sparse over-limit arrays, aggregate overflow, oversized non-flight itinerary, malformed containers and frozen valid inputs. No stress/OOM or live requests.
7. Avoid schema↔guard circular imports. Optional anlegen guard is defense before mapping, never a replacement for entrypoint preflight. The third proposal path is outside this narrowed pre-parse claim; do not say Zod is globally remediated.

## Required behavioral proof

Actual Guest creation, Account creation payload and takeover mapping using synthetic confirmed places. Cases:14days3/4/7; first3assigned/rest11unknown; repeated Bangkok occurrences;0/1/50stages and day boundaries; missing/changed confirmed places; date/range changes; day1→Phuket/day10→Bangkok against Bangkok→ChiangMai→Phuket is rejected, including contradictions introduced by reorder; leap-day/month transitions; no-opt-in/single-stage regressions; duplicate activation/lost acknowledgement/existing guest/full or unreadable storage. Actual mounted planner must prove accessible allocation, reorder/reset, submit and follow-on graph context.

Read the existing create RPC source/migration and TW6 mode contract; do not query/apply hosted SQL. If an existing isolated local proof is available it may be used without provisioning; otherwise state exactly which Account payload behavior was tested and that hosted persistence was not newly verified. Full post-create Account stage mutation remains a documented residual, not a concealed completion claim.

## Authority, baseline and execution contract

Parent [R109 #1026](https://github.com/Jetnity/jetnity/issues/1026) records the Product Owner's explicit 26 October 2026 request for substantial Phase-1 work in parallel. This is a finite five-lane batch, not an automatic follow-up to R108-A.

Baseline main **6ae344f4453b16514f9048083bb8b07396135fa2**, tree **3bbc26038dfd2d2da471fbc2dea9d0b8331b0d61**, operating mode **NORMAL**. Before work re-read mode, main, this exact task, #751, sibling metadata and your branch. Unexpected branch/main changes return to TL; do not overwrite another writer or independently merge sibling branches.

**Cursor-Agent: Jetnity Multi Stop Create Day Allocation 1 — Cursor Generation 1**  
Required actual runtime: **Grok 4.7 High Fast / `grok-4.7-high-fast`**. No Auto or silent fallback. First reply records actual model, session ID/link and logical name. Attempt supported visible rename; an unavailable cosmetic rename is not a blocker. An unavailable/unverifiable required runtime is a capability blocker before implementation.

One fresh genuine Cursor session owns this branch and Draft PR. Immediate review corrections stay in that session. Read AGENTS.md, START_HERE, Technical-Lead/Cursor standard, Multi-Agent Operating System, slice-planning standard, model/name discipline, relevant architecture/vision/roadmap/design/quality/continuity documents, Phase-1 build order/DoD and the exact source contracts below. Later live receipts supersede dated historical task statuses.

Record a concise source-confirmed PLAN, then **implement the authorized scope**. No routine plan-only stop and no repeated general Owner approval. This TASK V1 is immutable: do not edit it. A genuinely necessary frozen-file/contract change must be proposed to Technical Lead before implementation.

## Multi-Agent Suitability — MULTI_AGENT

Five separate branches from the same accepted main: **S dependencies; T multi-stop creation/input bounds; A Admin Security; U Admin Users; K Account home/export**. Your lane is **T**. File ownership is exclusive; shared dependencies are read-only unless explicitly allowlisted below. T alone owns trip create schema/actions; S alone owns package resolution. No shared CSS, workflow, global documentation or sibling-branch writes.

Planned integration **S → T → A → U → K**. Root reviews each exact head independently and evaluates drift after every accepted merge. S changes the dependency baseline; later lanes require renewed combined-baseline gates. Authors must not auto-merge/rebase main or siblings. This task authorizes implementation from its seed, not integration.

## Common frozen boundaries

No hosted DB query/apply, new migration, RLS/grant/identity/Auth/session/MFA/AAL/capability change; no new sensitive fields, secret/environment changes, real provider/model requests, provider activation, payment, external terms, indexing/launch or new infrastructure cost. Existing native CI is allowed, not an alternate hosted SQL readback. No personally signed-in browser/CUA. Synthetic/local tests use blocked external networking; do not exercise real accounts or administrative mutations.

Preserve #985/#982 HOLD without inspecting held implementation as a substitute; #917 denied hosted-readback STOP; #913/#911 blocked; #968 cleanup PAUSED; #748 personal-browser SUSPENDED; #626 STOP; #937/#936 PAUSED; #934 HARD-BLOCKED; #944 no autostart; #585 deferred; #960 separate; #957 dormant. Official Truth OFF, noindex/prelaunch, Production provider hard-off and USD100/month remain.

Never modify AGENTS/operating mode/workflows/rulesets, shared auth/policies, global CSS or global continuity documents. For any file not explicitly owned, STOP at that boundary and report the exact proposal to TL. Root maintains global status.

## Verification and handoff

Use the project's Node 22 runtime and existing toolchain. No OS-package installation or infrastructure provisioning. Run focused meaningful behavioral/counterexample tests, typecheck, lint, the five existing hygiene checks and production build; run the existing test command and report all failures/skips honestly. Do not add tests that merely repeat version literals or source implementation. Do not weaken existing tests to conceal a failure.

For product UI, exercise actual mounted production components with project CSS using the existing isolated audit approach, synthetic fixtures and blocked external network. Prove clicks/keyboard/focus and real outcomes, not helper predicates alone. Include 320/390px, tablet and desktop, enlarged text, long content and error/recovery states. Do not ship an ungated public audit route or claim real-device/hosted acceptance.

Owned documentation prefix **docs/JETNITY_MULTI_STOP_CREATE_DAY_ALLOCATION_1**: PLAN, STATUS, REPORT, SELF_REVIEW and HANDOFF dated 2026-10-26; evidence under **docs/evidence/multi-stop-create-day-allocation-1**. Preserve original failures and limitations. Do not publish credentials, private logs, raw personal data or browser state.

Handoff must contain actual main/head/tree/merge-base/ahead/behind, changed-file list, exact session/model, tests and browser execution provenance, checked/not-checked systems, P0/P1/P2/P3 findings, CI/Preview links when available, remaining gate and next responsible actor. A callback acknowledgement, synthetic fixture or successful build is not persistence/Production proof.

Keep this PR Draft. **STOP for independent Technical-Lead review.** Only Root may PASS, Ready and merge.  
**do not mark Ready · do not merge · do not start a follow-up slice**
