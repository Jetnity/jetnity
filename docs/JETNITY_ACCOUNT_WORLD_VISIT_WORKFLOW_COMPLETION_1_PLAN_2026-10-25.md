# Jetnity Account World Visit Workflow Completion 1 — PLAN

Date: 2026-10-25. Author: **Jetnity Account World Visit Workflow Completion 1 — Cursor Generation 1**.

This is the PLAN-only gate. It is not implementation, not proof, and not a Technical-Lead PASS. No product file, test, script, or other document is changed with this file. Implementation waits for an explicit head-bound Technical-Lead authorization in this same session.

## 0. Identity and live baseline

| Fact | Value read in this session |
| --- | --- |
| Logical name | Jetnity Account World Visit Workflow Completion 1 — Cursor Generation 1 |
| Requested model | Grok 4.7 High Fast / `grok-4.7-high-fast` |
| Actual `originalModelName` | `grok-4.7-high-fast` |
| Session | https://cursor.com/agents/bc-af293d35-d2af-43d8-b193-9fbaab7c351b |
| Visible chat rename | Performed through the session rename tool to that exact logical name. A self-report is not an independent Technical-Lead UI observation. |
| Branch / PR / tracking | `feat/r107-account-world-visit-workflow-1` / Draft #1018 / #1013 |
| Batch | R107 #1011, decision MULTI_AGENT, integration **T → S → D → W → M** |
| Canonical index | #751. Governing intake: comment [6399573707](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6399573707). Later session note: [6399725540](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6399725540). |
| Immutable TASK | `docs/JETNITY_ACCOUNT_WORLD_VISIT_WORKFLOW_COMPLETION_1_TASK_V1_2026-10-25.md` |
| TASK blob | `9fb3c8f242014761af64aa342a3222cf7d15f180` |
| Seed head | `773463318cfd9add18cd355bd2c990b9685cffd9` |
| Seed tree | `d3f5c571dfffc193788301572ed08107075cd198` |
| Actual `origin/main` and merge-base | `a74c443c6be3f064f150fcf021ab6154bda325e5` |
| Main tree named by the task | `c1fe5a50b0da710ef425674057f782b1dff6f8bc`, re-read as `origin/main^{tree}` after `git fetch origin main` |
| Seed ahead / behind | 1 / 0. This plan commit is a later head. Re-read ahead/behind on that head. |
| Machine mode | `NORMAL` in `.jetnity/operating-mode.json` |

`docs/ACTIVE_WORK_STATUS.md` and `JETNITY_START_HERE.md` still lead with the closed R106 package. Those files are outside this lane. This plan does not edit them. Live authority for this lane is the TASK, #751 intake 6399573707, #1011, and the Technical-Lead operating standard. Older dated handoffs are history. R106 is not reopened.

No Auto fallback was used. This session does not Ready, merge, close #1013, write `main`, or start a follow-up.

Read for this plan: AGENTS.md; `JETNITY_START_HERE.md`; `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`; `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md`; `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`; `docs/JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md`; ADR-0204; `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`; `docs/JETNITY_BINDING_BUILD_ORDER.md`; `docs/JETNITY_R106_FINITE_BATCH_CLOSURE_HANDOFF_2026-10-25.md`; the visit sources and tests named below. The #751 traveller-serialization P1 in comment 6399573707 belongs to lane T. This lane does not touch it.

Phase fit: Phase 1 already includes Account. This lane completes the existing Deine Welt create / edit / revoke path. It does not change the three-phase order, the V1 build order, provider selection, or launch.

Local `next-env.d.ts` is dirty in this workspace because Next rewrote its typegen imports. It is not part of this commit.

## 1. Source-confirmed gap

The page already loads two reads and passes them through unchanged (`app/account/welt/page.tsx`). `reisenLaden()` feeds `worldMapAbleiten`. `besucheLaden()` feeds `weltBesuchtAbleiten` and the raw `besuche` array. A failed visit read is `problem`, not an empty life history. A failed trip read stays inside `welt`. `AccountBesuche` renders `AccountWeltKarte` with `welt`, `besucht`, and `laender` only.

The three writers already exist and stay frozen:

