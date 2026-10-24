# Jetnity — Trip Plan Editing and Placement Recovery 1 — PLAN

Date: 24 October 2026
Status: accepted plan head `a4fc53c20433d0c6214acf483ae81648390d1896` (blob `98e6d31842647176400b0ae4cfa9ed62b0c87a71`) plus the binding no-op clarification in this file; implementation is in this delivery; Draft only; not Technical-Lead code PASS
Author: **Jetnity Trip Plan Editing and Placement Recovery 1 — Cursor Generation 1**
Issue: #996
Branch: `fix/trip-plan-editing-placement-recovery-1`
PR: #999
Lane: R105 A. Integration order remains A → C → B. No sibling branch is integrated.

The accepted plan stayed byte-identical through head `a4fc53c20433d0c6214acf483ae81648390d1896`. This delivery adds only the binding no-op clarification below. TASK V1 is not edited. Command results are in the implementation report.

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
- `lib/trips/gastspeicher.ts` — **only** `gastPlanpunktEntfernen`, plus the import of the owned helper. The function calls the private `aktiveSchluesselRohLesen` once and the existing `reiseLesen`. It does not call `aktiveGastreiseVorpruefen`, `rohLesen`, or a migrations-capable loader. Those functions are not edited. `gastreiseSpeichern` stays the setter because it already validates and readback-checks. Every other function in the file stays frozen.
- `lib/trips/trip-plan-editing-placement-recovery-1.ts` — pure `gastLoeschBasisGleich`: project two already validated trips with `tageEtappenZuordnen` and compare a complete stable stringify. It does not return a write graph, touch storage, migrate, or repair. The delete mutation stays on the unprojected `aktuell` inside `gastPlanpunktEntfernen`.
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
2. When `formularOffen && bearbeiten`, mount one existing-item editor outside the `tag &&` gate, beside the unassigned list when the item is unassigned and in the day section when the item belongs to the selected day. Do not mount a second copy. The React key is trip id, item id, the selected day id or `ohne`, and `editorGeneration`. It does not include `revision`, `updatedAt`, or a graph-refresh nonce. A same-target readback must not remount the form or wipe the unsaved draft.
3. Pass `tagId` only for a new item. An existing item passes its own `dayId` or `''`. The editor must not derive a day, date, stage, or route from an empty `tagId` when `original` is set. A create submit with no real day id does not call `onAnlegen`.
4. Render `erfolg` and `meldung` on the plan section, not only inside `tagesFelder`, so a zero-day delete error is visible. The editor's own `role="alert"` stays inside the form. Give the plan-level alert `tabIndex={-1}` and move focus to it only when that delete operation is still the current context.
5. Placement continues through the existing `onBearbeiten(original, change)` callback. `original` remains the object captured when the editor opened. Do not copy a refreshed item into that object to skip `punktAendern`'s conflict check. Unassigned → day, day A → day B, and day → unassigned are the existing `dayId` values, including `null`.

### Focus and in-flight ownership

`editorGeneration` increments only when the user opens or reopens the add or edit control, and when `aktiverTag` changes. The existing day switch still closes the open form. A change of `reise.revision` or `reise.updatedAt` alone does not increment it.

The React key is the mount identity above. The completion identity is separate and smaller. It is captured when that submit or delete click starts.

Editor completion identity:

- `tripId`
- open target id (`item.id`, or `new` for the day-scoped create form)
- `editorGeneration`
- `operationId`

Delete completion identity:

- `tripId`
- target item id
- delete `operationId`

`revision`, `updatedAt`, and the placement select's `dayId` are not part of either completion identity and are not part of the React key. The placement select is draft state. It is disabled while that editor operation is in flight, and the submitted `PlanAenderung` already closed over the selected `dayId`. A same-id graph update does not by itself remount the form.

Those four editor fields are necessary and not sufficient. Finding A-P2-PLAN-02. A late save is classified by the visible target item, not by the item id alone.

At submit, before `onBearbeiten`, the editor runs the existing read-only `punktAendern` on a graph whose single matching item is the captured `original`. The expected item is that result's single item with the same id. That item still carries the captured `rowVersion`, because `punktAendern` copies the original and does not write. If the call throws, the editor shows that error, keeps the draft, and does not start the callback. The captured `original` stays the object from open. It is never replaced from a later prop, and a newer `rowVersion` is never written back into it. The original-version CAS in the Account writer stays untouched.

