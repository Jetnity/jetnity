# ChatGPT / Technical Lead – Entry Requirements E5-B2A Review

Stand: 31. August 2026  
Status: **INDEPENDENT TECHNICAL-LEAD PASS / NO P0-P1-P2 FINDINGS / FINAL INTEGRATION HEAD NOT YET GATED**

## 1. Reviewed slice

Issue: **#334 – Entry Requirements E5-B2A – ephemeral airport event instant resolution**  
Draft PR: **#335**  
Logical Cursor agent: **`Jetnity entry requirements airport event instant 1`**, Generation 1  
Session: `bc-2f16caec-271e-4911-ac36-5abc36ab0806`

Reviewed agent final head:
`4d7e1d002eba06490da59cb4416c55229e8cb559`

Task-cut main / merge-base:
`f7ccdc5b98ce933b06c216135be7c4f4b08f8222`

At review time `main` remained unchanged at that exact SHA. PR #335 was open, Draft, mergeable and not merged.

## 2. Independent verdict

**PASS – no P0 / P1 / P2 findings.**

The implementation is scope-faithful and preserves the Entry Requirements / Flight trust boundaries established by E5-B1R.

No Product-Owner special gate is triggered by this bounded implementation.

## 3. Runtime findings

### Exact evidence binding

`airportEventInstantsAufloesen()` does not infer an airport timezone. It consumes only existing E5-B1R `FlugAirportTimezoneEvidence` and revalidates:

- `optionId`;
- `legIndex`;
- `segmentIndex`;
- endpoint `departure | arrival`;
- exact endpoint IATA.

Departure uses only origin + departure local date/time. Arrival uses only destination + arrival local date/time.

Identity mismatch produces `evidence_mismatch` and no instant.

### Civil-time / timezone resolution

The resolver keeps wall-clock semantics explicit and does not append `Z` to local strings or use `Date.parse` on them.

It uses bounded `Intl.DateTimeFormat` observations around the target wall clock, derives candidate UTC instants from observed offsets, and accepts a result only when reverse-formatting in the explicit IANA zone reproduces the exact requested wall clock.

Semantics reviewed:

- exactly one candidate -> canonical UTC `...Z` instant;
- zero candidates -> `nonexistent_local_time`;
- multiple candidates -> `ambiguous_local_time`;
- invalid local date/time -> no instant;
- invalid timezone -> no instant.

The implementation does not silently choose earlier/later/compatible during an overlap and does not normalize through a gap.

Tests cover Europe/Zurich winter/summer, Zurich gap/overlap, Australia/Lord_Howe 30-minute DST transitions, Asia/Kathmandu, Pacific/Chatham and server-TZ independence.

### Runtime / client boundary

The new values remain server-side companion evidence on `FlugProviderTreffer`:

- `airportEventInstantEvidence`;
- `airportEventInstantIssues`.

No timezone/instant field was added to:

- `FlugSegment`;
- `FlugOption` / `BewerteteFlugOption`;
- browser response;
- route itinerary;
- trip metadata;
- account adoption;
- Supabase.

`fluegeSuchen()` continues to use only options/partial and deliberately does not forward timezone or instant evidence to ranking/client serialization.

### Provider integration / cap

Duffel resolves event instants only after the existing retained-offer cap. Timezone evidence is first filtered to retained option IDs; instant evidence is then produced from that filtered set. Invalid/unresolvable instant evidence does not discard an otherwise valid offer.

No new dependency, provider, secret, paid call or live activation was introduced.

## 4. Diff / scope review

PR #335 at reviewed head contains 14 changed files / 5 commits.

Agent runtime/test changes are bounded to:

- `lib/flights/provider.ts`;
- `lib/flights/airport-event-instant.ts`;
- `lib/flights/airport-event-instant.test.ts`;
- `lib/flights/duffel/adapter.ts`;
- `lib/flights/duffel/adapter.test.ts`;
- `lib/flights/suche.ts`;
- `lib/flights/suche.test.ts`;
- `lib/flights/schema.test.ts`.

Agent delivery docs:

- `docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_STATUS_2026-08-31.md`;
- `docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_HANDOFF_2026-08-31.md`;
- `docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_SELF_REVIEW_2026-08-31.md`.

TL preparation files already present before agent dispatch:

- `JETNITY_START_HERE.md`;
- `docs/ACTIVE_WORK_STATUS.md`;
- E5-B2A task document.

No semantic changes to route, trips, readiness temporal projection, Supabase, DB scripts, package dependencies or public client contracts.

## 5. Exact reviewed-head gates

On reviewed agent head `4d7e1d002eba06490da59cb4416c55229e8cb559`:

- GitHub CI #1510 / Run `33417793387`: **SUCCESS**;
- `Auth-Konfiguration gegen config.toml`: SUCCESS;
- `Typecheck, Lint & Build`: SUCCESS;
- Typecheck: SUCCESS;
- Lint: SUCCESS;
- Tests: SUCCESS;
- Admin API protection: SUCCESS;
- Schema reference check: SUCCESS;
- dead-code check: SUCCESS;
- export check: SUCCESS;
- dependency check: SUCCESS;
- Production build: SUCCESS;
- Vercel Preview: **READY / SUCCESS** on exact head;
- GitHub review threads: **0**;
- Vercel live feedback: **0 unresolved / 0 total**.

These gates are review evidence only once the Technical Lead adds continuity commits. Any new head invalidates them as merge gates.

## 6. Residuals / intentional non-scope

P3 / intentional residuals:

- event-instant evidence is still ephemeral and has no E5-A consumer;
- DST overlaps intentionally remain unresolved;
- timezone behavior depends on the platform tzdb exposed through `Intl`;
- no persistent server-owned timezone/event provenance exists;
- no Trip/Route -> OfficialTemporalAnchor occurrence resolver exists;
- no E5-A automatic binding;
- no deadline/task/reminder/notification runtime;
- no UI/device gate because this slice has no UI.

These are not merge blockers for E5-B2A.

## 7. Integration decision

Runtime verdict: **PASS**.

Before merge the Technical Lead must now:

1. update `JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md` to the reviewed state;
2. treat the resulting SHA as a new final integration head;
3. require fresh exact-head CI/Auth/Vercel and zero unresolved threads on that final head;
4. verify `main` did not drift;
5. use normal Ready flow if the connector works, otherwise the documented identical-head recovery carrier;
6. merge only with expected-head guard;
7. perform main CI + Vercel Production post-merge verification;
8. close #334 only after post-merge green;
9. create the docs-only closure checkpoint;
10. **do not auto-start E5-B2B or another follow-up slice**.

**Live-Evidence wins always.**