- `besuchBestaetigen` returns `Aktionsergebnis<null>` (`lib/account/besuche-aktionen.ts`). Success is `{ ok: true, wert: null }` after `account_visit_bestaetigen`. There is no new event id.
- `besuchAendern` and `besuchWiderrufen` address `_id`. `data` null becomes the existing sentence `BESUCH_MELDUNG.nichtGefunden`. Success is again `{ ok: true, wert: null }`.
- `besuchEingabeAus` sends `placeId` or `countryCode`, plus `jahr` / `monat` / `tag`, and never a label, coordinate, or invented 1 January (`components/account/AccountBesuchFormular.tsx`).
- Repeated visits stay separate rows. `besuchAnzeigen` numbers them and does not merge them (`lib/account/besuche.ts`).

What `AccountBesuche.tsx` does today:

- One `useTransition` flag, `laeuft`, disables the create form, every row button, and every edit form together (lines 79, 292, 319, 406–459).
- One `status` value covers all three mutations. Its effect calls `scrollIntoView` whenever that value changes (lines 106–113). The status node is not tied to the operation that produced it.
- Create reads `neu` inside the async transition and, on `ok`, clears the draft, sets success, and calls `router.refresh()` (lines 124–134). Edit and revoke do the same with `bearbeitet` and `widerruf` (lines 137–164). Nothing waits for a later prop delivery, and nothing distinguishes a thrown or malformed result.
- There is no local `try/catch` around the three calls.
- Revoke already asks `BESUCHE_COPY.widerrufenFrage` before `besuchWiderrufen({ id })`. Success then runs `setWiderruf(null)`, which clears whichever confirmation is open at resolution time.
- Search, the first-twelve disclosure, and the add-form toggle are local. An edit draft lives in `bearbeitet`, but the editor is rendered only inside a visible row. A search miss or a collapsed window unmounts that editor and leaves no way back to the draft. Closing the add form keeps `neu` with the same gap.
- The page passes `besucheLesung.zeilen ?? []` together with `problem`. On a failed read the array is empty because `zeilen` is null. The component already shows the error panel from `problem` and does not treat that case as `BESUCHE_COPY.leerTitel`. A new observer must keep using `problem === null` as the only valid list. Emptiness alone is not absence of a visit.

The inputs are disabled while `laeuft` is true. This plan does not claim a demonstrated typing-loss bug during that pending window.

`AccountBesuchVerwaltungDichte.tsx` and `AccountAuditClient.tsx` mount the same component. Their props stay `welt`, `besucht`, `laender`, `besuche`, and `problem`. Those files are not edited.

## 2. Ownership

### This lane writes, after authorization

- `components/account/AccountBesuche.tsx`: operation-bound create, edit, and revoke. The three existing calls stay in this file, on synchronously captured locals, so the current source assertions remain true descriptions of the payload. The shared transition and the shared status scroll go away.
- `components/account/AccountBesuchFormular.tsx`: keep every current field and the prop name `laeuft`. `laeuft` means only this form's operation is in flight, so `disabled={laeuft || wert.ort !== null}` stays. Optional additions are a per-form error string, a per-form status string, a focus id, and Escape-to-cancel when `onAbbrechen` exists and `laeuft` is false. No new domain field.
- New `components/account/useAccountVisitWorkflow.ts`: React holder for the pure ledger, the synchronous single-flight ref, one refresh request after an accepted write, and explicit list checking. It does not import the server actions.
- New `lib/account/account-visit-workflow.ts`: pure phases, payload classification, list stamps, and focus permission. No React, no router, no storage, no action import.
- New `lib/account/account-visit-workflow.test.ts`: the one allowed unit test. It covers the pure module and the source contract that the mounted wiring must keep.
- `lib/account/besuche-copy.ts`: only the new workflow sentences in section 6. Existing confirmation, empty, and read-failure sentences stay.
- Later, still this lane: `docs/JETNITY_ACCOUNT_WORLD_VISIT_WORKFLOW_COMPLETION_1_{STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-25.md`, `scripts/account-world-visit-workflow-completion-1/**`, and new files under `docs/evidence/account-world-visit-workflow-completion-1/**`.

### Frozen