The visible target is `allePlanpunkte(reise)` filtered to that id. Domain comparison uses `JSON.stringify` after removing only `rowVersion`. Every other item field stays in the comparison. Trip `updatedAt`, `revision`, `readinessItems`, and `party` are not removed. `rowVersion` is the one persistence-owned field: `abbildung.ts` maps the written row's `updated_at` to it, and the Account update uses the captured version only as `.eq('updated_at', expectedVersion)`. This plan does not predict the new timestamp.

- Unchanged target: exactly one item, and its full JSON, including `rowVersion`, equals the captured `original`. Trip-level edits such as `readinessItems`, `party`, title, `revision`, or `updatedAt` do not change this result. The form stays mounted and keeps the draft. A late error from this operation may show on that draft. A late `null` does not close while the item is still the original. Keeping the id is not evidence that this `PlanAenderung` landed.
- Expected domain result: exactly one item, and every field except `rowVersion` equals the expected item. The visible `rowVersion` may be the copied original version, as on the guest/local result, or a different string, as on a confirmed Account row. No other field may differ. A different `rowVersion` alone, with domain content that does not match this change, is not a match.
- Not attributable: no item, more than one item, or one item whose non-version fields equal neither the captured `original` nor the expected item. This includes a same-id content or placement change while `revision` and `updatedAt` stay identical. The old success and the old error do not close, clear, focus, or unlock. The draft and the captured `original` stay. The form shows the existing conflict text from `KONFLIKT` and is editable again, including Abbrechen. That state belongs to this mounted form. A newer `operationId` does not receive it and is not unlocked by it.
- Same original domain, newer version, submitted domain absent. Finding A-P2-PLAN-04. The captured item is domain A and version V1. The submitted change expects domain B, and B is not A. The visible item is still domain A, with a different version V2. That item is not the full original, not the expected domain, and not a domain that differs from both. For this still-current operation it is conflict/unconfirmed recovery, whether the callback resolved `null` or returned an error. The draft and the captured `original` stay. Abbrechen is available. The form is not left disabled. A newer operation receives neither the recovery text nor an unlock. A returned error is shown as that error. A `null` shows `KONFLIKT`, because the submitted domain is not visible.

Precedence when the submitted change is a domain no-op: expected domain equals original domain A. A visible item whose domain is A is then the expected domain result, including when its version is V2 and including when its version is unchanged. It is not left in the version-only recovery above, and it is not left permanently in `warteAufBestaetigung`. Close and focus still require this same operation's `null` callback and that this operation still owns the form and the unchanged submit draft.

Binding implementation clarification from the Technical Lead acceptance of plan head `a4fc53c20433d0c6214acf483ae81648390d1896`: if the expected domain equals the original domain, the single visible item matching that domain is an expected-domain match even when `rowVersion` is unchanged. This includes a genuine guest no-op. Completion still requires this operation's successful callback and unchanged operation and draft ownership. "Null alone" means a `null` callback without those matching and ownership checks. It does not add a requirement for a new `rowVersion`. No writer or callback expansion follows from this clarification.

Success closes and moves focus only when this same operation's callback has resolved `null` and the visible item is an expected domain result under that precedence. A visible Account row with a new `rowVersion` and matching domain, seen before that `null`, is not a conflict and does not close yet. The saving state stays until `null` arrives. The unconfirmed-write error stays an error on the preserved draft. `null` without a visible domain match is not success.

`KontoArbeitsbereich` publishes the confirmed graph and then returns `null`. Those two updates can be seen in either order, and the callback can run before React commits the new `reise` prop. The old rendered props are not a final decision. This operation enters `warteAufBestaetigung`: the form stays mounted, the draft and `original` stay, and the existing saving text stays visible. The next committed render decides the exit. That commit is the local waiting-state update itself when no newer `reise` prop arrives. A domain match for this same operation closes and focuses. The unchanged original re-enables the form without a success claim. The same-domain newer-version case above, and any other non-attributable target, shows its recovery text and re-enables this form. After that recovery the user may edit the draft. A later graph that matches the original submission may close this operation only while the draft is still the draft from submit. It must not clear edits made after recovery. The wait is that one committed render, not an unbounded disabled state. A newer operation keeps its own lock. This operation's exit does not clear that lock, and an unmount still does not cancel the already-sent write.

A newer operation, another trip, another target id, another `editorGeneration`, or an unmount makes the old response a UI no-op. The old response also does not set the conflict or waiting state on that newer form.

