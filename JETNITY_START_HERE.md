# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 1. September 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / PHASE 1 JETNITY CORE / PWA-1 CLOSED / PROVIDER READINESS CLOSED / PRODUCTION S6 UNAPPLIED / NO REAL PROVIDER ACTIVE / NO AUTOMATIC NEXT SLICE / V1 BUILD ORDER BINDING / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Fail closed. Eine Reise, eine Wahrheit.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Agenten-Session stehen.

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_PWA_1_CLOSED_2026-09-01.md` ← **aktueller Phase-1-Continuity-Checkpoint**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_READINESS_FINAL_RECHECK_CLOSED_2026-09-01.md`
4. `docs/PROVIDER_READINESS_FINAL_RECHECK_2026-09-01.md`
5. `docs/PROVIDER_READINESS_FINAL_RECHECK_GATE_MATRIX_2026-09-01.md`
6. `docs/PROVIDER_READINESS_FIRST_REAL_PROVIDER_PO_DECISION_PACKAGE_2026-09-01.md`
7. `docs/ADR_0204_JETNITY_THREE_PHASE_PRODUCT_RELEASE_STRATEGY.md`
8. `docs/JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md`
9. `docs/JETNITY_V1_DEFINITION_OF_DONE_2026-09-01.md`
10. `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`
11. `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`
12. `docs/JETNITY_V1_PHASE1_GAP_ANALYSIS_2026-09-01.md`
13. `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`
14. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`

Then read the relevant domain handoff/task for the current workstream and re-fetch GitHub/CI/Vercel live. For DB/security/persistence questions inspect Supabase Production read-only unless a current explicit Product-Owner approval allows mutation.

## 2. Product-Owner binding phases

### Phase 1 – JETNITY CORE — CURRENT

Die konkrete Reise zuverlässig planbar, organisiert und reisebereit machen.

V1 launches only when:

> **PRODUCTION READY FOR REAL TRAVELLERS.**

Feature Complete alone is not enough.

### Phase 2 – JETNITY COMPLETE TRAVEL PLATFORM

Provider breadth, deeper travel decisions, Advanced Companion, Destination Intelligence, personalization and Admin/Ops/monetization breadth.

### Phase 3 – JETNITY TRAVEL ECOSYSTEM

Native apps, Traveller Network, Creator/Partner Ecosystem, own data/intelligence assets and ordered international scaling.

## 3. Current verified runtime baseline

Runtime implementation baseline before this docs-only continuity closure:

`main@bce4b13cdd4a08247b9cb2bec45c5995c1939b65`

Commit:

`Phase 1 PWA-1 installability (#391)`

Post-merge verified:

- Issue #389: **CLOSED / COMPLETED**;
- original Draft-PR #390: **CLOSED / NOT MERGED**;
- recovery PR #391: **MERGED**;
- Main CI #1647 / Run `33496652255`: **COMPLETED / SUCCESS** on exact runtime main;
- Vercel Production `dpl_HtB7523gee5bfuTsRTKWVkkm8zwk`: **READY** on exact runtime main;
- Production PWA manifest/icons/Apple icon: **HTTP 200** with expected content types;
- `/sw.js`: **HTTP 404** — no service worker introduced;
- Production error/fatal logs: none observed;
- unresolved Vercel toolbar threads: none;
- public indexing boundary remains `noindex, nofollow`;
- no Supabase/DB/Auth/provider/payment mutation from PWA-1.

This docs-only continuity closure may advance repository `main` beyond the runtime baseline without changing runtime behavior. **Always re-fetch live main.**

## 4. PWA-1 final state

**PWA-1 – Installability / App Icons / Privacy-Safe Shell: CLOSED.**

Integrated:

- manifest `id` / `scope`;
- 192×192 and 512×512 app icons;
- distinct opaque padded maskable 512×512 icon using the current Jetnity mark;
- Apple touch icon and Apple web-app metadata;
- deterministic installability and maskable-safe-zone tests.

Not introduced:

- service worker or offline cache;
- IndexedDB persistence or caching of account/trip/traveller data;
- push/notification permissions;
- DB/Auth/provider/payment changes;
- public launch/indexing change;
- native-app architecture change.

Governance note: early inherited history contained GitHub Copilot work due a prior workflow anomaly. Accepted work was independently Technical-Lead reviewed and completed through the bound Cursor continuity. Do not use GitHub Copilot as a substitute for the Jetnity Cursor coding-agent workflow.

## 5. Provider Readiness final state

### Repository level

- S4: **CLOSED**
- S5-A: **INTEGRATED**
- S5-B: **PRODUCTION APPLIED / UNALLOCATED / 0 ROWS**
- S6-A repository foundation: **CLOSED**
- S7: **CLOSED**
- S8: **CLOSED**

Do not build another universal/generic Provider foundation without new evidence.

### Production/live level

Still hard-off / separately Product-Owner gated:

- Production S6 migration/runtime/HMAC/>0 budget/binding;
- provider selection/signup/contract/DPA;
- live secrets/API keys;
- paid/live calls;
- Commercial Provenance runtime writer allocation;
- Production provider activation.

Flights remain the first Commercial Truth domain. Skyscanner Flights Live Prices remains the current Technical-Lead recommendation for commercial due diligence first; Duffel live remains a strong alternative. This is a recommendation only, not a Product-Owner selection.

## 6. Product-Owner decisions A–D

All remain **UNAPPROVED**:

- **A** — provider/Skyscanner due diligence, signup or partner engagement;
- **B** — Production S6 apply/runtime principal/HMAC/>0 budget;
- **C** — live provider secret + first bounded real/paid call;
- **D** — Commercial Provenance runtime writer/persistence.

Never infer these from a generic “weiter”, “starten” or agent authorization.

## 7. Current work boundary

**There is no automatically authorized next coding slice after a closed slice.**

The currently versioned non-gated Phase-1 coding slice is Destination Essentials 1 (Issue #393 / Draft PR on `feat/phase-1-destination-essentials-1`). It must stop for Technical-Lead review and must not Ready/merge itself.

PWA-1 is closed. Provider work waits at Product-Owner/external gates. Before any further non-gated Phase-1 implementation:

1. reconstruct live truth;
2. read the binding V1 build order and current gap analysis;
3. run a fresh Binding Slice Precheck;
4. run the mandatory Multi-Agent Suitability Check;
5. select the smallest responsible Phase-1 slice;
6. persist task/ownership before coding;
7. coding is performed by the selected Cursor agent; Technical Lead independently reviews and owns merge.

Do not infer a follow-up slice from the PWA-1 merge.

## 8. Hard Traveller truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.**

Never infer default/primary/preferred citizenship or passport, array position as semantic truth, Residence → Citizenship or Issuer Country → Citizenship.

## 9. Truth classes

> **OFFICIAL TRUTH ≠ PROVIDER TRUTH ≠ JETNITY RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.**

`unknown ≠ not_required`. `unavailable ≠ not_required`. `stale ≠ current`. LLM ≠ Official Truth.

## 10. Mandatory Multi-Agent Suitability Check

Every new material work cycle must:

1. reconstruct live truth;
2. identify the smallest responsible Phase-1 slice;
3. assess safe multi-agent decomposition before dispatch;
4. use `MULTI_AGENT` only for genuinely disjoint ownership with explicit merge order;
5. use `SINGLE_AGENT` when shared surfaces/contracts create collision risk;
6. persist the decision;
7. agents never Ready or merge;
8. changed heads invalidate prior exact-head gates;
9. final integration is Technical-Lead-owned.

## 11. Product-Owner gates

Explicit Product-Owner approval remains required before relevant:

- Production migration/RLS/grant/role/function mutation;
- runtime/login principal allocation;
- provider choice/signup/contract/DPA;
- API keys/secrets;
- >0 live budgets, paid/live calls and provider activation;
- fundamental Auth/MFA/AAL changes;
- sensitive passport/MRZ/scan/biometric/health storage;
- real payments;
- spend outside approved limits;
- public indexing/domain cutover/public launch.

## 12. Critical V1 gaps still open

Principally open after PWA-1:

- real Flight Commercial Truth — PO/vendor gated;
- TW-8/TW-9 after real Commercial Truth;
- real Hotel Commercial Truth;
- Activities real path or explicit PO launch exception if externally blocked;
- real Official Entry Requirements Evidence;
- Temporal Readiness on real evidence;
- Destination Essentials;
- basic World Map;
- broader Mobile/Desktop/PWA release polish and accessibility/real-device QA;
- V1 privacy/legal/ops/monetization closure;
- V1 Definition of Done and V1 Release Readiness Gate.

**LIVE-EVIDENCE WINS. PWA-1 CLOSED. PROVIDER RECHECK CLOSED. PRODUCTION S6 UNAPPLIED. NO AUTOMATIC NEXT SLICE. NO REAL PROVIDER UNLOCKED.**
