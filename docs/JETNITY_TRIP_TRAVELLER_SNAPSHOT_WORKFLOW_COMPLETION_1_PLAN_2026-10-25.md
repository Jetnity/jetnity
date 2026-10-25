# Jetnity Trip Traveller Snapshot Workflow Completion 1 — PLAN

Date: 2026-10-25. First plan for immutable TASK V1. This commit adds only this file. TASK V1 stays byte-identical. No product code, test, script, or evidence is included. Implementation waits for a fresh head-bound Technical-Lead acceptance of this plan. This session does not authorize the narrow test exception in section 8.

## 1. Identity

| Field | Value |
| --- | --- |
| Logical author | Jetnity Trip Traveller Snapshot Workflow Completion 1 — Cursor Generation 1 |
| Requested model | Grok 4.7 High Fast / `grok-4.7-high-fast` |
| Actual `originalModelName` | `grok-4.7-high-fast` |
| Session | https://cursor.com/agents/bc-5d06d92d-a371-4889-b29c-f03a9b6c85d0 |
| Session id | `bc-5d06d92d-a371-4889-b29c-f03a9b6c85d0` |
| UI rename | The rename tool returned the title `Jetnity Trip Traveller Snapshot Workflow Completion 1 — Cursor Generation 1` for this `bcId`. That return is this session's tool result. It is not an independent Technical-Lead observation of the agents list. |
| Branch | `feat/r107-trip-traveller-snapshot-workflow-1` |
| Draft PR | #1017 |
| Tracking | #1012 |
| Batch | #1011 |
| Canonical index | #751 R107 V2, re-read this session |
| Lane | R107-T |
| Machine mode | `NORMAL` (`.jetnity/operating-mode.json`, re-read this session) |

The requested model is the attested runtime model from this run's identity. This plan does not use Auto or another model.

## 2. Exact baseline re-read this session

`git fetch origin main` and `git fetch origin feat/r107-trip-traveller-snapshot-workflow-1` completed before these values were recorded.

| Ref | SHA |
| --- | --- |
| `origin/main` | `a74c443c6be3f064f150fcf021ab6154bda325e5` |
| `origin/main` tree | `c1fe5a50b0da710ef425674057f782b1dff6f8bc` |
| Seed head before this plan | `25d70d62d78cc44bf96d15c261ca566f03ec1268` |
| Seed parent / merge-base | `a74c443c6be3f064f150fcf021ab6154bda325e5` |
| TASK blob | `75c59b0851d835560ff4b5562e9fcc52c395b2ad` |
| Ahead / behind at seed | 1 ahead / 0 behind |
| Operating-mode blob | `1912bf56751a940acc56fad84e2bf9e6a174e0fa` |
| Seed diff | `docs/JETNITY_TRIP_TRAVELLER_SNAPSHOT_WORKFLOW_COMPLETION_1_TASK_V1_2026-10-25.md` only |
| Remote branch tip at this read | `25d70d62d78cc44bf96d15c261ca566f03ec1268` |

No new main drift. `origin/main` is still the dispatch SHA. This plan does not rebase or merge. The commit that adds this file is the next head. That head, its tree, the plan blob, and the resulting ahead/behind are in the session reply, not inside this file. A local `next-env.d.ts` typegen path change was present in the worktree and is not part of this commit.