A late delete result may set the visible alert and move focus only while its trip id, target item id, and delete `operationId` still match. A revision-only refresh of the same trip does not retarget that alert. A different trip id or a newer delete operation drops it.

`usePlanEditorLifecycle` owns one in-flight operation id per editor and one per delete action. A second submit on the same action returns while the first is in flight. Editor pending and delete pending stay separate; a late delete must not close or clear the editor. A newer context may reset its own pending flag. The old completion handler must not unlock, clear, or focus that newer context.

Focus order: the connected trigger if it still has a client rect; else a remaining control inside `[data-plan-punkt="<id>"]`; else the unassigned heading when that region is present; else the existing zero-day explanation or the plan section, with `tabIndex={-1}` and the existing focus ring. Do not invent an add button on a zero-day trip. Do not hide overflow on the page or root.

### Guest delete

`gastPlanpunktEntfernen(reise, punktId)` keeps that signature because `GastArbeitsbereich.tsx` is readonly and calls it with the in-memory trip.

This replaces the basis rule in the plan reviewed at `13ccf37a`. Identity plus revision is not a sufficient expected basis. Same-id, same-revision content drift fails closed with zero writes. Finding A-P1-PLAN-01.

The raw path is one capture inside `gastPlanpunktEntfernen`. It does not call `gastspeicherLaden`, `gastreiseLaden`, `gastreiseLadenNach`, `legacyUebernehmen`, or `aktiveGastreiseVorpruefen`. The preflight helper reads and then discards the graph, so a second read could observe different bytes. The delete path also does not call `rohLesen`, which collapses a missing key, a parse failure, and an unreadable store into `null`. It does not read or write the queue key or the legacy key.

1. Capture `const roh = aktiveSchluesselRohLesen()` once. `nicht_im_browser`, `speicher_unlesbar`, and `fehlend` throw before any set. Those raw bytes stay. A missing active key does not migrate a legacy draft.
2. `JSON.parse` those captured bytes once. A parse throw fails closed and does not write.
3. `const aktuell = reiseLesen(parsed)` once. `null` is an invalid current graph, fails closed, and does not write. `aktuell` is the only write base.
4. `const erwartet = reiseLesen(reise)` once. `null` is an invalid caller, fails closed, and does not write. The caller object is not mutated.
5. Explicit checks on those two validated graphs: `erwartet.id === aktuell.id`, then `erwartet.revision === aktuell.revision`. Either mismatch throws `VeralteteFassungFehler` and does not write.
6. Pure comparison, only after those checks, in `gastLoeschBasisGleich(erwartet, aktuell)` in the owned helper. The helper calls the existing pure `tageEtappenZuordnen` on each validated graph separately. That function returns a new trip when it fills missing `stageId` values and does not mutate its argument. The helper then compares `stableStringify` of both projected values. `stableStringify` sorts object keys at every level, preserves array order, and drops no field: `id`, `revision`, `updatedAt`, `createdAt`, title, `travelWish`, `readinessItems`, `party`, stages, days, items, `ohneTag`, placement, notes, booking, price, provider, and traveller fields all remain. It does not ignore `stageId`. It does not delete metadata. Neither input is written back.
7. A semantic mismatch throws `VeralteteFassungFehler` and does not write, including when id and revision already matched.
8. Count the id in `aktuell.days[].items` and `aktuell.ohneTag`. The count uses the unprojected write base. Anything other than exactly one match throws, does not increment `revision`, and does not write.
9. On success, build the next graph from `aktuell` only. Remove that one item, renumber `position` inside every day list the way lines 1084–1088 do today, and filter `ohneTag` without inventing a new `ohneTag` renumber. Set `revision` from `aktuell.revision + 1`. Do not copy fields from `erwartet` or from either projected copy. Then call the existing `gastreiseSpeichern`, which sets `updatedAt` and readback-checks.

`tageEtappenZuordnen` fills a missing `stageId` only for `single_destination` with one stage, and for `legacy_fallback`. For `explicit`, `unassigned`, no stages, or `single_destination` with a stage count other than one, it returns the input unchanged. The compare still uses the full projected value in those modes. An existing `stageId` is kept on both sides, so a real stage difference remains a mismatch.

