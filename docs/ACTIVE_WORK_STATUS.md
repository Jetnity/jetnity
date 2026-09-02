# Jetnity – Active Work Status

Stand: 2. September 2026  
Status: **CURRENT / PHASE 1 JETNITY CORE / FLIGHT MULTI-LEG + 0..N MULTI-PROVIDER CORE CLOSED / DESTINATION ESSENTIALS 1 CLOSED ON MAIN / PROVIDER SELECTION + EXTERNAL CONTACT DEFERRED / NO REAL PROVIDER ACTIVE / PRODUCTION S6 UNAPPLIED / EXTERNAL A–E GATES CLOSED / WORLD MAP 1 DRAFT PR #422 ACTIVE / STOP FOR TECHNICAL-LEAD EXACT-HEAD REVIEW / NO READY / NO MERGE / NO AUTOMATIC FOLLOW-UP SLICE / LIVE-EVIDENCE WINS**

## 1. Latest verified runtime integration

Latest runtime-changing verified main baseline:

`3beef65bb1e7ed2921c9f9f3010e685b06076401`

Commit:

`Integrate Destination Essentials 1 (#417)`

This is the runtime-integration baseline. A later docs-only continuity merge may move repository `main`; live `main` must always be fetched before acting.

Verified Destination Essentials closure:

- Issue #393: **CLOSED / COMPLETED**;
- original Draft PR #394: **CLOSED / NOT MERGED** only because the known GitHub connector Draft→Ready mutation failed on `Repository.fullDatabaseId` after successful Technical-Lead review;
- rejected exact head `4150517026bf2daf162207f17262f5a5b2d5d1a5`: accessibility CHANGES REQUIRED review `5090867937`;
- accepted exact head `ba1b446789538a6c1db5c41b42e9529d286d1969`;
- Technical-Lead FINAL PASS: review `5091873148`;
- recovery PR #417: **MERGED / SHA-LOCKED** to accepted exact head;
- recovery CI #1700: **SUCCESS**;
- post-merge main CI #1701: **SUCCESS** on exact `3beef65b...`;
- Vercel Production `dpl_E8i5RC5oCuEE9N995okfSw4yQkJt`: **READY** on exact `3beef65b...`;
- Issue #393 auto-closed completed;
- Destination Essentials coding agent is no longer active.

Canonical closure checkpoint:

`docs/CHATGPT_TECHNICAL_LEAD_DESTINATION_ESSENTIALS_1_CLOSED_2026-09-02.md`

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
- privacy-safe browser boundary;
- Duffel credential handling remains Duffel-local;
- Production hard-off + explicit `JETNITY_FLIGHT_AKTIV` fail closed.

No current code selects KAYAK, Wego, Skyscanner or Duffel as Jetnity's Production default.

## 4. Destination Essentials 1 state

**CLOSED / MERGED / POST-MERGE VERIFIED**

Accepted product behavior:

- source-aware destination summary inside the existing Trip Workspace overview;
- ordered stage identity retained; duplicate-country stages remain distinct;
- no country inference and no visited inference;
- Destination Official and Transit Official remain separate;
- unknown/unavailable/stale/recheck remain distinct from `not_required`;
- mixed traveller/credential outcomes remain explicitly option-/traveller-dependent;
- no default citizenship or passport is selected;
- canonical credential labels preserve which document option an outcome belongs to;
- Safety/Seasonal destination attachment requires explicit matching stage refs;
- validated Official action and source semantics remain separate;
- `Quellen und Details` has native details/summary semantics, focus behavior and Jetnity `min-h-11` touch target;
- missing evidence remains honest empty state;
- no commercial search trigger, provider call or new truth engine was added.

The bounded Destination Essentials 1 surface is therefore no longer an open V1 gap. A future expansion is a separate slice and needs a fresh live precheck.

## 5. Provider Readiness foundations

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

## 6. Production/live provider state

Still intentionally closed:

- real provider selection;
- provider application/signup/contact/contract/DPA;
- Production S6 migration/runtime/HMAC/>0 budget/binding;
- live provider API secrets;
- sandbox/live/paid calls requiring external access;
- Commercial Provenance runtime writer allocation;
- Production provider activation.

The constructible Duffel Development/Test path does not make Duffel the selected Production provider.

## 7. Provider selection and inquiries are deferred by Product Owner

Binding direction:

> Provider-Anfragen werden auf die Seite gelegt. Jetnity wird provider-neutral weitergebaut; der reale Provider oder die mehreren Provider werden später entschieden.

Therefore multiple future provider adapters may coexist behind the same Flight core. Any provider-specific adapter must respect the common request, option, provenance, evidence, failure and ranking contracts rather than changing the core around one vendor.

Internal due-diligence material remains evidence only, not provider selection.

## 8. Product-Owner gates A–E

All remain **UNAPPROVED** for external/Production action:

- **A** — provider application, signup, external contact or partner engagement;
- **B** — Production S6 apply/runtime/HMAC/>0 budget;
- **C** — live provider secret and first bounded real/paid call;
- **D** — Commercial Provenance runtime writer/persistence;
- **E** — final Production provider activation.

Generic `weiter`, `bauen`, `start` or Cursor authorization does not approve any of these gates.

World Map 1 does **not** weaken, reopen or satisfy any of these gates.

## 9. Active work boundary

**Active Cursor coding agent / Draft PR only. Not Ready. Not merged. No automatic follow-up slice.**

World Map 1 / Planned Account Truth is the current authorized runtime draft:

