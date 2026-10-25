# Jetnity Trip Traveller Snapshot Workflow Completion 1 — PLAN

Date: 2026-10-25. Revision R2 of the plan for immutable TASK V1. This commit replaces only this file. TASK V1 stays byte-identical. No product code, test, script, or evidence is included.

Reviewed R1 head `a13bc1684a45a7fcf23fd265b49414d3f5196027`, tree `cf622a8535f3a5b144d3b1418d3a71d72e5e6e12`, plan blob `f34f53ae5e1368adff79c4711e7d45fa4a42ed5a`. Technical-Lead review R2 keeps T-R1.1 through T-R1.6 and T-EX1, and requires T-R2.1 through T-R2.3. P1 remains OPEN. This session stops again for a full plan re-review. The new head and plan blob are in the session reply, not in this file.

| Review id | Where this revision answers it |
| --- | --- |
| T-R1.1 | §6.1 final emitted citizenship refs; blank-country-linked-document counterexample |
| T-R1.2 | §6.3 `not_sent` / `unproven` / `accepted`; try/catch/finally; no automatic intake replay |
| T-R1.3 | §6.2 membership separate from fields; observation only after settlement |
| T-R1.4 | §6.3 one guest traveller write per trip; settled-trip ref; no replay |
| T-R1.5 | §6.4 one workspace controller, Konto render prop, audit node kept compiling |
| T-R1.6 | §10 mounted RED against the original editor, then the same assertion GREEN |
| T-R2.1 | §6.1 exact-ref preflight; no trim, cut, fallback, or collision collapse |
| T-R2.2 | §6.3 unresolved guest graph stays blocked until an explicit same-trip read |
| T-R2.3 | §6.4 the legacy node's existing `onUebernehmen` is the one captured writer |
| T-EX1 | §8 accepted for implementation only after a later explicit PLAN PASS; unchanged by R2 |

## 1. Identity

| Field | Value |
| --- | --- |
| Logical author | Jetnity Trip Traveller Snapshot Workflow Completion 1 — Cursor Generation 1 |
| Requested model | Grok 4.7 High Fast / `grok-4.7-high-fast` |
| Actual `originalModelName` | `grok-4.7-high-fast` |
| Session | https://cursor.com/agents/bc-5d06d92d-a371-4889-b29c-f03a9b6c85d0 |
| Session id | `bc-5d06d92d-a371-4889-b29c-f03a9b6c85d0` |
| UI rename | The rename tool returned the title `Jetnity Trip Traveller Snapshot Workflow Completion 1 — Cursor Generation 1` for this `bcId`. The R2 run-info read the same `bcId`, the same title, and `originalModelName` `grok-4.7-high-fast`. That is this session's tool result. It is not an independent Technical-Lead observation of the agents list. |
| Branch | `feat/r107-trip-traveller-snapshot-workflow-1` |
| Draft PR | #1017 |
| Tracking | #1012 |
| Batch | #1011 |
| Canonical index | #751 R107 V2, re-read with the first plan |
| Lane | R107-T |
| Machine mode | `NORMAL` (`.jetnity/operating-mode.json`, re-read with the first plan) |

The requested model is the attested runtime model from this same run. This revision does not use Auto or another model.

## 2. Exact baseline re-read this session

`git fetch origin main` completed again before this revision was written.

| Ref | SHA |
| --- | --- |
| `origin/main` | `a74c443c6be3f064f150fcf021ab6154bda325e5` |
| `origin/main` tree | `c1fe5a50b0da710ef425674057f782b1dff6f8bc` |
| Seed head | `25d70d62d78cc44bf96d15c261ca566f03ec1268` |
| Reviewed R1 head | `a13bc1684a45a7fcf23fd265b49414d3f5196027` |
| Reviewed R1 tree | `cf622a8535f3a5b144d3b1418d3a71d72e5e6e12` |
| Reviewed R1 plan blob | `f34f53ae5e1368adff79c4711e7d45fa4a42ed5a` |
| Seed parent / merge-base | `a74c443c6be3f064f150fcf021ab6154bda325e5` |
| TASK blob | `75c59b0851d835560ff4b5562e9fcc52c395b2ad` |
| Ahead / behind before this revision | 3 ahead / 0 behind |
| Operating-mode blob | `1912bf56751a940acc56fad84e2bf9e6a174e0fa` |
| Diff before this revision | TASK plus the reviewed plan only |

No new main drift. `origin/main` is still the dispatch SHA. This revision does not rebase or merge. The commit that replaces this file is the next head. That head, its tree, the new plan blob, and the resulting ahead/behind are in the session reply.