Legitimate load-only success: the stored graph is `single_destination` with one stage and null `stageId` on the day and items. The caller is that same validated graph after `tageEtappenZuordnen`, so the nulls are filled with that one stage id, while id, revision, `updatedAt`, title, `travelWish`, notes, and placement are unchanged. Projecting the raw graph fills the same nulls. Projecting the caller keeps the fills it already has. The canonical strings match. The write still starts from the raw `aktuell`, so the survivor's stored `stageId` stays null. The comparison projection is not persisted.

Same-revision drift, each with equal id and revision, is a mismatch and causes zero writes: a different title, a different `travelWish`, a different note on an item that is not the delete target, a different target placement (`dayId` or day list versus `ohneTag`), a different `updatedAt` or other metadata, or a caller `stageId` that is not the value `tageEtappenZuordnen` would fill from the raw graph. Modes that do not fill still reject a different explicit `stageId`. `readinessItems` and `party` are included with the same id, the same revision, and the same `updatedAt`, because their existing writers can change those fields without bumping revision. Those writers are not edited.

The frozen `gastreiseSpeichern` does not compare again. A store that changes after the captured read and before the set remains a non-atomic residual. This plan does not edit the setter and does not claim a lock. `SpeicherFehler` is a failure. If `setItem` ran and the readback did not match, there is no second repair write and no claim that the previous bytes were restored.

A repeated call with the pre-delete snapshot fails the revision check and leaves the post-delete bytes unchanged. A repeated call with the returned trip and the same id fails the exactly-one check and does not bump `revision` again.

Technical Lead review of the unchanged baseline, reported with this finding, already reproduced the old function against isolated synthetic `localStorage`: a newer same-trip graph lost title, `travelWish`, and a survivor note, and revision regressed 7→4; another active trip was replaced by the stale caller; an absent target still reported success and bumped revision. That is review evidence, not author proof from this session, and it claims no hosted or Production damage. The implementation tests below are the required proof; their command results are in the implementation report.

Account delete is unchanged. Mounted account proof uses a callback fixture. `null` from that callback is not treated as a stronger refreshed-graph confirmation than today's `router.refresh()`. The existing "written but refreshed state not confirmed" edit outcome stays an uncertain/error state inside the editor contract; this slice does not paint it as saved.

## Synthetic proof

Node tests call the real `gastPlanpunktEntfernen` against an in-memory `localStorage`, and the pure helper for the decision table:

- fresh valid delete, then readback and reload through the real loader; the target is gone; day positions are contiguous; one unrelated item and its stage, time, route, booking, price, provider, and traveller fields stay
- legitimate projected caller: stored `single_destination` graph with null `stageId` values; caller is `tageEtappenZuordnen` of that graph and otherwise equal, including `updatedAt`. Delete succeeds. Raw readback keeps null `stageId` on the surviving day and item. Title, `travelWish`, and the survivor note stay. The projection is not stored
- same-revision drift, one field at a time, with the same id and revision: title, `travelWish`, survivor note, target placement, `updatedAt`, and a caller `stageId` that the projection would not produce. Each call throws, and the active bytes stay identical
- `readinessItems` drift and `party` drift, each with the same id, the same revision, and the same `updatedAt`: throw, active bytes identical, and no call into those writers
- different active trip, and a newer stored revision with an older caller: active, legacy, and queue bytes identical
- missing key, malformed JSON, schema-invalid JSON, invalid caller, throwing `getItem`: no `setItem` and no `removeItem` on the active, legacy, or queue key
- absent id and duplicate id: no revision bump, bytes identical
- setter throw and readback mismatch: the thrown error is the result; the test records the bytes left behind and does not call them a rollback
- second delete with the old snapshot does not mutate again
- the pure helper, without storage: projected copies compare equal; each drift case compares unequal; neither input object is mutated

Mounted harness under `scripts/trip-plan-editing-placement-recovery-1/` bundles the real `TripWorkspacePlan` and `PlanpunktEditor` with esbuild and isolated local Playwright. Callbacks are the test double. Guest persistence cases call the real `gastPlanpunktEntfernen`, not a stub of it. No personal browser profile, no production storage, no hosted account.

Mounted cases:

