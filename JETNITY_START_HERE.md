# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 1. September 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / PHASE 1 JETNITY CORE / PROVIDER READINESS S4 CLOSED / NO ACTIVE RUNTIME SLICE / S6 NEXT SERIAL CANDIDATE / V1 BUILD ORDER BINDING / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Fail closed. Eine Reise, eine Wahrheit.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen.

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_READINESS_S4_CLOSED_2026-09-01.md` ← **aktueller Provider-Readiness-Closure-Checkpoint**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/ADR_0204_JETNITY_THREE_PHASE_PRODUCT_RELEASE_STRATEGY.md`
4. `docs/JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md`
5. `docs/JETNITY_V1_DEFINITION_OF_DONE_2026-09-01.md`
6. `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`
7. `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`
8. `docs/JETNITY_V1_PHASE1_GAP_ANALYSIS_2026-09-01.md`
9. `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`
10. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`

Danach dauerhaft relevante Grundlagen:

11. `JETNITY_PRODUCT_MANDATE.md`
12. `JETNITY_VISION.md`
13. `docs/PRODUCT_QUALITY_STANDARD.md`
14. `docs/LOGIC_STANDARD.md`
15. `ARCHITECTURE.md`
16. `DECISIONS.md`
17. `JETNITY_HANDOFF.md`

Fachlich relevante aktuelle Handoffs/Reconciliations zusätzlich nach Workstream lesen. Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Migration-/Persistenzfragen zusätzlich Supabase Production **read-only** prüfen.

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

## 3. Current verified runtime main

S4 final runtime main:

`main@9e34d36e0400da651db651cb08e0277b1d495e28`

Commit:

`Merge S4 Multi-Document parser order-independence fix (#372)`

Post-merge evidence:

- Main CI #1587 / Run `33458936508`: **COMPLETED / SUCCESS**;
- Vercel Production `dpl_3qC2iUDUWqYqBbLEXxvM2UZBTvD9`: **READY** on exact runtime main SHA;
- Issue #370: **CLOSED / COMPLETED**;
- Provider Readiness S4 final Technical-Lead live-main recheck: **PASS / CLOSED**;
- no provider activated;
- no Production database/security mutation from S4 closure work.

The docs-only S4 continuity closure may advance repository `main` beyond this runtime SHA. Always fetch live main rather than assuming this remains the tip.

## 4. Provider Readiness current state

### S4 — CLOSED

S4 now includes and has independently verified:

- Requirements timeout/signal/freshness and Readiness activation control;
- Safety server-owned Trip/Traveller truth;
- measured Readiness 8 KB body-cap decision;
- activation-time classification for Safety/Seasonal flags while factories remain hard-null;
- order-independent Multi-Document citizenship-link parsing.

The 8 KB cap is intentionally unchanged. It is not a current V1 blocker.

Safety/Seasonal hard-null factories remain fail-closed. Their additional kill-switch wrappers become mandatory when a real non-null provider path is introduced; S4 closure does not authorize such activation.

### Next binding sequence

`docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md` requires:

1. **S6 Persistent Cost Guard**;
2. S7 Observability;
3. S8 Cache/License/Operational hooks;
4. full Provider Readiness recheck;
5. only then Product-Owner-gated real provider paths.

**S6 is the next serial candidate, but no runtime S6 implementation is active at this checkpoint.**

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

- S6/S7/S8 Provider Readiness and final recheck;
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

- provider choice/signup/contract/DPA;
- API keys/secrets;
- paid/live provider calls;
- Production provider activation;
- Production migration / RLS / grant / role / function mutation and writer allocation;
- fundamental Auth/MFA/AAL changes;
- sensitive document/MRZ/scan/biometric/health storage;
- real payments;
- spend outside approved limits;
- public indexing/domain cutover/public launch.

## 10. Next-work rule

**NO ACTIVE RUNTIME SLICE.**

Before S6:

1. reconstruct live repository state after this closure;
2. inspect existing S1 cost-guard interfaces and current Admin/provider-cost foundations;
3. inspect relevant Supabase Production truth read-only;
4. determine whether S6 can be safely decomposed or must remain single-agent;
5. define the smallest S6 work that does not cross any Product-Owner gate;
6. version task/branch/PR topology;
7. use independent exact-head Technical-Lead review and post-merge verification.

**LIVE-EVIDENCE WINS. S4 CLOSED. S6 NEXT SERIAL CANDIDATE. NO REAL PROVIDER UNLOCKED.**
