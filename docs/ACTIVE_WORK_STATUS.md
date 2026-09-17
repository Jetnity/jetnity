# Jetnity – Active Work Status

Stand: 17. September 2026  
Status: **CURRENT / PHASE 1 JETNITY CORE / ASSISTANT RUNTIME 1 DRAFT AWAITING TECHNICAL-LEAD REVIEW / MOBILE ACCESSIBILITY 1 CLOSED / FLIGHT MULTI-LEG + 0..N MULTI-PROVIDER CORE CLOSED / DESTINATION ESSENTIALS 1 CLOSED / WORLD MAP 1 CLOSED / ASSISTANT TRUTH CONTEXT 1 CLOSED / PROVIDER SELECTION + EXTERNAL CONTACT DEFERRED / NO REAL PROVIDER ACTIVE / PRODUCTION S6 UNAPPLIED / EXTERNAL A–E GATES CLOSED / NO AUTOMATIC FOLLOW-UP SLICE / LIVE-EVIDENCE WINS**

## 0. Active draft slice – Assistant Runtime 1

**ACTIVE DRAFT / NOT ON `main` / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**

| | |
| --- | --- |
| Issue | #434 |
| Product-Owner gate | #433 – **Preview/Development only** |
| Draft PR | #435 |
| Branch | `feat/phase-1-assistant-runtime-1` |
| Canonical base | `main@15aa125addf39b15dcb50a1cdf8dece661796fc5` |
| **Last runtime-changing head** | `ea7cf8ec9cabc19f8b4a9b55e0470fc580257940` |
| **Exact final head** | branch head: documentation-only commits on top of `ea7cf8ec`; read with `git rev-parse origin/feat/phase-1-assistant-runtime-1` |
| Merge-base / behind | `15aa125a` / 0 behind |
| Drift | none |
| Binding task | `docs/ASSISTANT_RUNTIME_1_TASK_2026-09-17.md` |
| Decision | ADR-0212 |
| Status doc | `docs/ASSISTANT_RUNTIME_1_STATUS_2026-09-17.md` |
| Handoff | `docs/ASSISTANT_RUNTIME_1_HANDOFF_2026-09-17.md` |
| Self-review | `docs/ASSISTANT_RUNTIME_1_SELF_REVIEW_2026-09-17.md` |

Repository gates on the exact head are green: `npm test` 3321/3321, `typecheck`, `lint` (0 errors), `build`, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, plus 50 browser checks via `npm run nachweis:reisebegleiter` on mobile and desktop. Exact-head CI run `35165950349`: **success** (both jobs, including `auth:pruefen` with 55 values / 243 keys against `supabase/config.toml`). Vercel Preview `6kbzcUP3CDzhXkkkj3owzz4bQB3v`: **READY**.

**Two gates are open and must not be reported as green:**

