# Change Impact Foundation V1 — implementation report

Date: 2026-10-16, Europe/Zurich. Author: **Jetnity Change Impact Foundation V1 — Codex Generation 1**. Issue #956; existing Draft PR #957; branch `feat/change-impact-foundation-v1`. SINGLE_AGENT. Independent TL review remains required.

## Result and contract

`changeImpactFoundationV1(baseline: Trip, observed: Trip)` compares two already-authorized saved snapshots without modifying them. It is a dormant **Node-only internal function**, not an API or browser entry. It reports stored field changes, review relationships through persisted day/stage/item identity, and original temporal/lodging/flight/mobility evaluation changes only at a common evaluation level. It does not apply a change, evaluate ownership, verify freshness, obtain provider data, or claim trip safety.

A versioned report separates `direct_change`, `canonical_evaluation_delta`, `relation_needs_review`, and `unknown`, with baseline/observed evidence, source names, reason codes, unchecked scope and visible omitted counts. Field names remain inspectable while private titles, notes, booking links/references, pricing and other free-text values are not reflected. Selected direct plan fields are intentionally not a full diff of traveller/document/readiness data. `reiseDiff` supplies explicitly nonexhaustive redacted human summaries.

Files form one family: `contract.ts` (types/bounds), `input.ts` (inert snapshot admission), `changes.ts` (stored changes/relations/redacted canonical summaries), `evaluations.ts` (original evaluator projections/comparison), `index.ts` (composition), synthetic `fixtures.ts`, and two test files. No existing file is modified; no import activates this namespace in application runtime.

## Safety and determinism

Descriptor-only bounded cloning rejects proxies before traps (`node:util.types.isProxy`), accessors, cycles/shared references, exotic prototypes, symbols, hidden fields, malformed numbers and excessive count/text/depth. The original `reiseSchema` remains authoritative; provided values altered by its normalization, and unknown fields stripped by it, are rejected. Required inventory/identity/revision, duplicate IDs, ambiguous stage order, inconsistent placement and conflicting item/day stage assignments fail closed. Cross-trip failure does not reflect either identity. Backwards revisions are blocked; same-revision edits remain unverified.

Two-snapshot bounds include 100 items per snapshot, 140 expanded temporal events per snapshot, 19,460 combined potential pairs, 40,000 visited values, 200,000 input characters, depth 20, individual string 2,048 characters, canonical maximum day/stage counts, and bounded lodging spans/work before original enumeration. Reports cap 256 claims, 24 references per claim, 64 summaries of 512 characters, and 160,000 serialized characters. Caps produce `incomplete` and omitted/reason evidence; they are computational limits, not travel rules. Fixed code-unit order replaces locale-sensitive identity ordering. Frozen/permuted inputs and isolated TZ/LANG processes are tested.

Relationships use each original snapshot independently, including an item's explicitly persisted parent-day stage, never a combined/hybrid graph. Only meaningful original possible/proven temporal pairs supply time relationships; an unevaluable all-pairs scan cannot link the whole trip. Failures invalidate the entire affected domain comparison while retaining separately grounded stored changes; the overall result is incomplete.

## Canonical limitations, explicitly retained

- Current `tripZeitpruefung(Trip)` produces civil/unknown boundaries and cannot emit proven conflicts from qualified instant candidates. T04 tests actual original kernel results through the private comparator and separately tests that the public Trip entry never invents proven/resolved outcomes. No new instant authority or public injectable evaluator was added. `no_proven_conflict` never means safe.
- Temporal subevent indices are snapshot-local. Any multi-event/subevent/multi-pair item identity is conservatively unknown across snapshots. Baseline and observed status are not compared as resolved/newly proven when either level is unavailable.
- `covered_by_flight` exists in the original mobility type but the current engine deliberately does not emit it. T06 preserves that contract state through a private projection and separately verifies actual canonical Trip behavior. No substitute ground-transfer/flight coverage engine was added.
- Lodging evidence copies original gap fields except free-text stage names. Stored selected/booked statuses never become supplier confirmation. Unknown stays, undeterminable connections and unassigned coverage stay partial/unknown.

## Acceptance and local verification

All T01–T12 are mapped in `SELF_REVIEW`; 22 new test cases exercise the public entry and the stated private canonical projection boundaries. Focused plus ORIGINAL schema/workspace/reiseaenderung/temporal/lodging/flight/mobility regressions: **329 passed, 0 failed, 0 skipped**.

| Original command | Local result |
| --- | --- |
| `npm ci` | PASS; existing audit: 18 vulnerabilities (16 high, 2 moderate); lock/packages untouched |
| `npm run check:setup:ci` | PASS; existing warning: no local env files |
| `npm run check:operating-mode` | PASS, NORMAL |
| `npm run typecheck` / `npm run lint` | PASS |
| `npm run check:api-schutz` | PASS, 12 routes |
| `npm run check:schema-bezug` | PASS, 22 tables / 25 functions; existing historical LOCAL/UNAPPLIED notes retained |
| `npm run check:dead` / `check:exports` / `check:deps` | PASS, zero findings |
| `npm run build` | PASS, Next 16.4.1 |
| `npm test` | 6,842 tests: 6,831 passed / 10 failed (native-PG prerequisites) / 1 existing skip |
| `npm run auth:pruefen` | BLOCKED locally: `SUPABASE_PROJECT_REF fehlt`; both required variables absent |

Full local suite is **not a PASS**: ten native PostgreSQL tests fail because `initdb` is absent (`ENOENT`/`local_postgresql_not_available`); one existing native-PG test skips. No test was weakened, skipped by this task, or moved to an alternate runner. Original GitHub CI with its native environment and real Auth `Abgleich` must finish on the published implementation head. No local secrets were fetched or changed.

The final publication receipt belongs to a PR comment and the local handoff output, because a document cannot contain its own future commit SHA. Seed checks are never implementation evidence. Exact remote SHA/tree, immutable task blob, main/merge-base/ahead/behind, full diff, CI steps, Auth and Preview must be freshly read after push.

## Scope and remaining gates

Only eight new namespace files and four new task-owned docs are authored, in addition to the pre-existing TASK-only seed. TASK blob remains `351254986203c8a6fe3c4e7f6737653b3a76cfe4`. Provider remains null; no API/UI/model/network/storage/DB/auth/security/package/workflow/deployment configuration changes. No live production or traveller/provider processing. Cost increase: none from dormant code.

The explicit Product Owner Full Access continuation in this session resolves the earlier execution-permission/DNS stops only. #917 SOURCE_NOT_QUALIFIED, #944 government GET/contact stop, DEV-PREP-1 safety database gate, #911/#913 privacy, Bern #934/#937, #626 and production/provider/launch gates persist. Independent #955 remains outside this implementation. Only TL determines integration, Ready and merge. No automatic follow-on.
