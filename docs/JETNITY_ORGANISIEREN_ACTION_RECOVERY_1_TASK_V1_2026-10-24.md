# Organisieren Action Recovery 1 — booking actions and manual rental lifecycle — TASK V1

Date: 24 October 2026. Immutable TL-owned task; never edit this V1 to fit the implementation.

- Cursor-Agent: **Jetnity Organisieren Action Recovery 1 — Cursor Generation 1**
- Issue: #992
- Branch: `fix/organisieren-action-recovery-1`
- Base main: **913cf9353fd33491d2bd3130b3c430cc88990200**, tree d1b7250c68bad2cfe67135fed1d6e5969c864162; mode NORMAL.
- Authority: explicit Owner instruction to continue ordinary development with larger parallel Cursor tasks while Support is pending.
- [R104 V1 precheck / exclusive ownership / integration](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6382797662).

## Start and identity gate

Read JETNITY_START_HERE.md, the Technical Lead / Cursor Agent Operating Standard, the current canonical #751 and linked R104 checkpoint, AGENTS.md, relevant current handoff/status, Multi-Agent Slice Planning Standard, Binding Slice Precheck, V1 build order and applicable quality/design/contracts. Historical current pins do not override live #751/main.

Before product code, publish a PLAN commit/comment with actual model, exact Cursor session ID/link, assigned logical name, base/head/merge-base/ahead/behind, observed source defects, allowed paths, synthetic proof strategy and remaining unknowns. Requested model **Grok 4.7 High Fast**. Attest actual model; no Auto or unrelated fallback and no invented session/UI rename claim. If unavailable, STOP and tell TL. Rename session only if a real supported capability exists; otherwise preserve logical name in repository evidence.

## Problem and required product result

Complete consistent asynchronous booking-status interactions across the existing four inventories and the manual rental entry. Each baseline booking handler sets a busy item then awaits onBuchungsstatus without catch/finally. Rejection strands the UI. Only the active row looks disabled, though every other handler silently returns while busy. Manual rental's ten fields stay editable during await; successful completion then clears potentially newer edits. Fix these existing UI lifecycles as one coherent Organisieren package.

Source-established findings are not a claimed Production incident. Reproduce actual mounted component failure/pending behavior before recording execution claims.

### Exclusive runtime write allowlist

- components/trips/FlugBestand.tsx — booking-status lifecycle/presentation only; flight-route editor contract readonly.
- components/trips/UnterkunftBestand.tsx — booking-status lifecycle/presentation only; existing stay-interval editor contract readonly.
- components/trips/MobilitaetBereich.tsx — booking inventory action only. Preserve the accepted R103 ManuelleVerbindung function implementation byte-for-byte.
- components/trips/MietwagenBereich.tsx — booking-status lifecycle and manual rental entry.
- Optional components/trips/useBookingActionLifecycle.ts for the actually identical local booking interaction, not a generic command/persistence framework.

Readonly seams: types/trips.ts, lib/trips/buchung.ts, schema.ts, aktionen.ts, gastspeicher.ts, all rental/mobility/coverage/route helpers and contract types; Guest/Konto workspace wrappers, callback signatures and server behavior. Global CSS/package/lock/workflow/config are readonly. A and B own their separate files.

### Acceptance criteria

1. Both existing booking-status directions work for flight, stay, connection and rental through the unchanged itemId/boolean callback. Stored trip data remains the source of booking status; UI success does not invent provider confirmation or optimistic business truth.
2. Returned domain error, rejected promise and immediate throw recover to usable UI with a comprehensible message. Explicit retry works; no permanent busy state or automatic retry-write.
3. Synchronous duplicate guard; actual per-inventory serialization and visible/assistive pending state agree. Other buttons must not appear available while their handler would silently refuse.
4. Late completion cannot update another trip/item/component context or steal focus from a newer interaction. Cover unmount/remount, trip change and disappearance/replacement of an active item; invalidate old ownership while allowing the new context to operate.
5. Manual rental's ten submitted controls stay stable while pending, errors preserve values, successful completion resets only the owned form. Duplicate submit, rejection/throw/domain error and explicit retry work.
6. Preserve empty/unknown fields, null place IDs/prices/availability/terms and the existing "Nutzerangabe, nicht Providerbestätigung" truth. Do not derive canonical IDs from names or placeholders.
7. Preserve exact payloads and all existing validation and rental coverage behavior. No server/account/guest mutation contract changes.
8. Existing R103 manual connection function stays byte-identical and its accepted interaction behavior passes regression. Existing flight-route and lodging-interval editor contracts remain unaffected.
9. Accessible pending/error/status announcements, keyboard recovery, 320/390/1280px and 200% reflow with actual styles. No focus theft, overflow or invisible action.
10. Actual mounted four-component harness with real booking/coverage/rental helpers and controlled synthetic callbacks: two rows per relevant inventory, both directions, success/error/reject/throw/retry, rapid duplicate, context change/late completion, all ten rental fields through pending/failure/success.
11. Test evidence explicitly identifies any stub boundary. Synthetic callback proof is not hosted-account, real persistence, provider, physical-device or screen-reader acceptance.

Baseline blobs: FlugBestand 75cc47f93d8382e876310dfa250ef685069e8bc5; UnterkunftBestand 98f4b67049909d5aa972aece7ad4b8c14b12749b; MobilitaetBereich 105c8a2a9a4d0b5b285395cfbf2951e411a6dc23; MietwagenBereich 08a7a68eebbcdd3ad5f1666db27f514561cc6f36.

## Multi-Agent Suitability

**Decision: MULTI_AGENT batch; SINGLE WRITER for this lane.** Three fresh Cursor Generation 1 authors operate independent Draft PRs from exact 913. A owns TripPlanner/Reiseidee; B owns guest list/initial read-recovery surface; C owns four inventory action surfaces. Each gets separate tests/docs. Shared contracts are readonly, TL retains global current-state and integration authority. Work assistants may independently analyze/reproduce/review without changing product files; they are not Cursor or Guardian.

Integration is **B → A → C**, with separate actual-main CI/Production/domain acceptance after each merge and fresh drift assessment before the next. Do not merge/cherry-pick/rebase unmerged sibling code. TL directs any main refresh through this same author/session; a changed head requires complete new gates. More authors do not enter this lane.

## Dedicated test and evidence write paths

- `lib/trips/organisieren-action-recovery-1.test.ts`
- `scripts/organisieren-action-recovery-1/**` — synthetic mounted real-component proof and fixtures only; runner reproducible from the repo, no runtime entrypoint.
- `docs/evidence/organisieren-action-recovery-1/**` — compact sanitized result JSON, inspected screenshots and proof notes. Do not commit browser caches, node_modules, built bundles or traces with private data.
- `docs/JETNITY_ORGANISIEREN_ACTION_RECOVERY_1_PLAN_2026-10-24.md`
- `docs/JETNITY_ORGANISIEREN_ACTION_RECOVERY_1_STATUS_2026-10-24.md`
- `docs/JETNITY_ORGANISIEREN_ACTION_RECOVERY_1_REPORT_2026-10-24.md`
- `docs/JETNITY_ORGANISIEREN_ACTION_RECOVERY_1_SELF_REVIEW_2026-10-24.md`
- `docs/JETNITY_ORGANISIEREN_ACTION_RECOVERY_1_HANDOFF_2026-10-24.md`

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