1. **Develop migration not applied.** `supabase/migrations/20260917090000_modell_reisebegleiter.sql` exists in the repository and has been applied to neither Development nor Production. `db:anwenden`, `db:rechte`, `db:rls`, `db:sicherheit`, `db:typen --pruefen`, `db:advisors` and `production:pruefen` **did not run**: the `SUPABASE_ACCESS_TOKEN` injected into the Cloud Agent environment is rejected by the Supabase Management API with HTTP 401, including on `/v1/projects` without a ref. The CI secret is valid — `auth:pruefen` passes in CI on the same head — so this is a property of the agent environment's access, not of the project. Whoever completes the DB gates needs the token CI uses.
2. **No paid Preview/Development call made.** `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `JETNITY_MODELL_AKTIV` are absent in that environment, and an account session is unreachable because `enable_confirmations = true`. The rendering of an answer is evidenced in the browser with a *supplied* answer, not a generated one.

Production migration, Production model activation, Production OpenAI secrets and Production paid calls remain **CLOSED**.

**Reported side effect requiring cleanup:** an unconfirmed, sessionless auth user `assistant.runtime1.probe@gmail.com` was created via the anon signup endpoint while looking for a reachable account login. The target project is **not** the documented Production ref `qscbgcdmivbbnzrcyegn`; by the convention in `docs/DATENBANK.md` it is the Development branch. Please delete it.

**Exact next step:** independent Technical-Lead review on the exact final head of the branch (runtime stands at `ea7cf8ec9cabc19f8b4a9b55e0470fc580257940`; everything above it is documentation), then a valid access token, then Development-only migration and live constraint/RLS/grant verification, then one bounded paid Preview call. No Ready, no merge, no follow-up slice by the coding agent.

## 1. Latest verified runtime integration

Latest runtime-changing verified main baseline:

`9a80bbfe37113468f60040ed6cbedb960538b943`

Commit:

`Integrate Mobile Accessibility 1 (#430)`

Mobile Accessibility 1 closure:

- Issue #429: **CLOSED / COMPLETED**;
- PR #430 exact accepted head `644ceacb22c672f3f9968df6731da58e0546d530`;
- Technical-Lead FINAL PASS review `5228930437`;
- exact-head CI #1730 / run `35141388608`: **SUCCESS**;
- Vercel Preview `dpl_5okwKVgzvsC2SvVEVhtELfz3izpy`: **READY**;
- PR #430: **MERGED**;
- runtime merge `9a80bbfe37113468f60040ed6cbedb960538b943`;
- post-merge main CI #1731 / run `35157033549`: **SUCCESS**;
- Vercel Production `dpl_7xtTdC7Uy7JEe5U5qqWq7eoqghNP`: **READY** on exact runtime merge;
- no active Cursor agent.

Canonical new-chat checkpoint:

`docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-17.md`

Canonical runtime closure checkpoint:

`docs/CHATGPT_TECHNICAL_LEAD_MOBILE_ACCESSIBILITY_1_CLOSED_2026-09-17.md`

CI Auth management access is intentionally scoped to Development branch ref `yfvbxvijcorffwxbxahl`; Production project ref remains `qscbgcdmivbbnzrcyegn`. The read-only access token has a 90-day expiry and must be rotated before expiry.

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

Assistant Truth Context 1, World Map 1 and Destination Essentials 1 do not weaken, reopen or satisfy any provider/Production gate.

## 10. Active work boundary

**No active implementation slice. No active Cursor coding agent.**

Mobile Accessibility 1 is **CLOSED / MERGED / POST-MERGE VERIFIED**.

Canonical evidence:

- task: `docs/MOBILE_ACCESSIBILITY_1_TASK_2026-09-02.md`
- historical status/handoff/self-review/audit under the existing Mobile Accessibility 1 docs;
- current closure: `docs/CHATGPT_TECHNICAL_LEAD_MOBILE_ACCESSIBILITY_1_CLOSED_2026-09-17.md`;
- Issue #429 closed/completed;
- PR #430 merged;
- accepted head `644ceacb...`;
- runtime main `9a80bbfe...`;
- post-merge CI #1731 SUCCESS;
- Production Vercel READY.

Cursor agent `Jetnity mobile accessibility 1`, Generation 1, session `bc-30492cdc-0697-4460-90a7-c1bf950fbbe9`: **COMPLETED / NOT ACTIVE**.

Completed identities remain closed and must not be reopened as unfinished runtime slices:

- Assistant Truth Context 1: CLOSED;
- World Map 1: CLOSED;
- Destination Essentials 1: CLOSED;
- Mobile Accessibility 1: CLOSED.

Physical real-device QA remains a separate future bounded slice if selected; browser viewport/emulation evidence is not a physical-device claim.

The Product Owner's direction to continue provider-neutrally does not itself authorize a particular next slice. A new Technical-Lead cycle must reconstruct live truth, assess remaining V1 gaps and persist a new bounded task before dispatch.

TW-8 remains dependent on real Flight Commercial Truth and stays closed.

## 11. Deferred work that must not be pulled forward accidentally

Still closed/gated unless separately selected and authorized:

- TW-8/TW-9 Commercial Truth closure;
- World Map visited/travel-history persistence;
- a real Assistant model-call/runtime/UI path beyond the closed Truth Context foundation;
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

Assistant Truth Context adds no competing truth class: it only projects allowed existing truth, and its Generated Suggestion lane remains separate.

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
- real intelligent-assistant runtime/model-call wiring on top of the closed Truth Context foundation;
- V1 privacy/legal/ops/monetization minimum;
- V1 Definition of Done and Release Readiness Gate.

Basic World Map 1, Destination Essentials 1 and Assistant Truth Context 1 are no longer open gaps.

## 16. Assistant Truth Context 1 — CLOSED

**CLOSED / MERGED / POST-MERGE VERIFIED**

Canonical closure checkpoint:

`docs/CHATGPT_TECHNICAL_LEAD_ASSISTANT_TRUTH_CONTEXT_1_CLOSED_2026-09-02.md`

Accepted implementation:

- `lib/reisebegleiter/kontext.ts` — pure deterministic privacy-minimized projection;
- `lib/reisebegleiter/kontext.test.ts` — privacy, order-independence, official-state, destination/transit, multi-credential and missing-evidence regressions;
- ADR-0211;
- no second Official/Safety/Seasonal/Traveller engine; existing canonical helpers reused.

Technical-Lead review history:

- CHANGES REQUIRED `5093789177` on rejected exact head `42cd37fa...`:
  1. remove Official `contextFingerprint` from the serialized Assistant allowlist;
  2. remove inferred Transit→Destination-Stage binding by country equality.
- same logical agent/session corrected both findings;
- FINAL PASS `5093904909` on exact accepted head `bce6f3d8...`.

Fresh gates:

- exact accepted-head CI #1719: SUCCESS;
- recovery PR #427 CI #1720: SUCCESS;
- post-merge main CI #1721: SUCCESS on exact runtime merge `cd8f10da...`;
- Vercel Production exact runtime merge: SUCCESS, deployment `DAd1ZY4aUex4woNecuLHDr6TWLRA`.

Accepted privacy/truth rules:

- no passport number/MRZ/scan/biometric/health/auth/account/commercial/provider-raw/secret leakage;
- no Official `contextFingerprint` across the Assistant allowlist;
- Multi-Traveller/Multi-Citizenship/Multi-Document remain peer options;
- no array-order default/primary/preferred semantics;
- Destination Official and Transit Official remain separate;
- Transit `boundStageIds` stays empty absent a canonical Transit↔Stage relation;
- unknown/unavailable/stale/recheck remain fail-closed and distinct;
- generated suggestion remains a separate, unfilled class.

Not introduced:

- OpenAI / Modellcall / new `Modellfunktion`;
- Supabase migration/schema/RLS/grant/function;
- Production activation / kill-switch change;
- Provider/secret/paid/live call;
- UI / trip mutation / apply;
- World Map or Destination Essentials expansion.

A future actual Assistant runtime/model-call path remains a separate gated V1 slice and is not authorized by this closure.

**LIVE-EVIDENCE WINS. ASSISTANT TRUTH CONTEXT 1 CLOSED. ISSUE #425 CLOSED. RECOVERY PR #427 MERGED. RUNTIME MAIN `cd8f10da...` POST-MERGE VERIFIED. WORLD MAP 1 CLOSED. DESTINATION ESSENTIALS 1 CLOSED. FLIGHT MULTI-PROVIDER CORE CLOSED. NO ACTIVE AGENT. VISITED PERSISTENCE REMAINS DEFERRED. PROVIDER SELECTION + CONTACT DEFERRED. NO REAL PROVIDER ACTIVE. EXTERNAL/PRODUCTION A–E GATES CLOSED. NO AUTOMATIC NEXT SLICE.**
