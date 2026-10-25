# Jetnity Account Traveller Management Completion 1 — PLAN

Date: 2026-10-25. Plan for immutable TASK V1. This commit adds this file only. No product, test, script, or evidence implementation is included. Implementation waits for an explicit head-bound Technical-Lead acceptance of this plan in this same session.

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

The plan commit head, merge-base, and ahead/behind after this file lands are in the PR comment posted from that commit. A later head invalidates this gate. TASK V1 stays byte-identical.

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
| `lib/traveller/account-registry-workflow-ui.test.ts` | New. Source contract in `npm test`, mounted cases only under the harness env in section 10. |
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

An attempt records:

- local attempt id
- one of the eight actions
- surface id
- draft generation captured at begin
- target ids: traveller, citizenship, document, each null when that action has no such id
- the payload captured at begin

Draft generation for a surface starts at 1 when the surface opens. It increases when the user changes a field, cancels a sub-editor, closes or switches the panel, reopens a sub-editor, or explicitly adopts newer props. It does not increase when a clean editor receives props, or when a matching success applies its one reset.

The hook also keeps a `Set` ref of in-flight surface ids. The click handler adds the surface id before any `await` and before the next render. If the pure begin returns no attempt, the ref entry is removed immediately. `disabled={pending}` may stay as a visual hint. Correctness is the ref plus the pure refusal.

### 6.2 Outcomes

Every action call is awaited inside `try/catch`.

| Resolved value | Class | Draft | Write again |
| --- | --- | --- | --- |
| Thrown or rejected | `unbestaetigt` | Preserved | No automatic call |
| Any value other than the two shapes below | `unbestaetigt` | Preserved | No automatic call |
| `{ ok: false, meldung: string }` | `abgewiesen` | Preserved | No automatic call |
| `{ ok: true }` | `gespeichert` | Reset only when the captured generation is still current | No automatic second write |

`wert` is ignored. `{ ok: true, wert: { id } }` is still only `gespeichert`. The id inside `wert` is not read, not selected, and not matched to a row.

`abgewiesen` shows the server `meldung` and no extra sentence that nothing was stored. `REGISTRY_NICHT_GEFUNDEN` stays that sentence. The UI does not invent a rollback.

`unbestaetigt` shows: `Es ist nicht bekannt, ob die Änderung gespeichert wurde. Es wird nichts automatisch erneut gesendet.`

A local citizenship check (empty country or duplicate country) is `lokal`. It stores the existing copy, creates no attempt, and does not call the action. Document type and the other fields stay server-validated, so an invalid document submit is a real attempt and, when the action returns, `abgewiesen`. The two classes use different attempt ids: `lokal` has none.

Closing the panel, switching traveller, or unmounting the page does not abort the server call. The server actions have no abort signal, and this lane does not add one. The completion is applied only through section 6.3.

### 6.3 Where a completion may write

`anwenden(stand, versuchId, ausgang)`:

- Unknown or already settled attempt id: no change.
- Current generation differs from the captured generation: the attempt is settled, the draft fields stay, no status is written onto the current generation, and no focus is requested.
- Generation still matches: the status is stored on that surface only. A create or citizenship or document success may then reset that surface's submitted editor. A traveller-edit success may close the edit form. A delete success may close that confirmation. A traveller-delete success does not remove the card locally.
- The status region for a card is inside that card. The create status region is inside the create form. A settled stale attempt does not render in the other region. There is no page-level status slot shared by the cards.

Focus is a value on the state, not a call from the completion:

- Cancel create: focus the `Reisenden hinzufügen` button.
- Cancel traveller edit: focus `Angaben ändern`.
- Cancel a confirmation: focus the button that opened it.
- Cancel citizenship or document subform: focus the button that opened it.
- Escape with a confirmation open: close that confirmation only.
- Escape with the panel open and no confirmation: focus that card's `Schließen` button and close the panel, as today.
- A completion requests focus only when its generation is still current and that surface is still the open one. A late result from A does not focus B.

When an observed list no longer contains a traveller id, that card's draft is dropped after any in-flight attempt for it has settled. If the last focused surface was that card and focus has fallen to `body`, focus moves to the add button. If the user has already focused another control, focus stays there. The ok response of delete does not move focus by itself. The card stays until the observed list drops the id. There is no optimistic row insert or delete.