Live index [#751](https://github.com/Jetnity/jetnity/issues/751) top section, re-read this session, is R107 V2. This lane is PLAN ONLY. `JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md` still open on the R106 closure pointer. Those paragraphs are historical. Live main, live mode, #751, and #1011 supersede them. This plan does not edit those Technical-Lead-owned files.

Integration remains **T → S → D → W → M**. This lane does not read or edit sibling branches. If `origin/main` moves past `a74c443c6be3f064f150fcf021ab6154bda325e5`, implementation stops until the Technical Lead gives an explicit same-session sync instruction.

## 3. Startup reads

These reads bind the existing rules. They do not add a product decision.

| Document | What applies here |
| --- | --- |
| `.jetnity/operating-mode.json` | `mode` is `NORMAL`. Re-read this session. |
| TASK V1 | Immutable scope, P1, allowlist, proof, and stop. Blob matches the dispatch. |
| `JETNITY_START_HERE.md`, `docs/ACTIVE_WORK_STATUS.md` | Historical R106 pointer. Live writer index is #751. Neither file is edited. |
| `AGENTS.md` | The trip graph stays the source of truth. Empty stays distinct from error. No new provider, secret, or schema. |
| `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md` Phases F–H | This session delivers the plan and stops. Self-review is not PASS. The same session fixes a later CHANGES REQUIRED. A new head invalidates this gate. |
| `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md` and slice planning standard §§1–5 | One writer on this branch. #1011 already fixed five disjoint lanes and integration T → S → D → W → M. |
| `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md` §1 | Live evidence wins. #751 and #1011 were re-read with this plan. |
| `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md` §§8–9 and 11 | §§8–9 do not assign this editor repair. §11 requires the core journey to stay coherent. No build-order change. |
| `docs/JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md` Phase 1 items 2–3 | Account Registry, trip snapshot, and multi-citizenship credentials are already in the V1 core. This plan repairs the current-trip editor and the existing explicit intake. It adds no Phase 2 surface. |
| `JETNITY_VISION.md` product core | One trip graph. The registry remains reusable account facts. The trip snapshot stays the trip's current truth. |
| `DECISIONS.md` ADR-0124 and ADR-0187 | Document `clientRef` stays stable. Issuer does not become a citizenship. A missing relation stays `null`. Registry materialization mints disjoint trip-owned ids and remaps the relation. It does not copy registry ids. `travellerLegacyLesen` is not the registry authority. |
| `DESIGN_SYSTEM.md` §1 | The card keeps the classes already on this surface. No new brand color. |
| `docs/PRODUCT_QUALITY_STANDARD.md` §§2, 6 and 8 | Phone widths, keyboard, focus, and separate loading, empty, and error stay on the surface that owns the operation. |
| `docs/LOGIC_STANDARD.md` §§1 and 4 | A missing value stays missing. An unknown write outcome stays unknown. Accepted, refresh requested, and later observed state are different states. |
| `docs/CONTINUITY_STANDARD.md` §11 | This plan records the design, the proof classes, and the stop. It is not an implementation report. |
| `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md` §§1–3 | Several citizenships and documents stay equal options. Residence, issuer, and country do not choose a credential. Null association stays null. |
| #751 and #1011 | R107-T is the open P1. R106 is complete and is not reopened. |

## 4. Evidence class for this delivery

This plan is source reading plus live git and GitHub reads. It is not mounted UI behavior, not a local test run, and not hosted, CI, RLS, or database proof. The existing Vercel preview on the task-only seed deploys the unchanged editor. It is not acceptance of this repair. No hosted data was read.

The P1 below is the relation-loss path #1011 already reproduced with the pure helpers. This plan confirms that path in the current source and does not claim a new browser reproduction.

Local `node -v` at this read is `v22.23.4`, which is inside `package.json` `engines.node` `22.x`. That version is not a test result.

## 5. Source-confirmed gaps

Assigned source at the seed head:

1. **P1, country identity replaces the citizenship ref.** `ReisendenKarte` stores citizenships as country strings (`components/trips/Reisevorbereitung.tsx` lines 690–692). Submit keeps only `/^[A-Z]{2}$/` codes and sets `clientRef: citizenshipClientRefFuer(countryCode)` (lines 711–718). The relation control collapses countries with `new Set` and uses the same country-derived value (lines 837–840). `citizenshipClientRefFuer` returns `` `citizenship:${country}` `` (`lib/readiness/dokument-formular.ts` lines 20–22). `dokumenteAlsPayload` calls `dokumenteNachCitizenships`, which keeps a relation only when it is one of those country refs and otherwise sets `null` (lines 47–63 and 66–76). An imported UUID such as `a1111111-1111-4111-8111-111111111111` is therefore replaced by `citizenship:CH`, and a passport that pointed at the UUID is submitted with `citizenshipClientRef: null`, even when the country did not change. Removing a citizenship row calls the same country filter (lines 747–750), so it cannot clear only the removed row.
2. **Document read is already identity-preserving.** `dokumenteAusTraveller` copies `clientRef` and `citizenshipClientRef` (lines 38–44). The loss is on the way back to the payload, not on the read. New document rows already use `neueDokumentClientRef` (Reisevorbereitung lines 864–868). That helper stays the allocator for a new document. An empty document list asks it for a fresh blank row on every call (dokument-formular lines 27–35), so a blank row must be allocated once in the draft and not re-minted on each render.
3. **One-time field state ignores later canonical props.** Residence, citizenships, and documents are `useState` initializers (lines 689–695). There is no later adoption and no conflict. The summary reads the live slot (lines 630–633) while the form keeps the first snapshot. `TripWorkspace` already receives `readinessKanonischeReise` and its comment says only personal preparation observes it (lines 264–266 and 372–380). Account `KontoArbeitsbereich` passes the raw server trip there (`readinessKanonischeReise={serverReise}`) and separately displays `bestaetigt.graph` when that object is still the basis. Traveller save does not participate in either observation.
4. **Save and remove have no owned in-flight or exception boundary.** Submit and remove `await` the callback and, on a string, call the shared `onFehler` (lines 708–722 and 893–896). There is no `try/catch`, no operation generation, and no synchronous guard. The submit button is not disabled before the next render, so two Enter submissions in one turn can both pass. Remove is one click, with no named confirmation.
5. **Errors are shared by every card.** One `meldung` state (line 119) is passed as `onFehler={setMeldung}` to every slot (line 256). A failure on one person replaces the message for the section. Readiness-item failures use that same state and stay there. Traveller outcomes must leave it.
6. **The preparation surface unmounts on ordinary section navigation.** `Reisevorbereitung` is created only while `modus.ansicht === 'vorbereitung'` (`TripWorkspace.tsx` lines 694–709 and 979–999). `TripWorkspace`, `KontoArbeitsbereich`, and `GastArbeitsbereich` stay mounted across Übersicht, Reiseplan, Organisieren, and Vorbereitung. Card state and the intake's `useState` die on that navigation. Full unmount of `TripWorkspace` is a separate, explicit limit.
7. **Registry intake has no trip identity and treats callback `null` after `router.refresh()` as finished display.** `RegistryReiseUebernahme` takes `(registryTravellerId) => Promise<string | null>` and has no `tripId` (lines 24–33). One `useTransition` pending flag and one `status` cover every source (lines 35–49). `null` becomes `REGISTRY_TRIP_COPY.erfolg` immediately. `KontoArbeitsbereich` returns that `null` only after `registryTravellerInReiseUebernehmen` and `router.refresh()` (lines 203–211). A throw from refresh, or a throw after the write was accepted, rejects the whole callback. There is no `try/catch`. The same shape is used for `onTravellerSetzen` and `onTravellerEntfernen` (lines 183–196). Guest maps thrown `gastTravellerSetzen` / `gastTravellerEntfernen` errors to a string and returns `null` after the local write (GastArbeitsbereich lines 275–291). Neither adapter distinguishes accepted write, requested refresh, and later observed props.
8. **Materialization mints fresh ids. The UI must not rediscover them.** `tripSnapshotMaterialisierungErzeugen` allocates a new traveller, citizenship, and document identity and remaps by source ref (`lib/traveller/account-registry-trip.ts` lines 147–171). The action result is `{ ok: true, wert: null }` (`reisende-aktionen.ts` lines 145–148). A later party list cannot be matched by label, country, count, or order. Two registry rows may share a label; the list key is already `traveller.id` (RegistryReiseUebernahme line 118). That key must remain the intent id.
9. **The frozen writer can drop duplicates and still succeed.** `travellerEingabeSchema` runs `travellerLegacyLesen` inside the transform before `superRefine` (`lib/readiness/schema.ts` lines 261–313). `travellerLegacyLesen` skips a repeated country and a repeated document `clientRef`, and nulls a relation whose ref is not in the kept citizenship set (`lib/readiness/traveller-kontext.ts` lines 162–169 and 217–229). The duplicate-country issue in `superRefine` therefore does not see the rows the transform already removed. `party_loeschen` deletes one `trip_travellers` row and does not update `trips.travellers` (`supabase/migrations/20260828015304_traveller_write_contract_integrity.sql` lines 142–149). `travellerSlots` still renders that headcount, with `persisted: false` when the profile is gone (`lib/readiness/party.ts` lines 65–108). Guest removal filters `party` and leaves `travellers` on the spread trip (`reisende-gast.ts` lines 29–33).

Limits that stay: 8 citizenships and 12 documents (`TRAVELLER_CONTEXT_GRENZEN` in `lib/readiness/domain.ts`). No passport number, MRZ, biometrics, health, or file field exists on this surface. None is added. The account-registry UI test already forbids `citizenships[0]`, `documents[0]`, `selected`, `checked`, and `type="radio"` in the intake. Those absences stay.

## 6. Design

The repair is a trip-snapshot draft and a small intent ledger. It is not a second writer, not a change to materialization, and not a generalization of `usePersonalPreparationLifecycle`. The new module does not import the personal-preparation workflow.

### 6.1 Draft rows

A citizenship row is `{ clientRef, countryCode }`. A document row is the existing `DokumentFormularZeile`: stable `clientRef`, type, issuer, expiry, and `citizenshipClientRef`.

- A row loaded from the canonical traveller keeps its `clientRef` exactly, whether it is a UUID or a legacy `citizenship:CH` / `document:…` ref. Changing the country, issuer, type, or expiry does not allocate a replacement ref.
- A row the user adds allocates one ref at creation and keeps it across edits, conflict resolution, and retries. A new citizenship ref is `citizenship:` plus one `crypto.randomUUID()`, length under 64. It is not `citizenshipClientRefFuer(country)`. A new document ref remains `neueDokumentClientRef()`.
- The relation select's option value is that row's `clientRef`. The visible label is `landAnzeigeText(countryCode)`. Countries are not collapsed with `new Set`. If two dirty rows share a display name, the label may add a non-parsed disambiguator. The submitted value stays the ref.
- Deliberate removal of a citizenship row sets `citizenshipClientRef` to `null` only on documents that pointed at that removed ref. A document pointing at a different ref with the same country stays pointed at that ref.
- An untouched blank document row (no type, no issuer, no expiry, no relation) is omitted from the payload and is not described as saved. A document row with any of those fields set and an empty or illegal type fails closed and does not call the writer. Empty optional citizenship rows are omitted. A filled invalid country, a duplicate country, a duplicate citizenship or document ref, or a relation that is neither `null` nor one of the draft citizenship refs fails closed and does not call the writer. The duplicate-country sentence is the existing schema sentence `Dieselbe Staatsbürgerschaft kann nur einmal erfasst werden.` The client uses it because the frozen transform would otherwise drop the duplicate and return success.
- The payload still goes through the existing `travellerSetzen` or `gastTravellerSetzen`. Those functions stay the writers. The client pre-check does not replace their validation. It only stops a silent drop from being shown as success.

`dokumenteAusTraveller` remains the read mapper for an existing document list. `dokumenteAlsPayload`, `dokumenteNachCitizenships`, and `citizenshipClientRefFuer` are not on the save or removal path. `lib/readiness/dokument-formular.ts` and its test stay byte-identical. Section 8 records why that does not need a hygiene edit, and which frozen assertions still name the old calls.

### 6.2 Where state lives

`useTripTravellerSnapshotLifecycle` is called from `TripWorkspace`, beside the personal-preparation hook. The ledger lives in a ref that is updated synchronously, with React state as the display copy. The same pattern already keeps personal-preparation intents across the preparation unmount. This hook's state is traveller drafts, slot save/remove intents, and registry-intake intents for this mounted workspace.

The ledger key is `tripId`. A different `reise.id` replaces the ledger. An in-flight callback that finishes for the old id does not write status onto the new trip and does not start itself again.

Drafts and intents are keyed by traveller `clientRef` or registry `id`, not by slot index, label, country, or array position. `TripTravellerSnapshotEditor.tsx` is not added. The visible card stays `ReisendenKarte` inside `Reisevorbereitung.tsx`, so the existing source contracts for `LandFeld`, the button labels, the layout classes, and the official-surface markers remain in that file. The card becomes a controlled view of one ledger entry. Official Truth, the checklist, and `EigeneReisevorbereitung` keep their current props and markup.

Account observation uses `readinessKanonischeReise` when it is passed. Guest observation uses the guest `reise` prop. The traveller summary and the draft baseline use that same object. The rest of `Reisevorbereitung` continues to read the workspace `reise` for readiness items and official evaluations. The TripWorkspace comment that says only personal preparation observes the canonical prop is updated to include this traveller observation. The prop's source in Konto stays `serverReise`.

A fingerprint is the slot `clientRef`, residence, and the set of citizenship `{clientRef, countryCode}` plus document `{clientRef, type, issuer, expiry, citizenshipClientRef}`. Order is not part of the fingerprint, because the frozen reader sorts. Equality means those fields match. It does not mean this click caused the stored row.

Clean draft: the canonical fingerprint changed and the user has not edited. Replace the draft from the canonical slot, including a coherent set of child refs and relations. Dirty draft: the canonical fingerprint changed. Keep the draft, show a conflict on that card, and do not submit. The choices are **Neu laden** (discard the draft and show the canonical slot) and **Meine Eingaben behalten** (keep the draft and record that the user saw this fingerprint). Save stays disabled until one of those choices. A later Save after **Meine Eingaben behalten** is a new explicit intent. A prop update never submits. A known-stale draft does not overwrite the observed slot by itself.

If the canonical trip no longer contains that `clientRef`, the draft is not applied to another slot. A pending result for a missing target stays on the ledger as unattached and is not focused.

### 6.3 Slot save and remove

Each intent records `tripId`, traveller `clientRef`, draft generation, and operation generation. The synchronous ref records the in-flight operation before any `await`. A second save, a save while remove is in flight, or a remove while save is in flight, for the same `clientRef`, does not call the writer. A different slot may have its own in-flight operation. Enter in the save form submits that form only. The remove control stays `type="button"` outside the save form.

The writers stay behind the existing callbacks. Their result is classified only as follows:

| Callback result | Recorded state | What the UI does not do |
| --- | --- | --- |
| thrown exception | `unclear` | no rollback, no automatic retry |
| anything other than a string or `null` | `unclear` | no success |
| string | `rejected` for this intent | the string is not shown on another card |
| `null` | `accepted` | this is not yet an observed slot |

After `accepted`, the hook requests one refresh. Account refresh is `router.refresh()` and returns only that the refresh was requested. Guest refresh is the existing `onReadinessAktualisieren` read. A throw from that second call leaves the write `accepted` and the refresh `unclear`. It does not repeat the write. A later canonical fingerprint that matches the submitted payload moves that intent to `consistent`. The visible sentence says the latest loaded slot matches what was submitted. It does not say the load was caused by this click, and it does not say the write was exactly once. A later fingerprint that differs, while the draft generation is still the submitted one and the draft is clean, adopts the canonical slot and shows that the loaded slot differs. A newer draft generation ignores stale success, stale error, and stale completion.

Remove asks for a named confirmation first. The copy names the slot label and says this deletes the saved details for this trip slot, the headcount stays, the empty slot remains, and an Account Registry person is not deleted. Cancel focuses the remove button and does not call the writer. Confirm sends the existing remove callback for that `clientRef` only. There is no `window.confirm`.

### 6.4 Registry intake

`RegistryReiseUebernahme` becomes a controlled view. Confirmation id, per-source pending, and per-source outcome live in the workspace ledger. The component still renders only the existing copy keys for loading, empty, read error, limit, action, confirm, and cancel. List keys stay `traveller.id`. The same label on two rows stays two rows. No radio, no default row, no `citizenships[0]` or `documents[0]`.

Konto still calls `registryTravellerInReiseUebernehmen` and still contains the exact expression `registryTripUebernahmeGesperrt(reise)`, because `lib/traveller/account-registry-trip-ui.test.ts` locks that text. The server orchestration remains the capacity check. The `voll` flag only blocks a new click. It does not cancel an in-flight intake and it does not convert a server string into success. The click captures `{ tripId, registryTravellerId }`. Konto passes that `tripId` into the action. A second click for the same registry id does not call the action. A different id may be in flight on its own. Guest still does not render this component.

An intake `null` is `accepted`, then one refresh is requested. The accepted sentence is the existing `REGISTRY_TRIP_COPY.erfolg` only after the write returns `null`, not after refresh. New copy, in the allowlisted copy file, states the separate waiting and unclear refresh sentences, and the sentence that an unclear intake is not repeated. The UI never selects a new party row by label, country, count, or order. A registry list `problem` on a later render does not rewrite an already accepted intake into a failure. A source read failure before the click still uses the existing alert and does not call the action.

### 6.5 Focus

Each slot and each intake row has its own status region. A late completion focuses that region only when the preparation view is still mounted, the intent is still the latest interaction in that region, and the user has not typed, confirmed, or moved to another target since the click. Navigation away, a newer slot, and a remount do not move focus. The workspace's existing heading focus on mode change stays as it is.

### 6.6 Copy

`lib/traveller/account-registry-trip-copy.ts` gains only the intake sentences for accepted-but-not-yet-reread, refresh unclear, and no automatic repeat. `erfolg`, `pending`, empty, error, and limit stay distinct. Slot conflict, removal, unclear, and rejected sentences live next to the traveller card, not in the registry copy. No sentence claims a causal readback or a deleted headcount.

## 7. Ownership

Implementation, after plan acceptance and after the section 8 decision, may change only:

| Path | Role |
| --- | --- |
| `components/trips/Reisevorbereitung.tsx` | Traveller-card composition only. The card renders ledger state. Official and personal sections stay. |
| `components/trips/RegistryReiseUebernahme.tsx` | Controlled intake: per-source confirmation, pending, and honest feedback. |
| `components/trips/TripWorkspace.tsx` | Mount the new hook. Pass canonical observation and traveller props. No mode, plan, or personal-preparation rewrite. |
| `components/trips/useTripTravellerSnapshotLifecycle.ts` | New. React adapter: synchronous ref, one refresh after accept, frozen callbacks. |
| `components/trips/KontoArbeitsbereich.tsx` | Split traveller and intake write from refresh. Pass the captured `tripId`. Keep the locked `registryTripUebernahmeGesperrt(reise)` call and the raw `serverReise` canonical prop. |
| `components/trips/GastArbeitsbereich.tsx` | Same callback split for the guest writers and the existing guest reread. No registry UI. No new storage API. |
| `lib/readiness/trip-traveller-snapshot-workflow-1.ts` | New. Pure draft, payload, conflict, and intent rules. No React, router, or server action. |
| `lib/readiness/trip-traveller-snapshot-workflow-1.test.ts` | New. Pure cases, included by the existing `lib/**/*.test.ts` test script. |
| `lib/traveller/account-registry-trip-copy.ts` | The new intake sentences only. |
| `lib/traveller/account-registry-trip-ui.test.ts` | Unchanged unless a moved string makes an allowlisted UI-shape assertion obsolete. Domain assertions in section 9 stay. |
| `scripts/trip-traveller-snapshot-workflow-completion-1/**` | Local synthetic mount and CSS proof. |
| `docs/evidence/trip-traveller-snapshot-workflow-completion-1/**` | Later evidence. Not this commit. |
| `docs/JETNITY_TRIP_TRAVELLER_SNAPSHOT_WORKFLOW_COMPLETION_1_{STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-25.md` | Later delivery docs. Not this commit. |

These paths stay at their seed bytes:

- `lib/readiness/dokument-formular.ts` and `lib/readiness/dokument-formular.test.ts`
- `lib/readiness/reisende-aktionen.ts`, `reisende-gast.ts`, `reisende.ts`, `schema.ts`, `party.ts`
- `lib/traveller/account-registry.ts` and `account-registry-trip.ts`
- `lib/trips/gastspeicher.ts` and `lib/trips/daten.ts`
- `components/trips/EigeneReisevorbereitung.tsx` and `usePersonalPreparationLifecycle.ts`
- canonical trip types, server writers, RPCs, migrations, Auth, and RLS
- `package.json`, lockfiles, workflows, operating mode, and global continuity

`TripTravellerSnapshotEditor.tsx` is omitted on purpose. Moving the card markup would make frozen source assertions outside the allowlist fail for labels and `LandFeld`, which this lane cannot edit without a wider exception.

## 8. Allowlist exception for Technical-Lead decision

This plan does not apply the exception.

`check:exports` treats a name as used when it appears anywhere outside its own file. `check:dead` reaches `dokument-formular.ts` from `dokument-formular.test.ts` and from any remaining `dokumenteAusTraveller` or `neueDokumentClientRef` import. Stopping the runtime calls to `citizenshipClientRefFuer`, `dokumenteAlsPayload`, and `dokumenteNachCitizenships` does not by itself fail those two guards. No edit to `dokument-formular.ts` is requested.

Two frozen tests require those call names to remain as source text in `Reisevorbereitung.tsx`:

| File | Assertion | Why it blocks the P1 |
| --- | --- | --- |
| `lib/readiness/preparation-premium-experience-5.test.ts` | lines 134–135, `dokumenteAlsPayload` and `citizenshipClientRefFuer` | The save path must stop using both. |
| `lib/country/ui.test.ts` | lines 64–65, the same two names | Same source file. |

Both files are outside the TASK allowlist. Keeping the names in a comment, or calling the helpers and discarding the result, would make the assertions pass while hiding the P1. This plan does not do that.

Requested narrow exception, if the Technical Lead accepts it: change only those four assertions. They may require that `Reisevorbereitung.tsx` does not call `citizenshipClientRefFuer(` and does not call `dokumenteAlsPayload(`. Every other assertion in those tests stays, including `LandFeld`, no ISO free text, no `citizenships[0]` / `documents[0]`, the button labels, the layout classes, and the official-surface markers.

If this exception is denied, implementation stops. The P1 cannot be fixed inside the allowlist without failing those assertions or disguising the old calls.

No `package.json` exception is requested. `npm test` already loads `lib/**/*.test.ts` and will load the new pure test. It does not load `scripts/**`. The mounted runner is an explicit command in section 10. Adding it to the package script would be a frozen-file edit.

## 9. State and failure matrix

| Situation | Ledger | Writer calls | Visible result |
| --- | --- | --- | --- |
| Residence-only edit of a UUID citizenship with a linked passport | same citizenship ref, same document ref, same relation | one save | payload preserves both refs and the relation |
| Legacy `citizenship:RS` plus a second citizenship and two documents | each existing ref kept; a new row keeps the ref minted at creation | one save | no country-derived replacement |
| User removes one citizenship | only relations to that ref become `null` | one save after the edit | the other same-country row is not retargeted |
| Invalid country, duplicate country, duplicate ref, or dangling relation | draft kept | zero | error on that card |
| Blank untouched document row plus a residence edit | blank row omitted | one save | success copy does not claim that blank row was stored |
| Double Enter or save while remove is in flight, same slot | second intent ignored | one | one pending region |
| Two slots | independent intents | one each | one error does not clear the other |
| Callback returns a string | `rejected` | no retry | that string on that target |
| Callback throws or returns a non-string | `unclear` | no retry | unknown outcome; draft kept |
| Callback returns `null`, refresh still running | `accepted`, refresh requested | no second write | not described as observed |
| Refresh throws after `null` | write stays `accepted`, refresh `unclear` | no second write | not described as rejection |
| Later canonical fingerprint matches | `consistent` | none | match is not called a causal receipt |
| Clean canonical change | draft replaced | none | form matches the new slot |
| Dirty canonical change | draft kept, save disabled | none | reload or keep-my-edits |
| Stale success after a newer edit | new generation kept | none | old completion does not reset the form |
| Trip id changes | old ledger dropped | in-flight result discarded | no retry on the new trip |
| Section navigation | ledger kept in `TripWorkspace` | in-flight continues | status is there on return; focus is not stolen |
| Full `TripWorkspace` unmount | memory gone | none | no restored pending; this limit is stated in the UI only as the absence of recovery, not as a success |
| Named remove confirmed | one remove intent | one `travellerEntfernen` / `gastTravellerEntfernen` | slot can remain as an empty place; headcount copy does not say it shrank |
| Named remove cancelled | none | zero | focus returns to the remove button |
| Two registry rows, same label | intents keyed by registry `id` | the clicked id only | no row is chosen by label |
| Capacity becomes full before the server returns | in-flight continues | the one call already started | server string or accept; `voll` does not invent the result |
| Registry list `problem`, or `travellers == null` | no new intake | zero | existing error copy, distinct from empty |
| Intake `null` | `accepted`, then one refresh | no second materialization | no guessed new party row |
| Intake throws | `unclear` | no repeat | copy says it is not repeated |
| Cross-tab guest write or a second whole-graph guest save | unchanged guest contract | the existing storage writer only | not atomic and not claimed to be |

`party_loeschen` returns `ok` even when `deleted` is 0, and the action drops that count. The UI says the removal was accepted. It does not say a row count changed.

## 10. Proof plan

After acceptance, proof is synthetic and local. Stubbed actions, stubbed `router.refresh`, and guest `localStorage` are labeled as stubs. They are not hosted, RLS, Auth, or Production evidence.

Pure tests in `lib/readiness/trip-traveller-snapshot-workflow-1.test.ts`, run by the existing `npm test` on Node 22:

- The frozen `dokumenteAlsPayload` / `dokumenteNachCitizenships` path, called directly, still returns `citizenship:CH` and a null relation for citizenship ref `a1111111-1111-4111-8111-111111111111` and a passport that points at it. That assertion keeps the P1 visible. It does not edit the frozen helper or its fixture file.
- The new serializer preserves that UUID, the passport ref, and the relation on a residence-only change.
- Legacy refs, two citizenships, two documents, removal of one citizenship, an explicit relation change, and invalid or duplicate input. Duplicate input does not produce a payload.
- Clean and dirty canonical snapshots, target replacement, missing target, and trip-id change.
- Double save, save/remove race, string error, thrown and malformed results, stale success, stale error, stale completion, accepted-then-refresh-throw, and intake with two same-label ids. The pure tests drive the decision function twice without waiting for React.

Mounted proof in `scripts/trip-traveller-snapshot-workflow-completion-1/`, executed explicitly because `package.json` is frozen:

`node --import ./scripts/server-only-test-register.mjs --import tsx --test scripts/trip-traveller-snapshot-workflow-completion-1/*.test.ts`

The harness follows the existing esbuild-plus-Playwright page used by `scripts/trip-personal-preparation-workflow-completion-1/`. It mounts the real `TripWorkspace` wiring, the real card, and the real `RegistryReiseUebernahme`. It does not call private handlers as the proof of a click.

- Residence-only save: open the editor, change residence, submit with the form's Enter key, and record the payload. The payload is the preserved relation. A pointer click covers the same button.
- Legacy refs, two citizenships, two documents, citizenship removal, relation selection, and invalid or duplicate input through the real controls.
- Double Enter, save against remove, returned string, thrown callback, malformed return, stale completion, clean and dirty canonical props, slot replacement, and trip change.
- Intake of two same-label sources, `voll` changing before resolve, list `problem`, `travellers == null`, empty list, accepted before the next props, thrown intake, navigation to Reiseplan and back, and a full unmount that does not restore the intent.
- DOM pointer, keyboard, and form events. Tab order reaches the controls. Escape cancels removal. A late response does not move focus after a newer key.

CSS, in that same runner, at widths 320, 360, 390, 768, and 1280. At the narrow width, root font size is 32px. Cases include long labels, several child rows, the confirmation, the conflict, pending, and error. `scrollWidth` must not exceed the viewport because of this surface. The page must not set `overflow: hidden` to pass. `prefers-reduced-motion: reduce` is emulated. This lane adds no new animation. Screenshots go under `docs/evidence/trip-traveller-snapshot-workflow-completion-1/` with the head, command, exit code, Node version, and Playwright version.

Also run, and record honestly: the existing traveller, registry materialization/orchestration, personal-preparation, and workspace tests that `npm test` already includes; `npm run typecheck`; `npm run lint`; `check:dead`; `check:exports`; `check:deps`; `check:api-schutz`; `check:schema-bezug`; `npm run build`; `npm test`. Native App, Auth, and Vercel gates stay the existing ones. This lane does not edit them. Skipped work is not a pass. The two established conditional browser skips, 181 existing lint warnings, 11 untriaged advisories, guest cross-tab non-atomicity, and full-unmount loss stay limits.

`npm test` on CI will not re-run the Playwright script until a later allowlisted `package.json` change. The implementation report must say that in the evidence header.

## 11. Costs, security, and limits

No new dependency, provider, paid call, secret, migration, RLS change, or Auth change. No new recurring cost. The USD 100 monthly boundary is unchanged. Prelaunch and `noindex` stay.

The editor still sends only the existing label, residence, citizenship country, document type, issuer, expiry, and refs. It does not add a passport number, MRZ, biometric, or health field. Service role is not used. The integrity fix is that an unrelated residence edit no longer drops a document relation, and an uncertain registry intake is not repeated into a second fresh snapshot.

Not proved by this lane, even after the planned tests: hosted readback, SQL, RLS, Production data, a causal link between a `null` action result and a later prop, exactly-once writes, guest cross-tab atomicity, recovery after the workspace unmounts, native device or screen-reader behavior, and the frozen `travellerLegacyLesen` drop when some other caller bypasses this UI. A schema or versioned-mutation change is not required for the UI repair. If implementation finds that a correct save cannot be expressed with the current payload, it stops at that boundary instead of editing `schema.ts` or the RPCs.

#985/#982 and #917 stay STOP/HOLD with no alternate path. #913/#911, #968, #748, #626, #937/#936, and Bern #934 stay as they are. No Production, provider, secret, payment, legal, or launch action.

## 12. Stop

This document is the plan delivery. The next step is independent Technical-Lead review of the exact head that contains this file and the unchanged TASK. This session does not implement, does not add tests, does not run the audit, does not mark Ready, does not merge, does not close #1012, and does not write `main`.