`besuche-aktionen.ts`, `besuche-daten.ts`, `besuche.ts`, `besuche-eingabe.ts`, `visit-date-precision-1/zeitfeld.ts`, `app/account/welt/page.tsx`, `AccountWeltKarte.tsx`, `WeltZustaende.tsx`, `world-explorer-1/**`, trip plans, map derivation, and the traveller registry. No migration, RLS, Auth, grant, or second visit writer. No new persistent client store. `besuchEingabeAus` and `besuchZeitfeldSetzen` stay the only payload and date-field writers. Global continuity, ROADMAP, DECISIONS, ARCHITECTURE, DESIGN_SYSTEM, package files, lockfiles, workflows, and operating mode stay untouched.

Sibling branches T, S, D, and M are read-only context. No merge, rebase, or cherry-pick. If `origin/main` moves, report the new ahead/behind and wait.

### No allowlist exception is requested

The design keeps these current assertions true because they still describe the real call:

- `lib/account/visit-date-precision-1/zeitfeld.test.ts` requires two `AccountBesuchFormular` mounts, `onWert={setNeu}`, `onWert={(wert) => onBearbeiten({ id: bearbeitet.id, wert })}`, `besuchBestaetigen(besuchEingabeAus(neu))`, and `besuchAendern({ id: bearbeitet.id, ...besuchEingabeAus(bearbeitet.wert) })`.
- `lib/account/account-world-visit-management-premium-1.test.ts` requires `besuchAendern({ id: bearbeitet.id`, `besuchWiderrufen({ id })`, the named revoke question before the confirm click, and `disabled={laeuft || wert.ort !== null}`.
- `lib/account/account-world-premium-map-ux-1.test.ts` and `lib/account/account-home-premium-overview-1.test.ts` require the action names and the exact map element `<AccountWeltKarte welt={welt} besucht={besucht} laender={laender} />`.
- `lib/account/welt-laender.test.ts` requires that `AccountBesuche.tsx` does not import `world-map-laender` or `welt-geometrie`.

`neu` and `bearbeitet` in those calls are synchronous locals captured at the guard, not the React state read again after `await`. The state setters keep the names `setNeu` and `onBearbeiten`. If a later edit cannot keep those strings honest, implementation stops and asks. It does not edit those tests on its own.

Returning an event id from `besuchBestaetigen` is not requested. The task forbids correlating a created row, and the action contract is frozen.

## 3. Ledger

The ledger is `useState` plus one ref inside `useAccountVisitWorkflow`, owned by the mounted `AccountBesuche`. There is no module singleton and no `localStorage`. A full unmount or a real document reload drops it. The unknown-outcome copy says that a later page load is a new read, not a resumed certificate.

One visit mutation is in flight at a time. That matches the current single transition and avoids a second concurrent writer. Search, disclosure, and opening another draft stay usable. Their submit controls do not call an action while the ref is held.

```ts
type BesuchEingabe = {
  placeId: string | null
  countryCode: string | null
  jahr: number | null
  monat: number | null
  tag: number | null
}

type Ausgang =
  | { art: 'angenommen' }
  | { art: 'abgewiesen'; meldung: string }
  | { art: 'unbestaetigt' }

type Vorgang = {
  id: string
  art: 'bestaetigen' | 'aendern' | 'widerrufen'
  surface: 'anlegen' | `ereignis:${string}`
  ereignisId: string | null
  eingabe: BesuchEingabe | null
  entwurfEpoche: number
  phase: 'unterwegs' | 'abgewiesen' | 'unbestaetigt' | 'angenommen'
  meldung: string | null
  stempelBeiStart: string | null
  stempelBeiAntwort: string | null
  lesenAngefordert: boolean
  juengereListe: boolean
}
```

`ereignisId` is null for create. Edit and revoke store the row id captured at dispatch. A client `Vorgang.id` is never shown as a visit id and never sent to an action.

### Dispatch

`vormerken` runs synchronously. The ref is set before the action expression is evaluated. A second call in the same turn, including a click plus Enter on the same submit, returns null and does not evaluate the action.

Create and edit capture the draft in the same turn:

```ts
const neu = anlegenWert
const freigabe = workflow.vormerken('bestaetigen', neu)
if (!freigabe) return
void workflow.begleiten(freigabe, besuchBestaetigen(besuchEingabeAus(neu)))
```

```ts
const bearbeitet = { id: editor.id, wert: editor.wert }
const freigabe = workflow.vormerken('aendern', bearbeitet)
if (!freigabe) return
void workflow.begleiten(freigabe, besuchAendern({
  id: bearbeitet.id,
  ...besuchEingabeAus(bearbeitet.wert),
}))
```

