# Jetnity Account Traveller Management Completion 1 — PLAN

Date: 2026-10-25. Plan for immutable TASK V1. Revised in the same session after Technical-Lead PLAN review V1 ([comment 6392456358](https://github.com/Jetnity/jetnity/pull/1008#issuecomment-6392456358)) on exact head `086028726f8ddd93c3a0a04ac7825c786effa16e`, plan blob `dc7d874149201611c1688884dc9781af6e25776d`. This revision answers A-PLAN-01, A-PLAN-02, A-PLAN-03, and A-PLAN-04. A further same-session correction answers Technical-Lead PLAN re-review V2 ([comment 6392525661](https://github.com/Jetnity/jetnity/pull/1008#issuecomment-6392525661)) on exact head `bd5818c90bd8bdcb4c66eb25c7dd73397304f684`, plan blob `7bf8c18c94fae84d8586d1f0c03144e98f8246cc`: A-PLAN-05 and A-PLAN-06. The same session then folds in the clarification on [comment 6392534988](https://github.com/Jetnity/jetnity/pull/1008#issuecomment-6392534988) at head `60bae304caf540dbd99b7184006ccfafb1c09c68`, plan blob `74b15f39c12f24c083aa6231234e6de2363aad54`: an acknowledged repeat uses that receipt's editor, and citizenship and document success copy confirms stored metadata. The eight-action parent-held design stays. TASK V1 stays byte-identical. This commit edits only this plan. No product, test, script, or evidence implementation is included. Implementation waits for a fresh head-bound Technical-Lead acceptance of this revised plan.

## 1. Identity

| Field | Value |
| --- | --- |
| Logical author | Jetnity Account Traveller Management Completion 1 — Cursor Generation 1 |
| Requested model | Grok 4.7 High Fast / `grok-4.7-high-fast` |
| Actual `originalModelName` | `grok-4.7-high-fast` |
| Session | https://cursor.com/agents/bc-3b7c97c5-d9fa-4326-9000-14377b2dd939 |
| Session id | `bc-3b7c97c5-d9fa-4326-9000-14377b2dd939` |
| UI rename | Performed. The rename tool returned the title `Jetnity Account Traveller Management Completion 1 — Cursor Generation 1`. A self-report is not an independent Technical-Lead UI observation. |
| Branch | `feat/r106-account-traveller-management-1` |
| Draft PR | #1008 |
| Tracking | #1005 |
| Batch / precheck | #1003, [comment 6392318194](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6392318194) |
| Canonical index | #751 R106 V1 |
| Lane | R106 A |
| Machine mode | `NORMAL` (`.jetnity/operating-mode.json`, re-read this session) |

The requested model is the attested runtime model from this run's identity. This plan does not use Auto or another model.

## 2. Exact baseline re-read this session

`git fetch origin main` completed before these values were recorded.

| Ref | SHA |
| --- | --- |
| `origin/main` | `500fbe40c8c8a70a0fe0d291782289f809d5d5b3` |
| `origin/main` tree | `883e72fdab1411968b74dfaf879c4eea46891b9a` |
| Seed head before this plan | `d1bebbaed507be35c033dc05f10d90c6fb7ba4ec` |
| TASK blob | `fab67b9438388ff876eb9f98e1796e2edd091c47` |
| Merge-base with `origin/main` at seed | `500fbe40c8c8a70a0fe0d291782289f809d5d5b3` |
| Ahead / behind at seed | 1 ahead / 0 behind |
| Operating-mode blob | `1912bf56751a940acc56fad84e2bf9e6a174e0fa` |
| Seed diff | `docs/JETNITY_ACCOUNT_TRAVELLER_MANAGEMENT_COMPLETION_1_TASK_V1_2026-10-25.md` only |

Reviewed plan head `086028726f8ddd93c3a0a04ac7825c786effa16e` was 2 ahead / 0 behind that same merge-base, diff TASK + PLAN only. The head after this revision, with merge-base and ahead/behind, is in the PR comment posted from the revision commit. That new head invalidates the V1 plan gate. TASK V1 stays byte-identical. `origin/main` was fetched again immediately before the revision and was still `500fbe40c8c8a70a0fe0d291782289f809d5d5b3`.

Live index [#751](https://github.com/Jetnity/jetnity/issues/751) top section, re-read this session, is R106 V1. Lane A is TASK-only at the seed above. `JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md` still open on the R105 closure pointer. Those paragraphs are historical. Live main, live mode, #751, and the precheck supersede them. This plan does not edit those Technical-Lead-owned files.

Integration remains **O → A → T**. This lane does not read or edit sibling branches. If `origin/main` moves past `500fbe40c8c8a70a0fe0d291782289f809d5d5b3`, implementation stops until the Technical Lead gives an explicit same-session sync instruction.

## 2a. Startup reads

These reads bind the existing rules. They do not add a product decision.

| Document | What applies here |
| --- | --- |
| `.jetnity/operating-mode.json` | `mode` is `NORMAL`. Re-read this session. |
| TASK V1 | Immutable scope, eight actions, outcome rules, proof, and stop. |
| `JETNITY_START_HERE.md`, `docs/ACTIVE_WORK_STATUS.md` | Historical R105 pointer. Live writer index is #751. Neither file is edited. |
| `AGENTS.md` | Account registry work stays on the trip graph's dual authority, server-side writes, empty distinct from error, and no new provider. |
| `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md` Phases F–H | This session delivers and stops. Self-review is not PASS. The same session fixes a later CHANGES REQUIRED. A new head invalidates this gate. |
| `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md` and slice planning standard §§1–5 | One writer on this branch. The precheck already fixed three disjoint writers and integration O → A → T. |
| `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md` §1 | Live evidence wins. #751, #1003, and comment 6392318194 were re-read with this plan. |
| `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md` §§8–9 and 11 | §§8–9 do not assign this interaction repair. §9 keeps Account privacy and session work on its own minimum. §11 requires the core journey to stay coherent. No build-order change. |
| `docs/JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md` Phase 1 items 2–3 | Account Registry and multi-citizenship credentials are already in the V1 core. This plan repairs their existing account interaction. It adds no Phase 2 surface. |
| `JETNITY_VISION.md` product core | The registry remains reusable account facts. A trip snapshot stays the trip's current truth. |
| `ARCHITECTURE.md` §§3–4 and 4c | Registry writes stay on `createServerActionClient()` and owner RLS. The account page stays behind the existing `/account` proxy. This plan does not change clients, Auth, or RLS. |
| `DECISIONS.md` ADR-0037, ADR-0187 | A failed read is not an empty list. Registry identity is UUID `id` and `clientRef`. Citizenships and documents are first-class. A missing document–citizenship relation stays `null`. Issuer and residence do not create a citizenship. No default or chosen credential. |
| `DESIGN_SYSTEM.md` §1 | Existing account tokens and controls stay. No new brand color. |
| `docs/PRODUCT_QUALITY_STANDARD.md` §§6 and 8 | Empty, loading, and error stay separate. Keyboard, focus, and programmatic errors stay on the surface that owns the operation. |
| `docs/LOGIC_STANDARD.md` §§4 and 6 | A missing value stays missing. An unknown write outcome stays unknown. |
| `docs/CONTINUITY_STANDARD.md` §11 | This plan records the design, the proof classes, and the stop. It is not an implementation report. |
| `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md` §§1–3 | Several citizenships and documents stay equal options. The result of this screen is account metadata, not a visa or carrier decision. Null association stays null. |
| Assigned source | The two account components, registry copy, the eight action signatures, input limits, the account travellers page and loader, and the existing registry UI/source tests named in section 6. |

## 3. Evidence class for this delivery

This plan is source reading plus live git and GitHub reads. It is not mounted UI behavior, not a local test run, and not hosted, CI, RLS, or database proof. The existing Vercel preview on the task-only seed deploys the unchanged account page. It is not acceptance of this interaction repair. No hosted data was read.

The source gaps below are confirmed by the cited lines. They are P2 candidates from the precheck. This plan does not claim a browser reproduction and does not change their severity.

## 4. Source-confirmed gaps

Assigned source at the seed head:

1. `components/account/AccountReisende.tsx` lines 48–62 start an async transition and, on any `{ ok: true }`, clear the current create form and call `router.refresh()`. There is no intent id, no draft generation, and no `try/catch`. A rejection skips the clear and also skips any honest unknown-outcome message. A success clears whatever is in the form at resolution time, including text typed after the submit. Closing the panel (lines 65–68) does not cancel the server call. The page has one `status` state (lines 42 and 81–92). Every card writes that same state through `onStatus`.
2. `components/account/AccountReisendeKarte.tsx` lines 113–130, on any success of the shared `ausfuehren` helper, announce through `onStatus`, close the delete dialog, reset the document draft, clear the citizenship draft, and call `router.refresh()`. That helper is used for traveller delete, citizenship create/delete, and document create/edit/delete. A citizenship success therefore clears a document draft started after the click. Traveller edit (lines 261–274) is a second async transition with the same missing generation check and the same `onStatus` leak. There is no `try/catch`.
3. Closing or switching the panel (lines 96–107) clears the card's local editors when `verwaltet` becomes false. The in-flight transition still completes on that card instance and can call `onStatus` and `router.refresh()` afterwards. `registryFlaecheVerwalten` keeps only one managed id, so opening B closes A while A's request is still running.
4. The submit buttons use `disabled={pending}` from `useTransition`. That flag changes on a later render. Two activations in the same turn can both pass the check. The synchronous guard the task requires is not in the source.
5. Create actions return `{ ok: true, wert: null }` and mint `client_ref` on the server. `registryTravellerAnlegen` (`lib/traveller/account-registry-aktionen.ts` lines 96–105), `registryCitizenshipAnlegen` (lines 167–176), and `registryDocumentAnlegen` (lines 224–236) do not return an id. Known-id update and delete return ok only after `.select('id')` finds the targeted row (traveller update lines 115–127, traveller delete lines 137–146, citizenship delete lines 186–196, document update lines 256–271, document delete lines 281–291). The UI cannot treat a new list row with the same label as the created row. `wert` is never a created id under this contract.
6. Empty and error are already different strings (`REGISTRY_COPY.leerTitel` versus `fehlerTitel` / `fehler500` / `fehler503`). The error panel has no read-only retry. `router.refresh()` is only called after a write success, and its return is not distinguished from a later props observation. `app/account/travellers/loading.tsx` owns the loading sentence and is frozen. `registryLaden` returns either rows with `problem: null` or `zeilen: null` with a `Problem` of status 500 or 503.
7. Traveller delete confirms (lines 295–333) and the copy says trips are not rewritten. The title is the generic `Registry-Eintrag löschen?`. It does not name the entry. Citizenship delete (lines 354–363) and document delete (lines 485–493) dispatch on the first click, with no confirmation and no target name.
8. Document create/edit keeps an empty citizenship option (`REGISTRY_COPY.dokumentKeineZuordnung`, form initial `citizenshipId: ''`). `optionaleZuordnung` maps `''` to `null`. The card does not read `citizenships[0]` or `documents[0]`. Limits come from `registryKindLimitErreicht` and `TRAVELLER_CONTEXT_GRENZEN`: 8 citizenships and 12 documents. At 12 documents, an existing document can still be edited (`dokumentModus` is an id). At 8 citizenships, the add form is hidden and traveller edit stays available. Those rules stay.
9. Label and residence readers: empty label becomes `null` (`accountRegistryLabelLesen`); empty residence becomes `null`. Invalid label or country fails closed. The UI currently sends the raw fields and lets the server action return `{ ok: false, meldung }`. Citizenship add is the exception: a missing country or a duplicate country calls `onStatus` and does not call the action (lines 380–387).
10. Props are canonical for the compact card, which reads `traveller` on each render. The edit fields are local state initialized at card mount. A later props change does not overwrite them, and it also does not explain a conflict. The travellers page (`app/account/travellers/page.tsx`) is frozen, so this client cannot add a server nonce to know that `router.refresh()` produced a new read.

Related contracts, read-only:

- Dual authority copy already says this registry is not the trip plan and that existing trips keep their snapshots.
- `AccountReisende` props stay `{ problem, travellers }`. The harness supplies those props. It does not change the page.
- `LandFeld` stays the shared country control. It is not edited.
- No passport number, date of birth, MRZ, scan, health field, default citizenship, or registry-to-trip import exists on this screen. None is added.

## 5. Ownership

Implementation, after plan acceptance, may change only:

| Path | Role |
| --- | --- |
| `components/account/AccountReisende.tsx` | Page surface: create form, list, empty, read error, focus host. |
| `components/account/AccountReisendeKarte.tsx` | One traveller card. Editors call the parent workflow. They do not own intent identity. |
| `components/account/useAccountRegistryWorkflow.ts` | New. React adapter: synchronous ref, clock, frozen action calls, `router.refresh()`. |
| `lib/traveller/account-registry-copy.ts` | German sentences for honest save, read, unknown outcome, conflict, and named delete. |
| `lib/traveller/account-registry-workflow.ts` | New. Pure state machine. No React, router, or server action. |
| `lib/traveller/account-registry-workflow.test.ts` | New. Pure cases, always in `npm test`. |
| `lib/traveller/account-registry-workflow-ui.test.ts` | New. Source contract in `npm test`, mounted cases only under the harness env in section 9. |
| `lib/traveller/account-registry-ui.test.ts` | Only assertions that name the old call site, if the call moves into the hook. |
| `lib/traveller/account-travellers-premium-registry-ux-1.test.ts` | Only the assertion that the action calls sit inside the card source after the panel marker. |
| `scripts/account-traveller-management-completion-1/**` | Local synthetic mount. |
| `docs/evidence/account-traveller-management-completion-1/**` | New evidence for this lane. Prior evidence stays. |
| `docs/JETNITY_ACCOUNT_TRAVELLER_MANAGEMENT_COMPLETION_1_{STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-25.md` | Later delivery docs. Not this commit. |

The hook is required. Card-local `useState` is what a late success clears, and the read-error branch unmounts the list. The parent component stays mounted in both cases, so the workflow state has to live there. The hook is the adapter for this screen. It is not a registry framework and it is not used by Trip.

These paths stay at their seed bytes:

`lib/traveller/account-registry-aktionen.ts`, `account-registry-daten.ts`, `account-registry-eingabe.ts`, `account-registry-abbildung.ts`, `account-registry-anzeige.ts`, `account-registry-meldung.ts`, persistence, trip registry modules, `app/account/travellers/page.tsx`, `loading.tsx`, `LandFeld`, account security/export/delete/bookings, navigation, styles, `package.json`, the lockfile, workflows, migrations, RLS, and Auth.

`dokument-lebenszyklus-ui.test.ts` requires the card to keep `useSyncExternalStore`, `heutigesDatum`, `ablaufText`, and `DOKUMENT_LEBENSZYKLUS_COPY.kontoHinweis`. Those stay on the card. The calendar subscription does not move into the workflow.

## 6. Design

### 6.1 Pure machine

`lib/traveller/account-registry-workflow.ts` exports a serializable state and pure transitions. Tests call those functions with a fixed id sequence and a fixed clock. Production ids come from `crypto.randomUUID()` inside the hook. Those ids identify a local attempt. They are not sent to the server and they are not written as `client_ref`.

Surfaces:

- `anlegen` — the create-person form.
- `reisender:<uuid>` — one traveller card.

One surface has at most one in-flight attempt. A second begin on that surface returns the same state and no attempt. Create and a different traveller can be in flight together. Citizenship, document, edit, and delete on the same traveller share that traveller's single slot. That matches the card's current single transition and keeps one completion from clearing another editor on the same card.

An editor is narrower than the card. The editor identities are: the create-person form; traveller edit for one traveller id; traveller delete for that id; citizenship add for one traveller id; citizenship delete for one citizenship id; document add for one traveller id; document edit for one document id; document delete for that document id. One card shows one open editor. The hook keeps a separate draft slot for each editor identity. Opening or closing another editor does not copy that editor's fields into a different slot.

An attempt records:

- local attempt id
- one of the eight actions
- surface id
- editor identity
- context epoch captured at begin
- target ids: traveller, citizenship, document, each null when that action has no such id
- the payload captured at begin from that editor's draft slot

Dirtyness and context epoch are separate.

- Dirty means the user changed a field away from the snapshot last taken for that editor. A clean editor may display newer canonical fields. A dirty editor keeps the typed fields and shows the conflict in section 6.6.
- `kontextEpoche` is a monotone integer per editor. The next value is one greater than every epoch that editor has already used and every epoch stored on a receipt for that editor. The first open is 1. Reopen, cancel, field edit, explicit adoption, and clean canonical adoption all take that next value. Reopen never starts again at 1, and never at an epoch an old receipt still holds. A matching success reset does not by itself give the old attempt authority over the editor that exists after the reset.

An attempt stores the epoch it captured at begin. Increasing the epoch never deletes a receipt and never authorizes a write. A newer epoch is not a certificate that the old server call failed to run.

The hook also keeps a `Set` ref of in-flight surface ids, and that set is part of the state `beginnen` reads. Every Save, Enter, confirm, and acknowledged repeat calls `beginnen` before any `await`. The handler reads the ref and calls `beginnen` before it adds this call to the set. Only a returned attempt is inserted, synchronously, before `await` and before the next render. A second event in the same turn therefore sees the surface in flight. If `beginnen` returns no attempt, the set is left unchanged. `disabled={pending}` is only a visual hint. The refusal is `beginnen` on the current state, section 6.5.

### 6.2 Outcomes

Every action call is awaited inside `try/catch`.

| Resolved value | Class | Draft | Write again |
| --- | --- | --- | --- |
| Thrown or rejected | `unbestaetigt` | Preserved | No automatic call |
| Any value other than the two shapes below | `unbestaetigt` | Preserved | No automatic call |
| `{ ok: false, meldung: string }` | `abgewiesen` | Preserved | No automatic call |
| `{ ok: true }` | `gespeichert` | Reset only while the captured context epoch is still current | No automatic second write |

`wert` is ignored. `{ ok: true, wert: { id } }` is still only `gespeichert`. The id inside `wert` is not read, not selected, and not matched to a row.

`abgewiesen` shows the server `meldung` and no extra sentence that nothing was stored. `REGISTRY_NICHT_GEFUNDEN` stays that sentence. The UI does not invent a rollback.

`unbestaetigt` shows, on that attempt's own receipt: `Es ist nicht bekannt, ob die Änderung gespeichert wurde.` Where the user can choose another write, the receipt also shows `Der vorherige Versuch kann bereits gespeichert sein.`

A local citizenship check (empty country or duplicate country) is `lokal`. It stores the existing copy, creates no attempt, and does not call the action. Document type and the other fields stay server-validated, so an invalid document submit is a real attempt and, when the action returns, `abgewiesen`. The two classes use different attempt ids: `lokal` has none.

Closing the panel, switching traveller, or unmounting the page does not abort the server call. The server actions have no abort signal, and this lane does not add one. The completion is applied only through section 6.3.

### 6.3 Where a completion may write

`anwenden(stand, versuchId, ausgang)` keeps the receipt in every branch. Settling a promise records the outcome. It does not delete an `unbestaetigt` receipt.

- Unknown attempt id: no change.
- Already settled attempt id: no change, and the stored receipt stays.
- Captured epoch differs from the editor's current epoch: record the outcome on that receipt, leave the current draft, request no focus, and do not reset, close, or announce inside the current editor. An `unbestaetigt` outcome stays on the receipt.
- Captured epoch still matches: the receipt is updated. A create, citizenship, or document success may reset the submitted editor of that same epoch. A traveller-edit success may close that edit form. A delete success may close that confirmation. A traveller-delete success does not remove the card locally.

Receipts render in `data-registry-beleg` on the surface that owns the attempt. Card A shows its receipt on card A, including when A's panel is closed. The create receipt stays with the add control when the create form is closed. A's text is not rendered inside B's open panel (`data-registry-verwaltung`). There is no page-level status slot that one card can overwrite with another's outcome. A late result from A therefore remains discoverable on A and has no announcement inside B's active editor. An independent attempt on B keeps its own id, target, payload, and receipt.

Focus is a value on the state, not a call from the completion:

- Cancel create: focus the `Reisenden hinzufügen` button.
- Cancel traveller edit: focus `Angaben ändern`.
- Cancel a confirmation: focus the button that opened it.
- Cancel citizenship or document subform: focus the button that opened it.
- Escape with a confirmation open: close that confirmation only.
- Escape with the panel open and no confirmation: focus that card's `Schließen` button and close the panel, as today.
- A completion requests focus only when its captured epoch is still current and that surface is still the open one. A late result from A does not focus B. A late result after a canonical adoption does not focus the adopted editor.

Absence is decided only from a valid list, section 6.4: `problem === null` and `travellers` is an array. A traveller id, citizenship id, or document id missing from that array has disappeared. The draft for that target is dropped after any in-flight attempt has settled, and every receipt is kept. Focus moves only when it was inside the removed traveller, citizenship, or document and the browser has dropped it to `body`. A removed traveller then focuses the add button. A removed citizenship or document focuses that same card's `Verwalten` button, not another card and not an open editor. If the user has deliberately focused any other control, focus stays there. A 500, a 503, or an invalid prop pair does not mean an id disappeared and does not drop the draft or a receipt. The ok response of delete does not move focus by itself and does not remove the card locally. There is no optimistic row insert or delete.

### 6.4 Read observation

Props are classified before their content is compared.

| Props | Class |
| --- | --- |
| `problem === null` and `travellers` is an array, including `[]` | Valid canonical list |
| `problem.status` is 500 or 503 | Failed read |
| Any other pair, including `travellers === null` with `problem === null` | Invalid read |

A content stamp exists only for a valid list. It serializes each traveller id, label, residence, citizenship id and country, and document id, type, issuer, citizenship id, and expiry, in prop order. Object identity is not the stamp. `problem.status` is not part of the stamp, because a failed or invalid read is not a list observation.

`router.refresh()` is a read. Its resolved or rejected promise is not an observation, and it is not evidence that a particular refresh completed after an unknown write. The frozen page has no read nonce. The hook records the valid-list stamp at the moment a receipt becomes `unbestaetigt`. If those props are not a valid list, the receipt has no valid baseline. The next valid list is then a new snapshot. Unchanged content means the same stamp as a stored valid baseline. The hook starts a 4000 ms local deadline when a read is requested, and classifies whatever props are current. The deadline uses an injected clock in tests and `Date.now` / `setTimeout` in the browser. It is not a server timeout and it does not retry a write.

| Latest props | Read state | Unlocks another write |
| --- | --- | --- |
| Valid list whose stamp differs from that receipt's baseline | Newly observed valid canonical snapshot | Only together with the acknowledgment in section 6.5 |
| Valid list whose stamp is unchanged | Unconfirmed | No |
| 500, 503, or invalid | Failed read, unconfirmed | No |
| Deadline passes on an unchanged valid list, or `refresh()` throws and the list is unchanged | Unconfirmed | No |

A changed valid list is named only as a newly observed canonical snapshot. It does not say which `router.refresh()` produced it, and it does not say the read happened after the unknown server outcome. Several overlapping or delayed refreshes leave one current classification: the latest props. A delayed 500, 503, or invalid commit replaces a newer-looking snapshot for as long as those props are current. It withdraws the qualified observation, keeps every draft and receipt, and does not treat missing ids as deleted. A later valid list is classified again from its own stamp.

The technical limit stays in the evidence and the handoff. The product surface does not explain stamps, ids, or label matching.

Automatic `refresh()` runs only after `gespeichert`. `abgewiesen` and `unbestaetigt` wait for the explicit read button. The button label is `Erneut lesen`. Its hint is `Liest den aktuellen Stand neu. Das sendet keine Änderung erneut.` While a read is open the button is disabled and the region is `aria-busy`. Every read path, including failure and a delayed refresh, leaves the action-call count unchanged.

A confirmed save whose list is not yet a new valid snapshot shows the confirmation sentence and, separately, `Die aktuelle Liste ist hier noch nicht geladen.` A newly observed valid snapshot may show, separately, `Die angezeigte Liste ist ein neu gelesener Stand.` When a known id is absent from that valid list, the surface may add `Dieser Eintrag ist in der angezeigten Liste nicht enthalten.` Those sentences describe the snapshot. They do not name a cause.

A create never selects a card. Equal labels stay equal labels on screen and are not used to resolve an attempt.

An unchanged valid list stays unconfirmed. The user can press `Erneut lesen` again. That press still sends no write. Until a valid list with a different stamp is current, section 6.5 does not allow another write for that receipt.

The error panel stays for 500 and 503, with `fehler500` or `fehler503` plus `Erneut lesen`. `travellers.length === 0` with `problem === null` stays `leerTitel` / `leerText`. `travellers === null` with `problem === null` is invalid, so the component shows `fehler500` and the read button, and it does not show the empty state. The loader does not produce that pair.

A failed or invalid read may replace the visible list. It leaves parent-hook drafts and receipts in place. Disappearance is evaluated only after a later valid list. A dirty editor then reopens with its text.

### 6.5 One guard for every write

`beginnen` is the only way any of the eight actions is dispatched. Save, Enter, the delete confirm button, and the acknowledged repeat all call it. A local citizenship check does not. The button's enabled state is a hint. It is not the authority.

Receipt keys:

| Action | Key |
| --- | --- |
| Traveller create | `anlegen` |
| Traveller edit | `reisender:<id>:aendern` |
| Traveller delete | `reisender:<id>:loeschen` |
| Citizenship create | `reisender:<id>:citizenship-anlegen` |
| Citizenship delete | `citizenship:<id>:loeschen` |
| Document create | `reisender:<id>:document-anlegen` |
| Document edit | `document:<id>:aendern` |
| Document delete | `document:<id>:loeschen` |

Receipts are append-only. A settled receipt is never deleted and never rewritten, including its outcome, target, payload, epoch, and baseline stamp. Many receipts may share one key.

The current blocking receipt of a key is the newest receipt on that key whose outcome is `unbestaetigt`. Older unknown receipts stay in history and are not rewritten. A receipt that is still in flight is the pending replacement for its key. It blocks that key before it has an outcome, so an acknowledgment of the older receipt cannot dispatch while it is pending. When the pending replacement settles `unbestaetigt`, it becomes the current blocking receipt. The older unknown receipt remains byte-unchanged and is no longer a receipt an acknowledgment can name. When the pending replacement settles `gespeichert` or `abgewiesen`, that replacement is not a blocker. The newest remaining `unbestaetigt` receipt on the key, if one remains, is the current blocking receipt again. A known outcome on the replacement does not delete, rewrite, or retire that older unknown.

`beginnen(stand, aufruf)` reads only the state passed at that call. The hook keeps the latest props, receipt list, and in-flight set in a ref written on every render. The click handler reads that ref inside the event, before `await` and before the next render. The in-flight set in that `stand` does not yet contain this call. The handler does not close over an older eligible frame, and it does not pass a stored eligible flag.

The call returns no attempt unless every point below is true:

1. That surface has no in-flight attempt, and that key has no pending replacement.
2. If the key has a current blocking receipt, `aufruf.anerkennung` is `{ belegId, schluessel }` and both fields equal that receipt's id and key. A bare boolean, a missing id, or an id of an older receipt is refused. If the key has no current blocking receipt, `anerkennung` is absent.
3. If the key has a current blocking receipt, the latest props in `stand` are a qualified valid snapshot for that receipt's own baseline, section 6.4. A 500, a 503, an invalid pair, or an unchanged valid list fails this point. A snapshot that was qualified earlier does not survive into this call. If the key has no current blocking receipt, the latest props are a valid canonical list: a 500, a 503, or an invalid pair fails, and an unchanged valid list is allowed because there is no unknown baseline to move past.
4. The target is still eligible on that same current valid list. A known traveller, citizenship, or document id must still be present. A create must still be under the existing limit. A disappeared target fails this point.
5. When `anerkennung` names a blocking receipt, the new attempt's action, editor identity, and target ids equal that receipt's. The payload is the draft slot of that editor. It is never the draft slot of another editor on the same card. If that editor is not the open editor, the slot still holds the payload captured for it, and the open editor's fields are left unread. A call whose editor, target, or payload comes from a different editor is refused.

Reopening, editing, Enter, and a new context epoch do not satisfy point 2. Ordinary Save and Enter omit `anerkennung` and are refused while a blocking receipt or a pending replacement exists. A failed, unchanged, or invalid snapshot revokes eligibility at the next `beginnen`, even if the user had already pressed the acknowledgment control while an older frame was qualified.

The acknowledgment control is `Trotzdem erneut speichern` on the current blocking receipt only. Its visible text includes `Der vorherige Versuch kann bereits gespeichert sein. Das ist eine neue Speicherung.` Pressing it calls `beginnen` with that receipt's id and key, and with that receipt's editor. The handler does not read the fields of whichever subform is open. On success it appends a new attempt from that editor's draft slot and leaves the old receipt untouched. It promises neither exactly-once delivery nor a label match. A read does not press it. Enabling it does not press it.

A different key is independent. It keeps its own attempt, target, and payload, provided its own surface is not in flight and its own blocker passes the same five points. A later result for an in-flight attempt records that attempt's outcome once. When the epoch differs, it applies no reset, focus, or current-editor announcement. It does not alter any older receipt.

### 6.6 Props, dirtyness, and context epoch

Opening an editor snapshots the canonical fields and the epoch. Relevant context is the fields that editor can submit: traveller label and residence; the citizenship country set for an add; a document's type, issuer, citizenship id, expiry, and the citizenship ids offered in its select.

When a valid list brings new relevant context into a clean editor, the editor displays those fields and increases `kontextEpoche`. The in-flight attempt keeps the old epoch, so a later success or rejection cannot reset, close, or focus the adopted editor. Its receipt stays.

When a valid list brings new relevant context into a dirty editor, the typed fields stay, the epoch increases, and the surface shows `Der gespeicherte Stand hat sich geändert. Deine Eingabe bleibt stehen.` `Gespeicherten Stand übernehmen` copies the current valid props into the fields, clears dirty, and does not send a write. The epoch has already moved, so the old completion still has no UI authority.

A failed or invalid read adopts nothing and increases no epoch, because it is not canonical context and it is not disappearance.

### 6.7 Deletes name their target

All three deletes ask before they dispatch. The confirmation stores the target id at open.

| Action | Name shown | Safety sentence |
| --- | --- | --- |
| Traveller | `registryTravellerAnzeigeName` for that id, otherwise the current label on that id | Existing trip-snapshot sentence stays |
| Citizenship | That citizenship's country display name | Existing association sentence stays |
| Document | That document's type label, plus issuer when present | Metadata-only hint stays |

The confirm button sends the stored id through `beginnen`, not a label lookup. If a valid list no longer contains that id, the dialog closes. A failed or invalid read does not. Focus follows section 6.3. Cancel returns focus to the opener. Confirm calls `beginnen` with the current state. A historical acknowledgment or a bare boolean does not satisfy section 6.5.

This is a behavior change for citizenship and document delete: today those buttons dispatch immediately. It is inside the eight existing actions and the task's delete-confirmation requirement. It adds no data field.

### 6.8 Limits, null, and equal labels

The workflow calls `registryKindLimitErreicht`. It does not copy the numbers 8 and 12 into a second constant. At 8 citizenships the add control is absent, the limit sentence is shown, and remove plus traveller edit still dispatch. At 12 documents the add control is absent and an existing document id still opens its editor.

The document citizenship select keeps the empty option first. A new document starts at `''`, which the existing server reader stores as `null`. Props with a null association render `Keine Zuordnung`. No path reads the first citizenship or the first document.

List keys and attempt targets use `traveller.id`, `citizenship.id`, and `document.id`. Two equal labels remain two cards. The create result never queries by label.

### 6.9 What the components keep

`AccountReisende` still renders the eyebrow, title, dual-authority lead, add button, empty state, and cards. `AccountReisendeKarte` still renders the compact summary, expiry lines, and the management panel behind `data-registry-verwaltung="offen"`. Country input stays `LandFeld`. The hook receives the begin/apply events. The card does not import the eight server actions.

Drafts live in hook state only. Nothing is written to `localStorage`, `sessionStorage`, or a new table.

## 7. Copy

Existing success sentences claim a visible result that this client cannot yet see. Replacements:

| Key | Text |
| --- | --- |
| `erfolgAngelegt` | Die Anlage wurde bestätigt. |
| `erfolgGeaendert` | Die Änderung wurde bestätigt. |
| `erfolgGeloescht` | Die Löschung wurde bestätigt. Vorhandene Reisen bleiben unverändert. |
| `erfolgCitizenship` | Die Angaben wurden gespeichert. |
| `erfolgCitizenshipEntfernt` | Die gespeicherte Angabe wurde entfernt. Zugeordnete Dokumente behalten ihre übrigen Angaben. |
| `erfolgDokument` | Die Angaben wurden gespeichert. |
| `erfolgDokumentEntfernt` | Die gespeicherten Angaben wurden entfernt. |

`erfolgCitizenship` and `erfolgDokument` share `Die Angaben wurden gespeichert.` That sentence says the entered citizenship or document metadata was stored. It does not say a citizenship, a document, or any identity fact was checked. The two removal sentences say the stored entry was removed. They do not say the underlying fact was found invalid. `erfolgAngelegt`, `erfolgGeaendert`, and `erfolgGeloescht` remain the traveller-record sentences.

The list status stays a second sentence: `Die aktuelle Liste ist hier noch nicht geladen.` or `Die angezeigte Liste ist ein neu gelesener Stand.` Uncertainty about a possible earlier save appears on the receipt where the user decides whether to write again. The surface does not explain label or id matching. That correlation limit is recorded in the evidence and the handoff.

Added sentences are those quoted in sections 6.2–6.6, plus a named delete title that includes the display name. `leerTitel`, `fehlerTitel`, `fehler500`, `fehler503`, `ladenTitel`, the dual-authority paragraphs, the limit sentences, and `dokumentKeineZuordnung` stay. Loading copy stays in the frozen loading file.

`account-registry-ui.test.ts` asserts `erfolgGeloescht` contains `Vorhandene Reisen bleiben unverändert`. The replacement keeps that clause.

## 8. Acceptance and proof matrix

Reducer means `account-registry-workflow.test.ts` inside `npm test`. Mounted means the harness in section 9, fail-closed, with deferred promises and the real components. The mounted rows are executed by that command. They are not represented by a source-pattern test.

| Case | Reducer | Mounted |
| --- | --- | --- |
| Each of the eight actions: in flight, `gespeichert`, `abgewiesen`, `unbestaetigt`, confirmed save plus a new valid snapshot, confirmed save while the list is not yet a new snapshot | yes | yes, one representative path per action and the shared rules |
| Second begin on the same surface in one turn calls the action once | pure refusal | one same-turn burst of two click or submit events before React disables the control; one action call |
| Success from surface A after the user edits B | receipt kept on A; no reset or focus on B | A's receipt stays on A; B's open panel has none of A's text; focus stays out of B |
| Rejection from A after switch to B | `unbestaetigt` receipt kept on A; no announcement or focus on B | same, on the mounted cards |
| Close, reopen, type, then Save or Enter after rejection | reopen epoch is greater than the receipt epoch; ordinary Save and Enter omit `anerkennung` and `beginnen` refuses even when the snapshot is already qualified | same-turn submit and Enter send zero writes |
| Stale acknowledgment after 503, invalid props, or an unchanged list | `beginnen` refuses despite `belegId` of the current blocker | zero writes; the handler passes the props from the latest ref |
| `unbestaetigt` A, acknowledged B, then `unbestaetigt` B, then acknowledgment of A | A unchanged; B is the blocker; A's id is refused; no third attempt | zero further writes |
| Acknowledged B settles `gespeichert` or `abgewiesen` while A is still `unbestaetigt` | A unchanged and is the blocker again; ordinary begin is refused; only A's id can pass point 2 | zero further writes until that exact acknowledgment |
| Acknowledged repeat while the current blocker is qualified | new attempt id; old receipt byte-unchanged; editor, target, and payload come from that receipt's editor; no label match | uncertainty text visible; one new write; no card selected by label |
| Unknown receipt for document D or citizenship C, then another editor opens on the same card, then that receipt is acknowledged | attempt uses D's or C's editor, target ids, and draft slot; the open editor's fields are absent | the action stub receives that target and captured payload; the open form's values are not arguments |
| Traveller, citizenship, or document absent from a valid list | draft dropped only then; receipts kept; focus moves only from inside the removed target | add button or that card's `Verwalten` button receives focus; a control the user already focused is left alone |
| Target id absent during 500, 503, or invalid props | draft and receipt kept; epoch unchanged | the card state returns with the draft; no delete focus move |
| Valid list, then 500, then 503, then invalid, then a changed valid list | only the changed valid list qualifies; failures withdraw it | zero action calls on every read and failure, including a delayed failure after a newer snapshot and two overlapping refreshes |
| Unchanged valid list | stays unconfirmed and does not qualify | not-yet-loaded sentence remains; Save, Enter, and the repeat control send no write |
| Dirty editor receives new relevant context | fields kept, conflict set, epoch increased | late success and late rejection do not reset, close, or focus |
| Clean editor receives new relevant context while awaiting | fields follow props, epoch increased, receipt kept | late success does not reset or focus the adopted editor; late rejection does not announce there |
| Two travellers, one label | no label key | ok create does not focus or select either card |
| Null document citizenship | payload `null` | select stays on `Keine Zuordnung` through a valid props refresh |
| 8 citizenships | add begin refused by the limit gate the UI already hides | add control absent; edit and a citizenship delete confirmation still work |
| 12 documents | same for document create | add absent; edit of an existing document still submits |
| Empty valid list | `problem === null` and `[]` is a valid list, not a failure | `leerTitel` visible, `fehlerTitel` absent |
| 500 and 503 | failed read, not a list observation | matching sentence, read button, drafts and receipts kept, zero writes |
| Read retry | read transition creates no attempt | action-stub call count unchanged; `refresh` stub called |
| `ok: false` | draft kept, meldung stored, receipt kept | meldung visible, no claim that nothing was stored |
| `wert` with an id | id not on the state | no card selected from it |
| Delete confirmation | target id captured | dialog names the target; cancel restores focus; confirm goes through `beginnen` |
| Keyboard | — | Tab reaches the open controls; Escape follows section 6.3; Enter uses the same guard as Save |
| 320, 360, 390, 768, 1280 | — | no root overflow hidden by a new overflow rule; `scrollWidth` within `clientWidth` |
| 320 at root 32px | — | 200% root text via `font-size: 32px` on `documentElement` |
| Reduced motion | — | `emulateMedia({ reducedMotion: 'reduce' })`; no new animation added |
| Long label | 40-character label stays a label | wraps inside the card; no page-level horizontal scroll introduced |

The root-32 check is a font-size simulation. It is not native browser zoom, not a device, and not a screen reader. The evidence record says that. Existing `hover:-translate-y-0.5` on the add button stays; this lane adds no motion.

The mounted column is wiring proof only when the harness actually executes it. A source-pattern assertion is not that proof. Existing registry data, validation, persistence, and trip-separation tests stay in the regression run. They are not rewritten to make a new UI path pass. The two source tests in section 5 change only the call-site assertions that the move into the hook supersedes. Assertions for null association, limits, trip non-deletion, forbidden fields, and service-role absence stay.

## 9. Mount and CI boundary

`npm test` includes `lib/**/*.test.ts` and the verify workflow does not install Playwright browsers. The workflow file is frozen. A browser launch inside every `npm test` would fail that job. A new `test.skip` would change the baseline of two explicit conditional browser skips and would not be a pass.

`account-registry-workflow.test.ts` always runs in `npm test`. It covers the reducer column.

`account-registry-workflow-ui.test.ts` always runs in `npm test` for a source contract only: the two components reference the hook, they do not import the eight action functions, and the unconditional `setFormular(registryTravellerFormularAnfang())` / `setDokument(registryDokumentFormularAnfang())` success resets are gone. That contract is not wiring proof. The mounted matrix in section 8 is registered only when `ACCOUNT_TRAVELLER_MANAGEMENT_BROWSER=1`, and the harness runs that file with the variable set so those cases execute. Unset, the cases are absent from `npm test`. They are not passes and they are not skips. The implementation report gives the native pass, fail, and skip counts on one line, and the harness command, exit, and case count on a separate line. A native skip count never includes the unregistered mounted cases. Set, a missing browser fails the test.

`scripts/account-traveller-management-completion-1/run.mjs` sets that variable and runs the UI test file. It bundles the production `AccountReisende` with the esbuild package already present in `node_modules`, the same way the existing local harnesses do. It does not add a dependency. Aliases replace only `lib/traveller/account-registry-aktionen.ts` and `next/navigation`. `LandFeld`, copy, limits, and the card markup stay real. The bundle is served to a local Playwright page with the project CSS. Unexpected origins are aborted. There is no deployed route, no account session, and no Supabase client. Synthetic labels are fixed strings such as `Synthetische Person A`. Evidence goes under `docs/evidence/account-traveller-management-completion-1/` and does not overwrite an older run.

The action stub returns deferred promises the test resolves, rejects, or shapes. The navigation stub's `refresh` resolves without changing props. The harness wrapper then passes the next scripted `problem` and `travellers`. A resolved `refresh` with unchanged props must leave the not-yet-loaded sentence up.

Viewport evidence uses Playwright viewports and the root font-size above. `prefers-reduced-motion` is emulated. The record includes the commit, source digests, command, exit, case count, the alias boundary, browser version, viewport, root font, and motion setting.

If Chromium does not launch, the command exits non-zero. That run is NOT VERIFIED. It is not a pass and not a skip.

## 10. Implementation checks, after authorization

On the implementation head, in this same session:

- the harness command
- `npm test` for the new workflow tests and the existing registry, traveller-context, document-lifecycle, and country UI tests that import these files
- `npm run typecheck`
- `npm run lint`
- `npm run check:setup:ci`
- `npm run check:operating-mode`
- `npm run check:api-schutz`
- `npm run check:schema-bezug`
- `npm run check:dead`
- `npm run check:exports`
- `npm run check:deps`
- `npm run build`

No dependency, lockfile, workflow, config, global style, timeout, gate, or suppression change. The current baseline cited by the task is 7213 tests, 2 explicit conditional browser skips, and 181 lint warnings. The implementation report states the actual native counts, including those skips, and separately states the harness result. The harness cases stay out of the native pass and skip totals. A skip is not a pass. Eleven npm advisories stay untriaged and out of scope.

Native App, Auth, and Vercel CI on the exact head stay mandatory Technical-Lead gates. This plan does not claim them. Synthetic mounted evidence is not hosted Account, Next router, Supabase, RLS, Production, or launch proof.

## 11. Security, traveller context, and cost

Writes stay inside the frozen server actions. The hook does not use the service role, does not open a new route, and does not log draft fields. Delete names use the label or country or document type already shown on the card. Evidence uses synthetic names.

Several citizenships stay equal. Residence, issuer, and citizenship stay independent. A document with no citizenship stays unassigned. This screen does not decide visa, transit, or carrier rules. Unknown write results stay unknown.

No new runtime cost, provider, model call, or paid API. The local harness uses the existing Playwright install. The USD 100 monthly ceiling is unchanged.

Database, migration, RLS, Auth, and Production are untouched. The diff is the proof of that boundary. No hosted read or write is required or authorized.

Guest whole-trip and cross-tab limits stay as they are. Two account tabs can still race; this client cannot see the other tab. The unknown-outcome and list-observation rules cover that without an exactly-once claim. #985/#982, #917, #913/#911, #968, #748, #626, #937/#936, and Bern #934 stay on their current holds. This lane does not route around them.

## 12. Unknowns

- A changed valid list is a newly observed canonical snapshot. It does not identify which `router.refresh()` produced it, and it does not prove the read followed the unknown write. Unchanged content stays unconfirmed and does not unlock another write. A 500, 503, or invalid read is not disappearance. This limit is for the evidence and the handoff. The product copy stays the plain sentences in section 7.
- `LandFeld` keyboard and portal behavior inside the harness. The mounted test targets the control the user actually reaches. If a portal escapes the card, the focus assertion follows the real control and the evidence says so.
- Playwright availability on the evidence machine. A failed launch is NOT VERIFIED.
- `npm test` and GitHub CI do not execute the mounted matrix. They remain required and they are not a substitute for the harness.
- Returning the inserted id from the three create actions would let a later slice point at the real row. That edits `account-registry-aktionen.ts`, which this lane leaves frozen. It is a recommendation for a later Technical-Lead task, not work in this PR.

## 13. Stop

Status of this commit: plan only.

The next actor is the Technical Lead, reviewing this exact head. This session implements only after that head-bound acceptance. No Ready, no merge, no issue close, no `main` write, no sibling edit, and no follow-up slice.