### 6.4 Read observation

A content stamp is a stable serialization of `problem.status` plus each traveller id, label, residence, citizenship id and country, and document id, type, issuer, citizenship id, and expiry, in prop order. Object identity is not the stamp.

`router.refresh()` is a read. Its resolved promise is not an observation. The hook records the stamp at the call and starts a 4000 ms local deadline. The deadline is an injected clock in tests and `Date.now` / `setTimeout` in the browser. It is not a server timeout and it does not retry a write.

| Later render | Read state |
| --- | --- |
| Stamp differs before or after the deadline | `beobachtet` |
| Deadline passes, stamp unchanged | `ausgeblieben` |
| `refresh()` throws, stamp unchanged | `ausgeblieben` |

A stamp that changes after the deadline still becomes `beobachtet`. The deadline only changes the sentence from waiting to not-yet-loaded.

Automatic `refresh()` runs only after `gespeichert`. `abgewiesen` and `unbestaetigt` wait for the explicit read button. The button label is `Erneut lesen`. Its hint is `Liest den aktuellen Stand neu. Das wiederholt keine Speicherung.` While a read is open the button is disabled and the region is `aria-busy`. A second read is another explicit press.

If the save was confirmed and the read is `ausgeblieben`, the surface shows `Die Speicherung wurde bestätigt.` and `Die aktuelle Liste ist hier noch nicht geladen.` If the read is `beobachtet`, it shows `Die angezeigte Liste ist der zuletzt gelesene Stand.` For a known-id update, when the observed row's fields equal the captured payload, it may add `Die gelesene Liste zeigt die gespeicherten Angaben dieses Eintrags.` For a known-id delete, when that id is absent, it may add `Dieser Eintrag ist in der gelesenen Liste nicht enthalten.` Both sentences describe the list. They do not say this attempt was the writer that produced it.

A create, including citizenship and document create, never selects a card and never treats an equal label as the created row. The observed-list sentence for create includes `Ein Eintrag wird nicht an der Bezeichnung erkannt und nicht automatisch ausgewählt.`

Identical content produces an identical stamp. A successful read that changes nothing therefore stays `ausgeblieben`. That is the honest limit of a frozen page with no server nonce. The save sentence still stands. The user can press `Erneut lesen` again.

The existing error panel stays when `problem` is a 500 or 503, with the current `fehler500` or `fehler503` sentence plus `Erneut lesen`. `travellers.length === 0` with `problem === null` stays `leerTitel` / `leerText` and does not show the error panel. `travellers === null` with `problem === null` is not an empty registry: the component shows `fehler500` and the read button. The loader does not produce that pair; the component still refuses to render it as empty.

A read failure replaces the list, as it does today. Drafts remain in the parent hook. When a later observed list returns, a dirty surface reopens with its text.

### 6.5 Repeat after an unknown outcome

The control `Erneut speichern` exists only for `unbestaetigt`. It stays disabled until a read started after that outcome has reached `beobachtet`. The visible hint, including while disabled, is `Der vorherige Versuch kann bereits gespeichert sein. Das ist eine neue Speicherung.` A read does not press it. Enabling it does not press it. The press creates a new attempt id and captures the current draft, not the old payload if the user edited afterwards. For a create, the same hint covers the possibility of a second row. An observed row with the same label does not clear the hint and does not mark the attempt succeeded.

### 6.6 Props and dirty drafts

Opening an editor snapshots the canonical fields for that generation. A clean editor (generation unchanged since open or since the last prop apply) takes the next props into its fields and updates the snapshot. A dirty editor keeps the typed fields. When the canonical snapshot differs, the surface shows `Der gespeicherte Stand hat sich geändert. Deine Eingabe bleibt stehen.` The button `Gespeicherten Stand übernehmen` replaces the fields from current props, clears the conflict, and increases the generation. It does not send a write. An in-flight completion from the previous generation cannot clear the adopted fields.

### 6.7 Deletes name their target

All three deletes ask before they dispatch. The confirmation stores the target id at open.

