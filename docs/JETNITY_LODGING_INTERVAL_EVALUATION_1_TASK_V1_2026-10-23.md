# Jetnity Lodging Interval Evaluation 1 — TASK V1
Issue #981. Branch `perf/lodging-interval-evaluation-1`.
**Cursor-Agent: Jetnity Lodging Interval Evaluation 1 — Cursor Generation 1**

## Baseline, authority and mandatory reading
Date: 23 October 2026. Parent batch: [R102 /6374289422](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6374289422). Owner expressly requested the next work and multiple Cursor agents. This is a finite assignment, not blanket follow-up authority.
Exact baseline: main **ba0725d6dd2ce3d5e170eb1eab03cedef2def1de**, tree **870c675d33895419a802ebc1f274da884a6e3351**. Operating mode NORMAL. Main PUSH CI40009901101 SUCCESS; Production dpl_9FQqZt74WzYQfYnUUFJZiuYaMV4U READY/exact main; jetnity.com separately maps to it. #975/#976/#979 are post-merge verified under6373375556. No old author is resumed.
Read JETNITY_START_HERE.md, AGENTS.md, current handoff referenced there, docs/ACTIVE_WORK_STATUS.md, newest #751/#748 material, TL operating standard, Binding Slice Precheck, Multi-Agent Slice Planning, current vision/architecture/roadmap/decisions/design/quality/continuity docs, and relevant source/tests before implementing. Live evidence wins. Do not overwrite global current state.
Requested model: **Grok 4.7 High Fast** (grok-4.7-high-fast). TL selects the previously accepted model for the newly Owner-authorized batch; historical6368365938 is not being rewritten as blanket later-task authorization. Report actual model and real Cursor session link/ID before material code; requested settings are not actual evidence. No Auto or unrelated silent fallback. Use the exact logical name below in PLAN/STATUS/SELF_REVIEW/HANDOFF and PR. Rename UI session only if a real supported capability exists; do not claim an unverified rename.

## Multi-Agent Suitability
Decision: **MULTI_AGENT** across R102; **SINGLE_WRITER** for this PR. Whole-source readiness, lodging UI and canonical interval calculation have separate write paths. Lodging lanes share only the existing unchanged public coverage/booking contract. Each has an exact-main branch and Draft PR; no unmerged cross-branch dependency.
TL integration priority: lodging UI → interval evaluator → whole-source. This is scheduling, not a change in product priority. Do not edit another lane, merge/rebase/cherry-pick another branch or rewrite history. Re-read origin/main before handoff and report drift; TL decides synchronization and fresh exact-head gates. Stop on a genuine path/contract collision.

## Protected boundaries / non-scope
No hosted Supabase/Development/Production query or write, migration, RLS/Auth/AAL/identity/role change, secrets, real account/customer data, personal browser/profile, government/provider/LLM/paid call, external contact, terms/contract acceptance, source admission, feature activation, deployment/alias manipulation or new dependency/workflow/configuration.
Normal existing CI/Preview may run from scoped branch pushes. Synthetic local computation and isolated local UI tests are permitted. No live DB/source tooling or account login. No raw private logs/archives/credentials in public evidence.
#917 denial6164202501 remains unresolved; Stage1 readback blocked, Stage2 NOT_ATTEMPTED; no retry/alternate connector/operator/manual workaround. #968 cleanup pause, #913 safety-blocked publication, #626 reserved stop, #934 Bern block, #937 pause, #957 dormancy, #585 vendor-text deferral persist. #955/#973 and older completed work are not reopened. Provider OFF; positiveVisaCells0. New recurring cost0; USD100/month ceiling unchanged.
P0: none newly established. P1#968/#748 remain unresolved independent risks, with Owner-approved ordinary-development separation. P2: this task's concrete defect plus unrelated source/hosting/privacy residuals. Preserve146 baseline lintwarnings/two existing conditional browser skips as dated limitations, not new PASS.
Global JETNITY_START_HERE/JETNITY_HANDOFF/ACTIVE_WORK_STATUS/architecture/roadmap/decisions/build-order/checkpoints are read-only for this batch. TL records any architectural decision centrally.

## Delivery, verification and STOP
Persist a concise task-owned PLAN before material edits. This TASK is immutable after dispatch; do not rewrite its contract. Use new versioned TL amendments if scope must change. Deliver task-owned STATUS, SELF_REVIEW and HANDOFF (and concise REPORT if useful).
Run focused meaningful behavioral regressions plus unchanged relevant existing tests; run typecheck/lint/build and repository hygiene checks appropriate to the final head. Full existing CI/Auth/Preview must be green on the exact final head for TL integration. A skipped/missing-secret check is not execution or PASS. Do not change test timeouts/workflows or weaken assertions to get green. Report actual failures, skips and unavailable verification.
Commit/push only this task branch. In the final PR comment report exact head/tree, freshly read main, merge-base/ahead/behind, immutable task blob, changed files, actual commands/results and CI/Preview links, actual session/model, excluded systems, remaining P0–P3 risks. Do not make an extra commit solely to quote its own final SHA; the PR comment carries final SHA.
**DO NOT MARK READY. DO NOT MERGE. DO NOT START A FOLLOW-UP SLICE. STOP for independent Technical-Lead review.** Agent self-review is never TL PASS. Immediate review fixes stay with this same writer/session; each new head invalidates prior exact-head gates.

