# ChatGPT / Technical Lead – Entry Requirements E5-B1R Independent Review

Stand: 31. August 2026
Status: **RUNTIME REVIEW PASS / CONTINUITY UPDATE FOLLOWS / FINAL INTEGRATION HEAD MUST BE RE-GATED**

## 1. Scope

Issue #330: `Entry Requirements E5-B1R – ephemeral provider-observed airport timezone evidence`

Draft PR: #331

Binding task:
`docs/ENTRY_REQUIREMENTS_EPHEMERAL_PROVIDER_TIMEZONE_E5B1R_TASK_2026-08-31.md`

Logical Cursor agent:
**`Jetnity entry requirements provider timezone evidence 1`**, Generation 1

Session:
`bc-cc301dee-cb64-42b9-a6e9-9968f3db8a09`

Task baseline / current main during review:
`7fdd06f983a47afbbb28313479adf4e81fb9a359`

Agent runtime+handoff head independently reviewed:
`ae75178d617271808d8738ff64f81ed54caf7a80`

## 2. Independent Technical-Lead verdict

**PASS for the E5-B1R runtime scope.**

No P0, P1 or P2 defect was found in the reviewed runtime head.

This is not approval for E5-B2 or any follow-up. The purpose of E5-B1R is only to preserve provider-observed airport timezone identifiers as ephemeral server-side companion evidence without crossing into browser, route or persistence truth.

## 3. Verified architecture

The reviewed implementation keeps the hard boundary intact:

- `FlugSegment`, `FlugOption` and `BewerteteFlugOption` remain timezone-free;
- no timezone field enters the browser/client contract;
- no route itinerary or trip metadata field is added;
- no Supabase schema, RLS, trigger, grant or DB write is added;
- no `flugNachweis` / account-adoption path is activated;
- no UTC conversion, DST resolver, event-occurrence resolver or E5-A auto-binding exists;
- `requirementsProviderAus()` remains `null`;
- `lib/providers/flights/*` is not turned into a second runtime provider system.

Provider-observed evidence lives only on the active server-side `FlugProviderTreffer` seam and is linked by:

- final normalized `optionId`;
- `legIndex`;
- `segmentIndex`;
- `departure | arrival` endpoint;
- exact normalized IATA;
- provider-observed timezone identifier.

Duffel can mint evidence only from a structured airport object carrying explicit `time_zone`. String/IATA-only endpoints cannot mint it. There is no country/city/name/IATA lookup and no raw offset fallback.

## 4. Identifier validation

`lib/flights/airport-timezone.ts` is intentionally narrow:

- requires a bounded non-empty string;
- rejects surrounding whitespace;
- rejects control characters;
- rejects raw `Z` and numeric offsets;
- rejects obvious path/URL junk;
- uses `Intl.DateTimeFormat(..., { timeZone })` only as platform timezone recognition;
- preserves the provider identifier rather than silently replacing it with a guessed airport zone.

This does not calculate an instant and does not establish DST/civil-time truth.

## 5. Association / truncation / leak review

The adapter limits returned options to the existing `FLUG_SUCHE_GRENZEN.angebote` cap and filters companion evidence to the retained option IDs. Therefore the server-side provider result does not retain evidence for offers that were removed by the adapter cap.

Multi-segment and multi-leg regressions bind each endpoint independently. Ranking/reordering does not relink evidence by array position because association uses the stable option ID plus leg/segment/endpoint coordinates.

`fluegeSuchen()` deliberately ignores the companion evidence. Regression tests serialize the browser response and prove that timezone identifiers and `airportTimezoneEvidence` do not cross that boundary. Existing flight schema parsing also strips injected timezone-like extra keys from a normal `FlugOption`.

## 6. #328 exclusion

The abandoned first E5-B1 attempt remains excluded.

Discarded head:
`fdf05f26928dfc556cc3b3b954eb3c61981b29c4`

Independent Git comparison shows the old head and E5-B1R head are **diverged**, with merge-base `6928ea637133ff91cfb207cfd5b1175fecbc9699`. The old head is not an ancestor of E5-B1R. No cherry-pick acceptance is inferred.

Binding rule remains:

> **Persisted does not mean provider-proven.**

## 7. Exact-head evidence on reviewed runtime head

Reviewed head:
`ae75178d617271808d8738ff64f81ed54caf7a80`

GitHub Actions CI #1500 / run `33411397098`: **SUCCESS**.

Exact-head jobs:

- `Auth-Konfiguration gegen config.toml`: SUCCESS;
- `Typecheck, Lint & Build`: SUCCESS;
- Typecheck, Lint, Tests, Admin-API protection, schema-reference check, dead-code check, export check, dependency check and Production build all completed successfully inside that job.

Vercel status on exact reviewed head: **SUCCESS / READY**.

GitHub inline review threads: **0**.

Vercel feedback state in the PR deployment record: **0 unresolved**.

`main` remained unchanged at `7fdd06f983a47afbbb28313479adf4e81fb9a359`; reviewed branch was 5 commits ahead / 0 behind.

## 8. Residuals / intentional non-scope

P3 / intentional residuals only:

- timezone evidence has no consumer in E5-B1R;
- evidence is not persisted;
- `Intl` timezone recognition depends on the runtime tzdb;
- no local-time + IANA -> absolute-instant conversion exists;
- no DST ambiguity/gap handling exists;
- no event occurrence is selected;
- no E5-A projection is automatically bound;
- no workspace deadline, urgency, task, reminder or notification runtime exists.

These are future architecture questions, not defects in this bounded slice.

## 9. Product-Owner gate assessment

No special Product-Owner gate is triggered by E5-B1R itself:

- no Production migration/RLS/ownership/write-authority change;
- no new provider/vendor/contract/secret/paid call/live activation;
- no Auth/MFA/AAL change;
- no sensitive document storage;
- no payments;
- no new running infrastructure cost;
- no public launch action.

If a later slice requires persistent server-owned timezone/event provenance, stop at the Production DB/Security Product-Owner gate before implementation/apply.

## 10. Continuity / integration rule

This review PASS is anchored to runtime head `ae75178d617271808d8738ff64f81ed54caf7a80`.

The Technical Lead must now update the TL-owned canonical continuity files. That docs-only update creates a new integration head and therefore invalidates the old exact-head merge gates.

Before Ready/Merge of PR #331, the new final head must again satisfy:

- branch 0 behind current `main`;
- exact-head `Auth-Konfiguration gegen config.toml` SUCCESS;
- exact-head `Typecheck, Lint & Build` SUCCESS;
- exact-head Vercel SUCCESS/READY;
- zero unresolved review threads;
- no material diff beyond the reviewed runtime plus TL continuity update;
- independent final-head verification.

No E5-B2/follow-up starts automatically.
