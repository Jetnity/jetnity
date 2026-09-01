# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 1. September 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / PHASE 1 JETNITY CORE / V1 STEP 2 MULTI-LEG CONTRACT CLOSED / PROVIDER ACCESS DUE DILIGENCE CURRENT / PWA-1 CLOSED / PROVIDER READINESS CLOSED / PRODUCTION S6 UNAPPLIED / NO REAL PROVIDER SELECTED OR ACTIVE / EXTERNAL A-GATES CLOSED / NO AUTOMATIC NEXT SLICE / V1 BUILD ORDER BINDING / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Fail closed. Eine Reise, eine Wahrheit.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Agenten-Session stehen.

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_V1_FLIGHT_PROVIDER_MULTILEG_CONTRACT_CLOSED_2026-09-01.md` ← **aktueller Closure-Checkpoint**
2. `docs/V1_FLIGHT_PROVIDER_MULTILEG_CONTRACT_CR1_HANDOFF_2026-09-01.md` ← historische Exact-Head-Implementation-Evidence
3. `docs/V1_FLIGHT_PROVIDER_MULTILEG_CONTRACT_RECONCILIATION_TASK_2026-09-01.md`
4. `docs/FLIGHT_METASEARCH_PROVIDER_ALTERNATIVES_PRECHECK_2026-09-01.md`
5. `docs/SKYSCANNER_APPLICATION_READINESS_PRECHECK_2026-09-01.md`
6. `docs/FLIGHT_PROVIDER_PRODUCT_OWNER_DECISION_PACKAGE_2026-09-01.md`
7. `docs/ACTIVE_WORK_STATUS.md`
8. `docs/CHATGPT_TECHNICAL_LEAD_PWA_1_CLOSED_2026-09-01.md`
9. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_READINESS_FINAL_RECHECK_CLOSED_2026-09-01.md`
10. `docs/PROVIDER_READINESS_FINAL_RECHECK_2026-09-01.md`
11. `docs/PROVIDER_READINESS_FINAL_RECHECK_GATE_MATRIX_2026-09-01.md`
12. `docs/PROVIDER_READINESS_FIRST_REAL_PROVIDER_PO_DECISION_PACKAGE_2026-09-01.md`
13. `docs/ADR_0204_JETNITY_THREE_PHASE_PRODUCT_RELEASE_STRATEGY.md`
14. `docs/JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md`
15. `docs/JETNITY_V1_DEFINITION_OF_DONE_2026-09-01.md`
16. `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`
17. `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`
18. `docs/JETNITY_V1_PHASE1_GAP_ANALYSIS_2026-09-01.md`
19. `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`
20. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`

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

Last runtime-changing verified main baseline for this completed slice:

`ee3232666a2cee4012f36bb5405fd69c441fffaa`

Commit:

`Integrate V1 flight provider multi-leg contract reconciliation (#404)`

This SHA is the verified **runtime-integration baseline**, not a promise that the repository's current `main` still equals this SHA. Later continuity-only merges can advance repository `main` without changing runtime behavior. **Always re-fetch live `main` before acting.**

Post-merge verified for the runtime slice:

- Issue #402: **CLOSED / COMPLETED**;
- original Draft-PR #403: **CLOSED / NOT MERGED** only because Draft → Ready failed through the GitHub connector;
- recovery PR #404: **MERGED** from exact accepted head `0841b9bfd89dcc9cc70ce708050e6e45caef478c`;
- Recovery CI #1673: **SUCCESS** on exact accepted head;
- Main CI #1674 / Run `33511905623`: **COMPLETED / SUCCESS** on exact runtime-integration commit `ee323266...`;
- Vercel: **SUCCESS** on exact runtime-integration commit;
- provider-neutral Flight request now uses ordered 1–6 `legs[]` and preserves canonical `stopPreference` while excluding ranking-only `context`;
- existing Duffel runtime was not rewritten;
- Skyscanner remains fixture-only / non-promotable;
- no Supabase/DB/Auth/provider activation/payment mutation from this slice;
- no Product-Owner provider gate was opened.

PWA-1 remains separately **CLOSED** and its installability evidence remains valid historical runtime evidence.

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

## 5. Provider Readiness and V1 Step 2 current state

### Repository level

- S4: **CLOSED**
- S5-A: **INTEGRATED**
- S5-B: **PRODUCTION APPLIED / UNALLOCATED / 0 ROWS**
- S6-A repository foundation: **CLOSED**
- S7: **CLOSED**
- S8: **CLOSED**
- provider-neutral Flight multi-leg contract reconciliation: **CLOSED / MERGED / POST-MERGE VERIFIED**

Do not build another universal/generic Provider foundation without new evidence. Do not rebuild the multi-leg request reconciliation.

### Production/live level

Still hard-off / separately Product-Owner gated:

- Production S6 migration/runtime/HMAC/>0 budget/binding;
- provider selection/signup/contract/DPA;
- live secrets/API keys;
- paid/live calls;
- Commercial Provenance runtime writer allocation;
- Production provider activation.

Flights remain the first Commercial Truth domain. Current public-evidence due-diligence priority is now:

1. **KAYAK Affiliate Network Flights API** — strongest current combination of explicit start-up positioning, live multi-provider flight comparison, affiliate/deeplink monetisation and no published MAU floor found in reviewed public material;
2. **Wego Affiliate/Metasearch API** — very strong live-search/deeplink/commission fit; public policy requires at least 5% Search-to-Click;
3. **Skyscanner Flights Live Prices** — excellent long-term fit, but currently publishes a 100K-MAU low-traffic access threshold that Jetnity has not evidenced;
4. **Travelfusion** — credible sales-led metasearch/content fallback;
5. **Duffel live** — technical fallback only because its search-and-book/seller model conflicts with Jetnity's intended neutral referral posture.

This ordering is **internal due diligence only**, not Product-Owner provider selection. No provider has been contacted or applied to.

## 6. Product-Owner decisions A–E

All remain **UNAPPROVED** for external/Production action:

- **A-KAYAK / A-WEGO / A-SKYSCANNER / other A** — provider-specific external application, registration, signup or partner engagement; Product Owner currently permits internal checking/preparation only;
- **B** — Production S6 apply/runtime principal/HMAC/>0 budget;
- **C** — selected live provider secret + first bounded real/paid call;
- **D** — Commercial Provenance runtime writer/persistence;
- **E** — final Production provider activation.

Never infer these from a generic “weiter”, “starten” or agent authorization.

## 7. Current work boundary

**There is no active Cursor coding agent and no automatically authorized next coding slice.**

V1 Step 1 Provider Readiness is closed. The provider-neutral Flight multi-leg request reconciliation was integrated by runtime merge `ee3232666a2cee4012f36bb5405fd69c441fffaa` and is closed. Later continuity-only merges may advance repository `main`; live `main` must always be re-fetched. Broader V1 Step 2 is now blocked at provider access/commercial terms rather than missing generic Jetnity route-request code.

Therefore:

1. no KAYAK/Wego/Skyscanner/Duffel runtime adapter should start before the relevant provider-specific A-gate/access truth;
2. no Production S6, secret, paid/live call, writer or provider activation is implied;
3. TW-8 remains closed until real Commercial Truth exists;
4. Destination Essentials PR #394 is deferred because Destination Essentials belongs to V1 Step 8, not the current serial Step 2 path;
5. internal evidence, application-readiness and cost/rate-limit/licence mapping may continue when useful without external action;
6. do not reopen or rebuild the completed multi-leg contract slice unless new live evidence proves a defect.

No later V1 slice may be pulled forward merely to avoid this Product-Owner/external dependency.

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
- provider choice/signup/application/contract/DPA;
- API keys/secrets;
- >0 live budgets, paid/live calls and provider activation;
- fundamental Auth/MFA/AAL changes;
- sensitive passport/MRZ/scan/biometric/health storage;
- real payments;
- spend outside approved limits;
- public indexing/domain cutover/public launch.

## 12. Critical V1 gaps still open

Principally open after the multi-leg contract closure:

- real Flight Commercial Truth — current V1 Step 2, PO/vendor-access gated;
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

**LIVE-EVIDENCE WINS. PWA-1 CLOSED. PROVIDER READINESS CLOSED. MULTI-LEG CONTRACT CLOSED. V1 STEP 2 ACCESS DUE DILIGENCE CURRENT. PRODUCTION S6 UNAPPLIED. NO PROVIDER SELECTED. EXTERNAL A-GATES CLOSED. NO AUTOMATIC NEXT SLICE.**
