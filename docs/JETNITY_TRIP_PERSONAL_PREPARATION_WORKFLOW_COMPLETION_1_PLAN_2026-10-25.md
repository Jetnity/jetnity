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
- `components/trips/TripWorkspace.tsx`: existing Readiness callback types, destructuring, and forwarding; one hook call; forwarding into `Reisevorbereitung`; one additive read-only refresh callback.
- `components/trips/KontoArbeitsbereich.tsx`: the existing readiness callbacks around lines 172–176 and 211–215, plus the additive refresh that calls the existing `router.refresh()` and returns a non-certificate.
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

Account returns `{ art: 'props' }` after `router.refresh()`. That resolution is not confirmation. Guest returns the accessor result and calls `setReise` only for `success`. Every other guest result leaves the current trip state untouched.

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
- The same unresolved intent, submitted again without a new composer generation, reuses the ref. That is the conscious retry. It is never automatic.
- An edit of the field after a capture bumps the composer generation. The next submit is a new deliberate create and gets a new ref, including when the text is identical. This keeps the existing identity-test pairs: two typed submits produce two refs and two account rows.
- Edit, status, and delete address `clientRef` only. The visible title is a label, not a key. Equal titles are two rows.

### What is writable

Only a persisted `kind === 'preparation'` item with `evidence === 'user'` is editable here. New items are `preparation` / `open` / `countryCode null` / `tripItemId null`. Existing country code, trip item, and traveller ref survive an edit by the rules in section 2. Ticket, entry, stay, and other rows keep the current shared controls. Official unknown remains unknown.

### Validation

The UI does not grow a second business rule. The create and edit fields keep `maxLength={80}` because that control already exists. Empty, whitespace, 81 characters, sensitive text, links, HTML, and the 50-item total still fail inside the existing schema and `readinessItemBauen` / guest and account writers. The raw field string is what `onSetzen` receives, including surrounding spaces. The identity test currently requires that raw payload (`preparation-identity.test.ts`, title pairs and `assert.equal(payloadA.title, a)`). The writers trim and reject. At 50 persisted readiness items of any kind, a new create surfaces the existing error. An edit of an existing ref still submits, because both writers already allow that update.

### Stale title edit

Opening the title editor captures the row. If `currentness === 'stale'` and the stored status is `done` or `skipped`, the editor preselects `open` and shows:

"Dieser Stand ist erneut zu prüfen. Die bisherige Markierung Erledigt oder Nicht relevant gilt nicht mehr als aktuell. Offen ist vorausgewählt. Erledigt oder Nicht relevant werden nur gespeichert, wenn du sie in dieser Bearbeitung neu auswählst."

Saving sends the status selected in the editor, not the stored status. A current row preselects its real status. The existing Offen / Erledigt / Nicht relevant buttons stay explicit clicks for a conscious status change; they are not the title-save path. No fingerprint is copied, forged, or sent. The existing builder remains the only fingerprint writer. Personal done does not write Official truth.

### Transport versus observation

`null` from the writer means the action was accepted. It does not confirm the row. Confirmation for create, edit, and status is a later observation whose canonical item has the same `clientRef`, kind `preparation`, the submitted status, the normalized title, and the same country code, trip item, and traveller ref. Delete is confirmed only by observed absence after an accepted delete. A rejected promise, a lost response, or an unclear result keeps the intent and the draft. The next step is one read, never another write, until the user deliberately retries. That retry reuses the ref and says that the earlier attempt may already have landed.

A matching read after an unclear result is shown as the current state agreeing with the input. The copy does not call that causal proof. A conflicting read keeps the newer draft and explains the conflict. It does not write the old payload back. Absence after an unclear result does not prove the original write can no longer land, and it does not by itself prove a delete.

Account confirmation watches a `reise` render newer than the dispatch. `router.refresh()` finishing, including the refresh already inside the account writer, is not enough. Guest confirmation uses only `aktiveV3GastreiseLesen`. The trip object returned by `gastReadinessSetzen` is the write echo and does not confirm the row. Guest read failures (`missing`, `invalid`, `unreadable`, `wrong_trip`) keep the current graph and draft, show the specific failure, and leave retry disabled until that message is rendered. The user may then retry deliberately.

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
- Inline states, in the create or row region: pending, accepted but not reread, conflict, unclear result, and blocked read. The refresh control is "Stand neu lesen".
- Long titles wrap. They are not truncated below an accessible name.

## 6. Acceptance and proof matrix

Synthetic local proof only. It is not hosted Account, Next router, Supabase, RLS, Production, or launch proof. No hosted database read or write. No personal browser. No legacy Preview. No new route.

| Case | Where it is proved |
| --- | --- |
| Create, then canonical item, title edit, explicit status, named delete, then observed absence | Mounted guest seam through `gastReadinessSetzen` / `gastReadinessEntfernen` and `aktiveV3GastreiseLesen`. Account seam with a deferred writer and a controlled later `reise` prop |
| Two equal titles, two refs; double activation does not double-dispatch; conscious retry keeps the ref; unclear transport is not auto-resent | Workflow tests plus the mounted submit path |
| A pending while B changes; late A does not clear or focus B | Mounted workspace ledger |
| Preparation mode away and back keeps pending / unknown | Mounted `TripWorkspace`, using the existing mode navigation, while a deferred writer is unresolved |
| Trip switch and a rejected promise | Ledger ignores the old trip and does not write again after rejection |
| Failed, stale, and conflicting readback | Readback tests. Refresh itself performs zero writes |
| Stale done/skipped title edit saves `open` unless the editor selection changed; personal done leaves Official unknown | Workflow decision plus mounted Official section unchanged |
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

## 9. Stop

The git delta at this gate is the immutable TASK plus this PLAN. No product or test implementation is included. The next actor is the Technical Lead for an independent exact-head plan review.
