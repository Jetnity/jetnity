# Jetnity – Active Work Status

Stand: 2. September 2026  
Status: **CURRENT / PHASE 1 JETNITY CORE / FLIGHT MULTI-LEG + 0..N MULTI-PROVIDER CORE CLOSED / DESTINATION ESSENTIALS 1 CLOSED / WORLD MAP 1 CLOSED ON MAIN / ASSISTANT TRUTH CONTEXT 1 REVIEW-FIX AFTER 5093789177 / PROVIDER SELECTION + EXTERNAL CONTACT DEFERRED / NO REAL PROVIDER ACTIVE / PRODUCTION S6 UNAPPLIED / EXTERNAL A–E GATES CLOSED / SINGLE_AGENT JETNITY ASSISTANT TRUTH CONTEXT 1 / NO AUTOMATIC FOLLOW-UP SLICE / LIVE-EVIDENCE WINS**

## 1. Latest verified runtime integration

Latest runtime-changing verified main baseline:

`6b5cf463664a41cd59bdfc7f83cbc43a982ea557`

Commit:

`Integrate World Map 1 (#423)`

World Map 1 closure:

- Issue #419: **CLOSED / COMPLETED**;
- original Draft PR #422 exact accepted head `cbed98062120ce8be125db5870fd0f108b29a3c0`;
- rejected exact head `bf2936c9fb41a6e65ed4d29f573c2820c0a7e3dc`: Technical-Lead CHANGES REQUIRED review `5092964996`;
- accepted exact head `cbed98062120ce8be125db5870fd0f108b29a3c0`;
- Technical-Lead FINAL PASS review `5093273775`;
- Draft→Ready connector mutation failed on unsupported `Repository.fullDatabaseId`; no implementation changed after PASS;
- recovery PR #423: **MERGED / SHA-LOCKED**;
- recovery CI #1710: **SUCCESS**;
- post-merge main CI #1711: **SUCCESS** on exact `6b5cf463...`;
- Vercel Production `dpl_XcCUqnsiVydSmJCQRbSBfGUvn7Ss`: **READY** on exact `6b5cf463...`.

Canonical closure checkpoint:

`docs/CHATGPT_TECHNICAL_LEAD_WORLD_MAP_1_CLOSED_2026-09-02.md`

A later docs-only continuity merge may move repository `main`; live `main` must always be fetched before acting.

## 2. Current product phase

**PHASE 1 – JETNITY CORE**

Goal:

> Make the concrete trip reliably plannable, organized and travel-ready.

V1 launches only when:

> **PRODUCTION READY FOR REAL TRAVELLERS.**

Feature Complete alone is insufficient.

## 3. Flight provider-neutral core state

### Request contract — CLOSED

- canonical ordered `legs[]`;
- 1–6 legs;
- One-Way / Return / Multi-City through one request truth;
- canonical stop preference preserved;
- ranking-only context stays outside provider request truth.

### Multi-provider orchestration — CLOSED

- 0..N independent `FlugProvider` adapters;
- no fake composite provider result;
- provider-local `retrievedAt`, evidence and failure truth;
- combined normalized `FlugOption[]` only;
- one global provider/provision-neutral ranking;
- result cap after ranking;
- no implicit primary/default provider from array order;
- no blind cross-provider itinerary dedupe;
- provider failure isolation;
- privacy-safe browser boundary;
- Production hard-off + explicit `JETNITY_FLIGHT_AKTIV` fail closed.

No current code selects KAYAK, Wego, Skyscanner or Duffel as Jetnity's Production default.

## 4. Destination Essentials 1 — CLOSED

**CLOSED / MERGED / POST-MERGE VERIFIED**

Accepted behavior includes ordered stage identity, duplicate-country stage preservation, Destination Official ≠ Transit Official, fail-closed unknown/unavailable/stale/recheck states, multi-traveller/multi-document option dependence without default passport, explicit Safety/Seasonal stage refs, validated action/source separation, accessible details interaction, honest missing evidence and no commercial/provider/DB truth creation.

Destination Essentials 1 is not an open V1 gap.

## 5. World Map 1 / Planned Account Truth — CLOSED

**CLOSED / MERGED / POST-MERGE VERIFIED**

Accepted behavior:

- `Deine Welt` on authenticated Account Home;
- reuses existing `reisenLaden()` / `TripSummary` path;
- stored stage `countryCode`, `placeId`, `latitude`, `longitude` are the only map-location truth;
- legacy `TripSummaryStage { name, position }` remains backward-compatible and fails closed;
- valid finite stored coordinates plot; missing/invalid coordinates do not become guessed points;
- country is never inferred from name, coordinates or `placeId`;
- exact non-empty `placeId` may aggregate a display place;
- full source trip/stage provenance remains retained;
- every unique contributing trip remains explicit by `tripId`, with no hidden `herkuenfte[0]` primary/default;
- past dates, archived/booked/planned/draft status and stage order never imply visited;
- confirmed visited history remains explicitly not captured instead of falsely showing `0 besucht`;
- no external map/tile/geocoder runtime service, no new recurring cost;
- no DB/migration/RLS/Auth/provider mutation;
- accessible text/list fallback remains available.

World Map visited/travel-history persistence is separate and remains deferred/closed.

## 6. Provider Readiness foundations

Repository state:

- S4: **CLOSED**
- S5-A Commercial Provenance contract: **INTEGRATED**
- S5-B persistence: **PRODUCTION APPLIED / UNALLOCATED / 0 ROWS**
- S6-A repository Cost Guard foundation: **CLOSED**
- S7 Observability: **CLOSED**
- S8 usage-policy hooks: **CLOSED**
- Flight multi-leg contract: **CLOSED**
- Flight multi-provider orchestration: **CLOSED**

Do not add another generic provider framework unless new live evidence proves a concrete V1 need. Reuse existing seams.

## 7. Production/live provider state

Still intentionally closed:

- real provider selection;
- provider application/signup/contact/contract/DPA;
- Production S6 migration/runtime/HMAC/>0 budget/binding;
- live provider API secrets;
- sandbox/live/paid calls requiring external access;
- Commercial Provenance runtime writer allocation;
- Production provider activation.

The constructible Duffel Development/Test path does not make Duffel the selected Production provider.

## 8. Provider selection and inquiries are deferred by Product Owner

Binding direction:

> Provider-Anfragen werden auf die Seite gelegt. Jetnity wird provider-neutral weitergebaut; der reale Provider oder die mehreren Provider werden später entschieden.

Multiple future provider adapters may coexist behind the same Flight core. No provider is currently Primary/Default. Internal due-diligence material remains evidence only, not provider selection.

## 9. Product-Owner gates A–E

All remain **UNAPPROVED / CLOSED**:

- **A** — provider application, signup, external contact or partner engagement;
- **B** — Production S6 apply/runtime/HMAC/>0 budget;
- **C** — live provider secret and first bounded real/paid call;
- **D** — Commercial Provenance runtime writer/persistence;
- **E** — final Production provider activation.

Generic `weiter`, `bauen`, `start` or Cursor authorization does not approve any of these gates.

World Map 1 does not weaken, reopen or satisfy any gate.

## 10. Active work boundary

Completed identities remain closed and must not be reopened as unfinished runtime slices:

- World Map 1: Issue #419 closed; accepted head `cbed980...`; recovery PR #423 merged; agent `Jetnity world map 1`, Generation 1, session `bc-bcfe4a30-460b-439d-8f14-96ec910487ac` completed/not active.
- Destination Essentials 1: Issue #393 closed; recovery PR #417 merged; agent `Jetnity destination essentials 1`, Generation 1, session `bc-0dde2838-bb7b-4e97-b94a-6ac95002e2a2` completed/not active.

PR #422 and PR #394 must not be reactivated as unfinished runtime slices.

**Current authorized Draft (not on main, not Ready):**

- Slice: Assistant Truth Context 1
- Issue: #425
- Draft PR: #426
- Branch: `feat/phase-1-assistant-truth-context-1`
- Cursor-Agent: **Jetnity assistant truth context 1**
- Generation: **1**
- Session: `bc-3031160f-45b4-4186-8c4b-5f246682aa71`
- Multi-Agent: **SINGLE_AGENT**
- Binding: `docs/ASSISTANT_TRUTH_CONTEXT_1_TASK_2026-09-02.md`
- Canonical base: `main@efbaaf4f9bc9ea1534aba2dfcf120110d014038b`
- Decision: ADR-0211

The Product Owner's direction to continue provider-neutrally does not itself authorize a particular next slice beyond this versioned task. TW-8 remains dependent on real Flight Commercial Truth and stays closed. No automatic follow-up slice.

## 11. Deferred work that must not be pulled forward accidentally

Still closed/gated unless separately selected and authorized:

- TW-8/TW-9 Commercial Truth closure;
- World Map visited/travel-history persistence;
- service worker/offline/push;
- public indexing/domain cutover;
- payments;
- provider activation;
- any follow-up Destination Essentials expansion;
- any follow-up World Map expansion.