```ts
const id = ereignisId
const freigabe = workflow.vormerken('widerrufen', id)
if (!freigabe) return
void workflow.begleiten(freigabe, besuchWiderrufen({ id }))
```

`begleiten` awaits the promise that was already started. It classifies the result, clears the ref only for that operation id, and only then may request refresh.

Edit or revoke is refused before the call when the current props are a valid list and that id is absent. The action is not used to rediscover a removed row. An invalid list does not count as absence, so a dispatch is also refused while `problem !== null`: the user can check the list, and the lane does not write against an unread history.

### Classification

`visitAusgangLesen` accepts a result only in the existing shape.

| Result | Class |
| --- | --- |
| `{ ok: true, wert: null }` and no other keys | `angenommen` |
| `{ ok: false, meldung }` with a non-empty string and no other keys | `abgewiesen` |
| Throw, non-object, `ok: true` with any other `wert`, extra keys such as `id`, empty `meldung`, or any other shape | `unbestaetigt` |

An extra id is not a created-event identity. It is an unknown outcome.

### Three facts that stay separate

1. **Acknowledged write.** `angenommen` means the action returned the accepted null shape. It does not mean the current props contain the effect.
2. **Requested refresh.** After `angenommen`, the hook calls `router.refresh()` once. A throw or a rejected refresh promise ends the checking indicator. It does not repeat the mutation and does not revoke the acknowledgement. Calling refresh is not itself a newer list.
3. **Observed current history.** A valid observation is `problem === null` and a content stamp of `besuche` that differs from the stamp captured at dispatch and from every stamp seen before the action settled. The stamp is a JSON array of `{ id, placeId, countryCode, jahr, monat, tag }` sorted by `id`. Order, count, label, and coordinates are not the identity. `juengereListe` means that a newer valid list arrived. It does not mean this operation caused the difference.

A prop delivery that arrives while the promise is still pending is recorded and is not promoted to `juengereListe` after the response. The same stamp after refresh leaves the operation at `angenommen` with `lesenAngefordert` and `juengereListe === false`.

Create never calls a matcher on place, country, date, label, order, or count. There is no function that returns a candidate event id for a create. The UI does not point at a row after create. Two identical payloads remain two operations and, if both are actually stored, two rows.

Edit and revoke observation is by the captured event id only:

| Valid newer list | Wording fact |
| --- | --- |
| Id present | "Die aktuelle Liste enthält diesen Besuch." Field equality with the captured payload may be shown as the same year, month, day, place, and country. Equality is not a causal receipt. |
| Id absent | "Die aktuelle Liste enthält diesen Besuch nicht." That is not proof that this revoke or edit caused the absence. |
| `problem !== null`, or the same stamp as at dispatch | No absence claim and no success-by-count. The existing read-failure panel stays the list statement. |

A failed visit read and a failed trip read stay independent. This lane does not change `worldMapAbleiten`, `weltBesuchtAbleiten`, or the map fallback. Local pending state is not an argument to the map. The map element keeps the three server-derived props.

### Known rejection and unknown outcome

Known rejection keeps the captured draft and the same event target. The server `meldung` is shown on that surface. The normal submit may be used again. That press is a new operation id, not an automatic retry.

Unknown outcome keeps the draft and the target. The normal submit does not call the action while that unknown operation is the open blocker for its surface. The user gets "Liste prüfen", which only requests `router.refresh()`, and "Vorgang schliessen", which drops the blocker and does not write. After it is closed, a later press of the normal submit is a new deliberate operation. There is no automatic second create, edit, or revoke.

Checking is single-flight too. A second press while a check is open does not call refresh again. The checking indicator clears when a new prop delivery is applied, when the refresh promise rejects, or after four seconds without either. The four seconds are a local lease so the button can be used again. They are not a server timeout and not a verdict.

### Late results, filters, and removal

Each result writes only the `Vorgang` with that client id. It does not read the currently open editor or the currently open confirmation.

