# Jetnity – Active Work Status

Stand: 1. September 2026  
Status: **CURRENT / PHASE 1 JETNITY CORE / V1 STEP 2 / DRAFT-PR #403 MULTILEG CONTRACT RECONCILIATION AWAITING TL REVIEW / PWA-1 CLOSED / PROVIDER READINESS CLOSED / GENERIC PROVIDER FOUNDATION COMPLETE / PRODUCTION S6 UNAPPLIED / NO REAL PROVIDER SELECTED OR ACTIVE / EXTERNAL A-GATES CLOSED / NO AUTOMATIC NEXT SLICE / LIVE-EVIDENCE WINS**

## 1. Current verified runtime baseline

Runtime implementation baseline before the docs-only V1-Step-2 due-diligence chain:

`main@bce4b13cdd4a08247b9cb2bec45c5995c1939b65`

Commit:

`Phase 1 PWA-1 installability (#391)`

Post-merge verified:

- Issue #389: **CLOSED / COMPLETED**;
- PR #390: **CLOSED / NOT MERGED**;
- PR #391: **MERGED**;
- Main CI #1647 / Run `33496652255`: **COMPLETED / SUCCESS**;
- Vercel Production `dpl_HtB7523gee5bfuTsRTKWVkkm8zwk`: **READY** on exact runtime main;
- `/manifest.webmanifest`, all required PWA PNG icons and Apple icon: **HTTP 200**;
- `/sw.js`: **HTTP 404**;
- Production error/fatal logs: none observed;
- unresolved Vercel toolbar threads on `main`: none;
- indexing remains `noindex, nofollow`;
- no Production DB/security/provider/payment mutation from PWA-1.

Later Flight-provider decision/readiness/precheck work is documentation/due-diligence only and may advance repository `main` without changing runtime behavior. Always re-fetch live main.

## 2. Current product phase

**PHASE 1 – JETNITY CORE**

Goal:

> Make the concrete trip reliably plannable, organized and travel-ready.

V1 launches only when:

> **PRODUCTION READY FOR REAL TRAVELLERS.**

Feature Complete alone is not sufficient.

## 3. Canonical current documents

Read first:

1. `docs/V1_FLIGHT_PROVIDER_MULTILEG_CONTRACT_CR1_HANDOFF_2026-09-01.md` ← **current Draft-PR #403 CR-1 exact-head handoff**
2. `docs/V1_FLIGHT_PROVIDER_MULTILEG_CONTRACT_RECONCILIATION_TASK_2026-09-01.md`
3. `docs/FLIGHT_METASEARCH_PROVIDER_ALTERNATIVES_PRECHECK_2026-09-01.md`
4. `docs/SKYSCANNER_APPLICATION_READINESS_PRECHECK_2026-09-01.md`
5. `docs/FLIGHT_PROVIDER_PRODUCT_OWNER_DECISION_PACKAGE_2026-09-01.md`
6. `docs/ACTIVE_WORK_STATUS.md`
7. `docs/CHATGPT_TECHNICAL_LEAD_PWA_1_CLOSED_2026-09-01.md`
8. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_READINESS_FINAL_RECHECK_CLOSED_2026-09-01.md`
9. `docs/PROVIDER_READINESS_FINAL_RECHECK_2026-09-01.md`
10. `docs/PROVIDER_READINESS_FINAL_RECHECK_GATE_MATRIX_2026-09-01.md`
11. `docs/PROVIDER_READINESS_FIRST_REAL_PROVIDER_PO_DECISION_PACKAGE_2026-09-01.md`
12. `docs/ADR_0204_JETNITY_THREE_PHASE_PRODUCT_RELEASE_STRATEGY.md`
13. `docs/JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md`
14. `docs/JETNITY_V1_DEFINITION_OF_DONE_2026-09-01.md`
15. `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`
16. `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`
17. `docs/JETNITY_V1_PHASE1_GAP_ANALYSIS_2026-09-01.md`
18. `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`
19. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`

## 4. PWA-1 final state

**PWA-1 – Installability / App Icons / Privacy-Safe Shell: CLOSED.**

Accepted outcome:

- manifest `id` / `scope` and standards-aligned icon contract;
- 192×192 / 512×512 PNG application icons;
- distinct opaque padded maskable 512×512 icon using the current Jetnity mark;
- Apple touch icon and Apple web-app metadata;
- deterministic installability and maskable-safe-zone tests;
- no service worker/offline cache/IndexedDB/push;
- no DB/Auth/provider/payment/indexing/native-app architecture change.

Governance recovery:

- early inherited history included GitHub Copilot due a prior workflow anomaly;
- accepted work was independently Technical-Lead reviewed;
- implementation continuity used Cursor logical agent `Jetnity PWA installability 1`, Generation 1, session `bc-bd39a000-8566-4822-b1ea-cc0e442b5aa3`;
- Copilot assignment was removed before merge;
- GitHub self-APPROVE is not permitted for the authenticated repository owner, so the exact-head Technical-Lead PASS was recorded as a review COMMENT without bypassing any repository rule;
- SHA-locked merge completed successfully.

Do not use GitHub Copilot as a substitute coding agent for the binding Jetnity Technical Lead → Cursor Agent workflow.

