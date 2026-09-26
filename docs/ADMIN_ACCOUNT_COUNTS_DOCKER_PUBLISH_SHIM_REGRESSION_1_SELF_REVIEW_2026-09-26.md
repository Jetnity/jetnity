# Admin Account Counts Docker Publish Shim Regression 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Owned only this correction:

- `scripts/e2e/admin-account-counts-local-runtime-1/docker-publish-shim.mjs`
  - restore module-scope `parseDockerPublishValue` and `formatLoopbackPublishValue`
  - keep C1 `renderShimSource()` `.toString()` freeze
  - keep C2 image/CMD boundary
  - refuse `-P` / `--publish-all` with the existing `/publish-all/` assertion
- `scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
  - pin generated shim bytes contain both helper function names (no assertion weakening)
- this slice STATUS / HANDOFF / SELF_REVIEW
- `docs/ACTIVE_WORK_STATUS.md`
- task status line only

Canonical Supabase config, Mailpit enablement, official CLI archive/binary bytes, Docker Desktop/daemon settings, product/Auth/SQL/migrations, root package/lock/CI and #564 observation helpers were not changed.

Unrelated workspace drift `next-env.d.ts` was restored and never staged.

## Review mapping

| Requirement | Correction |
| --- | --- |
| Restore exact strict module-scope parser/formatter | same accepted contract as `15c6bbc8` / `e5e6557` generated strings |
| C1 run-owned self-contained hashed shim | still `${parseDockerPublishValue.toString()}` / `${formatLoopbackPublishValue.toString()}` |
| C2 Docker image/CMD boundary | `rewriteDockerArgv()` still copies image+CMD byte-for-byte |
| Direct rewrite accepted publish | `54324:8025` -> `127.0.0.1:54324:8025`; protocol preserved |
| Public/IPv6/hostname/range/malformed | still refused; no assertion weakening |
| Generated shim has no repo import | existing self-contained test plus helper-name pins |
| Repo mutation after shim creation | existing test still proves already-created shim is frozen |
| Fail-closed provenance/mode/symlink | existing proof test unchanged |
| No CLI/config/Auth/SQL/product/CI change | only shim helper + two test pins + docs |

## Misleading claims corrected

`codeCompleteClaim` remains false. Helper PASS is not a real-Mac PASS and does not prove the next live Mailpit mapping. This writer did not run `run.mjs`, official binaries, Docker, or Playwright.

The merged #565 regression was a missing module-scope materialization after C1 switched generated source from string literals to `.toString()`. The helper bodies were never deleted from the intended contract; they were only absent as live functions.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **57/57 PASS, 0 FAIL** on this Linux agent (14.2s). Log: `/opt/cursor/artifacts/aaclr1-controlled-tests.log`.

Exact `4a1fe07b` GitHub CI run `36247114473` SUCCESS, Auth job `108418378030` SUCCESS, Vercel Preview `8n4rmHqTxFovMWqDG2LzKRdEafHi` READY. Review threads: none. Re-read those gates on any later head.

Real Docker / official CLI / user's Mac / hosted Supabase / Production: **NOT RUN / NOT MUTATED**.

## Residual risks

- P0/P2: the next authorized real Mac run is still required to prove live Mailpit `8025/tcp -> 54324` now binds `HostIp=127.0.0.1` after the repaired shim and still PASSes #564 inspection
- P2: if Docker Desktop still publishes an extra IPv6 `::` / `[::]` mapping beside the rewritten IPv4 loopback, #564 continues to fail closed. That is intentional
- P2: this shim rewrites `docker create` only. A later CLI lifecycle that uses `docker run -p` is out of this slice and must fail closed at runtime inspection
- P3: helper doubles cannot prove every live Docker Desktop create argv beyond the pinned v2.117 forms (`-p VALUE`, `--publish VALUE`)

## Proactive note (out of scope)

The C1 `.toString()` freeze remains correct, but it is brittle if a later helper is referenced without being materialized at module scope. This slice pinned the two missing function names in the generated shim bytes. A later dedicated slice could add a static check that every identifier interpolated into `renderShimSource()` exists. Do not start that here.

Traveller-context intelligence is not relevant to this local Docker publication repair.

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, real-Mac acceptance, or full local execution.
