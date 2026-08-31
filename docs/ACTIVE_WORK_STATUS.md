# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / E5-B3A CLOSED & POST-MERGE VERIFIED / PRODUCTION MIGRATION UNAPPLIED / NEXT SLICE AUTHORIZED BUT NOT YET CUT / LIVE-EVIDENCE WINS**

## 1. Current canonical runtime/repository main

Before this docs-only closure:

`main@73d580a53bd60be20e4f253fafe37f25111d4b0d`

Commit:
`Merge E5-B3A server-owned flight event provenance foundation (#341)`

Post-merge evidence:

- Main CI #1527 / Run `33429685566`: **SUCCESS**;
- Vercel Production: **SUCCESS** on exact merge SHA;
- Issue #338: **CLOSED / completed**;
- Parent #294 remains open;
- Production Supabase E5-B3A objects remain absent/unapplied.

After this docs closure merges, re-read `main` because the canonical SHA will advance without runtime behavior changing.

## 2. E5-B3A final history

Issue:
**#338 – server-owned flight event provenance persistence foundation**

Agent:
**`Jetnity entry requirements event provenance persistence 1`**, Generation 1

Session:
`bc-e7a50347-1c66-4cd1-bbd2-979b89590a40`

Initial delivery:
`79dda7593bb9fbb20c36dc54348920e994da6823`

TL found P2: provider-proven persistence was possible without concrete `external_ref`.

Same-agent fix:
`f918dc0ed58b4962389a860d5a1b6bf74513cd1b`

Final agent/delivery head:
`d37b600f67537f4ccb816182009b6018a39f82a3`

Final integration head:
`9a839bfc2babec96ba983de0c6b1ff628da5a1f3`

Independent TL result:
**PASS / no open P0-P1-P2.**

Original Draft #340:
CLOSED / NOT MERGED after known `Repository.fullDatabaseId` Ready connector error.

Recovery #341:
MERGED on identical exact head after independent recovery gates.

Runtime/repository merge:
`73d580a53bd60be20e4f253fafe37f25111d4b0d`

## 3. Repository foundation now present

- `supabase/migrations/20260831190000_trip_item_flight_event_provenance.sql`;
- `lib/flight-event-provenance/e5b3a-persistenz-vertrag.test.ts`;
- dedicated event provenance relation contract beside `trip_items`;
- exact item/leg/segment/endpoint identity;
- local wall clock / timezone / instant separate;
- required concrete provider source `external_ref`;
- server-generated occurrence event ref;
- owner SELECT only, no authenticated/anon write;
- private SECURITY DEFINER writer foundation;
- NOLOGIN writer/runtime roles;
- runtime gate defaults false/unallocated;
- atomic current-snapshot semantics;
- no SQL timezone/DST resolution.

Binding rule:

> **Persisted does not mean provider-proven.**

## 4. Production remains unchanged

Supabase project:
`qscbgcdmivbbnzrcyegn`

Post-merge read-only verified absent:

- `public.trip_item_flight_event_provenance`;
- `jetnity_internal.trip_item_flight_event_provenance_schreiben(jsonb)`;
- `jetnity_internal.flight_event_write_runtime_gate`;
- `jetnity_flight_event_writer`;
- `jetnity_flight_event_runtime`.

No Production migration, RLS/grant/role/function mutation, principal allocation, real writer or backfill occurred.

## 5. Runtime / truth boundaries unchanged

Still inactive:

- `flugNachweisAusUmgebung()` → `null`;
- `requirementsProviderAus()` → `null`;
- no browser/route persisted timezone/event fields;
- no Trip/Route → OfficialTemporalAnchor resolver;
- no E5-A automatic binding;
- no deadline/action-window/urgency/task/reminder/notification runtime;
- no real Requirements provider;
- no credential/passport ranking.

## 6. Product-Owner gates

Explicit PO approval remains mandatory before any later:

- E5-B3A Production migration apply;
- Production RLS/grant/role/function change;
- runtime/login principal allocation;
- real application write path or backfill;
- provider/vendor/secret/paid/live activation;
- fundamental auth/MFA/AAL change;
- sensitive passport/MRZ/scan/biometric/health storage;
- real payments;
- infra spend outside approved budget;
- public/irreversible external activation.

## 7. P3 before Production apply

Execute the E5-B3A migration against a disposable PostgreSQL/Supabase environment before any Production apply and observe actual RLS/grant/function behavior.

A future trusted mint must reuse E5-B1R + E5-B2A; SQL must not become a second temporal truth engine.

## 8. Entry Requirements foundation

Present:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A Exact Event-Instant Projection Core;
- E5-B1R ephemeral airport timezone evidence;
- E5-B2A ephemeral airport event-instant resolution;
- E5-B3A repository persistence/security foundation.

Still inactive:

- Production-applied event provenance;
- real Flight proof/runtime writer;
- occurrence resolver into E5-A;
- E5-A automatic binding;
- deadline/task/reminder runtime;
- real Requirements provider;
- credential ranking.

## 9. Next action

The user explicitly authorized **one next slice** after E5-B3A closure.

Required sequence:

1. merge and post-merge verify this docs-only closure;
2. reconstruct exact new main, open PRs/issues and CI/Vercel;
3. run a fresh Duplicate/Integration/Truth/Security/Persistence precheck;
4. choose the smallest safe next slice from actual architecture — do not assume a label from history;
5. remain outside Production/Provider/other special PO gates unless separately approved;
6. cut versioned Issue + Task + Branch + Draft PR;
7. dispatch one fresh Cursor agent;
8. no second follow-up slice automatically.

**Live-Evidence wins always.**
