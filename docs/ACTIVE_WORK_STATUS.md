# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / E5-B3A AGENT HEAD TL-PASS / FINAL INTEGRATION CONTINUITY GATING / REPOSITORY-ONLY / NO PRODUCTION APPLY / LIVE-EVIDENCE WINS**

## 1. Canonical main before E5-B3A merge

`main@3df9af4d6c3da750d50777706bce03589007a58a`

Commit:
`Close Entry Requirements E5-B2A continuity (#337)`

Pre-slice live evidence:

- Main CI #1517 / Run `33420869626`: SUCCESS;
- Vercel Production: SUCCESS;
- Ruleset `Jetnity main protection` / ID `21875372`: active;
- strict PR/CI/Auth/Vercel/Conversation Resolution/merge-only, bypass empty.

## 2. Active slice

Issue:
**#338 – Entry Requirements E5-B3A – server-owned flight event provenance persistence foundation**

Draft PR:
**#340**

Branch:
`feat/entry-requirements-flight-event-provenance-e5b3a-2026-08-31`

Agent:
**`Jetnity entry requirements event provenance persistence 1`**, Generation 1

Session:
`bc-e7a50347-1c66-4cd1-bbd2-979b89590a40`

Task:
`docs/ENTRY_REQUIREMENTS_SERVER_OWNED_FLIGHT_EVENT_PROVENANCE_E5B3A_TASK_2026-08-31.md`

Canonical TL review:
`docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3A_REVIEW_2026-08-31.md`

## 3. Review history

Initial delivery head:
`79dda7593bb9fbb20c36dc54348920e994da6823`

TL verdict there:
**CHANGES REQUIRED** – P2 because `provider_belegt=true` could be persisted without a concrete provider-source `external_ref`.

Same-agent fix commit:
`f918dc0ed58b4962389a860d5a1b6bf74513cd1b`

Final agent + delivery-doc head:
`d37b600f67537f4ccb816182009b6018a39f82a3`

Independent TL verdict on that exact head:
**PASS / no open P0-P1-P2 findings.**

Exact-head evidence:

- CI #1522 / Run `33427796712`: SUCCESS;
- Auth: SUCCESS;
- Typecheck/Lint/Tests/Hygiene/Production Build: SUCCESS;
- Vercel: READY / SUCCESS;
- GitHub review threads: 0;
- Vercel unresolved feedback: 0;
- branch 0 behind; merge-base exact main.

After PASS only TL-owned review/continuity files are being added. The resulting integration head must be separately re-gated before Ready/Merge.

## 4. E5-B3A repository foundation

New repository migration:
`supabase/migrations/20260831190000_trip_item_flight_event_provenance.sql`

New contract test:
`lib/flight-event-provenance/e5b3a-persistenz-vertrag.test.ts`

Core contract:

- dedicated `public.trip_item_flight_event_provenance` beside `trip_items`;
- exact Item × Leg × Segment × `departure|arrival` current occurrence identity;
- local date/time, timezone and absolute event instant are separate facts;
- concrete `external_ref` is mandatory provider-source evidence;
- server-generated `occurrence_event_ref` is internal occurrence identity, not provider evidence;
- authenticated owner may SELECT only;
- no authenticated/anon direct write;
- private SECURITY-DEFINER writer in `jetnity_internal`, `search_path=''`;
- dedicated NOLOGIN writer/runtime roles;
- runtime gate defaults false/unallocated;
- validation precedes atomic current-snapshot DELETE+INSERT;
- no SQL timezone/DST resolution.

Binding rule:

> **Persisted does not mean provider-proven.**

## 5. Production remains unchanged

Supabase Production project:
`qscbgcdmivbbnzrcyegn`

Read-only verification after final agent head confirmed all E5-B3A Production objects absent:

- relation absent;
- writer function absent;
- runtime gate absent;
- writer role absent;
- runtime role absent.

No Production migration, RLS/grant/role/function mutation, principal allocation, app writer or backfill has occurred.

## 6. Runtime / truth boundaries unchanged

Still inactive:

- `flugNachweisAusUmgebung()` → `null`;
- `requirementsProviderAus()` → `null`;
- no Flight/Route/browser persisted timezone/event fields;
- no Trip/Route → OfficialTemporalAnchor resolver;
- no E5-A automatic binding;
- no deadline/action-window/urgency/task/reminder/notification runtime;
- no real Requirements provider;
- no credential/passport ranking.

## 7. Product-Owner gate

Explicit Product-Owner approval remains mandatory before any later:

- E5-B3A Production migration apply;
- Production RLS/grant/role/function creation/change;
- runtime/login principal allocation;
- real application write path;
- Production backfill or real-data mutation.

Merging the current repository migration file does **not** apply it to Production.

## 8. P3 / later requirement

Before Production apply, execute and verify the migration against a disposable PostgreSQL/Supabase test environment. Current tests validate the repository SQL contract, not a live apply.

A future trusted mint must reuse E5-B1R timezone recognition and E5-B2A fail-closed event-instant resolution; SQL must not become a second temporal truth engine.

## 9. Entry Requirements foundation

Present on current main before this merge:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A Exact Event-Instant Projection Core;
- E5-B1R ephemeral provider-observed airport timezone evidence;
- E5-B2A ephemeral airport event-instant resolution.

E5-B3A is currently a reviewed repository PR only; it is not Production truth until a later explicitly approved Production apply.

## 10. Immediate next action

1. determine final integration head after TL review/continuity commits;
2. verify diff from `d37b600f...` is docs-only TL continuity;
3. run exact-head CI/Auth/Vercel/thread/drift gates;
4. if green, Technical Lead may Ready/Merge under normal repository workflow;
5. do **not** apply the migration to Production;
6. after merge verify exact new main CI + Vercel Production;
7. read-only confirm Production still has no E5-B3A objects;
8. close Issue #338 as repository-foundation completed and update Parent #294;
9. no automatic E5-B3B/follow-up.

**Live-Evidence wins always.**
