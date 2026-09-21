# Jetnity – V1 Core Regression Hunter 1 – QA Report

Stand: 21. September 2026  
Status: **AUDIT COMPLETE / DOCS-ONLY / NO REMEDIATION / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #496  
Draft PR: #498  
Branch: `audit/v1-core-regression-hunter-1`  
Audit subject: `main@4169c5b4a2d6e2f663bfaace385a2d482a4cc2d9` plus this slice's docs only  
Agent: Jetnity V1 core regression hunter 1, Generation 1  
Required model: Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-3f1efd48-1c68-489a-8e1b-12ed3bf26f2a`

This is a static, read-only attack of accepted V1 contracts. No runtime was changed. No Production, Auth, RLS, provider, secret or paid action was performed. Live Production state that is not visible in the repository is recorded as **unknown**.

Parallel ownership:

- PR #494 owns the local security-event producer-contract harness / `scripts/db` / its package script. Those files were not edited.
- PR #497 owns historical G2-finding reconciliation. This report does not classify the historical matrix as CLOSED/STILL_OPEN.
- PR #498 owns only these regression-audit docs.

---

## 0. Result in one page

| Class | Count | IDs |
| --- | --- | --- |
| P0 | 0 | — |
| P1 | 0 | — |
| P2 | 6 | RH-1.1, RH-3.1, RH-10.1, RH-12.1, RH-12.2, RH-12.3 |
| P3 | 8 | RH-2.1, RH-4.1, RH-5.1, RH-6.1, RH-7.1, RH-10.2, RH-12.4, RH-12.5 |
| Explicit non-findings | 12 domains covered | see §2 |

No P0/P1 contract break was proven at this head. The highest-value Technical-Lead look-first set is:

1. **RH-1.1** — HTML `/account` and `/admin` treat Auth *lookup failure* as *not logged in*.
2. **RH-3.1** — Mobility edges follow `reise.stages` array order, not `position`.
3. **RH-10.1** — Admin “Login-Fehler” KPI uses a different type filter than the canonical aggregator.
4. **RH-12.1 / RH-12.2** — Two leftover architecture sentences still deny Production facts that later accepted closures already recorded.

Every finding below is labelled FACT / INFERENCE / RISK / RECOMMENDATION. Recommendations are correction *direction* only. This slice implements none of them.

---

## 1. Findings

### RH-1.1 — Account HTML proxy maps Auth lookup failure to login redirect

- **Domain:** 1 Account / session / error boundary  
- **Severity:** P2  
- **FACT:** `proxy()` uses `getUser()` for identity. A thrown Supabase error on HTML `/account` or `/admin` (except `/admin/login`) calls `scope.deny(req)`, which is `redirectToLogin`. API paths already return HTTP 503 / `lookup-failed`. Missing ENV on HTML paths also uses `scope.deny`.  
  Evidence: `proxy.ts` L35–38, L56–58, L74–80, L98–113.  
- **INFERENCE:** A transient Auth outage or unreadable session is presented as “please log in,” not “we cannot verify you right now.” API clients get an honest 503; browsers do not.  
- **RISK:** Session confusion, unnecessary re-authentication, and a possible second guest→account attempt while drafts remain. Security remains fail-closed (no grant). The defect is truth, not an access bypass.  
- **RECOMMENDATION:** For HTML account/admin routes, distinguish `lookup-failed` (retry / unavailable copy) from `unauthenticated` (login redirect), matching the existing API branch.  
- **Accepted contract contradicted:** `AGENTS.md` §15 and ADR-0037 — failure must not be labelled as a benign absence. `docs/LOGIC_STANDARD.md` §1 — unknown stays unknown.  
- **Impact:** User/session truth. Not an AAL2 weakening.  
- **Smallest correction:** HTML 503-style unavailable page or query flag; keep deny-on-failure.  
- **Special PO gate:** No.

### RH-2.1 — Schema-invalid guest draft becomes silent `nichts`

- **Domain:** 2 Guest → account migration  
- **Severity:** P3  
- **FACT:** `gastspeicherLaden()` runs drafts through `reiseLesen()`. Invalid active drafts become `aktiv: null`. `gastreisenUebernehmen()` then returns `{ art: 'nichts' }` when `zurUebernahme()` is empty. `GastreiseBruecke` treats `nichts` as `ruht` and renders nothing. `lib/trips/uebernahme.test.ts` explicitly expects `{ art: 'nichts' }` for impossible values. Raw `localStorage` bytes may remain.  
  Evidence: `lib/trips/gastspeicher.ts` L175–182, L419–422; `lib/trips/uebernahme.ts` L79–80; `components/trips/GastreiseBruecke.tsx` L73–75; `lib/trips/uebernahme.test.ts` L1053–1056.  
- **INFERENCE:** This is the accepted schema-filter contract, not a happy-path overwrite. The residual is UX: invalid guest work disappears from the UI without an error.  
- **RISK:** User believes the draft never existed. Support cannot see a failure mode.  
- **RECOMMENDATION:** If a raw key exists but `reiseLesen` fails, surface a dedicated invalid/error art. Do not delete raw storage without an explicit user action.  
- **Accepted contract:** ADR-0042 happy-path remains held (see non-finding 2.A). Tension is only with “no silent loss” for *invalid* bytes.  
- **Impact:** User truth / support. No account overwrite.  
- **Smallest correction:** Visible invalid-draft state.  
- **Special PO gate:** Only if product later changes guest-model semantics.

### RH-3.1 — Mobility edges use stage array order, not `position`

- **Domain:** 3 Trip workspace / ordered multi-stage route  
- **Severity:** P2  
- **FACT:** `benoetigteKanten()` takes `reise.stages.filter(...)` and uses `[0]`, `[length-1]` and adjacent index pairs. It does not sort by `position`. Timeline, destination essentials, `reiseOrte` and account `reiseAus()` *do* sort by `position` then id/created_at. `lib/trips/reise-orte.test.ts` already treats “wrong array order, correct position” as a real case. `lib/mobility/kanten.test.ts` only uses aligned one-stage fixtures.  
  Evidence: `lib/mobility/kanten.ts` L174–205; `lib/trips/timeline.ts` L34–38; `lib/trips/abbildung.ts` L301–307; `lib/trips/reise-orte.ts` L4–19.  
- **INFERENCE:** Account DB reads are likely protected by `reiseAus()` sorting. Guest/in-memory graphs, or any caller that mutates `position` without rewriting array order, can show a different mobility sequence than the timeline.  
- **RISK:** User/truth — wrong outbound/connection/return legs. Not a visa or security claim.  
- **RECOMMENDATION:** Sort like `etappenSortieren` before deriving edges. Add the existing reise-orte out-of-order fixture to `kanten.test.ts`.  
- **Accepted contract contradicted:** TW6 — stage order is `position` 1..n, not incidental array order (`docs/TRIP_WORKSPACE_TW6_REST_PROGRESSIVE_STAGES_TASK.md`; `docs/LOGIC_STANDARD.md` §2 one graph).  
- **Impact:** Workspace mobility summary.  
- **Smallest correction:** Sort-then-walk in `benoetigteKanten`.  
- **Special PO gate:** No.

### RH-4.1 — Legacy trip-graph fallback can collapse peer credentials

- **Domain:** 4 Traveller registry  
- **Severity:** P3 (degraded path only)  
- **FACT:** `reiseLaden()` falls back to `TRIP_GRAPH_SELECT_LEGACY` when `foundationERelationFehlt()` matches a missing child-relation error. `travellerAusZeile()` then fills singular `nationalityCountryCode` / `documentType` when child arrays were not loaded.  
  Evidence: `lib/trips/daten.ts` L189–196; `lib/trips/foundation-e-select.ts` L9–27; `lib/readiness/reisende.ts` L81–102.  
- **INFERENCE:** On a schema/PostgREST mismatch, a traveller with 1:n citizenships/documents can be read as one legacy nationality/document. On the Foundation-E Production acceptance line of 23 August 2026 the child tables exist, so this path should not fire on that environment. The header comment in `foundation-e-select.ts` still claims they are absent — see RH-12.2.  
- **RISK:** Truth — silent singularization only if the fallback fires. Happy-path registry/engine remain 1:n.  
- **RECOMMENDATION:** If fallback remains, mark the party/readiness result as degraded instead of silently using singular columns.  
- **Accepted contract contradicted if the path fires:** `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`; `docs/TRAVELLER_CONTEXT.md`.  
- **Impact:** Readiness context on a broken schema path.  
- **Smallest correction:** Explicit degraded flag / fail-closed readiness.  
- **Special PO gate:** Yes only if changing Production expand/contract or migrations.

### RH-5.1 — Latent traveller summary can say “not required” from one current option

- **Domain:** 5 Multi-citizenship / multi-document  
- **Severity:** P3 (latent)  
- **FACT:** `officialTravellerErgebnisText()` returns “Offiziell nicht erforderlich” if *any* current evaluation is `not_required`, before sibling `unknown` / `unavailable` rows without `missingFacts`. Grep shows **no `components/` importer**. Tests cover single-result cases, not mixed peer options.  
  Evidence: `lib/readiness/bezeichnungen.ts` L107–126; `lib/readiness/bezeichnungen.test.ts` L121–146.  
- **INFERENCE:** If later wired to a traveller card, mixed credential options could be summarised as globally not required.  
- **RISK:** Truth UX, currently unused. Destination essentials already require *every* evaluation in a group to be current `not_required` (`lib/trips/destination-essentials.ts` L288–294).  
- **RECOMMENDATION:** Require all scoped evaluations current, or say option-dependent / incomplete, before claiming not required.  
- **Accepted contract contradicted if wired:** `unknown != not_required`.  
- **Impact:** None in current UI.  
- **Smallest correction:** Tighten the helper and add a mixed-option test before any UI use.  
- **Special PO gate:** No.

### RH-6.1 — Aggregate official banner claims “geprüft” from any current row

- **Domain:** 6 Destination / transit / readiness truth  
- **Severity:** P3 (latent at HEAD; live if mixed freshness exists)  
- **FACT:** `officialPruefungAusLage()` returns `officialFreshnessText('current')` = “Offizielle Anforderungen wurden geprüft” when **any** row has `freshness === 'current'`, even if siblings are `provider_unavailable`. Used in `Reisevorbereitung` and the readiness API message.  
  Evidence: `lib/readiness/bezeichnungen.ts` L57–92; `components/trips/Reisevorbereitung.tsx` L158–160; `app/api/readiness/requirements/route.ts` L112.  
- **INFERENCE:** At HEAD, `requirementsProviderAus()` is `null` and empty official rows use `result: 'unknown'` / `freshness: 'provider_unavailable'` (`lib/readiness/official.ts` L369–371). The over-claim path is therefore dormant unless some evaluations are actually `current`. Destination-essentials group logic is stricter.  
- **RISK:** Overconfidence in the Reisevorbereitung banner if an official provider later yields partial current rows. Per-row checklist remains more accurate.  
- **RECOMMENDATION:** Claim “geprüft” only when all relevant evaluations are current, or use “teilweise geprüft”.  
- **Accepted contract contradicted if mixed current+unavailable is shown:** `unavailable != not_required`; `docs/TRAVEL_READINESS.md` honesty.  
- **Impact:** User truth on the aggregate banner.  
- **Smallest correction:** Partial wording.  
- **Special PO gate:** Official provider activation remains a reserved gate and is not implied.

### RH-7.1 — Model kill-switch is not Production-env hard-off

- **Domain:** 7 Search / provider fail-closed  
- **Severity:** P3 (documented accepted asymmetry)  
- **FACT:** `modellZustand()` enables on kill-switch + key + priced model. It does **not** check `VERCEL_ENV === 'production'`. Flight/hotel/activity search *does* hard-off Production via `providerOpsIstProduction`.  
  Evidence: `lib/modell/konfiguration.ts` L199–219; `lib/flights/zustand.ts` L35–42; `lib/provider-ops/zustand.ts` L21–35.  
- **INFERENCE:** This is the documented model-path contract (`docs/V1_INCIDENT_PROCESS_RUNBOOK_2026-09-18.md`), not a hidden search-provider activation.  
- **RISK:** Accidental Production model enablement is a paid-call / special-gate matter, not a search-provider leak.  
- **RECOMMENDATION:** Keep as accepted residual unless Product Owner later wants Production hard-off for models.  
- **Accepted contract:** Not contradicted; recorded so it cannot be misread as a hunter miss.  
- **Impact:** Cost, only if Production secrets are intentionally enabled.  
- **Smallest correction:** None required by this audit.  
- **Special PO gate:** Yes for any Production model activation.

### RH-10.1 — SecurityWidget “Login-Fehler” filter disagrees with the canonical aggregator

- **Domain:** 10 Admin security honesty  
- **Severity:** P2  
- **FACT:** `SecurityWidget` counts 24h events whose `type` **contains** `'failed'`. Widget comment lists `'login_failed' | 'bot' | 'suspicious'`. `fasseSicherheitslageZusammen()` counts only `type === 'auth_failed'`. Accepted architecture keeps historical `login_failed` readable and forbids new producers from reusing `auth_failed` / `login_failed`.  
  Evidence: `components/admin/security/SecurityWidget.tsx` L34, L149–150, L177–180; `lib/admin/kennzahlen.ts` L34–37; `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md` (historical `login_failed`).  
- **INFERENCE:** A historical `login_failed` row is a “Login-Fehler” in the widget and a zero in the aggregator. A future type containing `failed` would inflate the widget. Empty/error still render as `null` / em dash — no zero-from-error.  
- **RISK:** Operator truth / decision support. Not a coverage lie about ingestion (honest banners remain).  
- **RECOMMENDATION:** One shared type predicate. Decide whether the canonical name is `auth_failed` or historical `login_failed`, then use it in both places. Do not invent a new producer here — that is PR #494 / later gated work.  
- **Accepted contract contradicted:** ADR-0040 honest admin KPIs; one security-event semantics.  
- **Impact:** Admin truth.  
- **Smallest correction:** Shared filter.  
- **Special PO gate:** No for presentation alignment. Yes for any persistent event writer.

### RH-10.2 — “Auffälligkeiten” KPI uses a different taxonomy than `anomaly*`

- **Domain:** 10  
- **Severity:** P3  
- **FACT:** Widget regex is `bot|suspicious|ddos`. Aggregator counts `type.startsWith('anomaly')`.  
  Evidence: `components/admin/security/SecurityWidget.tsx` L150; `lib/admin/kennzahlen.ts` L37.  
- **INFERENCE:** Same window can disagree on “Auffälligkeiten.”  
- **RISK:** Mild operational confusion.  
- **RECOMMENDATION:** Share one taxonomy.  
- **Accepted contract:** ADR-0040 spirit.  
- **Impact:** Admin truth.  
- **Smallest correction:** Canonical helper.  
- **Special PO gate:** No.

### RH-12.1 — `ARCHITECTURE.md` / `DATENBANK.md` still deny Production AAL2 after #480

- **Domain:** 12 Continuity / docs-vs-live (runtime-security interpretation)  
- **Severity:** P2  
- **FACT:** `docs/AUTH.md` L117 and L354, DECISIONS ADR-0175 Nachtrag, `docs/QS2_ADMIN_AAL2_PRODUCTION_APPLY_GATE_STATUS_2026-08-27.md`, and the G2 matrix resolution update for finding 3.3 state Production has `aktuelles_admin_aal2()` applied once and must not be applied again. `ARCHITECTURE.md` L133 and `docs/DATENBANK.md` L262 still say Production does not have the function and the alignment file is “vorbereitet, nicht angewendet.” App-layer AAL2 in `lib/auth/admin-aal.ts` L57–61 is independent of that sentence.  
- **INFERENCE:** Finding 3.3’s *information* gap was closed for AUTH.md by #480. Two architecture docs were not updated. This hunter did **not** re-read live Production SQL.  
- **RISK:** An operator following ARCHITECTURE/DATENBANK might attempt a second apply, which AUTH.md forbids, or assume DB AAL2 is absent.  
- **RECOMMENDATION:** Align the two stale sentences to the #480 / apply-gate line, or mark them superseded. Do not apply the migration again from this finding.  
- **Accepted contract contradicted:** Post-#480 AUTH.md / ADR-0175 Nachtrag vs leftover architecture sentences.  
- **Impact:** Security/ops interpretation. App AAL2 guard still fail-closed.  
- **Smallest correction:** Two-sentence doc fix on a continuity slice.  
- **Special PO gate:** No for docs. Yes for any Production SQL.

### RH-12.2 — `foundation-e-select.ts` still claims Production lacks Foundation-E children

- **Domain:** 12 / 4  
- **Severity:** P2  
- **FACT:** File header: “Foundation-E-Children sind auf Production noch nicht vorhanden.” `docs/FOUNDATION_E_PRODUCTION_ACCEPTANCE.md` (23 August 2026) records Product-Owner-approved Production apply and direct verification that `trip_traveller_citizenships` and `trip_traveller_documents` exist.  
  Evidence: `lib/trips/foundation-e-select.ts` L1–5; `docs/FOUNDATION_E_PRODUCTION_ACCEPTANCE.md` L17–44.  
- **INFERENCE:** The expand/contract fallback may still be a valid safety net. The *reason comment* is stale and can drive a false “Production is still singular” reading.  
- **RISK:** Wrong Traveller-context Production story; unnecessary new identity model.  
- **RECOMMENDATION:** Rewrite the comment to “fallback only if the child relation is actually missing,” citing the acceptance doc.  
- **Accepted contract contradicted:** Foundation E Production acceptance vs current code comment.  
- **Impact:** Continuity / Traveller-truth interpretation.  
- **Smallest correction:** Comment only.  
- **Special PO gate:** No.

### RH-12.3 — Machine mode is NORMAL; leftover HOLD / parked-#487 fields are stale

- **Domain:** 12  
- **Severity:** P2  
- **FACT:** Live GitHub `main` is `4169c5b4` (“Close V1 Security Event Ingestion Architecture 1 (#487)”). That commit contains `.jetnity/operating-mode.json` with `"mode": "NORMAL"` **and** `proposalStatus: "proposed_until_tl_merge"`, `liveMainRemainsHoldUntilMerge: true`, and `parkedProductSlice.pr: 487` at `12d070a79c35fbb9f03d1302833eee8561ec17bd`. `docs/ACTIVE_WORK_STATUS.md` §0 still says live main remains HOLD and #492 is the exclusive writer. This hunter must not edit those global files.  
- **INFERENCE:** Enforcement metadata already allows normal product slices (`normalProductSlices: "allowed"`). Human continuity and leftover JSON fields still describe the pre-merge HOLD-closure proposal, and they still park a PR that *is* the current main tip.  
- **RISK:** Dispatch confusion (block or resume the wrong slice). Not an end-user runtime bug.  
- **RECOMMENDATION:** Dedicated continuity persist after Technical-Lead post-merge verification of #492/#487 — outside this PR.  
- **Accepted contract contradicted:** `docs/CONTINUITY_STANDARD.md` live-evidence-wins; operating-mode file says it is not a competing governance source.  
- **Impact:** Agent/governance truth.  
- **Smallest correction:** Continuity-only update.  
- **Special PO gate:** No for docs. HOLD-exit already merged on this main line.

### RH-12.4 — `ROADMAP.md` still names Assistant Runtime 1 as the current draft

- **Domain:** 12  
- **Severity:** P3  
- **FACT:** `ROADMAP.md` L8 still says the current draft slice is Assistant Runtime 1 / Draft PR #435. Accepted closures record #435 merged (`fdbd3735…`).  
- **INFERENCE:** A ROADMAP-first reader gets a false “open draft” pointer. START_HERE already says live evidence wins.  
- **RISK:** Wrong slice selection.  
- **RECOMMENDATION:** Refresh the header pointer only.  
- **Special PO gate:** No.

### RH-12.5 — Mobile Accessibility STATUS still mentions the CookieConsent orphan

- **Domain:** 12  
- **Severity:** P3  
- **FACT:** `docs/MOBILE_ACCESSIBILITY_1_STATUS_2026-09-02.md` L44 still says `components/layout/CookieConsent.tsx` remains an intentional orphan. The file is absent at HEAD; Cookie Consent Hygiene 1 / PR #477 removed it; legal inventory tests enforce absence.  
- **INFERENCE:** Historical STATUS, not live runtime. Closure docs already supersede it if read in order.  
- **RISK:** False belief the orphan component still exists.  
- **RECOMMENDATION:** One-line superseded banner. Do not restore the component.  
- **Special PO gate:** No.

---

## 2. Explicit non-findings

If a surface is listed here, this hunter found **no current contract break** at `4169c5b4` for the attacked invariant.

### Domain 1 — Account / session / error boundary

- **1.A** Account route error boundary exists (`app/account/error.tsx`). Production does not log the raw `Error` or render the message `<pre>`.  
- **1.B** Account/world-map/visit loaders use `lese()` and propagate `problem`. UI shows an error surface instead of “zero trips.” `?? []` is paired with `problem`.  
- **1.C** Session view keeps `andereSitzungenAnzahl` null / unsupported; AAL read failure yields `aal: null`, not a fake level.  
- **1.D** All reviewed `app/api/admin/**/route.ts` files call `requireAdminApi`.

### Domain 2 — Guest → account

- **2.A** Happy-path `gastreisenUebernehmen` is abort-on-first-failure, idempotent on `(user_id, client_ref)`, guarded by `laeuft`, and rejects a second guest trip via `GastreiseBestehtFehler` instead of silent overwrite.

### Domain 3 — Trip workspace / multi-stage

- **3.A** Timeline, destination essentials, `reiseOrte`, and account `reiseAus()` honor `position`.  
- **3.B** `MobilitaetBereich` using `stages[0]` for default form fields is presentation convenience, not readiness or visit truth.

### Domain 4 — Traveller registry

- **4.A** Account registry rejects `primaryCitizenship` / `defaultPassport` / `defaultCitizenship` in domain + UI tests. Trip materialization maps all citizenships/documents and mints fresh IDs.

### Domain 5 — Multi-citizenship / multi-document

- **5.A** No production `lib/` or `components/` inference of primary/preferred/default citizenship or passport. Hits are tests and forbidden-key guards.  
- **5.B** Readiness engine evaluates traveller × credential option × destination × requirement type. Document/citizenship sort is documented as fingerprint/UI order, not primary.  
- **5.C** `vergleich.ts` `duty: 'recommendation'` is not referenced from UI.

### Domain 6 — Destination / transit / readiness

- **6.A** Without a provider, official rows stay `unknown` / `provider_unavailable`. User `done`/`skipped` does not rewrite official result.  
- **6.B** Destination-essentials group `not_required` requires every evaluation current `not_required`; mixed groups stay `option_abhaengig` / `unknown` / `unvollstaendig`.  
- **6.C** Transit evaluations only when requested transits exist from itinerary evidence. No invented transit rules found.  
- **6.D** `planned != visited`: `world-map.ts` does not read `account_visits`; `welt-ansicht.ts` derives confirmed visits separately. Tests forbid inferring `visited` from trip status.

### Domain 7 — Search / provider fail-closed

- **7.A** Flight search Production-hard-off + explicit flag + Duffel test-token prefix. Missing provider returns `sucheOhneProvider` / `unavailable`, not fake options.  
- **7.B** Hotel / activities factories return `null`. Shared `providerOpsZustand` is Production-off + flag + access.

### Domain 8 — Commercial / provider neutrality

- **8.A** Provider collection comment and `suche.test.ts` assert array order is not ranking. Ranking uses Jetnity weights and option-id ties, not provider id.  
- **8.B** `commercialBesteQuelleWaehlen` always returns `null`. No invented best source.

### Domain 9 — Assistant

- **9.A** Single exported action `begleiterFragen`. Comment and tests: no `aenderungUebernehmen`, no trip DB writes.  
- **9.B** Projection leaves `provider` / `recommendation` / `community_opinion` / `generated_suggestion` unfilled; output class is `generated_suggestion`.  
- **9.C** Assistant uses local official/safety/seasonal helpers. Those provider factories return `null`.  
- **9.D** Guest workspace has no product Reisebegleiter.

### Domain 10 — Admin honesty (beyond RH-10.1/10.2)

- **10.A** SecurityWidget: `data === null` → KPI `null` / em dash; honest incomplete-ingestion copy in `ADMIN_EHRLICHE_TEXTE`. No zero-from-error.  
- **10.B** Admin home strip no longer shows revenue/order/refund/payout tiles from `admin_payments_summary_30d`.  
- **10.C** Health cards: error or empty RPC → `unbekannt`, not 0/0 protected. System-health green only if `healthy` **and** `fresh`.  
- **10.D** `lade()` / `liste()` refuse missing arrays.

### Domain 11 — Mobile / accessibility

- **11.A** Skip-link + landmarks on public/account/admin layouts remain.  
- **11.B** Public mobile nav: `aria-expanded`, `aria-controls`, `hidden`/`inert`, Escape, 44px target.  
- **11.C** PWA-1 installability without service worker / offline persist matches the closed contract.  
- **11.D** Real-device QA remains an accepted non-claim of Mobile Accessibility 1, not a silent “tested on hardware” claim.

### Domain 12 — Continuity (beyond findings)

- **12.A** Assistant auto-apply, provider live activation, planned≠visited, default-citizenship inference, revenue-tile honesty, cookie-consent absence, and legal-claim inventory tests match the accepted closed-slice line at this head.  
- **12.B** `security_events` still has no application INSERT in TypeScript. Admin UI discloses incomplete ingestion. Finding 5.2 remains OPEN as architecture, not as a false-green UI regression. Persistent producer work belongs to PR #494, not this PR.

---

## 3. Binding-invariant scorecard

| Invariant | Result |
| --- | --- |
| `unknown != not_required` | Held in engine + destination essentials. Latent helper RH-5.1 unused in UI. |
| `unavailable != not_required` | Held in engine. Aggregate banner RH-6.1 can mask unavailable if mixed `current` exists. |
| `stale != current` | Held: stale freshness is named and listed separately in Reisevorbereitung. |
| `planned != visited` | Held. |
| No default/primary/preferred citizenship/passport | Held in production UI/domain. |
| One traveller, many peer credentials | Held on happy path. Degraded fallback RH-4.1. |
| Official ≠ Provider ≠ Recommendation ≠ Community ≠ Generated | Held on assistant projection and official/recommendation split. |
| Provider order ≠ ranking | Held. |
| No hidden live provider activation | Held for search providers. Model path is documented kill-switch, not hidden search. |
| No assistant auto-apply | Held. |
| No false green / zero-from-error | Held for empty-vs-error. KPI *taxonomy* split is RH-10.1/10.2, not zero-from-error. |
| No AAL2 regression | Held in app guard. Leftover architecture sentences are RH-12.1, not an app-layer weaken. |

---

## 4. What this audit did not do

- No `npm test` / typecheck / lint / build run by this writer. Per `AGENTS.md` §25 those are **not run**, not green.  
- No credentialed Production or Development Supabase read.  
- No browser / Preview click-through of the Vercel deployment.  
- No classification of the historical G2 matrix (PR #497).  
- No producer-contract harness work (PR #494).  
- No implementation, Ready, merge, or follow-up slice.

Unknowns left explicit:

- Whether Technical-Lead post-merge verification of #492 is already PASS on live GitHub (this writer saw `main@4169c5b4` and `mode=NORMAL`, and did not treat leftover HOLD sentences as live HOLD enforcement).  
- Whether Production still matches the August/September AAL2 and Foundation-E acceptance evidence. Repository documents disagree; live SQL was not re-read.
