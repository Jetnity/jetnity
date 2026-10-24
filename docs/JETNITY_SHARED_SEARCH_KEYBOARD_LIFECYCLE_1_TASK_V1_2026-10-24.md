# Jetnity — Shared Search Keyboard Lifecycle 1 — TASK V1
Date: 24 October 2026
Status: TL-versioned finite implementation task; Draft only; independent TL acceptance pending
Issue: #987
Author: **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**
Branch: **fix/shared-search-keyboard-lifecycle-1**
Requested Cursor model: **Grok 4.7 High Fast / grok-4.7-high-fast**

## 1. Authority and exact baseline
Owner explicitly requested further Cursor agents in the current session. TL selected exactly two independent R103 corrections after [fresh precheck6377421153](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6377421153). This task is one finite lane, not an automatic follow-up or permission to work on another issue.

Baseline main **e372f4d830c35a74a235d345c2baaf08ab615e6c**, tree **09f4ee368b137b6e4a918e950b94176fe32b583c**, NORMAL. Main PUSH40030350367 SUCCESS; exact Production dpl_ELweH1ABqNZYdt3bYgJ3HaME8HWD/domain verified. Read live state again; if your required source files or scope drift, report before expanding.

Before material implementation, report actual Cursor session ID/link and actual model, use the exact logical name above in every deliverable. No Auto or unrelated fallback. If the requested model is unavailable, STOP and report the precise limitation. Rename the UI title only if supported; never claim an unobserved rename. Commit a concise PLAN before code. Keep this TASK V1 byte-identical; only TL may issue an immutable amendment. Same author/session for immediate review fixes.

Read JETNITY_START_HERE.md, the named current handoff, the latest #751 checkpoint and newer #748 material, AGENTS.md, .jetnity/operating-mode.json, docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md, docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md, docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md, and relevant vision/architecture/design/quality/domain/tests. Historical status text does not reopen completed work.

## 2. Problem and user outcome
At current main OrtSuche (blob33c010656e8cd94a95f5d1426de92d4b7aa35278) and FlughafenSuche (blobbbbf41b0f9711a2a563d27935865d7a4b354a159), Escape only sets offen=false. The removed list leaves aktiv>=0 and aria-activedescendant referencing a nonexistent option. Both inputs lack a blur handler, so Tab/Shift+Tab can leave the popup open. TL independently confirmed the static chain; exact assistive-technology output is not claimed.

Make the existing combobox lifecycle coherent for keyboard and pointer use. Existing canonical Place-ID/confirmed-IATA selection, search request cancellation and result truth stay unchanged. Primary behavior reference: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/ . This is an ordinary accessibility correction, no new search feature.

## 3. Exclusive write allowlist
- components/places/OrtSuche.tsx
- components/airports/FlughafenSuche.tsx
- lib/suche/tastatur.ts and its existing tastatur.test.ts only for directly required keyboard/active-option logic; optionally NEW lib/suche/shared-search-keyboard-lifecycle-1.ts and .test.ts if one small shared invariant is genuinely needed. Avoid needless abstraction.
- NEW scripts/shared-search-keyboard-lifecycle-1/ local synthetic harness/fixtures only.
- Own documents/evidence in section5.

components/suche/Suchliste.tsx is READ-ONLY for the first implementation; its current onMouseDown preventDefault and selectable option structure must be understood. If correct pointer/touch selection requires changing it, stop and give a concrete minimal amendment request before expanding. Search request helpers/lage/relevance, endpoints, result shape, ranking, schema, TripPlanner and all other consumers remain read-only. Props/interfaces unchanged.

## 4. Acceptance
B01. Both comboboxes close their popup on Escape and actual focus exit (including Tab/Shift+Tab and external pointer focus). Preserve native forward/backward Tab movement; no focus trap, clearing of typed input or implicit canonical selection.
B02. After close, aria-expanded is false and no aria-activedescendant references a removed option. Reset/derive active option coherently; on every render a supplied active descendant must name a CURRENTLY RENDERED option in that input's list.
B03. The invariant also holds when results become empty/error/unavailable/loading or shorten after a response/parent value change. Do not let an old/out-of-range index select an unrelated hidden result.
B04. ArrowUp/Down and Enter still select the correct visible item. No Enter selection when the popup is closed. Returning focus/reopening works deterministically without a stale highlight.
B05. Existing click and touch selection works exactly once. Do not close/unmount options prematurely on blur so pointer selection is lost. Controlled parent updates and existing initialText/value synchronization continue to work.
B06. Real-component interaction harness with synthetic fetch responses for BOTH search components: ArrowDown→Escape, active result→Tab and Shift+Tab with focus target assertion, outside click, refocus→navigation→Enter, mouse/touch choice, short/empty/error/unavailable response and parent-change cases. Check document.getElementById for active descendant, actual popup visibility/selection callback, and canonical values. At least390px touch and1280px keyboard/pointer contexts. No hosted endpoint.
B07. Existing lib/suche tests, place selection synchronization and airport canonicalization tests remain green. No changes to query length, debounce, result ranking, async stale-response protection, selection meaning or allowed IDs/codes.

