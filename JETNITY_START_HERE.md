# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 2. September 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / PHASE 1 JETNITY CORE / FLIGHT MULTI-LEG + 0..N MULTI-PROVIDER CORE CLOSED / DESTINATION ESSENTIALS 1 CLOSED ON MAIN / PROVIDER SELECTION + EXTERNAL CONTACT DEFERRED / NO REAL PROVIDER ACTIVE / PRODUCTION S6 UNAPPLIED / EXTERNAL A–E GATES CLOSED / NO ACTIVE CURSOR AGENT / NO AUTOMATIC NEXT SLICE / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Fail closed. Eine Reise, eine Wahrheit.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Agenten-Session stehen.

## 1. Zuerst lesen

1. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md` ← **binding Technical-Lead/Cursor operating standard**
2. `docs/CHATGPT_TECHNICAL_LEAD_DESTINATION_ESSENTIALS_1_CLOSED_2026-09-02.md` ← **latest runtime closure checkpoint**
3. `docs/ACTIVE_WORK_STATUS.md`
4. `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-02.md` ← transition history; live evidence and newer closure docs supersede stale current-state passages
5. `docs/CHATGPT_TECHNICAL_LEAD_V1_FLIGHT_MULTI_PROVIDER_ORCHESTRATION_CLOSED_2026-09-02.md`
6. `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`
7. `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`
8. `docs/FLIGHT_KAYAK_WEGO_ACCESS_ATTRIBUTION_DUE_DILIGENCE_2026-09-01.md`
9. `docs/FLIGHT_PROVIDER_APPLICATION_READINESS_KAYAK_2026-09-01.md`
10. `docs/FLIGHT_PROVIDER_APPLICATION_READINESS_WEGO_2026-09-01.md`
11. `docs/FLIGHT_PROVIDER_CONTRACT_QUESTION_MATRIX_2026-09-01.md`
12. `docs/SKYSCANNER_APPLICATION_READINESS_PRECHECK_2026-09-01.md`
13. `docs/PROVIDER_READINESS_FINAL_RECHECK_2026-09-01.md`
14. `docs/JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md`
15. `docs/JETNITY_V1_DEFINITION_OF_DONE_2026-09-01.md`
16. `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`

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

`3beef65bb1e7ed2921c9f9f3010e685b06076401`

Commit:

`Integrate Destination Essentials 1 (#417)`

Diese SHA ist die verifizierte Runtime-Integration-Baseline. Ein späterer docs-only Continuity-Merge kann Repository-`main` weiterbewegen. **Aktuelles `main` immer live neu lesen.**

Post-Merge-Evidence:

- Issue #393: **CLOSED / COMPLETED**;
- original Draft PR #394: **CLOSED / NOT MERGED** nur wegen des bekannten GitHub-Connectorfehlers beim Draft→Ready-Schritt;
- Technical-Lead FINAL PASS: Review `5091873148` auf exakt `ba1b446789538a6c1db5c41b42e9529d286d1969`;
- Recovery PR #417: **MERGED / SHA-LOCKED** auf exakt diesem Head;
- Recovery CI #1700: **SUCCESS**;
- Main CI #1701: **SUCCESS** auf exakt `3beef65b...`;
- Vercel Production `dpl_E8i5RC5oCuEE9N995okfSw4yQkJt`: **READY** auf exakt `3beef65b...`;
- kein aktiver Cursor-Agent.

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
- globaler Result-Cap nach Ranking;
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
- validierte Official Actions bleiben von Source-Links getrennt;
- kein neuer Provider, keine neue DB-Wahrheit und keine Commercial-Suche durch diese Oberfläche.

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

Destination Essentials 1 ist auf `main` abgeschlossen. PR #394 darf nicht wieder als aktiver Slice interpretiert werden; die akzeptierte Integration lief über Recovery PR #417.

Aktiver Draft auf dem Feature-Branch, nicht auf `main`:

- World Map 1 / Planned Account Truth
- Issue #419 / Draft PR #422
- Branch `feat/phase-1-world-map-1-planned-truth`
- Binding `docs/WORLD_MAP_1_PLANNED_TRUTH_TASK_2026-09-02.md`
- Cursor-Agent `Jetnity world map 1`, Generation 1
- kein Ready, kein Merge, kein Folgeslice

Live-Status: `docs/ACTIVE_WORK_STATUS.md`.

TW-8 bleibt von realer Flight Commercial Truth abhängig und geschlossen.

## 9. Hard Traveller truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.**

Never infer default/primary/preferred citizenship or passport, array position as semantic truth, Residence → Citizenship oder Issuer Country → Citizenship.

## 10. Truth classes

> **OFFICIAL TRUTH ≠ PROVIDER TRUTH ≠ JETNITY RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.**

`unknown ≠ not_required`. `unavailable ≠ not_required`. `stale ≠ current`. LLM ≠ Official Truth.

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
- basic World Map;
- broader Mobile/Desktop/PWA polish, accessibility and real-device QA;
- intelligent assistant V1 truth-aware closure;
- V1 account/privacy/legal/ops/monetization minimum;
- V1 Definition of Done and Release Readiness Gate.

Destination Essentials 1 is **not** an open gap anymore; future expansion beyond this bounded surface requires a new live precheck and explicit new slice.

**LIVE-EVIDENCE WINS. FLIGHT MULTI-LEG CLOSED. FLIGHT MULTI-PROVIDER ORCHESTRATION CLOSED. DESTINATION ESSENTIALS 1 CLOSED ON MAIN. NO ACTIVE CURSOR AGENT. NO REAL PROVIDER SELECTED. PROVIDER CONTACTS + EXTERNAL/PRODUCTION A–E GATES CLOSED. NO AUTOMATIC NEXT SLICE.**
