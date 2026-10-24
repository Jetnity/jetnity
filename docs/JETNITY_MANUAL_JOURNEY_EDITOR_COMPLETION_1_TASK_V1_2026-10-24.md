# Jetnity Manual Journey Editor Completion 1 — TASK V1

Date: 2026-10-24. Immutable Technical-Lead task. Do not edit or reinterpret this TASK; request a named TL addendum for any needed ownership change.

## 0. Authority, identity and exact baseline

- R105 lane **C**, tracking **#998**, branch **`fix/manual-journey-editor-completion-1`**.
- Exact logical author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**. Fresh Generation1, one genuine Cursor writer for this branch.
- Requested model: **Grok4.7 High Fast**, expected identifier **grok-4.7-high-fast**. Attest actual runtime model and actual session ID/link; no Auto/unrelated fallback. If unavailable, STOP and report. Use a supported UI rename only if available; report performed vs not available honestly.
- Base actual main: **0c37d318c47a758f06634448d6e0de3856bbc6a6**; tree **5e7b61a111f94f16a27c80a8ec89e42ef7af62e8**; machine mode **NORMAL**. Re-read live values; never silently change base/contract.
- [R105 V1 TL precheck6385343244](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6385343244), [canonical current index#751](https://github.com/Jetnity/jetnity/issues/751). New explicit Owner instruction authorizes these ordinary larger tasks without routine reconfirmations. Previous R104 is closed; its agents stay STOP.

## 1. Required startup and pre-code gate

Read JETNITY_START_HERE.md, AGENTS.md, the Technical Lead Cursor Operating Standard, current handoff, ACTIVE_WORK_STATUS durable pointer, current#751/precheck, Multi-Agent Operating System, Multi-Agent Slice Planning Standard, Binding Slice Precheck/Continuity Gate2026-08-29, V1 Binding Build Order2026-09-01, relevant Vision/Architecture/DECISIONS/Design/ProductQuality/Continuity/Logic standards, current source and tests. Old dated current-state paragraphs are historical where current live evidence supersedes them.

**First delivery is PLAN ONLY:** commit `docs/JETNITY_MANUAL_JOURNEY_EDITOR_COMPLETION_1_PLAN_2026-10-24.md`, then post a PR comment with exact logical name/model/session, main/head/merge-base/ahead/behind, source-confirmed defects, proposed changes, exact owned paths, regression proofs, costs and unknowns. The seed TASK and this PLAN must be the only diff at this gate. **STOP for TL plan review before product/test implementation.** TL will authorize the same session; no new Owner prompt is required. Do not interpret @cursor alone as permission to skip this stop.

## 2. Product outcome

Drei vorhandene manuelle Formulare abschließen: Flugroute bearbeiten, Unterkunftszeitraum bearbeiten, Verbindung eintragen. Zielgebundene Entwürfe, verständliche Validierung, Pending/Fehler/Retry, Tastatur/Fokus und Reflow bis 320px/200% Schrift; keine alte Flugroute auf einem ersetzten Item.
## 3. Existing behavior and demonstrated source gaps

R104 deliberately kept these editors unchanged while completing booking/rental actions. R105 now explicitly owns the three editors; do not undo R104. Existing basic pending/catch behavior already works and must be reused.

- `ManuelleFlugRoute`47–202 has initial/schema-error focus and Escape, but async domain/throw errors112/118 do not trigger error focus; no inner target/request/unmount guard. Assigned row key295 is section-based; inner editor324 is not keyed by item. Replacing itemA with itemB in the same section can retain A segments while submitting the current B item.id. Reproduce and close this concrete wrong-target risk.
- `UnterkunftZeitraum`170–276 lacks initial/validation/async-error focus and Escape; late writes are not bound to editor target. Field error state stays marked until next submit.
- `ManuelleVerbindung`340–581 has pending lock and unmount guard, but state initializers349–358 do not respond to same-mount trip/preset changes. A late result may clear fields/report in a new context. Existing accepted evidence reports input x367 at320px/root32; correct actual reflow rather than masking it.

## 4. Exclusive runtime/test allowlist

- `components/trips/FlugBestand.tsx`: only ManuelleFlugRoute, its local FLUGFELDER/ROUTE_KNOPF/leeresFlugsegment helpers/classes and necessary imports; two manual editor callsites near324/360 may pass explicit identity/keys. Existing route-readback wrapper230–255 may change only if the PLAN proves it necessary for this editor's context. Booking-action behavior untouched.
- `components/trips/UnterkunftBestand.tsx`: only UnterkunftZeitraum, its local helpers/classes/imports and manual-editor callsite near133.
- `components/trips/MobilitaetBereich.tsx`: only ManuelleVerbindung, exclusively local editor helpers/classes/imports and its direct callsite near334. Search, provider, inventory and booking behavior untouched.
- Optional new `components/trips/useManualEditorLifecycle.ts`, `lib/trips/manual-journey-editor-completion-1.ts` and `.test.ts`, only for these three existing editors.
- Existing direct-hook test adapters `lib/trips/flug-manuell.test.ts`, `lib/trips/flug-route-form-validation.test.ts`, `lib/trips/unterkunft-manuell.test.ts`: only changes required by the actual editor shape, preserve existing domain/validation/behavior assertions.
- Explicit historical freeze migration: only ManuelleVerbindung SHA declaration/assertion in `lib/trips/organisieren-action-recovery-1.test.ts` and `scripts/organisieren-action-recovery-1/harness.mjs`. These previous R104 no-edit assumptions are superseded by this TASK for the named function only. Document lineage/new source binding and replace with or retain meaningful R103/R104 behavioral protection plus new mounted proof; do not remove/skip unrelated tests, change CI or overwrite historical reports/screens/manifests.

Read-only: useBookingActionLifecycle and all R104 booking/rental changes; MietwagenBereich; global organize-premium classes/OrganisierenFeldgruppe; TripIntegratedDay (existing keyed connection context must still work); TripWorkspace/GastArbeitsbereich/KontoArbeitsbereich; all schemas, types, airports/route/coverage projections, guest/account writers, SQL/RLS/providers. A's plan and guest deletion and B's account folder are not yours.

## 5. Binding functional behavior

1. Each editor draft and in-flight operation belongs to a stable trip+target+editor context. Opening another item/trip or replacing a flight within one section cannot reuse or submit an old draft against the new target. Same-target normal graph refresh must not discard an active draft needlessly. Plan explicitly distinguishes target change, preset change and ordinary save readback.
2. Preserve current domain rules: one-to-four connected manual flight segments, no truncation/flattening of protected multi-leg/oversize routes; existing manual-only guards; stay dates from explicit input; empty/unknown values stay unknown; connection-place references clear if text changes; no inferred provider, fare, schedule, route or booking truth.
3. Opening, local validation, domain-error/throw/reject, deliberate retry, cancel/Escape and success have accessible feedback and sensible visible focus after render. Corrected fields stop falsely reporting old invalidity. Do not focus a hidden/unmounted or replaced context.
4. Pending synchronously prevents double submit and mutation of the submitted fields/segments. Preserve existing draft on failure. Late completion from old request cannot clear/close/unlock/new-error/focus a newer form. Eventual stored readback remains authoritative; do not claim abort/rollback of an already-sent write.
5. Connection is an existing create contract without an idempotency key. Single in-flight lock is not exactly-once persistence after uncertain transport failure. No automatic retry, no hidden generated key or writer-contract extension. Distinguish error/unconfirmed outcome honestly without pretending a request definitely did not write. Deliberate user retry remains subject to that existing contract.
6. Preserve existing connection payload: only user inputs and existing explicit preset references; price/provider metadata remain null, no guessed stage/date/time. Success uses existing user-stated wording and clears only the intended fields in the submitting context.
7. Fix narrow/root32 field/control geometry locally. Preserve shared styles; add local min-width/width/wrapping rules where needed. No page overflow-hidden, viewport weakening, hidden form controls or manufactured screenshot success.

## 6. Required mounted and regression proof

- Real flight form: valid save, schema errors, async domain/reject/throw; retry retains segments;1–4 add/remove and larger/multi-leg refusal; item replacement within the same section with open and pending form proves no old-target submission/result.
- Real stay form: open/initial focus, invalid dates/field correction, domain/throw errors, retained draft, retry, Escape/cancel and successful readback; pending replaced item/unmount cannot affect new context.
- Real connection form: pending all ten controls and double submit; failure retains exact draft; explicit success; same-mount trip change and preset/day changes, including late result; original manually edited values not silently repointed; local320/root32 geometry.
- All three: keyboard/focus, reduced motion, long allowed values/errors and narrow/mobile/desktop reference sizes. Report actual bounding-box evidence; root-font simulation is not native browser zoom or physical device.
- Existing R103 connection and R104 booking/rental assertions stay intact and pass on final source. New evidence binds exact source/head and identifies all stubbed callbacks. No fake hosted write, provider or database proof.

## 7. Non-scope

Keine Writer-/Schema-/Provider-/Coverage-/Buchungsstatusänderung, kein Mietwagenumbau. Nur benannte Editorfunktionen und minimal nötige Kontext-Wiring; historische Freeze-Tests nur ausdrücklich erlaubte enge Migration.
Do not implement personal preparation editing, generalized editor platform, autosave/undo, route inference, schedule validation, create idempotency, new persistence, cross-tab write protocol or a second Booking lifecycle.
## Multi-Agent Suitability

Decision **MULTI_AGENT**. Mode NORMAL; this is ordinary bounded Phase1 work under the fresh Owner instruction. A/#996 owns plan editing plus only guest deletion; B/#997 owns the read-only booking folder; C/#998 owns manual flight/stay/connection editors. Each has separate branch/PR, runtime files or explicitly named function boundaries and its own tests/evidence/docs. Shared contracts are already present and remain read-only. No shared-contract writer is required.

Integrate **A → C → B**, one full TL acceptance at a time. No sibling cherry-pick/merge. After main advances, await TL synchronization instruction in this same session; changed head means new exact-head gates. Additional Work helpers may independently inspect/reproduce ordinary scoped behavior, never write your branch or substitute for Cursor/Guardian.

## Delivery file ownership

- New optional slice helpers and focused tests only at the exact paths allowed above; no generic helper framework.
- Scripts: `scripts/manual-journey-editor-completion-1/**` for isolated disposable synthetic fixtures/harnesses. Do not create a deployed test route. No personal browser or production storage/session.
- New evidence only: `docs/evidence/manual-journey-editor-completion-1/**`. Record baseline/head/source digests, actual commands/exits/case counts, browser version/viewport/root text/motion settings, stubs/ports and exact NOT-VERIFIED limits. Do not overwrite earlier evidence or manifests.
- Own docs: `docs/JETNITY_MANUAL_JOURNEY_EDITOR_COMPLETION_1_{PLAN,STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-24.md`. TASK V1 remains immutable.
- Global START_HERE/HANDOFF/ACTIVE/ROADMAP/central ADR/build-order/mode/governance files remain TL-only. Document proposed global reconciliation in your own handoff.

## Verification and stop

Prove meaningful behavior, not source-pattern-only claims. Use real mounted components for async/focus/context cases and genuine owned pure/storage/query functions for persistence/data semantics. Include deterministic failure, pending, retry and late-response cases, relevant existing regression tests, TypeScript, lint, five hygiene guards and production build. Preserve the mandatory full CI App/Auth/Vercel gates; do not change workflows, timeouts, dependencies, global styles, config, schemas or gate logic. Disclose existing warnings/skips; a skip is not PASS.

Check narrow layouts at280/320/360/390/430,768/1280 and landscape where relevant; 200% root text and keyboard/reduced motion for changed core interactions. At minimum mount representative320/390/1280 cases and320/root32. Label CSS/root-font simulation honestly; no fabricated physical-device, screenreader, hosted-account or native zoom pass. No overflow masking on page/root to hide defects.

Each final HANDOFF includes actual main/base/head/mergebase/ahead/behind, actual model/session/name, complete diff/file ownership, findings P0/P1/P2/P3, exact executed proof and unknowns, CI/Preview bindings if observed, database/production/provider/cost statements, remaining review risks and exact next actor. Author self-review is never TL PASS. Deliver and **STOP** for independent TL exact-head review.

**Never Ready, merge, close the tracking issue, change main, or start a follow-up.** CHANGES REQUIRED stays with this exact author/session; a new head invalidates prior gates.

## Standing exclusions

#985/#982 scoped HOLD and its interrupted review must not be retried, rephrased, rerouted to another agent/tool or performed manually. #917 denied hosted readback STOP; no alternate query/apply/operator. #913/#911 block; #968 historical Preview cleanup PAUSE; #748 personal-browser automation SUSPENDED; #626 STOP; Bern#934/#937 PAUSE; #944 no-autostart; #585 deferred; historical Drafts unchanged. Do not inspect held implementation while searching for tests.

No hosted database writes/reads, migration/RLS/grant/function/Auth change, secret/credential access, old Preview inventory/probing, protection bypass, provider/model/payment activation, paid provider/model calls, contract/legal/launch/indexing changes. This batch uses local synthetic evidence and existing platform metadata under TL control. Any unforeseen boundary is reported to TL, not routed around.