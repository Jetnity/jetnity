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
| Seed ahead / behind | 1 / 0 at the seed. The reviewed plan head was 2 ahead / 0 behind. Re-read the correction head. |
| Machine mode | `NORMAL` in `.jetnity/operating-mode.json` |
| PLAN R1 reviewed head | `53229c0b06959fd343677856d240fb11f9aec43f` |
| PLAN R1 reviewed blob | `d1b5658706e9a27e8c2d658213155c7f14d22023` |

PLAN review R1 required W-R1.1 through W-R1.5. This revision is that correction and replaces the reviewed wording where the two differ. At this edit, `git fetch origin main` still showed `a74c443c6be3f064f150fcf021ab6154bda325e5`, merge-base the same, 0 behind. No allowlist expansion. The TASK blob stays `9fb3c8f242014761af64aa342a3222cf7d15f180`.

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
- `schreibmeldung` (lines 67–74) turns a known database `hint`, a `status === 0` or SQLSTATE `08` / `57` transport failure, and every other RPC error into `{ ok: false, meldung }`. The file’s own comment says the displayed sentence is the same wherever the rejection was produced. Pre-RPC `besuchAnlageLesen` / `besuchAenderungLesen` and the unsigned-in branch return that same shape. The browser never receives `hint` or `status`.
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
  | { art: 'unbestaetigt' }

type KanonischeFelder = {
  placeId: string | null
  countryCode: string | null
  jahr: number | null
  monat: number | null
  tag: number | null
}

type Entwurf = {
  surface: 'anlegen' | `ereignis:${string}`
  ereignisId: string | null
  felder: BesuchFormularWert
  basis: KanonischeFelder | null
  dirty: boolean
  konflikt: 'keiner' | 'felder' | 'entfernt'
  epoche: number
  lokalerHinweis: string | null
}

