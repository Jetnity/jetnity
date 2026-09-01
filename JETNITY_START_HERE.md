# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 1. September 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / PHASE 1 JETNITY CORE / PROVIDER READINESS FINAL RECHECK CLOSED / GENERIC PROVIDER FOUNDATION COMPLETE / PRODUCTION S6 UNAPPLIED / PWA-1 NEXT NON-GATED CODING SLICE / V1 BUILD ORDER BINDING / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Fail closed. Eine Reise, eine Wahrheit.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Agenten-Session stehen.

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_READINESS_FINAL_RECHECK_CLOSED_2026-09-01.md` ← **aktueller Provider-Readiness-Checkpoint**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/PROVIDER_READINESS_FINAL_RECHECK_2026-09-01.md`
4. `docs/PROVIDER_READINESS_FINAL_RECHECK_GATE_MATRIX_2026-09-01.md`
5. `docs/PROVIDER_READINESS_FIRST_REAL_PROVIDER_PO_DECISION_PACKAGE_2026-09-01.md`
6. `docs/ADR_0204_JETNITY_THREE_PHASE_PRODUCT_RELEASE_STRATEGY.md`
7. `docs/JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md`
8. `docs/JETNITY_V1_DEFINITION_OF_DONE_2026-09-01.md`
9. `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`
10. `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`
11. `docs/JETNITY_V1_PHASE1_GAP_ANALYSIS_2026-09-01.md`
12. `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`
13. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`

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

## 3. Current verified runtime main

`main@7c51b08e5af4ca4a37a4e3b3a08aef2fa145cab4`

Commit:

`Provider Readiness final recheck and first-provider decision package (#387)`

Post-merge evidence:

- Issue #386: **CLOSED / COMPLETED**;
- PR #387: **MERGED**;
- Main CI #1638 / Run `33489646333`: **COMPLETED / SUCCESS**;
- Vercel Production `dpl_7YrbBUFAEDXKpZtS1TENfF8c8Tkb`: **READY** on exact main SHA;
- no provider selected or activated;
- no Production DB/security mutation from the recheck.

This docs-only continuity closure may advance repository main. Always re-fetch live main.

## 4. Provider Readiness final state

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

### First provider recommendation

Flights remain the first Commercial Truth domain. Skyscanner Flights Live Prices is the current Technical-Lead recommendation for **commercial due diligence first**; Duffel live remains a strong alternative.

This is a recommendation only. The Product Owner has **not selected or approved** a provider.

## 5. Product-Owner decisions A–D

All remain **UNAPPROVED**:

- **A** — provider/Skyscanner due diligence, signup or partner engagement;
- **B** — Production S6 apply/runtime principal/HMAC/>0 budget;
- **C** — live provider secret + first bounded real/paid call;
- **D** — Commercial Provenance runtime writer/persistence.

Never infer these from a generic “weiter”, “starten” or agent authorization.

## 6. Current next non-gated coding slice

**PWA-1 – Installability / App Icons / Privacy-Safe Shell** is the next selected Phase-1 candidate while the provider path waits at PO/external gates.

### PWA-1 live starting evidence

- `app/manifest.ts` already exists;
- root metadata already links `/manifest.webmanifest`;
- `app/icon.svg` is the current Jetnity brand mark;
- manifest currently has no installability icon set;
- no service worker/offline cache path is currently present.

### PWA-1 boundaries

- coding agent implements;
- Technical Lead owns scope, independent review, Ready and merge;
- preserve current Jetnity brand mark; **no generic airplane icon**;
- add professional installability assets/contracts only;
- **no service worker in PWA-1**;
- **no offline caching of account/trip/traveller data**;
- no push/notification permission flow;
- no DB/Auth/provider/payment work;
- no public launch/indexing change;
- no new dependency unless strictly justified and reviewed.

A dedicated versioned PWA-1 issue/branch/PR is mandatory.

## 7. Hard Traveller truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.**

Never infer default/primary/preferred citizenship or passport, array position as semantic truth, Residence → Citizenship or Issuer Country → Citizenship.

## 8. Truth classes

> **OFFICIAL TRUTH ≠ PROVIDER TRUTH ≠ JETNITY RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.**

`unknown ≠ not_required`. `unavailable ≠ not_required`. `stale ≠ current`. LLM ≠ Official Truth.

## 9. Mandatory Multi-Agent Suitability Check

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

## 10. Product-Owner gates

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

## 11. Critical V1 gaps

Still principally open:

- real Flight Commercial Truth — PO/vendor gated;
- TW-8/TW-9 after real Commercial Truth;
- real Hotel Commercial Truth;
- Activities real path or explicit PO launch exception if externally blocked;
- real Official Entry Requirements Evidence;
- Temporal Readiness on real evidence;
- Destination Essentials;
- basic World Map;
- **PWA installability/readiness**;
- V1 privacy/legal/ops/monetization closure;
- V1 Definition of Done and V1 Release Readiness Gate.

**LIVE-EVIDENCE WINS. PROVIDER RECHECK CLOSED. PRODUCTION S6 UNAPPLIED. PWA-1 NEXT NON-GATED CODING SLICE. NO REAL PROVIDER UNLOCKED.**
