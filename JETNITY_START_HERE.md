# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 2. September 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / PHASE 1 JETNITY CORE / V1 STEP 2 PROVIDER-NEUTRAL FLIGHT CORE CLOSED / MULTI-LEG CLOSED / MULTI-PROVIDER ORCHESTRATION CLOSED / PROVIDER SELECTION DEFERRED / NO REAL PROVIDER SELECTED OR ACTIVE / PRODUCTION S6 UNAPPLIED / EXTERNAL A–E GATES CLOSED / NO ACTIVE CURSOR AGENT / NO AUTOMATIC NEXT SLICE / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Fail closed. Eine Reise, eine Wahrheit.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Agenten-Session stehen.

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_V1_FLIGHT_MULTI_PROVIDER_ORCHESTRATION_CLOSED_2026-09-02.md` ← **aktueller Closure-Checkpoint**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`
4. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
5. `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`
6. `docs/CHATGPT_TECHNICAL_LEAD_V1_FLIGHT_PROVIDER_MULTILEG_CONTRACT_CLOSED_2026-09-01.md`
7. `docs/V1_FLIGHT_MULTI_PROVIDER_ORCHESTRATION_TASK_2026-09-01.md`
8. `docs/FLIGHT_KAYAK_WEGO_ACCESS_ATTRIBUTION_DUE_DILIGENCE_2026-09-01.md`
9. `docs/FLIGHT_PROVIDER_APPLICATION_READINESS_KAYAK_2026-09-01.md`
10. `docs/FLIGHT_PROVIDER_APPLICATION_READINESS_WEGO_2026-09-01.md`
11. `docs/FLIGHT_PROVIDER_CONTRACT_QUESTION_MATRIX_2026-09-01.md`
12. `docs/FLIGHT_METASEARCH_PROVIDER_ALTERNATIVES_PRECHECK_2026-09-01.md`
13. `docs/SKYSCANNER_APPLICATION_READINESS_PRECHECK_2026-09-01.md`
14. `docs/PROVIDER_READINESS_FINAL_RECHECK_2026-09-01.md`
15. `docs/JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md`
16. `docs/JETNITY_V1_DEFINITION_OF_DONE_2026-09-01.md`
17. `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`

Danach immer live verifizieren: aktuelles `main`, offene PRs/Issues, relevanter Branch/Head, Merge-Base/ahead/behind, Actions, Vercel, Review-Threads, aktiver Cursor-Status und betroffene Supabase-Production-Wahrheit.

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

`c3e4942d4ecfe4a960604b6314b7aa224997f60d`

Commit:

`V1 Flight provider-neutral multi-provider orchestration (#414)`

Diese SHA ist die verifizierte **Runtime-Integration-Baseline** für den abgeschlossenen Slice. Spätere docs-only Continuity-Merges können Repository-`main` weiterbewegen. **Aktuelles `main` immer live neu lesen.**

Post-Merge-Evidence:

- Issue #412: **CLOSED / COMPLETED**;
- Original Draft PR #413: **CLOSED / NOT MERGED** nur wegen des bekannten Draft→Ready-Connectorfehlers nach bestandenem TL-Review;
- Technical-Lead FINAL PASS: Review `5083897831` auf exakt `8cf2c256e8dfe582640602a82554be6e03cf25e0`;
- Recovery PR #414: **MERGED**, SHA-locked auf exakt diesem akzeptierten Head;
- Recovery CI #1690: **SUCCESS**;
- Main CI #1691: **SUCCESS** auf exakt `c3e4942d...`;
- Vercel: **SUCCESS** auf exakt `c3e4942d...`;
- kein aktiver Cursor-Agent für diesen Slice.

## 4. Flight Core – akzeptierter Zustand

### Multi-leg request truth — CLOSED

Jetnity Flight Search trägt provider-neutral:

- geordnete `legs[]`;
- 1–6 Legs;
- One-Way, Return und Multi-City über dieselbe kanonische Wahrheit;
- `stopPreference` lossless;
- Ranking-only `context` wird nicht als Provider-Suchwahrheit geleakt.

### Multi-provider orchestration — CLOSED

Jetnity Flight Search kann jetzt strukturell **0..N unabhängige `FlugProvider`** orchestrieren.

Binding invariants:

1. `FlugProvider` bleibt die Adapter-Naht; keine dritte Provider-Abstraktion.
2. Validierung und Nutzer-Rate-Limit laufen einmal pro Jetnity-Suche.
3. Provider werden unabhängig und failure-isolated aufgerufen.
4. Provider-eigene `retrievedAt`-/Evidence-/Failure-Wahrheit bleibt getrennt.
5. Kein Fake-Composite-`FlugProviderTreffer` und kein gemeinsamer erfundener Timestamp.
6. Nur normalisierte `FlugOption[]` gehen in ein globales Jetnity-Ranking.
7. Ranking ist provider- und provisionsneutral.
8. Array-Reihenfolge bedeutet nicht Default/Primary.
9. Ähnlich aussehende providerübergreifende Angebote werden nicht blind dedupliziert.
10. Globaler Ergebnis-Cap erfolgt erst nach globalem Ranking.
11. Ein Provider-Ausfall verwirft nicht die guten Ergebnisse eines anderen Providers.
12. Zero-provider bleibt kontrolliert `unavailable`.
13. Zero-usable-option `partial` verwendet wahrheitsgetreue neutrale Copy.
14. Browser erhält keine `retrievedAt`-/Timezone-/Instant-/Raw-/Secret-Evidence.
15. Globaler Flight-State ist vendor-neutral; Provider-Credentials bleiben in der jeweiligen Factory.
16. Production bleibt hart aus und `JETNITY_FLIGHT_AKTIV` bleibt fail-closed.