- A newer create or edit draft bumps `entwurfEpoche`. An older result does not clear it, does not replace its fields, and does not move focus into it.
- Revoke success clears the confirmation only when the open confirmation id is the operation's event id. A confirmation opened later for another id stays open.
- Cancelling a confirmation before dispatch sends nothing and returns focus to that row's revoke button. Cancelling is disabled while that same revoke is `unterwegs`, because the call has already left. The pending note remains on that event id.
- Search and the twelve-row window keep using `besuchVerwaltungAusschnitt`. They are not given a second filter. If the open edit id is outside `ausschnitt.zeilen`, a banner names that hidden draft and offers "In der Liste zeigen" and "Entwurf verwerfen". Showing it clears the search and raises `sichtGrenze` to that row's index plus one. It does not reorder. Discard is refused while that surface is `unterwegs`.
- Closing the add form while its draft is non-empty, or while a create operation is open, shows the same kind of banner. "Formular zeigen" reopens it. Discard is refused during `unterwegs`.
- If a valid list no longer contains the edit or revoke target, the draft is not moved onto another row and no stale payload is sent. The operation banner says the id is not in the current list.

### Focus

Status text is announced with `role="status"` or `role="alert"`. Nothing focuses that node, and nothing calls `scrollIntoView` because a status string changed. The current status effect is removed.

Focus moves only for the user's own cancel, reopen, or add-form toggle, and only when the active element is the document body or still inside the surface being closed. If the active element is `#account-besuche-suche`, or a draft whose epoch is newer than the operation, focus stays there. The existing add-form open path may still focus the place field, because that is the toggle the user just activated.

Targets use `data-fokus`: `anlegen-ort`, `anlegen-oeffnen`, `bearbeiten:<id>`, `widerrufen:<id>`, and `entwurf-finden:<surface>`.

### Date, place, and map truth

Every success and failure path sends the captured `besuchEingabeAus` result. An empty year stays null. A year without a month stays year precision. A place selection still sends `countryCode: null`. A country-only visit still sends `placeId: null`. Nothing infers a country from a label, nothing writes 1 January, and nothing creates a visit from a trip plan. The map, its counters, and its markers change only when the server-derived props change.

## 4. State and failure matrix

| Situation | Action calls | Draft / target | List claim | Next control |
| --- | --- | --- | --- | --- |
| Same-turn second submit | First call only | Unchanged by the second call | None | In-flight surface shows pending |
| Known `ok: false` | One | Same draft and same event id kept | None | Normal submit is allowed again |
| Throw or malformed body | One | Kept | None, including when the list later changes | Liste prüfen, then Vorgang schliessen. No automatic write |
| `ok: true, wert: null` | One, then one refresh request | Create draft clears only at the same epoch. Edit editor closes only at the same epoch and same id | "Besuch bestätigt" / "Besuch geändert" / "Besuch widerrufen" plus "Die Liste wird geprüft." | No row is chosen for create |
| Refresh rejects or returns the same stamp | No further write | Operation stays `angenommen` | Requested refresh is not a newer list | Liste prüfen |
| Newer valid list after acceptance | No further write | Create still has no row pointer | Edit/revoke report presence or absence of the exact id | Equality is descriptive |
| Failed visit read | No write from this failure | Operation context stays above the existing error panel | Empty `besuche` is not absence | Existing 500/503 copy |
| Failed trip read | Unchanged | Unchanged | Map keeps the supplied `welt` | This lane adds no fallback |
| Filter or collapsed window hides the editor | No write | Draft kept | None | Show or discard |
| Confirm A, then confirm B, then A resolves | A's call only | B's confirmation stays | A's result stays on A | Focus does not jump to B |
| Valid list loses the target before dispatch | Zero | Draft not retargeted | "Nicht in der aktuellen Liste" | No submit |
| Full unmount during `unbestaetigt` | The original call is not repeated by this UI | Ledger is gone | A later mount is a new read | Copy states that limit before unmount |

## 5. Copy

Added to `BESUCHE_COPY` only as workflow wording:

