# Jetnity — Manual Mobility Pending Draft Guard 1 — TASK V1
Date: 24 October 2026
Status: TL-versioned finite implementation task; Draft only; independent TL acceptance pending
Issue: #986
Author: **Jetnity Manual Mobility Pending Draft Guard 1 — Cursor Generation 1**
Branch: **fix/manual-mobility-pending-draft-guard-1**
Requested Cursor model: **Grok 4.7 High Fast / grok-4.7-high-fast**

## 1. Authority and exact baseline
Owner explicitly requested further Cursor agents in the current session. TL selected exactly two independent R103 corrections after [fresh precheck6377421153](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6377421153). This task is one finite lane, not an automatic follow-up or permission to work on another issue.

Baseline main **e372f4d830c35a74a235d345c2baaf08ab615e6c**, tree **09f4ee368b137b6e4a918e950b94176fe32b583c**, NORMAL. Main PUSH40030350367 SUCCESS; exact Production dpl_ELweH1ABqNZYdt3bYgJ3HaME8HWD/domain verified. Read live state again; if your required source files or scope drift, report before expanding.

Before material implementation, report actual Cursor session ID/link and actual model, use the exact logical name above in every deliverable. No Auto or unrelated fallback. If the requested model is unavailable, STOP and report the precise limitation. Rename the UI title only if supported; never claim an unobserved rename. Commit a concise PLAN before code. Keep this TASK V1 byte-identical; only TL may issue an immutable amendment. Same author/session for immediate review fixes.

Read JETNITY_START_HERE.md, the named current handoff, the latest #751 checkpoint and newer #748 material, AGENTS.md, .jetnity/operating-mode.json, docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md, docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md, docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md, and relevant vision/architecture/design/quality/domain/tests. Historical status text does not reopen completed work.

## 2. Problem and user outcome
The current exported ManuelleVerbindung in components/trips/MobilitaetBereich.tsx (baseline blob8560a106e4eb61a852b2f4ce27868ab30cf18cf0) captures draft A for await onAnlegen. Only submit is disabled; every input/select/textarea remains editable. Success clears the CURRENT connectionRef/note, so B typed during the wait can disappear; other B fields remain beside an A success message. TL confirmed this static chain, not a runtime reproduction.

Preserve the submitted draft while its save is pending. This fixes input loss and misleading success in existing manual trip editing without changing stored data contracts. PlanpunktEditor's pending controls on current main/#903 are precedent, not additional scope.

## 3. Exclusive write allowlist
- components/trips/MobilitaetBereich.tsx: **only exported ManuelleVerbindung and imports strictly required by its fix**. The outer MobilitaetBereich, mobility search, booking actions/tabs and MietwagenBereich remain unchanged.
- NEW scripts/manual-mobility-pending-draft-guard-1/ local harness/fixtures only (no hosted/account helper reuse).
- NEW lib/mobility/manual-mobility-pending-draft-guard-1.test.ts only if a meaningful executable regression fits the existing node suite; do not add a source-text-only mirror.
- Own documents/evidence in section5.

Existing lib/mobility/manuell.test.ts and payload/schema/day-stage/booking/provider/callback contracts are read-only. Prefer the smallest ordinary disabled-controls implementation; no global submission framework.

## 4. Acceptance
A01. While onAnlegen is pending, ALL submitted controls are non-editable: mode, day, origin, destination, departure/arrival dates and clocks, connection reference and note. Keyboard and pointer cannot create a newer editable draft that success will discard.
A02. Existing synchronous one-write guard remains effective, including repeated submit events before a render and Enter/click during pending. Exactly one callback invocation.
A03. Success applies to captured payload A; existing intended success reset/copy is preserved only after successful completion, with truthful user-entered provenance. No provider/booking confirmation is invented.
A04. Both a returned error string and a thrown/rejected promise restore editing, preserve entered values, show failure and never success. User can correct and retry once the prior operation settled.
A05. A late completion after unmount does not mutate a newly mounted instance. Keep existing lifecycle protection; do not introduce global refs.
A06. Actual hydrated component test: controlled deferred callback, real keyboard attempts during pending, released success and both error paths, duplicate-submit and unmount/remount. At least 320/390px narrow and1280px wide; labels, layout and focus remain usable. Assert captured payload and actual field states, not only disabled attribute strings.
A07. Existing Guest/Account callers and source-preserving route prefill stay contract-identical. No endpoint, persistence, validation, trip navigation or schema change.

