# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / E5-B3A CLOSED / E5-B3B PREPARED / SERVER-ONLY PROVIDER RETRIEVAL TIMESTAMP / NO PRODUCTION APPLY / AGENT NOT YET DISPATCHED / LIVE-EVIDENCE WINS**

## 1. Current canonical main

`main@ad7fb1fa5d0bd6ac3fe2a7085a65fb8d56cecbb8`

Commit:
`Close Entry Requirements E5-B3A continuity (#342)`

Live verified:

- Main CI #1529 / Run `33430799991`: **SUCCESS**;
- Vercel Production: **SUCCESS** on exact main;
- Issue #338 closed/completed;
- Parent #294 remains open;
- E5-B3A Production migration remains unapplied.

## 2. E5-B3A final state

Repository foundation exists for server-owned Flight Event Provenance, including required concrete `external_ref`, exact occurrence identity, separated local wall clock/timezone/instant, private writer foundation and closed runtime gate.

Production remains unchanged. No relation/function/gate/roles from E5-B3A exist live.

Binding rule:

> **Persisted does not mean provider-proven.**

## 3. Fresh next-slice precheck

Current active Flight runtime:

- `FlugProviderTreffer` = options + E5-B1R timezone evidence + E5-B2A instant evidence/issues;
- Duffel adapter is the active server-side minting seam for those companion facts;
- search orchestration deliberately drops companion evidence before ranking/client response;
- no trusted retrieval/observation timestamp is carried with the provider result;
- no TypeScript `jetnity.flight_event_persistence.v1` / `e5b2a_validated_snapshot` mint exists;
- no open current Entry Requirements issue duplicates the missing timestamp fact.

Therefore a full persistence mint is not yet safe: E5-B3A requires `retrieved_at/observed_at`, and a later mint must not invent the provider-snapshot observation time after the fact.

## 4. Active prepared slice – E5-B3B

Issue:
**#343 – Entry Requirements E5-B3B – server-observed Flight provider retrieval timestamp evidence**

Branch:
`feat/entry-requirements-provider-retrieval-time-e5b3b-2026-08-31`

Task:
`docs/ENTRY_REQUIREMENTS_PROVIDER_RETRIEVAL_TIMESTAMP_E5B3B_TASK_2026-08-31.md`

Task commit:
`963ddead23d899c57cc2610928081b4419708c3b`

Planned logical Cursor agent:
**`Jetnity entry requirements provider retrieval timestamp 1`**, Generation 1

**Agent not yet dispatched at this checkpoint.**

## 5. Binding implementation contract

Add a required server-only retrieval timestamp to `FlugProviderTreffer`, preferably `retrievedAt: string`.

It means:

- Jetnity server observation time of the successfully read provider response;
- canonical UTC ISO with `Z`;
- one timestamp per provider result;
- never accepted from provider/browser payload;
- no freshness/availability claim;
- no `FlugOption`/`FlugSegment` field;
- dropped before ranking/client response.

Duffel may receive a tiny optional injectable clock solely for deterministic tests; default Production behavior uses real server time.

## 6. Expected runtime scope

Expected:

- `lib/flights/provider.ts`;
- `lib/flights/duffel/adapter.ts`;
- `lib/flights/duffel/adapter.test.ts`;
- `lib/flights/suche.test.ts`;
- fake/test provider fixtures only where required by the now-required provider-result contract.

Without STOP/recut, no semantic changes to:

- `lib/flights/domain.ts`;
- `lib/flights/schema.ts`;
- `lib/flights/client-sicht.ts`;
- Route/Trips/Readiness/API;
- `supabase/*` / `scripts/db/*` / generated Supabase types;
- `lib/providers/*` parallel provider-readiness world;
- Commercial Provenance runtime.

## 7. Hard non-scope / Product-Owner boundary

No:

- Production migration/RLS/grant/role/function mutation;
- Runtime principal;
- real DB writer/backfill;
- Flight Event persistence mint;
- `flugNachweis` activation;
- provider/secret/paid/live activation;
- new infra/cost;
- browser/route/trip timestamp persistence;
- E5-A autobinding;
- deadline/task/reminder runtime;
- Requirements provider;
- credential ranking;
- follow-up slice.

No special PO gate for this exact in-memory/server-only slice. All documented Production/provider/cost gates remain binding.

## 8. Entry Requirements foundation

Present:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A exact event-instant projection;
- E5-B1R ephemeral provider-observed airport timezone evidence;
- E5-B2A ephemeral airport event-instant resolution;
- E5-B3A repository persistence/security foundation.

Prepared:

- E5-B3B server-observed provider retrieval timestamp evidence.

Still inactive:

- persistent Production event provenance;
- TypeScript persistence mint;
- real writer/runtime principal;
- occurrence resolver into E5-A;
- automatic E5-A binding;
- deadline/task/reminder runtime;
- real Requirements provider;
- credential ranking.

## 9. Governance / next action

Before agent dispatch:

1. compare branch to exact `main@ad7fb1fa...`;
2. require behind=0 and only the E5-B3B task + TL continuity docs;
3. open dedicated Draft PR #343;
4. record exact pre-agent head;
5. dispatch `Jetnity entry requirements provider retrieval timestamp 1`, Generation 1;
6. agent must not edit this file, Ready, merge, alter Production or start follow-up;
7. TL must not mutate agent branch while agent works;
8. agent delivery requires independent exact-head review and fresh gates.

**Live-Evidence wins always.**