- zero-day existing activity, note, and protected flight: editor opens; protected flight shows placement only; null date and time stay empty; save, thrown error, and domain error keep the typed draft; cancel and Escape close and land on a visible fallback; no dialog remains
- day A → day B, day → unassigned, unassigned → a real day, with null times and a long label; the callback receives the captured original and the requested `dayId`; an unknown day and an original-version mismatch stay on the draft and show the existing error text
- double-click calls the writer once
- replaced context: a late resolution after a new trip id, a new item id, a new `editorGeneration`, or unmount does not close, clear, unlock, or focus the replacement form. The replacement keeps its own draft
- (a) own readback: the callback resolves `null` and the visible single item matches this submission on every field except `rowVersion`. Guest uses the copied version. Account fixtures use a real changed `rowVersion` in both orders: `null` while the rendered graph is still the original, then the confirmed graph; and the confirmed graph first, then `null`. Neither order shows a conflict or leaves the form disabled. The id alone does not close the form
- (b) unrelated graph change: `readinessItems`, `party`, or another item changes while the open target's JSON still equals the captured original. The form does not remount. The draft and `original` stay. A late error may show. A late `null` does not close
- (c) same-id replacement: while the request is pending, the only item with that id changes content or placement, and `revision` and `updatedAt` stay the same. Late `null` and late error neither close, clear, focus, nor unlock. The draft and `original` stay. The conflict text is visible
- (d) removed or duplicated target while pending: the same non-effects as (c), for both a late `null` and a late error
- (e) original domain A with version V1, submitted domain B, visible domain A with version V2: both callback `null` and callback error enter conflict/unconfirmed recovery. The draft and `original` stay, Abbrechen works, and a newer operation is untouched
- (f) domain no-op: expected domain equals the original domain, the visible item keeps that domain and has a new `rowVersion`, and this operation's callback is `null`. The form closes. It does not stay in `warteAufBestaetigung`
- (f2) guest domain no-op with an unchanged item `rowVersion`: this operation's callback is `null`, the visible item is still domain A version V1, and the operation still owns the unchanged draft. The form closes. A new `rowVersion` is not required
- (g) no newer `reise` arrives after the waiting-state commit: the form re-enables and does not claim success
- (h) after recovery the draft is edited, then a graph matching the original submission arrives: that graph does not clear the edited draft
- an older `operationId` does not apply any of those effects, including the conflict text, to a newer form
- delete error on a zero-day list is a visible alert and receives focus; a late delete error does not alert a newer trip
- account fixture: the same plan component shows the callback error and does not claim a refreshed account graph

Viewports in that harness: 320, 390, and 1280, plus 320 with root `font-size: 32px`. The same run also checks 280, 360, 430, 768, and one landscape size for horizontal overflow and a reachable control. Those are CSS viewport and root-font simulations. They are not a physical device, screen reader, native zoom, hosted account, or Preview pass. No page-level overflow clip is added to hide a defect.

Existing `gastspeicher.test.ts` "nach dem Entfernen sind die Reihenfolgen wieder lückenlos" stays, and is re-run. Existing premium-4 source and audit assertions are re-run unchanged unless a locator actually moved.

Local gates after implementation: the focused tests, the mounted harness, `gastspeicher` regression, premium-4 regression, TypeScript, lint, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, and a production build. Full exact-head App, Auth, and Vercel gates stay mandatory and unchanged. No workflow, timeout, dependency, config, schema, or gate edit. A skip is recorded as a skip. A tool that does not run says NOT VERIFIED and why.

## Unknowns

- Whether the mounted bundle pulls `server-only` through a workspace import. If it does, the harness aliases only that package throw. The report names the alias. Product files stay on the allowlist.
- Exact-head CI, Auth, and Preview are not run for this plan head. They are Technical Lead gates after an implementation push.
- `next-env.d.ts` may be rewritten by the environment. It is not part of the slice and is not committed.
- The frozen `gastreiseSpeichern` leaves a gap between the captured read and the set. This plan does not close that gap by editing the setter and does not claim the check is atomic.

## Boundaries

Do not mark Ready. Do not merge. Do not close #996. Do not start a follow-up slice. Do not sync `main` or edit #751. #985/#982 scoped HOLD and its interrupted review stay untouched. #917 denied hosted readback stays untouched. #968 cleanup stays paused. #748 personal-browser automation stays suspended. No hosted read or write, migration, RLS, Auth, secret, provider, model, or payment activation. Self-review is not Technical-Lead PASS. A new head invalidates earlier gates.

## Costs and security

No new dependency, hosted service, provider call, model call, or recurring cost. The guest change touches only the active `localStorage` key, and only after the captured basis matches. It does not broaden who can delete, and it does not change the account action. The integrity fix rejects a stale or foreign graph instead of storing it.

## Stop

The accepted plan is implemented in this delivery. STOP for independent Technical-Lead code review. This is not code PASS, Ready, or merge.
