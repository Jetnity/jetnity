# Jetnity — Trip Plan Editing and Placement Recovery 1 — PLAN

Date: 24 October 2026
Status: plan before product code; Draft only; not Technical-Lead PASS
Author: **Jetnity Trip Plan Editing and Placement Recovery 1 — Cursor Generation 1**
Issue: #996
Branch: `fix/trip-plan-editing-placement-recovery-1`
PR: #999
Lane: R105 A. Integration order remains A → C → B. No sibling branch is integrated.

This commit is the PLAN gate only. TASK V1 is not edited. No runtime, test, script, or evidence file is added in this commit.

## Session and model (before material code)

- Cursor session: `bc-ddd91109-9dd1-4ed0-b554-c9c9d5b3888d`
- Session link: https://cursor.com/agents/bc-ddd91109-9dd1-4ed0-b554-c9c9d5b3888d
- Actual model: `grok-4.7-high-fast` (`originalModelName` from this run). This is the requested Grok 4.7 High Fast. Not Auto. No fallback.
- UI title: rename is a real supported capability. This run renamed the chat to **Jetnity Trip Plan Editing and Placement Recovery 1 — Cursor Generation 1**. The rename call returned that title.

## Verified baseline

Re-read this session after `git fetch origin main` and `git fetch origin fix/trip-plan-editing-placement-recovery-1`.

- Machine mode: `NORMAL` (`.jetnity/operating-mode.json`). Ordinary bounded product work is allowed. Special Product-Owner gates stay in force. This slice does not cross one.
- `origin/main`: `0c37d318c47a758f06634448d6e0de3856bbc6a6`
- Main tree: `5e7b61a111f94f16a27c80a8ec89e42ef7af62e8` (matches TASK V1 and [R105 precheck 6385343244](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6385343244))
- Merge-base with `origin/main`: `0c37d318c47a758f06634448d6e0de3856bbc6a6`
- Seed HEAD before this plan: `81acf8673972ff6c83ebd6cdba88753aa0d759d6`
- Seed tree: `db78efc9ad23d41a3796723e99b9a58cedcc02b8`
- Ahead/behind against `origin/main` at the seed: 1 / 0
- Seed diff is one file: `docs/JETNITY_TRIP_PLAN_EDITING_PLACEMENT_RECOVERY_1_TASK_V1_2026-10-24.md`
- TASK V1 blob: `42b124f5f68172aaa51365b028bb22772d362dcc` (byte-identical; this plan does not edit it)
- Source blobs at the seed, inspected below:
  - `components/trips/TripWorkspacePlan.tsx` `b99c924c51161a3a623b87306b6b7dcbbd79f79b`
  - `components/trips/PlanpunktEditor.tsx` `5907ce3d5980741731348fea9dac67911826f44c`
  - `lib/trips/gastspeicher.ts` `39b75a606c5ae68f64dbd6c3968198d6c0ec3929`
  - `lib/trips/trip-plan-integrated/manual.ts` `7a67bfccba0e851d1cf18a90996c4a65481aefe9`