- Issue #419 — open;
- Draft PR #422 — active, not Ready;
- Branch `feat/phase-1-world-map-1-planned-truth`;
- Cursor-Agent `Jetnity world map 1`, Generation 1, session `bc-bcfe4a30-460b-439d-8f14-96ec910487ac`;
- Binding task `docs/WORLD_MAP_1_PLANNED_TRUTH_TASK_2026-09-02.md`;
- Decision ADR-0210;
- Canonical base `main@7feb9960bdb4ddac07465ab7fc0a62d9d9fe28e6`;
- Rejected exact head `bf2936c9fb41a6e65ed4d29f573c2820c0a7e3dc` (Technical-Lead review `5092964996`, CHANGES REQUIRED);
- Current work is the three-finding review fix only: unique-trip navigation, backward-compatible `TripSummaryStage`, additive restore of this status file.

This does **not** authorize visited persistence, provider contact, Production S6, TW-8/TW-9, service worker/offline/push, or any Product-Owner gate A–E.

Completed Destination Essentials identity for historical continuity only:

- Issue #393 — closed;
- Draft PR #394 — closed/not merged due connector Ready bug;
- Recovery PR #417 — merged;
- Cursor-Agent `Jetnity destination essentials 1`, Generation 1, session `bc-0dde2838-bb7b-4e97-b94a-6ac95002e2a2` — completed, not active.

The Product Owner's direction to continue provider-neutrally does not itself authorize a new slice. A new Technical-Lead cycle must first reconstruct live truth and select the smallest responsible remaining V1 gap.

TW-8 remains dependent on real Flight Commercial Truth and is not opened by Destination Essentials closure or by World Map 1.

## 10. Deferred work that must not be pulled forward accidentally

Still closed/gated unless separately selected and authorized:

- TW-8/TW-9 Commercial Truth closure;
- World Map visited/travel-history persistence (World Map 1 planned-truth is the current draft slice and does **not** open visited persistence);
- service worker/offline/push;
- public indexing/domain cutover;
- payments;
- provider activation;
- any follow-up Destination Essentials expansion.

No later V1 slice is automatically authorized by this status document.

## 11. Hard Traveller truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.**

Never infer a default/primary/preferred citizenship or passport, array order as truth, Residence → Citizenship or Issuer Country → Citizenship.

World Map 1 does not collect or propagate traveller credentials. Planned place truth is account-trip stage evidence, not a citizenship/document decision.

## 12. Truth architecture

> **OFFICIAL TRUTH ≠ PROVIDER TRUTH ≠ JETNITY RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.**

`unknown ≠ not_required`. `unavailable ≠ not_required`. `stale ≠ current`. LLM ≠ Official Truth.

World Map 1 planned/account-trip evidence ≠ visited. Missing coordinate/country/place evidence stays missing.

## 13. Agent / review governance

- ChatGPT is the overarching Technical Lead.
- Cursor agents implement versioned slices.
- Agent self-review is never Technical-Lead PASS.
- Changed heads invalidate previous exact-head gates.
- CHANGES REQUIRED returns to the same logical Cursor agent/session.
- Agents do not mark Ready and do not merge.
- Final independent review, gate validation and integration belong to the Technical Lead.
- No automatic follow-up slice.

## 14. Critical V1 gaps still open

Principally open:

- real Flight Commercial Truth / provider-access and contract truth;
- TW-8/TW-9 after real Commercial Truth;
- real Hotel Commercial Truth;
- Activities real path or explicit launch exception if externally blocked;
- real Official Entry Requirements Evidence;
- Temporal Readiness on real evidence;
- basic World Map (Draft PR #422 implements planned-truth only; visited persistence remains deferred);
- Mobile/Desktop/PWA polish, accessibility and real-device QA;
- intelligent assistant V1 truth-aware closure;
- V1 privacy/legal/ops/monetization minimum;
- V1 Definition of Done and Release Readiness Gate.

**LIVE-EVIDENCE WINS. ISSUE #393 CLOSED. RECOVERY PR #417 MERGED. DESTINATION ESSENTIALS 1 CLOSED. FLIGHT MULTI-PROVIDER CORE CLOSED. WORLD MAP 1 DRAFT PR #422 ACTIVE, NOT READY. VISITED PERSISTENCE REMAINS DEFERRED. PROVIDER SELECTION + CONTACT DEFERRED. NO REAL PROVIDER ACTIVE. EXTERNAL/PRODUCTION A–E GATES CLOSED. NO AUTOMATIC NEXT SLICE.**

## 15. World Map 1 / Planned Account Truth — additive draft status

Binding: `docs/WORLD_MAP_1_PLANNED_TRUTH_TASK_2026-09-02.md`  
Handoff: `docs/WORLD_MAP_1_PLANNED_TRUTH_HANDOFF_2026-09-02.md`  
Self-review: `docs/WORLD_MAP_1_PLANNED_TRUTH_SELF_REVIEW_2026-09-02.md`

Product goal: bounded **Deine Welt** on authenticated Account Home from stored account-trip stage truth only. Planned ≠ visited.

Hard non-scope still in force for this draft:

- no DB/migration/RLS/Auth mutation;
- no visited persistence or write UI;
- no geocoding / external map / tiles / tokens / runtime geography fetch;
- no provider / secret / paid / live call / Production S6;
- no TW-8/TW-9;
- no service worker / offline / push;
- no follow-up slice.

Review `5092964996` required three fixes on rejected head `bf2936c9fb41a6e65ed4d29f573c2820c0a7e3dc`:

1. Remove hidden `herkuenfte[0]` navigation default; preserve unique trips by `tripId`, never title.
2. Keep `TripSummaryStage` backward-compatible; map-only fields optional; legacy `{ name, position }` fail-closed.
3. Restore this document from `origin/main` additively instead of replacing provider readiness, gates A–E, traveller/truth invariants and deferred boundaries.

Gate evidence for the new exact head is recorded in the World Map 1 handoff after local/CI verification. This section does not claim Ready, Preview-without-SSO, or merge.
