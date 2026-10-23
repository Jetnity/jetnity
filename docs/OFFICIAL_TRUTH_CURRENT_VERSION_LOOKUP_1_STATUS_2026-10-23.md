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

Review-fix F1: before any terminal or cell/fact filter, every accepted receipt must have its protected review packet key equal to `proof.reviewPacketKey`, and its ordered supports equal to the stored original version id and raw digest in position order, with the same version id on the receipt support. That comparison uses review and original metadata. It does not decrypt originals and does not copy `readCandidate`. A damaged review on a different cell refuses the whole lookup, including a request that would otherwise be `no_match`.

The row is explicitly local and non-authoritative: `productionAcceptedRead = NOT_AUTHORIZED`, `positiveVisaCells = 0`, `reusablePositiveCache = false`. The fingerprint is fresh only for that witness and `read_at`. A later decision runs the proof again.

## What remains unimplemented

Real-source retrieval, government or provider calls, hosted Development/Production SQL, migration apply, the denied #917 readback and any alternate route, legacy accepted-claim writes, app/pilot/provider activation, key hosting, retention choice, and Production acceptance remain unimplemented. `requirementsProviderAus()` still returns null. Legacy `private.official_evidence_versions` and `private.official_rule_claims` stay empty in the local proof.

## Heads

Re-read immediately before these documents, without rebase:

| Ref | Value |
| --- | --- |
| Implementation head before these documents | `a1da094eeffab809e444790d81afa420ad45c9d1` |
| Tree of that head | `b28f948454a73f56e4d7b464829fcc35ea2d3823` |
| Dispatch baseline / merge-base with current origin/main | `5269b9192a2300c6c03fc8659964583130d2d1d1` |
| Current origin/main | `9b8eb056d421afbd9b3b2a4dbba1eaff9c6b8cfd` |
| Ahead / behind origin/main | 11 ahead / 19 behind |
| Operating mode | `NORMAL` |
| TASK V1 blob | `d74d6f3e88eec0fe807cc57a71913235dfc572bd` |
| TASK V2 blob | `2e20181849d5575b440fcec004b521e562775751` |
| TASK V3 blob | `2f304122b59bba6bdb5f0bbb86fba46b139d3add` |

The Technical Lead cited main `8f64d5fdb819065791235879822b1074205899c0`. Current origin/main is `9b8eb056d421afbd9b3b2a4dbba1eaff9c6b8cfd`, which contains that commit and the later merges of #972, #973 and #974. The path sets are disjoint. This branch was not rebased and main was not merged in. The documentation commit that updates this file is the review head. If origin/main is still `9b8eb056d421afbd9b3b2a4dbba1eaff9c6b8cfd`, that review head is 12 ahead and 19 behind. The PR records the review SHA.

## Local proof

Command, with `SUPABASE_PROJECT_REF` removed from the process environment because the existing local-cluster guard rejects that inherited name:

`env -u SUPABASE_PROJECT_REF node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-current-version-lookup-1.test.ts`

Result on `a1da094eeffab809e444790d81afa420ad45c9d1`: PASS, 158.77s, PostgreSQL 16.15, `hostedWrites: 0`. The diagnostic lists empty corpus, unpublished review, unbound receipt, exact match on a new connection, wrong identity, ambiguity, damaged competitors, count/byte ceilings, explicit supersession, source/profile/expiry/stale witness/restored head, publication lock, a damaged review packet key and ordered support list on another accepted cell, withdrawal lock, and empty legacy tables. Both the real match and the otherwise empty request refuse with `accepted_corpus_incomplete`. After rollback, the untouched match succeeds and the empty request is `no_match` again.

Full suite on the same head, same environment removal:

`env -u SUPABASE_PROJECT_REF npm test`

Result: 7098 tests, 7094 pass, 0 fail, 4 skipped, exit 0, about 585s. The four skips are pre-existing layout-audit and CI-without-PostgreSQL cases, not this lookup.

## Other checks on this work

- `npm run typecheck` PASS on `a1da094eeffab809e444790d81afa420ad45c9d1`
- `npm run build` PASS on that head (Next.js 16.4.1)
- `npm run lint` after implementation head `a1da094eeffab809e444790d81afa420ad45c9d1`: 0 errors, 146 pre-existing warnings.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode`: PASS. Schema check still reports the previously known LOCAL/UNAPPLIED RPCs. This lookup is not a Supabase `.rpc()` call.

## Not checked

Hosted migration apply, hosted database access, real source calls, #917 readback, browser UI, and Production. CI and Preview for the final head are outside this local proof and are reported in the handoff as whatever GitHub shows after the push. They are not an implementation PASS.