- Node: v22.23.4
- Live assignment is [R105 V1 / 6385343244](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6385343244) on [canonical #751](https://github.com/Jetnity/jetnity/issues/751). Lane A is this writer. Historical startup paragraphs in `JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md` are not the current writer. Those global files stay Technical-Lead-owned and are not edited.

Startup reads completed before this plan: `JETNITY_START_HERE.md`, `AGENTS.md`, the Technical Lead / Cursor operating standard, the multi-agent operating system, the multi-agent slice planning standard, the binding slice precheck / continuity gate of 29 August 2026, V1 binding build order of 1 September 2026 §8 (product-surface work stays bounded; this slice does not open Destination Essentials, World Map, or PWA), product quality standard, logic standard, traveller-context policy, continuity standard pointer, operating mode, #751 precheck `6385343244`, and the source named below. `docs/ACTIVE_WORK_STATUS.md` is not edited.

Traveller context: placement and content edits must keep existing traveller, document, booking, route, and provider facts on the original item. This slice does not collect citizenship, residence, or travel documents. Unknown dates stay unknown. No new credential model.

## Observed source defects

These are source findings at the seed blobs above. They are not a claimed Production incident, not a mounted reproduction, and not hosted/CI truth. Mounted and storage proof comes after Technical Lead authorization.

1. `TripWorkspacePlan.tsx` gates the editor, the success line, and the delete alert on a selected day. `tagesFelder` is `tag && (...)` at lines 239–250, and that block is the only mount of `PlanpunktEditor` (line 241) and the only `role="alert"` for `meldung` (lines 246–249). A zero-day trip has `timeline.hatTage === false` and `gewaehlterTag === null` (`lib/trips/timeline.ts` lines 93–103).
2. The same file still offers Edit and Delete for unassigned items at lines 453–468, including when no day exists. Edit sets `formularOffen` and `bearbeiten`. Delete calls `entfernen('', punkt.id)`. With no day, the editor never mounts, and `entfernen` (lines 195–206) can set `meldung` where nothing renders it. A zero-day trip can show an Edit control that does nothing visible and a delete failure that is invisible.
3. The editor component already supports an existing item with `dayId == null`. `PlanpunktEditor.tsx` lines 25–30 keep a null date empty for an existing item and initialise the placement select from `item.dayId ?? ''`. Lines 91–93 offer "Noch nicht eingeplant" plus the real days. Lines 38–46 send `art: 'inhalt'` only when `manuellBearbeitbar(original)` and otherwise send `art: 'platzierung'`. New-item creation still uses the required `tagId` (lines 14–16 and 64). The defect is the parent mount, not a missing editor contract.
4. Close/focus fallback at lines 186–192 uses the connected trigger, then `[data-plan-hinzufuegen]`. That attribute exists only on the day add button (line 225), which is inside `tagesKopf` and therefore also behind `tag &&` (line 208). After a zero-day edit, or after the source control disappears, focus has no fallback.
5. Late-completion protection is partial. The parent ignores `onFertig` when `editorGeneration !== editorOwner.current` (line 243), and the editor ignores a response after unmount via `lebendig` (lines 65–68). The editor key is `` `${reise.id}:${tag.id}:${bearbeiten?.id ?? 'new'}` `` (line 241). A same-mount graph replacement with the same trip, day, and item id does not remount. The in-flight completion can still call `onFertig`, clear the draft, unlock, and move focus on that newer context. Unmount does not cancel an already-sent write, and this plan does not claim that it does.
6. `gastPlanpunktEntfernen` at `lib/trips/gastspeicher.ts` lines 1080–1091 writes the caller `Trip` through `gastreiseSpeichern`. It does not read the active key, does not compare identity or revision, and still increments `revision` when the id is absent. The same id in more than one list is removed from all of them. A stale same-trip snapshot, or a snapshot of a different trip, replaces the active graph. `gastPlanpunktBearbeiten` (lines 1275–1278) already reloads via `gastreiseLadenNach`. That loader (lines 698–706) calls `gastspeicherLaden`, which can run `legacyUebernehmen` (lines 688–689). Delete must not copy that path. Source-established P1 data-integrity candidate. No production impact is asserted. Dynamic reproduction is still pending and is the first implementation proof.
7. `ohneTag` presentation is already canonical. `timelineAbleiten` uses the non-empty prop list, otherwise `reise.ohneTag` (timeline.ts lines 54). `TripWorkspace` does the same once (TripWorkspace.tsx lines 423 and 697). The plan must keep `timelineAbleiten(reise, ohneTag, aktiverTag)` and render `timeline.ungeplante` only. It must not concatenate the two lists.
8. Account delete is a separate contract. `KontoArbeitsbereich.tsx` lines 97–104 call `planpunktEntfernen({ tripId, itemId })`. `lib/trips/aktionen.ts` lines 315–332 delete that row under the existing authenticated client and revalidate. Callback success is not a refreshed-graph confirmation. This slice does not add zero-row, CAS, or RPC semantics.

`lib/trips/trip-plan-integrated/manual.ts` lines 6–47 stay the authority: content edits only for manual activity/note items, placement-only for protected items, exactly one original id, `JSON.stringify` equality with the captured original, a real day or null, and no rewrite of stage, price, booking, route, or provider facts. Null dates stay null. This slice does not modify that file.

## Allowed paths

Runtime, after authorization:

- `components/trips/TripWorkspacePlan.tsx` — mount the existing-item editor and the success/error region without requiring a selected day; keep the new-item form and its `#plan-tag-kontext` placement; pending, focus, and generation guards. Preserve `timelineAbleiten(reise, ohneTag, aktiverTag)`, the data markers, and the navigation controls.
- `components/trips/PlanpunktEditor.tsx` — existing-item edit with no selected day; draft, validation, pending, late completion, and focus stay bound to the operation context. New-item creation still requires a real day id and is still mounted only from the day add button.
- `lib/trips/gastspeicher.ts` — **only** `gastPlanpunktEntfernen`, plus the import of the owned helper. Private `aktiveGastreiseVorpruefen`, `schluesselRohLesen` / `aktiveSchluesselRohLesen`, and `reiseLesen` may be called and are not edited. `gastreiseSpeichern` stays the setter because it already validates and readback-checks. `gastspeicherLaden`, `gastreiseLadenNach`, `legacyUebernehmen`, and every other function stay frozen.
- `lib/trips/trip-plan-editing-placement-recovery-1.ts` — pure decision helper: given the raw preflight, the parsed current graph, the supplied trip, and the target id, return either the next graph or a failure. No storage, no migration, no repair.
- `components/trips/usePlanEditorLifecycle.ts` — local generation, in-flight operation id, and focus fallback for the plan editor and delete action. Not a shared framework.

Proof and delivery, after authorization:

- `lib/trips/trip-plan-editing-placement-recovery-1.test.ts`
- `lib/trips/guest-plan-delete-recovery-1.test.ts`
- `scripts/trip-plan-editing-placement-recovery-1/**` — isolated synthetic harness only. No deployed test route.
- `docs/evidence/trip-plan-editing-placement-recovery-1/**` — new files only.
- `docs/JETNITY_TRIP_PLAN_EDITING_PLACEMENT_RECOVERY_1_{STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-24.md`

Conditional, only if the implementation moves a locator the current assertion requires, and only with the justification repeated in the report:

- the direct source assertion in `lib/trips/trip-plan-premium-experience-4.test.ts` lines 127–167
- the form/alert locator in `scripts/trip-plan-premium-experience-4-audit.mjs` lines 585–594

The intended mount keeps `<PlanpunktEditor` in `TripWorkspacePlan.tsx` and keeps the new-item form inside `#plan-tag-kontext`, so neither file should need an edit. Behavioral, navigation, and timeline assertions stay as they are.

Readonly: `TripWorkspace.tsx`, `GastArbeitsbereich.tsx`, `KontoArbeitsbereich.tsx`, `lib/trips/aktionen.ts`, `manual.ts`, day/timeline/core/navigation modules, schemas and types, every other guest-storage function, Readiness, Official Truth, Provider, Commercial, and migrations. Lane C's manual editor files and lane B's account booking files are not this writer. R104 connection-freeze assertions are untouched.

## Implementation

### Existing-item editor without a day

1. Keep the day add button and the item-less `PlanpunktEditor` inside `#plan-tag-kontext`, still behind a selected day. That is the only new-item mount. The premium-4 audit path (add button, `#plan-tag-kontext form`, validation alert, cancel) stays on that mount.
2. When `formularOffen && bearbeiten`, mount one existing-item editor outside the `tag &&` gate, beside the unassigned list when the item is unassigned and in the day section when the item belongs to the selected day. Do not mount a second copy. The key includes trip id, item id, current day id or `ohne`, and the editor generation. It does not include `revision`, so a failed save does not remount and wipe the draft.
3. Pass `tagId` only for a new item. An existing item passes its own `dayId` or `''`. The editor must not derive a day, date, stage, or route from an empty `tagId` when `original` is set. A create submit with no real day id does not call `onAnlegen`.
4. Render `erfolg` and `meldung` on the plan section, not only inside `tagesFelder`, so a zero-day delete error is visible. The editor's own `role="alert"` stays inside the form. Give the plan-level alert `tabIndex={-1}` and move focus to it only when that delete operation is still the current context.
5. Placement continues through the existing `onBearbeiten(original, change)` callback. `original` remains the object captured when the editor opened. Do not copy a refreshed item into that object to skip `punktAendern`'s conflict check. Unassigned → day, day A → day B, and day → unassigned are the existing `dayId` values, including `null`.

### Focus and in-flight ownership

1. `usePlanEditorLifecycle` owns one operation id per editor and one per delete action. A second submit on the same action returns while the first is in flight. Editor pending and delete pending are separate actions; a late delete must not close or clear the editor.
2. At submit or delete click, capture trip id, item id, day id, editor generation, and the operation id. On completion, apply success, error, close, unlock, or focus only when all of those still match. A newer context's own effect may reset its own pending flag. The old completion handler must not unlock, clear, or focus that newer context.
3. Unmount sets the editor dead, as today. The already-sent callback may still resolve. The handler then does not call `onFertig` and does not claim the write was cancelled.
4. Focus order: the connected trigger if it still has a client rect; else a remaining control inside `[data-plan-punkt="<id>"]`; else the unassigned heading when that region is present; else the existing zero-day explanation or the plan section, with `tabIndex={-1}` and the existing focus ring. Do not invent an add button on a zero-day trip. Do not hide overflow on the page or root.

### Guest delete

`gastPlanpunktEntfernen(reise, punktId)` keeps that signature because `GastArbeitsbereich.tsx` is readonly and calls it with the in-memory trip.

1. Read the active key with `aktiveGastreiseVorpruefen` and `aktiveSchluesselRohLesen`. Do not call `gastspeicherLaden`, `gastreiseLaden`, `gastreiseLadenNach`, or `legacyUebernehmen`. Do not read or write the queue key or the legacy key.
2. `nicht_im_browser`, `speicher_unlesbar`, `fehlend`, and `ungueltig` throw before any set. Raw active bytes stay. A missing active key is not a reason to migrate a legacy draft.
3. Parse the raw bytes and pass them through the existing `reiseLesen`. A parse failure or a null parse is an error and does not write. The parsed graph's `id` and `revision` must equal the supplied trip. Any other id, or any other revision, throws `VeralteteFassungFehler` and does not write. The supplied trip is not the write base.
4. Count the id in `days[].items` and `ohneTag` on that parsed graph. Anything other than exactly one match throws, does not increment `revision`, and does not write. Do not report success for an absent id.
5. On exactly one match, build the next graph from the parsed current graph: remove that one item, renumber `position` inside every day list the way lines 1084–1088 do today, and filter `ohneTag` without inventing a new `ohneTag` renumber. Set `revision` to the current revision plus one. Then call the existing `gastreiseSpeichern`, which sets `updatedAt` and readback-checks. Unrelated keys and unrelated item fields stay on that current graph.
6. The in-memory trip may contain `tageEtappenZuordnen` stage fills from `gastspeicherLaden`. Those fills are not written back. The stored graph remains the write base. The next load projects again. This is deliberate: delete must not persist a display projection.
7. `SpeicherFehler` from the setter is a failure. If `setItem` ran and the readback did not match, the function does not try a second repair write and does not claim the previous bytes were restored.
8. A repeated call with the pre-delete snapshot fails the revision check and leaves the post-delete bytes unchanged. A repeated call with the returned trip and the same id fails the exactly-one check and does not bump `revision` again.

Basis choice, for Technical Lead review: identity plus `revision` is the check this signature can make. Deep equality against the caller trip would reject a normal loaded trip whenever `mitZuordnung` filled `stageId` in memory only. `gastreiseSpeichern` is frozen, so the read and the set are not one atomic compare-and-swap. A write that lands in that gap is reported as the residual race, not as a claimed lock.

Account delete is unchanged. Mounted account proof uses a callback fixture. `null` from that callback is not treated as a stronger refreshed-graph confirmation than today's `router.refresh()`. The existing "written but refreshed state not confirmed" edit outcome stays an uncertain/error state inside the editor contract; this slice does not paint it as saved.

## Synthetic proof (after authorization, not in this commit)

Node tests call the real `gastPlanpunktEntfernen` against an in-memory `localStorage`, and the pure helper for the decision table:

- fresh valid delete, then readback and reload through the real loader; the target is gone; day positions are contiguous; one unrelated item and its stage, time, route, booking, price, provider, and traveller fields stay
- stale same-trip snapshot and a different active trip: active bytes identical, legacy bytes identical, queue bytes identical
- missing key, malformed JSON, schema-invalid JSON, throwing `getItem`: no `setItem` and no `removeItem` on the active, legacy, or queue key
- absent id and duplicate id: no revision bump, bytes identical
- setter throw and readback mismatch: the thrown error is the result; the test records the bytes left behind and does not call them a rollback
- second delete with the old snapshot does not mutate again

Mounted harness under `scripts/trip-plan-editing-placement-recovery-1/` bundles the real `TripWorkspacePlan` and `PlanpunktEditor` with esbuild and isolated local Playwright. Callbacks are the test double. Guest persistence cases call the real `gastPlanpunktEntfernen`, not a stub of it. No personal browser profile, no production storage, no hosted account.

Mounted cases:

- zero-day existing activity, note, and protected flight: editor opens; protected flight shows placement only; null date and time stay empty; save, thrown error, and domain error keep the typed draft; cancel and Escape close and land on a visible fallback; no dialog remains
- day A → day B, day → unassigned, unassigned → a real day, with null times and a long label; the callback receives the captured original and the requested `dayId`; an unknown day and an original-version mismatch stay on the draft and show the existing error text
- double-click calls the writer once; a late resolution after trip, item, day, editor generation, graph revision, or unmount does not close, clear, or focus the replacement form
- delete error on a zero-day list is a visible alert and receives focus; a late delete error does not alert a newer trip
- account fixture: the same plan component shows the callback error and does not claim a refreshed account graph

Viewports in that harness: 320, 390, and 1280, plus 320 with root `font-size: 32px`. The same run also checks 280, 360, 430, 768, and one landscape size for horizontal overflow and a reachable control. Those are CSS viewport and root-font simulations. They are not a physical device, screen reader, native zoom, hosted account, or Preview pass. No page-level overflow clip is added to hide a defect.

Existing `gastspeicher.test.ts` "nach dem Entfernen sind die Reihenfolgen wieder lückenlos" stays, and is re-run. Existing premium-4 source and audit assertions are re-run unchanged unless a locator actually moved.

Local gates after implementation: the focused tests, the mounted harness, `gastspeicher` regression, premium-4 regression, TypeScript, lint, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, and a production build. Full exact-head App, Auth, and Vercel gates stay mandatory and unchanged. No workflow, timeout, dependency, config, schema, or gate edit. A skip is recorded as a skip. A tool that does not run says NOT VERIFIED and why.

## Unknowns

- Whether the mounted bundle pulls `server-only` through a workspace import. If it does, the harness aliases only that package throw. The report names the alias. Product files stay on the allowlist.
- Exact-head CI, Auth, and Preview are not run for this plan head. They are Technical Lead gates after an implementation push.
- `next-env.d.ts` is dirty in this environment: the two type imports point at `.next/dev/types` instead of `.next/types`. It is not part of the slice and is not committed.
- The frozen `gastreiseSpeichern` leaves a gap between the fresh read and the set. This plan does not close that gap by editing the setter.
- Identity plus revision can accept a same-revision content drift that some other frozen writer stored without bumping `revision`. The delete then edits the stored graph, not the caller snapshot. A stronger byte-equality basis needs a Technical Lead addendum, because the loaded guest trip is projection-adjusted and the caller signature cannot change inside this allowlist.

## Boundaries

Do not mark Ready. Do not merge. Do not close #996. Do not start a follow-up slice. Do not sync `main` or edit #751. #985/#982 scoped HOLD and its interrupted review stay untouched. #917 denied hosted readback stays untouched. #968 cleanup stays paused. #748 personal-browser automation stays suspended. No hosted read or write, migration, RLS, Auth, secret, provider, model, or payment activation. Self-review is not Technical-Lead PASS. A new head invalidates earlier gates.

## Costs and security

No new dependency, hosted service, provider call, model call, or recurring cost. The guest change touches only the active `localStorage` key, and only after the preflight succeeds. It does not broaden who can delete, and it does not change the account action. The integrity fix rejects a stale or foreign graph instead of storing it.

## Stop

STOP for Technical Lead plan review. No product or test implementation in this delivery.