Live index [#751](https://github.com/Jetnity/jetnity/issues/751) top section, re-read with the first plan, is R107 V2. This lane is still PLAN ONLY. `JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md` still open on the R106 closure pointer. Those paragraphs are historical. Live main, live mode, #751, and #1011 supersede them. This plan does not edit those Technical-Lead-owned files.

Integration remains **T → S → D → W → M**. This lane does not read or edit sibling branches. If `origin/main` moves past `a74c443c6be3f064f150fcf021ab6154bda325e5`, implementation stops until the Technical Lead gives an explicit same-session sync instruction.

## 3. Startup reads

These reads bind the existing rules. They do not add a product decision.

| Document | What applies here |
| --- | --- |
| `.jetnity/operating-mode.json` | `mode` is `NORMAL`. Re-read with the first plan. |
| TASK V1 | Immutable scope, P1, allowlist, proof, and stop. Blob matches the dispatch. |
| `JETNITY_START_HERE.md`, `docs/ACTIVE_WORK_STATUS.md` | Historical R106 pointer. Live writer index is #751. Neither file is edited. |
| `AGENTS.md` | The trip graph stays the source of truth. Empty stays distinct from error. No new provider, secret, or schema. |
| `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md` Phases F–H | The same session applies CHANGES REQUIRED and stops. Self-review is not PASS. A new head invalidates the previous plan gate. |
| `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md` and slice planning standard §§1–5 | One writer on this branch. #1011 already fixed five disjoint lanes and integration T → S → D → W → M. |
| `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md` §1 | Live evidence wins. #751 and #1011 were re-read with the first plan. |
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

This plan is source reading plus live git and GitHub reads. It is not mounted UI behavior, not a local test run, and not hosted, CI, RLS, or database proof. The existing Vercel preview deploys the unchanged editor. It is not acceptance of this repair. No hosted data was read. This revision does not run the RED or GREEN proof. Section 10 only specifies that later sequence.

The P1 below is the relation-loss path #1011 already reproduced with the pure helpers. This plan confirms that path in the current source. A pure helper call is not the mounted RED evidence T-R1.6 requires.

Local `node -v` at the first plan read was `v22.23.4`, which is inside `package.json` `engines.node` `22.x`. That version is not a test result.

## 5. Source-confirmed gaps

Assigned source at the seed head, re-checked against the reviewed plan head. The editor bytes are unchanged.

1. **P1, country identity replaces the citizenship ref.** `ReisendenKarte` stores citizenships as country strings (`components/trips/Reisevorbereitung.tsx` lines 690–692). Submit keeps only `/^[A-Z]{2}$/` codes and sets `clientRef: citizenshipClientRefFuer(countryCode)` (lines 711–718). The relation control collapses countries with `new Set` and uses the same country-derived value (lines 837–840). `citizenshipClientRefFuer` returns `` `citizenship:${country}` `` (`lib/readiness/dokument-formular.ts` lines 20–22). `dokumenteAlsPayload` calls `dokumenteNachCitizenships`, which keeps a relation only when it is one of those country refs and otherwise sets `null` (lines 47–63 and 66–76). An imported UUID such as `a1111111-1111-4111-8111-111111111111` is therefore replaced by `citizenship:CH`, and a passport that pointed at the UUID is submitted with `citizenshipClientRef: null`, even when the country did not change. Removing a citizenship row calls the same country filter (lines 747–750), so it cannot clear only the removed row.
2. **Document read is already identity-preserving.** `dokumenteAusTraveller` copies `clientRef` and `citizenshipClientRef` (lines 38–44). The loss is on the way back to the payload, not on the read. New document rows already use `neueDokumentClientRef` (Reisevorbereitung lines 864–868). That helper stays the allocator for a new document. An empty document list asks it for a fresh blank row on every call (dokument-formular lines 27–35), so a blank row must be allocated once in the draft and not re-minted on each render.
3. **One-time field state ignores later canonical props.** Residence, citizenships, and documents are `useState` initializers (lines 689–695). There is no later adoption and no conflict. The summary reads the live slot (lines 630–633) while the form keeps the first snapshot. `TripWorkspace` already receives `readinessKanonischeReise` and its comment says only personal preparation observes it (lines 264–266 and 372–380). Account `KontoArbeitsbereich` passes the raw server trip there (`readinessKanonischeReise={serverReise}`) and separately displays `bestaetigt.graph` when that object is still the basis. Traveller save does not participate in either observation.
4. **Save and remove have no owned in-flight or exception boundary.** Submit and remove `await` the callback and, on a string, call the shared `onFehler` (lines 708–722 and 893–896). There is no `try/catch`, no operation generation, and no synchronous guard. The submit button is not disabled before the next render, so two Enter submissions in one turn can both pass. Remove is one click, with no named confirmation.
5. **Errors are shared by every card.** One `meldung` state (line 119) is passed as `onFehler={setMeldung}` to every slot (line 256). A failure on one person replaces the message for the section. Readiness-item failures use that same state and stay there. Traveller outcomes must leave it.
6. **The preparation surface unmounts on ordinary section navigation.** `Reisevorbereitung` is created only while `modus.ansicht === 'vorbereitung'` (`TripWorkspace.tsx` lines 694–709 and 979–999). `TripWorkspace`, `KontoArbeitsbereich`, and `GastArbeitsbereich` stay mounted across Übersicht, Reiseplan, Organisieren, and Vorbereitung. Card state and the intake's `useState` die on that navigation. Full unmount of `TripWorkspace` is a separate, explicit limit.
7. **Registry intake is a precomposed node with its own ledger.** `TripWorkspace` accepts `registryUebernahme?: React.ReactNode` (line 282) and passes that node through (line 702). `KontoArbeitsbereich` builds the element, including `onUebernehmen`, before `TripWorkspace` exists (lines 197–214). `RegistryReiseUebernahme` keeps confirmation, one shared `useTransition`, and one `status` in its own `useState` (lines 35–49). `null` becomes `REGISTRY_TRIP_COPY.erfolg` immediately. `KontoArbeitsbereich` returns that `null` only after `registryTravellerInReiseUebernehmen` and `router.refresh()` (lines 203–211). A throw from refresh, or a throw after the write was accepted, rejects the whole callback. There is no `try/catch`. The same combined shape is used for `onTravellerSetzen` and `onTravellerEntfernen` (lines 183–196). `components/trips/TripWorkspaceAuditClient.tsx` lines 109–117 also pass a precomposed `RegistryReiseUebernahme`. That file is outside the allowlist and must keep typechecking.
8. **A returned string does not prove that nothing was stored.** Account `party_schreiben` / `party_loeschen` failures become `meldungAus(...)` strings (`lib/readiness/reisende-aktionen.ts` lines 53–56 and 88–92; `lib/trips/anlegen.ts` lines 54–70). Guest `gastTravellerSetzen` / `gastTravellerEntfernen` call `gastreiseSpeichern` (`lib/readiness/reisende-gast.ts` lines 23–33). `gastreiseSpeichern` may throw from `reiseLesen` before `schreibenMuss`, or from `schreibenMuss` after `schreibenVersuch` has already executed `localStorage.setItem` (`lib/trips/gastspeicher.ts` lines 394–413 and 715–727). `GastArbeitsbereich` catches and returns `error.message` (lines 275–291). Those strings are not parsed. A string is not a proven rejection and is not a safe automatic retry.
9. **Guest traveller writes replace the whole supplied graph.** `gastTravellerSetzen` filters `partyVon(reise)` and spreads that same `reise` into `gastreiseSpeichern` (reisende-gast lines 10–26). The guest callbacks close over the render `reise` (GastArbeitsbereich lines 275–291). Two different-slot callbacks started before React adopts the first `setReise` can both write that stale graph. Account `travellerSetzen` sends one traveller to `party_schreiben` (`reisende-aktionen.ts` line 75). That RPC upserts the submitted `client_ref` and does not delete other party rows (`supabase/migrations/20260822160000_traveller_context_intelligence.sql` lines 309–347). Account different-slot concurrency is a different contract from the guest whole-graph write.
10. **A removed profile and an empty placeholder can share a ref and empty fields.** `party_loeschen` deletes one `trip_travellers` row and does not update `trips.travellers` (`supabase/migrations/20260828015304_traveller_write_contract_integrity.sql` lines 142–149). `travellerSlots` still renders that headcount. A missing party row becomes `slotAus(..., null, true)`, and `persisted` is `Boolean(traveller)` (`lib/readiness/party.ts` lines 89–108 and 120–127). Guest removal filters `party` and leaves `travellers` on the spread trip (`reisende-gast.ts` lines 29–33).
11. **Materialization mints fresh ids. The UI must not rediscover them.** `tripSnapshotMaterialisierungErzeugen` allocates a new traveller, citizenship, and document identity and remaps by source ref (`lib/traveller/account-registry-trip.ts` lines 147–171). The action result is `{ ok: true, wert: null }` (`reisende-aktionen.ts` lines 145–148). A later party list cannot be matched by label, country, count, or order. Two registry rows may share a label; the list key is already `traveller.id` (RegistryReiseUebernahme line 118). That key must remain the intent id.
12. **The frozen writer can drop a row or a relation and still succeed.** `travellerEingabeSchema` runs `travellerLegacyLesen` inside the transform before `superRefine` (`lib/readiness/schema.ts` lines 261–313). `travellerLegacyLesen` skips a citizenship with no readable country, skips a repeated country and a repeated document `clientRef`, and nulls a relation whose ref is not in the kept citizenship set (`lib/readiness/traveller-kontext.ts` lines 149–166 and 217–229). Checking a document against the draft refs, then omitting a blank citizenship row, lets that relation pass the draft check and be nulled by the transform. The client must reject against the refs that will actually be emitted.
13. **The frozen reader also rewrites child refs before that drop.** `clientRefLesen` trims, cuts to 64 characters, and otherwise uses the fallback (`traveller-kontext.ts` lines 40–45). A citizenship ref falls back to `` `citizenship:${countryCode}` `` (line 151). A document ref falls back to `` `document:${documentType}:${issuing ?? 'xx'}` `` (line 189). A relation is trimmed and cut, or becomes `null` when the trimmed string is empty (lines 185–188). A padded, blank, or overlength ref can therefore collide with an exact UUID or legacy ref. The client must reject that input before the writer and must not repair it.

Limits that stay: 8 citizenships and 12 documents (`TRAVELLER_CONTEXT_GRENZEN` in `lib/readiness/domain.ts`). `READINESS_GRENZEN.clientRef` is 64. Party slots max 20. No passport number, MRZ, biometrics, health, or file field exists on this surface. None is added. The account-registry UI test already forbids `citizenships[0]`, `documents[0]`, `selected`, `checked`, and `type="radio"` in the intake. Those absences stay. `REGISTRY_TRIP_COPY.erfolg` must remain a source identifier in `RegistryReiseUebernahme.tsx` because `account-registry-trip-ui.test.ts` requires that text. It is shown only for `accepted`.

## 6. Design

The repair is a trip-snapshot draft and a small intent ledger. It is not a second writer, not a change to materialization, and not a generalization of `usePersonalPreparationLifecycle`. The new module does not import the personal-preparation workflow.

### 6.1 Draft rows and final emitted graph (T-R1.1, T-R2.1)

A citizenship row is `{ clientRef, countryCode, origin }` where `origin` is `loaded` or `created`. A document row is the existing `DokumentFormularZeile` plus the same `origin`: stable `clientRef`, type, issuer, expiry, and `citizenshipClientRef`. `loaded` means the row was copied from the canonical traveller. `created` means this draft allocated it. A user edit does not change `loaded` into `created`.

- A `loaded` row keeps its `clientRef` exactly, whether it is a UUID or a legacy `citizenship:CH` / `document:…` ref. Changing the country, issuer, type, or expiry does not allocate a replacement ref.
- A `created` row allocates one ref at creation and keeps it across edits, conflict resolution, and retries. A new citizenship ref is `citizenship:` plus one `crypto.randomUUID()`, length under 64. It is not `citizenshipClientRefFuer(country)`. A new document ref remains `neueDokumentClientRef()`.
- The relation select's option value is that row's `clientRef`, including a still-blank created citizenship row. The visible label is `landAnzeigeText(countryCode)` when the country is readable, otherwise a non-country placeholder that is not submitted as a country. Countries are not collapsed with `new Set`. The submitted value stays the ref.
- Deliberate removal of one citizenship row edits the draft before serialization. It sets `citizenshipClientRef` to `null` only on documents that pointed at that removed ref. A document pointing at a different ref with the same country stays pointed at that ref. The emitted `null` is that explicit draft value. The serializer does not null any other relation and does not retarget one.

A supplied ref is exact only when it is a string, its length is from 1 through 64, it equals its own trim, and it therefore equals what `clientRefLesen` would return for it. The serializer compares against that result. It does not trim, cut, or substitute a fallback into the draft or the payload. `null` is an exact relation only when the draft already holds `null`, including after deliberate removal. The traveller `clientRef` submitted with the payload must be exact under `clientRefLesen(ref, '')`. Ordinary `traveller:N` slot refs already are. A padded traveller ref is `not_sent` and is not trimmed onto another profile.

Serialization builds the payload in this order. It does not call the writer when it returns `not_sent`.

0. **Exact-ref preflight.** For every citizenship row that is not an untouched blank `created` row, reject a missing, blank, whitespace-only, padded, or overlength `clientRef`. The same rule applies to every document row that is not an untouched blank `created` row, and to every relation that is not already `null`. A `created` ref minted by this draft is exact by construction, so an untouched blank created row can still be omitted later. A loaded or edited row that fails this check is not omitted and is not repaired. Then compute the image `clientRefLesen` would produce for every supplied citizenship ref, using `` `citizenship:${countryCode}` `` as the fallback the frozen reader uses, and for every supplied document ref, using `` `document:${documentType}:${issuing ?? 'xx'}` ``. For a non-null relation, the image is the trimmed string cut to 64 characters, or `null` when that trim is empty. If two different supplied strings share one image, the result is `not_sent`. The exact row is not kept as the survivor, and the image is not emitted. Every invalid row and relation stays visible with the supplied characters.
1. **Classify citizenship rows.** An untouched `created` row whose country is still empty may be omitted, but only if step 3 finds no document relation still pointing at its ref. A `loaded` row with a blank or illegal country is existing or malformed persisted data: it is not omitted, the ref stays, and the result is `not_sent`. A `created` row whose country is non-empty and illegal is `not_sent`. A `created` row the user filled and then cleared is not an untouched empty row; it is `not_sent` rather than a silent omission.
2. **Build the emitted citizenship-ref set** from the rows that will actually be in the payload. Omitted untouched blank rows are not in that set. Rows rejected in step 0 or step 1 produce no payload at all.
3. **Classify documents against that emitted set.** Omit only an untouched `created` document row with no type, no issuer, no expiry, and no relation. A `loaded` document that is missing a type or is otherwise illegal is not omitted; the result is `not_sent`. A non-null `citizenshipClientRef` must be a member of the emitted set. If it points at a blank `created` citizenship that step 1 would have omitted, the result is `not_sent`: both rows and the relation stay in the draft. The serializer does not drop that citizenship, does not null the relation, and does not point the document at another row.
4. **Then reject duplicates of already exact refs.** A duplicate country, a duplicate exact citizenship ref, or a duplicate exact document ref is `not_sent`. The duplicate-country sentence is the existing schema sentence `Dieselbe Staatsbürgerschaft kann nur einmal erfasst werden.` A relation that is neither exact `null` nor an exact member of the emitted set is `not_sent`, using the existing schema sentence `Das Dokument muss zu einer Staatsbürgerschaft derselben Person gehören.`

Counterexamples, required in the pure test and named in the mounted suite where a control can produce them:

- The user adds a citizenship row, leaves its country empty, and sets a document's relation to that row's fresh ref. Serialization returns `not_sent`. The writer is not called. The blank row, the document, and the relation remain. The frozen transform is not given a chance to omit the row and null the relation.
- Citizenship ref `" citizenship:CH"` beside an exact `citizenship:CH`. Both rows remain. The padded ref is not trimmed onto the legacy ref.
- Two citizenship refs longer than 64 characters that share the same first 64 characters and differ afterwards. Neither is cut. No payload is emitted.
- A missing or blank citizenship `clientRef` with country `CH`. The frozen reader would substitute `citizenship:CH`. The row stays blank, including when another row already has that exact legacy ref.
- A missing document `clientRef` on a passport issued by `CH`. The frozen reader would substitute `document:passport:CH`. That substitute is not emitted.
- A relation that is the exact citizenship ref with a leading space, or a string longer than 64 whose first 64 characters equal an emitted citizenship ref. It is not trimmed or cut into a link.
- A whitespace-only relation. It is not emitted as `null`. An explicit `null` from deliberate removal still is.
- An exact UUID `a1111111-1111-4111-8111-111111111111`, an exact `citizenship:CH`, and an exact `document:…` ref of length 1 through 64 with no surrounding whitespace pass unchanged.

The payload still goes through the existing `travellerSetzen` or `gastTravellerSetzen`. Those functions stay the writers. The client pre-check does not replace their validation. It stops a silent drop from being shown as success. `schema.ts`, `traveller-kontext.ts`, and the RPCs stay unchanged.

`dokumenteAusTraveller` remains the read mapper for an existing document list. `dokumenteAlsPayload`, `dokumenteNachCitizenships`, and `citizenshipClientRefFuer` are not on the save or removal path. `lib/readiness/dokument-formular.ts` and its test stay byte-identical. Section 8 records the accepted later test edit.

### 6.2 Canonical presence and observation (T-R1.3)

`useTripTravellerSnapshotLifecycle` is called from `TripWorkspace`, beside the personal-preparation hook. The ledger lives in a ref that is updated synchronously, with React state as the display copy. The same lifetime already keeps personal-preparation intents across the preparation unmount. This hook's state is traveller drafts, slot save/remove intents, and registry-intake intents for this mounted workspace. It does not import or generalize the personal-preparation hook.

The ledger key is `tripId`. A different `reise.id` replaces the ledger. An in-flight callback that finishes for the old id does not write status onto the new trip and does not start itself again.

Drafts and intents are keyed by traveller `clientRef` or registry `id`, not by slot index, label, country, or array position. `TripTravellerSnapshotEditor.tsx` is not added. The visible card stays `ReisendenKarte` inside `Reisevorbereitung.tsx`, so the existing source contracts for `LandFeld`, the button labels, the layout classes, and the official-surface markers remain in that file. The card becomes a controlled view of one ledger entry. Official Truth, the checklist, and `EigeneReisevorbereitung` keep their current props and markup.

Account observation uses the raw `readinessKanonischeReise` when it is passed. Guest observation uses the guest `reise` prop, which for a guest is the device trip. The traveller summary and the draft baseline use that same object. Display `bestaetigt.graph` is not the traveller observation source. The rest of `Reisevorbereitung` continues to read the workspace `reise` for readiness items and official evaluations. The TripWorkspace comment that says only personal preparation observes the canonical prop is updated to include this traveller observation. The prop's source in Konto stays `serverReise`. The personal-preparation wiring test continues to see `readinessKanonischeReise={serverReise}` and continues not to see `readinessKanonischeReise={bestaetigt`.

Each canonical delivery gets a monotonic delivery number for that trip, starting when the hook mounts. A new object or a changed membership/field snapshot increments it. The number is an observation clock. It is not a server revision and not a proof of freshness.

The field snapshot for one traveller is label, residence, citizenship `{clientRef, countryCode}`, and document `{clientRef, documentType, issuingCountryCode, expiresOn, citizenshipClientRef}`. Order is not part of the comparison, because the frozen reader sorts. Membership is stored beside that snapshot, not inside it: `present` when the raw party contains that `clientRef`, `absent` when it does not. `persisted: false` on a `traveller:N` placeholder is `absent` even when the placeholder ref and the empty fields equal a saved blank profile.

- **Clean draft, membership still `present`, fields changed:** replace the draft from the canonical slot, including the child refs and relations that arrived together.
- **Dirty draft, membership still `present`, fields changed:** keep the draft, show a conflict on that card, and do not submit. The choices are **Neu laden** (discard the draft and show the canonical slot) and **Meine Eingaben behalten** (keep the draft and record the seen membership plus field snapshot). Save stays disabled until one of those choices. A later Save after **Meine Eingaben behalten** is a new explicit intent. A prop update never submits.
- **Membership becomes `absent`:** the placeholder is not the saved profile. A removed saved profile does not become a fresh-save target because `traveller:1` and empty fields match. Save stays disabled. **Meine Eingaben behalten** does not enable a write onto that placeholder. The card says the saved details for this trip slot are no longer present, the headcount place remains, and the Account Registry person was not deleted. **Entfernen bestätigen** is not offered again for an already absent profile. The explicit re-entry control is separate: **Angaben für diesen Platz neu erfassen**. Only that control starts a new draft generation whose later Save may create a profile at that ref. The copy on that Save says it creates details for this trip slot again. Until that control is used, the writer is not called.
- **A placeholder that was `absent` for the whole observed life of this workspace,** and for which this ledger has no `present` baseline, remains the ordinary empty slot. Its first Save is a normal create. The removed-profile rule applies to a `present` → `absent` transition, including a draft or in-flight intent whose baseline membership was `present`.

If the canonical trip no longer has a slot for that ref at all, the draft is not applied to another slot. A pending result for a missing target stays on the ledger as unattached and is not focused.

Observation of a write starts only at settlement. When the callback returns `null`, the intent records `readbackAfterDelivery` as the current delivery number. A delivery whose number is less than or equal to that value is pre-settlement for this intent, even if its fields match the submitted snapshot. It does not move the intent to `consistent`. Only a later delivery may be compared. A match of membership `present` plus every submitted field on that later delivery is `consistent`. That word means the loaded slot supports the submitted snapshot. It does not mean the click caused the row, that the write happened once, or that the delivery is fresh. A later delivery that differs, while the draft generation is still the submitted one and the draft is clean, shows that the loaded slot differs and does not mark `consistent`. A dirty draft is kept, and a stale submission stays blocked until the explicit conflict choice above. A newer draft generation ignores stale success, stale error, and stale completion.

### 6.3 Slot save, remove, and guest admission (T-R1.2, T-R1.4, T-R2.2)

Each intent records `tripId`, traveller `clientRef`, draft generation, and operation generation. Serialization of the payload and the writer invocation sit in one synchronous try/catch/finally owned by the hook. The ref records the occupied key before any `await` and before the writer function is entered. `writerEntered` stays false until that function is actually called.

Release in `finally` is bound to `tripId` + target + operation generation. A completion whose key is no longer the current occupy does not clear the newer occupy and does not overwrite status. Trip change uses the same rule: the old completion does not write the new trip and does not release the new trip's occupy.

Account and guest do not share one concurrency rule.

- **Same target, either surface.** A second save, a save while remove is in flight, or a remove while save is in flight, for the same `clientRef`, does not call the writer. The second attempt is `not_sent` on that target. Its payload is not queued and is not replayed.
- **Account, different targets.** Another slot may have its own in-flight save or remove. `travellerSetzen` submits one traveller, and `party_schreiben` upserts that `client_ref` without deleting the other party rows. This UI does not add an account-wide queue. It also does not claim that two account writes are one transaction.
- **Guest, any other traveller target.** The occupy key is the trip, not the slot. `gastTravellerSetzen` and `gastTravellerEntfernen` serialize the entire supplied trip. While one guest traveller save or remove is in flight, a save or remove for a different slot does not call the writer. That attempt is `not_sent` only on the clicked target. The visible sentence is that another save or removal for this trip is still finishing. The clicked draft stays. The payload is not queued and is not submitted when the first write settles. A later explicit click is a new intent.

Guest settled-trip ref, inside allowlisted `GastArbeitsbereich` only. The frozen `gastreiseSpeichern`, `schreibenVersuch`, `schreibenMuss`, and `aktiveV3GastreiseLesen` functions stay unchanged. No new storage query is added.

- The adapter keeps a ref of the latest known-safe guest trip. Traveller callbacks read that ref. They do not close over the render `reise`.
- The ref is replaced only in two cases. A traveller callback returned `null`: the ref becomes the trip object returned by `gastTravellerSetzen` or `gastTravellerEntfernen`, and that same object is what `setReise` receives. Or the explicit reconciliation below returned `{ art: 'success', reise }` for this same `tripId`.
- A string, throw, rejection, or malformed fulfillment after the traveller writer was entered does not replace the ref. `schreibenVersuch` can already have executed `localStorage.setItem` before the readback fails and `schreibenMuss` throws. The hook records the trip as `unresolved`. Releasing the in-flight occupy is not re-arming. Save and remove for every slot on that trip stay blocked. The second attempt is `not_sent` on the clicked target, its draft and message stay, and its payload is not stored for later.
- Reconciliation is one explicit control on the affected trip. It calls the existing `onReadinessAktualisieren` path, which already calls `aktiveV3GastreiseLesen(tripId)` and does not write. Only `art === 'success'` with `reise.id === tripId` replaces the ref, clears `unresolved`, and allows a later deliberate traveller click. `missing`, `invalid`, `unreadable`, `wrong_trip`, a throw, or a success for another id leaves the latch closed and leaves the ref unchanged. The read does not submit a draft. Returning to Vorbereitung does not call it, and neither that return nor this read replays a payload.
- A later deliberate save or remove, after that successful read, uses the ref from the read. The proof requires that this graph still contains the first write's effect.
- Other guest operations are not placed behind this latch and are not proved atomic with it. Cross-tab `localStorage` atomicity stays unproved and out of scope. Account `unproven` does not use this latch, because `party_schreiben` upserts the submitted traveller and does not replace the whole party from the React graph.

Enter in the save form submits that form only. The remove control stays `type="button"` outside the save form. Remove asks for a named confirmation first. The copy names the slot label and says this deletes the saved details for this trip slot, the headcount stays, the empty slot remains, and an Account Registry person is not deleted. Cancel focuses the remove button and does not call the writer. Confirm sends the existing remove callback for that `clientRef` only. There is no `window.confirm`.

The callback result is classified only after the boundary knows whether the writer function was entered. No German sentence is parsed. The frozen writer and schema are not changed to manufacture a richer result.

| Boundary result | Recorded state | What the UI does not do |
| --- | --- | --- |
| Serializer or admission failure before the writer function is called | `not_sent` | no transport claim, no automatic retry; the draft stays editable |
| Throw from this hook's own serializer before the call | `not_sent` | the writer was not entered; this is not described as a stored or rejected write |
| Callback returns a string | `unproven` | the string is not called a rejection; copy does not say nothing was saved; no automatic retry |
| Synchronous throw, rejected promise, or a fulfillment that is neither a string nor `null`, after the writer function was entered | `unproven` | no rollback, no automatic retry, no success |
| `null` | `accepted` | not an observed slot and not exactly-once |
| Refresh throws after `null` | write stays `accepted`, refresh `unclear` | the write is not repeated |
| Stale completion | no status write, no release of a newer occupy | the old result does not reset the current draft |

`unproven` means the attempt is not known to be uncommitted. Account RPC strings have no client-side commit certainty. A guest string can follow `localStorage.setItem` plus a failed readback, or a throw from validation before the write. Both stay `unproven` because the UI does not infer which one happened. For a guest traveller write, that `unproven` result also leaves the trip graph unresolved, as specified above. Registry intake `unproven` is never replayed by the ledger, by refresh, by section return, or by remount. A later explicit confirm is a new user intent. Its copy says a second takeover can create another snapshot if the first one landed, because materialization mints a new snapshot.

After `accepted`, the hook requests one refresh. Account refresh is `router.refresh()` and returns only that the refresh was requested. Guest refresh is the existing `onReadinessAktualisieren` read. That second call is outside the writer invocation. A throw there does not change `accepted` into `unproven` and does not repeat the write. The observation rule in §6.2 is the only path from `accepted` to `consistent`.

### 6.4 Registry controller wiring (T-R1.5, T-R2.3)

There is one intake ledger, the workspace hook. `RegistryReiseUebernahme` does not keep a second confirmation, pending, or outcome ledger when it receives the controller.

`TripWorkspace` gains an optional render prop and keeps the existing node prop:

- `registrySteuerung?: (steuerung: TripTravellerIntakeSteuerung) => React.ReactNode`
- `registryUebernahme?: React.ReactNode` stays, so unlisted `TripWorkspaceAuditClient.tsx` still typechecks with the precomposed node.

`TripTravellerIntakeSteuerung` is a narrow object from the hook: `anfordern(registryTravellerId)`, the current per-id confirmation / pending / outcome, and a ref the view assigns. It is not a generic form framework.

Product Konto uses only the render prop. It does not also pass `registryUebernahme`. The render prop closes over the current registry list, `voll={registryTripUebernahmeGesperrt(reise)}`, and a writer function. Those two source expressions stay in `KontoArbeitsbereich.tsx` because `account-registry-trip-ui.test.ts` locks them. `router.refresh()` also stays in that file for the other account callbacks. Guest still does not render `RegistryReiseUebernahme`.

The writer function's argument is the captured pair `{ tripId, registryTravellerId }`. On click, the hook reads `tripId` and the writer ref synchronously, stores that function on the intent, and only then awaits it. Unmount and section navigation do not cancel that promise and do not start it again. Konto's writer calls `registryTravellerInReiseUebernehmen` with that captured pair and returns `null` only when the action result is `{ ok: true }`. It does not call `router.refresh()` inside that writer. A string return is `unproven`, and the component does not show `REGISTRY_TRIP_COPY.erfolg` for it. The hook requests refresh only after `accepted`.

During render, `RegistryReiseUebernahme` assigns the `onUebernehmen` prop it actually received onto the controller's writer ref. That assignment replaces the previous function. It does not append a second writer and it does not call the function. When `steuerung` is present, the component does not use `useState` or `useTransition` for confirmation, pending, or outcome, so the old direct call path cannot also run. It still renders the existing copy keys. `REGISTRY_TRIP_COPY.erfolg` remains in the source and is rendered only for ledger state `accepted`. List keys stay `traveller.id`. The same label on two rows stays two rows. No radio, no default row, no `citizenships[0]` or `documents[0]`. The existing `useState(travellers` absence stays.

If a caller passes the old node and not the render prop, `TripWorkspace` mounts that node once through `cloneElement`. The added props are the same hook `steuerung` and the workspace `tripId`. `onUebernehmen` is left as the function already on the element. For `TripWorkspaceAuditClient.tsx` that function is the frozen `async () => null`. The component registers that same function on the controller ref. On confirm, the hook reads the ref synchronously, stores that function on the intent, and invokes it once with the captured `{ tripId, registryTravellerId }`. The audit stub ignores the argument and returns `null`. The hook does not substitute its own writer and does not call the stub again. `TripWorkspaceAuditClient.tsx` is not edited. If both the render prop and the node are passed, only the render prop is mounted, so the product writer and the audit stub are not both called. The mounted proof counts one stub invocation on the legacy node and one product-writer invocation on the Konto path.

The server orchestration remains the capacity check. The `voll` flag only blocks a new click. It does not cancel an in-flight intake and it does not convert a string into success. A second click for the same registry id does not call the action. A different registry id may be requested only after the in-flight intake settles; it is not automatically started. A registry list `problem`, or `travellers == null`, stays distinct from an empty list and does not rewrite an already `accepted` intake.

### 6.5 Focus

Each slot and each intake row has its own status region. A late completion focuses that region only when the preparation view is still mounted, the intent is still the latest interaction in that region, and the user has not typed, confirmed, or moved to another target since the click. Navigation away, a newer slot, and a remount do not move focus. The workspace's existing heading focus on mode change stays as it is.

### 6.6 Copy

`lib/traveller/account-registry-trip-copy.ts` gains only the intake sentences for waiting after `accepted`, refresh unclear, outcome not known, and no automatic repeat. The not-known sentence does not say the takeover was rejected or that nothing was stored. A later explicit confirm uses a sentence that a second takeover can create another snapshot if the earlier one landed. `erfolg`, `pending`, empty, error, and limit stay distinct. `erfolg` is shown only for `accepted`.

Slot conflict, removal, membership loss, explicit re-entry, `not_sent`, and `unproven` sentences live next to the traveller card, not in the registry copy. The `unproven` sentence says the outcome is not known, the entered details stay on the card, and this attempt is not repeated by itself. On a guest trip it also says that another traveller save or removal stays blocked until the stored trip is loaded, and it offers that load as its own action. The load sentence does not say the blocked payload will be sent. It does not say "nothing was saved" and it does not say "rejected". No sentence claims a causal readback or a deleted headcount.

## 7. Ownership

Implementation, after a later explicit PLAN PASS, may change only:

| Path | Role |
| --- | --- |
| `components/trips/Reisevorbereitung.tsx` | Traveller-card composition only. The card renders ledger state. Official and personal sections stay. |
| `components/trips/RegistryReiseUebernahme.tsx` | Controlled intake when `steuerung` is present. Register the received `onUebernehmen` on the one controller. Existing copy keys stay. No second outcome ledger and no replacement writer. |
| `components/trips/TripWorkspace.tsx` | Mount the new hook. Pass canonical observation and the render prop. For a leftover node, `cloneElement` adds the controller and `tripId` and keeps that node's `onUebernehmen`. No mode, plan, or personal-preparation rewrite. |
| `components/trips/useTripTravellerSnapshotLifecycle.ts` | New. React adapter: synchronous occupy, serialization and invocation in one try/catch/finally, one refresh after `accepted`, frozen callbacks. |
| `components/trips/KontoArbeitsbereich.tsx` | Pass `registrySteuerung`. Split traveller and intake write from refresh. The intake writer receives the captured `{ tripId, registryTravellerId }`. Keep `registryTripUebernahmeGesperrt(reise)`, `registryTravellerInReiseUebernehmen`, and `router.refresh()` in this file. Keep the raw `serverReise` canonical prop. |
| `components/trips/GastArbeitsbereich.tsx` | Safe-trip ref for traveller save/remove. Update it only on `null` or on an explicit successful same-trip read. Split that read from the write. No registry UI. No new storage API. |
| `lib/readiness/trip-traveller-snapshot-workflow-1.ts` | New. Pure draft, final-emitted-graph, membership, conflict, and intent rules. No React, router, or server action. |
| `lib/readiness/trip-traveller-snapshot-workflow-1.test.ts` | New. Pure cases, included by the existing `lib/**/*.test.ts` test script. |
| `lib/traveller/account-registry-trip-copy.ts` | The new intake sentences only. |
| `lib/traveller/account-registry-trip-ui.test.ts` | Unchanged unless a moved string makes an allowlisted UI-shape assertion obsolete. Domain assertions stay. `erfolg` remains referenced by the intake source. |
| `lib/readiness/preparation-premium-experience-5.test.ts` | T-EX1 only: the two helper-name assertions in lines 134–135. |
| `lib/country/ui.test.ts` | T-EX1 only: the two helper-name assertions in lines 64–65. |
| `scripts/trip-traveller-snapshot-workflow-completion-1/**` | Local synthetic mount and CSS proof, including the mounted RED run before the editor change. |
| `docs/evidence/trip-traveller-snapshot-workflow-completion-1/**` | Later evidence. Not this commit. |
| `docs/JETNITY_TRIP_TRAVELLER_SNAPSHOT_WORKFLOW_COMPLETION_1_{STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-25.md` | Later delivery docs. Not this commit. |

These paths stay at their seed bytes:

- `lib/readiness/dokument-formular.ts` and `lib/readiness/dokument-formular.test.ts`
- `lib/readiness/reisende-aktionen.ts`, `reisende-gast.ts`, `reisende.ts`, `schema.ts`, `party.ts`
- `lib/traveller/account-registry.ts` and `account-registry-trip.ts`
- `lib/trips/gastspeicher.ts` and `lib/trips/daten.ts`
- `components/trips/EigeneReisevorbereitung.tsx` and `usePersonalPreparationLifecycle.ts`
- `components/trips/TripWorkspaceAuditClient.tsx`
- canonical trip types, server writers, RPCs, migrations, Auth, and RLS
- `package.json`, lockfiles, workflows, operating mode, and global continuity

`TripTravellerSnapshotEditor.tsx` is omitted on purpose. Moving the card markup would make frozen source assertions outside T-EX1 fail for labels and `LandFeld`.

## 8. T-EX1 — accepted for implementation after a later PLAN PASS

T-EX1 is accepted by the Technical Lead for eventual implementation. This revision does not apply it. The four assertions change only after a later explicit PLAN PASS.

`check:exports` treats a name as used when it appears anywhere outside its own file. `check:dead` reaches `dokument-formular.ts` from `dokument-formular.test.ts` and from any remaining `dokumenteAusTraveller` or `neueDokumentClientRef` import. Stopping the runtime calls to `citizenshipClientRefFuer`, `dokumenteAlsPayload`, and `dokumenteNachCitizenships` does not by itself fail those two guards. `dokument-formular.ts` and `dokument-formular.test.ts` stay unchanged. No hygiene exception is granted or needed.

The accepted edit is only these four assertions:

| File | Accepted change |
| --- | --- |
| `lib/readiness/preparation-premium-experience-5.test.ts` lines 134–135 | Stop requiring the source names `dokumenteAlsPayload` and `citizenshipClientRefFuer` in `Reisevorbereitung.tsx`. |
| `lib/country/ui.test.ts` lines 64–65 | The same two assertions only. |

Every other assertion in those tests stays, including `LandFeld`, no ISO free text, no `citizenships[0]` / `documents[0]`, no first-credential default, the button labels, the layout classes, and the official and personal section markers. The new identity-preserving behavior is demonstrated by the pure serializer test and by the mounted RED → GREEN regression in section 10. Absence of the old helper names is not that proof. A comment that merely contains the old names, or a call whose result is discarded, is not an acceptable way to keep the current assertions.

No `package.json` exception is requested. `npm test` already loads `lib/**/*.test.ts` and will load the new pure test. It does not load `scripts/**`. The mounted runner is an explicit command in section 10. Adding it to the package script would be a frozen-file edit.

## 9. State and failure matrix

| Situation | Ledger | Writer calls | Visible result |
| --- | --- | --- | --- |
| Residence-only edit of a UUID citizenship with a linked passport | same citizenship ref, same document ref, same relation | one save | payload preserves both refs and the relation |
| Legacy `citizenship:RS` plus a second citizenship and two documents | each existing ref kept; a new row keeps the ref minted at creation | one save | no country-derived replacement |
| User removes one citizenship | only relations to that ref become `null` before serialization | one save after the edit | the other same-country row is not retargeted |
| Untouched blank new citizenship, no document points at it | row omitted from the payload | one save if the rest is valid | success copy does not claim that blank row was stored |
| Blank new citizenship whose ref a document still uses | both rows kept | zero, `not_sent` | relation stays; nothing is nulled or retargeted |
| Loaded citizenship or document with a blank or illegal country or type | row kept | zero, `not_sent` | persisted malformed data is not silently omitted |
| Invalid country, duplicate country, duplicate exact ref, or relation outside the emitted set | draft kept | zero, `not_sent` | error on that card |
| Padded, blank, missing, or overlength child ref or relation | supplied characters kept | zero, `not_sent` | no trim, cut, or fallback |
| Two different supplied refs share one frozen-reader image | both rows kept | zero, `not_sent` | the exact row is not chosen as the survivor |
| Exact UUID or exact legacy ref, length 1 through 64, already trimmed | ref unchanged | one save when the rest is valid | the payload contains that same string |
| Blank untouched new document row plus a residence edit | blank row omitted | one save | success copy does not claim that blank row was stored |
| Double Enter or save while remove is in flight, same slot | second intent `not_sent` | one | one pending region; the second payload is not replayed |
| Account, two slots | independent intents | one each | one `unproven` result does not clear the other |
| Guest, rapid save/save or save/remove on two slots, first result `null` | trip occupy | the first call only | the second is `not_sent`; a later explicit click uses the returned trip |
| Guest, first write returns a string after a possible `setItem`, then another slot saves or removes | graph `unresolved` | the first call only | the second writer is not called; the old ref is not written back |
| Guest explicit read succeeds for this trip after that string | ref becomes the read trip; latch clears | zero during the read | no draft is submitted; a later deliberate write still contains the first effect |
| Guest explicit read is missing, invalid, unreadable, wrong-trip, or thrown | latch stays closed | zero | traveller writes stay blocked |
| Section return while the guest graph is unresolved | latch and drafts kept | zero | no read and no replay |
| Local validation before the writer | `not_sent` | zero | editable; not a transport outcome |
| Callback returns a string after the call | `unproven` | no automatic retry | outcome unknown; draft kept; not called rejected |
| Sync throw, rejection, or malformed fulfillment after the call | `unproven` | no automatic retry | same unknown outcome |
| Callback returns `null`, refresh still running | `accepted`, refresh requested | no second write | not described as observed |
| Refresh throws after `null` | write stays `accepted`, refresh `unclear` | no second write | not described as `unproven` |
| Pre-settlement canonical delivery matches the payload | ignored for this intent's readback | none | does not become `consistent` |
| Later delivery matches membership and every submitted field | `consistent` observation | none | match is not a causal or exactly-once receipt |
| Clean canonical field change, membership still present | draft replaced | none | form matches the new slot |
| Dirty canonical field change | draft kept, save disabled | none | reload or keep-my-edits |
| Saved profile becomes an empty placeholder with the same ref | membership `absent` | zero until explicit re-entry | keep-my-edits does not save over the placeholder |
| Explicit re-entry after that absence | new draft generation | a later explicit Save may create | copy says this creates details for this trip slot again |
| Stale completion after a newer edit or a newer occupy | new generation kept | none | old completion does not reset the form or release the new occupy |
| Trip id changes | old ledger dropped | in-flight result discarded | no retry on the new trip |
| Section navigation | ledger kept in `TripWorkspace` | in-flight continues | status is there on return; focus is not stolen; intake is not replayed |
| Full `TripWorkspace` unmount | memory gone | none | no restored pending and no replay; this limit is the absence of recovery |
| Named remove confirmed | one remove intent | one `travellerEntfernen` / `gastTravellerEntfernen` | slot can remain as an empty place; headcount copy does not say it shrank |
| Named remove cancelled | none | zero | focus returns to the remove button |
| Two registry rows, same label | intents keyed by registry `id` | the clicked id only | no row is chosen by label |
| Capacity becomes full before the server returns | in-flight continues | the one call already started | string or accept; `voll` does not invent the result |
| Registry list `problem`, or `travellers == null` | no new intake | zero | existing error copy, distinct from empty |
| Intake `null` before refresh | `accepted`, then one refresh | no second materialization | no guessed new party row; `erfolg` only here |
| Intake string, throw, rejection, or malformed fulfillment | `unproven` | no automatic repeat | a later explicit confirm warns that another snapshot can be created |
| Legacy audit node confirm | the frozen `onUebernehmen` is the captured writer | that stub once | `null` is `accepted`; no second writer |
| Konto intake confirm | the Konto writer is the captured writer | that writer once | the audit stub is not also called |
| Cross-tab guest write | unchanged guest contract | the existing storage writer only | not atomic and not claimed to be |

`party_loeschen` returns `ok` even when `deleted` is 0, and the action drops that count. The UI says the removal was accepted only when the callback returned `null`. It does not say a row count changed. A later absent membership is the observation that the profile is no longer in the party, not a second claim about that count.

## 10. Proof plan (T-R1.6)

After a later explicit PLAN PASS, proof is synthetic and local. Stubbed actions, stubbed `router.refresh`, and guest `localStorage` are labeled as stubs. They are not hosted, RLS, Auth, or Production evidence.

### 10.1 Mounted RED, then the same assertion GREEN

The first implementation commit adds the mounted residence-only UUID regression and does not change `Reisevorbereitung.tsx` or the serializer. The test mounts the real card through the real `TripWorkspace` path, opens the editor, changes only residence, and submits with the form control. It asserts that citizenship ref `a1111111-1111-4111-8111-111111111111` and the passport relation to that ref are both present in the submitted payload.

That command is run against that commit. It must fail on the original editor. The retained raw evidence records the command, the non-zero exit, the HEAD of that RED commit, and the actual payload showing `citizenship:CH` and `citizenshipClientRef: null`. A pure call to `dokumenteAlsPayload` may be kept as a characterization of the frozen helper. It does not replace this mounted failure.

The next commit applies the editor and serializer fix. The same mounted interaction and the same assertion are run again and must pass. Both logs stay in `docs/evidence/trip-traveller-snapshot-workflow-completion-1/`. The assertion is not weakened to hide the RED result. The GREEN evidence records its own HEAD.

### 10.2 Pure tests

Pure tests in `lib/readiness/trip-traveller-snapshot-workflow-1.test.ts`, run by the existing `npm test` on Node 22:

- The new serializer preserves the UUID, the passport ref, and the relation on a residence-only change.
- The blank-country-linked-document counterexample returns `not_sent`, emits no payload, and leaves the relation unchanged.
- Padded `" citizenship:CH"` beside exact `citizenship:CH`, two overlength refs with the same 64-character prefix, a blank citizenship ref that would become `citizenship:CH`, a missing document ref that would become `document:passport:CH`, a padded or overlength relation that would match an emitted ref, and a whitespace-only relation that would become `null`. Each returns `not_sent`, emits no image, and leaves the supplied characters visible. Exact UUID and legacy refs pass unchanged.
- A loaded blank or illegal citizenship is `not_sent` and is not omitted. An untouched created blank citizenship with no relation is omitted.
- Legacy refs, two citizenships, two documents, deliberate removal of one citizenship, an explicit relation change, and invalid or duplicate input.
- Field match with membership `absent` is not a clean empty draft. Explicit re-entry is a new generation. Keep-my-edits does not authorize a save after membership loss.
- A canonical delivery at or before settlement does not become `consistent`. A later delivery with the same membership and fields does. A dirty draft still requires Neu laden or Meine Eingaben behalten before submit.
- Double save, account different-slot independence, guest second-slot admission `not_sent` without a stored replay payload, string after a possible write, synchronous throw, rejection, malformed fulfillment, stale completion, accepted-then-refresh-throw, and intake with two same-label ids. The pure tests drive the decision function twice without waiting for React.
- Guest decision: after a non-null result the trip stays unresolved, a second-slot save or remove does not produce a writer call, a failed or mismatched read does not clear the latch, and a successful same-trip read clears it without a stored payload. The legacy writer registry invokes the supplied function once and does not replace it.

### 10.3 Mounted workspace, controller, and CSS

Mounted proof in `scripts/trip-traveller-snapshot-workflow-completion-1/`, executed explicitly because `package.json` is frozen:

`node --import ./scripts/server-only-test-register.mjs --import tsx --test scripts/trip-traveller-snapshot-workflow-completion-1/*.test.ts`

The harness follows the existing esbuild-plus-Playwright page used by `scripts/trip-personal-preparation-workflow-completion-1/`. It mounts the real `TripWorkspace` wiring, the real card, and the real `RegistryReiseUebernahme` through the Konto render prop. One case mounts the frozen audit node, with its `onUebernehmen={async () => null}` left in place, and counts that stub. It does not call private handlers as the proof of a click.

- The GREEN residence-only case from §10.1, plus a pointer click on the same button.
- Legacy refs, two citizenships, two documents, citizenship removal, relation selection, the blank-country-linked-document case, and invalid or duplicate input through the real controls.
- Double Enter; guest rapid different-slot save/save and save/remove after a `null` return, asserting the first update is still in the stored graph and the second click did not write a stale payload; synchronous throw; rejected promise; malformed return; stale completion.
- Guest `setItem` succeeds and the following readback fails, so the first callback returns a string. A second-slot save and a second-slot remove are then attempted. Neither calls the writer. An explicit read that is `unreadable`, `invalid`, `missing`, or `wrong_trip` leaves those controls blocked. A following explicit read of `{ art: 'success' }` for this trip does not submit a draft. The next deliberate second-slot save uses that read's graph and still contains the first effect. Leaving and reopening Vorbereitung does not read and does not submit.
- Saved blank `traveller:1` removed into a placeholder: save stays disabled, keep-my-edits does not write, and only the explicit re-entry control enables a later create.
- A canonical delivery that arrives before settlement and matches the payload does not show the consistent sentence. A delivery after settlement may.
- Intake of two same-label sources, `voll` changing before resolve, list `problem`, `travellers == null`, empty list, `accepted` before the next props, string and thrown intake with no automatic second materialization, navigation to Reiseplan and back, and a full unmount that does not restore or replay the intent.
- The Konto render-prop path invokes its writer once. The legacy audit node, unchanged, invokes its `async () => null` stub once through the same controller and does not invoke a second writer.
- DOM pointer, keyboard, and form events. Tab order reaches the controls. Escape cancels removal. A late response does not move focus after a newer key.

CSS, in that same runner, at widths 320, 360, 390, 768, and 1280. At the narrow width, root font size is 32px. Cases include long labels, several child rows, the confirmation, the conflict, the membership-loss state, pending, and the unknown-outcome state. `scrollWidth` must not exceed the viewport because of this surface. The page must not set `overflow: hidden` to pass. `prefers-reduced-motion: reduce` is emulated. This lane adds no new animation. Screenshots go under `docs/evidence/trip-traveller-snapshot-workflow-completion-1/` with the head, command, exit code, Node version, and Playwright version.

Also run, and record honestly: the existing traveller, registry materialization/orchestration, personal-preparation, and workspace tests that `npm test` already includes; `npm run typecheck`; `npm run lint`; `check:dead`; `check:exports`; `check:deps`; `check:api-schutz`; `check:schema-bezug`; `npm run build`; `npm test`. Native App, Auth, and Vercel gates stay the existing ones. This lane does not edit them. Skipped work is not a pass. The two established conditional browser skips, 181 existing lint warnings, 11 untriaged advisories, guest cross-tab non-atomicity, and full-unmount loss stay limits.

`npm test` on CI will not re-run the Playwright script until a later allowlisted `package.json` change. The implementation report must say that in the evidence header. This plan commit runs none of those commands.

## 11. Costs, security, and limits

No new dependency, provider, paid call, secret, migration, RLS change, or Auth change. No new recurring cost. The USD 100 monthly boundary is unchanged. Prelaunch and `noindex` stay.

The editor still sends only the existing label, residence, citizenship country, document type, issuer, expiry, and refs. It does not add a passport number, MRZ, biometric, or health field. Service role is not used. The integrity fix is that an unrelated residence edit no longer drops a document relation, a dangling relation to an omitted blank row is rejected before the writer, a ref the frozen reader would trim, cut, or replace is rejected unchanged, an uncertain guest graph is not used as the next whole-trip write, and an uncertain registry intake is not repeated into a second fresh snapshot.

Not proved by this lane, even after the planned tests: hosted readback, SQL, RLS, Production data, a causal link between a `null` action result and a later prop, exactly-once writes, commit certainty of a string or a throw, guest cross-tab atomicity, atomicity between a traveller write and a different guest writer, recovery after the workspace unmounts, native device or screen-reader behavior, and the frozen `travellerLegacyLesen` drop when some other caller bypasses this UI. A schema or versioned-mutation change is not required for the UI repair. If implementation finds that a correct save cannot be expressed with the current payload, it stops at that boundary instead of editing `schema.ts` or the RPCs.

#985/#982 and #917 stay STOP/HOLD with no alternate path. #913/#911, #968, #748, #626, #937/#936, and Bern #934 stay as they are. No Production, provider, secret, payment, legal, or launch action.

## 12. Stop

This document is the R2 plan correction. The next step is an independent full Technical-Lead re-review of the exact head that contains this file and the unchanged TASK. This session does not implement, does not add tests, does not run the RED or GREEN proof, does not collect evidence, does not edit any other document, does not mark Ready, does not merge, does not close #1012, and does not write `main`.