type Vorgang = {
  id: string
  art: 'bestaetigen' | 'aendern' | 'widerrufen'
  surface: Entwurf['surface']
  ereignisId: string | null
  eingabe: BesuchEingabe | null
  entwurfEpoche: number
  basisBeiStart: KanonischeFelder | null
  phase: 'unterwegs' | 'unbestaetigt' | 'angenommen'
  stempelGesehen: readonly string[]
  lesenAngefordert: boolean
  pruefung: 'aus' | 'offen' | 'beendet'
  inhaltBeobachtet: 'ausstehend' | 'gleich' | 'anders' | 'lesefehler'
}
```

`ereignisId` is null for create. Edit and revoke store the row id captured at dispatch. A client `Vorgang.id` is never shown as a visit id and never sent to an action. `felder` uses the existing `BesuchFormularWert`. `basis` is the canonical place and date precision taken from a valid list when the editor or the revoke confirmation opens. Create has `basis: null`. `entwurfEpoche` and `basisBeiStart` are copies of `epoche` and `basis` at `senden`. A result may clear or close a draft only when `Entwurf.epoche` is still that copy. There is no `abgewiesen` phase and no `juengereListe` flag.

### Dispatch

The hook owns the guard. The component passes a thunk. The action expression is not evaluated while the hook decides whether to run it.

Before `senden`, the component runs the frozen pure reader and does not call `senden` when that reader fails. `besuchAnlageLesen(besuchEingabeAus(neu))`, `besuchAenderungLesen(...)`, and `besuchLoeschungLesen({ id })` keep their default `heuteUtc()`. A local `ok: false` sets `lokalerHinweis` to that `meldung`, sends nothing, and acquires no guard. That is the only known not-sent outcome. The same sentence later returned by the action is not reused as proof of the same fact.

```ts
const neu = anlegenWert
const lokal = besuchAnlageLesen(besuchEingabeAus(neu))
if (!lokal.ok) return workflow.hinweis('anlegen', lokal.meldung)
workflow.senden('bestaetigen', neu, () => besuchBestaetigen(besuchEingabeAus(neu)))
```

```ts
const bearbeitet = { id: editor.id, wert: editor.wert }
const lokal = besuchAenderungLesen({ id: bearbeitet.id, ...besuchEingabeAus(bearbeitet.wert) })
if (!lokal.ok) return workflow.hinweis(editor.surface, lokal.meldung)
workflow.senden('aendern', bearbeitet, () => besuchAendern({
  id: bearbeitet.id,
  ...besuchEingabeAus(bearbeitet.wert),
}))
```

```ts
const id = ereignisId
const lokal = besuchLoeschungLesen({ id })
if (!lokal.ok) return workflow.hinweis(`ereignis:${id}`, lokal.meldung)
workflow.senden('widerrufen', id, () => besuchWiderrufen({ id }))
```

`senden` sets the ref to a new operation id before any thunk runs. A second call in the same turn, including click plus Enter, returns while the ref is held and does not invoke its thunk. The thunk itself runs only inside `abschliessen`:

```ts
async function abschliessen(id: string, aufruf: () => Promise<unknown>) {
  let wert: unknown = GEWORFEN
  try {
    wert = await aufruf()
  } catch {
    wert = GEWORFEN
  } finally {
    try {
      commit(visitAnwenden(standRef.current, id, visitAusgangLesen(wert)))
    } finally {
      if (sperre.current === id) sperre.current = null
    }
  }
}
```

A synchronous throw from `besuchEingabeAus` or from the action, a rejected promise, and a malformed fulfillment all stay inside that `try/catch/finally`. The `finally` applies the outcome and then releases the ref only when it still names this operation. A throw inside `visitAnwenden` still releases the ref. The component never starts the promise as an argument to `senden`.

`senden` records the operation inside its own `try/finally` before `void abschliessen(...)`. If that recording throws, the same `finally` clears the ref when it still names this id, and the thunk is not called. The guard cannot survive a failure that never reaches `abschliessen`.

`senden` also refuses, without calling the thunk, when a valid list no longer contains the edit or revoke id, when that draft has `konflikt !== 'keiner'` and the user has not explicitly re-armed it, or when `problem !== null`. An invalid list is not absence. The lane does not write against an unread history. A missing id is not sent to the action in the hope of finding it.

### Classification

`visitAusgangLesen` does not read German prose and does not import `schreibmeldung`.

| Result | Class |
| --- | --- |
| `{ ok: true, wert: null }` and no other keys | `angenommen` |
| Every `{ ok: false, meldung }`, including `SCHREIBFEHLER`, `SCHREIBFEHLER_AUSFALL`, a hint sentence, and `nichtGefunden` | `unbestaetigt` |
| Throw, non-object, `ok: true` with any other `wert`, extra keys such as `id`, or any other shape | `unbestaetigt` |

`angenommen` is the action’s acknowledgement. It is not a list observation. `unbestaetigt` means this client cannot establish that the write did not commit. It is not a license to replay. An extra id is not a created-event identity. The three controls stay separate: acknowledgement, the explicit list check, and a later deliberate send.

### Three facts that stay separate

1. **Acknowledged write.** `angenommen` means the action returned the accepted null shape. It does not describe the props on screen.
2. **Requested check.** After `angenommen`, the hook calls `router.refresh()` once and sets `pruefung: 'offen'`. The user can request another check with "Liste prüfen". A throw, a rejected refresh promise, or the four-second lease sets `pruefung: 'beendet'`. That transition does not change `phase`, does not set `inhaltBeobachtet` to `anders`, and does not claim that a refresh finished or that the write succeeded. Resolving the refresh promise is not an observation. Only props applied to the component are.
3. **Displayed content.** The stamp is a JSON array of `{ id, placeId, countryCode, jahr, monat, tag }` sorted by `id`. Order, count, label, and coordinates are not the identity. Every valid stamp seen before `visitAnwenden` is stored in `stempelGesehen`. A later valid stamp that is already in that set stays `ausstehend` or `gleich`. A valid stamp applied after settlement that is not in that set sets `inhaltBeobachtet: 'anders'`. That flag means the displayed visit content changed. It does not mean a newer database snapshot, a completed request-bound refresh, or a causal readback. There is no contract in this lane that could support those stronger claims.

The same displayed stamp after settlement sets `inhaltBeobachtet: 'gleich'`. `problem !== null` sets `lesefehler` and does not count as a changed or empty history.

Create never calls a matcher on place, country, date, label, order, or count. There is no function that returns a candidate event id for a create. The UI does not point at a row after create. Two identical payloads remain two operations and, if both are actually stored, two rows. That limit is recorded in the test and the later evidence report. It is not a routine success sentence.

Edit and revoke look up the captured event id in a valid displayed list:

| Displayed valid content | What the product may say |
| --- | --- |
| Id present | "Dieser Besuch steht in der Liste." The existing title and time text may be shown. |
| Id absent | "Dieser Besuch steht nicht in der angezeigten Liste." |
| `lesefehler`, or no new stamp | The existing read-failure panel, or the still-open uncertainty sentence. No absence claim. |

### Same-id drift

Opening an editor or a revoke confirmation from a valid row copies that row’s canonical fields into `basis` and starts `dirty: false`. A keystroke sets `dirty: true` and bumps `epoche`. The frozen `account_visit_aendern` and `account_visit_widerrufen` accept no client version, so this baseline is only a local comparison.

| Observation of the same id | Draft | Dispatch |
| --- | --- | --- |
| Canonical fields equal `basis` | Unchanged | Allowed when no other guard refuses |
| Canonical fields differ, `dirty === false`, and this surface is not `unterwegs` | Clean adoption: visible fields and `basis` become the displayed canonical values. `epoche` bumps. | No automatic send. A later submit sends the adopted draft. |
| Canonical fields differ, and the draft is dirty or a payload is in flight | Conflict `felder`. The user’s fields stay. The in-flight `eingabe` stays the snapshot taken at `senden`. | Blocked until the user chooses reset or an explicit re-edit |
| Id missing from a valid list | Conflict `entfernt`. No other row receives the draft. | Blocked. No "save anyway". |

Conflict actions are "Änderungen ansehen", "Liste übernehmen", and "Meinen Entwurf speichern". Ansehen shows the displayed canonical place and date beside the draft and writes nothing. Übernehmen replaces the draft and `basis` with those canonical fields, clears `dirty` and the conflict, and writes nothing. "Meinen Entwurf speichern" keeps the user’s fields, sets `basis` to the displayed canonical fields, and arms one deliberate `senden`. Revoke uses the same rule: a field change after the confirmation opens blocks "Ja, widerrufen" until the user explicitly confirms again; removal blocks the call.

While `unterwegs`, a changed or removed id does not rewrite the captured payload and does not move the result onto another row. Clean adoption waits until the surface is no longer in flight.

The remaining race stays open. Another session can change the row after this client’s baseline matched and before the RPC runs. This UI cannot see that write. The explicit re-edit covers only the change already present in the props. The later evidence states that limit. The product copy does not turn it into a proof lecture.

A failed visit read and a failed trip read stay independent. This lane does not change `worldMapAbleiten`, `weltBesuchtAbleiten`, or the map fallback. Local pending state is not an argument to the map. The map element keeps the three server-derived props.

### Local miss and unknown outcome

A local reader miss keeps the draft and shows only the reader’s sentence. The primary button may be used again after the user edits the fields. Nothing is described as saved or lost, because no action ran.

An action outcome of `unbestaetigt` keeps the draft and the same event target. The normal submit does not call the action while that blocker is open. "Liste prüfen" only requests `router.refresh()`. "Erneut senden" is the separate deliberate new intent: a new operation id, the current draft, and one thunk. "Vorgang schliessen" drops the blocker and does not write. There is no automatic second create, edit, or revoke, and a returned `{ ok: false }` does not enable the normal submit by itself.

Checking is single-flight. A second press while `pruefung === 'offen'` does not call refresh again. The indicator returns to `beendet` when the lease expires or the refresh promise rejects, and it also returns to `beendet` when a prop delivery is applied. None of those endings asserts a fresh database read or a successful write. The four seconds are only a local lease so the button can be pressed again.

### Late results, filters, and removal

Each result writes only the `Vorgang` with that client id. It does not read the currently open editor or the currently open confirmation.

- A newer create or edit draft bumps `epoche`. An older result does not clear it, does not replace its fields, and does not move focus into it. A clean adoption also bumps `epoche`, so a late result from the previous draft does not clear the adopted fields.
- Revoke success clears the confirmation only when the open confirmation id is the operation's event id. A confirmation opened later for another id stays open.
- Cancelling a confirmation before dispatch sends nothing and returns focus to that row's revoke button. Cancelling is disabled while that same revoke is `unterwegs`, because the call has already left. The pending note remains on that event id.
- Search and the twelve-row window keep using `besuchVerwaltungAusschnitt`. They are not given a second filter. If the open edit id is outside `ausschnitt.zeilen`, a banner names that hidden draft and offers "In der Liste zeigen" and "Entwurf verwerfen". Showing it clears the search and raises `sichtGrenze` to that row's index plus one. It does not reorder. Discard is refused while that surface is `unterwegs`.
- Closing the add form while its draft is non-empty, or while a create operation is open, shows the same kind of banner. "Formular zeigen" reopens it. Discard is refused during `unterwegs`.
- If a valid list no longer contains the edit or revoke target, the draft is not moved onto another row and no stale payload is sent. The banner uses the removed-target sentence in section 5.

### Focus

Status text is announced with `role="status"` or `role="alert"`. Nothing focuses that node, and nothing calls `scrollIntoView` because a status string changed. The current status effect is removed.

Focus moves only for the user's own cancel, reopen, or add-form toggle, and only when the active element is the document body or still inside the surface being closed. If the active element is `#account-besuche-suche`, or a draft whose epoch is newer than the operation, focus stays there. The existing add-form open path may still focus the place field, because that is the toggle the user just activated.

