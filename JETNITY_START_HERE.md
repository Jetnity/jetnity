# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 1. September 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / PHASE 1 JETNITY CORE / S4 CLOSED / S6-A REPOSITORY FOUNDATION CLOSED & POST-MERGE VERIFIED / PRODUCTION S6 UNAPPLIED / NO ACTIVE RUNTIME SLICE / V1 BUILD ORDER BINDING / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Fail closed. Eine Reise, eine Wahrheit.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen.

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_READINESS_S6A_CLOSED_2026-09-01.md` ← **aktueller Provider-Readiness-Closure-Checkpoint**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_READINESS_S4_CLOSED_2026-09-01.md`
4. `docs/ADR_0204_JETNITY_THREE_PHASE_PRODUCT_RELEASE_STRATEGY.md`
5. `docs/JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md`
6. `docs/JETNITY_V1_DEFINITION_OF_DONE_2026-09-01.md`
7. `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`
8. `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`
9. `docs/JETNITY_V1_PHASE1_GAP_ANALYSIS_2026-09-01.md`
10. `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`
11. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`

Danach dauerhaft relevante Grundlagen:

12. `JETNITY_PRODUCT_MANDATE.md`
13. `JETNITY_VISION.md`
14. `docs/PRODUCT_QUALITY_STANDARD.md`
15. `docs/LOGIC_STANDARD.md`
16. `ARCHITECTURE.md`
17. `DECISIONS.md`
18. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Migration-/Persistenzfragen zusätzlich Supabase Production **read-only** prüfen, solange kein aktuelles Product-Owner-Gate ausdrücklich eine Mutation freigibt.

## 2. Product-Owner binding phases

### Phase 1 – JETNITY CORE — CURRENT

Die konkrete Reise zuverlässig planbar, organisiert und reisebereit machen.

V1 wird erst veröffentlicht, wenn:

> **PRODUCTION READY FOR REAL TRAVELLERS.**

Feature Complete allein reicht nicht.

### Phase 2 – JETNITY COMPLETE TRAVEL PLATFORM

Breitere Providerlandschaft, tiefere Reiseentscheidungen, Advanced Companion, Destination Intelligence, Personalisierung, Admin/Ops Pro, Monetarisierungs- und Growth-Breite.

### Phase 3 – JETNITY TRAVEL ECOSYSTEM

Native Apps, Traveller Network, Creator/Partner Ecosystem, eigene Data Assets/Intelligence und geordnete internationale Skalierung.

Phase 2/3 sind aus dem Standard-V1-Launchpfad herausgenommen, nicht aus Jetnity gelöscht.

## 3. Current verified main

S6-A repository-foundation merge:

`main@dfae0f05e6ffa2c8d6e1739bf41a91c31f504199`

Commit:

`Provider Readiness S6-A persistent cost guard foundation (#376)`

Post-merge evidence:

- Main CI #1601 / Run `33461631088`: **COMPLETED / SUCCESS**;
- Vercel Production `dpl_HtfLjZ6tgsDs7bUdSJfMbtpRLkQV`: **READY** on exact main SHA;
- PR #376: **MERGED**;
- Issue #375: **CLOSED / COMPLETED**;
- no provider activated;
- no Production database/security mutation from S6-A.

Fresh read-only Production Supabase evidence after the merge shows all S6-A Production objects absent, including the runtime gate, policy/reservation tables, reservation function and writer role. Migration `20260901020000_provider_cost_guard_s6a.sql` is therefore **UNAPPLIED TO PRODUCTION**.

This docs-only closure may advance `main` again. Always fetch live main instead of assuming the SHA above remains the repository tip.

## 4. Provider Readiness current state

### S4 — CLOSED

Requirements/Safety truth-ops, body-cap/activation decision and Multi-Document order-independence are integrated and independently verified.

### S6-A — REPOSITORY FOUNDATION CLOSED & POST-MERGE VERIFIED

Repository foundation now contains:

- persistent Cost Guard migration contract, hard-off by default;
- no active cost policies;
- atomic caller/domain/global reservation semantics;
- internal least-privilege capability/function contract;
- server-only persistence adapter with injected port;
- domain-separated identifier HMAC;
- DB-clock/fail-closed semantics;
- regression/security contract tests.

### Production S6 — UNAPPLIED / GATED

S6-A is **not** Production activation. Still absent/unallocated:

- Production migration apply;
- Production runtime/login principal;
- Production role membership;
- HMAC secret;
- >0 live budgets/cost policies;
- runtime binding to the persistent DB port;
- provider activation;
- paid/live calls.

### S7 / S8

- S7 Observability: **NOT STARTED**
- S8 Cache/License/Operational hooks: **NOT STARTED**

Do not auto-start S7 from this checkpoint.

## 5. Hard Traveller truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.**

Never infer:

- default/primary/preferred Citizenship;
- default/primary/preferred Passport;
- `documents[0]` / `evaluations[0]` as truth;
- Residence → Citizenship;
- Issuer Country → Citizenship.

Multi-Document order must not change semantic truth or citizenship links.

## 6. Truth classes

> **OFFICIAL TRUTH ≠ PROVIDER TRUTH ≠ JETNITY RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.**

`unknown ≠ not_required`. `unavailable ≠ not_required`. `stale ≠ current`. LLM ≠ Official Truth.

Commercial Provider Truth may never silently become Official Entry/Safety Truth.

## 7. Critical V1 gaps

Still principally open:

- operational Provider Readiness completion: Production-S6 decision, S7, S8 and final recheck;
- real Flight Commercial Truth;
- real Hotel Commercial Truth;
- real Activities path or explicit Product-Owner launch exception if externally blocked;
- real Official Entry Requirements Evidence;
- Temporal Readiness runtime based on real evidence;
- TW-8/TW-9 and complete core-journey closure;
- Destination Essentials;
- basic World Map;
- explicit PWA scope/readiness;
- V1-specific privacy/legal/operations/monetization closure;
- V1 Definition of Done;
- V1 Release Readiness Gate.

## 8. Mandatory Multi-Agent Suitability Check

Every new material work cycle must:

1. fetch live `main`, PRs/issues, CI/Vercel and relevant Production truth;
2. identify the smallest responsible Phase-1 slice;
3. assess safe multi-agent decomposition before agent dispatch;
4. use `MULTI_AGENT` only for disjoint, independently reviewable workstreams with explicit ownership and merge order;
5. use `SINGLE_AGENT` when parallel writers would share truth/schema/security/contracts or create integration risk;
6. persist the decision in task/PR/continuity;
7. Cursor agents never Ready or merge;
8. changed heads invalidate old exact-head gates;
9. final integration remains Technical-Lead-owned.

## 9. Product-Owner gates

Explicit Product-Owner approval remains required before relevant:

- Production migration apply / RLS / grants / roles / functions;
- runtime/login principal allocation;
- provider choice/signup/contract/DPA;
- API keys/secrets;
- >0 live provider budgets and paid/live provider calls;
- Production provider activation;
- fundamental Auth/MFA/AAL changes;
- sensitive document/MRZ/scan/biometric/health storage;
- real payments;
- spend outside approved limits;
- public indexing/domain cutover/public launch.

## 10. Next-work rule

**NO ACTIVE RUNTIME SLICE.**

Before the next Provider Readiness task:

1. reconstruct live main/PRs/issues/CI/Vercel and relevant Production truth;
2. re-read the S6-A closure and binding V1 order;
3. decide whether the smallest responsible next step is a separately Product-Owner-gated Production-S6 activation step or a repository-only S7 step that can safely proceed while Production S6 remains hard-off;
4. perform the mandatory Multi-Agent Suitability Check;
5. version the task/branch/PR topology;
6. do not infer any Product-Owner gate from this closure;
7. use independent exact-head Technical-Lead review and post-merge verification.

**LIVE-EVIDENCE WINS. S6-A REPOSITORY FOUNDATION CLOSED. PRODUCTION S6 UNAPPLIED. S7 NOT STARTED. NO REAL PROVIDER UNLOCKED.**
