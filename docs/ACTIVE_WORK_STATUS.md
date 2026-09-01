# Jetnity – Active Work Status

Stand: 1. September 2026  
Status: **CURRENT / PHASE 1 JETNITY CORE / PROVIDER READINESS FINAL RECHECK CLOSED / GENERIC PROVIDER FOUNDATION COMPLETE / PRODUCTION S6 UNAPPLIED / NO REAL PROVIDER ACTIVE / PWA-1 NEXT NON-GATED CODING SLICE / LIVE-EVIDENCE WINS**

## 1. Current verified main

`main@7c51b08e5af4ca4a37a4e3b3a08aef2fa145cab4`

Commit:

`Provider Readiness final recheck and first-provider decision package (#387)`

Post-merge verified:

- Issue #386: **CLOSED / COMPLETED**;
- PR #387: **MERGED**;
- Main CI #1638 / Run `33489646333`: **COMPLETED / SUCCESS**;
- Vercel Production `dpl_7YrbBUFAEDXKpZtS1TENfF8c8Tkb`: **READY** on exact main SHA;
- no provider selected or activated;
- no Production DB/security mutation from the recheck.

This continuity branch can advance `main`. Always re-fetch live main.

## 2. Current product phase

**PHASE 1 – JETNITY CORE**

Goal:

> Make the concrete trip reliably plannable, organized and travel-ready.

V1 launches only when:

> **PRODUCTION READY FOR REAL TRAVELLERS.**

Feature Complete alone is not sufficient.

## 3. Canonical current documents

Read first:

1. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_READINESS_FINAL_RECHECK_CLOSED_2026-09-01.md` ← **current Provider Readiness checkpoint**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/PROVIDER_READINESS_FINAL_RECHECK_2026-09-01.md`
4. `docs/PROVIDER_READINESS_FINAL_RECHECK_GATE_MATRIX_2026-09-01.md`
5. `docs/PROVIDER_READINESS_FIRST_REAL_PROVIDER_PO_DECISION_PACKAGE_2026-09-01.md`
6. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_READINESS_S8_CLOSED_2026-09-01.md`
7. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_READINESS_S7_CLOSED_2026-09-01.md`
8. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_READINESS_S6A_CLOSED_2026-09-01.md`
9. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_READINESS_S4_CLOSED_2026-09-01.md`
10. `docs/ADR_0204_JETNITY_THREE_PHASE_PRODUCT_RELEASE_STRATEGY.md`
11. `docs/JETNITY_V1_DEFINITION_OF_DONE_2026-09-01.md`
12. `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`
13. `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`
14. `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`
15. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`

## 4. Provider Readiness state

### Repository foundations

- S4: **CLOSED**
- S5-A Commercial Provenance contract: **INTEGRATED**
- S5-B persistence: **PRODUCTION APPLIED / UNALLOCATED / 0 ROWS**
- S6-A repository Cost Guard: **CLOSED**
- S7 Observability: **CLOSED**
- S8 usage-policy hooks: **CLOSED**

No new generic Provider Readiness abstraction should be built without fresh evidence.

### Production/live state

Still intentionally closed:

- Production S6 migration apply;
- runtime/login principal allocation;
- HMAC secret;
- >0 provider budget/policy;
- persistent Cost Guard runtime binding;
- provider signup/contract/DPA;
- live API secret;
- paid/live provider calls;
- Commercial Provenance real runtime writer;
- Production provider activation.

### First provider recommendation

Flights remain the first Commercial Truth domain.

Skyscanner Flights Live Prices is the current Technical-Lead recommendation for **due diligence first**; Duffel live remains the technical alternative. This is **not** a Product-Owner provider selection.

## 5. Product-Owner decisions A–D remain unapproved

- **A** — provider/Skyscanner due diligence/signup/partner engagement;
- **B** — Production S6 apply/runtime/HMAC/>0 budget;
- **C** — live provider secret + first bounded real/paid call;
- **D** — Commercial Provenance runtime writer/persistence.

No current instruction implicitly approves any of these.

## 6. Current active work boundary

Provider work waits at Product-Owner/external gates. Phase-1 work may continue on non-gated V1 gaps.

**Selected next coding candidate: PWA-1 – installability / app icons / privacy-safe shell.**

Mandatory PWA-1 boundaries:

- implementation by a coding agent, not Technical Lead;
- Technical Lead owns task definition, independent exact-head review, Ready and merge;
- no service worker/offline cache in PWA-1;
- no caching account/trip/traveller data;
- no push/notification permissions;
- no DB/Auth/provider/payment change;
- no public launch/indexing change;
- reuse current Jetnity brand mark; no generic airplane icon.

PWA-1 must be versioned as its own issue/branch/PR from fresh canonical main.

## 7. Hard Traveller truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.**

Never infer default/primary/preferred citizenship or passport, array position as truth, Residence → Citizenship or Issuer Country → Citizenship.

## 8. Mandatory Multi-Agent Suitability Check

For every material slice:

1. reconstruct live truth;
2. identify the smallest responsible slice;
3. assess safe parallelization before agent dispatch;
4. use `MULTI_AGENT` only for disjoint, independently reviewable ownership;
5. use `SINGLE_AGENT` when shared surfaces/contracts create collision risk;
6. persist ownership and merge order;
7. agents never Ready/merge;
8. changed heads invalidate previous exact-head gates;
9. final integration remains Technical-Lead-owned.

## 9. Product-Owner gates

Explicit approval remains required before relevant:

- Production migration/RLS/grant/role/function mutation;
- runtime/login principal allocation;
- provider choice/signup/contract/DPA;
- API keys/secrets;
- >0 live budgets/paid calls/provider activation;
- fundamental Auth/MFA/AAL changes;
- sensitive passport/MRZ/scan/biometric/health storage;
- real payments;
- spend outside approved limits;
- public indexing/domain cutover/public launch.

## 10. Critical V1 gaps

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
- V1 Definition of Done and Release Readiness Gate.

**LIVE-EVIDENCE WINS. PROVIDER RECHECK CLOSED. PRODUCTION S6 UNAPPLIED. PWA-1 IS THE NEXT NON-GATED CODING CANDIDATE. NO REAL PROVIDER UNLOCKED.**
