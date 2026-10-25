# Jetnity Trip Personal Preparation Workflow Completion 1 — PLAN

Date: 2026-10-25. Author: **Jetnity Trip Personal Preparation Workflow Completion 1 — Cursor Generation 1**.

This is the PLAN-only gate. It is not implementation, not proof, and not a Technical-Lead PASS. No product or test file is changed with this document. Implementation waits for an explicit head-bound Technical-Lead authorization in this same session.

## 0. Identity and live baseline

| Fact | Value read in this session |
| --- | --- |
| Logical name | Jetnity Trip Personal Preparation Workflow Completion 1 — Cursor Generation 1 |
| Requested model | Grok 4.7 High Fast / `grok-4.7-high-fast` |
| Actual `originalModelName` | `grok-4.7-high-fast` |
| Session | https://cursor.com/agents/bc-6bbca11e-14c9-4f1a-ac07-e729d8a54ca3 |
| Visible chat rename | Performed to the exact logical name. A self-report is not an independent Technical-Lead UI observation. |
| Branch / PR / tracking | `feat/r106-trip-personal-preparation-workflow-1` / Draft #1009 / #1006 |
| Batch | R106 #1003, decision MULTI_AGENT, integration **O → A → T** |
| Canonical index | #751. Governing precheck: comment [6392318194](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6392318194) |
| Immutable TASK | `docs/JETNITY_TRIP_PERSONAL_PREPARATION_WORKFLOW_COMPLETION_1_TASK_V1_2026-10-25.md` |
| TASK blob | `961e288a4e0ba40fa00e7ea95e920eabd6423ff2` |
| Seed head | `746b6b818e145198259a1cca3a3f307d3fa5b95e` |
| Seed tree | `b5fe010a7482898cc62cea9167a8f413a8212a63` |
| Actual `origin/main` and merge-base | `500fbe40c8c8a70a0fe0d291782289f809d5d5b3` |
| Main tree named by the task | `883e72fdab1411968b74dfaf879c4eea46891b9a` |
| Seed ahead / behind | 1 / 0 |
| Machine mode | `NORMAL` in `.jetnity/operating-mode.json` |
| Reisevorbereitung blob | `03138f5d085f544ebc89d2b734852033f2a0a30e`, matches the task citation |

`docs/ACTIVE_WORK_STATUS.md` still leads with the closed R105 package. That file is Technical-Lead-owned. This plan does not edit it. Live authority for this lane is the TASK, #751, precheck 6392318194, and #1003. Older dated handoffs are history.

No Auto fallback was used. This session does not Ready, merge, close #1006, write `main`, or start a follow-up.

