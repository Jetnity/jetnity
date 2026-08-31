# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / E5-B3A PREPARED / REPOSITORY-ONLY PERSISTENCE FOUNDATION / NO PRODUCTION APPLY / AGENT NOT YET DISPATCHED / LIVE-EVIDENCE WINS**

## 1. Current canonical main

`main@3df9af4d6c3da750d50777706bce03589007a58a`

Commit:
`Close Entry Requirements E5-B2A continuity (#337)`

Live verified before E5-B3A task cut:

- Main CI #1517 / Run `33420869626`: **SUCCESS**;
- Vercel Production: **SUCCESS**;
- Ruleset `Jetnity main protection` / ID `21875372`: active;
- PR required, strict CI/Auth/Vercel, Conversation Resolution, merge-only, bypass empty;
- Issue #334 closed/completed;
- Parent #294 remains open.

## 2. Fresh precheck result

E5-A already owns explicit `OfficialTemporalAnchor -> eventRef + absolute instant` projection input. A second DB-free binder would duplicate existing architecture.

E5-B1R + E5-B2A now provide ephemeral server-side provider-observed timezone and uniquely resolved UTC event-instant evidence for exact Flight option/leg/segment/endpoint/IATA occurrences.

The remaining product gap for a saved trip is a **server-owned persistent occurrence source**. `trip_items.metadata` cannot be trusted for provider provenance because it remains owner-writable.

Binding rule:

> **Persisted does not mean provider-proven.**

## 3. Production-live Supabase evidence

Read-only recheck on project `qscbgcdmivbbnzrcyegn` confirmed:

- `public.trip_items`: authenticated owner has SELECT/INSERT/UPDATE/DELETE under owner RLS;
- `public.trip_item_commercial_provenance`: authenticated SELECT only;
- `jetnity_internal.trip_item_commercial_provenance_schreiben(jsonb)`: SECURITY DEFINER;
- no generic Flight-event/timezone provenance relation exists.

Commercial Provenance is a security-pattern reference only and must not be overloaded with temporal/event truth.

## 4. Active prepared slice – E5-B3A

Issue:
**#338 – Entry Requirements E5-B3A – server-owned flight event provenance persistence foundation**

Branch:
`feat/entry-requirements-flight-event-provenance-e5b3a-2026-08-31`

Binding task:
`docs/ENTRY_REQUIREMENTS_SERVER_OWNED_FLIGHT_EVENT_PROVENANCE_E5B3A_TASK_2026-08-31.md`

Task commit:
`66b48e4266ccf18e450756fef981be0c0b38ddb4`

Planned logical Cursor agent:
**`Jetnity entry requirements event provenance persistence 1`**, Generation 1

**Agent not yet dispatched at this checkpoint.**

## 5. E5-B3A scope

Repository-only persistence/security foundation for exact Flight event occurrences:

- dedicated event provenance beside `trip_items`;
- occurrence identity by Flight item + leg + segment + departure/arrival endpoint;
- local airport wall clock, provider-observed IANA timezone and absolute UTC instant remain separate facts;
- server-owned write-authority principle analogous to S5-B Commercial Provenance, without reusing commercial fields;
- owner read only, no direct owner/browser write as provider truth;
- private privileged write contract with Production runtime gate closed/unallocated;
- current-snapshot replacement semantics to prevent stale/orphan occurrences;
- focused repository contract tests.

## 6. Production / runtime boundary

Absolutely no Production apply in E5-B3A.

No:

- Production migration execution;
- live RLS/grant/role/function mutation;
- Production runtime/login principal allocation;
- real application writer;
- Production backfill/data mutation;
- Flight proof implementation;
- provider/secret/paid-call activation;
- browser/route/timezone schema changes;
- E5-A autobinding;
- deadline/task/reminder runtime.

`flugNachweisAusUmgebung()` remains `null`.

`requirementsProviderAus()` remains `null`.

GitHub CI does not apply Supabase migrations, so a repository migration file alone does not change Production.

## 7. Product-Owner gate

Repository-only implementation may proceed under normal TL review because Production is unchanged.

Explicit PO approval remains mandatory before any later:

- Production migration apply;
- Production RLS/grant/role/function change;
- runtime principal allocation;
- real app write-path activation;
- real-data backfill/mutation.

## 8. Runtime contracts that remain unchanged

Without STOP/recut, no semantic changes to:

- `lib/flights/domain.ts`;
- `lib/flights/provider.ts`;
- `lib/flights/airport-event-instant.ts`;
- `lib/flights/nachweis.ts`;
- `lib/flights/suche.ts`;
- `lib/flights/client-sicht.ts`;
- `lib/route/*`;
- `lib/readiness/temporal.ts`;
- `lib/readiness/temporal-projection.ts`;
- API/Workspace runtime;
- generated Supabase types pretending an unapplied relation is live.

## 9. Entry Requirements foundation

Present on main:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A Exact Event-Instant Projection Core;
- E5-B1R ephemeral airport timezone evidence;
- E5-B2A ephemeral airport event-instant resolution.

Still inactive:

- Production-applied trusted event provenance;
- production Flight proof/runtime invocation;
- Trip/Route -> OfficialTemporalAnchor occurrence resolver;
- E5-A automatic binding;
- workspace deadline/action-window/urgency;
- task persistence/completion;
- reminders/push/email;
- real Requirements provider;
- credential/passport ranking.

## 10. Governance / next action

Before Cursor dispatch:

1. compare branch against exact `main@3df9af4d...`;
2. require `ahead=3`, `behind=0`, merge-base exact main and exactly three docs changes;
3. open dedicated Draft PR for #338;
4. record pre-agent exact head;
5. dispatch **`Jetnity entry requirements event provenance persistence 1`**, Generation 1;
6. agent must not edit this file, Ready, merge, apply Production changes or start follow-up;
7. TL must not mutate agent branch while agent works;
8. agent delivery requires independent exact-head review + fresh gates.

No E5-B3B or other follow-up auto-start.

**Live-Evidence wins always.**
