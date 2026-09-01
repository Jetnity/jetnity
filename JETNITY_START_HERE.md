# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 1. September 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / PHASE 1 JETNITY CORE / S4 CLOSED / S6-A REPOSITORY FOUNDATION CLOSED / PRODUCTION S6 UNAPPLIED / S7 CLOSED / S8 CLOSED & POST-MERGE VERIFIED / FULL PROVIDER READINESS RECHECK NEXT / V1 BUILD ORDER BINDING / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Fail closed. Eine Reise, eine Wahrheit.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Agenten-Session stehen.

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_READINESS_S8_CLOSED_2026-09-01.md` ← **aktueller Provider-Readiness-Closure-Checkpoint**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_READINESS_S7_CLOSED_2026-09-01.md`
4. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_READINESS_S6A_CLOSED_2026-09-01.md`
5. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_READINESS_S4_CLOSED_2026-09-01.md`
6. `docs/ADR_0204_JETNITY_THREE_PHASE_PRODUCT_RELEASE_STRATEGY.md`
7. `docs/JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md`
8. `docs/JETNITY_V1_DEFINITION_OF_DONE_2026-09-01.md`
9. `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`
10. `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`
11. `docs/JETNITY_V1_PHASE1_GAP_ANALYSIS_2026-09-01.md`
12. `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`
13. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`

Then read the relevant domain handoffs/contracts for the current workstream and re-fetch GitHub/CI/Vercel live. For DB/security/persistence questions inspect Supabase Production read-only unless a current explicit Product-Owner approval allows mutation.

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

`main@bab1f6354f07c6efb2674d0d00d6b0b3f1667460`

Commit:

`Provider Readiness S8 fail-closed usage policy hooks (#384)`

Post-merge evidence:

- Main CI #1634 / Run `33485417536`: **COMPLETED / SUCCESS**;
- Vercel Production `dpl_FHr7GaKqCnC14z2zuXmjj8aqqD8y`: **READY** on exact main SHA;
- Issue #382: **CLOSED / COMPLETED**;
- PR #384: **MERGED**;
- original PR #383: **CLOSED / NOT MERGED** because of the known Draft→Ready connector error;
- no provider activated;
- no Production DB/security mutation from S8.

This docs-only S8 continuity closure may advance repository `main`. Always fetch live main.

## 4. Provider Readiness current state

### S4 — CLOSED

Truth/activation foundations, Safety server-owned Trip/Traveller truth, body-cap decision and Multi-Document order-independence are integrated and verified.

### S6-A — REPOSITORY FOUNDATION CLOSED / PRODUCTION UNAPPLIED

Persistent Provider Cost Guard foundation exists in repository, but Production remains hard-off/unapplied. No runtime principal, HMAC secret, >0 live policy or persistent Production runtime binding exists from S6-A.

### S7 — CLOSED & POST-MERGE VERIFIED

S7 delivers payload-safe best-effort provider observability and truthful health derivation. Key invariants:

- no request/search/trip/traveller/citizenship/document/secret/provider-response payload in events;
- sink failure cannot alter user/domain truth;
- no/stale/non-finite evidence cannot become fake green;
- `invalid` request/schema events do not manufacture or displace Provider Health;
- Safety/Seasonal checked-empty sentinel truth is operationally `checked_empty` with `resultCount: 0`;
- no external monitoring SaaS or provider ping was introduced.

### S8 — CLOSED & POST-MERGE VERIFIED

S8 delivers the provider-neutral usage-policy hook for cache, persistence and attribution truth:

- unverified/default = `forbidden / forbidden / null / null`;
- `attributionRequired` is `true | false | null`; `null` means unknown/unverified;
- current providers without an explicit policy hook remain hard fail-closed;
- malformed/throwing adapter policy access cannot create permissions;
- existing `Cache-Control: private, no-store` remains unchanged;
- S8 claims no provider-specific license, ToS or redisplay right;
- Commercial Provenance remains distinct from license/cache permission truth.

Binding S8 Multi-Agent decision was **SINGLE_AGENT**. The Technical Lead performed S8 directly; no Cursor implementation agent was used.

## 5. Next: full Provider Readiness recheck

**NO ACTIVE RUNTIME OR REAL-PROVIDER SLICE.**

The next responsible action is a fresh full Provider Readiness recheck. It must determine, from live evidence, whether any repository-only blocker remains and which external/Product-Owner gates still prevent a real V1 provider path.

The recheck must include:

1. live `main`, PRs/issues and CI/Vercel;
2. S4/S6-A/S7/S8 foundations;
3. relevant Production persistence/security truth read-only;
4. current provider candidate matrix and current external contract/API evidence where material;
5. exact V1 blocker list and recommended next smallest safe slice.

Production S6 remains unapplied/hard-off until separately approved.

## 6. Hard Traveller truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.**

Never infer default/primary/preferred citizenship or passport, array position as semantic truth, Residence → Citizenship or Issuer Country → Citizenship.

## 7. Truth classes

> **OFFICIAL TRUTH ≠ PROVIDER TRUTH ≠ JETNITY RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.**

`unknown ≠ not_required`. `unavailable ≠ not_required`. `stale ≠ current`. LLM ≠ Official Truth.

## 8. Critical V1 gaps

Still principally open:

- full Provider Readiness recheck and exact remaining live blockers;
- real Flight Commercial Truth;
- real Hotel Commercial Truth;
- Activities real path or explicit PO launch exception if externally blocked;
- real Official Entry Requirements Evidence;
- Temporal Readiness on real evidence;
- TW-8/TW-9 and full core journey;
- Destination Essentials;
- basic World Map;
- explicit PWA readiness;
- V1 privacy/legal/ops/monetization closure;
- V1 Definition of Done and V1 Release Readiness Gate.

## 9. Mandatory Multi-Agent Suitability Check

Every new material work cycle must:

1. reconstruct live truth;
2. identify the smallest responsible Phase-1 slice;
3. assess safe multi-agent decomposition before dispatch;
4. use `MULTI_AGENT` only for genuinely disjoint ownership with explicit merge order;
5. use `SINGLE_AGENT` when shared truth/schema/security/contracts make parallel writers unsafe;
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

## 11. Next-work rule

**NO ACTIVE RUNTIME SLICE AT THIS CLOSURE CHECKPOINT.**

Do not interpret S8 closure as permission to activate a provider. First perform the full Provider Readiness recheck and version any next provider or repository slice separately.

**LIVE-EVIDENCE WINS. S8 CLOSED. PRODUCTION S6 UNAPPLIED. FULL PROVIDER READINESS RECHECK NEXT. NO REAL PROVIDER UNLOCKED.**
