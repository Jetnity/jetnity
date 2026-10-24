# Guest Trip Read Recovery 1 — honest list and workspace read states — TASK V1

Date: 24 October 2026. Immutable TL-owned task; never edit this V1 to fit the implementation.

- Cursor-Agent: **Jetnity Guest Trip Read Recovery 1 — Cursor Generation 1**
- Issue: #991
- Branch: `fix/guest-trip-read-recovery-1`
- Base main: **913cf9353fd33491d2bd3130b3c430cc88990200**, tree d1b7250c68bad2cfe67135fed1d6e5969c864162; mode NORMAL.
- Authority: explicit Owner instruction to continue ordinary development with larger parallel Cursor tasks while Support is pending.
- [R104 V1 precheck / exclusive ownership / integration](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6382797662).

## Start and identity gate

Read JETNITY_START_HERE.md, the Technical Lead / Cursor Agent Operating Standard, the current canonical #751 and linked R104 checkpoint, AGENTS.md, relevant current handoff/status, Multi-Agent Slice Planning Standard, Binding Slice Precheck, V1 build order and applicable quality/design/contracts. Historical current pins do not override live #751/main.

Before product code, publish a PLAN commit/comment with actual model, exact Cursor session ID/link, assigned logical name, base/head/merge-base/ahead/behind, observed source defects, allowed paths, synthetic proof strategy and remaining unknowns. Requested model **Grok 4.7 High Fast**. Attest actual model; no Auto or unrelated fallback and no invented session/UI rename claim. If unavailable, STOP and tell TL. Rename session only if a real supported capability exists; otherwise preserve logical name in repository evidence.

## Problem and required product result

Complete honest, recoverable guest-trip loading for the list and workspace. Existing gastspeicherLaden deliberately preserves its compatible API shape and returns an empty/null result for unreadable or invalid active data. GastReisen currently presents this as "Deine erste Reise beginnt hier"; GastArbeitsbereich collapses it into unavailable without a distinct recheck. PlanenCreateGate already distinguishes occupancy failures. Correct these consumer surfaces without reopening the accepted storage contract.

Source-established findings are not a claimed Production incident. Reproduce mounted actual consumer behavior with real storage/read logic and synthetic localStorage cases.

### Exclusive runtime write allowlist

- components/trips/GastReisen.tsx
- components/trips/GastArbeitsbereich.tsx — initial read/loading/error/unavailable/recheck state and presentation ONLY.
- Optional components/trips/gast-reise-lesezustand.ts and components/trips/GastReiseLesefehler.tsx, only narrowly scoped readonly state/presentation helpers.

Readonly seams: lib/trips/gastspeicher.ts, lib/trips/create-entry.ts, existing loader/occupancy/legacy APIs and formats; PlanenCreateGate.tsx; GastCreateLink.tsx; all guest workspace mutation callbacks, traveller/readiness/commercial wiring, Guest→Account adoption, KontoArbeitsbereich, server/Auth/DB code. C owns inventory components, A owns creation forms. Do not alter those files or introduce new storage authority.

### Acceptance criteria

1. Distinguish not-yet-observed/loading, genuinely absent, valid matching trip, valid different trip, invalid active bytes and unreadable storage. Never present an unverified empty state as "first trip".
2. Use existing readonly occupancy/preflight contracts appropriately. Account for a changed/inconsistent storage observation between preflight and load; fail honestly with a recoverable state instead of declaring absence from a stale or incompatible result.
3. Provide non-destructive "Erneut prüfen". It re-observes current storage and can recover if access is restored or the active value becomes valid/absent. No automatic reset/delete, invented recovery promise or fabricated Continue ID.
4. In invalid/unreadable cases preserve raw active/legacy/queue bytes and make zero mutation/adoption calls. Do not invoke a lossy fallback. No raw personal data or exception details in UI/evidence.
5. Genuine absence, valid existing trips and valid different-trip links retain appropriate existing behavior. A different existing trip is not a storage error and must not be silently substituted for the requested trip.
6. Preserve current valid-legacy migration behavior. Some successful existing loader reads can legitimately write a migration; report that accurately. Corrupt legacy/queue redesign is outside scope. Preserve valid queue listing behavior.
7. No stale result from a previous tripId may appear as the next workspace. Recheck/context changes have clear local ownership; no mutation callback signature/wiring changes.
8. Appropriate error/status semantics, keyboard access/focus, meaningful loading copy, 320/390/1280px and 200% reflow with actual styles. Avoid a misleading create CTA when draft existence is unknown.
9. Real-component proof with real storage/create-entry logic: absent/valid matching/valid different/invalid active/read throws; restored access; invalid→valid, invalid→absent recheck; tripId change; valid legacy and valid queue regressions. Record exact raw storage before/after and write counts for controlled fixtures.
10. Existing active-draft preservation, create-entry, storage and route behavior remain intact. Do not change existing test assertions to weaken the compatible loader contract.
11. Clearly separate synthetic component/storage proof from full hosted-account, physical-device or screen-reader verification.

Baseline blobs: GastReisen c58076ec5237ae56c9af28a579034ca7e7c431b0; GastArbeitsbereich dba4274dc448cc452b9ed657e68cdc6b1636f727; readonly gastspeicher 1964cfc9b78f7361e23ff6fb9ccd64dbd3491399; create-entry eac2e408a74bf9b8174b6e3d5b74c5da80c02651.

## Multi-Agent Suitability

**Decision: MULTI_AGENT batch; SINGLE WRITER for this lane.** Three fresh Cursor Generation 1 authors operate independent Draft PRs from exact 913. A owns TripPlanner/Reiseidee; B owns guest list/initial read-recovery surface; C owns four inventory action surfaces. Each gets separate tests/docs. Shared contracts are readonly, TL retains global current-state and integration authority. Work assistants may independently analyze/reproduce/review without changing product files; they are not Cursor or Guardian.

Integration is **B → A → C**, with separate actual-main CI/Production/domain acceptance after each merge and fresh drift assessment before the next. Do not merge/cherry-pick/rebase unmerged sibling code. TL directs any main refresh through this same author/session; a changed head requires complete new gates. More authors do not enter this lane.

## Dedicated test and evidence write paths

- `lib/trips/guest-trip-read-recovery-1.test.ts`
- `scripts/guest-trip-read-recovery-1/**` — synthetic mounted real-component proof and fixtures only; runner reproducible from the repo, no runtime entrypoint.
- `docs/evidence/guest-trip-read-recovery-1/**` — compact sanitized result JSON, inspected screenshots and proof notes. Do not commit browser caches, node_modules, built bundles or traces with private data.
- `docs/JETNITY_GUEST_TRIP_READ_RECOVERY_1_PLAN_2026-10-24.md`
- `docs/JETNITY_GUEST_TRIP_READ_RECOVERY_1_STATUS_2026-10-24.md`
- `docs/JETNITY_GUEST_TRIP_READ_RECOVERY_1_REPORT_2026-10-24.md`
- `docs/JETNITY_GUEST_TRIP_READ_RECOVERY_1_SELF_REVIEW_2026-10-24.md`
- `docs/JETNITY_GUEST_TRIP_READ_RECOVERY_1_HANDOFF_2026-10-24.md`

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
