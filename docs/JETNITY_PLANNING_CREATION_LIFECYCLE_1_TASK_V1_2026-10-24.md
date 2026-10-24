# Planning Creation Lifecycle 1 — resilient manual and proposal creation — TASK V1

Date: 24 October 2026. Immutable TL-owned task; never edit this V1 to fit the implementation.

- Cursor-Agent: **Jetnity Planning Creation Lifecycle 1 — Cursor Generation 1**
- Issue: #990
- Branch: `fix/planning-creation-lifecycle-1`
- Base main: **913cf9353fd33491d2bd3130b3c430cc88990200**, tree d1b7250c68bad2cfe67135fed1d6e5969c864162; mode NORMAL.
- Authority: explicit Owner instruction to continue ordinary development with larger parallel Cursor tasks while Support is pending.
- [R104 V1 precheck / exclusive ownership / integration](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6382797662).

## Start and identity gate

Read JETNITY_START_HERE.md, the Technical Lead / Cursor Agent Operating Standard, the current canonical #751 and linked R104 checkpoint, AGENTS.md, relevant current handoff/status, Multi-Agent Slice Planning Standard, Binding Slice Precheck, V1 build order and applicable quality/design/contracts. Historical current pins do not override live #751/main.

Before product code, publish a PLAN commit/comment with actual model, exact Cursor session ID/link, assigned logical name, base/head/merge-base/ahead/behind, observed source defects, allowed paths, synthetic proof strategy and remaining unknowns. Requested model **Grok 4.7 High Fast**. Attest actual model; no Auto or unrelated fallback and no invented session/UI rename claim. If unavailable, STOP and tell TL. Rename session only if a real supported capability exists; otherwise preserve logical name in repository evidence.

## Problem and required product result

Complete the existing manual /planen and text/proposal creation/adoption lifecycle as one coherent package. On baseline, TripPlanner sets laeuft before awaited reiseorteBestaetigen and account reiseAnlegen without catch. Normal returned {ok:false} already works; actual rejection/transport failure can strand the form. Inputs/route controls remain editable against an earlier submitted snapshot. Reiseidee has the same rejected generation/account-adoption gap; its text/examples stay editable while busy. Guest storage catches and proposal warnings already exist and must remain meaningful.

Source-established findings are not a claimed Production incident. Reproduce the relevant branches with mounted real components and controlled synthetic boundary promises before describing them as executed evidence.

### Exclusive runtime write allowlist

- components/trips/TripPlanner.tsx
- components/trips/Reiseidee.tsx
- Optional components/trips/usePlanningCreationLifecycle.ts, only if a small shared UI lifecycle abstraction is actually warranted. No generic mutation framework.

Readonly seams: components/places/OrtSuche.tsx (existing disabled prop), VorschlagVorschau.tsx, PlanenCreateGate.tsx, lib/trips/gastspeicher.ts, create-entry.ts, schema.ts, aktionen.ts, anlegen.ts, lib/places/aktionen.ts, lib/reisevorschlag/aktionen.ts, canonical route/place/proposal mapping, guest/account/session identity and server idempotency. Do not expand these contracts or request a new dependency.

### Acceptance criteria

1. Manual guest and account create keep their current success, canonical selected-place validation, route order and validation focus behavior. Returned domain errors and rejected/thrown place-confirmation/account actions each leave recoverable, intelligible UI.
2. Every submitted input, including all origin/destination controls, add/remove/reorder, dates, travellers, budget and wishes, represents one stable draft while pending. Disable relevant existing controls and shared search correctly. No edit silently overwritten by an older request.
3. A synchronous ownership/duplicate guard prevents multiple action invocations before React renders pending state. Explicit retry is possible after failure; there is no automatic write retry.
4. Existing clientRef remains stable for a retry of an ambiguous/failed creation. Do not mint a new request identity to work around an unknown server result. Do not alter server idempotency or claim an already-sent account write was cancelled.
5. Proposal generation handles resolved error, rejection and unexpected throw; pending text/examples cannot change the active submitted request. Retry is usable with preserved input.
6. Proposal adoption handles returned error, rejection and throw; proposal, warnings and adoption clientRef survive failure. User can retry. Guest adoption retains specific existing storage/capacity errors and action-time preflight.
7. Unmount/remount and stale completions cannot update a newer component/request, navigate from an abandoned UI or begin an as-yet-unsent guest write. Check each relevant asynchronous boundary; do not merely guard setState after performing a stale write. Existing requests already sent to the account server have an explicit cancellation limit.
8. Actual guest storage preflight remains action-time and account mode remains independent of guest storage. Preserve existing valid-legacy handling. No overwrite of an existing draft.
9. Existing navigation, proposal change/discard behavior, focus and accessible error/status announcements remain usable. Do not add technical implementation jargon to user-facing copy.
10. Meaningful actual-component proof: both create paths, guest/account success, domain/reject/throw/retry, stable payload/clientRef, rapid double submit, pending route/text inputs, late completion/unmount/remount. Run real validation/route/mapping logic; stub only controlled action/router/storage boundaries and disclose each stub.
11. Check 320/390/1280px, keyboard and 200% reflow with actual styles. No horizontal overflow or inaccessible recovery controls. Do not claim physical-device, screen-reader or hosted-account proof from the synthetic harness.

