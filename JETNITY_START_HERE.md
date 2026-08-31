# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 1. September 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / PHASE 1 JETNITY CORE / THREE-PHASE STRATEGY INTEGRATION / NO ACTIVE RUNTIME SLICE / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Fail closed. Eine Reise, eine Wahrheit.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen.

## 1. Für Produktphase und V1-Scope zuerst lesen

1. `docs/ADR_0204_JETNITY_THREE_PHASE_PRODUCT_RELEASE_STRATEGY.md`
2. `docs/JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md`
3. `docs/JETNITY_V1_DEFINITION_OF_DONE_2026-09-01.md`
4. `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`
5. `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`
6. `docs/JETNITY_V1_PHASE1_GAP_ANALYSIS_2026-09-01.md`
7. `docs/JETNITY_THREE_PHASE_STRATEGY_RECONCILIATION_2026-09-01.md`
8. `docs/ACTIVE_WORK_STATUS.md`

Danach für dauerhafte Produkt-/Technologiegrundsätze:

9. `JETNITY_PRODUCT_MANDATE.md`
10. `JETNITY_VISION.md`
11. `docs/PRODUCT_QUALITY_STANDARD.md`
12. `docs/LOGIC_STANDARD.md`
13. `ARCHITECTURE.md`
14. `DECISIONS.md`
15. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
16. `JETNITY_HANDOFF.md`

Fachlich relevante aktuelle Handoffs/Reconciliations zusätzlich nach Workstream lesen.

## 2. Product-Owner binding product phases

### Phase 1 – JETNITY CORE — **CURRENT**

Die konkrete Reise zuverlässig planbar und reisebereit machen.

V1 wird nach Phase 1 veröffentlicht, aber erst wenn:

> **PRODUCTION READY FOR REAL TRAVELLERS.**

Feature Complete allein reicht nicht.

### Phase 2 – JETNITY COMPLETE TRAVEL PLATFORM

Breitere Providerlandschaft, tiefere Reiseentscheidungen, Advanced Companion, Destination Intelligence, Personalisierung, Admin/Ops Pro, Monetarisierungs- und Growth-Breite.

### Phase 3 – JETNITY TRAVEL ECOSYSTEM

Native Apps, Traveller Network, Creator/Partner Ecosystem, eigene Data Assets/Intelligence und geordnete internationale Skalierung.

## 3. Current verified baseline before strategy integration

`main@6891cab6b204e6e6093a7002d7cad9b4afc692cc`

Commit:

`Close Provider Activation Readiness Precheck continuity (#356)`

Verified:

- Main CI #1562 / Run `33450057614`: **SUCCESS**;
- Provider Activation Readiness Precheck: **CLOSED & POST-MERGE VERIFIED**;
- no active runtime slice;
- no provider activated;
- S6 was the next identified Provider Readiness candidate only, **not started**.

Always fetch live `main` before work. The SHA above is evidence for the start of the strategy integration, not permission to assume it stays current.

## 4. Current planning carrier

Issue:

**#357 – Jetnity 3-Phase Product Strategy – V1 scope, Definition of Done and Release Readiness**

Branch:

`docs/jetnity-three-phase-v1-strategy-2026-09-01`

Type:

**docs-only Product-Owner/Technical-Lead strategy integration.**

No Cursor runtime agent. No S6/runtime start from this branch.

## 5. V1 scope hierarchy

If older `ROADMAP.md`, `JETNITY_BINDING_BUILD_ORDER.md` or historical technical “Phase 1/2/3” labels conflict about **what must be finished before V1**, use ADR-0204 and the new V1 strategy/build-order documents first.

Do **not** discard their technical/historical evidence. Real dependencies remain binding.

In particular:

- Provider Readiness S4–S8 remains required before real provider-live paths unless a later explicit PO decision changes it;
- correct Account/Traveller/Trip/Provider/Admin foundations are reused, not rebuilt;
- broad Admin/Growth/Native/Social/Creator/Marketplace scope is not automatically V1-blocking;
- Native Apps are Phase 3;
- Switzerland is the first controlled public market.

## 6. Hard product truth

Traveller:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.**

Never infer:

- default/primary/preferred Citizenship;
- default/primary/preferred Passport;
- `documents[0]` / `evaluations[0]` as truth;
- Residence → Citizenship;
- Issuer Country → Citizenship.

Truth classes:

> **OFFICIAL TRUTH ≠ PROVIDER TRUTH ≠ JETNITY RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.**

`unknown ≠ not_required`. `unavailable ≠ not_required`. `stale ≠ current`. LLM ≠ Official Truth.

## 7. Product-Owner gates

Explicit Product-Owner approval remains required before relevant:

- provider choice/contract/DPA;
- API keys/secrets;
- paid/live provider calls;
- Production provider activation;
- Production DB/security mutations and writer allocation;
- fundamental Auth/MFA/AAL changes;
- sensitive document/MRZ/scan/biometric/health storage;
- real payments;
- spend outside approved limits;
- public indexing/domain cutover/public launch.

## 8. Work rule

At the start of every new runtime or architecture work cycle:

1. fetch live `main`, PRs/issues, CI/Vercel and relevant Production truth;
2. read the current V1 strategy/gap/build-order docs;
3. identify the smallest responsible Phase-1 slice;
4. version the task;
5. independent Technical-Lead exact-head review;
6. no merge without TL PASS;
7. no Product-Owner gate without explicit approval;
8. persist continuity.

**LIVE-EVIDENCE WINS.**
