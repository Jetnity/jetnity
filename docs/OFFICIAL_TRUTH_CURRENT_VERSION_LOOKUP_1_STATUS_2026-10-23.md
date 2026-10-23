# Official Truth Current-Version Lookup 1 — STATUS

Date: 23 October 2026 (Europe/Zurich)
Issue: #975
Draft PR: #976
Branch: `feat/official-truth-current-version-lookup-1`
Writer: **Jetnity Official Truth Current-Version Lookup 1 — Cursor Generation 1**
Session: https://cursor.com/agents/bc-16e2789c-fc9b-4bbc-925b-ba43273b6cc3
Actual model: `grok-4.7-high-fast`

This status is not a Technical-Lead PASS. Cursor does not mark Ready and does not merge.

## What is implemented

A caller with an exact canonical cell definition, scope, fact kind and requirement type can ask the local database for the unique currently usable retained receipt. The caller does not pass a fingerprint or a candidate list.

`official_original_api.lookup_current_version` runs inside the caller's open `READ COMMITTED` transaction. It checks the supplied external lifecycle witness with the existing `check_head` SHARE lock, proves the accepted event/binding/review/receipt set is complete, applies the existing ceilings, and returns one structured row: `no_match`, `ambiguous`, `refused`, or `unique`. Only `unique` continues into the existing `readCandidate` on that same connection. The historical archive proof stays a separate `REPEATABLE READ` / `READ ONLY` connection opened by `readCandidate`.

The row is explicitly local and non-authoritative: `productionAcceptedRead = NOT_AUTHORIZED`, `positiveVisaCells = 0`, `reusablePositiveCache = false`. The fingerprint is fresh only for that witness and `read_at`. A later decision runs the proof again.

## What remains unimplemented

Real-source retrieval, government or provider calls, hosted Development/Production SQL, migration apply, the denied #917 readback and any alternate route, legacy accepted-claim writes, app/pilot/provider activation, key hosting, retention choice, and Production acceptance remain unimplemented. `requirementsProviderAus()` still returns null. Legacy `private.official_evidence_versions` and `private.official_rule_claims` stay empty in the local proof.

## Heads

Re-read immediately before these documents, without rebase:

| Ref | Value |
| --- | --- |
| Implementation head before these documents | `4578052e0f4dbf9b3df883c6a5e79a308ba03557` |
| Tree of that head | `d08308c1137aead3fe13166cdb47cfa24ac21cfa` |
| Dispatch baseline / merge-base with current origin/main | `5269b9192a2300c6c03fc8659964583130d2d1d1` |
| Current origin/main | `de169965f8318a46bdd350eb14df88b0682fc803` |
| Ahead / behind origin/main | 9 ahead / 13 behind |
| Operating mode | `NORMAL` |
| TASK V1 blob | `d74d6f3e88eec0fe807cc57a71913235dfc572bd` |
| TASK V2 blob | `2e20181849d5575b440fcec004b521e562775751` |
| TASK V3 blob | `2f304122b59bba6bdb5f0bbb86fba46b139d3add` |

Main moved after the baseline by merging #972 and #973. The path sets are disjoint. This branch was not rebased and main was not merged in. The documentation commit that adds this file is the review head; it does not change the lookup SQL or TypeScript. The PR records that final SHA.

## Local proof

Command, with `SUPABASE_PROJECT_REF` removed from the process environment because the existing local-cluster guard rejects that inherited name:

`env -u SUPABASE_PROJECT_REF node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-current-version-lookup-1.test.ts`

Result on `4578052e`: PASS, 126.97s, PostgreSQL 16.15, `hostedWrites: 0`. The diagnostic lists empty corpus, unpublished review, unbound receipt, exact match on a new connection, wrong identity, ambiguity, damaged competitors, count/byte ceilings, explicit supersession, source/profile/expiry/stale witness/restored head, publication lock, withdrawal lock, and empty legacy tables.

Full suite on the same head, same environment removal:

`env -u SUPABASE_PROJECT_REF npm test`

Result: 7098 tests, 7094 pass, 0 fail, 4 skipped, exit 0, about 588s. The four skips are pre-existing layout-audit and CI-without-PostgreSQL cases, not this lookup.

## Other checks on this work

- `npm run typecheck` PASS on `4578052e`
- `npm run build` PASS on `4578052e` (Next.js 16.4.1)
- `npm run lint` on the earlier implementation head: 0 errors, 146 pre-existing warnings. The files touched by the fixture move were linted again with 0 errors.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode`: PASS. Schema check still reports the previously known LOCAL/UNAPPLIED RPCs. This lookup is not a Supabase `.rpc()` call.

## Not checked

Hosted migration apply, hosted database access, real source calls, #917 readback, browser UI, and Production. CI and Preview for the final head are outside this local proof and are reported in the handoff as whatever GitHub shows after the push. They are not an implementation PASS.