## Objective / proved current defect
Replace per-night expansion INSIDE the existing canonical unterkunftAbdeckung evaluator with interval arithmetic. Preserve its public result exactly; do not create a second coverage evaluator or impose an arbitrary date-span limit.
- lib/trips/naechte-abdeckung.ts blob2d8bc61ccac73b20ebbd0a90f58ee22d65fe7ec0 creates each required night twice and every stay night before clipping; it also enumerates gaps to count them.
- lib/trips/schema.ts blob5063ead19ed2a9e99166d7942f88434e64b62a84 accepts valid ordered4-digit calendar dates for accommodation with no stay-span cap. Existing trip duration limits do not bound every stay/stage.
- Normal components/trips/UnterkunftBestand.tsx and lib/trips/arbeitsbereich.ts call the evaluator without a preceding resource budget. A bounded independent reproduction on original source with one1800-01-01→2200-01-01 stay over a14-night trip constructed146129 Date objects; stay length146097. Timing was illustrative, not an SLA.
- #955 Trip Audit and #973 Direct-Edit Preview already have conservative budgets; retain them unchanged. This task fixes the common reader, not those completed scopes.
- Targeted indexed search of naechteHalboffen was complete at precheck: definition, canonical test, #973 test and #973 immutable task; no other indexed Production importer. Verify local usage before writing.

## Exclusive write allowlist
1. lib/trips/naechte-abdeckung.ts
2. NEW lib/trips/lodging-interval-evaluation-1.test.ts
3. NEW docs/JETNITY_LODGING_INTERVAL_EVALUATION_1_{PLAN,STATUS,SELF_REVIEW,HANDOFF,REPORT}_2026-10-23.md as needed.
Existing tests are read-only: no assertion weakening or convenient expected-output changes. UI lane owns UnterkunftBestand.tsx. arbeitsbereich.ts, types, booking helpers, schema, actions/persistence, audit/preview budgets and configuration remain read-only.

## Frozen public contract and semantics
C01. Preserve export names/public types/return shape: UnterkunftAbdeckung, UnterkunftAufenthalt, UnterkunftZeitraum, UnterkunftLuecke, unterkunftAbdeckung and naechteHalboffen.
C02. Keep naechteHalboffen's current array behavior and date/invalid behavior; do not cap, truncate or return a false empty array. The evaluator must stop using per-night enumeration internally.
C03. UTC calendar-day half-open intervals[start,end), checkout excluded. Preserve existing validity decisions and source strings; no incidental date-parser repair.
C04. Required-time fallback exactly: all stage intervals valid→stages; zero/one stage→existing Trip fallback; multiple mixed-valid stages→bekannt=false with valid partial periods; multiple wholly invalid stages may use existing Trip fallback.
C05. Required nights are the union, counted once. Per-night stage ownership is the FIRST interval in original input order containing that night, regardless of position/date/length. Do not sort away ownership.
C06. Gaps are chronological, split at non-contiguity or changing stageId. Adjacent same-stageId regions may form one gap even with differing stageName; name is from gap start. No per-night Map is needed to preserve this.
C07. Stay coverage intersects the global required union; item.stageId does not filter coverage. Booked wins over selected for overlaps. Selected counts only coverage without booked overlap.
C08. Each stay retains FULL stay-night count including outside-trip portions. ausserhalb=true only when required union is nonempty and intersection is empty; partially outside stays remain false.
C09. Invalid/unknown stays preserve original startsOn/endsOn, nightsnull,statusunknown, outsidefalse. Unknown stays do not change the existing bekannt flag or numeric aggregates; existing summary still becomes unknown.
C10. Unknown overall need preserves aggregatesnull,luecken[], valid partial periods and per-stay results.
C11. Nonempty explicit ohneTag replaces reise.ohneTag; empty explicit argument falls back as before. Preserve item order/references and inputs without mutation, merging or deduplication.
C12. All existing summary strings/precedence remain. This task cannot revise B's shared coverage semantics.

## Implementation constraint and acceptance
C13. Evaluator work and retained collections scale with input intervals/items/overlap boundaries, never the number of nights between dates. Use arithmetic and finite sorted interval boundaries/union/intersection/difference. A reasonable quadratic interval algorithm is acceptable at existing input bounds; do not invent broad abstractions. No per-day loop hidden in a helper, Array.from, Set, Map or gap count.
C14. Existing canonical accommodation test and #973 preview tests pass unchanged, plus relevant audit/Workspace tests. Correctness before optimization.
C15. New independent differential oracle on SMALL bounded cases may enumerate days using the old specification; compare complete outputs across deterministic varied scenarios. This oracle must not be the new algorithm rewritten. Cover overlapping/nested/adjacent/disjoint stages/stays, reversed order and first-stage precedence, identical stageIds with different names, booked/selected union, mixed unknown and malformed dates, fallback cases, leap-year/month/year boundaries and without-day override.
C16. Long valid ranges (e.g.1800–2200 and valid4-digit extremes) covering/partially covering/fully outside a short trip must finish using bounded input-driven work while retaining full stay length and exact short-trip coverage. Also test long required-stage ranges, multiple overlaps and gaps. Use operation/allocation counting or explicit bounded algorithm evidence, not a fragile millisecond threshold. Never run the original huge per-night version as a stress oracle.
C17. No input date restriction, new unknown fallback due merely to duration, cap/truncation, public type change, schema/DB/new dependency, timeout increase or benchmark-only deliverable.

## First executable step
Report actual session/model ACK and read source/tests, then publish PLAN mapping the frozen semantics to a small interval implementation and meaningful regression. Stop on any required contract change; no second coverage engine.