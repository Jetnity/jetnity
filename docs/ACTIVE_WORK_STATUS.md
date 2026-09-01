# Jetnity – Active Work Status

Stand: 2. September 2026  
Status: **CURRENT / PHASE 1 JETNITY CORE / V1 STEP 2 PROVIDER-NEUTRAL FLIGHT CORE CLOSED / MULTI-LEG CLOSED / MULTI-PROVIDER ORCHESTRATION CLOSED / PROVIDER SELECTION DEFERRED / NO ACTIVE CURSOR AGENT / NO REAL PROVIDER SELECTED OR ACTIVE / PRODUCTION S6 UNAPPLIED / EXTERNAL A–E GATES CLOSED / DESTINATION ESSENTIALS #394 DEFERRED / NO AUTOMATIC NEXT SLICE / LIVE-EVIDENCE WINS**

## 1. Latest verified runtime integration

Last runtime-changing verified main baseline for the completed Flight orchestration slice:

`c3e4942d4ecfe4a960604b6314b7aa224997f60d`

Commit:

`V1 Flight provider-neutral multi-provider orchestration (#414)`

This is the verified runtime-integration baseline, not a permanent claim that repository `main` still equals this SHA. Docs-only continuity merges can advance `main`. Always fetch live `main` before acting.

Verified closure:

- Issue #412: **CLOSED / COMPLETED**;
- original Draft PR #413: **CLOSED / NOT MERGED** only because the known Draft→Ready connector error blocked the mechanical transition after review;
- FINAL Technical-Lead PASS: review `5083897831` on exact head `8cf2c256e8dfe582640602a82554be6e03cf25e0`;
- recovery PR #414: **MERGED / SHA-LOCKED** from exact accepted head;
- Recovery CI #1690: **SUCCESS**;
- Main CI #1691: **SUCCESS** on `c3e4942d...`;
- Vercel: **SUCCESS** on `c3e4942d...`;
- no active Cursor agent remains for #412.

Canonical closure checkpoint:

`docs/CHATGPT_TECHNICAL_LEAD_V1_FLIGHT_MULTI_PROVIDER_ORCHESTRATION_CLOSED_2026-09-02.md`

## 2. Current product phase

**PHASE 1 – JETNITY CORE**

Goal:

> Make the concrete trip reliably plannable, organized and travel-ready.

V1 launches only when:

> **PRODUCTION READY FOR REAL TRAVELLERS.**

Feature Complete alone is not sufficient.

## 3. Flight provider-neutral core state

### Request contract

**CLOSED / MERGED / POST-MERGE VERIFIED**

- canonical ordered `legs[]`;
- 1–6 legs;
- One-Way / Return / Multi-City through one request truth;
- canonical `stopPreference` preserved;
- ranking-only context stays outside provider request truth.

### Multi-provider orchestration

**CLOSED / MERGED / POST-MERGE VERIFIED**

Accepted runtime behavior:

- 0..N independent `FlugProvider` adapters;
- no fake composite provider result;
- provider-local `retrievedAt`, evidence and failure truth;
- combined normalized `FlugOption[]` only;
- one global provider/provision-neutral ranking;
- result cap after ranking;
- no implicit primary/default provider from array order;
- no blind cross-provider itinerary dedupe;
- provider failure isolation;
- provider-specific privacy-safe ProviderOps invocation events;
- client no-leak for internal evidence/raw/secrets;
- global Flight environment contains only provider-neutral state;
- Duffel credential read/validation is Duffel-local;
- Production hard-off + explicit `JETNITY_FLIGHT_AKTIV` fail closed;
- zero providers remain controlled unavailable;
- zero-option incomplete search uses truthful neutral copy.

No current code selects KAYAK, Wego, Skyscanner or Duffel as Jetnity's Production default.

## 4. Provider Readiness foundations

Repository state:

- S4: **CLOSED**
- S5-A Commercial Provenance contract: **INTEGRATED**
- S5-B persistence: **PRODUCTION APPLIED / UNALLOCATED / 0 ROWS**
- S6-A repository Cost Guard foundation: **CLOSED**
- S7 Observability: **CLOSED**
- S8 usage-policy hooks: **CLOSED**
- Flight multi-leg contract: **CLOSED**
- Flight multi-provider orchestration: **CLOSED**

Do not add another generic provider framework unless new live evidence proves a concrete V1 need. Reuse the existing seams.