## 5. Provider Readiness and V1 Step 2 state

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
- provider signup/application/contract/DPA;
- live API secret;
- paid/live provider calls;
- Commercial Provenance real runtime writer;
- Production provider activation.

Flights remain the first Commercial Truth domain.

Current Technical-Lead **internal due-diligence ordering**, based on public evidence only:

1. **KAYAK Affiliate Network Flights API** — live multi-provider search/referral fit, explicit start-up positioning, sandbox request path, no public MAU minimum found in reviewed materials;
2. **Wego Affiliate/Metasearch API** — live search/polling, Wego/provider deeplinks and affiliate commission; public policy requires >=5% Search-to-Click;
3. **Skyscanner Flights Live Prices** — strong architecture/product fit but current public 100K-MAU threshold is not evidenced for Jetnity;
4. **Travelfusion** — strong metasearch/content fit but sales/licence gated;
5. **Duffel live** — technically accessible but booking/seller-oriented and therefore not an automatic fit for Jetnity's neutral referral model.

This ordering is **not** a Product-Owner provider selection. No application/registration/contact has been made.

## 6. Product-Owner decisions A–E remain unapproved

- **A-KAYAK / A-WEGO / A-SKYSCANNER / other A** — provider-specific external application, registration, signup or partner engagement. Current Product Owner instruction permits internal checking/preparation only and explicitly forbids submission/contact;
- **B** — Production S6 apply/runtime/HMAC/>0 budget;
- **C** — selected live provider secret + first bounded real/paid call;
- **D** — Commercial Provenance runtime writer/persistence;
- **E** — final Production provider activation.

No current instruction implicitly approves any of these.

## 7. Current active work boundary

**Active Draft-PR only:** Issue #402 / PR #403 / `feat/v1-flight-provider-multileg-contract` — provider-neutral Flight request multi-leg reconciliation (ADR-0207). SINGLE_AGENT Generation 1, same session `bc-b592d931-3ecb-4cec-b250-ab19a19930b1`. Technical-Lead CHANGES REQUIRED `5078055105` rejected `3d544fa6` because `stopPreference` was dropped. CR-1 restores canonical `FlugStoppPraeferenz` on the shared request. Draft stays Draft. No Ready, no merge, no follow-up slice.

Do not treat gates on `3d544fa6` as current. CR-1 review-fix `8c26ea87` restores `stopPreference`. Exact gated handoff head: `3cee8aba6b2117c3291594ea794f1074ff125df9`. Live review tip: PR #403 / `docs/V1_FLIGHT_PROVIDER_MULTILEG_CONTRACT_CR1_HANDOFF_2026-09-01.md`.

This is **not** a provider selection, application, secret, network, Duffel-runtime or Skyscanner-promotion slice.

V1 Step 1 generic Provider Readiness remains closed. Broader V1 Step 2 remains blocked by external provider-access/commercial truth.

Product Owner currently allows public-source/internal preparation only. Therefore:

1. no KAYAK/Wego/Skyscanner/Duffel runtime adapter may start before the relevant provider-specific A-gate and access/terms truth;
2. no Production S6, secret, paid/live call, writer or activation is allowed;
3. TW-8 remains closed until real Commercial Truth exists;
4. Destination Essentials Draft PR #394 remains deferred because it belongs to V1 Step 8;
5. no later V1 slice may be pulled forward just to avoid the Step-2 dependency;
6. this slice only reconciles the already-existing `FlightProviderSearchRequest` onto canonical ordered 1–6-leg truth, including lossless `stopPreference`.

## 8. Hard Traveller truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.**

Never infer default/primary/preferred citizenship or passport, array position as truth, Residence → Citizenship or Issuer Country → Citizenship.

## 9. Mandatory Multi-Agent Suitability Check

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

## 10. Product-Owner gates

Explicit approval remains required before relevant:

- Production migration/RLS/grant/role/function mutation;
- runtime/login principal allocation;
- provider choice/signup/application/contract/DPA;
- API keys/secrets;
- >0 live budgets/paid calls/provider activation;
- fundamental Auth/MFA/AAL changes;
- sensitive passport/MRZ/scan/biometric/health storage;
- real payments;
- spend outside approved limits;
- public indexing/domain cutover/public launch.

## 11. Critical V1 gaps still open

Principally open after PWA-1:

- real Flight Commercial Truth — current V1 Step 2, PO/vendor-access gated;
- TW-8/TW-9 after real Commercial Truth;
- real Hotel Commercial Truth;
- Activities real path or explicit PO launch exception if externally blocked;
- real Official Entry Requirements Evidence;
- Temporal Readiness on real evidence;
- Destination Essentials;
- basic World Map;
- broader Mobile/Desktop/PWA release polish, accessibility and real-device QA;
- V1 privacy/legal/ops/monetization closure;
- V1 Definition of Done and Release Readiness Gate.

**LIVE-EVIDENCE WINS. PWA-1 CLOSED. PROVIDER READINESS CLOSED. V1 STEP 2 ACCESS DUE DILIGENCE CURRENT. PRODUCTION S6 UNAPPLIED. NO PROVIDER SELECTED. EXTERNAL A-GATES CLOSED. NO AUTOMATIC NEXT SLICE.**
