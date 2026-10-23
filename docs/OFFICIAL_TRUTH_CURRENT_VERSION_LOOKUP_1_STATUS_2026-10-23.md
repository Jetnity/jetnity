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

Review-fix F1: before any terminal or cell/fact filter, and before `verify_retained_v2`, every accepted receipt must have its protected review packet key equal to `proof.reviewPacketKey`, and its ordered supports equal to the stored original version id and raw digest in position order, with the same version id on the receipt support. That comparison uses review and original metadata. It does not decrypt originals and does not copy `readCandidate`. A damaged review refuses the whole lookup without hashing an already incomplete corpus. A corpus that passes the review pass still gets `verify_retained_v2` on every accepted receipt before a match is counted. A damaged review on a different cell refuses both a real match and a request that would otherwise be `no_match`.

Review-fix F2: job `120529859925` on `a1da094eeffab809e444790d81afa420ad45c9d1` timed out this test at 300000ms (`testTimeoutFailure`) before the later docs commit cancelled the job. The same scenarios on this machine took 155.4s uncontended. Pinning the corrected proof to one core did not change its time. The measurements show reduced repeated proof work and are consistent with the broader runner slowdown: the unchanged R3 native proof took 393666ms on that run and 219296ms on the later successful run, ratio 1.80. No reproduced deadlock; exact old-run cause not established. The corrected proof stores each accepted receipt once, keeps one full custody read for the first identity, and records phase timings in the diagnostic. The test timeout stays 300000ms. SQL statement, lock and witness limits are unchanged.

Review-fix F3: `storeAccepted` opens its own `ot_original_test_writer` connection, publishes and binds in that explicit transaction, commits, and closes the producer in `finally` before aligning the lifecycle witness and returning. The fresh-reader lookup, including a tainted caller fingerprint, starts only after that backend is gone. The publication race still uses a different long-lived writer. The reviewed SQL blob `609d10b9727e5fa4f91896d64086798e989ae50b` is unchanged.

The row is explicitly local and non-authoritative: `productionAcceptedRead = NOT_AUTHORIZED`, `positiveVisaCells = 0`, `reusablePositiveCache = false`. The fingerprint is fresh only for that witness and `read_at`. A later decision runs the proof again.

## What remains unimplemented

Real-source retrieval, government or provider calls, hosted Development/Production SQL, migration apply, the denied #917 readback and any alternate route, legacy accepted-claim writes, app/pilot/provider activation, key hosting, retention choice, and Production acceptance remain unimplemented. `requirementsProviderAus()` still returns null. Legacy `private.official_evidence_versions` and `private.official_rule_claims` stay empty in the local proof.

## Heads

Re-read immediately before these documents, without rebase:

| Ref | Value |
| --- | --- |
| F2 implementation head | `e9f66adaa79a5c690303481decaa7341187633f7` |
| Integration merge | `90d120bf3fc29c2bff694176000f62176bdef8b2` |
| Merge parents | `2e251c853d87e700b65ccb29590229d9992e23d4` and `8ec8e8ed8a63781fa88ece617b17f382340b6645` |
| Integrated main tree | `5c583d65df5e087baf9131e5d56d515e06c43544` |
| Dispatch baseline | `5269b9192a2300c6c03fc8659964583130d2d1d1` |
| Integrated origin/main | `8ec8e8ed8a63781fa88ece617b17f382340b6645` |
| Ahead / behind at the merge, before the F3 commit | 15 ahead / 0 behind |
| Operating mode | `NORMAL` |
| TASK V1 blob | `d74d6f3e88eec0fe807cc57a71913235dfc572bd` |
| TASK V2 blob | `2e20181849d5575b440fcec004b521e562775751` |
| TASK V3 blob | `2f304122b59bba6bdb5f0bbb86fba46b139d3add` |
| SQL blob | `609d10b9727e5fa4f91896d64086798e989ae50b` |

Ordinary merge of the authorised main. No rebase and no path overlap. The F3 test change and these notes are the single commit on top of that merge. That commit is the review head. If origin/main is still `8ec8e8ed8a63781fa88ece617b17f382340b6645`, the review head is 16 ahead and 0 behind. The PR records its SHA. Incoming main files do not transfer writer ownership.

## Local proof

Command, with `SUPABASE_PROJECT_REF` removed from the process environment because the existing local-cluster guard rejects that inherited name:

`env -u SUPABASE_PROJECT_REF node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-current-version-lookup-1.test.ts`

Result on `e9f66adaa79a5c690303481decaa7341187633f7`: PASS, 119.9s uncontended and 119.1s pinned to one core, PostgreSQL 16.15, `hostedWrites: 0`. The same test inside the full suite took 120.7s. The diagnostic lists the same checks as before, including the damaged review packet key and ordered support list on another accepted cell, plus per-phase milliseconds. Both the real match and the otherwise empty request refuse with `accepted_corpus_incomplete`. After rollback, the untouched match succeeds and the empty request is `no_match` again. The pre-correction measurement of the same scenarios was 155.4s; the damaged-review phase fell from 31.3s to 13.1s. Those timings do not establish a unique cause of the older CI timeout.

Result on the integrated F3 tree, before this documentation text was committed and with the same test file this commit contains: PASS, 120236.681862ms, PostgreSQL 16.15, `hostedWrites: 0`. The diagnostic has the previous checks plus `that fresh lookup starts only after the accepted-store producer is closed`. `productionAcceptedRead` is `NOT_AUTHORIZED` and `positiveVisaCells` is 0. No second local full suite was run for this connection change. The earlier full suite remains evidence for `e9f66ada` only.

## Other checks on this work

- `npx tsc --noEmit` PASS on the tree committed as `e9f66adaa79a5c690303481decaa7341187633f7`. It was not re-run for this fixture-connection change. The focused proof executed the changed test under `tsx`.
- `npm run build`, `npm run lint` and the hygiene checks were not re-run on the integrated head. The previous build, lint (0 errors, 146 pre-existing warnings) and hygiene PASS were on `a1da094eeffab809e444790d81afa420ad45c9d1`. This lookup is still not a Supabase `.rpc()` call. Final-head CI is the gate for typecheck, lint, build and the full suite.

## Not checked

Hosted migration apply, hosted database access, real source calls, #917 readback, browser UI, and Production. CI and Preview for the integrated review head are pending until GitHub reports them after the push. They are not an implementation PASS.
