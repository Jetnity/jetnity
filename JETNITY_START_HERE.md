# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 1. September 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / PHASE 1 JETNITY CORE CURRENT / THREE-PHASE STRATEGY CLOSED & POST-MERGE VERIFIED / NO ACTIVE RUNTIME SLICE / V1 BUILD ORDER BINDING / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Fail closed. Eine Reise, eine Wahrheit.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen.

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_THREE_PHASE_STRATEGY_CLOSED_2026-09-01.md` ← **aktueller Closure-/Continuity-Checkpoint**
2. `docs/ADR_0204_JETNITY_THREE_PHASE_PRODUCT_RELEASE_STRATEGY.md`
3. `docs/JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md`
4. `docs/JETNITY_V1_DEFINITION_OF_DONE_2026-09-01.md`
5. `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`
6. `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`
7. `docs/JETNITY_V1_PHASE1_GAP_ANALYSIS_2026-09-01.md`
8. `docs/JETNITY_THREE_PHASE_STRATEGY_RECONCILIATION_2026-09-01.md`
9. `docs/ACTIVE_WORK_STATUS.md`

Danach für dauerhafte Produkt-/Technologiegrundsätze:

10. `JETNITY_PRODUCT_MANDATE.md`
11. `JETNITY_VISION.md`
12. `docs/PRODUCT_QUALITY_STANDARD.md`
13. `docs/LOGIC_STANDARD.md`
14. `ARCHITECTURE.md`
15. `DECISIONS.md`
16. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
17. `JETNITY_HANDOFF.md`

Fachlich relevante aktuelle Handoffs/Reconciliations zusätzlich nach Workstream lesen.

Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Migration-/Persistenzfragen zusätzlich Supabase Production read-only prüfen.

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

Die langfristige Vision bleibt groß. Phase 2/3 sind aus dem Standard-V1-Launchpfad herausgenommen, nicht aus Jetnity gelöscht.

## 3. Current verified main before this docs-only closure

Strategy merge main:

`main@71bfd70b5e1edeb2b9852e44ea49bed89b56fb4d`

Commit:

`Integrate Jetnity three-phase product strategy (#361)`

Post-merge evidence:

- Main CI #1565 / Run `33452656519`: **COMPLETED / SUCCESS**;
- Vercel Production `dpl_A23YB4HhRKeBhxwLs2mP7vvrciRQ`: **READY** on exact merge SHA;
- Issue #357: **CLOSED / completed**;
- PR #361: **MERGED**;
- no runtime slice active;
- no provider activated;
- no Production database/security mutation from the strategy integration.

This continuity closure may advance canonical `main` again without changing runtime behavior. Always fetch live main rather than assuming the SHA above remains the repository tip.

## 4. V1 scope hierarchy

If older `ROADMAP.md`, `docs/JETNITY_BINDING_BUILD_ORDER.md` or historical technical “Phase 1/2/3” labels conflict about **what must be finished before V1**, use ADR-0204 and the new V1 strategy/build-order documents first.

Do **not** discard old technical/historical evidence. Real dependencies remain binding.

In particular:

- Provider Readiness S4–S8 remains required before real provider-live paths unless a later explicit Product-Owner decision changes it;
- correct Account/Traveller/Trip/Provider/Admin foundations are reused, not rebuilt;
- broad Admin/Growth/Native/Social/Creator/Marketplace scope is not automatically V1-blocking;
- Native Apps are Phase 3;
- Switzerland is the first controlled public market.

## 5. Strong current Phase-1 foundations

Do not rebuild merely because phase names changed:

- Trip Workspace through major pre-TW8 work;
- Guest → Account;
- Account Traveller Registry and trip-owned Traveller Snapshot;
- Multi-Citizenship / Multi-Document foundations and document lifecycle;
- Route / Transit / Multi-Destination truth;
- provider-neutral Flight / Hotel / Activity domains and secure adoption seams;
- Entry Requirements / Temporal Readiness foundations;
- Admin A–C / system health / security / provider-cost foundations;
- product quality, logic, security and continuity governance.

## 6. Critical V1 gaps

Current main gaps remain principally:

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

## 7. Hard product truth

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

## 8. Next technical work rule

**NO ACTIVE RUNTIME SLICE.**

`docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md` is the binding V1 critical path.

Provider Readiness still needs residual S4/S6/S7/S8 closure before real provider-live paths. **S6 Persistent Cost Guard remains a likely next candidate but is NOT started automatically.**

Every new runtime cycle must:

1. fetch live `main`, PRs/issues, CI/Vercel and relevant Production truth;
2. read the current V1 strategy/gap/build-order docs;
3. reconcile current Provider Readiness / dependencies;
4. identify exactly one smallest responsible Phase-1 slice;
5. version the task;
6. perform independent Technical-Lead exact-head review;
7. no merge without TL PASS;
8. no Product-Owner gate without explicit approval;
9. persist continuity.

## 9. Product-Owner gates

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

**LIVE-EVIDENCE WINS. AUDIT FIRST. REUSE BEFORE ADD. INTEGRATE BEFORE DUPLICATE. FAIL CLOSED.**