No later V1 slice is automatically authorized by this status document.

## 12. Hard Traveller truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.**

Never infer a default/primary/preferred citizenship or passport, array order as truth, Residence → Citizenship or Issuer Country → Citizenship.

## 13. Truth architecture

> **OFFICIAL TRUTH ≠ PROVIDER TRUTH ≠ JETNITY RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.**

`unknown ≠ not_required`. `unavailable ≠ not_required`. `stale ≠ current`. LLM ≠ Official Truth.

Planned/account-trip evidence ≠ visited. Missing coordinate/country/place evidence stays missing.

## 14. Agent / review governance

- ChatGPT is the overarching Technical Lead.
- Cursor agents implement versioned slices.
- Agent self-review is never Technical-Lead PASS.
- Changed heads invalidate previous exact-head gates.
- CHANGES REQUIRED returns to the same logical Cursor agent/session.
- Agents do not mark Ready and do not merge.
- Final independent review, gate validation and integration belong to the Technical Lead.
- No automatic follow-up slice.

## 15. Critical V1 gaps still open

Principally open:

- real Flight Commercial Truth / provider-access and contract truth;
- TW-8/TW-9 after real Commercial Truth;
- real Hotel Commercial Truth;
- Activities real path or explicit launch exception if externally blocked;
- real Official Entry Requirements Evidence;
- Temporal Readiness on real evidence;
- Mobile/Desktop/PWA polish, accessibility and real-device QA;
- intelligent assistant V1 truth-aware closure;
- V1 privacy/legal/ops/monetization minimum;
- V1 Definition of Done and Release Readiness Gate.

Basic World Map 1 and Destination Essentials 1 are no longer open gaps. Assistant Truth Context 1 is the current bounded Draft; it does not close the later intelligent-assistant V1 model-call gap.

## 16. Assistant Truth Context 1 — current Draft

**REVIEW-FIX AFTER `5093789177` / STOP FOR FRESH TECHNICAL-LEAD EXACT-HEAD REVIEW**

Implemented in this branch:

- `lib/reisebegleiter/kontext.ts` — pure deterministic projection
- `lib/reisebegleiter/kontext.test.ts` — privacy, order-independence, official-state, destination/transit and missing-evidence regressions
- ADR-0211
- `docs/ASSISTANT_TRUTH_CONTEXT_1_HANDOFF_2026-09-02.md`
- `docs/ASSISTANT_TRUTH_CONTEXT_1_SELF_REVIEW_2026-09-02.md`

Reuse: `destinationIstOfficialZiel`, `destinationSafetyBetrifftStage`, `destinationSeasonalBetrifftStage`, `credentialOptionsAus`, `documentsSortieren`, `documentCitizenshipCode`, `landescodeLesen`, `OfficialEvaluation` / Safety / Seasonal types.

Technical-Lead CHANGES REQUIRED `5093789177` on rejected head `42cd37fa`. Two findings only:

1. Official `contextFingerprint` removed from the serialized projection (internal sort only).
2. Transit Official no longer binds to destination stages by country equality; `boundStageIds` stay empty.

Previous exact-head gates on `981d47ba` / `a6737e44` / `42cd37fa` are historical.

Review-fix head `13f45c8a`: local 15/15 + 47/47 + `npm test` 3205/3205; CI #33670219759 SUCCESS; Vercel `7YeoDTy65K7tZ7zKKuZcG8U8w3H7` READY. A later commit invalidates that pair.

Agent self-review is not Technical-Lead PASS. Agent does not mark Ready and does not merge.

Not introduced:

- OpenAI / Modellcall / neue `Modellfunktion`
- Supabase migration/schema/RLS/grant/function
- Production activation / kill-switch change
- Provider/secret/paid/live call
- UI / trip mutation / apply
- World Map or Destination Essentials expansion

**LIVE-EVIDENCE WINS. ISSUE #419 CLOSED. RECOVERY PR #423 MERGED. WORLD MAP 1 CLOSED. DESTINATION ESSENTIALS 1 CLOSED. ASSISTANT TRUTH CONTEXT 1 DRAFT #426. FLIGHT MULTI-PROVIDER CORE CLOSED. VISITED PERSISTENCE REMAINS DEFERRED. PROVIDER SELECTION + CONTACT DEFERRED. NO REAL PROVIDER ACTIVE. EXTERNAL/PRODUCTION A–E GATES CLOSED. NO AUTOMATIC NEXT SLICE.**