Baseline blobs: TripPlanner 7fc7727d2974fd46c2210a20177417f529451911; Reiseidee 981eb75af0ec450db83eae71c0a5604f184a22d4. Existing source/layout tests and the earlier blocked-before-generation guest preservation proof do not establish these async branches.

## Multi-Agent Suitability

**Decision: MULTI_AGENT batch; SINGLE WRITER for this lane.** Three fresh Cursor Generation 1 authors operate independent Draft PRs from exact 913. A owns TripPlanner/Reiseidee; B owns guest list/initial read-recovery surface; C owns four inventory action surfaces. Each gets separate tests/docs. Shared contracts are readonly, TL retains global current-state and integration authority. Work assistants may independently analyze/reproduce/review without changing product files; they are not Cursor or Guardian.

Integration is **B → A → C**, with separate actual-main CI/Production/domain acceptance after each merge and fresh drift assessment before the next. Do not merge/cherry-pick/rebase unmerged sibling code. TL directs any main refresh through this same author/session; a changed head requires complete new gates. More authors do not enter this lane.

## Dedicated test and evidence write paths

- `lib/trips/planning-creation-lifecycle-1.test.ts`
- `scripts/planning-creation-lifecycle-1/**` — synthetic mounted real-component proof and fixtures only; runner reproducible from the repo, no runtime entrypoint.
- `docs/evidence/planning-creation-lifecycle-1/**` — compact sanitized result JSON, inspected screenshots and proof notes. Do not commit browser caches, node_modules, built bundles or traces with private data.
- `docs/JETNITY_PLANNING_CREATION_LIFECYCLE_1_PLAN_2026-10-24.md`
- `docs/JETNITY_PLANNING_CREATION_LIFECYCLE_1_STATUS_2026-10-24.md`
- `docs/JETNITY_PLANNING_CREATION_LIFECYCLE_1_REPORT_2026-10-24.md`
- `docs/JETNITY_PLANNING_CREATION_LIFECYCLE_1_SELF_REVIEW_2026-10-24.md`
- `docs/JETNITY_PLANNING_CREATION_LIFECYCLE_1_HANDOFF_2026-10-24.md`

No unrelated test rewrites or source-pattern-only proof of async behavior. Reuse existing tooling/dependencies. If a proposed file outside these or the runtime allowlist is genuinely necessary, STOP at that boundary and request TL scope decision before editing it.

## Boundaries and retained gates

No changes to global startup/handoff/ACTIVE_WORK_STATUS/current checkpoints, central ADRs/types, storage/identity/idempotency, server actions/API, Auth/RLS/Supabase/migration, provider/model/source activation, dependencies/lock/workflow/config or global styles. No hosted writes, real model calls, paid calls, credential reads or personal-browser automation. Use isolated disposable local Playwright with synthetic data. Do not imply account/Production behavior was verified through stubs.

#985/#982 R2 scoped HOLD remains: no retry/rephrase/reroute/alternate-agent/manual equivalent of the interrupted review. #917 denied hosted readback remains stopped; no alternative/apply. #968 cleanup remains PAUSED; no rotation/deletion/protection change or old-Preview inspection. #913/#911 blocked; #626 operator stop; Bern paused. Do not investigate these held code/data scopes. Ordinary imports of accepted stable contracts do not authorize a new held-scope review.

No special PO gate is crossed by this UI-only task. A new contract, persistence, session/identity, provider, paid activation, Production action or ownership collision is a STOP boundary, not permission to expand.

## Validation and exact-head handoff

Use Node 22 and existing commands. Run meaningful focused regression tests, mounted proof, typecheck and lint. Run available required local checks; full exact-head App/Auth CI and Vercel Preview remain mandatory TL gates. Do not weaken/skip/relax workflow gates or change timeouts. If environment prerequisites prevent a proof, report NOT VERIFIED and exact reason; never turn a skipped native/browser check into PASS.

Baseline main CI has 7,151 tests / 7,149 pass / 2 existing opt-in browser skips, 146 existing lint warnings, 11 install advisories. Those are historical limitations, not proof of this delta. Record exact commands, exits, counts, source head, proof fixture/stub boundaries, original log URLs and Preview if available. Mandatory final original-log review belongs to TL.

REPORT/SELF_REVIEW/HANDOFF must cover: changed paths, acceptance matrix, failure modes, truth/privacy/security/a11y/performance impact, current head/base/merge-base/ahead/behind, actual model/session, executed vs not verified tests, P0/P1/P2/P3 residuals, no-hosted/no-provider boundary, exact next step. Do not self-award Technical-Lead PASS.

### STOP

After implementation, focused evidence, complete delivery documents and final exact-head handoff, stop for independent TL review. **Do not mark Ready. Do not merge. Do not close the issue. Do not start a follow-up slice.** Same logical author and same actual Cursor session for immediate CHANGES REQUIRED fixes; every changed head gets full re-gating. Only TL decides integration and post-merge closure.