## 5. Verification and delivery
Use the existing dependency set. Provide a deterministic task-owned regression harness importing the REAL current components; isolated fresh disposable Playwright context, local synthetic props/responses only. No mock component substitute, source-string assertions presented as behavioral proof, public test route, real account, personal browser/profile, or hosted API/database calls. Block unexpected external requests. No dependency/package-lock/workflow/config/timeout changes. If a required browser cannot run, report NOT RUN/BLOCKED, not a conditional-skip PASS.

Run relevant existing tests and the new interaction harness. Report exact command, component source hashes, scenario results and viewport, separating static inspection from executed behavior. Existing complete npm test, typecheck, lint, setup/mode/API/schema/dead/export/dependency hygiene and build gates remain required on final head; ordinary existing CI/Preview from pushes is allowed. CI tests on preexisting unrelated code do not authorize investigating or repairing held scopes. No blind retry or weakened gate. Document the 146 existing lint warnings and two existing conditional browser skips honestly if present; do not manufacture a new skip to obtain green.

Own documentation only:
- docs/JETNITY_SHARED_SEARCH_KEYBOARD_LIFECYCLE_1_PLAN_2026-10-24.md (initial plan before code)
- docs/JETNITY_SHARED_SEARCH_KEYBOARD_LIFECYCLE_1_STATUS_2026-10-24.md
- docs/JETNITY_SHARED_SEARCH_KEYBOARD_LIFECYCLE_1_SELF_REVIEW_2026-10-24.md
- docs/JETNITY_SHARED_SEARCH_KEYBOARD_LIFECYCLE_1_HANDOFF_2026-10-24.md
- docs/JETNITY_SHARED_SEARCH_KEYBOARD_LIFECYCLE_1_REPORT_2026-10-24.md
- sanitized synthetic evidence, if useful, only docs/evidence/shared-search-keyboard-lifecycle-1/ (no raw logs/archive or bundle; no unrelated user data).

Handoff must pin final HEAD/tree, live main, merge-base/ahead/behind, task blob, changed files, actual session/model, tested source hashes, tests/results/CI/Preview, P0/P1/P2/P3 and first unfinished step. Avoid a self-referential final-SHA file loop: final exact HEAD belongs in the PR handoff comment, while committed notes name the runtime head plus later docs-only delta. New heads invalidate earlier gates.

## 6. Shared contracts, stops and integration
Public props, domain schemas, persistence/actions/API/ranking, provider status and unrelated components remain read-only. No new feature, redesign, engine, catch-all abstraction or state store. TL owns global START/HANDOFF/ACTIVE_WORK/central checkpoints, never edit them in this lane.

All protected gates remain: #985/#982 CHANGES REQUIRED R2 / scoped platform HOLD (same author stopped; specialist response pending), #917 hosted denial, #968 pause, #748 personal-browser suspension, #911/#913 safety block, Bern#934/#937, #626 and #957. Do not retry, rephrase, reroute, reproduce or investigate held work. No Supabase/SQL/migration/Auth/RLS/identity/secret/real account/provider/source/paid-call/contact/contract/payment/Production-data/launch/indexing operation; no new recurring cost.

One writer on this branch. Other R103 lane is read-only; no cherry-pick, rebase, merge-main or cross-branch edits without a specific TL integration instruction. Planned serial integration A then B; no implementation dependency. Push scoped commits and stop for independent review.

**DO NOT MARK READY. DO NOT MERGE. DO NOT START A FOLLOW-UP SLICE.**
Only ChatGPT / Technical Lead may declare PASS, Ready or merge. Author self-review and green CI are not TL PASS. If review finds a defect, correct in this same actual Cursor session, then provide a new head for full independent re-gating.