## 5. Production/live provider state

Still intentionally closed:

- real provider selection;
- provider application/signup/contact/contract/DPA;
- Production S6 migration/runtime/HMAC/>0 budget/binding;
- live provider API secrets;
- sandbox/live/paid calls requiring external access;
- Commercial Provenance runtime writer allocation;
- Production provider activation.

The currently constructible Duffel path remains Development/Test only and does not make Duffel the selected Production provider.

## 6. Provider selection is deferred by Product Owner

Binding direction:

> Build Jetnity provider-neutrally now. Decide later which provider or providers will be used in reality.

Therefore multiple future provider adapters may coexist behind the same Flight core. Any provider-specific adapter must respect the common request, option, provenance, evidence, failure and ranking contracts rather than changing the core around one vendor.

Internal due-diligence material for KAYAK, Wego, Skyscanner, Travelfusion and Duffel remains evidence only, not provider selection.

## 7. Product-Owner gates A–E

All remain **UNAPPROVED** for external/Production action:

- **A-KAYAK / A-WEGO / A-SKYSCANNER / other A** — application, signup, external contact or partner engagement;
- **B** — Production S6 apply/runtime/HMAC/>0 budget;
- **C** — live provider secret and first bounded real/paid call;
- **D** — Commercial Provenance runtime writer/persistence;
- **E** — final Production provider activation.

Generic `weiter`, `bauen`, `start` or Cursor authorization does not approve any of these gates.

## 8. Active work boundary

**No active Cursor coding agent. No active Flight runtime PR. No automatic follow-up slice.**

A new Technical-Lead work cycle must first:

1. fetch live `main`, open PRs/issues, CI/Vercel and relevant Supabase truth;
2. read the current closure checkpoint and V1 binding build order;
3. identify the smallest concrete remaining provider-neutral V1 gap;
4. decide SINGLE_AGENT vs MULTI_AGENT;
5. version the task before dispatch;
6. avoid vendor-specific implementation unless the relevant external/access truth and Product-Owner gate permit it.

The Product Owner's direction to continue building provider-neutrally remains valid, but it is not permission to invent generic abstractions without a demonstrated gap.

## 9. Deferred work that must not be pulled forward accidentally

Destination Essentials Draft PR #394 remains **DEFERRED / STOPPED**. It belongs to V1 Step 8 and must not be resumed merely because #412 closed.

TW-8 remains dependent on real Flight Commercial Truth and is not opened by the provider-neutral orchestration closure.

No later V1 slice is automatically authorized by this status document.

## 10. Hard Traveller truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.**

Never infer a default/primary/preferred citizenship or passport, array order as truth, Residence → Citizenship or Issuer Country → Citizenship.

## 11. Truth architecture

> **OFFICIAL TRUTH ≠ PROVIDER TRUTH ≠ JETNITY RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.**

`unknown ≠ not_required`. `unavailable ≠ not_required`. `stale ≠ current`. LLM ≠ Official Truth.

## 12. Agent / review governance

- ChatGPT is the overarching Technical Lead.
- Cursor agents implement versioned slices.
- GitHub Copilot is not a substitute for the Cursor workflow.
- Agent self-review is never Technical-Lead PASS.
- Changed heads invalidate previous exact-head gates.
- CHANGES REQUIRED returns to the same logical Cursor agent/session.
- Agents do not mark Ready and do not merge.
- Final independent review, gate validation and integration belong to the Technical Lead.

## 13. Critical V1 gaps still open

Principally open:

- real Flight Commercial Truth / provider-access and contract truth;
- TW-8/TW-9 after real Commercial Truth;
- real Hotel Commercial Truth;
- Activities real path or explicit launch exception if externally blocked;
- real Official Entry Requirements Evidence;
- Temporal Readiness on real evidence;
- Destination Essentials;
- basic World Map;
- Mobile/Desktop/PWA polish, accessibility and real-device QA;
- V1 privacy/legal/ops/monetization closure;
- V1 Definition of Done and Release Readiness Gate.

**LIVE-EVIDENCE WINS. ISSUE #412 CLOSED. PR #414 MERGED. FLIGHT MULTI-PROVIDER CORE CLOSED. NO ACTIVE AGENT. PROVIDER SELECTION DEFERRED. NO REAL PROVIDER ACTIVE. EXTERNAL/PRODUCTION A–E GATES CLOSED. NO AUTOMATIC NEXT SLICE.**