Targets use `data-fokus`: `anlegen-ort`, `anlegen-oeffnen`, `bearbeiten:<id>`, `widerrufen:<id>`, and `entwurf-finden:<surface>`.

### Date, place, and map truth

Every success and failure path sends the captured `besuchEingabeAus` result. An empty year stays null. A year without a month stays year precision. A place selection still sends `countryCode: null`. A country-only visit still sends `placeId: null`. Nothing infers a country from a label, nothing writes 1 January, and nothing creates a visit from a trip plan. The map, its counters, and its markers change only when the server-derived props change.

## 4. State and failure matrix

| Situation | Action calls | Draft / target | What the user is told | Next control |
| --- | --- | --- | --- | --- |
| Local pure-reader miss | Zero | Kept. No guard acquired | The reader sentence only | Primary submit after an edit |
| Same-turn second submit | First thunk only | Unchanged by the second call | Pending on that surface | Guard held until `finally` |
| Returned `{ ok: false }` of any sentence | One | Same draft and same event id | Unknown outcome. No replay implied | Liste prüfen, Erneut senden, or Vorgang schliessen |
| Synchronous throw, rejected promise, or malformed body | One attempt, caught | Kept | Unknown outcome | Same three controls. Guard released |
| `ok: true, wert: null` | One, then one refresh request | Create draft clears only at the same epoch. Edit editor closes only at the same epoch and same id | Existing success sentence plus the open-list sentence | Liste prüfen. No create row is chosen |
| Refresh rejects, lease ends, or the same stamp is applied | No further write | Operation stays `angenommen` or `unbestaetigt` | Check ended. Displayed content is not called fresh or saved because of that ending | Liste prüfen |
| Displayed stamp first seen after settlement differs | No further write | Create still has no row pointer | "Die angezeigte Liste hat sich geändert." Edit/revoke add presence or absence of the exact id | No causal sentence |
| Stamp already seen before settlement | No further write | Unchanged | Stays `ausstehend` or `gleich`. Not promoted to `anders` | None from that delivery |
| Failed visit read | No write from this failure | Operation context stays above the existing error panel | Existing 500/503 copy. Empty `besuche` is not absence | Existing error panel |
| Failed trip read | Unchanged | Unchanged | Map keeps the supplied `welt` | This lane adds no fallback |
| Same id, new canonical fields, clean editor | Zero until a later submit | Draft adopts the displayed fields | The form shows the displayed values | Submit sends the adopted draft |
| Same id, new canonical fields, dirty editor, before dispatch | Zero | User fields kept | Conflict sentence | Ansehen, Liste übernehmen, or Meinen Entwurf speichern |
| Same id, new canonical fields, during pending | The original thunk only | Snapshot unchanged. Dirty draft not overwritten | Pending sentence plus the conflict sentence | No second target |
| Filter or collapsed window hides the editor | No write | Draft kept | Hidden-draft sentence | Show or discard |
| Confirm A, then confirm B, then A resolves | A's call only | B's confirmation stays | A's result stays on A | Focus does not jump to B |
| Valid list loses the target before dispatch | Zero | Draft not retargeted | Removed-target sentence | Entwurf verwerfen |
| Full unmount during `unbestaetigt` | The original call is not repeated by this UI | Ledger is gone | The short unmount sentence was visible before leaving | A later mount is a new visit to the page |

