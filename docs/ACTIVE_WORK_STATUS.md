# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / E5-B1R CLOSED / E5-B2A PREPARED / AGENT DISPATCH PENDING / LIVE-EVIDENCE WINS**

## 1. Current canonical main

Baseline at E5-B2A task cut:

`main@f7ccdc5b98ce933b06c216135be7c4f4b08f8222`

Commit:
`Close Entry Requirements E5-B1R continuity (#333)`

Live-verified:

- Main push CI #1507 / Run `33415587649`: **SUCCESS**;
- Vercel Production: **SUCCESS**;
- Ruleset `Jetnity main protection` / ID `21875372`: active;
- strict required checks + conversation resolution + merge-only + bypass empty;
- Issue #330 E5-B1R: CLOSED / completed;
- Parent #294 remains open.

Final main must still be re-read before every merge/review action.

## 2. Active prepared slice

Issue:
**#334 – Entry Requirements E5-B2A – ephemeral airport event instant resolution**

Branch:
`feat/entry-requirements-airport-event-instant-e5b2a-2026-08-31`

Binding task:
`docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_TASK_2026-08-31.md`

Fresh logical Cursor agent:
**`Jetnity entry requirements airport event instant 1`**, Generation 1

Session:
**noch nicht belegt / Dispatch pending**.

## 3. Why E5-B2A

E5-A requires an explicit absolute event instant.

E5-B1R already provides an exact provider-observed IANA timezone companion for a flight endpoint while `FlugSegment` keeps only airport-local wall-clock date/time.

E5-B2A is the bounded bridge:

> exact local flight endpoint wall clock + exact E5-B1R timezone evidence -> exactly one UTC instant or explicit fail-closed issue.

No persistence, no route/trip adoption and no E5-A automatic binding.

## 4. Binding truth boundary

Resolution must match exact:

- option id;
- leg index;
- segment index;
- endpoint `departure | arrival`;
- endpoint IATA;
- provider-observed timezone.

No IATA/country/city/name/server/browser timezone inference.

DST:

- nonexistent local time / gap -> no instant;
- ambiguous local time / overlap -> no instant;
- never choose earlier/later silently.

Resolved output must be canonical UTC RFC3339/ISO with `Z`.

## 5. Runtime boundary

Any new event-instant result remains ephemeral server-side companion evidence at the active FlightProvider seam.

Do not add timezone/instant to:

- `FlugSegment`;
- `FlugOption` / `BewerteteFlugOption`;
- client/browser response;
- route itinerary;
- trip metadata;
- account adoption / `flugNachweis`;
- Supabase.

`fluegeSuchen()` must not expose timezone/event-instant evidence to the browser.

## 6. Fresh duplicate/integration precheck

Verified on current main:

- no existing local-time+IANA→absolute-instant resolver found;
- no timezone dependency in `package.json`;
- `lib/flights/zeit.ts` intentionally keeps wall-clock semantics;
- `lib/flights/airport-timezone.ts` is the current identifier validator;
- `lib/flights/provider.ts` is the active provider seam;
- `lib/flights/duffel/mapping.ts` mints E5-B1R evidence;
- `lib/readiness/temporal-projection.ts` only consumes already absolute instants.

No new npm dependency in E5-B2A. If robust DST gap/overlap handling cannot be proven with platform APIs, agent must STOP rather than weaken semantics or widen scope.

## 7. Hard non-scope / still inactive

- persistent server-owned timezone/event provenance;
- Route/Trip→OfficialTemporalAnchor occurrence resolver;
- E5-A auto-binding;
- workspace deadline/action-window/urgency runtime;
- task persistence/completion;
- reminder/push/e-mail/notification runtime;
- real Requirements provider;
- credential/passport ranking;
- E5-B2B/follow-up.

`requirementsProviderAus()` remains `null`.

## 8. Provenance rule

The abandoned first E5-B1 attempt remains invalid:

- Issue #327 CLOSED / not_planned;
- PR #328 CLOSED / NOT MERGED.

Binding rule:

> **Persisted does not mean provider-proven.**

A later persistent timezone/event provenance layer requires technically enforced server-owned write authority. Production DB/RLS/grant/trigger changes require the special Product-Owner gate.

## 9. Traveller/product truth unchanged

> **1 Traveller -> multiple citizenships -> multiple travel documents/credentials -> context-dependent evaluated options.**

No default/primary/preferred/chosen passport or citizenship. Issuer Country != Citizenship. No Residence→Nationality inference. No `documents[0]` / `evaluations[0]` as product truth.

Account Registry = reusable current traveller facts.  
Trip Snapshot = only current truth for a concrete trip.

## 10. Product-Owner gate assessment

E5-B2A itself triggers no special gate: no Production DB/security change, persistence, provider/secret/paid activation, Auth/MFA/AAL, sensitive data, new running cost or public launch.

STOP if implementation crosses into persistent Trusted Timezone/Event Provenance or Production DB/security.

## 11. Next action

1. Verify preparation branch differs from current main only by E5-B2A task + TL continuity.
2. Open dedicated Draft PR linked to #334.
3. Dispatch fresh agent `Jetnity entry requirements airport event instant 1`.
4. Agent implements only bounded runtime + tests + STATUS/HANDOFF/SELF_REVIEW.
5. Agent runs full gates and stops.
6. Agent does not mark Ready, merge or start follow-up.
7. Technical Lead independently reviews exact final head and all gates.

**Live-Evidence wins always.**
