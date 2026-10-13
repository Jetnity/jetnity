# R3 continuation validation evidence — 13 October 2026

Scope: code-only F1/F3 and offline F2 on input e9a6e1a654ddd28ede53631aeaf4e979867fd325. No physical Bern request or GitHub reservation occurred. All new GitHub responses and claim results in tests are simulated. Existing public PO comment text is a fixture for its authenticated-body binding, not a new grant.

## Final local results

| Command/check | Result |
| --- | --- |
| npm ci --cache ../npm-cache --no-audit --no-fund | PASS, 530 packages; lockfile unchanged |
| node --import ./scripts/server-only-test-register.mjs --import tsx --test 'lib/readiness/official-truth-bern-g3-rq-fetch-1/*.test.ts' | PASS 163/163, 10.222s, zero fail/cancel/skip/todo |
| npm test (native PostgreSQL16, netless container) | PASS **6618/6618**, 819 suites, 362.759s, zero fail/cancel/skip/todo |
| PG16 M1–M4 | PASS **77.609372494s / unchanged 240s**; PostgreSQL 16.15 Debian |
| npm run typecheck | PASS |
| npm run lint | PASS, 0 errors; 145 pre-existing warnings outside changed source |
| npm run check:setup:ci | PASS; local .env absent warning, no new secret created |
| npm run check:operating-mode | PASS, NORMAL, explicit existing branch/main input SHA |
| npm run check:schema-bezug | PASS, 22 tables/views and 25 functions; existing LOCAL/UNAPPLIED distinctions preserved |
| npm run check:api-schutz | PASS, 12 routes |
| npm run check:dead | PASS, 0 unexplained orphan modules |
| npm run check:exports | PASS, 0 unexplained unused exports |
| npm run check:deps | PASS |
| npm run build | PASS, compiled/typechecked and completed prerendering/routes |
| git diff --check | PASS |
| developer CLI without arguments | NOT_RUN, exit 0, physicalAttemptMade=false, rawSourcePersisted=false |

Full suite is baseline 6471 + 147 net new tests. The targeted count also includes the retained research-boundary tests. All 100 statuses 300–399 are individually asserted inside one test, including cancellation failure. API error matrices exercise every read boundary; independent processes race against a shared simulated service; errors after claimed creation do not permit reuse. Existing 131072-byte bound, framing, UTF8, timeout and stream-abort negative tests remain.

## Reproduction environment and earlier failures

Node 22.23.3; local npm install uses the repository lockfile. The existing `jetnity-r2-validation:local` image supplies Node and native PostgreSQL16; its package-lock SHA256 matches the checkout: `8dead8237adef171588abd088e25f9be2472a7458121e4198cacd8ece224a7da`. No packages, timeout, workflow, SQL or test expectations outside this task were changed.

The final full command uses the existing image, repository read-only mount, disposable copy and `--network none`:

```sh
docker run --rm --network none --mount type=bind,src="$PWD",dst=/source,readonly --entrypoint sh jetnity-r2-validation:local -c 'mkdir /tmp/r3-repo && tar -C /source --exclude=node_modules --exclude=.next --exclude=tsconfig.tsbuildinfo -cf - . | tar -C /tmp/r3-repo -xf - && ln -s /test-deps/node_modules /tmp/r3-repo/node_modules && cd /tmp/r3-repo && env -u PG_MAJOR -u PG_VERSION -u PGDATA npm test'
```

The initial full run correctly refused six PG tests because the image's inherited PG_MAJOR/PG_VERSION/PGDATA variables violate their local-only environment guard. That run was not a PASS (6600/6606). Removing only those inherited variables produced the complete result above, including the additional PG subtests. Initial new test harness ESM/CJS import/type/static-import-check failures and one lint prefer-const/one unused fixture export were corrected, without weakening assertions. Local sandbox blocked tsx IPC for setup/build and partial-clone Git reads for the mode guard; the same commands then passed with execution permission. These are recorded as real initial failures, not counted as final passes.

No hosted Supabase or Auth probe was run locally and none is falsely counted. Original GitHub Auth55/243 and Verify logs, plus exact-SHA Vercel Preview, require post-publication readback and appear in the publication receipt. Old-head CI does not certify this source. Existing G7 advisories and P2 PG timing variance remain open.

## Source-bound checks

The shared source prefix before BERN_RESEARCH_URL is byte-identical to input e9a6e1; the only shared edits are inside its approved Bern research section. No changed package/lockfile, app, component, Supabase, schema, workflow, trusted profile or source-catalog paths. Live ruleset readback still contains only active main rule 21875372; no tag protection or real claim was created. Draft #935 and remote main unchanged before publication.

## Local log integrity

These hashes identify the retained local logs and are not government source hashes. Only test/build outputs are hashed.

| Log | SHA256 |
| --- | --- |
| npm ci | `91648aba777e06b89b702e66599d8e3ba79912d149d882628b5d595f2155bce6` |
| targeted | `2e6c1c2c990d873c68823eb1751a1d62dd76576537820741cbee7e89ae33083b` |
| full tests | `44d054403d2248d8166ad008e53a2dab713bac90f5d55c4344615d9d27503083` |
| typecheck | `dd3664593253fd7f51f6967257a09ef001e381f7c8968d6b82c9d5cd462ed848` |
| lint | `1e468397195614e3002d19e01e60f6c79e3390818ccf9766dd4d5cb086365514` |
| setup | `50fb68f691e14953bf4bb2c369056edb522f693f1e333ad7289240a79e6723a5` |
| dead | `9199f6fa2bc2ab0fc473030eb3569748cc3dcbab9b8cc051939fed05c3369d8c` |
| exports | `cdfdceb4bbbe57777c6c19a46a0ec2ab2f61b36dcf79a19710e38a0206774a5d` |
| dependencies | `b0045c5119b0db679d23c0bde2efa30e4987390d9f38107eb7b2c446542bba7d` |
| API | `68521a53655070c33953244451145b33fc6bda961bc3dd65b93c5e4ed72b9f79` |
| schema | `0a2dca793641f33b1b99bbbb6d46f296d52176f8c467f1d043837f30a09cd1f1` |
| mode | `e93933dd64bf35c8d02baf9e17ca3d48e081910f352150061e72c7bfb88e3f7f` |
| build | `8a329f3b252937c45d3e8c31158c273b1cb6a47ea7136afbf6ae359a316ee9c9` |
| no-args CLI | `3734486f472b2b78795b4bedbe5b4b8778271d2db47024950628de57eb2128d5` |