## 5. Copy

Product sentences say what is confirmed, what is still open, and which control does the next thing. Causal receipts, the rule that a create has no row id, and the cross-session race stay in this plan and in the later evidence. They are not rendered as routine success text.

Added to `BESUCHE_COPY` only as workflow wording:

- Pending: "Besuch wird bestätigt.", "Änderung wird gespeichert.", "Besuch wird widerrufen."
- Acknowledged: the existing "Besuch bestätigt.", "Besuch geändert.", and "Besuch widerrufen."
- Still open after acknowledgement: "Ob die Liste schon passt, ist noch offen." Action: "Liste prüfen"
- Checking: "Liste wird geprüft."
- Check ended: "Die Prüfung ist beendet." The acknowledgement, if any, stays. This sentence does not say the list is current or the save succeeded.
- Displayed content changed: "Die angezeigte Liste hat sich geändert."
- Exact id present: "Dieser Besuch steht in der Liste."
- Exact id absent from the displayed list: "Dieser Besuch steht nicht in der angezeigten Liste."
- Unknown: "Es ist unklar, ob die Änderung gespeichert wurde. Es wird nichts automatisch erneut gesendet." Actions: "Liste prüfen", "Erneut senden", "Vorgang schliessen"
- Dirty conflict: "Der gespeicherte Besuch hat sich geändert. Dein Entwurf bleibt erhalten." Actions: "Änderungen ansehen", "Liste übernehmen", "Meinen Entwurf speichern"
- In flight while the displayed row changed: "Die laufende Speicherung behält den abgeschickten Entwurf."
- Removed target: "Dieser Besuch steht nicht mehr in der Liste." Action: "Entwurf verwerfen"
- Hidden create: "Ein Entwurf ist ausgeblendet." Actions: "Formular zeigen", "Entwurf verwerfen"
- Hidden edit: "Der Besuch in Bearbeitung ist in dieser Ansicht nicht sichtbar." Actions: "In der Liste zeigen", "Entwurf verwerfen"
- Unmount, shown with an unknown outcome: "Dieser Hinweis bleibt nur auf dieser Seite erhalten."