- Pending: "Besuch wird bestätigt.", "Änderung wird gespeichert.", "Besuch wird widerrufen."
- Accepted and waiting: "Die Liste wird geprüft." The three existing success sentences remain the acknowledgement, not the readback.
- Newer list, create: "Die Liste wurde neu gelesen. Ein neuer Besuch wird daraus nicht einer Zeile zugeordnet."
- Newer list, id present: "Die aktuelle Liste enthält diesen Besuch."
- Newer list, same captured fields: "Die Angaben in der Liste stimmen mit der gesendeten Änderung überein. Das belegt nicht, dass diese Speicherung sie verursacht hat."
- Newer list, id absent: "Die aktuelle Liste enthält diesen Besuch nicht. Das belegt nicht, dass dieser Vorgang die Ursache ist."
- Unknown: "Der Ausgang ist unklar. Der Besuch kann bereits gespeichert sein. Es wird nichts automatisch erneut gesendet."
- Check: "Liste prüfen", "Die Liste wird erneut gelesen.", "Diese Prüfung hat keine neuere Liste geliefert."
- Close blocker: "Vorgang schliessen"
- Hidden create: "Ein Entwurf ist ausgeblendet." Actions: "Formular zeigen", "Entwurf verwerfen"
- Hidden edit: "Der Besuch in Bearbeitung ist in dieser Ansicht nicht sichtbar." Actions: "In der Liste zeigen", "Entwurf verwerfen"
- Removed target: "Dieser Besuch ist in der aktuellen Liste nicht enthalten."
- Unmount limit, shown with an unknown outcome: "Wenn du die Seite verlässt, kann dieser Hinweis nicht erhalten werden."

`widerrufenFrage`, `widerrufenBestaetigen`, `leerTitel`, `fehlerTitel`, `fehler500`, and `fehler503` stay as they are.

## 6. Proof

Pure tests in `lib/account/account-visit-workflow.test.ts` drive the reducer with injected ids and stamps. They assert the classification table, the same-turn guard, no create matcher, exact-id observation, failed-read versus empty-list, epoch protection, and the hidden-draft decision. They do not render the page.

Mounted proof lives in `scripts/account-world-visit-workflow-completion-1/**`, after the same shape as the accepted account-traveller harness: esbuild aliases replace only `next/navigation` and `lib/account/besuche-aktionen.ts`. The production `AccountBesuche`, form, and hook are the mounted modules. Playwright is the existing devDependency. The harness sets props itself. A resolved refresh shim must not, by itself, flip an operation to a newer list.

The mounted cases cover create, edit, and revoke for returned rejection, thrown and malformed responses, delayed success, error, and settle, a same-turn double submit, retained draft and target, explicit checking, accepted-awaiting-read, unchanged props, an older stamp, a newer matching id, and a newer non-matching id. They also cover two identical visits, a missing event, a failed read, a filter that hides the edited row, row replacement and removal, and switching or cancelling confirmation while an older operation resolves. Assertions require the recorded action argument to be the captured `besuchEingabeAus` or `{ id }` shape, no second call after an unknown result, and no create correlation. Map inputs are compared by reference to the props passed in, including while a draft is dirty.

CSS evidence uses project `styles/globals.css` through the existing Tailwind pipeline, at 320, 390, 768, and 1440, with root font size 32px. Cases include a long place label, the existing 40-event fixture, an open editor, an open revoke confirmation, and every failure state above. The proof measures overflow instead of hiding it. Clipping fails the case. Screenshots and the JSON report go under `docs/evidence/account-world-visit-workflow-completion-1/**`, bound to head, tree, and dirty state.

After implementation, the lane also runs focused regressions, Typecheck, lint, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, the production build, and `npm test`. Native App, Auth, and Vercel gates remain required and are not treated as passed by a local run. The two established conditional browser skips, 181 existing lint warnings, and the eleven previously reported untriaged dependency advisories stay existing limits.

This plan executes none of that proof.

## 7. Costs, security, and limits

No new dependency, hosted service, provider, secret, payment, or database call. No new monthly cost. The USD 100 boundary is unchanged. The actions stay authenticated session calls. This client still cannot insert into `account_visits` by itself. No passport, MRZ, biometric, or health field is added. Visit history is not a traveller-credential decision; citizenship and travel documents are not collected here.

Evidence from this lane is synthetic and local. It is not hosted Account proof, not SQL or RLS proof, not a full Next.js router proof, and not a physical-device proof. A refresh request is not causal readback. The single-flight ref is not a database transaction and not exactly-once storage. Full unmount drops unresolved context. Two identical visits cannot be tied back to one create response.

#985/#982 and #917 stay STOP/HOLD with no alternate path. #913/#911, #968, #748, #626, #937/#936, and Bern #934 stay unchanged. #944 does not autostart. No Production DB, Auth, AAL, RLS, secret, provider, payment, legal, or launch action follows.

## 8. Stop

The next step is independent Technical-Lead review of the exact plan head. The same session implements only after that authorization. This document is not a PASS, Ready, or merge.
