# Jetnity Trip Plan Editing and Placement Recovery 1 — TASK V1

Date: 2026-10-24. Immutable Technical-Lead task. Do not edit or reinterpret this TASK; request a named TL addendum for any needed ownership change.

## 0. Authority, identity and exact baseline

- R105 lane **A**, tracking **#996**, branch **`fix/trip-plan-editing-placement-recovery-1`**.
- Exact logical author: **Jetnity Trip Plan Editing and Placement Recovery 1 — Cursor Generation 1**. Fresh Generation1, one genuine Cursor writer for this branch.
- Requested model: **Grok4.7 High Fast**, expected identifier **grok-4.7-high-fast**. Attest actual runtime model and actual session ID/link; no Auto/unrelated fallback. If unavailable, STOP and report. Use a supported UI rename only if available; report performed vs not available honestly.
- Base actual main: **0c37d318c47a758f06634448d6e0de3856bbc6a6**; tree **5e7b61a111f94f16a27c80a8ec89e42ef7af62e8**; machine mode **NORMAL**. Re-read live values; never silently change base/contract.
- [R105 V1 TL precheck6385343244](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6385343244), [canonical current index#751](https://github.com/Jetnity/jetnity/issues/751). New explicit Owner instruction authorizes these ordinary larger tasks without routine reconfirmations. Previous R104 is closed; its agents stay STOP.

## 1. Required startup and pre-code gate

Read JETNITY_START_HERE.md, AGENTS.md, the Technical Lead Cursor Operating Standard, current handoff, ACTIVE_WORK_STATUS durable pointer, current#751/precheck, Multi-Agent Operating System, Multi-Agent Slice Planning Standard, Binding Slice Precheck/Continuity Gate2026-08-29, V1 Binding Build Order2026-09-01, relevant Vision/Architecture/DECISIONS/Design/ProductQuality/Continuity/Logic standards, current source and tests. Old dated current-state paragraphs are historical where current live evidence supersedes them.

**First delivery is PLAN ONLY:** commit `docs/JETNITY_TRIP_PLAN_EDITING_PLACEMENT_RECOVERY_1_PLAN_2026-10-24.md`, then post a PR comment with exact logical name/model/session, main/head/merge-base/ahead/behind, source-confirmed defects, proposed changes, exact owned paths, regression proofs, costs and unknowns. The seed TASK and this PLAN must be the only diff at this gate. **STOP for TL plan review before product/test implementation.** TL will authorize the same session; no new Owner prompt is required. Do not interpret @cursor alone as permission to skip this stop.

## 2. Product outcome

Bestehende Planpunkte mit null, einem oder mehreren Reisetagen bearbeiten, explizit zuordnen/ausplanen und entfernen. Fehler sind sichtbar, Draft/Fokus sind an den richtigen Kontext gebunden. Die Gast-Löschung prüft eine aktuelle identische Basis und überschreibt keine neuere oder andere aktive Reise.
## 3. Source-established defects and existing contracts

Verified source tree: TripWorkspacePlan239–250 gates PlanpunktEditor and the delete error alert on `tag &&`, while453–468 still offers Edit/Delete for unassigned items. A zero-day trip can therefore show unusable Edit and invisible delete errors. Existing editor already supports `original.dayId == null`. The close/focus fallback186–192 depends on a day-bound add button.

`gastPlanpunktEntfernen` currently1080–1091 writes the caller's entire Trip directly, without checking the current stored active graph. This can replace newer same-trip changes or another active trip. Source-established P1 data-integrity candidate; reproduce using synthetic storage before fixing. No production impact is asserted.

Preserve existing PlanAenderung/manual.ts authority: manual activity/note content editing vs placement-only protected/dedicated items; exact original item/version checks; existing current graph and Account rowVersion/CAS; null dates stay unknown. `ohneTag` uses the canonical existing projection, not concatenated duplicate inventories.

## 4. Exclusive runtime and test allowlist

- `components/trips/TripWorkspacePlan.tsx`: existing item editor mount/context, day/unassigned actions, pending/results/focus; preserve timeline derivation, data markers and navigation contracts.
- `components/trips/PlanpunktEditor.tsx`: support existing-item edit without a selected current day; correct draft/validation/pending/late-completion/focus semantics. New-item creation still requires an existing day.
- **Only `gastPlanpunktEntfernen`** in `lib/trips/gastspeicher.ts` and strictly necessary import of a new owned helper. Existing private read/parser helpers may be called without changing them. All other functions in that file are frozen for this task.
- New, only if needed: `lib/trips/trip-plan-editing-placement-recovery-1.ts` and `.test.ts`; `lib/trips/guest-plan-delete-recovery-1.test.ts`; `components/trips/usePlanEditorLifecycle.ts`. Keep helper purpose local.
- Prefer preserving old assertions. Only if necessary and justified in PLAN: the direct editor structure assertion in `lib/trips/trip-plan-premium-experience-4.test.ts`127–167 may follow the new real mount; the form/alert locator section585–594 in `scripts/trip-plan-premium-experience-4-audit.mjs` may follow the new placement. Preserve every behavioral/nav/timeline assertion; no blanket cleanup or test suppression.

Read-only: TripWorkspace/GastArbeitsbereich/KontoArbeitsbereich, actions/account-write/manual/day/timeline/core/navigation, all schemas/types, all other guest storage functions, Readiness/Official/Provider/Commercial/migrations. C's manual editor files and B's account folder files are not yours. R104 C connection freeze assertions are untouched by A.

## 5. Binding behavior

1. Existing unassigned activity/note opens and edits with zero days. Preserve null day/date/time and the original identity; no fabricated day/etappe/route. Protected items expose only already-supported placement.
2. Explicit unassigned→validday, dayA→dayB and day→unassigned through existing callbacks. Preserve identity, original version, all unrelated stage/time/route/booking/price/provider/traveller/readiness facts. Never refresh the captured original version simply to bypass a conflict.
3. Render success/error/pending where relevant even without any day. Returned domain failures and thrown/rejected calls preserve the submitted draft and offer deliberate retry. No implicit autosave or optimistic graph/booking truth.
4. Opening/cancel/Escape/error/success/delete/placement give sensible visible focus, including when the source item moves or disappears and no add button exists. A late operation cannot steal focus from a newer context.
5. Single in-flight operation per relevant editor/action; stable operation ownership across trip, item, day, editor generation, graph replacement and unmount. Same-mount target replacement and delayed responses must not close, clear, unlock or report on a newer editor. Already-sent writes cannot be cancelled by unmount; do not claim otherwise.
6. Guest delete must freshly read active raw storage **without migrations, repair, queue mutation or cleanup**. `gastreiseLadenNach` uses the migrations-capable loader, so do not use it uncritically for destructive preflight. Existing raw reader/parser can be reused.
7. Conservative deletion contract: require current active valid graph to match the supplied trip identity and expected current basis. Missing/unreadable/invalid/other-active/stale basis is an error with storage bytes untouched. Require exactly one target; reject absent/duplicate target rather than invent success or increment revision. Use the current validated graph, not stale caller data, as write base.
8. Successful delete changes only the target, required existing list-position renumbering and established revision/update metadata. Preserve unrelated data/keys. Storage setter/byte-readback failure is not success; failure after a possible set does not prove rollback and must be reported honestly.
9. Account delete remains existing authenticated action/revalidation: no new zero-row/CAS/RPC semantics. Callback success is not a stronger refreshed-graph confirmation than the existing contract supplies. Existing 'written but refreshed state not confirmed' edit outcome remains uncertain/error, never fake success.

## 6. Required behavioral proof

- Mounted zero-day existing activity/note/protected-item edits; successful content/placement; error/throw; cancel/Escape/focus fallback; no hidden stale dialog.
- DayA/dayB/unassigned transitions with null times and long labels; protected fields unchanged; invalid/deleted target and original version conflict.
- Pending double-submit and late completion after trip/item/day/editor change, graph refresh and unmount; old completion cannot mutate/focus new form.
- Synthetic genuine guest functions: fresh valid delete then readback/reload; stale same-trip and other-active trip remain byte-identical; missing, malformed, unparseable, unaccessible storage; legacy/queue bytes preserved; missing/duplicate target; failed setter/readback; repeated delete cannot create another mutation.
- Keep existing trip-plan integrated pending/draft/no-day/placement regression intent. Account callback fixtures prove UI only, not hosted Auth/RLS.

## 7. Non-scope

Keine Erstellung neuer Planpunkte ohne Tag; keine Account-Write-/Schema-/SQL-/RLS-/Navigation-/Readiness-/Provider-Vertragsänderung. Gaststorage nur gastPlanpunktEntfernen.
No new no-day-create contract; no layout redesign, drag-and-drop, auto-replanning, booking mutation, provider/timezone truth or general storage refactor. Other guest mutation defects, if found, are separately reported rather than silently added.
## Multi-Agent Suitability

Decision **MULTI_AGENT**. Mode NORMAL; this is ordinary bounded Phase1 work under the fresh Owner instruction. A/#996 owns plan editing plus only guest deletion; B/#997 owns the read-only booking folder; C/#998 owns manual flight/stay/connection editors. Each has separate branch/PR, runtime files or explicitly named function boundaries and its own tests/evidence/docs. Shared contracts are already present and remain read-only. No shared-contract writer is required.

Integrate **A → C → B**, one full TL acceptance at a time. No sibling cherry-pick/merge. After main advances, await TL synchronization instruction in this same session; changed head means new exact-head gates. Additional Work helpers may independently inspect/reproduce ordinary scoped behavior, never write your branch or substitute for Cursor/Guardian.

## Delivery file ownership

- New optional slice helpers and focused tests only at the exact paths allowed above; no generic helper framework.
- Scripts: `scripts/trip-plan-editing-placement-recovery-1/**` for isolated disposable synthetic fixtures/harnesses. Do not create a deployed test route. No personal browser or production storage/session.
- New evidence only: `docs/evidence/trip-plan-editing-placement-recovery-1/**`. Record baseline/head/source digests, actual commands/exits/case counts, browser version/viewport/root text/motion settings, stubs/ports and exact NOT-VERIFIED limits. Do not overwrite earlier evidence or manifests.
- Own docs: `docs/JETNITY_TRIP_PLAN_EDITING_PLACEMENT_RECOVERY_1_{PLAN,STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-24.md`. TASK V1 remains immutable.
- Global START_HERE/HANDOFF/ACTIVE/ROADMAP/central ADR/build-order/mode/governance files remain TL-only. Document proposed global reconciliation in your own handoff.

## Verification and stop

Prove meaningful behavior, not source-pattern-only claims. Use real mounted components for async/focus/context cases and genuine owned pure/storage/query functions for persistence/data semantics. Include deterministic failure, pending, retry and late-response cases, relevant existing regression tests, TypeScript, lint, five hygiene guards and production build. Preserve the mandatory full CI App/Auth/Vercel gates; do not change workflows, timeouts, dependencies, global styles, config, schemas or gate logic. Disclose existing warnings/skips; a skip is not PASS.

Check narrow layouts at280/320/360/390/430,768/1280 and landscape where relevant; 200% root text and keyboard/reduced motion for changed core interactions. At minimum mount representative320/390/1280 cases and320/root32. Label CSS/root-font simulation honestly; no fabricated physical-device, screenreader, hosted-account or native zoom pass. No overflow masking on page/root to hide defects.

Each final HANDOFF includes actual main/base/head/mergebase/ahead/behind, actual model/session/name, complete diff/file ownership, findings P0/P1/P2/P3, exact executed proof and unknowns, CI/Preview bindings if observed, database/production/provider/cost statements, remaining review risks and exact next actor. Author self-review is never TL PASS. Deliver and **STOP** for independent TL exact-head review.

**Never Ready, merge, close the tracking issue, change main, or start a follow-up.** CHANGES REQUIRED stays with this exact author/session; a new head invalidates prior gates.

## Standing exclusions

#985/#982 scoped HOLD and its interrupted review must not be retried, rephrased, rerouted to another agent/tool or performed manually. #917 denied hosted readback STOP; no alternate query/apply/operator. #913/#911 block; #968 historical Preview cleanup PAUSE; #748 personal-browser automation SUSPENDED; #626 STOP; Bern#934/#937 PAUSE; #944 no-autostart; #585 deferred; historical Drafts unchanged. Do not inspect held implementation while searching for tests.

No hosted database writes/reads, migration/RLS/grant/function/Auth change, secret/credential access, old Preview inventory/probing, protection bypass, provider/model/payment activation, paid provider/model calls, contract/legal/launch/indexing changes. This batch uses local synthetic evidence and existing platform metadata under TL control. Any unforeseen boundary is reported to TL, not routed around.