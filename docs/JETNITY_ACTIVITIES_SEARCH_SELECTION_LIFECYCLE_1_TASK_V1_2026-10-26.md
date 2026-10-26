# R108-A — Activities Search and Selection Lifecycle 1 — TASK V1

Date: 26 October 2026 Europe/Zurich.
Baseline: main `cdc5b47163c2f1bb272fb46ed6723e9522489e92`, tree `7e640be34c051feb2fd2f757e1a039f332121cae`, mode NORMAL.
Tracking: [#1024](https://github.com/Jetnity/jetnity/issues/1024).
Parent context: [Viator provider clarification #1023](https://github.com/Jetnity/jetnity/issues/1023). This task is genuinely provider-independent Jetnity product work; it does not implement the Viator API.

## Authority, goal and bounded product value

The Product Owner explicitly asks to prepare and continue building the activity area while the Viator reply is outstanding. Root corrects the previous overbroad impression that all activity work must wait. Improve the existing day-based Activity surface now, without provider content, keys, network requests to any external provider, vendor-specific schemas, or live activation.

Goal: a deliberate, understandable search and reliable result/selection lifecycle in the existing Trip Workspace. The same implementation must behave coherently for guest/account callers through their existing frozen contracts. No second search surface or generic framework.

Read `JETNITY_START_HERE.md`, `AGENTS.md`, the Technical Lead/Cursor operating standard, the current R107 handoff/status/checkpoint plus live #751, `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`, `JETNITY_VISION.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md`, `DESIGN_SYSTEM.md`, quality/continuity standards, `docs/ACTIVITIES.md` and the actual relevant source/tests. Historical pending-docs/old provider decisions are not current writer evidence. #1023 does not prove an API integration or vendor approval.

This bounded work is within the Owner's current activity-preparation request. It does not reorder the large build programme, declare Activities V1 complete, open TW-8, or authorize another slice.

## Multi-Agent Suitability

**Decision: SINGLE_AGENT.** One owner for the tightly coupled component/request/selection lifecycle. Root and internal read-only specialists inspect independently; none edits the agent's branch. Work continues provider clarification and later independent integration review, with no code changes. A second writer would overlap the same contracts/files. No parallel Viator implementation.

Cursor-Agent: **Jetnity Activities Search and Selection Lifecycle 1 — Cursor Generation 1**.
Branch: `feat/r108-activities-search-selection-lifecycle-1`.
Use one fresh genuine Cursor session; retain it for immediate review fixes.
Runtime: `grok-4.7-high-fast`, matching the last evidenced available runtime. Attest actual model and session ID/link; no Auto or silent fallback. If this runtime cannot be selected/verified, report the capability gap before implementation.
Only Technical Lead can Ready, PASS or merge.

## Independently inspected source findings

- `components/trips/AktivitaetenBereich.tsx` blob `5ee93b8a5886acfd94c64567134e6505cc95c458`: requests on mount/serialized context changes; effect cleanup guards promises, but render/selection has no result owner; membership is option-ID-only; adoption await has no catch/finally and state-only pending is not a same-tick claim.
- `lib/activities/tageskontext.ts` blob `ab8664492d57b885822972502b286d5d32d73667`: current request payload does not carry trip.id. Local UI identity must distinguish identical payloads belonging to different trips.
- `lib/activities/client-anfrage.ts` blob `e7c4cd9444f8b0a642206c94d83d80318129bcc8`: JSON is cast, and a non-2xx body with a message may remain success-shaped/actionable.
- `components/trips/AktivitaetKarte.tsx` blob `2abbef0acfa8a283154687b85fc779d75696984c`: unsupported “Preis zum Auswahlzeitpunkt” label; current option has no quote timestamp/basis.
- Existing audit page is production-disabled; use its real component + harness. Do not add a product demo.

These are source-confirmed issues, not an executed RED proof or deployed-provider incident.

## Owned behavior / acceptance criteria

### A. Deliberate search and visible context

Show the existing destination, selected day/date, trip participant count and requested currency together, in normal German product language. Use canonical trip values; missing facts remain missing. Do not infer ages/adult counts or copy participant data into a new model.

A clearly labelled explicit search action starts the existing internal search route. Subsequent refresh/retry is also deliberate. Mount, remount, context/day changes and unrelated rerenders must make zero search requests. No timers, background retries, prefetch/fanout or availability calls. Preserve the shared controlled day selection from TripWorkspace.

A relevant context change immediately invalidates previous results/actions and exposes the appropriate initial/search-again state. Missing destination/day relation remains honest and non-actionable; a missing date is displayed and follows the existing generic search contract, not a fabricated date or vendor rule. Distinguish idle/loading/partial/empty/unavailable/timeout/error/invalid/rate-limit. No fake cards on product routes.

### B. Exact local response and event ownership

Bind every rendered result and adoption event to trip identity, stage/day, semantic request context and a fresh per-dispatch generation. Treat this as UI lifecycle identity only, never Commercial Provenance.

- Delayed responses cannot replace a newer context or request, even if a test double ignores AbortSignal.
- A → B → A cannot revive A1 as A2.
- Identical request payloads in two trip IDs never share ownership.
- Changes in date/participants/currency/search-relevant context and removed day/stage make old options non-actionable immediately, not only after effect cleanup.
- An old captured handler with an ID reused by a new response must not submit old option content.
- Suppress same-tick double submissions synchronously. Abort superseded reads; do not claim that browser abort cancels a server write.
- Preserve ordinary workspace section navigation behavior; focus/messages from a settled old operation do not intrude into newer user work.

### C. Robust adoption through the frozen callback

Continue using the existing `onUebernehmen(etappe, tag, option): Promise<string | null>` contract. Claim the operation synchronously before invoking it, bind its captured target, handle synchronous throws/rejections/malformed fulfillment, and release only its own busy ownership in finally. Different-context responses cannot clear a newer lock or overwrite its messages.

A returned null is only the callback's documented success report; router.refresh alone is not persistence observation. A returned string or thrown/rejected callback does not by itself prove that nothing was written. Keep unsuccessful/unconfirmed outcome language honest; no automatic replay, retry loop, “definitely not saved” assertion or exactly-once promise. Suppress duplicate dispatch of the current pending/accepted operation. For an unconfirmed outcome explain the need to inspect/reconcile the trip before another attempt; define the recovery boundary in PLAN. Do not invent a readback endpoint or silently unlock on unrelated props/search changes. If stronger recovery truly requires a frozen parent/writer change, report it to Root with a narrow proposal.

The mounted UI's ownership does not establish cross-tab/global write serialization or persistence certainty across a full unmount. Document this limit and do not expand scope into a new transaction system.

### D. Safe response boundary and honest card copy

Validate the existing neutral response envelope before rendering/action: known status, bounded strings/arrays, expected evidence booleans, valid existing option shape, labels/reasons/conflict. Reuse current neutral types/validators where safe; emit an allowlisted response rather than forwarding arbitrary fields.

Malformed JSON/body/options, invalid fields and non-2xx success-shaped responses produce safe non-actionable states without raw body/stack/secret exposure. Preserve valid existing partial/empty/unavailable/rate-limited semantics and AbortError handling. Validation never upgrades an error to success or invents missing commercial facts.

Use a neutral price label such as “Preisangabe” with the supplied amount and currency. Do not invent starting-price, per-person, group-total, checked/live/current/fresh semantics or a new price model. This does not solve the separately recorded ranking/price-role gaps for real provider integration.

## Exact file ownership

Runtime/UI:
- `components/trips/AktivitaetenBereich.tsx`
- `components/trips/AktivitaetKarte.tsx`
- `lib/activities/client-anfrage.ts`
- one narrowly scoped activity lifecycle module under `lib/activities/` if necessary; name and responsibility fixed in PLAN

Tests/evidence:
- `lib/activities/client-anfrage.test.ts`
- focused companion test for that new lifecycle module
- `components/trips/ActivitiesAuditClient.tsx`, only controlled audit seams
- `scripts/activities-ui-audit.mjs`, retain existing visual/keyboard checks while updating request expectations and adding the focused mounted lifecycle cases
- bounded synthetic evidence under `docs/evidence/activities-search-selection-lifecycle-1/`

Docs:
- immutable TASK V1 (Root-owned; do not modify)
- `docs/JETNITY_ACTIVITIES_SEARCH_SELECTION_LIFECYCLE_1_PLAN_2026-10-26.md`
- matching STATUS, HANDOFF and SELF_REVIEW files with the same prefix/date
- `docs/ACTIVITIES.md`, only this workflow and truthful remaining integration status
- concise bounded `ROADMAP.md` current-slice pointer; preserve historical evidence

An unlisted necessary edit is a scope question for Technical Lead, not an Owner approval loop. Report exact file/reason; do not self-expand.

## Frozen boundaries / non-scope

No edits to GastArbeitsbereich, KontoArbeitsbereich, TripWorkspace, server adoption/actions/proof/factory/provider/domain/ranking schemas, shared provider transport, Commercial Provenance, guest storage, auth/AAL/RLS/roles, Supabase/migrations, environment variables, CI/rulesets/package dependencies or audit activation gates.

No new API endpoint, age/Traveller/document model, product-detail/availability/affiliate flow, Viator adapter/SDK/schema/content/API/secret, real provider call, account login, booking/payment, production data/activation or public indexing. Test fixtures remain synthetic and confined to tests/audit interception; do not label them Viator data or real integration evidence.

The current activity provider factory and runtime proof remain null; Production hard-off and noindex remain. No cost model/infrastructure/budget change; USD100/month ceiling persists. Preserve all scoped holds in #751, especially #985/#982 and #917 denied hosted readback—no alternate query/connector/operator route. Do not inspect or resume held implementations.

## Execution, meaningful verification and handoff

1. Independently inspect the source/contracts, write a concise PLAN with exact file ownership, state/failure matrix, recovery boundary and proof commands. You may proceed within this TASK after recording PLAN; no additional Owner confirmation or routine plan-only stop is needed. Stop only on a real scope/capability conflict.
2. Implement the single bounded workflow. Do not add features merely because an adjacent gap exists.
3. Focused tests must cover zero automatic requests, exactly one explicit request, same-tick duplicates, ignored-abort stale replies, A→B→A, same-payload cross-trip, semantic invalidation, reused-ID stale handler, adoption string/null/throw/reject/malformed return, late-context settlement, and malformed/non-2xx success-shaped replies.
4. Reuse the existing actual mounted UI audit. Preserve layout/keyboard coverage and add focused Chromium/WebKit interactions at narrow mobile and desktop widths, with enlarged text, contained controls and visible focus. Assert network call counts. Exercise controlled day selection and section departure/return. A helper-only test is insufficient for rendered event/focus behavior.
5. Run focused activity tests and required typecheck/lint/build/hygiene gates. Native CI on the final exact head remains necessary; avoid redundant broad reruns unless they resolve a concrete risk. Do not weaken CI, increase timeouts, skip failures or treat missing-secret tests as executed. Review React best practices if multiple TSX components change.
6. Preserve precise stdout/exit codes and synthetic browser evidence; no private trips, account information, provider responses or secrets. A fixture UI audit is not a sandbox/API/certification result.
7. Publish STATUS/HANDOFF/SELF_REVIEW with exact main/head/tree/merge-base/ahead/behind, all modified paths, commands/results, genuine session/model/name, remaining limits and **STOP for independent Technical-Lead review**. A new head invalidates earlier head gates.

**do not mark Ready · do not merge · do not start a follow-up slice**.
Root handles independent review, same-session CHANGES REQUIRED, full re-gating, Ready/merge and actual-main verification. Author self-review is never TL PASS.
