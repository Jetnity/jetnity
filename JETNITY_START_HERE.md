# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 2. September 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / PHASE 1 JETNITY CORE / FLIGHT MULTI-LEG + 0..N MULTI-PROVIDER CORE CLOSED / DESTINATION ESSENTIALS 1 CLOSED / WORLD MAP 1 CLOSED ON MAIN / PROVIDER SELECTION + EXTERNAL CONTACT DEFERRED / NO REAL PROVIDER ACTIVE / PRODUCTION S6 UNAPPLIED / EXTERNAL A–E GATES CLOSED / NO ACTIVE CURSOR AGENT / NO AUTOMATIC NEXT SLICE / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Fail closed. Eine Reise, eine Wahrheit.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Agenten-Session stehen.

## 1. Zuerst lesen

1. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md` ← **binding Technical-Lead/Cursor operating standard**
2. `docs/CHATGPT_TECHNICAL_LEAD_WORLD_MAP_1_CLOSED_2026-09-02.md` ← **latest runtime closure checkpoint**
3. `docs/ACTIVE_WORK_STATUS.md`
4. `docs/CHATGPT_TECHNICAL_LEAD_DESTINATION_ESSENTIALS_1_CLOSED_2026-09-02.md`
5. `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-02.md` ← transition history; live evidence and newer closure docs supersede stale current-state passages
6. `docs/CHATGPT_TECHNICAL_LEAD_V1_FLIGHT_MULTI_PROVIDER_ORCHESTRATION_CLOSED_2026-09-02.md`
7. `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`
8. `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`
9. `docs/FLIGHT_KAYAK_WEGO_ACCESS_ATTRIBUTION_DUE_DILIGENCE_2026-09-01.md`
10. `docs/FLIGHT_PROVIDER_APPLICATION_READINESS_KAYAK_2026-09-01.md`
11. `docs/FLIGHT_PROVIDER_APPLICATION_READINESS_WEGO_2026-09-01.md`
12. `docs/FLIGHT_PROVIDER_CONTRACT_QUESTION_MATRIX_2026-09-01.md`
13. `docs/SKYSCANNER_APPLICATION_READINESS_PRECHECK_2026-09-01.md`
14. `docs/PROVIDER_READINESS_FINAL_RECHECK_2026-09-01.md`
15. `docs/JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md`
16. `docs/JETNITY_V1_DEFINITION_OF_DONE_2026-09-01.md`
17. `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`

Danach immer live verifizieren: aktuelles `main`, offene PRs/Issues, relevanter Branch/Head, Merge-Base/ahead/behind, Actions, Vercel, Review-Threads, aktiver Cursor-Status und nur bei betroffenem Scope die relevante Supabase-Production-Wahrheit.

## 2. Product-Owner binding phases

### Phase 1 – JETNITY CORE — CURRENT

Die konkrete Reise zuverlässig planbar, organisiert und reisebereit machen.

V1 launches only when:

> **PRODUCTION READY FOR REAL TRAVELLERS.**

Feature Complete allein reicht nicht.

### Phase 2 – JETNITY COMPLETE TRAVEL PLATFORM

Provider breadth, deeper travel decisions, Advanced Companion, Destination Intelligence, personalization and Admin/Ops/monetization breadth.

### Phase 3 – JETNITY TRAVEL ECOSYSTEM

Native apps, Traveller Network, Creator/Partner Ecosystem, own data/intelligence assets and ordered international scaling.

## 3. Letzte verifizierte runtime-verändernde Main-Baseline

`6b5cf463664a41cd59bdfc7f83cbc43a982ea557`

Commit:

`Integrate World Map 1 (#423)`

World Map 1 closure evidence:

- Issue #419: **CLOSED / COMPLETED**;
- original Draft PR #422: exact accepted head `cbed98062120ce8be125db5870fd0f108b29a3c0`; GitHub reports it closed/merged after the same head entered `main` through recovery integration;
- rejected exact head `bf2936c9fb41a6e65ed4d29f573c2820c0a7e3dc`: Technical-Lead CHANGES REQUIRED review `5092964996`;
- accepted exact head `cbed98062120ce8be125db5870fd0f108b29a3c0`;
- Technical-Lead FINAL PASS review `5093273775`;
- recovery PR #423: **MERGED / SHA-LOCKED** on the accepted exact head;
- recovery CI #1710: **SUCCESS**;
- post-merge main CI #1711: **SUCCESS** on exact `6b5cf463...`;
- Vercel Production `dpl_XcCUqnsiVydSmJCQRbSBfGUvn7Ss`: **READY** on exact `6b5cf463...`;
- no active Cursor agent.

A later docs-only continuity merge may move repository `main`; **aktuelles `main` immer live neu lesen**.

## 4. Geschlossene V1-Kernflächen

### Flight Multi-Leg — CLOSED

- eine kanonische geordnete `legs[]`-Wahrheit;
- 1–6 Legs;
- One-Way, Return und Multi-City über denselben Contract;
- keine Providerwahl aus Request-Struktur oder Array-Reihenfolge.

### Flight 0..N Multi-Provider Orchestration — CLOSED

- 0..N unabhängige `FlugProvider` hinter der bestehenden Adapter-Naht;
- provider-lokale Evidence-/Failure-/`retrievedAt`-Wahrheit;
- globales provider- und provisionsneutrales Ranking nur über normalisierte `FlugOption[]`;
- kein Default/Primary aus Array-Reihenfolge;
- kein blindes Cross-Provider-Dedupe;
- Failure Isolation;
- browserseitig keine internen Raw-/Secret-/Timing-Evidence-Leaks;
- Production Flight bleibt hart fail-closed, solange reale Provider-Aktivierung nicht freigegeben ist.

### Destination Essentials 1 — CLOSED

- Presentation-only Zielzusammenfassung in der bestehenden Trip-Workspace-Übersicht;
- geordnete Stage-Identität bleibt kanonisch; doppelte Länder bleiben getrennte Stages;
- kein Country-/Visited-Inference;
- Destination Official ≠ Transit Official;
- `unknown` / `unavailable` / `stale` / `recheck_needed` ≠ `not_required`;
- Multi-Citizenship/Multi-Document bleibt option-/traveller-dependent, ohne Default-Pass;
- Safety/Seasonal nur über explizite Stage-Refs;
- kein neuer Provider, keine neue DB-Wahrheit und keine Commercial-Suche durch diese Oberfläche.

### World Map 1 / Planned Account Truth — CLOSED

- bounded `Deine Welt` surface auf authentifiziertem Account Home;
- nur bestehende `reisenLaden()` / `TripSummary` Account-Trip-Wahrheit;
- gespeicherte Stage-Felder `countryCode`, `placeId`, `latitude`, `longitude` werden fail-closed verwendet;
- Legacy-`TripSummaryStage { name, position }` bleibt gültig;
- nur gültige gespeicherte Koordinaten werden geplottet; nichts wird geocodiert oder geraten;
- exact non-empty `placeId` darf Anzeigeorte aggregieren, volle Trip-/Stage-Provenienz bleibt erhalten;
- mehrere beitragende Reisen bleiben über eindeutige `tripId` getrennt und explizit navigierbar;
- geplante Reise ≠ besuchter Ort; confirmed visited history bleibt nicht erfasst;
- kein externes Map-/Tile-/Geocoding-Runtime-System, keine neue laufende Kostenstelle;
- keine DB-/RLS-/Auth-/Provider-Mutation.

## 5. Provider Readiness / V1 Step 2

Repository foundations:

- S4: **CLOSED**
- S5-A: **INTEGRATED**
- S5-B: **PRODUCTION APPLIED / UNALLOCATED / 0 ROWS**
- S6-A repository foundation: **CLOSED**
- S7 Observability: **CLOSED**
- S8 usage-policy hooks: **CLOSED**
- Flight multi-leg contract: **CLOSED**
- Flight 0..N multi-provider orchestration: **CLOSED**

Do not build another generic Provider foundation merely for abstraction.

Production/live remains separately gated:

- provider-specific signup/application/contact/contract/DPA;
- Production S6 runtime/HMAC/>0 budget/binding;
- live secrets/API keys;
- paid/live calls;
- Commercial Provenance runtime writer;
- Production provider activation.

## 6. Provider selection und Anfragen sind bewusst vertagt

Product-Owner direction:

> **Provider-Anfragen werden auf die Seite gelegt; Jetnity wird provider-neutral weitergebaut. Welcher reale Provider oder welche mehreren Provider später genutzt werden, wird später entschieden.**

Therefore:

- KAYAK/Wego/Skyscanner/Duffel oder weitere geeignete Anbieter können später nebeneinander als Adapter existieren, sofern Contract/Access Truth das erlaubt;
- kein aktueller Kandidat ist Primary/Default;
- keine Kontaktaufnahme, Bewerbung, Terms-/DPA-/Vertragsannahme, Secret-Nutzung oder Live-Aktivierung ist aus dieser Entscheidung freigegeben;
- vendor-spezifische Annahmen dürfen nicht in den Flight Core einsickern.

## 7. Product-Owner gates A–E

Alle externen/Production-Gates bleiben **UNAPPROVED / CLOSED**:

- **A** — Provider-Anwendung, Signup, Kontakt oder Partner-Engagement;
- **B** — Production S6 apply/runtime/HMAC/>0 budget;
- **C** — Live-Secret und erster realer/paid Provider-Call;
- **D** — Commercial Provenance runtime writer/persistence;
- **E** — finale Production-Provider-Aktivierung.

Generic `weiter`, `bauen`, `start` oder Cursor-Autorisierung genehmigen keines dieser Gates.

## 8. Current work boundary

**No active Cursor coding agent. No active runtime Draft. No automatic follow-up slice.**

Destination Essentials 1 and World Map 1 are both closed on `main`. PR #394 and PR #422 must not be reactivated or interpreted as unfinished runtime work.

World Map visited/travel-history persistence remains deliberately separate and **was not opened** by World Map 1.

The next Technical-Lead cycle must first reconstruct live state and select the smallest responsible remaining provider-independent V1 gap. The Product Owner's general direction to keep building provider-neutrally does not bypass slice precheck, architecture/truth review or special gates.

TW-8 remains dependent on real Flight Commercial Truth and stays closed.

## 9. Hard Traveller truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.**

Never infer default/primary/preferred citizenship or passport, array position as semantic truth, Residence → Citizenship oder Issuer Country → Citizenship.

## 10. Truth classes

> **OFFICIAL TRUTH ≠ PROVIDER TRUTH ≠ JETNITY RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.**

`unknown ≠ not_required`. `unavailable ≠ not_required`. `stale ≠ current`. LLM ≠ Official Truth.

Planned/account-trip evidence ≠ visited.

## 11. Mandatory agent/review governance

Every material slice must:

1. reconstruct live truth;
2. identify the smallest responsible slice;
3. assess multi-agent suitability before dispatch;
4. persist task/ownership/session;
5. agents never mark Ready or merge;
6. changed heads invalidate prior exact-head gates;
7. CHANGES REQUIRED returns to the same logical agent/session;
8. final PASS and integration remain Technical-Lead-owned;
9. no automatic next slice.

## 12. Critical V1 gaps still open

Principally open:

- real Flight Commercial Truth / provider access and contract truth;
- TW-8/TW-9 after real Commercial Truth;
- real Hotel Commercial Truth;
- Activities real path or explicit launch exception if externally blocked;
- real Official Entry Requirements Evidence;
- Temporal Readiness on real evidence;
- broader Mobile/Desktop/PWA polish, accessibility and real-device QA;
- intelligent assistant V1 truth-aware closure;
- V1 account/privacy/legal/ops/monetization minimum;
- V1 Definition of Done and Release Readiness Gate.

Destination Essentials 1 and basic World Map 1 are **not** open gaps anymore. Any future expansion needs a new live precheck and separate bounded slice.

**LIVE-EVIDENCE WINS. FLIGHT MULTI-LEG CLOSED. FLIGHT MULTI-PROVIDER ORCHESTRATION CLOSED. DESTINATION ESSENTIALS 1 CLOSED. WORLD MAP 1 CLOSED ON MAIN. NO ACTIVE CURSOR AGENT. NO REAL PROVIDER SELECTED. PROVIDER CONTACTS + EXTERNAL/PRODUCTION A–E GATES CLOSED. NO AUTOMATIC NEXT SLICE.**