A local reader miss shows that function’s existing `meldung` and no extra success or failure claim. `widerrufenFrage`, `widerrufenBestaetigen`, `leerTitel`, `fehlerTitel`, `fehler500`, and `fehler503` stay as they are. The mounted proof asserts the product surface does not contain "einer Zeile zugeordnet", "belegt nicht", or "neu gelesen".

## 6. Proof

Pure tests in `lib/account/account-visit-workflow.test.ts` drive the reducer with injected ids and stamps. They assert the classification table, including every well-shaped `{ ok: false }` as `unbestaetigt`, the thunk boundary’s `finally`, the same-turn guard, no create matcher, exact-id observation, failed-read versus empty-list, epoch protection, clean adoption, dirty conflict, and the hidden-draft decision. They do not render the page. They do not treat a changed stamp as a fresh snapshot.

Mounted proof lives in `scripts/account-world-visit-workflow-completion-1/**`, after the same shape as the accepted account-traveller harness: esbuild aliases replace only `next/navigation` and `lib/account/besuche-aktionen.ts`. The production `AccountBesuche`, form, and hook are the mounted modules. Playwright is the existing devDependency. The harness sets props itself. A resolved refresh shim must not, by itself, set `inhaltBeobachtet` to `anders`.

The mounted cases cover create, edit, and revoke for a returned generic `{ ok: false, meldung }` using `SCHREIBFEHLER`, `SCHREIBFEHLER_AUSFALL`, and a hint sentence such as `BESUCH_MELDUNG.ohneZiel`, in addition to a rejected promise. They cover a synchronous throw inside the thunk, malformed fulfillment, delayed success, delayed error, and settle. They cover a same-turn double submit, retained draft and target, explicit checking, acknowledgement with the list still open, unchanged props, a stamp seen before settlement, a later differing stamp, and exact-id presence or absence. They also cover two identical visits, a missing event, a failed read, a filter that hides the edited row, row replacement and removal, and switching or cancelling confirmation while an older operation resolves.

