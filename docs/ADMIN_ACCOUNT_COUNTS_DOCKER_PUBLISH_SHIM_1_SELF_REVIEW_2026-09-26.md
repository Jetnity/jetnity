# Admin Account Counts Docker Publish Shim 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Owned only this correction:

- `scripts/e2e/admin-account-counts-local-runtime-1/docker-publish-shim.mjs` (new)
- `scripts/e2e/admin-account-counts-local-runtime-1/stack.mjs` (require proven CLI-child shim before start; spawn uses `cliEnv` only)
- `scripts/e2e/admin-account-counts-local-runtime-1/runtime.mjs` (create/verify shim after CLI+Docker proof, before stack)
- `scripts/e2e/admin-account-counts-local-runtime-1/cleanup.mjs` (unknown shim ownership retains private HOME)
- `scripts/e2e/admin-account-counts-local-runtime-1/ownership.mjs` / `constants.mjs` / `implementation.mjs` / `run.mjs` / `README.md`
- `scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
- this slice STATUS / HANDOFF / SELF_REVIEW
- `docs/ACTIVE_WORK_STATUS.md`
- new sanitized receipts `aaclr1-20260926T114704Z-*`

Canonical Supabase config, Mailpit enablement, official CLI archive/binary bytes, Docker Desktop/daemon settings, product/Auth/SQL/migrations, root package/lock/CI and #564 observation helpers were not changed.

## Review mapping

| Requirement | Correction |
| --- | --- |
| Official CLI archive/binary byte-identical | no CLI unpack/repack; pin and archiveBound checks unchanged |
| Private run-owned shim named `docker` | created under private HOME/tooling; dir/file `0700`; no symlink; SHA256 recorded |
| PATH only for official CLI child | `cliEnv` prepends shim dir; parent env untouched |
| Rewrite `create -p` / `--publish` | `54324:8025` -> `127.0.0.1:54324:8025`; protocol preserved; multiple values rewritten |
| Explicit `127.0.0.1` preserved | pass-through |
| Public/ambiguous publish refused | `0.0.0.0`, `::`, localhost, LAN, ranges, `-P`, missing/single-field fail closed |
| `--expose` untouched | create `--expose` is not rewritten |
| Non-create delegated unchanged | inspect/ps argv forwarded byte-for-byte |
| Exact real Docker binary | shim embeds harness-selected absolute path; never PATH-resolves `docker` |
| Harness bypasses shim | `execFile(dockerBin)` stays the real binary |
| Hostile parent PATH | prepend + resolve proof; fake hostile `docker` is not used |
| Hash/symlink/mode/path fail closed | SHA256 mismatch, symlink, `0777`, missing ownership fail; `shimVerified=true` ignored |
| #564 inspection unchanged | prior 48 tests still PASS |
| Composed start PATH split | CLI spawn env resolves `docker` to shim; harness bins are the real binary |
| Cleanup retain if unknown | missing shim path/dir retains private HOME |
| No stack without proof | `starteOwnedStack` without shim/cliEnv does not create a network |

## Misleading claims corrected

`codeCompleteClaim` remains false. Helper PASS is not a real-Mac PASS and does not prove the next live Mailpit mapping. Default no-start `BLOCKED_ENVIRONMENT` on this Linux agent is expected: no docker executable and no official archive bytes.

The shim is prevention only. A later official CLI that emitted `docker run -p` instead of `create` would not be rewritten here; #564 would still fail closed on a public runtime mapping.

The owned-network option `com.docker.network.bridge.host_binding_ipv4=127.0.0.1` remains in place and is still not treated as publication proof.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **55/55 PASS** on this agent. Includes the prior 48 ownership/cleanup/endpoint/C2/Cobra-root/Effect-root/Mailpit-observation/#564 C1 cases plus rewrite, reject, exec/PATH, provenance, composed-start, unknown-cleanup and missing-shim regressions.

`node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Verdict `BLOCKED_ENVIRONMENT`, `fullLocalExecution=false`, `dockerUsable=false`, `cliVerified=false`, exit 2. Receipt `aaclr1-20260926T114704Z`. Official binaries/Docker/real stack/user's Mac/Playwright: **NOT RUN**.

## Residual risks

- P0/P2: the next authorized real Mac run is still required to prove live Mailpit `8025/tcp -> 54324` now binds `HostIp=127.0.0.1` after the shim and still PASSes #564 inspection
- P2: if Docker Desktop still publishes an extra IPv6 `::` / `[::]` mapping beside the rewritten IPv4 loopback, #564 continues to fail closed. That is intentional, not a hidden PASS
- P2: this shim rewrites `docker create` only. A later CLI lifecycle that uses `docker run -p` is out of this slice and must fail closed at runtime inspection until a dedicated follow-up
- P3: helper doubles cannot prove every live Docker Desktop create argv beyond the pinned v2.117 forms (`-p VALUE`, `--publish VALUE`)

## Proactive note (out of scope)

Do not disable Mailpit to hide the public bind. Do not change Docker Desktop's default bind address as a substitute for this run-owned shim. If a later authorized Mac rerun still shows `0.0.0.0` after this shim, capture the exact `docker create` argv the official CLI emitted; only then consider a dedicated follow-up. Do not add that live inspect dump here.

Traveller-context intelligence is not relevant to this local Docker publication slice.

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, real-Mac acceptance, or full local execution.