| Action | Name shown | Safety sentence |
| --- | --- | --- |
| Traveller | `registryTravellerAnzeigeName` for that id, otherwise the current label on that id | Existing trip-snapshot sentence stays |
| Citizenship | That citizenship's country display name | Existing association sentence stays |
| Document | That document's type label, plus issuer when present | Metadata-only hint stays |

The confirm button sends the stored id, not a label lookup. If that id disappears from props, the dialog closes. Focus follows section 6.3. Cancel returns focus to the opener.

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
| `erfolgAngelegt` | Die Anlage wurde gespeichert. |
| `erfolgGeaendert` | Die Änderung wurde gespeichert. |
| `erfolgGeloescht` | Der Löschaufruf wurde gespeichert. Vorhandene Reisen bleiben unverändert. |
| `erfolgCitizenship` | Die Staatsbürgerschaft wurde gespeichert. |
| `erfolgCitizenshipEntfernt` | Die Staatsbürgerschaft wurde entfernt. Zugeordnete Dokumente behalten ihre übrigen Angaben. |
| `erfolgDokument` | Die Dokument-Metadaten wurden gespeichert. |
| `erfolgDokumentEntfernt` | Die Dokument-Metadaten wurden entfernt. |

Added sentences are those quoted in sections 6.2–6.6, plus a named delete title that includes the display name. `leerTitel`, `fehlerTitel`, `fehler500`, `fehler503`, `ladenTitel`, the dual-authority paragraphs, the limit sentences, and `dokumentKeineZuordnung` stay. Loading copy stays in the frozen loading file.

`account-registry-ui.test.ts` asserts `erfolgGeloescht` contains `Vorhandene Reisen bleiben unverändert`. The replacement keeps that clause.

## 8. Acceptance and proof matrix

Reducer means `account-registry-workflow.test.ts` inside `npm test`. Mounted means the harness in section 10, fail-closed, with deferred promises and the real components.

| Case | Reducer | Mounted |
| --- | --- | --- |
| Each of the eight actions: in flight, `gespeichert`, `abgewiesen`, `unbestaetigt`, save plus observed read, save plus missing read | yes | yes, one representative path per action and the shared rules |
| Second begin on the same surface in one turn calls the action once | pure refusal | two clicks before the deferred promise resolves |
| Success from surface A after the user edits B | stale apply changes nothing on B | typed text remains; A's alert is absent from B; focus stays out of B |
| Rejection from A after switch to B | no status and no focus on B | same, on the mounted cards |
| Close, reopen, and type during the request | new generation rejects the clear | same |
| Target id gone from props | draft dropped; focus request only if that surface held focus | focus lands on the add button only in that case |
| Props update on a dirty editor | fields kept, conflict set | conflict text and explicit adopt |
| Props update on a clean editor | fields follow props | same |
| Two travellers, one label | no label key | ok create does not focus or select either card; a new row with that label is not marked as this attempt |
| Null document citizenship | payload `null` | select stays on `Keine Zuordnung` through a props refresh |
| 8 citizenships | add begin refused by the limit gate the UI already hides | add control absent; edit and a citizenship delete confirmation still work |
| 12 documents | same for document create | add absent; edit of an existing document still submits |
| Empty list | stamp with `problem: null` and `[]` is empty | `leerTitel` visible, `fehlerTitel` absent, no error retry |
| 500 and 503 | stamp carries the status | matching sentence, read button, drafts kept |
| Read retry | read transition creates no attempt | action-stub call count unchanged; `refresh` stub called |
| `ok: false` | draft kept, meldung stored | meldung visible, no "nichts gespeichert" |
| `wert` with an id | id not on the state | no card selected from it |
| Unknown outcome then read | repeat stays disabled until `beobachtet` | read does not call the action; the repeat press is a new attempt and the hint is visible |
| Delete confirmation | target id captured | dialog names the target; cancel restores focus; confirm sends that id |
| Keyboard | — | Tab reaches the open controls; Escape follows section 6.3; Enter submits once |
| 320, 360, 390, 768, 1280 | — | no root overflow hidden by a new overflow rule; `scrollWidth` within `clientWidth` |
| 320 at root 32px | — | 200% root text via `font-size: 32px` on `documentElement` |
| Reduced motion | — | `emulateMedia({ reducedMotion: 'reduce' })`; no new animation added |
| Long label | 40-character label stays a label | wraps inside the card; no page-level horizontal scroll introduced |