Heute ist weiterhin nur der bestehende Duffel-Testpfad tatsächlich konstruierbar. Das ist **keine** Product-Owner-Auswahl von Duffel für Production.

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

Do not build another generic Provider foundation merely for abstraction. New internal Flight work is justified only by fresh evidence of a concrete provider-neutral V1 gap.

Production/live remains separately gated:

- provider-specific signup/application/contract/DPA;
- Production S6 runtime/HMAC/>0 budget/binding;
- live secrets/API keys;
- paid/live calls;
- Commercial Provenance runtime writer;
- Production provider activation.

## 6. Provider selection is deliberately deferred

The Product Owner has explicitly decided:

> **Jetnity wird jetzt provider-neutral weitergebaut. Welchen realen Provider oder welche mehreren Provider Jetnity später nutzt, wird später entschieden.**

Therefore:

- KAYAK/Wego/Skyscanner/Duffel may later coexist as adapters if contract/access truth permits;
- no current candidate is a default/primary provider;
- no vendor-specific branch may leak into the Flight core merely to prepare a possible future integration;
- provider-specific adapter/runtime work still requires the relevant external/access truth and gate.

Internal due-diligence ordering remains evidence only, not selection.

## 7. Product-Owner gates A–E

All external/Production gates remain **UNAPPROVED**:

- **A-KAYAK / A-WEGO / A-SKYSCANNER / other A** — external application, signup, contact or partner engagement;
- **B** — Production S6 apply/runtime principal/HMAC/>0 budget;
- **C** — live provider secret + first bounded real/paid call;
- **D** — Commercial Provenance runtime writer/persistence;
- **E** — final Production provider activation.

Never infer these from generic `weiter`, `bauen`, `start` or agent authorization.

## 8. Current work boundary

**No active Cursor coding agent. No active Flight runtime PR. No automatic next slice.**

The next Technical-Lead cycle must reconstruct live truth and identify the smallest real remaining provider-neutral V1 gap before dispatching an agent.

Do not automatically start a provider-specific adapter merely because the multi-provider core is now ready.

Destination Essentials PR #394 remains **DEFERRED / STOPPED** and belongs to V1 Step 8. Do not resume it merely because Flight orchestration closed.

TW-8 still requires real Commercial Truth and remains closed until that dependency exists.

## 9. Hard Traveller truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.**

Never infer default/primary/preferred citizenship or passport, array position as semantic truth, Residence → Citizenship or Issuer Country → Citizenship.

## 10. Truth classes

> **OFFICIAL TRUTH ≠ PROVIDER TRUTH ≠ JETNITY RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.**

`unknown ≠ not_required`. `unavailable ≠ not_required`. `stale ≠ current`. LLM ≠ Official Truth.

## 11. Mandatory agent/review governance

Every material slice must:

1. reconstruct live truth;
2. identify the smallest responsible slice;
3. assess multi-agent suitability before dispatch;
4. use `MULTI_AGENT` only for disjoint ownership;
5. use `SINGLE_AGENT` when shared contracts create collision risk;
6. persist task/ownership/session;
7. agents never mark Ready or merge;
8. changed heads invalidate prior exact-head gates;
9. CHANGES REQUIRED returns to the same logical agent/session;
10. final PASS and integration remain Technical-Lead-owned.

GitHub Copilot is not a substitute for the binding Cursor coding-agent workflow.

## 12. Critical V1 gaps still open

Principally open:

- real Flight Commercial Truth / provider access and contract truth;
- TW-8/TW-9 after real Commercial Truth;
- real Hotel Commercial Truth;
- Activities real path or explicit launch exception if externally blocked;
- real Official Entry Requirements Evidence;
- Temporal Readiness on real evidence;
- Destination Essentials;
- basic World Map;
- broader Mobile/Desktop/PWA polish, accessibility and real-device QA;
- V1 privacy/legal/ops/monetization closure;
- V1 Definition of Done and Release Readiness Gate.

**LIVE-EVIDENCE WINS. FLIGHT MULTI-LEG CLOSED. FLIGHT MULTI-PROVIDER ORCHESTRATION CLOSED. NO ACTIVE AGENT. NO REAL PROVIDER SELECTED. EXTERNAL/PRODUCTION A–E GATES CLOSED. NO AUTOMATIC NEXT SLICE.**