## 5. Verification and delivery
Use the existing dependency set. Provide a deterministic task-owned regression harness importing the REAL current components; isolated fresh disposable Playwright context, local synthetic props/responses only. No mock component substitute, source-string assertions presented as behavioral proof, public test route, real account, personal browser/profile, or hosted API/database calls. Block unexpected external requests. No dependency/package-lock/workflow/config/timeout changes. If a required browser cannot run, report NOT RUN/BLOCKED, not a conditional-skip PASS.

Run relevant existing tests and the new interaction harness. Report exact command, component source hashes, scenario results and viewport, separating static inspection from executed behavior. Existing complete npm test, typecheck, lint, setup/mode/API/schema/dead/export/dependency hygiene and build gates remain required on final head; ordinary existing CI/Preview from pushes is allowed. CI tests on preexisting unrelated code do not authorize investigating or repairing held scopes. No blind retry or weakened gate. Document the 146 existing lint warnings and two existing conditional browser skips honestly if present; do not manufacture a new skip to obtain green.

Own documentation only:
- docs/JETNITY_MANUAL_MOBILITY_PENDING_DRAFT_GUARD_1_PLAN_2026-10-24.md (initial plan before code)
- docs/JETNITY_MANUAL_MOBILITY_PENDING_DRAFT_GUARD_1_STATUS_2026-10-24.md
- docs/JETNITY_MANUAL_MOBILITY_PENDING_DRAFT_GUARD_1_SELF_REVIEW_2026-10-24.md
- docs/JETNITY_MANUAL_MOBILITY_PENDING_DRAFT_GUARD_1_HANDOFF_2026-10-24.md
- docs/JETNITY_MANUAL_MOBILITY_PENDING_DRAFT_GUARD_1_REPORT_2026-10-24.md
- sanitized synthetic evidence, if useful, only docs/evidence/manual-mobility-pending-draft-guard-1/ (no raw logs/archive or bundle; no unrelated user data).

Handoff must pin final HEAD/tree, live main, merge-base/ahead/behind, task blob, changed files, actual session/model, tested source hashes, tests/results/CI/Preview, P0/P1/P2/P3 and first unfinished step. Avoid a self-referential final-SHA file loop: final exact HEAD belongs in the PR handoff comment, while committed notes name the runtime head plus later docs-only delta. New heads invalidate earlier gates.

## 6. Shared contracts, stops and integration
Public props, domain schemas, persistence/actions/API/ranking, provider status and unrelated components remain read-only. No new feature, redesign, engine, catch-all abstraction or state store. TL owns global START/HANDOFF/ACTIVE_WORK/central checkpoints, never edit them in this lane.

All protected gates remain: #985/#982 CHANGES REQUIRED R2 / scoped platform HOLD (same author stopped; specialist response pending), #917 hosted denial, #968 pause, #748 personal-browser suspension, #911/#913 safety block, Bern#934/#937, #626 and #957. Do not retry, rephrase, reroute, reproduce or investigate held work. No Supabase/SQL/migration/Auth/RLS/identity/secret/real account/provider/source/paid-call/contact/contract/payment/Production-data/launch/indexing operation; no new recurring cost.

One writer on this branch. Other R103 lane is read-only; no cherry-pick, rebase, merge-main or cross-branch edits without a specific TL integration instruction. Planned serial integration A then B; no implementation dependency. Push scoped commits and stop for independent review.

**DO NOT MARK READY. DO NOT MERGE. DO NOT START A FOLLOW-UP SLICE.**
Only ChatGPT / Technical Lead may declare PASS, Ready or merge. Author self-review and green CI are not TL PASS. If review finds a defect, correct in this same actual Cursor session, then provide a new head for full independent re-gating.