Same-id cases are mounted, not only pure. Before dispatch, a clean editor adopts changed canonical fields and sends nothing until the user submits. A dirty editor keeps its typed fields, sends nothing, and sends the dirty payload only after "Meinen Entwurf speichern". During pending, the recorded argument stays the snapshot from `senden` while the props for that id change, and the draft is not replaced. Removal before dispatch records zero calls. Removal during pending does not retarget the result.

Assertions require the recorded action argument to be the captured `besuchEingabeAus` or `{ id }` shape, no second call after a returned `{ ok: false }` until "Erneut senden", and no create correlation. A local reader miss records zero calls. Lease expiry and a refresh that resolves without a new prop stamp leave the acknowledgement unchanged and do not show a freshness or extra success sentence. Map inputs are compared by reference to the props passed in, including while a draft is dirty.

CSS evidence uses project `styles/globals.css` through the existing Tailwind pipeline, at 320, 390, 768, and 1440, with root font size 32px. Cases include a long place label, the existing 40-event fixture, an open editor, an open revoke confirmation, and every failure state above. The proof measures overflow instead of hiding it. Clipping fails the case. Screenshots and the JSON report go under `docs/evidence/account-world-visit-workflow-completion-1/**`, bound to head, tree, and dirty state.

After implementation, the lane also runs focused regressions, Typecheck, lint, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, the production build, and `npm test`. Native App, Auth, and Vercel gates remain required and are not treated as passed by a local run. The two established conditional browser skips, 181 existing lint warnings, and the eleven previously reported untriaged dependency advisories stay existing limits.

This plan executes none of that proof.

## 7. Costs, security, and limits

No new dependency, hosted service, provider, secret, payment, or database call. No new monthly cost. The USD 100 boundary is unchanged. The actions stay authenticated session calls. This client still cannot insert into `account_visits` by itself. No passport, MRZ, biometric, or health field is added. Visit history is not a traveller-credential decision; citizenship and travel documents are not collected here.

Evidence from this lane is synthetic and local. It is not hosted Account proof, not SQL or RLS proof, not a full Next.js router proof, and not a physical-device proof. A refresh request is not causal readback. A changed displayed stamp is not a newer database snapshot. The single-flight ref is not a database transaction and not exactly-once storage. The frozen edit and revoke functions take no version, so a baseline match at dispatch does not stop another session from writing first. Full unmount drops unresolved context. Two identical visits cannot be tied back to one create response.

#985/#982 and #917 stay STOP/HOLD with no alternate path. #913/#911, #968, #748, #626, #937/#936, and Bern #934 stay unchanged. #944 does not autostart. No Production DB, Auth, AAL, RLS, secret, provider, payment, legal, or launch action follows.

## 8. Stop

The next step is a full Technical-Lead re-review of this corrected plan head. The same session implements only after that authorization. This document is not a PASS, Ready, or merge. Implementation, tests, evidence, and other documents stay unstarted.
