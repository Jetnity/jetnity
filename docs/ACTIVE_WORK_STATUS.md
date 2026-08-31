# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / E5-B2A INDEPENDENT TL PASS / FINAL INTEGRATION GATES PENDING / LIVE-EVIDENCE WINS**

## 1. Current canonical main

Task-cut / current review baseline:

`main@f7ccdc5b98ce933b06c216135be7c4f4b08f8222`

Commit:
`Close Entry Requirements E5-B1R continuity (#333)`

Verified:

- Main CI #1507 / Run `33415587649`: SUCCESS;
- Vercel Production: SUCCESS;
- ruleset `Jetnity main protection` / ID `21875372`: active;
- strict required CI/Auth/Vercel + Conversation Resolution + merge-only + bypass empty.

At independent E5-B2A review time main remained exactly this SHA. Re-read live before Ready/merge.

## 2. Active slice – E5-B2A

Issue:
**#334 – Entry Requirements E5-B2A – ephemeral airport event instant resolution**

Draft PR:
**#335**

Branch:
`feat/entry-requirements-airport-event-instant-e5b2a-2026-08-31`

Binding task:
`docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_TASK_2026-08-31.md`

Logical Cursor agent:
**`Jetnity entry requirements airport event instant 1`**, Generation 1

Session:
`bc-2f16caec-271e-4911-ac36-5abc36ab0806`

Agent runtime + handoff head:
`4d7e1d002eba06490da59cb4416c55229e8cb559`

Independent TL review:
**PASS / no P0-P1-P2 findings.**

Review doc:
`docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B2A_REVIEW_2026-08-31.md`

## 3. What was independently accepted

E5-B2A adds only ephemeral server-side airport event-instant companion evidence.

Input truth:

- exact normalized `FlugSegment` local date/time;
- exact existing E5-B1R provider-observed IANA timezone evidence.

Identity is revalidated through:

- option ID;
- leg index;
- segment index;
- endpoint `departure | arrival`;
- endpoint IATA.

Civil-time semantics:

- unique mapping -> canonical UTC `...Z` instant;
- DST gap -> `nonexistent_local_time`, no instant;
- DST overlap -> `ambiguous_local_time`, no instant;
- invalid local date/time, timezone or identity -> explicit issue / no instant;
- no IATA/country/city/name/server/browser timezone inference;
- no silent earlier/later/compatible selection;
- no local-wall-clock `Z` append.

Tests cover normal winter/summer, non-whole-hour zones, Zurich and Lord Howe DST transitions, server-TZ independence, identity mismatch, multi-segment, option reordering, cap filtering and browser no-leak.

## 4. Runtime / client / persistence boundary

New companion fields live only on `FlugProviderTreffer`:

- `airportEventInstantEvidence`;
- `airportEventInstantIssues`.

Timezone/instant remain absent from:

- `FlugSegment`;
- `FlugOption` / `BewerteteFlugOption`;
- browser/client response;
- route itinerary;
- trip metadata;
- account adoption / `flugNachweis`;
- Supabase.

Duffel filters to retained options before resolution. Invalid/unresolvable event evidence does not discard a valid offer. `fluegeSuchen()` deliberately does not expose either timezone or instant evidence.

No new npm dependency, provider, secret, paid call or live activation.

## 5. Reviewed agent-head gates

On exact reviewed agent head `4d7e1d002eba06490da59cb4416c55229e8cb559`:

- CI #1510 / Run `33417793387`: SUCCESS;
- Auth: SUCCESS;
- Typecheck/Lint/Tests/Hygiene/Production Build: SUCCESS;
- Vercel Preview: READY / SUCCESS;
- GitHub review threads: 0;
- Vercel unresolved feedback: 0.

Those gates are now historical review evidence because the Technical Lead added continuity commits after the PASS. They cannot be reused as merge gates.

## 6. Current integration state

The Technical Lead has added:

- independent E5-B2A review document;
- updated `JETNITY_START_HERE.md`;
- this updated `docs/ACTIVE_WORK_STATUS.md`.

No runtime code is to change after the reviewed agent head. The resulting new exact branch head must be compared against `4d7e1d...` and fully re-gated.

PR #335 must remain Draft until the final exact-head gates are independently confirmed.

## 7. Hard non-scope / still inactive

- persistent server-owned timezone/event provenance;
- Route/Trip -> OfficialTemporalAnchor occurrence resolver;
- E5-A automatic binding;
- workspace deadline/action-window/urgency runtime;
- task persistence/completion;
- reminder/push/e-mail/notification runtime;
- real Requirements provider;
- credential/passport ranking;
- E5-B2B/follow-up.

`requirementsProviderAus()` remains `null`.

## 8. Binding provenance rule

> **Persisted does not mean provider-proven.**

Issue #327 remains CLOSED / not_planned; PR #328 remains CLOSED / NOT MERGED. Owner-writable Trip metadata cannot establish provider provenance.

Persistent trusted event/timezone provenance later needs technically enforced server-owned write authority. Production DB/RLS/grant/trigger/write-authority changes trigger the special Product-Owner gate.

## 9. Traveller / product truth unchanged

> **Jetnity = Travel Operating System für die konkrete Reise.**

> **1 Traveller -> multiple citizenships -> multiple travel documents/credentials -> context-dependent evaluated options.**

No default/primary/preferred/chosen passport or citizenship. Issuer Country != Citizenship. No Residence -> Nationality inference. No `documents[0]` / `evaluations[0]` as product truth.

Account Registry = reusable current traveller facts.  
Trip Snapshot = only current truth for a concrete trip.

## 10. Product-Owner gate assessment

No special PO gate is triggered by E5-B2A itself: no Production DB/security change, persistence, provider/secret/paid activation, Auth/MFA/AAL, sensitive data, running cost or public launch.

## 11. Next action

1. read final exact PR head after all TL docs commits;
2. compare it with reviewed agent head `4d7e1d...` and ensure only TL continuity changed;
3. verify `main`, merge-base, ahead/behind and PR mergeability;
4. require fresh exact-head CI/Auth/Vercel and zero unresolved threads;
5. Ready only after full gate; if known Ready connector bug occurs, use identical non-draft recovery PR;
6. merge only with expected-head guard;
7. post-merge main CI + Vercel Production verification;
8. close #334 / update #294 only after post-merge green;
9. create/gate/merge docs-only closure checkpoint;
10. no automatic E5-B2B or follow-up.

**Live-Evidence wins always.**