The root-32 check is a font-size simulation. It is not native browser zoom, not a device, and not a screen reader. The evidence record says that. Existing `hover:-translate-y-0.5` on the add button stays; this lane adds no motion.

Existing registry data, validation, persistence, and trip-separation tests stay in the regression run. They are not rewritten to make a new UI path pass. The two source tests in section 5 change only the call-site assertions that the move into the hook supersedes. Assertions for null association, limits, trip non-deletion, forbidden fields, and service-role absence stay.

## 9. Mount and CI boundary

`npm test` includes `lib/**/*.test.ts` and the verify workflow does not install Playwright browsers. The workflow file is frozen. A browser launch inside every `npm test` would fail that job. A new `test.skip` would change the baseline of two explicit conditional browser skips and would not be a pass.

`account-registry-workflow.test.ts` always runs in `npm test`. It covers the reducer column.

`account-registry-workflow-ui.test.ts` always runs in `npm test` for a source contract only: the two components reference the hook, they do not import the eight action functions, and the unconditional `setFormular(registryTravellerFormularAnfang())` / `setDokument(registryDokumentFormularAnfang())` success resets are gone. That contract is not mounted proof. The file registers the mounted cases only when `ACCOUNT_TRAVELLER_MANAGEMENT_BROWSER=1`. Unset, those cases are not registered and are not skips. Set, a missing browser fails the test.

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

No dependency, lockfile, workflow, config, global style, timeout, gate, or suppression change. The current baseline cited by the task is 7213 tests, 2 explicit conditional browser skips, and 181 lint warnings. The implementation report states the actual counts. A skip is not a pass. Eleven npm advisories stay untriaged and out of scope.

Native App, Auth, and Vercel CI on the exact head stay mandatory Technical-Lead gates. This plan does not claim them. Synthetic mounted evidence is not hosted Account, Next router, Supabase, RLS, Production, or launch proof.

## 11. Security, traveller context, and cost

Writes stay inside the frozen server actions. The hook does not use the service role, does not open a new route, and does not log draft fields. Delete names use the label or country or document type already shown on the card. Evidence uses synthetic names.

Several citizenships stay equal. Residence, issuer, and citizenship stay independent. A document with no citizenship stays unassigned. This screen does not decide visa, transit, or carrier rules. Unknown write results stay unknown.

No new runtime cost, provider, model call, or paid API. The local harness uses the existing Playwright install. The USD 100 monthly ceiling is unchanged.

Database, migration, RLS, Auth, and Production are untouched. The diff is the proof of that boundary. No hosted read or write is required or authorized.

Guest whole-trip and cross-tab limits stay as they are. Two account tabs can still race; this client cannot see the other tab. The unknown-outcome and list-observation rules cover that without an exactly-once claim. #985/#982, #917, #913/#911, #968, #748, #626, #937/#936, and Bern #934 stay on their current holds. This lane does not route around them.

## 12. Unknowns

- Whether a production refresh that returns the same rows reuses the previous props. The stamp treats unchanged content as not yet observed. That is conservative and can show the not-yet-loaded sentence after a no-op read.
- `LandFeld` keyboard and portal behavior inside the harness. The mounted test targets the control the user actually reaches. If a portal escapes the card, the focus assertion follows the real control and the evidence says so.
- Playwright availability on the evidence machine. A failed launch is NOT VERIFIED.
- `npm test` and GitHub CI do not execute the mounted matrix. They remain required and they are not a substitute for the harness.
- Returning the inserted id from the three create actions would let a later slice point at the real row. That edits `account-registry-aktionen.ts`, which this lane leaves frozen. It is a recommendation for a later Technical-Lead task, not work in this PR.

## 13. Stop

Status of this commit: plan only.

The next actor is the Technical Lead, reviewing this exact head. This session implements only after that head-bound acceptance. No Ready, no merge, no issue close, no `main` write, no sibling edit, and no follow-up slice.
