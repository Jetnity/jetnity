# Admin Account Counts Docker Publish Shim Regression 1

Date: 2026-09-26  
Status: ACTIVE / BOUNDED REPAIR / DO NOT READY / DO NOT MERGE  
Base: `0e08e22cb859818d902bfff1ecdea654f33abc39`  
Branch: `fix/admin-account-counts-docker-publish-shim-regression-1`

## Trigger

Real Apple-Silicon Mac controlled test execution on exact `main@0e08e22cb859818d902bfff1ecdea654f33abc39` exposed a merged regression in:

`scripts/e2e/admin-account-counts-local-runtime-1/docker-publish-shim.mjs`

Observed local test result:
- 57 tests total
- 48 PASS
- 9 FAIL
- dominant failures:
  - `ReferenceError: parseDockerPublishValue is not defined`
  - `ReferenceError: formatLoopbackPublishValue is not defined`

The merged module calls both helpers from `rewriteDockerArgv()` and from `renderShimSource()`, but neither helper exists at module scope on current main.

The real Mac full acceptance run must remain blocked until this regression is fixed, independently reviewed, integrated, and the controlled suite is green again.

## Root-cause evidence

Historical commit `e5e6557237c8d93678cba32fbb386123e1c2ba35` contained the parser/formatter implementation embedded as generated source strings.

Later C1 hardening commit `d3dadbebb38936d7a284038f6c8de4961d78b62a` changed generated shim construction to:
- `${parseDockerPublishValue.toString()}`
- `${formatLoopbackPublishValue.toString()}`

but did not materialize those functions at module scope. Exact accepted head `d39d5eb2828de6e8e6da26831bdeb4fb668c91b2` and merge `0e08e22cb859818d902bfff1ecdea654f33abc39` therefore contain unresolved references.

## Goal

Restore the missing reviewed parser/formatter helpers at module scope, preserve the C1 self-contained run-owned provenance design and C2 image/CMD boundary, and prove both direct module execution and generated shim execution are coherent.

## Required behavior

1. Add module-scope `parseDockerPublishValue(value)` and `formatLoopbackPublishValue(parsed)`.
2. Preserve the strict accepted publication contract:
   - accepted unqualified input: `hostPort:containerPort[/tcp|udp]`
   - accepted already-explicit host only: exact numeric `127.0.0.1`
   - output always explicit `127.0.0.1:hostPort:containerPort[/protocol]`
   - refuse public/empty host, IPv6, hostname, ranges, malformed values, unsupported protocols, missing ports and ambiguous syntax
   - port range 1..65535
3. Keep `rewriteDockerArgv()` parsing only Docker-create options before image.
4. Image + CMD suffix remains byte-for-byte unchanged, including literal `-p` / `--publish`.
5. Keep unknown pre-image options fail-closed.
6. `renderShimSource()` must freeze the exact same helpers into the run-owned hashed shim bytes; no repository import at shim execution time.
7. Harness Docker still bypasses the shim and uses exact verified absolute real Docker binary.
8. #564 `NetworkSettings.Ports` post-start verification remains unchanged and authoritative.
9. Do not change Supabase CLI version/pins/archive identity, Docker endpoint selection, canonical config, Auth, SQL/migrations, browser/product code, root dependencies or CI.

## Tests required

At minimum:
- existing full helper suite must return 0 failures;
- direct `rewriteDockerArgv()` accepted publish rewrite;
- public/IPv6/hostname/range/malformed rejection;
- protocol preservation;
- image/CMD boundary regressions;
- generated self-contained shim executes successfully and has no mutable repository enforcement import;
- repository-side module mutation after generated shim creation cannot alter already-created shim behavior;
- fail-closed shim provenance/mode/symlink/path cases remain green.

If existing tests already cover these, fix the implementation rather than weakening assertions.

## Execution boundary

Cursor may run controlled Node tests and normal exact-head CI/Preview evidence.

Cursor MUST NOT:
- run real Docker on the Product Owner Mac;
- execute the real full acceptance run;
- mutate hosted Supabase/Production;
- apply migrations/RLS/grants;
- activate account-count Production functionality;
- change provider/payment/domain/secret state.

## Deliverables

- smallest coherent code fix;
- focused regression test only if current suite does not directly pin the missing-helper failure;
- truthful STATUS/HANDOFF/SELF_REVIEW;
- exact head SHA;
- controlled test result;
- exact-head GitHub CI/Auth;
- exact-head Vercel Preview;
- no unresolved review threads.

## Agent

Logical name: **Jetnity admin account counts docker publish shim regression 1**  
Generation: **1**  
Required model: **cursor-grok-4.6-high-fast**

## STOP

Do not mark Ready.  
Do not merge.  
Do not start a follow-up slice.  
STOP for independent Technical-Lead exact-head review.