PLAN review V1 on head `68165b15a0caf9aa822dbbf295851633edb86672` required T-PLAN-01, T-PLAN-02, and T-PLAN-03. PLAN re-review V2, comment [6392488318](https://github.com/Jetnity/jetnity/pull/1009#issuecomment-6392488318), read PLAN blob `39bd03dd58e1d5df3aa0990b772c4747ed4d0584` at `32b92fa26b5fc72884115f0deb352d547ef828c5` and required T-PLAN-04, T-PLAN-05, and Addendum T-1. TL plan acceptance V3 authorized implementation and added clarification T-1.1. The two sentences that counted the pre-return callback refresh as the intent's single automatic read are superseded below. The TASK blob stays `961e288a4e0ba40fa00e7ea95e920eabd6423ff2`. This update is not a product PASS.

## 1. Source-confirmed gap

The personal area already exists. It is not a second product. `preparationPersoenlichAufteilen` puts `kind === 'preparation'` into `eigene` and leaves ticket and other kinds in their own lists (`lib/readiness/preparation-premium-experience-5.ts`). `Reisevorbereitung` renders that list through the shared `Vorbereitungspunkt` and a create form (`components/trips/Reisevorbereitung.tsx`).

What the current personal path does:

- Create, lines 157–170, calls `readinessClientRefErzeugen('preparation')` on every submit and passes the raw field string as `title`. After `onSetzen` resolves to `null`, it clears the field. A returned error keeps the field. A conscious retry therefore receives a new `clientRef`.
- The list, lines 340–370, has no search and no Alle / Offen / Erneut prüfen / Erledigt / Nicht relevant filter. Zero personal points and a non-writable state share the sentence "Noch keine eigene Vorbereitung." A non-empty list with no visible match cannot occur, because there is no search or status filter.
- The row, lines 517–603, shows the title and offers Offen / Erledigt / Nicht relevant / Entfernen. It does not edit the title. Delete runs immediately, with no named confirmation. Status clicks call the shared `setzen`, which spreads the current item and the clicked status into `onSetzen`.
- `readinessItemBauen` always computes a new `contextFingerprint` from the current trip and the submitted title (`lib/readiness/bauen.ts`). A stale done or skipped point whose title edit resubmitted the stored status would make that old status current. The row does not explain that, and it does not preselect Offen for a stale edit, because there is no edit.
- `GastArbeitsbereich` and `KontoArbeitsbereich` already call `gastReadinessSetzen` / `readinessSetzen` and `gastReadinessEntfernen` / `readinessEntfernen`. Those writers already accept title, status, and delete. Account `readinessSetzen` returns `{ ok, wert: null }` and then `router.refresh()`. That null is transport acceptance, not a later look at `reise.readinessItems`. Guest `gastReadinessSetzen` writes the whole trip through `gastreiseSpeichern` and returns the saved trip; the workspace then keeps that return value. The write echo is not a separate read.
- `gastArbeitsbereichBeobachten` calls `gastspeicherLaden`, and that loader can call `legacyUebernehmen` (`lib/trips/gastspeicher.ts` around the loader; `components/trips/gast-reise-lesezustand.ts`). `erneut` in `GastArbeitsbereich` also clears `reise` and the draft before reading again. Neither is a pure read.
- Preparation is mounted only while `modus.ansicht === 'vorbereitung'` (`TripWorkspace.tsx` around line 962). Leaving the mode unmounts it. `TripWorkspace` itself stays mounted across that mode change. Pending state inside `Reisevorbereitung` would not.

Official checklist rendering, traveller forms, ticket rows, shared `setzen` for non-personal rows, `PreparationZiel`, and mode mounting stay as they are. Personal done must not be described as changing Official unknown / unavailable. Official status still comes from evaluations, not from `userStatus`.

## 2. Ownership

### This lane writes, after authorization

- `components/trips/Reisevorbereitung.tsx`: replace only the `eigene-vorbereitung` list and create form, and the `titel` / `eigeneHinzufuegen` state that exists for that form. Keep the surrounding `Bereich` (`id="eigene-vorbereitung"`), its open state, and `onZiel`. Do not change Official, ticket, traveller, shared navigation, or the shared `setzen` / `meldung` path used by other rows.
- New `components/trips/EigeneReisevorbereitung.tsx`: personal search, filters, create, title editor, explicit status, named delete, inline pending / error / readback.
- New `components/trips/usePersonalPreparationLifecycle.ts`: workspace-held ledger. Called from `TripWorkspace`, not from the unmounting list.
- New `lib/readiness/personal-preparation-workflow.ts`: pure intent, generation, stale-edit, duplicate-lock, and observation decisions. No React, no storage, no fingerprint forging.
- `components/trips/TripWorkspace.tsx`: existing Readiness callback types, destructuring, and forwarding; one hook call; forwarding into `Reisevorbereitung`; one additive read-only refresh callback; one personal-only read-only prop `readinessKanonischeReise`.
- `components/trips/KontoArbeitsbereich.tsx`: the existing readiness callbacks around lines 172–176 and 211–215, plus the additive refresh that calls the existing `router.refresh()` and returns a non-certificate. Addendum T-1 in comment [6392488318](https://github.com/Jetnity/jetnity/pull/1009#issuecomment-6392488318) also allows one unchanged pass-through, `readinessKanonischeReise={serverReise}`. The displayed `reise` can be `bestaetigt.graph` (`KontoArbeitsbereich.tsx` lines 58–76 and 131). That local receipt is not the observation prop. `bestaetigt`, `order`, `pilot`, and their callbacks stay untouched. No route, server, or schema API changes.
- `components/trips/GastArbeitsbereich.tsx`: the existing readiness callbacks around lines 260–268 and 287–295, plus the additive refresh that calls only the new accessor. It does not call `erneut`.
- `lib/trips/gastspeicher.ts`: one new exported read-only function. No other getter, writer, loader, legacy, or queue body changes.
- New `lib/readiness/personal-preparation-workflow.test.ts`, `personal-preparation-workflow-ui.test.ts`, and `personal-preparation-readback.test.ts`.
- `lib/readiness/preparation-identity.test.ts`: only the harness adjustment required so the existing form assertions hit the extracted create form. Identity, sibling, retry, limit, and evidence assertions stay.
- Later, still this lane: `docs/JETNITY_TRIP_PERSONAL_PREPARATION_WORKFLOW_COMPLETION_1_{STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-25.md`, `scripts/trip-personal-preparation-workflow-completion-1/**`, and new files under `docs/evidence/trip-personal-preparation-workflow-completion-1/**`. Failed evidence is kept. TASK V1 stays byte-identical.

### Frozen

Readiness actions, `gast.ts`, `bauen.ts`, schema, domain, fingerprint, status, ableitung, and workspace-presentation. `types/trips`. Every existing storage writer and loader body. Official, provider, pilot, reisende, and registry code. Routing, history, plan, and manual-journey contracts. Migrations, RLS, Auth, and SQL. Global styles, config, package, lockfile, and workflows. Due dates, priority, assignee, notifications, bulk writes, task deep links, new traveller or plan assignment, and budget or expense behavior. `PreparationZiel` navigation. Sibling lanes A and O. No cherry-pick.

The shared `onReadinessSetzen` payload does not gain `travellerClientRef`. It is not needed. `readinessEingabeSchema` defaults a missing value to `null`, and `readinessItemBauen` then keeps `bestehend?.travellerClientRef` through nullish fallback. Country code and `tripItemId` do not have that fallback: an edit must resend the item's current values through the fields the callback already has. Create continues to send `countryCode: null` and `tripItemId: null`.

### Callback added

`onReadinessAktualisieren` returns a discriminated read result. It never calls `readinessSetzen`, `readinessEntfernen`, `gastReadinessSetzen`, or `gastReadinessEntfernen`.

```ts
type ReadinessAktualisierung =
  | { art: 'props' }
  | { art: 'success'; reise: Trip }
  | { art: 'missing' }
  | { art: 'invalid'; grund: 'json' | 'graph' }
  | { art: 'unreadable' }
  | { art: 'wrong_trip' }
```

Account returns `{ art: 'props' }` after `router.refresh()`. That return increments no observation generation and confirms nothing. Guest returns the accessor result and calls `setReise` only for `success` of the expected trip. `missing`, `invalid`, `unreadable`, and `wrong_trip` leave the current trip state and the draft untouched, and they enable no readiness writer.

## 3. Guest read accessor

Add `aktiveV3GastreiseLesen(tripId: string)` in `lib/trips/gastspeicher.ts`. It is the only storage change.

It calls the existing private `aktiveSchluesselRohLesen`, the already imported `reiseLesen` from `lib/trips/schema.ts`, and the existing private `mitZuordnung`. It does not read or write the legacy key or the queue key. It does not call `gastspeicherLaden`, `gastreiseLadenNach`, `legacyUebernehmen`, `rohLesen`, `schreibenVersuch`, or `schreibenMuss`. It performs no `setItem` and no `removeItem`. It does not import or redefine `SCHLUESSEL`.

Outcomes:

| Accessor result | Source condition |
| --- | --- |
| `unreadable` | `nicht_im_browser`, storage getter failure, `getItem` throw, or an unexpected throw from `reiseLesen` / `mitZuordnung` |
| `missing` | active key absent (`art: 'fehlend'`) |
| `invalid` / `json` | bytes present and `JSON.parse` throws |
| `invalid` / `graph` | parse succeeds and `reiseLesen` returns `null`, or `mitZuordnung` returns `null` |
| `wrong_trip` | a valid assigned trip whose `id` is not the expected `tripId`. The other trip is not returned |
| `success` | assigned trip whose `id` matches, including its `readinessItems` |

`wrong_trip` carries no foreign graph. A browser-less call is `unreadable`, not `missing`. Tests count `setItem` and `removeItem` and snapshot the active, legacy, and queue bytes before and after every failure and the success read. The expected count is zero writes.

## 4. Lifecycle and data truth

The ledger is `useState` plus a `useRef` lock inside `usePersonalPreparationLifecycle`, owned by `TripWorkspace` and keyed by the intent's `tripId`. There is no module singleton and no `localStorage` ledger. A full reload, or any real unmount of `TripWorkspace`, drops it. That limitation stays visible in the UI copy for an unresolved intent. Guest trip-id changes already set `reise` to `null` and unmount the workspace (`GastArbeitsbereich.tsx` lines 73–78 and 223–227). This plan does not change that mount. Mode changes do not unmount `TripWorkspace`; they only unmount preparation. The ledger survives those.

Each intent stores `tripId`, `clientRef`, operation (`create`, `edit`, `status`, `delete`), captured payload, composer or editor generation, request generation, and phase (`pending`, `awaiting_readback`, `readback_blocked`, `conflict`, `reconciled`, `confirmed`).

### Identity and duplicate intent

- The first deliberate submit of a composer generation allocates one `clientRef` with the existing `readinessClientRefErzeugen('preparation')` and stores it before the first `await`.
- The lock is a `Set` in a ref. It is updated synchronously before any `await`. A second submit of that same intent in the same turn does not call the writer again.
- The same unresolved intent reuses its `clientRef` when a conscious retry is actually enabled. It is never automatic. On the guest seam the trip-scoped read-health barrier keeps every personal dispatch refused until a successful expected-trip read, including after the intent itself is discarded.
- An edit of the field after a capture bumps the composer generation. The next submit is a new deliberate create and gets a new ref, including when the text is identical. This keeps the existing identity-test pairs: two typed submits produce two refs and two account rows.
- Edit, status, and delete address `clientRef` only. The visible title is a label, not a key. Equal titles are two rows.

### What is writable

Only a persisted `kind === 'preparation'` item with `evidence === 'user'` is editable here. New items are `preparation` / `open` / `countryCode null` / `tripItemId null`. Existing country code, trip item, and traveller ref survive an edit by the rules in section 2. Ticket, entry, stay, and other rows keep the current shared controls. Official unknown remains unknown.

### Validation

The UI does not grow a second business rule. The create and edit fields keep `maxLength={80}` because that control already exists. Empty, whitespace, 81 characters, sensitive text, links, HTML, and the 50-item total still fail inside the existing schema and `readinessItemBauen` / guest and account writers. The raw field string is what `onSetzen` receives, including surrounding spaces. The identity test currently requires that raw payload (`preparation-identity.test.ts`, title pairs and `assert.equal(payloadA.title, a)`). The writers trim and reject. At 50 persisted readiness items of any kind, a new create surfaces the existing error. An edit of an existing ref still submits, because both writers already allow that update.

### Stale title edit

The editor reads the latest personal view item from the existing `readinessAnsicht`. Preparation freshness already includes normalized title, start date, end date, traveller count, destination countries, and route structure (`lib/readiness/fingerprint.ts` lines 138–148). `status.ts` `aktuellerFingerprint` (lines 26–47) already passes those facts, through `readinessReisekontext`, `routeFingerprintFelder`, and `travellerFingerprintFelderFuer`, into the exported `readinessFingerprint`. The editor calls that same exported function read-only. The canonical item's stored title is the title input, so keystrokes in the draft do not move the epoch. The returned string is the observed context epoch for a Done or Nicht relevant selection. It stays in editor state. It is not a second hash, it is not compared from the stored `contextFingerprint` alone, and it is not placed in the write payload. The readiness builder remains the only writer of the persisted fingerprint.

Opening a row whose latest `currentness` is `stale` and whose stored status is `done` or `skipped` preselects `open` and shows:

"Dieser Stand ist erneut zu prüfen. Die bisherige Markierung Erledigt oder Nicht relevant gilt nicht mehr als aktuell. Offen ist vorausgewählt. Erledigt oder Nicht relevant werden nur gespeichert, wenn du sie in dieser Bearbeitung neu auswählst."

The same reset runs while the editor is open. Before every dispatch, and whenever the recomputed epoch changes, a Done or Nicht relevant choice bound to the previous epoch is invalidated and the visible selection returns to Offen. This includes a point that is already stale: the user selects Done or Nicht relevant, then start date, end date, traveller count, destination countries, or route change again. `currentness` can remain `stale`, and `countryCode`, `tripItemId`, and `travellerClientRef` can stay equal, while the recomputed epoch changes. The old choice is not sent. Done and Nicht relevant can be sent only after a new deliberate selection bound to the epoch still current at dispatch. The save payload takes `countryCode` and `tripItemId` from the latest view item. `travellerClientRef` continues to survive through the existing builder fallback.

Edit, status, and delete of an existing ref are refused at dispatch when that `clientRef` is absent from the latest canonical personal items. The existing account insert and the guest whole-trip replace must not recreate a point that has disappeared. The editor explains that the point is no longer in the current list and calls no writer.

The existing Offen / Erledigt / Nicht relevant buttons outside this editor remain explicit clicks, and they pass through the same dispatch recheck. Personal done writes no Official truth.

A title or status save is shown as confirming the recheck only when the canonical view matches the expected ref, normalized title, status, and latest associations, and the existing derived `currentness` is `current`. A canonical point that still derives `stale` stays unconfirmed and explained, including when its title and status already match the payload. The workflow does not treat that field match as a completed recheck.

### Transport versus observation

`null` from the writer means the action was accepted. Acceptance and confirmation are separate. A still-pending promise confirms nothing, including when a matching canonical snapshot is already present. Delete is confirmed only by observed absence on a qualifying observation after an accepted delete.

Each intent records `dispatchLieferung`, the canonical delivery generation at the moment the writer is called, and `responseLieferung`, filled when the promise settles. Confirmation of an accepted account action requires a delivery generation strictly greater than both of those values, plus a matching canonical item. The snapshot current at dispatch, a snapshot that arrives while the promise is pending, and a snapshot that arrived before acceptance do not become the certificate after the response. If acceptance is followed only by that older generation, the intent stays `awaiting_readback`.

#### Canonical delivery generation

Addendum T-1, comment [6392488318](https://github.com/Jetnity/jetnity/pull/1009#issuecomment-6392488318), names the observation boundary. `KontoArbeitsbereich` receives the Server Component prop as `serverReise`. The `reise` value passed today can instead be `bestaetigt.graph` when that local receipt is based on the current server prop. A local receipt, an optimistic displayed graph, and a speculative render are not canonical delivery.

The wrapper passes `readinessKanonischeReise={serverReise}` through unchanged. `TripWorkspace` forwards that prop only into `usePersonalPreparationLifecycle`. The hook owns the observation epoch. `KontoArbeitsbereich` gains no generation counter and no other state. Each newly observed `readinessKanonischeReise` reference advances the epoch once, when the hook commits it. The same prop rendered again, a change only to the displayed `reise`, a personal-ledger update, and the return of `router.refresh()` leave the epoch unchanged. `{ art: 'props' }` records that a refresh was requested. The epoch is an observed canonical delivery. It is not a server nonce and it does not identify which request produced the snapshot. Guest confirmation does not use it.

After the account writer returns `null`, a delivery already observed before that acceptance stays non-confirming. The existing account readiness callback still calls `router.refresh()` once before returning `null`, because ticket readiness shares that callback. That pre-return refresh is not a post-acceptance observation and is not this intent's continuation. After acceptance is recorded, if no qualifying later committed `readinessKanonischeReise` exists, the controller may issue at most one additional read-only `onReadinessAktualisieren` for that intent. It marks `continuationUsed` synchronously before awaiting that call. There is no automatic repeat, no timer, no polling, and no second write. If no qualifying snapshot arrives, the intent stays in the honest awaiting state. "Stand neu lesen" sends one further refresh per explicit activation and no write.

For an accepted account result, the qualifying snapshot shows the same `clientRef`, kind `preparation`, submitted status, normalized title, and the latest country code, trip item, and traveller association. A recheck save also needs the existing derived `currentness` to be `current`. A repeated render of the same snapshot, or a pre-existing row that already matched at `dispatchLieferung`, does not confirm.

A rejected promise, a lost response, or any other unclear result keeps the intent and the draft. The following read is reconciliation. A match is described as the current state agreeing with the input, and the copy says that this does not prove which attempt wrote it. A conflict keeps the newer draft and does not write the old payload back. Absence does not prove the original write can no longer land, and it does not by itself prove a delete. A later conscious retry, once enabled, reuses the same ref and says that the earlier attempt may already have landed.

#### Guest confirmation and read lock

Guest confirmation is one successful `aktiveV3GastreiseLesen` result for the expected `tripId`, started after the writer promise has settled accepted, whose returned trip meets the same item and currentness rules. The object returned by `gastReadinessSetzen` is the write echo. A local `setReise` of that echo, and an accessor read that finished before acceptance, do not confirm the row.

`missing`, `invalid` (`json` or `graph`), `unreadable`, and `wrong_trip` set a trip-scoped read-health barrier on the workspace controller and move the unresolved intent to `readback_blocked`. The barrier is independent of any one intent. The draft and the in-memory graph stay. Storage bytes stay as they were: the accessor performs no write, `setReise` is not called, and no foreign trip is copied into React state. Rendering or acknowledging the failure does not clear the barrier.

Discarding an intent, starting a new composer generation, closing the error, and leaving and returning to preparation leave the barrier set. While it is set, `usePersonalPreparationLifecycle` refuses every owned personal create, edit, status, delete, and retry before `onSetzen` or `onEntfernen` is called. Disabled controls are only the visible consequence. Enter, a new ordinary submit from the retained draft, and a remounted row after a mode change take the same refusal. The existing guest writer saves a whole trip and has no compare-and-swap, so a new intent that sent the in-memory graph while the active key held another trip could replace that other trip. Further "Stand neu lesen" calls and existing navigation stay available and call no readiness writer. "Versuch lokal verwerfen" drops the local intent and leaves the barrier set. That abandonment does not cancel a write that may already have reached storage or the server. The typed draft remains.

Only a later `aktiveV3GastreiseLesen` result of `success` for the expected trip clears the barrier. The user can then make a conscious decision. Matching fields are agreement with the input, not proof the blocked attempt failed to run or proof that it caused the match. Absence or a conflict is not proof the attempt is still outstanding and not proof it can no longer land. The copy states that uncertainty. A retry chosen from that successful read reuses the same `clientRef` and passes the trip from that successful read into the existing writer. Plan, traveller, and other frozen callbacks are unchanged. The cross-tab whole-trip race remains a real residual after the barrier clears, because the writer still has no compare-and-swap. This barrier is not a claim of global multi-tab atomicity. A full unmount of `TripWorkspace` still drops the in-memory barrier with the rest of the ledger.

Late success or failure of intent A does not clear, focus, or announce into draft B, a newer editor generation, another filter, a collapsed section, a hidden preparation mode, or another `tripId`. Updated props, a removed point, a filter change, closing the editor, and a trip switch are explicit boundaries. If `TripWorkspace` is still mounted and `reise.id` changes, old intents cannot affect the new trip. If the parent unmounts the workspace, the in-memory ledger ends with it.

### Focus

Focus only a connected, visible element that still belongs to the active request or editor generation. Do not focus a detached node, a `hidden` subtree, or a collapsed `eigene-vorbereitung` section, and do not reopen that section from a late callback. When a confirmed status leaves the active filter, or the last visible row is deleted, do not move focus to a removed node.

## 5. Personal UI

`EigeneReisevorbereitung` is rendered as the children of the existing `eigene-vorbereitung` `Bereich`. It uses the current Workspace controls: 44px targets, existing brand and line tokens, `break-words`, and the existing sensitive hint. No new color and no new dependency.

- Search label: "Suche in eigenen Punkten". Match is a case-insensitive substring of the stored title. It does not rewrite storage.
- Filter group: "Eigene Punkte filtern", with Alle, Offen, Erneut prüfen, Erledigt, Nicht relevant.
- Offen means current and `open`. Erneut prüfen means `stale`. Erledigt means current and `done`. Nicht relevant means current and `skipped`. Alle shows every own preparation point.
- Zero own points uses the existing sentence "Noch keine eigene Vorbereitung." That remains the empty state even if a filter or search is set.
- One or more own points, with none visible, uses "Keine eigenen Punkte passen zu dieser Suche oder Auswahl."
- A confirmed status that no longer matches the active filter removes that row from the filter. Until confirmation, the pending row stays visible where the user acted.
- Create stays "Punkt hinzufügen". Title edit is "Titel bearbeiten" and "Speichern".
- Delete asks "Diesen Punkt entfernen: {title}?" and then "Endgültig entfernen" or "Abbrechen". The command carries `clientRef`. When another row has the same title, the question also includes the row's current status text so the name is not ambiguous. That text is not the identity.
- Inline states, in the create or row region: pending, accepted but not reread, conflict, unclear result, and blocked read. The refresh control is "Stand neu lesen". A blocked guest read offers "Versuch lokal verwerfen", which drops that intent and writes nothing. The trip-scoped read-health barrier stays, so a new submit from the retained draft is still refused.
- Long titles wrap. They are not truncated below an accessible name.

## 6. Acceptance and proof matrix

Synthetic local proof only. It is not hosted Account, Next router, Supabase, RLS, Production, or launch proof. No hosted database read or write. No personal browser. No legacy Preview. No new route.

| Case | Where it is proved |
| --- | --- |
| Create, then canonical item, title edit, explicit status, named delete, then observed absence | Mounted guest seam through `gastReadinessSetzen` / `gastReadinessEntfernen` and a post-acceptance `aktiveV3GastreiseLesen` success. Account seam with a deferred writer and a later `readinessKanonischeReise` delivery |
| Two equal titles, two refs; double activation does not double-dispatch; conscious retry keeps the ref; unclear transport is not auto-resent | Workflow tests plus the mounted submit path |
| A pending while B changes; late A does not clear or focus B | Mounted workspace ledger |
| Preparation mode away and back keeps pending / unknown | Mounted `TripWorkspace`, using the existing mode navigation, while a deferred writer is unresolved |
| Trip switch and a rejected promise | Ledger ignores the old trip and does not write again after rejection |
| Pre-acceptance-only props; a local `bestaetigt.graph` change; the same `serverReise` prop rendered again; desired values already present at dispatch; acceptance followed only by the old epoch | Account observation tests through `readinessKanonischeReise`. None of these confirm. The pre-return `router.refresh()` and its return advance no epoch. After acceptance the controller issues exactly one additional read-only refresh and does not repeat it |
| Accepted account response, then exactly one post-acceptance read request, then a newly committed raw `serverReise` that matches, including `currentness: current` for a recheck save | Account observation test, and this later delivery is the confirming case |
| Guest write echo, and an accessor success that finished before acceptance | Guest observation tests. Neither confirms. Confirmation is a post-acceptance accessor success for the expected trip |
| Failed, stale, and conflicting readback | Readback tests. Refresh itself performs zero writes |
| Mounted `wrong_trip` and mounted storage-unreadable, then discard, then a new submit, Enter, edit, and delete after preparation mode away and back | The read-health barrier still refuses every personal dispatch. Readiness writes stay at zero. Foreign and unreadable bytes stay unchanged. The draft remains. Abandonment does not cancel a server write |
| A later successful read of the same trip after that barrier | A deliberate personal action can proceed. The uncertainty copy stays when the read is absent or conflicting |
| Successful expected-trip read after a block, with absence or a conflict | The conscious decision states the uncertainty, keeps the same ref, and still does not call the earlier attempt non-execution |
| Stale done/skipped title edit saves `open` unless a later deliberate selection was made for the current `readinessFingerprint` epoch | Workflow decision plus mounted editor. The epoch string is absent from the write payload |
| Current done/skipped becomes stale while the editor is open | Mounted editor. The visible selection returns to Offen. The captured old status is not dispatched |
| Already stale, then Done or Nicht relevant, then a date or route change while `currentness` stays `stale` and `countryCode`, `tripItemId`, and `travellerClientRef` stay equal | Mounted editor. The recomputed epoch changes and the choice is invalidated |
| Edit or status for a `clientRef` that the latest canonical items no longer contain | Dispatch calls no writer, so the account insert and the guest replace cannot recreate the point |
| Readback whose title and status match while the existing derived `currentness` is still `stale` | The recheck stays unconfirmed |
| Personal done leaves Official unknown | Mounted Official section unchanged |
| Existing context and null create context | Payload assertions against the real writers |
| 80 and 81 characters, empty, whitespace, sensitive, link, HTML, 50 total including other kinds, edit at the limit | Existing identity assertions, still executed, plus the real schema and writers |
| 0, 1, and 50 own points; every filter; search; no match; long and equal titles; status leaving the filter; delete of the last visible row | Mounted personal component |
| Accessor valid, missing, bad JSON, invalid graph, unreadable, wrong trip; no draft loss | Readback tests with a storage spy |

`personal-preparation-workflow.test.ts` exercises the pure module with deterministic fixtures. Those tests do not count as wiring proof.

`personal-preparation-workflow-ui.test.ts` and the local harness mount the production components. The harness follows the existing local pattern: esbuild the owned surface, `createRoot`, Playwright chromium, and CSS taken from the production build. Deferred promises, a controlled clock where a timeout matters, and deterministic canonical props drive the ledger. The direct function call used by the identity test does not run effects, so focus and unmount are proved only on this mounted path. The harness does not start a deployed server and does not add a test route.

`personal-preparation-readback.test.ts` uses the real accessor and the real guest writer. The account side uses the real `readinessSetzen` only through the same dependency-substitution style the identity test already uses, then feeds the resulting canonical props back. It does not open a network connection.

`preparation-identity.test.ts` loads the extracted create form. Its `useState` stand-in learns functional updates and `useRef`, because ref allocation and the lock are synchronous in the submit handler. The one-input / one-form lookup is limited to `data-personal-preparation-create`, so row editors do not break it. Assertions that separate refs, sibling rows, exact ref updates, 80-character titles, rejected invalid titles, the 50-item cap, and `evidence: 'user'` stay in force.

Also run the existing readiness identity, schema, fingerprint, and status tests, and an unchanged render check that Official and traveller output in `Reisevorbereitung` still appears. Record command, exit, and counts. A skipped test is not a PASS. The task's current baseline is 7213 tests, 2 explicit conditional browser skips, and 181 lint warnings. Report the actual numbers. Eleven existing advisories stay untriaged and out of scope.

Viewport and interaction evidence, in the owned script, covers 320, 360, 390, 768, and 1280 CSS pixels, a 320px page at 32px root font size, keyboard operation, and reduced motion. Long content, empty, no-match, error, and pending are included. Root and page overflow are not hidden. The record states that this is local CSS and font simulation, not native zoom, a physical device, or a screen reader. It also records commit and source digests, fixture boundaries, browser, and version.

Focused tests, the relevant existing regressions, TypeScript, lint, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, and the production build run after implementation. No package, lockfile, workflow, timeout, gate, or suppression change. Mandatory native App, Auth, and Vercel CI stay in place and are reported only if actually observed.

## 7. Costs, limits, and non-claims

No new runtime cost, provider, model call, dependency, or infrastructure. The USD 100 monthly ceiling and prelaunch `noindex` stay untouched. No credential, payment, contract, or launch action.

This work does not add compare-and-swap, exactly-once delivery, or multi-tab atomicity. Guest whole-trip writes can still race across tabs and devices. The ledger is in memory only. Hosted Account and the full Next router remain unverified unless the Technical Lead exercises them separately. #985 and #982 stay HOLD. #917 stays a denied hosted-readback STOP. #913 and #911 stay blocked. #968, #937, and #936 stay paused. #748 stays suspended. #626 stays STOP. Bern #934 stays hard-blocked. No hosted database, personal-browser, or legacy-Preview work.

## 8. Implementation order after authorization

1. Pure workflow module and its unit tests.
2. Read-only accessor and readback tests, with write spies, before any UI uses it.
3. Workspace hook, personal component, and the narrow `Reisevorbereitung` replacement.
4. Callback forwarding and the two refresh wrappers.
5. Identity-test retarget, then mounted UI and browser evidence.
6. Status, report, self-review, and handoff. Self-review is not a Technical-Lead PASS.

A changed head invalidates this plan gate. Corrections before implementation stay in this session and this branch.

## 9. Implementation

TL plan acceptance V3 authorized the scoped implementation in the same session. T-1.1 above is the account continuation rule that implementation follows. T-PLAN-01 through T-PLAN-05 stay as accepted. A later head still needs an independent Technical-Lead review. This plan is not a product PASS, Ready, or merge.
