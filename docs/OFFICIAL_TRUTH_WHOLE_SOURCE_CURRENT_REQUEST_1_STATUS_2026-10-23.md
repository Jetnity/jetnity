# Official Truth Whole-Source Current Request 1 — STATUS

**Cursor-Agent: Jetnity Official Truth Whole-Source Current Request 1 — Cursor Generation 1**

Date: 23 October 2026. Draft PR #985. Issue #982. Parent #917. Branch `feat/official-truth-whole-source-current-request-1`.

This is code-only engineering of a dormant current-request path. It is not source qualification, not a live Fedlex read, not hosted proof, and not an application enablement. Self-review is not Technical-Lead PASS.

## Session and model

- Requested model: Grok 4.7 High Fast (`grok-4.7-high-fast`)
- Actual `originalModelName`: `grok-4.7-high-fast`
- Session: `bc-45700535-8356-442d-aba6-1ed8373578fc`
- Session URL: https://cursor.com/agents/bc-45700535-8356-442d-aba6-1ed8373578fc
- No UI rename.

## Git, re-read before handoff

Fetched `origin/main` and this branch. No rebase, merge, or cherry-pick.

- Immutable task blob: `b1371993e1e7f5b09ceebd4462325c1b94c3faba`
- Seed: `8953b2e858b7b07bf1b15464a39fdc4a944e2ae5`
- Plan commit: `661f9226524ec8636e474eb2cced6a626107da15`
- Dispatch main / merge-base: `ba0725d6dd2ce3d5e170eb1eab03cedef2def1de`
- First-handoff `origin/main`: `be0a8b68765e25dc3216dc1f61bfd4620af3e134` (PR #984 only)
- R1 re-read `origin/main`: `e372f4d830c35a74a235d345c2baaf08ab615e6c`
- Merge-base with that main: still `ba0725d6dd2ce3d5e170eb1eab03cedef2def1de`
- At the plan commit, before the implementation commit: 3 ahead / 5 behind
- R1 re-read: 5 ahead / 15 behind. The extra main commits are lodging PRs #984 and #983. `git diff --name-only` against this allowlist is empty. Not rebased.
- The final head SHA is the tip after the documentation commit. It is reported in the PR comment and is not repeated by an extra commit.

Operating mode re-read: `NORMAL`.

## Gates that stay closed

- `applicationPilotEnabled()` false
- `contracts` empty
- extractor production registry empty
- production profile registry has no Fedlex current-request profile
- provider off
- `positiveVisaCells` 0 in production
- #917 Stage 2 `NOT_ATTEMPTED`; denied readback not retried
- #968, #913, #626, Bern, #937, #957, #585 unchanged
- no SQL, migration, secret, Auth, RLS, provider, or production action

The synthetic pilot copy can return `verified` / visa `not_required` for generated text. That copy is outside the deploy graph. It is not a visa cell.

## Commands and results

Runtime: `node --import ./scripts/server-only-test-register.mjs --import tsx --test`.

| Command | Result |
| --- | --- |
| New protocol-3, fingerprint, history, content-identity, candidate-evidence, extractor importer tests | 112 pass, 0 fail |
| Autonomous custody foundation, history, current-request, fingerprint after the getter-walk fix | 68 pass, 0 fail |
| Application, cancellation, request, database, fingerprint v2, material, bounded body, retrieval, review packet/fingerprint/decision, coverage, composition, server-held, same-request proof/extraction/execution, bundle, autonomous custody, evidence store schema, store, original custody | 348 tests, 344 pass, 3 fail, 1 skip |
| Protocol 3, fingerprint, history, Bern research-only, server-owned retrieval after the public-reason fix | 96 pass, 0 fail |
| Current-request pipeline after export cleanup | 5 pass, 0 fail |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, 0 errors, 146 warnings |
| `npm run check:dead` | exit 0, 0 orphaned |
| `npm run check:exports` | exit 0, 0 unexplained exports |
| `npm run check:deps` | exit 0 |
| `npm run check:api-schutz` | exit 0, 12 admin routes |
| `npm run check:schema-bezug` | claimed exit 0 on head `385a621e`; that claim was wrong. See Review R1. |
| `npm run check:operating-mode` | PASS |
| `npm run build` | exit 0 |

The three failures in the 348-test run:

1. C22 getter count in `official-truth-autonomous-producer-custody-foundation.test.ts` was a real defect. The marker walk used `Array.some`, which invokes index getters. The walk now uses own-property descriptors for arrays and objects. The autonomous file then passed inside the 68-test run.
2. `official-truth-store-server.test.ts`: `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`. PostgreSQL 16 is not installed here. No database was started.
3. `official-truth-original-custody.test.ts`: `local_proof_connection_override_forbidden` from the existing local-cluster guard, before a protocol-3 call.

The one skip is the existing native-PG admission test in the bundle file. It was not given a database and was not newly skipped by this slice.

CI and Preview on the final head are not claimed here. They start after push. The previous Vercel preview belongs to an older head.

## P0–P3

- P0: none newly established.
- P1: #968 and #748 remain independent open risks. This slice does not close them.
- P2: the byte-cap compatibility gap now has a dormant code path. Real source, hosted readback, retention, and legal qualification stay open. Fresh `origin/main` `e372f4d830c35a74a235d345c2baaf08ab615e6c` is 15 commits ahead of merge-base `ba0725d6`, through lodging PRs #984 and #983. No allowlist overlap. Integration still has to be done by the Technical Lead, not by a silent rebase.
- P3: 146 lint warnings and the existing conditional browser skips remain the dated baseline. Browser suites were not re-run. No browser file changed.

## Review R1

Independent review of head `385a621e70a4f15622dad9312a96ee79717a6f59` required four engineering fixes. They are in the commits after that head. The TASK blob is still `b1371993e1e7f5b09ceebd4462325c1b94c3faba`. Main was not synced.

- F1: protocol 3 requires the unexported privileged transport symbol and `catalog == null`, plus the existing profile reference and tuple. Injected catalogs, including the exact compiled profile object, stay on 65536.
- F2: `serverHttp` refuses a second or malformed raw `Content-Type`, `Content-Length`, `Content-Encoding`, or `Transfer-Encoding` before the normalized map is trusted. Public reason remains `http_failed`, which R1 accepted.
- F3: eligible material, the current-request evidence constructor, and the application packet require a carried own-data marker 3. A missing marker is not rebuilt. Store and server-held results that still contain 3 are refused before client, RPC, or a downgraded return.
- F4: `officialTruthReviewIdentityCurrentRequest` accepts one non-composed support, own-data `identitySchema` 2, and protocol 3. Getters are not called. The old V3 function body is unchanged.

Hashing memory: the response buffer is one 393216-byte array. The SHA-256 preimage is not bounded to 384KiB. `JSON.stringify` of 393216 U+0000 characters is about 2.36MB.

`lib/readiness/official-truth-autonomous-review-material-server.ts` was read and not edited. It has no `sourceFingerprintProtocol` field, so it neither carries nor rebuilds protocol 3.

`scripts/db/verwendung.mjs` treats `.from('name')` as a table access. Head `385a621e` contained `Buffer.from('a')` in the fingerprint test and `Buffer.from('x')` in the harness, so the scanner reported unknown tables `a` and `x` and exited 1. The row above that said the check exited 0 was incorrect for that scanner. R1 uses `Buffer.alloc` with the same byte values, `0x61` and `0x78`. The scanner script was not edited.

## R1 commands on this tree

Runtime: `node --import ./scripts/server-only-test-register.mjs --import tsx --test` on the fingerprint v3, current-request, history-refusal, rule-review fingerprint, application, and Bern research-only files.

| Command | Result |
| --- | --- |
| Those six test files | 87 pass, 0 fail, 0 skip. The framing case included the 10-second hang (`duration_ms` about 10038). |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, 0 errors, 146 warnings |
| `npm run check:dead` | exit 0, 0 orphaned |
| `npm run check:exports` | exit 0, 0 unexplained exports |
| `npm run check:deps` | exit 0 |
| `npm run check:api-schutz` | exit 0, 12 admin routes |
| `npm run check:schema-bezug` | exit 0, existing LOCAL/UNAPPLIED RPC notes only |
| `npm run check:operating-mode` | PASS |
| `npm run build` | exit 0 |

PostgreSQL 16 `initdb` and the custody local-proof guard were not re-run in this pass. The earlier environment limits still stand. Postgres was not installed.

The exact new head and tree belong in the PR comment. CI and Preview from `385a621e` do not cover the new head. Self-review is not PASS. Stop for independent re-review.
